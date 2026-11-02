// Things to count: sharp vector icons, and the kid's hero (Shadow) in the first round.
import { h, shuffle } from './util.js';

export const ITEMS = [
  { icon: 'apple', one: 'apple', many: 'apples' },
  { icon: 'star', one: 'star', many: 'stars' },
  { icon: 'balloon', one: 'balloon', many: 'balloons' },
  { icon: 'fish', one: 'fish', many: 'fish' },
  { icon: 'car', one: 'car', many: 'cars' },
  { icon: 'duck', one: 'duck', many: 'ducks' },
  { icon: 'banana', one: 'banana', many: 'bananas' },
  { icon: 'ladybug', one: 'ladybug', many: 'ladybugs' },
  { icon: 'strawberry', one: 'strawberry', many: 'strawberries' },
  { icon: 'ball', one: 'ball', many: 'balls' },
  { icon: 'puppy', one: 'puppy', many: 'puppies' },
  { icon: 'butterfly', one: 'butterfly', many: 'butterflies' },
  { icon: 'rocket', one: 'rocket', many: 'rockets' },
];
export const HEROES = {
  shadow: { hero: 'shadow', one: 'Shadow', many: 'Shadows' },
  sonic: { hero: 'sonic', one: 'Sonic', many: 'Sonics' },
};
export const APPLE = ITEMS[0];

export const itemName = (kind, n) => (n === 1 ? kind.one : kind.many);

// A different item for each round; the kid's hero comes first.
export function itemDeck(heroName) {
  const rest = shuffle(ITEMS);
  return HEROES[heroName] ? [HEROES[heroName], ...rest] : rest;
}

export function itemEl(kind, x, y, size) {
  const src = kind.hero ? `img/chars/${kind.hero}.webp` : `img/icons/${kind.icon}.svg`;
  return h('div', { class: 'item' + (kind.hero ? ' is-hero' : ''), style: `left:${x}px;top:${y}px;--sz:${size}px` },
    h('img', { src, alt: '', draggable: 'false' }));
}
