"""Режет присланные нейросетью листы спрайтов в маленькие картинки интерфейса Пикселии и пишет games/pixelia/src/uiassets.js.

Листы лежат в games/pixelia/art:
  icons_clean.png      — иконки элементов, типов и сил на прозрачном фоне (главный источник);
  materials_atlas.png  — тот же набор на кремовой панели, отсюда берём только склянки кислоты и рассола;
  bubbles.png          — пузыри эмоций и значки занятий на сером фоне;
  inventory_autumn.png — осенняя панель, отсюда берём ветку с листьями для углов.

Нейросеть рисует «пиксель-арт», увеличенный примерно в 4.5 раза и размытый. Поэтому каждая картинка
сжимается обратно до своей пиксельной сетки (усреднением с учётом прозрачности), альфа делается жёсткой,
а потом увеличивается целым множителем без сглаживания. Получаются чёткие пиксели без ореолов и мусора по краям.

Запуск: python scripts/build_pixelia_ui.py   Потом: python scripts/build_pixelia.py
С UIA_DEBUG=<папка> рядом пишется контактный лист debug_sheet.png для проверки.
"""
import base64, io, os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "games", "pixelia", "art")
OUT = os.path.join(ROOT, "games", "pixelia", "src", "uiassets.js")
DEBUG = os.environ.get("UIA_DEBUG")


def load(name):
    return Image.open(os.path.join(ART, name)).convert("RGBA")


def b64png(im):
    """PNG с палитрой: у пиксель-арта мало цветов, так файл в несколько раз меньше."""
    q = im.quantize(colors=255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    buf = io.BytesIO()
    q.save(buf, "PNG", optimize=True)
    raw = io.BytesIO(); im.save(raw, "PNG", optimize=True)
    data = buf.getvalue() if len(buf.getvalue()) < len(raw.getvalue()) else raw.getvalue()
    return "data:image/png;base64," + base64.b64encode(data).decode()


# ---------------------------------------------------------------- общие шаги

def runs(v):
    """[(start, stop)] участков, где v истинна."""
    out, s = [], None
    for i, x in enumerate(v):
        if x and s is None: s = i
        if not x and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, len(v)))
    return out


def pixelize(im, k, size=None, thr=120):
    """Сжимает размытый крупный «пиксель-арт» до его сетки: усреднение с учётом альфы, жёсткая альфа.
    size — квадратный холст (в пикселях сетки), картинка ставится по центру; None — по размеру картинки."""
    w, h = max(1, round(im.width / k)), max(1, round(im.height / k))
    r = im.convert("RGBa").resize((w, h), Image.BOX).convert("RGBA")
    a = np.array(r)
    a[:, :, 3] = np.where(a[:, :, 3] >= thr, 255, 0)
    a[a[:, :, 3] == 0] = 0
    r = Image.fromarray(a, "RGBA")
    if size:
        cw, ch = (size, size) if isinstance(size, int) else size
        out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        out.paste(r, ((cw - w) // 2, (ch - h) // 2))
        r = out
    return r


def outline(im, color=(58, 36, 24), boost=True):
    """Тёмный контур в один пиксель сетки вокруг силуэта (по четырём соседям) и чуть больше сочности:
    пастельные пузыри иначе теряются на светлом небе."""
    if boost:
        from PIL import ImageEnhance
        a = im.getchannel("A")
        im = ImageEnhance.Contrast(ImageEnhance.Color(im.convert("RGB")).enhance(1.25)).enhance(1.12).convert("RGBA")
        im.putalpha(a)
    w, h = im.size
    pad = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0)); pad.paste(im, (1, 1))
    arr = np.array(pad)
    m = arr[:, :, 3] > 0
    ring = nd.binary_dilation(m, structure=nd.generate_binary_structure(2, 1)) & ~m
    arr[ring] = color + (255,)
    return Image.fromarray(arr, "RGBA")


def up(im, n):
    return im.resize((im.width * n, im.height * n), Image.NEAREST)


def tight(im):
    bb = im.getchannel("A").getbbox()
    return im.crop(bb) if bb else im


def cut_soft_bg(crop, sat_max=.2, tol=40, amin=0):
    """Отделяет предмет от светлого или серого фона с размытым свечением: заливка от краёв идёт по
    малонасыщенным пикселям, по цвету фона в углах и по полупрозрачным пикселям (альфа ниже amin).
    Остаётся самый большой кусок с заполненными дырами."""
    al = np.asarray(crop.convert("RGBA"))[:, :, 3]
    a = np.asarray(crop.convert("RGB")).astype(int)
    h, w, _ = a.shape
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)
    corners = np.array([a[1, 1], a[1, w - 2], a[h - 2, 1], a[h - 2, w - 2]])
    bg = np.median(corners, axis=0)
    bgl = (sat < sat_max) | (np.abs(a - bg).sum(2) <= tol) | (al < amin)
    seeds = np.zeros((h, w), bool); seeds[0, :] = seeds[-1, :] = seeds[:, 0] = seeds[:, -1] = True
    lab, _ = nd.label(bgl)
    outside = np.isin(lab, np.unique(lab[seeds & bgl]))
    obj = ~outside
    lab, n = nd.label(obj)
    if n > 1:
        sizes = nd.sum(obj, lab, range(1, n + 1))
        obj = lab == (1 + int(np.argmax(sizes)))
    obj = nd.binary_fill_holes(obj)
    obj = nd.binary_erosion(obj, iterations=1)  # срезаем светлую каёмку свечения
    out = crop.convert("RGBA")
    arr = np.array(out); arr[:, :, 3] = np.where(obj, 255, 0); arr[~obj] = 0
    return Image.fromarray(arr, "RGBA")


def segment(alpha, counts, thr=24):
    """Делит прозрачный лист на строки и столбцы. counts — сколько картинок ждём в каждой строке.
    Мелкие крошки (искры, капли) прилипают к ближайшему соседу, слипшиеся картинки режутся по самому тонкому месту."""
    m = alpha > thr
    rows = [r for r in runs(m.sum(1) > 2) if r[1] - r[0] > 30]
    assert len(rows) == len(counts), (rows, counts)
    boxes = []
    for (y0, y1), k in zip(rows, counts):
        band = m[y0:y1]
        occ = band.sum(0).astype(float)
        sm = nd.uniform_filter1d(occ, 5)
        segs = runs(occ > 0)
        while True:
            small = [i for i, s in enumerate(segs) if s[1] - s[0] < 62]
            if not small or len(segs) == 1: break
            i = small[0]; s = segs[i]
            dl = s[0] - segs[i - 1][1] if i > 0 else 1e9
            dr = segs[i + 1][0] - s[1] if i + 1 < len(segs) else 1e9
            j = i - 1 if dl <= dr else i + 1
            a, b = sorted((i, j)); segs[a] = (segs[a][0], segs[b][1]); del segs[b]
        while len(segs) < k:
            i = max(range(len(segs)), key=lambda i: segs[i][1] - segs[i][0])
            s0, s1 = segs[i]; w = s1 - s0
            lo, hi = s0 + int(w * .25), s1 - int(w * .25)
            c = lo + int(np.argmin(sm[lo:hi]))
            segs[i:i + 1] = [(s0, c), (c, s1)]
        assert len(segs) == k, (y0, segs, k)
        for x0, x1 in segs:
            ys = np.where(band[:, x0:x1].any(1))[0]
            boxes.append((x0, y0 + int(ys[0]), x1, y0 + int(ys[-1]) + 1))
    return boxes


# ---------------------------------------------------------------- иконки элементов (icons_clean.png, 1535x1024, прозрачный фон)
K_ICON = 4.5      # во столько раз нейросеть увеличила свой пиксель
ICON_GRID = 37    # холст элемента в пикселях сетки (самая крупная картинка ~165 px / 4.5)
ICON_UP = 4       # во сколько раз увеличиваем для интерфейса (браузер потом уменьшает до размера кнопки)
SHEET_ROWS = [
    ["cat:pile", "cat:drop", "cat:puff", "cat:block", "cat:seed", "cat:people", "cat:bulb", "cat:bolt"],
    ["EARTH", "SAND", "SNOW", "SALT", "GUNP", "ASH", "MUD", "WATER", "OIL", "LAVA"],
    ["STONE", "WALL", "METAL", "GLASS", "WOOD", "ICE", "LEAF", "FIRE", "STEAM", "SMOKE", "GAS"],
    ["SEED", "CONE", "FSEED", "FLY", "SPARK", "BATT", "LAMP", "CLONE", "VOID"],
    ["t:LIGHTNING", "t:METEOR", "t:BLAST", "t:WIND", "t:HEAT", "t:COLD", "t:HUMAN"],
]
# склянки, которых нет на прозрачном листе: (x0, y0, x1, y1) на materials_atlas.png; там пиксель мельче
POTIONS = {"ACID": (1270, 190, 1372, 318), "BRINE": (1376, 190, 1478, 318)}
K_POTION = 3.1


def icons():
    im = load("icons_clean.png")
    alpha = np.asarray(im)[:, :, 3]
    boxes = segment(alpha, [len(r) for r in SHEET_ROWS])
    keys = [k for r in SHEET_ROWS for k in r]
    out = {}
    for key, (x0, y0, x1, y1) in zip(keys, boxes):
        crop = im.crop((x0, y0, x1, y1))
        if key.startswith("cat:"):
            # значки вкладок вписываем в свой холст: на маленьких кнопках они должны быть крупными
            n = max(pixelize(crop, K_ICON).size) + 2
            out[key] = up(pixelize(crop, K_ICON, n), ICON_UP)
        else:
            out[key] = up(pixelize(crop, K_ICON, ICON_GRID), ICON_UP)
    mat = load("materials_atlas.png")
    for key, box in POTIONS.items():
        c = tight(cut_soft_bg(mat.crop(box), sat_max=0, tol=34))
        out[key] = up(pixelize(c, K_POTION, ICON_GRID), ICON_UP)
    return out


# ---------------------------------------------------------------- пузыри эмоций и значки занятий (bubbles.png, 1536x1024; координаты с просмотра 1500x1000)
K2 = 1536 / 1500.0
EMOTE_X = [735, 850, 960, 1073, 1187, 1300, 1412]
EMOTES = [(405, ["heart", "broken", "alert", "ask", "dots", "note", "spark"]), (520, ["up", "down", "shake", "gift", "coffee", "meat", "money"])]
BADGE_X = [125, 298, 462, 620, 775, 935, 1085, 1240, 1400]
BADGES = ["book", "scroll", "scales", "bag", "home", "group", "beers", "fire", "zzz"]
EMOTE_GRID = 20   # пузырь над головой рисуется 20x20 точек слоя людей, без сглаживания
BADGE_GRID = 24   # значок занятия в карточке человечка


def bubbles():
    im = load("bubbles.png")
    out = {"emote": {}, "badge": {}}
    for cy, keys in EMOTES:
        for cx, key in zip(EMOTE_X, keys):
            x0, y0 = int(cx * K2) - 56, int(cy * K2) - 56
            c = tight(cut_soft_bg(im.crop((x0, y0, x0 + 112, y0 + 124)), sat_max=0, tol=0, amin=200))
            k = max(c.size) / (EMOTE_GRID - 3)
            out["emote"][key] = outline(pixelize(c, k, EMOTE_GRID - 2))
    for cx, key in zip(BADGE_X, BADGES):
        x0, y0 = int(cx * K2) - 90, int(845 * K2) - 70
        c = cut_soft_bg(im.crop((x0, y0, x0 + 180, y0 + 140)), sat_max=.16, amin=200)
        # ленты по бокам срезаем: ширину восьмиугольника видно по верхней кромке, куда ленты не доходят
        a = np.asarray(c)[:, :, 3] > 0
        ys = np.where(a.any(1))[0]
        top = a[ys[0]:ys[0] + max(4, (ys[-1] - ys[0]) // 5)]
        xs = np.where(top.any(0))[0]
        c = tight(c.crop((int(xs[0]), 0, int(xs[-1]) + 1, c.height)))
        k = max(c.size) / (BADGE_GRID - 3)
        out["badge"][key] = outline(pixelize(c, k, BADGE_GRID - 2))
    return out


# ---------------------------------------------------------------- украшения (inventory_autumn.png, 1536x1024)
# ветка с осенними листьями в левом верхнем углу лежит на прозрачном фоне
BRANCH = (0, 0, 330, 120)


def deco():
    im = load("inventory_autumn.png")
    a = np.array(im.crop(BRANCH))
    m = a[:, :, 3] > 200
    lab, n = nd.label(nd.binary_dilation(m, iterations=3))
    keep = np.zeros_like(m)
    for i in range(1, n + 1):
        part = lab == i
        if (m & part).sum() > 400: keep |= part   # ветка и листья; искорки рядом отбрасываем
    a[:, :, 3] = np.where(m & keep, 255, 0); a[a[:, :, 3] == 0] = 0
    c = tight(Image.fromarray(a, "RGBA"))
    return {"branch": pixelize(c, 4.4)}


def debug_sheet(groups):
    tiles = [v for d in groups.values() for v in d.values()]
    cell, cols = 120, 10
    sheet = Image.new("RGBA", (cols * cell, ((len(tiles) + cols - 1) // cols) * cell), (250, 236, 212, 255))
    for i, v in enumerate(tiles):
        t = up(v, max(1, 112 // max(v.size))) if max(v.size) < 112 else v.copy()
        t.thumbnail((cell - 8, cell - 8), Image.NEAREST)
        sheet.alpha_composite(t, ((i % cols) * cell + (cell - t.width) // 2, (i // cols) * cell + (cell - t.height) // 2))
    sheet.save(os.path.join(DEBUG, "debug_sheet.png"))


def main():
    groups = {"icon": icons()}
    groups.update(bubbles())
    groups["deco"] = deco()
    if DEBUG: debug_sheet(groups)
    body = []
    for g, d in groups.items():
        body.append(" %s: {\n%s\n }" % (g, ",\n".join('  "%s": "%s"' % (k, b64png(v)) for k, v in d.items())))
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("'use strict';\n/* СГЕНЕРИРОВАНО scripts/build_pixelia_ui.py из games/pixelia/art/*.png, руками не править */\nconst UIA = {\n" + ",\n".join(body) + "\n};\n")
    print("OK", sum(len(d) for d in groups.values()), "sprites", round(os.path.getsize(OUT) / 1024), "KB")


if __name__ == "__main__":
    main()
