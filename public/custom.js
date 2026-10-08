/* موزیک، تنظیمات، فرش و طرح پر */
const bgAudio = new Audio();
bgAudio.loop = false;
bgAudio.preload = 'auto';

const TRACKS = 21;
let actx = null, gainNode = null, roomTrack = 1, musicOn = false, trackSynced = false, lookNow = null;

const CARPETS = [['c1', 'سبز لوزی'], ['c2', 'قرمز گل'], ['c3', 'سرمه‌ای'], ['c4', 'طلایی ترنج'], ['c5', 'مشکی طلایی']];
const CARDSETS = [['k1', 'سفید کلاسیک'], ['k2', 'مشکی دارک'], ['k3', 'جوکر قرمز'], ['k4', 'سبز گل‌گلی'], ['k5', 'مشکی طلایی']];

function lsGet(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
function inRoom() { return typeof st !== 'undefined' && st && st.code; }

/* ---------- فرش و پر ---------- */
function cleanLook(l) {
  l = l || {};
  return {
    carpet: CARPETS.some(x => x[0] === l.carpet) ? l.carpet : 'c1',
    cards: CARDSETS.some(x => x[0] === l.cards) ? l.cards : 'k1'
  };
}
function prefLook() { return cleanLook({ carpet: lsGet('carpet', 'c1'), cards: lsGet('cards', 'k1') }); }

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
  if (inRoom() && !st.host) return;
  const l = cleanLook(Object.assign({}, lookNow || prefLook(), part));
  lsSet('carpet', l.carpet); lsSet('cards', l.cards);
  applyLook(l);
  if (inRoom() && st.host) sk.emit('look', l);
}
function pickCarpet(id) { setLook({ carpet: id }); }
function pickCards(id) { setLook({ cards: id }); }

const SAMPLE = '<div class="c"><em>A</em><b>♠</b></div><div class="c r heart"><em>K</em><b>♥</b></div><div class="c r"><em>Q</em><b>♦</b></div><div class="c"><em>J</em><b>♣</b></div>';

function lookPickerHTML() {
  const l = lookNow || prefLook();
  const can = !inRoom() || st.host;
  const dis = can ? '' : ' disabled';
  const car = CARPETS.map(([id, n]) =>
    `<button class="sw pv carpet-${id}${l.carpet === id ? ' sel' : ''}"${dis} onclick="pickCarpet('${id}')"><span>${n}</span></button>`).join('');
  const crd = CARDSETS.map(([id, n]) =>
    `<button class="sw swc pv cards-${id}${l.cards === id ? ' sel' : ''}"${dis} onclick="pickCards('${id}')"><div class="c r heart"><em>A</em><b>♥</b></div><span>${n}</span></button>`).join('');
  return `
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
  if (!setupAudioGraph()) bgAudio.volume = savedVol() / 100;
  if (actx && actx.state === 'suspended') actx.resume();
  const ext = (n == 1 || n == 21) ? 'm4a' : 'mp3';
  bgAudio.src = `music${n}.${ext}`;
  bgAudio.play().catch(e => console.log('Music play error:', e));
}

function updateMusicUI() {
  const b = document.getElementById('mbPlay');
  if (b) b.textContent = (musicOn && !bgAudio.paused) ? '⏸' : '▶️';
  const num = document.getElementById('mbNum');
  if (num) num.textContent = roomTrack;
}

/* توقف و ادامه فقط برای خود شخص است */
function musicToggle() {
  if (musicOn) { musicOn = false; bgAudio.pause(); }
  else { musicOn = true; playLocal(roomTrack); }
  updateMusicUI();
}

/* قبلی، بعدی و انتخاب آهنگ برای همه‌ی بازیکنان اتاق است */
function goTrack(n) {
  roomTrack = n; musicOn = true; playLocal(n); updateMusicUI();
  if (inRoom()) sk.emit('track', n);
}
function musicNext() { goTrack(roomTrack % TRACKS + 1); }
function musicPrev() { goTrack(roomTrack === 1 ? TRACKS : roomTrack - 1); }

function onRemoteTrack(n) {
  n = parseInt(n, 10);
  if (!(n >= 1 && n <= TRACKS) || n === roomTrack) return;
  roomTrack = n;
  if (musicOn) playLocal(n);
  updateMusicUI();
}
function syncTrackFromState(n) {
  if (trackSynced) return;
  trackSynced = true;
  n = parseInt(n, 10);
  if (n >= 1 && n <= TRACKS) { roomTrack = n; updateMusicUI(); }
}
function musicSelect(v) {
  if (v === '-1') { musicOn = false; bgAudio.pause(); updateMusicUI(); }
  else goTrack(parseInt(v, 10));
}

bgAudio.addEventListener('ended', () => {
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

applyLook(prefLook());
updateMusicUI();
if (typeof sk !== 'undefined') sk.on('track', onRemoteTrack);
