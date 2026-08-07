'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnect } from '@/components/WalletConnect';
import { ProfilePanel } from '@/components/ProfilePanel';
import { MatchPanel } from '@/components/MatchPanel';
import { AttestationModal } from '@/components/AttestationModal';
import { PERSONAS, getPersona } from '@/lib/seed';
import { appendBlock } from '@/lib/chain';
import { Attestation, DateObj, Block } from '@/lib/types';

export default function Home() {
  const { publicKey } = useWallet();
  const currentUserKey = publicKey?.toBase58() || PERSONAS[0].pubkey;

  const [personaChains, setPersonaChains] = useState<Record<string, Block[]>>(
    () => Object.fromEntries(PERSONAS.map(p => [p.pubkey, p.chain]))
  );
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [pendingDate, setPendingDate] = useState<DateObj | null>(null);

  const handleDateComplete = useCallback((dateObj: DateObj) => {
    setPendingDate(dateObj);
  }, []);

  const handleAttestation = useCallback((attestation: Attestation, txSig: string | null) => {
    setPersonaChains(prev => {
      const targetChain = prev[attestation.to] || [PERSONAS[0].chain[0]];
      const updated = appendBlock(targetChain, attestation, txSig || undefined);
      return { ...prev, [attestation.to]: updated };
    });
    setPendingDate(null);
  }, []);

  const getChainForPersona = (pubkey: string) => personaChains[pubkey] || [];

  const counterpartyKey = pendingDate
    ? pendingDate.parties[0] === currentUserKey ? pendingDate.parties[1] : pendingDate.parties[0]
    : null;
  const counterpartyName = counterpartyKey ? getPersona(counterpartyKey)?.name || 'Unknown' : '';

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold">Vouch</h1>
          <p className="text-sm text-zinc-500">Dating reputation you can&apos;t reset</p>
        </div>
        <WalletConnect />
      </header>

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
        <div>
          <ProfilePanel
            name={selectedPersona.name}
            pubkey={selectedPersona.pubkey}
            bio={selectedPersona.bio}
            avatar={selectedPersona.avatar}
            chain={getChainForPersona(selectedPersona.pubkey)}
          />
        </div>

        <div>
          <MatchPanel
            personas={PERSONAS}
            currentUserKey={currentUserKey}
            onDateComplete={handleDateComplete}
          />
        </div>

        {/* Right: Chain panel placeholder */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Chain</h2>
          <p className="text-zinc-500 text-sm">Chain panel coming next.</p>
        </div>
      </div>

      {pendingDate && (
        <AttestationModal
          dateObj={pendingDate}
          currentUserKey={currentUserKey}
          counterpartyName={counterpartyName}
          onSubmit={handleAttestation}
          onClose={() => setPendingDate(null)}
        />
      )}
    </main>
  );
}
