"""
NetAssist – Network Troubleshooting & Automated Diagnostic Assistant
Main Backend Application (FastAPI + SQLite + Networking + FLAT DFA + Static Frontend)
"""

import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from database.db import init_db
from services.security import verify_access_token
from routes import (
    dashboard_router,
    network_router,
    diagnosis_router,
    automata_router,
    history_router,
    reports_router,
    auth_router
)

app = FastAPI(
    title="NetAssist API & Full Stack Platform",
    description="Network Troubleshooting and Automated Diagnostic Assistant integrating CN, FLAT, and FSWD.",
    version="2.0.0"
)

# Enable CORS for full stack interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initialization on startup
@app.on_event("startup")
def on_startup():
    if os.environ.get("VERCEL"):
        required_settings = (
            "DATABASE_URL",
            "NETASSIST_ADMIN_USERNAME",
            "NETASSIST_ADMIN_PASSWORD",
            "NETASSIST_AUTH_SECRET",
        )
        missing_settings = [
            name for name in required_settings
            if not os.environ.get(name) and not (name == "DATABASE_URL" and os.environ.get("POSTGRES_URL"))
        ]
        if missing_settings:
            raise RuntimeError(f"Missing required Vercel environment variables: {', '.join(missing_settings)}")
    init_db()

@app.middleware("http")
async def require_api_auth(request, call_next):
    path = request.url.path
    auth_required = os.environ.get("VERCEL") or os.environ.get("NETASSIST_REQUIRE_AUTH")
    if auth_required and path.startswith("/api/") and path not in {"/api/health", "/api/auth/login"}:
        authorization = request.headers.get("authorization", "")
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token or not verify_access_token(token):
            return JSONResponse(status_code=401, content={"detail": "Authentication required"})
    return await call_next(request)

# Mount all REST API modules
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(network_router, prefix="/api", tags=["Network Diagnostics (CN)"])
app.include_router(diagnosis_router, prefix="/api", tags=["Automated Troubleshooting"])
app.include_router(automata_router, prefix="/api", tags=["FLAT Automata & Regex"])
app.include_router(history_router, prefix="/api", tags=["Diagnostic History"])
app.include_router(reports_router, prefix="/api", tags=["Reports & Export"])
app.include_router(auth_router, prefix="/api", tags=["Authentication"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "NetAssist Backend Engine"}

# Static frontend mounting
STATIC_DIR = os.path.join(BACKEND_DIR, "static")
FRONTEND_DIST = os.path.abspath(os.path.join(BACKEND_DIR, "..", "frontend", "dist"))

if os.path.isdir(FRONTEND_DIST):
    app.frontend("/", directory=FRONTEND_DIST, fallback="index.html")
elif os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/login")
    @app.get("/diagnostics")
    @app.get("/troubleshooting")
    @app.get("/automata")
    @app.get("/performance")
    @app.get("/history")
    @app.get("/reports")
    @app.get("/about")
    async def serve_spa_pages():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("  NETASSIST – NETWORK TROUBLESHOOTING & DIAGNOSTIC ASSISTANT")
    print("  Academic Project: CN (Networks) + FLAT (Automata) + FSWD (Full Stack)")
    print("  Server running on http://127.0.0.1:8000")
    print("  Open your browser to: http://127.0.0.1:8000")
    print("  API Documentation at: http://127.0.0.1:8000/docs")
    print("=" * 70)
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
