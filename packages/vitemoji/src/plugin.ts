import type { Plugin } from "vite";

import { loadGeneratedEmojiMatchMaps } from "./data/generated.js";
import { createEmojiMatcher, filterEmojiMatchMaps } from "./matcher.js";
import { resolveVitemojiOptions, type VitemojiOptions } from "./options.js";
import { transformUiText } from "./transforms/ui-text.js";

export function vitemoji(options: VitemojiOptions = {}): Plugin {
  const { include, locales, matchBy, shortcodePresets } =
    resolveVitemojiOptions(options);
  const emojiMatcher = createEmojiMatcher(
    filterEmojiMatchMaps(
      loadGeneratedEmojiMatchMaps(locales, shortcodePresets),
      matchBy,
    ),
  );

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
