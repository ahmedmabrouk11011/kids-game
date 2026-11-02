// Youssef 5. Number Train: a train of numbers up to 100 with one empty wagon. Type the missing number.
// Rounds: count by 1, across a ten, by 10s, by 2s or 5s, then up to 100 or backwards.
import { h, icon } from '../util.js';
import { sfx } from '../sound.js';
import { keypad, qaLayout } from '../keypad.js';
import { trainSequence } from '../mathgen.js';
import { L } from '../lines.js';

const WAGONS = ['#e63946', '#ff8c42', '#ffcc33', '#2ecc71', '#3fa9f5'];

export default {
  id: 'train',
  title: 'Number Train',
  icon: 'train',
  color: '#ff8c42',
  create(api) {
    function round(i) {
      const s = trainSequence(i);
      const ans = s.nums[s.missIdx];
      const slot = h('span', { class: 'slot' }, '?');
      const train = h('div', { class: 'train' },
        h('div', { class: 'engine' }, icon('train')),
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
          setTimeout(() => api.win({ text: s.nums.join(', '), praise: [L.yes, L.num(ans), api.great()] }), 1300);
          return;
        }
        api.mistake();
        sfx.boing();
        pad.wrong();
        api.say(s.step === -1 ? L.train.down : L.train.up(s.step));
      }

      // Read the train out number by number, with "What?" for the empty wagon.
      const said = s.nums.map((n, k) => (k === s.missIdx ? L.train.what : L.num(n)));
      api.setPrompt(said);
      api.say(i === 0 ? [L.train.intro, said] : said);
    }

    return { round };
  },
};
