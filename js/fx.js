// Confetti and fireworks on one full-screen canvas.
const canvas = document.getElementById('confetti');
const c = canvas.getContext('2d');
const COLORS = ['#ffcc33', '#e63946', '#2ecc71', '#3fa9f5', '#ff5fa2', '#9b5de5', '#ff8c42', '#ffffff'];
let parts = [];
let running = false;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
}
addEventListener('resize', resize);
resize();

function add(p) {
  parts.push({
    rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    size: 6 + Math.random() * 8, color: COLORS[(Math.random() * COLORS.length) | 0],
    shape: Math.random() < 0.5 ? 'rect' : 'circle', life: 1, decay: 0.006 + Math.random() * 0.006,
    g: 0.32, drag: 0.985, ...p,
  });
}

export function burst(x, y, n = 60, colors) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 3 + Math.random() * 10;
    add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, ...(colors && { color: colors[i % colors.length] }) });
  }
  run();
}

export function rain(n = 160) {
  for (let i = 0; i < n; i++) {
    add({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, g: 0.08, decay: 0.003 });
  }
  run();
}

export function firework(x, y) {
  const color = COLORS[(Math.random() * 7) | 0];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    add({ x, y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, color, shape: 'circle', size: 6, g: 0.12, drag: 0.96, decay: 0.014 });
  }
  run();
}

export function clearFx() { parts = []; }

function run() {
  if (running) return;
  running = true;
  requestAnimationFrame(step);
}

function step() {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of parts) {
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
    p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
    c.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    c.fillStyle = p.color;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    if (p.shape === 'rect') c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    else { c.beginPath(); c.arc(0, 0, p.size / 2, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
  if (parts.length) requestAnimationFrame(step);
  else { running = false; c.clearRect(0, 0, innerWidth, innerHeight); }
}
