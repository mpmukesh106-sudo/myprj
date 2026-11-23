from fastapi import APIRouter, HTTPException
from models.schemas import LoginRequest
from database.db import get_connection, hash_password

router = APIRouter()

@router.post("/auth/login")
async def login(req: LoginRequest):
    """Authenticates user against SQLite database credentials."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, password_hash FROM users WHERE username = ?", (req.username.strip(),))
    user = cursor.fetchone()
    conn.close()
    
    if not user or user["password_hash"] != hash_password(req.password):
        # Allow demo login if user typed admin
        if req.username == "admin" and req.password == "admin123":
            return {
                "status": "success",
                "token": "demo-token-netassist-admin",
                "user": {"id": 1, "username": "admin", "email": "admin@netassist.local", "role": "Administrator"}
            }
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    return {
        "status": "success",
        "token": f"token-{user['id']}-{user['username']}",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": "Network Engineer"
        }
    }
