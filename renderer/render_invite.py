"""
render_invite.py - personalise master_template.blend and render it to an H.264 .mp4.

Usage (headless):
    blender -b /app/master_template.blend --python-exit-code 1 -P /app/render_invite.py -- \
        --initials "Y | M" --names "Yuval & Mevorah" --date "01.06.2027" \
        --venue venue.svg --out /tmp/invite.mp4

Environment:
    RENDER_RES      WIDTHxHEIGHT, default 720x1280 (rounded down to even numbers for H.264)
    RENDER_SAMPLES  EEVEE samples per frame, default 1 (CPU / software OpenGL friendly)
    RENDER_FRAMES   optional "START-END" sub-range, e.g. "1-60" for a quick test
    ASSET_DIR       folder with the SVGs and font, default: this script's folder (/app)
"""

import argparse
import math
import os
import re
import shutil
import sys
import tempfile
import traceback
import xml.etree.ElementTree as ET

import bpy  # noqa: E402  (import bpy before bmesh)
import bmesh
from mathutils import Quaternion, Vector
from mathutils.geometry import interpolate_bezier

# Timing and layout of master_template.blend (must match build_template.py)
FRAME_START, FRAME_END = 1, 345
STITCH_END, LIFT_END, PULLBACK_END = 225, 255, 310
CARD_W, CARD_H = 1.08, 1.92
SAMPLE_STEP = 0.0006
DATE_CENTER, DATE_SIZE, DATE_MAX_WIDTH = (0.0, -0.255), 0.10, 0.80
HEART_CENTER, HEART_WIDTH = (0.0, -0.36), 0.10
FONT_FILE = "CormorantGaramond-Regular.ttf"

BASE_DIR = os.environ.get("ASSET_DIR") or os.path.dirname(os.path.abspath(__file__))


def log(msg):
    print(f"[render_invite] {msg}", flush=True)


def link(obj, collection=None):
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


_FONT = None


def get_font():
    """Always load the font from /app: the path stored in the .blend is from the build machine."""
    global _FONT
    if _FONT is None:
        path = os.path.join(BASE_DIR, FONT_FILE)
        if os.path.isfile(path):
            _FONT = bpy.data.fonts.load(path, check_existing=True)
        else:
            log(f"WARNING: {FONT_FILE} not found in {BASE_DIR}; using Blender's built-in font")
            _FONT = False
    return _FONT or None


# ======================================================================================
# Shared with build_template.py (SVG import, stitch path, animation baking)
# ======================================================================================

def smootherstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def set_attr(obj, name, value):
    if obj is not None and hasattr(obj, name):
        try:
            setattr(obj, name, value)
        except Exception:
            pass


def track_quat(src, dst):
    return (Vector(dst) - Vector(src)).to_track_quat("-Z", "Y")


_TOKEN = re.compile(r"[MmLlHhVvCcSsQqTtZzAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


def parse_svg_path(d):
    """Return list of subpaths; each is (closed, [segments]) with segments as cubic
    tuples (p0, c1, c2, p3) or ('L', p0, p3)."""
    toks = _TOKEN.findall(d)
    i, cmd = 0, None
    cur = start = (0.0, 0.0)
    last_ctrl = None
    subpaths, segs = [], []

    def num():
        nonlocal i
        v = float(toks[i])
        i += 1
        return v

    def finish(closed):
        nonlocal segs
        if segs:
            subpaths.append((closed, segs))
        segs = []

    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
            if cmd in "Zz":
                if segs and (abs(cur[0] - start[0]) > 1e-9 or abs(cur[1] - start[1]) > 1e-9):
                    segs.append(("L", cur, start))
                cur = start
                finish(True)
                last_ctrl = None
                continue
            if cmd in "Aa":
                raise ValueError("SVG arcs are not supported - convert them to curves")
        rel = cmd.islower()
        c = cmd.upper()
        ox, oy = cur if rel else (0.0, 0.0)
        if c == "M":
            finish(False)
            cur = start = (num() + ox, num() + oy)
            cmd = "l" if rel else "L"
            last_ctrl = None
        elif c == "L":
            p = (num() + ox, num() + oy)
            segs.append(("L", cur, p))
            cur, last_ctrl = p, None
        elif c == "H":
            p = (num() + (cur[0] if rel else 0.0), cur[1])
            segs.append(("L", cur, p))
            cur, last_ctrl = p, None
        elif c == "V":
            p = (cur[0], num() + (cur[1] if rel else 0.0))
            segs.append(("L", cur, p))
            cur, last_ctrl = p, None
        elif c == "C":
            c1 = (num() + ox, num() + oy)
            c2 = (num() + ox, num() + oy)
            p = (num() + ox, num() + oy)
            segs.append((cur, c1, c2, p))
            cur, last_ctrl = p, c2
        elif c == "S":
            c1 = (2 * cur[0] - last_ctrl[0], 2 * cur[1] - last_ctrl[1]) if last_ctrl else cur
            c2 = (num() + ox, num() + oy)
            p = (num() + ox, num() + oy)
            segs.append((cur, c1, c2, p))
            cur, last_ctrl = p, c2
        elif c in "QT":
            if c == "Q":
                q = (num() + ox, num() + oy)
            else:
                q = (2 * cur[0] - last_ctrl[0], 2 * cur[1] - last_ctrl[1]) if last_ctrl else cur
            p = (num() + ox, num() + oy)
            c1 = (cur[0] + 2 / 3 * (q[0] - cur[0]), cur[1] + 2 / 3 * (q[1] - cur[1]))
            c2 = (p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1]))
            segs.append((cur, c1, c2, p))
            cur, last_ctrl = p, q
        else:
            i += 1
    finish(False)
    return subpaths


def import_svg_as_gold_mesh(filename, name, center_xy, width_m, mat, col,
                            extrude=0.0007, bevel=0.0002, bevel_res=1):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.isfile(path):
        log(f"WARNING: {filename} not found in {BASE_DIR}; skipped")
        return None
    root = ET.parse(path).getroot()
    vb = [float(v) for v in re.split(r"[ ,]+", root.get("viewBox").strip())]
    vx, vy, vw, vh = vb
    s = width_m / vw
    cx, cy = center_xy

    def to_world(p):
        return Vector(((p[0] - vx - vw / 2) * s + cx, -(p[1] - vy - vh / 2) * s + cy, 0.0))

    tmp_col = bpy.data.collections.new(name + "_tmp")
    bpy.context.scene.collection.children.link(tmp_col)
    temp_objs = []
    for el in root.iter():
        if not el.tag.endswith("path") or not el.get("d"):
            continue
        try:
            subpaths = parse_svg_path(el.get("d"))
        except ValueError as exc:
            log(f"WARNING: {filename}: {exc}")
            continue
        cu = bpy.data.curves.new(f"{name}_p", "CURVE")
        cu.dimensions = "2D"
        cu.fill_mode = "BOTH"
        cu.extrude = extrude
        cu.bevel_depth = bevel
        cu.bevel_resolution = bevel_res
        cu.resolution_u = 4
        for closed, segs in subpaths:
            if all(seg[0] == "L" for seg in segs):
                pts = [segs[0][1]] + [seg[2] for seg in segs]
                if closed and len(pts) > 1 and pts[0] == pts[-1]:
                    pts = pts[:-1]
                if len(pts) < 3:
                    continue
                sp = cu.splines.new("POLY")
                sp.points.add(len(pts) - 1)
                flat = []
                for p in pts:
                    w = to_world(p)
                    flat += [w.x, w.y, 0.0, 1.0]
                sp.points.foreach_set("co", flat)
                sp.use_cyclic_u = True
            else:
                knots = []        # [co, left, right]
                for seg in segs:
                    if seg[0] == "L":
                        p0, p3 = to_world(seg[1]), to_world(seg[2])
                        c1, c2 = p0.lerp(p3, 1 / 3), p0.lerp(p3, 2 / 3)
                    else:
                        p0, c1, c2, p3 = (to_world(q) for q in seg)
                    if not knots:
                        knots.append([p0, p0.copy(), c1])
                    else:
                        knots[-1][2] = c1
                    knots.append([p3, c2, p3.copy()])
                if closed and len(knots) > 1 and (knots[0][0] - knots[-1][0]).length < 1e-7:
                    knots[0][1] = knots[-1][1]
                    knots.pop()
                if len(knots) < 2:
                    continue
                sp = cu.splines.new("BEZIER")
                sp.bezier_points.add(len(knots) - 1)
                for bp, (co, hl, hr) in zip(sp.bezier_points, knots):
                    bp.handle_left_type = bp.handle_right_type = "FREE"
                    bp.co, bp.handle_left, bp.handle_right = co, hl, hr
                sp.use_cyclic_u = True
        if len(cu.splines) == 0:
            bpy.data.curves.remove(cu)
            continue
        ob = bpy.data.objects.new(f"{name}_p", cu)
        tmp_col.objects.link(ob)
        temp_objs.append(ob)

    # Evaluate every path separately (overlapping shapes never cut holes in each other),
    # then join them into one mesh.
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    for ob in temp_objs:
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    final = bpy.data.meshes.new(name)
    bm.to_mesh(final)
    bm.free()
    for ob in temp_objs:
        cu = ob.data
        bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.curves.remove(cu)
    bpy.data.collections.remove(tmp_col)

    final.materials.append(mat)
    obj = link(bpy.data.objects.new(name, final), col)
    obj.location.z = extrude * 0.6
    log(f"{filename}: {len(temp_objs)} paths -> {len(final.vertices)} vertices")
    return obj


def resample_polyline(pts, step, closed):
    pts = [Vector(p) for p in pts]
    if closed and (pts[0] - pts[-1]).length > 1e-9:
        pts.append(pts[0].copy())
    out = [pts[0].copy()]
    carry = 0.0
    for a, b in zip(pts, pts[1:]):
        seg = (b - a).length
        if seg < 1e-12:
            continue
        d = step - carry
        while d <= seg:
            out.append(a.lerp(b, d / seg))
            d += step
        carry = seg - (d - step)
    if (out[-1] - pts[-1]).length > step * 0.25:
        out.append(pts[-1].copy())
    return out


def date_outline_polylines(text, center, size):
    """Text -> curve (Object.to_curve) -> glyph outlines sampled as polylines."""
    cu = bpy.data.curves.new("DateText_tmp", "FONT")
    cu.body = text
    font = get_font()
    if font:
        cu.font = font
    cu.size = size
    cu.align_x, cu.align_y = "CENTER", "CENTER"
    cu.resolution_u = 12
    ob = link(bpy.data.objects.new("DateText_tmp", cu))
    ob.location = (center[0], center[1], 0.0)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ob_eval = ob.evaluated_get(dg)
    curve = ob_eval.to_curve(dg, apply_modifiers=False)
    mw = ob.matrix_world.copy()
    outlines = []
    for sp in curve.splines:
        pts = []
        if sp.type == "BEZIER":
            bps = list(sp.bezier_points)
            n = len(bps)
            rng = n if sp.use_cyclic_u else n - 1
            for k in range(rng):
                a, b = bps[k], bps[(k + 1) % n]
                seg = interpolate_bezier(a.co, a.handle_right, b.handle_left, b.co, 12)
                pts.extend(seg[:-1])
            if not sp.use_cyclic_u:
                pts.append(bps[-1].co)
        else:
            pts = [Vector(p.co[:3]) for p in sp.points]
        pts = [mw @ Vector(p) for p in pts]
        if len(pts) > 2:
            outlines.append(pts)
    ob_eval.to_curve_clear()
    bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.curves.remove(cu)
    # Stitch the digits left to right; inside a glyph the outer contour comes first.
    outlines.sort(key=lambda o: (round(min(p.x for p in o), 3), -max(p.y for p in o)))
    return [resample_polyline(o, SAMPLE_STEP, closed=True) for o in outlines]


def heart_polylines(center, width):
    s = width / 32.0
    outline = []
    for k in range(240):
        t = 2 * math.pi * k / 240
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        outline.append(Vector((center[0] + x * s, center[1] + (y + 2.5) * s, 0.0)))

    # diagonal (45 deg) satin rows clipped to the heart, alternating direction
    ang = math.radians(45)
    ca, sa = math.cos(ang), math.sin(ang)
    rot = [(p.x * ca + p.y * sa, -p.x * sa + p.y * ca) for p in outline]
    vmin, vmax = min(r[1] for r in rot), max(r[1] for r in rot)
    spacing, inset = 0.0028, 0.0016
    rows = []
    v = vmin + spacing * 0.5
    flip = False
    while v < vmax:
        xs = []
        n = len(rot)
        for i in range(n):
            (x1, y1), (x2, y2) = rot[i], rot[(i + 1) % n]
            if (y1 > v) != (y2 > v):
                xs.append(x1 + (x2 - x1) * (v - y1) / (y2 - y1))
        xs.sort()
        spans = [(xs[j] + inset, xs[j + 1] - inset) for j in range(0, len(xs) - 1, 2)]
        spans = [sp for sp in spans if sp[1] - sp[0] > 0.002]
        if flip:
            spans = [(b, a) for a, b in reversed(spans)]
        for u0, u1 in spans:
            a = Vector((u0 * ca - v * sa, u0 * sa + v * ca, 0.0))
            b = Vector((u1 * ca - v * sa, u1 * sa + v * ca, 0.0))
            rows.append(resample_polyline([a, b], SAMPLE_STEP, closed=False))
        flip = not flip
        v += spacing
    rows.append(resample_polyline(outline, SAMPLE_STEP, closed=True))
    return rows


class PathSampler:
    """Arc-length lookup over the ordered splines (matches the GN timing exactly)."""

    def __init__(self, polylines):
        self.pts, self.cum = [], []
        total = 0.0
        for pts in polylines:
            for k, p in enumerate(pts):
                if k > 0:
                    total += (p - pts[k - 1]).length
                self.pts.append(p)
                self.cum.append(total)
        self.total = total

    def at(self, factor):
        target = max(0.0, min(1.0, factor)) * self.total
        lo, hi = 0, len(self.cum) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if self.cum[mid] < target:
                lo = mid + 1
            else:
                hi = mid
        return self.pts[lo].copy()


def key_modifier_input(obj, mod, ident, value, frame):
    """Set + keyframe a Geometry Nodes modifier input (5.x API, else <=4.x ID property)."""
    props = getattr(mod, "properties", None)
    inputs = getattr(props, "inputs", None) if props is not None else None
    if inputs is not None and hasattr(inputs, ident):
        item = getattr(inputs, ident)
        item.value = value
        obj.keyframe_insert(data_path=item.path_from_id("value"), frame=frame)
    else:
        mod[ident] = value
        obj.keyframe_insert(data_path=f'modifiers["{mod.name}"]["{ident}"]', frame=frame)


def progress_at(frame):
    return max(0.0, min(1.0, (frame - FRAME_START) / float(STITCH_END - FRAME_START)))


def bake_animation(scene, sampler, stitch_obj, mod, ident, ctrl, needle, foot, thread, cam, focus):
    # Trim progress: two linear keys (the default interpolation is set to LINEAR)
    key_modifier_input(stitch_obj, mod, ident, 0.0, FRAME_START)
    key_modifier_input(stitch_obj, mod, ident, 1.0, STITCH_END)

    # Active stitching point for every frame
    active = {f: sampler.at(progress_at(f)) for f in range(FRAME_START, STITCH_END + 1)}

    # Smoothed (centred moving average) path for the camera / focus
    half = 5
    smooth = {}
    frames = list(range(FRAME_START, STITCH_END + 1))
    for f in frames:
        acc = Vector((0, 0, 0))
        n = 0
        for g in range(f - half, f + half + 1):
            g = min(max(g, FRAME_START), STITCH_END)
            acc += active[g]
            n += 1
        smooth[f] = acc / n

    # --- needle rig --------------------------------------------------------------------
    needle_up, needle_down = 0.022, -0.0035     # local Z of the needle tip
    lift_height = 2.2
    end_pos = active[STITCH_END]
    for f in range(FRAME_START, LIFT_END + 2):
        if f <= STITCH_END:
            p = active[f]
            ctrl.location = (p.x, p.y, 0.0)
            phase = (f - FRAME_START) / 4.0                  # one pierce every 4 frames
            needle.location.z = needle_down + (needle_up - needle_down) * (0.5 + 0.5 * math.cos(2 * math.pi * phase))
        else:
            u = min(1.0, (f - STITCH_END) / float(LIFT_END - STITCH_END))
            ctrl.location = (end_pos.x, end_pos.y, lift_height * (u ** 2.2))
            needle.location.z = needle_up
        ctrl.keyframe_insert("location", frame=f)
        needle.keyframe_insert("location", index=2, frame=f)

    for ob in (needle, foot, thread):
        for f, hidden in ((LIFT_END, False), (LIFT_END + 1, True)):
            ob.hide_render = hidden
            ob.keyframe_insert("hide_render", frame=f)
            ob.hide_viewport = hidden
            ob.keyframe_insert("hide_viewport", frame=f)
        ob.hide_render = ob.hide_viewport = False

    # --- camera ------------------------------------------------------------------------
    close_offset = Vector((0.0, -0.15, 0.29))
    final_loc = Vector((0.0, 0.0, 2.86))
    final_rot = Quaternion((1, 0, 0, 0))           # straight down, card upright in frame
    prev_q = None

    def key_cam(f, loc, quat, foc):
        nonlocal prev_q
        if prev_q is not None and prev_q.dot(quat) < 0:
            quat = -quat
        prev_q = quat
        cam.location = loc
        cam.rotation_quaternion = quat
        focus.location = foc
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)
        focus.keyframe_insert("location", frame=f)

    for f in frames:
        t = smooth[f]
        loc = t + close_offset
        key_cam(f, loc, track_quat(loc, t), active[f])

    start_loc = smooth[STITCH_END] + close_offset
    start_rot = track_quat(start_loc, smooth[STITCH_END])
    start_focus = active[STITCH_END]
    for f in range(STITCH_END + 1, FRAME_END + 1):
        u = smootherstep((f - STITCH_END) / float(PULLBACK_END - STITCH_END))
        loc = start_loc.lerp(final_loc, u)
        rot = start_rot.slerp(final_rot, u)
        foc = start_focus.lerp(Vector((0, 0, 0)), u)
        key_cam(f, loc, rot, foc)


# ======================================================================================
# Personalisation
# ======================================================================================
def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="render_invite.py")
    p.add_argument("--initials", required=True, help='e.g. "Y | M"')
    p.add_argument("--names", required=True, help='e.g. "Yuval & Mevorah"')
    p.add_argument("--date", required=True, help='e.g. "01.06.2027"')
    p.add_argument("--venue", default="venue.svg", help="SVG file name inside the asset folder")
    p.add_argument("--out", required=True, help="output .mp4 path")
    return p.parse_args(argv)


def obj(name):
    ob = bpy.data.objects.get(name)
    if ob is None:
        raise RuntimeError(f"master_template.blend has no object named '{name}'")
    return ob


def set_text(name, body, max_width=None, align=None):
    ob = obj(name)
    ob.data.body = body
    font = get_font()
    if font:
        ob.data.font = font
    if align:
        ob.data.align_x = align
    ob.scale = (1.0, 1.0, 1.0)
    ob.hide_render = ob.hide_viewport = not body.strip()
    if max_width:
        bpy.context.view_layer.update()
        width = ob.dimensions.x
        if width > max_width:
            k = max_width / width
            ob.scale = (k, k, 1.0)
    return ob


def update_initials(initials):
    text = " ".join(initials.split())
    if "|" in text:
        left, right = (s.strip() for s in text.split("|", 1))
    elif len(text.replace(" ", "")) == 2:
        left, right = text.replace(" ", "")
    else:
        left, right = text, ""
    if left and right:
        set_text("Mono_Y", left, 0.14, "RIGHT").location.x = -0.03
        set_text("Mono_Bar", "|")
        set_text("Mono_M", right, 0.14, "LEFT").location.x = 0.03
    else:                                    # a single monogram, centred, no bar
        set_text("Mono_Y", left or right, 0.30, "CENTER").location.x = 0.0
        set_text("Mono_Bar", "")
        set_text("Mono_M", "")


def update_names(names):
    text = " ".join(names.split())
    parts = [s.strip() for s in text.split("&", 1)] if "&" in text else [text, ""]
    first, second = parts
    if first and second:
        set_text("Name_Yuval", first, 0.92)
        set_text("Name_Amp", "&")
        set_text("Name_Mevorah", second, 0.92)
    else:
        set_text("Name_Yuval", "", None)
        set_text("Name_Amp", "", None)
        ob = set_text("Name_Mevorah", first or second, 0.92)
        ob.location.y = 0.03                  # one name line sits in the middle of the block


def rebuild_stitching(date):
    """New date + heart path for the Trim Curve stitch, then re-bake needle rig and camera."""
    polylines = date_outline_polylines(date, DATE_CENTER, DATE_SIZE)
    xs = [p.x for line in polylines for p in line]
    if xs and max(xs) - min(xs) > DATE_MAX_WIDTH:
        size = DATE_SIZE * DATE_MAX_WIDTH / (max(xs) - min(xs))
        polylines = date_outline_polylines(date, DATE_CENTER, size)
    if not polylines:
        raise RuntimeError(f"the date '{date}' produced no stitchable outline")
    polylines += heart_polylines(HEART_CENTER, HEART_WIDTH)

    stitch = obj("Stitch_Date_Heart")
    old = stitch.data
    cu = bpy.data.curves.new("Stitch_Date_Heart", "CURVE")
    cu.dimensions = "3D"
    for pts in polylines:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        flat = []
        for p in pts:
            flat += [p.x, p.y, 0.0, 1.0]
        sp.points.foreach_set("co", flat)
        sp.use_cyclic_u = False
    for mat in old.materials:
        cu.materials.append(mat)
    stitch.data = cu
    bpy.data.curves.remove(old)

    mod = next(m for m in stitch.modifiers if m.type == "NODES")
    ident = None
    ng = mod.node_group
    if hasattr(ng, "interface"):
        for item in ng.interface.items_tree:
            if getattr(item, "item_type", "SOCKET") == "SOCKET" and item.in_out == "INPUT" \
                    and item.name == "Progress":
                ident = item.identifier
    else:
        ident = ng.inputs["Progress"].identifier

    rig = [obj(n) for n in ("NeedleRig_Controller", "Needle", "PresserFoot", "Needle_Thread",
                            "Camera", "Camera_FocusTarget")]
    for ob in [stitch] + rig:
        ob.animation_data_clear()
    ctrl, needle, foot, thread, cam, focus = rig
    sampler = PathSampler(polylines)
    bake_animation(bpy.context.scene, sampler, stitch, mod, ident,
                   ctrl, needle, foot, thread, cam, focus)
    log(f"date '{date}': {len(polylines)} stitch rows, {sampler.total:.2f} m of thread")


def update_venue(venue):
    venue_ob = obj("Venue")
    new = import_svg_as_gold_mesh(venue, "Venue_new", (0.0, -CARD_H / 2 + 0.225), CARD_W,
                                  venue_ob.active_material, None,
                                  extrude=0.0005, bevel=0.0001, bevel_res=0)
    if new is None:
        raise RuntimeError(f"venue graphic '{venue}' could not be loaded")
    old = venue_ob.data
    venue_ob.data = new.data
    new.data.name = "Venue"
    bpy.data.objects.remove(new, do_unlink=True)
    bpy.data.meshes.remove(old)


def configure_render(scene, out_dir):
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE_NEXT"

    res = os.environ.get("RENDER_RES", "720x1280").lower().replace(" ", "")
    m = re.fullmatch(r"(\d+)x(\d+)", res)
    if not m:
        raise RuntimeError(f"RENDER_RES must look like 720x1280, got '{res}'")
    w, h = (max(16, int(v) // 2 * 2) for v in m.groups())   # H.264 needs even sizes
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
    r.fps, r.fps_base = 30, 1.0

    scene.frame_start, scene.frame_end = FRAME_START, FRAME_END
    frames = os.environ.get("RENDER_FRAMES", "").strip()
    if frames:
        a, b = (int(v) for v in frames.split("-", 1))
        scene.frame_start, scene.frame_end = max(FRAME_START, a), min(FRAME_END, b)

    ee = scene.eevee
    samples = max(1, int(os.environ.get("RENDER_SAMPLES", "1")))
    for key, value in (("taa_render_samples", samples), ("use_raytracing", False),
                       ("shadow_ray_count", 1), ("shadow_step_count", 4),
                       ("use_gtao", False), ("use_bloom", False), ("use_ssr", False),
                       ("use_motion_blur", False)):
        if hasattr(ee, key):
            try:
                setattr(ee, key, value)
            except Exception:
                pass
    r.use_motion_blur = False

    img = r.image_settings
    if hasattr(img, "media_type"):            # Blender 5.x
        img.media_type = "VIDEO"
    img.file_format = "FFMPEG"
    img.color_mode = "RGB"
    ff = r.ffmpeg
    ff.format = "MPEG4"
    ff.codec = "H264"
    ff.constant_rate_factor = "HIGH"
    ff.ffmpeg_preset = "GOOD"
    ff.gopsize = 30
    ff.audio_codec = "NONE"
    r.use_file_extension = True
    r.filepath = os.path.join(out_dir, "invite_")
    log(f"rendering {w}x{h}, frames {scene.frame_start}-{scene.frame_end}, "
        f"{samples} sample(s), engine {r.engine}")


def main():
    args = parse_args()
    out = os.path.abspath(args.out)
    if not out.lower().endswith(".mp4"):
        raise RuntimeError("--out must end in .mp4")
    venue = os.path.basename(args.venue)
    if venue != args.venue or not venue.lower().endswith(".svg"):
        raise RuntimeError("--venue must be a plain .svg file name inside the asset folder")

    prefs = bpy.context.preferences.edit
    old_interp = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = "LINEAR"
    scene = bpy.context.scene
    work = tempfile.mkdtemp(prefix="invite_frames_", dir=os.path.dirname(out) or None)
    try:
        for text_ob in ("SaveTheDate", "OurForeverBegins"):     # re-point at /app's font
            if bpy.data.objects.get(text_ob):
                set_text(text_ob, bpy.data.objects[text_ob].data.body)
        update_initials(args.initials)
        update_names(args.names)
        rebuild_stitching(args.date)
        update_venue(venue)
        configure_render(scene, work)

        def report_progress(sc, *_):
            print(f"[progress] {sc.frame_current - sc.frame_start + 1} "
                  f"{sc.frame_end - sc.frame_start + 1}", flush=True)

        bpy.app.handlers.render_post.append(report_progress)
        scene.frame_set(scene.frame_start)
        bpy.ops.render.render(animation=True)

        videos = [f for f in os.listdir(work) if f.lower().endswith(".mp4")]
        if not videos:
            raise RuntimeError("Blender finished but wrote no .mp4 (is FFmpeg support missing?)")
        os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
        shutil.move(os.path.join(work, videos[0]), out)
        log(f"wrote {out} ({os.path.getsize(out) / 1e6:.1f} MB)")
    finally:
        prefs.keyframe_new_interpolation_type = old_interp
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        traceback.print_exc()
        sys.stdout.flush()
        sys.exit(1)
    sys.exit(0)
