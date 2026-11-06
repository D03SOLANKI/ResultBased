import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  FileText, 
  Radio, 
  RefreshCw, 
  CheckCircle2,
  TrendingUp,
  Moon,
  ShieldCheck,
  Wallet
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'table' | 'reaction' | 'post_market' | 'validation' | 'backtest' | 'calendar' | 'report' | 'announcements';
  setActiveTab: (tab: 'table' | 'reaction' | 'post_market' | 'validation' | 'backtest' | 'calendar' | 'report' | 'announcements') => void;
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Headline */}
          <div className="flex items-center space-x-3">
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
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Tracking <strong className="text-slate-900 font-semibold">{totalUnique > 0 ? totalUnique.toLocaleString() : '5,958'}</strong> listed companies for upcoming results</span>
              </p>
            </div>
          </div>

          {/* Minimalist Segmented Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Results Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('reaction')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reaction'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Results vs Market Reaction</span>
            </button>

            <button
              onClick={() => setActiveTab('post_market')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'post_market'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Post-Market Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('validation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'validation'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 hover:text-emerald-950 font-bold border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strategy Validation</span>
            </button>

            <button
              onClick={() => setActiveTab('backtest')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'backtest'
                  ? 'bg-purple-700 text-white shadow-xs font-bold'
                  : 'text-purple-800 bg-purple-50/80 hover:bg-purple-100 hover:text-purple-950 font-bold border border-purple-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-purple-600" />
              <span>1-Yr Backtest (₹10L)</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'report'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>8 AM Report</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'announcements'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Disclosures</span>
            </button>
          </nav>

          {/* Right Controls: IST Clock & Clean Sync Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-mono font-bold text-slate-900">{istTime}</span>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Official Feeds Active
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 shadow-xs transition"
              title="Refresh / Sync live exchange data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
