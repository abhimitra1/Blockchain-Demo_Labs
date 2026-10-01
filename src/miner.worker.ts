import { blockHash, type Block } from './engine';
self.onmessage = (event: MessageEvent<{ block: Block; previous: string; difficulty: number }>) => {
  const { block, previous, difficulty } = event.data;
  const target = '0'.repeat(difficulty), start = performance.now();
  let nonce = 0;
  for (;;) {
    const hash = blockHash({ ...block, nonce }, previous);
    if (hash.startsWith(target)) {
      self.postMessage({ type: 'done', nonce, attempts: nonce + 1, elapsed: performance.now() - start });
      break;
    }
    nonce++;
    if (nonce % 5000 === 0) self.postMessage({ type: 'progress', attempts: nonce, nonce });
  }
};
