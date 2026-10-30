import os
import sqlite3
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def get_connection():
    """Returns a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create all SQLite tables and seed initial offline data if empty."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Admins table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL
        )
    """)

    # 2. Inquiries and Orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT DEFAULT '',
            service TEXT NOT NULL,
            message TEXT NOT NULL,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            total_amount REAL DEFAULT 0.0,
            synced_to_cloud INTEGER DEFAULT 0
        )
    """)

    # 3. History and System Logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity TEXT NOT NULL,
            user TEXT DEFAULT 'guest',
            timestamp TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            event TEXT DEFAULT ''
        )
    """)

    # 4. App Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'customer',
            joinedDate TEXT NOT NULL
        )
    """)

    # 5. Notifications & Daily News table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'Daily News',
            image TEXT DEFAULT '',
            is_pinned INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            date TEXT NOT NULL
        )
    """)

    conn.commit()

    # Seed Admin User if not exists
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "KarpagamAdmin2026!")
    cursor.execute("SELECT id FROM admins WHERE username = ?", (admin_user,))
    if not cursor.fetchone():
        try:
            from security import get_password_hash
            hashed = get_password_hash(admin_pass)
        except Exception:
            import hashlib
            hashed = hashlib.sha256(admin_pass.encode()).hexdigest()
        cursor.execute("INSERT INTO admins (username, hashed_password) VALUES (?, ?)", (admin_user, hashed))
        print(f"FastAPI: Seeded default admin '{admin_user}'")

    # Seed initial inquiries if empty
    cursor.execute("SELECT COUNT(*) FROM customer_inquiries")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO customer_inquiries (name, phone, email, service, message, date, timestamp, status, total_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("Mohan Raj", "+91 9566801402", "mohan@gmail.com", "Calendar Printing", "Custom 2027 Tamil Daily & Monthly Calendar quote inquiry.", "2026-07-10 10:30:15", "2026-07-10 10:30:15", "Pending", 0.0),
            ("Siva Kumar", "+91 9876543210", "siva@gmail.com", "Business Cards", "Interested in premium gold foil business cards.", "2026-07-09 14:15:22", "2026-07-09 14:15:22", "Pending", 0.0)
        ])

    # Seed initial logs if empty
    cursor.execute("SELECT COUNT(*) FROM history_logs")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO history_logs (activity, user, timestamp, type, event)
            VALUES (?, ?, ?, ?, ?)
        """, [
            ("Admin logged in successfully", "mohantn617@gmail.com", "2026-07-10 21:55:02", "info", "Admin Login"),
            ("Local offline SQLite database initialized", "system", "2026-07-10 21:56:00", "success", "System Startup")
        ])

    # Seed initial users if empty
    cursor.execute("SELECT COUNT(*) FROM app_users")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO app_users (name, email, role, joinedDate)
            VALUES (?, ?, ?, ?)
        """, [
            ("Mohan K", "mohantn617@gmail.com", "admin", "2026-08-07"),
            ("Siva Kumar", "siva@example.com", "customer", "2026-08-08")
        ])

    conn.commit()
    conn.close()
    print("FastAPI: Local SQLite database initialized successfully (database.db).")

# CRUD Operations for Inquiries
def insert_inquiry(name: str, phone: str, email: str, service: str, message: str, date_str: str, status: str = "Pending", total_amount: float = 0.0):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO customer_inquiries (name, phone, email, service, message, date, timestamp, status, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (name, phone, email or "", service, message, date_str, date_str, status, total_amount))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def get_inquiries():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_inquiries ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_inquiry_by_id(item_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customer_inquiries WHERE id = ?", (item_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# CRUD Operations for History Logs
def insert_log(activity: str, user: str, timestamp_str: str, log_type: str = "info", event: str = ""):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO history_logs (activity, user, timestamp, type, event)
        VALUES (?, ?, ?, ?, ?)
    """, (activity, user, timestamp_str, log_type, event))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def get_logs_list():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history_logs ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_log_by_id(item_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM history_logs WHERE id = ?", (item_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# CRUD Operations for App Users
def get_users_list():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM app_users ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_user_by_id(item_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM app_users WHERE id = ?", (item_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_counts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM customer_inquiries")
    msgs = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM history_logs")
    logs = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM app_users")
    users = cursor.fetchone()[0]
    conn.close()
    return {"total_messages": msgs, "total_logs": logs, "total_history": users}

def get_admin(username: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admins WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# CRUD Operations for Notifications
def insert_notification(title: str, content: str, category: str = "Daily News", image: str = "", is_pinned: bool = False, is_active: bool = True, date_str: str = ""):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notifications (title, content, category, image, is_pinned, is_active, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (title, content, category, image, 1 if is_pinned else 0, 1 if is_active else 0, date_str))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id


def get_notifications(only_active: bool = False):
    conn = get_connection()
    cursor = conn.cursor()
    if only_active:
        cursor.execute("SELECT * FROM notifications WHERE is_active = 1 ORDER BY is_pinned DESC, id DESC")
    else:
        cursor.execute("SELECT * FROM notifications ORDER BY is_pinned DESC, id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "content": r["content"],
            "category": r["category"],
            "image": r["image"],
            "is_pinned": bool(r["is_pinned"]),
            "is_active": bool(r["is_active"]),
            "date": r["date"]
        }
        for r in rows
    ]


def delete_notification_by_id(item_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notifications WHERE id = ?", (item_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

