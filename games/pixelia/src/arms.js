'use strict';
/* ПИКСЕЛИЯ — взрывчатка игрока: бомба, мина, дрон, ракета (с прицелом), гранаты (обычная, осколочная, газовая, дымовая, светошумовая).
   Снаряды — физические предметы поверх мира: летят с гравитацией, отскакивают от твёрдого, катятся, тонут медленнее,
   у кого запал — мигают и взрываются через Sim.blast (он же бьёт людей и дома). Шаг — из Life.step (каждый такт симуляции),
   рисуются на слое людей (People.draw → Arms.draw), 1 клетка = 2 точки слоя.
   Бросок: зажать палец в точке и потянуть — пунктир показывает траекторию, отпустить — летит (ui.js: aim). */
const Arms = (function () {
  const KINDS = {
    BOMB: { name: 'Бомба', hint: 'Падает, катится и взрывается через 3 секунды.' },
    MINE: { name: 'Мина', hint: 'Ложится на землю, через секунду взводится и взрывается, когда кто-то подходит.' },
    DRONE: { name: 'Дрон', hint: 'Кружит над миром, потом разгоняется и врезается куда-нибудь.' },
    ROCKET: { name: 'Ракета', hint: 'Потяни от точки пуска к цели. Ракета вылетает, разворачивается и наводится на крестик; промахнувшись — заходит на петлю. Взрывается от удара или через 7 секунд. Просто нажми — прилетит сверху.', aim: 'line' },
    GRENADE: { name: 'Граната', hint: 'Потяни и отпусти — бросок. Взрывается через 2,5 секунды.', aim: 'arc' },
    CLUSTER: { name: 'Осколочная', hint: 'Взрывается и разбрасывает горсть мелких бомбочек.', aim: 'arc' },
    GASGREN: { name: 'Газовая граната', hint: 'Выпускает ядовитый газ: люди в нём кашляют и слабеют. Газ горит!', aim: 'arc' },
    SMOKE: { name: 'Дымовуха', hint: 'Выпускает облако дыма.', aim: 'arc' },
    FLASH: { name: 'Светошумовая', hint: 'Вспышка и грохот: все рядом ослеплены и оглушены, но целы.', aim: 'arc' }
  };
  const list = [], booms = [], sparks = []; let S = null, flash = 0;
  const G = .09;   /* гравитация, клеток за такт² */
  const solidAt = (x, y) => { x = Math.floor(x); y = Math.floor(y); if (x < 1 || x >= S.W - 1 || y < 1) return true; if (y >= S.H - 1) return true; const t = S.A.type[y * S.W + x]; return t !== E.AIR && (KIND[t] === K.SOLID || KIND[t] === K.POWDER); };
  const liquidAt = (x, y) => { x = Math.floor(x); y = Math.floor(y); if (x < 1 || x >= S.W - 1 || y < 1 || y >= S.H - 1) return false; return KIND[S.A.type[y * S.W + x]] === K.LIQUID; };
  function add(o) { if (list.length > 160) list.shift(); list.push(Object.assign({ vx: 0, vy: 0, t: 0, rest: 0, spin: 0 }, o)); }
  /* поставить или бросить: kind, откуда (x, y), скорость (vx, vy), цель (для ракеты) */
  function spawn(kind, x, y, vx, vy, tx, ty) {
    S = S || Sim;
    switch (kind) {
      case 'BOMB': add({ k: kind, x, y, vx: vx || 0, vy: vy || 0, fuse: 180 }); break;
      case 'MINE': add({ k: kind, x, y, arm: 60 }); break;
      case 'DRONE': add({ k: kind, x, y: Math.min(y, S.H * .45), fly: 300 + ((Math.random() * 360) | 0), ph: Math.random() * 6.28, hx: x }); break;
      case 'ROCKET': {
        let arm = 22, a;
        if (tx == null) { tx = x; ty = y; x = Math.max(4, Math.min(S.W - 5, x + (Math.random() - .5) * 30)); y = 2; arm = 0; a = Math.atan2(ty - y, tx - x); }
        else { const base = Math.atan2(ty - y, tx - x), side = Math.cos(base) >= 0 ? -1 : 1; a = base + side * .55; }   /* пуск чуть выше линии прицела — к цели ракета идёт дугой */
        add({ k: kind, x, y, vx: Math.cos(a) * .9, vy: Math.sin(a) * .9, tx, ty, life: 420, arm, ox: x, oy: y }); break;
      }
      default: add({ k: kind, x, y, vx: vx || 0, vy: vy || 0, fuse: kind === 'FLASH' ? 100 : kind === 'GASGREN' || kind === 'SMOKE' ? 110 : 150 });
    }
    if (S.sfx) S.sfx('tap', .4);
  }
  function boom(o, R, power) { Sim.blast(Math.round(o.x), Math.round(o.y), R, power); o.dead = true; }
  /* картинка взрыва (поверх мира, слой людей): вспышка, огненный шар, ударная волна, искры и обломки, дым поднимается и тает */
  function fx(x, y, R, power) {
    if (booms.length > 24) booms.shift();
    booms.push({ x, y, R: Math.max(2.5, R), t: 0, p: power || 1, puffs: Array.from({ length: 4 + Math.round(R) }, () => ({ a: Math.random() * 6.28, d: Math.random() * R * .7, r: 1 + Math.random() * R * .45, v: .08 + Math.random() * .12 })) });
    const n = Math.min(40, 8 + Math.round(R * 4));
    for (let q = 0; q < n && sparks.length < 400; q++) { const a = -Math.PI / 2 + (Math.random() - .5) * 5.2, v = (.6 + Math.random() * 1.6) * Math.min(1.6, .5 + R / 7); sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .4, l: 18 + ((Math.random() * 24) | 0), hot: Math.random() < .7 }); }
    flash = Math.max(flash, Math.min(10, Math.round(R)));
  }
  function stepFx() {
    for (const b of booms) b.t++;
    for (let i = booms.length - 1; i >= 0; i--) if (booms[i].t > 80) booms.splice(i, 1);
    for (const p of sparks) { p.vy += .06; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.l--; if (S && solidAt(p.x, p.y)) { p.vy *= -.3; p.vx *= .5; p.y -= .5; } }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].l <= 0) sparks.splice(i, 1);
  }
  /* закрашенный «пиксельный» круг на слое 2 точки/клетка */
  function disc(c, X, Y, r, col) { r = Math.max(1, Math.round(r)); c.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(X - w, Y + dy, w * 2 + 1, 1); } }
  function ring(c, X, Y, r, col) { r = Math.round(r); c.fillStyle = col; let px0 = -9; for (let a = 0; a < 6.283; a += 1 / Math.max(4, r)) { const x = Math.round(X + Math.cos(a) * r), y = Math.round(Y + Math.sin(a) * r * .8); if (x !== px0) c.fillRect(x, y, 2, 2); px0 = x; } }
  function drawFx(c) {
    for (const b of booms) {
      const X = Math.round(b.x * 2), Y = Math.round(b.y * 2), R = b.R * 2, t = b.t;
      /* дым: клубы расползаются и поднимаются */
      if (t > 4) for (const p of b.puffs) { const k = Math.min(1, (t - 4) / 50), al = Math.max(0, .55 * (1 - (t - 4) / 76)); if (al <= 0) continue; disc(c, X + Math.cos(p.a) * (p.d * 2 + k * R * .5), Y + Math.sin(p.a) * p.d * 1.2 - t * p.v * 2, p.r * 2 * (1 + k * 1.2), 'rgba(' + (70 + t) + ',' + (64 + t) + ',' + (66 + t) + ',' + al.toFixed(2) + ')'); }
      /* ударная волна */
      if (t < 12) ring(c, X, Y, R * (.6 + t * .16), 'rgba(255,240,210,' + (.7 * (1 - t / 12)).toFixed(2) + ')');
      /* огненный шар: белая вспышка → жёлтое → оранжевое → тёмно-красное, сжимается */
      if (t < 22) {
        const g = t < 3 ? .7 + t * .15 : Math.max(0, 1.15 - (t - 3) * .055);
        disc(c, X, Y, R * g, t < 6 ? '#ff9a2a' : t < 12 ? '#e0501c' : 'rgba(150,40,24,.8)');
        disc(c, X, Y - 1, R * g * .72, t < 5 ? '#fff4b0' : t < 12 ? '#ffc040' : '#ff7a2a');
        if (t < 8) disc(c, X, Y - 1, R * g * .4, '#ffffff');
      }
    }
    for (const p of sparks) { const X = Math.round(p.x * 2), Y = Math.round(p.y * 2); c.fillStyle = p.hot ? (p.l > 14 ? '#fff2a0' : p.l > 7 ? '#ffa030' : '#c0401c') : '#3a2a26'; c.fillRect(X, Y, p.hot ? 1 : 2, p.hot ? 1 : 2); }
  }
  /* движение предмета с отскоком; true — ударился */
  function move(o, bounce) {
    const wet = liquidAt(o.x, o.y); if (wet) { o.vx *= .9; o.vy *= .9; }
    o.vy = Math.min(4, o.vy + G * (wet ? .35 : 1));
    let hit = false;
    const nx = o.x + o.vx, ny = o.y + o.vy;
    if (solidAt(nx, o.y)) { o.vx = -o.vx * bounce; hit = true; } else o.x = nx;
    if (solidAt(o.x, ny)) { if (Math.abs(o.vy) > .35) hit = true; o.vy = -o.vy * bounce; if (Math.abs(o.vy) < .25) { o.vy = 0; o.vx *= .9; } } else o.y = ny;
    o.x = Math.max(1.5, Math.min(S.W - 2.5, o.x)); o.y = Math.max(1, Math.min(S.H - 2, o.y));
    o.spin += o.vx * .25;
    return hit;
  }
  const near = (o, r, ry) => S.ents.filter((e) => !e.dying && Math.abs(e.x - o.x) < r && Math.abs(e.y - 6 - o.y) < (ry || r));
  function step(sim) {
    S = sim; if (flash > 0) flash--; stepFx();
    for (const o of list) {
      if (o.dead) continue; o.t++;
      switch (o.k) {
        case 'BOMB': move(o, .35); if (--o.fuse <= 0) boom(o, 7, 1.1); break;
        case 'MINE':
          if (!o.landed) { move(o, .1); if (o.vy === 0 && solidAt(o.x, o.y + 1)) o.landed = true; }
          if (o.arm > 0) o.arm--; else if (near(o, 2.8, 7).length || o.trip) { o.fuse = o.fuse == null ? 8 : o.fuse - 1; if (o.fuse <= 0) boom(o, 6, 1.05); }
          break;
        case 'DRONE': {
          if (o.fly > 0) {   /* кружит: волна по высоте, плавный дрейф */
            o.fly--; o.ph += .03; o.vx += (Math.sin(o.ph * .7) * .5 - o.vx) * .05; o.vy = Math.sin(o.ph * 1.3) * .25;
            o.x += o.vx; o.y += o.vy; if (o.x < 6 || o.x > S.W - 7) o.vx = -o.vx; o.x = Math.max(5, Math.min(S.W - 6, o.x)); o.y = Math.max(5, o.y);
            if (solidAt(o.x, o.y + 3)) o.y -= .6;
            if (o.fly === 0) { o.tx = 6 + Math.random() * (S.W - 12); let ty = 5; while (ty < S.H - 3 && !solidAt(o.tx, ty)) ty++; o.ty = ty; o.v = .4; }
          } else {   /* пикирует с разгоном */
            o.v = Math.min(4.2, o.v * 1.07 + .03); const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy) || 1;
            o.vx = dx / d * o.v; o.vy = dy / d * o.v; o.x += o.vx; o.y += o.vy;
            if (d < 1.5 || solidAt(o.x, o.y) || near(o, 2, 4).length) boom(o, 6, 1.1);
          }
          break;
        }
        case 'ROCKET': {
          /* как самонаводящаяся ракета: сначала летит, куда пустили (чуть проседая), потом поворачивает к крестику
             с ограниченным радиусом разворота — промахнувшись, уходит на петлю и заходит снова. Крестик не взрывает:
             только удар о твёрдое, о человека или конец топлива (таймер). */
          let ang = Math.atan2(o.vy, o.vx); const sp = Math.min(2.6, Math.hypot(o.vx, o.vy) + .035);
          if (!o.lock && Math.hypot(o.tx - o.x, o.ty - o.y) < 3) o.lock = true;   /* прошла через крестик — дальше прямо, пока не врежется */
          if (o.t > o.arm && !o.lock) {
            let da = Math.atan2(o.ty - o.y, o.tx - o.x) - ang; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832;
            const turn = .045 + Math.min(.03, (o.t - o.arm) * .0006); ang += Math.max(-turn, Math.min(turn, da));
            o.vx = Math.cos(ang) * sp; o.vy = Math.sin(ang) * sp;
          } else { o.vx = Math.cos(ang) * sp; o.vy = Math.sin(ang) * sp + (o.lock ? .015 : .02); }
          const n = Math.max(1, Math.ceil(sp / .45)); let hit = false;
          for (let q = 0; q < n && !hit; q++) {
            o.x += o.vx / n; o.y += o.vy / n;
            if (o.x < 1.5 || o.x > S.W - 2.5) { o.vx = -o.vx; o.x = Math.max(1.5, Math.min(S.W - 2.5, o.x)); }
            if (o.y < 1) continue;   /* над краем неба — летит дальше */
            if (solidAt(o.x, o.y) || (o.t > 8 && near(o, 1.4, 4).length)) hit = true;
          }
          if ((o.t & 1) === 0) { const i = Math.round(o.y - o.vy * 1.2) * S.W + Math.round(o.x - o.vx * 1.2); if (i > 0 && i < S.A.type.length && S.A.type[i] === E.AIR) S.put(i, E.SMOKE); }
          if (hit || --o.life <= 0) boom(o, 7, 1.25);
          break;
        }
        case 'CLUSTER': move(o, .35); if (--o.fuse <= 0) { const x0 = o.x, y0 = o.y; boom(o, 5, 1); for (let q = 0; q < 8; q++) { const a = -Math.PI / 2 + (q / 7 - .5) * 2.6 + (Math.random() - .5) * .3, v = 1.3 + Math.random() * 1.1; add({ k: 'BOMBLET', x: x0, y: y0 - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .5, safe: 10 }); } } break;
        case 'BOMBLET': { const hit = move(o, .25); if (o.safe > 0) o.safe--; else if (hit || o.t > 160) boom(o, 4, .9); break; }
        case 'GRENADE': move(o, .45); if (--o.fuse <= 0) boom(o, 5, 1); break;
        case 'GASGREN': case 'SMOKE': {
          move(o, .4);
          if (--o.fuse <= 0) {
            o.emit = (o.emit || 0) + 1;
            if (o.emit < 260 && (o.t & 1) === 0) for (let q = 0; q < 2; q++) { const x = Math.round(o.x + (Math.random() - .5) * 3), y = Math.round(o.y - 1 - Math.random() * 2), i = y * S.W + x; if (i > 0 && i < S.A.type.length && S.A.type[i] === E.AIR) S.put(i, o.k === 'SMOKE' ? E.SMOKE : E.GAS); }
            if (o.emit > 320) o.dead = true;
          }
          break;
        }
        case 'FLASH': move(o, .45); if (--o.fuse <= 0) {
          flash = 40; o.dead = true; if (S.sfx) S.sfx('boom', .5);
          for (const e of near(o, 30, 22)) { const k = 1 - Math.abs(e.x - o.x) / 30; e.stun = Math.max(e.stun || 0, Math.round(60 + 140 * k)); e.fear = Math.max(e.fear || 0, 80); if (!e.z && typeof Life !== 'undefined') Life.emote(e, 'alert', 140); e.txt = 'Ослеплён вспышкой'; }
        } break;
      }
    }
    /* мины срабатывают от взрыва рядом (цепочкой) */
    for (const o of list) if (o.dead && o.k !== 'MINE' && !o.chained) { o.chained = true; for (const m of list) if (m.k === 'MINE' && !m.dead && Math.hypot(m.x - o.x, m.y - o.y) < 9) m.trip = true; }
    /* ядовитый газ: люди в облаке кашляют и слабеют */
    if ((S.frame & 7) === 0 && list.some((o) => o.k === 'GASGREN' && o.emit)) for (const e of S.ents) {
      if (e.dying || e.z) continue; const cx = Math.floor(e.x), fy = Math.round(e.y); let g = 0;
      for (let k = 0; k < 12; k += 2) { const i = (fy - k) * S.W + cx; if (S.A.type[i] === E.GAS) g++; }
      if (g) { e.hp -= g * 1.6; e.hurt = 6; if (Math.random() < .3 && typeof Life !== 'undefined') Life.emote(e, 'down', 60); e.txt = 'Кашляет в газу'; if (e.hp <= 0) S.die(e, 'gas', 'отравлен газом'); }
    }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
  }
  /* ---------- рисование (слой людей, 2 точки на клетку) ---------- */
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function draw(c, T) {
    if (!S) return;
    drawFx(c);
    for (const o of list) {
      const X = Math.round(o.x * 2), Y = Math.round(o.y * 2), blink = o.fuse != null && o.fuse < 60 ? ((T >> 2) & 1) : ((T >> 4) & 1);
      switch (o.k) {
        case 'BOMB': px(c, X - 3, Y - 4, 7, 7, '#1a1218'); px(c, X - 2, Y - 3, 5, 5, '#3a3442'); px(c, X - 1, Y - 2, 2, 1, '#8a8498'); px(c, X + 1, Y - 6, 1, 2, '#8a5a32'); px(c, X + 1, Y - 7, 2, 1, blink ? '#ffe070' : '#ff7a2a'); break;
        case 'MINE': px(c, X - 4, Y - 2, 9, 3, '#1a1218'); px(c, X - 3, Y - 2, 7, 2, '#5a6248'); px(c, X - 1, Y - 3, 3, 1, '#1a1218'); px(c, X, Y - 3, 1, 1, o.arm > 0 ? '#8a8a8a' : blink ? '#ff3a2a' : '#5a1210'); break;
        case 'DRONE': {
          const r = ((T >> 1) & 1) ? 3 : 2;
          px(c, X - 3, Y - 1, 7, 3, '#1a1218'); px(c, X - 2, Y, 5, 1, '#5a6070'); px(c, X - 6, Y - 3, 2, 3, '#1a1218'); px(c, X + 5, Y - 3, 2, 3, '#1a1218');
          px(c, X - 5 - r, Y - 4, r * 2, 1, '#cfd6e0'); px(c, X + 6 - r, Y - 4, r * 2, 1, '#cfd6e0'); px(c, X, Y + 1, 1, 1, o.fly > 0 ? (blink ? '#3aff6a' : '#167a30') : '#ff3a2a'); break;
        }
        case 'ROCKET': {
          const a = Math.atan2(o.vy, o.vx); c.save(); c.translate(X, Y); c.rotate(a);
          px(c, -6, -2, 9, 4, '#1a1218'); px(c, -5, -1, 7, 2, '#3a8ae8'); px(c, 2, -1, 2, 2, '#d8e4f0'); px(c, -7, -3, 2, 6, '#1a1218'); px(c, -9 - ((T >> 1) & 1), -1, 3, 2, (T & 2) ? '#ffd040' : '#ff6a20');
          c.restore();
          /* крестик цели */
          const tx = Math.round(o.tx * 2), ty = Math.round(o.ty * 2), cc = (T >> 3) & 1 ? '#ff3a3a' : '#ffffff';
          px(c, tx - 6, ty, 4, 1, cc); px(c, tx + 3, ty, 4, 1, cc); px(c, tx, ty - 6, 1, 4, cc); px(c, tx, ty + 3, 1, 4, cc);
          break;
        }
        case 'BOMBLET': px(c, X - 2, Y - 2, 5, 5, '#1a1218'); px(c, X - 1, Y - 1, 3, 3, '#6a4a2a'); px(c, X, Y - 1, 1, 1, blink ? '#ffb040' : '#c8a060'); break;
        default: {   /* гранаты: тело и чека, цвет по виду */
          const col = { GRENADE: '#4a6a3a', CLUSTER: '#6a4a2a', GASGREN: '#8ab83a', SMOKE: '#9aa0aa', FLASH: '#d8d8e0' }[o.k] || '#4a6a3a';
          c.save(); c.translate(X, Y - 1); c.rotate(o.spin);
          px(c, -3, -3, 6, 7, '#1a1218'); px(c, -2, -2, 4, 5, col); px(c, -2, -2, 1, 2, 'rgba(255,255,255,.35)'); px(c, -1, -5, 2, 2, '#1a1218'); px(c, 1, -6, 2, 1, '#c8c8c8');
          if (o.fuse != null && o.fuse < 60 && blink) px(c, -1, -1, 2, 2, '#ff5040');
          c.restore();
        }
      }
    }
  }
  /* предпросмотр броска на слое fx (клетки мира): пунктир дуги или линия с крестиком */
  function preview(fxc, kind, x0, y0, x1, y1) {
    const K2 = KINDS[kind]; if (!K2 || !K2.aim) return;
    fxc.fillStyle = 'rgba(255,240,170,.9)';
    if (K2.aim === 'line') {
      const d = Math.hypot(x1 - x0, y1 - y0); for (let k = 0; k < d; k += 2) fxc.fillRect(Math.round(x0 + (x1 - x0) * k / d), Math.round(y0 + (y1 - y0) * k / d), 1, 1);
      fxc.fillStyle = 'rgba(255,70,60,.95)'; fxc.fillRect(x1 - 3, y1, 2, 1); fxc.fillRect(x1 + 2, y1, 2, 1); fxc.fillRect(x1, y1 - 3, 1, 2); fxc.fillRect(x1, y1 + 2, 1, 2);
      return;
    }
    const [vx, vy] = throwVel(x0, y0, x1, y1); let x = x0, y = y0, ux = vx, uy = vy;
    for (let t = 0; t < 140; t++) { ux *= 1; uy += G; x += ux; y += uy; if (t % 3 === 0) fxc.fillRect(Math.round(x), Math.round(y), 1, 1); if (y > S.H || x < 0 || x > S.W || solidAt(x, y)) break; }
  }
  /* скорость броска по протянутому пальцем отрезку (короткий тап — просто уронить) */
  function throwVel(x0, y0, x1, y1) { const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); if (d < 3) return [0, 0]; const v = Math.min(3.4, d * .065); return [dx / d * v, dy / d * v]; }
  /* иконки инструментов: пиксели кодом, 16x16 → 32x32 */
  const iconCache = {};
  function icon(kind) {
    if (iconCache[kind]) return iconCache[kind];
    if (!KINDS[kind]) return null;
    /* рисуем предмет как в мире, обрезаем по краю и вписываем в 40x40 целым увеличением */
    const t = document.createElement('canvas'); t.width = t.height = 40; const tx = t.getContext('2d');
    const save = list.slice(); list.length = 0;
    const o = { k: kind, x: 10, y: 11, fuse: 999, spin: -.3, arm: 0, fly: 1, vx: 1, vy: kind === 'ROCKET' ? -.5 : 0, tx: 99, ty: 99, t: 0 };
    list.push(o); S = S || Sim; draw(tx, 0);
    list.length = 0; for (const q of save) list.push(q);
    const d = tx.getImageData(0, 0, 40, 40).data; let x0 = 40, y0 = 40, x1 = 0, y1 = 0;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (d[(y * 40 + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, k = Math.max(1, Math.floor(36 / Math.max(w, h)));
    const c = document.createElement('canvas'); c.width = c.height = 40; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(t, x0, y0, w, h, Math.round((40 - w * k) / 2), Math.round((40 - h * k) / 2), w * k, h * k);
    return iconCache[kind] = c.toDataURL();
  }
  return { KINDS, spawn, step, draw, preview, throwVel, icon, list, fx, get flash() { return flash; } };
})();
