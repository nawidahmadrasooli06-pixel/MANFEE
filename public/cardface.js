/* ساخت ظاهر روی کارت‌ها (مشترک بین «منفی» و «حکم»). سبک و بدون کتابخانه؛ لودو از آن استفاده نمی‌کند.
   CF.card(رتبه, خال, کلاس‌های اضافه) → متن HTML یک کارت.   خال: 0=پیک 1=دل 2=خشت 3=گشنیز */
window.CF = (function () {
  /* قاب تزئینی دور خال وسط (رنگ از --ring هر طرح می‌آید). برای شماره‌ها ساده، برای سرباز/بی‌بی/شاه پرتر */
  function ring(g) {
    let s = '<svg viewBox="-9 -9 118 118" fill="none"><circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="2.6"/><circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="1"/>';
    let i;
    if (g === 'K' || g === 'Q') for (i = 0; i < 8; i++) s += `<ellipse cx="50" cy="1" rx="4.5" ry="8" fill="currentColor" transform="rotate(${i * 45} 50 50)"/>`;
    if (g === 'K') for (i = 0; i < 8; i++) s += `<polygon points="50,-6 46,4 54,4" fill="currentColor" transform="rotate(${i * 45 + 22.5} 50 50)"/>`;
    if (g === 'J') for (i = 0; i < 4; i++) s += `<circle cx="50" cy="1" r="4.5" fill="currentColor" transform="rotate(${i * 90} 50 50)"/>`;
    if (g === 'n') for (i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180; s += `<circle cx="${(50 + 43 * Math.sin(a)).toFixed(1)}" cy="${(50 - 43 * Math.cos(a)).toFixed(1)}" r="1.4" fill="currentColor"/>`; }
    return s + '</svg>';
  }
  const MED = { n: ring('n'), J: ring('J'), Q: ring('Q'), K: ring('K') };
  /* همهٔ کارت‌ها: فقط یک خال وسط + قاب. (بدون خال‌های پراکنده و بدون شکل آدم) */
  function body(r) {
    const g = (r === 'K' || r === 'Q' || r === 'J') ? r : 'n';
    return `<x-m>${MED[g]}<x-s class="m${r === 'A' ? ' ma' : ''}"></x-s></x-m>`;
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
