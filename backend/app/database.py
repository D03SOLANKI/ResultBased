import sqlite3
import os
from contextlib import contextmanager

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "scanner.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Company Master Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS company_master (
            isin TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            nse_symbol TEXT,
            nse_series TEXT,
            bse_code TEXT,
            bse_scrip_id TEXT,
            bse_group TEXT,
            listing_segment TEXT NOT NULL DEFAULT 'Mainboard',
            market_cap_cr REAL,
            market_cap_category TEXT,
            amfi_rank INTEGER,
            industry TEXT,
            is_dual_listed INTEGER DEFAULT 0,
            listing_status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cm_nse ON company_master(nse_symbol);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cm_bse ON company_master(bse_code);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cm_mcap ON company_master(market_cap_category);")

        # 2. Results Events Table (STRICTLY Financial Results & Performance Updates Only)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS results_events (
            event_id TEXT PRIMARY KEY,
            isin TEXT NOT NULL,
            company_name TEXT NOT NULL,
            nse_symbol TEXT,
            bse_code TEXT,
            result_category TEXT NOT NULL,      -- Quarterly Results / Half-Yearly Results / Annual Results / Monthly Update
            financial_period TEXT,              -- Q1 / Q2 / Q3 / Q4 / H1 / Annual / Monthly
            financial_year TEXT,
            result_type TEXT,                  -- Standalone / Consolidated / Audited / Unaudited
            board_meeting_date TEXT NOT NULL,  -- Scheduled release date
            expected_results_date TEXT NOT NULL,
            actual_results_date TEXT,
            actual_results_time TEXT,
            announcement_date TEXT,
            announcement_time TEXT,
            announcement_source TEXT,
            nse_source_url TEXT,
            bse_source_url TEXT,
            verification_status TEXT DEFAULT 'Verified',
            event_status TEXT DEFAULT 'Scheduled',
            last_checked_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (isin) REFERENCES company_master(isin) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_re_date ON results_events(board_meeting_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_re_isin ON results_events(isin);")

        # Migrate column if needed
        try:
            cursor.execute("ALTER TABLE results_events ADD COLUMN result_category TEXT;")
        except Exception:
            pass

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_re_cat ON results_events(result_category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_re_status ON results_events(event_status);")

        # 3. Event Audit History Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_audit_history (
            history_id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            isin TEXT NOT NULL,
            previous_meeting_date TEXT,
            new_meeting_date TEXT,
            previous_status TEXT,
            new_status TEXT,
            change_reason TEXT,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 4. Announcements Stream (Filtered for Financial Results Only)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS announcements (
            announcement_id TEXT PRIMARY KEY,
            isin TEXT,
            exchange TEXT NOT NULL,
            symbol_or_code TEXT NOT NULL,
            company_name TEXT NOT NULL,
            headline TEXT,
            description TEXT,
            attachment_url TEXT,
            published_at TIMESTAMP,
            is_board_meeting INTEGER DEFAULT 0,
            is_financial_results INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 5. Company Financial Performance & Comparative Analysis Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS company_financial_performance (
            performance_id TEXT PRIMARY KEY,
            isin TEXT NOT NULL,
            company_name TEXT NOT NULL,
            nse_symbol TEXT,
            bse_code TEXT,
            financial_period TEXT NOT NULL,         -- e.g. "Q2 FY27", "H1 FY27", "FY26"
            period_ended TEXT NOT NULL,             -- e.g. "2026-09-30"
            filing_date TEXT NOT NULL,              -- e.g. "2026-11-02"
            filing_time TEXT,                       -- e.g. "14:48:28 IST"
            filing_url TEXT,
            is_latest INTEGER DEFAULT 1,
            filing_type TEXT DEFAULT 'Consolidated', -- Consolidated or Standalone
            
            -- Current / Latest Released Metrics
            revenue_cr REAL,
            ebitda_cr REAL,
            ebitda_margin_pct REAL,
            pat_cr REAL,
            pat_margin_pct REAL,
            eps REAL,

            -- Sequential (Previous Quarter Q-o-Q) Baseline
            prev_quarter_period TEXT,
            prev_quarter_revenue_cr REAL,
            prev_quarter_pat_cr REAL,
            prev_quarter_eps REAL,

            -- Year-on-Year (Same Quarter Last Year Y-o-Y) Baseline
            prev_year_period TEXT,
            prev_year_revenue_cr REAL,
            prev_year_pat_cr REAL,
            prev_year_eps REAL,

            -- Computed Growth / Comparative Metrics
            revenue_growth_qoq_pct REAL,
            revenue_growth_yoy_pct REAL,
            pat_growth_qoq_pct REAL,
            pat_growth_yoy_pct REAL,
            eps_growth_qoq_pct REAL,
            eps_growth_yoy_pct REAL,
            margin_change_yoy_bps REAL,

            -- Qualitative Indicators & Highlights
            performance_verdict TEXT,              -- "Strong Improvement / Beat", "Moderate Improvement", "Mixed", "Deteriorated", "Severe Decline"
            verdict_badge_color TEXT,              -- "emerald", "blue", "amber", "rose", "red"
            key_highlights TEXT,                   -- Executive summary bullet points

            -- Stock Price Impact Reaction
            pre_result_price REAL,
            post_result_price REAL,
            price_change_pct REAL,
            price_reaction_type TEXT,              -- "Surge (+3% to +10%)", "Mild Gain", "Muted / Flat", "Mild Dip", "Sharp Decline"
            volume_spike_multiplier REAL,          -- e.g. 2.4 (2.4x 30-day average)
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (isin) REFERENCES company_master(isin) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cfp_isin ON company_financial_performance(isin);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cfp_period ON company_financial_performance(financial_period);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cfp_latest ON company_financial_performance(is_latest);")

        # 6. Verified Primary Financial Statements (Independent Standalone & Consolidated Records)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS verified_financial_statements (
            statement_id TEXT PRIMARY KEY,
            isin TEXT NOT NULL,
            company_name TEXT NOT NULL,
            nse_symbol TEXT,
            bse_code TEXT,
            reporting_basis TEXT NOT NULL,          -- Standalone or Consolidated
            financial_period TEXT NOT NULL,         -- e.g. "Q2 FY27", "H1 FY27", "FY26"
            period_ended TEXT NOT NULL,             -- e.g. "2026-09-30"
            filing_date TEXT NOT NULL,              -- e.g. "2026-11-02"
            filing_time TEXT,                       -- e.g. "14:15:30 IST"
            filing_id TEXT,
            source_url TEXT,
            exchange TEXT NOT NULL,                 -- NSE or BSE
            
            -- Rupee Values (INR Crores)
            revenue_ops_cr REAL,
            other_income_cr REAL,
            total_income_cr REAL,
            total_expenses_cr REAL,
            ebitda_cr REAL,
            pbt_cr REAL,
            tax_cr REAL,
            pat_cr REAL,
            eps REAL,

            -- Prior Corresponding Period (Y-o-Y Baseline)
            prev_year_period TEXT,
            prev_year_revenue_ops_cr REAL,
            prev_year_pat_cr REAL,
            prev_year_eps REAL,

            -- Prior Sequential Period (Q-o-Q Baseline)
            prev_quarter_period TEXT,
            prev_quarter_revenue_ops_cr REAL,
            prev_quarter_pat_cr REAL,
            prev_quarter_eps REAL,

            -- Computed Growth (%)
            pat_growth_yoy_pct REAL,
            revenue_growth_yoy_pct REAL,
            pat_growth_qoq_pct REAL,
            revenue_growth_qoq_pct REAL,

            -- Accounting & Anomaly Flags
            is_turnaround_to_profit INTEGER DEFAULT 0,
            is_turnaround_to_loss INTEGER DEFAULT 0,
            is_negative_base INTEGER DEFAULT 0,
            exceptional_items_cr REAL DEFAULT 0,
            verification_status TEXT DEFAULT 'VERIFIED_OFFICIAL',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (isin) REFERENCES company_master(isin) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vfs_isin_basis ON verified_financial_statements(isin, reporting_basis);")

        # 7. Verified Exchange Stock Market Reactions (Authentic Exchange Traded Prices)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS verified_market_reactions (
            reaction_id TEXT PRIMARY KEY,
            isin TEXT NOT NULL,
            company_name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            exchange TEXT NOT NULL DEFAULT 'NSE',
            announcement_date TEXT NOT NULL,        -- 2026-11-02
            announcement_time TEXT,                 -- 14:15:30 IST
            market_session TEXT NOT NULL,           -- 'During Market Hours' or 'Post-Market Hours'
            
            -- Traded Price Metrics (INR)
            prev_close REAL NOT NULL,
            announcement_open REAL,
            announcement_high REAL,
            announcement_low REAL,
            announcement_close REAL NOT NULL,
            announcement_volume INTEGER,
            
            -- Next Trading Day Absorption
            next_trading_day TEXT,
            next_day_open REAL,
            next_day_high REAL,
            next_day_low REAL,
            next_day_close REAL,
            next_day_volume INTEGER,
            
            -- 30-Day Benchmark Volume
            avg_30d_volume INTEGER,
            volume_surge_multiplier REAL,
            
            -- Verified Exact Returns (%)
            daily_close_return_pct REAL NOT NULL,
            intraday_reaction_pct REAL,
            next_day_return_pct REAL,
            total_reaction_pct REAL,                -- Primary reaction depending on market hours
            
            -- Categorization & Audit
            market_reaction_verdict TEXT,           -- 'Beat & Rallied', 'Beat but Sold Off', 'Missed & Dropped', 'Missed but Rallied', 'Flat / Priced In'
            price_source TEXT NOT NULL,             -- 'NSE Official Bhavcopy / Traded Feed'
            verification_status TEXT DEFAULT 'VERIFIED_GROUND_TRUTH',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (isin) REFERENCES company_master(isin) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vmr_isin ON verified_market_reactions(isin);")

        # 8. Data Verification Audit Log (Full audit trail of discrepancies)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_verification_audit_log (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            isin TEXT NOT NULL,
            company_name TEXT NOT NULL,
            symbol TEXT,
            metric_category TEXT NOT NULL,          -- 'FINANCIAL_GROWTH', 'STOCK_PRICE', 'REPORTING_BASIS', 'PERIOD_CLASSIFICATION'
            field_name TEXT NOT NULL,
            old_displayed_value TEXT NOT NULL,
            verified_ground_truth_value TEXT NOT NULL,
            discrepancy_magnitude TEXT,
            root_cause_explanation TEXT NOT NULL,
            primary_source_reference TEXT NOT NULL,
            logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dval_isin ON data_verification_audit_log(isin);")

        # 9. Post-Market Earnings Reaction Tracker
        # Independent analytical surveillance tracking next-day market reaction of post-market earnings releases
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS post_market_earnings_tracker (
            tracker_id TEXT PRIMARY KEY,
            isin TEXT NOT NULL,
            company_name TEXT NOT NULL,
            nse_symbol TEXT,
            bse_code TEXT,
            exchange TEXT NOT NULL DEFAULT 'NSE',
            industry TEXT,
            market_cap_cr REAL,
            market_cap_category TEXT,
            
            -- Announcement Details (Announced After Market Hours Yesterday)
            results_date TEXT NOT NULL,             -- Yesterday's date (e.g. 2026-11-04)
            announcement_time TEXT NOT NULL,         -- Released post 15:30 IST (e.g. 18:15:00 IST)
            filing_url TEXT,
            financial_period TEXT NOT NULL,         -- e.g. "Q2 FY27"
            reporting_basis TEXT DEFAULT 'Consolidated',
            
            -- Reported Financial Figures
            revenue_cr REAL,
            revenue_growth_yoy_pct REAL,
            pat_cr REAL,
            pat_growth_yoy_pct REAL,
            ebitda_cr REAL,
            ebitda_margin_pct REAL,
            eps REAL,
            financial_verdict TEXT,                 -- "Strong Beat", "Moderate Beat", "Inline", "Disappointment / Miss", "Turnaround"
            
            -- Today's Trading Session Performance Benchmarks
            tracking_date TEXT NOT NULL,            -- Today's session date (e.g. 2026-11-05)
            yesterday_close REAL NOT NULL,          -- Benchmark closing price before announcement
            today_open REAL NOT NULL,               -- Market open price at 09:15 IST
            opening_gap_pct REAL NOT NULL,          -- ((today_open - yesterday_close) / yesterday_close) * 100
            today_high REAL NOT NULL,
            today_low REAL NOT NULL,
            current_ltp REAL NOT NULL,              -- Latest traded price in today's market session
            price_change_pct REAL NOT NULL,         -- Total change vs yesterday close: ((current_ltp - yesterday_close) / yesterday_close) * 100
            intraday_change_pct REAL NOT NULL,      -- Intraday progression from open: ((current_ltp - today_open) / today_open) * 100
            today_volume INTEGER,
            avg_30d_volume INTEGER,
            volume_surge_multiplier REAL,
            
            -- Reaction Behavioral Pattern
            reaction_pattern TEXT NOT NULL,         -- 'Gap Up & Rally', 'Gap Up & Fade', 'Gap Down & Sell-off', 'Gap Down & Reversal', 'Muted / Flat'
            price_movement_narrative TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (isin) REFERENCES company_master(isin) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pmet_track_date ON post_market_earnings_tracker(tracking_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pmet_res_date ON post_market_earnings_tracker(results_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pmet_isin ON post_market_earnings_tracker(isin);")

        # =========================================================================
        # 10. Strategy Predictions Table (Immutable Forward Prediction Log)
        # =========================================================================
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS strategy_predictions (
            prediction_id TEXT PRIMARY KEY,
            prediction_timestamp TEXT NOT NULL,     -- Strictly precedes market session or announcement
            trading_date TEXT NOT NULL,             -- Market execution date (YYYY-MM-DD)
            isin TEXT NOT NULL,
            company_name TEXT NOT NULL,
            nse_symbol TEXT,
            bse_code TEXT,
            industry TEXT,
            market_cap_category TEXT,
            
            -- Strategy Metadata
            strategy_name TEXT NOT NULL,            -- e.g. 'Post-Market Earnings Breakout', 'Pre-Earnings Momentum'
            strategy_version TEXT NOT NULL,         -- e.g. 'v1.0-Production'
            strategy_config TEXT NOT NULL,          -- JSON string of strategy parameters
            
            -- Signal & Price Targets
            signal TEXT NOT NULL,                   -- 'BUY', 'SELL', 'WATCH'
            expected_direction TEXT NOT NULL,       -- 'LONG', 'SHORT', 'NEUTRAL'
            buy_above_price REAL NOT NULL,          -- Trigger threshold
            expected_entry_price REAL NOT NULL,     -- Base expected fill price
            stop_loss REAL NOT NULL,
            target_price REAL NOT NULL,
            risk_reward_ratio REAL NOT NULL,
            predicted_return_pct REAL NOT NULL,
            confidence_score REAL NOT NULL,         -- 0.00 to 1.00
            holding_period TEXT NOT NULL,           -- 'Intraday (T+0)', 'Overnight (T+1)', 'Swing (T+2)'
            announcement_timing TEXT NOT NULL,      -- 'AFTER_MARKET', 'BEFORE_MARKET', 'DURING_MARKET', 'PRE_EARNINGS'
            
            -- Selection Rationale & Result Context
            selection_reason TEXT NOT NULL,
            financial_result_context TEXT,          -- Details of earnings report if applicable
            
            -- Audit Integrity
            immutable_hash TEXT NOT NULL,           -- SHA-256 of prediction contents to ensure zero lookahead/tampering
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (isin) REFERENCES company_master(isin) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sp_date ON strategy_predictions(trading_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sp_isin ON strategy_predictions(isin);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sp_strat ON strategy_predictions(strategy_name, strategy_version);")

        # =========================================================================
        # 11. Strategy Validation Outcomes (Ground-Truth Market Cross-Verification)
        # =========================================================================
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS strategy_validation_outcomes (
            outcome_id TEXT PRIMARY KEY,
            prediction_id TEXT NOT NULL UNIQUE,
            evaluation_timestamp TEXT NOT NULL,
            
            -- Actual Market Traded Benchmarks (NSE/BSE Bhavcopy Ground Truth)
            actual_open REAL NOT NULL,
            actual_high REAL NOT NULL,
            actual_low REAL NOT NULL,
            actual_close REAL NOT NULL,
            actual_volume INTEGER NOT NULL,
            actual_next_day_close REAL,             -- For multi-day evaluations
            
            -- Execution Verification
            entry_triggered INTEGER NOT NULL,       -- 1 if high >= buy_above_price (LONG), 0 otherwise
            entry_price_executed REAL,              -- Actual executed entry price
            target_hit INTEGER NOT NULL,            -- 1 if high >= target_price (LONG)
            stop_loss_hit INTEGER NOT NULL,         -- 1 if low <= stop_loss (LONG)
            
            -- Outcome Classification (Strict 8-State Schema + AMBIGUOUS)
            -- 'TARGET HIT', 'STOP-LOSS HIT', 'PROFITABLE BUT TARGET NOT HIT', 
            -- 'LOSS WITHOUT STOP-LOSS HIT', 'NO MOVEMENT', 'SIGNAL INVALIDATED', 
            -- 'ENTRY NEVER TRIGGERED', 'INSUFFICIENT DATA', 'AMBIGUOUS'
            outcome_classification TEXT NOT NULL,
            
            -- Actual Measured Returns (%)
            actual_intraday_return_pct REAL NOT NULL, -- ((actual_close - entry_price) / entry_price) * 100
            actual_max_favorable_pct REAL NOT NULL,   -- ((actual_high - entry_price) / entry_price) * 100
            actual_max_adverse_pct REAL NOT NULL,     -- ((actual_low - entry_price) / entry_price) * 100
            actual_1d_return_pct REAL,                -- Next-day close vs entry
            actual_2d_return_pct REAL,                -- T+2 close vs entry
            
            -- Directional and Deviation Validation
            is_direction_correct INTEGER NOT NULL,   -- 1 if market moved in expected direction, 0 otherwise
            prediction_deviation_pct REAL NOT NULL,  -- (actual_return - predicted_return)
            
            -- Verification Provenance
            data_source TEXT NOT NULL,               -- e.g. 'NSE Official Bhavcopy / Traded Feed'
            verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (prediction_id) REFERENCES strategy_predictions(prediction_id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_svo_pred ON strategy_validation_outcomes(prediction_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_svo_class ON strategy_validation_outcomes(outcome_classification);")

        # =========================================================================
        # 12. Strategy Error & Failure Post-Mortem Analysis
        # =========================================================================
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS strategy_error_analysis (
            analysis_id TEXT PRIMARY KEY,
            prediction_id TEXT NOT NULL UNIQUE,
            failure_category TEXT NOT NULL,         -- 'Profit Booking / Sell-on-News', 'Valuation Multiple Compression', 'False Breakout / Liquidity Trap', 'Pre-Market Gap Exhaustion', 'Broader Market Drag', 'Target Slippage'
            primary_cause TEXT NOT NULL,
            market_context TEXT NOT NULL,
            expected_vs_actual_discrepancy TEXT NOT NULL,
            recurring_pattern TEXT NOT NULL,
            recommended_improvement TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (prediction_id) REFERENCES strategy_predictions(prediction_id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sea_pred ON strategy_error_analysis(prediction_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sea_cat ON strategy_error_analysis(failure_category);")

        # =========================================================================
        # 13. INDEPENDENT HISTORICAL BACKTEST ENGINE SCHEMA (₹10,00,000 Portfolio)
        # =========================================================================
        # Isolated schema for multi-month / 1-year historical portfolio backtests
        # Strict separation: Read-only access to live strategy tables, zero interference.

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS backtest_portfolio_runs (
            run_id TEXT PRIMARY KEY,
            run_name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            initial_capital REAL NOT NULL DEFAULT 1000000.0,
            final_portfolio_value REAL NOT NULL,
            total_net_pnl REAL NOT NULL,
            total_return_pct REAL NOT NULL,
            cagr_pct REAL NOT NULL,
            total_trades INTEGER NOT NULL,
            winning_trades INTEGER NOT NULL,
            losing_trades INTEGER NOT NULL,
            win_rate_pct REAL NOT NULL,
            target_hit_count INTEGER NOT NULL,
            target_hit_rate_pct REAL NOT NULL,
            stop_loss_hit_count INTEGER NOT NULL,
            stop_loss_hit_rate_pct REAL NOT NULL,
            ambiguous_trades_count INTEGER NOT NULL DEFAULT 0,
            skipped_trades_count INTEGER NOT NULL DEFAULT 0,
            not_executed_trades_count INTEGER NOT NULL DEFAULT 0,
            avg_profit_per_win REAL NOT NULL,
            avg_loss_per_loss REAL NOT NULL,
            max_drawdown_pct REAL NOT NULL,
            max_drawdown_amount REAL NOT NULL,
            profit_factor REAL NOT NULL,
            total_brokerage_and_charges REAL NOT NULL,
            total_slippage_cost REAL NOT NULL,
            unused_cash REAL NOT NULL,
            open_positions_count INTEGER NOT NULL DEFAULT 0,
            open_positions_mtm_value REAL NOT NULL DEFAULT 0.0,
            parameters_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS backtest_trades (
            trade_id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            signal_date TEXT NOT NULL,
            entry_date TEXT NOT NULL,
            company_name TEXT NOT NULL,
            isin TEXT NOT NULL,
            symbol TEXT NOT NULL,
            exchange TEXT NOT NULL DEFAULT 'NSE',
            market_cap_category TEXT,
            industry TEXT,
            strategy_name TEXT NOT NULL,
            strategy_signal TEXT NOT NULL DEFAULT 'BUY',
            entry_timestamp TEXT NOT NULL,          -- Must be strictly >= 14:30:00 IST
            entry_price REAL NOT NULL,              -- Actual executed entry price post-2:30 PM
            invested_amount REAL NOT NULL,          -- Capital allocated (Max ₹2,50,000)
            quantity INTEGER NOT NULL,
            target_price REAL NOT NULL,             -- Exactly +3.0%
            stop_loss_price REAL NOT NULL,          -- Exactly -1.5%
            exit_date TEXT,
            exit_timestamp TEXT,
            exit_price REAL,
            exit_reason TEXT,                       -- 'TARGET HIT (+3%)', 'STOP-LOSS HIT (-1.5%)', 'AMBIGUOUS (STOP HIT)', 'MTM_OPEN_CLOSE'
            gross_pnl REAL NOT NULL DEFAULT 0.0,
            brokerage REAL NOT NULL DEFAULT 0.0,
            stt REAL NOT NULL DEFAULT 0.0,
            exchange_charges REAL NOT NULL DEFAULT 0.0,
            gst REAL NOT NULL DEFAULT 0.0,
            sebi_charges REAL NOT NULL DEFAULT 0.0,
            stamp_duty REAL NOT NULL DEFAULT 0.0,
            slippage_cost REAL NOT NULL DEFAULT 0.0,
            total_transaction_charges REAL NOT NULL DEFAULT 0.0,
            net_pnl REAL NOT NULL DEFAULT 0.0,
            holding_duration_days INTEGER NOT NULL DEFAULT 0,
            return_pct REAL NOT NULL DEFAULT 0.0,
            trade_status TEXT NOT NULL,             -- 'EXECUTED_CLOSED', 'EXECUTED_OPEN_MTM', 'SKIPPED_CAPITAL_LIMIT', 'NOT_EXECUTED_CONDITION_UNMET', 'SIGNAL_INVALIDATED'
            skip_reason TEXT,
            cash_before_trade REAL,
            cash_after_trade REAL,
            portfolio_value_after_trade REAL,
            FOREIGN KEY (run_id) REFERENCES backtest_portfolio_runs(run_id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bt_trades_run ON backtest_trades(run_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bt_trades_date ON backtest_trades(entry_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bt_trades_status ON backtest_trades(trade_status);")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS backtest_daily_equity (
            run_id TEXT NOT NULL,
            date TEXT NOT NULL,
            cash_balance REAL NOT NULL,
            invested_capital REAL NOT NULL,
            unrealized_pnl REAL NOT NULL DEFAULT 0.0,
            portfolio_value REAL NOT NULL,
            daily_return_pct REAL NOT NULL DEFAULT 0.0,
            drawdown_pct REAL NOT NULL DEFAULT 0.0,
            drawdown_amount REAL NOT NULL DEFAULT 0.0,
            active_positions_count INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (run_id, date),
            FOREIGN KEY (run_id) REFERENCES backtest_portfolio_runs(run_id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bt_equity_run ON backtest_daily_equity(run_id);")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS backtest_monthly_performance (
            run_id TEXT NOT NULL,
            month TEXT NOT NULL,                    -- YYYY-MM
            starting_capital REAL NOT NULL,
            total_trades INTEGER NOT NULL,
            winning_trades INTEGER NOT NULL,
            losing_trades INTEGER NOT NULL,
            win_rate_pct REAL NOT NULL,
            monthly_gross_pnl REAL NOT NULL,
            monthly_transaction_charges REAL NOT NULL,
            monthly_net_pnl REAL NOT NULL,
            ending_portfolio_value REAL NOT NULL,
            monthly_return_pct REAL NOT NULL,
            PRIMARY KEY (run_id, month),
            FOREIGN KEY (run_id) REFERENCES backtest_portfolio_runs(run_id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bt_monthly_run ON backtest_monthly_performance(run_id);")

if __name__ == "__main__":
    init_db()
    print("Database initialized at:", DB_PATH)
