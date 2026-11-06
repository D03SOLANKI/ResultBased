import React, { useState, useEffect } from 'react';
import { Radio, ExternalLink } from 'lucide-react';
import { AnnouncementItem } from '../types';

export const AnnouncementMonitor: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [filterType, setFilterType] = useState<string>('financial_results');
  const [exchange, setExchange] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.append('filter_type', filterType);
    if (exchange) params.append('exchange', exchange);

    fetch(`/api/announcements?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setAnnouncements(data.announcements || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load announcements', err);
        setIsLoading(false);
      });
  }, [filterType, exchange]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 max-w-5xl mx-auto transition-all">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Financial Results Disclosures Feed</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Streamed financial results disclosures and earnings releases from NSE NEAPS and BSE
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
          >
            <option value="financial_results">Financial Results Declarations</option>
            <option value="all">All Financial Results Filings</option>
          </select>

          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
          >
            <option value="">Both Exchanges</option>
            <option value="NSE">NSE Only</option>
            <option value="BSE">BSE Only</option>
          </select>
        </div>
      </div>

      {/* Stream List */}
      <div className="mt-4 space-y-2.5">
        {isLoading ? (
          <div className="h-44 flex items-center justify-center text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="font-medium text-xs">Polling financial results disclosures...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No matching financial results announcements in the current window.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.announcement_id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      ann.exchange === 'NSE' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {ann.exchange}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {ann.company_name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({ann.symbol_or_code})
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5 leading-snug">
                    {ann.headline}
                  </h4>
                  {ann.description && ann.description !== ann.headline && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {ann.description}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {ann.published_at.slice(11, 16)} IST
                  </span>
                  {ann.attachment_url && (
                    <a
                      href={ann.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 mt-1.5 underline"
                    >
                      <span>Filing PDF</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
