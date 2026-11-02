// Youssef 3. Balance: an equation on a see-saw scale. While he types, the scale tilts;
// the right number makes it level. Rounds: a+?=c, ?+b=c, 10=a+?, a−b=?, a+b=c+?
import { h, randInt, clamp, pick } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { keypad, qaLayout } from '../keypad.js';

function problem(i) {
  if (i === 0) { const c = randInt(5, 9); const a = randInt(1, c - 1); return { L: [a, '+', '?'], R: [c], ans: c - a }; }
  if (i === 1) { const c = randInt(6, 10); const b = randInt(1, c - 1); return { L: ['?', '+', b], R: [c], ans: c - b }; }
  if (i === 2) { const a = randInt(1, 9); return { L: [10], R: [a, '+', '?'], ans: 10 - a }; }
  if (i === 3) { const a = randInt(6, 10); const b = randInt(1, a - 1); return { L: [a, '−', b], R: ['?'], ans: a - b }; }
  const a = randInt(1, 5); const b = randInt(1, 5); const c = randInt(1, a + b - 1);
  return { L: [a, '+', b], R: [c, '+', '?'], ans: a + b - c };
}

const value = (side, x) => side.reduce((acc, t, k) => {
  if (t === '+' || t === '−') return acc;
  const v = t === '?' ? x : t;
  return k > 0 && side[k - 1] === '−' ? acc - v : acc + v;
}, 0);

const spoken = (side) => side.map((t) => (t === '+' ? 'plus' : t === '−' ? 'minus' : t === '?' ? 'what' : t)).join(' ');

export default {
  id: 'balance',
  title: 'Balance',
  emoji: '⚖️',
  color: '#9b5de5',
  create(api) {
    function round(i) {
      const p = problem(i);
      let slot;
      const side = (tokens) => h('div', { class: 'tray' }, tokens.map((t) => {
        if (t === '?') return (slot = h('span', { class: 'tok slot' }, '?'));
        return h('span', { class: typeof t === 'number' ? 'tok num-tok' : 'tok op' }, String(t));
      }));
      const panL = h('div', { class: 'pan l' }, side(p.L));
      const panR = h('div', { class: 'pan r' }, side(p.R));
      const beam = h('div', { class: 'beam' }, panL, panR);
      const scale = h('div', { class: 'scale' }, h('div', { class: 'post' }), beam);

      const tilt = (x) => {
        const d = value(p.R, x) - value(p.L, x);
        const ang = clamp(d * 4, -16, 16);
        beam.style.transform = `rotate(${ang}deg)`;
        panL.style.transform = panR.style.transform = `rotate(${-ang}deg)`;
        scale.classList.toggle('level', d === 0 && x !== null);
      };

      const pad = keypad({ slot, maxLen: 2, onSubmit: check, onChange: (v) => tilt(v === '' ? 0 : Number(v)) });
      qaLayout(api.stage, h('div', { class: 'scale-wrap' }, scale, h('div', { class: 'equation' }, `${p.L.join(' ')} = ${p.R.join(' ')}`)), pad.el);
      tilt(0);

      function check(v) {
        if (v === p.ans) {
          pad.lock();
          sfx.ding();
          const r = scale.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 3, 60);
          const eq = `${p.L.join(' ')} = ${p.R.join(' ')}`.replace('?', String(v));
          setTimeout(() => api.win({ text: eq, praise: `Level! ${spoken(p.L).replace('what', v)} equals ${spoken(p.R).replace('what', v)}. ${api.great()}` }), 800);
          return;
        }
        api.mistake();
        sfx.boing();
        pad.wrong();
        api.say(pick(['The scale is not level. Try again!', 'Not quite. Look at the scale!']));
      }

      const prompt = `${spoken(p.L)} equals ${spoken(p.R)}?`;
      api.setPrompt(prompt);
      api.say(i === 0 ? `Make the scale level! ${prompt}` : prompt);
    }

    return { round };
  },
};
