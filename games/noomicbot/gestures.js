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
const osc=(n,dt,f)=>{const o=[];for(let i=0;i<=n;i++)o.push([i*dt].concat(f(i)));return o};
const GEST=[
 {id:"ge_victory",ru:"Победа",en:"Victory",ic:"\u{1F64C}",dur:1.6,leg:false,
  kf:[[0,10,10,14,0,0,0,0,0],[.28,10,10,18,0,0,0,0,0],[.5,-28,-28,18,0,0,0,0,0],[.7,10,10,18,0,0,0,0,0],[.9,-28,-28,18,0,0,0,0,0],[1.1,10,10,18,0,0,0,0,0],[1.6,10,10,18,0,0,0,0,0]]},
 {id:"ge_wave",ru:"Привет",en:"Wave",ic:"\u{1F44B}",dur:1.8,leg:false,
  kf:[[0,-30,-150,8,0,0,0,0,0],[.25,6,-150,10,0,0,0,0,0],[.5,-56,-150,10,0,0,0,0,0],[.75,6,-150,10,0,0,0,0,0],[1,-56,-150,10,0,0,0,0,0],[1.25,6,-150,10,0,0,0,0,0],[1.5,-56,-150,10,0,0,0,0,0],[1.8,-120,-150,0,0,0,0,0,0]]},
 {id:"ge_bow",ru:"Поклон",en:"Bow",ic:"\u{1F647}",dur:1.8,leg:true,
  kf:[[0,-150,-150,0,0,0,0,0,0],[.5,-125,-125,-34,92,92,0,0,6],[1.3,-125,-125,-34,92,92,0,0,6],[1.8,-150,-150,0,0,0,0,0,0]]},
 {id:"ge_super",ru:"Супермен",en:"Superman",ic:"\u{1F9B8}",dur:1.5,leg:true,
  kf:[[0,-85,-85,18,-12,-12,-8,-8,8],[.3,-85,-85,18,-12,-12,-8,-8,8],[1.5,-85,-85,18,-12,-12,-8,-8,8]]},
 {id:"ge_angel",ru:"Ласточка",en:"Swan",ic:"\u{1F54A}",dur:1.6,leg:true,
  kf:[[0,15,15,28,-15,-15,-25,-25,25],[.35,15,15,28,-15,-15,-25,-25,25],[1.6,15,15,28,-15,-15,-25,-25,25]]},
 {id:"ge_runner",ru:"Бегун",en:"Sprinter",ic:"\u{1F3C3}",dur:1.8,leg:true,
  kf:osc(6,.3,i=>i%2?[-35,-115,6,-15,92,-15,-105,-12,0]:[-115,-35,6,92,-15,-105,-12,-15,0])},
 {id:"ge_star",ru:"Звезда",en:"Star jump",ic:"⭐",dur:1.6,leg:true,hop:{t:.18,v:3.3},
  kf:[[0,-60,-60,0,30,30,-40,-40,0],[.18,-60,-60,0,30,30,-40,-40,0],[.4,14,14,14,58,-14,-4,-4,0],[1.1,14,14,14,58,-14,-4,-4,0],[1.6,14,14,14,58,-14,-4,-4,0]]},
 {id:"ge_joy",ru:"Радость",en:"Joy",ic:"\u{1F389}",dur:1.7,leg:true,hop:{t:.24,v:3.6},
  kf:[[0,-120,-120,0,0,0,0,0,0],[.22,-150,-150,-10,62,62,-95,-95,-12],[.3,12,12,14,0,0,-4,-4,0],[.8,12,12,16,26,26,-50,-50,0],[1.2,12,12,16,6,6,-8,-8,0],[1.7,12,12,16,6,6,-8,-8,0]]},
 {id:"ge_dance",ru:"Танец",en:"Dance",ic:"\u{1F483}",dur:2,leg:true,
  kf:osc(8,.25,i=>i%2?[-110,-30,6,40,-6,-60,-6,0,0]:[-30,-110,6,-6,40,-6,-60,0,0])},
 {id:"ge_mill",ru:"Мельница",en:"Windmill",ic:"\u{1F300}",dur:1.8,leg:false,
  kf:osc(9,.2,i=>i%2?[-140,10,-4,0,0,0,0,0,0]:[10,-140,-4,0,0,0,0,0,0])}
];
const byId={};for(const g of GEST)byId[g.id]=g;
for(const L in I18N){const ru=["ru","uk","be"].includes(L);for(const g of GEST)I18N[L]["ge.n."+g.id]=ru?"Жест «"+g.ru+"»":"Gesture: "+g.en} /* подпись в счёте на оплату */
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
 G.gs={g,t:0,hopped:false,lw:g.leg?1:0,air:st.mode==="air",flips:st.flips|0};
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
 const legOn=g.leg&&(!ground||(g.hop&&!s.hopped));s.lw+=((legOn?1:0)-s.lw)*Math.min(1,dt*14);
 for(let i=0;i<8;i++){const n=NAMES[i],legJ=i>=3,ww=w*(legJ?s.lw:1);if(ww<.01)continue;
  const js=n==="ank"?["ankL","ankR"]:[n];
  for(const jn of js){const j=G.J[jn];if(!j)continue;const base=jn.replace(/[LR]$/,""),cur=j.getJointAngle(),
    vm=CFG.vmax[base]*(CFG.vmaxJump||1),sp=clamp(CFG.kp*(tgt[i]*D2R*f-cur),-vm,vm);
   j.setMotorSpeed(j.getMotorSpeed()+(sp-j.getMotorSpeed())*ww);
   j.setMaxMotorTorque(Math.max(j.getMaxMotorTorque(),j.maxT*CFG.tqMul*ww+.02))}}};
{const _sp=GP.spawn;GP.spawn=function(s){this.gs=null;this.gchain=null;return _sp.call(this,s)}}
/* нажатия g1–g4 */
RKEYS.push("g1","g2","g3","g4");
{const _p=GP.press;GP.press=function(s){const r=_p.call(this,s);if(s&&s.length===2&&s[0]==="g"&&s>="g1"&&s<="g4")this.gestStart(+s[1]-1);return r}}
/* повторы: набор жестов — в конфиг записи */
{const _cf=cfgOf;cfgOf=function(){return Object.assign(_cf(),{gs:SAVE.gest.slice()})};
 const _ac=GP.applyCfg;GP.applyCfg=function(c){_ac.call(this,c);if(Array.isArray(c.gs))this.gsCfg=c.gs.slice(0,NS)};
 const _ps=GP.playStart;GP.playStart=function(...a){this.gsCfg=[];return _ps.apply(this,a)}} /* старые повторы: без жестов */

/* ---------- награда за стиль и подпись ---------- */
{const _em=GP.emit;GP.emit=function(s,t){if(s==="gesture"&&this===W&&!RP&&lesson<0){
   const n=2+(t.air?1:0)+(t.flips>0?3:0)+Math.min(3,t.chain-1);
   SAVE.coins+=n;persist();
   const g=byId[t.id],nm=["ru","uk","be"].includes(LANG)?g.ru:g.en;
   flash(g.ic+" "+nm+(t.chain>1?"  ×"+t.chain:"")+"  +"+n+" \u{1FA99}","#ffe27a",1500)}
  return _em.call(this,s,t)}}

/* ---------- кнопки в игре и клавиши 1–4 ---------- */
{const st=document.createElement("style");st.textContent=
 "#gbar{position:absolute;left:calc(env(safe-area-inset-left) + 17.6%);bottom:2.4%;display:flex;flex-direction:column;gap:1.2vmin;z-index:4}.zone.gb{position:relative;width:8vmin;height:8vmin;border-radius:50%;font-size:4.4vmin;padding:0;border:.25vmin solid rgba(255,255,255,.5);background:#10162440}.zone.gb.off{display:none}.zone.gb i{position:absolute;right:.4vmin;bottom:.1vmin;font-style:normal;font-size:1.9vmin;font-weight:800;opacity:.85}"+
 "body.ncp #gbar{display:none!important}"+
 "@media(orientation:portrait){#gbar{left:2%;bottom:calc(var(--sbm,44px) + 39%);gap:2vw}.zone.gb{width:12vw;height:12vw;font-size:6.2vw;border-width:.4vw}.zone.gb i{font-size:2.8vw}}";
 document.head.appendChild(st);
 const g=$("game");if(g){const bar=document.createElement("div");bar.id="gbar";for(let i=0;i<NS;i++){const b=document.createElement("button");b.className="zone gb";b.dataset.k="g"+(i+1);b.id="zG"+(i+1);bar.appendChild(b)}g.appendChild(bar)}}
function updGb(){for(let i=0;i<NS;i++){const b=$("zG"+(i+1));if(!b)continue;const g=byId[SAVE.gest[i]];b.classList.toggle("off",!g);b.innerHTML=g?g.ic+"<i>"+(i+1)+"</i>":"";b.title=g?(["ru","uk","be"].includes(LANG)?g.ru:g.en):""}}
{const _as=applySettings;applySettings=function(){_as();updGb()};updGb()}
setTimeout(()=>{for(let i=0;i<NS;i++)keyMap[String(i+1)]="g"+(i+1)},0); /* keyMap объявлен ниже по скрипту */

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
 name:g=>["ru","uk","be"].includes(LANG)?g.ru:g.en};
}
