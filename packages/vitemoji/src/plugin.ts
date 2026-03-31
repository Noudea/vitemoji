import type { Plugin } from "vite";

import { loadEmojibaseEntries } from "./data/emojibase.js";
import { createEmojiMatchMaps, createEmojiMatcher } from "./matcher.js";
import { resolveVitemojiOptions, type VitemojiOptions } from "./options.js";
import { transformUiText } from "./transforms/ui-text.js";

export function vitemoji(options: VitemojiOptions = {}): Plugin {
  const { include, locales, matchBy, shortcodePreset } = resolveVitemojiOptions(options);
  const emojiEntries = loadEmojibaseEntries(locales, shortcodePreset);
  const emojiMatcher = createEmojiMatcher(createEmojiMatchMaps(emojiEntries, matchBy));

  return {
    name: "vitemoji",
    enforce: "pre",
    transform(code: string, id: string) {
      const cleanId = id.split("?", 1)[0] ?? id;

      if (cleanId.includes("/node_modules/") || !include.test(cleanId)) {
        return null;
      }

      const result = transformUiText(code, emojiMatcher);

      if (!result.changed) {
        return null;
      }

      return {
        code: result.code,
        map: null,
      };
    },
  };
}
