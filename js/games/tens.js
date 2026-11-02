// Youssef 6. Tens & Ones: read a number made of ten-rods and one-cubes (type it),
// then build numbers yourself with +10 and +1 (ten loose cubes snap into a rod).
import { h, randInt, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { keypad, qaLayout } from '../keypad.js';

const rod = () => h('div', { class: 'rod' }, [...Array(10)].map(() => h('i')));
const cube = () => h('div', { class: 'cube' }, h('i'));

function target(i) {
  if (i === 0) return 10 + randInt(1, 9);
  if (i === 1) return randInt(2, 4) * 10 + randInt(1, 9);
  if (i === 2) return randInt(5, 9) * 10;
  if (i === 3) return randInt(2, 5) * 10 + randInt(1, 9);
  return randInt(6, 9) * 10 + randInt(1, 9);
}

export default {
  id: 'tens',
  title: 'Tens & Ones',
  emoji: '🧱',
  color: '#00c2a8',
  create(api) {
    function round(i) {
      const n = target(i);
      const T = Math.floor(n / 10);
      const O = n % 10;
      const praise = `${T} ${T === 1 ? 'ten' : 'tens'} and ${O} ${O === 1 ? 'one' : 'ones'} make ${n}! ${api.great()}`;
      if (i < 3) readRound(i, n, T, O, praise);
      else buildRound(i, n, praise);
    }

    // Read: count the blocks, type the number.
    function readRound(i, n, T, O, praise) {
      const slot = h('span', { class: 'slot' }, '?');
      const blocks = h('div', { class: 'blocks' },
        h('div', { class: 'rods' }, [...Array(T)].map(rod)),
        h('div', { class: 'cubes' }, [...Array(O)].map(cube)));
      const pad = keypad({ slot, maxLen: 3, onSubmit: check });
      qaLayout(api.stage, h('div', { class: 'tens-wrap' }, blocks, h('div', { class: 'big-eq' }, slot)), pad.el);

      function check(v) {
        if (v === n) {
          pad.lock();
          slot.classList.add('right');
          sfx.ding();
          const r = blocks.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 60);
          setTimeout(() => api.win({ text: String(n), praise }), 500);
          return;
        }
        api.mistake();
        sfx.boing();
        pad.wrong();
        api.say(`Not quite. Count the tens first: 10, 20, 30... then the ones.`);
      }

      const prompt = 'What number is this? Count the tens and the ones.';
      api.setPrompt(prompt);
      api.say(i === 0 ? 'A long rod is ten. A small cube is one. What number is this?' : prompt);
    }

    // Build: make the number with +10 and +1. Tap a block to take it away.
    function buildRound(i, n, praise) {
      let t = 0;
      let o = 0;
      let locked = false;
      const rods = h('div', { class: 'rods' });
      const cubes = h('div', { class: 'cubes' });
      const addTen = h('button', { class: 'add-btn ten' }, '+10');
      const addOne = h('button', { class: 'add-btn one' }, '+1');
      const go = h('button', { class: 'big-btn go', 'aria-label': 'Check' }, '✔');
      api.stage.replaceChildren(h('div', { class: 'qa build' },
        h('div', { class: 'problem' }, h('div', { class: 'tens-wrap' },
          h('div', { class: 'target-card' }, h('span', { class: 'small' }, 'Make'), String(n)),
          h('div', { class: 'blocks build-area' }, rods, cubes))),
        h('div', { class: 'pad-col build-tools' }, addTen, addOne, go)));

      function addRod() {
        const r = rod();
        r.addEventListener('click', () => { if (locked) return; r.remove(); t--; sfx.whoosh(); api.say(String(t * 10 + o)); });
        rods.append(r);
      }
      addTen.addEventListener('click', () => {
        if (locked) return;
        if (t >= 9) { sfx.boing(); return; }
        t++; addRod(); sfx.note(t); api.say(String(t * 10 + o));
      });
      addOne.addEventListener('click', () => {
        if (locked) return;
        o++;
        if (o === 10) {
          // Ten ones make one ten.
          cubes.replaceChildren();
          o = 0;
          if (t < 9) { t++; addRod(); replay(rods.lastChild, 'pop-big'); }
          sfx.sparkle();
          api.say('Ten ones make one ten!');
          return;
        }
        const c = cube();
        c.addEventListener('click', () => { if (locked) return; c.remove(); o--; sfx.whoosh(); api.say(String(t * 10 + o)); });
        cubes.append(c);
        sfx.note(o);
        api.say(String(t * 10 + o));
      });
      go.addEventListener('click', () => {
        if (locked) return;
        const v = t * 10 + o;
        if (v === n) {
          locked = true;
          sfx.ding();
          setTimeout(() => api.win({ text: String(n), praise }), 400);
          return;
        }
        api.mistake();
        sfx.boing();
        api.say(v === 0 ? `Tap plus 10 and plus 1 to make ${n}!` : `You made ${v}. We need ${n}. ${v < n ? 'Add more!' : 'Take some away!'}`);
      });

      const prompt = `Make ${n} with tens and ones!`;
      api.setPrompt(prompt);
      api.say(i === 3 ? `Now you build it! ${prompt} Then press the green button.` : prompt);
    }

    return { round };
  },
};
