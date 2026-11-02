// The questions for Youssef's games. Pure functions (no page access), so tools/list_lines.mjs can run
// them many times in Node and list every sentence a game can say for the voice recordings.
import { randInt, pick, shuffle, clamp } from './util.js';

// Number Bond, gentle and adaptive (the game moves him up and down these steps and remembers where he is).
// Real objects → pictures → numbers: small wholes first, the whole (count all) before a missing part,
// beads he can tap to count, and 3 answer buttons before the number pad.
export const BOND_STEPS = [
  { whole: [3, 3], miss: 'whole', choices: true, beads: true },
  { whole: [3, 3], miss: 'part', choices: true, beads: true },
  { whole: [4, 4], miss: 'whole', choices: true, beads: true },
  { whole: [4, 4], miss: 'part', choices: true, beads: true },
  { whole: [5, 5], miss: 'whole', choices: true, beads: true },
  { whole: [5, 5], miss: 'part', choices: true, beads: true },
  { whole: [6, 6], miss: 'part', choices: true, beads: true },
  { whole: [7, 7], miss: 'part', choices: false, beads: true },
  { whole: [8, 8], miss: 'part', choices: false, beads: false },
  { whole: [9, 9], miss: 'part', choices: false, beads: false },
  { whole: [10, 10], miss: 'part', choices: false, beads: false },
  { whole: [5, 10], miss: 'mix', choices: false, beads: false, zero: true },
];
export function bondRound(level) {
  const st = BOND_STEPS[clamp(level, 0, BOND_STEPS.length - 1)];
  const N = randInt(...st.whole);
  const a = st.zero && Math.random() < 0.3 ? pick([0, N]) : randInt(1, N - 1);
  const miss = st.miss === 'whole' ? 'w' : st.miss === 'mix' ? pick(['w', 'a', 'b']) : pick(['a', 'b']);
  return { st, N, a, b: N - a, miss };
}
// 3 different answer buttons close to the answer, all within lo..hi.
export function bondChoices(answer, lo, hi) {
  const near = shuffle([-2, -1, 1, 2].map((d) => answer + d).filter((v) => v >= lo && v <= hi));
  const far = shuffle([...Array(hi - lo + 1).keys()].map((k) => lo + k).filter((v) => v !== answer && !near.includes(v)));
  return shuffle([answer, ...[...near, ...far].slice(0, 2)]);
}

// Split It: the wholes to split, from his Number Bond level (a little bigger every 2 rounds).
export function splitWhole(level, i) {
  const base = Math.min(BOND_STEPS[clamp(level, 0, BOND_STEPS.length - 1)].whole[0], 8);
  return Math.min(10, base + Math.floor(i / 2));
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
