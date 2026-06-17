import sqlite3
import os

# Dynamic database path relative to backend folder
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(base_dir, "data", "face_sec.db")

print(f"Connecting to database at: {db_path}")

try:
    if not os.path.exists(db_path):
        print("Database file does not exist yet. Run the backend server to initialize it.")
    else:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if not cursor.fetchone():
            print("Table 'users' does not exist yet. Nothing to clear.")
        else:
            cursor.execute("DELETE FROM users;")
            conn.commit()
            print("All users cleared successfully from database.")
        conn.close()
except Exception as e:
    print("Error clearing database:", e)
