// Reads one handwritten digit (0-9) from pencil strokes. It is the $P point-cloud recognizer
// (Vatavu, Anthony & Wobbrock, 2012): stroke order and direction don't matter, which suits small kids.
// The templates are the tracing paths from digits.js plus common other ways to write each digit.
// Pure code (no page access), so tools can test it in Node.
import { DIGITS } from './digits.js';

const N = 32; // points per cloud

// Other common ways to write each digit (same 100 x 140 box as digits.js).
const VARIANTS = {
  0: ['M50 10 C80 10 88 50 88 72 C88 102 72 132 50 132 C28 132 12 102 12 72 C12 42 24 10 50 10',
    'M60 12 C30 6 20 50 22 76 C24 110 40 132 56 130 C78 128 86 96 84 66 C82 36 74 14 60 12'],
  1: ['M52 10 L52 132', 'M48 12 L56 132'],
  2: ['M18 36 C24 6 82 4 82 40 C82 70 30 100 16 130 C40 124 70 126 90 132',
    'M14 40 C20 10 80 6 84 38 C86 60 40 96 14 130 L88 130'],
  3: ['M16 20 L84 12 L48 60 C76 58 92 80 88 102 C84 128 40 136 14 116',
    'M20 22 C40 4 80 10 80 34 C80 54 56 64 44 66 M44 66 C70 66 88 80 88 102 C88 126 52 138 16 118'],
  4: ['M20 10 L14 80 L90 80 M68 30 L68 132', 'M62 10 L14 92 L90 92 L66 92 L66 132 M66 52 L66 92'],
  5: ['M28 10 L22 62 C40 50 86 52 88 92 C88 126 50 136 16 116 M30 12 L82 12',
    'M80 12 L28 12 L24 60 C50 44 90 62 86 96 C82 128 40 134 14 114'],
  6: ['M70 10 C40 30 18 60 18 92 C18 120 36 132 52 132 C72 132 86 116 86 96 C86 76 70 64 52 64 C36 64 22 74 18 92',
    'M76 8 L24 84 C14 110 30 132 52 132 C76 132 88 112 84 92 C80 70 50 64 30 80'],
  7: ['M12 12 L88 12 L40 132 M36 72 L78 72', 'M14 20 L86 12 C70 50 56 90 46 132'],
  8: ['M50 10 C30 10 26 64 50 66 C74 64 70 10 50 10 M50 66 C20 68 16 130 50 130 C84 130 80 68 50 66',
    'M78 26 C70 4 24 6 24 34 C24 60 80 70 82 100 C84 128 50 134 34 126 C10 112 22 80 50 66 C70 56 84 40 78 26'],
  9: ['M84 38 C84 18 68 8 50 8 C28 8 16 24 16 40 C16 60 32 70 50 70 C68 70 84 58 84 38 C84 80 70 120 40 132',
    'M80 20 C60 0 18 14 20 42 C22 66 66 66 82 30 L82 30 L76 132'],
};

// --- tiny SVG path reader (M, L, C only: that is all our digit paths use) ---
function pathToStrokes(d, dx = 0) {
  const tok = d.match(/[MLC]|-?\d*\.?\d+/g);
  const strokes = [];
  let cur = null;
  let x = 0;
  let y = 0;
  for (let i = 0; i < tok.length;) {
    const cmd = tok[i++];
    const num = () => parseFloat(tok[i++]);
    if (cmd === 'M') { x = num() + dx; y = num(); cur = [{ x, y }]; strokes.push(cur); }
    else if (cmd === 'L') { x = num() + dx; y = num(); cur.push({ x, y }); }
    else if (cmd === 'C') {
      const [x1, y1, x2, y2, x3, y3] = [num() + dx, num(), num() + dx, num(), num() + dx, num()];
      for (let t = 0.1; t <= 1.0001; t += 0.1) {
        const u = 1 - t;
        cur.push({
          x: u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          y: u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        });
      }
      x = x3; y = y3;
    }
  }
  return strokes;
}

// --- $P ---
const toPoints = (strokes) => strokes.flatMap((s, id) => s.map((p) => ({ x: p.x, y: p.y, id })));

function pathLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

function resample(pts, n) {
  const I = pathLength(pts) / (n - 1);
  if (!I) return Array.from({ length: n }, () => ({ ...pts[0] }));
  let D = 0;
  const src = pts.map((p) => ({ ...p }));
  const out = [{ ...src[0] }];
  for (let i = 1; i < src.length; i++) {
    if (src[i].id !== src[i - 1].id) continue;
    const d = Math.hypot(src[i].x - src[i - 1].x, src[i].y - src[i - 1].y);
    if (D + d >= I && d > 0) {
      const t = (I - D) / d;
      const q = { x: src[i - 1].x + t * (src[i].x - src[i - 1].x), y: src[i - 1].y + t * (src[i].y - src[i - 1].y), id: src[i].id };
      out.push(q);
      src.splice(i, 0, q);
      D = 0;
    } else D += d;
  }
  while (out.length < n) out.push({ ...src[src.length - 1] });
  return out.slice(0, n);
}

function normalize(pts) {
  pts = resample(pts, N);
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const p of pts) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  pts = pts.map((p) => ({ x: (p.x - minX) / size, y: (p.y - minY) / size, id: p.id }));
  const cx = pts.reduce((s, p) => s + p.x, 0) / N;
  const cy = pts.reduce((s, p) => s + p.y, 0) / N;
  return pts.map((p) => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}

function cloudDistance(a, b, start) {
  const matched = new Array(N).fill(false);
  let sum = 0;
  let i = start;
  do {
    let min = Infinity;
    let index = -1;
    for (let j = 0; j < N; j++) {
      if (matched[j]) continue;
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < min) { min = d; index = j; }
    }
    matched[index] = true;
    sum += (1 - ((i - start + N) % N) / N) * min;
    i = (i + 1) % N;
  } while (i !== start);
  return sum;
}

function greedyMatch(a, b) {
  const step = Math.floor(Math.sqrt(N));
  let min = Infinity;
  for (let i = 0; i < N; i += step) min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  return min;
}

const TEMPLATES = [];
for (let n = 0; n <= 9; n++) {
  const paths = n === 0 ? [] : DIGITS[n].strokes.slice();
  const shapes = [paths.length ? paths.join(' ') : null, ...VARIANTS[n]].filter(Boolean);
  for (const d of shapes) TEMPLATES.push({ digit: n, cloud: normalize(toPoints(pathToStrokes(d))) });
}
// 0 from the "10" tracing path (its second stroke), shifted back into the box.
TEMPLATES.push({ digit: 0, cloud: normalize(toPoints(pathToStrokes(DIGITS[10].strokes[1], -70))) });

// strokes: [[{x, y}, ...], ...] in any units (y down). Returns the best digit and the scores of all digits.
// prefer: the expected answer wins when it is almost as close as the best match (kind to small hands).
export function readDigit(strokes, prefer = null) {
  const pts = toPoints(strokes.filter((s) => s.length));
  if (pts.length < 2) return null;
  const cloud = normalize(pts);
  const best = new Map();
  for (const t of TEMPLATES) {
    const d = greedyMatch(cloud, t.cloud);
    if (!best.has(t.digit) || d < best.get(t.digit)) best.set(t.digit, d);
  }
  const ranked = [...best].sort((a, b) => a[1] - b[1]);
  let digit = ranked[0][0];
  if (prefer != null && prefer !== digit && best.get(prefer) <= ranked[0][1] * 1.12) digit = prefer;
  return { digit, ranked };
}

export { pathToStrokes, TEMPLATES };
