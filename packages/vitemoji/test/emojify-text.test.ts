import { describe, expect, it } from "vitest";

import { emojifyText } from "../src/emojify-text.js";

describe("emojifyText", () => {
  it("uses shortcode matching by default", () => {
    expect(emojifyText(":fire:")).toBe("🔥");
    expect(emojifyText("hello world")).toBe("hello world");
  });

  it("supports chaos-style name rewriting", () => {
    expect(
      emojifyText("hello world", {
        preset: "chaos",
        locales: ["en"],
        shortcodePresets: ["github"],
      }),
    ).toBe("👋 🌍️");
  });

  it("supports localized names", () => {
    expect(
      emojifyText("feu", {
        locales: ["fr"],
        shortcodePresets: ["cldr"],
        matchBy: {
          shortcodes: false,
          names: true,
          keywords: false,
          hexcodes: false,
        },
      }),
    ).toBe("🔥");
  });

  it("supports hexcodes when enabled", () => {
    expect(
      emojifyText("1F525", {
        matchBy: {
          shortcodes: false,
          names: false,
          keywords: false,
          hexcodes: true,
        },
      }),
    ).toBe("🔥");
  });

  it("throws when no shortcode preset supports the selected locales", () => {
    expect(() =>
      emojifyText(":fire:", {
        locales: ["bn"],
        shortcodePresets: ["github"],
      }),
    ).toThrowError(
      /None of the requested shortcode presets support locales: bn/,
    );
  });
});
