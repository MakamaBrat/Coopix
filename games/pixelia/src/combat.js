'use strict';
/* ПИКСЕЛИЯ — драки, оружие, бой с зомби и войны обществ.
   Вызывается из Life.think раньше обычных занятий: пока у человечка есть цель боя (e.fight), он подбегает на длину
   своего оружия, бьёт с перезарядкой, держит дистанцию, раненый отступает.
   - Зомби: вооружённые (или те, рядом с кем есть вооружённый союзник) идут бить, остальные убегают (sim.js).
   - Война обществ (Town: s.war): бойцы ищут врагов и бьются насмерть; дети, старики и раненые убегают.
   - Личные враги (симпатия ≤ −4) иногда дерутся на кулаках: драка не смертельна, побитый уходит.
   Оружие делают из дерева и камня общества (Life: задача arm → Combat.craft); у лесорубов — топор. */
const Combat = (function () {
  const WEAP = {
    fist: { n: 'Кулаки', dmg: 6, reach: 10, cd: 30, kb: .4 },
    club: { n: 'Дубина', dmg: 13, reach: 7.5, cd: 40, kb: .9 },
    spear: { n: 'Копьё', dmg: 15, reach: 9.5, cd: 44, kb: .6 },
    axe: { n: 'Топор', dmg: 16, reach: 7.5, cd: 42, kb: .7 },
    sword: { n: 'Меч', dmg: 22, reach: 8, cd: 36, kb: .8 }
  };
  let S = null;
  const alive = (o) => o && !o.dying;
  const human = (o) => alive(o) && !o.z;
  const adult = (e) => e.age >= 16 && e.age < 62;
  const fighterOK = (e) => human(e) && adult(e) && e.hp > 35 && !e.sleep && !e.preg && e.carriedBy == null && e.heldBy == null && e.rideOn == null;
  const town = () => typeof Town !== 'undefined';
  function warWith(a, b) { if (!town() || a.soc == null || b.soc == null || a.soc === b.soc) return false; const s = Town.byId(a.soc); return !!(s && s.war && s.war[b.soc]); }
  function armedNear(e, r) { let n = 0; for (const o of S.ents) if (o !== e && human(o) && o.weapon && Math.abs(o.x - e.x) < r && Math.abs(o.y - e.y) < 20) n++; return n; }
  /* хватит ли духу идти на зомби: нужно оружие или вооружённый товарищ рядом */
  function brave(e) { S = S || Sim; return fighterOK(e) && (!!e.weapon || armedNear(e, 30) >= 1); }
  /* опасно ли сейчас (тогда жители спешат вооружиться) */
  function danger(e) {
    S = S || Sim;
    if (town()) { const s = Town.byId(e.soc); if (s && s.war && Object.values(s.war).some(Boolean)) return true; }
    for (const o of S.ents) if (o.z && !o.dying && Math.abs(o.x - e.x) < 160) return true;
    return false;
  }
  /* сделать оружие из запасов общества: меч — из камня и дерева (в мастерской или у ремесленника вернее), иначе копьё или дубина */
  function craft(e, s) {
    if (!s) return null;
    let w = null;
    if (s.stone >= 3 && s.wood >= 2 && (e.prof === 'crafter' || Math.random() < .35)) { w = 'sword'; s.stone -= 3; s.wood -= 2; }
    else if (s.wood >= 3) { w = Math.random() < .55 ? 'spear' : 'club'; s.wood -= 3; }
    if (w) e.weapon = w;
    return w;
  }
  function start(e, t, lethal) {
    e.fight = { t: t.id, lethal, cd: 8 + ((Math.random() * 10) | 0), start: S.frame };
    e.task = 'fight'; e.txt = t.z ? 'Бьётся с зомби' : (lethal ? 'Сражается с ' : 'Дерётся с ') + t.name;
    e.sleep = 0; e.goal = null; e.nav = null; e.fin = null; e.phase = null; e.chatWith = null;
    Life.emote(e, lethal ? 'alert' : 'down', 70);
  }
  function stop(e, t) {
    if (t && !t.dying && e.hp < 40) { e.fear = 90; e.dir = t.x > e.x ? -1 : 1; e.txt = 'Отступает'; Life.emote(e, 'broken', 80); }
    e.fight = null; e.task = null; e.tt = 0; e.face = null;
  }
  function hit(e, t, W) {
    e.dir = e.face = t.x < e.x ? -1 : 1; e.atk = e.weapon ? 16 : 22; e.pside = !e.pside;   /* кулаком — удар держится дольше, чтобы его было видно */
    let dmg = W.dmg * (.75 + Math.random() * .5) * (e.age < 18 ? .7 : 1) * (e.form === 'knight' ? 1.3 : 1) / ((t.ab && t.ab.tough) || 1);
    if (t.z) dmg *= 1.5;   /* по зомби бьют в голову */
    /* драка не насмерть, но изредка удар выходит роковым: кулаком 0,6% за удар, оружием 2% (по ослабевшему — вдвое чаще): примерно одна драка из 15 на кулаках кончается смертью */
    let fatal = false;
    if (!e.fight.lethal) { const ch = (e.weapon ? .02 : .006) * (t.hp < 50 ? 2 : 1); if (!t.z && Math.random() < ch) { fatal = true; dmg = Math.max(dmg * 2.5 + 20, t.hp + 1); } else dmg = Math.min(dmg, Math.max(0, t.hp - 22)); }
    if (e.fight.lethal && !t.z) { dmg *= 1.35; if (t.hp - dmg < 25 && Math.random() < .3) dmg = t.hp + 1; }   /* в битве раны тяжелее, ослабевшего добивают */
    t.hp -= dmg; t.hurt = 20; t.stun = Math.max(t.stun || 0, 8); t.kx = (t.kx || 0) + e.dir * W.kb;
    t.hitT = (typeof People !== 'undefined' && People.T != null) ? People.T : S.frame; t.hitD = e.dir; t.hitFist = !e.weapon;   /* вспышка удара у живота */
    if (S.sfx) S.sfx('tap', .35);
    if (t.hp <= 0) {
      S.die(t, 'slain', t.z ? 'упокоен: ' + e.name : fatal ? 'случайно убит в драке: ' + e.name : 'убит в бою: ' + e.name);
      if (fatal) { e.fight = null; e.task = null; e.tt = 0; e.fear = 120; e.txt = 'В ужасе: не хотел' + (e.fem ? 'а' : '') + ' убивать'; Life.emote(e, 'cry', 200); if (town()) Town.note(e.name + ' случайно убил' + (e.fem ? 'а' : '') + ' ' + t.name + ' в драке', Town.byId(e.soc), true); }
      e.kills = (e.kills || 0) + 1; if (!fatal) Life.emote(e, t.z ? 'spark' : 'alert', 120);
      if (!t.z && town()) Town.onSlain(e, t);
      return;
    }
    if (!t.z && human(t) && !e.fight.lethal && t.hp > 0 && Math.random() < (e.weapon ? .05 : .09)) {   /* нокдаун: лежачего не бьют — драка на этом кончается */
      t.ko = 90; t.stun = Math.max(t.stun || 0, 90); stop(t, e); t.fear = 0; stop(e, t); e.cheerT = 50; Life.emote(e, 'spark', 90); Life.emote(t, 'down', 120);
      if (town()) Town.note(e.name + ' отправил' + (e.fem ? 'а' : '') + ' ' + t.name + ' в нокдаун', Town.byId(e.soc));
      return;
    }
    if (!t.z && human(t)) {
      if (!e.fight.lethal) { e.rel[t.id] = (e.rel[t.id] || 0) - .3; t.rel[e.id] = (t.rel[e.id] || 0) - .5; }
      if (!t.fight) { if (fighterOK(t)) start(t, e, e.fight.lethal); else { t.fear = 80; t.dir = e.x > t.x ? -1 : 1; t.task = null; t.txt = 'Убегает'; } }
    }
  }
  /* шаг боя: true — бой ещё идёт и человечком управляет он */
  function step(e) {
    const t = Life.byId(e.fight.t);
    const lim = e.fight.lethal ? 12 : 40;   /* на войне бьются почти до конца */
    if (!t || t.dying || (!e.fight.lethal && t.hp < 30) || e.hp < lim || S.frame - e.fight.start > 1800) { stop(e, t); return false; }
    if (e.fight.lethal && !t.z && !warWith(e, t)) { stop(e, null); Life.emote(e, 'note', 80); return false; }   /* заключили мир — бой окончен */
    const W = WEAP[e.weapon || 'fist'], dx = t.x - e.x, adx = Math.abs(dx);
    if (adx > 140 || Math.abs(t.y - e.y) > 34) { stop(e, null); return false; }
    e.dir = dx < 0 ? -1 : 1; e.face = e.dir;   /* в драке всегда лицом к противнику, даже когда отступает */
    if (adx > W.reach) { e.idle = 0; e.spdk = 1.3; if (adx > 10 && Math.random() < .01) e.jump = true; }
    else {
      e.idle = 1;
      if (adx < (e.weapon ? 5.5 : 8)) { e.idle = 0; e.dir = -e.dir; }   /* не лезет вплотную: пятится назад, лицом к противнику */
      else if (--e.fight.cd <= 0 && Math.abs(t.y - e.y) < 8) { hit(e, t, W); if (e.fight) e.fight.cd = W.cd + ((Math.random() * 12) | 0); }
    }
    return true;
  }
  /* война: сначала бойцы собираются строем у края своей деревни (≈12 с), потом идут на вражескую деревню; встретив врага — бой */
  function march(e) {
    const s = town() && Town.byId(e.soc), fs = s && Town.byId(e.march.foe);
    if (!s || !fs || !s.war || !s.war[fs.id] || !fighterOK(e)) { e.march = null; if (e.task === 'march') { e.task = null; e.tt = 0; } return false; }
    const my = Town.center(s), their = Town.center(fs), dir = Math.sign(their - my) || 1, ready = S.frame > ((s.warAt && s.warAt[fs.id]) || 0) + 700;
    const slot = ((e.id % 7) - 3) * 2.2, gx = ready ? their - dir * 6 + slot : my + dir * 14 + slot;
    e.task = 'march'; e.tt = 60; e.txt = ready ? 'Идёт в бой на «' + fs.name + '»' : 'Собирается на битву с «' + fs.name + '»';
    const dx = gx - e.x; if (Math.abs(dx) < 1.5) { e.idle = 1; e.dir = dir; e.face = dir; } else { e.idle = 0; e.dir = Math.sign(dx); e.spdk = ready ? 1.2 : 1; }
    return true;
  }
  /* вызывается из Life.think каждый такт; true — занятие на этот такт задал бой */
  function think(e, sim) {
    S = sim;
    if (e.prof === 'lumber' && !e.weapon && e.age >= 16) e.weapon = 'axe';
    if (e.fight) { if (step(e)) return true; }
    if (e.march && (S.frame + e.id) % 15 !== 0) { if (march(e)) return true; }   /* раз в 15 тактов — осмотреться: нет ли врага рядом */
    if ((S.frame + e.id) % 15 || e.sleep) return false;
    /* опасность: безоружный взрослый бросает дела и идёт делать оружие (если есть из чего) */
    if (!e.weapon && fighterOK(e) && e.task !== 'arm' && town() && danger(e)) { const s = Town.byId(e.soc); if (s && s.wood >= 3) e.tt = 0; }
    /* бегство: на войне враг близко, а сам не боец */
    let best = null, bd = 1e9;
    for (const o of S.ents) {
      if (o === e || !alive(o)) continue;
      const d = Math.abs(o.x - e.x) + Math.abs(o.y - e.y) * .5;
      if (o.z) { if (d < (e.weapon ? 110 : 60) && d < bd && brave(e)) { best = o; bd = d; } }
      else if (warWith(e, o) && d < bd) {
        if (fighterOK(e) && d < (e.weapon ? 150 : 80)) { best = o; bd = d; }
        else if (!fighterOK(e) && d < 30) { e.fear = 60; e.dir = o.x > e.x ? -1 : 1; e.txt = 'Прячется от врагов'; }
      }
    }
    if (best) { e.march = null; start(e, best, true); return true; }
    if (fighterOK(e) && town() && !e.march) { const s = Town.byId(e.soc), foe = s && s.war ? Object.keys(s.war).find((k) => s.war[k]) : null; if (foe != null) { e.march = { foe: +foe }; return march(e); } }
    /* задиры: «Боец» и «Рыцарь» сами задирают ближайших взрослых — драка до первой слабости (не насмерть), потом передышка */
    if ((e.form === 'fighter' || e.form === 'knight') && fighterOK(e) && S.frame > (e.aggT || 0) && Math.random() < .25) {
      if (e.form === 'knight' && !e.weapon) e.weapon = 'sword';
      let tgt = null, td = 1e9;
      for (const o of S.ents) { if (o === e || !human(o) || !adult(o) || o.sleep || o.fight || o.hp < 45) continue; const d = Math.abs(o.x - e.x); if (d < 45 && Math.abs(o.y - e.y) < 10 && d < td) { td = d; tgt = o; } }
      if (tgt) {
        e.aggT = S.frame + 900; start(e, tgt, false); e.txt = 'Задирается к ' + tgt.name; Life.emote(e, 'shake', 90);
        if (fighterOK(tgt)) start(tgt, e, false); else { tgt.fear = 80; tgt.dir = e.x > tgt.x ? -1 : 1; tgt.task = null; tgt.txt = 'Убегает от задиры'; }
        if (town()) { Town.note(e.name + ' затеял' + (e.fem ? 'а' : '') + ' драку с ' + tgt.name, Town.byId(e.soc)); if (e.soc !== tgt.soc) Town.incident(e.soc, tgt.soc, .5); }
        return true;
      }
    }
    /* личная вражда: иногда кулачная драка */
    if (fighterOK(e) && Math.random() < .015) for (const o of S.ents) {
      if (o === e || !human(o) || !adult(o) || o.sleep || o.fight) continue;
      if ((e.rel[o.id] || 0) <= -4 && Math.abs(o.x - e.x) < 12 && Math.abs(o.y - e.y) < 6) {
        start(e, o, false); start(o, e, false);
        if (town()) Town.note(e.name + ' и ' + o.name + ' подрались', Town.byId(e.soc));
        if (town() && e.soc !== o.soc) Town.incident(e.soc, o.soc, 1.5);
        return true;
      }
    }
    return false;
  }
  /* оружие в руке на слое людей: древко пикселями от кисти, при ударе — замах сверху вперёд */
  const LOOK = { club: { L: 9, c: '#6a4426', end: '#8e5c34', fat: 1 }, spear: { L: 12, c: '#7a5030', end: '#dfe4ec' }, axe: { L: 8, c: '#6a4426', end: '#c8ced8', head: 1 }, sword: { L: 9, c: '#e8eef6', end: '#ffffff', hilt: '#e2a83e' } };
  function draw(c, e, cx, fy, dh, hand) {
    const w = LOOK[e.weapon]; if (!w) return;
    /* оружие в кисти передней руки (её даёт спрайт); рукоять чуть ниже кисти — кулак обхватывает древко */
    const d = (e.task === 'fight' && e.face ? e.face : e.dir) < 0 ? -1 : 1, hx = hand ? Math.round(hand[0]) : cx + d * 3, hy = hand ? Math.round(hand[1]) + 1 : fy - Math.round(dh * .43);
    const a = e.atk > 0 ? -1.9 + (1 - e.atk / 16) * 2.3 : (e.task === 'fight' ? -.55 : -1.25);
    const ca = Math.cos(a) * d, sa = Math.sin(a), px = [];
    if (e.atk > 0 && e.atk < 15) {   /* след удара: светлая дуга от замаха до клинка */
      const r0 = w.L - .5;
      for (let q = -1.9; q < a; q += .09) { c.fillStyle = q > a - .45 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)'; c.fillRect(Math.round(hx + Math.cos(q) * d * r0), Math.round(hy + Math.sin(q) * r0), 1, 1); }
    }
    for (let t = -2; t < w.L; t++) px.push([Math.round(hx + ca * t), Math.round(hy + sa * t), t]);   /* хвостик рукояти торчит из кулака */
    c.fillStyle = 'rgba(30,16,12,.85)'; for (const [x, y] of px) c.fillRect(x - 1, y, 3, 1);   /* тёмный контур */
    for (const [x, y, t] of px) {
      let col = w.c; if (t >= w.L - 3) col = w.end; if (w.hilt && t < 2) col = w.hilt;
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
      if ((w.fat || w.head) && t >= w.L - 3) { c.fillRect(x + d, y, 1, 1); if (w.head) { c.fillRect(x + 2 * d, y, 1, 1); c.fillRect(x + d, y + 1, 1, 1); } }
      if (w.hilt && t === 2) { c.fillStyle = w.hilt; c.fillRect(x - 1, y + (sa > -.5 ? -1 : 0), 3, 1); }
    }
  }
  return { think, start, brave, danger, craft, draw, warWith, WEAP };
})();
