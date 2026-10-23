// لودو — سرور آنلاین (کانال /ludo). مستقل از منفی و حکم.
const crypto = require('crypto');
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', BOTS = ['احمد', 'محمد', 'محمود'];
const START = [0, 13, 26, 39];                      // خانهٔ شروع هر صندلی روی مسیر ۵۲تایی
const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]); // خانهٔ شروع و ستاره‌ها
const ACT = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] };
const ORD = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 2, 1, 3] };
const ring = (s, p) => (START[s] + p) % 52;
const FC = ['f1','f2','f3','f4','f5','f6','f7','f8','f9','f10'], GC = ['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10'];
module.exports = function (io) {
  const nsp = io.of('/ludo'), rooms = {};
  const ids = r => [...r.seats.filter(s => s && s.sid && s.on).map(s => s.sid), ...r.spec];
  const act = r => ACT[r.n];
  const nextSeat = (r, s) => { const a = act(r); let i = a.indexOf(s); for (let k = 0; k < a.length; k++) { i = (i + 1) % a.length; if (!r.fin.includes(a[i])) return a[i]; } return s; };
  const movable = (r, s, v) => { const m = []; for (let t = 0; t < 4; t++) { const p = r.pos[s][t]; if (p === -1 ? v === 6 : p + v <= 56) m.push(t); } return m; };
  const animMs = (f, to, caps) => ((f === -1 ? 1 : to - f) * 300) + (caps.length ? 800 : 0) + 500;
  const view = (r, i, sp) => ({
    code: r.code, ph: r.phase, me: sp ? -1 : i, host: !sp && r.seats[i].token === r.host, n: r.n, act: act(r),
    seats: r.seats.map(s => s && { n: s.name, b: s.bot, on: s.on }), pos: r.pos, turn: r.turn, stage: r.stage,
    dice: r.dice, rs: r.rollSeq, mv: r.mv, mov: (!sp && r.phase === 'play' && r.turn === i && r.stage === 'move') ? r.mov : [], mv2: (r.phase === 'play' && r.stage === 'move') ? r.mov : [],
    winner: r.winner, rank: r.rank, fin: r.fin, wait: r.wait, six: r.forfeit ? 1 : 0, spec: r.spec.size, isSpec: !!sp, track: r.track, playing: !!r.playing
  });
  const sendAvs = r => {
    const map = {}; r.seats.forEach((s, i) => { if (s && s.av) map[i] = s.av; });
    const sig = Object.keys(map).map(k => k + ':' + map[k].length + map[k].slice(-8)).join('|');
    if (!r.avk) r.avk = new Set(); if (sig !== r.avs) { r.avs = sig; r.avk.clear(); }
    ids(r).forEach(id => { if (!r.avk.has(id)) { r.avk.add(id); const o = nsp.sockets.get(id); if (o) o.emit('avs', map); } });
  };
  const send = r => {
    r.seats.forEach((s, i) => { if (s && s.sid && s.on) { const so = nsp.sockets.get(s.sid); if (so) so.emit('st', view(r, i)); } });
    r.spec.forEach(id => { const so = nsp.sockets.get(id); if (so) so.emit('st', view(r, 0, true)); });
    sendAvs(r);
  };
  const seatOf = (r, tok) => r.seats.findIndex(s => s && s.token === tok);
  const mkSeat = (name, token, sid, uid) => ({ name: String(name || 'بازیکن').slice(0, 14), token, sid, bot: false, on: true, uid: uid || null });
  const place = r => ORD[r.n].find(i => !r.seats[i]);

  // ---------- منطق بازی ----------
  function botPick(r, s) {
    const v = r.dice; let best = r.mov[0], bs = -1e9;
    const threat = (idx, me) => { let d = 0; for (const s2 of act(r)) if (s2 !== me) for (let t2 = 0; t2 < 4; t2++) { const p2 = r.pos[s2][t2]; if (p2 >= 0 && p2 <= 50) { const df = (idx - ring(s2, p2) + 52) % 52; if (df >= 1 && df <= 6) d++; } } return d; };
    const mine = r.pos[s].filter(p => p >= 0 && p < 56), onBoard = mine.length, mx = Math.max(...mine, -1), mn = Math.min(...mine, 99);
    for (const t of r.mov) {
      const f = r.pos[s][t], to = f === -1 ? 0 : f + v; let sc = Math.random() * 3;
      if (f === -1) { sc += 55; if (onBoard <= 1) sc += 30; } else sc += to * 0.25;
      if (to === 56) sc += 90; else if (to >= 51 && f < 51) sc += 35;
      if (to <= 50) {
        const idx = ring(s, to); let cap = 0, capP = 0;
        for (const s2 of act(r)) if (s2 !== s) for (let t2 = 0; t2 < 4; t2++) { const p2 = r.pos[s2][t2]; if (p2 >= 0 && p2 <= 50 && ring(s2, p2) === idx) { cap++; capP += p2; } }
        if (SAFE.has(idx)) sc += 20;
        else { if (cap) sc += 70 + capP * 0.8; else sc -= threat(idx, s) * 22; }
      }
      if (f >= 0 && f <= 50 && !SAFE.has(ring(s, f))) sc += threat(ring(s, f), s) * 18;
      if (f >= 0 && f < 56 && onBoard >= 2 && to < 51) { if (f === mx) sc -= 8; if (f === mn) sc += 6; }
      if (sc > bs) { bs = sc; best = t; }
    }
    return best;
  }
  const later = (r, fn, ms) => { r.t = setTimeout(() => { try { fn(); } catch (e) { console.log('ludo error', e); r.errs = (r.errs || 0) + 1; if (r.errs < 30) setTimeout(() => { try { step(r); } catch (e2) { } }, 1500); } }, ms); };
  function step(r) {
    clearTimeout(r.t); r.wait = null; r.at = Date.now();
    if (r.phase !== 'play') return send(r);
    const s = r.turn, seat = r.seats[s], busy = Math.max(0, (r.busy || 0) - Date.now());
    if (r.stage === 'pass') { later(r, () => { r.turn = nextSeat(r, r.turn); r.stage = 'roll'; r.six = 0; r.forfeit = false; r.mov = []; step(r); }, busy + 300); return send(r); }
    if (!seat.bot && !seat.on) { r.wait = s; return send(r); }
    if (seat.bot) later(r, () => { if (r.stage === 'roll') doRoll(r); else if (r.stage === 'move') doMove(r, s, botPick(r, s)); }, busy + (r.stage === 'roll' ? 650 : 900));
    send(r);
  }
  function doRoll(r) {
    const v = crypto.randomInt(1, 7); r.dice = v; r.rollSeq++; r.forfeit = false; r.six = v === 6 ? r.six + 1 : 0; r.busy = Date.now() + 900;
    if (r.six === 3) { r.six = 0; r.forfeit = true; r.stage = 'pass'; r.mov = []; }
    else { r.mov = movable(r, r.turn, v); r.stage = r.mov.length ? 'move' : 'pass'; }
    step(r);
  }
  function doMove(r, s, t) {
    const v = r.dice, f = r.pos[s][t], to = f === -1 ? 0 : f + v; r.pos[s][t] = to;
    const caps = []; let bonus = v === 6;
    if (to <= 50) {
      const idx = ring(s, to);
      if (!SAFE.has(idx)) for (const s2 of act(r)) { if (s2 === s) continue; for (let t2 = 0; t2 < 4; t2++) { const p2 = r.pos[s2][t2]; if (p2 >= 0 && p2 <= 50 && ring(s2, p2) === idx) { caps.push([s2, t2, p2]); r.pos[s2][t2] = -1; } } }
    }
    if (caps.length || to === 56) bonus = true;
    r.mv = { s, t, f, to, caps, v, seq: ++r.mseq }; r.mov = []; r.busy = Date.now() + animMs(f, to, caps);
    if (r.pos[s].every(p => p === 56)) {
      r.fin.push(s);
      const sum = x => r.pos[x].reduce((a, b) => a + b, 0), left = act(r).filter(x => !r.fin.includes(x)).sort((a, b) => sum(b) - sum(a));
      if (left.length <= 1) { r.phase = 'over'; r.rank = [...r.fin, ...left]; r.winner = r.rank[0]; return send(r); }
      r.stage = 'roll'; r.turn = nextSeat(r, s); r.six = 0; return step(r);
    }
    r.stage = 'roll'; if (!bonus) { r.turn = nextSeat(r, s); r.six = 0; }
    step(r);
  }
  function startGame(r, bots) {
    let n = 0; act(r).forEach(i => { if (!r.seats[i]) r.seats[i] = { name: BOTS[n++], token: null, sid: null, bot: true, auto: true, on: true }; });
    r.pos = [0, 1, 2, 3].map(() => [-1, -1, -1, -1]); r.phase = 'play'; r.turn = act(r)[0]; r.stage = 'roll'; r.dice = 0; r.rollSeq = 0; r.mseq = 0; r.mv = null; r.mov = [];
    r.six = 0; r.winner = -1; r.rank = []; r.fin = []; r.busy = 0; step(r);
  }
  const back = (so, r, i, tok) => { const s = r.seats[i]; s.sid = so.id; s.on = true; if (s.rep) { s.bot = false; s.rep = false; } so.data = { code: r.code, tok }; step(r); };

  nsp.on('connection', so => {
    const R = () => rooms[so.data && so.data.code], tk = () => so.data && so.data.tok;
    const takeSeat = (r, k, name, token) => { const s = r.seats[k]; if (!s || !s.auto || !s.bot) return so.emit('err', 'این صندلی دیگر ربات نیست.'); r.seats[k] = mkSeat(name, token, so.id, so.uid); so.data = { code: r.code, tok: token }; step(r); };
    so.on('auth', () => { });
    so.on('create', ({ name, token } = {}) => {
      let c; do c = [0, 1, 2, 3].map(() => L[Math.random() * 24 | 0]).join(''); while (rooms[c]);
      const r = rooms[c] = { code: c, host: token, seats: [null, null, null, null], phase: 'lobby', n: 4, pos: null, turn: -1, stage: 'roll', dice: 0, rollSeq: 0, mseq: 0, mv: null, mov: [], six: 0, winner: -1, rank: [], fin: [], wait: null, t: null, at: Date.now(), track: 1, playing: false, spec: new Set(), busy: 0 };
      r.seats[0] = mkSeat(name, token, so.id, so.uid); so.data = { code: c, tok: token }; send(r);
    });
    so.on('join', ({ code, name, token } = {}) => {
      const r = rooms[String(code || '').toUpperCase().trim()]; if (!r) return so.emit('err', 'اتاق پیدا نشد؛ کد را بررسی کن.');
      const i = seatOf(r, token); if (i >= 0) return back(so, r, i, token);
      if (r.phase !== 'lobby') {
        const bl = r.seats.map((x, k) => x && x.auto && x.bot ? { k, n: x.name } : null).filter(Boolean);
        if (!bl.length) return so.emit('err', 'همهٔ صندلی‌ها آدم هستند و اتاق پر است.');
        if (bl.length === 1) return takeSeat(r, bl[0].k, name, token);
        return so.emit('pick', { code: r.code, list: bl });
      }
      const p = place(r); if (p === undefined) return so.emit('err', 'اتاق پر است.');
      r.seats[p] = mkSeat(name, token, so.id, so.uid); so.data = { code: r.code, tok: token }; send(r);
    });
    so.on('take', ({ code, name, token, seat } = {}) => { const r = rooms[String(code || '').toUpperCase().trim()]; if (r && r.phase !== 'lobby') takeSeat(r, seat | 0, name, token); });
    so.on('rejoin', ({ code, token } = {}) => { const r = rooms[String(code || '').toUpperCase().trim()], i = r ? seatOf(r, token) : -1; if (i < 0) return so.emit('gone'); back(so, r, i, token); });
    so.on('watch', ({ code } = {}) => { const r = rooms[String(code || '').toUpperCase().trim()]; if (!r) return so.emit('gone'); r.spec.add(so.id); so.data = { code: r.code, spec: true }; send(r); ids(r).forEach(id => { const o = nsp.sockets.get(id); if (o) o.emit('specJoin'); }); });
    so.on('sit', k => { const r = R(), i = r ? seatOf(r, tk()) : -1; k = k | 0; if (r && r.phase === 'lobby' && i >= 0 && act(r).includes(k) && !r.seats[k]) { r.seats[k] = r.seats[i]; r.seats[i] = null; send(r); } });
    so.on('cnt', n => {
      const r = R(); n = n | 0; if (!r || r.phase !== 'lobby' || tk() !== r.host || !ACT[n]) return;
      const humans = r.seats.filter(Boolean).length; if (humans > n) return so.emit('err', 'تعداد بازیکنان حاضر از این عدد بیشتر است.');
      r.n = n; r.seats.forEach((s, i) => { if (s && !ACT[n].includes(i)) { const p = ORD[n].find(x => !r.seats[x]); r.seats[p] = s; r.seats[i] = null; } }); send(r);
    });
    so.on('swap', j => { const r = R(), i = r ? seatOf(r, tk()) : -1; j = j | 0; if (!r || r.phase !== 'lobby' || i < 0 || j < 0 || j > 3 || j === i) return; const t = r.seats[j]; if (!t || !t.sid || !t.on) return; r.sw = { a: i, b: j, ta: r.seats[i].token, tb: t.token }; const o = nsp.sockets.get(t.sid); if (o) o.emit('swapAsk', { name: r.seats[i].name }); });
    so.on('swapAns', ok => {
      const r = R(), i = r ? seatOf(r, tk()) : -1, w = r && r.sw; if (!w || r.phase !== 'lobby' || i !== w.b) return; r.sw = null; if (!ok) return;
      if (!r.seats[w.a] || !r.seats[w.b] || r.seats[w.a].token !== w.ta || r.seats[w.b].token !== w.tb) return;
      [r.seats[w.a], r.seats[w.b]] = [r.seats[w.b], r.seats[w.a]]; ids(r).forEach(id => { const o = nsp.sockets.get(id); if (o) o.emit('swapDone'); }); send(r);
    });
    so.on('start', o => {
      const r = R(); if (!r || r.phase !== 'lobby' || tk() !== r.host) return;
      if (!act(r).every(i => r.seats[i] && r.seats[i].on) && !(o && o.bots)) return so.emit('err', 'هنوز همهٔ صندلی‌ها پر نشده‌اند.');
      startGame(r);
    });
    so.on('roll', () => { const r = R(), i = r ? seatOf(r, tk()) : -1; if (!r || i < 0 || r.phase !== 'play' || r.turn !== i || r.stage !== 'roll' || Date.now() < (r.busy || 0) - 150) return; doRoll(r); });
    so.on('move', t => { const r = R(), i = r ? seatOf(r, tk()) : -1; t = t | 0; if (!r || i < 0 || r.phase !== 'play' || r.turn !== i || r.stage !== 'move' || !r.mov.includes(t) || Date.now() < (r.busy || 0) - 150) return; doMove(r, i, t); });
    so.on('replace', () => { const r = R(); if (r && r.wait != null && seatOf(r, tk()) >= 0) { const s = r.seats[r.wait]; s.bot = true; s.rep = true; step(r); } });
    so.on('again', () => {
      const r = R(); if (!r || r.phase !== 'over' || tk() !== r.host) return; clearTimeout(r.t);
      r.seats = r.seats.map(s => (s && !s.auto && !s.rep && s.on) ? s : null); r.phase = 'lobby'; r.pos = null; r.mv = null; r.winner = -1; r.rank = []; r.fin = []; r.turn = -1; send(r);
    });
    so.on('av', av => { const r = R(), i = r ? seatOf(r, tk()) : -1; if (i < 0) return; av = typeof av === 'string' ? av : ''; if (av && !(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(av) || /^https:\/\/t\.me\//.test(av))) av = ''; if (av.length > 7000) av = ''; r.seats[i].av = av || undefined; send(r); });
    so.on('track', n => { const r = R(); n = n | 0; if (r && seatOf(r, tk()) >= 0 && n >= 1 && n <= 21) { r.track = n; r.playing = true; ids(r).forEach(id => { if (id !== so.id) { const o = nsp.sockets.get(id); if (o) o.emit('track', n); } }); } });
    so.on('disconnect', () => {
      const r = R(); if (!r) return; if (so.data.spec) { r.spec.delete(so.id); return send(r); }
      const i = seatOf(r, tk()); if (i < 0 || r.seats[i].sid !== so.id) return;
      if (r.phase === 'lobby') { r.seats[i].on = false; r.seats[i].sid = null; r.seats[i].off = Date.now(); send(r); }
      else { r.seats[i].on = false; r.seats[i].sid = null; step(r); }
    });
  });
  setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (r.phase === 'lobby') { r.seats.forEach((x, k) => { if (x && !x.on && x.off && Date.now() - x.off > 12e4) r.seats[k] = null; }); if (!r.seats.some(x => x && x.token === r.host)) { const h = r.seats.find(x => x); if (h) r.host = h.token; } send(r); } } }, 3e4);
  setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (r.phase !== 'play') continue; const seat = r.seats[r.turn]; if (seat && (seat.bot || r.stage === 'pass') && Date.now() - r.at > 9000 && Date.now() > (r.busy || 0) + 3000) { try { step(r); } catch (e) { console.log('ludo watchdog', e); } } } }, 3000);
  setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (!r.seats.some(s => s && s.on && !s.bot) && Date.now() - r.at > 36e5) { clearTimeout(r.t); delete rooms[c]; } } }, 6e5);
};
