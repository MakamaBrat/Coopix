"""Заливает файлы игр из games/ прямо в Supabase (таблица games, поле file_html) — без SQL Editor.

Нужен файл .env.txt (или .env) в корне проекта (он в .gitignore, в git не попадёт):
    SUPABASE_URL=https://<проект>.supabase.co
    SUPABASE_SERVICE_KEY=<ключ service_role>
Те же значения, что в настройках Vercel (Settings → Environment Variables).

Запуск:  python scripts/upload_games.py            — все игры
         python scripts/upload_games.py stickfight — только указанные
После записи скрипт скачивает файл обратно и сверяет с исходником. Ключ нигде не печатается.
"""
import json, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES = {
    "gravity": "games/gravity/GravityFight.html",
    "metro": "games/metro/MetroRunner.html",
    "stickfight": "games/stickfight/StickFight.html",
    "unik": "games/unik/Unik_Karty_opt.html",
}


def env():
    vals = {}
    for name in (".env.txt", ".env"):
        p = os.path.join(ROOT, name)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding="utf-8-sig"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                if v:
                    vals.setdefault(k.strip(), v)
    url = (os.environ.get("SUPABASE_URL") or vals.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or vals.get("SUPABASE_SERVICE_KEY") or ""
    if not url.startswith("https://") or not key:
        sys.exit("Нет SUPABASE_URL / SUPABASE_SERVICE_KEY: заполните файл .env.txt в корне проекта.")
    return url, key


def req(method, url, key, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method, headers={
        "apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def main():
    url, key = env()
    ids = sys.argv[1:] or list(GAMES)
    bad = [i for i in ids if i not in GAMES]
    if bad:
        sys.exit("Неизвестные игры: " + ", ".join(bad) + ". Есть: " + ", ".join(GAMES))
    ok_all = True
    for gid in ids:
        html = open(os.path.join(ROOT, GAMES[gid]), encoding="utf-8", newline="").read()
        st, out = req("PATCH", f"{url}/rest/v1/games?id=eq.{gid}", key,
                      {"file_html": html, "updated_at": datetime.now(timezone.utc).isoformat()})
        if st not in (200, 204):
            print(f"{gid}: ОШИБКА записи {st}: {out[:300].decode('utf-8', 'replace')}"); ok_all = False; continue
        st, out = req("GET", f"{url}/rest/v1/games?id=eq.{gid}&select=file_html", key)
        rows = json.loads(out) if st == 200 else []
        got = rows[0]["file_html"] if rows else None
        if got == html:
            print(f"{gid}: ГОТОВО, в базе новая версия ({len(html)} символов)")
        else:
            print(f"{gid}: НЕ СОВПАЛО после записи (в базе {len(got) if got else 'нет строки'}, нужно {len(html)})"); ok_all = False
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
