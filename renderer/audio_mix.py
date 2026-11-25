"""
audio_mix.py - put the sewing-machine sound (and optional music) on the rendered video.

The needle is the star: it is set to NEEDLE_LUFS, and any music is set MUSIC_BELOW_NEEDLE
loudness units below it, then ducked further while the needle is sewing (sidechain), so the
stitching is always clearly heard however loud the music file was mastered.

Uses only the standard library and the ffmpeg command-line tool.
"""

import json
import os
import re
import shutil
import subprocess

NEEDLE_LUFS = -16.0           # integrated loudness of the sewing sound in the final mix
MUSIC_BELOW_NEEDLE = 7.0      # music sits this many LU under the needle (before ducking)
DURATION = 345 / 30           # 11.5 s


def _ffmpeg():
    path = shutil.which("ffmpeg")
    if not path:
        raise RuntimeError("ffmpeg is not installed; it is needed to add the sound")
    return path


def measure_lufs(path, loop_to=None):
    """Integrated loudness (LUFS) of an audio file (looped/trimmed to loop_to seconds)."""
    cmd = [_ffmpeg(), "-hide_banner", "-nostats"]
    if loop_to:
        cmd += ["-stream_loop", "-1", "-t", f"{loop_to:.3f}"]
    cmd += ["-i", path, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"]
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", out.stderr, re.S)
    if not m:
        raise RuntimeError(f"could not measure the loudness of {os.path.basename(path)}")
    value = float(json.loads(m.group(0))["input_i"])
    if value == float("-inf") or value < -70:
        raise RuntimeError(f"{os.path.basename(path)} is silent")
    return value


def add_sound(video_in, out_path, needle_wav, music=None, duration=DURATION, start=0.0):
    """Mux the needle track (and music, if given) onto video_in, writing out_path (H.264 + AAC).
    start: where video_in begins in the animation (s), for partial test renders."""
    needle_gain = NEEDLE_LUFS - measure_lufs(needle_wav)
    cmd = [_ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-i", video_in,
           "-ss", f"{start:.3f}", "-i", needle_wav]
    if music:
        music_gain = (NEEDLE_LUFS - MUSIC_BELOW_NEEDLE) - measure_lufs(music, loop_to=duration)
        cmd += ["-stream_loop", "-1", "-i", music]
        graph = (
            f"[1:a]aresample=48000,aformat=channel_layouts=stereo,volume={needle_gain:.2f}dB,"
            f"asplit=2[needle][key];"
            f"[2:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{duration:.3f},"
            f"asetpts=PTS-STARTPTS,volume={music_gain:.2f}dB,"
            f"afade=t=in:d=0.8,afade=t=out:st={max(0.0, duration - 1.8):.3f}:d=1.8[music];"
            f"[music][key]sidechaincompress=threshold=0.08:ratio=2:attack=15:release=350[ducked];"
            f"[needle][ducked]amix=inputs=2:normalize=0:duration=first,"
            f"alimiter=limit=0.89:level=false[a]"
        )
    else:
        graph = (f"[1:a]aresample=48000,aformat=channel_layouts=stereo,volume={needle_gain:.2f}dB,"
                 f"alimiter=limit=0.89:level=false[a]")
    cmd += ["-filter_complex", graph, "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-t", f"{duration:.3f}", "-movflags", "+faststart", out_path]
    done = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if done.returncode != 0 or not os.path.isfile(out_path):
        raise RuntimeError("adding the sound failed: " + done.stderr.strip()[-800:])
    return out_path
