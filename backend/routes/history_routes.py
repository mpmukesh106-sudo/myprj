from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from database.db import get_diagnostics, get_diagnostic_by_id, delete_diagnostic, clear_all_diagnostics

router = APIRouter()

@router.get("/history")
async def get_history(
    limit: int = Query(default=100, ge=1, le=500),
    test_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None)
):
    """Retrieves diagnostic test history from SQLite with optional filtering and search."""
    records = get_diagnostics(limit=limit, test_type=test_type, status=status, search=search)
    return {
        "status": "success",
        "count": len(records),
        "data": records
    }

@router.get("/history/{diag_id}")
async def get_history_detail(diag_id: int):
    """Retrieves single diagnostic test record by ID."""
    record = get_diagnostic_by_id(diag_id)
    if not record:
        raise HTTPException(status_code=404, detail="Diagnostic record not found")
    return {
        "status": "success",
        "data": record
    }

@router.delete("/history/{diag_id}")
async def delete_history_item(diag_id: int):
    """Deletes a single diagnostic record from SQLite."""
    success = delete_diagnostic(diag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found or already deleted")
    return {
        "status": "success",
        "message": f"Diagnostic record #{diag_id} successfully deleted."
    }

@router.delete("/history")
async def clear_history():
    """Clears all diagnostic records."""
    clear_all_diagnostics()
    return {
        "status": "success",
        "message": "All diagnostic test history has been cleared."
    }
