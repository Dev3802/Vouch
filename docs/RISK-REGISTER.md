# Risk Register v0.1

**Where this breaks.** Eight ways to kill Vouch, and what we did about them.

We ran the concept through adversarial review before building it. Two findings changed today's scope. The rest are open, and we would rather name them than get caught by them.

*Read alongside the [product brief](PRD.md).*

---

## Changed today

Two findings were load-bearing, so we fixed them before writing code.

### FIXED IN SCOPE: A new keypair is free, so a bad actor still resets to zero.

Correct, and it was the biggest hole in the original concept. A key with no link to a person is not an identity. Keys are now issued one per sybil-resistant anchor, a salted phone hash in v1, with device attestation and third-party proof-of-personhood as upgrade paths. The anchor is stubbed in the demo and we will say so. Without this, the entire pitch is decorative, which is exactly why it moved into v1 rather than staying in v2.

### FIXED IN SCOPE: One person can publish a permanent negative record about someone else.

This was a harassment tool sitting in our own spec. Negative attestations now require both keys or they never commit. Positives stay one-sided, since a false compliment is a much smaller problem than a false accusation. The asymmetry is deliberate and it is the first thing we would defend in review.

### ANSWERED, V2: Permanent public records about real people versus the right to erasure.

A hash chain cannot honor a deletion request, so the record cannot live on it. Attestation payloads sit off-chain and encrypted; only salted hashes are logged. Destroying a person's key renders their history permanently unreadable while the log stays verifiable. The integrity property survives, the plaintext does not. We are not lawyers and this needs counsel before any real deployment, not after.

---

## Open problems

Four we have not solved, stated plainly.

### OPEN: A signature proves someone asserted something, not that it is true.

Paid and reciprocal endorsements are an unsolved problem everywhere they exist, and a public ledger makes bad input look more credible rather than less. We cannot eliminate this. We can make it expensive: weight each vouch by the signer's own standing, cap how much any one counterparty can move your score, and discount reciprocal pairs. The goal is a bad ring producing near zero, not a guarantee of truth.

### OPEN: A single portable number misleads on thin evidence.

A no-show from a family emergency currently scores the same as deliberate ghosting, and a three-vouch account gets the same confident number as a forty-vouch one. Worse, unlike an in-app rating, this one follows you everywhere. v2 shows a confidence band rather than a point estimate, applies time decay, displays the sample size, and withholds a score entirely below a threshold.

### OPEN: Signing is optional, so scores will inflate.

People who had a good time sign. People who had a bad time have every reason not to, and the person who behaved badly will never volunteer. Left alone this produces a system where everyone looks fine. Partial mitigations: prompt both parties at the same moment while the date is fresh, treat unsigned completed dates as visible gaps rather than as neutral, and never let an absence read as a positive.

---

## What we are not claiming

The chain is doing less work than the word implies.

Non-erasable, counterparty-signed, and portable are all achievable with a signed append-only Merkle log mirrored across a few independent parties, in the Certificate Transparency pattern. No consensus, no gas, no blocks required. The tamper demo is real, and what it demonstrates is hash-chain integrity, which any signed log provides.

What a public chain adds is neutrality of hosting: no single operator, including us, can be leaned on to quietly drop a record. That is a governance property rather than a technical capability, and it is worth something in a market where the incumbents have every reason to want the record gone. We would rather say that than let the word do work it has not earned.

### The real risk

**This is worth nothing until a second platform reads it.**

Portability is the whole value proposition and it does not exist until someone else queries the log. Nobody integrates with a hackathon project. So the sequence is platform first, consumer second: sell verification as a service to one app that has a trust problem it is already paying for in support cost and churn, publish the read API from day one, and treat the second integration as the actual company milestone. The consumer wallet is the wedge, the platform contract is the business.

### What would make us stop

If a sybil anchor cannot be made both effective and privacy-preserving, the reset problem stands and this should not ship. If early pilots show negative attestations being used mostly as retaliation rather than as warning, the harm outweighs the signal. Those are the two tests, and we would rather run them early than defend the idea past the point where it is defensible.
