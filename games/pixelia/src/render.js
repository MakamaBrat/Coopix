'use strict';
/* ПИКСЕЛИЯ — отрисовка: пиксель-арт, мягкое свечение, небо со звёздами и облаками */
const Render = (function () {
  const { AIR, WALL, SKY, EARTH, SAND, SNOW, SALT, GUNP, ASH, WATER, BRINE, OIL, LAVA, ACID, MUD, FIRE, STEAM, SMOKE, GAS, STONE, METAL, GLASS,
    WOOD, ICE, LEAF, SEED, SPROUT, SPARK, BATT, LAMP, CLONE, VOID, FLY } = E;
  const R = { lens: false, theme: 'night', W: 0, H: 0 };
  let cv, ctx, img, u32, gcv, gctx, gimg, gu32, lw, lh, light, bgcv, bgctx, bgBase, tick = 0;
  let stars = [], clouds = [];
  const clamp = (v) => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const px = (r, g, b, a) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const PAL = new Uint32Array(NT * 256), GRASS = new Uint32Array(256), LAVAPAL = new Uint32Array(256), FIREPAL = new Uint32Array(32);
  const LENS = new Uint32Array(301);
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

  /* ---------- небо ---------- */
  const THEMES = {
    night: { top: [5, 9, 34], bot: [22, 44, 100], stars: 1, cloud: [58, 76, 134, 150], moon: 1 },
    day: { top: [58, 142, 228], bot: [176, 224, 250], stars: 0, cloud: [255, 255, 255, 235] },
    dusk: { top: [40, 28, 92], bot: [255, 168, 98], stars: .5, cloud: [255, 190, 170, 190] },
    cave: { top: [20, 20, 30], bot: [38, 34, 50], stars: 0, cloud: null }
  };
  function buildBackdrop() {
    const T = THEMES[R.theme] || THEMES.night, W = R.W, H = R.H;
    bgBase = bgctx.createImageData(W, H); const d = new Uint32Array(bgBase.data.buffer);
    const bands = 18;
    for (let y = 0; y < H; y++) {
      const f = Math.min(bands - 1, Math.floor(y / H * bands)) / (bands - 1);
      const r = clamp(T.top[0] + (T.bot[0] - T.top[0]) * f), g = clamp(T.top[1] + (T.bot[1] - T.top[1]) * f), b = clamp(T.top[2] + (T.bot[2] - T.top[2]) * f);
      for (let x = 0; x < W; x++) {
        let rr = r, gg = g, bb = b;
        if (R.theme === 'cave') { const n = ((x * 7349 + y * 1013 + ((x >> 2) * (y >> 2)) * 31) & 15); const k = n < 3 ? 8 : n > 13 ? -6 : 0; rr += k; gg += k; bb += k + 2; }
        else if (((x + y) & 1) === 0 && (y % Math.max(2, Math.floor(H / bands))) === 0) { rr += 2; gg += 2; bb += 3; }
        d[y * W + x] = px(rr, gg, bb, 255);
      }
    }
    stars = [];
    const ns = Math.floor(W * H * T.stars / 500);
    for (let i = 0; i < ns; i++) {
      const x = (Math.random() * W) | 0, y = (Math.random() * H * .8) | 0, big = Math.random() < .12, c = Math.random() < .5 ? px(255, 255, 255, 255) : px(190, 210, 255, 255);
      stars.push({ x, y, big, tw: (Math.random() * 64) | 0 });
      d[y * W + x] = c; if (big) { d[y * W + Math.min(W - 1, x + 1)] = c; d[Math.min(H - 1, y + 1) * W + x] = c; }
    }
    if (T.moon) {
      const mx = (W * .82) | 0, my = (H * .14) | 0, mr = Math.max(4, (Math.min(W, H) * .045) | 0);
      for (let dy = -mr; dy <= mr; dy++) for (let dx = -mr; dx <= mr; dx++) {
        if (dx * dx + dy * dy > mr * mr) continue;
        const crater = ((dx * 3 + dy * 5) & 7) === 0 ? 14 : 0;
        const inShade = (dx + mr * .4) * (dx + mr * .4) + (dy - mr * .2) * (dy - mr * .2) < mr * mr * .78;
        if (!inShade) d[(my + dy) * W + mx + dx] = px(250 - crater, 244 - crater, 214 - crater, 255);
        else d[(my + dy) * W + mx + dx] = px(232 - crater, 228 - crater, 200 - crater, 255);
      }
    }
    if (R.theme === 'dusk') { const sy = (H * .42) | 0; for (let x = 0; x < W; x++) for (let k = 0; k < 3; k++) { const y = sy + k * 3; d[y * W + x] = mix(d[y * W + x], 255, 220, 160, .12); } }
    clouds = [];
    if (T.cloud) { const n = Math.max(3, (W / 55) | 0); for (let i = 0; i < n; i++) clouds.push({ x: Math.random() * W, y: H * (.05 + Math.random() * .38), s: 1 + (Math.random() * 1.6), v: .015 + Math.random() * .03 }); }
  }
  const CLOUD = [[2, 0, 5, 1], [0, 1, 9, 1], [-1, 2, 11, 1], [0, 3, 9, 1], [3, -1, 3, 1]];
  function drawBackdrop() {
    bgctx.putImageData(bgBase, 0, 0);
    const T = THEMES[R.theme] || THEMES.night;
    for (const s of stars) {
      const ph = (tick / 12 + s.tw) % 8;
      if (ph < 1) { bgctx.fillStyle = 'rgba(5,9,34,.85)'; bgctx.fillRect(s.x, s.y, 1, 1); }
      else if (ph > 6.5 && s.big) { bgctx.fillStyle = '#fff'; bgctx.fillRect(s.x - 1, s.y, 3, 1); bgctx.fillRect(s.x, s.y - 1, 1, 3); }
    }
    if (T.cloud) {
      const c = T.cloud; bgctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (c[3] / 255) + ')';
      for (const cl of clouds) {
        cl.x += cl.v; if (cl.x > R.W + 12) cl.x = -14;
        const bx = Math.round(cl.x), by = Math.round(cl.y);
        for (const r of CLOUD) bgctx.fillRect(bx + Math.round(r[0] * cl.s), by + Math.round(r[1] * cl.s * 1.4), Math.max(1, Math.round(r[2] * cl.s)), Math.max(1, Math.round(r[3] * cl.s * 1.4)));
      }
    }
  }

  function init(canvas, glowCanvas, bgCanvas, W, H) {
    cv = canvas; gcv = glowCanvas; bgcv = bgCanvas; R.W = W; R.H = H;
    cv.width = W; cv.height = H; bgcv.width = W; bgcv.height = H;
    ctx = cv.getContext('2d'); bgctx = bgcv.getContext('2d');
    img = ctx.createImageData(W, H); u32 = new Uint32Array(img.data.buffer);
    lw = Math.ceil(W / 2); lh = Math.ceil(H / 2);
    gcv.width = lw; gcv.height = lh; gctx = gcv.getContext('2d'); gimg = gctx.createImageData(lw, lh); gu32 = new Uint32Array(gimg.data.buffer);
    light = new Float32Array(lw * lh * 3);
    buildBackdrop(); drawBackdrop();
  }
  function setTheme(name) { R.theme = THEMES[name] ? name : 'night'; if (bgctx) { buildBackdrop(); drawBackdrop(); } }

  function draw(S) {
    tick++;
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
        if (t === SKY || (t === WALL && (x === 0 || x === W - 1 || y === H - 1))) { u32[i] = 0; continue; }
        const v = vv[i];
        c = PAL[t * 256 + v];
        switch (t) {
          case EARTH: { const ta = type[i - W]; if (ta === AIR || KIND[ta] === K.GAS) c = GRASS[v]; break; }
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
          case LEAF: if (type[i - W] === AIR) c = mix(c, 180, 255, 120, .22); break;
          case SPROUT: c = mix(c, 220, 255, 160, ((wave + x) & 7) < 3 ? .35 : 0); break;
          case WOOD: if ((x & 3) === 0) c = mix(c, 60, 34, 14, .22); break;
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
        if (b !== 0) { const n = (v + wave * 7) & 255; c = n > 120 ? mix(c, 255, 190, 50, .6) : mix(c, 255, 100, 20, .6); er += .55; eg += .25; eb += .05; }
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
    ctx.putImageData(img, 0, 0);
    /* свечение: размытие 3x3 и вывод */
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
        gu32[y * lw + x] = px(clamp((1 - Math.exp(-r * 1.6)) * 255), clamp((1 - Math.exp(-g * 1.6)) * 255), clamp((1 - Math.exp(-b * 1.6)) * 255), 255);
      }
    }
    gctx.putImageData(gimg, 0, 0);
    if ((tick & 3) === 0) drawBackdrop();
  }
  function snapshot(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(bgcv, 0, 0, w, h); x.drawImage(cv, 0, 0, w, h); x.globalCompositeOperation = 'screen'; x.imageSmoothingEnabled = true; x.drawImage(gcv, 0, 0, w, h);
    return c;
  }
  Object.assign(R, { init, draw, setTheme, snapshot, PAL, THEMES });
  return R;
})();
