const T = process.env.BOT_TOKEN, URL_ = (process.env.WEB_APP_URL || process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const ADMIN_ID = process.env.ADMIN_ID || '';

const api = (m, b) => fetch(`https://api.telegram.org/bot${T}/${m}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b)
}).then(r => r.json()).catch(e => ({ ok: false, error: e }));

const ABOUT = `🤖 **درباره ربات بازی‌های دورهمی**\n\n` +
              `این ربات برای بازی‌های جذاب فیسکوت و منفی طراحی شده است.\n\n` +
              `👨‍💻 **توسعه‌دهندگان:**\n` +
              `• نوید (طراح و توسعه‌دهنده)\n` +
              `• Cactus (پشتیبانی و فنی)\n\n` +
              `برای ارتباط مستقیم با سازنده روی دکمه زیر بزنید:`;

const GUIDE = `📚 **راهنمای بازی:**\n\nبرای شروع بازی کافیه یکی از دکمه‌های بازی منفی یا فیسکوت رو انتخاب کنی و وارد میز بازی بشی!`;

function start(rooms) {
    if (!T || !URL_) return console.log('Telegram BOT_TOKEN or WEB_APP_URL missing');

    const kb = () => ({ inline_keyboard: [
        [{ text: '🎲 شروع بازی منفی', web_app: { url: `${URL_}/` } }],
        [{ text: '♠️ بازی حکم (فیسکوت)', web_app: { url: `${URL_}/fiskoot.html` } }],
        [{ text: '👤 پروفایل من', callback_data: 'profile' }],
        [{ text: '📖 راهنمای بازی', callback_data: 'guide' }, { text: 'ℹ️ درباره ربات', callback_data: 'about' }]
    ] });

    const handle = async u => {
        if (u.callback_query) {
            const cq = u.callback_query;
            const cid = cq.message.chat.id;
            const mid = cq.message.message_id;

            if (cq.data === 'about') {
                const adminKb = {
                    inline_keyboard: [
                        [{ text: '👤 ارتباط با نوید (پی‌وی)', url: ADMIN_ID ? `tg://user?id=${ADMIN_ID}` : `https://t.me/YOUR_USERNAME` }],
                        [{ text: '🔙 بازگشت', callback_data: 'back' }]
                    ]
                };
                await api('editMessageText', { chat_id: cid, message_id: mid, text: ABOUT, parse_mode: 'Markdown', reply_markup: adminKb });
            } 
            else if (cq.data === 'guide') {
                await api('editMessageText', { chat_id: cid, message_id: mid, text: GUIDE, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back' }]] } });
            }
            else if (cq.data === 'profile') {
                const user = cq.from;
                const firstName = user.first_name || '';
                const lastName = user.last_name || '';
                const username = user.username ? '@' + user.username : 'ثبت نشده';
                
                const profileText = `👤 **پروفایل کاربری شما**\n\n` +
                                    `🔹 نام: ${firstName}${lastName}\n` +
                                    `🔹 نام کاربری: ${username}\n` +
                                    `🔹 آیدی عددی: \`${user.id}\``;
                await api('editMessageText', { chat_id: cid, message_id: mid, text: profileText, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: 'back' }]] } });
            }
            else if (cq.data === 'back') {
                await api('editMessageText', { chat_id: cid, message_id: mid, text: 'یکی از گزینه‌های زیر را انتخاب کنید:', reply_markup: kb() });
            }

            await api('answerCallbackQuery', { callback_query_id: cq.id });
            return;
        }

        const m = u.message;
        if (!m || !m.text) return;
        const cid = m.chat.id;

        if (m.text.startsWith('/start')) {
            const name = m.from.first_name || 'دوست عزیز';
            await api('sendMessage', {
                chat_id: cid,
                text: `سلام ${name}! 🌸\nبه ربات خوش آمدید. یکی از گزینه‌های زیر را انتخاب کنید:`,
                reply_markup: kb()
            });
        }
    };

    let offset = 0;
    const poll = async () => {
        try {
            const res = await api('getUpdates', { offset, timeout: 20 });
            if (res.ok && res.result) {
                for (const u of res.result) {
                    offset = u.update_id + 1;
                    handle(u.callback_query ? u : u);
                }
            }
        } catch (e) {}
        setTimeout(poll, 1000);
    };
    poll();
}

module.exports = { start };
