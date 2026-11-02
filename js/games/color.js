// Coloring (Omar): the pages from his own Shadow coloring book.
// A tap fills a space; drawing with the pencil colours inside the lines only (it never goes over a line).
import { h, icon, glyph, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { L } from '../lines.js';

const PAGES = 10;
const ASPECT = 2249 / 2855; // width / height of the book pages
const COLORS = ['#e63946', '#ff8c42', '#ffcc33', '#fff3b0', '#2ecc71', '#0b8a4b', '#3fa9f5', '#1d3f9e',
  '#9b5de5', '#ff5fa2', '#f4c095', '#8b5a2b', '#222222', '#9aa0a6', '#ffffff'];
const TAP_MOVE = 10; // css px: moving less than this is a tap (fill), more is drawing

export default {
  id: 'color',
  title: 'Coloring',
  icon: 'palette',
  color: '#ff5fa2',
  rounds: 1,
  create(api) {
    const kidId = api.kid.id;

    function round() {
      const pages = [...Array(PAGES)].map((_, k) => `img/pages/${kidId}-${String(k + 1).padStart(2, '0')}.svg`);
      api.stage.replaceChildren(h('div', { class: 'page-pick' },
        pages.map((src, k) => h('button', { class: 'thumb', style: `animation-delay:${k * 50}ms`, onclick: () => open(src) },
          h('img', { src, alt: '', draggable: 'false', loading: 'lazy' })))));
      api.setPrompt(L.color.pick);
      api.say(L.color.pick);
    }

    async function open(src) {
      sfx.ding();
      let color = COLORS[2];
      const paint = h('canvas', { class: 'paint' });
      const lineImg = h('img', { class: 'lineart', src, alt: '', draggable: 'false' });
      const board = h('div', { class: 'color-board' }, paint, lineImg);
      const swatches = COLORS.map((c) => h('button', { class: 'swatch' + (c === color ? ' sel' : ''), style: `--c:${c}`, 'aria-label': 'Colour' }));
      const undoBtn = h('button', { class: 'big-btn clear', 'aria-label': 'Undo' }, icon('back'));
      const doneBtn = h('button', { class: 'big-btn go', 'aria-label': 'Done' }, glyph('check'));
      const area = h('div', { class: 'color-area' }, board);
      api.stage.replaceChildren(h('div', { class: 'color-wrap' }, area,
        h('div', { class: 'color-tools' }, h('div', { class: 'palette' }, swatches), h('div', { class: 'row' }, undoBtn, doneBtn))));
      swatches.forEach((b, k) => b.addEventListener('click', () => {
        color = COLORS[k];
        swatches.forEach((x) => x.classList.toggle('sel', x === b));
        sfx.note(k % 10);
      }));

      // Fit the page into the free space.
      const a = area.getBoundingClientRect();
      const cssH = Math.min(a.height, a.width / ASPECT);
      const cssW = cssH * ASPECT;
      board.style.width = `${cssW}px`;
      board.style.height = `${cssH}px`;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(cssW * dpr);
      const H = Math.round(cssH * dpr);
      paint.width = W;
      paint.height = H;
      const ctx = paint.getContext('2d');

      // Find the lines, then number every closed space (flood labelling) so fills and strokes stay inside.
      const img = new Image();
      img.src = src;
      await img.decode();
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const octx = off.getContext('2d', { willReadFrequently: true });
      octx.drawImage(img, 0, 0, W, H);
      const lineA = octx.getImageData(0, 0, W, H).data;
      const labels = new Int32Array(W * H);
      const stack = new Int32Array(W * H);
      let next = 1;
      for (let i = 0; i < W * H; i++) {
        if (labels[i] || lineA[i * 4 + 3] > 110) continue;
        let top = 0;
        stack[top++] = i;
        labels[i] = next;
        while (top) {
          const p = stack[--top];
          const x = p % W;
          const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W];
          for (const q of nb) {
            if (q < 0 || q >= W * H || labels[q] || lineA[q * 4 + 3] > 110) continue;
            labels[q] = next;
            stack[top++] = q;
          }
        }
        next++;
      }

      const image = ctx.createImageData(W, H);
      const px = new Uint32Array(image.data.buffer);
      px.fill(0xffffffff);
      ctx.putImageData(image, 0, 0);
      const rgba = (hex) => {
        const n = parseInt(hex.slice(1), 16);
        return (0xff << 24 | (n & 0xff) << 16 | (n >> 8 & 0xff) << 8 | n >> 16) >>> 0; // little-endian ABGR
      };
      const undo = [];
      const save = () => { undo.push(px.slice()); if (undo.length > 8) undo.shift(); };
      undoBtn.addEventListener('click', () => {
        if (!undo.length) { sfx.boing(); return; }
        px.set(undo.pop());
        ctx.putImageData(image, 0, 0);
        sfx.whoosh();
      });

      const labelAt = (x, y) => {
        const cx = Math.round(x * dpr);
        const cy = Math.round(y * dpr);
        // On a line: take the nearest space next to it.
        for (let r = 0; r <= 8; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const X = cx + dx;
              const Y = cy + dy;
              if (X >= 0 && Y >= 0 && X < W && Y < H && labels[Y * W + X]) return labels[Y * W + X];
            }
          }
        }
        return 0;
      };

      function fill(lab) {
        if (!lab) return;
        save();
        const c = rgba(color);
        for (let i = 0; i < px.length; i++) if (labels[i] === lab) px[i] = c;
        ctx.putImageData(image, 0, 0);
        sfx.sparkle();
      }

      // A round crayon stamp, only on pixels of the space where the stroke started.
      function stamp(x, y, lab, c, rad) {
        const cx = Math.round(x * dpr);
        const cy = Math.round(y * dpr);
        const x0 = Math.max(0, cx - rad); const x1 = Math.min(W - 1, cx + rad);
        const y0 = Math.max(0, cy - rad); const y1 = Math.min(H - 1, cy + rad);
        for (let Y = y0; Y <= y1; Y++) {
          for (let X = x0; X <= x1; X++) {
            if ((X - cx) ** 2 + (Y - cy) ** 2 > rad * rad) continue;
            const i = Y * W + X;
            if (labels[i] === lab) px[i] = c;
          }
        }
        return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
      }

      // Tap = fill, drag = crayon. Palm touches are ignored while the pencil is in use.
      let active = null;
      let lastPen = -1e9;
      const pos = (e) => { const r = paint.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      paint.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'pen') lastPen = performance.now();
        else if (e.pointerType === 'touch' && performance.now() - lastPen < 3000) return;
        if (active) return;
        e.preventDefault();
        try { paint.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        const p = pos(e);
        active = { id: e.pointerId, start: p, last: p, lab: labelAt(p.x, p.y), drawing: false };
      });
      paint.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'pen') lastPen = performance.now();
        if (!active || e.pointerId !== active.id) return;
        e.preventDefault();
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of evs.length ? evs : [e]) {
          const p = pos(ev);
          if (!active.drawing) {
            if (Math.hypot(p.x - active.start.x, p.y - active.start.y) < TAP_MOVE) continue;
            active.drawing = true;
            save();
          }
          const rad = Math.round(13 * dpr);
          const c = rgba(color);
          const dist = Math.hypot(p.x - active.last.x, p.y - active.last.y);
          const steps = Math.max(1, Math.ceil(dist / 4));
          let box = null;
          for (let s = 1; s <= steps; s++) {
            const b = stamp(active.last.x + (p.x - active.last.x) * s / steps, active.last.y + (p.y - active.last.y) * s / steps, active.lab, c, rad);
            box = box ? [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[0] + box[2], b[0] + b[2]) - Math.min(box[0], b[0]), Math.max(box[1] + box[3], b[1] + b[3]) - Math.min(box[1], b[1])] : b;
          }
          ctx.putImageData(image, 0, 0, ...box);
          active.last = p;
        }
      });
      const up = (e) => {
        if (!active || e.pointerId !== active.id) return;
        if (!active.drawing) fill(active.lab);
        active = null;
      };
      paint.addEventListener('pointerup', up);
      paint.addEventListener('pointercancel', up);

      doneBtn.addEventListener('click', () => {
        sfx.ding();
        replay(board, 'jump');
        const r = board.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 3, 80);
        setTimeout(() => api.win({ emoji: 'palette', praise: [L.color.done, api.great()] }), 500);
      });

      api.setPrompt(L.color.how);
      api.say(L.color.how);
    }

    return { round };
  },
};
