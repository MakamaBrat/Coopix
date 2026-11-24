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

  /* сборка кадра: сетка символов FH x SW */
  const pad = (r) => r.length >= SW ? r.slice(0, SW) : ('..' + r.padEnd(10, '.') + '..').slice(0, SW);
  function base(form) {
    const F = FORMS[form] || FORMS.ref, g = []; for (let i = 0; i < ROWS; i++) g.push(new Array(SW).fill('.'));
    const put = (rows, r0) => rows.forEach((r, j) => { const s = pad(r); for (let x = 0; x < SW; x++) if (s[x] !== '.') g[r0 + j + HAT][x] = s[x]; });
    if (F.hat) put(HATS[F.hat], -3);
    put(HEADS[F.head], 0); put(BODIES[F.body], 10); put(LEGS[F.legs], 17);
    for (const [r, x, ch] of F.props || []) g[r + HAT][x] = ch;
    return g;
  }
  function frame(form, f) {
    const F = FORMS[form] || FORMS.ref, src = base(form), lift = f === 1 ? 'l' : f === 2 ? 'r' : null, bob = lift ? 1 : 0;
    const at = (r) => src[r + HAT];
    if (f === 3 && !F.noBlink) { at(5)[6] = 'S'; at(5)[9] = 'S'; }
    if (lift) { const c = lift === 'l' ? 9 : 4, v = [at(13)[c], at(14)[c], at(15)[c], at(16)[c]]; at(13)[c] = v[1]; at(14)[c] = v[2]; at(15)[c] = v[3]; at(16)[c] = v[0]; }
    const out = []; for (let y = 0; y < FH; y++) out.push(new Array(SW).fill('.'));
    for (let r = -3; r < 17; r++) for (let x = 0; x < SW; x++) if (at(r)[x] !== '.') out[r + HAT + 1 - bob][x] = at(r)[x];
    if (bob) for (let x = 0; x < SW; x++) if (out[20][x] === '.' && at(17)[x] !== '.') out[20][x] = at(17)[x];
    for (let r = 17; r < 23; r++) for (let x = 0; x < SW; x++) if (at(r)[x] !== '.') out[r + HAT + 1][x] = at(r)[x];
    if (lift) {
      const cols = lift === 'l' ? [4, 5, 6] : [7, 8, 9], last = FH - 1;
      for (const x of cols) { for (let y = 21; y < last; y++) out[y][x] = y + 1 < last ? out[y + 1][x] : 'k'; out[last][x] = '.'; }
      out[last - 1][lift === 'l' ? 6 : 7] = 'k';
    }
    return { g: out, eyes: f === 3 && !F.noBlink ? [] : [[5, 6], [5, 9], [6, 6], [6, 9]].map(([r, x]) => [r + HAT + 1 - bob, x]) };
  }
  const FR = {};
  const frameOf = (form, f) => (FR[form + f] || (FR[form + f] = frame(form, f)));

  /* палитра конкретного человечка: образ + случайная кожа у горожан + зомби */
  function palette(e) {
    const F = FORMS[e.form] || FORMS.ref, P = Object.assign({}, REF, F.pal || {});
    if (F.town && e.form !== 'ref' || (e.form === 'ref' && e.skinV)) { const s = SKIN[(e.seed || 0) % SKIN.length]; Object.assign(P, { S: s, L: mix(s, [255, 255, 255], .18), D: mul(s, .9), h: mix(s, [255, 240, 220], .25), o: mix(mul(s, .78), [200, 70, 30], .35) }); }
    if (e.z) {
      const G = [132, 184, 104];
      for (const k in P) if (k !== 'k' && k !== 'eye') P[k] = mul(mix(P[k], [96, 108, 96], .45), .86);
      Object.assign(P, { S: G, L: mix(G, [255, 255, 255], .2), D: mul(G, .85), h: mul(G, .95), m: [96, 34, 40], eye: [220, 44, 36] });
    }
    return P;
  }
  const cache = new Map();
  function sprite(e, f, burn, flip) {
    const key = (e.form || 'ref') + (e.z ? 'z' : '') + ((e.seed || 0) % SKIN.length) + '|' + f + '|' + burn + '|' + flip;
    let cv = cache.get(key); if (cv) return cv;
    if (cache.size > 900) cache.clear();
    const P = palette(e), fr = frameOf(e.form || 'ref', f);
    cv = document.createElement('canvas'); cv.width = SW; cv.height = FH;
    const c = cv.getContext('2d'), im = c.createImageData(SW, FH), d = im.data;
    for (let y = 0; y < FH; y++) for (let x = 0; x < SW; x++) {
      const ch = fr.g[y][x]; if (ch === '.') continue;
      let col = P[ch] || [255, 0, 255];
      if (ch === 'k' && fr.eyes.some(([ey, ex]) => ey === y && ex === x)) col = P.eye;
      if (e.z && ch !== 'k' && ((x * 7 + y * 13 + (e.seed || 0) * 3) % 11) === 0) col = mul(col, .62);
      if (burn) col = mix(col, burn === 2 ? [255, 196, 60] : [255, 110, 30], ch === 'k' ? .25 : .5);
      const tx = flip ? SW - 1 - x : x, o = (y * SW + tx) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    c.putImageData(im, 0, 0); cache.set(key, cv); return cv;
  }
  /* слой: ширина и высота вдвое больше мира */
  let lay = null, lctx = null;
  function init(canvas, W, H) { lay = canvas; lay.width = W * 2; lay.height = H * 2; lctx = lay.getContext('2d'); lctx.imageSmoothingEnabled = false; }
  function draw(ents, tick) {
    if (!lctx) return;
    lctx.clearRect(0, 0, lay.width, lay.height);
    for (const e of ents) {
      if (e.seed == null) e.seed = (Math.random() * 1000) | 0;
      if (!e.form) e.form = 'ref';
      let f = 0;
      if (e.air) f = 1;
      else if (e.walk && !e.swim) f = [0, 1, 0, 2][Math.floor(e.x * 2.2) & 3];
      else if ((tick + e.seed) % 230 < 7) f = 3;
      const burn = e.burn > 0 ? 1 + ((tick >> 1) & 1) : 0;
      lctx.drawImage(sprite(e, f, burn, e.dir < 0), Math.round(e.x * 2) - SW / 2, (Math.round(e.y) + 1) * 2 - FH);
    }
  }
  /* случайный горожанин для инструмента «Человек» */
  function randomForm() { return Math.random() < .3 ? 'ref' : TOWN[(Math.random() * TOWN.length) | 0]; }
  /* иконка для интерфейса: портрет по грудь 16x16 */
  const icons = {};
  function icon(form, z) {
    const k = (form || 'ref') + (z ? 'z' : ''); if (icons[k]) return icons[k];
    const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
    x.drawImage(sprite({ form: form || 'ref', z: !!z, seed: 0 }, 0, 0, false), 0, 2, SW, 16, 1, 0, SW, 16);
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
  return { init, draw, icon, randomForm, FORMS, frame: frameOf, get canvas() { return lay; } };
})();
