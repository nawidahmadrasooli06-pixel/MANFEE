// تعریف متغیر سراسری برای Socket.io
window.sk = io({
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

const sk = window.sk;
const tok = localStorage.tok || (localStorage.tok = Math.random().toString(36).slice(2) + Date.now());
let st = null, BOT = '', pend = null, menuMode = false;

const tg = window.Telegram && Telegram.WebApp;
if (tg) { 
  try { tg.ready(); tg.expand(); tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch(e){} 
}

fetch('/config').then(r => r.json()).then(c => BOT = c.bot).catch(() => { });

// تابع تعویض صفحه (سراسری و ایمن برای آیفون و اندروید)
window.show = function(id) {
  document.querySelectorAll('.scr').forEach(e => e.classList.toggle('on', e.id == id));
};

window.currentProfile = function() {
  try {
    return (window.CProfile && window.CProfile.payload) ? window.CProfile.payload() : { name: localStorage.nm || 'بازیکن' };
  } catch(e) {
    return { name: localStorage.nm || 'بازیکن' };
  }
};

window.nm = function() {
  const el = document.querySelector('#invite') && document.querySelector('#invite').classList.contains('on') ? document.querySelector('#invNm') : document.querySelector('#nm');
  let n = 'بازیکن';
  try {
    n = (window.CProfile && window.CProfile.name) ? window.CProfile.name() : ((el && el.value) || localStorage.nm || 'بازیکن');
  } catch(e) {
    n = (el && el.value) || localStorage.nm || 'بازیکن';
  }
  n = String(n).trim().slice(0, 14) || 'بازیکن';
  localStorage.nm = n; 
  return n;
};

window.act = function(ev, a) { sk.emit(ev, a); };

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#nm')) document.querySelector('#nm').value = localStorage.nm || (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || '';
  if (document.querySelector('#invNm') && document.querySelector('#nm')) document.querySelector('#invNm').value = document.querySelector('#nm').value;
});

const qr = new URLSearchParams(location.search).get('r'), wq = new URLSearchParams(location.search).get('w');
if (qr) window.show('invite');

window.mk = function() { 
  sk.emit('create', { name: window.nm(), token: tok, profile: window.currentProfile(), look: typeof prefLook === 'function' ? prefLook() : undefined }); 
};

window.jn = function() { 
  const cdEl = document.querySelector('#cd');
  const code = cdEl ? cdEl.value : '';
  sk.emit('join', { code, name: window.nm(), token: tok, profile: window.currentProfile() }); 
};

window.acceptInvite = function() { 
  if (document.querySelector('#invNm')) document.querySelector('#invNm').value = window.nm(); 
  const invCodeEl = document.querySelector('#invCode');
  sk.emit('join', { code: qr || (invCodeEl && invCodeEl.textContent), name: window.nm(), token: tok, profile: window.currentProfile() }); 
};

window.backToMenu = function() { menuMode = true; window.show('menu'); };

window.resume = function() {
  if (st && st.g) { menuMode = false; window.show('game'); if (window.T) T.render(st); return; }
  if (localStorage.room) {
    sk.emit('join', { code: localStorage.room, name: window.nm(), token: tok, profile: window.currentProfile() }); 
  } else {
    window.show('join');
  }
};

window.fresh = function() { 
  menuMode = false; 
  localStorage.removeItem('room'); 
  pend = null; 
  history.replaceState(0, '', '/'); 
  if (document.querySelector('#cd')) document.querySelector('#cd').value = ''; 
  window.show('join'); 
};

window.take = function(i) { sk.emit('take', { ...pend, name: window.nm(), profile: window.currentProfile(), seat: i }); };

// اصلاح قطعی برای شروع بازی و پر شدن صندلی‌ها با ربات‌ها
window.startGame = function() { 
  sk.emit('start', { bots: true, forceBots: false }); 
};
window.startWithBots = function() { 
  sk.emit('start', { bots: true, forceBots: true }); 
};

window.restartBot = function() {
  if (BOT && tg && tg.openTelegramLink) tg.openTelegramLink('https://t.me/' + BOT);
  else if (BOT) location.href = 'https://t.me/' + BOT;
  else { window.fresh(); }
};

window.share = function() {
  if (!st || !st.code) return;
  window.act('invite');
  const link = BOT ? `https://t.me/${BOT}?start=${st.code}` : location.origin + '/?r=' + st.code;
  const text = 'بیا بازی منفی! کد اتاق: ' + st.code;
  if (tg) tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text));
  else navigator.share ? navigator.share({ title: 'منفی', text, url: link }).catch(() => { }) : navigator.clipboard.writeText(link).then(() => alert('لینک کپی شد'));
};

window.shareWatch = function() {
  const code = (st && st.code) || localStorage.room; if (!code) { alert('اول وارد یک اتاق شو'); return; }
  const link = BOT ? `https://t.me/${BOT}?start=w_${code}` : location.origin + '/?w=' + code;
  const text = 'بیا بازی منفی را زنده تماشا کن! 👁 کد اتاق: ' + code;
  if (tg) tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text));
  else navigator.share ? navigator.share({ title: 'منفی', text, url: link }).catch(() => { }) : navigator.clipboard.writeText(link).then(() => alert('لینک کپی شد'));
};

function lobby() {
  if (!st || !st.seats) return;
  const cell = i => { 
    const x = st.seats[i]; 
    const p = x && x.profile; 
    const ava = p && (p.avatar || p.photo) ? `<img class="lobby-avatar" src="${String(p.avatar||p.photo).replace(/&/g,'&amp;').replace(/\"/g,'&quot;')}">` : `<span class="lobby-avatar emoji">${p&&p.emoji||'🃏'}</span>`; 
    return `<button class="sb ${x ? 'f' : ''}" onclick="window.act('sit',${i})">${x ? ava + '<b>'+x.name+'</b>' + (i == st.me && !st.isSpec ? ' (تو)' : '') : 'صندلی خالی'}</button>`; 
  };
  const lb = document.querySelector('#lb');
  if (lb) lb.innerHTML = `<h3>تیم ۱ (روبه‌روی هم)</h3>${cell(0)}${cell(2)}<h3>تیم ۲ (روبه‌روی هم)</h3>${cell(1)}${cell(3)}`;
  
  const cd = document.querySelector('#code');
  if (cd) cd.textContent = st.code;
  
  const go = document.querySelector('#go');
  if (go) {
    go.style.display = st.host ? '' : 'none';
    go.disabled = !!st.starting || (!!st.invitePending && !st.inviteAccepted);
    go.textContent = st.invitePending && !st.inviteAccepted ? 'منتظر ورود دوستت…' : 'شروع بازی';
  }
  const force = document.querySelector('#force');
  if (force) force.style.display = st.host && st.invitePending ? '' : 'none';
  
  const waitMsg = document.querySelector('#waitMsg');
  if (waitMsg) waitMsg.textContent = st.invitePending && !st.inviteAccepted ? 'دوستت هنوز وارد اتاق نشده؛ اینجا منتظرش می‌مانیم.' : st.inviteAccepted ? 'دوستت وارد شد؛ آماده شروع بازی هستید.' : '';
  
  const startCount = document.querySelector('#startCount');
  if (startCount) startCount.textContent = st.starting ? `شروع بازی تا ${st.starting}…` : '';
}

sk.on('state', s => {
  st = s; window.CactucCurrentState = s; 
  document.body.classList.toggle('in-game', !!s.g); 
  if (!s.isSpec) localStorage.room = s.code; 
  history.replaceState(0, '', (s.isSpec ? '?w=' : '?r=') + s.code);
  document.body.classList.toggle('spectator', !!s.isSpec); 
  if (typeof setSpec === 'function') setSpec(s.spec || 0);
  if (typeof applyLook === 'function' && s.look) applyLook(s.look);
  if (typeof syncTrackFromState === 'function') syncTrackFromState(s.track, s.playing);
  if (s.g) { if (!menuMode) window.show('game'); if (window.T) T.render(s); } else { menuMode = false; window.show('lobby'); lobby(); }
});

sk.on('inviteInfo', info => {
  const exp = document.querySelector('#expiredMsg');
  if (info.expired) { if (exp) exp.textContent = info.message || 'این دعوت منقضی شده است.'; window.show('expired'); return; }
  const inviter = document.querySelector('#inviter');
  if (inviter) inviter.textContent = info.inviter || 'دوستت'; 
  const invCode = document.querySelector('#invCode');
  if (invCode) invCode.textContent = info.code || qr || '';
  const invNm = document.querySelector('#invNm');
  if (invNm) invNm.value = localStorage.nm || invNm.value;
  window.show('invite');
});

sk.on('pick', p => {
  pend = { code: p.code, name: window.nm(), token: tok };
  const pk = document.querySelector('#pk');
  if (pk) pk.innerHTML = p.list.map(x => `<button class="sb f" onclick="window.take(${x.i})">جای «${x.name}» بنشین<br><small>هم‌تیمی: ${x.mate}</small></button>`).join('');
  window.show('pick');
});

document.addEventListener('cactuc-profile', e => { if(st && st.code && e.detail && e.detail.complete) sk.emit('profileUpdate', e.detail); });
sk.on('reaction', d => { if(window.showCactucReaction) window.showCactucReaction(d); });
sk.on('err', m => { alert(m); window.show('join'); });
sk.on('expired', m => {
  localStorage.removeItem('room'); 
  const exp = document.querySelector('#expiredMsg');
  if (exp) exp.textContent = m || 'این بازی به پایان رسیده یا لینک آن منقضی شده است. ربات را دوباره استارت کن.'; 
  window.show('expired');
});

sk.on('connect', () => {
  if (wq || (st && st.isSpec)) { sk.emit('watch', { code: st && st.isSpec ? st.code : wq }); return; }
  if (qr) { sk.emit('preview', qr); return; }
  if (st) { sk.emit('join', { code: st.code, name: window.nm(), token: tok, profile: currentProfile() }); return; }
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

    const showS = () => { shield.style.display = 'flex'; };
    const hideS = () => { shield.style.display = 'none'; };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) showS();
      else hideS();
    }, {passive:true});

    window.addEventListener('pagehide', showS, {passive:true});
    window.addEventListener('blur', showS, {passive:true});
    window.addEventListener('focus', hideS, {passive:true});

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
