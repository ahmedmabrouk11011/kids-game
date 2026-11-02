// 2. How Many?: look at the objects and tap the right number. A wrong answer counts together with you.
import { h, scatter, shuffle, sleep, replay } from '../util.js';
import { sfx } from '../sound.js';
import { itemDeck, itemEl } from '../items.js';
import { L } from '../lines.js';

const COLORS = ['#ff5fa2', '#3fa9f5', '#ff8c42'];

function options(n) {
  const near = shuffle([n - 2, n - 1, n + 1, n + 2].filter((v) => v >= 1 && v <= 10));
  return shuffle([n, ...near.slice(0, 2)]);
}

export default {
  id: 'howmany',
  title: 'How Many?',
  icon: 'thinking',
  color: '#ff5fa2',
  create(api) {
    const kinds = itemDeck(api.kid.hero);

    function round(i) {
      const n = api.deck[i];
      const kind = kinds[i];
      const area = h('div', { class: 'area' });
      const choices = h('div', { class: 'choices' });
      api.stage.replaceChildren(h('div', { class: 'field with-choices' }, area, choices));

      let els = [];
      let counting = false;
      async function countTogether() {
        counting = true;
        els.forEach((el) => { el.classList.remove('counted'); el.querySelector('.badge')?.remove(); });
        await api.say(L.howmany.together);
        for (let k = 0; k < els.length && api.alive(); k++) {
          els[k].classList.add('counted');
          replay(els[k], 'glow');
          els[k].append(h('span', { class: 'badge' }, String(k + 1)));
          sfx.note(k);
          api.say(L.num(k + 1));
          await sleep(750);
        }
        if (!api.alive()) return;
        await api.say(L.howmany.prompt(kind));
        counting = false;
      }

      options(n).forEach((v, k) => {
        const b = h('button', { class: 'choice', style: `--c:${COLORS[k]};animation-delay:${300 + k * 90}ms` }, String(v));
        b.addEventListener('click', () => {
          if (counting) return;
          if (v === n) {
            b.classList.add('right');
            sfx.ding();
            choices.style.pointerEvents = 'none';
            setTimeout(() => api.win({ num: n, praise: [L.yes, L.count.got(n, kind), api.great()] }), 450);
          } else {
            b.classList.add('wrong');
            sfx.boing();
            api.mistake();
            countTogether();
          }
        });
        choices.append(b);
      });

      // Measure only after the number buttons are in, so the objects never sit on top of them.
      const r = area.getBoundingClientRect();
      const { size, pts } = scatter(n, r.width - 20, r.height - 10);
      els = pts.map((p, k) => {
        const el = itemEl(kind, p.x + 10, p.y + 5, size);
        el.style.animationDelay = `${k * 60}ms`;
        area.append(el);
        return el;
      });

      api.setPrompt(L.howmany.prompt(kind));
      api.say(i === 0 ? L.howmany.intro(kind) : L.howmany.prompt(kind));
    }

    return { round };
  },
};
