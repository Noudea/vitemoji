export type VitemojiPreset = "safe" | "chaos";
export type VitemojiShortcodePreset = "github" | "emojibase" | "cldr";

export interface VitemojiMatchBy {
  shortcodes?: boolean;
  names?: boolean;
  keywords?: boolean;
  hexcodes?: boolean;
}

export interface VitemojiOptions {
  include?: RegExp;
  locale?: string;
  preset?: VitemojiPreset;
  shortcodePreset?: VitemojiShortcodePreset;
  matchBy?: VitemojiMatchBy;
}

export interface ResolvedVitemojiOptions {
  include: RegExp;
  locale: string;
  matchBy: Required<VitemojiMatchBy>;
  shortcodePreset: VitemojiShortcodePreset;
}

const DEFAULT_INCLUDE = /\.[jt]sx$/;
const DEFAULT_LOCALE = "en";
const DEFAULT_SHORTCODE_PRESET: VitemojiShortcodePreset = "github";

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

export function resolveVitemojiOptions(
  options: VitemojiOptions = {},
): ResolvedVitemojiOptions {
  const baseMatchBy = options.preset
    ? PRESET_MATCH_BY[options.preset]
    : DEFAULT_MATCH_BY;

  return {
    include: options.include ?? DEFAULT_INCLUDE,
    locale: options.locale ?? DEFAULT_LOCALE,
    matchBy: {
      ...baseMatchBy,
      ...options.matchBy,
    },
    shortcodePreset: options.shortcodePreset ?? DEFAULT_SHORTCODE_PRESET,
  };
}
