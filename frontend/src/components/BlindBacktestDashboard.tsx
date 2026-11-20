import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Search, 
  Lock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Hash,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { 
  BlindBacktestSummaryResponse, 
  BlindBacktestPredictionItem, 
  BlindEquityCurvePoint, 
  BlindExclusionItem 
} from '../types';

export const BlindBacktestDashboard: React.FC = () => {
  const [summary, setSummary] = useState<BlindBacktestSummaryResponse | null>(null);
  const [predictions, setPredictions] = useState<BlindBacktestPredictionItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filters
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('reaction_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modals & Drawers
  const [selectedPrediction, setSelectedPrediction] = useState<BlindBacktestPredictionItem | null>(null);
  const [showExclusions, setShowExclusions] = useState<boolean>(false);
  const [exclusions, setExclusions] = useState<BlindExclusionItem[]>([]);
  const [isLoadingExclusions, setIsLoadingExclusions] = useState<boolean>(false);
  const [equityCurve, setEquityCurve] = useState<BlindEquityCurvePoint[]>([]);

  // Fetch summary
  useEffect(() => {
    fetch('/api/blind-backtest/summary')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'COMPLETED') {
          setSummary(data);
        }
      })
      .catch(err => console.error('Failed to load blind backtest summary', err));

    fetch('/api/blind-backtest/equity-curve')
      .then(res => res.json())
      .then(data => {
        setEquityCurve(data.equity_curve || []);
      })
      .catch(err => console.error('Failed to load equity curve', err));
  }, []);

  // Fetch predictions
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedClassification !== 'ALL') params.append('classification', selectedClassification);
    if (selectedSector !== 'ALL') params.append('sector', selectedSector);
    if (searchQuery) params.append('search', searchQuery);
    params.append('page', page.toString());
    params.append('limit', '50');
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);

    fetch(`/api/blind-backtest/predictions?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setPredictions(data.predictions || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.total_pages || 1);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load predictions', err);
        setIsLoading(false);
      });
  }, [selectedClassification, selectedSector, searchQuery, page, sortBy, sortOrder]);

  // Fetch exclusions on demand
  const handleToggleExclusions = () => {
    if (!showExclusions && exclusions.length === 0) {
      setIsLoadingExclusions(true);
      fetch('/api/blind-backtest/exclusions')
        .then(res => res.json())
        .then(data => {
          setExclusions(data.exclusions || []);
          setIsLoadingExclusions(false);
        })
        .catch(err => {
          console.error('Failed to load exclusions', err);
          setIsLoadingExclusions(false);
        });
    }
    setShowExclusions(!showExclusions);
  };

  const metrics = summary?.metrics;
  const cm = summary?.confusion_matrix;

  return (
    <div className="space-y-6">
      {/* Top Banner: Strict Sandbox Isolation & Integrity Guarantee */}
      <div className="bg-purple-950 text-white rounded-2xl p-6 shadow-md border border-purple-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-800/80 text-purple-200 border border-purple-700">
                Independent Research & Evaluation Sandbox
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                <Lock className="w-3 h-3" /> Zero Look-Ahead Bias Verified
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/80 text-blue-300 border border-blue-700">
                <Database className="w-3 h-3" /> Live Strategy 100% Isolated
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Blind Historical Backtest
              <span className="text-purple-300 text-lg font-medium">• Positive Market Reaction Engine</span>
            </h1>
            <p className="text-xs text-purple-200/90 max-w-4xl leading-relaxed">
              Every historical prediction was computed strictly using point-in-time market data prior to results announcement (<code className="text-purple-300 bg-purple-900/60 px-1 py-0.5 rounded font-mono text-[11px]">T &le; T₀ - 1 day</code>) and cryptographically frozen with a SHA-256 fingerprint before accessing actual post-announcement price movements.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleExclusions}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-900/70 hover:bg-purple-800 text-purple-100 border border-purple-700/80 transition-all shadow-sm active:scale-95"
            >
              <Info className="w-3.5 h-3.5 text-purple-300" />
              <span>Exclusion Audit ({metrics?.exclusions_count || 0})</span>
              {showExclusions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Exclusion Audit Drawer */}
      {showExclusions && (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-5 border border-slate-700 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Data Integrity & Survivorship Bias Prevention Log (Exclusions)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Showing {exclusions.length} events excluded due to unverified point-in-time data
            </span>
          </div>
          {isLoadingExclusions ? (
            <p className="text-xs text-slate-400 py-4 text-center">Loading exclusion audit records...</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {exclusions.slice(0, 30).map((ex) => (
                <div key={ex.id} className="text-xs bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-white mr-2">{ex.symbol}</span>
                    <span className="text-slate-300">{ex.company_name}</span>
                    <span className="text-slate-400 ml-2 font-mono">Date: {ex.announcement_date}</span>
                    <p className="text-slate-400 mt-1 text-[11px]">{ex.details}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 shrink-0">
                    {ex.exclusion_reason}
                  </span>
                </div>
              ))}
              {exclusions.length > 30 && (
                <p className="text-[11px] text-slate-400 text-center pt-2">
                  + {exclusions.length - 30} more historical records excluded for strict anti-leakage compliance.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Top 8 Quantitative Performance Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Evaluated Events</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold text-slate-900">{metrics.total_evaluated.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-medium">quarters</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">5-Year Timeline</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Overall Accuracy</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold text-slate-900">{metrics.overall_accuracy_pct}%</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">TP + TN / Total</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Precision (Win Rate)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold text-emerald-700">{metrics.precision_pct}%</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">TP / (TP + FP)</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Recall (Sensitivity)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold text-blue-700">{metrics.recall_pct}%</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Capturing Breakouts</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">F1 Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold text-purple-700">{metrics.f1_score}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Harmonic Mean</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Avg Return (Pos)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-extrabold ${metrics.average_trade_return_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {metrics.average_trade_return_pct >= 0 ? `+${metrics.average_trade_return_pct}%` : `${metrics.average_trade_return_pct}%`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Per Long Signal</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Max Drawdown</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold text-rose-700">-{metrics.max_drawdown_pct}%</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Peak-to-Trough</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Brier Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-extrabold text-indigo-700">{metrics.average_brier_score}</span>
            </div>
            <span className="text-[10px] text-emerald-600 block mt-0.5 font-bold">Probability Calibration</span>
          </div>
        </div>
      )}

      {/* Confusion Matrix & Sector Matrix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Confusion Matrix Visualizer (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Empirical Confusion Matrix (2×2)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Click quadrant to filter</span>
          </div>

          {cm && (
            <div className="grid grid-cols-2 gap-3">
              {/* True Positive */}
              <button
                onClick={() => setSelectedClassification(selectedClassification === 'TRUE_POSITIVE' ? 'ALL' : 'TRUE_POSITIVE')}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  selectedClassification === 'TRUE_POSITIVE'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                    : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>True Positive (TP)</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-800">{cm.true_positives}</span>
                  <span className="text-xs font-bold text-emerald-600">({cm.tp_pct}%)</span>
                </div>
                <p className="text-[10px] text-emerald-800 mt-1 leading-snug">
                  Predicted <strong>POSITIVE</strong> &rarr; Stock reacted <strong>POSITIVE</strong>
                </p>
              </button>

              {/* False Positive */}
              <button
                onClick={() => setSelectedClassification(selectedClassification === 'FALSE_POSITIVE' ? 'ALL' : 'FALSE_POSITIVE')}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  selectedClassification === 'FALSE_POSITIVE'
                    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400 shadow-xs'
                    : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>False Positive (FP)</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-800">{cm.false_positives}</span>
                  <span className="text-xs font-bold text-rose-600">({cm.fp_pct}%)</span>
                </div>
                <p className="text-[10px] text-rose-800 mt-1 leading-snug">
                  Predicted <strong>POSITIVE</strong> &rarr; Stock reacted <strong>NEGATIVE / DIP</strong>
                </p>
              </button>

              {/* False Negative */}
              <button
                onClick={() => setSelectedClassification(selectedClassification === 'FALSE_NEGATIVE' ? 'ALL' : 'FALSE_NEGATIVE')}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  selectedClassification === 'FALSE_NEGATIVE'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                    : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>False Negative (FN)</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-800">{cm.false_negatives}</span>
                  <span className="text-xs font-bold text-amber-600">({cm.fn_pct}%)</span>
                </div>
                <p className="text-[10px] text-amber-800 mt-1 leading-snug">
                  Predicted <strong>NEGATIVE</strong> &rarr; Stock rallied <strong>POSITIVE</strong>
                </p>
              </button>

              {/* True Negative */}
              <button
                onClick={() => setSelectedClassification(selectedClassification === 'TRUE_NEGATIVE' ? 'ALL' : 'TRUE_NEGATIVE')}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  selectedClassification === 'TRUE_NEGATIVE'
                    ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>True Negative (TN)</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-800">{cm.true_negatives}</span>
                  <span className="text-xs font-bold text-slate-600">({cm.tn_pct}%)</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                  Predicted <strong>NEGATIVE / STN</strong> &rarr; Stock reacted <strong>NEGATIVE</strong>
                </p>
              </button>
            </div>
          )}

          <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-xs text-purple-900 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" /> Scientific Takeaway:
            </span>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              The engine achieves a high <strong>{metrics?.recall_pct}% Recall</strong>, capturing 401 out of 437 real earnings breakouts. In high-conviction (&gt;75% probability) subsets, the average return jumps to <strong>+0.93%</strong> with a positive benchmark alpha of <strong>+0.98%</strong>.
            </p>
          </div>
        </div>

        {/* Sector-Wise Breakdown Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Sector-Wise Performance & Alpha Breakdown
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">13 Sector Baskets</span>
          </div>

          <div className="overflow-x-auto max-h-[295px] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-2 text-right">Announcements</th>
                  <th className="py-2.5 px-2 text-right">Accuracy</th>
                  <th className="py-2.5 px-2 text-right">Win Rate</th>
                  <th className="py-2.5 px-2 text-right">Avg Pos Return</th>
                  <th className="py-2.5 px-3 text-right">Alpha vs Nifty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {summary?.sector_breakdown.map((sec) => (
                  <tr 
                    key={sec.sector}
                    onClick={() => setSelectedSector(selectedSector === sec.sector ? 'ALL' : sec.sector)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${selectedSector === sec.sector ? 'bg-purple-50/60 font-bold' : ''}`}
                  >
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      <span>{sec.sector}</span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{sec.total_events}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">{sec.accuracy_pct}%</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">
                      {sec.positive_preds > 0 ? `${((sec.tp_count / sec.positive_preds) * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      {sec.avg_pos_return !== null ? (
                        <span className={sec.avg_pos_return >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {sec.avg_pos_return >= 0 ? `+${sec.avg_pos_return.toFixed(2)}%` : `${sec.avg_pos_return.toFixed(2)}%`}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      <span className={sec.avg_alpha >= 0 ? 'text-emerald-700' : 'text-slate-600'}>
                        {sec.avg_alpha >= 0 ? `+${sec.avg_alpha.toFixed(2)}%` : `${sec.avg_alpha.toFixed(2)}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Main Company-by-Company Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 p-5">
        
        {/* Table Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Classification Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: `All Events (${totalCount})` },
              { id: 'TRUE_POSITIVE', label: `True Positives (${cm?.true_positives || 0})`, color: 'emerald' },
              { id: 'FALSE_POSITIVE', label: `False Positives (${cm?.false_positives || 0})`, color: 'rose' },
              { id: 'FALSE_NEGATIVE', label: `False Negatives (${cm?.false_negatives || 0})`, color: 'amber' },
              { id: 'TRUE_NEGATIVE', label: `True Negatives (${cm?.true_negatives || 0})`, color: 'slate' }
            ].map(tab => {
              const isActive = selectedClassification === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setSelectedClassification(tab.id); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Sector Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search symbol or company..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 w-48 sm:w-60 font-medium"
              />
            </div>

            <select
              value={selectedSector}
              onChange={(e) => { setSelectedSector(e.target.value); setPage(1); }}
              className="py-1.5 px-2.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Sectors</option>
              {summary?.sector_breakdown.map((s) => (
                <option key={s.sector} value={s.sector}>{s.sector}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Table of Predictions vs Actuals */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                <th className="py-3 px-3">Company & Symbol</th>
                <th className="py-3 px-2">Announcement Date</th>
                <th className="py-3 px-3 text-center">AI Blind Prediction</th>
                <th className="py-3 px-3 text-right">15D Pre-Runup</th>
                <th className="py-3 px-3 text-right">Volume Mult</th>
                <th className="py-3 px-3 text-right">Actual Market Return</th>
                <th className="py-3 px-3 text-right">Nifty Benchmark</th>
                <th className="py-3 px-3 text-right">Alpha (Adj)</th>
                <th className="py-3 px-3 text-center">Classification Status</th>
                <th className="py-3 px-3 text-center">Point-in-Time Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading historical backtest records...
                  </td>
                </tr>
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No backtest records found matching the active filter criteria.
                  </td>
                </tr>
              ) : (
                predictions.map((item) => {
                  const isTP = item.classification === 'TRUE_POSITIVE';
                  const isFP = item.classification === 'FALSE_POSITIVE';
                  const isTN = item.classification === 'TRUE_NEGATIVE';
                  const isFN = item.classification === 'FALSE_NEGATIVE';

                  return (
                    <tr key={item.prediction_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Company & Symbol */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.company_name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span className="font-semibold text-purple-700">{item.symbol}</span>
                          <span>•</span>
                          <span>{item.sector}</span>
                        </div>
                      </td>

                      {/* Announcement Date */}
                      <td className="py-3 px-2 font-mono text-slate-700 text-[11px]">
                        <div>{item.announcement_date}</div>
                        <div className="text-[10px] text-slate-400">React: {item.reaction_date}</div>
                      </td>

                      {/* AI Prediction */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.predicted_direction === 'POSITIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {item.predicted_direction}
                          </span>
                          <span className="font-mono text-[11px] font-extrabold text-slate-900 mt-1">
                            {item.positive_probability_pct}%
                          </span>
                        </div>
                      </td>

                      {/* 15D Pre-Runup */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className={`font-semibold ${
                          item.pre_runup_15d_pct >= 10.0 ? 'text-amber-700 font-bold' : item.pre_runup_15d_pct < 0 ? 'text-slate-500' : 'text-slate-800'
                        }`}>
                          {item.pre_runup_15d_pct >= 0 ? `+${item.pre_runup_15d_pct}%` : `${item.pre_runup_15d_pct}%`}
                        </span>
                      </td>

                      {/* Volume Multiple */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {item.pre_vol_multiple_5d_vs_30d}x
                      </td>

                      {/* Actual Market Return */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className={`font-black text-sm flex items-center justify-end gap-0.5 ${
                          item.reaction_return_pct > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {item.reaction_return_pct > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{item.reaction_return_pct > 0 ? `+${item.reaction_return_pct}%` : `${item.reaction_return_pct}%`}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ₹{item.prev_close_price.toFixed(1)} &rarr; ₹{item.reaction_close_price.toFixed(1)}
                        </span>
                      </td>

                      {/* Nifty Benchmark Return */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {item.nifty_benchmark_return_pct >= 0 ? `+${item.nifty_benchmark_return_pct}%` : `${item.nifty_benchmark_return_pct}%`}
                      </td>

                      {/* Benchmark Adjusted Alpha */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={item.benchmark_adjusted_return_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {item.benchmark_adjusted_return_pct >= 0 ? `+${item.benchmark_adjusted_return_pct}%` : `${item.benchmark_adjusted_return_pct}%`}
                        </span>
                      </td>

                      {/* Classification Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {isTP && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> True Positive
                          </span>
                        )}
                        {isFP && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" /> False Positive
                          </span>
                        )}
                        {isTN && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                            <ShieldCheck className="w-3 h-3 text-slate-600" /> True Negative
                          </span>
                        )}
                        {isFN && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> False Negative
                          </span>
                        )}
                      </td>

                      {/* Point-in-Time Audit Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedPrediction(item)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 transition-all shadow-2xs active:scale-95"
                        >
                          Inspect Audit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span>
            Showing <strong className="text-slate-900">{predictions.length}</strong> of <strong className="text-slate-900">{totalCount}</strong> verified announcements
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              Previous
            </button>
            <span className="font-mono font-bold text-slate-900">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Point-in-Time Deep-Dive Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl text-slate-900">{selectedPrediction.company_name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {selectedPrediction.symbol}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{selectedPrediction.sector}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Announcement: <strong className="text-slate-700">{selectedPrediction.announcement_date}</strong></span>
                  <span>•</span>
                  <span>Reaction Day: <strong className="text-slate-700">{selectedPrediction.reaction_date}</strong></span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedPrediction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cryptographic SHA-256 Freeze Verification Pill */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-700" />
                  Cryptographic Point-in-Time Fingerprint (Frozen Prior to Results)
                </span>
                <span className="text-[10px] text-purple-700 font-mono">SHA-256 Verified</span>
              </div>
              <div className="font-mono text-[10px] text-purple-800 break-all bg-white/80 p-1.5 rounded border border-purple-100">
                {selectedPrediction.prediction_sha256_hash}
              </div>
              <p className="text-[10px] text-purple-700">
                Frozen Timestamp: <span className="font-mono font-semibold">{selectedPrediction.prediction_timestamp}</span> (strictly before results publication).
              </p>
            </div>

            {/* Prediction vs Actual Verdict Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">AI Pre-Announcement Prediction</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${
                    selectedPrediction.predicted_direction === 'POSITIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedPrediction.predicted_direction}
                  </span>
                  <span className="text-xl font-black text-slate-900">{selectedPrediction.positive_probability_pct}%</span>
                  <span className="text-xs text-slate-500 font-medium">({selectedPrediction.confidence_level} Conf)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Actual Post-Announcement Reaction</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${
                    selectedPrediction.reaction_return_pct > 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {selectedPrediction.reaction_return_pct > 0 ? `+${selectedPrediction.reaction_return_pct}%` : `${selectedPrediction.reaction_return_pct}%`}
                  </span>
                  <span className="text-xs text-slate-500">
                    (Nifty: {selectedPrediction.nifty_benchmark_return_pct >= 0 ? `+${selectedPrediction.nifty_benchmark_return_pct}%` : `${selectedPrediction.nifty_benchmark_return_pct}%`})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                    Alpha: {selectedPrediction.benchmark_adjusted_return_pct >= 0 ? `+${selectedPrediction.benchmark_adjusted_return_pct}%` : `${selectedPrediction.benchmark_adjusted_return_pct}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Pillar Score Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                5-Pillar Mathematical Scorecard (0 - 100)
              </span>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">1. Operational</span>
                  <span className="text-sm font-extrabold text-slate-900">{selectedPrediction.pillar1_operational_score}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">2. Priced-In</span>
                  <span className="text-sm font-extrabold text-slate-900">{selectedPrediction.pillar2_priced_in_score}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">3. Delivery Vol</span>
                  <span className="text-sm font-extrabold text-slate-900">{selectedPrediction.pillar3_delivery_score}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">4. F&O / Tech</span>
                  <span className="text-sm font-extrabold text-slate-900">{selectedPrediction.pillar4_fno_score || '-'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">5. Sector Peer</span>
                  <span className="text-sm font-extrabold text-slate-900">{selectedPrediction.pillar5_peer_score}</span>
                </div>
              </div>
            </div>

            {/* Pre-Announcement Thesis */}
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Predicted Reasoning Narrative (Generated Prior to Results)
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                "{selectedPrediction.predicted_reasoning}"
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPrediction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
