import { getMatch, updateMatch } from '../../route';

export async function POST(request, context) {
  const { id } = await context.params;
  const { token, row, col } = await request.json();

  const match = await getMatch(id);

  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.status !== 'banning') {
    return Response.json({ error: 'Match is not in banning phase' }, { status: 400 });
  }

  let actualPlayer = null;

  if (token && token === match.player1Token) {
    actualPlayer = '1';
  } else if (token && token === match.player2Token) {
    actualPlayer = '2';
  }

  if (!actualPlayer) {
    return Response.json({ error: 'Unauthorized player' }, { status: 403 });
  }

  const currentLetter = match.banOrder[match.currentBanTurn];
  const playerLetter = match.playerA === actualPlayer ? 'A' : 'B';

  if (currentLetter !== playerLetter) {
    return Response.json({ error: 'Not your turn' }, { status: 403 });
  }

  const alreadyBanned = (match.bannedMatchups || []).some(
    (b) => b.row === row && b.col === col
  );

  if (alreadyBanned) {
    return Response.json({ error: 'Already banned' }, { status: 400 });
  }

  const newBans = [...(match.bannedMatchups || []), { row, col, byPlayer: actualPlayer }];
  const newTurn = match.currentBanTurn + 1;

  const updates = {
    bannedMatchups: newBans,
    currentBanTurn: newTurn,
  };

  if (newTurn >= 4) {
    updates.status = 'finished';
    updates.matchOrder = generateMatchOrder(match, newBans);
    updates.finishedAt = Date.now();
  }

  const updated = await updateMatch(id, updates);
  return Response.json(updated);
}

function generateMatchOrder(match, bannedMatchups) {
  const allMatchups = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      allMatchups.push({ row, col });
    }
  }

  const remainingMatchups = allMatchups.filter(
    (m1) => !bannedMatchups.some((m2) => m1.row === m2.row && m1.col === m2.col)
  );

  for (let i = remainingMatchups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingMatchups[i], remainingMatchups[j]] = [remainingMatchups[j], remainingMatchups[i]];
  }

  const rowClasses =
    match.playerA === '1' ? match.player1Classes : match.player2Classes;
  const colClasses =
    match.playerB === '1' ? match.player1Classes : match.player2Classes;

  return remainingMatchups.map((m, index) => ({
    row: m.row,
    col: m.col,
    order: index + 1,
    playerAClass: rowClasses[m.row],
    playerBClass: colClasses[m.col],
  }));
}
