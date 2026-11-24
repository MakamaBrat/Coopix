"""Собирает games/noomicbot/NoomicBot.html = NoomicBot.base.html + plus.js (новые предметы, переломы, турбины, монеты) + кнопки турбин + жесты + скины + хранилище.
Запуск: python scripts/build_noomic_plus.py            — боевая сборка в games/noomicbot/NoomicBot.html
        python scripts/build_noomic_plus.py --debug PATH — тестовая сборка (с отладочными хуками) по указанному пути"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "games", "noomicbot")
FRAC_V, TURBO_L, TURBO_A = 15, 9, 6.6

SHIM = """<script>(function(){var D=window.__CPX_SAVE;try{window.localStorage.getItem("__t");return}catch(e){}
if(!D||typeof D!=="object")D={};var tm=0,dirty={};
function flush(){clearTimeout(tm);var o={},any=false;for(var k in dirty){o[k]=Object.prototype.hasOwnProperty.call(D,k)?D[k]:null;any=true}dirty={};if(any){try{parent.postMessage({coopix:"save",data:o},"*")}catch(e){}}}
function post(k){dirty[k]=1;clearTimeout(tm);tm=setTimeout(flush,120)}
var shim={getItem:function(k){return Object.prototype.hasOwnProperty.call(D,k)?D[k]:null},setItem:function(k,v){D[k]=String(v);post(k)},removeItem:function(k){delete D[k];post(k)},clear:function(){for(var k in D){delete D[k];post(k)}},key:function(i){return Object.keys(D)[i]||null}};
Object.defineProperty(shim,"length",{get:function(){return Object.keys(D).length}});
try{Object.defineProperty(window,"localStorage",{get:function(){return shim},configurable:true})}catch(e){}
addEventListener("pagehide",flush);document.addEventListener("visibilitychange",function(){if(document.hidden)flush()});})();</script>
"""
BTNS = '<button class="zone tb" id="zTurboL" data-k="turboL">Турбины ног</button><button class="zone tb" id="zTurboA" data-k="turboA">Турбины рук</button>\n'

def skins_json():
    """Скины персонажа: games/noomicbot/skins/skins.json (id + названия) и файлы <id>.png → список с data-URI."""
    import base64
    meta = json.load(open(os.path.join(D, "skins", "skins.json"), encoding="utf-8"))
    out = []
    for m in meta:
        raw = open(os.path.join(D, "skins", m["id"] + ".png"), "rb").read()
        out.append({"id": m["id"], "ru": m["ru"], "en": m["en"], "u": "data:image/png;base64," + base64.b64encode(raw).decode()})
    return json.dumps(out, ensure_ascii=False)



# чёрная тема интерфейса: синие кнопки и фоны -> нейтральный тёмный (цвета предметов в списках НЕ трогаем: их нет в карте)
THEME = {
    "#2aabee": "#0d0d11", "#52bdf4": "#2c2c34", "#1d7fb8": "#18181d", "#243557": "#1b1b21", "#135d86": "#0b0b0e",
    "#0d4f78": "#09090c", "#0f1a30": "#09090c", "#1b2a4a": "#17171c", "#22335a": "#1f1f26", "#2a3d66": "#26262d",
    "#2c3f6e": "#2c2c34", "#3a4a6c": "#3c3c46", "#14213d": "#101014", "#16233f": "#101014", "#10203a": "#0c0c10",
    "#0e1a33": "#0c0c10", "#1b2b4b": "#15151a", "#060c1c": "#050507", "#2f4678": "#30303a", "#2b4270": "#2c2c34",
    "#9fb0d0": "#b6b6c1", "#9fb4e0": "#b6b6c1", "#9fb4d8": "#b6b6c1", "#c4d0ea": "#d0d0d9", "#8a98b8": "#8f8f9a",
    "#7f93b8": "#8f8f9a", "#79b4f3": "#c8c8d2", "#9fd8ff": "#e4e4ea", "#cfe3ff": "#dcdce4",
    "#d6d6d6": "#14141a", "#d9d9d9": "#14141a", "#e8e8e8": "#1c1c22",
}
def theme(t):
    import re
    return re.sub(r"#[0-9a-fA-F]{6}(?![0-9a-fA-F])", lambda m: THEME.get(m.group(0).lower(), m.group(0)), t)

def theme_base(s):
    import re
    return re.sub(r"<style>.*?</style>", lambda m: theme(m.group(0)), s, flags=re.S)

def build(debug=None):
    s = theme_base(open(os.path.join(D, "NoomicBot.base.html"), encoding="utf-8", newline="").read())
    js = open(os.path.join(D, "plus.js"), encoding="utf-8").read()
    prices = json.load(open(os.path.join(D, "items.json"), encoding="utf-8"))
    js = js.replace("NC_STAR_PRICES", json.dumps(prices))
    js = js.replace("NC_FRAC_V", str(FRAC_V)).replace("NC_TURBO_L", str(TURBO_L)).replace("NC_TURBO_A", str(TURBO_A))
    js = js.replace("NC_DBG", "(window.__dbg=window.__dbg||[])" if debug else "null")
    if debug:
        js = js.rstrip()[:-1] + "\nwindow.__nc={get W(){return W},SAVE,persist,show:x=>show(x),startGame:i=>startGame(i),look,applySettings,renderShop,setKey,get FX(){return FX},FRAC:()=>FRAC_V_DBG};\n}\n"
        js = js.replace("FRAC_V_DBG", str(FRAC_V))
    vp = os.path.join(D, "vice.js")
    if False and os.path.exists(vp):  # карты «Супер экстрим» (Vice) удалены: ~0.9 МБ ассетов не грузим
        assets = open(os.path.join(D, "vice_assets.json"), encoding="utf-8").read()
        js = js + "\n" + open(vp, encoding="utf-8").read().replace("NC_VICE_ASSETS", assets)
    gp = os.path.join(D, "gestures.js")
    if os.path.exists(gp):
        js = js + "\n" + open(gp, encoding="utf-8").read()
    stp = os.path.join(D, "stats.js")
    if os.path.exists(stp):
        js = js + "\n" + open(stp, encoding="utf-8").read()
    mp = os.path.join(D, "maps.js")
    if os.path.exists(mp):
        js = js + "\n" + open(mp, encoding="utf-8").read()
    sp = os.path.join(D, "skins.js")
    if os.path.exists(sp):
        js = js + "\n" + open(sp, encoding="utf-8").read().replace("NC_SKINS", skins_json()).replace("NC_SKDBG", "true" if debug else "false")
    up = os.path.join(D, "ui.js")
    if os.path.exists(up):
        js = js + "\n" + open(up, encoding="utf-8").read()
    pp = os.path.join(D, "props.js")
    if os.path.exists(pp):
        js = js + "\n" + open(pp, encoding="utf-8").read()
    ip = os.path.join(D, "i18n.js")
    if os.path.exists(ip):
        js = js + "\n" + open(ip, encoding="utf-8").read()
    js = theme(js)
    # 1) кнопки турбин
    a = '<button class="zone" id="zArch" data-k="arch">'
    assert s.count(a) == 1
    s = s.replace(a, BTNS + a)
    # 2) хранилище для изолированного окна — в самое начало head
    a = '<meta charset="utf-8">'
    assert s.count(a) == 1
    ERR = '<script>window.__errs=[];addEventListener("error",function(e){__errs.push(e.message+" @"+e.lineno+":"+e.colno)})</script>\n' if debug else ""
    s = s.replace(a, a + "\n" + ERR + SHIM, 1)
    # 3) основной патч — перед созданием игры
    a = 'addEventListener("resize",resize);let W=new Game(MAPS)'
    assert s.count(a) == 1
    s = s.replace(a, "/*NOOMI_PLUS_START*/" + js + "/*NOOMI_PLUS_END*/" + a)
    return s

def write_server_prices():
    prices = json.load(open(os.path.join(D, "items.json"), encoding="utf-8"))
    lines = [
        "/** Цены предметов внутри игр в звёздах Telegram (1–3 на предмет, задаются в games/noomicbot/items.json). Сервер сверяет цену с этой таблицей, клиенту не верит.",
        " * Генерируется scripts/build_noomic_plus.py из games/noomicbot/items.json. */",
        "export const ITEM_PRICES = {",
        "  noomicbot: {",
        ",\n".join("    %s: %s" % (k, v) for k, v in prices.items()),
        "  },",
        "};",
        "export const itemPrice = (game, item) => Number(ITEM_PRICES[game]?.[item]) || 0;",
        "",
    ]
    open(os.path.join(ROOT, "api", "_lib", "items.js"), "w", encoding="utf-8", newline="").write("\n".join(lines))


if __name__ == "__main__":
    write_server_prices()
    dbg = None
    if "--debug" in sys.argv:
        dbg = sys.argv[sys.argv.index("--debug") + 1]
    out = build(bool(dbg))
    path = dbg or os.path.join(D, "NoomicBot.html")
    open(path, "w", encoding="utf-8", newline="").write(out)
    print("OK", path, len(out))
