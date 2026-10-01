const T = (() => {
  const SU = ['♠', '♥', '♦', '♣'], RK = '2 3 4 5 6 7 8 9 10 J Q K A'.split(' ');
  const $ = q => document.querySelector(q);
  const cd = (c, x = '') => { const s = c / 13 | 0; return `<div class="c ${s == 1 || s == 2 ? 'r' : ''} ${x}"><span>${RK[c % 13]}</span><b>${SU[s]}</b></div>`; };
  let S, pl = 0, nid = 0, v = 2, tm;
  function toast(m) { const t = $('#ts'); t.textContent = m; t.style.display = 'block'; clearTimeout(tm); tm = setTimeout(() => t.style.display = 'none', 2800); }
  function render(st) {
    S = st; const g = st.g, me = st.me, mt = me % 2, rel = s => (s - me + 4) % 4, name = s => st.seats[s].name;
    const pill = (t, l) => `<div class="pl ${t == mt ? 'm' : 'e'}">${l} · سری ${g.ser[t]} از ۵ · ${g.taken[t] + g.taken[t + 2]}/${g.tc ? g.tc[t] : '؟'}</div>`;
    $('#hud').innerHTML = pill(mt, 'ما') + pill(1 - mt, 'حریف');
    let h = '';
    for (let s = 0; s < 4; s++) {
      const on = (g.phase == 'play' && g.turn == s) || (g.phase == 'bid' && g.bidTurn == s), c = g.claims[s];
      h += `<div class="st p${rel(s)} ${on ? 'on' : ''} ${s % 2 == mt ? 'm' : 'e'}">${g.dealer == s ? '<i>میر</i>' : ''}<u>${name(s)}</u><b>${g.taken[s]}/${c == null ? '؟' : c}</b></div>`;
    }
    h += '<div class="ctr">' + g.trick.map((x, i) => `<div class="q q${rel(x.s)} ${i >= pl ? 'in' : ''} ${g.win == x.s ? 'w' : ''}">${cd(x.c)}</div>`).join('') + '</div>';
    pl = g.trick.length;
    if (g.last) h += `<div class="lt"><small>دست قبل</small><div class="ctr2">${g.last.cards.map(x => `<div class="q q${rel(x.s)} ${g.last.w == x.s ? 'w' : ''}">${cd(x.c)}</div>`).join('')}</div></div>`;
    $('#tbl').innerHTML = h + '<div id="wm">CACTUC</div>';
    const my = g.phase == 'play' && g.turn == me;
    $('#hand').innerHTML = g.hand.map((c, i) => `<span style="--i:${i}" class="${g.phase == 'deal' ? 'dl' : ''}" onclick="act('play',${c})">${cd(c, my && !g.legal.includes(c) ? 'dim' : '')}</span>`).join('');
    if (g.nid != nid) { nid = g.nid; if (g.note) { toast(g.note); $('#hand').classList.add('sw'); setTimeout(() => $('#hand').classList.remove('sw'), 800); } }
    let p = '';
    if (g.phase == 'bid' && g.bidTurn == me) { v = Math.min(2, g.bidMax); p = `ادعای تو:<button onclick="T.ch(-1)">−</button><span class="big" id="bv">${v}</span><button onclick="T.ch(1)">+</button><br><button class="go" onclick="act('bid',T.val())">ثبت ادعا</button>`; }
    else if (g.phase == 'bid') p = `نوبت ادعای ${name(g.bidTurn)}…`;
    else if (g.phase == 'mir' && g.dealer == me) p = `تو میر هستی؛ ادعای باقی‌مانده برای تو: <span class="big">${g.claims[me]}</span><br><button class="go" onclick="act('mir','ok')">قبول</button><button onclick="act('mir','swap')">بچرخون</button>`;
    else if (g.phase == 'mir') p = `${name(g.dealer)} (میر) تصمیم می‌گیرد: قبول یا چرخاندن…`;
    else if (g.phase == 'play' || g.phase == 'trick') p = my ? 'نوبت توست' : `نوبت ${name(g.turn)}`;
    $('#pn').innerHTML = p;
    let o = '';
    if (g.phase == 'deal') o = `<div class="bn"><small>میر این دست</small><big>${name(g.dealer)}</big></div>`;
    else if (g.phase == 'over') o = `<div class="bn sm"><big>${g.res < 0 ? 'مساوی! هر دو تیم به ادعایشان رسیدند' : g.res == mt ? 'حریف منفی شد — ۱۳ به ۰ 🎉' : 'ما منفی شدیم — ۰ به ۱۳'}</big></div>`;
    else if (g.phase == 'series') o = `<div class="bn"><big>${g.ser[mt] >= 5 ? 'تیم ما بازی را برد! 🏆' : 'حریف بازی را برد'}</big><small>${g.ser[mt]} – ${g.ser[1 - mt]}</small><button class="go" onclick="act('again')">بازی جدید</button></div>`;
    $('#ov').innerHTML = o;
  }
  return { render, val: () => v, ch: d => { v = Math.max(0, Math.min(S.g.bidMax, v + d)); $('#bv').textContent = v; } };
})();
