import test from "node:test";
import assert from "node:assert/strict";
import { setup, init } from "./mem.js";
import { mergeGameStats } from "../api/_lib/stats.js";

const MAIN = 1, ANN = 42, BOB = 43;
async function world() {
  const w = setup();
  for (const id of [MAIN, ANN, BOB]) await w.call("me", "GET", init(id));
  await w.store.saveGame({ id: "noomicbot", title: "Noomic Bot", tags: ["Sport"], access: "public", sort: 10 });
  await w.store.saveGame({ id: "hid", title: "Hidden", tags: ["Sport"], access: "off", sort: 20 });
  const hub = (r, method, who, o = {}) => w.call("hub", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  return { ...w, hub };
}
const put = (w, who, regrabs, best, game = "noomicbot") => w.hub("statput", "POST", who, { body: { game, regrabs, best } });

test("перехваты: слияние — числа не уменьшаются, рост ограничен временем", () => {
  const t0 = Date.parse("2026-01-01T00:00:00Z");
  // первая запись: переносим накопленное, рекорд не больше числа перехватов
  assert.deepEqual(mergeGameStats(null, { regrabs: 1500, best: 40 }, t0), { regrabs: 1500, best_streak: 40 });
  assert.deepEqual(mergeGameStats(null, { regrabs: 10, best: 99 }, t0), { regrabs: 10, best_streak: 10 });
  assert.deepEqual(mergeGameStats(null, { regrabs: "x", best: -5 }, t0), { regrabs: 0, best_streak: 0 });
  assert.equal(mergeGameStats(null, { regrabs: 9e9, best: 1 }, t0).regrabs, 1_000_000);
  const cur = { regrabs: 100, best_streak: 10, updated_at: new Date(t0).toISOString() };
  // меньшие значения не уменьшают
  assert.deepEqual(mergeGameStats(cur, { regrabs: 5, best: 1 }, t0 + 5000), { regrabs: 100, best_streak: 10 });
  // обычный рост за 10 секунд проходит
  assert.deepEqual(mergeGameStats(cur, { regrabs: 112, best: 12 }, t0 + 10_000), { regrabs: 112, best_streak: 12 });
  // скачок за секунду режется до запаса (50 + 3 в секунду)
  assert.deepEqual(mergeGameStats(cur, { regrabs: 100000, best: 99999 }, t0 + 1000), { regrabs: 100 + 53, best_streak: 10 + 53 });
  // рекорд не бывает больше числа перехватов
  assert.equal(mergeGameStats({ regrabs: 5, best_streak: 5, updated_at: new Date(t0).toISOString() }, { regrabs: 6, best: 50 }, t0 + 60_000).best_streak, 6);
});

test("перехваты: чтение и запись по игрокам, повтор без роста не пишет в базу", async () => {
  const w = await world();
  assert.deepEqual((await w.hub("mystats", "GET", ANN, { query: { game: "noomicbot" } })).body, { regrabs: 0, best: 0 });
  assert.deepEqual((await put(w, ANN, 0, 0)).body, { regrabs: 0, best: 0 });
  assert.equal(w.store.statList.length, 0, "нули не пишем");
  assert.deepEqual((await put(w, ANN, 120, 15)).body, { regrabs: 120, best: 15 });
  assert.equal(w.store.statList.length, 1);
  const at = w.store.statList[0].updated_at;
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual((await put(w, ANN, 120, 15)).body, { regrabs: 120, best: 15 });
  assert.equal(w.store.statList[0].updated_at, at, "без роста строка не перезаписывается");
  assert.deepEqual((await put(w, ANN, 50, 3)).body, { regrabs: 120, best: 15 }, "меньшие значения не уменьшают");
  assert.deepEqual((await put(w, BOB, 7, 7)).body, { regrabs: 7, best: 7 }, "у каждого игрока своя строка");
  assert.deepEqual((await w.hub("mystats", "GET", ANN, { query: { game: "noomicbot" } })).body, { regrabs: 120, best: 15 });
  assert.deepEqual((await w.hub("mystats", "GET", BOB, { query: { game: "noomicbot" } })).body, { regrabs: 7, best: 7 });
});

test("перехваты: скрытая и несуществующая игра, плохой id, лимит записей в минуту", async () => {
  const w = await world();
  for (const g of ["hid", "nope", "bad id!", ""]) assert.equal((await put(w, BOB, 5, 5, g)).status, 404, g);
  assert.equal((await w.hub("mystats", "GET", BOB, { query: { game: "bad id!" } })).status, 404);
  let last = 0;
  for (let i = 0; i < 35; i++) last = (await put(w, ANN, i + 1, 1)).status;
  assert.equal(last, 429);
});
