'use strict';
/* ПИКСЕЛИЯ — фон: красивая картина, которая почти не реагирует на то, что происходит в игре.
   Это одна цельная сцена: луг, пустыня, снежные горы, скалы, вулкан или море. Сцена выбирается по преобладающей почве или воде во всём мире
   (нужно явное большинство несколько секунд подряд), меняется плавным переходом и никак не привязана к отдельным клеткам.
   Время суток: солнце и луна с фазами, звёзды-искры, пушистые и полосатые облака, птицы, светлячки, северное сияние, блики на воде.
   Стиль как в хороших пиксельных фонах: плоские цвета без шума, полосы неба с дизерингом, чёткие силуэты, у гор свет слева и тень справа.
   Всё считается на CPU в буфер размером с мир и выводится на канвас #bg. Тяжёлое (небо и слои) пересчитывается редко и по очереди,
   каждый кадр — копия готового неба, светила, звёзды и облака. */
const Sky = (function () {
  const NB = 6, B_FOREST = 0, B_DESERT = 1, B_SNOW = 2, B_ROCK = 3, B_VOLC = 4, B_SEA = 5;
  const LOCKS = ['auto', 'forest', 'desert', 'snow', 'rock', 'volcano', 'sea', 'cave'];
  const HZ = [.6, .64, .82, .82, .82, .6];   /* линия горизонта по сценам: у моря выше */
  const DAY_SEC = 240, SC = 2;
  const Y = { time: .3, auto: true, lock: 'auto', day: 0, ov: 0, night: 0, ambKey: 0, amb: [1, 1, 1], cave: false };
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  const c255 = (v) => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const sstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const px = (r, g, b, a) => (((a === undefined ? 255 : a) << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const px3 = (c) => px(c255(c[0]), c255(c[1]), c255(c[2]));
  const hash1 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const SEED = (Math.random() * 1e6) | 0;
  const TAB = [];
  (function () { for (let k = 0; k < 14; k++) { const t = new Float32Array(256); let s = (SEED * 2654435761 + k * 97531) | 1; for (let i = 0; i < 256; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; t[i] = (s >>> 0) / 4294967296; } TAB.push(t); } })();
  const vn = (t, x) => { const i = Math.floor(x), f = x - i, a = t[i & 255], b = t[(i + 1) & 255], u = f * f * (3 - 2 * f); return a + (b - a) * u; };
  const fbm = (t, x, o) => { let s = 0, a = .5, f = 1, n = 0; for (let k = 0; k < o; k++) { s += a * vn(t, x * f + k * 31.7); n += a; a *= .5; f *= 2.03; } return s / n; };
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);   /* матрица дизеринга 4x4 */

  /* --- ключевые цвета по высоте солнца e (−1 полночь … 1 полдень) --- */
  const keyAt = (arr, e) => {
    if (e <= arr[0].e) return arr[0].c;
    for (let i = 1; i < arr.length; i++) if (e <= arr[i].e) { const a = arr[i - 1], b = arr[i], t = sstep(0, 1, (e - a.e) / (b.e - a.e)); return a.c.map((v, k) => v + (b.c[k] - v) * t); }
    return arr[arr.length - 1].c;
  };
  /* небо: 7 полос сверху вниз до горизонта */
  const NIGHT = [8, 8, 34, 12, 12, 50, 18, 18, 70, 26, 26, 92, 38, 36, 112, 54, 48, 128, 78, 64, 140];
  const SKY_KEYS = [
    { e: -1, c: NIGHT }, { e: -.3, c: NIGHT },
    { e: -.14, c: [18, 18, 62, 34, 26, 92, 58, 34, 118, 92, 44, 132, 132, 56, 138, 176, 72, 136, 214, 100, 132] },
    { e: -.02, c: [40, 44, 120, 76, 54, 138, 128, 64, 144, 188, 78, 140, 236, 102, 112, 252, 140, 96, 255, 184, 110] },
    { e: .14, c: [52, 96, 196, 84, 130, 214, 128, 164, 226, 176, 190, 226, 236, 196, 170, 255, 206, 140, 255, 228, 168] },
    { e: .45, c: [46, 124, 230, 62, 142, 236, 84, 160, 240, 110, 180, 244, 142, 200, 248, 178, 220, 250, 212, 238, 252] },
    { e: 1, c: [46, 124, 230, 62, 142, 236, 84, 160, 240, 110, 180, 244, 142, 200, 248, 178, 220, 250, 212, 238, 252] }];
  /* свет на предметы фона: множитель и добавка (в тенях ночью фиолетово-синий, на закате тёплый) */
  const LIGHT_KEYS = [
    { e: -1, c: [.36, .40, .66, 10, 8, 38] }, { e: -.3, c: [.36, .40, .66, 10, 8, 38] }, { e: -.14, c: [.58, .46, .72, 26, 8, 34] },
    { e: -.02, c: [.8, .58, .72, 40, 8, 40] }, { e: .14, c: [1, .86, .84, 12, 4, 6] }, { e: .4, c: [1, 1, 1, 0, 0, 0] }, { e: 1, c: [1, 1, 1, 0, 0, 0] }];
  const AMB_KEYS = [{ e: -1, c: [.44, .52, .80] }, { e: -.4, c: [.44, .52, .80] }, { e: -.15, c: [.56, .54, .80] }, { e: -.02, c: [.95, .76, .66] },
    { e: .1, c: [1, .9, .8] }, { e: .3, c: [1, 1, 1] }, { e: 1, c: [1, 1, 1] }];
  /* облака: верх (свет), середина, низ (тень), прозрачность */
  const CLOUD_KEYS = [
    { e: -1, c: [120, 120, 210, 80, 80, 156, 52, 52, 112, .85] }, { e: -.3, c: [120, 120, 210, 80, 80, 156, 52, 52, 112, .85] },
    { e: -.12, c: [224, 150, 176, 160, 92, 148, 100, 62, 124, .95] }, { e: 0, c: [255, 214, 150, 244, 142, 120, 160, 82, 130, 1] },
    { e: .16, c: [255, 244, 222, 255, 214, 186, 222, 164, 168, 1] }, { e: .42, c: [255, 255, 255, 214, 234, 252, 160, 200, 240, 1] },
    { e: 1, c: [255, 255, 255, 214, 234, 252, 160, 200, 240, 1] }];
  /* полосатые облака на закате и рассвете: ярче и контрастнее неба */
  const STREAK_KEYS = [
    { e: -1, c: [120, 112, 210, 84, 76, 160, 56, 50, 118] }, { e: -.3, c: [120, 112, 210, 84, 76, 160, 56, 50, 118] },
    { e: -.12, c: [244, 130, 160, 176, 66, 140, 112, 46, 128] }, { e: 0, c: [255, 232, 170, 255, 126, 102, 196, 70, 124] },
    { e: .16, c: [255, 240, 204, 255, 208, 164, 244, 160, 150] }, { e: .3, c: [255, 250, 232, 255, 230, 200, 250, 200, 180] }, { e: 1, c: [255, 255, 255, 255, 255, 255, 255, 255, 255] }];

  /* цвета слоёв [сцена][слой дальний/средний/ближний] = [свет, тень, кромка] при дневном свете */
  const LCOL = [
    [[[150, 168, 200], [112, 130, 176], [210, 222, 242]], [[66, 160, 108], [44, 122, 90], [132, 208, 130]], [[36, 112, 66], [22, 82, 54], [84, 160, 82]]],
    [[[246, 190, 120], [200, 112, 96], [255, 226, 160]], [[255, 210, 118], [226, 148, 88], [255, 240, 176]], [[240, 178, 84], [196, 118, 64], [255, 220, 120]]],
    [[[176, 200, 236], [122, 148, 206], [250, 252, 255]], [[150, 182, 226], [104, 134, 194], [240, 248, 255]], [[46, 122, 112], [30, 90, 92], [204, 234, 238]]],
    [[[214, 112, 110], [140, 62, 92], [250, 170, 140]], [[166, 78, 100], [104, 48, 82], [220, 130, 120]], [[96, 46, 74], [62, 32, 58], [150, 84, 96]]],
    [[[140, 70, 70], [92, 44, 56], [206, 106, 84]], [[88, 50, 58], [58, 32, 44], [150, 78, 62]], [[54, 34, 42], [36, 22, 32], [110, 58, 48]]],
    [[[104, 150, 190], [70, 112, 164], [176, 210, 236]], [[52, 126, 206], [40, 104, 184], [110, 176, 236]], [[36, 98, 184], [28, 78, 160], [70, 134, 214]]]];
  const FOG = [.46, .36, .3];   /* дымка: фон уходит вдаль и не спорит с передним планом */
  const DSKY = [[70, 148, 190], [98, 170, 202], [128, 190, 210], [164, 206, 210], [204, 216, 200], [240, 220, 182], [255, 214, 160]];   /* небо пустыни: бирюза над персиковым горизонтом */
  const TB = [];
  (function () {
    const set = (keys, b) => keys.forEach((k) => { if (E[k] !== undefined) TB[E[k]] = b; });
    set(['EARTH', 'MUD', 'SEED', 'CONE', 'FSEED', 'LEAF', 'WOOD', 'SPROUT', 'LITTER', 'FLY'], B_FOREST);
    set(['SAND', 'SALT', 'GLASS'], B_DESERT); set(['SNOW', 'ICE'], B_SNOW);
    set(['STONE', 'WALL', 'METAL', 'GUNP', 'BATT', 'LAMP', 'CLONE', 'VOID', 'ASH', 'SPARK'], B_ROCK);
    set(['LAVA'], B_VOLC); set(['WATER', 'BRINE', 'OIL', 'ACID'], B_SEA);
  })();

  let ctx, img, buf, old, skyBuf, fgBuf, W = 0, H = 0, n = 0, dirty = 2, xfade = 0;
  let scene = B_FOREST, cand = -1, candN = 0, emptyN = 0, HT = [], ridge = [], hzCur = 100, fgTop = 0, lockB = -1, volcX = .5, hor = [212, 238, 252];
  let stars = [], clouds = [], meteor = null, crystals = [], birds = [], flies = [], embers = [];
  const counts = new Float32Array(NB);

  /* ---------- формы гор ---------- */
  function bump(x, cell, prob, round, k, ws) {
    const i = Math.floor(x / cell); if (hash1(i, k + SEED % 97) > prob) return 0;
    const wd = cell * (.55 + .4 * hash1(i, k + 7)) * (ws || 1), c = (i + .3 + .4 * hash1(i, k + 13)) * cell, d = Math.abs(x - c) / (wd / 2 + .001);
    if (d >= 1) return 0; const hh = .6 + .4 * hash1(i, k + 21); return hh * (round ? Math.sqrt(1 - d * d) : 1 - d);
  }
  function genShapes() {
    const U = Math.max(.6, Math.min(1.5, H / SC / 204)) * SC * .85, ph = (SEED % 628) / 100, ph2 = (SEED % 331) / 50;
    HT = []; for (let l = 0; l < 3; l++) { HT.push([]); for (let b = 0; b < NB; b++) HT[l].push(new Float32Array(W)); }
    ridge = [0, 1, 2].map(() => new Int16Array(W));
    const ic = [0, 1, 2].map((i) => .12 + .76 * hash1(i, SEED % 53)), iw = [0, 1, 2].map((i) => .04 + .05 * hash1(i, SEED % 29 + 3));
    const xm1 = .16 + .3 * hash1(1, SEED % 41), xm2 = .62 + .26 * hash1(2, SEED % 43);
    for (let x = 0; x < W; x++) {
      const xn = x / W, f = (k, fr, o) => fbm(TAB[k], xn * fr, o), rg = (k, fr, o) => { const v = fbm(TAB[k], xn * fr, o); return Math.pow(v * v * (3 - 2 * v), 1.1) * 1.25; };   /* округлые вершины, без острых пиков */
      const m1 = Math.pow(Math.max(0, 1 - Math.abs(xn - xm1) / .26), 1.2), m2 = Math.pow(Math.max(0, 1 - Math.abs(xn - xm2) / .2), 1.3);
      HT[0][B_FOREST][x] = .06 + .05 * f(0, 3.2, 2) + .27 * m1 * (.8 + .2 * rg(12, 9, 2)) + .17 * m2 * (.8 + .2 * rg(13, 9, 2));
      HT[1][B_FOREST][x] = .05 + .06 * f(1, 4.5, 2) + .03 * bump(x, 6 * U, .95, false, 1);
      HT[2][B_FOREST][x] = .03 + .03 * f(2, 6, 2) + .04 * bump(x, 15 * U, .8, true, 2);
      { const bt = (c, w) => { const d = Math.abs(xn - c) / w; return d >= 1 ? 0 : Math.min(1, (1 - d) * 2.4); };   /* песчаные пирамиды-бугры с наклонными боками */
        HT[0][B_DESERT][x] = .05 + .06 * Math.pow(Math.abs(Math.sin(xn * 5 + ph)), .8) + .2 * bt(xm1, .17) + .13 * bt(xm2, .12); }
      HT[1][B_DESERT][x] = .04 + .075 * Math.pow(Math.abs(Math.sin(xn * 7.5 + ph2)), .7) * (.7 + .3 * f(4, 3, 2));
      HT[2][B_DESERT][x] = .025 + .04 * Math.pow(Math.abs(Math.sin(xn * 12 + ph)), .8);
      HT[0][B_SNOW][x] = .06 + .30 * Math.pow(rg(5, 3.4, 3), 1.4);
      HT[1][B_SNOW][x] = .05 + .12 * rg(6, 5, 2) + .02 * bump(x, 7 * U, .9, false, 6);
      HT[2][B_SNOW][x] = .03 + .03 * f(9, 5, 2);
      HT[0][B_ROCK][x] = .08 + .28 * rg(7, 4.4, 3);
      HT[1][B_ROCK][x] = .04 + .13 * rg(8, 5, 2);
      HT[2][B_ROCK][x] = .03 + .04 * f(9, 9, 2) + .03 * bump(x, 18 * U, .5, true, 5);
      HT[1][B_VOLC][x] = .04 + .10 * rg(10, 5, 2);
      HT[2][B_VOLC][x] = .03 + .06 * rg(11, 8, 2);
      let isl = 0; for (let i = 0; i < 3; i++) isl += .055 * Math.pow(Math.max(0, 1 - Math.abs((xn - ic[i]) / iw[i])), 1.4);
      HT[0][B_SEA][x] = 0;
    }
    volcFar();
  }
  function volcFar() {
    const a = HT[0][B_VOLC], xc = volcX, cw = .24;
    for (let x = 0; x < W; x++) {
      const xn = x / W, dx = Math.abs(xn - xc), cone = Math.pow(Math.max(0, 1 - dx / cw), 1.15);
      a[x] = .05 + .34 * cone + .02 * fbm(TAB[12], xn * 5, 2) - (dx < .022 ? .035 * (1 - dx / .022) : 0);
    }
  }

  /* ---------- выбор сцены: по преобладающей почве во всём мире ---------- */
  function sample(S, snap) {
    const A = S.A, type = A.type, fl = A.fl, vy = A.vy, AIRt = E.AIR;
    counts.fill(0); let total = 0; const MW = S.W, MH = S.H;
    for (let x = 1; x < MW - 1; x += 2) {
      let y = 1, t = 0, found = false;
      for (; y < MH - 1; y++) {
        const i = y * MW + x; t = type[i];
        if (t === AIRt || KIND[t] === K.GAS || fl[i]) continue;
        const k = KIND[t];
        if ((k === K.POWDER || k === K.LIQUID) && vy[i] > 0 && type[i + MW] === AIRt) continue;   /* падает, ещё не почва */
        found = true; break;
      }
      if (!found) continue;
      const b = TB[t]; counts[b === undefined ? B_ROCK : b]++; total++;
    }
    if (lockB >= 0) { if (lockB !== scene) switchScene(lockB, snap); return; }
    const sampled = (MW - 2) / 2;
    if (total < sampled * .1) {   /* почти пусто: по умолчанию луг */
      cand = -1; candN = 0;
      if (snap) { scene = B_FOREST; emptyN = 0; } else if (scene !== B_FOREST && ++emptyN >= 5) { switchScene(B_FOREST, false); emptyN = 0; }
      return;
    }
    emptyN = 0;
    let best = 0; for (let b = 1; b < NB; b++) if (counts[b] > counts[best]) best = b;
    if (snap) { if (best !== scene) { scene = best; applyScene(); } return; }
    if (best !== scene && counts[best] > counts[scene] + total * .12 && counts[best] > total * .35) {
      if (best === cand) candN++; else { cand = best; candN = 1; }
      if (candN >= 5) { switchScene(best, false); cand = -1; candN = 0; }
    } else { cand = -1; candN = 0; }
  }
  function applyScene() { hzCur = H * HZ[scene]; if (scene === B_VOLC) { volcX = .3 + .4 * hash1(7, SEED % 61); volcFar(); } }
  /* плавная смена: старый кадр растворяется в новый */
  function switchScene(b, immediate) {
    if (!immediate && buf) { old.set(buf); xfade = 1; }
    scene = b; applyScene(); rebuildSky(); rebuildFg();
  }

  /* ---------- небо: полосы цвета с дизерингом на стыках ---------- */
  const elev = () => Math.sin((Y.time - .25) * 6.2831853);
  const grey = (v) => { const l = v[0] * .3 + v[1] * .59 + v[2] * .11; return [l * .82 + 14, l * .84 + 16, l * .9 + 22]; };
  const BANDS = [0, .16, .32, .48, .63, .77, .89, 1];
  function skyColors(e) {
    const c = keyAt(SKY_KEYS, e), rising = Y.time < .5, tw = Math.max(0, 1 - Math.abs(e + .04) / .22), cols = [];
    for (let i = 0; i < 7; i++) cols.push([c[i * 3], c[i * 3 + 1], c[i * 3 + 2]]);
    if (rising) for (let i = 3; i < 7; i++) cols[i] = [cols[i][0] - 8 * tw, cols[i][1] + 8 * tw, cols[i][2] + 26 * tw];
    const dayF = sstep(-.05, .3, e);
    for (let i = 0; i < 7; i++) {
      const lo = i / 6;
      if (scene === B_VOLC) cols[i] = lerp3(cols[i], [i < 3 ? 52 : 190, i < 3 ? 22 : 60, i < 3 ? 40 : 40], .5 * (.4 + .6 * lo));
      else if (scene === B_DESERT) cols[i] = lerp3(cols[i], DSKY[i], .8 * dayF);
      else if (scene === B_SNOW) cols[i] = lerp3(cols[i], [150, 190, 240], .14 * dayF * (1 - lo));
      if (Y.ov > .01) cols[i] = lerp3(cols[i], grey(cols[i]), Y.ov * .85);
    }
    return cols;
  }
  function rebuildSky() {
    if (Y.cave) { buildCave(); return; }
    const e = elev(), cols = skyColors(e), hz = Math.max(8, hzCur), zw = .035;
    hor = cols[6];
    const p32 = cols.map(px3), c0 = new Uint32Array(H), c1 = new Uint32Array(H), uu = new Float32Array(H);
    for (let y = 0; y < H; y++) {
      const t = y / hz; let i = 6; for (let k = 0; k < 7; k++) if (t < BANDS[k + 1]) { i = k; break; }
      let k = -1; for (let q = 1; q < 7; q++) if (Math.abs(t - BANDS[q]) < zw) { k = q; break; }
      if (k > 0) { c0[y] = p32[k - 1]; c1[y] = p32[k]; uu[y] = (t - (BANDS[k] - zw)) / (2 * zw); } else { c0[y] = p32[Math.min(i, 6)]; uu[y] = -1; }
    }
    for (let y = 0; y < H; y++) {
      const u = uu[y], a = c0[y], b = c1[y], o = y * W, ty = (y & 3) << 2;
      if (u < 0) { for (let x = 0; x < W; x++) skyBuf[o + x] = a; } else for (let x = 0; x < W; x++) skyBuf[o + x] = u > BAY[ty | (x & 3)] ? b : a;
    }
  }
  function buildCave() {
    for (let y = 0; y < H; y++) {
      const t = y / H, bR = lerp(44, 24, t), bG = lerp(40, 22, t), bB = lerp(64, 38, t);
      for (let x = 0; x < W; x++) {
        const big = Math.floor((fbm(TAB[13], x * .035 + y * .018, 2) - .5) * 5) * 5, st = ((y * 3 + (x >> 2)) % 13 === 0) ? -6 : 0, v = big + st;
        skyBuf[y * W + x] = px(c255(bR + v), c255(bG + v), c255(bB + v * 1.1));
      }
    }
    hor = [30, 28, 44];
  }

  /* ---------- слои: три слоя гор или холмов до низа мира и вода у моря ---------- */
  function fput(x, y, c) { if (x >= 0 && x < W && y >= 0 && y < H) { fgBuf[y * W + x] = c; if (y < fgTop) fgTop = y; } }
  function spruce(cx, by, h, lit, shade, tip, trunk) {
    const tiers = h > 12 ? 4 : 3, th = Math.max(3, Math.ceil(h / (tiers + .5))), maxW = Math.max(2, Math.round(h * .36));
    fput(cx, by, trunk); fput(cx, by - 1, trunk);
    for (let i = 0; i < tiers; i++) {
      const yb = by - 2 - Math.round(i * (h - 4) / tiers), w0 = Math.max(1, Math.round(maxW * (1 - i / (tiers + .6) * .72)));
      for (let r = 0; r < th; r++) {
        const hw = Math.max(0, Math.round(w0 * (1 - r / th))), y = yb - r;
        for (let x = -hw; x <= hw; x++) fput(cx + x, y, (tip && r >= th - 1) ? tip : x <= 0 ? lit : shade);
      }
    }
    fput(cx, by - h, lit);
  }
  function roundTree(cx, by, r, lit, shade, hi, trunk) {
    const th = Math.max(2, Math.round(r * .9));
    for (let y = 0; y < th; y++) { fput(cx, by - y, trunk); if (r > 4) fput(cx + 1, by - y, trunk); }
    const cy = by - th - Math.round(r * .55);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy * 1.15 > r * r + r * .4) continue;
      const l = dx * .7 + dy * .9; let c = l < -r * .15 ? lit : shade;
      if (l < -r * .85 && ((dx + dy) & 1) === 0) c = hi;
      fput(cx + dx, cy + dy, c);
    }
  }
  function cactus(cx, by, h, lit, shade) {
    for (let y = 0; y < h; y++) { fput(cx, by - y, lit); fput(cx + 1, by - y, shade); }
    const ay = by - Math.round(h * .55), a2 = Math.round(h * .3);
    for (let k = 1; k <= 2; k++) fput(cx - k, ay, lit);
    for (let y = 0; y <= a2; y++) fput(cx - 2, ay - y, lit);
    const by2 = by - Math.round(h * .4);
    for (let k = 2; k <= 3; k++) fput(cx + k, by2, shade);
    for (let y = 0; y <= a2 - 1; y++) fput(cx + 3, by2 - y, shade);
    fput(cx, by - h, lit);
  }
  /* море: плоскость воды полосами, к горизонту светлее, с гребешками волн */
  function seaPlane(grade) {
    const hz = Math.round(hzCur), top = grade([108, 156, 206], .12), deep = grade([60, 108, 176], 0), light = grade([138, 190, 226], .05), dark = grade([46, 90, 156], 0);
    for (let y = hz; y < H; y++) {
      const t = (y - hz) / Math.max(1, H - hz), band = Math.floor(t * 7), f = band / 6, edge = (t * 7 - band) < .12 && ((y & 1) === 1) ? Math.max(0, (band - 1) / 6) : f;
      for (let x = 0; x < W; x++) fgBuf[y * W + x] = px(c255(lerp(top[0], deep[0], edge)), c255(lerp(top[1], deep[1], edge)), c255(lerp(top[2], deep[2], edge)));
    }
    if (hz < fgTop) fgTop = hz;
    /* длинные горизонтальные полосы светлее и темнее воды, к зрителю шире */
    for (let y = hz + 1; y < H; y++) {
      const t = (y - hz) / Math.max(1, H - hz), dens = .1 + .22 * t;
      let x = Math.floor(hash1(y, 5) * 30);
      while (x < W) {
        const len = Math.round((5 + hash1(x, y) * 26) * (1 + t * 3)), r = hash1(y * 7 + 1, x >> 2);
        if (r < dens) { const c = r < dens * .6 ? light : dark; for (let k = 0; k < len && x + k < W; k++) fgBuf[y * W + x + k] = px3(c); }
        x += len + Math.round(hash1(x, y + 3) * 18 * (1 + t * 2));
      }
    }
  }
  /* облачная гряда у горизонта: башня кучевых облаков из круглых пузырей в три тона, как на референсе */
  function cloudBank(e, grade) {
    const hz = Math.round(hzCur), c = keyAt(CLOUD_KEYS, e), tones = [[c[6] * .78, c[7] * .8, c[8] * .9], [c[3], c[4], c[5]], [c[0], c[1], c[2]]].map((v) => grade(v, .05));
    const tw = [[.3, .26], [.78, .14]], env = (xn) => { let h = .035 + .03 * fbm(TAB[3], xn * 7, 2); for (const [cx, hh] of tw) h += hh * Math.exp(-Math.pow((xn - cx) / .1, 2)); return h * H; };
    for (let t = 0; t < 3; t++) for (let i = 0; i < 330; i++) {
      const cx = hash1(i, 31 + t) * (W + 20) - 10, xn = Math.max(0, Math.min(1, cx / W)), en = env(xn), rr = hash1(i, 41 + t);
      const cy = hz - en * (.18 + t * .26) * (.5 + rr), rad = Math.max(2, (en * .3 + 2) * (1 - t * .12) * (.5 + hash1(i, 51 + t) * .6));
      const col = px3(tones[t]), ox = t === 2 ? -rad * .25 : 0, oy = t === 2 ? -rad * .3 : 0;
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { if (dx * dx + dy * dy > rad * rad) continue; const yy = Math.round(cy + oy + dy); if (yy < hz) fput(Math.round(cx + ox + dx), yy, col); }
    }
  }
  /* ---------- пустыня: плоская песчаная равнина, ступенчатые столовые горы, сагуаро, кусты и камни ---------- */
  function butte(cx, by, w, h, lit, shade, rim) {
    const tiers = [[1.45, .26], [.62, .2], [.56, .22], [.5, .2], [.44, .12]]; let y = by;
    for (let ti = 0; ti < tiers.length; ti++) {
      const th = Math.max(2, Math.round(h * tiers[ti][1])), w0 = w / 2 * tiers[ti][0], w1 = ti === 0 ? w / 2 * .66 : w0;
      for (let r = 0; r < th; r++) {
        const hw = Math.round(lerp(w0, w1, r / th)), k = (r % 3 === 2) ? .88 : 1, top = ti === tiers.length - 1 && r === th - 1;
        for (let dx = -hw; dx <= hw; dx++) { const c = top ? rim : dx <= -hw * .1 ? lit : shade; fput(cx + dx, y - r, px(c255(c[0] * k), c255(c[1] * k), c255(c[2] * k))); }
      }
      y -= th;
    }
  }
  function saguaro(cx, by, h, lit, shade) {
    const wd = Math.max(1, Math.round(h * .11));
    for (let y = 0; y < h; y++) for (let k = 0; k < wd; k++) fput(cx + k, by - y, k < wd / 2 ? lit : shade);
    const arm = (sd, ah, up) => { const ay = by - Math.round(h * ah), len = Math.max(2, Math.round(h * .28)); for (let k = 1; k <= len; k++) for (let q = 0; q < wd; q++) fput(cx + (sd < 0 ? -k : wd - 1 + k), ay - q, q === 0 ? lit : shade); for (let y = 0; y < Math.round(h * up); y++) for (let q = 0; q < wd; q++) fput(cx + (sd < 0 ? -len : wd - 1 + len) + (sd < 0 ? q : -q), ay - y, q === 0 ? lit : shade); };
    arm(-1, .42, .3); arm(1, .56, .24);
  }
  function desertScene(grade) {
    const hz = Math.round(hzCur), U = Math.max(.6, Math.min(1.5, H / SC / 204)) * SC * .85, top = grade([246, 200, 140], .35), bot = grade([206, 118, 58], 0), lite = grade([252, 214, 150], .2), darkk = grade([170, 88, 48], 0);
    for (let y = hz; y < H; y++) {
      const t = (y - hz) / Math.max(1, H - hz), band = Math.floor(t * 8), f = band / 7, ff = ((t * 8 - band) < .14 && (y & 1)) ? Math.max(0, (band - 1) / 7) : f;
      for (let x = 0; x < W; x++) fgBuf[y * W + x] = px(c255(lerp(top[0], bot[0], ff)), c255(lerp(top[1], bot[1], ff)), c255(lerp(top[2], bot[2], ff)));
    }
    if (hz < fgTop) fgTop = hz;
    for (let y = hz + 2; y < H; y++) {   /* волны песка: длинные светлые и тёмные ряды */
      const t = (y - hz) / (H - hz); let x = Math.floor(hash1(y, 9) * 40);
      while (x < W) { const len = Math.round((8 + hash1(x, y) * 40) * (1 + t * 2.5)), r = hash1(y * 5 + 2, x >> 3); if (r < .1 + .1 * t) { const c = r < .08 ? lite : darkk; for (let k = 0; k < len && x + k < W; k++) fgBuf[y * W + x + k] = px3(c); } x += len + Math.round(hash1(x, y + 2) * 40); }
    }
    /* столовые горы: далёкие светлее и в дымке, ближние ярче; свет слева */
    const bs = [[.12, .4, .8], [.31, .22, .5], [.58, .26, .55], [.78, .34, .7], [.93, .2, .45]];
    for (const [xn, hh, sc] of bs.sort((a, b) => a[2] - b[2])) {
      const f = .55 - sc * .4, lit = grade([212, 108, 66], f), sh = grade([150, 70, 54], f), rim = grade([244, 160, 110], f);
      butte(Math.round(xn * W), hz + 1, Math.round(W * .2 * sc * 1.1), Math.round(H * hh * sc), lit, sh, rim);
    }
    /* предметы на земле: чем ниже, тем крупнее */
    const objs = []; for (let i = 0; i < 70; i++) objs.push([hash1(i, 61), Math.pow(hash1(i, 62), 1.5), hash1(i, 63)]);
    objs.sort((a, b) => a[1] - b[1]);
    const green = grade([84, 134, 72], .1), greenS = grade([56, 100, 62], .1), olive = grade([110, 126, 56], .1), oliveL = grade([152, 164, 78], .1), rk = grade([150, 76, 52], .05), rkS = grade([104, 52, 44], .05);
    for (const [xr, t, k] of objs) {
      const x = Math.round(xr * W), y = hz + 6 + Math.round(t * (H - hz - 8)), s2 = (.35 + t * 1.4) * U;
      if (k < .22) saguaro(x, y, Math.round(14 * s2), px3(green), px3(greenS));
      else if (k < .62) { const w = Math.max(2, Math.round(5 * s2)), h = Math.max(1, Math.round(2.6 * s2)); for (let dy = 0; dy < h; dy++) for (let dx = -w + dy; dx <= w - dy; dx++) fput(x + dx, y - dy, dy >= h - 1 ? px3(oliveL) : px3(olive)); }
      else { const w = Math.max(2, Math.round(3.5 * s2)), h = Math.max(1, Math.round(2 * s2)); for (let dy = 0; dy < h; dy++) for (let dx = -w + dy; dx <= w - dy; dx++) fput(x + dx, y - dy, dx < 0 ? px3(rk) : px3(rkS)); }
    }
  }
  /* ---------- равнина: далёкие голубые холмы, зелёные холмы с деревьями, трава с кустиками, цветы и тропинка ---------- */
  function meadowScene(grade) {
    const hz = Math.round(hzCur), U = Math.max(.6, Math.min(1.5, H / SC / 204)) * SC * .85;
    const haze = px3(grade([138, 192, 212], .3)), hazeL = px3(grade([176, 220, 232], .3)), far = px3(grade([92, 158, 178], .18)), farL = px3(grade([146, 204, 212], .18)), farS = px3(grade([72, 130, 160], .18));
    const hill = grade([96, 178, 100], .08), hillL = px3(grade([156, 220, 112], .08)), hillS = grade([62, 144, 84], .08), top = grade([118, 200, 92], .12), bot = grade([30, 118, 40], 0);
    for (let y = hz; y < H; y++) {   /* луг: от светлой травы к тёмной, с дизерингом на стыках */
      const t = (y - hz) / Math.max(1, H - hz), band = Math.floor(t * 9), f = band / 8, ff = ((t * 9 - band) < .14 && (y & 1)) ? Math.max(0, (band - 1) / 8) : f;
      for (let x = 0; x < W; x++) fgBuf[y * W + x] = px(c255(lerp(top[0], bot[0], ff)), c255(lerp(top[1], bot[1], ff)), c255(lerp(top[2], bot[2], ff)));
    }
    if (hz < fgTop) fgTop = hz;
    const rng = (k, fr, base, amp) => { const a = new Int16Array(W); for (let x = 0; x < W; x++) a[x] = Math.round(hz - H * (base + amp * fbm(TAB[k], x / W * fr, 3))); return a; };
    const r0 = rng(0, 3.2, .13, .13), r1 = rng(1, 5, .06, .1);   /* два ряда далёких холмов */
    for (let x = 0; x < W; x++) { for (let y = Math.max(0, r0[x]); y < hz; y++) fput(x, y, y - r0[x] < 2 ? hazeL : haze); for (let y = Math.max(0, r1[x]); y < hz; y++) { const d = y - r1[x]; fput(x, y, d < 1 ? farL : d > 6 * U && ((x + y) & 1) ? farS : far); } }
    /* зелёные холмы перед равниной: два ряда, дальний светлее; тон меняется по глубине, а не по столбцам */
    const hr = new Int16Array(W), hb = new Int16Array(W), hh = Math.round(H * .13);
    for (let x = 0; x < W; x++) { hb[x] = Math.round(hz - H * (.01 + .06 * fbm(TAB[3], x / W * 4, 3))); hr[x] = Math.round(hz + H * .03 - H * (.03 + .07 * fbm(TAB[2], x / W * 6, 3))); }
    const hb1 = grade([116, 194, 110], .14), hb2 = grade([80, 158, 100], .14);
    for (let x = 0; x < W; x++) for (let y = Math.max(0, hb[x]); y < hb[x] + hh; y++) { const d = y - hb[x], c = d < 1 ? hillL : d > hh * .55 ? hb2 : hb1; fput(x, y, typeof c === 'number' ? c : px3(c)); }
    for (let x = 0; x < W; x++) for (let y = Math.max(0, hr[x]); y < hr[x] + hh; y++) { const d = y - hr[x], c = d < 1 ? hillL : d < hh * .4 ? hill : (d < hh * .55 && ((x + y) & 1)) ? hill : hillS; fput(x, y, typeof c === 'number' ? c : px3(c)); }
    const tl = px3(grade([44, 116, 76], .05)), ts = px3(grade([30, 88, 64], .05)), th = px3(grade([80, 156, 90], .05)), tk = px3(grade([92, 64, 44], .05));
    for (let x = 6; x < W - 6; x += 5 * SC) if (hash1(x, 14) > .55) roundTree(Math.round(x + hash1(x, 15) * 6), hr[x] + 1, Math.max(2, Math.round((2 + hash1(x, 16) * 3) * U)), tl, ts, th, tk);
    /* тропинка */
    const py = hz + Math.round(H * .22), pt = grade([176, 128, 80], .02), pe = px3(grade([128, 88, 56], .02)), pb = px3(grade([200, 150, 98], .02));
    for (let x = 0; x < W; x++) { const y0 = py + Math.round(Math.sin(x / W * 9 + SEED % 7) * 2 * U), ph = Math.max(3, Math.round(H * .04)); for (let y = 0; y < ph; y++) fput(x, y0 + y, y === 0 ? pe : y === ph - 1 ? pb : px(c255(pt[0] + ((x + y) % 7 === 0 ? -10 : 0)), c255(pt[1]), c255(pt[2]))); }
    /* трава и цветы: чем ниже, тем крупнее */
    const g1 = px3(grade([30, 108, 48], 0)), g2 = px3(grade([72, 160, 64], 0)), g3 = px3(grade([140, 214, 90], 0)), fl = [[255, 220, 90], [255, 255, 255], [255, 140, 170], [176, 150, 255]].map((c) => px3(grade(c, 0)));
    const objs = []; for (let i = 0; i < 260; i++) objs.push([hash1(i, 71), Math.pow(hash1(i, 72), 1.2), hash1(i, 73)]);
    objs.sort((a, b) => a[1] - b[1]);
    for (const [xr, t, k] of objs) {
      const x = Math.round(xr * W), y = hz + Math.round(H * .1) + Math.round(t * (H - hz - H * .1 - 2)), s2 = (.5 + t * 1.8) * U;
      if (k < .8) { const n = 3 + Math.floor(hash1(x, y) * 3); for (let b = 0; b < n; b++) { const bh = Math.max(2, Math.round((2.5 + hash1(x + b, y) * 3) * s2)), lean = Math.round((b - n / 2) * .6 * s2); for (let q = 0; q < bh; q++) fput(x + b * Math.max(1, Math.round(s2 * .7)) + Math.round(lean * q / bh), y - q, q > bh * .6 ? g3 : b & 1 ? g2 : g1); } }
      else { const c = fl[(hash1(x, y) * 4) | 0], q = Math.max(1, Math.round(s2 * .7)); for (let dy = 0; dy < q; dy++) for (let dx = 0; dx < q; dx++) fput(x + dx, y - dy, c); }
    }
  }
  function rebuildFg() {
    fgBuf.fill(0); fgTop = H;
    if (Y.cave) { caveFg(); return; }
    const e = elev(), lg = keyAt(LIGHT_KEYS, e), ovs = 1 - Y.ov * .2, hz = hzCur, hr = hor[0], hg = hor[1], hb = hor[2], U = Math.max(.6, Math.min(1.5, H / SC / 204)) * SC * .85, b = scene;
    const grade = (c, f) => [lerp(Math.min(255, c[0] * lg[0] * ovs + lg[3]), hr, f), lerp(Math.min(255, c[1] * lg[1] * ovs + lg[4]), hg, f), lerp(Math.min(255, c[2] * lg[2] * ovs + lg[5]), hb, f)];
    const dayF = .35 + .65 * sstep(-.05, .3, e), LC = LCOL[b].map((cols, l) => cols.map((c) => grade(c, FOG[l] * dayF)));   /* в сумерках дымки меньше: силуэты тёмные и сочные */
    const capLit = grade([250, 252, 255], .1), capSh = grade([186, 210, 244], .1), lava = [255, 112, 32];
    const base = b === B_SEA ? [hz - .005 * H, 0, 0] : [hz - .005 * H, hz + .07 * H, hz + .145 * H];
    const layers = b === B_SEA || b === B_DESERT || b === B_FOREST ? 0 : 3;
    for (let l = 0; l < layers; l++) for (let x = 0; x < W; x++) ridge[l][x] = Math.round(base[l] - HT[l][b][x] * H);
    if (b === B_SEA) { seaPlane(grade); cloudBank(e, grade); }
    if (b === B_DESERT) desertScene(grade);
    if (b === B_FOREST) meadowScene(grade);
    const litA = new Uint8Array(W);
    for (let l = 0; l < layers; l++) {
      const R = ridge[l];
      for (let x = 0; x < W; x++) litA[x] = (R[Math.min(W - 1, x + 5 * SC)] - R[Math.max(0, x - 5 * SC)]) <= 0 ? 1 : 0;
      const bandH = Math.max(6, Math.round((l === 0 ? .12 : .08) * H)), c = LC[l];
      for (let x = 0; x < W; x++) {
        const rd = R[x], lim = b === B_SEA ? Math.min(H, hz + 1) : l < layers - 1 ? Math.min(H, ridge[l + 1][x] + 2) : H; if (rd >= lim) continue;
        const litSide = litA[x] === 1, ridgeH = base[l] - rd;
        const y0 = Math.max(0, rd), cap = (b === B_SNOW && l < 2) ? Math.round(ridgeH * (.36 + .16 * Math.sin(x * .8))) : 0;
        const streak = (b === B_VOLC && l === 0 && hash1(x >> 1, 91) > .55) ? 5 + Math.floor(hash1(x, 17) * 14 * H / 204) : 0;
        if (rd < fgTop) fgTop = Math.max(0, rd);
        for (let y = y0; y < lim; y++) {
          const d = y - rd; let r, g, bl, k = 1;
          const xs = Math.max(0, Math.min(W - 1, x - ((d * .55) | 0) + (hash1(y >> 1, x >> 2) < .2 ? 1 : 0))), lit = litA[xs], body = lit ? c[0] : c[1];
          if (d === 0) { const q = litSide ? 1 : .35; r = body[0] + (c[2][0] - body[0]) * q; g = body[1] + (c[2][1] - body[1]) * q; bl = body[2] + (c[2][2] - body[2]) * q; }
          else {
            if (d >= bandH * 2 + 1) k = .66; else if (d >= bandH * 2 - 1) k = ((x + y) & 1) ? .82 : .66; else if (d >= bandH + 1) k = .82; else if (d >= bandH - 1) k = ((x + y) & 1) ? 1 : .82;
            r = body[0] * k; g = body[1] * k; bl = body[2] * k;
          }
          if (d < cap && (d < cap - 1 || ((x + y) & 1) === 0)) { const cc = lit ? capLit : capSh; r = cc[0]; g = cc[1]; bl = cc[2]; }
          if (streak && d >= 2 && d < 2 + streak && (y & 3) !== 3 && (x & 1) === 0) { r = lava[0]; g = lava[1]; bl = lava[2]; }
          else if (b === B_VOLC && l === 0 && d <= 1 && Math.abs(x / W - volcX) < .02) { r = lava[0]; g = lava[1]; bl = lava[2]; }
          fgBuf[y * W + x] = px(c255(r), c255(g), c255(bl));
        }
      }
    }
    /* деревья, ёлки, кактусы и цветы на ближнем слое */
    if (b !== B_SEA && b !== B_ROCK && b !== B_VOLC && b !== B_DESERT && b !== B_FOREST) {
      const cell = Math.max(6, Math.round(8 * U)), trunk = px3(grade([110, 74, 46], .05)), c2 = LC[2];
      for (let cx0 = Math.round(cell / 2); cx0 < W - 2; cx0 += cell) {
        const x = Math.max(2, Math.min(W - 3, cx0 + Math.round((hash1(cx0, 3) - .5) * cell * .6))), by = ridge[2][x] + 1, r = hash1(cx0, 9);
        if (by >= H - 1 || by < 8) continue;
        if (b === B_FOREST && r < .66 && fbm(TAB[11], x / W * 6, 2) > .32) {
          const h = Math.round((8 + hash1(cx0, 11) * 13) * U);
          if (hash1(cx0, 13) < .5) spruce(x, by, h, px3(c2[0]), px3(c2[1]), 0, trunk); else roundTree(x, by, Math.max(3, Math.round((3 + hash1(cx0, 15) * 3) * U)), px3(c2[0]), px3(c2[1]), px3(c2[2]), trunk);
        } else if (b === B_SNOW && r < .75) spruce(x, by, Math.round((10 + hash1(cx0, 11) * 9) * U), px3(c2[0]), px3(c2[1]), px3(c2[2]), trunk);
        else if (b === B_DESERT && r < .32) cactus(x, by, Math.round((7 + hash1(cx0, 11) * 6) * U), px3(grade([76, 160, 92], .05)), px3(grade([48, 116, 74], .05)));
      }
      if (b === B_FOREST) { const fc = [[255, 140, 190], [255, 224, 90], [250, 250, 255], [176, 130, 255]].map((c) => px3(grade(c, .03))); for (let x = 1; x < W - 1; x++) if (hash1(x, 77) > .93) fput(x, ridge[2][x] - 1, fc[(hash1(x, 78) * 4) | 0]); }
    }
  }
  function caveFg() {
    fgTop = 0;
    for (let x = 0; x < W; x++) {
      const len = Math.round(H * (.04 + .16 * Math.pow(fbm(TAB[13], x * .05, 2), 1.6)) * (.6 + .8 * hash1(x >> 2, 3)));
      for (let y = 0; y < len; y++) { const half = (1 - y / len); if (hash1(x, 11) > half * .9 + .05 && y > 2) break; const v = 14 + 18 * (1 - y / len); fgBuf[y * W + x] = px(c255(v), c255(v - 2), c255(v + 10)); }
      const fl = Math.round(H * (.03 + .1 * Math.pow(fbm(TAB[12], x * .06 + 9, 2), 1.8)));
      for (let y = 0; y < fl; y++) { const v = 12 + 14 * (y / fl); fgBuf[(H - 1 - y) * W + x] = px(c255(v), c255(v - 2), c255(v + 9)); }
    }
  }

  /* ---------- светила, звёзды, облака, птицы, сияние ---------- */
  function blend(i, r, g, b, a) {
    if (i < 0 || i >= buf.length) return;
    const c = buf[i], cr = c & 255, cg = (c >> 8) & 255, cb = (c >> 16) & 255;
    buf[i] = ((255 << 24) | ((cb + (b - cb) * a) << 16) | ((cg + (g - cg) * a) << 8) | (cr + (r - cr) * a) | 0) >>> 0;
  }
  /* диск, закрашенный через дизеринг: ореолы из рядов точек, как в пиксель-арте */
  function haloD(cx, cy, R, r, g, b, cover, a) {
    const R2 = R * R, x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W - 1, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(Math.floor(hzCur) + 2, H - 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= R2 && cover > BAY[((y & 3) << 2) | (x & 3)]) blend(y * W + x, r, g, b, a); }
  }
  function disc(cx, cy, R, r, g, b, a) {
    const R2 = R * R + R * .5, x0 = Math.max(0, Math.floor(cx - R - 1)), x1 = Math.min(W - 1, Math.ceil(cx + R + 1)), y0 = Math.max(0, Math.floor(cy - R - 1)), y1 = Math.min(H - 1, Math.ceil(cy + R + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= R2) blend(y * W + x, r, g, b, a); }
  }
  function drawSun(sx, sy, R, e, vis) {
    const warm = 1 - sstep(0, .4, Math.max(0, e)), g1 = lerp(240, 150, warm), b1 = lerp(150, 70, warm);
    disc(sx, sy, R * 3.2, 255, g1, b1, .07 * vis); disc(sx, sy, R * 2.3, 255, g1, b1, .1 * vis); disc(sx, sy, R * 1.6, 255, lerp(246, 170, warm), lerp(190, 90, warm), .16 * vis);
    disc(sx, sy, R, 255, lerp(214, 130, warm), lerp(90, 40, warm), vis);
    disc(sx, sy, R - 1, 255, lerp(236, 170, warm), lerp(130, 70, warm), vis);
    disc(sx, sy, R * .62, 255, lerp(250, 206, warm), lerp(190, 110, warm), vis);
    disc(sx - R * .25, sy - R * .25, R * .3, 255, 252, lerp(240, 190, warm), vis);
  }
  const CRAT = [[-.3, -.2, .22], [.25, .3, .18], [.1, -.5, .12], [-.15, .5, .14], [.45, -.1, .1]];
  function drawMoon(mx, my, R, vis, phase) {
    disc(mx, my, R * 2.8, 170, 190, 255, .06 * vis); disc(mx, my, R * 2, 190, 205, 255, .09 * vis); disc(mx, my, R * 1.4, 210, 222, 255, .14 * vis);
    const k = Math.cos(phase * 6.2831853), wax = phase < .5, R2 = R * R + R * .4;
    const x0 = Math.max(0, Math.floor(mx - R - 1)), x1 = Math.min(W - 1, Math.ceil(mx + R + 1)), y0 = Math.max(0, Math.floor(my - R - 1)), y1 = Math.min(H - 1, Math.ceil(my + R + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy; if (d2 > R2) continue;
      const nx = dx / R, ny = dy / R, xt = k * Math.sqrt(Math.max(0, 1 - ny * ny)), lit = wax ? nx > xt : nx < -xt;
      if (!lit) { blend(y * W + x, 58, 66, 118, .6 * vis); continue; }
      let cr = 250, cg = 246, cb = 222; if (nx * nx + ny * ny > .8) { cr = 232; cg = 228; cb = 204; }
      for (const c of CRAT) { const ex = nx - c[0], ey = ny - c[1]; if (ex * ex + ey * ey < c[2] * c[2]) { cr = 212; cg = 208; cb = 186; break; } }
      blend(y * W + x, cr, cg, cb, vis);
    }
  }
  const bodyPos = () => {
    const a = (Y.time - .25) * 6.2831853, hz = hzCur, rx = W * .44, ry = hz * .78, cx = W * .5, R = Math.max(5 * SC, Math.min(16 * SC, Math.round(Math.min(W, H) * .065)));
    return { sx: cx - Math.cos(a) * rx, sy: hz - Math.sin(a) * ry, mx: cx + Math.cos(a) * rx, my: hz + Math.sin(a) * ry, R };
  };
  function drawBodies(e) {
    const p = bodyPos(), hz = hzCur, vis = 1 - Y.ov * .8;
    if (p.sy < hz + p.R + 3) drawSun(p.sx, p.sy, p.R, e, vis);
    if (p.my < hz + p.R + 3) drawMoon(p.mx, p.my, Math.max(4, Math.round(p.R * .85)), vis, (Y.day * .125 + .5 + Y.time * .125) % 1);
  }
  /* звёзды-искры: точка, плюс и большая искра с цветным центром */
  function drawStars(tick, sA) {
    for (const s of stars) {
      const x = (s.x * W) | 0, y = (s.y * H * .78) | 0; if (x < 2 || x >= W - 2 || y < 2 || y >= hzCur - 3) continue;
      const tw = .5 + .5 * Math.sin(tick / (8 + s.m * 3) + s.ph), al = sA * (.6 + .4 * tw), c = s.c, i = y * W + x;
      blend(i, c[0], c[1], c[2], al);
      if (s.m >= 1 && tw > .35) { const q = al * .6; blend(i - 1, c[0], c[1], c[2], q); blend(i + 1, c[0], c[1], c[2], q); blend(i - W, c[0], c[1], c[2], q); blend(i + W, c[0], c[1], c[2], q); }
      if (s.m === 2 && tw > .7) { const q = al * .45; blend(i - 2, c[0], c[1], c[2], q); blend(i + 2, c[0], c[1], c[2], q); blend(i - 2 * W, c[0], c[1], c[2], q); blend(i + 2 * W, c[0], c[1], c[2], q); blend(i - 1, 255, 255, 255, al); }
    }
    if (sA > .7 && !meteor && Math.random() < .0012) { const d = Math.random() < .5 ? 1 : -1; meteor = { x: W * (.2 + Math.random() * .6), y: H * (.04 + Math.random() * .2), vx: d * (1.6 + Math.random() * .8), vy: .7 + Math.random() * .6, l: 22 }; }
    if (meteor) {
      const m = meteor; m.x += m.vx; m.y += m.vy; m.l--;
      for (let k = 0; k < 9; k++) { const x = Math.round(m.x - m.vx * k * .9), y = Math.round(m.y - m.vy * k * .9); if (x >= 0 && x < W && y >= 0 && y < hzCur - 1) blend(y * W + x, 255, 255, 240, Math.min(1, (1 - k / 9) * Math.min(1, m.l / 8)) * sA); }
      if (m.l <= 0 || m.x < 0 || m.x >= W) meteor = null;
    }
  }
  /* северное сияние над снегом: волнистые ленты, зелёный → бирюзовый → фиолетовый, из точек дизеринга */
  function drawAurora(tick, night) {
    const hz = hzCur, top = hz * .1, h = hz * .36;
    for (let x = 0; x < W; x++) {
      const wave = Math.sin(x * .045 + tick * .012) * h * .16 + Math.sin(x * .11 - tick * .02) * h * .06, y0 = top + h * .25 + wave, colH = h * (.6 + .3 * Math.sin(x * .03 + tick * .008));
      for (let k = 0; k < colH; k++) {
        const y = Math.round(y0 + k); if (y < 0 || y >= hz * .92) continue;
        const t = k / colH, al = (t < .12 ? t / .12 : 1 - (t - .12) / .88) * night;
        if (al * .9 <= BAY[((y & 3) << 2) | (x & 3)]) continue;
        const c = t < .4 ? lerp3([110, 255, 170], [70, 220, 220], t / .4) : lerp3([70, 220, 220], [176, 110, 240], (t - .4) / .6);
        blend(y * W + x, c[0], c[1], c[2], .55);
      }
    }
  }
  /* пушистое облако: ряд пузырей с плоским низом, свет сверху, тень снизу */
  function mkPuff(i, sz) {
    /* облако из круглых пузырей разного размера (в середине крупнее), низ срезан ровно; свет сверху, тень снизу */
    const w = Math.max(24, Math.round(W * (.15 + .17 * sz))), n = 4 + Math.floor(hash1(i, 5) * 3), circ = [];
    let maxR = 0;
    for (let q = 0; q < n; q++) {
      const t = n === 1 ? .5 : q / (n - 1), mid = 1 - Math.abs(t - .5) * 2, r = w * (.1 + .13 * mid * (.7 + .3 * hash1(i, 30 + q)));
      circ.push([r + (w - 2 * r) * t + (hash1(i, 20 + q) - .5) * w * .06, r]); if (r > maxR) maxR = r;
    }
    const h = Math.max(6, Math.round(maxR * 1.5) + 2), base = h - 1, m = new Uint8Array(w * h);
    for (const [cx, r] of circ) { const cy = base - r * .5; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = x + .5 - cx, dy = y + .5 - cy; if (dx * dx + dy * dy <= r * r) m[y * w + x] = 1; } }
    const tone = new Uint8Array(w * h).fill(255), sh0 = base - Math.round(h * .3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      const up = y > 0 && m[(y - 1) * w + x], up2 = y > 1 && m[(y - 2) * w + x], ul = y > 0 && x > 0 && m[(y - 1) * w + x - 1];
      tone[y * w + x] = (!up || !up2 || !ul) && y < sh0 ? 0 : (y > sh0 || (y === sh0 && ((x + y) & 1))) ? 2 : 1;
    }
    return { w, h, tone, kind: 0 };
  }
  /* полосатое облако на закате: длинная тонкая лента с сужающимися концами */
  function mkStreak(i) {
    const w = Math.max(24, Math.round(W * (.22 + .3 * hash1(i, 7)))), h = 3 + Math.floor(hash1(i, 8) * 3), tone = new Uint8Array(w * h).fill(255);
    for (let y = 0; y < h; y++) {
      const cut = Math.round(y * (w * .11)) + (hash1(i, 50 + y) > .5 ? 2 : 0), off = Math.round(hash1(i, 60 + y) * w * .06);
      for (let x = cut + off; x < w - cut - 2; x++) tone[y * w + x] = y === 0 ? 0 : y === h - 1 ? 2 : 1;
    }
    return { w, h, tone, kind: 1 };
  }
  function drawClouds(e, wind) {
    const p = keyAt(CLOUD_KEYS, e), ov = Y.ov, tw = Math.max(0, 1 - Math.abs(e - .03) / .2), night = 1 - sstep(-.3, 0, e);
    let lit = [p[0], p[1], p[2]], mid = [p[3], p[4], p[5]], sh = [p[6], p[7], p[8]], al = p[9];
    if (ov > .01) { lit = lerp3(lit, [206, 212, 224], ov * .9); mid = lerp3(mid, [150, 158, 174], ov * .9); sh = lerp3(sh, [104, 112, 130], ov * .9); al = lerp(al, .98, ov); }
    if (scene === B_DESERT) { const dw = sstep(0, .3, e) * (1 - ov); lit = lerp3(lit, [255, 240, 214], .75 * dw); mid = lerp3(mid, [246, 208, 170], .75 * dw); sh = lerp3(sh, [214, 164, 146], .75 * dw); }
    const pal = [lit, mid, sh], streakVis = Math.max(tw * 1.15, night * .3) * (1 - ov), sc = keyAt(STREAK_KEYS, e), spal = [[sc[0], sc[1], sc[2]], [sc[3], sc[4], sc[5]], [sc[6], sc[7], sc[8]]];
    for (const c of clouds) {
      const sp = c.sp;
      if (sp.kind === 1 && streakVis < .05) continue;
      if (c.extra && ov < .05) continue;
      c.x += c.v * 3 + wind * .05; if (c.x > W + 2) c.x = -sp.w - 2; else if (c.x < -sp.w - 4) c.x = W + 1;
      const alpha = al * (c.extra ? Math.min(1, ov * 1.3) : 1) * (sp.kind === 1 ? Math.min(1, streakVis) : 1), bx = Math.round(c.x), by = sp.kind === 1 ? Math.round((.5 + c.yn * .4) * hzCur) : Math.round(c.yn * hzCur * .6) + 2;
      for (let y = 0; y < sp.h; y++) {
        const yy = by + y; if (yy < 0 || yy >= H) continue;
        for (let x = 0; x < sp.w; x++) {
          const t = sp.tone[y * sp.w + x]; if (t === 255) continue;
          const xx = bx + x; if (xx < 0 || xx >= W) continue;
          const col = sp.kind === 1 ? spal[t] : pal[t]; blend(yy * W + xx, col[0], col[1], col[2], alpha);
        }
      }
    }
  }
  /* птицы: тёмные «галочки» машут крыльями, днём и на закате */
  function drawBirds(tick, e) {
    const day = sstep(-.05, .2, e) * (1 - Y.ov); if (day < .15 || scene === B_VOLC) return;
    for (const b of birds) {
      b.x += b.v * 3; if (b.x > W + 6) b.x = -6;
      const x = Math.round(b.x), y = Math.round(b.y * hzCur * .5 + 4 + Math.sin(tick / 45 + b.ph) * 2), up = ((tick >> 3) + b.ph * 3 | 0) & 1, a = .85 * day;
      const pts = up ? [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]] : [[-2, 0], [-1, -1], [0, 0], [1, -1], [2, 0]];
      for (const q of pts) if (x + q[0] >= 0 && x + q[0] < W) blend((y + q[1]) * W + x + q[0], 34, 38, 66, a);
    }
  }
  /* светлячки на лугу в сумерках и ночью */
  function drawFlies(tick, e) {
    const k = 1 - sstep(-.2, .08, e); if (k < .1 || scene !== B_FOREST) return;
    for (const f of flies) {
      const x = Math.round(f.x * W + Math.sin(tick * .011 * f.sp + f.ph) * 9), y = Math.round(f.y * H + Math.cos(tick * .014 * f.sp + f.ph) * 5), p = Math.max(0, Math.sin(tick * .04 * f.sp + f.ph * 2)) * k;
      if (p < .15 || x < 1 || x >= W - 1 || y < 1 || y >= H - 1) continue;
      const i = y * W + x; blend(i, 214, 255, 130, .95 * p);
      if (p > .4) { blend(i - 1, 214, 255, 130, .3 * p); blend(i + 1, 214, 255, 130, .3 * p); blend(i - W, 214, 255, 130, .3 * p); blend(i + W, 214, 255, 130, .3 * p); }
    }
  }
  /* искры над вулканом */
  function drawEmbers() {
    if (scene !== B_VOLC) return;
    for (const m of embers) {
      m.y -= m.vy; m.x += Math.sin(m.y * .2 + m.ph) * .3; m.l--;
      if (m.l <= 0 || m.y < 2) { m.x = volcX * W + (Math.random() - .5) * 8; m.y = hzCur - HT[0][B_VOLC][Math.max(0, Math.min(W - 1, Math.round(m.x)))] * H; m.vy = .3 + Math.random() * .6; m.l = 40 + Math.random() * 60; m.ph = Math.random() * 6; }
      const x = Math.round(m.x), y = Math.round(m.y); if (x >= 0 && x < W && y >= 0 && y < H) blend(y * W + x, 255, 150, 50, clamp01(m.l / 40) * .9);
    }
  }
  /* блики солнца и луны на воде */
  function drawGlitter(tick, e) {
    if (scene !== B_SEA) return;
    const p = bodyPos(), hz = hzCur, sunUp = p.sy < hz - 1, moonUp = !sunUp && p.my < hz - 1; if (!sunUp && !moonUp) return;
    const bx = sunUp ? p.sx : p.mx, col = sunUp ? [255, 244, 210] : [190, 226, 255], vis = (sunUp ? .9 : .8) * (1 - Y.ov * .8);
    for (let y = Math.ceil(hz) + 2; y < H; y += 2) {
      const k = (y - hz) / (H - hz), hw = p.R * (.5 + 2.4 * k);
      for (let q = 0; q < 3; q++) {
        const r = hash1(y, q + (tick >> 6)), len = Math.round((3 + r * 9) * (1 + k * 2)), x0 = Math.round(bx + (hash1(y + 9, q + (tick >> 6)) - .5) * 2 * hw - len / 2);
        for (let x = x0; x < x0 + len; x++) if (x >= 0 && x < W) blend(y * W + x, col[0], col[1], col[2], .75 * vis * (1 - .4 * k));
      }
    }
  }
  function drawCave(tick) {
    for (const c of crystals) {
      const x = (c.x * W) | 0, y = (c.y * H) | 0, pu = .55 + .45 * Math.sin(tick / 30 + c.ph);
      for (let k = -2; k <= 2; k++) blend(y * W + x + k, c.c[0], c.c[1], c.c[2], .22 * pu);
      blend(y * W + x, c.c[0], c.c[1], c.c[2], .8 * pu); if (y > 0) blend((y - 1) * W + x, c.c[0], c.c[1], c.c[2], .5 * pu); blend((y + 1) * W + x, c.c[0], c.c[1], c.c[2], .5 * pu);
      haloD(x, y, 5, c.c[0], c.c[1], c.c[2], .5 * pu, .4);
    }
  }

  /* ---------- главный вход ---------- */
  function compose(S, tick) {
    buf.set(skyBuf);
    let e = 0;
    if (Y.cave) drawCave(tick);
    else {
      e = elev(); const sA = (1 - sstep(-.3, .02, e)) * (1 - Y.ov * .9);
      if (sA > .02) { drawStars(tick, sA); if (scene === B_SNOW && sA > .3) drawAurora(tick, sA); }
      drawBodies(e);
      drawClouds(e, S.wind || 0);
      drawBirds(tick, e);
    }
    for (let i = fgTop * W, N = W * H; i < N; i++) { const v = fgBuf[i]; if (v !== 0) buf[i] = v; }
    if (!Y.cave) { drawGlitter(tick, e); drawFlies(tick, e); drawEmbers(); }
    if (xfade > 0) {   /* плавная смена сцены: старый кадр растворяется */
      const f = Math.round(xfade * 256), g = 256 - f;
      for (let i = 0, N = W * H; i < N; i++) { const a = buf[i], b = old[i]; if (a === b) continue; buf[i] = (((((a & 255) * g + (b & 255) * f) >> 8) | ((((a >> 8) & 255) * g + ((b >> 8) & 255) * f) & 0xff00) | ((((((a >> 16) & 255) * g + ((b >> 16) & 255) * f)) << 8) & 0xff0000)) | 0xff000000) >>> 0; }
      xfade = Math.max(0, xfade - .03);
    }
    ctx.putImageData(img, 0, 0);
  }
  function draw(S, tick) {
    n++;
    const wt = S.weather | 0, ot = wt === 3 ? 1 : wt === 1 ? .6 : wt === 2 ? .5 : 0; Y.ov += (ot - Y.ov) * .012;
    if (dirty) { sample(S, true); applyScene(); rebuildSky(); rebuildFg(); dirty = 0; compose(S, tick); return; }
    if (n % 24 === 0) sample(S, false);
    if (n % 30 === 6) rebuildSky(); else if (n % 30 === 18) rebuildFg();
    if (n % 3 === 0) compose(S, tick);
  }
  function ambient() {
    const e = elev();
    if (Y.cave) { Y.amb = [.52, .54, .72]; Y.ambKey = 9999; Y.night = .6; return Y; }
    const eb = Math.round(Math.max(-.4, Math.min(.4, e)) * 20), ob = Math.round(Y.ov * 4), am = keyAt(AMB_KEYS, eb / 20), s = 1 - ob / 4 * .2;
    Y.amb = am.map((v) => v * s); Y.ambKey = (eb + 8) + 17 * ob; Y.night = 1 - sstep(-.3, .05, e);
    return Y;
  }
  function advance(dtMs) {
    if (!Y.auto) return;
    Y.time += dtMs / 1000 / DAY_SEC;
    if (Y.time >= 1) { Y.time -= 1; Y.day++; }
  }
  function init(canvas, w, h) {
    w *= SC; h *= SC;   /* фон рисуется вдвое мельче клеток мира: тонкий дизеринг и детали, как в настоящем пиксель-арте */
    W = w; H = h; canvas.width = w; canvas.height = h; ctx = canvas.getContext('2d');
    img = ctx.createImageData(w, h); buf = new Uint32Array(img.data.buffer); old = new Uint32Array(w * h); skyBuf = new Uint32Array(w * h); fgBuf = new Uint32Array(w * h); xfade = 0;
    hzCur = h * HZ[scene];
    if (!stars.length) {
      const ns = 150, cols = [[255, 255, 255], [190, 214, 255], [255, 236, 190], [255, 190, 230], [160, 240, 255]];
      for (let i = 0; i < ns; i++) stars.push({ x: Math.random(), y: Math.random(), m: Math.random() < .1 ? 2 : Math.random() < .35 ? 1 : 0, ph: Math.random() * 6.28, c: cols[(Math.random() * cols.length) | 0] });
      for (let i = 0; i < 9; i++) crystals.push({ x: .05 + Math.random() * .9, y: .08 + Math.random() * .84, ph: Math.random() * 6.28, c: [[120, 220, 255], [190, 130, 255], [130, 255, 180]][i % 3] });
      for (let i = 0; i < 6; i++) birds.push({ x: Math.random() * 300, y: .1 + Math.random() * .8, v: .05 + Math.random() * .06, ph: Math.random() * 6 });
      for (let i = 0; i < 14; i++) flies.push({ x: Math.random(), y: .55 + Math.random() * .4, ph: Math.random() * 6.28, sp: .6 + Math.random() * .9 });
      for (let i = 0; i < 26; i++) embers.push({ x: 0, y: 0, vy: 0, l: 0, ph: 0 });
    }
    clouds = [];
    const nc = Math.max(3, Math.round(w / SC / 70));
    for (let i = 0; i < nc + 6; i++) { const extra = i >= nc, sz = extra ? .8 + Math.random() * .4 : Math.random(); clouds.push({ xn: Math.random(), x: 0, yn: extra ? .1 + Math.random() * .8 : (i + .2 + Math.random() * .6) / nc * .85, v: .012 + Math.random() * .03, extra, sp: mkPuff(i + SEED % 11, sz) }); clouds[i].x = clouds[i].xn * w; }
    for (let i = 0; i < 6; i++) { const c = { xn: Math.random(), x: 0, yn: (i + .3 + Math.random() * .4) / 6, v: .006 + Math.random() * .012, extra: false, sp: mkStreak(i + SEED % 7) }; c.x = c.xn * w; clouds.push(c); }
    genShapes(); dirty = 2;
  }
  function set(o) {
    if (o.time !== undefined) { Y.time = ((+o.time % 1) + 1) % 1; dirty = Math.max(dirty, 1); }
    if (o.auto !== undefined) Y.auto = !!o.auto;
    if (o.lock !== undefined) {
      const l = LOCKS.indexOf(o.lock) >= 0 ? o.lock : 'auto', was = Y.cave;
      Y.lock = l; Y.cave = l === 'cave'; lockB = ['forest', 'desert', 'snow', 'rock', 'volcano', 'sea'].indexOf(l);
      if (buf && !dirty) { if (was !== Y.cave) dirty = 2; else if (lockB >= 0 && lockB !== scene) switchScene(lockB, false); } else dirty = 2;
      if (lockB >= 0) scene = lockB;
    }
    if (o.day !== undefined) Y.day = o.day | 0;
  }
  const NAMES = [[.2, 'Ночь'], [.3, 'Рассвет'], [.42, 'Утро'], [.62, 'День'], [.72, 'Вечер'], [.82, 'Закат'], [.87, 'Сумерки'], [1.01, 'Ночь']];
  function label() {
    const m = Math.round(Y.time * 1440) % 1440, hh = Math.floor(m / 60), mm = m % 60;
    let nm = 'Ночь'; for (const q of NAMES) if (Y.time < q[0]) { nm = q[1]; break; }
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ' · ' + nm;
  }
  return { init, draw, advance, ambient, set, label, LOCKS, DAY_SEC, get time() { return Y.time; }, get auto() { return Y.auto; }, get lock() { return Y.lock; }, get day() { return Y.day; }, get scene() { return scene; }, Y };
})();
