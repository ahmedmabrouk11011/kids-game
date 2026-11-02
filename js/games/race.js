// Youssef 4. Math Race: 10 quick sums. Each answer makes the kid's hero dash one step closer to the flag.
// Harder as it goes: + within 10, − within 10, teens, make 10, doubles (see mathgen.js).
import { h, icon, hero, replay } from '../util.js';
import { sfx } from '../sound.js';
import { keypad, qaLayout } from '../keypad.js';
import { raceQuestion } from '../mathgen.js';
import { L } from '../lines.js';

const STEPS = 10;

// The question as text, with the answer slot in place of the "?".
export function sumEl(q, slot) {
  return q.makeTen
    ? h('div', { class: 'big-eq' }, `${q.a} + `, slot, ' = 10')
    : h('div', { class: 'big-eq' }, `${q.a} ${q.op} ${q.b} = `, slot);
}

export default {
  id: 'race',
  title: 'Math Race',
  icon: 'flag',
  color: '#e63946',
  rounds: STEPS,
  create(api) {
    let runner = null;
    const place = (step) => { runner.style.left = `calc(${(step / STEPS) * 100}% - ${(step / STEPS) * 80}px)`; };

    function round(i) {
      const q = raceQuestion(i);
      let tries = 0;

      runner = h('div', { class: 'runner' }, hero(api.kid.hero), icon('dash', 'puff'));
      const track = h('div', { class: 'track' }, h('div', { class: 'road' }), icon('flag', 'flag'), runner);
      place(i);

      const slot = h('span', { class: 'slot' }, '?');
      const pad = keypad({ slot, maxLen: 2, onSubmit: check });
      qaLayout(api.stage, h('div', { class: 'race-wrap' }, track, sumEl(q, slot)), pad.el);

      function dash() {
        replay(runner, 'dash');
        sfx.whoosh();
        place(i + 1);
      }

      function check(v) {
        if (v === q.ans) {
          pad.lock();
          slot.classList.add('right');
          dash();
          api.win({ quick: true, praise: i === STEPS - 1 ? L.race.won : api.great() });
          return;
        }
        api.mistake();
        sfx.boing();
        tries++;
        if (tries < 2) { pad.wrong(); api.say(L.tryAgain); return; }
        // Second miss: show the answer, say it, and move on.
        pad.lock();
        pad.set(q.ans);
        slot.classList.add('shown');
        dash();
        api.win({ quick: true, quiet: true, praise: L.race.answerIs(q.ans) });
      }

      api.setPrompt(L.race.question(q));
      api.say(i === 0 ? [L.race.go, L.race.question(q)] : L.race.question(q));
    }

    return { round };
  },
};
