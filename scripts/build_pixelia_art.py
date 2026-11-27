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


K_SCENE = 4   # во столько раз нейросеть увеличила свой пиксель на картинках сцен (измерено по периоду перепадов: 4.0 у всех)


def grid_phase(a, k, axis):
    """сдвиг пиксельной сетки: где по оси чаще всего проходят резкие перепады цвета"""
    rgb = a[..., :3].astype(np.int32)
    d = np.abs(np.diff(rgb, axis=axis)).sum(-1)
    col = (d > 30).sum(0 if axis == 1 else 1).astype(float)
    ph = (np.arange(len(col)) % k) / k
    z = (col * np.exp(2j * np.pi * ph)).sum()
    edge = (np.angle(z) / (2 * np.pi) * k) % k          # перепад между i и i+1 при i ≡ edge (mod k)
    return int(round(edge + 1)) % k                       # клетка сетки начинается сразу после перепада


def scene(name):
    """картинка сцены -> её родная пиксельная сетка (в K_SCENE раз меньше): цвет клетки — среднее её середины
    (края клетки размыты нейросетью), прозрачность жёсткая, светлая кайма по силуэту (остаток белого фона) убирается.
    В игре рисуется целым увеличением без сглаживания: пиксель картинки = клетка мира."""
    im = Image.open(os.path.join(ART, name + ".webp")).convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    k = K_SCENE
    # по силуэту в исходнике идёт тонкая почти чёрная линия (остаток вырезанного неба) — срезаем полосу в 2 точки
    import scipy.ndimage as nd
    m = a[..., 3] > 127
    a[~nd.binary_erosion(m, iterations=2), 3] = 0
    ox, oy = grid_phase(a, k, 1), grid_phase(a, k, 0)
    h, w = (a.shape[0] - oy) // k, (a.shape[1] - ox) // k
    b = a[oy:oy + h * k, ox:ox + w * k].reshape(h, k, w, k, 4)
    inner = b[:, 1:k - 1, :, 1:k - 1, :].transpose(0, 2, 1, 3, 4).reshape(h, w, (k - 2) * (k - 2), 4)
    al = inner[..., 3] / 255.0
    asum = al.sum(-1)
    rgb = (inner[..., :3] * al[..., None]).sum(-2) / np.maximum(asum[..., None], 1e-6)
    alpha = (inner[..., 3].mean(-1) > 127)
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); out[..., 3] = np.where(alpha, 255, 0)
    # кайма: краевая клетка заметно светлее или темнее соседней внутренней — красим её цветом внутренней
    lum = out[..., :3].astype(np.int32) @ np.array([3, 6, 1]) // 10
    op = out[..., 3] > 0
    edge = op & ~(np.roll(op, 1, 0) & np.roll(op, -1, 0) & np.roll(op, 1, 1) & np.roll(op, -1, 1))
    for yy, xx in zip(*np.nonzero(edge)):
        best = None
        for dy, dx in ((1, 0), (0, 1), (0, -1), (-1, 0), (1, 1), (1, -1)):
            y2, x2 = yy + dy, xx + dx
            if 0 <= y2 < h and 0 <= x2 < w and op[y2, x2] and not edge[y2, x2]: best = (y2, x2); break
        if best and abs(int(lum[yy, xx]) - int(lum[best])) > 40: out[yy, xx, :3] = out[best][:3]   # светлая или тёмная кайма
    out[out[..., 3] == 0] = 0
    pim = Image.fromarray(out, "RGBA")
    buf = io.BytesIO()
    pim.save(buf, "PNG", optimize=True)
    print("  %s: сетка %dx%d, сдвиг (%d,%d)" % (name, w, h, ox, oy))
    return b64(buf.getvalue(), "image/png"), len(buf.getvalue())


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
