import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import type { BlockPayload } from './types';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export const QUICKNODE_RPC = 'https://blissful-radial-county.solana-devnet.quiknode.pro/6e0fc64d24644a330fd09365a4424d9503a38dff/';

export function getConnection(): Connection {
  return new Connection(QUICKNODE_RPC, 'confirmed');
}

export function hashPayload(payload: BlockPayload): string {
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify(payload))));
}

export async function sendMemoTx(
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  payload: BlockPayload
): Promise<string> {
  const hash = hashPayload(payload);
  const memoText = `vouch:${hash}`;
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, 'utf-8'),
  });
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await signTransaction(transaction);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

export function getExplorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}
