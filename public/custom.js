/* موزیک، تنظیمات، فرش و طرح پر */
const bgAudio = new Audio();
bgAudio.loop = false;
bgAudio.preload = 'auto';

const TRACKS = 21;
let actx = null, gainNode = null, roomTrack = 1, musicOn = false, trackSynced = false, lookNow = null;

const FK_CARPETS = [['f1', 'زمرد شب'], ['f2', 'یاقوتی'], ['f3', 'آبی سلطنتی'], ['f4', 'مشکی کربن'], ['f5', 'بنفش جوکر'], ['f6', 'طلایی شاهی'], ['f7', 'یخی'], ['f8', 'شنی کرم'], ['f9', 'سبز نئونی'], ['f10', 'قرمز آتشین']];
const FK_CARDS = [['g1', 'عاج کلاسیک'], ['g2', 'نیمه‌شب'], ['g3', 'جوکر طلایی'], ['g4', 'جوکر بنفش'], ['g5', 'یاقوت'], ['g6', 'زمرد'], ['g7', 'نقره‌ای'], ['g8', 'نئونی'], ['g9', 'طلای ناب'], ['g10', 'یخی']];
const MF_CARPETS = [['c1', 'سبز لوزی'], ['c2', 'قرمز گل'], ['c3', 'سرمه‌ای'], ['c4', 'طلایی ترنج'], ['c5', 'مشکی طلایی']].concat(FK_CARPETS);
const MF_CARDS = [['k1', 'سفید کلاسیک'], ['k2', 'مشکی دارک'], ['k3', 'جوکر قرمز'], ['k4', 'سبز گل‌گلی'], ['k5', 'مشکی طلایی']].concat(FK_CARDS);
const PAGE_GAME = location.pathname.indexOf('fiskoot') >= 0 ? 'fk' : 'mf';
const GAMES = { mf: { c: MF_CARPETS, k: MF_CARDS, kc: 'carpet', kk: 'cards', dc: 'c1', dk: 'k1' }, fk: { c: FK_CARPETS, k: FK_CARDS, kc: 'fk_carpet', kk: 'fk_cards', dc: 'f1', dk: 'g1' } };
let tabGame = PAGE_GAME;
const modalGame = () => inRoom() ? PAGE_GAME : tabGame;

function lsGet(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
function inRoom() { return typeof st !== 'undefined' && st && st.code; }

/* ---------- فرش و پر (برای هر بازی جدا ذخیره می‌شود) ---------- */
function cleanLook(l, g) {
  const G = GAMES[g || PAGE_GAME]; l = l || {};
  return { carpet: G.c.some(x => x[0] === l.carpet) ? l.carpet : G.dc, cards: G.k.some(x => x[0] === l.cards) ? l.cards : G.dk };
}
function prefLook(g) { g = g || PAGE_GAME; const G = GAMES[g]; return cleanLook({ carpet: lsGet(G.kc, G.dc), cards: lsGet(G.kk, G.dk) }, g); }

function applyLook(l) {
  l = cleanLook(l);
  if (lookNow && lookNow.carpet === l.carpet && lookNow.cards === l.cards) return;
  lookNow = l;
  const keep = document.body.className.split(/\s+/).filter(c => c && !/^(carpet|cards)-/.test(c));
  keep.push('carpet-' + l.carpet, 'cards-' + l.cards);
  document.body.className = keep.join(' ');
  refreshLookPicker();
}

function setLook(part) {
  const g = modalGame();
  if (g === PAGE_GAME && inRoom() && !st.host) return;
  const cur = g === PAGE_GAME ? (lookNow || prefLook(g)) : prefLook(g);
  const l = cleanLook(Object.assign({}, cur, part), g), G = GAMES[g];
  lsSet(G.kc, l.carpet); lsSet(G.kk, l.cards);
  if (g === PAGE_GAME) { applyLook(l); if (inRoom() && st.host) sk.emit('look', l); } else refreshLookPicker();
}
function pickCarpet(id) { setLook({ carpet: id }); }
function pickCards(id) { setLook({ cards: id }); }
function pickGame(g) { tabGame = g; refreshLookPicker(); }

const SAMPLE = '<div class="c"><em>A</em><b>♠</b></div><div class="c r heart"><em>K</em><b>♥</b></div><div class="c r"><em>Q</em><b>♦</b></div><div class="c"><em>J</em><b>♣</b></div>';

function lookPickerHTML() {
  const g = modalGame(), G = GAMES[g];
  const l = g === PAGE_GAME ? (lookNow || prefLook(g)) : prefLook(g);
  const can = !inRoom() || st.host;
  const dis = can ? '' : ' disabled';
  const tabs = inRoom() ? '' : `<div class="gtabs"><button class="${g === 'mf' ? 'sel' : ''}" onclick="pickGame('mf')">♠ بازی منفی</button><button class="${g === 'fk' ? 'sel' : ''}" onclick="pickGame('fk')">♥ بازی حکم</button></div><div class="lkNote">تنظیمات زیر برای ${g === 'mf' ? 'بازی منفی' : 'بازی حکم (فیسکوت)'} است</div>`;
  const car = G.c.map(([id, n]) =>
    `<button class="sw pv carpet-${id}${l.carpet === id ? ' sel' : ''}"${dis} onclick="pickCarpet('${id}')"><span>${n}</span></button>`).join('');
  const crd = G.k.map(([id, n]) =>
    `<button class="sw swc pv cards-${id}${l.cards === id ? ' sel' : ''}"${dis} onclick="pickCards('${id}')"><div class="c r heart"><em>A</em><b>♥</b></div><span>${n}</span></button>`).join('');
  return `${tabs}
    <div class="pv pvbig carpet-${l.carpet} cards-${l.cards}"><div class="pvmark">CACTUC</div><div class="pvrow">${SAMPLE}</div></div>
    <div class="lkTitle">🧶 فرش میز</div><div class="swrow">${car}</div>
    <div class="lkTitle">🃏 طرح پر</div><div class="swrow">${crd}</div>
    ${can ? '' : '<div class="lkNote">🔒 فرش و پر را میزبان اتاق انتخاب می‌کند و برای همه یکسان است</div>'}`;
}
function refreshLookPicker() {
  const el = document.getElementById('lookPicker');
  if (el) el.innerHTML = lookPickerHTML();
}

/* ---------- موزیک ---------- */
const SILENT = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
let roomPlaying = false, userStopped = false, needTap = false, unlocked = false;

function savedVol() {
  const v = parseInt(lsGet('mvol', '50'), 10);
  return isNaN(v) ? 50 : Math.max(0, Math.min(100, v));
}

/* روی آیفون audio.volume کار نمی‌کند، پس صدا را با Web Audio کنترل می‌کنیم */
function setupAudioGraph() {
  if (actx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    actx = new AC();
    const src = actx.createMediaElementSource(bgAudio);
    gainNode = actx.createGain();
    gainNode.gain.value = savedVol() / 100;
    src.connect(gainNode);
    gainNode.connect(actx.destination);
    return true;
  } catch (e) {
    actx = null; gainNode = null;
    return false;
  }
}

function playLocal(n) {
  lsSet('mon', '1'); lsSet('mtrack', String(n));
  if (!setupAudioGraph()) bgAudio.volume = savedVol() / 100;
  if (actx && actx.state === 'suspended') actx.resume();
  const ext = (n == 1 || n == 21) ? 'm4a' : 'mp3';
  bgAudio.src = `music${n}.${ext}`;
  const p = bgAudio.play();
  if (p && p.catch) p.catch(e => { needTap = true; console.log('Music play blocked, waiting for a tap:', e); });
}

/* اولین لمس صفحه، صدا را آماده می‌کند تا آهنگ میزبان برای همه خودکار پخش شود */
function unlockAudio() {
  if (needTap && musicOn && bgAudio.paused) { needTap = false; playLocal(roomTrack); return; }
  if (unlocked) return;
  unlocked = true;
  if (musicOn && !bgAudio.paused) return;
  try {
    setupAudioGraph();
    if (actx && actx.state === 'suspended') actx.resume();
    bgAudio.src = SILENT;
    const p = bgAudio.play();
    if (p && p.then) p.then(() => { if (bgAudio.getAttribute('src') === SILENT) bgAudio.pause(); }).catch(() => { });
  } catch (e) { }
}
document.addEventListener('touchend', unlockAudio, true);
document.addEventListener('click', unlockAudio, true);

function updateMusicUI() {
  const b = document.getElementById('mbPlay');
  if (b) b.textContent = (musicOn && !bgAudio.paused) ? '⏸' : '▶️';
  const num = document.getElementById('mbNum');
  if (num) num.textContent = roomTrack;
}

/* توقف و ادامه فقط برای خود شخص است.
   فقط اگر هنوز هیچ‌کس موزیک را شروع نکرده باشد، شروعش برای همه است */
function musicToggle() {
  if (musicOn) { userStopped = true; musicOn = false; lsSet('mon', '0'); bgAudio.pause(); }
  else if (!roomPlaying) { goTrack(roomTrack); return; }
  else { userStopped = false; musicOn = true; playLocal(roomTrack); }
  updateMusicUI();
}

/* شروع، قبلی، بعدی و انتخاب آهنگ برای همه‌ی بازیکنان اتاق است */
function goTrack(n) {
  roomTrack = n; roomPlaying = true; userStopped = false; musicOn = true;
  playLocal(n); updateMusicUI();
  if (inRoom()) sk.emit('track', n);
}
function musicNext() { goTrack(roomTrack % TRACKS + 1); }
function musicPrev() { goTrack(roomTrack === 1 ? TRACKS : roomTrack - 1); }

/* پیام آهنگ از طرف یکی از بازیکنان اتاق */
function onRemoteTrack(n) {
  n = parseInt(n, 10);
  if (!(n >= 1 && n <= TRACKS)) return;
  const same = n === roomTrack;
  roomTrack = n; roomPlaying = true;
  if (userStopped) { updateMusicUI(); return; }
  if (same && musicOn && !bgAudio.paused) return;
  musicOn = true;
  playLocal(n);
  updateMusicUI();
}

/* کسی که بعد از شروع موزیک وارد اتاق می‌شود، آهنگ جاری را می‌شنود */
function syncTrackFromState(n, playing) {
  if (trackSynced) return;
  trackSynced = true;
  n = parseInt(n, 10);
  if (!(n >= 1 && n <= TRACKS)) return;
  roomTrack = n;
  if (playing) { roomPlaying = true; if (!userStopped) { musicOn = true; playLocal(n); } }
  updateMusicUI();
}

function musicSelect(v) {
  if (v === '-1') { userStopped = true; musicOn = false; lsSet('mon', '0'); bgAudio.pause(); updateMusicUI(); }
  else goTrack(parseInt(v, 10));
}

bgAudio.addEventListener('ended', () => {
  if (bgAudio.getAttribute('src') === SILENT) return;
  roomTrack = roomTrack % TRACKS + 1;
  if (musicOn) playLocal(roomTrack);
  updateMusicUI();
});
bgAudio.addEventListener('play', updateMusicUI);
bgAudio.addEventListener('pause', updateMusicUI);

function changeVolume(val) {
  const v = Math.max(0, Math.min(100, parseFloat(val) || 0));
  lsSet('mvol', String(Math.round(v)));
  if (gainNode) gainNode.gain.value = v / 100;
  else bgAudio.volume = v / 100;
  const lbl = document.getElementById('volLabel');
  if (lbl) lbl.textContent = Math.round(v);
}

/* ---------- پنجره‌ی تنظیمات ---------- */
function closeSettingsModal() {
  const modal = document.getElementById('customSettingsModal');
  if (modal) modal.remove();
}

function openSettingsModal() {
  closeSettingsModal();
  let musicOptions = `<option value="-1"${!musicOn ? ' selected' : ''}>خاموش</option>`;
  for (let i = 1; i <= TRACKS; i++) musicOptions += `<option value="${i}"${musicOn && roomTrack === i ? ' selected' : ''}>موزیک شماره ${i}</option>`;
  const selStyle = 'background:#0f2a28; color:#fff; border:1px solid #f0b64a; border-radius:8px; padding:5px;';
  const row = 'display:flex; justify-content:space-between; align-items:center; gap:8px;';
  const html = `
    <div id="customSettingsModal" style="position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; align-items:center; justify-content:center; padding:14px;">
      <div style="background:#0b1f1e; border:2px solid #f0b64a; border-radius:18px; padding:16px; width:100%; max-width:320px; max-height:92vh; overflow-y:auto; -webkit-overflow-scrolling:touch; color:#fff; text-align:center; display:flex; flex-direction:column; gap:10px;">
        <h3 style="margin:0; color:#f0b64a;">⚙️ فرش، پر و موزیک</h3>
        <div id="lookPicker">${lookPickerHTML()}</div>
        <div style="${row}">
          <span>🎵 موزیک:</span>
          <select id="musicSelect" onchange="musicSelect(this.value)" style="${selStyle}">${musicOptions}</select>
        </div>
        <div style="${row}">
          <span>🔊 ولوم: <b id="volLabel">${savedVol()}</b></span>
          <input type="range" id="volRange" min="0" max="100" step="1" value="${savedVol()}" oninput="changeVolume(this.value)" onchange="changeVolume(this.value)" style="flex:1; min-width:0; direction:ltr;">
        </div>
        <button style="padding:10px; margin-top:4px; background:#f0b64a; color:#000; font-weight:bold; border:none; border-radius:10px; cursor:pointer;" onclick="closeSettingsModal()">بستن</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

/* ---------- نوار کوچک موزیک (پایین سمت چپ) ---------- */
(function () {
  const bar = document.createElement('div');
  bar.id = 'musicBar';
  bar.innerHTML = '<button onclick="musicPrev()">⏮</button><button id="mbPlay" onclick="musicToggle()">▶️</button><button onclick="musicNext()">⏭</button><span id="mbNum">1</span>';
  document.body.appendChild(bar);
})();

function idToast(t) {
  let e = document.getElementById('idToast');
  if (!e) { e = document.createElement('div'); e.id = 'idToast'; document.body.appendChild(e); }
  e.textContent = t; e.style.display = 'block'; clearTimeout(idToast.t); idToast.t = setTimeout(() => e.style.display = 'none', 2200);
}
function copyId() {
  const t = '@cactuc580', done = () => idToast('آیدی ' + t + ' کپی شد');
  const fb = () => { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { idToast(t); } a.remove(); };
  try { navigator.clipboard.writeText(t).then(done, fb); } catch (e) { fb(); }
}
function openId() {
  const u = 'https://t.me/cactuc580';
  try { Telegram.WebApp.openTelegramLink(u); } catch (e) { window.open(u, '_blank'); }
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.idTag')) copyId(); });
(function () {
  const ov = document.getElementById('ov'); if (!ov) return;
  const add = () => {
    if (ov.querySelector('.credit2') || !/بازی مجدد|بازگشت به اتاق|برنده شد/.test(ov.textContent)) return;
    const host = ov.querySelector('.bn') || ov.querySelector('.box') || ov.firstElementChild; if (!host) return;
    const d = document.createElement('div'); d.className = 'credit2';
    d.innerHTML = '<div class="cr1">طراح و سازندهٔ ربات</div><div class="cr2" onclick="openId()">@cactuc580</div><div class="cr3"><button onclick="copyId()">کپی آیدی</button><button onclick="openId()">پیام در تلگرام</button></div>';
    host.appendChild(d);
  };
  new MutationObserver(add).observe(ov, { childList: true, subtree: true }); add();
})();
(function () {
  document.body.classList.add('pg-' + PAGE_GAME);
  const w = document.createElement('div'); w.id = 'specWelcome'; document.body.appendChild(w); let tmw;
  window.showWelcome = function () {
    const sp = typeof st !== 'undefined' && st && st.isSpec;
    w.innerHTML = '<small>CACTUC</small>به تماشای بازی خوش اومدی دوست عزیز' + (sp ? '' : '<em>👁 یک تماشاچی وارد شد</em>');
    w.classList.remove('show'); void w.offsetWidth; w.classList.add('show');
    clearTimeout(tmw); tmw = setTimeout(() => w.classList.remove('show'), 5800);
  };
  if (typeof sk !== 'undefined') sk.on('specJoin', window.showWelcome);
})();
(function () {
  const b = document.createElement('div'); b.id = 'specBadge'; b.style.display = 'none'; document.body.appendChild(b);
  window.setSpec = n => { b.textContent = '👁 تماشاچی ' + (n | 0); b.style.display = 'block'; };
})();

applyLook(prefLook());
if (lsGet('mon', '0') === '1') { roomTrack = parseInt(lsGet('mtrack', '1'), 10) || 1; roomPlaying = true; musicOn = true; playLocal(roomTrack); }
updateMusicUI();
if (typeof sk !== 'undefined') sk.on('track', onRemoteTrack);
