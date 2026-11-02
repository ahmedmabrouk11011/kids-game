import { h, pick, replay, Word } from './util.js';
import { say, sfx, unlock, stopSpeech, setMuted, isMuted } from './sound.js';
import { burst, rain, clearFx } from './fx.js';
import { showReward, closeReward } from './reward.js';
import { store } from './store.js';
import { GAMES } from './games/index.js';

const ROUNDS = 5;

const KIDS = {
  omar: { name: 'Omar', face: '🦔', theme: 'omar', title: 'Numbers', sub: '1 – 10', games: ['count', 'howmany', 'trace', 'basket', 'pop', 'dots'] },
  youssef: { name: 'Youssef', face: '🦔', theme: 'youssef', sub: 'Soon!', locked: true },
};

const app = document.getElementById('app');
let cleanup = null;

setMuted(store.muted);
addEventListener('pointerdown', unlock, { capture: true });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Twinkling night sky (Shadow's colours: dark night, red and gold).
const sky = document.getElementById('sky');
for (let i = 0; i < 70; i++) {
  sky.append(h('i', { style: `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 3}s;transform:scale(${0.5 + Math.random()})` }));
}

// ---------- shared bits ----------
function muteBtn() {
  const b = h('button', { class: 'round-btn' + (isMuted() ? ' off' : ''), 'aria-label': 'Sound on or off' }, isMuted() ? '🔇' : '🔊');
  b.addEventListener('click', () => {
    const m = !isMuted();
    setMuted(m);
    store.muted = m;
    b.textContent = m ? '🔇' : '🔊';
    b.classList.toggle('off', m);
  });
  return b;
}

function fullscreenBtn() {
  if (!document.documentElement.requestFullscreen) return null;
  return h('button', {
    class: 'round-btn', 'aria-label': 'Full screen',
    onclick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {})),
  }, '⛶');
}

const greats = (kid) => ['Great job!', 'Yay! You did it!', 'Super!', `Awesome, ${kid.name}!`, 'Wow! Well done!', 'Fantastic!'];

// ---------- screens ----------
function kidPicker() {
  const cards = Object.entries(KIDS).map(([id, kid], i) =>
    h('button', {
      class: `kid-card ${kid.theme}${kid.locked ? ' locked' : ''}`,
      style: `animation-delay:${i * 120}ms`,
      onclick: () => {
        if (kid.locked) { sfx.boing(); say(`${kid.name}'s games are coming soon!`); return; }
        sfx.ding();
        location.hash = `#/${id}`;
      },
    },
    kid.locked ? h('span', { class: 'lock' }, '🔒') : null,
    h('div', { class: 'face' }, kid.face),
    h('div', { class: 'name' }, kid.name),
    h('div', { class: 'sub' }, kid.locked ? kid.sub : `${kid.title} ${kid.sub}`)));
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
      class: 'tile', style: `--c:${g.color};animation-delay:${i * 70}ms`,
      onclick: () => { sfx.ding(); location.hash = `#/${kidId}/${gid}`; },
    },
    h('div', { class: 'emo' }, g.emoji),
    h('div', { class: 'label' }, g.title),
    h('div', { class: 'stars' }, [1, 2, 3].map((s) => h('span', { class: s <= best ? '' : 'dim' }, '⭐'))));
  });
  const colors = ['#e63946', '#ff8c42', '#ffcc33', '#2ecc71', '#00c2a8', '#3fa9f5', '#9b5de5', '#ff5fa2', '#e63946', '#ff8c42'];
  const strip = [...Array(10)].map((_, i) => {
    const n = i + 1;
    const b = h('button', { style: `--c:${colors[i]}` }, String(n));
    b.addEventListener('click', () => {
      replay(b, 'jump');
      sfx.note(i);
      say(Word(n));
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, n * 6);
    });
    return b;
  });
  app.replaceChildren(
    h('div', { class: 'bar' },
      h('button', { class: 'round-btn', 'aria-label': 'Back', onclick: () => { location.hash = '#/'; } }, '⬅️'),
      h('div', { class: 'grow' }),
      h('div', { class: 'star-count' }, '⭐', String(prog.stars)),
      fullscreenBtn(), muteBtn()),
    h('h1', { class: 'page-title' }, `${kid.name}'s `, h('span', { class: 'hl' }, kid.title), ` ${kid.sub}`),
    h('div', { class: 'menu' }, tiles),
    h('div', { class: 'numstrip' }, strip));
}

function runGame(kidId, gameId) {
  const kid = KIDS[kidId];
  const game = GAMES[gameId];
  let alive = true;
  let round = 0;
  let mistakes = 0;
  let prompt = '';
  let busy = false;

  const dots = [...Array(ROUNDS)].map(() => h('span'));
  const stage = h('div', { class: 'stage' });
  app.replaceChildren(
    h('div', { class: 'bar' },
      h('button', { class: 'round-btn', 'aria-label': 'Home', onclick: () => { location.hash = `#/${kidId}`; } }, '🏠'),
      h('div', { class: 'progress' }, dots),
      h('button', { class: 'round-btn', 'aria-label': 'Say it again', onclick: () => say(prompt) }, '🗣️')),
    stage);

  // Deck of numbers for the rounds: 5 different numbers from 1-10.
  const deck = [...Array(10)].map((_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, ROUNDS);

  const api = {
    stage, kid, deck, rounds: ROUNDS,
    alive: () => alive,
    say: (t) => (alive ? say(t) : Promise.resolve(false)),
    setPrompt(t) { prompt = t; },
    mistake() { mistakes++; },
    great: () => pick(greats(kid)),
    // Called by a game when the round is solved: reward screen, then the next round (or the trophy).
    async win({ num, emoji, praise }) {
      if (!alive || busy) return;
      busy = true;
      dots[round].classList.add('on');
      api.say(praise || `${Word(num)}! ${api.great()}`);
      await showReward({ num, emoji });
      if (!alive) return;
      busy = false;
      round++;
      if (round < ROUNDS) inst.round(round);
      else finish();
    },
  };

  // The stage is already in the page here, so games can measure it right away.
  const inst = game.create(api);
  inst.round(0);

  function finish() {
    const stars = mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
    store.addResult(kidId, gameId, stars);
    inst.destroy?.();
    const again = h('button', { class: 'big-btn go', 'aria-label': 'Play again', onclick: () => { sfx.ding(); route(); } }, '🔁');
    const home = h('button', { class: 'big-btn clear', style: 'width:120px;height:120px;font-size:60px;border-radius:30px', 'aria-label': 'Home', onclick: () => { location.hash = `#/${kidId}`; } }, '🏠');
    stage.replaceChildren(h('div', { class: 'finish' },
      h('div', { class: 'trophy' }, '🏆'),
      h('div', { class: 'big-stars' }, [...Array(stars)].map(() => h('span', {}, '⭐'))),
      h('div', { class: 'row' }, again, home)));
    rain(220);
    sfx.tada();
    api.say(`You finished the game, ${kid.name}! Here ${stars === 1 ? 'is your star' : `are your ${Word(stars).toLowerCase()} stars`}!`);
  }

  return () => { alive = false; inst.destroy?.(); };
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
  if (!kid || kid.locked) return kidPicker();
  if (gameId && GAMES[gameId] && kid.games.includes(gameId)) cleanup = runGame(kidId, gameId);
  else menu(kidId);
}

addEventListener('hashchange', () => route());
route();
