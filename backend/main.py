from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import datetime
import json
import urllib.request
import urllib.error

import database
from models import OrderRequest, ContactFormSubmit, AdminLogin, TokenResponse
from security import verify_password, create_access_token

app = FastAPI(
    title="Karpagam Traders - Offline-First Production API",
    description="Full offline SQLite persistence with asynchronous cloud synchronization."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional Firebase Firestore Configuration for Cloud Sync
FIREBASE_PROJECT_ID = "user-9bc76"
FIRESTORE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"


def push_to_firestore_background(collection: str, data: dict):
    """Attempt background cloud sync without blocking user or failing offline requests."""
    try:
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
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        # Offline or cloud unreachable: safely ignore; data is preserved locally in SQLite
        pass


@app.on_event("startup")
def on_startup():
    print("FastAPI: Initializing local SQLite database for offline operations...")
    database.init_db()
    print("FastAPI: Offline database ready. Server listening for requests.")


# ==========================================
# Health & Status Endpoints
# ==========================================

@app.get("/")
@app.get("/api/health")
def health_check():
    counts = database.get_counts()
    return {
        "status": "online",
        "mode": "offline-first-sqlite",
        "inquiries_stored": counts["total_messages"],
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ==========================================
# Authentication (Works 100% Offline)
# ==========================================

@app.post("/api/login", response_model=TokenResponse)
def admin_login(creds: AdminLogin):
    admin = database.get_admin(creds.username)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Check password via bcrypt or fallback SHA256
    try:
        pw_valid = verify_password(creds.password, admin["hashed_password"])
    except Exception:
        import hashlib
        pw_valid = hashlib.sha256(creds.password.encode()).hexdigest() == admin["hashed_password"]

    if not pw_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(data={"sub": admin["username"]})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# Customer Orders & Inquiries (Offline Persist)
# ==========================================

@app.post("/order")
@app.post("/api/order")
@app.post("/contact")
@app.post("/api/contact")
def create_order(order: OrderRequest, background_tasks: BackgroundTasks):
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Save directly to SQLite (Instant & 100% Offline)
    new_id = database.insert_inquiry(
        name=order.name,
        phone=order.phone,
        email=order.email or "",
        service=order.service,
        message=order.message,
        date_str=current_time,
        status=order.status or "Pending",
        total_amount=order.total_amount or 0.0
    )

    database.insert_log(
        activity=f"New inquiry/order received from {order.name} ({order.service})",
        user=order.name,
        timestamp_str=current_time,
        log_type="success",
        event="Order Placed"
    )

    # 2. Attempt asynchronous cloud sync in background (non-blocking)
    cloud_payload = {
        "name": order.name,
        "phone": order.phone,
        "email": order.email or "",
        "service": order.service,
        "message": order.message,
        "timestamp": current_time,
        "date": current_time,
        "status": order.status or "Pending",
        "totalAmount": order.total_amount or 0.0
    }
    background_tasks.add_task(push_to_firestore_background, "customer_inquiries", cloud_payload)
    background_tasks.add_task(push_to_firestore_background, "history", {
        "activity": f"New inquiry from {order.name}",
        "user": order.name,
        "timestamp": current_time,
        "type": "success"
    })

    return {
        "status": "success",
        "message": "Order saved successfully (offline SQLite storage)",
        "id": new_id,
        "date": current_time
    }


@app.post("/api/sync")
def sync_offline_inquiries(inquiries: list[OrderRequest], background_tasks: BackgroundTasks):
    """Bulk sync inquiries that were queued on client-side while offline."""
    saved_count = 0
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for item in inquiries:
        database.insert_inquiry(
            name=item.name,
            phone=item.phone,
            email=item.email or "",
            service=item.service,
            message=item.message,
            date_str=current_time,
            status=item.status or "Synced from Offline Queue",
            total_amount=item.total_amount or 0.0
        )
        saved_count += 1

    if saved_count > 0:
        database.insert_log(
            activity=f"Synchronized {saved_count} offline orders to local database",
            user="offline_sync",
            timestamp_str=current_time,
            log_type="info",
            event="Offline Sync"
        )

    return {
        "status": "success",
        "synced_count": saved_count,
        "message": f"Successfully synchronized {saved_count} offline inquiries!"
    }


@app.get("/orders")
@app.get("/api/messages")
def get_messages():
    records = database.get_inquiries()
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "phone": r["phone"],
            "email": r["email"],
            "service": r["service"],
            "message": r["message"],
            "date": r["date"],
            "timestamp": r["timestamp"],
            "status": r["status"],
            "totalAmount": r["total_amount"]
        }
        for r in records
    ]


@app.get("/api/stats")
def get_stats():
    return database.get_counts()


@app.get("/api/user-history")
def get_user_history():
    records = database.get_users_list()
    return [
        {
            "id": str(u["id"]),
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "joinedDate": u["joinedDate"]
        }
        for u in records
    ]


@app.get("/api/logs")
def get_logs():
    records = database.get_logs_list()
    return [
        {
            "id": str(l["id"]),
            "activity": l["activity"],
            "user": l["user"],
            "timestamp": l["timestamp"],
            "type": l["type"],
            "event": l["event"]
        }
        for l in records
    ]


@app.delete("/api/messages/{inquiry_id}")
def delete_message(inquiry_id: str):
    try:
        record_id = int(inquiry_id)
        success = database.delete_inquiry_by_id(record_id)
    except ValueError:
        all_inq = database.get_inquiries()
        idx = int(inquiry_id)
        if 0 <= idx < len(all_inq):
            success = database.delete_inquiry_by_id(all_inq[idx]["id"])
        else:
            success = False

    if success:
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        database.insert_log(
            activity=f"Deleted customer inquiry ID {inquiry_id}",
            user="admin",
            timestamp_str=current_time,
            log_type="warning",
            event="Delete Inquiry"
        )
        return {"status": "success", "message": "Inquiry deleted"}
    return {"status": "error", "message": "Record not found"}


@app.delete("/api/user-history/{user_id}")
def delete_user_history(user_id: str):
    try:
        record_id = int(user_id)
        success = database.delete_user_by_id(record_id)
    except ValueError:
        all_u = database.get_users_list()
        idx = int(user_id)
        if 0 <= idx < len(all_u):
            success = database.delete_user_by_id(all_u[idx]["id"])
        else:
            success = False

    if success:
        return {"status": "success", "message": "User deleted"}
    return {"status": "error", "message": "User not found"}


@app.delete("/api/logs/{log_id}")
def delete_log(log_id: str):
    try:
        record_id = int(log_id)
        success = database.delete_log_by_id(record_id)
    except ValueError:
        all_l = database.get_logs_list()
        idx = int(log_id)
        if 0 <= idx < len(all_l):
            success = database.delete_log_by_id(all_l[idx]["id"])
        else:
            success = False

    if success:
        return {"status": "success", "message": "Log entry deleted"}
    return {"status": "error", "message": "Log not found"}
