"""Leaf card back: the owner's #9 fitted to the leaf's own cut line.

The back shares the front's cut line (the card turned over and read sideways: the front's outline transposed),
which is fuller than #9's slim eye. #9 is mapped onto the card with an explicit, smooth map:
  * along the edge, every point keeps its distance from the rim (scaled), so the gold rim, the cream gap and the
    thin gold line run along the new edge exactly as on #9;
  * the two end panels (crest, shield, flourishes and their S-curves) move and scale as solid pieces, so they keep
    their proportions;
  * in between, the two blend over a wide band, so the plain green and cream take the stretch.
The outer rim is then redrawn from #9's own cross-section for a clean, even cut edge.

usage: leafback4.py <#9 PNG> <outlines.ts> <out.png> [px_per_mm]
"""
import re
import sys

import cv2
import numpy as np
from PIL import Image

src_path, outlines_ts, out_path = sys.argv[1:4]
K = float(sys.argv[4]) if len(sys.argv) > 4 else 11.811  # 300 dpi
BLEND = float(sys.argv[5]) if len(sys.argv) > 5 else 140  # #9 px over which the panels hand over to the edge
PANEL_MAX = float(sys.argv[6]) if len(sys.argv) > 6 else 1.3

# ---------------------------------------------------------------- #9
S = np.array(Image.open(src_path).convert('RGBA')).astype(np.float32)
RGB = S[..., :3]
a = (S[..., 3] > 128).astype(np.uint8)
cnts, _ = cv2.findContours(a, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cS = max(cnts, key=cv2.contourArea)[:, 0, :].astype(np.float64)
mS = np.zeros_like(a)
cv2.drawContours(mS, [cS.astype(np.int32)], -1, 1, cv2.FILLED)
hS, wS = mS.shape


def dist_in(m):
    """Distance to the outline (the image border is not an edge: the leaf touches its box at its widest)."""
    pad = cv2.copyMakeBorder(m, 4, 4, 4, 4, cv2.BORDER_CONSTANT, value=0)
    return cv2.distanceTransform(pad, cv2.DIST_L2, 5)[4:-4, 4:-4]


dS = dist_in(mS)
mid = np.zeros_like(mS)
mid[:, 640:1230] = 1
prof = [None]
for k in range(1, 91):
    prof.append(np.median(RGB[(mid > 0) & (np.abs(dS - k) < 0.5)], axis=0))
prof[0] = prof[1]
prof = np.array(prof)
cream = np.median(RGB[(mid > 0) & (dS > 120)], axis=0)
diff = np.abs(prof - cream).sum(1)
rim_end = int(np.nonzero(diff < 18)[0][0])
line_px = np.nonzero(diff[rim_end:] > 30)[0] + rim_end
line_lo, line_hi = int(line_px.min()), int(line_px.max())
print(f'rim 0..{rim_end}px, thin line {line_lo}..{line_hi}px from the edge (on #9)')

# ---------------------------------------------------------------- the card (front's outline, transposed)
d = re.search(r"LEAF_OUTLINE = '([^']*)'", open(outlines_ts).read()).group(1)
pts = np.array([[float(x), float(y)] for x, y in re.findall(r'(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)', d)])[:, ::-1]
W, H = int(round(pts[:, 0].max() * K)), int(round(pts[:, 1].max() * K))
cT = pts * K
mT = np.zeros((H, W), np.uint8)
cv2.fillPoly(mT, [np.round(cT).astype(np.int32)], 1)
dT = dist_in(mT)


def chains(c):
    i0, i1 = int(np.argmin(c[:, 0])), int(np.argmax(c[:, 0]))
    n = len(c)
    a_ = np.array([c[(i0 + k) % n] for k in range((i1 - i0) % n + 1)])
    b_ = np.array([c[(i1 + k) % n] for k in range((i0 - i1) % n + 1)][::-1])
    return (a_, b_) if a_[:, 1].mean() < b_[:, 1].mean() else (b_, a_)


def at_x(p, xs):
    o = np.argsort(p[:, 0])
    return np.interp(xs, p[o, 0], p[o, 1])


upS, loS = chains(cS)
upT, loT = chains(cT)
tipS = np.array([upS[0], upS[-1]])
tipT = np.array([upT[0], upT[-1]])
g = (tipT[1, 0] - tipT[0, 0]) / (tipS[1, 0] - tipS[0, 0])
print('scale #9 -> card', round(g, 3))

# ---------------------------------------------------------------- the edge map E (#9 -> card)
# x: same place along the length. y: within B (#9 px) of the top or bottom edge, the same distance from that edge
# (scaled by g); the rest of the column stretched evenly between.
yyS, xxS = np.mgrid[0:hS, 0:wS].astype(np.float64)
fS = (xxS - tipS[0, 0]) / (tipS[1, 0] - tipS[0, 0])
xT_of = tipT[0, 0] + fS * (tipT[1, 0] - tipT[0, 0])
uS = at_x(upS, xxS[0])[None, :].repeat(hS, 0)
lS = at_x(loS, xxS[0])[None, :].repeat(hS, 0)
uT = at_x(upT, xT_of[0])[None, :].repeat(hS, 0)
lT = at_x(loT, xT_of[0])[None, :].repeat(hS, 0)
colS = np.maximum(lS - uS, 1)
B = np.minimum(70.0, colS / 3)
dt, db = yyS - uS, lS - yyS
# piecewise: [0,B] -> [0,gB]; [B, colS-B] -> [gB, colT-gB] linear; [colS-B, colS] -> [colT-gB, colT]
colT = lT - uT
inner_s = np.maximum(colS - 2 * B, 1)
inner_t = np.maximum(colT - 2 * g * B, 1)
yT_of = np.where(dt < B, uT + dt * g,
                 np.where(db < B, lT - db * g, uT + g * B + (dt - B) * inner_t / inner_s))
E = np.stack([xT_of, yT_of], -1)

# ---------------------------------------------------------------- the end panels: one similarity each
panels = {'L': (40, 560), 'R': (1330, 1735)}


def panel_xform(k):
    x0, x1 = panels[k]
    xm = (x0 + x1) / 2
    f = (xm - tipS[0, 0]) / (tipS[1, 0] - tipS[0, 0])
    hs = at_x(loS, [xm])[0] - at_x(upS, [xm])[0]
    xt = tipT[0, 0] + f * (tipT[1, 0] - tipT[0, 0])
    ht = at_x(loT, [xt])[0] - at_x(upT, [xt])[0]
    s = float(np.clip(ht / hs, g, g * PANEL_MAX))
    cs = np.array([xm, (at_x(loS, [xm])[0] + at_x(upS, [xm])[0]) / 2])
    end = 0 if k == 'L' else 1
    ct_line = np.array([xt, (at_x(loT, [xt])[0] + at_x(upT, [xt])[0]) / 2])
    ct_tip = tipT[end] - (tipS[end] - cs) * s
    ct = 0.35 * ct_tip + 0.65 * ct_line
    return s, cs, ct


X = {k: panel_xform(k) for k in panels}
for k, (s, cs, ct) in X.items():
    print('panel', k, 'scale', round(s / g, 3), 'x overall')


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


F = E.copy()
for k, (x0, x1) in panels.items():
    s, cs, ct = X[k]
    Sm = ct + (np.stack([xxS, yyS], -1) - cs) * s
    along = smooth((x1 + 60 - xxS) / 120) if k == 'L' else smooth((xxS - (x0 - 60)) / 120)
    w = (along * smooth((dS - line_hi) / BLEND))[..., None]
    F = F * (1 - w) + Sm * w
Fx = np.ascontiguousarray(F[..., 0], np.float32)
Fy = np.ascontiguousarray(F[..., 1], np.float32)

# ---------------------------------------------------------------- invert F on the card (fixed point)
step = 3
gy, gx = np.mgrid[0:H + step:step, 0:W + step:step].astype(np.float32)
# start: the edge map's inverse is easy to approximate by a global scale about the tips
px = (gx - tipT[0, 0]) / g + tipS[0, 0]
py = (gy - (tipT[0, 1])) / g + tipS[0, 1]
for it in range(400):
    px, py = px.astype(np.float32), py.astype(np.float32)
    fx = cv2.remap(Fx, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    fy = cv2.remap(Fy, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    ex, ey = fx - gx, fy - gy
    px = np.clip(px - 0.5 * ex / g, 0, wS - 1)
    py = np.clip(py - 0.5 * ey / g, 0, hS - 1)
err = np.sqrt(ex ** 2 + ey ** 2)
inside = cv2.resize(mT, (gx.shape[1], gx.shape[0]), interpolation=cv2.INTER_NEAREST) > 0
print('inverse error on the card (px): median', round(float(np.median(err[inside])), 2), 'p99', round(float(np.percentile(err[inside], 99)), 2))
px, py = px.astype(np.float32), py.astype(np.float32)
mapx = cv2.resize(px, (gx.shape[1] * step, gx.shape[0] * step), interpolation=cv2.INTER_LINEAR)[:H, :W]
mapy = cv2.resize(py, (gx.shape[1] * step, gx.shape[0] * step), interpolation=cv2.INTER_LINEAR)[:H, :W]

pre = S.copy()
pre[..., :3] *= pre[..., 3:4] / 255
warped = cv2.remap(pre, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
al = np.clip(warped[..., 3:4], 1e-3, 255)
out = np.clip(warped[..., :3] / al * 255, 0, 255)

# the outer gold rim, from #9's cross-section (a clean cut edge everywhere, tips included)
idx = np.clip(dT / g, 0, len(prof) - 1.001)
i0 = np.floor(idx).astype(int)
fr = (idx - i0)[..., None]
prof_px = prof[i0] * (1 - fr) + prof[np.minimum(i0 + 1, len(prof) - 1)] * fr
w_rim = np.clip((rim_end + 0.5 - dT / g) / 1.5, 0, 1)[..., None]
out = out * (1 - w_rim) + prof_px * w_rim

alpha_out = cv2.GaussianBlur(mT.astype(np.float32) * 255, (0, 0), 0.7)
Image.fromarray(np.dstack([out, alpha_out[..., None]]).astype(np.uint8)).save(out_path)
print('card', W, 'x', H)
