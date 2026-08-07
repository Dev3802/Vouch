import type { AttestationType, Block, VouchPayload } from "./types";

export const BASE_SCORE = 50;

export const DELTAS: Record<AttestationType, number> = {
  showed_up: 5,
  endorsed: 10,
  no_show: -20,
  ghosted: -10,
};

export const ATTESTATION_LABELS: Record<AttestationType, string> = {
  showed_up: "Showed up",
  endorsed: "Endorsed",
  no_show: "No-show",
  ghosted: "Ghosted after",
};

export function vouchesFor(chain: Block[], pub: string): Block[] {
  return chain.filter(
    (b) => b.payload.kind === "vouch" && b.payload.to === pub
  );
}

/**
 * Score is derived on read from the chain. It is never stored.
 * Clamped to 0-100 after every vouch, so a maxed-out account still
 * visibly bleeds points the moment its behavior turns.
 */
export function deriveScore(chain: Block[], pub: string): number {
  let score = BASE_SCORE;
  for (const b of vouchesFor(chain, pub)) {
    const p = b.payload as VouchPayload;
    const delta = DELTAS[p.attestation];
    // Both sides signing raises the weight.
    score += p.bothSigned ? Math.round(delta * 1.5) : delta;
    score = Math.max(0, Math.min(100, score));
  }
  return score;
}

export type ScoreTone = "unknown" | "good" | "neutral" | "bad";

export function scoreTone(score: number, vouchCount: number): ScoreTone {
  if (vouchCount === 0) return "unknown";
  if (score >= 70) return "good";
  if (score >= 40) return "neutral";
  return "bad";
}

export function accountAgeBlocks(chain: Block[], joinedBlock: number): number {
  return Math.max(0, chain.length - joinedBlock);
}
