from fastapi import APIRouter
from services.troubleshooting import run_automated_diagnosis
from database.db import add_diagnostic

router = APIRouter()

@router.post("/diagnosis/run")
async def run_diagnosis():
    """
    Executes automated end-to-end troubleshooting suite across all layers.
    Identifies root causes, generates troubleshooting recommendations,
    and runs FLAT DFA error categorization.
    """
    result = run_automated_diagnosis()
    
    # Save overall diagnostic run to history
    diag_id = add_diagnostic(
        test_type="AUTO_DIAGNOSIS",
        target="Network Infrastructure",
        status="SUCCESS" if result["health_score"] >= 70 else "WARNING" if result["health_score"] >= 40 else "FAILED",
        latency=result.get("diagnostic_details", {}).get("public_ping", {}).get("avg_latency_ms", 0.0),
        packet_loss=result.get("diagnostic_details", {}).get("public_ping", {}).get("packet_loss", 0.0),
        error_message=f"{result['problems_count']} problem(s) detected" if result["problems_count"] > 0 else None,
        details=result
    )
    
    return {
        "status": "success",
        "diagnostic_id": diag_id,
        "data": result
    }
