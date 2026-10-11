// بازی هوشمند ربات‌ها (مشترک بین منفی و حکم): شمارش کارت، نگه‌داشتن کارت خوب، نینداختن کارت بزرگ روی برد قطعی هم‌تیمی
exports.choose = function (o) {
  const { legal, hand, trick, me, S, R, all, played, voids } = o, T = o.trump, mustWin = !!o.mustWin, mt = me % 2;
  if (legal.length === 1) return legal[0];
  const key = c => (S(c) === T ? 100 : 0) + R(c);
  const asc = a => [...a].sort((x, y) => key(x) - key(y));
  const desc = a => asc(a).reverse();
  const beats = (a, b) => S(a) === S(b) ? R(a) > R(b) : (S(a) === T && S(b) !== T);
  const unseen = s => all(s).filter(c => !played.has(c) && !hand.includes(c) && !trick.some(x => x.c === c));
  const master = c => unseen(S(c)).every(u => R(u) < R(c));
  const count = s => hand.filter(c => S(c) === s).length;
  const behind = []; for (let k = 1; k <= 3 - trick.length; k++) behind.push((me + k) % 4);
  const oppBehind = behind.filter(p => p % 2 !== mt), opps = [(me + 1) % 4, (me + 3) % 4];
  const ruffs = (p, s) => s !== T && voids[p].has(s) && !voids[p].has(T) && unseen(T).length > 0;
  const discard = a => {
    const side = a.filter(c => S(c) !== T), pool = side.length ? side : a;
    return [...pool].sort((x, y) => (R(x) + (master(x) ? 50 : 0)) - (R(y) + (master(y) ? 50 : 0)) || count(S(y)) - count(S(x)))[0];
  };
  // ---- شروع دست
  if (!trick.length) {
    const side = legal.filter(c => S(c) !== T), tr = legal.filter(c => S(c) === T);
    const safe = side.filter(c => master(c) && !opps.some(p => ruffs(p, S(c))));
    if (safe.length) return desc(safe).sort((x, y) => count(S(y)) - count(S(x)))[0];
    const tm = tr.filter(master);
    if (tm.length && (tr.length >= 2 || mustWin) && unseen(T).length) return desc(tm)[0];
    if (mustWin) { const any = desc(legal.filter(master)); if (any.length) return any[0]; return desc(side.length ? side : legal)[0]; }
    const ok = side.filter(c => !opps.some(p => ruffs(p, S(c))));
    const pool = ok.length ? ok : (side.length ? side : legal);
    const cnt = s => pool.filter(c => S(c) === s).length;
    const bs = [...new Set(pool.map(S))].sort((a, b) => cnt(b) - cnt(a))[0];
    return asc(pool.filter(c => S(c) === bs))[0];
  }
  // ---- جواب دادن
  let best = trick[0]; for (const x of trick) if (beats(x.c, best.c)) best = x;
  const partnerWin = best.p % 2 === mt, last = behind.length === 0;
  const win = asc(legal.filter(c => beats(c, best.c))), lose = asc(legal.filter(c => !beats(c, best.c)));
  const secure = () => last || (master(best.c) && !oppBehind.some(p => ruffs(p, S(best.c))));
  const sure = () => win.find(c => master(c) && !oppBehind.some(p => ruffs(p, S(c))));
  if (partnerWin) {
    if (secure()) return discard(lose.length ? lose : legal);
    const s = sure(); if (s) return s;
    if (mustWin && win.length) return win[0];
    return discard(lose.length ? lose : legal);
  }
  if (win.length) {
    if (last) return win[0];
    const s = sure(); if (s) return s;
    if (mustWin) { const w2 = win.filter(c => S(c) !== T); return w2.length ? w2[w2.length - 1] : win[0]; }
    return win[0];
  }
  return discard(lose.length ? lose : legal);
};
