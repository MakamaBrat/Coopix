import test from "node:test";
import assert from "node:assert/strict";
import { sign, TOK } from "./helpers.js";

const mkRes = () => { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };

test("health: показывает только true/false, без значений", async () => {
  process.env.BOT_TOKEN = TOK; delete process.env.SUPABASE_SERVICE_KEY;
  const { default: health } = await import("../api/health.js");
  const res = mkRes(); health({}, res);
  assert.equal(res.body.ok, false); assert.equal(res.body.env.BOT_TOKEN, true); assert.equal(res.body.env.SUPABASE_SERVICE_KEY, false);
  assert.ok(!JSON.stringify(res.body).includes(TOK));
});

test("без переменных окружения: 500 server_error, детали клиенту не уходят", async () => {
  for (const k of ["BOT_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "ADMIN_IDS"]) delete process.env[k];
  const { default: subs } = await import("../api/subs.js");
  const res = mkRes(); await subs({ method: "GET", query: {}, headers: {} }, res);
  assert.equal(res.code, 500); assert.deepEqual(res.body, { error: "server_error" });
});

test("с окружением: 401 без подписи, /api/me отвечает по подписи; база недоступна -> 500 без утечки", async () => {
  Object.assign(process.env, { BOT_TOKEN: TOK, SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_SERVICE_KEY: "k", ADMIN_IDS: "1, 2" });
  const { default: subs } = await import("../api/subs.js");
  const { default: me } = await import("../api/me.js");
  const initData = sign({ auth_date: Math.floor(Date.now() / 1000), user: JSON.stringify({ id: 2, first_name: "A" }) });

  let res = mkRes(); await subs({ method: "GET", query: {}, headers: {} }, res);
  assert.equal(res.code, 401);

  // база недоступна: даже /me не отвечает (нельзя проверить бан), деталей клиент не видит
  res = mkRes(); await me({ method: "GET", headers: { "x-tg-init": initData } }, res);
  assert.equal(res.code, 500); assert.deepEqual(res.body, { error: "server_error" });

  res = mkRes(); await subs({ method: "GET", query: {}, headers: { "x-tg-init": initData } }, res);
  assert.equal(res.code, 500); assert.deepEqual(res.body, { error: "server_error" });
  assert.equal(res.headers["Cache-Control"], "no-store");
});
