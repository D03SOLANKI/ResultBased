import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Moon, 
  Search, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react';
import { PostMarketStockItem, PostMarketSummary } from '../types';

export const PostMarketTracker: React.FC = () => {
  const [stocks, setStocks] = useState<PostMarketStockItem[]>([]);
  const [summary, setSummary] = useState<PostMarketSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedPattern, setSelectedPattern] = useState<string>('all');
  const [selectedMcap, setSelectedMcap] = useState<string>('all');
  const [selectedStockDetail, setSelectedStockDetail] = useState<PostMarketStockItem | null>(null);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/post-market-tracker/stocks').then(res => res.json()),
      fetch('/api/post-market-tracker/summary').then(res => res.json())
    ])
      .then(([stocksData, summaryData]) => {
        setStocks(stocksData.stocks || []);
        setSummary(summaryData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load post-market tracker data', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      // Pattern filter
      if (selectedPattern !== 'all') {
        if (selectedPattern === 'rally' && !stock.reaction_pattern.includes('Rally') && !stock.reaction_pattern.includes('Breakout')) return false;
        if (selectedPattern === 'sell' && !stock.reaction_pattern.includes('Sell-off')) return false;
        if (selectedPattern === 'fade' && !stock.reaction_pattern.includes('Fade')) return false;
        if (selectedPattern === 'reversal' && !stock.reaction_pattern.includes('Reversal')) return false;
        if (selectedPattern === 'flat' && !stock.reaction_pattern.includes('Flat') && !stock.reaction_pattern.includes('Muted')) return false;
      }

      // Mcap filter
      if (selectedMcap !== 'all' && stock.market_cap_category !== selectedMcap) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = stock.company_name.toLowerCase().includes(q);
        const matchNse = stock.nse_symbol?.toLowerCase().includes(q);
        const matchBse = stock.bse_code?.toLowerCase().includes(q);
        const matchIsin = stock.isin.toLowerCase().includes(q);
        if (!matchName && !matchNse && !matchBse && !matchIsin) return false;
      }

      return true;
    });
  }, [stocks, selectedPattern, selectedMcap, search]);

  const handleExportCSV = () => {
    if (filteredStocks.length === 0) return;
    const headers = [
      "Company Name", "NSE Symbol", "BSE Code", "Market Cap Category", "Results Date",
      "Announcement Time", "Financial Period", "Revenue (Cr)", "Revenue YoY (%)",
      "PAT (Cr)", "PAT YoY (%)", "EBITDA Margin (%)", "Verdict", "Yesterday Close (INR)",
      "Today Open (INR)", "Opening Gap (%)", "Current LTP (INR)", "Total Change (%)",
      "Intraday Drift (%)", "Volume Surge", "Reaction Pattern"
    ];

    const rows = filteredStocks.map(s => [
      `"${s.company_name}"`,
      s.nse_symbol || '',
      s.bse_code || '',
      s.market_cap_category,
      s.results_date,
      `"${s.announcement_time}"`,
      s.financial_period,
      s.revenue_cr,
      s.revenue_growth_yoy_pct,
      s.pat_cr,
      s.pat_growth_yoy_pct,
      s.ebitda_margin_pct,
      `"${s.financial_verdict}"`,
      s.yesterday_close,
      s.today_open,
      s.opening_gap_pct,
      s.current_ltp,
      s.price_change_pct,
      s.intraday_change_pct,
      `${s.volume_surge_multiplier}x`,
      `"${s.reaction_pattern}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Post_Market_Earnings_Reactions_${summary?.tracking_date || 'session'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPatternBadge = (pattern: string) => {
    if (pattern.includes('Breakout') || pattern.includes('Rally')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          {pattern}
        </span>
      );
    }
    if (pattern.includes('Sell-off') || pattern.includes('Drop')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
          {pattern}
        </span>
      );
    }
    if (pattern.includes('Fade')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          {pattern}
        </span>
      );
    }
    if (pattern.includes('Reversal')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          {pattern}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Activity className="w-3.5 h-3.5 text-slate-500" />
        {pattern}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Scope & Decoupling Assurance Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                POST-MARKET SURVEILLANCE ENGINE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Decoupled Surveillance Module
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Yesterday: {summary?.yesterday_announcement_date || '2026-11-04'} → Today: {summary?.tracking_date || '2026-11-05'}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Post-Market Results Reaction Surveillance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitors and analyzes today’s live trading session performance for every company that announced 
              financial results after market hours (after 15:30:00 IST) on the previous day. 
              Tracks overnight pre-market price discovery (Opening Gap %) and subsequent intraday institutional participation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 backdrop-blur-sm shadow-xs"
            >
              <Download className="w-4 h-4" />
              Export Reaction CSV
            </button>
            <button
              onClick={fetchData}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Independence Disclaimer Callout */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2 text-[11px] text-indigo-200/80">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-300" />
          <span>
            <strong>Architectural Independence Guarantee:</strong> This module is strictly observational. 
            It is not integrated into strategy selection, automated entry/exit signals, or position sizing engines. 
            All percentage calculations use official Bhavcopy closes and exchange pre-market order auction prints.
          </span>
        </div>
      </div>

      {/* 4 Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tracked Equities */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tracked Releases</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summary?.total_tracked || 0}</span>
            <span className="text-xs font-semibold text-slate-500">Post-Market Filings</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              {summary?.positive_reactions_count || 0} Gainers
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              <TrendingDown className="w-3 h-3" />
              {summary?.negative_reactions_count || 0} Losers
            </span>
          </div>
        </div>

        {/* Card 2: Average Opening Gap */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Overnight Gap</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${
              (summary?.avg_opening_gap_pct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {(summary?.avg_opening_gap_pct || 0) >= 0 ? '+' : ''}{summary?.avg_opening_gap_pct?.toFixed(2)}%
            </span>
            <span className="text-xs font-semibold text-slate-500">at 09:15 AM Open</span>
          </div>
          <p className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Avg Session Return:</span>
            <span className="font-bold font-mono text-slate-800">
              {(summary?.avg_price_change_pct || 0) >= 0 ? '+' : ''}{summary?.avg_price_change_pct?.toFixed(2)}%
            </span>
          </p>
        </div>

        {/* Card 3: Top Performer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top Outperformer</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {summary?.top_performer ? (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-slate-900 truncate">
                  {summary.top_performer.symbol}
                </span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  +{summary.top_performer.price_change_pct.toFixed(2)}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>LTP: ₹{summary.top_performer.current_ltp.toFixed(2)}</span>
                <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                  Gap +{summary.top_performer.opening_gap_pct}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">No data available</p>
          )}
        </div>

        {/* Card 4: Worst Performer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Heaviest Sell-off</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          {summary?.worst_performer ? (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-slate-900 truncate">
                  {summary.worst_performer.symbol}
                </span>
                <span className="text-lg font-black text-rose-600 font-mono">
                  {summary.worst_performer.price_change_pct.toFixed(2)}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>LTP: ₹{summary.worst_performer.current_ltp.toFixed(2)}</span>
                <span className="font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                  Gap {summary.worst_performer.opening_gap_pct}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">No data available</p>
          )}
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Segmented Pattern Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'all', label: `All Patterns (${stocks.length})` },
              { id: 'rally', label: `🚀 Gap Up & Rally / Breakout (${summary?.gap_up_and_rally_count || 0})` },
              { id: 'sell', label: `🔻 Gap Down & Sell-off (${summary?.gap_down_and_sell_count || 0})` },
              { id: 'fade', label: '⚡ Gap Up & Fade' },
              { id: 'reversal', label: '🔄 Gap Down & Reversal' },
              { id: 'flat', label: '⏸️ Muted / Flat' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedPattern(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedPattern === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Market Cap:</span>
            <select
              value={selectedMcap}
              onChange={e => setSelectedMcap(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Market Caps</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Mid Cap">Mid Cap</option>
              <option value="Small Cap">Small Cap</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company name, NSE symbol (e.g. PFC, APOLLOHOSP), BSE code, or ISIN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Company & Identifiers</th>
                <th className="py-3.5 px-4">Yesterday's Post-Market Filing</th>
                <th className="py-3.5 px-4">Reported Financials</th>
                <th className="py-3.5 px-4 text-right">Yesterday Close</th>
                <th className="py-3.5 px-4 text-right">Today Open & Gap</th>
                <th className="py-3.5 px-4 text-right">Current LTP & Return</th>
                <th className="py-3.5 px-4 text-right">Intraday Drift</th>
                <th className="py-3.5 px-4">Volume Surge</th>
                <th className="py-3.5 px-4">Market Reaction Pattern</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading post-market reaction data...</span>
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Moon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-800">No matching post-market filings found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredStocks.map(stock => {
                  const isPositiveChange = stock.price_change_pct >= 0;
                  const isPositiveGap = stock.opening_gap_pct >= 0;
                  const isPositiveIntraday = stock.intraday_change_pct >= 0;

                  return (
                    <tr 
                      key={stock.tracker_id} 
                      className="hover:bg-indigo-50/30 transition cursor-pointer"
                      onClick={() => setSelectedStockDetail(stock)}
                    >
                      {/* Company & Identifiers */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 hover:text-indigo-600 transition flex items-center gap-1.5">
                          {stock.company_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px]">
                          {stock.nse_symbol && (
                            <span className="font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              NSE: {stock.nse_symbol}
                            </span>
                          )}
                          {stock.bse_code && (
                            <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              BSE: {stock.bse_code}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {stock.market_cap_category}
                          </span>
                        </div>
                      </td>

                      {/* Filing Information */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{stock.announcement_time}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Date: {stock.results_date} (Post-Market)
                        </div>
                        <a
                          href={stock.filing_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline mt-1"
                        >
                          Official PDF Filing <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      {/* Reported Financials */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px] gap-2">
                            <span className="text-slate-500">Rev:</span>
                            <span className="font-bold text-slate-800">
                              ₹{stock.revenue_cr.toLocaleString()} Cr 
                              <span className={`ml-1 text-[10px] font-bold ${
                                stock.revenue_growth_yoy_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                ({stock.revenue_growth_yoy_pct >= 0 ? '+' : ''}{stock.revenue_growth_yoy_pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] gap-2">
                            <span className="text-slate-500">PAT:</span>
                            <span className="font-bold text-slate-800">
                              ₹{stock.pat_cr.toLocaleString()} Cr 
                              <span className={`ml-1 text-[10px] font-bold ${
                                stock.pat_growth_yoy_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                ({stock.pat_growth_yoy_pct >= 0 ? '+' : ''}{stock.pat_growth_yoy_pct}%)
                              </span>
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            EBITDA Margin: {stock.ebitda_margin_pct}% • {stock.financial_verdict}
                          </div>
                        </div>
                      </td>

                      {/* Yesterday Close */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                        ₹{stock.yesterday_close.toFixed(2)}
                      </td>

                      {/* Today Open & Opening Gap */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-slate-800">
                          ₹{stock.today_open.toFixed(2)}
                        </div>
                        <div className={`text-[11px] font-black inline-flex items-center justify-end gap-0.5 ${
                          isPositiveGap ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isPositiveGap ? '▲ +' : '▼ '}{stock.opening_gap_pct.toFixed(2)}%
                        </div>
                      </td>

                      {/* Current LTP & Total Return */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{stock.current_ltp.toFixed(2)}
                        </div>
                        <div className={`text-xs font-black px-1.5 py-0.5 rounded inline-block ${
                          isPositiveChange 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isPositiveChange ? '+' : ''}{stock.price_change_pct.toFixed(2)}%
                        </div>
                      </td>

                      {/* Intraday Drift */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className={`text-xs font-bold ${
                          isPositiveIntraday ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isPositiveIntraday ? '+' : ''}{stock.intraday_change_pct.toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isPositiveIntraday ? 'Accumulated' : 'Distributed'}
                        </div>
                      </td>

                      {/* Volume Surge */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800 text-[11px]">
                          {(stock.today_volume / 100000).toFixed(1)} Lakh shares
                        </div>
                        <div className="text-[10px] font-semibold text-indigo-600">
                          {stock.volume_surge_multiplier.toFixed(2)}x 30D Avg
                        </div>
                      </td>

                      {/* Market Reaction Pattern */}
                      <td className="py-3.5 px-4">
                        {getPatternBadge(stock.reaction_pattern)}
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 max-w-xs">
                          {stock.price_movement_narrative}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Detail Modal */}
      {selectedStockDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    POST-MARKET REACTION AUDIT
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedStockDetail.isin}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedStockDetail.company_name}
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  NSE: {selectedStockDetail.nse_symbol || 'N/A'} • BSE: {selectedStockDetail.bse_code || 'N/A'} • {selectedStockDetail.industry}
                </div>
              </div>
              <button
                onClick={() => setSelectedStockDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Price Discovery Progression */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Price Discovery Progression
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Yesterday Close</span>
                  <span className="text-base font-black text-slate-900 font-mono mt-1 block">
                    ₹{selectedStockDetail.yesterday_close.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">Official Bhavcopy</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Today Open (Pre-Mkt)</span>
                  <span className="text-base font-black text-slate-900 font-mono mt-1 block">
                    ₹{selectedStockDetail.today_open.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    selectedStockDetail.opening_gap_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    Gap {selectedStockDetail.opening_gap_pct >= 0 ? '+' : ''}{selectedStockDetail.opening_gap_pct}%
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">3. Current LTP</span>
                  <span className="text-base font-black text-indigo-600 font-mono mt-1 block">
                    ₹{selectedStockDetail.current_ltp.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    selectedStockDetail.price_change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    Total {selectedStockDetail.price_change_pct >= 0 ? '+' : ''}{selectedStockDetail.price_change_pct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-400 block text-[10px]">Revenue (Q2 FY27)</span>
                <span className="font-bold text-slate-900">₹{selectedStockDetail.revenue_cr.toLocaleString()} Cr</span>
                <span className="text-[10px] font-bold text-emerald-600 block">+{selectedStockDetail.revenue_growth_yoy_pct}% YoY</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-400 block text-[10px]">PAT (Q2 FY27)</span>
                <span className="font-bold text-slate-900">₹{selectedStockDetail.pat_cr.toLocaleString()} Cr</span>
                <span className="text-[10px] font-bold text-emerald-600 block">+{selectedStockDetail.pat_growth_yoy_pct}% YoY</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-400 block text-[10px]">EBITDA Margin</span>
                <span className="font-bold text-slate-900">{selectedStockDetail.ebitda_margin_pct}%</span>
                <span className="text-[10px] text-slate-500 block">₹{selectedStockDetail.ebitda_cr.toLocaleString()} Cr</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-400 block text-[10px]">Volume Surge</span>
                <span className="font-bold text-indigo-600">{selectedStockDetail.volume_surge_multiplier}x</span>
                <span className="text-[10px] text-slate-500 block">vs 30D Avg</span>
              </div>
            </div>

            {/* Narrative Analysis */}
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-1">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Intraday Behavioral Narrative:
              </span>
              <p className="text-indigo-800 leading-relaxed">
                {selectedStockDetail.price_movement_narrative}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <a
                href={selectedStockDetail.filing_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5"
              >
                Official Exchange Filing PDF <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setSelectedStockDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mathematical Methodology Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600" />
          Post-Market Earnings Reaction Verification Methodology
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px]">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">1. Overnight Opening Gap</span>
            <p className="text-slate-500 text-[10px]">Pre-market auction price vs prior session close:</p>
            <p className="font-bold text-indigo-600">((Today Open - Yesterday Close) / Yesterday Close) × 100</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">2. Total Market Reaction</span>
            <p className="text-slate-500 text-[10px]">Net change from yesterday close to current LTP:</p>
            <p className="font-bold text-indigo-600">((Current LTP - Yesterday Close) / Yesterday Close) × 100</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">3. Intraday Session Drift</span>
            <p className="text-slate-500 text-[10px]">Institutional follow-through after the opening gap:</p>
            <p className="font-bold text-indigo-600">((Current LTP - Today Open) / Today Open) × 100</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};
