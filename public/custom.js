let bgAudio = new Audio();
bgAudio.loop = true;
bgAudio.volume = 0.5;

function playMusicTrack(trackNum) {
  if (!trackNum || trackNum === '-1' || trackNum === 'off') {
    bgAudio.pause();
    return;
  }
  let ext = (trackNum == 1 || trackNum == 21) ? 'm4a' : 'mp3';
  bgAudio.src = `music${trackNum}.${ext}`;
  bgAudio.play().catch(e => console.log("Audio play error:", e));
}

function changeVolume(val) {
  let volumeValue = parseFloat(val) / 100;
  bgAudio.volume = volumeValue;
}

function openSettingsModal() {
  let modal = document.getElementById('customSettingsModal');
  if (!modal) {
    createSettingsModal();
    modal = document.getElementById('customSettingsModal');
  }
  if (modal) modal.style.display = 'flex';
}

function closeSettingsModal() {
  const modal = document.getElementById('customSettingsModal');
  if (modal) modal.style.display = 'none';
}

function createSettingsModal() {
  if (document.getElementById('customSettingsModal')) return;

  let musicOptions = '<option value="-1">خاموش</option>';
  for (let i = 1; i <= 21; i++) {
    musicOptions += `<option value="${i}">موزیک شماره ${i}</option>`;
  }

  const modalHTML = `
    <div id="customSettingsModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:99999; flex-direction:column; align-items:center; justify-content:center; padding:20px;">
      <div style="background:#0b1f1e; border:2px solid #f0b64a; border-radius:18px; padding:20px; width:100%; max-width:320px; color:#fff; text-align:center; display:flex; flex-direction:column; gap:12px;">
        <h3 style="margin:0; color:#f0b64a;">⚙️ تنظیمات، تم و موزیک</h3>
        
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>🎨 تم میز:</span>
          <select id="themeSelect" onchange="changeTheme(this.value)" style="background:#0f2a28; color:#fff; border:1px solid #f0b64a; border-radius:8px; padding:5px;">
            <option value="theme-classic">سبز کلاسیک</option>
            <option value="theme-casino">قرمز کازینویی</option>
            <option value="theme-dark">سرمه‌ای دارک</option>
            <option value="theme-gold">طلایی لاکچری</option>
          </select>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>🃏 طرح کارت‌ها:</span>
          <select id="cardSelect" onchange="changeCardStyle(this.value)" style="background:#0f2a28; color:#fff; border:1px solid #f0b64a; border-radius:8px; padding:5px;">
            <option value="card-style-default">کلاسیک</option>
            <option value="card-style-joker">طرح جوکر</option>
            <option value="card-style-floral">طرح گل‌گلی</option>
            <option value="card-style-dark">سنگین / خفن</option>
          </select>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>🎵 انتخاب موزیک:</span>
          <select id="musicSelect" onchange="playMusicTrack(this.value)" style="background:#0f2a28; color:#fff; border:1px solid #f0b64a; border-radius:8px; padding:5px;">
            ${musicOptions}
          </select>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>🔊 ولوم زیرصدا:</span>
          <input type="range" id="volRange" min="0" max="100" value="50" oninput="changeVolume(this.value)" onchange="changeVolume(this.value)">
        </div>

        <button style="padding:10px; margin-top:10px; background:#f0b64a; color:#000; font-weight:bold; border:none; border-radius:10px; cursor:pointer;" onclick="closeSettingsModal()">بستن</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function changeTheme(themeName) {
  document.body.classList.remove('theme-classic', 'theme-casino', 'theme-dark', 'theme-gold');
  document.body.classList.add(themeName);
}

function changeCardStyle(cardStyle) {
  document.body.classList.remove('card-style-default', 'card-style-joker', 'card-style-floral', 'card-style-dark');
  document.body.classList.add(cardStyle);
}
