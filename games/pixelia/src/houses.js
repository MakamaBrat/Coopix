'use strict';
/* ПИКСЕЛИЯ — дома человечков.
   Дом — разрез, как кукольный домик: 1–3 этажа по 1–2 комнаты. У каждой комнаты своя роль (жилая, церковь, библиотека,
   таверна, мастерская) и своя обстановка из нарезанных деталей (houseassets.js, HSA).
   Что где лежит:
   - перекрытия этажей — настоящие клетки дерева в мире (по ним ходят, они горят и ломаются; когда их остаётся меньше половины, дом рушится);
   - задняя стена, окна, двери, мебель — на слое #bld между фоном и миром, поэтому вода и песок внутри дома видны;
   - доски перекрытий, столбы, крыша, труба с дымом — на слое людей перед человечками (drawFg).
   Между этажами ходят через дверь в задней стене: человечек подходит к двери и выходит из такой же двери на нужном этаже.
   Размеры в клетках мира; на слоях людей и домов 1 клетка = 2 точки. */
const Houses = (function () {
  const RW = 24, FH = 17;   /* ширина комнаты и высота этажа, клеток */
  const ROLES = {
    home: { n: 'Жилая', badge: 'home', ins: 'жильём' }, church: { n: 'Церковь', badge: 'scales', ins: 'церковью' }, library: { n: 'Библиотека', badge: 'book', ins: 'библиотекой' },
    tavern: { n: 'Таверна', badge: 'beers', ins: 'таверной' }, workshop: { n: 'Мастерская', badge: 'bag', ins: 'мастерской' }
  };
  const list = [];
  let S = null, cv = null, cx = null, LW = 0, LH = 0, nextId = 1, bgDirty = true, bgKey = '', ready = false;
  const img = {}, tex = {};

  /* ---------- картинки ---------- */
  function load() {
    if (typeof HSA === 'undefined' || Object.keys(img).length) return;
    const keys = Object.keys(HSA); let n = 0;
    for (const k of keys) {
      const im = new Image();
      im.onload = () => {
        if (k.startsWith('roof_')) { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); tex[k] = { d: x.getImageData(0, 0, im.width, im.height).data, w: im.width, h: im.height }; }
        if (++n === keys.length) { ready = true; for (const b of list) b.ver++; bgDirty = true; }
      };
      im.src = HSA[k]; img[k] = im;
    }
  }
  const pat = {};
  function pattern(c, k) { const key = k; if (!pat[key] && img[k]) pat[key] = c.createPattern(img[k], 'repeat'); return pat[key]; }

  /* ---------- геометрия ---------- */
  const floorRow = (b, f) => b.g - f * FH;           /* ряд клеток пола этажа f (0 — земля, 1.. — перекрытия) */
  const standY = (b, f) => floorRow(b, f) - 1;        /* где стоят ноги человечка на этаже f */
  const doorX = (b) => b.x0 + 6;                      /* дверь в задней стене первой комнаты, клетка по x */
  const roomX = (b, i) => b.x0 + 1 + i * RW;          /* левый край комнаты, клетка */
  const byId = (id) => list.find((b) => b.id === id) || null;
  /* на каком этаже стоит человечек внутри дома (или -1) */
  function floorOf(b, e) {
    if (e.x < b.x0 - .5 || e.x > b.x0 + b.w + .5) return -1;
    const y = Math.round(e.y);
    for (let f = 0; f <= b.nf; f++) if (Math.abs(y - standY(b, f)) <= 2) return f < b.nf ? f : -1;
    return -1;
  }
  function where(e) { for (const b of list) { const f = floorOf(b, e); if (f >= 0) return { b, f }; } return null; }
  /* место под дом шириной w и высотой h клеток недалеко от x (ищет вправо и влево). Земля может гулять на ±3 клетки —
     площадку потом выровняют; растения на месте стройки не мешают (их расчистят), вода и чужие дома — мешают */
  const plant = (i) => { const t = S.A.type[i]; return t === E.LEAF || t === E.SEED || t === E.CONE || t === E.FSEED || t === E.SPROUT || t === E.LITTER || t === E.SNOW || (t === E.WOOD && S.A.aux[i] !== 0); };
  function groundAt(x) {
    const A = S.A, W = S.W, H = S.H;
    for (let y = 8; y < H - 1; y++) {
      const i = y * W + x, t = A.type[i]; if (t === E.AIR || plant(i)) continue;
      if (KIND[t] === K.LIQUID || KIND[t] === K.GAS) return KIND[t] === K.GAS ? -2 : -1;
      return (KIND[t] === K.SOLID || KIND[t] === K.POWDER) ? y : -1;
    }
    return -1;
  }
  function findSite(x, w, h, maxD) {
    const A = S.A, W = S.W;
    for (let d = 0; d <= (maxD || 120); d += 3) for (const sg of [1, -1]) {
      if (!d && sg < 0) continue;
      const x0 = Math.round(x - w / 2 + sg * d); if (x0 < 4 || x0 + w > W - 4) continue;
      if (list.some((b) => x0 < b.x0 + b.w + 5 && x0 + w + 5 > b.x0)) continue;
      const gs = []; let ok = true;
      for (let k = 0; k < w && ok; k++) { const gk = groundAt(x0 + k); if (gk < 0) ok = false; else gs.push(gk); }
      if (!ok) continue;
      const srt = gs.slice().sort((a, b) => a - b), g = srt[srt.length >> 1];
      if (srt[srt.length - 1] - g > 3 || g - srt[0] > 3 || g - h < 6) continue;
      for (let k = 0; k < w && ok; k++) for (let y = g - h; y < Math.min(g, gs[k]); y++) { const i = y * W + x0 + k; if (A.type[i] !== E.AIR && !plant(i)) { ok = false; break; } }
      if (ok) return { x0, g, gs };
    }
    return null;
  }
  /* выровнять площадку: ямы засыпать землёй, бугры срезать, растения убрать */
  function level(b, gs, h) {
    const W = S.W;
    for (let k = 0; k < b.w; k++) {
      const x = b.x0 + k, gk = gs ? gs[k] : b.g;
      for (let y = b.g; y < gk; y++) S.put(y * W + x, E.EARTH);
      for (let y = b.g - h; y < b.g; y++) { const i = y * W + x; if (S.A.type[i] !== E.AIR) S.put(i, E.AIR); }
    }
  }
  /* новый дом (пока стройплощадка): rooms — роли по порядку, снизу вверх и слева направо */
  function create(soc, site, nr, roles, style, roof) {
    const nf = Math.ceil(roles.length / nr), w = nr * RW + 2;
    const b = { id: nextId++, soc, x0: site.x0, g: site.g, nr, nf, w, style, roof, prog: 0, done: false, placed: 0, ver: 0, doors: {}, mask: '', name: '', cache: null, seed: (Math.random() * 1e6) | 0,
      rooms: roles.map((role, k) => ({ f: (k / nr) | 0, i: k % nr, role, owners: [] })) };
    b.name = nameOf(b);
    level(b, site.gs, nf * FH + 2);
    list.push(b); bgDirty = true; return b;
  }
  function nameOf(b) {
    const rs = b.rooms.map((r) => r.role), uniq = [...new Set(rs)];
    if (uniq.length === 1) return uniq[0] === 'home' ? (b.rooms.length > 1 ? 'Большой дом' : 'Домик') : ROLES[uniq[0]].n;
    const civ = uniq.filter((r) => r !== 'home');
    if (civ.length === 1) return ROLES[civ[0]].n + ' с жильём';
    return 'Дом с ' + civ.map((r) => ROLES[r].ins).join(' и ');
  }
  /* клетки перекрытий по порядку укладки: этаж за этажом, слева направо */
  function slabCells(b) { const out = []; for (let f = 1; f <= b.nf; f++) { const y = floorRow(b, f); for (let x = b.x0; x < b.x0 + b.w; x++) out.push(y * S.W + x); } return out; }
  /* стройка: prog 0..1; перекрытия кладутся по мере готовности, крыша и обстановка — в конце */
  function build(b, dp) {
    if (b.done) return true;
    b.prog = Math.min(1, b.prog + dp);
    const cells = slabCells(b), need = Math.min(cells.length, Math.floor(cells.length * Math.min(1, b.prog / .75)));
    while (b.placed < need) { const i = cells[b.placed++]; if (S.A.type[i] !== E.WOOD) S.put(i, E.WOOD); S.A.aux[i] = 0; }
    const stage = Math.floor(b.prog * 10); if (stage !== b.stage) { b.stage = stage; b.ver++; bgDirty = true; }
    if (b.prog >= 1) { b.done = true; b.ver++; bgDirty = true; return true; }
    return false;
  }
  function remove(b) { const k = list.indexOf(b); if (k >= 0) list.splice(k, 1); bgDirty = true; }
  /* шаг: двери закрываются, обломки летят; у готовых домов — огонь (раз в 6 тактов) и опора (раз в 12); у недостроенных —
     целы ли уложенные перекрытия. Перекрытия сверяются раз в полсекунды, чтобы доски рисовались только над целыми клетками */
  function step(sim, onCollapse) {
    S = sim;
    for (const b of list) for (const f in b.doors) if (b.doors[f] > 0 && --b.doors[f] === 0) { b.ver++; bgDirty = true; }
    debrisStep();
    for (let k = list.length - 1; k >= 0; k--) {
      const b = list[k];
      if (b.ch && b.cache) {
        if (S.frame % 6 === 0) fireStep(b);
        if (S.frame % 18 === 3) supportStep(b);
        if (!b.ruin && b.ch.left < b.ch.total * .25) { b.ruin = true; if (onCollapse) onCollapse(b); }
        if (b.ch.left <= 0) { list.splice(k, 1); bgDirty = true; continue; }
      }
      if (S.frame % 30) continue;
      const cells = slabCells(b).slice(0, b.placed); if (!cells.length) continue;
      let ok = 0, mask = ''; for (let q = 0; q < cells.length; q++) { const w = S.A.type[cells[q]] === E.WOOD; if (w) ok++; if ((q & 3) === 0) mask += w ? 1 : 0; }
      if (mask !== b.mask) { b.mask = mask; b.ver++; }
      if (!b.done && ok < cells.length * .5) { list.splice(k, 1); bgDirty = true; if (onCollapse) onCollapse(b); }
    }
  }
  /* ---------- разрушение: дом поделён на куски 8x8 точек (4x4 клетки) ----------
     Куски горят (греются от огня рядом, обугливаются, сами поджигают соседей, осыпаются пеплом), отрываются, когда
     под ними и сбоку нет опоры, вылетают от взрывов. Оторванный кусок — летящий обломок с картинкой дома; упав, он
     становится клетками мира (дерево, камень, пепел). Когда целого остаётся меньше трети, дом считается разрушенным:
     жильцы теряют жильё, остальное осыпается. */
  const CH = 8, debris = [];
  function initChunks(b, bgc, fgc) {
    const nx = Math.ceil(bgc.width / CH), ny = Math.ceil(bgc.height / CH), A = bgc.getContext('2d').getImageData(0, 0, bgc.width, bgc.height).data, F = fgc.getContext('2d').getImageData(0, 0, fgc.width, fgc.height).data;
    const has = new Uint8Array(nx * ny), mat = new Uint8Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let n = 0;
      for (let y = j * CH; y < Math.min(bgc.height, j * CH + CH); y++) for (let x = i * CH; x < Math.min(bgc.width, i * CH + CH); x++) { const o = (y * bgc.width + x) * 4 + 3; if (A[o] > 40 || F[o] > 40) n++; }
      if (n < 10) continue;
      has[j * nx + i] = 1;
      /* из чего кусок: камень — фундамент и каменные комнаты, остальное — дерево */
      const lx = b.cache.x + i * CH + 4, ly = b.cache.y + j * CH + 4, f = Math.floor((b.g * 2 - ly) / (FH * 2)), ri = Math.floor((lx - b.x0 * 2 - 2) / (RW * 2));
      const r = b.rooms.find((q) => q.f === f && q.i === ri);
      /* камень: фундамент и цоколь (нижние 8 точек над землёй), каменные комнаты; угловые столбы — дерево, но горят втрое медленнее (2) */
      const post = lx < b.x0 * 2 + 5 || lx > (b.x0 + b.w) * 2 - 5;
      mat[j * nx + i] = ly >= b.g * 2 - 9 || (r && (r.role === 'church' || b.style === 'stone')) ? 1 : post ? 2 : 0;
    }
    let total = 0; for (const v of has) total += v;
    b.ch = { nx, ny, has, mat, alive: has.slice(), heat: new Float32Array(nx * ny), char: new Uint8Array(nx * ny), total, left: total };
  }
  /* мёртвые куски вырезаются из кэша, обугленные затемняются */
  function applyChunks(b, cs) {
    const C = b.ch; if (!C) return;
    for (const c of cs) {
      const x = c.getContext('2d');
      for (let k = 0; k < C.has.length; k++) {
        if (!C.has[k]) continue; const i = k % C.nx, j = (k / C.nx) | 0;
        if (!C.alive[k]) x.clearRect(i * CH, j * CH, CH, CH);
        else if (C.char[k]) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = C.char[k] > 1 ? 'rgba(22,10,8,.78)' : 'rgba(40,18,10,.5)'; x.fillRect(i * CH, j * CH, CH, CH); x.globalCompositeOperation = 'source-over'; }
      }
    }
    if (b.cache) b.cache.glows = b.cache.glowsAll.filter(([gx, gy, w, h]) => { const i = ((gx + w / 2) / CH) | 0, j = ((gy + h / 2) / CH) | 0, k = j * C.nx + i; return !C.has[k] || (C.alive[k] && !C.char[k]); });
  }
  /* картинка куска для обломка (до того, как он вырезан из кэша) */
  function chunkImg(b, k) {
    const C = b.ch, i = k % C.nx, j = (k / C.nx) | 0, c = document.createElement('canvas'); c.width = c.height = CH; const x = c.getContext('2d');
    x.drawImage(b.cache.bg, i * CH, j * CH, CH, CH, 0, 0, CH, CH); x.drawImage(b.cache.fg, i * CH, j * CH, CH, CH, 0, 0, CH, CH);
    if (C.char[k]) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(30,14,10,.6)'; x.fillRect(0, 0, CH, CH); }
    return c;
  }
  const chunkCells = (b, k) => { const C = b.ch, i = k % C.nx, j = (k / C.nx) | 0; return { x0: Math.floor((b.cache.x + i * CH) / 2), y0: Math.floor((b.cache.y + j * CH) / 2) }; };
  /* кусок погиб: убрать из кэша, доски перекрытий в нём — тоже; fly — улетает обломком с такой скоростью */
  function killChunk(b, k, fly, burnt) {
    const C = b.ch; if (!C.alive[k]) return;
    const img2 = fly && debris.length < 500 ? chunkImg(b, k) : null;
    C.alive[k] = 0; C.left--;
    const { x0, y0 } = chunkCells(b, k), W = S.W;
    for (let y = y0; y < y0 + 4; y++) for (let x = x0; x < x0 + 4; x++) { if (x < 1 || x >= W - 1 || y < 1 || y >= S.H - 1) continue; const i = y * W + x; if (S.A.type[i] === E.WOOD && S.A.aux[i] === 0 && isSlab(b, x, y)) S.put(i, E.AIR); }
    if (burnt && Math.random() < .6) { for (let q = 0; q < 1; q++) { const x = x0 + ((Math.random() * 4) | 0), y = y0 + 3; const i = y * W + x; if (x > 0 && x < W - 1 && S.A.type[i] === E.AIR) S.put(i, E.ASH); } }
    if (img2) { const i = k % C.nx, j = (k / C.nx) | 0; debris.push({ cv: img2, x: b.cache.x + i * CH, y: b.cache.y + j * CH, vx: fly[0], vy: fly[1], r: 0, vr: (Math.random() - .5) * .2, mat: burnt || C.char[k] ? 3 : C.mat[k] === 1 ? 1 : 0, t: 0 }); }
    applyChunks(b, [b.cache.bg, b.cache.fg]); b.cache.tint = {}; bgDirty = true;
  }
  const isSlab = (b, x, y) => x >= b.x0 && x < b.x0 + b.w && (b.g - y) % FH === 0 && y < b.g && y >= b.g - b.nf * FH;
  const hotAt = (x, y) => { if (x < 1 || x >= S.W - 1 || y < 1 || y >= S.H - 1) return false; const i = y * S.W + x, t = S.A.type[i]; return t === E.FIRE || t === E.LAVA || S.A.burn[i] !== 0; };   /* горячий воздух не считаем: иначе пламя перескакивает через всю комнату */
  const solidCell = (x, y) => { if (x < 1 || x >= S.W - 1 || y < 1) return true; if (y >= S.H - 1) return true; const t = S.A.type[y * S.W + x]; return t !== E.AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER); };
  /* огонь: раз в 6 тактов */
  function fireStep(b) {
    const C = b.ch, W = S.W;
    for (let k = 0; k < C.has.length; k++) {
      if (!C.alive[k]) continue;
      const { x0, y0 } = chunkCells(b, k);
      let hot = false; for (let y = y0 - 1; y <= y0 + 4 && !hot; y++) for (let x = x0 - 1; x <= x0 + 4; x++) if (hotAt(x, y)) { hot = true; break; }
      const wood = C.mat[k] !== 1, slow = C.mat[k] === 2 ? .35 : 1;
      if (hot) C.heat[k] += (wood ? .22 : .03) * slow; else if (!C.char[k] && C.heat[k] > 0) C.heat[k] = Math.max(0, C.heat[k] - .03);
      if (C.char[k]) {
        C.heat[k] += (wood ? .13 : .03) * slow;   /* горит сам: кусок прогорает секунд за 15 */
        if (C.char[k] === 1 && Math.random() < .07) { const x = x0 + ((Math.random() * 4) | 0), y = y0 + ((Math.random() * 4) | 0), i = y * W + x; if (x > 0 && x < W - 1 && S.A.type[i] === E.AIR) S.put(i, E.FIRE); }
        const i = k % C.nx, j = (k / C.nx) | 0;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= C.nx || jj >= C.ny) continue; const q = jj * C.nx + ii; if (C.alive[q]) C.heat[q] += (dj === -1 ? .09 : .035) * (C.mat[q] === 1 ? .2 : C.mat[q] === 2 ? .35 : 1); }   /* огонь ползёт по дереву, вверх быстрее */
        if (C.heat[k] > 12 && C.char[k] === 1) { C.char[k] = 2; applyChunks(b, [b.cache.bg, b.cache.fg]); b.cache.tint = {}; bgDirty = true; }
        if (C.heat[k] >= 22) killChunk(b, k, Math.random() < .35 ? [(Math.random() - .5) * .4, 0] : null, true);
      } else if (C.heat[k] >= 5) { C.char[k] = 1; applyChunks(b, [b.cache.bg, b.cache.fg]); b.cache.tint = {}; bgDirty = true; }
    }
  }
  /* опора: от кусков, что стоят на земле, по соседям; всё, до чего не дойти, понемногу отрывается и падает (сначала нижнее) */
  function supportStep(b) {
    const C = b.ch, seen = new Uint8Array(C.has.length), q = [];
    for (let k = 0; k < C.has.length; k++) {
      if (!C.alive[k]) continue; const j = (k / C.nx) | 0, bot = b.cache.y + (j + 1) * CH;
      if (bot < b.g * 2 - 2) continue;
      const { x0 } = chunkCells(b, k); let g = false; for (let x = x0; x < x0 + 4; x++) if (solidCell(x, b.g) || solidCell(x, b.g + 1)) { g = true; break; }
      if (g) { seen[k] = 1; q.push(k); }
    }
    while (q.length) { const k = q.pop(), i = k % C.nx, j = (k / C.nx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= C.nx || jj >= C.ny) continue; const n = jj * C.nx + ii; if (C.alive[n] && !seen[n]) { seen[n] = 1; q.push(n); } } }
    const loose = []; for (let k = 0; k < C.has.length; k++) if (C.alive[k] && !seen[k]) loose.push(k);
    loose.sort((a, c) => ((c / C.nx) | 0) - ((a / C.nx) | 0));
    const n = b.ruin ? 6 : 3; for (let t = 0; t < Math.min(n, loose.length); t++) killChunk(b, loose[t], [(Math.random() - .5) * .5, Math.random() * .4]);
    /* развалины: остальное осыпается тоже */
    if (b.ruin && !loose.length) { const al = []; for (let k = 0; k < C.has.length; k++) if (C.alive[k]) al.push(k); al.sort((a, c) => ((a / C.nx) | 0) - ((c / C.nx) | 0)); for (let t = 0; t < Math.min(4, al.length); t++) killChunk(b, al[t], [(Math.random() - .5) * .8, -Math.random() * .5]); }
  }
  /* взрыв, молния, метеорит (вызывается из Sim.blast): куски в радиусе вылетают, рядом — загораются */
  function blast(cx, cy, R, power) {
    for (const b of list) {
      const C = b.ch; if (!C || !b.cache) continue;
      if (cx < b.x0 - R - 6 || cx > b.x0 + b.w + R + 6) continue;
      for (let k = 0; k < C.has.length; k++) {
        if (!C.alive[k]) continue; const { x0, y0 } = chunkCells(b, k), dx = x0 + 2 - cx, dy = y0 + 2 - cy, d = Math.hypot(dx, dy);
        if (d < R * 1.25 + 2) { const s = (1.6 + power * 2.2) * (1 - d / (R * 1.25 + 3)) + .4, n = d || 1; killChunk(b, k, [dx / n * s * 2 + (Math.random() - .5), dy / n * s * 2 - 1.2 * s]); }
        else if (d < R + 4 && !C.mat[k]) C.heat[k] += 2.5 * power;
      }
    }
  }
  /* обломки: летят, крутятся, отскакивают, падая на людей — ранят; упав, становятся клетками */
  function debrisStep() {
    for (let n = debris.length - 1; n >= 0; n--) {
      const d = debris[n]; d.t++;
      d.vy = Math.min(5, d.vy + .14); d.vx *= .995; d.r += d.vr;
      const nx = d.x + d.vx, ny = d.y + d.vy, cx = Math.floor((nx + 4) / 2), by = Math.floor((ny + 8) / 2);
      if (solidCell(Math.floor((nx + (d.vx > 0 ? 8 : 0)) / 2), Math.floor((d.y + 4) / 2))) d.vx = -d.vx * .3;
      if (d.vy > 0 && (solidCell(cx, by) || d.t > 900)) {
        if (d.vy > 2.4 && Math.random() < .6) { d.vy = -d.vy * .28; d.vx *= .55; d.vr *= .5; continue; }
        settle(d, cx, by - 1); debris.splice(n, 1); continue;
      }
      d.x += d.vx; d.y = ny;
      /* по людям */
      const sp = Math.hypot(d.vx, d.vy);
      if (sp > 1.6 && S.ents) for (const e of S.ents) { if (e.dying || e.hitBy === d) continue; if (Math.abs(e.x - cx) < 2 && by > e.y - 13 && by <= e.y + 1) { e.hitBy = d; e.hp -= 9 * sp; e.hurt = 12; e.stun = Math.max(e.stun || 0, 10); e.kx = (e.kx || 0) + d.vx * .3; if (e.hp <= 0 && S.die) S.die(e, 'crush', 'завалило обломками'); } }
      if (d.y > S.H * 2 + 20) debris.splice(n, 1);
    }
  }
  function settle(d, x, y) {
    const W = S.W, t = d.mat === 1 ? E.STONE : d.mat === 3 ? E.ASH : E.WOOD;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, -1]]) {
      const xx = x + dx, yy = y + dy; if (xx < 1 || xx >= W - 1 || yy < 1 || yy >= S.H - 1) continue;
      const i = yy * W + xx; if (S.A.type[i] === E.AIR && (dy === 0 || Math.random() < .5)) { S.put(i, t); if (t === E.WOOD) S.A.aux[i] = 0; }
    }
  }
  function drawDebris(c, amb) {
    if (!debris.length) return;
    const br = (amb[0] + amb[1] + amb[2]) / 3; if (br < .97) c.filter = 'brightness(' + br.toFixed(2) + ')';
    for (const d of debris) { c.save(); c.translate(Math.round(d.x + 4), Math.round(d.y + 4)); c.rotate(d.r); c.drawImage(d.cv, -4, -4); c.restore(); }
    c.filter = 'none';
  }
  function useDoor(b, f0, f1) { b.doors[f0] = 26; b.doors[f1] = 26; b.ver++; bgDirty = true; }
  function clear() { list.length = 0; debris.length = 0; bgDirty = true; }
  /* после смены размера окна мир пересэмплирован: дома переезжают и перекрытия кладутся заново */
  function rescale(kx, ky) {
    debris.length = 0;
    for (const b of list) {
      b.x0 = Math.max(4, Math.min(S.W - b.w - 4, Math.round(b.x0 * kx))); b.g = Math.round(b.g * ky);
      /* старые перекрытия при пересэмплировании мира съехали в масштабе — внутри дома остаются только настоящие */
      for (let y = Math.max(1, b.g - b.nf * FH - 4); y < b.g; y++) for (let x = b.x0 - 1; x <= b.x0 + b.w; x++) { const i = y * S.W + x; if (S.A.type[i] === E.WOOD && S.A.aux[i] === 0 && !isSlab(b, x, y)) S.put(i, E.AIR); }
      const cells = slabCells(b).slice(0, b.placed); for (const i of cells) if (S.A.type[i] !== E.WOOD) { S.put(i, E.WOOD); S.A.aux[i] = 0; }
      b.ver++;
    }
    bgDirty = true;
  }

  /* ---------- обстановка комнат: детали и где они стоят (x — точек от левого края комнаты, y — от потолка; fl — стоит на полу) ---------- */
  const LAYOUT = {
    bed: { full: [['win_shut', 9, 4], ['picture', 30, 6], ['bed', 3, 0, 1], ['chest', 30, 0, 1], ['lantern', 22, 0], ['plant_hang', 42, 0]],
      door: [['win_shut', 26, 4], ['bed', 22, 0, 1], ['lantern', 38, 0]] },
    living: { full: [['fireplace', 2, 0, 1], ['pans', 31, 5], ['stool', 32, 0, 1], ['plant', 44 - 14, 0, 1, 'skip'], ['lantern', 22, 0]],
      door: [['fireplace', 20, 0, 1], ['lantern', 37, 0]] },
    library: { full: [['shelf_books', 2, 4], ['shelf_books2', 4, 15], ['shelf_books', 22, 4], ['table', 18, 0, 1], ['lamp', 26, -11, 1], ['stool2', 6, 0, 1], ['plant', 34, 0, 1, 'skip']],
      door: [['shelf_books', 22, 3], ['shelf_books2', 26, 14], ['table', 21, 0, 1], ['lamp', 30, -11, 1]] },
    church: { full: [['banner', 2, 2], ['win_stained', 16, 3], ['candles2', 36, 9], ['bench', 4, 0, 1], ['stool', 33, 0, 1], ['crystal', 34.5, -16, 1]],
      door: [['win_stained', 24, 2], ['bench', 21, 0, 1], ['candles2', 37, 8]] },
    tavern: { full: [['lantern', 9, 0], ['shelf_jars', 17, 5], ['barrel', 2, 0, 1], ['barrel2', 2, -13, 1], ['table2', 16, 0, 1], ['jug', 19, -11, 1], ['apples', 30, -11, 1], ['stool2', 37, 0, 1], ['flag_red', 41, 3, 0, 'skip']],
      door: [['shelf_jars', 22, 5], ['table2', 21, 0, 1], ['jug', 24, -11, 1], ['apples', 34, -11, 1], ['lantern', 40, 0]] },
    workshop: { full: [['pans', 4, 5], ['lantern_wall', 34, 4], ['chest', 2, 0, 1], ['table', 18, 0, 1], ['apples', 22, -11, 1], ['barrel2', 33, 0, 1], ['sack', 22 + 8, -11, 1, 'skip']],
      door: [['pans', 26, 5], ['barrel2', 21, 0, 1], ['sack', 35, 0, 1]] }
  };
  const BLANKET = ['#c8444e', '#4a78c8', '#5aa85a', '#c878c8', '#e0a040', '#6a5ac8'];
  function bed(c, x, y, col) {   /* кровать 24x9 рисуется кодом: на листах её нет отдельной деталью */
    const R = (xx, yy, w, h, s) => { c.fillStyle = s; c.fillRect(x + xx, y + yy, w, h); };
    R(0, 0, 3, 9, '#3a2010'); R(1, 1, 1, 7, '#8a5430');                  /* изголовье */
    R(21, 3, 3, 6, '#3a2010'); R(22, 4, 1, 4, '#8a5430');                /* изножье */
    R(2, 4, 20, 3, '#3a2010'); R(2, 4, 19, 2, '#f2e8d4');                /* матрас */
    R(3, 2, 6, 3, '#3a2010'); R(3, 2, 5, 2, '#fffaf0');                  /* подушка */
    R(9, 3, 12, 4, '#3a2010'); R(9, 3, 12, 3, col); R(9, 3, 12, 1, 'rgba(255,255,255,.35)');   /* одеяло */
    R(2, 7, 20, 1, '#5a3218'); R(3, 8, 2, 1, '#3a2010'); R(19, 8, 2, 1, '#3a2010');
  }
  function put(c, k, x, y) { const im = img[k]; if (im && im.complete) c.drawImage(im, Math.round(x), Math.round(y)); return im; }
  /* обстановка одной комнаты; rx, ceil, floor — точки на холсте дома */
  function furnish(c, b, r, rx, ceil, floor, hasDoor, glows) {
    const kind = r.role === 'home' ? (r.f === 0 && b.rooms.some((q) => q.role === 'home' && q.f > 0) ? 'living' : 'bed') : r.role;
    const L = LAYOUT[kind][hasDoor ? 'door' : 'full'];
    for (const [k, x, y, fl, opt] of L) {
      if (opt === 'skip') continue;
      if (k === 'bed') { const o = S && Life.byId ? null : null; bed(c, rx + x, floor - 9, BLANKET[(b.seed + r.i + r.f * 2) % BLANKET.length]); continue; }
      const im = img[k]; if (!im || !im.complete) continue;
      const px = rx + x, py = fl ? floor - im.height + y : ceil + y;
      c.drawImage(im, Math.round(px), Math.round(py));
      if (k.startsWith('win')) glows.push([px + 2, py + 2, im.width - 4, im.height - 4, 1]);
      if (k === 'lantern' || k === 'lamp' || k === 'lantern_wall' || k === 'candles2' || k === 'fireplace') glows.push([px, py, im.width, im.height, k === 'fireplace' ? 2 : 3]);
    }
    if (kind === 'living') r.chim = rx + (hasDoor ? 20 : 2) + 6;
  }

  /* ---------- отрисовка одного дома в два кэша: фон (стены, окна, мебель) и передний план (перекрытия, столбы, крыша) ---------- */
  function roofBox(b) { const L = b.x0 * 2 - 8, R = (b.x0 + b.w) * 2 + 8, half = (R - L) >> 1; return { L, R, half, h: Math.round(half * RS) + 10 }; }
  function render(b) {
    const rb = roofBox(b), top = floorRow(b, b.nf) * 2 - rb.h - 30, left = rb.L - 4, W2 = rb.R - rb.L + 8, bot = b.g * 2 + 8, H2 = bot - top;
    const mk = () => { const c = document.createElement('canvas'); c.width = W2; c.height = H2; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
    const [bgc, bg] = mk(), [fgc, fg] = mk(), glows = [];
    const ox = -left, oy = -top, X0 = b.x0 * 2 + ox, Wp = b.w * 2, room = RW * 2;
    const builtF = b.done ? b.nf : Math.min(b.nf, Math.floor(b.prog / .75 * b.nf + .001));
    /* задняя стена и обстановка по комнатам */
    for (const r of b.rooms) {
      const floor = floorRow(b, r.f) * 2 + oy, ceil = floor - FH * 2 + 2, rx = X0 + 2 + r.i * room;
      const wallA = b.done ? 1 : Math.max(0, Math.min(1, (b.prog - .2) / .5)); if (wallA <= 0) continue;
      bg.globalAlpha = wallA;
      const st = r.role === 'church' ? 'wall_stone' : 'wall_' + b.style, p = pattern(bg, st);
      if (p) { bg.save(); bg.translate(rx, ceil); bg.fillStyle = p; bg.fillRect(0, 0, room, FH * 2 - 2); bg.restore(); }
      bg.fillStyle = 'rgba(28,14,20,.2)'; bg.fillRect(rx, ceil, room, FH * 2 - 2);
      bg.fillStyle = 'rgba(20,8,14,.28)'; bg.fillRect(rx, ceil, room, 3);   /* тень от потолка */
      bg.fillStyle = 'rgba(20,8,14,.16)'; bg.fillRect(rx, floor - 2, room, 2);
      bg.globalAlpha = 1;
      if (!b.done) continue;
      const hasDoor = b.nf > 1 && r.i === 0;
      if (hasDoor) {
        const open = b.doors[r.f] > 0, k = r.role === 'church' || b.style === 'stone' ? (open ? 'door_stone_open' : 'door_stone') : (open ? 'door_open' : 'door');
        const im = img[k]; if (im && im.complete) bg.drawImage(im, rx + 3, floor - im.height);
      }
      furnish(bg, b, r, rx, ceil, floor, hasDoor, glows);
    }
    /* столбы между комнатами (на фоне) */
    for (let f = 0; f < builtF || (f === 0 && b.prog > .05 && f < b.nf); f++) for (let i = 1; i < b.nr; i++) tileV(bg, 'post', X0 + i * room - 1, floorRow(b, f + 1) * 2 + oy + 2, floorRow(b, f) * 2 + oy);
    /* фундамент и пол первого этажа */
    { const p = pattern(fg, 'wall_stone'); if (p) { fg.save(); fg.translate(X0 - 2, b.g * 2 + oy); fg.fillStyle = p; fg.fillRect(0, 0, Wp + 4, 5); fg.restore(); fg.fillStyle = 'rgba(0,0,0,.25)'; fg.fillRect(X0 - 2, b.g * 2 + oy, Wp + 4, 1); } }
    tileH(fg, 'floor', X0, b.g * 2 + oy - 2, Wp, 3);
    /* перекрытия: доски там, где клетки дерева ещё целы */
    for (let f = 1; f <= b.nf; f++) {
      const row = floorRow(b, f);
      for (let x = 0; x < b.w; x += 2) {
        const i = row * S.W + b.x0 + x, ok = S.A.type[i] === E.WOOD || S.A.type[i + 1] === E.WOOD; if (!ok) continue;
        const im = img.floor; if (im && im.complete) fg.drawImage(im, (x * 2) % (im.width - 4), 0, 4, im.height, X0 + x * 2, row * 2 + oy - 1, 4, im.height);
      }
    }
    /* наружные столбы */
    const hTop = floorRow(b, Math.max(builtF, b.prog > .05 ? 1 : 0)) * 2 + oy;
    if (b.prog > .05) { tileV(fg, 'post', X0 - 2, hTop, b.g * 2 + oy); tileV(fg, 'post', X0 + Wp - 4, hTop, b.g * 2 + oy); }
    /* леса, пока строится: тонкие жерди до будущей крыши */
    if (!b.done) {
      fg.fillStyle = 'rgba(214,170,110,.85)'; const yT = floorRow(b, b.nf) * 2 + oy;
      for (let x = X0 - 6; x <= X0 + Wp + 4; x += room / 2) fg.fillRect(Math.round(x), yT, 1, b.g * 2 + oy - yT);
      for (let y = b.g * 2 + oy - 12; y > yT; y -= 14) fg.fillRect(X0 - 6, y, Wp + 11, 1);
    }
    /* труба и крыша */
    if (b.done || b.prog > .82) {
      const baseY = floorRow(b, b.nf) * 2 + oy + 1, L = rb.L + ox, R = rb.R + ox;
      const ch = b.rooms.find((r) => r.chim != null);
      if (ch) { const im = img.chimney; if (im && im.complete) { const x = ch.chim + ox * 0, cxp = Math.max(L + 14, Math.min(R - 26, x)), d = rb.half - Math.abs(cxp + 7 - (L + R) / 2), yr = baseY - d * RS; fg.drawImage(im, cxp, Math.round(yr - im.height + 10)); b.smoke = [cxp + 7 - ox, Math.round(yr - im.height + 10) - oy]; } }
      roof(fg, b, L, R, baseY);
    }
    if (b.done && b.rooms.some((r) => r.role === 'church')) { const im = img.crystal; if (im && im.complete) { const apex = floorRow(b, b.nf) * 2 + oy + 1 - Math.round((rb.half - 1) * RS) - 2; fg.drawImage(im, Math.round((rb.L + rb.R) / 2 + ox - im.width / 2), apex - im.height + 3); } }
    if (b.done) { const im = img.lantern_wall; if (im && im.complete) { const lx = X0 - im.width + 2, ly = b.g * 2 + oy - 26; fg.save(); fg.translate(lx + im.width, ly); fg.scale(-1, 1); fg.drawImage(im, 0, 0); fg.restore(); glows.push([lx, ly, im.width, im.height, 3]); } }
    b.cache = { bg: bgc, fg: fgc, x: left, y: top, glows, glowsAll: glows, ver: b.ver, tint: {} };
    if (b.done && ready) { if (!b.ch) initChunks(b, bgc, fgc); applyChunks(b, [bgc, fgc]); }
  }
  function tileV(c, k, x, y0, y1) { const im = img[k]; if (!im || !im.complete) return; for (let y = y0; y < y1; y += im.height - 2) { const h = Math.min(im.height, y1 - y); c.drawImage(im, 0, 0, im.width, h, Math.round(x), Math.round(y), im.width, h); } }
  function tileH(c, k, x0, y, w, h) { const im = img[k]; if (!im || !im.complete) return; const sw = im.width - 6; for (let x = 0; x < w; x += sw) { const ww = Math.min(sw, w - x); c.drawImage(im, 3, 0, ww, Math.min(h, im.height), x0 + x, y, ww, Math.min(h, im.height)); } }
  /* двускатная крыша, нарисованная кодом в пиксель-арте: скаты 45°, черепица рядами (блик сверху, тень снизу, швы вразбежку),
     замкнутый тёмный контур по всему краю (и на концах скатов), дощатый фронтон с балкой, конёк. Цвета — с листа домиков */
  const ROOF_PAL = {
    red: { ol: [58, 20, 22], dk: [128, 44, 34], md: [176, 70, 48], lt: [214, 104, 70], hi: [240, 150, 104] },
    blue: { ol: [24, 26, 48], dk: [54, 66, 112], md: [74, 92, 148], lt: [104, 126, 184], hi: [150, 170, 220] },
    green: { ol: [24, 40, 20], dk: [52, 92, 40], md: [74, 124, 52], lt: [104, 158, 70], hi: [150, 196, 104] },
    purple: { ol: [48, 22, 40], dk: [100, 50, 86], md: [138, 74, 118], lt: [176, 104, 150], hi: [214, 148, 186] }
  };
  const RS = 1;   /* наклон ската: 1 точка вверх на 1 вбок */
  function roof(c, b, L, R, baseY) {
    const P = ROOF_PAL[b.roof] || ROOF_PAL.red, w = R - L, half = w >> 1, Hc = c.canvas.height, T = 10;
    const id = c.getImageData(L, 0, w, Hc), d = id.data;
    const set = (x, y, col, k) => { if (x < 0 || x >= w || y < 0 || y >= Hc) return; const o = (y * w + x) * 4; k = k || 1; d[o] = Math.min(255, col[0] * k); d[o + 1] = Math.min(255, col[1] * k); d[o + 2] = Math.min(255, col[2] * k); d[o + 3] = 255; };
    const top = (x) => baseY - Math.floor((x < half ? x : w - 1 - x) * RS);
    for (let x = 0; x < w; x++) {
      const right = x >= half, u = right ? w - 1 - x : x, sh = right ? .84 : 1, yT = top(x);
      /* фронтон: доски и тень под черепицей */
      for (let y = yT + T; y < baseY; y++) { const seam = (x - half + 64) % 5 === 0, k = y < yT + T + 2 ? .62 : 1; set(x, y, seam ? [64, 38, 24] : ((x >> 2) & 1) ? [112, 70, 42] : [100, 62, 38], k); }
      /* черепица */
      for (let v = 0; v < T; v++) {
        const y = yT + v, cr = (v / 3) | 0, vv = v % 3;
        let col = vv === 0 ? P.lt : vv === 1 ? P.md : P.dk;
        if (vv === 1 && (u + cr * 2) % 5 === 0) col = P.dk;
        if (v === 0) col = right ? P.lt : P.hi;
        if (v === T - 1) col = P.ol;
        set(x, y, col, v === T - 1 ? 1 : sh);
      }
      set(x, yT - 1, P.ol);
    }
    /* концы скатов: замкнутый контур */
    for (const x of [0, w - 1]) for (let y = top(x) - 1; y <= top(x) + T - 1; y++) set(x, y, P.ol);
    for (const x of [1, w - 2]) set(x, top(x) + T - 1, P.ol);
    /* балка под фронтоном */
    for (let x = 0; x < w; x++) { if (top(x) + T >= baseY - 1) continue; set(x, baseY - 3, [150, 98, 58]); set(x, baseY - 2, [118, 74, 42]); set(x, baseY - 1, [64, 36, 22]); }
    /* конёк */
    const ay = top(half - 1);
    for (let x = half - 4; x <= half + 3; x++) set(x, ay - 1, x === half - 4 || x === half + 3 ? P.ol : P.dk);
    for (let x = half - 3; x <= half + 2; x++) set(x, ay - 2, P.ol);
    c.putImageData(id, L, 0);
    const im = img.win_round, gh = half * RS - T; if (im && im.complete && gh > 22) c.drawImage(im, Math.round(L + half - im.width / 2), Math.round(baseY - gh * .45 - im.height / 2));
  }
  /* окраска кэша под освещение: умножение на цвет и возврат прозрачности */
  function tinted(b, which, col, key) {
    const C = b.cache, k = which + key; if (C.tint[k]) return C.tint[k];
    const src = C[which], c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d');
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(' + col.map((v) => Math.round(Math.min(1, v) * 255)).join(',') + ')'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
    const keys = Object.keys(C.tint); if (keys.length > 6) delete C.tint[keys[0]];
    return C.tint[k] = c;
  }
  const lived = (b) => !b.ruin && (b.rooms.some((r) => r.owners.length) || b.rooms.some((r) => r.role !== 'home'));
  /* фон домов на своём слое: перерисовывается, когда дом изменился или сменилось освещение */
  function drawBg(amb, ambKey, night) {
    if (!cx) return;
    const key = ambKey + '|' + list.map((b) => b.id + ':' + b.ver).join(',');
    if (!bgDirty && key === bgKey) return;
    bgDirty = false; bgKey = key;
    cx.clearRect(0, 0, LW, LH);
    for (const b of list) {
      if (!b.cache || b.cache.ver !== b.ver) render(b);
      const warm = lived(b) && b.done ? Math.min(1, night * 1.2) : 0, col = [0, 1, 2].map((i) => amb[i] + (([1, .86, .66][i]) - amb[i]) * warm * .62);
      cx.drawImage(night > .02 ? tinted(b, 'bg', col, ambKey + (warm ? 'w' : '')) : b.cache.bg, b.cache.x, b.cache.y);
      if (night > .05 && warm) for (const [x, y, w, h, kind] of b.cache.glows) if (kind === 1) { cx.fillStyle = 'rgba(255,196,96,' + (.42 * night).toFixed(2) + ')'; cx.fillRect(b.cache.x + x, b.cache.y + y, w, h); }
    }
  }
  /* передний план на слое людей (перед человечками) */
  function drawFg(c, amb, ambKey, T, night) {
    for (const b of list) {
      if (!b.cache || b.cache.ver !== b.ver) { render(b); bgDirty = true; }
      c.drawImage(night > .02 ? tinted(b, 'fg', amb, ambKey) : b.cache.fg, b.cache.x, b.cache.y);
      /* дым из трубы, когда в доме живут и прохладно или вечер */
      if (b.done && !b.ruin && b.smoke && b.rooms.some((r) => r.owners.length)) {
        const sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1; if (sea === 1 && night < .2) continue;
        for (let k = 0; k < 5; k++) {
          const ph = ((T * .35 + k * 20 + b.seed) % 100), y = b.smoke[1] - 2 - ph * .45, x = b.smoke[0] + Math.sin(ph / 14 + k + b.seed) * 3 + ph * .08, r = 1 + Math.floor(ph / 28), a = (1 - ph / 100) * .7;
          const v = Math.round(200 * (.55 + .45 * (1 - night)));
          c.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 8) + ',' + a.toFixed(2) + ')'; c.fillRect(Math.round(x - r), Math.round(y - r), r * 2 + 1, r * 2 + 1);
        }
      }
      if (night > .05 && b.done && !b.ruin) for (const [x, y, w, h, kind] of b.cache.glows) if (kind === 3) { c.fillStyle = 'rgba(255,200,110,' + (.5 * night).toFixed(2) + ')'; c.fillRect(b.cache.x + x + (w >> 1) - 1, b.cache.y + y + h - 6, 3, 3); }
    }
    drawDebris(c, amb);
  }
  /* свет от окон, ламп и очагов ночью (у развалин свет гаснет): fn(клетка x, клетка y, r, g, b) */
  function lights(fn, night) {
    if (night < .05) return;
    for (const b of list) {
      if (!b.done || b.ruin || !b.cache || !lived(b)) continue;
      for (const [x, y, w, h, kind] of b.cache.glows) { if (kind === 1) continue; const k = kind === 2 ? .9 : .55; fn((b.cache.x + x + w / 2) / 2, (b.cache.y + y + h / 2) / 2, 1.2 * k * night, .85 * k * night, .45 * k * night); }
    }
  }
  /* тёплый свет для человечка внутри обжитого дома ночью */
  function lightFor(e, night) { if (night < .05) return null; const w = where(e); if (!w || !w.b.done || w.b.ruin || !lived(w.b)) return null; return [.95, .82, .66]; }
  function init(canvas, W, H) {
    cv = canvas; LW = W * 2; LH = H * 2; if (cv) { cv.width = LW; cv.height = LH; cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; }
    S = S || Sim; load(); for (const b of list) b.ver++; bgDirty = true;
  }
  return { init, list, byId, create, build, remove, step, clear, blast, debris, rescale, findSite, floorOf, where, standY, floorRow, doorX, roomX, useDoor, drawBg, drawFg, lights, lightFor, nameOf, ROLES, RW, FH, get ready() { return ready; }, set sim(v) { S = v; } };
})();
