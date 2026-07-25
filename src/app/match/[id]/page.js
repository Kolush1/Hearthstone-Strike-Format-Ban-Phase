'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const found = CLASSES.find((c) => c.name === name);
  return found ? found.id : String(name || '').toLowerCase().replace(/\s+/g, '');
};

function ClassIcon({ name, size = 48 }) {
  const classId = getClassId(name);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-full bg-gray-700"
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        <Image
          src={`/images/classes/${classId}.png`}
          alt={name}
          fill
          className="object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {String(name || '').substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params?.id;
  const playerNum = searchParams.get('player');

  const [match, setMatch] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerClasses, setPlayerClasses] = useState([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');

  const availableClasses = useMemo(() => CLASSES.map((c) => c.name), []);

  useEffect(() => {
    if (id) {
      setShareUrl(`${window.location.origin}/match/${id}?player=2`);
    }
  }, [id]);

  const fetchMatch = async (showLoader = false) => {
    if (!id) return;

    try {
      if (showLoader) setLoading(true);
      setError('');

      const res = await fetch(`/api/match/${id}`, { cache: 'no-store' });

      if (!res.ok) {
        let message = 'Impossible de charger le match.';
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();
      setMatch(data);

      if (playerNum === '1') setJoined(true);
      if (playerNum === '2' && data.player2Name) setJoined(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch(true);
  }, [id, playerNum]);

  useEffect(() => {
    if (!match || match.status === 'finished') return;

    const interval = setInterval(() => {
      fetchMatch(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [match?.status, id, playerNum]);

  const toggleClass = (cls) => {
    setError('');

    if (playerClasses.includes(cls)) {
      setPlayerClasses(playerClasses.filter((c) => c !== cls));
      return;
    }

    if (playerClasses.length >= 3) return;
    setPlayerClasses([...playerClasses, cls]);
  };

  const joinMatch = async () => {
    if (playerClasses.length !== 3 || !playerName.trim()) {
      setError('Entre ton pseudo et choisis exactement 3 classes.');
      return;
    }

    try {
      setError('');

      const res = await fetch(`/api/match/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player2Name: playerName.trim(),
          player2Classes: playerClasses,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de rejoindre le match.');
      }

      setJoined(true);
      await fetchMatch(false);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const banMatchup = async (row, col) => {
    try {
      setError('');

      const res = await fetch(`/api/match/${id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: playerNum, row, col }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Ban impossible.');
      }

      await fetchMatch(false);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    }
  };

  const getMyLetter = () => {
    if (!match) return '?';
    return match.playerA === playerNum ? 'A' : 'B';
  };

  const getOpponentName = () => {
    if (!match) return 'l’adversaire';
    return playerNum === '1' ? match.player2Name || 'le joueur 2' : match.player1Name || 'le joueur 1';
  };

  const isMyTurn = () => {
    if (!match || match.status !== 'banning') return false;
    const currentPlayer = match.banOrder?.[match.currentBanTurn];
    return currentPlayer === getMyLetter();
  };

  const isBannedCell = (row, col) => {
    return Array.isArray(match?.bannedMatchups)
      ? match.bannedMatchups.some((m) => m.row === row && m.col === col)
      : false;
  };

  const canBanCell = (row, col) => {
    if (!match || match.status !== 'banning') return false;
    if (!isMyTurn()) return false;
    if (isBannedCell(row, col)) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 text-center">
        Chargement...
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="mx-auto max-w-2xl rounded-lg border border-red-500/40 bg-red-950/30 p-6 text-center">
          <h1 className="mb-3 text-2xl font-bold text-red-400">Erreur</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 text-center">
        Match introuvable.
      </div>
    );
  }

  if (playerNum === '1' && match.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold">En attente du joueur 2...</h2>

          <div className="mb-6 flex justify-center gap-4">
            {match.player1Classes?.map((cls, i) => (
              <div key={i} className="flex flex-col items-center">
                <ClassIcon name={cls} size={64} />
                <span className="mt-2 text-xs">{cls}</span>
              </div>
            ))}
          </div>

          <p className="mb-4">Partage ce lien à ton adversaire :</p>

          <div className="mb-6 break-all rounded-lg bg-gray-800 p-4 text-orange-400">
            {shareUrl || 'Préparation du lien...'}
          </div>

          <button
            onClick={() => shareUrl && navigator.clipboard.writeText(shareUrl)}
            className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500"
          >
            Copier le lien
          </button>

          {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  if (playerNum === '2' && !joined && match.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 p-8 text-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-2xl font-bold">Rejoindre le match</h2>

          <div className="mb-6 flex justify-center gap-4">
            <p className="mr-4 self-center text-gray-400">{match.player1Name} joue :</p>
            {match.player1Classes?.map((cls, i) => (
              <div key={i} className="flex flex-col items-center opacity-50">
                <ClassIcon name={cls} size={48} />
                <span className="mt-1 text-xs">{cls}</span>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-lg bg-gray-800 p-6">
            <label className="mb-2 block text-sm font-medium">Ton pseudo :</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-700 px-4 py-2"
              placeholder="Entre ton pseudo"
            />
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-semibold">Choisis tes 3 classes :</h3>

            <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  onClick={() => toggleClass(cls)}
                  className={`flex flex-col items-center rounded-lg border-2 p-4 transition-all ${
                    playerClasses.includes(cls)
                      ? 'border-orange-400 bg-orange-600'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <ClassIcon name={cls} size={48} />
                  <span className="mt-2 text-center text-xs">{cls}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-center text-sm text-gray-400">
              {playerClasses.length}/3 classes sélectionnées
            </p>

            {error && <p className="mt-4 text-center text-red-400">{error}</p>}

            <div className="mt-6 text-center">
              <button
                onClick={joinMatch}
                disabled={playerClasses.length !== 3 || !playerName.trim()}
                className="rounded-lg bg-green-600 px-8 py-3 font-semibold hover:bg-green-500 disabled:bg-gray-600"
              >
                Rejoindre le match
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rowClasses = match.player1Classes || [];
  const colClasses = match.player2Classes || [];

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-orange-500">Phase de bannissement</h1>
          <p className="mt-2 text-gray-400">
            Tu es le joueur <span className="text-xl font-bold text-yellow-400">{getMyLetter()}</span>
          </p>

          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400">{match.player1Name}</span>
              <div className="mt-1 flex gap-2">
                {rowClasses.map((cls, i) => (
                  <ClassIcon key={i} name={cls} size={32} />
                ))}
              </div>
            </div>

            <span className="text-2xl font-bold">VS</span>

            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400">{match.player2Name}</span>
              <div className="mt-1 flex gap-2">
                {colClasses.map((cls, i) => (
                  <ClassIcon key={i} name={cls} size={32} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {match.status === 'banning' && (
          <div className="mb-6 text-center">
            <p className="text-xl">
              {isMyTurn() ? (
                <span className="font-bold text-green-400">C&apos;est ton tour de bannir !</span>
              ) : (
                <span className="text-gray-400">En attente de {getOpponentName()}...</span>
              )}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Ban {Number(match.currentBanTurn ?? 0) + 1} / {match.banOrder?.length || 4}
            </p>
          </div>
        )}

        {match.status === 'finished' && (
          <div className="mb-6 text-center">
            <p className="text-xl font-bold text-green-400">Phase de ban terminée</p>
            <p className="mt-2 text-sm text-gray-400">
              Les cases rouges sont bannies, les vertes restent jouables.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-center text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl bg-gray-800 p-4">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className="p-3"></th>
                {colClasses.map((cls, colIndex) => (
                  <th key={colIndex} className="p-3">
                    <div className="flex flex-col items-center gap-2">
                      <ClassIcon name={cls} size={40} />
                      <span className="text-xs">{cls}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowClasses.map((rowCls, rowIndex) => (
                <tr key={rowIndex}>
                  <th className="p-3">
                    <div className="flex flex-col items-center gap-2">
                      <ClassIcon name={rowCls} size={40} />
                      <span className="text-xs">{rowCls}</span>
                    </div>
                  </th>

                  {colClasses.map((colCls, colIndex) => {
                    const banned = isBannedCell(rowIndex, colIndex);
                    const clickable = canBanCell(rowIndex, colIndex);

                    return (
                      <td key={colIndex} className="p-2">
                        <button
                          onClick={() => clickable && banMatchup(rowIndex, colIndex)}
                          disabled={!clickable}
                          className={`w-full rounded-lg border p-4 transition ${
                            banned
                              ? 'border-red-500 bg-red-700 text-white'
                              : clickable
                              ? 'border-green-400 bg-green-700 hover:bg-green-600'
                              : 'border-green-900 bg-green-800 text-white'
                          } ${!clickable ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-sm font-semibold">
                              {rowCls} vs {colCls}
                            </div>
                            <div className="text-xs">
                              {banned ? 'Banni' : 'Jouable'}
                            </div>
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {match.status === 'finished' && Array.isArray(match.matchOrder) && (
        <div className="mt-8 rounded-xl bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-bold text-orange-400">
            Ordre aléatoire des 5 affrontements
            </h2>
            <div className="space-y-3">
            {match.matchOrder.map((m, index) => (
                <div
                key={`${m.row}-${m.col}-${index}`}
                className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-4 py-3"
                >
                <span className="font-semibold text-gray-300">Match {index + 1}</span>
                <span className="text-white">
                    {m.player1Class} vs {m.player2Class}
                </span>
                </div>
            ))}
            </div>
        </div>
        )}
      </div>
    </div>
  );
}
