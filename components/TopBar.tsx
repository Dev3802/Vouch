"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { shortKey } from "@/lib/keys";
import { deriveScore, scoreTone, vouchesFor } from "@/lib/score";
import { initials } from "@/lib/ui";
import type { Block, Identity } from "@/lib/types";

const TONE_TEXT: Record<string, string> = {
  good: "text-signal",
  neutral: "text-warn",
  bad: "text-danger",
  unknown: "text-mute",
};

export default function TopBar({
  identity,
  chain,
  onShowMe,
  onResetIdentity,
  onResetDemo,
}: {
  identity: Identity;
  chain: Block[];
  onShowMe: () => void;
  onResetIdentity: () => void;
  onResetDemo: () => void;
}) {
  const { connected } = useWallet();
  const vouchCount = vouchesFor(chain, identity.pub).length;
  const score = deriveScore(chain, identity.pub);
  const tone = scoreTone(score, vouchCount);

  return (
    <header className="flex items-center justify-between px-6 py-3.5">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-semibold italic tracking-tight">
          Vouch<span className="text-signal">.</span>
        </h1>
        <p className="hidden text-xs text-mute sm:block">
          Dating reputation you can&apos;t reset.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onResetDemo}
          className="rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-mute shadow-sm transition-colors hover:border-signal/30 hover:text-signal"
          title="Restore all personas and chain data to seed state (keeps your identity)"
        >
          Reset demo
        </button>
        <button
          onClick={onResetIdentity}
          className="rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-mute shadow-sm transition-colors hover:border-danger/30 hover:text-danger"
          title="Delete this key and start over with a new profile"
        >
          Start fresh
        </button>

        {/* Wallet connect -- pill-shaped, styled to UX palette */}
        <div className="wallet-btn-wrapper">
          <WalletMultiButton />
        </div>

        {connected && (
          <span className="rounded-full border border-signal/25 bg-signal/10 px-2.5 py-0.5 font-mono text-[10px] text-signal">
            solana devnet
          </span>
        )}

        <button
          onClick={onShowMe}
          className="flex items-center gap-2.5 rounded-full border border-edge bg-panel py-1.5 pl-1.5 pr-4 shadow-sm transition-shadow hover:shadow"
          title="View your profile"
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${identity.gradient}`}
          >
            {initials(identity.name)}
          </span>
          <span className="text-left">
            <span className="block text-sm font-medium leading-tight">
              {identity.name}
            </span>
            <span className="block font-mono text-[10px] leading-tight text-mute">
              {shortKey(identity.pub)}
            </span>
          </span>
          <span className={`ml-1 font-mono text-sm font-bold ${TONE_TEXT[tone]}`}>
            {tone === "unknown" ? "\u2014" : score}
          </span>
        </button>
      </div>
    </header>
  );
}
