/**
 * Моды игр: игрок предлагает мод (HTML-файл) к готовой игре, админ или модератор одобряет.
 * На странице игры во вкладке «Моды» видны только одобренные, с автором.
 * Маршруты игрока в hub.js (mods, modfile, mod, mymods), проверка в core.js (/api/admin?r=mods|mod).
 */
export const MOD_FILE_MAX = 1_500_000;
export const MODS_PENDING_MAX = 3; // одновременно на проверке у одного игрока
export const MOD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clip = (v, n) => String(v ?? "").trim().slice(0, n);

/** Проверка формы мода. Возвращает { f } для базы или { error, status }. */
export function cleanMod(b) {
  if (!b || typeof b !== "object") return { error: "bad_json", status: 400 };
  const title = clip(b.title, 40), description = clip(b.desc, 400);
  if (!title) return { error: "title_required", status: 400 };
  const html = typeof b.file?.text === "string" ? b.file.text : "";
  const size = Buffer.byteLength(html, "utf8");
  if (!size || size > MOD_FILE_MAX) return { error: "file_size", status: 413 };
  if (!/<(html|body|script|canvas)/i.test(html)) return { error: "not_html", status: 400 };
  let name = clip(b.file?.name, 100).replace(/[\\/\u0000-\u001f]/g, "_") || "mod.html";
  if (!/\.html?$/i.test(name)) name += ".html";
  return { f: { title, description, version: clip(b.ver, 12) || "1.0", file_name: name, file_html: html, file_size: size } };
}

/** Строка mods -> формат фронта (без HTML). pid = открытый id автора для перехода в профиль. */
export const modWire = (r, { uid, pid }) => ({
  id: r.id, game: r.game_id, title: r.title, desc: r.description, ver: r.version,
  author: r.author_name, pid: pid(r.author_id), mine: Number(r.author_id) === uid,
  size: r.file_size, at: Date.parse(r.created_at), status: r.status, comment: r.comment,
});
