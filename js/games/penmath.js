// Youssef: Pen Math. A sum on top; he writes the answer with the pencil, one digit per box.
// Each box reads his digit (recognizer.js) and shows what it read; the sponge clears it, ✔ checks.
import { h, icon, glyph, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { attachInk } from '../ink.js';
import { readDigit } from '../recognizer.js';
import { penQuestion } from '../mathgen.js';
import { L } from '../lines.js';
import { sumEl } from './race.js';

const READ_AFTER_MS = 750; // wait this long after the last stroke before reading the digit

export default {
  id: 'penmath',
  title: 'Pen Math',
  icon: 'writing',
  color: '#00c2a8',
  create(api) {
    let timers = [];

    function round(i) {
      timers.forEach(clearTimeout);
      timers = [];
      const q = penQuestion(i);
      const digits = String(q.ans).split('').map(Number);
      let tries = 0;
      let locked = false;

      const boxes = digits.map((expected) => {
        const canvas = h('canvas');
        const read = h('span', { class: 'read' });
        const el = h('div', { class: 'wbox' }, canvas, read);
        return { el, canvas, read, expected, strokes: [], value: null };
      });
      const slot = h('span', { class: 'answer-boxes' }, boxes.map((b) => b.el));
      const clearBtn = h('button', { class: 'big-btn clear', 'aria-label': 'Clear' }, icon('sponge'));
      const goBtn = h('button', { class: 'big-btn go', 'aria-label': 'Check' }, glyph('check'));
      api.stage.replaceChildren(h('div', { class: 'pen-wrap' },
        h('div', { class: 'pen-q' }, sumEl(q, slot)),
        h('div', { class: 'pen-tools' }, clearBtn, goBtn)));

      for (const b of boxes) {
        let timer = null;
        b.ink = attachInk(b.canvas, {
          color: () => '#1a2a6c',
          width: () => Math.max(7, b.canvas.clientWidth / 18),
          onStart: () => {
            clearTimeout(timer);
            if (b.value != null) reset(b, true); // writing again over a read digit: start over
            b.strokes.push([]);
          },
          onPoint: (x, y) => b.strokes[b.strokes.length - 1]?.push({ x, y }),
          onEnd: () => {
            clearTimeout(timer);
            timer = setTimeout(() => readBox(b), READ_AFTER_MS);
            timers.push(timer);
          },
        });
      }

      function reset(b, keepInk = false) {
        b.strokes = [];
        b.value = null;
        b.read.textContent = '';
        b.el.classList.remove('done', 'bad', 'shown');
        if (!keepInk) b.ink.clear();
      }

      function readBox(b) {
        if (locked || !b.strokes.length) return;
        const r = readDigit(b.strokes, b.expected);
        if (!r) return;
        b.value = r.digit;
        b.ink.clear();
        b.read.textContent = String(r.digit);
        b.el.classList.add('done');
        replay(b.read, 'pop-read');
        sfx.note(r.digit);
      }

      clearBtn.addEventListener('click', () => { if (!locked) { boxes.forEach((b) => reset(b)); sfx.whoosh(); } });
      goBtn.addEventListener('click', () => {
        if (locked) return;
        boxes.filter((b) => b.value == null && b.strokes.length).forEach(readBox);
        if (boxes.some((b) => b.value == null)) { sfx.boing(); api.say(L.pen.oneEach); return; }
        const v = Number(boxes.map((b) => b.value).join(''));
        if (v === q.ans) {
          locked = true;
          sfx.ding();
          const r = slot.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 60);
          setTimeout(() => api.win({ num: q.ans, text: `${q.makeTen ? `${q.a} + ${q.ans}` : `${q.a} ${q.op} ${q.b}`} = ${q.makeTen ? 10 : q.ans}`, praise: [L.yes, L.num(q.ans), api.great()] }), 500);
          return;
        }
        api.mistake();
        sfx.boing();
        tries++;
        boxes.forEach((b) => replay(b.el, 'shake-it'));
        if (tries < 2) {
          api.say(L.tryAgain, L.pen.fix);
          timers.push(setTimeout(() => boxes.forEach((b) => reset(b)), 600));
          return;
        }
        // Second miss: show the answer in orange, say it, and move on.
        locked = true;
        boxes.forEach((b, k) => { reset(b); b.read.textContent = String(digits[k]); b.el.classList.add('shown'); });
        api.win({ quick: true, quiet: true, praise: L.race.answerIs(q.ans) });
      });

      api.setPrompt(L.race.question(q));
      api.say(i === 0 ? [L.pen.intro, L.race.question(q)] : L.race.question(q));
    }

    return { round, destroy() { timers.forEach(clearTimeout); } };
  },
};
