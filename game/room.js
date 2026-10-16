const Game = require('./manfee');
class Room {
  constructor(code, io) {
    this.code = code; this.io = io; this.seats = [null, null, null, null];
    this.g = null; this.host = null; this.t = Date.now();
    this.look = { carpet: 'c1', cards: 'k1' }; this.track = 1; this.playing = false;
    this.spec = new Set(); this.invitePending = false; this.inviteAccepted = false; this.starting = 0; this.startTimer = null;
  }
  setTrack(n) { this.track = n; this.playing = true; this.seats.forEach(s => { if (s && s.sid) this.io.to(s.sid).emit('track', n); }); this.spec.forEach(id => this.io.to(id).emit('track', n)); }
  watch(sid) { this.spec.add(sid); this.send(); [...this.seats.filter(s => s && s.sid).map(s => s.sid), ...this.spec].forEach(id => this.io.to(id).emit('specJoin')); }
  seatOf(sid) { return this.seats.findIndex(x => x && x.sid == sid); }
  free() { return this.g ? [0, 1, 2, 3].filter(i => this.g.bot[i]) : []; }
  pickList() { return this.free().map(i => ({ i, name: this.seats[i].name, mate: this.seats[(i + 2) % 4].name })); }
  inviteInfo() {
    const hostSeat = this.seats.find(s => s && s.token === this.host);
    return { code: this.code, inviter: hostSeat ? hostSeat.name : 'دوستت', available: !this.g && !this.seats.every(Boolean), active: !!this.g && this.g.phase !== 'series' };
  }
  invite(sid) {
    if (this.seatOf(sid) < 0 || this.g) return;
    this.invitePending = true; this.inviteAccepted = false; this.send();
  }
  join(sid, name, token) {
    let i = this.seats.findIndex(x => x && (x.token == token || x.returnToken == token));
    if (i < 0) {
      if (this.g) return this.free().length ? -2 : -1;
      i = this.seats.findIndex(x => !x); if (i < 0) return -1;
      this.seats[i] = { name, token };
      if (this.invitePending && token !== this.host) { this.inviteAccepted = true; this.invitePending = false; }
    }
    const s = this.seats[i];
    if (s.returnToken === token) { s.returnToken = null; s.token = token; }
    s.sid = sid;
    if (name && !s.bot) s.name = name;
    if (!this.host) this.host = token;
    if (this.g) { this.g.bot[i] = false; this.g.names[i] = s.name; }
    this.send();
    if (this.g) { this.g.stopped ? this.g.wake() : this.g.kick(i); }
    return i;
  }
  take(sid, name, token, i) {
    if (!this.g || !this.g.bot[i] || this.seats.some(x => x && x.token == token)) return false;
    const old = this.seats[i] || {};
    this.seats[i] = { name, token, sid, returnToken: old.token || old.returnToken || null };
    this.g.bot[i] = false; this.g.names[i] = name;
    if (!this.host) this.host = token;
    this.send(); this.g.stopped ? this.g.wake() : this.g.kick(i);
    return true;
  }
  sub(sid, i) {
    const s = this.seats[i];
    if (!this.g || this.seatOf(sid) < 0 || !s || s.bot || s.sid || this.g.bot[i]) return;
    this.g.bot[i] = true; this.g.kick(i); this.send();
  }
  sit(sid, j) {
    const i = this.seatOf(sid);
    if (this.g || i < 0 || j < 0 || j > 3 || this.seats[j]) return;
    this.seats[j] = this.seats[i]; this.seats[i] = null; this.send();
  }
  start(sid, forceBots = false) {
    const i = this.seatOf(sid);
    if (this.g || i < 0 || this.seats[i].token != this.host) return false;
    if (this.invitePending && !this.inviteAccepted && !forceBots) return false;
    let n = 0;
    this.seats = this.seats.map(s => s || { name: 'ربات ' + (++n), bot: true });
    this.g = new Game(() => this.send(), this.seats.map(s => !!s.bot), this.seats.map(s => s.name));
    this.g.newHand();
    return true;
  }
  leave(sid) {
    if (this.spec.delete(sid)) { this.send(); return; }
    const i = this.seatOf(sid); if (i < 0) return;
    if (this.g) { this.seats[i].sid = null; if (!this.seats.some(s => s && s.sid)) this.g.stop(); }
    else {
      const tk = this.seats[i].token; this.seats[i] = null;
      if (this.host == tk) { const r = this.seats.find(Boolean); this.host = r ? r.token : null; }
    }
    this.send();
  }
  send() {
    this.t = Date.now(); const g = this.g;
    const seats = this.seats.map((s, i) => s ? { name: s.name, bot: !!s.bot, on: !!s.sid, off: !!g && !s.bot && !s.sid && !g.bot[i], sub: !!g && !s.bot && g.bot[i] } : null);
    const away = g ? seats.map((x, i) => x && x.off ? { i, name: x.name } : null).filter(Boolean) : [];
    this.seats.forEach((s, i) => {
      if (s && s.sid) this.io.to(s.sid).emit('state', {
        code: this.code, me: i, host: s.token == this.host, spec: this.spec.size, seats, away, g: g ? g.view(i) : null,
        look: this.look, track: this.track, playing: this.playing, starting: this.starting, invitePending: this.invitePending, inviteAccepted: this.inviteAccepted
      });
    });
    this.spec.forEach(id => {
      const v = g ? g.view(0) : null; if (v) { v.hand = []; v.legal = []; v.rem = null; }
      this.io.to(id).emit('state', { code: this.code, me: 0, host: false, isSpec: true, spec: this.spec.size, seats, away: [], g: v, look: this.look, track: this.track, playing: this.playing, starting: this.starting, invitePending: false, inviteAccepted: false });
    });
    this._sendAvs();
  }
  _ids() { return [...this.seats.filter(s => s && s.sid).map(s => s.sid), ...this.spec]; }
  _sendAvs() {
    const map = {}; this.seats.forEach((s, i) => { if (s && s.av) map[i] = s.av; });
    const sig = Object.keys(map).map(k => k + ':' + map[k].length + map[k].slice(-8)).join('|');
    const known = this._avk || (this._avk = new Set());
    if (sig !== this._avs) { this._avs = sig; known.clear(); }
    this._ids().forEach(id => { if (!known.has(id)) { known.add(id); this.io.to(id).emit('avs', map); } });
  }
  setAv(sid, av) {
    const i = this.seatOf(sid); if (i < 0 || !this.seats[i]) return;
    av = typeof av === 'string' ? av : '';
    if (av && !(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(av) || /^https:\/\/t\.me\//.test(av))) av = '';
    if (av.length > 7000) av = '';
    this.seats[i].av = av || undefined; this.send();
  }
  react(sid, k) {
    const i = this.seatOf(sid); if (i < 0 || !(k >= 0 && k < 6)) return;
    const s = this.seats[i], now = Date.now(); if (now - (s.lr || 0) < 1200) return; s.lr = now;
    this._ids().forEach(id => this.io.to(id).emit('react', { s: i, k }));
  }
  swap(sid, j) {
    const i = this.seatOf(sid);
    if (this.g || i < 0 || j < 0 || j > 3 || j === i) return;
    const t = this.seats[j]; if (!t || !t.sid || t.bot) return;
    this.sw = { a: i, b: j, ta: this.seats[i].token, tb: t.token };
    this.io.to(t.sid).emit('swapAsk', { name: this.seats[i].name });
  }
  swapAns(sid, ok) {
    const i = this.seatOf(sid), w = this.sw;
    if (!w || this.g || i !== w.b) return;
    this.sw = null; if (!ok) return;
    if (!this.seats[w.a] || !this.seats[w.b] || this.seats[w.a].token !== w.ta || this.seats[w.b].token !== w.tb) return;
    [this.seats[w.a], this.seats[w.b]] = [this.seats[w.b], this.seats[w.a]];
    this._ids().forEach(id => this.io.to(id).emit('swapDone')); this.send();
  }
}
module.exports = Room;
