import { describe, expect, it } from "vitest";

import { createEmojifier } from "../src/create-emojifier.js";

describe("createEmojifier", () => {
  it("loads generated chunks and creates a reusable emojifier", async () => {
    const emojifier = await createEmojifier({
      preset: "chaos",
      locales: ["en"],
      shortcodePresets: ["cldr"],
    });

    expect(emojifier(":fire:")).toBe("🔥");
    expect(emojifier("hello world")).toBe("👋 🌍️");
  });

  it("supports locale-specific async configurations", async () => {
    const emojifier = await createEmojifier({
      locales: ["fr", "zh"],
      shortcodePresets: ["cldr"],
      matchBy: {
        shortcodes: false,
        names: true,
        keywords: false,
        hexcodes: false,
      },
    });

    expect(emojifier("feu")).toBe("🔥");
    expect(emojifier("火焰")).toBe("🔥");
  });

  it("rejects unsupported locale and preset combinations", async () => {
    await expect(
      createEmojifier({
        locales: ["bn"],
        shortcodePresets: ["github"],
      }),
    ).rejects.toThrow(
      /None of the requested shortcode presets support locales: bn/,
    );
  });
});
