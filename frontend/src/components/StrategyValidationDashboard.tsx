import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Activity, 
  Layers, 
  PieChart, 
  HelpCircle, 
  ExternalLink,
  Search,
  Filter,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Info
} from 'lucide-react';

interface ScorecardData {
  total_predictions: number;
  triggered_predictions: number;
  untriggered_predictions: number;
  correct_direction_predictions: number;
  incorrect_direction_predictions: number;
  directional_accuracy_pct: number;
  target_hit_count: number;
  target_hit_rate_pct: number;
  target_hit_rate_triggered_pct: number;
  stop_loss_hit_count: number;
  stop_loss_hit_rate_pct: number;
  stop_loss_hit_rate_triggered_pct: number;
  entry_trigger_rate_pct: number;
  profitable_without_target_count: number;
  loss_without_stop_count: number;
  no_movement_count: number;
  signal_invalidated_count: number;
  ambiguous_count: number;
  insufficient_data_count: number;
  avg_actual_return_pct: number;
  avg_expected_return_pct: number;
  prediction_vs_actual_deviation_pct: number;
  maximum_drawdown_pct: number;
  profit_factor: number;
  win_loss_ratio: number;
}

interface PredictionItem {
  prediction_id: string;
  prediction_timestamp: string;
  trading_date: string;
  isin: string;
  company_name: string;
  nse_symbol: string;
  bse_code: string;
  industry: string;
  market_cap_category: string;
  strategy_name: string;
  strategy_version: string;
  signal: string;
  expected_direction: string;
  buy_above_price: number;
  expected_entry_price: number;
  stop_loss: number;
  target_price: number;
  risk_reward_ratio: number;
  predicted_return_pct: number;
  confidence_score: number;
  holding_period: string;
  announcement_timing: string;
  selection_reason: string;
  financial_result_context?: string;
  immutable_hash: string;
  
  // Outcome
  outcome_id?: string;
  actual_open?: number;
  actual_high?: number;
  actual_low?: number;
  actual_close?: number;
  actual_volume?: number;
  entry_triggered?: number;
  entry_price_executed?: number;
  target_hit?: number;
  stop_loss_hit?: number;
  outcome_classification?: string;
  actual_intraday_return_pct?: number;
  actual_max_favorable_pct?: number;
  actual_max_adverse_pct?: number;
  is_direction_correct?: number;
  prediction_deviation_pct?: number;
  data_source?: string;
  
  // Error
  analysis_id?: string;
  failure_category?: string;
  primary_cause?: string;
  market_context?: string;
  expected_vs_actual_discrepancy?: string;
  recurring_pattern?: string;
  recommended_improvement?: string;
}

export const StrategyValidationDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'correlation' | 'errors' | 'breakdowns'>('ledger');
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [breakdownMcap, setBreakdownMcap] = useState<any>({});
  const [breakdownStrategy, setBreakdownStrategy] = useState<any>({});
  const [breakdownSector, setBreakdownSector] = useState<any>({});
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [errorAnalyses, setErrorAnalyses] = useState<any[]>([]);
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterMcap, setFilterMcap] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterStrategy, setFilterStrategy] = useState('');
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Scorecard & Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [scRes, predRes, errRes, corrRes] = await Promise.all([
        fetch('/api/strategy-validation/scorecard').then(r => r.json()),
        fetch('/api/strategy-validation/predictions?limit=100').then(r => r.json()),
        fetch('/api/strategy-validation/error-analysis').then(r => r.json()),
        fetch('/api/strategy-validation/results-correlation').then(r => r.json())
      ]);

      setScorecard(scRes.scorecard);
      setBreakdownMcap(scRes.breakdown_by_market_cap || {});
      setBreakdownStrategy(scRes.breakdown_by_strategy || {});
      setBreakdownSector(scRes.breakdown_by_sector || {});
      setPredictions(predRes.predictions || []);
      setErrorAnalyses(errRes.detailed_post_mortems || []);
      setCorrelationData(corrRes.records || []);
    } catch (err) {
      console.error('Failed to load strategy validation data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered predictions
  const filteredPredictions = predictions.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      const match = p.company_name.toLowerCase().includes(s) ||
                    (p.nse_symbol && p.nse_symbol.toLowerCase().includes(s)) ||
                    p.isin.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (filterMcap && p.market_cap_category !== filterMcap) return false;
    if (filterOutcome && p.outcome_classification !== filterOutcome) return false;
    if (filterStrategy && !p.strategy_name.includes(filterStrategy)) return false;
    return true;
  });

  // Badge styler for outcome classifications
  const renderOutcomeBadge = (classification?: string) => {
    switch (classification) {
      case 'TARGET HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            TARGET HIT
          </span>
        );
      case 'STOP-LOSS HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            STOP-LOSS HIT
          </span>
        );
      case 'PROFITABLE BUT TARGET NOT HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <ArrowUpRight className="w-3 h-3 text-teal-600" />
            PROFITABLE (NO TARGET)
          </span>
        );
      case 'LOSS WITHOUT STOP-LOSS HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <ArrowDownRight className="w-3 h-3 text-amber-700" />
            LOSS (NO STOP HIT)
          </span>
        );
      case 'ENTRY NEVER TRIGGERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            ENTRY NOT TRIGGERED
          </span>
        );
      case 'SIGNAL INVALIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <AlertTriangle className="w-3 h-3 text-purple-700" />
            SIGNAL INVALIDATED
          </span>
        );
      case 'AMBIGUOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-950 border border-orange-400">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            AMBIGUOUS (SAME BAR)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {classification || 'EVALUATING'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                Ground-Truth Cross-Verification
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Zero Lookahead Bias Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                SHA-256 Tamper-Proof
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Strategy vs Actual Market Performance Validation Engine
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
              Strict forensic verification comparing what our quantitative model predicted prior to market open vs what actually traded on the NSE/BSE exchange floors. Full denominator accounting with zero simulated or fabricated data.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-xs transition"
            >
              Re-Verify Feed
            </button>
          </div>
        </div>
      </div>

      {/* KPI Performance Scorecard Grid */}
      {scorecard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Directional Accuracy */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Directional Acc.</span>
              <Compass className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {scorecard.directional_accuracy_pct}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">
              {scorecard.correct_direction_predictions} of {scorecard.total_predictions} Total Predictions
            </div>
          </div>

          {/* Card 2: Target Hit Rate */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Target Hit Rate</span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {scorecard.target_hit_rate_pct}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">
              {scorecard.target_hit_rate_triggered_pct}% on triggered trades ({scorecard.target_hit_count}/{scorecard.triggered_predictions})
            </div>
          </div>

          {/* Card 3: Stop-Loss Hit Rate */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Stop Hit Rate</span>
              <ShieldCheck className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700">
              {scorecard.stop_loss_hit_rate_pct}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">
              {scorecard.stop_loss_hit_count} stop hit of {scorecard.total_predictions} total
            </div>
          </div>

          {/* Card 4: Profit Factor */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Profit Factor</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700">
              {scorecard.profit_factor}x
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">
              Win/Loss Ratio: <strong className="text-slate-700">{scorecard.win_loss_ratio}</strong>
            </div>
          </div>

          {/* Card 5: Entry Trigger Rate */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Trigger Rate</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {scorecard.entry_trigger_rate_pct}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">
              {scorecard.triggered_predictions} triggered / {scorecard.untriggered_predictions} disciplined passes
            </div>
          </div>

          {/* Card 6: Max Drawdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Max Drawdown</span>
              <TrendingDown className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-2xl font-black text-rose-600">
              {scorecard.maximum_drawdown_pct}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">
              Dev: <strong className="text-slate-700">{scorecard.prediction_vs_actual_deviation_pct}%</strong> vs expected
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'ledger'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Predictions vs Actual Ledger ({filteredPredictions.length})
          </button>

          <button
            onClick={() => setActiveSubTab('correlation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'correlation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Financial Results Correlation ({correlationData.length})
          </button>

          <button
            onClick={() => setActiveSubTab('errors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'errors'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Failure Post-Mortems ({errorAnalyses.length})
          </button>

          <button
            onClick={() => setActiveSubTab('breakdowns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'breakdowns'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Segment Breakdowns
          </button>
        </div>

        {/* Filters */}
        {activeSubTab === 'ledger' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbol, company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 w-44"
              />
            </div>

            <select
              value={filterOutcome}
              onChange={e => setFilterOutcome(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Outcomes</option>
              <option value="TARGET HIT">TARGET HIT</option>
              <option value="STOP-LOSS HIT">STOP-LOSS HIT</option>
              <option value="PROFITABLE BUT TARGET NOT HIT">PROFITABLE (NO TARGET)</option>
              <option value="LOSS WITHOUT STOP-LOSS HIT">LOSS (NO STOP)</option>
              <option value="ENTRY NEVER TRIGGERED">ENTRY NOT TRIGGERED</option>
              <option value="SIGNAL INVALIDATED">SIGNAL INVALIDATED</option>
              <option value="AMBIGUOUS">AMBIGUOUS</option>
            </select>

            <select
              value={filterMcap}
              onChange={e => setFilterMcap(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Market Caps</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Mid Cap">Mid Cap</option>
              <option value="Small Cap">Small Cap</option>
              <option value="Micro Cap">Micro Cap</option>
            </select>
          </div>
        )}
      </div>

      {/* SUBTAB 1: Predictions vs Actual Ledger */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Date & Stock</th>
                  <th className="py-3 px-4">Strategy & Setup</th>
                  <th className="py-3 px-4 text-right">Pred Entry</th>
                  <th className="py-3 px-4 text-right">Target / SL</th>
                  <th className="py-3 px-4 text-right">Actual Traded Range</th>
                  <th className="py-3 px-4 text-right">Actual LTP/Close</th>
                  <th className="py-3 px-4 text-right">Return %</th>
                  <th className="py-3 px-4 text-center">Outcome</th>
                  <th className="py-3 px-4 text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPredictions.map(p => {
                  const ret = p.actual_intraday_return_pct ?? 0;
                  const isWin = ret > 0;
                  const isLoss = ret < 0;

                  return (
                    <tr key={p.prediction_id} className="hover:bg-slate-50/70 transition">
                      {/* Date & Stock */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[10px] text-slate-400 font-medium">{p.trading_date}</div>
                        <div className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer" onClick={() => setSelectedPrediction(p)}>
                          {p.company_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-semibold text-slate-700 text-[10px]">{p.nse_symbol || p.bse_code}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">{p.market_cap_category}</span>
                        </div>
                      </td>

                      {/* Strategy & Setup */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-[11px]">{p.strategy_name}</div>
                        <div className="text-[10px] text-slate-400">{p.strategy_version} • {p.holding_period}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                            {p.signal} ({p.expected_direction})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Exp: +{p.predicted_return_pct}%</span>
                        </div>
                      </td>

                      {/* Predicted Entry */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-slate-900">₹{p.buy_above_price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Trigger Threshold</div>
                      </td>

                      {/* Target / SL */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-emerald-700 font-semibold">Tgt: ₹{p.target_price.toFixed(2)}</div>
                        <div className="text-rose-700 font-semibold">SL: ₹{p.stop_loss.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-sans">RR: {p.risk_reward_ratio}x</div>
                      </td>

                      {/* Actual Traded Range */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {p.actual_open ? (
                          <>
                            <div className="text-slate-700 text-[11px]">O: ₹{p.actual_open.toFixed(2)}</div>
                            <div className="text-slate-500 text-[10px]">H: ₹{p.actual_high?.toFixed(2)} | L: ₹{p.actual_low?.toFixed(2)}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No Exec</span>
                        )}
                      </td>

                      {/* Actual LTP/Close */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {p.actual_close ? (
                          <>
                            <div className="font-bold text-slate-900">₹{p.actual_close.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">{p.data_source || 'NSE Bhavcopy'}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Executed Return % */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {p.entry_triggered ? (
                          <div className={`font-black text-xs ${isWin ? 'text-emerald-700' : (isLoss ? 'text-rose-700' : 'text-slate-700')}`}>
                            {ret > 0 ? `+${ret.toFixed(2)}%` : `${ret.toFixed(2)}%`}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans font-medium text-[11px]">0.00%</span>
                        )}
                        <div className="text-[10px] text-slate-400">
                          Dev: {p.prediction_deviation_pct ? `${p.prediction_deviation_pct.toFixed(2)}%` : '-'}
                        </div>
                      </td>

                      {/* Outcome Classification Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {renderOutcomeBadge(p.outcome_classification)}
                      </td>

                      {/* Audit Detail Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedPrediction(p)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Financial Results vs Market Reaction Correlation */}
      {activeSubTab === 'correlation' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Pre-Announcement Strategy Prediction vs Post-Announcement Reality</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict chronological validation ensuring the strategy prediction timestamp strictly preceded company disclosures. Demonstrates whether the market validated the model's fundamental and price catalysts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Financial Result Disclosed</th>
                  <th className="py-3 px-4">Strategy Pre-Release Signal</th>
                  <th className="py-3 px-4">Actual Traded Market Reaction</th>
                  <th className="py-3 px-4 text-center">Direction Match</th>
                  <th className="py-3 px-4">Post-Reaction Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {correlationData.map((item, idx) => {
                  const isMatch = item.is_direction_correct === 1;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.company_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.nse_symbol} • {item.trading_date}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold mt-1 inline-block">
                          {item.announcement_timing}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-800 text-[11px] font-medium leading-relaxed">
                          {item.financial_result_context || item.selection_reason}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-blue-700">{item.predicted_signal} ({item.expected_direction})</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Exp Return: +{item.predicted_return_pct}%</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-900 font-bold">
                          Close: ₹{item.actual_close?.toFixed(2)}
                        </div>
                        <div className={`font-mono text-xs font-black ${item.actual_intraday_return_pct > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {item.actual_intraday_return_pct > 0 ? `+${item.actual_intraday_return_pct.toFixed(2)}%` : `${item.actual_intraday_return_pct?.toFixed(2)}%`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isMatch ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            CORRECT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            INCORRECT
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.failure_category ? (
                          <div>
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {item.failure_category}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{item.primary_cause}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Thesis Realized & Executed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Failure Post-Mortems */}
      {activeSubTab === 'errors' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-sm text-rose-900">Learning & Systematic Error Taxonomy</h3>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  Every trade failure, stop-loss breach, and thesis invalidation undergoes algorithmic dissection to isolate whether the breakdown originated from broad market beta, valuation compression, liquidity grab, or regulatory policy shock.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errorAnalyses.map((err, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{err.nse_symbol}</span>
                    <span className="text-[11px] text-slate-500 font-medium">({err.company_name})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{err.trading_date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {err.failure_category}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-700">
                    Return: {err.actual_intraday_return_pct}%
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <p><strong className="text-slate-900">Primary Cause:</strong> {err.primary_cause}</p>
                  <p><strong className="text-slate-900">Market Context:</strong> {err.market_context}</p>
                  <p><strong className="text-slate-900">Expected vs Reality:</strong> {err.expected_vs_actual_discrepancy}</p>
                  <p><strong className="text-slate-900">Recurring Pattern:</strong> {err.recurring_pattern}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Algorithmic Recommendation:</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 leading-relaxed font-medium">
                    {err.recommended_improvement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: Segment Breakdowns */}
      {activeSubTab === 'breakdowns' && (
        <div className="space-y-6">
          {/* Breakdown 1: Market Cap */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Performance by Market Capitalization</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Segment</th>
                    <th className="py-2.5 px-3 text-right">Total Predictions</th>
                    <th className="py-2.5 px-3 text-right">Triggered</th>
                    <th className="py-2.5 px-3 text-right">Directional Acc %</th>
                    <th className="py-2.5 px-3 text-right">Target Hit Rate %</th>
                    <th className="py-2.5 px-3 text-right">Stop Hit Rate %</th>
                    <th className="py-2.5 px-3 text-right">Avg Actual Ret %</th>
                    <th className="py-2.5 px-3 text-right">Profit Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {Object.entries(breakdownMcap).map(([mcap, data]: [string, any]) => (
                    <tr key={mcap} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{mcap}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{data.total_predictions}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{data.triggered_count}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{data.directional_accuracy_pct}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{data.target_hit_rate_pct}%</td>
                      <td className="py-2.5 px-3 text-right text-rose-700 font-bold">{data.stop_loss_hit_rate_pct}%</td>
                      <td className="py-2.5 px-3 text-right font-black text-blue-700">{data.avg_actual_return_pct}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{data.profit_factor}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown 2: Strategy Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Performance by Strategy Configuration</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Strategy Model</th>
                    <th className="py-2.5 px-3 text-right">Total Predictions</th>
                    <th className="py-2.5 px-3 text-right">Triggered</th>
                    <th className="py-2.5 px-3 text-right">Directional Acc %</th>
                    <th className="py-2.5 px-3 text-right">Target Hit Rate %</th>
                    <th className="py-2.5 px-3 text-right">Stop Hit Rate %</th>
                    <th className="py-2.5 px-3 text-right">Avg Actual Ret %</th>
                    <th className="py-2.5 px-3 text-right">Profit Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {Object.entries(breakdownStrategy).map(([strat, data]: [string, any]) => (
                    <tr key={strat} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{strat}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{data.total_predictions}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{data.triggered_count}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{data.directional_accuracy_pct}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{data.target_hit_rate_pct}%</td>
                      <td className="py-2.5 px-3 text-right text-rose-700 font-bold">{data.stop_loss_hit_rate_pct}%</td>
                      <td className="py-2.5 px-3 text-right font-black text-blue-700">{data.avg_actual_return_pct}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{data.profit_factor}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {selectedPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] font-mono text-slate-400 font-semibold">{selectedPrediction.prediction_id}</div>
                <h3 className="text-lg font-black text-slate-900">{selectedPrediction.company_name}</h3>
                <div className="text-xs text-slate-500 font-mono">{selectedPrediction.nse_symbol} • {selectedPrediction.isin}</div>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* SHA-256 Immutability Stamp */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="font-bold flex items-center gap-1 text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  SHA-256 Tamper-Proof Fingerprint
                </span>
                <span>Pre-Session Logged: {selectedPrediction.prediction_timestamp}</span>
              </div>
              <div className="font-mono text-[9px] text-slate-600 break-all mt-1 bg-white p-1.5 rounded border border-slate-200">
                {selectedPrediction.immutable_hash}
              </div>
            </div>

            {/* Model Setup vs Real Market Execution */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 space-y-1.5">
                <h4 className="font-bold text-blue-900 uppercase text-[10px] tracking-wider">Strategy Pre-Market Thesis</h4>
                <div className="flex justify-between"><span className="text-slate-500">Signal:</span> <span className="font-bold text-slate-900">{selectedPrediction.signal} ({selectedPrediction.expected_direction})</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Trigger Threshold:</span> <span className="font-mono font-bold text-slate-900">₹{selectedPrediction.buy_above_price}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Target Price:</span> <span className="font-mono font-bold text-emerald-700">₹{selectedPrediction.target_price}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Stop Loss:</span> <span className="font-mono font-bold text-rose-700">₹{selectedPrediction.stop_loss}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expected Gain:</span> <span className="font-mono font-bold text-blue-700">+{selectedPrediction.predicted_return_pct}%</span></div>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 space-y-1.5">
                <h4 className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider">Ground-Truth Exchange Execution</h4>
                <div className="flex justify-between"><span className="text-slate-500">Actual Open:</span> <span className="font-mono font-bold text-slate-900">₹{selectedPrediction.actual_open}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">High / Low:</span> <span className="font-mono font-bold text-slate-900">₹{selectedPrediction.actual_high} / ₹{selectedPrediction.actual_low}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Actual Close:</span> <span className="font-mono font-bold text-slate-900">₹{selectedPrediction.actual_close}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Executed Return:</span> <span className="font-mono font-black text-emerald-800">{selectedPrediction.actual_intraday_return_pct}%</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Classification:</span> <span className="font-bold">{renderOutcomeBadge(selectedPrediction.outcome_classification)}</span></div>
              </div>
            </div>

            {/* Rationale */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900">Model Selection Rationale:</strong>
              <p className="mt-1 leading-relaxed">{selectedPrediction.selection_reason}</p>
            </div>

            {/* Error Post-Mortem if present */}
            {selectedPrediction.failure_category && (
              <div className="text-xs bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Failure Post-Mortem: {selectedPrediction.failure_category}</span>
                </div>
                <p className="text-rose-800 leading-relaxed"><strong className="text-rose-950">Primary Cause:</strong> {selectedPrediction.primary_cause}</p>
                <p className="text-rose-800 leading-relaxed"><strong className="text-rose-950">Recommendation:</strong> {selectedPrediction.recommended_improvement}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
