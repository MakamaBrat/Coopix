// /api/hub?r=stats|reviews|avatars|profile|post|track|activity|feed — отзывы, профили и посты, счётчики игр, журнал и график действий.
// Личность, бан и права проверяются на сервере (core.js), все ограничения по частоте и размеру лежат в _lib/hub.js.
import { getCore } from "./_lib/runtime.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const out = await getCore().handle({ route: "hub", method: req.method, query: req.query ?? {}, headers: req.headers, body: req.body });
    return res.status(out.status).json(out.body);
  } catch (e) {
    console.error("[hub]", e);
    return res.status(500).json({ error: "server_error" });
  }
}
