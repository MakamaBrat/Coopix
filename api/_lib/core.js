export const GENRES = ["Arcade", "Music", "Shooter", "Puzzle", "Other"];
export const STATUSES = ["new", "seen", "pub"];
export const FILE_MAX = 1_500_000; // байт, как SUB_MAX на фронте

const STATUS_RU = { new: "Не просмотрено", seen: "Просмотрено", pub: "Опубликовано" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const NEWS_MAX = 10;
const TRON = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const TG_ID = /^\d{1,15}$/;
const clip = (v, n) => String(v ?? "").trim().slice(0, n);

/** Строка БД -> формат, который ждёт фронт. HTML-файл в список не включается. */
export const toWire = (r) => ({
  id: r.id,
  authorId: String(r.author_id),
  author: r.author,
  tg: r.tg,
  title: r.title,
  genre: r.genre,
  desc: r.description,
  ver: r.version,
  contact: r.contact,
  file: { name: r.file_name, size: r.file_size },
  at: Date.parse(r.created_at),
  status: r.status,
  comment: r.comment,
  upd: Date.parse(r.updated_at),
});

/** Строка users -> формат панели. */
const toUser = (u, role) => ({
  id: String(u.tg_id),
  name: u.first_name,
  username: u.username,
  reg: Date.parse(u.registered_at),
  seen: Date.parse(u.last_seen_at),
  banned: !!u.banned,
  reason: u.ban_reason || "",
  bannedAt: u.banned_at ? Date.parse(u.banned_at) : null,
  role,
});

/**
 * store: list(authorId?) | create(row) -> row|null (null = лимит) | get(id) | getHtml(id) | update(id, patch)
 * verify: (initData, botToken, maxAge) -> { ok, userId, user }
 * notify: (chatId, text) -> void
 */
export function createCore({ store, verify, botToken, adminIds = [], maxAgeSec = 86400, notify = () => {} }) {
  const json = (status, body) => ({ status, body });

  async function handle(req) {
    const v = verify(req.headers?.["x-tg-init"], botToken, maxAgeSec);
    if (!v.ok) return json(401, { error: "unauthorized" });

    const uid = Number(v.userId);
    const isMain = adminIds.includes(uid);
    const m = req.method;

    // Заход: создаём/обновляем игрока (регистрация, «последняя активность»), узнаём бан и роль.
    const t = (await store.touchUser({ id: uid, first_name: clip(v.user.first_name, 40), username: clip(v.user.username, 40) })) ?? {};
    const role = isMain ? "main" : t.moderator ? "moderator" : null;
    const staff = !!role;
    const banned = !!t.banned && !isMain; // главного админа заблокировать нельзя

    // ---- /api/me: кто я, роль, бан (ADMIN_IDS живёт только на сервере) ----
    if (req.route === "me") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      return json(200, { id: String(uid), admin: staff, role, banned, reason: banned ? t.ban_reason || "" : "" });
    }

    // Забаненному закрыто всё остальное: биржа не загружается.
    if (banned) return json(403, { error: "banned", reason: t.ban_reason || "" });

    // ---- /api/config: новости и адрес доната для сайта ----
    if (req.route === "config") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      const [news, wallet] = await Promise.all([store.getSetting("news"), store.getSetting("wallet")]);
      return json(200, { news: news?.value ?? null, wallet: wallet?.value ?? null });
    }

    // ---- /api/admin?r=...: панель управления ----
    if (req.route === "admin") return admin(req, { uid, role, staff, isMain });

    // ---- /api/subs ----
    if (!req.id) {
      if (m === "GET") {
        const rows = await store.list(staff ? undefined : uid);
        return json(200, rows.map(toWire));
      }
      if (m === "POST") return create(req, v, uid);
      return json(405, { error: "method_not_allowed" });
    }

    if (!UUID.test(req.id)) return json(404, { error: "not_found" });

    // ---- /api/subs/:id/file ----
    if (req.file) {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      const f = await store.getHtml(req.id);
      if (!f || (!staff && f.author_id !== uid)) return json(404, { error: "not_found" });
      return json(200, { name: f.file_name, size: f.file_size, text: f.file_html });
    }

    // ---- PATCH /api/subs/:id: только админ ----
    if (m !== "PATCH") return json(405, { error: "method_not_allowed" });
    if (!staff) return json(403, { error: "forbidden" });
    const b = parseBody(req.body);
    if (!b) return json(400, { error: "bad_json" });

    const patch = {};
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return json(400, { error: "bad_status" });
      patch.status = b.status;
    }
    if (b.comment !== undefined) patch.comment = clip(b.comment, 400);
    if (!Object.keys(patch).length) return json(400, { error: "empty_patch" });

    const before = await store.get(req.id);
    if (!before) return json(404, { error: "not_found" });
    const row = await store.update(req.id, patch);
    if (!row) return json(404, { error: "not_found" });

    if (before.status !== row.status || before.comment !== row.comment) {
      notify(row.author_id, `Заявка «${row.title}»: ${STATUS_RU[row.status] ?? row.status}` + (row.comment ? `\nКомментарий: ${row.comment}` : ""));
    }
    return json(200, toWire(row));
  }

  async function create(req, v, uid) {
    const b = parseBody(req.body);
    if (!b) return json(400, { error: "bad_json" });

    const title = clip(b.title, 40), description = clip(b.desc, 600);
    const genre = GENRES.includes(b.genre) ? b.genre : "Other";
    const html = typeof b.file?.text === "string" ? b.file.text : "";
    const size = Buffer.byteLength(html, "utf8");
    if (!title || !description) return json(400, { error: "title_and_desc_required" });
    if (!size || size > FILE_MAX) return json(413, { error: "file_size" });
    if (!/<(html|body|script|canvas)/i.test(html)) return json(400, { error: "not_html" });

    let name = clip(b.file?.name, 100).replace(/[\\/\u0000-\u001f]/g, "_") || "game.html";
    if (!/\.html?$/i.test(name)) name += ".html";

    // Автор берётся из подписанного initData, а не из тела запроса.
    const row = await store.create({
      author_id: uid,
      author: clip(b.author || v.user.first_name, 40),
      tg: clip(v.user.username, 40),
      title, genre, description,
      version: clip(b.ver, 12) || "0.1",
      contact: clip(b.contact, 60),
      file_name: name,
      file_html: html,
    });
    if (!row) return json(429, { error: "rate_limit" }); // 5 заявок в сутки, считается в БД атомарно

    const staffIds = new Set([...adminIds, ...(await store.staffIds().catch(() => []))]);
    for (const a of staffIds) {
      notify(a, `Новая заявка в Coopix Market: «${row.title}» (${row.genre}) от ${row.author}${row.tg ? " @" + row.tg : ""}`);
    }
    return json(201, toWire(row));
  }

  /** Панель: пользователи, новости, адрес доната, команда. Модератору доступны только заявки (/api/subs). */
  async function admin(req, { uid, role, isMain }) {
    if (!role) return json(403, { error: "forbidden" });
    const m = req.method, q = req.query ?? {}, r = String(q.r ?? "");
    if (!isMain) return json(403, { error: "forbidden" }); // всё ниже только для главного админа

    // --- пользователи ---
    if (r === "stats") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      return json(200, await store.userStats());
    }
    if (r === "users") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      const num = (x, d, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+x) ? Math.trunc(+x) : d));
      const out = await store.listUsers({
        q: String(q.q ?? ""),
        filter: ["all", "active", "banned"].includes(q.filter) ? q.filter : "all",
        sort: q.sort === "reg" ? "reg" : "seen",
        limit: num(q.limit, 50, 1, 100),
        offset: num(q.offset, 0, 0, 1_000_000),
      });
      const modIds = new Set((await store.listMods()).map((x) => Number(x.tg_id)));
      return json(200, {
        total: out.total,
        rows: out.rows.map((u) => toUser(u, adminIds.includes(Number(u.tg_id)) ? "main" : modIds.has(Number(u.tg_id)) ? "moderator" : null)),
      });
    }
    if (r === "user") {
      if (m !== "PATCH") return json(405, { error: "method_not_allowed" });
      const id = String(q.id ?? "");
      if (!TG_ID.test(id)) return json(404, { error: "not_found" });
      const b = parseBody(req.body);
      if (!b || typeof b.banned !== "boolean") return json(400, { error: "bad_json" });
      const tid = Number(id);
      if (b.banned) {
        if (tid === uid) return json(400, { error: "cannot_ban_self" });
        const mods = (await store.listMods()).map((x) => Number(x.tg_id));
        if (adminIds.includes(tid) || mods.includes(tid)) return json(400, { error: "cannot_ban_staff" });
      }
      const row = await store.setBan(tid, b.banned, b.banned ? clip(b.reason, 200) : "", uid);
      if (!row) return json(404, { error: "not_found" });
      return json(200, toUser(row, null));
    }

    // --- новости ---
    if (r === "news") {
      if (m === "GET") return json(200, { items: (await store.getSetting("news"))?.value ?? [] });
      if (m === "PUT") {
        const b = parseBody(req.body);
        const items = cleanNews(b?.items);
        if (!items) return json(400, { error: "bad_news" });
        await store.setSetting("news", items, uid);
        return json(200, { items });
      }
      return json(405, { error: "method_not_allowed" });
    }

    // --- адрес доната (раздел «Помочь») ---
    if (r === "wallet") {
      if (m === "GET") {
        const w = await store.getSetting("wallet");
        return json(200, { addr: w?.value?.addr ?? "", updatedAt: w ? Date.parse(w.updated_at) : null, updatedBy: w?.updated_by ? String(w.updated_by) : null });
      }
      if (m === "PUT") {
        const b = parseBody(req.body);
        const addr = clip(b?.addr, 60);
        if (addr && !TRON.test(addr)) return json(400, { error: "bad_address" });
        const before = (await store.getSetting("wallet"))?.value?.addr ?? "";
        if (before === addr) return json(200, { addr, unchanged: true });
        await store.setSetting("wallet", { addr }, uid);
        // Смена адреса доната: предупреждаем всех главных админов, чтобы подмену нельзя было провернуть незаметно.
        for (const a of adminIds) notify(a, `Адрес доната в Coopix Market изменён (id ${uid}).\nБыл: ${before || "пусто"}\nСтал: ${addr || "пусто"}`);
        return json(200, { addr });
      }
      return json(405, { error: "method_not_allowed" });
    }

    // --- команда: главные админы (из ADMIN_IDS) и модераторы ---
    if (r === "team") {
      if (m === "GET") {
        const mods = await store.listMods();
        const names = await store.usersByIds([...adminIds, ...mods.map((x) => Number(x.tg_id))]);
        const nm = (id) => { const u = names.find((x) => Number(x.tg_id) === Number(id)); return u ? { name: u.first_name, username: u.username } : { name: "", username: "" }; };
        return json(200, {
          main: adminIds.map((id) => ({ id: String(id), ...nm(id) })),
          moderators: mods.map((x) => ({ id: String(x.tg_id), note: x.note, at: Date.parse(x.added_at), ...nm(x.tg_id) })),
        });
      }
      if (m === "POST") {
        const b = parseBody(req.body);
        const id = String(b?.id ?? "").trim();
        if (!TG_ID.test(id) || !Number(id)) return json(400, { error: "bad_id" });
        if (adminIds.includes(Number(id))) return json(400, { error: "already_main" });
        await store.addMod(Number(id), clip(b.note, 60), uid);
        return json(201, { ok: true });
      }
      if (m === "DELETE") {
        const id = String(q.id ?? "");
        if (!TG_ID.test(id)) return json(400, { error: "bad_id" });
        await store.removeMod(Number(id));
        return json(200, { ok: true });
      }
      return json(405, { error: "method_not_allowed" });
    }

    return json(404, { error: "not_found" });
  }

  return { handle };
}

/** Ссылка новости: пусто или https://... (http не пускаем). Возвращает строку или null, если ссылка некорректна. */
function cleanLink(v) {
  const u = String(v ?? "").trim();
  if (!u) return "";
  if (u.length > 300 || !/^https:\/\/[^\s"'<>]+$/i.test(u)) return null;
  try { new URL(u); } catch { return null; }
  return u;
}

/** Массив новостей из тела запроса -> очищенный массив или null при ошибке. */
function cleanNews(items) {
  if (!Array.isArray(items) || items.length > NEWS_MAX) return null;
  const out = [];
  for (const [i, n] of items.entries()) {
    if (!n || typeof n !== "object") return null;
    const title = clip(n.title, 60), text = clip(n.text, 200);
    if (!title) return null;
    const link = cleanLink(n.link);
    if (link === null) return null;
    out.push({
      id: clip(n.id, 20) || "n" + (i + 1),
      tag: clip(n.tag, 14) || "Новое",
      c: COLOR.test(n.c) ? n.c : "#a56bff",
      date: clip(n.date, 10),
      title, text, link,
    });
  }
  return out;
}

function parseBody(body) {
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return null; } }
  return body && typeof body === "object" ? body : null;
}
