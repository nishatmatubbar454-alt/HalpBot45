import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  ShieldCheck, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Smartphone, 
  Eye, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Layers, 
  Filter, 
  History, 
  RotateCw,
  Terminal,
  Ban,
  Trash2,
  Upload
} from 'lucide-react';
import { BroadcastProgress, BroadcastHistoryItem, SystemStatus } from '../types';

interface BroadcastTabProps {
  status: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const BroadcastTab: React.FC<BroadcastTabProps> = ({ status, onRefreshStatus }) => {
  // Wizard Step: 1 = Write Message, 2 = Preview & Test, 3 = Send & Live Progress
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState('🔥 নতুন এক্সক্লুসিভ ভিডিও কালেকশন আপডেট!');
  const [message, setMessage] = useState(
    `হাই {first_name},\n\nআজকের সবথেকে গরম ও আকর্ষণীয় ভিডিওগুলো সরাসরি আমাদের FlickCove চ্যানেলে আপলোড করা হয়েছে! এখনই জয়েন করে ফুল ভিডিও উপভোগ করুন।\n\nআর ব্যাকআপ ভিডিও যাতে মিস না হয় সেজন্য হোয়াটসঅ্যাপ চ্যানেলে যুক্ত থাকুন।`
  );
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [parseMode, setParseMode] = useState<'HTML' | 'Markdown' | 'None'>('HTML');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [batchSize, setBatchSize] = useState<number>(25);
  const [avoidDuplicates, setAvoidDuplicates] = useState<boolean>(true);
  const [includeButtons, setIncludeButtons] = useState<boolean>(true);
  const [customBtnText, setCustomBtnText] = useState('');
  const [customBtnUrl, setCustomBtnUrl] = useState('');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setActionError('ছবির সাইজ ২৫ মেগাবাইটের চেয়ে ছোট হতে হবে।');
      return;
    }

    setSelectedFileName(file.name);
    const sizeKB = Math.round(file.size / 1024);
    setSelectedFileSize(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      setActionError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setSelectedFileName('');
    setSelectedFileSize('');
  };

  // Test send state
  const [testChatId, setTestChatId] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Execution & UI state
  const [isStarting, setIsStarting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [historyList, setHistoryList] = useState<BroadcastHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const progress: BroadcastProgress = status?.broadcast || {
    id: '',
    broadcastNumber: 125,
    status: 'idle',
    totalUsers: 0,
    sentCount: 0,
    failedCount: 0,
    blockedCount: 0,
    percent: 0,
    delaySeconds: 2,
    batchSize: 25,
    avoidDuplicates: true,
    sentUserIds: [],
    failedUserIds: [],
    blockedUserIds: [],
    logs: []
  };

  const totalUsers = status?.stats?.totalUsers || 0;
  const isRunning = progress.status === 'running';
  const isPaused = progress.status === 'paused';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/broadcast/history');
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setHistoryList(data.history);
      }
    } catch (e) {
      // fallback to status history if available
      if (status?.broadcastHistory) {
        setHistoryList(status.broadcastHistory);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Preset templates
  const applyTemplate = (type: 'video_promo' | 'whatsapp_backup' | 'custom_code') => {
    if (type === 'video_promo') {
      setTitle('🎬 নতুন প্রিমিয়াম ভিডিওগুলো এখনই দেখে নিন!');
      setMessage(`প্রিয় {first_name},\n\nআমাদের চ্যানেলে চমৎকার সব নতুন ভিডিও আপলোড সম্পন্ন হয়েছে। কোনো প্রকার বিজ্ঞাপন বা ঝামেলা ছাড়াই সরাসরি দেখতে নিচের বাটনে ক্লিক করুন।`);
      setIncludeButtons(true);
    } else if (type === 'whatsapp_backup') {
      setTitle('⚠️ জরুরি নোটিশ: ব্যাকআপ চ্যানেলে যুক্ত হন');
      setMessage(`প্রিয় দর্শক,\n\nটেলিগ্রাম চ্যানেলে কোনো সমস্যা বা কপিরাইট স্ট্রাইক আসলে যাতে ভিডিও মিস না হয়, তার জন্য আমাদের WhatsApp ব্যাকআপ চ্যানেল চালু হয়েছে। এখনই জয়েন করে রাখুন!`);
      setIncludeButtons(true);
    } else if (type === 'custom_code') {
      setTitle('🚀 Special Link Alert');
      setMessage(`<b>Hello {first_name}!</b>\n\nCheck out the latest video updates:\n👉 <code>HD 1080p Quality Available</code>\n\nJoin the official network now!`);
      setParseMode('HTML');
      setIncludeButtons(true);
    }
  };

  // Start Broadcast
  const handleStartBroadcast = async (resumeId?: string) => {
    if (!message.trim()) {
      setActionError('দয়া করে ব্রডকাস্ট মেসেজ টেক্সট লিখুন।');
      setCurrentStep(1);
      return;
    }

    if (totalUsers === 0) {
      setActionError('ডাটাবেজে কোনো ইউজার নেই! ইউজাররা বটে /start করলে এখানে যুক্ত হবে।');
      return;
    }

    setIsStarting(true);
    setActionError(null);

    try {
      const res = await fetch('/api/broadcast/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          imageUrl: imageUrl.trim(),
          parseMode,
          delaySeconds,
          batchSize,
          avoidDuplicates,
          includeButtons,
          customButtonText: customBtnText.trim(),
          customButtonUrl: customBtnUrl.trim(),
          resumeFromId: resumeId
        })
      });

      const data = await res.json();
      if (!data.success) {
        setActionError(data.message || 'ব্রডকাস্ট চালু করতে সমস্যা হয়েছে');
      } else {
        setCurrentStep(3);
        onRefreshStatus();
        fetchHistory();
      }
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setIsStarting(false);
    }
  };

  // Test Broadcast Send to Admin's own Chat ID
  const handleTestSend = async () => {
    if (!testChatId.trim()) {
      setTestResult({ ok: false, msg: 'আপনার টেলিগ্রাম Chat ID লিখুন।' });
      return;
    }

    setTestSending(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/broadcast/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetChatId: testChatId.trim(),
          payload: {
            title: title.trim(),
            message: message.trim(),
            imageUrl: imageUrl.trim(),
            parseMode,
            includeButtons,
            customButtonText: customBtnText.trim(),
            customButtonUrl: customBtnUrl.trim()
          }
        })
      });

      const data = await res.json();
      if (data.ok) {
        setTestResult({ ok: true, msg: 'টেস্ট মেসেজ আপনার টেলিগ্রামে সফলভাবে পাঠানো হয়েছে! চেক করুন।' });
      } else {
        setTestResult({ ok: false, msg: `ব্যর্থ হয়েছে: ${data.error || 'Chat ID ভুল অথবা ইউজার বটকে /start দেয়নি।'}` });
      }
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message });
    } finally {
      setTestSending(false);
    }
  };

  // Control buttons (Pause / Resume / Cancel)
  const handlePause = async () => {
    await fetch('/api/broadcast/pause', { method: 'POST' });
    onRefreshStatus();
    fetchHistory();
  };

  const handleResume = async () => {
    await fetch('/api/broadcast/resume', { method: 'POST' });
    onRefreshStatus();
    fetchHistory();
  };

  const handleCancel = async () => {
    if (confirm('আপনি কি ব্রডকাস্ট বাতিল করতে চান?')) {
      await fetch('/api/broadcast/cancel', { method: 'POST' });
      onRefreshStatus();
      fetchHistory();
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm('আপনি কি এই ব্রডকাস্ট হিস্টোরি ডিলিট করতে চান?')) return;
    try {
      await fetch(`/api/broadcast/history/${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (e) {}
  };

  const handleCopyCloudRunCmd = () => {
    navigator.clipboard.writeText('gcloud run services update YOUR_SERVICE_NAME --min 1');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const estimatedMinutes = Math.ceil(((totalUsers / batchSize) * delaySeconds) / 60);

  return (
    <div className="space-y-4">
      {/* 3-Step Wizard Navigation Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Step 1: Write Message */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentStep === 1 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Message লিখুন</span>
          </button>

          <span className="text-slate-600 text-xs">→</span>

          {/* Step 2: Preview & Test */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentStep === 2 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Preview ও টেস্ট</span>
          </button>

          <span className="text-slate-600 text-xs">→</span>

          {/* Step 3: Send & Live */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentStep === 3 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Send ও লাইভ স্ট্যাটাস</span>
            {isRunning && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />}
          </button>
        </div>

        {/* Audience summary badge */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>মোট ইউজার: <strong className="text-white font-mono">{totalUsers.toLocaleString()}</strong></span>
          <span className="text-slate-600">•</span>
          <span>ব্যাচ: <strong className="text-cyan-300">{batchSize} জন</strong></span>
        </div>
      </div>

      {/* Cloud Run 24/7 Keep-Alive Guide Banner (User tip integrated) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">বটকে ২৪/৭ অ্যাক্টিভ ও ব্রডকাস্ট সচল রাখার উপায় (Cloud Run): </span>
            <span className="text-slate-400">
              Cloud Console → Cloud Run → Bot Service → Edit Revision → Scaling → <strong>Min instances: 1</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyCloudRunCmd}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1.5 shrink-0 border border-slate-700 transition-colors"
          title="ক্লিক করে কমান্ড কপি করুন"
        >
          {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copiedCmd ? 'কপি হয়েছে!' : 'gcloud run ... --min 1'}</span>
        </button>
      </div>

      {/* STEP 1: Message লিখুন (Compose Message) */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">১. মেসেজ লিখুন (Compose Broadcast)</h3>
                </div>

                {/* Template Quick Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 hidden sm:inline">টেমপ্লেট:</span>
                  <button
                    type="button"
                    onClick={() => applyTemplate('video_promo')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-medium"
                  >
                    ভিডিও প্রমো
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('whatsapp_backup')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-medium"
                  >
                    WhatsApp ব্যাকআপ
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  মেসেজ টাইটেল (Title / Headline) - ঐচ্ছিক
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: 🔥 নতুন ভিডিও কালেকশন আপডেট!"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-medium"
                />
              </div>

              {/* Message Body Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    মেসেজের মূল টেক্সট
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span 
                      onClick={() => setMessage(prev => prev + ' {first_name}')}
                      className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono cursor-pointer hover:bg-slate-700"
                      title="ক্লিক করে ইনসার্ট করুন"
                    >
                      +&#123;first_name&#125;
                    </span>
                    <span 
                      onClick={() => setMessage(prev => prev + ' {username}')}
                      className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono cursor-pointer hover:bg-slate-700"
                      title="ক্লিক করে ইনসার্ট করুন"
                    >
                      +&#123;username&#125;
                    </span>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="এখানে আপনার মেসেজ লিখুন..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all leading-relaxed font-sans"
                />
              </div>

              {/* Gallery Photo Upload (সরাসরি গ্যালারির ফটো) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>গ্যালারির ফটো আপলোড (Gallery Photo) - ঐচ্ছিক</span>
                  </span>
                  {imageUrl && (
                    <span className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> ফটো সিলেক্টেড
                    </span>
                  )}
                </label>

                {!imageUrl ? (
                  <label
                    htmlFor="galleryPhotoInput"
                    className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 bg-slate-950/60 hover:bg-slate-900/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <input
                      type="file"
                      id="galleryPhotoInput"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      গ্যালারি থেকে ফটো সিলেক্ট করতে এখানে ক্লিক করুন
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      মোবাইল বা কম্পিউটারের গ্যালারি থেকে যেকোনো ছবি (সরাসরি ফটো ব্রডকাস্ট হবে, কোনো লিঙ্কের দরকার নেই)
                    </span>
                  </label>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                        <img src={imageUrl} alt="Selected" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {selectedFileName || 'গ্যালারির ছবি'}
                        </p>
                        <p className="text-[10px] text-cyan-400 font-mono mt-0.5">
                          {selectedFileSize ? `সাইজ: ${selectedFileSize}` : 'ব্রডকাস্টের জন্য প্রস্তুত'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor="galleryPhotoInput"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer border border-slate-700 transition-colors"
                      >
                        <input
                          type="file"
                          id="galleryPhotoInput"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                        <span>ছবি পরিবর্তন</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        title="ছবি ডিলিট করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Row: Parse Mode, Batch Size, Delay */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ফরম্যাট (Parse Mode)
                  </label>
                  <select
                    value={parseMode}
                    onChange={(e: any) => setParseMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="HTML">HTML (বোল্ড, লিঙ্ক)</option>
                    <option value="Markdown">Markdown</option>
                    <option value="None">Plain Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>ছোট ব্যাচ সাইজ</span>
                    <span className="text-cyan-400 font-mono">{batchSize} জন</span>
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value={15}>১৫ জন / ব্যাচ (খুব নিরাপদ)</option>
                    <option value={25}>২৫ জন / ব্যাচ (প্রস্তাবিত)</option>
                    <option value={40}>৪০ জন / ব্যাচ (দ্রুত)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>ব্যাচ বিরতি</span>
                    <span className="text-amber-400 font-mono">{delaySeconds}s</span>
                  </label>
                  <select
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value={1}>১ সেকেন্ড বিরতি</option>
                    <option value={2}>২ সেকেন্ড (Telegram Compliant)</option>
                    <option value={3}>৩ সেকেন্ড বিরতি</option>
                    <option value={5}>৫ সেকেন্ড বিরতি</option>
                  </select>
                </div>
              </div>

              {/* Duplicate Tracking & Anti-Flood Guard Checkboxes */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="avoidDup"
                      checked={avoidDuplicates}
                      onChange={(e) => setAvoidDuplicates(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="avoidDup" className="text-xs font-semibold text-slate-200 cursor-pointer">
                      একই broadcast আবার পাঠাতে চাইলে duplicate tracking রাখবে (ডুপ্লিকেট প্রতিরোধ)
                    </label>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal pl-6">
                  যেসব ইউজার একবার মেসেজ পেয়েছে তারা একই ক্যাম্পেইনে দ্বিতীয়বার মেসেজ পাবে না।
                </p>

                <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="incBtn"
                    checked={includeButtons}
                    onChange={(e) => setIncludeButtons(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="incBtn" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    FlickCove টেলিগ্রাম ও WhatsApp চ্যানেলের জয়েন বাটন যুক্ত করুন
                  </label>
                </div>
              </div>

              {/* Error Banner */}
              {actionError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Next Step Button */}
              <div className="pt-1 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  আনুমানিক সময়: <strong className="text-amber-400">~{estimatedMinutes} মিনিট</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5"
                >
                  <span>Preview দেখুন ও টেস্ট করুন</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Safe Rate Limit Specs */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>টেলিগ্রাম রেট লিমিট প্রটেকশন</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                টেলিগ্রাম পলিসি অনুযায়ী বটের সর্বোচ্চ রেট লিমিট <strong>৩০টি মেসেজ/সেকেন্ড</strong>।
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">ব্যাচিং সাইজ:</span>
                  <span className="text-cyan-300 font-semibold">{batchSize} জন / ব্যাচ</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">বিরতি সেফগার্ড:</span>
                  <span className="text-emerald-300 font-semibold">{delaySeconds}s / ব্যাচ</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Auto 429 Backoff:</span>
                  <span className="text-emerald-300 font-semibold">সক্রিয়</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Blocked ইউজার ডিটেক্ট:</span>
                  <span className="text-rose-300 font-semibold">অটো আইডেন্টিফাই</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Test (প্রিভিউ ও টেস্ট মেসেজ) */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Live Telegram Mockup */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>২. টেলিগ্রাম মেসেজ প্রিভিউ (Preview)</span>
              </span>
              <span className="text-[10px] text-slate-500">ইউজার যেমন দেখতে পাবে</span>
            </div>

            {/* Telegram Container Mockup */}
            <div className="w-full max-w-sm mx-auto rounded-3xl bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden">
              <div className="bg-slate-900 px-3.5 py-2.5 border-b border-slate-800 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  HL
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">@HalpLine_bot</div>
                  <div className="text-[10px] text-cyan-400">bot</div>
                </div>
              </div>

              <div className="p-3 min-h-[340px] bg-gradient-to-b from-[#0f172a] to-[#090d16] flex flex-col justify-end">
                <div className="bg-[#1e293b] rounded-2xl rounded-tl-sm p-3 shadow-md border border-slate-800/80 space-y-2">
                  {imageUrl && (
                    <div className="rounded-lg overflow-hidden max-h-48 bg-slate-900 border border-slate-800">
                      <img 
                        src={imageUrl} 
                        alt="Gallery Broadcast Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {title && (
                    <div className="text-xs font-bold text-cyan-300 leading-tight">
                      {title}
                    </div>
                  )}

                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {message.replace(/{first_name}/g, 'Tanvir').replace(/{username}/g, '@tanvir')}
                  </div>

                  <div className="text-[10px] text-slate-400 text-right">
                    12:45 PM • Read
                  </div>
                </div>

                {includeButtons && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-semibold text-center border border-slate-700 flex items-center justify-center gap-1">
                      <span>🎬 সব ভিডিও দেখুন (FlickCove)</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 text-emerald-300 text-[11px] font-semibold text-center border border-slate-700 flex items-center justify-center gap-1">
                      <span>📲 ব্যাকআপ চ্যানেল (WhatsApp)</span>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Test Send to Admin Chat ID & Next step */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>নিজের টেলিগ্রামে টেস্ট করুন</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                সব ইউজারের কাছে পাঠানোর আগে নিজের টেলিগ্রামে টেস্ট মেসেজ পাঠিয়ে লিঙ্ক ও ছবি যাচাই করে নিন:
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                  placeholder="আপনার টেলিগ্রাম Chat ID (যেমন: 123456789)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={testSending}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  {testSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{testSending ? 'টেস্ট মেসেজ যাচ্ছে...' : 'টেস্ট মেসেজ পাঠান'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>

            {/* Launch Box */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>প্রস্তুত? সব ইউজারের কাছে সেন্ড করুন</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                সিস্টেম স্বয়ংক্রিয়ভাবে ছোট ছোট ব্যাচ করে টেলিগ্রাম রেট লিমিট মেনে পাঠাবে।
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  ← এডিট করুন
                </button>
                <button
                  type="button"
                  onClick={() => handleStartBroadcast()}
                  disabled={isStarting || isRunning}
                  className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send করুন ({totalUsers.toLocaleString()} জন)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Send ও লাইভ স্ট্যাটাস (Exact Format as requested by user) */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* Main Broadcast Progress Card */}
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            {/* Header: 📢 Broadcast #125 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${
                  isRunning ? 'bg-cyan-400 animate-ping' : isPaused ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📢 Broadcast #{progress.broadcastNumber || 125}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isRunning ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      isPaused ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      progress.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {isRunning ? 'চলমান (Running)' : isPaused ? 'পজড (Paused)' : progress.status === 'completed' ? 'সমাপ্ত (Completed)' : 'আইডল'}
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ব্যাচ সাইজ: {progress.batchSize || 25} জন • বিরতি: {progress.delaySeconds || 2}s • ডুপ্লিকেট ফিল্টার: {progress.avoidDuplicates ? 'অন' : 'অফ'}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                {isRunning && (
                  <button
                    onClick={handlePause}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 border border-amber-500/30 transition-all"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>পজ</span>
                  </button>
                )}

                {isPaused && (
                  <button
                    onClick={handleResume}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-500/30 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>রিজিউম</span>
                  </button>
                )}

                {(isRunning || isPaused) && (
                  <button
                    onClick={handleCancel}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-500/30 transition-all"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>বাতিল</span>
                  </button>
                )}

                {!isRunning && (
                  <button
                    onClick={() => handleStartBroadcast()}
                    disabled={isStarting}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>নতুন ব্রডকাস্ট চালু করুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Exact Specification Metric Cards:
                Total users: 48,520
                ✅ Sent: 47,891
                ❌ Failed: 629
                🚫 Blocked: 510
                Progress: 100%
            */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
              {/* Total Users */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400">Total users:</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {(progress.totalUsers || totalUsers).toLocaleString()}
                </div>
              </div>

              {/* ✅ Sent */}
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <span>✅ Sent:</span>
                </div>
                <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">
                  {progress.sentCount.toLocaleString()}
                </div>
              </div>

              {/* ❌ Failed */}
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
                <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  <span>❌ Failed:</span>
                </div>
                <div className="text-lg font-bold text-rose-300 font-mono mt-0.5">
                  {progress.failedCount.toLocaleString()}
                </div>
              </div>

              {/* 🚫 Blocked */}
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <span>🚫 Blocked:</span>
                </div>
                <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                  {progress.blockedCount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Progress Bar & Percentage: Progress: 100% */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300">Progress: {progress.percent}%</span>
                <span className="text-slate-400 text-[11px]">
                  {progress.estimatedRemainingSeconds && progress.estimatedRemainingSeconds > 0
                    ? `অবশিষ্ট সময়: ~${Math.ceil(progress.estimatedRemainingSeconds / 60)} মিনিট`
                    : progress.status === 'completed'
                    ? '১০০% সম্পন্ন'
                    : 'প্রস্তুত'}
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            {/* Live user execution indicator */}
            {isRunning && progress.currentUserName && (
              <div className="mt-3 p-2 rounded bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span>বর্তমানে পাঠানো হচ্ছে:</span>
                  <strong className="text-white font-mono">{progress.currentUserName}</strong>
                  <span className="text-slate-500 font-mono">(ID: {progress.currentUserId})</span>
                </span>
                <span className="text-cyan-400 text-[10px]">ব্যাচ প্রসেসিং চলছে...</span>
              </div>
            )}

            {/* Live User Transmission Logs */}
            {progress.logs && progress.logs.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>রিয়েল-টাইম ট্রান্সমিশন লগ</span>
                  <span className="text-slate-500">সর্বশেষ {Math.min(progress.logs.length, 50)} জন</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {progress.logs.slice(0, 15).map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between py-0.5 px-2 rounded bg-slate-950/60 border border-slate-900">
                      <span className="text-slate-400">
                        [{l.timestamp}] {l.userName} (ID: {l.userId})
                      </span>
                      {l.status === 'sent' ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-sans text-xs">
                          <CheckCircle2 className="w-3 h-3" /> ✅ Sent
                        </span>
                      ) : l.status === 'blocked' ? (
                        <span className="text-amber-400 flex items-center gap-1 font-sans text-xs" title="বট ব্লক করেছে">
                          <Ban className="w-3 h-3" /> 🚫 Blocked
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-sans text-xs" title={l.error}>
                          <AlertCircle className="w-3 h-3" /> ❌ Failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Past Broadcast Campaigns & Duplicate Tracking History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  ব্রডকাস্ট হিস্টোরি ও ডুপ্লিকেট ট্র্যাকিং
                </h4>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                কোনো পূর্ববর্তী ব্রডকাস্ট হিস্টোরি নেই।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {historyList.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        📢 Broadcast #{item.broadcastNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.percent}%
                        </span>
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="হিস্টোরি মুছুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {item.title && (
                      <div className="text-[11px] text-cyan-300 font-medium truncate">
                        {item.title}
                      </div>
                    )}

                    {/* Exact format summary */}
                    <div className="text-[11px] font-mono space-y-0.5 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                      <div className="text-slate-300">Total users: {item.totalUsers.toLocaleString()}</div>
                      <div className="text-emerald-400">✅ Sent: {item.sentCount.toLocaleString()}</div>
                      <div className="text-rose-400">❌ Failed: {item.failedCount.toLocaleString()}</div>
                      <div className="text-amber-400">🚫 Blocked: {item.blockedCount.toLocaleString()}</div>
                      <div className="text-cyan-300 font-bold">Progress: {item.percent}%</div>
                    </div>

                    {/* Duplicate Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(item.title || '');
                        setMessage(item.message || '');
                        handleStartBroadcast(item.id);
                      }}
                      className="w-full py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      title="যাদের পাঠানো হয়নি শুধু তাদের পাঠানো হবে"
                    >
                      <RotateCw className="w-3 h-3 text-cyan-400" />
                      <span>আবার নতুন ইউজারদের পাঠান (Avoid Duplicates)</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
