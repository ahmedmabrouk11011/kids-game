// Pictures for Omar's matching games and mazes. `icon` is a file in img/icons/ (w/ = the Arabic word pictures).
// `name` is what the voice says when he taps a card; `said` is the sentence for a right match.

// Who Eats What? (and who walks to which snack in the Snack Maze)
export const FOODS = [
  { id: 'rabbit', icon: 'rabbit', name: 'Rabbit', food: { icon: 'carrot', name: 'Carrot' }, said: 'Rabbits eat carrots!' },
  { id: 'monkey', icon: 'monkeyface', name: 'Monkey', food: { icon: 'banana', name: 'Banana' }, said: 'Monkeys eat bananas!' },
  { id: 'dog', icon: 'puppy', name: 'Dog', food: { icon: 'bone', name: 'Bone' }, said: 'Dogs love bones!' },
  { id: 'cat', icon: 'cat', name: 'Cat', food: { icon: 'fish', name: 'Fish' }, said: 'Cats eat fish!' },
  { id: 'mouse', icon: 'mouseface', name: 'Mouse', food: { icon: 'w/cheese', name: 'Cheese' }, said: 'Mice eat cheese!' },
  { id: 'bear', icon: 'bear', name: 'Bear', food: { icon: 'w/honey', name: 'Honey' }, said: 'Bears love honey!' },
  { id: 'frog', icon: 'frog', name: 'Frog', food: { icon: 'fly', name: 'Fly' }, said: 'Frogs eat flies!' },
  { id: 'squirrel', icon: 'chipmunk', name: 'Squirrel', food: { icon: 'acorn', name: 'Nut' }, said: 'Squirrels eat nuts!' },
  { id: 'chicken', icon: 'chicken', name: 'Chicken', food: { icon: 'corn', name: 'Corn' }, said: 'Chickens eat corn!' },
  { id: 'cow', icon: 'w/cow', name: 'Cow', food: { icon: 'herb', name: 'Grass' }, said: 'Cows eat grass!' },
  { id: 'koala', icon: 'koala', name: 'Koala', food: { icon: 'leaf', name: 'Leaves' }, said: 'Koalas eat leaves!' },
  { id: 'bird', icon: 'bird', name: 'Bird', food: { icon: 'worm', name: 'Worm' }, said: 'Birds eat worms!' },
  { id: 'lion', icon: 'w/lion', name: 'Lion', food: { icon: 'w/meat', name: 'Meat' }, said: 'Lions eat meat!' },
  { id: 'bee', icon: 'w/bee', name: 'Bee', food: { icon: 'sunflower', name: 'Flower' }, said: 'Bees love flowers!' },
];
// Animals that would happily eat each other's food: never in the same round.
export const FOOD_CLASH = [['bear', 'cat'], ['chicken', 'bird'], ['bird', 'squirrel'], ['mouse', 'squirrel']];

// Find the Shadow: pictures whose outlines look very different from each other.
export const SHAPES = [
  { icon: 'star', name: 'Star' }, { icon: 'banana', name: 'Banana' }, { icon: 'rocket', name: 'Rocket' },
  { icon: 'butterfly', name: 'Butterfly' }, { icon: 'duck', name: 'Duck' }, { icon: 'car', name: 'Car' },
  { icon: 'fish', name: 'Fish' }, { icon: 'house', name: 'House' }, { icon: 'heart', name: 'Heart' },
  { icon: 'w/camel', name: 'Camel' }, { icon: 'turtle', name: 'Turtle' }, { icon: 'moon', name: 'Moon' },
  { icon: 'rabbit', name: 'Rabbit' }, { icon: 'crown', name: 'Crown' }, { icon: 'w/horse', name: 'Horse' },
  { icon: 'icecream', name: 'Ice cream' }, { icon: 'lollipop', name: 'Lollipop' },
];
export const shadowSaid = (s) => `That's the ${s.name.toLowerCase()}'s shadow!`;

// Colors: a thing and its colour.
export const COLORS = [
  { color: 'Red', hex: '#e63946', icon: 'apple', thing: 'apple' },
  { color: 'Yellow', hex: '#ffcc33', icon: 'banana', thing: 'banana' },
  { color: 'Green', hex: '#2ecc71', icon: 'frog', thing: 'frog' },
  { color: 'Orange', hex: '#ff8c42', icon: 'tangerine', thing: 'orange' },
  { color: 'Purple', hex: '#9b5de5', icon: 'w/grapes', thing: 'grapes' },
  { color: 'Blue', hex: '#3fa9f5', icon: 'whale', thing: 'whale' },
  { color: 'Pink', hex: '#ff7eb6', icon: 'pig', thing: 'pig' },
  { color: 'Brown', hex: '#9a5b2f', icon: 'teddy', thing: 'teddy bear' },
];
export const colorSaid = (c) => (c.thing === 'grapes' ? 'The grapes are purple!' : `The ${c.thing} is ${c.color.toLowerCase()}!`);
