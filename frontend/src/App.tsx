import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { ResultsCalendar } from './components/ResultsCalendar';
import { CompanyTable } from './components/CompanyTable';
import { DailyReportView } from './components/DailyReportView';
import { AnnouncementMonitor } from './components/AnnouncementMonitor';
import { CompanyDetailModal } from './components/CompanyDetailModal';
import { MarketReactionAnalysis } from './components/MarketReactionAnalysis';
import { PostMarketTracker } from './components/PostMarketTracker';
import { OverviewStats, ResultEvent } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('table');
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

  // Handle Sync action
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/calendar/sync', { method: 'POST' });
      fetchStats();
      fetchEvents();
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleSync}
        isSyncing={isSyncing}
        totalUnique={stats?.total_unique_companies || 0}
      />

      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        
        {/* Compliance Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-950">Exclusively Financial Results & Performance Announcements:</span>
            <span className="text-emerald-800">
              Tracking Quarterly (Q1-Q4), Half-Yearly (H1/H2), Annual Audited Results & Monthly Performance Updates. Non-financial corporate announcements are excluded.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 shrink-0 ml-2">
            SEBI Reg 33 & 29
          </span>
        </div>

        {/* Top Summary Stat Cards */}
        {stats && (
          <StatCards
            stats={stats}
            onFilterClick={handleCardFilterClick}
          />
        )}

        {/* Tab 1: Primary Results Scanner Table */}
        {activeTab === 'table' && (
          <div className="space-y-4 animate-in fade-in duration-150">
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

        {/* Tab 3: Post-Market Earnings Reaction Tracker */}
        {activeTab === 'post_market' && (
          <div className="animate-in fade-in duration-150">
            <PostMarketTracker />
          </div>
        )}

        {/* Tab 4: Calendar Timeline */}
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

        {/* Tab 5: Daily 8 AM Report */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-150">
            <DailyReportView />
          </div>
        )}

        {/* Tab 6: Live Announcements Feed */}
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
