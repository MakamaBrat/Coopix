'use strict';
/* ПИКСЕЛИЯ — жизнь человечков: имена, возраст, дети, занятия и отношения.
   Работает поверх ядра: вызывается из stepEnts для людей (не зомби). Человечек сам выбирает занятие по времени суток, возрасту и окружению:
   гуляет, отдыхает, спит (ночью, лучше дома), разжигает костёр и греется у него, рубит деревья (дерево падает само), рыбачит, строит дом,
   болтает с другими, влюбляется, заводит детей; дети играют и ходят за родителями, пожилые медленнее. Текущее занятие видно в карточке. */
const Life = (function () {
  const MN = ['Иван', 'Пётр', 'Алёша', 'Миша', 'Саша', 'Дима', 'Гена', 'Лёва', 'Костя', 'Тимур', 'Фёдор', 'Борис', 'Макс', 'Рома', 'Егор', 'Стёпа', 'Вова', 'Коля', 'Артём', 'Денис', 'Глеб', 'Илья', 'Кирилл', 'Матвей', 'Никита', 'Олег', 'Паша', 'Савва', 'Тихон', 'Ярослав', 'Арсений', 'Богдан', 'Вадим', 'Гоша', 'Данила', 'Ефим', 'Захар', 'Игнат', 'Лука', 'Марк', 'Назар', 'Остап', 'Платон', 'Родион', 'Семён', 'Тарас', 'Устин', 'Филипп', 'Харитон', 'Эмиль', 'Юра', 'Яша', 'Антон', 'Веня', 'Гриша', 'Добрыня', 'Елисей', 'Женя', 'Кузьма', 'Мирон'];
  const FN = ['Маша', 'Аня', 'Катя', 'Лена', 'Оля', 'Даша', 'Соня', 'Вера', 'Нина', 'Юля', 'Ира', 'Зоя', 'Рита', 'Лиза', 'Надя', 'Мила', 'Алиса', 'Таня', 'Варя', 'Галя', 'Дуня', 'Ева', 'Злата', 'Инна', 'Кира', 'Лада', 'Майя', 'Ника', 'Полина', 'Рая', 'Света', 'Тоня', 'Ульяна', 'Фрося', 'Христина', 'Эля', 'Яна', 'Агата', 'Божена', 'Василиса', 'Глаша', 'Дарина', 'Есения', 'Жанна', 'Ксюша', 'Люба', 'Марфа', 'Настя', 'Олеся', 'Поля', 'Роза', 'Стеша', 'Тая', 'Уля', 'Фая', 'Юна', 'Ася', 'Вика', 'Лера', 'Мирра'];
  const FEMFORM = { dress: 1, tail: 1, granny: 1, belle: 1 };
  const AGE_STEP = 1 / 1800;   /* год жизни = 30 секунд */
  let nextId = 1, S = null;
  const rr = (n) => S.rn(n), rf = () => S.rnd();
  const ageScale = (a) => a >= 16 ? 1 : Math.max(.58, .58 + .42 * (a - 2) / 14);
  const stageOf = (a) => a < 4 ? 'малыш' : a < 14 ? 'ребёнок' : a < 20 ? 'подросток' : a < 62 ? 'взрослый' : 'пожилой';
  const yearsWord = (n) => { const m = n % 100, d = n % 10; return (m > 10 && m < 15) ? 'лет' : d === 1 ? 'год' : (d >= 2 && d <= 4) ? 'года' : 'лет'; };
  const sgn = (v) => v < 0 ? -1 : 1;
  const byId = (id) => { if (id == null) return null; const L = S.ents; for (let i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; };
  const alive = (o) => o && !o.dying && !o.z;
  const CAUSE = { gas: 'отравлен газом', slain: 'убит в бою', burn: 'сгорел', drown: 'утонул', fall: 'разбился при падении', crush: 'раздавлен', blast: 'погиб от взрыва', shock: 'убит током', melt: 'растворился в кислоте', freeze: 'замёрз', old: 'умер от старости' };
  const emote = (e, k, t) => { e.emo = { k, t: t || 90 }; };
  /* причина смерти в женском роде: сгорел → сгорела, разбился → разбилась, убит → убита */
  const femWhy = (e, w) => !e.fem ? w : w.replace(/погиб(?=\s|$)/g, 'погибла').replace(/ился(?=\s|$)/g, 'илась').replace(/(ел|ул|ер|ёрз)(?=\s|$)/g, (m) => m === 'ёрз' ? 'ёрзла' : m === 'ер' ? 'ерла' : m + 'а').replace(/(ен|ит)(?=\s|$)/g, '$1а');

  /* ---------- создание ---------- */
  /* имя, которого нет у живых (если все заняты — любое) */
  function freeName(fem) { const L = fem ? FN : MN, used = new Set(S.ents.filter((o) => alive(o) && o.name).map((o) => o.name)), free = L.filter((n) => !used.has(n)); return (free.length ? free : L)[rr(free.length ? free.length : L.length)]; }
  function init(e, x) {
    S = S || Sim; x = x || {};
    e.id = nextId++;
    const form = e.form || 'ref';
    { const PF = (typeof People !== 'undefined' && People.FORMS[form]) || {}; e.fem = x.fem !== undefined ? !!x.fem : (FEMFORM[form] || PF.femOnly ? true : PF.maleOnly ? false : rf() < .5); }
    e.name = x.name || freeName(e.fem);
    e.age = x.age !== undefined ? x.age : (form === 'elder' || form === 'granny' ? 66 + rf() * 16 : x.kid ? 4 + rf() * 7 : 19 + rf() * 36);
    REG.set(e.id, e);
    e.rel = {}; e.mate = null; e.mst = 0; e.par = x.par == null ? null : x.par; e.par2 = x.par2 == null ? null : x.par2; e.task = null; e.txt = 'Осматривается'; e.tt = 0; e.goal = null; e.sleep = 0; e.t2 = 0; e.chatWith = null; e.emo = null;
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
    if (mate) lines.push((e.mst === 2 ? (e.fem ? 'Замужем за ' : 'Женат на ') : 'Встречается с ') + mate.name);
    { const ps = parentsOf(e); if (ps.length) lines.push('Родители: ' + ps.map((p) => p.name + (p.dying ? ' †' : '')).join(', ')); }
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
  const campNear = (e) => S.camps.find((c) => Math.abs(c.x - e.x) < 70 && !c.out);
  /* горит ли костёр на самом деле: пламя или тлеющие поленья рядом с местом */
  function campLit(c) {
    const A = S.A, W = S.W, cx = Math.floor(c.x);
    for (let y = c.y - 5; y <= c.y + 1; y++) for (let x = cx - 3; x <= cx + 3; x++) { if (x < 1 || x >= W - 1 || y < 1 || y >= S.H - 1) continue; const i = y * W + x; if (A.type[i] === E.FIRE || A.burn[i] !== 0) return true; }
    return false;
  }
  /* место у костра: 7–9 клеток от огня, на той стороне, где меньше людей, и не вплотную к соседу */
  function campSeat(e, c) {
    let best = null, bs = 1e9;
    for (const side of [-1, 1]) for (const d of [8, 9, 10, 11]) {
      const x = c.x + side * d; if (x < 3 || x > S.W - 4) continue;
      const crowd = S.ents.filter((o) => o !== e && alive(o) && (o.task === 'camp' || o.task === 'dance') && Math.abs((o.goal != null ? o.goal : o.x) - x) < 3).length;
      const sc = crowd * 10 + (d - 8) + Math.random();
      if (sc < bs) { bs = sc; best = x; }
    }
    return best == null ? c.x + 8 : best;
  }
  /* огонь рядом, кроме самого кострища (оно в ямке, обложено камнями): трава загорелась, пламя сползло — человек уходит */
  function fireNear(e) {
    const A = S.A, W = S.W, x0 = Math.floor(e.x), y0 = Math.round(e.y);
    for (let y = y0 - 5; y <= y0 + 1; y++) for (let x = x0 - 6; x <= x0 + 6; x++) {
      if (x < 1 || x >= W - 1 || y < 1 || y >= S.H - 1) continue; const i = y * W + x;
      if (!(A.type[i] === E.FIRE || A.burn[i] !== 0)) continue;
      if (S.camps.some((c) => Math.abs(x - c.x) < 2.6 && y >= c.y - 6 && y <= c.y + 1) && Math.abs(x - e.x) > 4) continue;
      return x;
    }
    return null;
  }
  /* впереди огонь (пламя, горящее или раскалённое) — в 2–4 клетках по ходу, на высоте тела */
  function fireAhead(e) {
    const A = S.A, W = S.W, y0 = Math.round(e.y), d = e.dir < 0 ? -1 : 1;
    for (let k = 2; k <= 6; k++) { const x = Math.floor(e.x) + d * k; if (x < 1 || x >= W - 1) continue; for (let y = y0 - 5; y <= y0; y++) { if (y < 1) continue; const i = y * W + x; if (A.type[i] === E.FIRE || A.burn[i] !== 0 || A.Tm[i] > 150) return true; } }
    return false;
  }
  /* первая помощь: погибшего только что (не от старости, не сгоревшего дотла, не растворённого) можно откачать — врач чаще, другие реже */
  const REVIVE_OK = { fall: 1, slain: 1, blast: 1, shock: 1, crush: 1, drown: 1, freeze: 1, burn: 1 };
  function rescuable(o) { return !!(o && o.dead && !o.z && REVIVE_OK[o.dying] && !o.charred && !o.acid && !o.revived && S.frame - (o.deadAt || 0) < 700 && !(o.sub > 2)); }
  function victimNear(e, r) {
    let best = null, bd = r;
    for (const o of S.ents) { if (!rescuable(o) || (e.cantReach && e.cantReach === o.id)) continue; const h = byId(o.healBy); if (h && h !== e && alive(h) && h.task === 'heal' && (h.prof === 'doctor' || e.prof !== 'doctor')) continue;   /* врач подменяет случайного помощника */ const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  /* место для нового дерева: ровная земля, вдали от домов, огородов, лавочек, костров, шахт и других деревьев */
  function treeSpot(e) {
    const W = S.W, A = S.A;
    for (let d = 8; d < 90; d += 3) for (const sg of rf() < .5 ? [1, -1] : [-1, 1]) {
      const x = Math.round(e.x + sg * d); if (x < 8 || x > W - 9) continue;
      const g = graveGround(x, Math.round(e.y)); if (g < 0 || Math.abs(g - Math.round(e.y)) > 3) continue;
      if (A.type[(g + 1) * W + x] !== E.EARTH && A.type[(g + 1) * W + x] !== E.MUD) continue;
      if (typeof Houses !== 'undefined' && Houses.list.some((h) => x > h.x0 - 12 && x < h.x0 + h.w + 12)) continue;
      if (typeof Works !== 'undefined' && (Works.gardens.some((q) => q.beds.some((b) => Math.abs(b.x - x) < 10) || (q.wx != null && Math.abs(q.wx - x) < 12)) || Works.benches().some((b) => Math.abs(b.x - x) < 12) || Works.mines.some((m) => Math.abs(m.x0 - x) < 14) || Works.docks.some((o) => Math.abs(o.x0 - x) < 12))) continue;
      if (S.camps.some((c) => Math.abs(c.x - x) < 16) || S.graves.some((q) => Math.abs(q.x - x) < 4)) continue;
      let tree = false; for (let yy = g - 30; yy <= g && !tree; yy++) for (let xx = x - 9; xx <= x + 9; xx++) { if (yy < 1 || xx < 1 || xx >= W - 1) continue; const i = yy * W + xx, t = A.type[i]; if ((t === E.WOOD && A.aux[i] !== 0) || t === E.SPROUT || t === E.LEAF) { tree = true; break; } }
      if (!tree) return { x, g };
    }
    return null;
  }
  /* ---------- настроение: число от −10 до 10 из того, что с человеком на самом деле: еда, вода, дом, любовь, друзья, горе, раны,
     страх, война, ссоры, погода и холод, недавние радости. Меняется плавно; главная причина показывается в карточке ---------- */
  function moodTick(e) {
    if (e.z || e.dying) return;
    const s = HAS() ? Town.byId(e.soc) : null, m = s ? Town.members(s).length : 0, sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1;
    let v = (((e.seed | 0) % 5) - 2) * .4; const why = [];
    const add = (k, t) => { v += k; why.push([k, t]); };
    if (s && m) {
      { const now = typeof Sky !== 'undefined' ? Sky.day + Sky.time : 0; if (e.meal == null) e.meal = now; const h = now - e.meal;   /* голод — по тому, когда сам последний раз ел */
        if (h > 2) add(-4, 'голодает'); else if (h > 1) add(-2, 'давно не ел' + (e.fem ? 'а' : '')); else if (h < .4) add(.8, 'сыт' + (e.fem ? 'а' : '')); }
      if ((s.food || 0) < m * .3) add(-.8, 'в деревне мало еды');
      if ((s.water || 0) < m * .2) add(-1, 'мало воды');
      if (s.war && Object.values(s.war).some(Boolean)) add(-2.5, 'война');
    }
    if (e.age >= 18 && HAS()) { if (!Town.homeOf(e)) add(-1.5, 'нет своего дома'); else add(.6, 'свой дом'); }
    const mt = byId(e.mate); if (mt && alive(mt)) add((e.rel[mt.id] || 0) >= 4 ? 2 : .5, 'любовь'); else if (e.age >= 22 && e.mate == null && (e.exes || []).length) add(-.8, 'одиночество');
    let fr = 0; for (const k in e.rel) if (e.rel[k] >= 3) { const o = byId(+k); if (o && alive(o)) fr++; } if (fr >= 2) add(1, 'друзья'); else if (fr === 0 && e.age >= 14) add(-1, 'нет друзей');
    if (e.griefT > S.frame) add(-1.5 - 4 * (e.griefT - S.frame) / 9000, 'горе');
    if (e.joyT > S.frame) add(1 + 3 * (e.joyT - S.frame) / 4000, e.joyWhy || 'радость');
    if (e.hp < 60) add(e.hp < 35 ? -4 : -2, 'ранен' + (e.fem ? 'а' : ''));
    if (e.fear > 0) add(-3, 'страх');
    if (e.task === 'sulk' || e.task === 'quarrel') add(-3, 'ссора');
    if (S.weather > 0 && !e.room && e.task !== 'shelter' && e.task !== 'shelterH') add(-.8, 'мокнет под дождём');
    if (sea === 3 && !e.room && e.task !== 'camp') add(-.7, 'мёрзнет');
    if (e.preg > 0) add(.8, 'ждёт ребёнка');
    v = Math.max(-10, Math.min(10, v));
    e.mood = e.mood == null ? v : e.mood + (v - e.mood) * .3;
    let best = null; for (const w of why) if (Math.sign(w[0]) === Math.sign(e.mood) && (!best || Math.abs(w[0]) > Math.abs(best[0]))) best = w;
    e.moodWhy = best ? best[1] : '';
  }
  const joy = (e, why, t) => { if (!e) return; e.joyT = S.frame + (t || 4000); e.joyWhy = why; };
  function startHeal(e, v) { const h = byId(v.healBy); if (h && h !== e && h.task === 'heal' && h.healT === v.id) { h.tt = 0; h.act = null; h.txt = 'Уступил врачу'; }
    start(e, 'heal', 'Бежит на помощь к ' + v.name, 800, v.x + (e.x < v.x ? -2.5 : 2.5)); e.dur = 240; e.healT = v.id; v.healBy = e.id; e.hurry = true; emote(e, 'alert', 60); }
  function revive(o, by) {
    o.dying = null; o.dead = false; o.dt = 0; o.deadAt = null; o.why = null; o.burn = 0; o.drown = 0; o.hp = 30; o.revived = true; o.task = null; o.tt = 0; o.fight = null;
    o.ko = 120; o.stun = Math.max(o.stun || 0, 120); o.claim = null; o.healBy = null; o.txt = 'Приходит в себя';
    emote(o, 'heart', 150); emote(by, 'spark', 150); joy(o, 'спасли от смерти', 6000); joy(by, 'спас' + (by.fem ? 'ла' : '') + ' человека', 5000);
    for (const w of S.ents) if (w !== o && w !== by && alive(w) && Math.abs(w.x - o.x) < 40 && !w.sleep) { emote(w, 'note', 100); if (!w.fight) w.cheerT = 50; }
    if (HAS()) Town.note((by.prof === 'doctor' ? 'Врач ' : '') + by.name + (by.fem ? ' спасла ' : ' спас ') + o.name + ': ' + (by.prof === 'doctor' ? 'откачал' + (by.fem ? 'а' : '') : 'оказал' + (by.fem ? 'а' : '') + ' первую помощь'), Town.byId(o.soc), true);
    plog(o, 'Вернули к жизни: спас' + (by.fem ? 'ла ' : ' ') + by.name); plog(by, (by.fem ? 'Спасла ' : 'Спас ') + o.name);
    for (const { o: k } of family(o)) if (k !== by && alive(k)) plog(k, o.name + ' снова жив' + (o.fem ? 'а' : '') + ' — ' + by.name + ' откачал' + (by.fem ? 'а' : ''));
  }
  /* ближайшее непогребённое тело, за которое ещё никто не взялся */
  function corpseNear(e) {
    let best = null, bd = 110;
    for (const o of S.ents) {
      if (!o.dead || o.z || o.sub > 2 || (rescuable(o) && S.frame - (o.deadAt || 0) < 900)) continue;
      const c = byId(o.claim); if (c && alive(c) && c.task === 'bury' && c.bt === o.id) continue;
      const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y); if (d < bd) { bd = d; best = o; }
    }
    return best;
  }
  /* место для могилы: в стороне от домов (не ближе 8 клеток), не у причалов и шахт, на ровной сухой земле без деревьев;
     если кладбище уже есть — рядом с прежними могилами */
  function graveGround(x, y0) {
    const A = S.A, W = S.W;
    for (let y = Math.max(3, y0 - 30); y < Math.min(S.H - 2, y0 + 30); y++) {
      const i = y * W + x, t = A.type[i];
      if (t === E.AIR || KIND[t] === K.GAS || t === E.LEAF || t === E.SEED || t === E.SPROUT || t === E.SNOW || t === E.LITTER || t === E.FSEED || t === E.CONE) continue;
      if (KIND[t] === K.LIQUID || (t === E.WOOD && A.aux[i] !== 0)) return -1;
      return y - 1;
    }
    return -1;
  }
  function graveSpot(b, from, bad, blockSide) {
    const W = S.W, y0 = Math.round(b.y);
    const ok = (x) => {
      if (x < 5 || x > W - 6) return false;
      if (bad && bad.some((q) => Math.abs(q - x) < 6)) return false;
      if (blockSide && from != null && (x - from) * blockSide > 3) return false;   /* туда не пройти — ищет по эту сторону */
      if (typeof Houses !== 'undefined' && Houses.list.some((h) => x > h.x0 - 8 && x < h.x0 + h.w + 8)) return false;
      if (typeof Works !== 'undefined' && (Works.docks.some((d) => Math.abs(d.x0 - x) < 10) || Works.mines.some((m) => Math.abs(m.x0 - x) < 8))) return false;
      if (S.graves.some((g) => Math.abs(g.x - x) < 3) || S.ents.some((o) => o.task === 'bury' && o.grave != null && Math.abs(o.grave - x) < 3) || S.camps.some((c) => Math.abs(c.x - x) < 8)) return false;
      const g = graveGround(x, y0); if (g < 0 || Math.abs(g - y0) > 4) return false;   /* на уровне земли, не в яме и не в шахте */
      return Math.abs(graveGround(x - 1, g) - g) <= 1 && Math.abs(graveGround(x + 1, g) - g) <= 1;
    };
    for (const g of S.graves.slice().sort((p, q) => Math.abs(p.x - b.x) - Math.abs(q.x - b.x))) {   /* часто — в уже готовую могилу: так растёт семейная/общая */
      if (Math.abs(g.x - b.x) > 80 || (g.n || 1) >= 8 || rf() > .6 || (bad && bad.some((q) => Math.abs(q - g.x) < 3)) || (blockSide && from != null && (g.x - from) * blockSide > 3)) continue;
      if (Houses && Houses.list && Houses.list.some((h) => g.x > h.x0 - 4 && g.x < h.x0 + h.w + 4)) continue;
      return g.x;
    }
    const c = [];
    for (const g of S.graves) for (const dx of [3, -3, 6, -6, 9, -9]) c.push(g.x + dx);
    const cx = Math.round(from != null ? from : b.x);
    for (let d = from != null ? 4 : 10; d < 140; d += 2) c.push(cx + d, cx - d);
    for (const x of c) if (Math.abs(x - cx) < 150 && ok(x)) return x;
    return null;
  }
  /* к выбранному месту не пройти: другое место по эту сторону; нет — хоронит тут, если можно; иначе оставляет тело (заберёт другой) */
  function rerouteGrave(e) {
    const b = byId(e.bt); if (!b || !b.dead) { e.tt = 0; return; }
    const side = sgn(e.grave - e.x) || 1; (e.badGraves || (e.badGraves = [])).push(e.grave);
    let g = e.badGraves.length <= 3 ? graveSpot(b, e.x, e.badGraves, side) : null;
    if (g == null) { const here = Math.round(e.x + side * 2); const gg = graveGround(here, Math.round(e.y)); if (gg >= 0 && !(typeof Houses !== 'undefined' && Houses.list.some((h) => here > h.x0 - 4 && here < h.x0 + h.w + 4))) g = here; }
    if (g == null) { b.dragBy = null; e.grave = null; e.badGraves = null; e.tt = 0; e.txt = 'Не смог' + (e.fem ? 'ла' : '') + ' донести тело'; return; }
    e.grave = g; e.goal = Math.abs(g - e.x) < 3 ? null : g + (g > e.x ? -2.5 : 2.5); e.phase = e.goal == null ? 'do' : 'go'; e.gt = 0; e.gx = null; e.tt = Math.max(e.tt, e.goal == null ? e.dur || 160 : 1200);
    e.txt = 'Несёт ' + b.name + ' к другому месту';
  }
  /* могила: холмик земли и деревянный крест; тело убирается */
  function bury(e, c, gx0) {
    const W = S.W, A = S.A, gx = gx0 != null ? gx0 : Math.floor(c.x); let gy = Math.round(c.y);
    if (gx0 != null) { const g = graveGround(gx, Math.round(e.y)); if (g >= 0) gy = g; }
    S.ents.splice(S.ents.indexOf(c), 1);
    const at = (x, y, t) => { if (x < 2 || x >= W - 2 || y < 2) return; const i = y * W + x; if (A.type[i] === E.AIR) S.put(i, t); };
    /* одна могила на несколько человек: чем больше похоронено, тем она больше и богаче — холм шире, крест выше, потом каменное надгробие,
       потом обелиск с оградой */
    let gr = S.graves.find((q) => Math.abs(q.x - gx) <= 1);
    if (gr) { gr.n = (gr.n || 1) + 1; gr.names = (gr.names || [gr.name]).concat(c.name); gy = gr.y; } else { gr = { x: gx, y: gy, name: c.name, names: [c.name], n: 1 }; S.graves.push(gr); }
    const n = gr.n, set = (x, y, t) => { if (x < 2 || x >= W - 2 || y < 2) return; const i = y * W + x; const tt = A.type[i]; if (tt === E.AIR || tt === E.EARTH || tt === E.WOOD || tt === E.LEAF || tt === E.LITTER) S.put(i, t); };
    const mw = n >= 5 ? 3 : n >= 2 ? 2 : 1;
    for (let dx = -mw; dx <= mw; dx++) at(gx + dx, gy, E.EARTH);   /* холм */
    for (let dx = -mw + 1; dx <= mw - 1; dx++) at(gx + dx, gy - 1, E.EARTH);
    if (n >= 3) {   /* каменное надгробие, на нём крест */
      const hh = n >= 5 ? 9 : 5;
      for (let k = 1; k <= hh; k++) { set(gx, gy - 1 - k, E.STONE); if (n >= 5 && k <= hh - 2) set(gx + 1, gy - 1 - k, E.STONE); }
      for (let k = 1; k <= 3; k++) set(gx, gy - 1 - hh - k, E.WOOD); set(gx - 1, gy - hh - 3, E.WOOD); set(gx + 1, gy - hh - 3, E.WOOD);
      if (n >= 5) for (const fx of [gx - 5, gx + 5]) for (let k = 0; k < 3; k++) set(fx, gy - k, E.METAL);   /* ограда */
    } else {
      const ch = n >= 2 ? 7 : 5;
      for (let k = 2; k <= ch; k++) at(gx, gy - k, E.WOOD);
      at(gx - 1, gy - ch + 1, E.WOOD); at(gx + 1, gy - ch + 1, E.WOOD); if (n >= 2) { at(gx - 2, gy - ch + 1, E.WOOD); at(gx + 2, gy - ch + 1, E.WOOD); }
    }
    if (S.sfx) S.sfx('pop', .6);
    emote(e, 'cry', 160); e.txt = 'Похоронил ' + c.name;
    for (const o of S.ents) if (o !== e && alive(o) && Math.abs(o.x - gx) < 20) { emote(o, 'cry', 120); if (o.fear > 0) o.fear = 0; }
  }
  /* смерть рядом: родные горюют, остальные пугаются */
  function onDeath(e, sim) {
    S = sim; if (e.z) return;
    if (typeof Sky !== 'undefined') S.lastDeathDay = Sky.day;   /* после смерти несколько дней праздников нет */
    e.txt = ''; e.task = null; e.chatWith = null;
    if (e.name) for (const { o, rel } of family(e)) if (!o.dying) { plog(o, 'Не стало: ' + e.name); o.griefT = S.frame + 9000; }
    for (const o of S.ents) if (o !== e && !o.dying && (o.rel[e.id] || 0) >= 3 && !(o.griefT > S.frame)) o.griefT = S.frame + 4000;   /* друзья тоже горюют, меньше */   /* родным — в личную летопись */
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
    } else if (e.mate !== p.id && r >= 2 && rf() < .25) { e.crush = p.id; p.crush = e.id; emote(e, 'heart', 50); }   /* флирт: тайная симпатия, дальше — свидания украдкой */
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
    if (typeof Sky !== 'undefined') e.wedDay = p.wedDay = Sky.day;   /* до конца дня — в свадебном */
    joy(e, 'свадьба', 8000); joy(p, 'свадьба', 8000);
    e.hugT = p.hugT = 150; e.hugWith = p.id; p.hugWith = e.id; e.kiss = p.kiss = true; e.tt = p.tt = 160;   /* поцелуй молодых */
    if (typeof Town !== 'undefined') Town.note(e.name + ' и ' + p.name + ' поженились', Town.byId(e.soc));
    if (S.sfx) S.sfx('ok', .6);
    for (const o of S.ents) if (o !== e && o !== p && alive(o) && Math.abs(o.x - e.x) < 40) { emote(o, 'note', 150); if (!o.sleep && !o.fight && o.carriedBy == null && o.heldBy == null) o.cheerT = 60 + rr(50); }   /* гости радуются */
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
    if (!Houses.floorOK(b, e.nav.f) || !Houses.floorOK(b, cur)) { e.nav = null; e.goal = null; e.tt = Math.min(e.tt, 2); e.txt = 'Этаж разрушен'; emote(e, 'ask', 70); return true; }   /* нужный этаж разрушен — туда не пройти */
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

  /* ---------- добыча, исследование, шахты, ремонт, реакция на то, что строит игрок ---------- */
  /* листва у земли (куст, нижние ветки): там собирают ягоды */
  function nearLeaf(e) {
    const A = S.A, W = S.W, fy = Math.round(e.y); let best = null, bd = 1e9;
    for (let dx = -70; dx <= 70; dx += 2) { const x = Math.floor(e.x) + dx; if (x < 3 || x >= W - 3 || Math.abs(dx) >= bd) continue; for (let y = fy - 14; y <= fy; y++) { const i = y * W + x; if (A.type[i] === E.LEAF && A.burn[i] === 0) { best = { x }; bd = Math.abs(dx); break; } } }
    return best;
  }
  /* что можно прокопать в шахте: почва, камень, лёд и любые растения; постройки, металл, стекло, стены — нельзя */
  const soft = (t) => t === E.EARTH || t === E.SAND || t === E.MUD || t === E.SNOW || t === E.ASH || t === E.SALT || t === E.STONE || t === E.LITTER || t === E.ICE || t === E.SEED || t === E.FSEED || t === E.CONE || t === E.SPROUT || t === E.LEAF || t === E.GUNP;
  /* шаг шахты: выкопать столбец впереди на рост и одну клетку ниже — человечек проходит вперёд и спускается на ступень */
  function shaftStep(e) {
    const W = S.W, A = S.A, cx = Math.floor(e.x), fy = Math.round(e.y), col = cx + e.sh.dir;
    if (col < 3 || col + e.sh.dir < 2 || col + e.sh.dir >= W - 2 || fy + 3 >= S.H - 2 || fy - 14 < 2) { e.sh.why = 'edge'; return false; }
    if (Houses.list.some((b) => col >= b.x0 - 3 && col <= b.x0 + b.w + 3)) { e.sh.why = 'house'; return false; }   /* под домами не копают */
    const powder = (t) => KIND[t] === K.POWDER;
    let stone = 0;
    const mm = Works.mines.find((q) => q.id === e.sh.mine), total = mm ? mm.steps.length : e.sh.steps;
    /* вход — короткая выемка в склоне, дальше над ходом должна остаться толща: иначе это не штольня, а канава */
    if (total >= 12) { let roof = 0; for (let y = fy - 16; y <= fy - 13; y++) { const t = A.type[y * W + col]; if (t !== E.AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER)) roof++; } if (roof < 2) { e.sh.why = 'open'; return false; } }
    const down = total % 6 === 5 ? 1 : 0;
    for (let y = fy - 12; y <= fy + down; y++) {
      const i = y * W + col, t = A.type[i];
      if (t === E.AIR) continue;
      if (KIND[t] === K.LIQUID) { e.sh.why = 'liquid'; return false; }   /* вода или лава — копать дальше опасно */
      if (t === E.WOOD && (A.aux[i] !== 0 || e.sh.shore === col)) { S.put(i, E.AIR); continue; }   /* корни деревьев и своя крепь */
      if (!soft(t) && KIND[t] !== K.GAS) { e.sh.why = t; if (y > fy - 12) return false; continue; }
      if (t === E.STONE) stone++;
      S.put(i, E.AIR);
    }
    /* крепь: потолок над ступенью — балка, сыпучая стенка впереди подпирается досками (их выкопают следующим шагом) */
    { const ci = (fy - 13) * W + col; if (powder(A.type[ci]) || A.type[ci] === E.AIR && powder(A.type[ci - W])) { S.put(ci, E.WOOD); A.aux[ci] = 0; } }
    const nx = col + e.sh.dir; let shored = false;
    for (let y = fy - 12; y <= fy + 1; y++) { const i = y * W + nx; if (powder(A.type[i])) { S.put(i, E.WOOD); A.aux[i] = 0; shored = true; } }
    { const ci = (fy - 13) * W + nx; if (powder(A.type[ci])) { S.put(ci, E.WOOD); A.aux[ci] = 0; } }
    e.sh.shore = shored ? nx : null;
    if (stone) { Town.give(e, 'stone', stone); Town.earn(e, 1); }
    e.x = col + .5; e.sh.steps++;
    if (typeof Works !== 'undefined') {
      let m = Works.mines.find((q) => q.id === e.sh.mine);
      if (!m) { m = Works.newMine(e.soc, e.sh.x0, e.sh.g || fy + 1, e.sh.dir); e.sh.mine = m.id; Town.note(e.name + (e.fem ? ' заложила' : ' заложил') + ' шахту', Town.byId(e.soc)); }
      Works.addStep(m, col, fy + 1);
    }
    return true;
  }
  /* игрок что-то насыпал или налил рядом: опасное пугает, остальное вызывает любопытство */
  const SCARY = new Set([E.FIRE, E.LAVA, E.ACID, E.GUNP, E.GAS, E.OIL]);
  function notice(x, y, n, id) {
    S = S || Sim;
    const scary = SCARY.has(id), name = (typeof ID_NAME !== 'undefined' && ID_NAME[id]) || '';
    let gawk = 0;
    for (const e of S.ents) {
      if (!alive(e) || e.sleep || e.fight) continue;
      const d = Math.abs(e.x - x), dy = Math.abs(e.y - y); if (d > 80 || dy > 60) continue;
      e.dir = sgn(x - e.x);
      if (scary && d < 45) { e.dir = -sgn(x - e.x); e.fear = Math.max(e.fear || 0, 70); e.task = null; e.tt = 0; e.txt = 'Испугался'; emote(e, 'alert', 110); continue; }
      if (scary) { emote(e, 'alert', 80); continue; }
      if (n > 50 && gawk < 3 && rf() < (e.age < 14 ? .9 : .5) && e.task !== 'house' && e.task !== 'repair') {
        gawk++; start(e, 'gawk', e.age < 14 ? 'Бежит посмотреть!' : 'Разглядывает, что появилось', 600, Math.max(4, Math.min(S.W - 5, x + (e.x < x ? -7 : 7)))); e.dur = 150 + rr(120);
        emote(e, e.age < 14 ? 'spark' : 'ask', 100);
      } else emote(e, n > 120 ? 'alert' : 'ask', 80);
    }
  }

  /* ---------- занятия ---------- */


  /* ---------- все, кто когда-либо жил (для семьи и летописи — даже после смерти) ---------- */
  const REG = new Map();
  const anyById = (id) => id == null ? null : (byId(id) || REG.get(id) || null);
  function parentsOf(e) { const a = anyById(e.par), b = anyById(e.par2 != null ? e.par2 : (a && a.mateAtBirth && a.mateAtBirth[e.id])); return [a, b].filter(Boolean); }
  /* родные: родители, дети, братья/сёстры, супруг — живые и умершие */
  function family(e) {
    const out = [], seen = new Set([e.id]), add = (o, rel) => { if (o && !seen.has(o.id)) { seen.add(o.id); out.push({ o, rel }); } };
    for (const p of parentsOf(e)) add(p, p.fem ? 'мама' : 'папа');
    add(anyById(e.mate), e.mst === 2 ? (e.fem ? 'муж' : 'жена') : (e.fem ? 'парень' : 'девушка'));
    for (const o of REG.values()) {
      if (o === e) continue;
      if (o.par === e.id || o.par2 === e.id) add(o, o.fem ? 'дочь' : 'сын');
      else if (e.par != null && (o.par === e.par || (e.par2 != null && o.par2 === e.par2))) add(o, o.fem ? 'сестра' : 'брат');
    }
    for (const id of (e.exes || [])) add(anyById(id), e.fem ? 'бывший' : 'бывшая');
    return out;
  }
  /* личная летопись */
  function plog(e, txt) { if (!e) return; (e.plog || (e.plog = [])).unshift({ t: (typeof Town !== 'undefined' && Town.dayStr) ? Town.dayStr() : '', txt }); if (e.plog.length > 50) e.plog.length = 50; }
  /* где спать в комнате: пара — на общей кровати, остальные — каждый на своём месте */
  function bedSpot(e, b, r) {
    const x0 = Houses.roomX(b, r.i), door = b.nf > 1 && r.i === 0, base = x0 + (door ? 17 : 7);
    const own = r.owners.map(byId).filter((o) => o && alive(o)), groups = [];
    for (const o of own) { if (groups.some((g) => g.includes(o.id))) continue; const m = o.mst === 2 && own.find((q) => q.id === o.mate); groups.push(m ? [o.id, m.id] : [o.id]); }
    groups.sort((a, c) => c.length - a.length || (byId(c[0]).age - byId(a[0]).age));
    const gi = Math.max(0, groups.findIndex((g) => g.includes(e.id))), offs = [0, -6, 5, -11, 9, -3, 3];
    const lo = x0 + (door ? 12 : 2), hi = x0 + Houses.RW - 2;
    return Math.max(lo, Math.min(hi, base + offs[gi % offs.length]));
  }
  /* измена — понятная история: флирт → тайные свидания в стороне от дома (оглядываются, обнимаются) →
     свидетели пересказывают партнёру → сцена: застал или узнал от других; если давно в браке и любит — может простить,
     иначе разрыв; любовники часто сходятся. Если не поймали три раза — изменщик сам уходит к любовнику */
  const ga = (e, m, f) => e.fem ? f : m;
  function split(who, m) {
    who.exes = (who.exes || []).concat(m.id); m.exes = (m.exes || []).concat(who.id);
    who.mate = null; m.mate = null; who.mst = m.mst = 0; who.engaged = m.engaged = false;
  }
  function endAffair(who) {
    if (who.lover != null) { const l = byId(who.lover); if (l) { l.lover = null; if (l.task === 'affair') l.tt = 1; l.hugT = 0; } who.lover = null; }
    if (who.task === 'affair') who.tt = 1; who.hugT = 0;
  }
  /* m узнаёт, что who изменяет с other: how — 'caught' (застал сам) или 'told' (рассказал teller) */
  function caught(who, other, m, how, teller) {
    if (!alive(m) || !alive(who) || who.mate !== m.id) return;
    endAffair(who);
    const T0 = HAS() ? Town.byId(m.soc) : null, married = m.mst === 2;
    emote(m, 'broken', 240); emote(who, 'alert', 130); if (how === 'caught') emote(other, 'alert', 130);
    const forgive = married && (m.rel[who.id] || 0) >= 5 && rf() < .35;
    const head = how === 'caught' ? m.name + ga(m, ' застал ', ' застала ') + who.name + ' с ' + other.name : teller.name + ga(teller, ' рассказал ', ' рассказала ') + m.name + ', что ' + who.name + ' тайно встречается с ' + other.name;
    m.rel[who.id] = (m.rel[who.id] || 0) - (forgive ? 3 : 6); m.rel[other.id] = (m.rel[other.id] || 0) - 5; who.rel[m.id] = (who.rel[m.id] || 0) - 1;
    /* сцена: стоят друг против друга и ругаются */
    start(m, 'quarrel', 'Выясняет отношения с ' + who.name, 200); start(who, 'quarrel', 'Оправдывается перед ' + m.name, 200); m.qw = who.id; who.qw = m.id; who.dir = sgn(m.x - who.x) || 1; m.dir = -who.dir;
    if (forgive) {
      if (HAS()) Town.note(head + '. ' + m.name + ga(m, ' простил', ' простила') + ', но обида осталась', T0, true);
      plog(m, ga(m, 'Простил измену: ', 'Простила измену: ') + who.name + ' и ' + other.name); plog(who, ga(who, 'Прощён после измены с ', 'Прощена после измены с ') + other.name);
      who.crush = null; who.rel[other.id] = Math.min(who.rel[other.id] || 0, 1); who.affN = 0;
      return;
    }
    split(who, m);
    let tog = false;
    if (other.mate == null && alive(other) && rf() < .55) { who.mate = other.id; other.mate = who.id; who.mst = other.mst = 1; tog = true; }
    if (HAS()) Town.note(head + '. Расстались' + (tog ? '; ' + who.name + ' и ' + other.name + ' теперь вместе' : ''), T0, true);
    plog(m, ga(m, 'Узнал об измене и расстался с ', 'Узнала об измене и рассталась с ') + who.name);
    plog(who, ga(who, 'Разоблачён, расстался с ', 'Разоблачена, рассталась с ') + m.name + (tog ? '; теперь вместе с ' + other.name : ''));
    if (how === 'caught' && typeof Combat !== 'undefined' && Combat.start && m.age >= 16 && other.age >= 16 && m.hp > 40 && rf() < .35) { m.qw = null; who.qw = null; Combat.start(m, other, false); Combat.start(other, m, false); }
    else m.sulk = who.id;
  }
  /* свидетель свидания: если это партнёр — сцена сразу; иначе запоминает и пойдёт рассказать */
  function witness(w, who, other) {
    if (who.mate === w.id) { caught(who, other, w, 'caught'); return true; }
    if (who.mate != null && !w.gossip && w.age >= 12 && rf() < .5) { w.gossip = { who: who.id, other: other.id, to: who.mate, t: S.frame }; emote(w, 'alert', 80); plog(w, ga(w, 'Видел', 'Видела') + ', как ' + who.name + ' тайком встречается с ' + other.name); }
    return false;
  }
  /* ---------- пары и переноска ---------- */
  function dropCarry(e) { const p = byId(e.carry); e.carry = null; if (p && p.carriedBy === e.id) { p.carriedBy = null; p.task = null; p.tt = 0; emote(p, 'heart', 60); } }
  function dropKid(e) { const k = byId(e.kidId); e.kidId = null; if (k && (k.heldBy === e.id || k.rideOn === e.id)) { k.heldBy = null; k.rideOn = null; k.task = null; k.tt = 0; } }
  /* кого несут — стоит там же, где несущий; несущий пропал или занялся другим — опускает */
  function attached(e) {
    const id = e.carriedBy != null ? e.carriedBy : e.heldBy != null ? e.heldBy : e.rideOn, c = byId(id);
    const ok = c && alive(c) && !c.sleep && !c.fight && (e.carriedBy != null ? c.carry === e.id : (c.task === 'carrykid' && c.kidId === e.id));
    if (!ok) { e.carriedBy = null; e.heldBy = null; e.rideOn = null; if (e.task === 'carried' || e.task === 'held') { e.task = null; e.tt = 0; } return false; }
    e.x = c.x; e.y = c.y; e.vy = 0; e.dir = c.dir; e.idle = 1; e.goal = null; e.sleep = 0;
    return true;
  }
  /* поставить двоих лицом друг к другу на расстоянии ~6 клеток (рукопожатие, игра) */
  function pairUp(e, o, task, txt, tt) {
    const m = (e.x + o.x) / 2, side = e.x < o.x ? -1 : 1;
    start(e, task, txt + o.name, 700, m + side * 2.9); start(o, task, txt + e.name, 700, m - side * 2.9); e.dur = tt; o.dur = tt;
  }
  function pairRps(e, o) {
    pairUp(e, o, 'rps', 'Играет в камень-ножницы-бумагу с ', 500);
    e.rps = { t0: null, k: [rr(3), rr(3), rr(3)] }; o.rps = { t0: null, k: [rr(3), rr(3), rr(3)] }; e.rpsWith = o.id; o.rpsWith = e.id;
  }
  /* помахать знакомому издалека (одной рукой или двумя); тот машет в ответ чуть позже */
  const WAVE_OK = new Set(['wander', 'together', 'explore', 'rest', 'bench', 'follow', 'play', 'camp', 'stars']);
  function waveCheck(e) {
    if (e.waveT > 0) { e.waveT--; if (e.waveDelay > 0) e.waveDelay--; return; }
    if ((S.frame + e.id * 7) % 90 || e.sleep || e.fight || e.carriedBy != null || e.heldBy != null || e.age < 4 || !WAVE_OK.has(e.task)) return;
    for (const o of S.ents) {
      if (o === e || !alive(o) || o.sleep || o.fight || o.waveT > 0 || o.carriedBy != null) continue;
      const dx = o.x - e.x; if (Math.abs(dx) < 10 || Math.abs(dx) > 45 || Math.abs(o.y - e.y) > 8) continue;
      if ((e.rel[o.id] || 0) < 1.5 && o.par !== e.id && e.par !== o.id) continue;
      if (rf() > .3) continue;
      e.waveT = 70; e.waveDelay = 0; e.waveTwo = rf() < .35; if (e.idle || e.task === 'wander') e.dir = sgn(dx);
      o.waveT = 90; o.waveDelay = 14 + rr(10); o.waveTwo = rf() < .35; if (o.idle || o.task === 'wander') o.dir = -sgn(dx);
      break;
    }
  }
  /* редкие трюки: сальто, кувырок, ползком, пробежка */
  function trick(e) {
    const r = rf(), k = r < .2 ? 'flip' : r < .45 ? 'roll' : r < .62 ? 'crawl' : 'sprint';
    e.trick = { k, t: 0, n: { flip: 30, roll: 36, crawl: 150, sprint: 130 }[k] }; if (k === 'flip') e.jump = true;
  }
  /* цветок рядом: лепестки (листва с цветом 9..16) у самой земли */
  function nearFlower(e) {
    const A = S.A, W = S.W, fy = Math.round(e.y); let best = null, bd = 61;
    for (let dx = -60; dx <= 60; dx += 1) { const x = Math.floor(e.x) + dx; if (x < 2 || x >= W - 2 || Math.abs(dx) >= bd) continue;
      for (let y = fy - 6; y <= fy + 1; y++) { const i = y * W + x; if (A.type[i] === E.LEAF && A.aux[i] >= 9 && A.aux[i] <= 16) { best = { x, y, c: A.aux[i] }; bd = Math.abs(dx); break; } } }
    return best;
  }
  function pickFlower(e) {
    const f = e.fl; if (!f) return; let got = false;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const i = (f.y + dy) * S.W + f.x + dx; if (S.A.type[i] === E.LEAF && S.A.aux[i] >= 9 && S.A.aux[i] <= 17) { S.put(i, E.AIR); got = true; } }
    e.hold = { k: 'flower', c: f.c - 9 }; e.holdT = null; e.txt = 'Нюхает цветок'; if (got) emote(e, 'heart', 50);
  }
  function start(e, id, txt, tt, goal) { if (e.carry != null) dropCarry(e); if (e.kidId != null) dropKid(e); e.sitT = 0; e.restSit = false; e.greet = null; e.greetWait = false; e.rps = null; e.hugT = 0; e.hugWith = null; e.kiss = false; e.dockSit = false; e.aimAt = null; e.job = null; e.hurry = false; e.badGraves = null; if (e.grave != null) { const b = byId(e.bt); if (b && b.dragBy === e.id) b.dragBy = null; e.grave = null; } e.fin = null; e.nav = null; e.dur = 0; e.bc = null; e.done = false; e.task = id; e.txt = txt; e.tt = tt; e.goal = goal == null ? null : goal; e.phase = goal == null ? 'do' : 'go'; e.sleep = 0; e.idle = 0; }
  function pick(e) {
    const tod = S.tod === undefined ? .4 : S.tod, night = tod > .85 || tod < .2, dusk = tod > .7 && tod <= .85, kid = e.age < 14, elder = e.age >= 62;
    const hx = Math.floor(e.x);
    if (night && tod > .86 && tod < .93 && !kid && rf() < .08) { start(e, 'stars', 'Смотрит на звёзды', 300 + rr(200)); return; }
    if (night && HAS()) { const hh = Town.homeOf(e); if (hh) { goRoom(e, { b: hh.b, r: hh.r, ri: e.home.r }, 'sleep', 'Идёт домой спать', 99999, 99999, true); { const bx = bedSpot(e, hh.b, hh.r); if (e.nav) e.nav.x = bx; e.goal = bx; } return; } }
    if (night) { const h = homeNear(e); start(e, 'sleep', h ? 'Идёт домой спать' : 'Устраивается спать', 99999, h ? h.x : null); return; }
    if (kid) {
      const par = byId(e.par), r = rf();
      if (HAS() && e.age >= 6 && tod < .65 && r < .3) { const pl = Town.place(e, 'library'); if (pl) { goRoom(e, pl, 'learn', 'Учится в библиотеке', 1200, 360 + rr(200)); e.fin = () => { e.smart = (e.smart || 0) + 1; }; return; } }
      if (par && alive(par) && r < .45) { start(e, 'follow', 'Идёт за ' + par.name, 200 + rr(200)); return; }
      { const k2 = S.ents.find((o) => o !== e && alive(o) && o.age < 14 && o.age >= 4 && Math.abs(o.x - e.x) < 40 && !o.sleep && o.heldBy == null && o.rideOn == null && o.task !== 'held'); if (k2 && e.age >= 4 && r < .14) { pairRps(e, k2); return; } }
      { const k2 = S.ents.find((o) => o !== e && alive(o) && o.age < 14 && Math.abs(o.x - e.x) < 40 && !o.sleep); if (k2 && r < .65) { start(e, 'tag', 'Играет в догонялки с ' + k2.name, 260 + rr(160)); e.chase = k2.id; if (k2.task !== 'tag') { start(k2, 'tag', 'Убегает от ' + e.name, e.tt); k2.flee = e.id; k2.chase = null; } return; } }
      if (r < .85) { start(e, 'play', 'Играет', 160 + rr(200)); return; }
      start(e, 'rest', 'Отдыхает', 120 + rr(120)); return;
    }
    const mate = byId(e.mate), opts = [['wander', 3], ['rest', elder ? 3 : 1.2]];
    const friend = someoneNear(e, 14); if (friend) { opts.push(['chat', 2.4]); if (friend.age >= 14 && !friend.preg) opts.push(['rps', .6, friend]); }
    { const bs = HAS() && typeof Works !== 'undefined' && Works.benchNear ? Works.benchNear(e.x, 90) : null; if (bs) opts.push(['bench', elder ? 3 : e.preg ? 2.5 : 1, bs]); }
    if (!dusk) { const fl = nearFlower(e); if (fl) opts.push(['flower', .8 + (mate && alive(mate) ? .9 : 0), fl]); }
    if (!dusk) { const kd = S.ents.find((o) => alive(o) && o.age < 8 && (o.par === e.id || (e.mate != null && o.par === e.mate)) && o.heldBy == null && o.rideOn == null && !o.sleep && Math.abs(o.x - e.x) < 40); if (kd && !e.preg) opts.push(['carrykid', kd.age < 4 ? 3 : 1.6, kd]); }
    { const b = corpseNear(e); if (b && rf() < .6) opts.push(['bury', 12, b]); }
    if (e.age >= 14) { const v = victimNear(e, e.prof === 'doctor' ? 150 : 45); if (v) opts.push(['heal', e.prof === 'doctor' ? 40 : 9, v]); }
    if (e.prof === 'farmer' && !dusk && !elder && (S.plants || []).length < 18 && rf() < .12) { const sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1; if (sea === 0 || sea === 1) { const ts = treeSpot(e); if (ts) opts.push(['planttree', 1.5, ts]); } }
    if (e.gossip) { const g = e.gossip, to = byId(g.to), who = byId(g.who); if (!to || !who || !alive(to) || !alive(who) || who.mate !== to.id || S.frame - g.t > 6000) e.gossip = null; else opts.push(['tell', 8, to]); }
    if (mate && alive(mate) && e.age >= 18 && !dusk && Math.abs(mate.x - e.x) > 25) { const lv = S.ents.find((o) => o !== e && o !== mate && alive(o) && o.age >= 18 && o.fem !== e.fem && (e.rel[o.id] || 0) >= 3 && (o.rel[e.id] || 0) >= 2 && Math.abs(o.x - e.x) < 80 && !o.sleep && !o.fight && o.carriedBy == null); if (lv) opts.push(['affair', .35 + ((e.rel[mate.id] || 0) < 2 ? .9 : 0), lv]); }
    if (mate && alive(mate)) { opts.push(['together', 2]); if (e.mst === 1 && (e.rel[mate.id] || 0) >= 5 && rf() < .6) { if (!e.engaged) opts.push(['propose', 7]); else if (S.homes.length) opts.push(['wed', 9]); } }
    if (dusk) {
      const c = campNear(e), hh = hearth(e); if (hh) opts.push(['hearth', 6, hh]); if (c) { opts.push(['camp', 5]); opts.push(['dance', 2.5]); } else if (!elder && (safeFire(hx + 6, Math.round(e.y)) || safeFire(hx - 6, Math.round(e.y)))) opts.push(['fire', hh ? 1 : 4]);
    } else {
      if (!elder) { const tr = nearTree(e); if (tr) { const sc = HAS() && Town.byId(e.soc), need = sc && ((sc.want && sc.wood < sc.want.wood) || sc.wood < 20); opts.push(['chop', 2.4 + (need ? 3 : 0), tr]); } }
      const wt = nearWater(e); if (wt) opts.push(['fish', e.form === 'pirate' ? 4 : 1, wt]);
      if (typeof Works !== 'undefined') { const ds = Works.fishSpot(e); if (ds) opts.push(['dockfish', e.prof === 'fisher' || e.prof === 'pirate' ? 6 : 1.8, ds]); }
      if (typeof Works !== 'undefined' && HAS() && e.prof === 'pirate' && !elder) {
        const sc = Town.byId(e.soc), mine = Works.docks.find((o) => o.soc === e.soc);
        if (mine && !mine.done) opts.push(['dockwork', 9, mine]);
        else if (!mine && sc && sc.wood >= 6) { const sh = Works.findShore(Town.center(sc) || e.x, 150); if (sh) opts.push(['dock', 8, sh]); }
      }
      /* распорядок: утром зарядка, днём обед, в гости к друзьям */
      if (tod > .26 && tod < .36 && !elder) opts.push(['exercise', 1.4]);
      if (HAS() && ((tod > .46 && tod < .56) || (tod > .68 && tod < .76))) opts.push(['eat', 3]);
      if (HAS()) { const fr = S.ents.filter((o) => o !== e && alive(o) && (e.rel[o.id] || 0) >= 2 && Town.homeOf(o)); if (fr.length && rf() < .5) opts.push(['visit', 1.2, fr[rr(fr.length)]]); }
      if (!HAS() && !elder && !homeNear(e) && S.homes.length < Math.max(1, Math.floor(S.ents.filter(alive).length / 3))) opts.push(['build', 1.1]);
    }
    const sea0 = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1;
    /* оружие: в опасности (зомби рядом, общество воюет) — срочно, иначе изредка; из дерева и камня общества */
    if (HAS() && typeof Combat !== 'undefined' && e.age >= 16 && !e.weapon && !elder) { const sc = Town.byId(e.soc); if (sc && sc.wood >= 3) { const dg = Combat.danger(e); if (dg || rf() < .12) opts.push(['arm', dg ? 8 : .6]); } }
    if (HAS() && e.age >= 16) {
      const sc = Town.byId(e.soc), nm = sc ? Town.members(sc).length : 1;
      { const db = Houses.list.find((b) => b.soc === e.soc && Houses.damaged(b)); if (db && !elder) opts.push(['repair', e.prof === 'builder' ? 12 : 3, db]); }
      if (!dusk) {
        opts.push(['explore', .6 + (e.cha || 0) * .8]);
        if (sc && sc.water < nm * 3) { const w3 = nearWater(e); if (w3) opts.push(['water', sc.water < nm ? 5 : 2.5, w3]); }
        if (typeof Works !== 'undefined' && !elder) { const gj = Works.gardenJob(e); if (gj) opts.push(['garden', (e.prof === 'farmer' ? 7 : 0) + (sc && sc.food < nm * 3 ? (sc.food < nm ? 4 : 2) : .5), gj]); }
        if (typeof Works !== 'undefined' && !elder && e.age >= 16 && ((e.seed | 0) % 3 === 0 || e.prof === 'farmer') && !dusk) { const bd = Works.birdNear(e.x, 60); if (bd && !S.ents.some((o) => o.task === 'hunt' && o.bird === bd.id)) opts.push(['hunt', sc && sc.food < nm * 3 ? 6 : 2.5, bd]); }
        if (e.prof === 'mason' && !elder) opts.push(['shaft', nearStone(e) ? 1.2 : 4]);
        /* громоотвод за деревней: когда у общества есть дом и уже бывали грозы (иногда и просто так) */
        if (typeof Works !== 'undefined' && sc && !elder && nm >= 2 && rf() < .25 && !Works.rods.some((r) => r.soc === sc.id) && (sc.stone >= 3 || sc.bank >= 6) && Houses.list.some((b) => b.soc === sc.id && b.done)) { const rs = Works.rodSite(sc.id, Town.center(sc) || e.x); if (rs) opts.push(['rod', S.stats.lightning ? 6 : .8, rs]); }
      }
      const pr = e.prof || 'none', st = Town.site(e);
      if (st && !elder) opts.push(['house', pr === 'builder' ? 10 : 2.2, st]);
      if (!dusk) {
        if (pr === 'mason') { const sn = nearStone(e); if (sn) opts.push(['quarry', 5, sn]); }
        if (pr === 'trader') opts.push(['trade', 4]);
        const civ = { priest: 'church', scholar: 'library', crafter: 'workshop' }[pr]; if (civ) { const pl = Town.place(e, civ); if (pl) opts.push(['job', 7, pl, civ]); }
        if (tod > .26 && tod < .45 && pr !== 'priest') { const pl = Town.place(e, 'church'); if (pl) opts.push(['pray', 2.2, pl]); }
        { const pl = Town.place(e, 'library'); if (pl) opts.push(['read', pr === 'scholar' ? 0 : .8, pl]); }
      } else { const pl = Town.place(e, 'tavern'); if (pl) opts.push(pr === 'barkeep' ? ['job', 9, pl, 'tavern'] : ['drink', 4, pl]); }
    }
    /* время года и погода меняют привычки: зимой — костры, летом — купание, весной — посадки, в дождь — под крышу */
    { const sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1, wet = S.weather > 0;
      if (sea === 3 && !dusk) { const c = campNear(e), hh = hearth(e); if (hh) opts.push(['hearth', 4, hh]); if (c) opts.push(['camp', 3.5]); else if (!elder && (safeFire(hx + 6, Math.round(e.y)) || safeFire(hx - 6, Math.round(e.y)))) opts.push(['fire', hh ? .6 : 2.2]); }
      if (sea === 1 && !dusk && !wet) { const w2 = nearWater(e); if (w2) opts.push(['swim', 3.2, w2]); }
      if (wet) { const hh = HAS() && Town.homeOf(e); if (hh) opts.push(['shelterH', 6, hh]); else { const hm = homeNear(e); if (hm) opts.push(['shelter', 6, hm]); } }
      for (const o of opts) { if (o[0] === 'chop' && sea === 2) o[1] *= 2.4; if (o[0] === 'fish' && sea === 3) o[1] *= .25; if (o[0] === 'chop' && e.prof === 'lumber') o[1] *= 3.5; if (o[0] === 'fish' && e.prof === 'fisher') o[1] *= 3.5; } }
    if (e.preg) for (const o of opts) if (['chop', 'quarry', 'shaft', 'house', 'repair', 'dockwork', 'dock', 'arm', 'explore', 'build', 'rod'].includes(o[0])) o[1] *= .15;
    let tot = 0; for (const o of opts) tot += o[1]; let r = rf() * tot, ch = opts[0];
    for (const o of opts) { r -= o[1]; if (r <= 0) { ch = o; break; } }
    switch (ch[0]) {
      case 'wander': start(e, 'wander', elder ? 'Гуляет с тростью' : 'Гуляет', 200 + rr(300)); break;
      case 'rest': start(e, 'rest', 'Отдыхает', 150 + rr(200)); e.restSit = rf() < .6; if (e.restSit) e.txt = 'Сидит на земле, отдыхает'; break;
      case 'rps': { const o = ch[2]; if (!alive(o) || o.sleep || o.fight) { start(e, 'rest', 'Отдыхает', 150); break; } pairRps(e, o); break; }
      case 'propose': { const m = mate; if (!alive(m) || m.sleep || m.fight) { start(e, 'wander', 'Гуляет', 200); break; }
        start(e, 'propose', 'Идёт делать предложение ' + m.name, 900, m.x + (e.x < m.x ? -5 : 5)); e.dur = 230; e.pid = m.id; start(m, 'proposed', 'Ждёт ' + e.name, 1400); m.pid = e.id;
        e.fin = () => { const q = byId(e.pid); if (!q || !alive(q)) return;
          if (rf() < .9) { e.engaged = q.engaged = true; e.rel[q.id] = (e.rel[q.id] || 0) + 2; q.rel[e.id] = (q.rel[e.id] || 0) + 2; emote(e, 'heart', 150); emote(q, 'heart', 150); if (HAS()) Town.note(e.name + (e.fem ? ' сделала' : ' сделал') + ' предложение ' + q.name + ' — ' + (q.fem ? 'она согласилась' : 'он согласился') + '!', Town.byId(e.soc), true); }
          else { emote(e, 'broken', 120); emote(q, 'ask', 80); e.rel[q.id] = (e.rel[q.id] || 0) - 1; }
          q.tt = Math.min(q.tt, 40); };
        break; }
      case 'tell': { const to = ch[2]; start(e, 'tell', 'Идёт рассказать ' + to.name + ' новость', 900, to.x + (e.x < to.x ? -3 : 3)); e.dur = 120; e.tellTo = to.id; break; }
      case 'affair': { const o = ch[2]; if (!alive(o) || o.sleep || o.fight) { start(e, 'wander', 'Гуляет', 200); break; }
        let m0 = (e.x + o.x) / 2; const mt = byId(e.mate); if (mt && Math.abs(mt.x - m0) < 45) m0 = Math.max(8, Math.min(S.W - 9, m0 + (m0 >= mt.x ? 1 : -1) * 35));   /* подальше от партнёра */
        const sd = e.x < o.x ? -1 : 1; start(e, 'affair', 'Украдкой идёт к ' + o.name, 900, m0 + sd * 2); start(o, 'affair', 'Украдкой идёт к ' + e.name, 900, m0 - sd * 2);
        e.dur = o.dur = 260 + rr(160); e.lover = o.id; o.lover = e.id; e.sneak = o.sneak = 70; break; }
      case 'bench': { const bs = ch[2], seats = [bs.x - 4.6, bs.x + 4.6], free = seats.filter((x) => !S.ents.some((o) => o !== e && alive(o) && o.task === 'bench' && Math.abs((o.goal != null ? o.goal : o.x) - x) < 1));
        if (!free.length) { start(e, 'rest', 'Отдыхает', 200); e.restSit = true; break; }
        start(e, 'bench', 'Идёт посидеть на лавочке', 800, free[rr(free.length)]); e.dur = 300 + rr(400); e.bdir = rf() < .5 ? -1 : 1; break; }
      case 'flower': { const f = ch[2]; start(e, 'flower', 'Идёт за цветком', 900, f.x + (e.x < f.x ? -2 : 2)); e.dur = 200; e.fl = f; e.hold = null; break; }
      case 'carrykid': { const kd = ch[2]; start(e, 'carrykid', 'Идёт к ' + kd.name, 600, kd.x + (e.x < kd.x ? -1.2 : 1.2)); e.dur = 300 + rr(260); e.kidId = kd.id; break; }
      case 'chat': { const o = friend; pairUp(e, o, 'chat', 'Болтает с ', 200 + rr(120)); e.chatWith = o.id; o.chatWith = e.id; emote(e, 'talk', 60); if (e.age >= 14 && o.age >= 14 && (e.rel[o.id] || 0) < 2 && e.mate !== o.id) { e.greetWait = true; o.greetWait = true; } break; }
      case 'together': start(e, 'together', 'Гуляет с ' + mate.name, 260 + rr(200)); e.rel[mate.id] = (e.rel[mate.id] || 0) + .5; break;
      case 'wed': {
        const hm = S.homes.reduce((a, b) => (!a || Math.abs(b.x - e.x) < Math.abs(a.x - e.x)) ? b : a, null);
        start(e, 'wed', 'Идёт жениться', 900, hm.x + (e.fem ? -2 : 2)); e.dur = 190;
        if (mate.task !== 'wed' && alive(mate)) { start(mate, 'wed', 'Идёт жениться', 900, hm.x + (mate.fem ? -2 : 2)); mate.dur = 190; }
        break;
      }
      case 'camp': { const c = campNear(e); start(e, 'camp', 'Греется у костра', 500 + rr(400), campSeat(e, c)); break; }
      case 'fire': { const sd = safeFire(hx + 6, Math.round(e.y)) ? 1 : -1; start(e, 'fire', 'Разжигает костёр', 200, hx + sd * 6); e.dur = 90; break; }
      case 'hearth': goRoom(e, ch[2], 'camp', 'Греется у очага', 1200, 500 + rr(400)); break;
      case 'chop': { const tr = ch[2]; start(e, 'chop', 'Идёт рубить дерево', 700, tr.x + (e.x < tr.x ? -2 : 2)); e.tx = tr.x; e.dur = 200; break; }
      case 'fish': { const w = ch[2]; start(e, 'fish', 'Идёт на рыбалку', 900, w.x); e.dur = 420; e.wx = w.wx; break; }
      case 'swim': { const w = ch[2]; start(e, 'swim', 'Идёт купаться', 700, w.wx); e.dur = 360; break; }
      case 'sow': start(e, 'sow', 'Сажает семена', 420); break;
      case 'shelter': { const hm = ch[2]; start(e, 'shelter', 'Прячется от дождя', 600, hm.x + (rf() < .5 ? -2 : 2)); e.dur = 500; break; }
      case 'bury': { const b = ch[2]; start(e, 'bury', 'Идёт хоронить ' + b.name, 900, b.x + (e.x < b.x ? -2.5 : 2.5)); e.bt = b.id; e.grave = null; e.dur = 160; b.claim = e.id; break; }
      case 'house': { const b = ch[2]; start(e, 'house', 'Идёт на стройку', 900, b.x0 + 3 + rf() * (b.w - 6)); e.dur = 420 + rr(200); e.bid = b.id; break; }
      case 'quarry': { const sn = ch[2]; start(e, 'quarry', 'Идёт добывать камень', 800, sn.x + (e.x < sn.x ? -2 : 2)); e.dur = 180; e.tx = sn.x; e.ty = sn.y; break; }
      case 'trade': {
        const sc = Town.byId(e.soc), m = sc ? Town.members(sc).filter((o) => o !== e) : [], o = m.length ? m[rr(m.length)] : null;
        start(e, 'trade', o ? 'Торгует с ' + o.name : 'Торгует', 700, o ? o.x + (e.x < o.x ? -3 : 3) : null); e.dur = 200;
        e.fin = () => { Town.earn(e, 5); emote(e, 'money', 90); if (o) e.rel[o.id] = (e.rel[o.id] || 0) + .3; }; break;
      }
      case 'arm': start(e, 'arm', 'Мастерит оружие', 240 + rr(120)); e.fin = () => { const w = Combat.craft(e, Town.byId(e.soc)); if (w) { emote(e, 'spark', 110); Town.note(e.name + ' сделал' + (e.fem ? 'а' : '') + ' себе ' + Combat.WEAP[w].n.toLowerCase(), Town.byId(e.soc)); } }; break;
      case 'repair': { const b = ch[2]; start(e, 'repair', 'Идёт чинить ' + b.name.toLowerCase(), 900, b.x0 + 3 + rf() * (b.w - 6)); e.dur = 360 + rr(200); e.bid = b.id; break; }
      case 'explore': {
        const d = rf() < .5 ? -1 : 1, tx = Math.max(5, Math.min(S.W - 6, e.x + d * (60 + rr(110))));
        start(e, 'explore', 'Исследует мир', 1600, tx); e.dur = 90 + rr(90);
        e.fin = () => { if (rf() < .35) { const f = nearWater(e) ? 'воду' : nearStone(e) ? 'камень' : nearTree(e) ? 'лес' : null; if (f) { emote(e, 'spark', 100); Town.note(e.name + (e.fem ? ' нашла ' : ' нашёл ') + f + ' в походе', Town.byId(e.soc)); } } }; break;
      }
      case 'rod': { const rs = ch[2]; start(e, 'rod', 'Идёт ставить громоотвод', 1500, rs.x + (e.x < rs.x ? -1.5 : 1.5)); e.dur = 260;
        e.fin = () => { const sc = Town.byId(e.soc); if (!sc || Works.rods.some((r) => r.soc === sc.id)) return; if (Works.buildRod(sc.id, rs.x)) { if (sc.stone >= 3) sc.stone -= 3; else sc.bank = Math.max(0, sc.bank - 6); Town.note(e.name + (e.fem ? ' поставила' : ' поставил') + ' громоотвод за деревней', sc); emote(e, 'spark', 100); } }; break; }
      case 'water': { const w = ch[2]; start(e, 'water', 'Идёт за водой', 900, w.x); e.dur = 140; e.fin = () => { Town.give(e, 'water', 5); emote(e, 'note', 60); }; break; }
      case 'forage': { const l = ch[2]; start(e, 'forage', 'Собирает ягоды', 900, l.x + (e.x < l.x ? -1 : 1)); e.dur = 220; e.fin = () => { Town.give(e, 'food', 4); emote(e, 'meat', 70); }; break; }
      case 'shaft': {
        const mine = typeof Works !== 'undefined' ? Works.mineNear(e.soc, e.x) : null;
        if (mine && !mine.done && mine.steps.length && mine.steps.length < 70) { const end = mine.steps[mine.steps.length - 1]; start(e, 'shaft', 'Спускается в шахту', 1600, end[0] + .5); e.dur = 3000; e.sh = { x0: mine.x0, dir: mine.dir, steps: 0, max: 8 + rr(16), mine: mine.id }; }
        else {
          /* место под шахту — только у подножия склона: склон поднимается на 6+ за 6 клеток и на 16+ за 12, ход идёт в холм, не под домами */
          const top = (x) => { for (let y = 4; y < S.H - 1; y++) { const t = S.A.type[y * S.W + x]; if (t !== E.AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER) && t !== E.LEAF && !(t === E.WOOD && S.A.aux[y * S.W + x] !== 0)) return y; } return S.H; };
          const face = (x, d) => { if (x < 8 || x > S.W - 9 || x + d * 26 < 4 || x + d * 26 > S.W - 5) return false; if (Houses.list.some((b) => Math.min(x, x + d * 26) < b.x0 + b.w + 4 && Math.max(x, x + d * 26) > b.x0 - 4)) return false; if (Works.mines.some((m) => Math.abs(m.x0 - x) < 24)) return false; { const g = top(x); for (let k = 1; k <= 3; k++) { const t = S.A.type[(g - k) * S.W + x]; if (KIND[t] === K.LIQUID) return false; } }   /* вход не под водой */ return top(x) - top(x + d * 6) >= 6 && top(x) - top(x + d * 12) >= 16; };
          let spot = null; for (let off = 0; off < 140 && !spot; off += 3) for (const sg of [1, -1]) { const x = Math.round(e.x + sg * off); for (const d of [1, -1]) if (face(x, d)) { spot = [x, d]; break; } if (spot) break; }
          if (!spot) { const sn = nearStone(e); if (sn) start(e, 'quarry', 'Идёт добывать камень', 800, sn.x + (e.x < sn.x ? -2 : 2)), e.dur = 180, e.tx = sn.x, e.ty = sn.y; else start(e, 'wander', 'Гуляет', 200); break; }
          start(e, 'shaft', 'Идёт копать штольню', 1200, spot[0]); e.dur = 3000; e.sh = { x0: spot[0], dir: spot[1], steps: 0, max: 10 + rr(14), mine: null };
        }
        break;
      }
      case 'dock': { const o = Works.newDock(e.soc, ch[2]); Town.note(e.name + (e.fem ? ' начала' : ' начал') + ' строить причал', Town.byId(e.soc)); start(e, 'dockwork', 'Строит причал', 900, o.x0 + .5); e.dur = 700; e.did = o.id; break; }
      case 'dockwork': { const o = ch[2]; start(e, 'dockwork', 'Строит причал', 900, o.x0 + .5); e.dur = 700; e.did = o.id; break; }
      case 'dockfish': { const ds = ch[2]; start(e, 'fish', 'Идёт рыбачить на причал', 1200, ds.x); e.dur = 480; e.wx = ds.wx; e.dockSit = !!ds.edge; break; }
      case 'exercise': start(e, 'exercise', 'Делает зарядку', 200 + rr(80)); break;
      case 'eat': { const hh = Town.homeOf(e), hr = hearth(e); if (hr) goRoom(e, hr, 'eat', 'Обедает', 900, 220); else if (hh) goRoom(e, { b: hh.b, r: hh.r, ri: e.home.r }, 'eat', 'Ест дома', 900, 220); else start(e, 'eat', 'Перекусывает', 200); e.fin = () => { const sc = Town.byId(e.soc); if (sc && (sc.food || 0) < .6) { emote(e, 'down', 70); e.txt = 'Нечего есть'; return; } if (sc) sc.food = Math.max(0, (sc.food || 0) - .6); e.meal = (typeof Sky !== 'undefined' ? Sky.day + Sky.time : 0); emote(e, 'meat', 70); e.hp = Math.min((e.ab && e.ab.hp) || 100, e.hp + 8); }; break; }
      case 'visit': { const o = ch[2], hh = Town.homeOf(o); goRoom(e, { b: hh.b, r: hh.r, ri: o.home.r }, 'visit', 'В гостях у ' + o.name, 1200, 300 + rr(200)); e.fin = () => { e.rel[o.id] = (e.rel[o.id] || 0) + .7; o.rel[e.id] = (o.rel[e.id] || 0) + .4; emote(e, 'heart', 70); }; break; }
      case 'dance': { const c = campNear(e); start(e, 'dance', 'Танцует у костра', 600, campSeat(e, c)); e.dspot = e.goal; e.dur = 260 + rr(160); e.fin = () => { for (const o of S.ents) if (o !== e && alive(o) && o.task === 'dance' && Math.abs(o.x - e.x) < 20) e.rel[o.id] = (e.rel[o.id] || 0) + .4; }; break; }
      case 'stars': start(e, 'stars', 'Смотрит на звёзды', 300 + rr(200)); break;
      case 'tag': { const o = ch[2]; start(e, 'tag', 'Играет в догонялки с ' + o.name, 260 + rr(160)); e.chase = o.id; if (o.task !== 'tag') { start(o, 'tag', 'Убегает от ' + e.name, e.tt); o.flee = e.id; } break; }
      case 'heal': startHeal(e, ch[2]); break;
      case 'planttree': { const ts = ch[2]; start(e, 'planttree', 'Идёт сажать дерево', 900, ts.x + (e.x < ts.x ? -2.5 : 2.5)); e.dur = 220; e.tspot = ts; e.tkind = rf() < .35 ? E.CONE : E.SEED; break; }
      case 'garden': { const j = ch[2], q = Works.bedOf(j); if (!q) { start(e, 'wander', 'Гуляет', 200); break; }
        const txt = { hoe: 'Вскапывает грядку', plant: 'Сажает ' + Works.CROP_RU[q.crop], water: 'Поливает огород', harvest: 'Собирает урожай' }[j.act];
        start(e, 'garden', txt, 900, q.x + (e.x < q.x ? -3 : 3)); e.dur = { hoe: 200, plant: 150, water: 130, harvest: 120 }[j.act]; e.job = j; break; }
      case 'hunt': { const bd = ch[2]; start(e, 'hunt', 'Охотится на птицу', 1400, Math.max(4, Math.min(S.W - 5, bd.x + bd.vx * 30))); e.dur = 0; e.bird = bd.id; e.shots = 0; e.t2 = 20; e.pickT = 0; break; }
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
    if (S.ents.filter((o) => alive(o) && Math.abs(o.x - x) < 7 && Math.abs(o.y - y) < 8).length > 1) return false;   /* рядом стоит кто-то кроме разжигающего — не разводит */
    if (HAS() && Houses.list.some((b) => x > b.x0 - 9 && x < b.x0 + b.w + 9)) return false;
    for (let dy = -6; dy <= 1; dy++) for (let dx = -3; dx <= 3; dx++) { const i = (y + dy) * S.W + x + dx; if (FLAM.has(S.A.type[i]) && !(dy === 1)) return false; }
    /* над костром жар и искры поднимаются высоко: в 10 клетках вбок и 35 вверх не должно быть крон и стволов, иначе загорится лес */
    for (let dy = -40; dy <= 1; dy += 2) { if (y + dy < 1) break; for (let dx = -16; dx <= 16; dx += 2) { const xx = x + dx; if (xx < 1 || xx >= S.W - 1) continue; const t = S.A.type[(y + dy) * S.W + xx]; if (t === E.LEAF || t === E.WOOD) return false; } }
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
    if (e.task === 'bury' && e.grave != null && e.phase === 'go' && e.goal == null) { rerouteGrave(e); return; }
    if (e.task === 'heal' && e.phase === 'go' && e.goal == null) { e.cantReach = e.healT; e.hurry = false; e.tt = 0; emote(e, 'ask', 60); return; }   /* к пострадавшему не пройти — больше не рвётся */   /* путь закрыт (стена, постройка, обрыв) */
    if (e.task === 'bury' && e.grave != null && e.phase === 'go') { const b = byId(e.bt); if (b && b.dead && b.dragBy === e.id) { const tx = e.x - (sgn(e.grave - e.x) || 1) * 2.5; b.x += (tx - b.x) * .2; b.y = e.y; b.ry = e.y; b.vy = 0; } }   /* тащит тело за собой — плавно, позади по ходу */
    /* движение к цели */
    /* цель не даётся (10 с почти не двигается) — бросает затею; ночью ложится спать где стоит */
    if (e.goal != null && e.phase === 'go') {
      if (e.gx == null || Math.abs(e.x - e.gx) > 2 || Math.abs(e.y - e.gy) > 2) { e.gx = e.x; e.gy = e.y; e.gt = 0; }
      else if (++e.gt % 80 === 0 && e.gt < 400 && !e.air) e.jump = true;   /* упёрся — пробует перепрыгнуть */
      else if (e.gt > 400) { e.gx = null; e.goal = null; e.nav = null; emote(e, 'ask', 70); if (e.task === 'bury' && e.grave != null) { rerouteGrave(e); return; } if (e.task === 'sleep') { e.phase = 'do'; e.sleep = 1; e.txt = 'Спит где пришлось'; } else e.tt = 0; return; }
    } else e.gx = null;
    if (e.goal != null && e.phase === 'go' && navStep(e)) return;
    if (e.goal != null && e.phase === 'go') {
      if (Math.abs(e.goal - e.x) < 1.4) { e.phase = 'do'; e.idle = 1; e.tt = e.dur || e.tt; e.goal = null; if (e.task === 'chop') e.txt = 'Рубит дерево'; else if (e.task === 'fish') e.txt = 'Рыбачит'; else if (e.task === 'build') { e.txt = 'Строит дом'; e.bi = 0; e.bc = []; const s = e.site, g = s.g; for (let y = g - 1; y >= g - 13; y--) e.bc.push([s.x0, y]); e.bc.push([s.x0 + 8, g - 13], [s.x0 + 8, g - 14]); for (let x = s.x0; x < s.x0 + 8; x++) e.bc.push([x, g - 14]); e.tt = e.bc.length * 14 + 60; } else if (e.task === 'wed') e.txt = 'Свадьба!'; else if (e.task === 'house') { const b = HAS() && Houses.byId(e.bid); e.txt = 'Строит ' + (b ? b.name.toLowerCase() : 'дом'); } else if (e.task === 'quarry') e.txt = 'Добывает камень'; else if (e.task === 'repair') e.txt = 'Чинит дом'; else if (e.task === 'water') e.txt = 'Набирает воду'; else if (e.task === 'explore') e.txt = 'Осматривается'; else if (e.task === 'shaft') { e.txt = 'Копает шахту'; if (!e.sh.mine) { e.sh.x0 = Math.floor(e.x); e.sh.g = Math.round(e.y) + 1; } } else if (e.task === 'rod') e.txt = 'Ставит громоотвод'; else if (e.task === 'climb') e.tt = 2; else if (e.task === 'swim') e.txt = 'Купается'; else if (e.task === 'shelter') e.txt = 'Пережидает дождь'; else if (e.task === 'bury') { const b = byId(e.bt); e.txt = 'Хоронит ' + (b ? b.name : ''); } else if (e.task === 'fire') e.txt = 'Разжигает костёр'; else if (e.task === 'camp') e.txt = 'Греется у костра'; else if (e.task === 'sleep') { if (e.room) { e.sitT = 80 + rr(80); e.txt = 'Сидит на кровати'; } else { e.sleep = 1; e.txt = 'Спит'; } } }
      else { e.dir = sgn(e.goal - e.x); e.idle = 0; return; }
    }
    switch (e.task) {
      case 'wander': if (--e.t2 <= 0) { e.t2 = 50 + rr(160); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .3 ? 1 : 0; } if (!e.trick && !e.preg && e.age >= 5 && e.age < 45 && rf() < .002) trick(e); break;
      case 'rest': e.idle = 1; break;
      case 'play': if (--e.t2 <= 0) { e.t2 = 30 + rr(80); e.dir = rf() < .5 ? -1 : 1; e.idle = 0; if (rf() < .25) e.jump = true; if (rf() < .25) emote(e, 'note', 70); } if (!e.trick && e.age >= 4 && rf() < .005) trick(e); break;
      case 'follow': { const p = byId(e.par); if (!alive(p)) { e.tt = 0; break; } const d = p.x - e.x; if (Math.abs(d) > 4) { e.dir = sgn(d); e.idle = 0; } else e.idle = 1; break; }
      case 'together': { const p = byId(e.mate); if (!alive(p)) { e.tt = 0; break; }
        if (e.hugT > 0) { e.idle = 1; e.dir = sgn(p.x - e.x) || e.dir; break; }   /* обнимаются — стоят на месте лицом друг к другу */
        if (e.carry == null && p.carriedBy == null && p.carry == null && p.task === 'together' && e.age >= 16 && e.age < 60 && !e.preg && !p.preg && Math.abs(p.x - e.x) < 5 && rf() < .0012) { e.carry = p.id; e.carryT = 220 + rr(200); start(p, 'carried', 'На руках у ' + e.name, 9999); p.carriedBy = e.id; emote(p, 'heart', 100); e.txt = 'Несёт ' + p.name + ' на руках'; }
        if (e.carry != null) { if (--e.carryT <= 0) { dropCarry(e); e.txt = 'Гуляет с ' + p.name; } else if (--e.t2 <= 0) { e.t2 = 60 + rr(60); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .3 ? 1 : 0; } break; }
        const d = p.x - e.x; if (Math.abs(d) > 3.5) { e.dir = sgn(d); e.idle = 0; } else { e.idle = 1; if (rf() < .002) emote(e, 'heart', 80);
          if (p.task === 'together' && p.idle && !(p.hugT > 0) && e.carry == null && p.carriedBy == null && e.age >= 14 && rf() < .004) {   /* обнять (иногда поцеловать) */
            const kiss = e.age >= 16 && p.age >= 16 && (e.mst >= 1 || rf() < .3) && rf() < .5; e.hugT = p.hugT = 100 + rr(60); e.hugWith = p.id; p.hugWith = e.id; e.kiss = p.kiss = kiss;
            e.dir = sgn(p.x - e.x) || 1; p.dir = -e.dir; emote(e, 'heart', 90); if (kiss) emote(p, 'heart', 90);
          } } if (e.mst >= 1 && rf() < .0006) quarrel(e); break; }
      case 'chat': {
        const p = byId(e.chatWith); if (!alive(p) || p.chatWith !== e.id) { e.tt = 0; break; }
        const d = p.x - e.x; e.dir = sgn(d);
        if (Math.abs(d) > 6.8) { e.idle = 0; } else { e.idle = 1; if (e.greetWait) { e.greetWait = false; e.greet = { t: 70 }; } if (rf() < .006) emote(e, rf() < .5 ? 'talk' : 'note', 60); }
        if (e.tt === 1) { e.rel[p.id] = (e.rel[p.id] || 0) + 1; p.rel[e.id] = (p.rel[e.id] || 0) + 1; romance(e, p); e.chatWith = null; }
        break; }
      case 'sleep': if (e.sitT > 0) { e.idle = 1; if (--e.sitT === 0) { e.sleep = 1; e.txt = 'Спит'; } } else if (e.sleep) { e.idle = 1; if (rf() < .004) emote(e, 'zzz', 100); } else if (e.goal == null) { if (--e.t2 <= 0) { e.t2 = 60 + rr(100); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .5 ? 1 : 0; } if (S.tod !== undefined && rf() < .004) { e.sleep = 1; e.txt = 'Спит'; } } break;
      case 'camp': if (e.phase === 'do' || !e.room) { e.idle = 1; if (rf() < .002) emote(e, 'heart', 60); if (!e.room) { const c = campNear(e); if (!c) { e.tt = 0; e.txt = 'Костёр погас'; break; } e.dir = sgn(c.x - e.x); } } break;
      case 'fire': if (e.phase === 'do') { e.idle = 1; e.act = 'dig'; e.at = 3; if (e.tt === 40) { const x = Math.floor(e.x) + e.dir * 5; let g = fy; if (!safeFire(x, g)) { emote(e, 'ask', 80); e.tt = 1; break; }
          /* кострище: трава вокруг вырывается, в земле выкапывается ямка — костёр горит в ней и не расползается */
          for (let dy = -3; dy <= 0; dy++) for (let dx = -13; dx <= 13; dx++) { const j = (g + dy) * W + x + dx; if (GRASS.has(S.A.type[j])) S.put(j, E.AIR); }   /* трава вокруг вырвана шире: огонь не уползёт к людям */
          const soft = (j) => { const t = S.A.type[j]; return t === E.EARTH || t === E.SAND || t === E.MUD || t === E.ASH || t === E.SNOW; };
          if (soft((g + 1) * W + x) && soft((g + 1) * W + x + 1) && soft((g + 2) * W + x) && soft((g + 2) * W + x + 1)) { S.put((g + 1) * W + x, E.AIR); S.put((g + 1) * W + x + 1, E.AIR); g++; }
          placeLog(x, g); placeLog(x + 1, g); placeLog(x, g - 1); for (const sx of [x - 1, x + 2]) { const j = g * W + sx; if (S.A.type[j] === E.AIR) S.put(j, E.STONE); }   /* кострище обложено камнями */ for (let k = 0; k < 3; k++) { const j = (k === 2 ? g - 1 : g) * W + x + (k === 1 ? 1 : 0); S.ignite(j); } S.camps.push({ x: x + .5, y: g, t: 3600 }); emote(e, 'fire', 90); e.dir = -e.dir; e.tt = 2; e.fear = Math.max(e.fear || 0, 20); }   /* разжёг — сразу отходит */ } break;
      case 'chop': if (e.phase === 'do') {
        e.idle = 1; e.dir = sgn(e.tx - e.x); e.act = 'dig'; e.at = 3;
        if (e.tt === 1) {   /* спиливаем ствол у земли: дальше дерево падает само */
          const A = S.A; let n = 0; for (let dx = -1; dx <= 1; dx++) for (let y = fy - 3; y <= fy + 2; y++) { const i = y * W + e.tx + dx; if (A.type[i] === E.WOOD && A.aux[i] !== 0 && solidAt(i + W)) { S.put(i, E.AIR); n++; } }
          emote(e, n ? 'alert' : 'talk', 70);
          if (n && HAS()) { Town.give(e, 'wood', n + 4); Town.earn(e, e.prof === 'lumber' ? 3 : 1); }
        }
      } break;
      case 'bury': if (e.phase === 'do') {
        const b = byId(e.bt); if (!b || !b.dead) { e.tt = 0; break; }
        if (e.grave == null) {   /* дошёл до тела: относит его в сторону от домов, к кладбищу */
          const g = graveSpot(b);
          if (g == null) { e.tt = 0; e.txt = 'Не нашёл места для могилы'; emote(e, 'ask', 80); break; }
          e.grave = g; b.dragBy = e.id; e.goal = g + (g > e.x ? -2.5 : 2.5); e.phase = 'go'; e.gt = 0; e.tt = 1500; e.txt = 'Несёт ' + b.name + ' на кладбище'; break;
        }
        e.idle = 1; e.dir = sgn(e.grave - e.x) || e.dir; e.act = 'dig'; e.at = 3; b.dragBy = null; b.x += (e.grave + .5 - b.x) * .2; b.y = e.y;
        if (e.tt === 1) bury(e, b, e.grave);
      }
      break;
      case 'mourn': { const c = byId(e.mourn); if (c) e.dir = sgn(c.x - e.x); e.idle = 1; if (rf() < .006) emote(e, 'cry', 90); break; }
      case 'wed': if (e.phase === 'do') { const p = byId(e.mate); if (!alive(p)) { e.tt = 0; break; } e.idle = 1; e.dir = sgn(p.x - e.x); if (rf() < .02) emote(e, 'heart', 60); if (e.tt === 1 && e.mst === 1 && Math.abs(p.x - e.x) < 14) marry(e, p); } break;
      case 'tell': { const to = byId(e.tellTo), g = e.gossip; if (!to || !g || !alive(to)) { e.tt = 0; e.gossip = null; break; }
        if (e.phase !== 'do') break;
        e.idle = 1; e.dir = sgn(to.x - e.x) || e.dir; if (rf() < .05) emote(e, 'talk', 40); if (Math.abs(to.x - e.x) > 8) { e.goal = to.x + (e.x < to.x ? -3 : 3); e.phase = 'go'; break; }
        if (e.tt === 1) { const who = byId(g.who), oth = byId(g.other); e.gossip = null; if (who && oth && who.mate === to.id) caught(who, oth, to, 'told', e); }
        break; }
      case 'heal': { const v = byId(e.healT); if (!v || !v.dead) { e.tt = 0; e.hurry = false; break; }
        if (e.phase !== 'do') break;
        e.hurry = false; e.idle = 1; e.dir = sgn(v.x - e.x) || e.dir; e.act = 'cpr'; e.at = 3; e.txt = (e.prof === 'doctor' ? 'Откачивает ' : 'Оказывает первую помощь: ') + v.name;
        if (e.tt === 1) {
          const ch = (e.prof === 'doctor' ? .5 : .12) * (v.dying === 'burn' ? .5 : 1) * (v.dying === 'drown' ? 1.2 : 1);
          if (rescuable(v) && rf() < ch) revive(v, e);
          else { v.revived = true; v.healBy = null; emote(e, 'cry', 160); e.txt = 'Не смог' + (e.fem ? 'ла' : '') + ' спасти ' + v.name; plog(e, (e.fem ? 'Пыталась спасти ' : 'Пытался спасти ') + v.name + ' — не вышло'); }
        }
        break; }
      case 'planttree': if (e.phase === 'do') {
        const ts = e.tspot; if (!ts) { e.tt = 0; break; } e.idle = 1; e.dir = sgn(ts.x - e.x) || e.dir;
        if (e.tt > 90) { e.act = 'seed'; e.at = 3; e.txt = 'Сажает ' + (e.tkind === E.CONE ? 'ёлочку' : 'дерево'); e.plantWater = false; }
        else { e.plantWater = true; e.txt = 'Поливает саженец'; }
        if (e.tt === 90) { const i = ts.g * S.W + ts.x; if (S.A.type[i] === E.AIR) S.put(i, e.tkind); }
        if (e.tt === 2) { for (const dx of [-1, 1]) { const j = ts.g * S.W + ts.x + dx; if (S.A.type[j] === E.AIR) S.put(j, E.WATER); } plog(e, (e.fem ? 'Посадила ' : 'Посадил ') + (e.tkind === E.CONE ? 'ёлочку' : 'дерево')); emote(e, 'spark', 80); e.plantWater = false; }
      } break;
      case 'garden': if (e.phase === 'do') {
        const q = Works.bedOf(e.job); if (!q) { e.tt = 0; break; }
        e.idle = 1; e.dir = sgn(q.x - e.x) || e.dir; const a = e.job.act;
        if (a === 'hoe') { e.act = 'dig'; e.at = 3; } else if (a === 'plant' || a === 'harvest') { e.act = 'seed'; e.at = 3; }
        if (e.tt === 1) { const got = Works.bedDo(e.job); if (got) { e.hold = { k: 'veg', c: got }; e.holdT = 500; if (HAS()) { Town.give(e, 'food', 5); Town.earn(e, e.prof === 'farmer' ? 2 : 1); } emote(e, 'meat', 80); } }
      } break;
      case 'hunt': {
        const bd = Works.birdById(e.bird); if (!bd) { e.tt = 0; break; }
        if (bd.dead) {   /* попал: ждёт, пока упадёт, идёт и подбирает */
          e.aimAt = null; if (!bd.ground) { e.idle = 1; e.dir = sgn(bd.x - e.x) || e.dir; if (e.tt < 60) e.tt = 60; break; }
          if (Math.abs(bd.x - e.x) > 1.6) { e.goal = bd.x; e.phase = 'go'; e.txt = 'Идёт за подбитой птицей'; if (e.tt < 300) e.tt = 300; break; }
          e.idle = 1; e.act = 'seed'; e.at = 3; if (e.tt < 60) e.tt = 60;
          if (++e.pickT >= 30) { Works.takeBird(bd); e.hold = { k: 'bird' }; e.holdT = 700; if (HAS()) { Town.give(e, 'food', 3); Town.earn(e, 1); } emote(e, 'meat', 90); plog(e, (e.fem ? 'Подстрелила' : 'Подстрелил') + ' птицу'); e.tt = 1; }
          break;
        }
        if (e.phase !== 'do') break;
        e.idle = 1; e.dir = sgn(bd.x - e.x) || e.dir; e.aimAt = bd.id; if (e.drawT > 0) e.drawT--;
        if (--e.t2 <= 0) {
          e.t2 = 50 + rr(25);
          if (e.shots >= 3 || Math.abs(bd.x - e.x) > 48) { e.aimAt = null; e.tt = 0; emote(e, 'down', 50); break; }   /* три промаха или улетела — бросает */
          Works.shoot(e, bd); e.shots++; e.drawT = 12;
        }
        if (e.tt < 40) e.tt = 40;
        break; }
      case 'quarrel': { const p = byId(e.qw); if (!alive(p) || p.qw !== e.id) { e.tt = 0; break; } e.dir = sgn(p.x - e.x); e.idle = 1; if (rf() < .03) emote(e, 'angry', 50); if (e.tt === 1 && e.mate === p.id && rf() < .75) { e.rel[p.id] = (e.rel[p.id] || 0) + 2; emote(e, 'heart', 90); } break; }
      case 'sulk': e.idle = 1; if (rf() < .012) emote(e, 'broken', 70); break;
      case 'swim': if (e.phase === 'do') { if (--e.t2 <= 0) { e.t2 = 40 + rr(80); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .2 ? 1 : 0; } if (rf() < .004) emote(e, 'note', 70); } break;
      case 'sow': { if (--e.t2 <= 0) { if (e.sowW) { e.sowW = false; const x = Math.floor(e.x) - e.dir, i = fy * W + x, A = S.A; if (x > 2 && x < W - 2 && A.type[i] === E.AIR && A.type[i + W] === E.EARTH) { S.put(i, rf() < .2 ? E.FSEED : E.SEED); if (HAS() && e.prof === 'farmer' && rf() < .5) Town.earn(e, 1); } e.t2 = 20 + rr(14); e.idle = 0; if (rf() < .15) e.dir = -e.dir; } else { e.sowW = true; e.t2 = 60 + rr(40); } }
        if (e.sowW) { e.idle = 1; e.act = 'dig'; e.at = 3; } else e.idle = 0; break; }   /* огород: рыхлит мотыгой, сажает позади и делает шаг */
      case 'shelter': if (e.phase === 'do') { e.idle = 1; if (S.weather === 0) e.tt = Math.min(e.tt, 40); } break;
      case 'fish': if (e.phase === 'do') {
        /* рыбалка по шагам: заброс → ждёт (поплавок качается) → поклёвка → подсечка (рыба летит на леске) → показывает улов; иногда срывается */
        e.idle = 1; e.dir = sgn(e.wx - e.x) || e.dir; e.act = 'rod'; e.at = 3;
        let f = e.fsh; if (!f) f = e.fsh = { ph: 'cast', t: 0, n: 0 };
        f.t++;
        if (f.ph === 'cast' && f.t === 1) {
          /* куда забросить: только столбцы, где сверху открытая вода (не земля, не настил), в 2–14 клетках от рыбака в сторону воды */
          const spots = []; for (let k = 2; k <= 14; k++) {
            const x = Math.round(e.x + e.dir * k); if (x < 2 || x >= S.W - 2) break;
            let y = Math.max(2, Math.round(e.y) - 12); while (y < S.H - 2 && (S.A.type[y * S.W + x] === E.AIR || KIND[S.A.type[y * S.W + x]] === K.GAS)) y++;
            const t = S.A.type[y * S.W + x]; if ((t === E.WATER || t === E.BRINE) && y <= Math.round(e.y) + 8) spots.push([x, y]);
          }
          if (!spots.length) { e.fsh = null; e.tt = 1; e.act = null; break; }   /* воды перед ним нет — бросает рыбалку */
          const sp = spots[Math.min(spots.length - 1, 2 + rr(Math.max(1, spots.length - 2)))]; f.bx = sp[0]; f.by = sp[1]; f.wait = 140 + rr(260);
        }
        if (f.ph === 'cast' && f.t >= 34) { f.ph = 'wait'; f.t = 0; }
        else if (f.ph === 'wait' && f.t >= f.wait) { f.ph = 'bite'; f.t = 0; emote(e, 'alert', 40); }
        else if (f.ph === 'bite' && f.t >= 26) { f.ph = 'pull'; f.t = 0; f.got = rf() < (e.prof === 'fisher' || e.prof === 'pirate' ? .8 : .6); f.big = rf() < .2; }
        else if (f.ph === 'pull' && f.t >= 24) {
          f.ph = 'show'; f.t = 0;
          if (f.got) { f.n++; emote(e, f.big ? 'spark' : 'meat', 60); if (HAS()) { const k = (e.prof === 'fisher' ? 2 : 1) * (f.big ? 2 : 1); Town.earn(e, k); Town.give(e, 'food', k); } }
          else emote(e, 'down', 50);
        }
        else if (f.ph === 'show' && f.t >= (f.got ? 70 : 30)) { f.ph = 'cast'; f.t = 0; }
        if (e.tt === 1) { e.fsh = null; if (f.n && HAS()) emote(e, 'money', 70); }
      } else e.fsh = null; break;
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
      case 'repair': if (e.phase === 'do') {
        const b = Houses.byId(e.bid); if (!b || !Houses.damaged(b)) { e.tt = Math.min(e.tt, 2); break; }
        e.idle = 1; e.act = 'dig'; e.at = 3; if (rf() < .01) e.dir = -e.dir;
        if (e.tt % 40 === 0) { const sc = Town.byId(e.soc); if (sc && (sc.wood > 0 || sc.bank >= 2)) { if (Houses.repair(b, e.prof === 'builder' ? 2 : 1)) { if (sc.wood > 0) sc.wood--; else sc.bank -= 2; } } else { e.txt = 'Нет дерева на ремонт'; e.tt = Math.min(e.tt, 2); } }
      } break;
      case 'water': case 'forage': if (e.phase === 'do') { e.idle = 1; e.act = e.task === 'water' ? 'fish' : 'dig'; e.at = 3; } break;
      case 'explore': case 'gawk': if (e.phase === 'do') { e.idle = rf() < .97 ? 1 : 0; if (rf() < .01) e.dir = -e.dir; if (rf() < .006) emote(e, e.task === 'gawk' ? 'ask' : 'spark', 70); } break;
      case 'shaft': if (e.phase === 'do') {
        e.idle = 1; e.act = 'dig'; e.at = 3; e.dir = e.sh.dir;
        if (e.tt % 18 === 0) { const ok = e.sh.steps < e.sh.max && shaftStep(e); if (!ok) { if (e.sh.why != null && e.sh.mine) { const mm = Works.mines.find((q) => q.id === e.sh.mine); if (mm) mm.done = true; } const x0 = e.sh.x0; start(e, 'climb', 'Выбирается из шахты', 1200, x0); e.dur = 2; emote(e, 'note', 80); } }
      } break;
      case 'dockwork': if (e.phase === 'do') {
        const o = Works.docks.find((q) => q.id === e.did); if (!o || o.done) { e.tt = Math.min(e.tt, 2); break; }
        const tx = o.x0 + o.dir * o.placed + .5; if (Math.abs(tx - e.x) > 1.5) { e.dir = sgn(tx - e.x); e.idle = 0; break; }
        e.idle = 1; e.dir = o.dir; e.act = 'dig'; e.at = 3;
        if (e.tt % 30 === 0) { const sc = Town.byId(e.soc); if (sc && sc.wood > 0) { if (Works.buildDock(o, 1)) { Town.note('Причал достроен (' + (sc ? sc.name : '') + ')', sc, true); emote(e, 'heart', 120); e.tt = 2; } if (o.placed % 2 === 0) sc.wood--; } else { e.txt = 'Нет дерева на причал'; e.tt = Math.min(e.tt, 2); } }
      } break;
      case 'exercise': e.idle = 1; if (rf() < .004) emote(e, 'spark', 60); break;
      case 'eat': case 'visit': if (e.phase === 'do') { e.idle = 1; if (rf() < .005) emote(e, e.task === 'eat' ? 'meat' : 'talk', 60); } break;
      case 'dance': if (e.phase === 'do') { const c = campNear(e); if (!c) { e.tt = 0; break; }
        if (--e.t2 <= 0) { e.t2 = 70 + rr(90); e.idle = rf() < .3 ? 0 : 1; if (rf() < .5) e.dir = -e.dir; }
        const near = Math.abs(e.x - c.x) < 7.5, far = e.dspot != null && Math.abs(e.x - e.dspot) > 3;
        if (!e.idle && (near || far)) e.dir = near ? sgn(e.x - c.x) || 1 : sgn(e.dspot - e.x);   /* к огню не подходит, от своего места далеко не уходит */
        if (rf() < .006) emote(e, 'note', 60); } break;
      case 'stars': e.idle = 1; if (rf() < .004) emote(e, 'spark', 70); break;
      case 'tag': {
        const o = byId(e.chase || e.flee); if (!alive(o)) { e.tt = 0; break; }
        const d = o.x - e.x; e.idle = 0; e.spdk = 1.35;
        if (e.chase) { e.dir = sgn(d); if (Math.abs(d) < 2.5) { emote(e, 'note', 60); e.flee = e.chase; e.chase = null; o.chase = o.flee; o.flee = null; o.txt = 'Водит!'; e.txt = 'Убегает от ' + o.name; } }
        else { e.dir = -sgn(d) || 1; if (rf() < .02) e.jump = true; }
        break;
      }
      case 'rps': if (e.phase === 'do') {
        const o = byId(e.rpsWith); if (!alive(o) || o.rpsWith !== e.id || o.task !== 'rps') { e.tt = 0; break; }
        e.idle = 1; e.dir = sgn(o.x - e.x) || e.dir; if (o.phase !== 'do' || !e.rps || !o.rps) break;
        if (e.rps.t0 == null || o.rps.t0 == null) { const t0 = S.frame + 10; e.rps.t0 = t0; o.rps.t0 = t0; }
        const loc = (S.frame - e.rps.t0) % 100, rnd = Math.floor((S.frame - e.rps.t0) / 100);
        if (loc === 99 && e.id < o.id && rnd < 3) { const a = e.rps.k[rnd], b = o.rps.k[rnd], w = (a - b + 3) % 3; if (w === 0) { emote(e, 'ask', 40); emote(o, 'ask', 40); } else { const win = w === 1 ? e : o, los = w === 1 ? o : e; emote(win, 'spark', 50); emote(los, 'down', 50); win.cheerT = 36; } }
        if (rnd >= 3 && e.id < o.id) { e.tt = 1; o.tt = 1; e.rel[o.id] = (e.rel[o.id] || 0) + .5; o.rel[e.id] = (o.rel[e.id] || 0) + .5; }
        e.txt = 'Играет в камень-ножницы-бумагу'; break; }
        break;
      case 'affair': if (e.phase === 'do') {
        const o = byId(e.lover); if (!alive(o) || o.lover !== e.id) { e.tt = 0; break; } e.idle = 1; e.txt = 'Тайно встречается с ' + o.name;
        if (e.sneak > 0) { e.sneak--; if ((e.sneak & 31) === 0) e.dir = -e.dir; }   /* сначала оглядываются: нет ли кого */
        else { e.dir = sgn(o.x - e.x) || e.dir; if (o.phase === 'do' && !(o.sneak > 0) && !(e.hugT > 0) && e.id < o.id && Math.abs(o.x - e.x) < 6) { e.hugT = o.hugT = Math.max(60, e.tt - 10); e.hugWith = o.id; o.hugWith = e.id; e.kiss = o.kiss = true; emote(e, 'heart', 90); } }
        if (S.frame % 30 === 0 && e.id < o.id) { let done = false; for (const w of S.ents) { if (done) break; if (w === e || w === o || !alive(w) || w.sleep || w.z || Math.abs(w.x - e.x) > 24 || Math.abs(w.y - e.y) > 8) continue; for (const [who, oth] of [[e, o], [o, e]]) if (who.mate != null && rf() < .35 && witness(w, who, oth)) { done = true; break; } } }
        /* (старая проверка «партнёр рядом» заменена свидетелями) */
        if (e.tt === 1 && e.id < o.id && e.lover === o.id) { e.rel[o.id] = (e.rel[o.id] || 0) + 1; o.rel[e.id] = (o.rel[e.id] || 0) + 1;
          for (const [a, b] of [[e, o], [o, e]]) { a.affN = (a.affN || 0) + 1; const m = byId(a.mate); if (m && alive(m) && a.affN >= 3 && (a.rel[b.id] || 0) > (a.rel[m.id] || 0) + 1) {   /* не поймали — сам уходит к любовнику */
            split(a, m); emote(m, 'broken', 240); plog(m, ga(a, 'Ушёл ', 'Ушла ') + a.name + ' — к ' + b.name); if (HAS()) Town.note(a.name + ga(a, ' ушёл от ', ' ушла от ') + m.name + ' к ' + b.name, Town.byId(a.soc), true); m.sulk = a.id;
            if (b.mate == null) { a.mate = b.id; b.mate = a.id; a.mst = b.mst = 1; } a.affN = 0; } } plog(e, 'Тайно встречался с ' + o.name); plog(o, 'Тайно встречалась с ' + e.name); }
      } break;
      case 'propose': if (e.phase === 'do') { const p = byId(e.pid); if (!alive(p)) { e.tt = 0; break; } e.idle = 1; e.dir = sgn(p.x - e.x) || e.dir; e.txt = 'Делает предложение ' + p.name; } break;
      case 'proposed': { const p = byId(e.pid); if (!alive(p) || p.task !== 'propose') { e.tt = Math.min(e.tt, 2); break; } e.idle = 1; e.dir = sgn(p.x - e.x) || e.dir; if (p.phase === 'do' && rf() < .01) emote(e, 'heart', 60); break; }
      case 'bench': if (e.phase === 'do') { e.idle = 1; const nb = S.ents.find((o) => o !== e && alive(o) && o.task === 'bench' && o.phase === 'do' && Math.abs(o.x - e.x) < 6); e.dir = nb ? sgn(nb.x - e.x) || e.bdir : e.bdir; e.txt = nb ? 'Сидит на лавочке с ' + nb.name : 'Сидит на лавочке'; if (nb && rf() < .004) { e.rel[nb.id] = (e.rel[nb.id] || 0) + .2; emote(e, 'talk', 50); } } break;
      case 'flower': if (e.phase === 'do') {
        e.idle = 1; if (e.fl) e.dir = sgn(e.fl.x - e.x) || e.dir;
        if (!e.hold && e.tt < e.dur - 50) pickFlower(e);
        if (e.hold && e.tt === 1) { const m = byId(e.mate); if (m && alive(m) && !m.sleep && !m.fight && Math.abs(m.x - e.x) < 80 && e.age >= 16) { start(e, 'giveflower', 'Несёт цветок ' + m.name, 900, m.x + (e.x < m.x ? -4.5 : 4.5)); e.dur = 90; e.gf = m.id; } else e.holdT = 600; }
      } break;
      case 'giveflower': if (e.phase === 'do') { const m = byId(e.gf); e.idle = 1; if (!m || !alive(m)) { e.tt = 0; break; } e.dir = sgn(m.x - e.x) || e.dir;
        if (e.tt === 40 && e.hold) { m.hold = e.hold; m.holdT = 900; e.hold = null; m.dir = -e.dir; e.rel[m.id] = (e.rel[m.id] || 0) + 1; m.rel[e.id] = (m.rel[e.id] || 0) + 1.5; emote(m, 'heart', 120); emote(e, 'heart', 80); if (HAS() && rf() < .5) Town.note(e.name + (e.fem ? ' подарила ' : ' подарил ') + m.name + ' цветок', Town.byId(e.soc)); } } break;
      case 'carrykid': if (e.phase === 'do') {
        const k = byId(e.kidId); if (!k || !alive(k)) { e.tt = 0; break; }
        if (k.heldBy !== e.id && k.rideOn !== e.id) {
          if (k.heldBy != null || k.rideOn != null || k.sleep || k.fight) { e.tt = 0; break; }
          if (Math.abs(k.x - e.x) < 3) { if (k.age < 4) k.heldBy = e.id; else k.rideOn = e.id; start(k, 'held', (k.age < 4 ? 'На руках у ' : 'Сидит на плечах у ') + e.name, 9999); e.txt = k.age < 4 ? 'Носит ' + k.name + ' на руках' : 'Катает ' + k.name + ' на плечах'; emote(k, 'heart', 80); }
          else { e.dir = sgn(k.x - e.x); e.idle = 0; break; }
        }
        if (--e.t2 <= 0) { e.t2 = 50 + rr(90); e.dir = rf() < .5 ? -1 : 1; e.idle = rf() < .4 ? 1 : 0; }
      } break;
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
    if (e.carriedBy != null || e.heldBy != null || e.rideOn != null) { if (attached(e)) { if (e.doorT > 0) e.doorT--; return; } }
    if (e.age < 1.5) e.spdk = .35;
    if (e.preg) e.spdk *= .8;
    if (e.carry != null || (e.task === 'carrykid' && e.kidId != null)) e.spdk *= .75;
    if (e.trick) e.spdk *= ({ crawl: .35, roll: .9, sprint: 1.7, flip: 1 })[e.trick.k] || 1;
    if (e.greet && e.greet.t > 0) e.greet.t--;
    if (e.hold && e.holdT != null && --e.holdT <= 0) { e.hold = null; e.holdT = null; }
    if (e.cheerT > 0) e.cheerT--;
    if (e.hugT > 0) { e.hugT--; const h = byId(e.hugWith); if (!h || !alive(h) || h.hugWith !== e.id || !(h.hugT > 0)) e.hugT = 0; if (!(e.hugT > 0)) { e.hugWith = null; e.kiss = false; } }
    if ((S.frame + e.id * 7) % 60 === 0) moodTick(e);
    waveCheck(e);
    if (typeof Combat !== 'undefined' && Combat.think(e, S)) { if (e.doorT > 0) e.doorT--; return; }   /* бой важнее любых дел */
    /* пара: рождение ребёнка */
    /* беременность: живот растёт ~40 с, потом рождается ребёнок рядом с мамой */
    if (e.preg) {
      if (++e.preg >= 2400) { e.preg = 0; const m = byId(e.mate); S.spawnEnt(Math.round(e.x), e.y, false, People.randomForm(), null, { age: 0, par: e.id, par2: e.mate, kid: true }); { const kid = S.ents[S.ents.length - 1]; joy(e, 'родился ребёнок', 9000); joy(m, 'родился ребёнок', 9000); plog(e, 'Родился ребёнок: ' + (kid && kid.name || '')); if (m) plog(m, 'Родился ребёнок: ' + (kid && kid.name || '')); if (kid) plog(kid, 'Родился. Мама — ' + e.name + (m ? ', папа — ' + m.name : '')); } emote(e, 'heart', 200); if (m && alive(m)) emote(m, 'heart', 200); if (HAS()) Town.note(e.name + ' родила ребёнка', Town.byId(e.soc), true); }
    } else if (e.fem && e.mate != null && e.mst === 2 && e.age > 19 && e.age < 44 && S.tod > .25 && S.tod < .7 && S.ents.length < 48 && rf() < 1 / 4500) {
      const m = byId(e.mate); if (alive(m) && Math.abs(m.x - e.x) < 30) { e.preg = 1; emote(e, 'heart', 120); emote(m, 'heart', 120); if (HAS()) Town.note(e.name + ' ждёт ребёнка', Town.byId(e.soc)); }
    }
    { const tod = S.tod === undefined ? .4 : S.tod; if ((tod > .85 || tod < .2) && e.task !== 'sleep' && e.task !== 'camp' && e.task !== 'fire' && e.task !== 'chat') e.tt = 0; }
    if (e.doorT > 0) e.doorT--;
    /* срочно: кто-то только что погиб рядом — врач (и иногда любой взрослый поблизости) бросает дело и бежит на помощь */
    if ((S.frame + e.id) % 15 === 0 && e.age >= 14 && !e.sleep && !e.fight && e.task !== 'heal' && e.carriedBy == null && e.heldBy == null && !(e.stun > 0)) { const doc = e.prof === 'doctor', v = victimNear(e, doc ? 150 : 30); if (v && (doc || (!byId(v.healBy) && rf() < .35))) startHeal(e, v); }
    if (e.task === null || e.task === undefined || --e.tt <= 0) { if (e.fin && e.phase === 'do' && e.task) { const f = e.fin; e.fin = null; try { f(); } catch (er) { /* награда не должна ломать жизнь */ } } if (e.task === 'chat') { e.chatWith = null; } e.room = null; pick(e); }
    if (e.sleep && S.tod > .2 && S.tod < .85) { e.sleep = 0; e.task = null; e.tt = 0; }
    if ((S.frame + e.id) % 10 === 0 && !(e.fear > 0) && !e.sleep && e.carriedBy == null && e.heldBy == null) { const fx = fireNear(e); if (fx != null) { e.fear = 70; e.dir = e.x >= fx ? 1 : -1; e.tt = Math.min(e.tt, 1); e.sitT = 0; if (rf() < .5) emote(e, 'alert', 60); e.txt = 'Убегает от огня'; } }
    run(e);
    if (e.task !== 'fire' && !e.room && !e.air && e.carriedBy == null && e.heldBy == null && !e.sleep) for (const c of S.camps) {   /* к горящему костру ближе 5,5 клетки не подходят — отходят */
      if (Math.abs(e.x - c.x) < 6.5 && Math.abs(e.y - c.y) < 6) { e.dir = sgn(e.x - c.x) || 1; e.idle = 0; if (e.goal != null && Math.abs(e.goal - c.x) < 6.5) { e.goal = null; e.nav = null; e.tt = Math.min(e.tt, 1); } break; }
    }
    if (!e.idle && !e.air && !e.swim && !(e.burn > 0) && !(e.fear > 0) && fireAhead(e)) {   /* огонь впереди: в пламя не идёт */
      if (e.goal != null && e.phase === 'go') { e.tt = 0; e.goal = null; e.nav = null; emote(e, 'alert', 50); } else e.dir = -e.dir;
      e.idle = 1;
    }
    if (e.trick) { if (++e.trick.t >= e.trick.n || e.fight || e.sleep) e.trick = null; else if (e.trick.k !== 'flip') e.idle = 0; }
    avoidFire(e);
    if (e.task === 'chop' || e.task === 'fish' || e.task === 'build' || e.task === 'fire') { /* закончили: сбрасываем поле дела */ if (e.tt <= 1) { e.phase = null; e.done = false; e.bc = null; } }
  }
  function step(sim) {
    S = sim;
    if (typeof Arms !== 'undefined') Arms.step(S);
    if (typeof Works !== 'undefined') Works.step(S);
    if (S.frame % 120 === 11) for (const c of S.camps) { const cx = Math.floor(c.x); for (let dy = -3; dy <= 0; dy++) for (let dx = -11; dx <= 11; dx++) { if (Math.abs(dx) < 2) continue; const j = (c.y + dy) * S.W + cx + dx; if (GRASS.has(S.A.type[j])) S.put(j, E.AIR); } }   /* у костра траву вытоптали */
    for (let i = S.camps.length - 1; i >= 0; i--) { const c = S.camps[i]; c.age = (c.age || 0) + 1; if (--c.t <= 0 || (c.age > 60 && (S.frame + i) % 30 === 0 && !campLit(c))) S.camps.splice(i, 1); }
    if (HAS()) Town.step(S);
    else if ((S.frame & 255) === 0) for (let i = S.homes.length - 1; i >= 0; i--) { const h = S.homes[i]; if (S.A.type[h.ry * S.W + h.rx] !== E.WOOD) S.homes.splice(i, 1); }
  }
  return { anyById, family, parentsOf, plog, init, think, step, describe, notice, ageScale, stageOf, byId, emote, onDeath, wake, CAUSE };
})();
