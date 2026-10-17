import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Cpu, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Database,
  Radio
} from 'lucide-react';
import { SystemStatus, ActivityLog } from '../types';

interface OverviewTabProps {
  status: SystemStatus | null;
  logs: ActivityLog[];
  onSwitchTab: (tab: string) => void;
  onUpdateReplyMode: (mode: 'ai' | 'static') => void;
  onToggleBot: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  status,
  logs,
  onSwitchTab,
  onUpdateReplyMode,
  onToggleBot
}) => {
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const isRunning = status?.bot?.isRunning ?? false;
  const replyMode = status?.settings?.replyMode || 'ai';
  const tgLink = status?.settings?.telegramGroupLink || 'https://t.me/FlickCove_Top';
  const waLink = status?.settings?.whatsappBackupLink || 'https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V';

  return (
    <div className="space-y-4">
      {/* Top Banner Alert if Bot is stopped */}
      {!isRunning && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-amber-200">বট বর্তমানে বন্ধ (Stopped) আছে</h4>
              <p className="text-[11px] text-amber-300/80">ইউজারদের স্বয়ংক্রিয় উত্তর দিতে ও ব্রডকাস্ট পাঠাতে বট চালু করুন।</p>
            </div>
          </div>
          <button
            onClick={onToggleBot}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shrink-0"
          >
            বট চালু করুন
          </button>
        </div>
      )}

      {/* Primary Metrics Grid: Compact 2x2 on Mobile, 4 Cols on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Total Users */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">মোট বট ইউজার</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {status?.stats?.totalUsers ?? 0}
            </span>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-medium truncate">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Firebase ক্লাউড</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Today */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">আজ সক্রিয় ইউজার</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {status?.stats?.activeToday ?? 0}
            </span>
            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
              আজকে সক্রিয়
            </div>
          </div>
        </div>

        {/* Metric 3: Total Messages */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">মোট মেসেজ</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {status?.stats?.totalMessages ?? 0}
            </span>
            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
              আদান-প্রদান সংখ্যা
            </div>
          </div>
        </div>

        {/* Metric 4: Reply Mode Status */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">রেসপন্স মোড</span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${
              replyMode === 'ai' 
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {replyMode === 'ai' ? <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-sm sm:text-base font-bold text-white block truncate">
              {replyMode === 'ai' ? '🤖 Gemini AI' : '📌 ফিক্সড'}
            </span>
            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
              <span className="truncate">{replyMode === 'ai' ? 'স্মার্ট উত্তর' : 'নির্দিষ্ট মেসেজ'}</span>
              <button 
                onClick={() => onUpdateReplyMode(replyMode === 'ai' ? 'static' : 'ai')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline text-[10px] ml-1 shrink-0"
              >
                সুইচ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Promotional Target & Reply Controller */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Promotion Channels Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  🎬 প্রমোশনাল ভিডিও চ্যানেল ও লিঙ্ক
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ইউজার বটের সাথে কথা বললে সর্বদা এই লিঙ্কগুলোতে রিডাইরেক্ট করা হয়।
                </p>
              </div>
              <button
                onClick={() => onSwitchTab('settings')}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
              >
                এডিট <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Telegram Channel */}
              <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20 shrink-0">
                    TG
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200">মূল ভিডিও চ্যানেল (FlickCove)</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{tgLink}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => copyToClipboard(tgLink, 'tg')}
                    className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    title="কপি করুন"
                  >
                    {copiedLink === 'tg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink === 'tg' ? 'কপি' : 'কপি'}</span>
                  </button>
                  <a
                    href={tgLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>ভিজিট</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* WhatsApp Channel */}
              <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20 shrink-0">
                    WA
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200">ব্যাকআপ চ্যানেল (WhatsApp)</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{waLink}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => copyToClipboard(waLink, 'wa')}
                    className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    title="কপি করুন"
                  >
                    {copiedLink === 'wa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink === 'wa' ? 'কপি' : 'কপি'}</span>
                  </button>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>ভিজিট</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Active Custom Commands Card */}
          <div className="bg-gradient-to-r from-slate-900/90 to-cyan-950/30 border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  ⚡ সক্রিয় নির্দিষ্ট ৪টি কমান্ড ও বোতাম
                </h3>
              </div>
              <button
                onClick={() => onSwitchTab('simulator')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>টেস্ট করুন</span>
                <MessageSquare className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              বটের মধ্যে নিচের যেকোনো কমান্ড দিলেই সাথে সাথে নির্দিষ্ট উত্তর পাঠানো হবে এবং অবশ্যই মেসেজের নিচে বোতাম থাকবে:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div 
                onClick={() => onSwitchTab('simulator')}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all"
              >
                <span className="font-mono text-xs font-bold text-cyan-400">/start</span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">স্বাগতম ও লিংক</p>
              </div>
              <div 
                onClick={() => onSwitchTab('simulator')}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all"
              >
                <span className="font-mono text-xs font-bold text-amber-400">/ভিডিও দেখার উপায়</span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">সার্চ ইঞ্জিন গাইড</p>
              </div>
              <div 
                onClick={() => onSwitchTab('simulator')}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all"
              >
                <span className="font-mono text-xs font-bold text-purple-400">/new video</span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">নতুন ভিডিও আপডেট</p>
              </div>
              <div 
                onClick={() => onSwitchTab('simulator')}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all"
              >
                <span className="font-mono text-xs font-bold text-emerald-400">/Bickup channel</span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">ব্যাকআপ চ্যানেল জয়েন</p>
              </div>
            </div>
          </div>

          {/* Quick Mode Switcher & Explanation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4">
            <h3 className="text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
              ⚙️ ইউজার মেসেজ রেসপন্স কন্ট্রোল
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              ইউজার মেসেজ দিলে বট কিভাবে উত্তর দিবে তা এখান থেকে পরিবর্তন করুন:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Gemini AI */}
              <div 
                onClick={() => onUpdateReplyMode('ai')}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  replyMode === 'ai'
                    ? 'bg-purple-950/30 border-purple-500/70 ring-1 ring-purple-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Gemini AI Chatbot</span>
                  </div>
                  {replyMode === 'ai' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                      সক্রিয়
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  বুদ্ধিমানের মতো প্রাসঙ্গিক উত্তর দিবে এবং চ্যানেলে জয়েন করার লিংক পাঠাবে।
                </p>
              </div>

              {/* Option 2: Static Auto Reply */}
              <div 
                onClick={() => onUpdateReplyMode('static')}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  replyMode === 'static'
                    ? 'bg-cyan-950/30 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ফিক্সড রিপ্লাই</span>
                  </div>
                  {replyMode === 'static' && (
                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      সক্রিয়
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  যেকোনো মেসেজে আপনার সেট করা নির্দিষ্ট মেসেজ ও বাটনের রিপ্লাই পাঠাবে।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Bot Info & Status */}
        <div className="space-y-4">
          {/* Bot Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>বট স্ট্যাটাস</span>
              <span className={`flex items-center gap-1 text-xs font-semibold ${
                isRunning ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                {isRunning ? 'অনলাইন (Polling)' : 'বন্ধ (Offline)'}
              </span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">ইউজারনেম:</span>
                <span className="text-cyan-400 font-mono font-semibold">
                  @{status?.bot?.botInfo?.username || status?.settings?.botUsername || 'HalpLine_bot'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Telegram API:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> সংযুক্ত
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Firebase DB:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                  <Database className="w-3 h-3" /> সিঙ্কড
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">ব্রডকাস্ট ডিলে:</span>
                <span className="text-amber-400 font-semibold text-[11px]">
                  ৫-১০ সে./ইউজার
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <button
                onClick={() => onSwitchTab('simulator')}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>বট টেস্ট সিমুলেটর</span>
              </button>
            </div>
          </div>

          {/* Safe Broadcast Notice */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 relative overflow-hidden">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>নিরাপদ ব্রডকাস্ট ইঞ্জিন</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
              টেলিগ্রাম রুলস মেনে ৫-১০ সেকেন্ড বিরতি দিয়ে একজন একজন ইউজারের কাছে মেসেজ পৌঁছায়।
            </p>
            <button
              onClick={() => onSwitchTab('broadcast')}
              className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>ব্রডকাস্ট তৈরি করুন</span>
            </button>
          </div>

          {/* Quick Logs Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">সাম্প্রতিক লগ</h4>
              <button
                onClick={() => onSwitchTab('logs')}
                className="text-xs text-cyan-400 hover:underline"
              >
                সব
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {logs.slice(0, 3).map((log) => (
                <div key={log.id} className="p-1.5 rounded-md bg-slate-950/60 border border-slate-800/80 flex items-start gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                    log.type === 'error' ? 'bg-rose-500' :
                    log.type === 'incoming_msg' ? 'bg-cyan-400' :
                    log.type === 'broadcast' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-300 text-[11px] truncate">{log.message}</p>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-2">কোন সাম্প্রতিক লগ নেই</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
