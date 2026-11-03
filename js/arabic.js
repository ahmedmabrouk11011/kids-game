// Youssef's Arabic: the four harakat (fatha, kasra, damma, sukun) and where a letter sits in a word.
// Same words, colours and "Sonic moves" as his printed book (ColoringBooks/book/youssef-arabic.json):
// fatha = Sonic jumps up, kasra = slides down, damma = curls into a ball, sukun = stops at a ring.
// Arabic is drawn from pre-shaped glyphs (js/ar-glyphs.js, made by tools/make_arabic.py), so every
// haraka keeps its own colour. Spoken lines are recorded with the Mac's Arabic voice (tools/make_voice.py).

export const KINDS = ['fatha', 'kasra', 'damma', 'sukun'];
export const MARK = { fatha: 'َ', kasra: 'ِ', damma: 'ُ', sukun: 'ْ' };
export const KIND_OF = Object.fromEntries(Object.entries(MARK).map(([k, m]) => [m, k]));
export const COLOR = { fatha: '#1f6fe5', kasra: '#16a34a', damma: '#ea580c', sukun: '#e0a100' };
export const NAME = { fatha: 'فَتْحَة', kasra: 'كَسْرَة', damma: 'ضَمَّة', sukun: 'سُكون' };

// Letters that take harakat in the games (no alif), with the name used in "where is the letter ...".
export const LETTERS = 'بتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
export const LETTER_NAME = {
  ب: 'الباء', ت: 'التاء', ث: 'الثاء', ج: 'الجيم', ح: 'الحاء', خ: 'الخاء', س: 'السين', ش: 'الشين', ص: 'الصاد',
  ض: 'الضاد', ط: 'الطاء', ظ: 'الظاء', ع: 'العين', غ: 'الغين', ف: 'الفاء', ق: 'القاف', ك: 'الكاف', ل: 'اللام',
  م: 'الميم', ن: 'النون', ه: 'الهاء', ي: 'الياء',
};
// The six "shy" letters (and alif with hamza) never join the letter after them.
const NO_JOIN = 'اأإآدذرزو';

export const syl = (letter, kind) => letter + MARK[kind];
// What the voice says for a syllable. A letter with sukun is read with a helping hamza, as teachers do: بْ → أَبْ.
export const sylSaid = (letter, kind) => (kind === 'sukun' ? `أَ${letter}${MARK.sukun}` : syl(letter, kind));
export const markOnly = (kind) => 'ـ' + MARK[kind];   // tatweel + mark: the haraka on its own

// Word -> picture (img/icons/w/<name>.svg). Short words: only fatha, kasra, damma, and sukun on the last letter.
export const WORDS = {
  'أَسَدْ': 'lion', 'جَمَلْ': 'camel', 'سَمَكْ': 'fish', 'قَمَرْ': 'moon', 'قَلَمْ': 'pen', 'بَقَرْ': 'cow',
  'وَلَدْ': 'boy', 'عَلَمْ': 'flag', 'مَطَرْ': 'rain', 'جَبَلْ': 'mountain', 'حَجَرْ': 'rock', 'فَرَسْ': 'horse',
  'بَصَلْ': 'onion', 'عَسَلْ': 'honey', 'طَبَقْ': 'plate', 'لَبَنْ': 'milk', 'شَجَرْ': 'tree',
  'نَمِرْ': 'tiger', 'عِنَبْ': 'grapes', 'قِرْدْ': 'monkey', 'بِنْتْ': 'girl', 'مِلْحْ': 'salt',
  'كُتُبْ': 'books', 'سُفُنْ': 'ship', 'أُذُنْ': 'ear', 'خُبْزْ': 'bread', 'قُفْلْ': 'lock', 'جُبْنْ': 'cheese',
  'بَحْرْ': 'sea', 'شَمْسْ': 'sun', 'كَلْبْ': 'dog', 'قَلْبْ': 'heart', 'وَرْدْ': 'rose', 'نَحْلْ': 'bee',
  'نَجْمْ': 'star', 'لَحْمْ': 'meat', 'ثَلْجْ': 'snow', 'فَأْرْ': 'mouse', 'بَيْتْ': 'house', 'شَمْعْ': 'candle',
  'وَجْهْ': 'face', 'ثَعْلَبْ': 'fox', 'حَبْلْ': 'rope', 'هَدَفْ': 'target', 'سَهْمْ': 'arrow', 'أَنْفْ': 'nose',
  'نَسْرْ': 'eagle', 'زُحَلْ': 'planet', 'إِبَرْ': 'needle', 'حُمُرْ': 'donkey', 'سُحُبْ': 'cloud', 'مُدُنْ': 'city',
  'قِطَطْ': 'cat', 'شُهُبْ': 'comet', 'إِبِلْ': 'camels', 'رِجْلْ': 'leg',
};

// Build the Word: easy words first (all fatha), then kasra and damma, then a sukun in the middle.
export const BUILD_STEPS = [
  ['قَلَمْ', 'سَمَكْ', 'جَمَلْ', 'قَمَرْ', 'أَسَدْ', 'مَطَرْ', 'جَبَلْ', 'عَسَلْ', 'بَقَرْ', 'وَلَدْ', 'عَلَمْ', 'حَجَرْ',
    'فَرَسْ', 'بَصَلْ', 'طَبَقْ', 'لَبَنْ', 'شَجَرْ'],
  ['عِنَبْ', 'نَمِرْ', 'كُتُبْ', 'سُفُنْ', 'أُذُنْ', 'زُحَلْ', 'إِبَرْ', 'حُمُرْ', 'سُحُبْ', 'مُدُنْ', 'قِطَطْ', 'شُهُبْ', 'إِبِلْ'],
  ['شَمْسْ', 'كَلْبْ', 'قَلْبْ', 'نَجْمْ', 'بِنْتْ', 'بَحْرْ', 'وَرْدْ', 'نَحْلْ', 'خُبْزْ', 'قُفْلْ', 'لَحْمْ', 'ثَلْجْ',
    'بَيْتْ', 'شَمْعْ', 'حَبْلْ', 'سَهْمْ', 'نَسْرْ', 'مِلْحْ', 'جُبْنْ', 'رِجْلْ', 'قِرْدْ', 'وَجْهْ'],
];

// Where is the Letter: every [letter, word, place] in WORDS where the letter shows its real shape for that place.
// Skipped: a shy letter (it has no start or middle shape), a letter right after a shy letter (it starts again
// with its first shape), and a letter that is in the word twice.
export const PLACES = Object.keys(WORDS).flatMap((word) => {
  const ls = splitLetters(word).map(([c]) => c);
  return ls.flatMap((c, i) => {
    if (!LETTER_NAME[c] || ls.indexOf(c) !== ls.lastIndexOf(c) || (i > 0 && NO_JOIN.includes(ls[i - 1]))) return [];
    return [[c, word, i === 0 ? 'start' : i === ls.length - 1 ? 'end' : 'middle']];
  });
});
export const PLACE_ORDER = ['start', 'middle', 'end'];
export const PLACE_LABEL = { start: 'أوّل', middle: 'وسط', end: 'آخر' };
export const FORM = { start: (c) => c + 'ـ', middle: (c) => 'ـ' + c + 'ـ', end: (c) => 'ـ' + c };

// 'قَلَمْ' -> [['ق', 'َ'], ['ل', 'َ'], ['م', 'ْ']]
export function splitLetters(word) {
  const out = [];
  for (const ch of word) {
    if (KIND_OF[ch] && out.length) out[out.length - 1][1] += ch;
    else out.push([ch, '']);
  }
  return out;
}

// Index (in the word's characters) of the letter at `pos` in splitLetters(word).
export function charIndex(word, pos) {
  return splitLetters(word).slice(0, pos).reduce((n, [c, m]) => n + c.length + m.length, 0);
}

// Every spoken Arabic line.
export const LA = {
  hello: 'أهلاً يا يوسف! هيّا نقرأ!',
  greats: ['أحسنت!', 'برافو يا سفسوفي!', 'خطير خطير!', 'شطور!', 'برافو برافو برافو!'],   // Dad's own words
  finish: 'أنهيتَ اللعبة يا يوسف! هذه نجومك!',
  this: 'هذه',
  want: 'نريد',
  moves: {
    intro: 'كلُّ حركةٍ لها صوت! اضغط على الحركة التي تجعل الحرف يقول',
    make: 'اجعلْ الحرف يقول',
    up: 'فتحة! سونيك يقفز لأعلى!',
    down: 'كسرة! سونيك يتزلّج لأسفل!',
    ball: 'ضمّة! سونيك يلتفّ مثل الكرة!',
    stop: 'سكون! سونيك يقف ويمسك الحلقة!',
  },
  listen: {
    intro: 'اسمع جيّداً، واضغط على ما تسمع.',
    where: 'أين',
  },
  pop: {
    intro: (kind) => `فرقِعْ الفقاعات التي فيها ${NAME[kind]}!`,
    more: 'هيا، فقاعة أخرى!',
  },
  build: {
    intro: 'رتّب الحروف من اليمين، لتكتب كلمة',
    prompt: 'اكتب كلمة',
    first: 'ابدأ من اليمين!',
    next: 'ما الحرف التالي؟ اسمع الكلمة',
  },
  where: {
    ask: (letter) => `أين حرف ${LETTER_NAME[letter]} في كلمة`,
    look: (letter) => `انظر! هذا حرف ${LETTER_NAME[letter]}`,
    start: 'في أوّل الكلمة!',
    middle: 'في وسط الكلمة!',
    end: 'في آخر الكلمة!',
  },
};

// Praise is said by a boy: the Mac voice raised in pitch (tools/make_voice.py).
export const BOY_LINES = LA.greats;

export const MOVE_LINE = { fatha: LA.moves.up, kasra: LA.moves.down, damma: LA.moves.ball, sukun: LA.moves.stop };

// Everything the voice can say (tools/list_lines.mjs) and every Arabic text drawn on screen (tools/make_arabic.py).
export function arabicLines() {
  const out = [LA.hello, ...LA.greats, LA.finish, LA.this, LA.want, LA.listen.where,
    ...Object.values(LA.moves), LA.listen.intro, LA.pop.more, ...Object.values(LA.build),
    LA.where.start, LA.where.middle, LA.where.end, ...Object.keys(WORDS)];
  for (const k of KINDS) out.push(LA.pop.intro(k), NAME[k]);
  for (const c of LETTERS) for (const k of KINDS) out.push(sylSaid(c, k));
  for (const c of Object.keys(LETTER_NAME)) out.push(LA.where.ask(c), LA.where.look(c));
  for (const w of Object.keys(WORDS)) for (const [c, m] of splitLetters(w)) out.push(sylSaid(c, KIND_OF[m]));
  return out;
}

export function arabicTexts() {
  const out = new Set(Object.keys(WORDS));
  for (const c of LETTERS) { out.add(c); for (const k of KINDS) out.add(syl(c, k)); }
  for (const k of KINDS) out.add(markOnly(k));
  for (const [c] of PLACES) for (const p of PLACE_ORDER) out.add(FORM[p](c));
  for (const w of Object.keys(WORDS)) for (const [c, m] of splitLetters(w)) out.add(c + m);
  for (const t of Object.values(PLACE_LABEL)) out.add(t);
  return [...out];
}
