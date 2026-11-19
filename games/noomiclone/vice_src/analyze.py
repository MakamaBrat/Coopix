"""Находит отдельные спрайты в листах и показывает рамки (для подбора вырезок)."""
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = __import__("os").path.dirname(__import__("os").path.abspath(__file__))

def bg_alpha(im, tol=34):
    """листы с серым фоном: фон = светлый малонасыщенный цвет, связанный с краем."""
    a = np.array(im.convert("RGB")).astype(int)
    mn, mx = a.min(2), a.max(2)
    cand = (mn > 188) & (mx - mn < 26)
    lab, n = ndi.label(cand)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    return ~bg

def boxes(alpha, dil=6, minarea=900):
    m = ndi.binary_dilation(alpha, iterations=dil)
    lab, n = ndi.label(m)
    out = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        if h * w < minarea:
            continue
        out.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
    out.sort(key=lambda b: (b[1] // 120, b[0]))
    return out

if __name__ == "__main__":
    for n, kind in ((17, "bg"), (18, "bg"), (20, "alpha")):
        im = Image.open(f"{HERE}/ref{n}.webp")
        al = bg_alpha(im) if kind == "bg" else np.array(im.convert("RGBA"))[..., 3] > 24
        bs = boxes(al, dil=5 if n != 20 else 4)
        print(n, im.size, len(bs))
        vis = im.convert("RGB").copy()
        d = ImageDraw.Draw(vis)
        for k, b in enumerate(bs):
            d.rectangle(b, outline=(0, 255, 0), width=2)
            d.text((b[0] + 3, b[1] + 3), str(k), fill=(255, 0, 0))
            print("  ", k, b, (b[2] - b[0], b[3] - b[1]))
        vis.save(f"{HERE}/_an{n}.png")
