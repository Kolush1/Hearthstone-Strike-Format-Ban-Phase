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

export default function Home() {
  const [selected, setSelected] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleClass = (cls) => {
    if (selected.includes(cls.id)) {
      setSelected(selected.filter(c => c !== cls.id));
    } else if (selected.length < 3) {
      setSelected([...selected, cls.id]);
    }
  };

  const createMatch = async () => {
    if (selected.length !== 3 || !playerName.trim()) return;
    
    setLoading(true);
    const selectedNames = CLASSES.filter(c => selected.includes(c.id)).map(c => c.name);
    
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1Name: playerName, player1Classes: selectedNames })
    });
    
    const data = await res.json();
    router.push(`/match/${data.matchId}?player=1`);
  };

  const getClassName = (id) => CLASSES.find(c => c.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-orange-500">
          Hearthstone Strike
        </h1>
        <p className="text-center text-gray-400 mb-8">Phase de bannissement</p>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Ton pseudo :</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:border-orange-500 outline-none"
            placeholder="Entre ton pseudo"
          />
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Choisis tes 3 classes :</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => toggleClass(cls)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  selected.includes(cls.id)
                    ? 'bg-orange-600 border-orange-400 text-white'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                } ${selected.length === 3 && !selected.includes(cls.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selected.length === 3 && !selected.includes(cls.id)}
              >
                <div className="w-16 h-16 mb-2 relative">
                  <Image
                    src={`/images/classes/${cls.id}.png`}
                    alt={cls.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 items-center justify-center text-xs text-gray-500 hidden">
                    {cls.name[0]}
                  </div>
                </div>
                <span className="text-xs text-center">{cls.name}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {selected.map(id => (
              <span key={id} className="px-3 py-1 bg-orange-600 rounded-full text-sm">
                {getClassName(id)}
              </span>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={createMatch}
              disabled={selected.length !== 3 || !playerName.trim() || loading}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
            >
              {loading ? 'Création...' : 'Créer le match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
