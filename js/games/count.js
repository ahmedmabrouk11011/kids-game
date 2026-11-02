// 1. Count & Tap: tap every object once; each tap says the next number out loud.
import { h, scatter, Word, replay } from '../util.js';
import { sfx } from '../sound.js';
import { itemDeck, itemEl, itemName } from '../items.js';

export default {
  id: 'count',
  title: 'Count',
  emoji: '👆',
  color: '#3fa9f5',
  create(api) {
    const kinds = itemDeck();

    function round(i) {
      const n = api.deck[i];
      const kind = kinds[i];
      const field = h('div', { class: 'field' });
      const counter = h('div', { class: 'counter' }, '0');
      api.stage.replaceChildren(field, counter);

      // Keep the objects (and their number badges) clear of the counter at the bottom.
      const r = field.getBoundingClientRect();
      const reserved = r.bottom - counter.getBoundingClientRect().top + 16;
      const { size, pts } = scatter(n, r.width - 20, r.height - reserved - 10);
      let count = 0;

      pts.forEach((p, k) => {
        const el = itemEl(kind, p.x + 10, p.y + 10, size);
        el.classList.add('tappable');
        el.style.animationDelay = `${k * 70}ms`;
        el.addEventListener('pointerdown', () => {
          if (el.dataset.n) { replay(el, 'glow'); sfx.boing(); return; }
          count++;
          el.dataset.n = count;
          el.classList.add('counted');
          replay(el, 'glow');
          el.append(h('span', { class: 'badge' }, String(count)));
          counter.textContent = count;
          replay(counter, 'bump');
          sfx.note(count - 1);
          if (count < n) { api.say(Word(count)); return; }
          field.style.pointerEvents = 'none';
          setTimeout(() => api.win({ num: n, praise: `${Word(n)} ${itemName(kind, n)}! ${api.great()}` }), 500);
        });
        field.append(el);
      });

      const prompt = `Tap each ${kind.one} and count!`;
      api.setPrompt(prompt);
      api.say(i === 0 ? `Let's count! Tap each ${kind.one} and count with me!` : prompt);
    }

    return { round };
  },
};
