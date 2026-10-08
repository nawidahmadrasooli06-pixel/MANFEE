const TOTAL_TRACKS = 21;
let playlist = [];
let currentTrackIndex = -1;
let tracksPlayedCount = 0;

let bgAudio = new Audio();
bgAudio.volume = 0.2; // ولوم پیش‌فرض ۲۰٪

// ساخت لیست ۲۱ موزیک
for (let i = 1; i <= TOTAL_TRACKS; i++) {
  playlist.push({ name: `موزیک شماره ${i}`, file: `music${i}.mp3` });
}

document.addEventListener("DOMContentLoaded", () => {
  createSettingsModal();
  injectMiniPlayer();
  injectEmojiBar();

  const savedTheme = localStorage.getItem("manfee_theme") || "theme-classic";
  const savedCard = localStorage.getItem("manfee_card") || "card-style-default";
  const savedVol = localStorage.getItem("manfee_vol") || "20";
  
  document.body.classList.add(savedTheme, savedCard);
  bgAudio.volume = savedVol / 100;
  
  const volRange = document.getElementById("volRange");
  if (volRange) volRange.value = savedVol;
});

// مدیریت پخش متوالی موزیک‌ها
bgAudio.onended = () => {
  tracksPlayedCount++;
  if (tracksPlayedCount >= TOTAL_TRACKS) {
    stopMusic();
    return;
  }
  currentTrackIndex = (currentTrackIndex + 1) % TOTAL_TRACKS;
  playTrackAtIndex(currentTrackIndex);
};

function playTrackAtIndex(index) {
  currentTrackIndex = index;
  bgAudio.src = playlist[index].file;
  bgAudio.play().catch(e => console.log("Music play issue"));
  updateMiniPlayerUI(true);
  
  const musicSelect = document.getElementById("musicSelect");
  if (musicSelect) musicSelect.value = index;
}

function startMusicFrom(index) {
  if (index === -1) {
    stopMusic();
    return;
  }
  tracksPlayedCount = 0;
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
  if (currentTrackIndex === -1) {
    startMusicFrom(0);
  } else {
    tracksPlayedCount++;
    if (tracksPlayedCount >= TOTAL_TRACKS) {
      stopMusic();
      return;
    }
    currentTrackIndex = (currentTrackIndex + 1) % TOTAL_TRACKS;
    playTrackAtIndex(currentTrackIndex);
  }
}

function prevTrack() {
  if (currentTrackIndex === -1) {
    startMusicFrom(0);
  } else {
    currentTrackIndex = (currentTrackIndex - 1 + TOTAL_TRACKS) % TOTAL_TRACKS;
    playTrackAtIndex(currentTrackIndex);
  }
}

function stopMusic() {
  bgAudio.pause();
  bgAudio.currentTime = 0;
  currentTrackIndex = -1;
  tracksPlayedCount = 0;
  updateMiniPlayerUI(false);
  const musicSelect = document.getElementById("musicSelect");
  if (musicSelect) musicSelect.value = -1;
}

function changeVolume(val) {
  bgAudio.volume = val / 100;
  localStorage.setItem("manfee_vol", val);
}

// ساخت پنجره تنظیمات
function createSettingsModal() {
  if (document.getElementById("customSettingsModal")) return;

  let musicOptions = '<option value="-1">خاموش</option>';
  playlist.forEach((item, idx) => {
    musicOptions += `<option value="${idx}">${item.name}</option>`;
  });

  const modalHTML = `
    <div id="customSettingsModal" class="custom-modal">
      <div class="modal-box">
        <h3 style="margin:0; color:#f0b64a;">⚙️ تنظیمات و موزیک</h3>
        
        <div class="setting-row">
          <span>🎨 تم میز:</span>
          <select id="themeSelect" onchange="changeTheme(this.value)">
            <option value="theme-classic">سبز کلاسیک</option>
            <option value="theme-casino">قرمز کازینویی</option>
            <option value="theme-dark">سرمه‌ای دارک</option>
            <option value="theme-gold">طلایی لاکچری</option>
          </select>
        </div>

        <div class="setting-row">
          <span>🃏 طرح کارت‌ها:</span>
          <select id="cardSelect" onchange="changeCardStyle(this.value)">
            <option value="card-style-default">کلاسیک</option>
            <option value="card-style-joker">طرح جوکر</option>
            <option value="card-style-floral">طرح گل‌گلی</option>
            <option value="card-style-dark">سنگین / خفن</option>
          </select>
        </div>

        <div class="setting-row">
          <span>🎵 انتخاب موزیک:</span>
          <select id="musicSelect" onchange="startMusicFrom(parseInt(this.value))">
            ${musicOptions}
          </select>
        </div>

        <div class="setting-row">
          <span>🔊 ولوم زیرصدا (۱ تا ۱۰۰):</span>
          <input type="range" id="volRange" min="0" max="100" value="20" oninput="changeVolume(this.value)">
        </div>

        <button class="btn go" style="min-width:auto; padding:10px; margin-top:10px;" onclick="closeSettings()">بستن</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function openSettings() {
  const modal = document.getElementById("customSettingsModal");
  if (modal) {
    modal.classList.add("open");
  } else {
    createSettingsModal();
    document.getElementById("customSettingsModal").classList.add("open");
  }
}

function closeSettings() {
  const modal = document.getElementById("customSettingsModal");
  if (modal) modal.classList.remove("open");
}

function changeTheme(themeName) {
  document.body.classList.remove("theme-classic", "theme-casino", "theme-dark", "theme-gold");
  document.body.classList.add(themeName);
  localStorage.setItem("manfee_theme", themeName);
}

function changeCardStyle(cardStyle) {
  document.body.classList.remove("card-style-default", "card-style-joker", "card-style-floral", "card-style-dark");
  document.body.classList.add(cardStyle);
  localStorage.setItem("manfee_card", cardStyle);
}

// مینی پلیر جدید در پایین سمت چپ صفحه
function injectMiniPlayer() {
  if (document.getElementById("miniPlayer")) return;

  const miniPlayerHTML = `
    <div id="miniPlayer" style="position:fixed; bottom:20px; left:15px; z-index:999; display:flex; gap:8px; background:rgba(11,31,30,0.9); padding:6px 12px; border-radius:25px; border:1px solid #f0b64a; box-shadow:0 4px 10px rgba(0,0,0,0.5);">
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

function injectEmojiBar() {
  const checkHand = setInterval(() => {
    const handArea = document.getElementById("hand");
    if (handArea && !document.getElementById("reactBar")) {
      const reactBar = document.createElement("div");
      reactBar.id = "reactBar";
      reactBar.className = "reaction-bar";

      const emojis = ["💣", "♠️", "🤣", "😭"];
      emojis.forEach(emo => {
        const btn = document.createElement("button");
        btn.className = "react-btn";
        btn.innerText = emo;
        btn.onclick = () => sendEmoji(emo);
        reactBar.appendChild(btn);
      });

      handArea.parentNode.insertBefore(reactBar, handArea);
    }
  }, 1000);
}

function sendEmoji(emoji) {
  const mySeat = document.querySelector(".st.p0");
  if (!mySeat) return;

  const pop = document.createElement("div");
  pop.className = "pop-emoji";
  pop.innerText = emoji;
  mySeat.appendChild(pop);

  setTimeout(() => pop.remove(), 2200);
}
