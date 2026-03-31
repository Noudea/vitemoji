export type VitemojiPreset = "safe" | "chaos";

export interface VitemojiMatchBy {
  shortcodes?: boolean;
  names?: boolean;
  keywords?: boolean;
  hexcodes?: boolean;
}

export interface VitemojiOptions {
  include?: RegExp;
  preset?: VitemojiPreset;
  matchBy?: VitemojiMatchBy;
}

export interface ResolvedVitemojiOptions {
  include: RegExp;
  matchBy: Required<VitemojiMatchBy>;
}

const DEFAULT_INCLUDE = /\.[jt]sx$/;

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
    matchBy: {
      ...baseMatchBy,
      ...options.matchBy,
    },
  };
}
