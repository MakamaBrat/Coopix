// /api/subs, /api/subs/:id, /api/subs/:id/file (маршруты :id переписаны в vercel.json на query)
import { getCore } from "./_lib/runtime.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const out = await getCore().handle({
      route: "subs",
      method: req.method,
      id: typeof req.query.id === "string" ? req.query.id : undefined,
      file: req.query.file === "1",
      headers: req.headers,
      body: req.body,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    console.error("[subs]", e); // детали только в логах Vercel, клиенту не отдаём
    return res.status(500).json({ error: "server_error" });
  }
}
