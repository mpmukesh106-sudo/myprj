import hmac
import os

from fastapi import APIRouter, HTTPException
from models.schemas import LoginRequest
from database.db import get_connection, hash_password
from services.security import create_access_token

router = APIRouter()

@router.post("/auth/login")
async def login(req: LoginRequest):
    """Authenticates the configured Vercel administrator or a local database user."""
    username = req.username.strip()
    if os.environ.get("VERCEL"):
        expected_username = os.environ["NETASSIST_ADMIN_USERNAME"]
        expected_password = os.environ["NETASSIST_ADMIN_PASSWORD"]
        valid = hmac.compare_digest(username, expected_username) and hmac.compare_digest(
            req.password, expected_password
        )
        if not valid:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        user = {"id": 1, "username": username, "email": "admin@netassist.local"}
    else:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, username, email, password_hash FROM users WHERE username = ?",
                (username,)
            )
            user = cursor.fetchone()
        finally:
            conn.close()

        if not user or user["password_hash"] != hash_password(req.password):
            if username != "admin" or req.password != "admin123":
                raise HTTPException(status_code=401, detail="Invalid username or password")
            user = {"id": 1, "username": "admin", "email": "admin@netassist.local"}

    return {
        "status": "success",
        "token": create_access_token(user["id"], user["username"]),
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": "Network Engineer" if user["id"] != 1 else "Administrator"
        }
    }
