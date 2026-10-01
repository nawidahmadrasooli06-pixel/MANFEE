const { suit, rank, beats, winner } = require('./cards');

// Estimate tricks from controls, trump length and useful side-suit length.
function est(hand) {
  const bySuit = [[], [], [], []];
  hand.forEach(c => bySuit[suit(c)].push(rank(c)));
  bySuit.forEach(a => a.sort((x, y) => y - x));
  let expected = 0;
  for (let s = 0; s < 4; s++) {
    const a = bySuit[s], n = a.length;
    if (!n) continue;
    if (s === 0) {
      const weights = [1.0, .78, .5, .3, .18];
      a.slice(0, 5).forEach((r, i) => { if (r >= 8) expected += weights[i]; });
      if (n > 3) expected += (n - 3) * .48;
    } else {
      if (a.includes(12)) expected += .92;
      if (a.includes(11)) expected += n >= 2 ? .62 : .34;
      if (a.includes(10)) expected += n >= 3 ? .42 : .18;
      if (a.includes(9)) expected += n >= 4 ? .24 : .08;
      if (a.includes(8) && n >= 5) expected += .12;
      if (n >= 6 && a[0] >= 10) expected += .18;
    }
  }
  const trumps = bySuit[0].length;
  const voids = bySuit.slice(1).filter(a => !a.length).length;
  if (trumps >= 2) expected += Math.min(voids, 2) * .28;
  if (trumps >= 4) expected += (trumps - 3) * .22;
  return Math.max(0, Math.min(13, Math.round(expected)));
}

const cost = c => rank(c) + (suit(c) === 0 ? 18 : 0);
function pick(g, seat) {
  const legal = g.legal(seat).slice();
  if (legal.length <= 1) return legal[0];
  const team = seat % 2;
  const need = g.tc(team) - g.tt(team);
  const cheap = (a, b) => cost(a) - cost(b);

  // Leading: take a likely control when the partnership still needs tricks;
  // otherwise shed a low side-suit card and preserve trumps.
  if (!g.trick.length) {
    if (need > 0) {
      const sideControls = legal.filter(c => suit(c) !== 0 && rank(c) >= 10).sort((a, b) => rank(b) - rank(a));
      if (sideControls.length) return sideControls[0];
      const trumpControls = legal.filter(c => suit(c) === 0).sort((a, b) => rank(b) - rank(a));
      if (trumpControls.length) return trumpControls[0];
      return legal.sort((a, b) => rank(b) - rank(a))[0];
    }
    const side = legal.filter(c => suit(c) !== 0).sort(cheap);
    return side[0] ?? legal.sort(cheap)[0];
  }

  const winningSeat = winner(g.trick);
  const winningCard = g.trick.find(x => x.s === winningSeat).c;
  const partnerWinning = winningSeat % 2 === team;
  const winners = legal.filter(c => beats(c, winningCard)).sort(cheap);
  const losers = legal.filter(c => !beats(c, winningCard)).sort(cheap);

  if (partnerWinning) {
    // Do not overtake a partner: discard cheaply if possible.
    return losers[0] ?? winners[0] ?? legal.sort(cheap)[0];
  }
  if (need > 0) {
    // The opponents currently take the trick; use the cheapest card that wins it.
    return winners[0] ?? losers[losers.length - 1] ?? legal.sort(cheap)[0];
  }
  // No further trick is needed: avoid taking the trick and discard a high loser.
  return losers[losers.length - 1] ?? winners[0] ?? legal.sort(cheap)[0];
}

module.exports = { est, pick };
