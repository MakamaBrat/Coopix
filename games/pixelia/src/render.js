'use strict';
/* ПИКСЕЛИЯ — отрисовка: пиксель-арт, мягкое свечение, небо со звёздами и облаками */
const Render = (function () {
  const { AIR, WALL, SKY, EARTH, SAND, SNOW, SALT, GUNP, ASH, WATER, BRINE, OIL, LAVA, ACID, MUD, FIRE, STEAM, SMOKE, GAS, STONE, METAL, GLASS,
    WOOD, ICE, LEAF, SEED, SPROUT, SPARK, BATT, LAMP, CLONE, VOID, FLY } = E;
  const R = { lens: false, W: 0, H: 0 };
  let cv, ctx, img, u32, gcv, gctx, gimg, gu32, lw, lh, light, lit, ltmp, bgcv, tick = 0, litKey = -1;
  const clamp = (v) => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const px = (r, g, b, a) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const PAL = new Uint32Array(NT * 256), GRASS = new Uint32Array(256), LAVAPAL = new Uint32Array(256), FIREPAL = new Uint32Array(32);
  const LENS = new Uint32Array(301);
  /* светотень деревьев: листва 1..5, трава 6..8, лепестки 9..16, сердцевина цветка 17; кора 1..5 */
  const LEAFPAL0 = [0, px(22, 70, 42, 255), px(36, 108, 56, 255), px(54, 148, 68, 255), px(92, 192, 86, 255), px(150, 228, 118, 255), px(62, 172, 72, 255), px(118, 216, 92, 255), px(38, 124, 58, 255),
    px(255, 140, 190, 255), px(255, 224, 80, 255), px(250, 250, 255, 255), px(176, 120, 255, 255), px(240, 70, 80, 255), px(255, 150, 50, 255), px(110, 170, 255, 255), px(255, 196, 220, 255), px(255, 205, 40, 255)];
  const SKINC = [[255, 208, 168], [240, 184, 140], [204, 146, 104], [150, 98, 64], [104, 68, 46]];
  const HAIRC = [[62, 40, 24], [28, 24, 22], [176, 112, 52], [224, 194, 92], [154, 62, 42], [112, 112, 116]];
  const PANTC = [[48, 66, 140], [60, 60, 72], [92, 72, 50], [40, 92, 72]];
  const WOODPAL0 = [0, px(46, 26, 20, 255), px(80, 46, 30, 255), px(116, 68, 40, 255), px(154, 96, 56, 255), px(192, 132, 82, 255)];
  const LEAFPAL = LEAFPAL0.slice(), WOODPAL = WOODPAL0.slice();
  const mix = (c, r, g, b, k) => {
    const cr = c & 255, cg = (c >> 8) & 255, cb = (c >> 16) & 255, ca = c >>> 24;
    return px(clamp(cr + (r - cr) * k), clamp(cg + (g - cg) * k), clamp(cb + (b - cb) * k), Math.max(ca, (255 * k) | 0));
  };
  (function buildPal() {
    for (let t = 0; t < ID_LIST.length; t++) {
      const c = COLOR[t]; if (!c) continue;
      for (let v = 0; v < 256; v++) {
        const s = (v - 128) / 128 * VARI[t];
        PAL[t * 256 + v] = px(clamp(c[0] + s), clamp(c[1] + s * .9), clamp(c[2] + s * .8), ALPHA[t]);
      }
    }
    for (let v = 0; v < 256; v++) {
      const s = (v - 128) / 128 * 20;
      GRASS[v] = px(clamp(70 + s), clamp(176 + s), clamp(58 + s * .6), 255);
      const n = v / 255;
      LAVAPAL[v] = px(255, clamp(60 + n * 170), clamp(8 + n * n * 90), 255);
    }
    for (let l = 0; l < 32; l++) {
      const n = l / 31;
      FIREPAL[l] = px(255, clamp(50 + n * 205), clamp(n * n * n * 170), clamp(110 + n * 140));
    }
    for (let k = 0; k <= 300; k++) {
      const T = k * 10 - 60;
      let r = 0, g = 0, b = 0, a = 0;
      if (T < -40) { r = 40; g = 80; b = 255; a = .7; } else if (T < 0) { r = 90; g = 170; b = 255; a = .5; }
      else if (T < 30) a = 0; else if (T < 100) { r = 255; g = 225; b = 70; a = .5; } else if (T < 400) { r = 255; g = 140; b = 30; a = .65; }
      else if (T < 900) { r = 255; g = 60; b = 50; a = .75; } else { r = 255; g = 255; b = 215; a = .85; }
      LENS[k] = px(r, g, b, (a * 255) | 0);
    }
  })();

  /* ---------- освещение мира по времени суток: палитры материалов умножаются на цвет окружающего света ---------- */
  const PAL0 = PAL.slice(), GRASS0 = GRASS.slice();
  const tintArr = (dst, src, r, g, b) => { for (let i = 0; i < src.length; i++) { const c = src[i]; dst[i] = ((c & 0xff000000) | (clamp(((c >> 16) & 255) * b) << 16) | (clamp(((c >> 8) & 255) * g) << 8) | clamp((c & 255) * r)) >>> 0; } };
  /* времена года: листва (оттенки 1..8) и трава меняют цвет. Весна — свежая, лето — как нарисовано, осень — жёлтая и красная, зима — в инее */
  const SEAS = [
    { leaf: [[30, 96, 52], [52, 140, 70], [84, 184, 84], [126, 222, 104], [184, 246, 140], [96, 206, 88], [156, 238, 110], [58, 150, 66]], grass: [96, 198, 70] },
    { leaf: [[22, 70, 42], [36, 108, 56], [54, 148, 68], [92, 192, 86], [150, 228, 118], [62, 172, 72], [118, 216, 92], [38, 124, 58]], grass: [70, 176, 58] },
    { leaf: [[112, 44, 22], [164, 70, 24], [206, 108, 30], [232, 150, 44], [250, 206, 86], [190, 98, 26], [240, 184, 64], [142, 62, 24]], grass: [172, 146, 54] },
    { leaf: [[96, 116, 128], [128, 150, 160], [166, 186, 196], [206, 222, 230], [238, 246, 250], [150, 172, 182], [222, 234, 240], [112, 134, 146]], grass: [224, 234, 246] }];
  let seasKey = '';
  function setSeason(si, t) {
    const key = si + ':' + Math.round(t * 20); if (key === seasKey) return; seasKey = key;
    const a = SEAS[si], b = SEAS[(si + 1) & 3], l = (u, v) => u + (v - u) * t;
    for (let i = 0; i < 8; i++) LEAFPAL0[i + 1] = px(clamp(l(a.leaf[i][0], b.leaf[i][0])), clamp(l(a.leaf[i][1], b.leaf[i][1])), clamp(l(a.leaf[i][2], b.leaf[i][2])), 255);
    const g0 = l(a.grass[0], b.grass[0]), g1 = l(a.grass[1], b.grass[1]), g2 = l(a.grass[2], b.grass[2]);
    for (let v = 0; v < 256; v++) { const s = (v - 128) / 128 * 20; GRASS0[v] = px(clamp(g0 + s), clamp(g1 + s), clamp(g2 + s * .6), 255); }
    litKey = -1;
  }
  function applyAmb(am) {
    const r = am.amb[0], g = am.amb[1], b = am.amb[2];
    tintArr(PAL, PAL0, r, g, b); tintArr(GRASS, GRASS0, r, g, b); tintArr(LEAFPAL, LEAFPAL0, r, g, b); tintArr(WOODPAL, WOODPAL0, r, g, b);
    litKey = am.ambKey;
  }

  function init(canvas, glowCanvas, bgCanvas, W, H) {
    cv = canvas; gcv = glowCanvas; bgcv = bgCanvas; R.W = W; R.H = H;
    cv.width = W; cv.height = H;
    ctx = cv.getContext('2d');
    img = ctx.createImageData(W, H); u32 = new Uint32Array(img.data.buffer);
    lw = Math.ceil(W / 2); lh = Math.ceil(H / 2);
    gcv.width = lw; gcv.height = lh; gctx = gcv.getContext('2d'); gimg = gctx.createImageData(lw, lh); gu32 = new Uint32Array(gimg.data.buffer);
    light = new Float32Array(lw * lh * 3); lit = new Float32Array(lw * lh * 3); ltmp = new Float32Array(lw * lh * 3);
    const ec = document.getElementById('ents'); if (ec && typeof People !== 'undefined') People.init(ec, W, H);
    if (typeof Houses !== 'undefined') Houses.init(document.getElementById('bld'), W, H);
    Sky.init(bgcv, W, H); litKey = -1;
  }

  const LK = 7;   /* сила света от источников */
  const BED0 = px(46, 42, 58, 255), BED1 = px(38, 34, 50, 255);
  /* размытие карты света коробкой (по строкам и столбцам), дважды — мягкий круг радиусом ~12 клеток */
  function blurLight(src, dst, r) {
    const w = lw, h = lh, w3 = w * 3, n = 2 * r + 1;
    for (let y = 0; y < h; y++) { const o = y * w3; for (let c = 0; c < 3; c++) { let s = 0; for (let k = -r; k <= r; k++) s += src[o + Math.max(0, Math.min(w - 1, k)) * 3 + c]; for (let x = 0; x < w; x++) { ltmp[o + x * 3 + c] = s / n; s += src[o + Math.min(w - 1, x + r + 1) * 3 + c] - src[o + Math.max(0, x - r) * 3 + c]; } } }
    for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) { const o = x * 3 + c; let s = 0; for (let k = -r; k <= r; k++) s += ltmp[Math.max(0, Math.min(h - 1, k)) * w3 + o]; for (let y = 0; y < h; y++) { dst[y * w3 + o] = s / n; s += ltmp[Math.min(h - 1, y + r + 1) * w3 + o] - ltmp[Math.max(0, y - r) * w3 + o]; } }
  }
  /* освещение: днём мир как есть; в сумерках и ночью он темнеет до цвета окружающего света, а огонь, лава, лампы, искры и молнии освещают всё вокруг */
  function shade(am) {
    const ar = am.amb[0], ag = am.amb[1], ab = am.amb[2];
    if (ar > .985 && ag > .985 && ab > .985) return;
    blurLight(light, lit, 4); blurLight(lit, lit, 4);
    const W = R.W, H = R.H, lw3 = lw * 3, K = LK;
    for (let y = 0; y < H; y++) {
      const lr = (y >> 1) * lw3, row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x, c = u32[i]; if (c === 0) continue;
        const li = lr + (x >> 1) * 3;
        const fr = Math.min(1.12, ar + lit[li] * K), fg = Math.min(1.12, ag + lit[li + 1] * K), fb = Math.min(1.12, ab + lit[li + 2] * K);
        u32[i] = ((c & 0xff000000) | (clamp(((c >> 16) & 255) * fb) << 16) | (clamp(((c >> 8) & 255) * fg) << 8) | clamp((c & 255) * fr)) >>> 0;
      }
    }
  }
  /* свет в точке мира (по прошлому кадру): окружающий + от источников */
  const LA = [1, 1, 1];
  function lightAt(x, y) {
    const am = Sky.Y.amb, xx = Math.max(0, Math.min(lw - 1, (x | 0) >> 1)), yy = Math.max(0, Math.min(lh - 1, (y | 0) >> 1)), li = (yy * lw + xx) * 3;
    LA[0] = am[0] + lit[li] * LK; LA[1] = am[1] + lit[li + 1] * LK; LA[2] = am[2] + lit[li + 2] * LK; return LA;
  }
  function draw(S) {
    tick++;
    const am = Sky.ambient(); if (litKey !== 0) applyAmb({ amb: [1, 1, 1], ambKey: 0 });
    const A = S.A, type = A.type, Tm = A.Tm, life = A.life, aux = A.aux, vv = A.vv, burn = A.burn;
    const W = R.W, H = R.H, lens = R.lens, wave = tick >> 2;
    light.fill(0);
    const lw3 = lw * 3;
    const flash = S.bolts.length ? Math.max.apply(null, S.bolts.map(b => b.ttl)) / 8 : 0;
    for (let y = 0; y < H; y++) {
      const row = y * W, lrow = (y >> 1) * lw3;
      for (let x = 0; x < W; x++) {
        const i = row + x, t = type[i];
        let c = 0, er = 0, eg = 0, eb = 0;
        const T = Tm[i];
        if (t === AIR) {
          if (lens && (T > AMB + 2 || T < AMB - 2)) { c = LENS[Math.max(0, Math.min(300, ((T + 60) / 10) | 0))]; c = (c & 0xffffff) | (((c >>> 24) * .55 | 0) << 24); }
          u32[i] = c; continue;
        }
        if (t === SKY || (t === WALL && (x === 0 || x === W - 1))) { u32[i] = 0; continue; }
        if (t === WALL && y === H - 1) { u32[i] = ((x >> 1) & 1) ? BED0 : BED1; continue; }   /* дно мира видно: предметы на нём стоят, а не висят */
        const v = vv[i];
        c = PAL[t * 256 + v];
        switch (t) {
          case EARTH: { const ta = type[i - W]; if (ta === AIR || KIND[ta] === K.GAS) c = GRASS[v]; break; }
          case SAND: if (life[i] > 0) c = mix(c, 96, 74, 40, .14 * life[i]); break;   /* мокрый песок темнее */
          case MUD: if (life[i] > 0) c = mix(c, 36, 24, 18, .07 * life[i]); break;      /* набухшая грязь темнее */
          case WATER: case BRINE: {
            const ta = type[i - W];
            if (KIND[ta] !== K.LIQUID) { c = mix(c, 190, 230, 255, .45); if (((x * 5 + wave + (y >> 1)) & 15) === 0) c = mix(c, 255, 255, 255, .6); }
            else if (KIND[type[i - W - W]] === K.LIQUID) c = mix(c, 10, 30, 90, .18);
            const a = aux[i]; if (a === 1) { c = px(210, 250, 255, 255); er = .6; eg = .9; eb = 1; } else if (a === 2) c = mix(c, 160, 220, 255, .4);
            break;
          }
          case LAVA: c = LAVAPAL[(v + wave * 13 + x * 3) & 255]; er = 1; eg = .45; eb = .1; break;
          case FIRE: {
            const l = life[i]; c = FIREPAL[l > 31 ? 31 : l];
            if (l < 5) c = (c & 0xffffff) | ((l * 50 + 20) << 24);
            er = .85; eg = .4; eb = .08; break;
          }
          case STEAM: { const l = life[i]; if (l < 40) c = (c & 0xffffff) | (((ALPHA[STEAM] * l / 40) | 0) << 24); break; }
          case SMOKE: { if (aux[i] & 1) c = px(110, 205, 70, 150); const l = life[i]; if (l < 40) c = (c & 0xffffff) | (((150 * l / 40) | 0) << 24); break; }
          case GAS: if (((x + y + wave) & 7) === 0) c = (c & 0xffffff) | (150 << 24); break;
          case ICE: if (((x + y) & 7) === 0) c = mix(c, 255, 255, 255, .5); break;
          case GLASS: if (((x + y) % 9) === 0) c = px(235, 250, 255, 210); break;
          case METAL: {
            const a = aux[i]; if (a === 1) { c = px(190, 245, 255, 255); er = .5; eg = .85; eb = 1; } else if (a === 2) c = mix(c, 90, 130, 220, .5);
            else if (type[i - W] === AIR) c = mix(c, 255, 255, 255, .18);
            break;
          }
          case SNOW: case SALT: if (((x * 3 + y * 7 + wave) & 31) === 0) c = px(255, 255, 255, 255); break;
          case GUNP: if (aux[i] & 1) c = mix(c, 20, 22, 32, .45); break;
          case LEAF: { const a = aux[i]; if (a > 0 && a < LEAFPAL.length) c = LEAFPAL[a]; else if (type[i - W] === AIR) c = mix(c, 180, 255, 120, .22); break; }
          case SPROUT: c = mix(c, 220, 255, 160, ((wave + x) & 7) < 3 ? .35 : 0); break;
          case WOOD: { const a = aux[i]; if (a > 0 && a < WOODPAL.length) c = WOODPAL[a]; else if ((x & 3) === 0) c = mix(c, 60, 34, 14, .22); break; }
          case LAMP: {
            const l = life[i];
            if (l > 0) { const k = Math.min(1, l / 10); c = px(clamp(220 + 35 * k), clamp(214 + 30 * k), clamp(190 - 40 * k + 100 * (1 - k)), 255); er = 1.3 * k; eg = 1.1 * k; eb = .6 * k; }
            break;
          }
          case BATT: {
            if (type[i - W] === AIR) c = px(190, 196, 210, 255);
            else if (((y + x) & 3) === 0) c = px(90, 230, 120, 255);
            if (life[i] < 2) { er = .1; eg = .5; eb = .2; }
            break;
          }
          case CLONE: {
            const tp = life[i]; c = mix(c, 230, 170, 255, ((wave + x + y) & 7) < 2 ? .4 : 0);
            if (tp !== 0 && ((x + y) & 1) === 0) { const tc = PAL[tp * 256 + 128]; c = px(tc & 255, (tc >> 8) & 255, (tc >> 16) & 255, 255); }
            er = .15; eg = .05; eb = .3; break;
          }
          case VOID: c = ((x + y + wave) & 7) === 0 ? px(110, 40, 170, 255) : c; er = .08; eb = .2; break;
          case FLY: { const ph = life[i]; const k = ph < 32 ? ph / 32 : (63 - ph) / 32; c = px(clamp(150 + 80 * k), 255, clamp(80 + 40 * k), 255); er = .9 * (.4 + k); eg = 1 * (.4 + k); eb = .3; break; }
          case SPARK: c = px(220, 250, 255, 255); er = 1; eg = 1.1; eb = 1.3; break;
        }
        const b = burn[i];
        if (b !== 0) {
          const n = (v + wave * 7) & 255, left = b / (FUEL[t] * 1.15 + 1);
          if (left < .3 && (t === WOOD || t === LEAF)) { c = n > 190 ? px(255, 120, 30, 255) : mix(c, 28, 20, 18, .72); er += .5 * left + .15; eg += .15; }
          else { c = n > 120 ? mix(c, 255, 190, 50, .6) : mix(c, 255, 100, 20, .6); er += .55; eg += .25; eb += .05; }
        }
        if (T > 380 && t !== FIRE && t !== LAVA) {
          const g = Math.min(1, (T - 380) / 700);
          c = mix(c, 255, clamp(50 + 190 * g), clamp(14 + 140 * g * g), .35 + .6 * g);
          er += g * .8; eg += g * .4 * g; eb += g * .1;
        } else if (T < -5 && t !== ICE && t !== SNOW && ALPHA[t] === 255) c = mix(c, 160, 210, 255, Math.min(.35, (-T - 5) / 120));
        if (lens) { const lc = LENS[Math.max(0, Math.min(300, ((T + 60) / 10) | 0))]; const la = (lc >>> 24); if (la) c = mix(((c & 0xffffff) | 0xff000000) >>> 0, lc & 255, (lc >> 8) & 255, (lc >> 16) & 255, la / 255 * .75); else c = mix(c, 120, 120, 130, .35); }
        u32[i] = c;
        if (er + eg + eb > .01) { const li = lrow + (x >> 1) * 3; light[li] += er; light[li + 1] += eg; light[li + 2] += eb; }
      }
    }
    /* человечки и зомби: спрайт 10x23 на слое с двойным разрешением (people.js); здесь только свет от горящих */
    for (const e of S.ents) if (e.ab && e.ab.light) {
      /* фонарь шахтёра и посох мага светятся */
      const lx = Math.floor(e.x) + (e.ab.light === 'staff' ? 2 * (e.dir < 0 ? -1 : 1) : 0), ly = Math.round(e.y) - 11;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = (ly >> 1) + dy, xx = (lx >> 1) + dx; if (yy < 0 || yy >= lh || xx < 0 || xx >= lw) continue; const li = yy * lw3 + xx * 3, k = dx || dy ? .45 : 1.1; if (e.ab.light === 'staff') { light[li] += .5 * k; light[li + 1] += .9 * k; light[li + 2] += 1.3 * k; } else { light[li] += 1.2 * k; light[li + 1] += 1.05 * k; light[li + 2] += .6 * k; } }
    }
    for (const e of S.ents) if (e.burn > 0) { const cx = Math.floor(e.x), fy = Math.round(e.y), li = (fy >> 1) * lw3 + (cx >> 1) * 3; if (li >= 0 && li < light.length - 2) { light[li] += 1.4; light[li + 1] += .6; light[li + 2] += .1; } }
    /* дома: окна, лампы и очаги светят ночью; задняя стена и мебель — на своём слое за миром */
    if (typeof Houses !== 'undefined') { const nt = Sky.Y.night || 0; Houses.lights((x, y, r, g, b) => { const yy = (y | 0) >> 1, xx = (x | 0) >> 1; if (yy < 0 || yy >= lh || xx < 0 || xx >= lw) return; const li = yy * lw3 + xx * 3; light[li] += r; light[li + 1] += g; light[li + 2] += b; }, nt); Houses.drawBg(am.amb, am.ambKey, nt); if (typeof Works !== 'undefined') Works.lights((x, y, r, g, b) => { const yy = (y | 0) >> 1, xx = (x | 0) >> 1; if (yy < 0 || yy >= lh || xx < 0 || xx >= lw) return; const li = yy * lw3 + xx * 3; light[li] += r; light[li + 1] += g; light[li + 2] += b; }, nt); }
    if (typeof People !== 'undefined') People.draw(S.ents, S.frame, am.amb, am.ambKey, lightAt);
    /* молнии */
    for (const bolt of S.bolts) {
      const k = bolt.ttl / 8;
      for (const ci of bolt.cells) {
        u32[ci] = px(255, 255, 255, 255);
        const x = ci % W, y = (ci / W) | 0;
        if (x > 0 && type[ci - 1] === AIR) u32[ci - 1] = px(160, 200, 255, clamp(200 * k));
        if (x < W - 1 && type[ci + 1] === AIR) u32[ci + 1] = px(160, 200, 255, clamp(200 * k));
        const li = (y >> 1) * lw3 + (x >> 1) * 3; light[li] += .9 * k; light[li + 1] += 1.1 * k; light[li + 2] += 1.6 * k;
      }
    }
    /* метеориты */
    for (const m of S.meteors) {
      for (let k = 0; k < m.trail.length; k += 2) {
        const tx = Math.round(m.trail[k]), ty = Math.round(m.trail[k + 1]), f = k / m.trail.length;
        if (tx >= 0 && tx < W && ty >= 0 && ty < H) { u32[ty * W + tx] = px(255, clamp(80 + 150 * f), clamp(20 * f), clamp(40 + 215 * f)); const li = (ty >> 1) * lw3 + (tx >> 1) * 3; light[li] += .5 * f; light[li + 1] += .25 * f; }
      }
      const mx = Math.round(m.x), my = Math.round(m.y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = mx + dx, yy = my + dy; if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        u32[yy * W + xx] = (dx === 0 && dy === 0) ? px(255, 250, 200, 255) : px(255, 140, 40, 255);
      }
      if (mx >= 0 && mx < W && my >= 0 && my < H) { const li = (my >> 1) * lw3 + (mx >> 1) * 3; light[li] += 2.4; light[li + 1] += 1.4; light[li + 2] += .4; }
    }
    shade(am);
    ctx.putImageData(img, 0, 0);
    /* свечение: размытие 3x3 и вывод; ночью огонь и лава светят сильнее */
    const gain = 1.6 * (1 + .35 * am.night);
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        let r = 0, g = 0, b = 0, wsum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= lh) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= lw) continue;
            const w = (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1), li = (yy * lw + xx) * 3;
            r += light[li] * w; g += light[li + 1] * w; b += light[li + 2] * w; wsum += w;
          }
        }
        r = r / 16 + flash * .22; g = g / 16 + flash * .26; b = b / 16 + flash * .4;
        gu32[y * lw + x] = px(clamp((1 - Math.exp(-r * gain)) * 255), clamp((1 - Math.exp(-g * gain)) * 255), clamp((1 - Math.exp(-b * gain)) * 255), 255);
      }
    }
    gctx.putImageData(gimg, 0, 0);
    Sky.draw(S, tick);
  }
  function snapshot(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(bgcv, 0, 0, w, h); x.drawImage(cv, 0, 0, w, h); if (typeof People !== 'undefined' && People.canvas) x.drawImage(People.canvas, 0, 0, w, h); x.globalCompositeOperation = 'screen'; x.imageSmoothingEnabled = true; x.drawImage(gcv, 0, 0, w, h);
    return c;
  }
  Object.assign(R, { init, draw, snapshot, PAL, setSeason });
  return R;
})();
