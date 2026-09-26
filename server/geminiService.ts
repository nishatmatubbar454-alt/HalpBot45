import { GoogleGenAI } from "@google/genai";
import { getSettings } from "./firebaseService.js";

// Cooldown tracker for models that hit 429 rate limit
const modelCooldowns = new Map<string, number>();

function isModelCoolingDown(modelName: string): boolean {
  const until = modelCooldowns.get(modelName);
  if (!until) return false;
  if (Date.now() < until) return true;
  modelCooldowns.delete(modelName);
  return false;
}

function setModelCooldown(modelName: string, durationMs: number = 180000) {
  modelCooldowns.set(modelName, Date.now() + durationMs);
}

// Context-aware fallback if API quota is reached
function getSmartFallback(userMessage: string): string {
  const lower = (userMessage || '').toLowerCase();
  
  // If user says cannot find video or asking where to search
  if (
    lower.includes('খুঁজে পাচ্ছি না') || 
    lower.includes('পাচ্ছি না') || 
    lower.includes('খুজে পাই না') || 
    lower.includes('খুঁজব') || 
    lower.includes('সার্চ') ||
    lower.includes('কোথায় পাব') ||
    lower.includes('কোথায় পাব')
  ) {
    return "ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আশা করি ভিডিও পেয়ে যাবেন।";
  }

  // If user asks about videos, content, TikTok, movies
  if (
    lower.includes('ভিডিও') || 
    lower.includes('মুভি') || 
    lower.includes('video') || 
    lower.includes('movie') ||
    lower.includes('টিকটক') ||
    lower.includes('tiktok') ||
    lower.includes('বাংলাদেশ') ||
    lower.includes('bangla') ||
    lower.includes('লিংক') ||
    lower.includes('নতুন') ||
    lower.includes('কী আছে') ||
    lower.includes('কি আছে') ||
    lower.includes('কী পাওয়া যায়') ||
    lower.includes('কি পাওয়া যায়') ||
    lower.includes('কী পাওয়া যায়') ||
    lower.includes('কি পাওয়া যায়')
  ) {
    return "এখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের ভিডিও, সুন্দর সুন্দর ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব ভিডিও দেখতে পারবেন।";
  }

  // Greeting
  if (lower.includes('কেমন') || lower.includes('হ্যালো') || lower.includes('hello') || lower.includes('hi') || lower.includes('সালাম')) {
    return "আশা করি আপনি ভালো আছেন! আমাদের নতুন সব ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যুক্ত হোন। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব চমৎকার ভিডিও দেখতে পারবেন।";
  }

  // Default two-part response
  return "আপনার বার্তার জন্য ধন্যবাদ! বিনোদনের চমৎকার সব ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।";
}

export async function generateAiReply(
  userMessage: string, 
  userFirstName?: string, 
  chatHistory?: Array<{ role: 'user' | 'bot'; text: string }>
): Promise<string> {
  const lower = (userMessage || '').trim().toLowerCase();

  // Instant response (0ms) if user is searching / cannot find video
  if (
    lower.includes('খুঁজে পাচ্ছি না') || 
    lower.includes('পাচ্ছি না') || 
    lower.includes('খুজে পাই না') || 
    lower.includes('খুঁজব') || 
    lower.includes('কিভাবে খুঁজব') ||
    lower.includes('কীভাবে খুঁজব') ||
    lower.includes('সার্চ') ||
    lower.includes('কোথায় পাব') ||
    lower.includes('কোথায় পাব') ||
    lower.includes('লিংক কোথায়') ||
    lower.includes('লিংক কোথায়')
  ) {
    return "ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আশা করি ভিডিও পেয়ে যাবেন।";
  }

  const settings = await getSettings();

  // Try environment key first, then fallback to configured key
  const apiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;

  if (!apiKey) {
    return getSmartFallback(userMessage);
  }

  const systemInstruction = `You are the official conversational AI representative of @HalpLine_bot.
Language: Natural Bengali (বাংলা).

RULES FOR EVERY RESPONSE:

CASE 1: If the user says they CANNOT find a video or asks how/where to search for a video (যেমন: ভিডিও খুঁজে পাচ্ছি না, কীভাবে খুঁজব, লিংক পাচ্ছি না):
Always reply:
"ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আশা করি ভিডিও পেয়ে যাবেন।"

CASE 2: If the user asks about videos or what kind of videos are available (যেমন: ভিডিও দেখতে চাই, কি ভিডিও আছে, টিকটক আছে কিনা, মুভি আছে কিনা, ইত্যাদি):
Always reply:
"এখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের ভিডিও, সুন্দর সুন্দর ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।"

CASE 3: For ALL other user messages (general questions, greetings, chit-chat, etc.):
You MUST compose your reply in TWO CLEAR PARTS:
- Part 1 (প্রথম প্রায় ১০০ অক্ষর): ইউজার যে বিষয়ে জানতে চেয়েছে বা কথা বলেছে, সে বিষয়ে আন্তরিকভাবে প্রাসঙ্গিক ১-২ বাক্যে উত্তর দিন।
- Part 2 (পরের অংশ): এরপর স্পষ্টভাবে বলুন:
"এখানে সব বাংলাদেশী ভিডিও ও টিকটকারের সুন্দর সুন্দর ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।"

IMPORTANT: DO NOT include raw http/https links or URLs in your text. The buttons below already provide direct links.

EXAMPLES OF DESIRED REPLIES:

Example 1:
User: "ভিডিও দেখতে চাই" বা "কী কী ভিডিও পাওয়া যায়?"
Assistant: "এখানে সব বাংলাদেশী ভিডিও পাওয়া যায়। বিভিন্ন ধরনের টিকটকারের ভিডিও, সুন্দর সুন্দর ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।"

Example 2:
User: "আজকে খুব গরম পড়ছে ভাই"
Assistant: "সত্যিই, আজ প্রচণ্ড গরম পড়েছে! এমন আবহাওয়ায় সাবধানে থাকবেন এবং প্রচুর পানি খাবেন। আমাদের সব বাংলাদেশী ভিডিও ও চমৎকার টিকটকারের ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যান। সেখানে ১ বা ২টি ওয়েবসাইটের লিংক পাবেন, ওই লিংকে ক্লিক করলেই সব নতুন ভিডিও দেখতে পারবেন।"

Example 3:
User: "ভিডিও খুঁজে পাচ্ছি না ভাই"
Assistant: "ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আশা করি ভিডিও পেয়ে যাবেন।"`;

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents: any[] = [];

    if (chatHistory && chatHistory.length > 0) {
      const recent = chatHistory.slice(-4);
      for (const msg of recent) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ 
        text: userMessage 
      }]
    });

    // Ultra-fast response: gemini-3.8-flash first, then flash-latest and 3.1-flash-lite
    const modelCandidates = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let reply = "";

    for (const modelName of modelCandidates) {
      if (isModelCoolingDown(modelName)) {
        continue;
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI generation timeout')), 3500)
        );

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 160,
          },
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        reply = response.text?.trim() || "";
        if (reply) break;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');
        if (isQuota) {
          setModelCooldown(modelName, 180000); // 3-minute cooldown for rate-limited model
        }
      }
    }

    if (!reply) {
      return getSmartFallback(userMessage);
    }

    // Strip any accidental URLs from message text since buttons are attached
    reply = reply.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();

    // Cleanly clamp to ~350 characters if needed
    if (reply.length > 350) {
      const trimmed = reply.substring(0, 350);
      const lastPunc = Math.max(
        trimmed.lastIndexOf('।'),
        trimmed.lastIndexOf('!'),
        trimmed.lastIndexOf('?'),
        trimmed.lastIndexOf('.')
      );
      if (lastPunc > 150) {
        reply = trimmed.substring(0, lastPunc + 1);
      } else {
        reply = trimmed.trim();
      }
    }

    return reply || getSmartFallback(userMessage);
  } catch (error: any) {
    return getSmartFallback(userMessage);
  }
}
