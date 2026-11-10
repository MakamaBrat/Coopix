import { createCore } from "../api/_lib/core.js";
import { verifyTelegramInitData } from "../api/_lib/telegramAuth.js";
import { sign, TOK } from "./helpers.js";

const now = () => Math.floor(Date.now() / 1000);
export const HTML = "<html><body><canvas></canvas><script>1</script></body></html>";
export const init = (id, extra = {}) => sign({ auth_date: now(), user: JSON.stringify({ id, first_name: "U" + id, ...extra }) });

// in-memory Store с той же семантикой, что SQL-функция (лимит 5 / 24 ч)
export function memStore() {
  const rows = [], users = new Map(), mods = new Map(), settings = new Map();
  const strip = ({ file_html, ...r }) => r;
  return {
    rows,
    async list(a) { return rows.filter((r) => a === undefined || r.author_id === a).map(strip); },
    async create(n) {
      if (rows.filter((r) => r.author_id === n.author_id).length >= 5) return null;
      const t = new Date().toISOString();
      const r = { ...n, id: crypto.randomUUID(), file_size: Buffer.byteLength(n.file_html), status: "new", comment: "", created_at: t, updated_at: t };
      rows.push(r); return strip(r);
    },
    async get(id) { const r = rows.find((x) => x.id === id); return r ? strip(r) : null; },
    async getHtml(id) { return rows.find((x) => x.id === id) ?? null; },
    // ---- игроки / модераторы / настройки ----
    users, mods, settings,
    async touchUser(u) {
      const t = new Date().toISOString();
      const r = users.get(u.id) ?? { tg_id: u.id, registered_at: t, last_seen_at: t, banned: false, ban_reason: "", banned_at: null, banned_by: null };
      Object.assign(r, { first_name: u.first_name, username: u.username, last_seen_at: t });
      users.set(u.id, r);
      return { banned: r.banned, ban_reason: r.ban_reason, moderator: mods.has(u.id) };
    },
    async listUsers({ q = "", filter = "all", sort = "seen", limit = 50, offset = 0 } = {}) {
      let a = [...users.values()].filter((u) => (!q || `${u.first_name} ${u.username} ${u.tg_id}`.toLowerCase().includes(q.toLowerCase())) && (filter !== "banned" || u.banned));
      a.sort((x, y) => String(y[sort === "reg" ? "registered_at" : "last_seen_at"]).localeCompare(String(x[sort === "reg" ? "registered_at" : "last_seen_at"])));
      return { rows: a.slice(offset, offset + limit), total: a.length };
    },
    async userStats() { const a = [...users.values()]; return { total: a.length, banned: a.filter((u) => u.banned).length, active24h: a.length, new7d: a.length }; },
    async usersByIds(ids) { return ids.map((i) => users.get(i)).filter(Boolean); },
    async setBan(id, banned, reason, by) {
      const u = users.get(id); if (!u) return null;
      Object.assign(u, banned ? { banned: true, ban_reason: reason, banned_at: new Date().toISOString(), banned_by: by } : { banned: false, ban_reason: "", banned_at: null, banned_by: null });
      return u;
    },
    async listMods() { return [...mods.values()]; },
    async addMod(id, note) { mods.set(id, { tg_id: id, note, added_at: new Date().toISOString() }); return mods.get(id); },
    async removeMod(id) { mods.delete(id); },
    async staffIds() { return [...mods.keys()]; },
    async getSetting(k) { return settings.get(k) ?? null; },
    async setSetting(k, value, by) { settings.set(k, { value, updated_by: by, updated_at: new Date().toISOString() }); },
    async update(id, p) { const r = rows.find((x) => x.id === id); if (!r) return null; Object.assign(r, p); return strip(r); },
  };
}

export function setup() {
  const store = memStore(), sent = [];
  const core = createCore({ store, verify: verifyTelegramInitData, botToken: TOK, adminIds: [1], notify: (c, t) => sent.push([c, t]) });
  const call = (route, method, hdr, o = {}) => core.handle({ route, method, headers: hdr ? { "x-tg-init": hdr } : {}, ...o });
  return { store, sent, call };
}
export const body = (o = {}) => ({ title: "Game", desc: "desc", genre: "Arcade", ver: "1.0", contact: "@a", author: "Ann", file: { name: "g.html", text: HTML }, ...o });

