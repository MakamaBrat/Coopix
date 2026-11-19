"""Публикует «Boards Games» (Party4: Шпион, Мафия, Бутылочка, Бомбочка) в магазин: бесплатная, скачивание запрещено.
Исходник лежит в games/party4/src (index.html + папка img). Игра работает в изолированном окне, где относительные пути к
картинкам не открываются, поэтому build() вшивает все картинки в один HTML (data:-ссылки) и сохраняет его как games/party4/Party4.html.
Запуск: python scripts/publish_party4.py   (нужен .env.txt, как для upload_games.py). Повторный запуск обновляет игру."""
import base64, hashlib, io, json, os, re, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_games import env, req, ROOT

D = os.path.join(ROOT, "games", "party4")
SRC = os.path.join(D, "src")
# максимальная сторона картинки (экономим вес файла игры): крупные оформительские картинки уменьшаем
MAXSIDE = {"hero.webp": 960, "logo.webp": 760, "table.webp": 900, "card.png": 520}

def data_uri(rel):
    im = Image.open(os.path.join(SRC, "img", rel))
    k = MAXSIDE.get(rel)
    if k and max(im.size) > k:
        s = k / max(im.size)
        im = im.resize((round(im.size[0] * s), round(im.size[1] * s)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=82, method=6, alpha_quality=92)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()

def build():
    html = open(os.path.join(SRC, "index.html"), encoding="utf-8", newline="").read()
    imgs = {}
    for root, _, files in os.walk(os.path.join(SRC, "img")):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), os.path.join(SRC, "img")).replace("\\", "/")
            imgs[rel] = data_uri(rel)
    def rep(a, b, cnt=1):
        nonlocal html
        assert html.count(a) == cnt, (a, html.count(a))
        html = html.replace(a, b)
    table = imgs.pop("table.webp")
    rep("url(img/table.webp)", f"url({table})")
    rep('src="img/card.png"', "src=\"${IM['card.png']}\"")
    rep('src="img/logo.webp"', "src=\"${IM['logo.webp']}\"")
    rep('src="img/hero.webp"', "src=\"${IM['hero.webp']}\"")
    rep('src="img/flame_c.webp"', "src=\"${IM['flame_c.webp']}\"")
    imgs.pop("card.png", None); imgs["card.png"] = data_uri("card.png")
    imgs = {k: v for k, v in imgs.items() if k.startswith("s/") or k in ("card.png", "logo.webp", "hero.webp", "flame_c.webp")}
    rep("const sp = n => `img/s/${n}.webp`;", "const IM = " + json.dumps(imgs, separators=(",", ":")) + ";\nconst sp = n => IM['s/' + n + '.webp'];")
    left = re.findall(r"img/[A-Za-z0-9_/.\-]+", html.replace("const IM", ""))
    assert not left, left
    return html

def build_tv():
    """Мини-версия «Бомбочка» для «телевизора»: tv.src.html + картинки героев (tv_assets.json) -> games/party4/tv.html"""
    a = json.load(open(os.path.join(D, "tv_assets.json"), encoding="utf-8"))
    t = open(os.path.join(D, "tv.src.html"), encoding="utf-8", newline="").read()
    assert t.count("/*AV*/[]") == 1 and t.count('/*FLAME*/""') == 1
    t = t.replace("/*AV*/[]", json.dumps(a["av"], separators=(",", ":"))).replace('/*FLAME*/""', json.dumps(a["flame"]))
    assert len(t) < 300000, len(t)
    open(os.path.join(D, "tv.html"), "w", encoding="utf-8", newline="").write(t)
    return t


if __name__ == "__main__":
    html = build()
    tv = build_tv()
    print("TV", len(tv))
    out = os.path.join(D, "Party4.html")
    open(out, "w", encoding="utf-8", newline="").write(html)
    print("OK", out, len(html))
    if "--build-only" in sys.argv:
        sys.exit(0)

    def jpg(p):
        return "data:image/jpeg;base64," + base64.b64encode(open(os.path.join(D, p), "rb").read()).decode()
    cover = jpg("cover.jpg")
    row = {
        "id": "party4", "title": "Boards Games", "tags": ["Party", "Board"],
        "description": "Вечеринка на одном телефоне: Шпион, Мафия, Бутылочка и Бомбочка.\nДобавь друзей, выбирай игру и передавай телефон по кругу: роли, таймер, голосование и общий счёт очков.",
        "changes": "Первая версия", "version": "1.0", "author_name": "Coopix",
        "item": "floppy", "cover": "img:" + hashlib.sha256(cover.encode()).hexdigest()[:12], "cover_img": cover,
        "shot_img": jpg("shot.jpg"), "access": "public", "sort": 7,
        "play_kind": "auto", "play_html": tv, "file_html": html, "dl_off": True, "price": 0,
    }
    url, key = env()
    st, res = req("POST", f"{url}/rest/v1/games", key, row)
    if st == 409:  # уже есть — обновляем
        st, res = req("PATCH", f"{url}/rest/v1/games?id=eq.party4", key, {k: v for k, v in row.items() if k != "id"})
    if st not in (200, 201, 204):
        sys.exit(f"ОШИБКА {st}: {res[:400].decode('utf-8','replace')}")
    st, res = req("GET", f"{url}/rest/v1/games?id=eq.party4&select=title,price,dl_off,access,has_play,has_file,has_shot", key)
    print("ГОТОВО:", res.decode())
