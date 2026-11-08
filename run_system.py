"""
All India Listed Companies — Upcoming Financial Results Scanner
Launcher script for Backend API & React Dashboard.
"""
import sys
import os

# Ensure current working directory is first in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn
from backend.app.database import init_db, get_db
from backend.app.services.ingestion import run_full_sync

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
    print("=" * 70)
    print("ALL INDIA LISTED COMPANIES — UPCOMING FINANCIAL RESULTS SCANNER")
    print("=" * 70)
    
    # 1. Initialize Database
    init_db()

    # 2. Check if database has data
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) as c FROM company_master")
        comp_count = cursor.fetchone()["c"]
        cursor.execute("SELECT count(*) as c FROM results_events")
        event_count = cursor.fetchone()["c"]

    if comp_count == 0 or event_count == 0:
        print("Database is empty. Running initial ingestion from verified exchange feeds...")
        run_full_sync()
    else:
        print(f"Database active: {comp_count:,} companies tracked, {event_count:,} upcoming results events.")

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    display_host = "127.0.0.1" if host == "0.0.0.0" else host

    print("\n" + "=" * 70)
    print(">> DASHBOARD IS READY & ACCESSIBLE AT:")
    print(f"   -> Unified Web Dashboard: http://{display_host}:{port}")
    print(f"   -> REST API Documentation: http://{display_host}:{port}/docs")
    print(f"   -> Daily 8:00 AM Report: http://{display_host}:{port}/api/report/daily")
    print("=" * 70 + "\n")

    # Start Uvicorn
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)

if __name__ == "__main__":
    main()
