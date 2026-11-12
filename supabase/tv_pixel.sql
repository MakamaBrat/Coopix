-- Мини-игры для «телевизора»: чёткий пиксельный шрифт (UNIK, Stick Fight, Gravity Fight). Выполнить один раз.
update public.games set play_html = $cpx$<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>UNIK — мини-тест</title>
<style>html,body{margin:0;height:100%;background:#0b0618;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}canvas{display:block;width:100%;height:100%}</style>
</head><body><canvas id="c"></canvas>
<script>
/* UNIK — мини-тест для «телевизора» Coopix: дуэль с ботом. Кладите карту того же цвета или числа,
   +2 заставляет взять две, ⟲ пропускает ход соперника. Нет хода — нажмите на колоду. Первым без карт — победа. */
(()=>{const c=document.getElementById("c"),x=c.getContext("2d");let W=0,H=0,S=1,OX=0,OY=0;
const fit=()=>{const d=Math.min(devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);S=Math.min(W/320,H/220);OX=(W-320*S)/2;OY=(H-220*S)/2};
addEventListener("resize",fit);fit();
const COL=["#e8231b","#f5c518","#22b04b","#1f6fe0"],DK=["#8e120d","#9a7a05","#11692c","#0e3f87"];
let deck,me,bot,top,turn,st="menu",msg="",msgT=0,wins=0,loss=0,anim=[],botT=0,hover=-1;
try{const s=JSON.parse(localStorage.getItem("unik.tv")||"{}");wins=s.w|0;loss=s.l|0}catch(e){}
const save=()=>{try{localStorage.setItem("unik.tv",JSON.stringify({w:wins,l:loss}))}catch(e){}};
function newDeck(){const d=[];for(let c=0;c<4;c++){for(let v=0;v<=9;v++){d.push({c,v});if(v)d.push({c,v})}for(let k=0;k<2;k++){d.push({c,v:"+2"});d.push({c,v:"⟲"})}}
  for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}return d}
function draw1(h){if(!deck.length)deck=newDeck();h.push(deck.pop())}
function start(){deck=newDeck();me=[];bot=[];for(let i=0;i<7;i++){draw1(me);draw1(bot)}do{top=deck.pop()}while(typeof top.v!=="number");turn=0;st="play";say("Ваш ход");}
const ok=k=>k.c===top.c||k.v===top.v;
function say(t){msg=t;msgT=90}
let AC=null;function beep(f,d,t,v){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
function play(who,i){const h=who?bot:me,k=h.splice(i,1)[0];anim.push({k,t:0,from:who?[160,22]:[160,190]});top=k;beep(who?330:660,.08,"triangle",.06);
  if(!h.length){st="over";if(who){loss++;say("Бот победил")}else{wins++;say("Победа!")}save();return}
  if(h.length===1)say(who?"Бот: UNIK!":"UNIK!");
  const other=who?me:bot;let skip=false;
  if(k.v==="+2"){draw1(other);draw1(other);skip=true;if(!h.length)return;say(who?"Вам +2":"Боту +2")}
  else if(k.v==="⟲"){skip=true;say(who?"Бот пропускает ваш ход":"Бот пропускает ход")}
  turn=skip?(who?1:0):(who?0:1);if(turn===1)botT=40}
function take(who){const h=who?bot:me;draw1(h);beep(220,.06,"square",.04);const k=h[h.length-1];
  if(ok(k)){if(who){botT=30;return}say("Можно положить взятую");return}
  turn=who?0:1;if(turn===1)botT=40;else say("Ваш ход")}
function botMove(){const i=bot.findIndex(ok);if(i>=0){const pref=bot.findIndex(k=>ok(k)&&typeof k.v!=="number"&&me.length<=3);play(1,pref>=0?pref:i)}else take(1)}
function step(){if(msgT)msgT--;anim=anim.filter(a=>(a.t+=.08)<1);
  if(st==="play"&&turn===1&&--botT<=0)botMove()}
/* ---------- рисование ---------- */
function rr(px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()}
function card(k,px,py,w,h,face,lift,dim){x.save();x.translate(px,py-(lift||0));
  x.shadowColor="rgba(0,0,0,.45)";x.shadowBlur=6;x.shadowOffsetY=2;rr(0,0,w,h,w*.14);x.fillStyle="#fff";x.fill();x.shadowBlur=0;x.shadowOffsetY=0;
  rr(w*.07,w*.07,w*.86,h-w*.14,w*.1);
  if(!face){x.fillStyle="#1a1030";x.fill();x.save();x.translate(w/2,h/2);x.rotate(-.5);x.fillStyle="#e8231b";x.beginPath();x.ellipse(0,0,w*.32,h*.3,0,0,7);x.fill();x.restore();
    x.fillStyle="#f5c518";x.font="bold "+(w*.24|0)+"px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("UNIK",w/2,h/2+1)}
  else{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,COL[k.c]);g.addColorStop(1,DK[k.c]);x.fillStyle=g;x.fill();
    x.save();x.translate(w/2,h/2);x.rotate(-.5);x.fillStyle="rgba(255,255,255,.92)";x.beginPath();x.ellipse(0,0,w*.3,h*.32,0,0,7);x.fill();x.restore();
    const t=String(k.v);x.textAlign="center";x.textBaseline="middle";x.font="900 "+(w*(t.length>1?.36:.5)|0)+"px sans-serif";x.lineWidth=w*.06;x.strokeStyle=DK[k.c];x.strokeText(t,w/2,h/2+1);x.fillStyle=COL[k.c];x.fillText(t,w/2,h/2+1);
    x.font="900 "+(w*.2|0)+"px sans-serif";x.fillStyle="#fff";x.fillText(t,w*.2,h*.14);x.fillText(t,w*.8,h*.86)}
  if(dim){rr(0,0,w,h,w*.14);x.fillStyle="rgba(10,5,25,.45)";x.fill()}x.restore()}
const CW=34,CH=50;
/* пиксельные надписи «как на телике»: текст рисуется в маленький холст 320×220 и растягивается без сглаживания */
const L=document.createElement("canvas");L.width=320;L.height=220;const lx=L.getContext("2d");
/* чёткие пиксели: у надписей убираем сглаживание (каждый пиксель либо есть, либо нет) */
function crisp(){const d=lx.getImageData(0,0,L.width,L.height),p=d.data;for(let i=3;i<p.length;i+=4){if(p[i])p[i]=p[i]<100?0:255}lx.putImageData(d,0,0)}
function pt(t,px,py,size,fill,al,stroke){lx.font=(size>=14?"bold ":"")+(size<14?size+1:size)+"px monospace";lx.textAlign=al||"center";lx.textBaseline="alphabetic";
  if(stroke){lx.lineWidth=Math.max(2,size/4);lx.strokeStyle=stroke;lx.lineJoin="round";lx.strokeText(t,px|0,py|0)}lx.fillStyle=fill;lx.fillText(t,px|0,py|0)}
function handPos(n,i,y){const gap=Math.min(CW+4,(300-CW)/Math.max(1,n-1));const w=gap*(n-1)+CW;return[160-w/2+i*gap,y]}
function draw(){x.setTransform(1,0,0,1,0,0);const d=c.width/W;x.setTransform(d,0,0,d,0,0);
  const bg=x.createRadialGradient(W/2,H/2,10,W/2,H/2,Math.max(W,H)*.7);bg.addColorStop(0,"#2a145e");bg.addColorStop(1,"#0b0618");x.fillStyle=bg;x.fillRect(0,0,W,H);
  lx.clearRect(0,0,320,220);x.save();x.translate(OX,OY);x.scale(S,S);
  x.strokeStyle="rgba(165,107,255,.25)";x.lineWidth=2;x.beginPath();x.ellipse(160,110,120,44,0,0,7);x.stroke();
  if(st!=="menu"){
    bot.forEach((k,i)=>{const [px,py]=handPos(bot.length,i,4);card(k,px,py,CW*.8,CH*.8,false)});
    card(null,112,84,CW,CH,false);pt("ВЗЯТЬ",129,144,8,"#cfc2ff");
    card(top,174,84,CW,CH,true);
    for(const a of anim){const e=1-(1-a.t)**3;card(a.k,a.from[0]+(174-a.from[0])*e-CW/2*(1-e),a.from[1]+(84-a.from[1])*e,CW,CH,true)}
    me.forEach((k,i)=>{const [px,py]=handPos(me.length,i,162);card(k,px,py,CW,CH,true,i===hover?8:(turn===0&&st==="play"&&ok(k)?4:0),turn===0&&st==="play"&&!ok(k))});
    pt("БОТ: "+bot.length,6,58,9,"#fff","left");pt("ПОБЕДЫ "+wins+":"+loss,314,58,9,"#fff","right");
    if(st==="play")pt(turn===0?"▼ ВАШ ХОД":"▲ ХОДИТ БОТ",160,156,9,turn===0?"#7dffb0":"#ff9ad0");
    if(msgT){lx.globalAlpha=Math.min(1,msgT/20);pt(msg.toUpperCase(),160,76,14,"#fff","center","#2a1260");lx.globalAlpha=1}}
  if(st!=="play"){x.fillStyle="rgba(8,4,20,"+(st==="menu"?.35:.7)+")";x.fillRect(-OX/S,-OY/S,W/S,H/S);x.textAlign="center";
    const g=lx.createLinearGradient(0,60,0,92);g.addColorStop(0,"#fff");g.addColorStop(1,"#bfaaff");pt("UNIK",160,88,38,g,"center","#2a1260");
    pt(st==="over"?(msg+" · "+wins+":"+loss).toUpperCase():"МИНИ-ТЕСТ · ДУЭЛЬ С БОТОМ",160,110,11,"#ffd84d");
    if((Date.now()/500|0)%2===0)pt("НАЖМИТЕ, ЧТОБЫ ИГРАТЬ",160,140,11,"#fff");
    pt("Цвет или число совпало — кладите,",160,162,9,"#b8a8f0");pt("нет хода — берите из колоды.",160,173,9,"#b8a8f0");
    pt("Полная версия — «Играть» / «Скачать»",160,190,9,"#b8a8f0")}
  x.restore();x.save();x.imageSmoothingEnabled=false;crisp();x.drawImage(L,OX,OY,320*S,220*S);x.restore()}
/* ---------- управление: нажатие на карту / колоду ---------- */
function at(ev){const r=c.getBoundingClientRect();return[(ev.clientX-r.left-OX)/S,(ev.clientY-r.top-OY)/S]}
function hit(px,py){for(let i=me.length-1;i>=0;i--){const [hx,hy]=handPos(me.length,i,162);if(px>=hx&&px<=hx+CW&&py>=hy-8&&py<=hy+CH)return i}return -1}
c.addEventListener("pointerdown",e=>{e.preventDefault();if(st!=="play"){start();return}if(turn!==0)return;const [px,py]=at(e);
  if(px>=112&&px<=112+CW&&py>=84&&py<=84+CH){take(0);return}
  const i=hit(px,py);if(i<0)return;if(ok(me[i]))play(0,i);else{say("Не подходит");beep(120,.1,"square",.04)}});
c.addEventListener("pointermove",e=>{if(st!=="play"){hover=-1;return}const [px,py]=at(e);hover=hit(px,py)});
addEventListener("keydown",e=>{if(st!=="play"&&(e.code==="Space"||e.code==="Enter")){e.preventDefault();start()}});
let acc=0,last=performance.now();(function loop(t){requestAnimationFrame(loop);acc+=Math.min(100,t-last);last=t;while(acc>=16.7){step();acc-=16.7}draw()})(last);
})();
</script></body></html>
$cpx$, updated_at = now() where id = 'unik';
update public.games set play_html = $cpx$<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Stick Fight — мини-тест</title>
<style>html,body{margin:0;height:100%;background:#0b0618;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}
canvas{display:block;width:100%;height:100%}</style></head><body><canvas id="c"></canvas>
<script>
/* Stick Fight — микро-тест для «телевизора» Coopix: стикмен против волн ботов.
   ПК: ←/→ или A/D — бег, ↑/W/пробел — прыжок, X/J/клик — выстрел. Телефон: кнопки на экране. */
(()=>{const c=document.getElementById("c"),x=c.getContext("2d");let W=0,H=0,S=1;
const fit=()=>{const d=Math.min(devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);S=Math.min(W/320,H/200)};
addEventListener("resize",fit);fit();
/* мир 320×200, масштабируется под экран */
const G=.32,PL=[[0,184,320],[40,132,90],[190,132,90],[110,88,100]];
const K={};let st="menu",P,E,B,FX,score,best=0,wave,spawnT,shake=0,t0=0,flash=0;
try{best=+localStorage.getItem("sf.tv")||0}catch(e){}
const man=(px,col,ai)=>({x:px,y:150,vx:0,vy:0,f:1,hp:ai?1:5,col,ai,cd:0,on:0,run:0,hit:0,jt:0});
function reset(){P=man(150,"#4df3ff",0);E=[];B=[];FX=[];score=0;wave=0;spawnT=40;st="play";nextWave()}
function nextWave(){wave++;const n=Math.min(2+wave,8);for(let i=0;i<n;i++)setTimeout(()=>{if(st!=="play")return;const s=Math.random()<.5;const e=man(s?-10:330,"#ff4fa3",1);e.y=40+Math.random()*80;e.f=s?1:-1;e.sp=.55+Math.random()*.35+wave*.04;e.cd=40+Math.random()*60;E.push(e)},i*500)}
function ground(m){m.on=0;for(const p of PL){if(m.x>p[0]-3&&m.x<p[0]+p[2]+3&&m.vy>=0&&m.y<=p[1]&&m.y+m.vy>=p[1]-.1){m.y=p[1];m.vy=0;m.on=1}}}
function shoot(m){if(m.cd>0)return;m.cd=m.ai?70+Math.random()*50:11;B.push({x:m.x+m.f*9,y:m.y-15,vx:m.f*(m.ai?3.2:5.5),own:m.ai?1:0,l:90});
  FX.push({x:m.x+m.f*11,y:m.y-15,r:5,l:5,c:"#fff6a8"});if(!m.ai)beep(880,.03,"square",.05)}
function burst(px,py,col,n){for(let i=0;i<n;i++)FX.push({x:px,y:py,vx:(Math.random()-.5)*4,vy:-Math.random()*3.5,l:22+Math.random()*14,c:col,p:1})}
let AC=null;function beep(f,d,t,v){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
function step(){
  if(st!=="play")return;const L=K.l||K.a,R=K.r||K.d;
  P.vx=(R?1.9:0)-(L?1.9:0);if(P.vx)P.f=Math.sign(P.vx);
  if(K.j&&P.on&&!P.jt){P.vy=-6.6;P.jt=1;beep(420,.08,"triangle",.05)}if(!K.j)P.jt=0;
  if(K.s)shoot(P);
  for(const m of [P,...E]){m.vy+=G;m.x+=m.vx;ground(m);if(!m.on)m.y+=m.vy;else if(m.vy<0)m.y+=m.vy;m.cd--;m.hit&&m.hit--;if(m.vx)m.run+=.25}
  P.x=Math.max(6,Math.min(314,P.x));if(P.y>230){P.y=60;P.x=160;P.vy=0;hurt()}
  for(const e of E){const dx=P.x-e.x;e.f=Math.sign(dx)||1;const far=Math.abs(dx)>70;e.vx=far?e.f*e.sp:(Math.abs(dx)<40?-e.f*e.sp*.6:0);
    if(e.on&&P.y<e.y-30&&Math.random()<.02)e.vy=-6.2;if(Math.abs(P.y-e.y)<30&&Math.abs(dx)<170)shoot(e);if(e.y>230)e.dead=1}
  for(const b of B){b.x+=b.vx;b.l--;if(b.x<-10||b.x>330)b.l=0;
    if(b.own){if(Math.abs(b.x-P.x)<5&&b.y>P.y-26&&b.y<P.y){b.l=0;hurt()}}
    else for(const e of E){if(!e.dead&&Math.abs(b.x-e.x)<5&&b.y>e.y-26&&b.y<e.y){b.l=0;e.dead=1;score++;shake=5;burst(e.x,e.y-14,"#ff4fa3",14);beep(160,.12,"sawtooth",.06)}}}
  B=B.filter(b=>b.l>0);E=E.filter(e=>!e.dead);
  if(!E.length){spawnT--;if(spawnT<=0){spawnT=50;nextWave()}}
  for(const f of FX){f.l--;if(f.p){f.x+=f.vx;f.y+=f.vy;f.vy+=.18}}FX=FX.filter(f=>f.l>0);
  shake*=.85;flash&&flash--}
function hurt(){if(P.hit)return;P.hp--;P.hit=50;shake=8;flash=8;burst(P.x,P.y-14,"#4df3ff",10);beep(110,.2,"square",.07);
  if(P.hp<=0){st="over";if(score>best){best=score;try{localStorage.setItem("sf.tv",best)}catch(e){}}}}
/* ---------- рисование ---------- */
function stick(m,t){const run=m.vx?Math.sin(m.run):0,air=!m.on;x.save();x.translate(m.x,m.y);
  if(m.hit&&(m.hit>>2)%2){x.globalAlpha=.35}
  x.strokeStyle=m.col;x.lineWidth=2.4;x.lineCap="round";x.shadowColor=m.col;x.shadowBlur=8;
  x.beginPath();x.arc(0,-23,4.2,0,7);x.stroke();
  x.beginPath();x.moveTo(0,-18.5);x.lineTo(0,-8);
  const a=air?.6:run*.8;x.moveTo(0,-8);x.lineTo(Math.sin(a)*7,0);x.moveTo(0,-8);x.lineTo(-Math.sin(a)*7,0);
  x.moveTo(0,-15);x.lineTo(m.f*8,-15);x.moveTo(0,-15);x.lineTo(-m.f*4+run*2,-9);x.stroke();
  x.shadowBlur=0;x.fillStyle="#cfd6ff";x.fillRect(m.f>0?6:-12,-17,6,3);x.restore()}
/* пиксельные надписи «как на телике»: текст рисуется в маленький холст 320×200 и растягивается без сглаживания */
const L=document.createElement("canvas");L.width=320;L.height=200;const lx=L.getContext("2d");
/* чёткие пиксели: у надписей убираем сглаживание (каждый пиксель либо есть, либо нет) */
function crisp(){const d=lx.getImageData(0,0,L.width,L.height),p=d.data;for(let i=3;i<p.length;i+=4){if(p[i])p[i]=p[i]<100?0:255}lx.putImageData(d,0,0)}
function pt(t,px,py,size,fill,al,stroke){lx.font=(size>=14?"bold ":"")+(size<14?size+1:size)+"px monospace";lx.textAlign=al||"center";lx.textBaseline="alphabetic";
  if(stroke){lx.lineWidth=Math.max(2,size/4);lx.strokeStyle=stroke;lx.lineJoin="round";lx.strokeText(t,px|0,py|0)}lx.fillStyle=fill;lx.fillText(t,px|0,py|0)}
function draw(){lx.clearRect(0,0,320,200);x.save();x.fillStyle="#0b0618";x.fillRect(0,0,W,H);
  const ox=(W-320*S)/2+(Math.random()-.5)*shake,oy=(H-200*S)/2+(Math.random()-.5)*shake;x.translate(ox,oy);x.scale(S,S);
  const g=x.createLinearGradient(0,0,0,200);g.addColorStop(0,"#1c0d3d");g.addColorStop(1,"#0a0518");x.fillStyle=g;x.fillRect(0,0,320,200);
  x.strokeStyle="rgba(140,90,255,.12)";x.lineWidth=1;for(let i=0;i<=320;i+=20){x.beginPath();x.moveTo(i,0);x.lineTo(i,200);x.stroke()}for(let j=0;j<=200;j+=20){x.beginPath();x.moveTo(0,j);x.lineTo(320,j);x.stroke()}
  for(const p of PL){x.fillStyle="#2a1a66";x.fillRect(p[0],p[1],p[2],p[0]?6:16);x.fillStyle="#a56bff";x.shadowColor="#a56bff";x.shadowBlur=6;x.fillRect(p[0],p[1],p[2],2);x.shadowBlur=0}
  if(st!=="menu"){for(const b of B){x.fillStyle=b.own?"#ff8fc6":"#fff6a8";x.shadowColor=x.fillStyle;x.shadowBlur=6;x.fillRect(b.x-3,b.y-1,6,2)}x.shadowBlur=0;
    for(const e of E)stick(e);stick(P);
    for(const f of FX){x.globalAlpha=Math.min(1,f.l/10);x.fillStyle=f.c;if(f.p)x.fillRect(f.x,f.y,2,2);else{x.beginPath();x.arc(f.x,f.y,f.r,0,7);x.fill()}}x.globalAlpha=1;
    pt("СЧЁТ "+score,8,14,11,"#fff","left");pt("ВОЛНА "+wave,312,14,11,"#fff","right");
    for(let i=0;i<5;i++){x.fillStyle=i<P.hp?"#4df3ff":"#33236a";x.fillRect(8+i*9,19,7,4)}}
  if(flash){x.fillStyle="rgba(255,60,120,"+flash/30+")";x.fillRect(0,0,320,200)}
  if(st!=="play"){x.fillStyle="rgba(8,4,20,.72)";x.fillRect(0,0,320,200);x.textAlign="center";
    pt("STICK FIGHT",160,70,30,"#4df3ff","center","#123a52");
    pt(st==="over"?"ВЫ ПАЛИ · СЧЁТ "+score+" · РЕКОРД "+best:"МИНИ-ТЕСТ · ВОЛНЫ БОТОВ",160,92,11,"#ff4fa3");
    if((Date.now()/500|0)%2===0)pt("НАЖМИТЕ, ЧТОБЫ ИГРАТЬ",160,122,11,"#fff");
    pt(TOUCH?"КНОПКИ ВНИЗУ: БЕГ · ПРЫЖОК · ОГОНЬ":"←→ БЕГ · ↑ ПРЫЖОК · X — ОГОНЬ",160,146,9,"#9a8cd0");
    pt("ПОЛНАЯ ВЕРСИЯ — «ИГРАТЬ» / «СКАЧАТЬ»",160,160,9,"#9a8cd0")}
  x.restore();x.save();x.imageSmoothingEnabled=false;crisp();x.drawImage(L,(W-320*S)/2,(H-200*S)/2,320*S,200*S);x.restore();if(TOUCH&&st==="play")pads()}
/* ---------- управление ---------- */
let TOUCH=matchMedia("(pointer:coarse)").matches;const PADS=[["l","◀",.09],["r","▶",.24],["j","▲",.76],["s","✦",.91]];
function pads(){const r=Math.max(22,Math.min(W,H)*.09);x.font="bold "+(r*.8|0)+"px sans-serif";x.textAlign="center";x.textBaseline="middle";
  for(const [k,t,px] of PADS){const cx=W*px,cy=H-r*1.3;x.globalAlpha=K[k]?.55:.28;x.fillStyle="#a56bff";x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.globalAlpha=.9;x.fillStyle="#fff";x.fillText(t,cx,cy+1)}x.globalAlpha=1;x.textBaseline="alphabetic"}
const touches=new Map();
function padAt(px,py){const r=Math.max(22,Math.min(W,H)*.09);for(const [k,,f] of PADS){if(Math.hypot(px-W*f,py-(H-r*1.3))<r*1.5)return k}return null}
function syncPads(){for(const [k] of PADS)K[k]=false;for(const k of touches.values())if(k)K[k]=true}
c.addEventListener("pointerdown",e=>{e.preventDefault();if(e.pointerType==="touch")TOUCH=true;if(st!=="play"){reset();return}
  if(e.pointerType==="touch"){touches.set(e.pointerId,padAt(e.offsetX,e.offsetY));syncPads()}else{K.s=true}});
c.addEventListener("pointermove",e=>{if(touches.has(e.pointerId)){touches.set(e.pointerId,padAt(e.offsetX,e.offsetY));syncPads()}});
const up=e=>{if(touches.delete(e.pointerId))syncPads();else K.s=false};c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);
const KM={ArrowLeft:"l",KeyA:"a",ArrowRight:"r",KeyD:"d",ArrowUp:"j",KeyW:"j",Space:"j",KeyX:"s",KeyJ:"s",Enter:"s"};
addEventListener("keydown",e=>{const k=KM[e.code];if(!k)return;e.preventDefault();if(st!=="play"&&(k==="s"||k==="j")){reset();return}K[k]=true});
addEventListener("keyup",e=>{const k=KM[e.code];if(k)K[k]=false});
/* фиксированный шаг 60 Гц, кадры — по экрану */
let acc=0,last=performance.now();(function loop(t){requestAnimationFrame(loop);acc+=Math.min(100,t-last);last=t;while(acc>=16.7){step();acc-=16.7}draw()})(last);
})();
</script></body></html>
$cpx$, updated_at = now() where id = 'stickfight';
update public.games set play_html = $cpx$<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Gravity Fight — мини-тест</title>
<style>html,body{margin:0;height:100%;background:#fbfaf6;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}canvas{display:block;width:100%;height:100%}</style>
</head><body><canvas id="c"></canvas>
<script>
/* Gravity Fight — мини-тест для «телевизора» Coopix. Простая надёжная физика: по земле мотоцикл едет вдоль трассы,
   на горках взлетает; в воздухе его наклоняют, приземляться нужно на колёса (угол близок к склону), иначе падение.
   ↑/W газ · ↓/S тормоз · ←/→ наклон в воздухе. Телефон: кнопки на экране. Мышь: зажать — газ. */
(()=>{const c=document.getElementById("c"),x=c.getContext("2d");let W=0,H=0,S=1,OX=0,OY=0;
const fit=()=>{const d=Math.min(devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*d;c.height=H*d;S=Math.min(W/320,H/200);OX=(W-320*S)/2;OY=(H-200*S)/2};
addEventListener("resize",fit);fit();
/* трасса: плавные холмы и трамплины, в конце флажок */
const T=[];let FIN=0;
(()=>{let px=-80,py=150;T.push([px,py],[70,150]);px=70;
  for(const [dx,dy] of [[60,-10],[40,-26],[24,30],[70,0],[50,-30],[30,-14],[20,48],[80,0],[40,-20],[40,-20],[16,44],[90,0],[60,-34],[20,-8],[24,50],[70,0],[50,-24],[40,24],[120,0]]){px+=dx;py=Math.max(70,Math.min(170,py+dy));T.push([px,py])}
  FIN=px-60;T.push([px+400,py])})();
function gnd(px){for(let i=1;i<T.length;i++){const [x0,y0]=T[i-1],[x1,y1]=T[i];if(px<=x1){const k=Math.max(0,(px-x0)/(x1-x0));return[y0+(y1-y0)*k,Math.atan2(y1-y0,x1-x0)]}}return[T[T.length-1][1],0]}
const K={};let st="menu",P,tm=0,best=0,cam=0,msg="",trail=[];
try{best=+localStorage.getItem("gf.tv2")||0}catch(e){}
function reset(){P={x:30,y:150,v:0,vx:0,vy:0,a:0,w:0,air:0};st="play";tm=0;cam=0;trail=[]}
function step(){if(st!=="play")return;tm+=1/60;const gas=K.u?1:0,brk=K.d?1:0,lean=(K.r?1:0)-(K.l?1:0);
  if(!P.air){const [gy,sl]=gnd(P.x);
    P.v+=gas*.07-brk*.12+Math.sin(sl)*.09;P.v*=.994;P.v=Math.max(0,Math.min(4.2,P.v));
    const nx=P.x+P.v*Math.cos(sl),[ny]=gnd(nx),fy=gy+P.v*Math.sin(sl);
    /* земля уходит вниз быстрее, чем едем — взлёт */
    if(ny>fy+1.2&&P.v>1.6){P.air=1;P.vx=P.v*Math.cos(sl);P.vy=P.v*Math.sin(sl);P.w=0}
    else{P.x=nx;P.y=ny;P.a+=(gnd(nx)[1]-P.a)*.35}}
  else{P.vy+=.16;P.x+=P.vx;P.y+=P.vy;P.w+=lean*.012;P.w*=.97;P.a+=P.w;if(!lean)P.a+=(gnd(P.x+P.vx*8)[1]-P.a)*.035; /* без нажатий мотоцикл сам понемногу выравнивается под склон */
    const [gy,sl]=gnd(P.x);
    if(P.y>=gy){let d=P.a-sl;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
      if(Math.abs(d)<.9){P.air=0;P.y=gy;P.a=sl;P.v=Math.max(0,P.vx*Math.cos(sl)+P.vy*Math.sin(sl));beep(160,.06,"triangle",.05)}
      else{st="over";msg="ПАДЕНИЕ! ПРИЗЕМЛЯЙТЕСЬ НА КОЛЁСА";P.y=gy;beep(90,.3,"sawtooth",.08)}}}
  if(gas&&!P.air&&Math.random()<.5)trail.push({x:P.x-8*Math.cos(P.a),y:P.y,l:18});trail=trail.filter(p=>--p.l>0);
  if(P.x>FIN){st="over";const s=tm;if(!best||s<best){best=s;try{localStorage.setItem("gf.tv2",best)}catch(e){}}msg="ФИНИШ · "+s.toFixed(1)+" С";beep(880,.2,"triangle",.07)}
  cam+=(P.x-110-cam)*.15}
let AC=null;function beep(f,d,t,v){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
/* пиксельные надписи «как на телике» */
const L=document.createElement("canvas");L.width=320;L.height=200;const lx=L.getContext("2d");
/* чёткие пиксели: у надписей убираем сглаживание (каждый пиксель либо есть, либо нет) */
function crisp(){const d=lx.getImageData(0,0,L.width,L.height),p=d.data;for(let i=3;i<p.length;i+=4){if(p[i])p[i]=p[i]<100?0:255}lx.putImageData(d,0,0)}
function pt(t,px,py,size,fill,al,stroke){lx.font=(size>=14?"bold ":"")+(size<14?size+1:size)+"px monospace";lx.textAlign=al||"center";if(stroke){lx.lineWidth=Math.max(2,size/4);lx.strokeStyle=stroke;lx.lineJoin="round";lx.strokeText(t,px|0,py|0)}lx.fillStyle=fill;lx.fillText(t,px|0,py|0)}
function bike(){x.save();x.translate(P.x,P.y);x.rotate(P.a);x.lineCap="round";x.lineJoin="round";
  x.strokeStyle="#1f6fe0";x.shadowBlur=0;x.lineWidth=2;
  for(const wx of [-11,11]){x.beginPath();x.arc(wx,-6,6,0,7);x.stroke()}
  x.beginPath();x.moveTo(-11,-6);x.lineTo(-3,-13);x.lineTo(7,-13);x.lineTo(11,-6);x.moveTo(7,-13);x.lineTo(9,-19);x.stroke();
  x.strokeStyle="#e8231b";x.beginPath();x.moveTo(-2,-14);x.lineTo(0,-24);x.lineTo(8,-19);x.moveTo(-2,-14);x.lineTo(4,-9);x.stroke();
  x.beginPath();x.arc(1,-29,4,0,7);x.stroke();x.shadowBlur=0;x.restore()}
function draw(){const d=c.width/W;x.setTransform(d,0,0,d,0,0);x.fillStyle="#fbfaf6";x.fillRect(0,0,W,H);lx.clearRect(0,0,320,200);
  x.save();x.translate(OX,OY);x.scale(S,S);x.beginPath();x.rect(0,0,320,200);x.clip();
  x.fillStyle="#fbfaf6";x.fillRect(0,0,320,200);
  const cx=P?cam:0;x.strokeStyle="rgba(110,140,200,.18)";x.lineWidth=1;for(let i=-(cx*.5%20);i<=320;i+=20){x.beginPath();x.moveTo(i,0);x.lineTo(i,200);x.stroke()}for(let j=0;j<=200;j+=20){x.beginPath();x.moveTo(0,j);x.lineTo(320,j);x.stroke()}
  x.translate(-cx,0);
  x.beginPath();x.moveTo(T[0][0],220);for(const p of T)x.lineTo(p[0],p[1]);x.lineTo(T[T.length-1][0],220);x.closePath();x.fillStyle="#efede6";x.fill();
  x.strokeStyle="#222";x.shadowBlur=0;x.lineWidth=3;x.lineJoin="round";x.beginPath();T.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();x.shadowBlur=0;
  const [fy]=gnd(FIN);x.strokeStyle="#222";x.lineWidth=2;x.beginPath();x.moveTo(FIN,fy);x.lineTo(FIN,fy-34);x.stroke();
  for(let i=0;i<4;i++)for(let j=0;j<3;j++){x.fillStyle=(i+j)%2?"#222":"#fff";x.fillRect(FIN+i*4,fy-34+j*4,4,4)}
  for(const p of trail){x.globalAlpha=p.l/18;x.fillStyle="#999";x.fillRect(p.x,p.y-2,2,2)}x.globalAlpha=1;
  if(P)bike();x.restore();
  if(st==="play"){pt(tm.toFixed(1)+" С",8,14,11,"#222","left");if(best)pt("РЕКОРД "+best.toFixed(1),312,14,11,"#222","right");if(P.air)pt("НАКЛОН ←→",160,14,9,"#e8231b")}
  else{x.save();x.translate(OX,OY);x.scale(S,S);x.fillStyle="rgba(251,250,246,"+(st==="menu"?.55:.78)+")";x.fillRect(0,0,320,200);x.restore();
    pt("GRAVITY",160,60,30,"#fff","center","#222");pt("FIGHT",160,90,30,"#e8231b","center","#222");
    pt(st==="over"?msg:"МИНИ-ТЕСТ · ОДНА ТРАССА",160,110,10,"#1f6fe0");
    if((Date.now()/500|0)%2===0)pt("НАЖМИТЕ, ЧТОБЫ ЕХАТЬ",160,136,11,"#222");
    pt(TOUCH?"▲ ГАЗ · ■ ТОРМОЗ · ◀▶ НАКЛОН":"↑ ГАЗ · ↓ ТОРМОЗ · ←→ НАКЛОН",160,158,9,"#666");
    pt("ПОЛНАЯ ВЕРСИЯ — «ИГРАТЬ» / «СКАЧАТЬ»",160,172,9,"#666")}
  x.save();x.imageSmoothingEnabled=false;crisp();x.drawImage(L,OX,OY,320*S,200*S);x.restore();if(TOUCH&&st==="play")pads()}
/* ---------- управление ---------- */
let TOUCH=matchMedia("(pointer:coarse)").matches;const PADS=[["l","◀",.08],["r","▶",.22],["d","■",.78],["u","▲",.92]];
const pr=()=>Math.max(18,Math.min(W,H)*.09);
function pads(){const r=pr();x.font="bold "+(r*.8|0)+"px sans-serif";x.textAlign="center";x.textBaseline="middle";
  for(const [k,t,f] of PADS){const cx=W*f,cy=H-r*1.25;x.globalAlpha=K[k]?.75:.4;x.fillStyle="#222";x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.globalAlpha=1;x.fillStyle="#fff";x.fillText(t,cx,cy+1)}x.textBaseline="alphabetic"}
const touches=new Map();
function padAt(px,py){const r=pr();let best=null,bd=1e9;for(const [k,,f] of PADS){const dd=Math.hypot(px-W*f,py-(H-r*1.25));if(dd<r*1.7&&dd<bd){bd=dd;best=k}}return best}
function sync(){for(const [k] of PADS)K[k]=false;for(const k of touches.values())if(k)K[k]=true}
function pos(e){const r=c.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
c.addEventListener("pointerdown",e=>{e.preventDefault();if(e.pointerType==="touch")TOUCH=true;if(st!=="play"){reset();return}
  if(e.pointerType==="touch"){touches.set(e.pointerId,padAt(...pos(e)));sync()}else K.u=true});
c.addEventListener("pointermove",e=>{if(touches.has(e.pointerId)){touches.set(e.pointerId,padAt(...pos(e)));sync()}});
const up=e=>{if(touches.delete(e.pointerId))sync();else K.u=false};c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);c.addEventListener("pointerleave",up);
const KM={ArrowUp:"u",KeyW:"u",ArrowDown:"d",KeyS:"d",ArrowLeft:"l",KeyA:"l",ArrowRight:"r",KeyD:"r"};
addEventListener("keydown",e=>{if(st!=="play"&&(e.code==="Space"||e.code==="Enter")){e.preventDefault();reset();return}const k=KM[e.code];if(!k)return;e.preventDefault();K[k]=true});
addEventListener("keyup",e=>{const k=KM[e.code];if(k)K[k]=false});
let acc=0,last=performance.now();(function loop(t){requestAnimationFrame(loop);acc+=Math.min(100,t-last);last=t;while(acc>=16.7){step();acc-=16.7}draw()})(last);
})();
</script></body></html>
$cpx$, updated_at = now() where id = 'gravity';
