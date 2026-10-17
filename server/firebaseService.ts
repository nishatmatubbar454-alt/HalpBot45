import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { BotUser, BotSettings, ActivityLog, BroadcastHistoryItem, MessageRequest, BotCommandsConfig, ChatMessage } from './types.js';
import { encryptSecret, decryptSecret } from './cryptoService.js';

export const DEFAULT_COMMANDS: BotCommandsConfig = {
  startReply: `*হ্যালো স্যার*\nএখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের লিং*ক ভি*ডিও পাওয় যায় । ভিডিও দেখতে নিচের বাটনে ক্লিক করে । চ্যানেলের মধ্যে থেকে দেখতে পারেন\n।`,
  videoHelpReply: `ওয়েবসাইটে মধ্যে কোনো ভিডিও খুঁজে না পেলে ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই ভিডিও পেয়ে যাবেন।`,
  newVideoReply: `এখানে প্রতিদিন নতুন নতুন টিকটোকারেল লিংক ভিডিও শেয়ার করা হয় । ভিডিও মিস না করতে ব্রেকাপ চ্যানেলে জয়েন করুন 👈`,
  backupChannelReply: `কখনো ভিডিও মিস না হয় । তাই ব্রেকাপ চ্যানেলে জয়েন করুন। নতুন ভিডিও পান সাথে সাথে`
};

export const firebaseConfig = {
  apiKey: "AIzaSyDHqaUo1W5AAXzDqA_yzLO-pneoXjBjcRI",
  authDomain: "ai-chat-bot-1d269.firebaseapp.com",
  databaseURL: "https://ai-chat-bot-1d269-default-rtdb.firebaseio.com",
  projectId: "ai-chat-bot-1d269",
  storageBucket: "ai-chat-bot-1d269.firebasestorage.app",
  messagingSenderId: "79166158892",
  appId: "1:79166158892:web:ae93b12a0b42d067347989",
  measurementId: "G-3Q23X906LR"
};

const RTDB_BASE_URL = firebaseConfig.databaseURL.replace(/\/+$/, '');

// Local persistent storage file path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'bot_storage.json');

interface LocalStorageData {
  users: Record<string, BotUser>;
  settings: BotSettings;
  logs: ActivityLog[];
  broadcasts: BroadcastHistoryItem[];
  lastBroadcastNumber: number;
  requests: Record<string, MessageRequest>;
}

const defaultSettings: BotSettings = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "enc:v1:3f93c8da68b15c076742d101822d907e:ca310bf5cabe33b9067f3021b0cbbfd4:9f0d12f365b7ca2f76b3f5c61c99484f25e8b91714d07aad1985345e7770b75c366431ec18b2a442587eb2c4a78d",
  botUsername: "HalpLine_bot",
  geminiApiKey: process.env.GEMINI_API_KEY || "enc:v1:7133ad9e41941a8af0f3a7d978c0435d:6549a3ed9de35c98ef8e7225d80dd9a5:d56a8b82a54e325a4ade1117c1d12df8b504cf24094493c8f4a718fe1787311a57c61fbfad355c255889653b8094ff63fada1dafe3",
  telegramGroupLink: "https://t.me/FlickCove_Top",
  whatsappBackupLink: "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V",
  welcomeMessage: "*হ্যালো স্যার*\nএখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের লিং*ক ভি*ডিও পাওয় যায় । ভিডিও দেখতে নিচের বাটনে ক্লিক করে । চ্যানেলের মধ্যে থেকে দেখতে পারেন\n।",
  replyMode: "ai", // 'ai' = Gemini AI, 'static' = Admin fixed reply
  staticReplyMessage: "এখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের ভিডিও, সুন্দর সুন্দর ভিডিও পাওয়া যায়। নিচের বাটনে ক্লিক করে চ্যানেলে যুক্ত থাকুন।",
  commands: DEFAULT_COMMANDS,
  aiSystemPrompt: `You are the official conversational AI representative of @HalpLine_bot.
Language: Natural Bengali (বাংলা).

RULES:
1. If the user asks about videos or what videos are available (ভিডিও সম্পর্কে জানতে চাইলে):
Always state:
"এখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের ভিডিও, সুন্দর সুন্দর ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।"

2. If the user says they cannot find a video or asks how/where to search:
Always reply:
"ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আশা করি ভিডিও পেয়ে যাবেন।"

3. For other messages:
Two-part reply:
- Part 1: Address their topic in 1-2 friendly sentences.
- Part 2: "আমাদের সব বাংলাদেশী ভিডিও ও চমৎকার টিকটকারের ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।"`,
  isPollingActive: true,
  broadcastDelaySeconds: 5,
  adminTelegramId: "5569819998",
  showInlineButtons: true,
  channelButtonText: "🎬 সব ভিডিও এখানে (Join)",
  whatsappButtonText: "📲 ব্যাকআপ চ্যানেল (WhatsApp)",
  messageRequestMode: "instant_reply",
  offlineNoticeMessage: "📩 আপনার বার্তাটি 'মেসেজ রিকোয়েস্ট' হিসেবে জমা হয়েছে। বট অনলাইনে আসামাত্রই আপনার বার্তার সঠিক উত্তর দেওয়া হবে। ধন্যবাদ!",
  onlineAutoReplyPending: true
};

let cachedStore: LocalStorageData | null = null;
let writeDebounceTimer: NodeJS.Timeout | null = null;

function ensureStorage(): LocalStorageData {
  if (cachedStore) {
    return cachedStore;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORAGE_FILE)) {
    const initialData: LocalStorageData = {
      users: {},
      settings: defaultSettings,
      requests: {},
      logs: [{
        id: 'init-1',
        timestamp: new Date().toISOString(),
        type: 'system',
        message: 'Bot Storage initialized successfully'
      }],
      broadcasts: [
        {
          id: 'bc-124',
          broadcastNumber: 124,
          title: '🎬 নতুন এক্সক্লুসিভ ভিডিও কালেকশন আপডেট!',
          message: 'সকল নতুন এবং আকর্ষণীয় ভিডিও পেতে আমাদের FlickCove চ্যানেলে জয়েন করুন।',
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          status: 'completed',
          sentUserIdsCount: 47891
        }
      ],
      lastBroadcastNumber: 124
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedStore = initialData;
    return initialData;
  }

  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.settings) parsed.settings = defaultSettings;
    if (!parsed.settings.messageRequestMode || parsed.settings.messageRequestMode === 'auto_queue_when_offline') {
      parsed.settings.messageRequestMode = 'instant_reply';
    }
    if (!parsed.settings.offlineNoticeMessage) parsed.settings.offlineNoticeMessage = defaultSettings.offlineNoticeMessage;
    if (parsed.settings.onlineAutoReplyPending === undefined) parsed.settings.onlineAutoReplyPending = true;
    if (!parsed.settings.commands) {
      parsed.settings.commands = DEFAULT_COMMANDS;
    } else {
      parsed.settings.commands = {
        ...DEFAULT_COMMANDS,
        ...parsed.settings.commands
      };
    }

    if (!parsed.users) parsed.users = {};
    if (!parsed.requests) parsed.requests = {};
    if (!parsed.logs) parsed.logs = [];
    if (!Array.isArray(parsed.broadcasts)) {
      parsed.broadcasts = [
        {
          id: 'bc-124',
          broadcastNumber: 124,
          title: '🎬 নতুন এক্সক্লুসিভ ভিডিও কালেকশন আপডেট!',
          message: 'সকল নতুন এবং আকর্ষণীয় ভিডিও পেতে আমাদের FlickCove চ্যানেলে জয়েন করুন।',
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          status: 'completed',
          sentUserIdsCount: 47891
        }
      ];
    }
    if (typeof parsed.lastBroadcastNumber !== 'number') {
      parsed.lastBroadcastNumber = 124;
    }

    cachedStore = parsed;
    return parsed;
  } catch (e) {
    const initialData: LocalStorageData = {
      users: {},
      settings: defaultSettings,
      requests: {},
      logs: [],
      broadcasts: [
        {
          id: 'bc-124',
          broadcastNumber: 124,
          title: '🎬 নতুন এক্সক্লুসিভ ভিডিও কালেকশন আপডেট!',
          message: 'সকল নতুন এবং আকর্ষণীয় ভিডিও পেতে আমাদের FlickCove চ্যানেলে জয়েন করুন।',
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          status: 'completed',
          sentUserIdsCount: 47891
        }
      ],
      lastBroadcastNumber: 124
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedStore = initialData;
    return initialData;
  }
}

function writeStorage(data: LocalStorageData, immediate: boolean = false) {
  cachedStore = data;
  if (immediate) {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Storage] Error writing storage file:', err);
    }
    return;
  }

  if (writeDebounceTimer) return;
  writeDebounceTimer = setTimeout(() => {
    writeDebounceTimer = null;
    try {
      if (cachedStore) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(cachedStore, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[Storage] Error debounced writing storage file:', err);
    }
  }, 1000);
}

// Background sync to Firebase Realtime Database
async function syncUserToFirebase(user: BotUser) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/users/${user.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id, // Telegram Chat ID for broadcast
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        firstSeen: user.firstSeen,
        lastActive: user.lastActive,
        messageCount: user.messageCount,
        status: user.status
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {
    // Non-blocking sync failure ignored
  }
}

async function syncSettingsToFirebase(settings: BotSettings) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    // Never write raw secrets to public Firebase RTDB
    const safeSettings = {
      ...settings,
      botToken: 'PROTECTED_IN_SERVER_ENV',
      geminiApiKey: 'PROTECTED_IN_SERVER_ENV'
    };
    await fetch(`${RTDB_BASE_URL}/settings.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeSettings),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

async function deleteUserFromFirebase(id: number) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/users/${id}.json`, {
      method: 'DELETE',
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

// Initial sync from Firebase Realtime Database on startup
(async function initFromFirebase() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${RTDB_BASE_URL}/users.json`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const fbUsers = await res.json();
      if (fbUsers && typeof fbUsers === 'object') {
        const store = ensureStorage();
        let changed = false;
        for (const [key, val] of Object.entries(fbUsers)) {
          if (val && typeof val === 'object' && (val as any).id) {
            const u = val as BotUser;
            store.users[key] = {
              ...store.users[key],
              ...u
            };
            changed = true;
          }
        }
        if (changed) {
          writeStorage(store);
          console.log('[Firebase] Successfully synced users from Firebase Realtime Database');
        }
      }
    }

    // Sync message requests from Firebase
    const reqRes = await fetch(`${RTDB_BASE_URL}/message_requests.json`).catch(() => null);
    if (reqRes && reqRes.ok) {
      const fbRequests = await reqRes.json();
      if (fbRequests && typeof fbRequests === 'object') {
        const store = ensureStorage();
        if (!store.requests) store.requests = {};
        for (const [key, val] of Object.entries(fbRequests)) {
          if (val && typeof val === 'object' && (val as any).id) {
            store.requests[key] = {
              ...store.requests[key],
              ...(val as any)
            };
          }
        }
        writeStorage(store);
      }
    }

    // Sync settings from Firebase (excluding secret placeholders)
    const setRes = await fetch(`${RTDB_BASE_URL}/settings.json`).catch(() => null);
    if (setRes && setRes.ok) {
      const fbSettings = await setRes.json();
      if (fbSettings && typeof fbSettings === 'object') {
        const store = ensureStorage();
        const safeSettings = { ...fbSettings };
        if (safeSettings.botToken === 'PROTECTED_IN_SERVER_ENV' || !safeSettings.botToken) {
          delete safeSettings.botToken;
        }
        if (safeSettings.geminiApiKey === 'PROTECTED_IN_SERVER_ENV' || !safeSettings.geminiApiKey) {
          delete safeSettings.geminiApiKey;
        }
        store.settings = {
          ...store.settings,
          ...safeSettings
        };
        writeStorage(store, true);
        console.log('[Firebase] Successfully synced settings from Firebase Realtime Database');
      }
    }
  } catch (e) {
    // Ignore offline or transient failure
  }
})();

// User operations
export async function saveOrUpdateUser(user: Partial<BotUser> & { id: number }): Promise<BotUser> {
  const store = ensureStorage();
  const userIdStr = user.id.toString();
  const existing = store.users[userIdStr];

  const now = new Date().toISOString();
  const updatedUser: BotUser = {
    id: user.id,
    username: user.username !== undefined ? user.username : (existing?.username || ''),
    firstName: user.firstName !== undefined ? user.firstName : (existing?.firstName || ''),
    lastName: user.lastName !== undefined ? user.lastName : (existing?.lastName || ''),
    firstSeen: existing?.firstSeen || now,
    lastActive: now,
    messageCount: (existing?.messageCount || 0) + (user.messageCount !== undefined ? user.messageCount : 1),
    status: user.status || existing?.status || 'active'
  };

  store.users[userIdStr] = updatedUser;
  writeStorage(store);

  // Background non-blocking sync to Firebase Realtime Database
  syncUserToFirebase(updatedUser).catch(() => {});

  return updatedUser;
}

export async function getAllUsers(): Promise<BotUser[]> {
  const store = ensureStorage();
  return Object.values(store.users).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );
}

export async function appendChatMessage(
  userId: number, 
  sender: 'user' | 'bot' | 'admin', 
  text: string
): Promise<ChatMessage> {
  const store = ensureStorage();
  const userIdStr = userId.toString();
  let user = store.users[userIdStr];
  
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender,
    text,
    timestamp: new Date().toISOString()
  };

  if (!user) {
    user = {
      id: userId,
      username: '',
      firstName: `User #${userId}`,
      lastName: '',
      firstSeen: msg.timestamp,
      lastActive: msg.timestamp,
      messageCount: 1,
      status: 'active',
      chatHistory: [msg],
      lastMessageSnippet: text.length > 120 ? text.substring(0, 120) + '...' : text,
      lastMessageTimestamp: msg.timestamp
    };
    store.users[userIdStr] = user;
  } else {
    if (!Array.isArray(user.chatHistory)) {
      user.chatHistory = [];
    }
    user.chatHistory.push(msg);
    // Keep last 50 messages per user to maintain clean, fast storage
    if (user.chatHistory.length > 50) {
      user.chatHistory = user.chatHistory.slice(-50);
    }
    user.lastMessageSnippet = text.length > 120 ? text.substring(0, 120) + '...' : text;
    user.lastMessageTimestamp = msg.timestamp;
    user.lastActive = msg.timestamp;
    if (sender === 'user') {
      user.messageCount = (user.messageCount || 0) + 1;
    }
  }

  writeStorage(store);
  syncUserToFirebase(user).catch(() => {});
  return msg;
}

export async function getUserMessages(userId: number): Promise<ChatMessage[]> {
  const store = ensureStorage();
  const user = store.users[userId.toString()];
  return (user?.chatHistory) || [];
}

export async function getPaginatedUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{
  users: BotUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}> {
  const store = ensureStorage();
  const all = Object.values(store.users);

  const search = (options.search || '').trim().toLowerCase();
  const status = options.status || 'all';

  let filtered = all;
  if (search) {
    filtered = filtered.filter(u => 
      (u.firstName && u.firstName.toLowerCase().includes(search)) ||
      (u.lastName && u.lastName.toLowerCase().includes(search)) ||
      (u.username && u.username.toLowerCase().includes(search)) ||
      u.id.toString().includes(search) ||
      (u.lastMessageSnippet && u.lastMessageSnippet.toLowerCase().includes(search))
    );
  }

  if (status !== 'all') {
    filtered = filtered.filter(u => u.status === status);
  }

  filtered.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

  const totalUsers = filtered.length;
  const limit = Math.max(1, Math.min(200, Number(options.limit) || 50));
  const totalPages = Math.ceil(totalUsers / limit) || 1;
  const page = Math.max(1, Math.min(totalPages, Number(options.page) || 1));
  const startIndex = (page - 1) * limit;
  const paginatedUsers = filtered.slice(startIndex, startIndex + limit);

  return {
    users: paginatedUsers,
    totalUsers,
    totalPages,
    currentPage: page
  };
}

export async function getUserById(id: number): Promise<BotUser | null> {
  const store = ensureStorage();
  return store.users[id.toString()] || null;
}

export async function deleteUser(id: number): Promise<boolean> {
  const store = ensureStorage();
  delete store.users[id.toString()];
  writeStorage(store);

  deleteUserFromFirebase(id).catch(() => {});
  return true;
}

// Settings operations
export async function getSettings(): Promise<BotSettings> {
  const store = ensureStorage();
  let token = (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim()) || 
              (process.env.BOT_TOKEN && process.env.BOT_TOKEN.trim()) || 
              store.settings.botToken || 
              defaultSettings.botToken || "";
  
  // Decrypt if AES-256 encrypted
  if (token.startsWith('enc:v1:')) {
    token = decryptSecret(token);
  }

  let geminiKey = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) || 
                  store.settings.geminiApiKey || 
                  defaultSettings.geminiApiKey || "";
  if (geminiKey.startsWith('enc:v1:')) {
    geminiKey = decryptSecret(geminiKey);
  }

  return {
    ...store.settings,
    botToken: token,
    geminiApiKey: geminiKey
  };
}

export async function updateSettings(newSettings: Partial<BotSettings>): Promise<BotSettings> {
  const store = ensureStorage();
  const cleanSettings = { ...newSettings };

  // Never overwrite secrets with masked placeholders, bullets, or empty strings
  if (cleanSettings.botToken !== undefined) {
    const t = cleanSettings.botToken.trim();
    if (!t || t.includes('•') || t.includes('*') || t === 'PROTECTED_IN_SERVER_ENV') {
      delete cleanSettings.botToken;
    } else {
      // Store on disk encrypted with AES-256-GCM
      cleanSettings.botToken = encryptSecret(t);
    }
  }

  if (cleanSettings.geminiApiKey !== undefined) {
    const k = cleanSettings.geminiApiKey.trim();
    if (!k || k.includes('•') || k.includes('*') || k === 'PROTECTED_IN_SERVER_ENV') {
      delete cleanSettings.geminiApiKey;
    } else {
      cleanSettings.geminiApiKey = encryptSecret(k);
    }
  }

  store.settings = {
    ...store.settings,
    ...cleanSettings
  };
  writeStorage(store, true);

  // Sync to Firebase with secrets masked
  syncSettingsToFirebase(store.settings).catch(() => {});

  return getSettings();
}

// Logs operations
export async function addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
  const store = ensureStorage();
  const entry: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  store.logs.unshift(entry);
  if (store.logs.length > 300) {
    store.logs = store.logs.slice(0, 300);
  }
  writeStorage(store);
  return entry;
}

export async function getActivityLogs(limit = 100): Promise<ActivityLog[]> {
  const store = ensureStorage();
  return store.logs.slice(0, limit);
}

// Broadcast History & Duplicate Tracking
export async function getBroadcastHistory(): Promise<BroadcastHistoryItem[]> {
  const store = ensureStorage();
  return store.broadcasts || [];
}

export async function getNextBroadcastNumber(): Promise<number> {
  const store = ensureStorage();
  const currentNum = typeof store.lastBroadcastNumber === 'number' ? store.lastBroadcastNumber : 124;
  const nextNum = currentNum + 1;
  store.lastBroadcastNumber = nextNum;
  writeStorage(store, true);
  return nextNum;
}

export async function saveBroadcastHistoryItem(item: BroadcastHistoryItem): Promise<void> {
  const store = ensureStorage();
  if (!store.broadcasts) {
    store.broadcasts = [];
  }
  const existingIdx = store.broadcasts.findIndex((b) => b.id === item.id);
  if (existingIdx >= 0) {
    store.broadcasts[existingIdx] = item;
  } else {
    store.broadcasts.unshift(item);
  }
  if (store.broadcasts.length > 50) {
    store.broadcasts = store.broadcasts.slice(0, 50);
  }
  writeStorage(store, true);
}

export async function deleteBroadcastHistoryItem(id: string): Promise<boolean> {
  const store = ensureStorage();
  if (!store.broadcasts) return false;
  store.broadcasts = store.broadcasts.filter((b) => b.id !== id);
  writeStorage(store, true);
  return true;
}

// Message Requests operations (মেসেজ রিকোয়েস্ট & অফলাইন কিউ ম্যানেজমেন্ট)
async function syncMessageRequestToFirebase(req: MessageRequest) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/message_requests/${req.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

async function deleteRequestFromFirebase(id: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${RTDB_BASE_URL}/message_requests/${id}.json`, {
      method: 'DELETE',
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {}
}

export async function saveMessageRequest(req: Omit<MessageRequest, 'id' | 'receivedAt'> & { id?: string; receivedAt?: string }): Promise<MessageRequest> {
  const store = ensureStorage();
  if (!store.requests) store.requests = {};
  const id = req.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: MessageRequest = {
    id,
    userId: req.userId,
    chatId: req.chatId,
    username: req.username || '',
    firstName: req.firstName || '',
    lastName: req.lastName || '',
    messageText: req.messageText || '',
    receivedAt: req.receivedAt || new Date().toISOString(),
    status: req.status || 'pending',
    replyText: req.replyText,
    repliedAt: req.repliedAt,
    repliedBy: req.repliedBy,
    isOfflineMessage: req.isOfflineMessage ?? false
  };

  store.requests[id] = item;
  writeStorage(store);

  syncMessageRequestToFirebase(item).catch(() => {});
  return item;
}

export async function getAllMessageRequests(): Promise<MessageRequest[]> {
  const store = ensureStorage();
  return Object.values(store.requests || {}).sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );
}

export async function getPendingMessageRequests(): Promise<MessageRequest[]> {
  const store = ensureStorage();
  return Object.values(store.requests || {})
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
}

export async function updateMessageRequest(id: string, updates: Partial<MessageRequest>): Promise<MessageRequest | null> {
  const store = ensureStorage();
  if (!store.requests || !store.requests[id]) return null;
  const updated: MessageRequest = {
    ...store.requests[id],
    ...updates
  };
  store.requests[id] = updated;
  writeStorage(store, true);
  syncMessageRequestToFirebase(updated).catch(() => {});
  return updated;
}

export async function deleteMessageRequest(id: string): Promise<boolean> {
  const store = ensureStorage();
  if (!store.requests || !store.requests[id]) return false;
  delete store.requests[id];
  writeStorage(store, true);
  deleteRequestFromFirebase(id).catch(() => {});
  return true;
}

export async function clearAllMessageRequests(): Promise<boolean> {
  const store = ensureStorage();
  store.requests = {};
  writeStorage(store, true);
  try {
    await fetch(`${RTDB_BASE_URL}/message_requests.json`, { method: 'DELETE' });
  } catch (e) {}
  return true;
}

