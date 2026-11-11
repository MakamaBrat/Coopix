import { createHub, WEIGHTS } from "./hub.js";
import { randomBytes } from "node:crypto";
import { cleanGame, gameWire, coverFor, AUTHOR_FIELDS } from "./games.js";
import { createBot } from "./thanks.js";
import { modWire, MOD_ID } from "./mods.js";

const newGameId = () => "g" + Date.now().toString(36) + randomBytes(3).toString("hex");

export const GENRES = ["Arcade", "Music", "Shooter", "Puzzle", "Other"];
export const STATUSES = ["new", "seen", "pub"];
export const FILE_MAX = 1_500_000; // байт, как SUB_MAX на фронте

const STATUS_RU = { new: "Не просмотрено", seen: "Просмотрено", pub: "Опубликовано" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const NEWS_MAX = 10;
const TRON = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const BROADCAST_BATCH = 25, BROADCAST_GAP = 40; // рассылка: пачка на один вызов (успевает за лимит функции Vercel) и пауза между сообщениями, мс
/* настройки сайта (settings.site): ссылки на канал и чат на главной + общий выключатель скачивания */
const SITE_LINK = /^https:\/\/[^\s"'<>]{3,190}$/i;
const SITE_DEF = { channel: "https://t.me/coopixmarket", chat: "https://t.me/coopixchat", dlOff: false };
const siteOf = (v) => ({
  channel: SITE_LINK.test(v?.channel || "") ? v.channel : SITE_DEF.channel,
  chat: SITE_LINK.test(v?.chat || "") ? v.chat : SITE_DEF.chat,
  dlOff: v?.dlOff === true,
  dlWait: v?.dlWait === true,     // скачивание только через DL_WAIT_H часов после регистрации игрока
  playWait: v?.playWait === true, // играть только через PLAY_WAIT_M минут после регистрации
});
const DL_WAIT_H = 12, PLAY_WAIT_M = 30;
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
  file: r.file_size ? { name: r.file_name, size: r.file_size } : null, // null = HTML прислан в бота поддержки
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
export function createCore({ store, verify, botToken, adminIds = [], maxAgeSec = 86400, notify = () => {}, tgApi = null, tgFile = null, touchTtl = 30_000 }) {
  const json = (status, body) => ({ status, body });

  /* «Кто это»: touch_user пишет в базу (регистрация, последняя активность) и отдаёт бан и роль.
     Чтобы не делать эту запись на каждый запрос (счётчики, журнал, отзывы), результат держим touchTtl в памяти экземпляра функции.
     Старт маркета (/config), /me и админка всегда идут в базу. Бан и модератор, выданные здесь же, сбрасывают кэш сразу,
     выданные в другом экземпляре функции начинают действовать не позже чем через touchTtl. */
  const seen = new Map();
  async function touch(u, force) {
    const c = seen.get(u.id), now = Date.now();
    if (!force && touchTtl > 0 && c && now - c.at < touchTtl) return c.t;
    const t = (await store.touchUser(u)) ?? {};
    // первый заход = регистрация: ключевое событие для журнала админа (на график регистрации идут из users)
    if (t.created) await hub.log(u.id, "register", null, { k: 1 }, 0).catch((e) => console.error("[event]", e.message));
    if (seen.size > 5000) seen.clear();
    if (touchTtl > 0) seen.set(u.id, { t, at: now });
    return t;
  }
  const forget = (id) => seen.delete(Number(id));
  const hub = createHub({ store, botToken, notify, adminIds, tgApi, tgFile });
  const bot = createBot({ store, botToken, tgApi: tgApi ?? (async () => {}), notify, log: hub.log, weight: WEIGHTS.thank });

  async function handle(req) {
    // вебхук Telegram (оплата звёздами): без initData, проверяется секретным заголовком
    if (req.route === "bot") return req.method === "POST" ? bot.handle(req) : json(405, { error: "method_not_allowed" });
    const v = verify(req.headers?.["x-tg-init"], botToken, maxAgeSec);
    if (!v.ok) return json(401, { error: "unauthorized" });

    const uid = Number(v.userId);
    const isMain = adminIds.includes(uid);
    const m = req.method;
    // /api/hub?r=config = то же, что /api/config: маркет на старте будит одну функцию Vercel вместо двух
    const route = req.route === "hub" && req.query?.r === "config" ? "config" : req.route;

    // Заход: создаём/обновляем игрока (регистрация, «последняя активность»), узнаём бан и роль.
    const t = await touch({ id: uid, first_name: clip(v.user.first_name, 40), username: clip(v.user.username, 40) }, route === "config" || route === "me" || route === "admin");
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
    if (route === "config") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      const [news, wallet, site, me] = await Promise.all([store.getSetting("news"), store.getSetting("wallet"), store.getSetting("site"), store.getUser(uid)]);
      // role/admin здесь же: маркету на старте не нужен отдельный запрос /me (минус один круг до сервера)
      // reg + dlWaitH: маркет сам скрывает скачивание у новичков, пока не прошло dlWaitH часов с регистрации (команде не ограничиваем)
      return json(200, { news: news?.value ?? null, wallet: wallet?.value ?? null, site: { ...siteOf(site?.value), dlWaitH: DL_WAIT_H, playWaitM: PLAY_WAIT_M }, reg: me?.registered_at ? Date.parse(me.registered_at) : null, role, admin: staff });
    }

    // ---- /api/hub?r=...: отзывы, профили и посты, счётчики игр, журнал действий ----
    if (req.route === "hub") return hub.handle(req, { uid, staff, isMain });

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
      if (!f || (!staff && f.author_id !== uid) || !f.file_html) return json(404, { error: "not_found" }); // файла нет: прислан в бота
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
    // HTML-файл необязателен: игрок шлёт его боту поддержки (@Coopsupbot), а заявку оформляет здесь как раньше
    const html = typeof b.file?.text === "string" ? b.file.text : "";
    const size = Buffer.byteLength(html, "utf8");
    if (!title || !description) return json(400, { error: "title_and_desc_required" });
    if (html) {
      if (size > FILE_MAX) return json(413, { error: "file_size" });
      if (!/<(html|body|script|canvas)/i.test(html)) return json(400, { error: "not_html" });
    }
    let name = "";
    if (html) { name = clip(b.file?.name, 100).replace(/[\\/\u0000-\u001f]/g, "_") || "game.html"; if (!/\.html?$/i.test(name)) name += ".html"; }

    // Автор берётся из подписанного initData, а не из тела запроса.
    const row = await store.create({
      author_id: uid,
      author: clip(b.author || v.user.first_name, 40),
      tg: clip(v.user.username, 40),
      title, genre, description,
      version: clip(b.ver, 12) || "0.1",
      contact: clip(b.contact, 60),
      file_name: name,
      file_html: html || null,
    });
    if (!row) return json(429, { error: "rate_limit" }); // 5 заявок в сутки, считается в БД атомарно
    await hub.log(uid, "submit", null, { k: 1 }, WEIGHTS.submit).catch((e) => console.error("[event]", e.message)); // журнал не должен ломать отправку

    const staffIds = new Set([...adminIds, ...(await store.staffIds().catch(() => []))]);
    for (const a of staffIds) {
      notify(a, `Новая заявка в Coopix Market: «${row.title}» (${row.genre}) от ${row.author}${row.tg ? " @" + row.tg : ""}` + (html ? "" : "\nHTML-файл автор пришлёт в @Coopsupbot."));
    }
    return json(201, toWire(row));
  }

  /** Панель: пользователи, новости, адрес доната, команда. Модератору доступны только заявки (/api/subs). */
  async function admin(req, { uid, role, isMain }) {
    if (!role) return json(403, { error: "forbidden" });
    const m = req.method, q = req.query ?? {}, r = String(q.r ?? "");

    // --- правки страниц игр от авторов: смотрят админ и модератор ---
    if (r === "edits") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      const edits = await store.listEdits({ status: ["new", "approved", "rejected"].includes(q.status) ? q.status : undefined });
      const games = new Map((await store.listGames()).map((g) => [g.id, g]));
      const names = await store.usersByIds([...new Set(edits.map((e) => Number(e.author_id)))]);
      return json(200, edits.map((e) => ({
        id: e.id, game: e.game_id, title: games.get(e.game_id)?.title ?? e.game_id, current: games.get(e.game_id) ? gameWire(games.get(e.game_id), 0) : null,
        authorId: String(e.author_id), author: names.find((u) => Number(u.tg_id) === Number(e.author_id))?.first_name ?? "",
        patch: e.patch, status: e.status, comment: e.comment, at: Date.parse(e.created_at),
      })));
    }
    if (r === "edit") {
      if (m !== "PATCH") return json(405, { error: "method_not_allowed" });
      const id = String(q.id ?? "");
      if (!UUID.test(id)) return json(404, { error: "not_found" });
      const b = parseBody(req.body);
      if (!b || !["approved", "rejected"].includes(b.status)) return json(400, { error: "bad_status" });
      const e = await store.getEdit(id);
      if (!e) return json(404, { error: "not_found" });
      if (e.status !== "new") return json(409, { error: "already_done" });
      const g = await store.getGame(e.game_id);
      if (b.status === "approved") {
        if (!g) return json(404, { error: "not_found" });
        const { f, error } = cleanGame(e.patch, AUTHOR_FIELDS); // ещё раз через те же правила: в базе патч мог устареть
        if (error) return json(400, { error });
        await store.saveGame({ id: g.id, ...f });
      }
      const row = await store.updateEdit(id, { status: b.status, comment: clip(b.comment, 400) });
      notify(e.author_id, `Правки страницы «${g?.title ?? e.game_id}»: ${b.status === "approved" ? "одобрены, уже на сайте" : "отклонены"}` + (row.comment ? `\nКомментарий: ${row.comment}` : ""));
      return json(200, { id, status: row.status });
    }

    // --- моды: проверка (админ и модераторы) ---
    if (r === "mods") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      const mods = await store.listGameMods({ status: ["new", "approved", "rejected"].includes(q.status) ? q.status : undefined });
      const games = new Map((await store.listGames()).map((g) => [g.id, g.title]));
      return json(200, mods.map((x) => ({ ...modWire(x, { uid, pid: () => "" }), gameTitle: games.get(x.game_id) ?? x.game_id, authorId: String(x.author_id), file: x.file_name })));
    }
    if (r === "mod") {
      const id = String(q.id ?? "");
      const md = MOD_ID.test(id) ? await store.getGameMod(id) : null;
      if (!md) return json(404, { error: "not_found" });
      if (m === "DELETE") { await store.deleteGameMod(id); return json(200, { ok: true }); }
      if (m !== "PATCH") return json(405, { error: "method_not_allowed" });
      const b = parseBody(req.body);
      if (!b || !["approved", "rejected"].includes(b.status)) return json(400, { error: "bad_status" });
      const row = await store.updateGameMod(id, { status: b.status, comment: clip(b.comment, 400) });
      if (md.status !== row.status) {
        const g = await store.getGame(md.game_id);
        notify(md.author_id, `Мод «${md.title}» для игры «${g?.title ?? md.game_id}»: ${b.status === "approved" ? "одобрен, уже на странице игры" : "отклонён"}` + (row.comment ? `\nКомментарий: ${row.comment}` : ""));
      }
      return json(200, { id, status: row.status });
    }

    if (!isMain) return json(403, { error: "forbidden" }); // всё ниже только для главного админа

    // --- подключить приём звёзд: регистрирует вебхук бота на этот сайт ---
    if (r === "webhook") {
      if (m !== "POST") return json(405, { error: "method_not_allowed" });
      const url = String(parseBody(req.body)?.url ?? "");
      if (!/^https:\/\/[a-z0-9.-]+(:\d+)?\/api\/bot$/i.test(url)) return json(400, { error: "bad_url" });
      if (!tgApi) return json(503, { error: "payments_off" });
      try {
        await tgApi("setWebhook", { url, secret_token: bot.secret, allowed_updates: ["message", "pre_checkout_query"] });
        return json(200, { ok: true, url });
      } catch (e) { return json(502, { error: "telegram_error", detail: String(e?.message ?? "").slice(0, 200) }); }
    }

    // --- каталог игр: список, доступ, порядок ---
    if (r === "games") {
      if (m !== "GET") return json(405, { error: "method_not_allowed" });
      return json(200, (await store.listGames()).map((g) => ({ ...gameWire(g, 0), authorId: g.author_id == null ? null : String(g.author_id), submission: g.submission })));
    }
    if (r === "game") {
      const b = parseBody(req.body);
      if (m === "POST") {
        const { f, error } = cleanGame(b);
        if (error) return json(400, { error });
        if (!f.title) return json(400, { error: "title_required" });
        const row = await store.saveGame({ id: newGameId(), tags: ["Arcade"], access: "staff", ...f });
        return json(201, gameWire(row, 0));
      }
      const id = String(q.id ?? "");
      if (!/^[a-z0-9_-]{1,32}$/.test(id)) return json(404, { error: "not_found" });
      if (m === "PATCH") {
        const { f, error } = cleanGame(b);
        if (error) return json(400, { error });
        if (!Object.keys(f).length) return json(400, { error: "empty_patch" });
        if (!(await store.getGame(id))) return json(404, { error: "not_found" });
        return json(200, gameWire(await store.saveGame({ id, ...f }), 0));
      }
      if (m === "DELETE") {
        if (!(await store.getGame(id))) return json(404, { error: "not_found" });
        await store.deleteGame(id);
        return json(200, { ok: true });
      }
      return json(405, { error: "method_not_allowed" });
    }
    // --- заявка -> игра в каталоге (по умолчанию «только админы», чтобы проверить перед выходом) ---
    if (r === "publish") {
      if (m !== "POST") return json(405, { error: "method_not_allowed" });
      const b = parseBody(req.body);
      const sid = String(b?.submission ?? "");
      if (!UUID.test(sid)) return json(404, { error: "not_found" });
      const sub = await store.get(sid), html = await store.getHtml(sid);
      if (!sub || !html) return json(404, { error: "not_found" });
      if ((await store.listGames()).some((g) => g.submission === sid)) return json(409, { error: "already_published" });
      const access = ["public", "staff"].includes(b.access) ? b.access : "staff";
      const row = await store.saveGame({
        id: newGameId(), title: sub.title.slice(0, 40), tags: [sub.genre], description: sub.description, version: sub.version,
        author_name: String(sub.author).slice(0, 24), author_id: sub.author_id, item: "cassette", cover: coverFor(sub.genre), access,
        sort: 100, file_html: html.file_html, submission: sid,
      });
      await store.update(sid, { status: "pub" });
      notify(sub.author_id, `Ваша игра «${sub.title}» добавлена в маркет` + (access === "public" ? "." : " (пока в режиме проверки, скоро откроем всем)."));
      return json(201, gameWire(row, 0));
    }

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
      forget(tid); // бан действует сразу (в этом экземпляре функции)
      if (!row) return json(404, { error: "not_found" });
      return json(200, toUser(row, null));
    }

    // --- рассылка от бота всем игрокам (кроме забаненных): пачками, админка вызывает повторно с курсором after ---
    if (r === "broadcast") {
      if (m !== "POST") return json(405, { error: "method_not_allowed" });
      if (!tgApi) return json(503, { error: "payments_off" });
      const b = parseBody(req.body);
      const text = String(b?.text ?? "").trim().slice(0, 2000);
      if (text.length < 2) return json(400, { error: "bad_text" });
      const after = Number.isSafeInteger(Number(b.after)) ? Number(b.after) : 0;
      const ids = await store.userIdsAfter(after, BROADCAST_BATCH);
      let sent = 0, failed = 0;
      for (const id of ids) {
        try { await tgApi("sendMessage", { chat_id: id, text }); sent++; } catch { failed++; } // не открывал бота / заблокировал его
        await new Promise((res) => setTimeout(res, BROADCAST_GAP));                          // ~25 сообщений в секунду: лимит Telegram 30
      }
      const s = after === 0 ? await store.userStats() : null;
      return json(200, { sent, failed, next: ids.length === BROADCAST_BATCH ? ids[ids.length - 1] : null, total: s ? s.total - s.banned : undefined });
    }

    // --- сайт: ссылки «Канал» и «Чатик» на главной, общий выключатель скачивания ---
    if (r === "site") {
      if (m === "GET") return json(200, siteOf((await store.getSetting("site"))?.value));
      if (m === "PUT") {
        const b = parseBody(req.body);
        if (!b) return json(400, { error: "bad_json" });
        const cur = siteOf((await store.getSetting("site"))?.value), next = { ...cur };
        for (const k of ["channel", "chat"]) if (b[k] !== undefined) {
          const v = clip(b[k], 200);
          if (!SITE_LINK.test(v)) return json(400, { error: "bad_link" });
          next[k] = v;
        }
        if (b.dlOff !== undefined) { if (typeof b.dlOff !== "boolean") return json(400, { error: "bad_json" }); next.dlOff = b.dlOff; }
        if (b.dlWait !== undefined) { if (typeof b.dlWait !== "boolean") return json(400, { error: "bad_json" }); next.dlWait = b.dlWait; }
        if (b.playWait !== undefined) { if (typeof b.playWait !== "boolean") return json(400, { error: "bad_json" }); next.playWait = b.playWait; }
        await store.setSetting("site", next, uid);
        return json(200, next);
      }
      return json(405, { error: "method_not_allowed" });
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
        forget(id);
        return json(201, { ok: true });
      }
      if (m === "DELETE") {
        const id = String(q.id ?? "");
        if (!TG_ID.test(id)) return json(400, { error: "bad_id" });
        await store.removeMod(Number(id));
        forget(id);
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
