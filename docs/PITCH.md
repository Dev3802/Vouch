# Vouch -- Pitch Summary

**Dating reputation you can't reset.**

---

## The problem

Reputation dies with the account. On every major platform, your history is the platform's property. It does not follow you, it does not protect the next person, and it disappears the moment the account does.

If deleting your account is free, then behaving badly is free.

Online dating is a multi-billion dollar category with hundreds of millions of accounts, and it is built on an identity layer with no memory.

## The product

A trust record only the other person can write.

Your account is a keypair. After a date, the person you actually met signs a short attestation. It appends to a public chain and becomes part of who you are.

| Principle | Detail |
|---|---|
| Identity is a key | No email, no password, no signup form. Your profile belongs to a keypair generated on your device. |
| Every vouch is countersigned | A vouch is only valid if the counterparty's key signed it. You cannot manufacture a good history alone. |
| Score is derived, never stored | Anyone can recompute the number from the chain and get the same answer. |
| An empty profile is the signal | A new account shows zero vouches. Starting over costs you everything you built. |

## Why this is bigger than dating

Dating is the hardest case, so we started there. The stakes are physical, the incentive to lie is high, and the churn is brutal. A trust layer that survives dating survives anything softer.

The same primitive -- a signed record of how a stranger behaved that no platform can erase -- is missing from every market where two people who have never met agree to show up somewhere: sublets, freelance work, resale handoffs, care work, local services.

## What we shipped

A working end-to-end product: on-device key generation, real signing, a real hash chain with live verification, the full date-to-vouch loop, and a tamper demo that visibly breaks the chain. No mocked backend, no fake ledger.

## The ask

Credits to take this from a working demo to a defensible one:

- Deploy the attestation contract to a public testnet with an open verifier
- Build and simulate sybil resistance, weighting each vouch by the signer's own standing
- Prototype threshold proofs (prove a score is above a bar without exposing the history)
- Run a closed pilot and publish the read API, so the second app to use this record is not ours
