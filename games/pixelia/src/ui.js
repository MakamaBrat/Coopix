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
  const G = Object.assign({ sel: 'WATER', size: 3, shape: 'round', mode: 'brush', replace: false, paused: false, speed: 1, lens: false, cs: 0, sound: true, time: .3, tcycle: true, biome: 'auto', sday: 12, dsec: 240, slen: 2, wauto: true, hot: [], lastEl: {}, weather: 0, wind: 0, cat: 1 }, store.get('set', {}));
  if (!G.cal3) { G.slen = 3; G.cal3 = 1; }   /* календарь: по умолчанию сезон — 3 дня */
  if (!G.lastEl || typeof G.lastEl !== 'object') G.lastEl = {};
  /* старые сохранения хранили тему неба: переводим в время суток */
  { const sv = store.get('set', {}); if (sv.time === undefined && sv.theme) { G.time = { night: .02, day: .5, dusk: .74, cave: .3 }[sv.theme] || .3; if (sv.theme === 'cave') G.biome = 'cave'; } }
  /* человечек всегда под рукой на нижней полке */
  G.paused = false; G.lens = false; G.weather = 0; G.wind = 0; G.camp = false;
  let prog = store.get('prog', null) || { day: 1, unlocked: ['EARTH', 'WATER', 'STONE', 't:HUMAN'], done: {}, finished: false };
  const saveSet = () => store.set('set', { sel: G.sel, size: G.size, shape: G.shape, mode: G.mode, replace: G.replace, speed: 1, cs: G.cs, sound: G.sound, time: Sky.time, tcycle: G.tcycle, biome: G.biome, sday: Sky.day, dsec: Sky.Y.daySec, slen: Sky.Y.slen, cal3: 1, cal2: 1, wauto: G.wauto, lastEl: G.lastEl, cat: G.cat });
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
  const iconOf = (k) => k === 't:HUMAN' || k === 't:ZOMBIE' || k === 't:CHILD' ? People.icon('ref', k === 't:ZOMBIE') : formOf(k) ? People.icon(formOf(k)) : isTool(k) ? (UIA.icon[k] || (typeof Arms !== 'undefined' && Arms.icon(k.slice(2))) || Icons.ui(TOOL_ICON[k.slice(2)])) : Icons.el(k);
  const img = (src, cls) => Icons.img(src, cls);
  const catIcon = (c) => UIA.icon['cat:' + c.icon] || ({ pile: Icons.el('SAND'), drop: Icons.el('WATER'), puff: Icons.el('STEAM'), block: Icons.el('STONE'), seed: Icons.el('SEED'), bulb: Icons.el('LAMP'), bolt: Icons.ui('bolt'), people: People.icon('ref'), costumes: People.icon('king') })[c.icon];

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
    /* поле всегда закрывает сцену целиком (без пустых полос): клетка — целое число физических пикселей,
       клеток примерно CELLS (не больше 1,6×), край обрезается меньше чем на клетку.
       На вертикальном телефоне мир шире экрана (как альбомный), по нему водят пальцем «Рукой» или двумя пальцами. */
    const dpr = window.devicePixelRatio || 1, sw = Math.max(120, stage.clientWidth), sh = Math.max(120, stage.clientHeight);   /* clientWidth — без учёта трансформаций */
    const wide = sw < sh * .9, vw = wide ? sh * 1.35 : sw;
    let sc = Math.max(1, Math.round(Math.sqrt(vw * sh * dpr * dpr / CELLS)));
    while (Math.ceil(vw * dpr / sc) * Math.ceil(sh * dpr / sc) > CELLS * 1.6) sc++;
    return { c: sc / dpr, w: Math.max(60, Math.ceil(vw * dpr / sc)), h: Math.max(40, Math.ceil(sh * dpr / sc)), wide };
  }
  /* ---------- зум и сдвиг поля: колесо, щипок двумя пальцами, правая кнопка, кнопки в панели «Мир» ---------- */
  const view = { z: 1, x: 0, y: 0 }; let shakeT = '';
  function clampView() {
    const hw = W * cs / 2, hh = H * cs / 2; view.z = Math.max(1, Math.min(8, view.z));
    const sw = stage.clientWidth || 0, sh = stage.clientHeight || 0;   /* край мира никогда не заходит внутрь экрана — нет пустых полос */
    const mx = Math.max(0, hw * view.z - sw / 2), my = Math.max(0, hh * view.z - sh / 2); view.x = Math.max(-mx, Math.min(mx, view.x)); view.y = Math.max(-my, Math.min(my, view.y));
  }
  function applyView() { clampView(); field.style.transform = (view.z === 1 && !view.x && !view.y ? '' : 'translate(' + view.x.toFixed(1) + 'px,' + view.y.toFixed(1) + 'px) scale(' + view.z.toFixed(3) + ') ') + shakeT; field.style.transformOrigin = 'center'; }
  function zoomAt(cx, cy, k) {
    const st = stage.getBoundingClientRect(), z0 = view.z, z2 = Math.max(1, Math.min(8, z0 * k)), ux = cx - (st.left + st.width / 2) - view.x, uy = cy - (st.top + st.height / 2) - view.y;
    view.x += ux * (1 - z2 / z0); view.y += uy * (1 - z2 / z0); view.z = z2; applyView(); showRing(null, true);
  }
  function zoomBtn(k) { const st = stage.getBoundingClientRect(); zoomAt(st.left + st.width / 2, st.top + st.height / 2, k); }
  stage.addEventListener('wheel', (e) => {
    e.preventDefault(); if (followId != null) setFollow(null);
    const pad = !e.ctrlKey && e.deltaMode === 0 && (Math.abs(e.deltaX) > .5 || (Math.abs(e.deltaY) < 40 && e.deltaY % 1 !== 0));
    if (pad) { view.x -= e.deltaX; view.y -= e.deltaY; applyView(); return; }   /* тачпад: два пальца двигают мир */
    const k = e.ctrlKey ? Math.exp(-e.deltaY * .01) : (e.deltaY < 0 ? 1.18 : 1 / 1.18); zoomAt(e.clientX, e.clientY, k);
  }, { passive: false });
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
  function personAt(e, wide) {
    const [x, y] = cellOf(e); let best = null, bd = 1e9; const tol = wide ? Math.max(4, 22 / (cs * view.z)) : 2.5;
    for (const o of Sim.ents) { if (o.z) continue; const dx = Math.abs(o.x - x), dy = y - o.y; if (dx > tol || dy > (wide ? 4 : 1) || dy < (o.dead ? -4 : -13)) continue; const d = dx + Math.abs(dy + (o.dead ? 2 : 6)) * .3; if (d < bd) { bd = d; best = o; } }
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
    { const ds = document.documentElement.style; ds.setProperty('--hudh', (hud.offsetTop + hud.offsetHeight) + 'px'); ds.setProperty('--barh', Math.max(0, window.innerHeight - bar.offsetTop) + 'px'); }
    if (g.wide && first && !G.wideTip) { G.wideTip = 1; setTimeout(() => toast('Мир шире экрана: двигай его «Рукой» сверху или двумя пальцами'), 1600); }   /* целиком в сцене, даже если она уменьшилась */
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
    if (typeof Arms !== 'undefined') Arms.list.length = 0;
    if (typeof Town !== 'undefined') Town.clear();
    Sim.generate(kind, { plain: G.camp && prog.day === 1 && !prog.finished });
    Sim.stats.blasts = Sim.stats.lightning = Sim.stats.meteors = 0;
    G.weather = Sim.weather = 0; Sim.wind = G.wind = 0; undoStack.length = 0;
  }

  /* ---------- вкладки интерфейса ---------- */
  const hud = $('#hud'), bar = $('#bar'), panel = $('#panel');
  const slotDefs = [
    { id: 'mv', icon: () => Icons.ui('hand'), act: () => { G.panMode = !G.panMode; zoomCtl.style.display = G.panMode ? 'flex' : 'none'; if (openedPanel) closePanel(); updateHud(); toast(G.panMode ? 'Рука: двигай мир пальцем, щипок или колесо — приблизить' : 'Рука выключена — снова рисуешь'); } },
    { id: 'br', icon: () => Icons.ui(MODE_ICON[G.mode] || 'brush'), act: () => { G.panMode = false; zoomCtl.style.display = 'none'; openPanel('brush'); } },
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
    slotEls.er.classList.toggle('on', G.sel === 't:ERASE'); slotEls.mv.classList.toggle('on', !!G.panMode);
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
    if (G.panMode) { G.panMode = false; const z = document.querySelector('.zoomctl'); if (z) z.style.display = 'none'; }   /* выбрал материал — рука выключается */
    G.sel = k; const ci = catIdx(k); if (ci >= 0) { G.lastEl[CATS[ci].id] = k; G.cat = ci; }
    saveSet(); renderBar(); updateHud(); if (!quiet) Snd.sfx('pop');
  }
  /* нижняя панель: недавние элементы */
  const undoStack = []; let speeds = [1, 5], spIdx = 0;   /* два режима времени: обычный и ускоренный ×5 */
  /* нижняя панель — только типы: на каждой кнопке последний выбранный элемент этого типа. Нажатие выбирает его, повторное нажатие или долгое удержание открывает список типа */
  const catIdx = (k) => CATS.findIndex((c) => c.els.indexOf(k) >= 0);
  function lastOf(c) {
    const k = G.lastEl[c.id]; if (k && c.els.indexOf(k) >= 0 && exists(k) && isUnlocked(k)) return k;
    return c.els.find((e) => exists(e) && isUnlocked(e)) || c.els.find(exists);
  }
  function openCat(i) { G.cat = i; saveSet(); openPanel('elements', true); }
  function tapCat(i) {
    const c = CATS[i], k = lastOf(c); if (!k) return;
    if (!isUnlocked(k)) { toast(lockHint(k)); Snd.sfx('nope'); return; }
    select(k); if (openedPanel === 'elements') closePanel();
  }
  let barInit = false;
  function renderBar() {
    bar.innerHTML = '';
    if (!barInit) { barInit = true; const ci = catIdx(G.sel); if (ci >= 0) G.cat = ci; }   /* при старте ряд показывает группу выбранного элемента */
    /* верхний ряд: все элементы выбранной группы — выбрать одним касанием; долгое касание — подсказка */
    const strip = h('div', 'strip'), cat = CATS[G.cat] || CATS[0];
    cat.els.filter(exists).forEach((k) => {
      const lock = !isUnlocked(k), b = h('button', 'sitem' + (k === G.sel ? ' on' : '') + (lock ? ' lock' : '')); b.title = nameOf(k);
      b.appendChild(img(iconOf(k), 'el')); b.appendChild(h('span', '', nameOf(k)));
      let t = 0, long = false;
      b.onpointerdown = () => { long = false; clearTimeout(t); t = setTimeout(() => { long = true; toast(nameOf(k) + ': ' + (lock ? lockHint(k) : (hintOf(k) || ''))); }, 450); };
      b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(t);
      b.onclick = () => { if (long) { long = false; return; } Snd.init(); Snd.resume(); if (lock) { toast(lockHint(k)); Snd.sfx('nope'); return; } Snd.sfx('tap'); select(k); renderBar(); };
      strip.appendChild(b);
    });
    const row = h('div', 'catrow'); bar.appendChild(row); bar.appendChild(strip);   /* сверху — группы, снизу — элементы выбранной группы */
    CATS.forEach((c, i) => {
      const k = lastOf(c); if (!k) return;
      const b = h('button', 'hot pb' + (i === G.cat ? ' on' : '')); b.dataset.i = i; b.appendChild(img(iconOf(k), 'el')); b.appendChild(h('span', '', c.name));
      let t = 0, long = false;
      b.onpointerdown = () => { long = false; clearTimeout(t); t = setTimeout(() => { long = true; Snd.init(); Snd.resume(); Snd.sfx('tap'); openCat(i); }, 450); };
      b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(t);
      b.onclick = () => { if (long) { long = false; return; } Snd.init(); Snd.resume(); Snd.sfx('tap'); G.cat = i; saveSet(); tapCat(i); renderBar(); };
      row.appendChild(b);
    });
    updateHud();
  }
  /* отмена возвращает мир целиком: клетки и жителей (кто погиб после этого действия — снова жив, стоит там же) */
  const entSnap = () => Sim.ents.map((e) => ({ ref: e, data: JSON.stringify(e, (k, v) => (k && k[0] === '_') || typeof v === 'function' ? undefined : v) }));
  function undo() {
    if (!undoStack.length) { toast('Отменять нечего'); return; }
    const d = undoStack.pop(), cur = Sim.ents.slice();
    const back = d.ents ? d.ents.filter((it) => (it.ref.dying || it.ref.dead || cur.indexOf(it.ref) < 0) && !JSON.parse(it.data).dying).length : 0;
    loadPack(d.cells || d);   /* (загрузка клеток очищает список жителей — ниже он восстанавливается) */
    if (d.ents) {
      Sim.ents.length = 0;
      for (const it of d.ents) { const e = it.ref, data = JSON.parse(it.data); for (const k of Object.keys(e)) if (!(k in data) && k[0] !== '_') delete e[k]; Object.assign(e, data); e.ry = e.y; Sim.ents.push(e); }
      if (back) toast(back === 1 ? 'Отменено: житель снова жив' : 'Отменено: ' + back + (back % 10 >= 2 && back % 10 <= 4 && (back % 100 < 12 || back % 100 > 14) ? ' жителя' : ' жителей') + ' снова живы');
    }
    Snd.sfx('tap');
  }
  function pushUndo() { undoStack.push({ cells: Sim.pack(), ents: entSnap() }); if (undoStack.length > 8) undoStack.shift(); }
  function loadPack(d) { Sim.unpack(d, W, H); }

  /* ---------- жители: список с фильтрами, карточка жителя (обзор и отношения), общества, летопись ----------
     Значки — из листа people_icons.png (UIA.pi). Панель не пересобирается сама: раз в полсекунды обновляются только
     числа, полоски и значки занятий (pvLive). Перерисовка целиком — при смене состава и не раньше 1,5 с после касания.
     «Следить»: камера приближает и ведёт выбранного человечка (follow), сверху стоит плашка с его именем. */
  const pv = { tab: 'list', sel: null, sub: 'info', rf: 'all', strangers: false, flt: 'all', fold: {}, sopen: {} };
  let pvLive = [], pvSig = '', pvTouch = 0, pvOrder = [], followId = null;
  const PI = (k) => (UIA.pi && UIA.pi[k]) || '';
  const icon = (k, cls) => { const i = img(PI(k), 'pi ' + (cls || '')); return i; };
  const PROF_ICON = { pirate: 'a_fish', lumber: 'p_lumber', mason: 'p_mason', builder: 'p_builder', fisher: 'p_fisher', farmer: 'p_farmer', trader: 'p_bow', priest: 'p_priest', scholar: 'p_scholar', barkeep: 'p_barkeep', crafter: 'p_crafter', none: 'p_none' };
  const TASK_ICON = { sleep: 'a_sleep', camp: 'a_fire', fire: 'a_fire', house: 'build', build: 'build', chat: 'a_talk', together: 'a_love', wed: 'a_love', rest: 'smile', wander: 'a_run', play: 'a_run', follow: 'a_run', mourn: 'm_sad', bury: 'm_sad', quarrel: 'm_angry', sulk: 'm_sad',
    preach: 'p_priest', pray: 'p_priest', study: 'a_read', read: 'a_read', learn: 'grad', drink: 'a_music', serve: 'a_music', craft: 'a_craft', trade: 'a_talk', work: 'build', quarry: 'a_quarry', shaft: 'a_quarry', climb: 'a_run', dockwork: 'build', exercise: 'health', eat: 'a_eat', visit: 'a_talk', dance: 'a_music', stars: 'star', tag: 'a_run', explore: 'search', water: 'drop', forage: 'food', repair: 'build', gawk: 'search', shelter: 'house', chop: 'a_chop', fish: 'a_fish', sow: 'a_sow', swim: 'drop', arm: 'sword', fight: 'sword', hearth: 'a_fire' };
  const taskIcon = (e) => e.dying ? 'm_sad' : e.burn > 0 ? 'a_fire' : e.fear > 0 ? 'a_run' : TASK_ICON[e.task] || 'smile';
  /* лицо-настроение по тому, что сейчас происходит */
  function moodOf(e) {
    if (e.dying) return ['m_sad', 'погиб' + (e.fem ? 'ла' : '')];
    if (e.sleep) return ['m_sleep', 'спит'];
    if (e.fight || e.task === 'quarrel' || e.task === 'sulk') return ['m_angry', 'злится'];
    if (e.task === 'mourn' || e.hp < 40) return ['m_sad', e.hp < 40 ? 'ранен' + (e.fem ? 'а' : '') : 'горюет'];
    if (e.fear > 0 || e.burn > 0) return ['m_surprise', 'напуган' + (e.fem ? 'а' : '')];
    /* дальше — настоящее настроение (Life: moodTick) и его главная причина */
    const v = e.mood || 0, a = e.fem ? 'а' : '', w = e.moodWhy ? ' — ' + e.moodWhy : '';
    if (v >= 5) return ['m_joy', 'счастлив' + a + w];
    if (v >= 1.5) return ['m_happy', 'в духе' + w];
    if (v > -1.5) return ['m_think', 'спокоен' + (e.fem ? 'а' : '')];
    if (v > -5) return ['m_sad', 'грустит' + w];
    return ['m_sad', 'подавлен' + a + w];
  }
  const coin = () => PI('coin');
  const live = (o) => o && !o.dying && !o.z;
  const onLive = (f) => { pvLive.push(f); f(); };
  const socIndex = (s) => s ? Math.max(0, Town.socs.indexOf(s)) % 4 : 0;
  function openPerson(e) { pv.tab = 'list'; pv.sel = e.id; pv.sub = 'info'; People.setSel(e.dead ? null : e.id); openPanel('people', true); }
  function goPerson(id, sub) { pv.tab = 'list'; pv.sel = id; if (sub) pv.sub = sub; const o = Life.byId(id); People.setSel(o && !o.dying ? id : null); Snd.sfx('tap'); openPanel('people', true); const pb = panel.querySelector('.pbody'); if (pb) pb.scrollTop = 0; }
  const sibling = (a, b) => (a.par != null && a.par === b.par) || (a.par2 != null && a.par2 === b.par2);
  function relGroup(e, o) {
    if (e.mate === o.id || e.par === o.id || o.par === e.id || e.par2 === o.id || o.par2 === e.id || sibling(e, o)) return 'fam';
    const r = e.rel[o.id] || 0; if (r < 0) return 'foe'; if (r >= 2) return 'friend'; if (r > 0) return 'known'; return 'none';
  }
  const GROUPS = [['fam', 'Семья', 'pair'], ['friend', 'Друзья', 'heart'], ['known', 'Знакомые', 'a_talk'], ['foe', 'Недруги', 'm_angry'], ['none', 'Не знакомы', 'search']];
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
    [['list', 'Жители', 'pair'], ['soc', 'Общества', 'flag'], ['log', 'Летопись', 'scroll']].forEach(([k, t, ic]) => {
      const b = h('button', 'ptab' + (pv.tab === k ? ' on' : '')); b.appendChild(icon(ic)); b.appendChild(h('span', '', t));
      b.onclick = () => { pv.tab = k; pv.sel = null; Snd.sfx('tap'); openPanel('people', true); }; tabs.appendChild(b);
    });
    body.appendChild(tabs);
    const box = h('div', 'pbox'); body.appendChild(box);
    if (pv.tab === 'list' && pv.sel != null) personView(box);
    else if (pv.tab === 'list') peopleList(box);
    else if (pv.tab === 'soc') socView(box);
    else logView(box);
  }
  function sigOf() {
    const ids = Sim.ents.filter((e) => !e.z && (!e.dying || e.dead)).map((e) => e.id + (e.dying ? 'd' : '') + ':' + (e.soc || 0) + (e.prof || '') + (e.home ? 'h' : '')).join(',');
    return pv.tab + '|' + pv.flt + '|' + (pv.tab === 'soc' ? Town.socs.map((s) => s.id + ':' + s.leader + JSON.stringify(s.war || {})).join(',') + '|' + Houses.list.map((b) => b.id + (b.done ? 'd' : '')).join(',') : pv.tab === 'log' ? Town.log.length + (Town.log[0] || {}).txt : ids + '|' + Town.socs.map((s) => s.leader).join(','));
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
  function socTag(s) { const t = h('span', 'stag'); if (s) { t.appendChild(icon('banner' + socIndex(s), 'ban')); t.style.setProperty('--sc', s.color); } t.appendChild(document.createTextNode(s ? s.name : 'Без общества')); return t; }
  function money(e) { const m = h('span', 'pm'); m.appendChild(img(coin(), 'ci')); const t = document.createTextNode(''); m.appendChild(t); onLive(() => { t.data = String(e.money | 0); }); return m; }
  function hpBar(e, cls) { const b = h('span', 'hpb ' + (cls || '')), f = h('i'); b.appendChild(f); onLive(() => { const v = Math.max(0, Math.min(1, (e.hp || 0) / ((e.ab && e.ab.hp) || 100))); f.style.width = Math.round(v * 100) + '%'; b.classList.toggle('low', v < .4); }); return b; }
  /* ---------- список ---------- */
  const FILTERS = [['all', 'Все', 'crowd'], ['adult', 'Взрослые', 'pair'], ['kid', 'Дети', 'grad'], ['homeless', 'Без дома', 'tent'], ['fight', 'В бою', 'sword']];
  const passF = (e) => pv.flt === 'all' || (pv.flt === 'adult' && e.age >= 16) || (pv.flt === 'kid' && e.age < 16) || (pv.flt === 'homeless' && !e.dying && !Town.homeOf(e)) || (pv.flt === 'fight' && (e.fight || e.task === 'arm'));
  function peopleList(box) {
    const all = Sim.ents.filter((e) => !e.z && (!e.dying || e.dead));
    if (!all.length) { box.appendChild(h('div', 'pempty', 'Пока никого нет. Поставь человечков инструментами из вкладки «Люди» — встретившись, они выберут главу и заживут обществом.')); return; }
    const fl = h('div', 'pflt');
    FILTERS.forEach(([k, t, ic]) => { const n = all.filter((e) => { const o = pv.flt; pv.flt = k; const r = passF(e); pv.flt = o; return r; }).length; const b = h('button', 'chip2' + (pv.flt === k ? ' on' : '')); b.appendChild(icon(ic)); b.appendChild(h('span', '', t + ' ' + n)); b.onclick = () => { pv.flt = k; Snd.sfx('tap'); openPanel('people', true); }; fl.appendChild(b); });
    box.appendChild(fl);
    const ents = all.filter(passF);
    const groups = Town.socs.map((s) => ({ s, m: ents.filter((e) => e.soc === s.id) })).concat([{ s: null, m: ents.filter((e) => e.soc == null || !Town.byId(e.soc)) }]).filter((g) => g.m.length);
    pvOrder = [];
    for (const g of groups) {
      const key = g.s ? g.s.id : 0, hd = h('button', 'pgrp'); hd.appendChild(socTag(g.s));
      const sm = h('small'); hd.appendChild(sm); hd.appendChild(h('em', '', pv.fold[key] ? '▸' : '▾'));
      onLive(() => { sm.textContent = g.m.filter(live).length + ' чел.' + (g.s && g.s.war && Object.values(g.s.war).some(Boolean) ? ' · ⚔ война' : ''); });
      hd.onclick = () => { pv.fold[key] = !pv.fold[key]; Snd.sfx('tap'); openPanel('people', true); };
      box.appendChild(hd);
      if (pv.fold[key]) continue;
      const list = h('div', 'plist'); box.appendChild(list);
      g.m.sort((a, b) => (b.id === (g.s && g.s.leader)) - (a.id === (g.s && g.s.leader)) || a.id - b.id);
      for (const e of g.m) {
        pvOrder.push(e.id);
        const r = h('button', 'prow pb' + (e.dying ? ' dead' : '')), lead = g.s && g.s.leader === e.id;
        const fw = h('span', 'pfw'); fw.appendChild(face(e)); if (lead) fw.appendChild(icon('crown', 'crn')); r.appendChild(fw);
        const t = h('div', 'pt'), nm = h('b'); nm.appendChild(icon(e.fem ? 'female' : 'male', 'sx')); nm.appendChild(document.createTextNode(e.name)); t.appendChild(nm);
        const sub = h('small'); t.appendChild(sub); r.appendChild(t);
        const side = h('div', 'pside');
        if (!e.dying) { const ti = icon('smile', 'ti'); side.appendChild(ti); onLive(() => { const k = taskIcon(e); if (ti.dataset.k !== k) { ti.dataset.k = k; ti.src = PI(k); } ti.title = e.txt || ''; }); side.appendChild(hpBar(e, 'mini')); }
        r.appendChild(side);
        onLive(() => { sub.innerHTML = ''; if (e.dying) { sub.textContent = 'погиб' + (e.fem ? 'ла' : ''); return; } if (e.prof && e.age >= 16) sub.appendChild(icon(PROF_ICON[e.prof] || 'p_none', 'pi16')); sub.appendChild(document.createTextNode(Math.floor(e.age) + ' · ' + ((Town.PROF[e.prof] || {}).n || Life.stageOf(e.age)) + ' · ' + (e.money | 0) + ' мон.')); });
        r.onclick = () => goPerson(e.id, 'info');
        list.appendChild(r);
      }
    }
    if (!ents.length) box.appendChild(h('div', 'pempty', 'Под этот фильтр никто не подходит.'));
  }
  /* ---------- карточка ---------- */
  function personView(box) {
    const e = Life.byId(pv.sel) || (Life.anyById ? Life.anyById(pv.sel) : null);
    const nav = h('div', 'pnav');
    const back = h('button', 'pbtn'); back.textContent = '← Все'; back.onclick = () => { pv.sel = null; Snd.sfx('tap'); openPanel('people', true); }; nav.appendChild(back);
    const ord = pvOrder.length ? pvOrder : Sim.ents.filter((o) => !o.z && (!o.dying || o.dead)).map((o) => o.id), k = ord.indexOf(pv.sel);
    const prev = h('button', 'pbtn sq', '‹'), next = h('button', 'pbtn sq', '›');
    prev.disabled = k <= 0; next.disabled = k < 0 || k >= ord.length - 1;
    prev.onclick = () => { if (k > 0) goPerson(ord[k - 1]); }; next.onclick = () => { if (k >= 0 && k < ord.length - 1) goPerson(ord[k + 1]); };
    nav.append(prev, h('span', 'pcnt', k >= 0 ? (k + 1) + ' / ' + ord.length : ''), next);
    if (e && !e.dying) { const fb = h('button', 'pbtn gold' + (followId === e.id ? ' on' : '')); fb.appendChild(icon('search')); fb.appendChild(document.createTextNode(followId === e.id ? 'Слежу' : 'Следить')); fb.onclick = () => { setFollow(followId === e.id ? null : e.id); Snd.sfx('tap'); openPanel('people', true); }; nav.appendChild(fb); }
    box.appendChild(nav);
    if (!e) { box.appendChild(h('div', 'pempty', 'Этого человечка больше нет.')); return; }
    const s = Town.byId(e.soc), top = h('div', 'phero');
    const fr = h('div', 'pframe'); fr.appendChild(face(e, 'pbig')); if (s && s.leader === e.id) fr.appendChild(icon('crown', 'crn big')); top.appendChild(fr);
    const info = h('div', 'pinfo');
    const nm = h('div', 'pname'); nm.appendChild(icon(e.fem ? 'female' : 'male', 'sx')); nm.appendChild(document.createTextNode(e.name)); info.appendChild(nm);
    const l0 = h('div', 'pline'); info.appendChild(l0); onLive(() => { l0.textContent = Life.describe(e)[0]; });
    const st = h('div', 'pline'); st.appendChild(socTag(s)); if (s && s.leader === e.id) st.appendChild(h('span', 'prole', 'Глава')); info.appendChild(st);
    top.appendChild(info);
    const md = h('div', 'pmood'), mi = icon('m_happy', 'mood'), mt = h('small'); md.append(mi, mt); top.appendChild(md);
    onLive(() => { const [k2, t] = moodOf(e); if (mi.dataset.k !== k2) { mi.dataset.k = k2; mi.src = PI(k2); } mt.textContent = t; });
    box.appendChild(top);
    /* сейчас */
    if (!e.dying) { const now = h('div', 'pnow'), ni = icon('smile'), nt = h('span'); now.append(ni, nt); onLive(() => { const k2 = taskIcon(e); if (ni.dataset.k !== k2) { ni.dataset.k = k2; ni.src = PI(k2); } nt.textContent = e.burn > 0 ? 'Горит!' : e.txt || '—'; }); box.appendChild(now); }
    const others = Sim.ents.filter((o) => o !== e && live(o));
    const seg = h('div', 'pseg');
    [['info', 'Обзор', 'star'], ['rel', 'Отношения · ' + others.filter((o) => relGroup(e, o) !== 'none').length, 'heart'], ['log', 'Летопись · ' + ((e.plog || []).length), 'scroll']].forEach(([kk, t, ic]) => { const b = h('button', 'ptab' + (pv.sub === kk ? ' on' : '')); b.appendChild(icon(ic)); b.appendChild(h('span', '', t)); b.onclick = () => { pv.sub = kk; Snd.sfx('tap'); openPanel('people', true); }; seg.appendChild(b); });
    box.appendChild(seg);
    if (pv.sub === 'rel') { relView(box, e, others); return; }
    if (pv.sub === 'log') { personLog(box, e); return; }
    if (e.dying) { const d = h('div', 'pfacts'); Life.describe(e).slice(1).forEach((l) => d.appendChild(h('div', 'pfact', l))); box.appendChild(d); famBlock(box, e, others); return; }
    /* плитки */
    const tiles = h('div', 'ptiles');
    const tile = (ic, label, fill) => { const t = h('div', 'ptile'); t.appendChild(icon(ic, 'tic')); const c = h('div', 'tc'); c.appendChild(h('small', '', label)); const v = h('b'); c.appendChild(v); t.appendChild(c); tiles.appendChild(t); onLive(() => fill(v, c)); };
    tile('health', 'Здоровье', (v, c) => { v.textContent = Math.max(0, e.hp | 0) + ' / ' + ((e.ab && e.ab.hp) || 100); if (!c.querySelector('.hpb')) c.appendChild(hpBar(e)); });
    tile('coin', 'Деньги', (v) => { v.textContent = (e.money | 0) + ' мон. · всего ' + (e.earned | 0); });
    tile(e.weapon ? 'sword' : 'shield', 'Оружие', (v) => { v.textContent = (e.weapon ? Combat.WEAP[e.weapon].n : 'нет') + (e.kills ? ' · побед ' + e.kills : ''); });
    tile('house', 'Дом', (v) => { const hm = Town.homeOf(e); v.textContent = hm ? hm.b.name + ', ' + (hm.r.f + 1) + ' эт.' : 'нет — живёт под небом'; });
    box.appendChild(tiles);
    { const P = Town.PROF[e.prof], pr = h('div', 'pprof'); pr.appendChild(icon(PROF_ICON[e.prof] || 'p_none', 'pbadge')); const c = h('div'); c.appendChild(h('b', '', P ? P.n : (e.age < 16 ? 'Ещё ребёнок' : 'Выбирает дело'))); c.appendChild(h('small', '', P && P.d ? P.d : (e.age < 16 ? 'Играет, учится, ходит за родителями' : ''))); pr.appendChild(c); box.appendChild(pr); }
    /* подробно: характер, учёба, дети, родители, заработок */
    {
      const fx2 = h('div', 'pfacts2'); box.appendChild(h('div', 'lbl', 'Подробно')); box.appendChild(fx2);
      onLive(() => {
        const fam = Life.family ? Life.family(e) : [], kids = fam.filter((x) => x.rel === 'сын' || x.rel === 'дочь').map((x) => x.o), pars = Life.parentsOf ? Life.parentsOf(e) : [], mate = Life.byId(e.mate), cha = e.cha || 0;
        const rows = [
          ['m_happy', 'Характер', cha > .66 ? 'общительный, тянется к людям' : cha > .33 ? 'спокойный' : 'замкнутый, любит одиночество'],
          ['book', 'Учёность', (e.smart || 0) >= 4 ? 'образован' + (e.fem ? 'а' : '') : (e.smart || 0) >= 1 ? 'немного учил' + (e.fem ? 'ась' : 'ся') : 'не учил' + (e.fem ? 'ась' : 'ся')],
          ['a_love', 'Пара', mate ? mate.name + (e.mst === 2 ? (e.fem ? ' — муж' : ' — жена') : ' — встречаются') : 'нет'],
          ['pair', 'Дети', kids.length ? kids.map((o) => o.name + (o.dying ? ' †' : '')).join(', ') : 'нет'],
          ['crowd', 'Родители', pars.length ? pars.map((o) => o.name + (o.dying ? ' †' : '')).join(', ') : '—'],
          ['coin', 'Заработал' + (e.fem ? 'а' : ''), (e.earned | 0) + ' мон. за жизнь'],
          ['sword', 'Победы', String(e.kills | 0)]
        ];
        fx2.innerHTML = ''; for (const [ic, k, v] of rows) { const q = h('div', 'pf2'); q.appendChild(icon(ic, 'pi16')); q.appendChild(h('small', '', k)); q.appendChild(h('span', '', v)); fx2.appendChild(q); }
      });
    }
    famBlock(box, e, others);
  }
  /* родные (живые и умершие) и лучшие друзья — кнопками с лицами */
  function famBlock(box, e, others) {
    const fam = Life.family ? Life.family(e) : [], famIds = new Set(fam.map((x) => x.o.id));
    const fr2 = others.filter((o) => !famIds.has(o.id) && relGroup(e, o) === 'friend').sort((a, b) => (e.rel[b.id] || 0) - (e.rel[a.id] || 0)).slice(0, 4);
    if (fam.length) {
      const cl = h('div', 'pclose');
      for (const { o, rel } of fam) { const dead = !!o.dying || !Sim.ents.includes(o), c = h('button', 'pchip' + (dead ? ' dead' : '')); c.appendChild(face(o, 'rf')); c.appendChild(icon('pair', 'pi16')); c.appendChild(h('span', '', o.name + ' · ' + rel + (dead ? ' †' : ''))); c.onclick = () => goPerson(o.id, 'info'); cl.appendChild(c); }
      box.appendChild(h('div', 'lbl', 'Семья')); box.appendChild(cl);
    }
    if (fr2.length) {
      const cl = h('div', 'pclose');
      for (const o of fr2) { const c = h('button', 'pchip'); c.appendChild(face(o, 'rf')); c.appendChild(icon('heart', 'pi16')); c.appendChild(h('span', '', o.name + ' · ' + Town.relLabel(e, o).toLowerCase())); c.onclick = () => goPerson(o.id, 'info'); cl.appendChild(c); }
      box.appendChild(h('div', 'lbl', 'Близкие друзья')); box.appendChild(cl);
    }
  }
  /* личная летопись: всё, что случилось с человеком */
  function personLog(box, e) {
    const L = e.plog || [];
    if (!L.length) { box.appendChild(h('div', 'pempty', 'Пока ничего заметного не случилось.')); return; }
    const l = h('div', 'llist');
    for (const it of L) { const r = h('div', 'lrow'); const ic = (LOG_ICON.find(([re]) => re.test(it.txt)) || [0, 'scroll'])[1]; r.appendChild(icon(ic, 'lic')); const c = h('div'); c.appendChild(h('small', '', it.t)); c.appendChild(h('span', '', it.txt)); r.appendChild(c); l.appendChild(r); }
    box.appendChild(l);
  }
  function relView(box, e, others) {
    if (!others.length) { box.appendChild(h('div', 'pempty', 'В мире больше никого.')); return; }
    const flt = h('div', 'pflt');
    [['all', 'Все', 'crowd'], ['fam', 'Семья', 'pair'], ['friend', 'Друзья', 'heart'], ['foe', 'Недруги', 'm_angry'], ['soc', 'Своё общество', 'flag']].forEach(([k, t, ic]) => { const b = h('button', 'chip2' + (pv.rf === k ? ' on' : '')); b.appendChild(icon(ic)); b.appendChild(h('span', '', t)); b.onclick = () => { pv.rf = k; Snd.sfx('tap'); openPanel('people', true); }; flt.appendChild(b); });
    box.appendChild(flt);
    const pass = (o) => pv.rf === 'all' || pv.rf === relGroup(e, o) || (pv.rf === 'soc' && o.soc === e.soc && e.soc != null);
    let shown = 0;
    const famAll = Life.family ? Life.family(e).map((x) => x.o) : [], famSet = new Set(famAll.map((o) => o.id));
    for (const [g, title, ic] of GROUPS) {
      const L = (g === 'fam' ? famAll.filter((o) => pass(o) || pv.rf === 'fam') : others.filter((o) => !famSet.has(o.id) && relGroup(e, o) === g && pass(o))).sort((a, b) => (g === 'foe' ? (e.rel[a.id] || 0) - (e.rel[b.id] || 0) : (e.rel[b.id] || 0) - (e.rel[a.id] || 0)));
      if (!L.length) continue;
      const hd = h('button', 'rgh'); hd.appendChild(icon(ic)); hd.appendChild(h('span', '', title)); hd.appendChild(h('small', '', String(L.length))); if (g === 'none') hd.appendChild(h('em', '', pv.strangers ? 'скрыть' : 'показать'));
      if (g === 'none') hd.onclick = () => { pv.strangers = !pv.strangers; Snd.sfx('tap'); openPanel('people', true); };
      box.appendChild(hd);
      if (g === 'none' && !pv.strangers) continue;
      const rl = h('div', 'rlist'); box.appendChild(rl);
      for (const o of L) {
        shown++;
        const r = h('button', 'rrow g-' + g);
        r.appendChild(face(o, 'rf'));
        const t = h('div', 'rt'), nm = h('b'); nm.appendChild(icon(o.fem ? 'female' : 'male', 'sx')); nm.appendChild(document.createTextNode(o.name + (o.dying || !Sim.ents.includes(o) ? ' †' : ''))); t.appendChild(nm);
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
    if (!shown && !others.some((o) => relGroup(e, o) === 'none' && pass(o))) box.appendChild(h('div', 'pempty', 'Здесь пока никого.'));
    box.appendChild(h('div', 'hint', 'Сердечки — как ' + e.name + ' относится к человеку; пометка — отвечает ли тот взаимностью. Симпатия растёт от разговоров, работы и праздников вместе, падает от ссор, драк и измен.'));
  }
  /* ---------- общества: коротко, по раскрытию — подробно ---------- */
  function socView(box) {
    if (!Town.socs.length) { box.appendChild(h('div', 'pempty', 'Обществ пока нет. Двое взрослых рядом основывают общество и выбирают главу.')); return; }
    /* отношения между обществами — одной табличкой сверху */
    if (Town.socs.length > 1) {
      const rb = h('div', 'sdip'); rb.appendChild(h('div', 'lbl', 'Отношения обществ'));
      for (let i = 0; i < Town.socs.length; i++) for (let j = i + 1; j < Town.socs.length; j++) {
        const a = Town.socs[i], b = Town.socs[j], v = a.rel[b.id] || 0, war = a.war && a.war[b.id];
        const r = h('div', 'sdrow ' + (war ? 'war' : v >= 2 ? 'ok' : v <= -3 ? 'bad' : ''));
        const na = h('span', 'sdn'); na.style.setProperty('--sc', a.color); na.textContent = a.name;
        const nb = h('span', 'sdn'); nb.style.setProperty('--sc', b.color); nb.textContent = b.name;
        const mid = h('span', 'sdm'); mid.appendChild(icon(war ? 'sword' : v >= 2 ? 'a_talk' : v <= -3 ? 'm_angry' : 'flag', 'pi16')); mid.appendChild(h('small', '', Town.relSocLabel(v, war)));
        r.append(na, mid, nb); rb.appendChild(r);
      }
      box.appendChild(rb);
    }
    for (const s of Town.socs) {
      const m = Town.members(s), L = Life.byId(s.leader), open = pv.sopen[s.id] != null ? pv.sopen[s.id] : Town.socs.length === 1;
      const war = s.war && Object.keys(s.war).some((k) => s.war[k]);
      const c = h('div', 'scard2' + (open ? ' open' : '')); c.style.setProperty('--sc', s.color);
      const hd = h('button', 'sh2'); hd.appendChild(icon('banner' + socIndex(s), 'sban'));
      const ht = h('div', 'sht'); ht.appendChild(h('b', '', s.name)); const hs = h('small'); ht.appendChild(hs); hd.appendChild(ht);
      onLive(() => { hs.textContent = Town.members(s).length + ' чел.' + (L ? ' · глава ' + L.name : ''); });
      if (war) hd.appendChild(h('span', 'swar', '⚔ война'));
      hd.appendChild(h('em', '', open ? '▾' : '▸'));
      hd.onclick = () => { pv.sopen[s.id] = !open; Snd.sfx('tap'); openPanel('people', true); };
      c.appendChild(hd);
      if (!open) { box.appendChild(c); continue; }
      /* запасы — одной строкой */
      const res = h('div', 'sres'); c.appendChild(res);
      onLive(() => {
        res.innerHTML = '';
        const t = (ic, v, need, title) => { const q = h('span', 'sr' + (need && v < need ? ' low' : '')); q.title = title; q.appendChild(icon(ic, 'pi16')); q.appendChild(document.createTextNode(String(v))); res.appendChild(q); };
        const n = Town.members(s).length;
        t('coin', s.bank | 0, s.want && s.want.bank, 'казна'); t('wood', s.wood | 0, s.want && s.want.wood, 'дерево'); t('stone', s.stone | 0, s.want && s.want.stone, 'камень');
        t('food', Math.floor(s.food || 0), n, 'еда'); t('drop', Math.floor(s.water || 0), n, 'вода'); t('sword', Town.members(s).filter((e) => e.weapon).length, 0, 'с оружием');
      });
      /* жители — лицами, нажми на лицо */
      c.appendChild(h('div', 'lbl', 'Жители'));
      const fg = h('div', 'sfaces');
      m.slice().sort((a, b) => (b.id === s.leader) - (a.id === s.leader) || b.age - a.age).forEach((e) => {
        const q = h('button', 'sface'); const fw = h('span', 'pfw'); fw.appendChild(face(e)); if (e.id === s.leader) fw.appendChild(icon('crown', 'crn')); q.appendChild(fw);
        q.appendChild(h('small', '', e.name)); const pi = icon(PROF_ICON[e.prof] || 'p_none', 'spi'); if (e.age >= 16 && e.prof) q.appendChild(pi);
        q.onclick = () => goPerson(e.id, 'info'); fg.appendChild(q);
      });
      c.appendChild(fg);
      /* пары и ссоры */
      const pairs = [], feuds = [];
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) { const a = m[i], b = m[j]; if (a.mate === b.id) pairs.push([a, b, a.mst === 2 ? 'женаты' : 'вместе']); else if ((a.rel[b.id] || 0) < 0 && (b.rel[a.id] || 0) < 0) feuds.push([a, b]); }
      if (pairs.length || feuds.length) {
        const rel = h('div', 'srel');
        for (const [a, b, t] of pairs) { const q = h('button', 'pchip love'); q.appendChild(icon('a_love', 'pi16')); q.appendChild(h('span', '', a.name + ' и ' + b.name + ' · ' + t)); q.onclick = () => goPerson(a.id, 'rel'); rel.appendChild(q); }
        for (const [a, b] of feuds) { const q = h('button', 'pchip feud'); q.appendChild(icon('m_angry', 'pi16')); q.appendChild(h('span', '', a.name + ' и ' + b.name + ' · ссора')); q.onclick = () => goPerson(a.id, 'rel'); rel.appendChild(q); }
        c.appendChild(rel);
      }
      /* постройки — строчками; комнаты по нажатию */
      const bs = Houses.list.filter((b) => b.soc === s.id), mn = Works.mines.filter((o) => o.soc === s.id).length, dk = Works.docks.filter((o) => o.soc === s.id).length, rd = Works.rods.filter((o) => o.soc === s.id).length;
      if (bs.length || mn || dk || rd) {
        c.appendChild(h('div', 'lbl', 'Постройки'));
        for (const b of bs) {
          const key = 'b' + b.id, r = h('button', 'sb2'); r.appendChild(icon(b.done ? 'house' : 'build', 'pi16'));
          const bt = h('span'); r.appendChild(bt); const bm = h('small'); r.appendChild(bm);
          onLive(() => { bt.textContent = b.name; bm.textContent = b.ruin ? 'рушится' : Houses.damaged(b) ? 'повреждён' : b.done ? b.rooms.length + ' комн.' : 'строится ' + Math.round(b.prog * 100) + '%'; });
          r.onclick = () => { pv.fold[key] = !pv.fold[key]; Snd.sfx('tap'); openPanel('people', true); };
          c.appendChild(r);
          if (pv.fold[key]) {
            const rooms = h('div', 'srooms');
            b.rooms.slice().sort((a, c2) => c2.f - a.f || a.i - c2.i).forEach((rm) => {
              const q = h('span', 'room'), bd = UIA.badge[Houses.ROLES[rm.role].badge]; if (bd) { const i = img(bd, 'ri'); i.classList.remove('smooth'); q.appendChild(i); }
              const who = rm.owners.map((id) => (Life.byId(id) || {}).name).filter(Boolean);
              q.appendChild(document.createTextNode((rm.f + 1) + ' эт. · ' + Houses.ROLES[rm.role].n + (who.length ? ' · ' + who.join(', ') : '')));
              rooms.appendChild(q);
            });
            c.appendChild(rooms);
          }
        }
        const extra = [[mn, 'шахт'], [dk, 'причал'], [rd, 'громоотвод']].filter(([n]) => n).map(([n, t]) => t + ': ' + n).join(' · ');
        if (extra) c.appendChild(h('div', 'hint', extra));
      }
      if (s.want) c.appendChild(h('div', 'hint', 'Копят на новый дом.'));
      box.appendChild(c);
    }
  }
  /* ---------- летопись ---------- */
  const LOG_ICON = [[/застал/, 'm_angry'], [/предложение/, 'a_love'], [/ждёт ребёнка|Родил|родила/, 'heart'], [/Тайно/, 'a_love'], [/цветок/, 'heart'], [/Война/, 'sword'], [/Мир /, 'a_talk'], [/пал[а]? в бою|погиб/, 'm_sad'], [/поженил/, 'a_love'], [/заселил/, 'house'], [/заложил|Достроено/, 'build'], [/рушится|разрушен/, 'stone'], [/Основано|Раскол|опустело/, 'flag'], [/глава/, 'crown'], [/сделал/, 'sword'], [/подрались/, 'm_angry'], [/теперь/, 'p_none'], [/Спор/, 'm_angry']];
  function logView(box) {
    if (!Town.log.length) { box.appendChild(h('div', 'pempty', 'Летопись пуста.')); return; }
    const l = h('div', 'llist');
    for (const it of Town.log) {
      const r = h('div', 'lrow' + (it.big ? ' big' : '')); if (it.c) r.style.setProperty('--sc', it.c);
      const ic = (LOG_ICON.find(([re]) => re.test(it.txt)) || [0, 'scroll'])[1]; r.appendChild(icon(ic, 'lic'));
      const c = h('div'); c.appendChild(h('small', '', it.t)); c.appendChild(h('span', '', it.txt)); r.appendChild(c); l.appendChild(r);
    }
    box.appendChild(l);
  }
  /* ---------- слежка камерой ---------- */
  const followChip = h('button', 'follow'); followChip.style.display = 'none'; stage.appendChild(followChip);
  followChip.onclick = () => setFollow(null);
  function setFollow(id) {
    followId = id; const e = id != null ? Life.byId(id) : null;
    if (e) { People.setSel(e.id); followChip.innerHTML = ''; followChip.appendChild(face(e, 'rf')); followChip.appendChild(h('span', '', 'Слежу: ' + e.name)); followChip.appendChild(h('em', '', '✕')); followChip.style.display = 'flex'; }
    else { followChip.style.display = 'none'; }
  }
  /* камера плавно держит выбранного в середине видимой части сцены (над открытой панелью) */
  function followStep() {
    if (followId == null) return;
    const e = Life.byId(followId); if (!e || e.dying) { setFollow(null); return; }
    const st = stage.getBoundingClientRect(), pr = panel.classList.contains('open') ? panel.getBoundingClientRect() : null;
    const visBottom = pr ? Math.min(st.bottom, pr.top) : st.bottom, cyScreen = (st.top + visBottom) / 2 - (st.top + st.height / 2);
    const z = Math.max(view.z, 2.4), px = (e.x / W - .5) * W * cs, py = ((e.y - 6) / H - .5) * H * cs;
    view.z += (z - view.z) * .12; view.x += (-px * view.z - view.x) * .12; view.y += (-py * view.z + cyScreen - view.y) * .12; applyView();
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
    /* ручка шторки: потянуть вниз — закрыть (удобно на телефоне) */
    const grip = h('div', 'pgrip'); panel.prepend(grip);
    let sy = null; const down = (ev) => { sy = ev.clientY; }, upf = (ev) => { if (sy != null && ev.clientY - sy > 50) closePanel(); sy = null; };
    for (const el of [grip, hd]) { el.addEventListener('pointerdown', down); el.addEventListener('pointerup', upf); }
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
  const SEASON_LEN = [[2, '2 дня'], [3, '3 дня'], [6, '6 дней'], [12, '12 дней'], [24, '24 дня']];   /* сколько суток длится каждое время года */
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
    add('Новый мир', 'globe', () => confirmBox('Начать новый пустой мир? Текущий пропадёт (его можно сохранить в галерею).', () => { pushUndo(); newWorld('void'); closePanel(); }));
    { const zr = h('div', 'row'); zr.appendChild(h('div', 'lbl', 'Масштаб: колесо мыши или щипок; двигать — два пальца, правая/средняя кнопка, стрелки или WASD, «Рука» сверху; 0 — весь мир')); [['−', () => zoomBtn(1 / 1.5)], ['+', () => zoomBtn(1.5)], ['1×', () => { view.z = 1; view.x = 0; view.y = 0; applyView(); }]].forEach((q) => { const b = btn(q[0], false, ''); b.onclick = () => { q[1](); Snd.sfx('tap'); }; zr.appendChild(b); }); body.appendChild(zr); }
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
  let noticeAcc = null, aim = null;
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
      else if (typeof Arms !== 'undefined' && Arms.KINDS[t]) {
        /* взрывчатка: что бросают и на что целятся — тянут пальцем (aim), остальное ставится нажатием */
        if (Arms.KINDS[t].aim) { if (first) aim = { k: t, x, y }; }
        else if (first || ptr.held % 30 === 0) Arms.spawn(t, x, y);
      }
      return;
    }
    const id = E[k];
    if (SEEDS.indexOf(id) >= 0) { sow(x, y, id, first); return; }
    const solid = KIND[id] === K.SOLID || KIND[id] === K.SPEC;
    const dens = (solid || G.size <= 1) ? 1 : .55;
    Sim.paint(x, y, G.size, id, sq, G.replace, dens);
    /* жители замечают, что рядом вдруг появилось много чего-то */
    if (!noticeAcc || noticeAcc.id !== id || Math.abs(noticeAcc.x - x) > 40) noticeAcc = { x, y, id, n: 0 };
    noticeAcc.n += Math.max(1, Math.round(G.size * G.size * dens)); noticeAcc.x = (noticeAcc.x * 3 + x) / 4; noticeAcc.y = (noticeAcc.y * 3 + y) / 4;
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
  /* кнопки приближения для режима «Рука» */
  const zoomCtl = h('div', 'zoomctl'); zoomCtl.style.display = 'none'; stage.appendChild(zoomCtl);
  [['+', 1.4], ['−', 1 / 1.4], ['⟲', 0]].forEach(([t, k]) => { const b = h('button', 'pbtn sq', t); b.onclick = () => { if (followId != null) setFollow(null); if (k) zoomBtn(k); else { view.z = 1; view.x = 0; view.y = 0; applyView(); } Snd.sfx('tap'); }; zoomCtl.appendChild(b); });
  field.addEventListener('pointerdown', (e) => {
    if (title.classList.contains('hide') === false) return;
    if (e.pointerType === 'touch') { tp.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (tp.size === 2) { ptr.down = false; fxc.clearRect(0, 0, W, H); if (followId != null) setFollow(null); pinch = pinchState(); try { field.setPointerCapture(e.pointerId); } catch (er) { }; e.preventDefault(); return; } }
    /* «Рука»: только сдвиг и приближение; короткое нажатие на человечка — его карточка, ничего не ставится */
    if (G.panMode && e.button !== 2) { if (followId != null) setFollow(null); panning = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, who: personAt(e, true) }; try { field.setPointerCapture(e.pointerId); } catch (er) { }; e.preventDefault(); return; }
    /* инструмент «Люди» и нажали прямо на человечка: короткое нажатие ставит нового, долгое (полсекунды) открывает карточку */
    if (e.button !== 2 && personTool()) { const who = personAt(e); if (who) { const [cx0, cy0] = cellOf(e); lp = { x: cx0, y: cy0, cx: e.clientX, cy: e.clientY, who }; clearTimeout(lpT); lpT = setTimeout(() => { if (lp) { const o = lp.who; lp = null; Snd.sfx('pop'); openPerson(o); } }, 480); e.preventDefault(); return; } }
    if (e.button === 2 || e.button === 1 || G.panMode) { if (followId != null) setFollow(null); panning = { x: e.clientX, y: e.clientY }; try { field.setPointerCapture(e.pointerId); } catch (er) { }; e.preventDefault(); return; }
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
    if (ptr.down && aim) { fxc.clearRect(0, 0, W, H); Arms.preview(fxc, aim.k, aim.x, aim.y, x, y); return; }
    if (ptr.down) {
      if (G.mode === 'line' || G.mode === 'rect') { if (!isTool(G.sel) || G.sel === 't:ERASE') previewShape(ptr.sx, ptr.sy, x, y); }
      else if (G.mode === 'brush' || isTool(G.sel)) { if (!isTool(G.sel) || ['ERASE', 'HEAT', 'COLD'].indexOf(G.sel.slice(2)) >= 0) strokeLine(ptr.lx, ptr.ly, x, y, (a, b) => stamp(a, b, false)); }
    }
  });
  const endStroke = (e) => {
    tp.delete(e.pointerId); if (tp.size < 2) pinch = null;
    if (panning && e.button !== undefined) { const p = panning; panning = null; if (p.who && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 8) { Snd.sfx('pop'); openPerson(p.who); } if (G.panMode) return; }
    /* короткое нажатие на человечка инструментом «Люди» — просто ставим нового */
    if (lp) { clearTimeout(lpT); const q = lp; lp = null; if (openedPanel) closePanel(); pushUndo(); stamp(q.x, q.y, true); return; }
    if (!ptr.down) return; ptr.down = false;
    if (aim) {   /* бросок или пуск по протянутому отрезку */
      const [x, y] = cellOf(e), a = aim; aim = null; fxc.clearRect(0, 0, W, H);
      if (a.k === 'ROCKET') { if (Math.hypot(x - a.x, y - a.y) < 3) Arms.spawn('ROCKET', x, y); else Arms.spawn('ROCKET', a.x, a.y, 0, 0, x, y); }
      else { const [vx, vy] = Arms.throwVel(a.x, a.y, x, y); Arms.spawn(a.k, a.x, a.y, vx, vy); }
      if (e.pointerType !== 'mouse') ring.style.display = 'none';
      return;
    }
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
    { const art = (typeof BGA !== 'undefined') && (BGA[['plains_spring', 'plains', 'plains_autumn', 'plains_winter'][Sky.Y.season]] || BGA.plains); if (art) title.style.setProperty('--tbg', 'url(' + art + ')'); }
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
  let last = performance.now(), acc = 0, frameN = 0, dtS = 1000 / 60;
  Sim.sfx = (n, v) => Snd.sfx(n, v);
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(100, now - last); last = now;
    /* ровный шаг: время кадра сглаживается (иначе на ×5 за кадр выходит то 4, то 6 шагов — рывки); шаги мира — пока укладываются в 12 мс,
       небо идёт ровно столько, сколько прошёл мир (на слабом устройстве ускорение мягко проседает, но не дёргается) */
    dtS += (dt - dtS) * .12; const stepMs = 1000 / 60; let n = 0;
    if (!G.paused) { acc += dtS * G.speed; const t0 = performance.now(), maxN = G.speed > 1 ? 7 : 3;
      while (acc >= stepMs && n < maxN && (n === 0 || performance.now() - t0 < 12)) { Sim.step(); acc -= stepMs; n++; }
      if (acc > stepMs * 2) acc = stepMs * .5; Sky.advance(n * stepMs); autoWeather(dt); }
    if (ptr.down && !G.paused || (ptr.down && G.paused)) { ptr.held++; if (G.mode === 'brush' || isTool(G.sel)) { if (G.sel !== 't:WIND' && !(isTool(G.sel) && G.sel.slice(2) === 'METEOR' && ptr.held % 40)) stamp(ptr.x, ptr.y, false); } }
    followStep();
    Render.draw(Sim);
    const sh = Sim.shake; { const t = sh > .3 ? 'translate(' + ((Math.random() - .5) * sh * cs * .5).toFixed(1) + 'px,' + ((Math.random() - .5) * sh * cs * .5).toFixed(1) + 'px)' : ''; if (t !== shakeT) { shakeT = t; applyView(); } }
    $('#flash').style.opacity = Math.max(Sim.bolts.length ? Math.max.apply(null, Sim.bolts.map((b) => b.ttl)) / 8 * .22 : 0, typeof Arms !== 'undefined' ? Math.min(.95, Arms.flash / 40 * 1.1) : 0).toFixed(2);
    frameN++;
    if (frameN % 6 === 0) { Snd.update(Sim.act, Sim.weather); Sim.act.p = Sim.act.l = Sim.act.f = 0; }
    Sim.tod = Sky.time;
    if (cardEnt) { if (Sim.ents.indexOf(cardEnt) < 0) closeCard(); else { if (frameN % 6 === 0) cardText(); placeCard(); } }
    if (frameN % 45 === 0) checkGoals();
    if (frameN % 30 === 0) pvTick();
    if (frameN % 20 === 0 && noticeAcc && !ptr.down) { if (noticeAcc.n > 24 && Life.notice) Life.notice(noticeAcc.x, noticeAcc.y, noticeAcc.n, noticeAcc.id); noticeAcc = null; }
    if (frameN % 20 === 0) seasonTick();
    if (frameN % 20 === 0 && openedPanel === 'weather' && timeUI && !timeUI.drag) timeUI.showT();
    if (!title.classList.contains('hide')) { titleTimer++; if (titleTimer % 420 === 200) Sim.lightning(Math.floor(W * (.15 + Math.random() * .7))); }
  }
  let rzT = 0; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => layout(false), 220); });
  /* сцена поменяла размер (полки заполнились, повернули телефон, появилась адресная строка) — мир пересчитывается, чтобы целиком помещаться */
  if (window.ResizeObserver) { let lastSz = ''; new ResizeObserver(() => { const k = stage.clientWidth + 'x' + stage.clientHeight; if (k === lastSz) return; lastSz = k; clearTimeout(rzT); rzT = setTimeout(() => layout(false), 150); }).observe(stage); }
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { G.paused = !G.paused; updateHud(); e.preventDefault(); }
    else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) undo();
    else if (e.key === '[') { G.size = Math.max(1, G.size - 1); showRing(null); }
    else if (e.key === ']') { G.size = Math.min(14, G.size + 1); showRing(null); }
    else if (e.key === 'e') toggleErase();
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'ф', 'в', 'ц', 'ы'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      const st = 60, k = e.key; if (followId != null) setFollow(null);
      if (k === 'ArrowLeft' || k === 'a' || k === 'ф') view.x += st; else if (k === 'ArrowRight' || k === 'd' || k === 'в') view.x -= st; else if (k === 'ArrowUp' || k === 'w' || k === 'ц') view.y += st; else view.y -= st;
      applyView(); e.preventDefault();
    }
    else if (e.key === '+' || e.key === '=') zoomBtn(1.25);
    else if (e.key === '-' || e.key === '_') zoomBtn(1 / 1.25);
    else if (e.key === '0') { view.z = 1; view.x = 0; view.y = 0; applyView(); }
  });

  /* ---------- старт ---------- */
  /* ветка с осенними листьями для углов панелей (раньше — зелёная лоза из Icons.vine) */
  document.documentElement.style.setProperty('--vine', 'url(' + ((UIA.deco && UIA.deco.branch) || Icons.vine()) + ')');
  /* детали из атласа интерфейса (scripts/build_pixelia_ui.py: ui_parts): лента заголовка, уголки, крестик, стрелки, ромб ползунка */
  { const ds = document.documentElement.style, P = UIA.part || {}; for (const k in P) ds.setProperty('--p-' + k, 'url(' + P[k] + ')'); }
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
