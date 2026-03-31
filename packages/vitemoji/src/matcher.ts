import type { EmojiEntry } from "./data/emojibase.js";
import type { VitemojiMatchBy } from "./options.js";

export interface EmojiMatchMaps {
  shortcodes: Record<string, string>;
  hexcodes: Record<string, string>;
  names: Record<string, string>;
  keywords: Record<string, string>;
}

export interface EmojiMatcher {
  isEmpty: boolean;
  rewriteText(value: string): string;
}

interface EmojiMatchPass {
  textMap: Record<string, string>;
  matchPattern: RegExp | null;
}

const TOKEN_CHAR_PATTERN = /[\p{L}\p{N}]/u;
const TOKEN_CHAR_CLASS = String.raw`[\p{L}\p{N}]`;

export function createEmojiMatchMaps(
  emojiEntries: EmojiEntry[],
  matchBy: Required<VitemojiMatchBy>,
): EmojiMatchMaps {
  const matchMaps: EmojiMatchMaps = {
    shortcodes: {},
    hexcodes: {},
    names: {},
    keywords: {},
  };

  for (const entry of emojiEntries) {
    if (matchBy.shortcodes) {
      addTokens(matchMaps.shortcodes, entry.shortcodes, entry.emoji);
    }

    if (matchBy.hexcodes) {
      addTokens(matchMaps.hexcodes, entry.hexcodes, entry.emoji);
    }

    if (matchBy.names) {
      addTokens(matchMaps.names, entry.names, entry.emoji);
    }

    if (matchBy.keywords) {
      addTokens(matchMaps.keywords, entry.keywords, entry.emoji);
    }
  }

  return matchMaps;
}

export function createEmojiMatcher(matchMaps: EmojiMatchMaps): EmojiMatcher {
  const passes = createEmojiMatchPasses(matchMaps);

  return {
    isEmpty: passes.every((pass) => pass.matchPattern === null),
    rewriteText(value: string) {
      let nextValue = value;

      for (const pass of passes) {
        nextValue = rewriteWithPass(nextValue, pass);
      }

      return nextValue;
    },
  };
}

function createMatchPattern(textMap: Record<string, string>): RegExp | null {
  const keys = Object.keys(textMap);

  if (keys.length === 0) {
    return null;
  }

  return new RegExp(
    keys
      .sort((left, right) => right.length - left.length)
      .map((key) => toPatternSource(key))
      .join("|"),
    "giu",
  );
}

function createEmojiMatchPasses(matchMaps: EmojiMatchMaps): EmojiMatchPass[] {
  return [
    createEmojiMatchPass(matchMaps.shortcodes),
    createEmojiMatchPass(matchMaps.hexcodes),
    createEmojiMatchPass(matchMaps.names),
    createEmojiMatchPass(matchMaps.keywords),
  ];
}

function createEmojiMatchPass(textMap: Record<string, string>): EmojiMatchPass {
  return {
    textMap,
    matchPattern: createMatchPattern(textMap),
  };
}

function rewriteWithPass(value: string, pass: EmojiMatchPass): string {
  if (pass.matchPattern === null) {
    return value;
  }

  pass.matchPattern.lastIndex = 0;

  return value.replace(
    pass.matchPattern,
    (word) => pass.textMap[word.toLowerCase()] ?? word,
  );
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

function toPatternSource(value: string): string {
  const escapedValue = escapeRegExp(value);
  const startsWithToken = hasTokenChar(value.at(0));
  const endsWithToken = hasTokenChar(value.at(-1));

  return `${startsWithToken ? `(?<!${TOKEN_CHAR_CLASS})` : ""}${escapedValue}${endsWithToken ? `(?!${TOKEN_CHAR_CLASS})` : ""}`;
}

function hasTokenChar(value: string | undefined): boolean {
  return value !== undefined && TOKEN_CHAR_PATTERN.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
