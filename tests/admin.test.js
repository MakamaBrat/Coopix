import test from "node:test";
import assert from "node:assert/strict";
import { setup, init, body } from "./mem.js";

const ADDR = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"; // валидный по формату T + 33 символа base58
const MAIN = 1, MOD = 7, USER = 42;

async function world() {
  const w = setup();
  w.store.mods.set(MOD, { tg_id: MOD, note: "mod", added_at: new Date().toISOString() });
  for (const id of [MAIN, MOD, USER]) await w.call("me", "GET", init(id)); // «регистрация» при заходе
  const adm = (r, method, who, o = {}) => w.call("admin", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  return { ...w, adm };
}

test("роли: /me отдаёт main / moderator / null", async () => {
  const { call } = await world();
  assert.equal((await call("me", "GET", init(MAIN))).body.role, "main");
  assert.equal((await call("me", "GET", init(MOD))).body.role, "moderator");
  assert.equal((await call("me", "GET", init(USER))).body.role, null);
});

test("регистрация и последняя активность записываются при заходе", async () => {
  const { store, adm } = await world();
  const u = store.users.get(USER);
  assert.ok(u.registered_at && u.last_seen_at);
  const r = await adm("users", "GET", MAIN);
  assert.equal(r.status, 200); assert.equal(r.body.total, 3);
  assert.ok(r.body.rows.every((x) => x.reg && x.seen));
});

test("панель: игрок и модератор получают 403 на все разделы кроме заявок", async () => {
  const { adm } = await world();
  for (const who of [USER, MOD]) {
    for (const [r, m] of [["users", "GET"], ["stats", "GET"], ["news", "GET"], ["news", "PUT"], ["wallet", "GET"], ["wallet", "PUT"], ["team", "GET"]]) {
      assert.equal((await adm(r, m, who, { body: { items: [], addr: ADDR } })).status, 403, `${who} ${m} ${r}`);
    }
    assert.equal((await adm("user", "PATCH", who, { query: { id: "42" }, body: { banned: true } })).status, 403);
  }
});

test("заявки: модератор обрабатывает, игрок нет", async () => {
  const { call } = await world();
  const { id } = (await call("subs", "POST", init(USER), { body: body() })).body;
  assert.equal((await call("subs", "PATCH", init(USER), { id, body: { status: "pub" } })).status, 403);
  assert.equal((await call("subs", "GET", init(MOD))).body.length, 1);
  assert.equal((await call("subs", "PATCH", init(MOD), { id, body: { status: "seen", comment: "ок" } })).status, 200);
});

test("бан: сайт не грузится, заявки закрыты; разбан возвращает доступ", async () => {
  const { call, adm } = await world();
  assert.equal((await adm("user", "PATCH", MAIN, { query: { id: String(USER) }, body: { banned: true, reason: "спам" } })).status, 200);
  const me = (await call("me", "GET", init(USER))).body;
  assert.equal(me.banned, true); assert.equal(me.reason, "спам");
  const cfg = await call("config", "GET", init(USER));
  assert.equal(cfg.status, 403); assert.equal(cfg.body.error, "banned");
  assert.equal((await call("subs", "GET", init(USER))).status, 403);
  assert.equal((await call("subs", "POST", init(USER), { body: body() })).status, 403);
  assert.equal((await adm("user", "PATCH", MAIN, { query: { id: String(USER) }, body: { banned: false } })).status, 200);
  assert.equal((await call("config", "GET", init(USER))).status, 200);
});

test("бан: нельзя себя, главного и модератора; неизвестный id = 404; без boolean = 400", async () => {
  const { adm } = await world();
  const ban = (id, b = { banned: true }) => adm("user", "PATCH", MAIN, { query: { id }, body: b });
  assert.equal((await ban("1")).status, 400);
  assert.equal((await ban(String(MOD))).status, 400);
  assert.equal((await ban("999")).status, 404);
  assert.equal((await ban("abc")).status, 404);
  assert.equal((await ban(String(USER), { banned: "yes" })).status, 400);
});

test("забаненный модератор по-прежнему модератор, но главного забанить нельзя даже в базе", async () => {
  const { store, call } = await world();
  store.users.get(MAIN).banned = true;
  assert.equal((await call("config", "GET", init(MAIN))).status, 200);
});

test("config сразу отдаёт роль (маркету на старте не нужен отдельный /me)", async () => {
  const { call } = await world();
  assert.deepEqual([(await call("config", "GET", init(MAIN))).body.role, (await call("config", "GET", init(MAIN))).body.admin], ["main", true]);
  assert.deepEqual([(await call("config", "GET", init(MOD))).body.role, (await call("config", "GET", init(MOD))).body.admin], ["moderator", true]);
  assert.deepEqual([(await call("config", "GET", init(USER))).body.role, (await call("config", "GET", init(USER))).body.admin], [null, false]);
});

test("новости: сохранение, чистка полей, ссылки только https", async () => {
  const { adm, call } = await world();
  const put = (items) => adm("news", "PUT", MAIN, { body: { items } });
  const ok = await put([
    { tag: "Акция", c: "#ff0000", date: "10.11", title: "Привет", text: "Текст", link: "https://t.me/coopix_market" },
    { title: "Без ссылки", c: "javascript:1", link: "" },
  ]);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.items[0].link, "https://t.me/coopix_market");
  assert.equal(ok.body.items[1].c, "#a56bff"); // чужой цвет заменён
  assert.equal(ok.body.items[1].link, "");
  assert.equal((await put([{ title: "x", link: "javascript:alert(1)" }])).status, 400);
  assert.equal((await put([{ title: "x", link: "http://example.com" }])).status, 400);
  assert.equal((await put([{ title: "" }])).status, 400);
  assert.equal((await put(Array.from({ length: 11 }, () => ({ title: "x" })))).status, 400);
  assert.equal((await put("nope")).status, 400);
  const cfg = await call("config", "GET", init(USER)); // игрок видит сохранённые новости
  assert.equal(cfg.body.news.length, 2);
});

test("адрес доната: только валидный TRON, смена уведомляет главных админов", async () => {
  const { adm, sent, call } = await world();
  const put = (addr) => adm("wallet", "PUT", MAIN, { body: { addr } });
  assert.equal((await put("not-an-address")).status, 400);
  assert.equal((await put("0x1234567890123456789012345678901234567890")).status, 400);
  const before = sent.length;
  assert.equal((await put(ADDR)).status, 200);
  assert.ok(sent.length > before && sent.at(-1)[1].includes(ADDR));
  assert.equal((await call("config", "GET", init(USER))).body.wallet.addr, ADDR);
  assert.equal((await put(ADDR)).body.unchanged, true);
  assert.equal((await put("")).status, 200); // пустой адрес = «пока не добавлен»
});

test("команда: добавить и убрать модератора, главного добавить нельзя", async () => {
  const { adm, call } = await world();
  assert.equal((await adm("team", "POST", MAIN, { body: { id: "55", note: "Аня" } })).status, 201);
  assert.equal((await call("me", "GET", init(55))).body.role, "moderator");
  assert.equal((await adm("team", "POST", MAIN, { body: { id: "1" } })).status, 400);
  assert.equal((await adm("team", "POST", MAIN, { body: { id: "x" } })).status, 400);
  const t = (await adm("team", "GET", MAIN)).body;
  assert.equal(t.main[0].id, "1"); assert.ok(t.moderators.some((m) => m.id === "55"));
  assert.equal((await adm("team", "DELETE", MAIN, { query: { id: "55" } })).status, 200);
  assert.equal((await call("me", "GET", init(55))).body.role, null);
});

test("поиск и фильтр списка пользователей", async () => {
  const { adm } = await world();
  await adm("user", "PATCH", MAIN, { query: { id: String(USER) }, body: { banned: true } });
  assert.equal((await adm("users", "GET", MAIN, { query: { filter: "banned" } })).body.total, 1);
  assert.equal((await adm("users", "GET", MAIN, { query: { q: "U42" } })).body.rows[0].id, "42");
});
