"""Split the owner's envelope (#1) into a clean envelope (no seal) + a seal layer.

Under the seal, each flap is rebuilt by copying its own pixels from further along
its nearest fold line, so the gold line, the edge shadow and the paper texture
continue naturally to the point where the flaps meet.
"""
import sys
import numpy as np
import cv2
from PIL import Image

src, out_env, out_seal = sys.argv[1:4]
img = np.array(Image.open(src).convert('RGB'))
H, W = img.shape[:2]

_f = img.astype(int)
_gold = (_f[..., 0] > 140) & (_f[..., 1] > 105) & (_f[..., 2] < 120) & (_f[..., 0] - _f[..., 2] > 60)
def _fit(x0, x1, y0, y1, guess):
    yy, xx = np.nonzero(_gold[y0:y1, x0:x1]); yy = yy + y0; xx = xx + x0
    keep = np.abs(xx - (guess[0] * yy + guess[1])) < 6
    m, c = np.polyfit(yy[keep], xx[keep], 1)
    return m, c
_bl = _fit(60, 340, 900, 1350, (-0.7320, 943.87)); _br = _fit(684, 964, 900, 1350, (0.7194, 90.55))
print('bottom fits', _bl, _br)
BL_FIT = (_bl[0], _bl[1] - 26); BR_FIT = (_br[0], _br[1] + 26)
# Fold lines (x = m*y + c), fitted on the gold lines, then moved out to the paper edge (26 px).
TL = (0.7626, -27.55 - 26)   # top flap, left edge
TR = (-0.7720, 1054.34 + 26)  # top flap, right edge
BL = BL_FIT   # bottom flap, left edge
BR = BR_FIT     # bottom flap, right edge

ys, xs = np.mgrid[0:H, 0:W]
def x_on(line, y):
    return line[0] * y + line[1]

top = (xs >= x_on(TL, ys)) & (xs <= x_on(TR, ys))
bottom = (xs <= x_on(BL, ys)) | (xs >= x_on(BR, ys))
bottom = ~bottom & ~top
left = ~top & ~bottom & (xs < W / 2)
right = ~top & ~bottom & (xs >= W / 2)

# Seal + leaves: gold-ish pixels in the centre, closed and filled.
f = img.astype(int)
R, G, B = f[..., 0], f[..., 1], f[..., 2]
goldish = ((R - B) > 45) & (R > 95)
box = np.zeros_like(goldish)
box[505:930, 160:870] = True
seal = (goldish & box).astype(np.uint8) * 255
# Remove the thin fold lines that pass through the box: an opening keeps only thick shapes.
seal = cv2.morphologyEx(seal, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
seal = cv2.morphologyEx(seal, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
# Fill holes (the seal's flat face can contain darker texture).
cnts, _ = cv2.findContours(seal, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
big = [c for c in cnts if cv2.contourArea(c) > 40]
seal = np.zeros_like(seal)
cv2.drawContours(seal, big, -1, 255, thickness=cv2.FILLED)
hole = cv2.dilate(seal, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
hole = np.maximum(np.maximum(hole, np.roll(hole, 30, axis=0)), np.roll(hole, 60, axis=0))
cv2.circle(hole, (512, 682), 175, 255, -1)
hole = hole > 0  # what we rebuild (seal, leaves and the shadow they cast)

def shift_copy(dst, mask, dx, dy):
    yy, xx = np.nonzero(mask)
    sy = np.clip(np.round(yy + dy).astype(int), 0, H - 1)
    sx = np.clip(np.round(xx + dx).astype(int), 0, W - 1)
    dst[yy, xx] = img[sy, sx]

def dist(line, y, x):
    m, c = line
    return np.abs(x - (m * y + c)) / np.sqrt(1 + m * m)

clean = img.copy()
STEP = 300  # rows to move along a fold line

def candidate(py, px, line, dy):
    """Copy of each pixel from further along `line`: per pixel, the first usable step (preferred step first)."""
    out = np.zeros((len(py), 3)); done = np.zeros(len(py), bool)
    for step in list(range(abs(dy), 40, -10)) + list(range(abs(dy) + 10, 900, 10)):
        sdy = step if dy > 0 else -step
        sx, sy = np.round(px + line[0] * sdy).astype(int), np.round(py + sdy).astype(int)
        ok = ~done & (sx >= 15) & (sx < W - 15) & (sy >= 15) & (sy < H - 15)
        ok[ok] &= ~hole[sy[ok], sx[ok]]
        out[ok] = img[sy[ok], sx[ok]]
        done |= ok
        if done.all():
            return out
    raise SystemExit('no clean source found')

for region, lines, dys in (
    (top, (TL, TR), (-STEP, -STEP)),
    (bottom, (BL, BR), (150, 150)),
    (left, (TL, BL), (-STEP, STEP)),
    (right, (TR, BR), (-STEP, STEP)),
):
    py, px = np.nonzero(hole & region)
    a0 = candidate(py, px, lines[0], dys[0])
    a1 = candidate(py, px, lines[1], dys[1])
    d0, d1 = dist(lines[0], py, px), dist(lines[1], py, px)
    # Nearest line wins; within 25 px of the halfway line the two copies cross-fade.
    w0 = np.clip(0.5 + (d1 - d0) / 50.0, 0, 1)[:, None]
    clean[py, px] = (a0 * w0 + a1 * (1 - w0)).astype(np.uint8)

# Even out the light: rebuilt pixels take the soft brightness of their surroundings.
hm = hole.astype(np.uint8) * 255
def low(x):
    return cv2.GaussianBlur(x.astype(np.float32), (0, 0), 18)
ref = cv2.inpaint(cv2.GaussianBlur(img, (0, 0), 6), hm, 25, cv2.INPAINT_TELEA).astype(np.float32)
gain = (low(ref) + 1) / (low(clean) + 1)
fixed = np.clip(clean * gain, 0, 255).astype(np.uint8)
clean[hole] = fixed[hole]

# Blend rebuilt pixels in over 14 px from the hole's edge, so no seam shows.
inside = cv2.distanceTransform(hole.astype(np.uint8), cv2.DIST_L2, 5)
w = np.clip(inside / 14.0, 0, 1)[..., None]
clean = (clean * w + img * (1 - w)).astype(np.uint8)
Image.fromarray(clean).save(out_env)

# Seal layer: the seal disc plus the gold leaves only (no fold lines, no green between leaves).
leaf = ((goldish | ((R - B) > 30) & (R > 70)) & box).astype(np.uint8) * 255
leaf = cv2.morphologyEx(leaf, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
gold_lines = np.zeros((H, W), bool)
for line in ((0.7626, -27.55), (-0.7720, 1054.34), BL_FIT[:1] + (BL_FIT[1] + 26,), BR_FIT[:1] + (BR_FIT[1] - 26,)):
    gold_lines |= dist(line, ys, xs) < 6
disc = np.zeros((H, W), np.uint8)
cv2.circle(disc, (512, 682), 141, 255, -1)
leaf[gold_lines & (disc == 0)] = 0
leaf = cv2.morphologyEx(leaf, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
n, lab, stats, _ = cv2.connectedComponentsWithStats(leaf)
keep = np.zeros_like(leaf)
for i in range(1, n):
    comp = lab == i
    if stats[i, cv2.CC_STAT_AREA] > 150 and (R[comp] - B[comp]).mean() > 55 and R[comp].mean() > 120:
        keep[lab == i] = 255
alpha = np.maximum(keep, disc)
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
rgba = np.dstack([img, alpha])
yy, xx = np.nonzero(alpha > 8)
y0, y1, x0, x1 = yy.min(), yy.max() + 1, xx.min(), xx.max() + 1
Image.fromarray(rgba[y0:y1, x0:x1]).save(out_seal)
print('seal box', x0, y0, x1, y1, 'of', W, H)

# Seal face (the flat inner disc) for the initials: the largest bright circle near the centre.
gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
circles = cv2.HoughCircles(cv2.GaussianBlur(gray, (0, 0), 2)[500:900, 330:700], cv2.HOUGH_GRADIENT, 1.2, 50, param1=80, param2=40, minRadius=80, maxRadius=150)
print('circles', None if circles is None else (circles[0][:4] + [330, 500, 0]).round())

# Apexes, for the flap clip paths (percent of the image box).
def meet(a, b):
    y = (b[1] - a[1]) / (a[0] - b[0])
    return a[0] * y + a[1], y
for name, (a, b) in {'top apex': (TL, TR), 'bottom apex': (BL, BR)}.items():
    x, y = meet(a, b)
    print(name, round(x / W * 100, 2), round(y / H * 100, 2))
for name, line in {'TL': TL, 'TR': TR, 'BL': BL, 'BR': BR}.items():
    # where each line crosses the image's left/right edge
    m, c = line
    print(name, 'y at x=0', round((0 - c) / m / H * 100, 2), 'y at x=W', round((W - c) / m / H * 100, 2))
