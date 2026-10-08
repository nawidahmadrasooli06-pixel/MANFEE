const T = (() => {
  const SU = ['♠', '♥', '♦', '♣'], RK = '2 3 4 5 6 7 8 9 10 J Q K A'.split(' ');
  const $ = q => document.querySelector(q);
  const cd = (c, x = '') => { const s = c / 13 | 0; return `<div class="c ${s == 1 || s == 2 ? 'r' : ''} ${s == 1 ? 'heart' : ''} ${x}"><em>${RK[c % 13]}</em><b>${SU[s]}</b></div>`; };
  let S, pl = 0, nid = 0, v = 2, tm, rid = -1, lastTk = 0, lastCount = -1, myTurn = false, drag = null, sel = null, pending = null;
  function toast(m) { const t = $('#ts'); t.textContent = m; t.style.display = 'block'; clearTimeout(tm); tm = setTimeout(() => t.style.display = 'none', 2800); }
  function render(st) { pending = null; draw(st); }
  function mirReviewOverlay(st) {
    let el = document.getElementById('manfee-mir-review-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'manfee-mir-review-overlay';
      el.innerHTML = '<div class=\"manfee-mir-review-card\"><div class=\"manfee-mir-review-title\"></div><div class=\"manfee-mir-review-sub\">پرت‌های خودت را مرور کن</div><div class=\"manfee-mir-review-note\">خوب به خاطر بسپار؛ دست قرار است بچرخد</div></div>';
      const style = document.createElement('style');
      style.id = 'manfee-mir-review-style';
      style.textContent = `
        #manfee-mir-review-overlay{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;pointer-events:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;}
        #manfee-mir-review-overlay .manfee-mir-review-card{min-width:245px;max-width:88vw;text-align:center;padding:20px 24px;border-radius:22px;background:rgba(0,0,0,.66);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);color:#fff;box-shadow:0 12px 45px rgba(0,0,0,.38);}
        #manfee-mir-review-overlay .manfee-mir-review-title{font-size:78px;line-height:.95;font-weight:900;font-variant-numeric:tabular-nums;}
        #manfee-mir-review-overlay .manfee-mir-review-sub{margin-top:12px;font-size:21px;font-weight:900;}
        #manfee-mir-review-overlay .manfee-mir-review-note{margin-top:7px;font-size:16px;font-weight:600;opacity:.94;}
      `;
      (document.head || document.documentElement).appendChild(style);
      document.body.appendChild(el);
    }
    const active = !!(st && st.g && st.g.phase === 'mirReview');
    if (active) {
      const n = Math.max(1, Number(st.g.mirReview) || 15);
      el.querySelector('.manfee-mir-review-title').textContent = String(n);
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  }

  function draw(st) {
    S = st; mirReviewOverlay(st); const g = st.g, me = st.me, mt = me % 2, rel = s => (s - me + 4) % 4, name = s => st.seats[s].name, my = g.phase == 'play' && g.turn == me;
    if (g.rid != rid) { rid = g.rid; if (g.phase == 'deal') for (let i = 0; i < 13; i++) setTimeout(SND.deal, 500 + i * 180); }
    if (g.trick.length > pl) SND.card();
    const tk = g.taken.reduce((a, b) => a + b, 0); if (tk > lastTk) SND.win(); lastTk = tk;
    if (my && !myTurn) SND.ping(); myTurn = my;
    const pill = (t, l) => `<div class="pl ${t == mt ? 'm' : 'e'}">${l} · سری ${g.ser[t]} از ۵ · ${g.taken[t] + g.taken[t + 2]}/${g.tc ? g.tc[t] : '؟'}</div>`;
    $('#hud').innerHTML = pill(mt, 'ما') + pill(1 - mt, 'حریف') + `<button class="ib" onclick="V.toggle()">${V.live() ? '🎙️' : '🔇'}</button><button class="ib" onclick="T.snd()">${SND.muted() ? '🔕' : '🔊'}</button>`;
    let h = '';
    for (let s = 0; s < 4; s++) {
      const x = st.seats[s], on = (g.phase == 'play' && g.turn == s) || (g.phase == 'bid' && g.bidTurn == s), c = g.claims[s];
      const tag = x.off ? '<i class="o">قطع</i>' : x.sub ? '<i class="o">ربات</i>' : '';
      h += `<div class="st p${rel(s)} ${on ? 'on' : ''} ${s % 2 == mt ? 'm' : 'e'}">${g.dealer == s ? '<i>میر</i>' : ''}${tag}<u>${x.name}</u><b>${g.taken[s]}/${c == null ? '؟' : c}</b></div>`;
    }
    h += '<div class="ctr">' + g.trick.map((x, i) => `<div class="q q${rel(x.s)} ${i >= pl ? 'in' : ''} ${g.win == x.s ? 'w' : ''}">${cd(x.c)}</div>`).join('') + '</div>';
    pl = g.trick.length;
    if (g.last) h += `<div class="lt"><small>دست قبل</small><div class="ctr2">${g.last.cards.map(x => `<div class="q q${rel(x.s)} ${g.last.w == x.s ? 'w' : ''}">${cd(x.c)}</div>`).join('')}</div></div>`;
    $('#tbl').innerHTML = h + '<div id="wm">CACTUC</div>';
    if (sel != null && !g.hand.includes(sel)) sel = null;
    if (!drag) $('#hand').innerHTML = g.hand.filter(c => c != pending).map((c, i) => `<span data-c="${c}" style="--i:${i}" class="${g.phase == 'deal' ? 'dl' : ''} ${sel == c ? 'sel' : ''}">${cd(c, my && !g.legal.includes(c) ? 'dim' : '')}</span>`).join('');
    if (g.nid != nid) { nid = g.nid; if (g.note) { toast(g.note); SND.swap(); $('#hand').classList.add('sw'); setTimeout(() => $('#hand').classList.remove('sw'), 800); } }
    const away = st.away || [];
    $('#aw').innerHTML = away.map(a => `<div class="aw">${a.name} قطع شد<br><button onclick="act('sub',${a.i})">ربات جایش بازی کند</button><button onclick="T.hold(${a.i})">منتظر می‌مانیم</button></div>`).join('');
    let p = '';
    if (g.phase == 'bid' && g.bidTurn == me) { v = Math.min(2, g.bidMax); p = `ادعای تو:<button onclick="T.ch(-1)">−</button><span class="big" id="bv">${v}</span><button onclick="T.ch(1)">+</button><br><button class="go" onclick="act('bid',T.val())">ثبت ادعا</button>`; }
    else if (g.phase == 'bid') p = `نوبت ادعای ${name(g.bidTurn)}…`;
    else if (g.phase == 'mir' && g.dealer == me) p = `تو میر هستی؛ ادعای باقی‌مانده برای تو: <span class="big">${g.claims[me]}</span><br><button class="go" onclick="act('mir','ok')">قبول</button><button onclick="act('mir','swap')">بچرخون</button>`;
    else if (g.phase == 'mir') p = `${name(g.dealer)} (میر) تصمیم می‌گیرد: قبول یا چرخاندن…`;
    else if (g.phase == 'play' || g.phase == 'trick') p = my ? 'نوبت توست' : `نوبت ${name(g.turn)}`;
    $('#pn').innerHTML = p;
    let o = '';
    if (g.phase == 'countdown') o = `<div class="bn count"><small>بازی شروع می‌شود</small><big>${g.countdown > 0 ? g.countdown : 'شروع!'}</big></div>`;
    const rev = g.rem && g.rem.some(h => h.length) ? `<small>پرهای باقی‌مانده</small><div class="rvl">${[0, 1, 2, 3].map(k => { const q = (me + k) % 4; return `<div class="rr ${q % 2 == mt ? 'm' : 'e'}"><u>${name(q)}</u><div class="rc">${g.rem[q].map(c => cd(c)).join('')}</div></div>`; }).join('')}</div>` : '';
    if (g.phase == 'deal') o = `<div class="bn"><small>میر این دست</small><big>${name(g.dealer)}</big></div>`;
    if (g.phase == 'over') o = `<div class="bn sm"><big>${g.res < 0 ? 'مساوی! هر دو تیم به ادعایشان رسیدند' : `تیم ${g.teams[g.res].join(' و ')} این دست را برد`}</big>${rev}</div>`;
    if (g.phase == 'series') { const wt = g.ser[0] >= 5 ? 0 : 1; o = `<div class="bn"><small>بازی به پایان رسید</small><big>🏆 تیم ${g.teams[wt].join(' و ')} برنده شد</big><small>نتیجه سری: ${g.ser[0]} – ${g.ser[1]}</small>${rev}<button class="go" onclick="act('again')">بازی مجدد</button></div>`; }
    $('#ov').innerHTML = o;
  }
  // drag a card up to the table to play it; a tap only lifts it for a closer look
  const HD = $('#hand');
  HD.addEventListener('pointerdown', e => {
    const el = e.target.closest('span[data-c]'); if (!el || !S) return;
    e.preventDefault(); drag = { c: +el.dataset.c, el, x: e.clientX, y: e.clientY, mv: false }; el.classList.add('lift');
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.mv && Math.abs(dx) + Math.abs(dy) < 10) return;
    drag.mv = true; drag.el.style.transform = `translate(${dx}px,${dy - 22}px) scale(1.1)`;
  });
  window.addEventListener('pointerup', e => {
    if (!drag) return; const d = drag, dy = e.clientY - d.y; drag = null;
    if (!d.mv) sel = sel == d.c ? null : d.c;
    else if (dy < -55) {
      const g = S.g;
      if (g.phase == 'play' && g.turn == S.me && g.legal.includes(d.c)) { pending = d.c; sel = null; act('play', d.c); }
      else toast(g.phase == 'play' && g.turn == S.me ? 'این پر را نمی‌توانی بیندازی؛ باید هم‌خال بیندازی' : 'هنوز نوبت تو نیست');
    }
    draw(S);
  });
  window.addEventListener('pointercancel', () => { if (drag) { drag = null; draw(S); } });
  return {
    render, val: () => v, ch: d => { v = Math.max(0, Math.min(S.g.bidMax, v + d)); $('#bv').textContent = v; },
    hold: i => { const els = document.querySelectorAll('#aw .aw'); els.forEach(e => { if (e.textContent.includes((S.seats[i] || {}).name || '')) e.remove(); }); }, mic: () => S && draw(S), snd: () => { SND.toggle(); S && draw(S); }
  };
})();

