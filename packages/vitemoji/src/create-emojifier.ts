import { loadGeneratedEmojiMatchMapsAsync } from "./data/generated-async.js";
import { createEmojiMatcher, filterEmojiMatchMaps } from "./matcher.js";
import {
  type EmojifyTextOptions,
  resolveEmojifyTextOptions,
  type VitemojiLocale,
  type VitemojiShortcodePreset,
} from "./options.js";

export type Emojifier = (input: string) => string;

const emojifierCache = new Map<string, Promise<Emojifier>>();

export async function createEmojifier(
  options: EmojifyTextOptions = {},
): Promise<Emojifier> {
  const { locales, matchBy, shortcodePresets } =
    resolveEmojifyTextOptions(options);
  const cacheKey = JSON.stringify({ locales, matchBy, shortcodePresets });
  const cachedEmojifier = emojifierCache.get(cacheKey);

  if (cachedEmojifier) {
    return cachedEmojifier;
  }

  const emojifierPromise = createGeneratedEmojifier(
    locales,
    matchBy,
    shortcodePresets,
  );

  emojifierCache.set(cacheKey, emojifierPromise);

  try {
    return await emojifierPromise;
  } catch (error) {
    emojifierCache.delete(cacheKey);
    throw error;
  }
}

async function createGeneratedEmojifier(
  locales: readonly VitemojiLocale[],
  matchBy: {
    shortcodes: boolean;
    names: boolean;
    keywords: boolean;
    hexcodes: boolean;
  },
  shortcodePresets: readonly VitemojiShortcodePreset[],
): Promise<Emojifier> {
  const emojiMatchMaps = await loadGeneratedEmojiMatchMapsAsync(
    locales,
    shortcodePresets,
  );
  const emojiMatcher = createEmojiMatcher(
    filterEmojiMatchMaps(emojiMatchMaps, matchBy),
  );

  return (input: string) => emojiMatcher.rewriteText(input);
}
