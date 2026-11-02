// The questions for Youssef's games. Pure functions (no page access), so tools/list_lines.mjs can run
// them many times in Node and list every sentence a game can say for the voice recordings.
import { randInt, pick, shuffle } from './util.js';

// Number Bond: hints first, then a missing whole, then bonds of 10 and bonds with 0.
export const BOND_LEVELS = [
  { whole: [5, 6], miss: 'part', beads: true },
  { whole: [6, 8], miss: 'part', beads: true },
  { whole: [7, 9], miss: 'whole', beads: false },
  { whole: [10, 10], miss: 'part', beads: false },
  { whole: [8, 10], miss: 'part', beads: false, zero: true },
];
export function bondRound(i) {
  const lv = BOND_LEVELS[i];
  const N = randInt(...lv.whole);
  const a = lv.zero && Math.random() < 0.4 ? pick([0, N]) : randInt(1, N - 1);
  return { lv, N, a, b: N - a, miss: lv.miss === 'whole' ? 'w' : pick(['a', 'b']) };
}

// Make Pairs: 4 pairs of cards for each target.
export const PAIR_TARGETS = [7, 10, 8, 10, 20];
export function pairsFor(T) {
  const lows = T === 20 ? [5, 6, 7, 8, 9, 10] : [...Array(Math.floor(T / 2) + 1).keys()];
  return shuffle(lows).slice(0, 4).map((a) => [a, T - a]);
}

// Balance: a+?=c, ?+b=c, 10=a+?, a−b=?, a+b=c+?
export function balanceProblem(i) {
  if (i === 0) { const c = randInt(5, 9); const a = randInt(1, c - 1); return { L: [a, '+', '?'], R: [c], ans: c - a }; }
  if (i === 1) { const c = randInt(6, 10); const b = randInt(1, c - 1); return { L: ['?', '+', b], R: [c], ans: c - b }; }
  if (i === 2) { const a = randInt(1, 9); return { L: [10], R: [a, '+', '?'], ans: 10 - a }; }
  if (i === 3) { const a = randInt(6, 10); const b = randInt(1, a - 1); return { L: [a, '−', b], R: ['?'], ans: a - b }; }
  const a = randInt(1, 5); const b = randInt(1, 5); const c = randInt(1, a + b - 1);
  return { L: [a, '+', b], R: [c, '+', '?'], ans: a + b - c };
}

// Math Race (10 steps): + and − within 10, teens, make 10, doubles.
export function raceQuestion(q) {
  if (q < 3) { const a = randInt(1, 8); const b = randInt(1, 10 - a); return { a, op: '+', b, ans: a + b }; }
  if (q < 5) { const a = randInt(4, 10); const b = randInt(1, a - 1); return { a, op: '−', b, ans: a - b }; }
  if (q < 7) { const a = pick([10, 11, 12, 13, 14]); const b = randInt(1, Math.min(9, 19 - a)); return { a, op: '+', b, ans: a + b }; }
  if (q === 7) { const a = randInt(13, 19); const b = randInt(1, a - 10); return { a, op: '−', b, ans: a - b }; }
  if (q === 8) { const a = randInt(1, 9); return { a, op: '+', b: '?', ans: 10 - a, makeTen: true }; }
  const a = randInt(3, 9);
  return { a, op: '+', b: a, ans: a + a };
}

// Pen Math (5 rounds, written answers): single digits first, then two digits.
export function penQuestion(i) {
  if (i === 0) { const a = randInt(1, 6); const b = randInt(1, 9 - a); return { a, op: '+', b, ans: a + b }; }
  if (i === 1) { const a = randInt(5, 9); const b = randInt(1, a - 1); return { a, op: '−', b, ans: a - b }; }
  if (i === 2) { const a = randInt(1, 9); return { a, op: '+', b: '?', ans: 10 - a, makeTen: true }; }
  if (i === 3) { const b = randInt(1, 9); return { a: 10, op: '+', b, ans: 10 + b }; }
  const a = randInt(5, 9);
  return { a, op: '+', b: a, ans: a + a };
}

// Number Train: by 1s, across a ten, by 10s, by 2s or 5s, then to 100 or backwards.
export function trainSequence(i) {
  const run = (start, step, missIdx) => ({ nums: [...Array(5)].map((_, k) => start + k * step), missIdx, step });
  if (i === 0) return run(randInt(11, 25), 1, randInt(2, 3));
  if (i === 1) { const ten = randInt(3, 9) * 10; const start = ten - randInt(2, 3); return run(start, 1, ten - start); }
  if (i === 2) return run(randInt(1, 5) * 10, 10, randInt(1, 4));
  if (i === 3) { const step = pick([2, 5]); return run(step * randInt(1, 4), step, randInt(1, 4)); }
  return pick([
    () => run(96, 1, randInt(3, 4)),
    () => run(60, 10, 4),
    () => run(randInt(30, 90), -1, randInt(1, 3)),
  ])();
}

// Tens & Ones: read 11-19, up to 49, whole tens; then build up to 59 and up to 99.
export function tensTarget(i) {
  if (i === 0) return 10 + randInt(1, 9);
  if (i === 1) return randInt(2, 4) * 10 + randInt(1, 9);
  if (i === 2) return randInt(5, 9) * 10;
  if (i === 3) return randInt(2, 5) * 10 + randInt(1, 9);
  return randInt(6, 9) * 10 + randInt(1, 9);
}
