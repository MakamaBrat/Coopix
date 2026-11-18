"""Выполняет SQL-файл в базе Supabase через Management API (как SQL Editor) — без копирования в браузер.

Нужен в .env.txt (или .env) в корне проекта, файл в .gitignore:
    SUPABASE_URL=https://<проект>.supabase.co
    SUPABASE_ACCESS_TOKEN=sbp_...   (Supabase → аватар → Account → Access Tokens → Generate new token)
service_role-ключ для этого не подходит: им можно только читать и писать данные, а менять структуру базы нельзя.

Запуск:  python scripts/run_sql.py supabase/game_bot.sql
Токен нигде не печатается.
"""
import json, os, re, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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
    url = os.environ.get("SUPABASE_URL") or vals.get("SUPABASE_URL") or ""
    tok = os.environ.get("SUPABASE_ACCESS_TOKEN") or vals.get("SUPABASE_ACCESS_TOKEN") or ""
    m = re.match(r"^https://([a-z0-9]{10,40})\.supabase\.co/?$", url.strip())
    if not m:
        sys.exit("Нет SUPABASE_URL вида https://<проект>.supabase.co в .env.txt")
    if not tok.startswith("sbp_"):
        sys.exit("Нет SUPABASE_ACCESS_TOKEN (начинается с sbp_) в .env.txt: Supabase → Account → Access Tokens → Generate new token")
    return m.group(1), tok


def main():
    if len(sys.argv) != 2:
        sys.exit("Запуск: python scripts/run_sql.py <файл.sql>")
    ref, tok = env()
    sql = open(os.path.join(ROOT, sys.argv[1]) if not os.path.isabs(sys.argv[1]) else sys.argv[1], encoding="utf-8").read()
    req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{ref}/database/query", method="POST",
                                 data=json.dumps({"query": sql}).encode(),
                                 headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "coopix-run-sql"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            body = r.read().decode("utf-8", "replace")
            print("ГОТОВО:", sys.argv[1], "выполнен (HTTP", r.status, ")")
            if body.strip() not in ("", "[]"):
                print(body[:2000])
    except urllib.error.HTTPError as e:
        sys.exit(f"ОШИБКА {e.code}: {e.read().decode('utf-8', 'replace')[:2000]}")


if __name__ == "__main__":
    main()
