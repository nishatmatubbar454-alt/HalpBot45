import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Save, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Cpu, 
  Database, 
  RefreshCw, 
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  Sliders,
  Terminal,
  Copy,
  Cloud,
  Server,
  Download,
  Upload,
  GitBranch,
  FolderArchive,
  Globe,
  Zap,
  Activity,
  Clock
} from 'lucide-react';
import { BotSettings, SystemStatus, DEFAULT_COMMANDS } from '../types';

interface SettingsTabProps {
  status: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ status, onRefreshStatus }) => {
  const [formData, setFormData] = useState<BotSettings>({
    botToken: "8333224990:AAHxUUVXAG5InYIEa7MXSHhB_iR1C1kc8II",
    botUsername: "HalpLine_bot",
    geminiApiKey: "",
    telegramGroupLink: "https://t.me/FlickCove_Top",
    whatsappBackupLink: "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V",
    welcomeMessage: DEFAULT_COMMANDS.startReply,
    replyMode: "ai",
    staticReplyMessage: "এখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের ভিডিও, সুন্দর সুন্দর ভিডিও পাওয়া যায়। নিচের বাটনে ক্লিক করে চ্যানেলে যুক্ত থাকুন।",
    commands: DEFAULT_COMMANDS,
    aiSystemPrompt: `You are the official conversational AI representative of @HalpLine_bot.
Language: Natural Bengali (বাংলা).

RULES:
1. If the user asks about videos or what videos are available:
Always state:
"এখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের ভিডিও, সুন্দর সুন্দর ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।"

2. If the user says they cannot find a video or asks how/where to search:
Always reply:
"ওয়েবসাইটে মধ্যে কোনো ভিডিও খুঁজে না পেলে ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই ভিডিও পেয়ে যাবেন।"`,
    isPollingActive: true,
    broadcastDelaySeconds: 5,
    adminTelegramId: "",
    showInlineButtons: true,
    channelButtonText: "🎬 সব ভিডিও দেখুন (FlickCove)",
    whatsappButtonText: "📲 ব্যাকআপ চ্যানেল (WhatsApp)"
  });

  const [showToken, setShowToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testingToken, setTestingToken] = useState(false);
  const [cloudServiceName, setCloudServiceName] = useState("halpline-telegram-bot");
  const [copiedCmd, setCopiedCmd] = useState(false);

  // GitHub Export & Push State
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [isPushingGithub, setIsPushingGithub] = useState(false);
  const [githubPushResult, setGithubPushResult] = useState<{ ok: boolean; msg: string; repoUrl?: string } | null>(null);

  const handlePushToGithub = async () => {
    if (!githubRepoUrl.trim() || !githubToken.trim()) {
      setGithubPushResult({ ok: false, msg: 'দয়া করে আপনার GitHub Repo URL এবং Personal Access Token লিখুন।' });
      return;
    }
    setIsPushingGithub(true);
    setGithubPushResult(null);
    try {
      const res = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: githubRepoUrl.trim(),
          personalAccessToken: githubToken.trim(),
          branch: githubBranch.trim() || 'main'
        })
      });
      const data = await res.json();
      if (data.success) {
        setGithubPushResult({ ok: true, msg: data.message, repoUrl: data.repoWebUrl });
      } else {
        setGithubPushResult({ ok: false, msg: data.error || 'GitHub পুশ ব্যর্থ হয়েছে।' });
      }
    } catch (err: any) {
      setGithubPushResult({ ok: false, msg: 'সার্ভার যোগাযোগে সমস্যা: ' + err.message });
    } finally {
      setIsPushingGithub(false);
    }
  };

  // 24/7 Webhook & Keep-Alive State
  const [isManagingWebhook, setIsManagingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [copiedHealthUrl, setCopiedHealthUrl] = useState(false);

  const handleActivateWebhook = async () => {
    setIsManagingWebhook(true);
    setWebhookResult(null);
    try {
      const targetUrl = customWebhookUrl.trim() || `${window.location.origin}/api/telegram-webhook`;
      const res = await fetch('/api/webhook/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookResult({ ok: true, msg: `Webhook সফলভাবে সক্রিয় করা হয়েছে! URL: ${targetUrl}` });
        onRefreshStatus();
      } else {
        setWebhookResult({ ok: false, msg: `Webhook ব্যর্থ: ${data.description || data.error}` });
      }
    } catch (err: any) {
      setWebhookResult({ ok: false, msg: 'সার্ভার যোগাযোগে সমস্যা: ' + err.message });
    } finally {
      setIsManagingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    setIsManagingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/webhook/delete', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setWebhookResult({ ok: true, msg: 'Webhook বাতিল করা হয়েছে এবং Polling মোড চালু হয়েছে।' });
        onRefreshStatus();
      } else {
        setWebhookResult({ ok: false, msg: `বাতিল ব্যর্থ: ${data.description || data.error}` });
      }
    } catch (err: any) {
      setWebhookResult({ ok: false, msg: 'সার্ভার যোগাযোগে সমস্যা: ' + err.message });
    } finally {
      setIsManagingWebhook(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setFormData((prev) => ({
          ...prev,
          ...data.settings,
          commands: {
            ...DEFAULT_COMMANDS,
            ...(data.settings.commands || {})
          }
        }));
      }
    } catch (e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        onRefreshStatus();
      }
    } catch (e) {}
    setSaving(false);
  };

  const handleTestToken = async () => {
    setTestingToken(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/bot/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: formData.botToken })
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult({
          ok: true,
          msg: `টোকেন ভ্যালিড! সংযুক্ত বট: @${data.result.username} (${data.result.first_name})`
        });
      } else {
        setTestResult({
          ok: false,
          msg: `টোকেন বাতিল: ${data.error || 'টেলিগ্রাম সংযোগ ব্যর্থ'}`
        });
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.message });
    } finally {
      setTestingToken(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Bar with Save Button */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>বট কনফিগারেশন ও সেটিংস</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            টোকেন, রেসপন্স মোড, প্রমোশনাল লিঙ্ক ও জেমিনি এআই প্রম্পট নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>সংরক্ষণ হচ্ছে...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>সংরক্ষিত হয়েছে!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>সেটিংস সেভ করুন</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Telegram Bot Credentials */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>টেলিগ্রাম বট ক্রেডেনশিয়াল</span>
            </h4>
            <span className="text-[11px] font-mono text-cyan-400">@HalpLine_bot</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              বট টোকেন (Telegram Bot Token)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={formData.botToken}
                onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleTestToken}
              disabled={testingToken}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              {testingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
              <span>টোকেন ভেরিফাই করুন</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              testResult.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}>
              <span>{testResult.msg}</span>
            </div>
          )}

          {/* Gemini API Key */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              জেমিনি এপিআই কি (Gemini API Key)
            </label>
            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              প্রদানকৃত Geneme API: AQ.Ab8RN6Ib9d1oM_... স্বয়ংক্রিয়ভাবে সংরক্ষিত
            </p>
          </div>
        </div>

        {/* Section 2: Reply Mode (AI vs Fixed Static) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>রেসপন্স মোড সিলেকশন</span>
            </h4>
            <span className="text-[11px] text-slate-400">অন / অফ কন্ট্রোল</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Mode 1: AI */}
            <div
              onClick={() => setFormData({ ...formData, replyMode: 'ai' })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                formData.replyMode === 'ai'
                  ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-purple-300">Gemini AI মোড</span>
                <input
                  type="radio"
                  name="replyMode"
                  checked={formData.replyMode === 'ai'}
                  onChange={() => setFormData({ ...formData, replyMode: 'ai' })}
                  className="text-purple-500 focus:ring-0"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                ইউজারের সাথে স্মার্টভাবে কথা বলে ভিডিও দেখার জন্য লিঙ্ক দেবে।
              </p>
            </div>

            {/* Mode 2: Static Auto Reply */}
            <div
              onClick={() => setFormData({ ...formData, replyMode: 'static' })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                formData.replyMode === 'static'
                  ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-cyan-300">ফিক্সড রিপ্লাই মোড</span>
                <input
                  type="radio"
                  name="replyMode"
                  checked={formData.replyMode === 'static'}
                  onChange={() => setFormData({ ...formData, replyMode: 'static' })}
                  className="text-cyan-500 focus:ring-0"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                ইউজার যেকোনো মেসেজ দিলেই নির্দিষ্ট একটি মেসেজ যাবে।
              </p>
            </div>
          </div>

          {/* Static Reply Text Editor */}
          {formData.replyMode === 'static' && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-cyan-300 mb-1.5">
                ফিক্সড অটো-রিপ্লাই মেসেজ (ইউজার যাই বলুক এটা যাবে)
              </label>
              <textarea
                rows={3}
                value={formData.staticReplyMessage}
                onChange={(e) => setFormData({ ...formData, staticReplyMessage: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
              />
            </div>
          )}

          {/* Inline Buttons Toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">ইনলাইন চ্যানেল বাটন</div>
              <div className="text-[11px] text-slate-400">প্রতিটি উত্তরের নিচে ১-ক্লিকে জয়েন করার বোতাম পাঠানো হবে</div>
            </div>
            <input
              type="checkbox"
              checked={formData.showInlineButtons}
              onChange={(e) => setFormData({ ...formData, showInlineButtons: e.target.checked })}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Section 3: Promotional Video Channels */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              🎬 চ্যানেল লিঙ্কসমূহ
            </h4>
            <span className="text-[11px] text-slate-400">ইউজার রিডাইরেক্ট টার্গেট</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              টেলিগ্রাম চ্যানেল লিঙ্ক (FlickCove - মূল ভিডিও)
            </label>
            <input
              type="url"
              value={formData.telegramGroupLink}
              onChange={(e) => setFormData({ ...formData, telegramGroupLink: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              হোয়াটসঅ্যাপ ব্যাকআপ চ্যানেল লিঙ্ক (WhatsApp Backup)
            </label>
            <input
              type="url"
              value={formData.whatsappBackupLink}
              onChange={(e) => setFormData({ ...formData, whatsappBackupLink: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">টেলিগ্রাম বাটন টেক্সট</label>
              <input
                type="text"
                value={formData.channelButtonText}
                onChange={(e) => setFormData({ ...formData, channelButtonText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">WhatsApp বাটন টেক্সট</label>
              <input
                type="text"
                value={formData.whatsappButtonText}
                onChange={(e) => setFormData({ ...formData, whatsappButtonText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Specific Bot Commands & Instant Replies */}
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>⚡ নির্দিষ্ট ৪টি কমান্ড ও অটো রিপ্লাই (Commands & Buttons)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                বটের মধ্যে এই ৪টি কমান্ড দিলেই সাথে সাথে এই উত্তরগুলো যাবে এবং অবশ্যই নিচে বোতাম থাকবে।
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  welcomeMessage: DEFAULT_COMMANDS.startReply,
                  commands: { ...DEFAULT_COMMANDS }
                });
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold shrink-0"
            >
              মূল কমান্ড টেক্সট রিস্টোর
            </button>
          </div>

          {/* Command 1: /start */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                /start
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">মেসেজের নিচে বোতাম সহ</span>
            </div>
            <textarea
              rows={3}
              value={formData.commands?.startReply ?? formData.welcomeMessage}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  welcomeMessage: val,
                  commands: {
                    ...(formData.commands || DEFAULT_COMMANDS),
                    startReply: val
                  }
                });
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />
          </div>

          {/* Command 2: /ভিডিও দেখার উপায় */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                /ভিডিও দেখার উপায়
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">মেসেজের নিচে বোতাম সহ</span>
            </div>
            <textarea
              rows={2}
              value={formData.commands?.videoHelpReply ?? DEFAULT_COMMANDS.videoHelpReply}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  commands: {
                    ...(formData.commands || DEFAULT_COMMANDS),
                    videoHelpReply: val
                  }
                });
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />
          </div>

          {/* Command 3: /new video */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                /new video
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">মেসেজের নিচে বোতাম সহ</span>
            </div>
            <textarea
              rows={2}
              value={formData.commands?.newVideoReply ?? DEFAULT_COMMANDS.newVideoReply}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  commands: {
                    ...(formData.commands || DEFAULT_COMMANDS),
                    newVideoReply: val
                  }
                });
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />
          </div>

          {/* Command 4: /Bickup channel */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                /Bickup channel
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">মেসেজের নিচে বোতাম সহ</span>
            </div>
            <textarea
              rows={2}
              value={formData.commands?.backupChannelReply ?? DEFAULT_COMMANDS.backupChannelReply}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  commands: {
                    ...(formData.commands || DEFAULT_COMMANDS),
                    backupChannelReply: val
                  }
                });
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
            />
          </div>

          {/* Buttons preview note */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
            <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-cyan-300">প্রতিটি কমান্ডের মেসেজের নিচে অটোমেটিক সংযুক্ত বোতামসমূহ:</p>
              <p className="text-[11px] text-slate-300">
                ১. 🎬 {formData.channelButtonText || 'সব ভিডিও দেখুন (FlickCove)'} (টেলিগ্রাম লিঙ্ক) &bull; ২. 📲 {formData.whatsappButtonText || 'ব্রেকাপ চ্যানেল (WhatsApp)'} (হোয়াটসঅ্যাপ লিঙ্ক)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Gemini AI System Prompt */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              🧠 Gemini AI সিস্টেম প্রম্পট (পার্সোনালিটি ও ভিডিও গাইডেন্স)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              জেমিনি ৩.৮ ফ্ল্যাশ মডেল এই নির্দেশাবলি মেনে ইউজারকে ভিডিওর দিকে আকর্ষিত করবে।
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                aiSystemPrompt: `You are the official AI representative for @HalpLine_bot.
Your goal is to converse with the user in Bengali (or the language the user speaks) in a friendly, engaging, polite, and persuasive tone.
Crucial Rule: Whatever the user asks, jokes about, inquires, or converses with you, skillfully and naturally steer the conversation back to the exclusive, high-quality videos available in our channels!
Inform them that all the amazing videos they are looking for are posted directly in:
1. FlickCove Telegram Channel: https://t.me/FlickCove_Top
2. WhatsApp Backup Channel (for backup videos): https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V
Always invite them with excitement to join these channels. Be concise, punchy, persuasive, and always include the links.`
              });
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            ডিফল্ট প্রম্পট রিস্টোর করুন
          </button>
        </div>

        <textarea
          rows={6}
          value={formData.aiSystemPrompt}
          onChange={(e) => setFormData({ ...formData, aiSystemPrompt: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Section 6: 24/7 Always-On Solutions */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>২৪/৭ অলওয়েজ-অন বট স্থায়ী সমাধান (24/7 Always-On Fix)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                  ১০০% স্থায়ী সমাধান
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                কেন কিছুক্ষন পর বন্ধ হয়? সার্ভারে কোনো ভিজিটর না থাকলে ক্লাউড রান ১৫ মিনিট পর স্লিপ মোডে যায়। নিচের সমাধানগুলো ব্যবহার করে এটি ২৪ ঘন্টা চালু রাখুন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status?.bot?.webhook?.url ? (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                Webhook মোড সক্রিয় (২৪/৭)
              </span>
            ) : (
              <span className="text-[11px] text-cyan-400 flex items-center gap-1.5 font-semibold bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                <RefreshCw className="w-3.5 h-3.5" />
                Polling মোড সক্রিয়
              </span>
            )}
          </div>
        </div>

        {/* 3 Proven Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Solution 1: Telegram Webhook (Instant server wake up on any message) */}
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4.5 flex flex-col justify-between space-y-3.5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] flex items-center justify-center font-bold">১</span>
                  Telegram Webhook (সেরা সমাধান)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">
                  ইনস্ট্যান্ট ওয়ান-ক্লিক
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Webhook চালু করলে বট স্লিপে থাকলেও কেউ মেসেজ পাঠালে Telegram নিজে সার্ভারকে সাথে সাথে জাগিয়ে দেয় এবং ইনস্ট্যান্ট উত্তর দেয়!
              </p>

              <div className="mt-3 space-y-2">
                <label className="text-[11px] text-slate-400 block font-medium">Webhook URL (অটো প্রস্তুত):</label>
                <input
                  type="text"
                  value={customWebhookUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/telegram-webhook`}
                  onChange={(e) => setCustomWebhookUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-cyan-300 font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              {status?.bot?.webhook?.url && (
                <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-0.5 font-mono">
                  <p className="truncate">🔗 সক্রিয়: {status.bot.webhook.url}</p>
                  <p className="text-[10px] text-slate-400">পেন্ডিং আপডেট: {status.bot.webhook.pending_update_count ?? 0}</p>
                </div>
              )}

              {webhookResult && (
                <div className={`mt-2 p-2 rounded-lg text-xs flex items-start gap-1.5 ${
                  webhookResult.ok 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}>
                  {webhookResult.ok ? <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                  <span>{webhookResult.msg}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleActivateWebhook}
                disabled={isManagingWebhook}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isManagingWebhook ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>প্রসেসিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Telegram Webhook সক্রিয় করুন</span>
                  </>
                )}
              </button>

              {status?.bot?.webhook?.url && (
                <button
                  type="button"
                  onClick={handleDeleteWebhook}
                  disabled={isManagingWebhook}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-[11px] transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Webhook মুছুন (Polling-এ ফিরুন)</span>
                </button>
              )}
            </div>
          </div>

          {/* Solution 2: Free Keep-Alive Pinger (Cron-Job.org / UptimeRobot) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between space-y-3.5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] flex items-center justify-center font-bold">২</span>
                  ফ্রি Keep-Alive Pinger
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  ১০০% ফ্রি
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <a href="https://cron-job.org" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">cron-job.org</a> অথবা <a href="https://uptimerobot.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">UptimeRobot</a>-এ আপনার হেলথ URL দিয়ে প্রতি ৫ মিনিটে একটি ফ্রি পিং সেট করে দিন।
              </p>

              <div className="mt-3 space-y-1.5">
                <label className="text-[11px] text-slate-400 block font-medium">Keep-Alive Health URL:</label>
                <div className="relative group bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-emerald-400 flex items-center justify-between gap-2">
                  <span className="truncate select-all text-xs">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/health` : '/api/health'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const healthUrl = `${window.location.origin}/api/health`;
                      navigator.clipboard.writeText(healthUrl);
                      setCopiedHealthUrl(true);
                      setTimeout(() => setCopiedHealthUrl(false), 2500);
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
                    title="URL কপি করুন"
                  >
                    {copiedHealthUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="mt-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">কীভাবে করবেন?</p>
                <p>১. <a href="https://cron-job.org" target="_blank" rel="noreferrer" className="text-cyan-400 underline">cron-job.org</a>-এ ফ্রি একাউন্ট খুলুন</p>
                <p>২. "Create Cronjob" এ ওপরের URL দিন</p>
                <p>৩. Schedule: <span className="text-emerald-400 font-semibold">Every 5 minutes</span> সিলেক্ট করে Save দিন!</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://cron-job.org/en/members/jobs/add/"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-medium text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>cron-job.org ওপেন করুন</span>
              </a>
            </div>
          </div>

          {/* Solution 3: Render / Koyeb Free 24/7 Hosting */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between space-y-3.5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] flex items-center justify-center font-bold">৩</span>
                  Render / Koyeb ফ্রি ২৪/৭ হোস্টিং
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                  স্থায়ী ক্লাউড
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার GitHub রিপোজিটরি (<span className="text-cyan-300 font-mono text-[10px]">HalpLane1</span>) সরাসরি <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">Render.com</a>-এ ফ্রি ডিপ্লয় করলে বট আজীবন একটানা ২৪ ঘন্টা চলবে!
              </p>

              <div className="mt-3 space-y-1.5 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <p className="font-semibold text-slate-200">সহজ ধাপসমূহ:</p>
                <p>১. Render.com এ গিয়ে "New Web Service" দিন</p>
                <p>২. আপনার GitHub রিপো কানেক্ট করুন</p>
                <p>৩. Build Command: <code className="text-cyan-300 font-mono text-[10px]">npm install && npm run build</code></p>
                <p>৪. Start Command: <code className="text-cyan-300 font-mono text-[10px]">npm start</code></p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://dashboard.render.com/select-repo?type=web"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-medium text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Render.com-এ ডিপ্লয় করুন</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* GitHub Export & Source Code Download Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>GitHub এক্সপোর্ট ও ব্যাকআপ (GitHub Push & Source Code)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Easy Export
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Google AI Studio-এর "Failed to push commit" এরর এড়াতে নিচের যেকোনো একটি বিকল্প ব্যবহার করুন।
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Method 1: ZIP Download */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <FolderArchive className="w-4 h-4" />
                <span>পদ্ধতি ১: সম্পূর্ণ কোড ZIP ডাউনলোড</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                আপনার মোবাইল বা পিসিতে প্রজেক্টের সব ফাইল (বট ইঞ্জিন, ফ্রন্টএন্ড, ফায়ারবেস সার্ভিস) একটি ZIP ফাইলের ভেতর সাথে সাথে ডাউনলোড করে নিন।
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/api/download-zip"
                download="halpline-bot-source.zip"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>সম্পূর্ণ প্রজেক্ট ZIP ডাউনলোড করুন</span>
              </a>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                💡 ডাউনলোড করার পর <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-cyan-400 underline">GitHub.com/new</a>-এ গিয়ে "upload an existing file" দিয়ে সরাসরি আপলোড করে পাবলিক করতে পারবেন।
              </p>
            </div>
          </div>

          {/* Method 2: In-App Direct Push to GitHub */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Upload className="w-4 h-4" />
                <span>পদ্ধতি ২: সার্ভার থেকে সরাসরি GitHub-এ পুশ</span>
              </div>
              <p className="text-xs text-slate-400">
                আপনার রিপোজিটরি লিংক এবং পার্সোনাল টোকেন দিলে সার্ভার নিজে থেকে গিট পুশ সম্পন্ন করবে।
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  GitHub Repository URL:
                </label>
                <input
                  type="text"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/your-username/your-repo"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  GitHub Personal Access Token (Classic with 'repo' scope):
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=HalpLineBot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>টোকেন তৈরি করুন (GitHub Token Generator)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {githubPushResult && (
                <div className={`p-3 rounded-lg text-xs border ${
                  githubPushResult.ok 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <p>{githubPushResult.msg}</p>
                  {githubPushResult.repoUrl && (
                    <a
                      href={githubPushResult.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 underline font-semibold mt-1"
                    >
                      <span>আপনার GitHub রিপোজিটরি ভিজিট করুন</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handlePushToGithub}
                disabled={isPushingGithub}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPushingGithub ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>GitHub-এ পুশ হচ্ছে... অপেক্ষা করুন</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>সরাসরি GitHub-এ পুশ করুন (Push Now)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

