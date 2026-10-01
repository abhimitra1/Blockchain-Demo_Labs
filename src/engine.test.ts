import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { blockHash, computeChain, hashText, matchingPeers, mineSync, ZERO, type Block } from './engine';
import seeds from './seeds.json';

describe('SHA-256', () => {
  it('matches the published empty-string and abc vectors', () => {
    expect(hashText('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(hashText('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('matches independent Node crypto for Unicode and long input', () => {
    for (const input of ['Hello, blockchain!', 'नमस्ते 🌏', 'a'.repeat(10000)]) {
      expect(hashText(input)).toBe(createHash('sha256').update(input).digest('hex'));
    }
  });
});

describe('proof of work and chains', () => {
  it('ships five correctly mined linked blocks for both demos', () => {
    for(const blocks of [seeds.standard,seeds.tokens]) {
      const computed = computeChain(blocks);
      expect(computed).toHaveLength(5);
      expect(computed.every(b => b.valid)).toBe(true);
      expect(computed[0].previous).toBe(ZERO);
      computed.slice(1).forEach((b,i) => expect(b.previous).toBe(computed[i].hash));
    }
  });
  it('changes all downstream hashes after tampering and preserves earlier blocks', () => {
    const edited = structuredClone(seeds.standard), original = computeChain(edited);
    edited[1].data = 'Tampered';
    const changed = computeChain(edited);
    expect(changed[0]).toEqual(original[0]);
    expect(changed.slice(1).every((b,i) => b.hash !== original[i+1].hash && !b.valid)).toBe(true);
  });
  it('repairs a changed chain by mining in order', () => {
    const edited: Block[] = structuredClone(seeds.standard);
    edited[0].data = 'A new history';
    let previous = ZERO;
    for(let i=0;i<edited.length;i++) { edited[i]=mineSync(edited[i],previous,2); previous=blockHash(edited[i],previous); }
    expect(computeChain(edited,2).every(b=>b.valid)).toBe(true);
  });
  it('cannot make a chain valid by mining only a successor', () => {
    const edited = structuredClone(seeds.standard);
    edited[0].data = 'Tampered';
    const previous = computeChain(edited,2)[0].hash;
    edited[1] = mineSync(edited[1],previous,2);
    expect(computeChain(edited,2)[1].proof).toBe(true);
    expect(computeChain(edited,2)[1].valid).toBe(false);
  });
});

describe('independent peers and transfers', () => {
  it('detects divergence without altering other peers', () => {
    const peers = [structuredClone(seeds.standard),structuredClone(seeds.standard),structuredClone(seeds.standard)];
    expect(matchingPeers(peers)).toBe(3);
    peers[0][1].data = 'Different data';
    expect(matchingPeers(peers)).toBe(2);
    expect(peers[1]).toEqual(seeds.standard);
    expect(peers[2]).toEqual(seeds.standard);
  });
  it('a valid re-mined peer can still disagree with the network', () => {
    const peers = [structuredClone(seeds.standard),structuredClone(seeds.standard),structuredClone(seeds.standard)];
    peers[0][4] = mineSync({...peers[0][4],data:'A different ending'},computeChain(peers[0])[4].previous,2);
    expect(computeChain(peers[0],2).every(b=>b.valid)).toBe(true);
    expect(matchingPeers(peers,2)).toBe(2);
  });
  it('hashes every sender, recipient, and amount and propagates transfer edits', () => {
    for (const field of ['from','to','amount'] as const) {
      const edited = structuredClone(seeds.tokens);
      edited[1].transactions[0][field] = field==='amount' ? '99' : 'Mallory';
      const before = computeChain(seeds.tokens), after = computeChain(edited);
      expect(after[0]).toEqual(before[0]);
      expect(after.slice(1).every((b,i)=>b.hash!==before[i+1].hash)).toBe(true);
    }
  });
});
