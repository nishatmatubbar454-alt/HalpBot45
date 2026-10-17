import React, { useState } from 'react';
import { 
  ScrollText, 
  RefreshCw, 
  MessageSquare, 
  Send, 
  Sparkles, 
  AlertCircle, 
  Cpu, 
  Clock,
  Filter
} from 'lucide-react';
import { ActivityLog } from '../types';

interface LogsTabProps {
  logs: ActivityLog[];
  onRefresh: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, onRefresh }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filterType === 'all' || log.type === filterType;
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.userId && log.userId.toString().includes(searchTerm));
    return matchesFilter && matchesSearch;
  });

  const getLogBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'incoming_msg':
        return {
          label: 'ইউজার মেসেজ',
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          icon: MessageSquare
        };
      case 'outgoing_msg':
        return {
          label: 'বট উত্তর',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: Send
        };
      case 'ai_generation':
        return {
          label: 'Gemini AI',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: Sparkles
        };
      case 'broadcast':
        return {
          label: 'ব্রডকাস্ট',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Send
        };
      case 'error':
        return {
          label: 'ত্রুটি (Error)',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: AlertCircle
        };
      default:
        return {
          label: 'সিস্টেম',
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: Cpu
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-cyan-400" />
              <span>লাইভ অ্যাক্টিভিটি ও ইভেন্ট লগস</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              বটের সাথে ঘটে যাওয়া প্রতিটি মেসেজ আদান-প্রদান, এআই উত্তর ও ব্রডকাস্টের রিয়েল-টাইম রেকর্ড।
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>লগ রিফ্রেশ</span>
          </button>
        </div>

        {/* Filters */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="লগ সার্চ করুন (মেসেজ, আইডি, ইউজার)..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['all', 'incoming_msg', 'outgoing_msg', 'ai_generation', 'broadcast', 'error'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  filterType === t
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {t === 'all' && 'সকল লগ'}
                {t === 'incoming_msg' && 'ইউজার মেসেজ'}
                {t === 'outgoing_msg' && 'বট উত্তর'}
                {t === 'ai_generation' && 'Gemini AI'}
                {t === 'broadcast' && 'ব্রডকাস্ট'}
                {t === 'error' && 'ত্রুটি'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto font-mono text-xs">
          {filteredLogs.map((log) => {
            const badge = getLogBadge(log.type);
            const Icon = badge.icon;
            return (
              <div key={log.id} className="p-3.5 hover:bg-slate-800/25 transition-colors flex items-start gap-3">
                <span className="text-slate-500 text-[11px] shrink-0 pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>

                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}>
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                <div className="flex-1 min-w-0 font-sans">
                  {log.userName && (
                    <span className="text-cyan-300 font-semibold text-xs mr-2 font-mono">
                      [{log.userName}]
                    </span>
                  )}
                  <span className="text-slate-200 text-xs break-words">
                    {log.message}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs font-sans">
              কোন লগ এন্ট্রি পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
