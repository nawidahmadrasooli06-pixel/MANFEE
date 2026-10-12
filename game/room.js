const Game = require('./manfee');
//const db = require('../db');
const crypto = require('crypto');
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
  join(sid, name, token, telegramUserId = null) {
    let i = this.seats.findIndex(x => x && (x.token == token || x.returnToken == token));
    if (i < 0) {
      if (this.g) return this.free().length ? -2 : -1;
      i = this.seats.findIndex(x => !x); if (i < 0) return -1;
      this.seats[i] = { name, token };
      if (this.invitePending && token !== this.host) { this.inviteAccepted = true; this.invitePending = false; }
    }
    const s = this.seats[i];
    if (s.returnToken === token) { s.returnToken = null; s.token = token; }
    s.sid = sid; if (telegramUserId) s.telegramUserId = String(telegramUserId);
    if (name && !s.bot) s.name = name;
    if (!this.host) this.host = token;
    if (this.g) { this.g.bot[i] = false; this.g.names[i] = s.name; }
    this.send();
    if (this.g) { this.g.stopped ? this.g.wake() : this.g.kick(i); }
    return i;
  }
  take(sid, name, token, i, telegramUserId = null) {
    if (!this.g || !this.g.bot[i] || this.seats.some(x => x && x.token == token)) return false;
    const old = this.seats[i] || {};
    this.seats[i] = { name, token, sid, telegramUserId: telegramUserId ? String(telegramUserId) : null, returnToken: old.token || old.returnToken || null };
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
    if (g && g.phase === 'series' && !g.historySaved && !g.historySaving) {
      g.historySaving = true;
      const winnerTeam = g.ser[0] >= 5 ? 0 : 1;
      db.recordMatch({ id: g.historyId || crypto.randomUUID(), gameType: 'manfee', startedAt: g.seriesStartedAt || new Date(), endedAt: new Date(), winnerTeam, scores: g.ser,
        details: { hands: g.historyHands || [] },
        players: this.seats.map((x, i) => ({ name: x && x.name || g.names[i] || 'بازیکن', telegramId: x && !g.bot[i] && !x.bot ? x.telegramUserId : null, team: i % 2, isBot: !!(x && (x.bot || g.bot[i])), claims: g.seriesClaims ? g.seriesClaims[i] : null, taken: g.seriesTaken ? g.seriesTaken[i] : null, details: { seat: i } }))
      }).then(ok => { g.historySaving = false; if (ok) { g.historySaved = true; console.log('Manfee match history saved'); } }).catch(e => { g.historySaving = false; console.error('Manfee history save failed:', e.message); });
    }
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
  }
}
module.exports = Room;
