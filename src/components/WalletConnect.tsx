'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletConnect() {
  const { publicKey } = useWallet();

  return (
    <div className="flex items-center gap-3">
      <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-10" />
      {publicKey && (
        <span className="text-xs text-zinc-400 font-mono">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>
      )}
    </div>
  );
}
