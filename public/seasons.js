/* تم‌های چرخان منو — فقط منوها و لابی‌های «منفی» و «حکم (فیسکوت)»
   هر بار که منو باز می‌شود یک ظاهر تازه انتخاب می‌شود (۱۵ طرح × رنگ‌پاشی تصادفی).
   فقط رنگ‌ها عوض می‌شوند؛ چیدمان، دکمه‌ها و بازی‌ها دست‌نخورده‌اند.
   اگر هر خطایی پیش بیاید، منوی «دوزخ» قبلی بدون تغییر باز می‌شود. */
(function () {
  try {
    const body = document.body;
    if (!body || !(body.classList.contains('pg-mf') || body.classList.contains('pg-fk'))) return; // لودو و غیره: هیچ کاری نکن
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
    const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { } }, del: k => { try { sessionStorage.removeItem(k); } catch (e) { } } };

    /* h = رنگ پس‌زمینه و لبه‌ها، h2 = رنگ درخشش و متن‌ها، s = شدت رنگ (۱ = کامل)
       mode: rise = بالا رفتن، fall = باران/برف، float = شناور، twinkle = چشمک
       ph/pr = رنگ ذره‌ها (+ دامنه)، vs = سرعت، rs = اندازه، nm = تعداد (حداکثر ۱) */
    const TH = [
      { id: 'fire' },                                                                                               // دوزخ (همان قبلی)
      { id: 'forest', h: 150, h2: 135, s: 1, mode: 'float', ph: 72, pr: 40, vs: 1, rs: 1.25, nm: .75 },            // جنگل زمردی، کرم شب‌تاب
      { id: 'ice', h: 205, h2: 195, s: .95, mode: 'fall', ph: 200, pr: 12, vs: .7, rs: 1.1, nm: .9 },               // یخ‌بندان، برف
      { id: 'violet', h: 268, h2: 285, s: 1, mode: 'twinkle', ph: 280, pr: 40, vs: 1, rs: 1, nm: 1 },               // شب بنفش، ستاره
      { id: 'gold', h: 42, h2: 46, s: 1, mode: 'rise', ph: 44, pr: 14, vs: .55, rs: .9, nm: .85 },                  // طلای سلطنتی، غبار طلا
      { id: 'ocean', h: 186, h2: 176, s: 1, mode: 'rise', ph: 180, pr: 20, vs: .5, rs: 1.7, nm: .55 },              // اقیانوس، حباب
      { id: 'neon', h: 318, h2: 328, s: 1, mode: 'float', ph: 320, pr: 50, vs: 1.2, rs: 1, nm: .8 },                // نئون مجنتا
      { id: 'rose', h: 346, h2: 352, s: 1, mode: 'fall', ph: 348, pr: 16, vs: .6, rs: 1.6, nm: .6 },                // گل سرخ، گلبرگ
      { id: 'lime', h: 96, h2: 86, s: 1, mode: 'rise', ph: 90, pr: 30, vs: .8, rs: 1, nm: .8 },                     // لیمویی، هاگ‌ها
      { id: 'midnight', h: 224, h2: 214, s: 1, mode: 'twinkle', ph: 214, pr: 20, vs: 1, rs: 1, nm: 1 },             // نیمه‌شب آبی
      { id: 'aurora', h: 166, h2: 282, s: 1, mode: 'float', ph: 170, pr: 120, vs: .9, rs: 1.2, nm: .8 },            // شفق قطبی (سبز + بنفش)
      { id: 'silver', h: 214, h2: 214, s: .14, mode: 'fall', ph: 210, pr: 0, vs: .5, rs: 1.2, nm: .7 },             // نقره‌ای، خاکستر
      { id: 'indigo', h: 250, h2: 44, s: 1, mode: 'twinkle', ph: 44, pr: 10, vs: 1, rs: 1.1, nm: .9 },              // نیلی + طلا
      { id: 'tealfire', h: 190, h2: 24, s: 1, mode: 'rise', ph: 28, pr: 16, vs: .9, rs: 1, nm: .9 },                // فیروزه‌ای + نارنجی
      { id: 'plum', h: 286, h2: 88, s: 1, mode: 'float', ph: 90, pr: 20, vs: 1, rs: 1, nm: .8 }                     // آلویی + لیمویی
    ];

    /* ---- انتخاب ظاهر: دفعهٔ پیش و چند دفعهٔ قبل‌تر تکرار نمی‌شود ---- */
    let pick = null, j1 = rnd(-11, 11), j2 = rnd(-11, 11);
    const carry = ss.get('thCarry');
    if (carry && body.classList.contains('pg-fk')) { // رفتن از منوی اصلی به حکم: همان ظاهر ادامه پیدا کند (فقط یک‌بار)
      ss.del('thCarry');
      try { const c = JSON.parse(carry); if (c && Date.now() - c.t < 20000) { pick = TH.find(x => x.id === c.id) || null; j1 = +c.j1 || 0; j2 = +c.j2 || 0; } } catch (e) { }
    }
    if (!pick) {
      let hist = []; try { hist = JSON.parse(ls.get('thHist') || '[]'); } catch (e) { }
      if (!Array.isArray(hist)) hist = [];
      const ok = TH.filter(x => hist.slice(-5).indexOf(x.id) < 0);
      pick = (ok.length ? ok : TH)[Math.floor(Math.random() * (ok.length ? ok.length : TH.length))];
      hist.push(pick.id); ls.set('thHist', JSON.stringify(hist.slice(-8)));
    }
    window.SEASON_ID = pick.id;
    if (pick.id === 'fire') return; // دوزخ: بدون هیچ تغییری

    const H = Math.round((pick.h + j1 + 360) % 360), H2 = Math.round((pick.h2 + j2 + 360) % 360), S = pick.s;
    const hs = (h, s, l, a) => a == null ? `hsl(${h},${Math.round(s * S)}%,${l}%)` : `hsla(${h},${Math.round(s * S)}%,${l}%,${a})`;
    const V = {
      '--t-bg0': hs(H, 50, 3), '--t-bg1': hs(H, 55, 8),
      '--t-b1': hs(H, 38, 11), '--t-b2': hs(H, 50, 4),
      '--t-bd': hs(H, 70, 27), '--t-bd2': hs(H, 62, 40),
      '--t-ac': hs(H2, 100, 62), '--t-hi': hs(H2, 100, 88), '--t-mid': hs(H2, 100, 66), '--t-lo': hs(H2, 88, 44), '--t-deep': hs(H, 88, 24),
      '--t-txt': hs(H2, 75, 93), '--t-sub': hs(H2, 50, 78),
      '--t-gl': hs(H2, 100, 60, .30), '--t-gl2': hs(H2, 100, 60, .62), '--t-glt': hs(H2, 100, 60, .45), '--t-gl3': hs(H2, 100, 62, .15),
      '--t-in': hs(H, 45, 6), '--t-ibd': hs(H, 65, 25), '--t-ibf': hs(H2, 100, 56),
      '--t-panel': hs(H, 55, 6, .9), '--t-lnk': hs(H2, 100, 76),
      '--t-go1': hs(H2, 100, 74), '--t-go2': hs(H2, 94, 54), '--t-go3': hs(H2, 90, 33), '--t-gob': hs(H2, 100, 86), '--t-got': hs(H, 90, 7), '--t-god': hs(H2, 90, 20),
      '--t-sh': hs(H, 70, 8), '--t-sweep': hs(H2, 100, 72, .34), '--t-pg': hs(H2, 100, 90, .5),
      '--vg1': hs(H2, 100, 87), '--vg2': hs(H2, 88, 56), '--vg3': hs(H2, 80, 36), '--vfire': hs(H, 92, 52)
    };
    for (const k in V) body.style.setProperty(k, V[k]);
    body.setAttribute('data-th', pick.id);

    /* ---- رنگ‌های بوم پس‌زمینه (inferno.js می‌خواند؛ اگر نبود، رنگ‌های آتشی قبلی) ---- */
    window.SEASON_PAL = {
      mode: pick.mode, vs: pick.vs, rs: pick.rs, nm: pick.nm, fk: pick.mode === 'fall' ? 1.6 : 6,
      bg0: hs(H, 55, 2), bg1: hs(H, 55, 7),
      fl0: hs(H2, 100, 55, .40), fl1: hs(H, 80, 30, .18),
      cr: [hs(H2, 100, 55, .07), hs(H2, 100, 60, .2), hs(H2, 100, 86, .85)],
      sm: hs(H, 50, 16, .38),
      pc: (life, a) => `hsla(${Math.round((pick.ph + j2 + pick.pr * life + 360) % 360)},${Math.round(Math.min(100, 95) * S)}%,${Math.round(55 + 25 * life)}%,${a.toFixed(3)})`
    };

    /* ---- انتقال سینمایی به بازی: فقط یک پردهٔ شفاف روی صفحه؛ دکمه همان لحظه کار خودش را می‌کند ---- */
    if (body.classList.contains('pg-mf') && !reduce) {
      document.addEventListener('click', e => {
        try {
          const b = e.target && e.target.closest && e.target.closest('#menu .gcard'); if (!b) return;
          const old = document.getElementById('thCur'); if (old) old.remove();
          const ld = b.classList.contains('ld');
          const c = document.createElement('div'); c.id = 'thCur';
          c.style.setProperty('--tc0', ld ? '#0a0420' : hs(H, 60, 3));
          c.style.setProperty('--tc1', ld ? '#3a1a85' : hs(H, 70, 16));
          c.style.setProperty('--tcb', ld ? '#ffd37a' : hs(H2, 100, 66));
          c.style.setProperty('--tcg', ld ? '#c9a0ffaa' : hs(H2, 100, 60, .6));
          let h = ''; for (let i = 0; i < 5; i++) h += `<i style="--n:${i};--r:${(i - 2) * 24}deg"></i>`;
          c.innerHTML = h; document.body.appendChild(c); setTimeout(() => { c.remove(); }, 1100);
          if (b.classList.contains('fk')) ss.set('thCarry', JSON.stringify({ id: pick.id, j1, j2, t: Date.now() }));
        } catch (err) { }
      }, true);
    }
  } catch (err) { console.log('seasons off', err); window.SEASON_PAL = null; try { document.body.removeAttribute('data-th'); } catch (e) { } }
})();
