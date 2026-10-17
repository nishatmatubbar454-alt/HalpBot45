import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ExternalLink, 
  RotateCcw, 
  HelpCircle,
  Cpu
} from 'lucide-react';
import { SystemStatus } from '../types';

interface SimulatorTabProps {
  status: SystemStatus | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  buttons?: Array<{ text: string; url?: string; action?: string }>;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({ status }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "*হ্যালো স্যার*\nএখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের লিং*ক ভি*ডিও পাওয় যায় । ভিডিও দেখতে নিচের বাটনে ক্লিক করে । চ্যানেলের মধ্যে থেকে দেখতে পারেন\n।",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      buttons: [
        { text: '🎬 সব ভিডিও দেখুন (FlickCove)', url: 'https://t.me/FlickCove_Top' },
        { text: '📲 ব্যাকআপ চ্যানেল (WhatsApp)', url: 'https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const replyMode = status?.settings?.replyMode || 'ai';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('bot' as const),
        text: m.text
      }));

      const res = await fetch('/api/simulate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          chatHistory: history
        })
      });

      const data = await res.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          buttons: data.buttons
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: 'বট থেকে উত্তর তৈরিতে সমস্যা হয়েছে। সেটিংস চেক করুন।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: 'কানেকশন এরর: ' + e.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "*হ্যালো স্যার*\nএখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের লিং*ক ভি*ডিও পাওয় যায় । ভিডিও দেখতে নিচের বাটনে ক্লিক করে । চ্যানেলের মধ্যে থেকে দেখতে পারেন\n।",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        buttons: [
          { text: '🎬 সব ভিডিও দেখুন (FlickCove)', url: 'https://t.me/FlickCove_Top' },
          { text: '📲 ব্যাকআপ চ্যানেল (WhatsApp)', url: 'https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V' }
        ]
      }
    ]);
  };

  const quickPrompts = [
    '/start',
    '/ভিডিও দেখার উপায়',
    '/new video',
    '/Bickup channel',
    'ভিডিও দেখতে চাই',
    'নতুন কোনো ভিডিও আছে নাকি?'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span>বট টেস্ট সিমুলেটর (Live Interactive Tester)</span>
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              replyMode === 'ai'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
            }`}>
              {replyMode === 'ai' ? '🤖 Gemini AI Active' : '📌 Fixed Reply Active'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            টেলিগ্রাম অ্যাপ ওপেন না করেই অ্যাডমিন প্যানেল থেকে টেস্ট করুন ইউজার যেকোনো কথা বললে বট কিভাবে উত্তর দেয়।
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>চ্যাট ক্লিয়ার করুন</span>
        </button>
      </div>

      {/* Main Chat Box Container */}
      <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[540px]">
        {/* Chat Window Header */}
        <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">@HalpLine_bot</div>
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>অনলাইন সিমুলেশন</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {replyMode === 'ai' ? 'Gemini 3.8 Flash' : 'Static Auto-Reply'}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-[#0b0f19] to-[#080b12]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="max-w-[82%] space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                      : 'bg-slate-800/90 text-slate-100 rounded-tl-sm border border-slate-700/60 shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Inline Buttons if returned by bot */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {msg.buttons.map((btn, bIdx) => {
                      if (btn.url) {
                        return (
                          <a
                            key={bIdx}
                            href={btn.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm transition-all"
                          >
                            <span>{btn.text}</span>
                            <ExternalLink className="w-3 h-3 text-cyan-400" />
                          </a>
                        );
                      }
                      return (
                        <button
                          key={bIdx}
                          type="button"
                          onClick={() => handleSendMessage(btn.action || btn.text)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-850 hover:from-slate-750 hover:to-slate-700 text-cyan-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-cyan-500/30 shadow-sm transition-all active:scale-[0.99]"
                        >
                          <span>{btn.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className={`text-[10px] text-slate-500 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-400 ml-1.5">বট টাইপ করছে...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-950/70 px-4 py-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-500 shrink-0 font-medium">কুইক টেস্ট:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isTyping}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] whitespace-nowrap border border-slate-800 transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="বটকে কিছু জিজ্ঞেস করুন (যেমন: নতুন ভিডিও কি আছে?)..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className={`p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white transition-all shadow-md ${
                isTyping || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:from-cyan-500 hover:to-indigo-500'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
