// 6. Dot to Dot: draw from 1 to 10 with the pencil (or tap the dots in order). The shape fills with colour at the end.
import { h, Word } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { attachInk } from '../ink.js';

// 10 points each, in a 100 x 100 box, in drawing order.
const SHAPES = [
  { name: 'star', emoji: '⭐', color: '#ffcc33', pts: [[50, 5], [61, 37], [94, 37], [68, 57], [78, 90], [50, 70], [22, 90], [32, 57], [6, 37], [39, 37]] },
  { name: 'fish', emoji: '🐟', color: '#3fa9f5', pts: [[8, 28], [28, 46], [46, 26], [72, 24], [94, 50], [72, 76], [46, 74], [28, 54], [8, 72], [18, 50]] },
  { name: 'rocket', emoji: '🚀', color: '#e63946', pts: [[50, 4], [66, 26], [66, 66], [82, 90], [60, 80], [50, 96], [40, 80], [18, 90], [34, 66], [34, 26]] },
  { name: 'heart', emoji: '💖', color: '#ff5fa2', pts: [[50, 30], [62, 14], [80, 12], [93, 28], [88, 50], [50, 90], [12, 50], [7, 28], [20, 12], [38, 14]] },
  { name: 'tree', emoji: '🎄', color: '#2ecc71', pts: [[50, 2], [78, 30], [60, 30], [88, 60], [66, 60], [94, 92], [6, 92], [34, 60], [12, 60], [40, 30]] },
];
const HIT = 8; // how close (in box units) the pencil must come to a dot

export default {
  id: 'dots',
  title: 'Dot to Dot',
  emoji: '⭐',
  color: '#ffcc33',
  create(api) {
    let onResize = null;
    const order = [...SHAPES].sort(() => Math.random() - 0.5);

    function round(i) {
      const shape = order[i % order.length];
      const pts = shape.pts;
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      let next = 0;
      let locked = false;

      const svg = h('svg', { viewBox: '-10 -10 120 120', preserveAspectRatio: 'xMidYMid meet' });
      const canvas = h('canvas');
      api.stage.replaceChildren(h('div', { class: 'dots-board' }, svg, canvas));

      const fill = svg.appendChild(h('polygon', { class: 'shape-fill', points: pts.map((p) => p.join(',')).join(' '), fill: shape.color, 'fill-opacity': 0, stroke: 'none' }));
      const lines = svg.appendChild(h('g'));
      const dots = pts.map(([x, y], k) => {
        const dx = x - cx;
        const dy = y - cy;
        const len = Math.hypot(dx, dy) || 1;
        const g = h('g', { class: 'dot' },
          h('circle', { class: 'd', cx: x, cy: y, r: 3.6 }),
          h('text', { x: x + (dx / len) * 7.5, y: y + (dy / len) * 7.5 + 2.2, 'text-anchor': 'middle' }, String(k + 1)));
        svg.append(g);
        return g;
      });
      dots[0].classList.add('next');

      const ink = attachInk(canvas, {
        color: () => 'rgba(255,255,255,.45)',
        width: () => 7,
        onPoint: (x, y) => hitTest(x, y),
        onEnd: () => setTimeout(() => ink.clear(), 250),
      });
      if (onResize) removeEventListener('resize', onResize);
      onResize = () => ink.resize();
      addEventListener('resize', onResize);

      function hitTest(x, y) {
        if (locked) return;
        const r = canvas.getBoundingClientRect();
        const p = new DOMPoint(r.left + x, r.top + y).matrixTransform(svg.getScreenCTM().inverse());
        const [tx, ty] = pts[next];
        if (Math.hypot(p.x - tx, p.y - ty) <= HIT) connect(next);
      }

      function line(a, b) {
        const l = lines.appendChild(h('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        l.animate([{ strokeDasharray: `0 ${L}` }, { strokeDasharray: `${L} 0` }], { duration: 220, fill: 'forwards' });
      }

      function connect(k) {
        dots[k].classList.remove('next');
        dots[k].classList.add('done');
        if (k > 0) line(pts[k - 1], pts[k]);
        sfx.note(k);
        next = k + 1;
        if (next < pts.length) {
          dots[next].classList.add('next');
          api.say(Word(k + 1));
          return;
        }
        locked = true;
        line(pts[pts.length - 1], pts[0]);
        api.say('Ten!');
        setTimeout(() => {
          fill.setAttribute('fill-opacity', 1);
          fill.style.transform = 'scale(1.06)';
          sfx.ding();
          const r = svg.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 80, [shape.color, '#ffffff', '#ffcc33']);
        }, 350);
        setTimeout(() => api.win({ emoji: shape.emoji, praise: `You made a ${shape.name}! ${api.great()}` }), 1300);
      }

      const prompt = 'Connect the dots! Start at one.';
      api.setPrompt(prompt);
      api.say(i === 0 ? 'Draw from one to ten with your pencil! Start at the yellow dot.' : prompt);
    }

    return {
      round,
      destroy() { if (onResize) removeEventListener('resize', onResize); },
    };
  },
};
