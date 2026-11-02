// Youssef 1. Number Bond: the part-whole picture (whole on top, two parts below). Type the missing number.
// Rounds get harder: bead hints at first, then a missing whole, then bonds of 10 and bonds with 0.
import { h, icon } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { keypad, qaLayout } from '../keypad.js';
import { bondRound } from '../mathgen.js';
import { L } from '../lines.js';

const COL = { w: '#ffcc33', a: '#ff5fa2', b: '#3fa9f5' };

export default {
  id: 'bond',
  title: 'Number Bond',
  icon: 'cherries',
  color: '#ff5fa2',
  create(api) {
    function round(i) {
      const { lv, N, a, b, miss } = bondRound(i);
      const val = { w: N, a, b };
      const answer = val[miss];

      const svg = h('svg', { class: 'bond', viewBox: '0 0 300 232' });
      svg.append(
        h('line', { x1: 150, y1: 60, x2: 70, y2: 172, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round' }),
        h('line', { x1: 150, y1: 60, x2: 230, y2: 172, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round' }));
      let slot;
      for (const [key, cx, cy] of [['w', 150, 56], ['a', 70, 174], ['b', 230, 174]]) {
        const blank = key === miss;
        const t = h('text', { x: cx, y: cy + 2, class: 'bond-num' + (blank ? ' slot' : '') }, blank ? '?' : String(val[key]));
        svg.append(h('circle', { cx, cy, r: 48, class: blank ? 'bond-blank' : '', fill: blank ? '#1d3f9e' : COL[key], stroke: '#fff', 'stroke-width': 4 }), t);
        if (blank) slot = t;
      }

      // Bead bar: pink beads for one part, blue for the other. The unknown part is hollow.
      const beads = h('div', { class: 'beads' + (lv.beads ? '' : ' hidden') },
        [...Array(N)].map((_, k) => h('span', { class: 'bead ' + (k < a ? 'pa' : 'pb') + ((miss === 'a' && k < a) || (miss === 'b' && k >= a) ? ' hollow' : '') })));
      const hint = h('button', { class: 'hint-btn', 'aria-label': 'Show beads' }, icon('bulb'));
      hint.addEventListener('click', () => { beads.classList.remove('hidden'); hint.remove(); sfx.sparkle(); });

      const pad = keypad({ slot, maxLen: 2, onSubmit: check });
      qaLayout(api.stage, h('div', { class: 'bond-wrap' }, svg, h('div', { class: 'beads-row' }, beads, lv.beads ? null : hint)), pad.el);

      function check(v) {
        if (v === answer) {
          pad.lock();
          slot.parentNode.querySelector('.bond-blank')?.setAttribute('fill', COL[miss]);
          beads.classList.remove('hidden');
          beads.querySelectorAll('.hollow').forEach((x) => x.classList.remove('hollow'));
          sfx.ding();
          const r = svg.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 60);
          setTimeout(() => api.win({ text: `${a} + ${b} = ${N}`, praise: [L.yes, L.makes(a, b, N), api.great()] }), 600);
          return;
        }
        api.mistake();
        sfx.boing();
        pad.wrong();
        beads.classList.remove('hidden');
        hint.remove();
        api.say(miss === 'w' ? L.bond.wrongWhole : L.bond.wrongPart);
      }

      const prompt = miss === 'w' ? L.bond.whole(a, b) : L.bond.part(N, miss === 'a' ? b : a);
      api.setPrompt(prompt);
      api.say(i === 0 ? [L.bond.intro, prompt] : prompt);
    }

    return { round };
  },
};
