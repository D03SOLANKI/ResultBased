from fastapi import APIRouter, Query, BackgroundTasks
from typing import Optional
from backend.app.services.report_generator import generate_daily_report
from backend.app.services.ingestion import run_full_sync

router = APIRouter(prefix="/api/report", tags=["report"])

@router.get("/daily")
def get_daily_report(date_str: Optional[str] = None):
    return generate_daily_report(date_str)

@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    # Runs full sync
    res = run_full_sync()
    return {"status": "success", "message": "Data synchronized successfully", "metrics": res}
