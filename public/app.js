const $ = q => document.querySelector(q), sk = io();
const tok = localStorage.tok || (localStorage.tok = Math.random().toString(36).slice(2) + Date.now());
let st = null, BOT = '', pend = null, menuMode = false;
const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.disableVerticalSwipes && tg.disableVerticalSwipes(); }
fetch('/config').then(r => r.json()).then(c => BOT = c.bot).catch(() => { });
const show = id => document.querySelectorAll('.scr').forEach(e => e.classList.toggle('on', e.id == id));
const nm = () => {
  const el = $('#invite').classList.contains('on') ? $('#invNm') : $('#nm');
  const n = (el && el.value || localStorage.nm || 'بازیکن').trim().slice(0, 14) || 'بازیکن';
  localStorage.nm = n; return n;
};
const act = (ev, a) => sk.emit(ev, a);
$('#nm').value = localStorage.nm || (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || '';
$('#invNm').value = $('#nm').value;
const qr = new URLSearchParams(location.search).get('r');
if (qr) show('invite');
function mk() { sk.emit('create', { name: nm(), token: tok, look: typeof prefLook === 'function' ? prefLook() : undefined }); }
function jn() { sk.emit('join', { code: $('#cd').value, name: nm(), token: tok }); }
function acceptInvite() { $('#nm').value = $('#invNm').value; sk.emit('join', { code: qr || $('#invCode').textContent, name: nm(), token: tok }); }
function backToMenu() { menuMode = true; show('menu'); }
function resume() {
  if (st && st.g) { menuMode = false; show('game'); T.render(st); return; }
  sk.emit('join', { code: localStorage.room, name: localStorage.nm || 'بازیکن', token: tok }); }
function fresh() { menuMode = false; localStorage.removeItem('room'); pend = null; history.replaceState(0, '', '/'); $('#cd').value = ''; show('join'); }
function take(i) { sk.emit('take', { ...pend, seat: i }); }
function startGame() { sk.emit('start', { forceBots: false }); }
function startWithBots() { sk.emit('start', { forceBots: true }); }
function restartBot() {
  if (BOT && tg && tg.openTelegramLink) tg.openTelegramLink('https://t.me/' + BOT);
  else if (BOT) location.href = 'https://t.me/' + BOT;
  else { fresh(); }
}
function share() {
  act('invite');
  const link = BOT ? `https://t.me/${BOT}?start=${st.code}` : location.origin + '/?r=' + st.code;
  const text = 'بیا بازی منفی! کد اتاق: ' + st.code;
  if (tg) tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text));
  else navigator.share ? navigator.share({ title: 'منفی', text, url: link }).catch(() => { }) : navigator.clipboard.writeText(link).then(() => alert('لینک کپی شد'));
}
function lobby() {
  const cell = i => { const x = st.seats[i]; return `<button class="sb ${x ? 'f' : ''}" onclick="act('sit',${i})">${x ? x.name + (i == st.me ? ' (تو)' : '') : 'خالی ← ربات'}</button>`; };
  $('#lb').innerHTML = `<h3>تیم ۱ (روبه‌روی هم)</h3>${cell(0)}${cell(2)}<h3>تیم ۲ (روبه‌روی هم)</h3>${cell(1)}${cell(3)}`;
  $('#code').textContent = st.code;
  $('#go').style.display = st.host ? '' : 'none';
  $('#force').style.display = st.host && st.invitePending ? '' : 'none';
  $('#go').disabled = !!st.starting || (!!st.invitePending && !st.inviteAccepted);
  $('#go').textContent = st.invitePending && !st.inviteAccepted ? 'منتظر ورود دوستت…' : 'شروع بازی';
  $('#waitMsg').textContent = st.invitePending && !st.inviteAccepted ? 'دوستت هنوز وارد اتاق نشده؛ اینجا منتظرش می‌مانیم.' : st.inviteAccepted ? 'دوستت وارد شد؛ آماده شروع بازی هستید.' : '';
  $('#startCount').textContent = st.starting ? `شروع بازی تا ${st.starting}…` : '';
}
sk.on('state', s => {
  st = s; localStorage.room = s.code; history.replaceState(0, '', '?r=' + s.code);
  if (typeof applyLook === 'function' && s.look) applyLook(s.look);
  if (typeof syncTrackFromState === 'function') syncTrackFromState(s.track);
  if (s.g) { if (!menuMode) show('game'); T.render(s); } else { menuMode = false; show('lobby'); lobby(); }
});
sk.on('inviteInfo', info => {
  if (info.expired) { $('#expiredMsg').textContent = info.message || 'این دعوت منقضی شده است.'; show('expired'); return; }
  $('#inviter').textContent = info.inviter || 'دوستت'; $('#invCode').textContent = info.code || qr || '';
  $('#invNm').value = localStorage.nm || $('#invNm').value;
  show('invite');
});
sk.on('pick', p => {
  pend = { code: p.code, name: nm(), token: tok };
  $('#pk').innerHTML = p.list.map(x => `<button class="sb f" onclick="take(${x.i})">جای «${x.name}» بنشین<br><small>هم‌تیمی: ${x.mate}</small></button>`).join('');
  show('pick');
});
sk.on('err', m => { alert(m); show('join'); });
sk.on('expired', m => {
  localStorage.removeItem('room'); $('#expiredMsg').textContent = m || 'این بازی به پایان رسیده یا لینک آن منقضی شده است. ربات را دوباره استارت کن.'; show('expired');
});
sk.on('connect', () => {
  if (qr) { sk.emit('preview', qr); return; }
  if (st) { sk.emit('join', { code: st.code, name: localStorage.nm || 'بازیکن', token: tok }); return; }
});


/* MANFEE_PRIVACY_SHIELD_V2 */
(function () {
  if (window.__MANFEE_PRIVACY_SHIELD_V2) return;
  window.__MANFEE_PRIVACY_SHIELD_V2 = true;

  function installPrivacyShield() {
    if (document.getElementById('manfee-privacy-shield')) return;

    const shield = document.createElement('div');
    shield.id = 'manfee-privacy-shield';
    shield.innerHTML =
      '<div class="manfee-privacy-box">' +
        '<div class="manfee-privacy-lock">🔒</div>' +
        '<div class="manfee-privacy-title">میز بازی خصوصی است</div>' +
        '<div class="manfee-privacy-sub">هنگام خروج از صفحه، کارت‌ها پنهان می‌شوند.</div>' +
      '</div>';

    const style = document.createElement('style');
    style.id = 'manfee-privacy-shield-style';
    style.textContent = `
      #manfee-privacy-shield{
        position:fixed; inset:0; z-index:2147483647; display:none;
        align-items:center; justify-content:center;
        background:#000; color:#fff; text-align:center;
        user-select:none; -webkit-user-select:none;
      }
      #manfee-privacy-shield .manfee-privacy-box{padding:24px}
      #manfee-privacy-shield .manfee-privacy-lock{font-size:48px}
      #manfee-privacy-shield .manfee-privacy-title{margin-top:12px;font-size:22px;font-weight:800}
      #manfee-privacy-shield .manfee-privacy-sub{margin-top:8px;font-size:14px;opacity:.86}
    `;
    (document.head || document.documentElement).appendChild(style);
    document.body.appendChild(shield);

    const show = () => { shield.style.display = 'flex'; };
    const hide = () => { shield.style.display = 'none'; };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) show();
      else hide();
    }, {passive:true});

    window.addEventListener('pagehide', show, {passive:true});
    window.addEventListener('blur', show, {passive:true});
    window.addEventListener('focus', hide, {passive:true});

    document.addEventListener('copy', e => e.preventDefault(), {capture:true});
    document.addEventListener('cut', e => e.preventDefault(), {capture:true});
    document.addEventListener('contextmenu', e => e.preventDefault(), {capture:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPrivacyShield, {once:true});
  } else {
    installPrivacyShield();
  }
})();
