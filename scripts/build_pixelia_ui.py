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


# ---------------------------------------------------------------- значки для меню «Жители» (people_icons.png, 1536x1024, прозрачный фон)
# пол, знаки профессий, занятия, лица-настроения, ресурсы, награды, дома, знамёна обществ
PEOPLE_ICONS = {'male': (1258, 39, 1316, 97), 'female': (1320, 34, 1365, 103), 'pair': (1372, 38, 1460, 96), 'crowd': (1464, 35, 1524, 89), 'm_calm': (208, 131, 302, 213), 'm_happy': (311, 126, 412, 213), 'm_surprise': (408, 128, 498, 212), 'm_think': (498, 125, 590, 225), 'm_joy': (685, 128, 776, 212), 'm_angry': (772, 129, 868, 213), 'm_sleep': (866, 127, 950, 213), 'm_sad': (954, 132, 1040, 213), 'heart': (1055, 140, 1126, 203), 'energy': (1130, 136, 1184, 206), 'drop': (1195, 137, 1249, 203), 'food': (1256, 137, 1325, 204), 'smile': (1329, 137, 1396, 203), 'star': (1465, 137, 1527, 200), 'p_lumber': (22, 228, 116, 321), 'p_mason': (120, 228, 212, 321), 'p_farmer': (216, 228, 307, 321), 'p_fisher': (311, 228, 403, 321), 'p_crafter': (407, 228, 498, 321), 'p_cook': (594, 228, 680, 321), 'p_scholar': (683, 228, 770, 321), 'p_potion': (773, 228, 859, 321), 'p_soldier': (957, 228, 1048, 321), 'p_bow': (1052, 228, 1146, 321), 'p_none': (1149, 228, 1244, 321), 'p_barkeep': (1247, 228, 1342, 321), 'p_builder': (1346, 228, 1437, 321), 'p_priest': (1441, 228, 1530, 321), 'a_sleep': (14, 330, 116, 415), 'a_eat': (122, 338, 200, 410), 'a_read': (206, 344, 293, 410), 'a_fire': (298, 328, 378, 416), 'a_fish': (381, 325, 475, 412), 'a_sow': (475, 326, 557, 413), 'a_craft': (561, 325, 643, 415), 'a_quarry': (648, 330, 741, 416), 'a_chop': (745, 334, 834, 416), 'a_plant': (839, 334, 920, 413), 'a_cook': (928, 329, 1003, 414), 'a_music': (1097, 335, 1178, 417), 'a_run': (1177, 326, 1259, 413), 'a_talk': (1263, 347, 1345, 403), 'a_gift': (1352, 330, 1435, 416), 'a_love': (1441, 334, 1528, 410), 'health': (21, 426, 103, 505), 'brain': (112, 431, 194, 504), 'grad': (198, 430, 288, 499), 'luck': (380, 423, 456, 507), 'shield': (470, 426, 544, 506), 'target': (557, 424, 649, 506), 'sword': (640, 430, 718, 505), 'build': (727, 428, 808, 502), 'wood': (10, 515, 99, 590), 'stone': (186, 519, 268, 586), 'scroll': (10, 678, 93, 757), 'coin': (543, 683, 610, 749), 'crown': (616, 683, 691, 744), 'trophy': (696, 681, 776, 755), 'medal': (785, 675, 847, 757), 'flag': (934, 678, 992, 758), 'calendar': (1000, 679, 1069, 749), 'search': (1461, 682, 1528, 754), 'house': (9, 764, 106, 843), 'house2': (108, 762, 202, 841), 'tent': (199, 769, 290, 844), 'banner0': (981, 859, 1071, 974), 'banner1': (1071, 859, 1161, 974), 'banner2': (1161, 859, 1251, 974), 'banner3': (1251, 859, 1342, 974)}


def people_icons():
    from scipy import ndimage as nd
    im = load("people_icons.png"); out = {}
    for name, box in PEOPLE_ICONS.items():
        c = im.crop(box); a = np.array(c)
        m = a[:, :, 3] > 40
        lab, n = nd.label(nd.binary_dilation(m, iterations=3))
        if n > 1:   # только главный кусок: соседние значки, попавшие в рамку, отбрасываем
            sizes = nd.sum(m, lab, range(1, n + 1)); keep = lab == (1 + int(np.argmax(sizes)))
            if not name.startswith(("m_", "banner")): a[~keep] = 0
        c = tight(Image.fromarray(a, "RGBA"))
        out[name] = up(pixelize(c, 3.6), 2)
    return out


def debug_sheet(groups):
    tiles = [v for d in groups.values() for v in d.values()]
    cell, cols = 120, 10
    sheet = Image.new("RGBA", (cols * cell, ((len(tiles) + cols - 1) // cols) * cell), (250, 236, 212, 255))
    for i, v in enumerate(tiles):
        t = up(v, max(1, 112 // max(v.size))) if max(v.size) < 112 else v.copy()
        t.thumbnail((cell - 8, cell - 8), Image.NEAREST)
        sheet.alpha_composite(t, ((i % cols) * cell + (cell - t.width) // 2, (i // cols) * cell + (cell - t.height) // 2))
    sheet.save(os.path.join(DEBUG, "debug_sheet.png"))



# ---------------------------------------------------------------- детали интерфейса из ui_atlas.png (1536x1024, настоящая прозрачность с мягкой тенью)
# каждая деталь ищется как связная область по альфе в своей рамке поиска и приводится к своей пиксельной сетке (шаг ~4 точки)
UI_PARTS = {
    "ribbon": (215, 20, 575, 112),     # лента заголовка с хвостами
    "corner": (1410, 862, 1515, 970),  # уголок-завиток с листком (правый нижний)
    "divider": (620, 915, 805, 965),   # разделитель: линия с ромбом
    "close": (1330, 520, 1415, 605),   # красная кнопка с крестом
    "ok": (1418, 520, 1505, 605),      # зелёная кнопка с галочкой
    "prev": (1108, 520, 1195, 605),    # стрелка влево
    "next": (1200, 520, 1290, 605),    # стрелка вправо
    "chk_on": (1100, 612, 1155, 672), "chk_off": (1155, 612, 1210, 672),
    "rad_on": (1215, 612, 1272, 672), "rad_off": (1272, 612, 1320, 672),
    "knob": (1262, 680, 1325, 742),    # ромб ползунка
    "spark": (1045, 880, 1145, 970),
    "flag_r": (1168, 882, 1228, 970), "flag_b": (1228, 882, 1288, 970), "flag_g": (1288, 882, 1345, 970), "flag_p": (1345, 882, 1405, 970),
}


def grid_phase(a, k, axis):
    rgb = a[..., :3].astype(np.int32)
    d = np.abs(np.diff(rgb, axis=axis)).sum(-1)
    col = (d > 30).sum(0 if axis == 1 else 1).astype(float)
    ph = (np.arange(len(col)) % k) / k
    z = (col * np.exp(2j * np.pi * ph)).sum()
    return int(round((np.angle(z) / (2 * np.pi) * k) % k + 1)) % k


def part(im, box, k=4, thr=150):
    """деталь атласа: самая крупная связная область по альфе в рамке -> родная сетка, жёсткая альфа, без тени"""
    crop = np.array(im.crop(box)).astype(np.float32)
    m = crop[..., 3] > thr
    lab, n = nd.label(nd.binary_dilation(m, iterations=2))
    if n:
        sizes = nd.sum(m, lab, range(1, n + 1)); best = 1 + int(np.argmax(sizes))
        keep = (lab == best) & m
        ys, xs = np.nonzero(keep); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = crop[y0:y1, x0:x1].copy(); keep = keep[y0:y1, x0:x1]
        crop[~keep, 3] = 0
    ox, oy = grid_phase(crop, k, 1), grid_phase(crop, k, 0)
    h, w = (crop.shape[0] - oy) // k, (crop.shape[1] - ox) // k
    b = crop[oy:oy + h * k, ox:ox + w * k].reshape(h, k, w, k, 4)
    inner = b[:, 1:k - 1, :, 1:k - 1, :].transpose(0, 2, 1, 3, 4).reshape(h, w, (k - 2) * (k - 2), 4)
    al = inner[..., 3] / 255.0
    rgb = (inner[..., :3] * al[..., None]).sum(-2) / np.maximum(al.sum(-1)[..., None], 1e-6)
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[..., 3] = np.where(b[..., 3].mean(axis=(1, 3)) > 110, 255, 0)
    out[out[..., 3] == 0] = 0
    return Image.fromarray(out, "RGBA")


def ui_parts():
    im = load("ui_atlas.png").convert("RGBA")
    P = {name: part(im, box) for name, box in UI_PARTS.items()}
    # лента: левый конец (хвост + край плашки), гладкая середина в 1 точку, правый конец; ромб посередине убираем
    rib = np.array(P.pop("ribbon"))
    cold = (rib[..., 2].astype(int) > rib[..., 0].astype(int) - 6) & (rib[..., 3] > 0)   # тёмно-фиолетовая панель под хвостами — не лента
    rib[cold] = 0
    ys, xs = np.nonzero(rib[..., 3]); rib = rib[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = rib.shape[:2]
    cut = max(6, int(w * .27))
    mid = rib[:, int(w * .36):int(w * .36) + 1].copy()
    P["rib_l"] = Image.fromarray(rib[:, :cut].copy(), "RGBA")
    P["rib_m"] = Image.fromarray(mid, "RGBA")
    P["rib_r"] = Image.fromarray(rib[:, w - cut:].copy(), "RGBA")
    # ромб ползунка: только золото и его обводка (без красной и тёмной дорожки)
    kn = np.array(P["knob"]).astype(int)
    gold = (kn[..., 0] > 170) & (kn[..., 1] > 110) & (kn[..., 2] < 140) & (kn[..., 3] > 0)
    keep = nd.binary_dilation(gold, iterations=1) & (kn[..., 3] > 0)
    lab, n = nd.label(keep)
    if n: sizes = nd.sum(keep, lab, range(1, n + 1)); keep = lab == 1 + int(np.argmax(sizes))
    kn[~keep] = 0; ys, xs = np.nonzero(kn[..., 3]); kn = kn[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    P["knob"] = Image.fromarray(kn.astype(np.uint8), "RGBA")
    # уголки: из правого нижнего — остальные три отражением
    c = P.pop("corner")
    P["c_br"] = c; P["c_bl"] = c.transpose(Image.FLIP_LEFT_RIGHT); P["c_tr"] = c.transpose(Image.FLIP_TOP_BOTTOM); P["c_tl"] = c.transpose(Image.ROTATE_180)
    for k2, v in P.items(): print("  part", k2, v.size)
    return P


def main():
    groups = {"icon": icons()}
    groups.update(bubbles())
    groups["deco"] = deco()
    groups["pi"] = people_icons()
    groups["part"] = ui_parts()
    if DEBUG: debug_sheet(groups)
    body = []
    for g, d in groups.items():
        body.append(" %s: {\n%s\n }" % (g, ",\n".join('  "%s": "%s"' % (k, b64png(v)) for k, v in d.items())))
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("'use strict';\n/* СГЕНЕРИРОВАНО scripts/build_pixelia_ui.py из games/pixelia/art/*.png, руками не править */\nconst UIA = {\n" + ",\n".join(body) + "\n};\n")
    print("OK", sum(len(d) for d in groups.values()), "sprites", round(os.path.getsize(OUT) / 1024), "KB")


if __name__ == "__main__":
    main()
