// بازی حکم (فیسکوت) - سرور آنلاین (مستقل از منفی؛ کانال /fiskoot)
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', BOTS = ['احمد', 'محمد', 'محمود'];
const S = c => c / 20 | 0, Rk = c => c % 20;
const sh = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const mk = low => { const d = []; for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push(s * 20 + (r == 14 && low ? 1 : r)); return sh(d); };
const beats = (a, b, t) => S(a) == S(b) ? Rk(a) > Rk(b) : (S(a) == t && S(b) != t);
const winner = (tr, t) => { let b = tr[0]; for (const x of tr) if (beats(x.c, b.c, t)) b = x; return b.p; };
module.exports = function (io) {
  const nsp = io.of('/fiskoot'), rooms = {};
  const legal = (r, p) => { const h = r.hands[p], led = r.trick.length ? S(r.trick[0].c) : null; const lg = led !== null ? h.filter(c => S(c) == led) : []; return lg.length ? lg : h; };
  const actor = r => r.phase == 'pick' ? r.pick.turn : r.phase == 'trump' ? r.hk : r.phase == 'play' ? r.turn : -1;
  const view = (r, i) => ({
    code: r.code, ph: r.phase, me: i, host: r.seats[i].token === r.host, low: r.aceLow,
    seats: r.seats.map((s, k) => s && { n: s.name, b: s.bot, on: s.on, k: r.hands[k].length }),
    hand: r.hands[i], tr: r.trump, hk: r.hk, dl: r.dl, turn: r.phase == 'play' ? r.turn : -1,
    trick: r.trick, w: r.phase == 'tr' ? winner(r.trick, r.trump) : -1, last: r.last, tw: r.tw, sc: r.sc,
    pk: r.pick && { f: r.pick.f, t: r.pick.turn }, res: r.res, wait: r.wait, cnt: r.cnt,
    lg: (r.phase == 'play' && r.turn === i) ? legal(r, i) : null
  });
  const send = r => r.seats.forEach((s, i) => { if (s && s.sid && s.on) { const so = nsp.sockets.get(s.sid); if (so) so.emit('st', view(r, i)); } });
  const seatOf = (r, tok) => r.seats.findIndex(s => s && s.token === tok);
  const botTrump = h => { let b = 0, bs = -1; for (let s = 0; s < 4; s++) { const l = h.filter(c => S(c) == s); const v = l.length * 100 + l.reduce((a, c) => a + Rk(c), 0); if (v > bs) { bs = v; b = s; } } return b; };
  const botPlay = (r, p) => {
    const t = r.trump, Lg = legal(r, p), key = c => (S(c) == t ? 100 : 0) + Rk(c), asc = a => [...a].sort((x, y) => key(x) - key(y));
    if (!r.trick.length) return [...Lg].sort((a, b) => ((S(b) != t) - (S(a) != t)) || Rk(b) - Rk(a))[0];
    let b = r.trick[0]; for (const x of r.trick) if (beats(x.c, b.c, t)) b = x;
    if (b.p % 2 == p % 2) return asc(Lg)[0];
    const w = asc(Lg.filter(c => beats(c, b.c, t))); return w.length ? w[0] : asc(Lg)[0];
  };
  function step(r) {
    clearTimeout(r.t); r.wait = null; r.at = Date.now();
    const at = (ms, f) => { r.t = setTimeout(f, ms); };
    const p = r.phase;
    if (p == 'count') at(1000, () => { if (--r.cnt <= 0) { r.phase = 'hint'; step(r); } else step(r); });
    else if (p == 'hint') at(5200, () => { r.phase = 'pick'; r.pick = { deck: r.pick.deck, f: [], turn: 0 }; step(r); });
    else if (p == 'hk') at(3000, () => startDeal(r));
    else if (p == 'tr') at(1500, () => endTrick(r));
    else if (p == 'res') at(7000, () => { r.hk = r.res.nhk; r.dl = (r.hk + 3) % 4; startDeal(r); });
    else {
      const a = actor(r);
      if (a >= 0) {
        const s = r.seats[a];
        if (!s.bot && !s.on) { r.wait = a; return send(r); }
        if (s.bot) at(p == 'pick' ? 700 : p == 'trump' ? 1400 : 850, () => {
          if (p == 'pick') { const un = r.pick.deck.map((_, i) => i).filter(i => !r.pick.f.some(f => f[0] == i)); flip(r, a, un[Math.random() * un.length | 0]); }
          else if (p == 'trump') setTrump(r, botTrump(r.hands[a]));
          else playCard(r, a, botPlay(r, a));
        });
      }
    }
    send(r);
  }
  function flip(r, seat, i) {
    if (r.phase != 'pick' || r.pick.turn != seat || !(i >= 0 && i < 52) || r.pick.f.some(f => f[0] == i)) return;
    const c = r.pick.deck[i]; r.pick.f.push([i, c, seat]);
    if (Rk(c) == (r.aceLow ? 1 : 14)) { r.hk = seat; r.dl = (seat + 3) % 4; r.phase = 'hk'; } else r.pick.turn = (seat + 1) % 4;
    step(r);
  }
  function startDeal(r) { r.deck = mk(r.aceLow); r.hands = [[], [], [], []]; r.hands[r.hk] = r.deck.splice(0, 5); r.trump = null; r.tw = [0, 0]; r.trick = []; r.last = null; r.res = null; r.phase = 'trump'; step(r); }
  function setTrump(r, t) {
    if (r.phase != 'trump' || !(t >= 0 && t < 4)) return; r.trump = t;
    for (let p = 0; p < 4; p++) r.hands[p].push(...r.deck.splice(0, 13 - r.hands[p].length));
    r.phase = 'play'; r.turn = r.hk; step(r);
  }
  function playCard(r, seat, c) {
    if (r.phase != 'play' || r.turn != seat || !r.hands[seat].includes(c) || !legal(r, seat).includes(c)) return false;
    r.hands[seat].splice(r.hands[seat].indexOf(c), 1); r.trick.push({ p: seat, c });
    if (r.trick.length == 4) r.phase = 'tr'; else r.turn = (seat + 1) % 4;
    step(r); return true;
  }
  function endTrick(r) {
    const w = winner(r.trick, r.trump); r.last = { cards: r.trick, w }; r.tw[w % 2]++; r.trick = [];
    if (r.tw[0] >= 7 || r.tw[1] >= 7) {
      const ht = r.hk % 2, wt = r.tw[0] >= 7 ? 0 : 1, o = 1 - wt; let pts = 1, kind = 'برد عادی';
      if (wt == ht) { if (r.tw[o] == 0) { pts = 3; kind = 'کت‌فیسی 🔥'; } } else if (r.tw[ht] == 0) { pts = 7; kind = 'کدرنگ 💥'; }
      r.sc[wt] += pts;
      r.res = { kind, pts, w: wt, tw: [...r.tw], nhk: wt == ht ? r.hk : (r.hk + 1) % 4 };
      r.phase = (r.sc[0] >= 13 || r.sc[1] >= 13) ? 'over' : 'res';
    } else { r.phase = 'play'; r.turn = w; }
    step(r);
  }
  const place = r => [0, 2, 1, 3].find(i => !r.seats[i]);
  const mkSeat = (name, token, sid) => ({ name: String(name || 'بازیکن').slice(0, 14), token, sid, bot: false, on: true });
  const back = (so, r, i, tok) => { const s = r.seats[i]; s.sid = so.id; s.on = true; if (s.rep) { s.bot = false; s.rep = false; } so.data = { code: r.code, tok }; step(r); };
  nsp.on('connection', so => {
    const R = () => rooms[so.data && so.data.code], tk = () => so.data && so.data.tok;
    so.on('create', ({ name, token } = {}) => {
      let c; do c = [0, 1, 2, 3].map(() => L[Math.random() * 24 | 0]).join(''); while (rooms[c]);
      const r = rooms[c] = { code: c, host: token, seats: [mkSeat(name, token, so.id), null, null, null], phase: 'lobby', aceLow: false, sc: [0, 0], hk: -1, dl: -1, trump: null, hands: [[], [], [], []], trick: [], last: null, tw: [0, 0], turn: -1, pick: null, res: null, wait: null, cnt: 0, t: null, at: Date.now() };
      so.data = { code: c, tok: token }; send(r);
    });
    so.on('join', ({ code, name, token } = {}) => {
      const r = rooms[String(code || '').toUpperCase().trim()]; if (!r) return so.emit('err', 'اتاق پیدا نشد؛ کد را بررسی کن.');
      const i = seatOf(r, token); if (i >= 0) return back(so, r, i, token);
      if (r.phase != 'lobby') return so.emit('err', 'بازی شروع شده و اتاق پر است.');
      const p = place(r); if (p === undefined) return so.emit('err', 'اتاق پر است.');
      r.seats[p] = mkSeat(name, token, so.id); so.data = { code: r.code, tok: token }; send(r);
    });
    so.on('rejoin', ({ code, token } = {}) => {
      const r = rooms[String(code || '').toUpperCase().trim()], i = r ? seatOf(r, token) : -1;
      if (i < 0) return so.emit('gone'); back(so, r, i, token);
    });
    so.on('sit', k => { const r = R(), i = r ? seatOf(r, tk()) : -1; k = k | 0; if (r && r.phase == 'lobby' && i >= 0 && k >= 0 && k < 4 && !r.seats[k]) { r.seats[k] = r.seats[i]; r.seats[i] = null; send(r); } });
    so.on('cfg', o => { const r = R(); if (r && r.phase == 'lobby' && tk() === r.host) { r.aceLow = !!(o && o.low); send(r); } });
    so.on('start', () => {
      const r = R(); if (!r || r.phase != 'lobby' || tk() !== r.host) return;
      let n = 0; for (let i = 0; i < 4; i++) if (!r.seats[i]) r.seats[i] = { name: BOTS[n++], token: null, sid: null, bot: true, auto: true, on: true };
      r.sc = [0, 0]; r.phase = 'count'; r.cnt = 3; r.pick = { deck: mk(r.aceLow), f: [], turn: 0 }; step(r);
    });
    so.on('flip', i => { const r = R(), s = r ? seatOf(r, tk()) : -1; if (s >= 0) flip(r, s, i | 0); });
    so.on('trump', t => { const r = R(), s = r ? seatOf(r, tk()) : -1; if (s >= 0 && s == r.hk) setTrump(r, t | 0); });
    so.on('play', c => { const r = R(), s = r ? seatOf(r, tk()) : -1; if (s >= 0 && !playCard(r, s, c | 0) && r.phase == 'play') so.emit('err', 'بازی این کارت مجاز نیست؛ باید از همان خالی که بازی شده بازی کنی.'); });
    so.on('replace', () => { const r = R(); if (r && r.wait != null && seatOf(r, tk()) >= 0) { const s = r.seats[r.wait]; s.bot = true; s.rep = true; step(r); } });
    so.on('again', () => {
      const r = R(); if (!r || r.phase != 'over' || tk() !== r.host) return; clearTimeout(r.t);
      r.seats = r.seats.map(s => (s && !s.auto && !s.rep && s.on) ? s : null); r.phase = 'lobby'; r.sc = [0, 0]; r.hands = [[], [], [], []]; r.trick = []; r.last = null; r.res = null; r.hk = r.dl = -1; r.trump = null; send(r);
    });
    so.on('disconnect', () => {
      const r = R(); if (!r) return; const i = seatOf(r, tk()); if (i < 0 || r.seats[i].sid !== so.id) return;
      if (r.phase == 'lobby') { r.seats[i] = null; const h = r.seats.find(s => s); if (h) r.host = h.token; else delete rooms[r.code]; if (rooms[r.code]) send(r); }
      else { r.seats[i].on = false; r.seats[i].sid = null; step(r); }
    });
  });
  setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (!r.seats.some(s => s && s.on && !s.bot) && Date.now() - r.at > 36e5) { clearTimeout(r.t); delete rooms[c]; } } }, 6e5);
};
