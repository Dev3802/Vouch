import { Block, SCORE_DELTAS, BASE_SCORE } from './types';

export function deriveScore(chain: Block[], pubkey: string): number {
  let score = BASE_SCORE;
  for (const block of chain) {
    if (block.index === 0) continue; // skip genesis
    if (block.payload.to === pubkey) {
      score += SCORE_DELTAS[block.payload.type];
    }
  }
  return Math.max(0, score);
}

export function getVouchCount(chain: Block[], pubkey: string): number {
  return chain.filter(b => b.index > 0 && b.payload.to === pubkey).length;
}

export function getVouchesFor(chain: Block[], pubkey: string): Block[] {
  return chain.filter(b => b.index > 0 && b.payload.to === pubkey);
}
