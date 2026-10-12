(function(){
  let activeKey='';
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.showVictory=function(o){
    if(!o||!o.key||activeKey===o.key)return;
    activeKey=o.key;
    let el=document.getElementById('vip-victory'); if(el)el.remove();
    el=document.createElement('div');el.id='vip-victory';el.className='vip-victory';
    el.innerHTML=`<canvas aria-hidden="true"></canvas><div class="vip-victory-card"><div class="vip-crown">♛</div><div class="vip-eyebrow">CACTUC · جشن قهرمانی</div><h1>${esc(o.title||'پایان مسابقه')}</h1><div class="vip-label">قهرمانان</div><div class="vip-winners">${(o.winners||[]).map(n=>`<span>${esc(n)}</span>`).join('')}</div><div class="vip-score">نتیجهٔ نهایی <b>${esc(o.score||'')}</b></div><div class="vip-label loser-label">بازیکنان حریف</div><div class="vip-losers">${(o.losers||[]).map(n=>`<span>${esc(n)}</span>`).join('')}</div><div class="vip-actions"><a href="${esc(o.homeUrl||'/')}" class="vip-home">بازگشت به خانه</a><button type="button" class="vip-again">${esc(o.againLabel||'بازی مجدد')}</button></div></div>`;
    document.body.appendChild(el);
    const b=el.querySelector('.vip-again');if(typeof o.onAgain==='function')b.addEventListener('click',()=>{el.remove();activeKey='';o.onAgain()});else b.disabled=true;
    const canvas=el.querySelector('canvas'),ctx=canvas.getContext('2d');let w,h,parts=[],raf;
    function resize(){w=canvas.width=innerWidth*devicePixelRatio;h=canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';parts=Array.from({length:130},()=>({x:Math.random()*w,y:-Math.random()*h,vx:(Math.random()-.5)*2.5,vy:2+Math.random()*4,r:3+Math.random()*5,a:Math.random()*Math.PI,va:(Math.random()-.5)*.15,color:['#ffd76a','#f4f1e8','#e8a53d','#71dfb2','#ff6f91'][Math.random()*5|0]}));}
    function frame(){if(!el.isConnected){cancelAnimationFrame(raf);return}ctx.clearRect(0,0,w,h);for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.a+=p.va;if(p.y>h+15){p.y=-15;p.x=Math.random()*w}ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.color;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore()}raf=requestAnimationFrame(frame)}
    resize();window.addEventListener('resize',resize,{passive:true});el._cleanup=()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)};frame();
  };
})();
