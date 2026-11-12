-- Gravity Fight: мини-игра для «телевизора» на белом фоне, простая надёжная физика. Выполнить один раз.
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
function pt(t,px,py,size,fill,al,stroke){lx.font="bold "+size+"px monospace";lx.textAlign=al||"center";if(stroke){lx.lineWidth=Math.max(2,size/4);lx.strokeStyle=stroke;lx.lineJoin="round";lx.strokeText(t,px|0,py|0)}lx.fillStyle=fill;lx.fillText(t,px|0,py|0)}
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
  x.save();x.imageSmoothingEnabled=false;x.drawImage(L,OX,OY,320*S,200*S);x.restore();if(TOUCH&&st==="play")pads()}
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
