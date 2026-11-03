// Every game exports { id, title, icon, color, create(api) -> { round(i), destroy() } } (and optional `rounds`).
// The runner in app.js gives each game an `api` (stage, kid, deck of numbers, say, win, mistake ...).
import count from './count.js';
import howmany from './howmany.js';
import trace from './trace.js';
import basket from './basket.js';
import pop from './pop.js';
import dots from './dots.js';
import roads from './roads.js';
import color from './color.js';
import split from './split.js';
import bond from './bond.js';
import pairs from './pairs.js';
import balance from './balance.js';
import race from './race.js';
import penmath from './penmath.js';
import train from './train.js';
import tens from './tens.js';
import armoves from './armoves.js';
import arlisten from './arlisten.js';
import arpop from './arpop.js';
import arbuild from './arbuild.js';
import arwhere from './arwhere.js';

export const GAMES = Object.fromEntries(
  [count, howmany, trace, basket, pop, dots, roads, color, split, bond, pairs, balance, race, penmath, train, tens, armoves, arlisten, arpop, arbuild, arwhere].map((g) => [g.id, g]));
