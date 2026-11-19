/**
 * Карты игроков из конструктора Noomic Bot (и любых игр с таким же форматом): облачные слоты и ссылка «поделиться».
 * Формат — тот же «код карты», что в игре: "NC1-" + base64(JSON {n: название, p: [[тип, x, y, w, h, угол, зеркало, движение], …]}).
 * Сервер не доверяет клиенту: разбирает код, проверяет типы и диапазоны и сохраняет заново собранный чистый код (до ~24 КБ, до 400 деталей).
 */

export const MAPS_PER_GAME = 3;       // сколько карт игрок хранит в облаке на одну игру
export const MAP_CODE_MAX = 24000;    // символов в коде
export const MAP_PIECES_MAX = 400;    // деталей на карте (как в конструкторе)
export const MAP_PUTS_PER_MIN = 20;   // записей карты в минуту от одного игрока
export const MAP_ID = /^[a-f0-9]{12}$/;
const TYPES = new Set(["bar", "block", "floor", "ramp", "tramp", "spawn", "reset"]);
const B64 = /^[A-Za-z0-9+/]+$/;

const num = (v, lo, hi) => { const x = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN; return Number.isFinite(x) && x >= lo && x <= hi ? Math.round(x * 100) / 100 : null; };

/** → { name, code, pieces } или { error } ("too_big" — слишком длинный код, "bad_map" — не разобралось / вне допустимого) */
export function cleanMapCode(raw) {
  const c = String(raw ?? "").trim().replace(/\s+/g, "");
  if (c.length > MAP_CODE_MAX) return { error: "too_big" };
  if (!c.startsWith("NC1-") || !B64.test(c.slice(4))) return { error: "bad_map" };
  let o;
  try { o = JSON.parse(Buffer.from(c.slice(4), "base64").toString("utf8")); } catch { return { error: "bad_map" }; }
  if (!o || typeof o !== "object" || !Array.isArray(o.p) || o.p.length < 1) return { error: "bad_map" };
  if (o.p.length > MAP_PIECES_MAX) return { error: "too_big" };
  const out = [];
  for (const p of o.p) {
    if (!Array.isArray(p) || !TYPES.has(p[0])) return { error: "bad_map" };
    const x = num(p[1], -500, 500), y = num(p[2], -500, 500), w = num(p[3], 0, 200), h = num(p[4], 0, 200), a = num(p[5], -10, 10);
    if ([x, y, w, h, a].includes(null)) return { error: "bad_map" };
    let mv = 0;
    if (Array.isArray(p[7])) {
      const m = p[7];
      if (m[0] === "s") { const px = num(m[1], -500, 500), py = num(m[2], -500, 500), mw = num(m[3], -50, 50); if ([px, py, mw].includes(null)) return { error: "bad_map" }; mv = ["s", px, py, mw]; }
      else if (m[0] === "p") { const dx = num(m[1], -500, 500), dy = num(m[2], -500, 500), s = num(m[3], 0, 50); if ([dx, dy, s].includes(null)) return { error: "bad_map" }; mv = ["p", dx, dy, s]; }
      else return { error: "bad_map" };
    }
    out.push([p[0], x, y, w, h, a, p[6] ? 1 : 0, mv]);
  }
  const name = String(o.n ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40) || "Map";
  const code = "NC1-" + Buffer.from(JSON.stringify({ n: name, p: out }), "utf8").toString("base64").replace(/=+$/, "");
  return { name, code, pieces: out.length };
}

/** без кода карты — для списков */
export const mapWire = (r) => ({ id: r.id, name: r.name, pieces: Number(r.pieces) || 0, upd: r.updated_at ? Date.parse(r.updated_at) : null });
