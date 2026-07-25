import { getMatch, updateMatch } from '../../route';

function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const buf = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(buf);
    const value = buf[0];
    if (value < limit) {
      return value % maxExclusive;
    }
  }
}

function secureShuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export async function POST(request, context) {
  const { id } = await context.params;
  const { player, row, col } = await request.json();

  const match = await getMatch(id);

  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.status !== 'banning') {
    return Response.json({ error: 'Match is not in banning phase' }, { status: 400 });
  }

  const currentLetter = match.banOrder[match.currentBanTurn];
  const playerLetter = match.playerA === player ? 'A' : 'B';

  if (currentLetter !== playerLetter) {
    return Response.json({ error: 'Not your turn' }, { status: 403 });
  }

  const alreadyBanned = (match.bannedMatchups || []).some(
    (b) => b.row === row && b.col === col
  );

  if (alreadyBanned) {
    return Response.json({ error: 'Already banned' }, { status: 400 });
  }

  const newBans = [...(match.bannedMatchups || []), { row, col, byPlayer: player }];
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

  const shuffled = secureShuffle(remainingMatchups);

  const rowClasses =
    match.playerA === '1' ? match.player1Classes : match.player2Classes;
  const colClasses =
    match.playerB === '1' ? match.player1Classes : match.player2Classes;

  return shuffled.map((m, index) => ({
    row: m.row,
    col: m.col,
    order: index + 1,
    playerAClass: rowClasses[m.row],
    playerBClass: colClasses[m.col],
  }));
}
