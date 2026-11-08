import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  FileText, 
  Radio, 
  RefreshCw, 
  CheckCircle2,
  TrendingUp,
  Moon
} from 'lucide-react';

export type NavTab = 'table' | 'reaction' | 'post_market' | 'calendar' | 'report' | 'announcements';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onRefresh: () => void;
  isSyncing: boolean;
  totalUnique: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isSyncing,
  totalUnique
}) => {
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      };
      setIstTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'table', label: 'Results Scanner', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'reaction', label: 'Results vs Market Reaction', icon: <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> },
    { id: 'post_market', label: 'Post-Market Tracker', icon: <Moon className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5 text-slate-500" /> },
    { id: 'report', label: '8 AM Report', icon: <FileText className="w-3.5 h-3.5 text-slate-500" /> },
    { id: 'announcements', label: 'Live Disclosures', icon: <Radio className="w-3.5 h-3.5 text-emerald-600" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <BarChart3 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  RESULTS<span className="text-slate-400 font-medium">SCANNER</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  NSE & BSE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Tracking <strong className="text-slate-900 font-semibold">{totalUnique > 0 ? totalUnique.toLocaleString() : '5,958'}</strong> listed companies</span>
              </p>
            </div>
          </div>

          {/* Clean Spacious Segmented Navigation Tabs */}
          <nav className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar shrink">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: IST Clock & Clean Sync Button */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-mono font-bold text-slate-900">{istTime}</span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Official Feeds Active
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isSyncing 
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-xs active:scale-95'
              }`}
              title="Sync latest live exchange filings from NSE & BSE"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
