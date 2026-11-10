import test from "node:test";
import assert from "node:assert/strict";
import { verifyTelegramInitData as v } from "../api/_lib/telegramAuth.js";
import { sign, TOK } from "./helpers.js";

const now = () => Math.floor(Date.now() / 1000);
const u = JSON.stringify({ id: 42, first_name: "Ann" });

test("валидная подпись", () => {
  const r = v(sign({ auth_date: now(), user: u, start_param: "ref_7" }), TOK);
  assert.equal(r.userId, "42"); assert.equal(r.startParam, "ref_7"); assert.equal(r.user.first_name, "Ann");
});
test("чужой токен / подмена / нет hash", () => {
  assert.equal(v(sign({ auth_date: now(), user: u }, "x:y"), TOK).reason, "bad_signature");
  assert.equal(v(sign({ auth_date: now(), user: u }).replace("42", "43"), TOK).reason, "bad_signature");
  assert.equal(v("auth_date=1&hash=zz", TOK).reason, "missing_hash");
  assert.equal(v("", TOK).reason, "empty_init_data");
});
test("auth_date: нет / просрочен / из будущего", () => {
  assert.equal(v(sign({ user: u }), TOK).reason, "missing_auth_date");
  assert.equal(v(sign({ auth_date: now() - 90000, user: u }), TOK).reason, "expired");
  assert.equal(v(sign({ auth_date: now() + 9999, user: u }), TOK).reason, "expired");
});
test("user без id и сервер без токена", () => {
  assert.equal(v(sign({ auth_date: now(), user: "{}" }), TOK).reason, "missing_user");
  assert.equal(v(sign({ auth_date: now(), user: u }), undefined).reason, "server_misconfigured");
});
