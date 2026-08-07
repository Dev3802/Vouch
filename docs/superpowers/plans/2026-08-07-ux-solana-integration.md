# UX + Solana Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the frontend-design branch UX into main and wire Solana devnet memo transactions into the attestation flow.

**Architecture:** Start from the frontend-design branch (React 19 / Next 15 / Tailwind v4). Add Solana wallet adapter as an optional enhancement layer -- the app works without a wallet (local signing), but when a wallet is connected, attestations also post a memo tx to Solana devnet. Add FAQPanel and Explorer links.

**Tech Stack:** Next.js 15, React 19, Tailwind v4, @solana/web3.js, @solana/wallet-adapter-react, @noble/secp256k1, @noble/hashes

## Global Constraints

- QuickNode RPC: `https://blissful-radial-county.solana-devnet.quiknode.pro/6e0fc64d24644a330fd09365a4424d9503a38dff/`
- All Solana transactions on devnet only
- UX design tokens, typography (Fraunces + Inter), and color palette from frontend-design branch are authoritative -- do not change them
- No emojis anywhere per UX spec
- Score clamped 0-100, derived on read, never stored
- Negative attestations require both keys (positives one-sided)
- Working directory: /home/claude/Vouch, branch: main

---

### Task 1: Merge frontend-design branch into main

**Files:**
- All files from origin/frontend-design replace current src/ structure
- Keep: docs/ directory (PRD, risk register, pitch, specs, plans)

**Interfaces:**
- Consumes: origin/frontend-design branch
- Produces: Working UX app on main branch with all components, photos, and seed data

- [ ] **Step 1: Merge frontend-design into main**

```bash
cd /home/claude/Vouch
git merge origin/frontend-design --no-ff -m "Merge frontend-design: UX redesign with editorial styling"
```

If there are conflicts (likely in package.json, .gitignore, README), resolve by taking frontend-design for app code and keeping our docs/ directory.

- [ ] **Step 2: Restore docs/ if deleted by merge**

The frontend-design branch deletes docs/. Restore them:

```bash
git checkout HEAD~1 -- docs/
git add docs/
```

- [ ] **Step 3: Install dependencies and verify build**

```bash
npm install
npm run build
```

Fix any build errors. The UX branch uses Next 15 / React 19 / Tailwind v4 -- these may need config adjustments.

- [ ] **Step 4: Commit merge resolution and verify dev server**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
git add -A && git commit -m "resolve merge: restore docs, fix build"
```

---

### Task 2: Add Solana wallet adapter + memo tx library

**Files:**
- Create: `lib/solana.ts`
- Create: `providers/WalletProvider.tsx`
- Modify: `app/layout.tsx` (wrap with WalletProvider)

**Interfaces:**
- Consumes: `@solana/web3.js`, `@solana/wallet-adapter-react`, `BlockPayload` from `lib/types.ts`
- Produces: `sendMemoTx(connection, publicKey, signTransaction, payload): Promise<string>`, `getExplorerUrl(sig): string`, `getConnection(): Connection`, `WalletProvider` context wrapper

- [ ] **Step 1: Install Solana packages**

```bash
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

- [ ] **Step 2: Create `lib/solana.ts`**

```typescript
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import type { BlockPayload } from './types';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export const QUICKNODE_RPC = 'https://blissful-radial-county.solana-devnet.quiknode.pro/6e0fc64d24644a330fd09365a4424d9503a38dff/';

export function getConnection(): Connection {
  return new Connection(QUICKNODE_RPC, 'confirmed');
}

export function hashPayload(payload: BlockPayload): string {
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify(payload))));
}

export async function sendMemoTx(
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  payload: BlockPayload
): Promise<string> {
  const hash = hashPayload(payload);
  const memoText = `vouch:${hash}`;
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, 'utf-8'),
  });
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await signTransaction(transaction);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

export function getExplorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}
```

- [ ] **Step 3: Create `providers/WalletProvider.tsx`**

```tsx
'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';
import { QUICKNODE_RPC } from '@/lib/solana';

export default function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={QUICKNODE_RPC}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
```

- [ ] **Step 4: Update `app/layout.tsx` to wrap with WalletProvider**

Add the import and wrap children:

```tsx
import WalletProvider from '@/providers/WalletProvider';

// In the body, wrap {children}:
<WalletProvider>
  {children}
</WalletProvider>
```

- [ ] **Step 5: Update `next.config.ts` with webpack fallbacks for Solana**

```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, crypto: false, stream: false, buffer: false };
    return config;
  },
};
export default nextConfig;
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add Solana wallet adapter + memo tx library with QuickNode RPC"
```

---

### Task 3: Wire Solana into attestation flow + add Explorer links to ChainLedger

**Files:**
- Modify: `app/page.tsx` (pass wallet context into attestation, store tx sigs)
- Modify: `components/AttestationModal.tsx` (attempt memo tx on sign)
- Modify: `components/ChainLedger.tsx` (show Explorer link per block)
- Modify: `lib/types.ts` (add optional solanaTxSig to Block)

**Interfaces:**
- Consumes: `sendMemoTx`, `getConnection`, `getExplorerUrl` from `lib/solana.ts`, wallet context from `@solana/wallet-adapter-react`
- Produces: Attestations that optionally include Solana tx signatures, ChainLedger blocks that link to Explorer

- [ ] **Step 1: Add `solanaTxSig` to Block type in `lib/types.ts`**

Add to the Block interface:

```typescript
  solanaTxSig?: string;
```

- [ ] **Step 2: Update `components/AttestationModal.tsx`**

Add Solana wallet hooks and attempt a memo tx when signing. The tx is best-effort -- if no wallet or it fails, the attestation still commits locally. Add the tx sig to the SignResult:

- Import `useWallet`, `useConnection` from wallet adapter
- In the `sign()` function, after the local signing delay, attempt `sendMemoTx` if wallet connected
- Add `solanaTxSig?: string` to `SignResult`
- Show a small "On Solana devnet" or "Local only" indicator in the result view

- [ ] **Step 3: Update `app/page.tsx`**

When handling the attestation result, store the `solanaTxSig` on the appended block.

- [ ] **Step 4: Update `components/ChainLedger.tsx`**

For blocks with `solanaTxSig`, show a small "solana" link that opens the Explorer URL in a new tab. Style it with the signal color to match the UX palette.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: wire Solana memo tx into attestation flow + Explorer links in chain ledger"
```

---

### Task 4: Add wallet connect to TopBar + FAQPanel + demo reset

**Files:**
- Modify: `components/TopBar.tsx` (add wallet connect button styled to match UX)
- Create: `components/FAQPanel.tsx` (12 judge-facing Q&As, styled to UX palette)
- Modify: `app/page.tsx` (add FAQPanel below main layout, add demo reset)

**Interfaces:**
- Consumes: `@solana/wallet-adapter-react-ui` WalletMultiButton, FAQ content from risk register
- Produces: TopBar with optional wallet connect, FAQPanel component, reset demo functionality

- [ ] **Step 1: Add wallet connect to TopBar**

Add a small wallet connect button between "Start fresh" and the identity chip. Use the wallet adapter's `WalletMultiButton` but override styles to match the UX: pill-shaped, border-edge, bg-panel, text-mute. When connected, show a small "solana devnet" badge.

- [ ] **Step 2: Create `components/FAQPanel.tsx`**

Accordion-style FAQ with 12 questions from the risk register. Styled with the UX palette: panel background, edge borders, Fraunces italic for the heading, Inter for body text. Use signal color for the expand/collapse indicator.

```tsx
'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  { q: 'Why not just a database?', a: 'Because we would own it and could be pressured to delete it, and no other app could trust it. Portability is the feature.' },
  { q: 'What stops fake attestations between friends?', a: "Nothing in v1 \u2014 we say so plainly. The real version weights each vouch by the counterparty's own reputation. A ring of new accounts endorsing each other produces almost nothing." },
  { q: "Isn't a permanent dating record dangerous?", a: 'Vouches are pseudonymous to a keypair. Attestations are behavioral, not narrative. No free-text field to weaponize. The vocabulary is four options: showed up, endorsed, no-show, ghosted.' },
  { q: 'Privacy?', a: "Zero-knowledge proofs let you prove a score above a threshold without revealing the underlying history. Out of scope today \u2014 correct answer for v2." },
  { q: "Can't bad actors just make a new keypair?", a: "Keys are issued one per sybil-resistant anchor (salted phone hash in v1, device attestation and proof-of-personhood as upgrade paths). Stubbed in demo, shipping in v2. Without this, the entire pitch is decorative \u2014 which is exactly why it moved into v1." },
  { q: 'One person can publish permanent negative records?', a: "Fixed: negative attestations (no-show, ghosted) require both keys or they never commit. Positives stay one-sided. A false compliment is a much smaller problem than a false accusation." },
  { q: 'Right to erasure vs permanent records?', a: "Attestation payloads sit off-chain and encrypted; only salted hashes are logged on-chain. Destroying a person's key renders their history permanently unreadable while the log stays verifiable. The integrity property survives, the plaintext does not." },
  { q: 'Scores mislead on thin evidence?', a: 'v2 shows a confidence band rather than a point estimate, applies time decay, displays sample size, and withholds a score entirely below a threshold.' },
  { q: "Signing is optional \u2014 won't scores inflate?", a: 'Prompt both parties at the same moment while the date is fresh. Treat unsigned completed dates as visible gaps rather than neutral. Never let an absence read as a positive.' },
  { q: 'Is this really a blockchain?', a: "The tamper demo is real hash-chain integrity. What Solana adds is neutrality of hosting \u2014 no single operator, including us, can be leaned on to quietly drop a record. That is a governance property, and it is worth something. We say that plainly rather than letting the word do work it has not earned." },
  { q: 'Who pays?', a: 'Both sides. Platforms license the verification API per check. Consumers keep the wallet and profile free, because the record only has value if people carry it between apps.' },
  { q: 'What would make you stop?', a: "If a sybil anchor cannot be made both effective and privacy-preserving, the reset problem stands and this should not ship. If early pilots show negative attestations used mostly as retaliation, the harm outweighs the signal. Those are the two tests." },
];

export default function FAQPanel() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-edge bg-panel p-6 shadow-sm">
      <h2 className="font-display text-xl font-semibold italic">
        Hard questions, honest answers<span className="text-signal">.</span>
      </h2>
      <p className="mt-1 text-sm text-mute">
        We ran the concept through adversarial review before building it.
      </p>
      <div className="mt-4 space-y-1">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="rounded-xl border border-edge overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-panel2/50 transition-colors"
            >
              <span className="text-sm font-medium pr-4">{item.q}</span>
              <span className="text-signal text-lg shrink-0">{openIndex === i ? '\u2212' : '+'}</span>
            </button>
            {openIndex === i && (
              <div className="px-3 pb-3 vouch-pop">
                <p className="text-sm text-mute leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add FAQPanel to page.tsx**

Import and render below the main three-panel grid, before the AttestationModal.

- [ ] **Step 4: Add demo reset button**

The TopBar already has "Start fresh" which resets identity. Add a separate "Reset demo" function that restores all chain and persona data to seed state without clearing identity. Wire it into TopBar or page-level controls.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: wallet connect in TopBar, FAQ panel, demo reset button"
```

---

### Task 5: Polish, deploy, verify

**Files:**
- Modify: `app/page.tsx` (solana devnet badge)
- Any final build fixes

**Interfaces:**
- Consumes: all prior tasks
- Produces: deployed app at vouch-hackathon.vercel.app

- [ ] **Step 1: Add solana devnet indicator**

In TopBar or page header, add a small badge matching the UX palette:

```tsx
<span className="rounded-full border border-signal/25 bg-signal/10 px-2 py-0.5 text-[10px] font-mono text-signal">
  solana devnet
</span>
```

- [ ] **Step 2: Full build verification**

```bash
npm run build
npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -i "vouch"
kill %1
```

- [ ] **Step 3: Commit and push**

```bash
git add -A && git commit -m "feat: polish, solana devnet badge, final build"
git push origin main
```

- [ ] **Step 4: Deploy to Vercel**

```bash
VERCEL_TOKEN=<from vault> npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

Verify https://vouch-hackathon.vercel.app loads with the new UX.
