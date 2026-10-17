import React, { useState, useEffect, useCallback } from 'react';
import { 
  Inbox, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  User, 
  Search, 
  MessageSquare,
  Zap,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';
import { MessageRequest, SystemStatus } from '../types';

interface MessageRequestsTabProps {
  status: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const MessageRequestsTab: React.FC<MessageRequestsTabProps> = ({
  status,
  onRefreshStatus
}) => {
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
  
  // Direct reply state
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState<boolean>(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  // Settings state for message request mode
  const [requestMode, setRequestMode] = useState<string>(
    status?.settings?.messageRequestMode || 'instant_reply'
  );
  const [offlineNotice, setOfflineNotice] = useState<string>(
    status?.settings?.offlineNoticeMessage || "📩 আপনার বার্তাটি 'মেসেজ রিকোয়েস্ট' হিসেবে জমা হয়েছে। বট অনলাইনে আসামাত্রই আপনার বার্তার সঠিক উত্তর দেওয়া হবে। ধন্যবাদ!"
  );
  const [autoReplyPending, setAutoReplyPending] = useState<boolean>(
    status?.settings?.onlineAutoReplyPending ?? true
  );
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState<boolean>(false);

  // Fetch all requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/message-requests');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.requests)) {
          setRequests(data.requests);
        }
      }
    } catch (e) {
      console.error('Error fetching message requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Sync settings when status changes
  useEffect(() => {
    if (status?.settings) {
      if (status.settings.messageRequestMode) {
        setRequestMode(status.settings.messageRequestMode);
      }
      if (status.settings.offlineNoticeMessage) {
        setOfflineNotice(status.settings.offlineNoticeMessage);
      }
      if (status.settings.onlineAutoReplyPending !== undefined) {
        setAutoReplyPending(status.settings.onlineAutoReplyPending);
      }
    }
  }, [status]);

  // Handle single reply
  const handleSendReply = async (requestId: string) => {
    const text = (replyInputs[requestId] || '').trim();
    if (!text) return;

    setSendingReplyId(requestId);
    try {
      const res = await fetch(`/api/message-requests/${requestId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: text })
      });
      const data = await res.json();
      if (data.success) {
        setReplyInputs(prev => ({ ...prev, [requestId]: '' }));
        await fetchRequests();
        onRefreshStatus();
      } else {
        alert(`রিপ্লাই পাঠাতে ব্যর্থ: ${data.error || 'অজানা সমস্যা'}`);
      }
    } catch (err: any) {
      alert(`ত্রুটি: ${err.message}`);
    } finally {
      setSendingReplyId(null);
    }
  };

  // Process all pending requests using AI / Auto
  const handleProcessAllPending = async () => {
    setProcessingAll(true);
    setProcessResult(null);
    try {
      const res = await fetch('/api/message-requests/process-pending', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setProcessResult(`✅ সফলভাবে ${data.processed}টি পেন্ডিং রিকোয়েস্টের উত্তর পাঠানো হয়েছে!`);
        await fetchRequests();
        onRefreshStatus();
      } else {
        setProcessResult(`❌ ব্যর্থ: ${data.error || 'সমস্যা দেখা দিয়েছে'}`);
      }
    } catch (err: any) {
      setProcessResult(`❌ ত্রুটি: ${err.message}`);
    } finally {
      setProcessingAll(false);
      setTimeout(() => setProcessResult(null), 6000);
    }
  };

  // Delete single request
  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('এই মেসেজ রিকোয়েস্টটি মুছে ফেলতে চান?')) return;
    try {
      await fetch(`/api/message-requests/${id}`, { method: 'DELETE' });
      await fetchRequests();
      onRefreshStatus();
    } catch (e) {}
  };

  // Clear all requests
  const handleClearAll = async () => {
    if (!window.confirm('সবগুলো মেসেজ রিকোয়েস্ট মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
    try {
      await fetch('/api/message-requests', { method: 'DELETE' });
      await fetchRequests();
      onRefreshStatus();
    } catch (e) {}
  };

  // Save mode settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSavedSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageRequestMode: requestMode,
          offlineNoticeMessage: offlineNotice,
          onlineAutoReplyPending: autoReplyPending
        })
      });
      if (res.ok) {
        setSettingsSavedSuccess(true);
        onRefreshStatus();
        setTimeout(() => setSettingsSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Quick reply presets
  const applyPreset = (requestId: string, presetText: string) => {
    setReplyInputs(prev => ({ ...prev, [requestId]: presetText }));
  };

  // Calculations
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const repliedCount = requests.filter(r => r.status === 'replied' || r.status === 'auto_replied').length;
  const isBotRunning = status?.bot?.isRunning ?? false;

  // Filter & Search
  const filteredRequests = requests.filter(req => {
    if (filter === 'pending' && req.status !== 'pending') return false;
    if (filter === 'replied' && (req.status !== 'replied' && req.status !== 'auto_replied')) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (req.firstName && req.firstName.toLowerCase().includes(query)) ||
      (req.username && req.username.toLowerCase().includes(query)) ||
      (req.messageText && req.messageText.toLowerCase().includes(query)) ||
      req.userId.toString().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Inbox className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">মেসেজ রিকোয়েস্ট ও অফলাইন কিউ (Message Requests)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                ২৪/৭ মিসিং মেসেজ প্রটেকশন
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              বট অফলাইনে বা স্লিপে থাকা অবস্থায় যেসব ইউজার মেসেজ দেয়, তাদের একটি মেসেজও হারিয়ে যাবে না। 
              সব মেসেজ এখানে <strong>&apos;মেসেজ রিকোয়েস্ট&apos;</strong> হিসেবে সুরক্ষিত থাকে এবং বট অনলাইনে আসামাত্রই স্বয়ংক্রিয়ভাবে বা এডমিনের মাধ্যমে সবার উত্তর পাঠানো যায়।
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleProcessAllPending}
              disabled={processingAll || pendingCount === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all ${
                pendingCount > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Zap className={`w-4 h-4 ${processingAll ? 'animate-spin' : ''}`} />
              <span>
                {processingAll ? 'সবাইকে উত্তর পাঠানো হচ্ছে...' : `অনলাইন হলে সবাইকে রিপ্লাই (${pendingCount})`}
              </span>
            </button>

            <button
              onClick={fetchRequests}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {processResult && (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm font-medium">
            {processResult}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
            <span>পেন্ডিং রিকোয়েস্ট</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            {pendingCount}
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">উত্তরের অপেক্ষায় রয়েছে</p>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
            <span>উত্তর পাঠানো হয়েছে</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {repliedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">অটো বা এডমিন রিপ্লাইড</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
            <span>সর্বমোট রিকোয়েস্ট</span>
            <Inbox className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {requests.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">সংরক্ষিত মেসেজ হিস্ট্রি</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
            <span>বট অনলাইন স্ট্যাটাস</span>
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mt-1">
            <span className={`w-3 h-3 rounded-full ${isBotRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span>{isBotRunning ? 'বট অনলাইন' : 'বট অফলাইন'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isBotRunning ? 'সরাসরি রেসপন্স চলছে' : 'মেসেজ কিউ-তে জমা হচ্ছে'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            সবগুলো ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>পেন্ডিং ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilter('replied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'replied'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>উত্তর সম্পন্ন ({repliedCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ইউজার বা মেসেজ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {requests.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
              title="সব মুছে ফেলুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ক্লিয়ার</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Requests List */}
      <div className="space-y-3.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 mb-3.5">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">কোনো মেসেজ রিকোয়েস্ট পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              ইউজাররা টেলিগ্রাম বটে কোনো প্রশ্ন বা মেসেজ পাঠালে তা স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const currentReplyText = replyInputs[req.id] || '';

            return (
              <div 
                key={req.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-sm ${
                  isPending
                    ? 'bg-slate-900/90 border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Header: User Info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {req.firstName ? req.firstName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {req.firstName || 'ইউজার'} {req.lastName || ''}
                        </span>
                        {req.username && (
                          <a
                            href={`https://t.me/${req.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-cyan-400 hover:underline"
                          >
                            @{req.username}
                          </a>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          ID: {req.userId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>আগমনের সময়: {new Date(req.receivedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}, {new Date(req.receivedAt).toLocaleDateString('bn-BD')}</span>
                        {req.isOfflineMessage && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-rose-500/30">
                            বট অফলাইনে পাঠানো হয়েছিল
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {isPending ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        পেন্ডিং রিকোয়েস্ট
                      </span>
                    ) : req.status === 'auto_replied' ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        অনলাইনে অটো-রিপ্লাইড
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        এডমিন রিপ্লাইড
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* User's Message */}
                <div className="py-3">
                  <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>ইউজারের বার্তা / প্রশ্ন:</span>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-sm text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                    {req.messageText || '(কোনো টেক্সট বার্তা ছিল না)'}
                  </div>
                </div>

                {/* Replied Section if answered */}
                {req.replyText && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        পাঠানো উত্তর ({req.repliedBy === 'auto_online' ? 'বট অনলাইন অটো-রেসপন্স' : req.repliedBy === 'admin' ? 'এডমিন' : 'AI বট'}):
                      </span>
                      {req.repliedAt && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          {new Date(req.repliedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap">
                      {req.replyText}
                    </div>
                  </div>
                )}

                {/* Direct Reply Box (Shown when pending or admin wants to reply again) */}
                <div className="mt-3 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1.5">
                    <span>সরাসরি উত্তর পাঠান:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-500">প্রিসেট:</span>
                      <button
                        onClick={() => applyPreset(req.id, "ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আপনার কাঙ্ক্ষিত ভিডিও পেয়ে যাবেন।")}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                      >
                        সার্চ ইঞ্জিন লিংক
                      </button>
                      <button
                        onClick={() => applyPreset(req.id, "সব ভিডিও দেখতে নিচের বাটনে ক্লিক করে FlickCove চ্যানেলে যুক্ত হোন।")}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                      >
                        চ্যানেল জয়েন
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`@${req.username || req.firstName || 'ইউজার'}-কে সরাসরি রিপ্লাই লিখুন...`}
                      value={currentReplyText}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(req.id);
                        }
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      onClick={() => handleSendReply(req.id)}
                      disabled={sendingReplyId === req.id || !currentReplyText.trim()}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        currentReplyText.trim()
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingReplyId === req.id ? 'যাচ্ছে...' : 'পাঠান'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Request Settings Configuration Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">মেসেজ রিকোয়েস্ট সেটিংস ও অটোমেশন (Mode Settings)</h3>
        </div>

          <div 
            onClick={() => setRequestMode('instant_reply')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              requestMode === 'instant_reply'
                ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-cyan-300">১. স্বাভাবিক স্বয়ংক্রিয় রিপ্লাই (সুপারিশকৃত)</span>
              <input 
                type="radio" 
                checked={requestMode === 'instant_reply'} 
                onChange={() => setRequestMode('instant_reply')}
                className="accent-cyan-500" 
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              বট অফলাইনে বা স্লিপে থাকা অবস্থায় ইউজার মেসেজ দিলে, বট অনলাইনে আসা মাত্রই আগের মতো সাধারণভাবে স্বয়ংক্রিয় উত্তর পাঠিয়ে দিবে।
            </p>
          </div>

          <div 
            onClick={() => setRequestMode('always_queue')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              requestMode === 'always_queue'
                ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-indigo-300">২. সর্বদা মেসেজ রিকোয়েস্ট মোড</span>
              <input 
                type="radio" 
                checked={requestMode === 'always_queue'} 
                onChange={() => setRequestMode('always_queue')}
                className="accent-indigo-500" 
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              বট নিজে কোনো উত্তর দিবে না; সব বার্তা পেন্ডিং রিকোয়েস্ট হিসেবে জমা থাকবে এবং এডমিন নিজে দেখে ম্যানুয়ালি উত্তর দিবেন।
            </p>
          </div>

          <div 
            onClick={() => setRequestMode('auto_queue_when_offline')}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              requestMode === 'auto_queue_when_offline'
                ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-purple-300">৩. অফলাইন নোটিশ মোড</span>
              <input 
                type="radio" 
                checked={requestMode === 'auto_queue_when_offline'} 
                onChange={() => setRequestMode('auto_queue_when_offline')}
                className="accent-purple-500" 
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              বট অফলাইনে থাকার সময়ে বার্তা আসলে সাথে সাথে নোটিশ পাঠাবে এবং অনলাইন হলে পরবর্তীতে উত্তর দিবে।
            </p>
          </div>

        {/* Offline notice message */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            অফলাইন / রিকোয়েস্ট রিসিপ্ট মেসেজ (ইউজার তাৎক্ষণিক যা দেখতে পাবে):
          </label>
          <textarea
            value={offlineNotice}
            onChange={(e) => setOfflineNotice(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Auto reply checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoReplyPendingCheck"
            checked={autoReplyPending}
            onChange={(e) => setAutoReplyPending(e.target.checked)}
            className="w-4 h-4 rounded accent-cyan-500"
          />
          <label htmlFor="autoReplyPendingCheck" className="text-xs text-slate-300 cursor-pointer">
            <strong>অনলাইন হলে স্বয়ংক্রিয় রিপ্লাই:</strong> বট চালু বা অনলাইন হওয়া মাত্রই সব পেন্ডিং মেসেজ রিকোয়েস্টের উত্তর স্বয়ংক্রিয়ভাবে পাঠিয়ে দেওয়া হবে।
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          {settingsSavedSuccess ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> সেটিংস সফলভাবে সংরক্ষিত হয়েছে!
            </span>
          ) : <span />}

          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all"
          >
            {isSavingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
