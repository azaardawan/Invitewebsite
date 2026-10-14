"""Shaped cards (leaf, heart) for Royal Olive Crest.

The FRONT artwork's outline is the cut line. A card has one outline, so each BACK artwork is reshaped,
row by row, to the front's outline mirrored left-right (turned over, the back must line up with the front).
`turn` = `cream`: the back artwork doesn't fit the front's outline, so the back is the front itself, mirrored,
with its green field turned to cream (gold kept): exactly the front's shape, rim and crest.
`turn` = `sideways` when the back is read with the card turned a quarter (a portrait leaf whose back is a
landscape design, like the A5 card): its outline is then the mirrored front turned so the front's top is on
the left, which is the front's outline transposed.
Writes <name>-front.webp, <name>-back.webp (transparent outside the shape) and <name>.outline.json
(the cut line as an SVG path in millimetres, for a card of the given width).
"""
import sys, os, json
import numpy as np
import cv2
from PIL import Image

name, front_src, back_src, turn, width_mm, out = sys.argv[1:7]
width_mm = float(width_mm)
os.makedirs(out, exist_ok=True)


def rgba(path):
    im = np.array(Image.open(path).convert('RGBA'))
    if im[..., 3].min() == 255:  # no transparency (white background): flood-fill the white outside
        rgb = im[..., :3].astype(int)
        white = (rgb.min(axis=2) > 238).astype(np.uint8) * 255
        h, w = white.shape
        mask = np.zeros((h + 2, w + 2), np.uint8)
        for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
            cv2.floodFill(white, mask, seed, 128)
        im[..., 3] = np.where(white == 128, 0, 255).astype(np.uint8)
    return im


def crop(im):
    a = im[..., 3] > 128
    ys, xs = np.nonzero(a)
    return im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def clean_alpha(im):
    """A solid shape (fill pinholes), soft 1 px edge, no near-invisible fringe."""
    a = (im[..., 3] > 128).astype(np.uint8) * 255
    cnts, _ = cv2.findContours(a, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    big = max(cnts, key=cv2.contourArea)
    solid = np.zeros_like(a)
    cv2.drawContours(solid, [big], -1, 255, cv2.FILLED)
    im = im.copy()
    im[..., 3] = cv2.GaussianBlur(solid, (0, 0), 0.7)
    return im, big


def spans(row):
    """Runs of inside pixels in one row: [(start, end)] (end exclusive)."""
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    return list(zip(np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]))


front = crop(rgba(front_src))
front, contour = clean_alpha(front)
H, W = front.shape[:2]
front_alpha = front[..., 3]
if turn == 'cream':
    m = front[:, ::-1].copy()
    f = m[..., :3].astype(float)
    lum = f.mean(axis=2)
    green = np.clip((f[..., 1] - f[..., 0] + 14) / 12, 0, 1) * np.clip((150 - lum) / 35, 0, 1)
    shade = np.clip(0.55 + 0.45 * lum / max(1.0, float(np.median(lum[green > 0.95]))), 0.85, 1.06)[..., None]
    cream = np.array([246, 238, 221], float) * shade
    m[..., :3] = np.clip(cream * green[..., None] + f * (1 - green[..., None]), 0, 255).astype(np.uint8)
    warped = m
back = crop(rgba(back_src))
# Where the back must be: the front's outline mirrored (or, turned sideways, transposed).
back_alpha = np.ascontiguousarray(front_alpha.T) if turn == 'sideways' else np.ascontiguousarray(front_alpha[:, ::-1])
BH, BW = back_alpha.shape
back = cv2.resize(back, (back.shape[1] * BH // back.shape[0], BH), interpolation=cv2.INTER_AREA)
back, _ = clean_alpha(back)
target = back_alpha > 128
if turn == 'cream':
    target = target[:0]  # nothing to reshape
src_in = back[..., 3] > 128
map_x = np.full((BH, BW), -1, np.float32)
map_y = np.repeat(np.arange(BH, dtype=np.float32)[:, None], BW, axis=1)
for y in range(0 if turn == "cream" else BH):
    ts, ss = spans(target[y]), spans(src_in[y])
    if not ts or not ss:
        continue
    if len(ts) != len(ss):  # e.g. the heart's two lobes on one side only: use the overall span
        ts, ss = [(ts[0][0], ts[-1][1])], [(ss[0][0], ss[-1][1])]
    for (t0, t1), (s0, s1) in zip(ts, ss):
        xs = np.arange(t0, t1)
        map_x[y, t0:t1] = s0 + (xs - t0 + 0.5) * (s1 - s0) / max(1, t1 - t0) - 0.5
if turn != 'cream':
    valid = map_x >= 0
    warped = cv2.remap(back, map_x, map_y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    warped[..., 3] = np.where(valid, back_alpha, 0)

px_per_mm = W / width_mm
height_mm = H / px_per_mm


def save(im, path):
    Image.fromarray(im, 'RGBA').save(path, 'WEBP', quality=88, alpha_quality=95, method=6)
    print(path, im.shape[1], 'x', im.shape[0], os.path.getsize(path) // 1024, 'KB')


save(front, os.path.join(out, f'{name}-front.webp'))
save(warped, os.path.join(out, f'{name}-back.webp'))

# The cut line: the front's outline, simplified to 0.6 px, in millimetres (y down, origin top-left).
approx = cv2.approxPolyDP(contour, 0.6, True)[:, 0, :].astype(float) / px_per_mm
path = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in approx) + ' Z'
json.dump({'widthMm': round(width_mm, 1), 'heightMm': round(height_mm, 1), 'backSideways': turn == 'sideways', 'points': len(approx), 'outline': path}, open(os.path.join(out, f'{name}.outline.json'), 'w'))
print(name, f'{width_mm:.1f} x {height_mm:.1f} mm, outline {len(approx)} points')
