const { suit, rank, beats, winner } = require('./cards');
const val = c => (suit(c) ? 0 : 100) + rank(c);
function est(h) {
  let e = 0; const n = [0, 0, 0, 0]; h.forEach(c => n[suit(c)]++);
  h.forEach(c => {
    const s = suit(c), r = rank(c);
    if (s == 0) { if (r >= 10) e += r == 12 ? 1 : r == 11 ? .9 : .6; else if (r == 9 && n[0] >= 3) e += .4; }
    else if (r == 12) e += .9; else if (r == 11 && n[s] >= 2) e += .5; else if (r == 10 && n[s] >= 3) e += .3;
  });
  if (n[0] > 3) e += (n[0] - 3) * .7;
  for (let s = 1; s < 4; s++) { if (n[0] >= 2 && n[s] == 0) e += .8; else if (n[0] >= 3 && n[s] == 1) e += .4; }
  return Math.max(0, Math.round(e));
}
function pick(g, s) {
  const L = g.legal(s).sort((a, b) => val(a) - val(b)), t = s % 2, need = g.tc(t) - g.tt(t);
  if (!g.trick.length) {
    if (need > 0) return L.filter(c => suit(c) && rank(c) >= 10).pop() || L[0];
    return L.find(c => suit(c)) || L[0];
  }
  const w = winner(g.trick), cur = g.trick.find(x => x.s == w).c;
  if (w % 2 == t) return L[0];
  if (need > 0) return L.find(c => beats(c, cur)) || L[0];
  const nw = L.filter(c => !beats(c, cur));
  return nw.length ? nw[nw.length - 1] : L[0];
}
module.exports = { est, pick };
