import { getMatch, updateMatch } from '../../route';

export async function POST(request, context) {
  const { id } = await context.params;
  const { player2Name, player2Classes } = await request.json();

  const match = await getMatch(id);

  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  const isPlayer1A = Math.random() < 0.5;
  const playerA = isPlayer1A ? '1' : '2';
  const playerB = isPlayer1A ? '2' : '1';

  const banOrder = ['A', 'B', 'A', 'B'];

  const updated = await updateMatch(id, {
    player2Name,
    player2Classes,
    status: 'banning',
    playerA,
    playerB,
    banOrder,
    currentBanTurn: 0,
  });

  return Response.json(updated);
}
