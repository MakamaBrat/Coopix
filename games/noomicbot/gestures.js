/* Noomic Bot: жесты («коронные номера») — короткие позы-анимации, которые можно вставлять в свои комбинации трюков.
   Вставляется в основной скрипт игры скриптом scripts/build_noomic_plus.py после plus.js и vice.js (до skins.js), видит Game, W, SAVE, JOINTS, PARTS, CFG, I18N и т.д.
   Как это работает: жест — это набор ключевых поз суставов (углы в градусах для лица вправо). Кнопка (или цифры 1–4) запускает жест; пока он идёт,
   поверх обычного управления моторы суставов тянутся к позе жеста (плавно входим и выходим). Нажатия пишутся в маску повторов (RKEYS), а набор жестов — в конфиг повтора,
   поэтому повторы воспроизводят жесты так же, как и сам заезд. Играть жест можно в воздухе и на земле; на турнике, в рэгдолле и после нокаута жест прерывается. */
{
const RU={"ge.title":"Жесты","ge.hint":"Нажмите на жест — он сыграет на персонаже. Купленные встают в выбранный слот 1–4 и на кнопку в игре (клавиши 1–4).","ge.slot":"Слот","ge.empty":"Пусто","ge.combo":"Комбо","ge.style":"Стиль","ge.tabSk":"Скины","ge.tabGe":"Жесты","ge.clear":"Убрать"},
 EN={"ge.title":"Gestures","ge.hint":"Tap a gesture to watch it. Owned ones go to the chosen slot 1–4 and to a button in the game (keys 1–4).","ge.slot":"Slot","ge.empty":"Empty","ge.combo":"Combo","ge.style":"Style","ge.tabSk":"Skins","ge.tabGe":"Gestures","ge.clear":"Clear"};
for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU:EN);

/* ---------- набор жестов ----------
   строка ключевой позы: [время, плечоЛ, плечоП, шея, бедроЛ, бедроП, коленоЛ, коленоП, голеностоп]   (углы как у POSES: плечо 0 = рука вверх, −150 = вниз; бедро + = нога вперёд; колено − = согнуто)
   leg — жест двигает ногами (на земле ноги не трогаем); hop — на земле сначала подпрыгиваем в момент hop.t */
const osc=(n,dt,f,t0)=>{const o=[];for(let i=0;i<=n;i++)o.push([(t0||0)+i*dt].concat(f(i)));return o};
/* ---------- набор жестов: настоящие «номера» — подготовка (присед, замах), взрыв, пик, акцент, приземление ----------
   строка ключевой позы: [время, плечоЛ, плечоП, шея, бедроЛ, бедроП, коленоЛ, коленоП, голеностоп] (углы как у POSES: плечо 0 = рука вверх, −150 = вниз; бедро + = нога вперёд; колено − = согнуто)
   leg: 0 — только руки и шея; 1 — ноги тоже, но только в воздухе (на земле жест сам подпрыгивает по hop); 2 — ноги работают и на земле (приседы, пружинки)
   hop — прыжок с земли в момент t (v — скорость, м/с); spin — повороты тела вокруг вертикальной оси: [[t, обороты], …] (чисто визуальный, физику не трогает);
   fx — конфетти на пике (t, секунды жеста) */
const GEST=[
 {id:"ge_victory",ru:"Победа",en:"Victory",ic:"🙌",dur:2.4,leg:2,hop:{t:.34,v:4},spin:[[.36,0],[1.15,1]],fx:{t:.62},
  kf:[[0,-120,-120,0,0,0,0,0,0],[.2,-150,-150,-14,62,62,-95,-95,-14],[.34,12,12,16,4,4,-6,-6,14],[.62,14,14,22,14,14,-30,-30,6],[1,10,10,20,24,24,-50,-50,0],[1.25,12,12,22,4,4,-6,-6,0],
      [1.5,-35,-35,16,4,4,-6,-6,0],[1.7,12,12,22,4,4,-6,-6,0],[1.95,-35,-35,16,4,4,-6,-6,0],[2.15,12,12,22,4,4,-6,-6,0],[2.4,12,12,22,4,4,-6,-6,0]]},
 {id:"ge_wave",ru:"Привет",en:"Hello",ic:"👋",dur:2.2,leg:0,
  kf:[[0,-150,-150,0,0,0,0,0,0],[.3,-20,-146,12,0,0,0,0,0]].concat(osc(8,.18,i=>[i%2?-40:4,-146+(i%2?2:-2),10,0,0,0,0,0],.48)).concat([[2.1,-120,-150,0,0,0,0,0,0]])},
 {id:"ge_bow",ru:"Поклон",en:"Bow",ic:"🙇",dur:2.4,leg:2,
  kf:[[0,-150,-150,0,0,0,0,0,0],[.45,-100,-150,-10,30,30,-10,-10,0],[.9,-60,-150,-30,62,62,-12,-12,8],[1.5,-60,-150,-30,62,62,-12,-12,8],[2,-110,-150,-8,18,18,-4,-4,0],[2.4,-150,-150,0,0,0,0,0,0]]},
 {id:"ge_super",ru:"Супермен",en:"Superman",ic:"🦸",dur:2,leg:1,hop:{t:.22,v:3.6},
  kf:[[0,-110,-110,0,0,0,0,0,0],[.22,-150,-150,-8,40,40,-60,-60,-10],[.34,-88,-88,18,-12,-12,-8,-8,12],[.6,-85,-85,22,-14,-14,-6,-6,16],[1.2,-85,-85,22,-14,-14,-6,-6,16],[1.6,-60,-60,12,10,10,-20,-20,4],[2,-120,-120,0,0,0,0,0,0]]},
 {id:"ge_angel",ru:"Ласточка",en:"Swan dive",ic:"🕊",dur:2.2,leg:1,hop:{t:.24,v:4.3},spin:[[.4,0],[1,1]],
  kf:[[0,-110,-110,0,0,0,0,0,0],[.24,-150,-150,-10,40,40,-70,-70,-10],[.36,15,15,18,-6,-6,-8,-8,10],[.62,15,15,30,-15,-15,-30,-30,25],[.92,15,15,28,-12,-12,-24,-24,20],[1.05,-60,-60,10,8,8,-14,-14,0],[1.3,-90,-90,6,4,4,-8,-8,0],[1.9,-60,-60,10,0,0,0,0,0],[2.2,-120,-120,0,0,0,0,0,0]]},
 {id:"ge_runner",ru:"Бегун",en:"Sprinter",ic:"🏃",dur:2.4,leg:1,hop:{t:.18,v:4.4},
  kf:[[0,-110,-110,0,0,0,0,0,0],[.18,-150,-150,-8,40,40,-60,-60,-8],[.3,-90,-90,10,-8,-8,-8,-8,6]].concat(osc(2,.2,i=>i%2?[-35,-115,8,-15,92,-105,-12,-15]:[-115,-35,8,92,-15,-12,-105,-15],.38)).concat([[.9,-60,-60,6,8,8,-14,-14,0],[1.12,-60,-60,6,4,4,-8,-8,0]]).concat(osc(4,.24,i=>i%2?[-35,-115,8,4,4,-6,-6,0]:[-115,-35,8,4,4,-6,-6,0],1.3)).concat([[2.35,-130,-130,0,0,0,0,0,0]])},
 {id:"ge_star",ru:"Звезда",en:"Star jump",ic:"⭐",dur:2.2,leg:1,hop:{t:.2,v:4},spin:[[.3,0],[1.1,1]],fx:{t:.5},
  kf:[[0,-100,-100,0,0,0,0,0,0],[.2,-150,-150,-10,60,60,-90,-90,-12],[.34,14,14,16,58,-14,-4,-4,0],[.8,14,14,20,58,-14,-4,-4,0],[1.25,10,10,14,8,8,-8,-8,0],[1.7,12,12,22,4,4,-6,-6,0],[2.2,12,12,22,4,4,-6,-6,0]]},
 {id:"ge_joy",ru:"Радость",en:"Joy",ic:"🎉",dur:2.4,leg:2,hop:{t:.26,v:4.2},fx:{t:.55},
  kf:[[0,-110,-110,0,0,0,0,0,0],[.26,-150,-150,-12,70,70,-100,-100,-14],[.38,14,14,16,6,6,-6,-6,12],[.6,-40,-40,20,30,30,-55,-55,0],[.8,14,14,22,10,10,-12,-12,0],[1,-40,-40,20,40,40,-70,-70,0],[1.2,14,14,22,8,8,-10,-10,0],
      [1.5,-20,-20,16,30,30,-38,-38,-10],[1.75,14,14,22,6,6,-8,-8,0],[2,-20,-20,16,30,30,-38,-38,-10],[2.25,14,14,22,6,6,-8,-8,0],[2.4,14,14,22,6,6,-8,-8,0]]},
 {id:"ge_dance",ru:"Танец",en:"Dance",ic:"💃",dur:3,leg:2,spin:[[.4,0],[2.5,2]],
  kf:[[0,-130,-130,0,0,0,0,0,0]].concat(osc(7,.33,i=>i%2?[-110,-30,8,8,8,-10,-10,0]:[-30,-110,8,22,22,-28,-28,-8],.3)).concat([[2.9,-130,-130,0,0,0,0,0,0]])},
 {id:"ge_mill",ru:"Мельница",en:"Windmill",ic:"🌀",dur:2.6,leg:0,spin:[[.3,0],[2,2]],
  kf:[[0,-150,-150,0,0,0,0,0,0]].concat(osc(10,.2,i=>i%2?[-140,10,-4,0,0,0,0,0]:[10,-140,6,0,0,0,0,0],.3)).concat([[2.6,-150,-150,0,0,0,0,0,0]])},
 {id:"ge_break",ru:"Брейк-данс",en:"Breakdance",ic:"🕺",dur:3.4,leg:2,hop:{t:2.3,v:3.4},spin:[[.45,0],[2.15,2]],fx:{t:2.45},
  kf:[[0,-120,-120,0,0,0,0,0,0],[.45,-70,-70,-18,100,100,-125,-125,-20],
      [.7,-60,-110,-16,100,100,-110,-125,-20],[1,-110,-60,-16,100,100,-125,-110,-20],[1.3,-60,-110,-16,100,100,-110,-125,-20],[1.6,-110,-60,-16,100,100,-125,-110,-20],[1.9,-60,-110,-16,100,100,-110,-125,-20],
      [2.2,-120,-120,-10,70,70,-95,-95,-10],[2.35,-60,12,-22,105,-5,-105,-8,0],[2.9,-60,12,-22,105,-5,-105,-8,0],[3,-90,-90,0,20,20,-20,-20,0],[3.4,-150,-150,0,0,0,0,0,0]]}
];
/* названия жестов на языках игры (порядок как в GEST: победа, привет, поклон, супермен, ласточка, бегун, звезда, радость, танец, мельница, брейк-данс); be берёт русские, остальное — английские */
const NM={
 ru:["Победа","Привет","Поклон","Супермен","Ласточка","Бегун","Звезда","Радость","Танец","Мельница","Брейк-данс"],
 uk:["Перемога","Привіт","Уклін","Супермен","Ластівка","Бігун","Зірка","Радість","Танець","Млин","Брейк-данс"],
 en:["Victory","Hello","Bow","Superman","Swan dive","Sprinter","Star jump","Joy","Dance","Windmill","Breakdance"],
 de:["Sieg","Hallo","Verbeugung","Superman","Schwalbe","Sprinter","Sternsprung","Freude","Tanz","Windmühle","Breakdance"],
 fr:["Victoire","Salut","Révérence","Superman","Hirondelle","Sprinteur","Saut étoile","Joie","Danse","Moulin à vent","Breakdance"],
 es:["Victoria","Hola","Reverencia","Superman","Golondrina","Velocista","Salto estrella","Alegría","Baile","Molino","Breakdance"],
 it:["Vittoria","Ciao","Inchino","Superman","Rondine","Velocista","Salto stella","Gioia","Danza","Mulino","Breakdance"],
 pt:["Vitória","Olá","Reverência","Super-Homem","Andorinha","Velocista","Salto estrela","Alegria","Dança","Moinho","Breakdance"],
 pl:["Zwycięstwo","Cześć","Ukłon","Superman","Jaskółka","Sprinter","Gwiazda","Radość","Taniec","Wiatrak","Breakdance"],
 nl:["Overwinning","Hallo","Buiging","Superman","Zwaluw","Sprinter","Sterrensprong","Vreugde","Dans","Windmolen","Breakdance"],
 sv:["Seger","Hej","Bugning","Stålmannen","Svala","Sprinter","Stjärnhopp","Glädje","Dans","Väderkvarn","Breakdance"],
 fi:["Voitto","Moi","Kumarrus","Teräsmies","Pääskynen","Pikajuoksija","Tähtihyppy","Ilo","Tanssi","Tuulimylly","Breakdance"],
 cs:["Vítězství","Ahoj","Úklona","Superman","Vlaštovka","Sprinter","Hvězda","Radost","Tanec","Větrný mlýn","Breakdance"],
 ro:["Victorie","Salut","Plecăciune","Superman","Rândunică","Sprinter","Salt stea","Bucurie","Dans","Moară de vânt","Breakdance"],
 tr:["Zafer","Merhaba","Selam","Süpermen","Kırlangıç","Sprinter","Yıldız atlayışı","Sevinç","Dans","Yel değirmeni","Breakdance"],
 id:["Kemenangan","Halo","Membungkuk","Superman","Walet","Pelari cepat","Lompat bintang","Sukacita","Dansa","Kincir angin","Breakdance"],
 vi:["Chiến thắng","Xin chào","Cúi chào","Siêu nhân","Chim én","Chạy nước rút","Nhảy ngôi sao","Niềm vui","Nhảy","Cối xay gió","Breakdance"]};
const gname=g=>{const L=NM[LANG]||(LANG==="be"?NM.ru:NM.en);return L[GEST.indexOf(g)]||g.en};
const byId={};for(const g of GEST)byId[g.id]=g;
for(const L in I18N){const ru=["ru","uk","be"].includes(L),nm=NM[L]||(L==="be"?NM.ru:NM.en);GEST.forEach((g,i)=>{I18N[L]["ge.n."+g.id]=ru?"Жест «"+nm[i]+"»":"Gesture: "+nm[i]})} /* подпись в счёте на оплату */
const NS=4;
const own=id=>!!(window.__ncPay&&window.__ncPay.owned(id)); /* жесты покупаются за звёзды: в слотах и в игре — только купленные */
if(!Array.isArray(SAVE.gest))SAVE.gest=["","","",""];
SAVE.gest=SAVE.gest.slice(0,NS).map(x=>byId[x]&&own(x)?x:"");while(SAVE.gest.length<NS)SAVE.gest.push("");

/* ---------- поза жеста в момент t: массив из 8 углов + вес (плавный вход и выход) ---------- */
const sm=x=>x*x*(3-2*x),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function pose(g,t){const k=g.kf;if(t<=k[0][0])return k[0].slice(1);if(t>=k[k.length-1][0])return k[k.length-1].slice(1);
 let i=0;while(k[i+1][0]<t)i++;const a=k[i],b=k[i+1],u=sm((t-a[0])/(b[0]-a[0])),o=[];for(let j=1;j<9;j++)o.push(a[j]+(b[j]-a[j])*u);return o}
const weight=(g,t)=>sm(clamp(Math.min(t/.16,(g.dur-t)/.28),0,1));
const NAMES=["shL","shR","neck","hipL","hipR","kneeL","kneeR","ank"];

/* ---------- слоумо и камера на коронный номер ---------- */
const SLOW_T=.55; /* сколько секунд игрового времени жеста идёт замедленно (при замедлении ×0.28 это около 2 с на экране) */
const slowOn=G=>G===W&&!RP&&!G.play&&SAVE.set.gslow!==false;
{const RU2={"ge.slowmo":"Слоумо на коронный номер"},EN2={"ge.slowmo":"Slow-mo on signature moves"};
 for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU2:EN2);
 /* переключатель в настройках — сразу под общим «Замедлением» */
 const _rs=renderSettings;renderSettings=function(){_rs();const t=$("stBody"),r=mkCtl(t,T("ge.slowmo"),()=>SAVE.set.gslow!==false?1:0,s=>{SAVE.set.gslow=!!s},2,onoff);t.insertBefore(r,t.children[2]||null)};
 /* камера: на время жеста плавно подъезжает ближе и заходит сбоку-спереди, чтобы было видно лицо и позу */
 let cg=0,cgT=performance.now();const _rd=View3D.prototype.render;
 View3D.prototype.render=function(t,i){if(t===W&&i&&!i.noMap){const now=performance.now(),dt=Math.min(.1,(now-cgT)/1000);cgT=now;const on=!!t.gs;cg+=((on?1:0)-cg)*Math.min(1,dt*(on?5:3));
   if(cg>.004)i=Object.assign({},i,{D:i.D*(1-.42*cg),yaw:(i.yaw||0)+36*cg*(t.f||1),pitch:(i.pitch||0)+5*cg})}
  return _rd.call(this,t,i)}}

/* ---------- физика: жест тянет моторы суставов ---------- */
GP.gestStart=function(slot){const G=this,st=G.st;if(!st||!G.B)return;const id=((G.play?G.gsCfg:SAVE.gest)||[])[slot],g=byId[id];if(!g||(!G.play&&!own(id)))return;
 if(st.ragdoll||st.mode==="bar"||st.koT>0||G.footJ.length)return;
 const prev=G.gs;
 G.gs={g,t:0,hopped:false,lw:g.leg?1:0,air:st.mode==="air",flips:st.flips|0,ground:st.mode==="stuck"};
 /* комбо: жесты подряд (пауза до 4 с) дают больше */
 const now=G.time,ch=G.gchain&&now<G.gchain.end?G.gchain.n+1:1;G.gchain={n:ch,end:now+g.dur+4};G.gs.chain=ch;
 G.emit("gesture",{id:g.id,chain:ch,air:G.gs.air,flips:G.gs.flips});
 if(slowOn(G))FX.slow=Math.max(FX.slow,.1); /* слоумо начинается сразу, до следующего кадра */
 if(prev)G.gs.air=st.mode==="air"};
GP.gestStep=function(dt){const G=this,s=G.gs,st=G.st;if(!s||!st||!G.B||!G.J)return;
 if(st.ragdoll||st.mode==="bar"||st.koT>0||G.footJ.length){G.gs=null;return}
 s.t+=dt;if(s.t>=s.g.dur){G.gs=null;return}
 if(s.t<(s.g.slow||SLOW_T)&&slowOn(G))FX.slow=Math.max(FX.slow,.1); /* пока идёт «момент славы» — держим замедление (FX.slow сам гаснет за доли секунды) */
 const g=s.g,f=G.f,tgt=pose(g,s.t),w=weight(g,s.t),ground=st.mode==="stuck";
 /* прыжок с земли в нужный момент жеста */
 if(g.hop&&!s.hopped&&s.t>=g.hop.t){s.hopped=true;if(ground){G.unstick(true);for(const k in G.B){const b=G.B[k],v=b.getLinearVelocity();b.setLinearVelocity(V2(v.x,Math.max(v.y,0)+g.hop.v))}}}
 /* на земле ноги не трогаем (кроме подготовки к прыжку) */
 const legOn=g.leg===2||(g.leg&&(!ground||(g.hop&&!s.hopped)));s.lw+=((legOn?1:0)-s.lw)*Math.min(1,dt*14);
 for(let i=0;i<8;i++){const n=NAMES[i],legJ=i>=3,ww=w*(legJ?s.lw:1);if(ww<.01)continue;
  const js=n==="ank"?["ankL","ankR"]:[n];
  for(const jn of js){const j=G.J[jn];if(!j)continue;const base=jn.replace(/[LR]$/,""),cur=j.getJointAngle(),
    vm=CFG.vmax[base]*(CFG.vmaxJump||1),sp=clamp(CFG.kp*(tgt[i]*D2R*f-cur),-vm,vm);
   j.setMotorSpeed(j.getMotorSpeed()+(sp-j.getMotorSpeed())*ww);
   j.setMaxMotorTorque(Math.max(j.getMaxMotorTorque(),j.maxT*CFG.tqMul*ww+.02))}}
 /* жест начат с земли: пока персонаж в прыжке, держим корпус вертикально (иначе взмах руками раскручивает тело и он падает) — жест, начатый в полёте, не трогаем, чтобы не ломать сальто игрока */
 if(s.ground&&g.hop&&s.hopped&&st.mode==="air"&&s.t>g.hop.t+.3)G.weldFeet(false); /* приземлились на ноги после прыжка жеста — «прилипаем», как при зажатой кнопке прилипания (иначе стоя на ногах персонаж падает) */
 if(s.ground&&g.hop&&s.hopped&&st.mode==="air"){const tq=G.B.torso;let a=tq.getAngle()%TAU;if(a>Math.PI)a-=TAU;if(a<-Math.PI)a+=TAU;tq.applyTorque(-(28*a+4.5*tq.getAngularVelocity())*w,true)}};
{const _sp=GP.spawn;GP.spawn=function(s){this.gs=null;this.gchain=null;return _sp.call(this,s)}}
/* нажатия g1–g4 */
RKEYS.push("g1","g2","g3","g4");
{const _p=GP.press;GP.press=function(s){const r=_p.call(this,s);if(s&&s.length===2&&s[0]==="g"&&s>="g1"&&s<="g4")this.gestStart(+s[1]-1);return r}}
/* повторы: набор жестов — в конфиг записи */
{const _cf=cfgOf;cfgOf=function(){const o={gs:SAVE.gest.slice()},p=phraseOf({});if(p)o.ph={t:p.t,s:p.s};return Object.assign(_cf(),o)}; /* набор жестов и коронная фраза пишутся в повтор */
 const _ac=GP.applyCfg;GP.applyCfg=function(c){_ac.call(this,c);if(Array.isArray(c.gs)){this.gsCfg=c.gs.slice(0,NS);this.phCfg=c.ph&&c.ph.t?{t:cleanPhrase(c.ph.t),s:clamp(c.ph.s|0,0,PHS-1)}:null}};
 const _ps=GP.playStart;GP.playStart=function(...a){this.gsCfg=[];this.phCfg=null;return _ps.apply(this,a)}} /* старые повторы: без жестов и фразы */
/* повтор из файла или кода проходит через cleanEv, который выкидывает незнакомые поля конфига: возвращаем безопасные (жесты, турбины, фразу). Функция объявлена в скрипте ниже по странице — подключаем по load */
addEventListener("load",()=>{if(typeof cleanEv!=="function")return;const _ce=cleanEv;
 cleanEv=function(t){const e=_ce(t);try{for(const a of t){if(!Array.isArray(a)||(a[1]|0)!==4||!a[2]||typeof a[2]!=="object")continue;const c=e.find(x=>x[0]===(a[0]|0)&&x[1]===4);if(!c)continue;const o=a[2];
   if(Array.isArray(o.gs))c[2].gs=o.gs.slice(0,NS).map(x=>typeof x==="string"&&byId[x]?x:"");
   if(typeof o.tb==="string"&&/^gear_[a-z]{2}$/.test(o.tb))c[2].tb=o.tb;
   if(o.ph&&typeof o.ph==="object"&&o.ph.t)c[2].ph={t:cleanPhrase(o.ph.t),s:clamp(o.ph.s|0,0,PHS-1)}}}catch(x){}return e}});

/* ---------- коронная фраза: своя надпись вместо названия жеста ----------
   сама фраза — предмет ph_phrase (25⭐, до 25 символов); стиль 0 «Золото» входит в покупку, стили 1..7 — отдельные предметы ph_s1..ph_s7 (5–25⭐), все анимированные.
   показывается и в игре, и в повторе: фраза и стиль пишутся в конфиг повтора (ph) */
const PHS=8,PH_MAX=25,PH_WAVE=[5]; /* PH_WAVE — стили, где каждая буква анимируется отдельно */
const cleanPhrase=v=>[...String(v==null?"":v).replace(/[\u0000-\u001f\u007f<>]/g," ").replace(/\s+/g," ").trim()].slice(0,PH_MAX).join("");
const phOwned=()=>own("ph_phrase");
const phStyleOwned=i=>i===0||own("ph_s"+i);
/* что показывать вместо названия: в живой игре — своя фраза (если куплена и задана; неоплаченный стиль заменяем на золото), в повторе — та, что записана в повтор */
const phraseOf=G=>{if(G.play){const p=G.phCfg;return p&&p.t?p:null}const t=cleanPhrase(SAVE.phrase);if(!phOwned()||!t)return null;const s=clamp(SAVE.phraseStyle|0,0,PHS-1);return{t,s:phStyleOwned(s)?s:0}};
/* надпись в элементе el: текст, стиль 0..7, мелкая строка под ней (монеты, комбо); анимация появления перезапускается */
function showPhrase(el,text,style,sub){if(!el)return;style=clamp(style|0,0,PHS-1);for(let i=0;i<PHS;i++)el.classList.remove("phs"+i);el.classList.add("phs"+style);
 el.textContent="";const m=document.createElement("span");m.className="pht";
 if(PH_WAVE.includes(style)){[...text].forEach((ch,i)=>{const l=document.createElement("i");l.textContent=ch===" "?"\u00a0":ch;l.style.animationDelay=(i*.07)+"s";m.appendChild(l)})}else m.textContent=text;
 el.appendChild(m);
 if(sub){const s=document.createElement("small");s.textContent=sub;el.appendChild(s)}
 const len=[...text].length||1,vm=Math.min(innerWidth,innerHeight),bw=el.id==="skPhr"&&el.parentElement?el.parentElement.clientWidth:innerWidth; /* в превью «Скинов» ширину ограничивает панель, а не весь экран */
 m.style.fontSize=Math.max(11,Math.min(vm*(innerWidth<innerHeight?.1:.075),bw*.9/(len*.66)))+"px";
 el.classList.remove("on");void el.offsetWidth;el.classList.add("on");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("on"),2300)}
{const st=document.createElement("style");const CL="-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;";st.textContent=
 ".phr{position:absolute;left:50%;top:20%;transform:translateX(-50%);z-index:7;pointer-events:none;text-align:center;opacity:0;white-space:nowrap}.phr.on{animation:phIn 2.3s ease-out forwards}"+
 ".phr small{display:block;margin-top:.6vmin;font-size:2.8vmin;font-weight:800;color:#ffe27a;-webkit-text-fill-color:#ffe27a;text-shadow:0 .2vmin .6vmin rgba(0,0,0,.7)}.pht{display:inline-block;font-weight:900;font-style:italic;letter-spacing:.05em;line-height:1.15;padding:0 .1em}"+
 "@keyframes phIn{0%{opacity:0;transform:translateX(-50%) scale(.3) rotate(-8deg)}14%{opacity:1;transform:translateX(-50%) scale(1.22) rotate(2deg)}26%{transform:translateX(-50%) scale(1) rotate(0)}84%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-2.4vmin) scale(1.06)}}"+
 /* 0 Золото: полоса блеска пробегает по золотым буквам */
 ".phs0 .pht{background:linear-gradient(110deg,#a8650a 0%,#ffd24a 28%,#fffbe0 42%,#ffd24a 56%,#a8650a 100%);background-size:260% 100%;"+CL+"-webkit-text-stroke:.18vmin #6a3d00;filter:drop-shadow(0 .5vmin .7vmin rgba(0,0,0,.55));animation:phGold 1.8s linear infinite}@keyframes phGold{from{background-position:100% 0}to{background-position:0 0}}"+
 /* 1 Неон: мерцание неоновой трубки */
 ".phs1 .pht{color:#fff;-webkit-text-fill-color:#fff;font-style:normal;text-shadow:0 0 .6vmin #fff,0 0 1.6vmin #19d3ff,0 0 3.4vmin #19d3ff,0 0 6vmin #0a8cff;animation:phNeon 1.7s infinite}@keyframes phNeon{0%,18%,22%,62%,64%,100%{opacity:1}20%,24%,63%{opacity:.45;text-shadow:0 0 .3vmin #fff,0 0 1vmin #19d3ff}40%{text-shadow:0 0 .8vmin #fff,0 0 2.4vmin #19d3ff,0 0 5vmin #19d3ff,0 0 9vmin #0a8cff}}"+
 /* 2 Огонь: языки пламени — буквы дрожат, цвет течёт вверх */
 ".phs2 .pht{background:linear-gradient(0deg,#a80d0d,#ff4a1a,#ffb02e,#fff6a8,#ffb02e,#ff4a1a,#a80d0d);background-size:100% 220%;"+CL+"-webkit-text-stroke:.14vmin #5a0a00;transform-origin:50% 100%;animation:phFire .55s ease-in-out infinite alternate}@keyframes phFire{0%{background-position:0 0;filter:drop-shadow(0 0 1vmin rgba(255,110,20,.8));transform:scale(1,1) skewX(0)}50%{transform:scale(1.02,1.07) skewX(-3deg)}100%{background-position:0 100%;filter:drop-shadow(0 -.5vmin 2.4vmin rgba(255,200,40,.95));transform:scale(.99,1.04) skewX(3deg)}}"+
 /* 3 Лёд: мягкое парение и вспышки инея */
 ".phs3 .pht{background:linear-gradient(110deg,#7fc8ff 0%,#e8f8ff 30%,#fff 44%,#9ad8ff 60%,#4aa8f0 100%);background-size:240% 100%;"+CL+"-webkit-text-stroke:.16vmin #1a5fa0;animation:phIce 2.6s ease-in-out infinite}@keyframes phIce{0%{background-position:100% 0;transform:translateY(0);filter:drop-shadow(0 0 .6vmin rgba(120,210,255,.6))}50%{transform:translateY(-.9vmin);filter:drop-shadow(0 0 2vmin rgba(160,230,255,1))}100%{background-position:0 0;transform:translateY(0);filter:drop-shadow(0 0 .6vmin rgba(120,210,255,.6))}}"+
 /* 4 Радуга: бегущий спектр и покачивание */
 ".phs4 .pht{background:linear-gradient(90deg,#ff4fd8,#ffd24a,#4ee0a0,#19d3ff,#a77bff,#ff4fd8);background-size:300% 100%;"+CL+"-webkit-text-stroke:.14vmin rgba(20,10,40,.75);animation:phRb 2s linear infinite,phBob .9s ease-in-out infinite alternate}@keyframes phRb{to{background-position:300% 0}}@keyframes phBob{from{transform:translateY(-.5vmin) rotate(-1.5deg)}to{transform:translateY(.5vmin) rotate(1.5deg)}}"+
 /* 5 Комикс: каждая буква подпрыгивает по очереди, цвета чередуются */
 ".phs5 .pht{-webkit-text-stroke:.9vmin #111;paint-order:stroke fill;text-transform:uppercase;font-style:normal;letter-spacing:.02em;text-shadow:.5vmin .7vmin 0 #111;transform:rotate(-3deg)}.phs5 .pht i{display:inline-block;font-style:normal;animation:phJump .95s ease-in-out infinite;-webkit-text-fill-color:#ffe600;color:#ffe600}.phs5 .pht i:nth-child(4n+2){-webkit-text-fill-color:#ff5fb0;color:#ff5fb0}.phs5 .pht i:nth-child(4n+3){-webkit-text-fill-color:#4ee4ff;color:#4ee4ff}.phs5 .pht i:nth-child(4n){-webkit-text-fill-color:#8dff6a;color:#8dff6a}@keyframes phJump{0%,55%,100%{transform:translateY(0) rotate(0) scale(1)}25%{transform:translateY(-1.8vmin) rotate(-6deg) scale(1.14)}40%{transform:translateY(.2vmin) rotate(3deg) scale(.96)}}"+
 /* 6 Глитч: цифровые помехи — разъезд каналов RGB и срезы */
 ".phs6 .pht{color:#fff;-webkit-text-fill-color:#fff;font-style:normal;text-transform:uppercase;letter-spacing:.1em;text-shadow:.35vmin 0 #ff2a6d,-.35vmin 0 #19e3ff;animation:phGl 1.3s steps(1) infinite}@keyframes phGl{0%{transform:none;clip-path:none;text-shadow:.35vmin 0 #ff2a6d,-.35vmin 0 #19e3ff}10%{transform:translate(-.6vmin,.2vmin) skewX(-10deg);text-shadow:1vmin 0 #ff2a6d,-1vmin 0 #19e3ff}13%{transform:none;text-shadow:.35vmin 0 #ff2a6d,-.35vmin 0 #19e3ff}42%{transform:translate(.7vmin,-.2vmin) skewX(8deg);clip-path:inset(0 0 52% 0);text-shadow:-1.2vmin 0 #ff2a6d,1.2vmin 0 #19e3ff}45%{transform:translate(-.7vmin,.2vmin);clip-path:inset(48% 0 0 0)}48%{transform:none;clip-path:none}74%{transform:translateX(.5vmin);text-shadow:.8vmin .2vmin #ff2a6d,-.8vmin -.2vmin #19e3ff}77%{transform:none;text-shadow:.35vmin 0 #ff2a6d,-.35vmin 0 #19e3ff}}"+
 /* 7 Голограмма: поворот в объёме, линии развёртки и бегущий блик */
 ".phs7 .pht{background:repeating-linear-gradient(0deg,rgba(0,20,40,.38) 0 .28vmin,transparent .28vmin .56vmin),linear-gradient(100deg,#19d3ff 0%,#8f6bff 30%,#fff 46%,#ff4fd8 62%,#19d3ff 100%);background-size:100% 100%,280% 100%;"+CL+"-webkit-text-stroke:.14vmin rgba(255,255,255,.85);font-style:normal;letter-spacing:.08em;text-transform:uppercase;animation:phHolo 3.2s ease-in-out infinite}@keyframes phHolo{0%{background-position:0 0,100% 0;transform:perspective(70vmin) rotateY(-16deg);filter:drop-shadow(0 0 1.2vmin rgba(25,211,255,.9))}50%{transform:perspective(70vmin) rotateY(16deg);filter:drop-shadow(0 0 2.4vmin rgba(255,79,216,.9))}100%{background-position:0 0,0 0;transform:perspective(70vmin) rotateY(-16deg);filter:drop-shadow(0 0 1.2vmin rgba(25,211,255,.9))}}";
 document.head.appendChild(st)}

/* ---------- награда за стиль и подпись ---------- */
{const _em=GP.emit;GP.emit=function(s,t){if(s==="gesture"&&this===W){
   const g=byId[t.id],ph=phraseOf(this);let sub="";
   if(!RP&&lesson<0){ /* живая игра: монеты за стиль */
    const n=2+(t.air?1:0)+(t.flips>0?3:0)+Math.min(3,t.chain-1);
    SAVE.coins+=n;persist();sub="+"+n+" \u{1FA99}"}
   /* своя фраза (в повторе — записанная в нём) вместо названия жеста, иначе обычная подпись на языке игры; в повторе и обучении без монет */
   if(ph)showPhrase($("phr"),ph.t,ph.s,(t.chain>1?"×"+t.chain+"  ":"")+sub);
   else flash(g.ic+" "+gname(g)+(t.chain>1?"  ×"+t.chain:"")+(sub?"  "+sub:""),"#ffe27a",1500)}
  return _em.call(this,s,t)}}

/* ---------- кнопки в игре и клавиши 1–4 ---------- */
{const st=document.createElement("style");st.textContent=
 "#gbar{position:absolute;left:calc(env(safe-area-inset-left) + 17.6%);bottom:2.4%;display:flex;flex-direction:column;gap:1.2vmin;z-index:4}.zone.gb{position:relative;width:8vmin;height:8vmin;border-radius:50%;font-size:4.4vmin;padding:0;border:.25vmin solid rgba(255,255,255,.5);background:#10162440}.zone.gb.off{display:none}.zone.gb i{position:absolute;right:.4vmin;bottom:.1vmin;font-style:normal;font-size:1.9vmin;font-weight:800;opacity:.85}"+
 "body.ncp #gbar{display:none!important}"+
 "@media(orientation:portrait){#gbar{left:2%;bottom:calc(var(--sbm,44px) + 39%);gap:2vw}.zone.gb{width:12vw;height:12vw;font-size:6.2vw;border-width:.4vw}.zone.gb i{font-size:2.8vw}}";
 document.head.appendChild(st);
 const g=$("game");if(g){const bar=document.createElement("div");bar.id="gbar";for(let i=0;i<NS;i++){const b=document.createElement("button");b.className="zone gb";b.dataset.k="g"+(i+1);b.id="zG"+(i+1);bar.appendChild(b)}g.appendChild(bar);const phr=document.createElement("div");phr.id="phr";phr.className="phr";g.appendChild(phr)}}
function updGb(){for(let i=0;i<NS;i++){const b=$("zG"+(i+1));if(!b)continue;const g=byId[SAVE.gest[i]];b.classList.toggle("off",!g);b.innerHTML=g?g.ic+"<i>"+(i+1)+"</i>":"";b.title=g?gname(g):""}}
{const _as=applySettings;applySettings=function(){_as();updGb()};updGb()}
setTimeout(()=>{for(let i=0;i<NS;i++)keyMap[String(i+1)]="g"+(i+1)},0); /* keyMap объявлен ниже по скрипту */

/* ---------- визуально: поворот тела вокруг вертикальной оси и конфетти на пике (работает и в игре, и в повторе, и в превью) ---------- */
const spinAt=(g,t)=>{const k=g.spin;if(!k)return 0;if(t<=k[0][0])return k[0][1];const l=k[k.length-1];if(t>=l[0])return l[1];let i=0;while(k[i+1][0]<t)i++;const a=k[i],b=k[i+1];return a[1]+(b[1]-a[1])*sm((t-a[0])/(b[0]-a[0]))};
const CONF=["#ff4fd8","#ffd24a","#4ee0a0","#5bb8ff","#ff7a1a","#ffffff"];
function burst(V,p){const N=70,pos=new Float32Array(N*3),col=new Float32Array(N*3),vel=[],c=new T3.Color();
 for(let i=0;i<N;i++){pos[i*3]=p.x;pos[i*3+1]=p.y+.3;pos[i*3+2]=p.z;c.set(CONF[i%CONF.length]);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  const a=Math.random()*Math.PI*2,r=1+Math.random()*3.2;vel.push([Math.cos(a)*r,2.5+Math.random()*4.5,Math.sin(a)*r*1.4])}
 const geo=new T3.BufferGeometry();geo.setAttribute("position",new T3.Float32BufferAttribute(pos,3));geo.setAttribute("color",new T3.Float32BufferAttribute(col,3));
 const mat=new T3.PointsMaterial({size:.16,vertexColors:true,transparent:true,depthWrite:false}),pts=new T3.Points(geo,mat);pts.frustumCulled=false;V.scene.add(pts);(V._cf=V._cf||[]).push({pts,geo,mat,vel,age:0})}
function updConfetti(V,dt){const L=V._cf;if(!L||!L.length)return;
 for(let k=L.length-1;k>=0;k--){const c=L[k];c.age+=dt;const a=c.geo.attributes.position.array;
  for(let i=0;i<c.vel.length;i++){const v=c.vel[i];v[1]-=7*dt;v[0]*=.992;a[i*3]+=v[0]*dt;a[i*3+1]+=v[1]*dt;a[i*3+2]+=v[2]*dt}
  c.geo.attributes.position.needsUpdate=true;c.mat.opacity=Math.max(0,Math.min(1,(2.2-c.age)/.8));
  if(c.age>2.2){V.scene.remove(c.pts);c.geo.dispose();c.mat.dispose();L.splice(k,1)}}}
{const _pnG=View3D.prototype.poseNoomi,Y=new T3.Vector3(0,1,0),Q=new T3.Quaternion();
 View3D.prototype.poseNoomi=function(t){_pnG.call(this,t);const now=performance.now(),dt=Math.min(.1,(now-(this._gT||now))/1000);this._gT=now;
  const s=t&&t.gs;
  if(s&&s.g&&this.noomi&&t.B){const rig=this.noomi.rig,sp=spinAt(s.g,s.t);if(sp)rig.quaternion.premultiply(Q.setFromAxisAngle(Y,sp*Math.PI*2*((t.f||1)>0?1:-1)));
   const fx=s.g.fx;if(fx&&this._gP!=null&&this._gP<fx.t&&s.t>=fx.t&&rig.visible)burst(this,rig.position);this._gP=s.t}
  else this._gP=null;
  updConfetti(this,dt)}}

/* ---------- для экрана «Жесты»: поза суставов по времени и прямая кинематика для превью ---------- */
const BASE={shL:-166,shR:-166,neck:0,hipL:0,hipR:0,kneeL:0,kneeR:0,ankL:0,ankR:0};
function anglesAt(id,t){const g=byId[id],a=Object.assign({},BASE);if(!g)return{a,hop:0};
 const tt=clamp(t,0,g.dur),p=pose(g,tt),w=weight(g,tt);
 const m={shL:p[0],shR:p[1],neck:p[2],hipL:p[3],hipR:p[4],kneeL:p[5],kneeR:p[6],ankL:p[7],ankR:p[7]};
 for(const k in m)a[k]=BASE[k]+(m[k]-BASE[k])*(g.leg||/^(sh|neck)/.test(k)?w:0);
 let hop=0;if(g.hop&&tt>g.hop.t){const T=2*g.hop.v/9.81,u=(tt-g.hop.t)/T;if(u<1)hop=g.hop.v*g.hop.v/(2*9.81)*4*u*(1-u)*.8}
 return{a,hop}}
/* расставляет части «поддельной куклы» F.B (x,y,a) по углам суставов (в градусах), туловище стоит прямо в исходной точке */
function fk(B,a,dy){const R=(th,x,y)=>[x*Math.cos(th)-y*Math.sin(th),x*Math.sin(th)+y*Math.cos(th)];
 B.torso.x=PARTS.torso.c[0];B.torso.y=PARTS.torso.c[1];B.torso.a=0;
 for(const jn of["neck","shL","shR","hipL","hipR","kneeL","kneeR","ankL","ankR"]){const[pn,cn,anc]=JOINTS[jn],P=B[pn],th=P.a+(a[jn]||0)*D2R,pc=PARTS[pn].c,cc=PARTS[cn].c,
   [ax,ay]=R(P.a,anc[0]-pc[0],anc[1]-pc[1]),[cx,cy]=R(th,cc[0]-anc[0],cc[1]-anc[1]);B[cn].x=P.x+ax+cx;B[cn].y=P.y+ay+cy;B[cn].a=th}
 /* опустить куклу так, чтобы нижняя точка ног стояла на земле (-2.575), плюс высота прыжка */
 let low=1e9;for(const n of["footL","footR","calfL","calfR","thighL","thighR"]){const c=PARTS[n],b=B[n];let y;
   if(c.kind==="box")y=b.y-(Math.abs(Math.sin(b.a))*c.hw+Math.abs(Math.cos(b.a))*c.hh);else y=b.y-Math.abs(Math.cos(b.a))*c.hl-c.r;low=Math.min(low,y)}
 const sh=-2.575-low+(dy||0);for(const n in B)B[n].y+=sh}
window.__ncGest={list:GEST,byId,slots:()=>SAVE.gest,owned:own,price:id=>window.__ncPay?window.__ncPay.price(id):0,setSlot(i,id){SAVE.gest[i]=byId[id]&&own(id)?id:"";persist();applySettings()},anglesAt,fk,NS,
 name:gname,NM,PHS,PH_MAX,cleanPhrase,showPhrase,phOwned,phStyleOwned,PH_WAVE};
}
