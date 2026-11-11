"""Cut the seed sculpture into a base plate and one thumb segment.

The distal phalanx of the thumb rotates about the interphalangeal joint.
Index, ring, and little finger stay on the plate. Run from the repo root:

    python3 src/instruments/prime/hand/extract.py
"""

from pathlib import Path
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

SEED = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/workspace/attachments/1000047309.png")
OUT = Path(__file__).resolve().parent

# Distal thumb, slightly past the IP crease so the segment overlaps the stump.
POLY = [
    (832, 516), (848, 494), (866, 474), (882, 466), (896, 484),
    (916, 514), (940, 558), (966, 608), (988, 656), (1006, 700),
    (1012, 728),
    (968, 758), (908, 770), (842, 758), (806, 730),
    (786, 680), (792, 624), (804, 572), (818, 534),
]
# Image-space pivot on the IP knuckle. CSS origin is this point as a percentage.
PIVOT = (914, 706)


def build(seed: Path = SEED):
    rgb = np.asarray(Image.open(seed).convert("RGB"))
    height, width = rgb.shape[:2]
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).polygon(POLY, fill=255)
    core = np.asarray(mask)
    blur = cv2.GaussianBlur(core, (0, 0), 1.05).astype(np.float32) / 255.0
    dist = cv2.distanceTransform(core, cv2.DIST_L2, 3)
    alpha = blur.copy()
    alpha[dist > 1.4] = 1.0

    p0 = np.array([798.0, 730.0])
    p1 = np.array([1020.0, 744.0])
    tangent = p1 - p0
    tangent /= np.linalg.norm(tangent)
    yy, xx = np.mgrid[0:height, 0:width]
    side = (xx - p0[0]) * tangent[1] - (yy - p0[1]) * tangent[0]
    sign = np.sign((880 - p0[0]) * tangent[1] - (470 - p0[1]) * tangent[0])
    proximal = (core > 0) & (side * sign < 0)
    alpha[proximal] *= np.clip(1 - np.abs(side[proximal]) / 30.0, 0, 1)

    erase = ((core > 0) & (side * sign > 2)).astype(np.uint8) * 255
    erase = cv2.dilate(erase, np.ones((3, 3), np.uint8))
    erase = np.where(cv2.dilate((core > 0).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0, erase, 0)
    erase = erase.astype(np.uint8)

    known = erase == 0
    base = rgb.copy()
    cx, cy = 930.0, 620.0
    ys, xs = np.nonzero(erase)
    for y, x in zip(ys.tolist(), xs.tolist()):
        dx, dy = x - cx, y - cy
        norm = (dx * dx + dy * dy) ** 0.5 or 1.0
        dx, dy = dx / norm, dy / norm
        fx, fy = float(x), float(y)
        taken = None
        for _ in range(200):
            fx += dx
            fy += dy
            ix, iy = int(fx), int(fy)
            if not (0 <= ix < width and 0 <= iy < height):
                break
            if known[iy, ix]:
                taken = rgb[iy, ix]
                break
        if taken is None:
            taken = rgb[y, min(width - 1, x + 30)]
        base[y, x] = taken
    softened = cv2.GaussianBlur(base, (0, 0), 0.7)
    base = np.where(erase[..., None] > 0, softened, rgb)

    cut = np.dstack([rgb, (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
    Image.fromarray(base, "RGB").save(OUT / "base.webp", quality=86, method=6)
    Image.fromarray(cut, "RGBA").save(OUT / "thumb.webp", quality=86, method=6)
    ox = round(100 * PIVOT[0] / width, 3)
    oy = round(100 * PIVOT[1] / height, 3)
    (OUT / "pivot.txt").write_text(f"{ox}% {oy}%\n")
    return base, cut


if __name__ == "__main__":
    build()
    print("wrote", OUT)
