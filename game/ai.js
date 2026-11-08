'use strict';
// هوش ربات‌ها — مشترک بین منفی و حکم (فیسکوت)
// سطح ۰ = عادی (همان ربات قبلی؛ این فایل را اصلاً صدا نمی‌زند)
// سطح ۱ = متوسط  |  سطح ۲ = قوی
// روش: ربات چند «حدس» از دست‌های پنهان می‌سازد (با توجه به کارت‌های رفته و خالی‌های لو رفته)،
// هر کارت مجاز را روی هر حدس تا آخر دست بازی می‌کند و بهترینِ میانگین را برمی‌دارد.
const smart = require('./smartplay');

const hr = () => Number(process.hrtime.bigint()) / 1e6;
// تنظیمات: N = بیشترین تعداد حدس، minN = کمترین حدس، ms = سقف زمان هر تصمیم
const CFG = {
  play: { 1: { N: 10, minN: 6, ms: 22 }, 2: { N: 36, minN: 14, ms: 85 } },
  est: { 1: 150, 2: 260 },        // تعداد شبیه‌سازی برای ادعا
  delta: { 1: 0, 2: 0 },          // کم‌کردن از ادعا (۰ = ادعای واقعی)
  mirTheta: { 1: 1.0, 2: 1.0 },   // میر وقتی ادعای اجباری از میانگین انتظار بیشتر از این باشد، «بچرخون» می‌زند
  trump: { 1: 24, 2: 70 }         // تعداد شبیه‌سازی برای انتخاب حکم در فیسکوت
};

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

// ---------- ابزار مشترک بازی ----------
const MF = { S: c => c / 13 | 0, R: c => c % 13, T: 0, ALL: [0, 1, 2, 3].map(s => Array.from({ length: 13 }, (_, i) => s * 13 + i)) };
MF.all = s => MF.ALL[s];
MF.cards = [...Array(52).keys()];

function trickWinner(trick, S, R, T) {
  let b = trick[0], sb = S(b.c);
  for (let i = 1; i < trick.length; i++) {
    const x = trick[i], sx = S(x.c);
    if (sx === sb ? R(x.c) > R(b.c) : sx === T) { b = x; sb = sx; }
  }
  return b.p;
}

// ---------- ساخت حدس برای دست‌های پنهان ----------
function sampleHands(unseen, me, need, voids, S) {
  const n = unseen.length;
  const restricted = s => { let k = 0; for (let p = 0; p < 4; p++) if (p !== me && voids[p].has(s)) k++; return k; };
  for (let attempt = 0; attempt < 30; attempt++) {
    const pool = shuffle(unseen.slice());
    pool.sort((a, b) => restricted(S(b)) - restricted(S(a)));
    const rem = need.slice(), out = [[], [], [], []], elig = [0, 0, 0, 0];
    let ok = true;
    for (let i = 0; i < n; i++) {
      const c = pool[i], s = S(c); let tot = 0;
      for (let p = 0; p < 4; p++) { elig[p] = (p !== me && rem[p] > 0 && !voids[p].has(s)) ? rem[p] : 0; tot += elig[p]; }
      if (!tot) { ok = false; break; }
      let x = Math.random() * tot, q = 0;
      for (let p = 0; p < 4; p++) { if (elig[p] > 0) { q = p; if (x < elig[p]) break; x -= elig[p]; } }
      out[q].push(c); rem[q]--;
    }
    if (ok) return out;
  }
  // اگر قیدهای خالی جور درنیامد، بدون آن‌ها پخش کن
  const pool = shuffle(unseen.slice()), rem = need.slice(), out = [[], [], [], []];
  for (const c of pool) { let q = -1; for (let p = 0; p < 4; p++) if (p !== me && rem[p] > 0) { q = p; break; } if (q < 0) break; out[q].push(c); rem[q]--; }
  return out;
}

// ---------- ادامهٔ دست تا آخر (با همان هوش پایهٔ ربات‌ها) ----------
function mustWinFor(ctx, st, seat) {
  const t = seat & 1;
  if (ctx.mode === 'mf') return (ctx.tc[t] - st.tw[t] <= 0) || (ctx.tc[1 - t] - st.tw[1 - t] <= 0);
  return st.tw[t] >= 6 || st.tw[1 - t] >= 6;
}
function terminal(ctx, st) {
  if (ctx.mode === 'mf') {
    for (let t = 0; t < 2; t++) if (st.tw[t] > ctx.tc[t]) return t === ctx.team ? 1 : 0;
    return null;
  }
  for (let t = 0; t < 2; t++) {
    if (st.tw[t] >= 7) {
      const ht = ctx.hk & 1, o = 1 - t; let pts = 1;
      if (t === ht) { if (st.tw[o] === 0) pts = 3; } else if (st.tw[ht] === 0) pts = 7;
      return t === ctx.team ? pts : -pts;
    }
  }
  return null;
}
function rollout(ctx, st) {
  const { S, R, all, T } = ctx;
  let seat = st.seat;
  for (;;) {
    if (st.trick.length === 4) {
      const w = trickWinner(st.trick, S, R, T);
      st.tw[w & 1]++; st.trick = [];
      const v = terminal(ctx, st); if (v !== null) return v;
      seat = w;
    }
    const h = st.hands[seat];
    if (!h.length) return ctx.mode === 'mf' ? 0.5 : 0;
    const led = st.trick.length ? S(st.trick[0].c) : -1;
    let legal = led >= 0 ? h.filter(c => S(c) === led) : h;
    if (!legal.length) legal = h;
    let c;
    if (st.first !== null && seat === ctx.me) { c = st.first; st.first = null; }
    else if (legal.length === 1) c = legal[0];
    else c = smart.choose({ legal, hand: h, trick: st.trick, me: seat, trump: T, S, R, all, played: st.played, voids: st.voids, mustWin: mustWinFor(ctx, st, seat) });
    h.splice(h.indexOf(c), 1);
    if (led >= 0 && S(c) !== led) st.voids[seat].add(led);
    st.played.add(c); st.trick.push({ p: seat, c });
    seat = (seat + 1) & 3;
  }
}

// کارت‌های هم‌ارز (بین‌شان همه رفته‌اند) را یکی می‌کند
function reduceCands(ctx) {
  const { legal, S, R, all, playedPrev } = ctx, bySuit = {};
  legal.forEach(c => (bySuit[S(c)] || (bySuit[S(c)] = [])).push(c));
  const out = [];
  for (const s in bySuit) {
    const g = bySuit[s].sort((a, b) => R(a) - R(b));
    out.push(g[0]);
    for (let i = 1; i < g.length; i++) {
      const a = g[i - 1], b = g[i]; let eq = true;
      for (const x of all(+s)) { const r = R(x); if (r > R(a) && r < R(b) && !playedPrev.has(x)) { eq = false; break; } }
      if (!eq) out.push(b);
    }
  }
  return out;
}

// انتخاب کارت با شبیه‌سازی (لب کار هوش ربات)
function search(ctx, level) {
  const cfg = CFG.play[level] || CFG.play[1];
  const cands = reduceCands(ctx);
  if (cands.length === 1) return cands[0];
  const need = [0, 0, 0, 0]; let tot = 0;
  for (let p = 0; p < 4; p++) if (p !== ctx.me) { need[p] = ctx.sizes[p]; tot += need[p]; }
  const unseen = ctx.cards.filter(c => !ctx.played.has(c) && !ctx.hand.includes(c));
  if (unseen.length !== tot) return null; // اطلاعات ناقص؛ برگرد به هوش ساده
  // انتخاب پیش‌فرض ساده برای پایدارکردن نتیجه
  const hc = smart.choose({ legal: ctx.legal, hand: ctx.hand, trick: ctx.trick, me: ctx.me, trump: ctx.T, S: ctx.S, R: ctx.R, all: ctx.all, played: ctx.played, voids: ctx.voids, mustWin: mustWinFor(ctx, { tw: ctx.tw }, ctx.me) });
  let hk = -1;
  if (cands.includes(hc)) hk = cands.indexOf(hc);
  else { let best = -1; cands.forEach((c, i) => { if (ctx.S(c) === ctx.S(hc) && ctx.R(c) <= ctx.R(hc) && (best < 0 || ctx.R(c) > ctx.R(cands[best]))) best = i; }); hk = best; }
  const score = new Float64Array(cands.length), t0 = hr();
  let n = 0;
  while (n < cfg.N) {
    const hid = sampleHands(unseen, ctx.me, need, ctx.voids, ctx.S);
    hid[ctx.me] = ctx.hand;
    for (let k = 0; k < cands.length; k++) {
      const st = {
        hands: hid.map(h => h.slice()), played: new Set(ctx.played), voids: ctx.voids.map(v => new Set(v)),
        trick: ctx.trick.slice(), tw: ctx.tw.slice(), seat: ctx.me, first: cands[k]
      };
      score[k] += rollout(ctx, st);
    }
    n++;
    if (n >= cfg.minN && hr() - t0 > cfg.ms) break;
  }
  const unit = ctx.mode === 'mf' ? 1 : 3;
  if (hk >= 0) score[hk] += 0.03 * unit * n;
  let b = 0; for (let k = 1; k < cands.length; k++) if (score[k] > score[b]) b = k;
  return cands[b];
}

// ---------- منفی ----------
function mfMemory(g) {
  const played = new Set(), voids = [new Set(), new Set(), new Set(), new Set()], log = g.log || [];
  for (let i = 0; i < log.length; i++) {
    const x = log[i]; played.add(x.c);
    const k = i % 4; if (k > 0) { const ls = MF.S(log[i - k].c); if (MF.S(x.c) !== ls) voids[x.s].add(ls); }
  }
  return { played, voids };
}
function pickMf(g, seat, level) {
  const legal = g.legal(seat); if (legal.length <= 1) return legal[0];
  if (!g.log) return null;
  const m = mfMemory(g), trick = g.trick.map(x => ({ p: x.s, c: x.c }));
  const playedPrev = new Set(m.played); trick.forEach(x => playedPrev.delete(x.c));
  const ctx = {
    mode: 'mf', S: MF.S, R: MF.R, all: MF.all, T: 0, cards: MF.cards, me: seat, team: seat & 1,
    legal, hand: g.hands[seat], trick, played: m.played, playedPrev, voids: m.voids,
    sizes: [0, 1, 2, 3].map(p => g.hands[p].length), tw: [g.tt(0), g.tt(1)], tc: [g.tc(0), g.tc(1)]
  };
  return search(ctx, level);
}
// میانگین دست‌های یک دست با همان هوش پایه (برای ادعا و میر)
function simTricks(hands, lead) {
  const hs = hands.map(h => h.slice()), played = new Set(), voids = [new Set(), new Set(), new Set(), new Set()], cnt = [0, 0, 0, 0];
  for (let t = 0; t < 13; t++) {
    const trick = [];
    for (let k = 0; k < 4; k++) {
      const p = (lead + k) % 4, h = hs[p], led = trick.length ? MF.S(trick[0].c) : -1;
      const f = led >= 0 ? h.filter(c => MF.S(c) === led) : [], legal = f.length ? f : h;
      const c = smart.choose({ legal, hand: h, trick, me: p, trump: 0, S: MF.S, R: MF.R, all: MF.all, played, voids });
      if (led >= 0 && MF.S(c) !== led) voids[p].add(led);
      played.add(c); hs[p] = h.filter(x => x !== c); trick.push({ p, c });
    }
    const w = trickWinner(trick, MF.S, MF.R, 0); cnt[w]++; lead = w;
  }
  return cnt;
}
function estMean(hand, N, lead0) {
  const rest = MF.cards.filter(c => !hand.includes(c)); let tot = 0;
  for (let n = 0; n < N; n++) {
    shuffle(rest);
    tot += simTricks([hand, rest.slice(0, 13), rest.slice(13, 26), rest.slice(26, 39)], lead0 === undefined ? (Math.random() * 4 | 0) : lead0)[0];
  }
  return tot / N;
}
function bidMf(g, seat, level, maxClaim) {
  const mu = estMean(g.hands[seat], CFG.est[level] || 150, (g.order[0] - seat + 4) % 4) - (CFG.delta[level] || 0);
  return Math.max(0, Math.min(maxClaim, Math.round(mu)));
}
function mirMf(g, level) {
  const p = g.dealer, F = g.claim[p], mu = estMean(g.hands[p], CFG.est[level] || 150, (g.order[0] - p + 4) % 4);
  return mu < F - (CFG.mirTheta[level] || 1) ? 'swap' : 'go';
}

// ---------- حکم (فیسکوت) ----------
const FK = {
  S: c => c / 20 | 0, R: c => c % 20,
  all: low => s => { const a = []; for (let k = 2; k <= 13; k++) a.push(s * 20 + k); a.push(s * 20 + (low ? 1 : 14)); return a; }
};
function pickFk(r, p, level, legal) {
  if (legal.length <= 1) return legal[0];
  if (!r.mem) return null;
  const all = FK.all(r.aceLow), cards = [].concat(all(0), all(1), all(2), all(3));
  const playedPrev = new Set(r.mem.played); r.trick.forEach(x => playedPrev.delete(x.c));
  const ctx = {
    mode: 'fk', S: FK.S, R: FK.R, all, T: r.trump, cards, me: p, team: p & 1, hk: r.hk,
    legal, hand: r.hands[p], trick: r.trick.map(x => ({ p: x.p, c: x.c })), played: r.mem.played, playedPrev, voids: r.mem.voids,
    sizes: [0, 1, 2, 3].map(q => r.hands[q].length), tw: r.tw.slice()
  };
  return search(ctx, level);
}
// انتخاب حکم توسط حاکم (فقط ۵ کارت اول را دارد)
function trumpFk(hand5, level, aceLow, seat) {
  const all = FK.all(aceLow), cards = [].concat(all(0), all(1), all(2), all(3));
  const rest = cards.filter(c => !hand5.includes(c)), N = CFG.trump[level] || 24, val = [0, 0, 0, 0];
  for (let n = 0; n < N; n++) {
    shuffle(rest);
    const deal = [[], [], [], []];
    let o = 0; deal[seat] = hand5.concat(rest.slice(o, o += 8));
    for (let p = 0; p < 4; p++) if (p !== seat) deal[p] = rest.slice(o, o += 13);
    for (let t = 0; t < 4; t++) {
      const ctx = { mode: 'fk', S: FK.S, R: FK.R, all, T: t, me: seat, team: seat & 1, hk: seat };
      const st = { hands: deal.map(h => h.slice()), played: new Set(), voids: [new Set(), new Set(), new Set(), new Set()], trick: [], tw: [0, 0], seat, first: null };
      val[t] += rollout(ctx, st);
    }
  }
  let b = 0; for (let t = 1; t < 4; t++) if (val[t] > val[b]) b = t;
  return b;
}

module.exports = { CFG, pickMf, bidMf, mirMf, estMean, pickFk, trumpFk, simTricks };
