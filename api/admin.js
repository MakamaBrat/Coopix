// /api/admin?r=stats|users|user|news|wallet|team — панель управления (роль проверяется на сервере в core.js)
import { getCore } from "./_lib/runtime.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const out = await getCore().handle({ route: "admin", method: req.method, query: req.query ?? {}, headers: req.headers, body: req.body });
    return res.status(out.status).json(out.body);
  } catch (e) {
    console.error("[admin]", e);
    return res.status(500).json({ error: "server_error" });
  }
}
