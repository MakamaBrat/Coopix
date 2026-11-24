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
  const G = Object.assign({ sel: 'WATER', size: 3, shape: 'round', mode: 'brush', replace: false, paused: false, speed: 1, lens: false, cs: 0, sound: true, time: .3, tcycle: true, biome: 'auto', sday: 0, hot: ['WATER', 't:HUMAN', 'SAND', 'EARTH', 'FIRE'], weather: 0, wind: 0, cat: 0 }, store.get('set', {}));
  /* старые сохранения хранили тему неба: переводим в время суток */
  { const sv = store.get('set', {}); if (sv.time === undefined && sv.theme) { G.time = { night: .02, day: .5, dusk: .74, cave: .3 }[sv.theme] || .3; if (sv.theme === 'cave') G.biome = 'cave'; } }
  /* человечек всегда под рукой на нижней полке */
  if (G.hot.indexOf('t:HUMAN') < 0) G.hot = [G.hot[0], 't:HUMAN'].concat(G.hot.slice(1)).slice(0, 5);
  G.paused = false; G.lens = false; G.weather = 0; G.wind = 0; G.camp = false;
  let prog = store.get('prog', null) || { day: 1, unlocked: ['EARTH', 'WATER', 'STONE', 't:HUMAN'], done: {}, finished: false };
  const saveSet = () => store.set('set', { sel: G.sel, size: G.size, shape: G.shape, mode: G.mode, replace: G.replace, speed: 1, cs: G.cs, sound: G.sound, time: Sky.time, tcycle: G.tcycle, biome: G.biome, sday: Sky.day, hot: G.hot, cat: G.cat });
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
  const iconOf = (k) => k === 't:HUMAN' || k === 't:ZOMBIE' ? People.icon('ref', k === 't:ZOMBIE') : formOf(k) ? People.icon(formOf(k)) : isTool(k) ? Icons.ui(TOOL_ICON[k.slice(2)]) : Icons.el(k);
  const img = (src, cls) => Icons.img(src, cls);
  const catIcon = (c) => ({ pile: Icons.el('SAND'), drop: Icons.el('WATER'), puff: Icons.el('STEAM'), block: Icons.el('STONE'), seed: Icons.el('SEED'), bulb: Icons.el('LAMP'), bolt: Icons.ui('bolt'), people: People.icon('ref') })[c.icon];

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
  const field = $('#field'), stage = $('#stage'), ring = $('#ring'), info = $('#info'), fx = $('#fx'), fxc = fx.getContext('2d');
  let W = 0, H = 0, cs = 4;
  function gridFor() {
    const st = stage.getBoundingClientRect(); const sw = Math.min(st.width - 28, 1280), sh = st.height - 28;
    let c = G.cs || 3; let w = Math.floor(sw / c), hh = Math.floor(sh / c);
    /* тонкий пиксель держим: если клеток слишком много, мир чуть уже, а по бокам больше каменной рамки */
    while (w * hh > 72000) { const w2 = Math.floor(72000 / hh); if (w2 >= (sw / c) * .72) { w = w2; break; } c++; w = Math.floor(sw / c); hh = Math.floor(sh / c); }
    return { c, w: Math.max(60, w), h: Math.max(40, hh) };
  }
  function layout(first) {
    const g = gridFor();
    if (first) Sim.alloc(g.w, g.h); else if (g.w !== W || g.h !== H) { const d = Sim.pack(); Sim.unpack(d, g.w, g.h); }
    W = g.w; H = g.h; cs = g.c;
    Render.init($('#sim'), $('#glow'), $('#bg'), W, H);
    fx.width = W; fx.height = H;
    field.style.width = (W * cs) + 'px'; field.style.height = (H * cs) + 'px';
  }
  function rockTile() {
    const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d');
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) { const n = r(); const b = 96 + ((i * 7 + j * 3) % 11) + (n < .15 ? 14 : n > .9 ? -16 : 0); x.fillStyle = 'rgb(' + b + ',' + (b + 4) + ',' + (b + 16) + ')'; x.fillRect(i, j, 1, 1); }
    x.fillStyle = '#464c60'; for (let k = 0; k < 7; k++) { let px = (r() * 48) | 0, py = (r() * 48) | 0; for (let t = 0; t < 12; t++) { x.fillRect(px, py, 1, 1); px += (r() < .5 ? 1 : 0); py += (r() < .6 ? 1 : (r() < .5 ? -1 : 0)); } }
    x.fillStyle = '#7a8298'; for (let k = 0; k < 30; k++) x.fillRect((r() * 48) | 0, (r() * 48) | 0, 2, 1);
    return c.toDataURL();
  }
  function newWorld(kind) {
    Sim.generate(kind, { plain: G.camp && prog.day === 1 && !prog.finished });
    Sim.stats.blasts = Sim.stats.lightning = Sim.stats.meteors = 0;
    G.weather = Sim.weather = 0; Sim.wind = G.wind = 0; undoStack.length = 0;
  }

  /* ---------- вкладки интерфейса ---------- */
  const hud = $('#hud'), bar = $('#bar'), panel = $('#panel');
  const slotDefs = [
    { id: 'el', icon: () => iconOf(G.sel), act: () => openPanel('elements') },
    { id: 'br', icon: () => Icons.ui(MODE_ICON[G.mode] || 'brush'), act: () => openPanel('brush') },
    { id: 'er', icon: () => Icons.ui('eraser'), act: toggleErase },
    { id: 'ln', icon: () => Icons.ui('lens'), act: () => { G.lens = !G.lens; Render.lens = G.lens; updateHud(); Snd.sfx('tap'); } },
    { id: 'we', icon: () => Icons.ui('cloud'), act: () => openPanel('weather') },
    { id: 'wo', icon: () => Icons.ui('globe'), act: () => openPanel('world') },
    { id: 'sg', icon: () => Icons.ui('sage'), act: () => openPanel('goals') },
    { id: 'pl', icon: () => Icons.ui(G.paused ? 'play' : 'pause'), act: () => { G.paused = !G.paused; updateHud(); Snd.sfx('tap'); } }
  ];
  const slotEls = {};
  slotDefs.forEach((s) => { const b = h('button', 'slot pb'); b.appendChild(img(s.icon())); b.onclick = () => { Snd.init(); Snd.resume(); Snd.sfx('tap'); s.act(); }; hud.appendChild(b); slotEls[s.id] = b; });
  function updateHud() {
    slotDefs.forEach((s) => { const b = slotEls[s.id]; b.firstChild.src = s.icon(); });
    slotEls.er.classList.toggle('on', G.sel === 't:ERASE'); slotEls.ln.classList.toggle('on', G.lens);
    slotEls.pl.classList.toggle('on', G.paused); slotEls.el.classList.toggle('on', openedPanel === 'elements'); slotEls.br.classList.toggle('on', openedPanel === 'brush');
    slotEls.we.classList.toggle('on', openedPanel === 'weather' || G.weather > 0); slotEls.wo.classList.toggle('on', openedPanel === 'world'); slotEls.sg.classList.toggle('on', openedPanel === 'goals');
    let bd = slotEls.sg.querySelector('.badge'); if (G.camp) { if (!bd) { bd = h('span', 'badge'); slotEls.sg.appendChild(bd); } bd.textContent = prog.finished ? '★' : 'Д' + prog.day; } else if (bd) bd.remove();
    $('#paused').style.display = G.paused ? 'block' : 'none'; $('#stepbtn').style.display = G.paused ? 'flex' : 'none';
    bar.querySelectorAll('.hot').forEach((b) => b.classList.toggle('on', b.dataset.k === G.sel));
  }
  const stepBtn = $('#stepbtn'); stepBtn.className = 'pb'; stepBtn.appendChild(img(Icons.ui('step'))); stepBtn.onclick = () => Sim.step();
  function toggleErase() { if (G.sel === 't:ERASE') select(G.last && G.last !== 't:ERASE' ? G.last : 'WATER', true); else { G.last = G.sel; select('t:ERASE', true); } }
  function select(k, quiet) {
    if (!exists(k)) return; if (!isUnlocked(k)) { toast(lockHint(k)); Snd.sfx('nope'); return; }
    G.sel = k; if (k !== 't:ERASE') { G.hot = [k].concat(G.hot.filter((x) => x !== k)).slice(0, 5); }
    saveSet(); renderBar(); updateHud(); if (!quiet) Snd.sfx('pop');
  }
  /* нижняя панель: недавние элементы */
  const undoStack = []; let speeds = [.5, 1, 2, 3], spIdx = 1;
  function renderBar() {
    bar.innerHTML = '';
    const u = h('button', 'mini pb'); u.appendChild(img(Icons.ui('undo'))); u.onclick = undo; bar.appendChild(u);
    G.hot.filter(exists).forEach((k) => {
      const b = h('button', 'hot pb'); b.dataset.k = k; b.appendChild(img(iconOf(k), 'el')); b.appendChild(h('span', '', nameOf(k)));
      b.onclick = () => { if (isUnlocked(k)) { G.sel = k; saveSet(); updateHud(); Snd.sfx('tap'); } else { toast(lockHint(k)); Snd.sfx('nope'); } }; bar.appendChild(b);
    });
    const sp = h('button', 'mini pb'); sp.appendChild(img(Icons.ui('speed'))); sp.appendChild(h('small', '', '×' + speeds[spIdx])); sp.onclick = () => { spIdx = (spIdx + 1) % speeds.length; G.speed = speeds[spIdx]; renderBar(); Snd.sfx('tap'); }; bar.appendChild(sp);
    updateHud();
  }
  function loadPack(d) { Sim.unpack(d, W, H); }
  function pushUndo() { undoStack.push(Sim.pack()); if (undoStack.length > 8) undoStack.shift(); }
  function undo() { if (!undoStack.length) { toast('Отменять нечего'); return; } const d = undoStack.pop(); loadPack(d); Snd.sfx('tap'); }

  /* ---------- панели ---------- */
  let openedPanel = '';
  function closePanel() { openedPanel = ''; panel.classList.remove('open'); updateHud(); }
  function openPanel(name, force) {
    if (!force && openedPanel === name) { closePanel(); return; }
    openedPanel = name; panel.innerHTML = ''; panel.dataset.kind = name;
    const titles = { elements: 'Элементы', brush: 'Кисть', weather: 'Небо и погода', world: 'Мир', goals: G.camp ? 'Цели дня' : 'Мудрец', settings: 'Настройки' };
    const hd = h('div', 'phead'); hd.appendChild(h('span', '', titles[name])); const x = h('button', 'x'); x.appendChild(img(Icons.ui('close'))); x.onclick = closePanel; hd.appendChild(x);
    const body = h('div', 'pbody'); panel.append(hd, body);
    ({ elements: pElements, brush: pBrush, weather: pWeather, world: pWorld, goals: pGoals, settings: pSettings })[name](body);
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
    /* время суток: ползунок и подпись, которая показывает час и часть суток */
    const lab = h('div', 'lbl', ''), sl = h('div', 'sl'), rg = h('input'), val = h('b', '', ''), tr = h('div', 'row');
    rg.type = 'range'; rg.min = 0; rg.max = 1439;
    const showT = () => { const p = Sky.label().split(' · '); lab.textContent = 'Время суток: ' + p[1]; val.textContent = p[0]; };
    rg.oninput = () => { timeUI.drag = true; Sky.set({ time: rg.value / 1440 }); showT(); };
    rg.onchange = () => { timeUI.drag = false; saveSet(); };
    timeUI = { rg, showT: () => { rg.value = Math.round(Sky.time * 1440) % 1440; showT(); }, drag: false }; timeUI.showT();
    sl.append(rg, val); tr.append(lab, sl); body.appendChild(tr);
    mk('Ход времени', [[true, 'Идёт', 'play'], [false, 'Стоит', 'pause']], () => G.tcycle, (v) => { G.tcycle = v; Sky.set({ auto: v }); saveSet(); });
    mk('Погода', [[0, 'Ясно', 'sun'], [1, 'Дождь', 'cloud'], [2, 'Снег', 'snow'], [3, 'Гроза', 'bolt']], () => G.weather, (v) => { G.weather = Sim.weather = v; if (v === 3) G.stormed = true; });
    mk('Ветер', [[-1, '← Влево'], [0, 'Штиль'], [1, 'Вправо →']], () => G.wind, (v) => { G.wind = Sim.wind = v; });
    mk('Фон по местности', [['auto', 'Авто'], ['forest', 'Лес'], ['desert', 'Пустыня'], ['snow', 'Снег'], ['rock', 'Горы'], ['volcano', 'Вулкан'], ['sea', 'Море'], ['cave', 'Пещера']], () => G.biome, (v) => { G.biome = v; Sky.set({ lock: v }); saveSet(); });
    body.appendChild(h('div', 'hint', 'Авто: горы и холмы за миром подстраиваются под то, что лежит на земле.'));
  }
  function pWorld(body) {
    const col = h('div', 'row'); body.appendChild(col);
    const add = (t, ic, f, cls) => { const b = btn(t, false, 'wide ' + (cls || ''), ic); b.onclick = f; col.appendChild(b); };
    add('Новый остров', 'globe', () => confirmBox('Начать новый остров? Текущий мир пропадёт.', () => { pushUndo(); newWorld('island'); closePanel(); }));
    add('Новое море', 'drop', () => confirmBox('Создать пустое море?', () => { pushUndo(); newWorld('sea'); closePanel(); }));
    add('Пустота', 'eraser', () => confirmBox('Очистить весь мир?', () => { pushUndo(); newWorld('void'); closePanel(); }));
    add('Сохранить в галерею', 'save', () => { closePanel(); galleryModal(true); });
    add('Галерея', 'folder', () => { closePanel(); galleryModal(false); });
    add('Настройки', 'gear', () => openPanel('settings', true));
    add('Главное меню', 'home', () => { closePanel(); showTitle(); });
  }
  function pSettings(body) {
    const mk = (title, opts, cur, set) => { const r = h('div', 'row'); r.appendChild(h('div', 'lbl', title)); opts.forEach((o) => { const b = btn(o[1], cur() === o[0], '', o[2]); b.onclick = () => { set(o[0]); Snd.sfx('tap'); openPanel('settings', true); }; r.appendChild(b); }); body.appendChild(r); };
    mk('Звук', [[true, 'Вкл', 'sound'], [false, 'Выкл', 'mute']], () => G.sound, (v) => { G.sound = v; Snd.on = v; saveSet(); });
    mk('Размер пикселя', [[0, 'Авто'], [5, 'Крупный'], [4, 'Средний'], [3, 'Мелкий'], [2, 'Тонкий']], () => G.cs, (v) => { G.cs = v; saveSet(); layout(false); });
    const r = h('div', 'row'); const b = btn('Сбросить кампанию', false, 'red wide'); b.onclick = () => confirmBox('Стереть весь прогресс кампании?', () => { prog = { day: 1, unlocked: ['EARTH', 'WATER', 'STONE', 't:HUMAN'], done: {}, finished: false }; saveProg(); renderBar(); toast('Прогресс сброшен'); }); r.appendChild(b); body.appendChild(r);
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
    if (e) { const r = field.getBoundingClientRect(); ring.style.left = (e.clientX - r.left) + 'px'; ring.style.top = (e.clientY - r.top) + 'px'; }
    const d = (G.size * 2 + 1) * cs; ring.style.width = d + 'px'; ring.style.height = d + 'px'; ring.classList.toggle('sq', G.shape === 'sq');
    const show = !isTool(G.sel) || ['ERASE', 'HEAT', 'COLD', 'WIND'].indexOf(G.sel.slice(2)) >= 0;
    ring.style.display = (keep && !ptr.inside) ? 'none' : (show ? 'block' : 'none');
  }
  function stamp(x, y, first) {
    const k = G.sel, sq = G.shape === 'sq';
    if (isTool(k)) {
      const t = k.slice(2);
      if (t === 'ERASE') Sim.paint(x, y, G.size, 0, sq, true, 1);
      else if (t === 'LIGHTNING') { if (first || ptr.held % 28 === 0) Sim.lightning(x); }
      else if (t === 'METEOR') { if (first || ptr.held % 40 === 0) { const vx = (Math.random() < .5 ? -1 : 1) * (1 + Math.random() * .6), vy = 2; const x0 = x - vx * (y / vy); Sim.meteor(Math.max(3, Math.min(W - 4, x0)), vx > 0 ? 1 : -1, vx); } }
      else if (t === 'BLAST') { if (first || ptr.held % 22 === 0) Sim.blast(x, y, 3 + G.size, .9); }
      else if (t === 'HUMAN' || t === 'ZOMBIE' || TOOLS[t].form) { if (first || ptr.held % 36 === 0) { const f = TOOLS[t].form || People.randomForm(), F = People.FORMS[f]; Sim.spawnEnt(x, y, t === 'ZOMBIE', f, F && F.abil); } }
      else if (t === 'HEAT') Sim.heatArea(x, y, G.size, 90);
      else if (t === 'COLD') Sim.heatArea(x, y, G.size, -90);
      else if (t === 'WIND') { Sim.pushArea(x, y, G.size + 2, ptr.x - ptr.lx, ptr.y - ptr.ly); }
      return;
    }
    const id = E[k], solid = KIND[id] === K.SOLID || KIND[id] === K.SPEC;
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
    Snd.init(); Snd.resume(); field.setPointerCapture(e.pointerId); const [x, y] = cellOf(e);
    ptr.down = true; ptr.type = e.pointerType; ptr.x = ptr.lx = ptr.sx = x; ptr.y = ptr.ly = ptr.sy = y; ptr.held = 0; ptr.inside = true;
    if (openedPanel) closePanel();
    pushUndo();
    const shape = (G.mode === 'line' || G.mode === 'rect') && !isTool(G.sel) || (G.mode === 'line' || G.mode === 'rect') && G.sel === 't:ERASE';
    if (G.mode === 'fill' && !isTool(G.sel)) floodFill(x, y); else if (!shape) stamp(x, y, true);
    showRing(e); e.preventDefault();
  });
  field.addEventListener('pointermove', (e) => {
    const [x, y] = cellOf(e); ptr.inside = true; ptr.lx = ptr.x; ptr.ly = ptr.y; ptr.x = x; ptr.y = y;
    if (e.pointerType === 'mouse' || ptr.down) showRing(e);
    if (ptr.down) {
      if (G.mode === 'line' || G.mode === 'rect') { if (!isTool(G.sel) || G.sel === 't:ERASE') previewShape(ptr.sx, ptr.sy, x, y); }
      else if (G.mode === 'brush' || isTool(G.sel)) { if (!isTool(G.sel) || ['ERASE', 'HEAT', 'COLD'].indexOf(G.sel.slice(2)) >= 0) strokeLine(ptr.lx, ptr.ly, x, y, (a, b) => stamp(a, b, false)); }
    }
    infoAt(x, y, e);
  });
  const endStroke = (e) => {
    if (!ptr.down) return; ptr.down = false;
    if ((G.mode === 'line' || G.mode === 'rect') && (!isTool(G.sel) || G.sel === 't:ERASE')) { const [x, y] = cellOf(e); commitShape(ptr.sx, ptr.sy, x, y); }
    if (e.pointerType !== 'mouse') ring.style.display = 'none'; info.classList.remove('on');
  };
  field.addEventListener('pointerup', endStroke); field.addEventListener('pointercancel', endStroke);
  field.addEventListener('pointerleave', () => { ptr.inside = false; if (!ptr.down) { ring.style.display = 'none'; info.classList.remove('on'); } });
  field.addEventListener('contextmenu', (e) => e.preventDefault());
  let infoT = 0;
  function infoAt(x, y, e) {
    const now = performance.now(); if (now - infoT < 90) return; infoT = now;
    if (e.pointerType !== 'mouse' && !ptr.down) return;
    const i = y * W + x, t = Sim.A.type[i]; const T = Sim.A.Tm[i];
    info.textContent = (t === AIR ? 'Воздух' : NAME[t] || '') + ' · ' + Math.round(T) + '°'; info.classList.add('on');
  }

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
    mb('Кампания', 'star', prog.finished ? 'пройдена' : 'день ' + prog.day, () => startGame(true));
    mb('Галерея', 'folder', '', () => { galleryModal(false); });
    const tb = h('div', 'tbar'); const snd = h('button', 'mini pb'); const sIc = img(Icons.ui(G.sound ? 'sound' : 'mute')); snd.appendChild(sIc);
    snd.onclick = () => { G.sound = !G.sound; Snd.on = G.sound; sIc.src = Icons.ui(G.sound ? 'sound' : 'mute'); saveSet(); Snd.init(); };
    tb.appendChild(snd); const bottom = h('div'); bottom.style.cssText = 'display:flex;flex-direction:column;align-items:center'; bottom.append(menu, tb);
    title.append(top, hero, bottom);
  }
  let titleTimer = 0;
  function showTitle() { buildTitle(); title.classList.remove('hide'); $('#app').classList.add('intitle'); autosave(); }
  function startGame(camp, keepWorld) {
    G.camp = !!camp; title.classList.add('hide'); $('#app').classList.remove('intitle'); hideModal();
    if (!keepWorld) {
      const d = store.get(camp ? 'autoc' : 'auto', null);
      if (d) { try { loadPack(d); } catch (e) { newWorld('island'); } } else newWorld('island');
      if (camp && !d) { /* новый мир кампании */ }
    }
    if (camp && !prog.unlocked) prog.unlocked = ['EARTH', 'WATER', 'STONE'];
    if (camp && prog.unlocked.indexOf(G.sel) < 0 && !isTool(G.sel)) select(prog.unlocked[1] || 'WATER', true);
    updateHud(); renderBar(); closePanel();
    if (camp && !prog.finished) setTimeout(() => openPanel('goals', true), 500);
    else if (!camp) toast('Выбери элемент вверху и води пальцем по миру');
  }
  function autosave() {
    if (title && !title.classList.contains('hide') && !G.dirty) { /* заставка: сохраняем как есть */ }
    try { store.set(G.camp ? 'autoc' : 'auto', Sim.pack()); saveSet(); } catch (e) { }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) autosave(); });
  setInterval(() => { if (!document.hidden && title.classList.contains('hide')) autosave(); }, 20000);

  /* ---------- главный цикл ---------- */
  let last = performance.now(), acc = 0, frameN = 0;
  Sim.sfx = (n, v) => Snd.sfx(n, v);
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(100, now - last); last = now;
    if (!G.paused) { acc += dt * G.speed; Sky.advance(dt * G.speed); } const stepMs = 1000 / 60; let n = 0;
    while (acc >= stepMs && n < 5) { Sim.step(); acc -= stepMs; n++; } if (n === 5) acc = 0;
    if (ptr.down && !G.paused || (ptr.down && G.paused)) { ptr.held++; if (G.mode === 'brush' || isTool(G.sel)) { if (G.sel !== 't:WIND' && !(isTool(G.sel) && G.sel.slice(2) === 'METEOR' && ptr.held % 40)) stamp(ptr.x, ptr.y, false); } }
    Render.draw(Sim);
    const sh = Sim.shake; field.style.transform = sh > .3 ? 'translate(' + ((Math.random() - .5) * sh * cs * .5).toFixed(1) + 'px,' + ((Math.random() - .5) * sh * cs * .5).toFixed(1) + 'px)' : '';
    $('#flash').style.opacity = Sim.bolts.length ? (Math.max.apply(null, Sim.bolts.map((b) => b.ttl)) / 8 * .22).toFixed(2) : 0;
    frameN++;
    if (frameN % 6 === 0) { Snd.update(Sim.act, Sim.weather); Sim.act.p = Sim.act.l = Sim.act.f = 0; }
    if (frameN % 45 === 0) checkGoals();
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
    else if (e.key === 'e') toggleErase(); else if (e.key === 't') { G.lens = !G.lens; Render.lens = G.lens; updateHud(); }
  });

  /* ---------- старт ---------- */
  document.documentElement.style.setProperty('--vine', 'url(' + Icons.vine() + ')');
  stage.style.backgroundImage = 'url(' + rockTile() + ')'; stage.style.backgroundSize = '144px 144px'; stage.style.imageRendering = 'pixelated';
  Snd.on = G.sound;
  Sky.set({ time: G.time, auto: G.tcycle, lock: G.biome, day: G.sday });
  layout(true); newWorld('island');
  const auto = store.get('auto', null); if (auto) { try { loadPack(auto); } catch (e) { } }
  if (!exists(G.sel)) G.sel = 'WATER';
  renderBar(); updateHud(); buildTitle(); $('#app').classList.add('intitle'); fixK(document.body);
  if (window.Telegram && Telegram.WebApp) { try { Telegram.WebApp.ready(); Telegram.WebApp.expand(); } catch (e) { } }
  requestAnimationFrame(loop);
  window.Pixelia = { G, Sim, Render, Sky, People, select, openPanel, startGame, toast, prog, checkGoals, layout, DAYS };
})();
