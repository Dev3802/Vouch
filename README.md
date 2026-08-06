# Vouch

**Dating reputation you can't reset.**

Vouch gives each person a portable, signed history of how they actually behave on dates. After a date, both people sign a short attestation. Those attestations are appended to a public chain and become part of a profile that no platform owns and no delete button erases.

A fresh account has no vouches. That absence is the signal.

## Why

Every dating app has the same hole: a bad actor gets reported, deletes the account, and is back in ten minutes with a new one. Reputation lives inside the platform, so it dies with the account. Vouch closes that hole.

## How it works

1. **Identity is a key** -- your profile belongs to a keypair generated on your device
2. **Every vouch is countersigned** -- a vouch is only valid if the counterparty's key signed it
3. **Score is derived, never stored** -- anyone can recompute the number from the chain
4. **An empty profile is the signal** -- starting over costs you everything you built

## Stack

- Next.js + Tailwind
- `@noble/secp256k1` for keys and signing
- SHA-256 for block hashing
- State in localStorage + seed data
- No backend, no RPC, no wallet extension

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Risk Register](docs/RISK-REGISTER.md)
- [Pitch Deck Summary](docs/PITCH.md)

## Getting started

```bash
npm install
npm run dev
```

## License

MIT
