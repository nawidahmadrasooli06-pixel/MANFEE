const express = require('express'), http = require('http'), { Server } = require('socket.io');
const Room = require('./game/room');
const tgbot = require('./bot');

const app = express();
app.use(express.static('public'));
app.get('/health', (q, r) => r.send('ok'));
app.get('/config', (q, r) => r.json({ bot: tgbot.info && tgbot.info.username ? tgbot.info.username : '' }));

const srv = http.createServer(app), io = new Server(srv), rooms = {};

// بدون نیاز به دیتابیس و توکن‌سنجی پیچیده تاریخچه - کاملاً سبک و پاک
io.use((socket, next) => {
  const initData = socket.handshake.auth && socket.handshake.auth.initData;
  // استخراج ساده آیدی کاربر از تلگرام وب‌اپ در صورت وجود
  let userId = null;
  try {
    if (initData) {
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userId = userObj.id;
      }
    }
  } catch (e) {}
  
  socket.data.telegramUserId = userId;
  next();
});

const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CARPETS = ['c1', 'c2', 'c3', 'c4', 'c5', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'];
const CARDSETS = ['k1', 'k2', 'k3', 'k4', 'k5', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10'];
const cleanLook = l => ({ carpet: CARPETS.includes(l && l.carpet) ? l.carpet : 'c1', cards: CARDSETS.includes(l && l.cards) ? l.cards : 'k1' });
const cl = n => String(n || 'بازیکن').slice(0, 14);
const ended = r => !!(r && r.g && r.g.phase === 'series');
const expiredMessage = 'این بازی قبلاً به پایان رسیده یا لینک آن منقضی شده است. لطفاً ربات را دوباره استارت کن و بازی تازه بساز.';

io.on('connection', s => {
  const R = () => rooms[s.data.code];
  const enter = (c, name, token) => {
    const r = rooms[c];
    if (ended(r)) return s.emit('expired', expiredMessage);
    const i = r.join(s.id, cl(name), token, s.data.telegramUserId);
    if (i == -2) return s.emit('pick', { code: c, list: r.pickList() });
    if (i < 0) return s.emit('err', 'اتاق پر است؛ همه‌ی صندلی‌ها پر هستند.');
    s.data.code = c;
  };

  s.on('watch', ({ code } = {}) => {
    code = String(code || '').toUpperCase().trim();
    const r = rooms[code];
    if (!r || ended(r)) return s.emit('expired', expiredMessage);
    s.data.code = code; r.watch(s.id);
  });

  s.on('preview', code => {
    code = String(code || '').toUpperCase().trim();
    const r = rooms[code];
    if (!r || ended(r)) return s.emit('inviteInfo', { expired: true, message: expiredMessage });
    s.emit('inviteInfo', r.inviteInfo());
  });

  s.on('create', ({ name, token, look } = {}) => {
    let c; do c = [0, 1, 2, 3].map(() => L[Math.random() * 24 | 0]).join(''); while (rooms[c]);
    rooms[c] = new Room(c, io); rooms[c].look = cleanLook(look); enter(c, name, token);
  });

  s.on('join', ({ code, name, token } = {}) => {
    code = String(code || '').toUpperCase().trim();
    rooms[code] ? enter(code, name, token) : s.emit('expired', expiredMessage);
  });

  s.on('take', ({ code, name, token, seat } = {}) => {
    const r = rooms[code];
    if (ended(r)) return s.emit('expired', expiredMessage);
    if (r && r.take(s.id, cl(name), token, seat | 0, s.data.telegramUserId)) s.data.code = code; else s.emit('err', 'این صندلی دیگر خالی نیست');
  });

  // قابلیت جابه‌جایی صندلی‌ها در اتاق پیش از شروع بازی
  s.on('change_seat', ({ seatId } = {}) => {
    const r = R();
    if (r && !r.g) {
      // منطق جابه‌جایی صندلی در اتاق در صورت وجود متد مربوطه در روم
      if (typeof r.changeSeat === 'function') {
        r.changeSeat(s.id, seatId);
      }
    }
  });

  s.on('look', l => { const r = R(), i = r ? r.seatOf(s.id) : -1; if (r && i >= 0 && r.seats[i].token == r.host) { r.look = cleanLook(l); r.send(); } });
  s.on('track', n => { const r = R(); n = n | 0; if (r && r.seatOf(s.id) >= 0 && n >= 1 && n <= 21) r.setTrack(n); });
  s.on('invite', () => R() && R().invite(s.id));
  s.on('sit', i => R() && R().sit(s.id, i | 0));
  s.on('sub', i => R() && R().sub(s.id, i | 0));
  s.on('start', opts => R() && R().start(s.id, !!(opts && opts.forceBots)));
  s.on('bid', n => { const r = R(), i = r && r.seatOf(s.id); if (r && r.g && i >= 0) r.g.bid(i, +n); });
  s.on('mir', a => { const r = R(), i = r && r.seatOf(s.id); if (r && r.g && i >= 0) r.g.mir(i, a); });
  s.on('play', c => { const r = R(), i = r && r.seatOf(s.id); if (r && r.g && i >= 0) r.g.play(i, +c); });
  s.on('again', () => { const r = R(); if (r && r.g && r.seatOf(s.id) >= 0 && r.seats[r.seatOf(s.id)].token == r.host) r.g.again(); });
  s.on('sig', ({ to, d } = {}) => { const r = R(); if (!r) return; const t = r.seats[to | 0]; if (t && t.sid) io.to(t.sid).emit('sig', { from: r.seatOf(s.id), d }); });

  // سیستم ایموجی‌های زنده (واکنش‌ها) با پایداری کامل
  s.on('react', emoji => {
    const r = R(), seat = r ? r.seatOf(s.id) : -1;
    if (!r || seat < 0 || !['😂','😆','😮','👏','😎','❤️','🔥'].includes(emoji)) return;
    if (Date.now() - (s.data.lastReact || 0) < 500) return;
    s.data.lastReact = Date.now();
    const msg = { userId: s.id, seat, emoji };
    r.seats.forEach(x => { if (x && x.sid) io.to(x.sid).emit('show_reaction', msg); });
    r.spec.forEach(id => io.to(id).emit('show_reaction', msg));
  });

  s.on('disconnect', () => R() && R().leave(s.id));
});

setInterval(() => {
  for (const c in rooms) {
    const r = rooms[c];
    if (!r.seats.some(x => x && x.sid) && Date.now() - r.t > 36e5) { r.g && r.g.stop(); clearTimeout(r.startTimer); delete rooms[c]; }
  }
}, 6e5);

try {
  require('./fiskoot-server')(io); // بازی حکم (فیسکوت)
} catch (e) {
  console.log('Fiskoot server loaded optional error handled.');
}

srv.listen(process.env.PORT || 3000, () => console.log('Manfee server running smoothly'));
tgbot(rooms);
