import React from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  Send, 
  Users, 
  Settings, 
  MessageSquare, 
  ScrollText, 
  Radio, 
  ExternalLink,
  Sparkles,
  Database,
  Download
} from 'lucide-react';

import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleBot: () => void;
  isToggling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeTab,
  setActiveTab,
  onToggleBot,
  isToggling
}) => {
  const isRunning = status?.bot?.isRunning ?? false;
  const botUsername = status?.bot?.botInfo?.username || status?.settings?.botUsername || 'HalpLine_bot';

  const navItems = [
    { id: 'overview', label: 'ওভারভিউ', icon: Radio },
    { id: 'broadcast', label: 'ব্রডকাস্ট ইঞ্জিন', icon: Send },
    { id: 'users', label: 'ইউজার ডাটাবেজ', icon: Users },
    { id: 'settings', label: 'বট সেটিংস', icon: Settings },
    { id: 'simulator', label: 'বট টেস্ট চ্যাট', icon: MessageSquare },
    { id: 'logs', label: 'লাইভ লগস', icon: ScrollText },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top bar: Brand + Quick Actions in one compact row */}
        <div className="flex items-center justify-between py-2 sm:py-2.5 gap-2 border-b border-slate-800/60">
          {/* Brand & Bot identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm ring-1 ring-cyan-400/30">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  HalpLine Bot
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 font-mono font-semibold shrink-0">
                  v2.5
                </span>
                <span className={`text-[10px] font-medium hidden sm:inline-flex items-center gap-1 ${
                  isRunning ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  {isRunning ? 'অনলাইন' : 'অফলাইন'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                <a 
                  href={`https://t.me/${botUsername}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-mono transition-colors flex items-center gap-0.5"
                >
                  @{botUsername}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                  <Database className="w-2.5 h-2.5 text-amber-400" />
                  Firebase
                </span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  Gemini
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Bot Toggle */}
            <button
              onClick={onToggleBot}
              disabled={isToggling}
              className={`h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 ${
                isRunning
                  ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isRunning ? 'বট থামান' : 'বট চালু করুন'}
            >
              {isRunning ? (
                <>
                  <Square className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>বট বন্ধ</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  <span>বট চালু</span>
                </>
              )}
            </button>

            {/* Telegram Open Link */}
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 transition-colors flex items-center gap-1"
              title="টেলিগ্রাম বটে যান"
            >
              <span className="hidden sm:inline">বট</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Code Download */}
            <a
              href="/api/download-zip"
              download="halpline-bot-source.zip"
              className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition-colors flex items-center gap-1"
              title="কোড জিপ ডাউনলোড"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">ZIP</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'broadcast' && status?.broadcast?.status === 'running' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
