'use strict';
/* ПИКСЕЛИЯ — жизнь человечков: имена, возраст, дети, занятия и отношения.
   Работает поверх ядра: вызывается из stepEnts для людей (не зомби). Человечек сам выбирает занятие по времени суток, возрасту и окружению:
   гуляет, отдыхает, спит (ночью, лучше дома), разжигает костёр и греется у него, рубит деревья (дерево падает само), рыбачит, строит дом,
   болтает с другими, влюбляется, заводит детей; дети играют и ходят за родителями, пожилые медленнее. Текущее занятие видно в карточке. */
const Life = (function () {
  const MN = ['Иван', 'Пётр', 'Алёша', 'Миша', 'Саша', 'Дима', 'Гена', 'Лёва', 'Костя', 'Тимур', 'Фёдор', 'Борис', 'Макс', 'Рома', 'Егор', 'Стёпа', 'Влад', 'Тоша'];
  const FN = ['Маша', 'Аня', 'Катя', 'Лена', 'Оля', 'Даша', 'Соня', 'Вера', 'Нина', 'Юля', 'Ира', 'Зоя', 'Рита', 'Лиза', 'Надя', 'Мила', 'Тася', 'Алиса'];
  const FEMFORM = { dress: 1, tail: 1, granny: 1 };
  const AGE_STEP = 1 / 1800;   /* год жизни = 30 секунд */
  let nextId = 1, S = null;
  const rr = (n) => S.rn(n), rf = () => S.rnd();
  const ageScale = (a) => a >= 16 ? 1 : Math.max(.58, .58 + .42 * (a - 2) / 14);
  const stageOf = (a) => a < 4 ? 'малыш' : a < 14 ? 'ребёнок' : a < 20 ? 'подросток' : a < 62 ? 'взрослый' : 'пожилой';
  const yearsWord = (n) => { const m = n % 100, d = n % 10; return (m > 10 && m < 15) ? 'лет' : d === 1 ? 'год' : (d >= 2 && d <= 4) ? 'года' : 'лет'; };
  const sgn = (v) => v < 0 ? -1 : 1;
  const byId = (id) => { if (id == null) return null; const L = S.ents; for (let i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; };
  const alive = (o) => o && !o.dying && !o.z;
  const CAUSE = { slain: 'убит в бою', burn: 'сгорел', drown: 'утонул', fall: 'разбился при падении', crush: 'раздавлен', blast: 'погиб от взрыва', shock: 'убит током', melt: 'растворился в кислоте', freeze: 'замёрз', old: 'умер от старости' };
  const emote = (e, k, t) => { e.emo = { k, t: t || 90 }; };
  /* причина смерти в женском роде: сгорел → сгорела, разбился → разбилась, убит → убита */
  const femWhy = (e, w) => !e.fem ? w : w.replace(/погиб(?=\s|$)/g, 'погибла').replace(/ился(?=\s|$)/g, 'илась').replace(/(ел|ул|ер|ёрз)(?=\s|$)/g, (m) => m === 'ёрз' ? 'ёрзла' : m === 'ер' ? 'ерла' : m + 'а').replace(/(ен|ит)(?=\s|$)/g, '$1а');

  /* ---------- создание ---------- */
  function init(e, x) {
    S = S || Sim; x = x || {};
    e.id = nextId++;
    const form = e.form || 'ref';
    e.fem = x.fem !== undefined ? !!x.fem : (FEMFORM[form] ? true : rf() < .5);
    e.name = x.name || (e.fem ? FN : MN)[rr(18)];
    e.age = x.age !== undefined ? x.age : (form === 'elder' || form === 'granny' ? 66 + rf() * 16 : x.kid ? 4 + rf() * 7 : 19 + rf() * 36);
    e.rel = {}; e.mate = null; e.mst = 0; e.par = x.par == null ? null : x.par; e.task = null; e.txt = 'Осматривается'; e.tt = 0; e.goal = null; e.sleep = 0; e.t2 = 0; e.chatWith = null; e.emo = null;
    e.spdk = 1; e.cha = rf(); e.money = rr(6); e.prof = null; e.soc = null; e.home = null; e.fin = null; e.nav = null; e.doorT = 0;
  }
  function describe(e) {
    const a = Math.floor(e.age || 0), mate = byId(e.mate), par = byId(e.par);
    if (e.dying && !e.z) {
      const l = [a + ' ' + yearsWord(a) + (e.fem ? ', она' : ', он'), (e.fem ? 'Погибла: ' : 'Погиб: ') + femWhy(e, e.why || CAUSE[e.dying] || '—')];
      if (e.dead) { const c = byId(e.claim); l.push(c && alive(c) && c.bt === e.id ? 'Его хоронит ' + c.name : (e.dying === 'drown' || e.sub > 2) ? 'Тело в воде' : 'Тело ждёт похорон'); }
      return l;
    }
    let st = e.txt; if (e.burn > 0) st = 'Горит!'; else if (e.swim) st = 'Плывёт'; else if (e.stun > 0 && !e.sleep) st = 'Ошеломлён';
    const lines = [a + ' ' + yearsWord(a) + ' · ' + stageOf(e.age) + (e.fem ? ', она' : ', он')];
    lines.push('Занятие: ' + (e.dying ? 'умирает' : e.z ? 'Зомби: ищет живых' : st || '—'));
    if (typeof Town !== 'undefined' && e.prof) lines.push((Town.PROF[e.prof] || Town.PROF.none).n + ' · ' + (e.money | 0) + ' мон.');
    if (mate) lines.push((e.mst === 2 ? (e.fem ? 'Замужем за ' : 'Женат на ') : 'Встречается с ') + mate.name); else if (par) lines.push('Родитель: ' + par.name);
    let fr = 0; for (const k in e.rel) if (e.rel[k] >= 2) fr++; if (fr) lines.push('Друзей: ' + fr);
    return lines;
  }

  /* ---------- мир вокруг ---------- */
  const solidAt = (i) => { const t = S.A.type[i]; return t !== E.AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER); };
  function nearTree(e) {
    const A = S.A, W = S.W, fy = Math.round(e.y); let best = null, bd = 1e9;
    for (let dx = -60; dx <= 60; dx++) {
      const x = Math.floor(e.x) + dx; if (x < 2 || x >= W - 2 || Math.abs(dx) < 3 || Math.abs(dx) >= bd) continue;
      for (let y = fy - 3; y <= fy + 2; y++) {
        const i = y * W + x;
        if (A.type[i] === E.WOOD && A.aux[i] !== 0 && A.burn[i] === 0 && solidAt(i + W) && !(A.type[i + W] === E.WOOD && A.aux[i + W] !== 0)) { if (fireAround(x, y)[0] + fireAround(x, y)[1] > 2) break; best = { x, y }; bd = Math.abs(dx); break; }
      }
    }
    return best;
  }
  function nearWater(e) {
    const A = S.A, W = S.W, fy = Math.round(e.y); let best = null, bd = 1e9;
    for (let dx = -50; dx <= 50; dx++) {
      const x = Math.floor(e.x) + dx; if (x < 4 || x >= W - 4 || Math.abs(dx) < 4 || Math.abs(dx) >= bd) continue;
      for (let y = fy - 3; y <= fy + 3; y++) { const i = y * W + x; if (A.type[i] === E.WATER && A.type[i - W] === E.AIR) { best = { x: x - sgn(dx) * 2, wx: x }; bd = Math.abs(dx); break; } }
    }
    return best;
  }
  function flatSite(e) {
    const A = S.A, W = S.W, fy = Math.round(e.y);
    for (const off of [14, -23, 22, -31, 30]) {
      const x0 = Math.floor(e.x) + off; if (x0 < 3 || x0 + 9 >= W - 3) continue;
      let g = -1, ok = true;
      for (let k = 0; k < 9 && ok; k++) {
        let gy = -1; for (let y = fy - 4; y <= fy + 5; y++) if (solidAt(y * W + x0 + k)) { gy = y; break; }
        if (gy < 0 || (g >= 0 && gy !== g)) ok = false; else g = gy;
        for (let y = g - 15; y < g && ok; y++) { if (y < 2 || A.type[y * W + x0 + k] !== E.AIR) ok = false; }
      }
      if (ok) return { x0, g };
    }
    return null;
  }
  const homeNear = (e) => S.homes.find((h) => Math.abs(h.x - e.x) < 90);
  const campNear = (e) => S.camps.find((c) => Math.abs(c.x - e.x) < 70);
  /* ближайшее непогребённое тело, за которое ещё никто не взялся */
  function corpseNear(e) {
    let best = null, bd = 110;
    for (const o of S.ents) {
      if (!o.dead || o.z || o.sub > 2) continue;
      const c = byId(o.claim); if (c && alive(c) && c.task === 'bury' && c.bt === o.id) continue;
      const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y); if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  /* могила: холмик земли и деревянный крест; тело убирается */
  function bury(e, c) {
    const W = S.W, gx = Math.floor(c.x), gy = Math.round(c.y), A = S.A;
    S.ents.splice(S.ents.indexOf(c), 1);
    const at = (x, y, t) => { if (x < 2 || x >= W - 2 || y < 2) return; const i = y * W + x; if (A.type[i] === E.AIR) S.put(i, t); };
    for (let dx = -1; dx <= 1; dx++) at(gx + dx, gy, E.EARTH);
    at(gx, gy - 1, E.EARTH);
    for (let k = 2; k <= 5; k++) at(gx, gy - k, E.WOOD);
    at(gx - 1, gy - 4, E.WOOD); at(gx + 1, gy - 4, E.WOOD);
    S.graves.push({ x: gx, y: gy, name: c.name });
    if (S.sfx) S.sfx('pop', .6);
    emote(e, 'cry', 160); e.txt = 'Похоронил ' + c.name;
    for (const o of S.ents) if (o !== e && alive(o) && Math.abs(o.x - gx) < 20) { emote(o, 'cry', 120); if (o.fear > 0) o.fear = 0; }
  }
  /* смерть рядом: родные горюют, остальные пугаются */
  function onDeath(e, sim) {
    S = sim; if (e.z) return;
    e.txt = ''; e.task = null; e.chatWith = null;
    if (typeof Town !== 'undefined' && e.name) Town.note(e.name + (e.fem ? ' погибла: ' : ' погиб: ') + femWhy(e, e.why || CAUSE[e.dying] || '—'), Town.byId(e.soc));
    for (const o of S.ents) {
      if (o === e || !alive(o)) continue;
      const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y) * .5; if (d > 70) continue;
      const kin = o.mate === e.id || o.par === e.id || e.par === o.id || (o.rel[e.id] || 0) >= 2;
      if (o.mate === e.id) { o.mate = null; o.mst = 0; }
      if (kin) { start(o, 'mourn', 'Горюет по ' + e.name, 380 + rr(220), e.x + (o.x < e.x ? -3 : 3)); o.mourn = e.id; o.sleep = 0; emote(o, 'cry', 220); }
      else if (!o.sleep) { emote(o, 'alert', 90); o.fear = Math.max(o.fear || 0, 16); }
    }
  }
  /* разбудить: облили водой, огонь, удар, шум */
  function wake(e, why) {
    if (!e.sleep) return false;
    e.sleep = 0; e.task = null; e.tt = 0; e.goal = null; e.phase = null; e.txt = why; e.stun = Math.max(e.stun || 0, 26); e.hurt = Math.max(e.hurt || 0, 12); e.act = null;
    emote(e, 'alert', 110); return true;
  }
  /* любовь: пары складываются, только когда в мире есть дом. Встречаются -> ссорятся, мирятся, изменяют -> женятся -> появляются дети */
  function romance(e, p) {
    if (e.age < 18 || p.age < 18 || e.fem === p.fem || !S.homes.length) return;
    const r = e.rel[p.id] || 0;
    if (!e.mate && !p.mate) {
      if (r >= 3 && rf() < .6) { e.mate = p.id; p.mate = e.id; e.mst = p.mst = 1; emote(e, 'heart', 170); emote(p, 'heart', 170); }
      else if (r >= 2 && rf() < .35) { emote(e, 'heart', 70); emote(p, 'heart', 70); }
    } else if (e.mate !== p.id && r >= 2 && rf() < .25) cheat(e, p);
  }
  function cheat(e, p) {
    emote(e, 'heart', 110); emote(p, 'heart', 110);
    for (const [who, other] of [[e, p], [p, e]]) {
      const m = byId(who.mate); if (!m || !alive(m) || m === other || Math.abs(m.x - who.x) > 70 || rf() > .75) continue;
      /* партнёр застукал: разрыв, обида */
      emote(m, 'broken', 240); emote(who, 'alert', 130); emote(other, 'alert', 130);
      who.mate = null; m.mate = null; who.mst = m.mst = 0; m.rel[who.id] = -3; who.rel[m.id] = -3;
      start(m, 'sulk', 'Обижен на ' + who.name, 420 + rr(200)); m.sulk = who.id;
    }
  }
  function quarrel(e) {
    const p = byId(e.mate); if (!alive(p)) return;
    emote(e, 'angry', 130); emote(p, 'angry', 130);
    e.rel[p.id] = (e.rel[p.id] || 0) - 2; p.rel[e.id] = (p.rel[e.id] || 0) - 2;
    start(e, 'quarrel', 'Ссорится с ' + p.name, 150); start(p, 'quarrel', 'Ссорится с ' + e.name, 150); e.qw = p.id; p.qw = e.id;
    if ((e.rel[p.id] || 0) < 0) { e.mate = p.mate = null; e.mst = p.mst = 0; e.qw = null; p.qw = null; emote(e, 'broken', 220); emote(p, 'broken', 220); }
  }
  function marry(e, p) {
    e.mst = p.mst = 2; e.txt = 'Женится'; emote(e, 'heart', 280); emote(p, 'heart', 280);
    if (typeof Town !== 'undefined') Town.note(e.name + ' и ' + p.name + ' поженились', Town.byId(e.soc));
    if (S.sfx) S.sfx('ok', .6);
    for (const o of S.ents) if (o !== e && o !== p && alive(o) && Math.abs(o.x - e.x) < 40) emote(o, 'note', 150);
  }
  function someoneNear(e, r) {
    let best = null, bd = r;
    for (const o of S.ents) { if (o === e || !alive(o) || o.sleep || o.task === 'chat' || o.fear > 0) continue; const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y) * .5; if (d < bd) { bd = d; best = o; } }
    return best;
  }

  /* ---------- дома и общества: маршрут через двери, комнаты, работа (houses.js, town.js) ---------- */
  const HAS = () => typeof Houses !== 'undefined' && typeof Town !== 'undefined';
  function freeAt(x, y) { const W = S.W; for (let k = 0; k < 12; k++) { const t = S.A.type[(y - k) * W + x]; if (t !== E.AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER)) return false; } return true; }
  function navTo(e, b, f, x) { e.nav = { b: b.id, f, x }; e.goal = x; e.phase = 'go'; }
  /* где встать в комнате: в первой комнате многоэтажного дома слева дверь */
  function roomSpot(b, r, bed) { const x0 = Houses.roomX(b, r.i), door = b.nf > 1 && r.i === 0; if (bed) return x0 + (door ? 17 : 7); return x0 + (door ? 12 : 4) + rf() * (Houses.RW - (door ? 15 : 8)); }
  function goRoom(e, pl, id, txt, tt, dur, bed) { start(e, id, txt, tt); navTo(e, pl.b, pl.r.f, roomSpot(pl.b, pl.r, bed)); e.dur = dur; e.room = { b: pl.b.id, ri: pl.ri }; }
  /* шаг по маршруту: если нужный этаж другой — идёт к двери в задней стене и выходит из двери на нужном этаже.
     true — движение на этот такт уже задано */
  function navStep(e) {
    if (!HAS()) return false;
    if (!e.nav && e.goal != null) { const w = Houses.where(e); if (w && w.f > 0 && (e.goal < w.b.x0 || e.goal > w.b.x0 + w.b.w)) e.nav = { b: w.b.id, f: 0, x: e.goal }; }
    if (!e.nav) return false;
    const b = Houses.byId(e.nav.b); if (!b || !b.done || b.ruin) { e.nav = null; return false; }
    const cf = Houses.floorOf(b, e), cur = cf < 0 ? 0 : cf;
    if (cur === e.nav.f) { e.goal = e.nav.x; return false; }
    const dx = Houses.doorX(b) + .5;
    if (Math.abs(dx - e.x) < .9) {
      const ty = Houses.standY(b, e.nav.f);
      if (!freeAt(Math.floor(dx), ty)) { e.nav = null; e.goal = null; e.tt = 0; return true; }
      Houses.useDoor(b, cur, e.nav.f); e.x = dx; e.y = ty; e.vy = 0; e.fy = 0; e.doorT = 16; e.goal = e.nav.x; e.idle = 1;
      return true;
    }
    e.dir = sgn(dx - e.x); e.idle = 0; return true;
  }
  /* камень у поверхности для каменщика */
  function nearStone(e) {
    const A = S.A, W = S.W, fy = Math.round(e.y); let best = null, bd = 1e9;
    for (let dx = -60; dx <= 60; dx++) {
      const x = Math.floor(e.x) + dx; if (x < 3 || x >= W - 3 || Math.abs(dx) < 2 || Math.abs(dx) >= bd) continue;
      for (let y = fy - 4; y <= fy + 2; y++) { const i = y * W + x; if (A.type[i] === E.STONE && A.type[i - W] === E.AIR) { best = { x, y }; bd = Math.abs(dx); break; } }
    }
    return best;
  }
  const ROOM_EMO = { preach: 'note', study: 'ask', craft: 'spark', serve: 'meat', pray: 'spark', read: 'ask', drink: 'note', learn: 'ask', shelter: 'talk' };
  const sameRoom = (a, o) => a.room && o.room && a.room.b === o.room.b && a.room.ri === o.room.ri;

  /* ---------- занятия ---------- */
  function start(e, id, txt, tt, goal) { e.fin = null; e.nav = null; e.dur = 0; e.bc = null; e.done = false; e.task = id; e.txt = txt; e.tt = tt; e.goal = goal == null ? null : goal; e.phase = goal == null ? 'do' : 'go'; e.sleep = 0; e.idle = 0; }
  function pick(e) {
    const tod = S.tod === undefined ? .4 : S.tod, night = tod > .85 || tod < .2, dusk = tod > .7 && tod <= .85, kid = e.age < 14, elder = e.age >= 62;
    const hx = Math.floor(e.x);
    if (night && HAS()) { const hh = Town.homeOf(e); if (hh) { goRoom(e, { b: hh.b, r: hh.r, ri: e.home.r }, 'sleep', 'Идёт домой спать', 99999, 99999, true); return; } }
    if (night) { const h = homeNear(e); start(e, 'sleep', h ? 'Идёт домой спать' : 'Устраивается спать', 99999, h ? h.x : null); return; }
    if (kid) {
      const par = byId(e.par), r = rf();
      if (HAS() && e.age >= 6 && tod < .65 && r < .3) { const pl = Town.place(e, 'library'); if (pl) { goRoom(e, pl, 'learn', 'Учится в библиотеке', 1200, 360 + rr(200)); e.fin = () => { e.smart = (e.smart || 0) + 1; }; return; } }
      if (par && alive(par) && r < .45) { start(e, 'follow', 'Идёт за ' + par.name, 200 + rr(200)); return; }
      if (r < .85) { start(e, 'play', 'Играет', 160 + rr(200)); return; }
      start(e, 'rest', 'Отдыхает', 120 + rr(120)); return;
    }
    const mate = byId(e.mate), opts = [['wander', 3], ['rest', elder ? 3 : 1.2]];
    const friend = someoneNear(e, 14); if (friend) opts.push(['chat', 2.4]);
    { const b = corpseNear(e); if (b && rf() < .6) opts.push(['bury', 12, b]); }
    if (mate && alive(mate)) { opts.push(['together', 2]); if (e.mst === 1 && S.homes.length && (e.rel[mate.id] || 0) >= 5 && rf() < .6) opts.push(['wed', 9]); }
    if (dusk) {
      const c = campNear(e), hh = hearth(e); if (hh) opts.push(['hearth', 6, hh]); if (c) opts.push(['camp', 5]); else if (!elder && (safeFire(hx + 6, Math.round(e.y)) || safeFire(hx - 6, Math.round(e.y)))) opts.push(['fire', hh ? 1 : 4]);
    } else {
      if (!elder) { const tr = nearTree(e); if (tr) { const sc = HAS() && Town.byId(e.soc), need = sc && ((sc.want && sc.wood < sc.want.wood) || sc.wood < 20); opts.push(['chop', 2.4 + (need ? 3 : 0), tr]); } }
      const wt = nearWater(e); if (wt) opts.push(['fish', e.form === 'pirate' ? 4 : 1, wt]);
      if (!HAS() && !elder && !homeNear(e) && S.homes.length < Math.max(1, Math.floor(S.ents.filter(alive).length / 3))) opts.push(['build', 1.1]);
    }
    const sea0 = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1;
    /* оружие: в опасности (зомби рядом, общество воюет) — срочно, иначе изредка; из дерева и камня общества */
    if (HAS() && typeof Combat !== 'undefined' && e.age >= 16 && !e.weapon && !elder) { const sc = Town.byId(e.soc); if (sc && sc.wood >= 3) { const dg = Combat.danger(e); if (dg || rf() < .12) opts.push(['arm', dg ? 8 : .6]); } }
    if (HAS() && e.age >= 16) {
      const pr = e.prof || 'none', st = Town.site(e);
      if (st && !elder) opts.push(['house', pr === 'builder' ? 10 : 2.2, st]);
      if (!dusk) {
        if (pr === 'mason') { const sn = nearStone(e); if (sn) opts.push(['quarry', 5, sn]); else opts.push(['work', 2]); }
        if (pr === 'trader') opts.push(['trade', 4]);
        if (pr === 'farmer' && sea0 !== 3) opts.push(['sow', 4]);
        if (pr === 'builder' && !st) opts.push(['work', 2]);
        const civ = { priest: 'church', scholar: 'library', crafter: 'workshop' }[pr]; if (civ) { const pl = Town.place(e, civ); if (pl) opts.push(['job', 7, pl, civ]); }
        if (tod > .26 && tod < .45 && pr !== 'priest') { const pl = Town.place(e, 'church'); if (pl) opts.push(['pray', 2.2, pl]); }
        { const pl = Town.place(e, 'library'); if (pl) opts.push(['read', pr === 'scholar' ? 0 : .8, pl]); }
        opts.push(['work', .7]);
      } else { const pl = Town.place(e, 'tavern'); if (pl) opts.push(pr === 'barkeep' ? ['job', 9, pl, 'tavern'] : ['drink', 4, pl]); }
    }
    /* время года и погода меняют привычки: зимой — костры, летом — купание, весной — посадки, в дождь — под крышу */
    { const sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1, wet = S.weather > 0;
      if (sea === 3 && !dusk) { const c = campNear(e), hh = hearth(e); if (hh) opts.push(['hearth', 4, hh]); if (c) opts.push(['camp', 3.5]); else if (!elder && (safeFire(hx + 6, Math.round(e.y)) || safeFire(hx - 6, Math.round(e.y)))) opts.push(['fire', hh ? .6 : 2.2]); }
      if (sea === 1 && !dusk && !wet) { const w2 = nearWater(e); if (w2) opts.push(['swim', 3.2, w2]); }
      if (sea === 0 && !dusk && !elder) opts.push(['sow', 2.6]);
      if (wet) { const hh = HAS() && Town.homeOf(e); if (hh) opts.push(['shelterH', 6, hh]); else { const hm = homeNear(e); if (hm) opts.push(['shelter', 6, hm]); } }
      for (const o of opts) { if (o[0] === 'chop' && sea === 2) o[1] *= 2.4; if (o[0] === 'fish' && sea === 3) o[1] *= .25; if (o[0] === 'chop' && e.prof === 'lumber') o[1] *= 3.5; if (o[0] === 'fish' && e.prof === 'fisher') o[1] *= 3.5; } }
    let tot = 0; for (const o of opts) tot += o[1]; let r = rf() * tot, ch = opts[0];
    for (const o of opts) { r -= o[1]; if (r <= 0) { ch = o; break; } }
    switch (ch[0]) {
      case 'wander': start(e, 'wander', elder ? 'Гуляет с тростью' : 'Гуляет', 200 + rr(300)); break;
      case 'rest': start(e, 'rest', 'Отдыхает', 150 + rr(200)); break;
      case 'chat': { const o = friend; start(e, 'chat', 'Болтает с ' + o.name, 200 + rr(120), o.x + (e.x < o.x ? -2.5 : 2.5)); e.chatWith = o.id; start(o, 'chat', 'Болтает с ' + e.name, e.tt, e.x + (o.x < e.x ? -2.5 : 2.5)); o.chatWith = e.id; emote(e, 'talk', 60); break; }
      case 'together': start(e, 'together', 'Гуляет с ' + mate.name, 260 + rr(200)); e.rel[mate.id] = (e.rel[mate.id] || 0) + .5; break;
      case 'wed': {
        const hm = S.homes.reduce((a, b) => (!a || Math.abs(b.x - e.x) < Math.abs(a.x - e.x)) ? b : a, null);
        start(e, 'wed', 'Идёт жениться', 900, hm.x + (e.fem ? -2 : 2)); e.dur = 190;
        if (mate.task !== 'wed' && alive(mate)) { start(mate, 'wed', 'Идёт жениться', 900, hm.x + (mate.fem ? -2 : 2)); mate.dur = 190; }
        break;
      }
      case 'camp': { const c = campNear(e); start(e, 'camp', 'Греется у костра', 500 + rr(400), c.x + (rf() < .5 ? -1 : 1) * (6 + rr(4))); break; }
      case 'fire': { const sd = safeFire(hx + 6, Math.round(e.y)) ? 1 : -1; start(e, 'fire', 'Разжигает костёр', 200, hx + sd * 6); e.dur = 90; break; }
      case 'hearth': goRoom(e, ch[2], 'camp', 'Греется у очага', 1200, 500 + rr(400)); break;
      case 'chop': { const tr = ch[2]; start(e, 'chop', 'Идёт рубить дерево', 700, tr.x + (e.x < tr.x ? -2 : 2)); e.tx = tr.x; e.dur = 200; break; }
      case 'fish': { const w = ch[2]; start(e, 'fish', 'Идёт на рыбалку', 900, w.x); e.dur = 420; e.wx = w.wx; break; }
      case 'swim': { const w = ch[2]; start(e, 'swim', 'Идёт купаться', 700, w.wx); e.dur = 360; break; }
      case 'sow': start(e, 'sow', 'Сажает семена', 420); break;
      case 'shelter': { const hm = ch[2]; start(e, 'shelter', 'Прячется от дождя', 600, hm.x + (rf() < .5 ? -2 : 2)); e.dur = 500; break; }
      case 'bury': { const b = ch[2]; start(e, 'bury', 'Идёт хоронить ' + b.name, 900, b.x + (e.x < b.x ? -2.5 : 2.5)); e.bt = b.id; e.dur = 160; b.claim = e.id; break; }
      case 'house': { const b = ch[2]; start(e, 'house', 'Идёт на стройку', 900, b.x0 + 3 + rf() * (b.w - 6)); e.dur = 420 + rr(200); e.bid = b.id; break; }
      case 'quarry': { const sn = ch[2]; start(e, 'quarry', 'Идёт добывать камень', 800, sn.x + (e.x < sn.x ? -2 : 2)); e.dur = 180; e.tx = sn.x; e.ty = sn.y; break; }
      case 'trade': {
        const sc = Town.byId(e.soc), m = sc ? Town.members(sc).filter((o) => o !== e) : [], o = m.length ? m[rr(m.length)] : null;
        start(e, 'trade', o ? 'Торгует с ' + o.name : 'Торгует', 700, o ? o.x + (e.x < o.x ? -3 : 3) : null); e.dur = 200;
        e.fin = () => { Town.earn(e, 5); emote(e, 'money', 90); if (o) e.rel[o.id] = (e.rel[o.id] || 0) + .3; }; break;
      }
      case 'arm': start(e, 'arm', 'Мастерит оружие', 240 + rr(120)); e.fin = () => { const w = Combat.craft(e, Town.byId(e.soc)); if (w) { emote(e, 'spark', 110); Town.note(e.name + ' сделал' + (e.fem ? 'а' : '') + ' себе ' + Combat.WEAP[w].n.toLowerCase(), Town.byId(e.soc)); } }; break;
      case 'work': start(e, 'work', 'Подрабатывает', 260 + rr(120)); e.fin = () => { Town.earn(e, 2 + rr(2)); if (rf() < .4) emote(e, 'money', 70); }; break;
      case 'job': {
        const civ = ch[3], T = { church: ['preach', 'Служит в церкви'], library: ['study', 'Работает в библиотеке'], workshop: ['craft', 'Мастерит в мастерской'], tavern: ['serve', 'Работает в таверне'] }[civ];
        goRoom(e, ch[2], T[0], T[1], 1200, 500 + rr(300)); e.fin = () => { Town.earn(e, civ === 'workshop' ? 5 : 3); emote(e, 'money', 80); }; break;
      }
      case 'pray': goRoom(e, ch[2], 'pray', 'Молится в церкви', 1200, 300 + rr(150)); e.fin = () => { for (const o of S.ents) if (o !== e && alive(o) && sameRoom(e, o) && (o.task === 'pray' || o.task === 'preach')) { e.rel[o.id] = (e.rel[o.id] || 0) + .4; if (o.task === 'preach') Town.pay(e, o, 1); } }; break;
      case 'read': goRoom(e, ch[2], 'read', 'Читает в библиотеке', 1200, 300 + rr(200)); e.fin = () => { e.smart = (e.smart || 0) + .5; }; break;
      case 'drink': goRoom(e, ch[2], 'drink', 'Отдыхает в таверне', 1200, 360 + rr(200)); e.fin = () => {
        const bk = S.ents.find((o) => alive(o) && o.task === 'serve' && sameRoom(e, o)); if (bk) Town.pay(e, bk, 2); else { const sc = Town.byId(e.soc); if (sc && (e.money || 0) >= 2) { e.money -= 2; sc.bank += 2; } }
        for (const o of S.ents) if (o !== e && alive(o) && sameRoom(e, o) && o.task === 'drink') e.rel[o.id] = (e.rel[o.id] || 0) + .6; }; break;
      case 'shelterH': { const hh = ch[2]; goRoom(e, { b: hh.b, r: hh.r, ri: e.home.r }, 'shelter', 'Пережидает дождь дома', 900, 500); break; }
      case 'build': { const s = flatSite(e); if (!s) { start(e, 'wander', 'Гуляет', 200); break; } start(e, 'build', 'Идёт строить дом', 1500, s.x0 - 2); e.site = s; e.dur = 0; break; }
    }
  }
  /* где можно развести костёр: не ближе 8 клеток к домам и без горючего рядом (дерево, листва, порох, масло, газ) */
  const FLAM = new Set([E.WOOD, E.LEAF, E.GUNP, E.OIL, E.GAS]);
  const GRASS = new Set([E.LITTER, E.SEED, E.CONE, E.FSEED, E.SPROUT, E.LEAF]);
  function safeFire(x, y) {
    if (x < 4 || x >= S.W - 4) return false;
    if (HAS() && Houses.list.some((b) => x > b.x0 - 9 && x < b.x0 + b.w + 9)) return false;
    for (let dy = -6; dy <= 1; dy++) for (let dx = -3; dx <= 3; dx++) { const i = (y + dy) * S.W + x + dx; if (FLAM.has(S.A.type[i]) && !(dy === 1)) return false; }
    /* над костром жар и искры поднимаются высоко: в 10 клетках вбок и 35 вверх не должно быть крон и стволов, иначе загорится лес */
    for (let dy = -35; dy <= -1; dy += 2) { if (y + dy < 1) break; for (let dx = -10; dx <= 10; dx += 2) { const xx = x + dx; if (xx < 1 || xx >= S.W - 1) continue; const t = S.A.type[(y + dy) * S.W + xx]; if (t === E.LEAF || t === E.WOOD) return false; } }
    return true;
  }
  /* очаг в своём доме (жилая комната на первом этаже, над которой есть ещё жильё) */
  function hearth(e) {
    if (!HAS()) return null;
    for (const b of Houses.list) { if (!b.done || b.ruin || (b.soc !== e.soc && !(e.home && e.home.b === b.id))) continue; const k = b.rooms.findIndex((r) => r.role === 'home' && r.f === 0 && b.rooms.some((q) => q.role === 'home' && q.f > 0)); if (k >= 0) return { b, r: b.rooms[k], ri: k }; }
    return null;
  }
  function placeLog(x, y) { const i = y * S.W + x; if (S.A.type[i] === E.AIR) { S.put(i, E.WOOD); return true; } return false; }
  function run(e) {
    const W = S.W, fy = Math.round(e.y);
    /* движение к цели */
    if (e.goal != null && e.phase === 'go' && navStep(e)) return;
    if (e.goal != null && e.phase === 'go') {
      if (Math.abs(e.goal - e.x) < 1.4) { e.phase = 'do'; e.idle = 1; e.tt = e.dur || e.tt; e.goal = null; if (e.task === 'chop') e.txt = 'Рубит дерево'; else if (e.task === 'fish') e.txt = 'Рыбачит'; else if (e.task === 'build') { e.txt = 'Строит дом'; e.bi = 0; e.bc = []; const s = e.site, g = s.g; for (let y = g - 1; y >= g - 13; y--) e.bc.push([s.x0, y]); e.bc.push([s.x0 + 8, g - 13], [s.x0 + 8, g - 14]); for (let x = s.x0; x < s.x0 + 8; x++) e.bc.push([x, g - 14]); e.tt = e.bc.length * 14 + 60; } else if (e.task === 'wed') e.txt = 'Свадьба!'; else if (e.task === 'house') { const b = HAS() && Houses.byId(e.bid); e.txt = 'Строит ' + (b ? b.name.toLowerCase() : 'дом'); } else if (e.task === 'quarry') e.txt = 'Добывает камень'; else if (e.task === 'swim') e.txt = 'Купается'; else if (e.task === 'shelter') e.txt = 'Пережидает дождь'; else if (e.task === 'bury') { const b = byId(e.bt); e.txt = 'Хоронит ' + (b ? b.name : ''); } else if (e.task === 'fire') e.txt = 'Разжигает костёр'; else if (e.task === 'camp') e.txt = 'Греется у костра'; else if (e.task === 'sleep') { e.sleep = 1; e.txt = 'Спит'; } }
      else { e.dir = sgn(e.goal - e.x); e.idle = 0; return; }
    }
    switch (e.task) {
      case 'wander': if (--e.t2 <= 0) { e.t2 = 50 + rr(160); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .3 ? 1 : 0; } break;
      case 'rest': e.idle = 1; break;
      case 'play': if (--e.t2 <= 0) { e.t2 = 30 + rr(80); e.dir = rf() < .5 ? -1 : 1; e.idle = 0; if (rf() < .5) e.jump = true; if (rf() < .25) emote(e, 'note', 70); } break;
      case 'follow': { const p = byId(e.par); if (!alive(p)) { e.tt = 0; break; } const d = p.x - e.x; if (Math.abs(d) > 4) { e.dir = sgn(d); e.idle = 0; } else e.idle = 1; break; }
      case 'together': { const p = byId(e.mate); if (!alive(p)) { e.tt = 0; break; } const d = p.x - e.x; if (Math.abs(d) > 3.5) { e.dir = sgn(d); e.idle = 0; } else { e.idle = 1; if (rf() < .002) emote(e, 'heart', 80); } if (e.mst >= 1 && rf() < .0006) quarrel(e); break; }
      case 'chat': {
        const p = byId(e.chatWith); if (!alive(p) || p.chatWith !== e.id) { e.tt = 0; break; }
        const d = p.x - e.x; e.dir = sgn(d);
        if (Math.abs(d) > 4.2) { e.idle = 0; } else { e.idle = 1; if (rf() < .01) emote(e, rf() < .5 ? 'talk' : 'note', 60); }
        if (e.tt === 1) { e.rel[p.id] = (e.rel[p.id] || 0) + 1; p.rel[e.id] = (p.rel[e.id] || 0) + 1; romance(e, p); e.chatWith = null; }
        break; }
      case 'sleep': if (e.sleep) { e.idle = 1; if (rf() < .004) emote(e, 'zzz', 100); } else if (e.goal == null) { if (--e.t2 <= 0) { e.t2 = 60 + rr(100); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .5 ? 1 : 0; } if (S.tod !== undefined && rf() < .004) { e.sleep = 1; e.txt = 'Спит'; } } break;
      case 'camp': if (e.phase === 'do' || !e.room) { e.idle = 1; if (rf() < .002) emote(e, 'heart', 60); if (!e.room) { const c = campNear(e); if (c) e.dir = sgn(c.x - e.x); } } break;
      case 'fire': if (e.phase === 'do') { e.idle = 1; e.act = 'dig'; e.at = 3; if (e.tt === 40) { const x = Math.floor(e.x) + e.dir * 5; let g = fy; if (!safeFire(x, g)) { emote(e, 'ask', 80); e.tt = 1; break; }
          /* кострище: трава вокруг вырывается, в земле выкапывается ямка — костёр горит в ней и не расползается */
          for (let dy = -3; dy <= 0; dy++) for (let dx = -5; dx <= 5; dx++) { const j = (g + dy) * W + x + dx; if (GRASS.has(S.A.type[j])) S.put(j, E.AIR); }
          const soft = (j) => { const t = S.A.type[j]; return t === E.EARTH || t === E.SAND || t === E.MUD || t === E.ASH || t === E.SNOW; };
          if (soft((g + 1) * W + x) && soft((g + 1) * W + x + 1) && soft((g + 2) * W + x) && soft((g + 2) * W + x + 1)) { S.put((g + 1) * W + x, E.AIR); S.put((g + 1) * W + x + 1, E.AIR); g++; }
          placeLog(x, g); placeLog(x + 1, g); placeLog(x, g - 1); for (let k = 0; k < 3; k++) { const j = (k === 2 ? g - 1 : g) * W + x + (k === 1 ? 1 : 0); S.ignite(j); } S.camps.push({ x: x + .5, y: g, t: 3600 }); emote(e, 'fire', 90); e.dir = -e.dir; e.tt = 2; e.fear = Math.max(e.fear || 0, 20); }   /* разжёг — сразу отходит */ } break;
      case 'chop': if (e.phase === 'do') {
        e.idle = 1; e.dir = sgn(e.tx - e.x); e.act = 'dig'; e.at = 3;
        if (e.tt === 1) {   /* спиливаем ствол у земли: дальше дерево падает само */
          const A = S.A; let n = 0; for (let dx = -1; dx <= 1; dx++) for (let y = fy - 3; y <= fy + 2; y++) { const i = y * W + e.tx + dx; if (A.type[i] === E.WOOD && A.aux[i] !== 0 && solidAt(i + W)) { S.put(i, E.AIR); n++; } }
          emote(e, n ? 'alert' : 'talk', 70);
          if (n && HAS()) { Town.give(e, 'wood', n + 4); Town.earn(e, e.prof === 'lumber' ? 3 : 1); }
        }
      } break;
      case 'bury': if (e.phase === 'do') { const b = byId(e.bt); if (!b || !b.dead) { e.tt = 0; break; } e.idle = 1; e.dir = sgn(b.x - e.x); e.act = 'dig'; e.at = 3; if (e.tt === 1) bury(e, b); } break;
      case 'mourn': { const c = byId(e.mourn); if (c) e.dir = sgn(c.x - e.x); e.idle = 1; if (rf() < .006) emote(e, 'cry', 90); break; }
      case 'wed': if (e.phase === 'do') { const p = byId(e.mate); if (!alive(p)) { e.tt = 0; break; } e.idle = 1; e.dir = sgn(p.x - e.x); if (rf() < .02) emote(e, 'heart', 60); if (e.tt === 1 && e.mst === 1 && Math.abs(p.x - e.x) < 14) marry(e, p); } break;
      case 'quarrel': { const p = byId(e.qw); if (!alive(p) || p.qw !== e.id) { e.tt = 0; break; } e.dir = sgn(p.x - e.x); e.idle = 1; if (rf() < .03) emote(e, 'angry', 50); if (e.tt === 1 && e.mate === p.id && rf() < .75) { e.rel[p.id] = (e.rel[p.id] || 0) + 2; emote(e, 'heart', 90); } break; }
      case 'sulk': e.idle = 1; if (rf() < .012) emote(e, 'broken', 70); break;
      case 'swim': if (e.phase === 'do') { if (--e.t2 <= 0) { e.t2 = 40 + rr(80); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .2 ? 1 : 0; } if (rf() < .004) emote(e, 'note', 70); } break;
      case 'sow': { if (--e.t2 <= 0) { e.t2 = 55 + rr(40); e.dir = rf() < .5 ? -1 : 1; e.idle = 0; const x = Math.floor(e.x) - e.dir, i = fy * W + x, A = S.A; if (x > 2 && x < W - 2 && A.type[i] === E.AIR && A.type[i + W] === E.EARTH) { S.put(i, rf() < .2 ? E.FSEED : E.SEED); e.act = 'seed'; e.at = 16; e.stun = 14; if (HAS() && e.prof === 'farmer' && rf() < .5) Town.earn(e, 1); } } break; }
      case 'shelter': if (e.phase === 'do') { e.idle = 1; if (S.weather === 0) e.tt = Math.min(e.tt, 40); } break;
      case 'fish': if (e.phase === 'do') { e.idle = 1; e.dir = sgn(e.wx - e.x); e.act = 'fish'; e.at = 3; if (rf() < .004) emote(e, 'alert', 60); if (e.tt === 1 && HAS()) { Town.earn(e, e.prof === 'fisher' ? 4 : 2); emote(e, 'money', 70); } } break;
      case 'house': if (e.phase === 'do') {
        const b = Houses.byId(e.bid); if (!b || b.done) { e.tt = Math.min(e.tt, 2); break; }
        e.idle = 1; e.act = 'dig'; e.at = 3; if (rf() < .01) e.dir = -e.dir;
        if (Houses.build(b, (e.prof === 'builder' ? 2 : 1) / (b.rooms.length * 1000 + 600))) { emote(e, 'heart', 120); e.tt = 2; }
        if (e.tt % 150 === 0) Town.earn(e, 1);
      } break;
      case 'quarry': if (e.phase === 'do') {
        e.idle = 1; e.dir = sgn(e.tx - e.x); e.act = 'dig'; e.at = 3;
        if (e.tt === 1) { const A = S.A; let n = 0; for (let dx = -1; dx <= 1; dx++) for (let y = e.ty; y <= e.ty + 2; y++) { const i = y * W + e.tx + dx; if (A.type[i] === E.STONE && n < 5) { S.put(i, E.AIR); n++; } } if (n) { Town.give(e, 'stone', n + 2); Town.earn(e, 2); emote(e, 'money', 70); } }
      } break;
      case 'arm': if (e.phase === 'do') { e.idle = 1; e.act = 'dig'; e.at = 3; } break;
      case 'trade': case 'work': if (e.phase === 'do') { e.idle = 1; if (e.task === 'work') { e.act = 'dig'; e.at = 3; } else if (rf() < .01) emote(e, 'talk', 50); } break;
      case 'preach': case 'study': case 'craft': case 'serve': case 'pray': case 'read': case 'drink': case 'learn':
        if (e.phase === 'do') { e.idle = 1; if (rf() < .004) e.dir = -e.dir; if (e.task === 'craft') { e.act = 'dig'; e.at = 3; } if (rf() < .005) emote(e, ROOM_EMO[e.task], 80); }
        break;
      case 'build': if (e.phase === 'do' && e.bc) {
        e.idle = 1; e.act = 'dig'; e.at = 3;
        if (e.tt % 14 === 0 && e.bi < e.bc.length) { const c = e.bc[e.bi++]; placeLog(c[0], c[1]); }
        if (e.bi >= e.bc.length && !e.done) { e.done = true; const s = e.site; S.homes.push({ x: s.x0 + 4, y: s.g - 1, rx: s.x0 + 4, ry: s.g - 14 }); emote(e, 'heart', 120); e.tt = 2; }
      } break;
    }
  }
  /* огонь рядом: не лезть в пламя (своё же костровище тоже), а если огонь вплотную — отойти */
  function hotCol(x, fy) { if (x < 1 || x >= S.W - 1) return false; const A = S.A, W = S.W; for (let y = Math.max(1, fy - 12); y <= fy; y++) { const i = y * W + x; if (A.type[i] === E.FIRE || A.type[i] === E.LAVA || A.burn[i] !== 0) return true; } return false; }
  /* пожар рядом (в том числе горящие кроны над головой): сколько огня слева и справа в 15 клетках */
  function fireAround(cx, fy) {
    const A = S.A, W = S.W; let l = 0, r = 0;
    for (let dx = -15; dx <= 15; dx++) { const x = cx + dx; if (x < 1 || x >= W - 1) continue; for (let y = Math.max(1, fy - 26); y <= fy + 1; y += 2) { const i = y * W + x; if (A.type[i] === E.FIRE || A.burn[i] !== 0) { if (dx < 0) l++; else r++; } } }
    return [l, r];
  }
  function avoidFire(e) {
    if (e.burn > 0) return;
    const cx = Math.floor(e.x), fy = Math.round(e.y);
    /* большой огонь рядом — бросить всё и уйти; спящий просыпается (у своего костра огонь маленький и он в стороне) */
    if (((S.frame + e.id) % 5) === 0 && e.task !== 'camp' && e.task !== 'fire') {
      const [l, r] = fireAround(cx, fy);
      if (l + r > 6) {
        if (e.sleep) wake(e, 'Проснулся: пожар!');
        e.dir = l > r ? 1 : -1; e.idle = 0; e.fear = Math.max(e.fear || 0, 60); e.goal = null; e.nav = null; e.tt = Math.min(e.tt, 40); e.txt = 'Бежит от пожара';
        if (!e.emo) emote(e, 'alert', 80);
        return;
      }
    }
    if (e.sleep) return;
    const near = hotCol(cx - 1, fy) ? -1 : hotCol(cx + 1, fy) ? 1 : 0;
    if (near) { e.dir = -near; e.idle = 0; e.fear = Math.max(e.fear || 0, 4); return; }
    if (e.idle) return;
    if (hotCol(cx + e.dir * 2, fy) || hotCol(cx + e.dir * 3, fy)) {
      if (e.goal != null && sgn(e.goal - e.x) === e.dir && Math.abs(e.goal - e.x) > 3) { e.tt = Math.min(e.tt, 30); e.goal = null; e.nav = null; }   /* цель за огнём — передумал */
      if (e.task === 'camp') e.idle = 1; else e.dir = -e.dir;
    }
  }
  /* общий шаг для всех человечков: вызывается из stepEnts для живых людей */
  function think(e, sim) {
    S = sim;
    if (e.id === undefined) init(e);
    e.age += AGE_STEP;
    const kid = e.age < 14, elder = e.age >= 62;
    e.spdk = kid ? 1.12 : elder ? .6 : 1;
    if (e.emo && --e.emo.t <= 0) e.emo = null;
    if (e.age > 80 && rf() < .0005) { S.die(e, 'old'); return; }
    if (typeof Combat !== 'undefined' && Combat.think(e, S)) { if (e.doorT > 0) e.doorT--; return; }   /* бой важнее любых дел */
    /* пара: рождение ребёнка */
    if (e.fem && e.mate != null && e.mst === 2 && e.age > 19 && e.age < 44 && S.tod > .25 && S.tod < .7 && S.ents.length < 48 && rf() < 1 / 4500) {
      const m = byId(e.mate), hm = homeNear(e);
      if (alive(m) && hm && Math.abs(m.x - e.x) < 30) { S.spawnEnt(hm.x, e.y, false, People.randomForm(), null, { age: 0, par: e.id, kid: true }); emote(e, 'heart', 200); emote(m, 'heart', 200); }
    }
    { const tod = S.tod === undefined ? .4 : S.tod; if ((tod > .85 || tod < .2) && e.task !== 'sleep' && e.task !== 'camp' && e.task !== 'fire' && e.task !== 'chat') e.tt = 0; }
    if (e.doorT > 0) e.doorT--;
    if (e.task === null || e.task === undefined || --e.tt <= 0) { if (e.fin && e.phase === 'do' && e.task) { const f = e.fin; e.fin = null; try { f(); } catch (er) { /* награда не должна ломать жизнь */ } } if (e.task === 'chat') { e.chatWith = null; } e.room = null; pick(e); }
    if (e.sleep && S.tod > .2 && S.tod < .85) { e.sleep = 0; e.task = null; e.tt = 0; }
    run(e);
    avoidFire(e);
    if (e.task === 'chop' || e.task === 'fish' || e.task === 'build' || e.task === 'fire') { /* закончили: сбрасываем поле дела */ if (e.tt <= 1) { e.phase = null; e.done = false; e.bc = null; } }
  }
  function step(sim) {
    S = sim;
    for (let i = S.camps.length - 1; i >= 0; i--) if (--S.camps[i].t <= 0) S.camps.splice(i, 1);
    if (HAS()) Town.step(S);
    else if ((S.frame & 255) === 0) for (let i = S.homes.length - 1; i >= 0; i--) { const h = S.homes[i]; if (S.A.type[h.ry * S.W + h.rx] !== E.WOOD) S.homes.splice(i, 1); }
  }
  return { init, think, step, describe, ageScale, stageOf, byId, emote, onDeath, wake, CAUSE };
})();
