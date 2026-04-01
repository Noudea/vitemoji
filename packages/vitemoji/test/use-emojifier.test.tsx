// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EmojifyTextOptions } from "../src/options.js";
import { createEmojifier } from "../src/runtime/create-emojifier.js";
import { useEmojifier } from "../src/runtime/react.js";

vi.mock("../src/runtime/create-emojifier.js", () => ({
  createEmojifier: vi.fn(),
}));

interface ProbeSnapshot {
  ready: boolean;
  error: Error | null;
  output: string;
}

interface HookProbeProps {
  input: string;
  onSnapshot: (snapshot: ProbeSnapshot) => void;
  options: EmojifyTextOptions;
}

const mountedRoots: Array<{
  container: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
}> = [];

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  vi.mocked(createEmojifier).mockReset();
});

function HookProbe({ input, onSnapshot, options }: HookProbeProps) {
  const { ready, error, emojifyText } = useEmojifier(options);

  onSnapshot({
    ready,
    error,
    output: emojifyText(input),
  });

  return null;
}

afterEach(async () => {
  for (const { container, root } of mountedRoots.splice(0)) {
    await act(async () => {
      root.unmount();
    });

    container.remove();
  }
});

describe("useEmojifier", () => {
  it("returns a passthrough function first, then the loaded emojifier", async () => {
    vi.mocked(createEmojifier).mockResolvedValue((input) =>
      input === "hello world" ? "👋 🌍️" : input,
    );

    const snapshots: ProbeSnapshot[] = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    mountedRoots.push({ container, root });

    await act(async () => {
      root.render(
        createElement(HookProbe, {
          input: "hello world",
          onSnapshot: (snapshot: ProbeSnapshot) => snapshots.push(snapshot),
          options: {
            preset: "chaos",
            locales: ["en"],
            shortcodePresets: ["cldr"],
          },
        }),
      );

      await settleAsyncWork();
    });

    expect(snapshots[0]).toEqual({
      ready: false,
      error: null,
      output: "hello world",
    });
    await waitForSnapshot(() => snapshots.at(-1)?.ready === true);
    expect(snapshots.at(-1)).toEqual({
      ready: true,
      error: null,
      output: "👋 🌍️",
    });
  });

  it("surfaces async loading errors while keeping passthrough output", async () => {
    vi.mocked(createEmojifier).mockRejectedValue(
      new Error("Failed to load emojifier"),
    );

    const snapshots: ProbeSnapshot[] = [];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    mountedRoots.push({ container, root });

    await act(async () => {
      root.render(
        createElement(HookProbe, {
          input: ":fire:",
          onSnapshot: (snapshot: ProbeSnapshot) => snapshots.push(snapshot),
          options: {
            locales: ["bn"],
            shortcodePresets: ["github"],
          },
        }),
      );

      await settleAsyncWork();
    });

    await waitForSnapshot(() => snapshots.at(-1)?.error !== null);
    const latestSnapshot = snapshots.at(-1);

    expect(latestSnapshot?.ready).toBe(false);
    expect(latestSnapshot?.output).toBe(":fire:");
    expect(latestSnapshot?.error?.message).toBe("Failed to load emojifier");
  });
});

async function settleAsyncWork() {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
}

async function waitForSnapshot(predicate: () => boolean) {
  for (let index = 0; index < 20; index += 1) {
    if (predicate()) {
      return;
    }

    await act(async () => {
      await settleAsyncWork();
    });
  }

  throw new Error("Timed out waiting for hook snapshot");
}
