import { 
  getAllUsers, 
  saveOrUpdateUser, 
  addActivityLog, 
  getSettings,
  getNextBroadcastNumber,
  saveBroadcastHistoryItem
} from "./firebaseService.js";
import { botEngine } from "./botEngine.js";
import { BroadcastPayload, BroadcastProgress, BroadcastLogEntry, BroadcastHistoryItem } from "./types.js";

class BroadcastEngine {
  private currentProgress: BroadcastProgress = {
    id: '',
    broadcastNumber: 124,
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

  private cancelRequested: boolean = false;
  private pauseRequested: boolean = false;

  public getProgress(): BroadcastProgress {
    return this.currentProgress;
  }

  public async startBroadcast(payload: BroadcastPayload, resumeFromId?: string): Promise<{ success: boolean; message: string; taskId?: string; broadcastNumber?: number }> {
    if (this.currentProgress.status === 'running') {
      return { 
        success: false, 
        message: 'আরেকটি ব্রডকাস্ট বর্তমানে চলমান রয়েছে। সেটি শেষ হওয়া পর্যন্ত অপেক্ষা করুন।' 
      };
    }

    const allUsers = await getAllUsers();
    
    // Non-blocked users
    const nonBlockedUsers = allUsers.filter((u) => u.status !== 'blocked_bot');

    if (nonBlockedUsers.length === 0) {
      return { 
        success: false, 
        message: 'কোন সক্রিয় ইউজার ডাটাবেজে পাওয়া যায়নি। ইউজাররা বটের সাথে /start করলে স্বয়ংক্রিয়ভাবে ব্রডকাস্ট লিস্টে যুক্ত হবে।' 
      };
    }

    const avoidDuplicates = payload.avoidDuplicates !== false;
    let targetUsers = nonBlockedUsers;

    let taskId = resumeFromId || `bc-${Date.now()}`;
    let broadcastNum: number;

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
      status: 'running',
      totalUsers: allUsers.length,
      sentCount: resumeFromId === this.currentProgress.id ? this.currentProgress.sentCount : 0,
      failedCount: resumeFromId === this.currentProgress.id ? this.currentProgress.failedCount : 0,
      blockedCount: resumeFromId === this.currentProgress.id ? this.currentProgress.blockedCount : 0,
      percent: 0,
      startedAt: this.currentProgress.startedAt || new Date().toISOString(),
      estimatedRemainingSeconds: Math.ceil((targetUsers.length / batchSize) * delaySeconds),
      delaySeconds: delaySeconds,
      batchSize: batchSize,
      avoidDuplicates: avoidDuplicates,
      sentUserIds: resumeFromId === this.currentProgress.id ? this.currentProgress.sentUserIds : [],
      failedUserIds: resumeFromId === this.currentProgress.id ? this.currentProgress.failedUserIds : [],
      blockedUserIds: resumeFromId === this.currentProgress.id ? this.currentProgress.blockedUserIds : [],
      logs: resumeFromId === this.currentProgress.id ? this.currentProgress.logs : []
    };

    // Calculate initial percent
    const processedInitial = this.currentProgress.sentCount + this.currentProgress.failedCount + this.currentProgress.blockedCount;
    this.currentProgress.percent = this.currentProgress.totalUsers > 0 
      ? Math.min(100, Math.round((processedInitial / this.currentProgress.totalUsers) * 100))
      : 0;

    // Run batch engine in background
    this.processBatches(targetUsers, payload, batchSize, delaySeconds).catch((err) => {
      console.error('[BroadcastEngine] Batch runner error:', err);
    });

    await addActivityLog({
      type: 'broadcast',
      message: `📢 Broadcast #${broadcastNum} শুরু হয়েছে: মোট ${this.currentProgress.totalUsers} জন ইউজার (Batch: ${batchSize}, Delay: ${delaySeconds}s)।`
    });

    return { 
      success: true, 
      message: `📢 Broadcast #${broadcastNum} চালু হয়েছে! ব্যাচ সাইজ ${batchSize}, বিরতি ${delaySeconds}s।`,
      taskId,
      broadcastNumber: broadcastNum
    };
  }

  public pause(): boolean {
    if (this.currentProgress.status === 'running') {
      this.pauseRequested = true;
      this.currentProgress.status = 'paused';
      this.saveHistorySnapshot('paused');
      return true;
    }
    return false;
  }

  public resume(): boolean {
    if (this.currentProgress.status === 'paused') {
      this.pauseRequested = false;
      this.currentProgress.status = 'running';
      return true;
    }
    return false;
  }

  public cancel(): boolean {
    if (this.currentProgress.status === 'running' || this.currentProgress.status === 'paused') {
      this.cancelRequested = true;
      this.currentProgress.status = 'cancelled';
      this.currentProgress.completedAt = new Date().toISOString();
      this.saveHistorySnapshot('cancelled');
      return true;
    }
    return false;
  }

  private async processBatches(
    users: any[], 
    payload: BroadcastPayload, 
    batchSize: number, 
    delaySeconds: number
  ) {
    const settings = await getSettings();

    // Prepare inline buttons
    const inlineKeyboard: any[] = [];
    if (payload.includeButtons) {
      inlineKeyboard.push([
        {
          text: settings.channelButtonText || "🎬 সব ভিডিও দেখুন (FlickCove)",
          url: settings.telegramGroupLink || "https://t.me/FlickCove_Top"
        }
      ]);
      inlineKeyboard.push([
        {
          text: settings.whatsappButtonText || "📲 ব্যাকআপ চ্যানেল (WhatsApp)",
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

    const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

    // Split target users into small batches
    const batches: any[][] = [];
    for (let i = 0; i < users.length; i += batchSize) {
      batches.push(users.slice(i, i + batchSize));
    }

    let processedUsersInQueue = 0;

    // Cache Telegram file_id from the first upload to speed up subsequent sends by 10x
    let cachedTelegramFileId: string | null = null;
    const hasPhoto = Boolean(payload.imageUrl && payload.imageUrl.trim().length > 10);

    for (let bIdx = 0; bIdx < batches.length; bIdx++) {
      if (this.cancelRequested) {
        this.currentProgress.status = 'cancelled';
        this.currentProgress.completedAt = new Date().toISOString();
        await addActivityLog({
          type: 'broadcast',
          message: `📢 Broadcast #${this.currentProgress.broadcastNumber} অ্যাডমিন কর্তৃক বাতিল করা হয়েছে। (${this.currentProgress.sentCount} জন সফল)`
        });
        this.saveHistorySnapshot('cancelled');
        break;
      }

      // Check if paused
      while (this.pauseRequested && !this.cancelRequested) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      const currentBatch = batches[bIdx];

      // Dispatch this batch
      for (const user of currentBatch) {
        if (this.cancelRequested) break;

        // Duplicate tracking check
        if (this.currentProgress.avoidDuplicates && this.currentProgress.sentUserIds.includes(user.id)) {
          continue;
        }

        this.currentProgress.currentUserId = user.id;
        this.currentProgress.currentUserName = user.firstName || user.username || `User #${user.id}`;

        let fullMessage = payload.message;
        if (payload.title) {
          fullMessage = `<b>${payload.title}</b>\n\n${payload.message}`;
        }
        fullMessage = fullMessage.replace(/{first_name}/g, user.firstName || 'বন্ধু');
        fullMessage = fullMessage.replace(/{username}/g, user.username ? `@${user.username}` : '');

        let sendResult: { ok: boolean; error?: string; retryAfter?: number };

        try {
          if (hasPhoto) {
            const photoToSend = cachedTelegramFileId || payload.imageUrl!.trim();
            const photoRes = await botEngine.sendPhoto({
              chat_id: user.id,
              photo: photoToSend,
              caption: fullMessage,
              parse_mode: payload.parseMode === 'None' ? undefined : (payload.parseMode || 'HTML'),
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
              parse_mode: payload.parseMode === 'None' ? undefined : (payload.parseMode || 'HTML'),
              reply_markup: replyMarkup
            });
          }
        } catch (netErr: any) {
          sendResult = { ok: false, error: netErr?.message || 'Network error' };
        }

        // Telegram Rate Limit (429 Too Many Requests) Auto Backoff
        if (!sendResult.ok && sendResult.retryAfter) {
          const waitTimeMs = (sendResult.retryAfter + 2) * 1000;
          console.warn(`[BroadcastEngine] Telegram flood wait hit. Backing off for ${waitTimeMs / 1000}s`);
          await new Promise((r) => setTimeout(r, waitTimeMs));

          // Retry once after flood backoff
          try {
            if (hasPhoto) {
              const photoToSend = cachedTelegramFileId || payload.imageUrl!.trim();
              const photoRes = await botEngine.sendPhoto({
                chat_id: user.id,
                photo: photoToSend,
                caption: fullMessage,
                parse_mode: payload.parseMode === 'None' ? undefined : (payload.parseMode || 'HTML'),
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
                parse_mode: payload.parseMode === 'None' ? undefined : (payload.parseMode || 'HTML'),
                reply_markup: replyMarkup
              });
            }
          } catch (retryErr: any) {
            sendResult = { ok: false, error: retryErr?.message || 'Retry failed' };
          }
        }

        const errStr = (sendResult.error || '').toLowerCase();
        const isBlocked = 
          errStr.includes('blocked') || 
          errStr.includes('deactivated') || 
          errStr.includes('chat not found') ||
          errStr.includes('403') ||
          errStr.includes('user is deactivated');

        const logEntry: BroadcastLogEntry = {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          userId: user.id,
          userName: user.firstName || user.username || `User #${user.id}`,
          success: sendResult.ok,
          status: sendResult.ok ? 'sent' : isBlocked ? 'blocked' : 'failed',
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
          // Mark as blocked_bot in database so future broadcasts skip them automatically
          await saveOrUpdateUser({
            id: user.id,
            status: 'blocked_bot'
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
        this.currentProgress.percent = this.currentProgress.totalUsers > 0
          ? Math.min(100, Math.round((totalDone / this.currentProgress.totalUsers) * 100))
          : 100;

        // Slight 40ms stagger between individual user sends in a batch (complying strictly with 30 msgs/s)
        await new Promise((r) => setTimeout(r, 45));
      }

      // Update remaining time estimate
      const remainingBatches = batches.length - (bIdx + 1);
      this.currentProgress.estimatedRemainingSeconds = remainingBatches * delaySeconds;

      // Safe Inter-batch delay (respecting Telegram rate limits)
      if (bIdx < batches.length - 1 && !this.cancelRequested) {
        await new Promise((r) => setTimeout(r, delaySeconds * 1000));
      }
    }

    if (!this.cancelRequested) {
      this.currentProgress.status = 'completed';
      this.currentProgress.percent = 100;
      this.currentProgress.completedAt = new Date().toISOString();
      this.currentProgress.estimatedRemainingSeconds = 0;

      await addActivityLog({
        type: 'broadcast',
        message: `📢 Broadcast #${this.currentProgress.broadcastNumber} সম্পন্ন: ✅ Sent: ${this.currentProgress.sentCount}, ❌ Failed: ${this.currentProgress.failedCount}, 🚫 Blocked: ${this.currentProgress.blockedCount}`
      });

      this.saveHistorySnapshot('completed');
    }
  }

  private saveHistorySnapshot(status: 'completed' | 'cancelled' | 'paused' | 'running') {
    const historyItem: BroadcastHistoryItem = {
      id: this.currentProgress.id,
      broadcastNumber: this.currentProgress.broadcastNumber,
      title: this.currentProgress.title,
      message: this.currentProgress.message || '',
      totalUsers: this.currentProgress.totalUsers,
      sentCount: this.currentProgress.sentCount,
      failedCount: this.currentProgress.failedCount,
      blockedCount: this.currentProgress.blockedCount,
      percent: this.currentProgress.percent,
      startedAt: this.currentProgress.startedAt || new Date().toISOString(),
      completedAt: this.currentProgress.completedAt,
      status: status,
      sentUserIdsCount: this.currentProgress.sentUserIds.length
    };
    saveBroadcastHistoryItem(historyItem).catch((err) => {
      console.error('[BroadcastEngine] Error saving broadcast history item:', err);
    });
  }

  // Send single test broadcast message to verify before mass sending
  public async sendTest(targetChatId: number | string, payload: BroadcastPayload): Promise<{ ok: boolean; error?: string }> {
    const settings = await getSettings();

    const inlineKeyboard: any[] = [];
    if (payload.includeButtons) {
      inlineKeyboard.push([
        {
          text: settings.channelButtonText || "🎬 সব ভিডিও দেখুন (FlickCove)",
          url: settings.telegramGroupLink || "https://t.me/FlickCove_Top"
        }
      ]);
      inlineKeyboard.push([
        {
          text: settings.whatsappButtonText || "📲 ব্যাকআপ চ্যানেল (WhatsApp)",
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

    const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

    let fullMessage = payload.message;
    if (payload.title) {
      fullMessage = `<b>${payload.title}</b>\n\n${payload.message}`;
    }
    fullMessage = fullMessage.replace(/{first_name}/g, 'Admin (Test)');
    fullMessage = fullMessage.replace(/{username}/g, '@admin');

    const hasPhoto = Boolean(payload.imageUrl && payload.imageUrl.trim().length > 10);

    if (hasPhoto) {
      return await botEngine.sendPhoto({
        chat_id: targetChatId,
        photo: payload.imageUrl!.trim(),
        caption: fullMessage,
        parse_mode: payload.parseMode === 'None' ? undefined : (payload.parseMode || 'HTML'),
        reply_markup: replyMarkup
      });
    } else {
      return await botEngine.sendMessage({
        chat_id: targetChatId,
        text: fullMessage,
        parse_mode: payload.parseMode === 'None' ? undefined : (payload.parseMode || 'HTML'),
        reply_markup: replyMarkup
      });
    }
  }
}

export const broadcastEngine = new BroadcastEngine();
