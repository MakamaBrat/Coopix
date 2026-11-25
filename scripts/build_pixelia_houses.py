"""Режет детали домов из присланных листов и пишет games/pixelia/src/houseassets.js (HSA = {деталь: dataURI}).

Листы (прозрачный фон) лежат в games/pixelia/art:
  manor_parts.png  — «Пиксельный атлас уютной усадьбы»: стены, балки, доски, окна, двери, камин, мебель, полки, растения;
  houses_tiles.png — «Пиксельный атлас уютных домиков и тайлов»: черепица, каменная стена, окна с цветами, витраж, скамьи, флаги.

Каждая деталь сжимается до своей пиксельной сетки (как иконки в build_pixelia_ui.py) так, чтобы дверь была ростом
с человечка (~26 точек слоя людей, 1 клетка мира = 2 точки). Дом собирается из деталей в коде (houses.js).
Запуск: python scripts/build_pixelia_houses.py   Потом: python scripts/build_pixelia.py
С UIA_DEBUG=<папка> рядом пишется houses_sheet.png для проверки.
"""
import base64, io, os, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_pixelia_ui import pixelize, tight, up  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "games", "pixelia", "art")
OUT = os.path.join(ROOT, "games", "pixelia", "src", "houseassets.js")
DEBUG = os.environ.get("UIA_DEBUG")

# имя: (лист, (x0, y0, x1, y1), во сколько раз сжать). Координаты — рамки деталей на листе (найдены разметкой связных областей)
M, HT = "manor_parts.png", "houses_tiles.png"
K = 4.0
PARTS = {
    # стены (внутренний кусок без рамки — плитка для заливки задней стены комнаты)
    "wall_wood": (M, (34, 178, 150, 276), K),
    "wall_plaster": (M, (822, 180, 922, 274), K),
    "wall_stone": (HT, (166, 534, 272, 638), 4.4),
    # каркас
    "beam": (M, (16, 308, 272, 341), K),
    "post": (M, (1230, 297, 1264, 408), K),
    "floor": (M, (671, 359, 892, 399), K),
    # окна
    "win_box": (HT, (648, 527, 735, 647), 5.4),
    "win_shut": (HT, (535, 527, 637, 634), 5.2),
    "win_stone": (HT, (844, 526, 938, 631), 5.2),
    "win_stained": (HT, (950, 526, 1039, 632), 4.4),
    "win_round": (M, (611, 566, 678, 633), K),
    "win_wide": (M, (413, 562, 512, 644), K),
    "curtains": (M, (116, 681, 218, 773), 4.4),
    # двери в задней стене (переход между этажами)
    "door": (M, (16, 788, 89, 891), K),
    "door_open": (M, (101, 788, 180, 894), K),
    "door_stone": (M, (301, 780, 386, 892), 4.3),
    "door_stone_open": (M, (393, 778, 481, 893), 4.3),
    "door_church": (HT, (1275, 523, 1379, 645), 4.7),
    # очаг и трубы
    "fireplace": (M, (197, 542, 329, 675), 4.6),
    "chimney": (M, (22, 552, 91, 668), K),
    "chimney_s": (M, (106, 582, 173, 668), K),
    # мебель и мелочи
    "table": (M, (878, 422, 992, 475), K),
    "table2": (M, (1000, 422, 1113, 475), K),
    "shelf_books": (M, (15, 903, 123, 954), K),
    "shelf_books2": (M, (549, 905, 626, 957), K),
    "shelf_jars": (M, (232, 908, 337, 957), K),
    "shelf_plants": (M, (138, 898, 215, 973), K),
    "pans": (M, (459, 908, 533, 969), K),
    "candles": (M, (640, 907, 697, 957), K),
    "candles2": (M, (1144, 915, 1195, 958), K),
    "lantern": (M, (897, 888, 935, 961), K),
    "lantern_wall": (M, (1006, 887, 1062, 949), K),
    "lamp": (M, (1075, 901, 1124, 969), K),
    "plant_big": (M, (13, 964, 86, 1072), K),
    "plant_pink": (M, (93, 987, 160, 1072), K),
    "plant": (M, (172, 984, 234, 1060), K),
    "plant_hang": (M, (243, 972, 302, 1075), K),
    "vase": (M, (310, 989, 362, 1067), K),
    "jug": (M, (365, 1010, 412, 1062), K),
    "apples": (M, (419, 1008, 475, 1063), K),
    "barrel": (M, (481, 1003, 539, 1064), K),
    "chest": (M, (544, 1003, 617, 1060), K),
    "barrel2": (M, (623, 1002, 683, 1064), K),
    "sack": (M, (689, 1010, 739, 1062), K),
    "stool": (M, (742, 992, 799, 1063), K),
    "stool2": (M, (810, 1019, 859, 1063), K),
    "dresser": (M, (932, 986, 1016, 1067), K),
    "picture": (M, (1027, 1005, 1104, 1066), K),
    "banner": (M, (1204, 989, 1288, 1083), K),
    "rug": (M, (1293, 991, 1435, 1074), K),
    "bench": (HT, (816, 650, 929, 739), 4.4),
    "bench_stone": (HT, (933, 650, 1057, 743), 4.4),
    "crystal": (HT, (1143, 333, 1192, 418), 4.4),
    "flag_red": (HT, (152, 748, 214, 832), 4.4),
    "flag_blue": (HT, (221, 748, 290, 832), 4.4),
    "flag_purple": (HT, (299, 748, 368, 828), 4.4),
    "flowerbox": (HT, (672, 746, 763, 826), 4.4),
    "lamppost": (HT, (1332, 653, 1429, 743), 4.4),
    # черепица (текстура для крыши, кладётся плиткой)
    "roof_red": (HT, (20, 436, 158, 496), 4.4),
    "roof_blue": (HT, (178, 435, 306, 496), 4.4),
    "roof_green": (HT, (323, 435, 456, 496), 4.4),
    "roof_purple": (HT, (619, 436, 738, 498), 4.4),
}
TILES = {"wall_wood", "wall_plaster", "wall_stone", "roof_red", "roof_blue", "roof_green", "roof_purple"}


def b64(im):
    q = im.quantize(colors=255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    buf = io.BytesIO(); q.save(buf, "PNG", optimize=True)
    raw = io.BytesIO(); im.save(raw, "PNG", optimize=True)
    data = min(buf.getvalue(), raw.getvalue(), key=len)
    return "data:image/png;base64," + base64.b64encode(data).decode()


def main():
    sheets = {}
    out = {}
    for name, (sheet, box, k) in PARTS.items():
        if sheet not in sheets: sheets[sheet] = Image.open(os.path.join(ART, sheet)).convert("RGBA")
        c = sheets[sheet].crop(box)
        if name in TILES:
            # плитка: без прозрачности, жёсткий край не нужен
            w, h = max(1, round(c.width / k)), max(1, round(c.height / k))
            out[name] = c.convert("RGB").resize((w, h), Image.BOX).convert("RGBA")
        else:
            out[name] = tight(pixelize(tight(c), k))
    if DEBUG:
        cell = 80; cols = 10; rows = (len(out) + cols - 1) // cols
        sh = Image.new("RGBA", (cols * cell, rows * cell), (40, 30, 44, 255))
        for i, (n, v) in enumerate(out.items()):
            t = up(v, 2) if max(v.size) <= 36 else v
            sh.alpha_composite(t.crop((0, 0, min(t.width, cell - 4), min(t.height, cell - 4))), ((i % cols) * cell + 2, (i // cols) * cell + 2))
        sh.save(os.path.join(DEBUG, "houses_sheet.png"))
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("'use strict';\n/* СГЕНЕРИРОВАНО scripts/build_pixelia_houses.py из games/pixelia/art/{manor_parts,houses_tiles}.png, руками не править */\nconst HSA = {\n")
        f.write(",\n".join(' "%s": "%s"' % (k, b64(v)) for k, v in out.items()))
        f.write("\n};\n")
    print("OK", len(out), "parts", round(os.path.getsize(OUT) / 1024), "KB")
    for k, v in out.items(): print(k, v.size)


if __name__ == "__main__":
    main()
