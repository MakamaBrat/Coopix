/* Noomic Bot: карты игрока в облаке (3 слота) и ссылка «поделиться» через Telegram.
   Вставляется в основной скрипт игры скриптом scripts/build_noomic_plus.py после gestures.js (до skins.js).
   Игра работает в изолированном окне маркета и сама в сеть не ходит: она шлёт маркету {coopix:"maps", op, rid, …} (list / put / del / get / share),
   маркет обращается к серверу (hub?r=mymaps|mapput|mapdel|mapget) и отвечает сообщением с тем же rid.
   Ссылка на карту: t.me/<бот>?startapp=map_<id>. Маркет открывает игру и кладёт карту в window.__CPX_MAP — игра добавляет её в «Авторские» и сразу запускает.
   Редактор карт объявлен в отдельном скрипте ниже по странице, поэтому всё подключается по событию load. */
addEventListener("load",()=>{
const inMarket=()=>{try{return !!window.parent&&window.parent!==window}catch(e){return false}};
const RU={"cl.title":"Облако","cl.share":"Поделиться","cl.take":"Взять","cl.del":"Удалить","cl.empty":"Нажмите «🔗» у карты: она сохранится в облаке (до 3 карт) и откроется окно отправки в Telegram.","cl.limit":"В облаке уже 3 карты — удалите одну в блоке «Облако».","cl.big":"Карта слишком большая.","cl.bad":"Не удалось сохранить карту.","cl.rate":"Слишком часто, подождите минуту.","cl.fail":"Нет связи, попробуйте ещё раз.","cl.shareText":"Noomic Bot: карта «{0}»","cl.got":"Карта «{0}» добавлена в «Авторские»","cl.have":"Эта карта уже у вас","cl.from":"Карта от {0}","cl.sent":"Ссылка готова","cl.noMarket":"Облако работает в Coopix Market в Telegram"},
 EN={"cl.title":"Cloud","cl.share":"Share","cl.take":"Take","cl.del":"Delete","cl.empty":"Tap «🔗» on a map: it is saved to the cloud (up to 3 maps) and the Telegram share window opens.","cl.limit":"The cloud already holds 3 maps — delete one in the «Cloud» block.","cl.big":"The map is too big.","cl.bad":"Could not save the map.","cl.rate":"Too fast, wait a minute.","cl.fail":"No connection, try again.","cl.shareText":"Noomic Bot: map «{0}»","cl.got":"Map «{0}» added to Custom","cl.have":"You already have this map","cl.from":"Map by {0}","cl.sent":"Link ready","cl.noMarket":"The cloud works inside Coopix Market in Telegram"};
for(const L in I18N)Object.assign(I18N[L],["ru","uk","be"].includes(L)?RU:EN);

/* ---------- обмен с маркетом ---------- */
let rid=0;const waits=new Map();
const ask=(op,data)=>new Promise(res=>{const id=++rid,t=setTimeout(()=>{waits.delete(id);res({ok:false,err:"timeout"})},15000);waits.set(id,r=>{clearTimeout(t);res(r)});
 try{parent.postMessage(Object.assign({coopix:"maps",op,rid:id},data||{}),"*")}catch(e){waits.delete(id);clearTimeout(t);res({ok:false,err:"err"})}});
addEventListener("message",e=>{if(e.source!==window.parent||!e.data||e.data.coopix!=="maps")return;const f=waits.get(e.data.rid);if(f){waits.delete(e.data.rid);f(e.data)}});

/* ---------- «Карта по коду» ----------
   у каждой карты в облаке есть код из 12 знаков (цифры и буквы A–F, показываем как A1B2-C3D4-E5F6). Его можно показать/скопировать,
   а в меню «🔑 По коду» вставить чужой код: карта найдётся на сервере, добавится в «Авторские» и сразу запустится.
   Длинный код «NC1-…» (из конструктора) тоже подходит — работает и вне маркета. */
const market=inMarket();
const CDR={"cd.btn":"🔑 По коду","cd.title":"Карта по коду","cd.hint":"Вставьте код карты (12 знаков, например A1B2-C3D4-E5F6): карта найдётся и запустится.","cd.ph":"Код карты","cd.go":"Найти и играть","cd.enter":"Введите код карты","cd.bad":"Это не код карты: нужно 12 знаков (цифры и буквы A–F)","cd.nf":"Карта с таким кодом не найдена","cd.finding":"Ищем…","cd.code":"Код этой карты","cd.showHint":"Отправьте код другу: он вставит его в меню «По коду» и сразу сыграет на вашей карте.","cd.copy":"Копировать","cd.copied":"Скопировано","cd.manual":"Код выделен — скопируйте его","cd.close":"Закрыть","cd.key":"Код","cd.noMarket":"Поиск по короткому коду работает в Coopix Market в Telegram. Вставьте длинный код «NC1-…»."},
 CDE={"cd.btn":"🔑 By code","cd.title":"Map by code","cd.hint":"Paste a map code (12 characters, like A1B2-C3D4-E5F6): the map is found and starts.","cd.ph":"Map code","cd.go":"Find and play","cd.enter":"Enter a map code","cd.bad":"That is not a map code: it needs 12 characters (digits and letters A–F)","cd.nf":"No map with this code","cd.finding":"Looking…","cd.code":"This map's code","cd.showHint":"Send the code to a friend: they paste it into the «By code» menu and play your map right away.","cd.copy":"Copy","cd.copied":"Copied","cd.manual":"Code is selected — copy it","cd.close":"Close","cd.key":"Code","cd.noMarket":"Short codes work inside Coopix Market in Telegram. Paste the long «NC1-…» code instead."},
 CDU={"cd.btn":"🔑 За кодом","cd.title":"Мапа за кодом","cd.hint":"Вставте код мапи (12 знаків, наприклад A1B2-C3D4-E5F6): мапа знайдеться й запуститься.","cd.ph":"Код мапи","cd.go":"Знайти й грати","cd.enter":"Введіть код мапи","cd.bad":"Це не код мапи: потрібно 12 знаків (цифри та літери A–F)","cd.nf":"Мапу з таким кодом не знайдено","cd.finding":"Шукаємо…","cd.code":"Код цієї мапи","cd.showHint":"Надішліть код другу: він вставить його в меню «За кодом» і одразу зіграє на вашій мапі.","cd.copy":"Копіювати","cd.copied":"Скопійовано","cd.manual":"Код виділено — скопіюйте його","cd.close":"Закрити","cd.key":"Код","cd.noMarket":"Пошук за коротким кодом працює в Coopix Market у Telegram. Вставте довгий код «NC1-…»."};
for(const L in I18N)Object.assign(I18N[L],L==="ru"||L==="be"?CDR:L==="uk"?CDU:CDE);
const codeOf=id=>String(id).toUpperCase().replace(/(.{4})(?=.)/g,"$1-");
const idOf=v=>{const h=String(v||"").toLowerCase().replace(/[^a-f0-9]/g,"");return h.length===12?h:null};
{const st=document.createElement("style");st.textContent=
 "#menu .codeb{position:absolute;left:33%;bottom:2.6%;width:17%;height:8.6%;font-size:2.8vmin;padding:0}"+
 "@media(orientation:portrait){#menu .mapmk{width:60%}#menu .codeb{left:68%;width:26%;top:66.2%;bottom:auto;height:6.4%;font-size:4vw;padding:0 1vw}}"+
 "#cdBox{position:fixed;inset:0;z-index:95;display:none;align-items:center;justify-content:center;background:rgba(5,10,24,.92);padding:3vmin;box-sizing:border-box}#cdBox.show{display:flex}"+
 ".cdP{width:min(100%,560px);max-height:100%;overflow:auto;background:#16233f;border-radius:2.4vmin;padding:3vmin;box-sizing:border-box;color:#fff;display:flex;flex-direction:column;gap:1.6vmin}"+
 ".cdP h3{margin:0;font-size:max(18px,4vmin)}.cdP p{margin:0;color:#9fb4d8;font-size:max(13px,2.6vmin)}"+
 "#cdIn{width:100%;height:max(44px,8.4vmin);border-radius:1.6vmin;border:.35vmin solid #3a4a6c;background:#0e1a33;color:#fff;font-size:max(16px,3.4vmin);font-weight:700;padding:0 2.4vmin;font-family:inherit;outline:none;box-sizing:border-box;touch-action:auto;user-select:text;-webkit-user-select:text;letter-spacing:.06em}#cdIn:focus{border-color:#2AABEE}"+
 "#cdIn.big{text-align:center;font-size:max(20px,5vmin);color:#9fd8ff}"+
 "#cdM{min-height:max(16px,3vmin);font-size:max(13px,2.6vmin);color:#ffd24a}.cdB{display:flex;gap:1.6vmin;flex-wrap:wrap}.cdB button{flex:1;min-width:28%;height:max(42px,8vmin);font-size:max(14px,3vmin);border-radius:1.6vmin;border:0;color:#fff;font-weight:800;font-family:inherit;background:#2AABEE}.cdB button.navy{background:#2a3d66}.cdB button:disabled{opacity:.6}";
 document.head.appendChild(st)}
let CB=null,cdMode="find";
function cdBox(){if(CB)return CB;const d=document.createElement("div");d.id="cdBox";
 d.innerHTML='<div class="cdP"><h3 id="cdT"></h3><p id="cdH"></p><input id="cdIn" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="30000"><div id="cdM"></div><div class="cdB"><button id="cdGo"></button><button id="cdCp" class="navy"></button><button id="cdX" class="navy"></button></div></div>';
 document.body.appendChild(d);CB=d;
 const $$=i=>d.querySelector("#"+i);
 $$("cdX").onclick=()=>d.classList.remove("show");
 d.addEventListener("click",e=>{if(e.target===d)d.classList.remove("show")});
 $$("cdIn").addEventListener("keydown",e=>{if(e.key==="Enter"&&cdMode==="find"){e.preventDefault();cdFind()}else if(e.key==="Escape")d.classList.remove("show")});
 $$("cdGo").onclick=()=>cdFind();
 $$("cdCp").onclick=async()=>{const i=$$("cdIn"),m=$$("cdM");let ok=false;try{await navigator.clipboard.writeText(i.value);ok=true}catch(e){}
  if(!ok){try{i.focus();i.select();i.setSelectionRange(0,i.value.length);ok=document.execCommand("copy")}catch(e){}}
  m.textContent=ok?T("cd.copied"):T("cd.manual");if(!ok){i.focus();i.select()}};
 return d}
function cdOpen(mode,id){const d=cdBox(),$$=i=>d.querySelector("#"+i),inp=$$("cdIn");cdMode=mode;$$("cdM").textContent="";
 $$("cdX").textContent=T("cd.close");$$("cdGo").textContent=T("cd.go");$$("cdCp").textContent=T("cd.copy");
 if(mode==="find"){$$("cdT").textContent=T("cd.title");$$("cdH").textContent=T("cd.hint");inp.readOnly=false;inp.classList.remove("big");inp.value="";inp.placeholder=T("cd.ph");$$("cdGo").style.display="";$$("cdCp").style.display="none"}
 else{$$("cdT").textContent=T("cd.code");$$("cdH").textContent=T("cd.showHint");inp.readOnly=true;inp.classList.add("big");inp.value=codeOf(id);$$("cdGo").style.display="none";$$("cdCp").style.display=""}
 d.classList.add("show");setTimeout(()=>{inp.focus();if(mode==="show")inp.select()},60)}
let cdBusy=false;
async function cdFind(){if(cdBusy)return;const d=cdBox(),inp=d.querySelector("#cdIn"),msg=d.querySelector("#cdM"),go=d.querySelector("#cdGo"),v=inp.value.trim();
 if(!v){msg.textContent=T("cd.enter");return}
 let mp=null,src=null,by="";
 if(/^NC1-/i.test(v)){mp=parseCode(v);if(!mp){msg.textContent=T("mk.badCode");return}}
 else{const id=idOf(v);if(!id){msg.textContent=T("cd.bad");return}
  if(!market){msg.textContent=T("cd.noMarket");return}
  cdBusy=true;go.disabled=true;msg.textContent=T("cd.finding");
  try{const r=await ask("get",{id});
   if(!r.ok){msg.textContent=r.err==="not_found"?T("cd.nf"):T(r.err==="rate_limit"?"cl.rate":"cl.fail");return}
   mp=parseCode(r.item.code);if(!mp){msg.textContent=T("cl.bad");return}
   mp.name=String(r.item.name||mp.name).slice(0,40);src=id;by=r.item.mine?"":String(r.item.by||"")}
  finally{cdBusy=false;go.disabled=false}}
 const have=src?MY.find(x=>x.src===src||x.cid===src):MY.find(x=>mapCode(x)===mapCode(mp)),m=have||mp;
 if(!have){if(src)mp.src=src;MY.unshift(mp);saveMy()}
 syncCustom();const i=customIdx(m.id);
 if(!(i>=BASE_MAPS&&(MAPS[i].bars.length||MAPS[i].spawns.length))){msg.textContent=T("cl.bad");return}
 d.classList.remove("show");mapIdx=i;si=0;EDIT.testing=null;startGame();flash(by?T("cl.from",by)+": "+m.name:T("cl.got",m.name),"#9fd8ff",3200)}
{const b=document.createElement("button");b.id="mCode";b.className="red dark codeb";$("menu").appendChild(b);
 const lab=()=>{b.textContent=T("cd.btn")};lab();b.onclick=()=>cdOpen("find");
 const _mt=typeof moreTxt==="function"?moreTxt:null;if(_mt)moreTxt=function(){_mt();lab()}}
if(!market)return; /* вне маркета (просто файл) облака нет: работает только длинный код NC1-… */

/* ---------- облачные слоты ---------- */
const CL={items:[],max:3,tried:false,busy:false};
async function refreshCloud(){const r=await ask("list");CL.tried=true;if(r.ok){CL.items=r.items||[];CL.max=r.max||3}return r.ok}
const errText=r=>T(r.err==="limit"?"cl.limit":r.err==="too_big"?"cl.big":r.err==="bad_map"?"cl.bad":r.err==="rate_limit"?"cl.rate":"cl.fail");
const shareText=name=>T("cl.shareText",name);
/* сохранить карту в облако (новую или обновить свою) → { ok, item } */
async function putLocal(m){
 const code=mapCode(m);let r;
 if(m.cid&&CL.items.some(x=>x.id===m.cid))r=await ask("put",{id:m.cid,code});else r=await ask("put",{code});
 if(!r.ok&&r.err==="not_found"&&m.cid){m.cid=null;r=await ask("put",{code})} /* облачной копии уже нет — кладём заново */
 if(r.ok){m.cid=r.item.id;saveMy();await refreshCloud()}
 return r}

/* ---------- экран «Конструктор карт»: кнопка «Поделиться» у каждой карты и блок «Облако» ---------- */
function decorate(){
 const body=$("mkBody");if(!body)return;
 const cards=[...body.querySelectorAll(".card")].filter(c=>c.querySelector(".mkBtns"));
 cards.forEach((c,i)=>{const m=MY[i];if(!m)return;const row=c.querySelector(".mkBtns"),b=document.createElement("button");b.className="mini alt";b.dataset.a="share";b.textContent="\u{1F517} "+T("cl.share");
  b.onclick=async()=>{if(CL.busy)return;CL.busy=true;b.disabled=true;
   try{const r=await putLocal(m);if(!r.ok){flashMk(errText(r));return}
    const s=await ask("share",{id:r.item.id,text:shareText(r.item.name)});if(s.ok)flashMk(T("cl.sent"));renderMyMaps()}
   finally{CL.busy=false;b.disabled=false}};
  row.insertBefore(b,row.firstChild); const kb=document.createElement("button");kb.className="mini alt";kb.dataset.a="code";kb.textContent="🔑 "+T("cd.key");
  kb.onclick=async()=>{if(CL.busy)return;CL.busy=true;kb.disabled=true;try{const r=await putLocal(m);if(!r.ok){flashMk(errText(r));return}cdOpen("show",r.item.id);renderMyMaps()}finally{CL.busy=false;kb.disabled=false}};
  row.insertBefore(kb,row.firstChild);});
 /* блок «Облако» сразу под строкой «Новая карта / Вставить код» */
 const top=body.querySelector(".mkTop"),box=document.createElement("div");box.className="card";
 let h='<div class="row"><div><h3>☁ '+T("cl.title")+" "+CL.items.length+" / "+CL.max+"</h3>"+(CL.items.length?"":"<p>"+T("cl.empty")+"</p>")+"</div></div>";
 box.innerHTML=h;
 for(const it of CL.items){const r=document.createElement("div");r.className="row";r.style.marginTop="1vmin";
  r.innerHTML='<div><h3 style="font-size:2.6vmin">'+esc(it.name)+"</h3><p>"+T("mk.pieces",it.pieces)+" · 🔑 "+codeOf(it.id)+'</p></div><div class="mkBtns"><button class="mini alt" data-a="k">🔑</button><button class="mini alt" data-a="s">\u{1F517}</button><button class="mini alt" data-a="t">⬇ '+T("cl.take")+'</button><button class="mini alt" data-a="d">\u{1F5D1}</button></div>';
  r.querySelector("[data-a=k]").onclick=()=>cdOpen("show",it.id);
  r.querySelector("[data-a=s]").onclick=async()=>{const s=await ask("share",{id:it.id,text:shareText(it.name)});if(!s.ok)flashMk(errText(s))};
  r.querySelector("[data-a=t]").onclick=async()=>{
   if(MY.some(x=>x.cid===it.id||x.src===it.id)){flashMk(T("cl.have"));return}
   const g=await ask("get",{id:it.id});if(!g.ok){flashMk(errText(g));return}
   const mp=parseCode(g.item.code);if(!mp){flashMk(T("cl.bad"));return}
   mp.cid=it.id;MY.unshift(mp);saveMy();syncCustom();renderMyMaps();flashMk(T("cl.got",mp.name))};
  r.querySelector("[data-a=d]").onclick=async function(){if(!this.dataset.ok){this.dataset.ok=1;this.textContent=T("cl.del")+"?";return}
   const d=await ask("del",{id:it.id});if(!d.ok){flashMk(errText(d));return}
   for(const x of MY)if(x.cid===it.id)x.cid=null;saveMy();await refreshCloud();renderMyMaps()};
  box.appendChild(r)}
 if(top)top.after(box);else body.prepend(box)}
const _rm=renderMyMaps;
renderMyMaps=function(){_rm();decorate();if(!CL.tried&&!CL.busy){CL.busy=true;refreshCloud().then(()=>{CL.busy=false;if(screen==="mk")renderMyMaps()})}};

/* ---------- карта по ссылке: добавить в «Авторские» и сразу запустить ---------- */
const M=window.__CPX_MAP;
if(M&&M.code){const mp=parseCode(M.code);
 if(mp){const have=MY.find(x=>x.src===M.id||x.cid===M.id),m=have||mp;
  if(!have){mp.name=String(M.name||mp.name).slice(0,40);mp.src=M.id;MY.unshift(mp);saveMy()}
  syncCustom();const i=customIdx(m.id);
  if(i>=BASE_MAPS&&(MAPS[i].bars.length||MAPS[i].spawns.length)){setTimeout(()=>{mapIdx=i;si=0;EDIT.testing=null;startGame();flash(M.by&&!M.mine?T("cl.from",M.by)+": "+m.name:T("cl.got",m.name),"#9fd8ff",3200)},400)}}}
});
