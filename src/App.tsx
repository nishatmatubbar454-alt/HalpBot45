import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { BroadcastTab } from './components/BroadcastTab';
import { UsersTab } from './components/UsersTab';
import { SettingsTab } from './components/SettingsTab';
import { SimulatorTab } from './components/SimulatorTab';
import { LogsTab } from './components/LogsTab';
import { SystemStatus, BotUser, ActivityLog } from './types';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [users, setUsers] = useState<BotUser[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStatus(data);
        }
      }
    } catch (e) {
      // Ignore network hiccups
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      }
    } catch (e) {}
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (e) {}
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchStatus(), fetchUsers(), fetchLogs()]);
      setInitialLoaded(true);
    };
    loadAll();

    // Auto refresh status every 3 seconds for live broadcast progress & bot polling state
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchUsers, fetchLogs]);

  // Toggle Bot Polling (Start / Stop)
  const handleToggleBot = async () => {
    if (!status) return;
    setIsToggling(true);
    const isRunning = status.bot?.isRunning;

    try {
      const endpoint = isRunning ? '/api/bot/stop' : '/api/bot/start';
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      await fetchStatus();
      await fetchLogs();
    } catch (e) {
      console.error('Error toggling bot:', e);
    } finally {
      setIsToggling(false);
    }
  };

  // Quick switch reply mode (AI vs Static)
  const handleUpdateReplyMode = async (mode: 'ai' | 'static') => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyMode: mode })
      });
      await fetchStatus();
      await fetchLogs();
    } catch (e) {}
  };

  const botUsername = status?.bot?.botInfo?.username || status?.settings?.botUsername || 'HalpLine_bot';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Sticky Header with Navigation & Bot Controls */}
      <Header
        status={status}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleBot={handleToggleBot}
        isToggling={isToggling}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            status={status}
            logs={logs}
            onSwitchTab={setActiveTab}
            onUpdateReplyMode={handleUpdateReplyMode}
            onToggleBot={handleToggleBot}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastTab
            status={status}
            onRefreshStatus={fetchStatus}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onRefreshUsers={fetchUsers}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            status={status}
            onRefreshStatus={fetchStatus}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorTab
            status={status}
          />
        )}

        {activeTab === 'logs' && (
          <LogsTab
            logs={logs}
            onRefresh={fetchLogs}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">@HalpLine_bot AI Engine</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Telegram Anti-Flood Protected
            </span>
            <span>•</span>
            <span className="text-slate-500">Firebase Firestore Enabled</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://t.me/FlickCove_Top"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>FlickCove চ্যানেল</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <span>WhatsApp ব্যাকআপ</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 font-mono transition-colors"
            >
              @{botUsername}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
