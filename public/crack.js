/* افکت «رنگ زدن»: لرزش خیلی کوچک + شکستن شیشهٔ صفحه وسط تخته؛ ۳ ثانیه می‌ماند و آهسته محو می‌شود.
   فقط ظاهر است و به منطق بازی ربطی ندارد. فراخوانی: crackFx() */
(function () {
  if (window.crackFx) return;
  const st = document.createElement('style');
  st.textContent = `
#crackFx{position:fixed;inset:0;z-index:99990;pointer-events:none;animation:ckLife 2.15s ease-out forwards}
#crackFx svg{position:absolute;inset:0;width:100%;height:100%;animation:ckHit .18s cubic-bezier(.2,.9,.3,1) both}
#crackFx .fl{position:absolute;inset:0;animation:ckFlash .5s ease-out forwards}
@keyframes ckLife{0%{opacity:1}28%{opacity:.88;filter:none}100%{opacity:0;filter:blur(.7px)}}
@keyframes ckHit{from{transform:scale(1.018)}to{transform:none}}
@keyframes ckFlash{0%{opacity:.9}100%{opacity:0}}
@keyframes ckShake{0%{translate:0 0}15%{translate:-3px 2px}32%{translate:3px -2px}50%{translate:-2px -1px}68%{translate:2px 1px}84%{translate:-1px 1px}100%{translate:0 0}}
.ckShake{animation:ckShake .28s ease-out!important}`;
  document.head.appendChild(st);
  const rnd = (a, b) => a + Math.random() * (b - a);
  let last = 0;

  function geometry(cx, cy, W, H) {
    // One restrained impact pattern: a few long, fine cracks like the supplied reference.
    const R = Math.min(Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * .78, Math.max(W, H) * .66);
    const n = 6, base = rnd(-.22, .22), sec = 6.283 / n;
    const f = v => v.toFixed(1);
    let main = '', br = '';
    for (let i = 0; i < n; i++) {
      let a = base + i * sec + rnd(-.12, .12), x = cx, y = cy;
      main += `M${f(cx)} ${f(cy)}`;
      const steps = 4;
      for (let j = 1; j <= steps; j++) {
        const r = R * j / steps * rnd(.92, 1.02);
        a += rnd(-.035, .035);
        x = cx + Math.cos(a) * r;
        y = cy + Math.sin(a) * r;
        main += `L${f(x)} ${f(y)}`;
      }
      // Only a few short side branches near the impact point.
      if (i % 2 === 0) {
        const r0 = R * rnd(.18, .34);
        const sx = cx + Math.cos(a) * r0, sy = cy + Math.sin(a) * r0;
        const side = a + (i % 4 === 0 ? 1 : -1) * rnd(.45, .78);
        const len = R * rnd(.10, .17);
        br += `M${f(sx)} ${f(sy)}L${f(sx + Math.cos(side) * len)} ${f(sy + Math.sin(side) * len)}`;
      }
    }
    return { main, web: '', br, shards: '' };
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


<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<g stroke="#000" stroke-opacity=".5" transform="translate(1.2 1.4)"><path d="${g.main}" stroke-width="1.7"/><path d="${g.web}" stroke-width="1.1"/><path d="${g.br}" stroke-width=".9"/></g>

<path d="${g.br}" stroke="#dff7ff" stroke-opacity=".62" stroke-width=".8"/>
<path d="${g.main}" stroke="#e8f7ff" stroke-opacity=".84" stroke-width="1.05"/></g></svg>
<div class="fl" style="background:radial-gradient(circle at ${cx}px ${cy}px,#ffffff80 0,#ffffff20 24px,#0000 95px)"></div>`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2300);
      if (!(window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches)) {
        ['game', 'tbl', 'hand'].forEach(id => { const t = document.getElementById(id); if (t) { t.classList.remove('ckShake'); void t.offsetWidth; t.classList.add('ckShake'); setTimeout(() => t.classList.remove('ckShake'), 360); } });
      }
    } catch (e) { }
  };
})();
