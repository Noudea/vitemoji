export type VitemojiPreset = "safe" | "chaos";
export type VitemojiShortcodePreset =
  | "cldr"
  | "cldr-native"
  | "discord"
  | "emojibase"
  | "emojibase-native"
  | "github"
  | "iamcal"
  | "joypixels"
  | "slack";
export const VITEMOJI_LOCALES = [
  "bn",
  "da",
  "de",
  "en",
  "en-gb",
  "es",
  "es-mx",
  "et",
  "fi",
  "fr",
  "hi",
  "hu",
  "it",
  "ja",
  "ko",
  "lt",
  "ms",
  "nb",
  "nl",
  "pl",
  "pt",
  "ru",
  "sv",
  "th",
  "uk",
  "vi",
  "zh",
  "zh-hant",
] as const;

export type VitemojiLocale = (typeof VITEMOJI_LOCALES)[number];

export interface VitemojiMatchBy {
  shortcodes?: boolean;
  names?: boolean;
  keywords?: boolean;
  hexcodes?: boolean;
}

export interface EmojifyTextOptions {
  locales?: VitemojiLocale[];
  preset?: VitemojiPreset;
  shortcodePresets?: VitemojiShortcodePreset[];
  matchBy?: VitemojiMatchBy;
}

export interface VitemojiOptions extends EmojifyTextOptions {
  include?: RegExp;
}

export interface ResolvedEmojifyTextOptions {
  locales: VitemojiLocale[];
  matchBy: Required<VitemojiMatchBy>;
  shortcodePresets: VitemojiShortcodePreset[];
}

export interface ResolvedVitemojiOptions extends ResolvedEmojifyTextOptions {
  include: RegExp;
}

const DEFAULT_INCLUDE = /\.[jt]sx$/;
const DEFAULT_LOCALES: VitemojiLocale[] = ["en"];
const DEFAULT_SHORTCODE_PRESETS: VitemojiShortcodePreset[] = ["cldr"];

const DEFAULT_MATCH_BY: Required<VitemojiMatchBy> = {
  shortcodes: true,
  names: false,
  keywords: false,
  hexcodes: false,
};

const PRESET_MATCH_BY: Record<VitemojiPreset, Required<VitemojiMatchBy>> = {
  safe: {
    shortcodes: true,
    names: false,
    keywords: false,
    hexcodes: false,
  },
  chaos: {
    shortcodes: true,
    names: true,
    keywords: true,
    hexcodes: true,
  },
};

export function resolveEmojifyTextOptions(
  options: EmojifyTextOptions = {},
): ResolvedEmojifyTextOptions {
  const baseMatchBy = options.preset
    ? PRESET_MATCH_BY[options.preset]
    : DEFAULT_MATCH_BY;

  return {
    locales: resolveLocales(options),
    matchBy: {
      ...baseMatchBy,
      ...options.matchBy,
    },
    shortcodePresets: resolveShortcodePresets(options),
  };
}

export function resolveVitemojiOptions(
  options: VitemojiOptions = {},
): ResolvedVitemojiOptions {
  return {
    include: options.include ?? DEFAULT_INCLUDE,
    ...resolveEmojifyTextOptions(options),
  };
}

function resolveLocales(options: EmojifyTextOptions): VitemojiLocale[] {
  const locales = options.locales ?? DEFAULT_LOCALES;
  const normalizedLocales = Array.from(new Set(locales));

  return normalizedLocales.length > 0 ? normalizedLocales : DEFAULT_LOCALES;
}

function resolveShortcodePresets(
  options: EmojifyTextOptions,
): VitemojiShortcodePreset[] {
  const shortcodePresets =
    options.shortcodePresets ?? DEFAULT_SHORTCODE_PRESETS;
  const normalizedShortcodePresets = Array.from(new Set(shortcodePresets));

  return normalizedShortcodePresets.length > 0
    ? normalizedShortcodePresets
    : DEFAULT_SHORTCODE_PRESETS;
}
