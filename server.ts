import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import { execSync } from 'child_process';
import { 
  getSettings, 
  updateSettings, 
  getAllUsers, 
  getUserById, 
  deleteUser, 
  saveOrUpdateUser, 
  getActivityLogs, 
  addActivityLog,
  getBroadcastHistory,
  deleteBroadcastHistoryItem,
  DEFAULT_COMMANDS
} from './server/firebaseService.js';
import { botEngine, detectBotCommand } from './server/botEngine.js';
import { broadcastEngine } from './server/broadcastEngine.js';
import { generateAiReply } from './server/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process-level 24/7 Crash Protection
process.on('uncaughtException', (err) => {
  console.error('[Process 24/7 Shield] Uncaught exception prevented crash:', err?.message || err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process 24/7 Shield] Unhandled rejection prevented crash at:', promise, 'reason:', reason);
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 0. 24/7 Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  const status = await botEngine.getStatus().catch(() => null);
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    botRunning: status?.isRunning ?? false
  });
});

// API Endpoints

// 1. Bot & System Status
app.get('/api/status', async (_req, res) => {
  try {
    const [botStatus, settings, users, broadcastStatus, broadcastHistory] = await Promise.all([
      botEngine.getStatus(),
      getSettings(),
      getAllUsers(),
      broadcastEngine.getProgress(),
      getBroadcastHistory()
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);
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
        blockedUsers: users.filter((u) => u.status === 'blocked_bot').length
      },
      broadcast: broadcastStatus,
      broadcastHistory: broadcastHistory
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Start Bot Polling
app.post('/api/bot/start', async (_req, res) => {
  try {
    const result = await botEngine.start();
    if (result.success) {
      await updateSettings({ isPollingActive: true });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Stop Bot Polling
app.post('/api/bot/stop', async (_req, res) => {
  try {
    const result = await botEngine.stop();
    if (result.success) {
      await updateSettings({ isPollingActive: false });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Test Token
app.post('/api/bot/test-token', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await botEngine.verifyToken(token);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4.1 Telegram Webhook Handler (24/7 Serverless Instant Wakeup)
app.post('/api/telegram-webhook', async (req, res) => {
  res.status(200).send('OK');
  try {
    if (req.body && typeof req.body === 'object') {
      await botEngine.processWebhookUpdate(req.body);
    }
  } catch (err: any) {
    console.error('[Telegram Webhook Error]', err?.message || err);
  }
});

// 4.2 Webhook Info & Status
app.get('/api/webhook/status', async (_req, res) => {
  try {
    const info = await botEngine.getWebhookInfo();
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4.3 Set Telegram Webhook
app.post('/api/webhook/set', async (req, res) => {
  try {
    let { url } = req.body || {};
    if (!url) {
      const host = req.get('x-forwarded-host') || req.get('host') || '';
      const proto = req.get('x-forwarded-proto') || 'https';
      url = `${proto}://${host}/api/telegram-webhook`;
    }
    const result = await botEngine.setWebhook(url);
    if (result.ok) {
      await updateSettings({ isPollingActive: false });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4.4 Delete Telegram Webhook (Restores 24/7 Polling)
app.post('/api/webhook/delete', async (_req, res) => {
  try {
    const result = await botEngine.deleteWebhook();
    if (result.ok) {
      await botEngine.start();
      await updateSettings({ isPollingActive: true });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. Settings CRUD
app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await getSettings();
    // Return masked Gemini key if configured via process.env
    res.json({
      success: true,
      settings: {
        ...settings,
        hasEnvGeminiKey: !!process.env.GEMINI_API_KEY
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const updated = await updateSettings(req.body);
    await addActivityLog({
      type: 'system',
      message: 'Bot settings updated by administrator.'
    });
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Users List
app.get('/api/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct message to a specific user
app.post('/api/users/direct-message', async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ success: false, error: 'User ID and text are required' });
    }

    const result = await botEngine.sendMessage({
      chat_id: userId,
      text: text,
      parse_mode: 'HTML'
    });

    if (result.ok) {
      await addActivityLog({
        type: 'outgoing_msg',
        userId: Number(userId),
        message: `Direct message sent to user #${userId}`
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Delete or remove user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    await deleteUser(userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Seed demo users if empty for immediate admin experience testing
app.post('/api/users/seed-demo', async (_req, res) => {
  try {
    const demoUsers = [
      { id: 109283741, firstName: 'Tanvir', lastName: 'Ahmed', username: 'tanvir_ahmed', messageCount: 14, status: 'active' as const },
      { id: 283746592, firstName: 'Sabbir', lastName: 'Hossain', username: 'sabbir_boss', messageCount: 8, status: 'active' as const },
      { id: 394857123, firstName: 'Rafi', lastName: 'Chowdhury', username: 'rafi_c', messageCount: 22, status: 'active' as const },
      { id: 482910384, firstName: 'Mahmudul', lastName: 'Hasan', username: 'mahmud_99', messageCount: 5, status: 'active' as const },
      { id: 573829102, firstName: 'Arif', lastName: 'Rahman', username: 'arif_2026', messageCount: 19, status: 'active' as const }
    ];

    for (const u of demoUsers) {
      await saveOrUpdateUser(u);
    }

    res.json({ success: true, count: demoUsers.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6.5. Message Requests APIs (No message data stored in database per user request)
app.get('/api/message-requests', async (_req, res) => {
  res.json({ success: true, requests: [] });
});

app.post('/api/message-requests/process-pending', async (_req, res) => {
  res.json({ success: true, processed: 0, errors: 0 });
});

app.delete('/api/message-requests', async (_req, res) => {
  res.json({ success: true });
});

// 7. Broadcast APIs
app.post('/api/broadcast/start', async (req, res) => {
  try {
    const { resumeFromId, ...payload } = req.body;
    const result = await broadcastEngine.startBroadcast(payload, resumeFromId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/broadcast/status', async (_req, res) => {
  try {
    const progress = broadcastEngine.getProgress();
    res.json({ success: true, progress });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/broadcast/history', async (_req, res) => {
  try {
    const history = await getBroadcastHistory();
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/broadcast/history/:id', async (req, res) => {
  try {
    const ok = await deleteBroadcastHistoryItem(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/broadcast/pause', (_req, res) => {
  const ok = broadcastEngine.pause();
  res.json({ success: ok });
});

app.post('/api/broadcast/resume', (_req, res) => {
  const ok = broadcastEngine.resume();
  res.json({ success: ok });
});

app.post('/api/broadcast/cancel', (_req, res) => {
  const ok = broadcastEngine.cancel();
  res.json({ success: ok });
});

app.post('/api/broadcast/test-send', async (req, res) => {
  try {
    const { targetChatId, payload } = req.body;
    if (!targetChatId) {
      return res.status(400).json({ ok: false, error: 'Target Chat ID is required for testing' });
    }
    const result = await broadcastEngine.sendTest(targetChatId, payload);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 8. Bot Simulator (Interactive chat test for admin)
app.post('/api/simulate-chat', async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    const settings = await getSettings();

    const buttons: Array<{ text: string; url?: string }> = [];
    if (settings.showInlineButtons) {
      buttons.push(
        { text: settings.channelButtonText || "🎬 সব ভিডিও দেখুন (FlickCove)", url: settings.telegramGroupLink || "https://t.me/FlickCove_Top" },
        { text: settings.whatsappButtonText || "📲 ব্যাকআপ চ্যানেল (WhatsApp)", url: settings.whatsappBackupLink || "https://whatsapp.com/channel/0029Vb7fVTzDzgT78gexpV3V" }
      );
    }

    const detected = detectBotCommand(message);
    if (detected) {
      let reply = '';
      if (detected === 'start') {
        reply = settings.commands?.startReply || DEFAULT_COMMANDS.startReply;
      } else if (detected === 'video_help') {
        reply = settings.commands?.videoHelpReply || DEFAULT_COMMANDS.videoHelpReply;
      } else if (detected === 'new_video') {
        reply = settings.commands?.newVideoReply || DEFAULT_COMMANDS.newVideoReply;
      } else if (detected === 'backup_channel') {
        reply = settings.commands?.backupChannelReply || DEFAULT_COMMANDS.backupChannelReply;
      }

      return res.json({
        success: true,
        reply,
        mode: `command_${detected}`,
        buttons
      });
    }

    if (settings.replyMode === 'static') {
      return res.json({
        success: true,
        reply: settings.staticReplyMessage,
        mode: 'static_reply',
        buttons
      });
    }

    // AI Mode
    const aiReply = await generateAiReply(message, 'Admin Demo', chatHistory);
    return res.json({
      success: true,
      reply: aiReply,
      mode: 'gemini_ai',
      buttons
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Activity Logs
app.get('/api/logs', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await getActivityLogs(limit);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Direct Project Source ZIP Download
app.get('/api/download-zip', async (_req, res) => {
  try {
    const zipPath = path.resolve(__dirname, 'public/halpline-bot-source.zip');
    // Ensure public dir exists
    const publicDir = path.resolve(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    // Re-generate fresh zip using python3 zipfile
    try {
      execSync('python3 -c "import os, zipfile; z = zipfile.ZipFile(\'public/halpline-bot-source.zip\', \'w\', zipfile.ZIP_DEFLATED); [z.write(os.path.join(root, f), os.path.relpath(os.path.join(root, f), \'.\')) for root, dirs, files in os.walk(\'.\') if not any(x in root for x in [\'node_modules\', \'.git\', \'dist\', \'.aistudio\']) for f in files if f != \'halpline-bot-source.zip\']"', { cwd: __dirname });
    } catch (e) {
      console.warn('[ZIP Gen Warn]', e);
    }
    res.download(zipPath, 'halpline-bot-source.zip');
  } catch (err: any) {
    console.error('[Download ZIP Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Direct GitHub Push API
app.post('/api/github-push', async (req, res) => {
  try {
    const { repoUrl, personalAccessToken, branch = 'main', commitMessage = 'Update bot project' } = req.body;
    
    if (!repoUrl || !personalAccessToken) {
      return res.status(400).json({ success: false, error: 'GitHub Repo URL এবং Personal Access Token প্রয়োজন।' });
    }

    // Clean up repoUrl
    let cleanUrl = repoUrl.trim();
    // remove trailing slash or .git
    cleanUrl = cleanUrl.replace(/\/+$/, '');
    if (!cleanUrl.endsWith('.git')) {
      cleanUrl += '.git';
    }
    // Extract hostname and repo path e.g. github.com/user/repo.git
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ success: false, error: 'সঠিক GitHub Repository URL দিন (যেমন: https://github.com/username/repo)' });
    }

    const authUrl = `https://${encodeURIComponent(personalAccessToken.trim())}@github.com/${match[1]}/${match[2]}`;

    // Initialize git if needed
    try {
      execSync('git status', { cwd: __dirname, stdio: 'ignore' });
    } catch {
      execSync('git init', { cwd: __dirname });
    }

    execSync(`git branch -M ${branch}`, { cwd: __dirname });
    execSync('git add .', { cwd: __dirname });
    
    // Commit if there are changes
    try {
      execSync(`git -c user.name="BotAdmin" -c user.email="admin@halplinebot.local" commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: __dirname });
    } catch {
      // Nothing new to commit, which is fine
    }

    // Set remote
    try {
      execSync('git remote remove origin', { cwd: __dirname, stdio: 'ignore' });
    } catch {}
    
    execSync(`git remote add origin ${authUrl}`, { cwd: __dirname });

    // Push to GitHub
    const pushOutput = execSync(`git push -u origin ${branch} --force`, { 
      cwd: __dirname,
      encoding: 'utf-8',
      timeout: 30000 
    });

    // Remove token from remote for safety
    try {
      execSync(`git remote set-url origin https://github.com/${match[1]}/${match[2]}`, { cwd: __dirname });
    } catch {}

    res.json({
      success: true,
      message: `সফলভাবে GitHub-এ পুশ সম্পন্ন হয়েছে! Repository: https://github.com/${match[1]}/${match[2].replace('.git', '')}`,
      repoWebUrl: `https://github.com/${match[1]}/${match[2].replace('.git', '')}`,
      details: pushOutput
    });
  } catch (err: any) {
    console.error('[GitHub Push Error]', err);
    res.status(500).json({ 
      success: false, 
      error: `GitHub পুশ ব্যর্থ হয়েছে: ${err.stderr || err.message}` 
    });
  }
});


// Vite Middleware in Dev, Static Files in Production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.resolve(__dirname, 'index.html'))
      ? __dirname
      : (fs.existsSync(path.resolve(__dirname, 'dist')) ? path.resolve(__dirname, 'dist') : __dirname);
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[Server] Running on port ${PORT} (dev mode: ${!isProduction})`);
    
    // Automatically verify token and initiate bot polling if enabled
    try {
      const settings = await getSettings();
      if (settings.botToken) {
        console.log('[Server] Auto-starting Telegram Bot polling...');
        const result = await botEngine.start();
        if (result.success) {
          await updateSettings({ isPollingActive: true });
        }
        console.log('[Server] Bot init result:', result.message);
      }
    } catch (err: any) {
      console.warn('[Server] Auto-start bot warning:', err.message);
    }

    // 24/7 Keep-Alive self-ping (keeps container active and event-loop warm)
    setInterval(async () => {
      try {
        await fetch(`http://127.0.0.1:${PORT}/api/health`).catch(() => {});
      } catch (e) {}
    }, 2 * 60 * 1000);
  });
}

startServer();
