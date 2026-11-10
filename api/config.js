// /api/config — новости и адрес доната для сайта. Забаненному отвечает 403 banned: сайт показывает экран блокировки.
import { getCore } from "./_lib/runtime.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const out = await getCore().handle({ route: "config", method: req.method, headers: req.headers });
    return res.status(out.status).json(out.body);
  } catch (e) {
    console.error("[config]", e);
    return res.status(500).json({ error: "server_error" });
  }
}
