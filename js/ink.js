// Pencil / finger drawing on a canvas, with simple palm rejection:
// after the pencil touches the screen, finger (palm) touches are ignored for a few seconds.
export function attachInk(canvas, { color = () => '#fff', width = () => 20, onPoint, onStart, onEnd } = {}) {
  const c = canvas.getContext('2d', { willReadFrequently: true });
  let dpr = 1;
  let active = null;
  let activeType = null;
  let last = null;
  let lastPen = -1e9;
  let inked = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    inked = false;
  }

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function down(e) {
    const now = performance.now();
    if (e.pointerType === 'pen') lastPen = now;
    else if (e.pointerType === 'touch' && now - lastPen < 3000) return; // palm while pencil is in use
    if (active !== null && !(e.pointerType === 'pen' && activeType !== 'pen')) return;
    e.preventDefault();
    active = e.pointerId;
    activeType = e.pointerType;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    last = pos(e);
    c.fillStyle = color();
    c.beginPath();
    c.arc(last.x, last.y, width() / 2, 0, Math.PI * 2);
    c.fill();
    inked = true;
    onStart?.();
    onPoint?.(last.x, last.y, 'down');
  }

  function move(e) {
    if (e.pointerType === 'pen') lastPen = performance.now();
    if (e.pointerId !== active) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    c.strokeStyle = color();
    c.lineWidth = width();
    for (const ev of evs.length ? evs : [e]) {
      const p = pos(ev);
      c.beginPath();
      c.moveTo(last.x, last.y);
      c.lineTo(p.x, p.y);
      c.stroke();
      last = p;
      onPoint?.(p.x, p.y, 'move');
    }
  }

  function up(e) {
    if (e.pointerId !== active) return;
    active = null;
    onEnd?.();
  }

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  resize();

  return {
    ctx: c,
    get dpr() { return dpr; },
    hasInk: () => inked,
    clear() { c.clearRect(0, 0, canvas.width, canvas.height); inked = false; },
    resize,
  };
}
