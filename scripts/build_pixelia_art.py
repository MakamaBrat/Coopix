"""Готовит картинки фонов Пикселии: games/pixelia/art/*.webp (исходники, сгенерированные нейросетью) -> games/pixelia/src/bgassets.js.

Сцены (sea, plains, desert, beach, snow) — пейзаж с прозрачным небом, уменьшается до 960 px по ширине и сохраняется в WebP.
Небо (sky.webp) разбирается на маску облаков из четырёх тонов (нет, тень, середина, свет): цвет неба и облаков игра берёт сама по времени суток,
а форму облаков — из картинки. Запуск: python scripts/build_pixelia_art.py   Потом: python scripts/build_pixelia.py
"""
import base64, io, json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "games", "pixelia", "art")
OUT = os.path.join(ROOT, "games", "pixelia", "src", "bgassets.js")
SCENES = ["sea", "plains", "desert", "beach", "snow"]
SEASON_SCENES = ["plains_spring", "plains_autumn", "plains_winter"]   # необязательные сезонные версии луга: если файл art/<имя>.webp есть, берётся в своё время года


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


def cloudset():
    """Отдельные облака с листа art/clouds_sheet.png (прозрачный фон): каждое сжимается до пиксельной сетки листа (~3 точки),
    раскладывается на три тона (0 свет, 1 середина, 2 тень — цвет даёт игра по времени суток) и кладётся в полоску.
    В PNG тон лежит в красном канале (0, 120, 240), прозрачность — в альфе. Рамки облаков — в BGA_CLOUDS."""
    from scipy import ndimage as nd
    path = os.path.join(ART, "clouds_sheet.png")
    if not os.path.exists(path): return None, 0, []
    im = Image.open(path).convert("RGBA"); a = np.asarray(im)
    lab, n = nd.label(nd.binary_dilation(a[..., 3] > 40, iterations=4))
    objs = nd.find_objects(lab); K = 3.0; sprites = []
    for li, sl in enumerate(objs):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if w * h < 1500: continue
        part = a[sl].copy(); part[lab[sl] != li + 1] = 0          # только своё облако, без соседей в рамке
        c = Image.fromarray(part, "RGBA")
        sw, sh = max(1, round(w / K)), max(1, round(h / K))
        r = np.asarray(c.convert("RGBa").resize((sw, sh), Image.BOX).convert("RGBA")).astype(float)
        sprites.append((sl[0].start, sl[1].start, r))
    sprites.sort(key=lambda t: (t[0] // 60, t[1]))
    lum_all = np.concatenate([(r[..., 0] * .3 + r[..., 1] * .59 + r[..., 2] * .11)[r[..., 3] >= 140] for _, _, r in sprites])
    t_hi, t_lo = np.percentile(lum_all, 62), np.percentile(lum_all, 24)
    W = sum(r.shape[1] + 2 for _, _, r in sprites); H = max(r.shape[0] for _, _, r in sprites)
    out = np.zeros((H, W, 4), np.uint8); boxes = []; x = 0
    for _, _, r in sprites:
        h, w = r.shape[:2]; lum = r[..., 0] * .3 + r[..., 1] * .59 + r[..., 2] * .11; m = r[..., 3] >= 140
        tone = np.where(lum >= t_hi, 0, np.where(lum >= t_lo, 1, 2))
        blk = out[:h, x:x + w]; blk[..., 0] = tone * 120; blk[..., 3] = np.where(m, 255, 0)
        boxes.append([x, 0, w, h]); x += w + 2
    buf = io.BytesIO(); Image.fromarray(out, "RGBA").save(buf, "PNG", optimize=True)
    return b64(buf.getvalue(), "image/png"), len(buf.getvalue()), boxes


def main():
    parts, total = [], 0
    data, n = clouds(); parts.append('  clouds: "%s"' % data); total += n; print("clouds", n)
    cdata, n, cboxes = cloudset()
    if cdata: parts.append('  cloudset: "%s"' % cdata); total += n; print("cloudset", n, len(cboxes), "clouds")
    for s in SCENES + [x for x in SEASON_SCENES if os.path.exists(os.path.join(ART, x + ".webp"))]:
        data, n = scene(s); parts.append('  %s: "%s"' % (s, data)); total += n; print(s, n)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("'use strict';\n/* СГЕНЕРИРОВАНО scripts/build_pixelia_art.py из games/pixelia/art/*.webp, руками не править */\nconst BGA = {\n" + ",\n".join(parts) + "\n};\n")
        f.write("const BGA_CLOUDS = %s;\n" % json.dumps(cboxes))
    print("OK", OUT, round(total / 1024), "KB")


if __name__ == "__main__":
    main()
