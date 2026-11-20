"""
Blind Backtesting API Router
Exposes independent endpoints for the Blind Historical Backtest of the Positive Market Reaction Prediction Engine.
Completely isolated from the production strategy router and scanner.db.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
import sqlite3
import os
import json
import math

router = APIRouter()

BACKTEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "blind_backtest.db"))


def get_db():
    if not os.path.exists(BACKTEST_DB_PATH):
        raise HTTPException(status_code=503, detail="Blind backtest database not initialized yet.")
    conn = sqlite3.connect(BACKTEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/summary")
def get_backtest_summary():
    """
    Returns high-level summary metrics, confusion matrix, win rate, and drawdown metrics.
    """
    with get_db() as conn:
        cur = conn.cursor()

        # Fetch metrics summary
        cur.execute("SELECT metric_key, metric_value, metric_text FROM blind_backtest_metrics_summary;")
        metrics = {row["metric_key"]: row["metric_value"] for row in cur.fetchall()}

        if not metrics:
            return {"status": "INITIALIZING", "message": "Backtest data is currently compiling."}

        # Confusion Matrix counts
        tp = int(metrics.get("true_positives", 0))
        fp = int(metrics.get("false_positives", 0))
        tn = int(metrics.get("true_negatives", 0))
        fn = int(metrics.get("false_negatives", 0))
        total = int(metrics.get("total_evaluated_announcements", tp + fp + tn + fn))

        # Win rate in positive setups
        pos_total = tp + fp
        pos_win_rate = round((tp / pos_total) * 100.0, 2) if pos_total > 0 else 0.0

        # Sector performance summary
        cur.execute("""
        SELECT 
            sector,
            COUNT(*) as total_events,
            SUM(is_correct) as correct_events,
            ROUND(AVG(is_correct) * 100.0, 1) as accuracy_pct,
            SUM(CASE WHEN predicted_direction = 'POSITIVE' THEN 1 ELSE 0 END) as positive_preds,
            SUM(CASE WHEN classification = 'TRUE_POSITIVE' THEN 1 ELSE 0 END) as tp_count,
            ROUND(AVG(CASE WHEN predicted_direction = 'POSITIVE' THEN reaction_return_pct ELSE NULL END), 2) as avg_pos_return,
            ROUND(AVG(benchmark_adjusted_return_pct), 2) as avg_alpha
        FROM blind_predictions
        GROUP BY sector
        ORDER BY total_events DESC;
        """)
        sector_breakdown = [dict(r) for r in cur.fetchall()]

        return {
            "status": "COMPLETED",
            "metrics": {
                "total_evaluated": total,
                "overall_accuracy_pct": metrics.get("accuracy_pct", 0.0),
                "precision_pct": metrics.get("precision_pct", 0.0),
                "recall_pct": metrics.get("recall_pct", 0.0),
                "specificity_pct": metrics.get("specificity_pct", 0.0),
                "f1_score": metrics.get("f1_score", 0.0),
                "positive_win_rate_pct": metrics.get("positive_win_rate_pct", pos_win_rate),
                "average_trade_return_pct": metrics.get("average_trade_return_pct", 0.0),
                "max_drawdown_pct": metrics.get("max_drawdown_pct", 0.0),
                "average_brier_score": metrics.get("average_brier_score", 0.0),
                "exclusions_count": int(metrics.get("exclusions_count", 0))
            },
            "confusion_matrix": {
                "true_positives": tp,
                "false_positives": fp,
                "true_negatives": tn,
                "false_negatives": fn,
                "tp_pct": round((tp / total) * 100.0, 1) if total > 0 else 0.0,
                "fp_pct": round((fp / total) * 100.0, 1) if total > 0 else 0.0,
                "tn_pct": round((tn / total) * 100.0, 1) if total > 0 else 0.0,
                "fn_pct": round((fn / total) * 100.0, 1) if total > 0 else 0.0
            },
            "sector_breakdown": sector_breakdown
        }


@router.get("/predictions")
def get_backtest_predictions(
    classification: Optional[str] = Query(None, description="TRUE_POSITIVE, FALSE_POSITIVE, TRUE_NEGATIVE, FALSE_NEGATIVE"),
    predicted_direction: Optional[str] = Query(None, description="POSITIVE, NEGATIVE"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    search: Optional[str] = Query(None, description="Search symbol or company name"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("reaction_date", description="Field to sort by"),
    sort_order: str = Query("desc", description="asc or desc")
):
    """
    Returns paginated company-by-company predictions vs actuals with full forensic tracking.
    """
    with get_db() as conn:
        cur = conn.cursor()

        where_clauses = ["status = 'EVALUATED'"]
        params = []

        if classification and classification != "ALL":
            where_clauses.append("classification = ?")
            params.append(classification)

        if predicted_direction and predicted_direction != "ALL":
            where_clauses.append("predicted_direction = ?")
            params.append(predicted_direction)

        if sector and sector != "ALL":
            where_clauses.append("sector = ?")
            params.append(sector)

        if search:
            where_clauses.append("(symbol LIKE ? OR company_name LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%"])

        where_str = " AND ".join(where_clauses)

        # Get total count
        cur.execute(f"SELECT COUNT(*) FROM blind_predictions WHERE {where_str};", params)
        total_count = cur.fetchone()[0]

        # Valid sort columns
        valid_sorts = {
            "reaction_date": "reaction_date",
            "announcement_date": "announcement_date",
            "positive_probability_pct": "positive_probability_pct",
            "reaction_return_pct": "reaction_return_pct",
            "benchmark_adjusted_return_pct": "benchmark_adjusted_return_pct",
            "symbol": "symbol"
        }
        order_col = valid_sorts.get(sort_by, "reaction_date")
        order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"

        offset = (page - 1) * limit
        query = f"""
        SELECT 
            prediction_id, symbol, company_name, sector, exchange, announcement_date, announcement_timing,
            prediction_timestamp, predicted_direction, positive_probability_pct, confidence_level,
            confidence_score, predicted_reasoning, pillar1_operational_score, pillar2_priced_in_score,
            pillar3_delivery_score, pillar4_fno_score, pillar5_peer_score, pre_runup_15d_pct,
            pre_runup_5d_pct, pre_vol_multiple_5d_vs_30d, pre_rsi_14, prediction_sha256_hash,
            reaction_date, prev_close_price, reaction_open_price, reaction_close_price,
            next_day_close_price, reaction_return_pct, reaction_intraday_pct, reaction_t1_return_pct,
            nifty_benchmark_return_pct, benchmark_adjusted_return_pct, actual_reaction_verdict,
            classification, is_correct, brier_score, revealed_at
        FROM blind_predictions
        WHERE {where_str}
        ORDER BY {order_col} {order_dir}
        LIMIT ? OFFSET ?;
        """
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]

        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

        return {
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "predictions": rows
        }


@router.get("/equity-curve")
def get_backtest_equity_curve():
    """
    Returns time-series data for the cumulative strategy equity curve and maximum drawdown vs Nifty 50.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
        SELECT 
            trade_number, date, symbol, company_name, trade_type, trade_return_pct,
            cumulative_return_pct, benchmark_return_pct, cumulative_benchmark_pct,
            peak_return_pct, drawdown_pct
        FROM blind_backtest_equity_curve
        ORDER BY trade_number ASC;
        """)
        rows = [dict(r) for r in cur.fetchall()]
        return {"equity_curve": rows}


@router.get("/exclusions")
def get_backtest_exclusions():
    """
    Returns auditable list of events excluded due to historical data gaps.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
        SELECT id, symbol, company_name, announcement_date, exclusion_reason, details, logged_at
        FROM blind_backtest_exclusions
        ORDER BY id ASC;
        """)
        rows = [dict(r) for r in cur.fetchall()]
        return {"exclusions": rows, "total": len(rows)}


@router.get("/prediction/{prediction_id}")
def get_prediction_detail(prediction_id: str):
    """
    Returns full point-in-time audit for an individual prediction including frozen features and SHA-256 fingerprint.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
        SELECT * FROM blind_predictions WHERE prediction_id = ?;
        """, (prediction_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Prediction record not found.")
        
        data = dict(row)
        try:
            data["features_snapshot"] = json.loads(data["features_snapshot_json"])
        except:
            data["features_snapshot"] = {}
        return data
