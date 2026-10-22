/* پروفایل، آواتار، واکنش‌های زنده و تعویض جا — مشترک بین «منفی» و «حکم (فیسکوت)» */
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

  /* ---------- استایل‌ها ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .av{width:26px;height:26px;border-radius:50%;object-fit:cover;border:2px solid #f0b64a;background:#0b1f1e;flex:none;display:block;margin:0 auto 2px;font-size:13px;line-height:22px;text-align:center;color:#ffd76a;font-weight:800}
  .rsv{padding-bottom:32px!important}
  #rxBar{position:fixed;z-index:70;display:none;gap:1px;background:#000b;border-radius:14px;padding:1px 4px;direction:ltr;transform:translateX(-50%);box-shadow:0 2px 8px #0008}
  #rxBar button{background:none;border:0;font-size:19px;line-height:1;padding:3px 3px;margin:0;color:#fff;min-width:0;width:auto;border-radius:8px}
  #rxBar button:active{background:#ffffff33}
  #rxBar.cd{opacity:.45;pointer-events:none}
  .rxb{position:fixed;z-index:9990;font-size:34px;line-height:1;pointer-events:none;transform:translate(-50%,-30%);filter:drop-shadow(0 2px 6px #000b);animation:rxp .35s cubic-bezier(.2,1.6,.4,1)}
  .rxb.out{opacity:0;transition:opacity .4s}
  .rxb.bomb{animation:rxp .35s cubic-bezier(.2,1.6,.4,1),rxs .5s .35s infinite alternate}
  @keyframes rxp{from{transform:translate(-50%,-30%) scale(.2);opacity:0}to{transform:translate(-50%,-30%) scale(1);opacity:1}}
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

  /* ---------- پیام کوچک و پنجرهٔ پرسش ---------- */
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

  /* ---------- پروفایل ---------- */
  function profile() {
    const u = tgUser();
    const name = (ls.get('pf_name') || ls.get('nm') || (u && u.first_name) || '').slice(0, 14);
    const photo = ls.get('pf_photo') || (u && u.photo_url) || '';
    return { name, photo, user: u };
  }
  function syncNames(n) {
    ls.set('nm', n); ls.set('fk_nm', n);
    ['nm', 'invNm'].forEach(id => { const e = $$(id); if (e) e.value = n; });
  }
  function fileToAvatar(file, cb) {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas'); c.width = c.height = 72;
        const x = c.getContext('2d'), s = Math.min(im.width, im.height);
        x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 72, 72);
        cb(c.toDataURL('image/jpeg', 0.72));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }
  function openProfile(first) {
    if ($$('pfBox')) return;
    const p = profile(), u = p.user; let photo = p.photo;
    const d = document.createElement('div'); d.className = 'sbx'; d.id = 'pfBox';
    const idLine = u ? `<div class="pid">${u.username ? '@' + u.username + ' · ' : ''}ID: ${u.id}</div>` : '';
    d.innerHTML = `<div class="bx"><h3>${first ? 'پروفایلت را کامل کن' : 'پروفایل من'}</h3>${first ? '<div style="font-size:12px;color:#9fcfc0">برای ورود به بازی، اسم و عکس لازم است</div>' : ''}
      <div class="pfav" id="pfImg"></div>
      <div class="row"><button id="pfPick">📷 انتخاب عکس</button><button id="pfDel">حذف عکس</button></div>
      <input id="pfName" type="text" maxlength="14" placeholder="اسمت" value="">
      ${idLine}
      <div class="row"><button class="go" id="pfOk">تأیید</button>${first ? '' : '<button id="pfX">بستن</button>'}</div>
      <input type="file" accept="image/*" id="pfFile" style="display:none"></div>`;
    document.body.appendChild(d);
    const img = $$('pfImg'), setImg = () => { img.innerHTML = photo ? `<img src="${photo}">` : '👤'; };
    setImg(); $$('pfName').value = p.name;
    $$('pfPick').onclick = () => $$('pfFile').click();
    $$('pfFile').onchange = e => { const f = e.target.files && e.target.files[0]; if (f) fileToAvatar(f, v => { photo = v; setImg(); }); };
    $$('pfDel').onclick = () => { photo = (u && u.photo_url) || ''; ls.del('pf_photo'); setImg(); };
    const close = () => { ls.set('pf_ok', '1'); d.remove(); };
    if ($$('pfX')) $$('pfX').onclick = close;
    $$('pfOk').onclick = () => {
      const n = ($$('pfName').value || '').trim().slice(0, 14);
      if (!n) { toast('اسمت را بنویس'); return; }
      if (!photo) { toast('یک عکس برای پروفایلت انتخاب کن'); return; }
      ls.set('pf_name', n); syncNames(n);
      if (photo && photo.indexOf('data:') === 0) ls.set('pf_photo', photo);
      S.sendAv(true); close(); toast('پروفایل ذخیره شد');
    };
  }

  /* ---------- آواتار بازیکن‌ها ---------- */
  S.sendAv = function (force) {
    if (!hasSk() || !hasSt() || !st.code || st.isSpec) return;
    let av = profile().photo || ''; if (av.length > 6500) av = '';
    const key = st.code + '|' + st.me + '|' + av.length + av.slice(-12);
    if (!force && key === S.avKey) return;
    S.avKey = key; sk.emit('av', av);
  };
  const seatEl = (s, k) => { if (GAME === 'ld') return $$('ps' + k); const r = (k - s.me + 4) % 4; return GAME === 'mf' ? document.querySelector('#tbl .st.p' + r) : $$('s' + r); };
  function avatarEl(k, x) {
    const src = S.avs[k];
    if (src) { const i = document.createElement('img'); i.className = 'av'; i.src = src; return i; }
    const s = document.createElement('div'); s.className = 'av'; s.textContent = (x.bot || x.b) ? '🤖' : (String(x.name || x.n || '?').trim()[0] || '?');
    return s;
  }
  function ensureBar() {
    let b = $$('rxBar');
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
    rec.el.style.left = (r.left + r.width / 2) + 'px'; rec.el.style.top = (r.top + 2) + 'px';
  }
  S.showRx = function (seat, k) {
    if (!(k >= 0 && k < 6)) return;
    const old = S.rx[seat]; if (old) { clearTimeout(old.t2); clearTimeout(old.t3); old.el.remove(); }
    const el = document.createElement('div'); el.className = 'rxb'; el.innerHTML = '<span class="rxi t' + k + '">' + EMO[k] + '</span>';
    document.body.appendChild(el);
    const rec = { el, seat }; S.rx[seat] = rec; placeRx(rec);
    rec.t2 = setTimeout(() => { el.remove(); if (S.rx[seat] === rec) delete S.rx[seat]; }, 5100);
    if (k === 5) rec.t3 = setTimeout(() => { const x = el.firstChild; if (x) x.textContent = '💥'; }, 3800);
  };
  S.afterDraw = function (s) {
    s = s || (hasSt() ? st : null); if (!s || !s.seats) return;
    for (let k = 0; k < 4; k++) {
      const e = seatEl(s, k), x = s.seats[k]; if (!e || !x) continue;
      if (!e.querySelector('.av')) { const a = avatarEl(k, x), nb = GAME === 'ld' ? e.querySelector('b') : null; e.insertBefore(a, nb || e.firstChild); }
    }
    Object.keys(S.rx).forEach(k => placeRx(S.rx[k]));
  };
  window.addEventListener('resize', () => { if (hasSt()) S.afterDraw(st); });

  /* ---------- تعویض جا در لابی ---------- */
  S.swap = function (j) { if (hasSk()) { sk.emit('swap', j); toast('درخواست تعویض جا فرستاده شد'); } };

  /* ---------- اتصال به سرور ---------- */
  if (hasSk()) {
    sk.on('avs', m => { S.avs = m || {}; if (hasSt()) { document.querySelectorAll('.av').forEach(a => a.remove()); S.afterDraw(st); } });
    sk.on('swapAsk', d => ask(`${d.name} می‌خواهد جایش را با تو عوض کند. قبول می‌کنی؟`, ok => sk.emit('swapAns', ok)));
    sk.on('swapDone', () => toast('جاها عوض شد'));
  }

  /* ---------- ابزارها: لینک، کپی، اشتراک ---------- */
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
      openLink('https://t.me/share/url?url=' + encodeURIComponent(l) + '&text=' + encodeURIComponent('بیا بازی منفی، حکم (فیسکوت) و لودو را با هم بازی کنیم! 🃏🎲'));
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

  /* ---------- راهنما ---------- */
  const GUIDE = {
    mf: `<b>♠ بازی منفی</b><br>• ۴ نفر، دو تیم دونفره؛ هم‌تیمی‌ها روبه‌روی هم می‌نشینند.<br>• هر دست، هر نفر می‌گوید چند دست می‌گیرد (ادعا). آخرین نفر (میر) ادعای باقی‌مانده را می‌گیرد تا جمع همه ۱۳ شود؛ او می‌تواند «قبول» یا «بچرخون» را بزند.<br>• ادعای هر تیم = جمع ادعای دو هم‌تیمی.<br>• پیک حکم است. باید از خال شروع‌شده بازی کنی؛ اگر نداری، هر پری می‌توانی بیندازی. پر را بگیر و روی میز بکش.<br>• تیمی که بیشتر از ادعای خودش دست بگیرد، آن دست را می‌برد. اگر هر دو تیم دقیقاً به ادعایشان برسند، مساوی است.<br>• هر تیمی که به ۵ برد برسد، مسابقه را می‌برد.`,
    ld: `<b>🎲 لودو</b><br>• ۲، ۳ یا ۴ نفر؛ هر نفر ۴ مهره‌ی رنگ خودش را دارد. در بازی ۲ نفره حریف‌ها گوشه‌های روبه‌رو را می‌گیرند.<br>• تاس را بزن؛ با ۶ مهره از خانه بیرون می‌آید.<br>• مهره‌ها را دور تخته بچرخان؛ اگر روی مهره‌ی حریف بیفتی (به‌جز خانه‌های شروع و ستاره‌ها ★) آن مهره به خانه برمی‌گردد.<br>• ۶، زدن مهره و رساندن مهره به وسط، یک تاس دوباره می‌دهد؛ سه ۶ پشت‌سرهم نوبت را می‌سوزاند.<br>• برای رسیدن به وسط باید تاس دقیق بیاید.<br>• هر کس هر ۴ مهره‌اش را به وسط برساند تمام می‌کند: اول 👑، دوم 🥈، سوم 🥉. بازی ادامه دارد تا یک نفر بماند و او بازنده است.`,
    fk: `<b>♥ بازی حکم (فیسکوت)</b><br>• ۴ نفر، دو تیم؛ هم‌تیمی روبه‌روی توست.<br>• اول کارت‌ها پشت‌رو می‌آیند؛ هر کس توس (آس) بیاورد حاکم می‌شود.<br>• حاکم ۵ کارت می‌گیرد و رنگ (حکم) را می‌گوید؛ بعد همه به ۱۳ کارت می‌رسند.<br>• باید از خال شروع‌شده بازی کنی؛ نداری، می‌توانی حکم یا خال دیگری بزنی. حکم همهٔ خال‌های دیگر را می‌برد.<br>• هر تیم که به ۷ دست برسد، دست را می‌برد: برد عادی ۱ امتیاز، کت‌فیسی (حاکم ۷–۰ ببرد) ۳ امتیاز، کدرنگ (تیم حاکم هیچ دستی نگیرد) ۷ امتیاز.<br>• اگر تیم حاکم ببرد، حاکم همان می‌ماند، وگرنه به سمت راست می‌چرخد.<br>• اولین تیمی که به ۱۳ امتیاز برسد، مسابقه را می‌برد.`
  };
  S.guideMenu = function () {
    const d = popup(`<h3>📘 راهنما</h3><div class="col"><button class="go" data-g="fk">♥ راهنمای حکم (فیسکوت)</button><button class="go" data-g="mf">♠ راهنمای منفی</button><button class="go" data-g="ld">🎲 راهنمای لودو</button><button data-g="x">بستن</button></div>`);
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
    const d = popup(`<h3>ℹ️ درباره ربات</h3><div>🃏 ربات بازی منفی، حکم (فیسکوت) و لودو؛ بازی با دوستان یا ربات‌ها.</div>
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

  /* ---------- پایان مسابقه: برندگان، بازندگان، آتش‌بازی ---------- */
  function endInfo(s) {
    if (!s) return null;
    if (GAME === 'mf' && s.g && s.g.phase === 'series') { const t = s.g.ser[0] >= 5 ? 0 : 1; return { win: t, a: s.g.ser[t], b: s.g.ser[1 - t], key: s.code + '|mf|' + s.g.ser.join('-'), unit: 'سری' }; }
    if (GAME === 'fk' && s.ph === 'over' && s.res) { const t = s.res.w; return { win: t, a: s.sc[t], b: s.sc[1 - t], key: s.code + '|fk|' + s.sc.join('-'), unit: 'امتیاز' }; }
    if (GAME === 'ld' && s.ph === 'over' && s.rank && s.rank.length > 1) return { ld: true, key: s.code + '|ld|' + s.rank.join('') };
    return null;
  }
  const nameOf = x => (x && (x.name || x.n)) || 'بازیکن';
  function avHTML(k, x, big) {
    const src = S.avs[k], sz = big ? 68 : 44;
    const st1 = `width:${sz}px;height:${sz}px;border-radius:50%;border:3px solid ${big ? '#ffd76a' : '#ffffff55'};object-fit:cover;background:#0b1f1e;display:flex;align-items:center;justify-content:center;font-size:${sz / 2}px;color:#ffd76a;margin:0 auto`;
    return src ? `<img src="${src}" style="${st1};display:block">` : `<div style="${st1}">${x && (x.bot || x.b) ? '🤖' : (nameOf(x)[0] || '?')}</div>`;
  }
  function fireworks(cv, stopAt) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), P = [], cf = [], cols = ['#ffd76a', '#ff5d5d', '#5ee08a', '#6fb7ff', '#ff7be5', '#ffffff'];
    let W, H, last = 0, nextB = 0;
    const rs = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; rs();
    const burst = () => { const x = W * (0.15 + Math.random() * 0.7), y = H * (0.12 + Math.random() * 0.4), col = cols[Math.random() * cols.length | 0]; for (let i = 0; i < 48; i++) { const a = Math.random() * 6.283, v = 1.5 + Math.random() * 4; P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c: col }); } };
    const conf = () => { cf.push({ x: Math.random() * W, y: -10, vy: 1.5 + Math.random() * 2.5, vx: (Math.random() - .5) * 1.5, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.random() * cols.length | 0] }); };
    function frame(t) {
      if (!cv.isConnected) return;
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'lighter';
      const live = t < stopAt;
      if (live && t > nextB) { burst(); nextB = t + 500 + Math.random() * 350; }
      if (live && cf.length < 70 && Math.random() < .5) conf();
      for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx; p.y += p.vy; p.vy += .05; p.vx *= .985; p.l -= .016; if (p.l <= 0) { P.splice(i, 1); continue; } c.globalAlpha = p.l; c.fillStyle = p.c; c.fillRect(p.x, p.y, 3, 3); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      for (let i = cf.length - 1; i >= 0; i--) { const q = cf[i]; q.x += q.vx; q.y += q.vy; q.r += q.vr; if (q.y > H + 10) { if (live) { q.y = -10; q.x = Math.random() * W; } else cf.splice(i, 1); continue; } c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillStyle = q.c; c.fillRect(-3, -2, 7, 4); c.restore(); }
      if (live || P.length || cf.length) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  S.hideEnd = function () { const e = $$('endScr'); if (e) e.remove(); S.endKey = ''; };
  function showEnd(s, i) {
    S.hideEnd(); S.endKey = i.key;
    const win = [], lose = [];
    for (let k = 0; k < 4; k++) (k % 2 === i.win ? win : lose).push(k);
    const card = (k, big) => { const x = s.seats[k]; return `<div style="flex:1;text-align:center">${avHTML(k, x, big)}<div style="font-weight:800;margin-top:4px;font-size:${big ? 17 : 14}px;color:${big ? '#ffd76a' : '#e8e8e8'}">${nameOf(x)}</div></div>`; };
    const d = document.createElement('div'); d.id = 'endScr'; d.className = 'endS ' + (GAME === 'mf' ? 'mfE' : 'fkE');
    d.innerHTML = `<canvas id="endCv"></canvas><div class="endBox">
      <div class="vipH">VIP · CACTUC 🃏♠️</div><div class="vipId" data-a="id">${BOT_ID}</div>
      <div class="endT">🏆 تیم برنده</div><div class="endW">${win.map(k => card(k, true)).join('')}</div>
      <div class="endScore">${i.a} – ${i.b}<small>اختلاف ${i.a - i.b} ${i.unit}</small></div>
      <div class="endT" style="opacity:.8;font-size:13px">بازندگان</div><div class="endL">${lose.map(k => card(k, false)).join('')}</div>
      <div class="endBtns"><button data-a="home">↩ بازگشت به انتخاب بازی</button><button data-a="set">⚙️ تنظیمات</button><button class="go" data-a="again">🔄 شروع مجدد</button><button data-a="share">🔗 اشتراک‌گذاری ربات</button></div></div>`;
    d.addEventListener('click', e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'id') S.idMenu();
      else if (a === 'home') location.href = '/';
      else if (a === 'set') { if (typeof openSettingsModal === 'function') openSettingsModal(); }
      else if (a === 'share') shareBot();
      else if (a === 'again') { if (s.host && hasSk()) sk.emit('again'); else toast('فقط میزبان می‌تواند شروع مجدد بزند'); }
    });
    document.body.appendChild(d);
    fireworks($$('endCv'), performance.now() + 11000);
  }
  function showEndLd(s, i) {
    S.hideEnd(); S.endKey = i.key;
    const rk = s.rank || [], n = rk.length, king = rk[0], loser = rk[n - 1], mids = rk.slice(1, n - 1), MED = ['🥈', '🥉'], LAB = ['نفر دوم', 'نفر سوم'];
    const mid = (k, j) => { const x = s.seats[k]; return `<div class="ldC">${avHTML(k, x, false)}<div class="ldM">${MED[j]}</div><div class="ldN">${nameOf(x)}</div><div class="ldL">${LAB[j]}</div></div>`; };
    const kx = s.seats[king], lx = s.seats[loser];
    const d = document.createElement('div'); d.id = 'endScr'; d.className = 'endS ldE';
    d.innerHTML = `<canvas id="endCv"></canvas><div class="endBox">
      <div class="vipH">VIP · CACTUC 🎲</div><div class="vipId" data-a="id">${BOT_ID}</div>
      <div class="endT">🎲 پایان بازی لودو</div>
      <div class="ldK"><div class="ldCr">👑</div>${avHTML(king, kx, true)}<div class="ldKN">${nameOf(kx)}</div><div class="ldKL">قهرمان · نفر اول</div></div>
      ${mids.length ? `<div class="endW">${mids.map(mid).join('')}</div>` : ''}
      <div class="ldB"><div class="ldBT">💀 بازنده</div><div class="ldBA">${avHTML(loser, lx, false)}</div><div class="ldBN">${nameOf(lx)}</div><div class="ldBL">${n === 2 ? 'نفر دوم' : 'نفر آخر'} · بازی را باخت</div></div>
      <div class="endBtns"><button data-a="home">↩ بازگشت به انتخاب بازی</button><button data-a="set">⚙️ تنظیمات</button><button class="go" data-a="again">🔄 شروع مجدد</button><button data-a="share">🔗 اشتراک‌گذاری ربات</button></div></div>`;
    d.addEventListener('click', e => {
      const a = e.target.dataset.a; if (!a) return;
      if (a === 'id') S.idMenu();
      else if (a === 'home') location.href = '/';
      else if (a === 'set') { if (typeof openSettingsModal === 'function') openSettingsModal(); }
      else if (a === 'share') shareBot();
      else if (a === 'again') { if (hasSt() && st.host && hasSk()) sk.emit('again'); else toast('فقط میزبان می‌تواند شروع مجدد بزند'); }
    });
    document.body.appendChild(d);
    fireworks($$('endCv'), performance.now() + 11000);
  }
  S.checkEnd = function (s) {
    const i = endInfo(s);
    if (!i) { clearTimeout(S.ldT); S.ldT = null; if (S.endKey) S.hideEnd(); return; }
    if (S.endKey === i.key) return;
    if (i.ld) { if (S.ldT) return; S.ldT = setTimeout(() => { S.ldT = null; const c = hasSt() ? endInfo(st) : null; if (c && c.ld && S.endKey !== c.key) showEndLd(st, c); }, 2600); return; }
    showEnd(s, i);
  };
  S.onState = function (s) {
    S.sendAv(); S.checkEnd(s);
    const inG = GAME === 'mf' ? !!s.g : s.ph !== 'lobby';
    document.body.classList.toggle('ingame', !!inG);
    if (!inG) { const b = $$('rxBar'); if (b) b.style.display = 'none'; }
  };

  /* ---------- ظاهر سه‌بعدی صفحهٔ شروع و کادرها ---------- */
  const svg = enc => `url("data:image/svg+xml,${encodeURIComponent(enc)}")`;
  const pat = svg("<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><g font-size='46' fill='white' opacity='.045'><text x='12' y='56'>♠</text><text x='86' y='60'>♥</text><text x='20' y='128'>♦</text><text x='92' y='134'>♣</text></g></svg>");
  const css7 = document.createElement('style');
  css7.textContent = `
  body.pg-ld #menu.scr{background:radial-gradient(ellipse at 50% -10%,#8a4be0 0%,#2b1163 55%,#0a0420 100%),${pat}}
  body.pg-ld #menu .logo{text-shadow:0 0 22px #c9a0ff99,0 4px 0 #1b0a47}
  body.pg-ld #menu .btn{border-radius:16px;color:#fff;font-weight:700;transition:transform .08s,box-shadow .08s;border:1px solid #ffffff40;background:linear-gradient(#7a46cf,#3b1a85);box-shadow:0 5px 0 #1d0a47,0 12px 20px #000a,inset 0 1px 0 #ffffff66;font-size:13.5px;padding:7px 14px;max-width:270px;min-height:36px}
  body.pg-ld #menu .btn.go{background:linear-gradient(#ffdc7a,#d99a1c);color:#2a1a00;box-shadow:0 5px 0 #7a4e00,0 12px 20px #000a,inset 0 1px 0 #ffffffaa}
  body.pg-ld #menu .btn:active{transform:translateY(4px);box-shadow:0 1px 0 #00000088,0 4px 8px #000a,inset 0 1px 0 #ffffff55}
  .ldE{background:radial-gradient(ellipse at 50% 0%,#5b2cb0,#10062c 72%)}
  .ldK{position:relative;margin:26px auto 0;padding:28px 22px 10px;border-radius:20px;background:linear-gradient(#ffdc7a33,#ffdc7a0d);border:2px solid #ffd76a;box-shadow:0 0 28px #ffd76a88,inset 0 0 18px #ffd76a33;width:100%}
  .ldK>div:not(.ldCr){margin-top:2px}.ldK img,.ldK .ldKav{margin:0 auto}
  .ldCr{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:46px;line-height:1;filter:drop-shadow(0 4px 8px #000b);animation:ldcr 1.4s ease-in-out infinite alternate}
  @keyframes ldcr{from{transform:translateX(-50%) rotate(-8deg) scale(1)}to{transform:translateX(-50%) rotate(8deg) scale(1.12)}}
  .ldKN{font-size:22px;font-weight:900;color:#ffd76a;text-shadow:0 0 12px #ffd76a88}.ldKL{font-size:12px;color:#ffe9a8}
  .ldC{flex:1;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1px}
  .ldM{font-size:26px;line-height:1.1}.ldN{font-weight:800;font-size:14px;color:#e8e8e8}.ldL{font-size:11px;color:#bcd}
  .ldB{margin-top:4px;padding:10px;border-radius:16px;background:#3a0a14aa;border:2px solid #d8382f;box-shadow:0 0 14px #d8382f66}
  .ldBT{font-size:15px;font-weight:900;color:#ff7b7b}.ldBA{filter:grayscale(1) brightness(.8);display:flex;justify-content:center;margin:4px 0}
  .ldBN{font-weight:800;font-size:15px;color:#ffb3ae;text-decoration:line-through;text-decoration-color:#d8382f99}.ldBL{font-size:11px;color:#ff9c94}
  `;
  document.head.appendChild(css7);

  const css2 = document.createElement('style');
  css2.textContent = `
  .vipH{font-weight:900;letter-spacing:.18em;color:#ffd76a;font-size:15px;text-shadow:0 2px 10px #000b}
  .vipId{font-size:11px;letter-spacing:.12em;color:#ffffff99;cursor:pointer;direction:ltr;margin-bottom:6px;-webkit-user-select:text;user-select:text}
  body.pg-mf #menu.scr{background:radial-gradient(ellipse at 50% -10%,#2c5bb8 0%,#0e1d45 55%,#050a18 100%),${pat}}
  body.pg-fk #menu.scr{background:radial-gradient(ellipse at 50% -10%,#24a36d 0%,#0a3a26 55%,#03120b 100%),${pat}}
  body.pg-mf #menu .logo,body.pg-fk #menu .logo{text-shadow:0 0 22px #8ab4ff99,0 4px 0 #07122c}
  body.pg-mf #menu .btn,body.pg-fk #menu .btn{border-radius:16px;color:#fff;font-weight:700;transition:transform .08s,box-shadow .08s;border:1px solid #ffffff40}
  body.pg-mf #menu .btn{background:linear-gradient(#3a62b0,#17346a);box-shadow:0 5px 0 #0a1a3d,0 12px 20px #000a,inset 0 1px 0 #ffffff66}
  body.pg-fk #menu .btn{background:linear-gradient(#2d9a68,#126140);box-shadow:0 5px 0 #06301d,0 12px 20px #000a,inset 0 1px 0 #ffffff66}
  body.pg-mf #menu .btn.go,body.pg-fk #menu .btn.go{background:linear-gradient(#ffdc7a,#d99a1c);color:#2a1a00;box-shadow:0 5px 0 #7a4e00,0 12px 20px #000a,inset 0 1px 0 #ffffffaa}
  body.pg-mf #menu .btn:active,body.pg-fk #menu .btn:active{transform:translateY(4px);box-shadow:0 1px 0 #00000088,0 4px 8px #000a,inset 0 1px 0 #ffffff55}
  .sbx .col{display:flex;flex-direction:column}.sbx .col button{margin:4px 0}
  .sbx .lnk2{background:none;color:#ffd76a;text-decoration:underline;font-size:15px;padding:2px 8px}
  .endS{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;overflow:auto;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;color:#fff}
  .mfE{background:radial-gradient(ellipse at 50% 0%,#24468e,#08122a 70%)}.fkE{background:radial-gradient(ellipse at 50% 0%,#1f8a5c,#062014 70%)}
  #endCv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  .endBox{position:relative;z-index:2;width:100%;max-width:360px;padding:14px;text-align:center;display:flex;flex-direction:column;gap:6px}
  .endT{font-size:16px;font-weight:800;color:#ffd76a;margin-top:4px}
  .endW,.endL{display:flex;gap:10px;justify-content:center}
  .endScore{font-size:30px;font-weight:900;margin:2px 0}.endScore small{display:block;font-size:12px;font-weight:400;color:#cfe}
  .endBtns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
  .endBtns button{font:inherit;font-size:13px;border:1px solid #ffffff44;border-radius:12px;padding:10px 6px;background:#0008;color:#fff;box-shadow:0 3px 0 #0006}
  .endBtns button.go{background:linear-gradient(#ffdc7a,#d99a1c);color:#2a1a00;font-weight:800}
  `;
  document.head.appendChild(css2);

  const css3 = document.createElement('style');
  css3.textContent = `
  .av{width:46px;height:46px;border:3px solid #f0b64a;font-size:20px;line-height:40px;margin:0 auto 1px;box-shadow:0 2px 8px #0009}
  .st,.seat{background:none!important;border:0!important;box-shadow:none!important;padding:2px 4px!important;min-width:0!important;border-radius:0!important}
  .st u,.st b,.st i,.seat div,.seat small,.seat b{text-shadow:0 0 5px #000,0 1px 3px #000}
  .st u{font-size:13px}.st b{font-size:13px}
  .st.on .av,.seat.on .av{box-shadow:0 0 0 2px #fff6,0 0 16px 5px #f0b64acc;border-color:#ffe08a}
  .seat small{font-size:10px}
  #rxBar{padding:0 3px;border-radius:12px;background:#0009}
  #rxBar button{font-size:15px;padding:3px 2px}
  .rxb{position:fixed;z-index:9990;pointer-events:none;transform:translateX(-50%);animation:rxup 5s cubic-bezier(.25,.6,.35,1) forwards}
  @keyframes rxup{0%{transform:translate(-50%,14px) scale(.4);opacity:0}8%{transform:translate(-50%,0) scale(1);opacity:1}78%{opacity:1}100%{transform:translate(-50%,-100px) scale(1);opacity:0}}
  .rxi{display:block;font-size:30px;line-height:1;filter:drop-shadow(0 2px 5px #000b)}
  .rxi.t0{animation:rx0 .3s ease-in-out infinite alternate}.rxi.t1{animation:rx1 .5s ease-in-out infinite alternate}
  .rxi.t2{animation:rx2 .9s ease-in-out infinite alternate}.rxi.t3{animation:rx3 .35s ease-in-out infinite alternate}
  .rxi.t4{animation:rx4 1.1s ease-in-out infinite alternate}.rxi.t5{animation:rx5 .22s ease-in-out infinite alternate}
  @keyframes rx0{from{transform:rotate(-14deg) translateY(0)}to{transform:rotate(14deg) translateY(-5px)}}
  @keyframes rx1{from{transform:scale(1) translateY(0)}to{transform:scale(1.18) translateY(-4px)}}
  @keyframes rx2{from{transform:scale(.9)}to{transform:scale(1.25)}}
  @keyframes rx3{from{transform:scale(1) rotate(-8deg)}to{transform:scale(1.25) rotate(8deg)}}
  @keyframes rx4{from{transform:rotate(-10deg)}to{transform:rotate(10deg)}}
  @keyframes rx5{from{transform:rotate(-18deg) translateX(-2px)}to{transform:rotate(18deg) translateX(2px)}}
  :root{--cw:min(13vw,62px,11.5vh)!important}
  body.pg-mf .st.p0{bottom:30px!important}
  body.pg-fk #s0{bottom:calc(150px + env(safe-area-inset-bottom,0px))!important}
  body.pg-fk #hand .c{width:44px!important;height:64px!important}
  body.pg-fk #hand .c b{font-size:17px!important}body.pg-fk #hand .c i{font-size:19px!important}
  body.pg-fk .mid{width:46px!important;height:66px!important}
  body.pg-mf #menu.scr,body.pg-fk #menu.scr{justify-content:flex-start;padding:8px 18px 10px;gap:7px;overflow-y:auto}
  body.pg-mf #menu .logo,body.pg-fk #menu .logo{font-size:38px;line-height:1.15;margin:0}
  body.pg-mf #menu .sub{font-size:12px;margin:0}
  body.pg-mf #menu h2,body.pg-fk #menu h2{font-size:17px;margin:2px 0}
  #menu .btn{font-size:15px;padding:9px 18px;min-width:0;width:100%;max-width:300px;border-radius:14px}
  body.pg-mf #menu .btn,body.pg-fk #menu .btn{box-shadow:0 4px 0 #0008,0 8px 14px #0008,inset 0 1px 0 #ffffff55}
  #menu input,#lobby input{padding:9px;font-size:14px}
  #menu .credit{margin-top:auto;font-size:11px;gap:1px;line-height:1.5;padding-top:6px}
  #menu #resumeBox{padding:8px;font-size:12px;margin:0}
  #lobby.scr{justify-content:flex-start;padding:10px 16px;gap:6px;overflow-y:auto}
  #lobby .btn{font-size:14px;padding:8px 14px;min-width:0;width:100%;max-width:320px;border-radius:12px}
  #lobby h2{margin:2px 0;font-size:18px}
  #lobby .st,#lobby .sb{padding:8px!important;font-size:14px;margin:3px 0;border:2px dashed #2d5a55!important;border-radius:14px!important;background:#0f2a28!important}
  #lobby .st.me{border:2px solid #f0b64a!important}
  #lobby small{font-size:11px}
  `;
  document.head.appendChild(css3);

  const css4 = document.createElement('style');
  css4.textContent = `
  /* کادر مشکی افکت‌دار: عکس، اسم، ادعا، میر/حاکم */
  .av{width:56px;height:56px;border:3px solid #f0b64a;font-size:24px;line-height:50px;margin:0;flex:none;box-shadow:0 0 10px #f0b64a88}
  .st,.seat{display:flex!important;flex-direction:column!important;align-items:center;gap:2px;padding:5px 8px!important;min-width:78px!important;max-width:108px;
    background:rgba(6,10,14,.8)!important;border:1.5px solid #f0b64a99!important;border-radius:14px!important;
    box-shadow:0 0 12px #f0b64a55,0 4px 10px #000a,inset 0 0 10px #f0b64a22!important}
  .st.on,.seat.on{border-color:#ffe08a!important;box-shadow:0 0 20px 4px #f0b64acc,0 4px 10px #000a,inset 0 0 12px #f0b64a44!important;animation:frmP 1.1s ease-in-out infinite alternate}
  @keyframes frmP{from{filter:brightness(1)}to{filter:brightness(1.25)}}
  .st .av,.seat .av{margin:0}
  .stx{display:flex;flex-direction:column;align-items:center;text-align:center;line-height:1.25}
  .nl{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;font-size:13px;font-weight:700;text-shadow:0 0 4px #000;white-space:nowrap}
  .st u{text-decoration:none;font-size:13px;font-weight:700}
  .st .stx>b{font-size:13px;font-weight:700;text-shadow:0 0 4px #000}
  .st i,.seat i.bd{position:static!important;display:inline-block;margin:0;font-style:normal;font-size:10.5px;font-weight:700;padding:0 7px;border-radius:8px;background:#f0b64a;color:#2a1a00;text-shadow:none;transform:none!important;line-height:1.5}
  .st i.o,.seat i.w{background:#a33;color:#fff}
  /* جای کادرها: کنار لبه‌ها و روی لبهٔ بالای کارت‌ها */
  body.pg-mf .st.p2{top:0!important}body.pg-mf .st.p3{left:0!important}body.pg-mf .st.p1{right:0!important}body.pg-mf .st.p0{bottom:0!important}
  body.pg-fk #s2{top:0!important}body.pg-fk #s3{left:0!important}body.pg-fk #s1{right:0!important}
  body.pg-fk #s0{bottom:calc(66px + env(safe-area-inset-bottom,0px))!important}
  /* کارت‌های خودت: چسبیده به لبهٔ پایین */
  body.pg-fk #hand{bottom:calc(0px + env(safe-area-inset-bottom,0px))!important;height:64px!important;padding:0 4px!important}
  body.pg-fk #msg{bottom:calc(66px + 112px + env(safe-area-inset-bottom,0px))!important;pointer-events:none}
  body.pg-fk #ex{bottom:calc(70px + env(safe-area-inset-bottom,0px))!important;right:8px;left:auto}
  body.pg-mf #game.on #pn{position:absolute;left:0;right:0;bottom:calc(var(--cw)*1.4 + 124px + env(safe-area-inset-bottom,0px));min-height:0;padding:0 12px;z-index:8;pointer-events:none}
  body.pg-mf #game.on #pn button,body.pg-mf #game.on #pn .bn,body.pg-mf #game.on #pn input{pointer-events:auto}
  /* دکمه‌های موزیک: گوشهٔ خلوت بالای کارت‌ها، کنار کادر */
  body.ingame #musicBar{left:8px!important;bottom:calc(74px + env(safe-area-inset-bottom,0px))!important}
  body.pg-mf.ingame #musicBar{bottom:calc(var(--cw)*1.4 + 18px + env(safe-area-inset-bottom,0px))!important}
  /* دکمه‌های بیرون از تخته کوچک‌تر */
  body.pg-mf .scr .btn,body.pg-fk .scr .btn,#menu .btn,#lobby .btn{font-size:13.5px!important;padding:7px 14px!important;max-width:270px!important;border-radius:12px!important;min-height:0!important}
  body.pg-mf .scr,body.pg-fk .scr{gap:5px!important}
  body.pg-mf #menu .logo,body.pg-fk #menu .logo{font-size:32px!important}
  `;
  document.head.appendChild(css4);

  const css5 = document.createElement('style');
  css5.textContent = `
  /* اصلاح گوشی‌های کم‌قد (مثل سامسونگ در مرورگر داخلی): دکمه‌ها له نشوند، صفحه اسکرول شود */
  body.pg-mf .scr:not(#game),body.pg-fk .scr:not(#game){overflow-y:auto!important;-webkit-overflow-scrolling:touch;justify-content:flex-start!important;padding-bottom:58px!important}
  body.pg-mf .scr:not(#game)>*,body.pg-fk .scr:not(#game)>*{flex-shrink:0!important}
  body.pg-mf .scr:not(#game) .btn,body.pg-fk .scr:not(#game) .btn,#menu .btn,#lobby .btn{flex:0 0 auto!important;min-height:36px!important;height:auto!important;line-height:1.35!important}
  body.pg-mf .scr:not(#game) input,body.pg-fk .scr:not(#game) input{flex:0 0 auto!important;min-height:38px!important}
  body:not(.ingame) #musicBar{bottom:6px!important;left:8px!important}
  @media (max-height:720px){
    body.pg-mf .scr:not(#game) .btn,body.pg-fk .scr:not(#game) .btn{padding:5px 12px!important;font-size:13px!important;min-height:32px!important}
    body.pg-mf .scr:not(#game),body.pg-fk .scr:not(#game){gap:4px!important;padding-top:6px!important}
    body.pg-mf #menu .logo,body.pg-fk #menu .logo{font-size:26px!important}
    #menu .sub{display:none!important}
    .vipH{font-size:13px}.vipId{margin-bottom:2px}
  }
  `;
  document.head.appendChild(css5);

  const css6 = document.createElement('style');
  css6.textContent = `
  /* کادر کوچک و هم‌اندازه برای همه؛ برچسب میر/حاکم روی لبهٔ عکس؛ نور فقط دور عکس */
  .st,.seat{width:84px!important;min-width:84px!important;max-width:84px!important;padding:4px 3px 5px!important;gap:1px!important;border-radius:12px!important;box-sizing:border-box}
  .st.on,.seat.on{animation:none!important;filter:none!important;border-color:#f0b64a99!important;box-shadow:0 0 12px #f0b64a55,0 4px 10px #000a,inset 0 0 10px #f0b64a22!important}
  .av{width:46px!important;height:46px!important;font-size:20px!important;line-height:40px!important;border-width:3px!important}
  .st.on .av,.seat.on .av{box-shadow:0 0 0 2px #fff7,0 0 18px 6px #f0b64add!important;border-color:#ffe08a!important}
  .stx{width:100%;align-items:center}
  .nl{width:100%;justify-content:center;flex-wrap:nowrap!important}
  .st u,.seat .nl b{display:block;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px!important}
  .st .stx>b{font-size:12px!important;line-height:1.1}
  .st i,.seat i.bd{position:absolute!important;top:34px;left:50%;transform:translateX(-50%)!important;z-index:3;font-size:10px!important;padding:0 8px!important;line-height:1.45!important;box-shadow:0 2px 5px #000a;white-space:nowrap}
  body.pg-fk #msg{bottom:calc(66px + 92px + env(safe-area-inset-bottom,0px))!important}
  body.pg-mf #game.on #pn{bottom:calc(var(--cw)*1.4 + 100px + env(safe-area-inset-bottom,0px))!important}
  `;
  document.head.appendChild(css6);

  /* ---------- بار اول: پنجرهٔ تکمیل پروفایل ---------- */
  S.openProfile = openProfile; S.toast = toast; S.profile = profile; S.ask = ask;
  window.SOC = S;
  const spectating = /[?&](w|watch)=/.test(location.search);
  const p0 = profile(); if (p0.name) syncNames(p0.name);
  if (!ls.get('pf_ok') && !spectating) setTimeout(() => openProfile(true), 300);
})();
