// Omar: mazes. Draw a path with the pencil (or a finger) from the start to the goal; the hero walks along it
// cell by cell and can't go through walls. Going back over the path rubs it out.
// Maze: Shadow to the gem. Snack Maze: a hungry animal to its food, picking up 3 stars (counted) on the way.
// Each round makes a new maze, a little bigger than the last.
import { h, shuffle, sleep } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { attachInk } from '../ink.js';
import { L } from '../lines.js';
import { FOODS } from '../puzzles.js';

const U = 10; // one cell, in SVG units

// A perfect maze (one way between any two cells), dug with a random depth-first walk.
// open[k] = the cells next to cell k with no wall in between.
function makeMaze(cols, rows) {
  const open = [...Array(cols * rows)].map(() => new Set());
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const k = stack[stack.length - 1];
    const c = k % cols;
    const r = Math.floor(k / cols);
    const next = shuffle([[c, r - 1], [c + 1, r], [c, r + 1], [c - 1, r]])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < cols && y < rows && !seen.has(y * cols + x));
    if (!next.length) { stack.pop(); continue; }
    const [x, y] = next[0];
    const j = y * cols + x;
    open[k].add(j);
    open[j].add(k);
    seen.add(j);
    stack.push(j);
  }
  return open;
}

// The way from cell a to cell b (a list of cells).
function solve(open, a, b) {
  const prev = new Map([[a, -1]]);
  const queue = [a];
  while (queue.length) {
    const k = queue.shift();
    if (k === b) break;
    for (const j of open[k]) if (!prev.has(j)) { prev.set(j, k); queue.push(j); }
  }
  const way = [];
  for (let k = b; k !== -1; k = prev.get(k)) way.unshift(k);
  return way;
}

function mazeGame({ id, title, icon, color, sizes, snack }) {
  return {
    id, title, icon, color,
    create(api) {
      let onResize = null;
      let lastWall = 0;
      let lastStart = 0;
      const animals = shuffle(FOODS);

      function round(i) {
        const st = api.stage.getBoundingClientRect();
        let [cols, rows] = sizes[i] || sizes[sizes.length - 1];
        if (st.height > st.width * 1.1) [cols, rows] = [rows, cols];
        const open = makeMaze(cols, rows);
        const goal = cols * rows - 1;
        const who = snack ? animals[i % animals.length] : null;
        const animal = who?.name.toLowerCase();
        const food = who?.food.name.toLowerCase();

        const svg = h('svg', { viewBox: `-3 -3 ${cols * U + 6} ${rows * U + 6}`, preserveAspectRatio: 'xMidYMid meet' });
        const canvas = h('canvas');
        api.stage.replaceChildren(h('div', { class: 'maze-board' }, svg, canvas));

        // Walls: the top and left side of every cell that has no opening there, plus the outer bottom and right.
        let d = `M0 ${rows * U}H${cols * U}V0`;
        for (let k = 0; k < cols * rows; k++) {
          const x = (k % cols) * U;
          const y = Math.floor(k / cols) * U;
          if (y === 0 || !open[k].has(k - cols)) d += `M${x} ${y}h${U}`;
          if (x === 0 || !open[k].has(k - 1)) d += `M${x} ${y}v${U}`;
        }
        const mid = (k) => ({ x: (k % cols + 0.5) * U, y: (Math.floor(k / cols) + 0.5) * U });
        svg.append(
          h('rect', { x: -1.5, y: -1.5, width: cols * U + 3, height: rows * U + 3, rx: 3, class: 'maze-floor' }),
          h('circle', { cx: mid(goal).x, cy: mid(goal).y, r: U * 0.42, class: 'maze-goal-glow' }));
        const trail = svg.appendChild(h('polyline', { class: 'maze-trail', fill: 'none' }));
        svg.append(h('path', { d, class: 'maze-walls', fill: 'none' }));

        const g = mid(goal);
        svg.append(h('image', { href: `img/icons/${snack ? who.food.icon : 'gem'}.svg`, x: g.x - 4, y: g.y - 4, width: 8, height: 8, class: 'goal' }));

        // Snack Maze: 3 stars along the way to the food.
        const way = solve(open, 0, goal);
        const stars = !snack ? [] : [0.25, 0.5, 0.75].map((f) => way[Math.round(f * (way.length - 1))])
          .filter((k, n, a) => k !== 0 && k !== goal && a.indexOf(k) === n)
          .map((k) => ({ k, got: false, el: svg.appendChild(h('image', { href: 'img/icons/star.svg', x: mid(k).x - 2.6, y: mid(k).y - 2.6, width: 5.2, height: 5.2, class: 'road-star' })) }));

        const heroImg = snack
          ? h('image', { href: `img/icons/${who.icon}.svg`, x: -4.2, y: -4.2, width: 8.4, height: 8.4 })
          : h('image', { href: `img/chars/${api.kid.hero}.webp`, x: -3, y: -5.2, width: 6, height: 8.6 });
        const heroEl = svg.appendChild(h('g', { class: 'maze-hero' }, h('g', { class: 'maze-hero-in' }, heroImg)));

        const path = [0];
        let done = false;
        const draw = () => {
          trail.setAttribute('points', path.map((k) => `${mid(k).x},${mid(k).y}`).join(' '));
          const p = mid(path[path.length - 1]);
          heroEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
        };
        draw();

        let last = null;
        const ink = attachInk(canvas, {
          color: () => 'rgba(91,63,209,.35)',
          width: () => 6,
          onPoint: (x, y, type) => follow(x, y, type === 'down'),
          onEnd: () => { last = null; setTimeout(() => ink.clear(), 200); },
        });
        if (onResize) removeEventListener('resize', onResize);
        onResize = () => ink.resize();
        addEventListener('resize', onResize);

        // Walk the pencil's way in small steps, so a fast stroke never skips a cell (or jumps a wall).
        function follow(x, y, isDown) {
          if (done) return;
          const r = canvas.getBoundingClientRect();
          const p = new DOMPoint(r.left + x, r.top + y).matrixTransform(svg.getScreenCTM().inverse());
          if (isDown || !last) {
            const hp = mid(path[path.length - 1]);
            if (Math.hypot(p.x - hp.x, p.y - hp.y) > U * 1.6 && performance.now() - lastStart > 5000) {
              lastStart = performance.now();
              api.say(snack ? L.maze.start(animal) : L.maze.startHero(api.kid.heroName));
            }
            last = p;
          }
          const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / (U / 4)));
          for (let s = 1; s <= steps && !done; s++) {
            visit(last.x + ((p.x - last.x) * s) / steps, last.y + ((p.y - last.y) * s) / steps);
          }
          last = p;
        }

        function visit(px, py) {
          const c = Math.floor(px / U);
          const r = Math.floor(py / U);
          if (c < 0 || r < 0 || c >= cols || r >= rows) return;
          const k = r * cols + c;
          const cur = path[path.length - 1];
          if (k === cur) return;
          if (path.length > 1 && k === path[path.length - 2]) { path.pop(); draw(); return; }
          if (open[cur].has(k)) {
            path.push(k);
            draw();
            sfx.note(Math.min(path.length, 10) - 1);
            const star = stars.find((s) => s.k === k && !s.got);
            if (star) {
              star.got = true;
              star.el.classList.add('got');
              api.say(L.num(stars.filter((s) => s.got).length));
            }
            if (k === goal) finish();
            return;
          }
          // Pencil inside the next cell, but there is a wall in between.
          const cc = cur % cols;
          const cr = Math.floor(cur / cols);
          const m = mid(k);
          if (Math.abs(c - cc) + Math.abs(r - cr) === 1 && Math.hypot(px - m.x, py - m.y) < U * 0.35 && performance.now() - lastWall > 4000) {
            lastWall = performance.now();
            sfx.boing();
            api.say(L.maze.wall);
          }
        }

        async function finish() {
          done = true;
          sfx.ding();
          const r = svg.getBoundingClientRect();
          const vb = svg.viewBox.baseVal;
          const s = Math.min(r.width / vb.width, r.height / vb.height);
          burst(r.left + (r.width - vb.width * s) / 2 + (g.x - vb.x) * s, r.top + (r.height - vb.height * s) / 2 + (g.y - vb.y) * s, 70);
          heroEl.classList.add('cheer');
          await sleep(700);
          api.win({ emoji: snack ? who.food.icon : 'gem', praise: snack ? [L.maze.yum, who.said, api.great()] : [L.roads.made, api.great()] });
        }

        const prompt = snack ? L.maze.snackShort(food) : L.maze.prompt;
        api.setPrompt(prompt);
        api.say(snack ? L.maze.snack(animal, food) : i === 0 ? L.maze.intro(api.kid.heroName) : prompt);
      }

      return { round, destroy() { if (onResize) removeEventListener('resize', onResize); } };
    },
  };
}

export const maze = mazeGame({
  id: 'maze', title: 'Maze', icon: 'maze', color: '#e63946',
  sizes: [[3, 2], [4, 3], [5, 3], [5, 4], [6, 4]],
});
export const snackmaze = mazeGame({
  id: 'snackmaze', title: 'Snack Maze', icon: 'carrot', color: '#00c2a8', snack: true,
  sizes: [[4, 3], [4, 3], [5, 3], [5, 4], [6, 4]],
});
