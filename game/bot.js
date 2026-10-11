const { suit, rank, deck } = require('./cards');
let smart;
try { smart = require('./smartplay'); } catch (e1) { try { smart = require('./game/smartplay'); } catch (e2) { console.log('smartplay.js not found; using simple bot'); smart = { choose: o => o.legal[0] }; } }
const ALLS = [0, 1, 2, 3].map(s => Array.from({ length: 13 }, (_, i) => s * 13 + i));
const all = s => ALLS[s];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// یک دست کامل را با همان منطق بازی ربات شبیه‌سازی می‌کند و تعداد دست‌های صندلی ۰ را برمی‌گرداند
function simulate(hands) {
  const hs = hands.map(h => h.slice()), played = new Set(), voids = [new Set(), new Set(), new Set(), new Set()];
  let lead = Math.random() * 4 | 0, mine = 0;
  for (let t = 0; t < 13; t++) {
    const trick = [];
    for (let k = 0; k < 4; k++) {
      const p = (lead + k) % 4, h = hs[p], led = trick.length ? suit(trick[0].c) : null;
      const f = led !== null ? h.filter(c => suit(c) === led) : [], legal = f.length ? f : h;
      const c = smart.choose({ legal, hand: h, trick, me: p, trump: 0, S: suit, R: rank, all, played, voids });
      if (led !== null && suit(c) !== led) voids[p].add(led);
      played.add(c); hs[p] = h.filter(x => x !== c); trick.push({ p, c });
    }
    let b = trick[0]; for (const x of trick) if (suit(x.c) === suit(b.c) ? rank(x.c) > rank(b.c) : suit(x.c) === 0) b = x;
    if (b.p === 0) mine++; lead = b.p;
  }
  return mine;
}
// ادعا = همان تعداد دستی که واقعاً انتظار دارد بگیرد (نه بیشتر، نه کمتر)
function est(hand) {
  const rest = [...Array(52).keys()].filter(c => !hand.includes(c)), N = 140;
  let tot = 0;
  for (let n = 0; n < N; n++) { shuffle(rest); tot += simulate([hand, rest.slice(0, 13), rest.slice(13, 26), rest.slice(26, 39)]); }
  return Math.max(0, Math.min(13, Math.round(tot / N)));
}
function memory(g) {
  if (!g.__m || g.__m.rid !== g.rid) g.__m = { rid: g.rid, played: new Set(), voids: [new Set(), new Set(), new Set(), new Set()] };
  const m = g.__m, learn = list => list.forEach((x, i) => { m.played.add(x.c); if (i > 0 && suit(x.c) !== suit(list[0].c)) m.voids[x.s].add(suit(list[0].c)); });
  learn(g.trick); if (g.last) learn(g.last.cards);
  return m;
}
function pick(g, seat) {
  const legal = g.legal(seat).slice();
  if (legal.length <= 1) return legal[0];
  const m = memory(g), team = seat % 2;
  const need = g.tc(team) - g.tt(team), oppNeed = g.tc(1 - team) - g.tt(1 - team);
  return smart.choose({ legal, hand: g.hands[seat], trick: g.trick.map(x => ({ p: x.s, c: x.c })), me: seat, trump: 0, S: suit, R: rank, all, played: m.played, voids: m.voids, mustWin: need <= 0 || oppNeed <= 0 });
}
module.exports = { est, pick };
