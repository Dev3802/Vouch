# Vouch -- Solana Hybrid Build Design

**Date:** 2026-08-06
**Constraint:** 3-hour hackathon, clock running, solo build
**Stack:** Next.js 14 + Tailwind + Solana devnet (Memo Program)

---

## Architecture

### Two layers

1. **Solana devnet** -- attestation hashes logged via Memo Program transactions. Wallet-based identity. No custom program, no Rust.
2. **Client-side** -- Next.js SPA. Profiles, matching, chain view, score computation all in localStorage + seed data. Signing with Solana keypairs.

### Why Memo Program instead of custom Anchor

A custom Anchor program takes 45-60 minutes to write, test, and deploy. The Memo Program is already deployed on devnet, accepts arbitrary string data per transaction, and is verifiable on Solana Explorer. For a hackathon demo, the result is identical: real on-chain proof of attestations. Custom program is the documented "next step."

---

## Features mapped to implementation

### F1. Identity -- Solana Wallet

- Wallet adapter with Phantom/Solflare support
- On connect, wallet pubkey becomes the user identity
- Display name stored in localStorage keyed to pubkey
- No signup form -- connect wallet is the account
- For demo: pre-generate keypairs for seed personas, active user connects real wallet

### F2. Profile with vouches

- Profile panel shows: display name, pubkey (truncated), reputation score, vouch count, account age (block count from seed data)
- Vouch list: type (showed_up, endorsed, no_show, ghosted), counterparty pubkey, timestamp, Solana tx signature (link to Explorer)
- Empty state: "No vouches. This account is new or was recently reset."

### F3. Match and date

- Card stack of seed personas, swipe/tap to like/pass
- Mutual match creates a date object in localStorage: { id, parties: [pubkey1, pubkey2], status: proposed | confirmed | completed }
- Simple state machine buttons: Confirm, Complete
- No real matching algorithm -- predetermined matches for demo flow

### F4. Attestation -- Solana transactions

- After date completes, each party picks: showed_up (+5), endorsed (+10), no_show (-20), ghosted (-10)
- Attestation payload: { type, from: pubkey, to: pubkey, dateId, timestamp }
- Payload is JSON-stringified and SHA-256 hashed
- Hash is sent as a Memo Program transaction on Solana devnet
- Transaction signature stored locally alongside the attestation
- Negative attestations (no_show, ghosted) require both parties to sign per risk register fix

### F5. Chain view

- Ledger panel showing local hash chain: index, timestamp, payload summary, prevHash, hash
- Each entry links to its Solana Explorer tx (devnet)
- Tamper button: edit a past entry's payload, recompute hash, show cascade of broken hashes in red downstream
- This is the demo money shot -- works on the local chain, Solana tx links prove the originals were real

### F6. Score

- Derived on read by walking the chain: start at 50, apply deltas per attestation type
- Never stored -- recomputed each render
- Scoring: showed_up +5, endorsed +10, no_show -20, ghosted -10

---

## Tech stack (exact packages)

- next@14 -- app router
- tailwindcss@3 -- styling
- @solana/web3.js -- Solana RPC, transactions
- @solana/wallet-adapter-react -- wallet connection
- @solana/wallet-adapter-wallets -- Phantom, Solflare
- @solana/spl-memo -- Memo Program instruction builder
- @noble/hashes -- SHA-256 for local chain hashing

No backend. No database. No API routes needed.

---

## File structure

```
src/
  app/
    layout.tsx          -- wallet adapter provider wrapping
    page.tsx            -- single page, three-panel layout
    globals.css         -- tailwind + custom styles
  components/
    WalletConnect.tsx   -- connect/disconnect button
    ProfilePanel.tsx    -- identity, score, vouch list
    MatchPanel.tsx      -- card stack, date state machine
    ChainPanel.tsx      -- ledger view, tamper demo
    AttestationModal.tsx -- post-date signing flow
    ScoreDisplay.tsx    -- derived score with delta breakdown
    FAQPanel.tsx        -- judge-facing Q&A from risk register
  lib/
    chain.ts            -- hash chain: create, append, verify, tamper
    solana.ts           -- memo tx builder, devnet connection
    scoring.ts          -- derive score from chain
    seed.ts             -- 8 personas, pre-built histories
    types.ts            -- shared types
  providers/
    WalletProvider.tsx  -- Solana wallet adapter context
```

---

## Judge-facing FAQ panel (from risk register + PRD Q&A)

A dedicated section/panel on the site that surfaces answers to anticipated judge questions. Content pulled directly from the risk register and PRD:

1. **Why not just a database?** Because we would own it and could be pressured to delete it, and no other app could trust it. Portability is the feature.
2. **What stops fake attestations between friends?** Nothing in v1 -- we say so. Real version weights each vouch by the counterparty's own reputation. A ring of new accounts produces almost nothing.
3. **Isn't a permanent dating record dangerous?** Vouches are pseudonymous to a keypair. Attestations are behavioral, not narrative. No free-text field. The vocabulary is four options.
4. **Privacy?** Zero-knowledge proofs let you prove a score above a threshold without revealing history. Out of scope today, correct answer for v2.
5. **A new keypair is free -- can't bad actors just reset?** Keys are issued one per sybil-resistant anchor (salted phone hash in v1). Stubbed in demo, shipping in v2.
6. **One person can publish permanent negative records?** Fixed: negative attestations require both keys or they never commit. Positives stay one-sided.
7. **Right to erasure vs permanent records?** Attestation payloads sit off-chain and encrypted. Only salted hashes on-chain. Destroying a key renders history unreadable while the log stays verifiable.
8. **Scores mislead on thin evidence?** v2 shows confidence bands, time decay, sample size display, and withholds score below a threshold.
9. **Signing is optional so scores inflate?** Prompt both parties simultaneously. Treat unsigned completed dates as visible gaps, not neutral.
10. **Is this really a blockchain?** The tamper demo is real hash-chain integrity. What Solana adds is neutrality of hosting -- no single operator can drop a record. We say this plainly.
11. **Who pays?** Platforms license the verification API per check. Consumers keep the wallet and profile free.
12. **What would make you stop?** If sybil anchors can't be both effective and privacy-preserving. If negative attestations become retaliation tools. Those are the two tests.

---

## Seed data

8 personas with pre-generated Solana keypairs (devnet only):

1. **Marcus** -- 40 vouches over 200 blocks, mostly endorsements. Score ~150. The trustworthy one.
2. **Jordan** -- 12 vouches, starts good then 3 consecutive no-shows. Score drops to ~20. The cautionary tale.
3. **Alex** -- 0 vouches, brand new. Score 50. The ambiguous case.
4. **Priya** -- 25 vouches, all showed_up. Score ~175. Reliable but no standout.
5. **Sam** -- 8 vouches, mixed. Score ~60. Average.
6. **Riley** -- 15 vouches, heavy on endorsements. Score ~180. Well-liked.
7. **Taylor** -- 5 vouches, one ghosted. Score ~35. Borderline.
8. **Casey** -- 18 vouches, steady positive. Score ~130. Solid history.

Demo flow uses Marcus (1), Jordan (2), and Alex (3) per the PRD script.

---

## Demo script (90 seconds)

1. Show Marcus -- 40 vouches, high score, every one links to a Solana devnet tx
2. Ghost three people as Marcus -- sign attestations live, watch score drop, see txs on Explorer
3. Delete and come back -- new wallet, zero vouches, score 50
4. Hit tamper -- chain goes red, but Solana Explorer still shows original tx hashes
5. "Reputation belongs to the key, not to us. Any app can read it. It is already on Solana."

---

## Build order (3 hours)

| Time | Milestone |
|---|---|
| 0:00-0:20 | Next.js scaffold, Tailwind, wallet adapter wired, devnet connection confirmed |
| 0:20-0:50 | chain.ts + scoring.ts + types.ts -- pure functions, testable in console |
| 0:50-1:10 | solana.ts -- memo tx builder, test with devnet airdrop + memo send |
| 1:10-1:40 | seed.ts -- 8 personas with pre-built chains |
| 1:40-2:15 | UI panels -- Profile, Match, Chain, Attestation modal, FAQ panel |
| 2:15-2:30 | Tamper demo button, chain verification visual (green/red) |
| 2:30-2:45 | Polish -- empty states, copy, responsive |
| 2:45-3:00 | Freeze. Test demo twice. Record fallback. |

---

## Risks specific to this build

1. **Devnet RPC rate limits** -- use api.devnet.solana.com, Helius free tier as backup
2. **Wallet not installed** -- "demo mode" with generated keypair if no extension detected
3. **Airdrop failures** -- pre-fund demo wallets before presenting
4. **Time** -- feature freeze at 2:15 is hard. If behind, skip tamper animation, show raw JSON

---

## What we tell judges about next steps

1. Custom Anchor program for full on-chain attestation storage
2. Sybil resistance via salted phone hash anchor
3. Zero-knowledge threshold proofs for privacy
4. Public read API for cross-platform portability
5. Deploy to Solana mainnet
