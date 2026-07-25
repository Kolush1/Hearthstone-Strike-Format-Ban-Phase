import { randomUUID } from 'node:crypto';
import { getMatch, updateMatch } from '../../route';

function randomBool() {
  return Math.random() < 0.5;
}

export async function POST(request, context) {
  const { id } = await context.params;
  const { player2Name, player2Classes, inviteToken } = await request.json();

  const match = await getMatch(id);

  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.player2Name || match.status !== 'waiting') {
    return Response.json({ error: 'Match already joined' }, { status: 400 });
  }

  if (inviteToken !== match.inviteToken) {
    return Response.json({ error: 'Invalid invitation token' }, { status: 403 });
  }

  if (!player2Name || !Array.isArray(player2Classes) || player2Classes.length !== 3) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const isPlayer1A = randomBool();
  const playerA = isPlayer1A ? '1' : '2';
  const playerB = isPlayer1A ? '2' : '1';
  const player2Token = randomUUID();

  const updated = await updateMatch(id, {
    player2Name,
    player2Classes,
    player2Token,
    status: 'banning',
    playerA,
    playerB,
    banOrder: ['A', 'B', 'A', 'B'],
    currentBanTurn: 0,
    bannedMatchups: [],
    matchOrder: [],
    randomizedAt: Date.now(),
  });

  return Response.json({
    ...updated,
    redirectToken: player2Token,
  });
}
