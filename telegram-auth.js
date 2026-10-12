'use strict';
const crypto=require('crypto');
function verifyInitData(initData, botToken=process.env.BOT_TOKEN) {
  if(!initData || !botToken) return null;
  try {
    const params=new URLSearchParams(initData), hash=params.get('hash'); if(!hash) return null;
    params.delete('hash'); const pairs=[...params.entries()].sort(([a],[b])=>a.localeCompare(b));
    const check=pairs.map(([k,v])=>`${k}=${v}`).join('\n');
    const secret=crypto.createHmac('sha256','WebAppData').update(botToken).digest();
    const calc=crypto.createHmac('sha256',secret).update(check).digest('hex');
    const a=Buffer.from(calc,'hex'), b=Buffer.from(hash,'hex');
    if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return null;
    const authDate=Number(params.get('auth_date')||0);
    const age=Date.now()/1000-authDate; if(!authDate || age>86400 || age < -60) return null;
    const user=JSON.parse(params.get('user')||'{}');
    if(!user.id) return null;
    return {id:String(user.id),firstName:String(user.first_name||''),username:String(user.username||'')};
  } catch(_) { return null; }
}
module.exports={verifyInitData};
