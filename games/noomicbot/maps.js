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
if(!inMarket())return; /* вне маркета (просто файл) облака нет — остаётся копирование кода карты */

/* ---------- обмен с маркетом ---------- */
let rid=0;const waits=new Map();
const ask=(op,data)=>new Promise(res=>{const id=++rid,t=setTimeout(()=>{waits.delete(id);res({ok:false,err:"timeout"})},15000);waits.set(id,r=>{clearTimeout(t);res(r)});
 try{parent.postMessage(Object.assign({coopix:"maps",op,rid:id},data||{}),"*")}catch(e){waits.delete(id);clearTimeout(t);res({ok:false,err:"err"})}});
addEventListener("message",e=>{if(e.source!==window.parent||!e.data||e.data.coopix!=="maps")return;const f=waits.get(e.data.rid);if(f){waits.delete(e.data.rid);f(e.data)}});

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
  row.insertBefore(b,row.firstChild)});
 /* блок «Облако» сразу под строкой «Новая карта / Вставить код» */
 const top=body.querySelector(".mkTop"),box=document.createElement("div");box.className="card";
 let h='<div class="row"><div><h3>☁ '+T("cl.title")+" "+CL.items.length+" / "+CL.max+"</h3>"+(CL.items.length?"":"<p>"+T("cl.empty")+"</p>")+"</div></div>";
 box.innerHTML=h;
 for(const it of CL.items){const r=document.createElement("div");r.className="row";r.style.marginTop="1vmin";
  r.innerHTML='<div><h3 style="font-size:2.6vmin">'+esc(it.name)+"</h3><p>"+T("mk.pieces",it.pieces)+'</p></div><div class="mkBtns"><button class="mini alt" data-a="s">\u{1F517}</button><button class="mini alt" data-a="t">⬇ '+T("cl.take")+'</button><button class="mini alt" data-a="d">\u{1F5D1}</button></div>';
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
