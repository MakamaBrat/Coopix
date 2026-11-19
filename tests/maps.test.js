import test from "node:test";
import assert from "node:assert/strict";
import { setup, init } from "./mem.js";
import { cleanMapCode, MAPS_PER_GAME } from "../api/_lib/maps.js";

const MAIN = 1, ANN = 42, BOB = 43;
const enc = (o) => "NC1-" + Buffer.from(JSON.stringify(o), "utf8").toString("base64").replace(/=+$/, "");
const piece = (t = "floor", x = 0, y = -0.25, w = 24, h = 0.5, a = 0) => [t, x, y, w, h, a, 0, 0];
const code = (o = {}) => enc({ n: "Моя карта", p: [piece(), piece("bar", -3, 3.5, 0, 0), piece("bar", 1, 3.5, 0, 0)], ...o });

async function world() {
  const w = setup();
  for (const id of [MAIN, ANN, BOB]) await w.call("me", "GET", init(id));
  await w.store.saveGame({ id: "noomicbot", title: "Noomic Bot", tags: ["Sport"], access: "public", sort: 10 });
  await w.store.saveGame({ id: "hid", title: "Hidden", tags: ["Sport"], access: "off", sort: 20 });
  const hub = (r, method, who, o = {}) => w.call("hub", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  return { ...w, hub };
}

test("карты: проверка и чистка кода", () => {
  const ok = cleanMapCode(code({ n: "  A\u0007B   карта  " }));
  assert.equal(ok.pieces, 3); assert.equal(ok.name, "A B карта");
  assert.match(ok.code, /^NC1-/);
  // повторная чистка даёт тот же результат (код каноничный)
  assert.equal(cleanMapCode(ok.code).code, ok.code);
  // числа округляются, лишнее выкидывается
  const r = cleanMapCode(enc({ n: "x", p: [["ramp", 1.23456, 2, 3, 1.5, 0.5, 1, 0]] }));
  assert.deepEqual(JSON.parse(Buffer.from(r.code.slice(4), "base64").toString()).p[0], ["ramp", 1.23, 2, 3, 1.5, 0.5, 1, 0]);
  // движение
  const mv = cleanMapCode(enc({ n: "m", p: [["block", 0, 0, 2, 1, 0, 0, ["s", 1, 2, 0.5]], ["block", 5, 0, 2, 1, 0, 0, ["p", 4, 0, 2]]] }));
  assert.equal(mv.pieces, 2);
  for (const bad of [
    "", "hello", "NC1-", "NC1-%%%", "NC1-" + Buffer.from("не json").toString("base64"),
    enc({ n: "x", p: [] }), enc({ n: "x" }), enc({ n: "x", p: [["evil", 0, 0, 1, 1, 0]] }),
    enc({ n: "x", p: [["floor", 0, 0, 1, 1]] }), enc({ n: "x", p: [["floor", "a", 0, 1, 1, 0]] }),
    enc({ n: "x", p: [["floor", 9999, 0, 1, 1, 0]] }), enc({ n: "x", p: [["floor", 0, 0, 1, 1, 0, 0, ["z", 1, 2, 3]]] }),
    enc({ n: "x", p: [["floor", 0, 0, 1, 1, 0, 0, ["s", 1, 2, 999]]] }),
  ]) assert.equal(cleanMapCode(bad).error, "bad_map", String(bad).slice(0, 30));
  assert.equal(cleanMapCode(enc({ n: "x", p: Array.from({ length: 401 }, () => piece()) })).error, "too_big");
  assert.equal(cleanMapCode("NC1-" + "A".repeat(24001)).error, "too_big");
  assert.equal(cleanMapCode(enc({ n: "", p: [piece()] })).name, "Map");
});

test("карты: создание, лимит 3, правка своей, список без кода", async () => {
  const w = await world();
  const ids = [];
  for (let i = 0; i < MAPS_PER_GAME; i++) {
    const r = await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", code: code({ n: "Карта " + i }) } });
    assert.equal(r.status, 201); assert.match(r.body.id, /^[a-f0-9]{12}$/); assert.equal(r.body.pieces, 3); ids.push(r.body.id);
  }
  assert.equal((await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", code: code() } })).status, 409, "четвёртая не влезает");
  assert.equal((await w.hub("mapput", "POST", BOB, { body: { game: "noomicbot", code: code() } })).status, 201, "у другого игрока свои слоты");
  const l = (await w.hub("mymaps", "GET", ANN, { query: { game: "noomicbot" } })).body;
  assert.equal(l.items.length, 3); assert.equal(l.max, 3); assert.ok(!JSON.stringify(l).includes("NC1-"), "код в списке не передаётся");
  const up = await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", id: ids[0], code: code({ n: "Новая" }) } });
  assert.equal(up.status, 200); assert.equal(up.body.name, "Новая"); assert.equal(up.body.id, ids[0]);
  assert.equal((await w.hub("mapput", "POST", BOB, { body: { game: "noomicbot", id: ids[0], code: code() } })).status, 404, "чужую править нельзя");
  assert.equal((await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", id: "zzzzzzzzzzzz", code: code() } })).status, 404);
});

test("карты: ссылка открывается любым игроком, удалить может только автор", async () => {
  const w = await world();
  const id = (await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", code: code({ n: "Гонка" }) } })).body.id;
  const g = await w.hub("mapget", "GET", BOB, { query: { id } });
  assert.equal(g.status, 200); assert.equal(g.body.game, "noomicbot"); assert.equal(g.body.name, "Гонка"); assert.equal(g.body.mine, false); assert.match(g.body.code, /^NC1-/);
  assert.ok(!("author_id" in g.body) && !("authorId" in g.body), "id автора не раскрывается");
  assert.equal((await w.hub("mapget", "GET", ANN, { query: { id } })).body.mine, true);
  assert.equal((await w.hub("mapget", "GET", BOB, { query: { id: "000000000000" } })).status, 404);
  assert.equal((await w.hub("mapget", "GET", BOB, { query: { id: "../x" } })).status, 404);
  assert.equal((await w.hub("mapdel", "DELETE", BOB, { query: { id } })).status, 404, "чужую удалить нельзя");
  assert.equal((await w.hub("mapdel", "DELETE", ANN, { query: { id } })).status, 200);
  assert.equal((await w.hub("mapget", "GET", BOB, { query: { id } })).status, 404);
  assert.equal((await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", code: code() } })).status, 201, "место освободилось");
});

test("карты: форма запроса, скрытая игра, лимит записей в минуту", async () => {
  const w = await world();
  for (const [b, st] of [[{ game: "noomicbot", code: "hello" }, 400], [{ game: "noomicbot", code: "NC1-" + "A".repeat(24001) }, 413], [{ game: "nope", code: code() }, 404], [{ game: "hid", code: code() }, 404], [{ code: code() }, 404]])
    assert.equal((await w.hub("mapput", "POST", BOB, { body: b })).status, st, JSON.stringify(b).slice(0, 40));
  assert.equal((await w.hub("mymaps", "GET", BOB, { query: { game: "bad id!" } })).status, 404);
  const id = (await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", code: code() } })).body.id;
  let last = 0;
  for (let i = 0; i < 25; i++) last = (await w.hub("mapput", "POST", ANN, { body: { game: "noomicbot", id, code: code({ n: "n" + i }) } })).status;
  assert.equal(last, 429, "частые записи режутся");
});
