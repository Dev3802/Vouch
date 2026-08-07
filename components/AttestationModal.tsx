"use client";

import { useState } from "react";
import { shortKey } from "@/lib/keys";
import { ATTESTATION_LABELS, DELTAS } from "@/lib/score";
import type { AttestationType, Persona } from "@/lib/types";

const OPTIONS: { type: AttestationType; desc: string }[] = [
  { type: "showed_up", desc: "They were there, as agreed." },
  { type: "endorsed", desc: "Genuinely great. Vouch for them." },
  { type: "no_show", desc: "They never turned up." },
  { type: "ghosted", desc: "Vanished after the date." },
];

export interface SignResult {
  signature: string;
  counterSignature?: string;
  blockIndex: number;
}

const isNegative = (t: AttestationType) => t === "no_show" || t === "ghosted";

export default function AttestationModal({
  persona,
  onClose,
  onSign,
}: {
  persona: Persona;
  onClose: () => void;
  onSign: (att: AttestationType) => SignResult;
}) {
  const [choice, setChoice] = useState<AttestationType | null>(null);
  const [result, setResult] = useState<SignResult | null>(null);
  const [signing, setSigning] = useState(false);

  const negative = choice !== null && isNegative(choice);

  const sign = () => {
    if (!choice) return;
    setSigning(true);
    // small delay so the signing moment reads on stage
    setTimeout(() => {
      setResult(onSign(choice));
      setSigning(false);
    }, negative ? 1100 : 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="vouch-pop w-full max-w-md rounded-2xl border border-edge bg-panel p-5 shadow-xl">
        {!result ? (
          <>
            <h3 className="font-display text-xl font-semibold italic">
              How did it go with {persona.name}?
            </h3>
            <p className="mt-1 text-sm text-mute">
              Both of you are being asked right now, while it&apos;s fresh.
              Your attestation is signed with your key and appended to the
              chain. Skipping leaves a visible gap {"\u2014"} never a positive.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {OPTIONS.map((o) => {
                const delta = DELTAS[o.type];
                const selected = choice === o.type;
                return (
                  <button
                    key={o.type}
                    onClick={() => setChoice(o.type)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? "border-signal/50 bg-signal/10"
                        : "border-edge bg-panel2/60 hover:border-mute/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {ATTESTATION_LABELS[o.type]}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          delta >= 0 ? "text-signal" : "text-danger"
                        }`}
                      >
                        {delta >= 0 ? `+${delta}` : delta}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-mute">{o.desc}</p>
                  </button>
                );
              })}
            </div>

            {negative && (
              <div className="vouch-pop mt-3 rounded-xl border border-warn/25 bg-warn/5 p-3">
                <p className="text-xs font-medium text-warn">
                  Negative attestations require both keys.
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-mute">
                  {persona.name}&apos;s key will be asked to co-sign. If they
                  never sign, this never commits {"\u2014"} nobody can write a
                  permanent accusation alone. Positives stay one-sided; a false
                  compliment is a smaller problem than a false accusation.
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-full border border-edge bg-panel px-4 py-2 text-sm text-mute shadow-sm hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={sign}
                disabled={!choice || signing}
                className="blue-gradient rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {signing
                  ? negative
                    ? "Signing \u00b7 awaiting co-sign\u2026"
                    : "Signing\u2026"
                  : negative
                    ? "Sign & request co-sign"
                    : "Sign with your key"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-display text-xl font-semibold italic text-signal">
              Vouch committed
            </h3>
            <p className="mt-1 text-sm text-mute">
              Appended as block #{result.blockIndex}. Signed, hashed, and
              chained. There is no undo.
            </p>
            <div className="mt-3 rounded-xl border border-edge bg-panel2/60 p-3 font-mono text-[11px] text-mute">
              <p className="text-[10px] uppercase tracking-wider">
                your signature
              </p>
              <p className="mt-1 break-all text-ink/80">
                {shortKey(result.signature, 32)}
              </p>
              {result.counterSignature && (
                <>
                  <p className="mt-2 text-[10px] uppercase tracking-wider">
                    co-signed by {persona.name}{" "}
                    <span className="normal-case">(stubbed in demo)</span>
                  </p>
                  <p className="mt-1 break-all text-warn/80">
                    {shortKey(result.counterSignature, 32)}
                  </p>
                </>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="blue-gradient rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
