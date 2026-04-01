import { describe, expect, it } from "vitest";

import manifest from "../generated/manifest.json";
import { loadGeneratedEmojiMatchMaps } from "../src/data/generated.js";

describe("generated emoji data", () => {
  it("includes the generated manifest", () => {
    expect(manifest.locales).toContain("en");
    expect(manifest.shortcodePresetsByLocale.en).toContain("cldr");
  });

  it("loads locale and shortcode match maps from generated chunks", () => {
    const matchMaps = loadGeneratedEmojiMatchMaps(["en"], ["cldr"]);

    expect(matchMaps.names.fire).toBe("🔥");
    expect(matchMaps.hexcodes["1f525"]).toBe("🔥");
    expect(matchMaps.shortcodes[":fire:"]).toBe("🔥");
  });

  it("merges shortcode presets in order from generated chunks", () => {
    const matchMaps = loadGeneratedEmojiMatchMaps(
      ["en"],
      ["github", "emojibase"],
    );

    expect(matchMaps.shortcodes[":sunny:"]).toBe("☀️");
    expect(matchMaps.shortcodes[":sun:"]).toBe("☀️");
    expect(matchMaps.shortcodes[":thumbsup:"]).toBe("👍️");
    expect(matchMaps.shortcodes[":yes:"]).toBe("👍️");
  });
});
