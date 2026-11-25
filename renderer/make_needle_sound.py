"""
make_needle_sound.py - synthesise the sewing-machine sound for the save-the-date animation.

The needle pierces once every 4 frames (30 fps) over frames 1-225, then the rig lifts away
(frames 225-255). That timing is the same for every invitation, so one track fits them all.
Each stitch: a short, mid-pitched click of the needle through the card (modelled on the reference
reel's needle: ~3 ms long, centred around 4 kHz), slightly uneven like a hand-guided needle, with
about a third of the strokes passing silently; one small click when the needle lifts away.

Pure Python (no numpy), so it runs anywhere:  python3 make_needle_sound.py needle.wav
"""

import math
import random
import struct
import sys
import wave

RATE = 48000
FPS = 30
DURATION = 345 / FPS          # 11.5 s, the whole animation
STITCH_END_FRAME = 225
LIFT_END_FRAME = 255
FRAMES_PER_STITCH = 4


def t_of(frame):
    return (frame - 1) / FPS


def needle_down_times():
    """The needle is lowest when cos(2*pi*(f-1)/4) = -1, i.e. on frames 3, 7, 11, ..."""
    return [t_of(f) for f in range(1, STITCH_END_FRAME + 1)
            if (f - 1) % FRAMES_PER_STITCH == FRAMES_PER_STITCH // 2]


def build(seed=435):
    rng = random.Random(seed)
    n = int(DURATION * RATE)
    left = [0.0] * n
    right = [0.0] * n

    def add(t0, length, fn, gain_l=1.0, gain_r=1.0):
        i0 = int(t0 * RATE)
        for k in range(int(length * RATE)):
            i = i0 + k
            if 0 <= i < n:
                v = fn(k / RATE)
                left[i] += v * gain_l
                right[i] += v * gain_r

    def burst(tau, color):
        """Decaying noise burst; color < 1 smooths it (darker), 1 = bright click."""
        state = [0.0]

        def fn(t):
            x = rng.uniform(-1.0, 1.0)
            state[0] = state[0] + color * (x - state[0])
            return state[0] * math.exp(-t / tau)
        return fn

    # --- per stitch: a short, mid-pitched needle click (matched to the reference reel:
    # ~2.7 ms decay, energy centred around 4 kHz, mostly 1-3 kHz), slightly uneven ----------
    def click(scale, tilt):
        """A metal needle through card: a few damped resonances plus a grain of noise."""
        modes = [(2050.0 * tilt, 0.55), (3200.0 * tilt, 0.38), (4900.0 * tilt, 0.26), (7400.0, 0.09)]
        phases = [rng.uniform(0, 2 * math.pi) for _ in modes]
        grain = burst(0.0011, 0.55)

        def fn(t):
            ring = sum(a * math.sin(2 * math.pi * f * t + ph) for (f, a), ph in zip(modes, phases))
            return scale * (ring * math.exp(-t / 0.0011) + 0.35 * grain(t))
        return fn

    skipped = False
    for k, td in enumerate(needle_down_times()):
        # about a third of the strokes pass without an audible click (never two in a row), so
        # the rhythm is ~5 clicks/s and uneven, like the reference, yet each click is on a stroke
        if k > 0 and not skipped and rng.random() < 0.32:
            skipped = True
            continue
        skipped = False
        jitter = rng.uniform(-0.006, 0.006)
        pan = 0.10 * math.sin(k * 0.7)
        amp = rng.uniform(0.65, 1.0)
        add(td + jitter, 0.014, click(amp, rng.uniform(0.92, 1.08)), 0.5 - pan, 0.5 + pan)

    # --- the needle lifts away: one small click, no motor, no whoosh ---------------------
    add(t_of(STITCH_END_FRAME + 1), 0.02, burst(0.003, 0.8), 0.12, 0.11)

    # --- a little room: two short reflections per side ------------------------------------
    for buf, delays in ((left, (0.011, 0.023)), (right, (0.013, 0.029))):
        src = buf[:]
        for d, g in zip(delays, (0.18, 0.10)):
            off = int(d * RATE)
            for i in range(off, n):
                buf[i] += src[i - off] * g

    peak = max(max(abs(v) for v in left), max(abs(v) for v in right)) or 1.0
    scale = 0.7 / peak                                       # -3 dBFS peak; loudness set in the mix
    return [v * scale for v in left], [v * scale for v in right]


def write_wav(path, left, right):
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = bytearray()
        for a, b in zip(left, right):
            frames += struct.pack("<hh", int(max(-1, min(1, a)) * 32767), int(max(-1, min(1, b)) * 32767))
        w.writeframes(bytes(frames))


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "needle.wav"
    write_wav(out, *build())
    print(f"wrote {out} ({DURATION:.1f} s, {len(needle_down_times())} stitches)")
