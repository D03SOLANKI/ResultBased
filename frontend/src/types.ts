export interface OverviewStats {
  as_of_date: string;
  total_unique_companies: number;
  total_nse_tracked: number;
  total_bse_tracked: number;
  dual_listed_count: number;
  sme_count: number;
  scheduled_today: number;
  scheduled_tomorrow: number;
  scheduled_7d: number;
  scheduled_30d: number;
  newly_announced: number;
  revised: number;
  cancelled: number;
  results_released_today?: number;
  results_released_7d?: number;
  results_pending_7d?: number;
  results_postponed_7d?: number;
  total_released?: number;
  rolling_7d_window_start?: string;
  rolling_7d_window_end?: string;
  total_performance_tracked?: number;
  category_breakdown_30d: Record<string, number>;
}

export interface ResultEvent {
  event_id: string;
  isin: string;
  company_name: string;
  nse_symbol: string | null;
  bse_code: string | null;
  result_category: string;
  financial_period: string;
  financial_year: string;
  result_type: string;
  board_meeting_date: string;
  expected_results_date: string;
  actual_results_date: string | null;
  actual_results_time?: string | null;
  announcement_source: string;
  nse_source_url: string | null;
  bse_source_url: string | null;
  source_document?: string | null;
  postponement_reason?: string | null;
  verification_status: string;
  event_status: string;
  market_cap_cr: number | null;
  market_cap_category: string | null;
  listing_segment: string;
  is_dual_listed: number;
  industry: string | null;
  bse_group: string | null;
  nse_series: string | null;
  created_at?: string;
  updated_at?: string;
  // Financial Performance & Price Impact Enrichment
  performance_verdict?: string | null;
  verdict_badge_color?: string | null;
  revenue_growth_yoy_pct?: number | null;
  pat_growth_yoy_pct?: number | null;
  price_change_pct?: number | null;
  price_reaction_type?: string | null;
  released_time?: string | null;
  has_performance?: number;
}

export interface CalendarDateSummary {
  board_meeting_date: string;
  total_events: number;
  results_released?: number;
  results_pending?: number;
  results_postponed?: number;
  scheduled?: number;
  large_cap: number;
  mid_cap: number;
  small_cap: number;
  micro_cap: number;
  sme: number;
}

export interface AnnouncementItem {
  announcement_id: string;
  isin: string | null;
  exchange: string;
  symbol_or_code: string;
  company_name: string;
  headline: string;
  description: string;
  attachment_url: string | null;
  published_at: string;
  is_board_meeting: number;
  is_financial_results: number;
}

export interface CompanyPerformanceScorecard {
  isin: string;
  company_name: string;
  nse_symbol: string | null;
  bse_code: string | null;
  has_released_results: boolean;
  message?: string;
  active_basis?: string;
  available_reporting_bases?: string[];
  latest_performance?: {
    financial_period: string;
    period_ended: string;
    filing_date: string;
    filing_time: string;
    filing_url: string;
    reporting_basis?: string;
    filing_type?: string;
    revenue_cr: number;
    other_income_cr?: number;
    total_income_cr?: number;
    ebitda_cr?: number;
    ebitda_margin_pct?: number;
    pbt_cr?: number;
    tax_cr?: number;
    pat_cr: number;
    pat_margin_pct?: number;
    eps?: number;
  };
  comparative_analysis?: {
    sequential_qoq: {
      previous_period: string | null;
      previous_revenue_cr: number | null;
      previous_pat_cr: number | null;
      previous_eps: number | null;
      revenue_growth_pct: number | null;
      pat_growth_pct: number | null;
      eps_growth_pct?: number | null;
    };
    year_on_year_yoy: {
      previous_period: string | null;
      previous_revenue_cr: number | null;
      previous_pat_cr: number | null;
      previous_eps: number | null;
      revenue_growth_pct: number | null;
      pat_growth_pct: number | null;
      eps_growth_pct?: number | null;
      margin_change_bps?: number | null;
      is_turnaround_to_profit?: boolean;
      is_turnaround_to_loss?: boolean;
      is_negative_base?: boolean;
    };
  };
  performance_indicators?: {
    verdict: string;
    badge_color: string;
    is_improved: boolean;
    key_highlights?: string;
    notes?: string | null;
  };
  stock_price_impact?: {
    market_session?: string;
    prev_trading_day_close?: number;
    announcement_close?: number;
    daily_close_return_pct?: number;
    next_day_close?: number | null;
    next_day_return_pct?: number | null;
    total_reaction_pct?: number;
    pre_result_price?: number;
    post_result_price?: number;
    price_change_pct?: number;
    reaction_type?: string;
    market_reaction_verdict?: string;
    volume_surge_multiplier?: number;
    price_source?: string;
    verification_status?: string;
    is_positive_reaction?: boolean;
  };
}

export interface MarketReactionItem {
  isin: string;
  company_name: string;
  symbol: string;
  exchange: string;
  announcement_date: string;
  announcement_time: string;
  market_session: string;
  prev_close: number;
  announcement_open: number;
  announcement_high: number;
  announcement_low: number;
  announcement_close: number;
  announcement_volume: number;
  next_trading_day: string | null;
  next_day_close: number | null;
  daily_close_return_pct: number;
  intraday_reaction_pct: number;
  next_day_return_pct: number | null;
  total_reaction_pct: number;
  volume_surge_multiplier: number;
  market_reaction_verdict: string;
  price_source: string;
  financial_period: string;
  period_ended: string;
  reporting_basis: string;
  revenue_ops_cr: number;
  pat_cr: number;
  prev_year_revenue_ops_cr: number;
  prev_year_pat_cr: number;
  revenue_growth_yoy_pct: number;
  pat_growth_yoy_pct: number;
  is_turnaround_to_profit: number;
  is_negative_base: number;
  source_url: string;
  market_cap_cr: number | null;
  market_cap_category: string | null;
}

export interface AuditDiscrepancyItem {
  log_id: number;
  isin: string;
  company_name: string;
  symbol: string;
  metric_category: string;
  field_name: string;
  old_displayed_value: string;
  verified_ground_truth_value: string;
  discrepancy_magnitude: string;
  root_cause_explanation: string;
  primary_source_reference: string;
  logged_at: string;
}

export interface PostMarketStockItem {
  tracker_id: string;
  isin: string;
  company_name: string;
  nse_symbol: string | null;
  bse_code: string | null;
  exchange: string;
  industry: string;
  market_cap_cr: number;
  market_cap_category: string;
  results_date: string;
  announcement_time: string;
  filing_url: string;
  financial_period: string;
  reporting_basis: string;
  revenue_cr: number;
  revenue_growth_yoy_pct: number;
  pat_cr: number;
  pat_growth_yoy_pct: number;
  ebitda_cr: number;
  ebitda_margin_pct: number;
  eps: number;
  financial_verdict: string;
  tracking_date: string;
  yesterday_close: number;
  today_open: number;
  opening_gap_pct: number;
  today_high: number;
  today_low: number;
  current_ltp: number;
  price_change_pct: number;
  intraday_change_pct: number;
  today_volume: number;
  avg_30d_volume: number;
  volume_surge_multiplier: number;
  reaction_pattern: string;
  price_movement_narrative: string;
}

export interface PostMarketSummary {
  tracking_date: string;
  yesterday_announcement_date: string;
  total_tracked: number;
  avg_opening_gap_pct: number;
  avg_price_change_pct: number;
  positive_reactions_count: number;
  negative_reactions_count: number;
  win_rate_positive_pct: number;
  top_performer: {
    company_name: string;
    symbol: string;
    price_change_pct: number;
    opening_gap_pct: number;
    current_ltp: number;
    reaction_pattern: string;
  } | null;
  worst_performer: {
    company_name: string;
    symbol: string;
    price_change_pct: number;
    opening_gap_pct: number;
    current_ltp: number;
    reaction_pattern: string;
  } | null;
  gap_up_and_rally_count: number;
  gap_down_and_sell_count: number;
}

export interface BacktestSummary {
  run_id: string;
  run_name: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_portfolio_value: number;
  total_net_pnl: number;
  total_return_pct: number;
  cagr_pct: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  target_hit_count: number;
  target_hit_rate_pct: number;
  stop_loss_hit_count: number;
  stop_loss_hit_rate_pct: number;
  ambiguous_trades_count: number;
  skipped_trades_count: number;
  not_executed_trades_count: number;
  avg_profit_per_win: number;
  avg_loss_per_loss: number;
  max_drawdown_pct: number;
  max_drawdown_amount: number;
  profit_factor: number;
  total_brokerage_and_charges: number;
  total_slippage_cost: number;
  unused_cash: number;
  open_positions_count: number;
  open_positions_mtm_value: number;
  parameters?: Record<string, any>;
}

export interface BacktestMonthly {
  run_id: string;
  month: string;
  starting_capital: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  monthly_gross_pnl: number;
  monthly_transaction_charges: number;
  monthly_net_pnl: number;
  ending_portfolio_value: number;
  monthly_return_pct: number;
}

export interface BacktestDailyEquity {
  run_id: string;
  date: string;
  cash_balance: number;
  invested_capital: number;
  unrealized_pnl: number;
  portfolio_value: number;
  daily_return_pct: number;
  drawdown_pct: number;
  drawdown_amount: number;
  active_positions_count: number;
}

export interface BacktestTrade {
  trade_id: string;
  run_id: string;
  signal_date: string;
  entry_date: string;
  company_name: string;
  isin: string;
  symbol: string;
  exchange: string;
  market_cap_category: string;
  industry: string;
  strategy_name: string;
  strategy_signal: string;
  entry_timestamp: string;
  entry_price: number;
  invested_amount: number;
  quantity: number;
  target_price: number;
  stop_loss_price: number;
  exit_date?: string | null;
  exit_timestamp?: string | null;
  exit_price?: number | null;
  exit_reason?: string | null;
  gross_pnl: number;
  brokerage: number;
  stt: number;
  exchange_charges: number;
  gst: number;
  sebi_charges: number;
  stamp_duty: number;
  slippage_cost: number;
  total_transaction_charges: number;
  net_pnl: number;
  holding_duration_days: number;
  return_pct: number;
  trade_status: string;
  skip_reason?: string | null;
  cash_before_trade?: number | null;
  cash_after_trade?: number | null;
  portfolio_value_after_trade?: number | null;
}

export interface StrategyAnalysisQuestion {
  question_number: number;
  question: string;
  verdict: string;
  details: string;
}
