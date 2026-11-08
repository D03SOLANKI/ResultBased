import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  X, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  ArrowDown
} from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  date: string;
  level: string;
  message: string;
}

interface LiveConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveConsoleModal: React.FC<LiveConsoleModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [scanCount, setScanCount] = useState<number>(0);
  const [lastScan, setLastScan] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Poll logs every 2.5 seconds when streaming
  useEffect(() => {
    if (!isOpen) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/performance/surveillance/logs?limit=150');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setScanCount(data.scan_count || 0);
          setLastScan(data.last_scan || '');
        }
      } catch (err) {
        console.error('Failed to fetch surveillance logs', err);
      }
    };

    fetchLogs();
    if (!isStreaming) return;

    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [isOpen, isStreaming]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Trigger manual immediate scan
  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/performance/surveillance/trigger-scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to trigger scan', err);
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <span className="text-emerald-400 font-bold">[SUCCESS]</span>;
      case 'POLL':
        return <span className="text-sky-400 font-semibold">[POLL]</span>;
      case 'HEARTBEAT':
        return <span className="text-slate-400">[HEARTBEAT]</span>;
      case 'SCAN':
        return <span className="text-amber-400 font-semibold">[SCAN]</span>;
      case 'MANUAL':
        return <span className="text-purple-400 font-bold">[MANUAL]</span>;
      case 'ERROR':
        return <span className="text-rose-400 font-bold">[ERROR]</span>;
      default:
        return <span className="text-teal-300 font-semibold">[SYSTEM]</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Terminal Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-slate-100">Live Exchange Surveillance Console</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  24/7 LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time daemon checking NSE & BSE filings every 30 seconds
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Console Action Bar */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Cycle Count: <strong className="text-slate-200">#{scanCount}</strong></span>
            {lastScan && <span>Last Sync: <strong className="text-slate-200">{lastScan.split(' ')[1] || lastScan}</strong></span>}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                isStreaming
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                autoScroll
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <ArrowDown className="w-3 h-3" />
              <span>Scroll {autoScroll ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold border transition-all ${
                isScanning
                  ? 'bg-emerald-950 text-emerald-500 border-emerald-800 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Feeds...' : 'Force Scan Now'}</span>
            </button>

            <button
              onClick={() => setLogs([])}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent transition-colors"
              title="Clear visible log view"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Monospace Terminal Logs Output */}
        <div 
          ref={logContainerRef}
          className="p-4 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 space-y-1.5 flex-1 min-h-[380px] max-h-[500px]"
        >
          {logs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Activity className="w-6 h-6 animate-pulse text-emerald-500" />
              <span>Connecting to live exchange surveillance stream...</span>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2.5 leading-relaxed hover:bg-slate-900/40 px-2 py-0.5 rounded transition-colors">
                <span className="text-slate-500 select-none shrink-0 font-mono text-[11px]">{log.timestamp}</span>
                <span className="select-none shrink-0">{getLevelBadge(log.level)}</span>
                <span className="text-slate-200 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SEBI LODR Reg 33/29 Compliant Surveillance Pipeline</span>
          </div>
          <div>
            <span>Target Universe: <strong>5,958 NSE & BSE Equities</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
