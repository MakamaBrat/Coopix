import test from "node:test";
import assert from "node:assert/strict";
import { setup, init, body } from "./mem.js";
import { pidCodec } from "../api/_lib/pid.js";
import { TOK } from "./helpers.js";
import { WEIGHTS, HOURLY_EVENTS, REVIEWS_PER_DAY } from "../api/_lib/hub.js";

const MAIN = 1, ANN = 42, BOB = 43;
const JPG = "data:image/jpeg;base64," + "A".repeat(200);

async function world() {
  const w = setup();
  for (const id of [MAIN, ANN, BOB]) await w.call("me", "GET", init(id));
  const hub = (r, method, who, o = {}) => w.call("hub", method, init(who), { query: { r, ...(o.query ?? {}) }, body: o.body });
  const age = (ms) => w.store.events.forEach((e) => { e.ts = new Date(Date.parse(e.ts) - ms).toISOString(); }); // «прошло время»: сбрасывает паузы между нажатиями
  return { ...w, hub, age };
}
const review = (hub, who, o = {}) => hub("reviews", "POST", who, { body: { game: "retro", rating: 5, text: "Отличная игра", ...o } });

test("pid: туда-обратно, чужую строку и мусор отклоняет, Telegram id в строке не виден", () => {
  const a = pidCodec(TOK), b = pidCodec("other-secret");
  const p = a.encode(123456789);
  assert.match(p, /^[A-Za-z0-9_-]{22}$/);
  assert.equal(a.decode(p), 123456789);
  assert.equal(a.encode(123456789), p); // стабильный: одна и та же строка для одного игрока
  assert.ok(!p.includes("123456789"));
  assert.equal(b.decode(p), null);
  for (const bad of ["", "x", "A".repeat(22), "!".repeat(22), null, undefined, 5]) assert.equal(a.decode(bad), null);
});

test("hub: без подписи 401, забаненному 403, неизвестный маршрут 404", async () => {
  const { call, hub, store } = await world();
  assert.equal((await call("hub", "GET", null, { query: { r: "stats" } })).status, 401);
  store.users.get(ANN).banned = true;
  assert.equal((await hub("stats", "GET", ANN)).status, 403);
  assert.equal((await hub("nope", "GET", BOB)).status, 404);
});

test("отзыв: один на игрока и игру, повторная отправка правит, рейтинг считается по оценкам", async () => {
  const { hub } = await world();
  const r1 = await review(hub, ANN, { rating: 5 });
  assert.equal(r1.status, 201); assert.equal(r1.body.created, true); assert.equal(r1.body.stats.rating, 5);
  assert.equal((await review(hub, BOB, { rating: 2 })).body.stats.rating, 3.5);
  const edit = await review(hub, ANN, { rating: 1, text: "Передумал" });
  assert.equal(edit.status, 200); assert.equal(edit.body.created, false);
  const list = (await hub("reviews", "GET", ANN, { query: { game: "retro" } })).body;
  assert.equal(list.items.length, 2);
  assert.equal(list.stats.rating, 1.5); assert.equal(list.stats.rated, 2); assert.equal(list.stats.reviews, 2);
  assert.equal(list.items.filter((x) => x.me).length, 1);
});

test("отзыв без оценки не меняет рейтинг; валидация текста, оценки и id игры", async () => {
  const { hub } = await world();
  await review(hub, ANN, { rating: 4 });
  const r = await review(hub, BOB, { rating: 0, text: "Без оценки" });
  assert.equal(r.body.stats.rating, 4); assert.equal(r.body.stats.rated, 1); assert.equal(r.body.stats.reviews, 2);
  assert.equal((await review(hub, ANN, { text: "x" })).status, 400);
  assert.equal((await review(hub, ANN, { game: "A B" })).status, 400);
  assert.equal((await review(hub, ANN, { game: "<x>" })).status, 400);
  assert.equal((await review(hub, ANN, { rating: 99 })).body.item.r, 5); // зажимается в 0..5
  assert.equal((await hub("reviews", "POST", ANN, { body: "{bad" })).status, 400);
});

test("отзыв: чужой id игрока наружу не уходит, автор указывается как непрозрачная строка", async () => {
  const { hub, store } = await world();
  await review(hub, ANN);
  const res = (await hub("reviews", "GET", BOB, { query: { game: "retro" } })).body;
  const raw = JSON.stringify(res);
  assert.ok(!raw.includes('"42"') && !/\b42\b/.test(raw.replace(/\d{2,}\.\d+/g, "")));
  const item = res.items[0];
  assert.equal(item.me, false); assert.match(item.pid, /^[A-Za-z0-9_-]{22}$/);
  assert.equal(res.authors[item.pid].n, "U42");
  assert.equal(store.reviews.length, 1);
});

test("удалить отзыв может автор и модератор, другой игрок нет", async () => {
  const { hub, store } = await world();
  const id = (await review(hub, ANN)).body.item.id;
  assert.equal((await hub("reviews", "DELETE", BOB, { query: { id } })).status, 403);
  assert.equal((await hub("reviews", "DELETE", ANN, { query: { id } })).status, 200);
  const id2 = (await review(hub, ANN)).body.item.id;
  const del = await hub("reviews", "DELETE", MAIN, { query: { id: id2 } });
  assert.equal(del.status, 200); assert.equal(del.body.stats.reviews, 0);
  assert.equal((await hub("reviews", "DELETE", ANN, { query: { id: "bad" } })).status, 404);
  assert.equal(store.reviews.length, 0);
});

test("лимит записей отзывов в сутки", async () => {
  const { hub } = await world();
  let last;
  for (let i = 0; i <= REVIEWS_PER_DAY; i++) last = await review(hub, ANN, { game: "g" + i });
  assert.equal(last.status, 429);
});

test("track: играть/скачать считаются только по игрокам (один игрок = один раз), пауза между нажатиями", async () => {
  const { hub, age } = await world();
  const t = (who, type, game = "retro") => hub("track", "POST", who, { body: { type, game } });
  assert.equal((await t(ANN, "play")).body.accepted, 1);
  assert.equal((await t(ANN, "play")).body.accepted, 0); // слишком часто
  age(10_000);
  await t(ANN, "play"); await t(BOB, "play"); await t(BOB, "download");
  const s = (await hub("stats", "GET", ANN, { query: { ids: "retro,space" } })).body.games;
  assert.equal(s.retro.plays, 2, "Анна запускала дважды, но считается один раз"); assert.equal(s.retro.playPlayers, 2);
  assert.equal(s.retro.downloads, 1); assert.equal(s.retro.dlPlayers, 1);
  assert.deepEqual(s.space, { plays: 0, playPlayers: 0, downloads: 0, dlPlayers: 0, reviews: 0, rated: 0, rating: 0, stars: 0, backers: 0 });
  const r = await t(BOB, "play", "space");
  assert.equal(r.body.stats.space.plays, 1); // ответ сразу содержит свежие цифры
});

test("track: валидация типа и игры, серверные типы прислать нельзя, часовой лимит", async () => {
  const { hub, store } = await world();
  const t = (b) => hub("track", "POST", ANN, { body: b });
  for (const type of ["review", "post", "medal", "submit", "x", "", undefined]) assert.equal((await t({ type, game: "retro" })).status, 400, String(type));
  assert.equal((await t({ type: "play", game: "../x" })).status, 400);
  assert.equal((await t({ type: "play" })).status, 400);
  assert.equal((await hub("track", "POST", ANN, { body: "{bad" })).status, 400);
  assert.equal((await hub("track", "GET", ANN)).status, 405);
  for (let i = 0; i < HOURLY_EVENTS; i++) store.events.push({ id: 1000 + i, ts: new Date().toISOString(), user_id: ANN, type: "open", game_id: "retro", weight: 0, meta: {} });
  assert.equal((await t({ type: "play", game: "retro" })).status, 429);
  assert.equal((await hub("track", "POST", BOB, { body: { type: "play", game: "retro" } })).status, 200); // лимит у каждого свой
});

test("track: пачка из очереди «нет связи» берёт время клиента только за последние сутки", async () => {
  const { hub, store } = await world();
  const now = Date.now();
  const r = await hub("track", "POST", ANN, { body: { events: [
    { type: "open", game: "retro", t: now - 3600e3 },
    { type: "open", game: "space", t: now + 3600e3 },     // из будущего -> «сейчас»
    { type: "open", game: "toxic", t: now - 3 * 86400e3 }, // слишком старое -> «сейчас»
  ] } });
  assert.equal(r.body.accepted, 3);
  const by = Object.fromEntries(store.events.map((e) => [e.game_id, Date.parse(e.ts)]));
  assert.ok(Math.abs(by.retro - (now - 3600e3)) < 5);
  assert.ok(by.space <= Date.now() && by.space >= now - 5);
  assert.ok(by.toxic >= now - 5);
});

test("профиль: снимок сохраняется, опыт и медали не откатываются, фото и цвет проверяются", async () => {
  const { hub } = await world();
  const put = (b, who = ANN) => hub("profile", "PUT", who, { body: b });
  const ok = await put({ name: "  Анна  ", color: "#FF5EC4", photo: JPG, xp: 120, medals: { first: 1700000000000 }, stats: { plays: 3, ids: 2 } }); // ник из запроса игнорируется
  assert.equal(ok.status, 200);
  assert.equal(ok.body.name, "U42"); assert.equal(ok.body.color, "#ff5ec4"); assert.equal(ok.body.xp, 120);
  assert.equal(ok.body.me, true); assert.equal(ok.body.stats.plays, 3);
  const back = await put({ xp: 10, medals: { rev1: 1700000001000 }, stats: { plays: 1 } });
  assert.equal(back.body.xp, 120);
  assert.deepEqual(Object.keys(back.body.medals).sort(), ["first", "rev1"]);
  assert.equal(back.body.stats.plays, 3);
  assert.equal((await put({ color: "red" })).status, 400);
  assert.equal((await put({ photo: "data:text/html;base64,AAAA" })).status, 400);
  assert.equal((await put({ photo: 'data:image/jpeg;base64,AAA"onerror=alert(1)' })).status, 400);
  assert.equal((await put({ photo: "data:image/jpeg;base64," + "A".repeat(40001) })).status, 400);
  assert.equal((await put({ medals: { "<b>": 5, "ok1": "x" } })).status, 200);
  assert.deepEqual(Object.keys((await put({})).body.medals).sort(), ["first", "rev1"]); // мусорные медали отброшены
  assert.equal((await put({ photo: "" })).body.photo, "");
});

test("профиль другого игрока: по pid из отзыва, без Telegram id; свой по me; чужой pid 404", async () => {
  const { hub } = await world();
  await hub("profile", "PUT", ANN, { body: { name: "Анна", color: "#4dd2ff", xp: 60, medals: { first: 1700000000000 } } });
  await hub("post", "PUT", ANN, { body: { title: "Привет", text: "Делаю игры" } });
  const rv = (await review(hub, ANN)).body.item;
  const prof = await hub("profile", "GET", BOB, { query: { id: rv.pid } });
  assert.equal(prof.status, 200);
  assert.equal(prof.body.name, "U42"); assert.equal(prof.body.me, false); assert.equal(prof.body.xp, 60);
  assert.deepEqual(prof.body.post.title, "Привет");
  assert.ok(!JSON.stringify(prof.body).includes('"42"'));
  assert.equal(prof.body.id, rv.pid);
  const mine = await hub("profile", "GET", ANN, { query: { id: "me" } });
  assert.equal(mine.body.me, true);
  assert.equal((await hub("profile", "GET", BOB, { query: { id: "A".repeat(22) } })).status, 404);
  assert.equal((await hub("profile", "GET", BOB, { query: { id: "42" } })).status, 404); // сырой Telegram id не принимается
});

test("профиль без снимка: имя из Telegram, пустые медали, регистрация из users", async () => {
  const { hub } = await world();
  const pid = (await review(hub, BOB)).body.item.pid;
  const p = (await hub("profile", "GET", ANN, { query: { id: pid } })).body;
  assert.equal(p.name, "U43"); assert.equal(p.has, false); assert.deepEqual(p.medals, {}); assert.equal(p.post, null); assert.ok(p.reg > 0);
});

test("пост: один на игрока, правка заменяет, удаление, лимиты и валидация", async () => {
  const { hub, store } = await world();
  const put = (b, who = ANN) => hub("post", "PUT", who, { body: b });
  assert.equal((await put({ title: "T", text: "" })).status, 400);
  assert.equal((await put({ title: "T", text: "   " })).status, 400);
  const a = await put({ title: "x".repeat(100), text: "y".repeat(900) });
  assert.equal(a.body.post.title.length, 60); assert.equal(a.body.post.text.length, 600);
  await put({ title: "Новый", text: "Второй текст" });
  assert.equal(store.profiles.size, 1);
  const me = (await hub("profile", "GET", ANN)).body;
  assert.equal(me.post.title, "Новый"); assert.equal(me.post.text, "Второй текст");
  assert.equal((await hub("post", "DELETE", ANN)).status, 200);
  assert.equal((await hub("profile", "GET", ANN)).body.post, null);
  for (let i = 0; i < 10; i++) await put({ text: "ещё " + i });
  assert.equal((await put({ text: "слишком часто" })).status, 429);
});

test("пост: чужой удалить может только админ или модератор", async () => {
  const { hub } = await world();
  await hub("post", "PUT", ANN, { body: { text: "Мой пост" } });
  const pid = (await review(hub, ANN)).body.item.pid;
  assert.equal((await hub("post", "DELETE", BOB, { query: { id: pid } })).status, 403);
  assert.equal((await hub("post", "DELETE", MAIN, { query: { id: pid } })).status, 200);
  assert.equal((await hub("profile", "GET", BOB, { query: { id: pid } })).body.post, null);
});

test("пост забаненного игрока скрыт", async () => {
  const { hub, store } = await world();
  await hub("post", "PUT", ANN, { body: { text: "Спам" } });
  const pid = (await review(hub, ANN)).body.item.pid;
  store.users.get(ANN).banned = true;
  assert.equal((await hub("profile", "GET", BOB, { query: { id: pid } })).body.post, null);
});

test("аватары пачкой: только валидные фото, мусорные id пропускаются", async () => {
  const { hub } = await world();
  await hub("profile", "PUT", ANN, { body: { photo: JPG, color: "#4dd2ff" } });
  const pidA = (await review(hub, ANN)).body.item.pid, pidB = (await review(hub, BOB)).body.item.pid;
  const res = (await hub("avatars", "GET", MAIN, { query: { ids: `${pidA},${pidB},xx,${"B".repeat(22)}` } })).body;
  assert.deepEqual(Object.keys(res).sort(), [pidA, pidB].sort());
  assert.equal(res[pidA].p, JPG); assert.equal(res[pidA].c, "#4dd2ff"); assert.equal(res[pidB].p, "");
  const list = (await hub("reviews", "GET", MAIN, { query: { game: "retro" } })).body;
  assert.equal(list.authors[pidA].hp, true); assert.equal(list.authors[pidB].hp, false);
  assert.ok(!JSON.stringify(list).includes("AAAA")); // фото в списке отзывов не передаётся
});

test("журнал: пишет сервер (отзыв, пост, профиль, медаль, уровень), а не клиент", async () => {
  const { hub, store } = await world();
  await hub("profile", "PUT", ANN, { body: { name: "A", xp: 10 } });              // первая синхронизация: событий нет
  assert.equal(store.events.length, 0);
  await hub("profile", "PUT", ANN, { body: { name: "Анна", color: "#4dd2ff", xp: 60, medals: { first: 1 } } });
  await review(hub, ANN, { rating: 4 });
  await review(hub, ANN, { rating: 5, text: "Правка" });
  await hub("post", "PUT", ANN, { body: { text: "Привет" } });
  await hub("post", "DELETE", ANN);
  const types = store.events.map((e) => e.type);
  assert.deepEqual(types, ["profile", "medal", "level", "review", "review", "post", "post_del"]);
  const rev = store.events.filter((e) => e.type === "review");
  assert.equal(rev[0].weight, WEIGHTS.review); assert.equal(rev[1].weight, 0); assert.equal(rev[1].meta.e, 1);
  assert.equal(store.events.find((e) => e.type === "level").meta.lv, 2);
  assert.equal(store.events.find((e) => e.type === "medal").meta.m, "first");
});

test("журнал: заявка на игру тоже попадает в журнал", async () => {
  const { call, store } = await world();
  const r = await call("subs", "POST", init(ANN), { body: body() });
  assert.equal(r.status, 201);
  assert.deepEqual(store.events.map((e) => e.type), ["submit"]);
});

test("лента журнала: новые сверху, страницы по before, имена и без Telegram id", async () => {
  const { hub, age } = await world();
  const t = (who, type, game) => hub("track", "POST", who, { body: { type, game } });
  await t(ANN, "open", "retro"); age(5000); await t(BOB, "play", "retro"); age(5000); await review(hub, ANN);
  const f1 = (await hub("feed", "GET", MAIN, { query: { limit: 2 } })).body;
  assert.deepEqual(f1.items.map((x) => x.type), ["review", "play"]);
  assert.ok(f1.next);
  const f2 = (await hub("feed", "GET", MAIN, { query: { limit: 2, before: f1.next } })).body;
  assert.deepEqual(f2.items.map((x) => x.type), ["open"]); assert.equal(f2.next, null);
  assert.equal(f1.items.every((x) => typeof x.t === "number" && x.pid.length === 22), true);
  assert.equal(f1.items[0].me, false);
  assert.ok(!/"(42|43|1)"/.test(JSON.stringify(f1)));
  assert.equal(Object.values(f1.authors).some((a) => a.n === "U43"), true);
  assert.equal((await hub("feed", "GET", MAIN, { query: { limit: 999 } })).status, 200);
  assert.equal((await hub("feed", "GET", ANN)).status, 403, "журнал действий видят только админы");
});

test("график: 4 периода, сумма весов и базовый ресурс сходятся с журналом", async () => {
  const { hub, store, age } = await world();
  const t = (who, type, game) => hub("track", "POST", who, { body: { type, game } });
  await t(ANN, "play", "retro"); await t(BOB, "download", "retro"); await review(hub, ANN);
  age(3 * 86400e3);               // всё это «3 дня назад»
  await t(ANN, "play", "retro");  // и одно действие сейчас
  const r = await hub("activity", "GET", ANN, { query: { tz: -180 } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.weights, WEIGHTS);
  assert.equal(r.body.series.length, 4);
  const [h24, d7, d30, all] = r.body.series;
  assert.equal(h24.rows.length, 24); assert.equal(d7.rows.length, 28); assert.equal(d30.rows.length, 30); assert.equal(all.rows.length, 40);
  const total = store.events.reduce((s, e) => s + e.weight, 0);
  const sum = (s) => s.base + s.rows.reduce((t, [, w]) => t + w, 0);
  assert.equal(sum(all), total);                       // «Всё» покрывает весь журнал
  assert.equal(sum(d30), total);
  assert.equal(h24.base, total - WEIGHTS.play);        // за 24 ч только сегодняшнее действие, остальное в базе
  assert.equal(h24.rows.reduce((t, [a]) => t + a, 0), 1);
  assert.equal(d7.base, 0);                            // 3 дня назад ещё внутри 7 дней
  assert.equal(all.rows.reduce((t, [a]) => t + a, 0), store.events.length);
  assert.ok(all.step >= 3600 && all.step % 3600 === 0);
  assert.ok(Math.abs(h24.t0 + 24 * 3600e3 - Date.now()) < 3600e3 + 5);
});

test("график при пустом журнале: ровные нули, без ошибок", async () => {
  const { hub } = await world();
  const r = await hub("activity", "GET", ANN);
  assert.equal(r.status, 200);
  for (const s of r.body.series) { assert.equal(s.base, 0); assert.ok(s.rows.every(([a, w]) => a === 0 && w === 0)); }
});

test("график: границы ведёр выровнены по местному времени игрока", async () => {
  const { hub } = await world();
  const r = await hub("activity", "GET", ANN, { query: { tz: -180 } }); // UTC+3
  const d30 = r.body.series[2];
  assert.equal(new Date(d30.t0 + 3 * 3600e3).getUTCHours(), 0); // начало суток по местному времени
  const utc = await hub("activity", "GET", ANN, { query: { tz: 0 } });
  assert.equal(new Date(utc.body.series[2].t0).getUTCHours(), 0);
});

test("stats: пустой и мусорный список id", async () => {
  const { hub } = await world();
  assert.deepEqual((await hub("stats", "GET", ANN)).body, { games: {} });
  const r = (await hub("stats", "GET", ANN, { query: { ids: "retro,<x>,retro,," + "a".repeat(40) } })).body.games;
  assert.deepEqual(Object.keys(r), ["retro"]);
});

test("ник = имя из Telegram: меняется вместе с Telegram, в отзывах тоже", async () => {
  const { hub, call } = await world();
  const rv = (await review(hub, ANN)).body.item;
  await call("me", "GET", init(ANN, { first_name: "Анна Новая" }));        // игрок переименовался в Telegram
  const p = (await hub("profile", "GET", BOB, { query: { id: rv.pid } })).body;
  assert.equal(p.name, "Анна Новая");
  assert.equal((await hub("reviews", "GET", BOB, { query: { game: "retro" } })).body.authors[rv.pid].n, "Анна Новая");
});

test("фото из Telegram: через бота, наименьшее от 128 px, только JPEG; нет фото = пусто; Telegram недоступен = 502 без токена", async () => {
  const get = (w, who = ANN) => w.call("hub", "GET", init(who), { query: { r: "tgphoto" } });
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const w = setup({ photos: [{ file_id: "x", width: 90 }, { file_id: "s", width: 160 }, { file_id: "m", width: 320 }], file: jpeg });
  const r = await get(w);
  assert.equal(r.status, 200); assert.equal(r.body.photo, "data:image/jpeg;base64," + jpeg.toString("base64"));
  assert.deepEqual(w.tg.find(([m]) => m === "getUserProfilePhotos")[1], { user_id: ANN, limit: 1 });
  assert.equal(w.tg.find(([m]) => m === "getFile")[1].file_id, "s");
  assert.equal((await get(w)).status, 429, "не чаще раза в 10 секунд");
  assert.equal((await get(setup({ photos: [] }))).body.photo, "");
  assert.equal((await get(setup({ photos: [{ file_id: "s", width: 160 }], file: Buffer.from([0x89, 0x50, 0x4e]) }))).body.photo, "", "не JPEG");
  const down = await get(setup({ photos: [{ file_id: "s", width: 160 }], file: () => { throw new Error("https://api.telegram.org/file/bot" + TOK); } }));
  assert.equal(down.status, 502); assert.ok(!JSON.stringify(down.body).includes(TOK));
});
