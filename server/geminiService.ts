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

function setModelCooldown(modelName: string, durationMs: number = 60000) {
  modelCooldowns.set(modelName, Date.now() + durationMs);
}

// Context-aware diverse fallbacks in case network drops or all models fail
function getSmartFallback(userMessage: string, userFirstName?: string): string {
  const lower = (userMessage || '').toLowerCase();
  const namePart = userFirstName ? `${userFirstName}, ` : '';
  
  if (
    lower.includes('খুঁজে পাচ্ছি না') || 
    lower.includes('পাচ্ছি না') || 
    lower.includes('খুজে পাই না') || 
    lower.includes('খুঁজব') || 
    lower.includes('কোথায় পাব') ||
    lower.includes('কোথায় পাব')
  ) {
    return `${namePart}ওয়েবসাইটের ওপরের অংশে একটি সার্চ ইঞ্জিন অপশন রয়েছে। সেখানে কাঙ্ক্ষিত ভিডিও বা টিকটকারের নাম লিখে সার্চ করলেই সহজেই ভিডিও পেয়ে যাবেন!`;
  }

  if (
    lower.includes('ভিডিও') || 
    lower.includes('মুভি') || 
    lower.includes('video') || 
    lower.includes('টিকটক') || 
    lower.includes('tiktok') || 
    lower.includes('নতুন')
  ) {
    const variations = [
      `এখানে সব বাংলাদেশী নতুন ভাইরাল ভিডিও ও টিকটকারদের কনটেন্ট রয়েছে। সরাসরি দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলের বাটনে চাপ দিন, সেখানে ওয়েবসাইটের লিঙ্ক পেয়ে যাবেন।`,
      `আমাদের প্ল্যাটফর্মে নিয়মিত নতুন নতুন ভিডিও ও টিকটক কনটেন্ট আপলোড করা হয়। নিচের বাটনে ক্লিক করে চ্যানেলে যুক্ত হয়ে সব ভিডিও উপভোগ করুন!`,
      `সব ধরনের আকর্ষণীয় বাংলাদেশী ও টিকটক ভিডিও দেখতে নিচের চ্যানেলগুলোতে যোগ দিন। চ্যানেলের ভেতরে ওয়েবসাইটের প্রবেশ লিঙ্ক দেওয়া আছে।`
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  if (lower.includes('কেমন') || lower.includes('হ্যালো') || lower.includes('hello') || lower.includes('hi') || lower.includes('সালাম')) {
    const greetings = [
      `হ্যালো! আশা করি আপনি ভালো আছেন। আমাদের নতুন সব ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যুক্ত হোন।`,
      `সালাম ও শুভেচ্ছা! আপনার দিনটি শুভ হোক। চমৎকার সব বিনোদনমূলক ভিডিও পেতে নিচের বাটনে ক্লিক করে আমাদের চ্যানেলে যোগ দিন।`,
      `হ্যালো ${namePart}! কেমন আছেন? সব বিনোদন ও ভিডিও কালেকশন দেখতে নিচের চ্যানেল বাটনগুলোতে ক্লিক করুন।`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  const defaultReplies = [
    `আপনার সুন্দর বার্তার জন্য ধন্যবাদ! বিনোদনের চমৎকার সব ভিডিও ও কনটেন্ট দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলে যুক্ত হোন। সেখানে ওয়েবসাইটের লিঙ্ক পেয়ে যাবেন।`,
    `ধন্যবাদ আপনার মেসেজের জন্য! সব বাংলাদেশী ভাইরাল ভিডিও দেখতে নিচে দেওয়া টেলিগ্রাম বা WhatsApp চ্যানেলের বাটনে ক্লিক করুন।`,
    `আপনার প্রশ্নের জন্য ধন্যবাদ! ভিডিও দেখার বিস্তারিত উপায় ও ওয়েবসাইটের লিঙ্ক পেতে নিচের চ্যানেলগুলোতে যুক্ত থাকুন।`
  ];
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}

export async function generateAiReply(
  userMessage: string, 
  userFirstName?: string, 
  chatHistory?: Array<{ role: 'user' | 'bot'; text: string }>
): Promise<string> {
  const settings = await getSettings();

  // Pick valid API key
  const apiKey = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) || 
                 (settings.geminiApiKey && settings.geminiApiKey.trim()) || 
                 "";

  if (!apiKey) {
    return getSmartFallback(userMessage, userFirstName);
  }

  const systemInstruction = `You are the official conversational AI representative of @HalpLine_bot.
Language: Natural Bengali (বাংলা).

CORE BEHAVIOR & RULES:
1. ইউজার যে বিষয়েই কথা বলুক বা প্রশ্ন করুক (লেখাপড়া, বিজ্ঞান, হাই/হ্যালো, গল্প, আবহাওয়া, দিনকাল বা যেকোনো সাধারণ বিষয়), প্রথমে আন্তরিক ও বুদ্ধিমানভাবে ১-২ বাক্যে তার কথার প্রাসঙ্গিক উত্তর দিন। কখনোই ইউজারের কথা উপেক্ষা করে সরাসরি কপি-পেস্ট রোবটের মতো উত্তর দেবেন না।
2. যদি ইউজার সরাসরি ভিডিও সম্পর্কে জানতে চায় (যেমন: কি ভিডিও আছে, টিকটক আছে কিনা, মুভি আছে কিনা):
   বলুন: "এখানে সব বাংলাদেশী ভিডিও ও চমৎকার টিকটকারদের নতুন ভিডিও পাওয়া যায়। ভিডিও দেখতে নিচের টেলিগ্রাম বা WhatsApp চ্যানেলের বাটনে যুক্ত হোন, সেখানে ওয়েবসাইটের লিঙ্ক পেয়ে যাবেন।"
3. যদি ইউজার বলে ভিডিও খুঁজে পাচ্ছে না বা কোথায় সার্চ করবে:
   বলুন: "ওয়েবসাইটের ওপরের সার্চ ইঞ্জিন অপশনে সার্চ করলেই আশা করি আপনার কাঙ্ক্ষিত ভিডিওটি পেয়ে যাবেন।"
4. অন্যান্য সাধারণ কথার ক্ষেত্রে:
   - প্রথমাংশ: ইউজারের কথার সুন্দর, মানবিক ও আন্তরিক উত্তর দিন।
   - শেষাংশ: বিনোদনের সব চমৎকার বাংলাদেশী ভিডিও দেখতে নিচের চ্যানেলে যুক্ত থাকার জন্য সংক্ষেপে আমন্ত্রণ জানান।
5. খুব গুরুত্বপূর্ণ: আপনার উত্তরের ভেতরে কোনো কাঁচা http:// বা https:// ওয়েব লিঙ্ক লিখবেন না। কারণ মেসেজের নিচে অলরেডি সুন্দর চ্যানেল বাটন যুক্ত রয়েছে।`;

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
        text: userFirstName ? `User (${userFirstName}) says: ${userMessage}` : userMessage 
      }]
    });

    // Primary fast models: gemini-3.1-flash-lite is fastest and avoids 429 quota exhaustion
    const modelCandidates = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
    let reply = "";

    for (const modelName of modelCandidates) {
      if (isModelCoolingDown(modelName)) {
        continue;
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI generation timeout')), 10000)
        );

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        reply = response.text?.trim() || "";
        if (reply) break;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');
        if (isQuota) {
          setModelCooldown(modelName, 60000); // 1-minute cooldown for rate-limited model
        }
      }
    }

    if (!reply) {
      return getSmartFallback(userMessage, userFirstName);
    }

    // Strip any accidental URLs from message text since buttons are attached
    reply = reply.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();

    return reply || getSmartFallback(userMessage, userFirstName);
  } catch (error: any) {
    return getSmartFallback(userMessage, userFirstName);
  }
}
