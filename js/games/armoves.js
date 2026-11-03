// Arabic 1. Sonic Moves: a big letter and four haraka buttons (only the haraka, no letter). Tap a haraka: it lands on the letter, Sonic does
// its move (jump up, slide down, spin into a ball, stop at a ring) and the voice reads the sound.
// Each round asks for one sound ("make it say بُ"); a wrong haraka is read out too, so every tap teaches.
import { h, hero, shuffle, replay, sleep } from '../util.js';
import { sfx } from '../sound.js';
import { burst } from '../fx.js';
import { KINDS, COLOR, LETTERS, syl, sylSaid, markOnly, LA, MOVE_LINE } from '../arabic.js';
import { arText } from '../arglyph.js';

const EASY = 'بتنمسلدرفك'.split('');

export default {
  id: 'armoves',
  title: 'حركات سونيك',
  icon: 'dash',
  color: '#1f6fe5',
  create(api) {
    let letter = '';
    let want = '';
    let busy = false;
    const kinds = shuffle([...KINDS, ...shuffle(KINDS)]).slice(0, api.rounds);
    const letters = shuffle(EASY).concat(shuffle(LETTERS));

    const card = h('div', { class: 'ar-card big' });
    const sonic = hero('sonic', 'mover');
    const ring = h('div', { class: 'mv-ring' });
    const buttons = KINDS.map((k) => {
      const b = h('button', { class: `har-btn k-${k}`, style: `--c:${COLOR[k]}` }, arText(markOnly(k), { cls: 'on-colour' }));
      b.addEventListener('click', () => tap(k, b));
      return b;
    });
    api.stage.replaceChildren(h('div', { class: 'armoves', lang: 'ar' },
      h('div', { class: 'mv-top' }, h('div', { class: 'mv-hero' }, ring, sonic), card),
      h('div', { class: 'har-row' }, buttons)));

    function show(kind) {
      card.replaceChildren(arText(kind ? syl(letter, kind) : letter));
      if (kind) card.style.setProperty('--c', COLOR[kind]);
      else { card.style.removeProperty('--c'); ring.className = 'mv-ring'; }
    }

    async function tap(k, b) {
      if (busy) return;
      busy = true;
      replay(b, 'jump');
      show(k);
      replay(card, 'land');
      sonic.className = 'hero-img mover';
      ring.className = 'mv-ring';
      void sonic.offsetWidth;
      sonic.classList.add(`mv-${k}`);
      if (k === 'sukun') ring.classList.add('show');
      if (k === want) {
        sfx.ding();
        const r = card.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 3, 50, [COLOR[k], '#ffffff', '#ffcc33']);
        await api.say(sylSaid(letter, k), MOVE_LINE[k]);
        api.win({ node: arText(syl(letter, k)), praise: [sylSaid(letter, k), api.great()] });
        return;
      }
      api.mistake();
      sfx.boing();
      await api.say(LA.this, sylSaid(letter, k), LA.want, sylSaid(letter, want));
      if (!api.alive()) return;
      await sleep(200);
      show(null);
      busy = false;
    }

    function round(i) {
      letter = letters[i];
      want = kinds[i];
      busy = false;
      show(null);
      sonic.className = 'hero-img mover';
      ring.className = 'mv-ring';
      api.setPrompt(LA.moves.make, sylSaid(letter, want));
      api.say(i === 0 ? LA.moves.intro : LA.moves.make, sylSaid(letter, want));
    }

    return { round };
  },
};
