// Sound effects are made in code (Web Audio). Spoken lines are recordings made on the Mac with a free voice
// (see lines.js and tools/make_voice.py); the device's own voice only reads lines that have no recording.
import { voiceKey } from './lines.js';

let ctx = null;
let voiceOut = null;
let muted = false;

export function setMuted(m) { muted = m; if (m) stopSpeech(); }
export function isMuted() { return muted; }

export function unlock() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      voiceOut = ctx.createGain();
      voiceOut.gain.value = 1.15;
      voiceOut.connect(ctx.destination);
    }
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
let manifest = {};
const manifestReady = fetch('audio/manifest.json')
  .then((r) => (r.ok ? r.json() : {}))
  .catch(() => ({}))
  .then((m) => { manifest = m; });

const clips = new Map(); // file -> Promise<AudioBuffer | null>
function loadClip(file) {
  if (!clips.has(file)) {
    unlock();
    clips.set(file, fetch(`audio/${file}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((buf) => new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej)))
      .catch(() => { clips.delete(file); return null; }));
  }
  return clips.get(file);
}

// Fetch lines ahead of time (e.g. the numbers at the start of a game) so they play without delay.
export async function preload(...texts) {
  await manifestReady;
  for (const t of texts.flat()) { const f = manifest[voiceKey(t)]; if (f) loadClip(f); }
}

// Things that want to know when the voice talks (the mascot bounces).
const listeners = new Set();
export const onTalk = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const talking = (on) => listeners.forEach((fn) => fn(on));

let sayToken = 0;
let current = null;

export function stopSpeech() {
  sayToken++;
  try { current?.stop(); } catch { /* already stopped */ }
  current = null;
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  talking(false);
}

// Missing recordings are collected here so tests can spot them.
export const missingVoice = new Set();

// Say one or more lines, one after the other. Resolves true when finished, false when cut off by a newer say().
export async function say(...parts) {
  stopSpeech();
  const my = sayToken;
  parts = parts.flat().filter((p) => typeof p === 'string' && p);
  if (muted || !parts.length) return true;
  await manifestReady;
  const files = parts.map((p) => manifest[voiceKey(p)]);
  files.forEach((f) => f && loadClip(f));
  talking(true);
  for (let i = 0; i < parts.length; i++) {
    const buf = files[i] ? await loadClip(files[i]) : null;
    if (my !== sayToken) return false;
    if (buf) await playClip(buf);
    else { missingVoice.add(parts[i]); await speakDevice(parts[i]); }
    if (my !== sayToken) return false;
  }
  talking(false);
  return true;
}

function playClip(buf) {
  return new Promise((resolve) => {
    unlock();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(voiceOut);
    current = src;
    const done = () => { clearTimeout(timer); resolve(); };
    const timer = setTimeout(done, buf.duration * 1000 + 400);
    src.onended = done;
    src.start();
  });
}

// Fallback: the device's own voice (often missing on Huawei tablets, which is why we record the lines).
const synth = window.speechSynthesis;
let deviceVoice = null;
function chooseVoice() {
  const voices = synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  deviceVoice = voices.find((v) => /Samantha|Google US English|Female/.test(v.name)) || voices[0] || null;
}
if (synth) { chooseVoice(); synth.addEventListener?.('voiceschanged', chooseVoice); }

function speakDevice(text) {
  if (!synth) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (deviceVoice) u.voice = deviceVoice;
    u.lang = deviceVoice?.lang || 'en-US';
    u.rate = 0.9;
    u.pitch = 1.1;
    const done = () => { clearTimeout(timer); resolve(); };
    const timer = setTimeout(done, 1200 + text.length * 90);
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  });
}
