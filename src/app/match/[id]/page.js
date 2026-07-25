'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const CLASS_ICONS = {
  'Death Knight': '/classes/deathknight.png',
  'Demon Hunter': '/classes/demonhunter.png',
  Druid: '/classes/druid.png',
  Hunter: '/classes/hunter.png',
  Mage: '/classes/mage.png',
  Paladin: '/classes/paladin.png',
  Priest: '/classes/priest.png',
  Rogue: '/classes/rogue.png',
  Shaman: '/classes/shaman.png',
  Warlock: '/classes/warlock.png',
  Warrior: '/classes/warrior.png',
};

function ClassBadge({
  classNameValue,
  selected = false,
  onClick = null,
  compact = false,
  centered = false,
}) {
  const iconSrc = CLASS_ICONS[classNameValue];
  const isButton = typeof onClick === 'function';

  const baseClasses = compact
    ? 'gap-2 px-3 py-2 text-sm'
    : 'gap-3 px-4 py-3 text-sm';

  const alignClasses = centered ? 'justify-center text-center' : 'justify-start text-left';

  const stateClasses = selected
    ? 'border-orange-400 bg-orange-500/20 text-orange-200'
    : 'border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800';

  const content = (
    <>
      <span className={`flex items-center ${compact ? 'h-6 w-6' : 'h-7 w-7'} shrink-0 justify-center`}>
        {iconSrc ? (
          <Image
            src={iconSrc}
            alt={classNameValue}
            width={compact ? 24 : 28}
            height={compact ? 24 : 28}
            className="h-auto w-auto object-contain"
          />
        ) : (
          <span className="text-xs text-slate-400">?</span>
        )}
      </span>
      <span className="leading-tight">{classNameValue}</span>
    </>
  );

  if (isButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center rounded-lg border transition ${baseClasses} ${alignClasses} ${stateClasses}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center rounded-lg border border-slate-600 bg-slate-900 text-slate-100 ${baseClasses} ${alignClasses}`}
    >
      {content}
    </div>
  );
}

export default function MatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const matchId = params.id;
  const playerNum = searchParams.get('player');

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (!matchId) return;
    fetchMatch();
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.set('player', '2');
    setInviteLink(url.toString());
  }, [matchId]);

  async function fetchMatch() {
    try {
      const res = await fetch(`/api/match/${matchId}`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors du chargement du match');
        setLoading(false);
        return;
      }

      setMatch(data);
      setLoading(false);
    } catch (err) {
      setError('Erreur réseau');
      setLoading(false);
    }
  }

  async function copyInviteLink() {
    try {
      if (!inviteLink) {
        setError('Lien d’invitation indisponible');
        return;
      }

      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError('Impossible de copier le lien');
    }
  }

  async function joinMatch(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const player2Name = formData.get('player2Name');

    if (!player2Name || selectedClasses.length !== 3) {
      setError('Entre un pseudo et choisis exactement 3 classes');
      return;
    }

    try {
      const res = await fetch(`/api/match/${matchId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player2Name,
          player2Classes: selectedClasses,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Impossible de rejoindre le match');
        return;
      }

      setMatch(data);
      setError('');
    } catch (err) {
      setError('Erreur réseau');
    }
  }

  async function banMatchup(row, col) {
    if (!match || !canBanCell(row, col)) return;

    try {
      const res = await fetch(`/api/match/${matchId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: playerNum,
          row,
          col,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ban impossible');
        return;
      }

      setMatch(data);
      setError('');
    } catch (err) {
      setError('Erreur réseau');
    }
  }

  function toggleClass(className) {
    setSelectedClasses((prev) => {
      if (prev.includes(className)) {
        return prev.filter((c) => c !== className);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, className];
    });
  }

  function getCurrentTurnLetter() {
    if (!match?.banOrder || match.currentBanTurn == null) return null;
    return match.banOrder[match.currentBanTurn] || null;
  }

  function getPlayerLetter(num) {
    if (!match) return null;
    if (match.playerA === String(num)) return 'A';
    if (match.playerB === String(num)) return 'B';
    return null;
  }

  function isMyTurn() {
    if (!match || match.status !== 'banning') return false;
    const turnLetter = getCurrentTurnLetter();
    const myLetter = getPlayerLetter(playerNum);
    return turnLetter && myLetter && turnLetter === myLetter;
  }

  function isCellBanned(row, col) {
    return (match?.bannedMatchups || []).some((b) => b.row === row && b.col === col);
  }

  function canBanCell(row, col) {
    return isMyTurn() && !isCellBanned(row, col);
  }

  function getBanOwner(row, col) {
    const ban = (match?.bannedMatchups || []).find((b) => b.row === row && b.col === col);
    if (!ban) return null;
    return match.playerA === ban.byPlayer ? 'A' : 'B';
  }

  function getMatchOrderIndex(row, col) {
    const index = (match?.matchOrder || []).findIndex((m) => m.row === row && m.col === col);
    return index >= 0 ? index + 1 : null;
  }

  const allClasses = [
    'Death Knight',
    'Demon Hunter',
    'Druid',
    'Hunter',
    'Mage',
    'Paladin',
    'Priest',
    'Rogue',
    'Shaman',
    'Warlock',
    'Warrior',
  ];

  const rowPlayerName =
    match?.playerA === '1' ? match?.player1Name : match?.player2Name;

  const colPlayerName =
    match?.playerB === '1' ? match?.player1Name : match?.player2Name;

  const rowClasses =
    match?.playerA === '1' ? match?.player1Classes || [] : match?.player2Classes || [];

  const colClasses =
    match?.playerB === '1' ? match?.player1Classes || [] : match?.player2Classes || [];

  const finishedMatchups = useMemo(() => {
    return (match?.matchOrder || []).map((m, index) => ({
      ...m,
      displayAClass: m.playerAClass || rowClasses[m.row] || 'Classe inconnue',
      displayBClass: m.playerBClass || colClasses[m.col] || 'Classe inconnue',
      displayOrder: m.order || index + 1,
    }));
  }, [match?.matchOrder, rowClasses, colClasses]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">Chargement...</div>
      </main>
    );
  }

  if (error && !match) {
    return (
      <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-slate-900 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">Match introuvable.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold">Strike / Ban Phase</h1>
        <p className="mb-6 text-sm text-slate-300">Match ID : {matchId}</p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {match.status === 'waiting' && playerNum === '2' && (
          <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">Rejoindre le match</h2>

            <form onSubmit={joinMatch} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Pseudo</label>
                <input
                  name="player2Name"
                  type="text"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none"
                  placeholder="Ton pseudo"
                  required
                />
              </div>

              <div>
                <p className="mb-3 text-sm text-slate-300">
                  Choisis exactement 3 classes
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {allClasses.map((className) => {
                    const selected = selectedClasses.includes(className);
                    return (
                      <ClassBadge
                        key={className}
                        classNameValue={className}
                        selected={selected}
                        onClick={() => toggleClass(className)}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-slate-950 hover:bg-orange-400"
              >
                Rejoindre
              </button>
            </form>
          </section>
        )}

        {match.status === 'waiting' && playerNum !== '2' && (
          <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-800 p-6">
            <h2 className="mb-2 text-xl font-semibold">En attente du joueur 2</h2>
            <p className="mb-4 text-slate-300">
              Partage ce lien au second joueur pour qu’il rejoigne le match.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={copyInviteLink}
                className="inline-flex w-fit items-center rounded-lg bg-orange-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </button>

              {inviteLink && (
                <span className="break-all text-sm text-slate-400">
                  {inviteLink}
                </span>
              )}
            </div>
          </section>
        )}

        {match.status !== 'waiting' && (
          <>
            <section className="mb-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                <div className="mb-1 text-xs uppercase tracking-wide text-orange-300">
                  Joueur A
                </div>
                <div className="mb-3 text-xl font-bold text-orange-400">{rowPlayerName}</div>
                <ul className="space-y-2">
                  {rowClasses.map((c, i) => (
                    <li key={i}>
                      <ClassBadge classNameValue={c} compact />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                <div className="mb-1 text-xs uppercase tracking-wide text-blue-300">
                  Joueur B
                </div>
                <div className="mb-3 text-xl font-bold text-blue-400">{colPlayerName}</div>
                <ul className="space-y-2">
                  {colClasses.map((c, i) => (
                    <li key={i}>
                      <ClassBadge classNameValue={c} compact />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {match.status === 'banning' && (
              <section className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-5">
                <div className="text-sm text-slate-300">
                  Tour actuel :
                  <span className="ml-2 font-semibold text-white">
                    Joueur {getCurrentTurnLetter()}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  {isMyTurn() ? (
                    <span className="text-emerald-300">C’est à toi de ban un affrontement.</span>
                  ) : (
                    <span className="text-slate-300">En attente de l’autre joueur.</span>
                  )}
                </div>
              </section>
            )}

            <section className="mb-8 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800 p-4">
              <table className="min-w-[720px] border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="p-0 align-top">
                      <div className="relative h-24 w-40 min-w-[10rem] overflow-hidden rounded-xl border border-slate-600 bg-slate-900">
                        <div className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_49.4%,rgba(148,163,184,0.9)_50%,transparent_50.6%)]" />
                        <div className="absolute bottom-2 left-2">
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">
                            Lignes
                          </div>
                          <div className="text-sm font-bold text-orange-400">Joueur A</div>
                          <div className="max-w-[78px] truncate text-[11px] text-white">
                            {rowPlayerName}
                          </div>
                        </div>
                        <div className="absolute right-2 top-2 text-right">
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">
                            Colonnes
                          </div>
                          <div className="text-sm font-bold text-blue-400">Joueur B</div>
                          <div className="max-w-[78px] truncate text-[11px] text-white">
                            {colPlayerName}
                          </div>
                        </div>
                      </div>
                    </th>

                    {colClasses.map((className, colIndex) => (
                      <th key={colIndex} className="min-w-[150px]">
                        <div className="rounded-xl border border-slate-600 bg-slate-900 p-2">
                          <ClassBadge
                            classNameValue={className}
                            compact
                            centered
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rowClasses.map((rowClass, rowIndex) => (
                    <tr key={rowIndex}>
                      <th className="min-w-[150px]">
                        <div className="rounded-xl border border-slate-600 bg-slate-900 p-2">
                          <ClassBadge
                            classNameValue={rowClass}
                            compact
                          />
                        </div>
                      </th>

                      {colClasses.map((colClass, colIndex) => {
                        const banned = isCellBanned(rowIndex, colIndex);
                        const banOwner = getBanOwner(rowIndex, colIndex);
                        const orderIndex = getMatchOrderIndex(rowIndex, colIndex);
                        const clickable = canBanCell(rowIndex, colIndex);

                        return (
                          <td key={`${rowIndex}-${colIndex}`}>
                            <button
                              type="button"
                              onClick={() => banMatchup(rowIndex, colIndex)}
                              disabled={!clickable}
                              className={`flex h-24 w-full min-w-[150px] items-center justify-center rounded-xl border px-3 py-3 text-center transition ${
                                banned
                                  ? 'cursor-not-allowed border-red-500/70 bg-red-500/20 text-red-100'
                                  : clickable
                                  ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/30'
                                  : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-50'
                              }`}
                            >
                              <div>
                                {banned ? (
                                  <>
                                    <div className="text-sm font-bold">Banni</div>
                                    <div className="mt-1 text-xs text-red-100/80">
                                      par joueur {banOwner}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xs uppercase tracking-wide text-emerald-100/80">
                                      {orderIndex ? `Match ${orderIndex}` : 'Disponible'}
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-white">
                                      {rowClass} vs {colClass}
                                    </div>
                                  </>
                                )}
                              </div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {match.status === 'finished' && (
              <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
                <h2 className="mb-4 text-2xl font-bold text-orange-400">
                  Ordre aléatoire des {finishedMatchups.length} affrontements
                </h2>

                <div className="space-y-3">
                  {finishedMatchups.map((m, index) => (
                    <div
                      key={`${m.row}-${m.col}-${index}`}
                      className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="font-bold text-slate-100">
                          Match {m.displayOrder}
                        </div>
                        <div className="flex items-center gap-2 text-slate-200">
                          <ClassBadge classNameValue={m.displayAClass} compact />
                          <span className="text-slate-400">vs</span>
                          <ClassBadge classNameValue={m.displayBClass} compact />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
