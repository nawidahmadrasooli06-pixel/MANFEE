let bgAudio = new Audio();
bgAudio.loop = true;
bgAudio.volume = 0.2; // میزان صدای پیش‌فرض روی ۲۰٪ (مناسب برای زیرصدا)

// ۲۰ موزیک انتخابی شما
const musicTracks = { off: "" };
for (let i = 1; i <= 20; i++) {
  musicTracks[`track${i}`] = `music${i}.mp3`;
}

document.addEventListener("DOMContentLoaded", () => {
  createSettingsModal();
  injectEmojiBar();

  const savedTheme = localStorage.getItem("manfee_theme") || "theme-classic";
  const savedCard = localStorage.getItem("manfee_card") || "card-style-default";
  const savedVol = localStorage.getItem("manfee_vol") || "20";
  
  document.body.classList.add(savedTheme);
  document.body.classList.add(savedCard);
  
  bgAudio.volume = savedVol / 100;
});

function createSettingsModal() {
  let musicOptions = '<option value="off">خاموش</option>';
  for (let i = 1; i <= 20; i++) {
    musicOptions += `<option value="track${i}">موزیک ${i}</option>`;
  }

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
          <select id="musicSelect" onchange="playMusic(this.value)">
            ${musicOptions}
          </select>
        </div>

        <div class="setting-row">
          <span>🔊 ولوم صدا (۱ تا ۱۰۰):</span>
          <input type="range" id="volRange" min="0" max="100" value="20" oninput="changeVolume(this.value)">
        </div>

        <hr style="border-color:#2b5a55; width:100%;">
        <div style="font-size:13px; text-align:right;">
          <b style="color:#f0b64a;">📊 آمار شخصی شما:</b><br>
          بازی‌های انجام شده: <span id="statGames">۰</span><br>
          بردها: <span id="statWins">۰</span>
        </div>

        <button class="btn go" style="min-width:auto; padding:8px;" onclick="closeSettings()">بستن</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function openSettings() { document.getElementById("customSettingsModal").classList.add("open"); }
function closeSettings() { document.getElementById("customSettingsModal").classList.remove("open"); }

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

function playMusic(trackKey) {
  if (trackKey === "off" || !musicTracks[trackKey]) {
    bgAudio.pause();
  } else {
    bgAudio.src = musicTracks[trackKey];
    bgAudio.play().catch(e => console.log("Music play issue"));
  }
}

function changeVolume(val) {
  bgAudio.volume = val / 100;
  localStorage.setItem("manfee_vol", val);
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
