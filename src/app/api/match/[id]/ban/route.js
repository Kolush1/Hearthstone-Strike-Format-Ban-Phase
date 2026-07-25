import { getMatch, updateMatch } from '../../route';

export async function POST(request, { params }) {
  const { player, row, col } = await request.json();
  const match = await getMatch(params.id);
  
  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }
  
  const currentLetter = match.banOrder[match.currentBanTurn];
  const playerLetter = match.playerA === player ? 'A' : 'B';
  
  if (currentLetter !== playerLetter) {
    return Response.json({ error: 'Not your turn' }, { status: 403 });
  }
  
  const alreadyBanned = match.bannedMatchups.some(b => b.row === row && b.col === col);
  if (alreadyBanned) {
    return Response.json({ error: 'Already banned' }, { status: 400 });
  }
  
  const newBans = [...match.bannedMatchups, { row, col, byPlayer: player }];
  const newTurn = match.currentBanTurn + 1;
  
  const updates = {
    bannedMatchups: newBans,
    currentBanTurn: newTurn
  };
  
  // Si c'est le dernier ban (4ème), générer l'ordre aléatoire des 5 matchups restants
  if (newTurn >= 4) {
    updates.status = 'finished';
    updates.matchOrder = generateMatchOrder(match, newBans);
  }
  
  const updated = await updateMatch(params.id, updates);
  return Response.json(updated);
}

// Fonction pour générer l'ordre aléatoire des 5 matchups restants
function generateMatchOrder(match, bannedMatchups) {
  const allMatchups = [];
  
  // Générer tous les matchups possibles (3x3 = 9)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      allMatchups.push({ row, col });
    }
  }
  
  // Filtrer les 4 matchups bannis pour garder les 5 restants
  const remainingMatchups = allMatchups.filter(m1 => 
    !bannedMatchups.some(m2 => m1.row === m2.row && m1.col === m2.col)
  );
  
  // Mélanger aléatoirement (Fisher-Yates)
  for (let i = remainingMatchups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingMatchups[i], remainingMatchups[j]] = [remainingMatchups[j], remainingMatchups[i]];
  }
  
  // Ajouter les noms des classes pour l'affichage
  return remainingMatchups.map(m => ({
    row: m.row,
    col: m.col,
    player1Class: match.player1Classes[m.row],
    player2Class: match.player2Classes[m.col]
  }));
}
