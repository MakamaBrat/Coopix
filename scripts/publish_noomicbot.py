"""Публикует Noomic Bot в магазин: бесплатная, скачивание запрещено, с мини-игрой для «телевизора» (tv.html).
Запуск: python scripts/publish_noomicbot.py   (нужен .env.txt, как для upload_games.py). Повторный запуск обновляет игру."""
import base64, hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_games import env, req, ROOT

def rd(p, mode="r"):
    f = os.path.join(ROOT, "games", "noomicbot", p)
    return open(f, "rb").read() if mode == "b" else open(f, encoding="utf-8", newline="").read()

def jpg(p):
    return "data:image/jpeg;base64," + base64.b64encode(rd(p, "b")).decode()

cover = jpg("cover.jpg")
row = {
    "id": "noomicbot", "title": "Noomic Bot", "tags": ["Sport", "Physics"],
    "description": "Физический симулятор гимнаста: раскачивайся на турнике, отпускай в нужный момент, летай между снарядами и хватайся за следующий.\nУправляй прогибом, группировкой и винтами. На «телевизоре» доступна мини-версия, полная игра с картами, заданиями и конструктором карт.",
    "changes": "Первая версия", "version": "2.5.8", "author_name": "Coopix",
    "item": "floppy", "cover": "img:" + hashlib.sha256(cover.encode()).hexdigest()[:12], "cover_img": cover,
    "shot_img": jpg("shot.jpg"), "access": "public", "sort": 6,
    "play_kind": "auto", "play_html": rd("tv.html"), "file_html": rd("NoomicBot.html"),
    "dl_off": True, "price": 0,
}
url, key = env()
st, out = req("POST", f"{url}/rest/v1/games", key, row)
if st == 409:  # уже есть — обновляем
    st, out = req("PATCH", f"{url}/rest/v1/games?id=eq.noomicbot", key, {k: v for k, v in row.items() if k != "id"})
if st not in (200, 201, 204):
    sys.exit(f"ОШИБКА {st}: {out[:400].decode('utf-8','replace')}")
st, out = req("GET", f"{url}/rest/v1/games?id=eq.noomicbot&select=title,price,dl_off,access,has_play,has_file,has_shot", key)
print("ГОТОВО:", out.decode())
