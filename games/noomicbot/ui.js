/* ---------- Единый тёмный интерфейс: чёрные кнопки, контрастные рамки, компактное меню паузы (портрет и горизонталь).
   Вставляется скриптом scripts/build_noomic_plus.py после skins.js (до i18n.js): только добавляет стили поверх остальных. ---------- */
{const st=document.createElement("style");st.textContent=
/* кнопки: чёрные, с тонкой светлой рамкой; выбранные — белая рамка */
"button.red,button.navy,button.red.dark{border:1px solid #3b3b46!important;box-shadow:inset 0 1px 0 #ffffff14;color:#fff}"+
"button.red:active,button.navy:active{background:#2c2c34!important}"+
"button.red.on,button.navy.on,#maps .tabs button.on{border-color:#fff!important;background:#23232b!important}"+"#maps .list .it{border:1px solid transparent;border-radius:1.6vmin}#maps .list .it.on{background:#fff!important;color:#000!important}#maps .list .it.on *{color:#000}#maps .list .it:active{background:#26262e}"+
"#menu .ttl{color:#fff!important;text-shadow:0 .5vmin 0 #000,0 0 2.4vmin #000a}#menu .ver{color:#e4e4ea!important;text-shadow:0 0 1vmin #000}"+
/* меню паузы: тёмные панели вместо светло-серых */
"#pause{background:#000000a6!important}"+
"#pause .pn{background:#101015f2!important;border:1px solid #30303a!important;border-radius:2.2vmin!important;box-shadow:0 1vmin 4vmin #000a}"+
".ctl{background:#1a1a21!important;border:1px solid #2e2e38;border-radius:1.8vmin!important}"+
".ctl .h{background:transparent!important;color:#b4b4c0!important;font-size:max(11px,2.3vmin)!important;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:1.1vmin 1.4vmin 0!important;text-align:left!important}"+
".ctl .b button{background:#26262f!important;color:#fff!important;border-radius:1.4vmin!important;border:1px solid #3a3a45!important}"+
".ctl .b button:active{background:#3a3a46!important}"+
".ctl .b span{color:#fff!important;font-style:normal!important;font-weight:800}"+
"#pHome,#pCam{border-radius:1.8vmin!important}#pX{background:#0d0d11!important;border:1px solid #fff5!important;color:#fff!important}"+
/* портрет: отступ сверху уже даёт сам экран */
"@media(orientation:portrait){#pL{margin-top:2.4vw!important;padding-top:3vw!important}#pause .pn{width:94%!important;padding:2.4vw!important}.ctl .b span{font-size:4.2vw}.ctl{margin-bottom:0!important}.ctl .b{height:10vw!important}.ctl .b button{width:10vw!important;height:8.4vw!important;font-size:6vw!important}#pLc,#pC{display:grid;grid-template-columns:1fr 1fr;gap:2vw}#pLc .ctl:first-child,#pLc .ctl:last-child{grid-column:1/3}#pL .hdrow{margin-bottom:2vw}#pL .hdrow button{height:12vw!important}#pR{margin-bottom:26vw!important}}"+
/* горизонталь: три колонки в одну линию, всё помещается без прокрутки */
"@media(orientation:landscape){"+
"#pause.open{display:grid!important;grid-template-columns:1.25fr 1fr .8fr;gap:1.6vmin;align-content:start;align-items:start;padding:1.6vmin calc(env(safe-area-inset-right) + 1.6vmin) 1.6vmin calc(env(safe-area-inset-left) + 1.6vmin)}"+
"#pause .pn{position:relative!important;left:auto!important;right:auto!important;top:auto!important;width:auto!important;height:auto!important;margin:0!important;padding:1.4vmin!important}"+
"#pL{padding-top:1.4vmin!important;margin:0!important}#pL .hdrow{display:flex!important;flex-direction:row!important;gap:1.2vmin!important;margin-bottom:1.2vmin}#pL .hdrow button{flex:1!important;height:10vmin!important;font-size:4vmin!important}#pHome{flex:2.4!important;font-size:4.2vmin!important}"+
"#pL #pLc{display:grid;grid-template-columns:1fr 1fr;gap:1.1vmin}#pL #pLc .ctl:first-child,#pL #pLc .ctl:last-child{grid-column:1/3}"+
".ctl{margin-bottom:0!important}.ctl .b{height:8.2vmin!important;padding:0 .8vmin!important}.ctl .b button{width:8vmin!important;height:6.4vmin!important;font-size:4.6vmin!important}#pL .ctl .b button{width:6.4vmin!important;font-size:4vmin!important}.ctl .b span{font-size:3.2vmin!important}"+
"#pC{margin-top:0!important}#pC .ctl,#pR .ctl{margin-bottom:1.1vmin!important}"+
"#pX{position:absolute!important;left:auto!important;bottom:auto!important;right:calc(env(safe-area-inset-right) + 1.6vmin)!important;top:1.6vmin!important;width:11vmin!important;height:11vmin!important;font-size:6vmin!important;z-index:5}"+
"#pause #pR{margin-top:13.6vmin!important}}";
document.head.appendChild(st)}
