"""Вырезает спрайты из присланных листов (ref*.webp) и собирает games/noomiclone/vice_assets.json
(имя -> data:image/webp;base64 + размеры). Запуск: python games/noomiclone/vice_src/make_vice_assets.py"""
import base64, io, json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "vice_assets.json")
PREVIEW = os.path.join(HERE, "_preview.png")

def load(n):
    return Image.open(os.path.join(HERE, f"ref{n}.webp"))

def bg_alpha(im):
    """листы 17/18: светлый серый фон, связанный с краем, становится прозрачным"""
    a = np.array(im.convert("RGB")).astype(int)
    mn, mx = a.min(2), a.max(2)
    cand = (mn > 186) & (mx - mn < 28)
    lab, n = ndi.label(cand)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    # «дыры» фона внутри спрайта (между ножками и т.п.) тоже убираем, если они крупные и такие же серые
    return (~bg).astype(np.uint8) * 255

def keep_main(alpha, frac=0.18, dil=4):
    """оставляет самый большой кусок и крупные, отрезает чужие обломки соседних спрайтов"""
    m = ndi.binary_dilation(alpha > 40, iterations=dil)
    lab, n = ndi.label(m)
    if n <= 1:
        return alpha
    areas = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
    big = areas.max()
    keep = [i + 1 for i, a in enumerate(areas) if a >= big * frac]
    ok = np.isin(lab, keep)
    return np.where(ok, alpha, 0).astype(np.uint8)

def cutout(sheet, box, mode, frac=0.18, erode=1, feather=0.8):
    """sheet: PIL; box: (x0,y0,x1,y1); mode 'bg' (убрать серый фон) или 'alpha' (уже есть прозрачность)"""
    im = sheet.crop(box).convert("RGBA")
    if mode == "bg":
        al = bg_alpha(im)
    else:
        al = np.array(im)[..., 3]
        al = np.where(al > 24, al, 0).astype(np.uint8)
    al = keep_main(al, frac)
    if erode:
        m = ndi.binary_erosion(al > 128, iterations=erode)
        al = np.where(m, al, 0).astype(np.uint8) if mode == "bg" else np.where(ndi.binary_erosion(al > 24, iterations=erode), al, 0).astype(np.uint8)
    a = Image.fromarray(al).filter(ImageFilter.GaussianBlur(feather))
    im.putalpha(a)
    bb = im.getbbox()
    return im.crop(bb) if bb else im

def fit(im, maxw=None, maxh=None):
    w, h = im.size
    k = min((maxw or 1e9) / w, (maxh or 1e9) / h, 1)
    if k < 1:
        im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    return im

ASSETS = {}
PREV = []

def put(name, im, q=80, lossless=False):
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=q, method=6, lossless=lossless, alpha_quality=92)
    raw = buf.getvalue()
    ASSETS[name] = {"u": "data:image/webp;base64," + base64.b64encode(raw).decode(), "w": im.size[0], "h": im.size[1]}
    PREV.append((name, im))
    return len(raw)

def main():
    r17, r18, r19, r20, r21, r22, r23, r24 = (load(n) for n in (17, 18, 19, 20, 21, 22, 23, 24))
    sizes = {}

    # --- фоны (без прозрачности) ---
    sizes["sky"] = put("sky", fit(r22.convert("RGB"), 1024), q=72)
    sk = fit(r21.convert("RGBA"), 1400)
    al = np.ones(sk.size[::-1], np.float32)
    ys = np.linspace(0, 1, sk.size[1])[:, None]
    al = np.clip((ys - 0.04) / 0.34, 0, 1) ** 1.3 * np.ones((1, sk.size[0]))
    sk.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
    sizes["skyline"] = put("skyline", sk, q=74)

    # --- передний план улицы с пальмами и отелем (RGBA), без тротуара и дороги: игра рисует свою дорогу ---
    fg = r19.crop((0, 0, 2000, 592))
    sizes["strip"] = put("strip", fit(fg, 1200), q=70)

    # --- самолёт, метро ---
    p = r23
    bb = p.getbbox()
    sizes["plane"] = put("plane", fit(p.crop(bb), 900), q=84)
    m = r24
    sizes["metro"] = put("metro", fit(m, 1200), q=70)

    # --- здания с листа 20 (уже с прозрачностью) ---
    b20 = {
        "hotel_pink": (4, 5, 279, 209), "hotel_pink2": (286, 6, 532, 209), "hotel_cream": (535, 13, 808, 208),
        "hotel_mint": (810, 5, 1046, 209), "hotel_mural": (1279, 11, 1495, 209),
        "shop_market": (3, 221, 280, 353), "shop_liquor": (695, 227, 860, 353), "shop_donuts": (862, 205, 1058, 353), "shop_diner": (1060, 227, 1279, 353),
        "shop_auto": (1283, 222, 1499, 353), "wh_sand": (332, 360, 576, 484),
        "billboard": (6, 603, 188, 725), 
        "palm1": (1085, 575, 1182, 728), "palm2": (1212, 568, 1334, 728), "palm3": (1400, 572, 1497, 728),
    }
    for k, b in b20.items():
        mw = {"billboard": 360}.get(k, 330)
        sizes[k] = put(k, fit(cutout(r20, b, "alpha", frac=.12), maxw=mw), q=78)

    # --- машины и мелочь с листа 18 (серый фон) ---
    b18 = {
        "car_sedan": (20, 469, 392, 590), "car_conv": (416, 472, 781, 591), "car_police": (808, 466, 1196, 590),
        "moto": (1230, 472, 1430, 590), "cop_aim": (1230, 246, 1421, 456), "palm_big": (5, 596, 182, 836), 
    }
    for k, b in b18.items():
        mw = {"car_sedan": 340, "car_conv": 340, "car_police": 340, "moto": 200, "cop_aim": 150}.get(k, 300)
        sizes[k] = put(k, fit(cutout(r18, b, "bg", frac=.1), maxw=mw), q=80)

    # --- неоновые здания с листа 17 (серый фон) ---
    b17 = {"neon_hotel": (29, 0, 488, 263), "neon_motel": (490, 3, 977, 263), "neon_cafe": (9, 271, 399, 478)}
    for k, b in b17.items():
        sizes[k] = put(k, fit(cutout(r17, b, "bg", frac=.1), maxw=380), q=78)

    json.dump(ASSETS, open(OUT, "w"), separators=(",", ":"))
    tot = sum(sizes.values())
    print("assets", len(ASSETS), "binary bytes", tot, "json bytes", os.path.getsize(OUT))
    for k, v in sorted(sizes.items(), key=lambda x: -x[1])[:12]:
        print("  ", k, v)

    # --- контрольный лист: всё на закатном фоне ---
    W = 1600
    x = y = rowh = 0
    sheet = Image.new("RGB", (W, 2600), (150, 90, 170))
    for name, im in PREV:
        if im.mode != "RGBA":
            continue
        w, h = im.size
        if x + w > W:
            x, y, rowh = 0, y + rowh + 6, 0
        sheet.paste(im, (x, y), im)
        x += w + 6
        rowh = max(rowh, h)
    sheet.crop((0, 0, W, y + rowh + 6)).save(PREVIEW)

if __name__ == "__main__":
    main()
