import test from "node:test";
import assert from "node:assert/strict";
import { setup, init } from "./mem.js";

const MAIN = 1, MOD = 7, ANN = 42, BOB = 43;
const HTML = "<!doctype html><canvas></canvas><script>1</script>";
async function world() {
  const w = setup();
  for (const id of [MAIN, MOD, ANN, BOB]) await w.call("me", "GET", init(id));
  w.store.mods.set(MOD, { tg_id: MOD, note: "m", added_at: new Date().toISOString() });
  await w.store.saveGame({ id: "retro", title: "Retro Mix", tags: ["Arcade"], access: "public", sort: 10 });
  await w.store.saveGame({ id: "hid", title: "Hidden", tags: ["Arcade"], access: "off", sort: 20 });
  const hub = (r, method, who, o = {}) => w.call("hub", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  const adm = (r, method, who, o = {}) => w.call("admin", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  return { ...w, hub, adm };
}
const mod = (o = {}) => ({ game: "retro", title: "Быстрый мяч", desc: "Мяч в два раза быстрее", ver: "1.1", file: { name: "fast.html", text: HTML }, ...o });

test("моды: игрок предлагает, до одобрения мод виден только ему, после — всем с автором", async () => {
  const w = await world();
  const r = await w.hub("mod", "POST", BOB, { body: mod() });
  assert.equal(r.status, 201); assert.equal(r.body.status, "new");
  assert.ok(w.sent.some(([c, t]) => c === MAIN && /Новый мод/.test(t)));
  let l = (await w.hub("mods", "GET", ANN, { query: { game: "retro" } })).body;
  assert.equal(l.items.length, 0); assert.equal(l.mine.length, 0);
  assert.equal((await w.hub("mods", "GET", BOB, { query: { game: "retro" } })).body.mine.length, 1);
  assert.equal((await w.hub("modfile", "GET", ANN, { query: { id: r.body.id } })).status, 404, "чужой не скачает до одобрения");
  assert.equal((await w.hub("modfile", "GET", BOB, { query: { id: r.body.id } })).status, 200, "автор свой файл видит");
  assert.equal((await w.adm("mod", "PATCH", ANN, { query: { id: r.body.id }, body: { status: "approved" } })).status, 403);
  assert.equal((await w.adm("mod", "PATCH", MAIN, { query: { id: r.body.id }, body: { status: "approved", comment: "Огонь" } })).status, 200);
  assert.ok(w.sent.some(([c, t]) => c === BOB && /одобрен/.test(t) && /Огонь/.test(t)));
  l = (await w.hub("mods", "GET", ANN, { query: { game: "retro" } })).body;
  assert.equal(l.items.length, 1); assert.equal(l.items[0].author, "U43"); assert.equal(typeof l.items[0].pid, "string"); assert.notEqual(l.items[0].pid, "43"); assert.equal(l.items[0].authorId, undefined, "tg id автора наружу не уходит");
  assert.match((await w.hub("modfile", "GET", ANN, { query: { id: r.body.id } })).body.text, /<canvas>/);
  assert.ok(!JSON.stringify(l).includes("<canvas"), "HTML в списке не передаётся");
});

test("моды: проверка формы, лимит очереди, скрытая игра, удаление своего", async () => {
  const w = await world();
  for (const [o, st] of [[{ title: "" }, 400], [{ file: { name: "a.html", text: "hello" } }, 400], [{ file: { name: "a.html", text: "<script>" + "x".repeat(1_500_001) } }, 413], [{ game: "hid" }, 404], [{ game: "nope" }, 404]])
    assert.equal((await w.hub("mod", "POST", BOB, { body: mod(o) })).status, st, JSON.stringify(o).slice(0, 40));
  for (let i = 0; i < 3; i++) assert.equal((await w.hub("mod", "POST", BOB, { body: mod({ title: "M" + i }) })).status, 201);
  assert.equal((await w.hub("mod", "POST", BOB, { body: mod() })).status, 429);
  const mine = (await w.hub("mymods", "GET", BOB)).body.items;
  assert.equal(mine.length, 3);
  assert.equal((await w.hub("mod", "DELETE", ANN, { query: { id: mine[0].id } })).status, 404, "чужой мод не удалить");
  assert.equal((await w.hub("mod", "DELETE", BOB, { query: { id: mine[0].id } })).status, 200);
  assert.equal((await w.hub("mod", "POST", BOB, { body: mod() })).status, 201, "место в очереди освободилось");
});

test("моды: админ видит очередь с названием игры, отклоняет с комментарием", async () => {
  const w = await world();
  const id = (await w.hub("mod", "POST", BOB, { body: mod() })).body.id;
  const q = (await w.adm("mods", "GET", MAIN, { query: { status: "new" } })).body;
  assert.equal(q.length, 1); assert.equal(q[0].gameTitle, "Retro Mix"); assert.equal(q[0].authorId, "43");
  await w.adm("mod", "PATCH", MAIN, { query: { id }, body: { status: "rejected", comment: "Ломает счёт" } });
  assert.equal((await w.hub("mods", "GET", ANN, { query: { game: "retro" } })).body.items.length, 0);
  assert.equal((await w.hub("mymods", "GET", BOB)).body.items[0].comment, "Ломает счёт");
  assert.equal((await w.adm("mod", "PATCH", MAIN, { query: { id }, body: { status: "maybe" } })).status, 400);
});
