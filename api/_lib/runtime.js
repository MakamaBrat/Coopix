import { waitUntil } from "@vercel/functions";
import { createCore } from "./core.js";
import { supabaseStore } from "./store.js";
import { verifyTelegramInitData } from "./telegramAuth.js";

export const REQUIRED_ENV = ["BOT_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "ADMIN_IDS"];

let core;
export function getCore() {
  if (core) return core;
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) throw new Error("Missing env: " + missing.join(", "));

  const botToken = process.env.BOT_TOKEN;
  const notify = (chatId, text) => {
    // Без parse_mode: пользовательский текст не интерпретируется. waitUntil: Vercel не усыпит функцию до отправки.
    const p = fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch((e) => console.error("[notify]", e.message));
    try { waitUntil(p); } catch { /* вне Vercel */ }
  };

  core = createCore({
    store: supabaseStore(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY),
    verify: verifyTelegramInitData,
    botToken,
    adminIds: process.env.ADMIN_IDS.split(",").map((s) => Number(s.trim())).filter(Number.isSafeInteger),
    maxAgeSec: Number(process.env.INITDATA_MAX_AGE) || 86400,
    notify,
  });
  return core;
}
