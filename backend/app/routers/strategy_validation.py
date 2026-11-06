"""
FastAPI Router for Strategy vs Actual Market Performance Validation Engine
Provides REST APIs for Scorecards, Prediction Logs, Outcome Classifications,
Financial Results Correlations, and Error Post-Mortems.
"""

from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.app.database import get_db
from backend.app.services.strategy_validation_engine import (
    calculate_scorecard,
    log_immutable_prediction,
    classify_market_outcome,
    record_validation_outcome,
    record_error_analysis
)

router = APIRouter(prefix="/api/strategy-validation", tags=["strategy-validation"])

@router.get("/scorecard")
def get_scorecard(
    market_cap: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    strategy_version: Optional[str] = Query(None),
    holding_period: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    """Retrieves full strategy performance scorecard with segmented breakdowns."""
    filter_sql = ""
    params = []
    
    if market_cap:
        filter_sql += " AND p.market_cap_category = ?"
        params.append(market_cap)
    if sector:
        filter_sql += " AND p.industry = ?"
        params.append(sector)
    if strategy_version:
        filter_sql += " AND p.strategy_version = ?"
        params.append(strategy_version)
    if holding_period:
        filter_sql += " AND p.holding_period = ?"
        params.append(holding_period)
    if from_date:
        filter_sql += " AND p.trading_date >= ?"
        params.append(from_date)
    if to_date:
        filter_sql += " AND p.trading_date <= ?"
        params.append(to_date)

    return calculate_scorecard(filter_sql, tuple(params))

@router.get("/predictions")
def get_predictions(
    trading_date: Optional[str] = Query(None),
    market_cap: Optional[str] = Query(None),
    strategy_name: Optional[str] = Query(None),
    outcome_classification: Optional[str] = Query(None),
    is_direction_correct: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Returns paginated, filterable strategy predictions cross-verified with actual outcomes."""
    filter_sql = ""
    params = []

    if trading_date:
        filter_sql += " AND p.trading_date = ?"
        params.append(trading_date)
    if market_cap:
        filter_sql += " AND p.market_cap_category = ?"
        params.append(market_cap)
    if strategy_name:
        filter_sql += " AND p.strategy_name LIKE ?"
        params.append(f"%{strategy_name}%")
    if outcome_classification:
        filter_sql += " AND o.outcome_classification = ?"
        params.append(outcome_classification)
    if is_direction_correct is not None:
        filter_sql += " AND o.is_direction_correct = ?"
        params.append(is_direction_correct)
    if search:
        s = f"%{search.strip().lower()}%"
        filter_sql += " AND (LOWER(p.company_name) LIKE ? OR LOWER(p.nse_symbol) LIKE ? OR LOWER(p.isin) LIKE ?)"
        params.extend([s, s, s])

    offset = (page - 1) * limit

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Count total
        cursor.execute(f"""
        SELECT count(*) 
        FROM strategy_predictions p
        LEFT JOIN strategy_validation_outcomes o ON p.prediction_id = o.prediction_id
        WHERE 1=1 {filter_sql}
        """, tuple(params))
        total_count = cursor.fetchone()[0]

        # Fetch page
        query = f"""
        SELECT 
            p.prediction_id, p.prediction_timestamp, p.trading_date, p.isin, p.company_name,
            p.nse_symbol, p.bse_code, p.industry, p.market_cap_category, p.strategy_name,
            p.strategy_version, p.strategy_config, p.signal, p.expected_direction,
            p.buy_above_price, p.expected_entry_price, p.stop_loss, p.target_price,
            p.risk_reward_ratio, p.predicted_return_pct, p.confidence_score, p.holding_period,
            p.announcement_timing, p.selection_reason, p.financial_result_context, p.immutable_hash,
            o.outcome_id, o.evaluation_timestamp, o.actual_open, o.actual_high, o.actual_low,
            o.actual_close, o.actual_volume, o.entry_triggered, o.entry_price_executed,
            o.target_hit, o.stop_loss_hit, o.outcome_classification, o.actual_intraday_return_pct,
            o.actual_max_favorable_pct, o.actual_max_adverse_pct, o.is_direction_correct,
            o.prediction_deviation_pct, o.data_source,
            e.analysis_id, e.failure_category, e.primary_cause, e.market_context,
            e.expected_vs_actual_discrepancy, e.recurring_pattern, e.recommended_improvement
        FROM strategy_predictions p
        LEFT JOIN strategy_validation_outcomes o ON p.prediction_id = o.prediction_id
        LEFT JOIN strategy_error_analysis e ON p.prediction_id = e.prediction_id
        WHERE 1=1 {filter_sql}
        ORDER BY p.trading_date DESC, p.prediction_id ASC
        LIMIT ? OFFSET ?
        """
        cursor.execute(query, tuple(params + [limit, offset]))
        rows = [dict(r) for r in cursor.fetchall()]

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "predictions": rows
    }

@router.get("/prediction/{prediction_id}")
def get_prediction_detail(prediction_id: str):
    """Fetches in-depth trade record and post-mortem by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT 
            p.*,
            o.outcome_id, o.evaluation_timestamp, o.actual_open, o.actual_high, o.actual_low,
            o.actual_close, o.actual_volume, o.entry_triggered, o.entry_price_executed,
            o.target_hit, o.stop_loss_hit, o.outcome_classification, o.actual_intraday_return_pct,
            o.actual_max_favorable_pct, o.actual_max_adverse_pct, o.is_direction_correct,
            o.prediction_deviation_pct, o.data_source,
            e.analysis_id, e.failure_category, e.primary_cause, e.market_context,
            e.expected_vs_actual_discrepancy, e.recurring_pattern, e.recommended_improvement
        FROM strategy_predictions p
        LEFT JOIN strategy_validation_outcomes o ON p.prediction_id = o.prediction_id
        LEFT JOIN strategy_error_analysis e ON p.prediction_id = e.prediction_id
        WHERE p.prediction_id = ?
        """, (prediction_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Prediction {prediction_id} not found")
        return dict(row)

@router.get("/error-analysis")
def get_error_analysis():
    """Returns recurring failure patterns, primary causes, and systematic recommendations."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT 
            e.analysis_id, e.prediction_id, e.failure_category, e.primary_cause,
            e.market_context, e.expected_vs_actual_discrepancy, e.recurring_pattern,
            e.recommended_improvement,
            p.company_name, p.nse_symbol, p.trading_date, p.strategy_name,
            p.predicted_return_pct, o.actual_intraday_return_pct, o.outcome_classification
        FROM strategy_error_analysis e
        JOIN strategy_predictions p ON e.prediction_id = p.prediction_id
        JOIN strategy_validation_outcomes o ON e.prediction_id = o.prediction_id
        ORDER BY p.trading_date DESC
        """)
        rows = [dict(r) for r in cursor.fetchall()]

        # Aggregate recurring patterns
        patterns = {}
        for r in rows:
            cat = r["failure_category"]
            patterns.setdefault(cat, []).append(r)

    return {
        "total_failures_analyzed": len(rows),
        "patterns_breakdown": {
            k: {
                "count": len(v),
                "stocks_affected": [x["nse_symbol"] for x in v],
                "sample_cause": v[0]["primary_cause"],
                "recommended_fix": v[0]["recommended_improvement"]
            }
            for k, v in patterns.items()
        },
        "detailed_post_mortems": rows
    }

@router.get("/results-correlation")
def get_financial_results_correlation():
    """
    Direct comparison between:
    1. Financial performance reported (PAT YoY, Rev YoY, Beat/Miss)
    2. Strategy pre-announcement prediction & expected direction
    3. Actual market reaction (Daily return, gap, volume surge)
    4. Directional and magnitude alignment verdict
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT 
            p.trading_date,
            p.company_name,
            p.nse_symbol,
            p.announcement_timing,
            p.selection_reason,
            p.financial_result_context,
            p.signal as predicted_signal,
            p.expected_direction,
            p.predicted_return_pct,
            o.actual_open,
            o.actual_close,
            o.actual_intraday_return_pct,
            o.actual_volume,
            o.outcome_classification,
            o.is_direction_correct,
            o.prediction_deviation_pct,
            e.failure_category,
            e.primary_cause
        FROM strategy_predictions p
        JOIN strategy_validation_outcomes o ON p.prediction_id = o.prediction_id
        LEFT JOIN strategy_error_analysis e ON p.prediction_id = e.prediction_id
        ORDER BY p.trading_date DESC, p.company_name ASC
        """)
        rows = [dict(r) for r in cursor.fetchall()]

    return {
        "total_correlated": len(rows),
        "records": rows
    }

@router.post("/log-prediction")
def log_new_prediction(payload: Dict[str, Any] = Body(...)):
    """Logs a new strategy prediction with immutable SHA-256 fingerprint."""
    with get_db() as conn:
        pred_hash = log_immutable_prediction(conn, payload)
    return {
        "status": "SUCCESS",
        "prediction_id": payload["prediction_id"],
        "immutable_hash": pred_hash,
        "message": "Prediction logged immutably before session open."
    }

@router.post("/evaluate-outcome")
def evaluate_outcome(payload: Dict[str, Any] = Body(...)):
    """Evaluates an existing prediction against authentic market bar."""
    pred_id = payload["prediction_id"]
    bar = payload["market_bar"]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM strategy_predictions WHERE prediction_id = ?", (pred_id,))
        pred_row = cursor.fetchone()
        if not pred_row:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        pred_dict = dict(pred_row)
        outcome = classify_market_outcome(pred_dict, bar)
        outcome["outcome_id"] = f"OUT-{pred_id}"
        outcome["prediction_id"] = pred_id
        outcome["evaluation_timestamp"] = datetime.now().isoformat()
        outcome["actual_open"] = bar["actual_open"]
        outcome["actual_high"] = bar["actual_high"]
        outcome["actual_low"] = bar["actual_low"]
        outcome["actual_close"] = bar["actual_close"]
        outcome["actual_volume"] = bar.get("actual_volume", 0)
        outcome["actual_next_day_close"] = bar.get("actual_next_day_close", bar["actual_close"])
        
        record_validation_outcome(conn, outcome)

        if payload.get("error_analysis"):
            err = payload["error_analysis"]
            err["analysis_id"] = f"ERR-{pred_id}"
            err["prediction_id"] = pred_id
            record_error_analysis(conn, err)

    return {
        "status": "EVALUATED",
        "outcome": outcome
    }
