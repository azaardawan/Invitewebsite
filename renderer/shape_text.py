"""
shape_text.py - Arabic and Kurdish lettering for the film.

Blender's text objects place one glyph per character, left to right: Arabic letters would come
out unjoined and backwards. So texts with Arabic letters are shaped here first with HarfBuzz
(the shaping engine browsers use: joined letters, right to left, ligatures, marks) in Amiri,
merged into one outline without overlaps (skia-pathops) and written as an SVG. render_invite.py presses
that SVG into the card exactly where, and at the size, the Latin text would have been.

Runs in the server's Python (uharfbuzz, fontTools, skia-pathops), not inside Blender.
"""

import os
import re

ARABIC = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
FONT_FILE = "Amiri-Regular.ttf"


def has_arabic(text: str) -> bool:
    return bool(ARABIC.search(text or ""))


def shape_to_svg(text: str, out_path: str, font_path: str) -> dict:
    """Shape `text` and write it as an SVG in font units. Returns the ink box and the em size."""
    import pathops
    import uharfbuzz as hb
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.ttLib import TTFont

    with open(font_path, "rb") as fh:
        data = fh.read()
    face = hb.Face(data)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()          # script and direction (RTL for Arabic) from the text
    hb.shape(font, buf, {"kern": True, "liga": True})

    tt = TTFont(font_path)
    glyphs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    upem = tt["head"].unitsPerEm

    # Every glyph into one outline; joined letters and marks overlap, so they are merged into
    # one clean shape (no overlaps, holes kept) that Blender can cut into the card.
    outline, x = pathops.Path(), 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        dx, dy = x + pos.x_offset, pos.y_offset
        # Font units are y-up; SVG is y-down.
        glyphs[order[info.codepoint]].draw(TransformPen(outline.getPen(glyphSet=glyphs), (1, 0, 0, -1, dx, -dy)))
        x += pos.x_advance
    outline.simplify(fix_winding=True)
    if outline.bounds == (0, 0, 0, 0):
        raise ValueError(f"nothing to draw for {text!r}")
    pen = SVGPathPen(None)
    outline.draw(pen)
    paths = [pen.getCommands()]
    x0, y0, x1, y1 = outline.bounds
    pad = upem * 0.01
    vb = (x0 - pad, y0 - pad, (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad)
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}">\n')
        for d in paths:
            fh.write(f'  <path d="{d}"/>\n')
        fh.write("</svg>\n")
    return {"svg": os.path.abspath(out_path), "width_em": vb[2] / upem, "height_em": vb[3] / upem}
