"use client";

import { shortKey } from "@/lib/keys";
import { ATTESTATION_LABELS, DELTAS } from "@/lib/score";
import type { AttestationType, Block, VouchPayload } from "@/lib/types";

const BADGE_STYLES: Record<AttestationType, string> = {
  endorsed: "bg-signal/10 text-signal border-signal/25",
  showed_up: "bg-teal-700/10 text-teal-800 border-teal-700/20",
  no_show: "bg-danger/10 text-danger border-danger/25",
  ghosted: "bg-warn/10 text-warn border-warn/25",
};

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  if (days < 60) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 24) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function VouchRow({
  block,
  counterpartyName,
  onClickBlock,
}: {
  block: Block;
  counterpartyName: string | null;
  /** Optional: scroll the ChainLedger to this block index */
  onClickBlock?: (index: number) => void;
}) {
  const p = block.payload as VouchPayload;
  const delta = DELTAS[p.attestation];
  const weighted = p.bothSigned ? Math.round(delta * 1.5) : delta;
  const negative = p.attestation === "no_show" || p.attestation === "ghosted";
  const signedLabel = negative
    ? "co-signed by both keys" // negatives never commit one-sided
    : p.bothSigned
      ? "both signed \u00d71.5"
      : "one side signed";

  const tooltip = `Block #${block.index} \u00b7 ${block.hash.slice(0, 16)}\u2026\nClick to locate in chain`;

  return (
    <div
      role={onClickBlock ? "button" : undefined}
      tabIndex={onClickBlock ? 0 : undefined}
      title={tooltip}
      onClick={() => onClickBlock?.(block.index)}
      onKeyDown={(e) => {
        if (onClickBlock && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClickBlock(block.index);
        }
      }}
      className={`vouch-pop flex items-center gap-3 rounded-xl border border-edge bg-panel px-3 py-2.5 shadow-sm transition-colors ${
        onClickBlock
          ? "cursor-pointer hover:border-signal/30 hover:bg-panel2/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
          : ""
      }`}
    >
      <span
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${BADGE_STYLES[p.attestation]}`}
      >
        {ATTESTATION_LABELS[p.attestation]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">
          {counterpartyName ?? "Unknown key"}
          <span className="ml-2 font-mono text-[11px] text-mute">
            {shortKey(p.from)}
          </span>
        </p>
        <p className="text-[11px] text-mute">
          {timeAgo(block.timestamp)} &middot; block #{block.index} &middot;{" "}
          {signedLabel}
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-sm font-semibold ${
          weighted >= 0 ? "text-signal" : "text-danger"
        }`}
      >
        {weighted >= 0 ? `+${weighted}` : weighted}
      </span>
    </div>
  );
}
