'use client';

import { useState } from 'react';
import { Block } from '@/lib/types';
import { deriveScore, getVouchCount, getVouchesFor } from '@/lib/scoring';
import { getExplorerUrl } from '@/lib/solana';
import { ScoreDisplay } from './ScoreDisplay';

interface ProfilePanelProps {
  name: string;
  pubkey: string;
  bio: string;
  avatar: string;
  chain: Block[];
}

export function ProfilePanel({ name, pubkey, bio, avatar, chain }: ProfilePanelProps) {
  const score = deriveScore(chain, pubkey);
  const vouchCount = getVouchCount(chain, pubkey);
  const vouches = getVouchesFor(chain, pubkey);
  const [showNames, setShowNames] = useState(true);

  const typeColors: Record<string, string> = {
    endorsed: 'text-emerald-400',
    showed_up: 'text-blue-400',
    no_show: 'text-red-400',
    ghosted: 'text-orange-400',
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold">
          {avatar}
        </div>
        <div>
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-xs text-zinc-500 font-mono">{pubkey.slice(0, 4)}...{pubkey.slice(-4)}</p>
        </div>
      </div>

      <p className="text-sm text-zinc-400 mb-4">{bio}</p>

      <ScoreDisplay score={score} vouchCount={vouchCount} label="Reputation Score" />

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-300">Signed History</h3>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-500">pseudonymous -- keys only, no names</span>
          </div>
          <button
            onClick={() => setShowNames(!showNames)}
            className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showNames ? 'Production view' : 'Demo labels'}
          </button>
        </div>
        {vouches.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No vouches. This account is new or was recently reset.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {vouches.slice().reverse().map((block) => (
              <div key={block.index} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800">
                <span className={typeColors[block.payload.type] || 'text-zinc-400'}>
                  {block.payload.type.replace('_', ' ')}
                </span>
                <span className="text-zinc-500 font-mono">
                  from {block.payload.from.slice(0, 4)}...
                </span>
                {block.solanaTxSig ? (
                  <a href={getExplorerUrl(block.solanaTxSig)} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                    tx
                  </a>
                ) : (
                  <span className="text-zinc-600">local</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
