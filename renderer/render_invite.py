"""
render_invite.py - personalise master_template.blend and render it to an H.264 .mp4.

Usage (headless):
    blender -b /app/master_template.blend --python-exit-code 1 -P /app/render_invite.py -- \
        --initials "Y | M" --names "Yuval & Mevorah" --date "01.06.2027" \
        --venue venue.svg [--music song.mp3] --out /tmp/invite.mp4

The video gets the sewing-machine sound (needle.wav) and, if given, the music mixed well
below it (audio_mix.py), so the stitching is always heard.

The stitching, needle rig and camera are rebuilt with the same code that built the template
(build_template.py, imported from this folder), so a new date stays in sync with the needle.

Environment:
    RENDER_RES      WIDTHxHEIGHT, default 720x1280 (rounded down to even numbers for H.264)
    RENDER_SAMPLES  EEVEE samples per frame, default 1 (CPU / software OpenGL friendly)
    RENDER_FRAMES   optional "START-END" sub-range, e.g. "1-60" for a quick test
    ASSET_DIR       folder with the SVGs and fonts, default: this script's folder (/app)
"""

import argparse
import os
import re
import shutil
import sys
import tempfile
import traceback

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
os.environ.setdefault("ASSET_DIR", HERE)
import audio_mix  # noqa: E402
import build_template as bt  # noqa: E402
import make_needle_sound  # noqa: E402

MUSIC_EXTENSIONS = (".mp3", ".m4a", ".aac", ".wav", ".ogg", ".flac")


def log(msg):
    print(f"[render_invite] {msg}", flush=True)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="render_invite.py")
    p.add_argument("--initials", required=True, help='e.g. "Y | M"')
    p.add_argument("--names", required=True, help='e.g. "Yuval & Mevorah"')
    p.add_argument("--date", required=True, help='e.g. "01.06.2027"')
    p.add_argument("--venue", default="venue.svg", help="SVG file name inside the asset folder")
    p.add_argument("--music", default="",
                   help="optional music: a file name in the asset folder's music/ folder, "
                        "or an absolute path to an audio file")
    p.add_argument("--out", required=True, help="output .mp4 path")
    return p.parse_args(argv)


def resolve_music(value):
    if not value:
        return None
    path = value if os.path.isabs(value) else os.path.join(HERE, "music", os.path.basename(value))
    if not os.path.isabs(value) and os.path.basename(value) != value:
        raise RuntimeError("--music must be a plain file name inside music/ or an absolute path")
    if not path.lower().endswith(MUSIC_EXTENSIONS) or not os.path.isfile(path):
        raise RuntimeError(f"music file not found or not an audio file: {value}")
    return path


def needle_track(work):
    path = os.path.join(os.environ.get("ASSET_DIR", HERE), "needle.wav")
    if not os.path.isfile(path):                      # not pre-built: make it now (~1 s)
        path = os.path.join(work, "needle.wav")
        make_needle_sound.write_wav(path, *make_needle_sound.build())
    return path


def update_initials(initials):
    text = " ".join(initials.split())
    if "|" in text:
        left, right = (s.strip() for s in text.split("|", 1))
    elif len(text.replace(" ", "")) == 2:
        left, right = text.replace(" ", "")
    else:
        left, right = text, ""
    if left and right:
        bt.set_text_body("Mono_Y", left, 0.14, "RIGHT").location.x = -0.03
        bt.set_text_body("Mono_Bar", "|")
        bt.set_text_body("Mono_M", right, 0.14, "LEFT").location.x = 0.03
    else:                                    # a single monogram, centred, no bar
        bt.set_text_body("Mono_Y", left or right, 0.30, "CENTER").location.x = 0.0
        bt.set_text_body("Mono_Bar", "")
        bt.set_text_body("Mono_M", "")


def update_names(names):
    text = " ".join(names.split())
    first, second = [s.strip() for s in text.split("&", 1)] if "&" in text else [text, ""]
    if first and second:
        bt.set_text_body("Name_Yuval", first, 0.92)
        bt.set_text_body("Name_Amp", "&")
        bt.set_text_body("Name_Mevorah", second, 0.92)
    else:
        bt.set_text_body("Name_Yuval", "")
        bt.set_text_body("Name_Amp", "")
        ob = bt.set_text_body("Name_Mevorah", first or second, 0.92)
        ob.location.y = 0.03                  # one name line sits in the middle of the block


def refresh_fonts():
    """The .blend stores font paths from the build machine: point every text at /app's fonts."""
    for ob in bpy.data.objects:
        if ob.type == "FONT" and "weight" in ob.keys():
            font = bt.get_font(ob["weight"])
            if font:
                ob.data.font = font


def update_venue(venue):
    venue_ob = bpy.data.objects.get("Venue")
    if venue_ob is None:
        raise RuntimeError("master_template.blend has no object named 'Venue'")
    new = bt.import_svg_as_gold_mesh(venue, "Venue_new", (0.0, -bt.CARD_H / 2 + 0.225), bt.CARD_W,
                                     venue_ob.active_material, None, **bt.ORNAMENT)
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
    r.fps, r.fps_base = bt.FPS, 1.0

    scene.frame_start, scene.frame_end = bt.FRAME_START, bt.FRAME_END
    frames = os.environ.get("RENDER_FRAMES", "").strip()
    if frames:
        a, b = (int(v) for v in frames.split("-", 1))
        scene.frame_start, scene.frame_end = max(bt.FRAME_START, a), min(bt.FRAME_END, b)

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
    music = resolve_music(args.music)

    prefs = bpy.context.preferences.edit
    old_interp = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = "LINEAR"
    scene = bpy.context.scene
    work = tempfile.mkdtemp(prefix="invite_frames_", dir=os.path.dirname(out) or None)
    try:
        refresh_fonts()
        update_initials(args.initials)
        update_names(args.names)
        bt.rebuild_deboss()                   # cut the new lettering into the card
        paths, sampler = bt.restitch(args.date)
        log(f"date '{args.date}': {len(paths)} stitch rows, "
            f"{sum(bt._length(p) for p, _, _ in paths):.2f} m of thread")
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
        frames = scene.frame_end - scene.frame_start + 1
        audio_mix.add_sound(os.path.join(work, videos[0]), out, needle_track(work), music,
                            duration=frames / bt.FPS, start=(scene.frame_start - bt.FRAME_START) / bt.FPS)
        log(f"wrote {out} ({os.path.getsize(out) / 1e6:.1f} MB, sound: needle"
            f"{' + ' + os.path.basename(music) if music else ''})")
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
