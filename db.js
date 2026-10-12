'use strict';
const { Pool } = require('pg');
let pool = null, ready = false, warned = false;
function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
  return pool;
}
async function init() {
  const p = getPool();
  if (!p) { if (!warned) { console.log('History database disabled: DATABASE_URL is not set'); warned = true; } return false; }
  await p.query(`CREATE TABLE IF NOT EXISTS game_matches (
    id TEXT PRIMARY KEY, game_type TEXT NOT NULL CHECK (game_type IN ('manfee','fiskoot')),
    started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ NOT NULL,
    winner_team SMALLINT NOT NULL, scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    details JSONB NOT NULL DEFAULT '{}'::jsonb
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS game_match_players (
    match_id TEXT NOT NULL REFERENCES game_matches(id) ON DELETE CASCADE,
    seat SMALLINT NOT NULL, telegram_id TEXT, display_name TEXT NOT NULL,
    team SMALLINT NOT NULL, is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    claims INTEGER, taken INTEGER, details JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY(match_id, seat)
  )`);
  await p.query('CREATE INDEX IF NOT EXISTS idx_gmp_user ON game_match_players(telegram_id, match_id)');
  await p.query('CREATE INDEX IF NOT EXISTS idx_gm_ended ON game_matches(ended_at DESC)');
  ready = true; console.log('Neon/PostgreSQL history database ready'); return true;
}
async function recordMatch(m) {
  const p = getPool(); if (!p) return false;
  if (!ready) await init(); if (!ready) return false;
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const ins = await client.query(`INSERT INTO game_matches(id,game_type,started_at,ended_at,winner_team,scores,details)
      VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb) ON CONFLICT(id) DO NOTHING`,
      [m.id,m.gameType,m.startedAt || new Date(),m.endedAt || new Date(),m.winnerTeam,JSON.stringify(m.scores || []),JSON.stringify(m.details || {})]);
    if (ins.rowCount) {
      for (let i=0;i<(m.players || []).length;i++) {
        const x=m.players[i];
        await client.query(`INSERT INTO game_match_players(match_id,seat,telegram_id,display_name,team,is_bot,claims,taken,details)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) ON CONFLICT(match_id,seat) DO NOTHING`,
          [m.id,i,x.telegramId ? String(x.telegramId) : null,String(x.name || 'بازیکن').slice(0,40),x.team|0,!!x.isBot,x.claims == null ? null : x.claims|0,x.taken == null ? null : x.taken|0,JSON.stringify(x.details || {})]);
      }
    }
    await client.query('COMMIT'); return !!ins.rowCount;
  } catch(e) { await client.query('ROLLBACK').catch(()=>{}); console.error('Could not save game history:', e.message); return false; }
  finally { client.release(); }
}
async function profile(userId, { game='all', result='all', q='', limit=30, offset=0 }={}) {
  const p=getPool(); if(!p) throw new Error('DATABASE_NOT_CONFIGURED'); if(!ready) await init();
  const args=[String(userId)], filters=[`mine.telegram_id=$1`,`mine.is_bot=FALSE`];
  if(game==='manfee'||game==='fiskoot'){args.push(game);filters.push(`m.game_type=$${args.length}`)}
  if(result==='won'||result==='lost'){filters.push(`m.winner_team ${result==='won'?'=':'<>'} mine.team`)}
  if(q.trim()){args.push(q.trim().slice(0,60).toLowerCase());filters.push(`EXISTS(SELECT 1 FROM game_match_players qp WHERE qp.match_id=m.id AND position($${args.length} in lower(qp.display_name)) > 0)`)}
  const where=filters.join(' AND ');
  const totals=await p.query(`SELECT m.game_type, COUNT(DISTINCT m.id)::int total,
    COUNT(DISTINCT m.id) FILTER(WHERE m.winner_team=mine.team)::int wins,
    COUNT(DISTINCT m.id) FILTER(WHERE m.winner_team<>mine.team)::int losses
    FROM game_matches m JOIN game_match_players mine ON mine.match_id=m.id
    WHERE mine.telegram_id=$1 AND mine.is_bot=FALSE GROUP BY m.game_type`,[String(userId)]);
  const count=await p.query(`SELECT COUNT(DISTINCT m.id)::int n FROM game_matches m JOIN game_match_players mine ON mine.match_id=m.id WHERE ${where}`,args);
  const a2=args.slice(); a2.push(Math.min(50,Math.max(1,limit|0)),Math.max(0,offset|0));
  const matches=await p.query(`SELECT m.id,m.game_type,m.started_at,m.ended_at,m.winner_team,m.scores,m.details,
    mine.team AS my_team,mine.seat AS my_seat,mine.claims AS my_claims,mine.taken AS my_taken,
    (SELECT json_agg(json_build_object('name',p.display_name,'team',p.team,'isBot',p.is_bot,'claims',p.claims,'taken',p.taken,'details',p.details) ORDER BY p.seat) FROM game_match_players p WHERE p.match_id=m.id) players
    FROM game_matches m JOIN game_match_players mine ON mine.match_id=m.id WHERE ${where}
    ORDER BY m.ended_at DESC LIMIT $${a2.length-1} OFFSET $${a2.length}`,a2);
  return { stats: totals.rows, total: count.rows[0].n, matches: matches.rows };
}
async function close(){if(pool)await pool.end()}
module.exports={init,recordMatch,profile,close};
