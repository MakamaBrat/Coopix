/**
 * «Спасибо автору»: игрок поддерживает игру звёздами Telegram (валюта XTR).
 * 1. Клиент просит счёт: POST /api/hub?r=thank { game, stars } -> { link } (createInvoiceLink).
 * 2. Telegram открывает оплату в мини-аппе (WebApp.openInvoice).
 * 3. Telegram шлёт вебхук на /api/bot: pre_checkout_query (проверяем и подтверждаем) и successful_payment (записываем).
 * Звёзды приходят на баланс бота проекта и засчитываются автору игры (выплату автору делает админ).
 * Вебхук принимается только с секретным заголовком, который знает Telegram (секрет выводится из токена бота).
 */
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { WIDGET_GAMES } from "./widgets.js";

export const STAR_OPTIONS = [10, 50, 100, 250, 500];
export const webhookSecret = (botToken) => createHash("sha256").update("coopix-webhook:" + botToken).digest("hex").slice(0, 48);

const PAYLOAD = /^th:([a-z0-9_-]{1,32}):(\d{1,15}):(\d{1,5})$/;
export const makePayload = (game, uid, stars) => `th:${game}:${uid}:${stars}`;
/** Покупка платной игры: by:<игра>:<игрок>:<цена>. Цена сверяется с текущей ценой игры при оплате. */
const BUY = /^by:([a-z0-9_-]{1,32}):(\d{1,15}):(\d{1,5})$/;
export const makeBuyPayload = (game, uid, price) => `by:${game}:${uid}:${price}`;
export function parseBuy(p) { const m = BUY.exec(String(p ?? "")); return m ? { game: m[1], uid: Number(m[2]), price: Number(m[3]) } : null; }
export function parsePayload(p) {
  const m = PAYLOAD.exec(String(p ?? ""));
  if (!m) return null;
  return { game: m[1], uid: Number(m[2]), stars: Number(m[3]) };
}

export const RANDOM_BTN = "🎲 Рандомная игра";
const MEM_DECK = new Map(); // очередь игрока в памяти сервера — если в базе ещё нет колонок для неё
const BTN_TEXTS = [RANDOM_BTN, "🎲 Случайная игра"]; // старая надпись — у тех, кому кнопка пришла раньше
const KB = { keyboard: [[{ text: RANDOM_BTN }]], resize_keyboard: true, is_persistent: true };
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** Мини-игра -> HTML виджета: без комментариев, отступов, <title> и viewport; заглушка matchMedia (в виджете нет браузера).
 *  null, если не влезает в лимиты Telegram (32768 байт и 4096 байт после zlib-9). */
export function widgetHtml(h, raw = false) {
  if (typeof h !== "string" || !h) return null;
  let s = h.replace(/<title>[\s\S]*?<\/title>/i, "").replace(/<meta name="viewport"[^>]*>/i, "")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n[ \t]*/g, "\n").replace(/\n+/g, "\n").replace(/\0/g, "").trim();
  /* среда виджета (не браузер): нет getImageData/putImageData и теней — «чёткие пиксели» и тени выключаем;
     высота 100% в пузыре не растягивается — холст задаём пропорцией 8:5 (мир мини-игр 320×200);
     вертикальные смахивания всегда прокручивают чат, горизонтальные и тапы отдаём игре (touch-action:none) */
  s = s.replace(/\bcrisp\(\);/g, "").replace(/\b\w+\.shadow(?:Blur|Color|OffsetX|OffsetY)=(?:"[^"]*"|[\w.#]+);?(?=[\s\S])/g, (m) => (/;$/.test(m) ? "" : ";")).replace(/function crisp\(\)\{[^\n]*getImageData[^\n]*\n/, "")
    /* клавиатуры в виджете нет: обработчики клавиш убираем (экономит байты) */
    .replace(/\n?[^\n]*addEventListener\("key(?:down|up)"[^\n]*/g, "").replace(/\n?const KM=\{[^\n]*/g, "")
    /* размеры: clientWidth/offsetX в виджете не гарантированы — берём getBoundingClientRect (он есть);
       холст сразу 320×200, а высота по пропорции (height:auto), чтобы пузырь не схлопывался */
    .replace(/\bc\.client(Width|Height)\b/g, (m, k) => `(c.getBoundingClientRect().${k.toLowerCase()}||${k === "Width" ? 320 : 200})`)
    .replace(/\be\.offset([XY])\b/g, (m, k) => `(e.client${k}-c.getBoundingClientRect().${k === "X" ? "left" : "top"})`)
    /* в виджете холст рисуется в логических пикселях: повторное умножение на devicePixelRatio увеличивало и сдвигало картинку */
    .replace(/\bdevicePixelRatio\b/g, "1")
    .replace(/<canvas id="c">/, '<canvas id="c" width="320" height="200">')
    .replace(/pt\("ПОЛНАЯ ВЕРСИЯ[^"]*",[^)]*\)/gi, "0")
    .replace(/function beep\([^)]*\)\{[^\n]*/, "function beep(){}") // звука в виджете нет
    .replace(/\bTOUCH\?("[^"]*"):"[^"]*"/g, "$1") // в боте всегда сенсор: подсказки для клавиатуры не нужны // подсказка маркета в боте не нужна (она в подписи)
    /* телевизор как в маркете: фиолетовый корпус, две антенны, экран со скруглением, сканлинии и виньетка, ручки сбоку */
    .replace(/<canvas\b[^>]*><\/canvas>/i, "<div class=tv><div class=sc>$&</div><i></i></div>");
  if (!/<style>/i.test(s)) s = "<style></style>" + s; // у игры без своих стилей — всё равно рамка
  s = s.replace(/<style>[\s\S]*?<\/style>/i, "<style>*{box-sizing:border-box}html,body{height:auto!important;background:none!important}body{margin:0;padding:18px 3px 3px}canvas{width:100%!important;height:auto!important;display:block;touch-action:none}" +
      ".tv{position:relative;display:flex;gap:6px;padding:7px;border-radius:14px;background:linear-gradient(160deg,#5b3aa8,#1e0f3d)}" +
      ".tv:before,.tv:after{content:'';position:absolute;left:45%;bottom:100%;width:3px;height:18px;background:#a58cf0;transform-origin:bottom;rotate:-30deg}.tv:after{rotate:26deg}" +
      ".sc{flex:1;min-width:0;border-radius:11px;overflow:hidden;border:3px solid #0a0612}" +
      "i{width:20px}i:before,i:after{content:'';display:block;height:20px;margin:6px 0 8px;border-radius:50%;background:#2a1858;border:3px solid #8f6bff}</style>")
    .replace(/<script>/i, "<script>window.matchMedia=window.matchMedia||(()=>({matches:!0}));window.performance=window.performance||{now:()=>Date.now()};" +
      "{const P=(window.CanvasRenderingContext2D||{}).prototype;P&&!P.ellipse&&(P.ellipse=function(x,y,a,b,r,s,e){this.save();this.translate(x,y);this.rotate(r);this.scale(a,b);this.arc(0,0,1,s,e);this.restore()})}")
    .replace(/<\/body>/i, '<script>try{new ResizeObserver(()=>dispatchEvent(new Event("resize"))).observe(document.querySelector("canvas"))}catch(e){}</script></body>');
  const b = Buffer.from(s, "utf8");
  return raw || (b.length <= 32768 && deflateSync(b, { level: 9 }).length <= 4096) ? s : null;
}

/** Обработчик вебхука бота. tgApi(method, params) -> Promise<result>. */
export function createBot({ store, botToken, tgApi, notify, log, weight }) {
  const secret = webhookSecret(botToken);
  const ok = { status: 200, body: { ok: true } };

  async function preCheckout(q) {
    const bp = parseBuy(q.invoice_payload);
    if (bp) {
      let error = "";
      const g = await store.getGame(bp.game);
      if (q.currency !== "XTR" || Number(q.from?.id) !== bp.uid || q.total_amount !== bp.price) error = "Счёт устарел. Откройте игру и попробуйте ещё раз.";
      else if (!g || g.access !== "public" || !(+g.price > 0) || +g.price !== bp.price) error = "Цена игры изменилась или она недоступна. Попробуйте ещё раз.";
      else if ((await store.ownedGames(bp.uid)).includes(bp.game)) error = "Эта игра у вас уже куплена.";
      await tgApi("answerPreCheckoutQuery", error ? { pre_checkout_query_id: q.id, ok: false, error_message: error } : { pre_checkout_query_id: q.id, ok: true });
      return;
    }
    const p = parsePayload(q.invoice_payload);
    let error = "";
    if (!p || q.currency !== "XTR" || q.total_amount !== p.stars || !STAR_OPTIONS.includes(p.stars) || Number(q.from?.id) !== p.uid) error = "Счёт устарел. Откройте игру и попробуйте ещё раз.";
    else {
      const g = await store.getGame(p.game);
      if (!g || g.access === "off") error = "Игра недоступна.";
    }
    await tgApi("answerPreCheckoutQuery", error ? { pre_checkout_query_id: q.id, ok: false, error_message: error } : { pre_checkout_query_id: q.id, ok: true });
  }

  async function paid(msg) {
    const sp = msg.successful_payment, bp = parseBuy(sp.invoice_payload);
    if (bp) {
      if (sp.currency !== "XTR") return;
      const uid = Number(msg.from?.id ?? bp.uid), g = await store.getGame(bp.game);
      const row = await store.addPurchase({ user_id: uid, kind: "game", item_id: bp.game, currency: "XTR", amount: sp.total_amount, charge_id: String(sp.telegram_payment_charge_id) });
      if (!row) return; // повтор того же платежа
      await log(uid, "buy", bp.game, { s: sp.total_amount, k: 1 }, 0);
      const title = g?.title ?? bp.game;
      notify(uid, `Игра «${title}» куплена за ⭐ ${sp.total_amount}! Она уже в вашем избранном — приятной игры.`);
      if (g?.author_id != null && Number(g.author_id) !== uid) notify(Number(g.author_id), `Вашу игру «${title}» купили за ⭐ ${sp.total_amount}.`);
      return;
    }
    const p = parsePayload(sp.invoice_payload);
    if (!p || sp.currency !== "XTR") return;
    const uid = Number(msg.from?.id ?? p.uid);
    const g = await store.getGame(p.game);
    const row = await store.addThanks({ charge_id: String(sp.telegram_payment_charge_id), game_id: p.game, from_id: uid, author_id: g?.author_id ?? null, stars: sp.total_amount });
    if (!row) return; // повтор того же платежа от Telegram: уже записан
    await log(uid, "thank", p.game, { s: sp.total_amount, k: 1 }, weight);
    const title = g?.title ?? p.game;
    notify(uid, `Спасибо! ⭐ ${sp.total_amount} засчитаны игре «${title}».`);
    if (g?.author_id != null && Number(g.author_id) !== uid) notify(Number(g.author_id), `Вашу игру «${title}» поддержали: ⭐ ${sp.total_amount}. Так держать!`);
  }

  /* «Случайная игра»: бот присылает мини-игру из «телевизора» прямо в сообщении (HTML-виджет, Bot API 10.4).
     Лимит виджета: 32 КБ HTML и 4096 байт после сжатия zlib (уровень 9) — поэтому мини-игру ужимаем и проверяем размер. */
  /* Пул: мини-игры маркета («m:<id>», с кнопкой открыть игру в маркете) + свои игры бота («w:<id>»).
     У каждого игрока своя перемешанная очередь: игра не повторяется, пока не пройден полный круг. */
  async function pool() {
    const m = (await store.listGames()).filter((g) => g.access === "public" && (g.has_play ?? g.play_html)).map((g) => ({ key: "m:" + g.id, id: g.id, title: g.title, market: true }));
    return [...m, ...WIDGET_GAMES.map((w) => ({ key: "w:" + w.id, id: w.id, title: w.title, casino: w.casino, html: w.html }))];
  }
  async function sendGame(chatId, g, site) {
    const html = widgetHtml(g.market ? (await store.gamePlay(g.id))?.play_html : g.html);
    if (!html) return false;
    const caption = g.market ? `🎮 ${g.title} — мини-версия игры из Coopix Market.` : `🎮 ${g.title} — играй прямо в чате.${g.casino ? " Игровые монеты, без реальных денег." : ""}`;
    const reply_markup = g.market && site ? { inline_keyboard: [[{ text: "▶️ Открыть в Coopix Market", web_app: { url: `${site}/${g.id}` } }]] } : KB;
    try { await tgApi("sendWidget", { chat_id: chatId, html, caption, reply_markup }); return true; } catch { return false; }
  }
  async function randomGame(chatId, uid, site) {
    const all = await pool(), byKey = new Map(all.map((g) => [g.key, g]));
    let st = null;
    try { st = await store.getBotDeck(uid); } catch { /* нет таблицы или колонок — очередь из памяти сервера */ }
    if (!st) st = MEM_DECK.get(uid) ?? null;
    let deck = (Array.isArray(st?.deck) ? st.deck : []).filter((k) => byKey.has(k));
    for (let tries = 0; tries < all.length + 1; tries++) {
      if (!deck.length) { deck = shuffle(all.map((g) => g.key)); if (deck.length > 1 && deck[0] === st?.last) deck.push(deck.shift()); } // новый круг не начинается с последней игры
      const key = deck.shift();
      if (await sendGame(chatId, byKey.get(key), site)) {
        MEM_DECK.set(uid, { deck: [...deck], last: key }); // запас на случай, если база не сохранила
        try { await store.setBotDeck(uid, deck, key); } catch { /* не критично */ }
        return;
      }
    }
    await tgApi("sendMessage", { chat_id: chatId, text: "Не получилось прислать игру. Попробуйте ещё раз чуть позже.", reply_markup: KB });
  }

  async function message(msg, site) {
    if (msg.chat?.type !== "private") return; // виджеты пока работают только в личке с ботом
    const t = String(msg.text ?? "").trim();
    if (BTN_TEXTS.includes(t) || /^\/random(@\w+)?$/i.test(t)) await randomGame(msg.chat.id, Number(msg.from?.id ?? msg.chat.id), site);
    else if (/^\/start(\s|$)/.test(t)) await tgApi("sendMessage", { chat_id: msg.chat.id, text: `Привет! Жми «${RANDOM_BTN}» — пришлю мини-игру прямо сюда, в чат. Игры не повторяются, пока не сыграешь во все.`, reply_markup: KB });
  }

  return {
    secret,
    async handle(req) {
      if (req.headers?.["x-telegram-bot-api-secret-token"] !== secret) return { status: 401, body: { error: "unauthorized" } };
      let u = req.body;
      if (typeof u === "string") { try { u = JSON.parse(u); } catch { return ok; } }
      if (!u || typeof u !== "object") return ok;
      const from = u.message?.from;
      if (from?.id && !from.is_bot && u.message.chat?.type === "private") { try { await store.botSeen(from); } catch { /* таблицы ещё нет — не мешаем боту */ } }
      if (u.pre_checkout_query) await preCheckout(u.pre_checkout_query);
      else if (u.message?.successful_payment) await paid(u.message);
      else if (u.message?.text) {
        const h = String(req.headers?.["x-forwarded-host"] ?? req.headers?.host ?? "").split(",")[0].trim();
        const site = /^[a-z0-9.-]+(:\d+)?$/i.test(h) && !/^(localhost|127\.)/.test(h) ? "https://" + h : ""; // адрес маркета для кнопки «Открыть»
        try { await message(u.message, site); } catch { /* ответ боту не должен ронять вебхук */ }
      }
      return ok; // на остальное (обычные сообщения боту) просто отвечаем 200
    },
  };
}
