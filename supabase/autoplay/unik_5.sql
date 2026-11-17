-- UNIX: часть 5 из 5 (версия 1636949).
-- Части можно выполнять в любом порядке. Игра обновится, только когда выполнены ВСЕ 5 части этой версии;
-- до этого в игре остаётся прежний файл. Последняя строка результата скажет «готово» или сколько частей не хватает.
-- Буфер загрузки: части складываются сюда, в игру файл попадает только целиком.
create table if not exists public.game_upload (
  game_id text not null, part int not null, total int not null, body text not null,
  primary key (game_id, part)
);
alter table public.game_upload add column if not exists ver text not null default '';
alter table public.game_upload enable row level security;
revoke all on public.game_upload from anon, authenticated;
-- части других версий этой игры убираем, чтобы старое и новое не смешалось
delete from public.game_upload where game_id = 'unik' and ver <> '1636949';
insert into public.game_upload (game_id, part, total, ver, body) values ('unik', 5, 5, '1636949', $cpx$" 👑" : "") + "</span>" + (coop ? '<span class="tag">Люди</span>' : "") + "</div>";
    else if (i < total) h += '<div class="slot bot">' + avatar("", i, 1) + "<span>" + BOTN[i - L.members.length] + "</span>" + (coop ? '<span class="tag t1">Боты</span>' : "") + "</div>";
    else h += '<div class="slot empty"><div class="av" style="background:#ccc">·</div><span>Свободно</span></div>';
  }
  $("slots").innerHTML = h;
  const set = (k, v) => { L[k] = v; sendLobby(); };
  seg($("oTotal"), [[2, "2"], [3, "3"], [4, "4"]], total, (v) => set("total", +v), host);
  seg($("oMode"), [["coop", "🤝 Кооп: люди vs боты"], ["ffa", "⚔ Каждый за себя"]], L.mode, (v) => set("mode", v), host);
  seg($("oStack"), [["1", "Вкл"], ["0", "Выкл"]], L.stack ? "1" : "0", (v) => set("stack", v === "1"), host);
  $("bStart").style.display = host ? "" : "none";
  $("rWait").textContent = host ? (online && L.members.length < 2 ? "Можно начинать и одному — места займут боты. Друзья смогут зайти в следующем раунде." : "") : "⏳ Ждём, пока хост начнёт игру…";
}

/* ===================== ОДИН QR НА ВСЕХ (как в новой версии Stick Fight) =====================
   В QR лежит только код комнаты. Обмен служебными данными идёт через интернет (ntfy.sh),
   поэтому другу достаточно один раз навести камеру — ответный QR показывать не нужно. */
function qrDraw(cv, text) {
  const q = qrcode(0, "M"); q.addData(text, "Byte"); q.make();
  const n = q.getModuleCount(), cell = 6, size = (n + 8) * cell, g = cv.getContext("2d");
  cv.width = cv.height = size; g.fillStyle = "#fff"; g.fillRect(0, 0, size, size); g.fillStyle = "#000";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + 4) * cell, (y + 4) * cell, cell, cell);
}
const QR = { stream: null, loop: 0 };
function qrCode(txt) { const m = /UNIK1:([A-Z0-9]{5})/.exec(String(txt || "").toUpperCase()); return m ? m[1] : null; }
function qrGot(txt) {
  const code = qrCode(txt);
  if (!code) { $("qMsg").textContent = "Это не QR игры «UNIX» — наведите камеру на QR хоста."; return false; }
  qrStop(); $("qScan").style.display = ""; $("qVid").style.display = "none";
  $("qMsg").textContent = "QR принят — подключаюсь к комнате " + code + "…"; SFX.pop();
  NET.quick = 0; netOpen(); guestJoin(code, "qr");
  return true;
}
function qrStop() { QR.loop++; if (QR.stream) { try { QR.stream.getTracks().forEach((t) => t.stop()); } catch (e) { } QR.stream = null; } const v = $("qVid"); try { v.pause(); } catch (e) { } v.srcObject = null; }
async function qrScan() {
  NET.err = ""; menuUI(); qrStop();
  $("qScan").style.display = ""; $("qVid").style.display = ""; $("qMsg").textContent = "Наведите камеру на QR на экране хоста";
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $("qVid").style.display = "none"; $("qMsg").textContent = "Браузер не даёт открыть камеру на этой странице — нажмите «Фото» и снимите QR."; return; }
  try {
    try { QR.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false }); }
    catch (e0) { if (e0 && e0.name === "NotAllowedError") throw e0; QR.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
  } catch (e) { $("qVid").style.display = "none"; $("qMsg").textContent = e && e.name === "NotAllowedError" ? "Камера запрещена. Разрешите доступ к камере или нажмите «Фото»." : "Камера недоступна — нажмите «Фото» и снимите QR."; return; }
  const v = $("qVid"); v.srcObject = QR.stream; try { await v.play(); } catch (e) { }
  const cv = document.createElement("canvas"), x = cv.getContext("2d", { willReadFrequently: true }), my = ++QR.loop;
  const tick = () => {
    if (QR.loop !== my) return;
    if (v.readyState >= 2 && v.videoWidth) {
      const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight)); cv.width = v.videoWidth * k | 0; cv.height = v.videoHeight * k | 0;
      x.drawImage(v, 0, 0, cv.width, cv.height);
      const im = x.getImageData(0, 0, cv.width, cv.height), r = jsQR(im.data, im.width, im.height, { inversionAttempts: "dontInvert" });
      if (r && r.data && qrGot(r.data)) return;
    }
    setTimeout(() => requestAnimationFrame(tick), 120);
  };
  tick();
}
async function qrPhoto(file) {
  if (!file) return;
  $("qScan").style.display = ""; $("qVid").style.display = "none"; $("qMsg").textContent = "Читаю фото…";
  try {
    let bm; try { bm = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { bm = await createImageBitmap(file); }
    for (const mx of [1600, 1000, 700, 2200]) {
      const k = Math.min(1, mx / Math.max(bm.width, bm.height)), w = Math.round(bm.width * k), h = Math.round(bm.height * k), cv = document.createElement("canvas");
      cv.width = w; cv.height = h; const x = cv.getContext("2d", { willReadFrequently: true }); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(bm, 0, 0, w, h);
      const r = jsQR(x.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
      if (r && r.data) { qrGot(r.data); return; }
    }
    $("qMsg").textContent = "QR на фото не найден. Снимите ближе и ровнее, чтобы QR занял почти весь кадр.";
  } catch (e) { $("qMsg").textContent = "Не удалось прочитать фото: " + e.message; }
}

/* ===================== недавние подключения (повтор в одно нажатие) ===================== */
const REC_V = { online: "Онлайн", qr: "QR", code: "Код" };
function recLoad() { try { const a = JSON.parse(lsG("vRec") || "[]"); return Array.isArray(a) ? a.filter((x) => x && REC_V[x.v]).slice(0, 6) : []; } catch (e) { return []; } }
function recSave(r, v, n) {
  const a = recLoad(), w = v === "online" ? NET.word || "" : "", i = a.findIndex((x) => x.r === r && x.v === v && x.n === n && x.w === w), e = { r, v, n: String(n || "").slice(0, 16), w, c: 1, t: Date.now() };
  if (i >= 0) { e.c = (a[i].c | 0) + 1; a.splice(i, 1); }
  a.unshift(e); lsS("vRec", JSON.stringify(a.slice(0, 6))); menuStats();
}
function ago(t) { const m = Math.max(0, (Date.now() - t) / 6e4 | 0); if (m < 1) return "только что"; if (m < 60) return m + " мин назад"; const h = m / 60 | 0; return h < 24 ? h + " ч назад" : (h / 24 | 0) + " дн назад"; }
function recRender() {
  const a = recLoad(), e = $("nrec");
  if (!a.length || role !== "none") { e.style.display = "none"; return; }
  e.style.display = "";
  e.innerHTML = '<div class="rh"><span>Недавние подключения</span><button class="nb" data-clr="1">Очистить</button></div>' + a.slice(0, 3).map((x, i) => '<div class="rmr"><span><b>' + (x.r === "host" ? "Хост" : "Гость") + " · " + REC_V[x.v] + "</b><small>" + esc(x.n || "друг") + (x.w ? " · слово «" + esc(x.w) + "»" : "") + " · " + (x.c | 0) + "× · " + ago(x.t) + '</small></span><button class="nb pr" data-rep="' + i + '">↻ Повторить</button></div>').join("") + '<div class="rm2" id="nrm"></div>';
}
function recRepeat(x) {
  if (!x || role !== "none") return;
  openNet(x.v === "qr" ? "qr" : x.v === "code" ? "code" : "on");
  if (x.v === "online") { $("inWord").value = x.w || ""; lsS("vWord", x.w || ""); quickPlay(); return; }
  if (x.r === "host") { hostOnline(false); return; }
  if (x.v === "qr") { qrScan(); return; }
  const r = [...NET.rooms.values()].find((r) => r.name === x.n);
  if (r) guestJoin(r.id, "code"); else { const m = $("nrm"); if (m) m.textContent = "Комната «" + x.n + "» сейчас не найдена — попросите код или QR у хоста."; }
}

/* ===================== окна меню ===================== */
let netTab = lsG("vTab") || "on";
function setTab(t) {
  netTab = t; lsS("vTab", t);
  for (const b of $("nTabs").children) b.classList.toggle("ac", b.dataset.t === t);
  $("pOn").style.display = t === "on" ? "" : "none"; $("pQr").style.display = t === "qr" ? "" : "none"; $("pCode").style.display = t === "code" ? "" : "none";
  if (t !== "qr") { qrStop(); $("qScan").style.display = "none"; }
}
function openNet(t) { closeWins(); $("net").hidden = false; setTab(t || netTab); netOpen(); menuUI(); }
function closeWins() { for (const id of ["net", "sp"]) $(id).hidden = true; qrStop(); $("qScan").style.display = "none"; }
function openSet() {
  closeWins(); $("sp").hidden = false; $("sName").value = lsG("vName") || "";
  for (const s of document.querySelectorAll("#sp .sw")) s.querySelector(".tg").setAttribute("aria-checked", SETS[s.dataset.k] ? "true" : "false");
}
const SETS = { snd: SND ? 1 : 0, ban: lsG("vBan") !== "0" ? 1 : 0 };
function uiClick() { beep(660, .04, "square", .04); }

/* ===================== RENDER: game ===================== */
const POS = { 1: ["top"], 2: ["left", "right"], 3: ["left", "top", "right"] };
let giftMode = false, lastPlayRect = null, overShown = -1;
function seatEl(i) { if (!V) return null; if (i === (V.me < 0 ? 0 : V.me)) return V.me < 0 ? $("me") : $("hand"); return document.querySelector('.seat[data-s="' + i + '"]'); }
function myHandSorted() { const o = { r: 0, y: 1, g: 2, b: 3, k: 4 }, vo = "0123456789SRDWF"; return V.me >= 0 ? V.seats[V.me].hand.slice().sort((a, b) => o[a.c] - o[b.c] || vo.indexOf(a.v) - vo.indexOf(b.v)) : []; }
function canPlayV(c) {
  if (!V || V.me < 0 || V.turn !== V.me || V.phase !== "play") return false;
  if (V.drawn != null) return c.id === V.drawn;
  if (V.pend > 0) return V.stack && ((c.v === "D" && V.pendType === "D") || c.v === "F");
  return c.c === "k" || c.c === V.color || c.v === V.top.v;
}
function render() {
  const v = V; if (!v) return;
  const n = v.seats.length, me = v.me < 0 ? 0 : v.me, myTurn = v.me >= 0 && v.turn === v.me && v.phase === "play";
  const allies = v.mode === "coop" && v.me >= 0 ? v.seats.map((s, i) => i).filter((i) => i !== v.me && v.seats[i].team === v.seats[v.me].team) : [];
  // info
  $("gInfo").textContent = (v.mode === "coop" ? "🤝 Кооп: люди против ботов" : "⚔ Каждый за себя") + (v.stack ? " · стопки" : "") + (role !== "solo" ? " · комната " + v.code : "");
  // opponents
  const pos = POS[n - 1] || POS[3];
  let h = "";
  for (let k = 1; k < n; k++) {
    const i = (me + k) % n, s = v.seats[i], p = pos[k - 1];
    const canCatch = v.unsafe === i && v.me >= 0 && (v.mode !== "coop" || s.team !== v.seats[v.me].team);
    let fan = ""; for (let j = 0; j < Math.min(s.n, 9); j++) fan += '<i style="background-image:url(' + IMG.back + ')"></i>';
    let ah = ""; if (s.hand) { ah = '<div class="allyH">' + s.hand.map((c) => '<i style="background-image:url(' + IMG[key(c)] + ')"></i>').join("") + "</div>"; fan = ""; }
    const tag = s.off ? '<span class="tagS off">отключился · играет бот</span>' : v.mode === "coop" ? '<span class="tagS' + (s.team ? " t1" : "") + '">' + (s.team ? "Боты" : "Союзник") + "</span>" : "";
    h += '<div class="seat ' + p + (n === 3 ? " hi" : "") + (v.turn === i && v.phase === "play" ? " turn" : "") + '" data-s="' + i + '">' +
      '<div style="position:relative">' + avatar(s.name, i, s.kind === "bot") + '<span class="cnt">' + s.n + "</span></div>" +
      '<div class="nm">' + esc(s.name) + "</div>" + tag + fan + ah +
      (s.n === 1 && v.unsafe !== i ? '<span class="tagS">UNIX!</span>' : "") +
      (canCatch ? '<button class="btn b-red sm catch" data-catch="1">Поймать!</button>' : "") + "</div>";
  }
  $("seats").innerHTML = h;
  // me
  const ms = v.seats[me];
  $("me").innerHTML = '<div class="' + (v.turn === me && v.phase === "play" ? "turn" : "") + '" style="position:relative">' + avatar(ms.name, me, ms.kind === "bot") + '<span class="cnt">' + ms.n + '</span></div><span class="nm">' + esc(ms.name) + (v.me >= 0 ? " (ты)" : "") + "</span>" + (v.mode === "coop" && ms.team === 0 ? '<span class="tagS">Люди</span>' : "");
  $("spect").style.display = v.me < 0 ? "block" : "none";
  // table
  $("table").style.setProperty("--glow", CHEX[v.color] + "aa");
  $("cdot").style.background = CHEX[v.color];
  $("dir").classList.toggle("ccw", v.dir < 0); $("dir").firstChild.textContent = v.dir < 0 ? "↺" : "↻";
  const pe = $("pend"); pe.style.display = v.pend ? "block" : "none"; pe.textContent = "+" + v.pend;
  let ph = "";
  for (const c of v.under) ph += '<div class="card" style="background-image:url(' + IMG[key(c)] + ");transform:rotate(" + (((c.id * 37) % 25) - 12) + 'deg)"></div>';
  ph += '<div class="card" id="pileTop" style="background-image:url(' + IMG[key(v.top)] + ");transform:rotate(" + (((v.top.id * 37) % 13) - 6) + 'deg)"></div>';
  $("pileC").innerHTML = ph;
  const canDraw = myTurn && v.drawn == null;
  $("deck").classList.toggle("can", canDraw && !myHandSorted().some(canPlayV));
  $("deckL").textContent = canDraw ? (v.pend ? "Взять +" + v.pend : "Взять") : v.deckN + " карт";
  // hand
  const hand = myHandSorted(), he = $("hand");
  he.classList.toggle("gift", giftMode);
  const W = he.clientWidth || innerWidth, cw = $("deck").offsetWidth || 80, nn = hand.length;
  const step = nn > 1 ? Math.min(cw * .74, (W - 24 - cw) / (nn - 1)) : 0, x0 = (W - (cw + step * (nn - 1))) / 2;
  // keyed update: cards keep their element, so they slide to new places and new ones fly in from the deck
  const dealing = (v.ev || []).some((e) => e.t === "start");
  if (dealing) he.textContent = "";
  const had = he.children.length > 0, exist = new Map([...he.children].map((e) => [e.dataset.k, e]));
  const hr = he.getBoundingClientRect(), dk = rectC($("deck")), chh = $("deck").offsetHeight || cw * 1.5;
  let nNew = 0;
  hand.forEach((c, i) => {
    const t = nn > 1 ? i / (nn - 1) - .5 : 0, r = t * Math.min(16, nn * 2), y = Math.abs(t) * Math.abs(t) * 30, left = x0 + i * step, k = c.id + key(c);
    let el = exist.get(k); const isNew = !el;
    if (el) exist.delete(k);
    else { el = document.createElement("div"); el.dataset.k = k; el.dataset.id = c.id; el.style.backgroundImage = "url(" + IMG[key(c)] + ")"; el.addEventListener("animationend", (ev) => { if (ev.animationName === "dealIn") el.classList.remove("deal", "newc"); }); he.appendChild(el); }
    const cls = giftMode ? "" : (canPlayV(c) ? "ok" : (myTurn ? "no" : ""));
    let anim = el.classList.contains("deal") ? " deal" : el.classList.contains("newc") ? " newc" : "";
    if (isNew && (dealing || had)) {
      anim = dealing ? " deal" : " newc";
      el.style.setProperty("--dx", (dk.x - (hr.left + left + cw / 2)).toFixed(0) + "px");
      el.style.setProperty("--dy", (dk.y - (hr.top + 14 + chh / 2)).toFixed(0) + "px");
      el.style.animationDelay = (dealing ? i * 85 + 200 : nNew++ * 90) + "ms";
    }
    el.className = "card " + cls + anim;
    el.style.left = left + "px"; el.style.setProperty("--r", r.toFixed(1) + "deg"); el.style.setProperty("--y", y.toFixed(1) + "px"); el.style.zIndex = i + 1;
  });
  for (const el of exist.values()) el.remove();
  // buttons
  const meS = v.me >= 0 ? v.seats[v.me] : null;
  $("bCall").style.display = meS && v.phase === "play" && (v.unsafe === v.me || (myTurn && meS.n === 2 && !meS.said)) ? "" : "none";
  $("bPass").style.display = myTurn && v.drawn != null ? "" : "none";
  $("bGift").style.display = meS && myTurn && v.mode === "coop" && allies.length && meS.gift > 0 && !v.pend && v.drawn == null && meS.n >= 3 ? "" : "none";
  $("bGift").innerHTML = giftMode ? "Отмена" : '<img src="' + ICO.gift + '">Подарить';
  $("bEmo").style.display = v.me >= 0 ? "" : "none";
  // round over
  if (v.phase === "over" && overShown !== v.seq) { overShown = v.seq; fxWin(v); setTimeout(showResults, 1300); }
}
function showResults() {
  if (!V || V.phase !== "over") return;
  const w = V.seats[V.winner], coop = V.mode === "coop";
  let title, sub = "";
  if (coop) { const humWin = w.team === 0; title = humWin ? "Команда людей победила!" : "Боты победили…"; sub = humWin ? (V.me === V.winner ? "Ты вышел первым — отличная работа!" : esc(w.name) + " вышел первым") : esc(w.name) + " избавился от карт первым"; }
  else { title = V.winner === V.me ? "Ты победил!" : esc(w.name) + " побеждает!"; }
  const win = coop ? w.team === 0 && V.me >= 0 : V.winner === V.me;
  win ? SFX.win() : SFX.bad();
  const sc = Object.entries(V.score || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => "<div><span>" + esc(k) + "</span><b>" + n + " 🏆</b></div>").join("");
  if (win) lsS("vWins", (+(lsG("vWins") || 0) + 1) + ""); lsS("vGames", (+(lsG("vGames") || 0) + 1) + "");
  const host = role !== "guest";
  modal('<div class="res"><img src="' + ICO.trophy + '"></div><h2>' + title + "</h2><div>" + sub + '</div><div class="score">' + sc + '</div><div class="mbt">' +
    (host ? '<button class="ub pr" id="mAgain"><i class="ic">' + ICON.redo + '</i>Ещё раунд</button><button class="ub cy" id="mLobby">В комнату</button>' : '<div class="nst bz" style="flex-basis:100%">Ждём, пока хост начнёт новый раунд…</div>') +
    '<button class="ub dn" id="mExit"><i class="ic">' + ICON.home + '</i>Выйти</button></div>');
  if (host) { $("mAgain").onclick = () => { closeModal(); startRound(); }; $("mLobby").onclick = () => { closeModal(); G = null; V = null; L.started = false; show("scRoom"); sendLobby(); advertise(); }; }
  $("mExit").onclick = () => leave("");
}
function applyView(v) {
  const prev = V; V = v;
  if (!$("scGame").classList.contains("on")) { show("scGame"); closeModal(); overShown = -1; }
  if (v.phase === "play" && $("modal").classList.contains("on") && $("mAgain") === null && $("mExit")) closeModal();
  if (v.phase === "play" && prev && prev.phase === "over") closeModal();
  if (!(v.me >= 0 && v.turn === v.me)) giftMode = false;
  render();
  for (const e of v.ev || []) playEv(e, prev);
}
function rectC(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
// card flight along a curved arc (Web Animations), with an optional sparkle trail
function fly(from, to, img, delay, onEnd, o) {
  o = o || {};
  setTimeout(() => {
    if (!from || !to) { onEnd && onEnd(); return; }
    const a = from.x !== undefined ? from : rectC(from), b = rectC(to), d = document.createElement("div"), cw = $("deck").offsetWidth, ch = $("deck").offsetHeight;
    d.className = "card fly" + (o.glow ? " glow" : ""); d.style.backgroundImage = "url(" + img + ")";
    document.body.appendChild(d);
    const lift = o.lift != null ? o.lift : 70, m = { x: (a.x + b.x) / 2 + rnd(-40, 40), y: Math.min(a.y, b.y) - lift };
    const r0 = o.r0 != null ? o.r0 : rnd(-25, 25), r1 = o.r1 != null ? o.r1 : rnd(-10, 10) + (o.spin || 0), s0 = o.s0 || .7, s1 = o.s1 || 1, dur = RM ? 200 : (o.dur || 460);
    const kf = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = 1 - t, x = u * u * a.x + 2 * u * t * m.x + t * t * b.x, y = u * u * a.y + 2 * u * t * m.y + t * t * b.y;
      const s = s0 + (s1 - s0) * t + Math.sin(t * Math.PI) * .22, r = r0 + (r1 - r0) * t;
      kf.push({ transform: "translate(" + (x - cw / 2).toFixed(1) + "px," + (y - ch / 2).toFixed(1) + "px) rotate(" + r.toFixed(1) + "deg) scale(" + s.toFixed(3) + ")", offset: t });
    }
    const an = d.animate(kf, { duration: dur, easing: "cubic-bezier(.3,.05,.3,1)", fill: "forwards" });
    let iv = 0;
    if (o.trail && !RM) iv = setInterval(() => { const r = d.getBoundingClientRect(); fxBurst(r.left + r.width / 2, r.top + r.height / 2, o.trail, 2, 1.4, "spark"); }, 35);
    an.onfinish = () => { clearInterval(iv); d.remove(); onEnd && onEnd(b); };
  }, delay || 0);
}

/* ===================== FX: particles on a canvas over the table ===================== */
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FX = { c: null, g: null, p: [], amb: [], d: 1 };
function fxInit() {
  const c = document.createElement("canvas"); c.id = "fx"; document.body.appendChild(c);
  FX.c = c; FX.g = c.getContext("2d");
  const rs = () => { FX.d = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * FX.d; c.height = innerHeight * FX.d; };
  rs(); addEventListener("resize", rs);
}
function fxBurst(x, y, cols, n, sp, kind) {
  n = RM ? Math.ceil(n / 4) : n; sp = sp || 6; if (FX.p.length > 700) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = sp * (.3 + Math.random() * .9);
    FX.p.push({ k: kind === "mix" ? (i % 3 ? "spark" : "star") : (kind || "spark"), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, g: .16, life: 1, dec: rnd(.016, .032), r: rnd(2, 5), c: cols[i % cols.length], rot: Math.random() * 6, vr: rnd(-.3, .3) });
  }
}
function fxRing(x, y, c, max, w) { FX.p.push({ k: "ring", x, y, r: 10, max: max || 120, c, life: 1, w: w || 6 }); }
function fxConfetti(n) {
  const cols = ["#ff3b30", "#ffcc00", "#34c759", "#1e7bff", "#ff5ec4", "#ffffff"];
  for (let i = 0; i < (RM ? 30 : n); i++) FX.p.push({ k: "conf", x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .6, vx: rnd(-1.5, 1.5), vy: rnd(2, 5), g: .035, life: 1, dec: .003, r: rnd(7, 12), c: cols[i % cols.length], rot: Math.random() * 6, vr: rnd(-.2, .2), sw: Math.random() * 6 });
}
function fxStar(g, x, y, r, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .28 : r, a = i * Math.PI / 4; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); }
function fxStep() {
  if (!FX.g) return;
  const g = FX.g, W = innerWidth, H = innerHeight, game = $("scGame").classList.contains("on");
  g.setTransform(FX.d, 0, 0, FX.d, 0, 0); g.clearRect(0, 0, W, H);
  // ambient light motes floating above the meadow
  if (game && !RM) {
    if (FX.amb.length < 28 && Math.random() < .25) FX.amb.push({ x: Math.random() * W, y: H + 10, vy: rnd(.25, .7), vx: rnd(-.2, .2), r: rnd(1.2, 3), a: 0, t: Math.random() * 6 });
    g.globalCompositeOperation = "lighter";
    for (const m of FX.amb) { m.y -= m.vy; m.t += .02; m.x += m.vx + Math.sin(m.t) * .25; m.a = Math.min(.5, m.a + .01); g.globalAlpha = m.a * Math.min(1, m.y / (H * .35)); g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(m.x, m.y, m.r, 0, 7); g.fill(); }
    FX.amb = FX.amb.filter((m) => m.y > -10);
  } else FX.amb.length = 0;
  const P = FX.p;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    if (p.k === "ring") {
      p.r += (p.max - p.r) * .1 + 1; p.life -= .03;
      if (p.life <= 0) { P.splice(i, 1); continue; }
      g.globalCompositeOperation = "lighter"; g.globalAlpha = p.life; g.strokeStyle = p.c; g.lineWidth = p.w * p.life + .5;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.stroke(); continue;
    }
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .985; p.rot += p.vr; p.life -= p.dec;
    if (p.life <= 0 || p.y > H + 40) { P.splice(i, 1); continue; }
    g.globalAlpha = Math.min(1, p.life * 1.6); g.fillStyle = p.c;
    if (p.k === "conf") { g.globalCompositeOperation = "source-over"; p.sw += .12; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(Math.cos(p.sw), 1); g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); }
    else if (p.k === "star") { g.globalCompositeOperation = "lighter"; fxStar(g, p.x, p.y, p.r * 2 * p.life + 1, p.rot); }
    else { g.globalCompositeOperation = "lighter"; g.beginPath(); g.arc(p.x, p.y, p.r * p.life + .6, 0, 7); g.fill(); }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
}
function bigPop(el, text, color) {
  const c = el && el.x !== undefined ? el : el ? rectC(el) : { x: innerWidth / 2, y: innerHeight * .45 };
  const d = document.createElement("div"); d.className = "bigpop"; d.textContent = text; d.style.left = c.x + "px"; d.style.top = c.y + "px"; if (color) d.style.setProperty("--bc", color);
  document.body.appendChild(d); setTimeout(() => d.remove(), 1300);
}
function shake(el) { if (!el || RM) return; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); setTimeout(() => el.classList.remove("shake"), 500); }
const ALLC = ["#ff3b30", "#ffcc00", "#34c759", "#1e7bff"];
function fxWin(v) {
  const w = v.seats[v.winner], el = v.winner === v.me ? $("hand") : seatEl(v.winner), c = el ? rectC(el) : { x: innerWidth / 2, y: innerHeight / 2 };
  const win = v.mode === "coop" ? w.team === 0 && v.me >= 0 : v.winner === v.me;
  fxBurst(c.x, c.y, ["#ffd23f", "#fff"], 50, 9, "mix"); fxRing(c.x, c.y, "#ffd23f", 220, 10);
  if (win) { fxConfetti(180); bigPop(null, "ПОБЕДА!", "#ffcc00"); } else bigPop(c, "🏆", "#ffcc00");
}
// a card lands on the pile: thump + burst in its colour
function landFx(e, at) {
  const t = $("pileTop"); if (t) { t.style.opacity = 1; if (!RM) t.animate([{ transform: t.style.transform + " scale(1.35)", filter: "brightness(1.6)" }, { transform: t.style.transform + " scale(.94)" }, { transform: t.style.transform }], { duration: 320, easing: "ease-out" }); }
  const wild = e.c.c === "k", cols = wild ? ALLC : [CHEX[e.c.c], "#fff"];
  fxBurst(at.x, at.y, cols, wild ? 40 : 22, wild ? 8 : 6, "mix");
  fxRing(at.x, at.y, CHEX[e.color], wild ? 320 : 110, wild ? 12 : 6);
  if (wild) { $("cdot").classList.remove("pop"); void $("cdot").offsetWidth; $("cdot").classList.add("pop"); }
  if (e.c.v === "D" || e.c.v === "F") { shake($("table")); bigPop(at, e.c.v === "D" ? "+2" : "+4", e.c.v === "F" ? "#b866ff" : "#ff3b30"); }
  if (e.c.v === "R") { bigPop(at, "⇄", "#ffffff"); if (!RM) $("dir").animate([{ transform: "scale(1)" }, { transform: "scale(1.08) rotate(" + (V && V.dir < 0 ? -25 : 25) + "deg)" }, { transform: "scale(1)" }], { duration: 600, easing: "ease-out" }); }
}
function bubble(i, text, em) { const el = i === V.me ? $("me") : seatEl(i); if (!el) return; const b = document.createElement("div"); b.className = "bub" + (em ? " em" : ""); b.textContent = text; el.appendChild(b); setTimeout(() => b.remove(), 2300); }
function showEmo(s, e) { if (V && $("scGame").classList.contains("on")) { bubble(s, e, 1); SFX.pop(); } }
const nm = (i) => V.seats[i] ? (i === V.me ? "Ты" : V.seats[i].name) : "";
function playEv(e) {
  switch (e.t) {
    case "play": {
      const top = $("pileTop"), mine = e.s === V.me && lastPlayRect && Date.now() - lastPlayRect.t < 3000;
      if (top) top.style.opacity = 0;
      const col = e.c.c === "k" ? ALLC : [CHEX[e.c.c]];
      fly(mine ? lastPlayRect : seatEl(e.s), $("pile"), IMG[key(e.c)], 0, (at) => landFx(e, at || rectC($("pile"))), { glow: true, trail: col, s0: mine ? 1.05 : .6, r1: (((e.c.id * 37) % 13) - 6), spin: e.c.c === "k" ? 360 : 0 });
      lastPlayRect = null; SFX.play();
      if (e.c.c === "k") toast(nm(e.s) + ": цвет — " + CNAME[e.color]);
      if (e.c.v === "D" || e.c.v === "F") { $("pend").style.animation = "none"; void $("pend").offsetWidth; $("pend").style.animation = ""; }
      break;
    }
    case "draw": {
      const to = seatEl(e.s), n = Math.min(e.n, 8);
      if (e.s !== V.me) for (let k = 0; k < n; k++) fly($("deck"), to, IMG.back, k * 90, null, { lift: 40, dur: 380, s1: .5 });
      SFX.draw();
      if (e.n > 1) { toast(nm(e.s) + (e.s === V.me ? " берёшь +" : " берёт +") + e.n); setTimeout(() => { const c = rectC(e.s === V.me ? $("hand") : to); bigPop(c, "+" + e.n, "#ff3b30"); fxBurst(c.x, c.y, ["#ff3b30", "#ff9a8f"], 26, 6, "spark"); }, 250); }
      break;
    }
    case "skip": { const el = e.s === V.me ? $("me") : seatEl(e.s); if (el) { const c = rectC(el); bigPop(c, "⊘", "#ff3b30"); fxBurst(c.x, c.y, ["#ff3b30", "#fff"], 20, 5, "spark"); shake(el); } toast(nm(e.s) + (e.s === V.me ? " пропускаешь ход" : " пропускает ход")); break; }
    case "rev": toast("Направление сменилось ⇄"); break;
    case "pass": break;
    case "call": { bubble(e.s, "UNIX!"); SFX.call(); const el = e.s === V.me ? $("me") : seatEl(e.s); if (el) { const c = rectC(el); fxRing(c.x, c.y, "#ffd23f", 140, 8); fxBurst(c.x, c.y, ["#ffd23f", "#fff6a0"], 30, 7, "mix"); } break; }
    case "caught": { bubble(e.s, "Пойман! +2"); toast(nm(e.by) + " ловит: " + nm(e.s) + " +2"); SFX.bad(); const el = e.s === V.me ? $("me") : seatEl(e.s); if (el) { const c = rectC(el); fxRing(c.x, c.y, "#ff3b30", 150, 8); shake(el); } break; }
    case "gift": fly(e.s === V.me ? $("hand") : seatEl(e.s), e.to === V.me ? $("hand") : seatEl(e.to), IMG.back, 0, (at) => { if (at) { fxBurst(at.x, at.y, ["#b866ff", "#ffc6ec"], 26, 6, "mix"); fxRing(at.x, at.y, "#b866ff", 120, 6); } }, { glow: true, trail: ["#b866ff", "#ff5ec4"], lift: 120 }); toast(nm(e.s) + " дарит карту → " + nm(e.to)); break;
    case "turn": if (e.s === V.me) { if (SETS.ban) banner("Твой ход!"); SFX.turn(); const r = $("hand").getBoundingClientRect(); for (let k = 0; k < 6; k++) setTimeout(() => fxBurst(r.left + r.width * (.2 + Math.random() * .6), r.top + 20 + Math.random() * 30, ["#ffd23f", "#fff"], 8, 3, "star"), k * 70); } break;
    case "left": toast(V.seats[e.s].name + " отключился — за него играет бот"); break;
    case "back": toast(V.seats[e.s].name + " вернулся!"); break;
    case "start": {
      banner("Раздача!");
      const n = V.seats.length, me = V.me < 0 ? 0 : V.me;
      for (let k = 0; k < 7; k++) for (let j = 1; j < n; j++) fly($("deck"), seatEl((me + j) % n), IMG.back, 200 + (k * n + j) * 70, null, { lift: 50, dur: 400, s1: .5 });
      setTimeout(() => SFX.draw(), 200); setTimeout(() => SFX.draw(), 500); setTimeout(() => SFX.draw(), 800);
      const c = rectC($("pile")); setTimeout(() => { fxRing(c.x, c.y, CHEX[V.color], 160, 8); fxBurst(c.x, c.y, [CHEX[V.color], "#fff"], 24, 6, "mix"); }, 900);
      break;
    }
  }
}
// turn timer ring
function tick() {
  requestAnimationFrame(tick);
  fxStep();
  if (!V || !V.tmax || V.phase !== "play") return;
  const left = V.tl - (Date.now() - V.rcv), p = Math.max(0, Math.min(1, left / V.tmax));
  const el = V.turn === V.me ? $("me") : seatEl(V.turn);
  const r = el && el.querySelector(".ring"); if (r) r.style.setProperty("--p", (p * 100).toFixed(1) + "%");
}
function pickColor() {
  return new Promise((res) => {
    modal('<h2>Выбери цвет</h2><div class="colors">' + COLORS.map((c) => '<button data-c="' + c + '" style="background:' + CHEX[c] + '">' + CNAME[c] + "</button>").join("") + '</div><div class="mbt"><button class="ub sm" data-c="">Отмена</button></div>');
    $("mBody").onclick = (e) => { const b = e.target.closest("[data-c]"); if (!b) return; $("mBody").onclick = null; closeModal(); res(b.dataset.c || null); };
  });
}
function pickAlly(list) {
  return new Promise((res) => {
    modal("<h2>Кому подарить?</h2><div class=\"mbt\">" + list.map((i) => '<button class="ub pk" data-a="' + i + '">' + esc(V.seats[i].name) + " (" + V.seats[i].n + ")</button>").join("") + '<button class="ub" data-a="-1">Отмена</button></div>');
    $("mBody").onclick = (e) => { const b = e.target.closest("[data-a]"); if (!b) return; $("mBody").onclick = null; closeModal(); res(+b.dataset.a); };
  });
}

/* ===================== INPUT ===================== */
$("hand").addEventListener("click", async (e) => {
  const el = e.target.closest(".card"); if (!el || !V || V.me < 0) return;
  const c = V.seats[V.me].hand.find((x) => x.id === +el.dataset.id); if (!c) return;
  if (giftMode) {
    const allies = V.seats.map((s, i) => i).filter((i) => i !== V.me && V.seats[i].team === V.seats[V.me].team);
    const to = allies.length === 1 ? allies[0] : await pickAlly(allies);
    giftMode = false; if (to >= 0) sendAct({ a: "gift", id: c.id, to }); render(); return;
  }
  if (!canPlayV(c)) { if (V.turn === V.me) { el.animate([{ marginLeft: "0" }, { marginLeft: "-6px" }, { marginLeft: "6px" }, { marginLeft: "0" }], { duration: 200 }); } return; }
  const r = el.getBoundingClientRect(); const rect = { x: r.left + r.width / 2, y: r.top + r.height / 2, t: Date.now() };
  let color;
  if (c.c === "k") { color = await pickColor(); if (!color) return; }
  lastPlayRect = rect;
  sendAct({ a: "play", id: c.id, color });
});
$("deck").onclick = () => { if (V && V.me >= 0 && V.turn === V.me && V.phase === "play" && V.drawn == null) sendAct({ a: "draw" }); };
$("bPass").onclick = () => sendAct({ a: "pass" });
$("bCall").onclick = () => sendAct({ a: "call" });
$("bGift").onclick = () => { giftMode = !giftMode; if (giftMode) toast("Выбери карту, которую подаришь союзнику"); render(); };
$("bEmo").onclick = () => $("emoBar").classList.toggle("on");
$("emoBar").innerHTML = EMOS.map((e) => "<button>" + e + "</button>").join("");
$("emoBar").onclick = (e) => { const b = e.target.closest("button"); if (b) sendEmo(b.textContent); };
$("seats").addEventListener("click", (e) => { if (e.target.closest("[data-catch]")) sendAct({ a: "catch" }); });
$("gExit").onclick = pauseOpen;
$("gRules").onclick = rules;
// --- главное меню ---
$("bPlay").onclick = () => { lsS("vName", myName()); role = "solo"; L = newLobby(""); L.mode = "ffa"; L.total = 4; show("scRoom"); renderRoom(); };
$("bNet").onclick = () => openNet();
$("bRep").onclick = () => recRepeat(recLoad()[0]);
$("bHelp").onclick = rules;
$("bSet").onclick = openSet;
$("logoFan").onclick = () => { const e = $("logoFan"); e.classList.remove("hop"); void e.offsetWidth; e.classList.add("hop"); SFX.play(); };
$("logoFan").addEventListener("animationend", () => $("logoFan").classList.remove("hop"));
document.addEventListener("click", (e) => { if (e.target.closest(".ub,.nb,.x")) uiClick(); if (e.target.closest("[data-close]")) closeWins(); }, true);
for (const w of ["net", "sp"]) $(w).addEventListener("click", (e) => { if (e.target === $(w)) closeWins(); });
// --- окно сети ---
$("nTabs").onclick = (e) => { const b = e.target.closest("button"); if (b) setTab(b.dataset.t); };
$("bQuick").onclick = quickPlay;
$("bQuickC").onclick = quickCancel;
$("bHost").onclick = () => hostOnline(false, "code");
$("bQrHost").onclick = () => hostOnline(false, "qr");
$("bQrScan").onclick = qrScan;
$("bQrPhoto").onclick = () => $("qFile").click();
$("qFile").onchange = (e) => { qrStop(); qrPhoto(e.target.files && e.target.files[0]); e.target.value = ""; };
$("bQrStop").onclick = () => { qrStop(); $("qScan").style.display = "none"; };
$("bJoinCode").onclick = () => { NET.quick = 0; netOpen(); guestJoin($("inCode").value, "code"); };
$("inCode").onkeydown = (e) => { if (e.key === "Enter") $("bJoinCode").click(); };
$("nrec").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.clr) { lsS("vRec", "[]"); recRender(); menuStats(); } else if (b.dataset.rep != null) recRepeat(recLoad()[+b.dataset.rep]); };
$("inName").onchange = () => lsS("vName", myName());
$("inWord").onchange = () => { lsS("vWord", $("inWord").value.trim()); if (role === "none") netOpen(); };
// --- настройки ---
$("sName").onchange = () => { const v = $("sName").value.trim().slice(0, 16); lsS("vName", v); $("inName").value = v; };
for (const s of document.querySelectorAll("#sp .sw")) s.onclick = () => {
  const k = s.dataset.k; SETS[k] = SETS[k] ? 0 : 1; s.querySelector(".tg").setAttribute("aria-checked", SETS[k] ? "true" : "false");
  if (k === "snd") { SND = !!SETS.snd; lsS("vSnd", SND ? "1" : "0"); } else lsS("vBan", SETS.ban ? "1" : "0");
};
$("sReset").onclick = () => { lsS("vWins", "0"); lsS("vGames", "0"); menuStats(); };
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") { if (e.key === "Escape") e.target.blur(); return; }
  if (e.key === "Escape") { if ($("modal").classList.contains("on") && !$("mAgain")) closeModal(); else closeWins(); }
  else if ((e.key === "n" || e.key === "т" || e.key === "N" || e.key === "Т") && $("scMenu").classList.contains("on")) { if ($("net").hidden) openNet(); else closeWins(); }
});
// --- комната ---
$("bStart").onclick = () => { if (role === "host" || role === "solo") startRound(); };
$("bLeave").onclick = () => leave("");
window.addEventListener("resize", () => { if (V) render(); });
window.addEventListener("beforeunload", () => { if (role === "host") unhost(); });

/* ===================== START ===================== */
(async () => {
  $("inName").value = lsG("vName") || "";
  $("inWord").value = lsG("vWord") || "";
  document.querySelectorAll("[data-i]").forEach((e) => { e.innerHTML = ICON[e.dataset.i] || ""; });
  try { await buildAssets(); } catch (e) { $("load").textContent = "Не удалось загрузить картинки: " + e.message; return; }
  document.querySelectorAll("img[data-ico]").forEach((i) => { i.src = ICO[i.dataset.ico]; });
  $("deck").style.backgroundImage = "url(" + IMG.back + ")";
  const fan = ["r7", "yD", "gR", "b5", "kW"];
  $("logoFan").innerHTML = fan.map((k, i) => '<div style="background-image:url(' + IMG[k] + ");transform:rotate(" + ((i - 2) * 16) + 'deg)"></div>').join("");
  $("load").remove();
  fxInit();
  menuStats();
  netOpen(); menuUI();
  /* сразу партия с ботами, без главного меню: меню — в паузе (⏸ → «Главное меню») */
  $("bPlay").onclick(); startRound();
  requestAnimationFrame(tick);
})();
</script>
</body>
</html>
$cpx$)
on conflict (game_id, part) do update set total = excluded.total, ver = excluded.ver, body = excluded.body;

-- все части этой версии на месте и длина сходится → записать файл в игру и очистить буфер
update public.games g set file_html = s.html, updated_at = now()
  from (select string_agg(body, '' order by part) as html, count(*) as n from public.game_upload where game_id = 'unik' and ver = '1636949') s
 where g.id = 'unik' and s.n = 5 and char_length(s.html) = 1636949;
delete from public.game_upload where game_id = 'unik' and (select char_length(file_html) from public.games where id = 'unik') = 1636949;

select case when (select char_length(file_html) from public.games where id = 'unik') = 1636949 then 'ГОТОВО: UNIX обновлена'
  else 'НЕ ГОТОВО: загружено частей ' || (select count(*) from public.game_upload where game_id = 'unik' and ver = '1636949') || ' из 5, выполните остальные' end as status;
