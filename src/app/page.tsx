'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const getClassId = (name: string) => {
  const found = CLASSES.find((c) => c.name === name);
  return found ? found.id : name.toLowerCase().replace(/\s+/g, '');
};

function ClassIcon({ name, size = 48 }: { name: string; size?: number }) {
  const classId = getClassId(name);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={`/images/classes/${classId}.png`}
        alt={name}
        fill
        className="object-contain"
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [playerName, setPlayerName] = useState('');
  const [playerClasses, setPlayerClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleClass = (cls: string) => {
    setError('');

    if (playerClasses.includes(cls)) {
      setPlayerClasses(playerClasses.filter((c) => c !== cls));
      return;
    }

    if (playerClasses.length >= 3) {
      setError('Tu dois choisir exactement 3 classes.');
      return;
    }

    setPlayerClasses([...playerClasses, cls]);
  };

  const createMatch = async () => {
    setError('');

    if (!playerName.trim()) {
      setError('Entre ton pseudo.');
      return;
    }

    if (playerClasses.length !== 3) {
      setError('Tu dois choisir exactement 3 classes.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Name: playerName.trim(),
          player1Classes: playerClasses,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Erreur lors de la création du match.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/match/${data.matchId}?player=1`);
    } catch {
      setError('Erreur réseau. Réessaie.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-3">
            Hearthstone Strike Ban Phase
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Crée un match, choisis tes 3 classes, puis partage le lien avec ton
            adversaire pour lancer la phase de bannissement.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Ton pseudo :</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Entre ton pseudo"
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <h2 className="text-2xl font-semibold">Choisis tes 3 classes</h2>
            <div className="text-sm text-gray-300">
              Sélection :{' '}
              <span className="font-bold text-orange-400">
                {playerClasses.length}/3
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CLASSES.map((cls) => {
              const selected = playerClasses.includes(cls.name);

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => toggleClass(cls.name)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                    selected
                      ? 'bg-orange-600 border-orange-400'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <ClassIcon name={cls.name} size={56} />
                  <span className="text-sm mt-2 text-center">{cls.name}</span>
                </button>
              );
            })}
          </div>

          {playerClasses.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-300 mb-3">Classes choisies :</p>
              <div className="flex flex-wrap gap-3">
                {playerClasses.map((cls) => (
                  <div
                    key={cls}
                    className="flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-full px-3 py-2"
                  >
                    <ClassIcon name={cls} size={28} />
                    <span className="text-sm">{cls}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-6 text-center text-red-400 font-medium">{error}</p>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={createMatch}
              disabled={loading}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
            >
              {loading ? 'Création du match...' : 'Créer le match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
