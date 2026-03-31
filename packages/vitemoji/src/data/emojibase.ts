import { createRequire } from "node:module";

import {
  VITEMOJI_LOCALES,
  type VitemojiLocale,
  type VitemojiShortcodePreset,
} from "../options.js";

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
const supportedShortcodeLocalesCache = new Map<
  VitemojiShortcodePreset,
  readonly VitemojiLocale[]
>();

export function loadEmojibaseEntries(
  locales: readonly VitemojiLocale[],
  shortcodePreset: VitemojiShortcodePreset,
): EmojiEntry[] {
  const cacheKey = `${locales.join(",")}:${shortcodePreset}`;
  const cachedEntries = emojiEntryCache.get(cacheKey);

  if (cachedEntries) {
    return cachedEntries;
  }

  validateShortcodePresetLocales(locales, shortcodePreset);

  const entries = locales.flatMap((locale) => loadLocaleEmojibaseEntries(locale, shortcodePreset));

  emojiEntryCache.set(cacheKey, entries);

  return entries;
}

function loadLocaleEmojibaseEntries(
  locale: VitemojiLocale,
  shortcodePreset: VitemojiShortcodePreset,
): EmojiEntry[] {
  const compactEmojis = loadCompactEmojis(locale);
  const shortcodesByHexcode = loadShortcodes(locale, shortcodePreset);

  return compactEmojis.map((emoji) => ({
    emoji: emoji.unicode,
    shortcodes: toShortcodes(shortcodesByHexcode[emoji.hexcode]),
    names: toTokens(emoji.label),
    keywords: toTokens(emoji.tags),
    hexcodes: [emoji.hexcode],
  }));
}

function loadCompactEmojis(locale: VitemojiLocale): CompactEmoji[] {
  return requireDataset<CompactEmoji[]>(`emojibase-data/${locale}/compact.json`);
}

function loadShortcodes(
  locale: VitemojiLocale,
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

function validateShortcodePresetLocales(
  locales: readonly VitemojiLocale[],
  shortcodePreset: VitemojiShortcodePreset,
): void {
  const supportedLocales = getSupportedShortcodePresetLocales(shortcodePreset);
  const unsupportedLocales = locales.filter(
    (locale) => !supportedLocales.includes(locale),
  );

  if (unsupportedLocales.length === 0) {
    return;
  }

  throw new Error(
    `[vitemoji] The "${shortcodePreset}" shortcode preset does not support locales: ${unsupportedLocales.join(", ")}. Supported locales: ${supportedLocales.join(", ")}.`,
  );
}

function getSupportedShortcodePresetLocales(
  shortcodePreset: VitemojiShortcodePreset,
): readonly VitemojiLocale[] {
  const cachedLocales = supportedShortcodeLocalesCache.get(shortcodePreset);

  if (cachedLocales) {
    return cachedLocales;
  }

  const supportedLocales = VITEMOJI_LOCALES.filter((locale) =>
    hasShortcodeDataset(locale, shortcodePreset),
  );

  supportedShortcodeLocalesCache.set(shortcodePreset, supportedLocales);

  return supportedLocales;
}

function hasShortcodeDataset(
  locale: VitemojiLocale,
  shortcodePreset: VitemojiShortcodePreset,
): boolean {
  try {
    require.resolve(`emojibase-data/${locale}/shortcodes/${shortcodePreset}.json`);

    return true;
  } catch {
    return false;
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
