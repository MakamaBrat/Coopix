/* ---------- «Супер экстрим» в стиле Vice City (GTA VI): спрайтовое оформление четырёх карт ----------
   Спрайты вырезаны из присланных листов (games/noomicbot/vice_src → vice_assets.json) и стоят в 3D-сцене плоскостями на разной глубине:
   дальние слои (небо, панорама города и моря) чуть едут за камерой (параллакс), ближние стоят на месте. Физика карт не затронута. */
{
const VA=NC_VICE_ASSETS,TXC={},MTC={};
const rng=seed=>{let a=seed>>>0||1;return()=>(a=(Math.imul(a,1664525)+1013904223)>>>0)/4294967296};
function tex(n){let t=TXC[n];if(t)return t;const im=new Image();t=TXC[n]=new T3.CanvasTexture(im);im.onload=()=>{t.needsUpdate=true};im.src=VA[n].u;t.userData={ar:VA[n].w/VA[n].h};return t}
const mat=(n,o={})=>{const k=n+"|"+(o.tint||"")+"|"+(o.add?1:0);let m=MTC[k];if(!m){m=MTC[k]=new T3.MeshBasicMaterial({map:tex(n),transparent:true,alphaTest:.04,side:T3.DoubleSide,depthWrite:o.dw!==false,color:o.tint==null?16777215:o.tint,fog:false});if(o.add)m.blending=T3.AdditiveBlending}return m};
const GEO=new T3.PlaneGeometry(1,1);
const AR=n=>VA[n].w/VA[n].h;
/* спрайт: h — высота в метрах (или w — ширина), y — низ спрайта, flip — зеркально, par — как сильно слой едет за камерой (0..1) */
function spr(V,g,n,o){const h=o.h||(o.w/AR(n)),w=o.w||(h*AR(n)),m=new T3.Mesh(GEO,mat(n,o));m.scale.set(o.flip?-w:w,h,1);m.position.set(o.x,(o.y||0)+h/2,o.z||0);if(o.ro!=null)m.renderOrder=o.ro;m.userData.vice=1;g.add(m);if(o.par||o.parY){m.userData.px=o.x;m.userData.py=m.position.y;m.userData.par=o.par||0;m.userData.parY=o.parY||0;V.viceL.push(m)}return m}
/* ряд зданий/пальм вдоль карты: случайный подбор из списка с зазорами */
function row(V,g,names,o){const R=rng(o.seed||7);let x=o.x0;while(x<o.x1){const n=names[(R()*names.length)|0],h=o.h[0]+R()*(o.h[1]-o.h[0]),w=h*AR(n),flip=o.flip&&R()<.5&&!/shop_|hotel_|neon_|billboard/.test(n);spr(V,g,n,{x:x+w/2,y:o.y||0,z:o.z+(o.zj?(R()-.5)*o.zj:0),h,flip,tint:o.tint});x+=w+o.gap[0]+R()*(o.gap[1]-o.gap[0])}}
/* убрать старое оформление: pred(mesh,params) — true → скрыть */
function hide(g,pred){g.children.forEach(c=>{if(c.userData.vice||!c.geometry)return;const p=c.geometry.parameters||{};try{if(pred(c,p))c.visible=false}catch(e){}})}
const paint=(c,hex)=>{if(c.material&&c.material.color){c.material=c.material.clone();c.material.color.setHex(hex);c.material.map=null;c.material.needsUpdate=true}};
function backdrop(V,g,o){/* закатное небо + панорама Vice: общий для всех карт */
  spr(V,g,"sky",{x:o.x,y:o.skyY,z:-470,w:2900,par:.985,parY:.94,ro:-3});
  spr(V,g,"skyline",{x:o.x,y:o.hz-.41*467,z:-420,w:1400,par:.95,parY:.9,ro:-2})}

const SH=["shop_market","shop_diner","shop_donuts","shop_liquor","shop_auto"],HT=["hotel_pink","hotel_pink2","hotel_cream","hotel_mint","hotel_mural"],PM=["palm1","palm2","palm3","palm_big"];

function sceneHighway(V,M,g){
  hide(g,(c,p)=>(p.depth===10&&c.material.map)||(c.geometry.type==="SphereGeometry"&&p.radius>40));
  g.children.forEach(c=>{if(!c.geometry||c.userData.vice)return;const p=c.geometry.parameters||{};if(c.geometry.type==="PlaneGeometry"&&p.width===1e3)(p.height===90?paint(c,15779240):tiled(c,"walk",120,24));if(p.width===1e3&&p.depth===200)paint(c,4468576)});
  backdrop(V,g,{x:45,skyY:-90,hz:-2});
  flat(g,"road",420,18,45,.004,0,84,3);flat(g,"walk",420,7.5,45,.006,-13.2,105,1.5);
  row(V,g,HT.concat(["neon_hotel","neon_motel","neon_cafe"]),{x0:-160,x1:380,z:-78,h:[18,26],gap:[0,8],seed:11,zj:10});
  row(V,g,SH.concat(["wh_sand"]),{x0:-150,x1:380,z:-46,h:[9,12],gap:[3,14],seed:5,zj:6});
  for(const x of[-60,70,200,330])spr(V,g,"strip",{x,y:0,z:-27,h:26});
  row(V,g,PM,{x0:-150,x1:380,z:-14,h:[11,16],gap:[10,30],seed:3,zj:4,flip:true});
  /* встречные машины вместо коробок: те же группы, спрайты смотрят влево */
  const cars=["car_sedan","car_conv","car_police","car_sedan","moto"];
  (V.traffic||[]).forEach((t,i)=>{while(t.g.children.length)t.g.remove(t.g.children[0]);const n=cars[i%cars.length],w=n==="moto"?2.3:4.8;spr(V,t.g,n,{x:0,y:0,z:0,w,flip:true})})
}

/* подпись на канве: неоновая табличка */
function sign(txt,col,bg,w=512,h=128,f="bold 64px sans-serif"){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=col;x.lineWidth=6;x.strokeRect(5,5,w-10,h-10);x.font=f;x.textAlign="center";x.textBaseline="middle";x.shadowColor=col;x.shadowBlur=18;x.fillStyle="#fff";const L=txt.split("|");L.forEach((t,i)=>x.fillText(t,w/2,h/2+(i-(L.length-1)/2)*h/(L.length+.5)));return new T3.CanvasTexture(c)}
/* дорога и тротуар в стиле присланной полосы: сиренево-коричневый асфальт и персиковая плитка (рисуем на канве, без лишнего веса) */
function paveTex(kind){const c=document.createElement("canvas"),W=512,H=kind==="road"?256:128;c.width=W;c.height=H;const x=c.getContext("2d"),R=rng(kind==="road"?5:9);
  if(kind==="road"){const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#5b4358");gr.addColorStop(1,"#4a3548");x.fillStyle=gr;x.fillRect(0,0,W,H);x.fillStyle="#e8a8b8";x.fillRect(0,0,W,6);x.fillRect(0,H-6,W,6);x.fillStyle="rgba(255,225,235,.55)";x.fillRect(0,12,W,2);x.fillRect(0,H-14,W,2);for(let i=0;i<2200;i++){x.fillStyle="rgba("+(R()<.5?"255,235,255":"20,8,24")+","+(R()*.07).toFixed(3)+")";x.fillRect(R()*W,R()*H,1+R()*2,1)}}
  else{x.fillStyle="#d9a487";x.fillRect(0,0,W,H);const tw=64;for(let r=0;r*32<H;r++){for(let q=-1;q*tw<W;q++){const ox=(r%2)*tw/2;x.fillStyle="hsl("+(18+R()*8)+","+(38+R()*12)+"%,"+(66+R()*8)+"%)";x.fillRect(q*tw+ox+1,r*32+1,tw-2,30)}}x.fillStyle="rgba(70,30,40,.22)";for(let r=0;r*32<H;r++)x.fillRect(0,r*32,W,1)}
  const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;return t}
const flat=(g,tx,w,d,x,y,z,rx,rz)=>{const t=paveTex(tx);t.repeat.set(rx,rz);const m=new T3.Mesh(GEO,new T3.MeshBasicMaterial({map:t}));m.rotation.x=-Math.PI/2;m.scale.set(w,d,1);m.position.set(x,y,z);m.userData.vice=1;g.add(m);return m};
const tiled=(c,kind,rx,rz)=>{const t=paveTex(kind);t.repeat.set(rx,rz);c.material=c.material.clone();c.material.map=t;c.material.color.setHex(kind==="road"?10526880:16777215);c.material.needsUpdate=true};
const retex=(c,t)=>{c.material=c.material.clone();c.material.map=t;c.material.color.setHex(16777215);c.material.needsUpdate=true};

function scenePlanes(V,M,g){
  backdrop(V,g,{x:50,skyY:-70,hz:-60});
  /* облака — розовые, подсвеченные закатом */
  g.traverse(c=>{const m=c.material;if(m&&m.emissive&&m.emissive.getHex()===9414335){if(!m.userData.vp){m.userData.vp=1;m.emissive.setHex(6962794);m.color.setHex(15246024)}}});
  /* Vice Air вместо коробочных самолётов: тот же размер и направление, коллизии не меняются */
  V.vehicles.forEach(v=>{const mv=(M.movers||[]).find(m=>m.id===v.id);if(!mv||!mv.look||mv.look.t!=="plane")return;const l=mv.look,f=l.f<0?-1:1;v.g.children.forEach(c=>{c.visible=false});spr(V,v.g,"plane",{x:l.r+f*13,y:l.y-1.55,z:0,w:28,flip:f<0})})
}
function sceneTower(V,M,g){
  hide(g,(c,p)=>p.depth===10&&c.material.map);
  g.children.forEach(c=>{if(!c.geometry||c.userData.vice)return;const p=c.geometry.parameters||{};if(p.width===900&&p.depth===400)paint(c,4863304);if(p.width===900&&p.height===160)tiled(c,"road",75,16);if(p.width===240&&p.height===2)paint(c,5981016);if(p.width===26.2&&p.height===38)paint(c,16107224)});
  backdrop(V,g,{x:10,skyY:-90,hz:-1});
  row(V,g,HT.concat(["neon_hotel","neon_motel"]),{x0:-230,x1:250,z:-100,h:[34,48],gap:[0,6],seed:21,zj:12});
  row(V,g,HT.concat(SH,["neon_cafe"]),{x0:-210,x1:240,z:-58,h:[14,22],gap:[2,10],seed:8,zj:8});
  row(V,g,PM,{x0:-160,x1:190,z:-22,h:[16,24],gap:[14,40],seed:4,zj:5,flip:true});
  row(V,g,["palm1","palm2","palm_big"],{x0:-40,x1:60,z:-6,h:[10,14],gap:[28,40],seed:9,flip:true})
}
function sceneMetro(V,M,g){
  hide(g,(c,p)=>(p.width===200&&p.height===120)||(p.width===70&&p.height===30));
  backdrop(V,g,{x:-40,skyY:-80,hz:1});
  spr(V,g,"metro",{x:-58,y:0,z:-38,h:34});
  row(V,g,HT.concat(["neon_hotel"]),{x0:-190,x1:-10,z:-92,h:[26,38],gap:[0,6],seed:31,zj:10});
  row(V,g,SH,{x0:-170,x1:-30,z:-62,h:[10,14],gap:[2,8],seed:12,zj:6});
  row(V,g,PM,{x0:-110,x1:-22,z:-14,h:[11,15],gap:[12,20],seed:6,zj:3,flip:true});
  /* подземка: розово-неоновая отделка и вывески Vice Metro */
  const names=["OCEAN BEACH","LITTLE HAVANA","STARFISH ISLE","LEONIDA KEYS","PORT GELLHORN","DOWNTOWN","VICE POINT","GRASSRIVERS"],cols=["#ff5fb0","#3ec1d3","#ffd34d","#b57bff"];let k=0;
  g.children.forEach(c=>{if(!c.geometry||c.userData.vice||!c.material)return;const p=c.geometry.parameters||{};
    if(p.width===55&&p.height===3.5)paint(c,13606796);
    else if(p.width===112&&p.height===1.5)paint(c,15976920);
    else if(p.width===26&&p.height===20)c.material=(c.material=c.material.clone(),c.material.color.setHex(16765418),c.material);
    else if(p.width===28&&p.height===.5)paint(c,15976920);
    else if(p.width===130&&p.height===14)c.material=(c.material=c.material.clone(),c.material.color.setHex(16764906),c.material);
    else if(p.width===130&&p.height===.6)paint(c,14696602);
    else if(p.width===9&&p.height===1.6)retex(c,sign("VICE METRO","#ff3fa4","#1a0b2e",768,136,"bold 78px sans-serif"));
    else if(p.width===3&&p.height===2){retex(c,sign(names[k%8],cols[k%4],"#1a0b2e",256,170,"bold 30px sans-serif"));k++}})
}
/* ================= Новая карта «Vice: перестрелка» ================= */
const hs=(a,b)=>{let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
function buildViceMap(){
  const d=(x,y,w,h,o={})=>Object.assign({c:[x,y],u:[w,0],v:[0,h],z:0,d:2.5,k:"r",n:"x",p:"ext"},o),
        p=(x,y,w,h,z,dd,col,o={})=>Object.assign({c:[x,y],u:[w,0],v:[0,h],z:z,d:dd,k:"r",n:"d",p:"ext",col:col},o);
  const s={name:"ext_vice",names:{ru:"Vice: перестрелка",uk:"Vice: перестрілка",en:"Vice Shootout"},scene:"vice",killY:-20,solids:[],bars:[],spawns:[],deco:[],movers:[],guns:[],roofs:[]};
  s.solids.push(d(90,-1,520,2,{d:9,col:5981016,n:"road"}));
  const STEEL=9213086,CAB=6521440;
  /* наземные турники: на двух стойках */
  const ground=(x,y=2.8)=>{s.bars.push({x,y,z:0});for(const z of[-.95,.95])s.deco.push(p(x,y/2,.1,y,z,.05,7173248))};
  /* висячие: на тросах от балки */
  const hang=(x,y,gy)=>{s.bars.push({x,y,z:0});for(const z of[-.9,.9])s.deco.push(p(x,(y+gy)/2,.05,gy-y,z,.03,CAB))};
  /* балка с опорами */
  const girder=(x0,x1,gy)=>{s.deco.push(p((x0+x1)/2,gy+.2,x1-x0,.4,0,.9,STEEL));for(const x of[x0,x1,(x0+x1)/2])s.deco.push(p(x,gy/2,.5,gy,-2.2,.5,STEEL))};
  [-26,-19.5,-13].forEach(x=>ground(x));
  const A1=[[-6,8],[0.5,10],[7,8.6],[13.5,11.4],[20,10],[26.5,12.6],[33,11]];
  girder(-8,35,23);A1.forEach(([x,y])=>hang(x,y,23));
  const A2=[[52,15.5],[58.5,17.6],[65,16],[71.5,18.8],[78,17.4],[84.5,20.2],[91,18.4]];
  girder(50,93,31);A2.forEach(([x,y])=>hang(x,y,31));
  [[98,13],[104.5,9.5],[111,6.2]].forEach(([x,y])=>hang(x,y,31));
  [117.5,124,130.5].forEach(x=>ground(x,2.9));
  const A3=[[158,10.5],[164.5,12.8],[171,11.2],[177.5,14],[184,12.6],[190.5,15.2],[197,13.6]];
  girder(156,199,26);A3.forEach(([x,y])=>hang(x,y,26));
  [206,212.5,219].forEach(x=>ground(x,3));
  /* крыши со стрелками: площадка-плита; здание под ней рисует сцена */
  const roof=(x,y,w,n)=>{s.solids.push(d(x,y-.3,w,.6,{col:12626616,n:"roof"}));s.roofs.push({x,y,w,n})};
  roof(42,14,16,"hotel_pink");roof(144,12,16,"hotel_mint");
  for(const x of[36.5,47.5,138.5,149.5]){const y=x<100?17.6:15.6;s.bars.push({x,y,z:0});for(const z of[-.95,.95])s.deco.push(p(x,y-1.2,.08,2.4,z,.04,7173248))}
  /* стрелки: x, y — где стоят ноги; r — дальность; per — пауза между выстрелами; acc — разброс */
  [[-2,0],[27,0],[62,0],[98,0],[124,0],[162,0],[196,0],[42,14],[144,12],[71,0],[181,0]].forEach(([x,y],i)=>s.guns.push({x,y,r:30,per:6+hs(i,3)*3,acc:.1}));
  s.spawns.push({x:-30,y:.5},{x:-22,y:.5},{x:112,y:.5},{x:225,y:.5});
  s.tags=["bars","floor","moving"];s.glassN=0;s.ext=true;s.gears={};
  return s}
MAPS.push(buildViceMap());

/* стрельба: детерминированная (одинаково при записи и повторе): всё считается от времени и состояния мира */
GP.viceStep=function(dt){const M=this.M,G=M&&M.guns;if(!G||!this.B||!this.st)return;
  const T=this.B.torso,tp=T.getPosition(),tv=T.getLinearVelocity(),n=this.stepN;
  const vb=this.vb||(this.vb=[]),gt=this.vgt||(this.vgt=G.map((g,i)=>3.5+hs(i,7)*5)),fl=this.vfl||(this.vfl=G.map(()=>-999));
  this.vgc=(this.vgc||0)-dt;for(let i=0;i<G.length;i++){const g=G[i];gt[i]-=dt;if(gt[i]>0||this.vgc>0)continue;
    const dir=tp.x>=g.x?1:-1,mx=g.x+dir*.8,my=g.y+1.65,dx=tp.x-mx,dy=tp.y-my,d=Math.hypot(dx,dy);
    if(d>g.r||d<2){gt[i]=.3;continue}
    gt[i]=g.per*(.8+hs(n,i)*.5);this.vgc=1.6;
    const sp=24,tt=d/sp,a=Math.atan2(tp.y+tv.y*tt*.6-my,tp.x+tv.x*tt*.6-mx)+(hs(n,i+99)-.5)*g.acc*2;
    vb.push({x:mx,y:my,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0});fl[i]=n;if(vb.length>48)vb.shift()}
  if(this.vhc>0)this.vhc-=dt;
  for(let k=vb.length-1;k>=0;k--){const b=vb[k];b.x+=b.vx*dt;b.y+=b.vy*dt;b.t+=dt;let dead=b.t>2.2||b.y<.05;
    if(!dead&&!(this.vhc>0)){for(const id in this.B){const q=this.B[id],pp=q.getPosition();if((pp.x-b.x)*(pp.x-b.x)+(pp.y-b.y)*(pp.y-b.y)<.22){
      const m=q.getMass();q.applyLinearImpulse(V2(b.vx*m*.14,b.vy*m*.14+m*1.2),q.getWorldCenter(),true);
      if(this.st.mode==="bar"&&hs(n,id.length)<.6)this.release();this.vhc=1.1;this.emit("hit",{vx:b.vx>0?2:-2});dead=true;break}}}
    if(dead)vb.splice(k,1)}};
{const _sp=GP.spawn;GP.spawn=function(s){this.vb=[];this.vgt=null;this.vfl=null;this.vhc=0;this.vgc=0;return _sp.call(this,s)}}

const glow=(c0,c1)=>{const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d"),r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,c0);r.addColorStop(.35,c1);r.addColorStop(1,"rgba(255,120,0,0)");x.fillStyle=r;x.fillRect(0,0,64,64);return new T3.CanvasTexture(c)};
function sceneVice(V,M,g){
  backdrop(V,g,{x:90,skyY:-90,hz:-2});
  /* земля: дорога с бордюром, тротуар, песок */
  flat(g,"road",520,18,90,.004,0,104,3);flat(g,"walk",520,7.5,90,.006,-13.2,130,1.5);
  const sand=new T3.Mesh(GEO,new T3.MeshBasicMaterial({color:15779240}));sand.rotation.x=-Math.PI/2;sand.scale.set(900,110,1);sand.position.set(90,.001,-70);sand.userData.vice=1;g.add(sand);
  const near=new T3.Mesh(GEO,new T3.MeshBasicMaterial({color:6176088}));near.rotation.x=-Math.PI/2;near.scale.set(900,80,1);near.position.set(90,.001,49);near.userData.vice=1;g.add(near);
  row(V,g,HT.concat(["neon_hotel","neon_motel","neon_cafe"]),{x0:-120,x1:340,z:-84,h:[18,28],gap:[0,8],seed:41,zj:10});
  row(V,g,SH.concat(["wh_sand"]),{x0:-110,x1:330,z:-44,h:[9,12],gap:[3,14],seed:15,zj:6});
  for(const x of[-40,90,220,350])spr(V,g,"strip",{x,y:0,z:-27,h:26});
  row(V,g,PM,{x0:-110,x1:330,z:-16,h:[11,16],gap:[10,26],seed:13,zj:4,flip:true});
  for(const r of M.roofs)spr(V,g,r.n,{x:r.x,y:0,z:-1.6,h:r.y});
  /* укрытия: полицейские машины рядом со стрелками на земле */
  M.guns.forEach((q,i)=>{if(q.y===0)spr(V,g,i%3===1?"car_sedan":"car_police",{x:q.x+(i%2?3.2:-3.2),y:0,z:-1.2,w:4.8,flip:i%2===0})});
  /* стрелки + вспышки + пули */
  V.viceG=M.guns.map(q=>{const m=spr(V,g,"cop_aim",{x:q.x,y:q.y,z:q.y?-1.2:-1.9,h:1.95});const f=new T3.Mesh(GEO,new T3.MeshBasicMaterial({map:glow("rgba(255,255,230,1)","rgba(255,200,60,.8)"),transparent:true,blending:T3.AdditiveBlending,depthWrite:false}));f.scale.set(1.5,1.5,1);f.renderOrder=20;f.material.depthTest=false;f.visible=false;f.userData.vice=1;g.add(f);return {m,f,q}});
  const tr=glow("rgba(255,255,255,1)","rgba(255,90,170,.95)");V.viceB=[];
  for(let k=0;k<48;k++){const b=new T3.Mesh(GEO,new T3.MeshBasicMaterial({map:tr,transparent:true,blending:T3.AdditiveBlending,depthWrite:false}));b.scale.set(3.4,.7,1);b.renderOrder=20;b.material.depthTest=false;b.visible=false;b.userData.vice=1;g.add(b);V.viceB.push(b)}
}
const SC={highway:sceneHighway,sky:scenePlanes,tower:sceneTower,metro:sceneMetro,vice:sceneVice};
const _be=View3D.prototype.buildExt;
View3D.prototype.buildExt=function(o,s){_be.call(this,o,s);this.viceL=[];const f=SC[o.M&&o.M.scene];const k=f?1e-4:1,so=this.skyObj;if(so){so.clouds.scale.setScalar(k);so.stars.scale.setScalar(k)}if(f){try{f(this,o.M,s)}catch(e){window.__viceErr=e;console.warn("vice",e)}}};
const _rd=View3D.prototype.render;
View3D.prototype.render=function(t,i){const L=this.viceL;if(L&&L.length&&this.extScene&&SC[this.extScene])for(const m of L){const d=m.userData;m.position.x=d.px+i.cx*d.par;if(d.parY)m.position.y=d.py+i.cy*d.parY}
  if(this.viceG&&t&&t.M&&t.M.guns&&this.viceB){const tp=t.B&&t.B.torso&&t.B.torso.getPosition(),n=t.stepN,fl=t.vfl;
    this.viceG.forEach((o,k)=>{const dir=tp&&tp.x<o.q.x?-1:1;o.m.scale.x=Math.abs(o.m.scale.x)*dir;const fresh=!!fl&&n>=fl[k]&&n-fl[k]<7;o.f.visible=fresh;if(fresh){const s=2.6+(n%3)*.4;o.f.position.set(o.q.x+dir*1.15,o.q.y+1.65,.3);o.f.scale.set(s,s,1)}});
    const vb=t.vb||[];this.viceB.forEach((m,k)=>{const b=vb[k];m.visible=!!b;if(b){m.position.set(b.x,b.y,.3);m.rotation.z=Math.atan2(b.vy,b.vx)}})}
  return _rd.call(this,t,i)};
}
