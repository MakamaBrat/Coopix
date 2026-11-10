import { REQUIRED_ENV } from "./_lib/runtime.js";

// Показывает только ЗАДАНА ли переменная (true/false), значения не раскрываются.
export default function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = Object.fromEntries(REQUIRED_ENV.map((k) => [k, !!process.env[k]]));
  res.status(200).json({ ok: Object.values(env).every(Boolean), env });
}
