'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  { q: 'Why not just a database?', a: 'Because we would own it and could be pressured to delete it, and no other app could trust it. Portability is the feature.' },
  { q: 'What stops fake attestations between friends?', a: 'Nothing in v1 -- we say so plainly. The real version weights each vouch by the counterparty\'s own reputation. A ring of new accounts endorsing each other produces almost nothing.' },
  { q: 'Isn\'t a permanent dating record dangerous?', a: 'Vouches are pseudonymous to a keypair. Attestations are behavioral, not narrative. No free-text field to weaponize. The vocabulary is four options: showed up, endorsed, no-show, ghosted.' },
  { q: 'Privacy?', a: 'Zero-knowledge proofs let you prove a score above a threshold without revealing the underlying history. Out of scope today -- correct answer for v2.' },
  { q: 'Can\'t bad actors just make a new keypair?', a: 'Keys are issued one per sybil-resistant anchor (salted phone hash in v1, device attestation and proof-of-personhood as upgrade paths). Stubbed in demo, shipping in v2. Without this, the entire pitch is decorative -- which is exactly why it moved into v1.' },
  { q: 'One person can publish permanent negative records?', a: 'Fixed: negative attestations (no-show, ghosted) require both keys or they never commit. Positives stay one-sided. A false compliment is a much smaller problem than a false accusation.' },
  { q: 'Right to erasure vs permanent records?', a: 'Attestation payloads sit off-chain and encrypted; only salted hashes are logged on-chain. Destroying a person\'s key renders their history permanently unreadable while the log stays verifiable. The integrity property survives, the plaintext does not.' },
  { q: 'Scores mislead on thin evidence?', a: 'v2 shows a confidence band rather than a point estimate, applies time decay, displays sample size, and withholds a score entirely below a threshold.' },
  { q: 'Signing is optional -- won\'t scores inflate?', a: 'Prompt both parties at the same moment while the date is fresh. Treat unsigned completed dates as visible gaps rather than neutral. Never let an absence read as a positive.' },
  { q: 'Is this really a blockchain?', a: 'The tamper demo is real hash-chain integrity. What Solana adds is neutrality of hosting -- no single operator, including us, can be leaned on to quietly drop a record. That is a governance property, and it is worth something. We say that plainly rather than letting the word do work it has not earned.' },
  { q: 'Who pays?', a: 'Both sides. Platforms license the verification API per check. Consumers keep the wallet and profile free, because the record only has value if people carry it between apps.' },
  { q: 'What would make you stop?', a: 'If a sybil anchor cannot be made both effective and privacy-preserving, the reset problem stands and this should not ship. If early pilots show negative attestations used mostly as retaliation, the harm outweighs the signal. Those are the two tests.' },
];

export function FAQPanel() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mt-6">
      <h2 className="text-lg font-semibold mb-1">Hard Questions, Honest Answers</h2>
      <p className="text-sm text-zinc-500 mb-4">We ran the concept through adversarial review before building it.</p>

      <div className="space-y-1">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="border border-zinc-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-800/50 transition"
            >
              <span className="text-sm font-medium pr-4">{item.q}</span>
              <span className="text-zinc-500 text-lg flex-shrink-0">{openIndex === i ? '-' : '+'}</span>
            </button>
            {openIndex === i && (
              <div className="px-3 pb-3">
                <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
