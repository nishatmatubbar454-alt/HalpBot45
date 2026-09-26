// server.ts
import express from "express";
import path2 from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs2 from "fs";
import { execSync } from "child_process";

// server/firebaseService.ts
import fs from "fs";
import path from "path";
var DEFAULT_COMMANDS = {
  startReply: `*\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB \u09B8\u09CD\u09AF\u09BE\u09B0*
\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09A7\u09B0\u09A8\u09C7\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09B2\u09BF\u0982*\u0995 \u09AD\u09BF*\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC \u09AF\u09BE\u09AF\u09BC \u0964 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 \u0964 \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u09A5\u09C7\u0995\u09C7 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8
\u0964`,
  videoHelpReply: `\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7 \u09AE\u09A7\u09CD\u09AF\u09C7 \u0995\u09CB\u09A8\u09CB \u09AD\u09BF\u09A1\u09BF\u0993 \u0996\u09C1\u0981\u099C\u09C7 \u09A8\u09BE \u09AA\u09C7\u09B2\u09C7 \u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u0986\u099B\u09C7, \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0995\u09B0\u09B2\u09C7\u0987 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964`,
  newVideoReply: `\u098F\u0996\u09BE\u09A8\u09C7 \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09A8\u09A4\u09C1\u09A8 \u09A8\u09A4\u09C1\u09A8 \u099F\u09BF\u0995\u099F\u09CB\u0995\u09BE\u09B0\u09C7\u09B2 \u09B2\u09BF\u0982\u0995 \u09AD\u09BF\u09A1\u09BF\u0993 \u09B6\u09C7\u09AF\u09BC\u09BE\u09B0 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u0964 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AE\u09BF\u09B8 \u09A8\u09BE \u0995\u09B0\u09A4\u09C7 \u09AC\u09CD\u09B0\u09C7\u0995\u09BE\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u099C\u09AF\u09BC\u09C7\u09A8 \u0995\u09B0\u09C1\u09A8 \u{1F448}`,
  backupChannelReply: `\u0995\u0996\u09A8\u09CB \u09AD\u09BF\u09A1\u09BF\u0993 \u09AE\u09BF\u09B8 \u09A8\u09BE \u09B9\u09AF\u09BC \u0964 \u09A4\u09BE\u0987 \u09AC\u09CD\u09B0\u09C7\u0995\u09BE\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u099C\u09AF\u09BC\u09C7\u09A8 \u0995\u09B0\u09C1\u09A8\u0964 \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u09A8 \u09B8\u09BE\u09A5\u09C7 \u09B8\u09BE\u09A5\u09C7`
};
var firebaseConfig = {
  apiKey: "AIzaSyDHqaUo1W5AAXzDqA_yzLO-pneoXjBjcRI",
  authDomain: "ai-chat-bot-1d269.firebaseapp.com",
  databaseURL: "https://ai-chat-bot-1d269-default-rtdb.firebaseio.com",
  projectId: "ai-chat-bot-1d269",
  storageBucket: "ai-chat-bot-1d269.firebasestorage.app",
  messagingSenderId: "79166158892",
  appId: "1:79166158892:web:ae93b12a0b42d067347989",
  measurementId: "G-3Q23X906LR"
};
var RTDB_BASE_URL = firebaseConfig.databaseURL.replace(/\/+$/, "");
var DATA_DIR = path.resolve(process.cwd(), "data");
var STORAGE_FILE = path.join(DATA_DIR, "bot_storage.json");
var defaultSettings = {
  botToken: "8333224990:AAHxUUVXAG5InYIEa7MXSHhB_iR1C1kc8II",
  botUsername: "HalpLine_bot",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  telegramGroupLink: "https://t.me/FlickCove_Top",
  whatsappBackupLink: "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V",
  welcomeMessage: "*\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB \u09B8\u09CD\u09AF\u09BE\u09B0*\n\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09A7\u09B0\u09A8\u09C7\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09B2\u09BF\u0982*\u0995 \u09AD\u09BF*\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC \u09AF\u09BE\u09AF\u09BC \u0964 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 \u0964 \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u09A5\u09C7\u0995\u09C7 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8\n\u0964",
  replyMode: "ai",
  // 'ai' = Gemini AI, 'static' = Admin fixed reply
  staticReplyMessage: "\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09A7\u09B0\u09A8\u09C7\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993, \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09A8\u09BF\u099A\u09C7\u09B0 \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09A5\u09BE\u0995\u09C1\u09A8\u0964",
  commands: DEFAULT_COMMANDS,
  aiSystemPrompt: `You are the official conversational AI representative of @HalpLine_bot.
Language: Natural Bengali (\u09AC\u09BE\u0982\u09B2\u09BE).

RULES:
1. If the user asks about videos or what videos are available (\u09AD\u09BF\u09A1\u09BF\u0993 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u099C\u09BE\u09A8\u09A4\u09C7 \u099A\u09BE\u0987\u09B2\u09C7):
Always state:
"\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09A7\u09B0\u09A8\u09C7\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993, \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"

2. If the user says they cannot find a video or asks how/where to search:
Always reply:
"\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u0986\u099B\u09C7, \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09B6\u09BE \u0995\u09B0\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964"

3. For other messages:
Two-part reply:
- Part 1: Address their topic in 1-2 friendly sentences.
- Part 2: "\u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u0993 \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"`,
  isPollingActive: true,
  broadcastDelaySeconds: 5,
  adminTelegramId: "",
  showInlineButtons: true,
  channelButtonText: "\u{1F3AC} \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u098F\u0996\u09BE\u09A8\u09C7 (Join)",
  whatsappButtonText: "\u{1F4F2} \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2 (WhatsApp)",
  messageRequestMode: "instant_reply",
  offlineNoticeMessage: "\u{1F4E9} \u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09BE\u09B0\u09CD\u09A4\u09BE\u099F\u09BF '\u09AE\u09C7\u09B8\u09C7\u099C \u09B0\u09BF\u0995\u09CB\u09AF\u09BC\u09C7\u09B8\u09CD\u099F' \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u099C\u09AE\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09AC\u099F \u0985\u09A8\u09B2\u09BE\u0987\u09A8\u09C7 \u0986\u09B8\u09BE\u09AE\u09BE\u09A4\u09CD\u09B0\u0987 \u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09BE\u09B0\u09CD\u09A4\u09BE\u09B0 \u09B8\u09A0\u09BF\u0995 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09AC\u09C7\u0964 \u09A7\u09A8\u09CD\u09AF\u09AC\u09BE\u09A6!",
  onlineAutoReplyPending: true
};
var cachedStore = null;
var writeDebounceTimer = null;
function ensureStorage() {
  if (cachedStore) {
    return cachedStore;
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    const initialData = {
      users: {},
      settings: defaultSettings,
      requests: {},
      logs: [{
        id: "init-1",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "system",
        message: "Bot Storage initialized successfully"
      }],
      broadcasts: [
        {
          id: "bc-124",
          broadcastNumber: 124,
          title: "\u{1F3AC} \u09A8\u09A4\u09C1\u09A8 \u098F\u0995\u09CD\u09B8\u0995\u09CD\u09B2\u09C1\u09B8\u09BF\u09AD \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u09B2\u09C7\u0995\u09B6\u09A8 \u0986\u09AA\u09A1\u09C7\u099F!",
          message: "\u09B8\u0995\u09B2 \u09A8\u09A4\u09C1\u09A8 \u098F\u09AC\u0982 \u0986\u0995\u09B0\u09CD\u09B7\u09A3\u09C0\u09DF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09A4\u09C7 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 FlickCove \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u099C\u09DF\u09C7\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 864e5).toISOString(),
          completedAt: new Date(Date.now() - 864e5 + 18e5).toISOString(),
          status: "completed",
          sentUserIdsCount: 47891
        }
      ],
      lastBroadcastNumber: 124
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    cachedStore = initialData;
    return initialData;
  }
  try {
    const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.settings) parsed.settings = defaultSettings;
    if (!parsed.settings.messageRequestMode || parsed.settings.messageRequestMode === "auto_queue_when_offline") {
      parsed.settings.messageRequestMode = "instant_reply";
    }
    if (!parsed.settings.offlineNoticeMessage) parsed.settings.offlineNoticeMessage = defaultSettings.offlineNoticeMessage;
    if (parsed.settings.onlineAutoReplyPending === void 0) parsed.settings.onlineAutoReplyPending = true;
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
          id: "bc-124",
          broadcastNumber: 124,
          title: "\u{1F3AC} \u09A8\u09A4\u09C1\u09A8 \u098F\u0995\u09CD\u09B8\u0995\u09CD\u09B2\u09C1\u09B8\u09BF\u09AD \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u09B2\u09C7\u0995\u09B6\u09A8 \u0986\u09AA\u09A1\u09C7\u099F!",
          message: "\u09B8\u0995\u09B2 \u09A8\u09A4\u09C1\u09A8 \u098F\u09AC\u0982 \u0986\u0995\u09B0\u09CD\u09B7\u09A3\u09C0\u09DF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09A4\u09C7 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 FlickCove \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u099C\u09DF\u09C7\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 864e5).toISOString(),
          completedAt: new Date(Date.now() - 864e5 + 18e5).toISOString(),
          status: "completed",
          sentUserIdsCount: 47891
        }
      ];
    }
    if (typeof parsed.lastBroadcastNumber !== "number") {
      parsed.lastBroadcastNumber = 124;
    }
    for (const key of Object.keys(parsed.users)) {
      const u = parsed.users[key];
      delete u.chatHistory;
      delete u.lastMessageSnippet;
    }
    parsed.requests = {};
    cachedStore = parsed;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    return parsed;
  } catch (e) {
    const initialData = {
      users: {},
      settings: defaultSettings,
      requests: {},
      logs: [],
      broadcasts: [
        {
          id: "bc-124",
          broadcastNumber: 124,
          title: "\u{1F3AC} \u09A8\u09A4\u09C1\u09A8 \u098F\u0995\u09CD\u09B8\u0995\u09CD\u09B2\u09C1\u09B8\u09BF\u09AD \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u09B2\u09C7\u0995\u09B6\u09A8 \u0986\u09AA\u09A1\u09C7\u099F!",
          message: "\u09B8\u0995\u09B2 \u09A8\u09A4\u09C1\u09A8 \u098F\u09AC\u0982 \u0986\u0995\u09B0\u09CD\u09B7\u09A3\u09C0\u09DF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09A4\u09C7 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 FlickCove \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u099C\u09DF\u09C7\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
          totalUsers: 48520,
          sentCount: 47891,
          failedCount: 629,
          blockedCount: 510,
          percent: 100,
          startedAt: new Date(Date.now() - 864e5).toISOString(),
          completedAt: new Date(Date.now() - 864e5 + 18e5).toISOString(),
          status: "completed",
          sentUserIdsCount: 47891
        }
      ],
      lastBroadcastNumber: 124
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    cachedStore = initialData;
    return initialData;
  }
}
function writeStorage(data, immediate = false) {
  cachedStore = data;
  if (immediate) {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[Storage] Error writing storage file:", err);
    }
    return;
  }
  if (writeDebounceTimer) return;
  writeDebounceTimer = setTimeout(() => {
    writeDebounceTimer = null;
    try {
      if (cachedStore) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(cachedStore, null, 2), "utf-8");
      }
    } catch (err) {
      console.error("[Storage] Error debounced writing storage file:", err);
    }
  }, 1e3);
}
async function syncUserToFirebase(user) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3e3);
    await fetch(`${RTDB_BASE_URL}/users/${user.id}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        // Telegram Chat ID for broadcast
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        firstSeen: user.firstSeen,
        lastActive: user.lastActive,
        messageCount: user.messageCount,
        status: user.status
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {
  }
}
async function syncSettingsToFirebase(settings) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3e3);
    await fetch(`${RTDB_BASE_URL}/settings.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {
  }
}
async function deleteUserFromFirebase(id) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3e3);
    await fetch(`${RTDB_BASE_URL}/users/${id}.json`, {
      method: "DELETE",
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {
  }
}
(async function initFromFirebase() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4e3);
    const res = await fetch(`${RTDB_BASE_URL}/users.json`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const fbUsers = await res.json();
      if (fbUsers && typeof fbUsers === "object") {
        const store = ensureStorage();
        let changed = false;
        for (const [key, val] of Object.entries(fbUsers)) {
          if (val && typeof val === "object" && val.id) {
            const u = val;
            store.users[key] = {
              ...store.users[key],
              ...u
            };
            changed = true;
          }
        }
        if (changed) {
          writeStorage(store);
          console.log("[Firebase] Successfully synced users from Firebase Realtime Database");
        }
      }
    }
    const reqRes = await fetch(`${RTDB_BASE_URL}/message_requests.json`).catch(() => null);
    if (reqRes && reqRes.ok) {
      const fbRequests = await reqRes.json();
      if (fbRequests && typeof fbRequests === "object") {
        const store = ensureStorage();
        if (!store.requests) store.requests = {};
        for (const [key, val] of Object.entries(fbRequests)) {
          if (val && typeof val === "object" && val.id) {
            store.requests[key] = {
              ...store.requests[key],
              ...val
            };
          }
        }
        writeStorage(store);
      }
    }
  } catch (e) {
  }
})();
async function saveOrUpdateUser(user) {
  const store = ensureStorage();
  const userIdStr = user.id.toString();
  const existing = store.users[userIdStr];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updatedUser = {
    id: user.id,
    username: user.username !== void 0 ? user.username : existing?.username || "",
    firstName: user.firstName !== void 0 ? user.firstName : existing?.firstName || "",
    lastName: user.lastName !== void 0 ? user.lastName : existing?.lastName || "",
    firstSeen: existing?.firstSeen || now,
    lastActive: now,
    messageCount: (existing?.messageCount || 0) + (user.messageCount !== void 0 ? user.messageCount : 1),
    status: user.status || existing?.status || "active"
  };
  store.users[userIdStr] = updatedUser;
  writeStorage(store);
  syncUserToFirebase(updatedUser).catch(() => {
  });
  return updatedUser;
}
async function getAllUsers() {
  const store = ensureStorage();
  return Object.values(store.users).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );
}
async function deleteUser(id) {
  const store = ensureStorage();
  delete store.users[id.toString()];
  writeStorage(store);
  deleteUserFromFirebase(id).catch(() => {
  });
  return true;
}
async function getSettings() {
  const store = ensureStorage();
  return store.settings;
}
async function updateSettings(newSettings) {
  const store = ensureStorage();
  store.settings = {
    ...store.settings,
    ...newSettings
  };
  writeStorage(store, true);
  syncSettingsToFirebase(store.settings).catch(() => {
  });
  return store.settings;
}
async function addActivityLog(log) {
  const store = ensureStorage();
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...log
  };
  store.logs.unshift(entry);
  if (store.logs.length > 300) {
    store.logs = store.logs.slice(0, 300);
  }
  writeStorage(store);
  return entry;
}
async function getActivityLogs(limit = 100) {
  const store = ensureStorage();
  return store.logs.slice(0, limit);
}
async function getBroadcastHistory() {
  const store = ensureStorage();
  return store.broadcasts || [];
}
async function getNextBroadcastNumber() {
  const store = ensureStorage();
  const currentNum = typeof store.lastBroadcastNumber === "number" ? store.lastBroadcastNumber : 124;
  const nextNum = currentNum + 1;
  store.lastBroadcastNumber = nextNum;
  writeStorage(store, true);
  return nextNum;
}
async function saveBroadcastHistoryItem(item) {
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
async function deleteBroadcastHistoryItem(id) {
  const store = ensureStorage();
  if (!store.broadcasts) return false;
  store.broadcasts = store.broadcasts.filter((b) => b.id !== id);
  writeStorage(store, true);
  return true;
}

// server/geminiService.ts
import { GoogleGenAI } from "@google/genai";
var modelCooldowns = /* @__PURE__ */ new Map();
function isModelCoolingDown(modelName) {
  const until = modelCooldowns.get(modelName);
  if (!until) return false;
  if (Date.now() < until) return true;
  modelCooldowns.delete(modelName);
  return false;
}
function setModelCooldown(modelName, durationMs = 18e4) {
  modelCooldowns.set(modelName, Date.now() + durationMs);
}
function getSmartFallback(userMessage) {
  const lower = (userMessage || "").toLowerCase();
  if (lower.includes("\u0996\u09C1\u0981\u099C\u09C7 \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE") || lower.includes("\u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE") || lower.includes("\u0996\u09C1\u099C\u09C7 \u09AA\u09BE\u0987 \u09A8\u09BE") || lower.includes("\u0996\u09C1\u0981\u099C\u09AC") || lower.includes("\u09B8\u09BE\u09B0\u09CD\u099A") || lower.includes("\u0995\u09CB\u09A5\u09BE\u09DF \u09AA\u09BE\u09AC") || lower.includes("\u0995\u09CB\u09A5\u09BE\u09AF\u09BC \u09AA\u09BE\u09AC")) {
    return "\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u0986\u099B\u09C7, \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09B6\u09BE \u0995\u09B0\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964";
  }
  if (lower.includes("\u09AD\u09BF\u09A1\u09BF\u0993") || lower.includes("\u09AE\u09C1\u09AD\u09BF") || lower.includes("video") || lower.includes("movie") || lower.includes("\u099F\u09BF\u0995\u099F\u0995") || lower.includes("tiktok") || lower.includes("\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6") || lower.includes("bangla") || lower.includes("\u09B2\u09BF\u0982\u0995") || lower.includes("\u09A8\u09A4\u09C1\u09A8") || lower.includes("\u0995\u09C0 \u0986\u099B\u09C7") || lower.includes("\u0995\u09BF \u0986\u099B\u09C7") || lower.includes("\u0995\u09C0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF") || lower.includes("\u0995\u09BF \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF") || lower.includes("\u0995\u09C0 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC") || lower.includes("\u0995\u09BF \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC")) {
    return "\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09A7\u09B0\u09A8\u09C7\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993, \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09DF\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964";
  }
  if (lower.includes("\u0995\u09C7\u09AE\u09A8") || lower.includes("\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB") || lower.includes("hello") || lower.includes("hi") || lower.includes("\u09B8\u09BE\u09B2\u09BE\u09AE")) {
    return "\u0986\u09B6\u09BE \u0995\u09B0\u09BF \u0986\u09AA\u09A8\u09BF \u09AD\u09BE\u09B2\u09CB \u0986\u099B\u09C7\u09A8! \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09A8\u09A4\u09C1\u09A8 \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09CB\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09DF\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964";
  }
  return "\u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09BE\u09B0\u09CD\u09A4\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u09A7\u09A8\u09CD\u09AF\u09AC\u09BE\u09A6! \u09AC\u09BF\u09A8\u09CB\u09A6\u09A8\u09C7\u09B0 \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09DF\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964";
}
async function generateAiReply(userMessage, userFirstName, chatHistory) {
  const lower = (userMessage || "").trim().toLowerCase();
  if (lower.includes("\u0996\u09C1\u0981\u099C\u09C7 \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE") || lower.includes("\u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE") || lower.includes("\u0996\u09C1\u099C\u09C7 \u09AA\u09BE\u0987 \u09A8\u09BE") || lower.includes("\u0996\u09C1\u0981\u099C\u09AC") || lower.includes("\u0995\u09BF\u09AD\u09BE\u09AC\u09C7 \u0996\u09C1\u0981\u099C\u09AC") || lower.includes("\u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u0996\u09C1\u0981\u099C\u09AC") || lower.includes("\u09B8\u09BE\u09B0\u09CD\u099A") || lower.includes("\u0995\u09CB\u09A5\u09BE\u09DF \u09AA\u09BE\u09AC") || lower.includes("\u0995\u09CB\u09A5\u09BE\u09AF\u09BC \u09AA\u09BE\u09AC") || lower.includes("\u09B2\u09BF\u0982\u0995 \u0995\u09CB\u09A5\u09BE\u09DF") || lower.includes("\u09B2\u09BF\u0982\u0995 \u0995\u09CB\u09A5\u09BE\u09AF\u09BC")) {
    return "\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u0986\u099B\u09C7, \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09B6\u09BE \u0995\u09B0\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964";
  }
  const settings = await getSettings();
  const apiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;
  if (!apiKey) {
    return getSmartFallback(userMessage);
  }
  const systemInstruction = `You are the official conversational AI representative of @HalpLine_bot.
Language: Natural Bengali (\u09AC\u09BE\u0982\u09B2\u09BE).

RULES FOR EVERY RESPONSE:

CASE 1: If the user says they CANNOT find a video or asks how/where to search for a video (\u09AF\u09C7\u09AE\u09A8: \u09AD\u09BF\u09A1\u09BF\u0993 \u0996\u09C1\u0981\u099C\u09C7 \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE, \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u0996\u09C1\u0981\u099C\u09AC, \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE):
Always reply:
"\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u0986\u099B\u09C7, \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09B6\u09BE \u0995\u09B0\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964"

CASE 2: If the user asks about videos or what kind of videos are available (\u09AF\u09C7\u09AE\u09A8: \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u099A\u09BE\u0987, \u0995\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u0986\u099B\u09C7, \u099F\u09BF\u0995\u099F\u0995 \u0986\u099B\u09C7 \u0995\u09BF\u09A8\u09BE, \u09AE\u09C1\u09AD\u09BF \u0986\u099B\u09C7 \u0995\u09BF\u09A8\u09BE, \u0987\u09A4\u09CD\u09AF\u09BE\u09A6\u09BF):
Always reply:
"\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09A7\u09B0\u09A8\u09C7\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993, \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"

CASE 3: For ALL other user messages (general questions, greetings, chit-chat, etc.):
You MUST compose your reply in TWO CLEAR PARTS:
- Part 1 (\u09AA\u09CD\u09B0\u09A5\u09AE \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09E7\u09E6\u09E6 \u0985\u0995\u09CD\u09B7\u09B0): \u0987\u0989\u099C\u09BE\u09B0 \u09AF\u09C7 \u09AC\u09BF\u09B7\u09AF\u09BC\u09C7 \u099C\u09BE\u09A8\u09A4\u09C7 \u099A\u09C7\u09AF\u09BC\u09C7\u099B\u09C7 \u09AC\u09BE \u0995\u09A5\u09BE \u09AC\u09B2\u09C7\u099B\u09C7, \u09B8\u09C7 \u09AC\u09BF\u09B7\u09AF\u09BC\u09C7 \u0986\u09A8\u09CD\u09A4\u09B0\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09AA\u09CD\u09B0\u09BE\u09B8\u0999\u09CD\u0997\u09BF\u0995 \u09E7-\u09E8 \u09AC\u09BE\u0995\u09CD\u09AF\u09C7 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09BF\u09A8\u0964
- Part 2 (\u09AA\u09B0\u09C7\u09B0 \u0985\u0982\u09B6): \u098F\u09B0\u09AA\u09B0 \u09B8\u09CD\u09AA\u09B7\u09CD\u099F\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09C1\u09A8:
"\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u0993 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"

IMPORTANT: DO NOT include raw http/https links or URLs in your text. The buttons below already provide direct links.

EXAMPLES OF DESIRED REPLIES:

Example 1:
User: "\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u099A\u09BE\u0987" \u09AC\u09BE "\u0995\u09C0 \u0995\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF?"
Assistant: "\u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09A7\u09B0\u09A8\u09C7\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993, \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"

Example 2:
User: "\u0986\u099C\u0995\u09C7 \u0996\u09C1\u09AC \u0997\u09B0\u09AE \u09AA\u09DC\u099B\u09C7 \u09AD\u09BE\u0987"
Assistant: "\u09B8\u09A4\u09CD\u09AF\u09BF\u0987, \u0986\u099C \u09AA\u09CD\u09B0\u099A\u09A3\u09CD\u09A1 \u0997\u09B0\u09AE \u09AA\u09DC\u09C7\u099B\u09C7! \u098F\u09AE\u09A8 \u0986\u09AC\u09B9\u09BE\u0993\u09DF\u09BE\u09DF \u09B8\u09BE\u09AC\u09A7\u09BE\u09A8\u09C7 \u09A5\u09BE\u0995\u09AC\u09C7\u09A8 \u098F\u09AC\u0982 \u09AA\u09CD\u09B0\u099A\u09C1\u09B0 \u09AA\u09BE\u09A8\u09BF \u0996\u09BE\u09AC\u09C7\u09A8\u0964 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09B8\u09AC \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C0 \u09AD\u09BF\u09A1\u09BF\u0993 \u0993 \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u099F\u09BF\u0995\u099F\u0995\u09BE\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7\u09B0 \u099F\u09C7\u09B2\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09AC\u09BE WhatsApp \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2\u09C7 \u09AF\u09BE\u09A8\u0964 \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09E7 \u09AC\u09BE \u09E8\u099F\u09BF \u0993\u09DF\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B2\u09BF\u0982\u0995 \u09AA\u09BE\u09AC\u09C7\u09A8, \u0993\u0987 \u09B2\u09BF\u0982\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09B2\u09C7\u0987 \u09B8\u09AC \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"

Example 3:
User: "\u09AD\u09BF\u09A1\u09BF\u0993 \u0996\u09C1\u0981\u099C\u09C7 \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE \u09AD\u09BE\u0987"
Assistant: "\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u0986\u099B\u09C7, \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09B6\u09BE \u0995\u09B0\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964"`;
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const contents = [];
    if (chatHistory && chatHistory.length > 0) {
      const recent = chatHistory.slice(-4);
      for (const msg of recent) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{
        text: userMessage
      }]
    });
    const modelCandidates = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let reply = "";
    for (const modelName of modelCandidates) {
      if (isModelCoolingDown(modelName)) {
        continue;
      }
      try {
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("AI generation timeout")), 3500)
        );
        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 160
          }
        });
        const response = await Promise.race([generatePromise, timeoutPromise]);
        reply = response.text?.trim() || "";
        if (reply) break;
      } catch (err) {
        const errMsg = err?.message || String(err);
        const isQuota = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded");
        if (isQuota) {
          setModelCooldown(modelName, 18e4);
        }
      }
    }
    if (!reply) {
      return getSmartFallback(userMessage);
    }
    reply = reply.replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
    if (reply.length > 350) {
      const trimmed = reply.substring(0, 350);
      const lastPunc = Math.max(
        trimmed.lastIndexOf("\u0964"),
        trimmed.lastIndexOf("!"),
        trimmed.lastIndexOf("?"),
        trimmed.lastIndexOf(".")
      );
      if (lastPunc > 150) {
        reply = trimmed.substring(0, lastPunc + 1);
      } else {
        reply = trimmed.trim();
      }
    }
    return reply || getSmartFallback(userMessage);
  } catch (error) {
    return getSmartFallback(userMessage);
  }
}

// server/botEngine.ts
function detectBotCommand(rawText) {
  const t = (rawText || "").trim();
  if (!t) return null;
  if (t.startsWith("/start")) {
    return "start";
  }
  const clean = t.toLowerCase().replace(/^\//, "").replace(/[_,:\-]/g, " ").replace(/\s+/g, " ").trim();
  if (clean === "\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0 \u0989\u09AA\u09BE\u09AF\u09BC" || clean === "\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0 \u0989\u09AA\u09BE\u09DF" || clean === "video dekhar upay" || clean === "videodekharupay" || clean === "video help" || clean === "how to watch" || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0 \u0989\u09AA\u09BE\u09AF\u09BC") || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0 \u0989\u09AA\u09BE\u09DF") || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BF\u09AD\u09BE\u09AC\u09C7 \u09A6\u09C7\u0996\u09AC") || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09A6\u09C7\u0996\u09AC") || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u099B\u09BF \u09A8\u09BE") || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u0996\u09C1\u0981\u099C\u09C7 \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE") || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u0996\u09C1\u099C\u09C7 \u09AA\u09BE\u099A\u09CD\u099B\u09BF\u09A8\u09BE") || clean.includes("\u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u099A\u09CD\u099B\u09BF \u09A8\u09BE") || clean.startsWith("\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0")) {
    return "video_help";
  }
  if (clean === "new video" || clean === "new videos" || clean === "newvideo" || clean === "\u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993" || clean.startsWith("new video") || clean.includes("new video") || clean.includes("\u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993") || clean.includes("\u09A8\u09A4\u09C1\u09A8 \u099F\u09BF\u0995\u099F\u0995") || clean.includes("\u0986\u099C\u0995\u09C7\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993")) {
    return "new_video";
  }
  if (clean === "bickup channel" || clean === "backup channel" || clean === "bickup" || clean === "backup" || clean === "\u09AC\u09CD\u09B0\u09C7\u0995\u09BE\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2" || clean === "\u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2" || clean === "\u09AC\u09CD\u09B0\u09C7\u0995\u0986\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2" || clean.startsWith("bickup") || clean.startsWith("backup") || clean.includes("bickup") || clean.includes("backup") || clean.includes("\u09AC\u09CD\u09B0\u09C7\u0995\u09BE\u09AA") || clean.includes("\u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA") || clean.includes("\u09AC\u09CD\u09B0\u09C7\u0995\u0986\u09AA")) {
    return "backup_channel";
  }
  return null;
}
var TelegramBotEngine = class {
  constructor() {
    this.isRunning = false;
    this.pollOffset = 0;
    this.abortController = null;
    this.botInfo = null;
    this.lastError = null;
    this.activePollingPromise = null;
    this.lastPollSuccess = Date.now();
    this.watchdogInterval = null;
  }
  async getStatus() {
    let webhookInfo = null;
    try {
      const whRes = await this.getWebhookInfo();
      if (whRes.ok) {
        webhookInfo = whRes.result;
      }
    } catch {
    }
    return {
      isRunning: this.isRunning,
      botInfo: this.botInfo,
      lastError: this.lastError,
      pollOffset: this.pollOffset,
      lastPollSuccess: this.lastPollSuccess,
      uptimeSeconds: Math.floor(process.uptime()),
      webhook: webhookInfo
    };
  }
  async getWebhookInfo() {
    const settings = await getSettings();
    if (!settings.botToken) return { ok: false, error: "Bot token missing" };
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/getWebhookInfo`);
      const data = await res.json();
      return data;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  async setWebhook(url) {
    const settings = await getSettings();
    if (!settings.botToken) return { ok: false, error: "Bot token missing" };
    if (this.isRunning) {
      this.isRunning = false;
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/setWebhook?url=${encodeURIComponent(url)}&drop_pending_updates=false`);
      const data = await res.json();
      if (data.ok) {
        await addActivityLog({
          type: "system",
          message: `Telegram Webhook 24/7 activated: ${url}`
        }).catch(() => {
        });
      }
      return data;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  async deleteWebhook() {
    const settings = await getSettings();
    if (!settings.botToken) return { ok: false, error: "Bot token missing" };
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/deleteWebhook?drop_pending_updates=false`);
      const data = await res.json();
      if (data.ok) {
        await addActivityLog({
          type: "system",
          message: "Telegram Webhook removed. Polling mode restored."
        }).catch(() => {
        });
      }
      return data;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  async processWebhookUpdate(update) {
    if (!update || typeof update !== "object") return;
    this.lastPollSuccess = Date.now();
    try {
      await this.handleUpdate(update);
    } catch (err) {
      console.error("[BotEngine Webhook] Error handling webhook update:", err?.message || err);
    }
  }
  async verifyToken(token) {
    const settings = await getSettings();
    const botToken = token || settings.botToken;
    if (!botToken) {
      return { ok: false, error: "Bot token is missing" };
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        this.botInfo = data.result;
        this.lastError = null;
        return { ok: true, result: data.result };
      } else {
        const desc = data.description || "Telegram API rejected token";
        this.lastError = desc;
        return { ok: false, error: desc };
      }
    } catch (e) {
      this.lastError = e.message;
      return { ok: false, error: e.message };
    }
  }
  async start() {
    if (this.isRunning) {
      return { success: true, message: "Bot polling is already running" };
    }
    const test = await this.verifyToken();
    if (!test.ok) {
      return { success: false, message: `Cannot start bot: ${test.error}` };
    }
    const settings = await getSettings();
    try {
      await fetch(`https://api.telegram.org/bot${settings.botToken}/deleteWebhook?drop_pending_updates=false`);
    } catch (e) {
    }
    this.isRunning = true;
    this.abortController = new AbortController();
    this.lastPollSuccess = Date.now();
    this.registerTelegramCommands(settings.botToken).catch(() => {
    });
    this.pollLoop();
    if (!this.watchdogInterval) {
      this.watchdogInterval = setInterval(() => this.runWatchdog(), 2e4);
    }
    await addActivityLog({
      type: "system",
      message: `Telegram Bot @${this.botInfo?.username || "HalpLine_bot"} started 24/7 polling.`
    });
    return { success: true, message: `Bot @${this.botInfo?.username} is active and polling updates 24/7!` };
  }
  async stop() {
    if (!this.isRunning) {
      return { success: true, message: "Bot is not running" };
    }
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
    await addActivityLog({
      type: "system",
      message: "Telegram Bot polling stopped by admin."
    });
    return { success: true, message: "Bot polling has been stopped" };
  }
  async pollLoop() {
    console.log("[BotEngine] 24/7 polling loop active...");
    while (this.isRunning) {
      try {
        const settings = await getSettings();
        if (!settings.botToken) {
          await new Promise((r) => setTimeout(r, 5e3));
          continue;
        }
        const url = `https://api.telegram.org/bot${settings.botToken}/getUpdates?offset=${this.pollOffset}&timeout=8&limit=100`;
        const reqController = new AbortController();
        const timeoutHandle = setTimeout(() => reqController.abort(), 15e3);
        let res;
        try {
          res = await fetch(url, { signal: reqController.signal });
        } finally {
          clearTimeout(timeoutHandle);
        }
        this.lastPollSuccess = Date.now();
        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 409) {
            await fetch(`https://api.telegram.org/bot${settings.botToken}/deleteWebhook?drop_pending_updates=false`).catch(() => {
            });
            await new Promise((r) => setTimeout(r, 3e3));
          } else {
            console.warn("[BotEngine] Telegram poll status:", res.status, errText);
            await new Promise((r) => setTimeout(r, 2e3));
          }
          continue;
        }
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.pollOffset = update.update_id + 1;
            this.handleUpdate(update).catch((updateErr) => {
              console.error("[BotEngine] Error processing update:", updateErr?.message || updateErr);
            });
          }
        }
      } catch (err) {
        if (!this.isRunning) break;
        if (err.name !== "AbortError") {
          console.error("[BotEngine] Polling network warning:", err.message);
        }
        await new Promise((r) => setTimeout(r, 1e3));
      }
    }
    console.log("[BotEngine] Polling loop finished.");
  }
  async runWatchdog() {
    try {
      const settings = await getSettings().catch(() => null);
      if (!settings || !settings.botToken) return;
      if (settings.isPollingActive && !this.isRunning) {
        console.log("[BotEngine Watchdog] Bot is marked active but stopped. Auto-restarting 24/7 polling...");
        await this.start();
        return;
      }
      if (this.isRunning && Date.now() - this.lastPollSuccess > 45e3) {
        console.warn("[BotEngine Watchdog] Polling stalled (>45s). Reviving connection...");
        this.lastPollSuccess = Date.now();
        if (this.abortController) {
          try {
            this.abortController.abort();
          } catch (e) {
          }
        }
        this.abortController = new AbortController();
        this.pollLoop();
      }
    } catch (e) {
      console.warn("[BotEngine Watchdog] Error:", e.message);
    }
  }
  buildReplyMarkup(settings) {
    const inlineKeyboard = [];
    if (settings.showInlineButtons) {
      inlineKeyboard.push([
        {
          text: settings.channelButtonText || "\u{1F3AC} \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09C1\u09A8 (FlickCove)",
          url: settings.telegramGroupLink || "https://t.me/FlickCove_Top"
        }
      ]);
      inlineKeyboard.push([
        {
          text: settings.whatsappButtonText || "\u{1F4F2} \u09AC\u09CD\u09B0\u09C7\u0995\u09BE\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2 (WhatsApp)",
          url: settings.whatsappBackupLink || "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V"
        }
      ]);
    }
    return inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : void 0;
  }
  async registerTelegramCommands(token) {
    const settings = await getSettings();
    const botToken = token || settings.botToken;
    if (!botToken) return { ok: false, description: "Bot token missing" };
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: [
            { command: "start", description: "\u{1F3E0} \u09AC\u099F \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09C1\u09A8 \u0993 \u09AD\u09BF\u09A1\u09BF\u0993 \u09B2\u09BF\u0982\u0995" },
            { command: "new_video", description: "\u{1F525} \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8\u09C7\u09B0 \u09A8\u09A4\u09C1\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 (/new video)" },
            { command: "video_help", description: "\u{1F50D} \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0 \u0993 \u0996\u09CB\u0981\u099C\u09BE\u09B0 \u0989\u09AA\u09BE\u09DF" },
            { command: "backup_channel", description: "\u{1F4F2} \u09AC\u09CD\u09B0\u09C7\u0995\u09BE\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2 (/Bickup channel)" }
          ]
        })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { ok: false, description: e.message };
    }
  }
  async handleUpdate(update) {
    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }
  async handleCallbackQuery(cb) {
    try {
      await this.answerCallbackQuery(cb.id);
      const chatId = cb.message?.chat.id || cb.from.id;
      const data = cb.data || "";
      const settings = await getSettings();
      const replyMarkup = this.buildReplyMarkup(settings);
      let replyText = "";
      let cmdName = "";
      if (data === "cmd_video_help") {
        replyText = settings.commands?.videoHelpReply || DEFAULT_COMMANDS.videoHelpReply;
        cmdName = "/\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0 \u0989\u09AA\u09BE\u09AF\u09BC";
      } else if (data === "cmd_new_video") {
        replyText = settings.commands?.newVideoReply || DEFAULT_COMMANDS.newVideoReply;
        cmdName = "/new video";
      } else if (data === "cmd_backup_channel") {
        replyText = settings.commands?.backupChannelReply || DEFAULT_COMMANDS.backupChannelReply;
        cmdName = "/Bickup channel";
      } else if (data === "cmd_start") {
        replyText = settings.commands?.startReply || DEFAULT_COMMANDS.startReply;
        cmdName = "/start";
      }
      if (replyText) {
        await this.sendMessage({
          chat_id: chatId,
          text: replyText,
          reply_markup: replyMarkup
        });
        addActivityLog({
          type: "outgoing_msg",
          userId: cb.from.id,
          message: `Bot command answered: ${cmdName} (via Button click)`
        }).catch(() => {
        });
      }
    } catch (err) {
      console.error("[BotEngine] Error handling callback query:", err?.message || err);
    }
  }
  async answerCallbackQuery(callbackQueryId, text) {
    const settings = await getSettings();
    try {
      await fetch(`https://api.telegram.org/bot${settings.botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || ""
        })
      });
    } catch (e) {
    }
  }
  async handleMessage(msg) {
    if (!msg.from || msg.from.is_bot) return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = (msg.text || "").trim();
    try {
      this.sendChatAction(chatId, "typing").catch(() => {
      });
      saveOrUpdateUser({
        id: userId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        status: "active"
      }).catch(() => {
      });
      const settings = await getSettings();
      const replyMarkup = this.buildReplyMarkup(settings);
      const detectedCmd = detectBotCommand(text);
      if (detectedCmd) {
        let replyContent2 = "";
        let cmdLog = "";
        if (detectedCmd === "start") {
          replyContent2 = settings.commands?.startReply || DEFAULT_COMMANDS.startReply;
          cmdLog = "/start";
        } else if (detectedCmd === "video_help") {
          replyContent2 = settings.commands?.videoHelpReply || DEFAULT_COMMANDS.videoHelpReply;
          cmdLog = "/\u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09BE\u09B0 \u0989\u09AA\u09BE\u09AF\u09BC";
        } else if (detectedCmd === "new_video") {
          replyContent2 = settings.commands?.newVideoReply || DEFAULT_COMMANDS.newVideoReply;
          cmdLog = "/new video";
        } else if (detectedCmd === "backup_channel") {
          replyContent2 = settings.commands?.backupChannelReply || DEFAULT_COMMANDS.backupChannelReply;
          cmdLog = "/Bickup channel";
        }
        const sendRes2 = await this.sendMessage({
          chat_id: chatId,
          text: replyContent2,
          reply_markup: replyMarkup
        });
        if (sendRes2.ok) {
          addActivityLog({
            type: "outgoing_msg",
            userId,
            message: `Command reply sent: ${cmdLog}`
          }).catch(() => {
          });
        }
        return;
      }
      let replyContent = "";
      if (settings.replyMode === "static") {
        replyContent = settings.staticReplyMessage || `\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0987\u099E\u09CD\u099C\u09BF\u09A8 \u0986\u099B\u09C7, \u09B8\u09C7\u0996\u09BE\u09A8\u09C7 \u09B8\u09BE\u09B0\u09CD\u099A \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09B6\u09BE \u0995\u09B0\u09BF \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09C7\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964 \u09A8\u09BF\u099A\u09C7\u09B0 \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09A5\u09BE\u0995\u09C1\u09A8\u0964`;
      } else {
        replyContent = await generateAiReply(text, msg.from.first_name);
      }
      const sendRes = await this.sendMessage({
        chat_id: chatId,
        text: replyContent,
        reply_markup: replyMarkup
      });
      if (sendRes.ok) {
        addActivityLog({
          type: settings.replyMode === "ai" ? "ai_generation" : "outgoing_msg",
          userId,
          message: settings.replyMode === "ai" ? "AI response sent" : "Static reply sent"
        }).catch(() => {
        });
      }
    } catch (msgErr) {
      console.error(`[BotEngine] Error handling message from user ${userId}:`, msgErr?.message || msgErr);
    }
  }
  async processPendingMessageRequests() {
    return { processed: 0, errors: 0 };
  }
  async sendChatAction(chatId, action) {
    const settings = await getSettings();
    try {
      await fetch(`https://api.telegram.org/bot${settings.botToken}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action })
      });
    } catch (e) {
    }
  }
  async sendMessage(params) {
    const settings = await getSettings();
    const token = settings.botToken;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: params.chat_id,
          text: params.text,
          parse_mode: params.parse_mode,
          reply_markup: params.reply_markup,
          disable_web_page_preview: params.disable_web_page_preview ?? false
        })
      });
      const data = await res.json();
      if (data.ok) {
        return { ok: true, result: data.result };
      } else {
        const desc = data.description || "";
        const isBlocked = desc.includes("bot was blocked by the user") || desc.includes("user is deactivated") || desc.includes("chat not found");
        if (isBlocked) {
          const numericId = typeof params.chat_id === "number" ? params.chat_id : parseInt(String(params.chat_id), 10);
          if (!isNaN(numericId)) {
            saveOrUpdateUser({ id: numericId, status: "blocked_bot" }).catch(() => {
            });
          }
          return {
            ok: false,
            error: desc,
            isBlocked: true
          };
        }
        if (params.parse_mode) {
          try {
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: params.chat_id,
                text: params.text,
                reply_markup: params.reply_markup,
                disable_web_page_preview: params.disable_web_page_preview ?? false
              })
            });
            const retryData = await retryRes.json();
            if (retryData.ok) {
              return { ok: true, result: retryData.result };
            }
          } catch (retryErr) {
          }
        }
        if (params.reply_markup) {
          try {
            const finalRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: params.chat_id,
                text: params.text,
                disable_web_page_preview: false
              })
            });
            const finalData = await finalRes.json();
            if (finalData.ok) {
              return { ok: true, result: finalData.result };
            }
          } catch (finalErr) {
          }
        }
        const retryAfter = data.parameters?.retry_after;
        return {
          ok: false,
          error: data.description || "Unknown Telegram error",
          retryAfter
        };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  async sendPhoto(params) {
    const settings = await getSettings();
    const token = settings.botToken;
    try {
      let res;
      const isBase64 = params.photo.startsWith("data:image/") || !params.photo.startsWith("http") && params.photo.length > 200;
      if (isBase64) {
        const formData = new FormData();
        formData.append("chat_id", String(params.chat_id));
        if (params.caption) formData.append("caption", params.caption);
        if (params.parse_mode) formData.append("parse_mode", params.parse_mode);
        if (params.reply_markup) formData.append("reply_markup", JSON.stringify(params.reply_markup));
        let mimeType = "image/jpeg";
        let base64Content = params.photo;
        const match = params.photo.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          mimeType = `image/${match[1]}`;
          base64Content = match[2];
        } else if (params.photo.includes(",")) {
          base64Content = params.photo.split(",")[1];
        }
        const buffer = Buffer.from(base64Content, "base64");
        const ext = mimeType.split("/")[1] || "jpg";
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("photo", blob, `gallery_photo.${ext}`);
        res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          body: formData
        });
      } else {
        res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: params.chat_id,
            photo: params.photo,
            caption: params.caption,
            parse_mode: params.parse_mode,
            reply_markup: params.reply_markup
          })
        });
      }
      const data = await res.json();
      if (data.ok) {
        const photoArr = data.result?.photo;
        const fileId = Array.isArray(photoArr) && photoArr.length > 0 ? photoArr[photoArr.length - 1].file_id : void 0;
        return { ok: true, result: data.result, fileId };
      } else {
        const desc = data.description || "";
        const isBlocked = desc.includes("bot was blocked by the user") || desc.includes("user is deactivated") || desc.includes("chat not found");
        if (isBlocked) {
          const numericId = typeof params.chat_id === "number" ? params.chat_id : parseInt(String(params.chat_id), 10);
          if (!isNaN(numericId)) {
            saveOrUpdateUser({ id: numericId, status: "blocked_bot" }).catch(() => {
            });
          }
          return {
            ok: false,
            error: desc,
            isBlocked: true
          };
        }
        if (params.parse_mode) {
          try {
            return await this.sendPhoto({
              ...params,
              parse_mode: void 0
            });
          } catch (retryErr) {
          }
        }
        const retryAfter = data.parameters?.retry_after;
        return {
          ok: false,
          error: data.description || "Unknown Telegram error",
          retryAfter
        };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
};
var botEngine = new TelegramBotEngine();

// server/broadcastEngine.ts
var BroadcastEngine = class {
  constructor() {
    this.currentProgress = {
      id: "",
      broadcastNumber: 124,
      status: "idle",
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
    this.cancelRequested = false;
    this.pauseRequested = false;
  }
  getProgress() {
    return this.currentProgress;
  }
  async startBroadcast(payload, resumeFromId) {
    if (this.currentProgress.status === "running") {
      return {
        success: false,
        message: "\u0986\u09B0\u09C7\u0995\u099F\u09BF \u09AC\u09CD\u09B0\u09A1\u0995\u09BE\u09B8\u09CD\u099F \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8\u09C7 \u099A\u09B2\u09AE\u09BE\u09A8 \u09B0\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u09B8\u09C7\u099F\u09BF \u09B6\u09C7\u09B7 \u09B9\u0993\u09AF\u09BC\u09BE \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4 \u0985\u09AA\u09C7\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964"
      };
    }
    const allUsers = await getAllUsers();
    const nonBlockedUsers = allUsers.filter((u) => u.status !== "blocked_bot");
    if (nonBlockedUsers.length === 0) {
      return {
        success: false,
        message: "\u0995\u09CB\u09A8 \u09B8\u0995\u09CD\u09B0\u09BF\u09DF \u0987\u0989\u099C\u09BE\u09B0 \u09A1\u09BE\u099F\u09BE\u09AC\u09C7\u099C\u09C7 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 \u0987\u0989\u099C\u09BE\u09B0\u09B0\u09BE \u09AC\u099F\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 /start \u0995\u09B0\u09B2\u09C7 \u09B8\u09CD\u09AC\u09DF\u0982\u0995\u09CD\u09B0\u09BF\u09DF\u09AD\u09BE\u09AC\u09C7 \u09AC\u09CD\u09B0\u09A1\u0995\u09BE\u09B8\u09CD\u099F \u09B2\u09BF\u09B8\u09CD\u099F\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09AC\u09C7\u0964"
      };
    }
    const avoidDuplicates = payload.avoidDuplicates !== false;
    let targetUsers = nonBlockedUsers;
    let taskId = resumeFromId || `bc-${Date.now()}`;
    let broadcastNum;
    if (resumeFromId && this.currentProgress.id === resumeFromId) {
      broadcastNum = this.currentProgress.broadcastNumber;
      if (avoidDuplicates && this.currentProgress.sentUserIds.length > 0) {
        const alreadySentSet = new Set(this.currentProgress.sentUserIds);
        targetUsers = nonBlockedUsers.filter((u) => !alreadySentSet.has(u.id));
      }
    } else {
      broadcastNum = await getNextBroadcastNumber();
    }
    const batchSize = Math.max(5, Math.min(50, payload.batchSize || 25));
    const delaySeconds = Math.max(1, payload.delaySeconds || 2);
    this.cancelRequested = false;
    this.pauseRequested = false;
    this.currentProgress = {
      id: taskId,
      broadcastNumber: broadcastNum,
      title: payload.title,
      message: payload.message,
      status: "running",
      totalUsers: allUsers.length,
      sentCount: resumeFromId === this.currentProgress.id ? this.currentProgress.sentCount : 0,
      failedCount: resumeFromId === this.currentProgress.id ? this.currentProgress.failedCount : 0,
      blockedCount: resumeFromId === this.currentProgress.id ? this.currentProgress.blockedCount : 0,
      percent: 0,
      startedAt: this.currentProgress.startedAt || (/* @__PURE__ */ new Date()).toISOString(),
      estimatedRemainingSeconds: Math.ceil(targetUsers.length / batchSize * delaySeconds),
      delaySeconds,
      batchSize,
      avoidDuplicates,
      sentUserIds: resumeFromId === this.currentProgress.id ? this.currentProgress.sentUserIds : [],
      failedUserIds: resumeFromId === this.currentProgress.id ? this.currentProgress.failedUserIds : [],
      blockedUserIds: resumeFromId === this.currentProgress.id ? this.currentProgress.blockedUserIds : [],
      logs: resumeFromId === this.currentProgress.id ? this.currentProgress.logs : []
    };
    const processedInitial = this.currentProgress.sentCount + this.currentProgress.failedCount + this.currentProgress.blockedCount;
    this.currentProgress.percent = this.currentProgress.totalUsers > 0 ? Math.min(100, Math.round(processedInitial / this.currentProgress.totalUsers * 100)) : 0;
    this.processBatches(targetUsers, payload, batchSize, delaySeconds).catch((err) => {
      console.error("[BroadcastEngine] Batch runner error:", err);
    });
    await addActivityLog({
      type: "broadcast",
      message: `\u{1F4E2} Broadcast #${broadcastNum} \u09B6\u09C1\u09B0\u09C1 \u09B9\u09DF\u09C7\u099B\u09C7: \u09AE\u09CB\u099F ${this.currentProgress.totalUsers} \u099C\u09A8 \u0987\u0989\u099C\u09BE\u09B0 (Batch: ${batchSize}, Delay: ${delaySeconds}s)\u0964`
    });
    return {
      success: true,
      message: `\u{1F4E2} Broadcast #${broadcastNum} \u099A\u09BE\u09B2\u09C1 \u09B9\u09DF\u09C7\u099B\u09C7! \u09AC\u09CD\u09AF\u09BE\u099A \u09B8\u09BE\u0987\u099C ${batchSize}, \u09AC\u09BF\u09B0\u09A4\u09BF ${delaySeconds}s\u0964`,
      taskId,
      broadcastNumber: broadcastNum
    };
  }
  pause() {
    if (this.currentProgress.status === "running") {
      this.pauseRequested = true;
      this.currentProgress.status = "paused";
      this.saveHistorySnapshot("paused");
      return true;
    }
    return false;
  }
  resume() {
    if (this.currentProgress.status === "paused") {
      this.pauseRequested = false;
      this.currentProgress.status = "running";
      return true;
    }
    return false;
  }
  cancel() {
    if (this.currentProgress.status === "running" || this.currentProgress.status === "paused") {
      this.cancelRequested = true;
      this.currentProgress.status = "cancelled";
      this.currentProgress.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.saveHistorySnapshot("cancelled");
      return true;
    }
    return false;
  }
  async processBatches(users, payload, batchSize, delaySeconds) {
    const settings = await getSettings();
    const inlineKeyboard = [];
    if (payload.includeButtons) {
      inlineKeyboard.push([
        {
          text: settings.channelButtonText || "\u{1F3AC} \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09C1\u09A8 (FlickCove)",
          url: settings.telegramGroupLink || "https://t.me/FlickCove_Top"
        }
      ]);
      inlineKeyboard.push([
        {
          text: settings.whatsappButtonText || "\u{1F4F2} \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2 (WhatsApp)",
          url: settings.whatsappBackupLink || "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V"
        }
      ]);
    }
    if (payload.customButtonText && payload.customButtonUrl) {
      inlineKeyboard.push([
        {
          text: payload.customButtonText,
          url: payload.customButtonUrl
        }
      ]);
    }
    const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : void 0;
    const batches = [];
    for (let i = 0; i < users.length; i += batchSize) {
      batches.push(users.slice(i, i + batchSize));
    }
    let processedUsersInQueue = 0;
    let cachedTelegramFileId = null;
    const hasPhoto = Boolean(payload.imageUrl && payload.imageUrl.trim().length > 10);
    for (let bIdx = 0; bIdx < batches.length; bIdx++) {
      if (this.cancelRequested) {
        this.currentProgress.status = "cancelled";
        this.currentProgress.completedAt = (/* @__PURE__ */ new Date()).toISOString();
        await addActivityLog({
          type: "broadcast",
          message: `\u{1F4E2} Broadcast #${this.currentProgress.broadcastNumber} \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09AC\u09BE\u09A4\u09BF\u09B2 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964 (${this.currentProgress.sentCount} \u099C\u09A8 \u09B8\u09AB\u09B2)`
        });
        this.saveHistorySnapshot("cancelled");
        break;
      }
      while (this.pauseRequested && !this.cancelRequested) {
        await new Promise((r) => setTimeout(r, 1e3));
      }
      const currentBatch = batches[bIdx];
      for (const user of currentBatch) {
        if (this.cancelRequested) break;
        if (this.currentProgress.avoidDuplicates && this.currentProgress.sentUserIds.includes(user.id)) {
          continue;
        }
        this.currentProgress.currentUserId = user.id;
        this.currentProgress.currentUserName = user.firstName || user.username || `User #${user.id}`;
        let fullMessage = payload.message;
        if (payload.title) {
          fullMessage = `<b>${payload.title}</b>

${payload.message}`;
        }
        fullMessage = fullMessage.replace(/{first_name}/g, user.firstName || "\u09AC\u09A8\u09CD\u09A7\u09C1");
        fullMessage = fullMessage.replace(/{username}/g, user.username ? `@${user.username}` : "");
        let sendResult;
        try {
          if (hasPhoto) {
            const photoToSend = cachedTelegramFileId || payload.imageUrl.trim();
            const photoRes = await botEngine.sendPhoto({
              chat_id: user.id,
              photo: photoToSend,
              caption: fullMessage,
              parse_mode: payload.parseMode === "None" ? void 0 : payload.parseMode || "HTML",
              reply_markup: replyMarkup
            });
            sendResult = photoRes;
            if (photoRes.ok && photoRes.fileId && !cachedTelegramFileId) {
              cachedTelegramFileId = photoRes.fileId;
            }
          } else {
            sendResult = await botEngine.sendMessage({
              chat_id: user.id,
              text: fullMessage,
              parse_mode: payload.parseMode === "None" ? void 0 : payload.parseMode || "HTML",
              reply_markup: replyMarkup
            });
          }
        } catch (netErr) {
          sendResult = { ok: false, error: netErr?.message || "Network error" };
        }
        if (!sendResult.ok && sendResult.retryAfter) {
          const waitTimeMs = (sendResult.retryAfter + 2) * 1e3;
          console.warn(`[BroadcastEngine] Telegram flood wait hit. Backing off for ${waitTimeMs / 1e3}s`);
          await new Promise((r) => setTimeout(r, waitTimeMs));
          try {
            if (hasPhoto) {
              const photoToSend = cachedTelegramFileId || payload.imageUrl.trim();
              const photoRes = await botEngine.sendPhoto({
                chat_id: user.id,
                photo: photoToSend,
                caption: fullMessage,
                parse_mode: payload.parseMode === "None" ? void 0 : payload.parseMode || "HTML",
                reply_markup: replyMarkup
              });
              sendResult = photoRes;
              if (photoRes.ok && photoRes.fileId && !cachedTelegramFileId) {
                cachedTelegramFileId = photoRes.fileId;
              }
            } else {
              sendResult = await botEngine.sendMessage({
                chat_id: user.id,
                text: fullMessage,
                parse_mode: payload.parseMode === "None" ? void 0 : payload.parseMode || "HTML",
                reply_markup: replyMarkup
              });
            }
          } catch (retryErr) {
            sendResult = { ok: false, error: retryErr?.message || "Retry failed" };
          }
        }
        const errStr = (sendResult.error || "").toLowerCase();
        const isBlocked = errStr.includes("blocked") || errStr.includes("deactivated") || errStr.includes("chat not found") || errStr.includes("403") || errStr.includes("user is deactivated");
        const logEntry = {
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false }),
          userId: user.id,
          userName: user.firstName || user.username || `User #${user.id}`,
          success: sendResult.ok,
          status: sendResult.ok ? "sent" : isBlocked ? "blocked" : "failed",
          error: sendResult.error
        };
        if (sendResult.ok) {
          this.currentProgress.sentCount++;
          if (!this.currentProgress.sentUserIds.includes(user.id)) {
            this.currentProgress.sentUserIds.push(user.id);
          }
        } else if (isBlocked) {
          this.currentProgress.blockedCount++;
          if (!this.currentProgress.blockedUserIds.includes(user.id)) {
            this.currentProgress.blockedUserIds.push(user.id);
          }
          await saveOrUpdateUser({
            id: user.id,
            status: "blocked_bot"
          });
        } else {
          this.currentProgress.failedCount++;
          if (!this.currentProgress.failedUserIds.includes(user.id)) {
            this.currentProgress.failedUserIds.push(user.id);
          }
        }
        this.currentProgress.logs.unshift(logEntry);
        if (this.currentProgress.logs.length > 60) {
          this.currentProgress.logs = this.currentProgress.logs.slice(0, 60);
        }
        processedUsersInQueue++;
        const totalDone = this.currentProgress.sentCount + this.currentProgress.failedCount + this.currentProgress.blockedCount;
        this.currentProgress.percent = this.currentProgress.totalUsers > 0 ? Math.min(100, Math.round(totalDone / this.currentProgress.totalUsers * 100)) : 100;
        await new Promise((r) => setTimeout(r, 45));
      }
      const remainingBatches = batches.length - (bIdx + 1);
      this.currentProgress.estimatedRemainingSeconds = remainingBatches * delaySeconds;
      if (bIdx < batches.length - 1 && !this.cancelRequested) {
        await new Promise((r) => setTimeout(r, delaySeconds * 1e3));
      }
    }
    if (!this.cancelRequested) {
      this.currentProgress.status = "completed";
      this.currentProgress.percent = 100;
      this.currentProgress.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.currentProgress.estimatedRemainingSeconds = 0;
      await addActivityLog({
        type: "broadcast",
        message: `\u{1F4E2} Broadcast #${this.currentProgress.broadcastNumber} \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8: \u2705 Sent: ${this.currentProgress.sentCount}, \u274C Failed: ${this.currentProgress.failedCount}, \u{1F6AB} Blocked: ${this.currentProgress.blockedCount}`
      });
      this.saveHistorySnapshot("completed");
    }
  }
  saveHistorySnapshot(status) {
    const historyItem = {
      id: this.currentProgress.id,
      broadcastNumber: this.currentProgress.broadcastNumber,
      title: this.currentProgress.title,
      message: this.currentProgress.message || "",
      totalUsers: this.currentProgress.totalUsers,
      sentCount: this.currentProgress.sentCount,
      failedCount: this.currentProgress.failedCount,
      blockedCount: this.currentProgress.blockedCount,
      percent: this.currentProgress.percent,
      startedAt: this.currentProgress.startedAt || (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: this.currentProgress.completedAt,
      status,
      sentUserIdsCount: this.currentProgress.sentUserIds.length
    };
    saveBroadcastHistoryItem(historyItem).catch((err) => {
      console.error("[BroadcastEngine] Error saving broadcast history item:", err);
    });
  }
  // Send single test broadcast message to verify before mass sending
  async sendTest(targetChatId, payload) {
    const settings = await getSettings();
    const inlineKeyboard = [];
    if (payload.includeButtons) {
      inlineKeyboard.push([
        {
          text: settings.channelButtonText || "\u{1F3AC} \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09C1\u09A8 (FlickCove)",
          url: settings.telegramGroupLink || "https://t.me/FlickCove_Top"
        }
      ]);
      inlineKeyboard.push([
        {
          text: settings.whatsappButtonText || "\u{1F4F2} \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2 (WhatsApp)",
          url: settings.whatsappBackupLink || "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V"
        }
      ]);
    }
    if (payload.customButtonText && payload.customButtonUrl) {
      inlineKeyboard.push([
        {
          text: payload.customButtonText,
          url: payload.customButtonUrl
        }
      ]);
    }
    const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : void 0;
    let fullMessage = payload.message;
    if (payload.title) {
      fullMessage = `<b>${payload.title}</b>

${payload.message}`;
    }
    fullMessage = fullMessage.replace(/{first_name}/g, "Admin (Test)");
    fullMessage = fullMessage.replace(/{username}/g, "@admin");
    const hasPhoto = Boolean(payload.imageUrl && payload.imageUrl.trim().length > 10);
    if (hasPhoto) {
      return await botEngine.sendPhoto({
        chat_id: targetChatId,
        photo: payload.imageUrl.trim(),
        caption: fullMessage,
        parse_mode: payload.parseMode === "None" ? void 0 : payload.parseMode || "HTML",
        reply_markup: replyMarkup
      });
    } else {
      return await botEngine.sendMessage({
        chat_id: targetChatId,
        text: fullMessage,
        parse_mode: payload.parseMode === "None" ? void 0 : payload.parseMode || "HTML",
        reply_markup: replyMarkup
      });
    }
  }
};
var broadcastEngine = new BroadcastEngine();

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
process.on("uncaughtException", (err) => {
  console.error("[Process 24/7 Shield] Uncaught exception prevented crash:", err?.message || err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Process 24/7 Shield] Unhandled rejection prevented crash at:", promise, "reason:", reason);
});
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/health", async (_req, res) => {
  const status = await botEngine.getStatus().catch(() => null);
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    botRunning: status?.isRunning ?? false
  });
});
app.get("/api/status", async (_req, res) => {
  try {
    const [botStatus, settings, users, broadcastStatus, broadcastHistory] = await Promise.all([
      botEngine.getStatus(),
      getSettings(),
      getAllUsers(),
      broadcastEngine.getProgress(),
      getBroadcastHistory()
    ]);
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const activeToday = users.filter((u) => u.lastActive && u.lastActive.startsWith(todayStr)).length;
    const totalMessages = users.reduce((acc, u) => acc + (u.messageCount || 0), 0);
    res.json({
      success: true,
      bot: botStatus,
      settings: {
        botUsername: settings.botUsername,
        replyMode: settings.replyMode,
        isPollingActive: settings.isPollingActive,
        telegramGroupLink: settings.telegramGroupLink,
        whatsappBackupLink: settings.whatsappBackupLink
      },
      stats: {
        totalUsers: users.length,
        activeToday,
        totalMessages,
        blockedUsers: users.filter((u) => u.status === "blocked_bot").length
      },
      broadcast: broadcastStatus,
      broadcastHistory
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/bot/start", async (_req, res) => {
  try {
    const result = await botEngine.start();
    if (result.success) {
      await updateSettings({ isPollingActive: true });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/bot/stop", async (_req, res) => {
  try {
    const result = await botEngine.stop();
    if (result.success) {
      await updateSettings({ isPollingActive: false });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.post("/api/bot/test-token", async (req, res) => {
  try {
    const { token } = req.body;
    const result = await botEngine.verifyToken(token);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/telegram-webhook", async (req, res) => {
  res.status(200).send("OK");
  try {
    if (req.body && typeof req.body === "object") {
      await botEngine.processWebhookUpdate(req.body);
    }
  } catch (err) {
    console.error("[Telegram Webhook Error]", err?.message || err);
  }
});
app.get("/api/webhook/status", async (_req, res) => {
  try {
    const info = await botEngine.getWebhookInfo();
    res.json(info);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/webhook/set", async (req, res) => {
  try {
    let { url } = req.body || {};
    if (!url) {
      const host = req.get("x-forwarded-host") || req.get("host") || "";
      const proto = req.get("x-forwarded-proto") || "https";
      url = `${proto}://${host}/api/telegram-webhook`;
    }
    const result = await botEngine.setWebhook(url);
    if (result.ok) {
      await updateSettings({ isPollingActive: false });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/webhook/delete", async (_req, res) => {
  try {
    const result = await botEngine.deleteWebhook();
    if (result.ok) {
      await botEngine.start();
      await updateSettings({ isPollingActive: true });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.get("/api/settings", async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      settings: {
        ...settings,
        hasEnvGeminiKey: !!process.env.GEMINI_API_KEY
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/settings", async (req, res) => {
  try {
    const updated = await updateSettings(req.body);
    await addActivityLog({
      type: "system",
      message: "Bot settings updated by administrator."
    });
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/users/direct-message", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ success: false, error: "User ID and text are required" });
    }
    const result = await botEngine.sendMessage({
      chat_id: userId,
      text,
      parse_mode: "HTML"
    });
    if (result.ok) {
      await addActivityLog({
        type: "outgoing_msg",
        userId: Number(userId),
        message: `Direct message sent to user #${userId}`
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    await deleteUser(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/users/seed-demo", async (_req, res) => {
  try {
    const demoUsers = [
      { id: 109283741, firstName: "Tanvir", lastName: "Ahmed", username: "tanvir_ahmed", messageCount: 14, status: "active" },
      { id: 283746592, firstName: "Sabbir", lastName: "Hossain", username: "sabbir_boss", messageCount: 8, status: "active" },
      { id: 394857123, firstName: "Rafi", lastName: "Chowdhury", username: "rafi_c", messageCount: 22, status: "active" },
      { id: 482910384, firstName: "Mahmudul", lastName: "Hasan", username: "mahmud_99", messageCount: 5, status: "active" },
      { id: 573829102, firstName: "Arif", lastName: "Rahman", username: "arif_2026", messageCount: 19, status: "active" }
    ];
    for (const u of demoUsers) {
      await saveOrUpdateUser(u);
    }
    res.json({ success: true, count: demoUsers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/message-requests", async (_req, res) => {
  res.json({ success: true, requests: [] });
});
app.post("/api/message-requests/process-pending", async (_req, res) => {
  res.json({ success: true, processed: 0, errors: 0 });
});
app.delete("/api/message-requests", async (_req, res) => {
  res.json({ success: true });
});
app.post("/api/broadcast/start", async (req, res) => {
  try {
    const { resumeFromId, ...payload } = req.body;
    const result = await broadcastEngine.startBroadcast(payload, resumeFromId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/broadcast/status", async (_req, res) => {
  try {
    const progress = broadcastEngine.getProgress();
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/broadcast/history", async (_req, res) => {
  try {
    const history = await getBroadcastHistory();
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete("/api/broadcast/history/:id", async (req, res) => {
  try {
    const ok = await deleteBroadcastHistoryItem(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/broadcast/pause", (_req, res) => {
  const ok = broadcastEngine.pause();
  res.json({ success: ok });
});
app.post("/api/broadcast/resume", (_req, res) => {
  const ok = broadcastEngine.resume();
  res.json({ success: ok });
});
app.post("/api/broadcast/cancel", (_req, res) => {
  const ok = broadcastEngine.cancel();
  res.json({ success: ok });
});
app.post("/api/broadcast/test-send", async (req, res) => {
  try {
    const { targetChatId, payload } = req.body;
    if (!targetChatId) {
      return res.status(400).json({ ok: false, error: "Target Chat ID is required for testing" });
    }
    const result = await broadcastEngine.sendTest(targetChatId, payload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/simulate-chat", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    const settings = await getSettings();
    const buttons = [];
    if (settings.showInlineButtons) {
      buttons.push(
        { text: settings.channelButtonText || "\u{1F3AC} \u09B8\u09AC \u09AD\u09BF\u09A1\u09BF\u0993 \u09A6\u09C7\u0996\u09C1\u09A8 (FlickCove)", url: settings.telegramGroupLink || "https://t.me/FlickCove_Top" },
        { text: settings.whatsappButtonText || "\u{1F4F2} \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u099A\u09CD\u09AF\u09BE\u09A8\u09C7\u09B2 (WhatsApp)", url: settings.whatsappBackupLink || "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V" }
      );
    }
    const detected = detectBotCommand(message);
    if (detected) {
      let reply = "";
      if (detected === "start") {
        reply = settings.commands?.startReply || DEFAULT_COMMANDS.startReply;
      } else if (detected === "video_help") {
        reply = settings.commands?.videoHelpReply || DEFAULT_COMMANDS.videoHelpReply;
      } else if (detected === "new_video") {
        reply = settings.commands?.newVideoReply || DEFAULT_COMMANDS.newVideoReply;
      } else if (detected === "backup_channel") {
        reply = settings.commands?.backupChannelReply || DEFAULT_COMMANDS.backupChannelReply;
      }
      return res.json({
        success: true,
        reply,
        mode: `command_${detected}`,
        buttons
      });
    }
    if (settings.replyMode === "static") {
      return res.json({
        success: true,
        reply: settings.staticReplyMessage,
        mode: "static_reply",
        buttons
      });
    }
    const aiReply = await generateAiReply(message, "Admin Demo", chatHistory);
    return res.json({
      success: true,
      reply: aiReply,
      mode: "gemini_ai",
      buttons
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/logs", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await getActivityLogs(limit);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/download-zip", async (_req, res) => {
  try {
    const zipPath = path2.resolve(__dirname, "public/halpline-bot-source.zip");
    const publicDir = path2.resolve(__dirname, "public");
    if (!fs2.existsSync(publicDir)) {
      fs2.mkdirSync(publicDir, { recursive: true });
    }
    try {
      execSync(`python3 -c "import os, zipfile; z = zipfile.ZipFile('public/halpline-bot-source.zip', 'w', zipfile.ZIP_DEFLATED); [z.write(os.path.join(root, f), os.path.relpath(os.path.join(root, f), '.')) for root, dirs, files in os.walk('.') if not any(x in root for x in ['node_modules', '.git', 'dist', '.aistudio']) for f in files if f != 'halpline-bot-source.zip']"`, { cwd: __dirname });
    } catch (e) {
      console.warn("[ZIP Gen Warn]", e);
    }
    res.download(zipPath, "halpline-bot-source.zip");
  } catch (err) {
    console.error("[Download ZIP Error]", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/github-push", async (req, res) => {
  try {
    const { repoUrl, personalAccessToken, branch = "main", commitMessage = "Update bot project" } = req.body;
    if (!repoUrl || !personalAccessToken) {
      return res.status(400).json({ success: false, error: "GitHub Repo URL \u098F\u09AC\u0982 Personal Access Token \u09AA\u09CD\u09B0\u09AF\u09BC\u09CB\u099C\u09A8\u0964" });
    }
    let cleanUrl = repoUrl.trim();
    cleanUrl = cleanUrl.replace(/\/+$/, "");
    if (!cleanUrl.endsWith(".git")) {
      cleanUrl += ".git";
    }
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ success: false, error: "\u09B8\u09A0\u09BF\u0995 GitHub Repository URL \u09A6\u09BF\u09A8 (\u09AF\u09C7\u09AE\u09A8: https://github.com/username/repo)" });
    }
    const authUrl = `https://${encodeURIComponent(personalAccessToken.trim())}@github.com/${match[1]}/${match[2]}`;
    try {
      execSync("git status", { cwd: __dirname, stdio: "ignore" });
    } catch {
      execSync("git init", { cwd: __dirname });
    }
    execSync(`git branch -M ${branch}`, { cwd: __dirname });
    execSync("git add .", { cwd: __dirname });
    try {
      execSync(`git -c user.name="BotAdmin" -c user.email="admin@halplinebot.local" commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: __dirname });
    } catch {
    }
    try {
      execSync("git remote remove origin", { cwd: __dirname, stdio: "ignore" });
    } catch {
    }
    execSync(`git remote add origin ${authUrl}`, { cwd: __dirname });
    const pushOutput = execSync(`git push -u origin ${branch} --force`, {
      cwd: __dirname,
      encoding: "utf-8",
      timeout: 3e4
    });
    try {
      execSync(`git remote set-url origin https://github.com/${match[1]}/${match[2]}`, { cwd: __dirname });
    } catch {
    }
    res.json({
      success: true,
      message: `\u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 GitHub-\u098F \u09AA\u09C1\u09B6 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09DF\u09C7\u099B\u09C7! Repository: https://github.com/${match[1]}/${match[2].replace(".git", "")}`,
      repoWebUrl: `https://github.com/${match[1]}/${match[2].replace(".git", "")}`,
      details: pushOutput
    });
  } catch (err) {
    console.error("[GitHub Push Error]", err);
    res.status(500).json({
      success: false,
      error: `GitHub \u09AA\u09C1\u09B6 \u09AC\u09CD\u09AF\u09B0\u09CD\u09A5 \u09B9\u09DF\u09C7\u099B\u09C7: ${err.stderr || err.message}`
    });
  }
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs2.existsSync(path2.resolve(__dirname, "index.html")) ? __dirname : fs2.existsSync(path2.resolve(__dirname, "dist")) ? path2.resolve(__dirname, "dist") : __dirname;
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[Server] Running on port ${PORT} (dev mode: ${!isProduction})`);
    try {
      const settings = await getSettings();
      if (settings.botToken) {
        console.log("[Server] Auto-starting Telegram Bot polling...");
        const result = await botEngine.start();
        if (result.success) {
          await updateSettings({ isPollingActive: true });
        }
        console.log("[Server] Bot init result:", result.message);
      }
    } catch (err) {
      console.warn("[Server] Auto-start bot warning:", err.message);
    }
    setInterval(async () => {
      try {
        await fetch(`http://127.0.0.1:${PORT}/api/health`).catch(() => {
        });
      } catch (e) {
      }
    }, 2 * 60 * 1e3);
  });
}
startServer();
