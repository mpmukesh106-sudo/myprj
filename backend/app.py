"""
NetAssist – Network Troubleshooting & Automated Diagnostic Assistant
Main Backend Application (FastAPI + SQLite + Networking + FLAT DFA + Static Frontend)
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from database.db import init_db
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
    init_db()

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

# Static Frontend Mounting
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(STATIC_DIR):
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
