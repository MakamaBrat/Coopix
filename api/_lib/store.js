import { createClient } from "@supabase/supabase-js";

const COLS = "id,author_id,author,tg,title,genre,description,version,contact,file_name,file_size,status,comment,created_at,updated_at";
const UCOLS = "tg_id,first_name,username,registered_at,last_seen_at,banned,ban_reason,banned_at,banned_by";
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
  };
}
