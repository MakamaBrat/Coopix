import test from "node:test";
import assert from "node:assert/strict";
import { setup, init, body, HTML } from "./mem.js";

test("без подписи и с поддельной подписью: 401 на всех маршрутах", async () => {
  const { call } = setup();
  for (const route of ["subs", "me"]) {
    assert.equal((await call(route, "GET", null)).status, 401);
    assert.equal((await call(route, "GET", "hash=x&auth_date=1")).status, 401);
  }
});

test("/me: ADMIN_IDS только на сервере", async () => {
  const { call } = setup();
  assert.deepEqual((await call("me", "GET", init(1))).body, { id: "1", admin: true, role: "main", banned: false, reason: "" });
  assert.deepEqual((await call("me", "GET", init(42))).body, { id: "42", admin: false, role: null, banned: false, reason: "" });
});

test("создание: автор из подписи, статус и комментарий принудительно пустые", async () => {
  const { call, sent } = setup();
  const r = await call("subs", "POST", init(42, { username: "ann" }), { body: body({ authorId: "1", status: "pub", comment: "hack" }) });
  assert.equal(r.status, 201);
  assert.equal(r.body.authorId, "42"); assert.equal(r.body.status, "new"); assert.equal(r.body.comment, ""); assert.equal(r.body.tg, "ann");
  assert.equal(sent[0][0], 1);
});

test("валидация входных данных", async () => {
  const { call } = setup();
  const post = (b) => call("subs", "POST", init(42), { body: b });
  assert.equal((await post(body({ title: "" }))).status, 400);
  assert.equal((await post(body({ file: { name: "x.html", text: "hello" } }))).status, 400);
  assert.equal((await post(body({ file: { name: "x.html", text: HTML + "a".repeat(1_500_001) } }))).status, 413);
  assert.equal((await post("{bad")).status, 400);
  assert.equal((await post(body({ genre: "Hack" }))).status, 201); // неизвестный жанр -> Other
});

test("видимость: игрок видит свои, админ все, HTML в списке нет", async () => {
  const { call } = setup();
  await call("subs", "POST", init(42), { body: body() });
  assert.equal((await call("subs", "GET", init(42))).body.length, 1);
  assert.equal((await call("subs", "GET", init(43))).body.length, 0);
  const all = (await call("subs", "GET", init(1))).body;
  assert.equal(all.length, 1); assert.equal("text" in all[0].file, false);
});

test("файл: свой и админ да, чужой нет", async () => {
  const { call } = setup();
  const { id } = (await call("subs", "POST", init(42), { body: body() })).body;
  const f = (hdr) => call("subs", "GET", hdr, { id, file: true });
  assert.equal((await f(init(43))).status, 404);
  assert.equal((await f(init(42))).body.text, HTML);
  assert.equal((await f(init(1))).body.text, HTML);
});

test("PATCH: игрок 403, админ ок + уведомление автору, плохие данные отклоняются", async () => {
  const { call, sent } = setup();
  const { id } = (await call("subs", "POST", init(42), { body: body() })).body;
  const patch = (hdr, b, i = id) => call("subs", "PATCH", hdr, { id: i, body: b });
  assert.equal((await patch(init(42), { status: "pub" })).status, 403);
  assert.equal((await patch(init(1), { status: "zzz" })).status, 400);
  assert.equal((await patch(init(1), {})).status, 400);
  assert.equal((await patch(init(1), { status: "seen" }, "nope")).status, 404);
  const r = await patch(init(1), { status: "pub", comment: "Круто" });
  assert.equal(r.status, 200); assert.equal(r.body.status, "pub");
  assert.equal(sent.at(-1)[0], 42);
});

test("лимит 5 заявок в сутки", async () => {
  const { call } = setup();
  for (let i = 0; i < 5; i++) assert.equal((await call("subs", "POST", init(42), { body: body() })).status, 201);
  assert.equal((await call("subs", "POST", init(42), { body: body() })).status, 429);
  assert.equal((await call("subs", "POST", init(43), { body: body() })).status, 201); // у другого игрока свой лимит
});

test("неверный метод и невалидный id", async () => {
  const { call } = setup();
  assert.equal((await call("subs", "DELETE", init(42))).status, 405);
  assert.equal((await call("subs", "GET", init(42), { id: "not-a-uuid" })).status, 404);
});
