-- Stick Fight: сразу геймплей, меню в паузе. Часть 2 из 2.
-- Части можно выполнять в любом порядке. Игра обновится, только когда выполнены ВСЕ 2; до этого остаётся прежняя версия.
-- Буфер загрузки: части файла игры складываются сюда, а в игру файл попадает только целиком (проверка длины).
create table if not exists public.game_upload (
  game_id text not null, part int not null, total int not null, body text not null,
  primary key (game_id, part)
);
alter table public.game_upload enable row level security;
revoke all on public.game_upload from anon, authenticated;
insert into public.game_upload (game_id, part, total, body) values ('stickfight', 2, 2, $cpx$lse if(c.at.ty=='k'&&!c.at.cr&&!c.at.ay&&ch.some(e=>e!==c&&!e.dead&&e.tm!==c.tm&&(e.p[2].x-h.x)*c.f>-4&&(e.p[2].x-h.x)*c.f<42&&Math.abs(e.p[2].y-h.y)<45)){c.at.kn=1;c.at.d=.3;c.lg=.6;}}
    if(c.at&&!c.at.m&&!c.at.h){c.at.m=1;if(!c.gr)p.forEach(q=>{q.px-=c.f*1.3;q.py-=c.at.ay>0?(c.at.ty=='k'?2.6:1.2):0;});}
  }
  if(c.at&&c.at.t<.12&&c.gr&&!c.at.rs)h.px=h.x-c.f*(c.lg||0)*c.k;
  if(c.at){c.at.t+=D;if(c.at.t>=c.at.d||(c.k<.5&&!c.hg))c.at=null;}
  c.hurt=clamp(1-c.hp/c.max*2.5,0,1);
  if(c.st){c.st.t+=D;if(c.st.t>.26)c.st=null;}
  c.lying=c.k>.25&&!c.at&&Math.abs(p[1].y-h.y)<22&&h.y>c.gl-30;
  if(c.pt>0){
    c.pt-=D;
    if(c.gr&&c.ko<=0&&c.k>.15){
      const cx=(p[0].x+p[1].x*2+h.x*3)/6,vcx=((p[0].x-p[0].px)+(p[1].x-p[1].px)*2+(h.x-h.px)*3)/6,fx=(p[8].x+p[10].x)/2,pof=cx+vcx*10-fx;
      if(!c.st&&Math.abs(pof)>14){const s=Math.sign(pof),f=(p[8].x-p[10].x)*s<0?8:10;c.st={f,t:0,x0:p[f].x,x1:cx+vcx*12+s*6};}
      if(Math.abs(pof)>46)c.k=Math.max(0,c.k-D*3);
    }
  }
  c.fv+=(c.f-c.fv)*.3;const o=pose(c);const q0=c.po||(c.po=o.map(v=>v.slice()));for(let i=0;i<11;i++){q0[i][0]+=(o[i][0]-q0[i][0])*.45;q0[i][1]+=(o[i][1]-q0[i][1])*.45;o[i]=q0[i];}
  for(let i=0;i<11;i++){
    if(i==2)continue;
    const G=c.gl;let tx=h.x+o[i][0]*c.fv,ty=h.y+o[i][1],w=c.k*(i<2?.55:.4);if(i==8||i==10)ty=Math.min(ty,gy(tx,p[i].y)-1);if(c.hg&&c.at&&(i>=7||i===c.at.free))w=.4;
    if(c.k<.6&&(i==4||i==6)){const t=Math.sign(p[1].x-h.x)||c.f;tx=p[1].x+t*20;ty=Math.min(G-3,p[1].y+26);w=.12;}
    if(c.lying){if(i==4||i==6){tx=p[1].x;ty=G;w=.22;}else if(i==7||i==9){tx=h.x+c.f*6;ty=G;w=.2;}else if(i==8||i==10){tx=h.x-c.f*6;ty=G;w=.2;}}
    if(c.st&&(i==c.st.f||i==c.st.f-1)){const u=Math.min(1,c.st.t/.22),e=u*u*(3-2*u),sx=c.st.x0+(c.st.x1-c.st.x0)*e,fl=Math.sin(Math.PI*u)*15;if(i==c.st.f){tx=sx;ty=G-fl;}else{tx=(h.x+sx)/2+5*c.f;ty=h.y+(G-fl-h.y)/2-6;}w=Math.max(w,.5);}
    const cx=clamp((tx-p[i].x)*w,-6,6),cy=clamp((ty-p[i].y)*w,-6,6);p[i].x+=cx;p[i].y+=cy;p[i].px+=cx*.8;p[i].py+=cy*.8;
  }
}
const IM=[1.2,.8,.5,1.3,1.6,1.3,1.6,1,1.2,1,1.2];
function integ(c){
  for(const q of c.p){if(c.hup){q.sx=null;continue;}if(q.sx!=null){const ox=q.x,oy=q.y,pa=q.px,pb=q.py;q.px=q.sx;q.py=q.sy;collide(q);q.px=pa+q.x-ox;q.py=pb+q.y-oy;}}
  for(const q of c.p){
    const vx=clamp((q.x-q.px)*.992,-16,16),vy=clamp((q.y-q.py)*.992,-13,c.slam?30:18);
    q.px=q.x;q.py=q.y;q.x+=vx;q.y+=vy+.5;q.v0=vy;q.g=0;
    if(q.y>G){if(vy>6)PP({x:q.x,y:G,vx:(Math.random()-.5)*3,vy:-1.5,l:.5,c:'#ddd'});if(vy>9)shake=Math.max(shake,4);}
  }
  for(let it=0;it<6;it++){
    for(const[a,b,d,s=1]of L){
      const A=c.p[a],B=c.p[b],ia=IM[a],ib=IM[b];let dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy)||1e-3;
      if(s<1&&l>d)continue;
      const f=(l-d)/l/(ia+ib)*s;A.x+=dx*f*ia;A.y+=dy*f*ia;B.x-=dx*f*ib;B.y-=dy*f*ib;
    }
    if(c.hup){for(const q of c.p)q.x=clamp(q.x,10,WW-10);}else{c.p.forEach((q,i)=>collide(q,PR[i]));
      for(const[a,b,,k=1]of L){if(k<1)continue;const A=c.p[a],B=c.p[b],m={x:(A.x+B.x)/2,y:(A.y+B.y)/2,px:(A.px+B.px)/2,py:(A.py+B.py)/2},x0=m.x,y0=m.y;collide(m);const dx=m.x-x0,dy=m.y-y0;if(dx||dy){A.x+=dx;A.y+=dy;B.x+=dx;B.y+=dy;}}}
  }
  if(!c.hup)for(const q of c.p)for(const h of HO){const wx=h.x+h.w;   // страховка: точка внутри платформы — выталкиваем
    if(q.x>h.x&&q.x<wx&&q.y>FL+1&&q.y<G+2){q.y=FL-.01;q.px=q.x;q.py=q.y;}
    else if(q.x>=wx&&q.x<=wx+120){const r=FL+92*(q.x-wx)/120;if(q.y>r+1){q.y=r-.01;q.py=q.y;}}
    else if(q.x>=h.x-120&&q.x<=h.x){const r=G-92*(q.x-h.x+120)/120;if(q.y>r+1){q.y=r-.01;q.py=q.y;}}
    if(q.x>h.x-14&&q.x<wx+14){const r=rf(q.x,h);if(r!=null&&q.y<FL-109.5&&q.y>r+.5){q.y=r-.01;q.py=Math.min(q.py,q.y);}}}
  for(const q of c.p){q.sx=q.x;q.sy=q.y;}
  for(const q of c.p){
    if(q.g){const ft=(q===c.p[8]||q===c.p[10])&&c.k>.5,u=q.x-q.px;if(Math.abs(u)>4&&c.k<.4&&Math.random()<.22)PP({x:q.x,y:q.y,vx:-u*.2,vy:-Math.random()*1.6,l:.55,c:'#b9b2a6',s:2+Math.random()*2});q.px=q.x-u*(c.sl?.965:ft?.3:.7);q.py=q.y+(q.v0>3?q.v0*.2:0);if(c.dead&&Math.abs(u)<.2)q.px=q.x;}
    if(q.w){q.px=q.x;q.w=0;}
  }
  {let wi=0,wq=null;for(const q of c.p){if(q.wi>wi){wi=q.wi;wq=q;}q.wi=0;}
   c.wcd=(c.wcd||0)-D;
   const th=c.fl?11:8.5;
   if(wq&&wi>th&&!c.dead&&c.wcd<=0&&!c.hup&&!c.hg&&(c.k<.55||c.fl||c.stun>0)){
    c.wcd=.45;const dm=Math.min(40,(wi-th)*1.7+2)*(c.pl?.8:1)*(c.ty?.7:1);
    c.hp-=dm;c.k=Math.max(0,c.k-.25);c.stun=Math.max(c.stun,.25+wi*.02);c.pt=Math.max(c.pt,1);
    shake=Math.max(shake,3+wi*.6);hs=Math.max(hs,.03);
    spark(wq.x,wq.y);dust(wq.x,wq.y,3,'#a89a88');blood(wq.x,wq.y,4+(wi|0),wq.x>c.p[2].x?-1:1);
    if(wi>12){c.stun=Math.max(c.stun,.7);hs=.05;}
    if(c.hp<=0){c.dead=1;c.k=0;if(!c.pl)score++;}}}
}
function bump(A,B,dir,sp){A.bcd=.7;B.p.forEach((q,i)=>{q.px-=dir*sp*.5*(i>=7?.5:1);});A.p.forEach(q=>{q.px+=dir*sp*.25;});B.k=Math.max(0,B.k-.35);B.stun=Math.max(B.stun,.35);B.pt=1;B.hp-=2.5;spark(B.p[1].x,B.p[1].y);shake=Math.max(shake,4);hs=Math.max(hs,.03);if(B.hp<=0&&!B.dead){B.dead=1;B.k=0;if(A.pl)score++;}}
function blood(x,y,n,dir){for(let i=0;i<n;i++)PP({x,y,vx:dir*(Math.random()*5+1)+(Math.random()-.5)*3,vy:-Math.random()*4-1,l:1});}
function spark(x,y){for(let i=0;i<8;i++)PP({x,y,vx:(Math.random()-.5)*8,vy:-Math.random()*4,l:.6,c:'#fff'});}
function hit(a,v,hp){
  const bk=(v.bl&&v.f==-a.f&&!a.at.hv)||v.dg>0,F=(a.at.ty=='p'?7:11)*(a.at.hv?1.5:1)*(a.ty?1.35:1)*(bk?.3:1)*(a.at.rs?1+clamp((a.at.rs-2)*.2,0,.5):1)*(a.at.fk?1.2:1)*(a.at.kn?.85:1);
  for(const q of v.p){const ix=v.p.indexOf(q),w=(q===hp?1:ix>=7?.3:.8)*(ix==0?1.5:1)*(v.ty?.78:1);q.px-=a.f*F*w;q.py+=F*(a.at.hv?.4:.25)*w;}
  v.hp-=(a.at.ty=='p'?8:13)*(a.at.hv?1.5:1)*(a.ty?1.3:1)*(bk?.15:1)*(a.at.rs?1.2:1)*(a.at.fk?1.1:1)*(a.at.kn?.75:1);
  v.k=Math.max(0,v.k-F*(v.ty?.04:.06));v.stun=bk?v.stun:Math.max(v.stun,F>10?.5:.1);if(!bk)v.pt=1.3;if(!bk)v.at=null;if(v.hg&&!bk&&F<10&&v.hp>0){v.hg.grip-=F*2;v.stun=0;}a.cb++;a.ct=1;if(a.at.hv)a.cb=0;
  if(!bk&&!v.dead&&v.hp>0){
    const hd=hp===v.p[0],bl=hp===v.p[1],gn=hp===v.p[2];
    if(a.at.cr&&a.at.ty=='k'&&(hp===v.p[7]||hp===v.p[9])){v.k=0;v.stun=1.1;v.p[7].px-=a.f*3;v.p[9].px-=a.f*3;v.p[8].px-=a.f*6;v.p[10].px-=a.f*6;v.p[1].py+=3;v.p[0].py+=3;}
    if(gn&&F>=7&&v.ko<=0){v.gz=F>=10?2.2:1.4;v.k=Math.max(v.k,.65);v.stun=0;v.dz=0;v.cg=0;v.hp-=6;}
    if(bl&&F>=7&&v.ko<=0&&Math.random()<(F>=10?.55:.75)){v.dz=F>=10?1.5:.9;v.k=Math.max(v.k,.65);v.stun=0;if(F>=10&&Math.random()<.3){v.cg=1.4;v.dz=1.8;}}
    if(hd&&F>=7&&Math.random()<(v.pl?.5:1)*(F>=14?.45:F>=10?.22:.06)+(v.hp<v.max*.4?.1:0)){v.ko=3.2;v.k=0;v.stun=3.2;v.dz=0;v.cg=0;blood(hp.x,hp.y,16,a.f);}
  }
  if(!bk&&(a.at.fk||(a.at.rs&&a.at.hv))&&!v.dead){v.k=Math.max(0,v.k-.5);v.stun=Math.max(v.stun,.9);}if(a.at.rs&&a.p)a.p.forEach(q=>{q.px+=a.f*1.1;});
  a.at.h=1;dmgF(hp.x,hp.y,a.at.hv?2:1,F,a.f);hs=a.at.hv?.1:.06;shake=F*.7;if(bk)spark(hp.x,hp.y);else{blood(hp.x,hp.y,10+(F|0),a.f);flash=.12;fx=hp.x;fy=hp.y;}if(a.at.hv)ts=.5;
  if(v.hp<=0&&!v.dead){v.dead=1;v.k=0;v.p.forEach(q=>{q.px-=a.f*6;q.py+=4;});ts=.35;if(a.pl)score++;drop(v.p[2].x,v.p[2].y-30);}
}
function ai(c){
  if(PV.fb)return fbAI(c);
  const tg=nearP(c),dx=tg.p[2].x-c.p[2].x,d=Math.abs(dx),ip={mx:0};
  if(!c.at&&c.k>.5&&d>14)c.f=dx>0?1:-1;
  const rk=ch.filter(x=>!x.pl&&x.tm===c.tm&&!x.dead&&nearP(x)===tg).sort((a,b)=>Math.abs(a.p[2].x-tg.p[2].x)-Math.abs(b.p[2].x-tg.p[2].x)).indexOf(c),want=rk<2?50:150+rk*30;
  if(!tg.dead&&d>want+8)ip.mx=Math.sign(dx);else if(!tg.dead&&rk>=2&&d<want-25)ip.mx=-Math.sign(dx);
  if(d>250)c.rnf=1;else if(d<190)c.rnf=0;ip.run=!!(c.rnf&&ip.mx);
  c.bt=(c.bt||0)-D;if(tg.at&&d<85&&!(c.bt>0)&&!c.at&&Math.random()<.03)c.bt=.6;
  if(c.bt>.55&&c.dgc<=0&&Math.random()<.4){ip.dodge=-Math.sign(dx)||1;c.bt=0;}
  ip.block=c.bt>0;
  c.cd-=D;if(gy(tg.p[2].x,tg.p[2].y)<c.gl-40&&c.gr&&Math.random()<.04)ip.jump=1;
  if(rk<2&&!tg.dead&&d<58&&c.cd<=0&&c.k>.7){ip[Math.random()<.6?'punch':'kick']=1;c.cd=1.1+Math.random()*1.3;}
  if(rk<2&&!tg.dead&&c.gv>.55&&c.gr&&d>62&&d<175&&c.cd<=0&&c.k>.7&&Math.random()<.05){ip[Math.random()<.5?'punch':'kick']=1;c.cd=1.4+Math.random()*1.3;}
  if(rk<2&&!tg.dead&&c.gv>.65&&c.gr&&d>85&&d<170&&Math.random()<.012)ip.crouch=1;
  if(c.it&&!tg.dead&&d<480&&c.cd<=0&&c.k>.7&&!c.at){ip.punch=1;c.cd=1.3+Math.random()*1.2;}
  if(c.tw&&!c.it){const it=items.find(i=>!i.h&&!i.th&&Math.abs(i.x-c.p[2].x)<380&&Math.abs(gy(i.x,i.y)-c.gl)<30);if(it)ip.mx=Math.sign(it.x-c.p[2].x)||0;}
  if(!c.gr&&!c.hg&&!c.slam&&c.k>.6&&!tg.dead&&d<110&&c.gl-c.p[2].y>140&&(c.fdrop>30&&c.gl-c.ly>150)&&Math.random()<.08){ip.crouch=1;ip[Math.random()<.5?'punch':'kick']=1;}
  if(c.hg){const nr=!tg.dead&&d<75&&Math.abs(tg.p[2].y-c.p[2].y)<80;
    if(nr&&c.cd<=0){ip[Math.random()<.6?'kick':'punch']=1;c.cd=1+Math.random();}
    c.hg.w=nr?c.hg.t+1:Math.min(c.hg.w,c.hg.t+.4);}
  for(const h of HO){const wx=h.x+h.w,mx=c.p[2].x;   // дом между нами: прыжок на карниз
    if(mx>wx&&mx<wx+60&&tg.p[2].x<wx-20&&c.gr&&c.gl>FL+20&&Math.random()<.06)ip.jump=1;}
  return ip;
}
let ocx=0,al=1;
let IID=0;
function spawnIt(x,y,vy,k){const t=IT[k??Math.random()*3|0];items.push({id:++IID,am:t.gun?t.gun.am:0,t,dur:t.gun?99:1+(Math.random()*({bottle:2,brick:4,chair:3}[t.n])|0),x,y,vx:(Math.random()-.5)*4,vy,a:0,va:(Math.random()-.5)*.4,h:null,th:null});if(items.length>7){const i=items.findIndex(z=>!z.h);if(i>=0)items.splice(i,1);}}
function drop(){}
let pip={};const RL={on:0,pm:0,pb:0,ld:0,lt:-9};const PY=G-165,PO=[137,862,1612],POS=[137,862,1612];
const GP=[],BAL=[];
function buildGP(){GP.length=0;for(const x of PO)GP.push({k:'b',x0:x-46,x1:x+46,y:PY});
 for(const h of HO){GP.push({k:'l',x0:h.x-14,x1:h.x-14,y:FL-110,s:1,h},{k:'l',x0:h.x+h.w+14,x1:h.x+h.w+14,y:FL-110,s:-1,h});}}
buildGP();
const BP={lift:.15,k:.009,wb:.17,ld:3,rg:.3,vd:.97};
function balStep(){for(const a of BAL){if(a.sh>0)a.sh-=D;if(a.b)continue;
 const t=t0+a.ph,vx=(a.x-a.px)*BP.vd,vy=(a.y-a.py)*BP.vd;
 let cr=0;for(const n of a.r)if(n.ld)cr++; /* на верёвке кто-то висит: шар время от времени подпрыгивает вверх */
 if(cr){a.gt=(a.gt==null?.8:a.gt)-D;if(a.gt<=0){a.gt=1.2+Math.random()*2.2;if(Math.random()<.75)a.gu=.45;}}else{a.gt=null;a.gu=0;}
 let up=0;if(a.gu>0){a.gu-=D;up=.06*Math.sin(Math.PI*Math.max(0,a.gu)/.45);}
 const ax=Math.sin(t*.45)*.014+Math.sin(t*1.1+a.ph)*.007+(a.hx-a.x)*.0006,ay=-BP.lift-up+(a.hy-a.y)*BP.k+Math.sin(t*.7)*.01;
 a.px=a.x;a.py=a.y;a.x+=vx+ax;a.y+=vy+ay;
 const r=a.r;
 for(const n of r){const nx=(n.x-n.px)*.99,ny=(n.y-n.py)*.99;n.px=n.x;n.py=n.y;n.x+=nx+n.fx*.5;n.y+=ny+BP.rg+(n.ld||0)*BP.ld;n.ld=0;n.fx=0;}
 for(let k=0;k<8;k++){
  {const n=r[0],dx=n.x-a.x,dy=n.y-a.y,dd=Math.hypot(dx,dy)||1,df=dd-(a.ry+2),wk=1,wb=BP.wb,ux=dx/dd,uy=dy/dd;n.x-=ux*df*wk/(wk+wb);n.y-=uy*df*wk/(wk+wb);a.x+=ux*df*wb/(wk+wb);a.y+=uy*df*wb/(wk+wb);}
  for(let i=0;i<r.length-1;i++){const A=r[i],B=r[i+1],dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy)||1,df=(d-a.LL)/d*.5;A.x+=dx*df;A.y+=dy*df;B.x-=dx*df;B.y-=dy*df;}
  for(const n of r)if(n.y>G-3){n.y=G-3;n.px=n.x;}}}}
function ropeGrab(c,q){for(const a of BAL){if(a.b)continue;for(let i=1;i<a.r.length;i++){const n=a.r[i];if(Math.hypot(n.x-q.x,n.y-q.y)<18){c.hg={g:{k:'r',bal:a},i,x:n.x,y:n.y,t:0,w:.5+Math.random()*1.2,grip:30};c.k=Math.min(c.k,.28);spark(q.x,q.y);return;}}}}
function balDmg(a,d){if(a.b||NET.role=='guest')return;a.hp-=d;a.sh=.3;
 if(a.hp<=0){a.b=1;for(let i=0;i<34;i++){const t=Math.random()*6.28,v=2+Math.random()*7;PP({x:a.x,y:a.y,vx:Math.cos(t)*v,vy:Math.sin(t)*v-1,l:1.1+Math.random()*.6,c:i%4?a.c:'#ffffff',s:2+Math.random()*5});}
  shake=Math.max(shake,3);for(const c of ch)if(c.hg&&c.hg.g.bal===a){c.hg=null;c.rg=.4;}if(typeof beep=='function')beep(520,.07,'square',.05,140);}
 else for(let i=0;i<3;i++)PP({x:a.x+(Math.random()-.5)*a.rx,y:a.y+(Math.random()-.5)*a.ry,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,l:.4,c:a.c,s:2});}
function drawBal(){ctx.lineCap='round';ctx.lineJoin='round';for(const a of BAL){if(a.b)continue;
 const lv=Math.max(a.dm|0,a.hp<a.mx*.34?2:a.hp<a.mx*.67?1:0),wb=a.sh>0?Math.sin(a.sh*70)*a.sh*5:0,r=a.r,k=a.rx/24;
 ctx.strokeStyle='#d9c9a3';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(r[0].x,r[0].y);for(let i=1;i<r.length;i++)ctx.lineTo(r[i].x,r[i].y);ctx.stroke();
 const e=r[r.length-1];ctx.strokeStyle='#8a6d3b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y+4,4,0,7);ctx.stroke();
 ctx.save();ctx.translate(a.x,a.y);ctx.rotate(clamp((r[0].x-a.x)*.01,-.25,.25));ctx.scale(k*(1+wb*.02),k*(1-wb*.02));
 const g=ctx.createRadialGradient(-9,-12,2,0,0,35);g.addColorStop(0,'#fff');g.addColorStop(.25,a.c);g.addColorStop(1,'#00000070');
 ctx.fillStyle=a.c;ctx.beginPath();ctx.ellipse(0,0,24,30,0,0,7);ctx.fill();ctx.fillStyle=g;ctx.globalAlpha=.75;ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle='#0008';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,24,30,0,0,7);ctx.stroke();
 ctx.fillStyle='#fff8';ctx.beginPath();ctx.ellipse(-10,-13,4.5,8,-.5,0,7);ctx.fill();
 ctx.fillStyle=a.c;ctx.beginPath();ctx.moveTo(-5,29);ctx.lineTo(5,29);ctx.lineTo(0,36);ctx.fill();
 if(lv>0){ctx.strokeStyle='#000b';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-8,-12);ctx.lineTo(-2,-4);ctx.lineTo(-9,3);ctx.stroke();}
 if(lv>1){ctx.beginPath();ctx.moveTo(9,-6);ctx.lineTo(3,4);ctx.lineTo(10,12);ctx.moveTo(-3,14);ctx.lineTo(3,20);ctx.stroke();}
 ctx.restore();}}
function drawP(){ctx.lineCap='round';for(const x of PO){ctx.strokeStyle='#6b7280';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x-48,G+3);ctx.lineTo(x-48,PY);ctx.moveTo(x+48,G+3);ctx.lineTo(x+48,PY);ctx.stroke();ctx.strokeStyle='#aab3c2';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-48,PY);ctx.lineTo(x+48,PY);ctx.stroke();}}
function grabStep(){balStep();for(const c of ch){if(c.dead)continue;c.rg-=D;
 if(c.hup){climb(c);continue;}
 if(c.hg){hang(c);continue;}
 if(c.rg>0||c.gr||c.slam||c.k<.5||c.ko>0||c.dz>0||c.gz>0||c.th||c.at||c.stun>0||c.p[2].y-c.p[2].py<-5)continue;
 for(const i of[4,6]){const q=c.p[i];for(const g of GP){if(Math.abs(q.y-g.y)>13||q.x<g.x0-13||q.x>g.x1+13||(g.s&&g.s!=c.f))continue;c.hg={g,x:clamp(q.x,g.x0,g.x1),t:0,w:.5+Math.random()*1.2,grip:30};c.k=Math.min(c.k,.28);spark(q.x,q.y);break;}if(!c.hg)ropeGrab(c,q);if(c.hg)break;}}}
function hang(c){const g=c.hg,G2=g.g,p=c.p,ip=c.ip||{},a=c.at;g.t+=D;
 if(G2.k=='r'){const bl=G2.bal;if(bl.b){c.hg=null;c.rg=.4;return;}const nd=bl.r[g.i];g.x=nd.x;g.y=nd.y;nd.ld=(nd.ld||0)+1;nd.fx+=clamp((p[2].x-nd.x)*.045,-1.1,1.1);}
 if(c.stun>0||c.ko>0||c.dz>0||c.gz>0||c.th||g.grip<=0){c.hg=null;c.rg=.5;return;}
 [[4,2],[6,-2]].forEach(([i,o])=>{if(a&&a.free===i)return;const q=p[i];q.x=g.x+o*c.f;q.y=g.y==null?G2.y:g.y;q.px=q.x;q.py=q.y;});
 if(!a&&(ip.kick||ip.punch))hangAtk(c,ip.kick?'k':'p');
 const m=ip.mx|0;
 if(G2.k!='l'&&m&&Math.abs(p[2].x-g.x)<80){const ph=(p[2].x-p[2].px)*m>0?1.8:.7;p[2].px-=m*.5*ph;p[7].px-=m*.4*ph;p[9].px-=m*.4*ph;p[8].px-=m*.8*ph;p[10].px-=m*.8*ph;}
 if(c.pl&&ip.crouch){c.hg=null;c.rg=G2.k=='r'?1:.4;if(G2.k!='l')tarzan(c,0);return;}
 if(c.pl?ip.jump:(g.t>g.w||(G2.k!='l'&&g.t>.8&&Math.abs(p[2].x-p[2].px)>3.2&&Math.sign(p[2].x-p[2].px)==Math.sign(nearP(c).p[2].x-p[2].x)))){if(G2.k!='l'){c.hg=null;c.rg=G2.k=='r'?1:.3;if(!tarzan(c,c.pl))p.forEach(q=>q.py=q.y+7);}else{const s=G2.s,fx=G2.x0+s*22;c.hup={t:0,s,ax:G2.x0-s*8,ay:G2.y+6,fx,fy:rf(fx,G2.h)-43,gx:G2.x0};}}}
function hangAtk(c,ty){const p=c.p;
 if(ty=='k'){c.at={ty:'k',t:0,d:.42,h:0,ay:0};for(const i of[2,7,8,9,10])p[i].px-=c.f*(i>=7?3.4:2.2);}
 else{c.hand^=1;c.at={ty:'p',t:0,d:.26,h:0,hd:c.hand,hv:0,ay:0,free:c.hand?6:4};p[2].px-=c.f*.9;}}
function climb(c){const u=c.hup,p=c.p,S=[[0,-46],[0,-32],[0,0],[8,-20],[19,-30],[2,-20],[13,-31],[5,22],[8,43],[-3,22],[-8,43]];u.t+=D;const B=u.t>.28,hx=B?u.fx:u.ax,hy=B?u.fy:u.ay;
 if(c.stun>0||c.ko>0){c.hup=null;c.hg=null;c.rg=.5;return;}
 if(u.t>.6){for(let i=0;i<11;i++){const q=p[i];q.x=u.fx+S[i][0]*c.f;q.y=u.fy+S[i][1];q.px=q.x;q.py=q.y;}c.hup=null;c.hg=null;c.rg=.5;c.k=Math.max(c.k,.6);return;}
 p.forEach((q,i)=>{if(i==4||i==6)return;q.x+=(hx+S[i][0]*c.f-q.x)*.28;q.y+=(hy+S[i][1]-q.y)*.28;q.px=q.x;q.py=q.y;});
 [[4,2],[6,-2]].forEach(([i,o])=>{const q=p[i];q.x=u.gx+(B?u.s*16:0)+o*c.f;q.y=u.ay-6-(B?8:0);q.px=q.x;q.py=q.y;});}
function brk(it){const n=it.t.n,C=n=='bottle'?['#2e8b57','#7be0a0','#fff']:n=='brick'?['#b5523b','#e0a08e','#888']:['#6b4a2b','#8b6a3e','#3a2a18'],N=n=='brick'?14:n=='chair'?12:16;for(let i=0;i<N;i++){const a=Math.random()*6.28,s=2+Math.random()*5;PP({x:it.x,y:it.y,vx:Math.cos(a)*s+it.vx*.3,vy:Math.sin(a)*s-2,l:1.5+Math.random()*.6,c:C[i%3],s:n=='brick'?3+Math.random()*4:2+Math.random()*3});}if(n=='brick')for(let i=0;i<6;i++)PP({x:it.x,y:it.y,vx:(Math.random()-.5)*4,vy:-Math.random()*2,l:.9,c:'#ddd',s:6});shake=Math.max(shake,n=='brick'?5:3);it.dead=1;if(n=='bottle')glass(it.x,it.y,1);else{dust(it.x,it.y,4);chips(it.x,it.y,n=='brick'?'#b5523b':'#8b6a3e',8)}}
function aimVy(dx,dy,vx,dg){const tt=Math.max(6,Math.abs(dx)/Math.max(1,Math.abs(vx)));let vy=dy/tt-GI*.5*tt;
 for(let k=0;k<5;k++){let x=0,y=0,u=vx,v=vy,err=null;for(let n=1;n<=160;n++){v+=GI;const dk=1-dg;u*=dk;v*=dk;x+=u;y+=v;if(Math.abs(x)>=Math.abs(dx)||n==160){err=y-dy;break;}}
  if(err==null||Math.abs(err)<2)break;vy-=err/tt*.9;}
 return vy;}
function dropIt(c){const it=c.it;if(!it)return;c.it=null;it.h=null;const hd=c.p[4];it.x=hd.x;it.y=hd.y;it.vx=c.f*1.6;it.vy=-1.5;it.va=c.f*.2;it.th=null;it.pcB=c;it.pcT=t0+3;it.pc=t0+.4;spark(hd.x,hd.y);}
function throwAt(c,ang){const it=c.it;if(!it)return;c.it=null;it.h=null;const hd=c.p[4];if(ang==null||isNaN(ang))ang=c.f>0?0:Math.PI;c.f=Math.cos(ang)>=0?1:-1;const sp=Math.max(it.t.sp,9)*1.35;it.x=hd.x;it.y=hd.y;it.vx=Math.cos(ang)*sp;it.vy=Math.sin(ang)*sp-.5;it.va=c.f*.5;it.th=c;it.pc=t0+.5;c.at={ty:'p',t:0,d:.2,h:1,hd:c.hand^=1,hv:0};c.lg=.5;}
function throwIt(c){const it=c.it;c.it=null;it.h=null;const e=ch.filter(x=>x.tm!=c.tm&&!x.dead&&(x.p[2].x-c.p[2].x)*c.f>0).sort((a,b)=>Math.abs(a.p[2].x-c.p[2].x)-Math.abs(b.p[2].x-c.p[2].x))[0],hd=c.p[4],sp=it.t.sp;let vx=c.f*sp,vy=-2;if(e){const dx=e.p[1].x-hd.x,dy=e.p[1].y-hd.y,tt=Math.max(6,Math.abs(dx)/sp);vx=dx/tt*(1+it.t.dg*tt*.55);vy=aimVy(dx,dy,vx,it.t.dg);}if(!c.pl){vx*=1+(Math.random()-.5)*.2;vy+=(Math.random()-.5)*1.8;}it.x=hd.x;it.y=hd.y;it.vx=clamp(vx,-sp*1.3,sp*1.3);it.vy=vy;it.va=c.f*.5;it.th=c;c.at={ty:'p',t:0,d:.2,h:1,hd:c.hand^=1,hv:0};c.lg=.5;}

const BUL=[];let gBL=[],BID=0;
const heldGun=c=>{const it=c.it||items.find(i=>i.h===c);return it&&it.t.gun?it:null;};
function autoAng(c){const f=c.f,s=c.p[1],e=ch.filter(x=>x.tm!=c.tm&&!x.dead&&(x.p[2].x-c.p[2].x)*f>0).sort((a,b)=>Math.abs(a.p[2].x-c.p[2].x)-Math.abs(b.p[2].x-c.p[2].x))[0];if(!e)return f>0?0:Math.PI;const g=c.it&&c.it.t.gun,t=Math.min(18,Math.hypot(e.p[1].x-s.x,e.p[1].y-s.y)/(g?g.v:22));return Math.atan2(e.p[1].y+(e.p[1].y-e.p[1].py)*t-s.y,e.p[1].x+(e.p[1].x-e.p[1].px)*t-s.x);}
function sgd(x,y,A,B){const dx=B.x-A.x,dy=B.y-A.y,t=clamp(((x-A.x)*dx+(y-A.y)*dy)/(dx*dx+dy*dy||1),0,1);return[Math.hypot(x-A.x-dx*t,y-A.y-dy*t),t];}
const BZ=[[1,2,9,-1],[1,3,5,0],[3,4,5,0],[1,5,5,1],[5,6,5,1],[2,7,6,2],[7,8,6,2],[2,9,6,3],[9,10,6,3]];
function bHit(v,x,y){const p=v.p;if(Math.hypot(x-p[0].x,y-p[0].y)<(v.ty?12:10))return{q:p[0],h:1,l:-1};let best=null,bd=1e9;for(const[a,b,r,l]of BZ){const[d,t]=sgd(x,y,p[a],p[b]);if(d<r&&d-r<bd){bd=d-r;best={q:t<.5?p[a]:p[b],h:0,l};}}return best;}
function cripple(v,l,dir){const q=v.p[[4,6,8,10][l]];blood(q.x,q.y,14,dir);shake=Math.max(shake,4);if(l==0){const it=v.it;if(it){v.it=null;it.h=null;it.vx=-v.f*2;it.vy=-4;it.pc=t0+1.5;}}else if(l>1){v.k=Math.min(v.k,.35);v.stun=Math.max(v.stun,.5);}}
function gunHit(b,v,R,dir){const bk=(v.bl&&v.f==-dir)||v.dg>0,q=R.q;
 if(bk){spark(q.x,q.y);v.p.forEach(z=>{z.px-=dir*.5;});return;}
 v.hp-=b.d*(R.h?2.2:R.l>=0?.6:1);
 v.p.forEach(z=>{const w=z===q?1:.35;z.px-=dir*b.k*w;z.py+=b.k*.12*w;});
 v.k=Math.max(0,v.k-b.k*(R.h?.09:.05));v.pt=1.3;v.stun=Math.max(v.stun,.1+b.k*.02);if(b.k>4)v.at=null;
 if(R.l>=0){const o=v.inj[R.l],n=Math.min(1,o+b.d*.045);v.inj[R.l]=n;if(n>=1&&o<1)cripple(v,R.l,dir);}
 blood(q.x,q.y,3+(b.d/3|0),dir);if(R.h){flash=.1;fx=q.x;fy=q.y;}shake=Math.max(shake,b.k);
 if(v.hp<=0&&!v.dead){v.dead=1;v.k=0;v.p.forEach(z=>{z.px-=dir*5;z.py+=3;});ts=.35;if(b.pl)score++;}}
function fire(c){const it=c.it,g=it.t.gun,hd=c.p[4],ip=c.ip||{};it.am--;it.ft=t0;
 const ang=c.pl&&ip.ag!=null?ip.ag:autoAng(c);
 const sp=g.sp*(c.pl?1:4)*(1+(c.bloom||0)*1.5+(c.gr&&Math.abs(hd.x-hd.px)>1.5?.4:0)-.3*c.cs)*(1+1.5*c.inj[0]+.8*c.inj[1]);
 const mx=hd.x+Math.cos(ang)*g.ml,my=hd.y+Math.sin(ang)*g.ml-1;
 for(let i=0;i<g.pel;i++){const a=ang+(Math.random()-.5)*sp,v=g.v*(g.pel>1?.8+Math.random()*.4:1);BUL.push({id:++BID,x:mx,y:my,vx:Math.cos(a)*v,vy:Math.sin(a)*v,pl:c.pl?1:0,tm:c.tm,l:g.l,d:g.d*(c.pl?1:.65),k:g.k,pn:g.pn||0});}
 spark(mx,my);for(let i=0;i<4+g.pel;i++)PP({x:mx,y:my,vx:Math.cos(ang)*(2+Math.random()*4)+Math.random()-.5,vy:Math.sin(ang)*(2+Math.random()*4)+(Math.random()-.5)*2,l:.18,c:'#ffd27a',s:2+Math.random()*2});
 PP({x:hd.x,y:hd.y-4,vx:-c.f*(1+Math.random()),vy:-2-Math.random()*2,l:.7,c:'#d9a521',s:2});
 shake=Math.max(shake,g.sh);c.p.forEach(q=>{q.px+=Math.cos(ang)*g.rc;});c.rc=g.rc;c.bloom=Math.min(1,(c.bloom||0)+(g.bk||.15));}
function drawAim(){const c=pl&&!pl.dead&&pl,it=c&&heldGun(c),on=it&&mouse.act&&mouse.sx!=null;cv.style.cursor=on?'none':'';if(!on)return;
 const g=it.t.gun,hd=c.p[4],sh=c.p[1],ang=Math.atan2(mouse.y-sh.y,mouse.x-sh.x),H=segHit(hd.x,hd.y,hd.x+Math.cos(ang)*700,hd.y+Math.sin(ang)*700),L=H?H.t*700:700,dist=Math.hypot(mouse.x-sh.x,mouse.y-sh.y);
 ctx.save();ctx.strokeStyle='#e0303a';ctx.lineWidth=1.5;ctx.setLineDash([5,9]);ctx.globalAlpha=.4;ctx.beginPath();ctx.moveTo(hd.x,hd.y);ctx.lineTo(hd.x+Math.cos(ang)*L,hd.y+Math.sin(ang)*L);ctx.stroke();ctx.setLineDash([]);
 const r=clamp(Math.max(dist,60)*g.sp*(1+(c.bloom||0)*1.5)*.5,5,46);ctx.globalAlpha=.95;ctx.lineWidth=2;ctx.beginPath();ctx.arc(mouse.x,mouse.y,r,0,7);ctx.stroke();
 ctx.beginPath();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(mouse.x+dx*(r+2),mouse.y+dy*(r+2));ctx.lineTo(mouse.x+dx*(r+8),mouse.y+dy*(r+8));}ctx.stroke();ctx.fillStyle='#e0303a';ctx.fillRect(mouse.x-1,mouse.y-1,2,2);ctx.restore();}
function segHit(ax,ay,bx,by){let best=null,bt=2;for(const s of SEG){if((s.win&&s.win.b)||(s.door&&(s.door.o||s.door.b)))continue;const ex=s.bx-s.ax,ey=s.by-s.ay,dx=bx-ax,dy=by-ay,den=dx*ey-dy*ex;if(!den)continue;const t=((s.ax-ax)*ey-(s.ay-ay)*ex)/den,u=((s.ax-ax)*dy-(s.ay-ay)*dx)/den;if(t>=0&&t<=1&&u>=0&&u<=1&&t<bt){bt=t;best=s;}}return best?{s:best,t:bt}:null;}
function bulStep(){for(const b of BUL){b.l--;const N=6,dir=Math.sign(b.vx)||1;
  for(let st=0;st<N&&b.l>0;st++){const ox=b.x,oy=b.y,nx=ox+b.vx/N,ny=oy+b.vy/N;
   const H=segHit(ox,oy,nx,ny);
   if(H){b.x=ox+(nx-ox)*H.t;b.y=oy+(ny-oy)*H.t;if(H.s.door)doorHit(b.x,b.y,8,dir);spark(b.x,b.y);chips(b.x,b.y,'#a08c77',3);b.l=0;break;}
   b.x=nx;b.y=ny;
   let got=0;
   for(const v of ch){if(v.dead||v.tm==b.tm||(b.sk&&b.sk.includes(v)))continue;const Z=bHit(v,b.x,b.y);if(Z){gunHit(b,v,Z,dir);if(b.pn>0){b.pn--;b.d*=.6;(b.sk=b.sk||[]).push(v);}else{b.l=0;got=1;}break;}}
   for(const a of BAL)if(!a.b){const ex=(b.x-a.x)/(a.rx+3),ey=(b.y-a.y)/(a.ry+3);if(ex*ex+ey*ey<1){balDmg(a,b.d);spark(b.x,b.y);b.l=0;got=1;break;}}
   if(got)break;
   let ob=0;for(const h of HO)for(const f of h.fu)if(!f.b&&b.x>f.x-4&&b.x<f.x+f.t.w+4&&b.y>FL-f.t.h-4&&b.y<FL+4)ob=1;
   for(const q of props)if(!q.b&&b.x>q.x-4&&b.x<q.x+q.t.w+4&&b.y>G-q.t.h-4&&b.y<G+4)ob=1;
   if(ob){dmgF(b.x,b.y,1,6,dir);b.l=0;break;}
   glassAt(b.x,b.y,12,dir);
  }
  if(b.x<0||b.x>WW||b.y>G+40||b.y<-600)b.l=0;}
 for(let i=BUL.length-1;i>=0;i--)if(BUL[i].l<=0)BUL.splice(i,1);}
function drawBul(){ctx.lineCap='round';for(const b of BUL.concat(gBL)){const l=Math.hypot(b.vx,b.vy)||1,ux=b.vx/l,uy=b.vy/l;ctx.strokeStyle='#ffb74a';ctx.globalAlpha=.55;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(b.x-ux*22,b.y-uy*22);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#fff6d0';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(b.x-ux*16,b.y-uy*16);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.globalAlpha=1;}
function supplyStep(){if(PV.fb)return;itT-=D;if(itT>0)return;itT=22+Math.random()*12;
 if(items.some(i=>i.t.gun&&!i.h))return;const p0=ch.find(c=>c.pl&&!c.dead);if(!p0)return;
 spawnIt(clamp(p0.p[2].x+(Math.random()<.5?-1:1)*(120+Math.random()*160),60,WW-60),G-260,0,3+(Math.random()*4|0));}
function startThrow(a,v){a.at=null;a.th={v,t:0,x0:a.p[2].x,y0:a.p[2].y-26,s:v.p.map(q=>({x:q.x,y:q.y}))};v.k=0;v.stun=1;v.at=null;v.bl=0;a.cb=0;ts=.55;spark(a.p[4].x,a.p[4].y);}
function thrStep(){for(const c of ch){const T=c.th;if(!T)continue;const v=T.v;T.t+=D;
 if(c.dead||c.k<.5||v.dead){c.th=null;continue;}
 const u=Math.min(1,T.t/.42),e=u*u*(3-2*u),r=-e*Math.PI*c.f,co=Math.cos(r),si=Math.sin(r),X=c.p[2].x,Y=c.p[2].y-26;
 v.k=0;v.stun=.5;v.at=null;
 v.p.forEach((q,i)=>{const dx=T.s[i].x-T.x0,dy=T.s[i].y-T.y0;q.px=q.x;q.py=q.y;q.x=X+dx*co-dy*si;q.y=Math.min(G,Y+dx*si+dy*co);collide(q);});
 if(T.t>=.42){c.th=null;v.p.forEach(q=>{q.px=q.x+c.f*2;q.py=q.y-10;});v.hp-=22;v.stun=1.6;if(Math.random()<.3)v.ko=2.6;shake=14;hs=.1;ts=.35;blood(v.p[2].x,v.p[2].y-10,18,-c.f);for(let i=0;i<8;i++)PP({x:v.p[2].x,y:G,vx:(Math.random()-.5)*7,vy:-Math.random()*3,l:.6,c:'#ddd'});if(v.hp<=0){v.dead=1;v.k=0;if(c.pl)score++;drop(v.p[2].x,v.p[2].y-30);}}}}
function itemStep(){
 
 for(const c of ch)for(const q of c.p)if(Math.hypot(q.x-q.px,q.y-q.py)>9)dmgF(q.x,q.y,1);
 for(const it of items){
  it.ox=it.x;it.oy=it.y;
  if(it.h){const c=it.h;if(c.dead||c.k<.3){c.it=null;it.h=null;it.vx=c.f*2;it.vy=-3;}else continue;}
  it.vy+=GI;{const dk=1-it.t.dg;it.vx*=dk;it.vy*=dk;}it.x+=it.vx;it.y+=it.vy;it.a+=it.va;
  const r=it.t.r,sp=Math.hypot(it.vx,it.vy);
  {const ovx=it.vx,ovy=it.vy,o={x:it.x,y:it.y,px:it.x-it.vx,py:it.y-it.vy};collide(o,r*.7,1);const nvx=o.x-o.px,nvy=o.y-o.py,ddx=nvx-ovx,ddy=nvy-ovy;it.x=o.x;it.y=o.y;
   if(ddx*ddx+ddy*ddy>.04){const e=it.t.e;it.vx=nvx+ddx*e;it.vy=nvy+ddy*e;it.va=-it.va*.6+(Math.random()-.5)*.25;}else{it.vx=nvx;it.vy=nvy;}}
  const gg=gy(it.x,it.y-r-8);if(it.y>gg-r){if(it.th&&sp>8&&--it.dur<=0){brk(it);continue;}
   const e=it.t.e,vi=it.vy;it.y=gg-r;
   if(vi>1.8){it.vy=-vi*e;it.va+=it.vx*.05*(.5+Math.random());it.vx*=1-(1-it.t.fr)*.5;}else it.vy=0;
   it.vx*=it.t.fr;
   if(it.t.rl)it.va+=(it.vx/(r*1.4)-it.va)*.3;else it.va*=.72;
   if(Math.abs(it.vx)<.6&&Math.abs(it.vy)<1.2){const q=it.t.rq,ro=it.t.ro,rest=Math.round((it.a-ro)/q)*q+ro;it.a+=(rest-it.a)*.25;it.va*=.5;if(Math.abs(it.vx)<.08)it.vx=0;}
   it.th=null;}
  if(it.x<10||it.x>WW-10){it.x=clamp(it.x,10,WW-10);it.vx*=-.4;}
  if(it.th&&sp>5)dmgF(it.x,it.y,it.t.hv?2:1);
  if(it.th&&sp>5){for(const v of ch){if(v.tm==it.th.tm||v.dead)continue;let bq=null,bd=18;for(const i of[0,1,2,7,9]){const q=v.p[i],d=Math.hypot(q.x-it.x,q.y-it.y);if(d<bd){bd=d;bq=q;}}
   if(bq){hit({f:Math.sign(it.vx)||1,pl:it.th.pl,tm:it.th.tm,ty:0,cb:0,ct:0,at:{ty:it.t.k,hv:it.t.hv,t:0,d:1,h:0}},v,bq);if(--it.dur<=0)brk(it);else{it.vx*=-.3;it.vy=-3;it.th=null;it.cr=1;}break;}}}
  else if(!it.th&&sp<9){const c=ch.find(c=>t0>(it.pc||0)&&!(it.pcB===c&&t0<it.pcT)&&c.inj[0]<.9&&!c.it&&!c.dead&&c.k>.6&&(c.pl||c.tw)&&Math.abs(it.x-c.p[2].x)<34&&Math.abs(it.y-c.p[2].y)<70);if(c){it.h=c;c.it=it;spark(it.x,it.y);}}
 }
 items=items.filter(i=>!i.dead);
}
function drawH(){for(const h of HO){const b=G-h.h;ctx.fillStyle='#7d8aa0';ctx.fillRect(h.x,b,h.w,h.h+3);ctx.fillStyle='#5b4a4a';ctx.beginPath();ctx.moveTo(h.x-12,b);ctx.lineTo(h.x+h.w/2,b-46);ctx.lineTo(h.x+h.w+12,b);ctx.fill();ctx.fillStyle='#3d3434';ctx.fillRect(h.x+h.w/2-14,G-62,28,65);
 for(const w of h.win){ctx.fillStyle='#2b2f38';ctx.fillRect(w.x-4,w.y-4,w.w+8,w.h+8);if(!w.b){ctx.fillStyle='#a9d6f0';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.fillStyle='#fff7';ctx.beginPath();ctx.moveTo(w.x+6,w.y+w.h);ctx.lineTo(w.x+20,w.y);ctx.lineTo(w.x+28,w.y);ctx.lineTo(w.x+14,w.y+w.h);ctx.fill();ctx.fillStyle='#2b2f38';ctx.fillRect(w.x+w.w/2-1,w.y,2,w.h);}else{ctx.fillStyle='#14161b';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.fillStyle='#bfe9ff';[[0,0],[w.w-9,0],[w.w-6,w.h-10],[0,w.h-8]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(w.x+x,w.y+y);ctx.lineTo(w.x+x+8,w.y+y);ctx.lineTo(w.x+x+3,w.y+y+9);ctx.fill();});}}}}
function drawIt(){for(const it of items){const x=it.h?it.h.p[4].x:(it.ox??it.x)+(it.x-(it.ox??it.x))*al,y=it.h?it.h.p[4].y:(it.oy??it.y)+(it.y-(it.oy??it.y))*al;
 if(!it.h&&!it.th){ctx.strokeStyle='#ffd54a';ctx.globalAlpha=.5+.3*Math.sin(t0*6);ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,16,0,7);ctx.stroke();ctx.globalAlpha=1;}
 ctx.save();ctx.translate(x,y);const n=it.t.n;if(it.t.gun&&it.h){ctx.scale(it.h.f,1);ctx.rotate(it.h.ag||0);}else ctx.rotate(it.h?(it.h.f>0?-.5:.5):it.a);
 if(n=='bottle'){ctx.fillStyle='#2e8b57';ctx.fillRect(-3,-6,6,12);ctx.fillRect(-1.5,-11,3,6);}
 else if(n=='brick'){ctx.fillStyle='#b5523b';ctx.fillRect(-8,-4,16,8);ctx.fillStyle='#e0a08e';ctx.fillRect(-8,-4,16,2);}
 else if(n=='pistol'){ctx.fillStyle='#262a31';ctx.fillRect(-4,-4,17,5);ctx.fillStyle='#4d5560';ctx.fillRect(-4,-4,17,1.4);
  ctx.fillStyle='#14161a';ctx.beginPath();ctx.moveTo(-4,1);ctx.lineTo(1,1);ctx.lineTo(-1,10);ctx.lineTo(-6,10);ctx.fill();
  ctx.strokeStyle='#14161a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(2,1);ctx.lineTo(2,4);ctx.lineTo(6,4);ctx.lineTo(6,1);ctx.stroke();
  if(it.h&&t0-(it.ft||-9)<.07){ctx.fillStyle='#fff1a8';ctx.beginPath();ctx.moveTo(13,-2);ctx.lineTo(22,-7);ctx.lineTo(18,-2);ctx.lineTo(23,2);ctx.lineTo(14,0);ctx.closePath();ctx.fill();}}
 else if(it.t.gun){
   if(n=='shotgun'){ctx.fillStyle='#6b4a2b';ctx.fillRect(-17,-3,14,6);ctx.fillStyle='#262a31';ctx.fillRect(-4,-4,10,5);ctx.fillRect(6,-3,25,3);ctx.fillStyle='#5a3a22';ctx.fillRect(10,0,12,3);}
   else if(n=='rifle'){ctx.fillStyle='#7a5532';ctx.fillRect(-18,-3,15,6);ctx.fillStyle='#262a31';ctx.fillRect(-4,-4,12,5);ctx.fillRect(8,-3,29,2.4);ctx.fillRect(2,-8,12,3);ctx.fillStyle='#4d5560';ctx.fillRect(2,-8,12,1);}
   else{ctx.fillStyle='#262a31';ctx.fillRect(-10,-4,22,6);ctx.fillRect(12,-3,11,2.4);ctx.fillStyle='#14161a';ctx.fillRect(1,2,5,11);ctx.fillRect(-12,-3,4,4);}
   if(it.h&&t0-(it.ft||-9)<.07){const m=it.t.gun.ml;ctx.fillStyle='#fff1a8';ctx.beginPath();ctx.moveTo(m-2,-2);ctx.lineTo(m+9,-7);ctx.lineTo(m+5,-2);ctx.lineTo(m+10,2);ctx.lineTo(m-1,0);ctx.closePath();ctx.fill();}}
  else{ctx.strokeStyle='#6b4a2b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,-9);ctx.lineTo(-7,8);ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.lineTo(7,8);ctx.stroke();}
 if(it.cr){ctx.strokeStyle='#fffc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4,-3);ctx.lineTo(0,1);ctx.lineTo(4,-1);ctx.stroke();}
 ctx.restore();}}
function step(){
  ocx=camx;for(const c of ch)for(const q of c.p){q.ox=q.x;q.oy=q.y;}
  if(hs>0){hs-=D;return;}
  t0+=D;doorStep();supplyStep();
  const ip=readInput();
  pip=ip;if(PV.fb)fbStep();else if(PV.on)pvStep();else if(!allDead()&&!ch.some(c=>!c.pl&&!c.dead)){spawnT+=D;if(spawnT>1.6){spawnT=0;spawn();}}
  for(const c of ch)upd(c,c.pl?(c.net?netIp(c):ip):ai(c));
  P.j=P.p=P.k=P.d=P.t=0;for(const p of PEERS){p.rip.jump=p.rip.punch=p.rip.kick=p.rip.drop=p.rip.thr=0;p.rip.dodge=0;p.rip.jhl=0;}
  if(drag){const q=drag,ox=q.x,oy=q.y,a=q.px,b=q.py;q.x+=(mouse.x-q.x)*.35;q.y+=(mouse.y-q.y)*.35;q.px=ox;q.py=oy;collide(q);q.px=q.x-(q.x-a)*.3;q.py=b;}
  for(const c of ch){
    integ(c);
    if(!c.at&&(c.gr||c.k<.3))for(const[a,b,d]of[[2,7,8],[2,9,10],[1,3,4],[1,5,6]]){const A=c.p[a],B=c.p[b],C=c.p[d],fs=a==2?c.f:-c.f,ex=C.x-A.x,ey=C.y-A.y,l=Math.hypot(ex,ey)||1,sd=((B.x-A.x)*ey-(B.y-A.y)*ex)/l*fs;if(sd<2){const m=(2-sd)*.5*fs/l,mx=ey*m,my=-ex*m;B.x+=mx;B.y+=my;B.px+=mx;B.py+=my;}}
    const l=c.at&&c.p[c.at.ty=='p'?(c.at.hd?6:4):8];
    if(l){c.tr.push({x:l.x,y:l.y});if(c.tr.length>8)c.tr.shift();}else if(c.tr.length)c.tr.shift();
  }
  if(PV.fb&&NET.role!='guest')fbBall();
  thrStep();grabStep();bulStep();
  for(const c of ch){
    const a=c.at;
    if(a&&!a.h&&a.t/a.d>.3&&a.t/a.d<.68){
      const l=c.p[a.ty=='p'?(a.hd?6:4):(a.kn?7:8)],vs=ch.filter(x=>x.tm!==c.tm);
      outer:for(const v of vs){if(v.dead)continue;let bq=null,bd=c.gr?17:22;for(const i of[0,1,2,7,9]){const q=v.p[i],d=Math.hypot(q.x-l.x,q.y-l.y);if(d<bd){bd=d;bq=q;}}if(bq){if(c.pl&&a.ty=='p'&&!c.th&&!v.th&&c.gr&&v.gr&&!v.bl&&v.ko<=0&&Math.random()<(v.ty?.12:.3)&&[3,4,5,6].some(i=>Math.hypot(v.p[i].x-l.x,v.p[i].y-l.y)<14))startThrow(c,v);else hit(c,v,bq);break outer;}}
      if(!a.h&&!a.fh&&dmgF(l.x,l.y,a.hv?2:1,(a.ty=='p'?7:11)*(a.hv?1.5:1)*(a.rs?1+clamp((a.rs-2)*.2,0,.5):1)*(a.fk?1.2:1),c.f))a.fh=1;
    }
  }
  for(const A of ch){
    const sp=Math.hypot(A.p[2].x-A.p[2].px,A.p[2].y-A.p[2].py);
    if(A.k<.3&&sp>7&&A.bc<=0)for(const B of ch){
      if(B===A||B.dead)continue;
      if(Math.hypot(A.p[2].x-B.p[2].x,A.p[2].y-B.p[2].y)<30){
        const d=Math.sign(A.p[2].x-A.p[2].px)||1;
        B.p.forEach(q=>{q.px-=d*4;});B.hp-=6;B.k=Math.max(0,B.k-.3);B.pt=1;A.bc=.5;hs=.04;shake=6;blood(B.p[2].x,B.p[2].y-20,6,d);
        if(B.hp<=0&&!B.dead){B.dead=1;B.k=0;if(!B.pl){score++;drop(B.p[2].x,B.p[2].y-30);}}
      }
    }
    A.bc-=D;
  }
  for(let i=0;i<ch.length;i++)for(let j=i+1;j<ch.length;j++){
    const a=ch[i].p[2],b=ch[j].p[2];
    if(ch[i].dead||ch[j].dead||ch[i].k<.5||ch[j].k<.5)continue;
    {const A0=ch[i],B0=ch[j];if(A0.hg||B0.hg||A0.hup||B0.hup||A0.dg>0||B0.dg>0)continue;}
    const same=ch[i].tm===ch[j].tm,d=b.x-a.x;if(Math.abs(d)<26&&Math.abs(b.y-a.y)<(same?30:34)){const m=(26-Math.abs(d))*Math.sign(d||1)*(same?.07:1),ia=ch[i].ty?.55:1,ib=ch[j].ty?.55:1,sm=ia+ib,ma=m*ia/sm,mb=m*ib/sm;a.x-=ma;a.px-=ma;b.x+=mb;b.px+=mb;const A=ch[i],B=ch[j];if(A.tm!==B.tm){const sg=Math.sign(d||1),ra=(a.x-a.px)*sg,rb=-(b.x-b.px)*sg;if(ra>2.6&&A.bcd<=0&&!A.at)bump(A,B,sg,ra);else if(rb>2.6&&B.bcd<=0&&!B.at)bump(B,A,-sg,rb);}}
  }
  itemStep();
  for(const q of parts){const bl=!q.c;q.vx*=.985;q.vy=Math.min(14,q.vy+.35);const px=q.x,py=q.y;q.x+=q.vx;q.y+=q.vy;q.l-=.03;
   {const o={x:q.x,y:q.y,px,py};collide(o,0,1);const nx=o.x-o.px,ny=o.y-o.py,ddx=nx-q.vx,ddy=ny-q.vy;
    if(ddx*ddx+ddy*ddy>.04){q.x=o.x;q.y=o.y;const e=bl?.1:.4;q.vx=nx+ddx*e;q.vy=ny+ddy*e;}}
   {const g=gy(q.x,q.y-8);if(q.y>g){q.y=g;
    if(bl){if(q.vy>1.2&&stains.length<110&&Math.random()<.7)stains.push({x:q.x,y:g+1,r:1+Math.random()*2.2});q.vy=0;q.vx*=.4;q.l-=.06;}
    else{q.vy=q.vy>1.6?-q.vy*.38:0;q.vx*=.72;}}}}
  parts=parts.filter(q=>q.l>0);if(parts.length>600)parts.splice(0,parts.length-600);fdStep();
  shake*=.85;flash=Math.max(0,flash-D);ts+=(1-ts)*.03;zk*=.9;for(const r of rings){r.r+=10+8*r.pw;r.l-=.045;}rings=rings.filter(r=>r.l>0);
  camFollow(camT(),.1);
}
/* камера: упреждение по направлению взгляда, выход за края карты, подъём вверх на платформах, сдвиг над кнопками на тач-экране */
const TOUCH=(()=>{try{return matchMedia('(pointer:coarse)').matches||('ontouchstart' in window)}catch(e){return false}})();
let cla=0,cyv=0;
let _ch=0,_ct=-1e9;const cvH=()=>{const n=performance.now();if(n-_ct>500){_ct=n;_ch=cv.clientHeight;}return _ch;};
/* сколько мира (в пикселях холста) обрезано с каждого бока в вертикальном режиме — чтобы интерфейс рисовать в видимой части */
let PCX=0;function pcxUpd(){PCX=0;try{if(!matchMedia('(orientation:portrait) and (pointer:coarse)').matches)return;const r=cv.getBoundingClientRect(),vw=document.documentElement.clientWidth||innerWidth;if(r.width>vw+1)PCX=Math.round(W*(r.width-vw)/(2*r.width));}catch(e){}}
addEventListener('resize',pcxUpd);setInterval(pcxUpd,700);setTimeout(pcxUpd,50);
function camYo(){if(PCX>0)return 0;if(!TOUCH)return 0;const hh=cvH()||H;return Math.min(0,Math.max(-150,(H-150*H/hh-14)-G));}
function camFollow(t,k){
  const f=t.dead?0:(t.f||0);cla+=(f*50-cla)*k*.3;
  const hv=W/(2*zoom),CM=TOUCH?230:110,lo=Math.min(hv-CM,WW/2),hi=Math.max(WW-hv+CM,WW/2);
  camx+=(clamp((PV.fb&&!t.dead?t.p[2].x*.55+FB.x*.45:t.p[2].x)+cla,lo,hi)-W/2-camx)*k;
  cyv+=(clamp((G-120-t.p[2].y)*.9*zoom,0,200*zoom)-cyv)*k*.6;
}
let skyT=null,skyG=null;
function draw(){
  const cs=camx;camx=ocx+(camx-ocx)*al;for(const c of ch)for(const q of c.p){q.sx=q.x;q.sy=q.y;if(q.ox!=null){q.x=q.ox+(q.x-q.ox)*al;q.y=q.oy+(q.y-q.oy)*al;}}
  if(skyT!==TH){skyT=TH;skyG=ctx.createLinearGradient(0,0,0,G);skyG.addColorStop(0,TH.s0);skyG.addColorStop(1,TH.s1);}
  ctx.fillStyle=skyG;ctx.fillRect(0,0,W,H);
  ctx.save();
  const skm=SET.sk?1:0,sx=(Math.random()-.5)*shake*skm,sy=(Math.random()-.5)*shake*skm;
  ctx.translate(sx,sy+camYo()+cyv);ctx.translate(W/2,G);ctx.scale(zoom*(1+zk),zoom*(1+zk));ctx.translate(-W/2,-G);
  ctx.fillStyle=TH.b1;
  for(let i=-4;i<16;i++){const x=i*140-camx*.3,h=90+(i*53+SD)%110;ctx.fillRect(x,G-h,100,h);}
  ctx.fillStyle=TH.b2;
  for(let i=-3;i<12;i++){const x=i*190-camx*.55+40,h=50+(i*37+SD)%70;ctx.fillRect(x,G-h,120,h);}
  ctx.translate(-camx,0);
  ctx.fillStyle=TH.g1;ctx.fillRect(-900,G+3,WW+1800,H*2);
  ctx.fillStyle=TH.g2;ctx.fillRect(-900,G+3,WW+1800,6);
  ctx.fillStyle='#0000002e';ctx.fillRect(-900,G-1500,910,H*6);ctx.fillRect(WW-10,G-1500,910,H*6);
  ctx.fillStyle='#ffffff55';for(let x=-840;x<WW+900;x+=120)ctx.fillRect(x,G+40,60,4);
  if(PV.fb)drawField();
  drawFx();drawH2();drawHx();drawDoors2();drawP();drawBal();if(dbg)drawSeg();for(const c of ch)if(c.dead)drawC(c);for(const c of ch)if(!c.dead)drawC(c);drawIt();drawBul();drawAim();if(PV.fb)drawBall();
  for(const q of parts){ctx.fillStyle=q.c||'#c0141c';ctx.globalAlpha=Math.max(0,q.l);{const z=q.s||(q.c?2:3);ctx.fillRect(q.x,q.y,z,z);}}
  drawFxs();drawShadow();
  if(flash>0){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.globalAlpha=flash*7;ctx.beginPath();ctx.arc(fx,fy,8+(.12-flash)*250,0,7);ctx.stroke();}
  ctx.globalAlpha=1;ctx.restore();
  if(PCX>0){ /* вертикальный телефон: бока холста обрезаны — интерфейс переносим в видимую часть */
    const vw=W-2*PCX,k=Math.min(1,vw/272),c=Math.max(vw/W,.62);
    ctx.save();ctx.translate(PCX,0);ctx.scale(k,k);hudBars();if(!PV.on)hudInfo();ctx.restore();
    if(PV.on){ctx.save();ctx.translate(W/2,66*k);ctx.scale(c,c);ctx.translate(-W/2,0);hudInfo();ctx.restore();}
    ctx.save();ctx.translate(W/2,H/2);ctx.scale(c,c);ctx.translate(-W/2,-H/2);hudHint();hudWaveBanner();drawOver();drawNetHud();ctx.restore();
  }else{hudBars();hudInfo();hudHint();hudWaveBanner();drawOver();drawNetHud();}
  camx=cs;for(const c of ch)for(const q of c.p){q.x=q.sx;q.y=q.sy;}
}
function drawC(c){
  const p=c.p;
  ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(p[2].x,gy(p[2].x,p[2].y)+5,26,5,0,0,7);ctx.fill();
  if(c.slam){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha=.65;ctx.lineCap='round';for(let i=0;i<6;i++){const x=p[2].x+(i-2.5)*8+(Math.random()-.5)*4,y=p[0].y-30-Math.random()*30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-30-Math.random()*50);ctx.stroke();}ctx.globalAlpha=1;}
  if(c.tr.length>1){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.globalAlpha=.7;ctx.beginPath();c.tr.forEach((t,i)=>i?ctx.lineTo(t.x,t.y):ctx.moveTo(t.x,t.y));ctx.stroke();ctx.globalAlpha=1;}
  if(c.gv>.65&&!c.dead){const dr=Math.sign(p[2].x-p[2].px)||c.f;ctx.save();ctx.globalAlpha=.35*c.gv;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.lineCap='round';for(let i=0;i<3;i++){const y=p[1].y-12+i*13,x=p[2].x-dr*(22+i*4);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-dr*(14+i*5),y);ctx.stroke();}ctx.restore();}
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=c.col;ctx.lineWidth=c.ty?8:5;
  const ln=(...i)=>{ctx.beginPath();ctx.moveTo(p[i[0]].x,p[i[0]].y);for(let k=1;k<i.length;k++)ctx.lineTo(p[i[k]].x,p[i[k]].y);ctx.stroke();};
  ctx.globalAlpha=.6;ln(1,5,6);ln(2,9,10);ctx.globalAlpha=1;
  ln(1,2);ln(2,7,8);ln(1,3,4);
  if(c.inj)c.inj.forEach((v,i)=>{if(v>.04){const[a,b,d]=[[1,3,4],[1,5,6],[2,7,8],[2,9,10]][i];ctx.strokeStyle='#b3121c';ctx.globalAlpha=(i%2?.5:1)*(.4+.6*v);ctx.lineWidth=c.ty?6:4;ln(b,d);if(v>.8){ctx.fillStyle='#fff';ctx.fillRect(p[b].x-2,p[b].y-2,4,4);}ctx.globalAlpha=1;}});ctx.strokeStyle=c.col;ctx.lineWidth=c.ty?8:5;
  ctx.lineWidth=6;ln(0,1);
  ctx.fillStyle='#f4f6f8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p[0].x,p[0].y,c.ty?11:9,0,7);ctx.fill();ctx.stroke();
  {const e1=p[0].x+c.f*2,e2=p[0].x+c.f*6,ey=p[0].y-3;ctx.fillStyle='#111';ctx.strokeStyle='#111';ctx.lineWidth=1.6;
  if(c.ko>0||c.dead){[e1,e2].forEach(x=>{ctx.beginPath();ctx.moveTo(x-2,ey-2);ctx.lineTo(x+2,ey+2);ctx.moveTo(x+2,ey-2);ctx.lineTo(x-2,ey+2);ctx.stroke();});}
  else{ctx.fillRect(e1-1,ey,2,c.dz>0?1:3);ctx.fillRect(e2-1,ey,2,c.dz>0?1:3);}
  if(c.ko>0&&!c.dead){ctx.font='bold 14px system-ui';ctx.fillText('z',p[0].x+8,p[0].y-14-Math.sin(t0*4)*3);}}
  if(c.pl&&c.aim&&!c.dead){ctx.strokeStyle=c.hb||'#e0303a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[2].x+c.f*36,p[2].y-24+c.aim*28,4,0,7);ctx.stroke();}
  if(c.pl||PV.on){ctx.fillStyle=c.hb||'#e0303a';ctx.fillRect(p[0].x-9,p[0].y-4,18,4);ctx.fillRect(p[0].x-c.f*17,p[0].y-4,8,3);if((NET.on||PV.on)&&c.pl&&c.nm&&!c.dead){ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(c.nm+(c===pl?' ▼':''),p[0].x,p[0].y-18);ctx.textAlign='left';}}
  if(!c.pl&&!c.dead){ctx.fillStyle='#0008';ctx.fillRect(p[0].x-15,p[0].y-24,30,4);ctx.fillStyle=c.hb||'#e0303a';ctx.fillRect(p[0].x-15,p[0].y-24,30*Math.max(0,c.hp)/c.max,4);}
}
let last=performance.now(),acc=0;
function loop(n){autoZoom();
  const dt=Math.min(.05,(n-last)/1000);
  if(NET.role=='guest'){
    last=n;acc+=dt;while(acc>=D){gstep();acc-=D;}
    al=1;ocx=camx;gRender(dt);gInput(n);netPing(n);
    if(NET.on&&n-NET.lastRx>(NET.peerHid?60000:15000))netLost('Связь с хостом потеряна');
    if(pl&&ch.length)draw();else drawWait();
    uiTick(n);requestAnimationFrame(loop);return;
  }
  acc+=dt*ts;last=n;if(NET.peerHid||uiFrozen())acc=0;
  while(acc>=D){step();acc-=D;}
  al=acc/D;draw();netTick(n);uiTick(n);requestAnimationFrame(loop);
}
const km={KeyW:'j',ArrowUp:'j',Space:'j',KeyJ:'p',KeyZ:'p',KeyK:'k',KeyX:'k',KeyG:'d',KeyQ:'d'};
addEventListener('keydown',e=>{
  if(inNet(e))return;if(e.code=='KeyN'&&!e.repeat){togNet();return;}if(e.code=='Escape'){togNet(0);return;}
  K[e.code]=1;if(!e.repeat&&km[e.code])P[km[e.code]]=1;
  if(e.code=='KeyB')dbg^=1;if(e.code=='KeyR'||(e.code=='Enter'&&allDead()&&UI.goShown))restartReq();
  if(km[e.code]||e.code.startsWith('Arrow'))e.preventDefault();
});
addEventListener('keyup',e=>{if(!inNet(e))K[e.code]=0;});
[['l','◀','left:14px'],['r','▶','left:86px'],['j','▲','right:170px'],['p','👊','right:92px'],['k','🦵','right:14px'],['b','🛡️','right:131px;bottom:86px'],['c','⬇','left:50px;bottom:86px'],['n','🏃','left:122px;bottom:86px'],['d','🗑️','right:8px;bottom:auto;top:calc(58px + env(safe-area-inset-top,0px));width:46px;height:46px;font-size:20px']].forEach(([id,t,pos])=>{
  const b=document.createElement('div');b.className='b';b.dataset.k=id;b.textContent=t;b.style.cssText=pos;
  b.onpointerdown=e=>{e.preventDefault();T[id]=1;if(id=='j'||id=='p'||id=='k'||id=='d')P[id]=1;};
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>T[id]=0));
  document.getElementById('w').appendChild(b);
});
function m2w(){return{x:(mouse.sx-W/2)/zoom+W/2+camx,y:(mouse.sy-camYo()-cyv-G)/zoom+G};}
function mpos(e){const r=cv.getBoundingClientRect();mouse.sx=(e.clientX-r.left)/r.width*W;mouse.sy=(e.clientY-r.top)/r.height*H;if(e.pointerType!='touch')mouse.act=1;const w=m2w();mouse.x=w.x;mouse.y=w.y;}
cv.addEventListener('pointerdown',e=>{if(e.pointerType!='mouse'||e.button!=0||allDead())return;mpos(e);if(pl&&!pl.dead&&heldGun(pl)){drag=null;K.mf=1;P.p=1;}});
addEventListener('pointerup',()=>{K.mf=0;});addEventListener('blur',()=>{K.mf=0;});
cv.addEventListener('pointerdown',e=>{
  if(allDead())return;
  if(NET.role=='guest')return;
  mpos(e);let best=30;drag=null;if(e.pointerType=='mouse'&&e.button!=0)return; /* ПКМ — пинок/бросок, не хват */
  for(const c of ch)for(const q of c.p){const d=Math.hypot(q.x-mouse.x,q.y-mouse.y);if(d<best){best=d;drag=q;}}
});
cv.addEventListener('pointermove',mpos);
addEventListener('pointerup',()=>drag=null);
let zoom=1,zUser=0,pt={},z0=1,d0=1;
const autoZoom=()=>{if(TOUCH&&!zUser)zoom=clamp(560/(cvH()||540),1.1,1.5);};
const pd=()=>{const a=Object.values(pt);return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;};
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{if(e.pointerType!='mouse'||allDead()||!pl||pl.dead)return;mpos(e);if(heldGun(pl)||pl.it)return;if(e.button==0){if(!drag)P.p=1;}else if(e.button==2)P.k=1;});
cv.addEventListener('pointerdown',e=>{if(e.pointerType!='mouse'||allDead()||NET.role=='guest'&&false)return;mpos(e);if(!pl||pl.dead||!pl.it)return;if(e.button==2||(e.button==0&&!heldGun(pl)&&!drag)){drag=null;P.t=1;}});
cv.addEventListener('pointerdown',e=>{pt[e.pointerId]={x:e.clientX,y:e.clientY};if(Object.keys(pt).length==2){drag=null;z0=zoom;d0=pd();}});
cv.addEventListener('pointermove',e=>{if(!pt[e.pointerId])return;pt[e.pointerId]={x:e.clientX,y:e.clientY};if(Object.keys(pt).length==2){drag=null;zoom=clamp(z0*pd()/d0,.6,1.8);zUser=1;}});
['pointerup','pointercancel'].forEach(v=>addEventListener(v,e=>{delete pt[e.pointerId];drag=null;}));
cv.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.6,1.8);},{passive:false});
addEventListener('blur',()=>{drag=null;pt={};});

/* ================= CO-OP ПО WI-FI (WebRTC, без сервера) ================= */
const PV={on:0,fb:0,s:[0,0],win:5,o:-1,rt:0,lw:-1,b:[2,2],ht:0,tc:[['#5a0d14','#ff3b45'],['#0d2a5c','#3b86ff']]};
let uid=0,gen=0,mapSeed=1,EV=[];const PEERS=[],MAXP=7,RIP0={mx:0,ay:0};
/* ввод гостя отдаём в upd КОПИЕЙ: одноразовые нажатия (прыжок/удар/пинок) обнуляются сразу после upd, а висение на турнике и вылезание на крышу (grabStep → hang/climb) читают c.ip позже в этом же кадре. jhl — защёлка удержания прыжка, если «нажал» и «отпустил» пришли хосту в один кадр */
function netIp(c){const r=c.rip||RIP0,o=Object.assign({},r);o.jh=!!(r.jh||r.jhl);return o;}let NP=null,peerSeq=0;
const NET={hp:null,sp:null,role:'solo',on:false,pend:null,pc:null,rel:null,fast:null,rtt:0,lastRx:0,sn:0,inN:-1,ej:null,ep:null,ek:null,msg:'',msgT:0,lastSend:0,lastPing:0};
let GS={q:[],cur:0,int:50,gen:-1,seed:-1,evq:[],rt:0,ej:0,ep:0,ek:0,ed:0,dd:0,sn:0,lk:'',lin:0};
const GC=new Map(),GIM=new Map(),lp=(a,b,u)=>a+(b-a)*u;
function mulb(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const isH=()=>NET.role=='host'&&NET.on;
const allDead=()=>PV.on?PV.o>=0:!ch.some(c=>c.pl&&!c.dead);
function readInput(){
  const ip={mx:(K.KeyD||K.ArrowRight||T.r?1:0)-(K.KeyA||K.ArrowLeft||T.l?1:0),jump:P.j,punch:P.p,kick:P.k,drop:P.d,thr:P.t,jh:K.KeyW||K.ArrowUp||K.Space||T.j,block:K.KeyL||T.b,crouch:K.KeyS||K.ArrowDown||T.c,ay:(K.KeyS||K.ArrowDown||T.c?1:0)-(K.KeyW||K.ArrowUp||T.j?1:0)};
  if(mouse.sx!=null){const w=m2w();mouse.x=w.x;mouse.y=w.y;}
  ip.hf=!!(K.KeyJ||K.KeyZ||K.mf);
  if(mouse.act&&mouse.sx!=null&&pl&&!pl.dead&&(pl.it||heldGun(pl)))ip.ag=Math.atan2(mouse.y-pl.p[1].y,mouse.x-pl.p[1].x);
  const m=ip.mx;
  if(m&&!RL.pm&&m==RL.ld&&t0-RL.lt<.28)RL.on=1;
  if(!m){if(RL.pm){RL.ld=RL.pm;RL.lt=t0;}RL.on=0;}else if(RL.pm&&m!=RL.pm)RL.on=0;
  ip.run=!!(K.ShiftLeft||K.ShiftRight||T.n||RL.on);
  ip.dodge=(ip.block&&m&&(!RL.pb||m!=RL.pm))?m:0;
  RL.pm=m;RL.pb=ip.block?1:0;
  return ip;}
function nearP(c){let b=null,bd=1e9;for(const p of ch){if(p.tm===c.tm||p.dead)continue;const d=Math.abs(p.p[2].x-c.p[2].x);if(d<bd){bd=d;b=p;}}return b||pl;}
function camT(){if(pl.dead){const m=PV.on?(ch.find(c=>c.tm===pl.tm&&!c.dead)||ch.find(c=>!c.dead)):ch.find(c=>c.pl&&!c.dead);if(m)return m;}return pl;}
function setMsg(t){NET.msg=t;NET.msgT=performance.now()+4000;}
const PCOL=[['#0f2a5c','#2f7bff'],['#0f4a1c','#2fcf5a'],['#5c4a0f','#e0c030'],['#3c0f5c','#a74fff'],['#5c2a0f','#ff8a2f'],['#0f4a5c','#2fd0e0']];
function addPeerChar(pe){if(pe.pl&&ch.includes(pe.pl))return;if(pe.tm==null)pe.tm=pvBal();
  if(pe.slot==null){let k=0;while(PEERS.some(p=>p!==pe&&p.slot===k))k++;pe.slot=k;}
  const c=mk(pl.dead?200:Math.max(40,pl.p[2].x-60-pe.slot*16),1),k=PCOL[pe.slot%PCOL.length];
  c.col=k[0];c.hb=k[1];c.net=1;c.rip=pe.rip;c.nm=pe.name||('Гость'+(pe.slot+1));pe.pl=c;pl.nm=NET.myName||'Хост';ch.push(c);if(PV.on)pvJoin(c,pe);}
function dropPeerChar(pe){if(pe.pl){ch=ch.filter(c=>c!==pe.pl);pe.pl=null;}if(!PEERS.length&&pl)pl.nm=null;}
function reviveP(old){const m=ch.find(c=>c.pl&&!c.dead&&c!==old),n=mk(m?m.p[2].x-40:200,1);n.hp=n.max*.6;n.nm=old.nm;n.hb=old.hb;n.col=old.col;n.net=old.net;n.rip=old.rip;ch[ch.indexOf(old)]=n;if(old===pl)pl=n;const pe=PEERS.find(p=>p.pl===old);if(pe)pe.pl=n;}
function restartReq(){if(NET.role=='guest'){if(allDead())sendR({t:'rs'});}else if(PV.on){if(PV.o>=0)newMatch();}else init();}
/* события для гостя (частицы, эффекты) */
function PP(o){parts.push(o);if(NET.role=='host'&&NET.on&&EV.length<500)EV.push(['p',+o.x.toFixed(1),+o.y.toFixed(1),+o.vx.toFixed(2),+o.vy.toFixed(2),+o.l.toFixed(2),o.c||0,o.s||0]);}
function RP(o){rings.push(o);if(isH())EV.push(['r',o]);}
function OP(o){pools.push(o);if(isH())EV.push(['o',o]);}
function KP(o){cracks.push(o);if(isH())EV.push(['k',o]);}
function DP(h,o){h.dec.push(o);if(isH())EV.push(['d',HO.indexOf(h),o]);}
/* ---------- отправка ---------- */
function dsend(d,m,fast){if(d&&d.readyState=='open'&&(!fast||d.bufferedAmount<64000))try{d.send(JSON.stringify(m))}catch(e){}}
function sendR(m,pe){if(pe)return dsend(pe.rel,m);if(NET.role=='host'){for(const p of PEERS)dsend(p.rel,m);}else dsend(NET.rel,m);}
function sendF(m,pe){if(pe)return dsend(pe.fast,m,1);if(NET.role=='host'){for(const p of PEERS)dsend(p.fast,m,1);}else dsend(NET.fast,m,1);}
const hCells=h=>[...h.win,...h.dw.flatMap(g=>g.c)];
function msStr(){return HO.map(h=>hCells(h).map(c=>c.b?3:(c.cr|0)).join('')+h.fu.map(f=>f.b?1:0).join('')).join('')+props.map(p=>p.b?1:0).join('')+BAL.map(a=>a.b?3:a.hp<a.mx*.34?2:a.hp<a.mx*.67?1:0).join('');}
function snap(now){
  const c=ch.map(c=>{const p=[];for(const q of c.p)p.push(Math.round(q.x*10),Math.round(q.y*10));
    return{i:c.id,p,f:c.f,h:Math.round(c.hp),m:Math.round(c.max),o:c.ko>0?1:0,z:c.dz>0?1:0,d:c.dead?1:0,y:c.ty?1:0,l:c.pl?1:0,u:c.tm|0,c:c.col,b:c.hb,a:c.at?(c.at.ty=='p'?(c.at.hd?2:1):3):0,s:c.slam?1:0,q:+(c.aim||0).toFixed(2),n:c.nm||0,v:+(c.gv||0).toFixed(2),g:+(c.ag||0).toFixed(2),j:c.inj.map(v=>Math.round(v*9))};});
  const it=items.map(i=>({i:i.id,k:IT.indexOf(i.t),x:Math.round(i.x*10),y:Math.round(i.y*10),a:Math.round(i.a*100),h:i.h?i.h.id:0,r:i.cr?1:0,t:i.th?1:0,m:i.am|0}));
  return{t:'s',n:++NET.sn,ht:now,g:gen,sd:mapSeed,w:wave,sc:score,pv:PV.on?[PV.s[0],PV.s[1],PV.win,PV.o,PV.rt>0?1:0,PV.lw,PV.fb|0]:0,me:0,fb:PV.fb?[Math.round(FB.x*10),Math.round(FB.y*10),Math.round(FB.a*100)]:0,c,it,bl:BUL.map(b=>[b.id,Math.round(b.x*10),Math.round(b.y*10),Math.round(b.vx*10),Math.round(b.vy*10)]),ms:msStr(),ba:BAL.map(a=>{const o=[Math.round(a.x*10),Math.round(a.y*10)];for(const n of a.r)o.push(Math.round(n.x*10),Math.round(n.y*10));return o;}),sh:+shake.toFixed(2),fl:+flash.toFixed(3),fx:fx|0,fy:fy|0,zk:+zk.toFixed(3),dr:DRS().map(d=>{return d?[d.b?1:0,Math.round(d.a*100),d.dir,Math.round(d.hp),Math.round(d.shk*100)]:0}),dd:doors2.map(f=>[Math.round(f.x*10),Math.round(f.y*10),Math.round(f.a*100),Math.round(f.L),f.t])};
}
function netPing(now){if(now-NET.lastPing>1000){NET.lastPing=now;sendR({t:'pg',n:now});}}
function netTick(now){
  if(!isH())return;
  for(const pe of PEERS.slice())if(now-pe.lastRx>(pe.hid?60000:15000))peerLost(pe,(pe.name||'Друг')+': связь потеряна');
  if(!isH())return;
  if(now-NET.lastSend>=50){NET.lastSend=now;if(EV.length){sendR({t:'ev',ht:now,e:EV});EV=[];}const sn=snap(now);for(const pe of PEERS){sn.me=pe.pl?pe.pl.id:0;sendF(sn,pe);}}
  netPing(now);
}
/* ---------- приём ---------- */
function onMsg(m,pe){
  const nw=performance.now();NET.lastRx=nw;if(pe)pe.lastRx=nw;
  switch(m.t){
    case 'pg':sendR({t:'pn',n:m.n},pe);break;
    case 'pn':{const r=Math.round(performance.now()-m.n);if(pe)pe.rtt=r;NET.rtt=NET.role=='host'?Math.max(0,...PEERS.map(p=>p.rtt)):r;break;}
    case 'in':if(NET.role=='host'&&pe&&pe.pl){const rip=pe.rip;if(m.n<=pe.inN)break;pe.inN=m.n;rip.mx=m.mx;rip.block=!!m.b;rip.crouch=!!m.c;rip.ay=m.ay;rip.run=!!m.rn;rip.jh=!!m.jh;rip.ag=m.ag==null?null:m.ag/100;rip.hf=!!m.hf;
      if(pe.ej==null){pe.ej=m.ej;pe.ep=m.ep;pe.ek=m.ek;pe.ed=m.ed|0;pe.edr=m.edr|0;pe.ett=m.ett|0;}
      if((m.ed|0)!=pe.ed){rip.dodge=m.dd|0;pe.ed=m.ed|0;}
      if((m.edr|0)!=pe.edr){rip.drop=1;pe.edr=m.edr|0;}
      if((m.ett|0)!=pe.ett){rip.thr=1;pe.ett=m.ett|0;}
      if(m.ej!=pe.ej){rip.jump=1;rip.jhl=1;pe.ej=m.ej;}if(m.ep!=pe.ep){rip.punch=1;pe.ep=m.ep;}if(m.ek!=pe.ek){rip.kick=1;pe.ek=m.ek;}}break;
    case 'rs':if(NET.role=='host'&&allDead()){if(PV.on)newMatch();else init();}break;
    case 's':if(NET.role=='guest')gOnSnap(m);break;
    case 'ev':if(NET.role=='guest')GS.evq.push(m);break;
    case 'pz':if(NET.role=='host'&&pe){pe.hid=m.v?1:0;NET.peerHid=PEERS.length&&PEERS.every(p=>p.hid)?1:0;}else NET.peerHid=m.v?1:0;break;
    case 'bye':if(NET.role=='host'&&pe)peerLost(pe,(pe.name||'Друг')+' вышел из игры');else netLost('Хост вышел из игры');break;
  }
}
/* ---------- гость: приём снимков и интерполяция ---------- */
function gReset(s){gBL=[];BUL.length=0;GS.gen=s.g;GS.seed=s.sd;GS.q=[];GS.cur=0;GS.evq=[];GC.clear();GIM.clear();ch=[];items=[];parts=[];rings=[];cracks=[];pools=[];stains=[];shards=[];doors2=[];wave=s.w;score=s.sc;t0=0;newMap(s.sd);}
function gOnSnap(s){
  PV.fb=s.pv?(s.pv[6]|0):0;
  if(s.g!==GS.gen||s.sd!==GS.seed)gReset(s);
  const q=GS.q;if(q.length&&s.n<=q[q.length-1].n)return;
  if(q.length){const d=s.ht-q[q.length-1].ht;if(d>0&&d<500)GS.int+=(clamp(d,16,150)-GS.int)*.1;}
  q.push(s);if(q.length>8){q.splice(0,q.length-3);GS.cur=0;}
  shake=Math.max(shake,s.sh);if(s.fl>flash+.01){flash=s.fl;fx=s.fx;fy=s.fy;}zk=Math.max(zk,s.zk);
}
function gApply(A,B,u){
  const ma=new Map();for(const c of A.c)ma.set(c.i,c);
  const seen=new Set(),nch=[];
  for(const cb of B.c){
    let o=GC.get(cb.i);if(!o){o={id:cb.i,p:Array.from({length:11},()=>({x:0,y:0})),tr:[],k:1,wk:0};GC.set(cb.i,o);}
    const ca=ma.get(cb.i)||cb;
    for(let j=0;j<11;j++){o.p[j].x=lp(ca.p[2*j],cb.p[2*j],u)/10;o.p[j].y=lp(ca.p[2*j+1],cb.p[2*j+1],u)/10;}
    o.f=cb.f;o.hp=cb.h;o.max=cb.m;o.ko=cb.o;o.dz=cb.z;o.dead=cb.d;o.ty=cb.y;o.pl=!!cb.l;o.tm=cb.u|0;o.col=cb.c;o.hb=cb.b;o.aim=cb.q;o.nm=cb.n||null;o.slam=!!cb.s;o.at2=cb.a;o.gv=cb.v||0;o.ag=cb.g||0;o.inj=(cb.j||[0,0,0,0]).map(v=>v/9);
    nch.push(o);seen.add(cb.i);
  }
  for(const k of [...GC.keys()])if(!seen.has(k))GC.delete(k);
  ch=nch;
  const mi=new Map();for(const i of A.it)mi.set(i.i,i);
  const nit=[],si=new Set();
  for(const ib of B.it){
    let o=GIM.get(ib.i);if(!o){o={id:ib.i,t:IT[ib.k],h:null,th:0,cr:0};GIM.set(ib.i,o);}
    const ia=mi.get(ib.i)||ib;
    o.x=lp(ia.x,ib.x,u)/10;o.y=lp(ia.y,ib.y,u)/10;o.a=lp(ia.a,ib.a,u)/100;o.th=ib.t;o.cr=ib.r;o.am=ib.m|0;o.h=ib.h?(GC.get(ib.h)||null):null;
    nit.push(o);si.add(ib.i);
  }
  for(const k of [...GIM.keys()])if(!si.has(k))GIM.delete(k);
  items=nit;gBL=(B.bl||[]).map(a=>({x:a[1]/10,y:a[2]/10,vx:a[3]/10,vy:a[4]/10}));
  if(B.w!==wave){pools.length=0;stains.length=0;}
  wave=B.w;score=B.sc;if(B.pv){PV.on=1;PV.s=[B.pv[0],B.pv[1]];PV.win=B.pv[2];PV.o=B.pv[3];PV.rt=B.pv[4];PV.lw=B.pv[5];}else PV.on=0;
  if(B.fb){const a=A.fb||B.fb;FB.x=lp(a[0],B.fb[0],u)/10;FB.y=lp(a[1],B.fb[1],u)/10;FB.a=B.fb[2]/100;}
  if(B.ba)B.ba.forEach((e,j)=>{const a=BAL[j];if(!a||e.length!=2+a.r.length*2)return;a.x=e[0]/10;a.y=e[1]/10;a.r.forEach((n,k)=>{n.x=e[2+k*2]/10;n.y=e[3+k*2]/10;});});
  const ms=B.ms;if(ms){let i=0;
    for(const h of HO){for(const c of hCells(h)){const d=+ms[i++];c.b=d==3?1:0;c.cr=d==3?0:d;}for(const f of h.fu)f.b=+ms[i++];}
    for(const p of props){const b=+ms[i++];if(b&&!p.b&&p.t.lamp&&p.L)p.L.on=false;p.b=b;}
    for(const a of BAL){const d=+ms[i++],nb=d==3?1:0;if(nb!=a.b){a.b=nb;buildGP();}a.dm=nb?0:d|0;}}
  if(B.dr)DRS().forEach((d,j)=>{const x=B.dr[j],xa=A.dr&&A.dr[j];if(!x||!d)return;d.b=x[0];d.a=xa?lp(xa[1],x[1],u)/100:x[1]/100;d.dir=x[2];d.hp=x[3];d.shk=x[4]/100;});
  if(B.dd){const sm=A.dd&&A.dd.length==B.dd.length;doors2=B.dd.map((e,j)=>{const a=sm?A.dd[j]:e;return{x:lp(a[0],e[0],u)/10,y:lp(a[1],e[1],u)/10,a:lp(a[2],e[2],u)/100,L:e[3],t:e[4]};});}
  pl=GC.get(B.me)||ch.find(c=>c.pl)||null;
}
function gEv(b){
  for(const e of b.e){
    switch(e[0]){
      case 'p':parts.push({x:e[1],y:e[2],vx:e[3],vy:e[4],l:e[5],c:e[6]||undefined,s:e[7]||undefined});break;
      case 'f':FX(e[1],e[2],e[3],e[4],e[5],e[6]);break;
      case 'b':blast(e[1],e[2]);break;
      case 'h':if(shards.length>170)shards.shift();shards.push({x:e[1],y:e[2],vx:e[3],vy:e[4],a:Math.random()*6.28,va:(Math.random()-.5)*.6,s:e[5],l:900,rest:0,c:Math.random()*3|0});break;
      case 'r':rings.push(e[1]);break;
      case 'o':pools.push(e[1]);break;
      case 'k':cracks.push(e[1]);break;
      case 'd':if(HO[e[1]])HO[e[1]].dec.push(e[2]);break;
    }
  }
  if(parts.length>700)parts.splice(0,parts.length-700);
}
function gRender(dt){
  const q=GS.q;if(!q.length)return;
  if(q.length==1){gApply(q[0],q[0],0);GS.rt=q[0].ht;}
  else{
    const sp=q.length>4?1.5:q.length>3?1.15:q.length>2?1:.9;
    GS.cur+=dt*1000/GS.int*sp;
    while(GS.cur>=1&&q.length>2){q.shift();GS.cur-=1;}
    if(GS.cur>1)GS.cur=1;
    gApply(q[0],q[1],GS.cur);GS.rt=q[0].ht+(q[1].ht-q[0].ht)*GS.cur;
  }
  while(GS.evq.length&&GS.evq[0].ht<=GS.rt)gEv(GS.evq.shift());
  if(pl){const m=PV.on?(ch.find(c=>c.tm===pl.tm&&!c.dead)||ch.find(c=>!c.dead)):ch.find(c=>c.pl&&!c.dead),t=(pl.dead&&m)?m:pl;camFollow(t,1-Math.pow(.9,dt*60));}
}
function gstep(){
  t0+=D;
  for(const q of parts){const bl=!q.c;q.vx*=.985;q.vy=Math.min(14,q.vy+.35);const px=q.x,py=q.y;q.x+=q.vx;q.y+=q.vy;q.l-=.03;
   {const o={x:q.x,y:q.y,px,py};collide(o,0,1);const nx=o.x-o.px,ny=o.y-o.py,ddx=nx-q.vx,ddy=ny-q.vy;
    if(ddx*ddx+ddy*ddy>.04){q.x=o.x;q.y=o.y;const e=bl?.1:.4;q.vx=nx+ddx*e;q.vy=ny+ddy*e;}}
   {const g=gy(q.x,q.y-8);if(q.y>g){q.y=g;
    if(bl){if(q.vy>1.2&&stains.length<110&&Math.random()<.7)stains.push({x:q.x,y:g+1,r:1+Math.random()*2.2});q.vy=0;q.vx*=.4;q.l-=.06;}
    else{q.vy=q.vy>1.6?-q.vy*.38:0;q.vx*=.72;}}}}
  parts=parts.filter(q=>q.l>0);
  shake*=.85;flash=Math.max(0,flash-D);zk*=.9;for(const r of rings){r.r+=10+8*r.pw;r.l-=.045;}rings=rings.filter(r=>r.l>0);
  for(const c of ch){const a=c.at2,l=a&&c.p[a==1?4:a==2?6:8];if(l){c.tr.push({x:l.x,y:l.y});if(c.tr.length>8)c.tr.shift();}else if(c.tr.length)c.tr.shift();}
}
function gInput(n){
  const ip=readInput();if(P.j)GS.ej++;if(P.p)GS.ep++;if(P.k)GS.ek++;if(P.d)GS.edr=(GS.edr|0)+1;if(P.t)GS.ett=(GS.ett|0)+1;P.j=P.p=P.k=P.d=P.t=0;
  if(ip.dodge){GS.ed++;GS.dd=ip.dodge;}
  const key=ip.mx+'|'+(ip.block?1:0)+'|'+(ip.crouch?1:0)+'|'+ip.ay+'|'+(ip.run?1:0)+'|'+(ip.jh?1:0)+'|'+GS.ej+'|'+GS.ep+'|'+GS.ek+'|'+GS.ed+'|'+(GS.edr|0)+'|'+(GS.ett|0)+'|'+(ip.ag==null?'x':Math.round(ip.ag*20))+'|'+(ip.hf?1:0);
  if(key!==GS.lk||n-GS.lin>100){GS.lk=key;GS.lin=n;sendF({t:'in',n:++GS.sn,mx:ip.mx,b:ip.block?1:0,c:ip.crouch?1:0,ay:ip.ay,rn:ip.run?1:0,jh:ip.jh?1:0,ej:GS.ej,ep:GS.ep,ek:GS.ek,ed:GS.ed,edr:GS.edr|0,ett:GS.ett|0,dd:GS.dd,ag:ip.ag==null?null:Math.round(ip.ag*100),hf:ip.hf?1:0});}
}
/* ---------- HUD (стиль Coopix Market: тёмные панели со скошенными углами) ---------- */
function cutP(x,y,w,h,c){ctx.beginPath();ctx.moveTo(x+c,y);ctx.lineTo(x+w-c,y);ctx.lineTo(x+w,y+c);ctx.lineTo(x+w,y+h-c);ctx.lineTo(x+w-c,y+h);ctx.lineTo(x+c,y+h);ctx.lineTo(x,y+h-c);ctx.lineTo(x,y+c);ctx.closePath();}
function hudPanel(x,y,w,h,ec,c){cutP(x+1,y+1,w-2,h-2,c||8);ctx.fillStyle='rgba(18,10,42,.9)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=ec||'#3a2a70';ctx.stroke();}
function hudTxt(s,x,y,sz,col,al,px){ctx.font='700 '+sz+'px '+(px?PXF:UF);ctx.fillStyle=col;ctx.textAlign=al||'left';ctx.fillText(s,x,y);ctx.textAlign='left';}
const hpCol=r=>r>.6?'#5dff8a':r>.3?'#ffb23f':'#ff5e7a';
function hudBar(x,y,w,h,r,g,col){
  ctx.fillStyle='#0b0620';ctx.fillRect(x,y,w,h);
  if(g>r){ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(x,y,w*g,h);}
  ctx.fillStyle=col;ctx.fillRect(x,y,w*r,h);
  ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x,y,w*r,Math.max(1,h*.3|0));
  ctx.fillStyle='#0b0620';for(let i=1;i<10;i++)ctx.fillRect(x+w*i/10-1,y,2,h);
  ctx.strokeStyle='#3a2a70';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
}
function hudBanner(t,sub,col,y){
  ctx.font='700 20px '+UF;const w1=ctx.measureText(t).width;ctx.font='700 12px '+UF;const w2=sub?ctx.measureText(sub).width:0;
  const w=Math.max(w1,w2)+60,h=sub?54:38,x=(W-w)/2;
  hudPanel(x,y,w,h,col,9);ctx.fillStyle=col;ctx.fillRect(x+10,y+8,4,h-16);ctx.fillRect(x+w-14,y+8,4,h-16);
  hudTxt(t,W/2,y+25,20,'#fff','center');
  if(sub)hudTxt(sub,W/2,y+44,12,'#cdbfff','center');
}
function uiName(){return(pl&&pl.nm)||UI.nm||'Игрок';}
function hudBars(){
  const now=performance.now(),r=Math.max(0,pl.hp)/pl.max;
  if(UI.pk!==pl.id){UI.pk=pl.id;UI.hg=r;}
  UI.hg=r>UI.hg?r:UI.hg+(r-UI.hg)*.06;
  const low=r<.3&&!pl.dead,pul=low?Math.sin(now/110)>0:0;
  hudPanel(12,12,252,50,low?(pul?'#ff5e7a':'#7a2440'):'#3a2a70',9);
  const col=pl.hb||'#e0303a';
  ctx.fillStyle=col;ctx.fillRect(22,22,22,30);
  ctx.fillStyle='#f4f6f8';ctx.beginPath();ctx.arc(33,34,7,0,7);ctx.fill();
  ctx.fillStyle=col;ctx.fillRect(26,31,14,3);
  hudTxt(uiName().toUpperCase().slice(0,14),54,29,12,'#cdbfff');
  hudTxt(Math.max(0,Math.ceil(pl.hp))+'',254,29,13,low?'#ff9aae':'#fff','right');
  hudBar(54,35,200,16,r,UI.hg,hpCol(r));
  if(!NET.on)return;
  const y0=Math.max(14,Math.ceil(110/((cvH()||H)/H)));
  ch.filter(c=>c.pl&&c!==pl).forEach((m,i)=>{
    const x=W-212,y=y0+i*34,rr=Math.max(0,m.hp)/m.max;
    hudPanel(x,y,200,30,m.dead?'#3a2a70':(m.hb||'#2f7bff'),7);
    hudTxt(((m.nm||'Друг')+(m.dead?' ✖':'')).toUpperCase().slice(0,16),x+10,y+14,10,'#cdbfff');
    hudBar(x+10,y+18,180,7,m.dead?0:rr,0,hpCol(rr));
  });
}
function hudInfo(){
  if(PV.on)pvHud();
  else{
    hudPanel(12,68,252,28,'#3a2a70',7);
    hudTxt('ВОЛНА',24,87,12,'#9b86d6');hudTxt(String(wave),74,89,18,'#4dd2ff','left',1);
    hudTxt('УБИТО',150,87,12,'#9b86d6');hudTxt(String(score),198,89,18,'#ff5ec4','left',1);
  }
  const hg=pl&&heldGun(pl);
  if(hg){
    const y=PV.on?68:102,am=Math.max(0,hg.am|0),mx=(hg.t.gun&&hg.t.gun.am)|0;
    hudPanel(12,y,252,32,am?'#3a2a70':'#7a2440',7);
    hudTxt((hg.t.nm||'Ружьё').toUpperCase().slice(0,14),24,y+20,13,'#fff');
    if(!am)hudTxt('ПУСТО',254,y+20,13,'#ff5e7a','right');
    else if(mx&&mx<=16){const pw=6,gp=2;let x=254-(mx*(pw+gp)-gp);for(let i=0;i<mx;i++){ctx.fillStyle=i<am?'#ffb23f':'#2a1f55';ctx.fillRect(x+i*(pw+gp),y+9,pw,14);}}
    else if(mx>16)hudBar(150,y+11,104,10,Math.min(1,am/mx),0,'#ffb23f');
    else hudTxt(String(am),254,y+21,15,'#ffb23f','right',1);
  }
}
function hudHint(){
  if(TOUCH||!SET.hint||pl.dead||t0>=10)return;
  const a=Math.min(1,(10-t0)/1.2,.2+t0);
  const it=[[['A','D'],'ХОД'],[['W'],'ПРЫЖОК'],[['J'],'УДАР'],[['K'],'ПИНОК'],[['S'],'ПРИСЕД'],[['L'],'БЛОК'],[['ESC'],'МЕНЮ']];
  ctx.font='700 11px '+UF;
  const kw=k=>Math.max(22,ctx.measureText(k).width+12);
  let tw=0;const wd=it.map(([ks,lb])=>{const w=ks.reduce((s,k)=>s+kw(k)+3,0)+ctx.measureText(lb).width+6;tw+=w+16;return w;});
  tw-=16;let x=(W-tw)/2;const y=H-34;
  ctx.globalAlpha=a;hudPanel(x-12,y-8,tw+24,34,'#3a2a70',8);
  it.forEach(([ks,lb],i)=>{let cx=x;
    for(const k of ks){const w=kw(k);cutP(cx,y-2,w,22,4);ctx.fillStyle='#2a1a66';ctx.fill();ctx.strokeStyle='#8a5cff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='700 11px '+UF;ctx.fillText(k,cx+w/2,y+13);cx+=w+3;}
    ctx.textAlign='left';ctx.fillStyle='#cdbfff';ctx.font='700 11px '+UF;ctx.fillText(lb,cx+3,y+13);x+=wd[i]+16;});
  ctx.globalAlpha=1;
}
function hudWaveBanner(){
  if(PV.on||UI.open)return;
  if(wave!==UI.wa.w)UI.wa={w:wave,t:performance.now()};
  if(wave<1)return;
  const age=(performance.now()-UI.wa.t)/1000;if(age>2.2)return;
  const a=age<1.5?1:1-(age-1.5)/.7,s=1+Math.max(0,.35-age)*1.4;
  ctx.save();ctx.globalAlpha=Math.max(0,a);ctx.translate(W/2,H*.3);ctx.scale(s,s);ctx.textAlign='center';ctx.font='700 58px '+PXF;ctx.lineJoin='round';ctx.lineWidth=10;ctx.strokeStyle='#2a1a66';ctx.strokeText('ВОЛНА '+wave,0,0);ctx.fillStyle='#fff';ctx.fillText('ВОЛНА '+wave,0,0);ctx.restore();
}
function drawOver(){if(PV.on){pvOver();return;}
  if(allDead()){ctx.fillStyle='rgba(7,4,15,.55)';ctx.fillRect(0,0,W,H);}
  else if(pl.dead)hudBanner('ТЫ ВЫБЫЛ','вернёшься со следующей волной','#9b86d6',70);
}
function drawNetHud(){
  if(NET.on){const age=performance.now()-NET.lastRx;
    if(NET.peerHid||age>1500){ctx.fillStyle='rgba(7,4,15,.6)';ctx.fillRect(0,0,W,H);
      hudBanner(NET.peerHid?'ДРУГ СВЕРНУЛ ИГРУ':'НЕТ СВЯЗИ С ДРУГОМ',NET.peerHid?'Пауза, пока он не вернётся':'Ждём ответа ('+(age/1000|0)+' с)','#ffb23f',H/2-30);}
    const t=(NET.role=='host'?'ХОСТ · ИГРОКОВ '+(PEERS.length+1):'ГОСТЬ')+' · '+NET.rtt+' МС';
    ctx.font='700 11px '+UF;const w=ctx.measureText(t).width+34,x=TOUCH?(W-w)/2:W-w-14,y=H-30;
    hudPanel(x,y,w,22,'#3a2a70',6);ctx.fillStyle='#5dff8a';ctx.fillRect(x+10,y+8,6,6);hudTxt(t,x+24,y+15,11,'#c8ffdc');}
  if(performance.now()<NET.msgT){ctx.font='700 15px '+UF;const w=ctx.measureText(NET.msg).width+44,x=(W-w)/2,y=H-92;
    hudPanel(x,y,w,34,'#a56bff',9);hudTxt(NET.msg,W/2,y+22,15,'#fff','center');}
}
function drawWait(){ctx.fillStyle='#0e0820';ctx.fillRect(0,0,W,H);hudTxt('ПОДКЛЮЧЕНИЕ К ХОСТУ'+'.'.repeat(1+((performance.now()/400)|0)%3),W/2-150,H/2,26,'#fff','left',1);hudTxt('Подожди пару секунд',W/2,H/2+30,14,'#9b86d6','center');}
/* ================= соединение: авто-поиск / сервер / коды ================= */
const LB={ws:null,st:'',rooms:[],hosting:0,myId:0};
const AU={topic:'',es:null,st:'',rooms:new Map(),hosting:null,hes:null,tm:0,ann:0,seen:new Set(),busy:0,joining:0,ans:null};
let TAB=1,ERR='';
const $=id=>document.getElementById(id);
const inNet=e=>!!(e.target&&e.target.closest&&e.target.closest('#net'))||uiBusy();
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
const isWeb=()=>/^https?:$/.test(location.protocol);
const myName=()=>{const e=$('sn');return((e&&e.value.trim())||lsGet('sfName')||'Игрок').slice(0,16);};
function onConnected(pe){
  pe.on=1;pe.lastRx=performance.now();NP=null;qrReset();
  for(const id of ['hc','ha','gc','ga']){const e=$(id);if(e)e.value='';}
  if(pe.role=='host'){
    const first=!(NET.on&&NET.role=='host');
    PEERS.push(pe);
    if(first){NET.on=true;NET.role='host';NET.peerHid=0;wake();NET.lastRx=NET.lastSend=performance.now();}
    NET.pend=null;ERR='';AU.busy=0;AU.joining=0;AU.quick=0;AU.qtry=0;
    addPeerChar(pe);setMsg((pe.name||'Друг')+' подключился!');connSave('host',pe.name||'Друг');
    for(const k in K)K[k]=0;
    if(PEERS.length>=MAXP-1){autoStop();updNet();togNet(0);}else{updNet();if(AU.an&&AU.hosting)AU.an();}
  }else{
    NET.hp=pe;NET.rel=pe.rel;NET.fast=pe.fast;NET.on=true;NET.role='guest';NET.peerHid=0;wake();NET.lastRx=NET.lastSend=performance.now();NET.pend=null;ERR='';AU.quick=0;AU.qtry=0;
    autoStop();
    GS={q:[],cur:0,int:50,gen:-1,seed:-1,evq:[],rt:0,ej:0,ep:0,ek:0,ed:0,dd:0,sn:0,lk:'',lin:0};GC.clear();GIM.clear();pl=null;ch=[];items=[];parts=[];setMsg('Подключено к хосту');connSave('guest',NET.peerName||'Хост');
    for(const k in K)K[k]=0;
    updNet();togNet(0);
  }
}
function netLost(msg){
  const was=NET.role;
  try{NET.ws&&NET.ws.close();}catch(e){}
  if(NET.hp){NET.hp.on=0;try{NET.hp.pc&&NET.hp.pc.close();}catch(e){}}
  for(const pe of PEERS.splice(0)){pe.on=0;try{pe.pc&&pe.pc.close();}catch(e){}}
  rtcClean();
  NET.ws=NET.hp=NET.sp=null;NET.rel=NET.fast=null;NET.on=false;NET.peerHid=0;NET.role='solo';NET.pend=null;EV=[];
  if(was=='guest'){GS.q=[];GC.clear();GIM.clear();PV.on=0;PV.fb=0;init();}else if(was=='host'){ch=ch.filter(c=>!c.net);if(pl)pl.nm=null;}
  setMsg(msg);updNet();
  if(was=='guest'){UI.started=0;uiShow('main');}
}
function peerLost(pe,msg){
  const i=PEERS.indexOf(pe);if(i<0)return;pe.on=0;PEERS.splice(i,1);try{pe.pc&&pe.pc.close();}catch(e){}
  dropPeerChar(pe);
  if(!PEERS.length){try{NET.ws&&NET.ws.close();}catch(e){}NET.ws=NET.sp=null;NET.on=false;NET.role='solo';NET.peerHid=0;EV=[];if(pl)pl.nm=null;}
  else NET.peerHid=PEERS.every(p=>p.hid)?1:0;
  setMsg(msg);updNet();
}
function peerDown(pe,msg){if(!pe.on)return;if(pe.role=='host')peerLost(pe,(pe.name||'Друг')+': '+msg);else netLost(msg);}
/* ---------- WebRTC ---------- */
function peerNew(){return{id:++peerSeq,role:NET.pendRole,name:NET.peerName||'',pc:null,rel:null,fast:null,pl:null,slot:null,rip:{mx:0,ay:0},ej:null,ep:null,ek:null,ed:null,inN:-1,rtt:0,lastRx:performance.now(),hid:0,on:0};}
function rtcClean(){if(NP&&!NP.on){try{NP.pc&&NP.pc.close();}catch(e){}}NP=null;}
function chk(pe){if(pe===NP&&pe.rel&&pe.fast&&pe.rel.readyState=='open'&&pe.fast.readyState=='open'&&!pe.on)onConnected(pe);}
function bindCh(d,pe){d.onopen=()=>chk(pe);d.onmessage=e=>{try{onMsg(JSON.parse(e.data),pe)}catch(x){}};d.onclose=()=>{if(pe.on)peerDown(pe,'Соединение закрыто');};chk(pe);}
function newPC(pe){const pc=new RTCPeerConnection({iceServers:(TAB==5||QR.net)?[{urls:['stun:stun.l.google.com:19302','stun:stun.cloudflare.com:3478','stun:stun.nextcloud.com:3478']}]:[]});
  pc.onconnectionstatechange=()=>{if(pc!==pe.pc)return;if(pc.connectionState=='failed'){if(pe.on)peerDown(pe,'Соединение потеряно');else{ERR=TAB==5?'Не удалось соединиться напрямую (у одного из вас строгий NAT или мобильный интернет). Попробуйте Wi‑Fi или другую комнату.':'Не удалось соединиться напрямую. Проверьте, что оба устройства в одной Wi‑Fi сети (без «изоляции клиентов» в роутере).';AU.busy=0;AU.joining=0;if(NP===pe)rtcClean();else{try{pc.close();}catch(e){}}updNet();quickRetry();}}};
  return pc;}
const gathered=pc=>new Promise(r=>{if(pc.iceGatheringState=='complete')return r();const f=()=>{if(pc.iceGatheringState=='complete'){pc.removeEventListener('icegatheringstatechange',f);r();}};pc.addEventListener('icegatheringstatechange',f);setTimeout(r,3000);});
async function rtcOffer(){rtcClean();const pe=peerNew();NP=pe;const pc=newPC(pe);pe.pc=pc;pe.rel=pc.createDataChannel('r');pe.fast=pc.createDataChannel('f',{ordered:false,maxRetransmits:0});bindCh(pe.rel,pe);bindCh(pe.fast,pe);
  await pc.setLocalDescription(await pc.createOffer());await gathered(pc);return pc.localDescription.sdp;}
async function rtcAnswer(sdp){rtcClean();const pe=peerNew();NP=pe;const pc=newPC(pe);pe.pc=pc;
  pc.ondatachannel=e=>{const d=e.channel;if(d.label=='r')pe.rel=d;else pe.fast=d;bindCh(d,pe);};
  await pc.setRemoteDescription({type:'offer',sdp});await pc.setLocalDescription(await pc.createAnswer());await gathered(pc);return pc.localDescription.sdp;}
async function rtcFinish(sdp){const pe=NP;if(!pe||!pe.pc||pe.pc.signalingState!='have-local-offer')return false;pe.name=NET.peerName||pe.name;await pe.pc.setRemoteDescription({type:'answer',sdp});return true;}
/* ---------- АВТО-поиск (ntfy.sh только для обмена служебными сообщениями) ---------- */
const NT='https://ntfy.sh/';
function h53(s){let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677);}
  a=Math.imul(a^a>>>16,2246822507)^Math.imul(b^b>>>13,3266489909);b=Math.imul(b^b>>>16,2246822507)^Math.imul(a^a>>>13,3266489909);return(4294967296*(2097151&b)+(a>>>0)).toString(36);}
const rtopic=id=>'sfc1r-'+id+'-'+h53(AU.topic+id);
function sse(topic,since,fn,onerr){const es=new EventSource(NT+topic+'/sse'+(since?'?since='+since:''));
  es.addEventListener('message',e=>{try{fn(JSON.parse(JSON.parse(e.data).message));}catch(x){}});if(onerr)es.onerror=onerr;return es;}
const pub=(topic,o)=>fetch(NT+topic,{method:'POST',body:JSON.stringify(o)});
async function autoOpen(){
  if((NET.on&&NET.role!='host')||AU.es||AU.st=='conn')return;
  AU.st='conn';ERR='';updNet();
  const on=TAB==5,we=$(on?'or':'ar'),w=((we&&we.value)||'').trim().toLowerCase();let ip='';AU.online=on;AU.word=w;
  if(!w&&!on){try{ip=(await (await fetch('https://api.ipify.org?format=json')).json()).ip;}catch(e){}}
  if(!ip&&!w&&!on){AU.st='';ERR='Не удалось найти сеть (нет интернета?). Введите общее слово комнаты ниже или выберите способ «Коды» / «QR».';updNet();return;}
  AU.topic=on?'sfc1o-'+h53('net|'+w):'sfc1-'+h53(ip+'|'+w);
  AU.es=sse(AU.topic,'45s',m=>{
    if(m.k=='room'&&m.id){AU.rooms.set(m.id,{id:m.id,name:m.name,n:m.n|0,mx:m.mx|0,lk:m.lk|0,seen:Date.now()});updNet();tieBreak();}
    else if(m.k=='gone'){AU.rooms.delete(m.id);updNet();}
  },()=>{if(AU.st!='open'){ERR='Нет связи с сервисом поиска (ntfy.sh). Нужен интернет на обоих устройствах — или используйте «Свой сервер» / «Коды».';updNet();}});
  AU.es.onopen=()=>{AU.st='open';ERR='';updNet();if(AU.quick)setTimeout(quickDecide,1800);};
  AU.tm=setInterval(()=>{const t=Date.now();let ch_=0;for(const[k,r]of AU.rooms)if(t-r.seen>45000){AU.rooms.delete(k);ch_=1;}if(ch_)updNet();},4000);
}
function autoClose(){AU.quick=0;AU.qtry=0;clearTimeout(AU.hostT);autoStop();try{AU.es&&AU.es.close();}catch(e){}clearInterval(AU.tm);AU.es=null;AU.st='';AU.rooms.clear();}
function autoStop(){ // остановить поиск/анонсы (при соединении или отмене)
  clearInterval(AU.ann);try{AU.hes&&AU.hes.close();AU.ans&&AU.ans.close();}catch(e){}
  if(AU.hosting&&AU.topic)pub(AU.topic,{k:'gone',id:AU.hosting.id}).catch(()=>{});
  AU.hosting=null;AU.hes=null;AU.ans=null;AU.busy=0;AU.joining=0;
  if(NET.on){try{AU.es&&AU.es.close();}catch(e){}clearInterval(AU.tm);AU.es=null;AU.st='';AU.rooms.clear();}
}
function autoHost(){
  if(!AU.es||AU.hosting||(NET.on&&NET.role!='host'))return;
  const id=Math.random().toString(36).slice(2,8);AU.hosting={id};AU.seen=new Set();
  AU.hes=sse(rtopic(id),'25s',async m=>{
    if(m.k!='offer'||(NET.on&&NET.role!='host')||AU.busy||AU.seen.has(m.g))return;AU.seen.add(m.g);AU.busy=1;
    NET.pendRole='host';NET.peerName=m.name||'';NET.myName=myName();
    try{const sdp=await rtcAnswer(m.sdp);await pub(rtopic(id)+'-'+m.g,{k:'answer',sdp});}catch(e){AU.busy=0;ERR='Ошибка: '+e.message;updNet();return;}
    const myp=NP;setTimeout(()=>{if(myp&&!myp.on&&AU.busy){AU.busy=0;if(NP===myp)rtcClean();else{try{myp.pc.close();}catch(e){}}}},20000);
  });
  const an=()=>pub(AU.topic,{k:'room',id,name:myName(),n:PEERS.length+1,mx:MAXP,lk:AU.word?1:0}).catch(()=>{});AU.an=an;an();AU.ann=setInterval(an,15000);
  clearTimeout(AU.hostT);AU.hostT=setTimeout(()=>{if(AU.hosting&&AU.hosting.id==id){const alone=!PEERS.length;autoUnhost();AU.quick=0;if(alone)ERR='Никто не подключился за 12 минут — комната закрыта.';updNet();}},720000);updNet();
}
function autoUnhost(){clearInterval(AU.ann);clearTimeout(AU.hostT);try{AU.hes&&AU.hes.close();}catch(e){}if(AU.hosting)pub(AU.topic,{k:'gone',id:AU.hosting.id}).catch(()=>{});AU.hosting=null;AU.hes=null;AU.busy=0;rtcClean();updNet();}
async function autoJoin(id,name){
  if(AU.joining||NET.on||AU.hosting)return;AU.joining=1;AU.lastJoin=id;ERR='';updNet();
  const g=Math.random().toString(36).slice(2,8),rt=rtopic(id);let done=0;
  const fail=m=>{if(done>1)return;done=2;AU.joining=0;try{AU.ans&&AU.ans.close();}catch(e){}rtcClean();ERR=m;updNet();quickRetry();};
  AU.ans=sse(rt+'-'+g,'30s',async m=>{if(m.k=='answer'&&!done){done=1;try{AU.ans.close();await rtcFinish(m.sdp);}catch(e){fail('Ошибка: '+e.message);}}});
  NET.pendRole='guest';NET.peerName=name||'';NET.myName=myName();
  try{const sdp=await rtcOffer();await pub(rt,{k:'offer',g,name:myName(),sdp});}catch(e){fail('Ошибка: '+e.message);return;}
  setTimeout(()=>{if(!NET.on&&AU.joining&&done<2){done=0;fail('Хост не ответил. Возможно, он закрыл игру — обновите список.');}},20000);
}
/* ---------- ⚡ быстрая онлайн-игра: сама находит открытую комнату или создаёт свою ---------- */
function quickPlay(){
  if(NET.on||AU.joining||AU.hosting)return;
  lsSet('sfName',myName());AU.quick=1;AU.qtry=0;ERR='';
  const e=$('or'),w=((e&&e.value)||'').trim().toLowerCase();
  if(AU.es&&AU.topic!=='sfc1o-'+h53('net|'+w)){const q=AU.quick;autoClose();AU.quick=q;}
  if(AU.es&&AU.st=='open')quickDecide();else if(!AU.es)autoOpen();
  updNet();
}
function quickDecide(){
  if(!AU.quick||NET.on||AU.joining||AU.hosting)return;
  const rs=[...AU.rooms.values()].filter(r=>!(r.mx&&r.n>=r.mx)).sort((a,b)=>(b.n|0)-(a.n|0)||(a.id<b.id?-1:1));
  if(rs.length)autoJoin(rs[0].id,rs[0].name);else autoHost();
  updNet();
}
function tieBreak(){ // если двое нажали одновременно и оба создали комнату — остаётся комната с меньшим id, второй заходит в неё
  if(!AU.quick||!AU.hosting||NET.on||AU.busy||PEERS.length)return;
  const o=[...AU.rooms.values()].filter(r=>r.id<AU.hosting.id&&!(r.mx&&r.n>=r.mx)).sort((a,b)=>a.id<b.id?-1:1)[0];
  if(o){autoUnhost();autoJoin(o.id,o.name);}
}
function quickRetry(){
  if(!AU.quick||NET.on||AU.hosting||AU.joining)return;
  if((AU.qtry=(AU.qtry|0)+1)>=4){AU.quick=0;updNet();return;}
  if(AU.lastJoin)AU.rooms.delete(AU.lastJoin);
  setTimeout(quickDecide,700);
}
function quickCancel(){AU.quick=0;AU.qtry=0;if(AU.hosting)autoUnhost();else{AU.joining=0;try{AU.ans&&AU.ans.close();}catch(e){}rtcClean();}ERR='';updNet();}
/* ---------- «Свой сервер» (node server.js) ---------- */
function lobbyOpen(){
  if(NET.on||(LB.ws&&LB.ws.readyState<2))return;
  const e=$('sa'),a=(e&&e.value.trim())||(isWeb()?location.host:'');
  if(!a){LB.st='';updNet();return;}
  let ws;try{ws=new WebSocket((location.protocol=='https:'&&a==location.host?'wss://':'ws://')+a+'/ws');}catch(x){ERR='Неверный адрес сервера';updNet();return;}
  LB.ws=ws;LB.st='conn';LB.rooms=[];updNet();
  ws.onopen=()=>{LB.st='open';ERR='';lsSet('sfAddr',a);ws.send(JSON.stringify({t:'list'}));updNet();};
  ws.onmessage=ev=>{
    let m;try{m=JSON.parse(ev.data);}catch(x){return;}
    if(NET.on&&NET.ws===ws){onMsg(m,NET.sp);return;}
    if(m.t=='rooms'){LB.rooms=m.rooms;updNet();}
    else if(m.t=='hosting'){LB.myId=m.id;LB.hosting=1;updNet();}
    else if(m.t=='err'){ERR=m.m;updNet();}
    else if(m.t=='paired')startGame(ws,m.role,m.peer);
  };
  ws.onerror=()=>{if(LB.ws===ws){ERR='Не удалось подключиться к серверу '+a+'. Запущен ли он и в той же ли вы Wi‑Fi сети?';updNet();}};
  ws.onclose=()=>{
    if(NET.on&&NET.ws===ws){netLost('Соединение закрыто');return;}
    if(LB.ws===ws){LB.ws=null;LB.hosting=0;LB.st='';LB.rooms=[];updNet();const p=$('net');if(p&&!p.hidden&&!NET.on&&TAB==2)setTimeout(lobbyOpen,2000);}
  };
}
function startGame(ws,role,peer){
  const w={get readyState(){return ws.readyState==1?'open':'closed'},get bufferedAmount(){return ws.bufferedAmount},send:m=>ws.send(m),close(){}};
  NET.ws=ws;NET.pendRole=role;NET.peerName=peer||'';NET.myName=myName();LB.ws=null;LB.hosting=0;LB.rooms=[];
  const pe=peerNew();pe.rel=pe.fast=w;NET.sp=pe;onConnected(pe);
}
function lobbySend(o){if(LB.ws&&LB.ws.readyState==1){o.name=myName();LB.ws.send(JSON.stringify(o));}}
/* ---------- «Коды»: вставил — и всё само ---------- */
const b64u=u=>{let s='';for(const b of u)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
/* ---------- компактный код: из SDP берём только нужное (≈100–250 байт вместо ≈600–1500), чтобы хватало одного QR ---------- */
function ip6b(a){if(!/^[0-9a-fA-F:]+$/.test(a))return null;const h=a.split('::');if(h.length>2)return null;const f=x=>x?x.split(':'):[];
  const A=f(h[0]),B=h.length==2?f(h[1]):[],n=8-A.length-B.length;if(h.length==1?A.length!=8:n<1)return null;
  const g=[...A,...Array(h.length==2?n:0).fill('0'),...B];if(g.length!=8)return null;const o=[];
  for(const x of g){if(!/^[0-9a-fA-F]{1,4}$/.test(x))return null;const v=parseInt(x,16);o.push(v>>8,v&255);}return o;}
function candPack(l){
  const m=/^a=candidate:\S+ 1 udp (\d+) (\S+) (\d+) typ host(?: .*)?$/i.exec(l);if(!m||/raddr|tcptype/i.test(l))return null;
  const pr=+m[1],ad=m[2],pt=+m[3];if(!(pr>=0&&pr<=4294967295&&pt>0&&pt<65536))return null;
  let k,b;const v4=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ad);
  if(v4){b=v4.slice(1).map(Number);if(b.some(x=>x>255))return null;k=0;}
  else if(ad.includes(':')){b=ip6b(ad);if(!b)return null;k=1;}
  else{const u=/^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/i.exec(ad);if(!u)return null;const hx=u.slice(1).join('');b=[];for(let i=0;i<32;i+=2)b.push(parseInt(hx.substr(i,2),16));k=2;}
  return [k,...b,pt>>8,pt&255,pr>>>24&255,pr>>>16&255,pr>>>8&255,pr&255];}
function sdpPack(sdp){ // null, если SDP нетипичный — тогда используется обычный (длинный) код
  const L=String(sdp).split(/\r?\n/).filter(Boolean);let uf=null,pw=null,fp=null,su=-1,mid=null,sp=null,ml=0;const cs=[];
  for(const l of L){
    if(l.startsWith('m=')){ml++;if(!/^m=application \d+ UDP\/DTLS\/SCTP webrtc-datachannel/.test(l))return null;}
    else if(l.startsWith('a=ice-ufrag:'))uf=l.slice(12);
    else if(l.startsWith('a=ice-pwd:'))pw=l.slice(10);
    else if(l.startsWith('a=fingerprint:')){const m=/^a=fingerprint:sha-256 ((?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2})$/.exec(l);if(!m)return null;fp=m[1].split(':').map(h=>parseInt(h,16));}
    else if(l.startsWith('a=setup:'))su=['actpass','active','passive'].indexOf(l.slice(8));
    else if(l.startsWith('a=mid:'))mid=l.slice(6);
    else if(l.startsWith('a=sctp-port:'))sp=l.slice(12);
    else if(l.startsWith('a=candidate:')){const c=candPack(l);if(!c)return null;cs.push(c);}
    else if(l.startsWith('a=ice-lite'))return null;}
  if(ml!=1||!uf||!pw||!fp||su<0||mid!='0'||sp!='5000'||!cs.length||cs.length>12)return null;
  if(!/^[\x21-\x7e]{1,255}$/.test(uf)||!/^[\x21-\x7e]{1,255}$/.test(pw))return null;
  const b=[uf.length,...[...uf].map(c=>c.charCodeAt(0)),pw.length,...[...pw].map(c=>c.charCodeAt(0)),...fp,cs.length];for(const c of cs)b.push(...c);
  return{su,b};}
function sdpDecode(u){let i=0;const rd=()=>{if(i>=u.length)throw new Error('Код обрезан — скопируйте/отсканируйте его целиком');return u[i++];};
  const hdr=rd();if((hdr>>4)!=1)throw new Error('Неизвестная версия кода — обновите игру на обоих устройствах');
  const ans=hdr&1,su=(hdr>>1)&3;if(su>2)throw new Error('Неверный код');
  const str=()=>{const n=rd();let t='';for(let k=0;k<n;k++)t+=String.fromCharCode(rd());return t;};
  const uf=str(),pw=str(),fp=[];for(let k=0;k<32;k++)fp.push(rd().toString(16).padStart(2,'0').toUpperCase());
  const nc=rd(),cs=[];
  for(let k=0;k<nc;k++){const kd=rd();let ad;
    if(kd==0)ad=[rd(),rd(),rd(),rd()].join('.');
    else if(kd==1||kd==2){const b=[];for(let j=0;j<16;j++)b.push(rd());
      if(kd==1){const g=[];for(let j=0;j<16;j+=2)g.push(((b[j]<<8)|b[j+1]).toString(16));ad=g.join(':');}
      else{const h=b.map(x=>x.toString(16).padStart(2,'0')).join('');ad=h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)+'.local';}}
    else throw new Error('Неверный код');
    const pt=(rd()<<8)|rd(),pr=rd()*16777216+(rd()<<16)+(rd()<<8)+rd();
    cs.push('a=candidate:'+(k+1)+' 1 udp '+pr+' '+ad+' '+pt+' typ host generation 0');}
  const nm=new TextDecoder().decode(u.slice(i));
  const sdp=['v=0','o=- '+(1e9+Math.floor(Math.random()*9e9))+' 2 IN IP4 127.0.0.1','s=-','t=0 0','a=group:BUNDLE 0','m=application 9 UDP/DTLS/SCTP webrtc-datachannel','c=IN IP4 0.0.0.0',...cs,
    'a=ice-ufrag:'+uf,'a=ice-pwd:'+pw,'a=fingerprint:sha-256 '+fp.join(':'),'a=setup:'+['actpass','active','passive'][su],'a=mid:0','a=sctp-port:5000','a=max-message-size:262144'].join('\r\n')+'\r\n';
  return{t:ans?'a':'o',s:sdp,n:nm};}
function sdpEnc(o){try{if(!o||(o.t!='o'&&o.t!='a'))return null;const k=sdpPack(o.s);if(!k)return null;
  const nm=new TextEncoder().encode(String(o.n||'')),b=new Uint8Array(1+k.b.length+nm.length);
  b[0]=0x10|(o.t=='a'?1:0)|(k.su<<1);b.set(k.b,1);b.set(nm,1+k.b.length);
  const code='c'+b64u(b),back=sdpDecode(unb64u(code.slice(1))),re=sdpPack(back.s); // самопроверка: распаковка должна дать то же самое
  if(!re||re.su!=k.su||re.b.join()!=k.b.join()||back.n!=String(o.n||'')||back.t!=o.t)return null;
  return code;}catch(e){return null;}}
async function pipeS(u,C,f){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new C(f))).arrayBuffer());}
async function enc(o){const cc=sdpEnc(o);if(cc)return cc;const u=new TextEncoder().encode(JSON.stringify(o));if(window.CompressionStream){try{const z=await pipeS(u,CompressionStream,'deflate');if(z.length<u.length)return 'd'+b64u(z);}catch(e){}}return 'r'+b64u(u);}
async function decBody(s){if(s[0]=='c')return sdpDecode(unb64u(s.slice(1)));let u=unb64u(s.slice(1));
  if(s[0]=='d'||s[0]=='z'){if(!window.DecompressionStream)throw new Error('Этот браузер не умеет распаковывать код. Откройте игру в Chrome/Safari');try{u=await pipeS(u,DecompressionStream,s[0]=='d'?'deflate':'deflate-raw');}catch(e){throw new Error('Код повреждён или обрезан — скопируйте его целиком');}}
  else if(s[0]!='r')throw new Error('Неверный код');return JSON.parse(new TextDecoder().decode(u));}
async function dec(s){s=String(s);const re=/SF[A-Za-z0-9_\-]{30,}/g,c=[...(s.match(re)||[]).sort((x,y)=>y.length-x.length)];
  const w=s.replace(/\s+/g,'');for(const m of (w.match(re)||[]).sort((x,y)=>y.length-x.length))if(!c.includes(m))c.push(m);
  if(!c.length){const f=w.replace(/[^A-Za-z0-9_\-]/g,'');if(f.length<30)throw new Error('Код не найден в вставленном тексте');for(const p of ['d','z'])c.push('SF'+p+f);}
  let err=null;for(const x of c){try{return await decBody(x.slice(2));}catch(e){err=e;}}throw err||new Error('Неверный код');}
async function copyTxt(t){try{await navigator.clipboard.writeText(t);return true;}catch(e){}try{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();return ok;}catch(e){return false;}}
async function codeHost(){ERR='';$('hc').value='Готовлю код…';try{NET.pendRole='host';NET.myName=myName();NET.pend='host';const sdp=await rtcOffer();const c='SF'+await enc({t:'o',s:sdp,n:myName()});$('hc').value=c;const ok=await copyTxt(c);setMsg(ok?'Код скопирован — отправьте его другу':'Скопируйте код вручную');}catch(e){$('hc').value='';ERR='Ошибка: '+e.message;}updNet();}
async function codeHostFinish(){const v=$('ha').value;if(v.replace(/\s/g,'').length<30)return;ERR='';
  try{if(NET.pend!='host')throw new Error('Сначала нажмите «Создать код» и отправьте его другу');const o=await dec(v);if(o.t!='a')throw new Error('Это не ответный код — нужен код от друга');NET.peerName=o.n||'';await rtcFinish(o.s);}catch(e){ERR='Ошибка: '+e.message;}updNet();}
async function codeGuest(){const v=$('gc').value;if(v.replace(/\s/g,'').length<30)return;ERR='';$('ga').value='Готовлю ответ…';
  try{const o=await dec(v);if(o.t!='o')throw new Error('Это не код хоста — нужен код от создателя игры');NET.pendRole='guest';NET.myName=myName();NET.peerName=o.n||'';NET.pend='guest';
    const sdp=await rtcAnswer(o.s);const c='SF'+await enc({t:'a',s:sdp,n:myName()});$('ga').value=c;const ok=await copyTxt(c);setMsg(ok?'Ответ скопирован — отправьте его хосту':'Скопируйте ответ вручную');}
  catch(e){$('ga').value='';ERR='Ошибка: '+e.message;}updNet();}

/* ---------- «QR»: показать код картинкой / отсканировать камерой (без интернета) ---------- */
const QR={camOK:0,mode:'',cv:null,fr:[],fi:0,tm:0,stream:null,loop:0,got:null,sid:'',cb:null,busy:0};
function qrFrames(code){const n=code.length<=2000?1:Math.ceil(code.length/1500),L=Math.ceil(code.length/n),id=h53(code).slice(0,4),a=[];
  for(let i=0;i<n;i++)a.push('SFQ'+id+'.'+(i+1)+'/'+n+':'+code.slice(i*L,(i+1)*L));return a;}
function qrDraw(cv,text,box){const q=qrcode(0,'L');q.addData(text,'Byte');q.make();const c=q.getModuleCount(),tot=c+8,cell=Math.max(2,Math.floor(box/tot)),d=Math.max(1,Math.round(window.devicePixelRatio||1)),s=cell*d;
  cv.width=cv.height=tot*s;cv.style.width=cv.style.height=tot*cell+'px';const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#000';
  for(let r=0;r<c;r++)for(let k=0;k<c;k++)if(q.isDark(r,k))x.fillRect((k+4)*s,(r+4)*s,s,s);}
function qrFrame(){const n=QR.fr.length;if(!n)return;QR.fi=((QR.fi%n)+n)%n;qrDraw($('qcv'),QR.fr[QR.fi],QR.box);
  $('qinfo').textContent=QR.cap+(n>1?' (кадр '+(QR.fi+1)+' из '+n+(QR.tm?' — сменяются сами, держите камеру на экране':' — листайте кнопками ◀ ▶')+')':'');
  $('qctl').style.display=n>1?'':'none';$('qpz').textContent=QR.tm?'⏸ Остановить смену кадров':'▶ Включить авто-смену';}
function qrAuto(on){clearInterval(QR.tm);QR.tm=0;if(on&&QR.fr.length>1)QR.tm=setInterval(()=>{QR.fi++;qrFrame();},850);qrFrame();}
function qrShow(code,cap){qrStopShow();QR.fr=qrFrames(code);QR.fi=0;QR.cap=cap;QR.box=Math.max(150,Math.min(520,innerWidth*.9,innerHeight*.62));
  qrAuto(true);$('qshow').style.display='';}
function qrStopShow(){clearInterval(QR.tm);QR.tm=0;}
function qrStopScan(){QR.loop=0;if(QR.stream){try{QR.stream.getTracks().forEach(t=>t.stop());}catch(e){}QR.stream=null;}const v=$('qvid');if(v){try{v.pause();}catch(e){}v.srcObject=null;}$('qscan').style.display='none';}
function qrReset(){qrNetStop();QR.net=0;qrStopShow();qrStopScan();QR.mode='';QR.got=null;QR.sid='';QR.cb=null;QR.busy=0;$('qshow').style.display='none';$('q0').style.display='';$('qrow').style.display='none';$('qpr').firstChild.style.width='0';}
function qrFeed(txt){ // принять текст одного QR-кадра; true, когда собрано всё
  const m=/^SFQ([a-z0-9]{1,6})\.(\d+)\/(\d+):([\s\S]+)$/.exec(String(txt).trim());if(!m)return false;
  const id=m[1],i=+m[2],n=+m[3];if(!i||!n||i>n||n>40)return false;
  if(!QR.got||QR.sid!==id||QR.got.n!==n){QR.got={n,p:new Map()};QR.sid=id;}
  QR.got.p.set(i,m[4]);$('qpr').firstChild.style.width=(QR.got.p.size/n*100)+'%';
  {const miss=[];for(let k=1;k<=n;k++)if(!QR.got.p.has(k))miss.push(k);$('qsc').textContent=n>1?'Принято '+QR.got.p.size+' из '+n+(miss.length?(QR.stream?' — продолжайте наводить на экран друга':' — осталось сфотографировать кадры: '+miss.join(', ')):''):'Код считан…';}
  if(QR.got.p.size<n)return false;let s='';for(let k=1;k<=n;k++)s+=QR.got.p.get(k);return s;}
async function qrDone(code){if(QR.busy)return;QR.busy=1;qrStopScan();try{await QR.cb(code);}catch(e){ERR='Ошибка: '+e.message;QR.got=null;QR.sid='';}QR.busy=0;if(ERR&&!QR.camOK&&!NET.on){$('qscan').style.display='';$('qvid').style.display='none';$('qsc').textContent=ERR;}updNet();if(ERR&&QR.camOK&&QR.cb&&!NET.on)setTimeout(()=>{if(QR.cb&&!QR.stream&&!QR.busy)qrScan(QR.cb);},900);}
function qrHandle(txt){const r=qrFeed(txt);if(r)qrDone(r);return !!r;}
async function qrScan(cb){
  QR.cb=cb;QR.got=null;QR.sid='';ERR='';$('qpr').firstChild.style.width='0';$('qsc').textContent='Наведите камеру на QR-код на экране друга';
  $('qscan').style.display='';$('qshow').style.display=(QR.mode=='host'&&NET.pend=='host')?'':'none';
  const hasCam=navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.isSecureContext!==false;
  if(hasCam){
    try{try{QR.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});}catch(e0){if(e0&&e0.name=='NotAllowedError')throw e0;QR.stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});}}
    catch(e){QR.stream=null;ERR=e&&e.name=='NotAllowedError'?'Камера запрещена. Разрешите доступ к камере для этой страницы или нажмите «Сфотографировать QR».':'Камера недоступна ('+((e&&e.name)||'ошибка')+'). Можно нажать «Сфотографировать QR».';}
  }else ERR='Браузер не даёт открыть камеру на этой странице (нужен https или файл на устройстве). Нажмите «Сфотографировать QR».';
  QR.camOK=!!QR.stream;$('qvid').style.display=QR.stream?'':'none';updNet();if(!QR.stream)return;
  const v=$('qvid');v.srcObject=QR.stream;v.setAttribute('playsinline','');v.muted=true;try{await v.play();}catch(e){}
  const cv=document.createElement('canvas'),x=cv.getContext('2d',{willReadFrequently:true});const my=++QR.loop;
  let bd=null;try{if(window.BarcodeDetector)bd=new BarcodeDetector({formats:['qr_code']});}catch(e){bd=null;}let bdBusy=0;
  const tick=()=>{if(QR.loop!==my)return;
    if(v.readyState>=2&&v.videoWidth){const k=Math.min(1,960/v.videoWidth);cv.width=Math.round(v.videoWidth*k);cv.height=Math.round(v.videoHeight*k);x.drawImage(v,0,0,cv.width,cv.height);
      const im=x.getImageData(0,0,cv.width,cv.height),r=jsQR(im.data,im.width,im.height,{inversionAttempts:'dontInvert'});if(r&&r.data&&qrHandle(r.data)&&QR.loop!==my)return;
      if(!(r&&r.data)&&bd&&!bdBusy){bdBusy=1;bd.detect(v).then(a=>{bdBusy=0;if(QR.loop===my&&a&&a[0]&&a[0].rawValue)qrHandle(a[0].rawValue);}).catch(()=>{bdBusy=0;});}}
    setTimeout(tick,70);};
  tick();}
async function qrImg(file){ // открыть фото любым доступным способом (учёт поворота EXIF, запасной путь через <img>)
  let bm=null;
  try{bm=await createImageBitmap(file,{imageOrientation:'from-image'});}catch(e){try{bm=await createImageBitmap(file);}catch(e2){bm=null;}}
  if(!bm){const url=URL.createObjectURL(file);try{bm=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>no(new Error('формат фото не поддерживается — выберите JPEG/PNG'));im.src=url;});}finally{setTimeout(()=>URL.revokeObjectURL(url),8000);}}
  return bm;}
async function qrDecodeBm(bm){ // пробуем несколько масштабов: фото экрана с муаром лучше читается уменьшенным
  const W=bm.width||bm.naturalWidth,H=bm.height||bm.naturalHeight,seen={};
  for(const mx of [1600,1000,2200,700,480]){const k=Math.min(1,mx/Math.max(W,H)),w=Math.max(1,Math.round(W*k)),h=Math.max(1,Math.round(H*k));if(seen[w])continue;seen[w]=1;
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(bm,0,0,w,h);
    const im=x.getImageData(0,0,w,h),r=jsQR(im.data,w,h,{inversionAttempts:'attemptBoth'});if(r&&r.data)return r;
    await new Promise(z=>setTimeout(z,0));}
  if(window.BarcodeDetector){try{const d=new BarcodeDetector({formats:['qr_code']}),a=await d.detect(bm);if(a&&a[0]&&a[0].rawValue)return{data:a[0].rawValue};}catch(e){}}
  return null;}
async function qrPhotos(files){ // запасной путь: снимки вместо живой камеры (можно сразу несколько)
  if(!files||!files.length)return;
  $('qscan').style.display='';const v=$('qvid');if(v&&!QR.stream)v.style.display='none';
  $('qsc').textContent='Читаю фото…';ERR='';
  let found=0,err='';
  for(const f of files){
    try{const bm=await qrImg(f),r=await qrDecodeBm(bm);try{bm.close&&bm.close();}catch(e){}
      if(!r)continue;found++;
      if(!qrHandle(r.data)&&!/^\s*SFQ/.test(String(r.data)))err='Считан посторонний QR — нужен QR с экрана друга.';
      if(QR.busy)break;}
    catch(e){err='Не удалось прочитать фото: '+e.message;}}
  if(!found&&!err)err='QR на фото не найден. Снимите ближе и ровнее, чтобы QR занял почти весь кадр. На экране друга можно остановить смену кадров кнопкой ⏸ и снять каждый кадр по очереди.';
  if(err){ERR=err;$('qsc').textContent=err;}
  updNet();}
/* один QR, как везде: в QR только номер комнаты, обмен служебными данными идёт через интернет (ntfy.sh).
   Если интернета нет — старый способ: друг показывает ответный QR. */
function qrNetStop(){try{QR.nes&&QR.nes.close();}catch(e){}try{QR.gans&&QR.gans.close();}catch(e){}QR.nes=null;QR.gans=null;clearTimeout(QR.ntm);}
function qrNetOk(){return new Promise(r=>{let es;const t=setTimeout(()=>{try{es&&es.close();}catch(e){}r(false);},4500);
  try{es=new EventSource(NT+'sfq-ping-'+Math.random().toString(36).slice(2,8)+'/sse');es.onopen=()=>{clearTimeout(t);es.close();r(true);};es.onerror=()=>{};}catch(e){clearTimeout(t);r(false);}});}
async function qrNetHost(){
  const tp='sfq1-'+Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,8);let busy=0;const seen=new Set();
  const es=sse(tp,'',async m=>{
    if(m.k!='offer'||busy||seen.has(m.g)||(NET.on&&NET.role!='host'))return;seen.add(m.g);busy=1;
    NET.pendRole='host';NET.peerName=m.name||'';NET.myName=myName();NET.pend='host';$('qinfo').textContent='Друг подключается…';
    try{const sdp=await rtcAnswer(m.sdp);await pub(tp+'-'+m.g,{k:'answer',sdp});}catch(e){busy=0;ERR='Ошибка: '+e.message;updNet();return;}
    const myp=NP;setTimeout(()=>{if(myp&&!myp.on){busy=0;if(NP===myp)rtcClean();$('qinfo').textContent=QR.cap;}},20000);
  });
  QR.nes=es;
  await new Promise(r=>{const t=setTimeout(r,4000);es.addEventListener('open',()=>{clearTimeout(t);r();});});
  return 'SFN'+tp+'~'+encodeURIComponent(myName()).slice(0,60);
}
async function qrNetJoin(code){
  const m=/^SFN(sfq1-[a-z0-9]+)~?(.*)$/.exec(code);if(!m)throw new Error('Неверный QR');
  const tp=m[1],g=Math.random().toString(36).slice(2,8);let nm='';try{nm=decodeURIComponent(m[2]||'');}catch(e){}
  NET.pendRole='guest';NET.myName=myName();NET.peerName=nm;NET.pend='guest';QR.mode='guest';QR.net=1;
  $('qscan').style.display='';$('qvid').style.display='none';$('qsc').textContent='QR принят — подключаюсь к игре'+(nm?' «'+nm+'»':'')+'…';
  await new Promise((res,rej)=>{let done=0;
    QR.gans=sse(tp+'-'+g,'',async a=>{if(a.k=='answer'&&!done){done=1;try{QR.gans.close();await rtcFinish(a.sdp);res();}catch(e){rej(e);}}});
    QR.ntm=setTimeout(()=>{if(!done){done=1;rej(new Error('Хост не ответил. Проверьте интернет на обоих устройствах и отсканируйте QR ещё раз.'));}},20000);
    rtcOffer().then(sdp=>pub(tp,{k:'offer',g,name:myName(),sdp})).catch(e=>{if(!done){done=1;rej(e);}});
  });
  $('qsc').textContent='Соединяемся…';
}
async function qrHost(){ // хост: создаёт код и показывает его
  qrReset();ERR='';QR.mode='host';$('q0').style.display='none';
  $('qinfo').textContent='Готовлю QR…';$('qshow').style.display='';
  if(await qrNetOk()){try{NET.pendRole='host';NET.myName=myName();QR.net=1;const c=await qrNetHost();qrShow(c,'Пусть друг нажмёт «Подключиться» и отсканирует этот QR — больше ничего не нужно');$('qrow').style.display='none';updNet();return;}catch(e){qrNetStop();}}
  try{NET.pendRole='host';NET.myName=myName();NET.pend='host';$('qinfo').textContent='Готовлю QR…';$('qshow').style.display='';
    const sdp=await rtcOffer();qrShow('SF'+await enc({t:'o',s:sdp,n:myName()}),'1) Пусть друг нажмёт «Подключиться» и сфотографирует этот QR');$('qph').textContent='📷 Сфотографировать ответ друга';$('qrow').style.display='';}
  catch(e){ERR='Ошибка: '+e.message;qrReset();}updNet();}
const qrHostCb=async s=>{const o=await dec(s);if(o.t!='a')throw new Error('Это не ответный QR — нужен QR, который покажет друг');
  if(NET.pend!='host')throw new Error('Сначала создайте игру');NET.peerName=o.n||'';await rtcFinish(o.s);$('qinfo').textContent='Соединяемся…';};
const qrGuestCb=async s=>{if(/^SFN/.test(s)){await qrNetJoin(s);return;}const o=await dec(s);if(o.t!='o')throw new Error('Это не QR хоста — нужен QR, который показывает создатель игры');
  NET.pendRole='guest';NET.myName=myName();NET.peerName=o.n||'';NET.pend='guest';$('qshow').style.display='';$('qinfo').textContent='Готовлю ответ…';
  const sdp=await rtcAnswer(o.s);qrShow('SF'+await enc({t:'a',s:sdp,n:myName()}),'2) Покажите этот QR хосту: он нажимает «Сфотографировать ответ друга»');};
function qrGuest(){qrReset();QR.mode='guest';$('q0').style.display='none';$('qph').textContent='📷 Сфотографировать QR хоста';$('qrow').style.display='';$('qfile').click();}
/* ---------- интерфейс ---------- */
function pErr(t){const e=$('ner');if(e)e.textContent=t||'';}
function togNet(v){const p=$('net');if(!p)return;const show=v===undefined?p.hidden:!!v;p.hidden=!show;if(!show)qrStopScan();if(show){for(const k in K)K[k]=0;for(const k in T)T[k]=0;updNet();if(!NET.on)openTab();}}
function openTab(){if(TAB==1||TAB==5)autoOpen();else if(TAB==2)lobbyOpen();}
function setTab(t){if(t==2)t=1;if(TAB==4&&t!=4)qrReset();const sw=(TAB==5)!=(t==5);TAB=t;lsSet('sfTab',t);ERR='';if(sw&&!NET.on)autoClose();for(let i=1;i<=5;i++){{const pp=$('p'+i),tb=$('t'+i);if(pp)pp.style.display=i==t?'':'none';if(tb)tb.className=i==t?'ac':'';}}updNet();if(!NET.on)openTab();}
function rooms(el,list,self){el.textContent='';const rs=list.filter(r=>r.id!==self&&!(r.mx&&r.n>=r.mx));
  if(!rs.length){const d=document.createElement('p');d.className='em';d.textContent='Пока игр нет. Создай свою — друг увидит её здесь.';el.appendChild(d);}
  for(const r of rs){const row=document.createElement('div');row.className='rm';const s=document.createElement('span');s.textContent=(r.lk?'🔒 ':'🎮 ')+r.name+(r.n?' · '+r.n+'/'+r.mx:'');const b=document.createElement('button');b.className='pr';b.textContent='Играть';b.dataset.id=r.id;b.dataset.name=r.name;row.append(s,b);el.appendChild(row);}return rs.length;}
function updNet(){
  const st=$('nst');if(!st)return;
    let t;
  if(NET.on){st.className='st ok';t=NET.role=='host'?'✅ Вы — хост. Игроков: '+(PEERS.length+1)+' из '+MAXP+' ('+PEERS.map(p=>p.name||'Друг').join(', ')+')'+(PEERS.length<MAXP-1?'. Можно добавить ещё.':'. Комната заполнена.'):'✅ Подключено (вы — гость), пинг '+NET.rtt+' мс';}
  else{st.className='st';
    if(TAB==1)t=AU.hosting?'Игра создана — ждём друга…':AU.joining?'Подключаюсь…':AU.st=='open'?'Ищем игры в вашей сети… (выберите из списка)':AU.st=='conn'?'Подключаюсь к сервису поиска…':'Поиск не запущен';
    else if(TAB==2)t=LB.hosting?'Игра создана — ждём друга…':LB.st=='open'?'Сервер найден. Выберите игру или создайте свою.':LB.st=='conn'?'Подключаюсь к серверу…':'Нет подключения к серверу';
    else if(TAB==5)t=AU.hosting?'Комната создана — ждём игроков…':AU.joining?'Подключаюсь…':AU.quick?'Ищем игру…':AU.st=='open'?'Онлайн. Нажми «Играть онлайн» или выбери комнату':AU.st=='conn'?'Подключаюсь к сервису поиска…':'Поиск не запущен';
    else if(TAB==4)t=QR.net&&QR.mode=='host'&&NET.pend!='host'?'Пусть друг отсканирует QR — подключение начнётся само':NET.pend=='host'?'Покажите QR другу, затем сфотографируйте его ответ':NET.pend=='guest'?'Покажите ответный QR хосту — подключение начнётся само':QR.mode=='guest'?'Сфотографируйте QR на экране хоста':'Выберите: создать игру или подключиться';
    else t=NET.pend=='host'?'Ждём ответный код от друга…':NET.pend=='guest'?'Отправьте ответный код хосту — подключение начнётся само':'Обменяйтесь кодами (по одному в каждую сторону)';}
  st.textContent=t;st.classList.toggle('bz',!NET.on&&/…$/.test(t));pErr(NET.on?'':ERR);
  const an=rooms($('arl'),[...AU.rooms.values()],AU.hosting&&AU.hosting.id);{const c=$('nac');if(c)c.textContent=an?an:'';}
  const sn_=rooms($('rl'),LB.rooms,LB.myId);
  {const on_=rooms($('orl'),[...AU.rooms.values()],AU.hosting&&AU.hosting.id),c=$('onc');if(c)c.textContent=on_?on_:'';const bz=!!(AU.quick||AU.hosting||AU.joining);$('oq').style.display=bz?'none':'';$('oc').style.display=bz?'':'none';}
  $('nsetup').style.display=(NET.on&&!(NET.role=='host'&&PEERS.length<MAXP-1))?'none':'';
  $('nplay').style.display=NET.on&&NET.role=='host'?'':'none';$('qh').textContent=NET.on&&NET.role=='host'?'➕ Добавить игрока (показать QR)':'Создать игру (показать QR)';$('qg').style.display=NET.on?'none':'';
  $('ahost').style.display=AU.hosting?'none':'';$('ahost').disabled=AU.st!='open'||!!AU.joining;$('aunh').style.display=AU.hosting?'':'none';
  $('srvrow').style.display=LB.st=='open'?'none':'';
  $('shost').style.display=LB.hosting?'none':'';$('shost').disabled=LB.st!='open';$('sunh').style.display=LB.hosting?'':'none';
  $('ndis').style.display=NET.on?'':'none';
  const n=NET.on?0:(an+sn_);$('nbtn').textContent=n&&!AU.hosting&&!LB.hosting?'👥'+n:'👥';$('nbtn').className=NET.on?'on':'';{const mb=$('mbtn');if(mb){mb.style.display=NET.role=='guest'?'none':'';mb.className=PV.on?'on':'';}if($('md')&&!$('md').hidden)mdRender();}
}
/* ---------- недавние подключения: запоминаются при каждом успешном подключении, повтор в одно нажатие ---------- */
const CONN_V={online:['Онлайн',5],auto:['Wi‑Fi',1],code:['Коды',3],qr:['QR',4]};
function cEsc(s){return String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');}
function ago(t){const m=Math.max(0,(Date.now()-t)/6e4|0);if(m<1)return'только что';if(m<60)return m+' мин назад';const h=m/60|0;if(h<24)return h+' ч назад';return(h/24|0)+' дн назад';}
function connLoad(){try{const a=JSON.parse(lsGet('sfConn')||'[]');return Array.isArray(a)?a.filter(x=>x&&CONN_V[x.v]&&(x.r=='host'||x.r=='guest')).slice(0,6):[];}catch(e){return[];}}
function connSave(role,name){const v=({1:'auto',2:'lobby',3:'code',4:'qr',5:'online'})[TAB]||'auto';name=String(name||'').slice(0,16);
  const a=connLoad(),i=a.findIndex(x=>x.r==role&&x.v==v&&x.n==name),e={r:role,v,n:name,c:1,t:Date.now()};
  if(i>=0){e.c=(a[i].c|0)+1;a.splice(i,1);}a.unshift(e);lsSet('sfConn',JSON.stringify(a.slice(0,6)));connRender();}
function connRender(){
  const a=connLoad(),e=$('nrec');
  if(e){if(!a.length){e.innerHTML='';e.style.display='none';}
    else{e.style.display='';e.innerHTML='<div class="rh"><span>Недавние подключения</span><button data-clr="1">Очистить</button></div>'
      +a.slice(0,4).map((x,i)=>'<div class="rm"><span><b>'+(x.r=='host'?'Хост':'Гость')+' · '+CONN_V[x.v][0]+'</b><small>'+cEsc(x.n||'друг')+' · '+(x.c|0)+'× · '+ago(x.t)+'</small></span><button class="pr" data-rep="'+i+'">↻ Повторить</button></div>').join('')+'<div id="nrmsg" class="rm2"></div>';}}
  const b=$('brep');if(b){const x=a[0];b.style.display=(x&&!NET.on)?'':'none';const l=$('brepl');if(l&&x)l.textContent=(x.r=='host'?'Хост':'Гость')+' · '+CONN_V[x.v][0]+(x.n?' · '+x.n:'');}
}
function connRepeat(x){
  if(!x||NET.on)return;
  const msg=t=>{const m=$('nrmsg');if(m)m.textContent=t||'';};
  if($('net').hidden)togNet(1);
  setTab(CONN_V[x.v][1]);ERR='';
  const wait=(ok,go,tries,fail)=>{let n=0;const t=setInterval(()=>{if(NET.on){clearInterval(t);return;}if(ok()){clearInterval(t);go();}else if(++n>=tries){clearInterval(t);if(fail)fail();}},400);};
  if(x.v=='online'){quickPlay();return;}
  if(x.v=='qr'){if(x.r=='host')qrHost();else qrGuest();return;}
  if(x.v=='code'){if(x.r=='host'){$('hmk').click();}else{const g=$('gc');if(g)g.focus();msg('Вставьте код хоста — ответ создастся сам');}return;}
  if(x.v=='auto'){
    if(x.r=='host'){msg('Создаю игру…');wait(()=>AU.es&&!AU.hosting,()=>{autoHost();msg('Игра создана — ждём друга');},20,()=>msg('Не удалось создать игру. Проверьте интернет.'));}
    else{msg('Ищу игру «'+x.n+'»…');wait(()=>[...AU.rooms.values()].some(r=>r.name==x.n),()=>{const r=[...AU.rooms.values()].find(r=>r.name==x.n);autoJoin(r.id,r.name);msg('Подключаюсь…');},25,()=>msg('Игра «'+x.n+'» не найдена. Пусть хост создаст игру, потом выберите её в списке ниже.'));}
    return;}
  if(x.v=='lobby'){
    if(x.r=='host'){msg('Создаю игру…');wait(()=>LB.ws&&LB.ws.readyState==1&&!LB.hosting,()=>{lobbySend({t:'host'});msg('Игра создана — ждём друга');},20,()=>msg('Нет связи с сервером.'));}
    else{msg('Ищу игру «'+x.n+'»…');wait(()=>LB.rooms.some(r=>r.name==x.n),()=>{const r=LB.rooms.find(r=>r.name==x.n);lobbySend({t:'join',id:+r.id});msg('Подключаюсь…');},25,()=>msg('Игра «'+x.n+'» не найдена на сервере.'));}
  }
}
function buildUI(){
  const w=$('w'),b=document.createElement('div');b.id='nbtn';b.textContent='👥';b.title='Игра по сети и интернету, до 7 игроков (N)';b.onclick=()=>togNet();
  const p=document.createElement('div');p.id='net';p.className='sfm';p.hidden=true;
  p.innerHTML='<div class="cd"><button class="x" id="nx" aria-label="Закрыть">✕</button>'
  +'<div class="nh"><div class="ni">📡</div><div><h3>Игра по сети</h3><span class="ns">до 7 игроков · хост ведёт игру, друзья подключаются</span></div></div>'
  +'<div class="st" id="nst"></div><div class="er" id="ner"></div>'
  +'<div id="nsetup"><div id="nrec" style="display:none"></div>'
  +'<label class="nl" for="sn"><i>1</i>Твоё имя</label><div class="rw"><input id="sn" maxlength="16" placeholder="Твоё имя" autocomplete="off"></div>'
  +'<div class="nl"><i>2</i>Как подключаться</div>'
  +'<div class="tb seg"><button id="t5"><b>🌍 Онлайн</b><small>по интернету, в 1 нажатие</small></button><button id="t1"><b>📡 Wi‑Fi</b><small>в одной сети</small></button><button id="t3"><b>🔗 Коды</b><small>скопировать и вставить</small></button><button id="t4"><b>📷 QR</b><small>без интернета</small></button></div>'
  +'<div class="nl"><i>3</i>Создай игру или зайди в чужую</div>'
  +'<div id="p5" style="display:none"><div class="ng"><div class="nc"><h4>⚡ Быстрая игра</h4><p>Нажми — игра сама найдёт открытую комнату или создаст свою. Играть с друзьями: все вводят <b>одно и то же слово</b> и жмут кнопку одновременно — комната будет только ваша (слово = пароль).</p><div class="rw"><input id="or" maxlength="32" placeholder="слово-пароль (можно пусто)" autocomplete="off" autocapitalize="off"></div><div class="rw"><button class="pr" id="oq">⚡ Играть онлайн</button><button id="oc" style="display:none">Отмена</button></div></div>'
  +'<div class="nc"><h4>🔎 Открытые комнаты <span class="cnt" id="onc"></span></h4><div id="orl"></div></div></div>'
  +'<details><summary>Не соединяется?</summary><p>Игра идёт напрямую между устройствами (без сервера), поэтому у части игроков в мобильном интернете или за строгим роутером соединение может не пройти — попробуйте Wi‑Fi. Новые комнаты видны через несколько секунд.</p></details></div>'
  +'<div id="p1"><div class="ng"><div class="nc"><h4>🎮 Создать игру</h4><p>Ты станешь хостом. Друзья из твоей Wi‑Fi сети увидят игру в своём списке.</p><div class="rw"><button class="pr" id="ahost">Создать игру</button><button id="aunh" style="display:none">Отменить игру</button></div></div>'
  +'<div class="nc"><h4>🔎 Доступные игры <span class="cnt" id="nac"></span></h4><div id="arl"></div></div></div>'
  +'<details><summary>Список пуст, хотя друг уже создал игру?</summary><p>Устройства находят друг друга сами, если они в одной Wi‑Fi сети (не в мобильном интернете). Если список пуст — введите <b>одно и то же слово</b> на обоих устройствах и нажмите «Применить».</p><div class="rw"><input id="ar" placeholder="слово комнаты"><button id="ago">Применить</button></div></details></div>'
  +'<div id="p2" style="display:none"><div id="srvrow"><p>Адрес сервера (его показывает окно, где запущен <b>node server.js</b>):</p><div class="rw"><input id="sa" placeholder="192.168.1.5:8080" inputmode="url" autocapitalize="off" autocorrect="off"><button class="pr" id="sgo">Подключиться</button></div></div>'
  +'<div class="rw"><button class="pr" id="shost">Создать игру</button><button id="sunh" style="display:none">Отменить игру</button></div><p><b>Доступные игры:</b></p><div id="rl"></div></div>'
  +'<div id="p3"><div class="ng"><div class="nc"><h4>🎮 Я хост</h4><p><b>1.</b> Создай код — он скопируется сам. Отправь его другу.</p><div class="rw"><button class="pr" id="hmk">Создать код</button><button id="hsh">Отправить…</button></div><textarea id="hc" readonly placeholder="здесь появится код"></textarea>'
  +'<p><b>2.</b> Вставь ответный код друга — подключится само.</p><textarea id="ha" placeholder="ответный код"></textarea><div class="rw"><button id="hpa">📋 Вставить</button></div></div>'
  +'<div class="nc"><h4>🙋 Я гость</h4><p><b>1.</b> Вставь код хоста — ответ создастся и скопируется сам.</p><textarea id="gc" placeholder="код хоста"></textarea><div class="rw"><button id="gpa">📋 Вставить</button></div>'
  +'<p><b>2.</b> Отправь ответный код хосту.</p><textarea id="ga" readonly placeholder="здесь появится ответный код"></textarea><div class="rw"><button id="gsh">Отправить…</button></div></div></div></div>'
  +'<div id="p4" style="display:none"><div id="q0"><p class="nh2">Без интернета и серверов: хост показывает QR, друг фотографирует его, потом наоборот. Так можно добавить до 6 друзей — каждому свой QR.</p><div class="ng"><div class="nc"><h4>🎮 Я хост</h4><p>Покажи QR друзьям.</p><div class="rw"><button class="pr" id="qh">Создать игру (показать QR)</button></div></div><div class="nc"><h4>🙋 Я гость</h4><p>Сфотографируй QR хоста.</p><div class="rw"><button class="pr" id="qg">Подключиться (сфотографировать QR)</button></div></div></div></div><div class="qv" id="qshow" style="display:none"><canvas id="qcv" width="10" height="10"></canvas><small id="qinfo"></small><div class="rw" id="qctl" style="display:none"><button id="qpv">◀</button><button id="qpz">⏸ Остановить смену кадров</button><button id="qnx">▶</button></div></div><div class="qv" id="qscan" style="display:none"><video id="qvid" playsinline muted style="display:none!important"></video><div class="qb" id="qpr"><i></i></div><small id="qsc"></small></div><div class="rw" id="qrow" style="display:none"><button class="pr" id="qph">📷 Сфотографировать QR</button><button id="qrs">Сначала</button><input id="qfile" type="file" accept="image/*" capture="environment" style="display:none"><small style="flex-basis:100%">Снимите QR на экране друга ближе и ровнее, чтобы он занял почти весь кадр. Если кадров несколько: на экране друга нажмите ⏸ и снимите каждый по очереди (◀ ▶).</small></div></div></div>'
  +'<div class="nf"><button class="pr" id="nplay" style="display:none">▶ Играть</button><button id="ndis" style="display:none">Отключиться</button><small>Клавиша N — открыть или закрыть окно. У гостя возможна небольшая задержка.</small></div></div>';
  w.append(b,p);
  $('sn').value=lsGet('sfName')||('Игрок'+(10+Math.random()*90|0));
  $('nrec').onclick=e=>{const b=e.target.closest&&e.target.closest('button');if(!b)return;if(b.dataset.clr){lsSet('sfConn','[]');connRender();return;}if(b.dataset.rep!=null)connRepeat(connLoad()[+b.dataset.rep]);};connRender();
  $('sa').value=lsGet('sfAddr')||(isWeb()?location.host:'');
  $('nx').onclick=()=>togNet(0);
  for(let i=1;i<=5;i++){const tb=$('t'+i);if(tb)tb.onclick=()=>setTab(i);}
  $('oq').onclick=quickPlay;$('oc').onclick=quickCancel;
  $('or').onkeydown=e=>{if(e.key=='Enter')$('oq').click();};$('or').value=lsGet('sfWord')||'';
  $('or').onchange=()=>{lsSet('sfWord',$('or').value.trim());if(!NET.on&&!AU.hosting&&!AU.joining){autoClose();if(TAB==5)autoOpen();}};
  $('ahost').onclick=()=>{lsSet('sfName',myName());autoHost();};$('aunh').onclick=autoUnhost;
  $('ago').onclick=()=>{autoClose();autoOpen();};
  $('orl').onclick=e=>{const d=e.target&&e.target.dataset;if(d&&d.id){lsSet('sfName',myName());autoJoin(d.id,d.name);}};
  $('arl').onclick=e=>{const d=e.target&&e.target.dataset;if(d&&d.id){lsSet('sfName',myName());autoJoin(d.id,d.name);}};
  $('sgo').onclick=()=>{if(LB.ws){try{LB.ws.close()}catch(e){}LB.ws=null;}lobbyOpen();};
  $('sa').onkeydown=e=>{if(e.key=='Enter')$('sgo').onclick();};
  $('shost').onclick=()=>{lsSet('sfName',myName());lobbySend({t:'host'});};
  $('sunh').onclick=()=>{LB.hosting=0;LB.myId=0;lobbySend({t:'unhost'});updNet();};
  $('rl').onclick=e=>{const id=e.target&&e.target.dataset&&e.target.dataset.id;if(id){lsSet('sfName',myName());lobbySend({t:'join',id:+id});}};
  $('hmk').onclick=codeHost;
  $('ha').oninput=codeHostFinish;$('gc').oninput=codeGuest;
  const pa=(el)=>()=>{if(navigator.clipboard&&navigator.clipboard.readText)navigator.clipboard.readText().then(t=>{el.value=t;el.oninput();}).catch(()=>{});else setMsg('Вставьте код долгим нажатием в поле');};
  $('hpa').onclick=pa($('ha'));$('gpa').onclick=pa($('gc'));
  const sh=id=>()=>{const v=$(id).value;if(v&&navigator.share)navigator.share({text:v}).catch(()=>{});};
  $('hsh').onclick=sh('hc');$('gsh').onclick=sh('ga');if(!navigator.share){$('hsh').style.display='none';$('gsh').style.display='none';}
  $('qh').onclick=qrHost;$('qg').onclick=qrGuest;$('qrs').onclick=()=>{qrReset();rtcClean();NET.pend=null;ERR='';updNet();};
  $('qph').onclick=()=>$('qfile').click();
  const qpick=async e=>{const fs=[...(e.target.files||[])];e.target.value='';if(!fs.length)return;
    if(!QR.mode){QR.mode='guest';$('q0').style.display='none';}
    QR.cb=QR.mode=='host'?qrHostCb:qrGuestCb;await qrPhotos(fs);};
  $('qfile').onchange=qpick;
  $('qpv').onclick=()=>{qrAuto(false);QR.fi--;qrFrame();};$('qnx').onclick=()=>{qrAuto(false);QR.fi++;qrFrame();};
  $('qpz').onclick=()=>qrAuto(!QR.tm);
  $('nplay').onclick=()=>togNet(0);
  $('ndis').onclick=()=>{sendR({t:'bye'});netLost('Отключено');};
  TAB=[1,3,4,5].includes(+lsGet('sfTab'))?+lsGet('sfTab'):5;if(!lsGet('sfTab5')){lsSet('sfTab5','1');TAB=5;}setTab(TAB);
}
buildUI();
/* ================= PvP: команды, боты, раунды ================= */
function pvBal(){let a=0,b=0;if(PV.ht)b++;else a++;for(const p of PEERS)if(p.tm!=null){if(p.tm)b++;else a++;}return a>b?1:0;}
function pvLook(c){const k=PV.tc[c.tm|0];c.col=k[0];c.hb=k[1];c.f=c.fv=c.tm?-1:1;}
function pvJoin(c,pe){c.tm=pe.tm|0;pvLook(c);c.dead=1;c.k=0;c.hp=0;}
function pvSetup(){
  const hs=ch.filter(c=>c.pl),tl=[[],[]];
  for(const c of hs){const pe=PEERS.find(p=>p.pl===c);if(pe&&pe.tm==null)pe.tm=pvBal();c.tm=c===pl?(PV.ht|0):(pe?pe.tm|0:0);tl[c.tm].push(c);}
  for(let t=0;t<2;t++){
    const n=tl[t].length+(PV.b[t]|0),st=n>1?Math.min(40,150/(n-1)):0,X=i=>PV.fb?(t?WW/2+190+i*58:WW/2-190-i*58):(t?WW-55-i*st:55+i*st);let i=0;
    for(const c of tl[t])pvMkH(c,X(i++));
    for(let k=0;k<(PV.b[t]|0);k++){const b=mk(X(i++),0);b.tm=t;b.hp=b.max=90;b.tw=1;b.nm='Бот';b.ws=1.55;b.rs=3.2;b.bot=1;pvLook(b);ch.push(b);}
  }
  if(pl&&!pl.nm)pl.nm=(typeof myName=='function'&&myName())||'Ты';
}
function pvMkH(old,x){const n=mk(x,1);n.nm=old.nm;n.net=old.net;n.rip=old.rip;n.tm=old.tm;ch[ch.indexOf(old)]=n;if(old===pl)pl=n;const pe=PEERS.find(p=>p.pl===old);if(pe)pe.pl=n;pvLook(n);return n;}
function pvStep(){
  if(PV.o>=0)return;
  if(PV.rt>0){PV.rt-=D;if(PV.rt<=0){PV.rt=0;init();}return;}
  const al=[0,0],tt=[0,0];for(const c of ch){tt[c.tm|0]++;if(!c.dead)al[c.tm|0]++;}
  if(!tt[0]||!tt[1]||(al[0]&&al[1]))return;
  const w=al[0]?0:al[1]?1:-1;PV.lw=w;
  if(w>=0){PV.s[w]++;if(PV.s[w]>=PV.win){PV.o=w;return;}}
  PV.rt=3;
}
function newMatch(){PV.s=[0,0];PV.o=-1;PV.rt=0;PV.lw=-1;init();}
/* ================= ФУТБОЛ: мяч, ворота, боты ================= */
const FB={x:937,y:260,vx:0,vy:0,a:0,lt:-1},FBR=16,GXW=100,GHT=150;
function fbInit(){FB.x=WW/2;FB.y=G-170;FB.vx=FB.vy=0;FB.a=0;FB.lt=-1;}
function fbGoal(t){
  PV.s[t]++;PV.lw=t;PV.rt=3.2;if(PV.s[t]>=PV.win)PV.o=t;
  const gx=t?30:WW-30; /* команда 0 бьёт в правые ворота, команда 1 — в левые */
  const x=t?30:WW-30;FX('sparks',x,G-70,{count:34,spread:360,smin:3,smax:7,lmin:.6,lmax:1.3,grav:6,stretch:.3,stops:stp(PV.tc[t][1])},2,40);
  FX('sparks',x,G-70,{count:22,spread:360,smin:2,smax:5,lmin:.5,lmax:1.1,grav:6,stretch:.3,stops:stp('#ffffff')},2,40);
  shake=Math.max(shake,12);if(typeof beep=='function'){beep(520,.12,'square',.05,780);setTimeout(()=>beep(780,.2,'square',.05,1040),120);}
}
function fbStep(){
  if(PV.o>=0)return;
  if(PV.rt>0){PV.rt-=D;if(PV.rt<=0){PV.rt=0;init();return;}}
  for(const c of ch.slice()){if(!c.dead){c.rz=0;continue;}c.rz=(c.rz||0)+D;if(c.rz>2.4)fbRespawn(c);}
}
function fbRespawn(c){
  const x=c.tm?WW/2+240+Math.random()*140:WW/2-240-Math.random()*140;
  if(c.bot){const b=mk(x,0);b.tm=c.tm;b.hp=b.max=90;b.tw=1;b.nm='Бот';b.ws=1.55;b.rs=3.2;b.bot=1;pvLook(b);ch[ch.indexOf(c)]=b;}
  else pvMkH(c,x);
}
function fbKick(c,pw,lift){const B=FB;B.vx=c.f*pw*(.92+Math.random()*.16);B.vy=-lift*(.8+Math.random()*.4);B.lt=c.tm|0;c.at.bh=1;
  FX('sparks',B.x,B.y,{count:8,spread:200,smin:1.5,smax:4,lmin:.2,lmax:.45,grav:4,stops:stp('#ffffff')},1,40);if(typeof beep=='function')beep(170,.05,'square',.04,110);}
function fbBall(){
  const B=FB;
  B.vy+=.34;B.vx*=.9988;
  const sp=Math.hypot(B.vx,B.vy);if(sp>19){B.vx*=19/sp;B.vy*=19/sp;}
  B.x+=B.vx;B.y+=B.vy;
  if(B.y>G-FBR){B.y=G-FBR;if(B.vy>1.5)B.vy=-B.vy*.6;else B.vy=0;B.vx*=.989;}
  B.a+=B.vx/FBR;
  if(B.x<10+FBR){B.x=10+FBR;B.vx=Math.abs(B.vx)*(B.y>G-GHT?.15:.6);}
  if(B.x>WW-10-FBR){B.x=WW-10-FBR;B.vx=-Math.abs(B.vx)*(B.y>G-GHT?.15:.6);}
  for(let s=0;s<2;s++){ /* перекладина и штанга: s=0 слева, s=1 справа */
    const px=s?WW-B.x:B.x,dy=B.y-(G-GHT);
    if(px>10&&px<GXW&&Math.abs(dy)<FBR+4){
      if(dy<0){B.y=G-GHT-FBR-4;if(B.vy>0)B.vy=-B.vy*.55;}else{B.y=G-GHT+FBR+4;if(B.vy<0)B.vy=-B.vy*.4;}
    }else if(px>=GXW&&px<GXW+FBR+4){
      const dx=px-GXW,d=Math.hypot(dx,dy)||1;
      if(d<FBR+4){const nx=dx/d,ny=dy/d,wx=s?-nx:nx;B.x+=(s?-1:1)*nx*(FBR+4-d);B.y+=ny*(FBR+4-d);
        const vn=B.vx*wx+B.vy*ny;if(vn<0){B.vx-=1.55*vn*wx;B.vy-=1.55*vn*ny;}}
    }
  }
  for(const c of ch){
    if(c.dead)continue;const at=c.at;
    for(let i=0;i<c.p.length;i++){const q=c.p[i],rq=i==2?9:(i<2?8:6);
      const dx=B.x-q.x,dy=B.y-q.y,d=Math.hypot(dx,dy);if(d>=FBR+rq||d<1e-3)continue;
      const nx=dx/d,ny=dy/d,qvx=q.x-q.px,qvy=q.y-q.py;
      B.x=q.x+nx*(FBR+rq);B.y=q.y+ny*(FBR+rq);
      const rel=(B.vx-qvx)*nx+(B.vy-qvy)*ny;if(rel<0){B.vx-=1.5*rel*nx;B.vy-=1.5*rel*ny;}
      B.lt=c.tm|0;
    }
    if(at&&!at.bh&&at.t>.05){
      if(at.ty=='k'){const f=[c.p[8],c.p[10]].reduce((a,b)=>Math.hypot(B.x-a.x,B.y-a.y)<Math.hypot(B.x-b.x,B.y-b.y)?a:b);
        if(Math.hypot(B.x-f.x,B.y-f.y)<FBR+30&&(B.x-c.p[2].x)*c.f>-10)fbKick(c,11.5,4.2);}
      else if(at.ty=='p'){const h=[c.p[4],c.p[6]].reduce((a,b)=>Math.hypot(B.x-a.x,B.y-a.y)<Math.hypot(B.x-b.x,B.y-b.y)?a:b);
        if(Math.hypot(B.x-h.x,B.y-h.y)<FBR+22&&(B.x-c.p[2].x)*c.f>-10)fbKick(c,7.5,2.8);}
    }
  }
  if(PV.rt<=0&&PV.o<0){if(B.x<64&&B.y>G-GHT)fbGoal(1);else if(B.x>WW-64&&B.y>G-GHT)fbGoal(0);}
}
function fbAI(c){
  const ip={mx:0},hx=c.p[2].x,hy=c.p[2].y,dir=c.tm?-1:1,B=FB,bx=B.x,ad=Math.abs(bx-hx);
  c.cd=(c.cd||0)-D;
  const team=ch.filter(x=>x.tm===c.tm&&!x.dead).sort((a,b)=>Math.abs(a.p[2].x-bx)-Math.abs(b.p[2].x-bx)),rk=team.indexOf(c);
  const own=c.tm?WW-120:120;let tx=hx;
  if(rk===0){const behind=(hx-bx)*dir<-6;tx=behind?bx:bx-dir*90;if(!behind&&ad<80&&c.gr&&Math.random()<.1)ip.jump=1;}
  else if(rk===1)tx=bx-dir*150;
  else tx=own+dir*(230+rk*70);
  tx=clamp(tx,60,WW-60);
  const dx=tx-hx;if(Math.abs(dx)>16)ip.mx=Math.sign(dx);
  ip.run=Math.abs(dx)>240&&!!ip.mx;
  if(rk===0&&c.k>.6&&!c.at){
    const bh=G-B.y;
    if(ad<62&&(hx-bx)*dir<0&&Math.abs(B.y-hy)<75&&c.cd<=0){c.f=dir;ip.kick=1;c.cd=.5+Math.random()*.45;}
    else if(ad<60&&bh>85&&c.gr&&Math.random()<.1)ip.jump=1;
    else if(ad<58&&!c.gr&&B.y<hy-25&&c.cd<=0){ip.punch=1;c.cd=.5;}
  }
  if(!c.at&&c.k>.5&&ip.mx&&!(rk===0&&ad<80))c.f=ip.mx;
  return ip;
}
function drawField(){
  ctx.save();
  ctx.fillStyle='rgba(40,150,70,.3)';ctx.fillRect(10,G+3,WW-20,H*2);
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(WW/2-3,G+3,6,22);
  ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(WW/2,G+14,130,12,0,0,7);ctx.stroke();
  for(const x of[300,WW-300]){ctx.fillRect(x-2,G+3,4,14);}
  for(let s=0;s<2;s++){
    const x0=s?WW-GXW:10,w=GXW-10,col=PV.tc[s][1];
    ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(x0,G-GHT,w,GHT);
    ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=1;ctx.beginPath();
    for(let x=x0;x<=x0+w;x+=10){ctx.moveTo(x,G-GHT);ctx.lineTo(x,G);}
    for(let y=G-GHT;y<=G;y+=12){ctx.moveTo(x0,y);ctx.lineTo(x0+w,y);}
    ctx.stroke();
    ctx.strokeStyle='#f4f4f4';ctx.lineWidth=6;ctx.lineCap='square';ctx.beginPath();
    ctx.moveTo(s?WW-10:10,G-GHT);ctx.lineTo(s?WW-GXW:GXW,G-GHT);ctx.lineTo(s?WW-GXW:GXW,G);ctx.stroke();
    ctx.fillStyle=col;ctx.fillRect(x0,G-GHT-9,w,4);
  }
  ctx.restore();
}
function drawBall(){
  const B=FB;ctx.save();
  const h=Math.max(0,G-B.y-FBR);ctx.fillStyle='rgba(0,0,0,'+Math.max(.08,.3-h/600)+')';ctx.beginPath();ctx.ellipse(B.x,G+2,FBR*(1-Math.min(.5,h/500)),4,0,0,7);ctx.fill();
  ctx.translate(B.x,B.y);ctx.rotate(B.a);
  ctx.fillStyle='#f7f7f7';ctx.beginPath();ctx.arc(0,0,FBR,0,7);ctx.fill();
  ctx.fillStyle='#1c1c24';
  const pent=(cx,cy,r,ph)=>{ctx.beginPath();for(let i=0;i<5;i++){const a=ph+i*1.2566;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}ctx.closePath();ctx.fill();};
  pent(0,0,6,-1.5708);
  for(let i=0;i<5;i++){const a=-1.5708+i*1.2566+.6283;pent(Math.cos(a)*14.5,Math.sin(a)*14.5,4.2,a+3.1416);}
  ctx.strokeStyle='#2a2a33';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,FBR,0,7);ctx.stroke();
  ctx.restore();
  const k=(B.lt>=0&&Math.hypot(B.vx,B.vy)>9)?PV.tc[B.lt][1]:null;
  if(k){ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle=k;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(B.x,B.y);ctx.lineTo(B.x-B.vx*3,B.y-B.vy*3);ctx.stroke();ctx.restore();}
}

const PVN=['Красные','Синие'],PVE=['🔴','🔵'];
function pvHud(){
  const al=[0,0],tt=[0,0];for(const c of ch){tt[c.tm|0]++;if(!c.dead)al[c.tm|0]++;}
  const cx=W/2,w=340,x=cx-w/2,y=8;
  hudPanel(x,y,w,72,'#3a2a70',11);
  hudTxt('ДО '+PV.win+(PV.fb?' ГОЛОВ':' ПОБЕД'),cx,y+19,10,'#9b86d6','center');
  hudTxt(':',cx,y+50,30,'#fff','center',1);
  for(let t=0;t<2;t++){
    const px=t?cx+80:cx-80,col=PV.tc[t][1];
    hudTxt(PVN[t].toUpperCase(),px,y+19,10,col,'center');
    hudTxt(String(PV.s[t]),px,y+52,34,col,'center',1);
    const n=Math.min(tt[t],10),pw=8,gp=3,tw=n*(pw+gp)-gp;
    if(!PV.fb)for(let i=0;i<n;i++){ctx.fillStyle=i<al[t]?col:'#2a1f55';ctx.fillRect(px-tw/2+i*(pw+gp),y+60,pw,6);}
  }
}
function pvOver(){
  if(PV.o>=0){ctx.fillStyle='rgba(7,4,15,.55)';ctx.fillRect(0,0,W,H);return;}
  if(PV.rt>0)hudBanner(PV.fb?'ГОЛ! '+PVN[PV.lw].toUpperCase():PV.lw<0?'НИЧЬЯ В РАУНДЕ':PVN[PV.lw].toUpperCase()+' БЕРУТ РАУНД',null,PV.lw<0?'#9b86d6':PV.tc[PV.lw][1],92);
  else if(pl&&pl.dead)hudBanner(PV.fb?'ВОЗРОЖДЕНИЕ':'ТЫ ВЫБЫЛ',PV.fb?'сейчас вернёшься на поле':'наблюдай за боем','#9b86d6',92);
}
/* панель режима */
const MD={mode:0,b:[2,2],win:5,fw:3},mdEsc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function mdMembers(t){const a=[];if((PV.ht|0)==t)a.push({n:myName()||'Хост',h:1});for(const p of PEERS)if((p.tm|0)==t)a.push({n:p.name||('Гость'+((p.slot|0)+1)),p});return a;}
function mdRender(){
  const e=$('md');if(!e||e.hidden)return;const pv=MD.mode>=1,fb=MD.mode==2;let ok=1;
  let h='<button class="x" id="mx" aria-label="Закрыть"><i class="ic">'+ICO.close+'</i></button><h3>Режим игры</h3>'
  +'<div class="mcs"><button id="m0" class="mc'+(pv?'':' sel')+'" style="--k:#4dd2ff"><i class="ic">'+ICO.wave+'</i><b>Волны</b><span>Кооператив против ботов. Каждая волна злее прошлой, вместе легче.</span></button>'
  +'<button id="m1" class="mc'+(pv&&!fb?' sel':'')+'" style="--k:#ff5ec4"><i class="ic">'+ICO.swords+'</i><b>PvP команды</b><span>Красные против синих. Боты, друзья и раунды до победы.</span></button>'
  +'<button id="m2" class="mc'+(fb?' sel':'')+'" style="--k:#7dff9a"><i class="ic">'+ICO.ball+'</i><b>Футбол</b><span>Забей в ворота врага. Мяч бьют ногой, рукой и головой.</span></button></div>';
  if(pv){
    h+='<div class="tms">';
    for(let t=0;t<2;t++){const ms=mdMembers(t);if(!ms.length&&!MD.b[t])ok=0;
      h+='<div class="tmx" style="--k:'+PV.tc[t][1]+'"><div class="tmh"><i></i>'+PVN[t]+'</div>'
        +'<div class="stp"><span>Боты</span><button data-b="'+t+'-1" aria-label="Меньше ботов">−</button><span class="n">'+MD.b[t]+'</span><button data-b="'+t+'+1" aria-label="Больше ботов">+</button></div>'
        +'<div class="mem">'+(ms.length?ms.map((m,i)=>'<button data-m="'+t+'_'+i+'"><i class="ic">'+ICO.swap+'</i>'+mdEsc(m.n)+'</button>').join(''):'<small>Людей нет — играют только боты</small>')+'</div></div>';}
    h+='</div><div class="wn"><div class="stp"><span>'+(fb?'Играем до голов':'Играем до побед в раундах')+'</span><button data-w="-1" aria-label="Меньше">−</button><span class="n">'+(fb?MD.fw:MD.win)+'</span><button data-w="1" aria-label="Больше">+</button></div></div>';
    h+='<p><small>Нажми на имя, чтобы перекинуть игрока в другую команду (со следующего раунда). Друзья подключаются через «По сети».</small></p>';
    if(!ok)h+='<div class="warn">В каждой команде нужен игрок или бот</div>';
  }else h+='<p><small>Враги приходят волнами. Играйте вместе против ботов, друзья подключаются через «По сети».</small></p>';
  h+='<div class="ft"><button class="ub pr big" id="mgo"'+(ok?'':' disabled')+'><i class="ic">'+ICO.play+'</i><span class="t">'+(pv?'Начать матч':'Начать волны')+'</span></button></div>';
  e.firstChild.innerHTML=h;
}
function mdTog(v){const e=$('md');if(!e)return;const s=v===undefined?e.hidden:!!v;e.hidden=!s;if(s){for(const k in K)K[k]=0;for(const k in T)T[k]=0;MD.mode=PV.on?(PV.fb?2:1):0;MD.b=[PV.b[0],PV.b[1]];if(PV.fb)MD.fw=PV.win;else MD.win=PV.win;mdRender();}}
function buildMode(){
  const w=$('w'),b=document.createElement('div');b.id='mbtn';b.textContent='⚔';b.title='Режим: волны или PvP с ботами';b.onclick=()=>mdTog();w.appendChild(b);
  const p=document.createElement('div');p.id='md';p.className='sfm';p.hidden=true;p.innerHTML='<div class="cd"></div>';document.body.appendChild(p);
  p.onclick=ev=>{
    if(ev.target===p){mdTog(0);return;}
    const bt=ev.target.closest&&ev.target.closest('button');if(!bt)return;const d=bt.dataset;
    if(bt.id=='mx')mdTog(0);
    else if(bt.id=='m0')MD.mode=0;else if(bt.id=='m1')MD.mode=1;else if(bt.id=='m2')MD.mode=2;
    else if(d.b){const t=+d.b[0],v=+d.b.slice(1);MD.b[t]=clamp(MD.b[t]+v,0,8);}
    else if(d.w){if(MD.mode==2)MD.fw=clamp(MD.fw+(+d.w),1,15);else MD.win=clamp(MD.win+(+d.w),1,15);}
    else if(d.m){const[t,i]=d.m.split('_').map(Number),m=mdMembers(t)[i];if(m){if(m.h)PV.ht=PV.ht?0:1;else m.p.tm=m.p.tm?0:1;}}
    else if(bt.id=='mgo'){
      if(MD.mode){PV.on=1;PV.fb=MD.mode==2?1:0;PV.b=[MD.b[0],MD.b[1]];PV.win=MD.mode==2?MD.fw:MD.win;PV.s=[0,0];PV.o=-1;PV.rt=0;PV.lw=-1;}else{PV.on=0;PV.fb=0;}
      init();mdTog(0);updNet();uiStart();return;}
    mdRender();
  };
  addEventListener('keydown',e=>{if(e.code=='Escape')mdTog(0);});
  updNet();
}
buildMode();

/* прицел пальцем: с ружьём в руках касание экрана = прицел, пока держишь палец — стрельба (как мышь) */
let TA=null;
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType=='mouse'||TA!=null||allDead()||!pl||pl.dead||!heldGun(pl))return;
  TA=e.pointerId;drag=null;mpos(e);mouse.act=1;K.mf=1;P.p=1;
});
cv.addEventListener('pointermove',e=>{if(e.pointerId===TA){mpos(e);mouse.act=1;drag=null;}});
['pointerup','pointercancel'].forEach(v=>addEventListener(v,e=>{if(e.pointerId===TA){TA=null;K.mf=0;mouse.act=0;}}));
function wake(){try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(()=>{});}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(NET.on)sendR({t:'pz',v:document.hidden?1:0});if(!document.hidden){if(NET.on){wake();const nw=performance.now();NET.lastRx=nw;for(const p of PEERS)p.lastRx=nw;}last=performance.now();}});
if(isWeb()&&TAB==2)lobbyOpen();

/* ===================== ИНТЕРФЕЙС: меню, настройки, итоги (стиль Coopix Market) ===================== */
const UF='"Tektur","Pixelify Sans",system-ui,sans-serif',PXF='"Pixelify Sans","Tektur",system-ui,sans-serif';
const ICO={
  play:'<svg viewBox="0 0 24 24"><path class="f" d="M6 3.5l15 8.5-15 8.5z"/></svg>',
  ball:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 2.9-1.5 4.7h-5L8 10.4zM12 7.5V3M16 10.4l4.3-1.4M14.5 15.1l2.6 3.7M9.5 15.1l-2.6 3.7M8 10.4L3.7 9"/></svg>',
  menu:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  wave:'<svg viewBox="0 0 24 24"><path d="M2 14l4-8 4 11 4-11 4 8h4"/></svg>',
  swords:'<svg viewBox="0 0 24 24"><path d="M3 3l12 12M11 17l6-6M15 15l5 5M21 3L9 15M7 11l6 6M9 15l-5 5"/></svg>',
  wifi:'<svg viewBox="0 0 24 24"><path d="M2 9a14 14 0 0 1 20 0M5.5 12.5a9 9 0 0 1 13 0M9 16a4 4 0 0 1 6 0"/><path class="f" d="M10.5 18.5h3v3h-3z"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M3 5h7a2 2 0 0 1 2 2v13H5a2 2 0 0 1-2-2zM21 5h-7a2 2 0 0 0-2 2v13h7a2 2 0 0 0 2-2z"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><path d="M12 2l2 3 3.5-.5.5 3.5 3 2-2 3 2 3-3 2-.5 3.5-3.5-.5-2 3-2-3-3.5.5-.5-3.5-3-2 2-3-2-3 3-2 .5-3.5L10 5z"/><circle cx="12" cy="12" r="3"/></svg>',
  home:'<svg viewBox="0 0 24 24"><path class="f" d="M3 12L12 3l9 9h-3v9h-4.5v-6h-3v6H6v-9z"/></svg>',
  redo:'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 3.5V9h-5.5"/></svg>',
  trophy:'<svg viewBox="0 0 24 24"><path d="M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v2a4 4 0 0 0 4 4M17 5h4v2a4 4 0 0 1-4 4M12 14v4M8 21h8"/></svg>',
  skull:'<svg viewBox="0 0 24 24"><path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 5 3.5 6.2V21h9v-3.8C18.5 16 20 14 20 11a8 8 0 0 0-8-8z"/><path class="f" d="M7.5 10h3v3h-3zM13.5 10h3v3h-3z"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  swap:'<svg viewBox="0 0 24 24"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M4 13l5 5L20 6"/></svg>'
};
const SET=Object.assign({sk:1,hint:1,snd:1,crt:0,zm:0},(()=>{try{return JSON.parse(lsGet('sfSet')||'{}')||{}}catch(e){return{}}})());
const saveSet=()=>lsSet('sfSet',JSON.stringify(SET));
let BEST=Object.assign({w:0,k:0},(()=>{try{return JSON.parse(lsGet('sfBest')||'{}')||{}}catch(e){return{}}})());
const UI={open:1,started:0,v:'main',goAt:0,goShown:0,wa:{w:-1,t:0},hg:1,pk:-1,wn:false,nm:lsGet('sfName')||''};
document.querySelectorAll('[data-i]').forEach(e=>{e.innerHTML=ICO[e.dataset.i]||'';});

/* ---------- звуки интерфейса (WebAudio, без файлов) ---------- */
let _ac=null;
function beep(f,d,ty,v,f2){if(!SET.snd)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;_ac=_ac||new A();if(_ac.state=='suspended')_ac.resume();
  const o=_ac.createOscillator(),g=_ac.createGain(),t=_ac.currentTime;o.type=ty||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v||.035,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(_ac.destination);o.start(t);o.stop(t+d+.02);}catch(e){}}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.ub,.mc,.sw,.stp button,.mem button,#nbtn,#mbtn,#pbtn,#net button,.sfm .x');if(!t)return;
  const pr=t.classList.contains('pr');beep(pr?760:520,.07,'square',.03,pr?1100:700);},true);

/* ---------- состояние окон ---------- */
const uiBusy=()=>UI.open||!$('md').hidden||!$('sp').hidden||!$('hp').hidden;
const uiFrozen=()=>(UI.open||!$('md').hidden)&&!NET.on;
function uiTxt(){
  const pz=UI.v=='pause',g=NET.role=='guest';
  $('mmst').innerHTML=pz
    ?'<i class="ic">'+ICO.skull+'</i><span>'+(PV.on?(PV.fb?'Футбол':'PvP')+' · счёт <b>'+PV.s[0]+':'+PV.s[1]+'</b> · до '+PV.win:'Волна <b>'+wave+'</b> · убито <b>'+score+'</b>')+'</span>'
    :'<i class="ic">'+ICO.trophy+'</i><span>'+(BEST.w?'Рекорд: волна <b>'+BEST.w+'</b> · убито <b>'+BEST.k+'</b>':'Рекорд ещё не установлен')+'</span>';
  $('brs').style.display=g?'none':'';$('bmode').style.display=g?'none':'';connRender();
}
function uiShow(v){
  UI.v=v;UI.open=1;const m=$('mm');m.dataset.v=v;m.hidden=false;$('pbtn').style.display='none';
  for(const k in K)K[k]=0;for(const k in T)T[k]=0;uiTxt();
  setTimeout(()=>{const b=m.querySelector(v=='pause'?'#bres':'#bplay');if(b&&b.focus)b.focus({preventScroll:true});},40);
}
function uiHide(){UI.open=0;$('mm').hidden=true;$('pbtn').style.display='';last=performance.now();acc=0;}
function uiStart(){UI.started=1;UI.goAt=0;UI.goShown=0;$('go').hidden=true;uiHide();}
function uiExit(){if(NET.on){try{sendR({t:'bye'});}catch(e){}netLost('Отключено');}UI.started=0;$('go').hidden=true;UI.goAt=0;UI.goShown=0;uiShow('main');}
function uiRestart(){if(NET.role=='guest')return;if(PV.on)newMatch();else init();uiHide();}
const uiModal=(id,on)=>{const e=$(id);if(!e)return;e.hidden=!on;if(on&&id=='sp')uiSetOpen();};

/* кнопка паузы в углу */
{const b=document.createElement('div');b.id='pbtn';b.title='Меню (Esc)';b.innerHTML='<i class="ic">'+ICO.menu+'</i>';b.style.display='none';
 b.onclick=()=>{if(UI.open){if(UI.v=='pause')uiHide();}else if(UI.started)uiShow('pause');};$('w').appendChild(b);}

/* кнопки меню */
$('bplay').onclick=()=>mdTog(1);
$('bres').onclick=uiHide;
$('brs').onclick=uiRestart;
$('bmode').onclick=()=>mdTog(1);
$('bnet').onclick=()=>togNet(1);
$('brep').onclick=()=>{const x=connLoad()[0];if(!x)return;togNet(1);connRepeat(x);};
$('bhelp').onclick=()=>uiModal('hp',1);
$('bset').onclick=()=>uiModal('sp',1);
$('bexit').onclick=uiExit;
$('gore').onclick=()=>restartReq();
$('gomn').onclick=uiExit;
$('mmpg').onclick=()=>{const p=$('mmpg');p.classList.remove('hop');void p.offsetWidth;p.classList.add('hop');beep(880,.09,'square',.035,1320);};
$('mmpg').addEventListener('animationend',()=>$('mmpg').classList.remove('hop'));
document.addEventListener('click',e=>{const t=e.target;
  if(t.closest&&t.closest('[data-close]')){const m=t.closest('.sfm');if(m)m.hidden=true;return;}
  if(t.classList&&t.classList.contains('sfm')&&(t.id=='sp'||t.id=='hp'))t.hidden=true;});

/* Esc: закрыть окно → меню паузы (до остальных обработчиков) */
addEventListener('keydown',e=>{
  if(e.code!='Escape'||e.repeat)return;
  if(!$('net').hidden||!$('md').hidden)return;
  if(!$('sp').hidden){$('sp').hidden=true;return;}
  if(!$('hp').hidden){$('hp').hidden=true;return;}
  if(UI.open){if(UI.v=='pause')uiHide();return;}
  if(UI.started)uiShow('pause');
},true);
/* стрелки вверх/вниз ходят по кнопкам меню */
addEventListener('keydown',e=>{
  if(!UI.open||!$('sp').hidden||!$('hp').hidden||!$('md').hidden||!$('net').hidden)return;
  if(e.code!='ArrowDown'&&e.code!='ArrowUp')return;
  const bs=[...$('mm').querySelectorAll('.ub')].filter(b=>b.offsetParent!==null||getComputedStyle(b).display!='none');if(!bs.length)return;
  let i=bs.indexOf(document.activeElement);i=(i+(e.code=='ArrowDown'?1:-1)+bs.length)%bs.length;bs[i].focus();e.preventDefault();
});

/* ---------- настройки ---------- */
function applySet(){$('crt').hidden=!SET.crt;}
function uiSetOpen(){
  $('sname').value=UI.nm||myName();
  const z=SET.zm?Math.round(zoom*100):0;$('szoom').value=z||100;$('szv').textContent=z?z+'%':'авто';
  document.querySelectorAll('#sp .sw').forEach(r=>r.querySelector('.tg').setAttribute('aria-checked',SET[r.dataset.k]?'true':'false'));
}
document.querySelectorAll('#sp .sw').forEach(r=>{r.onclick=()=>{const k=r.dataset.k;SET[k]=SET[k]?0:1;r.querySelector('.tg').setAttribute('aria-checked',SET[k]?'true':'false');saveSet();applySet();};});
$('sname').oninput=e=>{const v=e.target.value.slice(0,16).trim();UI.nm=v;lsSet('sfName',v);const n=$('sn');if(n)n.value=v;};
$('szoom').oninput=e=>{const v=+e.target.value;zoom=clamp(v/100,.6,1.8);zUser=1;SET.zm=v;saveSet();$('szv').textContent=v+'%';};
$('szauto').onclick=()=>{zUser=0;SET.zm=0;saveSet();zoom=1;$('szoom').value=100;$('szv').textContent='авто';};
$('sreset').onclick=()=>{BEST={w:0,k:0};lsSet('sfBest',JSON.stringify(BEST));uiTxt();beep(220,.16,'sawtooth',.04,110);};
if(SET.zm){zoom=clamp(SET.zm/100,.6,1.8);zUser=1;}
applySet();

/* тач-кнопки: подсветка при нажатии */
document.querySelectorAll('#w .b').forEach(b=>{b.addEventListener('pointerdown',()=>b.classList.add('dn'));['pointerup','pointercancel','pointerleave'].forEach(v=>b.addEventListener(v,()=>b.classList.remove('dn')));});

/* ---------- итоги: рекорд и экран «игра окончена» ---------- */
function uiBest(w,k){const nb=w>0&&(w>BEST.w||(w==BEST.w&&k>BEST.k));if(nb){BEST.w=w;BEST.k=k;lsSet('sfBest',JSON.stringify(BEST));}return nb;}
const tile=(l,v,c)=>'<div class="stt" style="--tc:'+c+'"><small style="color:var(--dim)">'+l+'</small><b>'+v+'</b></div>';
function goFill(){
  const g=NET.role=='guest',go=$('go');let ic,h,p,col,st;
  if(PV.on){const w=PV.o;col=PV.tc[w][1];ic=ICO.trophy;h=PVN[w]+' победили';p='Матч окончен · до '+PV.win+(PV.fb?' голов':' побед');
    st=tile('Счёт',PV.s[0]+' : '+PV.s[1],col)+tile(PV.fb?'Голов':'Раундов',PV.s[0]+PV.s[1],'#fff');
    beep(520,.12,'square',.04,780);setTimeout(()=>beep(780,.2,'square',.04,1040),130);}
  else{const nb=uiBest(wave,score);col=nb?'#ffd23f':'#ff5e7a';ic=nb?ICO.trophy:ICO.skull;h=NET.on?'Вы проиграли':'Ты проиграл';
    p=nb?'Новый рекорд! <span class="nw">РЕКОРД</span>':'Попробуй ещё раз';
    st=tile('Волна',wave,'#4dd2ff')+tile('Убито',score,'#ff5ec4')+tile('Рекорд',BEST.w?BEST.w+' / '+BEST.k:'—','#ffd23f');
    if(nb){beep(520,.1,'square',.04,780);setTimeout(()=>beep(780,.1,'square',.04,1040),120);setTimeout(()=>beep(1040,.22,'square',.04,1300),240);}else beep(330,.28,'sawtooth',.04,120);}
  go.style.setProperty('--gc',col);$('goic').innerHTML='<i class="ic" style="width:1em;height:1em">'+ic+'</i>';$('goh').textContent=h;$('gop').innerHTML=p+(g?'<br><small>Хост начнёт новую игру. Можно попросить его кнопкой ниже.</small>':'');$('gos').innerHTML=st;
  $('gorl').textContent=g?'Попросить заново':(PV.on?'Реванш':'Заново');
}
function uiGoTick(n){
  const over=!UI.open&&UI.started&&pl&&ch.length&&(PV.on?PV.o>=0:allDead());
  if(over){if(!UI.goAt)UI.goAt=n;if(!UI.goShown&&n-UI.goAt>900){UI.goShown=1;goFill();$('go').hidden=false;}}
  else if(UI.goAt||UI.goShown){UI.goAt=0;UI.goShown=0;$('go').hidden=true;}
}
function uiTick(n){
  if(NET.on!==UI.wn){UI.wn=NET.on;if(NET.on){UI.started=1;if(UI.open)uiHide();}}
  uiGoTick(n);
}
uiTxt();

/* сразу бой, без главного меню: меню — в паузе (кнопка в углу или Esc → «Главное меню») */
init();uiStart();requestAnimationFrame(loop);
</script></body></html>
$cpx$)
on conflict (game_id, part) do update set total = excluded.total, body = excluded.body;

-- все части на месте и длина сходится → записать файл в игру и очистить буфер
update public.games g set file_html = s.html, updated_at = now()
  from (select string_agg(body, '' order by part) as html, count(*) as n from public.game_upload where game_id = 'stickfight' and total = 2) s
 where g.id = 'stickfight' and s.n = 2 and char_length(s.html) = 542159;
delete from public.game_upload where game_id = 'stickfight' and (select char_length(file_html) from public.games where id = 'stickfight') = 542159;

-- итог: «готово», если игра обновлена, иначе сколько частей ещё не хватает
select case when (select char_length(file_html) from public.games where id = 'stickfight') = 542159 then 'готово: Stick Fight обновлена'
  else 'загружено частей: ' || (select count(*) from public.game_upload where game_id = 'stickfight' and total = 2) || ' из 2' end as status;
