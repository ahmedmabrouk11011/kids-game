// Progress lives in this browser only (localStorage). If storage is blocked, the games still work.
const KEY = 'kids-learn.v1';
let data = {};
try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { data = {}; }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export const store = {
  get muted() { return !!data.muted; },
  set muted(v) { data.muted = v; save(); },
  kid(id) {
    data.kids ??= {};
    return (data.kids[id] ??= { best: {}, stars: 0 });
  },
  addResult(kidId, gameId, stars) {
    const k = this.kid(kidId);
    k.best[gameId] = Math.max(k.best[gameId] || 0, stars);
    k.stars += stars;
    save();
  },
  // A game's difficulty level for this kid (Number Bond moves up and down with him).
  level(kidId, gameId) { return this.kid(kidId).levels?.[gameId] ?? 0; },
  setLevel(kidId, gameId, v) {
    const k = this.kid(kidId);
    (k.levels ??= {})[gameId] = v;
    save();
  },
};
