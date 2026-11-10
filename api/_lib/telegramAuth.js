import crypto from "crypto";

/// Проверка подписи Telegram WebApp initData (HMAC-SHA256 по документации Telegram).
/// Возвращает { ok:true, userId, user, startParam } либо { ok:false, reason }.
export function verifyTelegramInitData(initData, botToken, maxAgeSeconds = 24 * 60 * 60) {
  if (!botToken) return { ok: false, reason: "server_misconfigured" };
  if (!initData || typeof initData !== "string" || initData.length > 4096) {
    return { ok: false, reason: "empty_init_data" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return { ok: false, reason: "missing_hash" };
  params.delete("hash");

  const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest();

  // сравнение за постоянное время; длины равны (32 байта) благодаря проверке формата hash
  if (!crypto.timingSafeEqual(computed, Buffer.from(hash, "hex"))) {
    return { ok: false, reason: "bad_signature" };
  }

  // auth_date обязателен: без него подпись жила бы вечно
  const authDate = parseInt(params.get("auth_date") || "", 10);
  if (!Number.isFinite(authDate) || authDate <= 0) return { ok: false, reason: "missing_auth_date" };
  const age = Date.now() / 1000 - authDate;
  if (age > maxAgeSeconds || age < -300) return { ok: false, reason: "expired" };

  let user = null;
  try { user = JSON.parse(params.get("user") || "null"); } catch { /* отсекаем ниже */ }
  if (!user || !Number.isSafeInteger(user.id)) return { ok: false, reason: "missing_user" };

  return { ok: true, userId: String(user.id), user, startParam: params.get("start_param") || null };
}
