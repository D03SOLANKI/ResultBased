import React from 'react';
import { 
  Search, 
  Download, 
  ShieldCheck, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Clock
} from 'lucide-react';
import { ResultEvent } from '../types';

interface CompanyTableProps {
  events: ResultEvent[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  search: string;
  onSearchChange: (val: string) => void;
  exchangeFilter: string;
  onExchangeFilterChange: (val: string) => void;
  mcapFilter: string;
  onMcapFilterChange: (val: string) => void;
  resultCategoryFilter: string;
  onResultCategoryFilterChange: (val: string) => void;
  quickFilter: string;
  onQuickFilterChange: (val: string) => void;
  sortBy: string;
  sortOrder: string;
  onSortToggle: (col: string) => void;
  onSelectCompany: (event: ResultEvent) => void;
  isLoading: boolean;
}

export const CompanyTable: React.FC<CompanyTableProps> = ({
  events,
  total,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  exchangeFilter,
  onExchangeFilterChange,
  mcapFilter,
  onMcapFilterChange,
  resultCategoryFilter,
  onResultCategoryFilterChange,
  quickFilter,
  onQuickFilterChange,
  sortBy,
  sortOrder,
  onSortToggle,
  onSelectCompany,
  isLoading
}) => {
  const exportToCSV = () => {
    if (!events.length) return;
    const headers = [
      "Company Name", "ISIN", "NSE Symbol", "BSE Code", "Market Cap (Cr)",
      "Category", "Listing Segment", "Expected Results Date", "Results Scope", "Period", "Verification Status"
    ];
    const csvRows = [headers.join(",")];
    events.forEach(e => {
      csvRows.push([
        `"${e.company_name.replace(/"/g, '""')}"`,
        e.isin,
        e.nse_symbol || "",
        e.bse_code || "",
        e.market_cap_cr || "",
        `"${e.market_cap_category || ""}"`,
        e.listing_segment,
        e.board_meeting_date,
        `"${e.result_category || "Quarterly Results"}"`,
        `"${e.financial_period || ""}"`,
        `"${e.verification_status || ""}"`
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financial_results_${quickFilter || 'schedule'}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMcapBadge = (category: string | null, segment: string) => {
    if (segment === 'SME') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          SME
        </span>
      );
    }
    switch (category) {
      case 'Large Cap':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Large Cap
          </span>
        );
      case 'Mid Cap':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Mid Cap
          </span>
        );
      case 'Small Cap':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
            Small Cap
          </span>
        );
      case 'Micro Cap':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            Micro Cap
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Small/Micro
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: string | null) => {
    if (cat === 'Half-Yearly Results') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Half-Yearly Results
        </span>
      );
    }
    if (cat === 'Annual Financial Results') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Annual Audited Results
        </span>
      );
    }
    if (cat === 'Monthly Performance Update') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
          Monthly Update
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        Quarterly Results
      </span>
    );
  };

  const hasActiveFilters = Boolean(search || exchangeFilter || mcapFilter || resultCategoryFilter);

  const clearFilters = () => {
    onSearchChange('');
    onExchangeFilterChange('');
    onMcapFilterChange('');
    onResultCategoryFilterChange('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      
      {/* Top Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3.5">
        
        {/* Quick Filter Segmented Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'today', label: "Results Today" },
              { id: 'released_today', label: "⚡ Released Today" },
              { id: 'previously_released', label: "📋 Previous Releases (Rolling 7 Days)" },
              { id: 'pending_releases', label: "⏳ Pending Filings (Rolling 7 Days)" },
              { id: 'postponed_releases', label: "🔄 Postponed / Rescheduled" },
              { id: 'tomorrow', label: "Tomorrow" },
              { id: '7d', label: "Next 7 Days" },
              { id: '30d', label: "Next 30 Days" },
              { id: 'all', label: "All Upcoming Results" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onQuickFilterChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  quickFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 shadow-xs transition"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, NSE symbol (RELIANCE), BSE code (500325), or ISIN..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 transition font-medium"
            />
            {search && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Scope / Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={resultCategoryFilter}
              onChange={(e) => onResultCategoryFilterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
            >
              <option value="">All Results Scopes</option>
              <option value="Quarterly Results">Quarterly Results (Q1-Q4)</option>
              <option value="Half-Yearly Results">Half-Yearly Results (H1/H2)</option>
              <option value="Annual Financial Results">Annual Audited Results</option>
              <option value="Monthly Performance Update">Monthly Performance Updates</option>
            </select>
          </div>

          {/* Exchange Filter */}
          <div className="sm:col-span-2">
            <select
              value={exchangeFilter}
              onChange={(e) => onExchangeFilterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
            >
              <option value="">All Exchanges</option>
              <option value="NSE">NSE Listed</option>
              <option value="BSE">BSE Listed</option>
              <option value="DUAL">Dual-Listed</option>
            </select>
          </div>

          {/* Market Cap Filter */}
          <div className="sm:col-span-2">
            <select
              value={mcapFilter}
              onChange={(e) => onMcapFilterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
            >
              <option value="">All Market Caps</option>
              <option value="Large Cap">Large Cap (&gt;₹1.06L Cr)</option>
              <option value="Mid Cap">Mid Cap (₹33K-₹1.06L Cr)</option>
              <option value="Small Cap">Small Cap (₹12K-₹33K Cr)</option>
              <option value="Micro Cap">Micro Cap (&lt;₹12K Cr)</option>
              <option value="SME">SME Platforms</option>
            </select>
          </div>
        </div>

        {/* Rolling 7-Day Window Context Banner */}
        {quickFilter === 'previously_released' && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50/80 border border-blue-200/90 rounded-xl px-4 py-2.5 text-xs text-blue-950">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="font-bold">Rolling 7-Day Window Active:</span>
              <span className="text-blue-800 font-medium">
                Maintaining strictly the latest 7 days of verified releases. When a new day (e.g. Day 8) is added, the oldest day (Day 1) automatically rotates out.
              </span>
            </div>
            <span className="font-mono font-bold text-[11px] bg-white text-blue-900 px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs">
              Rolling 7-Day FIFO Window
            </span>
          </div>
        )}

        {/* Pending Filings Context Banner */}
        {quickFilter === 'pending_releases' && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/80 border border-amber-200/90 rounded-xl px-4 py-2.5 text-xs text-amber-950">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
              <span className="font-bold">Pending Filings Audit (Rolling 7-Day Window):</span>
              <span className="text-amber-800 font-medium">
                Companies whose scheduled board meetings took place in the past 7 days, but whose official SEBI Reg 33 financial statements are awaiting exchange submission or verification.
              </span>
            </div>
            <span className="font-mono font-bold text-[11px] bg-white text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
              Awaiting Exchange Filing
            </span>
          </div>
        )}

        {/* Postponed Meetings Context Banner */}
        {quickFilter === 'postponed_releases' && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-purple-50/80 border border-purple-200/90 rounded-xl px-4 py-2.5 text-xs text-purple-950">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
              <span className="font-bold">Regulatory Rescheduling & Postponements:</span>
              <span className="text-purple-800 font-medium">
                Companies that officially intimated the stock exchanges (SEBI LODR Reg 29) that their board meeting date was rescheduled or postponed to a later date.
              </span>
            </div>
            <span className="font-mono font-bold text-[11px] bg-white text-purple-900 px-2.5 py-0.5 rounded-md border border-purple-200 shadow-2xs">
              SEBI Reg 29 Intimation
            </span>
          </div>
        )}

      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Company & Identifiers</th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => onSortToggle('date')}>
                <div className="flex items-center space-x-1">
                  <span>Expected Results Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Financial Results Scope & Period</th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => onSortToggle('mcap')}>
                <div className="flex items-center space-x-1">
                  <span>Market Cap</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium text-xs text-slate-600">Loading verified financial results announcements...</span>
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  {quickFilter === 'released_today' ? (
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 mb-1 border border-amber-200">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-slate-900">No results released yet today</p>
                      <p className="text-xs text-slate-500">
                        Board meetings for companies scheduled today are currently in progress. The real-time surveillance engine is actively monitoring exchange feeds for official filings.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => onQuickFilterChange('previously_released')}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
                        >
                          View Previous Releases (Rolling 7 Days) →
                        </button>
                      </div>
                    </div>
                  ) : quickFilter === 'previously_released' ? (
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 mb-1 border border-blue-200">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-slate-900">No releases in the rolling 7-day window</p>
                      <p className="text-xs text-slate-500">
                        Only the most recent 7 days of verified financial announcements are maintained in this rolling view.
                      </p>
                    </div>
                  ) : quickFilter === 'pending_releases' ? (
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-1 border border-emerald-200">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-slate-900">No pending filings in the rolling 7-day window</p>
                      <p className="text-xs text-slate-500">
                        All board meetings held within the past 7 days have their financial results successfully submitted to the exchanges.
                      </p>
                    </div>
                  ) : quickFilter === 'postponed_releases' ? (
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-purple-50 text-purple-600 mb-1 border border-purple-200">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-slate-900">No postponed meetings found</p>
                      <p className="text-xs text-slate-500">
                        No board meeting reschedulings or postponements matching the current filters.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-800">No scheduled results found</p>
                      <p className="text-xs text-slate-500 mt-1">Try clearing filters or selecting another date</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              events.map((e) => {
                const isReleased = e.event_status === 'Results Released';
                const todayStr = new Date().toISOString().split('T')[0];
                const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                const isToday = e.board_meeting_date === todayStr;
                const isTomorrow = e.board_meeting_date === tomorrowStr;

                return (
                  <tr
                    key={e.event_id}
                    onClick={() => onSelectCompany(e)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    {/* Company & Identifiers */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-950 text-sm group-hover:text-slate-700 transition-colors">
                        {e.company_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {e.nse_symbol && (
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-blue-200">
                            NSE: {e.nse_symbol}
                          </span>
                        )}
                        {e.bse_code && (
                          <span className="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-amber-200">
                            BSE: {e.bse_code}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                          {e.isin}
                        </span>
                      </div>
                    </td>

                    {/* Expected Results Date / Status */}
                    <td className="py-3.5 px-4">
                      {isReleased ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            RESULTS RELEASED
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-700 block mt-0.5">
                            {e.actual_results_date || e.board_meeting_date}
                          </span>
                          {e.actual_results_time && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {e.actual_results_time}
                            </span>
                          )}
                        </div>
                      ) : e.event_status === 'Results Pending' ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            FILING PENDING
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-700 block mt-0.5">
                            {e.board_meeting_date}
                          </span>
                          <span className="text-[9px] text-amber-700 font-medium block">
                            Meeting Held • Awaiting PDF
                          </span>
                        </div>
                      ) : e.event_status === 'Results Postponed' ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-600 text-white shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            POSTPONED
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-700 block mt-0.5 line-through">
                            {e.board_meeting_date}
                          </span>
                          <span className="text-[9px] text-purple-700 font-bold block">
                            {e.verification_status || 'Rescheduled'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="font-mono text-slate-950 font-bold text-xs">
                            {e.board_meeting_date}
                          </div>
                          <div className="mt-0.5">
                            {isToday ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900">
                                TODAY (IN PROGRESS)
                              </span>
                            ) : isTomorrow ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900">
                                TOMORROW
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Financial Results Scope & Period */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getCategoryBadge(e.result_category)}
                        {e.performance_verdict && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {e.performance_verdict}
                          </span>
                        )}
                      </div>
                      {e.pat_growth_yoy_pct !== null && e.pat_growth_yoy_pct !== undefined ? (
                        <div className="text-[11px] font-semibold text-slate-700 mt-1 flex items-center gap-2">
                          <span className={e.pat_growth_yoy_pct >= 0 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                            PAT: {e.pat_growth_yoy_pct > 0 ? '+' : ''}{e.pat_growth_yoy_pct}% YoY
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className={e.revenue_growth_yoy_pct && e.revenue_growth_yoy_pct >= 0 ? "text-emerald-700" : "text-rose-700"}>
                            Rev: {e.revenue_growth_yoy_pct && e.revenue_growth_yoy_pct > 0 ? '+' : ''}{e.revenue_growth_yoy_pct}% YoY
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 mt-1 font-medium truncate max-w-[220px]">
                          {e.financial_period || 'Financial Results Announcement'}
                        </div>
                      )}
                    </td>

                    {/* Market Cap & Stock Price Impact */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {e.market_cap_cr ? `₹${e.market_cap_cr.toLocaleString()} Cr` : 'N/A'}
                        </span>
                        {e.price_change_pct !== null && e.price_change_pct !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold ${
                            e.price_change_pct >= 0 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {e.price_change_pct > 0 ? '+' : ''}{e.price_change_pct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        {getMcapBadge(e.market_cap_category, e.listing_segment)}
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4">
                      {e.event_status === 'Results Pending' ? (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-[11px] font-bold text-amber-800">
                              Awaiting Filing
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Board Meeting Held ({e.board_meeting_date})
                          </span>
                        </div>
                      ) : e.event_status === 'Results Postponed' ? (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="text-[11px] font-bold text-purple-800">
                              Rescheduled
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5 max-w-[180px] truncate" title={e.postponement_reason || ''}>
                            {e.postponement_reason || 'SEBI Reg 29 Intimation'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[11px] font-bold text-emerald-800">
                              {e.verification_status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[130px]">
                            {e.announcement_source}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onSelectCompany(e);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {events.length > 0 ? (page - 1) * 50 + 1 : 0} to {Math.min(page * 50, total)} of <span className="font-bold text-slate-950">{total.toLocaleString()}</span> {
            quickFilter === 'previously_released' ? 'verified releases (Rolling 7D)' :
            quickFilter === 'pending_releases' ? 'pending filings (Rolling 7D)' :
            quickFilter === 'postponed_releases' ? 'postponed / rescheduled meetings' :
            quickFilter === 'released_today' ? 'released today' :
            'companies scheduled'
          }
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-800 px-2 text-xs">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
