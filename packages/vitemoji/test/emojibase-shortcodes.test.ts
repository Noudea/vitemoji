import { describe, expect, it } from "vitest";

import { loadEmojibaseEntries } from "../src/data/emojibase.js";
import { validateShortcodePresetLocales } from "../src/data/emojibase-shortcodes.js";
import { createEmojiMatchMaps, createEmojiMatcher } from "../src/matcher.js";
import type {
  VitemojiLocale,
  VitemojiShortcodePreset,
} from "../src/options.js";

const validShortcodeLocaleCases = [
  [["bn"], ["cldr"]],
  [["bn"], ["emojibase", "cldr"]],
  [["en", "fr", "zh"], ["emojibase"]],
  [["en", "fr", "zh"], ["github", "cldr"]],
] satisfies readonly [
  readonly VitemojiLocale[],
  readonly VitemojiShortcodePreset[],
][];

const invalidShortcodeLocaleCases = [
  [["bn"], ["github"], /None of the requested shortcode presets support locales: bn/],
  [["bn", "da"], ["emojibase", "github"], /None of the requested shortcode presets support locales: bn, da/],
] satisfies readonly [
  readonly VitemojiLocale[],
  readonly VitemojiShortcodePreset[],
  RegExp,
][];

const localizedNameCases = [
  [["en"], "fire", "🔥"],
  [["fr"], "feu", "🔥"],
  [["zh"], "火焰", "🔥"],
  [["en", "fr", "zh"], "fire feu 火焰", "🔥 🔥 🔥"],
] satisfies readonly [readonly VitemojiLocale[], string, string][];

describe("Emojibase shortcode support", () => {
  it.each(validShortcodeLocaleCases)(
    "accepts locales %j with shortcode presets %j",
    (locales, shortcodePresets) => {
      expect(() =>
        validateShortcodePresetLocales(locales, shortcodePresets),
      ).not.toThrow();
    },
  );

  it.each(invalidShortcodeLocaleCases)(
    "rejects locales %j with shortcode presets %j",
    (locales, shortcodePresets, message) => {
      expect(() =>
        validateShortcodePresetLocales(locales, shortcodePresets),
      ).toThrowError(message);
    },
  );

  it("merges shortcode presets in order", () => {
    const entries = loadEmojibaseEntries(["en"], ["github", "emojibase"]);
    const sun = entries.find((entry) => entry.hexcodes.includes("2600"));
    const thumbsUp = entries.find((entry) => entry.hexcodes.includes("1F44D"));

    expect(sun?.shortcodes).toEqual(expect.arrayContaining([":sunny:", ":sun:"]));
    expect(thumbsUp?.shortcodes).toEqual(
      expect.arrayContaining([":+1:", ":thumbsup:", ":yes:"]),
    );
  });

  it.each(localizedNameCases)(
    "loads localized names for locales %j",
    (locales, input, expected) => {
      const entries = loadEmojibaseEntries(locales, ["cldr"]);
      const matcher = createEmojiMatcher(
        createEmojiMatchMaps(entries, {
          shortcodes: false,
          names: true,
          keywords: false,
          hexcodes: false,
        }),
      );

      expect(matcher.rewriteText(input)).toBe(expected);
    },
  );

  it("supports localized shortcodes when a locale-specific preset exists", () => {
    const entries = loadEmojibaseEntries(["bn"], ["cldr"]);
    const matcher = createEmojiMatcher(
      createEmojiMatchMaps(entries, {
        shortcodes: true,
        names: false,
        keywords: false,
        hexcodes: false,
      }),
    );

    expect(matcher.rewriteText(":aagun:")).toBe("🔥");
  });
});
