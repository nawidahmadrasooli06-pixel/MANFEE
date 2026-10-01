const express = require('express'), http = require('http'), { Server } = require('socket.io');
const Room = require('./game/room');
const tgbot = require('./bot');
const app = express();
app.use(express.static('public'));
app.get('/health', (q, r) => r.send('ok'));
app.get('/config', (q, r) => r.json({ bot: tgbot.info.username || '' }));
const srv = http.createServer(app), io = new Server(srv), rooms = {};
const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const cl = n => String(n || 'بازیکن').slice(0, 14);
io.on('connection', s => {
  const R = () => rooms[s.data.code];
  const enter = (c, name, token) => {
    const r = rooms[c], i = r.join(s.id, cl(name), token);
    if (i == -2) return s.emit('pick', { code: c, list: r.pickList() });
    if (i < 0) return s.emit('err', 'اتاق پر است؛ همه‌ی صندلی‌ها آدم هستند.');
    s.data.code = c;
  };
  s.on('create', ({ name, token }) => {
    let c; do c = [0, 1, 2, 3].map(() => L[Math.random() * 24 | 0]).join(''); while (rooms[c]);
    rooms[c] = new Room(c, io); enter(c, name, token);
  });
  s.on('join', ({ code, name, token }) => {
    code = String(code || '').toUpperCase().trim();
    rooms[code] ? enter(code, name, token) : s.emit('err', 'کد اتاق پیدا نشد');
  });
  s.on('take', ({ code, name, token, seat }) => {
    const r = rooms[code];
    if (r && r.take(s.id, cl(name), token, seat | 0)) s.data.code = code; else s.emit('err', 'این صندلی دیگر خالی نیست');
  });
  s.on('sit', i => R() && R().sit(s.id, i | 0));
  s.on('sub', i => R() && R().sub(s.id, i | 0));
  s.on('start', () => R() && R().start(s.id));
  s.on('bid', n => { const r = R(), i = r && r.seatOf(s.id); if (r && r.g && i >= 0) r.g.bid(i, +n); });
  s.on('mir', a => { const r = R(), i = r && r.seatOf(s.id); if (r && r.g && i >= 0) r.g.mir(i, a); });
  s.on('play', c => { const r = R(), i = r && r.seatOf(s.id); if (r && r.g && i >= 0) r.g.play(i, +c); });
  s.on('again', () => { const r = R(); if (r && r.g) r.g.again(); });
  s.on('sig', ({ to, d }) => { const r = R(); if (!r) return; const t = r.seats[to | 0]; if (t && t.sid) io.to(t.sid).emit('sig', { from: r.seatOf(s.id), d }); });
  s.on('disconnect', () => R() && R().leave(s.id));
});
setInterval(() => {
  for (const c in rooms) {
    const r = rooms[c];
    if (!r.seats.some(x => x && x.sid) && Date.now() - r.t > 36e5) { r.g && r.g.stop(); delete rooms[c]; }
  }
}, 6e5);
srv.listen(process.env.PORT || 3000, () => console.log('Manfee server running'));
tgbot(rooms);
