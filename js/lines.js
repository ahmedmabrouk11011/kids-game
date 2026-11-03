// Every sentence the games say lives here. tools/make_voice.py records each one ahead of time with a free,
// natural voice (Kokoro, on the Mac) into audio/, so the voice works on every tablet. A line without a
// recording is read by the device's own voice instead, if it has one.
// After changing a line: .venv-tts/bin/python learn/tools/make_voice.py (from the project root).
import { ITEMS, HEROES, itemName } from './items.js';
import * as G from './mathgen.js';
import { arabicLines } from './arabic.js';

// Clip lookup key: "That's 7." and "that's 7" share one recording. Arabic letters and harakat count too (بَ ≠ بِ).
export const voiceKey = (text) => text.toLowerCase().replace(/[^a-z0-9\u0621-\u0652]+/g, ' ').trim();

export const NAMES = ['Omar', 'Youssef'];
export const HERO_NAMES = ['Shadow', 'Sonic'];
export const SHAPES = ['star', 'fish', 'rocket', 'heart', 'tree'];

const op = (o) => (o === '+' ? 'plus' : 'minus');
const said = (tokens) => tokens.map((t) => (t === '+' ? 'plus' : t === '−' ? 'minus' : t === '?' ? 'what' : t)).join(' ');

export const L = {
  num: (n) => `${n}!`,
  yes: 'Yes!',
  tryAgain: 'Try again!',
  thenGreen: 'Then press the green button.',
  greats: (name) => ['Great job!', 'Yay! You did it!', 'Super!', `Awesome, ${name}!`, 'Wow! Well done!', 'Fantastic!', 'High five!'],
  hello: (name) => `Hi ${name}! Let's play!`,
  finish: (name, stars) => `You finished the game, ${name}! Here ${stars === 1 ? 'is your star' : `are your ${stars} stars`}!`,
  makes: (a, b, c) => `${a} and ${b} make ${c}!`,

  count: {
    intro: (k) => `Let's count! Tap each ${k.one} and count with me!`,
    prompt: (k) => `Tap each ${k.one} and count!`,
    got: (n, k) => `${n} ${itemName(k, n)}!`,
  },
  howmany: {
    intro: (k) => `How many ${k.many} can you see? Tap the number!`,
    prompt: (k) => `How many ${k.many}?`,
    together: "Let's count together!",
  },
  trace: {
    intro: (n) => `This is ${n}. Watch me first!`,
    watch: (n) => `This is ${n}. Watch!`,
    turnFirst: 'Your turn! Trace it with your pencil, then press the green button.',
    turn: 'Your turn!',
    inkFirst: (n) => `Trace the ${n} with your pencil first!`,
    prompt: (n) => `Trace the number ${n} with your pencil!`,
    dots: 'Almost! Colour the orange dots too!',
    stay: 'Almost! Stay on the number. Try again!',
    yes: (n) => `Yes! That is ${n}!`,
  },
  basket: {
    prompt: (n) => `Put ${n} ${n === 1 ? 'apple' : 'apples'} in the basket!`,
    tapToPut: (n) => `Tap the apples to put ${n} in the basket!`,
    tooMany: (n) => `Oops, too many! We need ${n}.`,
    takeOut: 'Tap an apple in the basket to take it out.',
    more: (n) => `We need more apples! We need ${n}.`,
  },
  pop: {
    intro: (n) => `Pop the balloon with number ${n}!`,
    now: (n) => `Now pop number ${n}!`,
    prompt: (n) => `Pop number ${n}!`,
    thats: (n) => `That's ${n}.`,
    find: (n) => `Find ${n}!`,
    pop: 'Pop!',
  },
  dots: {
    intro: 'Draw from 1 to 10 with your pencil! Start at the yellow dot.',
    prompt: 'Connect the dots! Start at 1.',
    made: (shape) => `You made a ${shape}!`,
  },
  roads: {
    intro: (hero) => `Help ${hero} follow the road with your pencil!`,
    prompt: 'Follow the road with your pencil!',
    off: 'Oops! Stay on the road!',
    made: 'You made it!',
  },
  color: {
    pick: 'Pick a picture to colour!',
    how: 'Tap a space to fill it, or colour with your pencil!',
    done: 'What a beautiful picture!',
  },
  bond: {
    intro: 'This is a number bond. The top number is made of the two bottom numbers.',
    part: (N, k) => `${N} is ${k} and what?`,
    whole: (a, b) => `What do ${a} and ${b} make?`,
    wrongWhole: 'Not quite. Count all the beads!',
    wrongPart: 'Not quite. Count the empty beads!',
    tapAll: 'Tap the beads to count them all!',
    tapEmpty: 'Tap the empty beads to count them!',
    levelUp: 'Level up! Bigger numbers now!',
  },
  split: {
    intro: "Let's split them! Tap one to move it to the other plate. Then press the green button.",
    prompt: (N) => `Find 3 ways to make ${N}!`,
    again: 'You found that one already! Try another way.',
    done: (N) => `You found 3 ways to make ${N}!`,
  },
  pairs: {
    intro: (T) => `Tap two cards that make ${T} together!`,
    prompt: (T) => `Find two numbers that make ${T}!`,
    need: (T) => `We need ${T}!`,
    all: (T) => `You found all the pairs that make ${T}!`,
  },
  balance: {
    intro: 'Make the scale level!',
    question: (p) => { const t = `${said(p.L)} equals ${said(p.R)}?`; return t[0].toUpperCase() + t.slice(1); },
    level: 'Level!',
    notLevel: 'The scale is not level. Try again!',
    look: 'Not quite. Look at the scale!',
  },
  race: {
    go: 'Ready, set, go!',
    question: (q) => (q.makeTen ? `${q.a} plus what makes 10?` : `${q.a} ${op(q.op)} ${q.b}?`),
    answerIs: (n) => `The answer is ${n}.`,
    won: 'You won the race!',
  },
  pen: {
    intro: 'Write the answer with your pencil!',
    oneEach: 'Write one number in each box.',
    fix: 'If I read it wrong, tap the sponge and write it again.',
  },
  train: {
    intro: 'Choo choo! Which number is missing?',
    what: 'What?',
    up: (step) => `Not quite. The numbers go up by ${step}.`,
    down: 'Not quite. The numbers go down by 1.',
  },
  tens: {
    intro: 'A long rod is 10. A small cube is 1. What number is this?',
    prompt: 'What number is this? Count the tens and the ones.',
    wrong: 'Not quite. Count the tens first, then the ones.',
    build: 'Now you build it!',
    make: (n) => `Make ${n} with tens and ones!`,
    tenOnes: 'Ten ones make one ten!',
    tapPlus: 'Tap plus 10 and plus 1!',
    more: 'Not yet! Add more!',
    less: 'Not yet! Take some away!',
    praise: (T, O, n) => `${T} ${T === 1 ? 'ten' : 'tens'} and ${O} ${O === 1 ? 'one' : 'ones'} make ${n}!`,
  },
};

// Every line any game can say (used by tools/list_lines.mjs). Random questions are sampled many times.
export function allLines() {
  const out = new Set();
  const add = (...xs) => xs.flat(Infinity).forEach((x) => typeof x === 'string' && out.add(x));
  const sample = (fn, times = 3000) => { for (let k = 0; k < times; k++) fn(); };

  for (const v of Object.values(L)) {
    if (typeof v === 'string') add(v);
    else if (v && typeof v === 'object') add(Object.values(v));
  }
  for (let n = 0; n <= 100; n++) add(L.num(n));
  for (const name of NAMES) {
    add(L.greats(name), L.hello(name));
    for (let s = 1; s <= 3; s++) add(L.finish(name, s));
  }
  for (const k of [...ITEMS, ...Object.values(HEROES)]) {
    add(L.count.intro(k), L.count.prompt(k), L.howmany.intro(k), L.howmany.prompt(k));
    for (let n = 1; n <= 10; n++) add(L.count.got(n, k));
  }
  for (let n = 1; n <= 10; n++) {
    const t = L.trace; const b = L.basket; const p = L.pop;
    add(t.intro(n), t.watch(n), t.inkFirst(n), t.prompt(n), t.yes(n), b.prompt(n), b.tapToPut(n), b.tooMany(n), b.more(n),
      p.intro(n), p.now(n), p.prompt(n), p.thats(n), p.find(n));
  }
  add(SHAPES.map(L.dots.made), HERO_NAMES.map(L.roads.intro));

  // Bonds in either order (a bond and the 0-10 strip), and any two cards in Make Pairs (smaller first).
  for (let a = 0; a <= 10; a++) for (let b = 0; a + b <= 10; b++) add(L.makes(a, b, a + b));
  for (let N = 3; N <= 10; N++) add(L.split.prompt(N), L.split.done(N));
  for (let i = 0; i < G.BOND_STEPS.length; i++) {
    sample(() => {
      const r = G.bondRound(i);
      add(r.miss === 'w' ? L.bond.whole(r.a, r.b) : L.bond.part(r.N, r.miss === 'a' ? r.b : r.a));
    });
  }
  for (const T of new Set(G.PAIR_TARGETS)) {
    add(L.pairs.intro(T), L.pairs.prompt(T), L.pairs.need(T), L.pairs.all(T));
    sample(() => {
      const cards = G.pairsFor(T).flat();
      for (const x of cards) for (const y of cards) if (x <= y) add(L.makes(x, y, x + y));
    }, 400);
  }
  for (let i = 0; i < 5; i++) sample(() => add(L.balance.question(G.balanceProblem(i))));
  for (let q = 0; q < 10; q++) sample(() => add(L.race.question(G.raceQuestion(q))));
  for (let i = 0; i < 5; i++) sample(() => add(L.race.question(G.penQuestion(i))));
  for (let n = 0; n <= 20; n++) add(L.race.answerIs(n));
  for (const step of [1, 2, 5, 10]) add(L.train.up(step));
  for (let i = 0; i < 5; i++) {
    sample(() => {
      const n = G.tensTarget(i);
      add(L.tens.make(n), L.tens.praise(Math.floor(n / 10), n % 10, n));
    });
  }
  add(arabicLines());
  return [...out];
}
