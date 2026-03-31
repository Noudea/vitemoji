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
  trieRoot: TrieNode | null;
}

interface TrieNode {
  children: Map<string, TrieNode>;
  emoji?: string;
  requiresStartBoundary?: boolean;
  requiresEndBoundary?: boolean;
}

interface EmojiMatch {
  emoji: string;
  endIndex: number;
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
    isEmpty: passes.every((pass) => pass.trieRoot === null),
    rewriteText(value: string) {
      let nextValue = value;

      for (const pass of passes) {
        nextValue = rewriteWithPass(nextValue, pass);
      }

      return nextValue;
    },
  };
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
    trieRoot: createTrie(textMap),
  };
}

function rewriteWithPass(value: string, pass: EmojiMatchPass): string {
  if (pass.trieRoot === null) {
    return value;
  }

  let nextValue = "";
  let index = 0;

  while (index < value.length) {
    const match = findLongestMatch(pass.trieRoot, value, index);

    if (match) {
      nextValue += match.emoji;
      index = match.endIndex;
      continue;
    }

    const nextIndex = getNextCodePointIndex(value, index);
    nextValue += value.slice(index, nextIndex);
    index = nextIndex;
  }

  return nextValue;
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

function createTrie(textMap: Record<string, string>): TrieNode | null {
  const entries = Object.entries(textMap);

  if (entries.length === 0) {
    return null;
  }

  const root: TrieNode = {
    children: new Map(),
  };

  for (const [token, emoji] of entries) {
    let node = root;

    for (const char of token) {
      const normalizedChar = char.toLowerCase();
      let child = node.children.get(normalizedChar);

      if (!child) {
        child = { children: new Map() };
        node.children.set(normalizedChar, child);
      }

      node = child;
    }

    node.emoji = emoji;
    node.requiresStartBoundary = hasTokenChar(getFirstCodePoint(token));
    node.requiresEndBoundary = hasTokenChar(getLastCodePoint(token));
  }

  return root;
}

function findLongestMatch(
  trieRoot: TrieNode,
  value: string,
  startIndex: number,
): EmojiMatch | null {
  let node = trieRoot;
  let index = startIndex;
  let bestMatch: EmojiMatch | null = null;

  while (index < value.length) {
    const char = getCodePointAt(value, index);
    const child = node.children.get(char.toLowerCase());

    if (!child) {
      break;
    }

    node = child;
    index += char.length;

    if (
      node.emoji &&
      matchesBoundaries(
        value,
        startIndex,
        index,
        node.requiresStartBoundary ?? false,
        node.requiresEndBoundary ?? false,
      )
    ) {
      bestMatch = {
        emoji: node.emoji,
        endIndex: index,
      };
    }
  }

  return bestMatch;
}

function hasTokenChar(value: string | undefined): boolean {
  return value !== undefined && TOKEN_CHAR_PATTERN.test(value);
}

function matchesBoundaries(
  value: string,
  startIndex: number,
  endIndex: number,
  requiresStartBoundary: boolean,
  requiresEndBoundary: boolean,
): boolean {
  if (requiresStartBoundary && !isBoundaryBefore(value, startIndex)) {
    return false;
  }

  if (requiresEndBoundary && !isBoundaryAfter(value, endIndex)) {
    return false;
  }

  return true;
}

function isBoundaryBefore(value: string, index: number): boolean {
  if (index === 0) {
    return true;
  }

  return !hasTokenChar(getPreviousCodePoint(value, index));
}

function isBoundaryAfter(value: string, index: number): boolean {
  if (index >= value.length) {
    return true;
  }

  return !hasTokenChar(getCodePointAt(value, index));
}

function getCodePointAt(value: string, index: number): string {
  return String.fromCodePoint(value.codePointAt(index) ?? 0);
}

function getNextCodePointIndex(value: string, index: number): number {
  return index + getCodePointAt(value, index).length;
}

function getPreviousCodePoint(
  value: string,
  index: number,
): string | undefined {
  if (index <= 0) {
    return undefined;
  }

  const lastCodeUnit = value.charCodeAt(index - 1);

  if (lastCodeUnit >= 0xdc00 && lastCodeUnit <= 0xdfff && index >= 2) {
    const previousCodeUnit = value.charCodeAt(index - 2);

    if (previousCodeUnit >= 0xd800 && previousCodeUnit <= 0xdbff) {
      return value.slice(index - 2, index);
    }
  }

  return value.slice(index - 1, index);
}

function getFirstCodePoint(value: string): string | undefined {
  for (const char of value) {
    return char;
  }

  return undefined;
}

function getLastCodePoint(value: string): string | undefined {
  let lastChar: string | undefined;

  for (const char of value) {
    lastChar = char;
  }

  return lastChar;
}
