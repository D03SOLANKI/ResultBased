from fastapi import APIRouter
from datetime import datetime, timedelta
from backend.app.database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/overview")
def get_overview(date_str: str = None):
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    t_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    tom_date = t_date + timedelta(days=1)
    d7_date = t_date + timedelta(days=7)
    d30_date = t_date + timedelta(days=30)

    t_str = t_date.strftime("%Y-%m-%d")
    tom_str = tom_date.strftime("%Y-%m-%d")
    d7_str = d7_date.strftime("%Y-%m-%d")
    d30_str = d30_date.strftime("%Y-%m-%d")

    with get_db() as conn:
        cursor = conn.cursor()

        # Company Master stats
        cursor.execute("SELECT count(*) as total, sum(case when nse_symbol is not null then 1 else 0 end) as nse, sum(case when bse_code is not null then 1 else 0 end) as bse, sum(is_dual_listed) as dual, sum(case when listing_segment = 'SME' then 1 else 0 end) as sme FROM company_master")
        cm = cursor.fetchone()

        # Results Event stats
        cursor.execute("SELECT count(*) as c FROM results_events WHERE board_meeting_date = ?", (t_str,))
        today = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM results_events WHERE board_meeting_date = ?", (tom_str,))
        tomorrow = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM results_events WHERE board_meeting_date >= ? AND board_meeting_date <= ?", (t_str, d7_str))
        next7 = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM results_events WHERE board_meeting_date >= ? AND board_meeting_date <= ?", (t_str, d30_str))
        next30 = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM results_events WHERE event_status = 'Newly Announced'")
        newly = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM results_events WHERE event_status IN ('Revised', 'Postponed')")
        revised = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM results_events WHERE event_status = 'Cancelled'")
        cancelled = cursor.fetchone()["c"]

        # Results Released stats - strictly separated by active session date vs historical
        cursor.execute("""
            SELECT count(*) as c FROM results_events 
            WHERE event_status = 'Results Released' 
            AND (actual_results_date = ? OR board_meeting_date = ?)
        """, (t_str, t_str))
        released_today = cursor.fetchone()["c"]

        # Rolling 7-day window for previous releases: [t_date - 7 days, t_date)
        d7_ago_str = (t_date - timedelta(days=7)).strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT count(*) as c FROM results_events 
            WHERE event_status = 'Results Released' 
            AND COALESCE(actual_results_date, board_meeting_date) >= ? 
            AND COALESCE(actual_results_date, board_meeting_date) < ?
        """, (d7_ago_str, t_str))
        results_released_7d = cursor.fetchone()["c"]

        cursor.execute("""
            SELECT count(*) as c FROM results_events 
            WHERE event_status = 'Results Pending' 
            AND board_meeting_date >= ? AND board_meeting_date < ?
        """, (d7_ago_str, t_str))
        results_pending_7d = cursor.fetchone()["c"]

        cursor.execute("""
            SELECT count(*) as c FROM results_events 
            WHERE event_status = 'Results Postponed' 
            AND board_meeting_date >= ? AND board_meeting_date < ?
        """, (d7_ago_str, t_str))
        results_postponed_7d = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM results_events WHERE event_status = 'Results Released'")
        total_released = cursor.fetchone()["c"]

        cursor.execute("SELECT count(*) as c FROM company_financial_performance")
        total_performance_tracked = cursor.fetchone()["c"]

        # Market Cap breakdown of upcoming events
        cursor.execute("""
        SELECT c.market_cap_category, count(*) as count
        FROM results_events e
        JOIN company_master c ON e.isin = c.isin
        WHERE e.board_meeting_date >= ? AND e.board_meeting_date <= ?
        GROUP BY c.market_cap_category
        """, (t_str, d30_str))
        cat_counts = {r["market_cap_category"] or "Unclassified": r["count"] for r in cursor.fetchall()}

    return {
        "as_of_date": t_str,
        "total_unique_companies": cm["total"],
        "total_nse_tracked": cm["nse"],
        "total_bse_tracked": cm["bse"],
        "dual_listed_count": cm["dual"],
        "sme_count": cm["sme"],
        "scheduled_today": today,
        "scheduled_tomorrow": tomorrow,
        "scheduled_7d": next7,
        "scheduled_30d": next30,
        "newly_announced": newly,
        "revised": revised,
        "cancelled": cancelled,
        "results_released_today": released_today,
        "results_released_7d": results_released_7d,
        "results_pending_7d": results_pending_7d,
        "results_postponed_7d": results_postponed_7d,
        "total_released": total_released,
        "rolling_7d_window_start": d7_ago_str,
        "rolling_7d_window_end": (t_date - timedelta(days=1)).strftime("%Y-%m-%d"),
        "total_performance_tracked": total_performance_tracked,
        "category_breakdown_30d": cat_counts
    }
