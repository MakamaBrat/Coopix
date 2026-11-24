"""Собирает игру «Пикселия» в один самодостаточный HTML-файл.

Исходники лежат в games/pixelia/src (index.html + css + js, шрифт вшит в font.css).
Запуск:  python scripts/build_pixelia.py
Результат: games/pixelia/Pixelia.html  (без внешних запросов, работает офлайн и внутри iframe магазина)

Публикация этим скриптом НЕ выполняется: файл только собирается локально.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "games", "pixelia", "src")
OUT = os.path.join(ROOT, "games", "pixelia", "Pixelia.html")


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


def main():
    html = read("index.html")

    def css(m):
        return "<style>\n" + read(m.group(1)) + "\n</style>"

    def js(m):
        code = read(m.group(1)).replace("</script", "<\\/script")
        return "<script>\n" + code + "\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
    html = re.sub(r'<script src="([^"]+)"></script>', js, html)
    if 'src="' in html.split("<body>", 1)[1] and re.search(r'<script src=', html):
        sys.exit("Остались неподключённые скрипты")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print("OK", OUT, round(len(html.encode("utf-8")) / 1024), "KB")


if __name__ == "__main__":
    main()
