import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  MessageSquare, 
  Trash2, 
  Send, 
  ExternalLink,
  ShieldAlert,
  Clock,
  UserCheck,
  UserX,
  X,
  Plus
} from 'lucide-react';
import { BotUser } from '../types';

interface UsersTabProps {
  users: BotUser[];
  onRefreshUsers: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onRefreshUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked_bot'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modals state
  const [selectedUserForChat, setSelectedUserForChat] = useState<BotUser | null>(null);
  const [directMsgUser, setDirectMsgUser] = useState<BotUser | null>(null);
  const [directMsgText, setDirectMsgText] = useState('');
  const [directMsgSending, setDirectMsgSending] = useState(false);
  const [directMsgResult, setDirectMsgResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const copyId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSeedDemoUsers = async () => {
    setSeeding(true);
    try {
      await fetch('/api/users/seed-demo', { method: 'POST' });
      onRefreshUsers();
    } catch (e) {}
    setSeeding(false);
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm(`আপনি কি এই ইউজার (ID: ${id}) ডাটাবেজ থেকে মুছে ফেলতে চান?`)) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      onRefreshUsers();
    }
  };

  const handleSendDirectMessage = async () => {
    if (!directMsgUser || !directMsgText.trim()) return;

    setDirectMsgSending(true);
    setDirectMsgResult(null);

    try {
      const res = await fetch('/api/users/direct-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: directMsgUser.id,
          text: directMsgText.trim()
        })
      });

      const data = await res.json();
      if (data.ok) {
        setDirectMsgResult({ ok: true, msg: 'মেসেজ ইউজারের কাছে সফলভাবে পৌঁছেছে!' });
        setDirectMsgText('');
        setTimeout(() => {
          setDirectMsgUser(null);
          setDirectMsgResult(null);
          onRefreshUsers();
        }, 1500);
      } else {
        setDirectMsgResult({ ok: false, msg: data.error || 'মেসেজ পাঠানো সম্ভব হয়নি' });
      }
    } catch (err: any) {
      setDirectMsgResult({ ok: false, msg: err.message });
    } finally {
      setDirectMsgSending(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>বট ইউজার ডাটাবেজ (ব্রডকাস্ট আইডি লিস্ট)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ডাটাবেজে শুধুমাত্র ব্রডকাস্ট পাঠানোর জন্য ইউজারের টেলিগ্রাম চ্যাট আইডি ও প্রোফাইল সংরক্ষিত থাকে। কোনো ব্যক্তিগত মেসেজ ডাটাবেজে রাখা হয় না।
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {users.length === 0 && (
              <button
                onClick={handleSeedDemoUsers}
                disabled={seeding}
                className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{seeding ? 'যুক্ত হচ্ছে...' : 'ডেমো ইউজার যুক্ত করুন'}</span>
              </button>
            )}

            <button
              onClick={onRefreshUsers}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম, ইউজারনেম (@username) বা চ্যাট আইডি দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              সকল ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              সক্রিয় ({users.filter(u => u.status !== 'blocked_bot').length})
            </button>
            <button
              onClick={() => setStatusFilter('blocked_bot')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === 'blocked_bot'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              ব্লকড ({users.filter(u => u.status === 'blocked_bot').length})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">ইউজার ও ইউজারনেম</th>
                <th className="py-3 px-4">টেলিগ্রাম ID</th>
                <th className="py-3 px-4">মেসেজ সংখ্যা</th>
                <th className="py-3 px-4">সর্বশেষ সক্রিয়</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {(user.firstName || 'U')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200">
                          {user.firstName} {user.lastName || ''}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono">
                          {user.username ? `@${user.username}` : 'ইউজারনেম নেই'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Telegram ID */}
                  <td className="py-3 px-4 font-mono text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>{user.id}</span>
                      <button
                        onClick={() => copyId(user.id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        title="ID কপি করুন"
                      >
                        {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>

                  {/* Message Count */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px]">
                      {user.messageCount || 1} টি
                    </span>
                  </td>

                  {/* Last Active */}
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {user.lastActive ? new Date(user.lastActive).toLocaleDateString('bn-BD', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {user.status === 'blocked_bot' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
                        <UserX className="w-3 h-3" /> ব্লক করেছে
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        <UserCheck className="w-3 h-3" /> সক্রিয়
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View User Info */}
                      <button
                        onClick={() => setSelectedUserForChat(user)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                        title="ইউজার বিস্তারিত ও চ্যাট আইডি"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {/* Direct Message */}
                      <button
                        onClick={() => {
                          setDirectMsgUser(user);
                          setDirectMsgText('');
                          setDirectMsgResult(null);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                        title="মেসেজ পাঠান"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    কোন ইউজার খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: User Broadcast Details Modal */}
      {selectedUserForChat && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                  {(selectedUserForChat.firstName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {selectedUserForChat.firstName} {selectedUserForChat.lastName || ''}
                  </h4>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    {selectedUserForChat.username ? `@${selectedUserForChat.username}` : 'ইউজারনেম নেই'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForChat(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-slate-900/90 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">টেলিগ্রাম ব্রডকাস্ট চ্যাট আইডি</div>
                <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-mono text-cyan-300 font-bold text-sm">{selectedUserForChat.id}</span>
                  <button
                    onClick={() => copyId(selectedUserForChat.id)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-semibold text-[11px] flex items-center gap-1 transition-all"
                  >
                    {copiedId === selectedUserForChat.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">ব্রডকাস্ট স্ট্যাটাস</div>
                  <div className="mt-1 font-semibold">
                    {selectedUserForChat.status === 'blocked_bot' ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <UserX className="w-3 h-3" /> বট ব্লক করেছে
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> সক্রিয় (প্রস্তুত)
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">ইন্টারেকশন কাউন্ট</div>
                  <div className="mt-1 font-semibold text-slate-200">
                    {selectedUserForChat.messageCount || 1} বার যোগাযোগ
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 text-[11px] flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>প্রাইভেসি সেফটি:</strong> ডাটাবেজে ইউজারের কোনো মেসেজ সংরক্ষণ করা হয় না। শুধুমাত্র ব্রডকাস্ট ক্যাম্পেইন পরিচালনার জন্য এই চ্যাট আইডিটি সেভ রাখা হয়েছে।
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => {
                  setDirectMsgUser(selectedUserForChat);
                  setSelectedUserForChat(null);
                  setDirectMsgText('');
                  setDirectMsgResult(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>মেসেজ পাঠান</span>
              </button>

              <button
                onClick={() => setSelectedUserForChat(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Direct 1-on-1 Message Sender */}
      {directMsgUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  {directMsgUser.firstName}-কে সরাসরি মেসেজ পাঠান
                </h4>
              </div>
              <button
                onClick={() => setDirectMsgUser(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-xs text-slate-400">
                এই মেসেজটি @HalpLine_bot থেকে সরাসরি টেলিগ্রাম আইডি <span className="font-mono text-cyan-300 font-semibold">{directMsgUser.id}</span>-তে যাবে।
              </div>

              <textarea
                rows={4}
                value={directMsgText}
                onChange={(e) => setDirectMsgText(e.target.value)}
                placeholder="এখানে মেসেজ লিখুন..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
              />

              {directMsgResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  directMsgResult.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  <span>{directMsgResult.msg}</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                onClick={() => setDirectMsgUser(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleSendDirectMessage}
                disabled={directMsgSending || !directMsgText.trim()}
                className={`px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md ${
                  directMsgSending || !directMsgText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {directMsgSending ? 'পাঠানো হচ্ছে...' : 'মেসেজ পাঠান'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
