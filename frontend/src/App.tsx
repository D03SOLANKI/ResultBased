import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { ResultsCalendar } from './components/ResultsCalendar';
import { CompanyTable } from './components/CompanyTable';
import { DailyReportView } from './components/DailyReportView';
import { AnnouncementMonitor } from './components/AnnouncementMonitor';
import { CompanyDetailModal } from './components/CompanyDetailModal';
import { MarketReactionAnalysis } from './components/MarketReactionAnalysis';
import { PostMarketTracker } from './components/PostMarketTracker';
import { StrategyValidationDashboard } from './components/StrategyValidationDashboard';
import { BacktestDashboard } from './components/BacktestDashboard';
import { OverviewStats, ResultEvent } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'table' | 'reaction' | 'post_market' | 'validation' | 'backtest' | 'calendar' | 'report' | 'announcements'>('table');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [events, setEvents] = useState<ResultEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [exchangeFilter, setExchangeFilter] = useState<string>('');
  const [mcapFilter, setMcapFilter] = useState<string>('');
  const [resultCategoryFilter, setResultCategoryFilter] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<string>('today');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('mcap');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedCompany, setSelectedCompany] = useState<ResultEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Strictly enforce light theme across the application
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  // Fetch Stats Overview
  const fetchStats = useCallback(() => {
    fetch('/api/stats/overview')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats', err));
  }, []);

  // Fetch Events based on active filters
  const fetchEvents = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedDate) {
      params.append('date_from', selectedDate);
      params.append('date_to', selectedDate);
    } else if (quickFilter) {
      params.append('quick_filter', quickFilter);
    }

    if (exchangeFilter) params.append('exchange', exchangeFilter);
    if (mcapFilter) params.append('market_cap', mcapFilter);
    if (resultCategoryFilter) params.append('result_category', resultCategoryFilter);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', '50');
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder);

    fetch(`/api/calendar/events?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setTotalEvents(data.total || 0);
        setTotalPages(data.total_pages || 1);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load events', err);
        setIsLoading(false);
      });
  }, [selectedDate, quickFilter, exchangeFilter, mcapFilter, resultCategoryFilter, search, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle Quick Filter clicks from cards
  const handleCardFilterClick = (filter: string) => {
    setSelectedDate(null);
    setQuickFilter(filter);
    setPage(1);
    setActiveTab('table');
  };

  // Handle Calendar date selection
  const handleCalendarDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setQuickFilter('');
    setPage(1);
    setActiveTab('table');
  };

  // Handle manual sync trigger
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/report/sync', { method: 'POST' });
      fetchStats();
      fetchEvents();
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Minimalist Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleSync}
        isSyncing={isSyncing}
        totalUnique={stats?.total_unique_companies || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Top Operational Metrics */}
        <StatCards
          stats={stats}
          onFilterClick={handleCardFilterClick}
          activeFilter={activeTab === 'reaction' ? 'released' : (selectedDate ? '' : quickFilter)}
        />

        {/* Tab 1: Results Table (Primary Scanner) */}
        {activeTab === 'table' && (
          <div className="animate-in fade-in duration-150">
            {selectedDate && (
              <div className="mb-3.5 flex items-center justify-between bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs">
                <span className="text-xs text-slate-600 font-medium">
                  Filtering for expected financial results release date: <strong className="text-slate-900 font-mono">{selectedDate}</strong>
                </span>
                <button
                  onClick={() => { setSelectedDate(null); setQuickFilter('today'); }}
                  className="text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                >
                  Reset to Today
                </button>
              </div>
            )}
            <CompanyTable
              events={events}
              total={totalEvents}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              exchangeFilter={exchangeFilter}
              onExchangeFilterChange={(v) => { setExchangeFilter(v); setPage(1); }}
              mcapFilter={mcapFilter}
              onMcapFilterChange={(v) => { setMcapFilter(v); setPage(1); }}
              resultCategoryFilter={resultCategoryFilter}
              onResultCategoryFilterChange={(v) => { setResultCategoryFilter(v); setPage(1); }}
              quickFilter={selectedDate ? `Date: ${selectedDate}` : quickFilter}
              onQuickFilterChange={(v) => { setSelectedDate(null); setQuickFilter(v); setPage(1); }}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortToggle={(col) => {
                if (sortBy === col) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(col);
                  setSortOrder('desc');
                }
              }}
              onSelectCompany={setSelectedCompany}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Tab 2: Dedicated Results vs Market Reaction Section */}
        {activeTab === 'reaction' && (
          <div className="animate-in fade-in duration-150">
            <MarketReactionAnalysis />
          </div>
        )}

        {/* Tab 2b: Post-Market Earnings Reaction Tracker */}
        {activeTab === 'post_market' && (
          <div className="animate-in fade-in duration-150">
            <PostMarketTracker />
          </div>
        )}

        {/* Tab 2c: Strategy vs Actual Market Performance Validation Engine */}
        {activeTab === 'validation' && (
          <div className="animate-in fade-in duration-150">
            <StrategyValidationDashboard />
          </div>
        )}

        {/* Tab 2d: 1-Year Historical Backtest (₹10 Lakh Portfolio) */}
        {activeTab === 'backtest' && (
          <div className="animate-in fade-in duration-150">
            <BacktestDashboard />
          </div>
        )}

        {/* Tab 3: Calendar Timeline */}
        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-150 space-y-4">
            <ResultsCalendar
              selectedDate={selectedDate}
              onSelectDate={handleCalendarDateSelect}
            />
            <CompanyTable
              events={events}
              total={totalEvents}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              exchangeFilter={exchangeFilter}
              onExchangeFilterChange={(v) => { setExchangeFilter(v); setPage(1); }}
              mcapFilter={mcapFilter}
              onMcapFilterChange={(v) => { setMcapFilter(v); setPage(1); }}
              resultCategoryFilter={resultCategoryFilter}
              onResultCategoryFilterChange={(v) => { setResultCategoryFilter(v); setPage(1); }}
              quickFilter={selectedDate ? `Date: ${selectedDate}` : quickFilter}
              onQuickFilterChange={(v) => { setSelectedDate(null); setQuickFilter(v); setPage(1); }}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortToggle={(col) => {
                if (sortBy === col) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(col);
                  setSortOrder('desc');
                }
              }}
              onSelectCompany={setSelectedCompany}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Tab 4: Daily 8 AM Report */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-150">
            <DailyReportView />
          </div>
        )}

        {/* Tab 5: Live Announcements Feed */}
        {activeTab === 'announcements' && (
          <div className="animate-in fade-in duration-150">
            <AnnouncementMonitor />
          </div>
        )}

      </main>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailModal
          event={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        All India Listed Companies Upcoming Financial Results Scanner • Automated Pre-Market Intelligence System
      </footer>
    </div>
  );
}

export default App;
