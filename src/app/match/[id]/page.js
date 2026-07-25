'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';

const CLASSES = [
  { id: 'demonhunter', name: 'Demon Hunter' },
  { id: 'druid', name: 'Druid' },
  { id: 'hunter', name: 'Hunter' },
  { id: 'mage', name: 'Mage' },
  { id: 'paladin', name: 'Paladin' },
  { id: 'priest', name: 'Priest' },
  { id: 'rogue', name: 'Rogue' },
  { id: 'shaman', name: 'Shaman' },
  { id: 'warlock', name: 'Warlock' },
  { id: 'warrior', name: 'Warrior' },
  { id: 'deathknight', name: 'Death Knight' },
];

const getClassId = (name) => {
  const found = CLASSES.find(c => c.name === name);
  return found ? found.id : name.toLowerCase().replace(' ', '');
};

const ClassIcon = ({ name, size = 48 }) => {
  const classId = getClassId(name);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={`/images/classes/${classId}.png`}
        alt={name}
        fill
        className="object-contain"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-full text-xs font-bold">
        {name.substring(0, 2).toUpperCase()}
      </div>
    </div>
  );
};

export default function MatchPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const playerNum = searchParams.get('player');
  
  const [match, setMatch] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerClasses, setPlayerClasses] = useState([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!match || match.status === 'finished') return;
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [match?.status]);

  const fetchMatch = async () => {
    const res = await fetch(`/api/match/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMatch(data);
      if (playerNum === '1') setJoined(true);
      if (playerNum === '2' && data.player2Name) setJoined(true);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const joinMatch = async () => {
    if (playerClasses.length !== 3 || !playerName.trim()) return;
    
    const res = await fetch(`/api/match/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player2Name: playerName, player2Classes: playerClasses })
    });
    
    if (res.ok) {
      setJoined(true);
      fetchMatch();
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  const banMatchup = async (row, col) => {
    const res = await fetch(`/api/match/${id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: playerNum, row, col })
    });
    
    if (res.ok) fetchMatch();
  };

  const toggleClass = (cls) => {
    if (playerClasses.includes(cls)) {
      setPlayerClasses(playerClasses.filter(c => c !== cls));
    } else if (playerClasses.length < 3) {
      setPlayerClasses([...playerClasses, cls]);
    }
  };

  if (!match) return <div className="min-h-screen bg-gray-900 text-white p-8 text-center">Chargement...</div>;

  // Phase d'attente du joueur 2
  if (playerNum === '1' && match.status === 'waiting') {
    const shareUrl = `${window.location.origin}/match/${id}?player=2`;
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">En attente du joueur 2...</h2>
          
          <div className="flex justify-center gap-4 mb-6">
            {match.player1Classes.map((cls, i) => (
              <div key={i} className="flex flex-col items-center">
                <ClassIcon name={cls} size={64} />
                <span className="text-xs mt-2">{cls}</span>
              </div>
            ))}
          </div>
          
          <p className="mb-4">Partage ce lien à ton adversaire :</p>
          <div className="bg-gray-800 p-4 rounded-lg break-all text-orange-400 mb-6">
            {shareUrl}
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          >
            Copier le lien
          </button>
        </div>
      </div>
    );
  }

  // Formulaire d'inscription joueur 2
  if (playerNum === '2' && !joined && match.status === 'waiting') {
    const availableClasses = CLASSES.map(c => c.name).filter(c => !match.player1Classes.includes(c));

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">Rejoindre le match</h2>
          
          <div className="flex justify-center gap-4 mb-6">
            <p className="text-gray-400 mr-4 self-center">{match.player1Name} joue :</p>
            {match.player1Classes.map((cls, i) => (
              <div key={i} className="flex flex-col items-center opacity-50">
                <ClassIcon name={cls} size={48} />
                <span className="text-xs mt-1">{cls}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium mb-2">Ton pseudo :</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600"
              placeholder="Entre ton pseudo"
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Choisis tes 3 classes :</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  onClick={() => toggleClass(cls)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                    playerClasses.includes(cls)
                      ? 'bg-orange-600 border-orange-400'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <ClassIcon name={cls} size={48} />
                  <span className="text-xs mt-2 text-center">{cls}</span>
                </button>
              ))}
            </div>
            
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            
            <div className="mt-6 text-center">
              <button
                onClick={joinMatch}
                disabled={playerClasses.length !== 3 || !playerName.trim()}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg font-semibold"
              >
                Rejoindre le match
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Phase de ban
  const isMyTurn = () => {
    if (match.status !== 'banning') return false;
    const currentPlayer = match.banOrder[match.currentBanTurn];
    return currentPlayer === (match.playerA === playerNum ? 'A' : 'B');
  };

  const getMyLetter = () => match.playerA === playerNum ? 'A' : 'B';
  const getOpponentName = () => playerNum === '1' ? match.player2Name : match.player1Name;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-500">Phase de Bannissement</h1>
          <p className="text-gray-400 mt-2">
            Tu es le joueur <span className="text-xl font-bold text-yellow-400">{getMyLetter()}</span>
          </p>
          <div className="flex justify-center items-center gap-8 mt-4">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400">{match.player1Name}</span>
              <div className="flex gap-2 mt-1">
                {match.player1Classes.map((cls, i) => (
                  <ClassIcon key={i} name={cls} size={32} />
                ))}
              </div>
            </div>
            <span className="text-2xl font-bold">VS</span>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400">{match.player2Name}</span>
              <div className="flex gap-2 mt-1">
                {match.player2Classes.map((cls, i) => (
                  <ClassIcon key={i} name={cls} size={32} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {match.status === 'banning' && (
          <div className="text-center mb-6">
            <p className="text-xl">
              {isMyTurn() ? (
                <span className="text-green-400 font-bold">C'est ton tour de bannir !</span>
              ) : (
                <span className="text-gray-400">En attente de {getOpponentName()}...</span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Tour {match.currentBanTurn + 1}/4 : Joueur {match.banOrder[match.currentBanTurn]} doit bannir
            </p>
          </div>
        )}

        {/* Tableau des matchups - NE PAS MODIFIER CETTE SECTION */}
        <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2"></th>
                {match.player2Classes.map((cls, i) => (
                  <th key={i} className="p-2">
                    <div className="flex flex-col items-center">
                      <ClassIcon name={cls} size={40} />
                      <span className="text-xs mt-1">{cls}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {match.player1Classes.map((rowCls, rowIdx) => (
                <tr key={rowIdx}>
                  <th className="p-2">
                    <div className="flex flex-col items-center">
                      <ClassIcon name={rowCls} size={40} />
                      <span className="text-xs mt-1">{rowCls}</span>
                    </div>
                  </th>
                  {match.player2Classes.map((colCls, colIdx) => {
                    const isBanned = match.bannedMatchups.some(
                      b => b.row === rowIdx && b.col === colIdx
                    );
                    const canBan = isMyTurn() && match.status === 'banning' && !isBanned;
                    
                    return (
                      <td key={colIdx} className="p-2">
                        <button
                          onClick={() => canBan && banMatchup(rowIdx, colIdx)}
                          disabled={!canBan}
                          className={`w-full p-4 rounded-lg font-medium transition-all min-h-[80px] ${
                            isBanned
                              ? 'bg-red-600 text-white opacity-50'
                              : canBan
                              ? 'bg-yellow-600 hover:bg-yellow-500 text-white animate-pulse'
                              : 'bg-green-700 text-green-100 hover:bg-green-600'
                          }`}
                        >
                          {isBanned ? (
                            <span className="line-through">BANNI</span>
                          ) : (
                            <span className="text-xs">VS</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {match.status === 'finished' && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">
              Ordre des matchs à jouer
            </h2>
            
            <div className="space-y-3">
              {match.matchOrder.map((m, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-4"
                >
                  <span className="text-gray-400 font-bold text-2xl">#{idx + 1}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <ClassIcon name={m.player1Class} size={48} />
                      <span className="text-xs mt-1 text-blue-400">{m.player1Class}</span>
                    </div>
                    <span className="text-xl text-gray-500">VS</span>
                    <div className="flex flex-col items-center">
                      <ClassIcon name={m.player2Class} size={48} />
                      <span className="text-xs mt-1 text-red-400">{m.player2Class}</span>
                    </div>
                  </div>
                  <div className="w-12"></div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-600">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Récapitulatif des bans :</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-2">
                    {match.player1Name} (Joueur {match.playerA}) :
                  </p>
                  {match.bannedMatchups
                    .filter((_, idx) => match.banOrder[idx] === match.playerA)
                    .map((ban, i) => (
                      <div key={i} className="flex items-center gap-2 text-red-400 mb-1">
                        <ClassIcon name={match.player1Classes[ban.row]} size={24} />
                        <span>vs</span>
                        <ClassIcon name={match.player2Classes[ban.col]} size={24} />
                      </div>
                    ))}
                </div>
                <div>
                  <p className="text-gray-400 mb-2">
                    {match.player2Name} (Joueur {match.playerB}) :
                  </p>
                  {match.bannedMatchups
                    .filter((_, idx) => match.banOrder[idx] === match.playerB)
                    .map((ban, i) => (
                      <div key={i} className="flex items-center gap-2 text-red-400 mb-1">
                        <ClassIcon name={match.player1Classes[ban.row]} size={24} />
                        <span>vs</span>
                        <ClassIcon name={match.player2Classes[ban.col]} size={24} />
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Le joueur avec le meilleur seed choisit le premier matchup.</p>
              <p>Ensuite, le perdant choisit le suivant.</p>
              <p className="mt-2 font-semibold text-white">Premier à 3 victoires gagne la série !</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
