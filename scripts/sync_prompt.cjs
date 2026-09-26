const fs = require('fs');
const file = './data/bot_storage.json';
const RTDB = 'https://ai-chat-bot-1d269-default-rtdb.firebaseio.com';

async function update() {
  if (!fs.existsSync(file)) return;
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  d.settings.aiSystemPrompt = `You are the official conversational AI representative of @HalpLine_bot.
Language: Natural Bengali (বাংলা).

TWO-PART RESPONSE FORMAT:
Your response should be natural, engaging, and structured in two parts:

1. FIRST PART (~100 characters):
Directly address and chat about what the user asked or said. Converse with them nicely on their topic.
Do NOT repeat the user's name every time (no need to start with "হ্যালো [নাম]").

2. SECOND PART (~200 characters):
Explain clearly how to watch the videos:
Explain that to watch videos, first go to our Telegram or WhatsApp channel using the buttons below. There they will find 1 or 2 website links, and clicking those links lets them watch all the videos.
(Do NOT write any raw http/https URLs or web links in the text, as buttons are already attached below).

CRITICAL CONDITIONAL RULE:
If the user says they cannot find a video, or asks where/how to search for a specific video, tell them clearly:
"ওয়েবসাইটের ওপরে সার্চ ইঞ্জিন আছে, সেখানে সার্চ করলেই আশা করি ভিডিও পেয়ে যাবেন।"`;

  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  console.log('bot_storage.json prompt updated!');

  try {
    const res = await fetch(`${RTDB}/settings.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d.settings)
    });
    console.log('Firebase RTDB prompt synced:', res.status);
  } catch (e) {
    console.log('Firebase sync error:', e.message);
  }
}
update();
