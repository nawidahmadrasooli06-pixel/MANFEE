// Telegram bot (long polling) — opens the game as a Mini App
const T = process.env.BOT_TOKEN, URL_ = (process.env.PUBLIC_URL || '').replace(/\/$/, ''), ADMIN = String(process.env.ADMIN_ID || '');
const api = (m, b) => fetch(`https://api.telegram.org/bot${T}/${m}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b || {}) })
  .then(r => r.json()).catch(e => ({ ok: false, description: String(e) }));
const ABOUT = '🃏 ربات بازی منفی\n\nطراح بات:: 〘Cactuc = نــوید〙\n@cactuc580\n\nربات برای خوشگذرونی و ساعت تیری ساخته شده امید که لذت ببرین❤️';
const info = {};
function start(rooms) {
  if (!T || !URL_) return console.log('Telegram bot disabled: set BOT_TOKEN and PUBLIC_URL');
  const kb = code => ({ inline_keyboard: [
    [{ text: '🎮 شروع بازی منفی', web_app: { url: URL_ + (code ? '/?r=' + code : '') } }],
    [{ text: 'ℹ️ درباره ربات', callback_data: 'about' }]] });
  const handle = async u => {
    if (u.callback_query) {
      await api('answerCallbackQuery', { callback_query_id: u.callback_query.id });
      if (u.callback_query.data == 'about') await api('sendMessage', { chat_id: u.callback_query.message.chat.id, text: ABOUT });
      return;
    }
    const m = u.message; if (!m || !m.text) return;
    const [cmd, arg] = m.text.trim().split(/\s+/);
    if (cmd == '/start') {
      const code = /^[A-Za-z]{4}$/.test(arg || '') ? arg.toUpperCase() : '';
      const text = code ? `🃏 دوستت تو را به اتاق ${code} دعوت کرده!\nدکمه را بزن و وارد میز شو.` : '🃏 خوش آمدی به بازی منفی!\nچهار نفره، با دوستان یا با ربات.\nدکمه را بزن و شروع کن.';
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
