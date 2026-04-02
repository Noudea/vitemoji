// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EmojifyTextOptions } from "../src/options.js";
import { createEmojifier } from "../src/runtime/create-emojifier.js";
import {
  useCreateEmojifier,
  useEmojifier,
  VitemojiProvider,
} from "../src/runtime/react.js";

vi.mock("../src/runtime/create-emojifier.js", () => ({
  createEmojifier: vi.fn(),
}));

interface ProbeSnapshot {
  error: Error | null;
  isReady: boolean;
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

function CreateHookProbe({ input, onSnapshot, options }: HookProbeProps) {
  const { isReady, error, emojifyText } = useCreateEmojifier(options);

  onSnapshot({
    error,
    isReady,
    output: emojifyText(input),
  });

  return null;
}

function ProviderHookProbe({ input }: { input: string }) {
  const emojifyText = useEmojifier();

  return <span>{emojifyText(input)}</span>;
}

function OutsideProviderProbe() {
  useEmojifier();

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

describe("useCreateEmojifier", () => {
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
        createElement(CreateHookProbe, {
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
      error: null,
      isReady: false,
      output: "hello world",
    });
    await waitForSnapshot(() => snapshots.at(-1)?.isReady === true);
    expect(snapshots.at(-1)).toEqual({
      error: null,
      isReady: true,
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
        createElement(CreateHookProbe, {
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

    expect(latestSnapshot?.isReady).toBe(false);
    expect(latestSnapshot?.output).toBe(":fire:");
    expect(latestSnapshot?.error?.message).toBe("Failed to load emojifier");
  });
});

describe("VitemojiProvider and useEmojifier", () => {
  it("renders fallback first and then provides the emojifier", async () => {
    let resolveEmojifier: ((value: (input: string) => string) => void) | null =
      null;

    vi.mocked(createEmojifier).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEmojifier = resolve;
        }),
    );

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    mountedRoots.push({ container, root });

    await act(async () => {
      root.render(
        createElement(
          VitemojiProvider,
          {
            fallback: createElement("span", null, "Loading emoji data..."),
            options: { locales: ["en"], shortcodePresets: ["cldr"] },
          },
          createElement(ProviderHookProbe, { input: ":fire:" }),
        ),
      );

      await settleAsyncWork();
    });

    expect(container.textContent).toBe("Loading emoji data...");

    await act(async () => {
      resolveEmojifier?.((input) => (input === ":fire:" ? "🔥" : input));
      await settleAsyncWork();
    });

    expect(container.textContent).toBe("🔥");
  });

  it("throws when useEmojifier is called outside the provider", () => {
    expect(() => renderToString(createElement(OutsideProviderProbe))).toThrow(
      /useEmojifier must be used within a VitemojiProvider/,
    );
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
