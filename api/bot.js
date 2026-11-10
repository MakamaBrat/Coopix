// /api/bot — вебхук Telegram-бота: подтверждение и запись оплат «Спасибо автору» (звёзды XTR).
// Подключается кнопкой в админ-панели (Настройки → Приём звёзд). Запросы без секретного заголовка отклоняются.
import { getCore } from "./_lib/runtime.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const out = await getCore().handle({ route: "bot", method: req.method, headers: req.headers, body: req.body });
    return res.status(out.status).json(out.body);
  } catch (e) {
    console.error("[bot]", e);
    return res.status(500).json({ error: "server_error" });
  }
}
