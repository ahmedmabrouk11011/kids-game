// Omar: Road Trip. Pencil practice: drag the hero along a wide road to the gem, picking up 5 stars
// (counted out loud). The roads are the first strokes of writing: line, wave, zigzag, arches, S-curve.
import { h, sleep } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { attachInk } from '../ink.js';
import { L } from '../lines.js';

const ROADS = [
  'M40 120 L360 120',
  'M40 150 C90 40 150 40 200 120 C250 200 310 200 360 90',
  'M40 70 L120 180 L200 70 L280 180 L360 70',
  'M40 190 C40 90 120 90 120 190 C120 90 200 90 200 190 C200 90 280 90 280 190 C280 90 360 90 360 190',
  'M50 50 C340 50 340 120 200 120 C60 120 60 190 350 190',
];
const ROAD = 34;    // road width (box units)
const NEAR = 28;    // how far from the road centre the pencil may be
const AHEAD = 30;   // how many samples (x2 units) the hero may jump ahead at once
const STARS = [0.16, 0.33, 0.5, 0.67, 0.84];

export default {
  id: 'roads',
  title: 'Road Trip',
  icon: 'road',
  color: '#e63946',
  create(api) {
    let onResize = null;
    let offRoadAt = 0;

    function round(i) {
      const svg = h('svg', { viewBox: '0 0 400 240', preserveAspectRatio: 'xMidYMid meet' });
      const canvas = h('canvas');
      api.stage.replaceChildren(h('div', { class: 'roads-board' }, svg, canvas));

      const d = ROADS[i];
      const line = { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
      svg.append(
        h('path', { ...line, stroke: '#2a2a3a', 'stroke-width': ROAD + 8 }),
        h('path', { ...line, stroke: '#4a4a63', 'stroke-width': ROAD }),
        h('path', { ...line, stroke: 'rgba(255,255,255,.7)', 'stroke-width': 3, 'stroke-dasharray': '10 10' }));
      const painted = svg.appendChild(h('path', { ...line, stroke: api.kid.hero === 'sonic' ? '#3fa9f5' : '#ffcc33', 'stroke-width': 12, opacity: 0.9 }));
      const road = svg.firstChild;
      const L_ = road.getTotalLength();
      painted.style.strokeDasharray = L_;
      painted.style.strokeDashoffset = L_;

      const samples = [];
      for (let s = 0; s <= L_; s += 2) samples.push(road.getPointAtLength(s));
      const end = samples[samples.length - 1];
      svg.append(h('image', { href: 'img/icons/gem.svg', x: end.x - 22, y: end.y - 46, width: 44, height: 44, class: 'goal' }));

      const stars = STARS.map((f) => {
        const idx = Math.round(f * (samples.length - 1));
        const p = samples[idx];
        const el = svg.appendChild(h('image', { href: 'img/icons/star.svg', x: p.x - 15, y: p.y - 15, width: 30, height: 30, class: 'road-star' }));
        return { idx, el, got: false };
      });
      const heroEl = svg.appendChild(h('image', { href: `img/chars/${api.kid.hero}.webp`, width: 52, height: 74, class: 'road-hero' }));
      let at = 0;
      let done = false;
      const placeHero = () => {
        const p = samples[at];
        heroEl.setAttribute('x', p.x - 26);
        heroEl.setAttribute('y', p.y - 66);
        painted.style.strokeDashoffset = L_ - at * 2;
      };
      placeHero();

      const ink = attachInk(canvas, {
        color: () => 'rgba(255,255,255,.35)',
        width: () => 6,
        onPoint: (x, y) => follow(x, y),
        onEnd: () => setTimeout(() => ink.clear(), 200),
      });
      if (onResize) removeEventListener('resize', onResize);
      onResize = () => ink.resize();
      addEventListener('resize', onResize);

      function follow(x, y) {
        if (done) return;
        const r = canvas.getBoundingClientRect();
        const p = new DOMPoint(r.left + x, r.top + y).matrixTransform(svg.getScreenCTM().inverse());
        let best = -1;
        let bestD = Infinity;
        for (let k = Math.max(0, at - 5); k < Math.min(samples.length, at + AHEAD); k++) {
          const dd = Math.hypot(samples[k].x - p.x, samples[k].y - p.y);
          if (dd < bestD) { bestD = dd; best = k; }
        }
        if (bestD > NEAR) {
          if (bestD > NEAR * 1.8 && performance.now() - offRoadAt > 4000) { offRoadAt = performance.now(); api.say(L.roads.off); }
          return;
        }
        if (best <= at) return;
        at = best;
        placeHero();
        stars.forEach((s, k) => {
          if (s.got || at < s.idx) return;
          s.got = true;
          s.el.classList.add('got');
          sfx.note(k + 2);
          api.say(L.num(stars.filter((t) => t.got).length));
        });
        if (at >= samples.length - 3) finish();
      }

      async function finish() {
        done = true;
        sfx.ding();
        const r = svg.getBoundingClientRect();
        burst(r.left + r.width * (end.x / 400), r.top + r.height * (end.y / 240), 70);
        heroEl.classList.add('cheer');
        await sleep(700);
        api.win({ emoji: 'gem', praise: [L.roads.made, api.great()] });
      }

      api.setPrompt(L.roads.prompt);
      api.say(i === 0 ? L.roads.intro(api.kid.heroName) : L.roads.prompt);
    }

    return { round, destroy() { if (onResize) removeEventListener('resize', onResize); } };
  },
};
