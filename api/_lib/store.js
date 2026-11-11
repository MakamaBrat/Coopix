import { createClient } from "@supabase/supabase-js";

const COLS = "id,author_id,author,tg,title,genre,description,version,contact,file_name,file_size,status,comment,created_at,updated_at";
const UCOLS = "tg_id,first_name,username,registered_at,last_seen_at,banned,ban_reason,banned_at,banned_by";
const PROF_COLS = "tg_id,name,color,photo,xp,medals,stats,synced,post_title,post_text,post_at,updated_at";
const REV_COLS = "id,game_id,author_id,rating,body,created_at,updated_at";
const GAME_COLS = "id,title,tags,description,changes,version,author_name,author_id,item,cover,tint,bg,bg_ref,link,access,sort,dl_off,play_kind,has_play,has_file,submission,created_at,updated_at";
const MOD_COLS = "id,game_id,author_id,author_name,title,description,version,file_name,file_size,status,comment,created_at,updated_at";
const EDIT_COLS = "id,game_id,author_id,patch,status,comment,created_at,updated_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function supabaseStore(url, serviceKey) {
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const T = "submissions";
  const ok = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };

  return {
    async list(authorId) {
      let q = db.from(T).select(COLS).order("created_at", { ascending: false }).limit(500);
      if (authorId !== undefined) q = q.eq("author_id", authorId);
      return ok(await q) ?? [];
    },
    // Проверка лимита и вставка идут одной транзакцией в SQL-функции create_submission (нет гонки)
    async create(r) {
      return ok(await db.rpc("create_submission", {
        p_author_id: r.author_id, p_author: r.author, p_tg: r.tg, p_title: r.title, p_genre: r.genre,
        p_description: r.description, p_version: r.version, p_contact: r.contact,
        p_file_name: r.file_name, p_file_html: r.file_html,
      }));
    },
    async get(id) {
      if (!UUID.test(id)) return null;
      return ok(await db.from(T).select(COLS).eq("id", id).maybeSingle());
    },
    async getHtml(id) {
      if (!UUID.test(id)) return null;
      return ok(await db.from(T).select("author_id,file_name,file_size,file_html").eq("id", id).maybeSingle());
    },
    // ---------- игроки ----------
    /** Заход игрока: создаёт/обновляет строку, возвращает { banned, ban_reason, moderator }. */
    async touchUser(u) {
      return ok(await db.rpc("touch_user", { p_id: u.id, p_first_name: u.first_name, p_username: u.username }));
    },
    /** opts: { q, filter: all|active|banned, sort: seen|reg, limit, offset } -> { rows, total } */
    async listUsers({ q = "", filter = "all", sort = "seen", limit = 50, offset = 0 } = {}) {
      let b = db.from("users").select(UCOLS, { count: "exact" });
      const term = String(q).replace(/[,()%*\\:"']/g, " ").trim().slice(0, 40);
      if (term) {
        const like = `%${term}%`;
        let cond = `first_name.ilike.${like},username.ilike.${like}`;
        if (/^\d{1,15}$/.test(term)) cond += `,tg_id.eq.${term}`;
        b = b.or(cond);
      }
      if (filter === "banned") b = b.eq("banned", true);
      if (filter === "active") b = b.gt("last_seen_at", new Date(Date.now() - 86400e3).toISOString());
      b = b.order(sort === "reg" ? "registered_at" : "last_seen_at", { ascending: false })
           .range(offset, offset + limit - 1);
      const r = await b;
      if (r.error) throw new Error(r.error.message);
      return { rows: r.data ?? [], total: r.count ?? 0 };
    },
    async userStats() {
      const c = async (f) => { const r = await f(db.from("users").select("tg_id", { count: "exact", head: true })); if (r.error) throw new Error(r.error.message); return r.count ?? 0; };
      const day = new Date(Date.now() - 86400e3).toISOString(), week = new Date(Date.now() - 7 * 86400e3).toISOString();
      const [total, banned, active24h, new7d] = await Promise.all([
        c((q) => q), c((q) => q.eq("banned", true)), c((q) => q.gt("last_seen_at", day)), c((q) => q.gt("registered_at", week)),
      ]);
      return { total, banned, active24h, new7d };
    },
    /** Рассылка: следующая пачка Telegram id (без забаненных) по возрастанию id после after */
    async userIdsAfter(after, limit) {
      return (ok(await db.from("users").select("tg_id").eq("banned", false).gt("tg_id", after).order("tg_id", { ascending: true }).limit(limit)) ?? []).map((r) => Number(r.tg_id));
    },
    async usersByIds(ids) {
      if (!ids.length) return [];
      return ok(await db.from("users").select("tg_id,first_name,username").in("tg_id", ids)) ?? [];
    },
    async setBan(id, banned, reason, by) {
      return ok(await db.from("users").update(banned
        ? { banned: true, ban_reason: reason, banned_at: new Date().toISOString(), banned_by: by }
        : { banned: false, ban_reason: "", banned_at: null, banned_by: null }
      ).eq("tg_id", id).select(UCOLS).maybeSingle());
    },

    // ---------- модераторы ----------
    async listMods() { return ok(await db.from("moderators").select("tg_id,note,added_at").order("added_at")) ?? []; },
    async addMod(id, note, by) {
      return ok(await db.from("moderators").upsert({ tg_id: id, note, added_by: by }, { onConflict: "tg_id" }).select("tg_id,note,added_at").maybeSingle());
    },
    async removeMod(id) { ok(await db.from("moderators").delete().eq("tg_id", id)); },
    async staffIds() { return (await this.listMods()).map((m) => Number(m.tg_id)); },

    // ---------- настройки сайта ----------
    async getSetting(key) {
      return ok(await db.from("settings").select("value,updated_at,updated_by").eq("key", key).maybeSingle());
    },
    async setSetting(key, value, by) {
      ok(await db.from("settings").upsert({ key, value, updated_by: by, updated_at: new Date().toISOString() }, { onConflict: "key" }));
    },
    async update(id, patch) {
      if (!UUID.test(id)) return null;
      return ok(await db.from(T).update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select(COLS).maybeSingle());
    },

    // ---------- каталог игр и правки страниц ----------
    async listGames() { return ok(await db.from("games").select(GAME_COLS).order("sort").order("created_at")) ?? []; },
    async getGame(id) { return ok(await db.from("games").select(GAME_COLS).eq("id", id).maybeSingle()); },
    // ---- моды ----
    async listGameMods({ gameId, authorId, status } = {}) {
      let qb = db.from("game_mods").select(MOD_COLS).order("created_at", { ascending: false }).limit(200);
      if (gameId) qb = qb.eq("game_id", gameId);
      if (authorId !== undefined) qb = qb.eq("author_id", authorId);
      if (status) qb = qb.eq("status", status);
      return ok(await qb) ?? [];
    },
    async getGameMod(id) { return ok(await db.from("game_mods").select(MOD_COLS).eq("id", id).maybeSingle()); },
    async gameModHtml(id) { return ok(await db.from("game_mods").select("file_html").eq("id", id).maybeSingle()); },
    async createGameMod(row) { return ok(await db.from("game_mods").insert(row).select(MOD_COLS).maybeSingle()); },
    async updateGameMod(id, p) { return ok(await db.from("game_mods").update({ ...p, updated_at: new Date().toISOString() }).eq("id", id).select(MOD_COLS).maybeSingle()); },
    async deleteGameMod(id) { ok(await db.from("game_mods").delete().eq("id", id)); },
    /** Запись платежа «спасибо». charge_id уникален: повтор вебхука вернёт null. */
    async addThanks(row) {
      const { data, error } = await db.from("thanks").insert(row).select("id").maybeSingle();
      if (error) { if (error.code === "23505") return null; throw new Error(error.message); }
      return data;
    },
    async thanksStats(ids) { return ids.length ? ok(await db.rpc("thanks_stats", { p_ids: ids })) ?? [] : []; },
    async gameCover(id) { return ok(await db.from("games").select("cover_img,bg_img").eq("id", id).maybeSingle()); },
    async gamePlay(id) { return ok(await db.from("games").select("play_html").eq("id", id).maybeSingle()); },
    async gameHtml(id) { return ok(await db.from("games").select("file_html").eq("id", id).maybeSingle()); },
    /**
     * row — колонки таблицы games: update по id, а если строки нет — insert.
     * Не upsert: в Postgres INSERT … ON CONFLICT проверяет NOT NULL (title) до конфликта,
     * и частичная правка ({ id, access }) падала бы с not-null violation.
     */
    async saveGame({ id, ...rest }) {
      const at = new Date().toISOString();
      const upd = ok(await db.from("games").update({ ...rest, updated_at: at }).eq("id", id).select(GAME_COLS).maybeSingle());
      if (upd) return upd;
      return ok(await db.from("games").insert({ id, ...rest, updated_at: at }).select(GAME_COLS).maybeSingle());
    },
    async deleteGame(id) { ok(await db.from("games").delete().eq("id", id)); },
    /** У автора на игру одна заявка на правку «в очереди»: новая заменяет старую */
    async createEdit({ game_id, author_id, patch }) {
      ok(await db.from("game_edits").delete().eq("game_id", game_id).eq("author_id", author_id).eq("status", "new"));
      return ok(await db.from("game_edits").insert({ game_id, author_id, patch }).select(EDIT_COLS).maybeSingle());
    },
    async listEdits({ status, authorId } = {}) {
      let q = db.from("game_edits").select(EDIT_COLS).order("created_at", { ascending: false }).limit(200);
      if (status) q = q.eq("status", status);
      if (authorId !== undefined) q = q.eq("author_id", authorId);
      return ok(await q) ?? [];
    },
    async getEdit(id) { return ok(await db.from("game_edits").select(EDIT_COLS).eq("id", id).maybeSingle()); },
    async updateEdit(id, patch) {
      return ok(await db.from("game_edits").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select(EDIT_COLS).maybeSingle());
    },

    // ---------- профили и посты ----------
    async getUser(id) {
      return ok(await db.from("users").select("tg_id,first_name,username,registered_at,banned").eq("tg_id", id).maybeSingle());
    },
    async getProfile(id) {
      return ok(await db.from("profiles").select(PROF_COLS).eq("tg_id", id).maybeSingle());
    },
    /** Пишет только переданные поля (upsert по tg_id). Строка игрока в users уже есть: её создаёт touch_user при каждом запросе. */
    async saveProfile(id, fields) {
      ok(await db.from("profiles").upsert({ tg_id: id, ...fields, updated_at: new Date().toISOString() }, { onConflict: "tg_id" }));
      return this.getProfile(id);
    },
    /** post = { title, text } или null (удалить) */
    async setPost(id, post) {
      return this.saveProfile(id, post
        ? { post_title: post.title, post_text: post.text, post_at: new Date().toISOString() }
        : { post_title: "", post_text: "", post_at: null });
    },
    /** Имя/цвет/фото профиля + имя из Telegram как запасное: [{ tg_id, name, color, photo, first_name }] */
    async profilesByIds(ids) {
      if (!ids.length) return [];
      const [p, u] = await Promise.all([
        db.from("profiles").select("tg_id,name,color,photo").in("tg_id", ids),
        db.from("users").select("tg_id,first_name").in("tg_id", ids),
      ]);
      const prof = new Map((ok(p) ?? []).map((x) => [Number(x.tg_id), x]));
      return (ok(u) ?? []).map((x) => ({ first_name: x.first_name, ...(prof.get(Number(x.tg_id)) ?? { name: "", color: "", photo: "" }), tg_id: x.tg_id }));
    },

    // ---------- отзывы ----------
    async listReviews(game, limit) {
      return ok(await db.from("reviews").select(REV_COLS).eq("game_id", game).order("updated_at", { ascending: false }).limit(limit)) ?? [];
    },
    async getReview(id) {
      return ok(await db.from("reviews").select(REV_COLS).eq("id", id).maybeSingle());
    },
    async getUserReview(game, uid) {
      return ok(await db.from("reviews").select(REV_COLS).eq("game_id", game).eq("author_id", uid).maybeSingle());
    },
    /** Один отзыв на игрока и игру: есть id -> правка, нет -> новый (уникальный индекс закрывает гонку) */
    async saveReview({ id, game, uid, rating, body }) {
      const now = new Date().toISOString();
      if (id) return ok(await db.from("reviews").update({ rating, body, updated_at: now }).eq("id", id).select(REV_COLS).maybeSingle());
      return ok(await db.from("reviews").insert({ game_id: game, author_id: uid, rating, body }).select(REV_COLS).maybeSingle());
    },
    async deleteReview(id) { ok(await db.from("reviews").delete().eq("id", id)); },

    // ---------- журнал действий ----------
    async addEvents(rows) {
      if (!rows.length) return;
      ok(await db.from("events").insert(rows.map((r) => ({ ...r, ts: r.ts.toISOString() }))));
    },
    async countEvents(uid, sinceMs, type) {
      let q = db.from("events").select("id", { count: "exact", head: true }).eq("user_id", uid).gt("ts", new Date(sinceMs).toISOString());
      if (type) q = q.eq("type", type);
      const r = await q;
      if (r.error) throw new Error(r.error.message);
      return r.count ?? 0;
    },
    async lastEventTs(uid, type, game) {
      let q = db.from("events").select("ts").eq("user_id", uid).eq("type", type);
      q = game ? q.eq("game_id", game) : q.is("game_id", null);
      const r = ok(await q.order("ts", { ascending: false }).limit(1));
      return r?.[0] ? Date.parse(r[0].ts) : null;
    },
    /** key: только ключевые события (meta.k = 1, индекс events_key_idx) */
    async listEvents({ limit, before, key }) {
      let q = db.from("events").select("id,ts,user_id,type,game_id,meta").order("id", { ascending: false }).limit(limit);
      if (key) q = q.eq("meta->>k", "1");
      if (before) q = q.lt("id", before);
      return ok(await q) ?? [];
    },
    async firstEventTs() {
      const r = ok(await db.from("events").select("ts").order("ts", { ascending: true }).limit(1));
      return r?.[0] ? Date.parse(r[0].ts) : null;
    },

    // ---------- статистика (SQL-функции из schema.sql) ----------
    async gameStats(ids) {
      if (!ids.length) return [];
      return ok(await db.rpc("game_stats", { p_ids: ids })) ?? [];
    },
    /** -> { base, rows: [[действий, вес], …] }: base = вес всех событий до startMs */
    async activitySeries({ startMs, stepSec, n }) {
      const r = ok(await db.rpc("activity_series", { p_start: new Date(startMs).toISOString(), p_step_sec: stepSec, p_n: n }));
      // [действия, очки, звёзды]: раньше третье число терялось, и строка звёзд на сайте всегда была пустой
      return { base: Number(r?.base ?? 0), rows: (r?.rows ?? []).map(([a, w, s]) => [Number(a), Number(w), Number(s) || 0]) };
    },
  };
}
