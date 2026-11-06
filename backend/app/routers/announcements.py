from fastapi import APIRouter, Query
from typing import Optional
from backend.app.database import get_db

router = APIRouter(prefix="/api/announcements", tags=["announcements"])

@router.get("")
def get_announcements(
    exchange: Optional[str] = None,
    filter_type: Optional[str] = Query(None, description="board_meeting, financial_results, all"),
    search: Optional[str] = None,
    limit: int = 50,
    page: int = 1
):
    conditions = []
    params = []

    if exchange:
        conditions.append("exchange = ?")
        params.append(exchange.upper())

    if filter_type == "board_meeting":
        conditions.append("is_board_meeting = 1")
    elif filter_type == "financial_results":
        conditions.append("is_financial_results = 1")

    if search:
        pat = f"%{search.strip()}%"
        conditions.append("(company_name LIKE ? OR symbol_or_code LIKE ? OR headline LIKE ? OR description LIKE ?)")
        params.extend([pat, pat, pat, pat])

    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    offset = (page - 1) * limit

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"SELECT count(*) as total FROM announcements {where_clause}", params)
        total = cursor.fetchone()["total"]

        cursor.execute(f"""
        SELECT * FROM announcements
        {where_clause}
        ORDER BY published_at DESC
        LIMIT ? OFFSET ?
        """, params + [limit, offset])
        rows = [dict(r) for r in cursor.fetchall()]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "announcements": rows
    }
