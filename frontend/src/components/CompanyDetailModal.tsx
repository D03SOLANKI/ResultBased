import React, { useEffect, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  Clock, 
  FileText,
  BarChart2,
  Layers,
  AlertCircle
} from 'lucide-react';
import { ResultEvent, CompanyPerformanceScorecard } from '../types';

interface CompanyDetailModalProps {
  event: ResultEvent | null;
  onClose: () => void;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  event,
  onClose
}) => {
  const [perfData, setPerfData] = useState<CompanyPerformanceScorecard | null>(null);
  const [activeBasis, setActiveBasis] = useState<string>('Consolidated');
  const [isLoadingPerf, setIsLoadingPerf] = useState<boolean>(true);

  useEffect(() => {
    if (!event) return;
    setIsLoadingPerf(true);
    fetch(`/api/performance/${event.isin}?basis=${activeBasis}`)
      .then(res => res.json())
      .then(data => {
        setPerfData(data);
        if (data.active_basis && data.active_basis !== activeBasis) {
          setActiveBasis(data.active_basis);
        }
        setIsLoadingPerf(false);
      })
      .catch(err => {
        console.error('Failed to load performance scorecard', err);
        setIsLoadingPerf(false);
      });
  }, [event, activeBasis]);

  if (!event) return null;

  const hasReleased = perfData?.has_released_results && perfData.latest_performance;
  const lp = perfData?.latest_performance;
  const comp = perfData?.comparative_analysis;
  const ind = perfData?.performance_indicators;
  const price = perfData?.stock_price_impact;
  const bases = perfData?.available_reporting_bases || ['Consolidated', 'Standalone'];

  const renderGrowth = (val: number | null | undefined, isBps = false) => {
    if (val === null || val === undefined) return <span className="text-slate-400 font-mono">-</span>;
    const isPos = val > 0;
    const isZero = val === 0;
    const color = isZero ? 'text-slate-500' : isPos ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50';
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${color}`}>
        {isPos ? <TrendingUp className="w-3 h-3" /> : !isZero ? <TrendingDown className="w-3 h-3" /> : null}
        {isPos ? '+' : ''}{val.toFixed(2)}{isBps ? ' bps' : '%'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {event.isin}
              </span>
              {event.listing_segment === 'SME' ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  SME Platform
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Mainboard Listed
                </span>
              )}
              {hasReleased && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" /> RESULTS RELEASED & VERIFIED
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-2 tracking-tight">{event.company_name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
              {event.nse_symbol && <span>NSE: <strong className="text-slate-900 font-mono">{event.nse_symbol}</strong></span>}
              {event.bse_code && <span>BSE: <strong className="text-slate-900 font-mono">{event.bse_code}</strong></span>}
              {event.market_cap_category && <span>Tier: <strong className="text-slate-800">{event.market_cap_category}</strong></span>}
              {event.market_cap_cr && <span>Mcap: <strong className="text-slate-800 font-mono">₹{event.market_cap_cr.toLocaleString()} Cr</strong></span>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          
          {/* Section A: REAL-TIME RELEASE DETECTION & PERFORMANCE SCORECARD */}
          {hasReleased && lp && comp && ind && price ? (
            <div className="space-y-4">
              
              {/* Standalone vs Consolidated Toggle */}
              {bases.length > 1 && (
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    Reporting Basis View:
                  </span>
                  <div className="flex items-center space-x-1.5 bg-slate-200/60 p-1 rounded-lg">
                    {bases.map((b) => (
                      <button
                        key={b}
                        onClick={() => setActiveBasis(b)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                          activeBasis === b
                            ? 'bg-white text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Real-time Verdict & Highlights Banner */}
              <div className={`p-4 rounded-xl border ${
                ind.is_improved 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide text-white shadow-2xs ${
                      ind.is_improved ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                      {ind.verdict}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      Released: <strong className="font-mono text-slate-900">{lp.filing_time}</strong> ({lp.filing_date})
                    </span>
                  </div>
                  {lp.filing_url && (
                    <a
                      href={lp.filing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Official Exchange Filing PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {ind.notes && (
                  <div className="mt-2 text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{ind.notes}</span>
                  </div>
                )}
              </div>

              {/* 2. Stock Price Reaction Card (Verified Ground Truth) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      Actual Exchange Price Reaction
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {price.market_session}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-black ${
                    (price.total_reaction_pct || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {price.total_reaction_pct !== undefined ? (price.total_reaction_pct > 0 ? '+' : '') + price.total_reaction_pct.toFixed(2) + '%' : 'N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Previous Close</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{price.prev_trading_day_close?.toFixed(2) || '-'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Announcement Close</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{price.announcement_close?.toFixed(2) || '-'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Daily: {renderGrowth(price.daily_close_return_pct)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Next Day (T+1)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {price.next_day_close ? `₹${price.next_day_close.toFixed(2)}` : 'N/A'}
                    </span>
                    {price.next_day_return_pct !== null && price.next_day_return_pct !== undefined && (
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        T+1: {renderGrowth(price.next_day_return_pct)}
                      </span>
                    )}
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Volume Surge</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {price.volume_surge_multiplier}x Avg Vol
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                      {price.verification_status === 'VERIFIED_GROUND_TRUTH' ? 'Bhavcopy Verified' : 'Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Comprehensive Financial Results Comparison Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-700" />
                    Financial Results & Growth Matrix ({lp.financial_period} • {activeBasis})
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Values in ₹ Crores (Cr)</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Metric</th>
                        <th className="py-2.5 px-3 font-mono font-bold text-slate-900 bg-slate-100/60">
                          Latest ({lp.financial_period})
                        </th>
                        <th className="py-2.5 px-3 font-mono">
                          Prev Qtr ({comp.sequential_qoq?.previous_period || 'N/A'})
                        </th>
                        <th className="py-2.5 px-3">Q-o-Q Growth</th>
                        <th className="py-2.5 px-3 font-mono">
                          Prev Year ({comp.year_on_year_yoy.previous_period || 'N/A'})
                        </th>
                        <th className="py-2.5 px-3">Y-o-Y Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {/* Revenue */}
                      <tr className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-bold text-slate-900">Revenue from Operations</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 bg-slate-50/40">
                          ₹{lp.revenue_cr.toLocaleString()} Cr
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {comp.sequential_qoq?.previous_revenue_cr ? `₹${comp.sequential_qoq.previous_revenue_cr.toLocaleString()} Cr` : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {renderGrowth(comp.sequential_qoq?.revenue_growth_pct)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {comp.year_on_year_yoy.previous_revenue_cr ? `₹${comp.year_on_year_yoy.previous_revenue_cr.toLocaleString()} Cr` : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {renderGrowth(comp.year_on_year_yoy.revenue_growth_pct)}
                        </td>
                      </tr>

                      {/* EBITDA */}
                      {lp.ebitda_cr !== undefined && lp.ebitda_cr !== null && (
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-bold text-slate-900">Operating Profit (EBITDA)</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 bg-slate-50/40">
                            ₹{lp.ebitda_cr.toLocaleString()} Cr
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">-</td>
                          <td className="py-2.5 px-3 text-slate-400">-</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">-</td>
                          <td className="py-2.5 px-3 text-slate-400">-</td>
                        </tr>
                      )}

                      {/* Net Profit (PAT) */}
                      <tr className="hover:bg-slate-50/60 bg-emerald-50/20">
                        <td className="py-2.5 px-3 font-bold text-slate-900">Profit After Tax (PAT)</td>
                        <td className="py-2.5 px-3 font-mono font-extrabold text-slate-900 bg-emerald-50/40">
                          ₹{lp.pat_cr.toLocaleString()} Cr
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {comp.sequential_qoq?.previous_pat_cr !== null && comp.sequential_qoq?.previous_pat_cr !== undefined
                            ? `₹${comp.sequential_qoq.previous_pat_cr.toLocaleString()} Cr` 
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {renderGrowth(comp.sequential_qoq?.pat_growth_pct)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {comp.year_on_year_yoy.previous_pat_cr !== null && comp.year_on_year_yoy.previous_pat_cr !== undefined
                            ? `₹${comp.year_on_year_yoy.previous_pat_cr.toLocaleString()} Cr` 
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {renderGrowth(comp.year_on_year_yoy.pat_growth_pct)}
                        </td>
                      </tr>

                      {/* Diluted EPS */}
                      {lp.eps !== null && lp.eps !== undefined && (
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-bold text-slate-900">Diluted EPS (₹)</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 bg-slate-50/40">
                            ₹{lp.eps.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {comp.sequential_qoq?.previous_eps ? `₹${comp.sequential_qoq.previous_eps.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {renderGrowth(comp.sequential_qoq?.eps_growth_pct)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {comp.year_on_year_yoy.previous_eps ? `₹${comp.year_on_year_yoy.previous_eps.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {renderGrowth(comp.year_on_year_yoy.eps_growth_pct)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* If Results Not Yet Released */
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Results Consideration Scheduled ({event.board_meeting_date})
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Financial results have not yet been published by the company. Real-time surveillance is active and will immediately update the status and display full verified performance and stock price reaction once the filing is uploaded to the exchange.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Assurance Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified under SEBI LODR Reg 33 & 29</span>
            </div>
            <span className="font-mono text-[11px]">Source: {event.announcement_source || 'NSE & BSE Feeds'}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
