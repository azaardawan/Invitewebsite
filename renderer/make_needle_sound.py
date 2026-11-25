"""
make_needle_sound.py - synthesise the sewing-machine sound for the save-the-date animation.

The needle pierces once every 4 frames (30 fps) over frames 1-225, then the rig lifts away
(frames 225-255). That timing is the same for every invitation, so one track fits them all.
Each stitch: a sharp needle tick, the hook's low thunk and the take-up lever's rattle, over a
motor hum that spins up at the start and stops cleanly when the stitching ends (no falling-pitch
wind-down), then one release click as the needle lifts away.

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

    def tone(freqs, tau):
        return lambda t: sum(a * math.sin(2 * math.pi * f * t) for f, a in freqs) * math.exp(-t / tau)

    # --- per stitch ---------------------------------------------------------------------
    for k, td in enumerate(needle_down_times()):
        jitter = rng.uniform(-0.002, 0.002)
        pan = 0.08 * math.sin(k * 0.7)
        add(td + jitter, 0.03, burst(0.0035, 0.9), 0.55 - pan, 0.55 + pan)            # needle tick
        add(td + 0.018 + jitter, 0.09, tone([(165, 0.5), (330, 0.22), (95, 0.3)], 0.022),
            0.45, 0.45)                                                                  # hook thunk
        add(td + 0.066 + jitter, 0.04, burst(0.006, 0.35), 0.18 + pan, 0.18 - pan)     # take-up lever

    # --- motor hum: spins up, runs, and stops cleanly (no falling-pitch wind-down) ------
    t_end = t_of(STITCH_END_FRAME)
    for i in range(n):
        t = i / RATE
        if t > t_end + 0.06:
            break
        up = min(1.0, t / 0.15)
        down = 1.0 if t < t_end else max(0.0, 1.0 - (t - t_end) / 0.06)
        env = up * down
        if env <= 0.0:
            continue
        f0 = 120.0                                          # steady pitch to the end
        phase = 2 * math.pi * f0 * t
        hum = (0.10 * math.sin(phase) + 0.05 * math.sin(2 * phase + 0.3)
               + 0.03 * math.sin(3 * phase + 1.1) + 0.015 * math.sin(5 * phase + 0.4))
        whir = 0.018 * rng.uniform(-1.0, 1.0)
        v = (hum + whir) * env * (0.85 + 0.15 * math.sin(2 * math.pi * 7.5 * t))  # stitch rhythm
        left[i] += v
        right[i] += v * 0.96

    # --- the needle and presser foot lift away --------------------------------------------
    t_lift = t_of(STITCH_END_FRAME + 1)
    add(t_lift, 0.05, burst(0.008, 0.6), 0.35, 0.3)                                   # release click

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
