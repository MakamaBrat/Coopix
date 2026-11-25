'use strict';
/* ПИКСЕЛИЯ — ядро симуляции: клеточный автомат с температурой, давлением воды, горением, током, взрывами и ростом деревьев */
const Sim = (function () {
  const { AIR, WALL, SKY, EARTH, SAND, SNOW, SALT, GUNP, ASH, WATER, BRINE, OIL, LAVA, ACID, MUD, FIRE, STEAM, SMOKE, GAS, STONE, METAL, GLASS,
    WOOD, ICE, LEAF, SEED, SPROUT, SPARK, BATT, LAMP, CLONE, VOID, FLY, CONE, FSEED, LITTER } = E;
  const ERODE = .012;
  let W = 0, H = 0, N = 0;
  let type, Tm, life, aux, vv, burn, vy, fl, stamp, pr;
  let fr = 1, NB4, NB8, DIRS;
  const S = { camps: [], homes: [], graves: [], tod: .3, wind: 0, weather: 0, shake: 0, pressure: true, A: {}, bolts: [], meteors: [], W: 0, H: 0, frame: 0, sfx: null,
    stats: { blasts: 0, lightning: 0, meteors: 0 }, act: { p: 0, l: 0, f: 0 } };
  const act = S.act;
  /* летящие обломки */
  const MAXF = 5000;
  const fIdx = new Int32Array(MAXF), fx = new Float32Array(MAXF), fy = new Float32Array(MAXF), fvx = new Float32Array(MAXF), fvy = new Float32Array(MAXF), fttl = new Uint8Array(MAXF);
  let nf = 0;

  let seed = ((Date.now() ^ 0x9e3779b9) | 0) || 1;
  function rnd() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) * 2.3283064365386963e-10; }
  function rn(n) { return (rnd() * n) | 0; }
  const sfx = (n, v) => { if (S.sfx) S.sfx(n, v); };

  function alloc(w, h) {
    W = w; H = h; N = w * h;
    type = new Uint8Array(N); Tm = new Float32Array(N).fill(AMB); life = new Uint8Array(N); aux = new Uint8Array(N);
    vv = new Uint8Array(N); burn = new Uint8Array(N); vy = new Int8Array(N); fl = new Uint8Array(N); stamp = new Uint16Array(N); pr = new Uint8Array(N);
    for (let i = 0; i < N; i++) vv[i] = (rnd() * 256) | 0;
    NB4 = [-W, W, -1, 1]; NB8 = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]; DIRS = [-W, -W + 1, 1, W + 1, W, W - 1, -1, -W - 1];
    nf = 0; S.camps.length = 0; S.homes.length = 0; S.graves.length = 0; S.bolts.length = 0; S.meteors.length = 0; if (S.ents) S.ents.length = 0; if (S.plants) S.plants.length = 0; if (S.bodies) S.bodies.length = 0;
    S.A = { type, Tm, life, aux, vv, burn, fl, vy }; S.W = W; S.H = H; S.tscale = Math.max(.75, Math.min(1.3, Math.min(W, H * 1.6) / 190));
    borders();
  }
  function borders() {
    for (let x = 0; x < W; x++) { type[x] = SKY; type[(H - 1) * W + x] = WALL; }
    for (let y = 0; y < H; y++) { type[y * W] = WALL; type[y * W + W - 1] = WALL; }
  }
  function clear() {
    type.fill(0); Tm.fill(AMB); life.fill(0); aux.fill(0); burn.fill(0); vy.fill(0); fl.fill(0); pr.fill(0); nf = 0;
    S.camps.length = 0; S.homes.length = 0; S.graves.length = 0; S.bolts.length = 0; S.meteors.length = 0; if (S.ents) S.ents.length = 0; if (S.plants) S.plants.length = 0; if (S.bodies) S.bodies.length = 0; borders();
  }
  function initLife(i, t) {
    switch (t) {
      case ACID: life[i] = 12; break;
      case BRINE: life[i] = 6; break;   /* крепость рассола: делится с соседней пресной водой и разбавляется */
      case STEAM: life[i] = 110 + rn(140); break;
      case SMOKE: life[i] = 50 + rn(150); break;
      case FIRE: life[i] = 10 + rn(16); break;
      case BATT: life[i] = rn(8); break;
      case SPARK: life[i] = 3; break;
    }
  }
  function put(i, t, temp) {
    type[i] = t; life[i] = 0; aux[i] = 0; burn[i] = 0; vy[i] = 0; fl[i] = 0; vv[i] = (rnd() * 256) | 0;
    Tm[i] = temp === undefined ? (T0[t] === 20 ? AMB : T0[t]) : temp;
    initLife(i, t);
  }
  function conv(i, t) { type[i] = t; life[i] = 0; aux[i] = 0; burn[i] = 0; initLife(i, t); }
  function swap(a, b) {
    let t = type[a]; type[a] = type[b]; type[b] = t;
    const f = Tm[a]; Tm[a] = Tm[b]; Tm[b] = f;
    t = life[a]; life[a] = life[b]; life[b] = t;
    t = aux[a]; aux[a] = aux[b]; aux[b] = t;
    t = vv[a]; vv[a] = vv[b]; vv[b] = t;
    t = burn[a]; burn[a] = burn[b]; burn[b] = t;
    t = vy[a]; vy[a] = vy[b]; vy[b] = t;
    t = fl[a]; fl[a] = fl[b]; fl[b] = t;
    stamp[a] = stamp[b] = fr;
  }

  /* ---------- горение ---------- */
  function ignite(j) {
    const t = type[j], f = FLAMM[t];
    if (f === 0 || burn[j] !== 0) return;
    if (t === GUNP && (aux[j] & 1)) return;
    burn[j] = Math.min(255, FUEL[t] + rn((FUEL[t] >> 1) + 1));
    if (Tm[j] < BHEAT[t] * .5) Tm[j] = BHEAT[t] * .5;
  }
  function burnStep(i, x, y, t) {
    /* дерево горит дольше: тянется как настоящий ствол */
    const tb = t === WOOD ? (rnd() < .55 ? 1 : 0) : 1;
    const b = burn[i] - tb; burn[i] = b;
    const bh = BHEAT[t]; if (Tm[i] < bh) Tm[i] = bh;
    const up = i - W, plant = t === WOOD || t === LEAF;
    if (type[up] === AIR) {
      const r = rnd(), fp = FLAMEP[t];
      if (r < fp) { put(up, FIRE); Tm[up] = Math.max(520, bh * .8); } else if (r < fp + (plant ? .09 : .04)) put(up, SMOKE);
    }
    if (rnd() < FLAMEP[t] * .35) { const sd = i + (rnd() < .5 ? -1 : 1); if (type[sd] === AIR) { put(sd, FIRE); Tm[sd] = Math.max(480, bh * .7); } }
    /* жар поднимается: вверх огонь перекидывается охотнее, вниз неохотно */
    const n = i + NB8[rn(8)], tn = type[n];
    if (FLAMM[tn] !== 0 && burn[n] === 0 && rnd() < FLAMM[tn] * (n < i - 1 ? 2.4 : n > i + 1 ? .45 : 1)) ignite(n);
    /* искры-угольки разлетаются и поджигают соседние деревья */
    if ((plant && rnd() < .012) || (t === OIL && rnd() < .006)) {
      if (type[up] === AIR) { put(up, FIRE); Tm[up] = 700; launch(up, (rnd() - .5) * 1.9 + S.wind * .9, -1 - rnd() * 1.8); if (nf) fttl[nf - 1] = 42; }
    }
    if (burn[i] === 0) finishBurn(i, x, y, t);
  }
  function finishBurn(i, x, y, t) {
    switch (t) {
      case WOOD: if (rnd() < .4) conv(i, ASH); else put(i, AIR); break;
      case LEAF: if (rnd() < .12) conv(i, ASH); else put(i, AIR); break;
      case GUNP: put(i, AIR); blast(x, y, 3 + rn(2), .85); break;
      case GAS: put(i, FIRE, 900); if (rnd() < .35) blast(x, y, 2, .45); break;
      default: put(i, AIR);
    }
  }

  /* ---------- взрыв и обломки ---------- */
  function launch(i, vx, vy_) {
    if (nf >= MAXF || fl[i]) return;
    fl[i] = 1; vy[i] = 0;
    fIdx[nf] = i; fx[nf] = i % W; fy[nf] = (i / W) | 0; fvx[nf] = vx; fvy[nf] = vy_; fttl[nf] = 110; nf++;
  }
  function blast(cx, cy, R, power) {
    const R2 = R * R;
    S.shake = Math.max(S.shake, Math.min(14, power * R * 1.1)); S.stats.blasts++; if (S.ents.length) entBlast(cx, cy, R, power);
    if (typeof Houses !== 'undefined') Houses.blast(cx, cy, R, power);
    sfx('boom', Math.min(1, power * R / 8));
    for (let y = cy - R; y <= cy + R; y++) {
      if (y < 1 || y >= H - 1) continue;
      for (let x = cx - R; x <= cx + R; x++) {
        if (x < 1 || x >= W - 1) continue;
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 > R2) continue;
        const i = y * W + x, t = type[i], d = Math.sqrt(d2), f = 1 - d / R, s = f * power;
        Tm[i] += s * 520;
        if (t === AIR) { if (f > .55 && rnd() < s * .6) { put(i, FIRE); Tm[i] = 800; } continue; }
        if (t === WALL || t === SKY || t === VOID || t === CLONE || t === METAL) continue;
        const k = KIND[t];
        if (k === K.SOLID || k === K.SPEC) {
          if (t === STONE) { if (s > .6 && rnd() < s - .25) { conv(i, SAND); } else continue; }
          else if (t === GLASS) { if (s > .18) conv(i, SAND); else continue; }
          else if (t === WOOD) { if (s > .4) { if (rnd() < .5) conv(i, ASH); else { put(i, FIRE); continue; } } else continue; }
          else if (t === ICE) { if (s > .5) conv(i, SNOW); else continue; }
          else { if (s > .22) { put(i, rnd() < .35 ? FIRE : AIR); } continue; }
        } else if (f > .86 && rnd() < .65) { put(i, FIRE); Tm[i] = 850; continue; }
        const sp = s * 9 + rnd() * 1.5;
        let ux, uy;
        if (d < .8) { const a = rnd() * 6.283; ux = Math.cos(a); uy = Math.sin(a); } else { ux = dx / d; uy = dy / d; }
        launch(i, ux * sp + (rnd() - .5), uy * sp - .6 + (rnd() - .5) * .5);
      }
    }
  }
  function stepFlying() {
    let w = 0;
    for (let k = 0; k < nf; k++) {
      let cur = fIdx[k];
      if (!fl[cur] || type[cur] === AIR) continue;
      const x0 = cur % W, y0 = (cur / W) | 0;
      const nx = fx[k] + fvx[k], ny = fy[k] + fvy[k];
      let vyy = fvy[k] + .2; const vxx = fvx[k] * .995;
      const tx = Math.round(nx), ty = Math.round(ny);
      const dx = tx - x0, dy = ty - y0, n = Math.max(Math.abs(dx), Math.abs(dy));
      let blocked = false;
      for (let s = 1; s <= n; s++) {
        const px = x0 + Math.round(dx * s / n), py = y0 + Math.round(dy * s / n);
        if (px < 1 || px >= W - 1 || py < 1 || py >= H - 1) { blocked = true; break; }
        const j = py * W + px, tj = type[j];
        if (tj === AIR || (KIND[tj] === K.GAS && tj !== FIRE)) { swap(cur, j); cur = j; stamp[cur] = fr; } else { blocked = true; break; }
      }
      stamp[cur] = fr;
      if (blocked || --fttl[k] === 0) { fl[cur] = 0; vy[cur] = 0; continue; }
      fIdx[w] = cur; fx[w] = nx; fy[w] = ny; fvx[w] = vxx; fvy[w] = vyy; fttl[w] = fttl[k]; w++;
    }
    nf = w;
  }

  /* ---------- молния и метеорит ---------- */
  function lightning(x0) {
    let x = Math.max(2, Math.min(W - 3, x0 | 0)), y = 1;
    const cells = [];
    while (y < H - 2) {
      const i = y * W + x, t = type[i];
      if (t !== AIR && KIND[t] !== K.GAS) { strike(i, x, y); break; }
      cells.push(i);
      if (rnd() < .4) x += rnd() < .5 ? -1 : 1;
      x = Math.max(1, Math.min(W - 2, x));
      y++;
      if (rnd() < .5) cells.push(y * W + x);
    }
    S.bolts.push({ cells, ttl: 8 }); S.stats.lightning++;
    S.shake = Math.max(S.shake, 4);
    sfx('zap', 1);
  }
  function strike(i, x, y) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 1 || xx >= W - 1 || yy < 1 || yy >= H - 1) continue;
      const j = yy * W + xx, d = Math.max(Math.abs(dx), Math.abs(dy));
      Tm[j] += (3 - d) * 450;
      const tj = type[j];
      if (tj === SAND && d <= 1) { conv(j, GLASS); Tm[j] = 1250; }
      else if (FLAMM[tj] !== 0) ignite(j);
      if (ISCOND[tj] && (tj !== WATER || d <= 1)) aux[j] = 1;
    }
    blast(x, y, 3, .3); if (S.ents.length) { entShock(x, y, 3); entBlast(x, y, 5, 1); }
  }
  function meteor(x, dir, vx) {
    S.meteors.push({ x: x, y: 1, vx: vx != null ? vx : (dir || (rnd() < .5 ? -1 : 1)) * (.9 + rnd() * .8), vy: vx != null ? 2 : 1.9 + rnd() * .5, trail: [] });
    sfx('whoosh', 1);
  }
  function stepMeteors() {
    for (let k = S.meteors.length - 1; k >= 0; k--) {
      const m = S.meteors[k];
      m.trail.push(m.x, m.y); if (m.trail.length > 28) m.trail.splice(0, 2);
      m.x += m.vx; m.y += m.vy;
      const xx = Math.round(m.x), yy = Math.round(m.y);
      let hit = false;
      if (xx < 1 || xx >= W - 1) hit = true;
      else if (yy >= H - 2) hit = true;
      else if (yy >= 1) { const t = type[yy * W + xx]; if (t !== AIR && KIND[t] !== K.GAS) hit = true; }
      if (hit) { S.meteors.splice(k, 1); impact(Math.max(2, Math.min(W - 3, xx)), Math.max(2, Math.min(H - 3, yy))); }
    }
  }
  function impact(x, y) {
    S.stats.meteors++;
    blast(x, y, 9, 1.15);
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      if (dx * dx + dy * dy > 25) continue;
      const xx = x + dx, yy = y + dy; if (xx < 1 || xx >= W - 1 || yy < 1 || yy >= H - 1) continue;
      const j = yy * W + xx; Tm[j] = Math.max(Tm[j], 700 - (dx * dx + dy * dy) * 14);
      if (FLAMM[type[j]] !== 0) ignite(j);
    }
    for (let k = 0; k < 26; k++) {
      const a = rnd() * 6.283, r = rnd() * 3.5, xx = x + Math.round(Math.cos(a) * r), yy = y - 1 + Math.round(Math.sin(a) * r);
      if (xx < 1 || xx >= W - 1 || yy < 1 || yy >= H - 1) continue;
      const j = yy * W + xx; if (type[j] === AIR) { put(j, LAVA); launch(j, Math.cos(a) * (2 + rnd() * 3), -2 - rnd() * 3.5); }
    }
    sfx('boom', 1);
  }

  /* ---------- движение ---------- */
  function updPowder(i, x, y, t) {
    const v = vy[i];
    let cur = i, moved = false, n = 1 + (v >> 1);
    while (n > 0) {
      const j = cur + W, p = FALL[t * NT + type[j]];
      if (p === 0) break; if (p !== 255 && rnd() * 255 >= p) break;
      swap(cur, j); cur = j; moved = true; n--;
    }
    if (moved) { if (v < 7) vy[cur] = v + 1; act.p++; return; }
    vy[i] = 0;
    const rp = REPOSE[t]; if (rp < 1 && rnd() >= rp) return;
    const d = rnd() < .5 ? -1 : 1;
    if (slide(i, t, d) || slide(i, t, -d)) act.p++;
  }
  function slide(i, t, d) {
    const s = i + d, j = i + W + d;
    if (FALL[t * NT + type[s]] === 0) return false;
    const p = FALL[t * NT + type[j]];
    if (p === 0) return false; if (p !== 255 && rnd() * 255 >= p) return false;
    swap(i, j); return true;
  }
  function spread(i, d, range) {
    let k = 0;
    for (let s = 1; s <= range; s++) { const tj = type[i + d * s]; if (tj === AIR || (KIND[tj] === K.GAS && tj !== FIRE)) k = s; else break; }
    if (k === 0) return false;
    swap(i, i + d * k); return true;
  }
  function updLiquid(i, x, y, t) {
    const vs = VISC[t]; if (vs < 1 && rnd() > vs) return;
    const v = vy[i];
    let cur = i, moved = false, n = 1 + (v >> 1);
    while (n > 0) {
      const j = cur + W, p = FALL[t * NT + type[j]];
      if (p === 0) break; if (p !== 255 && rnd() * 255 >= p) break;
      swap(cur, j); cur = j; moved = true; n--;
    }
    if (moved) { if (v < 7) vy[cur] = v + 1; act.l++; return; }
    vy[i] = 0;
    const d = rnd() < .5 ? -1 : 1;
    if (slide(i, t, d) || slide(i, t, -d)) { act.l++; return; }
    const range = DISPR[t] + (v >> 1);
    if (spread(i, d, range) || spread(i, -d, range)) { act.l++; return; }
    if (S.pressure && pr[i] >= 2 && eqBudget > 0 && rnd() < .5) {
      const u = i - W, tu = type[u];
      if (tu === AIR || (KIND[tu] === K.GAS && tu !== FIRE)) { eqBudget--; equalize(i, u); }
    }
  }
  /* сообщающиеся сосуды: ищем по воде более высокую поверхность и переносим клетку на низкую */
  const BQ = 4000, bq = new Int32Array(BQ);
  let vis = null, vstamp = 0, eqBudget = 0;
  function equalize(s, dest) {
    if (!vis || vis.length !== N) vis = new Uint32Array(N);
    const ys = (s / W) | 0; vstamp++;
    let qh = 0, qt = 0; bq[qt++] = s; vis[s] = vstamp;
    while (qh < qt && qt < BQ - 4) {
      const c = bq[qh++];
      if (c !== s && ((c / W) | 0) <= ys - 2) {
        const ta = type[c - W];
        if (ta === AIR || (KIND[ta] === K.GAS && ta !== FIRE)) {
          const lt = type[c], tt = Tm[c];
          put(c, AIR); put(dest, lt, tt); stamp[dest] = fr; return true;
        }
      }
      for (let k = 0; k < 4; k++) { const n = c + NB4[k]; if (vis[n] !== vstamp && KIND[type[n]] === K.LIQUID) { vis[n] = vstamp; bq[qt++] = n; } }
    }
    return false;
  }
  function tryRise(i, j, t, tj) {
    const p = RISE[t * NT + tj]; if (p === 0) return false;
    if (p !== 255 && rnd() * 255 >= p) return false;
    swap(i, j); return true;
  }
  function updGas(i, x, y, t) {
    const up = i - W;
    if (rnd() < RISEP[t]) {
      const tu = type[up];
      if (tu === SKY) { if (rnd() < .3) put(i, AIR); return; }
      if (tryRise(i, up, t, tu)) return;
      const d = rnd() < .5 ? -1 : 1;
      if (tryRise(i, up + d, t, type[up + d])) return;
      if (tryRise(i, up - d, t, type[up - d])) return;
    }
    let d = rnd() < .5 ? -1 : 1; if (S.wind !== 0 && rnd() < .5) d = S.wind;
    tryRise(i, i + d, t, type[i + d]);
  }
  /* давление воды: сообщающиеся сосуды */
  function pressurePass() {
    for (let y = 1; y < H - 1; y++) {
      const b = y * W;
      for (let x = 1; x < W - 1; x++) {
        const i = b + x;
        if (KIND[type[i]] === K.LIQUID && vy[i] === 0) { const a = i - W; pr[i] = KIND[type[a]] === K.LIQUID ? Math.min(pr[a] + 1, 200) : 0; } else pr[i] = 0;
      }
      for (let x = 2; x < W - 1; x++) { const i = b + x; if (pr[i] !== 0 || KIND[type[i]] === K.LIQUID) { if (KIND[type[i]] === K.LIQUID && KIND[type[i - 1]] === K.LIQUID && pr[i - 1] > pr[i]) pr[i] = pr[i - 1]; } }
      for (let x = W - 3; x > 0; x--) { const i = b + x; if (KIND[type[i]] === K.LIQUID && KIND[type[i + 1]] === K.LIQUID && pr[i + 1] > pr[i]) pr[i] = pr[i + 1]; }
    }
    for (let y = H - 3; y >= 1; y--) {
      const b = y * W;
      for (let x = 1; x < W - 1; x++) { const i = b + x; if (KIND[type[i]] === K.LIQUID && KIND[type[i + W]] === K.LIQUID) { const v = pr[i + W] - 1; if (v > pr[i]) pr[i] = v; } }
    }
  }

  /* ---------- реакции ---------- */
  /* ---------- растения: рисунок дерева считается заранее (вид, светотень, корни, ветки) и проявляется по мере роста ---------- */
  const plants = []; S.plants = plants; S.tscale = 1;
  const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const pget = (P, x, y) => P.M.get((x + 512) * 2048 + (y + 512));
  const pset = (P, x, y, t, a, o, f) => { P.M.set((x + 512) * 2048 + (y + 512), { x, y, t, a, o: Math.max(0, Math.min(1, o)), f: f | 0 }); };
  /* ствол: a=1 тёмный контур, 2 тень, 3 середина, 4 свет, 5 блик */
  function trunk(P, Ht, xcf, wf, o0, o1) {
    for (let y = 0; y <= Ht; y++) {
      const w = Math.max(1, Math.round(wf(y))), left = Math.round(xcf(y) - (w - 1) / 2), o = o0 + (o1 - o0) * y / Math.max(1, Ht);
      for (let k = 0; k < w; k++) {
        const t = w === 1 ? .4 : k / (w - 1);
        let a = t < .3 ? 4 : t > .72 ? 2 : 3;
        if (w >= 4 && k === w - 1) a = 1;
        if (hash2(left + k, y) < .14) a = Math.max(1, a - 1);
        pset(P, left + k, y, 1, a, o, 0);
      }
      const fmax = w >= 4 ? 3 : w >= 3 ? 2 : 1;
      if (y < fmax && Ht >= 5) for (let q = 1; q <= fmax - y; q++) { pset(P, left - q, y, 1, q === fmax - y ? 1 : 3, o, 2); pset(P, left + w - 1 + q, y, 1, q === fmax - y ? 1 : 2, o, 2); }
    }
  }
  function branch(P, x0, y0, x1, y1, w, o0, o1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n), o = o0 + (o1 - o0) * s / n;
      pset(P, x, y, 1, 3, o, 0); if (w >= 2) { pset(P, x + 1, y, 1, 2, o, 0); pset(P, x, y - 1, 1, 2, o, 0); }
    }
  }
  /* пышный клубок листвы: свет сверху-слева, тень снизу-справа */
  function puff(P, cx, cy, rx, ry, o0, oSpan, fx, fy, fr) {
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      if (d > .72 && hash2(x, y + 7) < .3) continue;
      const lit = -nx * .55 + ny * .8;
      let a = 3 + (lit > .28 ? 1 : 0) + (lit > .7 ? 1 : 0) - (lit < -.3 ? 1 : 0) - (lit < -.72 ? 1 : 0);
      const h = hash2(x, y); if (h < .07) a++; else if (h > .93) a--;
      pset(P, x, y, 2, Math.max(1, Math.min(5, a)), o0 + oSpan * Math.min(1, Math.hypot(x - fx, (y - fy) * 1.2) / fr), 0);
    }
  }
  function finishCrown(P) {
    for (const c of P.M.values()) {
      if (c.t !== 2 || c.a < 1 || c.a > 5) continue;
      if (!pget(P, c.x, c.y - 1)) c.a = 1;
      else if (!pget(P, c.x + 1, c.y - 1) && c.a > 2) c.a = 2;
      else if (!pget(P, c.x, c.y + 1) && c.a < 5) c.a++;
    }
  }
  function oak(P, k, lean) {
    const R = Math.round((11 + rn(4)) * k), Ht = Math.round((8 + rn(4)) * k), w0 = Math.max(3, Math.round(4.6 * k));
    const xcf = lean ? (y) => lean * 7 * k * Math.pow(y / Ht, 1.5) - Math.sin(y / Ht * Math.PI) * lean * 1.6 * k : () => 0;
    trunk(P, Ht, xcf, (y) => w0 - (w0 - 2.4) * y / Ht, 0, .42);
    const cx = Math.round(xcf(Ht)), cy = Ht + Math.round(R * .55), rx = Math.round(R * (lean ? 1.3 : 1.12)), ry = Math.round(R * .86), fr = R * 1.5;
    branch(P, cx, Ht - 1, cx - Math.round(R * .6), Ht + Math.round(R * .35), 2, .4, .52);
    branch(P, cx, Ht - 1, cx + Math.round(R * .6), Ht + Math.round(R * .3), 2, .4, .52);
    puff(P, cx + (lean ? Math.round(lean * R * .22) : 0), cy, rx, ry, .5, .45, cx, cy, fr);
    const n = 5 + rn(3);
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (.04 + .92 * i / (n - 1)) + (rnd() - .5) * .25;
      puff(P, cx + Math.round(Math.cos(a) * rx * .8), cy + Math.round(Math.sin(a) * ry * .62), Math.round(R * (.5 + rnd() * .16)), Math.round(R * (.44 + rnd() * .14)), .52, .45, cx, cy, fr);
    }
    puff(P, cx - Math.round(rx * .66), cy - Math.round(ry * .3), Math.round(R * .5), Math.round(R * .38), .55, .4, cx, cy, fr);
    puff(P, cx + Math.round(rx * .66), cy - Math.round(ry * .32), Math.round(R * .5), Math.round(R * .38), .55, .4, cx, cy, fr);
  }
  function poplar(P, k) {
    const Ht = Math.round((5 + rn(3)) * k), ry = Math.round((14 + rn(4)) * k), rx = Math.round((4 + rn(2)) * k + 1), cy = Ht + Math.round(ry * .9);
    trunk(P, Ht + 2, () => 0, () => 2, 0, .3);
    puff(P, 0, cy, rx, ry, .3, .65, 0, cy, ry);
    for (let i = 0; i < 8; i++) { const t = -.82 + 1.64 * i / 7, sd = i % 2 ? 1 : -1; puff(P, sd * Math.round(rx * .5), cy + Math.round(t * ry), Math.round(rx * .72), Math.max(2, Math.round(ry * .2)), .35, .6, 0, cy, ry); }
  }
  function bushy(P, k) {
    const Ht = Math.round((6 + rn(3)) * k), R = Math.round((8 + rn(3)) * k), w0 = Math.max(3, Math.round(4 * k));
    trunk(P, Ht, () => 0, (y) => w0 - (y > Ht * .6 ? 1 : 0), 0, .32);
    const fr = R * 2;
    for (const sd of [-1, 0, 1]) {
      const ax = sd * Math.round(R * .95), ay = Ht + Math.round(R * (sd ? .55 : .95));
      branch(P, 0, Ht - 1, ax, ay, 2, .3, .5);
      puff(P, ax, ay + Math.round(R * .3), Math.round(R * (sd ? .95 : 1.05)), Math.round(R * .78), .5, .45, 0, Ht + R * .8, fr);
    }
    puff(P, -Math.round(R * 1.4), Ht + Math.round(R * .5), Math.round(R * .6), Math.round(R * .5), .6, .35, 0, Ht + R * .8, fr);
    puff(P, Math.round(R * 1.4), Ht + Math.round(R * .5), Math.round(R * .6), Math.round(R * .5), .6, .35, 0, Ht + R * .8, fr);
  }
  function spruce(P, k) {
    const Hs = Math.round((28 + rn(9)) * k), tb = Math.max(4, Math.round(Hs * .17)), n = Math.max(4, Math.round(Hs / 6)), maxW = Math.max(5, Math.round((8 + rn(3)) * k));
    trunk(P, tb + 3, () => 0, (y) => y < 2 ? 3 : 2, 0, .22);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), yb = tb + Math.round(i * (Hs - tb - 3) / n), half = Math.max(2, Math.round(maxW * (1 - f * .86))), th = Math.max(4, Math.round((Hs - tb) / n * 1.8));
      for (let r = 0; r < th; r++) {
        const y = yb + r;
        let hw = Math.round(half * (1 - r / th * .96) + (r === 0 ? 1 : 0)) + (hash2(i * 17, r) < .3 ? 1 : 0) - (hash2(i * 31, r) < .2 ? 1 : 0);
        hw = Math.max(0, hw);
        for (let x = -hw; x <= hw; x++) {
          let a = x < -hw * .25 ? 4 : x > hw * .35 ? 2 : 3;
          if (r === 0) a = 1; else if (r >= th - 2 && x <= 0) a = 5; else if (hash2(x + i * 5, y) < .1) a += hash2(y, x) < .5 ? 1 : -1;
          pset(P, x, y, 2, Math.max(1, Math.min(5, a)), .08 + .82 * y / Hs, 0);
        }
        if (r === 0) { pset(P, -hw - 1, y, 2, 1, .08 + .82 * y / Hs, 0); pset(P, hw + 1, y, 2, 1, .08 + .82 * y / Hs, 0); pset(P, -hw, y - 1, 2, 1, .08 + .82 * y / Hs, 0); pset(P, hw, y - 1, 2, 1, .08 + .82 * y / Hs, 0); }
      }
    }
    for (let y = Hs - 1; y <= Hs + 2; y++) pset(P, 0, y, 2, 4, .95, 0);
  }
  /* луг: трава и цветы, привязанные к земле под каждым стебельком */
  function meadow(P, k) {
    const hw = 4 + rn(5);
    for (let x = -hw; x <= hw; x++) {
      if (rnd() < .16) continue;
      const edge = 1 - Math.abs(x) / (hw + 1), h = Math.max(2, Math.round((2 + rnd() * 3 + edge * 3) * Math.max(.8, k))), lean = rn(3) - 1;
      for (let y = 0; y < h; y++) pset(P, x + (y > h * .55 ? lean : 0), y, 2, y > h * .6 ? 7 : y < 2 ? 8 : 6, .02 + .5 * y / 8 + .25 * rnd(), 1);
      if (rnd() < .4) {
        const fx = x + lean, c = 9 + rn(8), o = .6 + .35 * rnd();
        pset(P, fx, h, 2, 17, o, 1); pset(P, fx - 1, h, 2, c, o, 1); pset(P, fx + 1, h, 2, c, o, 1); pset(P, fx, h + 1, 2, c, o, 1);
      }
    }
  }
  const blockedSolid = (x, y) => { const t = type[y * W + x]; return t !== AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER); };
  function groundRow(x, by) {
    let y = by - 2;
    if (blockedSolid(x, y)) { let k = 0; while (blockedSolid(x, y) && k < 5) { y--; k++; } return y; }
    for (let k = 0; k < 12 && y < H - 2; k++) { if (blockedSolid(x, y + 1)) return y; y++; }
    return by;
  }
  /* клетка дерева ставится, только если рядом уже есть росток или другая клетка этого же дерева: дерево растёт от стебля наружу и не висит в воздухе.
     Возвращает 1 — поставлена, 0 — не нужна (занято, за краем), -1 — пока не к чему прикрепиться */
  const isTreeCell = (j) => { const t = type[j]; return t === SPROUT || ((t === WOOD || t === LEAF) && aux[j] !== 0); };
  function placeCell(p, c) {
    const gx = p.bx + c.x; let gy = p.by - c.y;
    if (c.f & 1) gy = groundRow(gx, p.by) - c.y;
    if (gx < 1 || gx >= W - 1 || gy < 2 || gy >= H - 1) return 0;
    const i = gy * W + gx, t = type[i];
    if (t !== AIR && KIND[t] !== K.GAS && !(t === SPROUT && c.x === 0 && c.y === 0)) return 0;
    if (!(c.f & 1) && !(c.x === 0 && c.y === 0)) {
      let ok = false; for (let k = 0; k < 8; k++) if (isTreeCell(i + NB8[k])) { ok = true; break; }
      if (!ok) return -1;
    }
    if (c.f & 2) {
      let d = 1; while (d <= 7 && (type[i + d * W] === AIR || KIND[type[i + d * W]] === K.GAS)) d++;
      if (d > 7 || (d === 1 && type[i + W] === AIR)) return 0;
      for (let q = 1; q < d; q++) { put(i + q * W, WOOD); aux[i + q * W] = 1; }
    }
    put(i, c.t === 1 ? WOOD : LEAF); aux[i] = c.a; return 1;
  }
  function pendStep(p) {
    const pe = p.pend; for (let k = pe.length - 1; k >= 0; k--) if (placeCell(p, pe[k]) >= 0) { pe[k] = pe[pe.length - 1]; pe.pop(); }
  }
  function buildPlan(bx, by, kind) {
    let k = S.tscale;
    for (let tries = 0; tries < 4; tries++) {
      const P = { M: new Map() };
      if (kind === 'spruce') spruce(P, k); else if (kind === 'poplar') poplar(P, k); else if (kind === 'bushy') bushy(P, k);
      else if (kind === 'bent') oak(P, k, rnd() < .5 ? -1 : 1); else if (kind === 'meadow') meadow(P, k); else oak(P, k, 0);
      let top = 0; for (const c of P.M.values()) if (c.y > top) top = c.y;
      if (by - top < 3 && tries < 3) { k *= .78; continue; }
      finishCrown(P);
      const cells = Array.from(P.M.values()).sort((a, b) => a.o - b.o);
      let mnx = 1e9, mxx = -1e9, mxy = 0; for (const c of cells) { if (c.x < mnx) mnx = c.x; if (c.x > mxx) mxx = c.x; if (c.y > mxy) mxy = c.y; }
      return { pend: [], x0: bx + mnx - 2, x1: bx + mxx + 2, y0: by - mxy - 2, y1: by + 10, bx, by, cells, idx: 0, prog: 0, dt: 1 / (kind === 'meadow' ? 130 : 180 + cells.length * .28), base: by * W + bx, kind };
    }
    return null;
  }
  function startPlan(i, kind) {
    if (plants.length >= 24) return false;
    const p = buildPlan(i % W, (i / W) | 0, kind); if (!p) return false;
    put(i, SPROUT); plants.push(p); return true;
  }
  function plantInstant(bx, by, kind) {
    const p = buildPlan(bx, by, kind); if (!p) return; p.pend = [];
    for (const c of p.cells) if (placeCell(p, c) < 0) p.pend.push(c);
    for (let pass = 0; pass < 40 && p.pend.length; pass++) pendStep(p);
  }
  function stepPlants() {
    for (let n = plants.length - 1; n >= 0; n--) {
      const p = plants[n];
      if (!isTreeCell(p.base)) { plants.splice(n, 1); continue; }   /* росток сгорел или его смыло: рост прекращается */
      p.prog += p.dt;
      while (p.idx < p.cells.length && p.cells[p.idx].o <= p.prog) { const c = p.cells[p.idx++]; if (placeCell(p, c) < 0) p.pend.push(c); }
      if (p.pend.length && (S.frame & 1) === 0) pendStep(p);
      if (p.prog >= 1.02) {
        while (p.idx < p.cells.length) { const c = p.cells[p.idx++]; if (placeCell(p, c) < 0) p.pend.push(c); }
        for (let pass = 0; pass < 40 && p.pend.length; pass++) pendStep(p);
        if (type[p.base] === SPROUT) { if (p.kind === 'meadow') { conv(p.base, LEAF); aux[p.base] = 6; } else { conv(p.base, WOOD); aux[p.base] = 3; } }
        plants.splice(n, 1);
      }
    }
  }
  /* почва впитывает воду: земля и пепел мокнут в грязь, грязь и песок набираются влагой (life), потом вода копится сверху.
     Грязь с избытком влаги отдаёт её вниз по слоям, на воздухе высыхает. Впитывает только поверхностная вода (дождь, лужи, ручьи), озёра и моря дно не осушают. */
  const SAT_MUD = 6, SAT_SAND = 3;
  const isPlant = (j) => { const t = type[j]; return t === LEAF || t === SPROUT || t === LITTER || (t === WOOD && aux[j] !== 0); };
  function soak(i, b) {
    const tb = type[b];
    /* листва, ростки и кора впитывают дождь; часть капель просачивается сквозь крону вниз — на кронах лужи не копятся */
    if (isPlant(b)) { const d = b + W; if (rnd() < .5 && d < type.length && type[d] === AIR) { put(d, WATER); put(i, AIR); } else put(i, AIR); return true; }
    if (tb === EARTH || tb === ASH) { conv(b, MUD); life[b] = 1; put(i, AIR); return true; }
    if (tb === MUD && life[b] < SAT_MUD) { life[b]++; put(i, AIR); return true; }
    if (tb === SAND && life[b] < SAT_SAND) { life[b]++; put(i, AIR); return true; }
    return false;
  }
  function react(i, x, y, t) {
    const tm = Tm[i];
    if (IGN[t] !== 0 && tm >= IGN[t] && burn[i] === 0) ignite(i);
    switch (t) {
      case EARTH: {
        const n = i + NB4[rn(4)];
        if (type[n] === WATER && rnd() < .15) { conv(i, MUD); life[i] = 1; if (type[n - W] === AIR && rnd() < .8) put(n, AIR); return true; }
        return false;
      }
      case SAND: if (tm > 1100 && rnd() < .3) { conv(i, GLASS); return true; } if (life[i] > 0 && (tm > 40 || (type[i - W] === AIR && rnd() < .004))) life[i]--; return false;   /* мокрый песок сохнет */
      case SNOW: if (tm > .8 && rnd() < .25) { conv(i, WATER); Tm[i] = 1.2; return true; } return false;
      case SALT: {
        const n = i + NB4[rn(4)], tn = type[n];
        if (tn === WATER && rnd() < .12) { conv(n, BRINE); life[n] = 4; put(i, AIR); return true; }   /* растворилась: вода стала солёной */
        if (tn === BRINE && life[n] < 8 && rnd() < .08) { life[n] = Math.min(9, life[n] + 3); put(i, AIR); return true; }
        if ((tn === ICE || tn === SNOW) && rnd() < .1) { put(n, BRINE, -6); life[n] = 4; put(i, AIR); return true; }
        return false;
      }
      case GUNP: {
        const n = i + NB4[rn(4)];
        if (type[n] === WATER && !(aux[i] & 1) && rnd() < .2) { aux[i] |= 1; if (rnd() < .5) put(n, AIR); }
        else if ((aux[i] & 1) && tm > 60 && rnd() < .05) aux[i] &= ~1;
        return false;
      }
      case MUD: {
        if (tm > 45 && rnd() < .06) { conv(i, EARTH); if (rnd() < .2 && type[i - W] === AIR) put(i - W, STEAM, 100); return true; }
        if (rnd() < (type[i - W] === AIR ? (tm > 25 ? .008 : .004) : .0004)) { if (life[i] > 0) life[i]--; else { conv(i, EARTH); return true; } }   /* подсыхает (сверху быстрее) и снова становится землёй */
        if (life[i] >= SAT_MUD - 1 && rnd() < .12) {   /* переполнена: влага уходит в слой ниже */
          const b = i + W, tb = type[b];
          if (tb === EARTH) { conv(b, MUD); life[b] = 1; life[i]--; }
          else if (tb === SAND && life[b] < SAT_SAND) { life[b]++; life[i]--; }
          else if (tb === MUD && life[b] < SAT_MUD - 1) { life[b]++; life[i]--; }
        }
        return false;
      }
      case SEED: case CONE: case FSEED: {
        const b = i + W, tb = type[b];
        if ((tb === EARTH || tb === MUD) && tm > 0 && tm < 60 && plants.length < 24) {
          let ok = false;
          if (tb === MUD) { ok = true; conv(b, EARTH); }
          else for (let dy = -2; dy <= 3 && !ok; dy++) for (let dx = -4; dx <= 4; dx++) { const j = i + dy * W + dx; if (type[j] === WATER) { put(j, AIR); ok = true; break; } }
          if (ok) {
            const r = rnd(), kind = t === CONE ? 'spruce' : t === FSEED ? 'meadow' : r < .34 ? 'oak' : r < .58 ? 'bent' : r < .76 ? 'poplar' : 'bushy';
            if (startPlan(i, kind)) return true;
          }
        }
        return false;
      }
      case SPROUT: { for (let q = 0; q < plants.length; q++) if (plants[q].base === i) return false; conv(i, LEAF); aux[i] = 6; return true; }
      case LEAF: {
        const n = i + NB4[rn(4)], tn = type[n];
        if ((tn === SALT || tn === BRINE) && rnd() < .2) { put(i, AIR); return true; }
        if (tm > 70 && burn[i] === 0) { if (rnd() < .35) ignite(i); return false; }   /* подсохшая листва от жара вспыхивает */
        if (tm < -8) { put(i, AIR); return true; }
        return false;
      }
      case WATER: case BRINE: {
        const brine = t === BRINE;
        if (tm < (brine ? -14 : -1.5)) { if (rnd() < .25) { conv(i, ICE); Tm[i] = -1; return true; } }
        else if (tm >= 100 && rnd() < .3) {
          if (brine) { conv(i, SALT); if (type[i - W] === AIR) put(i - W, STEAM, 108); } else put(i, STEAM, 108);
          return true;
        }
        if (!brine && type[i - W] === AIR) {   /* поверхностная вода: почва впитывает, на жаре тонкая лужа высыхает */
          if (rnd() < .5 && soak(i, i + W)) return true;
          if (rnd() < .2 && soak(i, i + (rnd() < .5 ? -1 : 1))) return true;
          if (tm > 18 && KIND[type[i + W]] !== K.LIQUID && rnd() < (tm - 18) * .00005) { put(i, AIR); return true; }
        }
        /* вода, застрявшая в кроне (лужа между ветками), тоже уходит в листву */
        if (!brine && isPlant(i + W) && rnd() < .12) { put(i, AIR); return true; }
        const n = i + NB4[rn(4)], tn = type[n];
        if (brine && tn === WATER) {   /* рассол перемешивается с пресной водой: делится крепостью, слабый растворяется */
          if (life[i] >= 2) { if (rnd() < .03) { const hf = life[i] >> 1; conv(n, BRINE); life[n] = hf; life[i] -= hf; } }
          else if (rnd() < .004) { conv(i, WATER); return true; }
        }
        if (tn === LAVA) { if (rnd() < .5) { conv(n, STONE); Tm[n] = 850; put(i, STEAM, 140); if (type[i - W] === AIR) put(i - W, STEAM, 130); sfx('hiss', .6); return true; } }
        else if (tn === FIRE) { put(n, AIR); if (rnd() < .15) { put(i, STEAM, 105); return true; } }
        else if (tn === STONE && !brine && stamp[i] === ((fr - 1) & 0xffff) && rnd() < ERODE) conv(n, SAND);
        if (burn[n] !== 0 && rnd() < .35) { burn[n] = 0; if (rnd() < .3) { put(i, STEAM, 105); return true; } }
        return false;
      }
      case LAVA: {
        if (tm < 720 && rnd() < .3) { conv(i, STONE); Tm[i] = 700; return true; }
        for (let a = 0; a < 2; a++) {
          const n = i + NB8[rn(8)], tn = type[n];
          if (FLAMM[tn] !== 0 && burn[n] === 0) { if (rnd() < .6) ignite(n); }
          else if (tn === WATER || tn === BRINE) { if (rnd() < .5) { conv(i, STONE); Tm[i] = 850; put(n, STEAM, 140); if (type[n - W] === AIR) put(n - W, STEAM, 130); sfx('hiss', .6); return true; } }
          else if (tn === SAND && rnd() < .25) { conv(n, GLASS); Tm[n] = 1150; }
        }
        return false;
      }
      case ACID: {
        if (tm > 150 && rnd() < .3) { put(i, SMOKE); aux[i] = 1; return true; }
        const n = i + NB4[rn(4)], tn = type[n], d = DISS[tn];
        if (d > 0 && rnd() < d) {
          const metal = tn === METAL;
          put(n, AIR);
          if (rnd() < .35) { const u = n - W; if (type[u] === AIR) { if (metal) put(u, GAS); else { put(u, SMOKE); aux[u] = 1; } } }
          if (life[i] <= 1) { conv(i, WATER); return true; }
          life[i]--;
        } else if ((tn === WATER || tn === BRINE) && rnd() < .04) { if (life[i] <= 2) { conv(i, WATER); return true; } life[i] -= 2; }
        return false;
      }
      case FIRE: {
        act.f++;
        if (tm < 650) Tm[i] = 650 + rn(150);
        for (let a = 0; a < 2; a++) {
          const n = i + NB8[rn(8)], tn = type[n];
          if (FLAMM[tn] !== 0 && burn[n] === 0 && rnd() < FLAMM[tn]) ignite(n);
          else if (tn === WATER || tn === BRINE || tn === SNOW || tn === ICE || tn === MUD) { put(i, AIR); return true; }
        }
        if (--life[i] === 0) { if (rnd() < .3) put(i, SMOKE); else put(i, AIR); return true; }
        return false;
      }
      case STEAM: {
        if (--life[i] === 0) { put(i, WATER, 60); return true; }
        const n = i + NB4[rn(4)], tn = type[n];
        if (KIND[tn] === K.SOLID && tn !== SKY && Tm[n] < 35 && rnd() < .03) { put(i, WATER, 30); return true; }
        return false;
      }
      case SMOKE: if (--life[i] === 0) { put(i, AIR); return true; } return false;
      case STONE: if (tm > 1400 && rnd() < .1) { conv(i, LAVA); return true; } return false;
      case METAL: if (tm > 1500 && rnd() < .1) { conv(i, LAVA); return true; } return false;
      case GLASS: {
        if (tm > 1500 && rnd() < .1) { conv(i, LAVA); return true; }
        const tn = type[i + NB4[rn(4)]];
        if (tm > 200 && (tn === WATER || tn === BRINE || tn === ICE || tn === SNOW) && rnd() < .5) { conv(i, SAND); sfx('crack', .5); return true; }
        return false;
      }
      case ICE: if (tm > 1 && rnd() < .25) { conv(i, WATER); Tm[i] = 1.5; return true; } return false;
      case SPARK: if (--life[i] === 0) { put(i, AIR); return true; } return false;
      case LAMP: if (life[i] > 0) life[i]--; return false;
      case CLONE: {
        const tpl = life[i];
        if (tpl === 0) { for (let k = 0; k < 4; k++) { const tn = type[i + NB4[k]]; if (CLONABLE[tn]) { life[i] = tn; break; } } return false; }
        for (let a = 0; a < 2; a++) { const n = i + NB4[rn(4)]; if (type[n] === AIR && rnd() < .5) { put(n, tpl); break; } }
        return false;
      }
      case VOID: {
        const n = i + NB4[rn(4)], tn = type[n];
        if (tn !== AIR && tn !== WALL && tn !== SKY && tn !== CLONE && tn !== VOID && rnd() < .6) put(n, AIR);
        return false;
      }
      case FLY: {
        const n = i + NB8[rn(8)], tn = type[n];
        if (tm > 70 || tn === WATER || tn === LAVA || tn === ACID || tn === FIRE || tn === BRINE) { put(i, AIR); return true; }
        let h = aux[i];
        if (rnd() < .2) h = (h + (rnd() < .5 ? 1 : 7)) & 7;
        if (rnd() < .06 && ((i / W) | 0) > H * .55) h = rnd() < .5 ? 0 : (rnd() < .5 ? 1 : 7);
        const j = i + DIRS[h];
        if (type[j] === AIR && stamp[j] !== fr) { swap(i, j); aux[j] = h; life[j] = (life[j] + 1) & 63; }
        else { aux[i] = (h + (rnd() < .5 ? 1 : 7)) & 7; life[i] = (life[i] + 1) & 63; }
        return true;
      }
    }
    return false;
  }

  /* ---------- тепло ---------- */
  function thermal() {
    for (let y = 1; y < H - 1; y++) {
      const b = y * W;
      for (let x = 1; x < W - 1; x++) {
        const i = b + x, ti = type[i];
        let a = Tm[i];
        let j = i + 1, d = Tm[j] - a;
        if (d > .08 || d < -.08) { const k = PAIRK[ti * NT + type[j]]; if (k > 0) { const q = d * k; a += q; Tm[j] -= q; } }
        j = i + W; d = Tm[j] - a;
        if (d > .08 || d < -.08) { const k = PAIRK[ti * NT + type[j]]; if (k > 0) { const q = d * k; a += q; Tm[j] -= q; } }
        if (a !== AMB) { a += (AMB - a) * LOSS[ti]; if (a > AMB - .15 && a < AMB + .15) a = AMB; }
        Tm[i] = a;
      }
    }
    for (let x = 0; x < W; x++) { Tm[x] = AMB; Tm[(H - 1) * W + x] = AMB; }
    for (let y = 0; y < H; y++) { Tm[y * W] = AMB; Tm[y * W + W - 1] = AMB; }
  }
  /* ---------- ток: волны по металлу и воде ---------- */
  function electric() {
    for (let y = 1; y < H - 1; y++) {
      const b = y * W;
      for (let x = 1; x < W - 1; x++) {
        const i = b + x, t = type[i];
        let head = false;
        if (ISCOND[t]) head = aux[i] === 1; else if (t === SPARK) head = true; else if (t === BATT) head = life[i] === 0; else continue;
        if (!head) continue;
        for (let k = 0; k < 4; k++) {
          const n = i + NB4[k], tn = type[n];
          if (ISCOND[tn]) { if (aux[n] === 0 && rnd() < CONDP[tn]) aux[n] = 3; }
          else if (tn === LAMP) life[n] = 26;
          else if ((tn === GAS || tn === GUNP) && rnd() < .3) ignite(n);
          else if (tn === OIL && rnd() < .04) ignite(n);
        }
      }
    }
    for (let i = W; i < N - W; i++) {
      const t = type[i];
      if (ISCOND[t]) { const a = aux[i]; if (a !== 0) aux[i] = a === 1 ? 2 : a === 2 ? 0 : 1; }
      else if (t === BATT) life[i] = (life[i] + 1) & 7;
    }
  }

  /* ---------- погода ---------- */
  function weatherTick() {
    const w = S.weather; if (!w) return;
    /* капель и снежинок мало: погода видна, но мир не засыпает снегом и не топит водой */
    let rate = w === 2 ? W / 380 : w === 3 ? W / 240 : W / 400;
    let c = rate | 0; if (rnd() < rate - c) c++;
    for (let k = 0; k < c; k++) {
      const x = 1 + rn(W - 2), i = W + x;
      if (type[i] === AIR) { put(i, w === 2 ? SNOW : WATER, w === 2 ? -2 : 12); vy[i] = 3; }
    }
    if (w === 3 && rnd() < .005) lightning(2 + rn(W - 4));
  }
  function stepBolts() { for (let k = S.bolts.length - 1; k >= 0; k--) if (--S.bolts[k].ttl <= 0) S.bolts.splice(k, 1); }

  /* ---------- один шаг ---------- */
  function cellUpd(i, x, y) {
    let t = type[i];
    if (burn[i] !== 0) { burnStep(i, x, y, t); t = type[i]; if (t === AIR || stamp[i] === fr) return; }
    const rp = RXP[t];
    if (rp !== 0 && (rp >= 1 || rnd() < rp)) { if (react(i, x, y, t)) return; t = type[i]; }
    const k = KIND[t];
    if (k === K.POWDER) updPowder(i, x, y, t); else if (k === K.LIQUID) updLiquid(i, x, y, t);
  }
  function gasCell(i, x, y) {
    let t = type[i];
    if (burn[i] !== 0) { burnStep(i, x, y, t); t = type[i]; if (KIND[t] !== K.GAS) return; }
    const rp = RXP[t];
    if (rp !== 0 && (rp >= 1 || rnd() < rp)) { if (react(i, x, y, t)) return; t = type[i]; if (KIND[t] !== K.GAS) return; }
    updGas(i, x, y, t);
  }
  function step() {
    fr = (fr + 1) & 0xffff; if (fr === 0) fr = 1; S.frame++; eqBudget = 10;
    weatherTick(); stepMeteors(); stepBolts(); stepFlying();
    if (S.pressure && (fr & 1) === 0) pressurePass();
    for (let y = H - 2; y >= 1; y--) {
      const b = y * W;
      if (((y + fr) & 1) === 0) { for (let x = 1; x < W - 1; x++) { const i = b + x, t = type[i]; if (t === AIR || stamp[i] === fr || fl[i] !== 0 || KIND[t] === K.GAS) continue; cellUpd(i, x, y); } }
      else { for (let x = W - 2; x >= 1; x--) { const i = b + x, t = type[i]; if (t === AIR || stamp[i] === fr || fl[i] !== 0 || KIND[t] === K.GAS) continue; cellUpd(i, x, y); } }
    }
    for (let y = 1; y < H - 1; y++) {
      const b = y * W;
      if (((y + fr) & 1) === 0) { for (let x = 1; x < W - 1; x++) { const i = b + x, t = type[i]; if (KIND[t] !== K.GAS || stamp[i] === fr || fl[i] !== 0) continue; gasCell(i, x, y); } }
      else { for (let x = W - 2; x >= 1; x--) { const i = b + x, t = type[i]; if (KIND[t] !== K.GAS || stamp[i] === fr || fl[i] !== 0) continue; gasCell(i, x, y); } }
    }
    stepEnts(); if (plants.length) stepPlants(); stepTrees();
    thermal();
    if ((fr & 1) === 0) electric();
    if (S.shake > 0) S.shake = Math.max(0, S.shake - .6);
  }

  /* ---------- кисти ---------- */
  function paint(cx, cy, r, t, sq, replace, dens) {
    const rr = r * r + r * .6;
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy; if (y < 1 || y >= H - 1) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx; if (x < 1 || x >= W - 1) continue;
        if (!sq && dx * dx + dy * dy > rr) continue;
        const i = y * W + x, cur = type[i];
        if (t === AIR) { if (cur !== WALL && cur !== SKY) put(i, AIR); continue; }
        if (dens < 1 && rnd() > dens) continue;
        if (cur === AIR || (KIND[cur] === K.GAS && KIND[t] !== K.GAS) || (replace && cur !== WALL && cur !== SKY)) put(i, t);
      }
    }
  }
  function heatArea(cx, cy, r, dT) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r) continue;
      const x = cx + dx, y = cy + dy; if (x < 1 || x >= W - 1 || y < 1 || y >= H - 1) continue;
      const i = y * W + x; Tm[i] = Math.max(-120, Math.min(2600, Tm[i] + dT));
    }
  }
  function pushArea(cx, cy, r, dx, dy) {
    const sx = Math.sign(dx), sy = Math.sign(dy); if (!sx && !sy) return;
    for (let yy = cy - r; yy <= cy + r; yy++) for (let xx = cx - r; xx <= cx + r; xx++) {
      if (xx < 2 || xx >= W - 2 || yy < 2 || yy >= H - 2) continue;
      if ((xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) > r * r + r) continue;
      const i = yy * W + xx, t = type[i], k = KIND[t];
      if (t === AIR || k === K.SOLID || k === K.SPEC || fl[i]) continue;
      if (k === K.LIQUID && rnd() < .5) continue;
      if (rnd() < .75) { const j = i + sx + sy * W; if (type[j] === AIR) { swap(i, j); } }
    }
  }
  function census() {
    const c = new Uint32Array(NT);
    for (let i = 0; i < N; i++) c[type[i]]++;
    return c;
  }

  /* ---------- миры ---------- */
  function generate(kind, opt) {
    const plain = !!(opt && opt.plain);
    clear();
    const u = Math.min(H, W * .62), sea = Math.floor(H * .68);
    if (kind === 'void') return;
    const hm = new Int16Array(W), floorY = Math.min(H - 8, sea + Math.max(u * .17, H * .19)), peak = sea - u * .22;
    const p1 = rnd() * 6.28, p2 = rnd() * 6.28;
    for (let x = 0; x < W; x++) {
      const nx = x / W;
      let bump = Math.max(0, 1 - Math.pow((nx - .36) / .27, 2));
      if (kind === 'sea') bump = 0;
      const ridge = Math.sin(nx * 11 + p1) * .5 + Math.sin(nx * 5 + p2) * .5;
      hm[x] = Math.round(floorY - bump * (floorY - peak) - bump * ridge * u * .03 - (kind === 'sea' ? ridge * 2 : 0));
    }
    for (let x = 1; x < W - 1; x++) {
      const top = Math.max(2, hm[x]);
      for (let y = top; y < H - 1; y++) {
        const i = y * W + x, depth = y - top;
        if (!plain && y > sea + 2 && depth < 3) put(i, SAND);
        else if (!plain && top >= sea - 2 && depth < 3) put(i, SAND);
        else if (depth < 4 && !plain) put(i, EARTH);
        else { put(i, STONE); vv[i] = ((((y + Math.round(Math.sin(x * .13 + p1) * 2)) / 7) | 0) % 2 ? 70 : 120) + rn(75); }
      }
      for (let y = sea; y < top; y++) put(y * W + x, WATER);
    }
    if (kind === 'island' && !plain) {
      const kinds = ['oak', 'spruce', 'bent', 'poplar', 'bushy', 'spruce'], used = [];
      let placed = 0;
      for (let tries = 0; tries < 120 && placed < 5; tries++) {
        const x = 12 + rn(W - 24), top = hm[x];
        if (top >= sea - 4 || top < 10) continue;
        if (Math.abs(hm[x - 3] - top) > 3 || Math.abs(hm[x + 3] - top) > 3) continue;
        if (used.some((u) => Math.abs(u - x) < 17 * S.tscale)) continue;
        used.push(x); plantInstant(x, top - 1, kinds[placed % kinds.length]); placed++;
      }
      for (let tries = 0; tries < 40 && placed < 8; tries++) {
        const x = 8 + rn(W - 16), top = hm[x];
        if (top >= sea - 4 || top < 6 || used.some((u) => Math.abs(u - x) < 7)) continue;
        used.push(x); plantInstant(x, top - 1, 'meadow'); placed++;
      }
    }
  }

  /* ---------- сохранение ---------- */
  function rle(a) { const o = []; let i = 0; const n = a.length; while (i < n) { const v = a[i]; let c = 1; while (i + c < n && a[i + c] === v && c < 255) c++; o.push(c, v); i += c; } return o; }
  function toB64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.slice(i, i + 8192)); return btoa(s); }
  function enc(a) { return toB64(Uint8Array.from(rle(a))); }
  function dec(str, len) {
    const s = atob(str), out = new Uint8Array(len); let p = 0;
    for (let i = 0; i + 1 < s.length; i += 2) { const c = s.charCodeAt(i), v = s.charCodeAt(i + 1); for (let k = 0; k < c && p < len; k++) out[p++] = v; }
    return out;
  }
  function pack() {
    const lo = new Uint8Array(N), hi = new Uint8Array(N);
    for (let i = 0; i < N; i++) { const v = Math.max(-300, Math.min(3000, Math.round(Tm[i]))) + 300; lo[i] = v & 255; hi[i] = v >> 8; }
    return { v: 1, w: W, h: H, t: enc(type), l: enc(life), a: enc(aux), b: enc(burn), tl: enc(lo), th: enc(hi) };
  }
  function unpack(d, mapW, mapH) {
    const ow = d.w, oh = d.h, on = ow * oh;
    const ot = dec(d.t, on), ol = dec(d.l, on), oa = dec(d.a, on), ob = dec(d.b, on), tl = dec(d.tl, on), th = dec(d.th, on);
    if (mapW) { if (mapW !== W || mapH !== H) alloc(mapW, mapH); else clear(); } else if (!type || ow !== W || oh !== H) alloc(ow, oh); else clear();
    for (let y = 1; y < H - 1; y++) {
      const oy = Math.min(oh - 2, Math.max(1, Math.round(y * oh / H)));
      for (let x = 1; x < W - 1; x++) {
        const ox = Math.min(ow - 2, Math.max(1, Math.round(x * ow / W))), oi = oy * ow + ox, i = y * W + x;
        type[i] = ot[oi]; life[i] = ol[oi]; aux[i] = oa[oi]; burn[i] = ob[oi]; Tm[i] = (tl[oi] | (th[oi] << 8)) - 300;
      }
    }
  }


  /* ---------- человечки и зомби: 5x12 клеток; ходят, бегут, прыгают, плавают, горят, заражаются, падают и умирают.
     Состояния для анимации (people.js): land, hurt, stun, turn, atk, fear, act/at, tumble, kx, sub, dying/dt. ---------- */
  const ents = []; S.ents = ents;
  const HB = 12;
  const SHIRTS = [[220, 70, 60], [70, 150, 230], [240, 200, 60], [160, 90, 220], [80, 190, 110], [240, 140, 50]];
  const NOAB = {};
  S.ENT_DUR = { fall: 46, blast: 52, crush: 30, burn: 42, drown: 64, shock: 70, melt: 60, freeze: 46, old: 70, slain: 40 };
  S.ENT_KEEP = { fall: 1, blast: 1, crush: 1, drown: 1, shock: 1, old: 1, burn: 1, melt: 1, freeze: 1, slain: 1 };   /* тело остаётся после любой смерти: его можно похоронить или уничтожить */
  function spawnEnt(x, y, z, form, ab, extra) {
    if (ents.length >= 70) { const d = ents.findIndex((o) => o.dead); ents.splice(d >= 0 ? d : 0, 1); }
    x = Math.max(5, Math.min(W - 6, x | 0)); y = Math.max(HB + 2, Math.min(H - 3, y | 0));
    ents.push({ x: x + .5, y: y, fy: 0, vy: 0, dir: rnd() < .5 ? -1 : 1, z: !!z, hp: 100, t: 0, burn: 0, drown: 0, col: SHIRTS[rn(SHIRTS.length)],
      skin: rn(5), hair: rn(6), hs: rn(4), pc: rn(4), idle: 0, swim: false, air: false, walk: false, jump: false, form: form || null, ab: ab || NOAB,
      land: 0, hurt: 0, stun: 0, turn: 0, atk: 0, fear: 0, act: null, at: 0, tumble: 0, kx: 0, sub: 0, dying: null, dt: 0 });
    if (ab && ab.hp) ents[ents.length - 1].hp = ab.hp;
    if (typeof Life !== 'undefined') Life.init(ents[ents.length - 1], extra);
    sfx('pop', 1);
  }
  function blockedC(x, y) { if (x < 1 || x >= W - 1 || y < 1 || y >= H - 1) return true; const t = type[y * W + x]; if (t === AIR) return false; const k = KIND[t]; return k === K.SOLID || k === K.POWDER; }
  function bodyFree(cx, fy) { for (let k = 0; k < HB; k++) if (blockedC(cx, fy - k)) return false; return true; }
  /* смерть не мгновенная: человечек падает, горит или тонет на глазах, потом исчезает (сгоревший оставляет пепел) */
  function dieEnt(e, kind, why) {
    if (e.dying) return;
    e.dying = kind; e.why = why || ''; e.dt = 0; e.hp = 0; e.walk = false; e.jump = false; e.fear = 0; e.atk = 0; e.turn = 0; e.stun = 0; e.act = null; e.at = 0; e.idle = 0;
    if (kind !== 'burn') e.burn = 0;
    if (typeof Life !== 'undefined') Life.onDeath(e, S);
  }
  /* удар молнии: все рядом с местом удара погибают от тока */
  function entShock(cx, cy, R) { for (const e of ents) { if (e.dying) continue; if (Math.abs(e.x - cx) <= R && cy >= e.y - HB - 1 && cy <= e.y + 3) dieEnt(e, 'shock', 'ударом молнии'); } }
  function infect(o) { o.task = null; o.sleep = 0; o.txt = ''; o.z = true; o.hp = 100; o.burn = 0; o.turn = 45; o.stun = 45; o.fear = 0; o.act = null; o.at = 0; }
  function entBlast(cx, cy, R, power) {
    for (let n = ents.length - 1; n >= 0; n--) {
      const e = ents[n];
      const d = Math.hypot(e.x - cx, e.y - 6 - cy); if (d > R) continue;
      /* тело: вблизи разносит (ледяная статуя раскалывается на лёд), подальше — отбрасывает */
      if (e.dying) {
        if (e.dead && d < R * .6) { const i = Math.round(e.y) * W + Math.floor(e.x); if (e.dying === 'freeze') { for (let q = -2; q <= 2; q++) { const j = i + q; if (type[j] === AIR) put(j, ICE); } } ents.splice(n, 1); continue; }
        const sg = Math.sign(e.x - cx) || 1; e.kx = sg * (.6 + power * .6 * (1 - d / R)); e.pop = -1.6 * power; continue;
      }
      const sg = Math.abs(e.x - cx) < .5 ? (rnd() < .5 ? -1 : 1) : Math.sign(e.x - cx);
      e.kx = sg * (.9 + power * .9 * (1 - d / R)); e.pop = -2.4 * power * (e.dying ? 1 : .8); e.tumble = 46; e.hurt = 14; e.act = null; e.at = 0; e.stun = Math.max(e.stun, 16);
      /* урон по расстоянию: вблизи — насмерть, подальше — ранит и отбрасывает */
      const dmg = (30 + 130 * (1 - d / R)) * Math.min(1.5, power + .2) / (e.ab && e.ab.tough || 1);
      if (e.hp - dmg <= 0) { dieEnt(e, 'blast'); e.pop = -2.4 * power; } else { e.hp -= dmg; e.stun = Math.max(e.stun, 30); }
    }
  }
  /* всплеск: несколько клеток воды у поверхности подбрасываются вверх */
  function splash(cx, fy, power) {
    let top = -1;
    for (let y = Math.max(2, fy - HB); y <= fy; y++) if (KIND[type[y * W + cx]] === K.LIQUID) { top = y; break; }
    if (top < 0) return;
    let n = 0;
    for (let k = -2; k <= 2 && n < 7; k++) {
      const x = cx + k; if (x < 1 || x >= W - 1) continue;
      for (let y = Math.max(2, top - 2); y <= top + 3; y++) {
        const i = y * W + x;
        if (KIND[type[i]] === K.LIQUID && type[i - W] === AIR && !fl[i]) { launch(i, k * .35 + (rnd() - .5) * .6, -(1 + rnd() * 1.4 * power)); n++; break; }
      }
    }
    if (n) sfx('hiss', .25);
  }
  function stepEnts() {
    if (typeof Life !== 'undefined') Life.step(S);
    for (let n = ents.length - 1; n >= 0; n--) {
      const e = ents[n]; let cx = Math.floor(e.x), fy = Math.round(e.y);
      if (e.hurt > 0) e.hurt--; if (e.land > 0) e.land--; if (e.fear > 0) e.fear--; if (e.atk > 0) e.atk--; if (e.stun > 0) e.stun--; if (e.turn > 0) e.turn--; if (e.tumble > 0) e.tumble--;
      if (e.at > 0 && --e.at === 0) e.act = null;
      let inLiq = 0, hot = false, fire = false, acid = false;
      for (let k = 0; k < HB; k++) {
        const j = (fy - k) * W + cx, t = type[j];
        if (KIND[t] === K.LIQUID) { inLiq++; if (t === LAVA) hot = true; else if (t === ACID) acid = true; } else if (t === FIRE || burn[j] !== 0) fire = true;
        /* мгновенно сжигает только лава и кипящая жидкость; пламя и горячий воздух над костром поджигают — это ожог, его можно пережить */
        if (Tm[j] > 220) { if (KIND[t] === K.LIQUID) hot = true; else fire = true; }
      }
      e.sub = inLiq;
      if (e.sleep && (inLiq > 0 || e.burn > 0 || fire || e.shock > 0 || e.tumble > 0 || e.hurt > 0) && typeof Life !== 'undefined') Life.wake(e, inLiq > 0 ? 'Проснулся: облили водой!' : (e.burn > 0 || fire) ? 'Проснулся от огня!' : 'Проснулся от шума');
      const ab = e.ab || NOAB;
      if (!e.dying) {
        if (acid && !ab.fireproof) dieEnt(e, 'melt', 'растворился в кислоте');
        else if (hot) dieEnt(e, 'burn', 'сгорел');
        else {
          /* загорелся: огонь жжёт здоровье, но сам гаснет — короткий ожог не смертелен, гибнет тот, кто долго стоит в пламени */
          if (fire && !ab.fireproof) e.burn = Math.max(e.burn, 110);
          if (e.burn > 0) {
            e.burn--; if (inLiq >= 5) e.burn = 0; if (!fire) e.burn = Math.max(0, e.burn - 2);   /* вне пламени гаснет втрое быстрее */
            e.hp -= .3; e.hurt = Math.max(e.hurt, 2);
            if (rnd() < .08 && type[(fy - HB) * W + cx] === AIR) { put((fy - HB) * W + cx, FIRE); }
            if (e.hp <= 0) dieEnt(e, 'burn', 'сгорел');
          } else if (e.hp < 100 && !e.dying) e.hp = Math.min(100, e.hp + .03);
          if (!ab.noDrown && KIND[type[(fy - HB + 1) * W + cx]] === K.LIQUID) { if (++e.drown > 420) dieEnt(e, 'drown'); } else e.drown = 0;
        }
      }
      /* ток по воде и металлу бьёт тех, кто стоит в заряженных клетках (в рассоле — насмерть за пару разрядов); сильный холод замораживает */
      if (!e.dying) {
        let zap = 0, cold = 0, brine = false;
        for (let y = Math.max(1, fy - HB + 1); y <= fy + 1; y++) {
          const b = y * W;
          for (let x = cx - 1; x <= cx + 1; x++) {
            const j = b + x, t = type[j];
            if (ISCOND[t]) { if (aux[j] === 1) { zap += t === BRINE ? 2 : 1; if (t === BRINE) brine = true; } } else if (t === SPARK) zap += 2;
            if (Tm[j] < -20) cold++;
          }
        }
        if (e.zapCd > 0) e.zapCd--; if (e.shock > 0) e.shock--;
        if (zap > 0 && !(e.zapCd > 0)) {
          e.zapCd = 5; e.shock = 18; e.stun = Math.max(e.stun, 12); e.hurt = 10; e.act = null; e.at = 0; e.walk = false;
          e.hp -= Math.min(3, zap) * 20 / (ab.tough ? Math.sqrt(ab.tough) : 1); sfx('zap', .4);
          if (e.hp <= 0) dieEnt(e, 'shock', brine ? 'ударом тока в солёной воде' : 'ударом тока');
        }
        if (cold >= 3) { e.chill = (e.chill | 0) + 1; if (e.chill > 45) dieEnt(e, 'freeze', 'замёрз'); } else if (e.chill > 0) e.chill--;
      }
      if (!bodyFree(cx, fy)) {
        let ok = false; for (let u = 1; u <= 6; u++) if (bodyFree(cx, fy - u)) { fy -= u; e.y = fy; ok = true; break; }
        /* вбок: дерево проросло рядом */
        if (!ok) for (const dx of [1, -1, 2, -2, 3, -3, 4, -4]) { for (let u = 0; u <= 3 && !ok; u++) if (bodyFree(cx + dx, fy - u)) { e.x += dx; cx += dx; fy -= u; e.y = fy; ok = true; } if (ok) break; }
        /* застрял в ветках и листве — проламывает их; давит только тяжёлое (камень, металл, земля) */
        if (!ok) {
          let heavy = false;
          for (let k = 0; k < HB; k++) { const j = (fy - k) * W + cx, t = type[j]; if (t === AIR) continue; if (t === LEAF || t === SPROUT || t === SEED || t === CONE || t === FSEED || (t === WOOD && aux[j] !== 0)) put(j, AIR); else if (KIND[t] === K.SOLID || KIND[t] === K.POWDER) heavy = true; }
          if (heavy) { e.hp -= 3; if (e.hp <= 0 && !e.dying) dieEnt(e, 'crush'); }
        }
      }
      let ground = blockedC(cx, fy + 1);
      const wasSwim = e.swim;
      if (e.jump) { e.jump = false; if (ground && inLiq < 6) { e.vy = -1.45 * (ab.jump || 1); ground = false; } }
      if (e.pop) { e.vy = e.pop; e.pop = 0; ground = false; }
      e.swim = inLiq >= 6; e.air = !ground && !e.swim;
      if (e.swim && !wasSwim && e.vy > .8 && !e.dying) splash(cx, fy, Math.min(1.5, e.vy / 2));
      if (e.swim && !e.dying) { e.vy = Math.max(-.28, e.vy - .05); if (ground && e.vy > 0) e.vy = 0; }
      else if (!ground) e.vy = Math.min(e.swim ? .6 : 3.2, e.vy + (e.swim ? .04 : .2 * (ab.grav || 1)));
      else {
        if (e.vy > 1.1 && !e.dying) e.land = Math.min(12, 4 + Math.round(e.vy * 3));
        if (e.vy > 2.5) { e.hp -= (e.vy - 2.3) * (e.tumble > 0 ? 40 : 80) / (ab.tough || 1); e.hurt = 14; if (!e.dying && e.hp > 0) e.stun = Math.max(e.stun, 12); }
        e.vy = 0;
      }
      if (e.hp <= 0 && !e.dying) dieEnt(e, e.tumble > 0 ? 'blast' : 'fall');
      e.fy += e.vy;
      while (e.fy >= 1) { e.fy -= 1; if (!blockedC(cx, fy + 1)) fy++; else { e.vy = 0; e.fy = 0; } }
      while (e.fy <= -1) { e.fy += 1; if (bodyFree(cx, fy - 1)) fy--; else { e.vy = 0; e.fy = 0; } }
      e.y = fy;
      /* отброс от взрыва */
      if (e.kx) {
        const nx = e.x + e.kx, ncx = Math.floor(nx);
        if (ncx === cx || bodyFree(ncx, fy)) e.x = nx; else { if (Math.abs(e.kx) > 1 && !e.dying) { e.hp -= 8; e.hurt = 10; } e.kx = 0; }
        e.kx *= (ground || e.swim) ? .82 : .985; if (Math.abs(e.kx) < .04) e.kx = 0;
        e.x = Math.max(3, Math.min(W - 4, e.x));
      }
      if (e.dying) {
        e.dt++;
        if (e.dying === 'burn' && rnd() < .25 && type[(fy - HB) * W + cx] === AIR) put((fy - HB) * W + cx, FIRE);
        const dur = S.ENT_DUR[e.dying] || 40;
        if (e.dying === 'shock' && e.dt < 300 && e.dt % 14 === 0 && type[(fy - HB) * W + cx] === AIR) put((fy - HB) * W + cx, SMOKE);
        if (e.dt >= dur && !e.dead) { e.dead = true; e.deadAt = S.frame; }
        /* тело остаётся всегда; уничтожают его только огонь (обугливает и сжигает в пепел), лава, кислота и взрыв (entBlast) */
        if (e.dead) {
          const i = Math.round(e.y) * W + Math.floor(e.x);
          if (hot) { if (type[i] === AIR) put(i, ASH); if (type[i - 1] === AIR) put(i - 1, ASH); ents.splice(n, 1); sfx('hiss', .3); continue; }
          if (fire) {
            if (e.dying === 'freeze') { e.dying = 'old'; e.thawed = 1; e.dt = S.ENT_DUR.old; }   /* лёд растаял — тело ложится */
            e.charred = 1; e.bburn = (e.bburn | 0) + 1;
            if (rnd() < .2 && type[(fy - 2) * W + cx] === AIR) put((fy - 2) * W + cx, FIRE);
            if (e.bburn > (e.dying === 'burn' ? 120 : 260)) { if (type[i] === AIR) put(i, ASH); if (type[i + 1] === AIR) put(i + 1, ASH); ents.splice(n, 1); continue; }
          }
          if (acid) { e.acid = (e.acid | 0) + 1; if (e.acid > 160) { ents.splice(n, 1); continue; } }
        }
        continue;
      }
      if (e.stun > 0) { e.walk = false; continue; }
      /* мозг: зомби идут к людям, люди бегут от зомби */
      let tgt = null, best = 1e9;
      for (const o of ents) { if (o === e || e.z === o.z || o.dying) continue; const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y); if (d < best) { best = d; tgt = o; } }
      if (e.z) {
        if (tgt && best < 130) e.dir = tgt.x > e.x ? 1 : -1; else if (--e.t <= 0) { e.t = 60 + rn(140); e.dir = rnd() < .5 ? -1 : 1; e.idle = rnd() < .3 ? 1 : 0; }
        /* укус: ранит; заражает раненого (здоровье ниже 45) или изредка сразу */
        if (tgt && Math.abs(tgt.x - e.x) < 3.5 && Math.abs(tgt.y - e.y) < 10 && rnd() < .025) {
          e.atk = 16; tgt.hp -= 18; tgt.hurt = 12; tgt.stun = Math.max(tgt.stun, 10); tgt.kx = (tgt.kx || 0) + (tgt.x > e.x ? .5 : -.5);
          if (tgt.hp < 45 || rnd() < .12) infect(tgt);
        }
      } else {
        /* от зомби бегут, если не хватает духу драться (Combat.brave: оружие или вооружённый товарищ рядом) */
        if (tgt && best < 70 && !e.fight && !(typeof Combat !== 'undefined' && Combat.brave(e))) { e.dir = tgt.x > e.x ? -1 : 1; e.idle = 0; e.fear = 10; e.task = null; e.sleep = 0; e.txt = 'Убегает от зомби'; e.chatWith = null; e.goal = null; }
        else if (e.burn > 0) { e.txt = 'Горит!'; }
        else if (typeof Life !== 'undefined') Life.think(e, S);
        else if (--e.t <= 0) { e.t = 50 + rn(180); e.dir = rnd() < .5 ? -1 : 1; e.idle = rnd() < .35 ? 1 : 0; }
      }
      if (e.burn > 0) {
        if (e.z) { if (rnd() < .06) e.dir = -e.dir; }
        else {   /* человек бежит прочь от огня, а не мечется обратно в пламя */
          let hl = 0, hr = 0;
          for (let dx = 1; dx <= 7; dx++) for (let k = 0; k < HB; k += 2) { const b = (fy - k) * W; if (cx - dx > 0 && (type[b + cx - dx] === FIRE || burn[b + cx - dx] !== 0)) hl++; if (cx + dx < W - 1 && (type[b + cx + dx] === FIRE || burn[b + cx + dx] !== 0)) hr++; }
          if (hl !== hr) e.dir = hl > hr ? 1 : -1;
        }
        e.idle = 0;
      }
      e.walk = !(e.idle && !(e.burn > 0));
      if (!e.walk) continue;
      const sp = (e.z ? .09 : .15) * (ab.speed || 1) * (e.burn > 0 ? 1.8 : 1) * (e.fear > 0 ? 1.3 : 1) * (e.spdk || 1) * (e.swim ? .5 * (ab.swim || 1) : 1);
      /* фермер сажает семена на землю позади себя */
      if (ab.seeds && ground && !e.z && type[(fy + 1) * W + cx] === EARTH && rnd() < .004) { const bx = cx - e.dir, bi = fy * W + bx; if (bx > 1 && bx < W - 2 && type[bi] === AIR) { put(bi, rnd() < .2 ? FSEED : SEED); e.act = 'seed'; e.at = 16; e.stun = 14; } }
      const nx = e.x + e.dir * sp, ncx = Math.floor(nx), lead = ncx + e.dir;
      if (ncx !== cx) {
        if (bodyFree(ncx, fy) && bodyFree(lead, fy)) {
          if (!e.z && ground && e.burn === 0 && !e.swim && !blockedC(ncx, fy + 1) && !blockedC(ncx, fy + 2) && !blockedC(ncx, fy + 3) && !blockedC(ncx, fy + 4) && !blockedC(ncx, fy + 5)) { e.dir = -e.dir; e.t = 40; }
          else e.x = nx;
        } else {
          let stepped = false;
          if (ground || e.swim) for (let up = 1; up <= 3; up++) if (bodyFree(ncx, fy - up) && bodyFree(lead, fy - up) && bodyFree(cx, fy - up)) { e.x = nx; e.y = fy - up; stepped = true; break; }
          if (!stepped && ab.dig && ground && !e.z) {
            /* шахтёр прокапывает проход: камень, землю, песок, снег — но не гранит */
            let can = false, hard = false;
            for (const col of [ncx, lead]) for (let k = 0; k < HB; k++) {
              const j = (fy - k) * W + col, t = type[j];
              if (t === AIR || !(KIND[t] === K.SOLID || KIND[t] === K.POWDER)) continue;
              if (t === WALL || t === SKY) { hard = true; continue; }
              can = true; if (rnd() < .25) { put(j, AIR); if (rnd() < .06) sfx('pop', .4); }
            }
            if (can && !hard) { stepped = true; e.act = 'dig'; e.at = 10; }
          }
          if (!stepped && !ab.dig && ground && !e.z && !e.burn) {
            let plants = false, soft = false, hard = false;
            for (const col of [ncx, lead]) for (let k = 0; k < HB; k++) {
              const j = (fy - k) * W + col, t = type[j];
              if (t === AIR || !(KIND[t] === K.SOLID || KIND[t] === K.POWDER)) continue;
              if (t === LEAF || t === SPROUT || t === LITTER || t === SEED || t === CONE || t === FSEED) { plants = true; if (rnd() < .3) put(j, AIR); }
              else if (t === EARTH || t === SAND || t === MUD || t === SNOW || t === ASH || t === SALT) soft = true;
              else hard = true;
            }
            if (plants && !soft && !hard) { stepped = true; e.act = 'dig'; e.at = 8; }   /* проламывает листву */
            else if (soft && !hard && e.goal != null) {   /* к цели мешает земляная стенка — прокапывает */
              for (const col of [ncx, lead]) for (let k = 0; k < HB; k++) { const j = (fy - k) * W + col, t = type[j]; if ((t === EARTH || t === SAND || t === MUD || t === SNOW || t === ASH || t === SALT) && rnd() < .12) put(j, AIR); }
              stepped = true; e.act = 'dig'; e.at = 10; if (rnd() < .04) sfx('pop', .3);
            }
          }
          if (!stepped) { if (ground && rnd() < .12) e.jump = true; else e.dir = -e.dir; }
        }
      } else e.x = nx;
    }
  }

  /* ---------- падение деревьев (как в Terraria): оторванное от земли падает, потом заваливается набок ---------- */
  const bodies = []; S.bodies = bodies;
  let svis = null, svStamp = 0, lastUn = new Map(), ignoreUn = new Map(), bmark = null, bodyId = 0, scanT = 0;
  const bq2 = new Int32Array(30000);
  const isNat = (i) => { const t = type[i]; return (t === WOOD || t === LEAF) && aux[i] !== 0 && fl[i] === 0; };
  function groundSupport(i) {
    for (let q = 0; q < 5; q++) {
      const n = i + (q === 0 ? W : q === 1 ? -1 : q === 2 ? 1 : q === 3 ? W - 1 : W + 1), t = type[n];
      if (t === undefined) continue;
      const k = KIND[t];
      if (t === ASH || t === SNOW || t === SALT || t === GUNP || t === SEED || t === CONE || t === FSEED) continue;
      if ((k === K.SOLID || k === K.POWDER) && !((t === WOOD || t === LEAF) && aux[n] !== 0)) return true;
    }
    return false;
  }
  let unMark = null;
  function supportScan() {
    if (!svis || svis.length !== N) { svis = new Uint32Array(N); unMark = new Uint32Array(N); }
    if (!bmark || bmark.length !== N) bmark = new Uint32Array(N);
    svStamp++; if (!bodies.length) bmark.fill(0);
    for (let i = W; i < N - W; i++) {
      if (svis[i] === svStamp || !isNat(i)) continue;
      let qh = 0, qt = 0, anch = false, skip = false, minI = i;
      bq2[qt++] = i; svis[i] = svStamp;
      while (qh < qt) {
        const c = bq2[qh++];
        if (c < minI) minI = c;
        if (bmark[c] !== 0) skip = true;
        if (!anch && groundSupport(c)) anch = true;
        if (!skip && plants.length) { const cx = c % W, cy = (c / W) | 0; for (let q = 0; q < plants.length; q++) { const p = plants[q]; if (cx >= p.x0 && cx <= p.x1 && cy >= p.y0 && cy <= p.y1) { skip = true; break; } } }
        for (let k = 0; k < 8; k++) { const nn = c + NB8[k]; if (svis[nn] !== svStamp && isNat(nn)) { if (qt < bq2.length - 8) { svis[nn] = svStamp; bq2[qt++] = nn; } else anch = true; } }
      }
      if (anch || skip) continue;
      const key = minI;
      /* оторванным считаем, только если в прошлую проверку эти клетки тоже висели (защита от случайных разрывов) */
      let seen = false;
      for (let q = 0; q < qt; q++) { if (unMark[bq2[q]] === svStamp - 1) { seen = true; break; } }
      for (let q = 0; q < qt; q++) unMark[bq2[q]] = svStamp;
      if (seen) { if (qt < 6) crumble(Array.from(bq2.subarray(0, qt))); else if (bodies.length < 6) startBody(Array.from(bq2.subarray(0, qt)), minI); }
    }
  }
  function startBody(list, key) {
    list.sort((a, b) => b - a);
    const b = { id: ++bodyId, cells: list, v: 0, acc: 0, dist: 0, phase: 0, key, theta: 0, omega: .02 };
    for (const c of list) bmark[c] = b.id;
    bodies.push(b);
  }
  function canDrop(b, off) {
    const cells = b.cells;
    for (let k = 0; k < cells.length; k++) {
      const n = cells[k] + off; if (bmark[n] === b.id) continue;
      const t = type[n]; if (t !== AIR && KIND[t] !== K.GAS) return false;
    }
    return true;
  }
  function dropBody(b, off) {
    const cells = b.cells;
    for (let k = 0; k < cells.length; k++) { const c = cells[k]; bmark[c] = 0; swap(c, c + off); bmark[c + off] = b.id; cells[k] = c + off; }
  }
  /* прямо вниз, а если нельзя — соскальзывает по склону, как песок */
  function stepFall(b) {
    if (canDrop(b, W)) { dropBody(b, W); return true; }
    const s = rnd() < .5 ? -1 : 1;
    if (canDrop(b, W + s)) { dropBody(b, W + s); return true; }
    if (canDrop(b, W - s)) { dropBody(b, W - s); return true; }
    return false;
  }
  function endBody(b, idx) {
    if (b.phase === 0) for (const c of b.cells) if (bmark[c] === b.id) bmark[c] = 0;
    bodies.splice(idx, 1);
  }
  function scatter(cells, power) {
    S.shake = Math.max(S.shake, Math.min(7, power)); sfx('crack', .7);
    for (const c of cells) if (type[c] === LEAF && rnd() < .07 * power) launch(c, (rnd() - .5) * 2.6, -.5 - rnd() * 1.6);
  }
  /* то, что не может ни упасть, ни завалиться, рассыпается: листва осыпается, ветки разлетаются */
  function crumble(list) {
    for (const c of list) {
      bmark[c] = 0; const t = type[c];
      if (t === LEAF) conv(c, LITTER);
      else if (t === WOOD) { if (rnd() < .35) conv(c, ASH); else launch(c, (rnd() - .5) * 1.8, -.3 - rnd() * .9); }
    }
    sfx('crack', .4);
  }
  function startTopple(b) {
    const cells = b.cells; let maxY = -1;
    for (const c of cells) { const y = (c / W) | 0; if (y > maxY) maxY = y; }
    let minX = 1e9, maxX = -1e9, sx = 0;
    for (const c of cells) { const x = c % W, y = (c / W) | 0; sx += x; if (y >= maxY - 1) { if (x < minX) minX = x; if (x > maxX) maxX = x; } }
    const com = sx / cells.length, mid = (minX + maxX) / 2;
    const dir = com - mid > .6 ? 1 : com - mid < -.6 ? -1 : (rnd() < .5 ? 1 : -1), pxx = dir > 0 ? maxX : minX, pyy = maxY;
    const map = new Map(), recs = []; let rad = 1;
    for (const c of cells) {
      const rx = (c % W) - pxx, ry = pyy - ((c / W) | 0);
      const r = { rx, ry, t: type[c], a: aux[c], v: vv[c], b: burn[c], T: Tm[c], dead: false };
      recs.push(r); map.set((rx + 512) * 1024 + (ry + 512), r); rad = Math.max(rad, Math.abs(rx), Math.abs(ry));
    }
    b.phase = 1; b.dir = dir; b.px = pxx; b.py = pyy; b.map = map; b.rad = rad + 2; b.cur = cells; b.curRecs = recs; b.theta = 0; b.omega = .004;
  }
  function rotRaster(b, th) {
    const s = Math.sin(th), c = Math.cos(th), d = b.dir, R = b.rad, idx = [], recs = [];
    let hit = false;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const u = dx * d, sx = u * c - dy * s, sy = u * s + dy * c;
      const r = b.map.get((Math.round(sx * d) + 512) * 1024 + (Math.round(sy) + 512));
      if (!r || r.dead) continue;
      const gx = b.px + dx, gy = b.py - dy;
      if (gx < 1 || gx >= W - 1 || gy < 2 || gy >= H - 1) { hit = true; continue; }
      const gi = gy * W + gx, t = type[gi];
      if (t !== AIR && KIND[t] !== K.GAS) {
        if (r.t === LEAF) { r.dead = true; continue; }   /* листва мнётся о землю, ствол — нет */
        hit = true;
      }
      idx.push(gi); recs.push(r);
    }
    return { idx, recs, hit };
  }
  function placeRaster(b, res) {
    for (let k = 0; k < res.idx.length; k++) { const i = res.idx[k], r = res.recs[k]; put(i, r.t); aux[i] = r.a; vv[i] = r.v; burn[i] = r.b; Tm[i] = r.T; bmark[i] = b.id; }
    b.cur = res.idx; b.curRecs = res.recs;
  }
  function stepBodies() {
    for (let bi = bodies.length - 1; bi >= 0; bi--) {
      const b = bodies[bi];
      if (b.phase === 0) {
        const keep = []; for (const c of b.cells) if (isNat(c)) keep.push(c); else if (bmark[c] === b.id) bmark[c] = 0;
        if (keep.length !== b.cells.length) b.cells = keep;
        if (!keep.length) { bodies.splice(bi, 1); continue; }
        b.v = Math.min(2.6, b.v + .2); b.acc += b.v; const rows = b.acc | 0; b.acc -= rows;
        let landed = false;
        for (let r = 0; r < rows; r++) { if (stepFall(b)) b.dist++; else { landed = true; break; } }
        if (!landed && rows === 0 && !canDrop(b, W)) landed = true;
        if (landed) {
          let minY = 1e9, maxY = -1; for (const c of b.cells) { const y = (c / W) | 0; if (y < minY) minY = y; if (y > maxY) maxY = y; }
          const hgt = maxY - minY + 1;
          if (b.dist === 0) { crumble(b.cells); bodies.splice(bi, 1); }
          else if (hgt >= 9 && b.cells.length >= 14) startTopple(b);
          else { if (b.dist >= 3) scatter(b.cells, Math.min(8, b.dist * .6)); endBody(b, bi); }
        }
      } else {
        for (let k = 0; k < b.cur.length; k++) { const c = b.cur[k], r = b.curRecs[k]; if (type[c] === r.t) { r.b = burn[c]; r.T = Tm[c]; r.a = aux[c]; } else r.dead = true; }
        for (const c of b.cur) { bmark[c] = 0; const t = type[c]; if (t === WOOD || t === LEAF) put(c, AIR); }
        b.omega += .0009; const nt = Math.min(Math.PI / 2, b.theta + b.omega);
        const res = rotRaster(b, nt);
        if (res.hit) {
          const back = rotRaster(b, b.theta); placeRaster(b, back);
          if (b.theta === 0) crumble(b.cur); else { scatter(b.cur, Math.min(8, b.theta * 6)); for (const c of b.cur) bmark[c] = 0; }
          bodies.splice(bi, 1);
        } else {
          placeRaster(b, res); b.theta = nt;
          if (nt >= Math.PI / 2 - 1e-6) { scatter(b.cur, 5); for (const c of b.cur) bmark[c] = 0; bodies.splice(bi, 1); }
        }
      }
    }
  }
  function stepTrees() {
    if (++scanT % 24 === 0 && bodies.length < 6) supportScan();
    if (bodies.length) stepBodies();
  }

  Object.assign(S, {
    die: (e, k, w) => dieEnt(e, k, w), alloc, clear, step, put, conv, paint, heatArea, pushArea, blast, lightning, meteor, census, generate, plantInstant, pack, unpack, ignite,
    spawnEnt, rnd, rn, get frameNo() { return fr; }, get flying() { return nf; }
  });
  return S;
})();
