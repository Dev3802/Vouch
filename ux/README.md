# Vouch — UX Specification

This folder is the single source of truth for the Vouch UI. It is written so an AI agent (Claude, Cursor, etc.) or a new contributor can pick it up and extend the interface without guessing.

Read alongside the product brief (PRD) and risk register in `docs/`.

**The runnable UI lives at the repo root** (`app/`, `components/`, `lib/`). This `ux/` folder holds the design spec, style reference, and screenshots so Claude (or any agent) can restyle or extend the product without guessing.

## Product in one paragraph

Vouch gives each person a portable, signed history of how they behave on dates. After a date, both people sign a short attestation; attestations are appended to a local hash chain and become a reputation score no platform owns and no delete button erases. A fresh account has no vouches — that absence is the signal.

## Visual language

**Editorial, warm, trustworthy.** Light cream surfaces, serif italic display type for names and headings, pill-shaped controls, and one blue accent family. It should read like a well-set magazine page that happens to have a ledger in it — not like a crypto dashboard, and not like a neon dating app.

See `reference/style-inspiration.jpg` for the mood reference this design follows.

### Design tokens

Defined in `app/globals.css` under `@theme` (Tailwind v4 utilities are generated from these):

| Token | Value | Use |
|---|---|---|
| `bg` | `#ece9e2` | Page background (with a blue-tinted gradient wash at the top) |
| `panel` | `#fbfaf7` | Cards, panels, modals |
| `panel2` | `#f2efe8` | Nested surfaces, inputs, chips |
| `edge` | `#e0dcd1` | All borders |
| `ink` | `#23211c` | Primary text |
| `mute` | `#8b8577` | Secondary text, labels |
| `signal` | `#3a5bc7` | The accent. Trust, links, positive states, valid chain |
| `signal2` | `#7c99ea` | Light end of the blue gradient |
| `danger` | `#b8432e` | Negative attestations, broken chain, destructive actions |
| `warn` | `#a17b24` | Caution states: ghosted, unproven, tamper affordances |

Primary buttons use the `.blue-gradient` helper (`#4d6fdd → #2c49a8`, 135deg). The page background carries a hint of blue: `#e3e7f2` fading to cream by ~420px.

### Typography

- **Display: Fraunces** (`--font-display`, class `font-display`), usually *italic*. Used for: the wordmark "Vouch.", persona names, modal headings, monogram avatar tiles.
- **Body: Inter** (`--font-sans`). All UI text.
- **Mono: system monospace** (`font-mono`). Keys, hashes, signatures, scores, block numbers. Always truncated with `shortKey()` (`lib/keys.ts`) — never show a full hash in the UI.

### Hard rules

1. **No emojis anywhere.** Avatars are initials on gradient tiles (`initials()` in `lib/ui.ts`) or photos (`PERSONA_PHOTOS` map). Icons are inline SVG (see `components/VerifiedBadge.tsx`).
2. Buttons and chips are pill-shaped (`rounded-full`); cards and panels are `rounded-2xl`.
3. Score color always follows tone, computed by `scoreTone()` (`lib/score.ts`): blue ≥ 70, amber 40–69, red < 40, gray "—" for zero-vouch accounts.
4. Empty-state copy for a profile with no vouches is verbatim from the PRD: "No vouches. This account is new or was recently reset."
5. The score is derived on read from the chain, never stored. Do not cache it in state.

## Layout

One page (`app/page.tsx`), three panels, ~30/40/30 on desktop. No mobile layout (demo app).

- **Top bar** — wordmark, "Start fresh" reset button, identity chip (initials avatar, name, truncated pubkey, live score).
- **Left: Match** (`components/MatchDeck.tsx`) — photo card stack with name overlaid on a bottom fade, vouch-count pill + block age, Pass / Like pill buttons, and the "Your dates" tracker with the `proposed → confirmed → completed` state chips.
- **Center: Profile** (`components/ProfilePanel.tsx`) — avatar, serif name (+ blue `VerifiedBadge` if in `PERSONA_VERIFIED`), copyable key chip, anchored/unanchored chip, score ring, vouches + account-age stat tiles, signed history list (`VouchRow`).
- **Right: Chain** (`components/ChainLedger.tsx`) — every block newest-first with signature, prev-hash, hash; VALID/BROKEN status chip; per-block "tamper" button; red cascade with staggered animation when the chain breaks; Reset restores the honest copy.

Screenshots in `screenshots/`: `main-layout.jpg`, `vouch-pill-card.jpg`, `profile-and-dates.jpg`, `start-fresh-modal.jpg`.

## User flows

### Onboarding (`components/IdentitySetup.tsx`)
Shown via **Start fresh** (first load auto-enters a demo identity so the match deck is immediate).
1. "Generating your keypair…" moment (~1.5s).
2. **Step 1 — Phone** with primary **Continue** (7+ digits) and **Skip for demo**. Never leave the user with no path forward.
3. **Step 2 — Profile**: display name + color, then **Enter Vouch**.
4. New accounts start with zero vouches by design.

### Layout rule
The three-panel Match / Profile / Chain view owns the first viewport (`h-screen`). FAQ ("Hard questions") is collapsed by default and lives **below** that viewport so it cannot crush the swipe deck.

### Match → date → attestation
1. Like on the card always matches (demo behavior) and creates a date in `proposed`.
2. Date advances manually: Confirm date → Mark completed → Sign attestation.
3. Attestation modal (`components/AttestationModal.tsx`): four options with their score deltas — Showed up +5, Endorsed +10, No-show −20, Ghosted after −10. Copy notes both parties are prompted at the same moment, and skipping leaves a visible gap, never a positive.
4. **Negative attestations require both keys** (risk register: fixed in scope). Selecting No-show/Ghosted shows the amber explainer and the button becomes "Sign & request co-sign". The counterparty co-signature is stubbed and labeled as such. Positives stay one-sided.
5. Commit appends a block; the counterparty attests back on positives; scores re-derive everywhere immediately.

### Reset / new profile
"Start fresh" in the top bar → confirmation modal → deletes the key only. The chain keeps the old key's history; the new key starts at zero. This is the "he can't buy back two years" demo beat.

### Tamper demo
Any vouch block's "tamper" button lets you rewrite its attestation. The block and everything downstream flip red with a staggered cascade; the header shows BROKEN at #n and a Reset appears. This is the demo's money shot.

## Data / logic modules

| File | Responsibility |
|---|---|
| `lib/keys.ts` | secp256k1 keygen, signing, `shortKey()`, `anchorHash()` |
| `lib/chain.ts` | Block shape, SHA-256 hashing, append, walk-verify with inherited invalidity |
| `lib/score.ts` | Deltas, labels, score derivation (running 0–100 clamp), `scoreTone()` |
| `lib/seed.ts` | 8 personas + ~210-block pre-signed history. Marcus (p0): 40 vouches, trustworthy. Dana (p1): 12 vouches, three no-shows at the end. Riley (p2): zero vouches. |
| `lib/ui.ts` | `initials()`, `PERSONA_PHOTOS`, `PERSONA_VERIFIED` |

State persists in localStorage: `vouch.identity.v1`, `vouch.chain.v3`, `vouch.personas.v3`. Bump the chain/personas suffix when the seed shape or signing rules change.

## Voice

Plain, confident, a little dry. Say what is stubbed ("Verification is stubbed in this demo"). Never oversell the chain — it is a local hash chain and the copy should survive that being said out loud.
