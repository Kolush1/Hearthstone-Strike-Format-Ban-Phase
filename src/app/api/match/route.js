import { randomUUID } from 'node:crypto';

const matches = globalThis.__matches ?? new Map();
globalThis.__matches = matches;

export async function getMatch(id) {
  return matches.get(id) || null;
}

export async function updateMatch(id, updates) {
  const match = matches.get(id);

  if (!match) return null;

  const updated = {
    ...match,
    ...updates,
  };

  matches.set(id, updated);
  return updated;
}

export async function POST(request) {
  const { player1Name, player1Classes } = await request.json();

  if (!player1Name || !Array.isArray(player1Classes) || player1Classes.length !== 3) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const id = randomUUID();
  const player1Token = randomUUID();
  const inviteToken = randomUUID();

  const match = {
    id,
    status: 'waiting',
    player1Name,
    player1Classes,
    player2Name: null,
    player2Classes: [],
    player1Token,
    player2Token: null,
    inviteToken,
    playerA: null,
    playerB: null,
    banOrder: ['A', 'B', 'A', 'B'],
    currentBanTurn: 0,
    bannedMatchups: [],
    matchOrder: [],
    createdAt: Date.now(),
  };

  matches.set(id, match);

  return Response.json(match);
}
