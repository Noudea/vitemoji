import { createRequire } from "node:module";

import type { VitemojiShortcodePreset } from "../options.js";

const require = createRequire(import.meta.url);

export interface EmojiEntry {
  emoji: string;
  shortcodes: string[];
  names: string[];
  keywords: string[];
  hexcodes: string[];
}

interface CompactEmoji {
  hexcode: string;
  label?: string;
  tags?: string[];
  unicode: string;
}

type ShortcodeValue = string | string[];

const emojiEntryCache = new Map<string, EmojiEntry[]>();

export function loadEmojibaseEntries(
  locale: string,
  shortcodePreset: VitemojiShortcodePreset,
): EmojiEntry[] {
  const cacheKey = `${locale}:${shortcodePreset}`;
  const cachedEntries = emojiEntryCache.get(cacheKey);

  if (cachedEntries) {
    return cachedEntries;
  }

  const compactEmojis = loadCompactEmojis(locale);
  const shortcodesByHexcode = loadShortcodes(locale, shortcodePreset);
  const entries = compactEmojis.map((emoji) => ({
    emoji: emoji.unicode,
    shortcodes: toShortcodes(shortcodesByHexcode[emoji.hexcode]),
    names: toTokens(emoji.label),
    keywords: toTokens(emoji.tags),
    hexcodes: [emoji.hexcode],
  }));

  emojiEntryCache.set(cacheKey, entries);

  return entries;
}

function loadCompactEmojis(locale: string): CompactEmoji[] {
  return requireDataset<CompactEmoji[]>(`emojibase-data/${locale}/compact.json`);
}

function loadShortcodes(
  locale: string,
  shortcodePreset: VitemojiShortcodePreset,
): Record<string, ShortcodeValue> {
  return requireDataset<Record<string, ShortcodeValue>>(
    `emojibase-data/${locale}/shortcodes/${shortcodePreset}.json`,
  );
}

function requireDataset<T>(path: string): T {
  try {
    return require(path) as T;
  } catch (error) {
    throw new Error(`Unable to load vitemoji dataset: ${path}`, {
      cause: error,
    });
  }
}

function toShortcodes(value: ShortcodeValue | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return toTokens(Array.isArray(value) ? value.map((item) => `:${item}:`) : `:${value}:`);
}

function toTokens(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return Array.from(new Set(values.filter((item) => item.length > 0)));
}
