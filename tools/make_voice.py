"""Record every line the games say as small MP3s in learn/audio/, with a free voice that runs on this Mac
(Kokoro-82M, Apache-2.0, https://github.com/hexgrad/kokoro). Arabic lines (Youssef's harakat games) use the
Mac's built-in Arabic voice Majed (`say`), because Kokoro has no Arabic. No internet voice, no cost, and it
plays the same on every tablet. Only new lines are recorded; lines no longer used are removed.

Run from the project root:  .venv-tts/bin/python learn/tools/make_voice.py
Setup (once): uv venv .venv-tts --python 3.12 && uv pip install --python .venv-tts/bin/python kokoro soundfile
              + the spaCy model en_core_web_sm, and `brew install espeak-ng ffmpeg`.
"""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np
import soundfile as sf

LEARN = Path(__file__).resolve().parent.parent
AUDIO = LEARN / "audio"
VOICE = "af_heart"   # Kokoro's warmest voice
SPEED = 0.92         # a little slower for small kids
AR_VOICE = "Majed"   # macOS Arabic voice
AR_RATE = {"short": 120, "long": 160}   # words per minute: syllables and words slower than sentences
ARABIC = re.compile("[\u0600-\u06ff]")
# Praise lines ("boy" in list_lines.mjs, numbered 1, 2 ... in BOY_LINES order) are said by a real boy:
# drop his recordings in ColoringBooks/incoming/praise/ as 1.m4a, 2.m4a ... (any audio type works).
# A praise line with no recording yet uses the Mac voice, raised in pitch to sound younger.
# tools/split_praise.py cleans a recording (hum, rumble, loudness) before it is cut into these files.
REAL = LEARN.parent / "incoming/praise"
BOY = "aresample=24000,asetrate=33600,aresample=24000,atempo=0.8,"
BOY_RATE = 175


def real_recording(l):
    if not l.get("boy") or not REAL.is_dir():
        return None
    return next((p for p in sorted(REAL.glob(f"{l['boy']}.*")) if p.suffix.lower() != ".txt"), None)
# Cut silence at both ends, keep a tiny tail so clips joined together don't sound rushed.
TRIM = ("silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
        "silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08")


def lines():
    out = subprocess.run(["node", str(LEARN / "tools/list_lines.mjs")], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def main():
    AUDIO.mkdir(exist_ok=True)
    man_path = AUDIO / "manifest.json"
    manifest = json.loads(man_path.read_text()) if man_path.exists() else {}
    wanted = lines()
    keys = {l["key"] for l in wanted}

    # Remove recordings of lines the games no longer say.
    for key in [k for k in manifest if k not in keys]:
        (AUDIO / manifest.pop(key)).unlink(missing_ok=True)

    def clip_name(l):
        real = real_recording(l)
        tag = f"|real{real.stat().st_size}" if real else "|boy" if l.get("boy") else ""
        return hashlib.sha1((l["key"] + tag).encode()).hexdigest()[:10] + ".mp3"

    todo = [l for l in wanted if manifest.get(l["key"]) != clip_name(l) or not (AUDIO / clip_name(l)).exists()]
    print(f"{len(wanted)} lines, {len(todo)} to record", flush=True)
    if todo:
        pipe = None
        t0 = time.time()
        for i, l in enumerate(todo, 1):
            name = clip_name(l)
            if l["key"] in manifest and manifest[l["key"]] != name:
                (AUDIO / manifest[l["key"]]).unlink(missing_ok=True)
            with tempfile.TemporaryDirectory() as tmp:
                src = Path(tmp) / "line.aiff"
                real = real_recording(l)
                if real:
                    src = real
                elif ARABIC.search(l["text"]):
                    rate = BOY_RATE if l.get("boy") else AR_RATE["short" if len(l["text"]) <= 8 else "long"]
                    subprocess.run(["say", "-v", AR_VOICE, "-r", str(rate), "-o", str(src), l["text"]], check=True)
                else:
                    if pipe is None:
                        from kokoro import KPipeline
                        pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
                    audio = np.concatenate([r.audio.numpy() for r in pipe(l["text"], voice=VOICE, speed=SPEED)])
                    src = src.with_suffix(".wav")
                    sf.write(src, audio, 24000)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", (TRIM if real else (BOY if l.get("boy") else "") + TRIM),
                                "-ac", "1", "-ar", "24000", "-b:a", "48k", str(AUDIO / name)], check=True)
            manifest[l["key"]] = name
            if i % 100 == 0 or i == len(todo):
                man_path.write_text(json.dumps(dict(sorted(manifest.items())), indent=0))
                print(f"  {i}/{len(todo)}  {time.time() - t0:.0f}s", flush=True)
    man_path.write_text(json.dumps(dict(sorted(manifest.items())), indent=0))
    size = sum(p.stat().st_size for p in AUDIO.glob("*.mp3"))
    print(f"done: {len(manifest)} clips, {size / 1e6:.1f} MB")


if __name__ == "__main__":
    sys.exit(main())
