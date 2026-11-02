// 3. Trace: a pencil shows how to write the number, then the kid traces it and presses ✔.
// The check is forgiving: most of the number must be covered and most of the ink must be on it.
import { h, Word, sleep } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { attachInk } from '../ink.js';
import { DIGITS } from '../digits.js';

const CRAYONS = ['#ff4d4d', '#ffcc33', '#2ecc71', '#3fa9f5', '#ff5fa2'];
const TRACK = 24; // width of the guide road, in digit units
const PASS_COVER = 0.7;
const PASS_OFF = 0.4;

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const lineProps = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

export default {
  id: 'trace',
  title: 'Trace',
  emoji: '✏️',
  color: '#ff8c42',
  create(api) {
    let color = CRAYONS[0];
    let token = 0;
    let onResize = null;

    function round(i) {
      const my = ++token;
      const n = api.deck[i];
      const digit = DIGITS[n];
      let tries = 0;
      let locked = false;

      const svg = h('svg', { viewBox: `-22 -14 ${digit.w + 44} 196`, preserveAspectRatio: 'xMidYMid meet' });
      const canvas = h('canvas');
      const board = h('div', { class: 'board' }, svg, canvas, h('div', { class: 'qty' }, '⭐'.repeat(n)));
      const swatches = CRAYONS.map((c) => h('button', { class: 'swatch' + (c === color ? ' sel' : ''), style: `--c:${c}`, 'aria-label': 'Crayon colour' }));
      const clearBtn = h('button', { class: 'big-btn clear', 'aria-label': 'Clear' }, '🧽');
      const goBtn = h('button', { class: 'big-btn go', 'aria-label': 'Done' }, '✔');
      api.stage.replaceChildren(h('div', { class: 'trace' }, board, h('div', { class: 'tools' }, swatches, clearBtn, goBtn)));

      const layer = (attrs) => digit.strokes.map((d) => svg.appendChild(h('path', { d, ...lineProps, ...attrs })));
      layer({ stroke: 'rgba(255,255,255,.65)', 'stroke-width': TRACK + 6 });
      const road = layer({ stroke: '#2b215f', 'stroke-width': TRACK });
      layer({ stroke: 'rgba(255,255,255,.8)', 'stroke-width': 3, 'stroke-dasharray': '0.1 8' });

      // Green start dot + arrow for every stroke (numbered when the digit has two strokes).
      road.forEach((p, k) => {
        const a = p.getPointAtLength(0);
        const b = p.getPointAtLength(22);
        const c = p.getPointAtLength(24);
        const ang = (Math.atan2(c.y - b.y, c.x - b.x) * 180) / Math.PI;
        svg.append(
          h('polygon', { points: '-6,-7 8,0 -6,7', fill: '#2ecc71', transform: `translate(${b.x} ${b.y}) rotate(${ang})` }),
          h('circle', { cx: a.x, cy: a.y, r: 10, fill: '#2ecc71', stroke: '#fff', 'stroke-width': 2.5 }),
          digit.strokes.length > 1 ? h('text', { x: a.x, y: a.y + 4.5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#fff', 'font-family': 'Fredoka, sans-serif' }, String(k + 1)) : null);
      });
      const missedLayer = svg.appendChild(h('g'));

      let scale = 1;
      const measure = () => { scale = svg.getScreenCTM()?.a || 1; };
      measure();
      const ink = attachInk(canvas, {
        color: () => color,
        width: () => TRACK * scale * 0.95,
        onStart: () => missedLayer.replaceChildren(),
      });
      if (onResize) removeEventListener('resize', onResize);
      onResize = () => { measure(); ink.resize(); };
      addEventListener('resize', onResize);

      swatches.forEach((b, k) => b.addEventListener('click', () => {
        color = CRAYONS[k];
        swatches.forEach((x) => x.classList.toggle('sel', x === b));
        sfx.note(k + 2);
      }));
      clearBtn.addEventListener('click', () => { ink.clear(); missedLayer.replaceChildren(); sfx.whoosh(); });
      goBtn.addEventListener('click', check);

      function toBoard(pt) {
        const s = new DOMPoint(pt.x, pt.y).matrixTransform(svg.getScreenCTM());
        const r = board.getBoundingClientRect();
        return { x: s.x - r.left, y: s.y - r.top };
      }

      async function demo() {
        const g = svg.appendChild(h('g'));
        const pencil = h('div', { class: 'pencil' }, '✏️');
        board.append(pencil);
        for (const d of digit.strokes) {
          const p = g.appendChild(h('path', { d, ...lineProps, stroke: '#ffcc33', 'stroke-width': 10 }));
          const L = p.getTotalLength();
          p.style.strokeDasharray = L;
          p.style.strokeDashoffset = L;
          const dur = 700 + L * 7;
          const t0 = performance.now();
          await new Promise((res) => {
            const f = (t) => {
              if (my !== token) return res();
              const k = Math.min(1, (t - t0) / dur);
              const e = ease(k);
              p.style.strokeDashoffset = L * (1 - e);
              const pt = toBoard(p.getPointAtLength(L * e));
              pencil.style.transform = `translate(${pt.x - 6}px, ${pt.y - 50}px)`;
              if (k < 1) requestAnimationFrame(f); else res();
            };
            requestAnimationFrame(f);
          });
          await sleep(250);
        }
        if (my !== token) return;
        g.style.transition = 'opacity .6s';
        g.style.opacity = 0;
        pencil.style.transition = 'opacity .4s';
        pencil.style.opacity = 0;
        setTimeout(() => { g.remove(); pencil.remove(); }, 700);
      }

      function score() {
        const W = canvas.width;
        const H = canvas.height;
        const dpr = ink.dpr;
        const data = ink.ctx.getImageData(0, 0, W, H).data;
        const m = svg.getScreenCTM();
        const rect = canvas.getBoundingClientRect();
        const samples = [];
        for (const p of road) {
          const L = p.getTotalLength();
          for (let s = 0; s <= L; s += 4) {
            const u = p.getPointAtLength(s);
            const sp = new DOMPoint(u.x, u.y).matrixTransform(m);
            samples.push({ x: (sp.x - rect.left) * dpr, y: (sp.y - rect.top) * dpr, u });
          }
        }
        const alpha = (x, y) => {
          x = Math.round(x); y = Math.round(y);
          return x < 0 || y < 0 || x >= W || y >= H ? 0 : data[(y * W + x) * 4 + 3];
        };
        const r = (TRACK / 2) * scale * dpr * 0.6;
        const offs = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, -r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, r * 0.7]];
        const missed = samples.filter((s) => !offs.some(([dx, dy]) => alpha(s.x + dx, s.y + dy) > 40));

        const far = (TRACK * scale * dpr) ** 2;
        const step = Math.max(3, Math.round(5 * dpr));
        let inkPx = 0;
        let off = 0;
        for (let y = 0; y < H; y += step) {
          for (let x = 0; x < W; x += step) {
            if (data[(y * W + x) * 4 + 3] < 40) continue;
            inkPx++;
            let best = Infinity;
            for (const s of samples) {
              const d = (s.x - x) ** 2 + (s.y - y) ** 2;
              if (d < best) best = d;
              if (best < far) break;
            }
            if (best >= far) off++;
          }
        }
        return { cover: 1 - missed.length / samples.length, off: inkPx ? off / inkPx : 0, missed };
      }

      function check() {
        if (locked) return;
        if (!ink.hasInk()) {
          sfx.boing();
          api.say(`Trace the ${Word(n).toLowerCase()} with your pencil first!`);
          return;
        }
        const res = score();
        if ((res.cover >= PASS_COVER && res.off <= PASS_OFF) || tries >= 2) {
          locked = true;
          missedLayer.replaceChildren();
          road.forEach((p) => { p.style.transition = 'stroke .5s'; p.style.stroke = '#ffcc33'; });
          sfx.ding();
          const r = board.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 70);
          setTimeout(() => api.win({ num: n, praise: `Yes! That is ${Word(n).toLowerCase()}! ${api.great()}` }), 650);
          return;
        }
        tries++;
        api.mistake();
        sfx.boing();
        // Show the parts he still needs to colour as orange dots.
        missedLayer.replaceChildren(...res.missed.filter((_, k) => k % 2 === 0).map((s) =>
          h('circle', { cx: s.u.x, cy: s.u.y, r: 5, fill: '#ff8c42', stroke: '#fff', 'stroke-width': 1.5 })));
        api.say(res.cover < PASS_COVER ? 'Almost! Colour the orange dots too!' : 'Almost! Stay on the number. Try again!');
        if (res.cover >= PASS_COVER) ink.clear();
      }

      const prompt = `Trace the number ${Word(n).toLowerCase()} with your pencil!`;
      api.setPrompt(prompt);
      (async () => {
        api.say(i === 0 ? `This is ${Word(n).toLowerCase()}. Watch me first!` : `This is ${Word(n).toLowerCase()}. Watch!`);
        await demo();
        if (my === token) api.say(i === 0 ? 'Your turn! Trace it with your pencil, then press the green button.' : 'Your turn!');
      })();
    }

    return {
      round,
      destroy() { token++; if (onResize) removeEventListener('resize', onResize); },
    };
  },
};
