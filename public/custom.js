// سیستم پخش موزیک اصلاح شده
let bgAudio = new Audio();
bgAudio.loop = true;

function playMusicTrack(trackNum) {
  if (!trackNum || trackNum === 'off') {
    bgAudio.pause();
    return;
  }
  
  // پشتیبانی از mp3 و m4a
  let ext = (trackNum == 1 || trackNum == 21) ? 'm4a' : 'mp3';
  bgAudio.src = `music${trackNum}.${ext}`;
  
  let promise = bgAudio.play();
  if (promise !== undefined) {
    promise.catch(error => {
      console.log("پخش خودکار مسدود شد. نیاز به تعامل کاربر دارد.");
    });
  }
}

function setVolume(val) {
  bgAudio.volume = val / 100;
}

function openSettingsModal() {
  let modal = document.getElementById('settingsModal');
  if(!modal) {
    modal = document.createElement('div');
    modal.id = 'settingsModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="background:#132a28;border:1px solid #f0b64a;padding:20px;border-radius:16px;width:280px;text-align:center;color:#fff;">
        <h3 style="color:#f0b64a;margin-top:0;">⚙️ تنظیمات، تم و موزیک</h3>
        <label>🎨 تم میز:</label>
        <select id="themeSelect" onchange="applyTheme(this.value)" style="width:100%;margin:5px 0 15px;padding:8px;border-radius:8px;">
          <option value="classic">سبز کلاسیک (اصلی)</option>
          <option value="casino">قرمز کازینویی</option>
          <option value="dark">تاریک شیک</option>
          <option value="gold">طلایی سنگین</option>
        </select>
        <label>🎵 انتخاب موزیک:</label>
        <select id="musicSelect" onchange="playMusicTrack(this.value)" style="width:100%;margin:5px 0 15px;padding:8px;border-radius:8px;">
          <option value="off">خاموش</option>
          ${Array.from({length: 21}, (_, i) => `<option value="${i+1}">موزیک شماره ${i+1}</option>`).join('')}
        </select>
        <label>🔊 ولوم صدا:</label>
        <input type="range" min="0" max="100" value="80" oninput="setVolume(this.value)" style="width:100%;margin:5px 0 15px;">
        <button onclick="document.getElementById('settingsModal').style.display='none'" style="background:#f0b64a;color:#000;border:none;padding:8px 20px;border-radius:8px;font-weight:bold;cursor:pointer;width:100%;">بستن</button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }
}

function applyTheme(theme) {
  document.body.className = '';
  document.body.classList.add(`theme-${theme}`);
}

// فعال‌سازی پخش صدا با اولین لمس صفحه توسط کاربر
document.addEventListener('click', function() {
  if (bgAudio.src && bgAudio.paused && bgAudio.currentTime === 0) {
    bgAudio.play().catch(()=>{});
  }
}, { once: true });
