// card id = suit*13 + rank ; suit 0=♠(trump) 1=♥ 2=♦ 3=♣ ; rank 0..12 = 2..A
const suit = c => c / 13 | 0, rank = c => c % 13;
const ORD = [0, 1, 3, 2];
function deck() {
  const d = [...Array(52).keys()];
  for (let i = 51; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
const sortHand = h => h.sort((a, b) => ORD.indexOf(suit(a)) - ORD.indexOf(suit(b)) || rank(b) - rank(a));
const beats = (a, b) => suit(a) == suit(b) ? rank(a) > rank(b) : suit(a) == 0;
function winner(t) { let b = t[0]; for (const x of t) if (beats(x.c, b.c)) b = x; return b.s; }
module.exports = { suit, rank, deck, sortHand, beats, winner };
