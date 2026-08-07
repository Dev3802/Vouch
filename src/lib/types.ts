export type AttestationType = 'showed_up' | 'endorsed' | 'no_show' | 'ghosted';

export const SCORE_DELTAS: Record<AttestationType, number> = {
  showed_up: 5,
  endorsed: 10,
  no_show: -20,
  ghosted: -10,
};

export const BASE_SCORE = 50;

export interface Attestation {
  type: AttestationType;
  from: string;     // pubkey
  to: string;       // pubkey
  dateId: string;
  timestamp: number;
}

export interface Block {
  index: number;
  timestamp: number;
  payload: Attestation;
  prevHash: string;
  hash: string;
  solanaTxSig?: string; // Solana memo tx signature
}

export interface Persona {
  name: string;
  pubkey: string;
  avatar: string;  // emoji or initial
  bio: string;
  chain: Block[];
}

export interface DateObj {
  id: string;
  parties: [string, string]; // pubkeys
  status: 'proposed' | 'confirmed' | 'completed' | 'attested';
}
