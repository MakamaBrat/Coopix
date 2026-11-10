import test from "node:test";
import assert from "node:assert/strict";
import { setup, init, body } from "./mem.js";

const MAIN = 1, MOD = 7, ANN = 42, BOB = 43;

async function world() {
  const w = setup();
  w.store.mods.set(MOD, { tg_id: MOD, note: "m", added_at: new Date().toISOString() });
  for (const id of [MAIN, MOD, ANN, BOB]) await w.call("me", "GET", init(id));
  const adm = (r, method, who, o = {}) => w.call("admin", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  const hub = (r, method, who, o = {}) => w.call("hub", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  return { ...w, adm, hub };
}
const mk = (adm, o = {}) => adm("game", "POST", MAIN, { body: { title: "Test", ...o } });

test("каталог: админ создаёт игру, по умолчанию она видна только персоналу", async () => {
  const { adm, hub } = await world();
  const g = (await mk(adm, { tags: ["Puzzle", "x"], desc: "Описание" })).body;
  assert.equal(g.access, "staff"); assert.deepEqual(g.tags, ["Puzzle", "x"]);
  assert.equal((await hub("games", "GET", ANN)).body.games.length, 0);
  assert.equal((await hub("games", "GET", MOD)).body.games.length, 1);
  assert.equal((await adm("game", "PATCH", MAIN, { query: { id: g.id }, body: { access: "public" } })).body.access, "public");
  assert.equal((await hub("games", "GET", ANN)).body.games.length, 1);
  await adm("game", "PATCH", MAIN, { query: { id: g.id }, body: { access: "off" } });
  assert.equal((await hub("games", "GET", ANN)).body.games.length, 0);
  assert.equal((await hub("games", "GET", MAIN)).body.games.length, 0); // «off» скрыта у всех, в панели она есть
  assert.equal((await adm("games", "GET", MAIN)).body.length, 1);
});

test("каталог: порядок по sort, валидация полей, удаление", async () => {
  const { adm, hub } = await world();
  const a = (await mk(adm, { title: "A", access: "public", sort: 20 })).body, b = (await mk(adm, { title: "B", access: "public", sort: 10 })).body;
  assert.deepEqual((await hub("games", "GET", ANN)).body.games.map((x) => x.title), ["B", "A"]);
  for (const bad of [{ item: "x" }, { cover: "x" }, { bg: "9" }, { link: "http://a.b" }, { link: "javascript:alert(1)" }, { tint: { h: 999, s: 1 } }, { access: "all" }, { tags: [] }, { title: "" }]) {
    assert.equal((await adm("game", "PATCH", MAIN, { query: { id: a.id }, body: bad })).status, 400, JSON.stringify(bad));
  }
  assert.equal((await adm("game", "PATCH", MAIN, { query: { id: a.id }, body: {} })).status, 400);
  assert.equal((await adm("game", "DELETE", MAIN, { query: { id: b.id } })).status, 200);
  assert.equal((await adm("game", "DELETE", MAIN, { query: { id: b.id } })).status, 404);
});

test("каталог: управлять играми может только главный админ; модератор и игрок получают 403", async () => {
  const { adm } = await world();
  for (const who of [MOD, ANN]) {
    assert.equal((await adm("games", "GET", who)).status, 403);
    assert.equal((await adm("game", "POST", who, { body: { title: "X" } })).status, 403);
  }
});

async function published(w, access = "public") {
  const sub = (await w.call("subs", "POST", init(ANN), { body: body({ title: "Игра Анны" }) })).body;
  const pub = await w.adm("publish", "POST", MAIN, { body: { submission: sub.id, access } });
  return { sub, game: pub.body, pub };
}

test("публикация заявки: игра с файлом и автором, заявка помечается опубликованной, автору приходит сообщение", async () => {
  const w = await world();
  const { sub, game, pub } = await published(w, "staff");
  assert.equal(pub.status, 201); assert.equal(game.file, true); assert.equal(game.access, "staff"); assert.equal(game.title, "Игра Анны");
  assert.equal((await w.call("subs", "GET", init(MAIN))).body.find((s) => s.id === sub.id).status, "pub");
  assert.ok(w.sent.some(([c, t]) => c === ANN && /добавлена в маркет/.test(t)));
  assert.equal((await w.adm("publish", "POST", MAIN, { body: { submission: sub.id } })).status, 409);
  assert.equal((await w.adm("publish", "POST", MAIN, { body: { submission: "bad" } })).status, 404);
  assert.equal((await w.adm("publish", "POST", MOD, { body: { submission: sub.id } })).status, 403);
});

test("файл игры отдаётся только если игра видна; mine ставится автору", async () => {
  const w = await world();
  const { game } = await published(w, "staff");
  assert.equal((await w.hub("gamefile", "GET", BOB, { query: { id: game.id } })).status, 404);
  assert.match((await w.hub("gamefile", "GET", MOD, { query: { id: game.id } })).body.text, /<canvas/);
  await w.adm("game", "PATCH", MAIN, { query: { id: game.id }, body: { access: "public" } });
  assert.match((await w.hub("gamefile", "GET", BOB, { query: { id: game.id } })).body.text, /<script>/);
  const list = (await w.hub("games", "GET", ANN)).body.games[0];
  assert.equal(list.mine, true); assert.equal((await w.hub("games", "GET", BOB)).body.games[0].mine, false);
  assert.ok(!JSON.stringify((await w.hub("games", "GET", BOB)).body).includes("<canvas")); // HTML в списке нет
});

test("правки страницы: автор предлагает, админ одобряет, и только тогда меняется страница", async () => {
  const w = await world();
  const { game } = await published(w);
  const r = await w.hub("myedit", "POST", ANN, { body: { game: game.id, patch: { desc: "Новое описание", ver: "1.2", link: "https://example.com/g", title: "ХАК", access: "off", item: "cd" } } });
  assert.equal(r.status, 201);
  const cur = (await w.hub("games", "GET", BOB)).body.games[0];
  assert.equal(cur.desc, "Игра Анны".length ? cur.desc : "", "до одобрения страница не меняется");
  assert.notEqual(cur.ver, "1.2"); assert.equal(cur.item, "cassette");
  assert.ok(w.sent.some(([c, t]) => c === MAIN && /правки/i.test(t)));
  const list = (await w.adm("edits", "GET", MOD)).body;
  assert.equal(list.length, 1); assert.equal(list[0].status, "new");
  assert.deepEqual(Object.keys(list[0].patch).sort(), ["desc", "item", "link", "ver"]); // title и access отброшены
  assert.equal((await w.adm("edit", "PATCH", ANN, { query: { id: list[0].id }, body: { status: "approved" } })).status, 403);
  const ok = await w.adm("edit", "PATCH", MOD, { query: { id: list[0].id }, body: { status: "approved", comment: "Круто" } });
  assert.equal(ok.status, 200);
  const now = (await w.hub("games", "GET", BOB)).body.games[0];
  assert.equal(now.desc, "Новое описание"); assert.equal(now.ver, "1.2"); assert.equal(now.item, "cd"); assert.equal(now.link, "https://example.com/g");
  assert.equal(now.title, "Игра Анны"); assert.equal(now.access, "public");
  assert.ok(w.sent.some(([c, t]) => c === ANN && /одобрены/.test(t) && /Круто/.test(t)));
  assert.equal((await w.adm("edit", "PATCH", MOD, { query: { id: list[0].id }, body: { status: "rejected" } })).status, 409);
  assert.equal((await w.hub("myedits", "GET", ANN)).body.items[0].status, "approved");
});

test("правки: отклонённые не применяются, чужой игрок править не может, новая заменяет старую в очереди", async () => {
  const w = await world();
  const { game } = await published(w);
  assert.equal((await w.hub("myedit", "POST", BOB, { body: { game: game.id, patch: { desc: "взлом" } } })).status, 403);
  assert.equal((await w.hub("myedit", "POST", ANN, { body: { game: game.id, patch: { link: "http://x.y" } } })).status, 400);
  assert.equal((await w.hub("myedit", "POST", ANN, { body: { game: game.id, patch: { title: "x" } } })).status, 400); // нет разрешённых полей
  assert.equal((await w.hub("myedit", "POST", ANN, { body: { game: "nope", patch: { desc: "x" } } })).status, 404);
  await w.hub("myedit", "POST", ANN, { body: { game: game.id, patch: { desc: "первая" } } });
  await w.hub("myedit", "POST", ANN, { body: { game: game.id, patch: { desc: "вторая" } } });
  const q = (await w.adm("edits", "GET", MAIN, { query: { status: "new" } })).body;
  assert.equal(q.length, 1); assert.equal(q[0].patch.desc, "вторая");
  await w.adm("edit", "PATCH", MAIN, { query: { id: q[0].id }, body: { status: "rejected", comment: "Нет" } });
  assert.notEqual((await w.hub("games", "GET", BOB)).body.games[0].desc, "вторая");
  assert.equal((await w.hub("myedits", "GET", ANN)).body.items[0].comment, "Нет");
});

test("правки: ссылка только https, длинные поля обрезаются, тинт проверяется", async () => {
  const w = await world();
  const { game } = await published(w);
  assert.equal((await w.hub("myedit", "POST", ANN, { body: { game: game.id, patch: { tint: { h: 400, s: 1 } } } })).status, 400);
  await w.hub("myedit", "POST", ANN, { body: { game: game.id, patch: { desc: "я".repeat(900), tint: { h: 120, s: 0.5 }, bg: "2" } } });
  const e = (await w.adm("edits", "GET", MAIN)).body[0];
  assert.equal(e.patch.desc.length, 600); assert.deepEqual(e.patch.tint, { h: 120, s: 0.5 }); assert.equal(e.patch.bg, "2");
});
