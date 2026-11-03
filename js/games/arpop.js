// Arabic 3. Haraka Bubbles: bubbles with sounds float up. Pop 5 bubbles that have this round's haraka
// (shown at the top in its colour). Every pop reads the sound; a wrong bubble wobbles and is read too.
import { h, rand, pick, shuffle, clamp, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { KINDS, COLOR, NAME, LETTERS, syl, sylSaid, LA } from '../arabic.js';
import { arText } from '../arglyph.js';

const LANES = 5;
const NEED = 5;
const EASY = 'بتنمسلدرفكجق'.split('');

export default {
  id: 'arpop',
  title: 'فقاعات الحركات',
  icon: 'bubbles',
  color: '#ea580c',
  rounds: 4,
  create(api) {
    const order = shuffle(KINDS);
    let field = null;
    let pill = null;
    let count = null;
    let target = '';
    let got = 0;
    let busy = false;
    let bubbles = [];
    let raf = 0;
    let last = 0;
    let spawnIn = 0;
    let sinceTarget = 0;
    let recentLanes = [];

    function spawn() {
      const w = field.clientWidth;
      const hgt = field.clientHeight;
      const size = clamp(Math.min(w / 6, hgt / 3.6), 90, 170);
      const onScreen = bubbles.filter((b) => b.k === target && !b.dead).length;
      const k = (onScreen < 2 && sinceTarget >= 1) || Math.random() < 0.4 ? target : pick(KINDS.filter((x) => x !== target));
      sinceTarget = k === target ? 0 : sinceTarget + 1;
      const lanes = [...Array(LANES).keys()].filter((l) => !recentLanes.includes(l));
      const lane = pick(lanes);
      recentLanes = [lane, ...recentLanes].slice(0, 2);
      const laneW = (w - size) / LANES;
      const c = pick(EASY);
      const b = {
        k, c, size, dead: false,
        x0: size / 2 + laneW * (lane + 0.5) + rand(-laneW * 0.15, laneW * 0.15),
        y: hgt + 20,
        vy: hgt / rand(9, 12),
        amp: rand(8, 18),
        ph: rand(0, 6),
      };
      b.el = h('div', { class: 'bubble', style: `--sz:${size}px` }, arText(syl(c, k)));
      b.el.addEventListener('pointerdown', () => tap(b));
      field.append(b.el);
      bubbles.push(b);
    }

    function tap(b) {
      if (b.dead || busy) return;
      const r = b.el.getBoundingClientRect();
      if (b.k === target) {
        b.dead = true;
        b.el.classList.add('popped');
        sfx.pop();
        burst(r.left + r.width / 2, r.top + r.height / 2, 40, [COLOR[target], '#ffffff', '#bfe9ff']);
        setTimeout(() => b.el.remove(), 260);
        got++;
        count.replaceChildren(...[...Array(NEED)].map((_, n) => h('i', { class: n < got ? 'on' : '' })));
        if (got >= NEED) {
          busy = true;
          setTimeout(() => api.win({ node: arText(syl('ب', target)), praise: [NAME[target], api.great()] }), 350);
        } else api.say(sylSaid(b.c, b.k));
      } else {
        replay(b.el, 'nope');
        sfx.boing();
        api.mistake();
        api.say(LA.this, sylSaid(b.c, b.k), LA.pop.intro(target));
      }
    }

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      spawnIn -= dt;
      if (spawnIn <= 0 && bubbles.filter((b) => !b.dead).length < 6) {
        spawn();
        spawnIn = rand(1.2, 1.7);
      }
      for (const b of bubbles) {
        if (b.dead) continue;
        b.y -= b.vy * dt;
        const x = b.x0 + Math.sin(t / 800 + b.ph) * b.amp;
        b.el.style.transform = `translate(${x - b.size / 2}px, ${b.y}px)`;
        if (b.y < -b.size * 1.2) { b.dead = true; b.el.remove(); }
      }
      bubbles = bubbles.filter((b) => !b.dead);
      raf = requestAnimationFrame(frame);
    }

    function round(i) {
      target = order[i];
      got = 0;
      busy = false;
      sinceTarget = 1;
      if (!field) {
        field = h('div', { class: 'sky-field' });
        pill = h('div', { class: 'target-pill ar-pill', lang: 'ar' });
        count = h('div', { class: 'pop-count' });
        api.stage.replaceChildren(field, pill, count);
        last = performance.now();
        for (let k = 0; k < 3; k++) {
          spawn();
          bubbles[bubbles.length - 1].y = field.clientHeight * (0.3 + k * 0.22);
        }
        raf = requestAnimationFrame(frame);
      }
      pill.style.setProperty('--c', COLOR[target]);
      pill.replaceChildren(arText(syl('ب', target), { cls: 'on-colour' }), h('span', {}, NAME[target]));
      count.replaceChildren(...[...Array(NEED)].map(() => h('i')));
      replay(pill, 'new');
      api.setPrompt(LA.pop.intro(target));
      api.say(LA.pop.intro(target));
    }

    return { round, destroy() { cancelAnimationFrame(raf); } };
  },
};
