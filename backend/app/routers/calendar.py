from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta
from backend.app.database import get_db

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

@router.get("/dates")
def get_calendar_dates(from_date: Optional[str] = None, to_date: Optional[str] = None):
    now = datetime.now()
    if not from_date:
        from_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    if not to_date:
        to_date = (now + timedelta(days=45)).strftime("%Y-%m-%d")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT 
            e.board_meeting_date,
            count(*) as total_events,
            sum(case when e.event_status = 'Results Released' then 1 else 0 end) as results_released,
            sum(case when e.event_status = 'Results Pending' then 1 else 0 end) as results_pending,
            sum(case when e.event_status = 'Results Postponed' then 1 else 0 end) as results_postponed,
            sum(case when e.event_status = 'Scheduled' then 1 else 0 end) as scheduled,
            sum(case when c.market_cap_category = 'Large Cap' then 1 else 0 end) as large_cap,
            sum(case when c.market_cap_category = 'Mid Cap' then 1 else 0 end) as mid_cap,
            sum(case when c.market_cap_category = 'Small Cap' then 1 else 0 end) as small_cap,
            sum(case when c.market_cap_category = 'Micro Cap' then 1 else 0 end) as micro_cap,
            sum(case when c.listing_segment = 'SME' then 1 else 0 end) as sme
        FROM results_events e
        JOIN company_master c ON e.isin = c.isin
        WHERE e.board_meeting_date >= ? AND e.board_meeting_date <= ?
        GROUP BY e.board_meeting_date
        ORDER BY e.board_meeting_date ASC
        """, (from_date, to_date))
        rows = [dict(r) for r in cursor.fetchall()]
    return rows

@router.get("/events")
def get_events(
    quick_filter: Optional[str] = Query(None, description="today, tomorrow, 7d, 30d, released, all"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    exchange: Optional[str] = None,  # NSE, BSE, DUAL
    market_cap: Optional[str] = None, # Large Cap, Mid Cap, Small Cap, Micro Cap, SME
    result_category: Optional[str] = None, # Quarterly Results, Half-Yearly Results, Annual Financial Results, Monthly Performance Update
    event_status: Optional[str] = None, # Scheduled, Results Released
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    sort_by: str = "date", # date, mcap, name
    sort_order: str = "asc" # asc, desc
):
    base_date = datetime.now().strftime("%Y-%m-%d")
    t_date = datetime.strptime(base_date, "%Y-%m-%d").date()

    if quick_filter == "today":
        date_from = base_date
        date_to = base_date
    elif quick_filter == "tomorrow":
        tom = (t_date + timedelta(days=1)).strftime("%Y-%m-%d")
        date_from = tom
        date_to = tom
    elif quick_filter == "7d":
        date_from = base_date
        date_to = (t_date + timedelta(days=7)).strftime("%Y-%m-%d")
    elif quick_filter == "30d":
        date_from = base_date
        date_to = (t_date + timedelta(days=30)).strftime("%Y-%m-%d")

    conditions = []
    params = []

    if quick_filter == "released_today":
        conditions.append("e.event_status = 'Results Released' AND (e.actual_results_date = ? OR (e.board_meeting_date = ? AND e.event_status = 'Results Released'))")
        params.extend([base_date, base_date])
    elif quick_filter == "previously_released":
        # Rolling 7-day window: maintains strictly the latest 7 calendar days of historical releases.
        # When a new day (Day 8) is added, the oldest day (Day 1) automatically rotates out.
        window_7d_start = (t_date - timedelta(days=7)).strftime("%Y-%m-%d")
        conditions.append("""
            e.event_status = 'Results Released' 
            AND COALESCE(e.actual_results_date, e.board_meeting_date) >= ? 
            AND COALESCE(e.actual_results_date, e.board_meeting_date) < ?
        """)
        params.extend([window_7d_start, base_date])
    elif quick_filter == "pending_releases":
        # Rolling 7-day window for past meetings whose results filings are still pending / delayed
        window_7d_start = (t_date - timedelta(days=7)).strftime("%Y-%m-%d")
        conditions.append("""
            e.event_status = 'Results Pending' 
            AND e.board_meeting_date >= ? 
            AND e.board_meeting_date < ?
        """)
        params.extend([window_7d_start, base_date])
    elif quick_filter == "postponed_releases":
        # Postponed/rescheduled meetings
        conditions.append("e.event_status = 'Results Postponed'")
    elif quick_filter in ["released", "released_all"]:
        conditions.append("e.event_status = 'Results Released'")
    else:
        if date_from:
            conditions.append("e.board_meeting_date >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("e.board_meeting_date <= ?")
            params.append(date_to)

    if event_status:
        conditions.append("e.event_status = ?")
        params.append(event_status)

    if exchange == "NSE":
        conditions.append("e.nse_symbol IS NOT NULL")
    elif exchange == "BSE":
        conditions.append("e.bse_code IS NOT NULL")
    elif exchange == "DUAL":
        conditions.append("c.is_dual_listed = 1")

    if market_cap:
        if market_cap.upper() == "SME":
            conditions.append("c.listing_segment = 'SME'")
        else:
            conditions.append("c.market_cap_category = ?")
            params.append(market_cap)

    if result_category:
        conditions.append("e.result_category = ?")
        params.append(result_category)

    if search:
        search_pattern = f"%{search.strip()}%"
        conditions.append("(e.company_name LIKE ? OR e.nse_symbol LIKE ? OR e.bse_code LIKE ? OR e.isin LIKE ?)")
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

    # Sort logic
    order_clause = "e.board_meeting_date ASC"
    if quick_filter in ["previously_released", "released", "released_all"]:
        order_clause = "e.actual_results_date DESC, e.actual_results_time DESC"
    elif quick_filter in ["pending_releases", "postponed_releases"]:
        order_clause = "e.board_meeting_date DESC, e.company_name ASC"
    if sort_by == "mcap":
        order_clause = f"c.market_cap_cr {sort_order.upper()} NULLS LAST"
    elif sort_by == "name":
        order_clause = f"e.company_name {sort_order.upper()}"
    elif sort_by == "date" and quick_filter not in ["previously_released", "released", "released_all", "pending_releases", "postponed_releases"]:
        order_clause = f"e.board_meeting_date {sort_order.upper()}"

    offset = (page - 1) * limit

    with get_db() as conn:
        cursor = conn.cursor()

        # Count total matches
        count_sql = f"""
        SELECT count(*) as total
        FROM results_events e
        JOIN company_master c ON e.isin = c.isin
        {where_clause}
        """
        cursor.execute(count_sql, params)
        total = cursor.fetchone()["total"]

        # Fetch records with verified ground truth financial performance and market reaction enrichment
        query_sql = f"""
        SELECT 
            e.*,
            c.market_cap_cr,
            c.market_cap_category,
            c.listing_segment,
            c.is_dual_listed,
            c.industry,
            c.bse_group,
            c.nse_series,
            COALESCE(rxn.market_reaction_verdict, p.performance_verdict) as performance_verdict,
            CASE 
                WHEN COALESCE(rxn.total_reaction_pct, p.price_change_pct) > 0 THEN 'emerald'
                WHEN COALESCE(rxn.total_reaction_pct, p.price_change_pct) < 0 THEN 'rose'
                ELSE 'slate'
            END as verdict_badge_color,
            COALESCE(vfs.revenue_growth_yoy_pct, p.revenue_growth_yoy_pct) as revenue_growth_yoy_pct,
            COALESCE(vfs.pat_growth_yoy_pct, p.pat_growth_yoy_pct) as pat_growth_yoy_pct,
            COALESCE(rxn.total_reaction_pct, p.price_change_pct) as price_change_pct,
            COALESCE(rxn.market_reaction_verdict, p.price_reaction_type) as price_reaction_type,
            COALESCE(rxn.announcement_time, p.filing_time) as released_time,
            CASE WHEN rxn.reaction_id IS NOT NULL OR p.performance_id IS NOT NULL THEN 1 ELSE 0 END as has_performance
        FROM results_events e
        JOIN company_master c ON e.isin = c.isin
        LEFT JOIN verified_market_reactions rxn ON e.isin = rxn.isin
        LEFT JOIN verified_financial_statements vfs ON e.isin = vfs.isin AND vfs.reporting_basis = (
            CASE WHEN EXISTS (
                SELECT 1 FROM verified_financial_statements v2 
                WHERE v2.isin = e.isin AND v2.reporting_basis = 'Consolidated'
            ) THEN 'Consolidated' ELSE 'Standalone' END
        )
        LEFT JOIN company_financial_performance p ON e.isin = p.isin AND p.is_latest = 1
        {where_clause}
        ORDER BY {order_clause}
        LIMIT ? OFFSET ?
        """
        cursor.execute(query_sql, params + [limit, offset])
        records = [dict(r) for r in cursor.fetchall()]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
        "events": records
    }
