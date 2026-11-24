/* ---------- Физические элементы: пружина, тарзанка (канат), доска для прыжков, бассейн + три карты с ними ----------
   Вставляется скриптом scripts/build_noomic_plus.py после ui.js (видит Game, GP, pl, V2, CFG, MAPS, View3D, T3...).
   Элементы описываются в map.props (тип, позиция, размеры); у Game.loadMap они превращаются в динамические тела planck,
   а Game.propStep (зовётся каждый физический шаг перед world.step) добавляет пружинные силы и воду.
   Всё детерминировано (фиксированный шаг, Math.random не используется) — повторы и запись работают как раньше. */
{
const PI=Math.PI,cl=(v,a,b)=>v<a?a:v>b?b:v,NEWT={spring:1,rope:1,board:1,pool:1};

/* ================= физика ================= */
const _lm=GP.loadMap;
GP.loadMap=function(s){const r=_lm.call(this,s);this.buildProps();return r};

GP.buildProps=function(){
  this.props=[];this.splashes=[];this.splT=-9;
  const M=this.M,P=M&&M.props;if(!P||!P.length)return;
  const w=this.world,g=this.ground,CF=CAT_WORLD,mk=(x,y,a,o)=>w.createBody(Object.assign({type:"dynamic",position:V2(x,y),angle:a||0},o||{}));
  P.forEach((p,pi)=>{
    if(p.t==="spring"){
      const a=p.a||0,ux=-Math.sin(a),uy=Math.cos(a),h=cl(p.h||1.2,.5,3.2),wd=cl(p.w||1.6,.8,5),trav=Math.min(h*.58,1.7),px=p.x+ux*h,py=p.y+uy*h;
      const b=mk(px,py,a,{fixedRotation:true}),fx=b.createFixture(pl.Box(wd/2,.09),{friction:.9,density:1,restitution:0,filterCategoryBits:CF,filterMaskBits:CAT_BODY});
      b.setMassData({mass:.7,center:V2(0,0),I:.7*(wd*wd+.04)/12});
      const sd={prop:1,n:"spring"};b.solid=sd;fx.solid=sd;
      /* жёсткость: ёмкость пружины ~ 0.5*k*trav² (~50–130 Дж), чтобы большой ход давал больший выстрел */
      this.props.push({t:"spring",p,b,ux,uy,h,wd,trav,k:330/Math.pow(h,.8),up:2.4,cd:1.2,cu:.3,pm:.7,tr:0,sp:0,pos0:[px,py],a0:a,load:0,wasC:0});
    }else if(p.t==="rope"){
      const L=cl(p.len||6,3,12),a0=p.a||0;
      const b=mk(p.x,p.y,a0,{angularDamping:.07});
      b.createFixture(pl.Box(.03,L/2,V2(0,-L/2),0),{density:1,filterCategoryBits:CF,filterMaskBits:0});
      b.createFixture(pl.Box(.3,.05,V2(0,-L),0),{density:4,filterCategoryBits:CF,filterMaskBits:0});
      const j=w.createJoint(pl.RevoluteJoint({collideConnected:false,enableMotor:true,maxMotorTorque:.02,motorSpeed:0,localAnchorA:V2(p.x,p.y),localAnchorB:V2(0,0),referenceAngle:a0},g,b));
      const offs=[L];for(let d=1;d<=3;d++)if(L-d*1.05>1.6)offs.push(L-d*1.05);
      const rt={t:"rope",p,b,j,L,pos0:[p.x,p.y],a0,offs,bi:[]};
      offs.forEach((d,k)=>{
        const wp=b.getWorldPoint(V2(0,-d));
        if(k===0){const mi=M.bars.findIndex(o=>o.prop===p.id);if(mi>=0&&this.bars[mi]){this.bars[mi].body=b;this.bars[mi].local=V2(0,-d);rt.bi.push(mi);return}}
        this.bars.push({x:wp.x,y:wp.y,z:0,body:b,local:V2(0,-d)});rt.bi.push(this.bars.length-1)});
      this.props.push(rt);
    }else if(p.t==="board"){
      const s=p.dir<0?-1:1,len=cl(p.len||4,2.5,8),th=cl(p.th||.26,.12,.5),a0=p.a||0,m=1.3;
      const b=mk(p.x,p.y,a0),fx=b.createFixture(pl.Box(len/2,th/2,V2(s*len/2,0),0),{friction:.9,density:1,restitution:0,filterCategoryBits:CF,filterMaskBits:CAT_BODY});
      b.setMassData({mass:m,center:V2(s*len/2,0),I:m*len*len/12+m*(len/2)*(len/2)});
      const sd={prop:1,n:"board"};b.solid=sd;fx.solid=sd;
      const dn=.7,upA=.55,j=w.createJoint(pl.RevoluteJoint({enableLimit:true,lowerAngle:s>0?-dn:-upA,upperAngle:s>0?upA:dn,collideConnected:false,localAnchorA:V2(p.x,p.y),localAnchorB:V2(0,0),referenceAngle:a0},g,b));
      this.props.push({t:"board",p,b,j,s,len,th,m,k:900*Math.pow(4.2/len,.7),up:2.2,cd:7,cu:1.2,pos0:[p.x,p.y],a0,load:0,phi:0});
    }else if(p.t==="pool"){
      this.props.push({t:"pool",p,x0:p.x-p.w/2,x1:p.x+p.w/2,y0:p.y-p.h/2,y1:p.y+p.h/2,wet:{}});
    }
  })};

/* возвращает платформы/доски в начальное положение (при каждом спавне — повторы воспроизводятся одинаково) */
GP.resetProps=function(){if(!this.props)return;for(const r of this.props){if(!r.b)continue;r.b.setTransform(V2(r.pos0[0],r.pos0[1]),r.a0);r.b.setLinearVelocity(V2(0,0));r.b.setAngularVelocity(0);r.b.setAwake(true);r.load=0;r.wasC=0;if(r.wet)r.wet={}}
  this.splashes=[]};
const _sp=GP.spawn;GP.spawn=function(s){this.resetProps();return _sp.call(this,s)};

const loadedOn=(b)=>{let n=0;for(let c=b.getContactList();c;c=c.next)if(c.contact.isTouching()&&c.other.part)n++;return n};
GP.propStep=function(dt){
  const P=this.props;if(!P||!P.length)return;const st=this.st,inp=this.inp,B=this.B,g=CFG.g;
  for(const r of P){
    if(r.t==="spring"){
      const b=r.b;let pp=b.getPosition(),vv=b.getLinearVelocity();
      /* вместо призматического шарнира (в движке его нет): платформа ездит только вдоль оси, с упорами на ходе */
      let tr=(pp.x-r.pos0[0])*r.ux+(pp.y-r.pos0[1])*r.uy,sp=vv.x*r.ux+vv.y*r.uy;
      if(tr<-r.trav){tr=-r.trav;if(sp<0)sp=0}else if(tr>0){tr=0;if(sp>0)sp=0}
      b.setPosition(V2(r.pos0[0]+r.ux*tr,r.pos0[1]+r.uy*tr));b.setLinearVelocity(V2(r.ux*sp,r.uy*sp));b.setAngle(r.a0);
      const comp=Math.max(0,-tr);r.tr=tr;r.sp=sp;
      const n=loadedOn(b),charge=!!(st&&st.mode==="stuck"&&inp.tuck&&this.welds.some(j=>j.getBodyA()===b||j.getBodyB()===b));
      let F=r.k*comp*(sp>0&&!charge?r.up:1)-(charge?7:sp<0?r.cd:r.cu)*sp;
      if(charge)F-=r.k*r.trav*.9;                 /* «приседание» на пружине: продавливаем платформу, отпускание = прыжок с отдачей */
      if(sp>15)F-=(sp-15)*20;                     /* потолок скорости выброса */
      b.applyForceToCenter(V2(r.ux*F,r.uy*F+r.pm*g),true);
      if(n&&sp>2.4&&r.wasC>.22&&st){st.onTramp=true;st.air=Math.max(st.air,.2);this.emit("bounce");r.wasC=0}
      r.wasC=Math.max(comp,r.wasC*.9);r.load=n;
    }else if(r.t==="board"){
      const b=r.b,al=b.getAngle(),om=b.getAngularVelocity(),phi=al-r.a0,th=r.s*phi,wv=r.s*om;r.phi=th;
      const n=loadedOn(b),charge=!!(st&&st.mode==="stuck"&&inp.tuck&&this.welds.some(j=>j.getBodyA()===b||j.getBodyB()===b));
      let T=-r.k*th*(wv>0&&th<0?r.up:1)-(wv>0?r.cu:r.cd)*wv;
      if(charge)T-=r.k*.5;
      const wmax=10.5/r.len;if(wv>wmax){b.setAngularVelocity(r.s*wmax)}
      b.applyTorque(r.s*T+r.s*r.m*g*(r.len/2)*Math.cos(al),true);
      r.load=n;
      if(n&&st&&wv>2.2&&th<-.12&&!r.kick){r.kick=1;st.onTramp=true;st.air=Math.max(st.air,.2);this.emit("bounce")}if(th>-.04)r.kick=0;
    }else if(r.t==="pool"&&B){
      let any=false;
      for(const id in B){const b=B[id],pp=b.getPosition();
        const inn=pp.x>r.x0&&pp.x<r.x1&&pp.y<r.y1&&pp.y>r.y0-3;if(!inn){r.wet[id]=0;continue}
        const v=b.getLinearVelocity(),m=b.getMass();
        if(!r.wet[id]){r.wet[id]=1;if(Math.abs(v.y)>1.5&&this.time-this.splT>.35){this.splT=this.time;this.splashes.push({x:pp.x,y:r.y1,t:this.time,v:Math.min(14,Math.abs(v.y))})}}
        const k=Math.exp(-dt*3.2);b.setLinearVelocity(V2(v.x*k,v.y*Math.exp(-dt*3.6)));b.setAngularVelocity(b.getAngularVelocity()*Math.exp(-dt*3.4));
        b.applyForceToCenter(V2(0,m*g*.88),true);any=true}
      r.any=any;
    }
  }};

/* ================= 3D ================= */
const LM=c=>new T3.MeshLambertMaterial({color:c}),BM=(c,o)=>new T3.MeshBasicMaterial(Object.assign({color:c},o||{}));
function mkSpring(p){
  const g=new T3.Group(),h=cl(p.h||1.2,.5,3.2),wd=cl(p.w||1.6,.8,5);g.position.set(p.x,p.y,0);g.rotation.z=p.a||0;
  const base=new T3.Mesh(new T3.BoxGeometry(wd*.95,.18,1.2),LM(0x2c2f38));base.position.y=.09;g.add(base);
  const top=new T3.Mesh(new T3.BoxGeometry(wd,.2,1.6),LM(0xf2b21c));g.add(top);
  const stripe=new T3.Mesh(new T3.BoxGeometry(wd*.96,.215,.5),LM(0x222222));stripe.position.z=0;top.add(stripe);
  const N=9,rings=[],tg=new T3.TorusGeometry(Math.min(.34,wd*.24),.05,6,18),steel=LM(0xaebbd0);
  for(let i=0;i<N;i++){const m=new T3.Mesh(tg,steel);m.rotation.x=PI/2;g.add(m);rings.push(m)}
  const rod=new T3.Mesh(new T3.CylinderGeometry(.05,.05,1,6),LM(0x6d7482));g.add(rod);
  return{g,upd(r){const y=h+r.tr;top.position.y=y;const span=Math.max(.05,y-.2-.08);for(let i=0;i<N;i++){rings[i].position.y=.2+span*(i+.5)/N;rings[i].rotation.z=(i%2?.16:-.16)}rod.scale.y=Math.max(.01,y-.1);rod.position.y=(y+.1)/2}}}
function mkRope(p){
  const g=new T3.Group(),L=cl(p.len||6,3,12);g.position.set(p.x,p.y,0);
  const rope=new T3.Mesh(new T3.CylinderGeometry(.035,.035,L,6),LM(0xa88655));rope.position.y=-L/2;g.add(rope);
  const handle=new T3.Mesh(new T3.BoxGeometry(.62,.11,.24),LM(0x7a5230));handle.position.y=-L;g.add(handle);
  const knot=new T3.SphereGeometry(.085,8,6),km=LM(0x8f6a3c);
  for(let d=1;d<=3;d++)if(L-d*1.05>1.6){const k=new T3.Mesh(knot,km);k.position.y=-(L-d*1.05);g.add(k)}
  const ring=new T3.Mesh(new T3.TorusGeometry(.09,.03,6,10),LM(0x555555));g.add(ring);
  return{g,upd(r){g.rotation.z=r.b.getAngle()}}}
function mkBoard(p){
  const g=new T3.Group(),s=p.dir<0?-1:1,len=cl(p.len||4,2.5,8),th=cl(p.th||.26,.12,.5);g.position.set(p.x,p.y,0);
  const plank=new T3.Mesh(new T3.BoxGeometry(len,th,1.3),LM(0x1b8fd0));plank.position.x=s*len/2;g.add(plank);
  const top=new T3.Mesh(new T3.BoxGeometry(len*.98,th*.2,1.2),LM(0xeaf3fb));top.position.set(s*len/2,th*.5+.005,0);g.add(top);
  for(let i=1;i<7;i++){const t=new T3.Mesh(new T3.BoxGeometry(.05,th*.22,1.2),LM(0xb5c6d6));t.position.set(s*(len*(i/7)),th*.5+.012,0);g.add(t)}
  const hinge=new T3.Mesh(new T3.CylinderGeometry(.16,.16,1.4,10),LM(0x3a3f4a));hinge.rotation.x=PI/2;g.add(hinge);
  return{g,upd(r){g.rotation.z=r.b.getAngle()}}}
function mkPool(p){
  const g=new T3.Group(),w=p.w,h=p.h;g.position.set(p.x,p.y,0);
  const body=new T3.Mesh(new T3.BoxGeometry(w,h,3),BM(0x2ab4ff,{transparent:true,opacity:.5,depthWrite:false}));body.renderOrder=6;g.add(body);
  const surf=new T3.Mesh(new T3.BoxGeometry(w,.1,3.05),BM(0xbdefff,{transparent:true,opacity:.75,depthWrite:false}));surf.position.y=h/2;surf.renderOrder=7;g.add(surf);
  const dots=[],dg=new T3.SphereGeometry(.07,6,5),dm=BM(0xffffff,{transparent:true,opacity:.9,depthWrite:false});
  for(let i=0;i<26;i++){const d=new T3.Mesh(dg,dm);d.visible=false;d.renderOrder=8;dots.push(d);g.add(d)}
  return{g,upd(r,t){surf.position.y=h/2+Math.sin(t.time*2.2)*.025;let k=0;
    for(const sp of t.splashes||[]){const age=t.time-sp.t;if(age>1.1||age<0)continue;
      for(let j=0;j<13&&k<dots.length;j++,k++){const vx=(j-6)*.34,vy=2.2+sp.v*.3*(.4+(j%4)*.2),d=dots[k];d.visible=true;d.position.set(sp.x-p.x+vx*age,sp.y-p.y+vy*age-4.9*age*age,((j%3)-1)*.5);d.scale.setScalar(Math.max(.2,1-age*.8))}}
    for(;k<dots.length;k++)dots[k].visible=false}}}
const PVB={spring:mkSpring,rope:mkRope,board:mkBoard,pool:mkPool};

const _be=View3D.prototype.buildExt;
View3D.prototype.buildExt=function(o,s){if(_be)_be.call(this,o,s);this.propV=[];const P=o.M&&o.M.props;if(!P)return;
  P.forEach((p,i)=>{const f=PVB[p.t];if(!f)return;const v=f(p);v.i=i;s.add(v.g);this.propV.push(v)})};
const _ue=View3D.prototype.updExt;
View3D.prototype.updExt=function(t){if(_ue)_ue.call(this,t);if(!this.propV||!t.props)return;for(const v of this.propV){const r=t.props[v.i];if(r)v.upd(r,t)}};

/* ================= карты ================= */
const D=(x,y,w,h,o)=>Object.assign({c:[x,y],u:[w,0],v:[0,h],z:0,d:2.5,k:"r",n:"x",p:"Map"},o||{});
const DC=(x,y,w,h,z,dd,col)=>({c:[x,y],u:[w,0],v:[0,h],z,d:dd,k:"r",n:"d",p:"ext",col});
const mkMap=(name,names,lv)=>({lv,name,names,tags:[],solids:[],bars:[],spawns:[],deco:[],movers:[],gears:{},props:[],killY:-25,ext:false});
const pole=(m,x,y,col)=>{for(const z of[-.95,.95])m.deco.push(DC(x,y/2,.1,y,z,.05,col||0x7a7f8a))};
const fin=m=>{m.tags=[];if(m.bars.length)m.tags.push("bars");if(m.solids.length)m.tags.push("floor");if(m.props.some(p=>p.t==="spring"||p.t==="board"))m.tags.push("tramp");m.tags.push("moving");return m};

function mapSpring(){
  const m=mkMap("sp_park",{ru:"Пружинный парк",uk:"Пружинний парк",en:"Spring Park"},7);
  m.solids.push(D(32,-1,130,2,{d:9,col:0x6f7681,n:"floor"}),D(-18,16,1,36,{col:0x9aa1ad,n:"wallL"}),D(88,16,1,36,{col:0x9aa1ad,n:"wallR"}));
  const bar=(x,y,col)=>{m.bars.push({x,y,z:0});pole(m,x,y,col)};
  /* пружины: встаньте на неё, держите «Группировку» — платформа продавится, отпустите — выстрел с отдачей. Или падайте на неё сверху. */
  m.props.push({t:"spring",id:"s1",x:-8,y:0,w:2,h:1.1});                     bar(-8,7.2);bar(-2.5,8.6);
  m.props.push({t:"spring",id:"s2",x:6,y:0,w:2.2,h:2.1});                    bar(6,13.6,0xb0603a);bar(12,14.8,0xb0603a);
  m.props.push({t:"spring",id:"s3",x:20,y:0,w:2,h:1.6,a:-.45});              bar(28,10.5);bar(34,11.8);
  m.solids.push(D(48,2,5,4,{col:0xd0503f,n:"pod"}));
  m.props.push({t:"spring",id:"s4",x:48,y:4,w:2.2,h:1.5});                   bar(48,14.4,0xb0603a);bar(54,15.6,0xb0603a);
  m.props.push({t:"spring",id:"s5",x:62,y:0,w:2,h:1.6,a:.5},{t:"spring",id:"s6",x:76,y:0,w:2,h:1.6,a:-.5});
  bar(69,13,0x3a8fb0);bar(69,18.5,0x3a8fb0);
  m.spawns.push({x:-8,y:2.4},{x:6,y:3.6},{x:20.7,y:3.2},{x:48,y:6.4},{x:61.3,y:3.2},{x:76.7,y:3.2},{x:-14,y:.5},{x:-1,y:.5},{x:14,y:.5},{x:42,y:.5},{x:56,y:.5});
  return fin(m)}

function mapRope(){
  const m=mkMap("sp_tarzan",{ru:"Тарзанка",uk:"Тарзанка",en:"Jungle Swing"},7);
  const brown=0x7a5230,leaf=0x2f8f4a;
  m.solids.push(D(-30,4.5,30,9,{col:0x6b4f2f,n:"cliffL"}),D(15,4.5,12,9,{col:0x6b4f2f,n:"isle"}),D(56,4.5,36,9,{col:0x6b4f2f,n:"cliffR"}),D(20,-22,200,2,{d:9,col:0x1b2a1f,n:"abyss"}));
  const tree=(x,top)=>{m.deco.push(DC(x,top/2,1.1,top,-2.4,.5,brown),DC(x,top+.2,5,.5,-1.6,.9,brown),DC(x-.6,top+1.6,5.5,3,-2.4,2,leaf));};
  tree(-4,22);tree(26,22);
  /* тарзанки: держитесь за рукоять или узлы, раскачивайтесь («Прогиб» / «Группировка» раскачивают), отпускайте на взлёте вперёд */
  const A1=-.8,A2=-.8,L1=10,L2=10;
  m.props.push({t:"rope",id:"r1",x:-4,y:22,len:L1,a:A1},{t:"rope",id:"r2",x:26,y:22,len:L2,a:A2});
  m.bars.push({x:-4+L1*Math.sin(A1),y:22-L1*Math.cos(A1),z:0,prop:"r1"},{x:26+L2*Math.sin(A2),y:22-L2*Math.cos(A2),z:0,prop:"r2"});
  m.spawns.push({x:-20,y:9.6},{x:15,y:9.6},{x:46,y:9.6});
  return fin(m)}

function mapBoard(){
  const m=mkMap("sp_pool",{ru:"Бассейн: вышка",uk:"Басейн: вишка",en:"Diving Pool"},6);
  const tile=0xcfe6ee,deck=0xe9d9b0;
  m.solids.push(D(-9,-1,38,2,{col:deck,n:"deckL"}),D(53,-1,26,2,{col:deck,n:"deckR"}));
  m.solids.push(D(9.6,-3.1,1,6.4,{col:tile,n:"wallL"}),D(39.6,-3.1,1,6.4,{col:tile,n:"wallR"}),D(24.6,-5.5,31,1,{col:tile,n:"floor"}));
  m.deco.push(DC(24.6,-2.2,29,5.4,-1.9,.1,0x8fd8ee));
  /* бассейн: вода (физика + картинка) */
  m.props.push({t:"pool",id:"w1",x:24.6,y:-2.6,w:29,h:4.6});
  /* 1-метровая доска слева: стойте на конце, держите «Группировку» — доска прогнётся, отпустите — прыжок */
  m.solids.push(D(1.8,.5,5,1,{col:0xc9ccd2,n:"ped1"}));
  m.props.push({t:"board",id:"b1",x:3.2,y:1.12,len:5.6,th:.26,dir:1,a:.07});
  /* 3-метровая вышка справа, доска смотрит влево */
  m.solids.push(D(46,1.5,5,3,{col:0xc9ccd2,n:"ped3"}));
  m.props.push({t:"board",id:"b3",x:44.2,y:3.12,len:6.2,th:.26,dir:-1,a:-.08});
  /* перекладины над водой и батут на палубе */
  m.bars.push({x:19,y:9,z:0},{x:30,y:9,z:0});pole(m,19,9,0x9aa1ad);pole(m,30,9,0x9aa1ad);
  m.solids.push(Object.assign(D(-14,.25,5,.5,{col:0x2c2c30,n:"tramp"}),{bounce:1,k:"t",d:.8}));
  m.spawns.push({x:8.1,y:3.2},{x:38.9,y:5.4},{x:-3,y:.5},{x:-16,y:.5},{x:56,y:.5});
  return fin(m)}
MAPS.push(mapSpring(),mapRope(),mapBoard());

/* ================= конструктор карт: пружина, тарзанка, доска, бассейн ================= */
const RUN={spring:"Пружина",rope:"Тарзанка",board:"Доска",pool:"Бассейн"},ENN={spring:"Spring",rope:"Rope swing",board:"Diving board",pool:"Pool"};
for(const L in I18N)for(const k in RUN)I18N[L]["mk."+k]=["ru","uk","be"].includes(L)?(L==="uk"?{spring:"Пружина",rope:"Тарзанка",board:"Дошка",pool:"Басейн"}[k]:RUN[k]):ENN[k];
for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?{"x.propHint":"Пружина, тарзанка, доска и бассейн ведут себя по законам физики"}:{"x.propHint":"Spring, rope swing, diving board and pool use real physics"});

addEventListener("DOMContentLoaded",()=>{
  if(typeof PIECES==="undefined")return;
  Object.assign(PIECES,{spring:{w:1.8,h:1.2,icon:"⇕",key:"mk.spring"},rope:{w:.5,h:6,icon:"⭯",key:"mk.rope"},board:{w:4.5,h:.3,icon:"▭",key:"mk.board"},pool:{w:8,h:2.5,icon:"≈",key:"mk.pool"}});
  Object.assign(ED_COL,{spring:"#f2b21c",rope:"#a88655",board:"#1b8fd0",pool:"#2ab4ff"});
  /* рисование в редакторе */
  const _dp=drawPiece;
  drawPiece=function(e,t,s){
    if(!NEWT[t.t])return _dp(e,t,s);
    const n=EDIT.view.z,P=(lx,ly)=>{const q=toWorld(t,lx,ly);return W2S(q[0],q[1])},line=(a,b)=>{e.beginPath();e.moveTo(a[0],a[1]);e.lineTo(b[0],b[1]);e.stroke()};
    e.save();e.lineCap="round";e.lineJoin="round";
    const hl=s?"#ffb02e":"rgba(0,0,0,.4)";
    if(t.t==="pool"){const c=[P(-t.w/2,-t.h/2),P(t.w/2,-t.h/2),P(t.w/2,t.h/2),P(-t.w/2,t.h/2)];e.fillStyle="rgba(42,180,255,.55)";e.beginPath();c.forEach((q,i)=>i?e.lineTo(q[0],q[1]):e.moveTo(q[0],q[1]));e.closePath();e.fill();e.strokeStyle=s?"#ffb02e":"#1f8fd0";e.lineWidth=s?3:2;e.stroke();
      e.strokeStyle="rgba(255,255,255,.8)";e.lineWidth=2;e.beginPath();for(let i=0;i<=24;i++){const q=P(-t.w/2+t.w*i/24,t.h/2-.06*Math.sin(i*1.4));i?e.lineTo(q[0],q[1]):e.moveTo(q[0],q[1])}e.stroke()}
    else if(t.t==="spring"){const bl=P(0,-t.h/2),tp=P(0,t.h/2);
      e.fillStyle="#2c2f38";const a=P(-t.w*.45,-t.h/2),b=P(t.w*.45,-t.h/2);e.strokeStyle="#2c2f38";e.lineWidth=Math.max(4,.16*n);line(a,b);
      e.strokeStyle="#c9d3e4";e.lineWidth=Math.max(2.5,.06*n);e.beginPath();e.moveTo(bl[0],bl[1]);const N=8;for(let i=0;i<N;i++){const y0=-t.h/2+t.h*(i+.5)/N,x0=(i%2?1:-1)*Math.min(.32,t.w*.22);const q=P(x0,y0);e.lineTo(q[0],q[1])}e.lineTo(tp[0],tp[1]);e.stroke();
      e.strokeStyle=s?"#ffb02e":"#a06a00";e.lineWidth=Math.max(5,.2*n);const c=P(-t.w/2,t.h/2),d=P(t.w/2,t.h/2);line(c,d);e.strokeStyle="#f2b21c";e.lineWidth=Math.max(3.5,.14*n);line(c,d)}
    else if(t.t==="rope"){const top=P(0,t.h/2),bot=P(0,-t.h/2);
      e.strokeStyle="rgba(0,0,0,.2)";e.lineWidth=5;line(top,bot);e.strokeStyle="#a88655";e.lineWidth=Math.max(2.5,.07*n);line(top,bot);
      e.fillStyle=s?"#ffb02e":"#555";e.beginPath();e.arc(top[0],top[1],Math.max(5,.12*n),0,PI*2);e.fill();
      const h1=P(-.3,-t.h/2),h2=P(.3,-t.h/2);e.strokeStyle="#7a5230";e.lineWidth=Math.max(4,.12*n);line(h1,h2);
      /* дуга возможного качания */
      e.setLineDash([6,6]);e.strokeStyle="rgba(255,255,255,.55)";e.lineWidth=1.5;const an=W2S(toWorld(t,0,t.h/2)[0],toWorld(t,0,t.h/2)[1]);e.beginPath();e.arc(an[0],an[1],t.h*n,PI*.15,PI*.85);e.stroke();e.setLineDash([])}
    else if(t.t==="board"){const sg=t.flip?-1:1,x0=-sg*t.w/2,a=P(x0,0),b=P(x0+sg*t.w,0);
      e.strokeStyle="rgba(0,0,0,.25)";e.lineWidth=Math.max(7,t.h*n+3);line(a,b);e.strokeStyle="#1b8fd0";e.lineWidth=Math.max(5,t.h*n);line(a,b);e.strokeStyle="#eaf3fb";e.lineWidth=Math.max(2,t.h*n*.35);line(a,b);
      e.fillStyle=s?"#ffb02e":"#3a3f4a";e.beginPath();e.arc(a[0],a[1],Math.max(6,.18*n),0,PI*2);e.fill();
      e.fillStyle="#fff";e.font="bold "+Math.max(11,.5*n)+"px system-ui";e.textAlign="center";e.textBaseline="middle";const m=P(x0+sg*t.w*.5,t.h/2+.5);e.fillText(sg>0?"→":"←",m[0],m[1])}
    e.restore()};
  /* перевод деталей в игровую карту */
  const _pm=pieceToMap;
  pieceToMap=function(ed){
    const std=ed.pieces.filter(p=>!NEWT[p.t]),m=_pm(Object.assign({},ed,{pieces:std}));m.props=[];let lo=1e9;
    for(const n of ed.pieces){if(!NEWT[n.t])continue;const a=n.a||0,c=Math.cos(a),s=Math.sin(a);
      if(n.t==="spring"){const h=cl(n.h,.5,3.2),bx=n.x+s*h/2,by=n.y-c*h/2;m.props.push({t:"spring",id:n.id,x:bx,y:by,w:n.w,h:h,a});lo=Math.min(lo,by)}
      else if(n.t==="rope"){const L=cl(n.h,3,12),ax=n.x-s*L/2,ay=n.y+c*L/2;m.props.push({t:"rope",id:n.id,x:ax,y:ay,len:L,a});m.bars.push({x:ax+L*Math.sin(a),y:ay-L*Math.cos(a),z:0,prop:n.id});lo=Math.min(lo,ay-L)}
      else if(n.t==="board"){const sg=n.flip?-1:1,len=cl(n.w,2.5,8),px=n.x+(-sg*len/2)*c,py=n.y+(-sg*len/2)*s;m.props.push({t:"board",id:n.id,x:px,y:py,len,th:cl(n.h,.12,.5),dir:sg,a});lo=Math.min(lo,py-len)}
      else if(n.t==="pool"){m.props.push({t:"pool",id:n.id,x:n.x,y:n.y,w:n.w,h:n.h});lo=Math.min(lo,n.y-n.h/2)}}
    if(m.props.length){if(!m.tags.includes("moving"))m.tags.push("moving");if(m.props.some(p=>p.t==="spring"||p.t==="board")&&!m.tags.includes("tramp"))m.tags.push("tramp");if(!m.tags.includes("bars")&&m.bars.length)m.tags.push("bars");m.killY=Math.min(m.killY,lo-15)}
    return m};
  /* кнопка «Отразить» для доски */
  const _eu=edUI;
  edUI=function(){_eu();const s=EDIT.sel,t=$("edPal");if(s&&s.t==="board"&&t){const b=document.createElement("button");b.className="edP";b.innerHTML='<span class="ei">⇋</span><span>'+T("mk.flip")+"</span>";b.onclick=()=>{pushUndo();s.flip=!s.flip;commit()};t.insertBefore(b,t.children[2]||null)}};
  /* подсказка при первом запуске карты */
  const HR={"x.h_sp_park":"Встань на пружину, держи «Группировку» и отпусти — выстрел! Или падай на неё сверху.","x.h_sp_tarzan":"Держись за рукоять или узел, раскачивайся и отпускай на взлёте вперёд.","x.h_sp_pool":"Стой на конце доски, держи «Группировку» и отпусти — прыжок в бассейн."},
    HE={"x.h_sp_park":"Stand on a spring, hold Tuck and release to launch — or land on it from above.","x.h_sp_tarzan":"Hold the handle or a knot, swing, and let go on the upswing.","x.h_sp_pool":"Stand at the end of the board, hold Tuck and release to dive into the pool."};
  for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?HR:HE);
  const _sg=startGame,seen={};
  startGame=function(){const r=_sg.apply(this,arguments);try{const M=W&&W.M;if(M&&!M.custom&&M.props&&M.props.length&&!seen[M.name]&&window.__ncPay){seen[M.name]=1;window.__ncPay.toast(T("x.h_"+M.name))}}catch(e){}return r};
  try{syncCustom()}catch(e){}
});
}
