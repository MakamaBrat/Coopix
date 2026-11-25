'use strict';
/* ПИКСЕЛИЯ — общества человечков: глава, профессии, деньги, ресурсы и стройка домов.
   - Взрослые без общества, оказавшись рядом, основывают общество и выбирают главу (обаяние + возраст + симпатии).
     Новички вступают в ближайшее общество; дети — в общество родителя. Большое общество иногда раскалывается:
     тот, кто не ладит с главой, уводит своих друзей и становится главой новой группы.
   - Профессия у каждого взрослого. Работа приносит монеты (часть уходит в казну общества) и ресурсы:
     лесоруб — дерево, каменщик — камень, торговец закупает недостающее на деньги казны.
   - Когда в казне хватает, глава закладывает дом: сколько этажей и какие комнаты (жилые для бездомных семей,
     церковь, библиотека, таверна, мастерская) — по нуждам общества. Строят все взрослые, строители быстрее.
   - Готовый дом заселяется семьями, в общественные комнаты назначаются священник, учёный, трактирщик, ремесленник.
   - Всё важное пишется в летопись (Town.log). */
const Town = (function () {
  const NAMES = ['Дубрава', 'Ручейки', 'Ольховка', 'Светлый Бор', 'Каменка', 'Зарянка', 'Медовая', 'Лисья Падь', 'Тихая Заводь', 'Росинка', 'Сосновка', 'Ясный Луг', 'Вишнёвка', 'Кленовый Яр'];
  const COLORS = ['#f0a050', '#6ac0e8', '#9ad060', '#e078c8', '#f0d050', '#e85a5a', '#9a8af0', '#50c8a8'];
  const ROOFS = ['red', 'blue', 'green', 'purple'];
  const PROF = {
    lumber: { n: 'Лесоруб', d: 'Рубит деревья, приносит дерево на стройку' },
    mason: { n: 'Каменщик', d: 'Добывает камень' },
    builder: { n: 'Строитель', d: 'Строит дома быстрее всех' },
    fisher: { n: 'Рыбак', d: 'Ловит и продаёт рыбу' },
    farmer: { n: 'Фермер', d: 'Сажает семена и растит урожай' },
    trader: { n: 'Торговец', d: 'Торгует и закупает дерево и камень для общества' },
    priest: { n: 'Священник', d: 'Служит в церкви, мирит людей' },
    scholar: { n: 'Учёный', d: 'Работает в библиотеке, учит детей' },
    barkeep: { n: 'Трактирщик', d: 'Держит таверну' },
    crafter: { n: 'Ремесленник', d: 'Мастерит в мастерской на продажу' },
    none: { n: 'Без дела', d: '' }
  };
  const CIVIC_PROF = { church: 'priest', library: 'scholar', tavern: 'barkeep', workshop: 'crafter' };
  const socs = [], log = [];
  let S = null, nextId = 1, nameK = 0;
  const rf = () => S.rnd(), rr = (n) => S.rn(n);
  const alive = (o) => o && !o.dying && !o.z;
  const byId = (id) => socs.find((s) => s.id === id) || null;
  const ent = (id) => Life.byId(id);
  const members = (s) => S.ents.filter((e) => alive(e) && e.soc === s.id);
  const center = (s) => { const m = members(s); return m.length ? m.reduce((a, e) => a + e.x, 0) / m.length : 0; };
  const dayStr = () => { const Y = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y : null; return Y ? 'Год ' + Y.year + ', ' + ['весна', 'лето', 'осень', 'зима'][Y.season] + ', день ' + (Y.dos + 1) : ''; };
  /* big — крупное событие: ещё и всплывает подсказкой; мелкие (заселения, назначения) только в летописи */
  function note(txt, soc, big) { log.unshift({ t: dayStr(), txt, c: soc ? soc.color : null, big: !!big }); if (log.length > 80) log.pop(); if (onNote && big) onNote(txt); }
  let onNote = null;

  /* ---------- деньги ---------- */
  /* заработок: четверть в казну общества */
  function earn(e, coins, why) {
    if (!e || coins <= 0) return;
    const s = byId(e.soc), tax = s ? Math.max(coins >= 2 ? 1 : 0, Math.round(coins * .25)) : 0;
    e.money = (e.money || 0) + coins - tax; if (s) s.bank += tax;
    e.earned = (e.earned || 0) + coins;
  }
  function give(e, res, n) { const s = byId(e.soc); if (s) s[res] += n; }
  function pay(from, to, n) { n = Math.min(n, from.money || 0); if (n <= 0) return 0; from.money -= n; to.money = (to.money || 0) + n; return n; }

  /* ---------- общества ---------- */
  function score(e, list) { let r = 0; for (const o of list) if (o !== e) r += Math.max(-3, Math.min(5, e.rel[o.id] || 0)) + Math.max(-3, Math.min(5, o.rel[e.id] || 0)); return (e.cha || .5) * 3 + Math.min(1.5, (e.age - 18) / 30) + r * .15; }
  function elect(s) {
    const m = members(s).filter((e) => e.age >= 16); if (!m.length) return null;
    let best = m[0]; for (const e of m) if (score(e, m) > score(best, m)) best = e;
    if (s.leader !== best.id) { const was = s.leader; s.leader = best.id; if (was != null) note(best.name + ' — новый глава общества «' + s.name + '»', s, true); Life.emote(best, 'spark', 160); }
    return best;
  }
  function found(group, parent) {
    const s = { id: nextId++, name: NAMES[nameK++ % NAMES.length] + (nameK > NAMES.length ? ' ' + Math.ceil(nameK / NAMES.length) : ''), color: COLORS[(nextId - 2) % COLORS.length], roof: ROOFS[(nextId - 2) % ROOFS.length],
      leader: null, bank: 0, wood: 0, stone: 0, plan: null, born: dayStr(), short: 0, ticks: 0, rel: {}, war: {}, warT: {}, lost: 0 };
    socs.push(s);
    for (const e of group) { e.soc = s.id; for (const o of group) if (o !== e) e.rel[o.id] = Math.max(e.rel[o.id] || 0, .5); const n = Math.min(e.money || 0, 6); e.money -= n; s.bank += n + 6; s.wood += 4; }
    const L = elect(s);
    if (parent) { s.rel[parent.id] = parent.rel[s.id] = -4; }
    if (parent) note('Раскол: ' + L.name + (L.fem ? ' увела ' : ' увёл ') + (group.length - 1) + ' чел. из «' + parent.name + '» и основал' + (L.fem ? 'а' : '') + ' «' + s.name + '»', s, true);
    else note('Основано общество «' + s.name + '». Глава — ' + (L ? L.name : '—'), s, true);
    for (const e of group) Life.emote(e, e === L ? 'spark' : 'note', 140);
    return s;
  }
  function join(e, s) { e.soc = s.id; const L = ent(s.leader); if (L) { e.rel[L.id] = Math.max(e.rel[L.id] || 0, .5); } Life.emote(e, 'up', 100); }
  /* раз в несколько секунд: вступления, основания, расколы, выборы, профессии, заселение, стройка */
  /* S.homes (старый список домов для свадеб, рождений и ночлега) собирается из жилых комнат готовых домов */
  function syncHomes() { S.homes.length = 0; for (const b of Houses.list) if (b.done && !b.ruin) b.rooms.forEach((r, ri) => { if (r.role === 'home') S.homes.push({ x: Houses.roomX(b, r.i) + Houses.RW / 2, y: Houses.standY(b, r.f), rx: b.x0, ry: Houses.floorRow(b, b.nf), b: b.id, ri }); }); }
  function tick() {
    syncHomes();
    diplomacy();
    const people = S.ents.filter(alive);
    /* дети — в общество родителя */
    for (const e of people) if (e.soc == null && e.age < 16) { const p = Life.byId(e.par); if (p && p.soc != null) e.soc = p.soc; }
    /* взрослые без общества */
    const free = people.filter((e) => e.soc == null && e.age >= 16);
    for (const e of free) {
      if (e.soc != null) continue;
      let best = null, bd = 110;
      for (const s of socs) { const m = members(s); if (!m.length) continue; const L = ent(s.leader); if (L && (e.rel[L.id] || 0) < -1) continue; const d = Math.abs(center(s) - e.x); if (d < bd) { bd = d; best = s; } }
      if (best) { join(e, best); continue; }
      const near = free.filter((o) => o.soc == null && Math.abs(o.x - e.x) < 70 && Math.abs(o.y - e.y) < 40);
      if (near.length >= 2) found(near);
    }
    for (let k = socs.length - 1; k >= 0; k--) {
      const s = socs[k], m = members(s);
      if (!m.length) { if (!S.ents.some((e) => e.soc === s.id && alive(e))) { note('Общество «' + s.name + '» опустело', s, true); socs.splice(k, 1); for (const b of Houses.list) if (b.soc === s.id) b.soc = null; } continue; }
      if (!alive(ent(s.leader)) || ent(s.leader).soc !== s.id) elect(s);
      /* раскол: в большом обществе тот, кто не ладит с главой и обаятелен, уводит друзей */
      const L = ent(s.leader);
      if (L && m.length >= 6 && ++s.ticks > 160 && rf() < .04) {
        const adults = m.filter((e) => e.age >= 18 && e !== L);
        const rebel = adults.filter((e) => (e.rel[L.id] || 0) < 1 && (e.cha || 0) > .45).sort((a, b) => (a.rel[L.id] || 0) - (b.rel[L.id] || 0))[0];
        if (rebel) {
          const group = [rebel].concat(m.filter((e) => e !== rebel && e !== L && (e.rel[rebel.id] || 0) > (e.rel[L.id] || 0) + .5 && rf() < .8));
          for (const kid of m) if (kid.age < 16 && group.some((g) => g.id === kid.par)) group.push(kid);
          if (group.length >= 2 && group.length <= m.length - 2) { for (const e of group) { e.home = null; e.rel[L.id] = (e.rel[L.id] || 0) - 1; } found(group, s); }
        }
      }
      /* профессии */
      for (const e of m) if (e.age >= 16 && (!e.prof || e.prof === 'none')) e.prof = chooseProf(e, s);
      if (rf() < .3) { const tr = m.filter((e) => e.prof === 'trader').length; if (!tr && m.length >= 4) { const c = m.find((e) => e.age >= 18 && e.prof !== 'builder' && !CIVIC_PROF[roleOfProf(e.prof)]); if (c) c.prof = 'trader'; } }
      /* пожертвования: у кого много монет, часть отдаёт в казну, когда идёт стройка */
      if (needBuild(s)) for (const e of m) if ((e.money || 0) > 8) { const n = Math.floor(e.money * .4); e.money -= n; s.bank += n; }
      /* закупка: если на стройку не хватает дерева или камня, а деньги в казне есть — покупают у соседей */
      if (s.want) { const dw = s.want.wood - s.wood, ds = s.want.stone - s.stone; const keep = s.want.bank; if (dw > 0 && s.bank - keep >= 2) { const n = Math.min(dw, Math.floor((s.bank - keep) / 2)); s.wood += n; s.bank -= n * 2; } if (ds > 0 && s.bank - keep >= 2) { const n = Math.min(ds, Math.floor((s.bank - keep) / 2)); s.stone += n; s.bank -= n * 2; } }
      settle(s, m);
      planBuilding(s, m);
    }
  }
  function roleOfProf(p) { for (const k in CIVIC_PROF) if (CIVIC_PROF[k] === p) return k; return null; }
  function chooseProf(e, s) {
    const m = members(s), cnt = (p) => m.filter((o) => o.prof === p).length;
    const opts = [['lumber', 3 - cnt('lumber')], ['builder', 2.5 - cnt('builder')], ['mason', 2 - cnt('mason')], ['fisher', 1.5 - cnt('fisher') * .5], ['farmer', 1.5 - cnt('farmer') * .5], ['trader', 1.2 - cnt('trader')]];
    if (e.form === 'pirate') opts.push(['fisher', 4]); if (e.form === 'farmer') opts.push(['farmer', 5]); if (e.form === 'miner') opts.push(['mason', 5]); if (e.form === 'wizard') opts.push(['scholar', 3]); if (e.form === 'knight') opts.push(['builder', 3]);
    let tot = 0; for (const o of opts) { o[1] = Math.max(.2, o[1]); tot += o[1]; } let r = rf() * tot; for (const o of opts) { r -= o[1]; if (r <= 0) return o[0]; } return 'lumber';
  }
  /* семьи без жилья: пара или одинокий взрослый (дети живут с родителями) */
  function homeless(s, m) {
    const fam = [], seen = new Set();
    for (const e of m) {
      if (e.age < 16 || seen.has(e.id) || homeOf(e)) continue;
      const mate = Life.byId(e.mate); seen.add(e.id); const f = [e];
      if (mate && alive(mate) && mate.soc === s.id && !homeOf(mate)) { f.push(mate); seen.add(mate.id); }
      fam.push(f);
    }
    return fam;
  }
  function homeOf(e) { if (!e.home) return null; const b = Houses.byId(e.home.b); const r = b && !b.ruin && b.rooms[e.home.r]; if (!r || r.owners.indexOf(e.id) < 0) { e.home = null; return null; } return { b, r }; }
  const hasRole = (s, role) => Houses.list.some((b) => b.soc === s.id && b.rooms.some((r) => r.role === role));
  function needBuild(s) { const m = members(s); return homeless(s, m).length > 0 || civicNeed(s, m).length > 0 || !!s.want; }
  function civicNeed(s, m) { const n = m.length, out = []; if (n >= 5 && !hasRole(s, 'church')) out.push('church'); if (n >= 4 && !hasRole(s, 'workshop')) out.push('workshop'); if (n >= 6 && !hasRole(s, 'tavern')) out.push('tavern'); if (n >= 7 && !hasRole(s, 'library')) out.push('library'); return out; }
  function planBuilding(s, m) {
    if (Houses.list.some((b) => b.soc === s.id && !b.done && !b.ruin)) { s.want = null; return; }
    if (Houses.list.length >= 9) return;
    /* бездомных семей больше, чем свободных жилых комнат в своих домах */
    let vacant = 0; for (const b of Houses.list) if (b.soc === s.id && b.done && !b.ruin) for (const r of b.rooms) if (r.role === 'home' && !r.owners.length) vacant++;
    const fam = homeless(s, m).slice(vacant), civ = civicNeed(s, m); if (!fam.length && !civ.length) { s.want = null; return; }
    let nr = S.W >= 170 && (fam.length + civ.length) > 1 ? 2 : 1;
    const roles = [];
    roles.push(...civ.slice(0, nr === 2 ? 2 : 1));
    const own = Houses.list.filter((b) => b.soc === s.id).length, cap = own ? nr * 3 : 2;   /* первый дом — небольшой, чтобы встал быстро */
    if (!own) roles.length = 0;
    for (let k = 0; k < fam.length && roles.length < cap; k++) roles.push('home');
    if (!own && !roles.length && civ.length) roles.push(civ[0]);
    if (!roles.length) return;
    while (roles.length % nr) roles.push(fam.length ? 'home' : 'workshop');
    const stoneN = roles.filter((r) => r === 'church').length;
    const want = { wood: 8 * roles.length + 4, stone: 2 * roles.length + 4 * stoneN, bank: 3 * roles.length };
    s.want = want;
    if (s.wood < want.wood || s.stone < want.stone || s.bank < want.bank) {
      /* долго не хватает — глава строит поменьше: одну комнату */
      if (++s.short < 50 || roles.length === 1) return;
      roles.length = 1; roles[0] = fam.length ? 'home' : civ[0]; nr = 1;
      if (s.wood < 12 || s.stone < 2 || s.bank < 3) return;
    }
    const L = ent(s.leader) || m[0], sx = L ? L.x : center(s);
    let nf = Math.ceil(roles.length / nr), site = Houses.findSite(sx, nr * Houses.RW + 2, nf * Houses.FH + 4, 140);
    /* широкий дом не встал (холмы, вода) — строят узкий, повыше: по комнате на этаж */
    if (!site && nr === 2) { nr = 1; roles.length = Math.min(roles.length, 3); nf = roles.length; site = Houses.findSite(sx, Houses.RW + 2, nf * Houses.FH + 4, 160); }
    if (!site && roles.length > 1) { roles.length = 1; nf = 1; site = Houses.findSite(sx, Houses.RW + 2, Houses.FH + 4, 180); }
    if (!site) return;
    const style = roles.indexOf('church') >= 0 && roles.length === 1 ? 'stone' : roles.indexOf('library') >= 0 ? 'plaster' : (rf() < .5 ? 'wood' : 'plaster');
    const rooms2 = roles.length;
    s.wood = Math.max(0, s.wood - (8 * rooms2 + 4)); s.stone = Math.max(0, s.stone - 2 * rooms2); s.bank = Math.max(0, s.bank - 3 * rooms2); s.short = 0; s.want = null;
    /* роли по этажам: общественные — внизу, жилые — наверху */
    const order = roles.slice().sort((a, b) => (a === 'home') - (b === 'home'));
    const b = Houses.create(s.id, site, nr, order, style, roles.indexOf('church') >= 0 ? 'purple' : s.roof);
    note((L ? L.name : 'Общество') + ' заложил' + (L && L.fem ? 'а' : '') + ' ' + b.name.toLowerCase() + ': ' + order.map((r) => Houses.ROLES[r].n.toLowerCase()).join(', ') + ' (' + nf + ' эт.)', s);
    if (L) Life.emote(L, 'alert', 120);
  }
  /* заселение готовых домов и назначение работников в общественные комнаты */
  function settle(s, m) {
    for (const b of Houses.list) {
      if (b.soc !== s.id || !b.done || b.ruin) continue;
      if (!b.announced) { b.announced = true; note('Достроено: ' + b.name.toLowerCase() + ' («' + s.name + '»)', s, true); for (const e of m) if (Math.abs(e.x - (b.x0 + b.w / 2)) < 80) Life.emote(e, 'heart', 120); }
      b.rooms.forEach((r, ri) => {
        r.owners = r.owners.filter((id) => { const o = Life.byId(id); return alive(o) && o.home && o.home.b === b.id && o.home.r === ri; });
        if (r.role === 'home' && !r.owners.length) {
          const f = homeless(s, m)[0]; if (!f) return;
          const kids = m.filter((k) => k.age < 16 && f.some((p) => p.id === k.par));
          for (const p of f.concat(kids)) { p.home = { b: b.id, r: ri }; r.owners.push(p.id); }
          note(f.map((p) => p.name).join(' и ') + ' заселил' + (f.length > 1 ? 'ись' : (f[0].fem ? 'ась' : 'ся')) + ' в ' + b.name.toLowerCase(), s);
        }
        if (r.role !== 'home') {
          const prof = CIVIC_PROF[r.role];
          if (!m.some((e) => e.prof === prof)) { const civicP = Object.values(CIVIC_PROF), c = m.filter((e) => e.age >= 18 && e.prof !== 'builder' && e.id !== s.leader && civicP.indexOf(e.prof) < 0).sort((a, b2) => (b2.cha || 0) - (a.cha || 0))[0]; if (c) { c.prof = prof; note(c.name + ' теперь ' + PROF[prof].n.toLowerCase() + ' («' + s.name + '»)', s); } }
        }
      });
    }
    /* родственники, переехавшие после свадьбы */
    for (const e of m) if (e.mate != null && e.mst === 2) { const p = Life.byId(e.mate); if (p && alive(p) && p.home && !homeOf(e)) { const b = Houses.byId(p.home.b), r = b && b.rooms[p.home.r]; if (r) { e.home = { b: b.id, r: p.home.r }; r.owners.push(e.id); } } }
  }
  /* дом рухнул или сгорел */
  function onCollapse(b) {
    const s = byId(b.soc);
    note((b.done ? b.name : 'Недостроенный дом') + (s ? ' («' + s.name + '»)' : '') + (b.done ? ' рушится' : ' разрушен'), s, true);
    for (const e of S.ents) if (e.home && e.home.b === b.id) { e.home = null; if (alive(e)) Life.emote(e, 'broken', 160); }
    syncHomes();
  }
  /* общественное место нужной роли в своём обществе (или любое) */
  function place(e, role) {
    let best = null, bd = 1e9;
    for (const b of Houses.list) { if (!b.done || b.ruin) continue; b.rooms.forEach((r, ri) => { if (r.role !== role) return; const d = Math.abs(b.x0 + b.w / 2 - e.x) + (b.soc === e.soc ? 0 : 60); if (d < bd) { bd = d; best = { b, r, ri }; } }); }
    return bd < 220 ? best : null;
  }
  function site(e) { return Houses.list.find((b) => b.soc === e.soc && !b.done && !b.ruin) || null; }
  function step(sim) {
    S = sim;
    Houses.step(sim, onCollapse);
    if (S.frame % 90 === 0) tick();
  }
  function clear() { socs.length = 0; log.length = 0; nameK = 0; Houses.clear(); }
  /* ---------- отношения между обществами и войны ----------
     Отношение (−10..10) тянется к средней симпатии их жителей друг к другу (×1,5), тесное соседство давит (−0,25 за проверку,
     иногда спор из-за земли), браки между обществами мирят. Ниже −6 — может начаться война; после потерь или со временем — мир. */
  const relOf = (a, b) => a.rel[b.id] || 0;
  function setRel(a, b, v) { v = Math.max(-10, Math.min(10, v)); a.rel[b.id] = v; b.rel[a.id] = v; }
  function incident(sa, sb, k) { const a = byId(sa), b = byId(sb); if (a && b && a !== b) setRel(a, b, relOf(a, b) - k); }
  function diplomacy() {
    for (let i = 0; i < socs.length; i++) for (let j = i + 1; j < socs.length; j++) {
      const a = socs[i], b = socs[j], ma = members(a), mb = members(b); if (!ma.length || !mb.length) continue;
      let sum = 0, n = 0, wed = 0;
      for (const e of ma) for (const o of mb) { sum += e.rel[o.id] || 0; n++; if (e.mate === o.id) wed++; }
      const avg = n ? sum / n : 0, close = Math.abs(center(a) - center(b)) < 90 && ma.length >= 4 && mb.length >= 4;
      let r = relOf(a, b); r += (avg * 1.5 - r) * .05 + wed * .05 - (close ? .25 : 0);
      if (close && rf() < .01) { r -= 1; note('Спор из-за земли между «' + a.name + '» и «' + b.name + '»', a); }
      setRel(a, b, r);
      const adults = (m) => m.filter((e) => e.age >= 16 && e.age < 62).length;
      if (!a.war[b.id]) {
        if (r < -6 && adults(ma) >= 3 && adults(mb) >= 3 && rf() < .1) {
          a.war[b.id] = b.war[a.id] = true; a.warT[b.id] = b.warT[a.id] = 0; a.lost = b.lost = 0;
          const [agg, def] = rf() < .5 ? [a, b] : [b, a];
          note('Война! «' + agg.name + '» напало на «' + def.name + '»', agg, true);
          for (const e of ma.concat(mb)) Life.emote(e, 'alert', 160);
        }
      } else {
        a.warT[b.id]++; b.warT[a.id] = a.warT[b.id];
        const loss = a.lost + b.lost;
        if ((loss >= 3 && rf() < .08) || (a.warT[b.id] > 200 && rf() < .05) || !adults(ma) || !adults(mb)) {
          a.war[b.id] = b.war[a.id] = false; setRel(a, b, -2);
          note('Мир между «' + a.name + '» и «' + b.name + '»' + (loss ? ' (павших: ' + loss + ')' : ''), a, true);
          for (const e of ma.concat(mb)) Life.emote(e, 'note', 140);
        }
      }
    }
  }
  /* кто-то пал в бою */
  function onSlain(k, v) {
    const sv = byId(v.soc), sk = byId(k.soc);
    if (sv) sv.lost++;
    if (sk && sv && sk !== sv) setRel(sk, sv, relOf(sk, sv) - 2);
    for (const o of S.ents) if (o !== v && alive(o) && (o.mate === v.id || o.par === v.id || v.par === o.id)) { o.rel[k.id] = -8; }
    note(v.name + (v.fem ? ' пала' : ' пал') + ' в бою — ' + k.name + (sk && sv && sk !== sv ? ' («' + sk.name + '»)' : ''), sv, true);
  }
  function relSocLabel(v, war) { if (war) return 'Война'; if (v >= 5) return 'Союзники'; if (v >= 2) return 'Дружат'; if (v > -3) return 'Нейтрально'; if (v > -6) return 'Напряжённо'; return 'Враждуют'; }
  /* как зовут отношения a к b */
  function relLabel(a, b) {
    const r = a.rel[b.id] || 0;
    if (a.mate === b.id) return a.mst === 2 ? (a.fem ? 'Муж' : 'Жена') : 'Пара';
    if (a.par === b.id) return b.fem ? 'Мама' : 'Папа';
    if (b.par === a.id) return b.fem ? 'Дочь' : 'Сын';
    if (a.par != null && a.par === b.par) return b.fem ? 'Сестра' : 'Брат';
    if (r <= -3) return 'Враг'; if (r < 0) return 'Неприязнь'; if (r >= 6) return 'Лучший друг'; if (r >= 2) return 'Друг'; if (r > 0) return 'Знакомый';
    return 'Не знакомы';
  }
  return { step, clear, earn, give, pay, place, site, homeOf, members, byId, socs, log, PROF, relLabel, center, note, onSlain, incident, relSocLabel, set onNote(f) { onNote = f; } };
})();
