import { afterEach, expect, it, vi } from "vitest";
import { blockHash, ZERO } from "./engine";
afterEach(() => vi.unstubAllGlobals());
it("mining worker reports a genuine successful nonce and attempt count", async () => {
  const messages: {
    type: string;
    nonce: number;
    attempts: number;
    elapsed: number;
  }[] = [];
  const scope = {
    postMessage: (message: (typeof messages)[number]) => messages.push(message),
    onmessage: (_: unknown) => {},
  };
  vi.stubGlobal("self", scope);
  await import("./miner.worker");
  const block = { number: 1, nonce: 0, data: "Mining worker smoke test" };
  scope.onmessage({ data: { block, previous: ZERO, difficulty: 4 } });
  const result = messages.at(-1)!;
  expect(result.type).toBe("done");
  expect(
    blockHash({ ...block, nonce: result.nonce }, ZERO).startsWith("0000"),
  ).toBe(true);
  expect(result.attempts).toBe(result.nonce + 1);
  expect(result.elapsed).toBeGreaterThan(0);
  expect(messages.some((m) => m.type === "progress")).toBe(true);
});
