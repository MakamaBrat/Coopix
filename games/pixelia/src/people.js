'use strict';
/* ПИКСЕЛИЯ — человечки. Основа — точная копия нарисованного персонажа 10x23 (вид спереди),
   на ней собраны все образы из галерей: горожане, боец, фермер, рыцарь, маг, пират, шахтёр,
   космонавт, ниндзя, дед, бабушка. У каждого своя способность (см. abil → sim.js).
   Рисуются на слое с удвоенным разрешением: в мире человек ~5x12 клеток, деталей вдвое больше.
   Кадры: 0 стоит, 1 шаг левой, 2 шаг правой, 3 моргает. */
const People = (function () {
  /* сетка образа: 14 столбцов (по 2 запасных с боков для шляп, трости, посоха),
     строки -3..-1 — над головой, 0..9 голова, 10..16 туловище, 17..22 ноги.
     Строки по 10 символов дополняются до 14 точками по краям. */
  const SW = 14, ROWS = 26, FH = 27, HAT = 3;
  const HEADS = {
    swept: ['..kkkkk...', '.kbacddkk.', 'kababcccbk', 'kabbLDbbbk', 'kabSSSSSak', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..'],
    bob: ['..kkkkkk..', '.kbbbbcbk.', 'kbbbbbbcbk', 'kbbbbbbbbk', 'kbbSSSSSbk', 'kbSSkSSkbk', 'kbSSkSSkbk', 'kbSSSmmSbk', 'kbkSSSSkbk', '.kkkDDkkk.'],
    spiky: ['..k..k..k.', '.kbkkbkkbk', 'kbbbbcbbbk', 'kbbbbbbbbk', 'kbbSSSSSbk', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..'],
    cap: ['..kkkkk...', '.kCCCCCkk.', 'kCCCcCCCCk', 'kcccccccck', 'kbSSSSSSbk', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..'],
    bun: ['...kkkk...', '..kbccbk..', '.kkbbbbkk.', 'kbbbbcbbbk', 'kbbSSSSSbk', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..'],
    tail: ['..kkkkk.......', '.kbbccbkk.....', 'kbbbbbbcbk.kk.', 'kbbbbbbbbkkbbk', 'kbbSSSSSbkbbk.', 'kbSSkSSkDkkbk.', 'kDSSkSSkDk.kbk', '.kSSSmmSk...k.', '.kSSSSSSk.....', '..kkDDkk......'].map((r) => '..' + r.slice(0, 12)),
    mohawk: ['....kk....', '...kRRk...', '..kkRRkk..', '.kSSRRSSk.', 'kSSSSSSSSk', 'kSSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..'],
    band: ['..kkkkk...', '.kbacddkk.', 'kababcccbk', 'kRRRRRRRRk', 'kabSSSSSak', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..'],
    straw: ['...kYYYYYYk...', '..kRRRRRRRRk..', 'kkYYYYYYYYYYkk', '.kyyyyyyyyyyk.', '..kbbSSSSSbk..', '..kbSSkSSkDk..', '..kDSSkSSkDk..', '...kSSSmmSk...', '...kSSSSSSk...', '....kkDDkk....'],
    helm: ['..kkkkkk..', '.kXXXXXxk.', 'kXXXXXXXxk', 'kXXXXXXXxk', 'kXSSSSSSxk', 'kXSSkSSkxk', 'kXSSkSSkxk', 'kXSSSmmSxk', '.kXSSSSxk.', '..kXxxXk..'],
    wizard: ['.kkVVVVkk.', 'kVVVVYVVVk', 'kvvvvvvvvk', 'kWSSSSSSWk', 'kWSSSSSSWk', 'kWSSkSSkWk', 'kWSSkSSkWk', '.kWWWWWWk.', '.kWWWWWWk.', '..kkWWkk..'],
    bandana: ['..kkkkk...', '.kRRwRRkk.', 'kRwRRRRRRk', 'kRRRRRRRRk', 'kbkkSSSSak', 'kbSkkSSkDk', 'kDSkkSSkDk', '.kSSSmmSk.', '.kbbbbbbk.', '..kkbbkk..'],
    hardhat: ['..kkkkk...', '.kYYllYYk.', 'kYYYllYYYk', 'kyyyyyyyyk', 'kbbSSSSSbk', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSNSSSSk.', '..kkDDkk..'],
    space: ['..kkkkkk..', '.kXXXXXXk.', 'kXXXXXXXxk', 'kXkkkkkkxk', 'kXkcSSSSkk', 'kXkSkSSkkk', 'kXkSkSSkkk', 'kXkSSmmSkk', '.kXkkkkxk.', '..kXxxXk..'],
    ninja: ['..kkkkk...', '.kNNNNNkk.', 'kNNNNNNNNk', 'kNNNNNNNNk', 'kNSSSSSSNk', 'kNSSkSSkNk', 'kNNNkNNkNk', '.kNNNNNNk.', '.kNNNNNNk.', '..kkNNkk..'],
    elder: ['..kkkkk...', '.kSSLSSkk.', 'kbSLSSSSbk', 'kbSSSSSSbk', 'kbSbbSbbSk', 'kbSSkSSkSk', 'kDSSkSSkDk', '.kSbbmmbk.', '.kbbbbbbk.', '..kbbbbk..'],
    granny: ['...kkkk...', '..kbccbk..', '.kkbbbbkk.', 'kbbbbcbbbk', 'kbbSSSSSbk', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..']
  };
  const HATS = {
    straw: ['', '....kkkkkk....', '...kYYYYYYk...'],
    wizard: ['....kk....', '...kVYk...', '..kVVVVk..'],
    helm: ['', '....kRk...', '...kRRk...'],
    space: ['', '', '....kXk...']
  };
  const BODIES = {
    jacket: ['.kJJnnrrk.', '.kjqWWruk.', '.kjqWWruk.', '.kqqWWruk.', '.khqWWrhk.', '.khuwwrhk.', '.koupppok.'],
    tee: ['.kTTnnTTk.', '.kTTTTTTk.', '.kTTTTTtk.', '.kSTTTTSk.', '.kSTTTtSk.', '.khTTTthk.', '.kopppPok.'],
    hoodie: ['.kJJjjJJk.', '.kjJWJWjk.', '.kjJWJWjk.', '.kjJJJJjk.', '.khqqqqhk.', '.khJJJJhk.', '.kopppPok.'],
    dress: ['.kTTnnTTk.', '.kSTTTTSk.', '.kSTTTtSk.', '.kSTTTtSk.', '.khTTTThk.', '.kTTTTTtk.', 'kTTTTTTTtk'],
    tank: ['.kSWWWWSk.', '.kSWWWWSk.', '.kSWWWWDk.', '.kSwWWwSk.', '.khWWWWhk.', '.khRRRRhk.', '.kopppPok.'],
    overall: ['.kRJRRJRk.', '.kRJJJJRk.', '.kRJJJJRk.', '.kRJYJJRk.', '.khJJJJhk.', '.khJJJJhk.', '.koJJJJok.'],
    armor: ['.kXXYYXXk.', '.kXxXXXxk.', '.kxXXXXxk.', '.kXXXXXxk.', '.kxYYYYxk.', '.kXXXXXxk.', '.kxpppPxk.'],
    robe: ['.kVVYYVVk.', '.kvVYYVvk.', '.kvVYYVvk.', '.kvVVVVvk.', '.khVVVVhk.', '.kvVYYVvk.', '.kvVVVVvk.'],
    pirate: ['.kJWWWWJk.', '.kjWWWWjk.', '.kjJWWJjk.', '.kjJWWJjk.', '.khRRRRhk.', '.khJJJJhk.', '.kopppPok.'],
    vest: ['.kJJnnJJk.', '.kjJWWJjk.', '.kjJWWJjk.', '.kYYWWYYk.', '.khJWWJhk.', '.khjWWjhk.', '.kopppPok.'],
    suit: ['.kXXXXXXk.', '.kxXRbXxk.', '.kxXXXXxk.', '.kxXXXXxk.', '.kxXXXXxk.', '.kXXXXXXk.', '.kxXXXXxk.'],
    gi: ['.kNNNNNNk.', '.kNNNNNNk.', '.kNNNNNNk.', '.kNNNNNNk.', '.khRRRRhk.', '.khNNNNhk.', '.koNNNNok.'],
    leather: ['.kJJnnJJk.', '.kjYWWYjk.', '.kjJWWJjk.', '.kjYWWYjk.', '.khJWWJhk.', '.khjWWjhk.', '.kopppPok.']
  };
  const LEGS = {
    jeans: ['..kPppPk..', '..kPppPk..', '..kPppPk..', '..kPppPk..', '..kgppgk..', '..kkkkkk..'],
    dress: ['.kTTTTTtk.', '.kTTTTTtk.', '..kSDSDk..', '..kSDSDk..', '..kBBBBk..', '..kkkkkk..'],
    boots: ['..kJjjJk..', '..kJjjJk..', '..kJjjJk..', '..kJjjJk..', '..kMMMMk..', '..kkkkkk..'],
    armor: ['..kXxXxk..', '..kXxXxk..', '..kXxXxk..', '..kXxXxk..', '..kxxxxk..', '..kkkkkk..'],
    robe: ['..kVVVvk..', '..kVVVvk..', '..kVVVvk..', '..kVVVvk..', '..kvVVvk..', '..kkkkkk..'],
    suit: ['..kXXxXk..', '..kXXxXk..', '..kXXxXk..', '..kXXxXk..', '..kxxxxk..', '..kkkkkk..'],
    gi: ['..kNNNNk..', '..kNNNNk..', '..kNNNNk..', '..kNNNNk..', '..kxxxxk..', '..kkkkkk..']
  };
  /* предметы поверх: [строка, столбец в 14-сетке, символ] */
  const STAFF = []; for (let r = 4; r <= 21; r++) STAFF.push([r, 11, 'M']); STAFF.push([1, 10, 'O'], [1, 11, 'O'], [1, 12, 'O'], [2, 10, 'O'], [2, 11, 'O'], [2, 12, 'O'], [0, 11, 'O'], [3, 11, 'O']);
  const CANE = []; for (let r = 15; r <= 22; r++) CANE.push([r, 11, 'M']); CANE.push([14, 10, 'M'], [14, 11, 'M']);
  const TAILS = [[2, 12, 'R'], [3, 12, 'R'], [3, 13, 'R']];

  /* базовая палитра — цвета с картинки */
  const REF = {
    k: [5, 2, 0], a: [54, 36, 20], b: [72, 42, 22], c: [106, 62, 34], d: [184, 122, 82], S: [242, 172, 112], L: [238, 190, 138], D: [222, 154, 92], m: [230, 10, 52],
    J: [66, 92, 90], j: [44, 80, 80], q: [18, 46, 46], r: [62, 78, 72], u: [26, 50, 40], n: [242, 221, 186], W: [243, 244, 246], w: [216, 234, 228],
    h: [236, 196, 158], o: [194, 92, 51], P: [10, 70, 80], p: [5, 34, 40], g: [76, 110, 108], eye: [5, 2, 0],
    T: [90, 140, 220], t: [66, 106, 176], C: [214, 56, 52], R: [214, 52, 48], Y: [246, 200, 70], y: [196, 146, 40], B: [60, 40, 46], M: [110, 70, 40],
    X: [190, 198, 214], x: [128, 138, 158], V: [104, 66, 180], v: [72, 44, 132], N: [34, 34, 44], l: [255, 250, 200], O: [150, 230, 255]
  };
  const mul = (c, k) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const hairPal = (b) => ({ a: mul(b, .76), b, c: mix(mul(b, 1.4), [255, 255, 255], .06), d: mix(b, [236, 196, 150], .6) });
  const jacketPal = (j) => ({ J: mix(mul(j, 1.3), [150, 150, 150], .12), j, q: mul(j, .45), r: mix(j, [110, 110, 104], .35), u: mul(j, .6) });
  const SKIN = [[242, 172, 112], [232, 160, 108], [200, 132, 88], [150, 96, 62], [104, 66, 44]];

  /* образы: имя, части, цвета, способности (abil уходит в симуляцию) */
  const FORMS = {
    ref: { name: 'Житель', hint: 'Точь-в-точь как на картинке: бирюзовая куртка и джинсы.', head: 'swept', body: 'jacket', legs: 'jeans', town: true },
    dark: { name: 'Тёмная чёлка', hint: 'Каре и тёмная куртка.', head: 'bob', body: 'jacket', legs: 'jeans', pal: { ...hairPal([30, 36, 54]), ...jacketPal([34, 38, 52]), P: [34, 50, 84], p: [18, 26, 48] }, town: true },
    red: { name: 'Красная куртка', hint: 'Красная куртка и голубые джинсы.', head: 'swept', body: 'jacket', legs: 'jeans', pal: { ...hairPal([118, 72, 44]), ...jacketPal([168, 44, 40]), P: [56, 96, 150], p: [30, 54, 96] }, town: true },
    blond: { name: 'Блондин', hint: 'Зелёная куртка, светлые волосы.', head: 'swept', body: 'jacket', legs: 'jeans', pal: { ...hairPal([214, 172, 76]), ...jacketPal([70, 120, 62]), P: [110, 100, 66], p: [70, 62, 40] }, town: true },
    ginger: { name: 'Рыжий', hint: 'Рыжий в лиловой футболке.', head: 'spiky', body: 'tee', legs: 'jeans', pal: { ...hairPal([196, 92, 34]), T: [150, 90, 200], t: [110, 62, 156] }, town: true },
    hoodie: { name: 'Худи', hint: 'Синее худи с завязками.', head: 'spiky', body: 'hoodie', legs: 'jeans', pal: { ...hairPal([46, 38, 44]), ...jacketPal([60, 96, 170]), P: [78, 80, 94], p: [46, 48, 58] }, town: true },
    cap: { name: 'Кепка', hint: 'Красная кепка и жёлтая футболка.', head: 'cap', body: 'tee', legs: 'jeans', pal: { ...hairPal([90, 60, 40]), T: [246, 206, 72], t: [204, 160, 40], P: [64, 74, 116], p: [36, 42, 74] }, town: true },
    dress: { name: 'Платье', hint: 'Розовое платье и пучок.', head: 'bun', body: 'dress', legs: 'dress', pal: { ...hairPal([150, 84, 40]), T: [214, 84, 124], t: [170, 56, 94] }, town: true },
    tail: { name: 'С хвостом', hint: 'Девочка с хвостиком в красном поло.', head: 'tail', body: 'tee', legs: 'jeans', pal: { ...hairPal([66, 40, 26]), T: [206, 60, 60], t: [160, 40, 44], P: [50, 60, 110], p: [28, 34, 70] }, town: true },
    punk: { name: 'Панк', hint: 'Ирокез и кожанка с заклёпками.', head: 'mohawk', body: 'leather', legs: 'jeans', pal: { ...jacketPal([40, 36, 40]), R: [230, 60, 150], P: [50, 50, 60], p: [26, 26, 32] }, town: true },
    fighter: { name: 'Боец', hint: 'Крепкий: вдвое больше здоровья, не боится падений.', head: 'band', body: 'tank', legs: 'jeans', pal: { P: [40, 40, 48], p: [20, 20, 26] }, props: TAILS, abil: { tough: 2.5, hp: 220 } },
    farmer: { name: 'Фермер', hint: 'Соломенная шляпа. Сажает семена, гуляя по земле.', head: 'straw', body: 'overall', legs: 'boots', hat: 'straw', pal: { ...hairPal([150, 92, 40]), J: [70, 110, 180], j: [48, 80, 140] }, abil: { seeds: 1 } },
    knight: { name: 'Рыцарь', hint: 'Латы: не загорается и выдерживает больше.', head: 'helm', body: 'armor', legs: 'armor', hat: 'helm', pal: { h: [128, 138, 158], o: [96, 104, 124] }, abil: { fireproof: 1, tough: 1.6, hp: 160, speed: .8 } },
    mage: { name: 'Маг', hint: 'Посох светится в темноте, а сам маг почти не тонет.', head: 'wizard', body: 'robe', legs: 'robe', hat: 'wizard', props: STAFF, abil: { light: 'staff', noDrown: 1 } },
    pirate: { name: 'Пират', hint: 'Повязка на глазу. Плавает быстро и не тонет.', head: 'bandana', body: 'pirate', legs: 'boots', pal: { ...hairPal([40, 30, 26]), J: [110, 70, 40], j: [84, 52, 30], P: [50, 44, 40] }, noBlink: true, abil: { swim: 2.2, noDrown: 1 } },
    miner: { name: 'Шахтёр', hint: 'Фонарь на каске светит. Прокапывает камень и землю.', head: 'hardhat', body: 'vest', legs: 'jeans', pal: { ...jacketPal([226, 120, 30]), W: [70, 74, 86], w: [52, 54, 64], n: [70, 74, 86], N: [80, 70, 64], P: [60, 64, 80], p: [36, 38, 50] }, abil: { light: 'lamp', dig: 1 } },
    astro: { name: 'Космонавт', hint: 'Скафандр: дышит под водой и прыгает высоко.', head: 'space', body: 'suit', legs: 'suit', hat: 'space', pal: { X: [236, 240, 246], x: [170, 178, 194], c: [200, 240, 255], b: [70, 140, 230], h: [210, 216, 228], o: [170, 178, 194] }, noBlink: true, abil: { noDrown: 1, jump: 1.6, grav: .55 } },
    ninja: { name: 'Ниндзя', hint: 'Самый быстрый и прыгучий.', head: 'ninja', body: 'gi', legs: 'gi', props: TAILS, pal: { x: [90, 90, 104], h: [52, 52, 64], o: [34, 34, 44] }, abil: { speed: 1.9, jump: 1.4 } },
    elder: { name: 'Дед с тростью', hint: 'Ходит медленно, опираясь на трость.', head: 'elder', body: 'jacket', legs: 'jeans', props: CANE, pal: { ...hairPal([196, 196, 204]), ...jacketPal([110, 76, 48]), P: [70, 70, 80], p: [40, 40, 48] }, abil: { speed: .55 } },
    granny: { name: 'Бабушка', hint: 'Седой пучок и платье. Не торопится.', head: 'granny', body: 'dress', legs: 'dress', pal: { ...hairPal([206, 206, 214]), T: [128, 84, 160], t: [96, 60, 124] }, noBlink: true, abil: { speed: .6 } }
  };
  const TOWN = Object.keys(FORMS).filter((k) => FORMS[k].town);

  /* ---------- сборка кадра из частей: голова, туловище, руки на двух костях, ноги ----------
     Всё берётся из символьной сетки образа; поза — числа: сдвиг тела, голова, взгляд, рот, цель каждой руки, подъём и разворот ног. */
  const pad = (r) => r.length >= SW ? r.slice(0, SW) : ('..' + r.padEnd(10, '.') + '..').slice(0, SW);
  function base(form) {
    const F = FORMS[form] || FORMS.ref, g = []; for (let i = 0; i < ROWS; i++) g.push(new Array(SW).fill('.'));
    const put = (rows, r0) => rows.forEach((r, j) => { const s = pad(r); for (let x = 0; x < SW; x++) if (s[x] !== '.') g[r0 + j + HAT][x] = s[x]; });
    if (F.hat) put(HATS[F.hat], -3);
    put(HEADS[F.head], 0); put(BODIES[F.body], 10); put(LEGS[F.legs], 17);
    for (const [r, x, ch] of F.props || []) g[r + HAT][x] = ch;
    return g;
  }
  const rigCache = {};
  function rig(form) {
    if (rigCache[form]) return rigCache[form];
    const F = FORMS[form] || FORMS.ref, g = base(form), at = (r) => g[r + HAT], skirt = F.legs === 'dress' ? 2 : 0;
    const R = { head: [], torso: [], armSym: [[], []], legs: [[], []], props: F.props || [], skirt, noBlink: !!F.noBlink };
    for (let r = -3; r <= 9; r++) R.head.push(at(r).slice());
    for (let r = 10; r <= 16 + skirt; r++) { const row = at(r).slice(); if (r >= 11 && r <= 15) for (const x of [3, 4, 9, 10]) row[x] = '.'; R.torso.push(row); }
    for (let i = 0; i < 5; i++) { R.armSym[0].push(at(11 + i)[4]); R.armSym[1].push(at(11 + i)[9]); }
    for (let r = 17 + skirt; r <= 22; r++) { const row = at(r); R.legs[0].push(row.slice(4, 7)); R.legs[1].push(row.slice(7, 10)); }
    return rigCache[form] = R;
  }
  function line(x0, y0, x1, y1) {
    const pts = [], dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx - dy;
    for (let k = 0; k < 40; k++) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } }
    return pts;
  }
  /* рука из двух костей по 2 клетки: плечо → локоть → кисть; локоть уходит наружу */
  function ik(sx, sy, tx, ty, out) {
    const L = 2; let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
    if (d < .01) return { pts: [[Math.round(sx), Math.round(sy)]], ex: sx, ey: sy, hx: sx, hy: sy };
    const reach = 2 * L - .001; let hx = tx, hy = ty;
    if (d > reach) { hx = sx + dx / d * reach; hy = sy + dy / d * reach; dx = hx - sx; dy = hy - sy; d = reach; }
    const h = Math.sqrt(Math.max(0, L * L - d * d / 4)), ux = dx / d, uy = dy / d; let qx = -uy, qy = ux;
    if (qx * out < 0) { qx = -qx; qy = -qy; }
    const ex = sx + dx / 2 + qx * h, ey = sy + dy / 2 + qy * h, rd = Math.round;
    const pts = line(rd(sx), rd(sy), rd(ex), rd(ey)).concat(line(rd(ex), rd(ey), rd(hx), rd(hy)).slice(1));
    return { pts, ex, ey, hx, hy };
  }
  const isSkin = (c) => c === 'S' || c === 'L' || c === 'D';
  /* лицо: взгляд, моргание, рот. Строки головы: индекс = r + 3 */
  function face(h, P, noBlink) {
    const r5 = h[8], r6 = h[9], r7 = h[10], r8 = h[11], ex = [6, 9];
    const has = (x) => r5[x] === 'k' && r6[x] === 'k';
    const lk = P.look | 0;
    if (lk) for (let q = 0; q < 2; q++) { const x = ex[q]; if (has(x) && isSkin(r5[x + lk]) && isSkin(r6[x + lk])) { r5[x] = 'S'; r6[x] = 'S'; r5[x + lk] = 'k'; r6[x + lk] = 'k'; ex[q] = x + lk; } }
    const eyes = [];
    for (const x of ex) if (r5[x] === 'k' && r6[x] === 'k') { eyes.push([8, x], [9, x]); }
    if (P.blink && !noBlink) for (const x of ex) if (r5[x] === 'k' && r6[x] === 'k') { r5[x] = 'S'; const k = eyes.findIndex((p) => p[0] === 8 && p[1] === x); if (k >= 0) eyes.splice(k, 1); }
    if (r7[7] === 'm' && r7[8] === 'm' && P.mouth) {
      const m = P.mouth;
      if (m === 1 || m === 2) { if (isSkin(r8[7]) && isSkin(r8[8])) { r8[7] = 'm'; r8[8] = 'm'; } if (m === 2 && isSkin(r7[6]) && isSkin(r7[9])) { r7[6] = 'm'; r7[9] = 'm'; } }
      else if (m === 3 && isSkin(r8[7]) && isSkin(r8[8]) && isSkin(r7[6]) && isSkin(r7[9])) { r7[6] = 'o'; r7[9] = 'o'; r7[7] = 'S'; r7[8] = 'S'; r8[7] = 'm'; r8[8] = 'm'; }
    }
    return eyes;
  }
  const NEUTRAL = { dy: 0, hdy: 0, hx: 0, lean: 0, look: 0, blink: 0, mouth: 0, al: [.2, 4], ar: [.2, 4], ll: 0, lr: 0, dl: 0, dr: 0, up: 0, tool: 0 };
  function compose(form, P) {
    const R = rig(form), out = [];
    for (let y = 0; y < FH; y++) out.push(new Array(SW).fill('.'));
    const put = (y, x, c) => { if (y >= 0 && y < FH && x >= 0 && x < SW) out[y][x] = c; };
    const B = HAT + 1, dy = P.dy | 0, lean = P.lean | 0, hip = 17 + R.skirt + B + dy;
    /* ноги: нижняя точка ступни поднимается на lift, верх привязан к бёдрам; лишние строки вынимаются из середины */
    for (let s = 0; s < 2; s++) {
      const lift = (s ? P.lr : P.ll) | 0, sh = (s ? P.dr : P.dl) | 0, rows = R.legs[s], nr = rows.length;
      const len = Math.max(3, 26 - lift - (P.up | 0) - hip + 1), x0 = 4 + s * 3 + (s ? sh : -sh);
      for (let j = 0; j < len; j++) {
        let si = j >= len - 2 ? nr - (len - j) : Math.min(j, nr - 3); si = Math.max(0, Math.min(nr - 1, si));
        const row = rows[si]; for (let q = 0; q < 3; q++) if (row[q] !== '.') put(hip + j, x0 + q, row[q]);
      }
    }
    for (let i = 0; i < R.torso.length; i++) for (let x = 0; x < SW; x++) { const c = R.torso[i][x]; if (c !== '.') put(10 + i + B + dy, x + lean, c); }
    /* руки */
    const arms = [];
    for (let s = 0; s < 2; s++) {
      const sx = (s ? 9 : 4) + lean, sy = 11 + B + dy, T = s ? P.ar : P.al, a = ik(sx, sy, sx + (s ? T[0] : -T[0]), sy + T[1], s ? 1 : -1);
      a.pts.forEach((p, i) => put(p[1], p[0], R.armSym[s][a.pts.length === 1 ? 0 : Math.round(i / (a.pts.length - 1) * 4)]));
      arms.push(a);
    }
    if (P.tool) {   /* кирка в правой руке: рукоять продолжает предплечье, на конце стальная головка */
      const a = arms[1], dx = a.hx - a.ex, dy2 = a.hy - a.ey, d = Math.hypot(dx, dy2) || 1, ux = dx / d, uy = dy2 / d;
      for (let k = 1; k <= 3; k++) put(Math.round(a.hy + uy * k), Math.round(a.hx + ux * k), 'M');
      const tx = a.hx + ux * 3, ty = a.hy + uy * 3; put(Math.round(ty - ux), Math.round(tx + uy), 'X'); put(Math.round(ty + ux), Math.round(tx - uy), 'X'); put(Math.round(ty), Math.round(tx), 'x');
    }
    /* голова */
    const hrows = R.head.map((r) => r.slice()), eyes0 = face(hrows, P, R.noBlink), hdy = P.hdy | 0, hx = (P.hx | 0) + lean, eyes = [];
    for (let i = 0; i < hrows.length; i++) for (let x = 0; x < SW; x++) { const c = hrows[i][x]; if (c !== '.') put(i - 3 + B + dy + hdy, x + hx, c); }
    for (const [r, x] of eyes0) eyes.push([r - 3 + B + dy + hdy, x + hx]);
    for (const [r, x, ch] of R.props) put(r + B + dy, x + lean, ch);
    /* обводка вокруг рук там, где они отошли от тела */
    for (const a of arms) for (const p of a.pts) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = p[0] + ox, y = p[1] + oy; if (x >= 0 && x < SW && y >= 0 && y < FH && out[y][x] === '.') out[y][x] = 'k'; }
    return { g: out, eyes };
  }

  /* ---------- палитры и растр ---------- */
  const palCache = new Map();
  const mul3 = (c, a) => [Math.min(255, Math.round(c[0] * a[0])), Math.min(255, Math.round(c[1] * a[1])), Math.min(255, Math.round(c[2] * a[2]))];
  function basePal(e, z) {
    const F = FORMS[e.form] || FORMS.ref, P = Object.assign({}, REF, F.pal || {});
    if (F.town && e.form !== 'ref' || (e.form === 'ref' && e.skinV)) { const s = SKIN[(e.seed || 0) % SKIN.length]; Object.assign(P, { S: s, L: mix(s, [255, 255, 255], .18), D: mul(s, .9), h: mix(s, [255, 240, 220], .25), o: mix(mul(s, .78), [200, 70, 30], .35) }); }
    if (z) {
      const G = [132, 184, 104];
      for (const k in P) if (k !== 'k' && k !== 'eye') P[k] = mul(mix(P[k], [96, 108, 96], .45), .86);
      Object.assign(P, { S: G, L: mix(G, [255, 255, 255], .2), D: mul(G, .85), h: mul(G, .95), m: [96, 34, 40], eye: [220, 44, 36] });
    }
    return P;
  }
  function palette(e, zk, amb, ak) {
    const key = (e.form || 'ref') + '|' + ((e.seed || 0) % SKIN.length) + '|' + zk + '|' + ak;
    let P = palCache.get(key); if (P) return P;
    if (zk <= 0) P = basePal(e, false); else if (zk >= 1) P = basePal(e, true);
    else { const a = basePal(e, false), b = basePal(e, true); P = {}; for (const k in a) P[k] = mix(a[k], b[k], zk); }
    if (amb) { const q = {}; for (const k in P) q[k] = (k === 'eye' && zk > 0) ? P[k] : mul3(P[k], amb); P = q; }
    if (palCache.size > 400) palCache.clear();
    palCache.set(key, P); return P;
  }
  const cache = new Map(), WATER = [44, 112, 224];
  const r5 = (v) => Math.round(v * 2) / 2;
  const poseKey = (P) => [P.dy, P.hdy, P.hx, P.lean, P.look, P.blink, P.mouth, r5(P.al[0]), r5(P.al[1]), r5(P.ar[0]), r5(P.ar[1]), P.ll, P.lr, P.dl, P.dr, P.up, P.tool].join(',');
  function sprite(e, P, burn, flip, sub, amb, ak, zk, char) {
    const form = e.form || 'ref', key = form + '|' + ((e.seed || 0) % SKIN.length) + '|' + poseKey(P) + '|' + burn + '|' + (flip ? 1 : 0) + '|' + sub + '|' + ak + '|' + zk + '|' + char + '|' + (zk >= .5 ? (e.seed || 0) % 11 : '');
    let cv = cache.get(key); if (cv) return cv;
    if (cache.size > 3500) cache.clear();
    const Pal = palette(e, zk, amb, ak), fr = compose(form, P);
    cv = document.createElement('canvas'); cv.width = SW; cv.height = FH;
    const c = cv.getContext('2d'), im = c.createImageData(SW, FH), d = im.data, subRows = Math.min(FH, sub * 2);
    for (let y = 0; y < FH; y++) for (let x = 0; x < SW; x++) {
      const ch = fr.g[y][x]; if (ch === '.') continue;
      let col = Pal[ch] || [255, 0, 255];
      if (ch === 'k' && fr.eyes.some(([ey, ex]) => ey === y && ex === x)) col = Pal.eye;
      if (zk >= .5 && ch !== 'k' && ((x * 7 + y * 13 + (e.seed || 0) * 3) % 11) === 0) col = mul(col, .62);
      if (char) col = mix(col, [34, 28, 26], char === 2 ? .78 : .5);
      if (burn) col = mix(col, burn === 2 ? [255, 196, 60] : [255, 110, 30], ch === 'k' ? .25 : .5);
      if (subRows && y >= FH - subRows) col = mix(col, WATER, y === FH - subRows ? .3 : .6);
      const tx = flip ? SW - 1 - x : x, o = (y * SW + tx) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    c.putImageData(im, 0, 0); cache.set(key, cv); return cv;
  }

  /* ---------- позы ---------- */
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  const pose = (o) => Object.assign({}, NEUTRAL, o);
  const rnd2 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const TAU = 6.2831853;
  /* шаг: ph — доля цикла (0..1); run — бег; z — шаркающая походка зомби */
  function gait(P, ph, run, z) {
    const sA = Math.sin(ph * TAU), sB = -sA, lm = z ? 2 : run ? 3 : 2;
    P.ll = Math.round(Math.max(0, sA) * lm); P.lr = Math.round(Math.max(0, sB) * (z ? 1 : lm));
    P.dl = P.ll > 0 ? 1 : 0; P.dr = P.lr > 0 ? 1 : 0;
    P.dy = Math.abs(sA) < (run ? .5 : .45) ? 1 : 0;
    P.hdy = P.dy;
    if (z) {
      P.al = [.6, 2.0 + .7 * sA]; P.ar = [.6, 2.0 - .7 * sA]; P.hdy = 1; P.hx = 1; P.lean = 0; P.look = 1; P.mouth = 1; P.dy = Math.min(2, P.dy + 1);
    } else {
      const k = run ? 1 : .6, fl = -sA, fr = sA;   /* рука идёт вперёд, когда противоположная нога впереди */
      P.al = [(run ? .9 : .3) + .5 * Math.max(0, fl) * k, (run ? 3.0 : 3.9) - (run ? 1.5 : .6) * fl];
      P.ar = [(run ? .9 : .3) + .5 * Math.max(0, fr) * k, (run ? 3.0 : 3.9) - (run ? 1.5 : .6) * fr];
      P.look = 1; if (run) P.lean = 1;
    }
  }
  function fidget(e, T, P) {
    const sd = e.seed || 0, slot = Math.floor((T + sd * 37) / 520), local = (T + sd * 37) % 520 - Math.floor(rnd2(slot, sd + 1) * 380);
    if (local < 0 || local >= 84) return false;
    const type = Math.floor(rnd2(slot, sd + 2) * 6), w = Math.sin(local / 3.6);
    if (type === 0) { P.ar = [3.2 + w * .5, -2.2 + w * .9]; P.mouth = 3; P.look = 0; }
    else if (type === 1) { P.al = [3, -3]; P.ar = [3, -3]; P.dy = -1; P.mouth = 1; P.blink = local > 20 && local < 50 ? 1 : 0; }
    else if (type === 2) { P.ar = [1.5 + w * .4, -.6 + Math.sin(local / 2.2) * .6]; P.look = -1; }
    else if (type === 3) { P.look = local < 22 ? -1 : local < 44 ? 1 : local < 62 ? -1 : 0; P.hx = local < 22 ? -1 : local < 44 ? 1 : 0; }
    else if (type === 4) { P.al = [2.2, 2.3]; P.ar = [2.2, 2.3]; P.mouth = 3; }
    else { const up = local < 40; P.al = [1.2, up ? 2.6 : 4]; P.ar = [1.2, up ? 2.6 : 4]; P.hdy = up ? 1 : 0; P.look = 0; }
    return true;
  }
  const DUR = Sim.ENT_DUR;
  /* выбор позы по состоянию из симуляции */
  function animate(e, T) {
    const sd = e.seed || 0, P = pose({}), st = { P, burn: 0, char: 0, rot: 0, alpha: 1, sub: Math.min(12, e.sub | 0), zk: e.z ? 1 : 0, pivot: 'feet' };
    const px = e.px === undefined ? e.x : e.px; e.dist = (e.dist || 0) + Math.abs(e.x - px); e.px = e.x;
    const blink = ((T + sd * 7) % 230) < 7, dir = e.dir < 0 ? -1 : 1, flame = 1 + ((T >> 1) & 1);
    if (e.z && e.turn > 0) st.zk = Math.round((1 - e.turn / 45) * 4) / 4;
    if (e.dying) {
      const dt = e.dt | 0, k = e.dying, dur = DUR[k] || 40;
      P.al = [2.2, 3]; P.ar = [2.2, 3]; P.dl = 1; P.dr = 1; P.hdy = 1; P.blink = 1;
      if (k === 'burn') {
        if (dt < 7) { const w = T / 2.5; P.al = [2.6 + Math.sin(w) * .8, -1.8 + Math.cos(w) * 1.2]; P.ar = [2.6 + Math.cos(w) * .8, -1.8 + Math.sin(w) * 1.2]; P.mouth = 2; P.blink = 0; }
        else { P.dy = Math.min(2, Math.floor((dt - 7) / 3)); P.al = [1.4, 2.4]; P.ar = [1.4, 2.4]; }
        st.burn = dt > 20 ? 0 : flame; st.char = dt > 12 ? 2 : 1;
        const p = clamp01((dt - 7) / 16); st.rot = -dir * p * p * (3 - 2 * p) * 1.5;
      } else if (k === 'drown') {
        P.al = [2.4, -1.6 + Math.sin(T / 5) * .8]; P.ar = [2.4, -1.6 + Math.cos(T / 5) * .8]; P.mouth = 1; P.up = 1; P.dy = -1; P.blink = 0;
        st.rot = -dir * Math.min(.7, dt / 40); st.pivot = 'center';
      } else {
        const spin = k === 'blast' && dt < 22, p = clamp01(dt / (spin ? 22 : 16)), ease = p * p * (3 - 2 * p);
        st.rot = -dir * (spin ? ease * (1.5708 + 6.2832) : ease * 1.5708);
        if (dt < 10) { const w = T / 2; P.al = [2.8 + Math.sin(w) * .6, -1.5 + Math.cos(w)]; P.ar = [2.8 + Math.cos(w) * .6, -1.5 + Math.sin(w)]; P.mouth = 2; P.blink = 0; }
      }
      if (dur - dt < 14) st.alpha = Math.max(0, (dur - dt) / 14);
      return st;
    }
    if (e.turn > 0) {   /* заражение: судороги */
      const f = T >> 1, r1 = rnd2(f, sd), r2 = rnd2(f, sd + 5), r3 = rnd2(f, sd + 9);
      P.hx = r1 < .33 ? -1 : r1 > .66 ? 1 : 0; P.al = [1.5 + 2 * r2, -1 + 4 * r3]; P.ar = [1.5 + 2 * r3, -1 + 4 * r1]; P.dy = f & 1 ? 0 : 1; P.mouth = 2; P.ll = r2 > .6 ? 1 : 0; P.lr = r3 > .6 ? 1 : 0;
      return st;
    }
    if (e.hurt > 6) { P.dy = 1; P.hdy = 1; P.al = [2.4, 1.2]; P.ar = [2.4, 1.2]; P.mouth = 2; if (e.burn > 0) st.burn = flame; return st; }
    if (e.tumble > 0 && e.air) { P.al = [3, -2]; P.ar = [3, -2]; P.ll = 1; P.lr = 1; P.dl = 1; P.dr = 1; P.mouth = 2; st.rot = (T * .32) * (e.kx < 0 ? -1 : 1); st.pivot = 'center'; if (e.burn > 0) st.burn = flame; return st; }
    if (e.air && !e.swim) {
      const t = Math.max(-1, Math.min(1, e.vy / 2.2)); P.up = 1; P.dy = -1; P.look = 1;
      if (t < -.25) { P.al = [2.8, -2.4]; P.ar = [2.8, -2.4]; P.ll = 2; P.lr = 2; P.dl = 1; P.dr = 1; P.mouth = e.z ? 1 : 3; }
      else if (t < .4) { P.al = [3.4, -.2]; P.ar = [3.4, -.2]; P.ll = 1; P.lr = 1; P.dl = 1; P.dr = 1; }
      else { const w = Math.sin(T / 3) * .8; P.al = [3, -1.2 + w]; P.ar = [3, -1.2 - w]; P.ll = 1; P.lr = 0; P.dl = 1; P.dr = 1; P.mouth = t > .8 ? 2 : 0; }
      if (e.burn > 0) st.burn = flame;
      return st;
    }
    if (e.land > 0 && !e.swim) { P.dy = e.land > 5 ? 2 : 1; P.hdy = 1; P.al = [2, 3]; P.ar = [2, 3]; P.look = 1; if (e.burn > 0) st.burn = flame; return st; }
    if (e.swim) {
      const w = T / 9 + sd; P.al = [2.2 + 1.4 * Math.cos(w), .4 + 1.4 * Math.sin(w)]; P.ar = [2.2 + 1.4 * Math.cos(w + 3.14), .4 + 1.4 * Math.sin(w + 3.14)];
      P.ll = (T >> 2) & 1; P.lr = 1 - P.ll; P.dy = Math.sin(T / 14 + sd) > 0 ? 0 : 1; P.look = 1; P.blink = blink ? 1 : 0;
      if (e.z) { P.mouth = 1; P.al[1] -= 1; P.ar[1] -= 1; }
      return st;
    }
    if (e.burn > 0) {   /* горит: паника */
      const w = T / 2.5; gait(P, T / 9 + sd, true, false);
      P.al = [2.6 + Math.sin(w) * .8, -1.8 + Math.cos(w) * 1.2]; P.ar = [2.6 + Math.cos(w) * .8, -1.8 + Math.sin(w) * 1.2]; P.mouth = 2; P.hx = (T >> 1) & 1 ? 1 : -1;
      st.burn = flame; return st;
    }
    if (e.act === 'seed') { P.dy = 2; P.hdy = 1; P.ar = [.8, 3.6]; P.al = [.4, 3.2]; P.look = 1; return st; }
    if (e.act === 'dig') { const c = Math.cos(T * .45); P.ar = [1.2, -2.4 + (1 + c) * 2.8]; P.al = [.4, 3.2]; P.dy = c < 0 ? 1 : 0; P.look = 1; P.tool = 1; P.lean = 1; return st; }
    if (e.walk && !e.swim) {
      const run = e.fear > 0 && !e.z, stride = e.z ? 2.2 : run ? 3.4 : 2.8;
      gait(P, e.dist / stride + sd * .13, run, e.z);
      if (e.z && e.atk > 0) { P.dy = 1; P.hdy = 1; P.hx = 1; P.al = [.2, 1.2]; P.ar = [.2, 1.2]; P.mouth = 2; }
      if (run) P.mouth = 2;
      return st;
    }
    /* стоит */
    const br = ((T + sd * 13) % 160) < 64; P.hdy = br ? 1 : 0; P.blink = blink && !e.z ? 1 : 0;
    const slot = Math.floor((T + sd * 3) / 90), r = rnd2(slot, sd); P.look = r < .22 ? -1 : r > .78 ? 1 : 0;
    if (e.z) { P.hdy = 1; P.hx = [0, 1, 0, -1][(T >> 5) & 3]; P.al = [.8, 3 + Math.sin(T / 20) * .5]; P.ar = [.8, 3 + Math.cos(T / 20) * .5]; P.mouth = ((T >> 6) & 1) ? 1 : 0; P.dy = 1; P.look = 0; if (e.atk > 0) { P.al = [.2, 1.2]; P.ar = [.2, 1.2]; P.mouth = 2; } return st; }
    if (e.fear > 0) { P.al = [2, 1]; P.ar = [2, 1]; P.mouth = 2; P.look = 1; return st; }
    fidget(e, T, P);
    return st;
  }

  /* слой: ширина и высота вдвое больше мира */
  let lay = null, lctx = null;
  function init(canvas, W, H) { lay = canvas; lay.width = W * 2; lay.height = H * 2; lctx = lay.getContext('2d'); lctx.imageSmoothingEnabled = false; }
  function draw(ents, T, amb, ambKey, lightAt) {
    if (!lctx) return;
    lctx.clearRect(0, 0, lay.width, lay.height);
    const day = amb[0] > .985 && amb[1] > .985 && amb[2] > .985;
    for (const e of ents) {
      if (e.seed == null) e.seed = (Math.random() * 1000) | 0;
      if (!e.form) e.form = 'ref';
      /* ночью человечек освещён тем же светом, что и мир вокруг: у костра и лампы он виден, в темноте тёмный */
      let a = amb, ak = ambKey;
      if (!day && lightAt) { const L = lightAt(e.x, e.y - 6), q = (v) => Math.min(1.1, Math.round(v * 10) / 10); a = [q(L[0]), q(L[1]), q(L[2])]; ak = a.join(','); }
      const st = animate(e, T), spr = sprite(e, st.P, st.burn, e.dir < 0, st.sub, a, ak, st.zk, st.char);
      const cx = Math.round(e.x * 2), fy = (Math.round(e.y) + 1) * 2;
      if (st.alpha < 1) lctx.globalAlpha = st.alpha;
      if (st.rot) {
        lctx.save();
        if (st.pivot === 'center') { lctx.translate(cx, fy - FH / 2); lctx.rotate(st.rot); lctx.drawImage(spr, -SW / 2, -FH / 2); }
        else { lctx.translate(cx, fy); lctx.rotate(st.rot); lctx.drawImage(spr, -SW / 2, -FH); }
        lctx.restore();
      } else lctx.drawImage(spr, cx - SW / 2, fy - FH);
      if (st.alpha < 1) lctx.globalAlpha = 1;
    }
  }
  /* случайный горожанин для инструмента «Человек» */
  function randomForm() { return Math.random() < .3 ? 'ref' : TOWN[(Math.random() * TOWN.length) | 0]; }
  /* иконка для интерфейса: портрет по грудь 16x16 */
  const icons = {};
  function icon(form, z) {
    const k = (form || 'ref') + (z ? 'z' : ''); if (icons[k]) return icons[k];
    const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
    x.drawImage(sprite({ form: form || 'ref', seed: 0 }, NEUTRAL, 0, false, 0, null, 'i', z ? 1 : 0, 0), 0, 2, SW, 16, 1, 0, SW, 16);
    return icons[k] = c.toDataURL();
  }
  /* каждый образ — отдельный инструмент во вкладке «Люди» */
  if (typeof TOOLS !== 'undefined') {
    for (const id in FORMS) TOOLS['P_' + id] = { name: FORMS[id].name, hint: FORMS[id].hint, form: id };
    if (typeof CATS !== 'undefined' && !CATS.some((c) => c.id === 'people')) {
      const life = CATS.find((c) => c.id === 'life'); if (life) life.els = life.els.filter((k) => k !== 't:HUMAN' && k !== 't:ZOMBIE');
      CATS.splice(CATS.indexOf(life) + 1, 0, { id: 'people', name: 'Люди', icon: 'people', els: ['t:HUMAN'].concat(Object.keys(FORMS).filter((k) => k !== 'ref').map((k) => 't:P_' + k), ['t:ZOMBIE']) });
    }
  }
  return { init, draw, icon, randomForm, FORMS, compose, sprite, animate, NEUTRAL, get canvas() { return lay; } };
})();
