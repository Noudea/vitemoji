import type { EmojiMatchMaps } from "../matcher.js";
import type { VitemojiLocale, VitemojiShortcodePreset } from "../options.js";
import {
  hasShortcodeDataset,
  resolveShortcodePresets,
  validateShortcodePresetLocales,
} from "./emojibase-shortcodes.js";
import {
  GENERATED_LOCALE_LOADERS,
  GENERATED_SHORTCODE_LOADERS,
} from "./generated-manifest.js";

interface GeneratedLocaleMatchMaps {
  names: Record<string, string>;
  keywords: Record<string, string>;
  hexcodes: Record<string, string>;
}

interface GeneratedShortcodeMatchMaps {
  shortcodes: Record<string, string>;
}

const localeMatchMapsCache = new Map<
  string,
  Promise<GeneratedLocaleMatchMaps>
>();
const shortcodeMatchMapsCache = new Map<
  string,
  Promise<GeneratedShortcodeMatchMaps>
>();
const mergedMatchMapsCache = new Map<string, Promise<EmojiMatchMaps>>();

export async function loadGeneratedEmojiMatchMapsAsync(
  locales: readonly VitemojiLocale[],
  shortcodePresets: readonly VitemojiShortcodePreset[],
): Promise<EmojiMatchMaps> {
  const resolvedShortcodePresets = resolveShortcodePresets(shortcodePresets);
  const cacheKey = `${locales.join(",")}:${resolvedShortcodePresets.join(",")}`;
  const cachedMatchMaps = mergedMatchMapsCache.get(cacheKey);

  if (cachedMatchMaps) {
    return cachedMatchMaps;
  }

  const matchMapsPromise = buildGeneratedEmojiMatchMaps(
    locales,
    shortcodePresets,
    resolvedShortcodePresets,
  );

  mergedMatchMapsCache.set(cacheKey, matchMapsPromise);

  try {
    return await matchMapsPromise;
  } catch (error) {
    mergedMatchMapsCache.delete(cacheKey);
    throw error;
  }
}

async function buildGeneratedEmojiMatchMaps(
  locales: readonly VitemojiLocale[],
  shortcodePresets: readonly VitemojiShortcodePreset[],
  resolvedShortcodePresets: readonly VitemojiShortcodePreset[],
): Promise<EmojiMatchMaps> {
  validateShortcodePresetLocales(locales, shortcodePresets);

  const mergedMatchMaps: EmojiMatchMaps = {
    shortcodes: {},
    hexcodes: {},
    names: {},
    keywords: {},
  };

  for (const locale of locales) {
    const localeMatchMaps = await loadLocaleMatchMapsAsync(locale);

    mergeMatchMap(mergedMatchMaps.names, localeMatchMaps.names);
    mergeMatchMap(mergedMatchMaps.keywords, localeMatchMaps.keywords);
    mergeMatchMap(mergedMatchMaps.hexcodes, localeMatchMaps.hexcodes);

    for (const shortcodePreset of resolvedShortcodePresets) {
      if (!hasShortcodeDataset(locale, shortcodePreset)) {
        continue;
      }

      const shortcodeMatchMaps = await loadShortcodeMatchMapsAsync(
        locale,
        shortcodePreset,
      );

      mergeMatchMap(mergedMatchMaps.shortcodes, shortcodeMatchMaps.shortcodes);
    }
  }

  return mergedMatchMaps;
}

async function loadLocaleMatchMapsAsync(
  locale: VitemojiLocale,
): Promise<GeneratedLocaleMatchMaps> {
  const cachedMatchMaps = localeMatchMapsCache.get(locale);

  if (cachedMatchMaps) {
    return cachedMatchMaps;
  }

  const localeLoader = GENERATED_LOCALE_LOADERS[locale] as () => Promise<{
    default: GeneratedLocaleMatchMaps;
  }>;
  const matchMapsPromise = localeLoader().then(
    (module) => module.default as GeneratedLocaleMatchMaps,
  );

  localeMatchMapsCache.set(locale, matchMapsPromise);

  try {
    return await matchMapsPromise;
  } catch (error) {
    localeMatchMapsCache.delete(locale);
    throw error;
  }
}

async function loadShortcodeMatchMapsAsync(
  locale: VitemojiLocale,
  shortcodePreset: VitemojiShortcodePreset,
): Promise<GeneratedShortcodeMatchMaps> {
  const cacheKey = `${locale}:${shortcodePreset}`;
  const cachedMatchMaps = shortcodeMatchMapsCache.get(cacheKey);

  if (cachedMatchMaps) {
    return cachedMatchMaps;
  }

  const shortcodeLoaders = GENERATED_SHORTCODE_LOADERS[locale] as Record<
    string,
    () => Promise<{ default: GeneratedShortcodeMatchMaps }>
  >;
  const shortcodeLoader = shortcodeLoaders[shortcodePreset];
  const matchMapsPromise = shortcodeLoader().then(
    (module: { default: GeneratedShortcodeMatchMaps }) => module.default,
  );

  shortcodeMatchMapsCache.set(cacheKey, matchMapsPromise);

  try {
    return await matchMapsPromise;
  } catch (error) {
    shortcodeMatchMapsCache.delete(cacheKey);
    throw error;
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
