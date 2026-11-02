// Youssef 3. Balance: an equation on a see-saw scale. While he types, the scale tilts;
// the right number makes it level. Rounds: a+?=c, ?+b=c, 10=a+?, a−b=?, a+b=c+?
import { h, clamp, pick } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { keypad, qaLayout } from '../keypad.js';
import { balanceProblem } from '../mathgen.js';
import { L } from '../lines.js';

const value = (side, x) => side.reduce((acc, t, k) => {
  if (t === '+' || t === '−') return acc;
  const v = t === '?' ? x : t;
  return k > 0 && side[k - 1] === '−' ? acc - v : acc + v;
}, 0);

export default {
  id: 'balance',
  title: 'Balance',
  icon: 'scale',
  color: '#9b5de5',
  create(api) {
    function round(i) {
      const p = balanceProblem(i);
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
          setTimeout(() => api.win({ text: eq, praise: [L.balance.level, api.great()] }), 800);
          return;
        }
        api.mistake();
        sfx.boing();
        pad.wrong();
        api.say(pick([L.balance.notLevel, L.balance.look]));
      }

      const prompt = L.balance.question(p);
      api.setPrompt(prompt);
      api.say(i === 0 ? [L.balance.intro, prompt] : prompt);
    }

    return { round };
  },
};
