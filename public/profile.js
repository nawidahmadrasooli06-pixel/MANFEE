(function () {
  'use strict';
  const KEY = 'cactuc_profile_v1';
  const $ = (s, r = document) => r.querySelector(s);
  let avatarData = '';

  function tgUser() {
    try { return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) || {}; }
    catch (_) { return {}; }
  }
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } }
  function payload() {
    const p = read() || {}, u = tgUser();
    const avatar = String(p.avatar || '');
    return { name: String(p.name || u.first_name || localStorage.nm || 'بازیکن'), avatar,
      photo: avatar, emoji: '', complete: !!(p.complete && p.name && avatar),
      telegramName: u.first_name || '', username: u.username || '', id: u.id || null };
  }
  function get() { return payload(); }
  function name() { return payload().name; }

  function addStyle() {
    if ($('#cactuc-profile-css')) return;
    const st = document.createElement('style'); st.id = 'cactuc-profile-css';
    st.textContent = `
      #cactucProfileModal{position:fixed;inset:0;z-index:999999;background:#000d;display:none;align-items:center;justify-content:center;padding:16px;font-family:inherit}
      #cactucProfileModal.open{display:flex}#cactucProfileModal .cp-card{width:min(420px,96vw);max-height:92dvh;overflow:auto;background:linear-gradient(145deg,#172b4b,#071322);border:2px solid #e4c46a;border-radius:22px;padding:20px;color:#fff;text-align:center;box-shadow:0 18px 60px #000c}
      #cactucProfileModal h2{margin:4px 0 8px;color:#ffe08a}#cactucProfileModal input[type=text]{box-sizing:border-box;width:100%;font:inherit;padding:12px;border-radius:12px;border:1px solid #7186a8;background:#0b172b;color:white;margin:6px 0}
      #cactucProfileModal .cp-photo{display:block;width:100%;box-sizing:border-box;margin:9px 0;padding:12px;border-radius:12px;background:#203858;color:#fff;border:1px solid #e4c46a;font:inherit;font-weight:700}
      #cactucProfileModal .cp-preview{width:88px;height:88px;border-radius:50%;object-fit:cover;display:block;margin:10px auto;border:2px solid #e4c46a;background:#203858}
      #cactucProfileModal .cp-hint{font-size:12px;opacity:.86;line-height:1.8}#cactucProfileModal .cp-actions{display:flex;gap:8px;margin-top:12px}
      #cactucProfileModal .cp-actions button{flex:1;font:inherit;font-weight:800;padding:11px 6px;border-radius:12px;border:0;background:#e4c46a;color:#17213a}#cactucProfileModal .cp-actions .cp-close{background:#35445b;color:#fff}
      #cactucProfileButton{position:fixed;z-index:5000;top:8px;left:8px;border:1px solid #e4c46a;border-radius:999px;padding:7px 10px;background:#132442;color:#fff;font:inherit;font-size:12px}
      #cactucOwnerMenu{position:fixed;z-index:1000000;inset:0;background:#0009;display:none;align-items:center;justify-content:center;padding:20px}#cactucOwnerMenu.open{display:flex}#cactucOwnerMenu .cp-card{width:min(320px,92vw);background:#101e35;border:1px solid #e4c46a;border-radius:18px;padding:16px;text-align:center;color:#fff}#cactucOwnerMenu button{display:block;width:100%;margin:7px 0;padding:11px;border-radius:10px;border:1px solid #e4c46a;background:#20385a;color:#fff;font:inherit}
      .cactuc-reaction-float{position:absolute;left:50%;top:-24px;transform:translateX(-50%);z-index:10000;font-size:32px;line-height:1;pointer-events:none;filter:drop-shadow(0 3px 5px #000);animation:cactucReactionFloat 1.45s ease-out both}
      @keyframes cactucReactionFloat{0%{opacity:0;transform:translate(-50%,12px) scale(.35)}15%{opacity:1;transform:translate(-50%,-8px) scale(1.3)}70%{opacity:1;transform:translate(-50%,-24px) scale(1)}100%{opacity:0;transform:translate(-50%,-46px) scale(.85)}}
      .player-avatar,.lobby-avatar,.fk-avatar{object-fit:cover}
    `; document.head.appendChild(st);
  }
  function makeModal() {
    if ($('#cactucProfileModal')) return;
    const d = document.createElement('div'); d.id = 'cactucProfileModal';
    d.innerHTML = `<div class="cp-card" role="dialog" aria-modal="true"><h2>👤 پروفایل بازیکن</h2><p>برای بازی، اسم و عکس خودت را انتخاب کن.</p><label for="cp-name">اسم نمایشی</label><input type="text" id="cp-name" maxlength="14" placeholder="نامی که همه در بازی ببینند"><img id="cp-preview" class="cp-preview" alt="پیش‌نمایش عکس" hidden><button type="button" id="cp-pick-photo" class="cp-photo">📷 انتخاب عکس از گالری</button><input id="cp-photo-file" type="file" accept="image/*" hidden><div class="cp-hint" id="cp-error">انتخاب عکس اجباری است. بدون عکس، پروفایل ذخیره نمی‌شود.</div><div class="cp-actions"><button type="button" id="cp-save">تأیید و ذخیره</button><button type="button" id="cp-close" class="cp-close">بستن</button></div></div>`;
    document.body.appendChild(d);
    const old = read() || {}, u = tgUser();
    $('#cp-name').value = old.name || u.first_name || localStorage.nm || '';
    avatarData = old.avatar || '';
    paintPreview();
    $('#cp-pick-photo').addEventListener('click', () => $('#cp-photo-file').click());
    $('#cp-photo-file').addEventListener('change', () => {
      const f = $('#cp-photo-file').files && $('#cp-photo-file').files[0]; if (!f) return;
      if (!f.type || !f.type.startsWith('image/')) { showError('لطفاً یک عکس معتبر از گالری انتخاب کن.'); return; }
      const rd = new FileReader();
      rd.onerror = () => showError('عکس باز نشد؛ لطفاً دوباره انتخاب کن.');
      rd.onload = () => {
        const im = new Image(); im.onerror = () => showError('خواندن عکس ممکن نشد؛ عکس دیگری انتخاب کن.');
        im.onload = () => {
          const max = 320, scale = Math.min(1, max / Math.max(im.width, im.height));
          const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * scale)); c.height = Math.max(1, Math.round(im.height * scale));
          const cx = c.getContext('2d'); if (!cx) { showError('پردازش عکس ممکن نشد.'); return; }
          cx.drawImage(im, 0, 0, c.width, c.height);
          let data = c.toDataURL('image/jpeg', .68);
          if (data.length > 390000) data = c.toDataURL('image/jpeg', .48);
          if (data.length > 410000) { showError('حجم عکس زیاد است؛ لطفاً عکس کوچک‌تری انتخاب کن.'); return; }
          avatarData = data; paintPreview(); showError('عکس انتخاب شد. حالا «تأیید و ذخیره» را بزن.', true);
        }; im.src = String(rd.result || '');
      }; rd.readAsDataURL(f);
    });
    $('#cp-save').addEventListener('click', () => {
      const n = $('#cp-name').value.trim();
      if (!n) { showError('باید اسم نمایشی را تکمیل کنی.'); $('#cp-name').focus(); return; }
      if (!avatarData || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(avatarData)) { showError('باید عکس را از گالری انتخاب کنی؛ این بخش اجباری است.'); $('#cp-pick-photo').focus(); return; }
      const p = { name: n.slice(0, 14), avatar: avatarData, emoji: '', complete: true, updatedAt: Date.now() };
      try { localStorage.setItem(KEY, JSON.stringify(p)); localStorage.setItem('nm', p.name); localStorage.setItem('fk_nm', p.name); }
      catch (_) { showError('ذخیره نشد؛ لطفاً عکس کوچک‌تری انتخاب کن.'); return; }
      d.classList.remove('open'); document.dispatchEvent(new CustomEvent('cactuc-profile', { detail: payload() })); window.dispatchEvent(new CustomEvent('cactuc-profile-saved', { detail: payload() }));
      updateButtonVisibility();
    });
    $('#cp-close').addEventListener('click', () => { if (!payload().complete) { showError('برای ادامه، اسم و عکس پروفایل را تکمیل کن.'); return; } d.classList.remove('open'); });
    d.addEventListener('click', e => { if (e.target === d && !payload().complete) { showError('برای ادامه، اسم و عکس پروفایل را تکمیل کن.'); return; } if (e.target === d) d.classList.remove('open'); });
  }
  function showError(msg, ok) { const e = $('#cp-error'); if (e) { e.textContent = msg; e.style.color = ok ? '#a8f0b2' : '#ffd5a6'; } }
  function paintPreview() { const img = $('#cp-preview'); if (!img) return; if (avatarData) { img.src = avatarData; img.hidden = false; } else { img.removeAttribute('src'); img.hidden = true; } }
  function openProfile() { makeModal(); const p = read() || {}, u = tgUser(); $('#cp-name').value = p.name || u.first_name || localStorage.nm || ''; avatarData = p.avatar || ''; const f = $('#cp-photo-file'); if (f) f.value = ''; paintPreview(); showError('انتخاب عکس اجباری است. بدون عکس، پروفایل ذخیره نمی‌شود.'); $('#cactucProfileModal').classList.add('open'); }
  function ownerMenu() {
    if ($('#cactucOwnerMenu')) return;
    const d = document.createElement('div'); d.id = 'cactucOwnerMenu'; d.innerHTML = `<div class="cp-card"><b style="color:#ffe08a">CACTUC</b><p dir="ltr">@cactuc580</p><button data-act="profile">پروفایل سازنده</button><button data-act="copy">کپی نام کاربری</button><button data-act="share">اشتراک‌گذاری</button><button data-act="close">بستن</button></div>`; document.body.appendChild(d);
    d.addEventListener('click', async e => { const a = e.target && e.target.dataset && e.target.dataset.act; if (e.target === d || a === 'close') { d.classList.remove('open'); return; } if (a === 'profile') { try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.openTelegramLink) Telegram.WebApp.openTelegramLink('https://t.me/cactuc580'); else window.open('https://t.me/cactuc580', '_blank'); } catch (_) { window.open('https://t.me/cactuc580', '_blank'); } } if (a === 'copy') { try { await navigator.clipboard.writeText('@cactuc580'); alert('نام کاربری کپی شد'); } catch (_) { prompt('کپی کن', '@cactuc580'); } } if (a === 'share') { const u = 'https://t.me/cactuc580'; try { if (navigator.share) await navigator.share({ title: 'VIP. CACTUC', url: u }); else window.location.href = 'https://t.me/share/url?url=' + encodeURIComponent(u); } catch (_) {} } });
  }
  function isBoardVisible() {
    const isFk = /fiskoot\.html/i.test(location.pathname);
    if (isFk) { const menu = $('#menu'), lobby = $('#lobby'); return !!menu && getComputedStyle(menu).display !== 'none' && (!lobby || getComputedStyle(lobby).display === 'none') && !document.body.classList.contains('in-game'); }
    const active = $('.scr.on'); return !active || ['menu','join','invite','guideChoice','guideFk','guide','about'].includes(active.id);
  }
  function updateButtonVisibility() { const b = $('#cactucProfileButton'); if (b) b.style.display = isBoardVisible() ? '' : 'none'; }
  function showReaction(d) {
    if (!d || !d.emoji || !Number.isInteger(Number(d.seat))) return;
    const isFk = /fiskoot\.html/i.test(location.pathname);
    let target = document.querySelector(`[data-seat="${Number(d.seat)}"]`);
    if (!target && !isFk) target = document.querySelector(`.st.p${Number(d.seat)}`);
    if (!target && isFk) target = document.querySelector('#tbl');
    if (!target) target = document.querySelector('#tbl') || document.querySelector('#board') || document.querySelector('#game');
    if (!target) return;
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    const old = target.querySelector(':scope > .cactuc-reaction-float'); if (old) old.remove();
    const f = document.createElement('span'); f.className = 'cactuc-reaction-float'; f.textContent = d.emoji; f.setAttribute('aria-hidden','true'); target.appendChild(f); setTimeout(() => f.remove(), 1600);
  }
  function init() {
    addStyle(); makeModal(); ownerMenu();
    if (!$('#cactucProfileButton')) { const b = document.createElement('button'); b.id = 'cactucProfileButton'; b.type = 'button'; b.textContent = '👤 پروفایل من'; b.addEventListener('click', openProfile); document.body.appendChild(b); }
    document.querySelectorAll('[data-owner], .brandId').forEach(a => a.addEventListener('click', e => { e.preventDefault(); ownerMenu(); $('#cactucOwnerMenu').classList.add('open'); }));
    updateButtonVisibility();
    const mo = new MutationObserver(updateButtonVisibility); mo.observe(document.body, {subtree:true, attributes:true, attributeFilter:['class','style']});
    const p = read(); if (!p || !p.complete || !p.avatar || !p.name) setTimeout(openProfile, 250);
  }
  window.CProfile = { payload, name, get, read, open: openProfile };
  window.openMyProfile = openProfile;
  window.showCactucReaction = showReaction;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
