from app.database import engine
from sqlalchemy import text

columns = [
    "website_clicks",
    "phone_call_clicks",
    "email_contacts",
    "get_directions_clicks",
    "text_message_clicks"
]

def run_migration():
    with engine.connect() as conn:
        for col in columns:
            try:
                conn.execute(text(f"ALTER TABLE metric_snapshots ADD COLUMN {col} INTEGER DEFAULT 0"))
                print(f"Added {col} to metric_snapshots")
            except Exception as e:
                print(f"Column {col} already exists or error: {e}")
        conn.commit()

if __name__ == "__main__":
    run_migration()
