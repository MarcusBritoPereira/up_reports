import os

insta_path = 'app/routers/instagram.py'
with open(insta_path, 'r', encoding='utf-8') as f:
    insta_code = f.read()

# We need to rewrite get_media completely to implement delta calculation.
# First, let's find the current get_media block
start_idx = insta_code.find('@router.get("/media")')
end_idx = insta_code.find('@router.get("/stories/history")', start_idx)

if start_idx != -1 and end_idx != -1:
    old_get_media = insta_code[start_idx:end_idx]
    
    new_get_media = """@router.get("/media")
async def get_media(
    client_id: int | None = None,
    days: int = 30,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ig_id, token = get_client_creds(client_id, current, db)
    
    # 1. Fetch live data
    url = f"{META_BASE_URL}/{ig_id}/media"
    params = {
        "fields": "id,caption,media_type,thumbnail_url,permalink,timestamp,like_count,comments_count",
        "limit": 100,
        "access_token": token,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.json())
            
        data = r.json()
        all_items = data.get("data", [])
        
        # 2. Fetch past archive for delta calculation
        from datetime import date, timedelta
        from app.models import MediaArchive
        past_date = date.today() - timedelta(days=days)
        
        # We try to find the exact past date, or the oldest date within the window
        past_archives = db.query(MediaArchive).filter(
            MediaArchive.client_id == client_id,
            MediaArchive.snapshot_date >= past_date
        ).order_by(MediaArchive.snapshot_date.asc()).all()
        
        # Group by media_id, keeping only the oldest record in the window
        past_map = {}
        for a in past_archives:
            if a.media_id not in past_map:
                past_map[a.media_id] = a
                
        async def fetch_insights_and_compute_delta(item):
            media_id = item["id"]
            metric = "reach,saved,impressions" 
            if item.get("media_type") == "VIDEO":
                metric = "reach,saved,shares,plays"
                
            insights_url = f"{META_BASE_URL}/{media_id}/insights"
            insights_params = {"metric": metric, "access_token": token}
            
            resp = await client.get(insights_url, params=insights_params)
            current_likes = item.get("like_count", 0)
            current_comments = item.get("comments_count", 0)
            current_reach = 0
            current_impressions = 0
            current_saved = 0
            current_shares = 0
            
            if resp.status_code == 200:
                insights_data = resp.json().get("data", [])
                insights_dict = {i["name"]: i["values"][0]["value"] for i in insights_data if i.get("values")}
                current_reach = insights_dict.get("reach", 0)
                current_impressions = insights_dict.get("impressions", 0)
                current_saved = insights_dict.get("saved", 0)
                current_shares = insights_dict.get("shares", 0)
                
            # If we have a past archive, compute growth in the period
            if media_id in past_map:
                past = past_map[media_id]
                # Ensure we don't go negative if API fluctuates
                item["like_count"] = max(0, current_likes - past.like_count)
                item["comments_count"] = max(0, current_comments - past.comments_count)
                item["insights"] = {
                    "reach": max(0, current_reach - past.reach),
                    "impressions": max(0, current_impressions - past.impressions),
                    "saved": max(0, current_saved - past.saved),
                    "shares": max(0, current_shares - past.shares),
                }
                item["is_delta"] = True
            else:
                # If no past archive (new post or just started archiving today), use current live stats
                item["like_count"] = current_likes
                item["comments_count"] = current_comments
                item["insights"] = {
                    "reach": current_reach,
                    "impressions": current_impressions,
                    "saved": current_saved,
                    "shares": current_shares,
                }
                item["is_delta"] = False
                
            return item
            
        import asyncio
        items_with_insights = await asyncio.gather(*[fetch_insights_and_compute_delta(i) for i in all_items])
        
        # Sort by total interactions in the period (like + comment + saved + share)
        items_with_insights.sort(key=lambda x: (
            x.get("like_count", 0) + 
            x.get("comments_count", 0) + 
            x.get("insights", {}).get("saved", 0) + 
            x.get("insights", {}).get("shares", 0)
        ), reverse=True)
        
        return {"data": items_with_insights}

"""
    insta_code = insta_code.replace(old_get_media, new_get_media)
    with open(insta_path, 'w', encoding='utf-8') as f:
        f.write(insta_code)
    print("Patched GET /media with deltas")
else:
    print("Could not find get_media block")
