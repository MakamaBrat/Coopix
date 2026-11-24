'use strict';
/* ПИКСЕЛИЯ — фон: время суток, солнце и луна с фазами, звёзды и облака, дальние горы и холмы, которые подстраиваются под почву,
   и стена под землёй (как в Terraria). Всё считается на CPU в буфер размером с мир и выводится на канвас #bg.
   Тяжёлое (небо, горы, стена) пересчитывается редко и по очереди; каждый кадр — копия готового неба, светила, звёзды, облака. */
const Sky = (function () {
  const NB = 6, B_FOREST = 0, B_DESERT = 1, B_SNOW = 2, B_ROCK = 3, B_VOLC = 4, B_SEA = 5;
  const LOCKS = ['auto', 'forest', 'desert', 'snow', 'rock', 'volcano', 'sea', 'cave'];
  const DAY_SEC = 240, ST = 7;
  const Y = { time: .3, auto: true, lock: 'auto', day: 0, ov: 0, night: 0, ambKey: 0, amb: [1, 1, 1], cave: false };
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  const c255 = (v) => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const sstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const px = (r, g, b, a) => (((a === undefined ? 255 : a) << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const hash1 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const SEED = (Math.random() * 1e6) | 0;
  const TAB = [];
  (function () { for (let k = 0; k < 14; k++) { const t = new Float32Array(256); let s = (SEED * 2654435761 + k * 97531) | 1; for (let i = 0; i < 256; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; t[i] = (s >>> 0) / 4294967296; } TAB.push(t); } })();
  const vn = (t, x) => { const i = Math.floor(x), f = x - i, a = t[i & 255], b = t[(i + 1) & 255], u = f * f * (3 - 2 * f); return a + (b - a) * u; };
  const fbm = (t, x, o) => { let s = 0, a = .5, f = 1, n = 0; for (let k = 0; k < o; k++) { s += a * vn(t, x * f + k * 31.7); n += a; a *= .5; f *= 2.03; } return s / n; };
  const NZ = new Int8Array(256); for (let i = 0; i < 256; i++) NZ[i] = Math.round((hash1(i, 5) - .5) * 8);

  /* --- ключевые цвета по высоте солнца e (−1 полночь … 1 полдень) --- */
  const keyAt = (arr, e) => {
    if (e <= arr[0].e) return arr[0].c;
    for (let i = 1; i < arr.length; i++) if (e <= arr[i].e) { const a = arr[i - 1], b = arr[i], t = sstep(0, 1, (e - a.e) / (b.e - a.e)); return a.c.map((v, k) => v + (b.c[k] - v) * t); }
    return arr[arr.length - 1].c;
  };
  const SKY_KEYS = [
    { e: -1, c: [4, 6, 26, 10, 16, 52, 18, 32, 86] }, { e: -.32, c: [4, 6, 26, 10, 16, 52, 18, 32, 86] },
    { e: -.14, c: [16, 20, 62, 44, 40, 100, 120, 64, 104] }, { e: -.02, c: [40, 54, 132, 130, 92, 140, 250, 128, 70] },
    { e: .12, c: [58, 104, 196, 140, 160, 208, 255, 196, 120] }, { e: .42, c: [52, 128, 228, 108, 178, 240, 176, 224, 250] },
    { e: 1, c: [52, 128, 228, 108, 178, 240, 176, 224, 250] }];
  const AMB_KEYS = [{ e: -1, c: [.44, .52, .80] }, { e: -.4, c: [.44, .52, .80] }, { e: -.15, c: [.56, .54, .80] }, { e: -.02, c: [.95, .76, .66] },
    { e: .1, c: [1, .9, .8] }, { e: .3, c: [1, 1, 1] }, { e: 1, c: [1, 1, 1] }];
  const CLOUD_KEYS = [
    { e: -1, c: [86, 104, 168, 58, 74, 130, 38, 50, 98, .72] }, { e: -.3, c: [86, 104, 168, 58, 74, 130, 38, 50, 98, .72] },
    { e: -.1, c: [190, 130, 150, 130, 90, 130, 84, 64, 110, .85] }, { e: 0, c: [255, 196, 150, 244, 150, 120, 170, 108, 120, .9] },
    { e: .15, c: [255, 236, 214, 242, 214, 200, 200, 180, 196, .92] }, { e: .4, c: [255, 255, 255, 232, 240, 252, 190, 206, 232, .94] },
    { e: 1, c: [255, 255, 255, 232, 240, 252, 190, 206, 232, .94] }];

  /* цвета слоёв [биом][слой дальний/средний/ближний] = [тело, кромка] при дневном свете */
  const LCOL = [
    [[[104, 150, 168], [150, 196, 200]], [[60, 122, 98], [104, 170, 118]], [[30, 84, 62], [62, 130, 72]]],
    [[[214, 160, 112], [240, 196, 138]], [[226, 178, 114], [248, 214, 144]], [[200, 150, 82], [238, 198, 112]]],
    [[[138, 164, 206], [234, 243, 255]], [[104, 138, 184], [214, 232, 250]], [[38, 92, 96], [206, 228, 238]]],
    [[[118, 118, 150], [168, 168, 198]], [[86, 84, 108], [134, 132, 156]], [[78, 78, 100], [118, 116, 140]]],
    [[[88, 48, 58], [158, 76, 62]], [[56, 32, 40], [124, 58, 46]], [[32, 20, 28], [88, 44, 38]]],
    [[[122, 152, 198], [176, 200, 230]], [[44, 104, 176], [84, 150, 214]], [[28, 76, 150], [50, 112, 192]]]];
  const FOG = [.55, .3, .1];
  const WALLC = [[52, 36, 28], [100, 76, 50], [62, 82, 112], [44, 46, 58], [58, 26, 24], [26, 70, 134]];
  const TB = [];
  (function () {
    const set = (keys, arr) => keys.forEach((k) => { if (E[k] !== undefined) TB[E[k]] = arr; });
    set(['EARTH', 'MUD', 'SEED', 'CONE', 'FSEED', 'LEAF', 'WOOD', 'SPROUT', 'LITTER', 'FLY'], [B_FOREST, 1]);
    set(['SAND', 'SALT'], [B_DESERT, 1]); set(['GLASS'], [B_DESERT, .5, B_ROCK, .5]); set(['SNOW', 'ICE'], [B_SNOW, 1]);
    set(['STONE', 'WALL', 'METAL', 'GUNP', 'BATT', 'LAMP', 'CLONE', 'VOID', 'ASH', 'SPARK'], [B_ROCK, 1]);
    set(['LAVA'], [B_VOLC, 1]); set(['WATER', 'BRINE', 'OIL', 'ACID'], [B_SEA, 1]);
  })();

  let ctx, img, buf, skyBuf, fgBuf, W = 0, H = 0, n = 0, dirty = 2;
  let cur, tgt, pre, surf, hist, HT = [], hzCur = 100, fgTop = 0, lockB = -1, avgW = new Float32Array(NB), volcX = .5, hor = [176, 224, 250];
  let stars = [], clouds = [], meteor = null, crystals = [];

  /* ---------- формы гор ---------- */
  function bump(x, cell, prob, round, k, ws) {
    const i = Math.floor(x / cell); if (hash1(i, k + SEED % 97) > prob) return 0;
    const wd = cell * (.55 + .4 * hash1(i, k + 7)) * (ws || 1), c = (i + .3 + .4 * hash1(i, k + 13)) * cell, d = Math.abs(x - c) / (wd / 2 + .001);
    if (d >= 1) return 0; const hh = .6 + .4 * hash1(i, k + 21); return hh * (round ? Math.sqrt(1 - d * d) : 1 - d);
  }
  function genShapes() {
    const U = Math.max(.6, Math.min(1.5, H / 204)), ph = (SEED % 628) / 100, ph2 = (SEED % 331) / 50;
    HT = []; for (let l = 0; l < 3; l++) { HT.push([]); for (let b = 0; b < NB; b++) HT[l].push(new Float32Array(W)); }
    const ic = [0, 1, 2].map((i) => .12 + .76 * hash1(i, SEED % 53)), iw = [0, 1, 2].map((i) => .04 + .05 * hash1(i, SEED % 29 + 3));
    for (let x = 0; x < W; x++) {
      const xn = x / W, f = (k, fr, o) => fbm(TAB[k], xn * fr, o), rg = (k, fr, o) => Math.pow(1 - Math.abs(2 * fbm(TAB[k], xn * fr, o) - 1), 1.3);
      HT[0][B_FOREST][x] = .11 + .10 * f(0, 3.2, 3);
      HT[1][B_FOREST][x] = .05 + .075 * f(1, 5.5, 3) + .022 * bump(x, 9 * U, .8, true, 1);
      HT[2][B_FOREST][x] = .04 + .04 * f(2, 8, 2) + .05 * bump(x, 15 * U, .85, true, 2);
      HT[0][B_DESERT][x] = .05 + .17 * Math.floor(f(3, 2.6, 2) * 3.4) / 3;
      HT[1][B_DESERT][x] = .045 + .06 * (.5 + .5 * Math.sin(xn * 9 + ph)) * (.6 + .4 * f(4, 4, 2));
      HT[2][B_DESERT][x] = .03 + .035 * Math.abs(Math.sin(xn * 14 + ph2)) + .06 * bump(x, 26 * U, .55, false, 3, .13);
      HT[0][B_SNOW][x] = .06 + .30 * Math.pow(rg(5, 3.4, 4), 1.4);
      HT[1][B_SNOW][x] = .05 + .14 * rg(6, 6, 3);
      HT[2][B_SNOW][x] = .03 + .065 * bump(x, 9 * U, .9, false, 4);
      HT[0][B_ROCK][x] = .08 + .28 * rg(7, 4.4, 4);
      HT[1][B_ROCK][x] = .04 + .15 * Math.floor(f(8, 5, 2) * 5) / 5;
      HT[2][B_ROCK][x] = .03 + .045 * f(9, 12, 2) + .03 * bump(x, 18 * U, .5, true, 5);
      HT[1][B_VOLC][x] = .04 + .10 * rg(10, 6, 3);
      HT[2][B_VOLC][x] = .03 + .06 * rg(11, 10, 2);
      let isl = 0; for (let i = 0; i < 3; i++) isl += .055 * Math.pow(Math.max(0, 1 - Math.abs((xn - ic[i]) / iw[i])), 1.4);
      HT[0][B_SEA][x] = .018 + .06 * Math.pow(f(2, 2.4, 3), 2.4) + isl;
    }
    volcFar();
  }
  function volcFar() {
    const a = HT[0][B_VOLC], xc = volcX, cw = .24;
    for (let x = 0; x < W; x++) {
      const xn = x / W, dx = Math.abs(xn - xc), cone = Math.pow(Math.max(0, 1 - dx / cw), 1.15);
      a[x] = .05 + .34 * cone + .03 * fbm(TAB[12], xn * 5, 3) - (dx < .022 ? .035 * (1 - dx / .022) : 0);
    }
  }

  /* ---------- почва: что лежит сверху в каждом столбце ---------- */
  function sample(S, snap) {
    const A = S.A, type = A.type, fl = A.fl, vy = A.vy, aux = A.aux, AIRt = E.AIR;
    tgt.fill(0); hist.fill(0); let cnt = 0;
    for (let x = 1; x < W - 1; x++) {
      let y = 1, t = 0, found = false, plant = false;
      for (; y < H - 1; y++) {
        const i = y * W + x; t = type[i];
        if (t === AIRt || KIND[t] === K.GAS || fl[i]) continue;
        const k = KIND[t];
        if ((k === K.POWDER || k === K.LIQUID) && vy[i] > 0 && type[i + W] === AIRt) continue;   /* падает, ещё не почва */
        if ((t === E.LEAF || t === E.WOOD || t === E.SPROUT) && aux[i] !== 0) { plant = true; continue; }   /* крона и ствол растущего дерева: почва ниже */
        found = true; break;
      }
      const o = x * NB;
      if (!found) { surf[x] = H; tgt[o + B_FOREST] = 1; continue; }
      surf[x] = y; hist[y]++; cnt++;
      const a = TB[t] || [B_ROCK, 1];
      for (let q = 0; q < a.length; q += 2) tgt[o + a[q]] += a[q + 1];
      if (plant) tgt[o + B_FOREST] += .7;
    }
    for (let x = 1; x < W - 1; x++) { const o = x * NB; let sm = 0; for (let b = 0; b < NB; b++) sm += tgt[o + b]; if (sm > 0) for (let b = 0; b < NB; b++) tgt[o + b] /= sm; }
    surf[0] = surf[1]; surf[W - 1] = surf[W - 2];
    for (let b = 0; b < NB; b++) { tgt[b] = tgt[NB + b]; tgt[(W - 1) * NB + b] = tgt[(W - 2) * NB + b]; }
    let hzT = H * .66;
    if (cnt) { let s = 0; for (let y = 0; y < H; y++) { s += hist[y]; if (s >= cnt / 2) { hzT = y; break; } } }
    hzT = Math.max(H * .38, Math.min(H * .8, hzT));
    hzCur = snap ? hzT : hzCur + (hzT - hzCur) * .25;
    if (lockB >= 0) { for (let x = 0; x < W; x++) for (let b = 0; b < NB; b++) cur[x * NB + b] = b === lockB ? 1 : 0; avgW.fill(0); avgW[lockB] = 1; if (lockB === B_VOLC) { volcX = .5; volcFar(); } return; }
    const R = Math.max(3, Math.round(W * .05)), k = snap ? 1 : .16; avgW.fill(0);
    for (let b = 0; b < NB; b++) {
      pre[0] = 0; for (let x = 0; x < W; x++) pre[x + 1] = pre[x] + tgt[x * NB + b];
      let sum = 0, sx = 0;
      for (let x = 0; x < W; x++) {
        const lo = Math.max(0, x - R), hi = Math.min(W - 1, x + R), v = (pre[hi + 1] - pre[lo]) / (hi - lo + 1), o = x * NB + b;
        cur[o] += (v - cur[o]) * k; sum += cur[o]; sx += cur[o] * x;
      }
      avgW[b] = sum / W;
      if (b === B_VOLC && sum > W * .02) { const nx = sx / sum / W; volcX = snap ? nx : volcX + (nx - volcX) * .12; }
    }
    if (avgW[B_VOLC] > .02) volcFar();
  }

  /* ---------- небо ---------- */
  const elev = () => Math.sin((Y.time - .25) * 6.2831853);
  const grey = (v) => { const l = v[0] * .3 + v[1] * .59 + v[2] * .11; return [l * .82 + 14, l * .84 + 16, l * .9 + 22]; };
  function skyPalette(e) {
    const c = keyAt(SKY_KEYS, e), rising = Y.time < .5;
    let top = [c[0], c[1], c[2]], mid = [c[3], c[4], c[5]], h = [c[6], c[7], c[8]];
    const tw = Math.max(0, 1 - Math.abs(e + .04) / .22);
    if (rising) { h[0] -= 6 * tw; h[1] += 14 * tw; h[2] += 36 * tw; } else { h[0] += 10 * tw; h[1] -= 8 * tw; h[2] -= 14 * tw; }
    const dayF = sstep(-.05, .3, e);
    if (avgW[B_VOLC] > .02) { const k = Math.min(.55, avgW[B_VOLC] * .8); h = lerp3(h, [176, 56, 40], k); mid = lerp3(mid, [90, 36, 52], k * .7); top = lerp3(top, [40, 18, 34], k * .5); }
    if (avgW[B_DESERT] > .02) h = lerp3(h, [255, 218, 160], Math.min(.3, avgW[B_DESERT] * .4) * dayF);
    if (avgW[B_SNOW] > .02) top = lerp3(top, [150, 190, 240], Math.min(.15, avgW[B_SNOW] * .2) * dayF);
    if (Y.ov > .01) { const k = Y.ov * .85; top = lerp3(top, grey(top), k); mid = lerp3(mid, grey(mid), k); h = lerp3(h, grey(h), k); }
    return { top, mid, hor: h };
  }
  const BAY = [0, .5, .75, .25];
  function rebuildSky() {
    if (Y.cave) { buildCave(); return; }
    const e = elev(), P = skyPalette(e); hor = P.hor;
    const hz = Math.max(8, hzCur), rows = new Float32Array(H * 3);
    for (let y = 0; y < H; y++) {
      const t = Math.min(1, y / hz); let c;
      if (t < .5) c = lerp3(P.top, P.mid, t * 2); else c = lerp3(P.mid, P.hor, Math.pow((t - .5) * 2, .85));
      rows[y * 3] = c[0]; rows[y * 3 + 1] = c[1]; rows[y * 3 + 2] = c[2];
    }
    /* свечение у горизонта: около солнца на рассвете и закате */
    const tw = Math.max(0, 1 - Math.abs(e + .04) / .24) * (1 - Y.ov * .7), a = (Y.time - .25) * 6.2831853;
    const sx = W * .5 - Math.cos(a) * W * .47, cy = Math.min(hz - 1, hz - Math.sin(a) * hz * .8), RX = W * .56, RY = Math.max(10, hz * .55);
    const glow = Y.time < .5 ? [255, 150, 120] : [255, 140, 70];
    const gx0 = Math.max(0, Math.floor(sx - RX)), gx1 = Math.min(W - 1, Math.ceil(sx + RX)), gy0 = Math.max(0, Math.floor(cy - RY)), gy1 = Math.min(H - 1, Math.ceil(cy + RY));
    for (let y = 0; y < H; y++) {
      const r0 = rows[y * 3], g0 = rows[y * 3 + 1], b0 = rows[y * 3 + 2], o = y * W, ty = (y & 1) * 2;
      const inG = tw > .01 && y >= gy0 && y <= gy1;
      const th0 = BAY[ty], th1 = BAY[ty + 1];
      const e0 = px(c255(Math.floor(r0 / ST + th0) * ST), c255(Math.floor(g0 / ST + th0) * ST), c255(Math.floor(b0 / ST + th0) * ST)), e1 = px(c255(Math.floor(r0 / ST + th1) * ST), c255(Math.floor(g0 / ST + th1) * ST), c255(Math.floor(b0 / ST + th1) * ST));
      for (let x = 0; x < W; x++) skyBuf[o + x] = (x & 1) ? e1 : e0;
      if (inG) {
        const dy = (y - cy) / RY;
        for (let x = gx0; x <= gx1; x++) {
          const dx = (x - sx) / RX, d2 = dx * dx + dy * dy; if (d2 >= 1) continue;
          const k = (1 - d2) * (1 - d2) * tw * .85, th = BAY[ty + (x & 1)];
          skyBuf[o + x] = px(c255(Math.floor((r0 + (glow[0] - r0) * k) / ST + th) * ST), c255(Math.floor((g0 + (glow[1] - g0) * k) / ST + th) * ST), c255(Math.floor((b0 + (glow[2] - b0) * k) / ST + th) * ST));
        }
      }
    }
  }
  function buildCave() {
    for (let y = 0; y < H; y++) {
      const t = y / H, bR = lerp(40, 22, t), bG = lerp(38, 20, t), bB = lerp(56, 34, t);
      for (let x = 0; x < W; x++) {
        const big = fbm(TAB[13], x * .04 + y * .02, 3) - .5, nz = NZ[(x * 5 + y * 11) & 255], st = ((y * 3 + (x >> 2)) % 13 === 0) ? -6 : 0;
        const v = big * 26 + nz + st;
        skyBuf[y * W + x] = px(c255(bR + v), c255(bG + v), c255(bB + v * 1.1));
      }
    }
    hor = [30, 28, 44];
  }

  /* ---------- горы, холмы и стена под землёй ---------- */
  function rebuildFg() {
    fgBuf.fill(0); fgTop = H;
    if (Y.cave) { caveFg(); return; }
    const e = elev(), am = keyAt(AMB_KEYS, e).map((v) => v * (1 - Y.ov * .2)), hz = hzCur, hr = hor[0], hg = hor[1], hb = hor[2];
    const LC = [];
    for (let l = 0; l < 3; l++) { LC.push([]); for (let b = 0; b < NB; b++) { const c = LCOL[b][l], f = FOG[l]; LC[l].push([0, 1].map((q) => [lerp(c[q][0] * am[0], hr, f), lerp(c[q][1] * am[1], hg, f), lerp(c[q][2] * am[2], hb, f)])); } }
    const base = [hz - .005 * H, hz + .035 * H, hz + .07 * H], capC = [lerp(240 * am[0], hr, .45), lerp(248 * am[1], hg, .45), lerp(255 * am[2], hb, .45)];
    const lava = [255, 112, 32];
    for (let l = 0; l < 3; l++) {
      for (let x = 0; x < W; x++) {
        const o = x * NB; let hh = 0, br = 0, bg = 0, bb = 0, er = 0, eg = 0, ebb = 0, ws = 0, wv = 0;
        for (let b = 0; b < NB; b++) {
          const w = cur[o + b]; if (w < .004) continue;
          hh += w * HT[l][b][x]; const L = LC[l][b];
          br += w * L[0][0]; bg += w * L[0][1]; bb += w * L[0][2]; er += w * L[1][0]; eg += w * L[1][1]; ebb += w * L[1][2];
          if (b === B_SNOW) ws = w; else if (b === B_VOLC) wv = w;
        }
        const ridge = Math.round(base[l] - hh * H), lim = Math.min(H, surf[x] + 2);
        if (ridge >= lim) continue;
        if (ridge < fgTop) fgTop = Math.max(0, ridge);
        const y0 = Math.max(0, ridge), above = base[l] - ridge, cap = (ws > .05 && l < 2) ? Math.round(above * (.34 + .18 * Math.sin(x * .7)) * (l ? .8 : 1)) : 0;
        const streak = (l === 0 && wv > .25) ? Math.max(0, hash1(x >> 1, 91) > .55 ? 5 + Math.floor(hash1(x, 17) * 14 * H / 204) : 0) : 0;
        const hazeH = .3 * H;
        for (let y = y0; y < lim; y++) {
          const d = y - ridge; let r, g, b;
          if (d === 0) { r = er; g = eg; b = ebb; }
          else if (d === 1) { r = (er + br) * .5; g = (eg + bg) * .5; b = (ebb + bb) * .5; }
          else { const q = Math.min(1, d / hazeH) * .45; r = br + (hr - br) * q; g = bg + (hg - bg) * q; b = bb + (hb - bb) * q; }
          if (d < cap) { r = r + (capC[0] - r) * ws; g = g + (capC[1] - g) * ws; b = b + (capC[2] - b) * ws; }
          const nz = NZ[(x * 5 + y * 11) & 255];
          if (streak && d >= 2 && d < 2 + streak && ((x + y) & 3) < 2) { r = lerp(r, lava[0], wv * .9); g = lerp(g, lava[1], wv * .9); b = lerp(b, lava[2], wv * .9); }
          else if (l === 0 && wv > .25 && d <= 1 && Math.abs(x / W - volcX) < .02) { r = lerp(r, lava[0], wv); g = lerp(g, lava[1], wv); b = lerp(b, lava[2], wv); }
          fgBuf[y * W + x] = px(c255(r + nz), c255(g + nz), c255(b + nz));
        }
      }
    }
    /* стена под землёй: тёмный задник, чтобы пустоты под землёй не просвечивали небом */
    for (let x = 0; x < W; x++) {
      const s = surf[x]; if (s >= H) continue;
      let wr = 0, wg = 0, wb = 0; const o = x * NB;
      for (let b = 0; b < NB; b++) { const w = cur[o + b]; if (w < .004) continue; wr += w * WALLC[b][0]; wg += w * WALLC[b][1]; wb += w * WALLC[b][2]; }
      const sea = cur[o + B_SEA], k = .62;
      wr *= am[0] * k; wg *= am[1] * k; wb *= am[2] * k;
      const volc = cur[o + B_VOLC];
      for (let y = Math.max(0, s); y < H; y++) {
        const df = 1 - .5 * Math.min(1, (y - s) / (H * .5)), nz = NZ[(x * 3 + y * 17) & 255], st = ((y * 3 + (x >> 2)) % 13 === 0) ? -7 : 0, v = nz + st;
        let r = wr * df + v, g = wg * df + v, b = wb * df + v * 1.1;
        if (volc > .3 && hash1(x, y) > .992) { r = lerp(r, 255, .85); g = lerp(g, 120, .85); b = lerp(b, 40, .85); }
        fgBuf[y * W + x] = px(c255(r), c255(g), c255(b));
      }
      if (s < fgTop) fgTop = Math.max(0, s);
    }
  }
  function caveFg() {
    fgTop = 0;
    for (let x = 0; x < W; x++) {
      const len = Math.round(H * (.04 + .16 * Math.pow(fbm(TAB[13], x * .05, 3), 1.6)) * (.6 + .8 * hash1(x >> 2, 3)));
      for (let y = 0; y < len; y++) { const half = (1 - y / len); if (hash1(x, 11) > half * .9 + .05 && y > 2) break; const d = 1 - y / len; const v = 14 + 18 * d; fgBuf[y * W + x] = px(c255(v + NZ[(x + y * 7) & 255]), c255(v - 2), c255(v + 10)); }
      const fl = Math.round(H * (.03 + .1 * Math.pow(fbm(TAB[12], x * .06 + 9, 3), 1.8)));
      for (let y = 0; y < fl; y++) { const v = 12 + 14 * (y / fl); fgBuf[(H - 1 - y) * W + x] = px(c255(v + NZ[(x * 3 + y) & 255]), c255(v - 2), c255(v + 9)); }
    }
  }

  /* ---------- светила, звёзды, облака ---------- */
  function blend(i, r, g, b, a) {
    const c = buf[i], cr = c & 255, cg = (c >> 8) & 255, cb = (c >> 16) & 255;
    buf[i] = ((255 << 24) | ((cb + (b - cb) * a) << 16) | ((cg + (g - cg) * a) << 8) | (cr + (r - cr) * a) | 0) >>> 0;
  }
  function disc(cx, cy, R, r, g, b, a) {
    const R2 = R * R + R * .5, x0 = Math.max(0, Math.floor(cx - R - 1)), x1 = Math.min(W - 1, Math.ceil(cx + R + 1)), y0 = Math.max(0, Math.floor(cy - R - 1)), y1 = Math.min(hzCur + R, H - 1) | 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= R2) blend(y * W + x, r, g, b, a); }
  }
  function drawSun(sx, sy, R, e, vis) {
    const warm = 1 - sstep(0, .4, Math.max(0, e)), rg = lerp(236, 150, warm), rb = lerp(170, 70, warm);
    const rings = [[R + 19, .045], [R + 12, .09], [R + 7, .17], [R + 3, .30]];
    for (const [rad, al] of rings) disc(sx, sy, rad, 255, rg, rb, al * vis);
    const R2 = R * R + R * .5, x0 = Math.max(0, Math.floor(sx - R - 1)), x1 = Math.min(W - 1, Math.ceil(sx + R + 1)), y0 = Math.max(0, Math.floor(sy - R - 1)), y1 = Math.min(H - 1, Math.ceil(sy + R + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - sx, dy = y - sy, d2 = dx * dx + dy * dy; if (d2 > R2) continue;
      const d = Math.sqrt(d2) / R; let cr = 255, cg, cb;
      if (d < .5) { cg = 253; cb = lerp(236, 190, warm); } else if (d > .86) { cg = lerp(216, 120, warm); cb = lerp(120, 50, warm); } else { cg = lerp(240, 170, warm); cb = lerp(168, 82, warm); }
      blend(y * W + x, cr, cg, cb, vis);
    }
  }
  const CRAT = [[-.3, -.2, .22], [.25, .3, .18], [.1, -.5, .12], [-.15, .5, .14], [.45, -.1, .1]];
  function drawMoon(mx, my, R, vis, phase) {
    disc(mx, my, R + 8, 190, 205, 255, .05 * vis); disc(mx, my, R + 4, 200, 214, 255, .10 * vis);
    const k = Math.cos(phase * 6.2831853), wax = phase < .5, R2 = R * R + R * .4;
    const x0 = Math.max(0, Math.floor(mx - R - 1)), x1 = Math.min(W - 1, Math.ceil(mx + R + 1)), y0 = Math.max(0, Math.floor(my - R - 1)), y1 = Math.min(H - 1, Math.ceil(my + R + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy; if (d2 > R2) continue;
      const nx = dx / R, ny = dy / R, xt = k * Math.sqrt(Math.max(0, 1 - ny * ny)), lit = wax ? nx > xt : nx < -xt;
      if (!lit) { blend(y * W + x, 52, 62, 104, .5 * vis); continue; }
      let cr = 244, cg = 242, cb = 218; const rim = nx * nx + ny * ny;
      if (rim > .78) { cr = 228; cg = 226; cb = 200; }
      for (const c of CRAT) { const ex = nx - c[0], ey = ny - c[1]; if (ex * ex + ey * ey < c[2] * c[2]) { cr = 206; cg = 204; cb = 180; break; } }
      blend(y * W + x, cr, cg, cb, vis);
    }
  }
  function drawBodies(e, tick) {
    const a = (Y.time - .25) * 6.2831853, hz = hzCur, rx = W * .47, ry = hz * .8, cx = W * .5, R = Math.max(4, Math.min(13, Math.round(Math.min(W, H) * .05))), vis = 1 - Y.ov * .8;
    const sx = cx - Math.cos(a) * rx, sy = hz - Math.sin(a) * ry;
    if (sy < hz + R + 3) drawSun(sx, sy, R, e, vis);
    const mx = cx + Math.cos(a) * rx, my = hz + Math.sin(a) * ry;
    if (my < hz + R + 3) drawMoon(mx, my, Math.max(3, Math.round(R * .85)), vis, (Y.day * .125 + .5 + Y.time * .125) % 1);
  }
  function drawStars(tick, sA) {
    for (const s of stars) {
      const x = (s.x * W) | 0, y = (s.y * H * .78) | 0; if (x >= W || y >= hzCur - 1) continue;
      const tw = .5 + .5 * Math.sin(tick / (7 + s.m * 3) + s.ph), al = sA * (s.m === 0 ? .55 + .3 * tw : .75 + .25 * tw);
      blend(y * W + x, s.c[0], s.c[1], s.c[2], al);
      if (s.m === 2 && tw > .7) { const q = al * .5; if (x > 0) blend(y * W + x - 1, s.c[0], s.c[1], s.c[2], q); if (x < W - 1) blend(y * W + x + 1, s.c[0], s.c[1], s.c[2], q); if (y > 0) blend((y - 1) * W + x, s.c[0], s.c[1], s.c[2], q); blend((y + 1) * W + x, s.c[0], s.c[1], s.c[2], q); }
    }
    if (sA > .7) {
      if (!meteor && Math.random() < .0012) { const d = Math.random() < .5 ? 1 : -1; meteor = { x: W * (.2 + Math.random() * .6), y: H * (.04 + Math.random() * .2), vx: d * (1.6 + Math.random() * .8), vy: .7 + Math.random() * .6, l: 22 }; }
    }
    if (meteor) {
      const m = meteor; m.x += m.vx; m.y += m.vy; m.l--;
      for (let k = 0; k < 9; k++) { const x = Math.round(m.x - m.vx * k * .9), y = Math.round(m.y - m.vy * k * .9); if (x >= 0 && x < W && y >= 0 && y < hzCur - 1) blend(y * W + x, 255, 255, 240, Math.min(1, (1 - k / 9) * Math.min(1, m.l / 8)) * sA); }
      if (m.l <= 0 || m.x < 0 || m.x >= W) meteor = null;
    }
  }
  function mkCloud(i, sz) {
    const w = Math.max(10, Math.round(W * (.07 + .13 * sz))), h = Math.max(4, Math.round(w * (.26 + .06 * hash1(i, 3)))), m = new Uint8Array(w * h);
    const nb = 3 + Math.floor(hash1(i, 5) * 4);
    for (let q = 0; q < nb; q++) {
      const cx = (q + .5) / nb * w + (hash1(i, 20 + q) - .5) * w * .15, ry = h * (.34 + .3 * hash1(i, 30 + q)), rx = w / nb * (.7 + .5 * hash1(i, 40 + q)), cy = h - 1 - ry * .55;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) m[y * w + x] = 1; }
    }
    const tone = new Uint8Array(w * h).fill(255);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      const up = y > 0 && m[(y - 1) * w + x], t = y / h;
      tone[y * w + x] = (!up || t < .26) ? 0 : t > .68 ? 2 : 1;
    }
    return { w, h, tone };
  }
  function drawClouds(e, wind) {
    const p = keyAt(CLOUD_KEYS, e), ov = Y.ov;
    let lit = [p[0], p[1], p[2]], mid = [p[3], p[4], p[5]], sh = [p[6], p[7], p[8]], al = p[9];
    if (ov > .01) { lit = lerp3(lit, [206, 212, 224], ov * .9); mid = lerp3(mid, [150, 158, 174], ov * .9); sh = lerp3(sh, [104, 112, 130], ov * .9); al = lerp(al, .98, ov); }
    const pal = [lit, mid, sh];
    for (const c of clouds) {
      if (c.extra && ov < .05) continue;
      c.x += c.v * 3 + wind * .05; if (c.x > W + 2) c.x = -c.sp.w - 2; else if (c.x < -c.sp.w - 4) c.x = W + 1;
      const alpha = al * (c.extra ? Math.min(1, ov * 1.3) : 1), bx = Math.round(c.x), by = Math.round(c.yn * hzCur * .62) + 2, sp = c.sp;
      for (let y = 0; y < sp.h; y++) {
        const yy = by + y; if (yy < 0 || yy >= H) continue;
        for (let x = 0; x < sp.w; x++) {
          const t = sp.tone[y * sp.w + x]; if (t === 255) continue;
          const xx = bx + x; if (xx < 0 || xx >= W) continue;
          const col = pal[t]; blend(yy * W + xx, col[0], col[1], col[2], alpha);
        }
      }
    }
  }
  function drawCave(tick) {
    for (const c of crystals) {
      const x = (c.x * W) | 0, y = (c.y * H) | 0, pu = .55 + .45 * Math.sin(tick / 30 + c.ph);
      for (let k = -2; k <= 2; k++) blend(y * W + x + k, c.c[0], c.c[1], c.c[2], .22 * pu);
      blend(y * W + x, c.c[0], c.c[1], c.c[2], .8 * pu); if (y > 0) blend((y - 1) * W + x, c.c[0], c.c[1], c.c[2], .5 * pu); blend((y + 1) * W + x, c.c[0], c.c[1], c.c[2], .5 * pu);
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d2 = dx * dx + dy * dy; if (d2 > 1 && d2 <= 16) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < W && yy >= 0 && yy < H) blend(yy * W + xx, c.c[0], c.c[1], c.c[2], .07 * pu * (1 - d2 / 17)); } }
    }
  }

  /* ---------- главный вход ---------- */
  function compose(S, tick) {
    buf.set(skyBuf);
    if (Y.cave) drawCave(tick);
    else {
      const e = elev(), sA = (1 - sstep(-.3, .02, e)) * (1 - Y.ov * .9);
      if (sA > .02) drawStars(tick, sA);
      drawBodies(e, tick);
      drawClouds(e, S.wind || 0);
    }
    for (let i = fgTop * W, N = W * H; i < N; i++) { const v = fgBuf[i]; if (v !== 0) buf[i] = v; }
    ctx.putImageData(img, 0, 0);
  }
  function draw(S, tick) {
    n++;
    const wt = S.weather | 0, ot = wt === 3 ? 1 : wt === 1 ? .6 : wt === 2 ? .5 : 0; Y.ov += (ot - Y.ov) * .012;
    if (dirty) { sample(S, true); rebuildSky(); rebuildFg(); dirty = 0; compose(S, tick); return; }
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
    W = w; H = h; canvas.width = w; canvas.height = h; ctx = canvas.getContext('2d');
    img = ctx.createImageData(w, h); buf = new Uint32Array(img.data.buffer); skyBuf = new Uint32Array(w * h); fgBuf = new Uint32Array(w * h);
    cur = new Float32Array(w * NB); tgt = new Float32Array(w * NB); pre = new Float32Array(w + 1); surf = new Int16Array(w).fill(h); hist = new Uint32Array(h + 2);
    for (let x = 0; x < w; x++) cur[x * NB + B_FOREST] = 1;
    hzCur = h * .66;
    if (!stars.length) {
      const ns = 190, cols = [[255, 255, 255], [190, 210, 255], [255, 232, 200]];
      for (let i = 0; i < ns; i++) stars.push({ x: Math.random(), y: Math.random(), m: Math.random() < .12 ? 2 : Math.random() < .4 ? 1 : 0, ph: Math.random() * 6.28, c: cols[(Math.random() * 3) | 0] });
      for (let i = 0; i < 9; i++) crystals.push({ x: .05 + Math.random() * .9, y: .08 + Math.random() * .84, ph: Math.random() * 6.28, c: [[120, 220, 255], [190, 130, 255], [130, 255, 180]][i % 3] });
    }
    clouds = [];
    const nc = Math.max(4, Math.round(w / 48));
    for (let i = 0; i < nc + 6; i++) { const extra = i >= nc, sz = extra ? .8 + Math.random() * .4 : Math.random(); clouds.push({ xn: Math.random(), x: 0, yn: extra ? .1 + Math.random() * .8 : .05 + Math.random() * .75, v: .012 + Math.random() * .03, extra, sp: mkCloud(i + SEED % 11, sz) }); clouds[i].x = clouds[i].xn * w; }
    genShapes(); dirty = 2;
  }
  function set(o) {
    if (o.time !== undefined) { Y.time = ((+o.time % 1) + 1) % 1; dirty = Math.max(dirty, 1); }
    if (o.auto !== undefined) Y.auto = !!o.auto;
    if (o.lock !== undefined) {
      const l = LOCKS.indexOf(o.lock) >= 0 ? o.lock : 'auto';
      if (l !== Y.lock || dirty) { Y.lock = l; Y.cave = l === 'cave'; const bi = ['forest', 'desert', 'snow', 'rock', 'volcano', 'sea'].indexOf(l); lockB = bi; dirty = 2; }
    }
    if (o.day !== undefined) Y.day = o.day | 0;
  }
  const NAMES = [[.2, 'Ночь'], [.3, 'Рассвет'], [.42, 'Утро'], [.62, 'День'], [.72, 'Вечер'], [.82, 'Закат'], [.87, 'Сумерки'], [1.01, 'Ночь']];
  function label() {
    const m = Math.round(Y.time * 1440) % 1440, hh = Math.floor(m / 60), mm = m % 60;
    let nm = 'Ночь'; for (const q of NAMES) if (Y.time < q[0]) { nm = q[1]; break; }
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ' · ' + nm;
  }
  return { init, draw, advance, ambient, set, label, LOCKS, DAY_SEC, get time() { return Y.time; }, get auto() { return Y.auto; }, get lock() { return Y.lock; }, get day() { return Y.day; }, Y, snapshotReady: () => !!buf };
})();
