"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { verifyChain } from "@/lib/chain";
import { shortKey } from "@/lib/keys";
import { ATTESTATION_LABELS } from "@/lib/score";
import { getExplorerUrl } from "@/lib/solana";
import type { AttestationType, Block } from "@/lib/types";

const ATT_TYPES: AttestationType[] = [
  "showed_up",
  "endorsed",
  "no_show",
  "ghosted",
];

export default function ChainLedger({
  chain,
  nameForKey,
  onTamper,
  onReset,
  highlightIndex,
}: {
  chain: Block[];
  nameForKey: (pub: string) => string | null;
  onTamper: (index: number, attestation: AttestationType) => void;
  onReset: () => void;
  /** Block index to scroll into view and briefly highlight */
  highlightIndex?: number | null;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const status = useMemo(() => verifyChain(chain), [chain]);
  const reversed = useMemo(() => [...chain].reverse(), [chain]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to the highlighted block whenever highlightIndex changes
  useEffect(() => {
    if (highlightIndex == null || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(
      `[data-block-index="${highlightIndex}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightIndex]);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-sm">
      <header className="flex items-center justify-between border-b border-edge px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-mute">
          Chain &middot; {chain.length} blocks
        </h2>
        {status.broken ? (
          <div className="flex items-center gap-2">
            <span className="vouch-pulse rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 text-[11px] font-semibold text-danger">
              BROKEN at #{status.firstBadIndex}
            </span>
            <button
              onClick={() => {
                setEditing(null);
                onReset();
              }}
              className="rounded-full border border-edge bg-panel2 px-2.5 py-0.5 text-[11px] text-mute hover:text-ink"
            >
              Reset
            </button>
          </div>
        ) : (
          <span className="rounded-full border border-signal/25 bg-signal/10 px-2.5 py-0.5 text-[11px] font-semibold text-signal">
            VALID
          </span>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0">
          {reversed.map((b, pos) => {
            const bad = status.badFlags[b.index];
            const cascade =
              status.firstBadIndex !== null && bad
                ? (b.index - status.firstBadIndex) * 40
                : 0;
            return (
              <div key={b.index} data-block-index={b.index}>
                <BlockCard
                  block={b}
                  bad={bad}
                  delayMs={cascade}
                  nameForKey={nameForKey}
                  editing={editing === b.index}
                  highlighted={highlightIndex === b.index}
                  onEdit={() =>
                    setEditing(editing === b.index ? null : b.index)
                  }
                  onTamper={(att) => {
                    setEditing(null);
                    onTamper(b.index, att);
                  }}
                />
                {pos < reversed.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <div
                      className="h-4 w-px transition-colors duration-300"
                      style={{
                        background: bad ? "#b8432e" : "#3a5bc766",
                        transitionDelay: `${cascade}ms`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BlockCard({
  block,
  bad,
  delayMs,
  nameForKey,
  editing,
  highlighted,
  onEdit,
  onTamper,
}: {
  block: Block;
  bad: boolean;
  delayMs: number;
  nameForKey: (pub: string) => string | null;
  editing: boolean;
  highlighted: boolean;
  onEdit: () => void;
  onTamper: (att: AttestationType) => void;
}) {
  const p = block.payload;
  const summary =
    p.kind === "genesis"
      ? p.note
      : p.kind === "identity"
        ? `Identity registered \u00b7 ${nameForKey(p.pub) ?? shortKey(p.pub)} \u00b7 anchor ${shortKey(p.anchor)}`
        : `${nameForKey(p.from) ?? shortKey(p.from)} \u2192 ${
            ATTESTATION_LABELS[p.attestation]
          } \u2192 ${nameForKey(p.to) ?? shortKey(p.to)}`;

  return (
    <div
      className={`rounded-xl border px-3 py-2 transition-colors duration-300 ${
        bad
          ? "border-danger/50 bg-danger/10"
          : highlighted
            ? "border-signal/50 bg-signal/8 ring-1 ring-signal/30"
            : "border-edge bg-panel2/60"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-mute">
          #{block.index}
        </span>
        <span className="flex-1 truncate text-xs text-ink">{summary}</span>
        {p.kind === "vouch" && (
          <button
            onClick={onEdit}
            title="Tamper with this block"
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
              bad
                ? "border-danger/40 text-danger"
                : "border-edge text-mute hover:border-warn/40 hover:text-warn"
            }`}
          >
            tamper
          </button>
        )}
      </div>

      {editing && p.kind === "vouch" && (
        <div className="vouch-pop mt-2 rounded-lg border border-warn/25 bg-warn/5 p-2">
          <p className="mb-1.5 text-[10px] text-warn">
            Rewrite history. Change what this block says:
          </p>
          <div className="flex flex-wrap gap-1">
            {ATT_TYPES.filter((t) => t !== p.attestation).map((t) => (
              <button
                key={t}
                onClick={() => onTamper(t)}
                className="rounded-full border border-edge bg-panel px-2.5 py-1 text-[11px] text-ink hover:border-warn/40 hover:text-warn"
              >
                {ATTESTATION_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-1.5 space-y-0.5 font-mono text-[10px] leading-relaxed text-mute">
        {p.kind === "vouch" && (
          <p className="truncate">
            sig <span className="text-ink/60">{shortKey(block.signature, 12)}</span>
          </p>
        )}
        {p.kind === "identity" && (
          <>
            <p className="truncate">
              pub <span className="text-ink/60">{shortKey(p.pub, 12)}</span>
            </p>
            <p className="truncate">
              anchor <span className="text-signal/80">{shortKey(p.anchor, 12)}</span>
            </p>
            <p className="truncate">
              sig <span className="text-ink/60">{shortKey(block.signature, 12)}</span>
            </p>
          </>
        )}
        <p className="truncate">
          prev{" "}
          <span className={bad ? "text-danger/80" : "text-ink/40"}>
            {shortKey(block.prevHash, 12)}
          </span>
        </p>
        <p className="truncate">
          hash{" "}
          <span className={bad ? "text-danger" : "text-signal/80"}>
            {shortKey(block.hash, 12)}
          </span>
        </p>
        {block.solanaTxSig && (
          <a
            href={getExplorerUrl(block.solanaTxSig)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block font-sans text-[10px] font-medium text-signal hover:underline"
          >
            on solana
          </a>
        )}
      </div>
    </div>
  );
}
