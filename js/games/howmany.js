// 2. How Many?: look at the objects and tap the right number. A wrong answer counts together with you.
import { h, scatter, shuffle, sleep, Word, replay } from '../util.js';
import { sfx } from '../sound.js';
import { itemDeck, itemEl, itemName } from '../items.js';

const COLORS = ['#ff5fa2', '#3fa9f5', '#ff8c42'];

function options(n) {
  const near = shuffle([n - 2, n - 1, n + 1, n + 2].filter((v) => v >= 1 && v <= 10));
  return shuffle([n, ...near.slice(0, 2)]);
}

export default {
  id: 'howmany',
  title: 'How Many?',
  emoji: '🤔',
  color: '#ff5fa2',
  create(api) {
    const kinds = itemDeck();

    function round(i) {
      const n = api.deck[i];
      const kind = kinds[i];
      const area = h('div', { class: 'area' });
      const choices = h('div', { class: 'choices' });
      api.stage.replaceChildren(h('div', { class: 'field with-choices' }, area, choices));

      const r = area.getBoundingClientRect();
      const { size, pts } = scatter(n, r.width - 20, r.height - 10);
      const els = pts.map((p, k) => {
        const el = itemEl(kind, p.x + 10, p.y + 5, size);
        el.style.animationDelay = `${k * 60}ms`;
        area.append(el);
        return el;
      });

      let counting = false;
      async function countTogether() {
        counting = true;
        els.forEach((el) => { el.classList.remove('counted'); el.querySelector('.badge')?.remove(); });
        await api.say("Let's count together!");
        for (let k = 0; k < els.length && api.alive(); k++) {
          els[k].classList.add('counted');
          replay(els[k], 'glow');
          els[k].append(h('span', { class: 'badge' }, String(k + 1)));
          sfx.note(k);
          api.say(Word(k + 1));
          await sleep(750);
        }
        if (!api.alive()) return;
        await api.say(`How many ${kind.many}?`);
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
            setTimeout(() => api.win({ num: n, praise: `Yes! ${Word(n)} ${itemName(kind, n)}! ${api.great()}` }), 450);
          } else {
            b.classList.add('wrong');
            sfx.boing();
            api.mistake();
            countTogether();
          }
        });
        choices.append(b);
      });

      const prompt = `How many ${kind.many}?`;
      api.setPrompt(prompt);
      api.say(i === 0 ? `How many ${kind.many} can you see? Tap the number!` : prompt);
    }

    return { round };
  },
};
