"""Record every line the games say as small MP3s in learn/audio/, with a free voice that runs on this Mac
(Kokoro-82M, Apache-2.0, https://github.com/hexgrad/kokoro). No internet voice, no cost, and it plays the
same on every tablet. Only new lines are recorded; lines no longer used are removed.

Run from the project root:  .venv-tts/bin/python learn/tools/make_voice.py
Setup (once): uv venv .venv-tts --python 3.12 && uv pip install --python .venv-tts/bin/python kokoro soundfile
              + the spaCy model en_core_web_sm, and `brew install espeak-ng ffmpeg`.
"""
import hashlib
import json
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

    todo = [l for l in wanted if l["key"] not in manifest or not (AUDIO / manifest[l["key"]]).exists()]
    print(f"{len(wanted)} lines, {len(todo)} to record", flush=True)
    if todo:
        from kokoro import KPipeline
        pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
        t0 = time.time()
        for i, l in enumerate(todo, 1):
            audio = np.concatenate([r.audio.numpy() for r in pipe(l["text"], voice=VOICE, speed=SPEED)])
            name = hashlib.sha1(l["key"].encode()).hexdigest()[:10] + ".mp3"
            with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
                sf.write(tmp.name, audio, 24000)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af", TRIM,
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
