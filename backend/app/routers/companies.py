from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.app.database import get_db

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.get("")
def list_companies(
    search: Optional[str] = None,
    exchange: Optional[str] = None,
    market_cap: Optional[str] = None,
    segment: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    conditions = []
    params = []

    if search:
        pat = f"%{search.strip()}%"
        conditions.append("(company_name LIKE ? OR nse_symbol LIKE ? OR bse_code LIKE ? OR isin LIKE ?)")
        params.extend([pat, pat, pat, pat])

    if exchange == "NSE":
        conditions.append("nse_symbol IS NOT NULL")
    elif exchange == "BSE":
        conditions.append("bse_code IS NOT NULL")
    elif exchange == "DUAL":
        conditions.append("is_dual_listed = 1")

    if market_cap:
        conditions.append("market_cap_category = ?")
        params.append(market_cap)

    if segment:
        conditions.append("listing_segment = ?")
        params.append(segment)

    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    offset = (page - 1) * limit

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"SELECT count(*) as total FROM company_master {where_clause}", params)
        total = cursor.fetchone()["total"]

        cursor.execute(f"""
        SELECT * FROM company_master
        {where_clause}
        ORDER BY market_cap_cr DESC NULLS LAST
        LIMIT ? OFFSET ?
        """, params + [limit, offset])
        rows = [dict(r) for r in cursor.fetchall()]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
        "companies": rows
    }

@router.get("/{isin}")
def get_company_detail(isin: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM company_master WHERE isin = ?", (isin,))
        comp = cursor.fetchone()
        if not comp:
            raise HTTPException(status_code=404, detail="Company not found")

        company_dict = dict(comp)

        # Get upcoming results events
        cursor.execute("""
        SELECT * FROM results_events 
        WHERE isin = ?
        ORDER BY board_meeting_date ASC
        """, (isin,))
        events = [dict(r) for r in cursor.fetchall()]

        # Get announcements history
        cursor.execute("""
        SELECT * FROM announcements 
        WHERE isin = ?
        ORDER BY published_at DESC
        LIMIT 20
        """, (isin,))
        announcements = [dict(r) for r in cursor.fetchall()]

        # Construct official URLs
        urls = {
            "nse_quote": f"https://www.nseindia.com/get-quotes/equity?symbol={comp['nse_symbol']}" if comp['nse_symbol'] else None,
            "bse_quote": f"https://www.bseindia.com/stock-share-price/x/y/{comp['bse_code']}/" if comp['bse_code'] else None
        }

    return {
        "company": company_dict,
        "upcoming_events": events,
        "announcements": announcements,
        "links": urls
    }
