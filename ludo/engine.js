'use strict';
const COLORS=['red','green','yellow','blue'];
const START=[0,13,26,39];
const SAFE=new Set([0,8,13,21,26,34,39,47]);
function newGame(mode='solo', count=4, teams=false){
 const n=Math.max(2,Math.min(4,count|0));
 return {mode,teams,phase:'playing',turn:0,dice:null,players:Array.from({length:n},(_,i)=>({id:i,name:i===0?'شما':`حریف ${i}`,color:COLORS[i],bot:i>0&&mode==='solo',finished:0,pieces:[-1,-1,-1,-1]})),winnerOrder:[],message:'نوبت بازیکن قرمز است'};
}
function legalMoves(g,pi,d){const p=g.players[pi];if(!p||p.bot===undefined)return[];return p.pieces.map((v,i)=>({i,v})).filter(x=>x.v===-1?d===6:x.v<56&&x.v+d<=56).map(x=>x.i)}
function advance(g,pi,mi,d){const p=g.players[pi];let v=p.pieces[mi];if(v===-1){if(d!==6)return {ok:false};v=0;}else v+=d;p.pieces[mi]=v;
 if(v<51){const pos=(START[pi]+v)%52;if(!SAFE.has(pos)){for(let j=0;j<g.players.length;j++){if(j===pi)continue;for(let k=0;k<4;k++){const ov=g.players[j].pieces[k];if(ov>=0&&ov<51&&(START[j]+ov)%52===pos)g.players[j].pieces[k]=-1;}}}}
 if(v===56&&!p._counted){p._counted=true;p.finished++;}
 if(p.pieces.every(x=>x===56)&&!g.winnerOrder.includes(pi))g.winnerOrder.push(pi);
 g.dice=null;g.message=`${p.name} حرکت کرد`;
 if(g.winnerOrder.length===g.players.length){g.phase='finished';g.message='بازی تمام شد';return {ok:true,finished:true};}
 if(d!==6)g.turn=nextUnfinished(g,(pi+1)%g.players.length);return {ok:true};
}
function nextUnfinished(g,start){for(let k=0;k<g.players.length;k++){let i=(start+k)%g.players.length;if(!g.players[i].pieces.every(v=>v===56))return i;}return start;}
function roll(g,pi){if(g.phase!=='playing'||g.turn!==pi||g.dice!==null)return {ok:false};g.dice=1+Math.floor(Math.random()*6);const moves=legalMoves(g,pi,g.dice);g.message=`${g.players[pi].name} تاس ${g.dice} آورد`;if(!moves.length){const d=g.dice;g.dice=null;if(d!==6)g.turn=nextUnfinished(g,(pi+1)%g.players.length);return {ok:true,moves:[],passed:true};}return {ok:true,moves};}
function botChoice(g,pi,moves){let best=moves[0],score=-999;for(const m of moves){const v=g.players[pi].pieces[m],to=v<0?0:v+g.dice;let s=to===56?100:to===0?15:to;s+=Math.random()*2;if(to<51&&!SAFE.has((START[pi]+to)%52)){for(let j=0;j<g.players.length;j++)if(j!==pi)for(const ov of g.players[j].pieces)if(ov>=0&&ov<51&&(START[j]+ov)%52===(START[pi]+to)%52)s+=30;}if(s>score){score=s;best=m;}}return best;}
module.exports={COLORS,START,SAFE,newGame,legalMoves,advance,roll,botChoice,nextUnfinished};
