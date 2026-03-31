import { createRequire } from "node:module";

import type { VitemojiLocale, VitemojiShortcodePreset } from "../options.js";
import {
  hasShortcodeDataset,
  validateShortcodePresetLocales,
} from "./emojibase-shortcodes.js";

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
  locales: readonly VitemojiLocale[],
  shortcodePresets: readonly VitemojiShortcodePreset[],
): EmojiEntry[] {
  const cacheKey = `${locales.join(",")}:${shortcodePresets.join(",")}`;
  const cachedEntries = emojiEntryCache.get(cacheKey);

  if (cachedEntries) {
    return cachedEntries;
  }

  validateShortcodePresetLocales(locales, shortcodePresets);

  const entries = locales.flatMap((locale) =>
    loadLocaleEmojibaseEntries(locale, shortcodePresets),
  );

  emojiEntryCache.set(cacheKey, entries);

  return entries;
}

function loadLocaleEmojibaseEntries(
  locale: VitemojiLocale,
  shortcodePresets: readonly VitemojiShortcodePreset[],
): EmojiEntry[] {
  const compactEmojis = loadCompactEmojis(locale);
  const shortcodesByHexcode = loadShortcodes(locale, shortcodePresets);

  return compactEmojis.map((emoji) => ({
    emoji: emoji.unicode,
    shortcodes: shortcodesByHexcode[emoji.hexcode] ?? [],
    names: toTokens(emoji.label),
    keywords: toTokens(emoji.tags),
    hexcodes: [emoji.hexcode],
  }));
}

function loadCompactEmojis(locale: VitemojiLocale): CompactEmoji[] {
  return requireDataset<CompactEmoji[]>(
    `emojibase-data/${locale}/compact.json`,
  );
}

function loadShortcodes(
  locale: VitemojiLocale,
  shortcodePresets: readonly VitemojiShortcodePreset[],
): Record<string, string[]> {
  const shortcodesByHexcode: Record<string, string[]> = {};
  const claimedShortcodes = new Set<string>();

  for (const shortcodePreset of shortcodePresets) {
    if (!hasShortcodeDataset(locale, shortcodePreset)) {
      continue;
    }

    const presetShortcodes = requireDataset<Record<string, ShortcodeValue>>(
      `emojibase-data/${locale}/shortcodes/${shortcodePreset}.json`,
    );

    for (const [hexcode, shortcodeValue] of Object.entries(presetShortcodes)) {
      const shortcodeTokens = toShortcodes(shortcodeValue);

      for (const shortcodeToken of shortcodeTokens) {
        if (claimedShortcodes.has(shortcodeToken)) {
          continue;
        }

        claimedShortcodes.add(shortcodeToken);

        if (!shortcodesByHexcode[hexcode]) {
          shortcodesByHexcode[hexcode] = [];
        }

        shortcodesByHexcode[hexcode].push(shortcodeToken);
      }
    }
  }

  return shortcodesByHexcode;
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

  return toTokens(
    Array.isArray(value) ? value.map((item) => `:${item}:`) : `:${value}:`,
  );
}

function toTokens(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return Array.from(new Set(values.filter((item) => item.length > 0)));
}
