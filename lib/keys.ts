import * as secp from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";

// @noble/secp256k1 v2 needs an hmac-sha256 implementation for sync signing.
secp.etc.hmacSha256Sync = (key, ...msgs) =>
  hmac(sha256, key, secp.etc.concatBytes(...msgs));

export function generateKeypair(): { priv: string; pub: string } {
  const priv = secp.utils.randomPrivateKey();
  return { priv: bytesToHex(priv), pub: bytesToHex(secp.getPublicKey(priv)) };
}

export function pubFromPriv(privHex: string): string {
  return bytesToHex(secp.getPublicKey(hexToBytes(privHex)));
}

export function signMessage(message: string, privHex: string): string {
  const msgHash = sha256(utf8ToBytes(message));
  return secp.sign(msgHash, hexToBytes(privHex)).toCompactHex();
}

export function shortKey(hex: string, lead = 6): string {
  if (!hex) return "";
  return `${hex.slice(0, lead)}\u2026${hex.slice(-4)}`;
}

const ANCHOR_SALT = "vouch-anchor-v1";

/**
 * Sybil anchor: a salted hash of a phone number. One key per anchor.
 * The number itself never leaves the device. Stubbed in the demo.
 */
export function anchorHash(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  return bytesToHex(sha256(utf8ToBytes(ANCHOR_SALT + normalized)));
}
