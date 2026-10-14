/* پروفایل، آواتار، واکنش‌های زنده، حلقه حاکم/میر، ویبره و انیمیشن ایموجی - بخش ۱ */
(function () {
  const GAME = (typeof PAGE_GAME !== 'undefined') ? PAGE_GAME : (location.pathname.indexOf('fiskoot') >= 0 ? 'fk' : 'mf');
  const EMO = ['😂', '😆', '😮', '👏', '😎', '💣'];
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } },
    del: k => { try { localStorage.removeItem(k); } catch (e) { } }
  };
  const tgUser = () => { try { return Telegram.WebApp.initDataUnsafe.user || null; } catch (e) { return null; } };
  const $$ = id => document.getElementById(id);
  const S = { avs: {}, rx: {}, last: 0, avKey: '' };
  const hasSt = () => typeof st !== 'undefined' && st;
  const hasSk = () => typeof sk !== 'undefined' && sk;

  const css = document.createElement('style');
  css.textContent = `
  .st, .seat{background:transparent !important;border:none !important;box-shadow:none !important;padding:2px 4px !important;min-width:auto !important;}
  .av{width:42px !important;height:42px !important;border-radius:50% !important;object-fit:cover;border:2px solid #f0b64a !important;background:#0b1f1e;flex:none;display:block;margin:0 auto 4px auto !important;font-size:15px;line-height:38px;text-align:center;color:#ffd76a;font-weight:800;box-shadow:0 0 10px rgba(0,0,0,0.5) !important}
  .st.is-ruler .av, .seat.is-ruler .av, .st.ruler .av, .seat.ruler .av{border:3px solid #ffd700 !important;box-shadow:0 0 14px #ffd700 !important;}
  .rsv{padding-bottom:20px!important}
  #rxBar{position:fixed;z-index:70;display:none;gap:2px;background:#000b;border-radius:20px;padding:2px 6px;direction:ltr;transform:translateX(-50%);box-shadow:0 2px 8px #0008}
  #rxBar button{background:none;border:0;font-size:16px;line-height:1;padding:2px 4px;margin:0;color:#fff;min-width:0;width:auto;border-radius:8px}
  #rxBar button:active{background:#ffffff33}
  #rxBar.cd{opacity:.45;pointer-events:none}
  .rxb{position:fixed;z-index:9990;font-size:26px;line-height:1;pointer-events:none;transform:translate(-50%,-30%);animation:floatSlow 5s cubic-bezier(0.25,1,0.5,1) forwards !important;}
  .rxb.out{opacity:0;transition:opacity .4s}
  .rxb.bomb{animation:floatSlow 5s cubic-bezier(0.25,1,0.5,1) forwards, rxs .5s infinite alternate}
  @keyframes floatSlow {
    0% { opacity: 0; transform: translate(-50%, 10px) scale(0.6); }
    15% { opacity: 1; transform: translate(-50%, -20px) scale(1.1); }
    75% { opacity: 1; transform: translate(-50%, -50px) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -80px) scale(0.8); }
  }
  @keyframes rxs{from{transform:translate(-50%,-30%) rotate(-12deg)}to{transform:translate(-50%,-30%) rotate(12deg)}}
  .sbx{position:fixed;inset:0;z-index:100001;background:#000c;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl}
  .sbx .bx{background:#12382a;border:2px solid #f0b64a;border-radius:18px;padding:18px;width:100%;max-width:340px;text-align:center;color:#fff;line-height:1.8}
  .sbx h3{margin:0 0 6px;color:#ffd76a;font-size:18px}
  .sbx .pfav{width:84px;height:84px;border-radius:50%;margin:8px auto;border:3px solid #f0b64a;background:#0b1f1e;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:34px;color:#ffd76a}
  .sbx .pfav img{width:100%;height:100%;object-fit:cover}
  .sbx input[type=text]{width:100%;padding:11px;border-radius:12px;border:2px solid #ffffff44;background:#0b1f1e;color:#fff;font:inherit;text-align:center;margin:6px 0}
  .sbx button{font:inherit;border:0;border-radius:12px;padding:9px 14px;margin:4px;background:#2d5a55;color:#fff;font-size:14px}
  .sbx button.go{background:#f0b64a;color:#222;font-weight:800}
  .sbx .pid{font-size:12px;color:#9fcfc0;direction:ltr;user-select:text;-webkit-user-select:text}
  .sbx .row{display:flex;justify-content:center;flex-wrap:wrap}
  #sToast{position:fixed;top:78px;left:50%;transform:translateX(-50%);z-index:100002;background:#000d;color:#ffd76a;border-radius:12px;padding:8px 16px;font-size:13px;font-family:Vazirmatn,Tahoma,sans-serif;display:none;max-width:90%;text-align:center}
  `;
  document.head.appendChild(css);

  function toast(t) {
    let e = $$('sToast'); if (!e) { e = document.createElement('div'); e.id = 'sToast'; document.body.appendChild(e); }
    e.textContent = t; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => e.style.display = 'none', 2600);
  }
  function ask(text, cb) {
    const d = document.createElement('div'); d.className = 'sbx';
    d.innerHTML = `<div class="bx"><div>${text}</div><div class="row"><button class="go">قبول</button><button>رد</button></div></div>`;
    const b = d.querySelectorAll('button'); b[0].onclick = () => { d.remove(); cb(true); }; b[1].onclick = () => { d.remove(); cb(false); };
    document.body.appendChild(d);
  }

  function profile() {
    const u = tgUser();
    const name = (ls.get('pf_name') || ls.get('nm') || (u && u.first_name) || '').slice(0, 14);
    const photo = ls.get('pf_photo') || (u && u.photo_url) || '';
    return { name, photo, user: u };
  }
  function syncNames(n) {
    ls.set('nm', n); ls.set('fk_nm', n);
    ['nm', 'invNm'].forEach(id => { const e = $$(id); if (e) e.value = n; });   }   function fileToAvatar(file, cb) {     const r = new FileReader();     r.onload = () => {       const im = new Image();       im.onload = () => {         const c = document.createElement('canvas'); c.width = c.height = 72;         const x = c.getContext('2d'), s = Math.min(im.width, im.height);         x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 72, 72);         cb(c.toDataURL('image/jpeg', 0.72));       };       im.src = r.result;     };     r.readAsDataURL(file);   }   function openProfile(first) {     if ($$('pfBox')) return;
    const p = profile(), u = p.user; let photo = p.photo;
    const d = document.createElement('div'); d.className = 'sbx'; d.id = 'pfBox';
    const idLine = u ? `<div class="pid">${u.username ? '@' + u.username + ' · ' : ''}ID: ${u.id}</div>` : '';
    d.innerHTML = `<div class="bx"><h3>${first ? 'پروفایلت را کامل کن' : 'پروفایل من'}</h3>
      <div class="pfav" id="pfImg"></div>
      <div class="row"><button id="pfPick">📷 انتخاب عکس</button><button id="pfDel">حذف عکس</button></div>
      <input id="pfName" type="text" maxlength="14" placeholder="اسمت" value="">
      ${idLine}
      <div class="row"><button class="go" id="pfOk">تأیید</button><button id="pfX">بستن</button></div>
      <input type="file" accept="image/*" id="pfFile" style="display:none"></div>`;
    document.body.appendChild(d);
    const img = $$('pfImg'), setImg = () => { img.innerHTML = photo ? `<img src="${photo}">` : '👤'; };
    setImg(); $$('pfName').value = p.name;     $$('pfPick').onclick = () => $$('pfFile').click();$$('pfFile').onchange = e => { const f = e.target.files && e.target.files[0]; if (f) fileToAvatar(f, v => { photo = v; setImg(); }); };
    $$('pfDel').onclick = () => { photo = (u && u.photo_url) \vert{}\vert{} ''; ls.del('pf_photo'); setImg(); };     const close = () => { ls.set('pf_seen', '1'); d.remove(); };     $$
('pfX').onclick = close;
    $$('pfOk').onclick = () => {       const n = ($$
('pfName').value || '').trim().slice(0, 14);
      if (n) { ls.set('pf_name', n); syncNames(n); }
      if (photo && photo.indexOf('data:') === 0) ls.set('pf_photo', photo);
      S.sendAv(true); close(); toast('پروفایل ذخیره شد');
    };
  }

   S.sendAv = function (force) {
    if (!hasSk() || !hasSt() || !st.code || st.isSpec) return;
    let av = profile().photo || ''; if (av.length > 6500) av = '';
    const key = st.code + '|' + st.me + '|' + av.length + av.slice(-12);
    if (!force && key === S.avKey) return;
    S.avKey = key; sk.emit('av', av);
  };
  const seatEl = (s, k) => { const r = (k - s.me + 4) % 4; return GAME === 'mf' ? document.querySelector('#tbl .st.p' + r) : $$('s' + r); };      function avatarEl(k, x, sObj) {     const src = S.avs[k];     const el = document.createElement('div'); el.className = 'av';     if (src) {       const img = document.createElement('img'); img.src = src; img.style.cssText = 'width:100\%;height:100\%;border-radius:50\%;object-fit:cover;display:block;';       el.appendChild(img);     } else {       el.textContent = x.bot ? '🤖' : (String(x.name \vert{}\vert{} x.n \vert{}\vert{} '?').trim()[0] \vert{}\vert{} '?');     }     if (sObj) {       const isRuler = (GAME === 'fk' && sObj.g && sObj.g.hk === k) \vert{}\vert{} (GAME === 'mf' && sObj.g && sObj.g.dealer === k);       if (isRuler) el.style.border = '3px solid #ffd700';     }     return el;   }    function ensureBar() {     let b = $$('rxBar');
    if (!b) {
      b = document.createElement('div'); b.id = 'rxBar';
      b.innerHTML = EMO.map((e, i) => `<button data-i="${i}">${e}</button>`).join('');
      b.addEventListener('click', ev => { const t = ev.target.closest('button'); if (t) S.react(+t.dataset.i); });
      document.body.appendChild(b);
    }
    return b;
  }
  
  S.react = function (i) {
    if (!hasSk() || Date.now() - S.last < 1600) return;
    S.last = Date.now(); sk.emit('react', i);
    const b = $$('rxBar'); if (b) { b.classList.add('cd'); setTimeout(() => b.classList.remove('cd'), 1600); }
  };
  
  function placeRx(rec) {
    if (!hasSt()) return; const e = seatEl(st, rec.seat);
    if (!e) { rec.el.style.display = 'none'; return; }
    const r = e.getBoundingClientRect(); rec.el.style.display = '';
    rec.el.style.left = (r.left + r.width / 2) + 'px'; rec.el.style.top = (r.top + r.height * 0.3) + 'px';
  }
  
  S.showRx = function (seat, k) {
    if (!(k >= 0 && k < 6)) return;
    const old = S.rx[seat]; if (old) { clearTimeout(old.t1); clearTimeout(old.t2); clearTimeout(old.t3); old.el.remove(); }
    const el = document.createElement('div'); el.className = 'rxb' + (k === 5 ? ' bomb' : ''); el.textContent = EMO[k];
    document.body.appendChild(el);
    const rec = { el, seat }; S.rx[seat] = rec; placeRx(rec);
    rec.t1 = setTimeout(() => el.classList.add('out'), 4600);
    rec.t2 = setTimeout(() => { el.remove(); if (S.rx[seat] === rec) delete S.rx[seat]; }, 5000);
    if (k === 5) rec.t3 = setTimeout(() => { el.textContent = '💥'; }, 4000);
  };

  function checkVibrateOnPlay(s) {
    try {
      if (!s || !s.g || !s.g.trick || s.g.trick.length < 2) return;
      const trick = s.g.trick;
      if (trick.length === 2) {
        const leadSuit = Math.floor(trick[0].c / (GAME === 'fk' ? 20 : 13));
        const secondSuit = Math.floor(trick[1].c / (GAME === 'fk' ? 20 : 13));
        if (leadSuit !== secondSuit) {
          if (navigator.vibrate) navigator.vibrate(70);
        }
      }
    } catch(e) {}
  }

  S.afterDraw = function (s) {
    s = s || (hasSt() ? st : null); if (!s || !s.seats) return;
    checkVibrateOnPlay(s);
    for (let k = 0; k < 4; k++) {
      const e = seatEl(s, k), x = s.seats[k]; if (!e || !x) continue;
      const oldAv = e.querySelector('.av'); if (oldAv) oldAv.remove();
      e.insertBefore(avatarEl(k, x, s), e.firstChild);
    }
    const bar = ensureBar(), meEl = s.isSpec ? null : seatEl(s, s.me), inGame = GAME === 'mf' ? !!s.g : s.ph !== 'lobby';
    if (meEl && inGame) {
      meEl.classList.add('rsv');
      const r = meEl.getBoundingClientRect();
      bar.style.left = (r.left + r.width / 2) + 'px'; bar.style.top = (r.bottom - 24) + 'px'; bar.style.display = 'flex';
    } else bar.style.display = 'none';
    Object.keys(S.rx).forEach(k => placeRx(S.rx[k]));
  };
  window.addEventListener('resize', () => { if (hasSt()) S.afterDraw(st); });

  S.swap = function (j) { if (hasSk()) { sk.emit('swap', j); toast('درخواست تعویض جا فرستاده شد'); } };

  if (hasSk()) {
    sk.on('avs', m => { S.avs = m || {}; if (hasSt()) { document.querySelectorAll('.av').forEach(a => a.remove()); S.afterDraw(st); } });
    sk.on('react', d => { if (d) S.showRx(d.s, d.k); });
    sk.on('swapAsk', d => ask(`${d.name} می‌خواهد جایش را با تو عوض کند. قبول می‌کنی؟`, ok => sk.emit('swapAns', ok)));
    sk.on('swapDone', () => toast('جاها عوض شد'));
  }

  const BOT_ID = '@cactuc580', BOT_LINK = 'https://t.me/cactuc580';
  function openLink(u) { try { Telegram.WebApp.openTelegramLink(u); } catch (e) { window.open(u, '_blank'); } }
  function copy(t, msg) {
    const done = () => toast(msg || 'کپی شد');
    const fb = () => { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { toast(t); } a.remove(); };
    try { navigator.clipboard.writeText(t).then(done, fb); } catch (e) { fb(); }
  }
  function shareBot() {
    fetch('/config').then(r => r.json()).catch(() => ({})).then(c => {
      const l = c && c.bot ? 'https://t.me/' + c.bot : location.origin;
      openLink('https://t.me/share/url?url=' + encodeURIComponent(l) + '&text=' + encodeURIComponent('بیا بازی منفی و حکم (فیسکوت) را با هم بازی کنیم! 🃏♠️'));
    });
  }
  function popup(html, extra) {
    const d = document.createElement('div'); d.className = 'sbx'; if (extra) d.id = extra;
    d.innerHTML = `<div class="bx">${html}</div>`;
    d.addEventListener('click', e => { if (e.target === d) d.remove(); });
    document.body.appendChild(d); return d;
  }
  S.idMenu = function () {
    document.querySelectorAll('.idm').forEach(x => x.remove());
    const d = popup(`<h3>${BOT_ID}</h3><div class="pid" style="font-size:13px">نــوید = Cactuc</div>
      <div class="col"><button class="go" data-a="p">👤 رفتن به پروفایل</button><button data-a="c">📋 کپی نام کاربری</button><button data-a="s">🔗 اشتراک‌گذاری</button><button data-a="x">بستن</button></div>`);
    d.classList.add('idm');
    d.querySelector('.col').addEventListener('click', e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'p') openLink(BOT_LINK);
      else if (a === 'c') copy(BOT_ID, 'آیدی ' + BOT_ID + ' کپی شد');
      else if (a === 's') openLink('https://t.me/share/url?url=' + encodeURIComponent(BOT_LINK) + '&text=' + encodeURIComponent('آیدی سازندهٔ ربات: ' + BOT_ID));
      if (a === 'x' || a === 'p' || a === 's') d.remove();
    });
  };

  const GUIDE = {
    mf: `<b>♠ بازی منفی</b><br>• ۴ نفر، دو تیم دونفره؛ هم‌تیمی‌ها روبه‌روی هم می‌نشینند.<br>• هر دست، هر نفر می‌گوید چند دست می‌گیرد (ادعا). آخرین نفر (میر) ادعای باقی‌مانده را می‌گیرد تا جمع همه ۱۳ شود؛ او می‌تواند «قبول» یا «بچرخون» را بزند.<br>• ادعای هر تیم = جمع ادعای دو هم‌تیمی.<br>• پیک حکم است. باید از خال شروع‌شده بازی کنی؛ اگر نداری، هر پری می‌توانی بیندازی. پر را بگیر و روی میز بکش.<br>• تیمی که بیشتر از ادعای خودش دست بگیرد، آن دست را می‌برد. اگر هر دو تیم دقیقاً به ادعایشان برسند، مساوی است.<br>• هر تیمی که به ۵ برد برسد، مسابقه را می‌برد.`,
    fk: `<b>♥ بازی حکم (فیسکوت)</b><br>• ۴ نفر، دو تیم؛ هم‌تیمی روبه‌روی توست.<br>• اول کارت‌ها پشت‌رو می‌آیند؛ هر کس توس (آس) بیاورد حاکم می‌شود.<br>• حاکم ۵ کارت می‌گیرد و رنگ (حکم) را می‌گوید؛ بعد همه به ۱۳ کارت می‌رسند.<br>• باید از خال شروع‌شده بازی کنی؛ نداری، می‌توانی حکم یا خال دیگری بزنی. حکم همهٔ خال‌های دیگر را می‌برد.<br>• هر تیم که به ۷ دست برسد، دست را می‌برد: برد عادی ۱ امتیاز، کت‌فیسی (حاکم ۷–۰ ببرد) ۳ امتیاز، کدرنگ (تیم حاکم هیچ دستی نگیرد) ۷ امتیاز.<br>• اگر تیم حاکم ببرد، حاکم همان می‌ماند، وگرنه به سمت راست می‌چرخد.<br>• اولین تیمی که به ۱۳ امتیاز برسد، مسابقه را می‌برد.`
  };
  S.guideMenu = function () {
    const d = popup(`<h3>📘 راهنما</h3><div class="col"><button class="go" data-g="fk">♥ راهنمای حکم (فیسکوت)</button><button class="go" data-g="mf">♠ راهنمای منفی</button><button data-g="x">بستن</button></div>`);
    d.querySelector('.col').addEventListener('click', e => {
      const g = e.target.dataset.g; if (!g) return; d.remove();
      if (g !== 'x') S.guideText(g);
    });
  };
  S.guideText = function (g) {
    const d = popup(`<div style="text-align:right;font-size:14px;max-height:62vh;overflow:auto">${GUIDE[g]}</div><div class="row" style="margin-top:8px"><button data-g="b">⬅ بازگشت</button><button class="go" data-g="x">فهمیدم</button></div>`);
    d.querySelector('.row').addEventListener('click', e => { const a = e.target.dataset.g; if (!a) return; d.remove(); if (a === 'b') S.guideMenu(); });
  };
  S.about = function () {
    const d = popup(`<h3>ℹ️ درباره ربات</h3><div>🃏 ربات بازی منفی و حکم (فیسکوت)؛ بازی ورق چهارنفره با دوستان یا ربات‌ها.</div>
      <div style="margin-top:8px">طراح: <b>نــوید = Cactuc</b></div>
      <div class="pid" style="font-size:15px;margin:4px 0;cursor:pointer" data-a="id">${BOT_ID}</div>
      <div style="font-size:12px;color:#9fcfc0;margin-top:8px">اگر نیاز به راهنما داری یا چیزی نمی‌فهمی، روی دکمهٔ راهنما کلیک کن ⬇️</div>
      <button class="lnk2" data-a="g">راهنما</button>
      <div class="row"><button data-a="x">بستن</button></div>`);
    d.addEventListener('click', e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'id') S.idMenu(); else if (a === 'g') { d.remove(); S.guideMenu(); } else if (a === 'x') d.remove();
    });
  };

  S.hideEnd = function () { const e = $$('endScr'); if (e) e.remove(); S.endKey = ''; };   S.onState = function (s) {     S.sendAv();     const inG = GAME === 'mf' ? !!s.g : s.ph !== 'lobby';     if (!inG) { const b = $$('rxBar'); if (b) b.style.display = 'none'; }
  };
  
  S.openProfile = openProfile; S.toast = toast; S.profile = profile; S.ask = ask;
  window.SOC = S;
  const spectating = /[?&](w|watch)=/.test(location.search);
  const p0 = profile(); if (p0.name) syncNames(p0.name);
  if (!ls.get('pf_seen') && !spectating) setTimeout(() => openProfile(true), 500);
})();
