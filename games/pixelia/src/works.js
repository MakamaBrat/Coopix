'use strict';
/* ПИКСЕЛИЯ — шахты и причалы.
   Шахта: наклонный ход-лестница, который копают каменщики (Life: shaft). Здесь — запись хода (ступени) и украшение:
   рама входа с фонарями, ворот, вагонетка с рудой на поверхности; крепёжные балки и фонари вдоль хода (на слое домов, за миром,
   поэтому видны в выкопанной пустоте). Шахту общества продолжают вглубь.
   Причал: настил из настоящих клеток дерева над водой (по нему ходят), строится пиратом по частям; сваи в воду, перила,
   якорь, бочки, буёк. На краю причала рыбачат. Картинки — из houseassets.js (HSA: mine_*, dock_*, cart*, anchor, buoy, barrels). */
const Works = (function () {
  const mines = [], docks = [], rods = [];
  let S = null, nextId = 1, ver = 0;
  const img = (k) => (typeof Houses !== 'undefined' && Houses.img) ? Houses.img(k) : null;
  /* ---------- шахты ---------- */
  function mineNear(soc, x) { return mines.find((m) => m.soc === soc && Math.abs(m.x0 - x) < 40) || null; }
  function newMine(soc, x0, g, dir) { const m = { id: nextId++, soc, x0, g, dir, steps: [] }; mines.push(m); ver++; return m; }
  function addStep(m, x, y) { m.steps.push([x, y]); if (m.steps.length % 5 === 0 || m.steps.length === 1) ver++; }
  /* ---------- причалы ---------- */
  const solid = (i) => { const t = S.A.type[i]; return t !== E.AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER); };
  const water = (i) => { const t = S.A.type[i]; return t === E.WATER || t === E.BRINE; };
  /* берег: суша, рядом глубокая вода; настил на 2 клетки выше воды, не ниже/выше берега больше чем на 3 */
  function findShore(x, maxD) {
    const W = S.W, H = S.H;
    const top = (cx) => { for (let y = 6; y < H - 1; y++) { const i = y * W + cx; if (S.A.type[i] !== E.AIR && KIND[S.A.type[i]] !== K.GAS) return y; } return -1; };
    for (let d = 0; d <= (maxD || 150); d += 2) for (const sg of [1, -1]) {
      const cx = Math.round(x + sg * d); if (cx < 6 || cx >= W - 6) continue;
      const g = top(cx); if (g < 0 || !solid(g * W + cx)) continue;
      for (const dir of [1, -1]) {
        const nx = cx + dir, wy = top(nx); if (wy < 0 || !water(wy * W + nx)) continue;
        let len = 0; for (let k = 1; k < 34; k++) { const xx = cx + dir * k; if (xx < 4 || xx >= W - 4) break; const t = top(xx); if (t !== wy || !water(t * W + xx) || !water((t + 2) * W + xx)) break; len++; }
        if (len < 12) continue;
        const y = wy - 2; if (Math.abs((g - 1) - (y - 1)) > 3 || docks.some((o) => Math.abs(o.x0 - cx) < 30)) continue;
        return { x0: cx, dir, y, len: Math.min(len - 2, 16 + ((Math.random() * 10) | 0)) };
      }
    }
    return null;
  }
  function newDock(soc, sh) { const o = { id: nextId++, soc, x0: sh.x0, dir: sh.dir, y: sh.y, len: sh.len, placed: 0, done: false }; docks.push(o); ver++; return o; }
  const deckX = (o, k) => o.x0 + o.dir * (k + 1);
  /* стройка причала: кладёт n клеток настила (по 1 дереву на 2 клетки берёт общество) */
  function buildDock(o, n) {
    for (let q = 0; q < n && o.placed < o.len; q++) { const x = deckX(o, o.placed), i = o.y * S.W + x; if (!solid(i)) { S.put(i, E.WOOD); S.A.aux[i] = 0; } o.placed++; }
    if (o.placed >= o.len && !o.done) { o.done = true; }
    ver++; return o.done;
  }
  /* ---------- лавочки у домов: по одной у готового дома, на ровной земле сбоку ---------- */
  /* место выбирается один раз и запоминается у дома (b.bench); заново — только если под лавкой пропала земля или рядом встал другой дом.
     Земля ищется без травы, листвы, семян и снега — иначе место «прыгало» каждый кадр, пока росла трава */
  const isPlantCell = (i) => { const t = S.A.type[i]; return t === E.LEAF || t === E.LITTER || t === E.SEED || t === E.CONE || t === E.FSEED || t === E.SPROUT || t === E.SNOW || (t === E.WOOD && S.A.aux[i] !== 0); };
  function groundOf(x, y0) {
    for (let y = Math.max(4, y0 - 12); y < Math.min(S.H - 1, y0 + 16); y++) { const i = y * S.W + x, t = S.A.type[i]; if (t === E.AIR || KIND[t] === K.GAS || isPlantCell(i)) continue; return solid(i) ? y : -1; }
    return -1;
  }
  function benchOK(b, s) {
    if (s.x < 6 || s.x > S.W - 7) return false;
    if (Houses.list.some((o) => s.x > o.x0 - 11 && s.x < o.x0 + o.w + 11)) return false;   /* лавка не залезает на дом (свой или соседний) */
    if (gardens.some((g) => g.beds.some((q) => Math.abs(q.x - s.x) < 12) || (g.wx != null && Math.abs(g.wx - s.x) < 14))) return false;   /* не на огороде и поленнице */
    const g = groundOf(Math.floor(s.x), s.g); return g >= 0 && Math.abs(g - s.g) <= 1;
  }
  function findBench(b) {
    for (const side of (b.id & 1 ? [-1, 1] : [1, -1])) for (const off of [12, 15, 18, 21]) {   /* лавка ~17 клеток шириной: от стены дома не ближе 3 клеток */
      const x = side < 0 ? b.x0 - off : b.x0 + b.w + off - 1; if (x < 6 || x > S.W - 7) continue;
      if (Houses.list.some((o) => x > o.x0 - 11 && x < o.x0 + o.w + 11)) continue;
      if (docks.some((o) => Math.abs(o.x0 - x) < 8) || mines.some((m) => Math.abs(m.x0 - x) < 6) || rods.some((r) => Math.abs(r.x - x) < 5)) continue;
      if (gardens.some((g) => g.beds.some((q) => Math.abs(q.x - x) < 12) || (g.wx != null && Math.abs(g.wx - x) < 14))) continue;
      if (Houses.list.some((o) => o !== b && o.bench && Math.abs(o.bench.x - x) < 19)) continue;   /* две лавки друг на друга не ставят */
      const g = groundOf(x, b.g); if (g < 0) continue;
      let flat = true; for (const dx of [-8, -4, 4, 8]) { const gg = groundOf(x + dx, g); if (gg < 0 || Math.abs(gg - g) > 1) { flat = false; break; } } if (!flat) continue;
      return { x: x + .5, g, b: b.id };
    }
    return null;
  }
  function benches() {
    S = S || Sim; const out = []; if (typeof Houses === 'undefined') return out;
    for (const b of Houses.list) {
      if (!b.done || b.ruin) { b.bench = null; continue; }
      if (b.bench && !benchOK(b, b.bench)) { b.benchBad = (b.benchBad || 0) + 1; if (b.benchBad > 90) { b.bench = null; b.benchBad = 0; } } else if (b.bench) b.benchBad = 0;   /* земля пропала надолго — ищем новое место */
      if (!b.bench && (S.frame + b.id * 13) % 60 === 0) b.bench = findBench(b);
      if (b.bench) out.push(b.bench);
    }
    return out;
  }
  function benchNear(x, maxD) { let best = null, bd = maxD || 90; for (const s of benches()) { const d = Math.abs(s.x - x); if (d < bd) { bd = d; best = s; } } return best; }
  /* ---------- громоотводы ---------- */
  /* место: за деревней (28–70 клеток от середины), не ближе 14 к домам, на ровной твёрдой земле не у воды, чем выше — тем лучше */
  const ROD_H = 15, ROD_R = 80;   /* молния в радиусе 80 клеток уходит в громоотвод */
  function groundAt(x) { for (let y = 6; y < S.H - 1; y++) { const t = S.A.type[y * S.W + x]; if (t === E.AIR || KIND[t] === K.GAS) continue; return solid(y * S.W + x) ? y : -1; } return -1; }
  function rodSite(soc, cx) {
    S = S || Sim;
    let best = null;
    for (let d = 28; d <= 70; d += 3) for (const sg of [1, -1]) {
      const x = Math.round(cx + sg * d); if (x < 6 || x > S.W - 7) continue;
      if (typeof Houses !== 'undefined' && Houses.list.some((b) => x > b.x0 - 14 && x < b.x0 + b.w + 14)) continue;
      if (mines.some((m) => Math.abs(m.x0 - x) < 8) || docks.some((o) => Math.abs(o.x0 - x) < 10) || rods.some((r) => Math.abs(r.x - x) < 30)) continue;
      const g = groundAt(x); if (g < ROD_H + 8) continue;
      if (Math.abs(groundAt(x - 2) - g) > 2 || Math.abs(groundAt(x + 2) - g) > 2) continue;
      let clear = true; for (let y = g - ROD_H - 2; y < g && clear; y++) if (S.A.type[y * S.W + x] !== E.AIR) clear = false; if (!clear) continue;
      if (!best || g < best.g) best = { x, g };
    }
    return best;
  }
  /* шест из металла на землю; громоотвод жив, пока цела верхушка */
  function buildRod(soc, x) {
    S = S || Sim;
    const g = groundAt(x); if (g < ROD_H + 4) return null;
    for (let y = g - 1; y >= g - ROD_H; y--) { const i = y * S.W + x; if (S.A.type[i] !== E.AIR) return null; }
    for (let y = g - 1; y >= g - ROD_H; y--) { const i = y * S.W + x; S.put(i, E.METAL); S.A.aux[i] = 0; }
    const r = { id: nextId++, soc, x, g, hit: 0 }; rods.push(r); ver++; return r;
  }
  /* молния рядом с громоотводом уходит в него */
  function rodFor(x) { S = S || Sim; let best = null, bd = ROD_R; for (const r of rods) { const d = Math.abs(r.x - x); if (d < bd && S.A.type[(r.g - ROD_H) * S.W + r.x] === E.METAL) { bd = d; best = r; } } return best; }
  /* причал жив, пока настил в основном цел */
  function step(sim) {
    S = sim; for (const r of rods) if (r.hit > 0) r.hit--;
    /* громоотвод держится, пока под ним земля и шест цел: иначе всё, что выше разрыва, падает и заваливается вбок */
    if (S.frame % 6 === 0) for (let k = rods.length - 1; k >= 0; k--) {
      const r = rods[k], W = S.W, base = S.A.type[r.g * W + r.x], grounded = base !== E.AIR && (KIND[base] === K.SOLID || KIND[base] === K.POWDER);
      let brk = grounded ? -1 : r.g;
      if (brk < 0) for (let y = r.g - 1; y >= r.g - ROD_H; y--) if (S.A.type[y * W + r.x] !== E.METAL) { brk = y; break; }
      if (brk < 0) continue;
      const side = r.tip || (Math.random() < .5 ? -1 : 1); let n = 0;
      for (let y = brk - 1; y >= r.g - ROD_H; y--) { const i = y * W + r.x; if (S.A.type[i] !== E.METAL) continue; const h = brk - y; if (S.launch) S.launch(i, side * (.15 + h * .06) + (Math.random() - .5) * .1, -.1); n++; }
      if (!grounded || n) { rods.splice(k, 1); ver++; if (S.sfx && n) S.sfx('tap', .5); }
    }
    birdsStep();
    if (S.frame % 60) return;
    gardensStep();
    for (let k = rods.length - 1; k >= 0; k--) { const r = rods[k]; if (S.A.type[(r.g - ROD_H) * S.W + r.x] !== E.METAL && S.A.type[(r.g - ROD_H + 1) * S.W + r.x] !== E.METAL) { rods.splice(k, 1); ver++; } }
    for (let k = docks.length - 1; k >= 0; k--) { const o = docks[k]; if (!o.placed) continue; let ok = 0; for (let q = 0; q < o.placed; q++) if (S.A.type[o.y * S.W + deckX(o, q)] === E.WOOD) ok++; if (ok < o.placed * .4) { docks.splice(k, 1); ver++; } }
  }

  /* ---------- огороды у домов: грядки (картинки из farm_res.png по стадиям), растут только политые и не зимой ----------
     стадии: 0 — нетронутая земля, 1 — вскопано, 2 — посажено, 3 — росток, 4–5 — растёт, 6 — созрело (собирают) */
  const gardens = [];
  const CROPS = ['wheat', 'corn', 'tomato', 'pumpkin'], CROP_RU = { wheat: 'пшеницу', corn: 'кукурузу', tomato: 'помидоры', pumpkin: 'тыквы' };
  const STG = (c) => ['bed_soil', 'bed_furrow', 'bed_seed', 'bed_sprout', c === 'corn' ? 'bed_young' : c + '1', c === 'corn' ? 'corn1' : c + '2', c === 'corn' ? 'corn2' : c + '3'];
  const GROW = 2400;   /* тактов на стадию (политая грядка), ~4 стадии до урожая */
  function gardenOK(b, xs) {
    for (const x of xs) {
      if (x < 4 || x > S.W - 5) return false;
      if (Houses.list.some((o) => x > o.x0 - 3 && x < o.x0 + o.w + 3)) return false;
      if (docks.some((o) => Math.abs(o.x0 - x) < 10) || mines.some((m) => Math.abs(m.x0 - x) < 12) || rods.some((r) => Math.abs(r.x - x) < 4)) return false;
      if (Houses.list.some((o) => o.bench && Math.abs(o.bench.x - x) < 11)) return false;
      if (S.camps && S.camps.some((c) => Math.abs(c.x - x) < 12)) return false;
      if (gardens.some((g) => g.b !== b.id && g.beds.some((q) => Math.abs(q.x - x) < 7))) return false;
      for (const dx of [-2, 0, 2]) { const g = groundOf(x + dx, b.g); if (g < 0 || Math.abs(g - b.g) > 1) return false; }
    }
    return true;
  }
  function findGarden(b) {
    const bs = b.bench ? (b.bench.x < b.x0 ? -1 : 1) : 0;
    for (const n of [3, 2]) for (const side of bs ? [-bs, bs] : [1, -1]) for (let off = 6; off <= 46; off += 3) {
      const x0 = side > 0 ? b.x0 + b.w + off : b.x0 - off, xs = Array.from({ length: n }, (_, k) => x0 + side * k * 7);
      if (!gardenOK(b, xs)) continue;
      let wood = null; for (const dx of [n * 7 + 3, n * 7 + 7, n * 7 + 11, -9, -13]) { const wx = x0 + side * dx; if (Math.abs(wx - x0) > 3 && !xs.some((q) => Math.abs(q - wx) < 9) && gardenOK(b, [wx - 3, wx + 3])) { wood = wx; break; } }
      return { id: nextId++, b: b.id, soc: b.soc, side, wx: wood, beds: xs.map((x, k) => ({ x, g: groundOf(x, b.g), crop: CROPS[(b.id + k) % CROPS.length], st: 0, t: 0, wet: 0 })) };
    }
    return null;
  }
  function gardensStep() {
    if (typeof Houses === 'undefined') return;
    const sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1, rain = (S.weather || 0) > 0;
    for (let k = gardens.length - 1; k >= 0; k--) { const g = gardens[k], b = Houses.byId ? Houses.byId(g.b) : Houses.list.find((o) => o.id === g.b); if (!b || b.ruin || !g.beds.length) { gardens.splice(k, 1); continue; } if (g.wx != null && Houses.list.some((o) => g.wx > o.x0 - 8 && g.wx < o.x0 + o.w + 8)) g.wx = null; }
    for (const b of Houses.list) if (b.done && !b.ruin && !gardens.some((g) => g.b === b.id) && ((S.frame / 60 | 0) + b.id) % 4 === 0 && (b.bench || (b.gTry = (b.gTry || 0) + 1) > 6)) { const g = findGarden(b); if (g) gardens.push(g); }
    for (const g of gardens) for (let k = g.beds.length - 1; k >= 0; k--) {
      const q = g.beds[k], gr = groundOf(q.x, q.g); if (gr < 0 || Math.abs(gr - q.g) > 1 || Houses.list.some((o) => q.x > o.x0 - 3 && q.x < o.x0 + o.w + 3)) { g.beds.splice(k, 1); continue; }   /* землю размыло или засыпало — грядки нет */
      if (rain) q.wet = 3000; else if (q.wet > 0) q.wet -= 60;
      if (sea === 3) { if (q.st >= 2 && q.st < 6) { q.st = 0; q.t = 0; } continue; }   /* мороз: недозревшее погибло */
      if (q.st >= 2 && q.st < 6 && q.wet > 0 && (q.t += 60) >= GROW) { q.st++; q.t = 0; }
    }
  }
  /* что сейчас нужно на ближайшем огороде своего общества: собрать, вскопать, посадить, полить */
  function gardenJob(e) {
    let best = null, bs = -1e9;
    for (const g of gardens) {
      if (e.soc != null && g.soc !== e.soc) continue;
      g.beds.forEach((q, i) => {
        if (S.ents.some((o) => o !== e && o.task === 'garden' && o.job && o.job.g === g.id && o.job.i === i)) return;
        const sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1;
        const act = q.st === 6 ? 'harvest' : sea === 3 ? null : q.st === 0 ? 'hoe' : q.st === 1 ? 'plant' : q.wet <= 600 ? 'water' : null;
        if (!act) return;
        const sc = { harvest: 40, plant: 25, hoe: 20, water: 15 }[act] - Math.abs(q.x - e.x) * .1;
        if (Math.abs(q.x - e.x) < 140 && sc > bs) { bs = sc; best = { g: g.id, i, act, x: q.x, crop: q.crop }; }
      });
    }
    return best;
  }
  function bedOf(job) { const g = job && gardens.find((o) => o.id === job.g); return g ? g.beds[job.i] || null : null; }
  /* сделать дело на грядке; для сбора — что собрали */
  function bedDo(job) {
    const q = bedOf(job); if (!q) return null;
    if (job.act === 'hoe' && q.st === 0) q.st = 1;
    else if (job.act === 'plant' && q.st === 1) { q.st = 2; q.t = 0; q.wet = Math.max(q.wet, 600); }
    else if (job.act === 'water') q.wet = 3600;
    else if (job.act === 'harvest' && q.st === 6) { q.st = 0; q.t = 0; const c = q.crop; q.crop = CROPS[(CROPS.indexOf(c) + 1 + ((Math.random() * 3) | 0)) % CROPS.length]; return c; }
    return null;
  }

  /* ---------- птицы в небе и стрелы охотников ---------- */
  const birds = [], arrows = [];
  let birdId = 1;
  function skyTop(x) { for (let y = 3; y < S.H - 1; y++) { const t = S.A.type[y * S.W + x]; if (t !== E.AIR && KIND[t] !== K.GAS) return y; } return S.H - 1; }
  function birdsStep() {
    const tod = S.tod === undefined ? .4 : S.tod, sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1;
    if (tod > .27 && tod < .72 && sea !== 3 && birds.filter((b) => !b.dead).length < 4 && Math.random() < 1 / 700) {
      const dir = Math.random() < .5 ? 1 : -1, x = dir > 0 ? 1 : S.W - 2, top = Math.min(skyTop(x), skyTop(Math.floor(S.W / 2))), n = 1 + ((Math.random() * 3) | 0), y0 = Math.max(4, top - 22 - Math.random() * 18), sp = .22 + Math.random() * .14;
      for (let k = 0; k < n; k++) birds.push({ id: birdId++, x: x - dir * k * 4, y: y0 + (k & 1) * 2, vx: dir * sp, ph: Math.random() * 6, dead: false, ground: false, t: 0 });
    }
    for (let k = birds.length - 1; k >= 0; k--) {
      const b = birds[k];
      if (!b.dead) {
        b.x += b.vx; b.ph += .35; b.y += Math.sin(b.ph * .18) * .04;
        const cx = Math.floor(b.x), cy = Math.floor(b.y); if (cx > 0 && cx < S.W - 1 && cy > 1) { const t = S.A.type[cy * S.W + cx]; if (t !== E.AIR && KIND[t] !== K.GAS) b.y -= 1.5; }   /* облетает препятствие сверху */
        if (b.x < -6 || b.x > S.W + 6) birds.splice(k, 1);
        continue;
      }
      if (!b.ground) {   /* подбитая птица падает, кувыркаясь */
        b.vy = Math.min(1.4, (b.vy || 0) + .06); b.x += b.vx; b.vx *= .97; b.y += b.vy;
        const cx = Math.max(1, Math.min(S.W - 2, Math.floor(b.x))), cy = Math.floor(b.y + 1);
        if (cy >= S.H - 2) { birds.splice(k, 1); continue; }
        const t = S.A.type[cy * S.W + cx]; if (t !== E.AIR && KIND[t] !== K.GAS) { if (KIND[t] === K.LIQUID) { birds.splice(k, 1); continue; } b.ground = true; b.y = cy - .2; }
      } else if (++b.t > 4000) birds.splice(k, 1);
    }
    for (let k = arrows.length - 1; k >= 0; k--) {
      const a = arrows[k];
      if (a.stuck) { if (++a.stuck > 300) arrows.splice(k, 1); continue; }
      a.x += a.vx; a.y += a.vy; a.vy += .03;
      for (const b of birds) if (!b.dead && Math.abs(b.x - a.x) < 1.6 && Math.abs(b.y - a.y) < 1.4) { b.dead = true; b.vx *= .4; b.vy = -.2; a.hit = b.id; const sh = byIdEnt(a.by); if (sh) sh.birdHit = b.id; }
      if (a.hit) { arrows.splice(k, 1); continue; }
      const cx = Math.floor(a.x), cy = Math.floor(a.y);
      if (cx < 1 || cx >= S.W - 1 || cy >= S.H - 1 || a.y < -20) { arrows.splice(k, 1); continue; }
      if (cy > 0) { const t = S.A.type[cy * S.W + cx]; if (t !== E.AIR && KIND[t] !== K.GAS) a.stuck = 1; }
    }
  }
  const byIdEnt = (id) => S.ents.find((o) => o.id === id) || null;
  function birdNear(x, maxD) { let best = null, bd = maxD || 70; for (const b of birds) { if (b.dead) continue; const d = Math.abs(b.x - x); if (d < bd) { bd = d; best = b; } } return best; }
  const birdById = (id) => birds.find((b) => b.id === id) || null;
  function takeBird(b) { const k = birds.indexOf(b); if (k >= 0) birds.splice(k, 1); }
  /* выстрел: стрела летит к упреждённой точке, с разбросом — попадает примерно через раз */
  function shoot(e, b) {
    const sx = e.x, sy = e.y - 7, sp = 1.9, dist = Math.hypot(b.x - sx, b.y - sy), t = dist / sp, tx = b.x + b.vx * t + (Math.random() - .5) * 3.2, ty = b.y + .5 * .03 * t * t * 0 + (Math.random() - .5) * 2.4;
    const dx = tx - sx, dy = ty - sy - .5 * .03 * t * t, d = Math.hypot(dx, dy) || 1;
    arrows.push({ x: sx, y: sy, vx: dx / d * sp, vy: dy / d * sp, by: e.id });
    if (S.sfx) S.sfx('tap', .25);
  }
  /* где рыбачить: край готового причала поближе */
  function fishSpot(e) {
    let best = null, bd = 150;
    for (const o of docks) { if (!o.done) continue; const k = (Math.random() * 4) | 0, x = deckX(o, o.len - 2 - k), d = Math.abs(x - e.x); if (d < bd) { bd = d; best = { x: x + .5, wx: deckX(o, o.len + 2), dock: o, edge: k === 0 }; } }
    return best;
  }
  function clear() { mines.length = 0; docks.length = 0; rods.length = 0; gardens.length = 0; birds.length = 0; arrows.length = 0; ver++; }
  /* ---------- рисование ---------- */
  const draw1 = (c, k, x, y, flip) => { const im = img(k); if (!im || !im.complete || !im.width) return null; if (flip) { c.save(); c.translate(Math.round(x) + im.width, Math.round(y)); c.scale(-1, 1); c.drawImage(im, 0, 0); c.restore(); } else c.drawImage(im, Math.round(x), Math.round(y)); return im; };
  /* за миром (слой домов): балки и фонари в шахте, сваи причала, рама входа, ворот, вагонетка */
  function drawBg(c, T) {
    for (const m of mines) {
      m.steps.forEach(([x, y], k) => {
        if (k % 5 === 2) { const im = img('mine_beam'); if (im && im.width) draw1(c, 'mine_beam', x * 2 + 1 - im.width / 2, (y + 1) * 2 - im.height); }
        if (k % 7 === 5) { const im = img('mine_lamp'); if (im && im.width) draw1(c, 'mine_lamp', x * 2 - 3, (y - 12) * 2); }
      });
      const gx = m.x0 * 2, gy = m.g * 2;
      const gi = img('mine_gate'); if (gi && gi.width) draw1(c, 'mine_gate', gx - gi.width / 2 + m.dir * 6, gy - gi.height + 2);
      /* ворот и вагонетка — только на твёрдой земле у входа (не над водой и не в воздухе) */
      const ground = (px) => { const cx = Math.max(0, Math.min(S.W - 1, Math.round(px / 2))); for (let y = Math.max(2, m.g - 8); y < Math.min(S.H - 1, m.g + 8); y++) { const t = S.A.type[y * S.W + cx]; if (t === E.AIR || KIND[t] === K.GAS) continue; return solid(y * S.W + cx) ? y * 2 : -1; } return -1; };
      const cr = img('mine_crane'), crx = gx - m.dir * 26, cry = cr && cr.width ? ground(crx) : -1; if (cry > 0) draw1(c, 'mine_crane', crx - cr.width / 2, cry - cr.height + 1, m.dir < 0);
      const ck = m.steps.length > 20 ? 'cart_gold' : 'cart', ct = img(ck), ctx = gx - m.dir * 44, cty = ct && ct.width ? ground(ctx) : -1; if (cty > 0) draw1(c, ck, ctx - ct.width / 2, cty - ct.height + 1);
    }
    for (const o of docks) {
      /* сваи до дна */
      for (let q = 0; q < o.placed; q += 6) {
        const x = deckX(o, q) * 2; let yb = o.y + 1; while (yb < S.H - 1 && !solid(yb * S.W + Math.floor(x / 2))) yb++;
        c.fillStyle = '#2a170e'; c.fillRect(x - 2, o.y * 2 + 2, 4, (yb - o.y) * 2 - 2); c.fillStyle = '#6a4226'; c.fillRect(x - 1, o.y * 2 + 2, 2, (yb - o.y) * 2 - 2);
      }
    }
  }
  /* перед людьми не нужно, но настил и перила — поверх клеток (слой людей до человечков) */
  function drawFg(c, T, amb) {
    const br = amb ? (amb[0] + amb[1] + amb[2]) / 3 : 1; if (br < .97) c.filter = 'brightness(' + br.toFixed(2) + ')';
    /* огороды: грядки по стадиям; поленница общества у огорода (растёт с запасом дров) */
    for (const g of gardens) {
      for (const q of g.beds) { const k = STG(q.crop)[q.st], im = img(k); if (im && im.width) { if (q.wet > 0 && q.st >= 1 && q.st < 6) c.filter = (c.filter && c.filter !== 'none' ? c.filter + ' ' : '') + 'saturate(1.15)'; draw1(c, k, q.x * 2 + 1 - im.width / 2, q.g * 2 + 2 - im.height); if (q.wet > 0) c.filter = br < .97 ? 'brightness(' + br.toFixed(2) + ')' : 'none'; } }
      if (g.wx != null && typeof Town !== 'undefined') {
        const s = Town.byId(g.soc), w = s ? s.wood || 0 : 0, k = w >= 30 ? 'woodshed' : w >= 3 ? 'woodpile' : null, im = k && img(k);
        if (im && im.width) { const gy = groundOf(g.wx, g.beds[0] ? g.beds[0].g : 0); if (gy > 0) draw1(c, k, g.wx * 2 - im.width / 2, gy * 2 + 2 - im.height, g.side < 0); }
      }
    }
    /* птицы: тёмный силуэт, крылья вверх-вниз; подбитая падает и лежит */
    for (const b of birds) {
      const x = Math.round(b.x * 2), y = Math.round(b.y * 2), d = b.vx < 0 ? -1 : 1, up = !b.dead && Math.sin(b.ph) > 0;
      c.fillStyle = '#2a2026';
      if (b.dead) { c.fillRect(x - 2, y, 5, 2); c.fillStyle = '#7a5a44'; c.fillRect(x - 1, y, 3, 1); c.fillStyle = '#c8a070'; c.fillRect(x + d * 2, y + 1, 1, 1); continue; }
      c.fillRect(x - 1, y, 4, 2); c.fillRect(x + (d > 0 ? 3 : -2), y, 1, 1);   /* тело, голова */
      if (up) { c.fillRect(x - 2, y - 2, 2, 2); c.fillRect(x + 1, y - 2, 2, 2); } else { c.fillRect(x - 3, y + 1, 2, 1); c.fillRect(x + 2, y + 1, 2, 1); }
      c.fillStyle = '#e0a040'; c.fillRect(x + (d > 0 ? 4 : -3), y, 1, 1);   /* клюв */
    }
    /* стрелы: древко, наконечник, оперение */
    for (const a of arrows) {
      const L = Math.hypot(a.vx, a.vy) || 1, ux = a.vx / L, uy = a.vy / L, x = a.x * 2, y = a.y * 2;
      c.fillStyle = '#7a5030'; for (let k = 0; k < 6; k++) c.fillRect(Math.round(x - ux * k), Math.round(y - uy * k), 1, 1);
      c.fillStyle = '#c8ccd4'; c.fillRect(Math.round(x + ux), Math.round(y + uy), 1, 1); c.fillStyle = '#f0f0f0'; c.fillRect(Math.round(x - ux * 6), Math.round(y - uy * 6), 1, 1);
    }
    /* лавочки: спинка из двух реек на стойках, сиденье из досок, чугунные ножки и подлокотники (позади сидящих) */
    for (const s of benches()) {
      const X = Math.round(s.x * 2), fy = s.g * 2, o = '#2a1810', w = '#9a6a3a', hi = '#c8925a', sh = '#6a4426', ir = '#3a3038', irh = '#5a4e58';
      const rect = (x, y, ww, hh, c) => { c2.fillStyle = c; c2.fillRect(x, y, ww, hh); };
      const c2 = c, L = X - 17, R = X + 16;
      /* стойки спинки */
      rect(L + 1, fy - 15, 3, 11, o); rect(R - 3, fy - 15, 3, 11, o); rect(L + 2, fy - 14, 1, 9, ir); rect(R - 2, fy - 14, 1, 9, ir);
      /* рейки спинки */
      for (const y of [fy - 14, fy - 10]) { rect(L + 1, y - 1, R - L - 1, 4, o); rect(L + 2, y, R - L - 3, 2, w); rect(L + 2, y, R - L - 3, 1, hi); }
      /* сиденье */
      rect(L, fy - 6, R - L + 1, 4, o); rect(L + 1, fy - 5, R - L - 1, 1, hi); rect(L + 1, fy - 4, R - L - 1, 1, sh);
      for (let x = L + 4; x < R - 2; x += 5) rect(x, fy - 5, 1, 2, sh);   /* стыки досок */
      /* подлокотники */
      rect(L - 1, fy - 9, 4, 2, o); rect(R - 2, fy - 9, 4, 2, o); rect(L, fy - 9, 2, 1, irh); rect(R - 1, fy - 9, 2, 1, irh);
      /* ножки */
      rect(L + 1, fy - 3, 3, 3, o); rect(R - 3, fy - 3, 3, 3, o); rect(L + 2, fy - 3, 1, 2, irh); rect(R - 2, fy - 3, 1, 2, irh);
    }
    for (const r of rods) {
      const x = r.x * 2, yt = (r.g - ROD_H) * 2;
      for (let y = r.g - ROD_H; y < r.g; y++) if (S.A.type[y * S.W + r.x] === E.METAL) { c.fillStyle = '#20161e'; c.fillRect(x - 1, y * 2, 4, 2); c.fillStyle = (y & 1) ? '#8a9098' : '#a8b0b8'; c.fillRect(x, y * 2, 2, 2); c.fillStyle = '#d8dee4'; c.fillRect(x, y * 2, 1, 2); }
      c.fillStyle = '#20161e'; c.fillRect(x - 1, yt - 7, 4, 8); c.fillStyle = r.hit > 0 ? '#fff6c8' : '#e8c060'; c.fillRect(x, yt - 6, 2, 6); c.fillRect(x - 2, yt - 2, 6, 1);
      c.fillStyle = '#5a4a40'; for (let k = 1; k < 10; k++) { c.fillRect(x - k * 1.4 | 0, yt + 8 + k * 2, 1, 1); c.fillRect(x + 1 + k * 1.4 | 0, yt + 8 + k * 2, 1, 1); }
      c.fillStyle = '#7a5a2a'; c.fillRect(x - 4, r.g * 2 - 1, 10, 2);
    }
    for (const o of docks) {
      const deck = img('dock_deck');
      for (let q = 0; q < o.placed; q++) {
        const x = deckX(o, q), i = o.y * S.W + x; if (S.A.type[i] !== E.WOOD) continue;
        if (deck && deck.width) c.drawImage(deck, (x * 2) % (deck.width - 4), 0, 2, Math.min(6, deck.height), x * 2, o.y * 2 - 1, 2, Math.min(6, deck.height));
      }
      if (!o.done) continue;
      /* перила: столбики и провисающая верёвка */
      const xa = deckX(o, 0) * 2, xb = deckX(o, o.len - 1) * 2, y0 = o.y * 2 - 10;
      for (let x = Math.min(xa, xb); x <= Math.max(xa, xb); x += 12) { c.fillStyle = '#2a170e'; c.fillRect(x - 1, y0, 3, 10); c.fillStyle = '#8a5a32'; c.fillRect(x, y0 + 1, 1, 8); }
      c.fillStyle = '#c8a46a'; for (let x = Math.min(xa, xb); x < Math.max(xa, xb); x++) { const ph = ((x - Math.min(xa, xb)) % 12) / 12; c.fillRect(x, y0 + 2 + Math.round(Math.sin(ph * Math.PI) * 2), 1, 1); }
      const endX = deckX(o, o.len - 1) * 2;
      draw1(c, 'anchor', endX - o.dir * 10 - 7, o.y * 2 - 19);
      draw1(c, 'barrels', deckX(o, 1) * 2 - (o.dir > 0 ? 0 : 34), o.y * 2 - 18);
      const by = img('buoy'); if (by && by.width) draw1(c, 'buoy', endX + o.dir * 14 - 5, (o.y + 2) * 2 - by.height + 4 + Math.round(Math.sin(T / 20 + o.id) * 1.5));
    }
    c.filter = 'none';
  }
  /* свет фонарей в шахтах ночью */
  function lights(fn, night) { for (const r of rods) if (r.hit > 0) fn(r.x, r.g - ROD_H, 1.6 * r.hit / 30, 1.5 * r.hit / 30, 1 * r.hit / 30); if (night < .05) return; for (const m of mines) m.steps.forEach(([x, y], k) => { if (k % 7 === 5) fn(x, y - 10, .8 * night, .6 * night, .3 * night); }); for (const m of mines) fn(m.x0 + m.dir * 3, m.g - 10, .6 * night, .45 * night, .2 * night); }
  return { gardens, gardenJob, bedOf, bedDo, CROP_RU, birds, birdNear, birdById, takeBird, shoot, mines, docks, rods, benches, benchNear, rodSite, buildRod, rodFor, mineNear, newMine, addStep, findShore, newDock, buildDock, fishSpot, step, clear, drawBg, drawFg, lights, get ver() { return ver; } };
})();
