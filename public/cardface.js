/* ساخت ظاهر روی کارت‌ها (مشترک بین «منفی» و «حکم»). سبک و بدون کتابخانه؛ لودو از آن استفاده نمی‌کند.
   CF.card(رتبه, خال, کلاس‌های اضافه) → متن HTML یک کارت.   خال: 0=پیک 1=دل 2=خشت 3=گشنیز */
window.CF = (function () {
  const L = 38, C = 50, R = 62;
  const Y = t => Math.round((22 + 56 * t) * 10) / 10; // ردیف‌ها از ۲۲٪ تا ۷۸٪ کارت (گوشه‌ی بالا برای عدد و پایین برای نوشتهٔ CACTUC خالی می‌ماند)
  const six = [[L, 0], [R, 0], [L, .5], [R, .5], [L, 1], [R, 1]];
  const P = {
    '2': [[C, 0], [C, 1]],
    '3': [[C, 0], [C, .5], [C, 1]],
    '4': [[L, 0], [R, 0], [L, 1], [R, 1]],
    '5': [[L, 0], [R, 0], [C, .5], [L, 1], [R, 1]],
    '6': six,
    '7': six.concat([[C, .25]]),
    '8': six.concat([[C, .25], [C, .75]]),
    '9': [[L, 0], [R, 0], [L, 1 / 3], [R, 1 / 3], [C, .5], [L, 2 / 3], [R, 2 / 3], [L, 1], [R, 1]],
    '10': [[L, 0], [R, 0], [L, 1 / 3], [R, 1 / 3], [C, .17], [C, .83], [L, 2 / 3], [R, 2 / 3], [L, 1], [R, 1]]
  };
  const pp = (x, t, big) => `<x-s class="${big ? 'a' : t > .5 ? 'f' : ''}" style="left:${x}%;top:${Y(t)}%"></x-s>`;
  function body(r) {
    if (r === 'A') return `<x-s class="a" style="left:50%;top:${Y(.5)}%"></x-s>`;
    if (r === 'K' || r === 'Q' || r === 'J') return `<x-f data-r="${r}"></x-f><x-s class="cb"></x-s>`;
    const a = P[r] || []; let h = '';
    for (let i = 0; i < a.length; i++) h += pp(a[i][0], a[i][1]);
    return h;
  }
  function inner(rank, su) {
    const r = String(rank);
    return `<x-r>${r}</x-r><x-q></x-q><x-p>${body(r)}</x-p>`;
  }
  /* کلاس‌های کارت: رنگ (قرمز برای دل و خشت)، خال و رتبه */
  function cls(rank, su) { return (su === 1 || su === 2 ? 'r ' : '') + 'cs' + su + ' rk' + rank; }
  function card(rank, su, extra) {
    const r = String(rank);
    return `<div class="c ${cls(r, su)}${extra ? ' ' + extra : ''}">${inner(r, su)}</div>`;
  }
  return { card, inner, cls };
})();
