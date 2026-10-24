// Telegram bot (long polling) — opens the game as a Mini App
const T = process.env.BOT_TOKEN, URL_ = (process.env.PUBLIC_URL || '').replace(/\/$/, ''), ADMIN = String(process.env.ADMIN_ID || '');
const api = (m, b) => fetch(`https://api.telegram.org/bot${T}/${m}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b || {}) })
  .then(r => r.json()).catch(e => ({ ok: false, description: String(e) }));
const ABOUT = '🃏 ربات بازی منفی، حکم (فیسکوت) و لودو؛ بازی با دوستان یا ربات‌ها.\n\nطراح: نــوید = Cactuc\n@cactuc580\n\nاگر نیاز به راهنما داری یا چیزی نمی‌فهمی، روی دکمهٔ راهنما کلیک کن ⬇️';
const GUIDE_MF = '♠ راهنمای بازی منفی\n\n• ۴ نفر، دو تیم دونفره؛ هم‌تیمی‌ها روبه‌روی هم می‌نشینند.\n• هر دست، هر نفر می‌گوید چند دست می‌گیرد (ادعا). آخرین نفر (میر) ادعای باقی‌مانده را می‌گیرد تا جمع همه ۱۳ شود؛ او می‌تواند «قبول» یا «بچرخون» را بزند.\n• ادعای هر تیم = جمع ادعای دو هم‌تیمی.\n• پیک حکم است. باید از خال شروع‌شده بازی کنی؛ اگر نداری، هر پری می‌توانی بیندازی. پر را بگیر و روی میز بکش.\n• تیمی که بیشتر از ادعای خودش دست بگیرد، آن دست را می‌برد. اگر هر دو تیم دقیقاً به ادعایشان برسند، مساوی است.\n• هر تیمی که به ۵ برد برسد، مسابقه را می‌برد.';
const GUIDE_FK = '♥ راهنمای بازی حکم (فیسکوت)\n\n• ۴ نفر، دو تیم؛ هم‌تیمی روبه‌روی توست.\n• اول کارت‌ها پشت‌رو می‌آیند؛ هر کس توس (آس) بیاورد حاکم می‌شود.\n• حاکم ۵ کارت می‌گیرد و رنگ (حکم) را می‌گوید؛ بعد همه به ۱۳ کارت می‌رسند.\n• باید از خال شروع‌شده بازی کنی؛ نداری، می‌توانی حکم یا خال دیگری بزنی. حکم همهٔ خال‌های دیگر را می‌برد.\n• هر تیم که به ۷ دست برسد، دست را می‌برد: برد عادی ۱ امتیاز، کت‌فیسی (حاکم ۷–۰ ببرد) ۳ امتیاز، کدرنگ (تیم حاکم هیچ دستی نگیرد) ۷ امتیاز.\n• اگر تیم حاکم ببرد، حاکم همان می‌ماند، وگرنه به سمت راست می‌چرخد.\n• اولین تیمی که به ۱۳ امتیاز برسد، مسابقه را می‌برد.';
const GUIDE_LD = '🎲 راهنمای لودو\n\n• ۲، ۳ یا ۴ نفر؛ هر نفر ۴ مهره‌ی رنگ خودش را دارد. در بازی ۴ نفره می‌توانی «۲ در ۲» را انتخاب کنی؛ یارها ضربدری‌اند و تیمی که هر ۸ مهره‌اش به وسط برسد برنده است. در بازی ۲ نفره حریف‌ها گوشه‌های روبه‌رو را می‌گیرند.\n• تاس را بزن؛ با ۶ مهره از خانه بیرون می‌آید.\n• مهره‌ها را دور تخته بچرخان؛ اگر روی مهره‌ی حریف بیفتی (به‌جز خانه‌های شروع و ستاره‌ها ★) آن مهره به خانه برمی‌گردد.\n• ۶، زدن مهره و رساندن مهره به وسط، یک تاس دوباره می‌دهد؛ سه ۶ پشت‌سرهم نوبت را می‌سوزاند.\n• برای رسیدن به وسط باید تاس دقیق بیاید.\n• هر کس هر ۴ مهره‌اش را به وسط برساند تمام می‌کند: اول 👑، دوم 🥈، سوم 🥉. بازی ادامه دارد تا یک نفر بماند و او بازنده است.';
const info = {};
function start(rooms) {
  if (!T || !URL_) return console.log('Telegram bot disabled: set BOT_TOKEN and PUBLIC_URL');
  const kb = code => ({ inline_keyboard: [
    ...(code ? [[{ text: '✉️ ورود به اتاق دعوت', web_app: { url: URL_ + '/?r=' + code + '&invite=1' } }]] : []),
    [{ text: '🎮 شروع بازی‌ها', web_app: { url: URL_ + '/games.html' } }],
    [{ text: '👤 پروفایل من', callback_data: 'me' }, { text: 'ℹ️ درباره ربات', callback_data: 'about' }]
  ] });
  const SHARE = 'https://t.me/share/url?url=' + encodeURIComponent('https://t.me/cactuc580') + '&text=' + encodeURIComponent('آیدی سازندهٔ ربات: @cactuc580');
  const aboutKb = { inline_keyboard: [
    [{ text: '👤 رفتن به پروفایل', url: 'https://t.me/cactuc580' }],
    [{ text: '📋 کپی نام کاربری', copy_text: { text: '@cactuc580' } }, { text: '🔗 اشتراک‌گذاری', url: SHARE }],
    [{ text: '📘 راهنما', callback_data: 'guide' }]
  ] };
  const guideKb = { inline_keyboard: [[{ text: '♥ راهنمای حکم (فیسکوت)', callback_data: 'guide_fk' }], [{ text: '♠ راهنمای منفی', callback_data: 'guide_mf' }], [{ text: '🎲 راهنمای لودو', callback_data: 'guide_ld' }]] };
  const say = async (chat, text, kbd) => {
    const r = await api('sendMessage', { chat_id: chat, text, reply_markup: kbd });
    if (!r.ok && kbd) { const k2 = { inline_keyboard: kbd.inline_keyboard.map(row => row.filter(b => !b.copy_text)).filter(row => row.length) }; await api('sendMessage', { chat_id: chat, text, reply_markup: k2 }); }
  };
  const sendProfile = async (chat, from) => {
    const name = [from.first_name, from.last_name].filter(Boolean).join(' ');
    const text = '👤 پروفایل من\n\nاسم: ' + name + '\nآیدی تلگرام: ' + (from.username ? '@' + from.username : '—') + '\nآیدی عددی: ' + from.id;
    const ph = await api('getUserProfilePhotos', { user_id: from.id, limit: 1 });
    const f = ph.ok && ph.result && ph.result.photos && ph.result.photos[0];
    if (f && f.length) { const r = await api('sendPhoto', { chat_id: chat, photo: f[f.length - 1].file_id, caption: text }); if (r.ok) return; }
    await api('sendMessage', { chat_id: chat, text });
  };
  const handle = async u => {
    if (u.callback_query) {
      const q = u.callback_query, chat = q.message.chat.id, d = q.data;
      await api('answerCallbackQuery', { callback_query_id: q.id });
      if (d == 'about') await say(chat, ABOUT, aboutKb);
      else if (d == 'guide') await say(chat, '📘 راهنمای کدام بازی را می‌خواهی؟', guideKb);
      else if (d == 'guide_fk') await api('sendMessage', { chat_id: chat, text: GUIDE_FK });
      else if (d == 'guide_mf') await api('sendMessage', { chat_id: chat, text: GUIDE_MF });
      else if (d == 'guide_ld') await api('sendMessage', { chat_id: chat, text: GUIDE_LD });
      else if (d == 'me') await sendProfile(chat, q.from);
      return;
    }
    const m = u.message; if (!m || !m.text) return;
    const [cmd, arg] = m.text.trim().split(/\s+/);
    if (cmd == '/start') {
      const wf = /^(fkw|ldw|w)_([A-Za-z]{4})$/i.exec(arg || '');
      if (wf) {
        const c = wf[2].toUpperCase(), wk = wf[1].toLowerCase(), hok = wk == 'fkw', lud = wk == 'ldw';
        await api('sendMessage', { chat_id: m.chat.id, text: `👁 دوستت تو را به تماشای زندهٔ ${hok ? 'بازی حکم (فیسکوت)' : lud ? 'لودو' : 'بازی منفی'} دعوت کرده!\nکد اتاق: ${c}\nدست‌ها دیده نمی‌شوند؛ فقط میز را می‌بینی. برای تماشا دکمه را بزن.`, reply_markup: { inline_keyboard: [[{ text: '👁 تماشای بازی', web_app: { url: URL_ + (hok ? '/fiskoot.html?watch=' : lud ? '/ludo.html?watch=' : '/?w=') + c } }]] } });
        return;
      }
      const fk = /^fk_([A-Za-z]{4})$/i.exec(arg || '');
      if (fk) {
        const c = fk[1].toUpperCase();
        await api('sendMessage', { chat_id: m.chat.id, text: `♠ دوستت تو را به بازی حکم (فیسکوت) دعوت کرده!\nکد اتاق: ${c}\nبرای ورود به اتاق، دکمه را بزن.`, reply_markup: { inline_keyboard: [[{ text: '🎮 ورود به بازی حکم (فیسکوت)', web_app: { url: URL_ + '/fiskoot.html?room=' + c } }]] } });
        return;
      }
      const ld = /^ld_([A-Za-z]{4})$/i.exec(arg || '');
      if (ld) {
        const c = ld[1].toUpperCase();
        await api('sendMessage', { chat_id: m.chat.id, text: `🎲 دوستت تو را به بازی لودو دعوت کرده!\nکد اتاق: ${c}\nبرای ورود به اتاق، دکمه را بزن.`, reply_markup: { inline_keyboard: [[{ text: '🎮 ورود به لودو', web_app: { url: URL_ + '/ludo.html?room=' + c } }]] } });
        return;
      }
      const code = /^[A-Za-z]{4}$/.test(arg || '') ? arg.toUpperCase() : '';
      const nm = (m.from && m.from.first_name) || 'دوست من';
      const text = code ? `🃏 دوستت تو را به اتاق ${code} دعوت کرده!\nبرای دیدن نام دعوت‌کننده و ورود، دکمه را بزن.` : `سلام ${nm} 👋\n🃏 خوش آمدی به ربات بازی منفی، حکم (فیسکوت) و لودو!\nبا دوستان یا با ربات. برای دیدن همهٔ بازی‌ها، «شروع بازی‌ها» را بزن.`;
      await api('sendMessage', { chat_id: m.chat.id, text, reply_markup: kb(code) });
    } else if (cmd == '/profile') { await sendProfile(m.chat.id, m.from);
    } else if (cmd == '/guide') { await say(m.chat.id, '📘 راهنمای کدام بازی را می‌خواهی؟', guideKb);
    } else if (cmd == '/about') { await say(m.chat.id, ABOUT, aboutKb);
    } else if (cmd == '/stats' && String(m.from.id) == ADMIN) {
      const rs = Object.values(rooms), on = rs.reduce((a, r) => a + r.seats.filter(s => s && s.sid).length, 0);
      await api('sendMessage', { chat_id: m.chat.id, text: `اتاق‌ها: ${rs.length}\nبازیکنان آنلاین: ${on}` });
    }
  };
  (async () => {
    const me = (await api('getMe')).result || {}; info.username = me.username;
    console.log('Telegram bot:', me.username || 'getMe failed (check BOT_TOKEN)');
    await api('deleteWebhook');
    await api('setMyCommands', { commands: [{ command: 'start', description: 'شروع بازی' }, { command: 'profile', description: 'پروفایل من' }, { command: 'guide', description: 'راهنمای بازی‌ها' }, { command: 'about', description: 'درباره ربات' }] });
    await api('setChatMenuButton', { menu_button: { type: 'web_app', text: '🎮 بازی‌ها', web_app: { url: URL_ + '/games.html' } } });
    let off = 0;
    for (;;) {
      const r = await api('getUpdates', { offset: off, timeout: 30, allowed_updates: ['message', 'callback_query'] });
      if (!r.ok) { await new Promise(s => setTimeout(s, 4000)); continue; }
      for (const u of r.result) { off = u.update_id + 1; try { await handle(u); } catch (e) { console.log(e); } }
    }
  })();
}
start.info = info;
module.exports = start;
