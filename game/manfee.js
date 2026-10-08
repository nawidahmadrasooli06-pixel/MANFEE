const { suit, deck, sortHand, winner } = require('./cards');
const bot = require('./bot');
// seats 0..3 ; play order goes seat -> seat+1 (to the right) ; teams = seat%2
class Game {
  constructor(cb, bots, names) {
    Object.assign(this, { cb, bot: bots, names, ser: [0, 0], dealer: -1, rid: 0, nid: 0, timers: [], phase: 'lobby', win: -1, dl: 0, dls: -1, stopped: false, mirWait: 0 });
  }
  later(f, ms) { const t = setTimeout(f, ms); this.timers.push(t); return t; }
  emit() { this.cb(); }
  // Human turns deliberately have no deadline or automatic action.
  disarm() { this.dl = 0; this.dls = -1; }
  tc(t) { return this.claim[t] + this.claim[t + 2]; }
  tt(t) { return this.taken[t] + this.taken[t + 2]; }
  legal(s) {
    const h = this.hands[s];
    if (!this.trick.length) return h.slice();
    const f = h.filter(c => suit(c) == suit(this.trick[0].c));
    return f.length ? f : h.slice();
  }
  newHand() {
    this.disarm(); this.timers.forEach(clearTimeout); this.timers = [];
    this.dealer = (this.dealer + 1) % 4;
    const d = deck();
    this.hands = [0, 1, 2, 3].map(i => sortHand(d.slice(i * 13, i * 13 + 13)));
    Object.assign(this, { claim: [0, 0, 0, 0], taken: [0, 0, 0, 0], trick: [], last: null, res: null, note: '', win: -1, bi: 0, phase: 'countdown', countdown: 3 });
    this.rid++;
    this.order = [1, 2, 3, 4].map(k => (this.dealer + k) % 4);
    this.emit();
    this.countdownStep();
  }
  countdownStep() {
    if (this.phase !== 'countdown') return;
    if (this.countdown <= 0) {
      this.phase = 'deal'; this.emit();
      this.later(() => { this.phase = 'bid'; this.bidStep(); }, 1800);
      return;
    }
    this.emit();
    const n = this.countdown;
    this.later(() => { if (this.phase === 'countdown' && this.countdown === n) { this.countdown--; this.countdownStep(); } }, 900);
  }
  bidStep() {
    if (this.phase != 'bid') return;
    const p = this.order[this.bi], sum = this.claim.reduce((a, b) => a + b, 0);
    if (this.bi == 3) { this.claim[p] = 13 - sum; this.phase = 'mir'; this.emit(); this.mirStep(); return; }
    const auto = () => {
      if (this.phase != 'bid' || this.order[this.bi] != p) return;
      this.claim[p] = Math.min(bot.est(this.hands[p]), 13 - sum); this.bi++; this.bidStep();
    };
    if (this.bot[p]) { this.emit(); this.later(() => { if (this.bot[p]) auto(); }, 900); }
    else { this.disarm(); this.emit(); }
  }
  bid(s, n) {
    if (this.phase != 'bid' || this.order[this.bi] != s) return;
    this.disarm();
    const sum = this.claim.reduce((a, b) => a + b, 0);
    this.claim[s] = Math.max(0, Math.min(13 - sum, n | 0)); this.bi++; this.bidStep();
  }
  mirStep() {
    if (this.phase != 'mir') return;
    const p = this.dealer;
    if (this.bot[p]) { this.disarm(); this.later(() => { if (this.bot[p]) this.mirBot(); }, 1200); }
    else { this.disarm(); this.emit(); }
  }
  mirBot() {
    if (this.phase != 'mir') return;
    const p = this.dealer;
    Math.abs(this.claim[p] - bot.est(this.hands[p])) >= 3 ? this.swap() : this.go();
  }
  mir(s, a) {
    if (this.phase != 'mir' || s != this.dealer) return;
    if (a == 'swap') return this.prepareSwap();
    this.go();
  }
  prepareSwap() {
    if (this.phase != 'mir') return;
    this.disarm();
    this.phase = 'mirWait';
    this.mirWait = 10;
    this.emit();
    const tick = () => {
      if (this.phase != 'mirWait') return;
      if (this.mirWait <= 0) return this.swap();
      this.mirWait--;
      this.emit();
      this.later(tick, 1000);
    };
    this.later(tick, 1000);
  }
  swap() {
    const h = [], c = [];
    for (let i = 0; i < 4; i++) { h[(i + 1) % 4] = this.hands[i]; c[(i + 1) % 4] = this.claim[i]; }
    this.hands = h; this.claim = c; this.mirWait = 0; this.nid++;
    this.note = this.names[this.dealer] + ' ادعا را رد کرد — کارت‌ها و ادعاها چرخید!';
    this.go();
  }
  go() {
    this.disarm(); this.phase = 'play'; this.turn = this.order[0]; this.emit();
    this.later(() => this.turnStep(), this.note ? 1800 : 500);
  }
  turnStep() {
    if (this.phase != 'play') return;
    const s = this.turn;
    const f = () => { if (this.phase == 'play' && this.turn == s && this.hands[s].length) this.play(s, bot.pick(this, s)); };
    if (this.bot[s]) { this.disarm(); this.later(() => { if (this.bot[s]) f(); }, 650); this.emit(); }
    else { this.disarm(); this.emit(); }
  }
  play(s, c) {
    if (this.phase != 'play' || this.turn != s || !this.legal(s).includes(c)) return;
    this.disarm();
    this.hands[s] = this.hands[s].filter(x => x != c);
    this.trick.push({ s, c }); this.note = '';
    if (this.trick.length < 4) { this.turn = (s + 1) % 4; this.turnStep(); return; }
    this.phase = 'trick'; this.win = winner(this.trick); this.emit();
    this.later(() => this.resolve(), 1700);
  }
  resolve() {
    const w = this.win;
    this.taken[w]++; this.last = { cards: this.trick, w }; this.trick = []; this.turn = w; this.win = -1;
    for (const t of [0, 1]) if (this.tt(t) > this.tc(t)) return this.finish(t);
    if (!this.hands[0].length) return this.finish(-1);
    this.phase = 'play'; this.turnStep();
  }
  finish(t) {
    this.disarm(); this.phase = 'over'; this.res = t;
    if (t >= 0) { this.ser[t]++; if (this.ser[t] >= 5) this.phase = 'series'; }
    this.emit();
    if (this.phase == 'over') this.later(() => this.newHand(), 5000);
  }
  again() { if (this.phase == 'series') { this.ser = [0, 0]; this.newHand(); } }
  kick(s) {
    if (this.stopped) return;
    if (this.phase == 'bid' && this.order[this.bi] == s) this.bidStep();
    else if (this.phase == 'mir' && this.dealer == s) this.mirStep();
    else if (this.phase == 'play' && this.turn == s) this.turnStep();
  }
  stop() { this.stopped = true; this.disarm(); this.timers.forEach(clearTimeout); this.timers = []; }
  wake() {
    if (!this.stopped) return;
    this.stopped = false; const P = this.phase;
    if (P == 'countdown') this.countdownStep();
    else if (P == 'deal') this.later(() => { this.phase = 'bid'; this.bidStep(); }, 1000);
    else if (P == 'bid') this.bidStep();
    else if (P == 'mir') this.mirStep();
    else if (P == 'play') this.turnStep();
    else if (P == 'trick') this.later(() => this.resolve(), 500);
    else if (P == 'over') this.later(() => this.newHand(), 2000);
  }
  view(m) {
    const P = this.phase, k = i => P == 'bid' ? this.order.indexOf(i) < this.bi : P != 'deal';
    const sum = this.claim.reduce((a, b) => a + b, 0), pl = P != 'bid' && P != 'deal';
    return {
      phase: P, countdown: this.countdown || 0, mirWait: this.mirWait || 0, dealer: this.dealer, turn: this.turn, rid: this.rid, nid: this.nid, note: this.note, res: this.res,
      teams: [[this.names[0], this.names[2]], [this.names[1], this.names[3]]],
      ser: this.ser, seriesWinner: this.ser[0] >= 5 ? 0 : this.ser[1] >= 5 ? 1 : -1,
      win: this.win, trick: this.trick, last: this.last, taken: this.taken, hand: this.hands[m],
      claims: this.claim.map((c, i) => k(i) ? c : null),
      legal: P == 'play' && this.turn == m ? this.legal(m) : [],
      bidTurn: P == 'bid' ? this.order[this.bi] : -1, bidMax: 13 - sum,
      tc: pl ? [this.tc(0), this.tc(1)] : null,
      rem: P == 'over' || P == 'series' ? this.hands : null,
      dl: 0, dls: -1
    };
  }
}
module.exports = Game;
