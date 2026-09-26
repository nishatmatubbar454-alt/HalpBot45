import { 
  getSettings, 
  saveOrUpdateUser, 
  addActivityLog, 
  getUserById,
  DEFAULT_COMMANDS
} from "./firebaseService.js";
import { generateAiReply } from "./geminiService.js";
import { BotCommandsConfig, BotSettings } from "./types.js";

export type BotCommandType = 'start' | 'video_help' | 'new_video' | 'backup_channel' | null;

export function detectBotCommand(rawText: string): BotCommandType {
  const t = (rawText || '').trim();
  if (!t) return null;

  // 1. /start
  if (t.startsWith('/start')) {
    return 'start';
  }

  const clean = t.toLowerCase()
    .replace(/^\//, '')
    .replace(/[_,:\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Video Help: /ভিডিও দেখার উপায়
  if (
    clean === 'ভিডিও দেখার উপায়' ||
    clean === 'ভিডিও দেখার উপায়' ||
    clean === 'video dekhar upay' ||
    clean === 'videodekharupay' ||
    clean === 'video help' ||
    clean === 'how to watch' ||
    clean.includes('ভিডিও দেখার উপায়') ||
    clean.includes('ভিডিও দেখার উপায়') ||
    clean.includes('ভিডিও কিভাবে দেখব') ||
    clean.includes('ভিডিও কীভাবে দেখব') ||
    clean.includes('ভিডিও দেখতে পারছি না') ||
    clean.includes('ভিডিও খুঁজে পাচ্ছি না') ||
    clean.includes('ভিডিও খুজে পাচ্ছিনা') ||
    clean.includes('ভিডিও পাচ্ছি না') ||
    clean.startsWith('ভিডিও দেখার')
  ) {
    return 'video_help';
  }

  // 3. New Video: /new video
  if (
    clean === 'new video' ||
    clean === 'new videos' ||
    clean === 'newvideo' ||
    clean === 'নতুন ভিডিও' ||
    clean.startsWith('new video') ||
    clean.includes('new video') ||
    clean.includes('নতুন ভিডিও') ||
    clean.includes('নতুন টিকটক') ||
    clean.includes('আজকের ভিডিও')
  ) {
    return 'new_video';
  }

  // 4. Backup Channel: /Bickup channel or /Backup channel
  if (
    clean === 'bickup channel' ||
    clean === 'backup channel' ||
    clean === 'bickup' ||
    clean === 'backup' ||
    clean === 'ব্রেকাপ চ্যানেল' ||
    clean === 'ব্যাকআপ চ্যানেল' ||
    clean === 'ব্রেকআপ চ্যানেল' ||
    clean.startsWith('bickup') ||
    clean.startsWith('backup') ||
    clean.includes('bickup') ||
    clean.includes('backup') ||
    clean.includes('ব্রেকাপ') ||
    clean.includes('ব্যাকআপ') ||
    clean.includes('ব্রেকআপ')
  ) {
    return 'backup_channel';
  }

  return null;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: Array<{ file_id: string }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

class TelegramBotEngine {
  private isRunning: boolean = false;
  private pollOffset: number = 0;
  private abortController: AbortController | null = null;
  private botInfo: any = null;
  private lastError: string | null = null;
  private activePollingPromise: Promise<void> | null = null;
  private lastPollSuccess: number = Date.now();
  private watchdogInterval: NodeJS.Timeout | null = null;

  public async getStatus() {
    let webhookInfo: any = null;
    try {
      const whRes = await this.getWebhookInfo();
      if (whRes.ok) {
        webhookInfo = whRes.result;
      }
    } catch {}

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

  public async getWebhookInfo(): Promise<{ ok: boolean; result?: any; error?: string }> {
    const settings = await getSettings();
    if (!settings.botToken) return { ok: false, error: 'Bot token missing' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/getWebhookInfo`);
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  public async setWebhook(url: string): Promise<{ ok: boolean; description?: string; error?: string }> {
    const settings = await getSettings();
    if (!settings.botToken) return { ok: false, error: 'Bot token missing' };

    // Stop polling loop if active to prevent 409 conflict
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
          type: 'system',
          message: `Telegram Webhook 24/7 activated: ${url}`
        }).catch(() => {});
      }
      return data;
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  public async deleteWebhook(): Promise<{ ok: boolean; description?: string; error?: string }> {
    const settings = await getSettings();
    if (!settings.botToken) return { ok: false, error: 'Bot token missing' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/deleteWebhook?drop_pending_updates=false`);
      const data = await res.json();
      if (data.ok) {
        await addActivityLog({
          type: 'system',
          message: 'Telegram Webhook removed. Polling mode restored.'
        }).catch(() => {});
      }
      return data;
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  public async processWebhookUpdate(update: TelegramUpdate) {
    if (!update || typeof update !== 'object') return;
    this.lastPollSuccess = Date.now();
    try {
      await this.handleUpdate(update);
    } catch (err: any) {
      console.error('[BotEngine Webhook] Error handling webhook update:', err?.message || err);
    }
  }

  public async verifyToken(token?: string): Promise<{ ok: boolean; result?: any; error?: string }> {
    const settings = await getSettings();
    const botToken = token || settings.botToken;

    if (!botToken) {
      return { ok: false, error: 'Bot token is missing' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        this.botInfo = data.result;
        this.lastError = null;
        return { ok: true, result: data.result };
      } else {
        const desc = data.description || 'Telegram API rejected token';
        this.lastError = desc;
        return { ok: false, error: desc };
      }
    } catch (e: any) {
      this.lastError = e.message;
      return { ok: false, error: e.message };
    }
  }

  public async start(): Promise<{ success: boolean; message: string }> {
    if (this.isRunning) {
      return { success: true, message: 'Bot polling is already running' };
    }

    const test = await this.verifyToken();
    if (!test.ok) {
      return { success: false, message: `Cannot start bot: ${test.error}` };
    }

    // Delete webhook if any, to allow getUpdates (preserve pending updates so no offline messages are lost)
    const settings = await getSettings();
    try {
      await fetch(`https://api.telegram.org/bot${settings.botToken}/deleteWebhook?drop_pending_updates=false`);
    } catch (e) {}

    this.isRunning = true;
    this.abortController = new AbortController();
    this.lastPollSuccess = Date.now();
    this.registerTelegramCommands(settings.botToken).catch(() => {});
    this.pollLoop();

    // Start 24/7 Watchdog to ensure polling never dies or stalls
    if (!this.watchdogInterval) {
      this.watchdogInterval = setInterval(() => this.runWatchdog(), 20000);
    }

    await addActivityLog({
      type: 'system',
      message: `Telegram Bot @${this.botInfo?.username || 'HalpLine_bot'} started 24/7 polling.`
    });

    return { success: true, message: `Bot @${this.botInfo?.username} is active and polling updates 24/7!` };
  }

  public async stop(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning) {
      return { success: true, message: 'Bot is not running' };
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
      type: 'system',
      message: 'Telegram Bot polling stopped by admin.'
    });

    return { success: true, message: 'Bot polling has been stopped' };
  }

  private async pollLoop() {
    console.log('[BotEngine] 24/7 polling loop active...');
    while (this.isRunning) {
      try {
        const settings = await getSettings();
        if (!settings.botToken) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        const url = `https://api.telegram.org/bot${settings.botToken}/getUpdates?offset=${this.pollOffset}&timeout=8&limit=100`;

        // 15-second per-request abort timeout to prevent indefinite socket hanging
        const reqController = new AbortController();
        const timeoutHandle = setTimeout(() => reqController.abort(), 15000);

        let res: Response;
        try {
          res = await fetch(url, { signal: reqController.signal });
        } finally {
          clearTimeout(timeoutHandle);
        }

        this.lastPollSuccess = Date.now();

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 409) {
            // Webhook conflict: clear webhook and wait 3s
            await fetch(`https://api.telegram.org/bot${settings.botToken}/deleteWebhook?drop_pending_updates=false`).catch(() => {});
            await new Promise((r) => setTimeout(r, 3000));
          } else {
            console.warn('[BotEngine] Telegram poll status:', res.status, errText);
            await new Promise((r) => setTimeout(r, 2000));
          }
          continue;
        }

        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.pollOffset = update.update_id + 1;
            // Process concurrently so slow AI responses never delay other incoming user messages
            this.handleUpdate(update).catch((updateErr: any) => {
              console.error('[BotEngine] Error processing update:', updateErr?.message || updateErr);
            });
          }
        }
      } catch (err: any) {
        if (!this.isRunning) break;
        if (err.name !== 'AbortError') {
          console.error('[BotEngine] Polling network warning:', err.message);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    console.log('[BotEngine] Polling loop finished.');
  }

  private async runWatchdog() {
    try {
      const settings = await getSettings().catch(() => null);
      if (!settings || !settings.botToken) return;

      // Auto-revive if polling is supposed to be active in settings but stopped
      if (settings.isPollingActive && !this.isRunning) {
        console.log('[BotEngine Watchdog] Bot is marked active but stopped. Auto-restarting 24/7 polling...');
        await this.start();
        return;
      }

      // Check for socket/network stall (>45s without polling progress)
      if (this.isRunning && (Date.now() - this.lastPollSuccess > 45000)) {
        console.warn('[BotEngine Watchdog] Polling stalled (>45s). Reviving connection...');
        this.lastPollSuccess = Date.now();
        if (this.abortController) {
          try { this.abortController.abort(); } catch (e) {}
        }
        this.abortController = new AbortController();
        this.pollLoop();
      }
    } catch (e: any) {
      console.warn('[BotEngine Watchdog] Error:', e.message);
    }
  }

  public buildReplyMarkup(settings: BotSettings) {
    const inlineKeyboard: any[] = [];
    if (settings.showInlineButtons) {
      // 1. Direct Video Channel link button
      inlineKeyboard.push([
        {
          text: settings.channelButtonText || "🎬 সব ভিডিও দেখুন (FlickCove)",
          url: settings.telegramGroupLink || "https://t.me/FlickCove_Top"
        }
      ]);

      // 2. Direct Backup Channel (WhatsApp) link button
      inlineKeyboard.push([
        {
          text: settings.whatsappButtonText || "📲 ব্রেকাপ চ্যানেল (WhatsApp)",
          url: settings.whatsappBackupLink || "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V"
        }
      ]);
    }

    return inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;
  }

  public async registerTelegramCommands(token?: string): Promise<{ ok: boolean; description?: string }> {
    const settings = await getSettings();
    const botToken = token || settings.botToken;
    if (!botToken) return { ok: false, description: 'Bot token missing' };

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: '🏠 বট শুরু করুন ও ভিডিও লিংক' },
            { command: 'new_video', description: '🔥 প্রতিদিনের নতুন ভিডিও (/new video)' },
            { command: 'video_help', description: '🔍 ভিডিও দেখার ও খোঁজার উপায়' },
            { command: 'backup_channel', description: '📲 ব্রেকাপ চ্যানেল (/Bickup channel)' }
          ]
        })
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { ok: false, description: e.message };
    }
  }

  private async handleUpdate(update: TelegramUpdate) {
    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async handleCallbackQuery(cb: NonNullable<TelegramUpdate['callback_query']>) {
    try {
      await this.answerCallbackQuery(cb.id);

      const chatId = cb.message?.chat.id || cb.from.id;
      const data = cb.data || '';
      const settings = await getSettings();
      const replyMarkup = this.buildReplyMarkup(settings);

      let replyText = '';
      let cmdName = '';

      if (data === 'cmd_video_help') {
        replyText = settings.commands?.videoHelpReply || DEFAULT_COMMANDS.videoHelpReply;
        cmdName = '/ভিডিও দেখার উপায়';
      } else if (data === 'cmd_new_video') {
        replyText = settings.commands?.newVideoReply || DEFAULT_COMMANDS.newVideoReply;
        cmdName = '/new video';
      } else if (data === 'cmd_backup_channel') {
        replyText = settings.commands?.backupChannelReply || DEFAULT_COMMANDS.backupChannelReply;
        cmdName = '/Bickup channel';
      } else if (data === 'cmd_start') {
        replyText = settings.commands?.startReply || DEFAULT_COMMANDS.startReply;
        cmdName = '/start';
      }

      if (replyText) {
        await this.sendMessage({
          chat_id: chatId,
          text: replyText,
          reply_markup: replyMarkup
        });

        addActivityLog({
          type: 'outgoing_msg',
          userId: cb.from.id,
          message: `Bot command answered: ${cmdName} (via Button click)`
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('[BotEngine] Error handling callback query:', err?.message || err);
    }
  }

  public async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    const settings = await getSettings();
    try {
      await fetch(`https://api.telegram.org/bot${settings.botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || ''
        })
      });
    } catch (e) {}
  }

  private async handleMessage(msg: TelegramMessage) {
    if (!msg.from || msg.from.is_bot) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = (msg.text || '').trim();

    try {
      // 1. Instantly trigger 'typing' indicator so user knows bot is already responding
      this.sendChatAction(chatId, 'typing').catch(() => {});

      // 2. Non-blocking user tracking (runs in background so reply is immediate)
      saveOrUpdateUser({
        id: userId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        status: 'active'
      }).catch(() => {});

      // 3. Fast settings retrieval from cache
      const settings = await getSettings();

      // Build inline buttons with direct channel links and quick action buttons
      const replyMarkup = this.buildReplyMarkup(settings);

      // Check if message matches any of the specific bot commands
      const detectedCmd = detectBotCommand(text);

      if (detectedCmd) {
        let replyContent = '';
        let cmdLog = '';

        if (detectedCmd === 'start') {
          replyContent = settings.commands?.startReply || DEFAULT_COMMANDS.startReply;
          cmdLog = '/start';
        } else if (detectedCmd === 'video_help') {
          replyContent = settings.commands?.videoHelpReply || DEFAULT_COMMANDS.videoHelpReply;
          cmdLog = '/ভিডিও দেখার উপায়';
        } else if (detectedCmd === 'new_video') {
          replyContent = settings.commands?.newVideoReply || DEFAULT_COMMANDS.newVideoReply;
          cmdLog = '/new video';
        } else if (detectedCmd === 'backup_channel') {
          replyContent = settings.commands?.backupChannelReply || DEFAULT_COMMANDS.backupChannelReply;
          cmdLog = '/Bickup channel';
        }

        const sendRes = await this.sendMessage({
          chat_id: chatId,
          text: replyContent,
          reply_markup: replyMarkup
        });

        if (sendRes.ok) {
          addActivityLog({
            type: 'outgoing_msg',
            userId: userId,
            message: `Command reply sent: ${cmdLog}`
          }).catch(() => {});
        }
        return;
      }

      // Generate regular reply content based on replyMode (AI or static reply)
      let replyContent = '';
      if (settings.replyMode === 'static') {
        replyContent = settings.staticReplyMessage || 
          `ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আশা করি ভিডিও পেয়ে যাবেন। নিচের বাটনে ক্লিক করে যুক্ত থাকুন।`;
      } else {
        replyContent = await generateAiReply(text, msg.from.first_name);
      }

      // Send the regular reply directly to user with buttons below the message
      const sendRes = await this.sendMessage({
        chat_id: chatId,
        text: replyContent,
        reply_markup: replyMarkup
      });

      if (sendRes.ok) {
        addActivityLog({
          type: settings.replyMode === 'ai' ? 'ai_generation' : 'outgoing_msg',
          userId: userId,
          message: settings.replyMode === 'ai' ? 'AI response sent' : 'Static reply sent'
        }).catch(() => {});
      }
    } catch (msgErr: any) {
      console.error(`[BotEngine] Error handling message from user ${userId}:`, msgErr?.message || msgErr);
    }
  }

  public async processPendingMessageRequests(): Promise<{ processed: number; errors: number }> {
    return { processed: 0, errors: 0 };
  }

  public async sendChatAction(chatId: number, action: 'typing' | 'upload_photo'): Promise<void> {
    const settings = await getSettings();
    try {
      await fetch(`https://api.telegram.org/bot${settings.botToken}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: action })
      });
    } catch (e) {}
  }

  public async sendMessage(params: {
    chat_id: number | string;
    text: string;
    parse_mode?: string;
    reply_markup?: any;
    disable_web_page_preview?: boolean;
  }): Promise<{ ok: boolean; result?: any; error?: string; retryAfter?: number; isBlocked?: boolean }> {
    const settings = await getSettings();
    const token = settings.botToken;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        const desc = data.description || '';
        const isBlocked = desc.includes('bot was blocked by the user') || 
                          desc.includes('user is deactivated') || 
                          desc.includes('chat not found');

        if (isBlocked) {
          const numericId = typeof params.chat_id === 'number' ? params.chat_id : parseInt(String(params.chat_id), 10);
          if (!isNaN(numericId)) {
            saveOrUpdateUser({ id: numericId, status: 'blocked_bot' }).catch(() => {});
          }
          return { 
            ok: false, 
            error: desc,
            isBlocked: true
          };
        }

        // Resilient fallback: If failed due to formatting or parse_mode error, retry WITHOUT parse_mode but KEEPING reply_markup!
        if (params.parse_mode) {
          try {
            const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
          } catch (retryErr) {}
        }

        // Ultimate fallback: Try plain text without reply_markup if Telegram rejected the buttons
        if (params.reply_markup) {
          try {
            const finalRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
          } catch (finalErr) {}
        }

        const retryAfter = data.parameters?.retry_after;
        return { 
          ok: false, 
          error: data.description || 'Unknown Telegram error',
          retryAfter: retryAfter
        };
      }
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  public async sendPhoto(params: {
    chat_id: number | string;
    photo: string;
    caption?: string;
    parse_mode?: string;
    reply_markup?: any;
  }): Promise<{ ok: boolean; result?: any; fileId?: string; error?: string; retryAfter?: number; isBlocked?: boolean }> {
    const settings = await getSettings();
    const token = settings.botToken;

    try {
      let res: Response;
      const isBase64 = params.photo.startsWith('data:image/') || (!params.photo.startsWith('http') && params.photo.length > 200);

      if (isBase64) {
        const formData = new FormData();
        formData.append('chat_id', String(params.chat_id));
        if (params.caption) formData.append('caption', params.caption);
        if (params.parse_mode) formData.append('parse_mode', params.parse_mode);
        if (params.reply_markup) formData.append('reply_markup', JSON.stringify(params.reply_markup));

        let mimeType = 'image/jpeg';
        let base64Content = params.photo;
        const match = params.photo.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          mimeType = `image/${match[1]}`;
          base64Content = match[2];
        } else if (params.photo.includes(',')) {
          base64Content = params.photo.split(',')[1];
        }

        const buffer = Buffer.from(base64Content, 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('photo', blob, `gallery_photo.${ext}`);

        res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        const fileId = Array.isArray(photoArr) && photoArr.length > 0
          ? photoArr[photoArr.length - 1].file_id
          : undefined;

        return { ok: true, result: data.result, fileId };
      } else {
        const desc = data.description || '';
        const isBlocked = desc.includes('bot was blocked by the user') || 
                          desc.includes('user is deactivated') || 
                          desc.includes('chat not found');

        if (isBlocked) {
          const numericId = typeof params.chat_id === 'number' ? params.chat_id : parseInt(String(params.chat_id), 10);
          if (!isNaN(numericId)) {
            saveOrUpdateUser({ id: numericId, status: 'blocked_bot' }).catch(() => {});
          }
          return { 
            ok: false, 
            error: desc,
            isBlocked: true
          };
        }

        // Retry without parse_mode if formatting error
        if (params.parse_mode) {
          try {
            return await this.sendPhoto({
              ...params,
              parse_mode: undefined
            });
          } catch (retryErr) {}
        }

        const retryAfter = data.parameters?.retry_after;
        return { 
          ok: false, 
          error: data.description || 'Unknown Telegram error',
          retryAfter: retryAfter
        };
      }
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }
}

export const botEngine = new TelegramBotEngine();
