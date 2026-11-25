"""Готовит картинки фонов Пикселии: games/pixelia/art/*.webp (исходники, сгенерированные нейросетью) -> games/pixelia/src/bgassets.js.

Сцены (sea, plains, desert, beach, snow) — пейзаж с прозрачным небом, уменьшается до 960 px по ширине и сохраняется в WebP.
Небо (sky.webp) разбирается на маску облаков из четырёх тонов (нет, тень, середина, свет): цвет неба и облаков игра берёт сама по времени суток,
а форму облаков — из картинки. Запуск: python scripts/build_pixelia_art.py   Потом: python scripts/build_pixelia.py
"""
import base64, io, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "games", "pixelia", "art")
OUT = os.path.join(ROOT, "games", "pixelia", "src", "bgassets.js")
SCENES = ["sea", "plains", "desert", "beach", "snow"]


def b64(data, mime):
    return "data:%s;base64,%s" % (mime, base64.b64encode(data).decode())


def scene(name):
    im = Image.open(os.path.join(ART, name + ".webp")).convert("RGBA")
    h = round(im.size[1] * 960 / im.size[0])
    im = im.resize((960, h), Image.LANCZOS)
    a = np.asarray(im).copy()
    a[a[..., 3] < 24] = 0          # убираем ореол на краях прозрачности
    im = Image.fromarray(a, "RGBA")
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=84, alpha_quality=92, method=6)
    return b64(buf.getvalue(), "image/webp"), len(buf.getvalue())


def clouds():
    im = Image.open(os.path.join(ART, "sky.webp")).convert("RGB").resize((640, 360), Image.LANCZOS)
    a = np.asarray(im).astype(float)
    lum = a[..., 0] * .3 + a[..., 1] * .59 + a[..., 2] * .11
    base = np.percentile(lum, 12, axis=1)
    base = np.convolve(np.pad(base, (4, 4), mode="edge"), np.ones(9) / 9, mode="valid")
    d = lum - base[:, None]
    tone = np.zeros(d.shape, np.uint8)
    tone[d > 14] = 1; tone[d > 46] = 2; tone[d > 92] = 3
    tone = tone[:224]              # облака только в верхних ~62 %
    buf = io.BytesIO()
    Image.fromarray(tone * 85, "L").save(buf, "PNG", optimize=True)
    return b64(buf.getvalue(), "image/png"), len(buf.getvalue())


def main():
    parts, total = [], 0
    data, n = clouds(); parts.append('  clouds: "%s"' % data); total += n; print("clouds", n)
    for s in SCENES:
        data, n = scene(s); parts.append('  %s: "%s"' % (s, data)); total += n; print(s, n)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("'use strict';\n/* СГЕНЕРИРОВАНО scripts/build_pixelia_art.py из games/pixelia/art/*.webp, руками не править */\nconst BGA = {\n" + ",\n".join(parts) + "\n};\n")
    print("OK", OUT, round(total / 1024), "KB")


if __name__ == "__main__":
    main()
