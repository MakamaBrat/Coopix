/* NoomiClone: скины персонажа (текстуры 64×64 в формате майнкрафта).
   Вставляется в основной скрипт игры скриптом scripts/build_noomi_plus.py после plus.js и vice.js (видит View3D, PARTS, SAVE, look, show, T, I18N и т.д.).
   Файлы скинов лежат в games/noomiclone/skins/ (s01.png … + skins.json с названиями), сборка кладёт их в игру как data-URI вместо NC_SKINS.
   Как это работает: у каждой части тела куклы (физика та же — капсулы) в 3D добавляется блочная модель с UV из скина, а стандартные капсулы прячутся.
   Скин выбирается на экране «Скины» (живое 3D-превью), id хранится в SAVE.skin. Старый «Гардероб» (купленные предметы) — кнопка на том же экране. */
{
const SK=NC_SKINS,byId={};for(const s of SK)byId[s.id]=s;
const RU={"sk.std":"Стандартный","sk.ward":"Гардероб","sk.hint":"Нажмите на скин — персонаж сразу его наденет. Превью можно вращать пальцем."},
 EN={"sk.std":"Default","sk.ward":"Wardrobe","sk.hint":"Tap a skin to put it on. Drag the preview to rotate."};
for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU:EN);
const nameOf=s=>["ru","uk","be"].includes(LANG)?s.ru:s.en;

/* ---------- атлас скина: приводим к 64×64, как делает майнкрафт ---------- */
const ATL={};
function atlas(id){let a=ATL[id];if(a)return a.ready?a:null;a=ATL[id]={ready:false};const im=new Image();
 im.onload=()=>{try{buildAtlas(a,im)}catch(e){a.bad=true;console.warn("skin",id,e)}};im.onerror=()=>{a.bad=true};im.src=byId[id].u;return null}
function buildAtlas(a,im){
 const cv=document.createElement("canvas");cv.width=cv.height=64;const x=cv.getContext("2d",{willReadFrequently:true});x.imageSmoothingEnabled=false;x.drawImage(im,0,0);
 const old=im.naturalHeight<64,img=x.getImageData(0,0,64,64),d=img.data,P=(i,j)=>(j*64+i)*4;
 /* копия среза с отзеркаливанием по горизонтали */
 const cp=(sx,sy,w,h,dx,dy)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++){const s=P(sx+i,sy+j),t=P(dx+w-1-i,dy+j);d[t]=d[s];d[t+1]=d[s+1];d[t+2]=d[s+2];d[t+3]=d[s+3]}};
 if(old){/* формат 64×32: левые рука и нога — зеркальные копии правых */
  cp(4,16,4,4,20,48);cp(8,16,4,4,24,48);cp(0,20,4,12,24,52);cp(4,20,4,12,20,52);cp(8,20,4,12,16,52);cp(12,20,4,12,28,52);
  cp(44,16,4,4,36,48);cp(48,16,4,4,40,48);cp(40,20,4,12,32,52);cp(44,20,4,12,36,52);cp(48,20,4,12,40,52);cp(52,20,4,12,44,52);
  /* слой шапки целиком непрозрачный — это просто фон старого формата, майнкрафт его выкидывает */
  let any=false;for(let j=0;j<16&&!any;j++)for(let i=32;i<64;i++)if(d[P(i,j)+3]<128){any=true;break}
  if(!any)for(let j=0;j<16;j++)for(let i=32;i<64;i++)d[P(i,j)+3]=0}
 /* тонкие руки (Alex, 3 px): последний столбец лицевой стороны руки пустой */
 const colEmpty=(x0,y0,y1)=>{for(let j=y0;j<y1;j++)if(d[P(x0,j)+3]>0)return false;return true};
 a.slim=!old&&(colEmpty(47,20,32)||colEmpty(39,52,64));
 /* основные слои всегда непрозрачные, поверх них — слои одежды с прозрачностью */
 const op=(x0,y0,x1,y1)=>{for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)d[P(i,j)+3]=255};op(0,0,32,16);op(0,16,64,32);op(16,48,48,64);
 const has=(x0,y0,x1,y1)=>{for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)if(d[P(i,j)+3]>0)return true;return false};
 a.ov={head:has(32,0,64,16),body:has(16,32,40,48),rarm:has(40,32,56,48),larm:has(48,48,64,64),rleg:has(0,32,16,48),lleg:has(0,48,16,64)};
 x.putImageData(img,0,0);a.cv=cv;
 const t=a.tex=new T3.CanvasTexture(cv);t.magFilter=t.minFilter=1003;/* NearestFilter: в сборке three.js этих констант нет */t.generateMipmaps=false;t.needsUpdate=true;a.ready=true;a.gen=(a.gen||0)+1}

/* ---------- блочная геометрия с UV майнкрафта ---------- */
/* спереди = +x, вверх = +y, правая сторона персонажа = +z (так же стоят части куклы). D — глубина по x, H — высота, W — ширина по z */
function boxGeo(D,H,W,R){const x=D/2,y=H/2,z=W/2,
 F=[[[x,y,z],[x,y,-z],[x,-y,-z],[x,-y,z],[1,0,0],R.f],[[-x,y,-z],[-x,y,z],[-x,-y,z],[-x,-y,-z],[-1,0,0],R.b],
    [[-x,y,z],[x,y,z],[x,-y,z],[-x,-y,z],[0,0,1],R.r],[[x,y,-z],[-x,y,-z],[-x,-y,-z],[x,-y,-z],[0,0,-1],R.l],
    [[-x,y,z],[-x,y,-z],[x,y,-z],[x,y,z],[0,1,0],R.t],[[x,-y,z],[x,-y,-z],[-x,-y,-z],[-x,-y,z],[0,-1,0],R.m]],
 pos=[],uv=[],nor=[],idx=[];
 F.forEach((f,i)=>{const r=f[5];for(let k=0;k<4;k++){pos.push(...f[k]);nor.push(...f[4])}
  uv.push(r[0]/64,1-r[1]/64,r[2]/64,1-r[1]/64,r[2]/64,1-r[3]/64,r[0]/64,1-r[3]/64);const o=i*4;idx.push(o,o+3,o+2,o,o+2,o+1)});
 const g=new T3.BufferGeometry();g.setAttribute("position",new T3.Float32BufferAttribute(pos,3));g.setAttribute("normal",new T3.Float32BufferAttribute(nor,3));g.setAttribute("uv",new T3.Float32BufferAttribute(uv,2));g.setIndex(idx);return g}
/* прямоугольники граней коробки w×h×d, лежащей в атласе с угла (u,v); r0..r1 — какие строки боковых граней берём (для половинок ног) */
const rc=(u,v,w,h,d,r0,r1)=>{r0=r0||0;r1=r1==null?h:r1;return{f:[u+d,v+d+r0,u+d+w,v+d+r1],b:[u+2*d+w,v+d+r0,u+2*d+2*w,v+d+r1],r:[u,v+d+r0,u+d,v+d+r1],l:[u+d+w,v+d+r0,u+2*d+w,v+d+r1],t:[u+d,v,u+d+w,v+d],m:[u+d+w,v,u+d+2*w,v+d]}};

/* ---------- размеры блочной куклы (метры): подогнаны под физику, но чуть толще капсул, чтобы текстуры читались ---------- */
const HS=.5,TD=.27,TW=.54,TH=.76,AD=.25,AH=.9,LD=.26,LW=.26,ROW=.0875,Y0=-1.525,rowOf=y=>(Y0-y)/ROW;
const CY={torso:-1.15,head:-.6,armL:-.4,armR:-.4,thighL:-1.775,thighR:-1.775,calfL:-2.275,calfR:-2.275,footL:-2.55,footR:-2.55};
/* описание: размеры (D,H,W), положение центра коробки в части (x,y), строки боковых граней, основа/оверлей в атласе, лишнее смещение по z */
function specs(slim){const aw=slim?3:4,AW=AD*aw/4,armZ=TW/2+.004+AW/2,legZ=LW/2+.001,legU=4;
 const th={top:-1.51,bot:-2.085},ca={top:-1.925,bot:-2.495},ft={top:-2.495,bot:-2.575};
 const leg=side=>{const R=side==="L",b=R?[0,16]:[16,48],o=R?[0,32]:[0,48];/* L-части стоят справа от персонажа → правая нога, R → левая */
  return{thigh:{D:LD,H:th.top-th.bot,W:LW,cx:0,cy:(th.top+th.bot)/2-CY.thighL,rows:[0,rowOf(th.bot)],b,o,px:[4,12,4],z:legZ,bot:"strip"},
   calf:{D:LD*.985,H:ca.top-ca.bot,W:LW*.985,cx:0,cy:(ca.top+ca.bot)/2-CY.calfL,rows:[rowOf(ca.top),rowOf(ca.bot)],b,o,px:[4,12,4],z:legZ,top:"strip",bot:"strip"},
   foot:{D:.31,H:ft.top-ft.bot,W:LW,cx:-.045,cy:(ft.top+ft.bot)/2-CY.footL,rows:[11,12],b,o,px:[4,12,4],z:legZ,top:"strip"}}};
 const L=leg("L"),Rr=leg("R");
 return{
  head:{D:HS,H:HS,W:HS,cx:0,cy:HS/2-.175,rows:null,b:[0,0],o:[32,0],px:[8,8,8],z:0,inf:.5},
  torso:{D:TD,H:TH,W:TW,cx:0,cy:0,rows:null,b:[16,16],o:[16,32],px:[8,12,4],z:0},
  armL:{D:AD,H:AH,W:AW,cx:0,cy:.02,rows:null,b:[40,16],o:[40,32],px:[aw,12,4],z:armZ,arm:1},
  armR:{D:AD,H:AH,W:AW,cx:0,cy:.02,rows:null,b:[32,48],o:[48,48],px:[aw,12,4],z:armZ,arm:1},
  thighL:L.thigh,calfL:L.calf,footL:L.foot,thighR:Rr.thigh,calfR:Rr.calf,footR:Rr.foot}}
const GEO={};/* геометрия не зависит от скина — общая для всех */
function geoFor(p,sp,ov,slim){const k=p+(ov?"o":"b")+(slim?"s":"");if(GEO[k])return GEO[k];
 const[w,h,d]=sp.px,[u,v]=ov?sp.o:sp.b;let R;
 if(sp.rows){R=rc(u,v,w,h,d,sp.rows[0],sp.rows[1]);
  const r0=Math.floor(sp.rows[0]),r1=Math.ceil(sp.rows[1]);
  if(sp.top==="strip")R.t=[u+d,v+d+r0,u+d+w,v+d+r0+1];/* торцы половинок ног — полоска ближайшего ряда пикселей */
  if(sp.bot==="strip")R.m=[u+d,v+d+r1-1,u+d+w,v+d+r1];
  /* стопа: верх — полоска лицевой грани, низ — подошва */
  if(p.startsWith("foot")){R.m=rc(u,v,w,h,d).m}
  }
 else R=rc(u,v,w,h,d);
 /* оверлей чуть больше основы: 0.5 пикселя у головы и 0.25 у остальных */
 const kx=ov?(sp.inf||.25)*2/Math.max(1,w):0,ky=ov?(sp.inf||.25)*2/Math.max(1,h):0,kz=ov?(sp.inf||.25)*2/Math.max(1,d):0;
 const g=boxGeo(sp.D*(1+kz),sp.H*(1+ky),sp.W*(1+kx),R);return GEO[k]=g}

/* ---------- надеть/снять скин у конкретного вида (View3D) ---------- */
const PN=Object.keys(PARTS);
function clearSkin(V){const R=V.skinRig;if(!R)return;for(const p in R.g)R.g[p].parent&&R.g[p].parent.remove(R.g[p]);R.mats.forEach(m=>m.dispose());V.skinRig=null;
 if(V.noomiMat){V.noomiMat.visible=true;V.headMat.visible=true}
 if(V.hat){V.hat.scale.setScalar(1);V.hat.position.set(0,0,0)}if(V.faceG){V.faceG.scale.setScalar(1);V.faceG.position.set(0,0,0)}
 if(V.cape)V.cape.scale.set(1,1,1)}
function putSkin(V,id,a){
 const base=new T3.MeshLambertMaterial({map:a.tex}),ovm=new T3.MeshLambertMaterial({map:a.tex,alphaTest:.5,side:T3.DoubleSide});
 const R=V.skinRig={id,slim:a.slim,gen:a.gen,g:{},mats:[base,ovm],sp:specs(a.slim)},ovOn=a.ov;
 const hasOv=p=>p==="head"?ovOn.head:p==="torso"?ovOn.body:p==="armL"?ovOn.rarm:p==="armR"?ovOn.larm:p.endsWith("L")?ovOn.rleg:ovOn.lleg;
 for(const p of PN){const sp=R.sp[p];if(!sp)continue;
  const w=new T3.Group,inner=new T3.Group;if(sp.arm)inner.rotation.z=Math.PI;/* руки покоятся «вверх»: поворот на 180°, чтобы на опущенной руке текстура стояла ровно */
  inner.position.set(sp.cx,sp.cy,0);
  const m=new T3.Mesh(geoFor(p,sp,false,a.slim),base);m.castShadow=true;inner.add(m);
  if(hasOv(p)){const o=new T3.Mesh(geoFor(p,sp,true,a.slim),ovm);o.castShadow=true;inner.add(o)}
  w.add(inner);w.userData.sp=sp;w.userData.sgn=p.endsWith("R")?-1:1;V.noomi.parts[p].add(w);R.g[p]=w}
 V.noomiMat.visible=false;V.headMat.visible=false}
function applySkin(V,id){
 if(!id||!byId[id]){if(V.skinRig)clearSkin(V);return}
 const a=atlas(id);
 if(!a){if(ATL[id].bad&&V.skinRig)clearSkin(V);return}/* пока картинка грузится — остаётся прежний вид */
 const R=V.skinRig;if(R&&R.id===id&&R.gen===a.gen)return;
 clearSkin(V);putSkin(V,id,a)}
const _slS=View3D.prototype.setLook;
View3D.prototype.setLook=function(t,i){_slS.call(this,t,i);if(this.noomi)applySkin(this,t.skin)};
const _lookS=look;look=function(){const r=_lookS();r.skin=SAVE.skin||"";return r};

/* каждый кадр: лицо вперёд по ходу, зеркальные левая/правая стороны, подгонка вещей под квадратную голову, рентген */
const _pnS=View3D.prototype.poseNoomi;
View3D.prototype.poseNoomi=function(t){_pnS.call(this,t);const R=this.skinRig;if(!R||!this.noomi||!t.B)return;const e=t.f||1;
 for(const p in R.g){const w=R.g[p],sp=w.userData.sp;w.rotation.y=e>0?0:Math.PI;w.position.z=(w.userData.sgn*sp.z-(PARTS[p].z||0))*e}
 /* шляпы и очки сделаны под шар r≈0.16, а голова-куб крупнее: увеличиваем и поднимаем */
 const hs=HS/(PARTS.head.r*2)*1.02;
 if(this.hat){this.hat.scale.setScalar(hs);this.hat.position.y=HS/2-.175}
 if(this.faceG){this.faceG.scale.setScalar(hs);this.faceG.position.set(.05*e,HS/2-.175,0)}
 if(this.cape){this.cape.scale.set(1,1,1.04);this.cape.position.x=-(TD/2+.015)*e}
 if(this.packG)this.packG.position.x=-(TD/2+.05)*e;
 /* рентген: прозрачность и подсветка берутся у стандартной куклы */
 const nm=this.noomiMat,op=nm.opacity;for(const m of R.mats){if(m.opacity!==op){m.opacity=op;m.transparent=op<1;m.needsUpdate=true}m.emissive.copy(nm.emissive)}};

/* ---------- экран «Скины» ---------- */
{const css=document.createElement("style");css.textContent=
"#skins .bd{overflow:hidden}#skWrap{display:flex;gap:2vmin;height:100%}"+
"#skPv{position:relative;flex:0 0 40%;background:#1b2b4b;border-radius:2vmin;overflow:hidden}#skC{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}"+
"#skNm{position:absolute;left:0;right:0;bottom:1.4vmin;text-align:center;font-weight:800;font-size:3.2vmin;text-shadow:0 .3vmin 1vmin rgba(0,0,0,.7);pointer-events:none}"+
"#skHint{position:absolute;left:0;right:0;top:1.2vmin;text-align:center;font-size:2vmin;color:#9fb4d8;pointer-events:none;padding:0 2vmin}"+
"#skGrid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:1.4vmin;align-content:start;overflow-y:auto;touch-action:pan-y;padding-right:.6vmin}#skGrid *{touch-action:pan-y}"+
".skc{position:relative;background:#243557;border:.5vmin solid transparent;border-radius:1.6vmin;padding:1vmin 1vmin 1.2vmin;color:#fff;display:flex;flex-direction:column;align-items:center;gap:.8vmin;font-family:inherit}"+
".skc.on{border-color:#ffd24a;background:#2f4678}.skc.on::after{content:\"\\2713\";position:absolute;right:.8vmin;top:.2vmin;color:#ffd24a;font-weight:900;font-size:3vmin}"+
".skc canvas{width:60%;aspect-ratio:1/2;image-rendering:pixelated}.skc span{font-size:2.2vmin;font-weight:700;text-align:center;line-height:1.1}"+
"#skWard{position:absolute;right:4.9%;bottom:3.4%;height:8.6vmin;padding:0 3vmin;font-size:3.1vmin;border-radius:1.8vmin}"+
"@media(orientation:portrait){#skWrap{flex-direction:column;gap:2.4vw}#skPv{flex:0 0 46%}#skGrid{grid-template-columns:repeat(3,1fr);gap:2.4vw}.skc{border-radius:3vw;padding:2vw;gap:1.4vw;border-width:.8vw}.skc.on::after{font-size:5vw;right:2vw}.skc span{font-size:3.4vw}.skc canvas{width:44%}#skNm{font-size:6vw;bottom:2vw}#skHint{font-size:3.2vw;top:2vw}#skWard{right:4%;bottom:calc(env(safe-area-inset-bottom) + 2.4%);height:13vw;font-size:4.8vw;padding:0 4vw;border-radius:3vw}}";
 document.head.appendChild(css);
 const s=document.createElement("div");s.className="screen sc2";s.id="skins";
 s.innerHTML='<div class="hd"><span id="skTitle"></span></div><div class="bd"><div id="skWrap"><div id="skPv"><canvas id="skC"></canvas><div id="skHint"></div><div id="skNm"></div></div><div id="skGrid"></div></div></div><button class="navy bk" id="skBack"></button><button class="navy" id="skWard"></button>';
 $("app").appendChild(s)}

let SKV=null,SKF=null,raf=0,yaw=34,drag=null,lastInt=0,lastT=0,cards=[];
function ensureView(){if(SKV||SKV===false)return SKV;
 try{SKV=new View3D($("skC"));SKV.updExt=()=>{};/* базовый updExt включает небо обратно */const so=SKV.skyObj;so.sky.visible=false;so.clouds.scale.setScalar(1e-4);so.stars.scale.setScalar(1e-4);SKV.scene.background=new T3.Color(0x1b2b4b);
  const pl=new T3.Mesh(new T3.CylinderGeometry(.85,.85,.05,48),new T3.MeshLambertMaterial({color:0x2a4170}));pl.position.set(0,-2.6,0);pl.receiveShadow=true;SKV.scene.add(pl);
  const rg=new T3.Mesh(new T3.TorusGeometry(.85,.012,6,64),new T3.MeshBasicMaterial({color:0xffd24a}));rg.rotation.x=Math.PI/2;rg.position.set(0,-2.572,0);SKV.scene.add(rg);
  SKV.sun.shadow.mapSize.set(1024,1024)}catch(err){console.warn("skin preview",err);SKV=false}
 return SKV}
/* «поддельная» игра: расставляет части куклы в спокойную стойку с чуть опущенными руками */
function fake(){const B={};for(const p of PN)B[p]={x:PARTS[p].c[0],y:PARTS[p].c[1],a:0,getPosition(){return{x:this.x,y:this.y}},getAngle(){return this.a},getLinearVelocity(){return{x:0,y:0}}};
 return{B,st:{tw:0},f:1,M:null,com(){return{x:0,y:-1.5,vx:0,vy:0}}}}
function pose(F,tm){const s=tm/1000;
 for(const p of["armL","armR"]){const sgn=p==="armL"?1:-1,th=(-168+Math.sin(s*1.7+(sgn>0?0:1.2))*5)*Math.PI/180,A=[0,-.78],C=PARTS[p].c,dx=C[0]-A[0],dy=C[1]-A[1],b=F.B[p];
  b.x=A[0]+dx*Math.cos(th)-dy*Math.sin(th);b.y=A[1]+dx*Math.sin(th)+dy*Math.cos(th);b.a=th}
 const bob=Math.sin(s*2.2)*.006;for(const p of["head"])F.B[p].y=PARTS[p].c[1]+bob}
function colorHex(){return(findItem(SAVE.eq.col)||[])[2]}
function drawPv(tm){const V=ensureView();if(!V)return;const c=$("skC"),r=c.getBoundingClientRect();if(r.width<10)return;
 const dpr=Math.min(2,window.devicePixelRatio||1);if(c.dataset.w!==Math.round(r.width)+"x"+Math.round(r.height)){c.dataset.w=Math.round(r.width)+"x"+Math.round(r.height);V.resize(r.width,r.height,dpr);const cm=V.camera;cm.clearViewOffset();cm.fov=32;cm.updateProjectionMatrix()}
 const dt=Math.min(.05,(tm-lastT)/1000);lastT=tm;if(!drag&&tm-lastInt>2200)yaw+=dt*16;
 if(!SKF)SKF=fake();pose(SKF,tm);V.setLook(look(),colorHex());
 /* камера: по высоте в кадр помещается кукла вместе с подставкой, по ширине — размах рук */
 const asp=r.width/r.height,Hv=Math.max(3.6,1.8/asp);
 V.render(SKF,{noMap:true,cx:0,cy:-1.42,D:Hv/(2*Math.tan(16*Math.PI/180)),yaw,pitch:-7,sky:"day",shadow:true})}
function loop(tm){if(screen!=="skins"){raf=0;return}drawPv(tm);raf=requestAnimationFrame(loop)}

/* карточки */
function thumb(cv,a,slim,col){const x=cv.getContext("2d");x.clearRect(0,0,16,32);x.imageSmoothingEnabled=false;
 if(!a){/* стандартная кукла: капсулы нужного цвета */
  x.fillStyle=col||"#5a5a5c";x.fillRect(5,8,6,12);x.fillRect(2,8,3,11);x.fillRect(11,8,3,11);x.fillRect(5,20,3,11);x.fillRect(8,20,3,11);x.fillStyle="#3b3b3d";x.fillRect(5,0,6,7);return}
 const A=a.cv,aw=slim?3:4,d=(sx,sy,sw,sh,dx,dy)=>x.drawImage(A,sx,sy,sw,sh,dx,dy,sw,sh);
 d(8,8,8,8,4,0);d(20,20,8,12,4,8);d(44,20,aw,12,4-aw,8);d(36,52,aw,12,12,8);d(4,20,4,12,4,20);d(20,52,4,12,8,20);
 d(40,8,8,8,4,0);d(20,36,8,12,4,8);d(44,36,aw,12,4-aw,8);d(52,52,aw,12,12,8);d(4,36,4,12,4,20);d(4,52,4,12,8,20)}
function renderGrid(){const g=$("skGrid");g.innerHTML="";cards=[];const cur=SAVE.skin||"";
 const mk=(id,label)=>{const b=document.createElement("button");b.className="skc"+(cur===id?" on":"");b.innerHTML='<canvas width="16" height="32"></canvas><span></span>';b.querySelector("span").textContent=label;
  b.onclick=()=>{SAVE.skin=id;persist();applySettings();lastInt=performance.now();renderGrid();updName()};g.appendChild(b);cards.push({id,cv:b.querySelector("canvas")})};
 mk("",T("sk.std"));for(const s of SK)mk(s.id,nameOf(s));paintThumbs()}
function paintThumbs(){for(const c of cards){if(!c.id){thumb(c.cv,null,false,colorHex());continue}const a=atlas(c.id);if(a)thumb(c.cv,a,a.slim)}}
function updName(){const s=byId[SAVE.skin||""];$("skNm").textContent=s?nameOf(s):T("sk.std")}
function openSkins(){$("skTitle").textContent=T("menu.skins");$("skBack").textContent="\u2039 "+T("back");$("skWard").textContent="\u{1F455} "+T("sk.ward");$("skHint").textContent=T("sk.hint");
 renderGrid();updName();show("skins")}
$("skBack").onclick=()=>show("menu");
$("skWard").onclick=()=>{shopMode="skins";renderShop();show("shop")};
/* после загрузки картинок — перерисовать миниатюры */
for(const s of SK){const a=atlas(s.id);if(a)continue;const t=setInterval(()=>{const x=ATL[s.id];if(x&&(x.ready||x.bad)){clearInterval(t);if(screen==="skins")paintThumbs()}},120)}
const drg=$("skC");
drg.addEventListener("pointerdown",e=>{drag={x:e.clientX,yaw};try{drg.setPointerCapture(e.pointerId)}catch(_){}});
drg.addEventListener("pointermove",e=>{if(drag){yaw=drag.yaw+(e.clientX-drag.x)*.7;lastInt=performance.now()}});
const endDrag=()=>{if(drag){drag=null;lastInt=performance.now()}};drg.addEventListener("pointerup",endDrag);drg.addEventListener("pointercancel",endDrag);
const _showS=show;show=function(t){_showS(t);if(t==="skins"&&!raf){lastT=performance.now();raf=requestAnimationFrame(loop)}};
/* кнопка «Скины» в меню теперь открывает этот экран (базовый код вешает свой обработчик чуть позже — перебиваем после старта) */
setTimeout(()=>{$("mSkins").onclick=openSkins},0);
addEventListener("resize",()=>{if(screen==="skins"){const c=$("skC");c.dataset.w=""}});
/* на всякий случай: хранилище не знает про скин — по умолчанию «стандартный» */
if(typeof SAVE.skin!=="string")SAVE.skin="";
if(SAVE.skin&&!byId[SAVE.skin])SAVE.skin="";
if(NC_SKDBG)window.__ncSkins={list:SK.map(s=>s.id),set(id){SAVE.skin=id;persist();applySettings()},atlas:id=>ATL[id],open:openSkins,
 /* для отладки: снимок превью выбранного скина с заданным углом камеры (data-URL) */
 snap(id,yawDeg,w,h){const V=ensureView();if(!V)return null;const old=SAVE.skin;SAVE.skin=id;V.resize(w,h,1);const cm=V.camera;cm.clearViewOffset();cm.fov=32;cm.updateProjectionMatrix();
  if(!SKF)SKF=fake();pose(SKF,1234);V.setLook(look(),colorHex());const asp=w/h,Hv=Math.max(3.6,1.8/asp);
  V.render(SKF,{noMap:true,cx:0,cy:-1.42,D:Hv/(2*Math.tan(16*Math.PI/180)),yaw:yawDeg,pitch:-7,sky:"day",shadow:true});const u=$("skC").toDataURL("image/png");SAVE.skin=old;$("skC").dataset.w="";return u}};
}
