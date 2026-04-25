import os
import sys

# PATCH REPORTS.PY
reports_path = 'app/routers/reports.py'
with open(reports_path, 'r', encoding='utf-8') as f:
    reports_code = f.read()

old_try_block = """    from app.routers.instagram import collect_active_stories
    try:
        await collect_active_stories(client_id, current, db)
    except Exception as e:
        import logging
        logging.error(f"Failed to collect stories: {e}")"""

new_try_block = """    from app.routers.instagram import collect_active_stories, collect_audience_archive, collect_media_archive
    try:
        await collect_active_stories(client_id, current, db)
        await collect_audience_archive(client_id, current, db)
        await collect_media_archive(client_id, current, db)
    except Exception as e:
        import logging
        logging.error(f"Failed to collect archives: {e}")"""

reports_code = reports_code.replace(old_try_block, new_try_block)
with open(reports_path, 'w', encoding='utf-8') as f:
    f.write(reports_code)


# PATCH INSTAGRAM.PY
insta_path = 'app/routers/instagram.py'
with open(insta_path, 'r', encoding='utf-8') as f:
    insta_code = f.read()

new_functions = """
async def collect_audience_archive(client_id: int, current: User, db: Session):
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/insights"
    params = {"metric": "audience_gender_age,audience_city", "period": "lifetime", "access_token": token}
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code == 200:
            import json
            from datetime import date
            from app.models import AudienceArchive
            data = r.json().get("data", [])
            age_gender = next((m["values"][0]["value"] for m in data if m["name"] == "audience_gender_age" and m.get("values")), None)
            city = next((m["values"][0]["value"] for m in data if m["name"] == "audience_city" and m.get("values")), None)
            
            exists = db.query(AudienceArchive).filter(
                AudienceArchive.client_id == client_id, AudienceArchive.snapshot_date == date.today()
            ).first()
            if exists:
                exists.gender_age_json = json.dumps(age_gender) if age_gender else None
                exists.city_json = json.dumps(city) if city else None
            else:
                db.add(AudienceArchive(
                    client_id=client_id, snapshot_date=date.today(),
                    gender_age_json=json.dumps(age_gender) if age_gender else None,
                    city_json=json.dumps(city) if city else None
                ))
            db.commit()

async def collect_media_archive(client_id: int, current: User, db: Session):
    import asyncio
    ig_id, token = get_client_creds(client_id, current, db)
    url = f"{META_BASE_URL}/{ig_id}/media"
    params = {
        "fields": "id,caption,media_type,thumbnail_url,permalink,timestamp,like_count,comments_count",
        "limit": 50, # Archive recent 50 posts every day
        "access_token": token,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, params=params)
        if r.status_code != 200: return
        items = r.json().get("data", [])
        
        async def fetch_insights_and_save(item):
            media_id = item["id"]
            metric = "reach,saved,impressions" 
            if item.get("media_type") == "VIDEO":
                metric = "reach,saved,shares,plays"
                
            resp = await client.get(f"{META_BASE_URL}/{media_id}/insights", params={"metric": metric, "access_token": token})
            if resp.status_code == 200:
                insights_data = resp.json().get("data", [])
                insights_dict = {i["name"]: i["values"][0]["value"] for i in insights_data if i.get("values")}
            else:
                insights_dict = {}
                
            from datetime import date
            from dateutil import parser
            from app.models import MediaArchive
            
            exists = db.query(MediaArchive).filter(
                MediaArchive.client_id == client_id, MediaArchive.media_id == media_id, MediaArchive.snapshot_date == date.today()
            ).first()
            
            ts = parser.parse(item.get("timestamp")) if item.get("timestamp") else None
            if exists:
                exists.like_count = item.get("like_count", 0)
                exists.comments_count = item.get("comments_count", 0)
                exists.reach = insights_dict.get("reach", 0)
                exists.impressions = insights_dict.get("impressions", 0)
                exists.saved = insights_dict.get("saved", 0)
                exists.shares = insights_dict.get("shares", 0)
                exists.plays = insights_dict.get("plays", 0)
            else:
                db.add(MediaArchive(
                    client_id=client_id, media_id=media_id, snapshot_date=date.today(),
                    caption=item.get("caption"), media_type=item.get("media_type"),
                    permalink=item.get("permalink"), thumbnail_url=item.get("thumbnail_url"), timestamp=ts,
                    like_count=item.get("like_count", 0), comments_count=item.get("comments_count", 0),
                    reach=insights_dict.get("reach", 0), impressions=insights_dict.get("impressions", 0),
                    saved=insights_dict.get("saved", 0), shares=insights_dict.get("shares", 0), plays=insights_dict.get("plays", 0)
                ))
                
        await asyncio.gather(*[fetch_insights_and_save(i) for i in items])
        db.commit()

"""

# Append new_functions to the end of instagram.py
insta_code += new_functions
with open(insta_path, 'w', encoding='utf-8') as f:
    f.write(insta_code)

print("Backend patched successfully for Data Collection")
