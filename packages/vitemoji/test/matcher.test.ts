import { describe, expect, it } from "vitest";

import type { EmojiEntry } from "../src/data/emojibase.js";
import { createEmojiMatcher, createEmojiMatchMaps } from "../src/matcher.js";

function createMatcher(
  emojiEntries: EmojiEntry[],
  matchBy: {
    shortcodes?: boolean;
    names?: boolean;
    keywords?: boolean;
    hexcodes?: boolean;
  } = {},
) {
  return createEmojiMatcher(
    createEmojiMatchMaps(emojiEntries, {
      shortcodes: matchBy.shortcodes ?? false,
      names: matchBy.names ?? false,
      keywords: matchBy.keywords ?? false,
      hexcodes: matchBy.hexcodes ?? false,
    }),
  );
}

describe("createEmojiMatcher", () => {
  const boundaryMatcher = createMatcher(
    [
      {
        emoji: "🍬",
        shortcodes: [],
        names: ["bon"],
        keywords: [],
        hexcodes: [],
      },
      {
        emoji: "🔥",
        shortcodes: [],
        names: ["fire"],
        keywords: [],
        hexcodes: [],
      },
    ],
    { names: true },
  );

  it("prefers the longest phrase match within a category", () => {
    const matcher = createMatcher(
      [
        {
          emoji: "😡",
          shortcodes: [],
          names: ["angry"],
          keywords: [],
          hexcodes: [],
        },
        {
          emoji: "🙂",
          shortcodes: [],
          names: ["face"],
          keywords: [],
          hexcodes: [],
        },
        {
          emoji: "🤬",
          shortcodes: [],
          names: ["angry face"],
          keywords: [],
          hexcodes: [],
        },
      ],
      { names: true },
    );

    expect(matcher.rewriteText("angry face")).toBe("🤬");
  });

  it.each([
    ["bonfire", "bonfire"],
    ["wildfire", "wildfire"],
    ["bon fire", "🍬 🔥"],
    ["fire!", "🔥!"],
  ])("uses boundaries when rewriting %s", (input, expected) => {
    expect(boundaryMatcher.rewriteText(input)).toBe(expected);
  });

  it("applies category priority before keyword fallback", () => {
    const matcher = createMatcher(
      [
        {
          emoji: "❤️‍🔥",
          shortcodes: [],
          names: ["heart on fire"],
          keywords: ["fire"],
          hexcodes: [],
        },
        {
          emoji: "🔥",
          shortcodes: [],
          names: ["fire"],
          keywords: [],
          hexcodes: [],
        },
      ],
      { names: true, keywords: true },
    );

    expect(matcher.rewriteText("fire")).toBe("🔥");
    expect(matcher.rewriteText("heart on fire")).toBe("❤️‍🔥");
  });

  it.each([
    ["1F525", "🔥"],
    ["A 1F525 B", "A 🔥 B"],
    ["X1F525", "X1F525"],
  ])("matches hexcodes in %s", (input, expected) => {
    const matcher = createMatcher(
      [
        {
          emoji: "🔥",
          shortcodes: [],
          names: ["fire"],
          keywords: [],
          hexcodes: ["1F525"],
        },
      ],
      { hexcodes: true, names: true },
    );

    expect(matcher.rewriteText(input)).toBe(expected);
  });

  it.each([
    [":fire:", "🔥"],
    ["(:fire:)", "(🔥)"],
    ["foo:fire:bar", "foo🔥bar"],
  ])("matches shortcode tokens in %s", (input, expected) => {
    const matcher = createMatcher(
      [
        {
          emoji: "🔥",
          shortcodes: [":fire:"],
          names: [],
          keywords: [],
          hexcodes: [],
        },
      ],
      { shortcodes: true },
    );

    expect(matcher.rewriteText(input)).toBe(expected);
  });
});
