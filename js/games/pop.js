// 5. Balloon Pop: balloons with numbers float up. Pop the one with the number shown (and said) at the top.
import { h, Word, rand, pick, clamp, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';

const COLORS = ['#e63946', '#ff8c42', '#ffcc33', '#2ecc71', '#3fa9f5', '#9b5de5', '#ff5fa2', '#00c2a8'];
const LANES = 6;

export default {
  id: 'pop',
  title: 'Balloons',
  emoji: '🎈',
  color: '#9b5de5',
  create(api) {
    let field = null;
    let pill = null;
    let target = 0;
    let busy = false;
    let balloons = [];
    let raf = 0;
    let last = 0;
    let spawnIn = 0;
    let sinceTarget = 0;
    let recentLanes = [];

    function spawn() {
      const w = field.clientWidth;
      const hgt = field.clientHeight;
      const size = clamp(Math.min(w / 7, hgt / 4.6), 72, 140);
      const onScreen = balloons.some((b) => b.n === target && !b.dead);
      const n = (!onScreen && sinceTarget >= 1) || Math.random() < 0.3
        ? target
        : pick([...Array(10)].map((_, i) => i + 1).filter((v) => v !== target));
      sinceTarget = n === target ? 0 : sinceTarget + 1;
      const lanes = [...Array(LANES).keys()].filter((l) => !recentLanes.includes(l));
      const lane = pick(lanes);
      recentLanes = [lane, ...recentLanes].slice(0, 3);
      const laneW = (w - size) / LANES;
      const b = {
        n, size, dead: false,
        x0: size / 2 + laneW * (lane + 0.5) + rand(-laneW * 0.2, laneW * 0.2),
        y: hgt + 20,
        vy: hgt / rand(8, 10.5),
        amp: rand(8, 20),
        ph: rand(0, 6),
        color: pick(COLORS),
      };
      b.el = h('div', { class: 'balloon', style: `--sz:${size}px;--c:${b.color}` }, h('span', { class: 'inner' }, String(n)));
      b.el.addEventListener('pointerdown', () => tap(b));
      field.append(b.el);
      balloons.push(b);
    }

    function tap(b) {
      if (b.dead || busy) return;
      if (b.n === target) {
        busy = true;
        b.dead = true;
        b.el.classList.add('popped');
        sfx.pop();
        const r = b.el.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 60, [b.color, '#ffffff', '#ffcc33']);
        setTimeout(() => b.el.remove(), 260);
        setTimeout(() => api.win({ num: target, praise: `Pop! ${Word(target)}! ${api.great()}` }), 350);
      } else {
        replay(b.el, 'nope');
        sfx.boing();
        api.mistake();
        api.say(`That's ${Word(b.n).toLowerCase()}. Find ${Word(target).toLowerCase()}!`);
      }
    }

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      spawnIn -= dt;
      if (spawnIn <= 0 && balloons.filter((b) => !b.dead).length < 7) {
        spawn();
        spawnIn = rand(1.1, 1.6);
      }
      for (const b of balloons) {
        if (b.dead) continue;
        b.y -= b.vy * dt;
        const x = b.x0 + Math.sin(t / 700 + b.ph) * b.amp;
        b.el.style.transform = `translate(${x - b.size / 2}px, ${b.y}px)`;
        if (b.y < -b.size * 2.4) { b.dead = true; b.el.remove(); }
      }
      balloons = balloons.filter((b) => !b.dead);
      raf = requestAnimationFrame(frame);
    }

    function round(i) {
      target = api.deck[i];
      sinceTarget = 1;
      busy = false;
      if (!field) {
        field = h('div', { class: 'sky-field' });
        pill = h('div', { class: 'target-pill' });
        api.stage.replaceChildren(field, pill);
        last = performance.now();
        // Start with a few balloons already in the air.
        for (let k = 0; k < 3; k++) {
          spawn();
          const b = balloons[balloons.length - 1];
          b.y = field.clientHeight * (0.35 + k * 0.22);
        }
        raf = requestAnimationFrame(frame);
      }
      pill.replaceChildren('🎈', String(target));
      replay(pill, 'new');
      const prompt = `Pop number ${Word(target).toLowerCase()}!`;
      api.setPrompt(prompt);
      api.say(i === 0 ? `Pop the balloon with number ${Word(target).toLowerCase()}!` : `Now pop number ${Word(target).toLowerCase()}!`);
    }

    return {
      round,
      destroy() { cancelAnimationFrame(raf); },
    };
  },
};
