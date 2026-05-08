from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE clients ADD COLUMN profile_picture_url VARCHAR;'))
            print("Added profile_picture_url to clients")
        except Exception as e:
            print(f"Error adding profile_picture_url: {e}")
            
        try:
            conn.execute(text('''
                CREATE TABLE report_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    client_id INTEGER NOT NULL, 
                    user_id INTEGER NOT NULL, 
                    report_type VARCHAR NOT NULL, 
                    period_days INTEGER NOT NULL, 
                    objective VARCHAR, 
                    ad_account_id VARCHAR, 
                    campaign_ids TEXT, 
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
                    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE, 
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            '''))
            print("Created report_history table")
        except Exception as e:
            print(f"Error creating report_history: {e}")
        
        conn.commit()

if __name__ == "__main__":
    run_migration()
