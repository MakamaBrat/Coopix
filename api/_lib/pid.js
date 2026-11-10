import crypto from "node:crypto";

/**
 * Публичный id игрока для ссылок на профиль (отзывы, журнал действий).
 * Настоящий Telegram id клиенту не отдаём: он превращается в непрозрачную строку из 22 символов,
 * которую знает расшифровать только сервер (ключ выводится из секрета бота, в базе ничего не хранится).
 * Блок 16 байт = id (8 байт) + метка (8 байт): чужую или подделанную строку decode отклонит.
 */
export function pidCodec(secret) {
  const key = crypto.createHash("sha256").update("coopix-pid:" + String(secret)).digest().subarray(0, 16);
  const MAGIC = Buffer.from("CPXpid01");

  const encode = (id) => {
    const n = BigInt(id);
    const block = Buffer.alloc(16);
    block.writeBigUInt64BE(n, 0);
    MAGIC.copy(block, 8);
    const c = crypto.createCipheriv("aes-128-ecb", key, null);
    c.setAutoPadding(false);
    return Buffer.concat([c.update(block), c.final()]).toString("base64url");
  };

  const decode = (s) => {
    if (typeof s !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(s)) return null;
    try {
      const d = crypto.createDecipheriv("aes-128-ecb", key, null);
      d.setAutoPadding(false);
      const block = Buffer.concat([d.update(Buffer.from(s, "base64url")), d.final()]);
      if (block.length !== 16 || !block.subarray(8).equals(MAGIC)) return null;
      const n = block.readBigUInt64BE(0);
      return n > 0n && n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : null;
    } catch {
      return null;
    }
  };

  return { encode, decode };
}
