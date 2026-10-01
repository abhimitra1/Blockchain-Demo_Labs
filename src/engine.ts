import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
export type Transaction = { from: string; to: string; amount: string };
export type Block = {
  number: number;
  nonce: number;
  data: string;
  transactions?: Transaction[];
};
export type ComputedBlock = Block & {
  previous: string;
  hash: string;
  proof: boolean;
  valid: boolean;
};
export const ZERO = "0".repeat(64);
export const hashText = (text: string) => bytesToHex(sha256(utf8ToBytes(text)));
export function blockHash(block: Block, previous: string) {
  return hashText(
    JSON.stringify([
      block.number,
      block.nonce,
      block.transactions ?? block.data,
      previous,
    ]),
  );
}
export function computeChain(blocks: Block[], difficulty = 4): ComputedBlock[] {
  let previous = ZERO,
    valid = true;
  return blocks.map((block) => {
    const hash = blockHash(block, previous),
      proof = hash.startsWith("0".repeat(difficulty));
    valid = valid && proof;
    const result = { ...block, previous, hash, proof, valid };
    previous = hash;
    return result;
  });
}
export function mineSync(
  block: Block,
  previous: string,
  difficulty = 4,
): Block {
  let nonce = 0;
  while (
    !blockHash({ ...block, nonce }, previous).startsWith("0".repeat(difficulty))
  )
    nonce++;
  return { ...block, nonce };
}
export function matchingPeers(peers: Block[][], difficulty = 4): number {
  const hashes = peers
    .map((p) => computeChain(p, difficulty))
    .filter((p) => p.every((b) => b.valid))
    .map((p) => p.at(-1)!.hash);
  return Math.max(
    0,
    ...hashes.map((h) => hashes.filter((other) => other === h).length),
  );
}
