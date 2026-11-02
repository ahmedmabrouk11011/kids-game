import { h, icon, hero, glyph, pick, replay, sleep } from './util.js';
import { say, preload, onTalk, sfx, unlock, stopSpeech, setMuted, isMuted } from './sound.js';
import { burst, rain, clearFx } from './fx.js';
import { showReward, closeReward } from './reward.js';
import { store } from './store.js';
import { L } from './lines.js';
import { GAMES } from './games/index.js';

const ROUNDS = 5;

// hero: the kid's favourite character (from his coloring book), shown as mascot.
// strip: the number row under the menu ('count' = 1-10, 'bonds' = rainbow pairs that make 10).
const KIDS = {
  omar: {
    id: 'omar', name: 'Omar', hero: 'shadow', heroName: 'Shadow', theme: 'omar', title: 'Numbers', sub: '1 – 10', strip: 'count',
    games: ['count', 'howmany', 'trace', 'basket', 'pop', 'dots', 'roads', 'color'],
  },
  youssef: {
    id: 'youssef', name: 'Youssef', hero: 'sonic', heroName: 'Sonic', theme: 'youssef', title: 'Math', sub: '1 – 100', strip: 'bonds',
    games: ['bond', 'pairs', 'balance', 'race', 'penmath', 'train', 'tens', 'color'],
  },
};
const STRIP_COLORS = ['#e63946', '#ff8c42', '#ffcc33', '#2ecc71', '#00c2a8', '#3fa9f5', '#9b5de5', '#ff5fa2', '#e63946', '#ff8c42'];

const app = document.getElementById('app');
let cleanup = null;
let greet = null; // kid to say hello to when his menu opens

setMuted(store.muted);
addEventListener('pointerdown', unlock, { capture: true });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Twinkling night sky.
const sky = document.getElementById('sky');
for (let i = 0; i < 70; i++) {
  sky.append(h('i', { style: `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 3}s;transform:scale(${0.5 + Math.random()})` }));
}

// ---------- shared bits ----------
function muteBtn() {
  const b = h('button', { class: 'round-btn' + (isMuted() ? ' off' : ''), 'aria-label': 'Sound on or off' }, icon(isMuted() ? 'muted' : 'speaker'));
  b.addEventListener('click', () => {
    const m = !isMuted();
    setMuted(m);
    store.muted = m;
    b.replaceChildren(icon(m ? 'muted' : 'speaker'));
    b.classList.toggle('off', m);
  });
  return b;
}

function fullscreenBtn() {
  if (!document.documentElement.requestFullscreen) return null;
  return h('button', {
    class: 'round-btn', 'aria-label': 'Full screen',
    onclick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {})),
  }, glyph('full'));
}

// The mascot bounces while the voice talks. Tapping it says the instruction again.
function mascot(kid, onTap) {
  const b = h('button', { class: 'mascot', 'aria-label': 'Say it again' }, hero(kid.hero));
  b.addEventListener('click', () => { replay(b, 'hop'); onTap(); });
  const off = onTalk((on) => b.classList.toggle('talking', on));
  return { el: b, off };
}

// ---------- screens ----------
function kidPicker() {
  const cards = Object.entries(KIDS).map(([id, kid], i) =>
    h('button', {
      class: `kid-card ${kid.theme}`,
      style: `animation-delay:${i * 120}ms`,
      onclick: () => {
        sfx.ding();
        greet = id;
        location.hash = `#/${id}`;
      },
    },
    hero(kid.hero, 'face'),
    h('div', { class: 'name' }, kid.name),
    h('div', { class: 'sub' }, `${kid.title} ${kid.sub}`)));
  app.replaceChildren(
    h('div', { class: 'bar' }, h('div', { class: 'grow' }), fullscreenBtn(), muteBtn()),
    h('h1', { class: 'page-title' }, 'Who is playing?'),
    h('div', { class: 'picker' }, cards));
}

function menu(kidId) {
  const kid = KIDS[kidId];
  const prog = store.kid(kidId);
  const tiles = kid.games.map((gid, i) => {
    const g = GAMES[gid];
    const best = prog.best[gid] || 0;
    return h('button', {
      class: 'tile', style: `--c:${g.color};animation-delay:${i * 60}ms`,
      onclick: () => { sfx.ding(); location.hash = `#/${kidId}/${gid}`; },
    },
    h('div', { class: 'emo' }, icon(g.icon)),
    h('div', { class: 'label' }, g.title),
    h('div', { class: 'stars' }, [1, 2, 3].map((s) => icon('star', s <= best ? '' : 'dim'))));
  });
  const strip = kid.strip === 'bonds' ? bondStrip() : countStrip();
  const m = mascot(kid, () => say(L.hello(kid.name)));
  app.replaceChildren(
    h('div', { class: 'bar' },
      h('button', { class: 'round-btn', 'aria-label': 'Back', onclick: () => { location.hash = '#/'; } }, icon('back')),
      h('div', { class: 'grow' }),
      h('div', { class: 'star-count' }, icon('star'), String(prog.stars)),
      fullscreenBtn(), muteBtn()),
    h('div', { class: 'title-row' }, m.el,
      h('h1', { class: 'page-title' }, `${kid.name}'s `, h('span', { class: 'hl' }, kid.title), ` ${kid.sub}`)),
    h('div', { class: 'menu' + (kid.games.length > 6 ? ' wide' : '') }, tiles),
    h('div', { class: 'numstrip' }, strip));
  if (greet === kidId) say(L.hello(kid.name));
  greet = null;
  return m.off;
}

function countStrip() {
  return [...Array(10)].map((_, i) => {
    const n = i + 1;
    const b = h('button', { style: `--c:${STRIP_COLORS[i]}` }, String(n));
    b.addEventListener('click', () => {
      replay(b, 'jump');
      sfx.note(i);
      say(L.num(n));
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, n * 6);
    });
    return b;
  });
}

// 0-10 where partners share a colour (3 and 7, 4 and 6 ...). Tap one: both jump and the bond is said.
function bondStrip() {
  const btns = [...Array(11)].map((_, n) => h('button', { style: `--c:${STRIP_COLORS[Math.min(n, 10 - n)]}` }, String(n)));
  btns.forEach((b, n) => b.addEventListener('click', () => {
    replay(b, 'jump');
    replay(btns[10 - n], 'jump');
    sfx.note(n);
    say(L.makes(n, 10 - n, 10));
    const r = btns[10 - n].getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, 30, [STRIP_COLORS[Math.min(n, 10 - n)], '#ffffff']);
  }));
  return btns;
}

function runGame(kidId, gameId) {
  const kid = KIDS[kidId];
  const game = GAMES[gameId];
  let alive = true;
  let round = 0;
  let mistakes = 0;
  let prompt = [];
  let busy = false;

  const rounds = game.rounds || ROUNDS;
  const dots = [...Array(rounds)].map(() => h('span'));
  const stage = h('div', { class: 'stage' });
  const m = mascot(kid, () => say(prompt));
  app.replaceChildren(
    h('div', { class: 'bar' },
      h('button', { class: 'round-btn', 'aria-label': 'Home', onclick: () => { location.hash = `#/${kidId}`; } }, icon('house')),
      h('div', { class: 'progress' }, dots),
      m.el),
    stage);

  // Deck of numbers for the rounds: different numbers from 1-10.
  const deck = [...Array(10)].map((_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, rounds);
  preload([...Array(21)].map((_, n) => L.num(n)), L.greats(kid.name), L.yes, L.tryAgain);

  const api = {
    stage, kid, deck, rounds,
    alive: () => alive,
    say: (...parts) => (alive ? say(...parts) : Promise.resolve(false)),
    setPrompt(...parts) { prompt = parts.flat(); },
    mistake() { mistakes++; replay(m.el, 'shake-it'); },
    great: () => pick(L.greats(kid.name)),
    // Called by a game when the round is solved: reward screen, then the next round (or the trophy).
    // praise: one line or a list of lines. quick: a short cheer instead of the reward screen; quiet: no cheer.
    async win({ num, emoji, text, praise, quick, quiet }) {
      if (!alive || busy) return;
      busy = true;
      dots[round].classList.add('on');
      const line = praise ?? [L.num(num), api.great()];
      if (quick) {
        if (!quiet) {
          sfx.tada();
          replay(m.el, 'hop');
          const r = stage.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 3, 60);
        }
        await Promise.all([api.say(line), sleep(quiet ? 1800 : 1100)]);
      } else {
        api.say(line);
        await showReward({ num, emoji, text, hero: kid.hero });
      }
      if (!alive) return;
      busy = false;
      round++;
      if (round < rounds) inst.round(round);
      else finish();
    },
  };

  // The stage is already in the page here, so games can measure it right away.
  const inst = game.create(api);
  inst.round(0);

  function finish() {
    const stars = mistakes <= rounds * 0.2 ? 3 : mistakes <= rounds * 0.8 ? 2 : 1;
    store.addResult(kidId, gameId, stars);
    inst.destroy?.();
    const again = h('button', { class: 'big-btn go', 'aria-label': 'Play again', onclick: () => { sfx.ding(); route(); } }, icon('repeat'));
    const home = h('button', { class: 'big-btn clear home', 'aria-label': 'Home', onclick: () => { location.hash = `#/${kidId}`; } }, icon('house'));
    stage.replaceChildren(h('div', { class: 'finish' },
      h('div', { class: 'trophy-row' }, hero(kid.hero, 'cheer'), icon('trophy', 'trophy')),
      h('div', { class: 'big-stars' }, [...Array(stars)].map(() => icon('star'))),
      h('div', { class: 'row' }, again, home)));
    rain(220);
    sfx.tada();
    api.say(L.finish(kid.name, stars));
  }

  return () => { alive = false; m.off(); inst.destroy?.(); };
}

// ---------- router ----------
function route() {
  cleanup?.();
  cleanup = null;
  closeReward();
  clearFx();
  stopSpeech();
  const [kidId, gameId] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const kid = KIDS[kidId];
  document.body.dataset.kid = kid ? kidId : '';
  if (!kid) return kidPicker();
  if (gameId && GAMES[gameId] && kid.games.includes(gameId)) cleanup = runGame(kidId, gameId);
  else cleanup = menu(kidId);
}

addEventListener('hashchange', () => route());
route();
