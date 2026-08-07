"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Why not just a database?",
    a: "Because we would own it and could be pressured to delete it, and no other app could trust it. Portability is the feature.",
  },
  {
    q: "What stops fake attestations between friends?",
    a: "Nothing in v1 \u2014 we say so plainly. The real version weights each vouch by the counterparty\u2019s own reputation. A ring of new accounts endorsing each other produces almost nothing.",
  },
  {
    q: "Isn\u2019t a permanent dating record dangerous?",
    a: "Vouches are pseudonymous to a keypair. Attestations are behavioral, not narrative. No free-text field to weaponize. The vocabulary is four options: showed up, endorsed, no-show, ghosted.",
  },
  {
    q: "Privacy?",
    a: "Zero-knowledge proofs let you prove a score above a threshold without revealing the underlying history. Out of scope today \u2014 correct answer for v2.",
  },
  {
    q: "Can\u2019t bad actors just make a new keypair?",
    a: "Keys are issued one per sybil-resistant anchor (salted phone hash in v1, device attestation and proof-of-personhood as upgrade paths). Stubbed in demo, shipping in v2. Without this, the entire pitch is decorative \u2014 which is exactly why it moved into v1.",
  },
  {
    q: "One person can publish permanent negative records?",
    a: "Fixed: negative attestations (no-show, ghosted) require both keys or they never commit. Positives stay one-sided. A false compliment is a much smaller problem than a false accusation.",
  },
  {
    q: "Right to erasure vs permanent records?",
    a: "Attestation payloads sit off-chain and encrypted; only salted hashes are logged on-chain. Destroying a person\u2019s key renders their history permanently unreadable while the log stays verifiable. The integrity property survives, the plaintext does not.",
  },
  {
    q: "Scores mislead on thin evidence?",
    a: "v2 shows a confidence band rather than a point estimate, applies time decay, displays sample size, and withholds a score entirely below a threshold.",
  },
  {
    q: "Signing is optional \u2014 won\u2019t scores inflate?",
    a: "Prompt both parties at the same moment while the date is fresh. Treat unsigned completed dates as visible gaps rather than neutral. Never let an absence read as a positive.",
  },
  {
    q: "Is this really a blockchain?",
    a: "The tamper demo is real hash-chain integrity. What Solana adds is neutrality of hosting \u2014 no single operator, including us, can be leaned on to quietly drop a record. That is a governance property, and it is worth something. We say that plainly rather than letting the word do work it has not earned.",
  },
  {
    q: "Who pays?",
    a: "Both sides. Platforms license the verification API per check. Consumers keep the wallet and profile free, because the record only has value if people carry it between apps.",
  },
  {
    q: "What would make you stop?",
    a: "If a sybil anchor cannot be made both effective and privacy-preserving, the reset problem stands and this should not ship. If early pilots show negative attestations used mostly as retaliation, the harm outweighs the signal. Those are the two tests.",
  },
];

export default function FAQPanel() {
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-edge bg-panel p-4 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <h2 className="font-display text-xl font-semibold italic">
            Hard questions, honest answers
            <span className="text-signal">.</span>
          </h2>
          <p className="mt-1 text-sm text-mute">
            Adversarial review notes for judges. Does not block the demo above.
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full border border-edge px-3 py-1 text-xs text-mute">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-1">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-edge"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-panel2/50"
              >
                <span className="pr-4 text-sm font-medium">{item.q}</span>
                <span className="shrink-0 text-lg text-signal">
                  {openIndex === i ? "\u2212" : "+"}
                </span>
              </button>
              {openIndex === i && (
                <div className="vouch-pop px-3 pb-3">
                  <p className="text-sm leading-relaxed text-mute">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
