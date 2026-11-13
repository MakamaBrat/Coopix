import test from "node:test";
import assert from "node:assert/strict";
import { setup, init, body } from "./mem.js";
import { TOK } from "./helpers.js";
import { webhookSecret, makePayload, widgetHtml, RANDOM_BTN } from "../api/_lib/thanks.js";
import { readFileSync } from "node:fs";
import { WIDGET_GAMES } from "../api/_lib/widgets.js";

const MAIN = 1, ANN = 42, BOB = 43;
async function world() {
  const w = setup();
  for (const id of [MAIN, ANN, BOB]) await w.call("me", "GET", init(id));
  const sub = (await w.call("subs", "POST", init(ANN), { body: body({ title: "Игра Анны" }) })).body;
  const game = (await w.call("admin", "POST", init(MAIN), { query: { r: "publish" }, body: { submission: sub.id, access: "public" } })).body;
  const hub = (r, method, who, o = {}) => w.call("hub", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  const hook = (u, secret = webhookSecret(TOK)) => w.call("bot", "POST", null, { headers: { "x-telegram-bot-api-secret-token": secret }, body: u });
  return { ...w, game, hub, hook };
}
const pre = (game, uid, stars, o = {}) => ({ pre_checkout_query: { id: "q1", from: { id: uid }, currency: "XTR", total_amount: stars, invoice_payload: makePayload(game, uid, stars), ...o } });
const paid = (game, uid, stars, charge = "c1") => ({ message: { from: { id: uid }, successful_payment: { currency: "XTR", total_amount: stars, invoice_payload: makePayload(game, uid, stars), telegram_payment_charge_id: charge } } });

test("спасибо: счёт в звёздах создаётся только на разрешённые суммы и видимые игры", async () => {
  const w = await world();
  const r = await w.hub("thank", "POST", BOB, { body: { game: w.game.id, stars: 50 } });
  assert.equal(r.status, 200); assert.match(r.body.link, /^https:\/\/t\.me\//);
  const [method, p] = w.tg.at(-1);
  assert.equal(method, "createInvoiceLink"); assert.equal(p.currency, "XTR"); assert.equal(p.prices[0].amount, 50); assert.equal(p.payload, makePayload(w.game.id, BOB, 50));
  for (const stars of [0, 7, -50, 1e6, "50"]) assert.equal((await w.hub("thank", "POST", BOB, { body: { game: w.game.id, stars } })).status, 400, String(stars));
  assert.equal((await w.hub("thank", "POST", BOB, { body: { game: "nope", stars: 10 } })).status, 404);
});

test("спасибо: вебхук без секрета отклоняется, оплата не записывается", async () => {
  const w = await world();
  assert.equal((await w.hook(paid(w.game.id, BOB, 50), "wrong")).status, 401);
  assert.equal((await w.call("bot", "POST", null, { headers: {}, body: paid(w.game.id, BOB, 50) })).status, 401);
  assert.equal(w.store.thanks.length, 0);
});

test("спасибо: pre_checkout проверяет сумму, валюту и плательщика", async () => {
  const w = await world();
  await w.hook(pre(w.game.id, BOB, 50));
  assert.deepEqual(w.tg.at(-1), ["answerPreCheckoutQuery", { pre_checkout_query_id: "q1", ok: true }]);
  for (const o of [{ total_amount: 1 }, { currency: "USD" }, { from: { id: 999 } }]) {
    await w.hook(pre(w.game.id, BOB, 50, o));
    assert.equal(w.tg.at(-1)[1].ok, false, JSON.stringify(o));
  }
  await w.hook(pre("nope", BOB, 50)); assert.equal(w.tg.at(-1)[1].ok, false);
});

test("спасибо: оплата пишется один раз, считается в статистике игры, автору приходит сообщение", async () => {
  const w = await world();
  await w.hook(paid(w.game.id, BOB, 50, "c1"));
  await w.hook(paid(w.game.id, BOB, 50, "c1")); // Telegram повторил вебхук
  await w.hook(paid(w.game.id, MAIN, 100, "c2"));
  assert.equal(w.store.thanks.length, 2);
  const st = (await w.hub("stats", "GET", BOB, { query: { ids: w.game.id } })).body.games[w.game.id];
  assert.equal(st.stars, 150); assert.equal(st.backers, 2);
  assert.ok(w.sent.some(([c, t]) => c === ANN && /поддержали: ⭐ 50/.test(t)));
  assert.ok(w.sent.some(([c, t]) => c === BOB && /Спасибо/.test(t)));
  assert.equal(w.store.events.filter((e) => e.type === "thank").length, 2);
});

test("спасибо: подключение вебхука только главным админом и только на https/api/bot", async () => {
  const w = await world();
  const r = (who, url) => w.call("admin", "POST", init(who), { query: { r: "webhook" }, body: { url } });
  assert.equal((await r(BOB, "https://a.vercel.app/api/bot")).status, 403);
  assert.equal((await r(MAIN, "http://a.vercel.app/api/bot")).status, 400);
  assert.equal((await r(MAIN, "https://a.vercel.app/x")).status, 400);
  assert.equal((await r(MAIN, "https://a.vercel.app/api/bot")).status, 200);
  const wh = w.tg.findLast((c) => c[0] === "setWebhook"); assert.ok(wh); assert.equal(wh[1].secret_token, webhookSecret(TOK));
  assert.equal(w.tg.at(-1)[0], "setMyCommands"); assert.equal(w.tg.at(-1)[1].commands[0].command, "random");
});

test("рандомная игра: без повторов, пока не пройден весь круг; игры маркета — с кнопкой «Открыть»", async () => {
  const w = await world();
  await w.call("admin", "PATCH", init(MAIN), { query: { r: "game", id: w.game.id }, body: { play_html: "<canvas id=c></canvas><script>/* коммент */\n  let a=1;</script>" } });
  const hook = (text, chat = { id: BOB, type: "private" }) => w.call("bot", "POST", null, { headers: { "x-telegram-bot-api-secret-token": webhookSecret(TOK), host: "coopix.example" }, body: { message: { chat, from: { id: BOB }, text } } });
  await hook("/start");
  assert.equal(w.tg.at(-1)[0], "sendMessage"); assert.equal(w.tg.at(-1)[1].reply_markup.keyboard[0][0].text, RANDOM_BTN);
  const N = WIDGET_GAMES.length + 1, seen = [];
  for (let i = 0; i < N; i++) {
    await hook(RANDOM_BTN);
    const [m, p] = w.tg.at(-1); assert.equal(m, "sendWidget"); assert.equal(p.chat_id, BOB); assert.match(p.html, /class=tv/);
    if (/Coopix Market/.test(p.caption)) { assert.equal(p.reply_markup.inline_keyboard[0][0].web_app.url, "https://coopix.example/" + w.game.id); assert.doesNotMatch(p.html, /коммент/) }
    seen.push(p.caption);
  }
  assert.equal(new Set(seen).size, N, "за круг ни одна игра не повторилась");
  await hook("🎲 Случайная игра"); // старая надпись кнопки тоже работает и начинает новый круг
  assert.notEqual(w.tg.at(-1)[1].caption, seen.at(-1), "новый круг не начинается с последней игры");
  const n = w.tg.length; await hook(RANDOM_BTN, { id: -5, type: "group" });
  assert.equal(w.tg.length, n); // в группах виджеты не работают — молчим
});

test("рандомная игра: все мини-игры влезают в лимит виджета (с рамкой-телевизором)", () => {
  for (const g of ["stickfight", "gravity", "unik", "metro"]) assert.ok(widgetHtml(readFileSync(new URL(`../games/${g}/tv.html`, import.meta.url), "utf8")), g);
  for (const g of WIDGET_GAMES) { const h = widgetHtml(g.html); assert.ok(h, g.id); for (const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]); }
  assert.equal(widgetHtml("<script>" + "x".repeat(40000) + "</script>"), null);
});test("бот запоминает ник и id каждого, кто ему написал (только личка)", async () => {
  const w = await world();
  await w.hook({ message: { chat: { id: 77, type: "private" }, from: { id: 77, username: "vasya", first_name: "Вася" }, text: "/start" } });
  await w.hook({ message: { chat: { id: 77, type: "private" }, from: { id: 77, username: "vasya2", first_name: "Вася" }, text: "привет" } });
  await w.hook({ message: { chat: { id: -1, type: "group" }, from: { id: 78, username: "petya" }, text: "/start" } });
  assert.deepEqual(w.store.botUsers.get(77), { tg_id: 77, username: "vasya2", first_name: "Вася", messages: 2 });
  assert.equal(w.store.botUsers.has(78), false);
});