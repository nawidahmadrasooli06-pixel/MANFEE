/* ساخت ظاهر روی کارت‌ها (مشترک بین «منفی» و «حکم»). سبک و بدون کتابخانه؛ لودو از آن استفاده نمی‌کند.
   CF.card(رتبه, خال, کلاس‌های اضافه) → متن HTML یک کارت. خال: 0=پیک 1=دل 2=خشت 3=گشنیز */
window.CF = (function () {
  const center = 'left:50%;top:50%';
  function inner(rank, su) {
    const r = String(rank);
    // همه کارت‌ها فقط یک خال در مرکز دارند؛ هیچ ردیف خال پراکنده یا علامت وارونه ساخته نمی‌شود.
    // x-f فقط قاب تزئینی مرکزی است؛ تصویر یا حرف شاه/بی‌بی/سرباز در مرکز وجود ندارد.
    return `<x-r>${r}</x-r><x-q></x-q><x-p><x-f></x-f><x-s class="a" style="${center}"></x-s></x-p>`;
  }
  function cls(rank, su) { return (su === 1 || su === 2 ? 'r ' : '') + 'cs' + su + ' rk' + rank; }
  function card(rank, su, extra) {
    const r = String(rank);
    return `<div class="c ${cls(r, su)}${extra ? ' ' + extra : ''}">${inner(r, su)}</div>`;
  }
  return { card, inner, cls };
})();
