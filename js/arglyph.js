// Draws pre-shaped Arabic (js/ar-glyphs.js) as an SVG, one <path> per glyph, so a haraka can have its own colour.
//   arText('قَلَمْ')                      letters dark, each haraka in its colour (CSS: .ar .m.fatha ...)
//   arText(w, { hl: [0], hide: [1] })   letter at char 0 highlighted, the haraka at char 1 left out
// Size it with CSS height. The box hugs the text, so a short letter fills its card;
// { line: true } uses one shared height instead, for texts that must sit on the same baseline.
import { ASC, DESC, PATHS, TEXTS } from './ar-glyphs.js';
import { KIND_OF } from './arabic.js';

const NS = 'http://www.w3.org/2000/svg';
const PAD = 60;

export function arText(text, { hl = [], hide = [], cls = '', line = false } = {}) {
  const shaped = TEXTS[text];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', `ar ${cls}`.trim());
  if (!shaped) {
    console.warn('Arabic text not pre-shaped (run tools/make_arabic.py):', text);
    return svg;
  }
  const [width, glyphs, top, bottom] = shaped;
  const markOnly = glyphs.every((g) => g[4]);   // a haraka on its own fills the whole box
  const pad = markOnly ? 12 : PAD;
  const [y0, y1] = line ? [ASC, DESC] : markOnly ? [top + pad, -bottom + pad] : [Math.max(top, 520) + pad, Math.max(-bottom, 120) + pad];
  svg.setAttribute('viewBox', `${-pad} ${-y0} ${width + 2 * pad} ${y0 + y1}`);
  for (const [gid, x, y, i, mark] of glyphs) {
    if (hide.includes(i)) continue;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', PATHS[gid]);
    p.setAttribute('transform', `translate(${x} ${-y}) scale(1 -1)`);
    const kind = mark ? KIND_OF[text[i]] : '';
    p.setAttribute('class', mark ? `m ${kind || ''}` : hl.includes(i) ? 'l hl' : 'l');
    p.dataset.i = i;
    svg.append(p);
  }
  return svg;
}
