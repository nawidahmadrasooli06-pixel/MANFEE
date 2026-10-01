const Game = require('./manfee');
class Room {
  constructor(code, io) { this.code = code; this.io = io; this.seats = [null, null, null, null]; this.g = null; this.host = null; this.t = Date.now(); }
  seatOf(sid) { return this.seats.findIndex(x => x && x.sid == sid); }
  join(sid, name, token) {
    let i = this.seats.findIndex(x => x && x.token == token);
    if (i < 0) {
      if (this.g) return -1;
      i = this.seats.findIndex(x => !x); if (i < 0) return -1;
      this.seats[i] = { name, token };
    }
    const s = this.seats[i]; s.sid = sid;
    if (!this.host) this.host = token;
    if (this.g) this.g.bot[i] = false;
    this.send(); return i;
  }
  sit(sid, j) {
    const i = this.seatOf(sid);
    if (this.g || i < 0 || j < 0 || j > 3 || this.seats[j]) return;
    this.seats[j] = this.seats[i]; this.seats[i] = null; this.send();
  }
  start(sid) {
    const i = this.seatOf(sid);
    if (this.g || i < 0 || this.seats[i].token != this.host) return;
    let n = 0;
    this.seats = this.seats.map(s => s || { name: 'ربات ' + (++n), bot: true });
    this.g = new Game(() => this.send(), this.seats.map(s => !!s.bot), this.seats.map(s => s.name));
    this.g.newHand();
  }
  leave(sid) {
    const i = this.seatOf(sid); if (i < 0) return;
    if (this.g) { this.seats[i].sid = null; this.g.bot[i] = true; this.g.kick(i); }
    else { const tk = this.seats[i].token; this.seats[i] = null; if (this.host == tk) { const r = this.seats.find(Boolean); this.host = r ? r.token : null; } }
    this.send();
  }
  send() {
    this.t = Date.now();
    const seats = this.seats.map(s => s ? { name: s.name, bot: !!s.bot } : null);
    this.seats.forEach((s, i) => {
      if (s && s.sid) this.io.to(s.sid).emit('state', { code: this.code, me: i, host: s.token == this.host, seats, g: this.g ? this.g.view(i) : null });
    });
  }
}
module.exports = Room;
