// Sounds are made in code (Web Audio) and words use the tablet's built-in voice
// (speechSynthesis). No audio files, no paid voices. If the device has no voice, the games still work.

let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; if (m) stopSpeech(); }
export function isMuted() { return muted; }

export function unlock() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* no audio */ }
}

function tone(freq, dur, { type = 'sine', vol = 0.2, when = 0, slide } = {}) {
  if (muted || !ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur, { vol = 0.25, freq = 1200, when = 0 } = {}) {
  if (muted || !ctx) return;
  const t = ctx.currentTime + when;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = buf;
  f.type = 'bandpass';
  f.frequency.value = freq;
  g.gain.value = vol;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t);
}

// C major scale, so counting 1..10 climbs up like a song.
const SCALE = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1397];

export const sfx = {
  note(i) { tone(SCALE[Math.max(0, i) % SCALE.length], 0.22, { type: 'triangle', vol: 0.22 }); },
  pop() { noise(0.12, { vol: 0.5, freq: 1600 }); tone(700, 0.1, { type: 'square', vol: 0.06, slide: 180 }); },
  ding() { tone(880, 0.18, { vol: 0.25 }); tone(1320, 0.35, { vol: 0.2, when: 0.1 }); },
  boing() { tone(320, 0.35, { vol: 0.25, slide: 110 }); },
  whoosh() { noise(0.3, { vol: 0.25, freq: 700 }); },
  tada() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.2, when: i * 0.09 }));
    tone(1047, 0.7, { type: 'triangle', vol: 0.18, when: 0.38 });
    tone(1319, 0.7, { type: 'sine', vol: 0.12, when: 0.38 });
  },
  sparkle() { [1568, 2093, 2637].forEach((f, i) => tone(f, 0.12, { vol: 0.08, when: i * 0.05 })); },
};

// ---------- speech ----------
const synth = window.speechSynthesis;
let voice = null;

function chooseVoice() {
  if (!synth) return;
  const voices = synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  const liked = ['Samantha', 'Google US English', 'Karen', 'Moira', 'Tessa', 'Zira', 'Aria', 'Jenny', 'Female'];
  voice = liked.map((n) => voices.find((v) => v.name.includes(n))).find(Boolean)
    || voices.find((v) => /en[-_]US/i.test(v.lang)) || voices[0] || null;
}
if (synth) {
  chooseVoice();
  synth.addEventListener?.('voiceschanged', chooseVoice);
}

let sayToken = 0;

export function stopSpeech() {
  sayToken++;
  try { synth?.cancel(); } catch { /* ignore */ }
}

// Speak a line. Resolves when finished (or right away when there is no voice / muted).
// A newer say() cuts off the older one, so fast tapping never queues up.
export function say(text) {
  stopSpeech();
  if (muted || !synth || !text) return Promise.resolve();
  const my = sayToken;
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US';
    u.rate = 0.9;
    u.pitch = 1.15;
    const done = () => { clearTimeout(timer); resolve(my === sayToken); };
    const timer = setTimeout(done, 1500 + text.length * 110);
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  });
}
