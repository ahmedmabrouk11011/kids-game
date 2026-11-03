// Omar: matching games. Two columns of cards; draw a line from a card to its partner on the other side
// (pencil or finger), or tap one card and then its partner. A right match stays as a coloured line.
// Who Eats What?, Count & Match (a group of things and its number), Find the Shadow and Colors.
import { h, icon, shuffle, sleep, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { attachInk } from '../ink.js';
import { L } from '../lines.js';
import { ITEMS } from '../items.js';
import { FOODS, FOOD_CLASH, SHAPES, COLORS, shadowSaid, colorSaid } from '../puzzles.js';

const LINE_COLORS = ['#ff5fa2', '#3fa9f5', '#2ecc71', '#ff8c42', '#9b5de5'];
const PAIRS = [3, 3, 4, 4, 4];    // pairs in each round: 3 to start, then 4
const COUNT_MAX = [4, 5, 6, 7, 8]; // Count & Match: biggest number in each round
const NEAR = 22;                   // px around a card that still counts as touching it

// One side of a pair. kind: 'pic' (a picture), 'shadow' (its black outline), 'group' (n pictures),
// 'num' (a big number) or 'swatch' (a paint blob).
const pic = (ic, name) => ({ kind: 'pic', icon: ic, name });

function feedPairs(n) {
  const out = [];
  for (const f of shuffle(FOODS)) {
    if (out.length === n) break;
    if (out.some((o) => FOOD_CLASH.some(([a, b]) => (a === o.id && b === f.id) || (b === o.id && a === f.id)))) continue;
    out.push(f);
  }
  return out.map((f) => ({ id: f.id, L: pic(f.icon, f.name), R: pic(f.food.icon, f.food.name), said: f.said }));
}

function countPairs(n, i) {
  const nums = shuffle([...Array(COUNT_MAX[i])].map((_, k) => k + 1)).slice(0, n);
  const kinds = shuffle(ITEMS);
  return nums.map((num, k) => ({
    id: num,
    L: { kind: 'group', icon: kinds[k].icon, num },
    R: { kind: 'num', num, name: L.num(num) },
    said: L.count.got(num, kinds[k]),
  }));
}

const shadowPairs = (n) => shuffle(SHAPES).slice(0, n).map((s) => ({
  id: s.icon, L: pic(s.icon, s.name), R: { kind: 'shadow', icon: s.icon, name: s.name }, said: shadowSaid(s),
}));

const thingName = (c) => c.thing[0].toUpperCase() + c.thing.slice(1);
const colorPairs = (n) => shuffle(COLORS).slice(0, n).map((c) => ({
  id: c.color, L: pic(c.icon, thingName(c)), R: { kind: 'swatch', hex: c.hex, name: c.color }, said: colorSaid(c),
}));

// The picture inside a card.
function face(side) {
  if (side.kind === 'pic') return icon(side.icon, 'mpic');
  if (side.kind === 'shadow') return icon(side.icon, 'mpic silhouette');
  if (side.kind === 'num') return h('div', { class: 'mnum' }, String(side.num));
  if (side.kind === 'swatch') return h('div', { class: 'mswatch', style: `--sw:${side.hex}` });
  const cols = side.num <= 3 ? side.num : side.num === 4 ? 2 : side.num <= 6 ? 3 : 4;
  return h('div', { class: 'mgroup', style: `--cols:${cols};--rows:${Math.ceil(side.num / cols)}` },
    [...Array(side.num)].map(() => icon(side.icon)));
}

function matchGame({ id, title, icon: ico, iconCls, color, pairs, intro, short, wide }) {
  return {
    id, title, icon: ico, iconCls, color,
    create(api) {
      let onResize = null;

      function round(i) {
        const n = PAIRS[i] || 4;
        const set = pairs(n, i);
        let right = shuffle(set);
        while (n > 1 && right.every((p, k) => p === set[k])) right = shuffle(set);

        const colL = h('div', { class: 'mcol left' });
        const colR = h('div', { class: 'mcol right' });
        const svg = h('svg', { class: 'mlines' });
        const canvas = h('canvas');
        const board = h('div', { class: 'match-board' + (wide ? ' wide' : '') }, colL, h('div', { class: 'mgap' }), colR, svg, canvas);
        api.stage.replaceChildren(board);

        const cards = [];
        const addCard = (pair, side, col, k) => {
          const s = pair[side];
          const el = h('div', { class: `mcard ${s.kind}`, style: `animation-delay:${k * 80 + (side === 'R' ? 160 : 0)}ms` }, face(s), h('i', { class: 'mdot' }));
          col.append(el);
          cards.push({ el, pair, side, s, done: false });
        };
        set.forEach((p, k) => addCard(p, 'L', colL, k));
        right.forEach((p, k) => addCard(p, 'R', colR, k));

        let matched = [];  // [leftCard, rightCard, colour]
        let sel = null;
        let busy = false;
        let stroke = null;
        let counting = false;

        function layout() {
          const r = board.getBoundingClientRect();
          const gap = Math.min(18, r.height * 0.03);
          const ch = Math.max(40, Math.min(170, (r.height - gap * (n + 1)) / n));
          board.style.setProperty('--ch', `${ch}px`);
          board.style.setProperty('--cwl', `${Math.min(ch * (wide ? 1.9 : 1.15), r.width * 0.34)}px`);
          board.style.setProperty('--cwr', `${Math.min(ch * 1.15, r.width * 0.3)}px`);
          ink.resize();
          drawLines();
        }

        // Card centre and dot position, in board pixels.
        const box = (c) => {
          const b = board.getBoundingClientRect();
          const r = c.el.getBoundingClientRect();
          return { l: r.left - b.left, t: r.top - b.top, r: r.right - b.left, b: r.bottom - b.top };
        };
        const dotAt = (c) => {
          const r = box(c);
          return { x: c.side === 'L' ? r.r : r.l, y: (r.t + r.b) / 2 };
        };
        function cardAt(x, y) {
          let best = null;
          for (const c of cards) {
            const r = box(c);
            const dx = Math.max(r.l - x, 0, x - r.r);
            const dy = Math.max(r.t - y, 0, y - r.b);
            if (dx <= NEAR * 1.6 && dy <= NEAR && (!best || dx + dy < best.d)) best = { c, d: dx + dy };
          }
          return best?.c || null;
        }

        function lineEl(a, b, col, extra = {}) {
          const p = dotAt(a);
          const q = dotAt(b);
          return h('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: col, 'stroke-width': 9, 'stroke-linecap': 'round', ...extra });
        }
        function drawLines() {
          svg.replaceChildren(...matched.map(([a, b, col]) => lineEl(a, b, col)));
        }

        const ink = attachInk(canvas, {
          color: () => 'rgba(255,255,255,.55)',
          width: () => 8,
          onPoint: (x, y, type) => {
            if (type === 'down') stroke = { x0: x, y0: y, x, y, from: cardAt(x, y), over: null, far: 0 };
            if (!stroke) return;
            stroke.x = x;
            stroke.y = y;
            stroke.far = Math.max(stroke.far, Math.hypot(x - stroke.x0, y - stroke.y0));
            const c = cardAt(x, y);
            if (c && stroke.from && c.side !== stroke.from.side) stroke.over = c;
          },
          onEnd: () => {
            const s = stroke;
            stroke = null;
            setTimeout(() => ink.clear(), 160);
            if (!s || busy) return;
            if (s.far < 18) { tap(s.from); return; }
            const from = s.from;
            if (!from || from.done) return;
            const end = cardAt(s.x, s.y);
            const to = end && end.side !== from.side ? end : s.over;
            if (!to || to.done) return;
            unselect();
            check(from, to);
          },
        });
        if (onResize) removeEventListener('resize', onResize);
        onResize = () => layout();
        addEventListener('resize', onResize);
        layout();

        function unselect() {
          sel?.el.classList.remove('sel');
          sel = null;
        }

        function tap(c) {
          if (!c || c.done) return;
          if (sel && sel.side !== c.side) {
            const a = sel;
            unselect();
            check(a, c);
            return;
          }
          unselect();
          sel = c;
          c.el.classList.add('sel');
          replay(c.el, 'mjump');
          sfx.note(cards.indexOf(c) % 8);
          if (c.s.kind === 'group') countTogether(c);
          else if (c.s.name) api.say(L.match.name(c.s.name));
        }

        // Count the pictures in a group card one by one, with the voice.
        async function countTogether(c) {
          if (counting) return;
          counting = true;
          const els = [...c.el.querySelectorAll('.mgroup .ico')];
          els.forEach((e) => e.classList.remove('counted'));
          for (let k = 0; k < els.length && api.alive(); k++) {
            els[k].classList.add('counted');
            sfx.note(k);
            api.say(L.num(k + 1));
            await sleep(650);
          }
          counting = false;
        }

        function check(a, b) {
          const [l, r] = a.side === 'L' ? [a, b] : [b, a];
          if (l.pair === r.pair) good(l, r);
          else bad(l, r);
        }

        async function good(l, r) {
          const col = LINE_COLORS[matched.length % LINE_COLORS.length];
          l.done = r.done = true;
          for (const c of [l, r]) {
            c.el.classList.add('done');
            c.el.style.setProperty('--mc', col);
            replay(c.el, 'mjump');
          }
          matched.push([l, r, col]);
          const ln = lineEl(l, r, col);
          svg.append(ln);
          const len = Math.hypot(ln.x2.baseVal.value - ln.x1.baseVal.value, ln.y2.baseVal.value - ln.y1.baseVal.value);
          ln.animate([{ strokeDasharray: `0 ${len}` }, { strokeDasharray: `${len} 0` }], { duration: 260 });
          sfx.ding();
          const p = dotAt(r);
          const b = board.getBoundingClientRect();
          burst(b.left + p.x, b.top + p.y, 40, [col, '#ffffff']);
          if (matched.length < n) { api.say(l.pair.said); return; }
          busy = true;
          await api.say(l.pair.said);
          await sleep(300);
          api.win({ emoji: l.s.icon || 'star', praise: [L.match.all, api.great()] });
        }

        function bad(l, r) {
          sfx.boing();
          api.mistake();
          const ln = svg.appendChild(lineEl(l, r, '#e63946', { 'stroke-dasharray': '4 14', opacity: 0.9 }));
          ln.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 900, fill: 'forwards' }).onfinish = () => ln.remove();
          for (const c of [l, r]) { replay(c.el, 'shake'); setTimeout(() => c.el.classList.remove('shake'), 520); }
          if (l.s.kind === 'group') { api.say(L.howmany.together).then((ok) => ok && countTogether(l)); return; }
          api.say(L.match.notThat);
        }

        api.setPrompt(short);
        api.say(i === 0 ? intro : short);
      }

      return { round, destroy() { if (onResize) removeEventListener('resize', onResize); } };
    },
  };
}

export const feed = matchGame({
  id: 'feed', title: 'Who Eats What?', icon: 'monkeyface', color: '#ff8c42',
  pairs: feedPairs, intro: L.match.feed, short: L.match.feedShort,
});
export const countmatch = matchGame({
  id: 'countmatch', title: 'Count & Match', icon: 'banana', color: '#3fa9f5',
  pairs: countPairs, intro: L.match.count, short: L.match.countShort, wide: true,
});
export const shadows = matchGame({
  id: 'shadows', title: 'Find the Shadow', icon: 'rabbit', iconCls: 'silhouette', color: '#9b5de5',
  pairs: shadowPairs, intro: L.match.shadow, short: L.match.shadowShort,
});
export const colors = matchGame({
  id: 'colors', title: 'Colors', icon: 'rainbow', color: '#2ecc71',
  pairs: colorPairs, intro: L.match.color, short: L.match.colorShort,
});
