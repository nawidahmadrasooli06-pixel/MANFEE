// سیستم «میز باز»: وضعیت میزها (منفی، حکم، لودو) + پست جذاب در گروه تلگرام
// هر بازی تابع وضعیت خودش را ثبت می‌کند: register('fk', code => ({ s: 'open'|'full'|'gone', free, host }))
const NAME = { mf: 'منفی', fk: 'حکم (فیسکوت)', ld: 'لودو' };
const ICON = { mf: '♠️', fk: '♥️', ld: '🎲' };
const CODE = /^[A-Z]{4}$/;

module.exports = function (io, tg) {
  const reg = {}, posts = {}, cool = {};

  const info = (g, code) => {
    code = String(code || '').toUpperCase().trim();
    if (!reg[g] || !CODE.test(code)) return { s: 'gone', free: 0, host: '' };
    try { const r = reg[g](code); return r && r.s ? { s: r.s, free: r.free | 0, host: r.host || '' } : { s: 'gone', free: 0, host: '' }; }
    catch (e) { return { s: 'gone', free: 0, host: '' }; }
  };

  const textOf = (g, code, i) => {
    const head = `${ICON[g]} یک میز ${NAME[g]} باز شده!`;
    if (i.s === 'open') return `${head}\n👤 میزبان: ${i.host || 'یک دوست'}\n🪑 ${i.free} جای خالی باقی مانده؛ بیا بازی کنیم!\n🔑 کد میز: ${code}`;
    if (i.s === 'full') return `🔒 میز ${NAME[g]} (${code}) پر شد یا بازی‌اش شروع شد.\nمیز بعدی را از ربات بساز و دوستانت را دعوت کن!`;
    return `⌛ میز ${NAME[g]} (${code}) بسته شد.`;
  };

  // اعلام میز در گروه؛ فقط یک پست فعال برای هر میز و فاصلهٔ ۶۰ ثانیه بین دو اعلام یک میزبان
  async function announce(g, code, hostKey) {
    code = String(code || '').toUpperCase();
    const key = g + ':' + code, i = info(g, code);
    if (i.s !== 'open') return { ok: false, why: 'closed', msg: 'این میز دیگر باز نیست.' };
    if (posts[key] && !posts[key].closed) return { ok: false, why: 'dup', msg: 'این میز قبلاً در گروه اعلام شده است.' };
    const now = Date.now();
    if (now - (cool[hostKey] || 0) < 60000) return { ok: false, why: 'cool', msg: 'چند ثانیه صبر کن و دوباره امتحان کن.' };
    if (!tg || !tg.postTable) return { ok: false, why: 'nobot', msg: 'ربات تلگرام فعال نیست.' };
    const r = await tg.postTable(textOf(g, code, i), g, code);
    if (!r.ok) {
      const msg = r.why === 'nogroup' ? 'اعلام در گروه هنوز تنظیم نشده است (GROUP_ID در Render).'
        : r.why === 'nobot' ? 'ربات هنوز آماده نیست؛ چند ثانیه بعد امتحان کن.' : 'ربات نتوانست در گروه پیام بگذارد؛ مطمئن شو عضو گروه است.';
      return { ok: false, why: r.why, msg };
    }
    cool[hostKey] = now;
    posts[key] = { g, code, id: r.id, free: i.free, s: i.s, t: now, closed: false };
    return { ok: true, msg: 'میز در گروه اعلام شد ✅' };
  }

  // پیام گروه با تغییر تعداد جای خالی یا بسته‌شدن میز به‌روز می‌شود
  setInterval(async () => {
    const now = Date.now();
    for (const key in posts) {
      const p = posts[key]; if (p.closed) { if (now - p.t > 36e5) delete posts[key]; continue; }
      const i = info(p.g, p.code);
      if (i.s === p.s && i.free === p.free) { if (now - p.t > 6 * 36e5) p.closed = true; continue; }
      p.s = i.s; p.free = i.free;
      try { await tg.editTable(p.id, textOf(p.g, p.code, i), i.s === 'open', p.g, p.code); } catch (e) { }
      if (i.s !== 'open') { p.closed = true; p.t = now; }
    }
  }, 15000).unref();

  const T = { register: (g, fn) => { reg[g] = fn; }, info, announce, NAME };
  io.tables = T;
  return T;
};
