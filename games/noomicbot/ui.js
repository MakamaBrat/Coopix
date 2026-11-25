/* ---------- Единый тёмный интерфейс: чёрные кнопки, контрастные рамки, компактное меню паузы (портрет и горизонталь).
   Вставляется скриптом scripts/build_noomic_plus.py после skins.js (до i18n.js): только добавляет стили поверх остальных. ---------- */
{const st=document.createElement("style");st.textContent=
/* кнопки: чёрные, с тонкой светлой рамкой; выбранные — белая рамка */
"button.red,button.navy,button.red.dark{border:1px solid #3b3b46!important;box-shadow:inset 0 1px 0 #ffffff14;color:#fff}"+
"button.red:active,button.navy:active{background:#2c2c34!important}"+
"button.red.on,button.navy.on,#maps .tabs button.on{border-color:#fff!important;background:#23232b!important}"+"#maps .list .it{border:1px solid transparent;border-radius:1.6vmin}#maps .list .it.on{background:#fff!important;color:#000!important}#maps .list .it.on *{color:#000}#maps .list .it:active{background:#26262e}"+
"#menu .ttl{color:#fff!important;text-shadow:0 .5vmin 0 #000,0 0 2.4vmin #000a}#menu .ver{color:#e4e4ea!important;text-shadow:0 0 1vmin #000}"+
/* меню паузы: тёмные панели вместо светло-серых */
"#pause{top:0!important;bottom:0!important;background:#000000b8!important;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}#pause::before,#pause::after{display:none!important}#pause{padding-top:calc(var(--bkt) + 1vmin)!important;padding-bottom:calc(var(--bkb) + 1vmin)!important}"+
"#pause .pn{background:#101015f2!important;border:1px solid #30303a!important;border-radius:2.2vmin!important;box-shadow:0 1vmin 4vmin #000a}"+
".ctl{background:#1a1a21!important;border:1px solid #2e2e38;border-radius:1.8vmin!important}"+
".ctl .h{background:transparent!important;color:#b4b4c0!important;font-size:max(11px,2.3vmin)!important;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:1.1vmin 1.4vmin 0!important;text-align:left!important}"+
".ctl .b button{background:#26262f!important;color:#fff!important;border-radius:1.4vmin!important;border:1px solid #3a3a45!important}"+
".ctl .b button:active{background:#3a3a46!important}"+
".ctl .b span{color:#fff!important;font-style:normal!important;font-weight:800}"+
"@media(orientation:portrait){#maps.open{display:grid!important;grid-template-columns:27vw 1fr;grid-template-rows:auto auto auto minmax(0,1fr) auto;gap:2.6vw;padding:2vw 4vw!important}#maps>*{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto!important;height:auto!important;margin:0!important}#maps .back{grid-area:1/1/2/2}#maps .tabs{grid-area:1/2/2/3;height:13vw!important}#maps .tabs button{font-size:4.2vw!important}#maps .pvw{grid-area:2/1/3/3;height:56vw!important}#maps .chips{grid-area:3/1/4/3}#maps .list{grid-area:4/1/5/3;overflow-y:auto}#maps .go{grid-area:5/1/6/3}#maps .back{height:13vw!important;font-size:4.2vw!important}#maps .go{height:14vw!important;font-size:5.4vw!important}#maps .list .it{font-size:5vw!important;padding:3vw 3.4vw!important}}"+
"@media(orientation:landscape){#maps.open{display:grid!important;grid-template-columns:19vmin 1fr 1.25fr;grid-template-rows:auto auto minmax(0,1fr) auto;gap:1.8vmin;padding:1.6vmin calc(env(safe-area-inset-right) + 2vmin) 1.6vmin calc(env(safe-area-inset-left) + 2vmin)!important}#maps>*{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto!important;height:auto!important;margin:0!important}#maps .back{grid-area:1/1/2/2;height:9vmin!important;font-size:3.4vmin!important}#maps .tabs{grid-area:1/2/2/3;height:9vmin!important}#maps .chips{grid-area:2/1/3/3}#maps .list{grid-area:3/1/4/3;overflow-y:auto}#maps .go{grid-area:4/1/5/3;height:11vmin!important;font-size:4.2vmin!important}#maps .pvw{grid-area:1/3/5/4}}"+"#pHome,#pCam{border-radius:1.8vmin!important}#pX{background:#0d0d11!important;border:1px solid #fff5!important;color:#fff!important}"+
/* портрет: отступ сверху уже даёт сам экран */
"@media(orientation:portrait){#pL{margin-top:0!important;padding-top:2.4vw!important}#pause .pn{width:94%!important;padding:2.6vw!important}.ctl .b span{font-size:5vw}.ctl .h{font-size:3.1vw!important;padding:2vw 2.6vw 0!important}.ctl{margin-bottom:0!important;border-radius:3vw!important}.ctl .b{height:13vw!important;padding:0 1.6vw!important}.ctl .b button{width:16vw!important;height:10.4vw!important;font-size:7vw!important;border-radius:2.4vw!important}#pause .pn{border-radius:4vw!important}#pL .hdrow button{height:15vw!important;font-size:6.4vw!important}#pX{bottom:calc(var(--bkb) + 3vw)!important}#pLc,#pC{display:grid;grid-template-columns:1fr;gap:2.4vw}#pL .hdrow{margin-bottom:2vw}#pR{margin-bottom:24vw!important}}"+
/* горизонталь: три колонки в одну линию, всё помещается без прокрутки */
"@media(orientation:landscape){"+
"#pause.open{display:grid!important;grid-template-columns:1.25fr 1fr .8fr;gap:1.6vmin;align-content:start;align-items:start;padding:calc(var(--bkt) + 1.6vmin) calc(env(safe-area-inset-right) + 1.6vmin) calc(var(--bkb) + 1.6vmin) calc(env(safe-area-inset-left) + 1.6vmin)}"+
"#pause .pn{position:relative!important;left:auto!important;right:auto!important;top:auto!important;width:auto!important;height:auto!important;margin:0!important;padding:1.4vmin!important}"+
"#pL{padding-top:1.4vmin!important;margin:0!important}#pL .hdrow{display:flex!important;flex-direction:row!important;gap:1.2vmin!important;margin-bottom:1.2vmin}#pL .hdrow button{flex:1!important;height:10vmin!important;font-size:4vmin!important}#pHome{flex:2.4!important;font-size:4.2vmin!important}"+
"#pL #pLc{display:grid;grid-template-columns:1fr 1fr;gap:1.1vmin}#pL #pLc .ctl:first-child,#pL #pLc .ctl:last-child{grid-column:1/3}"+
".ctl{margin-bottom:0!important}.ctl .b{height:8.2vmin!important;padding:0 .8vmin!important}.ctl .b button{width:8vmin!important;height:6.4vmin!important;font-size:4.6vmin!important}#pL .ctl .b button{width:6.4vmin!important;font-size:4vmin!important}.ctl .b span{font-size:3.2vmin!important}"+
"#pC{margin-top:0!important}#pC .ctl,#pR .ctl{margin-bottom:1.1vmin!important}"+
"#pX{position:absolute!important;left:auto!important;bottom:auto!important;right:calc(env(safe-area-inset-right) + 1.6vmin)!important;top:calc(var(--bkt) + 1.6vmin)!important;width:11vmin!important;height:11vmin!important;font-size:6vmin!important;z-index:5}"+
"#pause #pR{margin-top:13.6vmin!important}}";
document.head.appendChild(st)}

/* вкладка «Авторские» → «Мои карты» (там лежат карты самого игрока из конструктора) */
{const N={ru:"Мои карты",uk:"Мої карти",be:"Мае карты",en:"My maps",de:"Meine Karten",fr:"Mes cartes",es:"Mis mapas",it:"Le mie mappe",pt:"Meus mapas",pl:"Moje mapy"};
 for(const L in N)if(I18N[L])I18N[L]["maps.custom"]=N[L]}

/* ---------- меню: без номера версии, заголовок в «хромированном» стиле, язык — компактная плашка вместо флага ---------- */
{const st=document.createElement("style");st.textContent=
"#menu .ver{display:none!important}"+
"#menu .ttl{font-style:italic;font-weight:900;letter-spacing:.6vmin;text-transform:uppercase;color:transparent!important;background:linear-gradient(180deg,#ffffff 0%,#dfe6f5 38%,#6f7a99 52%,#cfd8ee 54%,#ffffff 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-stroke:.22vmin #0b0b0f;paint-order:stroke fill;text-shadow:none!important;filter:drop-shadow(0 .7vmin 0 #000) drop-shadow(0 0 2.4vmin #22d3eeb0) drop-shadow(0 0 1vmin #ff3df280);transform:skewX(-6deg)}"+
"@media(orientation:portrait){#menu .ttl{font-size:11.5vw;letter-spacing:.9vw}}"+
"#flag{background:#0d0d11!important;border:1px solid #4a4a56!important;border-radius:99px!important;color:#fff!important;font-size:3.4vmin!important;font-weight:800;letter-spacing:.2vmin;padding:1.2vmin 2.6vmin!important;filter:none!important;display:flex;align-items:center;gap:1vmin;box-shadow:inset 0 1px 0 #ffffff1a}"+
"@media(orientation:portrait){#flag{font-size:4vw!important;padding:1.8vw 3.6vw!important}}";
document.head.appendChild(st);
const f=document.getElementById("flag");
if(f){let busy=0;const dec=t=>{const cp=[...t].map(c=>c.codePointAt(0)).filter(n=>n>=127462&&n<=127487);return cp.length>=2?String.fromCharCode(65+cp[0]-127462,65+cp[1]-127462):""};
 const paint=()=>{if(busy)return;const code=dec(f.textContent||"");if(!code)return;busy=1;f.textContent="🌐 "+code;busy=0};
 new MutationObserver(paint).observe(f,{childList:true,characterData:true,subtree:true});paint()}}

/* ---------- кнопки управления в геймплее: тёмные, полупрозрачные ---------- */
{const st=document.createElement("style");st.textContent=
".zone{background:#0b0b0fb3!important;color:#fff!important;box-shadow:inset 0 0 0 .2vmin #ffffff3d,0 .4vmin 1.6vmin #0006!important;border:0!important;text-shadow:0 1px 2px #000a}"+
".zone.down{background:#ffffffd9!important;color:#000!important;text-shadow:none}"+
".zone.gb{background:#0b0b0fb3!important}"+
"#zStop{background:#0b0b0fe6!important;color:#fff!important}";
document.head.appendChild(st)}

/* ---------- магазин и гардероб: вкладки-категории сверху (Все / Цвета / Шляпы / ... / Шлейф), выбор типа в один тап ---------- */
{const IC={col:"🎨",hat:"🎩",cape:"🦸",sky:"🌤️",face:"🕶️",wear:"👟",gear:"🚀",fx:"✨"};
 let TAB="";
 const st=document.createElement("style");st.textContent=
 "#shTabs{position:sticky;top:0;z-index:5;display:flex;gap:1.4vmin;overflow-x:auto;padding:1vmin 0 1.4vmin;margin:0 0 1vmin;background:#09090c;scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}.sc2 #shTabs,.sc2 #shTabs *,#shop #shTabs,#shop #shTabs *{touch-action:pan-x pan-y!important}#shTabs{overscroll-behavior-x:contain;cursor:grab}#shTabs::-webkit-scrollbar{display:none}"+
 "#shTabs button{flex:0 0 auto;display:flex;align-items:center;gap:1vmin;height:max(40px,8vmin);padding:0 2.6vmin;border-radius:99px;border:1px solid #3b3b46;background:#14141a;color:#fff;font-size:max(14px,3vmin);font-weight:700;white-space:nowrap}"+
 "#shTabs button i{font-style:normal;font-size:.95em;opacity:.7;font-weight:600}#shTabs button.on{background:#fff;color:#000;border-color:#fff}#shTabs button.on i{opacity:.6}"+
 "@media(orientation:portrait){#shTabs{gap:2vw;padding:2vw 0 2.6vw}#shTabs button{height:11vw;padding:0 4.2vw;font-size:4vw;gap:1.6vw}}";
 document.head.appendChild(st);
 const dec=()=>{const body=document.getElementById("shBody");if(!body||typeof ITEMS==="undefined")return;
  const owned=id=>!!SAVE.owned[id],skins=typeof shopMode!=="undefined"&&shopMode==="skins";
  const cats=Object.keys(ITEMS).filter(c=>ITEMS[c].some(it=>!(skins&&!owned(it[0]))));
  const secs=[...body.querySelectorAll(".shSec")];
  secs.forEach((s,i)=>{const c=cats[i];s.dataset.cat=c;const g=s.nextElementSibling;if(g&&g.classList.contains("grid"))g.dataset.cat=c});
  if(TAB&&!cats.includes(TAB))TAB="";
  const bar=document.createElement("div");bar.id="shTabs";
  const mk=(c,label,n)=>{const b=document.createElement("button");b.className=(TAB===c?"on":"");b.innerHTML=(c?(IC[c]||"")+" ":"")+label+" <i>"+n+"</i>";
   b.onclick=()=>{TAB=c;apply();bar.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));body.scrollTop=0;try{b.scrollIntoView({inline:"center",block:"nearest"})}catch(e){}};bar.appendChild(b);return b};
  const total=secs.reduce((a,s)=>a+(s.querySelector("i")?+s.querySelector("i").textContent:0),0);
  mk("",T("x.all")||"Все",total);
  secs.forEach(s=>{const n=s.querySelector("span"),i=s.querySelector("i");mk(s.dataset.cat,n?n.textContent:s.dataset.cat,i?i.textContent:"")});
  body.insertBefore(bar,body.firstChild);
  /* прокрутка полосы вкладок пальцем, мышью (перетаскиванием) и колесом */
  {let dx=0,sx=0,drag=false,moved=false;
   bar.addEventListener("pointerdown",e=>{if(e.pointerType==="touch")return;drag=true;moved=false;sx=e.clientX;dx=bar.scrollLeft});
   addEventListener("pointermove",e=>{if(!drag)return;const d=e.clientX-sx;if(Math.abs(d)>4)moved=true;bar.scrollLeft=dx-d},{passive:true});
   addEventListener("pointerup",()=>{drag=false});
   bar.addEventListener("click",e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true);
   bar.addEventListener("wheel",e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){bar.scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false})}
  function apply(){for(const el of body.querySelectorAll("[data-cat]")){el.style.display=(!TAB||el.dataset.cat===TAB)?"":"none"}}
  apply()};
 const _rs=renderShop;renderShop=function(){const r=_rs.apply(this,arguments);try{dec()}catch(e){console.warn("shTabs",e)}return r};
 for(const L in I18N)I18N[L]["x.all"]=["ru","uk","be"].includes(L)?(L==="uk"?"Усе":"Все"):"All"}

/* ---------- экран выбора карты: «Назад» + фильтры в одну строку, типы карт — широкий сегментный переключатель ---------- */
{const st=document.createElement("style");st.textContent=
"#maps .tabs{display:flex!important;gap:0!important;padding:.6vmin!important;border-radius:99px!important;background:#14141a!important;border:1px solid #33333d!important;overflow:hidden}"+
"#maps .tabs button{flex:1 1 0!important;min-width:0;display:flex;align-items:center;justify-content:center;gap:.8vmin;height:100%!important;margin:0!important;padding:0 1.2vmin!important;border-radius:99px!important;border:0!important;background:transparent!important;color:#b6b6c1!important;font-weight:800!important;white-space:nowrap;box-shadow:none!important;text-align:center}"+
"#maps .tabs button.on{background:#fff!important;color:#000!important}#maps .tabs button.ext.on{background:linear-gradient(90deg,#ffd24a,#ff8a2a)!important;color:#000!important}"+
"#maps .tabs button.ext:not(.on){color:#ffb36b!important}"+
"@media(orientation:portrait){"+
"#maps.open{grid-template-columns:27vw 1fr!important;grid-template-rows:auto auto auto minmax(0,1fr) auto!important}"+
"#maps .back{grid-area:1/1/2/2!important;height:12vw!important}"+
"#maps .chips{grid-area:1/2/2/3!important;display:flex!important;gap:2vw!important;height:12vw;align-items:stretch;overflow:hidden}#maps .chips button{flex:1 1 0;min-width:0;height:auto!important;font-size:3.5vw!important;padding:0 2vw!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
"#maps .tabs{grid-area:2/1/3/3!important;height:13.5vw!important}#maps .tabs button{font-size:3.6vw!important}"+
"#maps .pvw{grid-area:3/1/4/3!important}#maps .list{grid-area:4/1/5/3!important}#maps .go{grid-area:5/1/6/3!important}}"+
"@media(orientation:landscape){"+
"#maps.open{grid-template-rows:auto auto minmax(0,1fr) auto!important}"+
"#maps .back{grid-area:1/1/2/2!important}"+
"#maps .chips{grid-area:1/2/2/3!important;display:flex!important;gap:1.2vmin!important;align-items:stretch;overflow:hidden;height:9vmin}#maps .chips button{flex:1 1 0;min-width:0;height:auto!important;font-size:2.8vmin!important;padding:0 1.4vmin!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
"#maps .tabs{grid-area:2/1/3/3!important;height:9.5vmin!important}#maps .tabs button{font-size:3.2vmin!important}"+
"#maps .list{grid-area:3/1/4/3!important}#maps .go{grid-area:4/1/5/3!important}#maps .pvw{grid-area:1/3/5/4!important}}";
document.head.appendChild(st)}

/* ---------- лого поменьше и ниже, чтобы плашка языка его не закрывала ---------- */
{const st=document.createElement("style");st.textContent=
"@media(orientation:portrait){#menu .ttl{font-size:8.6vw!important;letter-spacing:.6vw!important;top:calc(env(safe-area-inset-top) + 5.6%)!important}#flag{font-size:3.3vw!important;padding:1.4vw 3vw!important}#menu .flag{top:calc(env(safe-area-inset-top) + 1.2%)!important}}"+
"@media(orientation:landscape){#menu .ttl{font-size:5.6vmin!important;top:3.4%!important}}";
document.head.appendChild(st)}

/* ---------- фон по умолчанию у всех — «Закат» (бесплатный и первый в списке); один раз переключаем и тех, у кого стоял «Ясный день» ---------- */
{const sk=ITEMS.sky;if(sk){const i=sk.findIndex(x=>x[0]==="sky_sunset");if(i>0){const s=sk.splice(i,1)[0];s[3]=0;sk.unshift(s)}else if(i===0)sk[0][3]=0;
  SAVE.owned.sky_sunset=1;if(!SAVE.skyMig){SAVE.skyMig=1;if(!SAVE.eq.sky||SAVE.eq.sky==="sky_day")SAVE.eq.sky="sky_sunset";persist()}}}

/* ---------- кнопка паузы ☰ дублируется вверху слева (под «Назад» Telegram); пока открыто меню паузы — скрыта, чтобы не лежала поверх него ---------- */
{const g=document.getElementById("game"),m=document.getElementById("zMenu"),pz=document.getElementById("pause");
 if(g&&m&&!document.getElementById("zMenu2")){
  const b=document.createElement("button");b.id="zMenu2";b.className="red";b.textContent="☰";b.setAttribute("aria-label","Menu");
  b.onclick=e=>{e.stopPropagation();m.click()};g.appendChild(b);
  const st=document.createElement("style");st.textContent="#zMenu2{position:absolute;left:calc(env(safe-area-inset-left) + 2.4vmin);top:2.4vmin;width:10vmin;height:10vmin;padding:0;font-size:5.2vmin;line-height:1;border-radius:2vmin;opacity:.92;display:flex;align-items:center;justify-content:center}#game.rp #zMenu2,#game.pz #zMenu2{display:none}@media(orientation:portrait){#zMenu2{left:3vw;top:3vw;width:11vw;height:11vw;font-size:6vw;border-radius:2.6vw}}";document.head.appendChild(st);
  if(pz){const sync=()=>g.classList.toggle("pz",pz.classList.contains("open"));new MutationObserver(sync).observe(pz,{attributes:true,attributeFilter:["class"]});sync()}}}
