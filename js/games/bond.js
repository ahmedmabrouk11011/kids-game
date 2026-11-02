// Youssef: Number Bond. The whole on top, two parts below; find the missing number.
// Gentle and adaptive (BOND_STEPS in mathgen.js): it starts at bonds of 3, asks for the whole before a
// missing part, shows a ten-frame of beads he can tap to count, and offers 3 answer buttons before the
// number pad. A short streak moves him up a step, two misses move him back, and his step is remembered.
import { h, icon, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { keypad, qaLayout } from '../keypad.js';
import { BOND_STEPS, bondRound, bondChoices } from '../mathgen.js';
import { store } from '../store.js';
import { L } from '../lines.js';

const COL = { w: '#ffcc33', a: '#ff5fa2', b: '#3fa9f5' };
const CHOICE_COLORS = ['#ff5fa2', '#3fa9f5', '#ff8c42'];

// The part-whole picture. miss: 'w' | 'a' | 'b' shows "?" there; null shows all three numbers (Split It).
export function bondSvg(val, miss) {
  const svg = h('svg', { class: 'bond', viewBox: '0 0 300 232' });
  svg.append(
    h('line', { x1: 150, y1: 60, x2: 70, y2: 172, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    h('line', { x1: 150, y1: 60, x2: 230, y2: 172, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round' }));
  const texts = {};
  const circles = {};
  for (const [key, cx, cy] of [['w', 150, 56], ['a', 70, 174], ['b', 230, 174]]) {
    const blank = key === miss;
    circles[key] = h('circle', { cx, cy, r: 48, class: blank ? 'bond-blank' : '', fill: blank ? '#1d3f9e' : COL[key], stroke: '#fff', 'stroke-width': 4 });
    texts[key] = h('text', { x: cx, y: cy + 2, class: 'bond-num' + (blank ? ' slot' : '') }, blank ? '?' : String(val[key]));
    svg.append(circles[key], texts[key]);
  }
  return {
    svg,
    slot: miss ? texts[miss] : null,
    fill(key) { circles[key].setAttribute('fill', COL[key]); circles[key].classList.remove('bond-blank'); },
    set(key, v) { texts[key].textContent = String(v); replay(texts[key], 'num-pop'); },
  };
}

export default {
  id: 'bond',
  title: 'Number Bond',
  icon: 'cherries',
  color: '#ff5fa2',
  create(api) {
    const kidId = api.kid.id;
    let level = store.level(kidId, 'bond');
    let streak = 0;
    let toldTap = false;

    function round(i) {
      const { st, N, a, b, miss } = bondRound(level);
      const val = { w: N, a, b };
      const answer = val[miss];
      const known = miss === 'a' ? b : a;
      let wrong = 0;
      let locked = false;

      const bond = bondSvg(val, miss);

      // Ten-frame of beads: pink = left part, blue = right part, hollow = the part to find.
      // Tap to count: all beads for a missing whole, the hollow ones for a missing part.
      let counted = 0;
      const beads = [...Array(N)].map((_, k) => {
        const part = k < a ? 'a' : 'b';
        const unknown = miss === part;
        const el = h('span', { class: `bead ${part === 'a' ? 'pa' : 'pb'}${unknown ? ' hollow' : ''}`, style: `animation-delay:${k * 40}ms` });
        if (miss === 'w' || unknown) {
          el.classList.add('tap');
          el.addEventListener('pointerdown', () => {
            if (locked || el.classList.contains('counted')) return;
            counted++;
            el.classList.add('counted');
            el.textContent = counted;
            sfx.note(counted - 1);
            api.say(L.num(counted));
          });
        }
        return el;
      });
      const frame = h('div', { class: 'beads' + (st.beads ? '' : ' hidden'), style: `grid-template-columns:repeat(${Math.min(N, 5)}, auto)` }, beads);
      const hint = st.beads ? null : h('button', { class: 'hint-btn', 'aria-label': 'Show beads' }, icon('bulb'));
      const showBeads = () => { frame.classList.remove('hidden'); hint?.remove(); };
      hint?.addEventListener('click', () => { showBeads(); sfx.sparkle(); api.say(miss === 'w' ? L.bond.tapAll : L.bond.tapEmpty); });

      // Answer: 3 big buttons in the first steps, the number pad later.
      let pad = null;
      let answerEl;
      if (st.choices) {
        const opts = bondChoices(answer, miss === 'w' ? 1 : 0, miss === 'w' ? 10 : N);
        answerEl = h('div', { class: 'choice-col' }, opts.map((v, k) => {
          const btn = h('button', { class: 'choice', style: `--c:${CHOICE_COLORS[k]};animation-delay:${200 + k * 90}ms` }, String(v));
          btn.addEventListener('click', () => check(v, btn));
          return btn;
        }));
      } else {
        pad = keypad({ slot: bond.slot, maxLen: 2, onSubmit: (v) => check(v) });
        answerEl = pad.el;
      }
      qaLayout(api.stage, h('div', { class: 'bond-wrap' }, bond.svg, h('div', { class: 'beads-row' }, frame, hint)), answerEl);

      function check(v, btn) {
        if (locked) return;
        if (v === answer) {
          locked = true;
          pad?.lock();
          btn?.classList.add('right');
          bond.slot.textContent = String(answer);
          bond.fill(miss);
          showBeads();
          beads.forEach((x) => x.classList.remove('hollow'));
          sfx.ding();
          const r = bond.svg.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 60);
          // Up a step after a short streak of first-try answers (2 in the small bonds, 3 later).
          streak = wrong ? 0 : streak + 1;
          const up = streak >= (level < 6 ? 2 : 3) && level < BOND_STEPS.length - 1;
          if (up) { level++; streak = 0; store.setLevel(kidId, 'bond', level); }
          setTimeout(() => api.win({ text: `${a} + ${b} = ${N}`, praise: [L.yes, L.makes(a, b, N), up ? L.bond.levelUp : api.great()] }), 600);
          return;
        }
        wrong++;
        streak = 0;
        api.mistake();
        sfx.boing();
        if (btn) btn.classList.add('wrong'); else pad.wrong();
        showBeads();
        // Two misses: the next question is one step easier (he never sees a "level down").
        if (wrong === 2 && level > 0) { level--; store.setLevel(kidId, 'bond', level); }
        const hintLine = miss === 'w' ? L.bond.wrongWhole : L.bond.wrongPart;
        api.say(toldTap ? hintLine : [hintLine, miss === 'w' ? L.bond.tapAll : L.bond.tapEmpty]);
        toldTap = true;
      }

      const prompt = miss === 'w' ? L.bond.whole(a, b) : L.bond.part(N, known);
      api.setPrompt(prompt);
      api.say(i === 0 && level < 2 ? [L.bond.intro, prompt] : prompt);
    }

    return { round };
  },
};
