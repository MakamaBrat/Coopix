import test from "node:test";
import assert from "node:assert/strict";
import { setup, init, initGame, gameTok } from "./mem.js";
import { sign } from "./helpers.js";

const MAIN = 1, MARKET_ONLY = 42, UNIK_ONLY = 77, GRAV_ONLY = 78, BOTH = 88;
const now = () => Math.floor(Date.now() / 1000);
const adm = (call, r, method, o = {}) => call("admin", method, init(MAIN), { query: { r, ...(o.query ?? {}) }, body: o.body });

/** маркет с двумя играми; боты добавляются через админку, как это делает главный админ */
async function world(bots = []) {
  const w = setup();
  w.store.games.set("unik", { id: "unik", title: "UNIX", access: "public", sort: 1 });
  w.store.games.set("gravity", { id: "gravity", title: "Gravity Fight", access: "public", sort: 2 });
  await w.call("me", "GET", init(MAIN));
  for (const [bot, game] of bots) assert.equal((await adm(w.call, "bots", "POST", { body: { token: gameTok(bot), game } })).status, 201, bot);
  return w;
}

test("админка: добавить бота — username из getMe, токен в ответе скрыт, проверки", async () => {
  const { call, store } = await world();
  const r = await adm(call, "bots", "POST", { body: { token: gameTok("unik_bot"), game: "unik" } });
  assert.equal(r.status, 201);
  assert.equal(r.body.id, "unik_bot");
  assert.equal(r.body.game, "unik");
  assert.ok(r.body.token.startsWith("…") && r.body.token.length === 5);
  assert.equal(store.bots.get("unik_bot").token, gameTok("unik_bot"));
  assert.equal((await adm(call, "bots", "POST", { body: { token: gameTok("unik_bot") } })).status, 409);        // уже есть
  assert.equal((await adm(call, "bots", "POST", { body: { token: "плохой" } })).status, 400);                  // не токен
  assert.equal((await adm(call, "bots", "POST", { body: { token: "123456789:" + "A".repeat(35) } })).status, 400); // Telegram не знает
  assert.equal((await adm(call, "bots", "POST", { body: { token: gameTok("x_bot"), game: "nope" } })).status, 400); // нет такой игры
  const l = await adm(call, "bots", "GET");
  assert.equal(l.body.length, 1);
  assert.equal(l.body[0].gameTitle, "UNIX");
  assert.ok(!JSON.stringify(l.body).includes(gameTok("unik_bot")));
});

test("вход через игрового бота: принят, отмечен этот бот; чужой и неподключённый — 401", async () => {
  const { call, store } = await world([["unik_bot", "unik"]]);
  const r = await call("config", "GET", initGame(UNIK_ONLY, "unik_bot"));
  assert.equal(r.status, 200);
  const u = store.users.get(UNIK_ONLY);
  assert.equal(u.via_game, true);
  assert.equal(u.via_market, false);
  assert.ok(store.userBots.has(UNIK_ONLY + "|unik_bot"));
  const bad = sign({ auth_date: now(), user: JSON.stringify({ id: 5, first_name: "X" }) }, "3:OTHER");
  assert.equal((await call("config", "GET", bad)).status, 401);
  assert.equal((await call("config", "GET", initGame(6, "not_added_bot"))).status, 401);
});

test("рассылка: каждый бот пишет только своим игрокам", async () => {
  const { call, tg, gtg } = await world([["unik_bot", "unik"], ["grav_bot", "gravity"]]);
  await call("me", "GET", init(MARKET_ONLY));
  await call("me", "GET", initGame(UNIK_ONLY, "unik_bot"));
  await call("me", "GET", initGame(GRAV_ONLY, "grav_bot"));
  await call("me", "GET", init(BOTH)); await call("me", "GET", initGame(BOTH, "unik_bot"));
  const cast = (bot) => adm(call, "broadcast", "POST", { body: { text: "Привет", after: 0, bot } });
  const ids = (list, bot) => list.filter(([m, , b]) => m === "sendMessage" && (bot === undefined || b === bot)).map(([, p]) => p.chat_id).sort((a, b) => a - b);

  const m = await cast("market");
  assert.equal(m.status, 200); assert.equal(m.body.total, 3);
  assert.deepEqual(ids(tg), [MAIN, MARKET_ONLY, BOTH]);

  const u = await cast("unik_bot");
  assert.equal(u.status, 200); assert.equal(u.body.total, 2);
  assert.deepEqual(ids(gtg, "unik_bot"), [UNIK_ONLY, BOTH]);

  const g = await cast("grav_bot");
  assert.equal(g.body.total, 1);
  assert.deepEqual(ids(gtg, "grav_bot"), [GRAV_ONLY]);

  assert.equal((await cast("nobody_bot")).status, 404);
});

test("админка: привязка бота к игре, удаление, фильтры игроков и счётчики", async () => {
  const { call, store } = await world([["unik_bot", ""]]);
  await call("me", "GET", initGame(UNIK_ONLY, "unik_bot"));
  assert.equal((await adm(call, "bot", "PATCH", { query: { id: "unik_bot" }, body: { game: "unik" } })).status, 200);
  assert.equal(store.bots.get("unik_bot").game_id, "unik");
  assert.equal((await adm(call, "bot", "PATCH", { query: { id: "unik_bot" }, body: { game: "nope" } })).status, 400);

  const r = await adm(call, "users", "GET", { query: { filter: "game" } });
  assert.deepEqual(r.body.rows.map((x) => x.id), [String(UNIK_ONLY)]);
  assert.deepEqual(r.body.rows[0].bots, ["unik_bot"]);
  assert.deepEqual((await adm(call, "users", "GET", { query: { bot: "unik_bot" } })).body.rows.map((x) => x.id), [String(UNIK_ONLY)]);
  const st = await adm(call, "stats", "GET");
  assert.equal(st.body.gameBots, 1); assert.equal(st.body.game, 1);
  assert.equal((await adm(call, "bots", "GET")).body[0].players, 1);

  assert.equal((await adm(call, "bot", "DELETE", { query: { id: "unik_bot" } })).status, 200);
  assert.equal(store.bots.size, 0);
  assert.equal((await call("config", "GET", initGame(UNIK_ONLY, "unik_bot"))).status, 401); // бот удалён — вход через него закрыт
});

test("модератор и игрок не управляют ботами", async () => {
  const { call, store } = await world();
  store.mods.set(7, { tg_id: 7, note: "", added_at: "" });
  for (const who of [7, MARKET_ONLY]) {
    await call("me", "GET", init(who));
    assert.equal((await call("admin", "GET", init(who), { query: { r: "bots" } })).status, 403);
    assert.equal((await call("admin", "POST", init(who), { query: { r: "bots" }, body: { token: gameTok("evil_bot") } })).status, 403);
  }
});
