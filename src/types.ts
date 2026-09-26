export interface BotUser {
  id: number; // Telegram Chat / User ID (Stored specifically for Broadcasting)
  username?: string;
  firstName?: string;
  lastName?: string;
  firstSeen: string; // ISO date string
  lastActive: string; // ISO date string
  messageCount: number;
  status: 'active' | 'blocked_bot' | 'unreachable';
}

export interface BotCommandsConfig {
  startReply: string;
  videoHelpReply: string;
  newVideoReply: string;
  backupChannelReply: string;
}

export const DEFAULT_COMMANDS: BotCommandsConfig = {
  startReply: `*হ্যালো স্যার*\nএখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের লিং*ক ভি*ডিও পাওয় যায় । ভিডিও দেখতে নিচের বাটনে ক্লিক করে । চ্যানেলের মধ্যে থেকে দেখতে পারেন\n।`,
  videoHelpReply: `ওয়েবসাইটে মধ্যে কোনো ভিডিও খুঁজে না পেলে ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই ভিডিও পেয়ে যাবেন।`,
  newVideoReply: `এখানে প্রতিদিন নতুন নতুন টিকটোকারেল লিংক ভিডিও শেয়ার করা হয় । ভিডিও মিস না করতে ব্রেকাপ চ্যানেলে জয়েন করুন 👈`,
  backupChannelReply: `কখনো ভিডিও মিস না হয় । তাই ব্রেকাপ চ্যানেলে জয়েন করুন। নতুন ভিডিও পান সাথে সাথে`
};

export interface BotSettings {
  botToken: string;
  botUsername: string;
  geminiApiKey: string;
  hasEnvGeminiKey?: boolean;
  telegramGroupLink: string;
  whatsappBackupLink: string;
  welcomeMessage: string;
  replyMode: 'ai' | 'static';
  staticReplyMessage: string;
  aiSystemPrompt: string;
  isPollingActive: boolean;
  broadcastDelaySeconds: number;
  adminTelegramId?: string;
  showInlineButtons: boolean;
  channelButtonText: string;
  whatsappButtonText: string;
  commands?: BotCommandsConfig;
  messageRequestMode?: 'auto_queue_when_offline' | 'always_queue' | 'instant_reply';
  offlineNoticeMessage?: string;
  onlineAutoReplyPending?: boolean;
}

export interface MessageRequest {
  id: string;
  userId: number;
  chatId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  messageText: string;
  receivedAt: string; // ISO date string
  status: 'pending' | 'replied' | 'auto_replied';
  replyText?: string;
  repliedAt?: string;
  repliedBy?: 'admin' | 'bot_ai' | 'auto_online';
  isOfflineMessage?: boolean;
}

export interface BroadcastLogEntry {
  timestamp: string;
  userId: number;
  userName?: string;
  success: boolean;
  status: 'sent' | 'failed' | 'blocked';
  error?: string;
}

export interface BroadcastProgress {
  id: string;
  broadcastNumber: number; // e.g. 125 (📢 Broadcast #125)
  title?: string;
  message?: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  totalUsers: number;
  sentCount: number;
  failedCount: number;
  blockedCount: number;
  currentUserId?: number;
  currentUserName?: string;
  percent: number;
  startedAt?: string;
  completedAt?: string;
  estimatedRemainingSeconds?: number;
  delaySeconds: number;
  batchSize: number;
  avoidDuplicates: boolean;
  sentUserIds: number[];
  failedUserIds: number[];
  blockedUserIds: number[];
  logs: BroadcastLogEntry[];
}

export interface BroadcastHistoryItem {
  id: string;
  broadcastNumber: number;
  title?: string;
  message: string;
  imageUrl?: string;
  totalUsers: number;
  sentCount: number;
  failedCount: number;
  blockedCount: number;
  percent: number;
  startedAt: string;
  completedAt?: string;
  status: 'completed' | 'cancelled' | 'paused' | 'running';
  sentUserIdsCount: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'incoming_msg' | 'outgoing_msg' | 'ai_generation' | 'broadcast' | 'error' | 'system';
  userId?: number;
  userName?: string;
  message: string;
  details?: any;
}

export interface SystemStatus {
  bot: {
    isRunning: boolean;
    botInfo?: {
      id: number;
      first_name: string;
      username: string;
      can_join_groups?: boolean;
      can_read_all_group_messages?: boolean;
      supports_inline_queries?: boolean;
    };
    lastError: string | null;
    pollOffset: number;
    webhook?: {
      url?: string;
      has_custom_certificate?: boolean;
      pending_update_count?: number;
      last_error_date?: number;
      last_error_message?: string;
    };
  };
  settings: {
    botUsername: string;
    replyMode: 'ai' | 'static';
    isPollingActive: boolean;
    telegramGroupLink: string;
    whatsappBackupLink: string;
    messageRequestMode?: 'auto_queue_when_offline' | 'always_queue' | 'instant_reply';
    offlineNoticeMessage?: string;
    onlineAutoReplyPending?: boolean;
  };
  stats: {
    totalUsers: number;
    activeToday: number;
    totalMessages: number;
    blockedUsers: number;
    pendingRequests?: number;
    totalRequests?: number;
  };
  broadcast: BroadcastProgress;
  broadcastHistory?: BroadcastHistoryItem[];
}
