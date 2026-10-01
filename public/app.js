const $ = q => document.querySelector(q), sk = io();
const tok = localStorage.tok || (localStorage.tok = Math.random().toString(36).slice(2) + Date.now());
let st = null, BOT = '';
const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.disableVerticalSwipes && tg.disableVerticalSwipes(); }
fetch('/config').then(r => r.json()).then(c => BOT = c.bot).catch(() => { });
const show = id => document.querySelectorAll('.scr').forEach(e => e.classList.toggle('on', e.id == id));
const nm = () => { const n = $('#nm').value.trim() || 'بازیکن'; localStorage.nm = n; return n; };
const act = (ev, a) => sk.emit(ev, a);
$('#nm').value = localStorage.nm || (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || '';
const qr = new URLSearchParams(location.search).get('r');
if (qr) { $('#cd').value = qr; show('join'); }
function mk() { sk.emit('create', { name: nm(), token: tok }); }
function jn() { sk.emit('join', { code: $('#cd').value, name: nm(), token: tok }); }
function share() {
  const link = BOT ? `https://t.me/${BOT}?start=${st.code}` : location.origin + '/?r=' + st.code, text = 'بیا بازی منفی! کد اتاق: ' + st.code;
  if (tg) tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text));
  else navigator.share ? navigator.share({ title: 'منفی', text, url: link }).catch(() => { }) : navigator.clipboard.writeText(link).then(() => alert('لینک کپی شد'));
}
function lobby() {
  const cell = i => { const x = st.seats[i]; return `<button class="sb ${x ? 'f' : ''}" onclick="act('sit',${i})">${x ? x.name + (i == st.me ? ' (تو)' : '') : 'خالی ← ربات'}</button>`; };
  $('#lb').innerHTML = `<h3>تیم ۱ (روبه‌روی هم)</h3>${cell(0)}${cell(2)}<h3>تیم ۲ (روبه‌روی هم)</h3>${cell(1)}${cell(3)}`;
  $('#code').textContent = st.code; $('#go').style.display = st.host ? '' : 'none';
}
sk.on('state', s => {
  st = s; localStorage.room = s.code; history.replaceState(0, '', '?r=' + s.code);
  if (s.g) { show('game'); T.render(s); } else { show('lobby'); lobby(); }
});
sk.on('err', m => { alert(m); localStorage.removeItem('room'); show('join'); });
sk.on('connect', () => { const r = localStorage.room || qr; if (r && localStorage.nm) sk.emit('join', { code: r, name: localStorage.nm, token: tok }); });
