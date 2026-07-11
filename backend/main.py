from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import datetime

app = FastAPI(title="Karpagam Traders - Advanced Corporate Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# தற்காலிக டேட்டாபேஸ் (Lists)
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
    },
    {
        "name": "Abinesh K",
        "phone": "+91 9443210987",
        "email": "abi@gmail.com",
        "service": "Wedding Cards",
        "message": "Need elegant wedding card design template with traditional look.",
        "date": "2026-07-08 11:05:40"
    }
]

# User Activity Login/Signup History
user_history_db = [
    {
        "user_name": "admin023@gmail.com",
        "action": "Login",
        "timestamp": "2026-07-10 21:55:00",
        "status": "Success"
    },
    {
        "user_name": "mohan@gmail.com",
        "action": "Signup",
        "timestamp": "2026-07-10 18:22:10",
        "status": "Success"
    },
    {
        "user_name": "unknown_user",
        "action": "Login",
        "timestamp": "2026-07-10 15:40:02",
        "status": "Failed"
    },
    {
        "user_name": "siva@gmail.com",
        "action": "Logout",
        "timestamp": "2026-07-10 12:10:45",
        "status": "Success"
    },
    {
        "user_name": "abi@gmail.com",
        "action": "Login",
        "timestamp": "2026-07-10 09:15:30",
        "status": "Success"
    }
]

# Overall System Logs Activity History
system_logs_db = [
    {
        "activity": "Admin logged in successfully",
        "user": "admin023@gmail.com",
        "timestamp": "2026-07-10 21:55:02",
        "type": "info"
    },
    {
        "activity": "New order request placed by Mohan Raj",
        "user": "Mohan Raj",
        "timestamp": "2026-07-10 10:30:15",
        "type": "success"
    },
    {
        "activity": "Failed login attempt detected",
        "user": "System Gateway",
        "timestamp": "2026-07-10 15:40:02",
        "type": "warning"
    },
    {
        "activity": "Admin updated pricing table details",
        "user": "admin023@gmail.com",
        "timestamp": "2026-07-09 17:50:12",
        "type": "update"
    },
    {
        "activity": "New user registered account",
        "user": "mohan@gmail.com",
        "timestamp": "2026-07-10 18:22:10",
        "type": "success"
    }
]

class OrderRequest(BaseModel):
    name: str
    phone: str
    email: str = None
    service: str
    message: str

@app.post("/order")
async def create_order(order: OrderRequest):
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_inquiry = {
        "name": order.name,
        "phone": order.phone,
        "email": order.email,
        "service": order.service,
        "message": order.message,
        "date": current_time
    }
    orders_db.insert(0, new_inquiry)
    
    # Also log this activity
    system_logs_db.insert(0, {
        "activity": f"New order request placed by {order.name}",
        "user": order.name,
        "timestamp": current_time,
        "type": "success"
    })
    
    return {"status": "success", "message": "Message received!"}

# Fallback path mapping for legacy orders endpoint
@app.get("/orders")
async def get_orders():
    return orders_db

# New multi-tab endpoints
@app.get("/api/stats")
async def get_stats():
    return {
        "total_messages": len(orders_db),
        "total_history": len(user_history_db),
        "total_logs": len(system_logs_db)
    }

@app.get("/api/messages")
async def get_messages():
    return orders_db

@app.get("/api/user-history")
async def get_user_history():
    return user_history_db

@app.get("/api/logs")
async def get_logs():
    return system_logs_db

@app.delete("/api/messages/{index}")
async def delete_message(index: int):
    if 0 <= index < len(orders_db):
        removed = orders_db.pop(index)
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        system_logs_db.insert(0, {
            "activity": f"Deleted customer inquiry from {removed['name']}",
            "user": "admin023@gmail.com",
            "timestamp": current_time,
            "type": "warning"
        })
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

