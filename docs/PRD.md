# Vouch

**Dating reputation you can't reset.**

PRD v0.1 | 3-hour hackathon build | Cursor

---

## The problem

Every dating app has the same hole: a bad actor gets reported, deletes the account, and is back in ten minutes with a new one. Reputation lives inside the platform, so it dies with the account. Users carry nothing between apps and start from zero trust every time.

Ghosting, catfishing, and no-shows have no cost because there is no record.

## The product

Vouch gives each person a portable, signed history of how they actually behave. After a date, both people sign a short attestation. Those attestations are appended to a public chain and become part of a profile that no platform owns and no delete button erases.

A fresh account has no vouches. That absence is the signal.

## Why a chain does real work here

Three things a normal database cannot do:

1. **Non-erasable.** The record survives the account and survives the app.
2. **Counterparty-signed.** A vouch is only valid if the other person's key signed it, so you cannot manufacture a good history alone.
3. **Portable.** The reputation belongs to the keypair, not to us. Another app could read it tomorrow.

That is the entire pitch. Everything else in the app is ordinary.

---

## Scope for 3 hours

### In

**F1. Identity**
- Browser generates a keypair on first load. That is the account.
- No email, no password, no signup form.
- Display name and one photo, stored off-chain.

**F2. Profile with vouches**
- Profile shows: reputation score, vouch count, account age in blocks.
- Vouch list is visible to anyone, each showing type, counterparty, and timestamp.
- Empty-state copy is important: "No vouches. This account is new or was recently reset."

**F3. Match and date**
- Simple card stack, swipe or tap. No real matching algorithm.
- On mutual match, a "date" object is created with a state machine: proposed, confirmed, completed.

**F4. Attestation**
- After a date completes, each party signs one of: showed up, no-show, ghosted after, endorsed.
- Signing happens with the local key, no wallet extension required.
- A vouch is committed when at least one side signs. Both sides signing raises the weight.

**F5. The chain view**
- A visible ledger panel: blocks, hashes, prev-hash links, the signature on each entry.
- Tamper button. Edit any past entry and watch the whole chain downstream go red. This is the demo's money shot.

**F6. Score**
- Simple and legible on stage. Start at 50. Showed up +5, endorsed +10, no-show -20, ghosted -10.
- Score is derived on read from the chain, never stored. Say this out loud during the demo.

### Out

- Real chat, real photo upload, real testnet deploy, wallet connect, KYC, mobile, moderation, any matching intelligence, gas, tokens, NFTs.

---

## Build notes

**Stack:** Next.js + Tailwind, one page with panels. `@noble/secp256k1` for keys and signing. SHA-256 for block hashing. State in localStorage plus a seed file. No backend, no RPC, no wallet extension.

**Chain implementation:** an array of blocks, each `{ index, timestamp, payload, signature, prevHash, hash }`. Hash the block on append. Verify by walking the array. This is around 60 lines and it is a real hash chain, so nobody has to lie about anything.

**If asked whether it is on a testnet:** it is a local chain, deploying to Base is the next step. Say it plainly. Judges respect that more than a fake RPC endpoint.

**Seed data:** 8 personas, pre-signed histories. Include the three that carry the demo:
- One with 40 vouches over 200 blocks, mostly endorsements. Obviously trustworthy.
- One with a 12-vouch history that turns bad, three no-shows in a row. Obviously not.
- One brand new with zero. The ambiguous case that makes the point.

---

## Timeline

| Time | Checkpoint |
|---|---|
| 0:00 | Repo up, Next.js running, three-panel layout stubbed |
| 0:30 | Keygen and signing working in console. Chain append and verify passing |
| 1:15 | Profiles and card stack rendering off seed data |
| 1:45 | Full loop works once end to end: match, complete, sign, score moves |
| 2:15 | Feature freeze. Chain panel and tamper button |
| 2:30 | Seed data polished, copy tightened, empty states written |
| 2:45 | Demo run twice, in the actual room, on the actual wifi |
| 3:00 | Stop |

**Team split**
- Person 1: crypto and chain module. Pure functions, no UI. Testable in isolation from minute one.
- Person 2: UI shell, cards, profile, ledger panel.
- Person 3: seed data, demo script, and the fallback. Also the person who says no to new features after 2:15.

**Fallback:** a recorded 60-second screen capture of a clean run, ready to play. Build this at 2:30, not at 2:55.

---

## Demo script, 90 seconds

1. "This is Marcus. 40 vouches, two years of history, every one signed by someone he actually met." Show profile.
2. "This is Marcus after he ghosts three people." Sign three attestations live, watch the score drop.
3. "So he deletes and comes back." New account, zero vouches. "That is the point. He can't buy back two years."
4. "And he can't edit the past either." Hit tamper, chain goes red.
5. "Reputation belongs to the key, not to us. Any app can read it."

Stop there. Do not explain the stack unless asked.

## Questions you will get, and the answers

**Why not just a database?** Because we would own it and we could be pressured to delete it, and no other app could trust it. Portability is the feature.

**What stops fake attestations between two friends?** Nothing in v1, and we should say so. Real version weights each vouch by the counterparty's own reputation, so a ring of new accounts endorsing each other produces almost nothing.

**Isn't a permanent record of someone's dating life dangerous?** Fair, and the answer shapes v2. Vouches are pseudonymous to a keypair, attestations are behavioral rather than narrative, and there is no free-text field to weaponize. Nobody writes "she was rude." The vocabulary is four options.

**Privacy?** Zero-knowledge proofs let you prove a score above a threshold without revealing the underlying history. Out of scope today, correct answer to give.

**Who pays?** Both sides. Platforms license the verification API per check, which is the Hinge and Bumble motion. Consumers keep the wallet and the profile free, because the record only has value if people carry it between apps.
