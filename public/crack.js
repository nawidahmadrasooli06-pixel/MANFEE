/* افکت «رنگ زدن»: لرزش خیلی کوچک + شکستن شیشهٔ صفحه وسط تخته؛ ۳ ثانیه می‌ماند و آهسته محو می‌شود.
   فقط ظاهر است و به منطق بازی ربطی ندارد. فراخوانی: crackFx() */
(function () {
  if (window.crackFx) return;
  const st = document.createElement('style');
  st.textContent = `
#crackFx{position:fixed;inset:0;z-index:99990;pointer-events:none;animation:ckLife 4.2s linear forwards}
#crackFx svg{position:absolute;inset:0;width:100%;height:100%;animation:ckHit .22s cubic-bezier(.2,.9,.3,1) both}
#crackFx .fl{position:absolute;inset:0;animation:ckFlash .5s ease-out forwards}
@keyframes ckLife{0%{opacity:1}71%{opacity:1;filter:none}100%{opacity:0;filter:blur(1.6px)}}
@keyframes ckHit{from{transform:scale(1.045)}to{transform:none}}
@keyframes ckFlash{0%{opacity:.9}100%{opacity:0}}
@keyframes ckShake{0%{translate:0 0}15%{translate:-3px 2px}32%{translate:3px -2px}50%{translate:-2px -1px}68%{translate:2px 1px}84%{translate:-1px 1px}100%{translate:0 0}}
.ckShake{animation:ckShake .32s ease-out!important}`;
  document.head.appendChild(st);
  const rnd = (a, b) => a + Math.random() * (b - a);
  let last = 0;

  function geometry(cx, cy, W, H) {
    const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.06;
    const n = 12 + Math.floor(Math.random() * 4), base = Math.random() * 6.283, sec = 6.283 / n;
    const rays = [];
    for (let i = 0; i < n; i++) {
      let a = base + i * sec + rnd(-.35, .35) * sec, r = 0; const pts = [{ r: 0, x: cx, y: cy }];
      while (r < R) { r += rnd(16, 46); a += rnd(-.045, .045); pts.push({ r, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a }); }
      rays.push(pts);
    }
    const at = (pts, r) => { for (let i = 1; i < pts.length; i++) if (pts[i].r >= r) { const p = pts[i - 1], q = pts[i], t = (r - p.r) / (q.r - p.r || 1); return [p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t]; } const q = pts[pts.length - 1]; return [q.x, q.y]; };
    const f = v => v.toFixed(1);
    let main = '', web = '', br = '', shards = '';
    rays.forEach(p => { main += 'M' + p.map(q => f(q.x) + ' ' + f(q.y)).join('L'); });
    const rings = [.06, .13, .23, .36, .52, .72].map(k => k * R);
    for (let k = 0; k < rings.length; k++) for (let i = 0; i < n; i++) {
      const A = rays[i], B = rays[(i + 1) % n], ra = rings[k] * rnd(.94, 1.06), rb = rings[k] * rnd(.94, 1.06);
      if (Math.random() < .86) {
        const a = at(A, ra), b = at(B, rb), m = [(a[0] + b[0]) / 2 + rnd(-7, 7), (a[1] + b[1]) / 2 + rnd(-7, 7)];
        web += `M${f(a[0])} ${f(a[1])}L${f(m[0])} ${f(m[1])}L${f(b[0])} ${f(b[1])}`;
      }
      if (k > 0 && Math.random() < .55) {
        const p1 = at(A, rings[k - 1]), p2 = at(A, rings[k]), p3 = at(B, rings[k]), p4 = at(B, rings[k - 1]);
        shards += `M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}L${f(p3[0])} ${f(p3[1])}L${f(p4[0])} ${f(p4[1])}Z`;
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) {
      const A = rays[i], r0 = rnd(.08, .55) * R, s = at(A, r0); let ang = (A[Math.min(A.length - 1, 3)].a || 0) + (Math.random() < .5 ? -1 : 1) * rnd(.35, 1), x = s[0], y = s[1];
      br += `M${f(x)} ${f(y)}`; const L = Math.floor(rnd(3, 6));
      for (let q = 0; q < L; q++) { ang += rnd(-.3, .3); const d = rnd(10, 30); x += Math.cos(ang) * d; y += Math.sin(ang) * d; br += `L${f(x)} ${f(y)}`; }
    }
    return { main, web, br, shards };
  }

  window.crackFx = function () {
    try {
      const now = Date.now(); if (now - last < 600) return; last = now;
      const old = document.getElementById('crackFx'); if (old) old.remove();
      const W = innerWidth, H = innerHeight;
      let cx = W / 2, cy = H * .47;
      const c = document.querySelector('#tbl .ctr, .ctr'); if (c) { const r = c.getBoundingClientRect(); if (r.width > 0 && r.height > 0) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; } }
      const g = geometry(cx, cy, W, H);
      const el = document.createElement('div'); el.id = 'crackFx';
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><linearGradient id="ckg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".07"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#ckg)"/>
<path d="${g.shards}" fill="#fff" fill-opacity=".075"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<g stroke="#000" stroke-opacity=".5" transform="translate(1.2 1.4)"><path d="${g.main}" stroke-width="2.6"/><path d="${g.web}" stroke-width="1.8"/><path d="${g.br}" stroke-width="1.6"/></g>
<path d="${g.web}" stroke="#fff" stroke-opacity=".78" stroke-width="1"/>
<path d="${g.br}" stroke="#fff" stroke-opacity=".7" stroke-width=".9"/>
<path d="${g.main}" stroke="#fff" stroke-opacity=".95" stroke-width="1.5"/></g></svg>
<div class="fl" style="background:radial-gradient(circle at ${cx}px ${cy}px,#ffffffd9 0,#ffffff55 55px,#0000 230px)"></div>`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4400);
      if (!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches)) {
        ['game', 'tbl', 'hand'].forEach(id => { const t = document.getElementById(id); if (t) { t.classList.remove('ckShake'); void t.offsetWidth; t.classList.add('ckShake'); setTimeout(() => t.classList.remove('ckShake'), 360); } });
      }
    } catch (e) { }
  };
})();
