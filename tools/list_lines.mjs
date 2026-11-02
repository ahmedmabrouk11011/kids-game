// Prints every line the games can say as JSON [{key, text}] (one per key). Used by make_voice.py.
import { allLines, voiceKey } from '../js/lines.js';

const byKey = new Map();
for (const text of allLines()) if (!byKey.has(voiceKey(text))) byKey.set(voiceKey(text), text);
console.log(JSON.stringify([...byKey].map(([key, text]) => ({ key, text }))));
