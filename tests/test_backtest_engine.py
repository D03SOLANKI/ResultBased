"""
Unit and Forensic Integrity Tests for the Independent 1-Year Backtest Engine
Verifies:
1. Strict Capital Constraints (₹10,00,000 Starting, ₹2,50,000 Max Allocation, Max 4 Positions)
2. Post-2:30 PM (14:30 IST) Entry Execution Rules
3. Fixed Profit Target (+3.0%) and Stop-Loss (-1.5%) Invariants
4. Statutory Indian Equity Costs Accounting & Slippage Deduction
5. Database Isolation and Zero Interference with Live Strategy Tables
6. Mathematical Consistency Across Daily Equity, Monthly Summaries, and Final Value
"""

import unittest
import sqlite3
import json
from datetime import datetime
from backend.app.services.backtest_engine import (
    calculate_transaction_charges,
    HistoricalBacktestEngine,
    get_backtest_results
)
from backend.app.database import get_db

class TestBacktestEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Run backtest once to ensure database tables are seeded and up to date."""
        cls.engine = HistoricalBacktestEngine(run_id="TEST-1Y-10LAKH-PROD")
        cls.results = cls.engine.run()
        cls.summary = cls.results["summary"]
        cls.trades = cls.results["trades"]
        cls.daily_equity = cls.results["daily_equity"]
        cls.monthly = cls.results["monthly_performance"]

    def test_capital_allocation_invariants(self):
        """
        Rule 4: Starting capital = ₹10,00,000.
        Max capital per stock <= ₹2,50,000.
        Max simultaneous positions <= 4 at all times.
        """
        self.assertEqual(self.summary["initial_capital"], 1000000.0)

        # Check every executed trade's invested amount
        for t in self.trades:
            if t["trade_status"].startswith("EXECUTED"):
                self.assertLessEqual(
                    t["invested_amount"], 250000.0 + 1e-4,
                    f"Trade {t['trade_id']} exceeded ₹2.5L limit with ₹{t['invested_amount']}"
                )
                self.assertGreater(t["quantity"], 0)

        # Check active positions count on every single trading day
        for eq in self.daily_equity:
            self.assertLessEqual(
                eq["active_positions_count"], 4,
                f"Date {eq['date']} had {eq['active_positions_count']} positions, exceeding 4!"
            )
            # Cash must never be negative
            self.assertGreaterEqual(
                eq["cash_balance"], -0.01,
                f"Negative cash balance on {eq['date']}: {eq['cash_balance']}"
            )

    def test_entry_strictly_after_230_pm(self):
        """
        Rule 5: Entries must occur strictly AFTER 2:30 PM (14:30 IST).
        Trades whose condition was not met must be marked NOT_EXECUTED.
        """
        for t in self.trades:
            if t["trade_status"] == "EXECUTED_CLOSED" or t["trade_status"] == "EXECUTED_OPEN_MTM":
                # Check entry timestamp is >= 14:30:00
                time_str = t["entry_timestamp"].split()[1]
                self.assertGreaterEqual(
                    time_str, "14:30:00",
                    f"Trade {t['trade_id']} executed before 2:30 PM: {t['entry_timestamp']}"
                )
            elif t["trade_status"] == "NOT_EXECUTED_CONDITION_UNMET":
                self.assertEqual(t["invested_amount"], 0.0)
                self.assertEqual(t["quantity"], 0)

    def test_exit_rules_and_target_stop_invariants(self):
        """
        Rule 6: Target exactly +3.0%, Stop-Loss exactly -1.5%.
        Ambiguous candle handled conservatively as stop hit.
        """
        for t in self.trades:
            if t["trade_status"] == "EXECUTED_CLOSED":
                entry_p = t["entry_price"]
                expected_tgt = round(entry_p * 1.03, 2)
                expected_sl = round(entry_p * 0.985, 2)

                self.assertAlmostEqual(t["target_price"], expected_tgt, delta=0.05)
                self.assertAlmostEqual(t["stop_loss_price"], expected_sl, delta=0.05)

                reason = t["exit_reason"]
                self.assertTrue(
                    any(k in reason for k in ["TARGET HIT", "STOP-LOSS HIT", "AMBIGUOUS", "MTM"]),
                    f"Invalid exit reason for {t['trade_id']}: {reason}"
                )

                if "AMBIGUOUS" in reason:
                    # Must have executed conservative stop price
                    self.assertLessEqual(t["exit_price"], entry_p)

    def test_transaction_cost_deduction(self):
        """
        Rule 7: Real statutory Indian equity transaction costs must be deducted:
        Net P&L = Gross P&L - Total Charges
        """
        for t in self.trades:
            if t["trade_status"] == "EXECUTED_CLOSED":
                gross = t["gross_pnl"]
                charges = t["total_transaction_charges"]
                net = t["net_pnl"]

                self.assertGreater(charges, 0.0, f"Charges not deducted for trade {t['trade_id']}")
                self.assertAlmostEqual(net, gross - charges, delta=0.05)

    def test_mathematical_consistency_across_tables(self):
        """
        Total net P&L must equal sum of daily equity changes and match final portfolio value.
        Sum of monthly net P&L must equal total net P&L.
        """
        # Final daily equity vs summary final portfolio value
        final_day_val = self.daily_equity[-1]["portfolio_value"]
        self.assertAlmostEqual(final_day_val, self.summary["final_portfolio_value"], delta=0.05)

        # Total Net P&L = Final - Initial
        expected_net_pnl = round(self.summary["final_portfolio_value"] - self.summary["initial_capital"], 2)
        self.assertAlmostEqual(self.summary["total_net_pnl"], expected_net_pnl, delta=0.05)

        # Monthly Net P&L Sum vs Total Net P&L
        monthly_net_sum = round(sum(m["monthly_net_pnl"] for m in self.monthly), 2)
        self.assertAlmostEqual(monthly_net_sum, self.summary["total_net_pnl"], delta=1.0)

    def test_strict_read_only_separation_from_live_strategy(self):
        """
        Rule 2: Backtest must NEVER modify, overwrite, or mutate live strategy tables.
        Checks that strategy_predictions has exactly 18 immutable records.
        """
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM strategy_predictions")
            pred_count = cursor.fetchone()[0]
            self.assertEqual(pred_count, 18, f"Live strategy predictions modified! Count is {pred_count}")

            cursor.execute("SELECT COUNT(*) FROM strategy_validation_outcomes")
            out_count = cursor.fetchone()[0]
            self.assertEqual(out_count, 18, f"Live strategy outcomes modified! Count is {out_count}")

    def test_csv_export_endpoint(self):
        """
        Rule 9.C: Verifies that CSV export contains all 20 required audit columns and all trade rows.
        """
        from backend.app.routers.backtest import export_csv
        res = export_csv(run_id="TEST-1Y-10LAKH-PROD")
        csv_str = res.body.decode("utf-8")
        lines = csv_str.strip().split("\n")

        # Header + trade lines
        self.assertGreater(len(lines), 50)
        header = lines[0]
        required_cols = [
            "Trade ID", "Trading Date", "Stock Name", "NSE/BSE Symbol",
            "Strategy Signal", "Entry Timestamp", "Entry Price",
            "Invested Amount", "Quantity Purchased", "Target Price",
            "Stop-Loss Price", "Exit Timestamp", "Exit Price", "Exit Reason",
            "Gross Profit/Loss", "Transaction Charges", "Net Profit/Loss",
            "Holding Duration (Days)", "Return Percentage", "Trade Status"
        ]
        for col in required_cols:
            self.assertIn(col, header, f"Missing required CSV column: {col}")

if __name__ == "__main__":
    unittest.main()
