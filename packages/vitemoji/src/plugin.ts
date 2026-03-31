import type { Plugin } from "vite";

import {
  resolveVitemojiOptions,
  type VitemojiMatchBy,
  type VitemojiOptions,
} from "./options.js";
import { transformUiText } from "./transforms/text.js";

interface EmojiEntry {
  emoji: string;
  shortcodes: string[];
  names: string[];
  keywords: string[];
  hexcodes: string[];
}

const DEFAULT_EMOJI_ENTRIES: EmojiEntry[] = [
  {
    emoji: "👋",
    shortcodes: [":hello:", ":wave:"],
    names: ["hello"],
    keywords: ["hello", "wave"],
    hexcodes: ["1F44B"],
  },
  {
    emoji: "🌍",
    shortcodes: [":world:", ":earth_africa:"],
    names: ["world"],
    keywords: ["world", "earth"],
    hexcodes: ["1F30D"],
  },
  {
    emoji: "🔥",
    shortcodes: [":fire:"],
    names: ["fire"],
    keywords: ["fire", "flame"],
    hexcodes: ["1F525"],
  },
  {
    emoji: "😀",
    shortcodes: [":grinning:", ":smile:"],
    names: ["smile"],
    keywords: ["smile", "happy"],
    hexcodes: ["1F600"],
  },
];

export function vitemoji(options: VitemojiOptions = {}): Plugin {
  const { include, matchBy } = resolveVitemojiOptions(options);
  const textMap = createTextMap(matchBy);

  return {
    name: "vitemoji",
    enforce: "pre",
    transform(code: string, id: string) {
      const cleanId = id.split("?", 1)[0] ?? id;

      if (cleanId.includes("/node_modules/") || !include.test(cleanId)) {
        return null;
      }

      const result = transformUiText(code, textMap);

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

function createTextMap(
  matchBy: Required<VitemojiMatchBy>,
): Record<string, string> {
  const textMap: Record<string, string> = {};

  for (const entry of DEFAULT_EMOJI_ENTRIES) {
    if (matchBy.shortcodes) {
      addTokens(textMap, entry.shortcodes, entry.emoji);
    }

    if (matchBy.hexcodes) {
      addTokens(textMap, entry.hexcodes, entry.emoji);
    }

    if (matchBy.names) {
      addTokens(textMap, entry.names, entry.emoji);
    }

    if (matchBy.keywords) {
      addTokens(textMap, entry.keywords, entry.emoji);
    }
  }

  return textMap;
}

function addTokens(
  textMap: Record<string, string>,
  tokens: string[],
  emoji: string,
): void {
  for (const token of tokens) {
    const normalizedToken = token.toLowerCase();

    if (!(normalizedToken in textMap)) {
      textMap[normalizedToken] = emoji;
    }
  }
}
