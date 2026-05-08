from sqlalchemy import create_engine, text
import os

# Use absolute path for sqlite
DB_PATH = "/Users/marcuspereira/up_reports/up_reports-metrics-dashboard/backend/dashboard.db"
engine = create_engine(f"sqlite:///{DB_PATH}")

columns = [
    "website_clicks",
    "phone_call_clicks",
    "email_contacts",
    "get_directions_clicks",
    "text_message_clicks"
]

with engine.connect() as conn:
    for col in columns:
        try:
            conn.execute(text(f"ALTER TABLE metric_snapshots ADD COLUMN {col} INTEGER DEFAULT 0"))
            print(f"Added {col} to metric_snapshots")
        except Exception as e:
            print(f"Column {col} already exists or error: {e}")
    conn.commit()
