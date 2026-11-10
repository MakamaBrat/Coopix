import { getCore } from "./_lib/runtime.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const out = await getCore().handle({ route: "me", method: req.method, headers: req.headers });
    return res.status(out.status).json(out.body);
  } catch (e) {
    console.error("[me]", e);
    return res.status(500).json({ error: "server_error" });
  }
}
