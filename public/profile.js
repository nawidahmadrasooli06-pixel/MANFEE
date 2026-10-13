(function () {
  'use strict';

  const KEY = 'cactuc_profile_v1';
  const $ = (s, r = document) => r.querySelector(s);
  const EMOJIS = ['🃏', '♠️', '🌟', '🐼', '🦊', '👑', '🔥', '💎', '🐯', '⚡', '🌙', '🎮'];

  function tgUser() {
    try {
      return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe &&
        Telegram.WebApp.initDataUnsafe.user) || {};
    } catch (_) { return {}; }
  }

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (_) { return null; }
  }

  function payload() {
    const p = read() || {};
    const u = tgUser();
    return {
      name: String(p.name || u.first_name || localStorage.nm || 'بازیکن'),
      avatar: String(p.avatar || ''),
      emoji: String(p.emoji || '🃏'),
      complete: !!p.complete,
      telegramName: u.first_name || '',
      username: u.username || '',
      id: u.id || null
    };
  }

  function name() { return payload().name; }
  function get() { return payload(); }

  function addStyle() {
    if ($('#cactuc-profile-css')) return;
    const st = document.createElement('style');
    st.id = 'cactuc-profile-css';
    st.textContent = `
      #cactucProfileModal{position:fixed;inset:0;z-index:999999;background:#000d;display:none;align-items:center;justify-content:center;padding:16px;font-family:inherit}
      #cactucProfileModal.open{display:flex}
      #cactucProfileModal .cp-card{width:min(420px,96vw);max-height:92dvh;overflow:auto;background:linear-gradient(145deg,#172b4b,#071322);border:2px solid #e4c46a;border-radius:22px;padding:20px;color:#fff;text-align:center;box-shadow:0 18px 60px #000c}
      #cactucProfileModal h2{margin:4px 0 8px;color:#ffe08a}
      #cactucProfileModal input[type=text]{box-sizing:border-box;width:100%;font:inherit;padding:12px;border-radius:12px;border:1px solid #7186a8;background:#0b172b;color:white;margin:6px 0}
      #cactucProfileModal .cp-emojis{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:10px 0}
      #cactucProfileModal .cp-emojis button{font-size:23px;padding:6px 9px;border-radius:12px;background:#233958;color:#fff;border:1px solid #e4c46a}
      #cactucProfileModal .cp-emojis button.sel{background:#e4c46a;color:#111}
      #cactucProfileModal .cp-actions{display:flex;gap:8px;margin-top:12px}
      #cactucProfileModal .cp-actions button{flex:1;font:inherit;font-weight:800;padding:11px 6px;border-radius:12px;border:0;background:#e4c46a;color:#17213a}
      #cactucProfileModal .cp-actions .cp-close{background:#35445b;color:#fff}
      #cactucProfileModal .cp-photo{display:block;width:100%;box-sizing:border-box;margin:7px 0;padding:12px;border-radius:12px;background:#203858;color:#fff;border:1px solid #e4c46a;font:inherit;font-weight:700}
      #cactucProfileModal .cp-preview{width:76px;height:76px;border-radius:50%;object-fit:cover;display:block;margin:8px auto;border:2px solid #e4c46a;background:#203858}
      #cactucProfileModal .cp-hint{font-size:12px;opacity:.82;line-height:1.8}
      #cactucProfileButton{position:fixed;z-index:5000;top:8px;left:8px;border:1px solid #e4c46a;border-radius:999px;padding:7px 10px;background:#132442;color:#fff;font:inherit;font-size:12px}
      #cactucOwnerMenu{position:fixed;z-index:1000000;inset:0;background:#0009;display:none;align-items:center;justify-content:center;padding:20px}
      #cactucOwnerMenu.open{display:flex}
      #cactucOwnerMenu .cp-card{width:min(320px,92vw);background:#101e35;border:1px solid #e4c46a;border-radius:18px;padding:16px;text-align:center;color:#fff}
      #cactucOwnerMenu button{display:block;width:100%;margin:7px 0;padding:11px;border-radius:10px;border:1px solid #e4c46a;background:#20385a;color:#fff;font:inherit}
    `;
    document.head.appendChild(st);
  }

  function makeModal() {
    if ($('#cactucProfileModal')) return;
    const d = document.createElement('div');
    d.id = 'cactucProfileModal';
    d.innerHTML = `
      <div class="cp-card" role="dialog" aria-modal="true">
        <h2>👤 پروفایل بازیکن</h2>
        <p id="cp-intro">اسم نمایشی و شکلک یا عکس پروفایلت را انتخاب کن.</p>
        <label for="cp-name">اسم نمایشی</label>
        <input type="text" id="cp-name" maxlength="18" placeholder="نامی که همه در بازی ببینند">
        <img id="cp-preview" class="cp-preview" alt="پیش‌نمایش عکس" hidden>
        <button type="button" id="cp-pick-photo" class="cp-photo">📷 انتخاب عکس از گالری</button>
        <input id="cp-photo-file" type="file" accept="image/*" hidden>
        <div class="cp-hint">اگر عکس نمی‌خواهی، فقط یک شکلک انتخاب کن. لینک عکس لازم نیست.</div>
        <div>شکلک پروفایل</div>
        <div class="cp-emojis">${EMOJIS.map(e => `<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div>
        <div class="cp-actions">
          <button type="button" id="cp-save">تأیید و ذخیره</button>
          <button type="button" id="cp-close" class="cp-close">بستن</button>
        </div>
        <small class="cp-hint">نام، شکلک و عکس نمایشی در بازی دیده می‌شود.</small>
      </div>`;
    document.body.appendChild(d);

    let chosen = '🃏';
    let avatarData = '';
    const emojiButtons = [...d.querySelectorAll('[data-emoji]')];

    function paintEmoji() {
      emojiButtons.forEach(b => b.classList.toggle('sel', b.dataset.emoji === chosen));
    }
    function paintPreview() {
      const img = $('#cp-preview');
      if (avatarData) {
        img.src = avatarData;
        img.hidden = false;
      } else {
        img.removeAttribute('src');
        img.hidden = true;
      }
    }
    emojiButtons.forEach(b => b.addEventListener('click', () => {
      chosen = b.dataset.emoji;
      paintEmoji();
    }));
    $('#cp-pick-photo').addEventListener('click', () => $('#cp-photo-file').click());

    // Resize/compress the chosen image so it can safely fit in localStorage.
    $('#cp-photo-file').addEventListener('change', () => {
      const file = $('#cp-photo-file').files && $('#cp-photo-file').files[0];
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        alert('لطفاً یک عکس انتخاب کن.');
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => alert('عکس باز نشد. لطفاً دوباره امتحان کن.');
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => alert('این عکس قابل خواندن نیست. عکس دیگری انتخاب کن.');
        img.onload = () => {
          const max = 420;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) { alert('خواندن عکس ممکن نشد.'); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          let data = canvas.toDataURL('image/jpeg', 0.76);
          if (data.length > 450000) data = canvas.toDataURL('image/jpeg', 0.55);
          if (data.length > 600000) {
            alert('این عکس بزرگ است. لطفاً یک عکس کوچک‌تر انتخاب کن.');
            return;
          }
          avatarData = data;
          paintPreview();
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });

    const old = read() || {};
    const u = tgUser();
    $('#cp-name').value = old.name || u.first_name || localStorage.nm || '';
    avatarData = old.avatar || '';
    chosen = old.emoji || '🃏';
    paintEmoji();
    paintPreview();

    $('#cp-save').addEventListener('click', () => {
      const n = $('#cp-name').value.trim();
      if (!n) { alert('لطفاً اسم نمایشی را بنویس.'); return; }
      const p = {
        name: n.slice(0, 18),
        avatar: avatarData || '',
        emoji: chosen,
        complete: true,
        updatedAt: Date.now()
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(p));
        // Keep old game name keys in sync so both games show the same chosen name.
        localStorage.setItem('nm', p.name);
        localStorage.setItem('fk_nm', p.name);
      } catch (_) {
        alert('ذخیره انجام نشد. اگر عکس انتخاب کردی، یک عکس کوچک‌تر انتخاب کن.');
        return;
      }
      d.classList.remove('open');
      document.dispatchEvent(new CustomEvent('cactuc-profile', { detail: p }));
      window.dispatchEvent(new CustomEvent('cactuc-profile-saved', { detail: p }));
      window.dispatchEvent(new CustomEvent('storage', { key: KEY, newValue: JSON.stringify(p) }));
    });

    $('#cp-close').addEventListener('click', () => {
      if (!payload().complete) {
        alert('برای ادامهٔ بازی، اول پروفایلت را ذخیره کن.');
        return;
      }
      d.classList.remove('open');
    });
    d.addEventListener('click', e => {
      if (e.target === d && !payload().complete) e.preventDefault();
      else if (e.target === d) d.classList.remove('open');
    });
  }

  function openProfile() {
    makeModal();
    const p = read() || {};
    const u = tgUser();
    $('#cp-name').value = p.name || u.first_name || localStorage.nm || '';
    const file = $('#cp-photo-file');
    if (file) file.value = '';
    // Retain the existing selected image while editing.
    const img = $('#cp-preview');
    if (img) {
      if (p.avatar) { img.src = p.avatar; img.hidden = false; }
      else { img.removeAttribute('src'); img.hidden = true; }
    }
    const buttons = [...document.querySelectorAll('#cactucProfileModal [data-emoji]')];
    buttons.forEach(b => b.classList.toggle('sel', b.dataset.emoji === (p.emoji || '🃏')));
    $('#cactucProfileModal').classList.add('open');
  }

  function ownerMenu() {
    if ($('#cactucOwnerMenu')) return;
    const d = document.createElement('div');
    d.id = 'cactucOwnerMenu';
    d.innerHTML = `<div class="cp-card"><b style="color:#ffe08a">نوید=Cactuc</b><p dir="ltr">@cactuc580</p><button data-act="profile">رفتن به پروفایل</button><button data-act="copy">کپی کردن نام کاربری</button><button data-act="share">اشتراک‌گذاری</button><button data-act="close">بستن</button></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', async e => {
      const act = e.target && e.target.dataset && e.target.dataset.act;
      if (e.target === d || act === 'close') { d.classList.remove('open'); return; }
      if (act === 'profile') {
        try {
          if (window.Telegram && Telegram.WebApp && Telegram.WebApp.openTelegramLink) Telegram.WebApp.openTelegramLink('https://t.me/cactuc580');
          else window.open('https://t.me/cactuc580', '_blank');
        } catch (_) { window.open('https://t.me/cactuc580', '_blank'); }
      }
      if (act === 'copy') {
        try { await navigator.clipboard.writeText('@cactuc580'); alert('نام کاربری کپی شد'); }
        catch (_) { prompt('کپی کن', '@cactuc580'); }
      }
      if (act === 'share') {
        const url = 'https://t.me/cactuc580';
        try {
          if (navigator.share) await navigator.share({ title: 'VIP. CACTUC', url });
          else window.location.href = 'https://t.me/share/url?url=' + encodeURIComponent(url);
        } catch (_) {}
      }
    });
  }

  function init() {
    addStyle();
    makeModal();
    ownerMenu();
    if (!$('#cactucProfileButton')) {
      const b = document.createElement('button');
      b.id = 'cactucProfileButton';
      b.type = 'button';
      b.textContent = '👤 پروفایل من';
      b.addEventListener('click', openProfile);
      document.body.appendChild(b);
    }
    document.querySelectorAll('[data-owner], .brandId').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        ownerMenu();
        $('#cactucOwnerMenu').classList.add('open');
      });
    });

    // Important: do NOT globally intercept page clicks. It used to block every menu
    // button whenever the profile was incomplete, making navigation appear broken.
    const p = read();
    if (!p || !p.complete) setTimeout(openProfile, 250);
  }

  // Backward-compatible API expected by app.js and fiskoot.html.
  window.CProfile = { payload, name, get, open: openProfile, read };
  window.openMyProfile = openProfile;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
