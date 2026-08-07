'use client';

import { useState } from 'react';
import { Block } from '@/lib/types';
import { verifyChain, tamperBlock } from '@/lib/chain';
import { getExplorerUrl } from '@/lib/solana';

interface ChainPanelProps {
  chain: Block[];
  personaName: string;
}

export function ChainPanel({ chain, personaName }: ChainPanelProps) {
  const [displayChain, setDisplayChain] = useState(chain);
  const [isTampered, setIsTampered] = useState(false);

  const verification = verifyChain(displayChain);

  function handleTamper() {
    if (isTampered || chain.length < 3) return;
    // Tamper with block at index 1 -- change an endorsement to a no_show
    const targetIndex = Math.min(1, chain.length - 1);
    const tampered = tamperBlock(chain, targetIndex, {
      ...chain[targetIndex].payload,
      type: 'no_show',
    });
    setDisplayChain(tampered);
    setIsTampered(true);
  }

  function handleReset() {
    setDisplayChain(chain);
    setIsTampered(false);
  }

  // Update display chain when persona changes
  if (!isTampered && displayChain !== chain) {
    setDisplayChain(chain);
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chain Ledger</h2>
        <div className={`px-2 py-0.5 rounded text-xs font-medium ${
          verification.valid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {verification.valid ? 'VALID' : `BROKEN at block ${verification.brokenAt}`}
        </div>
      </div>

      <p className="text-xs text-zinc-500 mb-3">{personaName}&apos;s attestation chain -- {displayChain.length} blocks</p>

      {/* Tamper controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleTamper}
          disabled={isTampered || chain.length < 3}
          className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition"
        >
          Tamper with block
        </button>
        {isTampered && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-zinc-700 text-zinc-300 hover:bg-zinc-600 rounded-lg text-xs font-medium transition"
          >
            Reset chain
          </button>
        )}
      </div>

      {/* Block list */}
      <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
        {displayChain.map((block, i) => {
          const isGenesis = block.index === 0;
          const isBroken = !verification.valid && verification.brokenAt !== null && i >= verification.brokenAt;
          const wasTampered = isTampered && i === Math.min(1, chain.length - 1);

          return (
            <div
              key={block.index}
              className={`p-2 rounded border ${
                wasTampered
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : isBroken
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-zinc-800 bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">#{block.index.toString().padStart(4, '0')}</span>
                {isGenesis ? (
                  <span className="text-zinc-600">genesis</span>
                ) : (
                  <span className={
                    block.payload.type === 'endorsed' ? 'text-emerald-400' :
                    block.payload.type === 'showed_up' ? 'text-blue-400' :
                    block.payload.type === 'no_show' ? 'text-red-400' :
                    'text-orange-400'
                  }>
                    {block.payload.type.replace('_', ' ')}
                  </span>
                )}
                {isBroken && <span className="text-red-400 font-bold">INVALID</span>}
                {!isBroken && !isGenesis && <span className="text-emerald-400">OK</span>}
              </div>
              <div className="mt-1 text-zinc-600 truncate">
                hash: {block.hash.slice(0, 16)}...
              </div>
              <div className="text-zinc-700 truncate">
                prev: {block.prevHash.slice(0, 16)}...
              </div>
              {block.solanaTxSig && (
                <a
                  href={getExplorerUrl(block.solanaTxSig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  View on Solana Explorer
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
