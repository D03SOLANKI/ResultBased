import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, FileText } from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const [reportText, setReportText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/report/daily')
      .then(res => res.json())
      .then(data => {
        setReportText(data.text_report);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load daily report', err);
        setIsLoading(false);
      });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UPCOMING_FINANCIAL_RESULTS_REPORT_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 max-w-4xl mx-auto transition-all">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daily 8:00 AM IST Intelligence Report</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-formatted for WhatsApp channels, Telegram broadcasts, or Email
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copy for WhatsApp / Telegram</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
            title="Download Plain Text Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      {/* Report Preview Box */}
      <div className="mt-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="font-medium text-xs">Generating 8:00 AM report...</span>
          </div>
        ) : (
          <div className="relative">
            <pre className="w-full bg-slate-50 p-5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[600px] select-all">
              {reportText}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
};
