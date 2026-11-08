import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.database import init_db
from backend.app.routers import stats, calendar, companies, announcements, report, performance, post_market_tracker
from backend.app.services.realtime_surveillance import start_surveillance_worker, stop_surveillance_worker
from backend.app.services.financial_statement_verifier import execute_full_verification_and_seeding
from backend.app.services.post_market_engine import seed_post_market_tracker_data
from backend.app.services.calendar_reconciliation_engine import run_calendar_reconciliation

app = FastAPI(
    title="All India Listed Companies - Upcoming Financial Results Scanner",
    description="Automated intelligence system tracking forthcoming earnings announcements across 100% NSE & BSE listed equities.",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stats.router)
app.include_router(calendar.router)
app.include_router(companies.router)
app.include_router(announcements.router)
app.include_router(report.router)
app.include_router(performance.router)
app.include_router(post_market_tracker.router)

@app.on_event("startup")
def on_startup():
    init_db()
    execute_full_verification_and_seeding()
    seed_post_market_tracker_data()
    run_calendar_reconciliation()
    start_surveillance_worker(interval_sec=30)

@app.on_event("shutdown")
def on_shutdown():
    stop_surveillance_worker()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Upcoming Financial Results Scanner API",
        "version": "1.0.0"
    }

# Mount static build of frontend if exists
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Serve static file if exists (e.g. favicon, assets)
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Serve index.html with NO-CACHE headers so browser never holds stale client bundle
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        response = FileResponse(index_file)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
