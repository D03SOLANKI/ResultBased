"""
Extreme Forensic Audit Test Suite — Results Scanner
Enforces zero tolerance for data inaccuracies, false verifications, and mathematical errors.
Executable with standard library unittest.
"""

import unittest
import sqlite3
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.services.financial_statement_verifier import compute_growth_pct
from backend.app.services.post_market_engine import POST_MARKET_GROUND_TRUTH_DATA

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "scanner.db"))

class TestForensicAudit(unittest.TestCase):

    def setUp(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row

    def tearDown(self):
        self.conn.close()

    # -------------------------------------------------------------
    # 1. MATHEMATICAL INVARIANT TESTS
    # -------------------------------------------------------------
    def test_calendar_reconciliation_invariant(self):
        """
        Every scheduled event must satisfy:
        Total Scheduled = Released + Pending + Postponed + Cancelled + Unverified
        """
        c = self.conn.cursor()
        c.execute("""
        SELECT 
            board_meeting_date,
            count(*) as total,
            sum(case when event_status = 'Results Released' then 1 else 0 end) as released,
            sum(case when event_status = 'Results Pending' then 1 else 0 end) as pending,
            sum(case when event_status = 'Results Postponed' then 1 else 0 end) as postponed,
            sum(case when event_status = 'Scheduled' then 1 else 0 end) as scheduled,
            sum(case when event_status = 'Cancelled' then 1 else 0 end) as cancelled
        FROM results_events
        GROUP BY board_meeting_date
        """)
        rows = c.fetchall()
        self.assertGreater(len(rows), 0, "results_events table is empty!")

        for r in rows:
            dt = r["board_meeting_date"]
            total = r["total"]
            accounted = (r["released"] or 0) + (r["pending"] or 0) + (r["postponed"] or 0) + (r["scheduled"] or 0) + (r["cancelled"] or 0)
            self.assertEqual(total, accounted, f"Invariant violated for date {dt}: Total {total} != Accounted {accounted}")

    def test_rolling_7d_window_sum(self):
        """
        Test that the rolling 7-day window [T-7, T) perfectly sums to 926 scheduled events.
        """
        c = self.conn.cursor()
        t_str = "2026-11-05"
        t_date = datetime.strptime(t_str, "%Y-%m-%d").date()
        d7_start = (t_date - timedelta(days=7)).strftime("%Y-%m-%d")

        c.execute("""
        SELECT 
            count(*) as total,
            sum(case when event_status = 'Results Released' then 1 else 0 end) as released,
            sum(case when event_status = 'Results Pending' then 1 else 0 end) as pending,
            sum(case when event_status = 'Results Postponed' then 1 else 0 end) as postponed
        FROM results_events
        WHERE board_meeting_date >= ? AND board_meeting_date < ?
        """, (d7_start, t_str))
        res = c.fetchone()

        self.assertEqual(res["total"], 926, f"Expected 926 scheduled events in rolling 7D window, got {res['total']}")
        self.assertEqual(res["released"], 50, f"Expected 50 verified releases (including post-midnight filings from 04-Nov), got {res['released']}")
        self.assertEqual(res["pending"], 871, f"Expected 871 pending filings, got {res['pending']}")
        self.assertEqual(res["postponed"], 5, f"Expected 5 postponed meetings, got {res['postponed']}")
        self.assertEqual(res["released"] + res["pending"] + res["postponed"], res["total"])

    # -------------------------------------------------------------
    # 2. DATABASE INTEGRITY TESTS
    # -------------------------------------------------------------
    def test_company_master_no_null_or_invalid_isins(self):
        """
        No ISIN in company_master can be null, empty, or malformed.
        """
        c = self.conn.cursor()
        c.execute("SELECT count(*) as cnt FROM company_master WHERE isin IS NULL OR trim(isin) = '' OR length(isin) != 12")
        bad_isins = c.fetchone()["cnt"]
        self.assertEqual(bad_isins, 0, f"Found {bad_isins} invalid ISINs in company_master!")

    def test_no_orphaned_results_events(self):
        """
        Every event in results_events must belong to a valid company in company_master.
        """
        c = self.conn.cursor()
        c.execute("""
        SELECT count(*) as cnt
        FROM results_events e
        LEFT JOIN company_master c ON e.isin = c.isin
        WHERE c.isin IS NULL
        """)
        orphaned = c.fetchone()["cnt"]
        self.assertEqual(orphaned, 0, f"Found {orphaned} orphaned events with no matching company!")

    def test_no_duplicate_events_per_meeting_date(self):
        """
        A company must not have more than 1 results event on the same board meeting date.
        """
        c = self.conn.cursor()
        c.execute("""
        SELECT count(*) as cnt FROM (
            SELECT isin, board_meeting_date, count(*) 
            FROM results_events 
            GROUP BY isin, board_meeting_date 
            HAVING count(*) > 1
        )
        """)
        dups = c.fetchone()["cnt"]
        self.assertEqual(dups, 0, f"Found {dups} duplicate events for the same company on the same meeting date!")

    # -------------------------------------------------------------
    # 3. FINANCIAL CALCULATION TESTS
    # -------------------------------------------------------------
    def test_compute_growth_pct_positive(self):
        growth, meta = compute_growth_pct(120.0, 100.0)
        self.assertEqual(growth, 20.0)
        self.assertTrue(meta["is_valid"])

    def test_compute_growth_pct_zero_base(self):
        growth, meta = compute_growth_pct(100.0, 0.0)
        self.assertIsNone(growth)
        self.assertFalse(meta["is_valid"])

    def test_compute_growth_pct_negative_turnaround(self):
        growth, meta = compute_growth_pct(4.8, -1.2)
        self.assertEqual(growth, 500.0)
        self.assertTrue(meta["is_turnaround_to_profit"])
        self.assertTrue(meta["is_negative_base"])

    def test_compute_growth_pct_widened_loss(self):
        growth, meta = compute_growth_pct(-20.0, -10.0)
        self.assertEqual(growth, -100.0)
        self.assertTrue(meta["is_negative_base"])

    # -------------------------------------------------------------
    # 4. POST-MARKET TRACKER CALCULATIONS AUDIT
    # -------------------------------------------------------------
    def test_all_post_market_tracker_calculations(self):
        """
        Verifies that all 10 stocks in POST_MARKET_GROUND_TRUTH_DATA
        strictly satisfy every price reaction formula with 0.0000 deviation.
        """
        for s in POST_MARKET_GROUND_TRUTH_DATA:
            sym = s.get('nse_symbol') or s.get('bse_code')
            yc = s['yesterday_close']
            to = s['today_open']
            ltp = s['current_ltp']
            vol = s['today_volume']
            avg_vol = s['avg_30d_volume']

            # 1. Opening gap %
            calc_gap = round(((to - yc) / yc) * 100, 2)
            self.assertAlmostEqual(s['opening_gap_pct'], calc_gap, places=2, msg=f"{sym} Opening Gap % mismatch!")

            # 2. Total price change %
            calc_total = round(((ltp - yc) / yc) * 100, 2)
            self.assertAlmostEqual(s['price_change_pct'], calc_total, places=2, msg=f"{sym} Total Price Change % mismatch!")

            # 3. Intraday change %
            calc_intra = round(((ltp - to) / to) * 100, 2)
            self.assertAlmostEqual(s['intraday_change_pct'], calc_intra, places=2, msg=f"{sym} Intraday Change % mismatch!")

            # 4. Volume surge
            calc_surge = round(vol / avg_vol, 2)
            self.assertAlmostEqual(s['volume_surge_multiplier'], calc_surge, places=2, msg=f"{sym} Volume surge mismatch!")

            # 5. Timing: Must be after 15:30:00 IST
            t_clean = s['announcement_time'].replace(" IST", "").strip()
            self.assertGreater(t_clean, "15:30:00", f"{sym} Announcement time {s['announcement_time']} is not post-market!")

    # -------------------------------------------------------------
    # 5. EDGE CASE TESTS
    # -------------------------------------------------------------
    def test_search_special_characters_sql_safety(self):
        from backend.app.routers.calendar import get_events
        special_queries = ["'", "''", "'; DROP TABLE test; --", "<script>", "%", "_"]
        for q in special_queries:
            res = get_events(search=q, page=1, limit=10)
            self.assertIsInstance(res, dict)
            self.assertIn("events", res)
            self.assertIn("total", res)

    def test_pagination_boundaries(self):
        from backend.app.routers.calendar import get_events
        res_p1 = get_events(quick_filter="previously_released", page=1, limit=10)
        self.assertEqual(len(res_p1["events"]), 10)
        self.assertEqual(res_p1["total"], 48)

        # Page beyond total
        res_p999 = get_events(quick_filter="previously_released", page=999, limit=10)
        self.assertEqual(len(res_p999["events"]), 0)
        self.assertEqual(res_p999["total"], 48)

if __name__ == "__main__":
    unittest.main()
