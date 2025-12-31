const http = require('http');

http.createServer((req, res) => {
  res.write("Bot is running!"); // Tarayıcıdan baktığında gözükecek mesaj
  res.end();
}).listen(process.env.PORT || 8080); // Render veya yerel port




require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;

const GROUP_CHAT_ID = "-4932570000"; // komutların yazıldığı grup
const DM_CHAT_ID = "1562349713";     // mesajların gittiği özel chat

const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    interval: 1000,
    autoStart: true
  }
});

/* DURUM DEĞİŞKENLERİ */
let systemActive = false;
let tired = false;

let startTime = 0;
let lastMsgTime = 0;
let tiredStart = 0;
let nextMessageTime = 0;

/* ZAMAN AYARLARI */
const ACTIVE_MSG_INTERVAL = 10_000;   // normal mesaj aralığı
const TOTAL_TIME = 30 * 60 * 1000;    // toplam çalışma süresi (30 dk)
const TIRED_TIME = 20_000;            // yorgunluk süresi
const START_DELAY = 5_000;            // başlarken 5 sn bekleme

/* MESAJ DİZİSİ – ESP8266 İLE AYNI */
const activeMessages = [
  "Çok iyi gidiyorsun 😈",
  "senin karın olmak istiyorum",
  "Durmak yok🥵",
"yarrağa doyur beni👅",
  "Aydoğanım…",
  "biraz daha sert",
  "hadi devam et",
  "sakın durma",
  "biraz daha hızlı"
];

function randomMsg() {
  return activeMessages[
    Math.floor(Math.random() * activeMessages.length)
  ];
}

/* KOMUTLAR */
bot.on("message", msg => {
  if (!msg.text) return;

  const chatId = msg.chat.id.toString();
  const text = msg.text.toLowerCase();

  if (chatId !== GROUP_CHAT_ID) return;

  if (text === "başla" && !systemActive) {
    systemActive = true;
    tired = false;

    startTime = Date.now();
    lastMsgTime = 0;
    nextMessageTime = Date.now() + START_DELAY;

    bot.sendMessage(DM_CHAT_ID, "hazırım… ❤️‍🔥 hadi gir ");
    return;
  }

  if (text === "dur" && systemActive) {
    systemActive = false;
    bot.sendMessage(DM_CHAT_ID, "tamam durdum 🖤");
  }
});

/* ANA DÖNGÜ */
setInterval(() => {
  if (!systemActive) return;

  const now = Date.now();

  /* TOPLAM SÜRE BİTTİ */
  if (now - startTime >= TOTAL_TIME) {
    systemActive = false;
    bot.sendMessage(DM_CHAT_ID, "ben bittim artık…");
    return;
  }

  /* RASTGELE YORGUNLUK */


if (
  !tired &&
  now - startTime > 3 * 60 * 1000 &&
  Math.random() > 0.995
) {


    tired = true;
    tiredStart = now;
    bot.sendMessage(DM_CHAT_ID, "ay dur dayanamıyooom…");
    return;
  }

  /* YORGUNLUK BİTTİ */
  if (tired && now - tiredStart >= TIRED_TIME) {
    tired = false;
    nextMessageTime = now + 2000;
    bot.sendMessage(DM_CHAT_ID, "hadi devam 😈 gir götüme");
    return;
  }

  /* NORMAL MESAJ */
  if (
    !tired &&
    now >= nextMessageTime &&
    now - lastMsgTime >= ACTIVE_MSG_INTERVAL
  ) {
    lastMsgTime = now;
    nextMessageTime = now + ACTIVE_MSG_INTERVAL;
    bot.sendMessage(DM_CHAT_ID, randomMsg());
  }

}, 1000);

/* CTRL + C İLE TEMİZ KAPANMA */
process.on("SIGINT", () => {
  console.log("Bot kapatılıyor…");
  bot.stopPolling();
  process.exit();
});

console.log("Telegram bot çalışıyor ✅");
