/* ---------- «Супер экстрим» в стиле Vice City (GTA VI): спрайтовое оформление четырёх карт ----------
   Спрайты вырезаны из присланных листов (games/noomiclone/vice_src → vice_assets.json) и стоят в 3D-сцене плоскостями на разной глубине:
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
  g.children.forEach(c=>{if(!c.geometry||c.userData.vice)return;const p=c.geometry.parameters||{};if(c.geometry.type==="PlaneGeometry"&&p.width===1e3)paint(c,p.height===90?15779240:14202496);if(p.width===1e3&&p.depth===200)paint(c,4468576)});
  backdrop(V,g,{x:45,skyY:-90,hz:-2});
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
const retex=(c,t)=>{c.material=c.material.clone();c.material.map=t;c.material.color.setHex(16777215);c.material.needsUpdate=true};

function scenePlanes(V,M,g){
  backdrop(V,g,{x:50,skyY:-70,hz:-60});
  /* облака — розовые, подсвеченные закатом */
  g.traverse(c=>{const m=c.material;if(m&&m.emissive&&m.emissive.getHex()===9414335){if(!m.userData.vp){m.userData.vp=1;m.emissive.setHex(8991631);m.color.setHex(16764391)}}});
  /* Vice Air вместо коробочных самолётов: тот же размер и направление, коллизии не меняются */
  V.vehicles.forEach(v=>{const mv=(M.movers||[]).find(m=>m.id===v.id);if(!mv||!mv.look||mv.look.t!=="plane")return;const l=mv.look,f=l.f<0?-1:1;v.g.children.forEach(c=>{c.visible=false});spr(V,v.g,"plane",{x:l.r+f*13,y:l.y-1.55,z:0,w:28,flip:f<0})})
}
function sceneTower(V,M,g){
  hide(g,(c,p)=>p.depth===10&&c.material.map);
  g.children.forEach(c=>{if(!c.geometry||c.userData.vice)return;const p=c.geometry.parameters||{};if(p.width===900&&p.depth===400)paint(c,7022699);if(p.width===900&&p.height===160)paint(c,5385810);if(p.width===26.2&&p.height===38)paint(c,16107224)});
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
    if(p.width===130&&p.height===14)c.material=(c.material=c.material.clone(),c.material.color.setHex(16764906),c.material);
    else if(p.width===130&&p.height===.6)paint(c,14696602);
    else if(p.width===9&&p.height===1.6)retex(c,sign("VICE METRO","#ff3fa4","#1a0b2e",768,136,"bold 78px sans-serif"));
    else if(p.width===3&&p.height===2){retex(c,sign(names[k%8],cols[k%4],"#1a0b2e",256,170,"bold 30px sans-serif"));k++}})
}
const SC={highway:sceneHighway,sky:scenePlanes,tower:sceneTower,metro:sceneMetro};
const _be=View3D.prototype.buildExt;
View3D.prototype.buildExt=function(o,s){_be.call(this,o,s);this.viceL=[];const f=SC[o.M&&o.M.scene];const k=f?1e-4:1,so=this.skyObj;if(so){so.clouds.scale.setScalar(k);so.stars.scale.setScalar(k)}if(f){try{f(this,o.M,s)}catch(e){window.__viceErr=e;console.warn("vice",e)}}};
const _rd=View3D.prototype.render;
View3D.prototype.render=function(t,i){const L=this.viceL;if(L&&L.length&&this.extScene&&SC[this.extScene])for(const m of L){const d=m.userData;m.position.x=d.px+i.cx*d.par;if(d.parY)m.position.y=d.py+i.cy*d.parY}return _rd.call(this,t,i)};
}
