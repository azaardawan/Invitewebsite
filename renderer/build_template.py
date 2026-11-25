"""
build_template.py
=================
Builds the "Save the Date" master template for Blender and saves it as
master_template.blend next to this script. render_invite.py imports this module and
reuses its functions to personalise the template, so both always agree.

  * 1080 x 1920 (9:16), 30 fps, frames 1-345 (11.5 s), BLENDER_EEVEE
  * Warm oatmeal linen card under a low raking key light
  * Heavy embossed gold lettering (Cormorant Garamond SemiBold) with a pressed-in shadow rim
  * Gold-thread embroidery: a satin-filled bold date and a plump domed satin heart, grown by
    one Geometry Nodes Trim Curve driven by a single progress value (frames 1-225)
  * Needle (thread through its eye, down to the stitch) + presser foot locked to the
    active stitch point every frame; they lift away over frames 225-255
  * Low diagonal macro camera (~25 deg) with shallow DOF over frames 1-220, then a smooth
    pull-back and tilt to the full card (220-305), holding to frame 345

Files expected next to this script:
    wreath.svg, divider.svg, venue.svg,
    CormorantGaramond-Regular.ttf, CormorantGaramond-SemiBold.ttf, CormorantGaramond-Bold.ttf

Run headless:   blender -b --factory-startup -P build_template.py
WARNING: running it as a script clears the current scene before building.
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
STITCH_END = 225          # embroidery finishes (single progress 0 -> 1 over 1-225)
LIFT_END = 255            # needle rig gone
CAM_CLOSE_END = 220       # camera leaves the macro view
PULLBACK_END = 305        # camera settles on the full card

CARD_W, CARD_H = 1.08, 1.92
GOLD_HEX = "#B89356"
LINEN_HEX = "#CDBB9C"     # warm oatmeal / sand
TABLE_HEX = "#A8936F"     # close to the card, so no dark band around it

FONT_FILES = {
    "regular": "CormorantGaramond-Regular.ttf",
    "semibold": "CormorantGaramond-SemiBold.ttf",
    "bold": "CormorantGaramond-Bold.ttf",
}
SVG_WREATH, SVG_DIVIDER, SVG_VENUE = "wreath.svg", "divider.svg", "venue.svg"

# Layout (metres, card centred on the origin, facing +Z)
DATE_CENTER, DATE_SIZE, DATE_MAX_WIDTH = (0.0, -0.255), 0.105, 0.80
HEART_CENTER, HEART_WIDTH = (0.0, -0.362), 0.085

# Embroidery
THREAD_RADIUS = 0.00065   # base radius of the gold thread tube
STITCH_LENGTH = 0.0040    # running-stitch length on outline cords
SAMPLE_STEP = 0.0007      # point spacing along stitch paths
KIND_DATE_SATIN, KIND_HEART_SATIN, KIND_CORD = 1.0, 2.0, 3.0   # stored in point radius

# Camera
LENS_MM = 65.0
CLOSE_DIST = 0.30
CLOSE_ELEVATION = math.radians(28.0)
CLOSE_AZIMUTH = math.radians(50.0)      # camera sits front-left of the stitch
CLOSE_ROLL = math.radians(-16.0)        # slight dutch angle: text and needle run diagonally
FINAL_DIST = CARD_H * 1.025 / (2 * math.tan(math.atan(18.0 / LENS_MM)))


def _base_dir():
    """Folder of this script; falls back to other sensible places."""
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


BASE_DIR = os.environ.get("ASSET_DIR") or _base_dir()
OUTPUT_BLEND = os.path.join(BASE_DIR, "master_template.blend")


def log(msg):
    print(f"[build_template] {msg}", flush=True)


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


def smootherstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def lerp(a, b, t):
    return a + (b - a) * t


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


def look_rotation(cam_loc, target, up_hint=Vector((0, 0, 1))):
    """Quaternion that points a camera (-Z forward, +Y up) from cam_loc at target."""
    f = (Vector(target) - Vector(cam_loc)).normalized()
    up = Vector(up_hint).normalized()
    if abs(f.dot(up)) > 0.999:
        up = Vector((0, 1, 0)) if abs(f.z) > 0.9 else Vector((0, 0, 1))
    x = f.cross(up).normalized()
    y = x.cross(f).normalized()
    m = Matrix((x, y, -f)).transposed()
    return m.to_quaternion()


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
    set_attr(ee, "taa_render_samples", 64)
    set_attr(ee, "taa_samples", 16)
    set_attr(ee, "use_soft_shadows", True)        # legacy EEVEE
    set_attr(ee, "shadow_cube_size", "2048")
    set_attr(ee, "shadow_cascade_size", "4096")
    set_attr(ee, "use_gtao", True)
    set_attr(ee, "gtao_distance", 0.02)
    set_attr(ee, "use_shadows", True)             # EEVEE Next
    set_attr(ee, "shadow_ray_count", 2)
    set_attr(ee, "shadow_step_count", 8)
    set_attr(ee, "shadow_resolution_scale", 1.0)

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
    vs.exposure = 0.0

    world = bpy.data.worlds.new("WarmStudio")
    if bpy.app.version < (5, 0, 0):          # node trees are always on in 5.x
        world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.20, 0.155, 0.11, 1.0)
    bg.inputs["Strength"].default_value = 0.55
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
    """Warm oatmeal linen: warp/weft weave, slubs and fibre grain."""
    mat = bpy.data.materials.new("Linen_Card")
    nt, bsdf, _ = principled(mat)
    N, L = nt.nodes, nt.links
    texco = N.new("ShaderNodeTexCoord")

    def wave(direction, scale, distortion):
        w = N.new("ShaderNodeTexWave")
        w.wave_type = "BANDS"
        w.bands_direction = direction
        w.wave_profile = "SIN"
        w.inputs["Scale"].default_value = scale
        w.inputs["Distortion"].default_value = distortion
        w.inputs["Detail"].default_value = 3.0
        w.inputs["Detail Scale"].default_value = 2.0
        L.new(texco.outputs["Object"], w.inputs["Vector"])
        return w

    warp, weft = wave("X", 210.0, 2.2), wave("Y", 195.0, 2.6)

    def math(op, a, b, c=None):
        m = N.new("ShaderNodeMath")
        m.operation = op
        for idx, v in enumerate((a, b, c)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                m.inputs[idx].default_value = v
            else:
                L.new(v, m.inputs[idx])
        return m.outputs[0]

    # woven cross-hatch: over/under pattern = max of the two thread systems + their product
    over = math("MAXIMUM", sock(warp.outputs, "Fac"), sock(weft.outputs, "Fac"))
    under = math("MULTIPLY", sock(warp.outputs, "Fac"), sock(weft.outputs, "Fac"))
    weave = math("MULTIPLY_ADD", under, 0.6, over)

    slub = N.new("ShaderNodeTexNoise")          # thick/thin slubs along threads
    slub.inputs["Scale"].default_value = 60.0
    slub.inputs["Detail"].default_value = 4.0
    L.new(texco.outputs["Object"], slub.inputs["Vector"])
    grain = N.new("ShaderNodeTexNoise")         # fibre grain
    grain.inputs["Scale"].default_value = 1400.0
    grain.inputs["Detail"].default_value = 8.0
    L.new(texco.outputs["Object"], grain.inputs["Vector"])
    vor = N.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 520.0
    L.new(texco.outputs["Object"], vor.inputs["Vector"])

    fine = math("MULTIPLY_ADD", sock(grain.outputs, "Fac"), 0.35, weave)
    fine = math("MULTIPLY_ADD", sock(vor.outputs, "Distance"), 0.25, fine)

    # The weave is ~1.5 mm: in the full-card view that is about one pixel and would alias
    # into a blotchy pattern, so fade the fine detail out with distance from the camera.
    cam = N.new("ShaderNodeCameraData")
    fade = N.new("ShaderNodeMapRange")
    fade.clamp = True
    L.new(sock(cam.outputs, "View Distance"), fade.inputs[0])
    fade.inputs[1].default_value, fade.inputs[2].default_value = 0.7, 1.8
    fade.inputs[3].default_value, fade.inputs[4].default_value = 1.0, 0.0
    fine = math("MULTIPLY", fine, fade.outputs[0])
    base_level = math("MULTIPLY", math("SUBTRACT", 1.0, fade.outputs[0]), 0.9)   # keep mean tone
    height = math("ADD", fine, base_level)
    height = math("MULTIPLY_ADD", sock(slub.outputs, "Fac"), 0.5, height)

    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.95
    bump.inputs["Distance"].default_value = 0.0009
    L.new(height, bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    base = hex_to_linear(LINEN_HEX)
    dark = tuple(c * 0.66 for c in base[:3]) + (1.0,)
    light = tuple(min(1.0, c * 1.08) for c in base[:3]) + (1.0,)
    col = ramp(nt, dark, light, 0.35, 1.45)
    L.new(height, sock(col.inputs, "Fac"))
    L.new(col.outputs["Color"], bsdf.inputs["Base Color"])

    rough = N.new("ShaderNodeMapRange")
    L.new(sock(grain.outputs, "Fac"), rough.inputs[0])
    rough.inputs[3].default_value, rough.inputs[4].default_value = 0.80, 0.92
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
    rough.inputs[3].default_value, rough.inputs[4].default_value = 0.24, 0.36
    L.new(rough.outputs[0], bsdf.inputs["Roughness"])

    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.06
    bump.inputs["Distance"].default_value = 0.0002
    L.new(sock(brush.outputs, "Fac"), bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    gold = hex_to_linear(GOLD_HEX)
    col = ramp(nt, tuple(c * 0.78 for c in gold[:3]) + (1,), gold, 0.3, 0.7)
    L.new(sock(brush.outputs, "Fac"), sock(col.inputs, "Fac"))
    L.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 0.9
    return mat


def make_deboss_material():
    """Darkened linen for the pressed-in rim around the gold letters."""
    mat = bpy.data.materials.new("Deboss_Shadow")
    _, bsdf, _ = principled(mat)
    bsdf.inputs["Base Color"].default_value = tuple(c * 0.42 for c in hex_to_linear(LINEN_HEX)[:3]) + (1,)
    bsdf.inputs["Roughness"].default_value = 0.95
    bsdf.inputs["Metallic"].default_value = 0.0
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
    twist.inputs["Scale"].default_value = 1300.0
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
    col = ramp(nt, tuple(c * 0.40 for c in gold[:3]) + (1,), gold, 0.0, 0.55)
    L.new(sock(attr.outputs, "Fac"), sock(col.inputs, "Fac"))
    L.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.26
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
    table.materials.append(make_simple_material("Table_Sand", TABLE_HEX, 0.0, 0.85))
    t = link(bpy.data.objects.new("Table", table), col)
    t.location.z = -0.0032
    return card


# --------------------------------------------------------------------------------------
# Text (gold letters + a darker pressed-in rim, parented so both move/scale together)
# --------------------------------------------------------------------------------------
_FONTS = {}


def get_font(weight="regular"):
    if weight not in _FONTS:
        path = os.path.join(BASE_DIR, FONT_FILES.get(weight, FONT_FILES["regular"]))
        if not os.path.isfile(path) and weight != "regular":
            log(f"WARNING: {os.path.basename(path)} not found; using the regular weight")
            _FONTS[weight] = get_font("regular")
            return _FONTS[weight]
        if os.path.isfile(path):
            _FONTS[weight] = bpy.data.fonts.load(path, check_existing=True)
        else:
            log(f"WARNING: {FONT_FILES['regular']} not found in {BASE_DIR}; using Blender's built-in font")
            _FONTS[weight] = None
    return _FONTS[weight]


def _font_curve(name, body, size, weight, spacing):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    font = get_font(weight)
    if font:
        cu.font = font
    cu.size = size
    cu.align_x, cu.align_y = "CENTER", "CENTER"
    cu.space_character = spacing
    cu.resolution_u = 8
    return cu


def add_text(name, body, x, y, size, mat, col, weight="semibold", spacing=1.0,
             extrude=0.0018, bevel=0.00045, deboss_mat=None):
    cu = _font_curve(name, body, size, weight, spacing)
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = 3
    if mat:
        cu.materials.append(mat)
    ob = link(bpy.data.objects.new(name, cu), col)
    ob.location = (x, y, extrude * 0.55)      # partly pressed into the paper
    ob["weight"] = weight
    if deboss_mat:
        rim = _font_curve(name + "_Deboss", body, size, weight, spacing)
        rim.offset = max(0.0004, size * 0.0065)
        rim.extrude = 0.00004
        rim.materials.append(deboss_mat)
        rob = link(bpy.data.objects.new(name + "_Deboss", rim), col)
        rob.parent = ob
        rob.location = (0.0, 0.0, -ob.location.z + 0.00008)
        rob["weight"] = weight
    return ob


def text_parts(ob):
    return [ob] + [c for c in ob.children if c.type == "FONT"]


def set_text_body(name, body, max_width=None, align=None):
    """Change a text (and its pressed-in rim) in place; shrink it to max_width if needed."""
    ob = bpy.data.objects.get(name)
    if ob is None:
        raise RuntimeError(f"master_template.blend has no object named '{name}'")
    for part in text_parts(ob):
        part.data.body = body
        font = get_font(part.get("weight", "regular"))
        if font:
            part.data.font = font
        if align:
            part.data.align_x = align
        part.hide_render = part.hide_viewport = not body.strip()
    ob.scale = (1.0, 1.0, 1.0)
    if max_width and body.strip():
        bpy.context.view_layer.update()
        width = ob.dimensions.x
        if width > max_width:
            k = max_width / width
            ob.scale = (k, k, 1.0)
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
# Stitch paths: satin-filled bold date + domed satin heart, as ordered (points, kind)
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


def _signed_area(poly):
    return 0.5 * sum(a.x * b.y - b.x * a.y for a, b in zip(poly, poly[1:] + poly[:1]))


def _inside(p, poly):
    c = False
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        if (a.y > p.y) != (b.y > p.y) and p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x:
            c = not c
    return c


def _edge_distance(p, contours):
    best = 1e9
    for poly in contours:
        n = len(poly)
        for i in range(n):
            a, b = poly[i], poly[(i + 1) % n]
            abx, aby = b.x - a.x, b.y - a.y
            l2 = abx * abx + aby * aby
            t = 0.0 if l2 < 1e-18 else max(0.0, min(1.0, ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2))
            dx, dy = p.x - (a.x + abx * t), p.y - (a.y + aby * t)
            d = dx * dx + dy * dy
            if d < best:
                best = d
    return math.sqrt(best)


def glyph_contours(text, center, size, weight="bold"):
    """Text -> curve (Object.to_curve) -> closed glyph outlines as 2D point lists."""
    cu = _font_curve("Stitch_text_tmp", text, size, weight, 1.12)
    cu.resolution_u = 10
    ob = link(bpy.data.objects.new("Stitch_text_tmp", cu))
    ob.location = (center[0], center[1], 0.0)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ob_eval = ob.evaluated_get(dg)
    curve = ob_eval.to_curve(dg, apply_modifiers=False)
    mw = ob.matrix_world.copy()
    contours = []
    for sp in curve.splines:
        pts = []
        if sp.type == "BEZIER":
            bps = list(sp.bezier_points)
            n = len(bps)
            for k in range(n if sp.use_cyclic_u else n - 1):
                a, b = bps[k], bps[(k + 1) % n]
                pts.extend(interpolate_bezier(a.co, a.handle_right, b.handle_left, b.co, 10)[:-1])
        else:
            pts = [Vector(p.co[:3]) for p in sp.points]
        pts = [(mw @ Vector(p)).to_2d().to_3d() for p in pts]
        if len(pts) > 2:
            pts = resample_polyline(pts, 0.0006, closed=True)[:-1]
            contours.append(pts)
    ob_eval.to_curve_clear()
    bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.curves.remove(cu)
    return contours


def group_glyphs(contours):
    """Group outer contours with the holes they contain; order glyphs left to right."""
    info = sorted(((abs(_signed_area(c)), c) for c in contours), key=lambda t: -t[0])
    parent = {}
    for i, (_, c) in enumerate(info):
        parent[i] = None
        for j in range(i - 1, -1, -1):                 # smallest larger contour containing it
            if _inside(c[0], info[j][1]):
                parent[i] = j
                break
    depth = {}
    for i in range(len(info)):
        d, p = 0, parent[i]
        while p is not None:
            d, p = d + 1, parent[p]
        depth[i] = d
    glyphs = {}
    for i, (_, c) in enumerate(info):
        root = i if depth[i] % 2 == 0 else parent[i]
        glyphs.setdefault(root, []).append(c)
    out = list(glyphs.values())
    out.sort(key=lambda g: min(p.x for p in g[0]))
    return out


def satin_rows(contours, angle_deg, spacing, inset):
    """Parallel stitch rows across a shape (even-odd fill), alternating direction."""
    a = math.radians(angle_deg)
    ca, sa = math.cos(a), math.sin(a)
    rot = [[(p.x * ca + p.y * sa, -p.x * sa + p.y * ca) for p in c] for c in contours]
    vs = [q[1] for c in rot for q in c]
    rows, flip = [], False
    v = min(vs) + spacing * 0.5
    while v < max(vs):
        xs = []
        for c in rot:
            n = len(c)
            for i in range(n):
                (x1, y1), (x2, y2) = c[i], c[(i + 1) % n]
                if (y1 > v) != (y2 > v):
                    xs.append(x1 + (x2 - x1) * (v - y1) / (y2 - y1))
        xs.sort()
        spans = [(xs[j] + inset, xs[j + 1] - inset) for j in range(0, len(xs) - 1, 2)]
        spans = [s for s in spans if s[1] - s[0] > inset]
        if flip:
            spans = [(b, a2) for a2, b in reversed(spans)]
        for u0, u1 in spans:
            rows.append([Vector((u0 * ca - v * sa, u0 * sa + v * ca, 0.0)),
                         Vector((u1 * ca - v * sa, u1 * sa + v * ca, 0.0))])
        flip = not flip
        v += spacing
    return rows


def _domed(points, contours, height, reach):
    for p in points:
        d = _edge_distance(p, contours)
        p.z = height * min(1.0, d / reach) ** 0.6
    return points


def date_stitch_paths(text, center=DATE_CENTER, size=DATE_SIZE):
    """Solid satin-stitched date: each glyph filled with diagonal rows, then outlined."""
    paths = []
    for glyph in group_glyphs(glyph_contours(text, center, size, "bold")):
        for row in satin_rows(glyph, 52.0, 0.00105, 0.00025):
            length = (row[1] - row[0]).length
            pts = resample_polyline(row, min(SAMPLE_STEP, max(length / 8, 0.0002)), closed=False)
            paths.append((_domed(pts, glyph, 0.0007, 0.0016), KIND_DATE_SATIN))
        for c in glyph:
            paths.append((resample_polyline(c, SAMPLE_STEP, closed=True), KIND_CORD))
    return paths


def heart_stitch_paths(center=HEART_CENTER, width=HEART_WIDTH):
    """Plump padded satin heart: domed diagonal rows, then a cord outline."""
    s = width / 32.0
    outline = []
    for k in range(240):
        t = 2 * math.pi * k / 240
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        outline.append(Vector((center[0] + x * s, center[1] + (y + 2.5) * s, 0.0)))
    paths = []
    for row in satin_rows([outline], 45.0, 0.0017, 0.0008):
        pts = resample_polyline(row, SAMPLE_STEP, closed=False)
        paths.append((_domed(pts, [outline], 0.0055, width * 0.28), KIND_HEART_SATIN))
    paths.append((resample_polyline(outline, SAMPLE_STEP, closed=True), KIND_CORD))
    return paths


def fit_date_paths(text):
    paths = date_stitch_paths(text)
    xs = [p.x for pts, _ in paths for p in pts]
    if xs and max(xs) - min(xs) > DATE_MAX_WIDTH:
        paths = date_stitch_paths(text, DATE_CENTER, DATE_SIZE * DATE_MAX_WIDTH / (max(xs) - min(xs)))
    if not paths:
        raise RuntimeError(f"the date '{text}' produced no stitchable outline")
    return paths


def make_stitch_curve_data(paths, materials=()):
    """One curve; spline order = stitching order; point radius = stitch kind."""
    cu = bpy.data.curves.new("Stitch_Date_Heart", "CURVE")
    cu.dimensions = "3D"
    for pts, kind in paths:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        flat = []
        for p in pts:
            flat += [p.x, p.y, p.z, 1.0]
        sp.points.foreach_set("co", flat)
        sp.points.foreach_set("radius", [kind] * len(pts))
        sp.use_cyclic_u = False
    for m in materials:
        cu.materials.append(m)
    return cu


class PathSampler:
    """Arc-length lookup over the ordered splines (matches the GN Trim timing exactly)."""

    def __init__(self, paths):
        self.pts, self.cum = [], []
        total = 0.0
        for pts, _ in paths:
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
        if lo == 0 or self.cum[lo] - self.cum[lo - 1] < 1e-12 or self.cum[lo] <= target:
            return self.pts[lo].copy()
        a, b = self.pts[lo - 1], self.pts[lo]
        if (b - a).length > SAMPLE_STEP * 3:          # a jump between splines: snap to the start
            return b.copy()
        t = (target - self.cum[lo - 1]) / (self.cum[lo] - self.cum[lo - 1])
        return a.lerp(b, t)


# --------------------------------------------------------------------------------------
# Geometry Nodes: per-spline Trim Curve + satin / running-stitch detailing + thread tube
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

    def math_node(op, a=None, b=None, c=None):
        m = node("ShaderNodeMath", 0, -800)
        m.operation = op
        for idx, val in enumerate((a, b, c)):
            if val is None:
                continue
            if isinstance(val, (int, float)):
                m.inputs[idx].default_value = val
            else:
                L.new(val, m.inputs[idx])
        return m.outputs[0]

    def store(geo, name, value, domain, x):
        st = node("GeometryNodeStoreNamedAttribute", x, 0)
        set_attr(st, "data_type", "FLOAT")
        set_attr(st, "domain", domain)
        sock(st.inputs, "Name").default_value = name
        L.new(geo, st.inputs[0])
        L.new(value, sock(st.inputs, "Value", "VALUE"))
        return st.outputs[0]

    def read(name, x, y):
        r = node("GeometryNodeInputNamedAttribute", x, y)
        set_attr(r, "data_type", "FLOAT")
        sock(r.inputs, "Name").default_value = name
        return sock(r.outputs, "Attribute", "VALUE")

    gin = node("NodeGroupInput", -1600, 0)
    gout = node("NodeGroupOutput", 2000, 0)
    g_geo, g_prog = gin.outputs[0], gin.outputs[1]

    # --- per-spline window of the single global progress (date first, then heart) -------
    slen = node("GeometryNodeSplineLength", -1500, -300)
    acc = node("GeometryNodeAccumulateField", -1300, -300)
    set_attr(acc, "data_type", "FLOAT")
    set_attr(acc, "domain", "CURVE")
    L.new(sock(slen.outputs, "Length"), sock(acc.inputs, "Value", "VALUE"))
    total = sock(acc.outputs, "Total", "VALUE")
    t0 = math_node("DIVIDE", sock(acc.outputs, "Trailing", "VALUE"), total)
    t1 = math_node("DIVIDE", sock(acc.outputs, "Leading", "VALUE"), total)
    local = node("ShaderNodeMapRange", -1100, -300)
    set_attr(local, "data_type", "FLOAT")
    local.clamp = True
    L.new(g_prog, local.inputs[0])
    L.new(t0, local.inputs[1])
    L.new(t1, local.inputs[2])
    local.inputs[3].default_value, local.inputs[4].default_value = 0.0, 1.0

    geo = store(g_geo, "stitch_local", local.outputs[0], "CURVE", -900)
    kind_in = node("GeometryNodeInputRadius", -900, -300).outputs[0]      # radius = kind
    geo = store(geo, "stitch_kind", kind_in, "POINT", -700)
    local_val = read("stitch_local", -600, -300)

    trim = node("GeometryNodeTrimCurve", -450, 0)
    set_enum(trim, "mode", "FACTOR", "Mode")
    L.new(geo, trim.inputs[0])
    sock(trim.inputs, "Start", "VALUE").default_value = 0.0
    L.new(local_val, sock(trim.inputs, "End", "VALUE"))

    cmp = node("FunctionNodeCompare", -450, -300)
    set_attr(cmp, "data_type", "FLOAT")
    set_attr(cmp, "operation", "LESS_EQUAL")
    L.new(local_val, sock(cmp.inputs, "A", "VALUE"))
    sock(cmp.inputs, "B", "VALUE").default_value = 0.0001
    delete = node("GeometryNodeDeleteGeometry", -250, 0)
    set_attr(delete, "domain", "CURVE")
    L.new(sock(trim.outputs, "Curve"), delete.inputs[0])
    L.new(cmp.outputs[0], sock(delete.inputs, "Selection"))

    # --- stitch shape: satin rows arch end to end; cords show running stitches ---------
    kind = read("stitch_kind", -250, -400)
    is_cord = math_node("COMPARE", kind, KIND_CORD, 0.5)
    is_heart = math_node("COMPARE", kind, KIND_HEART_SATIN, 0.5)
    sparam = node("GeometryNodeSplineParameter", -250, -600)

    b_len = math_node("DIVIDE", sock(sparam.outputs, "Length"), STITCH_LENGTH)
    b_len = math_node("FRACT", b_len)
    b_len = math_node("SINE", math_node("MULTIPLY", b_len, math.pi))
    b_len = math_node("POWER", b_len, 0.45)
    b_fac = math_node("SINE", math_node("MULTIPLY", sock(sparam.outputs, "Factor"), math.pi))
    b_fac = math_node("POWER", b_fac, 0.3)
    bump = math_node("MULTIPLY_ADD", is_cord, math_node("SUBTRACT", b_len, b_fac), b_fac)
    mult = math_node("MULTIPLY_ADD", is_heart, 0.35, math_node("MULTIPLY_ADD", is_cord, 0.2, 1.0))

    geo = store(delete.outputs[0], "stitch_bump", bump, "POINT", 0)

    radius = math_node("MULTIPLY", math_node("MULTIPLY_ADD", bump, 0.6, 0.4), mult)
    set_rad = node("GeometryNodeSetCurveRadius", 250, 0)
    L.new(geo, set_rad.inputs[0])
    L.new(radius, sock(set_rad.inputs, "Radius"))

    # thread arches above the linen and dives into it where it enters the fabric
    z = math_node("MULTIPLY", math_node("MULTIPLY_ADD", bump, 1.05, -0.45), mult)
    z = math_node("MULTIPLY", z, THREAD_RADIUS)
    comb = node("ShaderNodeCombineXYZ", 400, -500)
    L.new(z, comb.inputs[2])
    setpos = node("GeometryNodeSetPosition", 500, 0)
    L.new(set_rad.outputs[0], setpos.inputs[0])
    L.new(comb.outputs[0], sock(setpos.inputs, "Offset"))

    profile = node("GeometryNodeCurvePrimitiveCircle", 500, -250)
    sock(profile.inputs, "Resolution").default_value = 8
    sock(profile.inputs, "Radius").default_value = THREAD_RADIUS

    c2m = node("GeometryNodeCurveToMesh", 750, 0)
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

    setmat = node("GeometryNodeSetMaterial", 1000, 0)
    L.new(c2m.outputs[0], setmat.inputs[0])
    sock(setmat.inputs, "Material").default_value = thread_mat
    smooth = node("GeometryNodeSetShadeSmooth", 1250, 0)
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
# Needle, thread & presser foot rig
# --------------------------------------------------------------------------------------
EYE_HEIGHT = 0.0175        # needle eye above the tip
NEEDLE_UP, NEEDLE_DOWN = 0.008, -0.0012     # tip height above the stitch point (local Z)
THREAD_SIDE = 0.00095      # lower thread runs just beside the needle, towards the camera


def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def _box(bm, size, loc, rot=None, mat_index=0):
    geom = bmesh.ops.create_cube(bm, size=1.0)
    vs = geom["verts"]
    bmesh.ops.scale(bm, vec=size, verts=vs)
    if rot:
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot[0], 3, rot[1]), verts=vs)
    bmesh.ops.translate(bm, vec=loc, verts=vs)
    for f in {f for v in vs for f in v.link_faces}:
        f.material_index = mat_index


def _cyl(bm, r1, r2, z0, z1, x=0.0, y=0.0, mat_index=0, segments=32, axis=None):
    m = Matrix.Translation((x, y, (z0 + z1) / 2))
    if axis:
        m = m @ axis
    geom = bmesh.ops.create_cone(bm, cap_ends=True, segments=segments, radius1=r1, radius2=r2,
                                 depth=z1 - z0, matrix=m)
    for f in {f for v in geom["verts"] for f in v.link_faces}:
        f.material_index = mat_index


def _thread_curve(name, pts, mat, radius):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, co in zip(sp.points, pts):
        p.co = (*co, 1.0)
    cu.materials.append(mat)
    return cu


def build_needle_rig(col, chrome, steel, thread_mat):
    ctrl = link(bpy.data.objects.new("NeedleRig_Controller", None), col)
    ctrl.empty_display_type = "ARROWS"
    ctrl.empty_display_size = 0.03

    # --- needle: tip at local origin, pointing down -Z --------------------------------
    bm = bmesh.new()
    _cyl(bm, 0.00002, 0.00085, 0.0, 0.012)
    _cyl(bm, 0.00085, 0.00085, 0.012, 0.087)
    _cyl(bm, 0.00085, 0.0016, 0.087, 0.093)
    _cyl(bm, 0.0016, 0.0016, 0.093, 0.135)
    needle = link(bpy.data.objects.new("Needle", mesh_from_bm("Needle", bm)), col)
    needle.parent = ctrl

    # eye: boolean slot through the shaft (applied, so no helper object is left over)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(0.0007, 0.006, 0.0042), verts=bm.verts)
    cutter = link(bpy.data.objects.new("Needle_EyeCutter", mesh_from_bm("EyeCutter", bm)), col)
    cutter.location = (0, 0, EYE_HEIGHT)
    boolean = needle.modifiers.new("Eye", "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.object = cutter
    set_attr(boolean, "solver", "EXACT")
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    applied = bpy.data.meshes.new_from_object(needle.evaluated_get(dg))
    needle.modifiers.clear()
    bpy.data.objects.remove(cutter, do_unlink=True)

    # needle clamp + needle bar (the machine part reaching up out of frame)
    bm = bmesh.new()
    bm.from_mesh(applied)
    _box(bm, (0.009, 0.008, 0.020), (0.0, 0.0, 0.146), mat_index=1)
    _cyl(bm, 0.0021, 0.0021, 0.140, 0.152, x=0.0066, mat_index=1, segments=20,
         axis=Matrix.Rotation(math.radians(90), 4, "Y"))
    _cyl(bm, 0.0034, 0.0034, 0.156, 0.70, mat_index=1, segments=28)
    old = needle.data
    needle.data = mesh_from_bm("Needle", bm)
    bpy.data.meshes.remove(old)
    bpy.data.meshes.remove(applied)
    for poly in needle.data.polygons:
        poly.use_smooth = True
    needle.data.materials.append(chrome)
    needle.data.materials.append(steel)

    # upper thread: from the machine down into the eye (moves with the needle)
    upper = link(bpy.data.objects.new("Needle_Thread", _thread_curve(
        "Needle_Thread", [(-THREAD_SIDE, -0.0025, 0.70), (-THREAD_SIDE, -0.0018, 0.10),
                          (-THREAD_SIDE * 0.5, -0.0012, EYE_HEIGHT + 0.004), (0.0, 0.0, EYE_HEIGHT)],
        thread_mat, THREAD_RADIUS * 0.45)), col)
    upper.parent = needle

    # lower thread: from the eye straight down to the stitch; its length is keyed per frame
    lower = link(bpy.data.objects.new("Needle_ThreadLower", _thread_curve(
        "Needle_ThreadLower", [(0.0, 0.0, 0.0), (0.0, 0.0, 1.0)], thread_mat,
        THREAD_RADIUS * 0.45)), col)
    lower.parent = ctrl
    lower.location = (THREAD_SIDE, -THREAD_SIDE, 0.0)

    # --- presser foot: hovering behind-right of the needle, never over the active stitch -
    bm = bmesh.new()
    _box(bm, (0.010, 0.022, 0.0016), (0.0, 0.0, 0.0))                          # sole
    _box(bm, (0.010, 0.009, 0.0016), (0.0, 0.0135, 0.0022), (math.radians(-35), "X"))  # toe
    _box(bm, (0.0035, 0.004, 0.012), (0.0, -0.002, 0.0068))                    # ankle
    _box(bm, (0.006, 0.006, 0.050), (0.002, -0.003, 0.038), mat_index=1)       # shank
    _cyl(bm, 0.0022, 0.0022, 0.050, 0.057, x=0.0065, y=-0.003, mat_index=1, segments=24,
         axis=Matrix.Rotation(math.radians(90), 4, "Y"))                       # thumb screw
    _cyl(bm, 0.0045, 0.0045, 0.062, 0.70, x=0.002, y=-0.003, mat_index=1, segments=24)  # bar
    foot = link(bpy.data.objects.new("PresserFoot", mesh_from_bm("PresserFoot", bm)), col)
    foot.data.materials.append(chrome)
    foot.data.materials.append(steel)
    bev = foot.modifiers.new("Bevel", "BEVEL")
    bev.width, bev.segments = 0.0005, 2
    set_attr(bev, "limit_method", "ANGLE")
    foot.parent = ctrl
    foot.location = (0.012, 0.014, 0.0045)
    return {"ctrl": ctrl, "needle": needle, "foot": foot, "thread": upper, "lower": lower}


# --------------------------------------------------------------------------------------
# Lights & camera
# --------------------------------------------------------------------------------------
def _aim(ob, loc, target):
    ob.location = loc
    ob.rotation_euler = look_rotation(loc, target).to_euler()


def setup_lights(col):
    # Low raking warm key (sun): grazes the weave and throws shadows off the gold relief.
    sun_d = bpy.data.lights.new("Key_Raking", "SUN")
    sun_d.energy = 4.2
    sun_d.color = (1.0, 0.80, 0.58)
    set_attr(sun_d, "angle", math.radians(2.5))
    set_attr(sun_d, "use_shadow", True)
    set_attr(sun_d, "use_soft_shadow", True)
    sun = link(bpy.data.objects.new("Key_Raking", sun_d), col)
    el, az = math.radians(21.0), math.radians(148.0)
    _aim(sun, Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el))) * 5, (0, 0, 0))

    def area(name, loc, size, energy, color):
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape = "DISK"
        ld.size = size
        ld.energy = energy
        ld.color = color
        set_attr(ld, "use_shadow", True)
        ob = link(bpy.data.objects.new(name, ld), col)
        _aim(ob, Vector(loc), (0, 0, 0))

    area("Fill_Warm", (1.8, -1.6, 2.4), 3.0, 140.0, (1.0, 0.88, 0.72))     # lifts the shadows
    area("Top_Glint", (0.4, -2.8, 3.0), 3.0, 120.0, (1.0, 0.88, 0.70))     # gold glints, off-axis


def build_camera(col):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = LENS_MM
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 36.0
    cd.clip_start = 0.005
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
# Animation baking (also used by render_invite.py after personalising)
# --------------------------------------------------------------------------------------
def progress_at(frame):
    """The single timeline value that drives both the Trim Curve and the needle."""
    return max(0.0, min(1.0, (frame - FRAME_START) / float(STITCH_END - FRAME_START)))


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


def camera_pose(u, close_aim):
    """u = 0: low diagonal macro view of close_aim; u = 1: straight down on the whole card."""
    target = close_aim.lerp(Vector((0.0, 0.0, 0.0)), u)
    elev = lerp(CLOSE_ELEVATION, math.radians(90.0), u)
    dist = math.exp(lerp(math.log(CLOSE_DIST), math.log(FINAL_DIST), u))
    horiz = Vector((-math.sin(CLOSE_AZIMUTH), -math.cos(CLOSE_AZIMUTH), 0.0))
    loc = target + horiz * (dist * math.cos(elev)) + Vector((0, 0, dist * math.sin(elev)))
    up = Vector((0, 0, 1)).lerp(Vector((0, 1, 0)), smootherstep(u)).normalized()
    rot = look_rotation(loc, target, up) @ Quaternion((0, 0, 1), CLOSE_ROLL * (1.0 - u))
    return loc, rot


def bake_animation(scene, sampler, stitch_obj, mod, ident, rig, cam, focus):
    # One progress value, baked on every frame: Blender may ease keyframes regardless of
    # the default interpolation, which would make the thread lead or lag the needle.
    for f in range(FRAME_START, STITCH_END + 1):
        key_modifier_input(stitch_obj, mod, ident, progress_at(f), f)

    # Active stitch point for every frame: the exact point the trimmed thread ends at
    active = {f: sampler.at(progress_at(f)) for f in range(FRAME_START, STITCH_END + 1)}

    # --- needle rig: tip on the active point; bobbing pierces; thread down to the stitch -
    ctrl, needle, lower = rig["ctrl"], rig["needle"], rig["lower"]
    end_pos = active[STITCH_END]
    for f in range(FRAME_START, LIFT_END + 2):
        if f <= STITCH_END:
            p = active[f]
            ctrl.location = (p.x, p.y, p.z)
            phase = (f - FRAME_START) / 4.0                  # one pierce every 4 frames
            needle.location.z = NEEDLE_DOWN + (NEEDLE_UP - NEEDLE_DOWN) * (0.5 + 0.5 * math.cos(2 * math.pi * phase))
        else:
            u = min(1.0, (f - STITCH_END) / float(LIFT_END - STITCH_END))
            ctrl.location = (end_pos.x, end_pos.y, end_pos.z + 2.2 * (u ** 2.2))
            needle.location.z = NEEDLE_UP
        lower.scale = (1.0, 1.0, max(0.0005, needle.location.z + EYE_HEIGHT))
        ctrl.keyframe_insert("location", frame=f)
        needle.keyframe_insert("location", index=2, frame=f)
        lower.keyframe_insert("scale", index=2, frame=f)

    for ob in (rig["needle"], rig["foot"], rig["thread"], rig["lower"]):
        for f, hidden in ((LIFT_END, False), (LIFT_END + 1, True)):
            ob.hide_render = hidden
            ob.keyframe_insert("hide_render", frame=f)
            ob.hide_viewport = hidden
            ob.keyframe_insert("hide_viewport", frame=f)
        ob.hide_render = ob.hide_viewport = False

    # --- camera: low diagonal macro (1-220) -> pull back & tilt (220-305) -> hold -------
    half = 6
    smooth = {}
    for f in range(FRAME_START, STITCH_END + 1):
        acc = Vector((0, 0, 0))
        for g in range(f - half, f + half + 1):
            acc += active[min(max(g, FRAME_START), STITCH_END)]
        smooth[f] = acc / (2 * half + 1) + Vector((0, 0, 0.007))
    close_aim_end = smooth[CAM_CLOSE_END]
    prev_q = None
    for f in range(FRAME_START, FRAME_END + 1):
        if f <= CAM_CLOSE_END:
            loc, rot = camera_pose(0.0, smooth[f])
            foc = active[f]
        else:
            u = smootherstep((f - CAM_CLOSE_END) / float(PULLBACK_END - CAM_CLOSE_END))
            loc, rot = camera_pose(u, close_aim_end)
            foc = active[min(f, STITCH_END)].lerp(Vector((0, 0, 0)), u)
        if prev_q is not None and prev_q.dot(rot) < 0:
            rot = -rot
        prev_q = rot
        cam.location, cam.rotation_quaternion, focus.location = loc, rot, foc
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)
        focus.keyframe_insert("location", frame=f)


def rig_objects():
    get = bpy.data.objects.get
    return {"ctrl": get("NeedleRig_Controller"), "needle": get("Needle"), "foot": get("PresserFoot"),
            "thread": get("Needle_Thread"), "lower": get("Needle_ThreadLower")}


def stitch_modifier(stitch_obj):
    mod = next(m for m in stitch_obj.modifiers if m.type == "NODES")
    return mod, progress_identifier(mod.node_group)


def restitch(date_text):
    """Rebuild the date + heart path and re-bake the rig and camera (used by render_invite)."""
    paths = fit_date_paths(date_text) + heart_stitch_paths()
    stitch = bpy.data.objects["Stitch_Date_Heart"]
    old = stitch.data
    stitch.data = make_stitch_curve_data(paths, list(old.materials))
    bpy.data.curves.remove(old)
    rig = rig_objects()
    cam, focus = bpy.data.objects["Camera"], bpy.data.objects["Camera_FocusTarget"]
    for ob in [stitch, cam, focus] + list(rig.values()):
        ob.animation_data_clear()
    mod, ident = stitch_modifier(stitch)
    sampler = PathSampler(paths)
    bake_animation(bpy.context.scene, sampler, stitch, mod, ident, rig, cam, focus)
    return paths, sampler


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
        deboss = make_deboss_material()
        thread_mat = make_thread_material()
        chrome = make_simple_material("Needle_Chrome", (0.86, 0.87, 0.89, 1.0), 1.0, 0.14)
        steel = make_simple_material("Machine_Steel", (0.66, 0.64, 0.61, 1.0), 1.0, 0.28)

        build_card(linen, col_card)

        # --- static embossed elements (top to bottom) ---------------------------------
        import_svg_as_gold_mesh(SVG_WREATH, "Wreath", (0.0, 0.58), 0.60, gold, col_emboss,
                                extrude=0.0010, bevel=0.0003, bevel_res=1)
        heavy = dict(extrude=0.0024, bevel=0.0006, deboss_mat=deboss)
        add_text("Mono_Y", "Y", -0.075, 0.585, 0.15, gold, col_emboss, **heavy)
        add_text("Mono_Bar", "|", 0.0, 0.585, 0.15, gold, col_emboss, **heavy)
        add_text("Mono_M", "M", 0.078, 0.585, 0.15, gold, col_emboss, **heavy)
        add_text("SaveTheDate", "SAVE THE DATE", 0.0, 0.25, 0.034, gold, col_emboss, spacing=1.8,
                 weight="bold", extrude=0.0012, bevel=0.0003, deboss_mat=deboss)
        add_text("Name_Yuval", "Yuval", 0.0, 0.135, 0.13, gold, col_emboss, **heavy)
        add_text("Name_Amp", "&", 0.0, 0.035, 0.085, gold, col_emboss, **heavy)
        add_text("Name_Mevorah", "Mevorah", 0.0, -0.07, 0.13, gold, col_emboss, **heavy)
        import_svg_as_gold_mesh(SVG_DIVIDER, "Divider", (0.0, -0.165), 0.56, gold, col_emboss,
                                extrude=0.0009, bevel=0.00025, bevel_res=1)
        add_text("OurForeverBegins", "OUR FOREVER BEGINS", 0.0, -0.458, 0.036, gold, col_emboss,
                 weight="bold", spacing=1.7, extrude=0.0014, bevel=0.00035, deboss_mat=deboss)
        import_svg_as_gold_mesh(SVG_VENUE, "Venue", (0.0, -CARD_H / 2 + 0.225), CARD_W, gold,
                                col_emboss, extrude=0.0006, bevel=0.0001, bevel_res=0)

        # --- gold thread embroidery ---------------------------------------------------
        paths = fit_date_paths("01.06.2027")
        n_date = len(paths)
        paths += heart_stitch_paths()
        stitch = link(bpy.data.objects.new(
            "Stitch_Date_Heart", make_stitch_curve_data(paths, [thread_mat])), col_stitch)
        ng = build_stitch_node_group(thread_mat)
        mod = stitch.modifiers.new("GoldThreadStitch", "NODES")
        mod.node_group = ng
        ident = progress_identifier(ng)
        sampler = PathSampler(paths)
        log(f"stitch path: {n_date} date rows/cords + {len(paths) - n_date} heart rows, "
            f"{sampler.total:.2f} m of thread")

        # --- rig, lights, camera, animation -------------------------------------------
        rig = build_needle_rig(col_rig, chrome, steel, thread_mat)
        setup_lights(col_light)
        cam, focus = build_camera(col_light)
        bake_animation(scene, sampler, stitch, mod, ident, rig, cam, focus)

        scene.frame_set(FRAME_START)
        bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
        log(f"saved {OUTPUT_BLEND}")
    finally:
        prefs.keyframe_new_interpolation_type = old_interp


if __name__ == "__main__":
    main()
