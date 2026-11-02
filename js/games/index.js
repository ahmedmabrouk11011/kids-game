// Every game exports { id, title, emoji, color, create(api) -> { round(i), destroy() } }.
// The runner in app.js gives each game an `api` (stage, deck of numbers, say, win, mistake ...).
import count from './count.js';
import howmany from './howmany.js';
import trace from './trace.js';
import basket from './basket.js';
import pop from './pop.js';
import dots from './dots.js';

export const GAMES = Object.fromEntries([count, howmany, trace, basket, pop, dots].map((g) => [g.id, g]));
