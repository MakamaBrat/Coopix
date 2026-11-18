"""Публикует Snow Rider в магазин: платная (5 звёзд Telegram), только играть (dl_off), с мини-игрой для «телевизора» (tv.html).
Запуск: python scripts/publish_snowrider.py   (нужен .env.txt, как для upload_games.py). Повторный запуск обновляет игру."""
import base64, hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_games import env, req, ROOT

def rd(p, mode="r"):
    f = os.path.join(ROOT, "games", "snowrider", p)
    return open(f, "rb").read() if mode == "b" else open(f, encoding="utf-8", newline="").read()

def jpg(p):
    return "data:image/jpeg;base64," + base64.b64encode(rd(p, "b")).decode()

cover = jpg("cover.jpg")
row = {
    "id": "snowrider", "title": "Snow Rider", "tags": ["Racing", "Arcade"],
    "description": "Гонка по снежным холмам: газуй, лови трамплины, собирай монеты и не переверни машину.\nВ магазине на «телевизоре» доступна бесплатная мини-версия, полная игра стоит 5 звёзд.",
    "changes": "Первая версия", "version": "1.0", "author_name": "Coopix",
    "item": "cassette", "cover": "img:" + hashlib.sha256(cover.encode()).hexdigest()[:12], "cover_img": cover,
    "shot_img": jpg("shot.jpg"), "access": "public", "sort": 5,
    "play_kind": "auto", "play_html": rd("tv.html"), "file_html": rd("SnowRider.html"),
    "dl_off": True, "price": 5,
}
url, key = env()
st, out = req("POST", f"{url}/rest/v1/games", key, row)
if st == 409:  # уже есть — обновляем
    st, out = req("PATCH", f"{url}/rest/v1/games?id=eq.snowrider", key, {k: v for k, v in row.items() if k != "id"})
if st not in (200, 201, 204):
    sys.exit(f"ОШИБКА {st}: {out[:400].decode('utf-8','replace')}")
st, out = req("GET", f"{url}/rest/v1/games?id=eq.snowrider&select=title,price,dl_off,access,has_play,has_file,has_shot", key)
print("ГОТОВО:", out.decode())
