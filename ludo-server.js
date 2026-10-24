// لودو — سرور آنلاین (کانال /ludo). مستقل از منفی و حکم.
const crypto = require('crypto');
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', BOTS = ['احمد', 'محمد', 'محمود'];
const START = [0, 13, 26, 39];                      // خانهٔ شروع هر صندلی روی مسیر ۵۲تایی
const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]); // خانهٔ شروع و ستاره‌ها
const ACT = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 3] };
const ORD = { 2: [0, 2], 3: [0, 1, 2], 4: [0, 2, 1, 3] };
const ring = (s, p) => (START[s] + p) % 52;
const STEP_MS = 130, OUT_MS = 300, ROLL_BUSY = 640;   // باید با ludo.html هماهنگ باشد
const mate = s => (s + 2) % 4;
const FC = ['f1','f2','f3','f4','f5','f6','f7','f8','f9','f10'], GC = ['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10'];
module.exports = function (io) {
  const nsp = io.of('/ludo'), rooms = {};
  if (process.env.LUDO_TEST) io._ludoRooms = rooms;
  const foe = (r, a, b) => a !== b && !(r.team && (a & 1) === (b & 1));
  const allHome = (r, s) => r.pos[s].every(p => p === 56);
  const ctlOf = r => (r.team && allHome(r, r.turn)) ? mate(r.turn) : r.turn;
  const teamHome = r => (r.team && r.pos) ? [0, 1].map(k => [0, 1, 2, 3].filter(x => (x & 1) === k).reduce((a, x) => a + r.pos[x].filter(p => p === 56).length, 0)) : null;
  const ids = r => [...r.seats.filter(s => s && s.sid && s.on).map(s => s.sid), ...r.spec];
  const act = r => ACT[r.n];
  const nextSeat = (r, s) => { const a = act(r); let i = a.indexOf(s); for (let k = 0; k < a.length; k++) { i = (i + 1) % a.length; if (!r.fin.includes(a[i])) return a[i]; } return s; };
  const movable = (r, s, v) => {
    const m = [], own = r.pos[s];
    for (let t = 0; t < 4; t++) {
      const p = own[t]; if (p === 56 || (p === -1 && v !== 6)) continue;
      const to = p === -1 ? 0 : p + v; if (to > 56) continue;
      if (to < 56) { const safe = to <= 50 && SAFE.has(ring(s, to)); if (!safe && own.some((q, u) => u !== t && q === to)) continue; }
      m.push(t);
    }
    return m;
  };
  // تاس هوشمند و منصف: جلوگیری از خشکسالی ۶، سه ۶ پشت‌سرهم، تکرار یک عدد و گیر کردن‌های طولانی
  const pickDice = (r, s) => {
    r.dry = r.dry || [0, 0, 0, 0]; r.stuck = r.stuck || [0, 0, 0, 0]; r.hist = r.hist || [[], [], [], []];
    const pos = r.pos[s], out = pos.filter(p => p >= 0 && p < 56).length, h = r.hist[s];
    let v = crypto.randomInt(1, 7);
    if (out === 0 && !pos.every(p => p === 56)) {
      const d = r.dry[s], p6 = d >= 6 ? 0.95 : d >= 4 ? 0.6 : d >= 2 ? 0.34 : 0.17;
      v = Math.random() < p6 ? 6 : crypto.randomInt(1, 6);
    } else if (v === 6 && r.six === 2 && Math.random() < 0.6) v = crypto.randomInt(1, 6);
    const need = pos.filter(p => p >= 51 && p < 56).map(p => 56 - p);
    if (r.stuck[s] >= 3 && need.length && Math.random() < 0.45) v = need[crypto.randomInt(0, need.length)];
    if (h.length >= 2 && h[0] === v && h[1] === v && v !== 6) { let w = v; while (w === v) w = crypto.randomInt(1, 7); v = w; }
    h.unshift(v); h.length = Math.min(h.length, 2);
    r.dry[s] = (out === 0 && v !== 6) ? r.dry[s] + 1 : 0;
    return v;
  };
  const capMs = caps => caps.length ? Math.max(...caps.map(c => Math.min(900, c[2] * 40) + 260)) : 0;
  const animMs = (f, to, caps) => (f === -1 ? OUT_MS : (to - f) * STEP_MS) + capMs(caps) + 160;
  const view = (r, i, sp) => ({
    code: r.code, ph: r.phase, me: sp ? -1 : i, host: !sp && r.seats[i].token === r.host, n: r.n, act: act(r),
    seats: r.seats.map(s => s && { n: s.name, b: s.bot, on: s.on, tk: s.tk | 0 }), mode: r.oneOut ? 1 : 0, pos: r.pos, turn: r.turn, stage: r.stage,
    dice: r.dice, rs: r.rollSeq, mv: r.mv, mov: (!sp && r.phase === 'play' && r.turn === i && r.stage === 'move') ? r.mov : [], mv2: (r.phase === 'play' && r.stage === 'move') ? r.mov : [],
    winner: r.winner, rank: r.rank, fin: r.fin, wait: r.wait, ctl: r.ctl == null ? r.turn : r.ctl, team: r.team ? 1 : 0, th: teamHome(r), six: r.forfeit ? 1 : 0, spec: r.spec.size, isSpec: !!sp, track: r.track, playing: !!r.playing
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
    if (r.pol && r.pol[s] === 'rand') return r.mov[crypto.randomInt(0, r.mov.length)];
    const v = r.dice, mine = r.pos[s], enemies = act(r).filter(x => foe(r, s, x));
    const outN = mine.filter(p => p >= 0 && p < 56).length;
    const val = p => 20 + p * 1.4;                       // ارزش مهره بسته به راهی که رفته
    // احتمال اینکه حریف تا نوبت بعد روی این خانه بنشیند
    const danger = idx => {
      let pr = 0;
      for (const s2 of enemies) for (let t2 = 0; t2 < 4; t2++) {
        const p2 = r.pos[s2][t2]; if (p2 < 0 || p2 > 50) continue;
        const d = (idx - ring(s2, p2) + 52) % 52; if (p2 + d > 50) continue;
        if (d >= 1 && d <= 6) pr += 1 / 6; else if (d >= 7 && d <= 12) pr += 1 / 36;
      }
      return Math.min(pr, .95);
    };
    let best = r.mov[0], bs = -1e9;
    for (const t of r.mov) {
      const f = mine[t], to = f === -1 ? 0 : f + v; let sc = Math.random() * 2;
      let after = 0, before = 0;
      if (to <= 50) {
        const idx = ring(s, to), safe = SAFE.has(idx);
        if (!safe) {
          for (const s2 of enemies) for (let t2 = 0; t2 < 4; t2++) { const p2 = r.pos[s2][t2]; if (p2 >= 0 && p2 <= 50 && ring(s2, p2) === idx) sc += 85 + p2 * 2; }
          after = danger(idx);
          // پشت سر مهرهٔ حریف بودن = تهدید برای او
          for (const s2 of enemies) for (let t2 = 0; t2 < 4; t2++) { const p2 = r.pos[s2][t2]; if (p2 < 0 || p2 > 50) continue; const ie = ring(s2, p2), d = (ie - idx + 52) % 52; if (d >= 1 && d <= 6 && to + d <= 50 && !SAFE.has(ie)) sc += (30 + p2 * .7) / 6 * .7; }
        } else if (f < 0 || !SAFE.has(ring(s, f))) sc += 9;
      }
      if (f >= 0 && f <= 50 && !SAFE.has(ring(s, f))) before = danger(ring(s, f));
      if (to === 56) sc += 100; else if (to >= 51 && f < 51) sc += 38;
      if (f === -1) sc += outN === 0 ? 70 : outN === 1 ? 48 : outN === 2 ? 34 : 24;
      sc += val(Math.max(f, 0)) * before - val(to) * after;
      if (f >= 0 && f <= 50 && SAFE.has(ring(s, f)) && after > 0) sc -= 6;
      sc += to * .35 + Math.max(f, 0) * .1;
      if (sc > bs) { bs = sc; best = t; }
    }
    return best;
  }
  const later = (r, fn, ms) => { r.t = setTimeout(() => { try { fn(); } catch (e) { console.log('ludo error', e); r.errs = (r.errs || 0) + 1; if (r.errs < 30) setTimeout(() => { try { step(r); } catch (e2) { } }, 1200); } }, ms); };
  function step(r) {
    clearTimeout(r.t); r.wait = null; r.at = Date.now();
    if (r.phase !== 'play') return send(r);
    const s = r.turn, seat = r.seats[s], busy = Math.max(0, (r.busy || 0) - Date.now());
    if (r.stage === 'pass') { later(r, () => { r.turn = nextSeat(r, r.turn); r.stage = 'roll'; r.six = 0; r.forfeit = false; r.mov = []; step(r); }, busy + 150); return send(r); }
    if (!seat.bot && !seat.on) { r.wait = s; return send(r); }
    const o = r.ctl == null ? s : r.ctl;
    if (seat.bot) later(r, () => { if (r.stage === 'roll') doRoll(r); else if (r.stage === 'move') doMove(r, r.ctl, botPick(r, r.ctl)); }, busy + (r.stage === 'roll' ? 220 : 170));
    else if (r.stage === 'move' && new Set(r.mov.map(t => r.pos[o][t])).size === 1) later(r, () => { if (r.stage === 'move' && r.turn === s) doMove(r, r.ctl, r.mov[0]); }, busy + 110);
    send(r);
  }
  function doRoll(r) {
    r.ctl = ctlOf(r);
    const v = pickDice(r, r.ctl); r.dice = v; r.rollSeq++; r.forfeit = false; r.six = v === 6 ? r.six + 1 : 0; r.busy = Date.now() + ROLL_BUSY;
    if (r.six === 3) { r.six = 0; r.forfeit = true; r.stage = 'pass'; r.mov = []; }
    else { r.mov = movable(r, r.ctl, v); r.stage = r.mov.length ? 'move' : 'pass'; r.stuck[r.ctl] = r.mov.length ? 0 : r.stuck[r.ctl] + 1; }
    step(r);
  }
  function doMove(r, s, t) {
    const v = r.dice, f = r.pos[s][t], to = f === -1 ? 0 : f + v; r.pos[s][t] = to;
    const caps = []; let bonus = v === 6;
    if (to <= 50) {
      const idx = ring(s, to);
      if (!SAFE.has(idx)) for (const s2 of act(r)) { if (!foe(r, s, s2)) continue; for (let t2 = 0; t2 < 4; t2++) { const p2 = r.pos[s2][t2]; if (p2 >= 0 && p2 <= 50 && ring(s2, p2) === idx) { caps.push([s2, t2, p2]); r.pos[s2][t2] = -1; } } }
    }
    if (caps.length || to === 56) bonus = true;
    r.mv = { s, t, f, to, caps, v, seq: ++r.mseq }; r.mov = []; r.busy = Date.now() + animMs(f, to, caps);
    const sum = x => r.pos[x].reduce((a, b) => a + b, 0);
    if (r.team) {                                   // ۲ در ۲: تیم وقتی برنده است که هر ۸ مهره‌اش به وسط برسد
      if (allHome(r, s) && allHome(r, mate(s))) {
        const rest = act(r).filter(x => x !== s && x !== mate(s)).sort((a, b) => sum(b) - sum(a));
        r.phase = 'over'; r.rank = [s, mate(s), ...rest]; r.winner = s; return send(r);
      }
      r.stage = 'roll'; if (!bonus) { r.turn = nextSeat(r, r.turn); r.six = 0; }
      return step(r);
    }
    if (r.pos[s].every(p => p === 56)) {
      r.fin.push(s);
      const left = act(r).filter(x => !r.fin.includes(x)).sort((a, b) => sum(b) - sum(a));
      if (left.length <= 1) { r.phase = 'over'; r.rank = [...r.fin, ...left]; r.winner = r.rank[0]; return send(r); }
      r.stage = 'roll'; r.turn = nextSeat(r, s); r.six = 0; return step(r);
    }
    r.stage = 'roll'; if (!bonus) { r.turn = nextSeat(r, s); r.six = 0; }
    step(r);
  }
  function startGame(r, bots) {
    let n = 0; act(r).forEach(i => { if (!r.seats[i]) r.seats[i] = { name: BOTS[n++], token: null, sid: null, bot: true, auto: true, on: true }; });
    r.team = !!r.team && r.n === 4;
    r.pos = [0, 1, 2, 3].map(() => [-1, -1, -1, -1]); r.phase = 'play'; r.turn = act(r)[0]; r.ctl = r.turn; r.stage = 'roll'; r.dice = 0; r.rollSeq = 0; r.mseq = 0; r.mv = null; r.mov = [];
    r.six = 0; r.winner = -1; r.rank = []; r.fin = []; r.busy = 0; r.dry = [0, 0, 0, 0]; r.stuck = [0, 0, 0, 0]; r.hist = [[], [], [], []];
    if (r.oneOut) act(r).forEach(i => { r.pos[i][0] = 0; });
    step(r);
  }
  const back = (so, r, i, tok) => { const s = r.seats[i]; clearTimeout(s.gt); s.sid = so.id; s.on = true; if (s.rep) { s.bot = false; s.rep = false; } so.data = { code: r.code, tok }; step(r); };

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
      r.n = n; if (n !== 4) r.team = false; r.seats.forEach((s, i) => { if (s && !ACT[n].includes(i)) { const p = ORD[n].find(x => !r.seats[x]); r.seats[p] = s; r.seats[i] = null; } }); send(r);
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
    so.on('roll', () => {
      const r = R(), i = r ? seatOf(r, tk()) : -1; if (!r || i < 0 || r.phase !== 'play' || r.turn !== i || r.stage !== 'roll') return;
      const early = (r.busy || 0) - Date.now();
      if (early > 120) { clearTimeout(r.pt); r.pt = setTimeout(() => { if (r.phase === 'play' && r.turn === i && r.stage === 'roll') doRoll(r); }, early); return; }
      doRoll(r);
    });
    so.on('move', t => { const r = R(), i = r ? seatOf(r, tk()) : -1; t = t | 0; if (!r || i < 0 || r.phase !== 'play' || r.turn !== i || r.stage !== 'move' || !r.mov.includes(t)) return; doMove(r, r.ctl, t); });
    so.on('replace', () => { const r = R(); if (r && r.wait != null && seatOf(r, tk()) >= 0) { const s = r.seats[r.wait]; s.bot = true; s.rep = true; step(r); } });
    so.on('again', () => {
      const r = R(); if (!r || r.phase !== 'over' || tk() !== r.host) return; clearTimeout(r.t);
      r.seats = r.seats.map(s => (s && !s.auto && !s.rep && s.on) ? s : null); r.phase = 'lobby'; r.pos = null; r.mv = null; r.ctl = null; r.winner = -1; r.rank = []; r.fin = []; r.turn = -1; send(r);
    });
    so.on('tk', n => { const r = R(), i = r ? seatOf(r, tk()) : -1; if (i < 0) return; n = n | 0; if (n < 0 || n > 3 || (r.seats[i].tk | 0) === n) return; r.seats[i].tk = n; send(r); });
    so.on('team', n => { const r = R(); if (!r || r.phase !== 'lobby' || tk() !== r.host || r.n !== 4) return; r.team = (n | 0) === 1; send(r); });
    so.on('chk', ({ code, token } = {}) => {
      const r = rooms[String(code || '').toUpperCase().trim()]; let s = 'gone';
      if (r && seatOf(r, token) >= 0) s = r.phase === 'over' ? 'ended' : 'alive';
      so.emit('chk', { s, code });
    });
    so.on('mode', n => { const r = R(); if (!r || r.phase !== 'lobby' || tk() !== r.host) return; r.oneOut = (n | 0) === 1; send(r); });
    so.on('av', av => { const r = R(), i = r ? seatOf(r, tk()) : -1; if (i < 0) return; av = typeof av === 'string' ? av : ''; if (av && !(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(av) || /^https:\/\/t\.me\//.test(av))) av = ''; if (av.length > 7000) av = ''; r.seats[i].av = av || undefined; send(r); });
    so.on('track', n => { const r = R(); n = n | 0; if (r && seatOf(r, tk()) >= 0 && n >= 1 && n <= 21) { r.track = n; r.playing = true; ids(r).forEach(id => { if (id !== so.id) { const o = nsp.sockets.get(id); if (o) o.emit('track', n); } }); } });
    so.on('disconnect', () => {
      const r = R(); if (!r) return; if (so.data.spec) { r.spec.delete(so.id); return send(r); }
      const i = seatOf(r, tk()); if (i < 0 || r.seats[i].sid !== so.id) return;
      if (r.phase === 'lobby') { r.seats[i].on = false; r.seats[i].sid = null; r.seats[i].off = Date.now(); send(r); }
      else { const sx = r.seats[i]; sx.sid = null; clearTimeout(sx.gt); sx.gt = setTimeout(() => { if (!sx.sid && r.seats[i] === sx) { sx.on = false; try { step(r); } catch (e) { } } }, 25000); }
    });
  });
  setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (r.phase === 'lobby') { r.seats.forEach((x, k) => { if (x && !x.on && x.off && Date.now() - x.off > 12e4) r.seats[k] = null; }); if (!r.seats.some(x => x && x.token === r.host)) { const h = r.seats.find(x => x); if (h) r.host = h.token; } send(r); } } }, 3e4);
  setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (r.phase !== 'play') continue; const seat = r.seats[r.turn]; if (seat && (seat.bot || r.stage === 'pass') && Date.now() - r.at > 3500 && Date.now() > (r.busy || 0) + 1500) { try { step(r); } catch (e) { console.log('ludo watchdog', e); } } } }, 3000);
  setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (!r.seats.some(s => s && s.on && !s.bot) && Date.now() - r.at > 36e5) { clearTimeout(r.t); delete rooms[c]; } } }, 6e5);
};
