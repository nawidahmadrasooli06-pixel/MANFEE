// Telegram bot (long polling) — opens the game as a Mini App
const T = process.env.BOT_TOKEN, URL_ = (process.env.PUBLIC_URL || '').replace(/\/$/, ''), ADMIN = String(process.env.ADMIN_ID || '');
const api = (m, b) => fetch(`https://api.telegram.org/bot${T}/${m}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b || {}) })
  .then(r => r.json()).catch(e => ({ ok: false, description: String(e) }));
const ABOUT = '🃏 ربات بازی منفی\n\nطراح بات:\n\u2066نوید=Cactuc\u2069\n\u2066@cactuc580\u2069\n\nربات برای خوشگذرونی و ساعت تیری ساخته شده امید که لذت ببرین❤️';
const GUIDE = '📘 راهنمای بازی منفی\n\n۱) شروع بازی\nاز دکمه «شروع بازی منفی» وارد مینی‌اپ شو و اسمت را بنویس.\n\n۲) ساخت اتاق\n«ساخت اتاق جدید» را بزن. یک کد چهارحرفی برای اتاقت ساخته می‌شود.\n\n۳) دعوت دوست\nدر لابی «دعوت دوستان» را بزن و لینک را برای دوستت بفرست. دوستت لینک را باز می‌کند، نام دعوت‌کننده را می‌بیند و با زدن «قبول دعوت و ورود» وارد اتاق می‌شود. تا وقتی دوستت وارد نشود، اتاق منتظر می‌ماند.\n\n۴) ورود با کد\nاگر لینک نداری، از صفحه ورود نامت را بنویس، کد چهارحرفی دوستت را وارد کن و «ورود با کد» را بزن.\n\n۵) شروع و بازیکنان\nدر لابی صندلی‌ها و نام بازیکنان را می‌بینی. روی صندلی هر بازیکن بزن تا جابه‌جایی انجام شود؛ همه جای خود را مرتب کنند و بعد میزبان «شروع بازی» را می‌زند؛ شمارش ۳، ۲، ۱ انجام می‌شود. صندلی‌های خالی با ربات پر می‌شوند. اگر دعوتی در انتظار باشد، میزبان می‌تواند صبر کند یا جداگانه «شروع با ربات‌ها» را انتخاب کند.\n\n۶) ادعا و میر\nدر مرحله ادعا تعداد دست‌هایی را که فکر می‌کنی می‌گیری انتخاب و ثبت کن. بازیکن میر می‌تواند ادعا را قبول کند یا بچرخاند. نوبت‌های انسانی تایمر اجباری ندارند.\n\n۷) انداختن کارت\nوقتی نوبت تو شد، یک کارت قانونی را به سمت میز بکش. اگر از خال شروع‌شده کارت داری، باید همان خال را بازی کنی. پیک حکم است.\n\n۸) قطع اتصال\nاگر بازیکنی قطع شود، می‌توانی منتظرش بمانی یا اجازه بدهی ربات موقتاً بازی کند. اگر بازیکن برگردد و بازی هنوز ادامه داشته باشد، می‌تواند به همان صندلی و بازی برگردد.\n\n۹) پایان و بازی دوباره\nهر دست و امتیاز سری در صفحه دیده می‌شود. وقتی یکی از تیم‌ها به پنج امتیاز برسد، نام هر دو هم‌تیمی برنده نمایش داده می‌شود. «بازی مجدد» یک سری تازه در همان اتاق شروع می‌کند. لینک بازی تمام‌شده یا منقضی‌شده دیگر قابل ادامه نیست؛ ربات را دوباره استارت کن و اتاق تازه بساز.\n\n🎙️ دکمه میکروفون برای گفت‌وگوی صوتی و 🔊 برای روشن/خاموش کردن صداست.';
const FKGUIDE = '♠️ راهنمای حکم (فیسکوت)\n\n۱) با سه دوست وارد اتاق شوید یا با ربات شروع کنید. قبل از شروع، صندلی‌ها را می‌توانید جابه‌جا کنید.\n\n۲) در مرحلهٔ اول کارت‌های پشت‌رو را انتخاب کنید؛ هرکس توس/آس بیاورد حاکم می‌شود.\n\n۳) حاکم رنگ حکم را انتخاب می‌کند. اگر از خال شروع‌شده کارت داری، باید همان خال را بازی کنی؛ اگر نداری، هر کارت مجاز است.\n\n۴) هر دور، تیمی که کارت قوی‌تر را برده یک دست می‌گیرد. تیمی که زودتر به ۷ دست برسد، امتیاز آن دور را می‌گیرد.\n\n۵) بازی تا رسیدن یک تیم به ۱۳ امتیاز ادامه دارد. در میز می‌توانید واکنش بفرستید و پروفایل خود را تغییر دهید.';
const info = {};
function start(rooms) {
  if (!T || !URL_) return console.log('Telegram bot disabled: set BOT_TOKEN and PUBLIC_URL');
  const kb = code => ({ inline_keyboard: [
    [{ text: '🎮 شروع بازی منفی', web_app: { url: URL_ + (code ? '/?r=' + code + '&invite=1' : '') } }],
    [{ text: '♠ بازی حکم (فیسکوت)', web_app: { url: URL_ + '/fiskoot.html' } }],
    [{ text: '👤 پروفایل من', callback_data: 'profile' }, { text: '📘 راهنما', callback_data: 'guide' }],
    [{ text: 'ℹ️ درباره ربات', callback_data: 'about' }]
  ] });
  const handle = async u => {
    if (u.callback_query) {
      await api('answerCallbackQuery', { callback_query_id: u.callback_query.id });
      if (u.callback_query.data == 'about') await api('sendMessage', { chat_id: u.callback_query.message.chat.id, text: ABOUT, reply_markup: { inline_keyboard: [[{ text: '📖 راهنمای بازی', callback_data: 'guide' }],[{text:'👤 پروفایل من',callback_data:'profile'}]] } });
      if (u.callback_query.data == 'guide') await api('sendMessage', { chat_id: u.callback_query.message.chat.id, text: 'کدام راهنما را می‌خواهی؟', reply_markup:{inline_keyboard:[[{text:'🃏 راهنمای منفی',callback_data:'guide_mf'}],[{text:'♠️ راهنمای حکم (فیسکوت)',callback_data:'guide_fk'}]]} });
      if (u.callback_query.data == 'guide_mf') await api('sendMessage', { chat_id: u.callback_query.message.chat.id, text: GUIDE });
      if (u.callback_query.data == 'guide_fk') await api('sendMessage', { chat_id: u.callback_query.message.chat.id, text: FKGUIDE });
      if (u.callback_query.data == 'profile') { const f=u.callback_query.from||{},chat_id=u.callback_query.message.chat.id,caption=`👤 پروفایل من\n\nاسم تلگرام: ${[f.first_name,f.last_name].filter(Boolean).join(' ')||'ثبت نشده'}\nنام کاربری: ${f.username?'@'+f.username:'ندارد'}\nشناسه عددی تلگرام: ${f.id||'نامشخص'}\n\nبرای انتخاب اسم و تصویر نمایشی بازی، پروفایل را داخل مینی‌اپ باز کن.`; const markup={inline_keyboard:[[{text:'✏️ ویرایش پروفایل بازی',web_app:{url:URL_+'/?profile=1'}}]]}; let sent=false; if(f.id){const ph=await api('getUserProfilePhotos',{user_id:f.id,limit:1});const fid=ph&&ph.ok&&ph.result&&ph.result.photos&&ph.result.photos[0]&&ph.result.photos[0].slice(-1)[0]&&ph.result.photos[0].slice(-1)[0].file_id;if(fid){await api('sendPhoto',{chat_id,photo:fid,caption,reply_markup:markup});sent=true;}} if(!sent)await api('sendMessage',{chat_id,text:caption,reply_markup:markup}); }
      return;
    }
    const m = u.message; if (!m || !m.text) return;
    const [cmd, arg] = m.text.trim().split(/\s+/);
    if (cmd == '/start') {
      const first=[m.from.first_name,m.from.last_name].filter(Boolean).join(' ');
      const wf = /^(fkw|w)_([A-Za-z]{4})$/i.exec(arg || '');
      if (wf) {
        const c = wf[2].toUpperCase(), hok = wf[1].toLowerCase() == 'fkw';
        await api('sendMessage', { chat_id: m.chat.id, text: `سلام ${first||'دوست عزیز'} جان! ❤️\nدوستت تو را به تماشای زندهٔ ${hok ? 'بازی حکم (فیسکوت)' : 'بازی منفی'} دعوت کرده.\nکد اتاق: ${c}\nدست‌ها دیده نمی‌شوند؛ فقط میز را می‌بینی. برای تماشا دکمه را بزن.`, reply_markup: { inline_keyboard: [[{ text: '👁 تماشای بازی', web_app: { url: URL_ + (hok ? '/fiskoot.html?watch=' : '/?w=') + c } }],[{text:'👤 پروفایل من',callback_data:'profile'}]] } });
        return;
      }
      const fk = /^fk_([A-Za-z]{4})$/i.exec(arg || '');
      if (fk) {
        const c = fk[1].toUpperCase();
        await api('sendMessage', { chat_id: m.chat.id, text: `سلام ${first||'دوست عزیز'} جان! ❤️\nدوستت تو را به بازی حکم (فیسکوت) دعوت کرده.\nکد اتاق: ${c}\nبرای ورود به اتاق، دکمه را بزن.`, reply_markup: { inline_keyboard: [[{ text: '🎮 ورود به بازی حکم (فیسکوت)', web_app: { url: URL_ + '/fiskoot.html?room=' + c } }],[{text:'👤 پروفایل من',callback_data:'profile'}]] } });
        return;
      }
      const code = /^[A-Za-z]{4}$/.test(arg || '') ? arg.toUpperCase() : '';
      const text = code ? `سلام ${first||'دوست عزیز'} جان! ❤️\nدوستت تو را به اتاق ${code} دعوت کرده.\nبرای دیدن نام دعوت‌کننده و ورود، دکمه را بزن.` : `🃏 سلام ${first||'دوست عزیز'} جان، خوش آمدی به VIP. CACTUC! ❤️\nبازی منفی و حکم (فیسکوت)؛ با دوستان یا ربات‌ها بازی کن.\nپروفایلت را تنظیم کن و شروع کن.`;
      await api('sendMessage', { chat_id: m.chat.id, text, reply_markup: kb(code) });
    } else if (cmd == '/stats' && String(m.from.id) == ADMIN) {
      const rs = Object.values(rooms), on = rs.reduce((a, r) => a + r.seats.filter(s => s && s.sid).length, 0);
      await api('sendMessage', { chat_id: m.chat.id, text: `اتاق‌ها: ${rs.length}\nبازیکنان آنلاین: ${on}` });
    }
  };
  (async () => {
    const me = (await api('getMe')).result || {}; info.username = me.username;
    console.log('Telegram bot:', me.username || 'getMe failed (check BOT_TOKEN)');
    await api('deleteWebhook');
    await api('setMyCommands', { commands: [{ command: 'start', description: 'شروع بازی' }] });
    await api('setChatMenuButton', { menu_button: { type: 'web_app', text: '🎮 بازی منفی', web_app: { url: URL_ } } });
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
