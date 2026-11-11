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
      const created = !users.has(u.id);
      const r = users.get(u.id) ?? { tg_id: u.id, registered_at: t, last_seen_at: t, banned: false, ban_reason: "", banned_at: null, banned_by: null };
      Object.assign(r, { first_name: u.first_name, username: u.username, last_seen_at: t });
      users.set(u.id, r);
      return { banned: r.banned, ban_reason: r.ban_reason, moderator: mods.has(u.id), created };
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

    // ---- каталог игр и правки ----
    games: new Map(), edits: [],
    async listGames() { return [...this.games.values()].map(({ cover_img, bg_img, ...g }) => ({ ...g, has_file: g.file_html != null })).sort((a, b) => a.sort - b.sort); },
    async getGame(id) { const g = this.games.get(id); return g ? { ...g, has_file: g.file_html != null } : null; },
    modList: [],
    async listGameMods({ gameId, authorId, status } = {}) { return this.modList.filter((x) => (!gameId || x.game_id === gameId) && (authorId === undefined || Number(x.author_id) === Number(authorId)) && (!status || x.status === status)).map(({ file_html, ...x }) => ({ ...x })).reverse(); },
    async getGameMod(id) { const x = this.modList.find((y) => y.id === id); if (!x) return null; const { file_html, ...r } = x; return { ...r }; },
    async gameModHtml(id) { const x = this.modList.find((y) => y.id === id); return x ? { file_html: x.file_html } : null; },
    async createGameMod(row) { const x = { id: crypto.randomUUID(), status: "new", comment: "", ...row, created_at: new Date(Date.now() + this.modList.length).toISOString(), updated_at: new Date().toISOString() }; this.modList.push(x); const { file_html, ...r } = x; return { ...r }; },
    async updateGameMod(id, p) { const x = this.modList.find((y) => y.id === id); Object.assign(x, p); const { file_html, ...r } = x; return { ...r }; },
    async deleteGameMod(id) { this.modList = this.modList.filter((y) => y.id !== id); },
    thanks: [],
    async addThanks(row) { if (this.thanks.some((t) => t.charge_id === row.charge_id)) return null; const t = { id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() }; this.thanks.push(t); return { id: t.id }; },
    async thanksStats(ids) { return ids.map((g) => { const t = this.thanks.filter((x) => x.game_id === g); return { game_id: g, stars: t.reduce((a, x) => a + x.stars, 0), backers: new Set(t.map((x) => x.from_id)).size }; }).filter((x) => x.stars); },
    async gameCover(id) { const g = this.games.get(id); return g ? { cover_img: g.cover_img ?? null, bg_img: g.bg_img ?? null } : null; },
    async gameHtml(id) { const g = this.games.get(id); return g ? { file_html: g.file_html ?? null } : null; },
    async saveGame(row) {
      const base = this.games.get(row.id) ?? { description: "", changes: "", version: "0.1", author_name: "", author_id: null, item: "cassette", cover: "b:retro", tint: null, bg: "auto", link: "", access: "staff", sort: 100, file_html: null, submission: null, tags: ["Arcade"], title: "" };
      const g = { ...base, ...structuredClone(row) }; this.games.set(g.id, g); return { ...g, has_file: g.file_html != null };
    },
    async deleteGame(id) { this.games.delete(id); },
    async createEdit({ game_id, author_id, patch }) {
      this.edits = this.edits.filter((e) => !(e.game_id === game_id && e.author_id === author_id && e.status === "new"));
      const e = { id: crypto.randomUUID(), game_id, author_id, patch, status: "new", comment: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      this.edits.push(e); return { ...e };
    },
    async listEdits({ status, authorId } = {}) { return this.edits.filter((e) => (!status || e.status === status) && (authorId === undefined || e.author_id === authorId)).map((e) => ({ ...e })).reverse(); },
    async getEdit(id) { const e = this.edits.find((x) => x.id === id); return e ? { ...e } : null; },
    async updateEdit(id, p) { const e = this.edits.find((x) => x.id === id); Object.assign(e, p); return { ...e }; },

    // ---- профили, отзывы, журнал (та же семантика, что в store.js и SQL-функциях) ----
    profiles: new Map(), reviews: [], events: [],
    async getUser(id) { return users.get(id) ?? null; },
    async getProfile(id) { const p = this.profiles.get(id); return p ? structuredClone(p) : null; },
    async saveProfile(id, f) {
      const p = this.profiles.get(id) ?? { tg_id: id, name: "", color: "#a56bff", photo: "", xp: 0, medals: {}, stats: {}, synced: false, post_title: "", post_text: "", post_at: null };
      this.profiles.set(id, { ...p, ...structuredClone(f), updated_at: new Date().toISOString() });
      return this.getProfile(id);
    },
    async setPost(id, post) {
      return this.saveProfile(id, post ? { post_title: post.title, post_text: post.text, post_at: new Date().toISOString() } : { post_title: "", post_text: "", post_at: null });
    },
    async profilesByIds(ids) {
      return ids.filter((i) => users.has(i)).map((i) => { const p = this.profiles.get(i); return { tg_id: i, first_name: users.get(i).first_name, name: p?.name ?? "", color: p?.color ?? "", photo: p?.photo ?? "" }; });
    },
    seq: 0,
    async listReviews(game, limit) { return this.reviews.filter((r) => r.game_id === game).sort((a, b) => b.seq - a.seq).slice(0, limit).map((r) => ({ ...r })); },
    async getReview(id) { const r = this.reviews.find((x) => x.id === id); return r ? { ...r } : null; },
    async getUserReview(game, uid) { const r = this.reviews.find((x) => x.game_id === game && x.author_id === uid); return r ? { ...r } : null; },
    async saveReview({ id, game, uid, rating, body }) {
      const t = new Date().toISOString();
      if (id) { const r = this.reviews.find((x) => x.id === id); Object.assign(r, { rating, body, updated_at: t, seq: ++this.seq }); return { ...r }; }
      if (this.reviews.some((x) => x.game_id === game && x.author_id === uid)) throw new Error("duplicate key");
      const r = { id: crypto.randomUUID(), game_id: game, author_id: uid, rating, body, created_at: t, updated_at: t, seq: ++this.seq };
      this.reviews.push(r); return { ...r };
    },
    async deleteReview(id) { const i = this.reviews.findIndex((x) => x.id === id); if (i >= 0) this.reviews.splice(i, 1); },
    async addEvents(rows) { for (const r of rows) this.events.push({ id: this.events.length + 1, ...structuredClone({ ...r, ts: 0 }), ts: r.ts.toISOString() }); },
    async countEvents(uid, sinceMs, type) { return this.events.filter((e) => e.user_id === uid && Date.parse(e.ts) > sinceMs && (!type || e.type === type)).length; },
    async lastEventTs(uid, type, game) {
      const a = this.events.filter((e) => e.user_id === uid && e.type === type && (game ? e.game_id === game : e.game_id == null)).map((e) => Date.parse(e.ts));
      return a.length ? Math.max(...a) : null;
    },
    async listEvents({ limit, before, key }) { return this.events.filter((e) => (!before || e.id < before) && (!key || String(e.meta?.k) === "1")).sort((a, b) => b.id - a.id).slice(0, limit).map((e) => ({ ...e })); },
    async firstEventTs() { return this.events.length ? Math.min(...this.events.map((e) => Date.parse(e.ts))) : null; },
    async gameStats(ids) {
      return ids.map((g) => {
        const pl = this.events.filter((e) => e.game_id === g && e.type === "play"), dl = this.events.filter((e) => e.game_id === g && e.type === "download");
        const rv = this.reviews.filter((r) => r.game_id === g), rated = rv.filter((r) => r.rating > 0);
        return { game_id: g, plays: pl.length, play_players: new Set(pl.map((e) => e.user_id)).size, downloads: dl.length, dl_players: new Set(dl.map((e) => e.user_id)).size,
          reviews: rv.length, rated: rated.length, rating: rated.length ? Math.round((rated.reduce((t, r) => t + r.rating, 0) / rated.length) * 100) / 100 : 0 };
      }).filter((r) => r.plays || r.downloads || r.reviews);
    },
    // как SQL activity_series: регистрация (10), новый отзыв, первый запуск и первая загрузка игры игроком; звёзды отдельно
    async activitySeries({ startMs, stepSec, n }) {
      const first = new Set(), k = [];
      for (const u of users.values()) k.push({ t: Date.parse(u.registered_at), w: 10, s: 0, act: true });
      for (const e of [...this.events].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))) {
        const t = Date.parse(e.ts);
        if (e.type === "review" && !e.meta?.e) k.push({ t, w: e.weight, s: 0, act: true });
        else if ((e.type === "play" || e.type === "download") && e.game_id) { const key = `${e.user_id}|${e.game_id}|${e.type}`; if (!first.has(key)) { first.add(key); k.push({ t, w: e.weight, s: 0, act: true }); } }
        else if (e.type === "thank") k.push({ t, w: 0, s: +e.meta?.s || 0, act: false });
      }
      const rows = Array.from({ length: n }, (_, i) => { const a = startMs + i * stepSec * 1e3, b = a + stepSec * 1e3, x = k.filter((e) => e.t >= a && e.t < b); return [x.filter((e) => e.act).length, x.reduce((t, e) => t + e.w, 0), x.reduce((t, e) => t + e.s, 0)]; });
      return { base: k.filter((e) => e.t < startMs).reduce((t, e) => t + e.w, 0), rows };
    },
  };
}

// o.photos: размеры фото профиля для getUserProfilePhotos ([] = фото нет); o.file: что вернёт загрузка файла (функция или Buffer)
export function setup(o = {}) {
  const store = memStore(), sent = [], tg = [];
  const tgApi = async (method, params) => {
    tg.push([method, params]);
    if (method === "createInvoiceLink") return "https://t.me/$inv" + tg.length;
    if (method === "getUserProfilePhotos") return { total_count: o.photos?.length ? 1 : 0, photos: o.photos?.length ? [o.photos] : [] };
    if (method === "getFile") return { file_id: params.file_id, file_path: "photos/" + params.file_id + ".jpg" };
    return true;
  };
  const tgFile = async (path) => { tg.push(["file", path]); return typeof o.file === "function" ? o.file(path) : o.file ?? Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]); };
  // touchTtl: 0 = без кэша «кто это» (тесты меняют бан прямо в store и сразу проверяют); кэш проверяется отдельным тестом
  const core = createCore({ store, verify: verifyTelegramInitData, botToken: TOK, adminIds: [1], notify: (c, t) => sent.push([c, t]), tgApi, tgFile, touchTtl: o.touchTtl ?? 0 });
  const call = (route, method, hdr, o = {}) => core.handle({ route, method, headers: hdr ? { "x-tg-init": hdr } : {}, ...o });
  return { store, sent, call, tg };
}
export const body = (o = {}) => ({ title: "Game", desc: "desc", genre: "Arcade", ver: "1.0", contact: "@a", author: "Ann", file: { name: "g.html", text: HTML }, ...o });

