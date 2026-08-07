# Vouch

**Dating reputation you can't reset.**

A portable, signed history of how you actually behave on dates. After a date, both people sign a short attestation. Attestations are appended to a local hash chain and become part of a profile no platform owns and no delete button erases.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's inside

- **Identity** — the browser generates a secp256k1 keypair on first load. That is the account. No email, no password. Keys are issued one per sybil-resistant anchor — a salted phone hash in v1 (verification stubbed in the demo) — so deleting a key does not buy a free fresh start.
- **Match deck** — card stack of seed personas; liking always matches, which creates a date with a `proposed → confirmed → completed` state machine.
- **Attestations** — after a date completes, both parties are prompted at the same moment to sign one of: showed up (+5), endorsed (+10), no-show (−20), ghosted after (−10). Signed with your local key. Negative attestations require both keys or they never commit — nobody can write a permanent accusation alone (positives stay one-sided). Unsigned completed dates read as gaps, never as neutral.
- **Score** — starts at 50, derived on read from the chain, never stored. Both sides signing weights the vouch ×1.5.
- **Chain ledger** — every block with its signature, prev-hash link and hash. Hit **tamper** on any block and watch the chain break red downstream. **Reset** restores the honest copy.

## Stack

Next.js + Tailwind, one page with three panels. `@noble/secp256k1` for keys and signing, SHA-256 (`@noble/hashes`) for block hashing. State in `localStorage` plus generated seed data. No backend, no RPC, no wallet extension.

It is a local chain — deploying to Base is the next step.
