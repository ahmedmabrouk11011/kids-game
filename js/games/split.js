// Youssef: Split It. N things on two plates; tap one to move it to the other plate and watch the number
// bond on top change. Press ✔ to keep a way, and find 3 different ways to make N. Nothing can be wrong:
// it is the "real objects" step that comes before Number Bond. The size follows his Number Bond level.
import { h, icon, glyph, replay, shuffle } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { ITEMS } from '../items.js';
import { splitWhole } from '../mathgen.js';
import { store } from '../store.js';
import { L } from '../lines.js';
import { bondSvg } from './bond.js';

const NEED = 3; // ways to find per round

export default {
  id: 'split',
  title: 'Split It',
  icon: 'plate',
  color: '#ff8c42',
  create(api) {
    const kinds = shuffle(ITEMS);

    function round(i) {
      const N = splitWhole(store.level(api.kid.id, 'bond'), i);
      const kind = kinds[i % kinds.length];
      const found = new Set();
      let locked = false;

      const bond = bondSvg({ w: N, a: N, b: 0 }, null);
      const plateA = h('div', { class: 'plate pa' });
      const plateB = h('div', { class: 'plate pb' });
      const chips = h('div', { class: 'found ways' }, [...Array(NEED)].map(() => h('span', { class: 'chip empty' }, '?')));
      const keep = h('button', { class: 'big-btn go', 'aria-label': 'Keep this way' }, glyph('check'));
      api.stage.replaceChildren(h('div', { class: 'split' + (N <= 5 ? ' few' : '') },
        h('div', { class: 'split-top' }, bond.svg, chips),
        h('div', { class: 'plates' }, plateA, plateB),
        h('div', { class: 'split-tools' }, keep)));

      const counts = () => [plateA.children.length, plateB.children.length];
      for (let k = 0; k < N; k++) {
        const o = h('button', { class: 'sobj', style: `animation-delay:${k * 50}ms`, 'aria-label': kind.one }, icon(kind.icon));
        o.addEventListener('click', () => move(o));
        plateA.append(o);
      }

      function move(o) {
        if (locked) return;
        const from = o.getBoundingClientRect();
        (o.parentElement === plateA ? plateB : plateA).append(o);
        const to = o.getBoundingClientRect();
        o.style.animation = 'none';
        o.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` }, { transform: 'none' }],
          { duration: 320, easing: 'cubic-bezier(.3, 1.3, .5, 1)' });
        const [a, b] = counts();
        bond.set('a', a);
        bond.set('b', b);
        sfx.note(b);
      }

      keep.addEventListener('click', () => {
        if (locked) return;
        const [a, b] = counts();
        const way = `${a} + ${b}`;
        if (found.has(way)) { sfx.boing(); api.say(L.split.again); return; }
        found.add(way);
        const chip = chips.querySelector('.chip.empty');
        chip.classList.remove('empty');
        chip.replaceChildren(h('b', { class: 'ca' }, String(a)), ' + ', h('b', { class: 'cb' }, String(b)));
        replay(chip, 'pop-read');
        replay(bond.svg, 'jump');
        sfx.ding();
        const r = chip.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 30);
        if (found.size < NEED) { api.say(L.makes(a, b, N)); return; }
        locked = true;
        setTimeout(() => api.win({ text: `${a} + ${b} = ${N}`, praise: [L.makes(a, b, N), L.split.done(N), api.great()] }), 500);
      });

      api.setPrompt(L.split.prompt(N));
      api.say(i === 0 ? [L.split.intro, L.split.prompt(N)] : L.split.prompt(N));
    }

    return { round };
  },
};
