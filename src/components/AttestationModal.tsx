'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AttestationType, Attestation, DateObj } from '@/lib/types';
import { sendMemoTx } from '@/lib/solana';

interface AttestationModalProps {
  dateObj: DateObj;
  currentUserKey: string;
  counterpartyName: string;
  onSubmit: (attestation: Attestation, solanaTxSig: string | null) => void;
  onClose: () => void;
}

const ATTESTATION_OPTIONS: { type: AttestationType; label: string; emoji: string; delta: string }[] = [
  { type: 'endorsed', label: 'Endorse', emoji: '\u2b50', delta: '+10' },
  { type: 'showed_up', label: 'Showed up', emoji: '\u2713', delta: '+5' },
  { type: 'ghosted', label: 'Ghosted', emoji: '\ud83d\udc7b', delta: '-10' },
  { type: 'no_show', label: 'No-show', emoji: '\u2717', delta: '-20' },
];

export function AttestationModal({ dateObj, currentUserKey, counterpartyName, onSubmit, onClose }: AttestationModalProps) {
  const [selected, setSelected] = useState<AttestationType | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  async function handleSubmit() {
    if (!selected) return;
    setSending(true);
    setError(null);

    const counterparty = dateObj.parties[0] === currentUserKey ? dateObj.parties[1] : dateObj.parties[0];

    const attestation: Attestation = {
      type: selected,
      from: currentUserKey,
      to: counterparty,
      dateId: dateObj.id,
      timestamp: Date.now(),
    };

    let txSig: string | null = null;

    // Try to send on-chain if wallet connected
    if (publicKey && signTransaction) {
      try {
        txSig = await sendMemoTx(connection, publicKey, signTransaction, attestation);
      } catch (err) {
        console.warn('Solana tx failed, storing locally only:', err);
        setError('On-chain tx failed -- stored locally. Connect wallet & fund with devnet SOL to go on-chain.');
      }
    }

    onSubmit(attestation, txSig);
    setSending(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-700 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-1">Sign Attestation</h2>
        <p className="text-sm text-zinc-400 mb-4">How was your date with {counterpartyName}?</p>

        <div className="grid grid-cols-2 gap-2 mb-2">
          {ATTESTATION_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => setSelected(opt.type)}
              className={`p-3 rounded-xl border text-left transition ${
                selected === opt.type
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-xl">{opt.emoji}</span>
              <p className="text-sm font-medium mt-1">{opt.label}</p>
              <p className="text-xs text-zinc-500">{opt.delta} reputation</p>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-zinc-600 mb-3">Four options. No free text. Nothing to weaponize.</p>

        {error && <p className="text-xs text-amber-400 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 rounded-lg text-sm font-medium transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || sending}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition"
          >
            {sending ? 'Signing...' : 'Sign & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
