import { createRequire } from "node:module";

import type { EmojiMatchMaps } from "../matcher.js";
import type { VitemojiLocale, VitemojiShortcodePreset } from "../options.js";
import {
  hasShortcodeDataset,
  resolveShortcodePresets,
  validateShortcodePresetLocales,
} from "./emojibase-shortcodes.js";

const require = createRequire(import.meta.url);

interface GeneratedLocaleMatchMaps {
  names: Record<string, string>;
  keywords: Record<string, string>;
  hexcodes: Record<string, string>;
}

interface GeneratedShortcodeMatchMaps {
  shortcodes: Record<string, string>;
}

const localeMatchMapsCache = new Map<string, GeneratedLocaleMatchMaps>();
const shortcodeMatchMapsCache = new Map<string, GeneratedShortcodeMatchMaps>();
const mergedMatchMapsCache = new Map<string, EmojiMatchMaps>();

export function loadGeneratedEmojiMatchMaps(
  locales: readonly VitemojiLocale[],
  shortcodePresets: readonly VitemojiShortcodePreset[],
): EmojiMatchMaps {
  const resolvedShortcodePresets = resolveShortcodePresets(shortcodePresets);
  const cacheKey = `${locales.join(",")}:${resolvedShortcodePresets.join(",")}`;
  const cachedMatchMaps = mergedMatchMapsCache.get(cacheKey);

  if (cachedMatchMaps) {
    return cachedMatchMaps;
  }

  validateShortcodePresetLocales(locales, shortcodePresets);

  const mergedMatchMaps: EmojiMatchMaps = {
    shortcodes: {},
    hexcodes: {},
    names: {},
    keywords: {},
  };

  for (const locale of locales) {
    const localeMatchMaps = loadLocaleMatchMaps(locale);

    mergeMatchMap(mergedMatchMaps.names, localeMatchMaps.names);
    mergeMatchMap(mergedMatchMaps.keywords, localeMatchMaps.keywords);
    mergeMatchMap(mergedMatchMaps.hexcodes, localeMatchMaps.hexcodes);

    for (const shortcodePreset of resolvedShortcodePresets) {
      if (!hasShortcodeDataset(locale, shortcodePreset)) {
        continue;
      }

      const shortcodeMatchMaps = loadShortcodeMatchMaps(
        locale,
        shortcodePreset,
      );

      mergeMatchMap(mergedMatchMaps.shortcodes, shortcodeMatchMaps.shortcodes);
    }
  }

  mergedMatchMapsCache.set(cacheKey, mergedMatchMaps);

  return mergedMatchMaps;
}

function loadLocaleMatchMaps(locale: VitemojiLocale): GeneratedLocaleMatchMaps {
  const cachedMatchMaps = localeMatchMapsCache.get(locale);

  if (cachedMatchMaps) {
    return cachedMatchMaps;
  }

  const matchMaps = requireGeneratedFile<GeneratedLocaleMatchMaps>(
    `../../generated/locales/${locale}.json`,
  );

  localeMatchMapsCache.set(locale, matchMaps);

  return matchMaps;
}

function loadShortcodeMatchMaps(
  locale: VitemojiLocale,
  shortcodePreset: VitemojiShortcodePreset,
): GeneratedShortcodeMatchMaps {
  const cacheKey = `${locale}:${shortcodePreset}`;
  const cachedMatchMaps = shortcodeMatchMapsCache.get(cacheKey);

  if (cachedMatchMaps) {
    return cachedMatchMaps;
  }

  const matchMaps = requireGeneratedFile<GeneratedShortcodeMatchMaps>(
    `../../generated/shortcodes/${locale}/${shortcodePreset}.json`,
  );

  shortcodeMatchMapsCache.set(cacheKey, matchMaps);

  return matchMaps;
}

function requireGeneratedFile<T>(relativePath: string): T {
  try {
    return require(relativePath) as T;
  } catch (error) {
    throw new Error(
      `[vitemoji] Missing generated emoji data at ${relativePath}. Run \`pnpm generate:data\` or \`pnpm build\` from the workspace root first.`,
      {
        cause: error,
      },
    );
  }
}

function mergeMatchMap(
  target: Record<string, string>,
  source: Record<string, string>,
): void {
  for (const [token, emoji] of Object.entries(source)) {
    if (!(token in target)) {
      target[token] = emoji;
    }
  }
}
