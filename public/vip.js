/* VIP CACTUC — لایهٔ مشترک «منفی»، «حکم (فیسکوت)» و «لودو»
   ویبره (فقط منفی/حکم)، صدای نرم، اعلام میز در گروه، ورود به میز از پیام گروه، تمرین با ربات،
   نکته‌های آموزشی و لحظهٔ برد سینمایی. به منطق بازی‌ها دست نمی‌زند؛ فقط به رویدادهای آن‌ها گوش می‌دهد. */
(function () {
  if (window.VIP) return;
  const PG = location.pathname.indexOf('fiskoot') >= 0 ? 'fk' : location.pathname.indexOf('ludo') >= 0 ? 'ld' : 'mf';
  const GN = { mf: 'منفی', fk: 'حکم (فیسکوت)', ld: 'لودو' };
  const $ = id => document.getElementById(id);
  const tg = window.Telegram && Telegram.WebApp;
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches);
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const V = window.VIP = { PG };
  const hasSk = () => typeof sk !== 'undefined' && sk;
  const stNow = () => (typeof st !== 'undefined' ? st : null);
  const onConn = f => { if (!hasSk()) return; sk.connected ? f() : sk.once('connect', f); };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ================= پیام کوچک ================= */
  function toast(t, ms) {
    let e = $('vToast'); if (!e) { e = document.createElement('div'); e.id = 'vToast'; document.body.appendChild(e); }
    e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms || 2800);
  }
  V.toast = toast;

  /* ================= ویبره ================= (فقط منفی و حکم؛ در لودو هرگز)
     رنگ‌زدن: ویبرهٔ ملایم حدود ۱٫۵ ثانیه — نوبت: ویبرهٔ قوی ۳ ثانیه.
     اندروید: ویبرهٔ واقعی با navigator.vibrate. آیفون این را ندارد؛ پس با ضربه‌های پشت‌سرهم لرزش تلگرام (HapticFeedback) ساخته می‌شود. */
  let rum = null;
  function stopRumble(kind) {
    if (!rum || (kind && rum.kind !== kind)) return;
    clearInterval(rum.t); clearTimeout(rum.e); rum = null;
    try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) { }
  }
  function rumble(kind) {
    if (PG === 'ld' || document.hidden) return;
    stopRumble();
    const soft = kind === 'cut', ms = soft ? 1500 : 3000, h = tg && tg.HapticFeedback;
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (!ios && navigator.vibrate) {
      try {
        let pat = [3000];
        if (soft) { pat = []; for (let i = 0; i < 20; i++) pat.push(26, 50); }
        if (navigator.vibrate(pat)) { rum = { kind, t: 0, e: setTimeout(() => { rum = null; }, ms) }; return; }
      } catch (e) { }
    }
    if (h && h.impactOccurred) {
      const gap = soft ? 75 : 45, styles = soft ? ['soft'] : ['heavy', 'rigid'];
      let n = 0, t0 = Date.now();
      const tick = () => { try { h.impactOccurred(styles[n++ % styles.length]); } catch (e) { } };
      tick(); rum = { kind, t: setInterval(tick, gap), e: setTimeout(() => stopRumble(), ms) };
    }
  }
  const buzz = rumble;
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopRumble(); });
  const isSpec = () => { const s = stNow(); return !!(s && s.isSpec); };
  // پر «رنگ زدن» (حکم روی خال دیگر) انداخته شد؛ همان لحظهٔ افکت ترک‌خوردن. روی گوشی همهٔ بازیکنان حاضر اجرا می‌شود.
  V.cut = function () {
    if (isSpec()) return;
    buzz('cut'); V.sfx('cut'); tip('cut', PG === 'mf' ? 'پیک حکم است؛ وقتی پیک روی خال دیگر بیفتد، آن دست را می‌برد.' : 'حکم همهٔ خال‌های دیگر را می‌برد؛ اگر هم‌خال نداری، حکم بزن.');
  };
  // یادآوری نوبت: اگر ۵ ثانیه بعد از رسیدن نوبت هنوز کارت نینداخته‌ای، فقط گوشی خودت یک‌بار می‌لرزد
  let tTimer = null, tKey = '';
  function turn(on, key) {
    if (!on) { clearTimeout(tTimer); tTimer = null; tKey = ''; stopRumble('turn'); return; }
    if (key === tKey) return;
    tKey = key; clearTimeout(tTimer);
    V.sfx('turn');
    tTimer = setTimeout(() => { tTimer = null; if (tKey === key) buzz('turn'); }, 5000);
  }
  V._turn = turn;

  /* ================= صدا ================= (ساخته‌شده با WebAudio؛ بدون فایل و بدون هزینه) */
  let ctx = null;
  const sfxOn = () => ls.get('vip_sfx') !== '0';
  function ac() {
    if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { ctx = new A(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { } }
    return ctx;
  }
  function tone(c, t, d, f, f2, type, vol) {
    const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.03);
  }
  function hiss(c, t, d, fq, vol) {
    const n = Math.max(1, c.sampleRate * d | 0), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = 0.9;
    g.gain.value = vol; s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  }
  const SFX = {
    tap: (c, t) => tone(c, t, 0.05, 1250, 820, 'sine', 0.05),
    card: (c, t) => { hiss(c, t, 0.06, 2200, 0.09); tone(c, t, 0.07, 190, 120, 'triangle', 0.05); },
    cut: (c, t) => { tone(c, t, 0.26, 130, 55, 'triangle', 0.16); hiss(c, t, 0.14, 1400, 0.1); },
    turn: (c, t) => { tone(c, t, 0.1, 660, 0, 'sine', 0.05); tone(c, t + 0.11, 0.14, 880, 0, 'sine', 0.05); },
    win: (c, t) => { [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * 0.13, 0.32, f, 0, 'triangle', 0.09)); tone(c, t + 0.55, 0.9, 1319, 0, 'sine', 0.05); },
    lose: (c, t) => { [392, 349, 311].forEach((f, i) => tone(c, t + i * 0.22, 0.4, f, 0, 'sine', 0.055)); }
  };
  V.sfx = function (name) {
    if (!sfxOn() || reduce && name === 'tap') return;
    const c = ac(); if (!c || c.state !== 'running' || !SFX[name]) return;
    try { SFX[name](c, c.currentTime + 0.005); } catch (e) { }
  };
  V.toggleSfx = function () { const on = !sfxOn(); ls.set('vip_sfx', on ? '1' : '0'); syncSfxBtn(); if (on) V.sfx('tap'); };
  function syncSfxBtn() { const b = $('vipSfxBtn'); if (b) b.textContent = sfxOn() ? '🔊 صدای افکت‌ها: روشن' : '🔇 صدای افکت‌ها: خاموش'; }
  document.addEventListener('pointerdown', e => {
    ac();
    const b = e.target.closest && e.target.closest('button,.btn,.kbtn,.ktile,.kic,.gcard,a.lnk');
    if (b && !b.disabled) V.sfx('tap');
  }, { capture: true, passive: true });

  /* ================= نکته‌های آموزشی (فقط در «تمرین با ربات») ================= */
  let PRAC = null;
  try { const p = JSON.parse(sessionStorage.getItem('vip_prac') || 'null'); if (p && p.g === PG) PRAC = p; } catch (e) { }
  const savePrac = () => { try { sessionStorage.setItem('vip_prac', PRAC ? JSON.stringify(PRAC) : ''); } catch (e) { } };
  let curCode = '';
  function tip(key, text) {
    if (!PRAC || !PRAC.room || PRAC.room !== curCode || PRAC.seen[key]) return;
    PRAC.seen[key] = 1; savePrac();
    let e = $('vTip'); if (!e) { e = document.createElement('div'); e.id = 'vTip'; e.onclick = () => e.classList.remove('on'); document.body.appendChild(e); }
    e.innerHTML = '<b>💡 نکته</b><span>' + esc(text) + '</span>'; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
    clearTimeout(tip.t); tip.t = setTimeout(() => e.classList.remove('on'), 6200);
  }
  function badge(on) {
    let b = $('vPracB'); if (!on) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'vPracB'; b.textContent = '🎓 تمرین'; document.body.appendChild(b); }
  }
  function onRoom(code, host, lobby) {
    curCode = code || '';
    if (PRAC && PRAC.pend && lobby && host) {   // اتاق تمرین ساخته شد: با ۳ ربات شروع کن
      PRAC.pend = false; PRAC.room = code; PRAC.seen = {}; savePrac();
      if (PG === 'mf') sk.emit('start', { forceBots: true }); else sk.emit('start', { bots: 1 });
    }
    badge(!!(PRAC && PRAC.room && PRAC.room === code));
  }
  V.practice = function (g) {
    PRAC = { g, pend: true, room: null, seen: {} }; savePrac();
    closeSheet();
    if (g === 'mf') { if (typeof mk === 'function') mk(); }
    else location.href = (g === 'fk' ? '/fiskoot.html' : '/ludo.html') + '?practice=1';
  };
  V.openPractice = function () {
    openSheet(`<h3>🎓 تمرین با ربات</h3><p class="vsm">با ۳ ربات بازی می‌کنی و نکته‌های کوتاه و به‌موقع می‌بینی. کدام بازی را تمرین کنیم؟</p>
      <div class="vcol"><button class="btn go" data-a="mf">♠ منفی</button><button class="btn go" data-a="fk">♥ حکم (فیسکوت)</button><button class="btn go" data-a="ld">🎲 لودو</button><button class="btn" data-a="x">بستن</button></div>`,
      a => { if (a === 'x') closeSheet(); else V.practice(a); });
  };

  /* ================= پنجرهٔ پایین (sheet) ================= */
  function closeSheet() { const e = $('vSheet'); if (e) e.remove(); }
  function openSheet(html, handler) {
    closeSheet();
    const d = document.createElement('div'); d.id = 'vSheet';
    d.innerHTML = '<div class="vbox">' + html + '</div>';
    d.addEventListener('click', e => {
      if (e.target === d) { closeSheet(); return; }
      const b = e.target.closest('[data-a]'); if (b && handler) handler(b.dataset.a);
    });
    document.body.appendChild(d); return d;
  }

  /* ================= اعلام میز در گروه (میزبان) ================= */
  V.announce = function () { if (hasSk()) { sk.emit('announce'); toast('در حال اعلام میز…', 1500); } };
  if (hasSk()) sk.on('announced', r => toast((r && r.msg) || 'انجام نشد', 3600));
  function annBtn(show) { const b = $('annBtn'); if (b) b.style.display = show ? '' : 'none'; }

  /* ================= ورود به میز از پیام گروه (فقط صفحهٔ اصلی) ================= */
  const CODE = /^[A-Z]{4}$/;
  async function botName() { try { return (await (await fetch('/config')).json()).bot || ''; } catch (e) { return ''; } }
  async function inviteFriends(g, code, open) {
    const bot = await botName(), pre = { mf: 'tbm_', fk: 'tbf_', ld: 'tbl_' }[g];
    const link = bot ? 'https://t.me/' + bot + (open && code ? '?start=' + pre + code : '') : location.origin;
    const text = open && code ? `بیا یک دست ${GN[g]} بازی کنیم! 🃏 کد میز: ${code}` : 'بیا منفی، حکم (فیسکوت) و لودو را با هم بازی کنیم! 🃏🎲';
    const u = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
    try { tg.openTelegramLink(u); } catch (e) { window.open(u, '_blank'); }
  }
  function newGame(g) {
    closeSheet();
    if (g === 'mf') { if (typeof mk === 'function') mk(); } else location.href = (g === 'fk' ? '/fiskoot.html' : '/ludo.html') + '?new=1';
  }
  async function showTable(g, code) {
    const draw = (info, err) => {
      const open = info && info.s === 'open';
      let html;
      if (err) html = `<h3>🃏 میز ${GN[g]}</h3><p class="vsm">اتصال به سرور برقرار نشد. اینترنتت را بررسی کن.</p><div class="vcol"><button class="btn go" data-a="retry">🔄 دوباره امتحان کن</button><button class="btn" data-a="x">دیدن منوی ربات</button></div>`;
      else if (open) html = `<h3>🃏 میز ${GN[g]} باز است</h3><p class="vsm">کد میز: <b dir="ltr">${code}</b>${info.host ? ' · میزبان: ' + esc(info.host) : ''}<br>${info.free} جای خالی دارد.</p>
        <div class="vcol"><button class="btn go" data-a="join">🚪 ورود به همین میز</button><button class="btn" data-a="inv">📨 دعوت از دوستان</button><button class="btn" data-a="new">🆕 بازی جدید</button></div>`;
      else html = `<h3>🔒 این میز پر شده است!</h3><p class="vsm">یک میز جدید بساز و دوستانت را دعوت کن.</p>
        <div class="vcol"><button class="btn go" data-a="new">🆕 ساخت میز جدید</button><button class="btn" data-a="x">دیدن منوی ربات</button></div>`;
      openSheet(html, async a => {
        if (a === 'x') closeSheet();
        else if (a === 'retry') showTable(g, code);
        else if (a === 'inv') inviteFriends(g, code, true);
        else if (a === 'new') newGame(g);
        else if (a === 'join') {
          let fresh; try { fresh = await (await fetch('/api/table?g=' + g + '&c=' + code, { cache: 'no-store' })).json(); } catch (e) { fresh = null; }
          if (!fresh) return draw(null, true);
          if (fresh.s !== 'open') return draw(fresh);          // در این فاصله پر شده است
          closeSheet();
          if (g === 'mf') sk.emit('join', { code, name: nm(), token: tok });
          else location.href = (g === 'fk' ? '/fiskoot.html' : '/ludo.html') + '?room=' + code + '&join=1';
        }
      });
    };
    openSheet('<h3>🃏 میز ' + GN[g] + '</h3><p class="vsm">در حال بررسی میز…</p>');
    let info = null, err = false;
    try { info = await (await fetch('/api/table?g=' + g + '&c=' + code, { cache: 'no-store' })).json(); } catch (e) { err = true; }
    draw(info, err);
  }
  function initTableLink() {
    const q = new URLSearchParams(location.search); let g = q.get('tb'), c = (q.get('c') || '').toUpperCase();
    try {
      const sp = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '', m = /^tb([mfl])_([A-Za-z]{4})$/i.exec(sp);
      if (m) { g = { m: 'mf', f: 'fk', l: 'ld' }[m[1].toLowerCase()]; c = m[2].toUpperCase(); }
    } catch (e) { }
    if (!GN[g] || !CODE.test(c)) return;
    history.replaceState(0, '', '/');
    showTable(g, c);
  }

  /* ================= صفحه‌های حکم و لودو: پارامترهای ورود ================= */
  function initPageParams() {
    const q = new URLSearchParams(location.search);
    const room = (q.get('room') || '').toUpperCase();
    if (q.get('join') === '1' && CODE.test(room)) onConn(() => { try { $('cin').value = room; joinCode(); } catch (e) { } });
    else if (q.get('new') === '1') onConn(() => { try { if (!$('nm').value.trim()) $('nm').value = 'بازیکن'; mkRoom(); } catch (e) { } });
    else if (q.get('practice') === '1') {
      if (!PRAC || !PRAC.pend) { PRAC = { g: PG, pend: true, room: null, seen: {} }; savePrac(); }
      onConn(() => { try { if (!$('nm').value.trim()) $('nm').value = 'بازیکن'; mkRoom(); } catch (e) { } });
    }
    if (q.has('join') || q.has('new') || q.has('practice')) { try { history.replaceState(0, '', location.pathname + (room ? '?room=' + room : '')); } catch (e) { } }
  }

  /* ================= گوش دادن به وضعیت بازی‌ها ================= */
  let lastTrick = -1;
  function cardSound(n) { if (lastTrick >= 0 && n > lastTrick) V.sfx('card'); lastTrick = n; }
  if (hasSk() && PG === 'mf') {
    sk.on('state', s => {
      const g = s.g, lobby = !g;
      annBtn(!!s.host && lobby && !s.isSpec); closeSheet();
      onRoom(s.code, s.host, lobby);
      if (!g || s.isSpec) { turn(false); lastTrick = -1; return; }
      cardSound(g.trick.length);
      turn(g.phase === 'play' && g.turn === s.me, g.rid + '|' + g.trick.length + '|' + g.taken.join());
      if (g.phase === 'bid' && g.bidTurn === s.me) tip('bid', 'ادعا یعنی چند دست فکر می‌کنی بگیری. عدد را با + و − تنظیم کن و «ثبت ادعا» را بزن.');
      else if (g.phase === 'mir') tip(g.dealer === s.me ? 'mirMe' : 'mirOther', g.dealer === s.me ? 'تو میر هستی: ادعای باقی‌مانده برای توست. اگر نمی‌توانی بگیری «بچرخون»، وگرنه «قبول».' : 'میر آخر ادعا می‌کند و باقی‌مانده را می‌گیرد تا جمع ادعاها ۱۳ شود.');
      else if (g.phase === 'play' && g.turn === s.me) tip('play', 'کارت را بگیر و بالا روی میز بکش. باید هم‌خال بازی کنی؛ اگر نداری هر پری می‌توانی بیندازی. پیک ♠ حکم است.');
      else if (g.phase === 'over') tip('over', 'تیمی که بیشتر از ادعای خودش دست بگیرد، تیم مقابل «منفی» می‌شود.');
    });
  } else if (hasSk() && PG === 'fk') {
    sk.on('st', s => {
      const lobby = s.ph === 'lobby';
      annBtn(!!s.host && lobby && !s.isSpec); onRoom(s.code, s.host, lobby);
      if (lobby || s.isSpec) { turn(false); lastTrick = -1; return; }
      const n = s.trick ? s.trick.length : 0; cardSound(n);
      turn(s.ph === 'play' && s.turn === s.me && !s.paused, (s.sc || []).join() + '|' + (s.tw || []).join() + '|' + n);
      if (s.ph === 'hint' || s.ph === 'count') tip('hint', 'اول کارت‌ها پشت‌رو پخش می‌شوند؛ هر کس اول توس (آس) بیاورد حاکم می‌شود.');
      else if (s.ph === 'pick' && s.pk && s.pk.t === s.me) tip('pick', 'نوبت توست: یکی از کارت‌های پشت‌رو را لمس کن تا برگردد.');
      else if (s.ph === 'trump' && s.hk === s.me) tip('trump', 'تو حاکمی! از ۵ کارتت، قوی‌ترین خال را به‌عنوان «حکم» انتخاب کن.');
      else if (s.ph === 'play' && s.turn === s.me) tip('play', 'کارت را بگیر و روی میز بکش. باید هم‌خال بازی کنی؛ نداری، حکم یا هر خال دیگر. حکم بقیه را می‌برد.');
      else if (s.ph === 'res') tip('res', 'هر تیمی که به ۷ دست برسد، دست را می‌برد؛ کت‌فیسی ۳ امتیاز و کدرنگ ۷ امتیاز دارد.');
    });
  } else if (hasSk() && PG === 'ld') {
    sk.on('st', s => {
      const lobby = s.ph === 'lobby';
      annBtn(!!s.host && lobby && !s.isSpec); onRoom(s.code, s.host, lobby);
      if (lobby || s.isSpec || s.ph !== 'play') return;
      const mine = s.me === s.turn;
      if (mine && s.stage === 'roll') tip('roll', 'روی تاس بزن تا بیندازی. با ۶ مهره از خانه بیرون می‌آید.');
      else if (mine && s.stage === 'move') tip('move', 'یکی از مهره‌های چشمک‌زن را انتخاب کن. روی مهرهٔ حریف بیفتی (به‌جز خانه‌های امن و ستاره) آن را می‌زنی.');
      if (s.dice === 6 && mine) tip('six', '۶ یک تاس دوباره می‌دهد؛ ولی سه ۶ پشت‌سرهم نوبتت را می‌سوزاند.');
    });
  }

  /* ================= لحظهٔ برد سینمایی ================= */
  // el: پوستهٔ #endScr؛ o: { win: boolean|null, names: [...], kind: 'team'|'ld', rank: 0|1|2|3|-1 }
  V.cine = function (el, o) {
    try {
      if (!el || !o) return;
      const old = el.querySelector('.cine'); if (old) old.remove();
      let title, sub, win = o.win;
      if (o.kind === 'ld') { title = '👑 قهرمان لودو'; sub = o.rank === 0 ? 'تبریک! تو اول شدی 🎉' : o.rank < 0 ? 'قهرمان این بازی را تماشا کردی' : o.last ? 'این دفعه نشد؛ بازی بعدی مال توست 🌵' : 'آفرین! جایگاه خوبی گرفتی 👏'; win = o.rank === 0 ? true : o.rank < 0 ? null : false; }
      else { title = '🏆 برنده‌ها'; sub = win === true ? 'تبریک! تیم تو برنده شد 🎉' : win === false ? 'بازی قشنگی بود؛ دفعهٔ بعد نوبت توست 🌵' : 'تماشای خوبی بود!'; }
      const names = (o.names || []).map(esc).join(' و ');
      const d = document.createElement('div'); d.className = 'cine' + (reduce ? ' rm' : '');
      d.innerHTML = `<div class="cRays"></div><div class="cFlash"></div><div class="cBody"><div class="cCrown">👑</div><div class="cT">${title}</div><div class="cN">${names}</div><div class="cS">${esc(sub)}</div></div>`;
      d.addEventListener('pointerdown', () => d.remove());
      el.appendChild(d); setTimeout(() => d.remove(), reduce ? 1400 : 3300);
      V.sfx(win === false ? 'lose' : 'win');
    } catch (e) { }
  };

  /* ================= دکمهٔ صدا در منوها ================= */
  function addSfxBtn() {
    const m = $('menu'); if (!m || $('vipSfxBtn')) return;
    const b = document.createElement('button'); b.id = 'vipSfxBtn'; b.className = 'lnk vSfx'; b.onclick = V.toggleSfx;
    const host = m.querySelector('.fit') || m; host.appendChild(b); syncSfxBtn();
  }

  /* ================= جعبهٔ «بازگشت به بازی نیمه‌کاره»: فقط وقتی واقعاً بازی نیمه‌کاره‌ای هست ================= */
  function syncResume() {
    const b = $('resumeBox'); if (!b) return;
    const s = stNow(), has = !!(ls.get('room') || (s && s.code && !s.isSpec));
    b.style.display = has ? '' : 'none';
  }

  /* ================= لمس کد اتاق = کپی ================= */
  document.addEventListener('click', e => {
    const h = e.target.closest && e.target.closest('#lobby h2,#lobby .kh'); if (!h) return;
    const c = (($('code') || $('rc') || {}).textContent || '').trim(); if (!c) return;
    const done = () => toast('کد اتاق کپی شد: ' + c, 1800);
    try { navigator.clipboard.writeText(c).then(done, () => toast('کد اتاق: ' + c, 2200)); } catch (x) { toast('کد اتاق: ' + c, 2200); }
  });

  /* ================= شروع ================= */
  const boot = () => {
    document.body.classList.add('vip-on');
    addSfxBtn();
    if (PG === 'mf') { syncResume(); setInterval(syncResume, 1000); initTableLink(); } else initPageParams();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
