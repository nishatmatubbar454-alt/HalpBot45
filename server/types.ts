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

export interface BotSettings {
  botToken: string;
  botUsername: string;
  geminiApiKey: string;
  telegramGroupLink: string;
  whatsappBackupLink: string;
  welcomeMessage: string;
  replyMode: 'ai' | 'static'; // 'ai' = Gemini 3.8 Flash, 'static' = Admin fixed reply
  staticReplyMessage: string;
  aiSystemPrompt: string;
  isPollingActive: boolean;
  broadcastDelaySeconds: number; // 5 or 10 seconds as requested by user
  adminTelegramId?: string; // For testing broadcasts
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

export interface BroadcastPayload {
  title?: string;
  message: string;
  imageUrl?: string;
  parseMode?: 'HTML' | 'Markdown' | 'None';
  delaySeconds: number; // delay between batches
  batchSize?: number; // e.g. 20-25 messages per batch
  avoidDuplicates?: boolean; // track chat_ids already sent in this broadcast
  includeButtons: boolean;
  customButtonText?: string;
  customButtonUrl?: string;
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
  blockedCount: number; // specifically for users who blocked the bot or are deactivated
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
