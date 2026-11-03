// Arabic 2. Listen and Pick: the voice says a sound (بِ); tap the card that shows it.
// It adapts to him like Number Bond: fatha or kasra → + damma → all four → two letters mixed.
// 2 first-try answers in a row move him up a step, 2 misses on one question move him back.
import { h, icon, pick, shuffle, replay } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { store } from '../store.js';
import { KINDS, COLOR, LETTERS, syl, sylSaid, LA } from '../arabic.js';
import { arText } from '../arglyph.js';

const STEPS = [['fatha', 'kasra'], ['fatha', 'kasra', 'damma'], KINDS, 'mixed'];

function question(step) {
  const kinds = STEPS[step];
  if (kinds === 'mixed') {
    const [a, b] = shuffle(LETTERS).slice(0, 2);
    const [k1, k2] = shuffle(KINDS).slice(0, 2);
    const cards = shuffle([[a, k1], [a, k2], [b, k1], [b, k2]]);
    return { cards, answer: pick(cards) };
  }
  const c = pick(LETTERS);
  const cards = shuffle(kinds).map((k) => [c, k]);
  return { cards, answer: pick(cards) };
}

export default {
  id: 'arlisten',
  title: 'اسمع واختر',
  icon: 'ear',
  color: '#16a34a',
  create(api) {
    let step = Math.min(store.level(api.kid.id, 'arlisten'), STEPS.length - 1);
    let streak = 0;

    function round(i) {
      const q = question(step);
      let misses = 0;
      let busy = false;
      const [al, ak] = q.answer;
      const replayBtn = h('button', { class: 'round-btn listen-btn', 'aria-label': 'Say it again' }, icon('speaker'));
      replayBtn.addEventListener('click', () => { replay(replayBtn, 'jump'); api.say(sylSaid(al, ak)); });
      const grid = h('div', { class: 'ar-choices n' + q.cards.length });
      q.cards.forEach(([c, k], n) => {
        const b = h('button', { class: 'ar-card choice-card', style: `animation-delay:${n * 70}ms` }, arText(syl(c, k)));
        b.addEventListener('click', () => tap(b, c, k));
        grid.append(b);
      });
      api.stage.replaceChildren(h('div', { class: 'arlisten', lang: 'ar' }, replayBtn, grid));

      function tap(b, c, k) {
        if (busy || b.classList.contains('wrong')) return;
        if (c === al && k === ak) {
          busy = true;
          b.classList.add('right');
          b.style.setProperty('--c', COLOR[k]);
          sfx.ding();
          const r = b.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 40, [COLOR[k], '#ffffff']);
          if (misses === 0 && ++streak >= 2 && step < STEPS.length - 1) { step++; streak = 0; }
          store.setLevel(api.kid.id, 'arlisten', step);
          api.win({ node: arText(syl(al, ak)), praise: [sylSaid(al, ak), api.great()] });
          return;
        }
        misses++;
        streak = 0;
        api.mistake();
        sfx.boing();
        b.classList.add('wrong');
        if (misses === 2 && step > 0) { step--; store.setLevel(api.kid.id, 'arlisten', step); }
        api.say(LA.this, sylSaid(c, k), LA.listen.where, sylSaid(al, ak));
      }

      api.setPrompt(LA.listen.where, sylSaid(al, ak));
      api.say(...(i === 0 ? [LA.listen.intro] : []), LA.listen.where, sylSaid(al, ak));
    }

    return { round };
  },
};
