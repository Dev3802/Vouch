export type AttestationType = "showed_up" | "endorsed" | "no_show" | "ghosted";

export interface VouchPayload {
  kind: "vouch";
  attestation: AttestationType;
  from: string; // pubkey hex
  to: string; // pubkey hex
  bothSigned: boolean;
}

export interface GenesisPayload {
  kind: "genesis";
  note: string;
}

/** Phone-anchored identity registration — unique ID on the chain. */
export interface IdentityPayload {
  kind: "identity";
  pub: string;
  anchor: string;
}

export type BlockPayload = VouchPayload | GenesisPayload | IdentityPayload;

export interface Block {
  index: number;
  timestamp: number;
  payload: BlockPayload;
  signature: string;
  prevHash: string;
  hash: string;
  solanaTxSig?: string;
}

export interface Persona {
  id: string;
  name: string;
  age: number;
  bio: string;
  gradient: string;
  pub: string;
  priv: string; // seed personas keep local keys so they can countersign in the demo
  joinedBlock: number;
}

export interface Identity {
  name: string;
  gradient: string;
  pub: string;
  priv: string;
  /** Salted hash of the sybil-resistant anchor (phone in v1). Stubbed in the demo. */
  anchor?: string;
}

export type DateState = "proposed" | "confirmed" | "completed" | "attested";

export interface DateObj {
  id: string;
  personaId: string;
  state: DateState;
  createdAt: number;
}
