from dotenv import load_dotenv
import os

load_dotenv()

META_PAGE_ID = os.getenv("META_PAGE_ID")
META_IG_ID = os.getenv("META_IG_ID")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")
META_BASE_URL = "https://graph.facebook.com/v21.0"