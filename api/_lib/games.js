/**
 * Каталог игр: что показывать в магазине и кому (access), публикация заявки, правки страницы автором с одобрением админа.
 * Публичные маршруты живут в hub.js (games, gamefile, myedit, myedits), управление в core.js (/api/admin?r=games|game|publish|edits|edit).
 */
import { randomBytes } from "node:crypto";

export const ITEMS =["cassette", "cd", "floppy", "handheld"];
export const COVERS = ["b:retro", "b:space", "b:toxic", "b:blocks"];
export const BGS = ["auto", "0", "1", "2", "3"];
export const ACCESS = ["public", "staff", "off"];
const COVER_BY_GENRE = { Arcade: "b:retro", Music: "b:space", Shooter: "b:toxic", Puzzle: "b:blocks" };
export const coverFor = (genre) => COVER_BY_GENRE[genre] ?? "b:retro";

/** id новой игры: время + случайный хвост, чтобы две игры, созданные в одну миллисекунду, не совпали (формат ^[a-z0-9_-]{1,32}$) */
export const newGameId = () => "g" + Date.now().toString(36) + randomBytes(4).readUInt32BE(0).toString(36).padStart(7, "0");

/** Поля страницы, которые автор может предложить изменить (меняются только после одобрения админа). */
export const AUTHOR_FIELDS = ["desc", "changes", "ver", "link", "item", "bg", "tint"];
const ALL_FIELDS = ["title", "tags", "author", ...AUTHOR_FIELDS, "cover", "access", "sort"];

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

function cleanLink(v) {
  const u = String(v ?? "").trim();
  if (!u) return "";
  if (u.length > 300 || !/^https:\/\/[^\s"'<>]+$/i.test(u)) return null;
  try { new URL(u); } catch { return null; }
  return u;
}

/**
 * Очищает входные поля. only = список разрешённых полей (для автора AUTHOR_FIELDS), остальные молча игнорируются.
 * Возвращает { f } (поля для БД) или { error }.
 */
export function cleanGame(b, only = ALL_FIELDS) {
  if (!b || typeof b !== "object") return { error: "bad_json" };
  const ok = (k) => only.includes(k) && b[k] !== undefined;
  const f = {};
  if (ok("title")) { f.title = clip(b.title, 40); if (!f.title) return { error: "title_required" }; }
  if (ok("tags")) {
    if (!Array.isArray(b.tags)) return { error: "bad_tags" };
    const t = [...new Set(b.tags.map((x) => clip(String(x).replace(/[,;<>"&]/g, " ").replace(/\s+/g, " "), 14)).filter(Boolean))].slice(0, 3);
    if (!t.length) return { error: "bad_tags" };
    f.tags = t;
  }
  if (ok("desc")) f.description = clip(b.desc, 600);
  if (ok("changes")) f.changes = clip(b.changes, 200);
  if (ok("ver")) f.version = clip(b.ver, 12) || "0.1";
  if (ok("author")) f.author_name = clip(b.author, 24);
  if (ok("item")) { if (!ITEMS.includes(b.item)) return { error: "bad_item" }; f.item = b.item; }
  if (ok("cover")) { if (!COVERS.includes(b.cover)) return { error: "bad_cover" }; f.cover = b.cover; }
  if (ok("bg")) { if (!BGS.includes(String(b.bg))) return { error: "bad_bg" }; f.bg = String(b.bg); }
  if (ok("link")) { const l = cleanLink(b.link); if (l === null) return { error: "bad_link" }; f.link = l; }
  if (ok("tint")) {
    if (b.tint === null) f.tint = null;
    else {
      const h = Number(b.tint?.h), s = Number(b.tint?.s);
      if (!(h >= 0 && h <= 360 && s >= 0 && s <= 1)) return { error: "bad_tint" };
      f.tint = { h: Math.round(h), s: Math.round(s * 100) / 100 };
    }
  }
  if (ok("access")) { if (!ACCESS.includes(b.access)) return { error: "bad_access" }; f.access = b.access; }
  if (ok("sort")) f.sort = Math.min(100000, Math.max(0, Math.trunc(Number(b.sort)) || 0));
  return { f };
}

/** Строка games -> формат фронта (HTML-файл не передаётся: только признак file) */
export const gameWire = (g, uid) => ({
  id: g.id, title: g.title, tags: g.tags, desc: g.description, changes: g.changes, ver: g.version,
  author: g.author_name, item: g.item, cover: g.cover, tint: g.tint ?? null, bg: g.bg, link: g.link,
  access: g.access, sort: g.sort, file: !!g.has_file, mine: g.author_id != null && Number(g.author_id) === uid,
});

/** patch автора (в формате фронта) -> строка games */
export function applyPatch(game, patch) {
  const { f } = cleanGame(patch, AUTHOR_FIELDS);
  return { ...game, ...f };
}

export const isVisible = (g, staff) => g.access === "public" || (staff && g.access === "staff");
