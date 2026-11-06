import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Flame, Clock } from 'lucide-react';
import { CalendarDateSummary } from '../types';

interface ResultsCalendarProps {
  onSelectDate: (dateStr: string) => void;
  selectedDate: string | null;
}

export const ResultsCalendar: React.FC<ResultsCalendarProps> = ({
  onSelectDate,
  selectedDate
}) => {
  const [dates, setDates] = useState<CalendarDateSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/calendar/dates')
      .then(res => res.json())
      .then(data => {
        setDates(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load calendar dates', err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mb-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-700" />
            <span>Earnings Season Results Timeline</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any trading date to inspect scheduled financial results releases
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Large Cap</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Mid Cap</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Small Cap</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> SME</span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-36 flex items-center justify-center text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="font-medium text-xs">Loading dates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {dates.map((item) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const isToday = item.board_meeting_date === todayStr;
            const isTomorrow = item.board_meeting_date === tomorrowStr;
            const isSelected = selectedDate === item.board_meeting_date;

            return (
              <div
                key={item.board_meeting_date}
                onClick={() => onSelectDate(item.board_meeting_date)}
                className={`cursor-pointer p-3 rounded-xl border transition-all text-left relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : isToday
                    ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                    : isTomorrow
                    ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isToday
                      ? 'bg-amber-100 text-amber-800'
                      : isTomorrow
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-slate-500 bg-slate-100'
                  }`}>
                    {item.board_meeting_date.slice(5)}
                  </span>
                  {isToday && (
                    <span className="text-[10px] text-amber-700 font-extrabold flex items-center gap-0.5">
                      <Flame className="w-3 h-3" /> TODAY
                    </span>
                  )}
                  {isTomorrow && (
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> TOM
                    </span>
                  )}
                </div>

                {/* Total Count */}
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className={`text-xl font-extrabold tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {item.total_events}
                  </span>
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    scheduled
                  </span>
                </div>

                {/* Past Date Reconciled Status Breakdown */}
                {item.board_meeting_date < todayStr && (
                  <div className="mt-1 space-y-0.5 text-[10px] font-bold">
                    <div className={`flex items-center justify-between ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      <span>✓ Released:</span>
                      <span className="font-mono">{item.results_released || 0}</span>
                    </div>
                    {(item.results_pending || 0) > 0 && (
                      <div className={`flex items-center justify-between ${isSelected ? 'text-amber-300' : 'text-amber-700'}`}>
                        <span>⏳ Pending:</span>
                        <span className="font-mono">{item.results_pending}</span>
                      </div>
                    )}
                    {(item.results_postponed || 0) > 0 && (
                      <div className={`flex items-center justify-between ${isSelected ? 'text-purple-300' : 'text-purple-700'}`}>
                        <span>🔄 Postponed:</span>
                        <span className="font-mono">{item.results_postponed}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Today Reconciled Breakdown */}
                {isToday && (item.results_postponed || 0) > 0 && (
                  <div className="mt-1 space-y-0.5 text-[10px] font-bold">
                    <div className={`flex items-center justify-between ${isSelected ? 'text-purple-300' : 'text-purple-700'}`}>
                      <span>🔄 Rescheduled:</span>
                      <span className="font-mono">{item.results_postponed}</span>
                    </div>
                  </div>
                )}

                {/* Tier Micro-Dots */}
                <div className="flex items-center gap-1 mt-2">
                  {item.large_cap > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={`Large Cap: ${item.large_cap}`} />}
                  {item.mid_cap > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`Mid Cap: ${item.mid_cap}`} />}
                  {item.small_cap > 0 && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" title={`Small Cap: ${item.small_cap}`} />}
                  {item.sme > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title={`SME: ${item.sme}`} />}
                  {item.micro_cap > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`Micro Cap: ${item.micro_cap}`} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
