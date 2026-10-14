"""Export the owner's artwork for Royal Olive Crest v1 as optimised WebP."""
import sys, os
import numpy as np
import cv2
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)


def defringe(im: Image.Image) -> Image.Image:
    """Cut-outs: drop near-invisible pixels and give soft edge pixels the colour of the solid art next to
    them (removes the red/yellow halo left by background removal)."""
    a = np.array(im.convert('RGBA'))
    rgb, al = a[..., :3].copy(), a[..., 3].copy()
    al[al < 25] = 0
    soft = ((al < 210) & (al > 0)).astype(np.uint8)
    unknown = ((al < 210)).astype(np.uint8) * 255
    fixed = cv2.inpaint(np.ascontiguousarray(rgb), unknown, 3, cv2.INPAINT_TELEA)
    rgb[soft > 0] = fixed[soft > 0]
    rgb[al == 0] = 0
    return Image.fromarray(np.dstack([rgb, al]), 'RGBA')


def trim(im: Image.Image, pad=4) -> Image.Image:
    box = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def save(im, name, width=None, q=82, alpha=False):
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    path = os.path.join(OUT, name)
    if alpha:
        im.save(path, 'WEBP', quality=q, alpha_quality=90, method=6)
    else:
        im.convert('RGB').save(path, 'WEBP', quality=q, method=6)
    print(f'{name:22s} {im.width}x{im.height} {os.path.getsize(path) // 1024} KB')


p = lambda n: os.path.join(SRC, n)
# Opening
save(Image.open(p('env-clean.png')), 'envelope.webp', q=80)
save(defringe(Image.open(p('seal-layer.png'))), 'seal.webp', q=86, alpha=True)
# Invitation sheets (owner's numbering in the brief)
for src, name in [('top.png', 'sheet-names.webp'), ('verse.png', 'sheet-verse.webp'), ('message.png', 'sheet-message.webp'),
                  ('venue.png', 'sheet-venue.webp'), ('countdown.png', 'sheet-countdown.webp')]:
    save(Image.open(p('src/' + src)), name, q=80)
# Print
save(Image.open(p('src/card-front.png')), 'card-front.webp', q=86)
save(Image.open(p('src/card-back.png')), 'card-back.webp', q=86)
save(Image.open(p('src/keepsake.png')), 'keepsake-cover.webp', q=86)
# Ornaments (cut-outs)
save(trim(defringe(Image.open(p('src/crest.png')))), 'crest.webp', width=900, q=86, alpha=True)
save(trim(defringe(Image.open(p('src/divider.png')))), 'divider.webp', width=1000, q=86, alpha=True)
# The border's corner: the owner's flourish is a top-left corner; ThemeBorder wants the top-right one.
corner = trim(defringe(Image.open(p('src/corner.png')))).transpose(Image.FLIP_LEFT_RIGHT)
save(corner, 'corner.webp', width=520, q=86, alpha=True)
