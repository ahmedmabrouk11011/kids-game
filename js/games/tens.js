// Youssef 6. Tens & Ones: read a number made of ten-rods and one-cubes (type it),
// then build numbers yourself with +10 and +1 (ten loose cubes snap into a rod).
import { h, icon, glyph, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { keypad, qaLayout } from '../keypad.js';
import { tensTarget } from '../mathgen.js';
import { L } from '../lines.js';

const rod = () => h('div', { class: 'rod' }, [...Array(10)].map(() => h('i')));
const cube = () => h('div', { class: 'cube' }, h('i'));

export default {
  id: 'tens',
  title: 'Tens & Ones',
  icon: 'brick',
  color: '#00c2a8',
  create(api) {
    function round(i) {
      const n = tensTarget(i);
      const T = Math.floor(n / 10);
      const O = n % 10;
      const praise = [L.tens.praise(T, O, n), api.great()];
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
        api.say(L.tens.wrong);
      }

      api.setPrompt(L.tens.prompt);
      api.say(i === 0 ? L.tens.intro : L.tens.prompt);
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
      const go = h('button', { class: 'big-btn go', 'aria-label': 'Check' }, glyph('check'));
      api.stage.replaceChildren(h('div', { class: 'qa build' },
        h('div', { class: 'problem' }, h('div', { class: 'tens-wrap' },
          h('div', { class: 'target-card' }, h('span', { class: 'small' }, 'Make'), String(n)),
          h('div', { class: 'blocks build-area' }, rods, cubes))),
        h('div', { class: 'pad-col build-tools' }, addTen, addOne, go)));

      function addRod() {
        const r = rod();
        r.addEventListener('click', () => { if (locked) return; r.remove(); t--; sfx.whoosh(); api.say(L.num(t * 10 + o)); });
        rods.append(r);
      }
      addTen.addEventListener('click', () => {
        if (locked) return;
        if (t >= 9) { sfx.boing(); return; }
        t++; addRod(); sfx.note(t); api.say(L.num(t * 10 + o));
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
          api.say(L.tens.tenOnes);
          return;
        }
        const c = cube();
        c.addEventListener('click', () => { if (locked) return; c.remove(); o--; sfx.whoosh(); api.say(L.num(t * 10 + o)); });
        cubes.append(c);
        sfx.note(o);
        api.say(L.num(t * 10 + o));
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
        api.say(v === 0 ? L.tens.tapPlus : v < n ? L.tens.more : L.tens.less);
      });

      api.setPrompt(L.tens.make(n));
      api.say(i === 3 ? [L.tens.build, L.tens.make(n), L.thenGreen] : L.tens.make(n));
    }

    return { round };
  },
};
