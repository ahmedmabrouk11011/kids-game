"""Clean up one recording of all the praise lines (said in order, with a pause between them) and split it into
ColoringBooks/incoming/praise/1.wav, 2.wav ..., then make_voice.py puts them in the games.

Cleaning: the background hum is learned from the quiet before the first word and taken out, the rumble below
the voice is cut, the voice is made a little brighter, and the whole recording is brought to one loudness
(before cutting, so every clip is equally loud and the quiet parts are not pumped up).

    .venv-tts/bin/python learn/tools/split_praise.py path/to/recording.m4a [none|light|strong]

Cleaning levels: none = only the loudness, light = also a gentle hum removal, strong = also EQ, compressor
and gate (default; the user liked it best on 2026-11-03).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

LEARN = Path(__file__).resolve().parent.parent
OUT = LEARN.parent / "incoming/praise"


LOUD = "loudnorm=I=-16:TP=-1.5:LRA=7"


def clean_chain(quiet, level="light"):
    """ffmpeg filters; quiet = (start, end) of a stretch with no speech to learn the noise from."""
    learn = f"asendcmd=c='{quiet[0]:.2f} afftdn sn start; {quiet[1]:.2f} afftdn sn stop'," if quiet else ""
    if level == "none":
        return "highpass=f=70," + LOUD
    if level == "light":
        return "highpass=f=90," + learn + "afftdn=nr=10:nf=-60," + LOUD
    return ("highpass=f=110,lowpass=f=9000," + learn + "afftdn=nr=24:nf=-55:tn=1,"
            "equalizer=f=300:t=q:w=1:g=-3,equalizer=f=3500:t=q:w=1.2:g=4,"
            "acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=2,"
            "agate=threshold=0.015:ratio=3:attack=3:release=150," + LOUD)


def speech_pieces(src, want, dur, texts=None):
    # Find the pauses; try stricter settings until the speech falls into exactly `want` pieces.
    for noise, gap in ((-35, 0.6), (-30, 0.5), (-40, 0.8), (-28, 0.4), (-45, 1.0)):
        log = subprocess.run(["ffmpeg", "-i", src, "-af", f"silencedetect=n={noise}dB:d={gap}", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
        starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
        ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
        pieces, t = [], 0.0
        for s, e in zip(starts, ends + [dur]):
            if s - t > 0.25:
                pieces.append((t, s))
            t = e
        if dur - t > 0.25:
            pieces.append((t, dur))
        # The Enter key that starts and stops the recording clicks: drop sounds in the first 0.6 s and last 0.4 s.
        pieces = [(a, b) for a, b in pieces if b > 0.6 and a < dur - 0.4]
        pieces = [(max(a, 0.6), min(b, dur - 0.4)) for a, b in pieces]
        if len(pieces) == want:
            return pieces
        if len(pieces) == want - 1:
            return split_longest(src, pieces, texts)
    return pieces


def split_longest(src, pieces, texts=None):
    """Two lines said without a pause: cut the longest piece at its quietest 40 ms near where the first line
    should end (by its share of the letters of the two lines; شطور + برافو برافو برافو -> about a quarter)."""
    import numpy as np
    k = max(range(len(pieces)), key=lambda i: pieces[i][1] - pieces[i][0])
    a, b = pieces[k]
    sr = 8000
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", src, "-ac", "1",
                          "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(float)
    win = int(0.04 * sr)
    lo, hi = int(0.25 * sr), len(x) - int(0.25 * sr) - win
    if texts and k + 1 < len(texts):
        first, second = (len(t.replace(" ", "")) for t in texts[k:k + 2])
        mid = len(x) * first / (first + second)
        lo, hi = max(lo, int(mid - 0.18 * len(x))), min(hi, int(mid + 0.18 * len(x)))
    energy = [np.mean(x[i:i + win] ** 2) for i in range(lo, hi, win // 2)]
    if not energy:
        return pieces
    cut = a + (lo + int(np.argmin(energy)) * win / 2 + win / 2) / sr
    return pieces[:k] + [(a, cut), (cut, b)] + pieces[k + 1:]


def main(src, level="strong"):
    lines = [l for l in json.loads(subprocess.run(["node", str(LEARN / "tools/list_lines.mjs")], capture_output=True,
                                                  text=True, check=True).stdout) if l["boy"]]
    want = len(lines)
    duration = lambda f: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",  # noqa: E731
                                               "csv=p=0", f], capture_output=True, text=True, check=True).stdout)
    raw = speech_pieces(src, want, duration(src))
    # Learn the noise between the Enter click and the first word.
    quiet = (0.65, raw[0][0] - 0.1) if raw and raw[0][0] - 0.75 >= 0.25 else None
    OUT.mkdir(parents=True, exist_ok=True)

    def render(lvl):
        out = str(OUT / f"clean-{lvl}.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", clean_chain(quiet, lvl), "-ac", "1", "-ar", "48000",
                        out], check=True)
        return out

    # Find the cuts on the strongest cleaning (clearest pauses), then cut the chosen level at the same times.
    strong = render("strong")
    pieces = speech_pieces(strong, want, duration(strong), [l["text"] for l in lines])
    src = strong if level == "strong" else render(level)
    if len(pieces) != want:
        sys.exit(f"Found {len(pieces)} phrases, expected {want}. Record again with longer pauses.")
    for old in OUT.glob("[0-9]*.*"):
        old.unlink()
    for n, ((a, b), l) in enumerate(zip(pieces, lines), 1):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ss", f"{max(0, a - 0.1):.2f}", "-to", f"{b + 0.3:.2f}",
                        "-ac", "1", str(OUT / f"{n}.wav")], check=True)
        print(f"{n}.wav  {b - a:.1f}s  {l['text']}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
