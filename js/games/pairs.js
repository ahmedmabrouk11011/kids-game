// Youssef 2. Make Pairs: tap two cards that together make the target (7, 8, 10 ... and 20 at the end).
import { h, icon, shuffle, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { PAIR_TARGETS, pairsFor } from '../mathgen.js';
import { L } from '../lines.js';

const COLORS = ['#ff5fa2', '#3fa9f5', '#ff8c42', '#9b5de5', '#2ecc71', '#00c2a8', '#e63946', '#ffcc33'];

export default {
  id: 'pairs',
  title: 'Make Pairs',
  icon: 'joker',
  color: '#3fa9f5',
  create(api) {
    function round(i) {
      const T = PAIR_TARGETS[i];
      const pairs = pairsFor(T);
      let left = pairs.length;
      let picked = null;
      let busy = false;

      const found = h('div', { class: 'found' });
      const grid = h('div', { class: 'cards' });
      api.stage.replaceChildren(h('div', { class: 'pairs' },
        h('div', { class: 'target-card' }, icon('target', 'small'), h('span', { class: 'small' }, 'Make'), String(T)),
        found, grid));

      shuffle(pairs.flat()).forEach((n, k) => {
        const c = h('button', { class: 'pcard', style: `--c:${COLORS[k % COLORS.length]};animation-delay:${k * 60}ms` }, String(n));
        c.addEventListener('click', () => tap(c, n));
        grid.append(c);
      });

      function tap(c, n) {
        if (busy || c.classList.contains('gone')) return;
        if (!picked) { picked = { c, n }; c.classList.add('sel'); sfx.note(2); return; }
        if (picked.c === c) { c.classList.remove('sel'); picked = null; return; }
        const first = picked;
        picked = null;
        if (first.n + n === T) {
          sfx.ding();
          [first.c, c].forEach((x) => { x.classList.remove('sel'); x.classList.add('gone'); });
          const r = c.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 40);
          found.append(h('span', { class: 'chip' }, `${first.n} + ${n}`));
          left--;
          if (left === 0) {
            busy = true;
            setTimeout(() => api.win({ text: `Make ${T}`, praise: [L.pairs.all(T), api.great()] }), 600);
          } else api.say(L.makes(Math.min(first.n, n), Math.max(first.n, n), T));
          return;
        }
        api.mistake();
        sfx.boing();
        [first.c, c].forEach((x) => { x.classList.remove('sel'); replay(x, 'shake-it'); });
        api.say(L.makes(Math.min(first.n, n), Math.max(first.n, n), first.n + n), L.pairs.need(T));
      }

      api.setPrompt(L.pairs.prompt(T));
      api.say(i === 0 ? L.pairs.intro(T) : L.pairs.prompt(T));
    }

    return { round };
  },
};
