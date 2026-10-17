import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  MessageSquare, 
  Trash2, 
  Send, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Bot, 
  Sparkles, 
  Clock, 
  ArrowRight,
  MessageCircle,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BotUser, ChatMessage } from '../types';

interface UsersTabProps {
  users?: BotUser[];
  onRefreshUsers?: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = () => {
  // View mode: 'table' (database view) or 'conversations' (live chat feed)
  const [viewMode, setViewMode] = useState<'table' | 'conversations'>('table');

  // Paginated user list state
  const [usersList, setUsersList] = useState<BotUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked_bot'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Live Chat Modal state
  const [activeChatUser, setActiveChatUser] = useState<BotUser | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  const [replyInput, setReplyInput] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const [replyStatus, setReplyStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated users from server
  const fetchPaginatedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: debouncedSearch,
        status: statusFilter
      });

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsersList(data.users);
          setTotalUsers(data.totalUsers || 0);
          setTotalPages(data.totalPages || 1);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPaginatedUsers();
  }, [fetchPaginatedUsers]);

  // Fetch chat history for selected user
  const fetchUserChatHistory = useCallback(async (userId: number) => {
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/users/${userId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        }
      }
    } catch (e) {
      console.error('Error fetching chat history:', e);
    } finally {
      setLoadingChat(false);
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeChatUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChatUser]);

  // Open Chat modal
  const handleOpenChat = (user: BotUser) => {
    setActiveChatUser(user);
    setReplyInput('');
    setReplyStatus(null);
    fetchUserChatHistory(user.id);
  };

  // Send Direct Message from Chat Modal
  const handleSendReply = async () => {
    if (!activeChatUser || !replyInput.trim() || sendingReply) return;

    const text = replyInput.trim();
    setSendingReply(true);
    setReplyStatus(null);

    try {
      const res = await fetch('/api/users/direct-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeChatUser.id,
          text: text
        })
      });

      const data = await res.json();
      if (data.ok) {
        setReplyStatus({ ok: true, msg: 'মেসেজ পাঠানো হয়েছে!' });
        setReplyInput('');
        // Add immediately to local chat view
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'admin',
            text: text,
            timestamp: new Date().toISOString()
          }
        ]);
        fetchPaginatedUsers();
      } else {
        setReplyStatus({ ok: false, msg: data.error || 'মেসেজ পাঠানো যায়নি' });
      }
    } catch (err: any) {
      setReplyStatus({ ok: false, msg: err.message || 'নেটওয়ার্ক এরর' });
    } finally {
      setSendingReply(false);
    }
  };

  // Copy Telegram ID
  const copyId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete User
  const handleDeleteUser = async (id: number) => {
    if (confirm(`আপনি কি এই ইউজার (ID: ${id}) ডাটাবেজ থেকে মুছে ফেলতে চান?`)) {
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        fetchPaginatedUsers();
      } catch (e) {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>ইউজার ও লাইভ কথোপকথন ড্যাশবোর্ড</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">
                    মোট: {totalUsers.toLocaleString('bn-BD')} জন
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  কোন ইউজার কী মেসেজ দিয়েছে এবং এআই কী উত্তর দিয়েছে তা সরাসরি লাইভ দেখুন ও রিপ্লাই দিন।
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Switcher & Refresh */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ইউজার ডাটাবেজ</span>
              </button>
              <button
                onClick={() => setViewMode('conversations')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'conversations'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>লাইভ কথোপকথন ফিড</span>
              </button>
            </div>

            <button
              onClick={() => fetchPaginatedUsers()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 disabled:opacity-50"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম, @ইউজারনেম, টেলিগ্রাম আইডি বা বার্তা দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              সকল ইউজার
            </button>
            <button
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              সক্রিয়
            </button>
            <button
              onClick={() => { setStatusFilter('blocked_bot'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === 'blocked_bot'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              ব্লকড
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Table Database View */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">ইউজার ও ইউজারনেম</th>
                  <th className="py-3 px-4">টেলিগ্রাম ID</th>
                  <th className="py-3 px-4 min-w-[200px]">সর্বশেষ বার্তা (কথোপকথন)</th>
                  <th className="py-3 px-4 text-center">মেসেজ</th>
                  <th className="py-3 px-4">সর্বশেষ সক্রিয়</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {(user.firstName || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-200 truncate max-w-[150px]">
                            {user.firstName} {user.lastName || ''}
                          </div>
                          <div className="text-[11px] text-cyan-400 font-mono truncate max-w-[150px]">
                            {user.username ? `@${user.username}` : 'ইউজারনেম নেই'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Telegram ID */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">{user.id}</span>
                        <button
                          onClick={() => copyId(user.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          title="ID কপি করুন"
                        >
                          {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Last Message Snippet */}
                    <td className="py-3 px-4">
                      {user.lastMessageSnippet ? (
                        <div 
                          onClick={() => handleOpenChat(user)}
                          className="cursor-pointer group flex items-start gap-1.5 max-w-[280px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-slate-300 group-hover:text-cyan-300 truncate transition-colors">
                            "{user.lastMessageSnippet}"
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-600 italic">কোনো বার্তা রেকর্ড নেই</span>
                      )}
                    </td>

                    {/* Message Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px]">
                        {user.messageCount || 1}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString('bn-BD', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {user.status === 'blocked_bot' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
                          <UserX className="w-3 h-3" /> ব্লকড
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          <UserCheck className="w-3 h-3" /> সক্রিয়
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Live Chat & Messages Button */}
                        <button
                          onClick={() => handleOpenChat(user)}
                          className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="চ্যাট দেখুন ও মেসেজ পাঠান"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                          <span>চ্যাট দেখুন</span>
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {usersList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      কোন ইউজার খুঁজে পাওয়া যায়নি।
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                      লোড হচ্ছে...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Clean Pagination Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>প্রতি পৃষ্ঠায়:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={25}>২৫ জন</option>
                <option value={50}>৫০ জন</option>
                <option value={100}>১০০ জন</option>
              </select>
              <span className="text-slate-500">
                (মোট {totalUsers.toLocaleString('bn-BD')} ইউজারের মধ্যে)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-300">
                পৃষ্ঠা {currentPage} এর {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1 || loading}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 transition-colors"
                  title="প্রথম পৃষ্ঠা"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 transition-colors"
                  title="পূর্ববর্তী পৃষ্ঠা"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || loading}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 transition-colors"
                  title="পরবর্তী পৃষ্ঠা"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 transition-colors"
                  title="শেষ পৃষ্ঠা"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Live Conversation Stream Feed */}
      {viewMode === 'conversations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersList.filter(u => u.lastMessageSnippet).map((user) => (
              <div 
                key={user.id}
                onClick={() => handleOpenChat(user)}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition-all cursor-pointer shadow-sm group hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(user.firstName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {user.firstName} {user.lastName || ''}
                      </h4>
                      <div className="text-[10px] text-cyan-400 font-mono">
                        {user.username ? `@${user.username}` : `ID: ${user.id}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {user.lastActive ? new Date(user.lastActive).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="mt-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-cyan-400" />
                    <span>ইউজারের বার্তা:</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2 italic">
                    "{user.lastMessageSnippet}"
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300">
                    {user.messageCount || 1} টি মেসেজ
                  </span>
                  <span className="text-cyan-400 group-hover:underline flex items-center gap-1 font-semibold">
                    সম্পূর্ণ চ্যাট দেখুন <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {usersList.filter(u => u.lastMessageSnippet).length === 0 && !loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              এখনও কোনো নতুন মেসেজের কথোপকথন রেকর্ড নেই। বট যখন নতুন মেসেজ পাবে, তা সরাসরি এখানে দেখা যাবে।
            </div>
          )}
        </div>
      )}

      {/* TELEGRAM LIVE CHAT MODAL */}
      {activeChatUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl h-[85vh] max-h-[750px] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {(activeChatUser.firstName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {activeChatUser.firstName} {activeChatUser.lastName || ''}
                    </h4>
                    {activeChatUser.status === 'blocked_bot' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ব্লকড
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        সক্রিয়
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="text-cyan-400 font-mono">
                      {activeChatUser.username ? `@${activeChatUser.username}` : 'ইউজারনেম নেই'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-400 text-[11px]">ID: {activeChatUser.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchUserChatHistory(activeChatUser.id)}
                  disabled={loadingChat}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                  title="চ্যাট হিস্টোরি রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingChat ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
                <button
                  onClick={() => setActiveChatUser(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/40">
              {loadingChat && chatMessages.length === 0 && (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                  মেসেজ হিস্টোরি লোড হচ্ছে...
                </div>
              )}

              {!loadingChat && chatMessages.length === 0 && (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <MessageCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  এই ইউজারের সাথে এখনও কোনো বিস্তারিত চ্যাট হিস্টোরি জমা হয়নি। ইউজার মেসেজ দিলে তা এখানে স্বয়ংক্রিয়ভাবে দেখাবে।
                </div>
              )}

              {chatMessages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const isAdmin = msg.sender === 'admin';

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                      {isUser ? (
                        <span className="font-bold text-cyan-400">
                          {activeChatUser.firstName}
                        </span>
                      ) : isAdmin ? (
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          🛡️ আপনি (এডমিন)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5" /> @HalpLine_bot (AI)
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-sm whitespace-pre-wrap ${
                        isUser
                          ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/60'
                          : isAdmin
                          ? 'bg-amber-600/20 text-amber-100 rounded-tr-sm border border-amber-500/30'
                          : 'bg-gradient-to-r from-cyan-900/60 to-indigo-900/60 text-cyan-50 rounded-tr-sm border border-cyan-500/30'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Direct Message Input Bar */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950">
              {replyStatus && (
                <div className={`mb-2 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 ${
                  replyStatus.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {replyStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{replyStatus.msg}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder={`ইউজার @${activeChatUser.username || activeChatUser.id}-কে সরাসরি মেসেজ লিখুন...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'পাঠানো হচ্ছে...' : 'পাঠান'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
