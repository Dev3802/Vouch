'use client';

import { useState } from 'react';
import { Persona, DateObj } from '@/lib/types';

interface MatchPanelProps {
  personas: Persona[];
  currentUserKey: string;
  onDateComplete: (dateObj: DateObj) => void;
}

export function MatchPanel({ personas, currentUserKey, onDateComplete }: MatchPanelProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [matches, setMatches] = useState<Persona[]>([]);
  const [activeDate, setActiveDate] = useState<DateObj | null>(null);

  const available = personas.filter(p => p.pubkey !== currentUserKey);
  const currentCard = available[cardIndex % available.length];

  function handleLike() {
    setMatches(prev => [...prev, currentCard]);
    setCardIndex(prev => prev + 1);
  }

  function handlePass() {
    setCardIndex(prev => prev + 1);
  }

  function handlePropose(persona: Persona) {
    const dateObj: DateObj = {
      id: `date-${Date.now()}`,
      parties: [currentUserKey, persona.pubkey],
      status: 'proposed',
    };
    setActiveDate(dateObj);
  }

  function handleConfirm() {
    if (!activeDate) return;
    setActiveDate({ ...activeDate, status: 'confirmed' });
  }

  function handleComplete() {
    if (!activeDate) return;
    const completed = { ...activeDate, status: 'completed' as const };
    setActiveDate(null);
    onDateComplete(completed);
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <h2 className="text-lg font-semibold mb-4">Match</h2>

      {activeDate ? (
        <div className="space-y-4">
          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-sm text-zinc-400 mb-1">Active Date</p>
            <p className="font-medium">{personas.find(p => p.pubkey === activeDate.parties[1])?.name}</p>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
              activeDate.status === 'proposed' ? 'bg-amber-500/20 text-amber-400' :
              activeDate.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {activeDate.status}
            </span>
          </div>
          <div className="flex gap-2">
            {activeDate.status === 'proposed' && (
              <button onClick={handleConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition">
                Confirm Date
              </button>
            )}
            {activeDate.status === 'confirmed' && (
              <button onClick={handleComplete} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition">
                Complete Date
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Card */}
          {currentCard && (
            <div className="bg-zinc-800 rounded-xl p-6 text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                {currentCard.avatar}
              </div>
              <h3 className="text-lg font-semibold">{currentCard.name}</h3>
              <p className="text-sm text-zinc-400 mt-1">{currentCard.bio}</p>
              <p className="text-xs text-zinc-600 font-mono mt-2">{currentCard.pubkey.slice(0, 8)}...</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handlePass} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 rounded-lg text-sm font-medium transition">
              Pass
            </button>
            <button onClick={handleLike} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-medium transition">
              Like
            </button>
          </div>

          {/* Matches */}
          {matches.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Matches</h3>
              <div className="space-y-1">
                {matches.map(m => (
                  <button
                    key={m.pubkey}
                    onClick={() => handlePropose(m)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition text-left"
                  >
                    <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">{m.avatar}</span>
                    <span className="text-sm">{m.name}</span>
                    <span className="text-xs text-purple-400 ml-auto">Propose date</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
