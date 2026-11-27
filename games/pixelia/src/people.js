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
    crew: ['..kkkkkk..', '.kbbbcbbk.', 'kbbcbbcbbk', 'kbSLSSLSbk', 'kbSSSSSSbk', 'kDSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..'],   /* короткая стрижка */
    curly: ['.kk.kk.kk.', 'kbckbckbck', 'kbbcbbcbbk', 'kcbbcbbcbk', 'kbbSSSSbbk', 'kbSSkSSkbk', 'kbSSkSSkbk', 'kbSSSmmSbk', '.kbSSSSbk.', '..kkDDkk..'],   /* кудри */
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
    wavy: ['..kkkkkk..', '.kbbcckCk.', 'kbccbbkCYC', 'kbbbbbbkCk', 'kbbkSSSSkk', 'kbSSkSSkbk', 'kbSSkSSkbk', 'kbSSSmmSbk', 'kbkSSSSkbk', 'kbbkDDkbbk'],   /* пышные волосы, цветок у виска, ресницы */
    hood_cat: ['.kk....kk.', 'kEFk..kFEk', 'kFFFkkFFFk', 'kFFFFFFFFk', 'kFFSSSSFFk', 'kFSSkSSkFk', 'kFSSkSSkFk', 'kFSSSmmSFk', '.kFSSSSFk.', '..kkFFkk..'],
    hood_bear: ['.kk....kk.', 'kFfk..kfFk', 'kFFFkkFFFk', 'kFFFFFFFFk', 'kFFSSSSFFk', 'kFSSkSSkFk', 'kFSSkSSkFk', 'kFSSSmmSFk', '.kFSSSSFk.', '..kkFFkk..'],
    hood_panda: ['.kk....kk.', 'kNNk..kNNk', 'kFFFkkFFFk', 'kFFFFFFFFk', 'kFFSSSSFFk', 'kFSSkSSkFk', 'kFSSkSSkFk', 'kFSSSmmSFk', '.kFSSSSFk.', '..kkFFkk..'],
    hood_dog: ['..kkkkkk..', '.kFFFFFFk.', 'kFFFFFFFFk', 'kfFFFFFFfk', 'kfFSSSSFfk', 'kfSSkSSkfk', 'kfSSkSSkfk', 'kfSSSmmSfk', '.kfSSSSfk.', '..kkFFkk..'],
    hood_shark: ['....kk....', '...kFFk...', '.kkFFFFkk.', 'kFFFFFFFFk', 'kWFWFWFWFk', 'kFSSkSSkFk', 'kFSSkSSkFk', 'kFSSSmmSFk', '.kFSSSSFk.', '..kkFFkk..'],
    hood_dino: ['..k.k.k...', '.kYkYkYk..', 'kFFFFFFFFk', 'kFFFFFFFFk', 'kFFSSSSFFk', 'kFSSkSSkFk', 'kFSSkSSkFk', 'kFSSSmmSFk', '.kFSSSSFk.', '..kkFFkk..'],
    hood_uni: ['....kk....', '...kYk....', '.kkFYFkkk.', 'kRFFFFFFFk', 'kRFSSSSFFk', 'kRSSkSSkFk', 'kRSSkSSkFk', 'kRSSSmmSFk', '.kFSSSSFk.', '..kkFFkk..'],
    granny: ['...kkkk...', '..kbccbk..', '.kkbbbbkk.', 'kbbbbcbbbk', 'kbbSSSSSbk', 'kbSSkSSkDk', 'kDSSkSSkDk', '.kSSSmmSk.', '.kSSSSSSk.', '..kkDDkk..']
  };
  const HATS = {
    straw: ['', '....kkkkkk....', '...kYYYYYYk...'],
    wizard: ['....kk....', '...kVYk...', '..kVVVVk..'],
    helm: ['', '....kRk...', '...kRRk...'],
    space: ['', '', '....kXk...'],
    police: ['', '....kkkkkk....', '...kNNNNNNk...', '..kNNNNYNNNk..', '..kkkkkkkkkk..'],
    fire: ['', '....kkkkkk....', '...kRRRRRRk...', '..kRRRYYRRRk..', '.kkkkkkkkkkkkk'],
    army: ['', '....kkkkkk....', '...kGGeGGGk...', '..kGeGGGeGGk..', '..kkkkkkkkkk..'],
    crown: ['...k..kk..k...', '...kYkYYkYk...', '...kYYRYYYk...', '...kkkkkkkk...'],
    tiara: ['', '', '.....kYYk.....', '....kYRRYk....'],
    beanie: ['.....kzzk.....', '....kkZZkk....', '...kZZZZZZk...', '..kZZZZZZZZk..', '..kzzzzzzzzk..'],
    santa: ['.kWWk.........', '.kWkRRkk......', '...kRRRRRk....', '..kRRRRRRRRk..', '..kWWWWWWWWk..'],
    toque: ['...kWwWWwWk...', '...kWWWWWWk...', '....kWWWWk....', '...kwwwwwwk...', '...kkkkkkkk...'],
    nurse: ['', '', '....kkkkkk....', '...kWWRRWWk...', '...kWWWWWWk...'],
    cowboy: ['', '.....kkkk.....', '....kMMMMk....', '...kNNNNNNk...', 'kkMMMMMMMMMMkk'],
    tricorn: ['', '..k.kkkkkk.k..', '.kNkNNWNNNkNk.', '.kNNNNNNNNNNk.', '..kkkkkkkkkk..'],
    sailor: ['', '', '...kkkkkkkk...', '..kWWWWWWWWk..', '..kNNNNNNNNk..'],
    scrub: ['', '', '...kkkkkkkk...', '..kOOOOOOOOk..', '..kOOOOOOOOk..'],
    halo: ['...kYYYYYYk...', '....kkkkkk....'],
    horns: ['', '...k......k...', '..kRk....kRk..', '..kRRk..kRRk..'],
    antlers: ['.k.k......k.k.', '.kMkk....kkMk.', '..kMMk..kMMk..'],
    maidband: ['', '', '', '...kWkWWkWk...', '...kWWWWWWk...']
  };
  const BODIES = {
    jacket: ['.kJJnnrrk.', '.kjqWWruk.', '.kjqWWruk.', '.kqqWWruk.', '.khqWWrhk.', '.khuwwrhk.', '.koupppok.'],
    tee: ['.kTTnnTTk.', '.kTTTTTTk.', '.kTTTTTtk.', '.kSTTTTSk.', '.kSTTTtSk.', '.khTTTthk.', '.kopppPok.'],
    hoodie: ['.kJJjjJJk.', '.kjJWJWjk.', '.kjJWJWjk.', '.kjJJJJjk.', '.khqqqqhk.', '.khJJJJhk.', '.kopppPok.'],
    dress: ['.kTTnnTTk.', '.kSTTTTSk.', '.kSTTTtSk.', '.kSTTTtSk.', '.khTTTThk.', '.kTTTTTtk.', 'kTTTTTTTtk'],
    bare: ['.kSSSSSSk.', '.kSSSSSSk.', '.kSDSSDSk.', '.kSSSSSSk.', '.khSSSShk.', '.khSSoShk.', '.kPPPPPpk.'],      /* голый торс, пояс плавок */
    bikini: ['.kSTTTTSk.', '.kSTTTtSk.', '.kSSSSSSk.', '.kSSSSSSk.', '.khSSoShk.', '.khSSSShk.', '.kTTTTTtk.'],    /* купальник из двух частей */
    onepiece: ['.kSTTTTSk.', '.kSTTTtSk.', '.kSTTTtSk.', '.kSTTTtSk.', '.khTTTThk.', '.khTTTThk.', '.kTTTTTtk.'],  /* слитный купальник */
    blazer: ['.kJJWWJJk.', '.kjJWRJjk.', '.kjJWRJjk.', '.kjJWRJjk.', '.khJJJJhk.', '.khjJJjhk.', '.kopppPok.'],      /* пиджак, рубашка, галстук */
    gown: ['.kSTTTTSk.', '.kSTTTtSk.', '.kSTTTtSk.', '.kSTTTTSk.', '.khTTTThk.', '.kTTTTTtk.', 'kTTTTTTTtk'],       /* длинное платье: торс */
    apron: ['.kNWWWWNk.', '.kNNWWNNk.', '.kNWWWWNk.', '.kNWWWWNk.', '.khWWWWhk.', '.kNWWWWNk.', 'kNNWWWWNNk'],      /* платье горничной с фартуком */
    labcoat: ['.kWWOOWWk.', '.kwWOOWwk.', '.kwWkOWwk.', '.kwWOkWwk.', '.khWWWWhk.', '.khWWWWhk.', '.kWWppWWk.'],   /* белый халат, стетоскоп */
    police: ['.kJJnnJJk.', '.kjYJJJjk.', '.kjJJJJjk.', '.kjJJJJjk.', '.khkkYkhk.', '.khJJJJhk.', '.kopppPok.'],    /* форма, значок, ремень */
    fire: ['.kJJkkJJk.', '.kjJJJJjk.', '.kYYYYYYk.', '.kjJJJJjk.', '.khJJJJhk.', '.khYYYYhk.', '.kJJJJJJk.'],      /* куртка пожарного со светоотражателями */
    chef: ['.kWWkkWWk.', '.kwWkWWwk.', '.kwWWkWwk.', '.kwWkWWwk.', '.khWWWWhk.', '.khwwwwhk.', '.kopppPok.'],      /* двубортный китель */
    camo: ['.kGGeGGGk.', '.keGGeGek.', '.kGeGGeGk.', '.kGGeGGek.', '.khGGeGhk.', '.khkkkkhk.', '.kGeGGeGk.'],      /* камуфляж */
    royal: ['.kWWWWWWk.', '.kRRYRRRk.', '.kRRYRRRk.', '.krRYRRrk.', '.khRYRRhk.', '.kRRYRRRk.', 'kRRRYRRRRk'],     /* мантия с горностаем */
    cloak: ['.kGGnnGGk.', '.kGeMMeGk.', '.kGeMMeGk.', '.kGeMMeGk.', '.khMMMMhk.', '.kGeMMeGk.', 'kGGeMMeGGk'],     /* плащ следопыта */
    onesie: ['.kFFFFFFk.', '.kfFEEFfk.', '.kfFEEFfk.', '.kfFEEFfk.', '.khFEEFhk.', '.kfFFFFfk.', '.kfFFFFfk.'],    /* кигуруми */
    santa: ['.kWWWWWWk.', '.kRRWWRRk.', '.kRRWWRRk.', '.kWRWWRWk.', '.khkkYkhk.', '.kRRWWRRk.', '.kWWWWWWk.'],     /* шуба с белой опушкой */
    sweater: ['.kTTnnTTk.', '.kTWTTWTk.', '.kTTWWTTk.', '.kTWTTWTk.', '.khTTTThk.', '.khtttthk.', '.kopppPok.'],   /* вязаный свитер с узором */
    puffer: ['.kTTZZTTk.', '.kTTTTTTk.', '.kttttttk.', '.kTTTTTTk.', '.khtttthk.', '.khTTTThk.', '.kopppPok.'],    /* пуховик */
    pajama: ['.kTTWWTTk.', '.kWWWWWWk.', '.kTTTTTTk.', '.kWWWWWWk.', '.khTTTThk.', '.khWWWWhk.', '.kTTTTTTk.'],    /* полосатая пижама */
    hawaii: ['.kTTnnTTk.', '.kTYTRTTk.', '.kTTTYTRk.', '.kRTTTYTk.', '.khTRTThk.', '.khTTYThk.', '.kopppPok.'],    /* гавайская рубашка */
    stripes: ['.kWWNNWWk.', '.kNNNNNNk.', '.kWWWWWWk.', '.kNNNNNNk.', '.khWWWWhk.', '.khNNNNhk.', '.kopppPok.'],   /* тельняшка */
    skeleton: ['.kNNNNNNk.', '.kNWNNWNk.', '.kWNWWNWk.', '.kNWWWWNk.', '.khNWWNhk.', '.khNWWNhk.', '.kNNNNNNk.'],  /* костюм скелета */
    track: ['.kJJWWJJk.', '.kWJJJJWk.', '.kWJJJJWk.', '.kWJJJJWk.', '.khJJJJhk.', '.khJJJJhk.', '.kJJJJJJk.'],     /* спортивный костюм */
    varsity: ['.kRRWWRRk.', '.kWRRRRWk.', '.kWRWRRWk.', '.kWRRRRWk.', '.khRRRRhk.', '.khRRRRhk.', '.kRRRRRRk.'],   /* бомбер с белыми рукавами */
    croptop: ['.kSTTTTSk.', '.kSTTTTSk.', '.kStTTtSk.', '.kSDDDDSk.', '.khSoSShk.', '.kPPPPPpk.', '.kPPPPPpk.'],   /* короткий топ, открытый живот, мини-юбка */
    sundress: ['.kSTTTTSk.', '.kSTTTTSk.', '.kSTTTtSk.', '.kSRRRRSk.', '.khTTTThk.', '.kTTTTTtk.', 'kTTTTTTTtk'],   /* открытые плечи, поясок, расклёшенная юбка */
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
    slacks: ['..kPppPk..', '..kPppPk..', '..kPppPk..', '..kPppPk..', '..kgppgk..', '..kkkkkk..'],   /* брюки костюма: летом не превращаются в шорты */
    dress: ['.kTTTTTtk.', '.kTTTTTtk.', '..kSDSDk..', '..kSDSDk..', '..kBBBBk..', '..kkkkkk..'],
    gown: ['kTTTTTTTtk', 'kTTTTTTTtk', 'kTTTTTTTtk', 'kTTTTTTTtk', 'kTTTTTTTtk', '.kkBkkBkk.'],   /* юбка до пола (вся в торсе) */
    maidskirt: ['.kNWWWWNk.', 'kNNWWWWNNk', '..kSDSDk..', '..kSDSDk..', '..kBBBBk..', '..kkkkkk..'],
    coatlegs: ['.kWPppPWk.', '.kwPppPwk.', '..kPppPk..', '..kPppPk..', '..kgppgk..', '..kkkkkk..'],
    firelegs: ['..kPppPk..', '..kPppPk..', '..kYyyYk..', '..kPppPk..', '..kBBBBk..', '..kkkkkk..'],
    camo: ['..kGeGek..', '..keGGek..', '..kGeGek..', '..keGGek..', '..kNNNNk..', '..kkkkkk..'],
    onesie: ['..kFffFk..', '..kFffFk..', '..kFffFk..', '..kFffFk..', '..kEEEEk..', '..kkkkkk..'],
    santa: ['..kRrrRk..', '..kRrrRk..', '..kRrrRk..', '..kNNNNk..', '..kNNNNk..', '..kkkkkk..'],
    pajama: ['..kTWTWk..', '..kTWTWk..', '..kTWTWk..', '..kTWTWk..', '..kSSSSk..', '..kkkkkk..'],
    shorts: ['..kPppPk..', '..kPppPk..', '..kSDSDk..', '..kSDSDk..', '..kBBBBk..', '..kkkkkk..'],
    bones: ['..kNWWNk..', '..kNWWNk..', '..kNNNNk..', '..kNWWNk..', '..kNNNNk..', '..kkkkkk..'],
    track: ['..kWPPWk..', '..kWPPWk..', '..kWPPWk..', '..kWPPWk..', '..kBBBBk..', '..kkkkkk..'],
    trunks: ['..kPppPk..', '..kSDSDk..', '..kSDSDk..', '..kSDSDk..', '..kSDSDk..', '..kkkkkk..'],   /* плавки, босиком */
    swimbot: ['..kTttTk..', '..kSDSDk..', '..kSDSDk..', '..kSDSDk..', '..kSDSDk..', '..kkkkkk..'],
    skirt: ['.kPPPPPpk.', '.kpPPPPpk.', '..kSDSDk..', '..kSDSDk..', '..kBBBBk..', '..kkkkkk..'],
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
  const BEARD_S = [[7, 4, 'a'], [7, 9, 'a'], [8, 4, 'a'], [8, 5, 'a'], [8, 6, 'a'], [8, 7, 'b'], [8, 8, 'a'], [8, 9, 'a'], [9, 6, 'a'], [9, 7, 'a']];   /* короткая борода цвета волос — седеет вместе с ними */

  /* базовая палитра — цвета с картинки */
  const REF = {
    k: [5, 2, 0], a: [54, 36, 20], b: [72, 42, 22], c: [106, 62, 34], d: [184, 122, 82], S: [250, 208, 176], L: [252, 224, 200], D: [232, 182, 148], m: [230, 10, 52],
    J: [66, 92, 90], j: [44, 80, 80], q: [18, 46, 46], r: [62, 78, 72], u: [26, 50, 40], n: [242, 221, 186], W: [243, 244, 246], w: [216, 234, 228],
    h: [244, 212, 184], o: [214, 140, 104], P: [10, 70, 80], p: [5, 34, 40], g: [76, 110, 108], eye: [5, 2, 0],
    T: [90, 140, 220], t: [66, 106, 176], C: [214, 56, 52], R: [214, 52, 48], Y: [246, 200, 70], y: [196, 146, 40], B: [60, 40, 46], M: [110, 70, 40],
    X: [190, 198, 214], x: [128, 138, 158], V: [104, 66, 180], v: [72, 44, 132], N: [34, 34, 44], l: [255, 250, 200], O: [150, 230, 255],
    G: [98, 116, 66], e: [66, 82, 46], F: [200, 170, 140], f: [160, 128, 98], E: [240, 210, 200], A: [244, 244, 250], U: [206, 210, 226], H: [168, 60, 56], I: [226, 196, 120]
  };
  const mul = (c, k) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const hairPal = (b) => ({ a: mul(b, .76), b, c: mix(mul(b, 1.4), [255, 255, 255], .06), d: mix(b, [236, 196, 150], .6) });
  const jacketPal = (j) => ({ J: mix(mul(j, 1.3), [150, 150, 150], .12), j, q: mul(j, .45), r: mix(j, [110, 110, 104], .35), u: mul(j, .6) });
  const SKIN = [[250, 208, 176], [242, 194, 158], [222, 164, 122], [170, 112, 74], [112, 72, 48]];
  /* почти все светлокожие: из 20 — 16 светлых, 2 смуглых, по одному темнее */
  const SKIN_OF = [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 2, 2, 3, 4];
  const skinIdx = (e) => SKIN_OF[(e.seed | 0) % SKIN_OF.length];

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
    belle: { name: 'Красавица', hint: 'Пышные волосы с цветком, короткий топ и мини-юбка.', head: 'wavy', body: 'croptop', legs: 'skirt', pal: { ...hairPal([118, 50, 34]), T: [230, 74, 120], t: [180, 46, 88], R: [252, 208, 96], C: [255, 128, 168], Y: [255, 232, 120], m: [214, 30, 70] } },
    granny: { name: 'Бабушка', hint: 'Седой пучок и платье. Не торопится.', head: 'granny', body: 'dress', legs: 'dress', pal: { ...hairPal([206, 206, 214]), T: [128, 84, 160], t: [96, 60, 124] }, noBlink: true, abil: { speed: .6 } }
  };
  const TOWN = Object.keys(FORMS).filter((k) => FORMS[k].town);
  /* ---------- женский вариант любого образа: длинные волосы до плеч, ресницы, у части — юбка вместо джинсов.
     Образы, которые и так женские (платье, хвост, бабушка), не меняются; в шлеме, скафандре, маске, колпаке — только ресницы.
     Вариант создаётся один раз (FORMS['ref~f'], 'ref~fs' — с юбкой) и дальше рисуется как обычный образ. */
  const FEM_OK = { dress: 1, tail: 1, granny: 1, belle: 1 }, NO_HAIR = { helm: 1, space: 1, ninja: 1, wizard: 1, mohawk: 1, hood_cat: 1, hood_bear: 1, hood_panda: 1, hood_dog: 1, hood_shark: 1, hood_dino: 1, hood_uni: 1 };
  const HAIR_PROPS = [[10, 1, 'k'], [10, 2, 'a'], [10, 11, 'a'], [10, 12, 'k'], [11, 1, 'k'], [11, 2, 'a'], [11, 11, 'a'], [11, 12, 'k'], [12, 1, 'k'], [12, 2, 'a'], [12, 11, 'a'], [12, 12, 'k'], [13, 2, 'k'], [13, 11, 'k']];
  FORMS.belle.props = HAIR_PROPS;   /* у красавицы длинные волосы до плеч */
  const BELLE = [[[240, 90, 140], [190, 56, 100], [118, 50, 34], [40, 44, 70]], [[250, 250, 250], [210, 210, 220], [40, 28, 24], [206, 40, 60]], [[110, 190, 240], [70, 140, 200], [214, 164, 84], [240, 240, 244]], [[30, 28, 36], [16, 14, 20], [150, 64, 34], [176, 120, 220]]];   /* топ, его тень, волосы, юбка */
  const skinC = (c) => c === 'S' || c === 'L' || c === 'D';
  function femHead(key, updo) {
    const nk = key + (updo ? '~u' : '~f'); if (HEADS[nk]) return nk;
    const g = HEADS[key].map((r) => pad(r).split(''));
    /* ресницы над внешними уголками глаз */
    if (skinC(g[4][5])) g[4][5] = 'k'; if (skinC(g[4][10])) g[4][10] = 'k';
    if (!NO_HAIR[key] && !updo) {
      /* волосы спадают по бокам лица до подбородка и ниже */
      for (let r = 3; r <= 9; r++) {
        let l = g[r].indexOf('k'), rr = g[r].lastIndexOf('k'); if (l < 0) continue;
        if (l >= 2) { g[r][l - 1] = r >= 8 ? 'a' : 'b'; if (l - 2 >= 0) g[r][l - 2] = 'k'; }
        if (rr <= 11) { g[r][rr + 1] = r >= 8 ? 'a' : 'b'; if (rr + 2 < SW) g[r][rr + 2] = 'k'; }
      }
    }
    HEADS[nk] = g.map((r) => r.join(''));
    return nk;
  }
  function femForm(form, skirt) {
    const F = FORMS[form] || FORMS.ref;
    if (FEM_OK[form]) return form;
    if (form === 'elder') return 'granny';
    const sk = skirt && (F.legs === 'jeans' || F.legs === 'slacks'), key = form + '~f' + (sk ? 's' : '');
    if (!FORMS[key]) {
      /* обычная горожанка: своя причёска (хвост, пучок, каре, кудри), у части — платье; в рабочей каске и капюшоне — как у всех */
      const own = F.femHead && F.head === F.normHead, fh = own ? F.femHead : (F.head === 'spiky' ? 'bob' : F.head), updo = own && fh === 'tail', dress = own && F.femDress && F.body === F.normBody;
      FORMS[key] = Object.assign({}, F, { head: femHead(fh, updo), body: dress ? 'dress' : F.body, legs: dress ? 'dress' : sk ? 'skirt' : F.legs, props: (NO_HAIR[fh] || updo ? [] : HAIR_PROPS).concat(F.props || []), town: false, fem: true });
    }
    return key;
  }
  /* какой образ рисовать этому человечку (у девушек — женский вариант) */
  /* рабочая одежда: пока человек занят делом своей профессии (или идёт к нему) — костюм ремесла, в остальное время — своя одежда.
     Только у обычных горожан (образы вроде рыцаря или космонавта не переодеваются). Голова/причёска своя, если костюм без шапки. */
  const OUTFIT = {
    mason: { head: 'hardhat', body: 'vest', legs: 'jeans', pal: FORMS.miner.pal },
    builder: { head: 'hardhat', body: 'overall', legs: 'boots', pal: { J: [232, 150, 40], j: [184, 104, 30], R: [236, 222, 196] } },
    lumber: { body: 'vest', legs: 'boots', pal: { ...jacketPal([176, 44, 40]), Y: [64, 32, 28], W: [220, 210, 190] } },
    fisher: { body: 'hoodie', legs: 'boots', pal: { ...jacketPal([236, 190, 40]), W: [236, 190, 40] } },
    farmer: { head: FORMS.farmer.head, hat: FORMS.farmer.hat, body: 'overall', legs: 'boots', pal: FORMS.farmer.pal },
    pirate: { head: FORMS.pirate.head, body: FORMS.pirate.body, legs: FORMS.pirate.legs, pal: FORMS.pirate.pal },
    priest: { body: 'robe', legs: 'robe', pal: { V: [44, 38, 54], v: [28, 24, 36], Y: [236, 226, 200] } },
    scholar: { body: 'robe', legs: 'robe', pal: { V: [62, 74, 136], v: [42, 50, 98], Y: [226, 192, 92] } },
    crafter: { body: 'overall', legs: 'boots', pal: { J: [124, 86, 54], j: [92, 62, 38], R: [204, 194, 172] } },
    barkeep: { body: 'vest', legs: 'jeans', pal: { ...jacketPal([96, 42, 40]), W: [238, 236, 230], Y: [96, 42, 40] } },
    trader: { body: 'jacket', legs: 'jeans', pal: jacketPal([60, 132, 82]) }
  };

  /* ---------- костюмы (по листу-референсу): туловище, ноги, убор, палитра; голова и волосы — свои у того, кто надел.
     props — поверх всего (борода), back — позади тела, рук и головы (крылья, хвост, фата) ---------- */
  const WING_L = ['..kk', '.kAA', 'kAAA', 'kAUA', 'kAAU', 'kUAA', '.kUA', '..kA', '...k'];   /* левое крыло: строки 11..19, столбцы 0..3; правое — зеркально */
  const WINGS = []; WING_L.forEach((row, j) => { for (let x = 0; x < 4; x++) if (row[x] !== '.') WINGS.push([11 + j, x, row[x]], [11 + j, 13 - x, row[x]]); });
  const DTAIL = [[16, 11, 'k'], [17, 11, 'R'], [17, 12, 'k'], [18, 11, 'k'], [18, 12, 'R'], [18, 13, 'k'], [19, 12, 'k'], [19, 13, 'R'], [20, 12, 'R'], [20, 13, 'R'], [21, 12, 'k'], [21, 13, 'k']];
  const VEIL = [];
  for (let r = 0; r <= 17; r++) { const c = r % 3 === 1 ? 'w' : 'W'; VEIL.push([r, 0, 'k'], [r, 1, c], [r, 2, 'W'], [r, 11, 'W'], [r, 12, c], [r, 13, 'k']); }
  for (let x = 2; x <= 11; x++) VEIL.push([-1, x, 'W'], [-2, x, 'k']); VEIL.push([-1, 1, 'k'], [-1, 12, 'k'], [18, 0, 'k'], [18, 1, 'k'], [18, 2, 'k'], [18, 11, 'k'], [18, 12, 'k'], [18, 13, 'k']);
  const BEARD = [[7, 3, 'W'], [7, 10, 'W'], [7, 6, 'W'], [7, 9, 'W'],
    [8, 3, 'W'], [8, 4, 'W'], [8, 5, 'W'], [8, 6, 'W'], [8, 7, 'W'], [8, 8, 'W'], [8, 9, 'W'], [8, 10, 'W'],
    [9, 3, 'k'], [9, 4, 'W'], [9, 5, 'W'], [9, 6, 'w'], [9, 7, 'W'], [9, 8, 'W'], [9, 9, 'W'], [9, 10, 'k'],
    [10, 4, 'k'], [10, 5, 'W'], [10, 6, 'W'], [10, 7, 'w'], [10, 8, 'W'], [10, 9, 'k'], [11, 5, 'k'], [11, 6, 'W'], [11, 7, 'W'], [11, 8, 'k'], [12, 6, 'k'], [12, 7, 'k']];
  const C = {
    suit: { n: 'Костюм', d: 'Пиджак, белая рубашка и галстук.', body: 'blazer', legs: 'slacks', hair: [70, 46, 30], pal: { J: [52, 54, 66], j: [36, 38, 48], R: [176, 40, 48], P: [44, 46, 56], p: [28, 30, 38], g: [28, 30, 38] }, town: true },
    tux: { n: 'Смокинг', d: 'Чёрный смокинг с бабочкой — для свадьбы и праздника.', body: 'blazer', legs: 'slacks', hair: [40, 30, 26], pal: { J: [30, 30, 36], j: [18, 18, 24], R: [20, 20, 26], P: [26, 26, 32], p: [14, 14, 20], g: [14, 14, 20] } },
    gown: { n: 'Вечернее платье', d: 'Длинное красное платье до пола.', body: 'gown', legs: 'gown', hair: [120, 50, 34], pal: { T: [176, 36, 56], t: [128, 22, 42] }, fem: 1 },
    bride: { n: 'Невеста', d: 'Белое платье до пола, фата и диадема.', body: 'gown', legs: 'gown', hat: 'tiara', back: VEIL, hair: [214, 172, 76], pal: { T: [250, 250, 252], t: [208, 212, 226], w: [226, 230, 242] }, fem: 1 },
    maid: { n: 'Горничная', d: 'Чёрное платье, белый фартук, наколка.', body: 'apron', legs: 'maidskirt', hat: 'maidband', hair: [40, 30, 30], pal: { N: [34, 30, 40] }, fem: 1 },
    waiter: { n: 'Официант', d: 'Белая рубашка и чёрный жилет.', body: 'vest', legs: 'slacks', hair: [60, 40, 28], pal: { ...jacketPal([30, 30, 36]), W: [244, 244, 240], w: [214, 214, 210], n: [244, 244, 240], Y: [30, 30, 36], P: [30, 30, 36], p: [18, 18, 24], g: [18, 18, 24] } },
    police: { n: 'Полицейский', d: 'Тёмно-синяя форма, фуражка, значок.', body: 'police', legs: 'slacks', hat: 'police', hair: [50, 36, 26], pal: { ...jacketPal([44, 60, 116]), N: [30, 40, 84], P: [30, 40, 84], p: [20, 28, 60], g: [20, 28, 60] } },
    fire: { n: 'Пожарный', d: 'Каска и куртка со светоотражающими полосами.', body: 'fire', legs: 'firelegs', hat: 'fire', hair: [90, 56, 34], pal: { J: [190, 140, 72], j: [150, 106, 52], P: [190, 140, 72], p: [150, 106, 52], Y: [248, 222, 70], y: [210, 182, 40], R: [214, 52, 42] } },
    doctor: { n: 'Врач', d: 'Белый халат и стетоскоп.', body: 'labcoat', legs: 'coatlegs', hair: [110, 100, 96], pal: { w: [206, 212, 224], O: [110, 160, 214], P: [64, 74, 96], p: [44, 52, 70], g: [44, 52, 70] } },
    nurse: { n: 'Медсестра', d: 'Белое платье и шапочка с красным крестом.', body: 'dress', legs: 'dress', hat: 'nurse', hair: [200, 160, 90], pal: { T: [248, 248, 250], t: [210, 214, 226], n: [248, 248, 250] }, fem: 1 },
    surgeon: { n: 'Хирург', d: 'Бирюзовая форма и шапочка.', body: 'tee', legs: 'slacks', hat: 'scrub', hair: [60, 44, 34], pal: { T: [92, 186, 168], t: [64, 150, 134], O: [92, 186, 168], n: [92, 186, 168], P: [92, 186, 168], p: [64, 150, 134], g: [64, 150, 134] } },
    chef: { n: 'Повар', d: 'Белый китель и высокий колпак.', body: 'chef', legs: 'slacks', hat: 'toque', hair: [80, 54, 36], pal: { w: [220, 224, 230], P: [44, 44, 50], p: [28, 28, 34], g: [28, 28, 34] } },
    soldier: { n: 'Солдат', d: 'Камуфляж и каска. Жители надевают их на войне.', body: 'camo', legs: 'camo', hat: 'army', hair: [50, 40, 30], pal: { G: [98, 116, 66], e: [66, 82, 46], N: [44, 40, 36] } },
    king: { n: 'Король', d: 'Красная мантия с горностаем и корона.', body: 'royal', legs: 'gown', hat: 'crown', hair: [130, 96, 60], pal: { R: [178, 40, 50], r: [130, 28, 38], T: [178, 40, 50], t: [130, 28, 38] }, male: 1 },
    queen: { n: 'Королева', d: 'Платье до пола и корона.', body: 'gown', legs: 'gown', hat: 'crown', hair: [60, 40, 34], pal: { T: [128, 70, 176], t: [94, 48, 136] }, fem: 1 },
    princess: { n: 'Принцесса', d: 'Голубое платье до пола и диадема.', body: 'gown', legs: 'gown', hat: 'tiara', hair: [226, 186, 96], pal: { T: [126, 168, 236], t: [88, 128, 198] }, fem: 1 },
    ranger: { n: 'Следопыт', d: 'Зелёный плащ и кожаная туника.', body: 'cloak', legs: 'boots', hair: [110, 70, 40], pal: { G: [72, 112, 62], e: [48, 80, 44], M: [126, 88, 54], J: [96, 66, 40], j: [70, 48, 30], n: [72, 112, 62] } },
    cowboy: { n: 'Ковбой', d: 'Широкополая шляпа, жилет, джинсы.', body: 'vest', legs: 'slacks', hat: 'cowboy', hair: [120, 80, 46], pal: { ...jacketPal([128, 86, 50]), M: [150, 104, 60], N: [70, 44, 28], Y: [128, 86, 50], W: [214, 200, 170], n: [190, 60, 50], P: [60, 90, 140], p: [40, 62, 100], g: [40, 62, 100] } },
    captain: { n: 'Капитан', d: 'Треуголка и красный камзол.', body: 'pirate', legs: 'slacks', hat: 'tricorn', hair: [40, 30, 26], pal: { J: [170, 40, 46], j: [124, 28, 34], N: [30, 28, 34], R: [214, 180, 70], P: [40, 34, 30], p: [26, 22, 20], g: [26, 22, 20] } },
    sailor: { n: 'Матрос', d: 'Тельняшка и бескозырка.', body: 'stripes', legs: 'slacks', hat: 'sailor', hair: [90, 60, 36], pal: { N: [40, 60, 130], P: [40, 60, 130], p: [28, 42, 96], g: [28, 42, 96] } },
    hawaii: { n: 'Гавайка', d: 'Яркая рубашка в цветах и шорты.', body: 'hawaii', legs: 'shorts', hair: [150, 100, 50], pal: { T: [60, 170, 200], t: [40, 130, 160], Y: [250, 220, 80], R: [240, 90, 110], n: [60, 170, 200], P: [230, 210, 160], p: [190, 170, 120] }, town: true },
    sweater: { n: 'Свитер', d: 'Вязаный свитер с узором и шапка с помпоном.', body: 'sweater', legs: 'slacks', hat: 'beanie', hair: [100, 64, 40], pal: { T: [180, 44, 52], t: [140, 30, 40], W: [244, 240, 236], n: [244, 240, 236], P: [56, 70, 110], p: [36, 46, 76], g: [36, 46, 76] }, town: true },
    puffer: { n: 'Пуховик', d: 'Тёплый пуховик и шапка.', body: 'puffer', legs: 'slacks', hat: 'beanie', hair: [80, 54, 36], pal: { T: [70, 110, 176], t: [50, 84, 140], P: [50, 52, 62], p: [32, 34, 42], g: [32, 34, 42] }, town: true },
    pajama: { n: 'Пижама', d: 'Полосатая пижама — в ней спят.', body: 'pajama', legs: 'pajama', hair: [110, 70, 40], pal: { T: [110, 150, 220], t: [80, 116, 186] } },
    track: { n: 'Спортивный костюм', d: 'Костюм с белыми лампасами.', body: 'track', legs: 'track', hair: [60, 40, 28], pal: { J: [36, 38, 48], j: [24, 26, 34], P: [36, 38, 48], p: [24, 26, 34] }, town: true },
    varsity: { n: 'Бомбер', d: 'Красный бомбер с белыми рукавами.', body: 'varsity', legs: 'slacks', hair: [70, 46, 30], pal: { R: [176, 42, 48], P: [56, 80, 130], p: [36, 54, 92], g: [36, 54, 92] }, town: true },
    school: { n: 'Школьная форма', d: 'Синий пиджак и красный галстук. Дети носят её на уроках.', body: 'blazer', legs: 'slacks', hair: [90, 60, 36], pal: { J: [42, 58, 112], j: [30, 42, 84], R: [190, 40, 48], P: [70, 70, 84], p: [46, 46, 58], g: [46, 46, 58] } },
    santa: { n: 'Дед Мороз', d: 'Красная шуба с опушкой, шапка и борода.', body: 'santa', legs: 'santa', hat: 'santa', props: BEARD, hair: [236, 236, 240], pal: { R: [196, 40, 44], r: [150, 26, 32], N: [34, 30, 34] }, male: 1 },
    xelf: { n: 'Новогодний эльф', d: 'Зелёный костюм и колпак с помпоном.', body: 'santa', legs: 'santa', hat: 'santa', hair: [200, 120, 60], pal: { R: [62, 150, 70], r: [44, 112, 52], N: [140, 40, 44] } },
    skeleton: { n: 'Скелет', d: 'Чёрный костюм с белыми костями.', body: 'skeleton', legs: 'bones', hair: [30, 26, 30], pal: { N: [30, 28, 34] } },
    angel: { n: 'Ангел', d: 'Белые одежды, крылья и нимб.', body: 'robe', legs: 'robe', hat: 'halo', back: WINGS, hair: [226, 190, 100], pal: { V: [246, 246, 250], v: [210, 214, 226], Y: [250, 226, 120], A: [244, 244, 250], U: [206, 210, 226] } },
    devil: { n: 'Чертёнок', d: 'Рожки, крылышки и хвост.', body: 'tee', legs: 'slacks', hat: 'horns', back: WINGS.concat(DTAIL), hair: [30, 26, 30], pal: { T: [170, 30, 40], t: [120, 20, 30], n: [170, 30, 40], P: [40, 30, 36], p: [26, 20, 24], g: [26, 20, 24], R: [210, 40, 44], A: [110, 26, 36], U: [80, 18, 26] } },
    cat: { n: 'Кот (кигуруми)', d: 'Чёрный комбинезон с ушками.', head: 'hood_cat', body: 'onesie', legs: 'onesie', pal: { F: [44, 40, 52], f: [30, 28, 38], E: [244, 200, 210], h: [44, 40, 52], o: [30, 28, 38] } },
    dog: { n: 'Пёс (кигуруми)', d: 'Коричневый комбинезон с висячими ушами.', head: 'hood_dog', body: 'onesie', legs: 'onesie', pal: { F: [168, 116, 70], f: [126, 82, 46], E: [234, 204, 160], h: [168, 116, 70], o: [126, 82, 46] } },
    bear: { n: 'Медведь (кигуруми)', d: 'Бурый комбинезон с круглыми ушками.', head: 'hood_bear', body: 'onesie', legs: 'onesie', pal: { F: [140, 96, 60], f: [104, 68, 40], E: [222, 190, 150], h: [140, 96, 60], o: [104, 68, 40] } },
    panda: { n: 'Панда (кигуруми)', d: 'Белый комбинезон с чёрными ушками.', head: 'hood_panda', body: 'onesie', legs: 'onesie', pal: { F: [246, 246, 246], f: [206, 206, 212], E: [40, 40, 44], N: [36, 36, 40], h: [40, 40, 44], o: [30, 30, 34] } },
    shark: { n: 'Акула (кигуруми)', d: 'Голубой комбинезон с плавником и зубами.', head: 'hood_shark', body: 'onesie', legs: 'onesie', pal: { F: [110, 160, 220], f: [80, 124, 184], E: [240, 244, 250], h: [110, 160, 220], o: [80, 124, 184] } },
    dino: { n: 'Динозавр (кигуруми)', d: 'Зелёный комбинезон с шипами.', head: 'hood_dino', body: 'onesie', legs: 'onesie', pal: { F: [96, 170, 76], f: [66, 130, 54], E: [236, 220, 120], Y: [250, 210, 70], h: [96, 170, 76], o: [66, 130, 54] } },
    unicorn: { n: 'Единорог (кигуруми)', d: 'Белый комбинезон, золотой рог и розовая грива.', head: 'hood_uni', body: 'onesie', legs: 'onesie', pal: { F: [248, 244, 250], f: [212, 204, 224], E: [250, 200, 220], R: [240, 140, 190], Y: [250, 214, 90], h: [248, 244, 250], o: [212, 204, 224] } },
    reindeer: { n: 'Олень (кигуруми)', d: 'Коричневый комбинезон с рогами.', head: 'hood_dog', body: 'onesie', legs: 'onesie', hat: 'antlers', pal: { F: [150, 100, 60], f: [112, 72, 42], E: [232, 206, 166], M: [96, 64, 40], h: [150, 100, 60], o: [112, 72, 42] } }
  };
  const HOODS = { hood_cat: 1, hood_bear: 1, hood_panda: 1, hood_dog: 1, hood_shark: 1, hood_dino: 1, hood_uni: 1 };
  for (const k in C) { const c = C[k]; FORMS[k] = { name: c.n, hint: c.d, head: c.head || (c.fem ? 'bun' : 'swept'), body: c.body, legs: c.legs, hat: c.hat, props: c.props, back: c.back, pal: Object.assign(c.hair ? hairPal(c.hair) : {}, c.pal), town: !!c.town, costume: true, femOnly: !!c.fem, maleOnly: !!c.male }; }
  /* цвета вариантов: у каждого свой пуховик, свитер, гавайка, пижама */
  const WINTER_C = [[176, 44, 52], [58, 98, 168], [66, 128, 78], [128, 70, 150], [222, 150, 52]];
  const HAWAII_C = [[60, 170, 200], [220, 70, 70], [40, 60, 120], [240, 150, 40]];
  const VAR = { puffer: WINTER_C, sweater: WINTER_C, pajama: [[110, 150, 220], [230, 120, 150], [120, 190, 140], [200, 170, 90], [160, 120, 200]], hawaii: HAWAII_C };
  /* надеть костюм на конкретного человека: голова и волосы — его (шляпа ремесла снимается), капюшон кигуруми — вместо головы */
  function dressAs(base, ck, v) {
    const c = C[ck]; if (!c) return base;
    const key = base + '#' + ck + (v == null ? '' : v); if (FORMS[key]) return key;
    const F = FORMS[base] || FORMS.ref, head = c.head || (NOHAT[F.head] ? 'swept' : F.head);
    const keep = c.head || head !== F.head ? [] : (F.props === HAIR_PROPS || F.props === TAILS ? F.props : []);
    const pal = Object.assign({}, F.pal || {}, c.pal || {});
    if (v != null && VAR[ck]) { const t = VAR[ck][v % VAR[ck].length]; pal.T = t; pal.t = mul(t, .75); }
    FORMS[key] = Object.assign({}, F, { head, hat: c.hat, body: c.body, legs: c.legs, props: keep.concat(c.props || []), back: c.back, pal, town: false, costume: false, noBlink: head === F.head ? F.noBlink : false });
    return key;
  }
  /* глава общества носит корону поверх своей одежды */
  function crowned(e, k) {
    if (e.soc == null || typeof Town === 'undefined' || !Town.byId) return k;
    const s = Town.byId(e.soc); if (!s || s.leader !== e.id) return k;
    const F = FORMS[k] || FORMS.ref; if (HOODS[F.head]) return k;
    const key = k + '^c'; if (!FORMS[key]) FORMS[key] = Object.assign({}, F, { head: NOHAT[F.head] ? 'swept' : F.head, hat: 'crown', town: false, costume: false });
    return key;
  }
  const atWar = (e) => { if (e.soc == null || typeof Town === 'undefined' || !Town.byId) return false; const s = Town.byId(e.soc); if (!s || !s.war) return false; for (const k in s.war) if (s.war[k]) return true; return false; };
  /* праздники по календарю: вторая половина последнего дня зимы — Новый год, последнего дня осени — карнавал костюмов */
  const FEST = { 1: ['santa', 'xelf', 'reindeer', 'sweater', 'xelf', 'reindeer', 'bear'], 2: ['skeleton', 'devil', 'angel', 'cat', 'panda', 'dino', 'shark', 'unicorn', 'dog', 'bear'] };
  /* праздник бывает не каждый год: решается один раз в праздничный день — через раз (Новый год чуть чаще),
     и только если в деревне всё хорошо: никто не умирал 3 дня, нет войны, мало кто грустит, ссорится или дерётся, еды хватает */
  const fest = { day: -1, v: 0 };
  function festOK(kind, Y) {
    if (typeof Sim === 'undefined' || Math.random() > (kind === 2 ? .45 : .6)) return false;
    const live = Sim.ents.filter((e) => !e.z && !e.dying && !e.dead && e.name); if (live.length < 4) return false;
    if (Sim.lastDeathDay != null && Y.day - Sim.lastDeathDay < 3) return false;
    const sad = live.filter((e) => (e.mood || 0) < -1.5 || e.task === 'fight' || e.fear > 0).length; if (sad > live.length * .15) return false;   /* праздник — только когда почти все в настроении */
    if (typeof Town !== 'undefined' && Town.socs.some((s) => (s.war && Object.values(s.war).some(Boolean)) || (s.food || 0) < Town.members(s).length)) return false;
    return true;
  }
  function festival() {
    if (typeof Sky === 'undefined' || !Sky.Y) return 0; const Y = Sky.Y;
    if (Y.dos !== Y.slen - 1 || Y.time < .4) return 0;
    const kind = Y.season === 3 ? 1 : Y.season === 2 ? 2 : 0; if (!kind) return 0;
    if (fest.day !== Y.day) { fest.day = Y.day; fest.v = festOK(kind, Y) ? kind : 0; }
    return fest.v;
  }
  /* ---------- обычные горожане (большинство жителей): стрижка, одежда и цвета собираются случайно ----------
     ключ 'n:' + 7 знаков: мужская стрижка, женская причёска, верх, вариант (1 — у девушки платье, 2 — у мужчины борода), волосы, цвет верха, брюки */
  const N_MH = ['swept', 'spiky', 'crew', 'curly', 'swept', 'bob', 'crew', 'swept'];
  const N_FH = ['tail', 'bun', 'bob', 'swept', 'curly', 'tail', 'bob', 'swept'];
  const N_BODY = ['jacket', 'tee', 'hoodie', 'jacket', 'tee', 'varsity', 'track', 'sweater', 'tee', 'hoodie', 'jacket', 'tee'];
  const N_HAIR = [[30, 26, 30], [58, 40, 28], [96, 62, 36], [58, 40, 28], [140, 96, 56], [214, 172, 76], [178, 84, 40], [120, 50, 34], [96, 62, 36], [40, 32, 30], [190, 150, 90]];
  const N_TOP = [[66, 92, 90], [44, 62, 120], [168, 44, 40], [70, 120, 62], [204, 160, 40], [120, 70, 160], [110, 112, 120], [40, 40, 48], [236, 236, 232], [220, 110, 140], [230, 130, 50], [90, 160, 220], [110, 110, 60], [120, 80, 50]];
  const N_PANTS = [[56, 96, 150], [34, 50, 84], [40, 40, 48], [90, 90, 100], [150, 130, 90], [96, 70, 50], [56, 96, 150], [34, 50, 84]];
  function normForm(key) {
    if (FORMS[key]) return key;
    const q = key.slice(2).split('').map((ch) => parseInt(ch, 36) || 0), at = (L, i) => L[(q[i] || 0) % L.length];
    const head = at(N_MH, 0), body = at(N_BODY, 2), top = at(N_TOP, 5), pants = at(N_PANTS, 6), fo = q[3] || 0;
    const pal = Object.assign({}, hairPal(at(N_HAIR, 4)), { T: top, t: mul(top, .75), P: pants, p: mul(pants, .62), g: mix(pants, [200, 200, 210], .3) });
    if (body === 'jacket' || body === 'hoodie' || body === 'track') Object.assign(pal, jacketPal(top));
    if (body === 'varsity') pal.R = top;
    if (body === 'track') { pal.P = pal.J; pal.p = pal.j; }
    FORMS[key] = { name: 'Житель', hint: 'Обычный горожанин.', head, normHead: head, femHead: at(N_FH, 1), body, normBody: body, femDress: fo === 1, beard: fo === 2, legs: body === 'track' ? 'track' : 'jeans', pal, town: true, norm: true };
    return key;
  }
  const randomNorm = () => { const r = (n) => ((Math.random() * n) | 0).toString(36); return normForm('n:' + r(N_MH.length) + r(N_FH.length) + r(N_BODY.length) + r(4) + r(N_HAIR.length) + r(N_TOP.length) + r(N_PANTS.length)); };
  /* летние наряды девушек: майка и юбка разных цветов */
  const SWIMC = [[60, 140, 230], [230, 70, 110], [250, 196, 60], [40, 170, 120], [150, 90, 210]];   /* цвета плавок и купальников */
  const SUMMER = [
    { W: [250, 236, 240], w: [214, 190, 200], R: [214, 84, 124], P: [214, 84, 124], p: [170, 56, 94] },
    { W: [255, 214, 90], w: [218, 172, 60], R: [60, 120, 190], P: [60, 120, 190], p: [40, 86, 150] },
    { W: [120, 214, 200], w: [84, 170, 160], R: [240, 240, 236], P: [244, 244, 240], p: [200, 200, 206] },
    { W: [236, 96, 80], w: [190, 64, 56], R: [40, 36, 44], P: [44, 40, 52], p: [28, 26, 34] }
  ];
  const TASK_OUT = { quarry: 'mason', shaft: 'mason', climb: 'mason', chop: 'lumber', house: 'builder', repair: 'builder', build: 'builder', rod: 'builder', fish: 'fisher', dockfish: 'fisher', sow: 'farmer', dock: 'pirate', dockwork: 'pirate', trade: 'trader', preach: 'priest', study: 'scholar', craft: 'crafter', serve: 'barkeep', heal: 'doctor' };
  function wear(e) {
    const base = e.form || 'ref', F = FORMS[base];
    if (base === 'belle' && (e.age || 0) < 18) return 'dress';   /* открытые наряды — только у взрослых */
    if (!F || e.z) return base;
    if (e.dead || e.dying) return e._wk && FORMS[e._wk] ? e._wk : base;   /* тело остаётся в той одежде, в которой человек умер */
    return e._wk = wear0(e, base, F);
  }
  /* порядок: купание → сон → свадьба → урок → работа → война → праздник → зима на улице → возраст и лето; глава — в короне */
  function wear0(e, base, F) {
    if (!(base === 'ref' || F.town)) return base;   /* рыцарь, космонавт, костюмы из меню — не переодеваются */
    const age = e.age || 0, v = e.seed | 0, sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : 1;
    if (e.task === 'swim') {   /* купается: плавки / купальник; дети и девочки до 18 — слитный */
      const w = v % SWIMC.length, kind = e.fem ? (age >= 18 ? 'b' : 'o') : 'm', key = base + '@swim' + kind + w;
      if (!FORMS[key]) FORMS[key] = Object.assign({}, F, { body: kind === 'm' ? 'bare' : kind === 'b' ? 'bikini' : 'onepiece', legs: kind === 'm' ? 'trunks' : 'swimbot', props: F.props, hat: undefined, head: F.head, pal: Object.assign({}, F.pal || {}, { T: SWIMC[w], t: mul(SWIMC[w], .75), P: SWIMC[w], p: mul(SWIMC[w], .75) }), town: false });
      return key;
    }
    if (e.sleep) return dressAs(base, 'pajama', v % 5);   /* спит — в пижаме */
    let o = age >= 16 ? TASK_OUT[e.task] : null;
    if (!o && age >= 18 && (e.task === 'wed' || (e.wedDay != null && typeof Sky !== 'undefined' && Sky.day === e.wedDay))) return dressAs(base, e.fem ? 'bride' : 'tux');   /* день свадьбы */
    if (age >= 6 && age < 18 && e.task === 'learn') return dressAs(base, 'school');
    if (o) {
      if (o === 'barkeep') return dressAs(base, e.fem ? 'maid' : 'waiter');   /* в таверне: официантка / официант */
      if (o === 'trader') return dressAs(base, 'suit');
      if (o === 'doctor') return e.prof === 'doctor' ? dressAs(base, e.fem ? 'nurse' : 'doctor') : crowned(e, base);   /* халат — только у врача */                       /* торговец — в костюме с галстуком */
      if (e.prof === 'pirate' && o === 'fisher') o = 'pirate';
      const O = OUTFIT[o], key = base + '@' + o;
      if (!FORMS[key]) FORMS[key] = Object.assign({}, F, { head: O.head || F.head, hat: O.head ? O.hat : F.hat, body: O.body, legs: O.legs, props: O.head ? [] : F.props, pal: Object.assign({}, F.pal || {}, O.pal || {}), town: false });
      return key;
    }
    if (age >= 18 && e.weapon && atWar(e)) return dressAs(base, 'soldier');   /* война: вооружённые — в камуфляже и каске */
    const fest = festival();
    if (fest && age >= 2) { const L = FEST[fest]; let ck = L[(v >> 1) % L.length]; if (ck === 'santa' && (e.fem || age < 30)) ck = 'xelf'; return crowned(e, dressAs(base, ck)); }
    if (sea === 3 && !(e.room && e.phase === 'do') && age >= 2) return crowned(e, dressAs(base, ((v >> 2) % 3) === 0 ? 'sweater' : 'puffer', v % 5));   /* зима на улице: пуховик или свитер, шапка */
    if (age < 16) return base;
    /* возраст: старики (70+) ходят с тростью; летом часть мужчин — в гавайках, молодые девушки — майка и юбка */
    if (age >= 70) { const key = base + '@old'; if (!FORMS[key]) FORMS[key] = Object.assign({}, F, { props: (F.props || []).concat(CANE), town: false }); return crowned(e, key); }
    if (sea === 1 && !e.fem && (v % 4) === 1) return crowned(e, dressAs(base, 'hawaii', (v >> 2) % 4));
    /* открытые наряды — у части молодых девушек и в основном летом: обычная одежда встречается чаще */
    if (base === 'ref' && e.fem && age >= 18 && age < 40 && (v % 7) === 1 && (sea === 1 || sea === 0)) return crowned(e, 'belle');
    if (e.fem && age >= 18 && age < 32 && (sea === 1 ? (v % 3) === 0 : sea !== 3 && (v % 6) === 0)) {
      const w = (v >> 1) % SUMMER.length, key = base + '@summer' + w;
      if (!FORMS[key]) FORMS[key] = Object.assign({}, F, { body: 'croptop', legs: 'skirt', props: F.props, pal: Object.assign({}, F.pal || {}, SUMMER[w], { T: SUMMER[w].W, t: SUMMER[w].w }), town: false });
      return crowned(e, key);
    }
    return crowned(e, base);
  }
  const look = (e) => {
    const f = wear(e); if (e.fem) return femForm(f, ((e.seed | 0) % 3) === 0);
    const F = FORMS[f]; if (!F || !F.beard || (e.age || 0) < 22 || HOODS[F.head] || f.indexOf('#santa') >= 0) return f;   /* у части мужчин — короткая борода */
    const key = f + '~b'; if (!FORMS[key]) FORMS[key] = Object.assign({}, F, { props: (F.props || []).concat(BEARD_S), town: false }); return key;
  };

  /* ---------- сборка кадра из частей: голова, туловище, руки на двух костях, ноги ----------
     Всё берётся из символьной сетки образа; поза — числа: сдвиг тела, голова, взгляд, рот, цель каждой руки, подъём и разворот ног. */
  const pad = (r) => r.length >= SW ? r.slice(0, SW) : ('..' + r.padEnd(10, '.') + '..').slice(0, SW);
  function base(form) {
    const F = FORMS[form] || FORMS.ref, g = []; for (let i = 0; i < ROWS; i++) g.push(new Array(SW).fill('.'));
    const put = (rows, r0) => rows.forEach((r, j) => { const s = pad(r); for (let x = 0; x < SW; x++) if (s[x] !== '.') g[r0 + j + HAT][x] = s[x]; });
    put(HEADS[F.head], 0); put(BODIES[F.body], 10); put(LEGS[F.legs], 17);
    if (F.hat) put(HATS[F.hat], -3);   /* шапка поверх волос */
    for (const [r, x, ch] of F.props || []) g[r + HAT][x] = ch;
    return g;
  }
  const rigCache = {};
  function rig(form) {
    if (rigCache[form]) return rigCache[form];
    const F = FORMS[form] || FORMS.ref, g = base(form), at = (r) => g[r + HAT], skirt = ({ dress: 2, skirt: 2, maidskirt: 2, coatlegs: 2, gown: 5 })[F.legs] || 0;
    const R = { head: [], torso: [], armSym: [[], []], legs: [[], []], props: F.props || [], back: F.back || [], skirt, noBlink: !!F.noBlink };
    for (let r = -3; r <= 9; r++) R.head.push(at(r).slice());
    for (let r = 10; r <= 16 + skirt; r++) { const row = at(r).slice(); if (r >= 11 && r <= 15) for (const x of [3, 4, 9, 10]) row[x] = '.';
      /* нижняя строка торса: там нарисованы кисти опущенных рук — убираем, иначе при поднятой руке у бедра торчит обрубок */
      if (r === 16) { if (row[4] === 'o' || row[4] === 'h') { row[3] = '.'; row[4] = 'k'; } if (row[9] === 'o' || row[9] === 'h') { row[10] = '.'; row[9] = 'k'; } }
      R.torso.push(row); }
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
  const NEUTRAL = { dy: 0, hdy: 0, hx: 0, lean: 0, look: 0, blink: 0, mouth: 0, al: [.2, 4], ar: [.2, 4], ll: 0, lr: 0, dl: 0, dr: 0, up: 0, tool: 0, sit: 0, belly: 0, blanket: 0 };
  const SLEEVED = { jacket: 1, tee: 1, hoodie: 1, vest: 1, leather: 1, pirate: 1 }, NOHAT = { straw: 1, helm: 1, wizard: 1, space: 1, ninja: 1, hardhat: 1, cap: 1, bandana: 1 };
  /* сидячие ноги. sit: 1 — на стуле/лавке/кровати (бедро вперёд, голень вниз), 2 — на земле (ноги вытянуты), 3 — на одном колене */
  function sitLegs(R, P, put, hip) {
    const pick = (rows, last) => { const rr = last ? [rows[rows.length - 2] || ''] : rows; for (const row of rr) for (const ch of row) if (ch !== '.' && ch !== 'k') return ch; return last ? 'B' : 'P'; };
    const mc = pick(R.legs[1]), bc = pick(R.legs[0]), sc = pick(R.legs[1], true), G = FH - 1;
    const chairLeg = (x0, knee, c) => {
      for (let x = x0; x <= knee + 1; x++) { put(hip - 1, x, 'k'); put(hip, x, c); put(hip + 1, x, c); put(hip + 2, x, 'k'); }
      put(hip, knee + 2, 'k'); put(hip + 1, knee + 2, 'k');
      for (let y = hip + 2; y <= G - 2; y++) { put(y, knee - 1, 'k'); put(y, knee, c); put(y, knee + 1, c); put(y, knee + 2, 'k'); }
      put(G - 1, knee - 1, 'k'); put(G - 1, knee, sc); put(G - 1, knee + 1, sc); put(G - 1, knee + 2, sc); put(G - 1, knee + 3, 'k');
      for (let x = knee - 1; x <= knee + 3; x++) put(G, x, 'k');
    };
    if (P.sit === 1) { chairLeg(5, 8, bc); chairLeg(6, 9, mc); }
    else if (P.sit === 2) {   /* на земле: ноги вытянуты вперёд, носки вверх */
      for (let x = 5; x <= 11; x++) { put(G - 3, x, 'k'); put(G - 2, x, x & 1 ? mc : bc); put(G - 1, x, mc); put(G, x, 'k'); }
      for (let y = G - 4; y <= G - 1; y++) { put(y, 12, sc); put(y, 13, 'k'); } put(G - 5, 12, 'k'); put(G, 12, 'k'); put(G, 13, 'k');
    } else if (P.sit === 4) {   /* по-турецки: колени в стороны, скрещённые стопы посередине */
      for (let x = 2; x <= 11; x++) { put(G - 3, x, 'k'); put(G - 2, x, x < 7 ? bc : mc); put(G, x, 'k'); }
      put(G - 2, 1, 'k'); put(G - 2, 12, 'k'); put(G, 1, 'k'); put(G, 12, 'k');
      for (let x = 1; x <= 12; x++) put(G - 1, x, x === 1 || x === 12 || x === 5 || x === 8 ? 'k' : (x === 6 || x === 7) ? sc : x < 5 ? bc : mc);
    } else if (P.sit === 5) {   /* обнял колени: ноги рисуются перед животом (см. compose) */
    } else {   /* на колене: передняя нога согнута, задняя — колено на земле, голень назад */
      chairLeg(6, 9, mc);
      for (let y = hip; y <= G - 1; y++) { put(y, 3, 'k'); put(y, 4, bc); put(y, 5, bc); put(y, 6, 'k'); }
      for (let x = 0; x <= 5; x++) { put(G - 2, x, x < 4 ? 'k' : bc); put(G - 1, x, x === 0 ? 'k' : x < 2 ? sc : bc); put(G, x, 'k'); }
    }
  }
  /* ноги сидящего на земле — как на листе-референсе: таз на земле, колени выведены вперёд, ботинки у земли.
     2 — ноги вытянуты, 4 — по-турецки, 5 — обнял колени (колени высоко), 6 — колени вперёд (обычная поза).
     Рисуются после туловища (колени закрывают живот) и обводятся тёмным контуром целиком */
  function groundLegs(R, P, put) {
    const pick = (rows, last) => { const rr = last ? [rows[rows.length - 2] || ''] : rows; for (const row of rr) for (const ch of row) if (ch !== '.' && ch !== 'k') return ch; return last ? 'B' : 'P'; };
    const A = pick(R.legs[1]), Bc = pick(R.legs[0]), sh = pick(R.legs[1], true), G = FH - 1, cells = new Map();
    const set = (x, y, c) => { if (x >= 0 && x < SW && y >= 0 && y <= G) cells.set(y * SW + x, c); };
    const knee = (kx, ky, c) => {   /* бедро от таза к колену (2 точки толщиной), голень вниз, ботинок носком вперёд */
      const hx = kx - 6;
      for (let x = hx; x <= kx; x++) { const y0 = Math.round((G - 1) + (ky - (G - 1)) * (x - hx) / (kx - hx)); set(x, y0, c); set(x, y0 + 1, c); }
      for (let y = ky; y <= G - 1; y++) { set(kx, y, c); set(kx + 1, y, c); }
      set(kx, G - 1, sh); set(kx + 1, G - 1, sh); set(kx + 2, G - 1, sh); set(kx, G, sh); set(kx + 1, G, sh);
    };
    if (P.sit === 2) {   /* ноги вытянуты вперёд, носки вверх */
      for (let x = 4; x <= 10; x++) { set(x, G - 2, Bc); set(x, G - 1, Bc); }
      set(11, G - 4, sh); set(11, G - 3, sh); set(11, G - 2, sh);
      for (let x = 3; x <= 10; x++) { set(x, G - 1, A); set(x, G, A); }
      set(11, G - 1, sh); set(11, G, sh); set(12, G - 3, sh); set(12, G - 2, sh); set(12, G - 1, sh);
    } else if (P.sit === 4) {   /* по-турецки: колени в стороны, скрещённые стопы в середине */
      for (let x = 5; x <= 8; x++) set(x, G - 3, x < 7 ? Bc : A);
      for (let x = 3; x <= 10; x++) set(x, G - 2, x < 7 ? Bc : A);
      for (let x = 2; x <= 11; x++) set(x, G - 1, x < 7 ? Bc : A);
      set(6, G - 1, sh); set(7, G - 1, sh); set(5, G - 2, sh); set(8, G - 2, sh);
    } else {   /* колени вперёд (6) или обнял колени (5): сначала дальняя нога, поверх — ближняя */
      const ky = P.sit === 5 ? G - 7 : G - 5;
      knee(8, ky + 1, Bc); knee(10, ky, A);
    }
    const out = new Map();
    for (const [k] of cells) { const x = k % SW, y = (k / SW) | 0; for (const [ox, oy] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) { const nx = x + ox, ny = y + oy; if (nx < 0 || nx >= SW || ny < 0 || ny > G) continue; const nk = ny * SW + nx; if (!cells.has(nk)) out.set(nk, 'k'); } }
    for (const [k, c] of out) put((k / SW) | 0, k % SW, c);
    for (const [k, c] of cells) put((k / SW) | 0, k % SW, c);
  }
  /* sea: время года (0 весна, 1 лето, 2 осень, 3 зима); -1 — без сезонной одежды. Летом короткие рукава и шорты, осенью шарф, зимой шапка и шарф */
  function compose(form, P, sea) {
    const R = rig(form), out = [], F = FORMS[form] || FORMS.ref;
    for (let y = 0; y < FH; y++) out.push(new Array(SW).fill('.'));
    const put = (y, x, c) => { if (y >= 0 && y < FH && x >= 0 && x < SW) out[y][x] = c; };
    const B = HAT + 1, dy = P.dy | 0, lean = P.lean | 0, hip = 17 + R.skirt + B + dy;
    /* ноги: нижняя точка ступни поднимается на lift, верх привязан к бёдрам; лишние строки вынимаются из середины */
    if (P.sit) { if ((P.sit === 1 || P.sit === 3) && R.skirt < 5) sitLegs(R, P, put, hip); } else
    for (let s = 0; s < 2; s++) {
      const lift = (s ? P.lr : P.ll) | 0, sh = (s ? P.dr : P.dl) | 0, rows = R.legs[s], nr = rows.length;
      const len = Math.max(3, 26 - lift - (P.up | 0) - hip + 1), x0 = 4 + s * 3 + (s ? sh : -sh);
      for (let j = 0; j < len; j++) {
        let si = j >= len - 2 ? nr - (len - j) : Math.min(j, nr - 3); si = Math.max(0, Math.min(nr - 1, si));
        const row = rows[si]; for (let q = 0; q < 3; q++) if (row[q] !== '.') { let ch = row[q]; if (sea === 1 && F.legs === 'jeans' && si >= 2 && si < nr - 1 && (ch === 'P' || ch === 'p' || ch === 'g')) ch = 'S'; put(hip + j, x0 + q, ch); }
      }
    }
    for (const [r, x, ch] of R.back) put(r + B + dy, x + lean, ch);   /* крылья, хвост, фата — за телом */
    for (let i = 0; i < R.torso.length; i++) for (let x = 0; x < SW; x++) { let c = R.torso[i][x]; if (c !== '.') { if (i === 0 && (sea === 3 || sea === 2) && c === 'n') c = 'Q'; put(10 + i + B + dy, x + lean, c); } }
    /* живот беременной: торс выпирает вперёд на 1–2 точки в нижней половине */
    if (P.belly) {
      const prof = [[0, 1, 1, 0], [1, 1, 2, 1], [1, 2, 2, 1]][Math.min(3, P.belly) - 1];
      for (let q = 0; q < 4; q++) {
        const y = 10 + 3 + q + B + dy, tr = R.torso[3 + q]; if (y < 0 || y >= FH || !tr) continue; const row = out[y]; let ix = -1; for (let x = SW - 1; x >= 0; x--) if (tr[x] !== '.') { ix = x + lean; break; }
        const bump = prof[q]; if (ix < 2 || !bump) continue; const fill = row[ix - 1] === 'k' ? row[ix - 2] : row[ix - 1];
        for (let k = 0; k < bump; k++) put(y, ix + k, fill); put(y, ix + bump, 'k');
      }
    }
    if ((P.sit === 2 || P.sit >= 4) && R.skirt < 5) groundLegs(R, P, put);   /* сидя на земле: ноги перед туловищем, с контуром */
    /* руки */
    const arms = [];
    for (let s = 0; s < 2; s++) {
      const sx = (s ? 9 : 4) + lean, sy = 11 + B + dy, T = s ? P.ar : P.al, a = ik(sx, sy, sx + (s ? T[0] : -T[0]), sy + T[1], s ? 1 : -1);
      a.pts.forEach((p, i) => { const idx = a.pts.length === 1 ? 0 : Math.round(i / (a.pts.length - 1) * 4); let ch = R.armSym[s][idx]; if (sea === 1 && SLEEVED[F.body] && idx >= 2 && ch !== 'k' && !isSkin(ch)) ch = 'S'; put(p[1], p[0], ch); });
      arms.push(a);
    }
    if (P.tool >= 3) {   /* топор, молоток, лопата: рукоять продолжает предплечье */
      const a = arms[1], dx = a.hx - a.ex, dy2 = a.hy - a.ey, d = Math.hypot(dx, dy2) || 1, ux = dx / d, uy = dy2 / d, L = P.tool === 4 ? 2 : 4;
      for (let k = 1; k <= L; k++) put(Math.round(a.hy + uy * k), Math.round(a.hx + ux * k), 'M');
      const tx = a.hx + ux * L, ty = a.hy + uy * L;
      if (P.tool === 3) { put(Math.round(ty - ux), Math.round(tx + uy), 'X'); put(Math.round(ty - ux + uy), Math.round(tx + uy + ux), 'X'); put(Math.round(ty), Math.round(tx), 'x'); }        /* топор: лезвие на одну сторону */
      else if (P.tool === 4) { put(Math.round(ty - ux), Math.round(tx + uy), 'x'); put(Math.round(ty + ux), Math.round(tx - uy), 'x'); put(Math.round(ty), Math.round(tx), 'x'); }                 /* молоток: поперечная головка */
      else { put(Math.round(ty + uy), Math.round(tx + ux), 'X'); put(Math.round(ty + uy - ux), Math.round(tx + ux + uy), 'X'); put(Math.round(ty + uy + ux), Math.round(tx + ux - uy), 'x'); }  /* лопата: штык на конце */
    } else if (P.tool === 1) {   /* кирка в правой руке: рукоять продолжает предплечье, на конце стальная головка */
      const a = arms[1], dx = a.hx - a.ex, dy2 = a.hy - a.ey, d = Math.hypot(dx, dy2) || 1, ux = dx / d, uy = dy2 / d;
      for (let k = 1; k <= 3; k++) put(Math.round(a.hy + uy * k), Math.round(a.hx + ux * k), 'M');
      const tx = a.hx + ux * 3, ty = a.hy + uy * 3; put(Math.round(ty - ux), Math.round(tx + uy), 'X'); put(Math.round(ty + ux), Math.round(tx - uy), 'X'); put(Math.round(ty), Math.round(tx), 'x');
    }
    if (P.tool === 2) {   /* удочка: жердь вперёд-вверх и леска вниз */
      const a = arms[1], hx0 = Math.round(a.hx), hy0 = Math.round(a.hy);
      for (let k = 1; k <= 6; k++) put(hy0 - Math.round(k * .5), hx0 + k, 'M');
      for (let q = 1; q <= 6; q++) put(hy0 - 3 + q, hx0 + 6, 'l');
    }
    /* плед на плечах: укрывает туловище и руки, сверху голова, кисти держат края у груди */
    if (P.blanket) {
      const y0 = 10 + B + dy, y1 = Math.min(FH - 2, 17 + B + dy);
      for (let y = y0; y <= y1; y++) for (let x = 2; x <= 11; x++) {
        if (y === y0 && (x === 2 || x === 11)) continue;
        const edge = y === y1 || x === 2 || x === 11 || (y === y0 && (x === 3 || x === 10));
        put(y, x + lean, edge ? 'k' : ((y - y0) % 3 === 2 || x === 5 || x === 8) ? 'I' : 'H');
      }
      put(y0 + 3, 6 + lean, 'h'); put(y0 + 3, 7 + lean, 'h');
    }
    /* голова */
    const hrows = R.head.map((r) => r.slice()), eyes0 = face(hrows, P, R.noBlink), hdy = P.hdy | 0, hx = (P.hx | 0) + lean, eyes = [];
    for (let i = 0; i < hrows.length; i++) for (let x = 0; x < SW; x++) {
      let c = hrows[i][x]; if (c === '.') continue; const r = i - 3;
      if (sea === 3 && !F.hat && !NOHAT[F.head] && r >= 0 && r <= 3 && (c === 'a' || c === 'b' || c === 'c' || c === 'd')) c = r === 3 ? 'z' : 'Z';
      if ((sea === 3 || sea === 2) && r === 9 && c === 'D') c = 'Q';
      put(r + B + dy + hdy, x + hx, c);
    }
    for (const [r, x] of eyes0) eyes.push([r - 3 + B + dy + hdy, x + hx]);
    for (const [r, x, ch] of R.props) put(r + B + dy, x + lean, ch);
    /* обводка вокруг рук там, где они отошли от тела */
    for (const a of arms) for (const p of a.pts) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = p[0] + ox, y = p[1] + oy; if (x >= 0 && x < SW && y >= 0 && y < FH && out[y][x] === '.') out[y][x] = 'k'; }
    /* кисть передней руки и направление предплечья — для оружия и удочки, которые рисуются поверх */
    const fa = arms[1], s0 = fa.pts[0], fd = Math.hypot(fa.hx - s0[0], fa.hy - s0[1]) || 1;   /* направление руки — от плеча к кисти (предплечье при согнутой руке врёт) */
    return { g: out, eyes, hand: [fa.hx, fa.hy], fore: fd < .6 ? [0, 1] : [(fa.hx - s0[0]) / fd, (fa.hy - s0[1]) / fd] };
  }

  /* ---------- палитры и растр ---------- */
  const palCache = new Map();
  const mul3 = (c, a) => [Math.min(255, Math.round(c[0] * a[0])), Math.min(255, Math.round(c[1] * a[1])), Math.min(255, Math.round(c[2] * a[2]))];
  const WCOL = [[200, 56, 52], [60, 110, 200], [232, 196, 64], [70, 160, 96], [170, 80, 190]];
  const BLANK = [[[168, 60, 56], [226, 196, 120]], [[56, 92, 150], [210, 214, 226]], [[70, 120, 70], [230, 200, 110]], [[120, 70, 130], [236, 190, 200]]];   /* шапка и шарф на холоде */
  function basePal(e, z) {
    const F0 = FORMS[e.form] || FORMS.ref, F = FORMS[wear(e)] || F0, P = Object.assign({}, REF, F.pal || {});   /* палитра — от образа (с рабочей одеждой), женский вариант её не меняет */
    if ((F0.town || e.form === 'belle') && e.form !== 'ref' || (e.form === 'ref' && e.skinV)) { const s = SKIN[skinIdx(e)]; Object.assign(P, { S: s, L: mix(s, [255, 255, 255], .18), D: mul(s, .9), h: mix(s, [255, 240, 220], .25), o: mix(mul(s, .78), [200, 70, 30], .35) }); }
    if (wear(e) === 'belle') { const v = BELLE[(e.seed | 0) % BELLE.length]; P.T = v[0]; P.t = v[1]; Object.assign(P, hairPal(v[2])); P.P = v[3]; P.p = mul(v[3], .75); }
    { const g = Math.max(0, Math.min(1, ((e.age || 0) - 42) / 30)); if (g > 0 && !e.z) for (const k of ['a', 'b', 'c', 'd']) if (P[k]) P[k] = mix(P[k], k === 'a' ? [150, 150, 158] : [206, 206, 214], g * (k === 'd' ? .5 : .9)); }   /* седина с годами */
    { const wc = WCOL[(e.seed || 0) % 5]; P.Z = wc; P.z = mix(wc, [255, 255, 255], .35); P.Q = mul(wc, .85); }
    { const bl = BLANK[(e.seed | 0) % BLANK.length]; P.H = bl[0]; P.I = bl[1]; }   /* свой плед у каждого */
    if (z) {
      const G = [132, 184, 104];
      for (const k in P) if (k !== 'k' && k !== 'eye') P[k] = mul(mix(P[k], [96, 108, 96], .45), .86);
      Object.assign(P, { S: G, L: mix(G, [255, 255, 255], .2), D: mul(G, .85), h: mul(G, .95), m: [96, 34, 40], eye: [220, 44, 36] });
    }
    return P;
  }
  function palette(e, zk, amb, ak) {
    const key = wear(e) + '|' + skinIdx(e) + '|' + zk + '|' + ak + '|' + Math.max(0, Math.min(8, Math.floor(((e.age || 0) - 42) / 4)));
    let P = palCache.get(key); if (P) return P;
    if (zk <= 0) P = basePal(e, false); else if (zk >= 1) P = basePal(e, true);
    else { const a = basePal(e, false), b = basePal(e, true); P = {}; for (const k in a) P[k] = mix(a[k], b[k], zk); }
    if (amb) { const q = {}; for (const k in P) q[k] = (k === 'eye' && zk > 0) ? P[k] : mul3(P[k], amb); P = q; }
    if (palCache.size > 400) palCache.clear();
    palCache.set(key, P); return P;
  }
  const cache = new Map(), WATER = [44, 112, 224];
  const r5 = (v) => Math.round(v * 2) / 2;
  const poseKey = (P) => [P.dy, P.hdy, P.hx, P.lean, P.look, P.blink, P.mouth, r5(P.al[0]), r5(P.al[1]), r5(P.ar[0]), r5(P.ar[1]), P.ll, P.lr, P.dl, P.dr, P.up, P.tool, P.sit | 0, P.belly | 0, P.blanket | 0].join(',');
  function sprite(e, P, burn, flip, sub, amb, ak, zk, char, sea) {
    if (sea === undefined) sea = -1;
    const form = look(e), key = sea + '|' + form + '|' + skinIdx(e) + '|' + poseKey(P) + '|' + burn + '|' + (flip ? 1 : 0) + '|' + sub + '|' + ak + '|' + zk + '|' + char + '|' + Math.max(0, Math.min(8, Math.floor(((e.age || 0) - 42) / 4))) + '|' + (zk >= .5 ? (e.seed || 0) % 11 : '');
    let cv = cache.get(key); if (cv) return cv;
    if (cache.size > 3500) cache.clear();
    const Pal = palette(e, zk, amb, ak), fr = compose(form, P, sea);
    cv = document.createElement('canvas'); cv.width = SW; cv.height = FH;
    const c = cv.getContext('2d'), im = c.createImageData(SW, FH), d = im.data, subRows = Math.min(FH, sub * 2);
    for (let y = 0; y < FH; y++) for (let x = 0; x < SW; x++) {
      const ch = fr.g[y][x]; if (ch === '.') continue;
      let col = Pal[ch] || [255, 0, 255];
      if (ch === 'k' && fr.eyes.some(([ey, ex]) => ey === y && ex === x)) col = Pal.eye;
      if (zk >= .5 && ch !== 'k' && ((x * 7 + y * 13 + (e.seed || 0) * 3) % 11) === 0) col = mul(col, .62);
      if (char === 3) col = ch === 'k' ? [255, 255, 235] : mix(mul(col, .35), [40, 70, 160], .6);   /* просвечивает ток: белые контуры */
      else if (char === 4) col = mix(col, ch === 'k' ? [80, 140, 210] : [190, 230, 255], .7);       /* лёд */
      else if (char === 5) col = mix(col, [110, 230, 70], .5);                                       /* кислота */
      else if (char === 6) col = mix(col, [150, 185, 215], .45);                                     /* утонул: бледный, синеватый */
      else if (char === 7) col = mix(col, [130, 60, 72], .26);                                       /* разбился: синяки */
      else if (char) col = mix(col, [34, 28, 26], char === 2 ? .78 : .5);
      if (burn) col = mix(col, burn === 2 ? [255, 196, 60] : [255, 110, 30], ch === 'k' ? .25 : .5);
      if (subRows && y >= FH - subRows) col = mix(col, WATER, y === FH - subRows ? .3 : .6);
      const tx = flip ? SW - 1 - x : x, o = (y * SW + tx) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    c.putImageData(im, 0, 0);
    cv.hand = [flip ? SW - 1 - fr.hand[0] : fr.hand[0], fr.hand[1]]; cv.fore = [flip ? -fr.fore[0] : fr.fore[0], fr.fore[1]];
    cache.set(key, cv); return cv;
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
    P.dy = run && Math.abs(sA) < .5 ? 1 : 0;   /* шаг без подпрыгивания, покачивание только на бегу */
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
  /* стоит без дела: изредка спокойное действие (медленно, с плавным входом и выходом), без резких дёрганий */
  const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function fidget(e, T, P) {
    const sd = e.seed || 0, LEN = 150, slot = Math.floor((T + sd * 37) / 600), local = (T + sd * 37) % 600 - Math.floor(rnd2(slot, sd + 1) * 400);
    if (local < 0 || local >= LEN) return false;
    const type = Math.floor(rnd2(slot, sd + 2) * 6), k = ease(local / 25) * ease((LEN - local) / 25), rest = [.2, 4];
    if (type === 0) {   /* чешет затылок: рука к голове, пальцы медленно ходят */
      P.ar = lerp2(rest, [1.0, -3.4 + Math.sin(local / 7) * .4], k); P.look = -1; P.hdy = k > .5 ? 1 : 0; P.mouth = 0;
    } else if (type === 1) {   /* потягивается: руки медленно вверх, глаза прикрыты, зевает */
      const up = lerp2(rest, [2.2, -3.2], k); P.al = up; P.ar = up; P.blink = k > .7 ? 1 : 0; P.mouth = k > .7 ? 2 : 0;
    } else if (type === 2) {   /* руки в боки (беременная — гладит живот) */
      const tgt = e.preg > 600 ? [1.8 + Math.sin(local / 14) * .3, 2.2] : [1.4, 1.4]; P.al = lerp2(rest, tgt, k); P.ar = lerp2(rest, tgt, k); P.look = local < 70 ? 0 : 1;
    } else if (type === 3) {   /* осматривается: медленно поворачивает голову */
      P.look = local < 50 ? -1 : local < 100 ? 1 : 0; P.hx = local < 40 ? -1 : (local > 60 && local < 90) ? 1 : 0;
    } else if (type === 4) {   /* скрестил руки */
      P.al = lerp2(rest, [2.0, 1.2], k); P.ar = lerp2(rest, [1.6, 1.0], k); P.mouth = 0;
    } else {   /* переминается с ноги на ногу */
      const st = Math.floor(local / 40) & 1; P.ll = st; P.lr = 1 - st; P.hx = k > .5 ? (st ? 1 : 0) : 0;
    }
    return true;
  }

  /* ---------- позы для дел на месте ---------- */
  const SEAT_ROOM = { drink: 'chair', eat: 'chair', visit: 'chair', read: 'stool', learn: 'stool', study: 'stool', pray: 'pew' };
  function seatOf(e) {
    if (e.dying || e.sleep || e.z || e.fight) return null;
    const t = e.task, doing = e.phase === 'do';
    if (SEAT_ROOM[t] && doing) return e.room ? SEAT_ROOM[t] : 'ground';
    if (t === 'camp' && (doing || !e.goal)) return e.room ? 'stool' : 'ground';
    if (t === 'stars' || t === 'sulk' || (t === 'rest' && e.restSit)) return 'ground';
    if (t === 'mourn' || (t === 'propose' && doing)) return 'kneel';
    if (t === 'bench' && doing) return 'bench';
    if (t === 'sleep' && e.sitT > 0) return 'bed';
    return null;
  }
  function seatPose(e, T, P, st, seat) {
    const sd = e.seed || 0, t = e.task;
    P.sit = seat === 'ground' ? 2 : seat === 'kneel' ? 3 : 1; P.dy = P.sit === 2 ? 4 : 2; P.look = 1;
    if (seat === 'ground') {   /* на земле: по-турецки, обняв колени или вытянув ноги — по характеру и по делу */
      const v = t === 'sulk' ? 5 : t === 'stars' ? 2 : t === 'camp' ? [6, 2, 5, 4][sd % 4] : t === 'rest' ? (sd & 1 ? 6 : 2) : (e.age < 14 || t === 'read' || t === 'learn' || t === 'study') ? 4 : (sd % 3 === 0 ? 4 : 6);
      P.sit = v; P.dy = 5;
      if (v === 6) { P.ar = [2.0, 1.4]; P.al = [-2.6, 2.4]; } else if (v === 4) { P.al = [-1.2, 3.0]; P.ar = [-1.2, 3.0]; } else if (v === 2) { P.al = [1.8, 3.2]; P.ar = [1.4, 3.2]; } else { P.ar = [1.6, 1.2]; P.al = [-3.4, 1.6]; P.hdy = 1; }
    }
    if (seat === 'chair' || seat === 'stool' || seat === 'pew') st.seat = seat;
    P.al = [2.2, 1.8]; P.ar = [2.4, 1.6];   /* руки на коленях */
    P.blink = ((T + sd * 7) % 230) < 7 ? 1 : 0;
    if (t === 'read' || t === 'study' || t === 'learn') { st.hold = 'book'; P.ar = [2.6, .6]; P.al = [2.4, .8]; P.hdy = 1; }
    else if (t === 'drink') { const c = (T + sd * 11) % 110; st.hold = 'mug'; if (c < 26) { P.ar = [1.0, -1.4]; P.blink = 1; } else P.ar = [2.6, .8]; P.mouth = c > 40 && c < 70 ? (T >> 3) & 1 : 0; }
    else if (t === 'eat') { const c = (T + sd * 11) % 56; st.hold = 'food'; if (c < 14) { P.ar = [1.0, -1.2]; P.mouth = 2; } else { P.ar = [2.6, 1.0]; P.mouth = c % 12 < 6 ? 1 : 0; } }
    else if (t === 'visit' || t === 'bench') { const talk = (((T + e.id * 97) >> 7) & 1) === 0 && (t === 'visit' || S0near(e)); if (talk) { P.mouth = (T >> 3) & 1; P.ar = [2.0 + Math.sin(T / 22) * .5, 1.0 + Math.cos(T / 30) * .5]; } }
    else if (t === 'pray') { P.ar = [2.2, .2]; P.al = [2.2, .4]; P.hdy = 1; P.blink = 1; }
    else if (t === 'camp') {
      if (P.sit === 5) { P.ar = [1.6, 1.2]; P.al = [-3.4, 1.6]; P.hdy = 1; P.mouth = 3; }                                   /* обнял колени, смотрит в огонь */
      else if (P.sit === 6 && (sd % 4) === 0 && !e.room) { st.hold = 'stick'; P.ar = [3.4, .2]; P.al = [1.8, 1.6]; P.mouth = 3; }   /* жарит зефир на палочке */
      else { P.ar = [2.8, 1.0]; P.al = [2.6, 1.2]; P.mouth = 3; }                                                            /* греет руки */
    }
    else if (t === 'stars') { P.ar = [-1.6, 3.2]; P.al = [-1.4, 3.2]; P.mouth = 3; }
    else if (t === 'sulk') { P.ar = [1.6, 1.2]; P.al = [-3.4, 1.6]; P.hdy = 1; P.blink = ((T + sd * 5) % 90) < 30 ? 1 : 0; }   /* обхватил колени, голова опущена */
    else if (t === 'mourn') { P.ar = [1.0, -2.6]; P.al = [1.2, -2.4]; P.hdy = 1; P.blink = 1; }
    else if (t === 'propose') { st.hold = 'ring'; P.ar = [3.4, -.8]; P.al = [2.2, 2.4]; P.mouth = 3; }
    else if (t === 'rest') { P.mouth = 3; }
    else if (t === 'sleep') { const y = ((T + sd * 13) % 300) < 40; if (y) { P.ar = [1.0, -1.0]; P.mouth = 2; P.blink = 1; } }
    /* осенью и зимой у костра и под звёздами половина кутается в плед */
    if ((t === 'camp' || t === 'stars') && !e.room && typeof Sky !== 'undefined' && Sky.Y && Sky.Y.season >= 2 && (sd % 2) === 1) { P.blanket = 1; st.hold = null; }
  }
  /* сосед рядом на лавке — тогда болтают */
  function S0near(e) { return typeof Sim !== 'undefined' && Sim.ents.some((o) => o !== e && o.task === 'bench' && o.phase === 'do' && Math.abs(o.x - e.x) < 6); }
  function taskPose(e, T, P, st) {
    const sd = e.seed || 0, t = e.task;
    if (t === 'dance' && e.phase === 'do') {
      const style = (sd + Math.floor(T / 600)) % 4, beat = 26, b = ((T + sd * 7) % beat) / beat, on = b < .5, s = Math.sin(b * 6.2832);
      P.look = 1; P.mouth = 3;
      if (style === 0) { P.al = [2.6 + s * .7, -2.8]; P.ar = [2.6 - s * .7, -2.8]; P.hx = s > 0 ? 1 : 0; P.ll = on ? 1 : 0; P.lr = on ? 0 : 1; }           /* руки вверх, покачивается */
      else if (style === 1) { const clap = b < .22; P.ar = [clap ? 2.2 : 3.2, -1.6]; P.al = [clap ? -1.6 : -.4, -1.6]; P.dy = on ? 0 : 1; P.hdy = P.dy; }   /* хлопки над головой в такт */
      else if (style === 2) { P.al = [2.2 + s * .6, .6]; P.ar = [2.2 - s * .6, .6]; P.dy = on ? 1 : 0; P.hdy = P.dy; P.ll = on ? 1 : 0; P.lr = on ? 0 : 1; }   /* твист */
      else { const up = (Math.floor((T + sd * 7) / beat) & 1) === 1; P.ar = up ? [3.0, -2.6] : [1.0, 2.8]; P.al = [1.4, 1.4]; P.ll = up ? 0 : 1; }      /* диско: рука вверх-вниз */
      return true;
    }
    if (t === 'exercise') {
      const type = (sd + Math.floor(T / 400)) % 3, per = 40, b = ((T + sd * 3) % per) / per, s = Math.sin(b * 6.2832);
      if (type === 0) { const dn = s > 0; P.dy = dn ? 2 : 0; P.hdy = dn ? 1 : 0; P.al = [3.2, .6]; P.ar = [3.2, .6]; }                                      /* приседания */
      else if (type === 1) { const o = s > 0; P.al = o ? [2.6, -2.8] : [.4, 3.8]; P.ar = P.al.slice(); P.dl = o ? 1 : 0; P.dr = o ? 1 : 0; P.up = o ? 1 : 0; } /* «звёздочка» */
      else { const a = b * 6.2832; P.ar = [1.6 + Math.cos(a) * 2, .4 + Math.sin(a) * 3]; P.al = [1.6 - Math.cos(a) * 2, .4 + Math.sin(a) * 3]; }            /* круги руками */
      P.look = 1; P.mouth = 1; return true;
    }
    if (t === 'proposed') {   /* ей делают предложение: сначала ждёт, потом ладони к лицу */
      const pr = e.pid != null && Life.byId(e.pid), kneel = pr && pr.task === 'propose' && pr.phase === 'do';
      if (kneel) { P.ar = [1.0, -2.6]; P.al = [1.2, -2.4]; P.mouth = 2; } else { P.ar = [2.0, .8]; P.al = [2.0, .6]; } P.look = 1; return true;
    }
    if (t === 'rps' && e.rps && e.phase === 'do') {   /* камень-ножницы-бумага: три качания кулаком, потом показывает */
      const loc = (Sim.frame - e.rps.t0) % 100, rnd = Math.floor((Sim.frame - e.rps.t0) / 100);
      if (loc < 0) return false;
      P.look = 1; P.al = [1.6, 1.6];
      if (loc < 54) { P.ar = [2.6, (Math.floor(loc / 18) & 1) ? 1.2 : -.8]; P.mouth = 1; }
      else { P.ar = [3.6, .6]; st.hold = ['rock', 'paper', 'scissors'][e.rps.k[rnd % e.rps.k.length]]; P.mouth = 3; }
      return true;
    }
    if (t === 'flower' && e.phase === 'do') {
      if (!e.hold) { P.dy = 2; P.hdy = 1; P.ar = [3.2, 3.0]; P.al = [1.4, 2.6]; P.look = 1; }   /* присел, тянется к цветку */
      else { P.ar = [1.0, -1.8]; P.al = [.4, 3.6]; P.blink = 1; P.mouth = 3; st.hold = 'flower'; }   /* нюхает */
      return true;
    }
    if (t === 'giveflower' && e.phase === 'do') { P.ar = [3.6, .4]; P.mouth = 3; st.hold = e.hold ? 'flower' : null; P.look = 1; return true; }
    if (t === 'planttree' && e.phase === 'do' && e.plantWater) { const w = Math.sin(T / 9) * .3; P.ar = [3.2, 1.4 + w]; P.al = [2.0, 1.4]; P.look = 1; P.hdy = 1; st.hold = 'can'; return true; }   /* поливает саженец */
    if (t === 'garden' && e.phase === 'do' && e.job && e.job.act === 'water') { const w = Math.sin(T / 9) * .3; P.ar = [3.2, 1.2 + w]; P.al = [2.0, 1.4]; P.look = 1; P.hdy = 1; st.hold = 'can'; return true; }   /* поливает из лейки */
    if (t === 'hunt' && e.aimAt != null && typeof Works !== 'undefined') {   /* целится из лука в птицу: передняя рука с луком к цели, задняя натягивает тетиву */
      const b = Works.birdById(e.aimAt);
      if (b && !b.dead) { const d = e.dir < 0 ? -1 : 1, dx = Math.max(1, (b.x - e.x) * d), dy = b.y - (e.y - 8), a = Math.atan2(dy, dx), c = Math.cos(a), sn = Math.sin(a);
        P.ar = [3.6 * c, 3.6 * sn]; P.al = e.drawT > 0 ? [-1.0, 1.6] : [-2.2 * c + .6, 2.2 * sn + .8]; P.look = 1; P.hdy = 0; st.bow = a; return true; }
    }
    if (t === 'shelter' && e.phase === 'do') { P.ar = [1.6, 1.0]; P.al = [1.8, 1.2]; P.hx = ((T >> 2) & 7) === 0 ? 1 : 0; return true; }   /* обнял себя, ёжится */
    return false;
  }
  /* на руках, на плечах, малыш на руках */
  function carriedPose(e, T, P, st) {
    const id = e.carriedBy != null ? e.carriedBy : e.heldBy != null ? e.heldBy : e.rideOn, c = Life.byId(id); if (!c) return false;
    const d = c.dir < 0 ? -1 : 1, dhC = FH * Life.ageScale(c.age), scE = Life.ageScale(e.age), dhE = FH * scE, dwE = SW * scE;
    if (e.carriedBy != null) {   /* на руках у любимого: лежит поперёк, голова к груди несущего */
      st.rot = d * 1.5708; st.pivot = 'lie'; st.ox = d * 2; st.oy = -Math.round(dhC * .42 - dwE / 2) - 1; P.al = [1.6, 1.0]; P.ar = [1.4, .8]; P.ll = 1; P.lr = 1; P.mouth = 3; P.blink = ((T >> 6) & 3) === 0 ? 1 : 0;
    } else if (e.heldBy != null) {   /* малыш на руках у груди */
      P.sit = 1; P.dy = 2; P.al = [1.6, 1.2]; P.ar = [1.8, .8]; st.ox = d * 4; st.oy = -Math.round(dhC * .36 - dhE * .15); P.look = ((T >> 7) & 1) ? 1 : -1;
    } else {   /* на плечах: сидит, держится за голову; иногда машет */
      P.sit = 1; P.dy = 2; const wv = ((T + e.id * 31) % 400) < 80; P.ar = wv ? [2.6 + Math.sin(T / 8) * .7, -2.8] : [2.4, 1.8]; P.al = [2.2, 2.0]; P.mouth = 3;
      st.ox = -d; st.oy = -Math.round(dhC * .7 - dhE * .15); st.behind = true;   /* у взрослого большая голова: малыш сидит над ней, ноги спрятаны за головой */
    }
    return true;
  }
  /* сальто, кувырок, ползёт (и малыши ползают) */
  function trickPose(e, T, P, st) {
    const d = e.dir < 0 ? -1 : 1, k = e.trick ? e.trick.k : 'crawl', t = e.trick ? e.trick.t : 0, n = e.trick ? e.trick.n : 1;
    if (k === 'flip') { st.rot = -d * 6.2832 * ease(t / n); st.pivot = 'center'; P.al = [2, 1.4]; P.ar = [2, 1.4]; P.ll = 2; P.lr = 2; P.dl = 1; P.dr = 1; P.mouth = 2; return; }
    if (k === 'roll') { st.rot = d * 6.2832 * (t / n); st.pivot = 'center'; st.oy = Math.round(FH * Life.ageScale(e.age) * .2); P.al = [2.4, 1.2]; P.ar = [2.4, 1.2]; P.ll = 2; P.lr = 2; P.hdy = 1; return; }
    /* ползёт на четвереньках: тело горизонтально, руки (в спрайте — «вперёд») смотрят в землю и переставляются */
    const w = Math.sin((e.dist || 0) * 1.4); st.rot = d * 1.5708; st.pivot = 'lie'; st.oy = 3;
    P.ar = [3.6, w * 1.2]; P.al = [3.6, -w * 1.2]; P.ll = w > 0 ? 1 : 0; P.lr = w > 0 ? 0 : 1; P.look = 1;
  }
  /* общее поверх всех поз: несёт кого-то, машет, здоровается за руку, беременность, предмет в руке */
  function animate(e, T) {
    const st = animate0(e, T), P = st.P;
    if (e.dying || e.z) return st;
    if (!st.rot) {
      if (e.carry != null) { const p = Life.byId(e.carry); if (p && p.carriedBy === e.id) { P.al = [2.8, 1.2]; P.ar = [2.8, .8]; } }
      if (e.task === 'carrykid' && e.kidId != null) { const k = Life.byId(e.kidId); if (k && k.heldBy === e.id) { P.al = [2.0, 1.8]; P.ar = [2.4, 1.4]; } else if (k && k.rideOn === e.id) { P.al = [1.0, -1.4]; P.ar = [1.2, -1.6]; } }
      if (e.waveT > 0 && !(e.waveDelay > 0) && !P.sit) { const w = Math.sin(T / 8 + e.id); P.ar = [2.6 + w * .8, -2.8]; if (e.waveTwo) P.al = [2.6 - w * .8, -2.8]; P.mouth = 3; }   /* рука поднята сбоку от головы и качается */
      if (e.greet && e.greet.t > 0 && !e.walk) { P.ar = [3.8, 1.4 + Math.sin(T / 5) * .5]; P.mouth = 3; P.look = 1; }
      if (e.hugT > 0 && e.hugWith != null && !P.sit && !e.walk) {   /* объятия (и поцелуй): шаг навстречу, передняя рука обнимает за спину, задняя — через грудь */
        const p = Life.byId(e.hugWith);
        if (p && p.hugWith === e.id) {
          const dx = p.x - e.x, d = dx > 0 ? 1 : dx < 0 ? -1 : (e.dir < 0 ? -1 : 1), gap = Math.abs(dx) * 2, want = e.kiss ? 7 : 8;
          st.ox = (st.ox || 0) + d * Math.max(0, Math.round((gap - want) / 2));
          P.ar = [3.4, .6]; P.al = [-3.2, .8]; P.look = 1; P.mouth = 3; if (e.kiss) { P.blink = 1; P.hx = 1; P.mouth = 0; }
        }
      }
      if (e.cheerT > 0 && !P.sit && !e.walk && !(e.hugT > 0)) { const j = Math.sin(T / 3.2 + e.id); P.al = [2.2 + j * .5, -3.0]; P.ar = [2.2 - j * .5, -3.0]; P.mouth = 3; P.look = 0; if (j > .4) { P.up = 1; st.oy = (st.oy || 0) - 2; } }   /* радуется: руки вверх, подпрыгивает */
    }
    if (e.preg > 300) P.belly = Math.min(3, 1 + Math.floor(e.preg / 800));
    if (!st.hold && e.hold && !st.rot) st.hold = e.hold.k;
    return st;
  }
  /* ---------- предметы в руке и мебель ---------- */
  const PETAL = [[255, 140, 190], [255, 224, 80], [250, 250, 255], [176, 120, 255], [240, 70, 80], [255, 150, 50], [110, 170, 255], [255, 196, 220]];
  function drawHeld(c, kind, hand, d, e, T) {
    const x = Math.round(hand[0]), y = Math.round(hand[1]), o = '#1a0e0a', P = e._pal || basePal(e, false), skin = 'rgb(' + P.S.join(',') + ')';
    const box = (x0, y0, w, h, col) => { c.fillStyle = o; c.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); c.fillStyle = col; c.fillRect(x0, y0, w, h); };
    if (kind === 'book') { box(x - (d > 0 ? 0 : 4), y - 3, 5, 3, '#f4efe0'); c.fillStyle = '#8a3a2a'; c.fillRect(x - (d > 0 ? 0 : 4), y, 5, 1); c.fillStyle = '#b8a888'; c.fillRect(x - (d > 0 ? -2 : 2), y - 3, 1, 3); }
    else if (kind === 'mug') { box(x - 1, y - 3, 3, 3, '#8a5a32'); c.fillStyle = '#fff6e0'; c.fillRect(x - 1, y - 3, 3, 1); c.fillStyle = o; c.fillRect(x + (d > 0 ? -2 : 2), y - 2, 1, 2); }
    else if (kind === 'food') { box(x - 1, y - 2, 3, 2, '#d8a050'); c.fillStyle = '#a86a28'; c.fillRect(x - 1, y - 1, 3, 1); }
    else if (kind === 'ring') { box(x, y - 2, 2, 2, '#ffd040'); if ((T >> 3) & 1) { c.fillStyle = '#ffffff'; c.fillRect(x + 2, y - 4, 1, 1); c.fillRect(x - 1, y - 3, 1, 1); } }
    else if (kind === 'flower') {
      const col = PETAL[((e.hold && e.hold.c) || 0) % PETAL.length], pc = 'rgb(' + col.join(',') + ')';
      c.fillStyle = '#2f7a34'; c.fillRect(x, y - 4, 1, 4); c.fillStyle = o; c.fillRect(x - 2, y - 8, 5, 3); c.fillRect(x - 1, y - 9, 3, 5);
      c.fillStyle = pc; c.fillRect(x - 1, y - 8, 3, 3); c.fillRect(x, y - 9, 1, 1); c.fillRect(x - 2, y - 7, 1, 1); c.fillRect(x + 2, y - 7, 1, 1); c.fillStyle = '#ffd23a'; c.fillRect(x, y - 7, 1, 1);
    }
    else if (kind === 'veg') { const im = typeof Houses !== 'undefined' && Houses.img('veg_' + (((e.hold && e.hold.c) || 'wheat') === 'pumpkin' ? 'pumpkin' : ((e.hold && e.hold.c) || 'wheat'))); if (im && im.width) c.drawImage(im, x - (im.width >> 1), y - im.height + 2); }   /* урожай в руке */
    else if (kind === 'bird') { c.fillStyle = o; c.fillRect(x - 1, y, 3, 6); c.fillStyle = '#6a4a34'; c.fillRect(x, y + 1, 1, 4); c.fillStyle = '#9a7454'; c.fillRect(x - 1, y + 2, 1, 3); c.fillStyle = '#e0a040'; c.fillRect(x, y + 5, 1, 1); }   /* птица за лапки, головой вниз */
    else if (kind === 'can') {   /* лейка и струйки воды на грядку */
      box(x + (d > 0 ? 0 : -4), y - 2, 4, 3, '#9aa4ae'); c.fillStyle = '#c8d0d8'; c.fillRect(x + (d > 0 ? 0 : -4), y - 2, 4, 1); c.fillStyle = o; for (let k = 1; k <= 3; k++) c.fillRect(x + d * (3 + k), y - 1 - k, 1, 1);
      c.fillStyle = 'rgba(120,190,255,.85)'; for (let k = 0; k < 4; k++) { const f = ((T + k * 5) % 20) / 20; c.fillRect(Math.round(x + d * (7 + f * 3)), Math.round(y - 4 + f * 14), 1, 2); }
    }
    else if (kind === 'stick') {   /* палочка с зефиром над костром: зефир подрумянивается */
      c.fillStyle = '#5a3a1e'; for (let k = 1; k <= 9; k++) c.fillRect(x + d * k, y - Math.round(k * .45), 1, 1);
      const tx = x + d * 10 - (d < 0 ? 1 : 0), ty = y - 6, ph = ((T + ((e.seed | 0) * 37)) % 720) / 720, col = ph < .45 ? '#fffaf0' : ph < .8 ? '#ecc070' : '#a8743e';
      c.fillStyle = o; c.fillRect(tx - 1, ty - 1, 4, 4); c.fillStyle = col; c.fillRect(tx, ty, 2, 2);
    }
    else if (kind === 'rock') box(x + (d > 0 ? 0 : -2), y - 1, 3, 3, skin);
    else if (kind === 'paper') { box(x + (d > 0 ? 0 : -4), y, 5, 1, skin); }
    else if (kind === 'scissors') { c.fillStyle = o; for (let k = 0; k < 4; k++) { c.fillRect(x + d * k, y - k - 1, 2, 2); c.fillRect(x + d * k, y + k - 1, 2, 2); } c.fillStyle = skin; for (let k = 0; k < 4; k++) { c.fillRect(x + d * k, y - k, 1, 1); c.fillRect(x + d * k, y + k, 1, 1); } }
  }
  function drawSeat(c, kind, cx, fy, d, kx) {
    const sy = fy - Math.max(2, Math.round(3 * kx)), o = '#24140c', w = '#8a5a32', hi = '#a8743e', x0 = cx + d * 1;
    const W2 = kind === 'pew' ? 7 : 4;
    c.fillStyle = o; c.fillRect(x0 - W2 - 1, sy - 1, W2 * 2 + 3, 3); c.fillRect(x0 - W2, sy + 1, 2, fy - sy - 1); c.fillRect(x0 + W2 - 1, sy + 1, 2, fy - sy - 1);
    c.fillStyle = w; c.fillRect(x0 - W2, sy, W2 * 2 + 1, 1); c.fillStyle = hi; c.fillRect(x0 - W2, sy - 1 + 1, W2, 1);
    if (kind === 'chair' || kind === 'pew') { const bx = cx - d * 4; c.fillStyle = o; c.fillRect(bx - 1, sy - 10, 3, 11); c.fillStyle = w; c.fillRect(bx, sy - 9, 1, 9); }
  }
  /* предмет, над которым работают: колода с поленом (щепки при ударе), верстак с доской, верстак с клинком (искры) */
  function drawProp(c, st, cx, fy, dh, d, T, e) {
    const o = '#24140c', r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
    if (st.prop === 'stump') {
      const x0 = d > 0 ? cx + 6 : cx - 13;
      r(x0 - 1, fy - 5, 9, 6, o); r(x0, fy - 4, 7, 4, '#7a5030'); r(x0, fy - 4, 7, 1, '#c89860'); r(x0 + 2, fy - 4, 1, 1, '#a07040');   /* колода */
      r(x0 + 1, fy - 9, 5, 5, o); r(x0 + 2, fy - 8, 3, 3, '#b07a48'); r(x0 + 3, fy - 8, 1, 3, '#e8c890');                          /* полено */
      if (st.hitNow) for (let k = 0; k < 3; k++) r(x0 + 3 + (k - 1) * 3 + ((T + k) % 3) - 1, fy - 11 - ((T * (k + 1)) % 4), 1, 1, '#e8c890');   /* щепки */
    } else {
      const x0 = d > 0 ? cx + 5 : cx - 14, top = fy - Math.round(dh * .34);
      r(x0 - 1, top - 1, 11, 3, o); r(x0, top, 9, 1, '#a8743e'); r(x0 + 1, top + 2, 2, fy - top - 2, o); r(x0 + 6, top + 2, 2, fy - top - 2, o);   /* верстак */
      if (st.prop === 'forge') { r(x0 + 1, top - 3, 7, 2, o); r(x0 + 2, top - 2, 5, 1, '#c8ccd8'); if (st.hitNow) { r(x0 + 4, top - 5, 1, 1, '#ffe070'); r(x0 + 6, top - 6, 1, 1, '#ff9a40'); r(x0 + 2, top - 5, 1, 1, '#fff6c0'); } }   /* клинок, искры */
      else { r(x0 + 1, top - 3, 7, 2, o); r(x0 + 2, top - 2, 5, 1, '#d8a868'); if (st.hitNow) r(x0 + 4, top - 4, 1, 1, '#f0e0b0'); }   /* доска, стружка */
    }
  }
  /* рабочие движения: медленный замах, быстрый удар, короткая пауза */
  const ACT_OF = { sow: 'hoe', chop: 'chop', quarry: 'pick', shaft: 'pick', house: 'hammer', repair: 'hammer', build: 'hammer', dockwork: 'hammer', rod: 'hammer', forage: 'gather', bury: 'shovel', fire: 'kneel', arm: 'craft', craft: 'craft', work: 'split', garden: 'hoe' };
  function strike(ph, wind) { return ph < wind ? ease(ph / wind) : ph < wind + .12 ? 1 - ease((ph - wind) / .12) : 0; }   /* 0 — замах, 1 — удар; возвращает «поднятость» */
  function workPose(e, T, P, st) {
    const sd = e.seed || 0, kind = ACT_OF[e.task] || 'pick';
    const per = { chop: 44, pick: 40, hammer: 18, gather: 56, shovel: 46, kneel: 30, craft: 22, hoe: 42, split: 50 }[kind], ph = ((T + sd * 5) % per) / per;
    P.look = 1;
    if (e.task === 'craft' || e.task === 'arm') st.prop = e.task === 'arm' ? 'forge' : 'bench';   /* видно, над чем работает: верстак с заготовкой */
    if (kind === 'split') {   /* колет дрова: топор из-за головы вниз в полено на колоде */
      const u = strike(ph, .6), a = lerp2([3.4, 2.2], [.8, -3.4], u); P.ar = a; P.al = [a[0] - .3, a[1] + .5]; st.tool = 'axe'; st.prop = 'stump'; st.hitNow = ph > .7 && ph < .84; P.dy = ph > .7 && ph < .8 ? 1 : 0; P.hdy = 1;
    } else if (kind === 'chop') {   /* топор: замах назад на уровне плеча, удар вперёд по стволу, обеими руками */
      const u = strike(ph, .62), a = lerp2([3.6, 1.0], [-.8, -.6], u); P.ar = a; P.al = [a[0] + .6, a[1] + .4]; P.lean = u < .3 ? 1 : 0; st.tool = 'axe'; P.dy = u < .1 ? 1 : 0;
    } else if (kind === 'pick') {   /* кирка: из-за головы вниз-вперёд */
      const u = strike(ph, .6), a = lerp2([3.2, 2.8], [.2, -3.6], u); P.ar = a; P.al = [a[0] * .8 + .4, a[1] * .8 + .6]; P.lean = u < .3 ? 1 : 0; st.tool = 'pick'; P.dy = u < .1 ? 1 : 0; P.hdy = u < .3 ? 1 : 0;
    } else if (kind === 'hammer' || kind === 'craft') {   /* молоток: короткие частые удары; другой рукой придерживает */
      const u = strike(ph, .55), lo = kind === 'craft' ? 1.2 : 0, a = lerp2([2.8, 1.4 + lo], [2.0, -.6 + lo], u); P.ar = a; P.al = [2.8, 1.6 + lo]; st.tool = 'hammer'; P.hdy = 1; P.dy = kind === 'craft' ? 1 : 0; st.hitNow = ph > .65 && ph < .8;
    } else if (kind === 'gather') {   /* ягоды: тянется к кусту, срывает и складывает к себе */
      const reach = ph < .45 ? ease(ph / .45) : 1 - ease((ph - .45) / .35); P.ar = lerp2([1.2, 2.4], [3.6, 1.6], reach); P.al = [1.4, 2.6]; P.dy = reach > .5 ? 1 : 0; P.hdy = 1;
    } else if (kind === 'hoe') {   /* мотыга: наклонился, поднимает и рыхлит землю перед собой */
      const u = strike(ph, .58), a = lerp2([3.4, 2.6], [1.6, -.8], u); P.ar = a; P.al = [a[0] - .4, a[1] + .6]; st.tool = 'hoe'; P.lean = 1; P.dy = 1; P.hdy = 1;
    } else if (kind === 'shovel') {   /* лопата: вонзает вниз и откидывает землю */
      const u = strike(ph, .55), a = lerp2([3.0, 3.4], [2.0, .2], u); P.ar = a; P.al = [a[0] - .6, a[1] - .4]; st.tool = 'shovel'; P.dy = 1 - Math.round(u); P.lean = 1;
    } else {   /* костёр: присел, руки у земли, медленно раздувает/подкладывает */
      P.dy = 2; P.hdy = 1; const w = Math.sin(ph * 6.283) * .4; P.ar = [2.8 + w, 3.4]; P.al = [2.4 - w, 3.4]; P.dl = 1; P.dr = 1;
    }
  }
  const DUR = Sim.ENT_DUR, KEEP = Sim.ENT_KEEP;
  /* выбор позы по состоянию из симуляции */
  function animate0(e, T) {
    const sd = e.seed || 0, P = pose({}), st = { P, burn: 0, char: 0, rot: 0, alpha: 1, sub: Math.min(12, e.sub | 0), zk: e.z ? 1 : 0, pivot: 'feet' };
    const px = e.px === undefined ? e.x : e.px; e.dist = (e.dist || 0) + Math.abs(e.x - px); e.px = e.x;
    const blink = ((T + sd * 7) % 230) < 7, dir = e.dir < 0 ? -1 : 1, flame = 1 + ((T >> 1) & 1);
    if (e.z && e.turn > 0) st.zk = Math.round((1 - e.turn / 45) * 4) / 4;
    if (e.dying) {
      const dt = e.dt | 0, k = e.dying, dur = DUR[k] || 40, keep = !!KEEP[k], jt = ((T >> 1) & 1) ? 1 : -1;
      P.al = [2.2, 3]; P.ar = [2.2, 3]; P.dl = 1; P.dr = 1; P.hdy = 1; P.blink = 1;
      if (k === 'burn') {
        if (dt < 7) { const w = T / 2.5; P.al = [2.6 + Math.sin(w) * .8, -1.8 + Math.cos(w) * 1.2]; P.ar = [2.6 + Math.cos(w) * .8, -1.8 + Math.sin(w) * 1.2]; P.mouth = 2; P.blink = 0; }
        else { P.dy = Math.min(2, Math.floor((dt - 7) / 3)); P.al = [1.4, 2.4]; P.ar = [1.4, 2.4]; }
        st.burn = dt > 20 ? 0 : flame; st.char = dt > 12 ? 2 : 1;
        const p = clamp01((dt - 7) / 16); st.rot = -dir * p * p * (3 - 2 * p) * 1.5;
      } else if (k === 'drown') {
        P.al = [2.4, -1.6 + Math.sin(T / 5) * .8]; P.ar = [2.4, -1.6 + Math.cos(T / 5) * .8]; P.mouth = 1; P.up = 1; P.dy = -1; P.blink = 0;
        st.rot = -dir * Math.min(1.5, dt / 28); st.pivot = 'center';
        if (dt > 36) { P.al = [2.2, 3]; P.ar = [2.2, 3]; P.up = 0; P.dy = 0; }
      } else if (k === 'shock') {   /* пляска под током: контуры вспыхивают, потом падает чёрным */
        if (dt < 34) { P.al = [3.2, -2.2 + jt * .6]; P.ar = [3.2, -2.2 - jt * .6]; P.hx = jt; P.mouth = 2; P.blink = 0; P.hdy = 0; P.dy = 0; P.ll = 1; P.lr = 1; P.dl = 1; P.dr = 1; st.char = ((T >> 1) & 1) ? 3 : 0; }
        else { const p = clamp01((dt - 34) / 14); st.rot = -dir * p * p * (3 - 2 * p) * 1.5708; st.char = 2; }
        st.lift = true;
      } else if (k === 'melt') {   /* тает сверху вниз зелёной лужей */
        P.al = [2.6 + Math.sin(T / 2) * .8, -1.6]; P.ar = [2.6 + Math.cos(T / 2) * .8, -1.6]; P.mouth = 2; P.blink = 0; P.hdy = 0; st.char = 5; st.melt = Math.min(.55, clamp01(dt / (dur - 6)));
      } else if (k === 'freeze') {   /* дрожит, синеет и застывает ледяной статуей */
        P.al = [1.2, 2.4]; P.ar = [1.2, 2.4]; P.hdy = 0; P.hx = dt < 24 ? jt : 0; P.blink = 0; P.mouth = 2; P.dl = 0; P.dr = 0; P.dy = 0; st.char = dt > 5 ? 4 : 0;
      } else if (k === 'old') {   /* тихо ложится */
        const p = clamp01(dt / 46); P.al = [1.2, 2.2]; P.ar = [1.2, 2.2]; P.mouth = 0; st.rot = -dir * p * p * (3 - 2 * p) * 1.5708; st.lift = true;
      } else {
        const spin = k === 'blast' && dt < 22, p = clamp01(dt / (spin ? 22 : 16)), ease = p * p * (3 - 2 * p);
        st.rot = -dir * (spin ? ease * (1.5708 + 6.2832) : ease * 1.5708); st.lift = true;
        if (dt < 10) { const w = T / 2; P.al = [2.8 + Math.sin(w) * .6, -1.5 + Math.cos(w)]; P.ar = [2.8 + Math.cos(w) * .6, -1.5 + Math.sin(w)]; P.mouth = 2; P.blink = 0; }
        if (k === 'blast' && dt > 10) st.char = 1;
        if (k === 'crush') st.squash = clamp01(dt / 10);
      }
      /* тело остаётся: на нём видно, от чего умер; огонь обугливает, кислота съедает */
      if (k === 'drown' && dt > 36) st.char = 6; else if ((k === 'fall' || k === 'crush') && dt > 10) st.char = 7;
      if (e.charred) { st.char = 2; st.burn = e.bburn > 0 && ((T >> 2) & 1) && e.bburn % 30 < 25 ? flame : 0; }
      if (e.acid) st.melt = Math.max(st.melt || 0, Math.min(1, .3 + e.acid / 160));
      return st;
    }
    if (e.carriedBy != null || e.heldBy != null || e.rideOn != null) { if (carriedPose(e, T, P, st)) return st; }
    if (e.shock > 0) { const jt = ((T >> 1) & 1) ? 1 : -1; P.al = [3.2, -2.2 + jt * .6]; P.ar = [3.2, -2.2 - jt * .6]; P.hx = jt; P.mouth = 2; P.blink = 0; P.ll = 1; P.lr = 1; P.dl = 1; P.dr = 1; st.char = ((T >> 1) & 1) ? 3 : 0; return st; }
    if (e.chill > 8) { P.al = [1.2, 2.2]; P.ar = [1.2, 2.2]; P.hx = ((T >> 1) & 1) ? 1 : -1; P.dy = 1; P.mouth = 2; P.look = 1; return st; }
    if (e.turn > 0) {   /* заражение: судороги */
      const f = T >> 1, r1 = rnd2(f, sd), r2 = rnd2(f, sd + 5), r3 = rnd2(f, sd + 9);
      P.hx = r1 < .33 ? -1 : r1 > .66 ? 1 : 0; P.al = [1.5 + 2 * r2, -1 + 4 * r3]; P.ar = [1.5 + 2 * r3, -1 + 4 * r1]; P.dy = f & 1 ? 0 : 1; P.mouth = 2; P.ll = r2 > .6 ? 1 : 0; P.lr = r3 > .6 ? 1 : 0;
      return st;
    }
    if (e.sleep) { P.blink = 1; P.al = [2, 3.4]; P.ar = [2, 3.4]; P.dl = 1; P.dr = 1; P.hdy = 1; st.rot = -dir * 1.5708; st.pivot = 'lie'; return st; }
    if (e.ko > 0 && !e.swim && !e.z) {   /* нокдаун: лежит на спине, потом садится и трясёт головой; над головой кружат звёздочки */
      st.dizzy = true;
      if (e.ko > 28 || e.air) { P.al = [2.8, 1.0]; P.ar = [3.0, .2]; P.blink = 1; P.mouth = 2; P.ll = 1; P.dl = 1; st.rot = -dir * 1.5708; st.pivot = 'lie'; }
      else { P.sit = 2; P.dy = 5; P.al = [-1.0, 3.2]; P.ar = [1.0, -2.6]; P.hx = ((T >> 3) & 1) ? 1 : -1; P.blink = ((T >> 2) & 3) === 0 ? 1 : 0; P.mouth = 2; }
      return st;
    }
    if (e.hurt > 6) { if (!e.z && !e.air) { st.rot = (e.dir < 0 ? -1 : 1) * (e.hurt > 12 ? .28 : .12); } P.dy = 1; P.hdy = 1; P.lean = e.hurt > 12 ? 1 : 0; P.al = [1.4, 3.4]; P.ar = [1.8, 3.2]; P.mouth = 2; P.blink = e.hurt > 12 ? 1 : 0; if (e.burn > 0) st.burn = flame; return st; }   /* удар в живот: сгибается, держится за живот */
    if ((e.trick && e.trick.k !== 'sprint') || (e.age < 1.5 && e.walk && !e.swim && !e.air)) { trickPose(e, T, P, st); return st; }
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
    if (e.act === 'cpr') { const pr = ((T + sd * 3) % 16) < 6; P.sit = 3; P.dy = 2 + (pr ? 1 : 0); P.hdy = 1; P.ar = [3.0, 3.4]; P.al = [-1.2, 3.6]; P.look = 1; P.mouth = pr ? 0 : 1; return st; }   /* на коленях, ритмично давит на грудь */
    if (e.act === 'seed') { P.dy = 2; P.hdy = 1; P.ar = [.8, 3.6]; P.al = [.4, 3.2]; P.look = 1; return st; }
    if (e.act === 'fish') { P.ar = [3.6, 2.2]; P.al = [.4, 3.4]; P.look = 1; P.dy = 1; P.hdy = 1; return st; }   /* набирает воду */
    if (e.act === 'rod') {   /* рыбачит: удилище держит двумя руками (само удилище — на слое, см. drawFishing) */
      const f = e.fsh || { ph: 'wait', t: 0 };
      if (e.dockSit && e.task === 'fish') { P.sit = 1; P.dy = 2; st.oy = Math.round(4 * Life.ageScale(e.age)); }   /* на краю причала: сидит, ноги свешены над водой */
      if (f.ph === 'cast') { const k = f.t < 14 ? 0 : 1; P.ar = k ? [3.4, .2] : [-.6, -2.6]; P.al = k ? [2.8, .8] : [.2, -1.4]; P.lean = k; P.look = 1; }
      else if (f.ph === 'pull') { P.ar = [1.6, -1.6]; P.al = [1.2, -.6]; P.lean = 0; P.look = 1; P.mouth = 3; P.hdy = 0; }
      else if (f.ph === 'show') { if (f.got) { P.ar = [1.4, -2.6]; P.al = [2.6, 1.2]; P.mouth = 3; } else { P.ar = [2.2, 1.4]; P.al = [1.8, 1.8]; P.mouth = 2; P.hdy = 1; } P.look = 0; }
      else { P.ar = [2.8, .9]; P.al = [2.2, 1.4]; P.look = 1; if (f.ph === 'bite') { P.mouth = 2; P.hx = (T >> 1) & 1; } }
      return st;
    }
    /* драка: стойка с кулаками у лица, удары попеременно в живот */
    if (e.task === 'fight' && e.fight && !e.z && (!e.walk || e.atk > 0)) {
      const W0 = !e.weapon; P.look = 1; P.hdy = ((T + sd * 5) >> 4) & 1;
      if (e.atk > 0 && W0) {
        /* бьющая рука — передняя; в спрайте она прижата у плеча, а вытянутую руку с кулаком рисует drawPunches от этого же плеча */
        P.ar = e.atk > 4 ? [.5, .6] : [2.2, .4]; P.al = [2.0, .2]; P.lean = 1; P.mouth = 1; P.ll = e.pside ? 0 : 1; P.dl = 0;
      } else if (W0) { P.ar = [2.2, .4]; P.al = [2.0, .0]; P.ll = ((T + sd) >> 5) & 1; }
      return st;
    }
    if (e.act === 'dig') { workPose(e, T, P, st); return st; }
    if (!e.walk && !e.swim && !e.air) { const seat = seatOf(e); if (seat) { seatPose(e, T, P, st, seat); return st; } if (taskPose(e, T, P, st)) return st; }
    if (e.walk && !e.swim) {
      const run = (e.fear > 0 || e.hurry || (e.trick && e.trick.k === 'sprint')) && !e.z, stride = e.z ? 2.2 : run ? 3.4 : 2.8;
      gait(P, e.dist / (stride * Math.pow(Math.max(1, spf), .7)) + sd * .13, run, e.z);
      if (e.z && e.atk > 0) { P.dy = 1; P.hdy = 1; P.hx = 1; P.al = [.2, 1.2]; P.ar = [.2, 1.2]; P.mouth = 2; }
      if (run) P.mouth = 2;
      return st;
    }
    /* стоит: разговор, у костра */
    if (e.task === 'chat' && e.chatWith != null && !e.walk) { const talk = (((T + e.id * 97) >> 7) & 1) === 0; P.look = 1; if (talk) { P.mouth = (T >> 3) & 1; P.ar = [2.0 + Math.sin(T / 22) * .5, 1.4 + Math.cos(T / 30) * .6]; } else { P.mouth = 0; P.al = [1.4, 1.4]; P.hdy = (T >> 6) & 1; } return st; }   /* говорят по очереди, жесты медленные */
    if (false && e.task === 'camp' && !e.walk) { P.look = 1; P.al = [1.2, 2.2]; P.ar = [1.2, 2.2]; P.blink = ((T + sd * 7) % 230) < 7 ? 1 : 0; P.mouth = 3; return st; }
    /* стоит */
    const br = ((T + sd * 13) % 160) < 64; P.hdy = br ? 1 : 0; P.blink = blink && !e.z ? 1 : 0;
    const slot = Math.floor((T + sd * 3) / 90), r = rnd2(slot, sd); P.look = r < .22 ? -1 : r > .78 ? 1 : 0;
    if (e.z) { P.hdy = 1; P.hx = [0, 1, 0, -1][(T >> 5) & 3]; P.al = [.8, 3 + Math.sin(T / 20) * .5]; P.ar = [.8, 3 + Math.cos(T / 20) * .5]; P.mouth = ((T >> 6) & 1) ? 1 : 0; P.dy = 1; P.look = 0; if (e.atk > 0) { P.al = [.2, 1.2]; P.ar = [.2, 1.2]; P.mouth = 2; } return st; }
    if (e.fear > 0) { P.al = [2, 1]; P.ar = [2, 1]; P.mouth = 2; P.look = 1; return st; }
    fidget(e, T, P);
    return st;
  }

  /* удочка, леска, поплавок и рыба на слое людей (2 точки на клетку) */
  function px1(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
  function drawFishing(c, e, cx, fy, dh, T, hand) {
    const f = e.fsh, d = e.dir < 0 ? -1 : 1, hx = hand ? Math.round(hand[0]) : cx + d * 5, hy = hand ? Math.round(hand[1]) : fy - Math.round(dh * .5);
    /* кончик удилища */
    let ang;   /* угол от горизонтали вверх */
    if (f.ph === 'cast') ang = f.t < 14 ? 2.3 - f.t * .04 : Math.max(.45, 1.9 - (f.t - 14) * .14);
    else if (f.ph === 'pull') ang = .5 + Math.min(.8, f.t * .07);
    else if (f.ph === 'show') ang = f.got ? 1.3 : .7;
    else if (f.ph === 'bite') ang = .3 + ((T >> 1) & 1) * .12;
    else ang = .55 + Math.sin(T / 40 + e.id) * .04;
    const L = 22, tx = hx + d * Math.cos(ang) * L, ty = hy - Math.sin(ang) * L;
    /* удилище: тёмный контур и светлое дерево, к концу тоньше; при поклёвке и подсечке гнётся */
    const bend = f.ph === 'bite' || f.ph === 'pull' ? 3 : 0;
    for (let k = 0; k <= L; k++) { const t = k / L, x = hx + (tx - hx) * t, y = hy + (ty - hy) * t + bend * t * t; px1(c, x - (t < .5 ? 1 : 0), y - 1, t < .5 ? 3 : 2, 2, '#22140e'); px1(c, x, y - (t < .5 ? 1 : 0), 1, 1, t < .35 ? '#8a5a32' : '#c89a5a'); }
    const ex = tx, ey = ty + bend;
    /* поплавок на воде */
    /* поверхность воды под поплавком — каждый кадр (вода и сам рыбак могли сдвинуться) */
    { const S0 = typeof Sim !== 'undefined' ? Sim : null; if (S0 && S0.A && f.bx != null) { let y = Math.max(2, Math.round(e.y) - 12); while (y < S0.H - 2 && (S0.A.type[y * S0.W + f.bx] === E.AIR || KIND[S0.A.type[y * S0.W + f.bx]] === K.GAS)) y++; const t = S0.A.type[y * S0.W + f.bx]; if (t === E.WATER || t === E.BRINE) f.by = y; } }
    const fx = f.bx * 2 + 1, wy = f.by * 2;
    let bx = fx, by = wy - 1, under = false;
    if (f.ph === 'cast') { const k = Math.max(0, (f.t - 14) / 20); bx = ex + (fx - ex) * k; by = ey + (wy - 1 - ey) * k - Math.sin(k * Math.PI) * 18; if (f.t < 14) { bx = ex; by = ey + 4; } }
    else if (f.ph === 'wait') by = wy - 1 + Math.round(Math.sin(T / 9 + e.id) * .8);
    else if (f.ph === 'bite') { under = ((f.t >> 2) & 1) === 1; by = wy + (under ? 2 : 0); }
    /* рыба на леске при подсечке и в руке потом */
    let fishX = null, fishY = null;
    if (f.ph === 'pull') { const k = Math.min(1, f.t / 22); if (f.got) { fishX = fx + (ex - fx) * k; fishY = wy - Math.sin(k * Math.PI) * 26 + (ey + 6 - wy) * k; bx = fishX; by = fishY - 3; } else { bx = fx + (ex - fx) * k; by = wy - Math.sin(k * Math.PI) * 20 + (ey + 6 - wy) * k; } }
    else if (f.ph === 'show') { if (f.got) { fishX = hx - d * 2; fishY = hy - 16; bx = fishX; by = fishY - 3; } else { bx = ex; by = ey + 8; } }
    /* леска: провисает, к поплавку */
    const sag = f.ph === 'wait' ? 6 : f.ph === 'bite' ? 1 : 3, n = Math.max(6, Math.round(Math.hypot(bx - ex, by - ey) / 2));
    c.fillStyle = 'rgba(236,240,246,.85)';
    for (let k = 0; k <= n; k++) { const t = k / n, x = ex + (bx - ex) * t, y = ey + (by - ey) * t + Math.sin(t * Math.PI) * sag; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
    if (f.ph !== 'show' || !f.got) {
      if (!under) { px1(c, bx - 1, by - 2, 3, 4, '#22140e'); px1(c, bx, by - 1, 1, 1, '#ff3a30'); px1(c, bx, by, 1, 1, '#ffffff'); }
      if (f.ph === 'wait' && ((T >> 5) & 1)) { px1(c, fx - 3, wy + 1, 2, 1, 'rgba(255,255,255,.5)'); px1(c, fx + 2, wy + 1, 2, 1, 'rgba(255,255,255,.5)'); }   /* круги на воде */
      if (f.ph === 'bite') { const r = 2 + (f.t % 8); px1(c, fx - r, wy, 2, 1, '#e8f6ff'); px1(c, fx + r - 1, wy, 2, 1, '#e8f6ff'); if (under) { px1(c, fx - 1, wy - 3, 1, 2, '#e8f6ff'); px1(c, fx + 1, wy - 4, 1, 2, '#e8f6ff'); } }
    }
    if (f.ph === 'pull' && f.t < 6) for (let q = 0; q < 5; q++) px1(c, fx - 4 + q * 2, wy - 2 - ((q * 3 + f.t) % 5), 1, 2, '#e8f6ff');   /* брызги */
    if (fishX != null) {   /* рыба: серебристая, бьёт хвостом */
      /* висит на крючке головой вверх и бьёт хвостом: тело-веретено, хвост, глаз */
      const fl = (T >> 2) & 1 ? 1 : -1, X = Math.round(fishX), Y = Math.round(fishY), L = f.big ? 9 : 7;
      const body = f.big ? '#d8a040' : '#a8bccc', top = f.big ? '#a86a28' : '#6a8aa4', belly = f.big ? '#ffe0a0' : '#eef4f8';
      for (let k = 0; k < L; k++) { const w = k < 2 ? 1 : k > L - 3 ? 1 : 2, x = X + (k > L - 3 ? fl * (k - L + 3) : 0); px1(c, x - w, Y + k, w * 2 + 1, 1, '#22140e'); if (w > 1) { px1(c, x - 1, Y + k, 1, 1, top); px1(c, x, Y + k, 1, 1, body); px1(c, x + 1, Y + k, 1, 1, belly); } else px1(c, x, Y + k, 1, 1, body); }
      px1(c, X + fl * 2 - 2, Y + L, 5, 1, '#22140e'); px1(c, X + fl * 2 - 1, Y + L - 1, 3, 1, top);   /* хвост */
      px1(c, X + 1, Y + 1, 1, 1, '#000');   /* глаз */
    }
  }
  /* вспышка удара на месте попадания (живот), плюс отлетающие капли пота */
  function drawHit(c, e, cx, fy, dh, t) {
    const d = e.hitD || 1, x = cx - d * 4, y = fy - Math.round(dh * .42), r = t < 3 ? 5 + t * 2 : Math.max(0, 11 - (t - 3) * 1.4);
    if (r <= 0) return;
    c.globalAlpha = .3;
    /* звезда удара: тёмный контур, жёлто-белые лучи, белая середина */
    const ray = (col, w) => { c.fillStyle = col; for (let a = 0; a < 8; a++) { const ca = Math.cos(a * .785 + .2), sa = Math.sin(a * .785 + .2), L = a & 1 ? r * .55 : r; for (let k = 2; k <= L; k++) c.fillRect(Math.round(x + ca * k) - (w >> 1), Math.round(y + sa * k) - (w >> 1), w, w); } };
    ray('#2a140e', 3); ray(t < 4 ? '#ffffff' : '#ffd23a', 1);
    c.fillStyle = '#2a140e'; c.fillRect(x - 3, y - 3, 7, 7); c.fillStyle = t < 4 ? '#ffffff' : '#ffe680'; c.fillRect(x - 2, y - 2, 5, 5); c.fillStyle = '#ff8a2a'; if (t >= 4) c.fillRect(x - 1, y - 1, 3, 3);
    /* капли пота отлетают назад */
    c.globalAlpha = 1; c.fillStyle = 'rgba(190,225,255,.6)'; for (let q = 0; q < 3; q++) c.fillRect(Math.round(cx + d * (3 + t * (.8 + q * .4))), Math.round(fy - dh * .82 - t * (1.2 + q * .5) + t * t * .15), 2, 2);
  }
  /* рабочий инструмент в кисти, на слое людей: рукоять продолжает предплечье, тёмный контур */
  function drawTool(c, kind, hand, fore) {
    const L = { axe: 8, pick: 8, hammer: 5, shovel: 9, hoe: 10 }[kind], ux = fore[0], uy = fore[1], px = -uy, py = ux;   /* вдоль и поперёк рукояти */
    const hx = hand[0], hy = hand[1], pts = [], head = [];
    for (let t = -1; t <= L; t++) pts.push([hx + ux * t, hy + uy * t]);
    const ex = hx + ux * L, ey = hy + uy * L, add = (a, b, col) => head.push([ex + ux * a + px * b, ey + uy * a + py * b, col]);
    if (kind === 'axe') { for (let a = -2; a <= 1; a++) for (let b = 1; b <= 3; b++) add(a, b, b === 3 ? '#eef2f6' : '#a8b0bc'); }
    else if (kind === 'pick') { for (let b = -4; b <= 4; b++) add(Math.abs(b) > 2 ? -1 : 0, b, Math.abs(b) > 3 ? '#eef2f6' : '#9aa2ae'); }
    else if (kind === 'hoe') { for (let b = 0; b <= 3; b++) add(0, b, b === 3 ? '#d8dee6' : '#8a929e'); add(1, 3, '#8a929e'); }
    else if (kind === 'hammer') { for (let a = -1; a <= 0; a++) for (let b = -2; b <= 2; b++) add(a, b, '#8a929e'); }
    else { for (let a = 1; a <= 4; a++) for (let b = -1; b <= 1; b++) add(a, b, a === 4 ? '#d8dee6' : '#9aa2ae'); }
    const R = (v) => Math.round(v);
    c.fillStyle = 'rgba(26,14,10,.9)'; for (const [x, y] of pts) c.fillRect(R(x) - 1, R(y) - 1, 3, 3); for (const [x, y] of head) c.fillRect(R(x) - 1, R(y) - 1, 3, 3);
    c.fillStyle = '#8a5a32'; for (const [x, y] of pts) c.fillRect(R(x), R(y), 1, 1);
    for (const [x, y, col] of head) { c.fillStyle = col; c.fillRect(R(x), R(y), 1, 1); }
  }
  /* удар кулаком: боец шагает к противнику (выпад), передняя рука обычной длины выпрямляется в живот.
     Фазы по e.atk (22→0): 22..17 — выпад и выброс руки, 16..10 — кулак в животе, 9..4 — рука возвращается, шаг назад. */
  const ARM = 4;   /* вынос кулака вперёд от плеча в точках слоя (рука идёт ещё и вниз, к животу) */
  function punchGeom(e) {
    if (e.dying || e.z || e.weapon || e.task !== 'fight' || !e.fight || !(e.atk > 4)) return null;
    const t = Life.byId(e.fight.t); if (!t || t.dying) return null;
    const d = (e.face || e.dir) < 0 ? -1 : 1, k = e.atk > 16 ? (22 - e.atk) / 6 : e.atk >= 10 ? 1 : (e.atk - 4) / 6;
    const tcx = Math.round(t.x * 2) + (t.hurt > 8 && t.hitD ? t.hitD * (t.hurt > 14 ? 3 : 1) : 0), ax0 = Math.round(e.x * 2);
    /* куда надо встать, чтобы прямой рукой достать до живота: живот противника − длина руки − от центра до плеча */
    const want = tcx - d * 9 - d * (ARM + 3.5);   /* 9: передняя кромка живота с учётом наклона и ширины кулака */ let full = want - ax0; if (full * d < 0) full = 0; if (Math.abs(full) > 18) full = d * 18;
    const step = Math.min(1, k * 1.25);
    return { t, d, k, tcx, ax: Math.round(ax0 + full * step) };
  }
  function drawPunches(ents, T) {
    const c = lctx;
    for (const e of ents) {
      const g = punchGeom(e); if (!g) continue;
      const { t, d, k } = g, sc = Life.ageScale ? Life.ageScale(e.age) : 1, dh = Math.round(FH * sc), kx = dh / FH;
      const fy = Math.round(((e.ry != null ? e.ry : e.y) + 1) * 2);
      /* плечо — как в compose: столбец 10 (9 + наклон), строка 11+B */
      const sx = g.ax - SW / 2 * kx + (d > 0 ? 10.5 : SW - 1 - 10 + .5) * kx, sy = fy - dh + (11 + HAT + 1 + .5) * kx;
      const by = fy - dh * .3;   /* живот (ниже груди): строка ~19 из 27 */
      const reach = 2 + (ARM - 2) * k, fx = sx + d * reach, fy2 = sy + (by - sy) * Math.min(1, k);
      /* локоть: пока рука не выпрямлена — согнута вниз */
      const ex = sx + d * reach * .5, ey = (sy + fy2) / 2 + (1 - k) * 3;
      /* цвета с самого спрайта: рукав — пиксель торса у плеча, кожа — из палитры */
      const spr = e._spr && e._spr.getContext ? e._spr : null; let sleeve = null;
      if (spr) { if (!spr._sl) { try { const col = d > 0 ? 8 : SW - 1 - 8, p = spr.getContext('2d').getImageData(col, 11 + HAT + 2, 1, 1).data; spr._sl = p[3] ? [p[0], p[1], p[2]] : [0, 0, 0]; } catch (er) { spr._sl = [0, 0, 0]; } } sleeve = spr._sl; }
      const P = e._pal || basePal(e, false), skinA = P.S, body = (FORMS[look(e)] || FORMS.ref).body, bare = { tank: 1, croptop: 1, sundress: 1, dress: 1 }[body];
      const slA = bare || !sleeve || !(sleeve[0] + sleeve[1] + sleeve[2]) ? skinA : sleeve;
      const rgb = (a, m) => 'rgb(' + a.map((v) => Math.max(0, Math.min(255, Math.round(v * m)))).join(',') + ')';
      const seg = (x0, y0, x1, y1, f) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let q = 0; q <= n; q++) f(Math.round(x0 + (x1 - x0) * q / n), Math.round(y0 + (y1 - y0) * q / n), q / n); };
      /* контур (1 точка вокруг), потом заливка 2 точки: верх светлее, низ темнее — как у рук спрайта */
      c.fillStyle = '#1a0e0a';
      seg(sx, sy, ex, ey, (x, y) => c.fillRect(x - 1, y - 2, 3, 4)); seg(ex, ey, fx, fy2, (x, y) => c.fillRect(x - 1, y - 2, 3, 4));
      seg(sx, sy, ex, ey, (x, y) => { c.fillStyle = rgb(slA, 1.08); c.fillRect(x, y - 1, 1, 1); c.fillStyle = rgb(slA, .82); c.fillRect(x, y, 1, 1); });
      seg(ex, ey, fx, fy2, (x, y) => { c.fillStyle = rgb(skinA, 1.06); c.fillRect(x, y - 1, 1, 1); c.fillStyle = rgb(skinA, .84); c.fillRect(x, y, 1, 1); });
      /* плечо срастается с телом: заливка рукавом прямо поверх края торса, без контура */
      c.fillStyle = rgb(slA, .95); c.fillRect(Math.round(sx) - (d > 0 ? 1 : 0), Math.round(sy) - 1, 2, 2);
      /* кулак: чуть крупнее руки, костяшки темнее */
      const X = Math.round(fx), Y = Math.round(fy2);
      c.fillStyle = '#1a0e0a'; c.fillRect(X - (d > 0 ? 0 : 3), Y - 2, 4, 4); c.fillStyle = rgb(skinA, 1); c.fillRect(X - (d > 0 ? 0 : 2) , Y - 1, 2, 2); c.fillStyle = rgb(skinA, .72); c.fillRect(X + (d > 0 ? 1 : -2), Y - 1, 1, 2);
      /* лёгкая подсказка контакта */
      if (k >= 1 && t.hurt > 10) { c.globalAlpha = .3; c.fillStyle = '#ffffff'; for (let a = 0; a < 8; a++) for (let q = 2; q <= (a & 1 ? 3 : 5); q++) c.fillRect(Math.round(X + d * 3 + Math.cos(a * .785) * q), Math.round(Y + Math.sin(a * .785) * q), 1, 1); c.globalAlpha = 1; }
    }
  }
  /* слой: ширина и высота вдвое больше мира */
  let lay = null, lctx = null;
  function init(canvas, W, H) { lay = canvas; lay.width = W * 2; lay.height = H * 2; lctx = lay.getContext('2d'); lctx.imageSmoothingEnabled = false; }
  /* значки над головой: сердце, сон, восклицание, разговор, нота, огонь (символы: x — цвет значка, w — белый, d — тёмный) */
  const EMO = {
    heart: { c: [255, 96, 128], g: ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'] }, zzz: { c: [220, 235, 255], g: ['xxxx', '..x.', '.x..', 'xxxx'] },
    alert: { c: [255, 224, 64], g: ['.x.', '.x.', '.x.', '...', '.x.'] }, talk: { c: [255, 255, 255], g: ['xxxxxx', 'x.x.x.', 'xxxxxx', '.xx...'] },
    note: { c: [150, 220, 255], g: ['.xxx', '.x.x', '.x..', 'xx..', 'xx..'] }, fire: { c: [255, 150, 50], g: ['..x..', '.xxx.', 'xxxxx', 'xxxxx'] },
    bolt: { c: [255, 232, 60], g: ['..xx', '.xx.', 'xxxx', '.xx.', 'xx..'] }, skull: { c: [240, 240, 245], g: ['.xxx.', 'xxxxx', 'x.x.x', '.xxx.', '.x.x.'] },
    drop: { c: [90, 170, 255], g: ['..x..', '.xxx.', 'xxxxx', 'xxxxx', '.xxx.'] }, cry: { c: [110, 190, 255], g: ['..x..', '.xxx.', 'xxxxx', '.xxx.'] },
    stars: { c: [255, 230, 90], g: ['x...x', '.x.x.', '..x..', '.x.x.', 'x...x'] }, flake: { c: [190, 235, 255], g: ['..x..', 'x.x.x', '.xxx.', 'x.x.x', '..x..'] },
    angry: { c: [255, 84, 60], g: ['x.x.x', '.xxx.', 'xxxxx', '.xxx.', 'x.x.x'] }, broken: { c: [190, 130, 235], g: ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'] },
    shake: { c: [255, 200, 90], g: ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'] }, ghost: { c: [236, 242, 255], g: ['.xxx.', 'xxxxx', 'xxxxx', 'xxxxx', 'x.x.x'] }
  };
  let selId = null;
  /* пузыри эмоций из присланного листа: ключ эмоции -> картинка */
  const BUB = { heart: ['emote', 'heart'], cry: ['emote', 'broken'], broken: ['emote', 'broken'], alert: ['emote', 'alert'], talk: ['emote', 'dots'], note: ['emote', 'note'], shake: ['emote', 'shake'], zzz: ['badge', 'zzz'], fire: ['badge', 'fire'],
    money: ['emote', 'money'], spark: ['emote', 'spark'], up: ['emote', 'up'], ask: ['emote', 'ask'], gift: ['emote', 'gift'], meat: ['emote', 'meat'], coffee: ['emote', 'coffee'], down: ['emote', 'down'] }, bubCache = {};
  function bubble(k) {
    const d = BUB[k]; if (!d || typeof UIA === 'undefined') return null;
    let im = bubCache[k]; if (!im) { im = bubCache[k] = new Image(); im.src = UIA[d[0]][d[1]]; }
    return im.complete && im.naturalWidth ? im : null;
  }
  const CAUSE_G = { shock: 'bolt', burn: 'fire', drown: 'drop', fall: 'stars', crush: 'stars', blast: 'stars', melt: 'skull', freeze: 'flake', slain: 'stars', gas: 'skull' };
  function glyph(k, x, y, a) {
    const o = EMO[k]; if (!o) return; lctx.globalAlpha = a; lctx.fillStyle = 'rgba(20,16,28,.85)';
    o.g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'x') lctx.fillRect(x + i - 1, y + j - 1, 3, 3); });
    lctx.fillStyle = 'rgb(' + o.c.join(',') + ')';
    o.g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'x') lctx.fillRect(x + i, y + j, 1, 1); });
    lctx.globalAlpha = 1;
  }
  /* оружие в руке — только когда оно нужно: в бою, при опасности (война, зомби рядом), лесоруб с топором — по дороге к дереву.
     В остальное время оно лежит дома: человек не ходит по делам с дубиной или топором */
  function armedNow(e) {
    if (e.task === 'fight' || e.task === 'arm' || e.fight) return true;
    if (e.weapon === 'axe' && e.task === 'chop') return true;
    if (e._armF == null || (Sim.frame + e.id) % 30 === 0 || Math.abs(Sim.frame - e._armF) > 30) { e._armF = Sim.frame; e._armV = e.weapon !== 'axe' && !!Combat.danger(e); }
    return e._armV;
  }
  /* часы анимации: идут не быстрее одного такта за кадр — при ускорении мир идёт впятеро быстрее, а моргание, жесты и танцы остаются плавными.
     spf — сколько шагов мира прошло за кадр (сглаженно): по нему замедляется перебор ног, иначе на ×5 они рябят */
  let aT = 0, lastSF = -1, spf = 1;
  function draw(ents, T0, amb, ambKey, lightAt) {
    const sf = typeof Sim !== 'undefined' ? Sim.frame : T0, dn = lastSF < 0 ? 1 : Math.max(0, sf - lastSF); lastSF = sf;
    aT += Math.min(1, dn); spf += (Math.max(1, dn) - spf) * .15; const T = aT; api.T = T;
    if (!lctx) return;
    lctx.clearRect(0, 0, lay.width, lay.height);
    const day = amb[0] > .985 && amb[1] > .985 && amb[2] > .985, sea = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.season : -1, night = (typeof Sky !== 'undefined' && Sky.Y) ? Sky.Y.night || 0 : 0;
    /* передний план домов (перекрытия, столбы, крыша, дым) — перед людьми он не нужен, поэтому рисуется первым */
    if (typeof Houses !== 'undefined') Houses.drawFg(lctx, amb, ambKey, T, night);
    if (typeof Works !== 'undefined') Works.drawFg(lctx, T, amb);
    if (typeof Arms !== 'undefined') Arms.draw(lctx, T);
    /* порядок: кто на плечах — позади взрослого, кого несут на руках — впереди */
    const order = ents.filter((o) => o.rideOn != null).concat(ents.filter((o) => o.rideOn == null && o.heldBy == null && o.carriedBy == null), ents.filter((o) => o.heldBy != null || o.carriedBy != null));
    for (const e of order) {
      if (e.seed == null) e.seed = (Math.random() * 1000) | 0;
      if (!e.form) e.form = 'ref';
      /* ночью человечек освещён тем же светом, что и мир вокруг: у костра и лампы он виден, в темноте тёмный */
      let a = amb, ak = ambKey;
      if (!day && lightAt) { const L = (typeof Houses !== 'undefined' && Houses.lightFor(e, night)) || lightAt(e.x, e.y - 6), q = (v) => Math.min(1.1, Math.round(v * 10) / 10); a = [q(L[0]), q(L[1]), q(L[2])]; ak = a.join(','); }
      const st = animate(e, T), spr = sprite(e, st.P, st.burn, (e.task === 'fight' && e.face ? e.face : e.dir) < 0, st.sub, a, ak, st.zk, st.char, sea);
      const sc = (typeof Life !== 'undefined' && e.age !== undefined) ? Life.ageScale(e.age) : 1, dw = Math.round(SW * sc), dh = Math.round(FH * sc);
      e._pal = palette(e, st.zk, a, ak);   /* та же палитра, что у спрайта (с освещением) — для кулака и предметов */
      /* плавная высота: подъём на ступеньку и спуск сглаживаются (падения и двери — сразу) */
      if (e.ry == null || Math.abs(e.y - e.ry) > 3.5 || e.doorT > 0) e.ry = e.y; else e.ry += (e.y - e.ry) * .3;
      let cx = Math.round(e.x * 2), fy = Math.round((e.ry + 1) * 2);
      if (st.ox) cx += st.ox; if (st.oy) fy += st.oy;
      if (st.seat) drawSeat(lctx, st.seat, cx, fy, e.dir < 0 ? -1 : 1, dh / FH);
      { const pg = punchGeom(e); if (pg) { cx = pg.ax; e._spr = true; } }   /* удар кулаком: шаг-выпад к противнику */
      if (!e.dying && e.hurt > 8 && e.hitD) cx += e.hitD * (e.hurt > 14 ? 3 : 1);   /* отшатывается назад от удара */
      const da = e.doorT > 0 ? .25 + .75 * (1 - e.doorT / 16) : 1;   /* только что вышел из двери в стене: проявляется */
      if (st.alpha * da < 1) lctx.globalAlpha = st.alpha * da;
      if (st.rot) {
        lctx.save();
        if (st.pivot === 'center') { lctx.translate(cx, fy - dh / 2); lctx.rotate(st.rot); lctx.drawImage(spr, -dw / 2, -dh / 2, dw, dh); }
        else if (st.pivot === 'lie') { lctx.translate(cx, fy - dw / 2); lctx.rotate(st.rot); lctx.drawImage(spr, -dw / 2, -dh / 2, dw, dh); }
        else { lctx.translate(cx, fy - (st.lift ? Math.abs(Math.sin(st.rot)) * dw / 2 : 0)); lctx.rotate(st.rot); lctx.drawImage(spr, -dw / 2, -dh, dw, dh); }
        lctx.restore();
      } else if (st.melt) {   /* кислота: тело съедается сверху, внизу растёт зелёная лужа */
        const sy0 = Math.min(FH - 1, Math.floor(st.melt * FH)), ph = Math.max(1, Math.round(dh * (FH - sy0) / FH)), w = Math.round(st.melt * 7);
        lctx.drawImage(spr, 0, sy0, SW, FH - sy0, cx - dw / 2, fy - ph, dw, ph);
        lctx.fillStyle = 'rgba(120,230,70,.85)'; lctx.fillRect(cx - 3 - w, fy - 1, 7 + 2 * w, 2); lctx.fillStyle = 'rgba(200,255,120,.9)'; lctx.fillRect(cx - 1 - (w >> 1), fy - 1, 3 + w, 1);
      } else if (st.squash) { const h2 = Math.max(4, Math.round(dh * (1 - .62 * st.squash))), w2 = Math.round(dw * (1 + .5 * st.squash)); lctx.drawImage(spr, cx - w2 / 2, fy - h2, w2, h2); }
      else { lctx.drawImage(spr, cx - dw / 2, fy - dh, dw, dh); if (e._spr) e._spr = spr; const hand = spr.hand ? [cx - dw / 2 + (spr.hand[0] + .5) * dw / SW, fy - dh + (spr.hand[1] + .5) * dh / FH] : null;   /* кисть в точках слоя */
        if (st.prop && !e.dying) drawProp(lctx, st, cx, fy, dh, e.dir < 0 ? -1 : 1, T, e);
        if (st.tool && hand && spr.fore && !e.dying) drawTool(lctx, st.tool, hand, spr.fore);
        if (st.hold && hand && !e.dying) drawHeld(lctx, st.hold, hand, e.dir < 0 ? -1 : 1, e, T);
        if (st.bow != null && hand && !e.dying) {   /* лук: дуга поперёк прицела, тетива оттянута к груди (после выстрела — прямая) */
          const d = e.dir < 0 ? -1 : 1, ux = Math.cos(st.bow) * d, uy = Math.sin(st.bow), px = -uy, py = ux, hx = hand[0], hy = hand[1];
          const tipA = [hx + px * 6 - ux * 2.2, hy + py * 6 - uy * 2.2], tipB = [hx - px * 6 - ux * 2.2, hy - py * 6 - uy * 2.2], pull = e.drawT > 0 ? 0 : 5;
          const nock = [hx - ux * (2.2 + pull), hy - uy * (2.2 + pull)];
          lctx.fillStyle = '#e8e0c8'; for (const [a0, a1] of [[tipA, nock], [nock, tipB]]) for (let k = 0; k <= 8; k++) lctx.fillRect(Math.round(a0[0] + (a1[0] - a0[0]) * k / 8), Math.round(a0[1] + (a1[1] - a0[1]) * k / 8), 1, 1);
          for (let t = -6; t <= 6; t++) { const x = hx + px * t - ux * (t * t / 16), y = hy + py * t - uy * (t * t / 16); lctx.fillStyle = '#24140c'; lctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); lctx.fillStyle = Math.abs(t) < 2 ? '#3a2416' : '#8a5a30'; lctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
          if (e.drawT <= 0) { lctx.fillStyle = '#7a5030'; for (let k = 0; k < 7; k++) lctx.fillRect(Math.round(nock[0] + ux * k), Math.round(nock[1] + uy * k), 1, 1); lctx.fillStyle = '#c8ccd4'; lctx.fillRect(Math.round(nock[0] + ux * 7), Math.round(nock[1] + uy * 7), 1, 1); }   /* стрела на тетиве */
        }
        if (e.weapon && !e.dying && !e.sleep && typeof Combat !== 'undefined' && !(e.act === 'rod') && !(e.act === 'dig' && e.at > 0) && armedNow(e)) Combat.draw(lctx, e, cx, fy, dh, hand, spr.fore); if (e.act === 'rod' && e.fsh && !e.dying) drawFishing(lctx, e, cx, fy, dh, T, hand); }
      if (e.hitT != null && T - e.hitT < 12 && !e.dying && !e.hitFist) drawHit(lctx, e, cx, fy, dh, T - e.hitT);
      if (st.dizzy && !e.dying) {
        const lie = st.pivot === 'lie', hx0 = lie ? cx - (e.dir < 0 ? -1 : 1) * Math.round(dh / 2 - 5 * dh / FH) : cx, hy0 = lie ? fy - dw / 2 - 7 : fy - dh + Math.round(8 * dh / FH) - 3;
        for (let k = 0; k < 3; k++) { const a = T / 7 + k * 2.094, x = Math.round(hx0 + Math.cos(a) * 6), y = Math.round(hy0 + Math.sin(a) * 1.6); lctx.fillStyle = '#ffd84a'; lctx.fillRect(x - 1, y, 3, 1); lctx.fillRect(x, y - 1, 1, 3); lctx.fillStyle = '#fffbe0'; lctx.fillRect(x, y, 1, 1); }
      }
      if (st.alpha * da < 1) lctx.globalAlpha = 1;
      /* искры тока */
      if ((e.dying === 'shock' && e.dt < 34) || (!e.dying && e.shock > 0)) for (let q = 0; q < 4; q++) {
        const x = cx + Math.round((Math.random() - .5) * 20), y = fy - Math.round(Math.random() * dh); lctx.fillStyle = Math.random() < .5 ? '#fff6a0' : '#7fd8ff';
        lctx.fillRect(x, y, 1, 3); lctx.fillRect(x - 1, y + 1, 3, 1);
      }
      if (e.dying) {   /* причина смерти над головой и душа, уходящая вверх */
        const dt = e.dt | 0, k = e.dying, dur = DUR[k] || 40, top0 = fy - dh - 4, cg = CAUSE_G[k];
        if (cg && dt < 100) glyph(cg, cx - (EMO[cg].g[0].length >> 1), top0 - EMO[cg].g.length - Math.round(dt * .08), dt < 70 ? 1 : (100 - dt) / 30);
        const g = dt - (dur - 10); if (g > 0 && g < 160 && !e.z) glyph('ghost', cx - 2 + Math.round(Math.sin(g / 7) * 3), top0 - 8 - Math.round(g * .42), Math.min(1, (160 - g) / 80) * .85);
        continue;
      }
      const top = fy - (st.pivot === 'lie' ? dw : dh) - 4;
      if (e.emo) {
        const bob = Math.round(Math.sin(T / 9 + e.seed) * 1), k = e.emo.k, a = Math.min(1, e.emo.t / 20), b = bubble(k), o = EMO[k];
        if (b) { lctx.globalAlpha = a; lctx.drawImage(b, Math.round(cx) - 10, Math.round(top) - 23 + bob, 20, 20); lctx.globalAlpha = 1; }
        else if (o) glyph(k, cx - (o.g[0].length >> 1), top - o.g.length - 1 + bob, a);
      }
      if (selId !== null && e.id === selId) {   /* стрелка над выбранным */
        const y = top - 10 + Math.round(Math.sin(T / 6) * 1.5); lctx.fillStyle = 'rgba(20,16,28,.9)'; lctx.fillRect(cx - 4, y - 1, 9, 3); lctx.fillRect(cx - 3, y + 2, 7, 2); lctx.fillRect(cx - 2, y + 4, 5, 2); lctx.fillRect(cx - 1, y + 6, 3, 1);
        lctx.fillStyle = '#ffd23c'; lctx.fillRect(cx - 3, y, 7, 1); lctx.fillRect(cx - 2, y + 1, 5, 2); lctx.fillRect(cx - 1, y + 3, 3, 1); lctx.fillRect(cx, y + 4, 1, 1);
      }
    }
    drawPunches(ents, T);   /* удары кулаком — поверх всех людей, чтобы рука и кулак были видны целиком */
  }
  /* случайный горожанин для инструмента «Человек» */
  /* кто появляется: чаще всего обычные горожане со своей стрижкой и одеждой, реже знакомые образы, совсем редко панк; костюмы — только из меню */
  const CLASSIC = ['ref', 'dark', 'red', 'blond', 'ginger', 'hoodie', 'cap', 'dress', 'tail', 'track', 'varsity'];
  function randomForm() { const r = Math.random(); return r < .8 ? randomNorm() : r < .97 ? CLASSIC[(Math.random() * CLASSIC.length) | 0] : 'punk'; }
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
    TOOLS.CHILD = { name: 'Ребёнок', hint: 'Маленький человечек: играет и ходит за родителями, потом растёт.' };
    for (const id in FORMS) TOOLS['P_' + id] = { name: FORMS[id].name, hint: FORMS[id].hint, form: id };
    if (typeof CATS !== 'undefined' && !CATS.some((c) => c.id === 'people')) {
      const life = CATS.find((c) => c.id === 'life'); if (life) life.els = life.els.filter((k) => k !== 't:HUMAN' && k !== 't:ZOMBIE');
      CATS.splice(CATS.indexOf(life) + 1, 0, { id: 'people', name: 'Люди', icon: 'people', els: ['t:HUMAN', 't:CHILD'].concat(Object.keys(FORMS).filter((k) => k !== 'ref' && !C[k]).map((k) => 't:P_' + k), ['t:ZOMBIE']) });
    }
  }
  const faceCache = new Map();
  function iconOf(e) {
    if (!e) return icon('ref');
    const form = look(e), key = form + '|' + skinIdx(e) + '|' + (e.z ? 1 : 0) + '|' + Math.max(0, Math.min(8, Math.floor(((e.age || 0) - 42) / 4)));
    let u = faceCache.get(key); if (u) return u;
    const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
    x.drawImage(sprite(e, NEUTRAL, 0, false, 0, null, 'i', e.z ? 1 : 0, 0), 0, 2, SW, 16, 1, 0, SW, 16);
    u = c.toDataURL(); if (faceCache.size > 400) faceCache.clear(); faceCache.set(key, u); return u;
  }
  const api = { init, draw, icon, iconFor: iconOf, look, wear, festival, randomForm, FORMS, compose, sprite, animate, NEUTRAL, T: 0, setSel(id) { selId = id; }, get canvas() { return lay; } };
  return api;
})();
