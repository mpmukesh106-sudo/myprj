from fastapi import APIRouter
from database.db import get_dashboard_stats
from services.network_diagnostics import check_internet_connectivity, get_local_ip_info

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard():
    """Returns aggregated metrics, latency trends, and recent diagnostics for the dashboard."""
    stats = get_dashboard_stats()
    # Refresh live status
    live_conn = check_internet_connectivity()
    stats["network_status"] = live_conn["status"]
    stats["live_latency_ms"] = live_conn["latency_ms"]
    return {
        "status": "success",
        "data": stats
    }
