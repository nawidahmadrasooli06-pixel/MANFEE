(function(){
'use strict';
const KEY='cactuc_profile_v1';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tgUser(){try{return (window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initDataUnsafe&&Telegram.WebApp.initDataUnsafe.user)||{}}catch(e){return {}}}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
function payload(){const p=read()||{},u=tgUser();return {name:p.name||u.first_name||'بازیکن',avatar:p.avatar||'',emoji:p.emoji||'🃏',complete:!!p.complete,telegramName:u.first_name||'',username:u.username||'',id:u.id||null}}
function addStyle(){if($('#cactuc-profile-css'))return;const st=document.createElement('style');st.id='cactuc-profile-css';st.textContent=`
#cactucProfileModal{position:fixed;inset:0;z-index:99999;background:#000d;display:none;align-items:center;justify-content:center;padding:18px;font-family:inherit}
#cactucProfileModal.open{display:flex}
#cactucProfileModal .cp-card{width:min(420px,96vw);max-height:90dvh;overflow:auto;background:linear-gradient(145deg,#172b4b,#071322);border:2px solid #e4c46a;border-radius:22px;padding:20px;color:#fff;text-align:center;box-shadow:0 18px 60px #000c}
#cactucProfileModal h2{margin:4px 0 8px;color:#ffe08a}
#cactucProfileModal input{width:100%;font:inherit;padding:12px;border-radius:12px;border:1px solid #7186a8;background:#0b172b;color:white;margin:6px 0}
#cactucProfileModal .cp-emojis{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:10px 0}
#cactucProfileModal .cp-emojis button{font-size:24px;padding:6px 9px;border-radius:12px;background:#233958;color:#fff;border:1px solid #e4c46a}
#cactucProfileModal .cp-emojis button.sel{background:#e4c46a;color:#111}
#cactucProfileModal .cp-actions{display:flex;gap:8px;margin-top:12px}
#cactucProfileModal .cp-actions button{flex:1;font:inherit;font-weight:800;padding:11px 6px;border-radius:12px;border:0;background:#e4c46a;color:#17213a}
#cactucProfileModal .cp-actions .cp-close{background:#35445b;color:#fff}
#cactucProfileButton{position:fixed;z-index:5000;top:8px;left:8px;border:1px solid #e4c46a;border-radius:999px;padding:7px 10px;background:#132442;color:#fff;font:inherit;font-size:12px}
#cactucOwnerMenu{position:fixed;z-index:100000;inset:0;background:#0009;display:none;align-items:center;justify-content:center;padding:20px}
#cactucOwnerMenu.open{display:flex}
#cactucOwnerMenu .cp-card{width:min(320px,92vw);background:#101e35;border:1px solid #e4c46a;border-radius:18px;padding:16px;text-align:center}
#cactucOwnerMenu button{display:block;width:100%;margin:7px 0;padding:11px;border-radius:10px;border:1px solid #e4c46a;background:#20385a;color:#fff;font:inherit}
`;document.head.appendChild(st)}
function makeModal(){if($('#cactucProfileModal'))return;const d=document.createElement('div');d.id='cactucProfileModal';d.innerHTML=`<div class="cp-card" role="dialog" aria-modal="true"><h2>👤 پروفایل بازیکن</h2><p id="cp-intro">برای شروع، نام نمایشی و شکلک پروفایلت را انتخاب کن.</p><label for="cp-name">اسم نمایشی</label><input id="cp-name" maxlength="18" placeholder="نامی که همه در بازی ببینند"><label for="cp-avatar">لینک عکس (اختیاری، HTTPS)</label><input id="cp-avatar" placeholder="https://..." inputmode="url"><div>یا یک شکلک انتخاب کن</div><div class="cp-emojis">${['🃏','♠️','🌟','🐼','🦊','👑','🔥','💎'].map(e=>`<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div><div class="cp-actions"><button id="cp-save">تأیید و ذخیره</button><button id="cp-close" class="cp-close">بستن</button></div><small>نام و تصویر نمایشی برای بازیکنان دیگر دیده می‌شود؛ شناسهٔ عددی تلگرام عمومی نمی‌شود.</small></div>`;document.body.appendChild(d);
let chosen='🃏';d.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{chosen=b.dataset.emoji;d.querySelectorAll('[data-emoji]').forEach(x=>x.classList.toggle('sel',x===b));});const old=read()||{},u=tgUser();$('#cp-name').value=old.name||u.first_name||'';$('#cp-avatar').value=old.avatar||'';chosen=old.emoji||'🃏';d.querySelectorAll('[data-emoji]').forEach(b=>b.classList.toggle('sel',b.dataset.emoji===chosen));
$('#cp-save').onclick=()=>{const name=$('#cp-name').value.trim(),avatar=$('#cp-avatar').value.trim();if(!name){alert('لطفاً نام نمایشی را بنویس.');return}if(avatar&&!/^https:\/\/\S+/i.test(avatar)){alert('لینک عکس باید با https:// شروع شود.');return}const p={name:name.slice(0,18),avatar:avatar.slice(0,500),emoji:chosen,complete:true,updatedAt:Date.now()};localStorage.setItem(KEY,JSON.stringify(p));d.classList.remove('open');document.dispatchEvent(new CustomEvent('cactuc-profile',{detail:p}));window.dispatchEvent(new CustomEvent('cactuc-profile-saved',{detail:p}));};
$('#cp-close').onclick=()=>{if(!payload().complete){alert('برای ادامهٔ بازی، اول پروفایلت را تأیید کن.');return}d.classList.remove('open')};
d.addEventListener('click',e=>{if(e.target===d&&!payload().complete) e.preventDefault()});
}
function ownerMenu(){if($('#cactucOwnerMenu'))return;const d=document.createElement('div');d.id='cactucOwnerMenu';d.innerHTML=`<div class="cp-card"><b style="color:#ffe08a">نوید=Cactuc</b><p dir="ltr">@cactuc580</p><button data-act="profile">رفتن به پروفایل</button><button data-act="copy">کپی کردن نام کاربری</button><button data-act="share">اشتراک‌گذاری</button><button data-act="close">بستن</button></div>`;document.body.appendChild(d);d.onclick=async e=>{if(e.target===d||e.target.dataset.act==='close'){d.classList.remove('open');return}const a=e.target.dataset.act;if(a==='profile'){try{Telegram.WebApp.openTelegramLink('https://t.me/cactuc580')}catch(_){location.href='https://t.me/cactuc580'}}if(a==='copy'){try{await navigator.clipboard.writeText('@cactuc580');alert('نام کاربری کپی شد')}catch(_){prompt('کپی کن','@cactuc580')}}if(a==='share'){const url='https://t.me/cactuc580';try{if(navigator.share)await navigator.share({title:'VIP. CACTUC',url});else location.href='https://t.me/share/url?url='+encodeURIComponent(url)}catch(_){}}};}
function openProfile(){makeModal();const p=read()||{},u=tgUser();$('#cp-name').value=p.name||u.first_name||'';$('#cp-avatar').value=p.avatar||'';$('#cactucProfileModal').classList.add('open')}
function init(){addStyle();makeModal();ownerMenu();if(!$('#cactucProfileButton')){const b=document.createElement('button');b.id='cactucProfileButton';b.textContent='👤 پروفایل من';b.onclick=openProfile;document.body.appendChild(b)}
document.querySelectorAll('[data-owner],.brandId').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();ownerMenu();$('#cactucOwnerMenu').classList.add('open')})});
const p=read();if(!p||!p.complete)setTimeout(openProfile,250);
document.addEventListener('click',e=>{const modal=$('#cactucProfileModal');if(!modal||modal.classList.contains('open'))return;const p=read();if(p&&p.complete)return;const t=e.target;if(t.closest('#cactucProfileModal'))return;e.preventDefault();e.stopImmediatePropagation();openProfile()},true);
window.CProfile={payload,open:openProfile,read};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
