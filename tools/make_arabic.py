"""Pre-shape every Arabic text the games draw into js/ar-glyphs.js, so each letter and haraka is its own path.

Browsers paint a haraka in the colour of its letter, and we want fatha blue, kasra green, damma orange and
sukun gold, as in Youssef's printed book. HarfBuzz shapes the text here once (font: Noto Naskh Arabic, OFL,
tools/fonts/), and js/arglyph.js draws it as SVG in the page.

Run from the project root after changing js/arabic.js:  .venv/bin/python learn/tools/make_arabic.py
Needs: pip install uharfbuzz fonttools (in the project's .venv), and node.
"""
import json
import subprocess
import unicodedata
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen

LEARN = Path(__file__).resolve().parent.parent
TATWEEL = "\u0640"
HARAKAT = "\u064e\u0650\u064f\u0652"
FONT = LEARN / "tools/fonts/NotoNaskhArabic.ttf"


def main():
    texts = json.loads(subprocess.run(["node", str(LEARN / "tools/list_arabic.mjs")],
                                      capture_output=True, text=True, check=True).stdout)
    face = hb.Face(hb.Blob.from_file_path(str(FONT)))
    font = hb.Font(face)
    font.set_variations({"wght": 600})
    outlines, shaped = {}, {}
    top, bottom = 0, 0
    for text in sorted(texts):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        buf.cluster_level = hb.BufferClusterLevel.MONOTONE_CHARACTERS
        hb.shape(font, buf, {})
        pen_x, glyphs, t_top, t_bot = 0, [], 0, 0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            gid, ch = info.codepoint, text[info.cluster]
            if gid not in outlines:
                pen = SVGPathPen(None)
                font.draw_glyph_with_pen(gid, pen)
                outlines[gid] = pen.getCommands()
            if outlines[gid]:
                ext = font.get_glyph_extents(gid)
                t_top = max(t_top, pos.y_offset + ext.y_bearing)
                t_bot = min(t_bot, pos.y_offset + ext.y_bearing + ext.height)
                glyphs.append([gid, pen_x + pos.x_offset, pos.y_offset, info.cluster,
                               1 if unicodedata.category(ch) == "Mn" else 0])
            pen_x += pos.x_advance
        mark_only = len(text) == 2 and text[0] == TATWEEL and text[1] in HARAKAT
        if mark_only:
            # A haraka on its own (tatweel + mark): keep only the mark, moved to x = 0 and as wide as it is.
            gid, x, y, i, m = next(g for g in glyphs if g[4])
            ext = font.get_glyph_extents(gid)
            glyphs = [[gid, -ext.x_bearing, y, i, m]]
            pen_x = ext.width
            t_top, t_bot = y + ext.y_bearing, y + ext.y_bearing + ext.height
        shaped[text] = [pen_x, glyphs, t_top, t_bot]
        if not mark_only:
            top, bottom = max(top, t_top), min(bottom, t_bot)
    out = ("// Made by tools/make_arabic.py from js/arabic.js. Do not edit.\n"
           f"export const ASC = {top + 40};\nexport const DESC = {-bottom + 40};\n"
           f"export const PATHS = {json.dumps({str(k): v for k, v in outlines.items() if v}, separators=(',', ':'))};\n"
           f"export const TEXTS = {json.dumps(shaped, ensure_ascii=False, separators=(',', ':'))};\n")
    (LEARN / "js/ar-glyphs.js").write_text(out)
    print(f"{len(shaped)} texts, {len(outlines)} glyphs, {len(out) / 1000:.0f} kB, asc {top} desc {-bottom}")


if __name__ == "__main__":
    main()
