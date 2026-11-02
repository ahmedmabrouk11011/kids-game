// The "you did it!" screen after each correct answer: a big bouncing number, fireworks,
// and stars and balloons floating up that the kid can pop. Tap ▶ (or wait) to go on.
import { h, rand, pick } from './util.js';
import { sfx } from './sound.js';
import { burst, rain, firework } from './fx.js';

const FLOATERS = ['⭐', '🎈', '🌟', '💖', '🍭', '🎈', '⭐'];
let current = null;

export function closeReward() { current?.(true); }

export function showReward({ num, emoji, autoMs = 9000 } = {}) {
  closeReward();
  return new Promise((resolve) => {
    const overlay = document.getElementById('overlay');
    const box = h('div', { class: 'reward' });
    const score = h('div', { class: 'score' });
    const next = h('button', { class: 'next-btn', 'aria-label': 'Next' }, '▶');
    box.append(
      h('div', { class: 'hero' },
        h('div', { class: 'hero-num' }, emoji || String(num)),
        num ? h('div', { class: 'hero-sub' }, '⭐'.repeat(num)) : null),
      h('div', { class: 'hint' }, '👆 🎈 ⭐'),
      score, next);
    overlay.append(box);

    rain(140);
    sfx.tada();
    const timers = [300, 800, 1400].map((t) => setTimeout(() => {
      firework(rand(innerWidth * 0.15, innerWidth * 0.85), rand(innerHeight * 0.15, innerHeight * 0.5));
      sfx.sparkle();
    }, t));

    let popped = 0;
    let floaters = [];
    let spawnIn = 0;
    let last = performance.now();
    let raf;

    function spawn() {
      const size = rand(56, 92);
      const el = h('div', { class: 'floater', style: `--sz:${size}px` }, pick(FLOATERS));
      const f = { el, x0: rand(size, innerWidth - size), y: innerHeight + size, vy: rand(70, 120), amp: rand(10, 30), ph: rand(0, 6), size };
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        el.classList.add('popped');
        sfx.pop();
        const r = el.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 26);
        popped++;
        score.textContent = `💥 ${popped}`;
        f.dead = true;
        setTimeout(() => el.remove(), 260);
      });
      box.append(el);
      floaters.push(f);
    }

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      spawnIn -= dt;
      if (spawnIn <= 0 && floaters.length < 12) { spawn(); spawnIn = 0.45; }
      for (const f of floaters) {
        if (f.dead) continue;
        f.y -= f.vy * dt;
        const x = f.x0 + Math.sin(t / 600 + f.ph) * f.amp;
        f.el.style.transform = `translate(${x - f.size / 2}px, ${f.y}px)`;
        if (f.y < -f.size * 1.5) { f.dead = true; f.el.remove(); }
      }
      floaters = floaters.filter((f) => !f.dead);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const auto = setTimeout(() => finish(), autoMs);
    next.addEventListener('click', () => { sfx.whoosh(); finish(); });

    function finish(silent) {
      if (current !== finish) return;
      current = null;
      clearTimeout(auto);
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      if (silent) { box.remove(); resolve(false); return; }
      box.classList.add('out');
      setTimeout(() => { box.remove(); resolve(true); }, 340);
    }
    current = finish;
  });
}
