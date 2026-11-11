/**
 * Каталог игр: что показывать в магазине и кому (access), публикация заявки, правки страницы автором с одобрением админа.
 * Публичные маршруты живут в hub.js (games, gamefile, myedit, myedits), управление в core.js (/api/admin?r=games|game|publish|edits|edit).
 */
import { createHash } from "node:crypto";

export const ITEMS = ["cassette", "cd", "floppy", "handheld"];
export const COVERS = ["b:retro", "b:space", "b:toxic", "b:blocks"];
export const BGS = ["auto", "0", "1", "2", "3"];
export const ACCESS = ["public", "staff", "off"];
const COVER_BY_GENRE = { Arcade: "b:retro", Music: "b:space", Shooter: "b:toxic", Puzzle: "b:blocks" };
export const coverFor = (genre) => COVER_BY_GENRE[genre] ?? "b:retro";

/** Поля страницы, которые автор может предложить изменить (меняются только после одобрения админа). */
export const AUTHOR_FIELDS = ["desc", "changes", "ver", "link", "item", "bg", "tint", "cover", "bgimg"];
const ALL_FIELDS = ["title", "tags", "author", ...AUTHOR_FIELDS, "access", "sort", "dl_off"]; // dl_off: скачивание выключено (только главный админ)

/** Своя обложка: JPEG до 512×512 (клиент сам готовит), не больше ~280 КБ в base64. В базе: cover = "img:<хэш>", cover_img = data URL.
 *  Фон страницы и карточки: JPEG до 1280×720, не больше ~420 КБ. В базе: bg_ref = "img:<хэш>", bg_img = data URL. */
export const COVER_IMG_MAX = 280000;
export const BG_IMG_MAX = 420000;
const IMG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;
export const IMG_REF = /^img:[0-9a-f]{12}$/;
function cleanImg(v, max) {
  if (typeof v !== "string" || v.length > max || !IMG_RE.test(v)) return null;
  const bin = Buffer.from(v.slice(23), "base64");
  if (bin.length < 200 || bin[0] !== 0xff || bin[1] !== 0xd8 || bin[2] !== 0xff) return null; // настоящий JPEG, а не что угодно
  return { ref: "img:" + createHash("sha256").update(v).digest("hex").slice(0, 12), img: v };
}

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
  if (ok("cover")) {
    if (COVERS.includes(b.cover)) { f.cover = b.cover; f.cover_img = null; }
    else { const c = cleanImg(b.cover, COVER_IMG_MAX); if (!c) return { error: "bad_cover" }; f.cover = c.ref; f.cover_img = c.img; }
  }
  if (ok("bgimg")) {
    if (b.bgimg === "" || b.bgimg === null) { f.bg_ref = null; f.bg_img = null; }
    else { const c = cleanImg(b.bgimg, BG_IMG_MAX); if (!c) return { error: "bad_bgimg" }; f.bg_ref = c.ref; f.bg_img = c.img; }
  }
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
  if (ok("dl_off")) { if (typeof b.dl_off !== "boolean") return { error: "bad_dl" }; f.dl_off = b.dl_off; }
  if (ok("sort")) f.sort = Math.min(100000, Math.max(0, Math.trunc(Number(b.sort)) || 0));
  return { f };
}

/** Строка games -> формат фронта (HTML-файл не передаётся: только признак file) */
export const gameWire = (g, uid) => ({
  id: g.id, title: g.title, tags: g.tags, desc: g.description, changes: g.changes, ver: g.version,
  author: g.author_name, item: g.item, cover: g.cover, tint: g.tint ?? null, bg: g.bg, link: g.link,
  access: g.access, sort: g.sort, file: !!g.has_file, dl: !g.dl_off, bgimg: g.bg_ref || "", mine: g.author_id != null && Number(g.author_id) === uid,
});

/** Очищенные поля -> патч автора в формате фронта (так он хранится в game_edits и показывается админу) */
export function toPatch(f) {
  const out = {};
  for (const [k, v] of Object.entries(f)) {
    if (k === "cover_img" || k === "bg_img") continue;
    if (k === "cover") out.cover = f.cover_img ?? v;
    else if (k === "bg_ref") out.bgimg = f.bg_img ?? "";
    else out[{ description: "desc", version: "ver" }[k] ?? k] = v;
  }
  return out;
}

export const isVisible = (g, staff) => g.access === "public" || (staff && g.access === "staff");
