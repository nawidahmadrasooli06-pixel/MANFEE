/* واکنش ایموجی + «تپ» + «هوا» برای بازی‌های منفی و حکم (فیسکوت). لودو این فایل را نمی‌خواند.
   - ایموجی: دکمهٔ کوچک پایین-چپ (کنار دکمهٔ موزیک)؛ فقط با لمس باز می‌شود.
   - تپ/هوا: دو گزینهٔ کوچک پایین-راست؛ فقط همراه انداختن کارت ارسال می‌شوند (SGN.take()).
   - نمایش برای همه: نوشتهٔ صاف و خوانا کنار کادر نام (جدا از چرخش صندلی) + موج/نور ملایم روی میز. */
(function () {
  if (typeof sk === 'undefined') return;
  const GAME = (typeof PAGE_GAME !== 'undefined') ? PAGE_GAME : (location.pathname.indexOf('fiskoot') >= 0 ? 'fk' : 'mf');
  if (GAME !== 'mf' && GAME !== 'fk') return;
  const EMO = ['🤬', '😭', '😂', '👏', '🤝', '♠️', '💣'];
  const $$ = id => document.getElementById(id);
  const hasSt = () => typeof st !== 'undefined' && st;
  const TXT = { 1: ['تپ', 'من ازین دارم بیا'], 2: ['هوا', 'ازین ندارم'] };
  let sel = 0, cdUntil = 0, flash = 0, flashT = 0;

  const css = document.createElement('style');
  css.textContent = `
  #sgEmo,#sgBox,#sgPick{position:fixed;display:none;direction:ltr}
  #sgEmo{z-index:60;width:36px;height:36px;border-radius:50%;border:1px solid #f0b64a88;background:#0b1f1ecc;color:#fff;font-size:18px;padding:0;line-height:1}
  #sgEmo.sgcd{opacity:.45}
  #sgPick{z-index:75;background:#000d;border:1px solid #f0b64a66;border-radius:16px;padding:3px 4px;gap:1px;box-shadow:0 3px 12px #000a}
  #sgPick button{background:none;border:0;font-size:22px;line-height:1;width:34px;height:36px;padding:0;border-radius:10px;color:#fff}
  #sgPick button:active{background:#ffffff33}
  #sgBox{z-index:60;gap:6px;direction:rtl}
  #sgBox button{font:inherit;min-width:62px;padding:3px 5px 4px;border-radius:12px;border:1px solid #f0b64a88;background:#0b1f1ecc;color:#fff;line-height:1.2;text-align:center}
  #sgBox b{display:block;font-size:13px;font-weight:800}
  #sgBox small{display:block;font-size:8.5px;opacity:.85;white-space:nowrap}
  #sgBox button.on1{border-color:#6fb7ff;background:#102a4bdd;box-shadow:0 0 8px #4a9bff88}
  #sgBox button.on2{border-color:#f0b64a;background:#3a2c0bdd;box-shadow:0 0 8px #f0b64a88}
  .sgC{position:fixed;z-index:80;display:flex;gap:4px;align-items:center;pointer-events:none;direction:rtl;transform:translateX(-50%)}
  .sgI{font-size:26px;line-height:1;filter:drop-shadow(0 2px 4px #000b);animation:sgIn .25s ease-out,sgOut .6s ease-in var(--d) forwards}
  .sgT{font-size:12px;font-weight:800;line-height:1;padding:4px 9px;border-radius:10px;background:#000c;border:1px solid var(--c);color:var(--c);animation:sgIn .25s ease-out,sgOut .5s ease-in var(--d) forwards;direction:rtl;white-space:nowrap}
  @keyframes sgIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
  @keyframes sgOut{to{opacity:0}}
  .sgRing{position:fixed;z-index:40;width:46px;height:46px;border-radius:50%;border:2px solid #7cc0ff;box-shadow:0 0 10px #4a9bff88,inset 0 0 8px #4a9bff55;pointer-events:none;opacity:0;animation:sgRing 1.5s ease-out var(--dl) forwards}
  @keyframes sgRing{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}15%{opacity:.7}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(2.8)}}
  .sgBeam{position:fixed;z-index:40;width:110px;height:9px;border-radius:9px;background:linear-gradient(90deg,#ffd76a00,#ffd76acc 55%,#fff3c000);filter:blur(1.5px);pointer-events:none;opacity:0;animation:sgBeam 1.5s ease-out var(--dl) forwards}
  @keyframes sgBeam{0%{opacity:0;transform:translate(-50%,-50%) rotate(var(--a)) translateX(0) scaleX(.5)}20%{opacity:.85}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--a)) translateX(var(--dist)) scaleX(1.25)}}
  `;
  document.head.appendChild(css);

  const emo = document.createElement('button'); emo.id = 'sgEmo'; emo.textContent = '😊'; emo.setAttribute('aria-label', 'ایموجی');
  const pick = document.createElement('div'); pick.id = 'sgPick';
  pick.innerHTML = EMO.map((e, i) => `<button data-k="${i}">${e}</button>`).join('');
  const box = document.createElement('div'); box.id = 'sgBox';
  box.innerHTML = '<button data-k="1"></button><button data-k="2"></button>';
  document.body.append(emo, pick, box);

  function paintBtns() {
    box.querySelectorAll('button').forEach(b => {
      const k = +b.dataset.k, on = sel === k, fl = flash === k;
      b.className = on ? 'on' + k : '';
      b.innerHTML = `<b>${TXT[k][0]}</b><small>${on ? 'انتخاب شد ✓' : fl ? 'لغو' : TXT[k][1]}</small>`;
    });
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const k = +b.dataset.k;
    if (sel === k) { sel = 0; flash = k; clearTimeout(flashT); flashT = setTimeout(() => { flash = 0; paintBtns(); }, 1200); }
    else { sel = k; flash = 0; }
    paintBtns();
  });
  emo.addEventListener('click', e => {
    e.stopPropagation(); if (Date.now() < cdUntil) return;
    pick.style.display = pick.style.display === 'flex' ? 'none' : 'flex'; place();
  });
  pick.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    pick.style.display = 'none';
    if (Date.now() < cdUntil) return;
    cdUntil = Date.now() + 1300; emo.classList.add('sgcd'); setTimeout(() => emo.classList.remove('sgcd'), 1300);
    sk.emit('react', +b.dataset.k);
  });
  document.addEventListener('pointerdown', e => { if (pick.style.display === 'flex' && !e.target.closest('#sgPick,#sgEmo')) pick.style.display = 'none'; }, true);

  /* دکمه‌ها را دقیقاً کنار دکمهٔ موزیک و لب‌به‌لب کارت‌ها می‌چینیم */
  function place() {
    const mb = $$('musicBar'); let bottom = 74, left = 52;
    if (mb) { const r = mb.getBoundingClientRect(); if (r.width) { bottom = innerHeight - r.bottom; left = r.right + 6; } }
    emo.style.left = left + 'px'; emo.style.bottom = bottom + 'px';
    let bb = bottom;
    const ex = $$('ex'); // دکمهٔ «برگشت/خروج» حکم گوشهٔ پایین-راست است؛ اگر روی هم افتادند، گزینه‌ها را بالای آن می‌گذاریم
    if (ex && ex.offsetWidth) { const x = ex.getBoundingClientRect(), top = innerHeight - bottom - 36; if (x.bottom > top && x.top < innerHeight - bottom && x.right > innerWidth - 170) bb = innerHeight - x.top + 4; }
    box.style.right = '8px'; box.style.bottom = bb + 'px';
    pick.style.left = Math.max(4, left - 6) + 'px'; pick.style.bottom = (bottom + 42) + 'px';
  }
  const playing = () => { if (!hasSt()) return false; return GAME === 'mf' ? !!(st.g && (st.g.phase === 'play' || st.g.phase === 'trick')) : (st.ph === 'play' || st.ph === 'tr'); };
  function upd() {
    const inG = document.body.classList.contains('ingame') && hasSt() && !st.isSpec;
    emo.style.display = inG ? 'block' : 'none';
    if (!inG) pick.style.display = 'none';
    const pl = inG && playing();
    box.style.display = pl ? 'flex' : 'none';
    if (!pl && sel) { sel = 0; }
    if (pl || sel === 0) paintBtns();
    if (inG) place();
  }
  setInterval(upd, 500); window.addEventListener('resize', upd); upd();

  /* ---------- نمایش برای همه ---------- */
  function seatEl(seat) {
    if (!hasSt()) return null; const rel = (((seat - (st.me | 0)) % 4) + 4) % 4;
    return GAME === 'mf' ? document.querySelector('#tbl .st.p' + rel) : $$('s' + rel);
  }
  const relOf = seat => (((seat - (hasSt() ? (st.me | 0) : 0)) % 4) + 4) % 4;
  const chips = {};
  function chip(seat, html, cls, life, color) {
    const el = seatEl(seat); if (!el) return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    let c = chips[seat];
    if (!c || !c.isConnected) {
      c = chips[seat] = document.createElement('div'); c.className = 'sgC'; document.body.appendChild(c);
    }
    c.style.left = (r.left + r.width / 2) + 'px';
    if (relOf(seat) === 0) { c.style.top = 'auto'; c.style.bottom = (innerHeight - r.top + (GAME === 'mf' ? 26 : 2)) + 'px'; }
    else { c.style.bottom = 'auto'; c.style.top = (r.bottom + 2) + 'px'; }
    const it = document.createElement('div'); it.className = cls; it.innerHTML = html;
    it.style.setProperty('--d', (life - 600) + 'ms'); if (color) it.style.setProperty('--c', color);
    c.appendChild(it);
    setTimeout(() => { it.remove(); if (!c.children.length) c.remove(); }, life);
  }
  function showEmoji(seat, k) {
    if (!EMO[k]) return;
    const old = chips[seat]; if (old) old.querySelectorAll('.sgI').forEach(x => x.remove());
    chip(seat, EMO[k], 'sgI', 4000);
  }
  function tableCenter() {
    const t = $$('tbl') || document.body, r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function fx(seat, k) {
    const el = seatEl(seat); if (!el) return; const r = el.getBoundingClientRect(), t = tableCenter();
    const sx = r.left + r.width / 2, sy = r.top + r.height / 2, vx = t.x - sx, vy = t.y - sy, d = Math.hypot(vx, vy) || 1;
    const x0 = sx + vx / d * Math.min(d * .35, 60), y0 = sy + vy / d * Math.min(d * .35, 60);
    const mk = (cls, dl, extra) => { const e = document.createElement('div'); e.className = cls; e.style.left = x0 + 'px'; e.style.top = y0 + 'px'; e.style.setProperty('--dl', dl + 's'); Object.keys(extra).forEach(n => e.style.setProperty(n, extra[n])); document.body.appendChild(e); setTimeout(() => e.remove(), 1500 + dl * 1000 + 80); };
    if (k === 1) { mk('sgRing', 0, { '--dx': vx * .45 + 'px', '--dy': vy * .45 + 'px' }); mk('sgRing', .3, { '--dx': vx * .45 + 'px', '--dy': vy * .45 + 'px' }); }
    else { const a = Math.atan2(vy, vx) + 'rad', dist = Math.min(d * .7, 170) + 'px'; mk('sgBeam', 0, { '--a': a, '--dist': dist }); mk('sgBeam', .18, { '--a': a, '--dist': dist }); }
  }
  function showSig(seat, k) {
    if (k !== 1 && k !== 2) return;
    const old = chips[seat]; if (old) old.querySelectorAll('.sgT').forEach(x => x.remove());
    chip(seat, TXT[k][0], 'sgT', 3000, k === 1 ? '#7cc0ff' : '#ffd76a');
    fx(seat, k);
  }
  sk.on('react', d => { try { if (d) showEmoji(d.s | 0, d.k | 0); } catch (e) { } });
  sk.on('tphv', d => { try { if (d) showSig(d.s | 0, d.k | 0); } catch (e) { } });

  /* برداشتن علامت انتخاب‌شده هنگام انداختن کارت (فقط یک بار) */
  window.SGN = { take() { const k = sel; if (k) { sel = 0; flash = 0; paintBtns(); } return k; } };
})();
