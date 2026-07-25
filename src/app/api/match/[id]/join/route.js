import { getMatch, updateMatch } from '../../route';

export async function POST(request, { params }) {
  const { player2Name, player2Classes } = await request.json();
  const match = await getMatch(params.id);
  
  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }
  
  const overlap = player2Classes.filter(c => match.player1Classes.includes(c));
  if (overlap.length > 0) {
    return Response.json({ error: `Classes en commun: ${overlap.join(', ')}` }, { status: 400 });
  }
  
  const isPlayer1A = Math.random() < 0.5;
  const playerA = isPlayer1A ? '1' : '2';
  const playerB = isPlayer1A ? '2' : '1';
  
  const startsWithA = Math.random() < 0.5;
  const banOrder = startsWithA ? ['A', 'B', 'A', 'B'] : ['B', 'A', 'B', 'A'];
  
  const updated = await updateMatch(params.id, {
    player2Name,
    player2Classes,
    status: 'banning',
    playerA,
    playerB,
    banOrder,
    currentBanTurn: 0
  });
  
  return Response.json(updated);
}
