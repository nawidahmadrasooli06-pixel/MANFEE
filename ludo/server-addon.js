'use strict';
// Add-on for existing Socket.IO server. Call attachLudo(io) without changing existing game handlers.
const E=require('./engine');
function attachLudo(io){
 const rooms=new Map(), alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const code=()=>Array.from({length:5},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
 const publish=r=>{for(const s of io.sockets.sockets.values())if(s.data.ludoRoom===r.code)s.emit('ludo:state',publicState(r));};
 const publicState=r=>({code:r.code,mode:r.mode,teams:r.game.teams,phase:r.game.phase,turn:r.game.turn,dice:r.game.dice,players:r.game.players.map(p=>({id:p.id,name:p.name,color:p.color,bot:p.bot,finished:p.finished,pieces:p.pieces})),winnerOrder:r.game.winnerOrder,message:r.game.message,host:r.host});
 const aiTurn=r=>{if(r.game.phase!=='playing')return;const p=r.game.players[r.game.turn];if(!p||!p.bot)return;setTimeout(()=>{if(r.game.phase!=='playing'||r.game.players[r.game.turn]!==p)return;const res=E.roll(r.game,p.id);if(res.ok&&res.moves.length){const mi=E.botChoice(r.game,p.id,res.moves);E.advance(r.game,p.id,mi,r.game.dice===null?6:r.game.dice);}publish(r);if(r.game.phase==='playing')aiTurn(r);},650);};
 io.on('connection',s=>{
  s.on('ludo:create',({name='بازیکن',mode='private',count=4,teams=false}={})=>{let c;do{c=code()}while(rooms.has(c));const g=E.newGame(mode,count,teams);g.players[0].name=String(name).slice(0,18);if(mode!=='solo'){for(let i=1;i<g.players.length;i++){g.players[i].bot=true;g.players[i].name='جای خالی';}}const r={code:c,mode,host:s.id,game:g};rooms.set(c,r);s.data.ludoRoom=c;s.join('ludo:'+c);s.emit('ludo:created',{code:c});publish(r);});
  s.on('ludo:join',({code:c,name='بازیکن'}={})=>{const r=rooms.get(String(c||'').toUpperCase());if(!r)return s.emit('ludo:error','اتاق پیدا نشد');if(r.mode==='solo')return s.emit('ludo:error','این اتاق مخصوص بازی با کامپیوتر است');let p=r.game.players.find(x=>x.bot);if(!p){if(r.game.players.length>=4)return s.emit('ludo:error','اتاق پر است');p={id:r.game.players.length,name:String(name).slice(0,18),color:E.COLORS[r.game.players.length],bot:false,finished:0,pieces:[-1,-1,-1,-1]};r.game.players.push(p);}else{p.bot=false;p.name=String(name).slice(0,18);}s.data.ludoRoom=r.code;s.join('ludo:'+r.code);publish(r);});
  s.on('ludo:roll',()=>{const r=rooms.get(s.data.ludoRoom);if(!r)return;const pi=r.game.players.findIndex(p=>!p.bot&&p.id===r.game.turn);if(pi<0)return;const res=E.roll(r.game,pi);if(!res.ok)return s.emit('ludo:error','الان نوبت شما نیست یا تاس قبلاً انداخته شده');if(res.moves.length===1)E.advance(r.game,pi,res.moves[0],r.game.dice);publish(r);aiTurn(r);});
  s.on('ludo:move',({piece}={})=>{const r=rooms.get(s.data.ludoRoom);if(!r||r.game.dice===null)return;const pi=r.game.turn,p=r.game.players[pi];if(!p||p.bot||!E.legalMoves(r.game,pi,r.game.dice).includes(piece))return s.emit('ludo:error','این حرکت مجاز نیست');const d=r.game.dice;E.advance(r.game,pi,piece,d);publish(r);aiTurn(r);});
  s.on('disconnect',()=>{const c=s.data.ludoRoom,r=rooms.get(c);if(r&&r.mode==='public'&&r.game.phase==='playing'){const p=r.game.players.find(x=>!x.bot&&x.id!==0);if(p){p.bot=true;p.name='حریف کامپیوتری';publish(r);}}});
 });
}
module.exports=attachLudo;
