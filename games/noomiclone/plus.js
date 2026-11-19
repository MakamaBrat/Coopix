/* NoomiClone+: новые предметы и кастомизация, переломы за монеты с рентгеном костей при сильных ударах.
   Вставляется в основной скрипт игры скриптом scripts/build_noomi_plus.py (между маркерами NOOMI_PLUS), поэтому видит ITEMS, SAVE, PARTS, View3D, Game, W, FX и т.д. */
{
/* ---------- новые предметы магазина ---------- */
const add=(c,l)=>{(ITEMS[c]=ITEMS[c]||[]).push(...l)};
add("col",[["col_cyan","x.cyan","#22d3ee",160],["col_lime","x.lime","#a3e635",160],["col_magenta","x.magenta","#e63fd8",180],["col_black","x.black","#26262e",250],["col_neon","x.neon","#39ff7a",350],["col_gold","x.gold","#ffc61a",600]]);
add("hat",[["hat_helmet","x.helmet","#e9ecef",200],["hat_beanie","x.beanie","#3b82f6",150],["hat_cowboy","x.cowboy","#8b5a2b",350],["hat_viking","x.viking","#c8c8d0",450],["hat_wizard","x.wizard","#6d28d9",400],["hat_halo","x.halo","#ffe27a",700]]);
add("cape",[["cape_black","x.capeblack","#26262e",400],["cape_ice","x.capeice","#8fd8ff",450],["cape_gold","x.capegold","#f5c518",600],["cape_rainbow","x.rainbow","#ff4fd8",900]]);
ITEMS.face=[["face_none","x.none","",0],["face_sun","x.sun","#111111",200],["face_goggles","x.goggles","#ffb020",250],["face_mask","x.mask","#2a2a33",300],["face_cyber","x.cyber","#22d3ee",500]];
ITEMS.wear=[["wear_none","x.none","",0],["wear_gloves","x.gloves","#e04040",250],["wear_boots","x.boots","#f59e0b",250],["wear_pack","x.pack","#3b82f6",300],["wear_belt","x.belt","#ffc61a",450]];
ITEMS.gear=[["gear_none","x.none","",0],["gear_tl","x.tlegs","#ff7a1a",800],["gear_ta","x.tarms","#22d3ee",800],["gear_tb","x.tboth","#ff4fd8",1500]];
ITEMS.fx=[["fx_none","x.none","",0],["fx_spark","x.spark","#ffe27a",300],["fx_fire","x.fire","#ff7a1a",500],["fx_ice","x.icet","#8fd8ff",500],["fx_rainbow","x.rbt","#ff4fd8",800]];
ITEMS.spec=[["spec_none","x.nofrac","",0],["spec_frac","x.frac","#9fe8ff",400]];
ITEMS.move=[["move_none","x.none","",0],["move_walk","x.walk","#9be15d",1],["move_run","x.run","#ffb02e",1]];
Object.assign(catName,{face:"x.cface",wear:"x.cwear",gear:"x.cgear",fx:"x.cfx",spec:"x.cspec",move:"x.cmove"});
const RU={"x.cyan":"Бирюзовый","x.lime":"Лайм","x.magenta":"Маджента","x.black":"Чёрный","x.neon":"Неон","x.gold":"Золото",
 "x.helmet":"Каска","x.beanie":"Шапка-бини","x.cowboy":"Ковбойская шляпа","x.viking":"Шлем викинга","x.wizard":"Шляпа мага","x.halo":"Нимб",
 "x.capeblack":"Чёрный плащ","x.capeice":"Ледяной плащ","x.capegold":"Золотой плащ","x.rainbow":"Радужный плащ",
 "x.none":"Ничего","x.sun":"Тёмные очки","x.goggles":"Очки-маска","x.mask":"Маска ниндзя","x.cyber":"Кибер-визор",
 "x.gloves":"Перчатки","x.boots":"Кроссовки","x.pack":"Рюкзак","x.belt":"Пояс чемпиона",
 "x.spark":"Искры","x.fire":"Огненный шлейф","x.icet":"Ледяной шлейф","x.rbt":"Радужный шлейф",
 "x.nofrac":"Без переломов","x.frac":"Переломы + рентген",
 "x.cmove":"Движение","x.walk":"Походка","x.run":"Бег","x.jump":"Прыжок","x.cface":"Лицо","x.cwear":"Экипировка","x.cgear":"Снаряжение","x.tlegs":"Турбины на ноги","x.tarms":"Турбины на руки","x.tboth":"Турбины на руки и ноги","x.turboL":"Турбины ног","x.turboA":"Турбины рук","x.gain":"монет","x.cfx":"Шлейф","x.cspec":"Особое",
 "x.hurt":"Перелом","x.p.torso":"рёбра","x.p.head":"череп","x.p.armL":"левая рука","x.p.armR":"правая рука","x.p.thighL":"левое бедро","x.p.thighR":"правое бедро","x.p.calfL":"левая голень","x.p.calfR":"правая голень","x.p.footL":"левая стопа","x.p.footR":"правая стопа",
 "x.fracNote":"«Переломы + рентген»: при очень сильных ударах персонаж на секунду показывается как рентген со сломанной костью."};
const EN={"x.cyan":"Cyan","x.lime":"Lime","x.magenta":"Magenta","x.black":"Black","x.neon":"Neon","x.gold":"Gold",
 "x.helmet":"Hard hat","x.beanie":"Beanie","x.cowboy":"Cowboy hat","x.viking":"Viking helmet","x.wizard":"Wizard hat","x.halo":"Halo",
 "x.capeblack":"Black cape","x.capeice":"Ice cape","x.capegold":"Gold cape","x.rainbow":"Rainbow cape",
 "x.none":"None","x.sun":"Sunglasses","x.goggles":"Goggles","x.mask":"Ninja mask","x.cyber":"Cyber visor",
 "x.gloves":"Gloves","x.boots":"Sneakers","x.pack":"Backpack","x.belt":"Champion belt",
 "x.spark":"Sparks","x.fire":"Fire trail","x.icet":"Ice trail","x.rbt":"Rainbow trail",
 "x.nofrac":"No fractures","x.frac":"Fractures + X-ray",
 "x.cmove":"Movement","x.walk":"Walking","x.run":"Running","x.jump":"Jump","x.cface":"Face","x.cwear":"Outfit","x.cgear":"Gear","x.tlegs":"Leg turbines","x.tarms":"Arm turbines","x.tboth":"Arm + leg turbines","x.turboL":"Leg turbo","x.turboA":"Arm turbo","x.gain":"coins","x.cfx":"Trail","x.cspec":"Special",
 "x.hurt":"Fracture","x.p.torso":"ribs","x.p.head":"skull","x.p.armL":"left arm","x.p.armR":"right arm","x.p.thighL":"left thigh","x.p.thighR":"right thigh","x.p.calfL":"left shin","x.p.calfR":"right shin","x.p.footL":"left foot","x.p.footR":"right foot",
 "x.fracNote":"\"Fractures + X-ray\": on very hard hits the character flashes as an X-ray with a broken bone."};
for(const L in I18N){Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU:EN)}
for(const k of ["face_none","wear_none","gear_none","fx_none","spec_none","move_none"])SAVE.owned[k]=1;
SAVE.eq.face=SAVE.eq.face||"face_none";SAVE.eq.wear=SAVE.eq.wear||"wear_none";SAVE.eq.gear=SAVE.eq.gear||"gear_none";SAVE.eq.fx=SAVE.eq.fx||"fx_none";SAVE.eq.spec=SAVE.eq.spec||"spec_none";SAVE.eq.move=SAVE.eq.move||"move_none";
{const st=document.createElement("style");st.textContent=".cats{flex-wrap:wrap}#xrmsg{position:absolute;left:50%;top:15vmin;transform:translateX(-50%);z-index:6;pointer-events:none;color:#fff;font-weight:800;font-size:4.6vmin;text-shadow:0 .3vmin 1.2vmin rgba(0,0,0,.7);background:rgba(190,20,30,.78);padding:.8vmin 2.6vmin;border-radius:2vmin;opacity:0;white-space:nowrap}#xrmsg.on{animation:xrm 2.4s ease-out}@keyframes xrm{0%{opacity:0;transform:translateX(-50%) scale(.7)}12%{opacity:1;transform:translateX(-50%) scale(1.08)}20%{transform:translateX(-50%) scale(1)}80%{opacity:1}100%{opacity:0}}#xrfx{position:absolute;inset:0;z-index:5;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 50%,rgba(40,140,255,0) 35%,rgba(20,90,200,.55) 100%)}#xrfx.on{animation:xrf 1.6s ease-out}@keyframes xrf{0%{opacity:0}10%{opacity:1}100%{opacity:0}}";document.head.appendChild(st);
 const g=$("game");if(g){const m=document.createElement("div");m.id="xrmsg";const f=document.createElement("div");f.id="xrfx";g.append(f,m)}}

/* ---------- look(): новые поля ---------- */
const _look=look;
look=function(){const r=_look();const e=SAVE.eq;r.capeId=e.cape;r.face=e.face;r.faceCol=(findItem(e.face)||[])[2];r.wear=e.wear;r.wearCol=(findItem(e.wear)||[])[2];r.gear=e.gear;r.gearCol=(findItem(e.gear)||[])[2];r.fx=e.fx;r.fxCol=(findItem(e.fx)||[])[2];r.spec=e.spec;return r};

/* ---------- 3D: шляпы, лицо, снаряжение, шлейф ---------- */
const NEWHATS=["hat_helmet","hat_beanie","hat_cowboy","hat_viking","hat_wizard","hat_halo"];
const _sl=View3D.prototype.setLook;
View3D.prototype.setLook=function(t,i){_sl.call(this,t,i);if(!this.noomi)return;const P=this.noomi.parts,eR=PARTS.head.r;
  /* шляпы: оригинал строит только свои, остальные добавляем сами */
  if(NEWHATS.includes(t.hat)&&this.hat.children.length===0){const col=t.hatCol||"#cccccc",M=new T3.MeshLambertMaterial({color:col}),W2=new T3.MeshLambertMaterial({color:"#ffffff"}),e=eR,add=m=>this.hat.add(m);
    const dome=(r,k)=>{const m=new T3.Mesh(new T3.SphereGeometry(r,16,10,0,Math.PI*2,0,Math.PI/2*(k||1)),M);return m};
    if(t.hat==="hat_helmet"){const d=dome(e*1.12);d.position.y=e*.05;add(d);const s=new T3.Mesh(new T3.BoxGeometry(e*.16,e*.05,e*1.9),new T3.MeshLambertMaterial({color:"#e04040"}));s.position.y=e*1.16;add(s);const b=new T3.Mesh(new T3.CylinderGeometry(e*1.14,e*1.14,e*.1,18),M);b.position.y=e*.1;add(b)}
    else if(t.hat==="hat_beanie"){const d=dome(e*1.1);d.position.y=e*.05;add(d);const c=new T3.Mesh(new T3.CylinderGeometry(e*1.12,e*1.12,e*.3,18),new T3.MeshLambertMaterial({color:new T3.Color(col).multiplyScalar(.75)}));c.position.y=e*.2;add(c);const p=new T3.Mesh(new T3.SphereGeometry(e*.3,10,8),W2);p.position.y=e*1.18;add(p)}
    else if(t.hat==="hat_cowboy"){const b=new T3.Mesh(new T3.CylinderGeometry(e*1.7,e*1.7,e*.08,20),M);b.position.y=e*.65;add(b);const c=new T3.Mesh(new T3.CylinderGeometry(e*.8,e*.95,e*.8,16),M);c.position.y=e*1.05;add(c);const s=new T3.Mesh(new T3.CylinderGeometry(e*.97,e*.97,e*.14,16),new T3.MeshLambertMaterial({color:"#2b1a0b"}));s.position.y=e*.78;add(s)}
    else if(t.hat==="hat_viking"){const d=dome(e*1.1);d.position.y=e*.05;add(d);for(const z of[-1,1]){const h=new T3.Mesh(new T3.ConeGeometry(e*.2,e*1.05,10),W2);h.position.set(0,e*.65,z*e*1.12);h.rotation.x=-z*.85;add(h)}}
    else if(t.hat==="hat_wizard"){const b=new T3.Mesh(new T3.CylinderGeometry(e*1.55,e*1.55,e*.07,20),M);b.position.y=e*.75;add(b);const c=new T3.Mesh(new T3.ConeGeometry(e*.95,e*2.3,16),M);c.position.y=e*1.9;c.rotation.z=-.12;add(c);const s=new T3.Mesh(new T3.CylinderGeometry(e*.97,e*.97,e*.12,16),new T3.MeshLambertMaterial({color:"#ffd24a"}));s.position.y=e*.95;add(s)}
    else if(t.hat==="hat_halo"){const h=new T3.Mesh(new T3.TorusGeometry(e*.8,e*.07,8,24),new T3.MeshBasicMaterial({color:col}));h.rotation.x=Math.PI/2;h.position.y=e*1.7;add(h)}}
  /* лицо */
  const fk="f|"+t.face+"|"+t.faceCol;
  if(this.xFk!==fk){this.xFk=fk;if(this.faceG)this.faceG.parent&&this.faceG.parent.remove(this.faceG);const g=this.faceG=new T3.Group,e=eR,B=(w,h,d,c,x,y,z,basic)=>{const m=new T3.Mesh(new T3.BoxGeometry(w,h,d),basic?new T3.MeshBasicMaterial({color:c}):new T3.MeshPhongMaterial({color:c,shininess:60,specular:"#888888"}));m.position.set(x,y,z);g.add(m);return m};
    if(t.face==="face_sun")B(e*.5,e*.34,e*1.5,"#0b0b0f",e*.7,e*.2,0);
    else if(t.face==="face_goggles"){B(e*.46,e*.46,e*1.45,t.faceCol,e*.72,e*.2,0,true);const s=new T3.Mesh(new T3.TorusGeometry(e*1.02,e*.1,6,20),new T3.MeshPhongMaterial({color:"#222"}));s.rotation.x=Math.PI/2;s.position.y=e*.2;g.add(s)}
    else if(t.face==="face_mask"){B(e*.6,e*.6,e*1.7,"#2a2a33",e*.62,-e*.42,0);B(e*.3,e*.18,e*2.1,"#d62f3f",0,e*.5,0)}
    else if(t.face==="face_cyber"){B(e*.4,e*.3,e*1.8,t.faceCol,e*.78,e*.2,0,true);B(e*.1,e*.1,e*.1,"#ffffff",e*1,e*.2,e*.6,true)}
    P.head.add(g)}
  /* снаряжение: перчатки, кроссовки, рюкзак, пояс */
  const gk="g|"+t.wear+"|"+t.wearCol;
  if(this.xGk!==gk){this.xGk=gk;for(const o of this.gearObjs||[])o.parent&&o.parent.remove(o);this.gearObjs=[];this.packG=null;const col=t.wearCol,M=new T3.MeshPhongMaterial({color:col||"#fff",shininess:50,specular:"#666666"}),keep=m=>{this.gearObjs.push(m);return m};
    if(t.wear==="wear_gloves"){for(const a of["armL","armR"]){const m=new T3.Mesh(new T3.SphereGeometry(PARTS[a].r*1.75,12,9),M);m.position.y=PARTS[a].hl;m.castShadow=true;P[a].add(keep(m))}}
    else if(t.wear==="wear_boots"){for(const a of["footL","footR"]){const q=PARTS[a],m=new T3.Mesh(new T3.BoxGeometry(q.hw*2*1.15,q.hh*2+.07,.2),M);m.position.y=.02;m.castShadow=true;P[a].add(keep(m))}}
    else if(t.wear==="wear_pack"){const g=keep(new T3.Group),b=new T3.Mesh(new T3.BoxGeometry(.13,.34,.36),M);b.castShadow=true;g.add(b);const p=new T3.Mesh(new T3.BoxGeometry(.04,.14,.26),new T3.MeshPhongMaterial({color:"#1f2937"}));p.position.x=-.08;g.add(p);P.torso.add(g);this.packG=g}
    else if(t.wear==="wear_belt"){const g=keep(new T3.Group),b=new T3.Mesh(new T3.BoxGeometry(.17,.07,.6),M);g.add(b);const k=new T3.Mesh(new T3.BoxGeometry(.04,.1,.14),new T3.MeshPhongMaterial({color:"#fff7c2",shininess:90}));k.position.x=.09;g.add(k);g.position.y=-.22;P.torso.add(g)}}
  /* турбины (кнопки в игре): сопла на голенях и/или кистях, при включении — пламя */
  const tk="t|"+t.gear;
  if(this.xTk!==tk){this.xTk=tk;for(const o of this.turboObjs||[])o.parent&&o.parent.remove(o);this.turboObjs=[];this.flames={legs:[],arms:[]};const noz=new T3.MeshPhongMaterial({color:"#2b2f3a",shininess:80,specular:"#aaaaaa"}),ring=new T3.MeshBasicMaterial({color:t.gear==="gear_ta"?"#22d3ee":t.gear==="gear_tb"?"#ff4fd8":"#ff7a1a"});
    const mkNoz=(part,sign,list)=>{const c=PARTS[part],g=new T3.Group,b=new T3.Mesh(new T3.CylinderGeometry(c.r*1.5,c.r*2.2,.16,12),noz);g.add(b);const r=new T3.Mesh(new T3.TorusGeometry(c.r*1.9,.012,6,14),ring);r.rotation.x=Math.PI/2;r.position.y=sign*-.07;g.add(r);
      const fl=new T3.Mesh(new T3.ConeGeometry(c.r*1.5,.5,10),new T3.MeshBasicMaterial({color:"#ffb347",transparent:true,opacity:.9}));fl.position.y=sign*.34;if(sign<0)fl.rotation.z=Math.PI;fl.visible=false;fl.renderOrder=4;g.add(fl);
      const fl2=new T3.Mesh(new T3.ConeGeometry(c.r*.8,.36,8),new T3.MeshBasicMaterial({color:"#fff6c8",transparent:true,opacity:.95}));fl2.position.y=sign*.27;if(sign<0)fl2.rotation.z=Math.PI;fl2.visible=false;fl2.renderOrder=5;g.add(fl2);
      g.position.y=sign*(c.hl+.02);P[part].add(g);this.turboObjs.push(g);list.push([fl,fl2])};
    if(t.gear==="gear_tl"||t.gear==="gear_tb"){mkNoz("calfL",-1,this.flames.legs);mkNoz("calfR",-1,this.flames.legs)}
    if(t.gear==="gear_ta"||t.gear==="gear_tb"){mkNoz("armL",1,this.flames.arms);mkNoz("armR",1,this.flames.arms)}}
  this.xLook=t};

/* кости рентгена */
View3D.prototype.buildBones=function(){const P=this.noomi.parts,bm=this.boneMat=new T3.MeshBasicMaterial({color:"#eaf6ff",transparent:true,opacity:0,depthTest:false}),rm=this.boneRed=new T3.MeshBasicMaterial({color:"#ff3b3b",transparent:true,opacity:0,depthTest:false});this.bones={};
  const mk=(g,geo,mat,x,y,z)=>{const m=new T3.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.renderOrder=20;g.add(m);return m};
  for(const p in PARTS){const c=PARTS[p],g=new T3.Group;g.visible=false;const rec={g,halves:[],mats:[]};
    if(c.kind==="cap"){for(const s of[-1,1]){const h=new T3.Group;h.position.y=s*c.hl*.46;const cp=capsuleGroup(c.r*.3,c.hl*.38,bm);for(const m of cp.children)m.renderOrder=20,m.castShadow=false;h.add(cp);g.add(h);rec.halves.push(h)}}
    else if(p==="torso"){mk(g,new T3.BoxGeometry(.04,.74,.04),bm);for(let k=0;k<5;k++){mk(g,new T3.BoxGeometry(.15,.022,.26-k*.025),bm,0,.26-k*.07,0)}mk(g,new T3.BoxGeometry(.17,.09,.22),bm,0,-.32,0)}
    else if(p==="head"){mk(g,new T3.SphereGeometry(c.r*.92,14,10),bm);const jaw=mk(g,new T3.BoxGeometry(c.r*.7,c.r*.32,c.r*1.0),bm,c.r*.3,-c.r*.75,0);const eg=rec.eyes=new T3.Group;for(const z of[-1,1]){const e=new T3.Mesh(new T3.SphereGeometry(c.r*.2,8,6),new T3.MeshBasicMaterial({color:"#0b1020",depthTest:false,transparent:true,opacity:0}));e.position.set(c.r*.62,c.r*.1,z*c.r*.34);e.renderOrder=21;eg.add(e);rec.mats.push(e.material)}g.add(eg)}
    else mk(g,new T3.BoxGeometry(c.hw*1.8,c.hh*2+.025,.1),bm);
    P[p].add(g);this.bones[p]=rec}};

/* рентген-вспышка и эффекты по состоянию игры t */
const _pn=View3D.prototype.poseNoomi;
View3D.prototype.poseNoomi=function(t){_pn.call(this,t);if(!this.noomi||!t.B)return;const now=performance.now(),e=t.f,P=this.noomi.parts;
  if(this.faceG)this.faceG.rotation.y=e>0?0:Math.PI;
  if(this.packG)this.packG.position.x=-.12*e;
  const look=this.xLook||{};
  if(look.capeId==="cape_rainbow")this.cape.material.color.setHSL((now/2400)%1,.9,.55);
  if(this.flames){const on=t.tOn||{},fl=(L,v)=>{for(const [a,b] of L){const k=.8+Math.random()*.5;a.visible=b.visible=!!v;if(v){a.scale.set(1,k,1);b.scale.set(1,k*1.05,1)}}};fl(this.flames.legs,on.legs);fl(this.flames.arms,on.arms)}
  /* шлейф */
  const fx=look.fx||"fx_none";
  if(fx!=="fx_none"){if(!this.trail){const L=[];for(let i=0;i<20;i++){const m=new T3.Mesh(new T3.SphereGeometry(.07,8,6),new T3.MeshBasicMaterial({color:"#fff",transparent:true,opacity:.9}));m.renderOrder=3;this.scene.add(m);L.push(m)}this.trail={L,h:[]}}
    const c=t.com(),h=this.trail.h,last=h[0];if(!last||Math.hypot(c.x-last[0],c.y-last[1])>.1){h.unshift([c.x,c.y]);if(h.length>20)h.pop()}
    this.trail.L.forEach((m,i)=>{const p=h[i];m.visible=!!p&&this.noomi.rig.visible;if(!p)return;const a=1-i/20;m.position.set(p[0],p[1],-.15);m.scale.setScalar(.35+a*.9);
      const col=fx==="fx_rainbow"?new T3.Color().setHSL(((now/700)+i*.06)%1,.95,.55):new T3.Color(fx==="fx_fire"?(i<6?"#ffd24a":i<12?"#ff7a1a":"#c4261a"):fx==="fx_ice"?(i<8?"#e8f8ff":"#6ec1ff"):(i%2?"#ffe27a":"#ffffff"));m.material.color.copy(col);m.material.opacity=a*.85})}
  else if(this.trail){this.trail.L.forEach(m=>m.visible=false);this.trail.h.length=0}
  /* рентген */
  const xr=t.xr;let lv=0;if(xr&&look.spec==="spec_frac"){const a=(now-xr.t)/1000;lv=a<.12?a/.12:a<1.9?1:Math.max(0,1-(a-1.9)/.5)}
  if(lv>0.01){if(!this.bones)this.buildBones();this.noomiMat.transparent=this.headMat.transparent=true}
  if(this.bones||this.noomiMat.opacity<1){const o=1-.72*lv;this.noomiMat.opacity=this.headMat.opacity=o;const em=lv*.9;this.noomiMat.emissive.setRGB(.1*em,.5*em,.9*em);this.headMat.emissive.setRGB(.1*em,.5*em,.9*em);
    if(this.bones){this.boneMat.opacity=lv;this.boneRed.opacity=lv;for(const p in this.bones){const r=this.bones[p],on=lv>.01;r.g.visible=on;if(!on)continue;const br=t.frac&&t.frac[p]&&now-t.frac[p]<9000;
        if(r.halves.length){for(const m of r.halves[0].children[0].children)m.material=br?this.boneRed:this.boneMat;for(const m of r.halves[1].children[0].children)m.material=br?this.boneRed:this.boneMat;
          r.halves[1].rotation.z=br?.38:0;r.halves[1].position.set(br?.05:0,r.halves[1].position.y,0);r.halves[0].rotation.z=br?-.1:0}
        else{r.g.traverse(m=>{if(m.isMesh&&m.material===this.boneMat||m.isMesh&&m.material===this.boneRed)m.material=br?this.boneRed:this.boneMat});if(p==="torso"&&br)r.g.children[2].rotation.z=.25}
        if(r.eyes){r.eyes.rotation.y=e>0?0:Math.PI;for(const m of r.mats)m.opacity=lv}}}}};

/* ---------- удары: перелом, сообщение, звук ---------- */
const PARTRU=p=>T("x.p."+p);
const crack=()=>{if(!SAVE.set.snd)return;try{const A=window.__nc_ac||(window.__nc_ac=new(window.AudioContext||window.webkitAudioContext)),n=A.sampleRate*.35,b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)*(i<n*.06?1:.5);const s=A.createBufferSource();s.buffer=b;const f=A.createBiquadFilter();f.type="lowpass";f.frequency.value=1800;const g=A.createGain();g.gain.value=.5;s.connect(f);f.connect(g);g.connect(A.destination);s.start()}catch(e){}};
const FRAC_V=NC_FRAC_V;
const _lm=GP.loadMap;
GP.loadMap=function(s){const r=_lm.call(this,s);this.world.on("begin-contact",c=>{if(this!==W||SAVE.eq.spec!=="spec_frac"||!this.st)return;const A=c.getFixtureA().getBody(),B=c.getFixtureB().getBody(),pa=A.part,pb=B.part;if(!!pa===!!pb)return;const body=pa?A:B,other=pa?B:A,p=pa||pb;
  /* скорость сближения с препятствием до удара (по нормали, если известна) */
  const v=body.getLinearVelocity(),w2=other.getLinearVelocity();let sp=Math.hypot(v.x-w2.x,v.y-w2.y);
  try{const m=c.getWorldManifold(null);if(m&&m.normal)sp=Math.abs((v.x-w2.x)*m.normal.x+(v.y-w2.y)*m.normal.y)}catch(e){}
  if(NC_DBG)NC_DBG.push([p,+sp.toFixed(1)]);
  const thr=p==="head"?FRAC_V*.85:FRAC_V;if(sp<thr)return;const now=performance.now();if(now-(this.xrLast||0)<2200)return;this.xrLast=now;this.frac=this.frac||{};this.frac[p]=now;this.xr={t:now,part:p};
  const m=$("xrmsg"),f=$("xrfx");if(m){m.textContent="\u{1F9B4} "+T("x.hurt")+": "+PARTRU(p);m.classList.remove("on");void m.offsetWidth;m.classList.add("on")}if(f){f.classList.remove("on");void f.offsetWidth;f.classList.add("on")}
  crack();try{FX.shake=Math.max(FX.shake||0,.5)}catch(e){}});return r};

const effOf=G=>(G.play&&G.rcfg)?G.rcfg:{tb:SAVE.eq.gear,gt:window.__ncGait?window.__ncGait():0};
/* повторы: турбины и ходьба тоже воспроизводятся — их кнопки пишутся в маску ввода, а снаряжение и режим — в конфиг повтора */
RKEYS.push("turboL","turboA");
{const _ac=GP.applyCfg;GP.applyCfg=function(c){_ac.call(this,c);if(c.tb!==undefined)this.rcfg={tb:c.tb,gt:c.gt|0}};
 const _ps=GP.playStart;GP.playStart=function(...a){this.rcfg={tb:"gear_none",gt:0};return _ps.apply(this,a)}; /* старые повторы: без турбин и ходьбы */
 const _sp=GP.spawn;GP.spawn=function(s){this.tFuel=1;this.wk=null;return _sp.call(this,s)}; /* топливо и шаг ходьбы с нуля при каждом старте — запись и воспроизведение идут одинаково */
 const _cf=cfgOf;cfgOf=function(){return Object.assign(_cf(),{tb:SAVE.eq.gear,gt:window.__ncGait?window.__ncGait():0})}}
/* ---------- турбины: физика и кнопки ---------- */
const TURBO_F_LEG=NC_TURBO_L,TURBO_F_ARM=NC_TURBO_A;
GP.applyTurbo=function(dt){const g=effOf(this).tb,hasL=g==="gear_tl"||g==="gear_tb",hasA=g==="gear_ta"||g==="gear_tb";this.tOn={legs:false,arms:false};
  if(this.tFuel==null)this.tFuel=1;const B=this.B,inp=this.inp;if(!B||!this.st||(!hasL&&!hasA)){this.tFuel=Math.min(1,this.tFuel+dt*.3);return}
  const uL=hasL&&inp.turboL,uA=hasA&&inp.turboA,use=(uL||uA)&&this.tFuel>0;
  this.tFuel=use?Math.max(0,this.tFuel-dt*((uL?.2:0)+(uA?.2:0)+.12)):Math.min(1,this.tFuel+dt*.25);
  if(!use)return;this.tOn={legs:!!uL,arms:!!uA};
  const push=(p,sign,F)=>{const b=B[p],c=PARTS[p],pt=b.getWorldPoint(V2(0,sign*c.hl)),d=b.getWorldVector(V2(0,-sign));b.applyForce(V2(d.x*F,d.y*F),pt,true)};
  if(uL){push("calfL",-1,TURBO_F_LEG);push("calfR",-1,TURBO_F_LEG)}if(uA){push("armL",1,TURBO_F_ARM);push("armR",1,TURBO_F_ARM)}};
/* тяга применяется внутри world.step (см. ниже, в обёртке мира): после разбора записанных нажатий этого шага — так запись и повтор совпадают */
setTimeout(()=>{keyMap.t="turboL";keyMap.y="turboA"},0); /* keyMap объявлен ниже по скрипту */
{const st=document.createElement("style");st.textContent=".zone.tb{display:none}.zone.tb.on{display:block}#zTurboL,#zTurboA{bottom:1.2%;top:auto;height:9%;width:11%;font-size:2vmin;opacity:.85;font-weight:800;color:#2a1000;background:linear-gradient(to top,rgba(255,150,40,.85) calc(var(--f,1)*100%),#ffffff52 0)}#zTurboL{left:33%}#zTurboA{left:45%;background:linear-gradient(to top,rgba(34,211,238,.85) calc(var(--f,1)*100%),#ffffff52 0)}.zone.tb.down{filter:brightness(1.35)}#cgain{position:absolute;right:2%;top:9vmin;z-index:6;color:#ffd24a;font-weight:800;font-size:3.6vmin;text-shadow:0 .3vmin 1vmin rgba(0,0,0,.7);pointer-events:none;opacity:0}#cgain.on{animation:cg 1.4s ease-out}@keyframes cg{0%{opacity:0;transform:translateY(1vmin)}15%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}";document.head.appendChild(st);
 const g=$("game");if(g){const c=document.createElement("div");c.id="cgain";g.appendChild(c)}}
function updTb(){const g=SAVE.eq.gear,L=$("zTurboL"),A=$("zTurboA");if(!L||!A)return;L.classList.toggle("on",g==="gear_tl"||g==="gear_tb");A.classList.toggle("on",g==="gear_ta"||g==="gear_tb");L.textContent="\u{1F680} "+T("x.turboL");A.textContent="\u{1F680} "+T("x.turboA")}
const _as=applySettings;applySettings=function(){_as();updTb()};updTb();
{const _pn2=View3D.prototype.poseNoomi;View3D.prototype.poseNoomi=function(t){_pn2.call(this,t);if(t===W&&t.tFuel!=null){for(const id of["zTurboL","zTurboA"]){const b=$(id);if(b&&b.classList.contains("on"))b.style.setProperty("--f",t.tFuel.toFixed(3))}}}}

/* ---------- монеты за трюки: больше играешь — больше зарабатываешь; прогресс сохраняется (см. хранилище в обёртке магазина) ---------- */
let cgT=0,cgSum=0;
const coinGain=n=>{SAVE.coins+=n;cgSum+=n;const el=$("cgain");if(el){el.textContent="+"+cgSum+" \u{1FA99}";el.classList.remove("on");void el.offsetWidth;el.classList.add("on")}clearTimeout(cgT);cgT=setTimeout(()=>{cgSum=0;persist()},700)};
const _em=GP.emit;GP.emit=function(s,t){if(this===W&&!RP&&lesson<0){const r=s==="regrab"?(t&&t.same?0:2):s==="flip"?3:s==="giant"?6:s==="halftwist"?1:0;if(r)coinGain(r)}return _em.call(this,s,t)};
addEventListener("pagehide",()=>persist());document.addEventListener("visibilitychange",()=>{if(document.hidden)persist()});

/* ---------- перехваты: всего и рекорд серии запоминаются (хранятся в сохранении игры, оно переживает перезапуск) ---------- */
{const RU2={"x.rgTotal":"Перехватов всего","x.rgBest":"Рекорд серии","x.rgTotalS":"перехватов","x.rgBestS":"рекорд серии"},EN2={"x.rgTotal":"Total regrabs","x.rgBest":"Best streak","x.rgTotalS":"regrabs","x.rgBestS":"best streak"};
 for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU2:EN2);
 const st=document.createElement("style");st.textContent=
  ".sbadge{display:inline-flex;align-items:center;gap:.9vmin;height:5.2vmin;padding:0 2.2vmin;border-radius:2.8vmin;background:linear-gradient(180deg,rgba(30,48,82,.62),rgba(12,20,38,.62));border:.2vmin solid rgba(255,255,255,.2);box-shadow:0 .4vmin 1.2vmin rgba(0,0,0,.28),inset 0 .15vmin 0 rgba(255,255,255,.18);color:#fff;font-weight:800;font-size:2.5vmin;line-height:1;white-space:nowrap}"+
  ".sbadge i{font-style:normal;font-size:2.5vmin}.sbadge b{font-weight:800;letter-spacing:.05vmin}.sbadge small{font-size:1.7vmin;font-weight:600;opacity:.72;letter-spacing:.05vmin}.sbadge.gold{color:#ffe27a;border-color:rgba(255,226,122,.4)}"+
  "#cstat{position:absolute;z-index:3;display:flex;align-items:center;gap:1.2vmin;pointer-events:none;left:calc(50% + var(--cw,100px)/2 + 1.6vmin);top:var(--ct,2vmin);height:var(--ch,6vmin)}"+
  "#menu .stat{position:absolute;left:33%;width:36%;top:19.6%;display:flex;justify-content:center;gap:1.4vmin}"+
  "@media(orientation:portrait){.sbadge{height:7.2vw;padding:0 3vw;border-radius:3.8vw;gap:1.4vw;font-size:3.7vw;border-width:.3vw}.sbadge i{font-size:3.7vw}.sbadge small{font-size:2.6vw}"+
  "#cstat{left:50%;transform:translateX(-50%);top:calc(var(--ct,2vmin) + var(--ch,6vmin) + 1.6vw);height:auto;gap:2vw}"+
  "#menu .stat{left:0;width:100%;top:calc(env(safe-area-inset-top) + 13.4%);gap:2.4vw}}";document.head.appendChild(st);
 const m=$("menu");if(m){const d=document.createElement("div");d.className="stat";d.id="mStat";m.appendChild(d)}
 const gm=$("game");if(gm){const d=document.createElement("div");d.id="cstat";gm.appendChild(d)}
 const badges=(full)=>{const n=SAVE.regrabs|0,b=SAVE.bestRG|0;return '<span class="sbadge" title="'+T("x.rgTotal")+'"><i>\u{1F504}</i><b>'+n+'</b>'+(full?'<small>'+T("x.rgTotalS")+'</small>':'')+'</span><span class="sbadge gold" title="'+T("x.rgBest")+'"><i>\u{1F3C6}</i><b>'+b+'</b>'+(full?'<small>'+T("x.rgBestS")+'</small>':'')+'</span>'};
 const setStat=()=>{const e=$("mStat");if(e)e.innerHTML=badges(true)};
 /* плашки рядом со счётчиком: справа от него (горизонт) или под ним по центру (вертикаль) — положение считаем по настоящему размеру #cnt */
 const place=()=>{const c=$("cnt"),e=$("cstat"),g=$("game");if(!c||!e||!g||!c.offsetWidth)return;const r=c.getBoundingClientRect(),pr=g.getBoundingClientRect();e.style.setProperty("--cw",c.offsetWidth+"px");e.style.setProperty("--ct",(r.top-pr.top)+"px");e.style.setProperty("--ch",r.height+"px")};
 addEventListener("resize",()=>requestAnimationFrame(place));
 const _uc=updCnt;updCnt=function(){_uc();if(RG>(SAVE.bestRG|0))SAVE.bestRG=RG;const e=$("cstat");if(e)e.innerHTML=badges(false);place()}; /* основной счётчик #cnt остаётся как в оригинале */
 const _rm=renderMenu;renderMenu=function(){_rm();setStat()};setStat()}

/* ---------- турбники теперь не проходятся животом: перекладина — твёрдая для туловища, головы и бёдер ----------
   (у кистей, рук, голеней и стоп столкновения выключены, чтобы хваты за перекладину работали как раньше; пока висишь на ней и
   0,6 с после отпускания она тоже не мешает) */
{const _lm2=GP.loadMap;
 GP.loadMap=function(s){const r=_lm2.call(this,s);
  for(const b of this.bars||[]){const fx=b.body.createFixture(pl.Circle(b.local,.045),{friction:.35,restitution:.05,filterCategoryBits:CAT_WORLD,filterMaskBits:CAT_BODY});fx.barRef=b}
  this.world.on("pre-solve",c=>{const a=c.getFixtureA(),b=c.getFixtureB(),f=a.barRef?a:b.barRef?b:null;if(!f)return;const o=(f===a?b:a).getBody(),p=o.part||"";
    if(!/^(torso|head|thigh)/.test(p)){c.setEnabled(false);return}
    const st=this.st;if(st&&(st.bar===f.barRef||(st.relBar===f.barRef&&st.releaseT<.6)))c.setEnabled(false);else if(NC_DBG)NC_DBG.push(["bar:"+p,1])});
  return r}}

/* ---------- покупки за звёзды Telegram: у каждого предмета своя цена 1–3 ⭐ (таблица совпадает с серверной), оплата идёт через магазин ---------- */
{const STAR=NC_STAR_PRICES;
 for(const c in ITEMS)for(const it of ITEMS[c])if(it[3]>0&&STAR[it[0]])it[3]=STAR[it[0]];
 const RU3={"x.starNote":"Предметы покупаются за звёзды Telegram (⭐ 1–3). После оплаты предмет сразу появляется в игре и остаётся навсегда.","x.onlyTg":"Покупки работают в Coopix Market в Telegram","x.payFail":"Оплата не прошла","x.cancel":"Покупка отменена","x.bought":"Предмет куплен!","x.starsHdr":"за звёзды"},
  EN3={"x.starNote":"Items are bought with Telegram Stars (⭐ 1–3). After payment the item appears in the game at once and stays forever.","x.onlyTg":"Purchases work inside Coopix Market in Telegram","x.payFail":"Payment failed","x.cancel":"Purchase cancelled","x.bought":"Item purchased!","x.starsHdr":"with Stars"};
 for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU3:EN3);
 {const st=document.createElement("style");st.textContent="#nctoast{position:fixed;left:50%;bottom:9vmin;transform:translateX(-50%);z-index:60;background:rgba(14,20,34,.92);color:#fff;font-weight:700;font-size:3vmin;padding:1.4vmin 3.2vmin;border-radius:2.6vmin;border:.2vmin solid rgba(255,255,255,.25);opacity:0;pointer-events:none;transition:opacity .25s;white-space:nowrap}#nctoast.on{opacity:1}";document.head.appendChild(st);
  const d=document.createElement("div");d.id="nctoast";document.body.appendChild(d)}
 let toastT=0;const ncToast=t=>{const e=$("nctoast");if(!e)return;e.textContent=t;e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),2600)};
 const catOf=id=>{for(const c in ITEMS)if(ITEMS[c].some(x=>x[0]===id))return c};
 const inMarket=()=>{try{return window.parent&&window.parent!==window}catch(e){return false}};
 let PEND=null,pendT=0;
 function buyStar(id,nameKey){if(PEND)return;if(!inMarket()){ncToast(T("x.onlyTg"));return}
  PEND=id;renderShop();clearTimeout(pendT);pendT=setTimeout(()=>{PEND=null;renderShop()},90000);
  try{window.parent.postMessage({coopix:"buy",item:id,name:T(nameKey)},"*")}catch(e){PEND=null;renderShop()}}
 /* ответ магазина: список купленных предметов (с сервера) и итог оплаты */
 addEventListener("message",e=>{if(e.source!==window.parent||!e.data||e.data.coopix!=="items")return;const d=e.data;let changed=false;
  for(const id of d.list||[])if(catOf(id)&&!SAVE.owned[id]){SAVE.owned[id]=1;changed=true}
  if(d.bought&&SAVE.owned[d.bought]){const c=catOf(d.bought);if(c&&changed)SAVE.eq[c]=d.bought}
  if(PEND&&(d.fail||changed||(d.list||[]).includes(PEND))){clearTimeout(pendT);PEND=null;if(d.fail==="pay"||d.fail==="err")ncToast(T("x.payFail"));else if(d.fail==="cancel")ncToast(T("x.cancel"));else if(d.fail==="tg")ncToast(T("x.onlyTg"))}
  if(changed){persist();applySettings();if(screen==="shop")renderShop();ncToast(T("x.bought"))}else if(screen==="shop")renderShop()});
 /* при запуске: что игрок уже купил за звёзды (магазин кладёт список в окно игры) */
 for(const id of window.__CPX_ITEMS||[])if(catOf(id))SAVE.owned[id]=1;
 renderShop=function(){$("shTitle").textContent=T(shopMode==="shop"?"menu.store":"menu.skins");$("shCoins").textContent="";
  const t=$("shBody");t.innerHTML="";const e=document.createElement("div");e.className="cats";
  for(const a in ITEMS){const i=document.createElement("button");i.className="navy"+(a===shopCat?" on":"");i.textContent=T(catName[a]);i.onclick=()=>{shopCat=a;renderShop()};e.appendChild(i)}t.appendChild(e);
  const n=document.createElement("div");n.className="grid";
  ITEMS[shopCat].forEach(([a,i,o,r])=>{const c=SAVE.owned[a],l=SAVE.eq[shopCat]===a;if(shopMode==="skins"&&!c)return;const d=document.createElement("div");d.className="cell";
   d.innerHTML='<div class="n">'+(o?'<span class="sw" style="background:'+o+'"></span>':"")+T(i)+"</div>";
   const p=document.createElement("button");p.className="mini"+(l?" alt":"");p.style.width="100%";const pend=PEND===a;
   p.textContent=l?T("equipped"):c?T("equip"):pend?"…":"⭐ "+r;p.disabled=l||pend;
   p.onclick=()=>{if(!c){buyStar(a,i);return}SAVE.eq[shopCat]=a;if(window.__ncSetItem)window.__ncSetItem(shopCat,a);persist();applySettings();renderShop()};d.appendChild(p);n.appendChild(d)});
  t.appendChild(n)}}

/* ---------- походка и бег: куплены — появляется маленькая кнопка режима, и Нуми Клон ходит/бегает по земле, а не валится ---------- */
{const WK=G=>G.wk||(G.wk={phase:0,cool:0,turn:0,grounded:false});
 let gait=+SAVE.gait||0;const modes=()=>{const m=[0];if(SAVE.owned.move_walk)m.push(1);if(SAVE.owned.move_run)m.push(2);return m};
 if(!modes().includes(gait))gait=0;
 const clamp2=(x,a,b)=>Math.max(a,Math.min(b,x));
 window.__ncGait=()=>gait;
 const on=G=>G===W&&effOf(G).gt>0&&!!G.B&&!!G.st&&!G.st.ragdoll&&G.st.mode!=="bar"&&!(G.st.koT>0);
 {const st=document.createElement("style");st.textContent=".zone.wk{display:none}.zone.wk.on{display:block}#zWalk{left:19.4%;top:2%;width:8vmin;height:8vmin;border-radius:50%;padding:0;font-size:4.6vmin;background:#ffffff8c;box-shadow:0 .3vmin 1vmin rgba(0,0,0,.3)}#zWL,#zWR{bottom:13.5%;top:auto;height:8.5%;width:7%;font-size:3.5vmin;padding:0;opacity:.85}#zWL{left:34.5%}#zWR{left:42%}";document.head.appendChild(st)}
 let goTxt=null;
 function updBtns(){const m=modes(),t=$("zWalk"),L=$("zWL"),R=$("zWR"),go=$("zGo");if(!m.includes(gait))gait=0;
  if(t){t.classList.toggle("on",m.length>1);t.textContent=gait===2?"\u{1F3C3}":gait===1?"\u{1F6B6}":"\u{1F938}";t.title=gait===2?T("x.run"):gait===1?T("x.walk"):""}
  if(L&&R){L.classList.toggle("on",gait>0);R.classList.toggle("on",gait>0)}
  if(go){if(goTxt===null)goTxt=go.textContent;go.textContent=gait>0?T("x.jump"):goTxt}}
 const zw=$("zWalk");if(zw)zw.addEventListener("pointerdown",e=>{e.preventDefault();const m=modes();gait=m[(m.indexOf(gait)+1)%m.length];SAVE.gait=gait;persist();updBtns();if(W.rec)W.recCfg(cfgOf())});
 window.__ncSetItem=(cat,id)=>{if(cat!=="move")return;gait=id==="move_walk"?1:id==="move_run"?2:0;SAVE.gait=gait;updBtns();if(W.rec)W.recCfg(cfgOf())};
 {const _as3=applySettings;applySettings=function(){_as3();updBtns()};updBtns()}
 /* без прилипания и без винтов, пока ходим; «Отпустить» = прыжок */
 {const _wf=GP.weldFeet;GP.weldFeet=function(s){if(on(this))return;return _wf.call(this,s)};
  const _pr=GP.press;GP.press=function(s){if(on(this)&&(s==="letgo"||s==="twL"||s==="twR")){if(s==="letgo")jump(this);return}return _pr.call(this,s)}}
 function jump(G){const WALK=WK(G);if(!WALK.grounded||WALK.cool>0)return;WALK.cool=.45;for(const k in G.B){const b=G.B[k],v=b.getLinearVelocity();b.setLinearVelocity(V2(v.x,5.4))}}
 const _lm3=GP.loadMap;
 GP.loadMap=function(s){const r=_lm3.call(this,s);const G=this,w=this.world,_ws=w.step;w.step=function(...a){try{if(G===W){G.applyTurbo(a[0]);if(G.viceStep)G.viceStep(a[0]);if(on(G))ctl(G,a[0])}}catch(e){}return _ws.apply(this,a)};return r};
 function ctl(G,dt){const B=G.B,J=G.J,st=G.st,tor=B.torso,WALK=WK(G),gait=effOf(G).gt;WALK.cool-=dt;WALK.turn-=dt;
  for(const wj of G.welds)G.world.destroyJoint(wj);G.welds=[];if(st.mode==="stuck"){st.mode="air";st.stuckSpawn=false}
  const p=tor.getPosition(),v=tor.getLinearVelocity();let M=0;for(const k in B)M+=B[k].getMass();
  const gy=G.groundBelow(p.x,p.y+.3),foot=Math.min(B.footL.getPosition().y,B.footR.getPosition().y)-.04,err=gy+1.43-p.y;
  WALK.grounded=foot-gy<.16&&err>-.6;
  const dir=(G.inp.twR?1:0)-(G.inp.twL?1:0),f=G.f;
  if(dir!==0&&dir!==f&&WALK.grounded&&WALK.turn<=0){WALK.turn=.3;G.mirror();return} /* развернуться лицом по ходу */
  const sp=gait===2?3.8:1.7,moving=dir!==0;
  if(WALK.grounded){tor.applyForceToCenter(V2(0,clamp2(M*(55*err-12*v.y),0,M*9.81*2)),true);
   let a=tor.getAngle()%TAU;if(a>Math.PI)a-=TAU;if(a<-Math.PI)a+=TAU;tor.applyTorque(-(30*a+3*tor.getAngularVelocity()),true);
   const cv=G.com().vx,Fx=clamp2(M*7*((moving?dir*sp:0)-cv),-M*12,M*12);for(const k in B)B[k].applyForceToCenter(V2(Fx*B[k].getMass()/M,0),true)} /* тяга распределена по всем частям тела: не заваливает вперёд */
  if(moving||Math.abs(v.x)>.35)WALK.phase+=dt*(gait===2?8:4.6);
  const A=gait===2?36:22,K=gait===2?100:55,mv=moving||Math.abs(v.x)>.35;
  const set=(n,deg)=>{const j=J[n],ang=j.getJointAngle();j.setMaxMotorTorque(j.maxT*3+.6);j.setMotorSpeed(clamp2(14*(deg*D2R*f-ang),-14,14))};
  const leg=(side,off)=>{const ph=WALK.phase+off;set("hip"+side,mv?A*Math.sin(ph):0);set("knee"+side,mv?-K*Math.max(0,Math.cos(ph)):-3);set("ank"+side,0)};
  leg("L",0);leg("R",Math.PI);set("neck",0);
  const sw=mv?18*Math.sin(WALK.phase):0;set("shL",-138+sw);set("shR",-138-sw)}
 if(NC_DBG)window.__ncw={setGait:g=>{gait=g;updBtns()},get grounded(){return WK(W).grounded}};
}

/* ---------- выход в меню из паузы: понятная подпись и отступ сверху (в Telegram там своя кнопка закрытия — их легко перепутать) ---------- */
{const RU4={"x.exit":"В меню"},EN4={"x.exit":"Menu"};for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU4:EN4);
 const st=document.createElement("style");st.textContent="#pL{padding-top:max(56px,calc(env(safe-area-inset-top) + 52px))!important}#pL .hdrow{flex-direction:column;gap:1.6vmin}#pL .hdrow button{flex:none;height:12vmin;font-size:4.6vmin;font-weight:800}#pHome{font-size:4.4vmin!important;white-space:nowrap}@media(orientation:portrait){#pL{margin-top:calc(env(safe-area-inset-top) + 56px)!important;padding-top:3vw!important}#pL .hdrow{flex-direction:row;gap:2.4vw}#pL .hdrow button{flex:1;height:15vw;font-size:8vw}#pHome{flex:2!important;font-size:6vw!important}}";document.head.appendChild(st);
 const lab=()=>{const h=$("pHome");if(h)h.textContent="⌂ "+T("x.exit")};lab();const _sp=show;show=function(t){_sp(t);if(t==="pause")lab()}}

/* ---------- повторы файлом: окно игры в магазине скачивать не умеет (нет allow-downloads), поэтому файл отдаём магазину — он присылает его в чат с ботом (или скачивает на компьютере) ---------- */
{const RU5={"x.fileBot":"Файл повтора отправлен в чат с ботом","x.fileBotOff":"Откройте бота и нажмите Start — тогда он пришлёт файл","x.fileFail":"Не удалось сохранить файл"},EN5={"x.fileBot":"Replay file sent to your chat with the bot","x.fileBotOff":"Open the bot and press Start, then it can send the file","x.fileFail":"Could not save the file"};
 for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU5:EN5);
 const _sf=saveFile;
 saveFile=function(name,data){if(parent===window)return _sf(name,data);try{parent.postMessage({coopix:"file",name:String(name),data:String(data)},"*");return Promise.resolve(true)}catch(e){return _sf(name,data)}};
 addEventListener("message",e=>{const d=e.data;if(!d||d.coopix!=="filedone")return;if(d.ok)flash(T(d.via==="bot"?"x.fileBot":"rp.saved",""),"#7dffb2",2400);else flash(T(d.err==="open_bot"?"x.fileBotOff":"x.fileFail"),"#ffb4a8",3200)})}

/* пока открыта пауза или меню, мои элементы поверх игры (счётчики, кнопки турбин и ходьбы, сообщения) скрыты — иначе закрывают кнопки выхода */
{const st=document.createElement("style");st.textContent=":root{--sbm:max(env(safe-area-inset-bottom),44px)}body.ncp #cstat,body.ncp #xrmsg,body.ncp #xrfx,body.ncp #cgain,body.ncp .zone.tb,body.ncp .zone.wk{display:none!important}@media(orientation:portrait){.zone{font-size:3.4vw}#zGo{bottom:calc(var(--sbm) + 24.7%);width:28.8%;height:11.7%}#zStick{bottom:calc(var(--sbm) + 12.7%);width:28.8%;height:11.7%}#zReset{bottom:calc(var(--sbm) + 1.2%);width:19.2%;height:11.2%}#zMenu{left:21.7%;bottom:calc(var(--sbm) + 1.2%);width:8.8%;height:11.2%;font-size:5.6vw}#zArch{bottom:calc(var(--sbm) + 24.7%);width:28.8%;height:11.7%}#zTuck{bottom:calc(var(--sbm) + 12.7%);width:28.8%;height:11.7%}#zStr{bottom:calc(var(--sbm) + 1.2%);width:28.8%;height:11.2%}#adv .zone{left:40.9%;width:18.2%;font-size:2.8vw}#zPike{bottom:calc(var(--sbm) + 27.8%);height:8.6%}#zTl{bottom:calc(var(--sbm) + 18.8%);height:8.6%}#zTr{bottom:calc(var(--sbm) + 10%);height:8.6%}#zRag{bottom:calc(var(--sbm) + 1.2%);height:8.5%}#zWL,#zWR,#zTurboL,#zTurboA{top:auto;bottom:calc(var(--sbm) + 37.9%);height:5%;width:14%;font-size:2.5vw}#zWL{left:1.5%}#zWR{left:16.5%}#zTurboL{left:70.5%}#zTurboA{left:85%;width:13.5%}#zWalk{top:auto;bottom:calc(var(--sbm) + 37.9%);left:40%;width:10vw;height:10vw;font-size:5vw}}";document.head.appendChild(st);
 const _show=show;show=function(t){_show(t);document.body.classList.toggle("ncp",t!=="game")};setTimeout(()=>document.body.classList.toggle("ncp",screen!=="game"),0)}
}
