export const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const Word = (n) => WORDS[n][0].toUpperCase() + WORDS[n].slice(1);

export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tiny element builder: h('div', {class: 'x', style: '--c:red', onclick: fn}, child, ...)
export function h(tag, props = {}, ...kids) {
  const svg = ['svg', 'g', 'path', 'circle', 'polygon', 'polyline', 'line', 'text', 'rect'].includes(tag);
  const el = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.setAttribute('class', v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

// Restart a CSS animation class on an element.
export function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Spread n things over a w x h box: a loose grid with a few spare cells and some jitter,
// so the items look scattered but never overlap (easy to count for a 3-year-old).
export function scatter(n, w, h, maxSize = 150) {
  const cellsWanted = Math.min(n + 2, 12);
  let best = { cell: 0, cols: 1, rows: 1 };
  for (let cols = 1; cols <= cellsWanted; cols++) {
    const rows = Math.ceil(cellsWanted / cols);
    const cell = Math.min(w / cols, h / rows);
    if (cell > best.cell) best = { cell, cols, rows };
  }
  const { cell, cols, rows } = best;
  const size = Math.min(cell * 0.74, maxSize);
  const offX = (w - cols * cell) / 2;
  const offY = (h - rows * cell) / 2;
  const slack = (cell - size) / 2;
  const cells = shuffle([...Array(cols * rows).keys()]).slice(0, n);
  const pts = cells.map((c) => ({
    x: offX + (c % cols + 0.5) * cell + rand(-slack, slack) * 0.8,
    y: offY + (Math.floor(c / cols) + 0.5) * cell + rand(-slack, slack) * 0.8,
  }));
  return { size, pts };
}
