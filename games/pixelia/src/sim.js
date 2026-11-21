'use strict';
/* ПИКСЕЛИЯ — ядро симуляции: клеточный автомат с температурой, давлением воды, горением, током, взрывами и ростом деревьев */
const Sim = (function () {
  const { AIR, WALL, SKY, EARTH, SAND, SNOW, SALT, GUNP, ASH, WATER, BRINE, OIL, LAVA, ACID, MUD, FIRE, STEAM, SMOKE, GAS, STONE, METAL, GLASS,
    WOOD, ICE, LEAF, SEED, SPROUT, SPARK, BATT, LAMP, CLONE, VOID, FLY } = E;
  const ERODE = .0016;
  let W = 0, H = 0, N = 0;
  let type, Tm, life, aux, vv, burn, vy, fl, stamp, pr;
  let fr = 1, NB4, NB8, DIRS;
  const S = { wind: 0, weather: 0, shake: 0, pressure: true, A: {}, bolts: [], meteors: [], W: 0, H: 0, frame: 0, sfx: null };
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
    nf = 0; S.bolts.length = 0; S.meteors.length = 0;
    S.A = { type, Tm, life, aux, vv, burn, fl }; S.W = W; S.H = H;
    borders();
  }
  function borders() {
    for (let x = 0; x < W; x++) { type[x] = SKY; type[(H - 1) * W + x] = WALL; }
    for (let y = 0; y < H; y++) { type[y * W] = WALL; type[y * W + W - 1] = WALL; }
  }
  function clear() {
    type.fill(0); Tm.fill(AMB); life.fill(0); aux.fill(0); burn.fill(0); vy.fill(0); fl.fill(0); pr.fill(0); nf = 0;
    S.bolts.length = 0; S.meteors.length = 0; borders();
  }
  function initLife(i, t) {
    switch (t) {
      case ACID: life[i] = 12; break;
      case STEAM: life[i] = 110 + rn(140); break;
      case SMOKE: life[i] = 50 + rn(150); break;
      case FIRE: life[i] = 10 + rn(16); break;
      case BATT: life[i] = rn(8); break;
      case SPARK: life[i] = 3; break;
    }
  }
  function put(i, t, temp) {
    type[i] = t; life[i] = 0; aux[i] = 0; burn[i] = 0; vy[i] = 0; fl[i] = 0; vv[i] = (rnd() * 256) | 0;
    Tm[i] = temp === undefined ? T0[t] : temp;
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
    const b = burn[i] - 1; burn[i] = b;
    const bh = BHEAT[t]; if (Tm[i] < bh) Tm[i] = bh;
    const up = i - W;
    if (type[up] === AIR) {
      const r = rnd(), fp = FLAMEP[t];
      if (r < fp) { put(up, FIRE); Tm[up] = Math.max(520, bh * .8); } else if (r < fp + .04) put(up, SMOKE);
    }
    const n = i + NB8[rn(8)], tn = type[n];
    if (FLAMM[tn] !== 0 && burn[n] === 0 && rnd() < FLAMM[tn]) ignite(n);
    if (b === 0) finishBurn(i, x, y, t);
  }
  function finishBurn(i, x, y, t) {
    switch (t) {
      case WOOD: if (rnd() < .5) conv(i, ASH); else put(i, AIR); break;
      case LEAF: if (rnd() < .3) conv(i, ASH); else put(i, AIR); break;
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
    S.shake = Math.max(S.shake, Math.min(14, power * R * 1.1));
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
    S.bolts.push({ cells, ttl: 8 });
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
    blast(x, y, 3, .3);
  }
  function meteor(x, dir) {
    S.meteors.push({ x: x, y: 1, vx: (dir || (rnd() < .5 ? -1 : 1)) * (.9 + rnd() * .8), vy: 1.9 + rnd() * .5, trail: [] });
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
    if (moved) { if (v < 7) vy[cur] = v + 1; return; }
    vy[i] = 0;
    const rp = REPOSE[t]; if (rp < 1 && rnd() >= rp) return;
    const d = rnd() < .5 ? -1 : 1;
    if (!slide(i, t, d)) slide(i, t, -d);
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
    if (moved) { if (v < 7) vy[cur] = v + 1; return; }
    vy[i] = 0;
    const d = rnd() < .5 ? -1 : 1;
    if (slide(i, t, d) || slide(i, t, -d)) return;
    const range = DISPR[t] + (v >> 1);
    if (spread(i, d, range) || spread(i, -d, range)) return;
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
  function leafBlob(x, y, R) {
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R + 1) continue;
      const xx = x + dx, yy = y + dy; if (xx < 1 || xx >= W - 1 || yy < 1 || yy >= H - 1) continue;
      const i = yy * W + xx; if (type[i] === AIR && rnd() < .84) put(i, LEAF);
    }
  }
  function germinate(i, energy) { put(i, SPROUT); life[i] = energy; aux[i] = 0; }
  function sproutStep(i, x, y) {
    const tm = Tm[i]; if (tm < -6 || tm > 80) { conv(i, ASH); return true; }
    const e = life[i], a = aux[i];
    if (e === 0) { leafBlob(x, y, (a & 4) ? 1 : 2 + rn(2)); conv(i, LEAF); return true; }
    let c1, c2, c3;
    if (a & 4) { const s = (a & 8) ? 1 : -1; if (rnd() < .55) { c1 = i + s; c2 = i - W + s; c3 = i - W; } else { c1 = i - W + s; c2 = i + s; c3 = i - W; } }
    else { const r = rnd(); if (r < .62) { c1 = i - W; c2 = i - W - 1; c3 = i - W + 1; } else if (r < .81) { c1 = i - W - 1; c2 = i - W; c3 = i - W + 1; } else { c1 = i - W + 1; c2 = i - W; c3 = i - W - 1; } }
    let j = -1;
    if (type[c1] === AIR) j = c1; else if (type[c2] === AIR) j = c2; else if (type[c3] === AIR) j = c3;
    if (j < 0) { life[i] = 0; return false; }
    conv(i, WOOD);
    if (!(a & 4) && e >= 18 && type[i + 1] === AIR) put(i + 1, WOOD);
    put(j, SPROUT); life[j] = e - 1; aux[j] = a;
    if (!(a & 4) && e <= 15 && e >= 5 && rnd() < .2) {
      const s = rnd() < .5 ? -1 : 1, jb = i + s;
      if (type[jb] === AIR && type[jb + s] === AIR) { put(jb, SPROUT); life[jb] = 2 + rn(4); aux[jb] = 4 | (s > 0 ? 8 : 0); }
    }
    return true;
  }
  function react(i, x, y, t) {
    const tm = Tm[i];
    if (IGN[t] !== 0 && tm >= IGN[t] && burn[i] === 0) ignite(i);
    switch (t) {
      case EARTH: {
        const n = i + NB4[rn(4)];
        if (type[n] === WATER && rnd() < .15) { conv(i, MUD); if (rnd() < .5) put(n, AIR); return true; }
        return false;
      }
      case SAND: if (tm > 1100 && rnd() < .3) { conv(i, GLASS); return true; } return false;
      case SNOW: if (tm > .8 && rnd() < .25) { conv(i, WATER); Tm[i] = 1.2; return true; } return false;
      case SALT: {
        const n = i + NB4[rn(4)], tn = type[n];
        if (tn === WATER && rnd() < .12) { conv(n, BRINE); put(i, AIR); return true; }
        if ((tn === ICE || tn === SNOW) && rnd() < .1) { put(n, BRINE, -6); put(i, AIR); return true; }
        return false;
      }
      case GUNP: {
        const n = i + NB4[rn(4)];
        if (type[n] === WATER && !(aux[i] & 1) && rnd() < .2) { aux[i] |= 1; if (rnd() < .5) put(n, AIR); }
        else if ((aux[i] & 1) && tm > 60 && rnd() < .05) aux[i] &= ~1;
        return false;
      }
      case MUD:
        if (tm > 45 && rnd() < .06) { conv(i, EARTH); if (rnd() < .2 && type[i - W] === AIR) put(i - W, STEAM, 100); return true; }
        if (type[i - W] === AIR && rnd() < .0015) { conv(i, EARTH); return true; }
        return false;
      case SEED: {
        const b = i + W, tb = type[b];
        if ((tb === EARTH || tb === MUD) && tm > 0 && tm < 60) {
          let ok = false;
          if (tb === MUD) { ok = true; conv(b, EARTH); }
          else for (let dy = -2; dy <= 3 && !ok; dy++) for (let dx = -4; dx <= 4; dx++) { const j = i + dy * W + dx; if (type[j] === WATER) { put(j, AIR); ok = true; break; } }
          if (ok) { germinate(i, tb === MUD ? 34 : 26); return true; }
        }
        return false;
      }
      case SPROUT: return sproutStep(i, x, y);
      case LEAF: {
        const n = i + NB4[rn(4)], tn = type[n];
        if ((tn === SALT || tn === BRINE) && rnd() < .2) { put(i, AIR); return true; }
        if (tm > 70) { conv(i, ASH); return true; }
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
        const n = i + NB4[rn(4)], tn = type[n];
        if (tn === LAVA) { if (rnd() < .5) { conv(n, STONE); Tm[n] = 850; put(i, STEAM, 140); if (type[i - W] === AIR) put(i - W, STEAM, 130); sfx('hiss', .6); return true; } }
        else if (tn === FIRE) { put(n, AIR); if (rnd() < .15) { put(i, STEAM, 105); return true; } }
        else if (tn === STONE && !brine && rnd() < ERODE) conv(n, SAND);
        if (burn[n] !== 0 && rnd() < .35) { burn[n] = 0; if (rnd() < .3) { put(i, STEAM, 105); return true; } }
        return false;
      }
      case LAVA: {
        if (tm < 720 && rnd() < .3) { conv(i, STONE); Tm[i] = 700; return true; }
        const n = i + NB8[rn(8)], tn = type[n];
        if (FLAMM[tn] !== 0 && burn[n] === 0) { if (rnd() < .6) ignite(n); }
        else if (tn === WATER || tn === BRINE) { if (rnd() < .5) { conv(i, STONE); Tm[i] = 850; put(n, STEAM, 140); if (type[n - W] === AIR) put(n - W, STEAM, 130); sfx('hiss', .6); return true; } }
        else if (tn === SAND && rnd() < .05) { conv(n, GLASS); Tm[n] = 1150; }
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
        if (tm < 650) Tm[i] = 650 + rn(150);
        const n = i + NB8[rn(8)], tn = type[n];
        if (FLAMM[tn] !== 0 && burn[n] === 0 && rnd() < FLAMM[tn]) ignite(n);
        else if (tn === WATER || tn === BRINE || tn === SNOW || tn === ICE || tn === MUD) { put(i, AIR); return true; }
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
        const n = i + NB4[rn(4)];
        if (type[n] === AIR && rnd() < .5) put(n, tpl);
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
    let rate = w === 2 ? W / 70 : w === 3 ? W / 38 : W / 55;
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
  function buildTree(x, y, h) {
    let cx = x, cy = y, lastx = x;
    const trunk = [];
    for (let s = 0; s < h; s++) {
      if (cy < 4) break;
      const i = cy * W + cx; if (type[i] !== AIR && type[i] !== LEAF) break;
      put(i, WOOD); if (s < h * .3 && type[i + 1] === AIR) put(i + 1, WOOD);
      trunk.push([cx, cy]); lastx = cx; cy--;
      if (rnd() < .16) cx += rnd() < .5 ? -1 : 1;
      cx = Math.max(2, Math.min(W - 3, cx));
    }
    const nb = 2 + rn(2);
    for (let b = 0; b < nb && trunk.length > 8; b++) {
      const p = trunk[(trunk.length * (.5 + rnd() * .35)) | 0], d = rnd() < .5 ? -1 : 1, len = 3 + rn(3);
      let bx = p[0], by = p[1];
      for (let k = 0; k < len; k++) { bx += d; if (k % 2 === 1) by--; const i = by * W + bx; if (bx < 2 || bx >= W - 2 || by < 3) break; if (type[i] === AIR) put(i, WOOD); }
      leafBlob(bx, by, 2);
    }
    leafBlob(lastx, cy + 1, 3 + rn(2));
  }
  function generate(kind) {
    clear();
    const sea = Math.floor(H * .74);
    if (kind === 'void') return;
    const hm = new Int16Array(W);
    const p1 = rnd() * 6.28, p2 = rnd() * 6.28;
    for (let x = 0; x < W; x++) {
      const nx = x / W;
      let bump = Math.max(0, 1 - Math.pow((nx - (.38 + rnd() * 0 + .08)) / .3, 2));
      if (kind === 'sea') bump = 0;
      const ridge = Math.sin(nx * 11 + p1) * .5 + Math.sin(nx * 5 + p2) * .5;
      hm[x] = Math.round(sea + H * .06 - bump * H * .34 - bump * ridge * H * .02 - (kind === 'sea' ? ridge * 2 : 0));
    }
    for (let x = 1; x < W - 1; x++) {
      const top = Math.max(2, hm[x]);
      for (let y = top; y < H - 1; y++) {
        const i = y * W + x, depth = y - top;
        if (y > sea + 2 && depth < 3) put(i, SAND);
        else if (top >= sea - 2 && depth < 3) put(i, SAND);
        else if (depth < 4) put(i, EARTH);
        else put(i, STONE);
      }
      for (let y = sea; y < top; y++) put(y * W + x, WATER);
    }
    if (kind === 'island') {
      let placed = 0;
      for (let tries = 0; tries < 60 && placed < 3; tries++) {
        const x = 6 + rn(W - 12), top = hm[x];
        if (top >= sea - 4 || top < 6) continue;
        if (Math.abs(hm[x - 2] - top) > 2 || Math.abs(hm[x + 2] - top) > 2) continue;
        buildTree(x, top - 1, 14 + rn(9)); placed++;
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
    if (mapW && (mapW !== W || mapH !== H)) alloc(mapW, mapH); else if (!type || ow !== W || oh !== H) alloc(ow, oh); else clear();
    for (let y = 1; y < H - 1; y++) {
      const oy = Math.min(oh - 2, Math.max(1, Math.round(y * oh / H)));
      for (let x = 1; x < W - 1; x++) {
        const ox = Math.min(ow - 2, Math.max(1, Math.round(x * ow / W))), oi = oy * ow + ox, i = y * W + x;
        type[i] = ot[oi]; life[i] = ol[oi]; aux[i] = oa[oi]; burn[i] = ob[oi]; Tm[i] = (tl[oi] | (th[oi] << 8)) - 300;
      }
    }
  }

  Object.assign(S, {
    alloc, clear, step, put, conv, paint, heatArea, pushArea, blast, lightning, meteor, census, generate, buildTree, pack, unpack, ignite,
    rnd, rn, get frameNo() { return fr; }, get flying() { return nf; }
  });
  return S;
})();
