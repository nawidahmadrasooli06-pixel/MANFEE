/* تم «دوزخ»: پس‌زمینهٔ زنده، ورود دو ثانیه‌ای و جرقهٔ دکمه‌ها — فقط روی منوها و لابی‌های منفی و حکم */
(function () {
  try {
    const body = document.body, FK = body.classList.contains('pg-fk');
    if (!FK && !body.classList.contains('pg-mf')) return;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    const low = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 2;
    const IDS = FK ? ['menu', 'lobby'] : ['menu', 'about', 'guide', 'join', 'invite', 'lobby', 'pick', 'expired'];
    let uid = 0;
    const emblem = cls => {
      const k = 'e' + (++uid);
      return `<svg class="${cls}" viewBox="0 0 120 124" aria-hidden="true"><defs>
<linearGradient id="${k}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1410"/><stop offset="1" stop-color="#0c0404"/></linearGradient>
<linearGradient id="${k}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a8"/><stop offset=".5" stop-color="#ff9a3a"/><stop offset="1" stop-color="#d8350f"/></linearGradient>
<linearGradient id="${k}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd890"/><stop offset="1" stop-color="#ff5a1f"/></linearGradient></defs>
<path d="M60 6C60 6 12 44 12 76C12 95 27 103 40 103C48 103 55 99 58 93L55 118L65 118L62 93C65 99 72 103 80 103C93 103 108 95 108 76C108 44 60 6 60 6Z" fill="url(#${k}s)" stroke="url(#${k}r)" stroke-width="3.5" stroke-linejoin="round"/>
<g fill="url(#${k}c)"><rect x="53" y="38" width="14" height="58" rx="7"/><path d="M53 70H44a6 6 0 0 1-6-6V52a6 6 0 0 1 12 0V60H53Z"/><path d="M67 62H76a6 6 0 0 0 6-6V46a6 6 0 0 0-12 0V50H67Z"/></g></svg>`;
    };

    /* ---- لوگوی کاکتوس‌پیک بالای منو ---- */
    const menu = document.getElementById('menu'), logo = menu && menu.querySelector('.logo');
    if (logo) logo.insertAdjacentHTML('beforebegin', emblem('infEmblem'));

    /* ---- پس‌زمینهٔ زنده ---- */
    const cv = document.createElement('canvas'); cv.id = 'infFx';
    cv.style.zIndex = FK ? '19' : '0';
    body.insertBefore(cv, body.firstChild);
    const cx = cv.getContext('2d'); if (!cx) return;
    let W = 0, H = 0, dpr = 1, crack = null, smoke = null, run = false, last = 0, B = 0;
    const embers = [], N = low ? 16 : 32, rnd = (a, b) => a + Math.random() * (b - a);
    const mkEmber = (init) => ({ x: rnd(0, W), y: init ? rnd(0, H) : H + rnd(0, 40), v: rnd(14, 46) * dpr, r: rnd(.8, 2.4) * dpr, ph: rnd(0, 6.3), sp: rnd(.6, 1.6) });

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, low ? 1 : 1.5);
      W = cv.width = Math.round(innerWidth * dpr); H = cv.height = Math.round(innerHeight * dpr);
      crack = document.createElement('canvas'); crack.width = W; crack.height = H;
      const g = crack.getContext('2d');
      const fl = g.createRadialGradient(W / 2, H * 1.08, 0, W / 2, H * 1.08, H * .75);
      fl.addColorStop(0, 'rgba(255,90,30,.42)'); fl.addColorStop(.5, 'rgba(160,30,10,.18)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fl; g.fillRect(0, 0, W, H);
      const path = (x, y, len, ang, depth) => {
        const pts = [[x, y]]; let cx2 = x, cy2 = y, a = ang;
        for (let i = 0; i < len; i++) { a += rnd(-.55, .55); cx2 += Math.cos(a) * rnd(10, 26) * dpr; cy2 += Math.sin(a) * rnd(10, 26) * dpr; pts.push([cx2, cy2]); if (depth < 2 && Math.random() < .22) path(cx2, cy2, Math.floor(len / 2), a + rnd(-1, 1), depth + 1); }
        [[11 * dpr, 'rgba(255,60,20,.07)'], [5 * dpr, 'rgba(255,100,40,.2)'], [1.6 * dpr, 'rgba(255,214,150,.85)']].forEach(([w, c]) => {
          g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
          g.lineWidth = w; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
        });
      };
      const n = low ? 4 : 6;
      for (let i = 0; i < n; i++) path(rnd(.08, .92) * W, H * rnd(.98, 1.04), Math.floor(rnd(9, 17)), -Math.PI / 2 + rnd(-.5, .5), 0);
      smoke = document.createElement('canvas'); smoke.width = smoke.height = 256;
      const s = smoke.getContext('2d'), sg = s.createRadialGradient(128, 128, 0, 128, 128, 128);
      sg.addColorStop(0, 'rgba(70,24,16,.38)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); s.fillStyle = sg; s.fillRect(0, 0, 256, 256);
      embers.length = 0; for (let i = 0; i < N; i++) embers.push(mkEmber(true));
    }

    function visible() { return IDS.some(id => { const e = document.getElementById(id); return e && getComputedStyle(e).display !== 'none'; }); }

    function beat() {
      const an = window.bgAnalyser, au = window.bgAudio;
      let v = 0;
      if (an && au && !au.paused) { const a = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(a); let s = 0; for (let i = 0; i < 6; i++) s += a[i]; v = s / (6 * 255); }
      B += (v - B) * .25; document.documentElement.style.setProperty('--beat', B.toFixed(3));
    }

    function frame(now) {
      if (!run) return;
      requestAnimationFrame(frame);
      if (now - last < 33) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now; const t = now / 1000;
      beat();
      const bg = cx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#050202'); bg.addColorStop(1, '#140706');
      cx.globalCompositeOperation = 'source-over'; cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
      cx.globalAlpha = Math.min(1, .55 + .22 * Math.sin(t * 1.25) + B * .5); cx.drawImage(crack, 0, 0); cx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { const sz = H * (.7 + i * .15), x = (Math.sin(t * .09 + i * 2) * .5 + .5) * (W - sz * .4) - sz * .3, y = H - sz * .8 + Math.sin(t * .13 + i) * H * .04; cx.globalAlpha = .75; cx.drawImage(smoke, x, y, sz, sz); }
      cx.globalAlpha = 1; cx.globalCompositeOperation = 'lighter';
      for (const e of embers) {
        e.y -= e.v * dt; e.x += Math.sin(t * e.sp + e.ph) * 14 * dt * dpr;
        if (e.y < -10) Object.assign(e, mkEmber(false));
        const life = Math.max(0, e.y / H), a = (.25 + .6 * life) * (.6 + .4 * Math.sin(t * 6 * e.sp + e.ph));
        cx.fillStyle = `rgba(255,${Math.floor(90 + 140 * life)},${Math.floor(30 + 40 * life)},${a.toFixed(3)})`;
        cx.beginPath(); cx.arc(e.x, e.y, e.r * (1 + B), 0, 6.283); cx.fill();
      }
      cx.globalCompositeOperation = 'source-over';
    }

    function sync() {
      const v = visible();
      if (v && !run) { cv.style.display = 'block'; run = true; last = 0; if (reduce) { run = true; frame(performance.now()); run = false; } else requestAnimationFrame(frame); }
      else if (!v && run) { run = false; cv.style.display = 'none'; }
      else if (!v) cv.style.display = 'none';
    }

    build(); body.classList.add('inf-ok');
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) run = false; else sync(); });
    setInterval(sync, 350); sync();

    /* ---- جرقهٔ لمس دکمه‌ها ---- */
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest && e.target.closest('.scr:not(#game) .btn'); if (!b || b.disabled || reduce || !visible()) return;
      for (let i = 0; i < 7; i++) {
        const s = document.createElement('i'); s.className = 'infSpark'; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
        const a = rnd(0, 6.283), d = rnd(14, 38); s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d - 10 + 'px');
        document.body.appendChild(s); setTimeout(() => s.remove(), 500);
      }
    }, true);

    /* ---- ورود دو ثانیه‌ای (یک بار در هر بار باز کردن ربات؛ در لینک دعوت و تماشا نمایش داده نمی‌شود) ---- */
    let seen = false; try { seen = sessionStorage.getItem('inf_splash') === '1'; } catch (e) { }
    const deep = /[?&](r|room|watch|w|invite)=/.test(location.search);
    if (!seen && !deep && !reduce) {
      try { sessionStorage.setItem('inf_splash', '1'); } catch (e) { }
      const sp = document.createElement('div'); sp.id = 'infSplash';
      sp.innerHTML = '<div class="fan">' + [-44, -22, 0, 22, 44].map(r => `<i style="--r:${r}deg"></i>`).join('') + '</div>' + emblem('em') + '<div class="tt">VIP · CACTUC</div>';
      const kill = () => sp.remove(); sp.addEventListener('pointerdown', kill); setTimeout(kill, 2200);
      body.appendChild(sp);
    }
  } catch (e) { console.log('inferno fx off', e); }
})();
