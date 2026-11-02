// Every game exports { id, title, emoji, color, create(api) -> { round(i), destroy() } } (and optional `rounds`).
// The runner in app.js gives each game an `api` (stage, deck of numbers, say, win, mistake ...).
import count from './count.js';
import howmany from './howmany.js';
import trace from './trace.js';
import basket from './basket.js';
import pop from './pop.js';
import dots from './dots.js';
import bond from './bond.js';
import pairs from './pairs.js';
import balance from './balance.js';
import race from './race.js';
import train from './train.js';
import tens from './tens.js';

export const GAMES = Object.fromEntries(
  [count, howmany, trace, basket, pop, dots, bond, pairs, balance, race, train, tens].map((g) => [g.id, g]));
