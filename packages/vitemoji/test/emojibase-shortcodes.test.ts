import { describe, expect, it } from "vitest";

import { validateShortcodePresetLocales } from "../src/data/emojibase-shortcodes.js";
import { loadGeneratedEmojiMatchMaps } from "../src/data/generated.js";
import { createEmojiMatcher, filterEmojiMatchMaps } from "../src/matcher.js";
import type {
  VitemojiLocale,
  VitemojiShortcodePreset,
} from "../src/options.js";

const validShortcodeLocaleCases = [
  [["bn"], ["cldr"]],
  [["ko"], ["cldr-native"]],
  [["bn"], ["emojibase", "cldr"]],
  [["ja"], ["emojibase-native"]],
  [["en", "fr", "zh"], ["emojibase"]],
  [
    ["en", "fr", "zh"],
    ["github", "cldr"],
  ],
  [["en"], ["discord", "slack"]],
] satisfies readonly [
  readonly VitemojiLocale[],
  readonly VitemojiShortcodePreset[],
][];

const invalidShortcodeLocaleCases = [
  [
    ["bn"],
    ["github"],
    /None of the requested shortcode presets support locales: bn/,
  ],
  [
    ["bn", "da"],
    ["emojibase", "github"],
    /None of the requested shortcode presets support locales: bn, da/,
  ],
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
  function createGeneratedMatcher(
    locales: readonly VitemojiLocale[],
    shortcodePresets: readonly VitemojiShortcodePreset[],
    matchBy: {
      shortcodes?: boolean;
      names?: boolean;
      keywords?: boolean;
      hexcodes?: boolean;
    },
  ) {
    return createEmojiMatcher(
      filterEmojiMatchMaps(
        loadGeneratedEmojiMatchMaps(locales, shortcodePresets),
        {
          shortcodes: matchBy.shortcodes ?? false,
          names: matchBy.names ?? false,
          keywords: matchBy.keywords ?? false,
          hexcodes: matchBy.hexcodes ?? false,
        },
      ),
    );
  }

  it.each(
    validShortcodeLocaleCases,
  )("accepts locales %j with shortcode presets %j", (locales, shortcodePresets) => {
    expect(() =>
      validateShortcodePresetLocales(locales, shortcodePresets),
    ).not.toThrow();
  });

  it.each(
    invalidShortcodeLocaleCases,
  )("rejects locales %j with shortcode presets %j", (locales, shortcodePresets, message) => {
    expect(() =>
      validateShortcodePresetLocales(locales, shortcodePresets),
    ).toThrowError(message);
  });

  it("merges shortcode presets in order", () => {
    const matcher = createGeneratedMatcher(["en"], ["github", "emojibase"], {
      shortcodes: true,
    });

    expect(matcher.rewriteText(":sunny:")).toBe("☀️");
    expect(matcher.rewriteText(":sun:")).toBe("☀️");
    expect(matcher.rewriteText(":thumbsup: :yes:")).toBe("👍️ 👍️");
  });

  it.each(
    localizedNameCases,
  )("loads localized names for locales %j", (locales, input, expected) => {
    const matcher = createGeneratedMatcher(locales, ["cldr"], {
      names: true,
    });

    expect(matcher.rewriteText(input)).toBe(expected);
  });

  it("supports localized shortcodes when a locale-specific preset exists", () => {
    const matcher = createGeneratedMatcher(["bn"], ["cldr"], {
      shortcodes: true,
    });

    expect(matcher.rewriteText(":aagun:")).toBe("🔥");
  });

  it("supports native shortcodes for native presets", () => {
    const matcher = createGeneratedMatcher(["ko"], ["cldr-native"], {
      shortcodes: true,
    });

    expect(matcher.rewriteText(":미소_짓는_눈으로_웃는_얼굴:")).toBe("😁");
  });

  it("supports discord as an alias of joypixels", () => {
    const matcher = createGeneratedMatcher(["en"], ["discord"], {
      shortcodes: true,
    });

    expect(matcher.rewriteText(":flame:")).toBe("🔥");
  });

  it("supports slack as an alias of iamcal", () => {
    const slackMatcher = createGeneratedMatcher(["en"], ["slack"], {
      shortcodes: true,
    });
    const discordMatcher = createGeneratedMatcher(["en"], ["discord"], {
      shortcodes: true,
    });

    expect(slackMatcher.rewriteText(":thumbsup:")).toBe("👍️");
    expect(slackMatcher.rewriteText(":thumbs_up:")).toBe(":thumbs_up:");
    expect(discordMatcher.rewriteText(":thumbs_up:")).toBe("👍️");
  });
});
