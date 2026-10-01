// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import App from "./App";
import { hashText } from "./engine";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
}
beforeEach(() => {
  window.history.replaceState({}, "", "/hash");
  vi.stubGlobal("Worker", FakeWorker);
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  FakeWorker.instances = [];
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const navigate = (name: string) =>
  fireEvent.click(screen.getByRole("link", { name }));

describe("sandbox interactions", () => {
  it("hashes edited inputs, compares bits, and resets", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: "Input data" }), {
      target: { value: "abc" },
    });
    expect(document.querySelector(".hash-output")!.textContent).toBe(
      hashText("abc"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Compare inputs" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Comparison input" }),
      { target: { value: "abc" } },
    );
    expect(screen.getByText("0 / 256")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Empty string" }));
    expect(document.querySelector(".hash-output")!.textContent).toBe(
      hashText(""),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Input data",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Hello, blockchain!");
    expect(
      screen.queryByRole("textbox", { name: "Comparison input" }),
    ).toBeNull();
  });
  it("supports all five routes and preserves experiments while navigating", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: "Input data" }), {
      target: { value: "Persistent while navigating" },
    });
    for (const [name, path] of [
      ["Block demo", "/block"],
      ["Blockchain demo", "/blockchain"],
      ["Distributed demo", "/distributed"],
      ["Tokens demo", "/tokens"],
    ]) {
      navigate(name);
      expect(window.location.pathname).toBe(path);
    }
    navigate("Hash demo");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Input data",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Persistent while navigating");
  });
  it("invalidates downstream blocks when editing data", () => {
    window.history.replaceState({}, "", "/blockchain");
    render(<App />);
    expect(screen.getByText("5 of 5 blocks valid")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Block 2 data" }), {
      target: { value: "Tampered" },
    });
    expect(screen.getByText("1 of 5 blocks valid")).toBeTruthy();
    expect(document.querySelectorAll(".block-card.invalid")).toHaveLength(4);
  });
  it("isolates peer edits and resets all peers in the current sandbox", () => {
    window.history.replaceState({}, "", "/distributed");
    render(<App />);
    fireEvent.change(screen.getByRole("textbox", { name: "Block 1 data" }), {
      target: { value: "Peer A only" },
    });
    expect(
      screen.getByText(
        "2 of 3 peers share the same valid chain. One copy differs.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Peer B/ }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Block 1 data",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Hello, blockchain!");
    fireEvent.click(screen.getByRole("button", { name: /Peer A/ }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Block 1 data",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Peer A only");
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(
      screen.getByText("All 3 peers agree on the same valid chain."),
    ).toBeTruthy();
  });
  it("edits, adds, and removes transfers and detects divergence", () => {
    window.history.replaceState({}, "", "/tokens");
    render(<App />);
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Block 1 transaction 1 amount" }),
      { target: { value: "999" } },
    );
    expect(
      screen.getByText(
        "2 of 3 peers share the same valid chain. One copy differs.",
      ),
    ).toBeTruthy();
    const block = document.querySelector(".block-card") as HTMLElement;
    fireEvent.click(
      within(block).getByRole("button", { name: "Add transfer" }),
    );
    expect(
      screen.getByRole("textbox", { name: "Block 1 transaction 3 sender" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove transaction 3 from block 1" }),
    );
    expect(
      screen.queryByRole("textbox", { name: "Block 1 transaction 3 sender" }),
    ).toBeNull();
  });
  it("starts a mining worker, locks editing, stops safely, and applies a result", () => {
    window.history.replaceState({}, "", "/block");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Mine block" }));
    expect(FakeWorker.instances[0].postMessage).toHaveBeenCalledOnce();
    expect(
      (
        screen
          .getByRole("textbox", { name: "Block 1 data" })
          .closest("fieldset") as HTMLFieldSetElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Stop mining" }));
    expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
    expect(
      (
        screen
          .getByRole("textbox", { name: "Block 1 data" })
          .closest("fieldset") as HTMLFieldSetElement
      ).disabled,
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Mine block" }));
    const w = FakeWorker.instances[1];
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(w.terminate).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Stop mining" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mine block" }));
    act(() =>
      FakeWorker.instances[2].onmessage!({
        data: { type: "done", nonce: 123, attempts: 124, elapsed: 10 },
      }),
    );
    expect(
      (
        screen.getByRole("spinbutton", {
          name: "Block 1 nonce",
        }) as HTMLInputElement
      ).value,
    ).toBe("123");
    expect(FakeWorker.instances[2].terminate).toHaveBeenCalledOnce();
  });
  it("recognizes nested reference-style routes", () => {
    window.history.replaceState({}, "", "/blockchain/tokens");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Tokens." })).toBeTruthy();
  });
});
