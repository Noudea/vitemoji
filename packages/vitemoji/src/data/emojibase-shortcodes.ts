import { createRequire } from "node:module";

import {
  VITEMOJI_LOCALES,
  type VitemojiLocale,
  type VitemojiShortcodePreset,
} from "../options.js";

const require = createRequire(import.meta.url);

const supportedShortcodeLocalesCache = new Map<
  VitemojiShortcodePreset,
  readonly VitemojiLocale[]
>();

export function validateShortcodePresetLocales(
  locales: readonly VitemojiLocale[],
  shortcodePresets: readonly VitemojiShortcodePreset[],
): void {
  const unsupportedLocales = locales.filter(
    (locale) =>
      !shortcodePresets.some((shortcodePreset) =>
        hasShortcodeDataset(locale, shortcodePreset),
      ),
  );

  if (unsupportedLocales.length === 0) {
    return;
  }

  const presetSupport = shortcodePresets.map((shortcodePreset) => {
    const supportedLocales =
      getSupportedShortcodePresetLocales(shortcodePreset);

    return `- "${shortcodePreset}" supports: ${supportedLocales.join(", ")}.`;
  });

  throw new Error(
    `[vitemoji] None of the requested shortcode presets support locales: ${unsupportedLocales.join(", ")}.\nRequested locales: ${locales.join(", ")}\nRequested shortcodePresets: ${shortcodePresets.join(", ")}\n${presetSupport.join("\n")}`,
  );
}

export function hasShortcodeDataset(
  locale: VitemojiLocale,
  shortcodePreset: VitemojiShortcodePreset,
): boolean {
  try {
    require.resolve(
      `emojibase-data/${locale}/shortcodes/${shortcodePreset}.json`,
    );

    return true;
  } catch {
    return false;
  }
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
