import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  Download, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Calendar,
  Layers,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Percent,
  RefreshCw
} from 'lucide-react';
import { 
  BacktestSummary, 
  BacktestMonthly, 
  BacktestDailyEquity, 
  BacktestTrade, 
  StrategyAnalysisQuestion 
} from '../types';

export const BacktestDashboard: React.FC = () => {
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [tradeBreakdown, setTradeBreakdown] = useState<any>(null);
  const [monthly, setMonthly] = useState<BacktestMonthly[]>([]);
  const [equityCurve, setEquityCurve] = useState<BacktestDailyEquity[]>([]);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [analysisQuestions, setAnalysisQuestions] = useState<StrategyAnalysisQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Controls
  const [activeTabSub, setActiveTabSub] = useState<'trades' | 'monthly' | 'analysis'>('trades');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  useEffect(() => {
    fetchBacktestData();
  }, []);

  const fetchBacktestData = async () => {
    setIsLoading(true);
    try {
      const [resSummary, resMonthly, resEquity, resTrades, resAnalysis] = await Promise.all([
        fetch('/api/backtest/overview').then(r => r.json()),
        fetch('/api/backtest/monthly').then(r => r.json()),
        fetch('/api/backtest/equity-curve').then(r => r.json()),
        fetch('/api/backtest/trades?limit=150').then(r => r.json()),
        fetch('/api/backtest/analysis').then(r => r.json())
      ]);

      setSummary(resSummary.summary);
      setTradeBreakdown(resSummary.trade_breakdown);
      setMonthly(resMonthly.monthly_performance || []);
      setEquityCurve(resEquity.equity_curve || []);
      setTrades(resTrades.trades || []);
      setAnalysisQuestions(resAnalysis.answers || []);
    } catch (err) {
      console.error('Failed to load backtest data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrades = trades.filter(t => {
    if (statusFilter !== 'ALL' && t.trade_status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.company_name.toLowerCase().includes(s) ||
        t.symbol.toLowerCase().includes(s) ||
        t.trade_id.toLowerCase().includes(s) ||
        (t.exit_reason && t.exit_reason.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    window.location.href = '/api/backtest/export-csv';
  };

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading 1-Year Historical Backtest Data...</p>
      </div>
    );
  }

  // Equity Curve Min/Max for SVG rendering
  const values = equityCurve.map(d => d.portfolio_value);
  const minVal = Math.min(...values, 800000);
  const maxVal = Math.max(...values, 1050000);
  const range = maxVal - minVal || 1;

  const points = equityCurve.map((d, i) => {
    const x = (i / (equityCurve.length - 1)) * 1000;
    const y = 200 - ((d.portfolio_value - minVal) / range) * 180;
    return `${x},${y}`;
  }).join(' ');

  const baselineY = 200 - ((1000000 - minVal) / range) * 180;

  return (
    <div className="space-y-6">
      
      {/* 1. Core Goal Banner: Starting Capital -> Final Portfolio Value */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                1-Year Historical Backtest (Strict Read-Only Mode)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {summary.start_date} → {summary.end_date} (248 Sessions)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black mt-2 tracking-tight">
              Trading Strategy Backtest • ₹10 Lakh Initial Capital
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Strict rules enforced: ₹2.5L/stock cap, max 4 positions, buy execution strictly after 2:30 PM (14:30 IST),
              target +3.0%, stop-loss -1.5%, and full statutory Indian taxes (STT, Brokerage, GST, Exch, Slippage).
            </p>
          </div>

          {/* Capital Transition Box */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/15">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Starting Capital</span>
              <span className="text-base font-extrabold font-mono text-white">₹10,00,000</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Final Value</span>
              <span className="text-base font-extrabold font-mono text-rose-300">
                ₹{summary.final_portfolio_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Net P&L (Return)</span>
              <span className={`text-base font-extrabold font-mono ${summary.total_net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.total_net_pnl >= 0 ? '+' : ''}₹{summary.total_net_pnl.toLocaleString('en-IN')} ({summary.total_return_pct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Final Portfolio Value</span>
          <div className="text-lg font-black font-mono text-slate-900 mt-1">
            ₹{summary.final_portfolio_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-rose-600 font-bold flex items-center gap-0.5 mt-0.5">
            <TrendingDown className="w-3.5 h-3.5" />
            {summary.total_return_pct}% Total Return
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Total Net Loss</span>
          <div className="text-lg font-black font-mono text-rose-600 mt-1">
            ₹{Math.abs(summary.total_net_pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">After all fees & slippage</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Win Rate</span>
          <div className="text-lg font-black font-mono text-slate-900 mt-1">
            {summary.win_rate_pct}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {summary.winning_trades} Wins / {summary.losing_trades} Losses
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Target vs Stop Hit</span>
          <div className="text-lg font-black font-mono text-slate-900 mt-1">
            {summary.target_hit_count} : {summary.stop_loss_hit_count}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            {summary.target_hit_rate_pct}% Tgt / {summary.stop_loss_hit_rate_pct}% SL
          </span>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Max Drawdown</span>
          <div className="text-lg font-black font-mono text-rose-700 mt-1">
            {summary.max_drawdown_pct}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Peak loss ₹{summary.max_drawdown_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Friction & Taxes</span>
          <div className="text-lg font-black font-mono text-slate-900 mt-1">
            ₹{summary.total_brokerage_and_charges.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">STT, Brokerage, GST, Exch</span>
        </div>

      </div>

      {/* 3. Equity Curve Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              Chronological Portfolio Equity Progression (248 Trading Days)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizes daily portfolio equity starting with ₹10,00,000 cash balance through 1-year completed sessions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              ₹10L Initial Baseline
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              Portfolio Equity Curve
            </span>
          </div>
        </div>

        {/* SVG Equity Curve */}
        <div className="relative w-full h-56 bg-slate-50/80 rounded-xl p-2 border border-slate-100 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="50" x2="1000" y2="50" stroke="#e2e8f0" strokeDasharray="4,4" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="#e2e8f0" strokeDasharray="4,4" />
            <line x1="0" y1="150" x2="1000" y2="150" stroke="#e2e8f0" strokeDasharray="4,4" />

            {/* Baseline ₹10,00,000 */}
            <line x1="0" y1={baselineY} x2="1000" y2={baselineY} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6,4" />

            {/* Equity Curve Line */}
            <polyline
              fill="none"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>

          {/* Overlay Labels */}
          <div className="absolute top-2 left-4 text-[10px] font-mono text-slate-500">
            Peak: ₹{maxVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="absolute top-[38%] left-4 text-[10px] font-mono font-bold text-slate-600">
            Baseline: ₹10,00,000
          </div>
          <div className="absolute bottom-2 left-4 text-[10px] font-mono text-rose-700">
            Trough: ₹{minVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="absolute bottom-2 right-4 text-[10px] font-mono font-bold text-rose-700">
            Final: ₹{summary.final_portfolio_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs: Trades History vs Monthly Performance vs Strategy Analysis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTabSub('trades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabSub === 'trades'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Complete Trade-by-Trade History ({trades.length})
          </button>
          <button
            onClick={() => setActiveTabSub('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabSub === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month-by-Month Performance ({monthly.length} Months)
          </button>
          <button
            onClick={() => setActiveTabSub('analysis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabSub === 'analysis'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Strategy Performance Analysis (10 Core Questions)
          </button>
        </div>

        {/* Download CSV Action */}
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          Download Trade History (CSV)
        </button>
      </div>

      {/* Sub-Tab 1: Trade-by-Trade History */}
      {activeTabSub === 'trades' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
              {[
                { key: 'ALL', label: 'All Signals' },
                { key: 'EXECUTED_CLOSED', label: 'Executed & Closed' },
                { key: 'EXECUTED_OPEN_MTM', label: 'Open (MTM)' },
                { key: 'SKIPPED_CAPITAL_LIMIT', label: 'Skipped (Cap Limit)' },
                { key: 'NOT_EXECUTED_CONDITION_UNMET', label: 'Unmet Trigger' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    statusFilter === f.key
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search stock, symbol, trade..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Trade Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Trade ID / Date</th>
                    <th className="py-3 px-3">Stock & Sector</th>
                    <th className="py-3 px-3">Signal & Entry (Post-2:30)</th>
                    <th className="py-3 px-3 text-right">Invested (₹2.5L Cap)</th>
                    <th className="py-3 px-3 text-right">Target / Stop-Loss</th>
                    <th className="py-3 px-3">Exit Reason & Date</th>
                    <th className="py-3 px-3 text-right">Friction (Fees+Tax)</th>
                    <th className="py-3 px-3 text-right">Net P&L (Return)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrades.map(t => {
                    const isWin = t.net_pnl > 0;
                    const isExecuted = t.trade_status.startsWith('EXECUTED');
                    return (
                      <tr key={t.trade_id} className="hover:bg-slate-50/70 transition-colors font-medium">
                        
                        {/* ID / Date */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-900 block">{t.trade_id}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{t.entry_date}</span>
                        </td>

                        {/* Stock & Sector */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{t.company_name}</span>
                          <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-1 py-0.5 rounded inline-block">
                            {t.symbol}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{t.industry}</span>
                        </td>

                        {/* Signal & Entry */}
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                            {t.strategy_signal} @ ₹{t.entry_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {t.entry_timestamp}
                          </span>
                        </td>

                        {/* Invested */}
                        <td className="py-3 px-3 text-right font-mono">
                          {isExecuted ? (
                            <>
                              <span className="font-bold text-slate-900 block">
                                ₹{t.invested_amount.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 block">{t.quantity} shares</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Target / Stop */}
                        <td className="py-3 px-3 text-right font-mono">
                          <span className="text-emerald-700 font-semibold block text-[11px]">
                            T: ₹{t.target_price.toFixed(1)} (+3%)
                          </span>
                          <span className="text-rose-600 font-semibold block text-[11px]">
                            SL: ₹{t.stop_loss_price.toFixed(1)} (-1.5%)
                          </span>
                        </td>

                        {/* Exit Details */}
                        <td className="py-3 px-3">
                          {t.exit_reason ? (
                            <div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                t.exit_reason.includes('TARGET')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.exit_reason.includes('STOP')
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {t.exit_reason}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                {t.exit_date} {t.exit_price ? `@ ₹${t.exit_price}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">{t.skip_reason || 'Pending'}</span>
                          )}
                        </td>

                        {/* Friction & Charges */}
                        <td className="py-3 px-3 text-right font-mono">
                          {isExecuted ? (
                            <span className="text-slate-600 block">
                              ₹{t.total_transaction_charges.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Net P&L */}
                        <td className="py-3 px-3 text-right font-mono">
                          {isExecuted ? (
                            <div>
                              <span className={`font-black block ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isWin ? '+' : ''}₹{t.net_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                              <span className={`text-[10px] font-bold ${isWin ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {isWin ? '+' : ''}{t.return_pct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${
                            t.trade_status === 'EXECUTED_CLOSED'
                              ? isWin ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                              : t.trade_status === 'EXECUTED_OPEN_MTM'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : t.trade_status === 'SKIPPED_CAPITAL_LIMIT'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {t.trade_status.replace(/_/g, ' ')}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredTrades.length} of {trades.length} signals</span>
              <span>All monetary amounts in INR (₹)</span>
            </div>
          </div>

        </div>
      )}

      {/* Sub-Tab 2: Month-by-Month Breakdown */}
      {activeTabSub === 'monthly' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60">
            <h3 className="font-extrabold text-sm text-slate-900">12-Month Performance Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks portfolio capital progression, monthly trading frequency, statutory transaction friction, and net returns.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Starting Capital</th>
                  <th className="py-3 px-4 text-center">Trades (W / L)</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                  <th className="py-3 px-4 text-right">Gross P&L</th>
                  <th className="py-3 px-4 text-right">Transaction Charges</th>
                  <th className="py-3 px-4 text-right">Net P&L</th>
                  <th className="py-3 px-4 text-right">Ending Value</th>
                  <th className="py-3 px-4 text-right">Monthly Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {monthly.map(m => {
                  const isPositive = m.monthly_net_pnl >= 0;
                  return (
                    <tr key={m.month} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.month}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{m.starting_capital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className="py-3 px-4 text-center font-mono">{m.total_trades} ({m.winning_trades} / {m.losing_trades})</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">{m.win_rate_pct}%</td>
                      <td className={`py-3 px-4 text-right font-mono ${m.monthly_gross_pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.monthly_gross_pnl >= 0 ? '+' : ''}₹{m.monthly_gross_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">₹{m.monthly_transaction_charges.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className={`py-3 px-4 text-right font-mono font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}₹{m.monthly_net_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">₹{m.ending_portfolio_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className={`py-3 px-4 text-right font-mono font-extrabold ${m.monthly_return_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.monthly_return_pct >= 0 ? '+' : ''}{m.monthly_return_pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Strategy Performance Analysis (10 Core Questions) */}
      {activeTabSub === 'analysis' && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              10-Point Empirical Strategy Performance Evaluation
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Rigorous, zero-tolerance post-mortem answering key quantitative questions based directly on the ₹10 Lakh 1-year historical dataset.
            </p>
          </div>

          <div className="space-y-2.5">
            {analysisQuestions.map(q => {
              const isExpanded = expandedQuestion === q.question_number;
              return (
                <div 
                  key={q.question_number}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : q.question_number)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {q.question_number}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{q.question}</h4>
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-rose-700 block mt-0.5">
                          {q.verdict}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
                      {q.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
