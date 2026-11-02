// 4. Apple Basket: see a number, tap that many apples into the basket, then press ✔.
// Tap an apple in the basket to put it back on the tree.
import { h, icon, glyph, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { APPLE } from '../items.js';
import { L } from '../lines.js';

// Where the 12 apples hang, as fractions of the tree canopy box.
const SPOTS = [[0.24, 0.3], [0.42, 0.18], [0.6, 0.2], [0.77, 0.32], [0.16, 0.5], [0.35, 0.42], [0.54, 0.42], [0.73, 0.5],
  [0.27, 0.66], [0.46, 0.64], [0.65, 0.68], [0.86, 0.6]];

function fly(from, to, done) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const ghost = h('div', { class: 'apple flyer', style: `--sz:${a.width}px;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;animation:none` }, icon('apple'));
  document.body.append(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const s = b.width / a.width;
  const anim = ghost.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)' },
    { transform: `translate(${dx * 0.5}px, ${Math.min(dy, 0) * 0.5 - 90}px) scale(${(1 + s) / 2 + 0.2}) rotate(180deg)`, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(360deg)` },
  ], { duration: 520, easing: 'ease-in-out' });
  anim.onfinish = () => { ghost.remove(); done(); };
}

export default {
  id: 'basket',
  title: 'Apples',
  icon: 'basket',
  color: '#2ecc71',
  create(api) {
    function round(i) {
      const n = api.deck[i];
      let inBasket = 0;
      let moving = 0;
      let locked = false;

      const tree = h('div', { class: 'tree' }, h('div', { class: 'canopy' }), h('div', { class: 'trunk' }));
      const count = h('div', { class: 'count' }, '0');
      const basket = h('div', { class: 'basket' }, count);
      const goBtn = h('button', { class: 'big-btn go', 'aria-label': 'Done' }, glyph('check'));
      api.stage.replaceChildren(h('div', { class: 'orchard' },
        h('div', { class: 'target-card' }, String(n), icon('apple', 'small')),
        tree,
        h('div', { class: 'basket-col' }, basket, goBtn)));

      const tr = tree.getBoundingClientRect();
      const cw = tr.width * 0.92;
      const ch = tr.height * 0.86;
      const size = Math.min(cw / 6.5, ch / 4.2, 86);

      const setCount = () => { count.textContent = inBasket; replay(count, 'jump'); };

      SPOTS.forEach(([fx, fy], k) => {
        const apple = h('div', { class: 'apple', style: `--sz:${size}px;left:${tr.width * 0.04 + fx * cw}px;top:${fy * ch}px;animation-delay:${k * 40}ms` }, icon('apple'));
        apple.addEventListener('pointerdown', () => {
          if (locked || moving > 1) return;
          if (apple.parentElement === tree) {
            const slot = h('div', { class: 'apple', style: 'visibility:hidden;animation:none' }, icon('apple'));
            basket.append(slot);
            apple.style.visibility = 'hidden';
            moving++;
            fly(apple, slot, () => {
              moving--;
              slot.remove();
              apple.style.visibility = '';
              apple.style.animation = 'none';
              apple.dataset.left = apple.style.left;
              apple.dataset.top = apple.style.top;
              apple.style.left = apple.style.top = '';
              apple.style.removeProperty('--sz');
              basket.append(apple);
            });
            inBasket++;
            sfx.note(inBasket - 1);
            api.say(L.num(inBasket));
          } else {
            apple.style.visibility = 'hidden';
            const home = h('div', { class: 'apple', style: `--sz:${size}px;left:${apple.dataset.left};top:${apple.dataset.top};visibility:hidden;animation:none` });
            tree.append(home);
            moving++;
            fly(apple, home, () => {
              moving--;
              home.remove();
              apple.style.left = apple.dataset.left;
              apple.style.top = apple.dataset.top;
              apple.style.setProperty('--sz', `${size}px`);
              apple.style.visibility = '';
              tree.append(apple);
            });
            inBasket--;
            sfx.whoosh();
            api.say(L.num(inBasket));
          }
          setCount();
        });
        tree.append(apple);
      });

      goBtn.addEventListener('click', () => {
        if (locked) return;
        if (inBasket === n) {
          locked = true;
          sfx.ding();
          const r = basket.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top, 70);
          setTimeout(() => api.win({ num: n, praise: [L.yes, L.count.got(n, APPLE), api.great()] }), 500);
          return;
        }
        sfx.boing();
        replay(basket, 'wrong-shake');
        if (inBasket === 0) { api.say(L.basket.tapToPut(n)); return; }
        api.mistake();
        api.say(inBasket > n ? [L.basket.tooMany(n), L.basket.takeOut] : L.basket.more(n));
      });

      api.setPrompt(L.basket.prompt(n));
      api.say(i === 0 ? [L.basket.prompt(n), L.thenGreen] : L.basket.prompt(n));
    }

    return { round };
  },
};
