const $ = q => document.querySelector(q), sk = io();
const tok = localStorage.tok || (localStorage.tok = Math.random().toString(36).slice(2) + Date.now());
let st = null, BOT = '', pend = null, menuMode = false;
const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.disableVerticalSwipes && tg.disableVerticalSwipes(); }
fetch('/config').then(r => r.json()).then(c => BOT = c.bot).catch(() => { });
const show = id => document.querySelectorAll('.scr').forEach(e => e.classList.toggle('on', e.id == id));
const currentProfile = () => window.CProfile ? window.CProfile.payload() : {name:localStorage.nm||'بازیکن'};
const nm = () => {
  const el = $('#invite').classList.contains('on') ? $('#invNm') : $('#nm');
  const n = (window.CProfile ? window.CProfile.name() : (el && el.value  localStorage.nm  'بازیکن')).trim().slice(0, 14) || 'بازیکن';
  localStorage.nm = n; return n;
};
const act = (ev, a) => sk.emit(ev, a);
$('#nm').value = localStorage.nm  (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name)  '';
$('#invNm').value = $('#nm').value;
const qr = new URLSearchParams(location.search).get('r'), wq = new URLSearchParams(location.search).get('w');
if (qr) show('invite');
function mk() { if(window.CProfile&&!window.CProfile.get().complete){openMyProfile();return;} sk.emit('create', { name: nm(), token: tok, profile: currentProfile(), look: typeof prefLook === 'function' ? prefLook() : undefined }); }
function jn() { if(window.CProfile&&!window.CProfile.get().complete){openMyProfile();return;} sk.emit('join', { code: $('#cd').value, name: nm(), token: tok, profile: currentProfile() }); }
function acceptInvite() { if(window.CProfile&&!window.CProfile.get().complete){openMyProfile();return;} $('#nm').value = nm(); sk.emit('join', { code: qr || $('#invCode').textContent, name: nm(), token: tok, profile: currentProfile() }); }
function backToMenu() { menuMode = true; show('menu'); }
function resume() {
  if (st && st.g) { menuMode = false; show('game'); T.render(st); return; }
  sk.emit('join', { code: localStorage.room, name: nm(), token: tok, profile: currentProfile() }); }
function fresh() { menuMode = false; localStorage.removeItem('room'); pend = null; history.replaceState(0, '', '/'); $('#cd').value = ''; show('join'); }
function take(i) { sk.emit('take', { ...pend, name:nm(), profile:currentProfile(), seat: i }); }
function startGame() { sk.emit('start', { forceBots: false }); }
function startWithBots() { sk.emit('start', { forceBots: true }); }
function restartBot() {
  if (BOT && tg && tg.openTelegramLink) tg.openTelegramLink('https://t.me/' + BOT);
  else if (BOT) location.href = 'https://t.me/' + BOT;
  else { fresh(); }
}
function share() {
  act('invite');
  const link = BOT ? https://t.me/${BOT}?start=${st.code} : location.origin + '/?r=' + st.code;
  const text = 'بیا بازی منفی! کد اتاق: ' + st.code;
  if (tg) tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text));
  else navigator.share ? navigator.share({ title: 'منفی', text, url: link }).catch(() => { }) : navigator.clipboard.writeText(link).then(() => alert('لینک کپی شد'));
}
function shareWatch() {
  const code = (st && st.code) || localStorage.room; if (!code) { alert('اول وارد یک اتاق شو'); return; }
  const link = BOT ? https://t.me/${BOT}?start=w_${code} : location.origin + '/?w=' + code;
  const text = 'بیا بازی منفی را زنده تماشا کن! 👁 کد اتاق: ' + code;
  if (tg) tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text));
  else navigator.share ? navigator.share({ title: 'منفی', text, url: link }).catch(() => { }) : navigator.clipboard.writeText(link).then(() => alert('لینک کپی شد'));
}
function lobby() {
  const cell = i => { const x = st.seats[i]; const p=x&&x.profile; const ava=p&&(p.avatar||p.photo)?`<img class="lobby-avatar" src="${String(p.avatar||p.photo).replace(/&/g,'&amp;').replace(/\"/g,'&quot;')}">`:`<span class="lobby-avatar emoji">${p&&p.
