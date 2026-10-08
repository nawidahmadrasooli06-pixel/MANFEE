const TOTAL_TRACKS = 21;
let playlist = [];
let currentTrackIndex = -1;

let bgAudio = new Audio();
bgAudio.volume = 0.2;

for (let i = 1; i <= TOTAL_TRACKS; i++) {
  playlist.push({ name: `موزیک شماره ${i}`, file: `./music${i}.mp3` });
}

document.addEventListener("DOMContentLoaded", () => {
  createSettingsModal();
  injectMiniPlayer();

  const savedTheme = localStorage.getItem("manfee_theme") || "theme-classic";
  const savedCard = localStorage.getItem("manfee_card") || "card-style-default";
  const savedVol = localStorage.getItem("manfee_vol") || "20";
  
  changeTheme(savedTheme);
  changeCardStyle(savedCard);
  bgAudio.volume = savedVol / 100;
  
  const volRange = document.getElementById("volRange");
  if (volRange) volRange.value = savedVol;
});

bgAudio.onended = () => {
  nextTrack();
};

function playTrackAtIndex(index) {
  currentTrackIndex = index;
  bgAudio.src = playlist[index].file;
  bgAudio.play().catch(e => console.log("Audio play error:", e));
  updateMiniPlayerUI(true);
  
  const musicSelect = document.getElementById("musicSelect");
  if (musicSelect) musicSelect.value = index;
}

function startMusicFrom(index) {
  if (index === -1) {
    stopMusic();
    return;
  }
  playTrackAtIndex(index);
}

function togglePlay() {
  if (bgAudio.paused) {
    if (currentTrackIndex === -1) {
      startMusicFrom(0);
    } else {
      bgAudio.play();
      updateMiniPlayerUI(true);
    }
  } else {
    bgAudio.pause();
    updateMiniPlayerUI(false);
  }
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % TOTAL_TRACKS;
  playTrackAtIndex(currentTrackIndex);
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + TOTAL_TRACKS) % TOTAL_TRACKS;
  playTrackAtIndex(currentTrackIndex);
}

function stopMusic() {
  bgAudio.pause();
  bgAudio.currentTime = 0;
  currentTrackIndex = -1;
  updateMiniPlayerUI(false);
  const musicSelect = document.getElementById("musicSelect");
  if (musicSelect) musicSelect.value = -1;
}

function changeVolume(val) {
  bgAudio.volume = val / 100;
  localStorage.setItem("manfee_vol", val);
}

function createSettingsModal() {
  if (document.getElementById("customSettingsModal")) return;

  let musicOptions = '<option value="-1">خاموش</option>';
  playlist.forEach((item, idx) => {
    musicOptions += `<option value="${idx}">${item.name}</option>`;
  });

  const modalHTML = `
    <div id="customSettingsModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; flex-direction:column; align-items:center; justify-content:center; padding:20px;">
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
          <select id="musicSelect" onchange="startMusicFrom(parseInt(this.value))" style="background:#0f2a28; color:#fff; border:1px solid #f0b64a; border-radius:8px; padding:5px;">
            ${musicOptions}
          </select>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span>🔊 ولوم زیرصدا:</span>
          <input type="range" id="volRange" min="0" max="100" value="20" oninput="changeVolume(this.value)">
        </div>

        <button style="min-width:auto; padding:10px; margin-top:10px; background:#f0b64a; color:#000; font-weight:bold; border:none; border-radius:10px; cursor:pointer;" onclick="closeSettingsModal()">بستن</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function openSettingsModal() {
  let modal = document.getElementById("customSettingsModal");
  if (!modal) {
    createSettingsModal();
    modal = document.getElementById("customSettingsModal");
  }
  if (modal) modal.style.display = "flex";
}

function closeSettingsModal() {
  const modal = document.getElementById("customSettingsModal");
  if (modal) modal.style.display = "none";
}

function changeTheme(themeName) {
  document.body.className = document.body.className.replace(/theme-\S+/g, '');
  document.body.classList.add(themeName);
  
  const gameTbl = document.getElementById("tbl");
  if (gameTbl) {
    if (themeName === "theme-casino") gameTbl.style.background = "#4a0d0d";
    else if (themeName === "theme-dark") gameTbl.style.background = "#0f172a";
    else if (themeName === "theme-gold") gameTbl.style.background = "#2d2006";
    else gameTbl.style.background = "#0b1f1e";
  }

  localStorage.setItem("manfee_theme", themeName);
  const sel = document.getElementById("themeSelect");
  if (sel) sel.value = themeName;
}

function changeCardStyle(cardStyle) {
  document.body.className = document.body.className.replace(/card-style-\S+/g, '');
  document.body.classList.add(cardStyle);
  localStorage.setItem("manfee_card", cardStyle);
  const sel = document.getElementById("cardSelect");
  if (sel) sel.value = cardStyle;
}

function injectMiniPlayer() {
  if (document.getElementById("miniPlayer")) return;

  const miniPlayerHTML = `
    <div id="miniPlayer" style="position:fixed; bottom:15px; left:15px; z-index:999; display:flex; gap:8px; background:rgba(11,31,30,0.9); padding:6px 12px; border-radius:25px; border:1px solid #f0b64a;">
      <button onclick="prevTrack()" style="background:none; border:none; color:#fff; font-size:16px; cursor:pointer;">⏮️</button>
      <button id="playPauseBtn" onclick="togglePlay()" style="background:none; border:none; color:#fff; font-size:16px; cursor:pointer;">▶️</button>
      <button onclick="nextTrack()" style="background:none; border:none; color:#fff; font-size:16px; cursor:pointer;">⏭️</button>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", miniPlayerHTML);
}

function updateMiniPlayerUI(isPlaying) {
  const btn = document.getElementById("playPauseBtn");
  if (btn) btn.innerText = isPlaying ? "⏸️" : "▶️";
}
