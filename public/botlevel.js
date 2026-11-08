/* انتخاب سطح ربات‌ها — فقط برای منفی و حکم (فیسکوت). لودو این فایل را نمی‌خواند. */
(function () {
  if (window.BOTLVL) return;
  const LV = [
    { id: 0, name: 'عادی', icon: '🙂', d: 'همان ربات‌های همیشگی؛ بازی راحت و آرام' },
    { id: 1, name: 'متوسط', icon: '🧠', d: 'هوشیارتر؛ ادعا، میر و نگه‌داشتن کارت‌های خوب بهتر' },
    { id: 2, name: 'قوی', icon: '🔥', d: 'خیلی هوشمند؛ حریف سرسخت و هم‌تیمیِ کمک‌کننده' }
  ];
  let chosen = null, pick = null;
  const css = '#blvOv{position:fixed;inset:0;z-index:100002;background:#000b;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Vazirmatn,Tahoma,sans-serif}' +
    '#blvOv .blvBox{width:min(100%,370px);padding:20px 17px;border:1.5px solid #d9b65e;border-radius:20px;background:linear-gradient(155deg,#142b35,#091821);box-shadow:0 16px 50px #000c;text-align:center;color:#fff;direction:rtl}' +
    '#blvOv .blvBrand{font:900 13px Arial,sans-serif;letter-spacing:.22em;color:#e8c36a;margin-bottom:9px;direction:ltr}' +
    '#blvOv h3{margin:0 0 6px;color:#ffe0a0;font-size:18px}#blvOv p{font-size:13px;line-height:1.8;color:#e7edf1;margin:0 0 12px}' +
    '#blvOv .blvList{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}' +
    '#blvOv .blvOpt{border:1.5px solid #ffffff30;border-radius:12px;padding:10px 12px;background:#ffffff0f;color:#fff;text-align:right;font:700 14px Vazirmatn,Tahoma,sans-serif;cursor:pointer}' +
    '#blvOv .blvOpt small{display:block;margin-top:3px;font-weight:400;font-size:12px;color:#c9d6dc}' +
    '#blvOv .blvOpt.on{border-color:#e8c36a;background:linear-gradient(120deg,#e8c36a33,#b88a3522);box-shadow:0 0 0 2px #e8c36a55 inset}' +
    '#blvOv .blvClose{width:100%;border:0;border-radius:11px;padding:11px 14px;background:linear-gradient(120deg,#e8c36a,#b88a35);color:#1a1a1a;font:800 14px Vazirmatn,Tahoma,sans-serif;cursor:pointer}' +
    '#blvOv .blvClose:disabled{opacity:.45}';
  function close() { const e = document.getElementById('blvOv'); if (e) e.remove(); }
  function note(t) {
    const e = document.getElementById('toast');
    if (e && e.style) { e.textContent = t; e.style.display = 'block'; clearTimeout(note.t); note.t = setTimeout(() => e.style.display = 'none', 3200); }
    else if (typeof tg !== 'undefined' && tg && tg.showAlert) tg.showAlert(t); else alert(t);
  }
  function open() {
    close(); pick = null;
    if (!document.getElementById('blvCss')) { const s = document.createElement('style'); s.id = 'blvCss'; s.textContent = css; (document.head || document.documentElement).appendChild(s); }
    const el = document.createElement('div'); el.id = 'blvOv';
    el.innerHTML = '<div class="blvBox"><div class="blvBrand">CACTUC</div><h3>سطح ربات‌ها چطور باشد؟</h3>' +
      '<p>چند صندلی خالی است و ربات‌ها جایش را می‌گیرند. یکی را انتخاب کن، «بستن» را بزن، بعد دوباره «شروع بازی» را بزن.</p>' +
      '<div class="blvList">' + LV.map(l => '<button class="blvOpt" data-l="' + l.id + '">' + l.icon + ' ' + l.name + '<small>' + l.d + '</small></button>').join('') + '</div>' +
      '<button class="blvClose" disabled>بستن</button></div>';
    document.body.appendChild(el);
    const cb = el.querySelector('.blvClose');
    el.querySelectorAll('.blvOpt').forEach(b => b.addEventListener('click', () => {
      pick = +b.dataset.l; el.querySelectorAll('.blvOpt').forEach(x => x.classList.toggle('on', x === b)); cb.disabled = false;
    }));
    cb.addEventListener('click', () => {
      if (pick === null) return;
      chosen = pick; close();
      try { if (typeof sk !== 'undefined' && sk) sk.emit('botLevel', chosen); } catch (e) { }
      note('سطح ربات‌ها: ' + LV[chosen].name + ' ✅ — حالا «شروع بازی» را بزن');
    });
  }
  window.BOTLVL = {
    // اگر صندلی خالی هست و هنوز سطح انتخاب نشده، پنجره را نشان می‌دهد و true برمی‌گرداند (یعنی شروع نکن)
    ask(seats) {
      if (chosen !== null || !seats || !seats.some(x => !x)) return false;
      open(); return true;
    },
    // سطح انتخاب‌شده را می‌دهد و آمادهٔ پرسیدن دوباره برای دور بعد می‌شود
    take() { const v = chosen; chosen = null; return v === null ? undefined : v; },
    close
  };
})();
