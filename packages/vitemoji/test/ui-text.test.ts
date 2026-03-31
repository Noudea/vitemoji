import { describe, expect, it } from "vitest";

import type { EmojiEntry } from "../src/data/emojibase.js";
import { createEmojiMatchMaps, createEmojiMatcher } from "../src/matcher.js";
import { transformUiText } from "../src/transforms/ui-text.js";

const nameEmojiEntries: EmojiEntry[] = [
  { emoji: "👋", shortcodes: [], names: ["hello"], keywords: [], hexcodes: [] },
  { emoji: "🌍", shortcodes: [], names: ["world"], keywords: [], hexcodes: [] },
  { emoji: "😀", shortcodes: [], names: ["smile"], keywords: [], hexcodes: [] },
  {
    emoji: "❤️‍🔥",
    shortcodes: [],
    names: ["heart on fire"],
    keywords: [],
    hexcodes: [],
  },
];

const nameEmojiMatcher = createEmojiMatcher(
  createEmojiMatchMaps(nameEmojiEntries, {
    shortcodes: false,
    names: true,
    keywords: false,
    hexcodes: false,
  }),
);

const shortcodeEmojiMatcher = createEmojiMatcher(
  createEmojiMatchMaps(
    [
      { emoji: "🔥", shortcodes: [":fire:"], names: [], keywords: [], hexcodes: [] },
    ],
    {
      shortcodes: true,
      names: false,
      keywords: false,
      hexcodes: false,
    },
  ),
);

const hexcodeEmojiMatcher = createEmojiMatcher(
  createEmojiMatchMaps(
    [
      { emoji: "🔥", shortcodes: [], names: [], keywords: [], hexcodes: ["1F525"] },
    ],
    {
      shortcodes: false,
      names: false,
      keywords: false,
      hexcodes: true,
    },
  ),
);

describe("transformUiText", () => {
  it("rewrites JSX text, string literals, and template literal quasis", () => {
    const result = transformUiText(
      `export function App() {
  const name = "builder";

  return (
    <main>
      <h1>hello world</h1>
      <h2>heart on fire</h2>
      <p>{"hello world"}</p>
      <p>{\`smile \${name}\`}</p>
    </main>
  );
}`,
      nameEmojiMatcher,
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain("<h1>👋 🌍</h1>");
    expect(result.code).toContain("<h2>❤️‍🔥</h2>");
    expect(result.code).toContain('{"👋 🌍"}');
    expect(result.code).toContain('`😀 ${name}`');
  });

  it("returns the original code when nothing changes", () => {
    const result = transformUiText(
      `export function App() {
  return <main><h1>unchanged text</h1></main>;
}`,
      nameEmojiMatcher,
    );

    expect(result.changed).toBe(false);
    expect(result.code).toContain("unchanged text");
  });

  it.each([
    [
      `export function App() {
  return <main><p>:fire:</p></main>;
}`,
      "<p>🔥</p>",
    ],
    [
      `export function App() {
  return <main><p>{":fire:"}</p></main>;
}`,
      '{"🔥"}',
    ],
  ])("rewrites shortcode content", (source, expected) => {
    const result = transformUiText(source, shortcodeEmojiMatcher);

    expect(result.changed).toBe(true);
    expect(result.code).toContain(expected);
  });

  it.each([
    [
      `export function App() {
  return <main><p>1F525</p></main>;
}`,
      "<p>🔥</p>",
    ],
    [
      `export function App() {
  return <main><p>{"1F525"}</p></main>;
}`,
      '{"🔥"}',
    ],
  ])("rewrites hexcode content", (source, expected) => {
    const result = transformUiText(source, hexcodeEmojiMatcher);

    expect(result.changed).toBe(true);
    expect(result.code).toContain(expected);
  });
});
