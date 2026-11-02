// Youssef 4. Math Race: 10 quick sums. Each answer dashes the hedgehog one step closer to the finish flag.
// Harder as it goes: + within 10, − within 10, teens, make 10, doubles.
import { h, randInt, pick, replay } from '../util.js';
import { sfx } from '../sound.js';
import { keypad, qaLayout } from '../keypad.js';

const STEPS = 10;

function question(q) {
  if (q < 3) { const a = randInt(1, 8); const b = randInt(1, 10 - a); return [a, '+', b, a + b]; }
  if (q < 5) { const a = randInt(4, 10); const b = randInt(1, a - 1); return [a, '−', b, a - b]; }
  if (q < 7) { const a = pick([10, 11, 12, 13, 14]); const b = randInt(1, 19 - a > 9 ? 9 : 19 - a); return [a, '+', b, a + b]; }
  if (q === 7) { const a = randInt(13, 19); const b = randInt(1, a - 10); return [a, '−', b, a - b]; }
  if (q === 8) { const a = randInt(1, 9); return [a, '+', '?', 10 - a, 10]; }
  const a = randInt(3, 9);
  return [a, '+', a, a + a];
}

export default {
  id: 'race',
  title: 'Math Race',
  emoji: '🏁',
  color: '#e63946',
  rounds: STEPS,
  create(api) {
    let runner = null;
    const place = (step) => { runner.style.left = `calc(${(step / STEPS) * 100}% - ${(step / STEPS) * 64}px)`; };

    function round(i) {
      const q = question(i);
      const makeTen = q[2] === '?';
      const ans = q[3];
      let tries = 0;

      runner = h('div', { class: 'runner' }, '🦔');
      const track = h('div', { class: 'track' }, h('div', { class: 'road' }), h('div', { class: 'flag' }, '🏁'), runner);
      place(i);

      const slot = h('span', { class: 'slot' }, '?');
      const eq = makeTen
        ? h('div', { class: 'big-eq' }, `${q[0]} + `, slot, ` = ${q[4]}`)
        : h('div', { class: 'big-eq' }, `${q[0]} ${q[1]} ${q[2]} = `, slot);
      const pad = keypad({ slot, maxLen: 2, onSubmit: check });
      qaLayout(api.stage, h('div', { class: 'race-wrap' }, track, eq), pad.el);

      function dash() {
        replay(runner, 'dash');
        sfx.whoosh();
        place(i + 1);
      }

      function check(v) {
        if (v === ans) {
          pad.lock();
          slot.classList.add('right');
          dash();
          api.win({ quick: true, praise: i === STEPS - 1 ? 'You won the race!' : api.great() });
          return;
        }
        api.mistake();
        sfx.boing();
        tries++;
        if (tries < 2) { pad.wrong(); api.say('Try again!'); return; }
        // Second miss: show the answer, say it, and move on.
        pad.lock();
        pad.set(ans);
        slot.classList.add('shown');
        dash();
        const said = makeTen ? `${q[0]} plus ${ans} makes 10.` : `${q[0]} ${q[1] === '+' ? 'plus' : 'minus'} ${q[2]} is ${ans}.`;
        api.win({ quick: true, quiet: true, praise: said });
      }

      const prompt = makeTen ? `${q[0]} plus what makes 10?` : `${q[0]} ${q[1] === '+' ? 'plus' : 'minus'} ${q[2]}?`;
      api.setPrompt(prompt);
      api.say(i === 0 ? `Ready, set, go! ${prompt}` : prompt);
    }

    return { round };
  },
};
