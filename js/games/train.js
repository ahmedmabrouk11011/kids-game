// Youssef 5. Number Train: a train of numbers up to 100 with one empty wagon. Type the missing number.
// Rounds: count by 1, across a ten, by 10s, by 2s or 5s, then up to 100 or backwards.
import { h, randInt, pick } from '../util.js';
import { sfx } from '../sound.js';
import { keypad, qaLayout } from '../keypad.js';

const WAGONS = ['#e63946', '#ff8c42', '#ffcc33', '#2ecc71', '#3fa9f5'];

function sequence(i) {
  const run = (start, step, missIdx) => ({ nums: [...Array(5)].map((_, k) => start + k * step), missIdx, step });
  if (i === 0) return run(randInt(11, 25), 1, randInt(2, 3));
  if (i === 1) { const ten = randInt(3, 9) * 10; const start = ten - randInt(2, 3); return run(start, 1, ten - start); }
  if (i === 2) return run(randInt(1, 5) * 10, 10, randInt(1, 4));
  if (i === 3) { const step = pick([2, 5]); return run(step * randInt(1, 4), step, randInt(1, 4)); }
  return pick([
    () => run(96, 1, randInt(3, 4)),
    () => run(60, 10, 4),
    () => run(randInt(30, 90), -1, randInt(1, 3)),
  ])();
}

export default {
  id: 'train',
  title: 'Number Train',
  emoji: '🚂',
  color: '#ff8c42',
  create(api) {
    function round(i) {
      const s = sequence(i);
      const ans = s.nums[s.missIdx];
      const slot = h('span', { class: 'slot' }, '?');
      const train = h('div', { class: 'train' },
        h('div', { class: 'engine' }, '🚂'),
        s.nums.map((n, k) => h('div', { class: 'wagon', style: `--c:${WAGONS[k]}` }, k === s.missIdx ? slot : String(n))));
      const pad = keypad({ slot, maxLen: 3, onSubmit: check });
      qaLayout(api.stage, h('div', { class: 'train-wrap' }, h('div', { class: 'rails' }, train)), pad.el);
      sfx.whoosh();

      function check(v) {
        if (v === ans) {
          pad.lock();
          slot.classList.add('right');
          sfx.ding();
          setTimeout(() => { train.classList.add('leave'); sfx.whoosh(); }, 400);
          setTimeout(() => api.win({ text: s.nums.join(', '), praise: `Yes, ${ans}! ${api.great()}` }), 1300);
          return;
        }
        api.mistake();
        sfx.boing();
        pad.wrong();
        api.say(s.step === -1 ? 'Not quite. The numbers go down by one.' : `Not quite. The numbers go up by ${s.step}.`);
      }

      const said = s.nums.map((n, k) => (k === s.missIdx ? 'what' : n)).join(', ');
      api.setPrompt(`${said}?`);
      api.say(i === 0 ? `Choo choo! Which number is missing? ${said}?` : `${said}?`);
    }

    return { round };
  },
};
