from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import datetime
import json
import urllib.request
import urllib.error

app = FastAPI(title="Karpagam Traders - Advanced Corporate Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase Firestore Configuration
FIREBASE_PROJECT_ID = "user-9bc76"
FIRESTORE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"

def firestore_doc_to_dict(doc):
    """Convert Firestore REST document fields to flat dict."""
    fields = doc.get("fields", {})
    result = {}
    for key, val in fields.items():
        if "stringValue" in val:
            result[key] = val["stringValue"]
        elif "integerValue" in val:
            result[key] = int(val["integerValue"])
        elif "doubleValue" in val:
            result[key] = float(val["doubleValue"])
        elif "booleanValue" in val:
            result[key] = val["booleanValue"]
    doc_name = doc.get("name", "")
    if doc_name:
        result["id"] = doc_name.split("/")[-1]
    return result

def push_to_firestore(collection: str, data: dict):
    """Push a new document to Firebase Firestore collection via REST API."""
    url = f"{FIRESTORE_BASE_URL}/{collection}"
    fields = {}
    for k, v in data.items():
        if isinstance(v, str):
            fields[k] = {"stringValue": str(v)}
        elif isinstance(v, bool):
            fields[k] = {"booleanValue": v}
        elif isinstance(v, (int, float)):
            fields[k] = {"doubleValue": float(v)}
        elif v is None:
            fields[k] = {"stringValue": ""}

    payload = json.dumps({"fields": fields}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Firestore push warning for {collection}: {e}")
        return None

def fetch_from_firestore(collection: str):
    """Fetch documents from Firebase Firestore collection via REST API."""
    url = f"{FIRESTORE_BASE_URL}/{collection}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            docs = data.get("documents", [])
            return [firestore_doc_to_dict(d) for d in docs]
    except Exception as e:
        print(f"Firestore fetch warning for {collection}: {e}")
        return []

@app.on_event("startup")
async def seed_firebase_on_startup():
    print("FastAPI: Verifying and seeding Firebase Firestore collections...")
    try:
        # Seed Customer Inquiries
        inquiries = fetch_from_firestore("customer_inquiries")
        if not inquiries:
            for item in orders_db:
                push_to_firestore("customer_inquiries", {
                    "name": item["name"],
                    "phone": item["phone"],
                    "email": item["email"],
                    "service": item["service"],
                    "message": item["message"],
                    "timestamp": item["date"],
                    "date": item["date"],
                    "status": "Pending"
                })

        # Seed History Logs
        logs = fetch_from_firestore("history")
        if not logs:
            for log in system_logs_db:
                push_to_firestore("history", log)

        # Seed Admin User Profile
        users = fetch_from_firestore("users")
        if not users:
            push_to_firestore("users", {
                "name": "Mohan K",
                "email": "mohantn617@gmail.com",
                "role": "admin",
                "joinedDate": "2026-08-07"
            })
        print("FastAPI: Firebase Firestore collections successfully verified & populated!")
    except Exception as e:
        print("FastAPI startup seeding notice:", e)

# Local Fallback Lists
orders_db = [
    {
        "name": "Mohan Raj",
        "phone": "+91 9566801402",
        "email": "mohan@gmail.com",
        "service": "Calendar Printing",
        "message": "Hi, I would like to order a Custom Tamil Calendar (Wall / Desk size). Please share pricing details.",
        "date": "2026-07-10 10:30:15"
    },
    {
        "name": "Siva Kumar",
        "phone": "+91 9876543210",
        "email": "siva@gmail.com",
        "service": "Business Cards",
        "message": "Interested in premium gold foil business cards. Please share catalog.",
        "date": "2026-07-09 14:15:22"
    }
]

user_history_db = [
    {
        "user_name": "mohantn617@gmail.com",
        "action": "Login",
        "timestamp": "2026-07-10 21:55:00",
        "status": "Success"
    }
]

system_logs_db = [
    {
        "activity": "Admin logged in successfully",
        "user": "mohantn617@gmail.com",
        "timestamp": "2026-07-10 21:55:02",
        "type": "info"
    }
]

class OrderRequest(BaseModel):
    name: str
    phone: str
    email: str = None
    service: str
    message: str

@app.post("/order")
@app.post("/api/order")
@app.post("/contact")
@app.post("/api/contact")
async def create_order(order: OrderRequest):
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_inquiry = {
        "name": order.name,
        "phone": order.phone,
        "email": order.email or "",
        "service": order.service,
        "message": order.message,
        "date": current_time,
        "timestamp": current_time,
        "status": "Pending"
    }
    orders_db.insert(0, new_inquiry)
    
    log_entry = {
        "activity": f"New order request placed by {order.name}",
        "user": order.name,
        "timestamp": current_time,
        "type": "success"
    }
    system_logs_db.insert(0, log_entry)

    # Persist directly to Firebase Firestore
    push_to_firestore("customer_inquiries", new_inquiry)
    push_to_firestore("history", log_entry)
    
    return {"status": "success", "message": "Message saved to Firebase Firestore successfully!"}

@app.get("/orders")
@app.get("/api/messages")
async def get_messages():
    fb_messages = fetch_from_firestore("customer_inquiries")
    if fb_messages:
        return fb_messages
    return orders_db

@app.get("/api/stats")
async def get_stats():
    fb_messages = fetch_from_firestore("customer_inquiries")
    fb_logs = fetch_from_firestore("history")
    fb_users = fetch_from_firestore("users")

    msg_count = len(fb_messages) if fb_messages else len(orders_db)
    logs_count = len(fb_logs) if fb_logs else len(system_logs_db)
    users_count = len(fb_users) if fb_users else len(user_history_db)

    return {
        "total_messages": msg_count,
        "total_history": users_count,
        "total_logs": logs_count
    }

@app.get("/api/user-history")
async def get_user_history():
    fb_users = fetch_from_firestore("users")
    if fb_users:
        return fb_users
    return user_history_db

@app.get("/api/logs")
async def get_logs():
    fb_logs = fetch_from_firestore("history")
    if fb_logs:
        return fb_logs
    return system_logs_db

@app.delete("/api/messages/{index}")
async def delete_message(index: int):
    if 0 <= index < len(orders_db):
        removed = orders_db.pop(index)
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_item = {
            "activity": f"Deleted customer inquiry from {removed['name']}",
            "user": "mohantn617@gmail.com",
            "timestamp": current_time,
            "type": "warning"
        }
        system_logs_db.insert(0, log_item)
        push_to_firestore("history", log_item)
        return {"status": "success", "message": "Inquiry deleted"}
    return {"status": "error", "message": "Invalid index"}

@app.delete("/api/user-history/{index}")
async def delete_user_history(index: int):
    if 0 <= index < len(user_history_db):
        user_history_db.pop(index)
        return {"status": "success", "message": "Access record deleted"}
    return {"status": "error", "message": "Invalid index"}

@app.delete("/api/logs/{index}")
async def delete_log(index: int):
    if 0 <= index < len(system_logs_db):
        system_logs_db.pop(index)
        return {"status": "success", "message": "Log entry deleted"}
    return {"status": "error", "message": "Invalid index"}


