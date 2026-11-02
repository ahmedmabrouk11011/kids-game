// Things to count. Emoji only (free, no images). No gold rings: drawn rings look like the digit 0.
import { h, shuffle } from './util.js';

export const ITEMS = [
  { e: '🦔', one: 'hedgehog', many: 'hedgehogs' },
  { e: '🍎', one: 'apple', many: 'apples' },
  { e: '⭐', one: 'star', many: 'stars' },
  { e: '🎈', one: 'balloon', many: 'balloons' },
  { e: '🐟', one: 'fish', many: 'fish' },
  { e: '🚗', one: 'car', many: 'cars' },
  { e: '🦆', one: 'duck', many: 'ducks' },
  { e: '🍌', one: 'banana', many: 'bananas' },
  { e: '🐞', one: 'ladybug', many: 'ladybugs' },
  { e: '🍓', one: 'strawberry', many: 'strawberries' },
  { e: '⚽', one: 'ball', many: 'balls' },
  { e: '🐶', one: 'puppy', many: 'puppies' },
];

export const itemName = (kind, n) => (n === 1 ? kind.one : kind.many);

// A different item for each round; the hedgehog (Shadow's family) always comes first.
export function itemDeck() {
  const [hedgehog, ...rest] = ITEMS;
  return [hedgehog, ...shuffle(rest)];
}

export function itemEl(kind, x, y, size) {
  return h('div', { class: 'item', style: `left:${x}px;top:${y}px;--sz:${size}px` }, kind.e);
}
