'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnect } from '@/components/WalletConnect';
import { ProfilePanel } from '@/components/ProfilePanel';
import { PERSONAS } from '@/lib/seed';

export default function Home() {
  useWallet(); // wallet context available for future panels
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold">Vouch</h1>
          <p className="text-sm text-zinc-500">Dating reputation you can&apos;t reset</p>
        </div>
        <WalletConnect />
      </header>

      {/* Persona selector for demo */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {PERSONAS.map((p) => (
          <button
            key={p.pubkey}
            onClick={() => setSelectedPersona(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              selectedPersona.pubkey === p.pubkey
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile */}
        <div>
          <ProfilePanel
            name={selectedPersona.name}
            pubkey={selectedPersona.pubkey}
            bio={selectedPersona.bio}
            avatar={selectedPersona.avatar}
            chain={selectedPersona.chain}
          />
        </div>

        {/* Center: Match panel placeholder */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Match</h2>
          <p className="text-zinc-500 text-sm">Match panel coming next.</p>
        </div>

        {/* Right: Chain panel placeholder */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Chain</h2>
          <p className="text-zinc-500 text-sm">Chain panel coming next.</p>
        </div>
      </div>
    </main>
  );
}
