import { getMatch, updateMatch } from '../../route';

function randomBool() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] & 1) === 0;
}

export async function POST(request, context) {
  const { id } = await context.params;
  const { player2Name, player2Classes } = await request.json();

  const match = await getMatch(id);

  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.player2Name || match.status !== 'waiting') {
    return Response.json({ error: 'Match already joined' }, { status: 400 });
  }

  const isPlayer1A = randomBool();
  const playerA = isPlayer1A ? '1' : '2';
  const playerB = isPlayer1A ? '2' : '1';

  const banOrder = ['A', 'B', 'B', 'A'];

  const updated = await updateMatch(id, {
    player2Name,
    player2Classes,
    status: 'banning',
    playerA,
    playerB,
    banOrder,
    currentBanTurn: 0,
    bannedMatchups: [],
    matchOrder: [],
    randomizedAt: Date.now(),
  });

  return Response.json(updated);
}
