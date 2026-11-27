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
M, HT, MD, FR, FH = "manor_parts.png", "houses_tiles.png", "mine_dock.png", "farm_res.png", "farm_hunt.png"
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
    # шахты и причалы (mine_dock.png — «Пиксельный атлас шахт и причалов»)
    "mine_gate": (MD, (7, 508, 135, 605), 3.6),
    "mine_crane": (MD, (907, 307, 1027, 440), 3.6),
    "mine_beam": (MD, (1223, 223, 1291, 307), 3.4),
    "mine_lamp": (MD, (1361, 591, 1397, 638), 3.4),
    "cart": (MD, (8, 389, 82, 442), 3.4),
    "cart_gold": (MD, (250, 383, 326, 442), 3.4),
    "cart_gem": (MD, (336, 383, 413, 442), 3.4),
    "ore_gold": (MD, (608, 598, 669, 638), 3.4),
    "ore_iron": (MD, (674, 602, 731, 640), 3.4),
    "ladder": (MD, (750, 503, 795, 600), 3.6),
    "rail": (MD, (10, 330, 97, 370), 3.4),
    "dock_seg": (MD, (1064, 754, 1225, 881), 3.4),
    "dock_seg2": (MD, (940, 755, 1059, 887), 3.4),
    "dock_end": (MD, (1320, 754, 1445, 880), 3.4),
    "dock_deck": (MD, (6, 758, 178, 813), 3.4),
    "dock_crane": (MD, (11, 877, 121, 977), 3.6),
    "dock_barrel": (MD, (245, 911, 301, 969), 3.4),
    "anchor": (MD, (576, 898, 629, 969), 3.4),
    "net": (MD, (637, 906, 719, 968), 3.4),
    "buoy": (MD, (816, 906, 848, 958), 3.4),
    "barrels": (MD, (594, 972, 697, 1025), 3.4),
    # огород (farm_res.png — «Пиксельная энциклопедия фермерских ресурсов»): грядки по стадиям роста, без ящиков
    "bed_soil": (FR, (10, 358, 72, 436), 5.0),
    "bed_furrow": (FR, (74, 358, 136, 436), 5.0),
    "bed_seed": (FR, (200, 358, 262, 436), 5.0),
    "bed_sprout": (FR, (263, 358, 325, 436), 5.0),
    "bed_young": (FR, (326, 358, 392, 436), 5.0),
    "wheat1": (FR, (601, 358, 660, 436), 5.0),
    "wheat2": (FR, (662, 358, 720, 436), 5.0),
    "wheat3": (FR, (723, 358, 780, 436), 5.0),
    "corn1": (FR, (784, 358, 841, 436), 5.0),
    "corn2": (FR, (843, 358, 900, 436), 5.0),
    "tomato1": (FR, (961, 358, 1014, 436), 5.0),
    "tomato2": (FR, (1015, 358, 1071, 436), 5.0),
    "tomato3": (FR, (1074, 358, 1137, 436), 5.0),
    "pumpkin1": (FR, (1265, 358, 1319, 436), 5.0),
    "pumpkin2": (FR, (1322, 358, 1377, 436), 5.0),
    "pumpkin3": (FR, (1379, 358, 1435, 436), 5.0),
    "veg_wheat": (FR, (12, 438, 46, 502), 5.0),
    "veg_corn": (FR, (51, 438, 87, 502), 5.0),
    "veg_tomato": (FR, (471, 438, 508, 502), 5.0),
    "veg_pumpkin": (FR, (643, 438, 693, 502), 5.0),
    # дрова и охота (farm_hunt.png — «Пиксельный набор фермерских и охотничьих предметов»)
    "woodpile": (FH, (682, 19, 931, 178), 9.0),
    "woodshed": (FH, (1168, 9, 1431, 176), 9.0),
    "firewood": (FH, (943, 34, 1165, 179), 9.0),
    "bow": (FH, (54, 864, 177, 1078), 15.0),
    "meat_rack": (FH, (1050, 867, 1373, 1074), 9.0),
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
