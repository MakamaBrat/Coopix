'use strict';
/* ПИКСЕЛИЯ — пиксельные спрайты интерфейса.
   Инструменты рисуются ASCII-схемами 14x14 с автоматической тёмной обводкой,
   элементы — изометрическими кубиками, каплями, облачками и кучками с текстурой материала. */
const Icons = (function () {
  const OL = '#1c1626';
  const PAL = {
    k: OL, w: '#ffffff', W: '#c9d2e6', n: '#9aa3b8', N: '#666e86', d: '#3e4560', D: '#2a2f44',
    y: '#fff3a0', g: '#ffd23c', G: '#e0961e', h: '#9a5a18', r: '#ff5a4a', R: '#b8283a', o: '#ff9a2e',
    b: '#5ab4ff', B: '#2e6ad0', c: '#b8f0ff', e: '#8ee05a', E: '#3aa046', f: '#1f6a34',
    m: '#c8864a', M: '#7a4a24', p: '#ffd0a8', P: '#e09a78', v: '#b67cff', V: '#6a3ab8', i: '#ff9ac8', I: '#d0608e', s: '#f4e4c0'
  };
  const ART = {
    pencil: ['...........iI', '..........iiiI', '.........iiiI', '........WnnN', '.......yggG', '......yggG', '.....yggG', '....yggG', '...yggG', '..pppP', '.ppP', '.dP', 'd'],
    brush: ['............mM', '...........mM', '..........mM', '.........mM', '........mM', '.......WnN', '......WnnN', '....cbbbB', '...cbbbB', '..bbbbB', '.bbbB', '.bbB', 'bB'],
    bucket: ['', '..NNNNNNNN', '.N........N', 'WbbbbbbbbbbW', 'nBBBBBBBBBBN', '.WnnnnnnnnNb', '.WnnnnnnnnN.b', '..WnnnnnnN..b', '..WnnnnnnN.bcb', '..WnnnnnnN.bbb', '..WNNNNNNN..b', '...NNNNNN'],
    line: ['', '..........ggg', '..........gyg', '.........wggg', '........ww', '.......ww', '......ww', '.....ww', '....ww', '...ww', '.gggw', '.gyg', '.ggg'],
    rect: ['', '.gggwwwwwwggg', '.gyg......gyg', '.ggg......ggg', '..w........w', '..w........w', '..w........w', '..w........w', '..w........w', '.ggg......ggg', '.gyg......gyg', '.gggwwwwwwggg'],
    eraser: ['', '', '......iiiiiiii', '.....iiiiiiiiI', '....iiiiiiiiI', '...iiiiiiiiI', '..bbbbbbbbI', '.bbbbbbbbB', 'bbbbbbbbB', 'BBBBBBBB'],
    lens: ['...nnnnn', '..nccccWn', '.ncccWWccn', '.nccWccccn', '.ncccccccn', '.nccccccbn', '.ncccccbbn', '..nccbbbn', '...nnnnnMM', '........MmM', '.........MmM', '..........MmM', '...........MM'],
    cloud: ['', '....wwww', '...wwwwww.ww', '..wwwwwwwwwww', '.wwwwwwwwwwwww', 'wwwwwwwwwwwwww', 'wwwwwwwwwwwwww', 'WWWWWWWWWWWWWW', '.WWWWWWWWWWWW', '', '...c...c...c', '..b...b...b'],
    globe: ['....bbbbbb', '..bbeeebbbbb', '.bbeeeeebbbbb', '.beceeebbbeeb', 'bbbeeebbbeeeEb', 'bbbbeebbbeeeEb', 'bbbbbbbbbbeEbB', 'bbbeebbbbbbbbB', 'bbeeeEbbbbbbBB', '.beeeEEbbbbBB', '.bbeeEbbbbBBB', '..bbbbbbBBBB', '....BBBBBB'],
    pause: ['', '', '..wwW...wwW', '..wwW...wwW', '..wwW...wwW', '..wwW...wwW', '..wwW...wwW', '..wwW...wwW', '..wwW...wwW', '..wwW...wwW', '..WWW...WWW'],
    play: ['', '...ee', '...eeee', '...eeeeee', '...eeeeeeee', '...eeeeeeeeee', '...eeeeeeeeeee', '...EEEEEEEEEEE', '...EEEEEEEEEE', '...EEEEEEEE', '...EEEEEE', '...EEEE', '...EE'],
    step: ['', '', '..w.......ww', '..www.....ww', '..wwwww...ww', '..wwwwwww.ww', '..WWWWWWW.WW', '..WWWWW...WW', '..WWW.....WW', '..W.......WW'],
    speed: ['', '', '.w.....w', '.www...www', '.wwwww.wwwww', '.wwwwwwwwwwwww', '.WWWWWWWWWWWWW', '.WWWWW.WWWWW', '.WWW...WWW', '.W.....W'],
    undo: ['', '', '...w', '..ww', '.wwwwwwwww', 'wwwwwwwwwwww', '.wwwwwwwwwwwW', '..ww.....WwwW', '...w......wwW', '..........wwW', '.........wwW', '.....wwwwwW', '.....WWWWW'],
    trash: ['.....nnnn', '.WWWWWWWWWWWW', '.nnnnnnnnnnnN', '..WnnNnnNnnN', '..WnnNnnNnnN', '..WnnNnnNnnN', '..WnnNnnNnnN', '..WnnNnnNnnN', '..WnnNnnNnnN', '..WnnNnnNnnN', '..WnnNnnNnnN', '...NNNNNNNN'],
    bolt: ['......yyyyy', '.....yyyyg', '....yyyyg', '...yyyyg', '..yyyyyyyyyg', '.....yyyyyg', '.....yyyyg', '....yyyyg', '....yyyg', '...yyyg', '...yyg', '..yyg', '..yg', '..g'],
    meteor: ['............yo', '..........yoor', '.........yoor', '.......yooor', '......yoorr', '....ooooR', '..mmmmoR', '.mmmmmmM', 'mmmMmmmmM', 'mmmmmmMmM', 'mMmmmmmMM', '.mMMmmMM', '..MMMMM'],
    bomb: ['..........y.y', '...........y', '..........y.y', '.........M', '....ddddM', '..dddddddd', '.dnndddddddd', '.dnddddddddd', '.ddddddddddD', '.ddddddddddD', '..dddddddDD', '...dddDDDD'],
    wind: ['', '.........ww', '........w..w', '...........w', '.wwwwwwwwwwW', '', 'WWwwwwwwwwwww', '', '..wwwwwwwwW', '...........w', '........w..w', '.........ww'],
    flame: ['.....r', '.....rr', '....rorr', '....roorr..r', '...rroorrr.rr', '..rrooyorrrrr', '..rooyyyoorrr', '.rrooyyyyoorr', '.rooyyyyyyorr', '.rooywwwyyoor', '.rooywwwwyoor', '..rooywwyoor', '...rrooooRR', '....RRRRRR'],
    snow: ['......c', '.c...ccc...c', '..c...c...c', '...c..c..c', '....c.c.c', '.....ccc', 'cccccwwwccccc', '.....ccc', '....c.c.c', '...c..c..c', '..c...c...c', '.c...ccc...c', '......c'],
    gear: ['.....nnnN', '..n..nnnN..N', '.nnnnnnnnnnNN', '..nnnnnnnnnN', '..nnnnnnnnnN', 'nnnnn....nNNN', 'nnnn......NNN', 'nnnn......NNN', 'nnnnn....nNNN', '..nnnnnnnnnN', '..nnnnnnnnNN', '.nnnnnnnNNNN', '..n..nnnN..N', '.....nNNN'],
    folder: ['', '', '.hhhh', 'hGGGGhhhhhhh', 'hGGGGGGGGGGGh', 'hgyyyyyyyyyyyh', 'hggggggggggGGh', 'hggggggggggGGh', 'hggggggggggGGh', 'hggggggggggGGh', 'hGGGGGGGGGGGGh', '.hhhhhhhhhhhh'],
    save: ['', 'bbbbbbbbbbbb', 'bbnnnnnnnnbbb', 'bbnwwwwddnbbbb', 'bbnwwwwddnbbbb', 'bbnnnnnnnnbbbb', 'bbbbbbbbbbbbbb', 'bWWWWWWWWWWWWB', 'bWwwwwwwwwwwWB', 'bWWWWWWWWWWWWB', 'bWwwwwwwwwwwWB', 'bWWWWWWWWWWWWB', 'BBBBBBBBBBBBBB'],
    lock: ['....nnnnnn', '...nn....NN', '...n......N', '...n......N', '.yyyyyyyyyyyy', '.yggggggggggG', '.yggggkkggggG', '.yggggkkggggG', '.ygggggkgggGG', '.yggggggggggG', '.yggggggggggG', '.GGGGGGGGGGGG'],
    check: ['', '', '...........ee', '..........eeE', '.........eeE', '........eeE', '.ee....eeE', '.eeE..eeE', '..eeEeeE', '...eeeE', '....eE'],
    close: ['', '..rr......rr', '..rrr....rrR', '...rrr..rrR', '....rrrrrR', '.....rrrR', '.....rrrR', '....rrrrrR', '...rrR..rrR', '..rrR....rrR', '..rR......rR'],
    sage: ['......bB', '.....bbB', '.....bbyB', '....bbbbB', '...bbbbbbB', '.BBBBBBBBBBB', '..WpppppppW', '..WpkpppkpW', '..WwwpppwwW', '...wwwwwww', '...wwwwwwW', '....wwwwW', '.....wwW'],
    star: ['......gg', '.....yggG', '.....yggG', 'yyyyyyggggGGGG', '.yyyyyggggGGG', '..yyyyggggGG', '...yyyggggG', '...yyggggGG', '..yyggG.gGGG', '..yggG...gGG', '.ygG......GG', '.gG........G'],
    home: ['......rr', '.....rrrR', '....rrrrrR', '...rrrrrrrR', '..rrrrrrrrrR', '.rrrrrrrrrrrR', 'RRRRRRRRRRRRRR', '.ssssssssssss', '.sbbsssmmMsss', '.sbbsssmmMsss', '.ssssssmmMsss', '.MMMMMMMMMMMM'],
    hand: ['....pp.pp.....', '....pp.pp.pp..', '.pp.pp.pp.pp..', '.pp.pp.pp.pp..', '.pp.pp.pp.pp..', '.pppppppppPp..', '.pppppppppPp.pp', '.ppppppppppPpp', '..ppppppppPPp.', '..pppppppPPp..', '...ppppppPp...', '....PPPPPP....'],
    human: ['....MMMMM', '...MMMMMMM', '...MpppppM', '...pkpppkp', '...ppppppp', '....ppPpp', '..rrrrrrrrr', '.prrrrrrrrrp', '.prrrrrrrrrp', '...BBBBBBB', '...BBB.BBB', '...BBB.BBB', '...MMM.MMM'],
    zombie: ['....fffff', '...fEfffEf', '...EeeeeeE', '...ererrere', '...eeeeeee', '....eeEee', '..NNNNNNNNN', '.eNNNdNNNNNe', '.eNNNNNNdNNe', '...dddddddd', '...ddd.ddd', '...ddd.ddd', '...MMM.MMM'],
    drop: ['......b', '.....bbb', '.....bbb', '....bbbbb', '...bbbbbbb', '..bcbbbbbbb', '.bcbbbbbbbbB', '.bcbbbbbbbbB', '.bbbbbbbbbbB', '.bbbbbbbbbBB', '..bbbbbbbBB', '...bBBBBBB'],
    sound: ['', '', '.....nN...w', '....nnN....w', 'WnnnnnN..w..w', 'WnnnnnN...w.w', 'WnnnnnN...w.w', 'WnnnnnN..w..w', '....nnN....w', '.....nN...w'],
    mute: ['', '', '.....nN', '....nnN', 'WnnnnnN.r...r', 'WnnnnnN..r.r', 'WnnnnnN...r', 'WnnnnnN..r.r', '....nnN.r...r', '.....nN'],
    sun: ['......g', '..g...g...g', '...g.....g', '.....yyy', '....yyggg', 'gg.yyggggG.gg', '...ygggggG', '....ggggG', '.....GGG', '...g.....g', '..g...g...g', '......g']
  };

  /* ---- сетка пикселей с обводкой ---- */
  const cache = {};
  function grid(w, h) { const a = new Array(w * h).fill(null); return { w, h, a, set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = c; }, get(x, y) { return (x < 0 || y < 0 || x >= w || y >= h) ? null : a[y * w + x]; } }; }
  function finish(g) {
    const cv = document.createElement('canvas'); cv.width = g.w; cv.height = g.h; const c = cv.getContext('2d');
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const v = g.get(x, y);
      if (v) { c.fillStyle = v; c.fillRect(x, y, 1, 1); }
      else if (g.get(x - 1, y) || g.get(x + 1, y) || g.get(x, y - 1) || g.get(x, y + 1)) { c.fillStyle = OL; c.fillRect(x, y, 1, 1); }
    }
    return cv.toDataURL();
  }
  function fromArt(name) {
    if (cache['a' + name]) return cache['a' + name];
    const rows = ART[name] || ART.close; const g = grid(16, 16);
    for (let y = 0; y < 14; y++) { const r = rows[y] || ''; for (let x = 0; x < 14; x++) { const ch = r[x]; if (ch && ch !== '.' && PAL[ch]) g.set(x + 1, y + 1, PAL[ch]); } }
    return cache['a' + name] = finish(g);
  }

  /* ---- цвета и шум ---- */
  function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  const css = (c, k) => { const a = c.length > 3 ? c[3] : 1; const v = [0, 1, 2].map((i) => Math.max(0, Math.min(255, Math.round(c[i] * k)))); return a < 1 ? 'rgba(' + v.join(',') + ',' + a + ')' : 'rgb(' + v.join(',') + ')'; };
  const pick = (n, list) => { for (const [p, col] of list) if (n < p) return col; return list[list.length - 1][1]; };

  /* изометрический кубик 16x16: face 0 — верх, 1 — левая грань, 2 — правая; d — глубина от верхней кромки грани */
  function cube(tex, seed) {
    const g = grid(18, 18);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = x + .5, py = y + .5, dx = Math.abs(px - 8), t = 4 * (1 - dx / 8);
      let face = -1, d = 0;
      if (py >= 4 - t && py <= 4 + t) { face = 0; d = py - (4 - t); } else if (py > 4 + t && py < 4 + t + 8) { face = px < 8 ? 1 : 2; d = py - (4 + t); }
      if (face < 0) continue;
      const col = tex(face, x, y, d, hash(x, y, seed), dx);
      let k = face === 0 ? 1.06 : face === 1 ? .76 : .54;
      if (face === 0 && (4 + t - py < 1 || d < 1)) k *= 1.2; else if (face > 0 && d < 1) k *= 1.16;
      if (face === 1 && px > 7) k *= 1.1; else if (face === 2 && px < 9) k *= .9;
      if (face > 0 && d > 7) k *= .85;
      g.set(x + 1, y + 1, col.flat ? css(col, 1) : css(col, k));
    }
    return g;
  }
  /* кучка сыпучего */
  function heap(tex, seed) {
    const g = grid(18, 18);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = x + .5, py = y + .5, ex = (px - 8) / 7.7, ey = (py - 15.6) / 11;
      if (ex * ex + ey * ey >= 1 || py < 4) continue;
      const n = hash(x, y, seed); const top = ex * ex + ey * ey > .78 && py < 12;
      const k = (top ? 1.12 : 1) * (1.08 - (px - 8) / 26) * (py > 14 ? .82 : 1);
      g.set(x + 1, y + 1, css(tex(x, y, n), k));
    }
    return g;
  }
  /* капля жидкости */
  function drop(tex, seed) {
    const g = grid(18, 18);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = x + .5, py = y + .5, dx = px - 8, cy = 10.2, r = 5.6;
      const inC = dx * dx + (py - cy) * (py - cy) < r * r, inT = py >= 1 && py < cy && Math.abs(dx) < (py - 1) / (cy - 1) * r * .98;
      if (!inC && !inT) continue;
      const n = hash(x, y, seed); let k = 1 - Math.max(0, dx) / 14 - Math.max(0, py - 12) / 14;
      let col = tex(x, y, n, dx, py);
      const hl = (px - 5.6) * (px - 5.6) / 1.3 + (py - 9) * (py - 9) / 5;
      if (hl < 1.2 && !col.flat) { g.set(x + 1, y + 1, 'rgba(255,255,255,.85)'); continue; }
      g.set(x + 1, y + 1, col.flat ? css(col, 1) : css(col, k));
    }
    return g;
  }
  /* облачко газа */
  function puff(col, seed, spark) {
    const g = grid(18, 18); const P = [[5, 10, 3.6], [11, 10.5, 3.4], [8.3, 6.8, 4.2], [8, 11.5, 3.6], [12.8, 8, 2.2]];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = x + .5, py = y + .5; let inside = false, edge = 9;
      for (const p of P) { const d = Math.hypot(px - p[0], py - p[1]); if (d < p[2]) { inside = true; edge = Math.min(edge, p[2] - d); } }
      if (!inside) continue;
      const k = (py < 7 ? 1.14 : py > 12 ? .8 : 1) * (edge < 1 && py > 9 ? .88 : 1) * (1 + (hash(x, y, seed) - .5) * .06);
      g.set(x + 1, y + 1, css(col, k));
    }
    if (spark) { g.set(12, 4, '#fff9c8'); g.set(11, 5, '#fff9c8'); g.set(13, 5, '#fff9c8'); g.set(12, 6, '#fff9c8'); }
    return g;
  }
  /* языки пламени */
  function flame(seed) {
    const g = grid(18, 18); const S = [[8, 1, 15.5, 5.6], [4.4, 6, 15, 2.8], [11.8, 3.5, 15, 3]];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = x + .5, py = y + .5; let v = -1, tt = 0;
      for (const [cx, top, bot, mw] of S) {
        if (py < top || py > bot) continue; const t = (py - top) / (bot - top);
        const w = mw * Math.sin(Math.min(1, t * 1.3) * Math.PI / 2) * (t > .82 ? 1 - (t - .82) / .18 * .45 : 1);
        const q = 1 - Math.abs(px - cx - (1 - t) * .8) / w; if (q > 0 && q * t > v) { v = q * t; tt = t; }
      }
      if (v < 0) continue;
      g.set(x + 1, y + 1, v > .5 && tt > .55 ? '#fff6c8' : v > .32 ? '#ffd23c' : v > .14 ? '#ff9a2e' : '#ff4a2a');
    }
    return g;
  }
  function art16(rows, pal) { const g = grid(18, 18); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && (pal[ch] || PAL[ch])) g.set(x + 1, y + 1, pal[ch] || PAL[ch]); } }); return g; }

  /* ---- текстуры материалов ---- */
  const C = (r, g, b, a) => a == null ? [r, g, b] : [r, g, b, a];
  const flat = (a) => { a.flat = true; return a; };
  const CUBES = {
    EARTH: (f, x, y, d, n) => {
      if (f === 0) return pick(n, [[.18, C(70, 150, 52)], [.32, C(126, 214, 84)], [1, C(96, 186, 64)]]);
      if (d < 1.4 || (d < 3.4 && hash(x, 0, 3) < .45)) return C(88, 176, 58);
      return pick(n, [[.12, C(178, 128, 80)], [.24, C(102, 64, 36)], [1, C(140, 92, 52)]]);
    },
    SAND: (f, x, y, d, n) => pick(n, [[.16, C(214, 170, 92)], [.28, C(255, 238, 172)], [1, C(240, 206, 120)]]),
    SNOW: (f, x, y, d, n) => f === 0 ? pick(n, [[.2, C(222, 236, 255)], [1, C(252, 254, 255)]]) : pick(n, [[.2, C(196, 216, 244)], [1, C(226, 238, 255)]]),
    MUD: (f, x, y, d, n) => f === 0 && n < .3 ? C(150, 118, 88) : pick(n, [[.2, C(130, 94, 64)], [.34, C(76, 50, 32)], [1, C(104, 72, 48)]]),
    STONE: (f, x, y, d, n) => { const cr = hash((x / 3) | 0, (y / 3) | 0, 9) < .35 && (x + y) % 3 === 0; return cr ? C(96, 100, 114) : pick(n, [[.14, C(176, 182, 196)], [.26, C(118, 122, 136)], [1, C(150, 156, 170)]]); },
    WALL: (f, x, y, d, n) => {
      const row = Math.floor(d / 3), mortar = f === 0 ? (x % 4 === 0 || y % 3 === 0) && n < .7 : (Math.floor(d) % 3 === 2 || (x + (row % 2) * 2) % 4 === 0);
      return mortar ? C(56, 58, 72) : pick(n, [[.2, C(118, 122, 140)], [1, C(96, 100, 118)]]);
    },
    METAL: (f, x, y, d, n, dx) => {
      if (f === 0) { const s = (x - y * 2 + 40) % 9; return s < 2 ? C(240, 246, 255) : C(182, 194, 212); }
      if (Math.floor(d) === 3) return C(130, 142, 160);
      if ((Math.floor(d) === 1 || Math.floor(d) === 6) && (dx > 6 && dx < 7.2 || dx > .8 && dx < 1.6)) return C(236, 242, 255);
      return pick(n, [[.12, C(196, 206, 222)], [1, C(176, 188, 206)]]);
    },
    GLASS: (f, x, y, d, n, dx) => {
      const shine = ((x + y) % 7 === 0 || (x + y) % 7 === 1) && f !== 2;
      if (shine) return flat(C(255, 255, 255, .9));
      const edge = dx > 7 || d < 1 || (f > 0 && d > 7) || (f > 0 && dx < .8);
      return edge ? C(214, 248, 255, .95) : C(150, 214, 236, .5);
    },
    WOOD: (f, x, y, d, n) => {
      if (f === 0) { const ex = (x + .5 - 8) / 2, ey = y + .5 - 4, r = Math.sqrt(ex * ex + ey * ey); if (r > 3.3) return C(122, 78, 40); return Math.floor(r * 1.4) % 2 ? C(198, 146, 84) : C(226, 180, 112); }
      return x % 3 === 0 || (n < .12) ? C(84, 50, 24) : pick(n, [[.3, C(134, 88, 46)], [1, C(116, 74, 38)]]);
    },
    ICE: (f, x, y, d, n) => {
      if ((x - y + 30) % 8 === 0 && f !== 2) return flat(C(255, 255, 255));
      return f === 0 ? pick(n, [[.25, C(200, 240, 255)], [1, C(166, 226, 255)]]) : pick(n, [[.2, C(150, 214, 248)], [1, C(132, 200, 242)]]);
    },
    LEAF: (f, x, y, d, n) => { const b = hash((x / 2) | 0, (y / 2) | 0, 4); return b < .3 ? C(130, 214, 92) : b < .55 ? C(52, 130, 54) : pick(n, [[.2, C(110, 196, 80)], [1, C(76, 166, 64)]]); },
    CLONE: (f, x, y, d, n, dx) => { const frame = d < 1.2 || dx > 6.6 || (f > 0 && (d > 6.6 || dx < 1.2)); return frame ? C(214, 160, 255) : (n < .2 ? C(196, 132, 246) : C(160, 88, 220)); }
  };
  const HEAPS = {
    SALT: (x, y, n) => n < .18 ? C(255, 255, 255) : n < .32 ? C(204, 210, 226) : C(236, 238, 248),
    GUNP: (x, y, n) => n < .22 ? C(36, 36, 46) : n < .34 ? C(120, 122, 140) : C(78, 80, 100),
    ASH: (x, y, n) => n < .2 ? C(196, 192, 196) : n < .34 ? C(112, 108, 116) : C(156, 152, 160)
  };
  const DROPS = {
    WATER: (x, y, n) => n < .1 ? C(140, 200, 255) : C(70, 146, 240),
    BRINE: (x, y, n) => n < .14 ? flat(C(240, 250, 255)) : C(96, 184, 204),
    OIL: (x, y, n, dx, py) => Math.abs(py - 8 - dx * .4) < .8 ? flat(C(180, 120, 220)) : Math.abs(py - 9 - dx * .4) < .8 ? flat(C(110, 200, 160)) : C(66, 50, 44),
    LAVA: (x, y, n, dx, py) => { const v = hash((x / 2) | 0, (y / 2) | 0, 6); return flat(v < .25 && py > 6 ? C(255, 236, 140) : v < .55 ? C(255, 150, 40) : C(220, 70, 30)); },
    ACID: (x, y, n) => n < .1 ? flat(C(230, 255, 170)) : C(130, 222, 60)
  };
  const GASES = { STEAM: [[236, 242, 252], 0], SMOKE: [[120, 120, 132], 0], GAS: [[190, 214, 110], 1] };
  const SPEC = {
    FIRE: () => flame(1),
    SPARK: () => art16(['.......cccc', '......cwwc', '.....cwwc', '....cwwc', '...cwwccccc', '..cccwwwwc', '.....cwwc', '....cwwc', '....cwc', '...cwc', '...cc', '..cc', '..c'], { w: '#f2fdff', c: '#6fd6ff' }),
    BATT: () => art16(['', '......WWW', '......nnN', '....dddddddd', '....deeeeeED', '....deeeeeED', '....dddddddD', '....deeeeeED', '....deeeeeED', '....dddddddD', '....deeeeeED', '....deeeeeED', '....dddddddD', '....DDDDDDDD'], {}),
    LAMP: () => {
      const g = grid(18, 18);
      for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) { const dx = x + .5 - 8, dy = y + .5 - 6.4, r = Math.hypot(dx, dy); if (r >= 5.6) continue; g.set(x + 1, y + 1, Math.hypot(dx + 2.2, dy + 2.2) < 1.6 ? '#ffffff' : r > 4.4 && dx + dy > 0 ? '#e0961e' : r > 3 ? '#ffd23c' : '#fff3a0'); }
      [[7, 6], [8, 7], [9, 6], [10, 7]].forEach(([x, y]) => g.set(x, y, '#e0961e'));
      for (let x = 6; x <= 11; x++) { g.set(x, 12, '#c9d2e6'); g.set(x, 13, '#9aa3b8'); g.set(x, 14, '#c9d2e6'); }
      for (let x = 7; x <= 10; x++) g.set(x, 15, '#666e86');
      return g;
    },
    CLONE: () => cube(CUBES.CLONE, 5),
    VOID: () => { const g = grid(18, 18); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x - 7.5, dy = y - 7.5, d = Math.sqrt(dx * dx + dy * dy); if (d < 7.3) { const a = Math.atan2(dy, dx) + d * .55; g.set(x + 1, y + 1, d < 2.2 ? '#0b0518' : (Math.sin(a * 2) > .1 ? (d < 4.5 ? '#8a4ae0' : '#5a2a9a') : '#24103f')); } } return g; },
    FLY: () => art16(['', '', '', '....WW..WW', '...WwwWWwwW', '...WwwWWwwW', '....WWddWW', '......dd', '......gg', '.....gyyg', '.....gyyg', '......gg'], {}),
    SEED: () => art16(['.........ee', '........eeeE', '......ee.f', '.....eEEf', '........f', '.....mmmmmm', '....mmmmmmmM', '...msmmmmmmmM', '...msmmmmmmmM', '...mmmmmmmmmM', '...mmmmmmmmmM', '....mmmmmmmM', '....MmmmmmMM', '.....MMMMMM'], {}),
    CONE: () => { const g = grid(18, 18); for (let y = 2; y < 15; y++) { const w = y < 8 ? 2 + Math.floor((y - 2) * .8) : 7 - Math.floor((y - 8) * 1.1); for (let x = 8 - w; x < 8 + w; x++) { const sc = ((x + y) % 3) === 0; g.set(x + 1, y + 1, sc ? '#6a3e1c' : (x < 8 ? '#c48444' : '#9a6230')); } } g.set(9, 1, '#3aa046'); g.set(9, 2, '#1f6a34'); return g; },
    FSEED: () => art16(['', '.....i.i', '....iiiii', '...iiigiii', '....iigii', '...iiiiiii', '....i.e.i', '......e..ee', '..ee..e.eeE', '..Eee.eeE', '....Eee', '......e', '......e', '....MMMMM', '...MmmmmmM'], { g: '#ffd23c' }),
    LEAF: () => cube(CUBES.LEAF, 4)
  };
  /* элементы: кэшируем dataURL */
  function elIcon(key) {
    if (cache['e' + key]) return cache['e' + key];
    if (typeof UIA !== 'undefined' && UIA.icon[key]) return UIA.icon[key];   /* нарисованные иконки из присланного листа */
    const id = E[key]; let g;
    if (SPEC[key]) g = SPEC[key]();
    else if (CUBES[key]) g = cube(CUBES[key], id);
    else if (HEAPS[key]) g = heap(HEAPS[key], id);
    else if (DROPS[key]) g = drop(DROPS[key], id);
    else if (GASES[key]) g = puff(GASES[key][0], id, GASES[key][1]);
    else { const col = COLOR[id] || [200, 200, 200], kind = KIND[id]; g = kind === K.LIQUID ? drop(() => col, id) : kind === K.GAS ? puff(col, id) : kind === K.POWDER ? heap((x, y, n) => col.map((v) => v * (.9 + n * .2)), id) : cube(() => col, id); }
    return cache['e' + key] = finish(g);
  }

  /* лоза для углов панелей: стебель уголком и листья */
  function vine() {
    if (cache.vine) return cache.vine;
    const g = grid(26, 26), S1 = '#2f7a34', S2 = '#4ea844', L1 = '#8ee05a', L2 = '#5cc84a', L3 = '#2f8a3a';
    for (let x = 6; x < 26; x++) g.set(x, 4 + ((x >> 3) % 2 && x % 8 > 2 && x % 8 < 6 ? 1 : 0), x % 4 ? S1 : S2);
    for (let y = 6; y < 26; y++) g.set(4 + ((y >> 3) % 2 && y % 8 > 2 && y % 8 < 6 ? 1 : 0), y, y % 4 ? S1 : S2);
    g.set(5, 5, S1); g.set(4, 6, S1); g.set(6, 4, S1);
    g.set(3, 3, S2); g.set(2, 3, S1); g.set(2, 2, S1); g.set(3, 2, S2);
    const UP = ['..aB', '.aab', 'cB..'], DN = ['cB..', '.aab', '..aB'];
    const stamp = (sp, ox, oy, tr) => sp.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.') continue; const col = ch === 'a' ? L1 : ch === 'b' || ch === 'B' ? L2 : L3; if (tr) g.set(ox + j, oy + i, col); else g.set(ox + i, oy + j, col); } });
    stamp(UP, 8, 1, false); stamp(DN, 13, 5, false); stamp(UP, 18, 1, false); stamp(DN, 22, 5, false);
    stamp(UP, 1, 8, true); stamp(DN, 5, 13, true); stamp(UP, 1, 18, true); stamp(DN, 5, 22, true);
    g.set(11, 7, '#ffd23c'); g.set(7, 11, '#ff9ac8');
    return cache.vine = finish(g);
  }
  function img(src, cls) { const i = new Image(); i.onload = () => { if (i.naturalWidth >= 32) i.classList.add('smooth'); }; i.src = src; i.className = 'ic ' + (cls || ''); i.draggable = false; return i; }
  return { ui: fromArt, el: elIcon, img, vine, ART };
})();
