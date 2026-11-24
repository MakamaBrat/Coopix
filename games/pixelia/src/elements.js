'use strict';
/* ПИКСЕЛИЯ — таблицы элементов.
   Каждый элемент играет свою роль и не дублирует другой: сыпучие различаются по «липкости» и плотности,
   жидкости — по плотности/вязкости/химии, твёрдые — по теплу, току и горючести. */
const K = { AIR: 0, POWDER: 1, LIQUID: 2, GAS: 3, SOLID: 4, SPEC: 5 };
const NT = 64;
const AMB = 20;
const ID_LIST = ['AIR', 'WALL', 'SKY', 'EARTH', 'SAND', 'SNOW', 'SALT', 'GUNP', 'ASH', 'WATER', 'BRINE', 'OIL', 'LAVA', 'ACID', 'MUD',
  'FIRE', 'STEAM', 'SMOKE', 'GAS', 'STONE', 'METAL', 'GLASS', 'WOOD', 'ICE', 'LEAF', 'SEED', 'SPROUT', 'SPARK', 'BATT', 'LAMP', 'CLONE', 'VOID', 'FLY', 'CONE', 'FSEED', 'LITTER'];
const E = {};
ID_LIST.forEach((k, i) => { E[k] = i; });

const KIND = new Uint8Array(NT), DENS = new Float32Array(NT), COND = new Float32Array(NT), LOSS = new Float32Array(NT);
const T0 = new Float32Array(NT).fill(AMB), FLAMM = new Float32Array(NT), IGN = new Float32Array(NT), FUEL = new Uint8Array(NT);
const BHEAT = new Float32Array(NT), FLAMEP = new Float32Array(NT), VISC = new Float32Array(NT).fill(1), DISPR = new Uint8Array(NT);
const REPOSE = new Float32Array(NT).fill(1), RXP = new Float32Array(NT), RISEP = new Float32Array(NT), DISS = new Float32Array(NT);
const ISCOND = new Uint8Array(NT), CONDP = new Float32Array(NT), CLONABLE = new Uint8Array(NT);
const NAME = [], COLOR = [], VARI = new Uint8Array(NT), ALPHA = new Uint8Array(NT).fill(255), HINT = [];

function def(key, name, kind, o) {
  const id = E[key]; o = o || {};
  KIND[id] = kind; NAME[id] = name; DENS[id] = o.dens || 1; COND[id] = o.cond == null ? 0.04 : o.cond; LOSS[id] = o.loss == null ? 0.003 : o.loss;
  if (o.t0 != null) T0[id] = o.t0;
  FLAMM[id] = o.flamm || 0; IGN[id] = o.ign || 0; FUEL[id] = o.fuel || 0; BHEAT[id] = o.bheat || 0; FLAMEP[id] = o.flamep || 0;
  if (o.visc != null) VISC[id] = o.visc;
  DISPR[id] = o.disp || 0; if (o.repose != null) REPOSE[id] = o.repose;
  RXP[id] = o.rxp || 0; RISEP[id] = o.rise || 0; DISS[id] = o.diss || 0;
  COLOR[id] = o.color || [255, 0, 255]; VARI[id] = o.vari == null ? 10 : o.vari; if (o.alpha) ALPHA[id] = o.alpha;
  if (o.cond_e) { ISCOND[id] = 1; CONDP[id] = o.cond_e; }
  HINT[id] = o.hint || '';
}
/* --- сыпучие --- */
def('EARTH', 'Земля', K.POWDER, { dens: 1.5, cond: .04, repose: .55, color: [132, 88, 52], vari: 16, rxp: .25, diss: .5, hint: 'Рядом с водой превращается в грязь. На ней растут деревья.' });
def('SAND', 'Песок', K.POWDER, { dens: 1.6, cond: .06, color: [238, 206, 112], vari: 14, rxp: .1, hint: 'Сплавляется в стекло от лавы и молнии.' });
def('SNOW', 'Снег', K.POWDER, { dens: .45, cond: .02, loss: .0006, repose: .9, color: [240, 247, 255], vari: 6, rxp: .3, diss: .3, hint: 'Лёгкий. Тает в воду от тепла.' });
def('SALT', 'Соль', K.POWDER, { dens: 1.4, cond: .05, color: [238, 238, 246], vari: 10, rxp: .3, diss: .4, hint: 'Растворяется в воде и топит лёд. Губит растения.' });
def('GUNP', 'Порох', K.POWDER, { dens: 1.2, repose: .9, color: [74, 76, 98], vari: 12, rxp: .3, flamm: .7, ign: 170, fuel: 5, bheat: 1000, flamep: .5, diss: .4, hint: 'Взрывается цепочкой. Мокрый не горит.' });
def('ASH', 'Пепел', K.POWDER, { dens: .7, repose: .7, color: [150, 146, 154], vari: 16, diss: .3, hint: 'Остаётся после огня. Плавает на воде.' });
def('MUD', 'Грязь', K.POWDER, { dens: 1.7, repose: .12, color: [98, 66, 44], vari: 10, rxp: .3, diss: .5, hint: 'Липкая. Сохнет от тепла и снова становится землёй.' });
def('SEED', 'Семя', K.POWDER, { dens: .6, color: [214, 170, 72], vari: 18, rxp: .5, flamm: .2, ign: 220, fuel: 8, diss: .6, hint: 'Ляжет на землю у воды — вырастет дуб, тополь или другое лиственное дерево.' });
def('LITTER', 'Опавшая листва', K.POWDER, { dens: .5, repose: .85, color: [78, 120, 54], vari: 26, flamm: .18, ign: 200, fuel: 14, bheat: 600, flamep: .25, diss: .6, hint: 'Листья, осыпавшиеся с упавшего дерева.' });
def('CONE', 'Шишка', K.POWDER, { dens: .6, color: [150, 100, 58], vari: 16, rxp: .5, flamm: .2, ign: 220, fuel: 8, diss: .6, hint: 'Вырастает в ель с ярусной кроной. Нужны земля и вода рядом.' });
def('FSEED', 'Цветы', K.POWDER, { dens: .5, color: [238, 150, 192], vari: 20, rxp: .5, flamm: .2, ign: 220, fuel: 8, diss: .6, hint: 'Семена цветов: на земле у воды вырастет луг с травой и цветами.' });
/* --- жидкости --- */
def('WATER', 'Вода', K.LIQUID, { dens: 1, cond: .07, loss: .004, disp: 6, color: [48, 124, 232], vari: 8, alpha: 220, rxp: .5, cond_e: .4, hint: 'Течёт, замерзает, кипит, проводит ток, размывает камень.' });
def('BRINE', 'Рассол', K.LIQUID, { dens: 1.2, cond: .07, loss: .004, disp: 6, color: [88, 166, 206], vari: 8, alpha: 225, rxp: .5, cond_e: .85, hint: 'Солёная вода: тяжелее, не мёрзнет до −14, отлично проводит ток.' });
def('OIL', 'Нефть', K.LIQUID, { dens: .8, cond: .03, loss: .004, disp: 5, color: [76, 52, 36], vari: 8, alpha: 240, rxp: .2, flamm: .2, ign: 230, fuel: 110, bheat: 700, flamep: .35, hint: 'Легче воды, плавает и горит.' });
def('LAVA', 'Лава', K.LIQUID, { dens: 2.6, cond: .09, loss: .0012, disp: 3, visc: .35, t0: 1250, color: [255, 120, 28], vari: 30, rxp: 1, hint: 'Остывает в камень. С водой даёт пар, с песком — стекло.' });
def('ACID', 'Кислота', K.LIQUID, { dens: 1.1, cond: .05, disp: 5, color: [150, 236, 44], vari: 10, alpha: 225, rxp: .7, hint: 'Растворяет почти всё. Стекло и гранит ей не по зубам.' });
/* --- газы --- */
def('FIRE', 'Огонь', K.GAS, { dens: .02, cond: .05, loss: .02, t0: 700, rxp: 1, rise: .8, color: [255, 160, 40], hint: 'Поджигает горючее. Вода тушит.' });
def('STEAM', 'Пар', K.GAS, { dens: .04, cond: .02, loss: .01, t0: 110, rxp: 1, rise: .5, color: [226, 236, 246], alpha: 120, hint: 'Остывает и возвращается дождём.' });
def('SMOKE', 'Дым', K.GAS, { dens: .06, cond: .02, loss: .015, rxp: 1, rise: .55, color: [84, 84, 96], alpha: 150, hint: 'Уходит вверх и растворяется.' });
def('GAS', 'Газ', K.GAS, { dens: .03, cond: .02, loss: .01, rise: .6, rxp: .3, color: [170, 235, 150], alpha: 90, flamm: .95, ign: 160, fuel: 1, bheat: 1100, hint: 'Взрывоопасный. Копится под потолком.' });
/* --- твёрдое --- */
def('WALL', 'Гранит', K.SOLID, { dens: 9, cond: .002, loss: 1, color: [86, 90, 104], vari: 10, hint: 'Несокрушимая стена.' });
def('SKY', '', K.SOLID, { dens: 9, cond: 0, loss: 1 });
def('STONE', 'Камень', K.SOLID, { dens: 3, cond: .05, loss: .002, color: [134, 138, 150], vari: 18, rxp: .12, diss: .06, hint: 'Вода медленно размывает его в песок.' });
def('METAL', 'Металл', K.SOLID, { dens: 7, cond: .22, loss: .002, color: [170, 184, 200], vari: 12, rxp: .1, diss: .25, cond_e: 1, hint: 'Проводит тепло и ток. Раскаляется докрасна.' });
def('GLASS', 'Стекло', K.SOLID, { dens: 2.5, cond: .04, color: [176, 228, 244], vari: 10, alpha: 130, rxp: .3, hint: 'Прозрачное. Лопается от резкого перепада температур.' });
def('WOOD', 'Дерево', K.SOLID, { dens: 1.2, cond: .04, color: [150, 100, 56], vari: 10, rxp: .15, flamm: .06, ign: 300, fuel: 200, bheat: 700, flamep: .2, diss: .25, hint: 'Горит долго, оставляя пепел.' });
def('ICE', 'Лёд', K.SOLID, { dens: .9, cond: .05, loss: .00025, t0: -15, color: [172, 228, 252], vari: 10, alpha: 235, rxp: .5, diss: .1, hint: 'Холодный. Тает выше нуля.' });
def('LEAF', 'Листва', K.SOLID, { dens: .5, cond: .03, color: [58, 178, 68], vari: 22, rxp: .2, flamm: .22, ign: 200, fuel: 30, bheat: 650, flamep: .3, diss: .6, hint: 'Живая зелень. Быстро горит.' });
/* --- особые --- */
def('SPROUT', 'Росток', K.SPEC, { color: [130, 224, 96], vari: 16, rxp: .07, flamm: .3, ign: 200, fuel: 10, diss: .6 });
def('SPARK', 'Искра', K.SPEC, { color: [190, 240, 255], rxp: 1, hint: 'Заряжает провод и поджигает газ и порох.' });
def('BATT', 'Батарея', K.SOLID, { dens: 4, cond: .1, color: [64, 74, 90], vari: 6, diss: .2, hint: 'Каждые полсекунды шлёт импульс в металл рядом.' });
def('LAMP', 'Лампа', K.SOLID, { dens: 2, cond: .04, color: [214, 214, 204], vari: 6, rxp: 1, hint: 'Светится, когда по проводу идёт ток.' });
def('CLONE', 'Источник', K.SOLID, { dens: 9, cond: .02, color: [168, 92, 226], vari: 6, rxp: 1, hint: 'Копирует первый коснувшийся элемент без конца.' });
def('VOID', 'Сток', K.SOLID, { dens: 9, cond: .02, color: [24, 14, 40], vari: 6, rxp: 1, hint: 'Затягивает всё, что коснётся.' });
def('FLY', 'Светляк', K.SPEC, { color: [214, 255, 110], rxp: .5, flamm: .5, ign: 80, fuel: 4, diss: 1, hint: 'Парит и светится. Боится огня и воды.' });

for (let t = 0; t < NT; t++) { if (t !== E.AIR && t !== E.WALL && t !== E.SKY && t !== E.CLONE && t !== E.VOID && t !== E.SPARK && t !== E.SPROUT && t < ID_LIST.length) CLONABLE[t] = 1; }
COND[E.AIR] = .03; LOSS[E.AIR] = .03; T0[E.AIR] = AMB; DENS[E.AIR] = .001; NAME[E.AIR] = 'Воздух';

/* таблицы пар: FALL — вытеснение вниз (порошки/жидкости), RISE — всплытие (газы), PAIRK — теплопроводность пары */
const FALL = new Uint8Array(NT * NT), RISE = new Uint8Array(NT * NT), PAIRK = new Float32Array(NT * NT);
for (let a = 0; a < ID_LIST.length; a++) for (let b = 0; b < ID_LIST.length; b++) {
  const ka = KIND[a], kb = KIND[b];
  if (ka === K.POWDER || ka === K.LIQUID) {
    let p = 0;
    if (b === E.AIR) p = 255;
    else if (kb === K.GAS) p = 255;
    else if (kb === K.LIQUID && DENS[a] > DENS[b] + .02) p = ka === K.POWDER ? 110 : 210;
    else if (kb === K.POWDER && ka === K.POWDER && DENS[a] > DENS[b] + .4) p = 60;
    FALL[a * NT + b] = p;
  }
  if (ka === K.GAS) {
    let p = 0;
    if (b === E.AIR) p = 255;
    else if (a !== E.FIRE) {
      if (kb === K.GAS && DENS[b] > DENS[a] + .005) p = 100;
      else if (kb === K.LIQUID && DENS[b] > DENS[a]) p = 60;
    }
    RISE[a * NT + b] = p;
  }
  const ca = COND[a], cb = COND[b];
  /* воздух почти не отдаёт и не забирает тепло: капля лавы не стынет на лету */
  PAIRK[a * NT + b] = ((ca > 0 && cb > 0) ? 2 * ca * cb / (ca + cb) : 0) * ((a === E.AIR || b === E.AIR) ? .022 : 1);
}

/* --- каталог для интерфейса --- */
const CATS = [
  { id: 'powder', name: 'Сыпучее', icon: 'pile', els: ['EARTH', 'SAND', 'SNOW', 'SALT', 'GUNP', 'ASH', 'MUD'] },
  { id: 'liquid', name: 'Жидкости', icon: 'drop', els: ['WATER', 'OIL', 'LAVA', 'ACID', 'BRINE'] },
  { id: 'gas', name: 'Газы', icon: 'puff', els: ['FIRE', 'STEAM', 'SMOKE', 'GAS'] },
  { id: 'solid', name: 'Твёрдое', icon: 'block', els: ['STONE', 'WALL', 'METAL', 'GLASS', 'WOOD', 'ICE', 'LEAF'] },
  { id: 'life', name: 'Жизнь', icon: 'seed', els: ['SEED', 'CONE', 'FSEED', 'FLY', 't:HUMAN', 't:ZOMBIE'] },
  { id: 'tech', name: 'Механизмы', icon: 'bulb', els: ['SPARK', 'BATT', 'LAMP', 'CLONE', 'VOID'] },
  { id: 'power', name: 'Силы', icon: 'bolt', els: ['t:LIGHTNING', 't:METEOR', 't:BLAST', 't:WIND', 't:HEAT', 't:COLD'] }
];
const TOOLS = {
  'ERASE': { name: 'Ластик', hint: 'Стирает всё под кистью.' },
  'LIGHTNING': { name: 'Молния', hint: 'Бьёт с неба в точку касания: жжёт, плавит песок, заряжает воду.' },
  'METEOR': { name: 'Метеорит', hint: 'Огненный камень с неба. Бабах и лава.' },
  'BLAST': { name: 'Взрыв', hint: 'Ударная волна: ломает, швыряет, поджигает.' },
  'HUMAN': { name: 'Человек', hint: 'Ходит, плавает, тонет и горит. Бегает от зомби.' },
  'ZOMBIE': { name: 'Зомби', hint: 'Идёт к людям и заражает их.' },
  'WIND': { name: 'Ветер', hint: 'Води пальцем: толкает газ, дым, снег и песок.' },
  'HEAT': { name: 'Жар', hint: 'Нагревает всё под кистью.' },
  'COLD': { name: 'Холод', hint: 'Охлаждает всё под кистью.' }
};
