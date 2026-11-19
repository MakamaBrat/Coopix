/* Noomic Bot: перехваты и рекорд серии хранятся на сервере (таблица game_stats), а не только в сохранении игры.
   Вставляется в основной скрипт игры скриптом scripts/build_noomic_plus.py (после gestures.js, до maps.js).
   Как это работает: при запуске маркет кладёт значения с сервера в window.__CPX_STATS — игра берёт большее из своего и серверного.
   Когда перехваты или рекорд растут, игра раз в несколько секунд присылает маркету {coopix:"stats", regrabs, best}; маркет пишет их на сервер
   (сервер только копит, числа не уменьшаются) и отвечает сохранёнными значениями. Пишется только при росте, поэтому нагрузка на базу минимальная. */
{
const inMarket=()=>{try{return !!window.parent&&window.parent!==window}catch(e){return false}};
const S0=window.__CPX_STATS;
if(S0){SAVE.regrabs=Math.max(SAVE.regrabs|0,+S0.regrabs||0);SAVE.bestRG=Math.max(SAVE.bestRG|0,+S0.best||0)}
if(inMarket()){
 let sent={r:+(S0&&S0.regrabs)||0,b:+(S0&&S0.best)||0},timer=0,last=0;
 const dirty=()=>(SAVE.regrabs|0)!==sent.r||(SAVE.bestRG|0)!==sent.b;
 const flush=()=>{timer=0;if(!dirty())return;sent={r:SAVE.regrabs|0,b:SAVE.bestRG|0};last=Date.now();try{parent.postMessage({coopix:"stats",regrabs:sent.r,best:sent.b},"*")}catch(e){}};
 const schedule=()=>{if(timer)return;timer=setTimeout(flush,Math.max(3000,8000-(Date.now()-last)))};
 const _p=persist;persist=function(){_p();if(dirty())schedule()};
 addEventListener("message",e=>{if(e.source!==window.parent||!e.data||e.data.coopix!=="stats"||!e.data.ok)return;
  const r=+e.data.regrabs||0,b=+e.data.best||0;sent={r:Math.max(sent.r,r),b:Math.max(sent.b,b)};
  if(r>(SAVE.regrabs|0)||b>(SAVE.bestRG|0)){SAVE.regrabs=Math.max(SAVE.regrabs|0,r);SAVE.bestRG=Math.max(SAVE.bestRG|0,b);try{persist()}catch(x){}}});
 document.addEventListener("visibilitychange",()=>{if(document.hidden)flush()});
 setTimeout(()=>{if(dirty())schedule()},4000); /* первая отправка: прогресс, накопленный до серверного хранения */
}
}
