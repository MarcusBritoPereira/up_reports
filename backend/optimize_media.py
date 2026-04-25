import os

insta_path = 'app/routers/instagram.py'
with open(insta_path, 'r', encoding='utf-8') as f:
    insta_code = f.read()

# 1. Update collect_media_archive to avoid "plays" and handle errors better
old_collect = """            resp = await client.get(f"{META_BASE_URL}/{media_id}/insights", params={"metric": metric, "access_token": token})
            if resp.status_code == 200:
                insights_data = resp.json().get("data", [])
                insights_dict = {i["name"]: i["values"][0]["value"] for i in insights_data if i.get("values")}
            else:
                insights_dict = {}"""

new_collect = """            # Use a safer metric list to avoid 400 errors from deprecated/unsupported metrics
            safe_metric = "reach,saved,impressions"
            if item.get("media_type") == "VIDEO":
                safe_metric = "reach,saved,shares" # Removed "plays" as it causes 400 on newer API versions
            
            resp = await client.get(f"{META_BASE_URL}/{media_id}/insights", params={"metric": safe_metric, "access_token": token})
            insights_dict = {}
            if resp.status_code == 200:
                insights_data = resp.json().get("data", [])
                insights_dict = {i["name"]: i["values"][0]["value"] for i in insights_data if i.get("values")}"""

insta_code = insta_code.replace(old_collect, new_collect)

# 2. Update get_media to use database as primary source of truth (MUCH FASTER)
# This replaces the logic that was hitting Meta API for every post
old_get_media_logic = """    # 1. Fetch live data
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
        items_with_insights = await asyncio.gather(*[fetch_insights_and_compute_delta(i) for i in all_items])"""

new_get_media_logic = """    from datetime import date, timedelta
    from app.models import MediaArchive
    
    # 1. Try to get the latest snapshot from DB to avoid hitting Meta API for every post
    today_snapshots = db.query(MediaArchive).filter(
        MediaArchive.client_id == client_id,
        MediaArchive.snapshot_date == date.today()
    ).all()
    
    # If we have no snapshots today, we fetch them once (this happens only if snapshots/collect failed or hasn't run)
    if not today_snapshots:
        # Fallback to live fetch (one call for IDs, but we still need insights for the new delta logic)
        # To keep it simple and fast, we just return empty or run a quick collection
        await collect_media_archive(client_id, current, db)
        today_snapshots = db.query(MediaArchive).filter(
            MediaArchive.client_id == client_id,
            MediaArchive.snapshot_date == date.today()
        ).all()

    # 2. Fetch past archive for delta calculation
    past_date = date.today() - timedelta(days=days)
    past_archives = db.query(MediaArchive).filter(
        MediaArchive.client_id == client_id,
        MediaArchive.snapshot_date >= past_date
    ).order_by(MediaArchive.snapshot_date.asc()).all()
    
    # Map media by ID
    today_map = {a.media_id: a for a in today_snapshots}
    past_map = {}
    for a in past_archives:
        if a.media_id not in past_map:
            past_map[a.media_id] = a

    items_with_insights = []
    for m_id, today in today_map.items():
        item = {
            "id": today.media_id,
            "caption": today.caption,
            "media_type": today.media_type,
            "permalink": today.permalink,
            "thumbnail_url": today.thumbnail_url,
            "timestamp": today.timestamp.isoformat() if today.timestamp else None,
        }
        
        if m_id in past_map:
            past = past_map[m_id]
            item["like_count"] = max(0, today.like_count - past.like_count)
            item["comments_count"] = max(0, today.comments_count - past.comments_count)
            item["insights"] = {
                "reach": max(0, today.reach - past.reach),
                "impressions": max(0, today.impressions - past.impressions),
                "saved": max(0, today.saved - past.saved),
                "shares": max(0, today.shares - past.shares),
            }
            item["is_delta"] = True
        else:
            item["like_count"] = today.like_count
            item["comments_count"] = today.comments_count
            item["insights"] = {
                "reach": today.reach,
                "impressions": today.impressions,
                "saved": today.saved,
                "shares": today.shares,
            }
            item["is_delta"] = False
        
        items_with_insights.append(item)"""

insta_code = insta_code.replace(old_get_media_logic, new_get_media_logic)

with open(insta_path, 'w', encoding='utf-8') as f:
    f.write(insta_code)

print("Backend optimized for performance and robustness")
