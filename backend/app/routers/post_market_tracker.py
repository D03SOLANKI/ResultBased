"""
Post-Market Earnings Tracker Router
Provides API endpoints for monitoring stocks that announced financial results
after market hours on the previous day and analyzing their performance in today's market session.

CRITICAL: Decoupled and strictly independent from trading strategy logic.
"""

from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from backend.app.services.post_market_engine import (
    get_tracked_post_market_stocks,
    get_post_market_analytics_summary,
    get_available_tracking_sessions,
    seed_post_market_tracker_data
)

router = APIRouter(prefix="/api/post-market-tracker", tags=["post-market-tracker"])

@router.get("/stocks")
def get_stocks(
    tracking_date: Optional[str] = Query(None, description="Active market session tracking date (YYYY-MM-DD)"),
    reaction_pattern: Optional[str] = Query(None, description="Filter by reaction pattern (e.g. 'Gap Up & Rally')"),
    market_cap: Optional[str] = Query(None, description="Filter by market cap category"),
    search: Optional[str] = Query(None, description="Search company name or symbol")
):
    """
    Retrieve list of stocks that announced results after market hours yesterday
    and their intraday performance in today's market session.
    """
    stocks = get_tracked_post_market_stocks(
        tracking_date=tracking_date,
        reaction_pattern=reaction_pattern,
        market_cap=market_cap,
        search=search
    )
    return {
        "count": len(stocks),
        "tracking_date": tracking_date or (stocks[0]["tracking_date"] if stocks else None),
        "yesterday_date": stocks[0]["results_date"] if stocks else None,
        "stocks": stocks
    }

@router.get("/summary")
def get_summary(
    tracking_date: Optional[str] = Query(None, description="Tracking date for summary analytics")
):
    """
    Retrieve key aggregated reaction metrics: average overnight gap %, total tracked,
    win rate, top performer, and pattern breakdown.
    """
    return get_post_market_analytics_summary(tracking_date=tracking_date)

@router.get("/sessions")
def get_sessions():
    """
    Retrieve list of available post-market tracking sessions.
    """
    return get_available_tracking_sessions()

@router.post("/reseed")
def reseed_tracker():
    """
    Utility endpoint to re-seed ground truth post-market tracking data.
    """
    seed_post_market_tracker_data()
    return {"status": "success", "message": "Post-market tracker ground truth seeded successfully"}
