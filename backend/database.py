import sqlite3
import json
import os
import hashlib

DB_DIR = os.path.join(os.path.dirname(__file__), 'data')
DB_PATH = os.path.join(DB_DIR, 'face_sec.db')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    """Initializes the SQLite database and creates the users table if it doesn't exist."""
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # We drop the old users table if it doesn't have the new fields, to ensure a clean migration
    try:
        cursor.execute("SELECT name FROM users LIMIT 1")
    except sqlite3.OperationalError:
        # Table doesn't exist or is old schema
        cursor.execute("DROP TABLE IF EXISTS users")
        
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            company TEXT,
            role TEXT,
            password_hash TEXT NOT NULL,
            descriptor TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def register_user(email, name, phone, company, role, password, descriptor_list=None):
    """Registers a new user in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    descriptor_str = json.dumps(descriptor_list) if descriptor_list else None
    pwd_hash = hash_password(password)
    
    try:
        cursor.execute(
            """INSERT INTO users (email, name, phone, company, role, password_hash, descriptor) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (email.strip().lower(), name.strip(), phone.strip(), company.strip(), role.strip(), pwd_hash, descriptor_str)
        )
        conn.commit()
        success = True
    except sqlite3.IntegrityError as e:
        print(f"Registration integrity error: {e}")
        success = False
    finally:
        conn.close()
        
    return success

def get_all_users():
    """Fetches all registered users."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT email, name, phone, company, role, password_hash, descriptor, created_at FROM users")
    rows = cursor.fetchall()
    conn.close()
    
    users = []
    for row in rows:
        users.append({
            "email": row["email"],
            "name": row["name"],
            "phone": row["phone"],
            "company": row["company"],
            "role": row["role"],
            "password_hash": row["password_hash"],
            "descriptor": json.loads(row["descriptor"]) if row["descriptor"] else None,
            "created_at": row["created_at"]
        })
    return users

def get_user(email):
    """Fetches a specific user by email."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT email, name, phone, company, role, password_hash, descriptor, created_at FROM users WHERE lower(email) = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "email": row["email"],
            "name": row["name"],
            "phone": row["phone"],
            "company": row["company"],
            "role": row["role"],
            "password_hash": row["password_hash"],
            "descriptor": json.loads(row["descriptor"]) if row["descriptor"] else None,
            "created_at": row["created_at"]
        }
    return None
