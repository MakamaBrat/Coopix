import { pidCodec } from "./pid.js";
import { cleanGame, gameWire, isVisible, toPatch, AUTHOR_FIELDS, IMG_REF } from "./games.js";
import { STAR_OPTIONS, makePayload } from "./thanks.js";
import { cleanMod, modWire, MOD_ID, MODS_PENDING_MAX } from "./mods.js";

/**
 * Данные сообщества: отзывы и рейтинг, профили с постом, счётчики игр, журнал действий и график активности.
 * Маршруты: /api/hub?r=stats|reviews|avatars|profile|post|track|activity|feed (личность и бан проверяет core.js).
 */

/** Вес действия в «ресурсе COOP» (график активности). Типы, которых здесь нет, весят 0. */
export const WEIGHTS = {
  register: 10, // только для графика (в SQL activity_series то же число): регистрация = первый заход
  visit: 2, play: 5, download: 5, fav: 2,
  review: 20, post: 10, card: 25, submit: 25, thank: 40, mod: 25,
};

/** Типы, которые клиент может прислать сам (/track). Остальные пишет только сервер в момент действия. */
export const CLIENT_EVENTS = ["visit", "open", "play", "download", "fav", "unfav", "card"];
const NEEDS_GAME = new Set(["open", "play", "download", "fav", "unfav"]);
/** Не чаще раза в N мс на игрока (и на игру): защита от накрутки нажатием в цикле. */
const COOLDOWN = { visit: 30 * 60e3, open: 3e3, play: 3e3, download: 3e3, fav: 1e3, unfav: 1e3, card: 3e3 };
export const HOURLY_EVENTS = 300;   // любых действий в час от одного игрока
export const REVIEWS_PER_DAY = 30;  // записей отзыва (новых и правок) в сутки
export const POSTS_PER_HOUR = 10;   // сохранений поста в час
export const REVIEWS_MAX = 300;     // сколько последних отзывов игры отдаём
export const FEED_MAX = 50;

const GAME_ID = /^[a-z0-9_-]{1,32}$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const PHOTO = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
const PHOTO_MAX = 40000;
const MEDAL_ID = /^[a-z0-9]{2,16}$/;
const STAT_KEYS = ["plays", "ids", "best", "reviews", "favs", "made", "custom", "days"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const int = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+v) ? Math.trunc(+v) : lo));
const lvOf = (xp) => Math.min(10, Math.floor(Math.sqrt(xp / 50)) + 1);
const ts = (v) => (v ? Date.parse(v) : null);

function parseBody(body) {
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return null; } }
  return body && typeof body === "object" ? body : null;
}

/**
 * store (кроме методов core.js): getUser, getProfile, saveProfile, setPost, profilesByIds,
 * listReviews, getReview, getUserReview, saveReview, deleteReview,
 * addEvents, countEvents, lastEventTs, listEvents, firstEventTs, gameStats, activitySeries.
 */
/** Ник игрока = имя из Telegram (проверенный initData, обновляется при каждом заходе). Сменить его в приложении нельзя. */
const tgName = (u) => clip(u?.first_name || u?.username || "", 16) || "Игрок";

export function createHub({ store, botToken, notify = () => {}, adminIds = [], tgApi = null, tgFile = null }) {
  const pid = pidCodec(botToken);
  const json = (status, body) => ({ status, body });

  /**
   * Фото профиля Telegram через бота (браузер не может обработать картинку с t.me на canvas).
   * Наименьший размер от 128 px, только JPEG до 200 КБ. tgFile(path) -> Buffer.
   */
  const tgPhotoAt = new Map(); // не чаще раза в 10 с на игрока в пределах одного экземпляра функции
  async function tgPhoto(uid) {
    if (!tgApi || !tgFile) return json(200, { photo: "" });
    const now = Date.now();
    if ((tgPhotoAt.get(uid) ?? 0) > now - 10_000) return json(429, { error: "rate_limit" });
    if (tgPhotoAt.size > 5000) tgPhotoAt.clear();
    tgPhotoAt.set(uid, now);
    try {
      const sizes = (await tgApi("getUserProfilePhotos", { user_id: uid, limit: 1 }))?.photos?.[0];
      if (!Array.isArray(sizes) || !sizes.length) return json(200, { photo: "" }); // фото нет или скрыто настройками приватности
      const s = [...sizes].sort((a, b) => a.width - b.width).find((x) => x.width >= 128) ?? sizes[sizes.length - 1];
      const f = await tgApi("getFile", { file_id: s.file_id });
      if (!f?.file_path) return json(200, { photo: "" });
      const buf = await tgFile(f.file_path);
      if (!buf || buf.length > 200_000 || buf[0] !== 0xff || buf[1] !== 0xd8) return json(200, { photo: "" });
      return json(200, { photo: "data:image/jpeg;base64," + Buffer.from(buf).toString("base64") });
    } catch {
      return json(502, { error: "telegram_unavailable" }); // без деталей: в URL файла токен бота
    }
  }

  // «Играли» и «Скачали» = разные игроки: один игрок никогда не считается дважды (повторные запуски видны только в журнале)
  const statWire = (s = {}) => ({
    plays: +s.play_players || 0, playPlayers: +s.play_players || 0,
    downloads: +s.dl_players || 0, dlPlayers: +s.dl_players || 0,
    reviews: +s.reviews || 0, rated: +s.rated || 0, rating: +s.rating || 0,
    stars: +s.stars || 0, backers: +s.backers || 0,
  });
  async function statsFor(ids) {
    const [rows, th] = await Promise.all([store.gameStats(ids), store.thanksStats(ids)]);
    return Object.fromEntries(ids.map((id) => [id, statWire({ ...rows.find((x) => x.game_id === id), ...th.find((x) => x.game_id === id) })]));
  }
  const gameIds = (v) => [...new Set(String(v ?? "").split(",").map((s) => s.trim()).filter((s) => GAME_ID.test(s)))].slice(0, 50);

  /** Имя и цвет автора. Фото отдельно (/avatars), чтобы список отзывов не тянул десятки килобайт. */
  const authorWire = (p) => ({ n: tgName(p), c: COLOR.test(p?.color || "") ? p.color : "#a56bff", hp: !!p?.photo });
  async function authors(ids) {
    const rows = ids.length ? await store.profilesByIds(ids) : [];
    const by = new Map(rows.map((r) => [Number(r.tg_id), r]));
    return { by, wire: Object.fromEntries(ids.map((id) => [pid.encode(id), authorWire(by.get(id))])) };
  }

  const reviewWire = (r, uid) => ({
    id: r.id, pid: pid.encode(r.author_id), r: r.rating, t: r.body,
    d: Date.parse(r.updated_at ?? r.created_at), me: Number(r.author_id) === uid,
  });

  const postWire = (p, hide) => (p && p.post_text && !hide ? { title: p.post_title, text: p.post_text, at: ts(p.post_at) } : null);
  const profileWire = (u, p, me) => ({
    id: pid.encode(u.tg_id), me, has: !!p, synced: !!p?.synced,
    name: tgName(u),
    color: COLOR.test(p?.color || "") ? p.color : "#a56bff",
    photo: p?.photo || "",
    xp: p?.xp || 0, medals: p?.medals || {}, stats: p?.stats || {},
    reg: ts(u.registered_at), post: postWire(p, u.banned),
  });

  async function track(uid, req) {
    const b = parseBody(req.body);
    if (!b) return json(400, { error: "bad_json" });
    const list = Array.isArray(b.events) ? b.events.slice(0, 20) : [b];
    const now = Date.now();
    if ((await store.countEvents(uid, now - 3600e3)) >= HOURLY_EVENTS) return json(429, { error: "rate_limit" });

    const rows = [], games = new Set();
    for (const e of list) {
      const type = String(e?.type ?? "");
      if (!CLIENT_EVENTS.includes(type)) return json(400, { error: "bad_type" });
      const game = NEEDS_GAME.has(type) ? String(e.game ?? "") : null;
      if (NEEDS_GAME.has(type) && !GAME_ID.test(game)) return json(400, { error: "bad_game" });
      // время с клиента принимаем только если событие из очереди «нет связи»: не в будущем и не старше суток
      const t = Number(e.t);
      const at = Number.isFinite(t) && t <= now + 5000 && t >= now - 86400e3 ? Math.min(t, now) : now;
      const last = await store.lastEventTs(uid, type, game);
      const pend = rows.filter((r) => r.type === type && r.game_id === game).map((r) => r.ts.getTime());
      if (Math.max(last ?? 0, ...pend) + COOLDOWN[type] > at) continue; // слишком часто: пропускаем без ошибки
      rows.push({ user_id: uid, type, game_id: game, weight: WEIGHTS[type] ?? 0, meta: {}, ts: new Date(at) });
      if (game && (type === "play" || type === "download")) games.add(game);
    }
    if (rows.length) await store.addEvents(rows);
    return json(200, { ok: true, accepted: rows.length, stats: games.size ? await statsFor([...games]) : undefined });
  }

  /** Столбцы и линия графика: 4 периода, с учётом часового пояса игрока (границы ведр по его местному времени). */
  async function activity(q) {
    const nowS = Math.floor(Date.now() / 1000);
    const off = -int(q.tz, -840, 840) * 60; // JS getTimezoneOffset() = UTC − местное, в минутах
    const first = await store.firstEventTs();
    const allStep = Math.max(3600, Math.ceil(Math.max(nowS - Math.floor((first ?? Date.now()) / 1000), 1) / 40 / 3600) * 3600);
    const plan = [[24, 3600], [28, 6 * 3600], [30, 86400], [40, allStep]];
    const series = await Promise.all(plan.map(async ([n, step]) => {
      const end = Math.ceil((nowS + off) / step) * step - off; // правая граница последнего ведра: на «круглом» местном времени
      const start = end - n * step;
      const s = await store.activitySeries({ startMs: start * 1000, stepSec: step, n });
      return { step, t0: start * 1000, base: s.base, rows: s.rows };
    }));
    return json(200, { weights: WEIGHTS, series });
  }

  /** Событие, которое сервер пишет сам в момент действия (отзыв, пост, заявка): подделать его через /track нельзя. */
  const log = (uid, type, game = null, meta = {}, weight = WEIGHTS[type] ?? 0) =>
    store.addEvents([{ user_id: uid, type, game_id: game, weight, meta, ts: new Date() }]);

  return {
    pid,
    log,

    async handle(req, { uid, staff }) {
      const q = req.query ?? {}, r = String(q.r ?? ""), m = req.method;
      const bad = () => json(405, { error: "method_not_allowed" });

      // ---------- каталог игр: что видит игрок ----------
      if (r === "games") {
        if (m !== "GET") return bad();
        return json(200, { games: (await store.listGames()).filter((g) => isVisible(g, staff)).map((g) => gameWire(g, uid)) });
      }
      if (r === "gamefile") {
        if (m !== "GET") return bad();
        const id = String(q.id ?? "");
        const g = GAME_ID.test(id) ? await store.getGame(id) : null;
        if (!g || !g.has_file || !isVisible(g, staff)) return json(404, { error: "not_found" });
        return json(200, { text: (await store.gameHtml(id))?.file_html ?? "" });
      }
      // обложка-картинка отдельно от списка (список лёгкий, картинки клиент кэширует по хэшу)
      if (r === "cover") {
        if (m !== "GET") return bad();
        const id = String(q.id ?? "");
        const g = GAME_ID.test(id) ? await store.getGame(id) : null;
        const bg = q.kind === "bg", ref = g && (bg ? g.bg_ref : g.cover);
        if (!g || !IMG_REF.test(ref ?? "") || !isVisible(g, staff) && !(g.author_id != null && Number(g.author_id) === uid)) return json(404, { error: "not_found" });
        const row = await store.gameCover(id);
        const img = bg ? row?.bg_img : row?.cover_img;
        return img ? json(200, { ref, img }) : json(404, { error: "not_found" });
      }
      // ---------- моды: список одобренных, файл, предложить свой ----------
      if (r === "mods") {
        if (m !== "GET") return bad();
        const id = String(q.game ?? "");
        const g = GAME_ID.test(id) ? await store.getGame(id) : null;
        if (!g || !isVisible(g, staff)) return json(404, { error: "not_found" });
        const W = { uid, pid: (a) => pid.encode(Number(a)) };
        const all = await store.listGameMods({ gameId: id });
        return json(200, { items: all.filter((x) => x.status === "approved").map((x) => modWire(x, W)), mine: all.filter((x) => Number(x.author_id) === uid && x.status !== "approved").map((x) => modWire(x, W)) });
      }
      if (r === "modfile") {
        if (m !== "GET") return bad();
        const id = String(q.id ?? "");
        const md = MOD_ID.test(id) ? await store.getGameMod(id) : null;
        const g = md ? await store.getGame(md.game_id) : null;
        const can = md && (staff || Number(md.author_id) === uid || (md.status === "approved" && g && isVisible(g, false)));
        if (!can) return json(404, { error: "not_found" });
        return json(200, { name: md.file_name, text: (await store.gameModHtml(id))?.file_html ?? "" });
      }
      if (r === "mod" && m === "POST") {
        const b = parseBody(req.body);
        const id = String(b?.game ?? "");
        const g = GAME_ID.test(id) ? await store.getGame(id) : null;
        if (!g || !isVisible(g, staff)) return json(404, { error: "not_found" });
        const { f, error, status } = cleanMod(b);
        if (error) return json(status, { error });
        const mine = await store.listGameMods({ authorId: uid });
        if (mine.filter((x) => x.status === "new").length >= MODS_PENDING_MAX) return json(429, { error: "too_many_pending" });
        const u = await store.getUser(uid);
        const row = await store.createGameMod({ ...f, game_id: g.id, author_id: uid, author_name: String(u?.first_name || "Игрок").slice(0, 40) });
        await log(uid, "mod", g.id, {}, WEIGHTS.mod).catch(() => {});
        const staffIds = new Set([...adminIds, ...(await store.staffIds().catch(() => []))]);
        for (const a of staffIds) notify(a, `Новый мод «${row.title}» для игры «${g.title}». Админ-панель → Моды.`);
        return json(201, modWire(row, { uid, pid: (a) => pid.encode(Number(a)) }));
      }
      if (r === "mod" && m === "DELETE") {
        const id = String(q.id ?? "");
        const md = MOD_ID.test(id) ? await store.getGameMod(id) : null;
        if (!md || Number(md.author_id) !== uid) return json(404, { error: "not_found" });
        await store.deleteGameMod(id);
        return json(200, { ok: true });
      }
      if (r === "mymods") {
        if (m !== "GET") return bad();
        return json(200, { items: (await store.listGameMods({ authorId: uid })).slice(0, 30).map((x) => modWire(x, { uid, pid: (a) => pid.encode(Number(a)) })) });
      }

      // ---------- «Спасибо автору»: счёт в звёздах Telegram ----------
      if (r === "thank") {
        if (m !== "POST") return bad();
        const b = parseBody(req.body);
        const stars = Number(b?.stars), id = String(b?.game ?? "");
        if (typeof b?.stars !== "number" || !STAR_OPTIONS.includes(stars)) return json(400, { error: "bad_stars" });
        const g = GAME_ID.test(id) ? await store.getGame(id) : null;
        if (!g || !isVisible(g, staff)) return json(404, { error: "not_found" });
        if (!tgApi) return json(503, { error: "payments_off" });
        if ((await store.countEvents(uid, Date.now() - 3600e3, "invoice")) >= 30) return json(429, { error: "rate_limited" });
        await log(uid, "invoice", g.id, { s: stars }, 0);
        try {
          const link = await tgApi("createInvoiceLink", {
            title: "Спасибо автору", description: `Поддержка игры «${g.title}» в Coopix Market: ⭐ ${stars}`,
            payload: makePayload(g.id, uid, stars), currency: "XTR", prices: [{ label: "Спасибо автору", amount: stars }],
          });
          return json(200, { link });
        } catch (e) { console.error("[thank]", e?.message); return json(502, { error: "telegram_error" }); }
      }
      // ---------- автор предлагает изменить страницу своей игры: попадает админу на одобрение ----------
      if (r === "myedit") {
        if (m !== "POST") return bad();
        const b = parseBody(req.body);
        if (!b) return json(400, { error: "bad_json" });
        const g = GAME_ID.test(String(b.game)) ? await store.getGame(String(b.game)) : null;
        if (!g) return json(404, { error: "not_found" });
        if (g.author_id == null || Number(g.author_id) !== uid) return json(403, { error: "forbidden" });
        const { f, error } = cleanGame(b.patch, AUTHOR_FIELDS);
        if (error) return json(400, { error });
        if (!Object.keys(f).length) return json(400, { error: "empty_patch" });
        const e = await store.createEdit({ game_id: g.id, author_id: uid, patch: toPatch(f) });
        const staffIds = new Set([...adminIds, ...(await store.staffIds().catch(() => []))]);
        for (const a of staffIds) notify(a, `Автор предложил правки страницы игры «${g.title}». Откройте админ-панель → Правки.`);
        return json(201, { id: e.id, status: e.status });
      }
      if (r === "myedits") {
        if (m !== "GET") return bad();
        return json(200, { items: (await store.listEdits({ authorId: uid })).slice(0, 20).map((e) => ({ id: e.id, game: e.game_id, patch: e.patch, status: e.status, comment: e.comment, at: Date.parse(e.created_at) })) });
      }

      // ---------- счётчики и рейтинг игр ----------
      if (r === "stats") {
        if (m !== "GET") return bad();
        return json(200, { games: await statsFor(gameIds(q.ids)) });
      }

      // ---------- отзывы ----------
      if (r === "reviews") {
        if (m === "GET") {
          const game = String(q.game ?? "");
          if (!GAME_ID.test(game)) return json(400, { error: "bad_game" });
          const rows = await store.listReviews(game, REVIEWS_MAX);
          const au = await authors([...new Set(rows.map((x) => Number(x.author_id)))]);
          return json(200, { items: rows.map((x) => reviewWire(x, uid)), authors: au.wire, stats: (await statsFor([game]))[game] });
        }
        if (m === "POST") {
          const b = parseBody(req.body);
          if (!b) return json(400, { error: "bad_json" });
          const game = String(b.game ?? "");
          if (!GAME_ID.test(game)) return json(400, { error: "bad_game" });
          const rating = int(b.rating, 0, 5), body = clip(b.text, 240);
          if (body.length < 2) return json(400, { error: "text_short" });
          if ((await store.countEvents(uid, Date.now() - 86400e3, "review")) >= REVIEWS_PER_DAY) return json(429, { error: "rate_limit" });
          const prev = await store.getUserReview(game, uid);
          const row = await store.saveReview({ id: prev?.id, game, uid, rating, body });
          // за первый отзыв на игру начисляем ресурс, правки бесплатные: отзыв нельзя «накручивать» перезаписью
          await log(uid, "review", game, prev ? { r: rating, e: 1 } : { r: rating }, prev ? 0 : WEIGHTS.review);
          return json(prev ? 200 : 201, { created: !prev, item: reviewWire(row, uid), stats: (await statsFor([game]))[game] });
        }
        if (m === "DELETE") {
          const id = String(q.id ?? "");
          if (!UUID.test(id)) return json(404, { error: "not_found" });
          const row = await store.getReview(id);
          if (!row) return json(404, { error: "not_found" });
          if (Number(row.author_id) !== uid && !staff) return json(403, { error: "forbidden" });
          await store.deleteReview(id);
          await log(uid, "review_del", row.game_id);
          return json(200, { ok: true, stats: (await statsFor([row.game_id]))[row.game_id] });
        }
        return bad();
      }

      // ---------- фото профилей пачкой (лениво, только для видимых отзывов) ----------
      if (r === "avatars") {
        if (m !== "GET") return bad();
        const ids = String(q.ids ?? "").split(",").map((s) => pid.decode(s.trim())).filter(Boolean).slice(0, 30);
        const rows = ids.length ? await store.profilesByIds(ids) : [];
        return json(200, Object.fromEntries(rows.map((p) => [pid.encode(p.tg_id), { p: PHOTO.test(p.photo || "") ? p.photo : "", c: authorWire(p).c }])));
      }

      // ---------- фото из Telegram (только своё) ----------
      if (r === "tgphoto") {
        if (m !== "GET") return bad();
        return tgPhoto(uid);
      }

      // ---------- профиль ----------
      if (r === "profile") {
        if (m === "GET") {
          const target = !q.id || q.id === "me" ? uid : pid.decode(String(q.id));
          if (!target) return json(404, { error: "not_found" });
          const u = await store.getUser(target);
          if (!u) return json(404, { error: "not_found" });
          return json(200, profileWire(u, await store.getProfile(target), target === uid));
        }
        if (m === "PUT") {
          const b = parseBody(req.body);
          if (!b) return json(400, { error: "bad_json" });
          const prev = await store.getProfile(uid);
          const f = {};
          f.name = tgName(await store.getUser(uid)); // ник только из Telegram: присланный клиентом игнорируем
          if (b.color !== undefined) { if (!COLOR.test(b.color)) return json(400, { error: "bad_color" }); f.color = b.color.toLowerCase(); }
          if (b.photo !== undefined) {
            if (b.photo !== "" && !(typeof b.photo === "string" && b.photo.length <= PHOTO_MAX && PHOTO.test(b.photo))) return json(400, { error: "bad_photo" });
            f.photo = b.photo;
          }
          // опыт и медали только растут: старое устройство не может «откатить» профиль
          f.xp = Math.max(prev?.xp ?? 0, int(b.xp, 0, 1_000_000));
          const medals = { ...(prev?.medals ?? {}) };
          if (b.medals && typeof b.medals === "object" && !Array.isArray(b.medals)) {
            for (const [k, v] of Object.entries(b.medals).slice(0, 40)) {
              if (MEDAL_ID.test(k) && Number.isFinite(+v) && +v > 0 && !medals[k]) medals[k] = Math.min(Math.trunc(+v), Date.now());
            }
          }
          f.medals = medals;
          const stats = { ...(prev?.stats ?? {}) };
          if (b.stats && typeof b.stats === "object") for (const k of STAT_KEYS) if (b.stats[k] !== undefined) stats[k] = Math.max(stats[k] ?? 0, int(b.stats[k], 0, 10_000_000));
          f.stats = stats;
          f.synced = true;
          await store.saveProfile(uid, f);

          // Журнал: смена имени/аватара, новые медали, новый уровень. Первую синхронизацию не считаем действиями (иначе всё накопленное попадёт в журнал разом).
          if (prev?.synced) {
            const ev = [];
            const base = { user_id: uid, game_id: null, weight: 0, ts: new Date() };
            if ((f.color !== undefined && f.color !== prev.color) || (f.photo !== undefined && f.photo !== prev.photo)) ev.push({ ...base, type: "profile", meta: {} });
            for (const k of Object.keys(medals)) if (!prev.medals?.[k]) ev.push({ ...base, type: "medal", meta: { m: k } });
            if (lvOf(f.xp) > lvOf(prev.xp ?? 0)) ev.push({ ...base, type: "level", meta: { lv: lvOf(f.xp) } });
            if (ev.length) await store.addEvents(ev);
          }
          const u = await store.getUser(uid);
          return json(200, profileWire(u, await store.getProfile(uid), true));
        }
        return bad();
      }

      // ---------- пост: один на игрока, с описанием ----------
      if (r === "post") {
        if (m === "PUT") {
          const b = parseBody(req.body);
          if (!b) return json(400, { error: "bad_json" });
          const title = clip(b.title, 60), text = clip(b.text, 600);
          if (!text) return json(400, { error: "text_required" });
          if ((await store.countEvents(uid, Date.now() - 3600e3, "post")) >= POSTS_PER_HOUR) return json(429, { error: "rate_limit" });
          const prev = await store.getProfile(uid);
          const row = await store.setPost(uid, { title, text });
          await log(uid, "post", null, prev?.post_text ? { e: 1 } : {}, prev?.post_text ? 0 : WEIGHTS.post);
          return json(200, { post: postWire(row, false) });
        }
        if (m === "DELETE") {
          const target = q.id ? pid.decode(String(q.id)) : uid;
          if (!target) return json(404, { error: "not_found" });
          if (target !== uid && !staff) return json(403, { error: "forbidden" });
          await store.setPost(target, null);
          await log(uid, "post_del", null, {});
          return json(200, { ok: true });
        }
        return bad();
      }

      // ---------- действия клиента ----------
      if (r === "track") {
        if (m !== "POST") return bad();
        return track(uid, req);
      }

      // ---------- график и журнал ----------
      if (r === "activity") {
        if (m !== "GET") return bad();
        return activity(q);
      }
      if (r === "feed") {
        if (m !== "GET") return bad();
        if (!staff) return json(403, { error: "forbidden" }); // журнал действий видят только админы и модераторы
        const limit = int(q.limit ?? 30, 1, FEED_MAX);
        const before = q.before ? int(q.before, 0, Number.MAX_SAFE_INTEGER) : undefined;
        const rows = await store.listEvents({ limit, before });
        const au = await authors([...new Set(rows.map((x) => Number(x.user_id)))]);
        return json(200, {
          items: rows.map((x) => ({
            id: x.id, t: Date.parse(x.ts), pid: pid.encode(x.user_id), me: Number(x.user_id) === uid,
            type: x.type, game: x.game_id, meta: x.meta ?? {},
          })),
          authors: au.wire,
          next: rows.length === limit ? rows[rows.length - 1].id : null,
        });
      }

      return json(404, { error: "not_found" });
    },
  };
}
