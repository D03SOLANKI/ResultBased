"""
Unit & Integration Tests for Strategy vs Actual Market Performance Validation Engine
"""

import unittest
import hashlib
from backend.app.services.strategy_validation_engine import (
    classify_market_outcome,
    compute_prediction_hash,
    calculate_scorecard
)

class TestStrategyValidation(unittest.TestCase):
    
    def setUp(self):
        self.sample_pred = {
            "prediction_timestamp": "2026-11-05T08:30:00+05:30",
            "trading_date": "2026-11-05",
            "isin": "INE118H01025",
            "signal": "BUY",
            "expected_direction": "LONG",
            "buy_above_price": 100.0,
            "expected_entry_price": 100.0,
            "stop_loss": 95.0,
            "target_price": 110.0,
            "predicted_return_pct": 10.0,
            "strategy_name": "Post-Market Earnings Breakout",
            "strategy_version": "v1.0-Production"
        }

    def test_classify_market_outcome_target_hit(self):
        """Verifies clean target hit when high exceeds target price."""
        bar = {
            "actual_open": 98.0,
            "actual_high": 112.0,
            "actual_low": 97.0,
            "actual_close": 111.0,
            "actual_volume": 1000000
        }
        res = classify_market_outcome(self.sample_pred, bar)
        self.assertEqual(res["outcome_classification"], "TARGET HIT")
        self.assertEqual(res["entry_triggered"], 1)
        self.assertEqual(res["entry_price_executed"], 100.0)
        self.assertEqual(res["target_hit"], 1)
        self.assertEqual(res["stop_loss_hit"], 0)
        self.assertEqual(res["actual_intraday_return_pct"], 10.0)
        self.assertEqual(res["is_direction_correct"], 1)

    def test_classify_market_outcome_stop_loss_hit(self):
        """Verifies stop-loss hit when low breaches stop loss threshold."""
        bar = {
            "actual_open": 101.0,
            "actual_high": 102.0,
            "actual_low": 94.0,
            "actual_close": 94.5,
            "actual_volume": 1500000
        }
        res = classify_market_outcome(self.sample_pred, bar)
        self.assertEqual(res["outcome_classification"], "STOP-LOSS HIT")
        self.assertEqual(res["entry_triggered"], 1)
        self.assertEqual(res["target_hit"], 0)
        self.assertEqual(res["stop_loss_hit"], 1)
        self.assertLess(res["actual_intraday_return_pct"], 0)
        self.assertEqual(res["is_direction_correct"], 0)

    def test_classify_market_outcome_ambiguous_candle(self):
        """
        CRITICAL RULE 3 TEST:
        If both target and stop-loss are reached during same session and sequence is indeterminate,
        mark outcome AMBIGUOUS. Never assume the favorable outcome.
        """
        bar = {
            "actual_open": 99.0,
            "actual_high": 115.0,  # Exceeds target 110.0
            "actual_low": 92.0,   # Breaches stop 95.0
            "actual_close": 102.0,
            "actual_volume": 2000000
        }
        res = classify_market_outcome(self.sample_pred, bar)
        self.assertEqual(res["outcome_classification"], "AMBIGUOUS")
        self.assertEqual(res["target_hit"], 1)
        self.assertEqual(res["stop_loss_hit"], 1)
        # Conservative execution: must not assume favorable return
        self.assertLessEqual(res["actual_intraday_return_pct"], 0)

    def test_classify_market_outcome_signal_invalidated(self):
        """Signal invalidated if market opens below stop loss."""
        bar = {
            "actual_open": 93.0,  # Below stop loss 95.0
            "actual_high": 96.0,
            "actual_low": 91.0,
            "actual_close": 92.0,
            "actual_volume": 500000
        }
        res = classify_market_outcome(self.sample_pred, bar)
        self.assertEqual(res["outcome_classification"], "SIGNAL INVALIDATED")
        self.assertEqual(res["entry_triggered"], 0)
        self.assertIsNone(res["entry_price_executed"])
        self.assertEqual(res["actual_intraday_return_pct"], 0.0)

    def test_classify_market_outcome_entry_never_triggered(self):
        """Entry never triggered when price never crosses buy_above threshold."""
        bar = {
            "actual_open": 97.0,
            "actual_high": 99.5,  # Below buy_above 100.0
            "actual_low": 96.0,
            "actual_close": 98.0,
            "actual_volume": 400000
        }
        res = classify_market_outcome(self.sample_pred, bar)
        self.assertEqual(res["outcome_classification"], "ENTRY NEVER TRIGGERED")
        self.assertEqual(res["entry_triggered"], 0)
        self.assertIsNone(res["entry_price_executed"])
        self.assertEqual(res["actual_intraday_return_pct"], 0.0)

    def test_classify_market_outcome_profitable_no_target(self):
        """Trade triggered and closed higher, but did not reach full target."""
        bar = {
            "actual_open": 100.5,
            "actual_high": 105.0,
            "actual_low": 99.0,
            "actual_close": 104.0,  # Closed at +3.48% above entry 100.5
            "actual_volume": 800000
        }
        res = classify_market_outcome(self.sample_pred, bar)
        self.assertEqual(res["outcome_classification"], "PROFITABLE BUT TARGET NOT HIT")
        self.assertEqual(res["entry_triggered"], 1)
        self.assertEqual(res["target_hit"], 0)
        self.assertEqual(res["stop_loss_hit"], 0)
        self.assertGreater(res["actual_intraday_return_pct"], 0)

    def test_classify_market_outcome_loss_no_stop(self):
        """Trade triggered and closed lower, but did not breach stop-loss."""
        bar = {
            "actual_open": 100.0,
            "actual_high": 101.0,
            "actual_low": 96.5,
            "actual_close": 98.0,  # Closed down -2% from entry
            "actual_volume": 750000
        }
        res = classify_market_outcome(self.sample_pred, bar)
        self.assertEqual(res["outcome_classification"], "LOSS WITHOUT STOP-LOSS HIT")
        self.assertEqual(res["entry_triggered"], 1)
        self.assertEqual(res["target_hit"], 0)
        self.assertEqual(res["stop_loss_hit"], 0)
        self.assertLess(res["actual_intraday_return_pct"], 0)

    def test_sha256_immutable_hash_integrity(self):
        """Verifies that SHA-256 hash changes if any parameter is altered."""
        h1 = compute_prediction_hash(self.sample_pred)
        
        altered = dict(self.sample_pred)
        altered["target_price"] = 110.05
        h2 = compute_prediction_hash(altered)
        
        self.assertNotEqual(h1, h2)

    def test_scorecard_mathematical_consistency(self):
        """Verifies scorecard math on seeded dataset."""
        res = calculate_scorecard()
        sc = res["scorecard"]
        
        self.assertEqual(sc["total_predictions"], 18)
        self.assertEqual(sc["total_predictions"], sc["triggered_predictions"] + sc["untriggered_predictions"])
        self.assertEqual(sc["correct_direction_predictions"] + sc["incorrect_direction_predictions"], sc["total_predictions"])
        self.assertGreater(sc["profit_factor"], 0)
        self.assertGreater(sc["win_loss_ratio"], 0)
        self.assertGreater(sc["maximum_drawdown_pct"], 0)

    def test_full_denominator_accounting(self):
        """Ensures that directional accuracy is computed against total predictions (full denominator)."""
        res = calculate_scorecard()
        sc = res["scorecard"]
        
        expected_dir_acc = round((sc["correct_direction_predictions"] / sc["total_predictions"]) * 100, 2)
        self.assertEqual(sc["directional_accuracy_pct"], expected_dir_acc)

if __name__ == "__main__":
    unittest.main()
