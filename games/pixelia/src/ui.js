'use strict';
/* ПИКСЕЛИЯ — интерфейс: верхняя панель, кисти, панели, цели Мудреца, галерея, заставка */
(function () {
  const $ = (s) => document.querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  /* в кириллической части шрифта у заглавной «К» лишний акцент — подменяем её латинской K, глифы одинаковые */
  const fixK = (n) => { if (n.nodeType === 3) { if (n.data.indexOf('К') >= 0) n.data = n.data.replace(/К/g, 'K'); } else if (n.childNodes) n.childNodes.forEach(fixK); };
  new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(fixK); if (m.type === 'characterData') fixK(m.target); })).observe(document.getElementById('app'), { childList: true, subtree: true, characterData: true });
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pixelia.' + k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { try { localStorage.setItem('pixelia.' + k, JSON.stringify(v)); return true; } catch (e) { mem[k] = v; return false; } }
  };
  const G = Object.assign({ sel: 'WATER', size: 3, shape: 'round', mode: 'brush', replace: false, paused: false, speed: 1, lens: false, cs: 0, sound: true, time: .3, tcycle: true, biome: 'auto', sday: 12, dsec: 240, slen: 12, wauto: true, hot: [], lastEl: {}, weather: 0, wind: 0, cat: 1 }, store.get('set', {}));
  if (!G.lastEl || typeof G.lastEl !== 'object') G.lastEl = {};
  /* старые сохранения хранили тему неба: переводим в время суток */
  { const sv = store.get('set', {}); if (sv.time === undefined && sv.theme) { G.time = { night: .02, day: .5, dusk: .74, cave: .3 }[sv.theme] || .3; if (sv.theme === 'cave') G.biome = 'cave'; } }
  /* человечек всегда под рукой на нижней полке */
  G.paused = false; G.lens = false; G.weather = 0; G.wind = 0; G.camp = false;
  let prog = store.get('prog', null) || { day: 1, unlocked: ['EARTH', 'WATER', 'STONE', 't:HUMAN'], done: {}, finished: false };
  const saveSet = () => store.set('set', { sel: G.sel, size: G.size, shape: G.shape, mode: G.mode, replace: G.replace, speed: 1, cs: G.cs, sound: G.sound, time: Sky.time, tcycle: G.tcycle, biome: G.biome, sday: Sky.day, dsec: Sky.Y.daySec, slen: Sky.Y.slen, wauto: G.wauto, lastEl: G.lastEl, cat: G.cat });
  if (prog.unlocked && prog.unlocked.indexOf('t:HUMAN') < 0) prog.unlocked.push('t:HUMAN');
  const saveProg = () => store.set('prog', prog);

  /* ---------- названия и иконки ---------- */
  const MODE_ICON = { brush: 'brush', line: 'line', rect: 'rect', fill: 'bucket' };
  const TOOL_ICON = { ERASE: 'eraser', LIGHTNING: 'bolt', METEOR: 'meteor', BLAST: 'bomb', WIND: 'wind', HEAT: 'flame', COLD: 'snow', HUMAN: 'human', ZOMBIE: 'zombie' };
  const isTool = (k) => k.charAt(0) === 't' && k.charAt(1) === ':';
  const exists = (k) => isTool(k) ? !!TOOLS[k.slice(2)] : E[k] !== undefined;
  const nameOf = (k) => isTool(k) ? TOOLS[k.slice(2)].name : NAME[E[k]];
  const hintOf = (k) => isTool(k) ? TOOLS[k.slice(2)].hint : HINT[E[k]];
  const formOf = (k) => isTool(k) && TOOLS[k.slice(2)] && TOOLS[k.slice(2)].form;
  const iconOf = (k) => k === 't:HUMAN' || k === 't:ZOMBIE' || k === 't:CHILD' ? People.icon('ref', k === 't:ZOMBIE') : formOf(k) ? People.icon(formOf(k)) : isTool(k) ? (UIA.icon[k] || Icons.ui(TOOL_ICON[k.slice(2)])) : Icons.el(k);
  const img = (src, cls) => Icons.img(src, cls);
  const catIcon = (c) => UIA.icon['cat:' + c.icon] || ({ pile: Icons.el('SAND'), drop: Icons.el('WATER'), puff: Icons.el('STEAM'), block: Icons.el('STONE'), seed: Icons.el('SEED'), bulb: Icons.el('LAMP'), bolt: Icons.ui('bolt'), people: People.icon('ref') })[c.icon];

  /* ---------- кампания ---------- */
  const DAYS = [
    { say: 'Здравствуй, творец! Начнём с простого: смешай землю с водой и подожди — а течение воды крошит камень в песок.', goals: [{ t: 'Сделай грязь', h: 'Полей землю водой', ok: (c) => c[E.MUD] >= 8 }, { t: 'Получи песок', h: 'Пусти воду течь по камню', ok: (c) => c[E.SAND] >= 4 }], unl: ['SEED', 'FIRE', 'SAND'] },
    { say: 'Семя на влажной земле даст дерево. А огонь… огонь всё превращает в пепел.', goals: [{ t: 'Вырасти дерево', h: 'Семя на земле рядом с водой', ok: (c) => c[E.WOOD] >= 14 && c[E.LEAF] >= 10 }, { t: 'Сожги что-нибудь дотла', h: 'Нужен пепел', ok: (c) => c[E.ASH] >= 3 }], unl: ['OIL', 'LAVA', 'WOOD', 'LEAF', 'ASH', 'CONE', 'FSEED'] },
    { say: 'Лава плавит песок в стекло, а вода от жара превращается в пар. Вот и Жар с Холодом — береги их!', goals: [{ t: 'Сделай стекло', h: 'Песок + лава', ok: (c) => c[E.GLASS] >= 4 }, { t: 'Получи пар', h: 'Лава и вода', ok: (c) => c[E.STEAM] >= 8 }], unl: ['SALT', 'SNOW', 'GLASS', 'STEAM', 'SMOKE', 't:HEAT', 't:COLD'] },
    { say: 'Холод превращает воду в лёд, а соль делает воду тяжёлой и солёной.', goals: [{ t: 'Заморозь воду', h: 'Инструмент «Холод»', ok: (c) => c[E.ICE] >= 8 }, { t: 'Сделай рассол', h: 'Соль + вода', ok: (c) => c[E.BRINE] >= 6 }], unl: ['ICE', 'BRINE', 'METAL', 'BATT', 'LAMP', 'SPARK', 'GUNP', 't:BLAST'] },
    { say: 'Ток бежит по металлу и воде. А порох… порох любит шумные праздники.', goals: [{ t: 'Зажги лампу', h: 'Батарея → металл → лампа', ok: (c, x) => x.lit >= 1 }, { t: 'Устрой взрыв', h: 'Порох, газ или инструмент', ok: () => Sim.stats.blasts >= 1 }], unl: ['t:LIGHTNING', 't:WIND', 'ACID', 'GAS', 'WALL', 'MUD'] },
    { say: 'Небо — твоё. Позови грозу и ударь молнией!', goals: [{ t: 'Ударь молнией', h: 'Сила «Молния» или гроза', ok: () => Sim.stats.lightning >= 1 }, { t: 'Выпусти светляков', h: 'Пять светляков в небе', ok: (c) => c[E.FLY] >= 5 }], unl: ['t:METEOR', 'FLY', 'CLONE', 'VOID', 't:HUMAN', 't:ZOMBIE'] }
  ];
  const RECIPE = { MUD: 'Полей землю водой.', SAND: 'Пусти воду течь по камню — он крошится.', GLASS: 'Расплавь песок лавой или ударь молнией.', STEAM: 'Нагрей воду или полей её лавой.', ICE: 'Охлади воду «Холодом».', BRINE: 'Растворить соль в воде.', ASH: 'Сожги дерево.', SMOKE: 'Что-нибудь подожги.', WOOD: 'Вырасти дерево из семени.', LEAF: 'Вырасти дерево из семени.' };
  function isUnlocked(k) { if (formOf(k)) k = 't:HUMAN'; return !G.camp || prog.unlocked.indexOf(k) >= 0 || k === 't:ERASE'; }
  function unlockKeys(list) { let n = 0; for (const k of list) if (prog.unlocked.indexOf(k) < 0) { prog.unlocked.push(k); n++; } return n; }
  function lockHint(k) {
    if (RECIPE[k]) return 'Закрыто. ' + RECIPE[k];
    for (let d = 0; d < DAYS.length; d++) if (DAYS[d].unl.indexOf(k) >= 0) return 'Закрыто. Откроется после дня ' + (d + 1) + '.';
    return 'Закрыто.';
  }
  let goalTick = 0;
  function checkGoals() {
    if (!G.camp) return;
    const c = Sim.census(), A = Sim.A; let lit = 0;
    if (c[E.LAMP]) for (let i = 0; i < A.type.length; i++) if (A.type[i] === E.LAMP && A.life[i] > 0) lit++;
    let found = [];
    for (let t = 1; t < ID_LIST.length; t++) { const k = ID_LIST[t]; if (c[t] > 0 && NAME[t] && t !== E.SPROUT && t !== E.SKY && t !== E.WALL && prog.unlocked.indexOf(k) < 0) { prog.unlocked.push(k); found.push(NAME[t]); } }
    if (found.length) { toast('Открыто: ' + found.join(', '), true); Snd.sfx('ok'); saveProg(); renderBar(); }
    const d = DAYS[Math.min(prog.day, DAYS.length) - 1]; if (!d || prog.finished) return;
    let all = true;
    d.goals.forEach((g, i) => {
      const key = prog.day + ':' + i;
      if (!prog.done[key]) { if (g.ok(c, { lit })) { prog.done[key] = 1; toast('Цель выполнена: ' + g.t, true); Snd.sfx('ok'); saveProg(); updateHud(); if (openedPanel === 'goals') openPanel('goals', true); } else all = false; }
    });
    if (all) finishDay(d);
  }
  function finishDay(d) {
    const n = unlockKeys(d.unl);
    toast('День ' + prog.day + ' пройден!' + (n ? ' Новые элементы: ' + n : ''), true);
    if (prog.day >= DAYS.length) { prog.finished = true; prog.unlocked = ID_LIST.filter((k) => NAME[E[k]]).concat(Object.keys(TOOLS).map((t) => 't:' + t)); } else prog.day++;
    saveProg(); updateHud(); renderBar();
    setTimeout(() => openPanel('goals', true), 1200);
  }

  /* ---------- мир ---------- */
  const field = $('#field'), stage = $('#stage'), ring = $('#ring'), fx = $('#fx'), fxc = fx.getContext('2d');
  let W = 0, H = 0, cs = 4;
  /* Размер мира не зависит от устройства: всегда ~42 000 клеток, меняется только форма (под экран). Клетка = целое число физических пикселей, поэтому без размытия и одинаково на телефоне и ПК. */
  const CELLS = 42000;
  function gridFor() {
    const st = stage.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, sw = Math.max(120, st.width - 28), sh = Math.max(120, st.height - 28);
    const asp = Math.max(.5, Math.min(2.2, sw / sh));
    let w = Math.round(Math.sqrt(CELLS * asp)), hh = Math.round(CELLS / w);
    const sc = Math.max(1, Math.floor(Math.min(sw * dpr / w, sh * dpr / hh)));   /* физических пикселей на клетку */
    /* подгоняем число клеток под целый масштаб, чтобы поле заполняло экран */
    w = Math.max(60, Math.floor(sw * dpr / sc)); hh = Math.max(40, Math.floor(sh * dpr / sc));
    if (w * hh > CELLS * 1.6) { const k = Math.sqrt(CELLS * 1.6 / (w * hh)); w = Math.floor(w * k); hh = Math.floor(hh * k); }
    return { c: sc / dpr, w, h: hh };
  }
  /* ---------- зум и сдвиг поля: колесо, щипок двумя пальцами, правая кнопка, кнопки в панели «Мир» ---------- */
  const view = { z: 1, x: 0, y: 0 }; let shakeT = '';
  function clampView() {
    const hw = W * cs / 2, hh = H * cs / 2; view.z = Math.max(1, Math.min(8, view.z));
    const mx = hw * (view.z - 1), my = hh * (view.z - 1); view.x = Math.max(-mx, Math.min(mx, view.x)); view.y = Math.max(-my, Math.min(my, view.y));
  }
  function applyView() { clampView(); field.style.transform = (view.z === 1 && !view.x && !view.y ? '' : 'translate(' + view.x.toFixed(1) + 'px,' + view.y.toFixed(1) + 'px) scale(' + view.z.toFixed(3) + ') ') + shakeT; field.style.transformOrigin = 'center'; }
  function zoomAt(cx, cy, k) {
    const st = stage.getBoundingClientRect(), z0 = view.z, z2 = Math.max(1, Math.min(8, z0 * k)), ux = cx - (st.left + st.width / 2) - view.x, uy = cy - (st.top + st.height / 2) - view.y;
    view.x += ux * (1 - z2 / z0); view.y += uy * (1 - z2 / z0); view.z = z2; applyView(); showRing(null, true);
  }
  function zoomBtn(k) { const st = stage.getBoundingClientRect(); zoomAt(st.left + st.width / 2, st.top + st.height / 2, k); }
  stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.18 : 1 / 1.18); }, { passive: false });
  /* ---------- карточка человечка: имя, возраст, занятие ---------- */
  const TASK_BADGE = { sleep: 'zzz', camp: 'fire', fire: 'fire', build: 'home', chat: 'group', together: 'group', rest: 'book', mourn: 'scroll', bury: 'scales', wed: 'beers', quarrel: 'scales', sulk: 'scroll' };
  const card = h('div', 'pb'); card.id = 'pcard'; stage.appendChild(card); let cardEnt = null;
  function cardText() {
    const e = cardEnt, L = Life.describe(e), form = (People.FORMS[e.form] || {}).name || '', bd = !e.dying && UIA.badge[TASK_BADGE[e.task]];
    card.innerHTML = '<div class="ch"><img class="pt" src="' + People.icon(e.form, e.z) + '"><b>' + e.name + '</b><button class="cx">×</button></div><div class="cr">' + (bd ? '<img class="tb" src="' + bd + '">' : '') + (form ? form + '<br>' : '') + L.join('<br>') + '</div>';
    card.querySelector('.cx').onclick = closeCard; fixK(card);
  }
  function openCard(e) { cardEnt = e; People.setSel(e.dead ? null : e.id); card.style.display = 'block'; cardText(); placeCard(); }
  function closeCard() { cardEnt = null; People.setSel(null); card.style.display = 'none'; }
  /* карточка висит над головой человечка и едет за ним (и при зуме тоже) */
  function placeCard() {
    if (!cardEnt) return;
    const fr = field.getBoundingClientRect(), sr = stage.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
    const px = fr.left + cardEnt.x / W * fr.width - sr.left, py = fr.top + (cardEnt.y - 19) / H * fr.height - sr.top;
    const x = Math.max(6, Math.min(sr.width - cw - 6, px - cw / 2));
    let y = py - ch; if (y < 6) y = Math.min(sr.height - ch - 6, py + 34 * view.z);
    card.style.left = Math.round(x) + 'px'; card.style.top = Math.round(y) + 'px';
  }
  /* нажатие на человечка (или на тело) инструментом из вкладки «Люди»: открыть карточку */
  const personTool = () => { const k = G.sel; return isTool(k) && (k === 't:HUMAN' || k === 't:ZOMBIE' || k === 't:CHILD' || !!formOf(k)); };
  /* кто стоит под пальцем (узко: чтобы ставить людей рядом с другими не мешало) */
  function personAt(e) {
    const [x, y] = cellOf(e); let best = null, bd = 1e9;
    for (const o of Sim.ents) { if (o.z) continue; const dx = Math.abs(o.x - x), dy = y - o.y; if (dx > 2.5 || dy > 1 || dy < (o.dead ? -4 : -13)) continue; const d = dx + Math.abs(dy + (o.dead ? 2 : 6)) * .3; if (d < bd) { bd = d; best = o; } }
    return best;
  }
  const tp = new Map(); let pinch = null, panning = null, lpT = 0, lp = null;
  function pinchState() { const a = [...tp.values()]; return { cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1 }; }
  function layout(first) {
    const g = gridFor();
    if (first) Sim.alloc(g.w, g.h); else if (g.w !== W || g.h !== H) {
      /* мир пересобирается под новый размер окна: человечки, дома и костры переезжают вместе с ним */
      const keep = { ents: Sim.ents.slice(), camps: Sim.camps.slice(), homes: Sim.homes.slice(), graves: Sim.graves.slice() }, kx = g.w / W, ky = g.h / H, d = Sim.pack();
      Sim.unpack(d, g.w, g.h);
      keep.ents.forEach((e) => { e.x *= kx; e.y = Math.round(e.y * ky); Sim.ents.push(e); });
      if (typeof Houses !== 'undefined') { Houses.sim = Sim; Houses.rescale(kx, ky); }
      [['camps', ['x', 'y']], ['homes', ['x', 'y', 'rx', 'ry']], ['graves', ['x', 'y']]].forEach(([k, fs]) => keep[k].forEach((o) => { fs.forEach((f) => { o[f] = Math.round(o[f] * (f === 'x' || f === 'rx' ? kx : ky)); }); Sim[k].push(o); }));
    }
    W = g.w; H = g.h; cs = g.c;
    Render.init($('#sim'), $('#glow'), $('#bg'), W, H);
    fx.width = W; fx.height = H;
    field.style.width = (W * cs) + 'px'; field.style.height = (H * cs) + 'px';
    view.z = 1; view.x = 0; view.y = 0; applyView();
  }
  function rockTile() {
    const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d');
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) { const n = r(); const b = 50 + ((i * 7 + j * 3) % 9) + (n < .15 ? 10 : n > .9 ? -12 : 0); x.fillStyle = 'rgb(' + (b + 4) + ',' + (b - 14) + ',' + (b + 6) + ')'; x.fillRect(i, j, 1, 1); }
    x.fillStyle = '#24152a'; for (let k = 0; k < 7; k++) { let px = (r() * 48) | 0, py = (r() * 48) | 0; for (let t = 0; t < 12; t++) { x.fillRect(px, py, 1, 1); px += (r() < .5 ? 1 : 0); py += (r() < .6 ? 1 : (r() < .5 ? -1 : 0)); } }
    x.fillStyle = '#6a4a64'; for (let k = 0; k < 30; k++) x.fillRect((r() * 48) | 0, (r() * 48) | 0, 2, 1);
    return c.toDataURL();
  }
  function newWorld(kind) {
    if (typeof Town !== 'undefined') Town.clear();
    Sim.generate(kind, { plain: G.camp && prog.day === 1 && !prog.finished });
    Sim.stats.blasts = Sim.stats.lightning = Sim.stats.meteors = 0;
    G.weather = Sim.weather = 0; Sim.wind = G.wind = 0; undoStack.length = 0;
  }

  /* ---------- вкладки интерфейса ---------- */
  const hud = $('#hud'), bar = $('#bar'), panel = $('#panel');
  const slotDefs = [
    { id: 'br', icon: () => Icons.ui(MODE_ICON[G.mode] || 'brush'), act: () => openPanel('brush') },
    { id: 'er', icon: () => Icons.ui('eraser'), act: toggleErase },
    { id: 'we', icon: () => Icons.ui('cloud'), act: () => openPanel('weather') },
    { id: 'wo', icon: () => Icons.ui('globe'), act: () => openPanel('world') },
    { id: 'pe', icon: () => People.icon('ref'), act: () => { pv.sel = null; openPanel('people'); } },
    { id: 'un', icon: () => Icons.ui('undo'), act: () => undo() },
    { id: 'sp', icon: () => Icons.ui('speed'), act: () => { spIdx = (spIdx + 1) % speeds.length; G.speed = speeds[spIdx]; updateHud(); } },
    { id: 'pl', icon: () => Icons.ui(G.paused ? 'play' : 'pause'), act: () => { G.paused = !G.paused; updateHud(); Snd.sfx('tap'); } }
  ];
  const slotEls = {};
  slotDefs.forEach((s) => { const b = h('button', 'slot pb'); b.appendChild(img(s.icon())); b.onclick = () => { Snd.init(); Snd.resume(); Snd.sfx('tap'); s.act(); }; hud.appendChild(b); slotEls[s.id] = b; });
  function updateHud() {
    slotDefs.forEach((s) => { const b = slotEls[s.id]; b.firstChild.src = s.icon(); });
    slotEls.er.classList.toggle('on', G.sel === 't:ERASE');
    slotEls.pl.classList.toggle('on', G.paused); slotEls.sp.classList.toggle('on', G.speed !== 1); slotEls.br.classList.toggle('on', openedPanel === 'brush');
    slotEls.we.classList.toggle('on', openedPanel === 'weather' || G.weather > 0); slotEls.wo.classList.toggle('on', openedPanel === 'world'); slotEls.pe.classList.toggle('on', openedPanel === 'people');
    let sb = slotEls.sp.querySelector('.badge'); if (!sb) { sb = h('span', 'badge'); slotEls.sp.appendChild(sb); } sb.textContent = '×' + G.speed;
    { let wb = slotEls.we.querySelector('.badge'); if (!wb) { wb = h('span', 'badge'); slotEls.we.appendChild(wb); } const q = SEASON[Sky.Y.season]; wb.textContent = q.n.slice(0, 2); wb.style.background = q.c; wb.style.color = '#1a1020'; }
    $('#paused').style.display = G.paused ? 'block' : 'none'; $('#stepbtn').style.display = G.paused ? 'flex' : 'none';
    const ac = catIdx(G.sel); bar.querySelectorAll('.hot').forEach((b) => b.classList.toggle('on', +b.dataset.i === ac));
  }
  const stepBtn = $('#stepbtn'); stepBtn.className = 'pb'; stepBtn.appendChild(img(Icons.ui('step'))); stepBtn.onclick = () => Sim.step();
  function toggleErase() { if (G.sel === 't:ERASE') select(G.last && G.last !== 't:ERASE' ? G.last : 'WATER', true); else { G.last = G.sel; select('t:ERASE', true); } }
  function select(k, quiet) {
    if (!exists(k)) return; if (!isUnlocked(k)) { toast(lockHint(k)); Snd.sfx('nope'); return; }
    G.sel = k; const ci = catIdx(k); if (ci >= 0) { G.lastEl[CATS[ci].id] = k; G.cat = ci; }
    saveSet(); renderBar(); updateHud(); if (!quiet) Snd.sfx('pop');
  }
  /* нижняя панель: недавние элементы */
  const undoStack = []; let speeds = [.5, 1, 2, 3], spIdx = 1;
  /* нижняя панель — только типы: на каждой кнопке последний выбранный элемент этого типа. Нажатие выбирает его, повторное нажатие или долгое удержание открывает список типа */
  const catIdx = (k) => CATS.findIndex((c) => c.els.indexOf(k) >= 0);
  function lastOf(c) {
    const k = G.lastEl[c.id]; if (k && c.els.indexOf(k) >= 0 && exists(k) && isUnlocked(k)) return k;
    return c.els.find((e) => exists(e) && isUnlocked(e)) || c.els.find(exists);
  }
  function openCat(i) { G.cat = i; saveSet(); openPanel('elements', true); }
  function tapCat(i) {
    const c = CATS[i], k = lastOf(c); if (!k) return;
    if (catIdx(G.sel) === i && G.sel === k) { openCat(i); return; }
    if (!isUnlocked(k)) { toast(lockHint(k)); Snd.sfx('nope'); return; }
    select(k); if (openedPanel === 'elements') closePanel();
  }
  function renderBar() {
    bar.innerHTML = '';
    CATS.forEach((c, i) => {
      const k = lastOf(c); if (!k) return;
      const b = h('button', 'hot pb'); b.dataset.i = i; b.appendChild(img(iconOf(k), 'el')); b.appendChild(h('span', '', c.name));
      let t = 0, long = false;
      b.onpointerdown = () => { long = false; clearTimeout(t); t = setTimeout(() => { long = true; Snd.init(); Snd.resume(); Snd.sfx('tap'); openCat(i); }, 450); };
      b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(t);
      b.onclick = () => { if (long) { long = false; return; } Snd.init(); Snd.resume(); Snd.sfx('tap'); tapCat(i); };
      bar.appendChild(b);
    });
    updateHud();
  }
  function undo() { if (!undoStack.length) { toast('Отменять нечего'); return; } const d = undoStack.pop(); loadPack(d); Snd.sfx('tap'); }
  function pushUndo() { undoStack.push(Sim.pack()); if (undoStack.length > 8) undoStack.shift(); }
  function loadPack(d) { Sim.unpack(d, W, H); }

  /* ---------- жители: список по обществам, карточка (обзор и отношения), общества и летопись ----------
     Панель не пересобирается сама: раз в полсекунды обновляются только числа, занятия и полоски (pvLive).
     Целиком она перерисовывается, только если поменялся состав (кто-то родился, умер, сменил общество) и игрок
     не трогал панель последние полторы секунды, — чтобы строки не прыгали под пальцем. */
  const pv = { tab: 'list', sel: null, sub: 'info', rf: 'all', strangers: false };
  let pvLive = [], pvSig = '', pvTouch = 0;
  const TASK_ICON = { sleep: 'zzz', camp: 'fire', fire: 'fire', house: 'home', build: 'home', chat: 'group', together: 'group', rest: 'book', mourn: 'scroll', bury: 'scales', wed: 'beers', quarrel: 'scales', sulk: 'scroll',
    preach: 'scales', pray: 'scales', study: 'book', read: 'book', learn: 'book', drink: 'beers', serve: 'beers', craft: 'bag', trade: 'bag', work: 'bag', quarry: 'home', shelter: 'home' };
  const coin = () => (UIA.emote && UIA.emote.money) || '';
  const live = (o) => o && !o.dying && !o.z;
  const onLive = (f) => { pvLive.push(f); f(); };
  function openPerson(e) { pv.tab = 'list'; pv.sel = e.id; People.setSel(e.dead ? null : e.id); openPanel('people', true); }
  function goPerson(id, sub) { pv.tab = 'list'; pv.sel = id; if (sub) pv.sub = sub; const o = Life.byId(id); People.setSel(o && !o.dying ? id : null); Snd.sfx('tap'); openPanel('people', true); panel.querySelector('.pbody').scrollTop = 0; }
  /* родство и симпатия: группа, подпись, цвет */
  const sibling = (a, b) => a.par != null && a.par === b.par;
  function relGroup(e, o) {
    if (e.mate === o.id || e.par === o.id || o.par === e.id || sibling(e, o)) return 'fam';
    const r = e.rel[o.id] || 0; if (r < 0) return 'foe'; if (r >= 2) return 'friend'; if (r > 0) return 'known'; return 'none';
  }
  const GROUPS = [['fam', 'Семья'], ['friend', 'Друзья'], ['known', 'Знакомые'], ['foe', 'Недруги'], ['none', 'Не знакомы']];
  /* сердечки: сколько тепла у e к o (0..5), недруги — разбитые */
  function hearts(v) { const n = Math.max(0, Math.min(5, Math.round(v))), bad = Math.max(0, Math.min(5, Math.round(-v))); return bad ? '<i class="hb">' + '✕'.repeat(bad) + '</i>' : '<i class="hf">' + '♥'.repeat(n) + '</i><i class="he">' + '♥'.repeat(5 - n) + '</i>'; }
  function mutual(e, o) {
    const a = e.rel[o.id] || 0, b = o.rel[e.id] || 0;
    if (a >= 2 && b >= 2) return ['взаимно', 'mu'];
    if (a < 0 && b < 0) return ['взаимная неприязнь', 'bad'];
    if (a >= 2 && b < 1) return ['без взаимности', 'one'];
    if (b >= 2 && a < 1) return [(o.fem ? 'она' : 'он') + ' тянется к ' + (e.fem ? 'ней' : 'нему'), 'one'];
    if (b < 0 && a >= 0) return [(o.fem ? 'она' : 'он') + ' не любит ' + (e.fem ? 'её' : 'его'), 'bad'];
    return null;
  }
  function pPeople(body) {
    pvLive = []; pvSig = sigOf();
    const tabs = h('div', 'ptabs');
    [['list', 'Жители'], ['soc', 'Общества'], ['log', 'Летопись']].forEach(([k, t]) => { const b = btn(t, pv.tab === k, 'ptab'); b.onclick = () => { pv.tab = k; pv.sel = null; Snd.sfx('tap'); openPanel('people', true); }; tabs.appendChild(b); });
    body.appendChild(tabs);
    const box = h('div', 'pbox'); body.appendChild(box);
    if (pv.tab === 'list' && pv.sel != null) personView(box);
    else if (pv.tab === 'list') peopleList(box);
    else if (pv.tab === 'soc') socView(box);
    else logView(box);
  }
  /* состав, при смене которого панель надо перерисовать */
  function sigOf() {
    const ids = Sim.ents.filter((e) => !e.z && (!e.dying || e.dead)).map((e) => e.id + (e.dying ? 'd' : '') + ':' + (e.soc || 0) + (e.prof || '')).join(',');
    return pv.tab + '|' + (pv.tab === 'soc' ? Town.socs.map((s) => s.id + ':' + s.leader).join(',') + '|' + Houses.list.map((b) => b.id + (b.done ? 'd' : '')).join(',') : pv.tab === 'log' ? Town.log.length + (Town.log[0] || {}).txt : ids + '|' + Town.socs.map((s) => s.leader).join(','));
  }
  function pvTick() {
    if (openedPanel !== 'people') return;
    const s = sigOf();
    if (s !== pvSig && performance.now() - pvTouch > 1500) { const pb = panel.querySelector('.pbody'), st = pb ? pb.scrollTop : 0; openPanel('people', true); const nb = panel.querySelector('.pbody'); if (nb) nb.scrollTop = st; return; }
    for (const f of pvLive) { try { f(); } catch (er) { /* строка устарела */ } }
  }
  panel.addEventListener('pointerdown', () => { pvTouch = performance.now(); }, true);
  panel.addEventListener('wheel', () => { pvTouch = performance.now(); }, { capture: true, passive: true });
  panel.addEventListener('scroll', () => { pvTouch = performance.now(); }, true);
  function face(e, cls) { const i = img(People.iconFor(e), cls || 'pf'); i.classList.remove('smooth'); return i; }
  function socTag(s) { const t = h('span', 'stag', s ? s.name : 'Без общества'); if (s) t.style.setProperty('--sc', s.color); return t; }
  function money(e) { const m = h('span', 'pm'); m.appendChild(img(coin(), 'ci')); const t = document.createTextNode(''); m.appendChild(t); onLive(() => { t.data = String(e.money | 0); }); return m; }
  function peopleList(box) {
    const ents = Sim.ents.filter((e) => !e.z && (!e.dying || e.dead));
    box.appendChild(h('div', 'hint', 'Нажми на жителя, чтобы открыть карточку. В мире карточку открывает долгое нажатие на человечка.'));
    if (!ents.length) { box.appendChild(h('div', 'hint', 'Пока никого нет. Поставь человечков инструментами из вкладки «Люди» — встретившись, они выберут главу и заживут обществом.')); return; }
    const groups = Town.socs.map((s) => ({ s, m: ents.filter((e) => e.soc === s.id) })).concat([{ s: null, m: ents.filter((e) => e.soc == null || !Town.byId(e.soc)) }]).filter((g) => g.m.length);
    for (const g of groups) {
      const hd = h('div', 'pgrp'); hd.appendChild(socTag(g.s)); const sm = h('small'); hd.appendChild(sm); box.appendChild(hd);
      onLive(() => { sm.textContent = g.m.filter(live).length + ' чел.' + (g.s ? ' · казна ' + g.s.bank + ' мон.' : ''); });
      const list = h('div', 'plist'); box.appendChild(list);
      g.m.sort((a, b) => (b.id === (g.s && g.s.leader)) - (a.id === (g.s && g.s.leader)) || a.id - b.id);   /* порядок постоянный: глава, потом по времени появления */
      for (const e of g.m) {
        const r = h('button', 'prow pb' + (e.dying ? ' dead' : '')), lead = g.s && g.s.leader === e.id;
        r.appendChild(face(e));
        const t = h('div', 'pt'); t.appendChild(h('b', '', (lead ? '♛ ' : '') + e.name)); const sub = h('small'); t.appendChild(sub); r.appendChild(t);
        onLive(() => { sub.textContent = e.dying ? 'погиб' + (e.fem ? 'ла' : '') : Math.floor(e.age) + ' · ' + (Town.PROF[e.prof] || { n: Life.stageOf(e.age) }).n + ' · ' + (e.txt || ''); });
        if (!e.dying) r.appendChild(money(e));
        r.onclick = () => goPerson(e.id);
        list.appendChild(r);
      }
    }
  }
  function personView(box) {
    const e = Life.byId(pv.sel);
    const nav = h('div', 'pnav');
    const back = btn('← Ко всем', false, 'pback'); back.onclick = () => { pv.sel = null; Snd.sfx('tap'); openPanel('people', true); }; nav.appendChild(back);
    if (e && !e.dying) { const sb = btn('Показать в мире', false, 'gold pshow'); sb.onclick = () => { People.setSel(e.id); closePanel(); }; nav.appendChild(sb); }
    box.appendChild(nav);
    if (!e) { box.appendChild(h('div', 'hint', 'Этого человечка больше нет.')); return; }
    const s = Town.byId(e.soc), top = h('div', 'phero');
    top.appendChild(face(e, 'pbig'));
    const info = h('div', 'pinfo');
    info.appendChild(h('div', 'pname', (s && s.leader === e.id ? '♛ ' : '') + e.name));
    const l0 = h('div', 'pline'); info.appendChild(l0); onLive(() => { l0.textContent = Life.describe(e)[0]; });
    const st = h('div', 'pline'); st.appendChild(socTag(s)); if (s && s.leader === e.id) st.appendChild(h('span', 'prole', 'Глава')); info.appendChild(st);
    top.appendChild(info);
    if (!e.dying) { const bi = img(UIA.badge.home, 'pbadge'); bi.classList.remove('smooth'); top.appendChild(bi); let last = ''; onLive(() => { const k = TASK_ICON[e.task] || ''; if (k !== last) { last = k; bi.style.visibility = k ? 'visible' : 'hidden'; if (k) bi.src = UIA.badge[k]; } }); }
    box.appendChild(top);
    /* переключатель: обзор / отношения */
    const others = Sim.ents.filter((o) => o !== e && live(o));
    const cnt = { fam: 0, friend: 0, foe: 0 }; for (const o of others) { const g = relGroup(e, o); if (cnt[g] != null) cnt[g]++; }
    const seg = h('div', 'pseg');
    [['info', 'Обзор'], ['rel', 'Отношения · ' + others.filter((o) => relGroup(e, o) !== 'none').length]].forEach(([k, t]) => { const b = btn(t, pv.sub === k, ''); b.onclick = () => { pv.sub = k; Snd.sfx('tap'); openPanel('people', true); }; seg.appendChild(b); });
    box.appendChild(seg);
    if (pv.sub === 'rel') { relView(box, e, others); return; }
    const facts = h('div', 'pfacts');
    const fact = (k, v) => { const r = h('div', 'pfact'); r.appendChild(h('span', '', k)); const b = h('b'); if (typeof v === 'string') b.textContent = v; else b.appendChild(v); r.appendChild(b); facts.appendChild(r); return b; };
    if (e.dying) Life.describe(e).slice(1).forEach((l) => fact('', l));
    else {
      const tb = fact('Занятие', ''); onLive(() => { tb.textContent = e.txt || '—'; });
      const P = Town.PROF[e.prof]; fact('Профессия', P ? P.n + (P.d ? ' — ' + P.d.toLowerCase() : '') : (e.age < 16 ? 'ещё ребёнок' : 'выбирает'));
      { const m = money(e), ex = document.createTextNode(''); m.appendChild(ex); onLive(() => { ex.data = ' мон. (заработано ' + (e.earned | 0) + ')'; }); fact('Деньги', m); }
      { const wb = fact('Оружие', ''); onLive(() => { wb.textContent = (e.weapon ? Combat.WEAP[e.weapon].n : 'нет') + (e.kills ? ' · побед: ' + e.kills : '') + ' · здоровье ' + Math.max(0, e.hp | 0); }); }
      const hb = fact('Дом', ''); onLive(() => { const hm = Town.homeOf(e); hb.textContent = hm ? hm.b.name + ' · ' + (hm.r.f + 1) + '-й этаж' : 'нет своего жилья'; });
    }
    box.appendChild(facts);
    /* коротко о близких: семья и лучшие друзья, нажатие — к их карточке */
    const close = others.filter((o) => relGroup(e, o) === 'fam').concat(others.filter((o) => relGroup(e, o) === 'friend').sort((a, b) => (e.rel[b.id] || 0) - (e.rel[a.id] || 0)).slice(0, 4));
    if (close.length) {
      box.appendChild(h('div', 'lbl', 'Близкие'));
      const cl = h('div', 'pclose');
      for (const o of close) { const c = h('button', 'pchip'); c.appendChild(face(o, 'rf')); c.appendChild(h('span', '', o.name + ' · ' + Town.relLabel(e, o).toLowerCase())); c.onclick = () => goPerson(o.id, 'info'); cl.appendChild(c); }
      box.appendChild(cl);
    }
    const sum = h('div', 'hint', 'Семья: ' + cnt.fam + ' · друзей: ' + cnt.friend + ' · недругов: ' + cnt.foe + '. Все отношения — во вкладке «Отношения».'); box.appendChild(sum);
  }
  /* отношения: фильтр, группы, сердечки, взаимность */
  function relView(box, e, others) {
    if (!others.length) { box.appendChild(h('div', 'hint', 'В мире больше никого.')); return; }
    const flt = h('div', 'pflt');
    [['all', 'Все'], ['fam', 'Семья'], ['friend', 'Друзья'], ['foe', 'Недруги'], ['soc', 'Своё общество']].forEach(([k, t]) => { const b = btn(t, pv.rf === k, 'chipbtn'); b.onclick = () => { pv.rf = k; Snd.sfx('tap'); openPanel('people', true); }; flt.appendChild(b); });
    box.appendChild(flt);
    const pass = (o) => pv.rf === 'all' || pv.rf === relGroup(e, o) || (pv.rf === 'soc' && o.soc === e.soc && e.soc != null);
    let shown = 0;
    for (const [g, title] of GROUPS) {
      const L = others.filter((o) => relGroup(e, o) === g && pass(o)).sort((a, b) => (g === 'foe' ? (e.rel[a.id] || 0) - (e.rel[b.id] || 0) : (e.rel[b.id] || 0) - (e.rel[a.id] || 0)));
      if (!L.length) continue;
      const hd = h('button', 'rgh' + (g === 'none' ? ' fold' : '')); hd.innerHTML = '<span>' + title + '</span><small>' + L.length + '</small>' + (g === 'none' ? '<em>' + (pv.strangers ? 'скрыть' : 'показать') + '</em>' : '');
      if (g === 'none') hd.onclick = () => { pv.strangers = !pv.strangers; Snd.sfx('tap'); openPanel('people', true); };
      box.appendChild(hd);
      if (g === 'none' && !pv.strangers) continue;
      const rl = h('div', 'rlist'); box.appendChild(rl);
      for (const o of L) {
        shown++;
        const r = h('button', 'rrow g-' + g);
        r.appendChild(face(o, 'rf'));
        const t = h('div', 'rt'); t.appendChild(h('b', '', o.name));
        const sub = h('small'); t.appendChild(sub); r.appendChild(t);
        const hs = h('span', 'rh'); r.appendChild(hs);
        onLive(() => {
          const mu = mutual(e, o), os = o.soc !== e.soc ? ' · ' + ((Town.byId(o.soc) || { name: 'без общества' }).name) : '';
          sub.innerHTML = '<span class="rl">' + Town.relLabel(e, o) + '</span>' + (mu ? ' <span class="mu ' + mu[1] + '">' + mu[0] + '</span>' : '') + os;
          hs.innerHTML = hearts(e.rel[o.id] || 0);
        });
        r.onclick = () => goPerson(o.id, 'rel');
        rl.appendChild(r);
      }
    }
    if (!shown && !others.some((o) => relGroup(e, o) === 'none' && pass(o))) box.appendChild(h('div', 'hint', 'Здесь пока никого.'));
    box.appendChild(h('div', 'hint', 'Сердечки — как ' + e.name + ' относится к человеку; пометка рядом — отвечает ли тот взаимностью. Симпатия растёт от разговоров, работы и праздников вместе, падает от ссор и измен.'));
  }
  function socView(box) {
    if (!Town.socs.length) { box.appendChild(h('div', 'hint', 'Обществ пока нет. Двое взрослых рядом основывают общество и выбирают главу.')); return; }
    for (const s of Town.socs) {
      const c = h('div', 'scard pb'); c.style.setProperty('--sc', s.color);
      const L = Life.byId(s.leader), m = Town.members(s);
      const hd = h('div', 'shead'); hd.appendChild(socTag(s)); hd.appendChild(h('small', '', 'с ' + (s.born || '—'))); c.appendChild(hd);
      const lead = h('button', 'slead'); if (L) { lead.appendChild(face(L, 'rf')); lead.appendChild(h('span', '', '♛ Глава: ' + L.name)); lead.onclick = () => goPerson(L.id, 'info'); } c.appendChild(lead);
      const res = h('div', 'sres'); c.appendChild(res);
      onLive(() => {
        res.innerHTML = '';
        const chip = (t, v, need) => res.appendChild(h('span', 'chip' + (need && v < need ? ' low' : ''), t + ' ' + v + (need ? ' / ' + need : '')));
        chip('Жителей', Town.members(s).length); chip('Монеты', s.bank, s.want && s.want.bank); chip('Дерево', s.wood, s.want && s.want.wood); chip('Камень', s.stone, s.want && s.want.stone);
      });
      const profs = {}; for (const e of m) if (e.prof) profs[e.prof] = (profs[e.prof] || 0) + 1;
      c.appendChild(h('div', 'sprof', Object.keys(profs).map((p) => (Town.PROF[p] || Town.PROF.none).n + ' ' + profs[p]).join(' · ') || '—'));
      /* пары и вражда внутри общества */
      const pairs = [], feuds = [];
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) {
        const a = m[i], b = m[j];
        if (a.mate === b.id) pairs.push([a, b, a.mst === 2 ? 'женаты' : 'встречаются']);
        else if ((a.rel[b.id] || 0) < 0 && (b.rel[a.id] || 0) < 0) feuds.push([a, b]);
      }
      if (pairs.length || feuds.length) {
        const rel = h('div', 'srel');
        for (const [a, b, t] of pairs) { const q = h('button', 'pchip love'); q.innerHTML = '♥ '; q.appendChild(document.createTextNode(a.name + ' и ' + b.name + ' — ' + t)); q.onclick = () => goPerson(a.id, 'rel'); rel.appendChild(q); }
        for (const [a, b] of feuds) { const q = h('button', 'pchip feud'); q.textContent = '✕ ' + a.name + ' и ' + b.name + ' — в ссоре'; q.onclick = () => goPerson(a.id, 'rel'); rel.appendChild(q); }
        c.appendChild(rel);
      }
      /* соседи: отношения и войны */
      { const others = Town.socs.filter((o) => o !== s); if (others.length) { const dl = h('div', 'srel'); for (const o of others) { const v = s.rel[o.id] || 0, war = s.war && s.war[o.id], q = h('span', 'pchip ' + (war ? 'feud' : v >= 2 ? 'love' : '')); q.textContent = (war ? '⚔ ' : '') + '«' + o.name + '»: ' + Town.relSocLabel(v, war) + ' (' + v.toFixed(1) + ')'; dl.appendChild(q); } c.appendChild(dl); } }
      { const armed = m.filter((e) => e.weapon).length; c.appendChild(h('div', 'sprof', 'Вооружены: ' + armed + ' из ' + m.filter((e) => e.age >= 16).length + (s.lost ? ' · павших в последней войне: ' + s.lost : ''))); }
      if (s.want) c.appendChild(h('div', 'hint', 'Копят на новый дом: торговец докупает недостающее дерево и камень на деньги казны.'));
      const bs = Houses.list.filter((b) => b.soc === s.id);
      for (const b of bs) {
        const r = h('div', 'shouse'), bt = h('b'); r.appendChild(bt); onLive(() => { bt.textContent = b.name + (b.done ? '' : ' — строится ' + Math.round(b.prog * 100) + '%'); });
        const rooms = h('div', 'srooms');
        b.rooms.slice().sort((a, c2) => c2.f - a.f || a.i - c2.i).forEach((rm) => {
          const q = h('span', 'room'), bd = UIA.badge[Houses.ROLES[rm.role].badge]; if (bd) { const i = img(bd, 'ri'); i.classList.remove('smooth'); q.appendChild(i); }
          const who = rm.owners.map((id) => (Life.byId(id) || {}).name).filter(Boolean);
          q.appendChild(document.createTextNode((rm.f + 1) + ' эт. · ' + Houses.ROLES[rm.role].n + (who.length ? ' · ' + who.join(', ') : '')));
          rooms.appendChild(q);
        });
        r.appendChild(rooms); c.appendChild(r);
      }
      if (!bs.length) c.appendChild(h('div', 'hint', 'Своих домов пока нет.'));
      box.appendChild(c);
    }
  }
  function logView(box) {
    if (!Town.log.length) { box.appendChild(h('div', 'hint', 'Летопись пуста.')); return; }
    const l = h('div', 'llist');
    for (const it of Town.log) { const r = h('div', 'lrow' + (it.big ? ' big' : '')); if (it.c) r.style.setProperty('--sc', it.c); r.appendChild(h('small', '', it.t)); r.appendChild(h('span', '', it.txt)); l.appendChild(r); }
    box.appendChild(l);
  }

  /* ---------- панели ---------- */
  let openedPanel = '';
  function closePanel() { openedPanel = ''; panel.classList.remove('open'); updateHud(); }
  function openPanel(name, force) {
    if (!force && openedPanel === name) { closePanel(); return; }
    openedPanel = name; panel.innerHTML = ''; panel.dataset.kind = name;
    const titles = { elements: 'Элементы', brush: 'Кисть', weather: 'Небо и погода', world: 'Мир', goals: G.camp ? 'Цели дня' : 'Мудрец', settings: 'Настройки', people: 'Жители' };
    const hd = h('div', 'phead'); hd.appendChild(h('span', '', titles[name])); const x = h('button', 'x'); x.appendChild(img(Icons.ui('close'))); x.onclick = closePanel; hd.appendChild(x);
    const body = h('div', 'pbody'); panel.append(hd, body);
    ({ elements: pElements, brush: pBrush, weather: pWeather, world: pWorld, goals: pGoals, settings: pSettings, people: pPeople })[name](body);
    panel.classList.add('open'); updateHud();
  }
  function btn(txt, on, cls, ic) { const b = h('button', 'btn pb ' + (cls || '') + (on ? ' on' : '')); if (ic) b.appendChild(img(Icons.ui(ic))); b.appendChild(document.createTextNode(txt)); return b; }
  function pElements(body) {
    const cats = h('div', 'cats'), grid = h('div', 'grid'), hint = h('div', 'hint', 'Выбери элемент и води пальцем по миру.');
    const fill = () => {
      cats.innerHTML = ''; grid.innerHTML = '';
      CATS.forEach((c, i) => { const b = h('button', 'cat pb' + (i === G.cat ? ' on' : '')); b.appendChild(img(catIcon(c))); b.onclick = () => { G.cat = i; saveSet(); fill(); Snd.sfx('tap'); }; cats.appendChild(b); });
      CATS[G.cat].els.filter(exists).forEach((k) => {
        const lock = !isUnlocked(k); const t = h('button', 'tile pb' + (k === G.sel ? ' on' : '') + (lock ? ' lock' : ''));
        t.appendChild(img(iconOf(k), 'el')); t.appendChild(h('span', '', nameOf(k))); if (lock) t.appendChild(img(Icons.ui('lock'), 'lk'));
        t.onclick = () => { if (lock) { hint.textContent = lockHint(k); Snd.sfx('nope'); return; } select(k); closePanel(); };
        t.onmouseenter = () => { hint.textContent = lock ? lockHint(k) : (hintOf(k) || ''); }; t.onfocus = t.onmouseenter;
        grid.appendChild(t);
      });
      hint.textContent = CATS[G.cat].name + ': ' + CATS[G.cat].els.filter(exists).map(nameOf).join(', ');
    };
    fill(); body.append(cats, grid, hint);
  }
  function pBrush(body) {
    const sl = h('div', 'sl'); const rg = h('input'); rg.type = 'range'; rg.min = 1; rg.max = 14; rg.value = G.size; const val = h('b', '', G.size);
    rg.oninput = () => { G.size = +rg.value; val.textContent = G.size; saveSet(); showRing(null, true); };
    sl.append(h('span', '', 'Размер'), rg, val); body.append(sl);
    const mk = (title, opts, cur, set) => { const r = h('div', 'row'); r.appendChild(h('div', 'lbl', title)); opts.forEach((o) => { const b = btn(o[1], cur() === o[0], '', o[2]); b.onclick = () => { set(o[0]); Snd.sfx('tap'); openPanel('brush', true); updateHud(); }; r.appendChild(b); }); body.appendChild(r); };
    mk('Форма', [['round', 'Круг'], ['sq', 'Квадрат']], () => G.shape, (v) => { G.shape = v; saveSet(); });
    mk('Режим', [['brush', 'Кисть', 'brush'], ['line', 'Линия', 'line'], ['rect', 'Прямоугольник', 'rect'], ['fill', 'Заливка', 'bucket']], () => G.mode, (v) => { G.mode = v; saveSet(); });
    mk('Рисовать поверх', [[false, 'Только в пустоту'], [true, 'Заменять всё']], () => G.replace, (v) => { G.replace = v; saveSet(); });
    body.appendChild(h('div', 'hint', 'Зажми палец, чтобы лить непрерывно. Линия и прямоугольник — тяни и отпускай. Заливка заполняет пустую область.'));
  }
  let timeUI = null;
  function pWeather(body) {
    const mk = (title, opts, cur, set) => { const r = h('div', 'row'); r.appendChild(h('div', 'lbl', title)); opts.forEach((o) => { const b = btn(o[1], cur() === o[0], '', o[2]); b.onclick = () => { set(o[0]); Snd.sfx('tap'); openPanel('weather', true); updateHud(); }; r.appendChild(b); }); body.appendChild(r); };
    { const dr = btn(dateText(), false, 'wide gold', 'sun'); dr.onclick = () => { closePanel(); calendarModal(); }; const r0 = h('div', 'row'); r0.appendChild(dr); body.appendChild(r0); }
    /* время суток: ползунок и подпись, которая показывает час и часть суток */
    const lab = h('div', 'lbl', ''), sl = h('div', 'sl'), rg = h('input'), val = h('b', '', ''), tr = h('div', 'row');
    rg.type = 'range'; rg.min = 0; rg.max = 1439;
    const showT = () => { const p = Sky.label().split(' · '); lab.textContent = 'Время суток: ' + p[1]; val.textContent = p[0]; };
    rg.oninput = () => { timeUI.drag = true; Sky.set({ time: rg.value / 1440 }); showT(); };
    rg.onchange = () => { timeUI.drag = false; saveSet(); };
    timeUI = { rg, showT: () => { rg.value = Math.round(Sky.time * 1440) % 1440; showT(); }, drag: false }; timeUI.showT();
    sl.append(rg, val); tr.append(lab, sl); body.appendChild(tr);
    mk('Ход времени', SPEEDS, () => G.tcycle ? Sky.Y.daySec : 0, (v) => { if (!v) { G.tcycle = false; Sky.set({ auto: false }); } else { G.tcycle = true; G.dsec = v; Sky.set({ auto: true, dsec: v }); } saveSet(); });
    mk('Длина сезона', SEASON_LEN, () => Sky.Y.slen, (v) => { G.slen = v; Sky.set({ slen: v }); seasonTick(); saveSet(); });
    mk('Погода', [['a', 'Авто', 'sun'], [0, 'Ясно'], [1, 'Дождь', 'cloud'], [2, 'Снег', 'snow'], [3, 'Гроза', 'bolt']], () => G.wauto ? 'a' : G.weather, (v) => { if (v === 'a') { G.wauto = true; wLeft = 0; } else { G.wauto = false; G.weather = Sim.weather = v; if (v === 3) G.stormed = true; } saveSet(); });
    mk('Ветер', [[-1, '← Влево'], [0, 'Штиль'], [1, 'Вправо →']], () => G.wind, (v) => { G.wind = Sim.wind = v; });
    mk('Фон по местности', [['auto', 'Авто'], ['forest', 'Равнины'], ['desert', 'Пустыня'], ['snow', 'Снег'], ['rock', 'Скалы'], ['volcano', 'Вулкан'], ['sea', 'Море'], ['beach', 'Пляж'], ['cave', 'Пещера']], () => G.biome, (v) => { G.biome = v; Sky.set({ lock: v }); saveSet(); });
    body.appendChild(h('div', 'hint', 'Авто: горы и холмы за миром подстраиваются под то, что лежит на земле.'));
  }
  /* ---------- времена года ---------- */
  const SEASON = [
    { n: 'Весна', c: '#6cc86a', t: 14, txt: 'Тает снег, зеленеют деревья, цветут цветы. Частые дожди. Люди сажают семена.' },
    { n: 'Лето', c: '#f6c84e', t: 26, txt: 'Тепло и ясно, изредка грозы. Люди купаются и рыбачат, ходят в лёгкой одежде.' },
    { n: 'Осень', c: '#e0782a', t: 10, txt: 'Листва желтеет и краснеет, моросят дожди. Люди заготавливают дрова и надевают шарфы.' },
    { n: 'Зима', c: '#8ac8f0', t: -1, txt: 'Снегопады, деревья в инее. Люди в шапках, греются у костров и сидят по домам.' }];
  const SEASON_LEN = [[3, '3 дня'], [6, '6 дней'], [12, '12 дней'], [24, '24 дня']];   /* сколько суток длится каждое время года */
  const SPEEDS = [[0, 'Стоит'], [240, 'Обычный'], [80, 'Быстрый'], [24, 'Очень быстрый'], [6, 'Вихрь']];
  const dateText = () => { const Y = Sky.Y; return SEASON[Y.season].n + ' · день ' + (Y.dos + 1) + ' · год ' + Y.year + ' · ' + Math.round(Sky.seasonTemp()) + '°'; };
  const WSEAS = [[.66, .28, 0, .06], [.8, .1, 0, .1], [.62, .32, 0, .06], [.68, 0, .32, 0]];   /* вес: ясно, дождь, снег, гроза — по сезонам; ясно чаще, чтобы мир не заливало водой и снегом */
  let wLeft = .5, seasKey = '';
  function autoWeather(dtMs) {
    if (!G.wauto || G.paused || !Sky.auto) return;
    wLeft -= dtMs * G.speed / (Sky.Y.daySec * 1000);
    if (wLeft > 0) return;
    const w = WSEAS[Sky.Y.season]; let r = Math.random(), k = 0; while (k < 3 && (r -= w[k]) > 0) k++;
    G.weather = Sim.weather = k; if (k === 3) G.stormed = true; wLeft = k === 0 ? .4 + Math.random() * .7 : .06 + Math.random() * .12;
    updateHud();
  }
  /* сезон меняет краски мира, температуру воздуха и значок на кнопке погоды */
  function seasonTick() {
    const Y = Sky.Y, t = Sky.seasonT(), key = Y.season + ':' + Math.round(t * 20);
    if (key !== seasKey) { const prev = seasKey.split(':')[0]; seasKey = key; Render.setSeason(Y.season, t); if (prev !== String(Y.season)) { updateHud(); if (prev !== '' && calEl) calendarModal(true); } }
    const tp = Math.round(Sky.seasonTemp()); if (tp !== AMB) AMB = tp;
  }
  let calEl = false;
  function calendarModal(keep) {
    const Y = Sky.Y; let view = Y.season;
    const w = h('div'); w.className = 'cal'; const hd = h('div', 'phead'); hd.appendChild(h('span', '', 'Календарь · год ' + Y.year)); const x = h('button', 'x'); x.appendChild(img(Icons.ui('close'))); x.onclick = () => { calEl = false; hideModal(); }; hd.appendChild(x); w.appendChild(hd);
    const tabs = h('div', 'row'), grid = h('div', 'dgrid'), info = h('div', 'hint'), sp = h('div', 'row');
    const fill = () => {
      tabs.innerHTML = ''; grid.innerHTML = '';
      SEASON.forEach((q, i) => { const b = btn(q.n, i === view, 'stab'); b.style.setProperty('--sc', q.c); b.onclick = () => { view = i; Snd.sfx('tap'); fill(); }; tabs.appendChild(b); });
      for (let i = 0; i < Y.slen; i++) {
        const cur = view === Y.season && i === Y.dos, past = view < Y.season || (view === Y.season && i < Y.dos), d = h('button', 'day pb' + (cur ? ' cur' : past ? ' past' : ''), String(i + 1));
        d.style.setProperty('--sc', SEASON[view].c);
        d.onclick = () => { Sky.set({ day: (Y.year - 1) * 4 * Y.slen + view * Y.slen + i, time: .3 }); G.time = .3; wLeft = 0; saveSet(); Snd.sfx('tap'); seasonTick(); fill(); };
        grid.appendChild(d);
      }
      info.innerHTML = '<b>' + SEASON[view].n + '</b> · около ' + SEASON[view].t + '°<br>' + SEASON[view].txt;
    };
    SPEEDS.forEach((o) => { const b = btn(o[1], (G.tcycle ? Y.daySec : 0) === o[0], ''); b.onclick = () => { if (!o[0]) { G.tcycle = false; Sky.set({ auto: false }); } else { G.tcycle = true; G.dsec = o[0]; Sky.set({ auto: true, dsec: o[0] }); } saveSet(); Snd.sfx('tap'); calendarModal(true); }; sp.appendChild(b); });
    fill(); w.append(tabs, grid, info, h('div', 'lbl', 'Ход времени'), sp);
    calEl = true; showModal(w);
  }
  function pWorld(body) {
    const col = h('div', 'row'); body.appendChild(col);
    const add = (t, ic, f, cls) => { const b = btn(t, false, 'wide ' + (cls || ''), ic); b.onclick = f; col.appendChild(b); };
    add('Новый остров', 'globe', () => confirmBox('Начать новый остров? Текущий мир пропадёт.', () => { pushUndo(); newWorld('island'); closePanel(); }));
    add('Новое море', 'drop', () => confirmBox('Создать пустое море?', () => { pushUndo(); newWorld('sea'); closePanel(); }));
    add('Пустота', 'eraser', () => confirmBox('Очистить весь мир?', () => { pushUndo(); newWorld('void'); closePanel(); }));
    { const zr = h('div', 'row'); zr.appendChild(h('div', 'lbl', 'Масштаб поля (колесо мыши, щипок двумя пальцами, правая кнопка двигает)')); [['−', () => zoomBtn(1 / 1.5)], ['+', () => zoomBtn(1.5)], ['1×', () => { view.z = 1; view.x = 0; view.y = 0; applyView(); }]].forEach((q) => { const b = btn(q[0], false, ''); b.onclick = () => { q[1](); Snd.sfx('tap'); }; zr.appendChild(b); }); body.appendChild(zr); }
    add('Сохранить в галерею', 'save', () => { closePanel(); galleryModal(true); });
    add('Галерея', 'folder', () => { closePanel(); galleryModal(false); });
    add('Настройки', 'gear', () => openPanel('settings', true));
    add('Главное меню', 'home', () => { closePanel(); showTitle(); });
  }
  function pSettings(body) {
    const mk = (title, opts, cur, set) => { const r = h('div', 'row'); r.appendChild(h('div', 'lbl', title)); opts.forEach((o) => { const b = btn(o[1], cur() === o[0], '', o[2]); b.onclick = () => { set(o[0]); Snd.sfx('tap'); openPanel('settings', true); }; r.appendChild(b); }); body.appendChild(r); };
    mk('Звук', [[true, 'Вкл', 'sound'], [false, 'Выкл', 'mute']], () => G.sound, (v) => { G.sound = v; Snd.on = v; saveSet(); });
    body.appendChild(h('div', 'hint', 'Пикселия — песочница миров. Элементы реагируют друг с другом: пробуй смешивать!'));
  }
  function pGoals(body) {
    const wrap = h('div', 'sage'); const face = h('div', 'face pb'); face.appendChild(img(Icons.ui('sage')));
    const bub = h('div', 'bubble'); wrap.append(face, bub); body.appendChild(wrap);
    if (!G.camp) {
      bub.textContent = 'Сейчас у тебя свободный режим: все элементы открыты. Хочешь цели, награды и открытия — начни Кампанию!';
      const b = btn('Начать кампанию', false, 'gold wide'); const r = h('div', 'row'); r.appendChild(b); body.appendChild(r); b.onclick = () => { closePanel(); startGame(true); };
      return;
    }
    if (prog.finished) { bub.textContent = 'Ты прошёл все дни, мастер! Теперь весь мир открыт — творить можно без границ.'; return; }
    const d = DAYS[prog.day - 1]; bub.textContent = d.say;
    body.appendChild(h('div', 'today', 'ЦЕЛИ ДНЯ ' + prog.day));
    d.goals.forEach((g, i) => { const done = prog.done[prog.day + ':' + i]; const el = h('div', 'goal pb' + (done ? ' done' : '')); const cb = h('div', 'cb'); cb.appendChild(img(Icons.ui('check'))); const tx = h('div', '', '<b>' + g.t + '</b><small>' + g.h + '</small>'); el.append(cb, tx); body.appendChild(el); });
    body.appendChild(h('div', 'hint', 'Награда: ' + d.unl.filter(exists).map(nameOf).join(', ')));
  }

  /* ---------- окна ---------- */
  const modal = $('#modal');
  function showModal(node) { modal.innerHTML = ''; const box = h('div', 'box pb gold'); box.appendChild(node); modal.appendChild(box); modal.classList.add('on'); }
  function hideModal() { modal.classList.remove('on'); modal.innerHTML = ''; }
  modal.addEventListener('pointerdown', (e) => { if (e.target === modal) hideModal(); });
  function confirmBox(text, yes) {
    const w = h('div'); w.appendChild(h('div', 'hint', text)); const r = h('div', 'row'); const a = btn('Да', false, 'gold'), b = btn('Отмена');
    a.onclick = () => { hideModal(); yes(); }; b.onclick = hideModal; r.append(a, b); w.appendChild(r); showModal(w);
  }
  function toast(msg, good) { const t = h('div', 'toast pb' + (good ? ' good' : ''), msg); $('#toast').appendChild(t); setTimeout(() => t.remove(), 2900); while ($('#toast').children.length > 3) $('#toast').firstChild.remove(); }
  function galleryModal(saving) {
    const w = h('div'); const hd = h('div', 'phead'); hd.appendChild(h('span', '', saving ? 'Сохранить мир' : 'Галерея')); const x = h('button', 'x'); x.appendChild(img(Icons.ui('close'))); x.onclick = hideModal; hd.appendChild(x); w.appendChild(hd);
    const grid = h('div', 'gal pbody'); w.appendChild(grid);
    const fill = () => {
      grid.innerHTML = ''; const slots = store.get('gal', []);
      for (let i = 0; i < 6; i++) {
        const s = slots[i]; const el = h('div', 'gslot pb');
        if (s) { const im = new Image(); im.src = s.thumb; el.appendChild(im); el.appendChild(h('div', 'nm', s.name)); } else { el.appendChild(h('div', 'empty', 'Пусто')); el.appendChild(h('div', 'nm', 'Слот ' + (i + 1))); }
        const acts = h('div', 'acts');
        if (saving) { const b = btn('Сюда', false, 'gold'); b.onclick = () => { saveSlot(i); fill(); }; acts.appendChild(b); }
        else if (s) { const b = btn('Открыть', false, 'gold'); b.onclick = () => { try { pushUndo(); loadPack(s.data); Sim.weather = G.weather = 0; hideModal(); startGame(G.camp, true); toast('Мир загружен', true); } catch (e) { toast('Не удалось открыть'); } }; acts.appendChild(b); }
        if (s) { const d = btn('✕', false, 'red'); d.onclick = () => { const a = store.get('gal', []); a[i] = null; store.set('gal', a); fill(); }; acts.appendChild(d); }
        el.appendChild(acts); grid.appendChild(el);
      }
    };
    fill(); showModal(w);
  }
  function saveSlot(i) {
    try {
      const c = Render.snapshot(192, Math.round(192 * H / W)); const slots = store.get('gal', []);
      const d = new Date(); slots[i] = { name: 'Мир ' + d.getDate() + '.' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + ' ' + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(), thumb: c.toDataURL('image/png'), data: Sim.pack() };
      for (let k = 0; k < 6; k++) if (!slots[k]) slots[k] = null;
      if (!store.set('gal', slots)) toast('Не хватило места в памяти'); else { toast('Сохранено в галерею', true); Snd.sfx('ok'); }
    } catch (e) { toast('Не удалось сохранить'); }
  }

  /* ---------- ввод и рисование ---------- */
  const ptr = { down: false, x: 0, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, held: 0, type: 'mouse', inside: false };
  function cellOf(e) { const r = field.getBoundingClientRect(); return [Math.max(0, Math.min(W - 1, ((e.clientX - r.left) / r.width * W) | 0)), Math.max(0, Math.min(H - 1, ((e.clientY - r.top) / r.height * H) | 0))]; }
  function showRing(e, keep) {
    if (e) { const r = field.getBoundingClientRect(); ring.style.left = ((e.clientX - r.left) / view.z) + 'px'; ring.style.top = ((e.clientY - r.top) / view.z) + 'px'; }
    const d = ((SEEDS.indexOf(E[G.sel]) >= 0 ? 0 : G.size) * 2 + 1) * cs; ring.style.width = d + 'px'; ring.style.height = d + 'px'; ring.classList.toggle('sq', G.shape === 'sq');
    const show = !isTool(G.sel) || ['ERASE', 'HEAT', 'COLD', 'WIND'].indexOf(G.sel.slice(2)) >= 0;
    ring.style.display = (keep && !ptr.inside) ? 'none' : (show ? 'block' : 'none');
  }
  /* семена всегда ложатся по одному, какой бы ни была кисть: тап — одно семечко, мазок — семечко через каждые несколько клеток, удержание — по семечку в секунду */
  const SEEDS = [E.SEED, E.CONE, E.FSEED]; let sowAt = null;
  function sow(x, y, id, first) {
    if (first) sowAt = null;
    if (sowAt) { if (Math.hypot(x - sowAt.x, y - sowAt.y) < 4 && !(ptr.held > 0 && ptr.held % 30 === 0)) return; }
    const i = y * W + x, t = Sim.A.type[i];
    if (t === AIR || (G.replace && t !== WALL && t !== SKY)) { Sim.put(i, id); sowAt = { x, y }; }
  }
  function stamp(x, y, first) {
    const k = G.sel, sq = G.shape === 'sq';
    if (isTool(k)) {
      const t = k.slice(2);
      if (t === 'ERASE') Sim.paint(x, y, G.size, 0, sq, true, 1);
      else if (t === 'CHILD') { if (first || ptr.held % 36 === 0) Sim.spawnEnt(x, y, false, People.randomForm(), null, { kid: true }); }
      else if (t === 'LIGHTNING') { if (first || ptr.held % 28 === 0) Sim.lightning(x); }
      else if (t === 'METEOR') { if (first || ptr.held % 40 === 0) { const vx = (Math.random() < .5 ? -1 : 1) * (1 + Math.random() * .6), vy = 2; const x0 = x - vx * (y / vy); Sim.meteor(Math.max(3, Math.min(W - 4, x0)), vx > 0 ? 1 : -1, vx); } }
      else if (t === 'BLAST') { if (first || ptr.held % 22 === 0) Sim.blast(x, y, 3 + G.size, .9); }
      else if (t === 'HUMAN' || t === 'ZOMBIE' || TOOLS[t].form) { if (first || ptr.held % 36 === 0) { const f = TOOLS[t].form || People.randomForm(), F = People.FORMS[f]; Sim.spawnEnt(x, y, t === 'ZOMBIE', f, F && F.abil); } }
      else if (t === 'HEAT') Sim.heatArea(x, y, G.size, 90);
      else if (t === 'COLD') Sim.heatArea(x, y, G.size, -90);
      else if (t === 'WIND') { Sim.pushArea(x, y, G.size + 2, ptr.x - ptr.lx, ptr.y - ptr.ly); }
      return;
    }
    const id = E[k];
    if (SEEDS.indexOf(id) >= 0) { sow(x, y, id, first); return; }
    const solid = KIND[id] === K.SOLID || KIND[id] === K.SPEC;
    const dens = (solid || G.size <= 1) ? 1 : .55;
    Sim.paint(x, y, G.size, id, sq, G.replace, dens);
  }
  function strokeLine(x0, y0, x1, y1, fn) {
    const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)), stepSz = Math.max(1, Math.floor(G.size * .8));
    for (let s = 0; s <= n; s += stepSz) { const t = n ? s / n : 0; fn(Math.round(x0 + dx * t), Math.round(y0 + dy * t)); }
    fn(x1, y1);
  }
  function floodFill(x, y) {
    const A = Sim.A, t = A.type, st = y * W + x; if (t[st] !== AIR) { toast('Заливка работает в пустоте'); return; }
    const id = E[G.sel]; if (id === undefined) return; const q = [st], seen = new Set([st]); let n = 0;
    while (q.length && n < 14000) { const c = q.pop(); if (t[c] !== AIR) continue; Sim.put(c, id); n++; for (const d of [-1, 1, -W, W]) { const m = c + d; if (!seen.has(m) && m > W && m < W * (H - 1) && t[m] === AIR) { seen.add(m); q.push(m); } } }
  }
  function previewShape(x0, y0, x1, y1) {
    fxc.clearRect(0, 0, W, H); fxc.fillStyle = 'rgba(255,255,255,.55)';
    if (G.mode === 'line') strokeLine(x0, y0, x1, y1, (x, y) => fxc.fillRect(x - G.size, y - G.size, G.size * 2 + 1, G.size * 2 + 1));
    else fxc.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) + 1, Math.abs(y1 - y0) + 1);
  }
  function commitShape(x0, y0, x1, y1) {
    fxc.clearRect(0, 0, W, H);
    if (G.mode === 'line') strokeLine(x0, y0, x1, y1, (x, y) => stamp(x, y, true));
    else { const id = isTool(G.sel) ? 0 : E[G.sel]; for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { if (x < 1 || x >= W - 1 || y < 1 || y >= H - 1) continue; const i = y * W + x, cur = Sim.A.type[i]; if (G.sel === 't:ERASE') { if (cur !== WALL && cur !== SKY) Sim.put(i, 0); } else if (id && (cur === AIR || G.replace)) Sim.put(i, id); } }
  }
  const { AIR, WALL, SKY } = E;
  field.addEventListener('pointerdown', (e) => {
    if (title.classList.contains('hide') === false) return;
    if (e.pointerType === 'touch') { tp.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (tp.size === 2) { ptr.down = false; fxc.clearRect(0, 0, W, H); pinch = pinchState(); try { field.setPointerCapture(e.pointerId); } catch (er) { }; e.preventDefault(); return; } }
    /* инструмент «Люди» и нажали прямо на человечка: короткое нажатие ставит нового, долгое (полсекунды) открывает карточку */
    if (e.button !== 2 && personTool()) { const who = personAt(e); if (who) { const [cx0, cy0] = cellOf(e); lp = { x: cx0, y: cy0, cx: e.clientX, cy: e.clientY, who }; clearTimeout(lpT); lpT = setTimeout(() => { if (lp) { const o = lp.who; lp = null; Snd.sfx('pop'); openPerson(o); } }, 480); e.preventDefault(); return; } }
    if (e.button === 2) { panning = { x: e.clientX, y: e.clientY }; try { field.setPointerCapture(e.pointerId); } catch (er) { }; e.preventDefault(); return; }
    Snd.init(); Snd.resume(); try { field.setPointerCapture(e.pointerId); } catch (er) { }; const [x, y] = cellOf(e);
    ptr.down = true; ptr.type = e.pointerType; ptr.x = ptr.lx = ptr.sx = x; ptr.y = ptr.ly = ptr.sy = y; ptr.held = 0; ptr.inside = true;
    if (openedPanel) closePanel();
    pushUndo();
    const shape = (G.mode === 'line' || G.mode === 'rect') && !isTool(G.sel) || (G.mode === 'line' || G.mode === 'rect') && G.sel === 't:ERASE';
    if (G.mode === 'fill' && !isTool(G.sel)) floodFill(x, y); else if (!shape) stamp(x, y, true);
    showRing(e); e.preventDefault();
  });
  field.addEventListener('pointermove', (e) => {
    if (panning) { view.x += e.clientX - panning.x; view.y += e.clientY - panning.y; panning.x = e.clientX; panning.y = e.clientY; applyView(); return; }
    if (tp.has(e.pointerId)) { tp.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pinch && tp.size >= 2) { const n = pinchState(); zoomAt(n.cx, n.cy, n.d / pinch.d); view.x += n.cx - pinch.cx; view.y += n.cy - pinch.cy; applyView(); pinch = n; return; } }
    const [x, y] = cellOf(e); ptr.inside = true; ptr.lx = ptr.x; ptr.ly = ptr.y; ptr.x = x; ptr.y = y;
    if (e.pointerType === 'mouse' || ptr.down) showRing(e);
    if (ptr.down) {
      if (G.mode === 'line' || G.mode === 'rect') { if (!isTool(G.sel) || G.sel === 't:ERASE') previewShape(ptr.sx, ptr.sy, x, y); }
      else if (G.mode === 'brush' || isTool(G.sel)) { if (!isTool(G.sel) || ['ERASE', 'HEAT', 'COLD'].indexOf(G.sel.slice(2)) >= 0) strokeLine(ptr.lx, ptr.ly, x, y, (a, b) => stamp(a, b, false)); }
    }
  });
  const endStroke = (e) => {
    tp.delete(e.pointerId); if (tp.size < 2) pinch = null; if (panning && e.button !== undefined) panning = null;
    /* короткое нажатие на человечка инструментом «Люди» — просто ставим нового */
    if (lp) { clearTimeout(lpT); const q = lp; lp = null; if (openedPanel) closePanel(); pushUndo(); stamp(q.x, q.y, true); return; }
    if (!ptr.down) return; ptr.down = false;
    if ((G.mode === 'line' || G.mode === 'rect') && (!isTool(G.sel) || G.sel === 't:ERASE')) { const [x, y] = cellOf(e); commitShape(ptr.sx, ptr.sy, x, y); }
    if (e.pointerType !== 'mouse') ring.style.display = 'none';
  };
  field.addEventListener('pointerup', endStroke); field.addEventListener('pointercancel', endStroke);
  field.addEventListener('pointerleave', () => { ptr.inside = false; if (!ptr.down) ring.style.display = 'none'; });
  field.addEventListener('contextmenu', (e) => e.preventDefault());

  /* ---------- заставка ---------- */
  const title = $('#title');
  const TIPS = ['Хочешь построить мир? Начнём с песка!', 'Земля и вода — это грязь. А грязь — это жизнь!', 'Поджигай осторожно: огонь любит деревья.', 'Молния плавит песок в стекло. Проверим?', 'Семя у воды вырастет в дерево.', 'Соль топит лёд. Разве ты не знал?'];
  function buildTitle() {
    title.innerHTML = '';
    const logo = h('div', 'logo'); logo.innerHTML = '<span class="o">ПИКСЕЛИЯ</span><span class="f">ПИКСЕЛИЯ</span>';
    const sub = h('div', 'sub', 'песочница миров');
    const top = h('div'); top.style.textAlign = 'center'; top.append(logo, sub);
    const hero = h('div'); hero.id = 'hero'; const bub = h('div', 'bubble'); bub.id = 'tbubble'; bub.textContent = TIPS[(Math.random() * TIPS.length) | 0];
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 24; const c = cv.getContext('2d');
    const cloud = ['...........wwww...........', '.....wwww.wWWWWw.wwww.....', '...wwWWWWwwWWWWWWwWWWWww..', '.wwWWWWWWWWWWWWWWWWWWWWWw.', 'wWWWWWWWWWWWWWWWWWWWWWWWWw', '.wwwwwwwwwwwwwwwwwwwwwwww.'];
    for (let y = 0; y < cloud.length; y++) for (let x = 0; x < cloud[y].length; x++) { const ch = cloud[y][x]; if (ch === '.') continue; c.fillStyle = ch === 'w' ? '#ffffff' : '#c4d6ff'; c.fillRect(x + 3, y + 14, 1, 1); }
    const sg = new Image(); sg.onload = () => { c.imageSmoothingEnabled = false; c.drawImage(sg, 10, 1, 12, 12); }; sg.src = Icons.ui('sage');
    hero.append(bub, cv);
    const menu = h('div', 'menu');
    const mb = (txt, ic, sm, f, cls) => { const b = h('button', 'btn pb ' + (cls || '')); b.appendChild(img(Icons.ui(ic))); b.appendChild(document.createTextNode(txt)); if (sm) b.appendChild(h('small', '', sm)); b.onclick = () => { Snd.init(); Snd.resume(); Snd.sfx('tap'); f(); }; menu.appendChild(b); };
    mb('Свободный режим', 'pencil', '', () => startGame(false), 'gold');
    mb('Галерея', 'folder', '', () => { galleryModal(false); });
    const tb = h('div', 'tbar'); const snd = h('button', 'mini pb'); const sIc = img(Icons.ui(G.sound ? 'sound' : 'mute')); snd.appendChild(sIc);
    snd.onclick = () => { G.sound = !G.sound; Snd.on = G.sound; sIc.src = Icons.ui(G.sound ? 'sound' : 'mute'); saveSet(); Snd.init(); };
    tb.appendChild(snd); const bottom = h('div'); bottom.style.cssText = 'display:flex;flex-direction:column;align-items:center'; bottom.append(menu, tb);
    title.append(top, hero, bottom);
  }
  let titleTimer = 0;
  function showTitle() { buildTitle(); title.classList.remove('hide'); $('#app').classList.add('intitle'); autosave(); }
  /* игра всегда начинается с пустой карты; из главного меню в тот же режим возвращаемся в тот же мир, смена режима начинает с пустоты */
  let lastMode = null;
  function startGame(camp, keepWorld) {
    G.camp = !!camp; title.classList.add('hide'); $('#app').classList.remove('intitle'); hideModal();
    if (!keepWorld && lastMode !== !!camp) { newWorld('void'); undoStack.length = 0; }
    lastMode = !!camp;
    if (camp && !prog.unlocked) prog.unlocked = ['EARTH', 'WATER', 'STONE'];
    if (camp && prog.unlocked.indexOf(G.sel) < 0 && !isTool(G.sel)) select(prog.unlocked[1] || 'WATER', true);
    updateHud(); renderBar(); closePanel();
    if (camp && !prog.finished) setTimeout(() => openPanel('goals', true), 500);
    else if (!camp) toast('Выбери элемент внизу и води пальцем по миру');
  }
  function autosave() {
    if (title && !title.classList.contains('hide') && !G.dirty) { /* заставка: сохраняем как есть */ }
    try { saveSet(); } catch (e) { }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) autosave(); });
  setInterval(() => { if (!document.hidden && title.classList.contains('hide')) autosave(); }, 20000);

  /* ---------- главный цикл ---------- */
  let last = performance.now(), acc = 0, frameN = 0;
  Sim.sfx = (n, v) => Snd.sfx(n, v);
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(100, now - last); last = now;
    if (!G.paused) { acc += dt * G.speed; Sky.advance(dt * G.speed); autoWeather(dt); } const stepMs = 1000 / 60; let n = 0;
    while (acc >= stepMs && n < 5) { Sim.step(); acc -= stepMs; n++; } if (n === 5) acc = 0;
    if (ptr.down && !G.paused || (ptr.down && G.paused)) { ptr.held++; if (G.mode === 'brush' || isTool(G.sel)) { if (G.sel !== 't:WIND' && !(isTool(G.sel) && G.sel.slice(2) === 'METEOR' && ptr.held % 40)) stamp(ptr.x, ptr.y, false); } }
    Render.draw(Sim);
    const sh = Sim.shake; { const t = sh > .3 ? 'translate(' + ((Math.random() - .5) * sh * cs * .5).toFixed(1) + 'px,' + ((Math.random() - .5) * sh * cs * .5).toFixed(1) + 'px)' : ''; if (t !== shakeT) { shakeT = t; applyView(); } }
    $('#flash').style.opacity = Sim.bolts.length ? (Math.max.apply(null, Sim.bolts.map((b) => b.ttl)) / 8 * .22).toFixed(2) : 0;
    frameN++;
    if (frameN % 6 === 0) { Snd.update(Sim.act, Sim.weather); Sim.act.p = Sim.act.l = Sim.act.f = 0; }
    Sim.tod = Sky.time;
    if (cardEnt) { if (Sim.ents.indexOf(cardEnt) < 0) closeCard(); else { if (frameN % 6 === 0) cardText(); placeCard(); } }
    if (frameN % 45 === 0) checkGoals();
    if (frameN % 30 === 0) pvTick();
    if (frameN % 20 === 0) seasonTick();
    if (frameN % 20 === 0 && openedPanel === 'weather' && timeUI && !timeUI.drag) timeUI.showT();
    if (!title.classList.contains('hide')) { titleTimer++; if (titleTimer % 420 === 200) Sim.lightning(Math.floor(W * (.15 + Math.random() * .7))); }
  }
  let rzT = 0; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => layout(false), 220); });
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { G.paused = !G.paused; updateHud(); e.preventDefault(); }
    else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) undo();
    else if (e.key === '[') { G.size = Math.max(1, G.size - 1); showRing(null); }
    else if (e.key === ']') { G.size = Math.min(14, G.size + 1); showRing(null); }
    else if (e.key === 'e') toggleErase();
  });

  /* ---------- старт ---------- */
  /* ветка с осенними листьями для углов панелей (раньше — зелёная лоза из Icons.vine) */
  document.documentElement.style.setProperty('--vine', 'url(' + ((UIA.deco && UIA.deco.branch) || Icons.vine()) + ')');
  stage.style.backgroundImage = 'url(' + rockTile() + ')'; stage.style.backgroundSize = '144px 144px'; stage.style.imageRendering = 'pixelated';
  Snd.on = G.sound;
  if (typeof Town !== 'undefined') Town.onNote = (t) => { if (title.classList.contains('hide')) toast(t); };
  Sky.set({ time: G.time, auto: G.tcycle, lock: G.biome, slen: G.slen, day: G.sday, dsec: G.dsec });
  layout(true); newWorld('void'); seasonTick();
  if (!exists(G.sel)) G.sel = 'WATER';
  renderBar(); updateHud(); buildTitle(); $('#app').classList.add('intitle'); fixK(document.body);
  if (window.Telegram && Telegram.WebApp) { try { Telegram.WebApp.ready(); Telegram.WebApp.expand(); } catch (e) { } }
  requestAnimationFrame(loop);
  window.Pixelia = { G, Sim, Render, Sky, People, select, openPanel, startGame, toast, prog, checkGoals, layout, DAYS };
})();
