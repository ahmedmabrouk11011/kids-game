// Arabic 5. Where is the Letter? A picture, its word and one letter. Is the letter at the start, in the middle
// or at the end of the word? The three buttons show the letter's shape in each place (بـ ـبـ ـب), right to left.
// A wrong answer lights the letter up in the word, then he tries again. 10 questions, a new mix every game.
import { h, icon, pick, shuffle, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { WORDS, PLACES, PLACE_ORDER, PLACE_LABEL, FORM, splitLetters, charIndex, LA } from '../arabic.js';
import { arText } from '../arglyph.js';

// 10 questions from all the words: start, middle and end mixed evenly, no word twice, never the same letter twice in a row.
function deck(n) {
  const places = shuffle([...Array(n)].map((_, k) => PLACE_ORDER[k % 3]));
  const out = [];
  for (const p of places) {
    const prev = out[out.length - 1];
    const ok = PLACES.filter(([c, w, pl]) => pl === p && !out.some((q) => q[1] === w) && c !== prev?.[0]);
    out.push(pick(ok));
  }
  return out;
}

export default {
  id: 'arwhere',
  title: 'أين الحرف؟',
  icon: 'magnifier',
  color: '#e11d48',
  rounds: 10,
  create(api) {
    const qs = deck(api.rounds);

    function round(i) {
      const [letter, word, place] = qs[i];
      const pos = splitLetters(word).findIndex(([c]) => c === letter);
      const at = charIndex(word, pos);
      let busy = false;
      const wordBox = h('div', { class: 'ar-card word-card' }, arText(word));
      const light = () => wordBox.replaceChildren(arText(word, { hl: [at] }));
      const btns = PLACE_ORDER.map((p) => {
        const b = h('button', { class: 'place-btn' },
          h('div', { class: 'form' }, arText(FORM[p](letter))), h('div', { class: 'lbl' }, PLACE_LABEL[p]));
        b.addEventListener('click', () => tap(b, p));
        return b;
      });
      api.stage.replaceChildren(h('div', { class: 'arwhere', lang: 'ar' },
        h('div', { class: 'where-top' },
          h('div', { class: 'ar-card letter-badge' }, arText(letter)),
          wordBox,
          h('div', { class: 'pic-card' }, icon(`w/${WORDS[word]}`))),
        h('div', { class: 'place-row' }, btns)));

      function tap(b, p) {
        if (busy || b.classList.contains('wrong')) return;
        if (p === place) {
          busy = true;
          b.classList.add('right');
          light();
          sfx.ding();
          const r = b.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 50);
          api.win({ node: arText(word, { hl: [at] }), praise: [LA.where[place], api.great()] });
          return;
        }
        api.mistake();
        sfx.boing();
        b.classList.add('wrong');
        replay(b, 'shake-it');
        light();
        api.say(LA.where.look(letter), LA.where.ask(letter), word);
      }

      api.setPrompt(LA.where.ask(letter), word);
      api.say(LA.where.ask(letter), word);
    }

    return { round };
  },
};
