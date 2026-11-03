// Arabic 4. Build the Word: a picture and its word, spoken. Tap the letter cards (each letter with its haraka)
// in order, from the right, to fill Sonic's train. Every card reads its sound, so he blends the word himself;
// when the train is full the cars join into the real word. 10 words, a new mix every game; from round 6 there is one extra card.
import { h, icon, pick, shuffle, replay, sleep } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { WORDS, BUILD_STEPS, LETTERS, KINDS, KIND_OF, COLOR, splitLetters, syl, sylSaid, LA } from '../arabic.js';
import { arText } from '../arglyph.js';

const STEP_OF_ROUND = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2];
const said = (c, m) => sylSaid(c, KIND_OF[m]);

export default {
  id: 'arbuild',
  title: 'ابنِ الكلمة',
  icon: 'train',
  color: '#9b5de5',
  rounds: 10,
  create(api) {
    const used = new Set();

    function round(i) {
      const choices = BUILD_STEPS[STEP_OF_ROUND[i]].filter((w) => !used.has(w));
      const word = pick(choices);
      used.add(word);
      const parts = splitLetters(word);
      let next = 0;
      let busy = false;

      const pieces = parts.map(([c, m]) => ({ c, m }));
      if (i >= 5) {
        const c = pick(LETTERS.filter((x) => !parts.some(([p]) => p === x)));
        pieces.push({ c, m: syl('', pick(KINDS)), extra: true });
      }
      const slots = parts.map(() => h('div', { class: 'car slot-car' }));
      const train = h('div', { class: 'ar-train' }, slots, h('div', { class: 'engine' }, icon('train')));
      const say = h('button', { class: 'round-btn listen-btn', 'aria-label': 'Say it again' }, icon('speaker'));
      say.addEventListener('click', () => { replay(say, 'jump'); api.say(word); });
      const tray = h('div', { class: 'ar-tray' });
      shuffle(pieces).forEach((p, n) => {
        const b = h('button', { class: 'car tile-car', style: `--c:${COLOR[KIND_OF[p.m]]};animation-delay:${n * 70}ms` }, arText(p.c + p.m));
        b.addEventListener('click', () => tap(b, p));
        tray.append(b);
      });
      const top = h('div', { class: 'build-top' }, h('div', { class: 'pic-card' }, icon(`w/${WORDS[word]}`)), say);
      api.stage.replaceChildren(h('div', { class: 'arbuild', lang: 'ar' }, top, train, tray));

      async function tap(b, p) {
        if (busy || b.classList.contains('placed')) return;
        const [c, m] = parts[next];
        if (p.c === c && p.m === m) {
          b.classList.add('placed');
          slots[next].replaceChildren(arText(c + m));
          slots[next].classList.add('filled');
          slots[next].style.setProperty('--c', COLOR[KIND_OF[m]]);
          replay(slots[next], 'land');
          sfx.note(next + 2);
          next++;
          if (next === parts.length) {
            busy = true;
            await api.say(...parts.map(([x, y]) => said(x, y)));
            if (!api.alive()) return;
            train.replaceChildren(h('div', { class: 'ar-card word-card' }, arText(word)));
            replay(train, 'land');
            sfx.ding();
            const r = train.getBoundingClientRect();
            burst(r.left + r.width / 2, r.top + r.height / 2, 60);
            await sleep(300);
            api.win({ node: arText(word), praise: [word, api.great()] });
          } else api.say(said(p.c, p.m));
          return;
        }
        api.mistake();
        sfx.boing();
        replay(b, 'shake-it');
        api.say(LA.this, said(p.c, p.m), ...(next === 0 ? [LA.build.first] : [LA.build.next]), word);
      }

      api.setPrompt(LA.build.prompt, word);
      api.say(i === 0 ? LA.build.intro : LA.build.prompt, word);
    }

    return { round };
  },
};
