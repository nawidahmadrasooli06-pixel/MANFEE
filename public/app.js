const $ = q => document.querySelector(q);
const tg = window.Telegram && window.Telegram.WebApp;
const sk = io({ auth: { initData: tg && tg.initData } });
const tok = localStorage.tok || (localStorage.tok = Math.random().toString(36).substring(2));
let st = null, BOT = '', pend = null, menuMode = false;

if (tg) { 
    tg.ready(); 
    tg.expand(); 
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); 
}

fetch('/config').then(r => r.json()).then(c => { BOT = c.bot; }).catch(() => {});

const show = id => document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));

const nm = () => {
    const el = $('#invite');
    const n = (el && el.value || localStorage.nm || (tg && tg.initDataUnsafe?.user?.first_name) || 'بازیکن').trim();
    localStorage.nm = n;
    return n;
};

const act = (ev, a) => sk.emit(ev, a);

// گرفتن عکس پروفایل و نام از تلگرام و نمایش وسط صفحه به صورت سبک
document.addEventListener('DOMContentLoaded', () => {
    if (tg && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        initPlayerProfile(user.first_name, user.photo_url);
    }
    setupRoomSeatSwapping();
    
    // حذف یا مخفی کردن المان‌های مربوط به تاریخچه از صفحه در صورت وجود
    document.querySelectorAll('.history-btn, [data-history]').forEach(el => el.remove());
});

function initPlayerProfile(userName, userPhotoUrl) {
    if (!document.getElementById('custom-user-badge')) {
        const badge = document.createElement('div');
        badge.id = 'custom-user-badge';
        badge.className = 'fixed top-2 right-2 z-50 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 shadow-md backdrop-blur-sm';
        badge.innerHTML = `
            <img src="${userPhotoUrl || 'https://via.placeholder.com/25'}" alt="Avatar" class="w-5 h-5 rounded-full object-cover border border-amber-400">
            <span class="text-xs font-medium text-slate-200">${userName}</span>
        `;
        document.body.appendChild(badge);
    }
}

// سیستم جابه‌جایی آزاد روی صندلی‌های اتاق قبل از شروع بازی
function setupRoomSeatSwapping() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('room-seat')) {
            if (!window.gameStarted) {
                const targetSeatId = e.target.getAttribute('data-seat-id');
                sk.emit('change_seat', { seatId: targetSeatId });
            }
        }
    });
}

// سیستم ایموجی‌های زنده (واکنش‌ها)
function sendReaction(emojiSymbol) {
    sk.emit('send_reaction', { emoji: emojiSymbol });
}

sk.on('show_reaction', (data) => {
    const { userId, emoji } = data;
    const playerElement = document.getElementById(`player-${userId}`);
    
    if (playerElement) {
        const reactionBubble = document.createElement('div');
        reactionBubble.className = 'absolute -top-10 left-1/2 -translate-x-1/2 text-2xl transition-all duration-700 opacity-100 z-50 pointer-events-none';
        reactionBubble.innerText = emoji;
        
        playerElement.appendChild(reactionBubble);
        
        setTimeout(() => {
            reactionBubble.style.opacity = '0';
            reactionBubble.style.transform = 'translate(-50%, -15px) scale(0.8)';
            setTimeout(() => reactionBubble.remove(), 500);
        }, 2000);
    }
});

const nmInput = $('#nm');
if (nmInput) {
    nmInput.value = localStorage.nm || (tg && tg.initDataUnsafe?.user?.first_name) || '';
}
const inv = $('#invNm');
if (inv) inv.value = nmInput ? nmInput.value : '';

const qr = new URLSearchParams(location.search);
if (qr.get('room')) {
    show('invite');
    const rInput = $('#joinCode');
    if (rInput) rInput.value = qr.get('room');
} else {
    show('menu');
}

function mk() { sk.emit('create', { name: nm() }); }
function jn() { sk.emit('join', { code: $('#joinCode').value, name: nm() }); }
