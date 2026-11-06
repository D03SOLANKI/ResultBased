import React from 'react';
import { 
  CalendarClock, 
  Clock, 
  Layers, 
  Flame, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { OverviewStats } from '../types';

interface StatCardsProps {
  stats: OverviewStats | null;
  onFilterClick: (filter: string) => void;
  activeFilter?: string;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  onFilterClick,
  activeFilter
}) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200"></div>
        ))}
      </div>
    );
  }

  const total30d = stats.scheduled_30d || 1;
  const cats = stats.category_breakdown_30d || {};
  const microCount = cats['Micro Cap'] || 0;
  const smallCount = cats['Small Cap'] || 0;
  const midCount = cats['Mid Cap'] || 0;
  const largeCount = cats['Large Cap'] || 0;
  const smeCount = cats['SME'] || 0;

  const asOf = stats.as_of_date ? new Date(stats.as_of_date + 'T00:00:00') : new Date();
  const todayLabel = asOf.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const tomorrowObj = new Date(asOf.getTime() + 86400000);
  const tomorrowLabel = tomorrowObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return (
    <div className="mb-5 space-y-3">
      {/* Scope Disclaimer / Assurance Pill */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-900 shadow-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium">
            <strong>Exclusively Financial Results & Performance Announcements:</strong> Tracking Quarterly (Q1-Q4), Half-Yearly (H1/H2), Annual Audited Results & Monthly Performance Updates. Non-financial corporate announcements are excluded.
          </span>
        </div>
        <span className="hidden md:inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
          SEBI Reg 33 & 29
        </span>
      </div>

      {/* 4 Minimalist Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Results Today */}
        <div 
          onClick={() => onFilterClick('today')}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
            activeFilter === 'today'
              ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600/20" />
              Results Today
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {todayLabel}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.scheduled_today}
            </span>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterClick('released_today');
                }}
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition flex items-center gap-1 shadow-2xs ${
                  (stats.results_released_today || 0) > 0 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
                title="Click to view results released today"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${(stats.results_released_today || 0) > 0 ? 'bg-white' : 'bg-slate-400'}`}></span>
                {stats.results_released_today || 0} Released Today
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterClick('previously_released');
                }}
                className="text-[9px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-0.5"
                title="View previous releases within rolling 7-day window"
              >
                <span>{stats.results_released_7d ?? stats.total_released ?? 456} Previous Releases (Rolling 7D) →</span>
              </button>
              {(stats.results_pending_7d || 0) > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterClick('pending_releases');
                  }}
                  className="text-[9px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center gap-0.5"
                  title="View pending filings from meetings held within the rolling 7-day window"
                >
                  <span>{stats.results_pending_7d} Filings Pending (7D) →</span>
                </button>
              )}
              {(stats.results_postponed_7d || 0) > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterClick('postponed_releases');
                  }}
                  className="text-[9px] font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-0.5"
                  title="View postponed / rescheduled board meetings"
                >
                  <span>{stats.results_postponed_7d} Rescheduled (7D) →</span>
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate font-medium">
            Quarterly & half-yearly results scheduled today
          </p>
        </div>

        {/* Results Tomorrow */}
        <div 
          onClick={() => onFilterClick('tomorrow')}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
            activeFilter === 'tomorrow'
              ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              Results Tomorrow
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              {tomorrowLabel}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.scheduled_tomorrow}
            </span>
            <span className="text-xs text-slate-500 flex items-center group-hover:text-slate-900 transition-colors font-medium">
              Companies <ArrowUpRight className="w-3 h-3 ml-0.5 text-slate-400" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate font-medium">
            Verified forthcoming results release tomorrow
          </p>
        </div>

        {/* Next 7 Days */}
        <div 
          onClick={() => onFilterClick('7d')}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
            activeFilter === '7d'
              ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-blue-700" />
              Next 7 Days
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
              Peak Week
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.scheduled_7d.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 flex items-center group-hover:text-slate-900 transition-colors font-medium">
              Announcements <ArrowUpRight className="w-3 h-3 ml-0.5 text-slate-400" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate font-medium">
            Through 09 November 2026
          </p>
        </div>

        {/* Next 30 Days */}
        <div 
          onClick={() => onFilterClick('30d')}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
            activeFilter === '30d'
              ? 'bg-purple-50/60 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
              : 'bg-white hover:bg-slate-50/60 border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              Next 30 Days
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
              Full Horizon
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.scheduled_30d.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 flex items-center group-hover:text-slate-900 transition-colors font-medium">
              Pipeline <ArrowUpRight className="w-3 h-3 ml-0.5 text-slate-400" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate font-medium">
            Complete quarterly reporting schedule
          </p>
        </div>

      </div>

      {/* Universe Overview Strip & Distribution */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-slate-500">NSE Equities:</span>
              <span className="font-bold text-slate-900">{stats.total_nse_tracked.toLocaleString()}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span className="text-slate-500">BSE Equities:</span>
              <span className="font-bold text-slate-900">{stats.total_bse_tracked.toLocaleString()}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-slate-500">Dual-Listed:</span>
              <span className="font-bold text-slate-900">{stats.dual_listed_count.toLocaleString()}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span className="text-slate-500">SME Platforms:</span>
              <span className="font-bold text-slate-900">{stats.sme_count.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-semibold">
            30-Day Results Pipeline Breakdown
          </div>
        </div>

        {/* Distribution Progress Bar */}
        <div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div style={{ width: `${(largeCount / total30d) * 100}%` }} className="bg-emerald-600" title={`Large Cap: ${largeCount}`} />
            <div style={{ width: `${(midCount / total30d) * 100}%` }} className="bg-blue-600" title={`Mid Cap: ${midCount}`} />
            <div style={{ width: `${(smallCount / total30d) * 100}%` }} className="bg-sky-500" title={`Small Cap: ${smallCount}`} />
            <div style={{ width: `${(microCount / total30d) * 100}%` }} className="bg-amber-500" title={`Micro Cap: ${microCount}`} />
            <div style={{ width: `${(smeCount / total30d) * 100}%` }} className="bg-purple-600" title={`SME: ${smeCount}`} />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-600 mt-1.5 font-medium">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Large Cap ({largeCount})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Mid Cap ({midCount})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>Small Cap ({smallCount})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Micro Cap ({microCount})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>SME ({smeCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
