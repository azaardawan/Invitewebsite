"""
build_template.py
=================
Builds the "Yuval & Mevorah" Save-the-Date master template for Blender and saves it
as master_template.blend next to this script.

  * 1080 x 1920 (9:16), 30 fps, frames 1-345 (11.5 s), BLENDER_EEVEE
  * Procedural linen card, embossed brushed-gold type and SVG ornaments
  * Gold-thread embroidery of "01.06.2027" and a satin-filled heart, grown by a
    Geometry Nodes Trim Curve (frames 1-225)
  * Sewing needle + presser foot rig that follows the stitching point, then lifts away
  * Shallow-DOF close-up camera that pulls back to the full card (frames 226-310)

Put these files in the same folder as this script:
    wreath.svg, divider.svg, venue.svg, CormorantGaramond-Regular.ttf

Run headless:   blender -b -P build_template.py
or open it in Blender's Text Editor and press Run Script.

WARNING: the script clears the current scene before building.
"""

import math
import os
import re
import xml.etree.ElementTree as ET

import bpy  # noqa: E402  (import bpy before bmesh)
import bmesh
from mathutils import Matrix, Quaternion, Vector
from mathutils.geometry import interpolate_bezier

# --------------------------------------------------------------------------------------
# Settings
# --------------------------------------------------------------------------------------
RES_X, RES_Y, FPS = 1080, 1920, 30
FRAME_START, FRAME_END = 1, 345
STITCH_END = 225          # embroidery finishes
LIFT_END = 255            # needle rig gone
PULLBACK_END = 310        # camera settles on the full card

CARD_W, CARD_H = 1.08, 1.92
GOLD_HEX = "#B89356"
LINEN_HEX = "#EAE3D5"

FONT_FILE = "CormorantGaramond-Regular.ttf"
SVG_WREATH, SVG_DIVIDER, SVG_VENUE = "wreath.svg", "divider.svg", "venue.svg"

THREAD_RADIUS = 0.0009   # metres
STITCH_LENGTH = 0.0042    # length of one visible stitch
SAMPLE_STEP = 0.0006      # spacing of points on the stitch path


def _base_dir():
    """Folder of this script (as required); falls back to other sensible places."""
    candidates = []
    try:
        candidates.append(os.path.dirname(os.path.abspath(__file__)))
    except NameError:
        pass
    for txt in bpy.data.texts:
        if txt.filepath:
            candidates.append(os.path.dirname(bpy.path.abspath(txt.filepath)))
    if bpy.data.filepath:
        candidates.append(os.path.dirname(bpy.data.filepath))
    candidates.append(os.getcwd())
    for c in candidates:
        if c and os.path.isfile(os.path.join(c, SVG_WREATH)):
            return c
    return candidates[0]


BASE_DIR = _base_dir()
OUTPUT_BLEND = os.path.join(BASE_DIR, "master_template.blend")


def log(msg):
    print(f"[build_template] {msg}")


# --------------------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------------------
def hex_to_linear(hex_str, alpha=1.0):
    h = hex_str.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def smootherstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def link(obj, collection=None):
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def new_collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


SOCKET_ALIASES = {"Fac": ("Fac", "Factor"), "Factor": ("Factor", "Fac")}   # 5.x renamed Fac


def sock(sockets, name, kind=None):
    """First socket with this name (and type) - robust across Blender versions."""
    names = SOCKET_ALIASES.get(name, (name,))
    for require_enabled in (True, False):
        for s in sockets:
            if s.name in names and (kind is None or s.type == kind):
                if not require_enabled or getattr(s, "enabled", True):
                    return s
    raise KeyError(f"socket '{name}' not found")


def set_enum(node, prop, value, menu_socket=None):
    """Set a node enum that may be a property (<=4.x) or a menu socket (5.x)."""
    if hasattr(node, prop):
        try:
            setattr(node, prop, value)
            return
        except (TypeError, AttributeError):
            pass
    if menu_socket:
        for s in node.inputs:
            if s.name == menu_socket:
                try:
                    s.default_value = value.title()
                except Exception:
                    pass


def set_attr(obj, name, value):
    if obj is not None and hasattr(obj, name):
        try:
            setattr(obj, name, value)
        except Exception:
            pass


def track_quat(src, dst):
    return (Vector(dst) - Vector(src)).to_track_quat("-Z", "Y")


# --------------------------------------------------------------------------------------
# Scene reset & render settings
# --------------------------------------------------------------------------------------
def clear_scene():
    scene = bpy.context.scene
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for col in list(scene.collection.children):
        scene.collection.children.unlink(col)
    pools = [bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.lights,
             bpy.data.cameras, bpy.data.node_groups, bpy.data.actions, bpy.data.collections,
             bpy.data.images]
    for pool in pools:
        for block in list(pool):
            if block.users == 0 or pool in (bpy.data.collections, bpy.data.node_groups):
                try:
                    pool.remove(block)
                except Exception:
                    pass
    for world in list(bpy.data.worlds):
        if world.users == 0:
            bpy.data.worlds.remove(world)


def setup_render(scene):
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:            # Blender 4.2 - 4.4 call it EEVEE Next
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    log(f"render engine: {scene.render.engine}")
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = RES_X, RES_Y, 100
    r.fps, r.fps_base = FPS, 1.0
    scene.frame_start, scene.frame_end = FRAME_START, FRAME_END
    r.filepath = "//render/save_the_date_"
    r.image_settings.file_format = "PNG"

    ee = scene.eevee
    set_attr(ee, "taa_render_samples", 96)
    set_attr(ee, "taa_samples", 32)
    set_attr(ee, "use_soft_shadows", True)        # legacy EEVEE
    set_attr(ee, "shadow_cube_size", "2048")
    set_attr(ee, "shadow_cascade_size", "2048")
    set_attr(ee, "use_gtao", True)
    set_attr(ee, "gtao_distance", 0.05)
    set_attr(ee, "use_shadows", True)             # EEVEE Next
    set_attr(ee, "shadow_ray_count", 2)
    set_attr(ee, "shadow_step_count", 8)
    set_attr(ee, "shadow_resolution_scale", 1.0)
    set_attr(ee, "use_raytracing", True)

    vs = scene.view_settings
    for transform in ("AgX", "Filmic"):
        try:
            vs.view_transform = transform
            break
        except TypeError:
            continue
    try:
        vs.look = "AgX - Medium High Contrast" if vs.view_transform == "AgX" else "Medium High Contrast"
    except TypeError:
        pass

    world = bpy.data.worlds.new("WarmStudio")
    if bpy.app.version < (5, 0, 0):          # node trees are always on in 5.x
        world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.075, 0.06, 0.048, 1.0)
    bg.inputs["Strength"].default_value = 1.0
    scene.world = world


# --------------------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------------------
def principled(mat):
    if bpy.app.version < (5, 0, 0):          # node trees are always on in 5.x
        mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    return nt, bsdf, out


def ramp(nt, c0, c1, p0=0.0, p1=1.0):
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].position, r.color_ramp.elements[0].color = p0, c0
    r.color_ramp.elements[1].position, r.color_ramp.elements[1].color = p1, c1
    return r


def make_linen_material():
    mat = bpy.data.materials.new("Linen_Card")
    nt, bsdf, _ = principled(mat)
    N, L = nt.nodes, nt.links
    texco = N.new("ShaderNodeTexCoord")

    def wave(direction, scale):
        w = N.new("ShaderNodeTexWave")
        w.wave_type = "BANDS"
        w.bands_direction = direction
        w.wave_profile = "SIN"
        w.inputs["Scale"].default_value = scale
        w.inputs["Distortion"].default_value = 1.6
        w.inputs["Detail"].default_value = 2.0
        w.inputs["Detail Scale"].default_value = 1.5
        L.new(texco.outputs["Object"], w.inputs["Vector"])
        return w

    warp, weft = wave("X", 260.0), wave("Y", 240.0)

    weave = N.new("ShaderNodeMath")              # woven cross-hatch: warp x weft
    weave.operation = "MULTIPLY"
    L.new(sock(warp.outputs, "Fac"), weave.inputs[0])
    L.new(sock(weft.outputs, "Fac"), weave.inputs[1])
    sum_ = N.new("ShaderNodeMath")
    sum_.operation = "ADD"
    L.new(sock(warp.outputs, "Fac"), sum_.inputs[0])
    L.new(sock(weft.outputs, "Fac"), sum_.inputs[1])
    weave_mix = N.new("ShaderNodeMath")          # 0.5*sum + weave
    weave_mix.operation = "MULTIPLY_ADD"
    L.new(sum_.outputs[0], weave_mix.inputs[0])
    weave_mix.inputs[1].default_value = 0.35
    L.new(weave.outputs[0], weave_mix.inputs[2])

    noise = N.new("ShaderNodeTexNoise")          # slub / fibre grain
    noise.inputs["Scale"].default_value = 900.0
    noise.inputs["Detail"].default_value = 6.0
    L.new(texco.outputs["Object"], noise.inputs["Vector"])
    vor = N.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 420.0
    L.new(texco.outputs["Object"], vor.inputs["Vector"])

    grain = N.new("ShaderNodeMath")
    grain.operation = "MULTIPLY_ADD"
    L.new(sock(noise.outputs, "Fac"), grain.inputs[0])
    grain.inputs[1].default_value = 0.35
    L.new(weave_mix.outputs[0], grain.inputs[2])
    height = N.new("ShaderNodeMath")
    height.operation = "MULTIPLY_ADD"
    L.new(sock(vor.outputs, "Distance"), height.inputs[0])
    height.inputs[1].default_value = 0.2
    L.new(grain.outputs[0], height.inputs[2])

    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.22
    bump.inputs["Distance"].default_value = 0.0004
    L.new(height.outputs[0], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    base = hex_to_linear(LINEN_HEX)
    dark = tuple(c * 0.86 for c in base[:3]) + (1.0,)
    col = ramp(nt, dark, base, 0.15, 0.9)
    L.new(height.outputs[0], sock(col.inputs, "Fac"))
    L.new(col.outputs["Color"], bsdf.inputs["Base Color"])

    rough = N.new("ShaderNodeMapRange")
    L.new(sock(noise.outputs, "Fac"), rough.inputs[0])
    rough.inputs[3].default_value, rough.inputs[4].default_value = 0.78, 0.86
    L.new(rough.outputs[0], bsdf.inputs["Roughness"])
    bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def make_gold_material():
    """Brushed gold foil for the embossed type and ornaments."""
    mat = bpy.data.materials.new("Gold_Brushed")
    nt, bsdf, _ = principled(mat)
    N, L = nt.nodes, nt.links
    texco = N.new("ShaderNodeTexCoord")
    mapping = N.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (6.0, 900.0, 6.0)   # streaks along X
    L.new(texco.outputs["Object"], mapping.inputs["Vector"])
    brush = N.new("ShaderNodeTexNoise")
    brush.inputs["Scale"].default_value = 2.0
    brush.inputs["Detail"].default_value = 8.0
    L.new(mapping.outputs["Vector"], brush.inputs["Vector"])

    rough = N.new("ShaderNodeMapRange")
    L.new(sock(brush.outputs, "Fac"), rough.inputs[0])
    rough.inputs[3].default_value, rough.inputs[4].default_value = 0.26, 0.38
    L.new(rough.outputs[0], bsdf.inputs["Roughness"])

    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.06
    bump.inputs["Distance"].default_value = 0.0002
    L.new(sock(brush.outputs, "Fac"), bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    gold = hex_to_linear(GOLD_HEX)
    col = ramp(nt, tuple(c * 0.85 for c in gold[:3]) + (1,), gold, 0.3, 0.7)
    L.new(sock(brush.outputs, "Fac"), sock(col.inputs, "Fac"))
    L.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 0.9
    return mat


def make_thread_material():
    """Metallic gold embroidery thread with a twisted-ply highlight."""
    mat = bpy.data.materials.new("Gold_Thread")
    nt, bsdf, _ = principled(mat)
    N, L = nt.nodes, nt.links
    texco = N.new("ShaderNodeTexCoord")
    twist = N.new("ShaderNodeTexWave")
    twist.wave_type = "BANDS"
    twist.bands_direction = "DIAGONAL"
    twist.inputs["Scale"].default_value = 1100.0
    twist.inputs["Distortion"].default_value = 0.5
    L.new(texco.outputs["Object"], twist.inputs["Vector"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.0002
    L.new(sock(twist.outputs, "Fac"), bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    attr = N.new("ShaderNodeAttribute")          # 0 where thread dives into the linen
    attr.attribute_name = "stitch_bump"
    set_attr(attr, "attribute_type", "GEOMETRY")
    gold = hex_to_linear("#C9A55E")
    col = ramp(nt, tuple(c * 0.35 for c in gold[:3]) + (1,), gold, 0.0, 0.6)
    L.new(sock(attr.outputs, "Fac"), sock(col.inputs, "Fac"))
    L.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.27
    return mat


def make_simple_material(name, hex_or_rgb, metallic, roughness):
    mat = bpy.data.materials.new(name)
    _, bsdf, _ = principled(mat)
    col = hex_to_linear(hex_or_rgb) if isinstance(hex_or_rgb, str) else hex_or_rgb
    bsdf.inputs["Base Color"].default_value = col
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


# --------------------------------------------------------------------------------------
# Card, table
# --------------------------------------------------------------------------------------
def build_card(mat_linen, col):
    me = bpy.data.meshes.new("Card")
    hw, hh = CARD_W / 2, CARD_H / 2
    me.from_pydata([(-hw, -hh, 0), (hw, -hh, 0), (hw, hh, 0), (-hw, hh, 0)], [], [(0, 1, 2, 3)])
    me.materials.append(mat_linen)
    card = link(bpy.data.objects.new("Linen_Card", me), col)
    sol = card.modifiers.new("Thickness", "SOLIDIFY")
    sol.thickness, sol.offset = 0.003, -1.0
    bev = card.modifiers.new("SoftEdge", "BEVEL")
    bev.width, bev.segments = 0.0008, 2

    table = bpy.data.meshes.new("Table")
    s = 6.0
    table.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
    table.materials.append(make_simple_material("Table_Taupe", "#2B2520", 0.0, 0.72))
    t = link(bpy.data.objects.new("Table", table), col)
    t.location.z = -0.0032
    return card


# --------------------------------------------------------------------------------------
# Text
# --------------------------------------------------------------------------------------
_FONT = None


def get_font():
    global _FONT
    if _FONT is None:
        path = os.path.join(BASE_DIR, FONT_FILE)
        if os.path.isfile(path):
            _FONT = bpy.data.fonts.load(path, check_existing=True)
        else:
            log(f"WARNING: {FONT_FILE} not found in {BASE_DIR}; using Blender's built-in font")
            _FONT = False
    return _FONT or None


def add_text(name, body, x, y, size, mat, col, spacing=1.0, extrude=0.0010, bevel=0.00022):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    font = get_font()
    if font:
        cu.font = font
    cu.size = size
    cu.align_x, cu.align_y = "CENTER", "CENTER"
    cu.space_character = spacing
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = 2
    cu.resolution_u = 6
    if mat:
        cu.materials.append(mat)
    ob = link(bpy.data.objects.new(name, cu), col)
    ob.location = (x, y, extrude * 0.6)        # mostly above the paper, a little pressed in
    return ob


# --------------------------------------------------------------------------------------
# SVG import (absolute + relative M/L/H/V/C/S/Q/T/Z) -> one joined, extruded gold mesh
# --------------------------------------------------------------------------------------
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


# --------------------------------------------------------------------------------------
# Stitch path: "01.06.2027" outlines + satin-filled heart, as ordered poly splines
# --------------------------------------------------------------------------------------
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


def build_stitch_curve(polylines, col):
    """One curve object; spline order = stitching order (date, then heart)."""
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
    return link(bpy.data.objects.new("Stitch_Date_Heart", cu), col)


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


# --------------------------------------------------------------------------------------
# Geometry Nodes: per-spline Trim Curve + stitch detailing + thread tube
# --------------------------------------------------------------------------------------
def new_group_socket(ng, name, in_out, socket_type):
    if hasattr(ng, "interface"):
        return ng.interface.new_socket(name=name, in_out=in_out, socket_type=socket_type)
    coll = ng.inputs if in_out == "INPUT" else ng.outputs
    return coll.new(socket_type, name)


def build_stitch_node_group(thread_mat):
    ng = bpy.data.node_groups.new("GN_GoldThreadStitch", "GeometryNodeTree")
    new_group_socket(ng, "Geometry", "INPUT", "NodeSocketGeometry")
    prog = new_group_socket(ng, "Progress", "INPUT", "NodeSocketFloat")
    set_attr(prog, "min_value", 0.0)
    set_attr(prog, "max_value", 1.0)
    set_attr(prog, "default_value", 0.0)
    new_group_socket(ng, "Geometry", "OUTPUT", "NodeSocketGeometry")
    N, L = ng.nodes, ng.links

    def node(kind, x, y, **props):
        n = N.new(kind)
        n.location = (x, y)
        for k, v in props.items():
            set_attr(n, k, v)
        return n

    def math_node(op, x, y, a=None, b=None, c=None):
        m = node("ShaderNodeMath", x, y)
        m.operation = op
        for idx, val in enumerate((a, b, c)):
            if val is None:
                continue
            if isinstance(val, (int, float)):
                m.inputs[idx].default_value = val
            else:
                L.new(val, m.inputs[idx])
        return m.outputs[0]

    gin = node("NodeGroupInput", -1400, 0)
    gout = node("NodeGroupOutput", 1800, 0)
    g_geo, g_prog = gin.outputs[0], gin.outputs[1]

    # --- per-spline start/end of the global progress (date first, then heart) ---------
    slen = node("GeometryNodeSplineLength", -1400, -300)
    acc = node("GeometryNodeAccumulateField", -1200, -300)
    set_attr(acc, "data_type", "FLOAT")
    set_attr(acc, "domain", "CURVE")
    L.new(sock(slen.outputs, "Length"), sock(acc.inputs, "Value", "VALUE"))
    total = sock(acc.outputs, "Total", "VALUE")
    t0 = math_node("DIVIDE", -1000, -250, sock(acc.outputs, "Trailing", "VALUE"), total)
    t1 = math_node("DIVIDE", -1000, -400, sock(acc.outputs, "Leading", "VALUE"), total)
    local = node("ShaderNodeMapRange", -800, -300)
    set_attr(local, "data_type", "FLOAT")
    local.clamp = True
    L.new(g_prog, local.inputs[0])
    L.new(t0, local.inputs[1])
    L.new(t1, local.inputs[2])
    local.inputs[3].default_value, local.inputs[4].default_value = 0.0, 1.0

    store_local = node("GeometryNodeStoreNamedAttribute", -600, 0)
    set_attr(store_local, "data_type", "FLOAT")
    set_attr(store_local, "domain", "CURVE")
    sock(store_local.inputs, "Name").default_value = "stitch_local"
    L.new(g_geo, store_local.inputs[0])
    L.new(local.outputs[0], sock(store_local.inputs, "Value", "VALUE"))

    read_local = node("GeometryNodeInputNamedAttribute", -600, -300)
    set_attr(read_local, "data_type", "FLOAT")
    sock(read_local.inputs, "Name").default_value = "stitch_local"
    local_val = sock(read_local.outputs, "Attribute", "VALUE")

    # --- Trim Curve (factor mode, end = per-spline progress) --------------------------
    trim = node("GeometryNodeTrimCurve", -350, 0)
    set_enum(trim, "mode", "FACTOR", "Mode")
    L.new(store_local.outputs[0], trim.inputs[0])
    sock(trim.inputs, "Start", "VALUE").default_value = 0.0
    L.new(local_val, sock(trim.inputs, "End", "VALUE"))

    # remove splines that have not started yet
    cmp = node("FunctionNodeCompare", -350, -300)
    set_attr(cmp, "data_type", "FLOAT")
    set_attr(cmp, "operation", "LESS_EQUAL")
    L.new(local_val, sock(cmp.inputs, "A", "VALUE"))
    sock(cmp.inputs, "B", "VALUE").default_value = 0.0001
    delete = node("GeometryNodeDeleteGeometry", -150, 0)
    set_attr(delete, "domain", "CURVE")
    L.new(sock(trim.outputs, "Curve"), delete.inputs[0])
    L.new(cmp.outputs[0], sock(delete.inputs, "Selection"))

    # --- stitch detailing: periodic bump along the arc length -------------------------
    sparam = node("GeometryNodeSplineParameter", -150, -350)
    phase = math_node("DIVIDE", 50, -350, sock(sparam.outputs, "Length"), STITCH_LENGTH)
    phase = math_node("FRACT", 220, -350, phase)
    phase = math_node("MULTIPLY", 390, -350, phase, math.pi)
    bump = math_node("SINE", 560, -350, phase)
    bump = math_node("POWER", 730, -350, bump, 0.45)       # 0 at needle holes, 1 mid-stitch

    store_bump = node("GeometryNodeStoreNamedAttribute", 100, 0)
    set_attr(store_bump, "data_type", "FLOAT")
    set_attr(store_bump, "domain", "POINT")
    sock(store_bump.inputs, "Name").default_value = "stitch_bump"
    L.new(delete.outputs[0], store_bump.inputs[0])
    L.new(bump, sock(store_bump.inputs, "Value", "VALUE"))

    radius = math_node("MULTIPLY_ADD", 900, -350, bump, 0.65, 0.35)
    set_rad = node("GeometryNodeSetCurveRadius", 350, 0)
    L.new(store_bump.outputs[0], set_rad.inputs[0])
    L.new(radius, sock(set_rad.inputs, "Radius"))

    # thread arches above the linen and dives into it at every needle hole
    z = math_node("MULTIPLY_ADD", 900, -550, bump, THREAD_RADIUS * 1.1, -THREAD_RADIUS * 0.45)
    comb = node("ShaderNodeCombineXYZ", 1050, -550)
    L.new(z, comb.inputs[2])
    setpos = node("GeometryNodeSetPosition", 600, 0)
    L.new(set_rad.outputs[0], setpos.inputs[0])
    L.new(comb.outputs[0], sock(setpos.inputs, "Offset"))

    profile = node("GeometryNodeCurvePrimitiveCircle", 600, -250)
    sock(profile.inputs, "Resolution").default_value = 8
    sock(profile.inputs, "Radius").default_value = THREAD_RADIUS

    c2m = node("GeometryNodeCurveToMesh", 850, 0)
    L.new(setpos.outputs[0], c2m.inputs[0])
    L.new(profile.outputs[0], sock(c2m.inputs, "Profile Curve"))
    try:
        sock(c2m.inputs, "Fill Caps").default_value = True
    except KeyError:
        pass
    try:                                   # Blender 5.x: curve radius only applies via "Scale"
        scale_in = sock(c2m.inputs, "Scale", "VALUE")
        L.new(node("GeometryNodeInputRadius", 600, -450).outputs[0], scale_in)
    except KeyError:
        pass

    setmat = node("GeometryNodeSetMaterial", 1100, 0)
    L.new(c2m.outputs[0], setmat.inputs[0])
    sock(setmat.inputs, "Material").default_value = thread_mat

    smooth = node("GeometryNodeSetShadeSmooth", 1350, 0)
    L.new(setmat.outputs[0], smooth.inputs[0])
    L.new(smooth.outputs[0], gout.inputs[0])
    return ng


def progress_identifier(ng):
    if hasattr(ng, "interface"):
        for item in ng.interface.items_tree:
            if getattr(item, "item_type", "SOCKET") == "SOCKET" and item.in_out == "INPUT" \
                    and item.name == "Progress":
                return item.identifier
    return ng.inputs["Progress"].identifier


# --------------------------------------------------------------------------------------
# Needle & presser foot rig
# --------------------------------------------------------------------------------------
def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def build_needle_rig(col, chrome, thread_mat):
    ctrl = link(bpy.data.objects.new("NeedleRig_Controller", None), col)
    ctrl.empty_display_type = "ARROWS"
    ctrl.empty_display_size = 0.03

    # --- needle: tip at local origin, pointing down -Z --------------------------------
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=0.00002, radius2=0.00085,
                          depth=0.012, matrix=Matrix.Translation((0, 0, 0.006)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=0.00085, radius2=0.00085,
                          depth=0.075, matrix=Matrix.Translation((0, 0, 0.012 + 0.0375)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=0.00085, radius2=0.0016,
                          depth=0.006, matrix=Matrix.Translation((0, 0, 0.087 + 0.003)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=0.0016, radius2=0.0016,
                          depth=0.05, matrix=Matrix.Translation((0, 0, 0.09 + 0.025)))
    needle_me = mesh_from_bm("Needle", bm)
    needle = link(bpy.data.objects.new("Needle", needle_me), col)
    needle.parent = ctrl

    # eye: boolean slot through the shaft (applied, so no helper object is left over)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(0.0007, 0.006, 0.0042), verts=bm.verts)
    cutter = link(bpy.data.objects.new("Needle_EyeCutter", mesh_from_bm("EyeCutter", bm)), col)
    cutter.location = (0, 0, 0.0175)
    boolean = needle.modifiers.new("Eye", "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.object = cutter
    set_attr(boolean, "solver", "EXACT")
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    applied = bpy.data.meshes.new_from_object(needle.evaluated_get(dg))
    needle.modifiers.clear()
    old = needle.data
    needle.data = applied
    applied.name = "Needle"
    bpy.data.meshes.remove(old)
    bpy.data.objects.remove(cutter, do_unlink=True)
    for poly in needle.data.polygons:
        poly.use_smooth = True
    needle.data.materials.append(chrome)

    # gold thread passing through the eye (child of the needle, so it bobs with it)
    th = bpy.data.curves.new("Needle_Thread", "CURVE")
    th.dimensions = "3D"
    th.bevel_depth = THREAD_RADIUS * 0.8
    th.bevel_resolution = 3
    th.use_fill_caps = True
    sp = th.splines.new("BEZIER")
    pts = [(0.0, -0.040, 0.075), (0.0, -0.012, 0.030), (0.0, 0.0, 0.0175),
           (0.0, 0.010, 0.012), (0.004, 0.022, 0.016)]
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    th.materials.append(thread_mat)
    thread = link(bpy.data.objects.new("Needle_Thread", th), col)
    thread.parent = needle

    # --- presser foot: offset to the side, rests on the linen -------------------------
    bm = bmesh.new()

    def box(sx, sy, sz, loc, rot=None):
        geom = bmesh.ops.create_cube(bm, size=1.0)
        vs = geom["verts"]
        bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=vs)
        if rot:
            bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot[0], 3, rot[1]), verts=vs)
        bmesh.ops.translate(bm, vec=loc, verts=vs)

    box(0.010, 0.026, 0.0016, (0.0, 0.0, 0.0008))                       # sole
    box(0.010, 0.010, 0.0016, (0.0, 0.0155, 0.0030), (math.radians(-35), "X"))  # toe up-turn
    box(0.0035, 0.004, 0.012, (0.0, -0.002, 0.007))                      # ankle
    box(0.006, 0.006, 0.070, (0.002, -0.003, 0.048))                     # shank
    bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.0022, radius2=0.0022,
                          depth=0.007, matrix=Matrix.Translation((0.0065, -0.003, 0.064))
                          @ Matrix.Rotation(math.radians(90), 4, "Y"))   # thumb screw
    foot = link(bpy.data.objects.new("PresserFoot", mesh_from_bm("PresserFoot", bm)), col)
    foot.data.materials.append(chrome)
    bev = foot.modifiers.new("Bevel", "BEVEL")
    bev.width, bev.segments = 0.0005, 2
    set_attr(bev, "limit_method", "ANGLE")
    foot.parent = ctrl
    foot.location = (0.0105, 0.004, 0.0)        # beside the needle
    return ctrl, needle, foot, thread


# --------------------------------------------------------------------------------------
# Lights & camera
# --------------------------------------------------------------------------------------
def add_area_light(name, loc, target, size, energy, color, col):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "DISK"
    ld.size = size
    ld.energy = energy
    ld.color = color
    set_attr(ld, "use_shadow", True)
    set_attr(ld, "use_soft_shadow", True)
    set_attr(ld, "shadow_soft_size", size)
    ob = link(bpy.data.objects.new(name, ld), col)
    ob.location = loc
    ob.rotation_euler = track_quat(loc, target).to_euler()
    return ob


def setup_lights(col):
    add_area_light("Key_Warm", (-1.5, -1.7, 2.6), (0, -0.2, 0), 1.6, 300.0, (1.0, 0.84, 0.66), col)
    add_area_light("Fill_Soft", (1.9, 0.9, 2.3), (0, 0, 0), 2.6, 80.0, (1.0, 0.93, 0.84), col)
    # broad overhead softbox: gives the flat gold foil something warm to reflect
    add_area_light("Top_Softbox", (0.0, -0.5, 4.2), (0, 0, 0), 3.2, 160.0, (1.0, 0.9, 0.76), col)
    add_area_light("Rim_Graze", (0.2, 2.6, 0.9), (0, 0, 0), 1.2, 90.0, (1.0, 0.88, 0.72), col)


def build_camera(col):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = 50.0
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 36.0
    cd.clip_start = 0.01
    cd.clip_end = 50.0
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 1.8
    set_attr(cd.dof, "aperture_blades", 7)
    cam = link(bpy.data.objects.new("Camera", cd), col)
    cam.rotation_mode = "QUATERNION"
    focus = link(bpy.data.objects.new("Camera_FocusTarget", None), col)
    focus.empty_display_type = "SPHERE"
    focus.empty_display_size = 0.01
    cd.dof.focus_object = focus
    bpy.context.scene.camera = cam
    return cam, focus


# --------------------------------------------------------------------------------------
# Animation baking
# --------------------------------------------------------------------------------------
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


# --------------------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------------------
def main():
    prefs = bpy.context.preferences.edit
    old_interp = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = "LINEAR"
    try:
        clear_scene()
        scene = bpy.context.scene
        setup_render(scene)

        col_card = new_collection("Card")
        col_emboss = new_collection("Embossed_Gold")
        col_stitch = new_collection("Embroidery")
        col_rig = new_collection("Needle_Rig")
        col_light = new_collection("Camera_Lights")

        linen = make_linen_material()
        gold = make_gold_material()
        thread_mat = make_thread_material()
        chrome = make_simple_material("Needle_Chrome", (0.86, 0.87, 0.89, 1.0), 1.0, 0.14)

        build_card(linen, col_card)

        # --- static embossed elements (top to bottom) ---------------------------------
        import_svg_as_gold_mesh(SVG_WREATH, "Wreath", (0.0, 0.58), 0.60, gold, col_emboss,
                                extrude=0.0008, bevel=0.00025, bevel_res=1)
        add_text("Mono_Y", "Y", -0.075, 0.585, 0.15, gold, col_emboss, extrude=0.0012, bevel=0.0003)
        add_text("Mono_Bar", "|", 0.0, 0.585, 0.15, gold, col_emboss, extrude=0.0012, bevel=0.0003)
        add_text("Mono_M", "M", 0.078, 0.585, 0.15, gold, col_emboss, extrude=0.0012, bevel=0.0003)
        add_text("SaveTheDate", "SAVE THE DATE", 0.0, 0.25, 0.034, gold, col_emboss, spacing=1.9,
                 extrude=0.0008, bevel=0.00015)
        add_text("Name_Yuval", "Yuval", 0.0, 0.135, 0.13, gold, col_emboss, extrude=0.0012, bevel=0.0003)
        add_text("Name_Amp", "&", 0.0, 0.035, 0.085, gold, col_emboss, extrude=0.0011, bevel=0.00025)
        add_text("Name_Mevorah", "Mevorah", 0.0, -0.07, 0.13, gold, col_emboss, extrude=0.0012, bevel=0.0003)
        import_svg_as_gold_mesh(SVG_DIVIDER, "Divider", (0.0, -0.165), 0.56, gold, col_emboss,
                                extrude=0.0007, bevel=0.0002, bevel_res=1)
        add_text("OurForeverBegins", "OUR FOREVER BEGINS", 0.0, -0.455, 0.031, gold, col_emboss,
                 spacing=1.9, extrude=0.0008, bevel=0.00015)
        import_svg_as_gold_mesh(SVG_VENUE, "Venue", (0.0, -CARD_H / 2 + 0.225), CARD_W, gold,
                                col_emboss, extrude=0.0005, bevel=0.0001, bevel_res=0)

        # --- gold thread embroidery ---------------------------------------------------
        polylines = date_outline_polylines("01.06.2027", (0.0, -0.255), 0.10)
        n_date = len(polylines)
        polylines += heart_polylines((0.0, -0.36), 0.10)
        stitch = build_stitch_curve(polylines, col_stitch)
        stitch.data.materials.append(thread_mat)
        ng = build_stitch_node_group(thread_mat)
        mod = stitch.modifiers.new("GoldThreadStitch", "NODES")
        mod.node_group = ng
        ident = progress_identifier(ng)
        sampler = PathSampler(polylines)
        log(f"stitch path: {n_date} date contours + {len(polylines) - n_date} heart rows, "
            f"{sampler.total:.2f} m of thread")

        # --- rig, lights, camera, animation -------------------------------------------
        ctrl, needle, foot, thread = build_needle_rig(col_rig, chrome, thread_mat)
        setup_lights(col_light)
        cam, focus = build_camera(col_light)
        bake_animation(scene, sampler, stitch, mod, ident, ctrl, needle, foot, thread, cam, focus)

        scene.frame_set(FRAME_START)
        bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
        log(f"saved {OUTPUT_BLEND}")
    finally:
        prefs.keyframe_new_interpolation_type = old_interp


if __name__ == "__main__":
    main()
