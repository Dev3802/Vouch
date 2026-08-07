import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import type { Block, BlockPayload } from "./types";

export const GENESIS_PREV = "0".repeat(64);

export function computeHash(
  index: number,
  timestamp: number,
  payload: BlockPayload,
  signature: string,
  prevHash: string
): string {
  const data = JSON.stringify({ index, timestamp, payload, signature, prevHash });
  return bytesToHex(sha256(utf8ToBytes(data)));
}

/** Canonical message a signer commits to for a given payload. */
export function payloadMessage(payload: BlockPayload): string {
  return JSON.stringify(payload);
}

export function appendBlock(
  chain: Block[],
  payload: BlockPayload,
  signature: string,
  timestamp: number = Date.now()
): Block[] {
  const index = chain.length;
  const prevHash = index === 0 ? GENESIS_PREV : chain[index - 1].hash;
  const hash = computeHash(index, timestamp, payload, signature, prevHash);
  return [...chain, { index, timestamp, payload, signature, prevHash, hash }];
}

export interface ChainStatus {
  broken: boolean;
  firstBadIndex: number | null;
  /** true = block is invalid, either in itself or because an ancestor broke */
  badFlags: boolean[];
}

export function verifyChain(chain: Block[]): ChainStatus {
  const badFlags: boolean[] = new Array(chain.length).fill(false);
  let firstBad: number | null = null;
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    const recomputed = computeHash(b.index, b.timestamp, b.payload, b.signature, b.prevHash);
    const selfBad =
      recomputed !== b.hash || (i > 0 && b.prevHash !== chain[i - 1].hash);
    badFlags[i] = selfBad || (i > 0 && badFlags[i - 1]);
    if (badFlags[i] && firstBad === null) firstBad = i;
  }
  return { broken: firstBad !== null, firstBadIndex: firstBad, badFlags };
}
