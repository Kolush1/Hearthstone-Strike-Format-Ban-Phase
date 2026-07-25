import { v4 as uuidv4 } from 'uuid';
import { redis, getMatchKey } from '@/lib/redis';

export async function POST(request) {
  const { player1Name, player1Classes } = await request.json();
  
  const matchId = uuidv4();
  const match = {
    id: matchId,
    player1Name,
    player1Classes,
    player2Name: null,
    player2Classes: null,
    status: 'waiting',
    playerA: null,
    playerB: null,
    banOrder: [],
    currentBanTurn: 0,
    bannedMatchups: [],
    matchOrder: null // ← Nouveau : ordre des 5 matchups à jouer
  };
  
  // Stockage dans Redis (expire après 24h)
  await redis.set(getMatchKey(matchId), match, { ex: 86400 });
  
  return Response.json({ matchId });
}

export async function getMatch(id) {
  return await redis.get(getMatchKey(id));
}

export async function updateMatch(id, updates) {
  const match = await getMatch(id);
  if (match) {
    const updated = { ...match, ...updates };
    await redis.set(getMatchKey(id), updated, { ex: 86400 });
    return updated;
  }
  return null;
}
