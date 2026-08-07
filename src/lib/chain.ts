import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { Block, Attestation } from './types';

function hashBlock(index: number, timestamp: number, payload: Attestation, prevHash: string): string {
  const data = JSON.stringify({ index, timestamp, payload, prevHash });
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

export function createGenesisBlock(): Block {
  const timestamp = Date.now();
  const payload: Attestation = { type: 'endorsed', from: 'genesis', to: 'genesis', dateId: '0', timestamp };
  const hash = hashBlock(0, timestamp, payload, '0');
  return { index: 0, timestamp, payload, prevHash: '0', hash };
}

export function appendBlock(chain: Block[], attestation: Attestation, solanaTxSig?: string): Block[] {
  const prev = chain[chain.length - 1];
  const index = prev.index + 1;
  const timestamp = attestation.timestamp;
  const hash = hashBlock(index, timestamp, attestation, prev.hash);
  const block: Block = { index, timestamp, payload: attestation, prevHash: prev.hash, hash, solanaTxSig };
  return [...chain, block];
}

export function verifyChain(chain: Block[]): { valid: boolean; brokenAt: number | null } {
  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const expectedHash = hashBlock(block.index, block.timestamp, block.payload, block.prevHash);
    if (block.hash !== expectedHash) return { valid: false, brokenAt: i };
    if (block.prevHash !== chain[i - 1].hash) return { valid: false, brokenAt: i };
  }
  return { valid: true, brokenAt: null };
}

export function tamperBlock(chain: Block[], index: number, newPayload: Attestation): Block[] {
  return chain.map((block, i) => {
    if (i < index) return block;
    if (i === index) {
      const tamperedHash = hashBlock(block.index, block.timestamp, newPayload, block.prevHash);
      return { ...block, payload: newPayload, hash: tamperedHash };
    }
    // Blocks after tampered one keep their original hash -- they will fail verification
    return block;
  });
}
