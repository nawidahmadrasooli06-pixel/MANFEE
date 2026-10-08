/* موزیک پس‌زمینه، تنظیمات، تم میز و طرح کارت */
const bgAudio = new Audio();
bgAudio.loop = true;
bgAudio.preload = 'auto';

let actx = null, gainNode = null, curTrack = '-1';

const THEMES = ['theme-classic', 'theme-casino', 'theme-dark', 'theme-gold'];
const CARDS = ['card-style-default', 'card-style-joker', 'card-style-floral', 'card-style-dark'];

function lsGet(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

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

function playMusicTrack(trackNum) {
  curTrack = String(trackNum);
  if (!trackNum || trackNum === '-1' || trackNum === 'off') {
    bgAudio.pause();
    return;
  }
  const ok = setupAudioGraph();
  if (!ok) bgAudio.volume = savedVol() / 100;
  if (actx && actx.state === 'suspended') actx.resume();
  const ext = (trackNum == 1 || trackNum == 21) ? 'm4a' : 'mp3';
  bgAudio.src = `music${trackNum}.${ext}`;
  bgAudio.play().catch(e => console.log('Music play error:', e));
}

function changeVolume(val) {
  const v = Math.max(0, Math.min(100, parseFloat(val) || 0));
  lsSet('mvol', String(Math.round(v)));
  if (gainNode) gainNode.gain.value = v / 100;
  else bgAudio.volume = v / 100;
  const lbl = document.getElementById('volLabel');
  if (lbl) lbl.textContent = Math.round(v);
}

function closeSettingsModal() {
  const modal = document.getElementById('customSettingsModal');
  if (modal) modal.remove();
}

function openSettingsModal() {
  closeSettingsModal();
  const theme = lsGet('theme', 'theme-classic');
  const card = lsGet('cardStyle', 'card-style-default');
  const sel = (a, b) => a === b ? ' selected' : '';

  let musicOptions = `<option value="-1"${sel(curTrack, '-1')}>خاموش</option>`;
  for (let i = 1; i <= 21; i++) musicOptions += `<option value="${i}"${sel(curTrack, String(i))}>موزیک شماره ${i}</option>`;

  const selStyle = 'background:#0f2a28; color:#fff; border:1px solid #f0b64a; border-radius:8px; padding:5px;';
  const row = 'display:flex; justify-content:space-between; align-items:center; gap:8px;';

  const html = `
    <div id="customSettingsModal" style="position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;">
      <div style="background:#0b1f1e; border:2px solid #f0b64a; border-radius:18px; padding:20px; width:100%; max-width:320px; color:#fff; text-align:center; display:flex; flex-direction:column; gap:12px;">
        <h3 style="margin:0; color:#f0b64a;">⚙️ تنظیمات، تم و موزیک</h3>

        <div style="${row}">
          <span>🎨 تم میز:</span>
          <select id="themeSelect" onchange="changeTheme(this.value)" style="${selStyle}">
            <option value="theme-classic"${sel(theme, 'theme-classic')}>سبز کلاسیک (اصلی)</option>
            <option value="theme-casino"${sel(theme, 'theme-casino')}>قرمز کازینویی</option>
            <option value="theme-dark"${sel(theme, 'theme-dark')}>سرمه‌ای دارک</option>
            <option value="theme-gold"${sel(theme, 'theme-gold')}>طلایی لاکچری</option>
          </select>
        </div>

        <div style="${row}">
          <span>🃏 طرح کارت‌ها:</span>
          <select id="cardSelect" onchange="changeCardStyle(this.value)" style="${selStyle}">
            <option value="card-style-default"${sel(card, 'card-style-default')}>کلاسیک</option>
            <option value="card-style-joker"${sel(card, 'card-style-joker')}>طرح جوکر</option>
            <option value="card-style-floral"${sel(card, 'card-style-floral')}>طرح گل‌گلی</option>
            <option value="card-style-dark"${sel(card, 'card-style-dark')}>سنگین / خفن</option>
          </select>
        </div>

        <div style="${row}">
          <span>🎵 موزیک:</span>
          <select id="musicSelect" onchange="playMusicTrack(this.value)" style="${selStyle}">${musicOptions}</select>
        </div>

        <div style="${row}">
          <span>🔊 ولوم: <b id="volLabel">${savedVol()}</b></span>
          <input type="range" id="volRange" min="0" max="100" step="1" value="${savedVol()}" oninput="changeVolume(this.value)" onchange="changeVolume(this.value)" style="flex:1; min-width:0; direction:ltr;">
        </div>

        <button style="padding:10px; margin-top:6px; background:#f0b64a; color:#000; font-weight:bold; border:none; border-radius:10px; cursor:pointer;" onclick="closeSettingsModal()">بستن</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function changeTheme(name) {
  document.body.classList.remove(...THEMES);
  document.body.classList.add(name);
  lsSet('theme', name);
}

function changeCardStyle(name) {
  document.body.classList.remove(...CARDS);
  document.body.classList.add(name);
  lsSet('cardStyle', name);
}

/* اعمال تم و طرح کارت ذخیره‌شده هنگام باز شدن بازی */
document.body.classList.add(lsGet('theme', 'theme-classic'), lsGet('cardStyle', 'card-style-default'));
