// Prints every line the games can say as JSON [{key, text, boy}] (one per key). Used by make_voice.py.
import { allLines, voiceKey } from '../js/lines.js';
import { BOY_LINES } from '../js/arabic.js';

const byKey = new Map();
for (const text of allLines()) if (!byKey.has(voiceKey(text))) byKey.set(voiceKey(text), text);
// boy: the line's number (1, 2 ...) among the praise lines, for a real recording (see make_voice.py).
const boy = new Map(BOY_LINES.map((t, i) => [voiceKey(t), i + 1]));
console.log(JSON.stringify([...byKey].map(([key, text]) => ({ key, text, boy: boy.get(key) || 0 }))));
