import { createRequire } from "node:module";

import {
  VITEMOJI_LOCALES,
  type VitemojiLocale,
  type VitemojiShortcodePreset,
} from "../options.js";

const require = createRequire(import.meta.url);

type ResolvedVitemojiShortcodePreset = Exclude<
  VitemojiShortcodePreset,
  "discord" | "slack"
>;

const SHORTCODE_PRESET_ALIASES = {
  discord: "joypixels",
  slack: "iamcal",
} as const satisfies Partial<
  Record<VitemojiShortcodePreset, ResolvedVitemojiShortcodePreset>
>;

const supportedShortcodeLocalesCache = new Map<
  ResolvedVitemojiShortcodePreset,
  readonly VitemojiLocale[]
>();

interface GeneratedManifest {
  locales: VitemojiLocale[];
  shortcodePresetsByLocale: Record<string, string[]>;
}

let generatedManifestCache: GeneratedManifest | null = null;

export function resolveShortcodePresets(
  shortcodePresets: readonly VitemojiShortcodePreset[],
): ResolvedVitemojiShortcodePreset[] {
  const resolvedShortcodePresets: ResolvedVitemojiShortcodePreset[] = [];
  const seenShortcodePresets = new Set<ResolvedVitemojiShortcodePreset>();

  for (const shortcodePreset of shortcodePresets) {
    const resolvedShortcodePreset = resolveShortcodePreset(shortcodePreset);

    if (seenShortcodePresets.has(resolvedShortcodePreset)) {
      continue;
    }

    seenShortcodePresets.add(resolvedShortcodePreset);
    resolvedShortcodePresets.push(resolvedShortcodePreset);
  }

  return resolvedShortcodePresets;
}

export function validateShortcodePresetLocales(
  locales: readonly VitemojiLocale[],
  shortcodePresets: readonly VitemojiShortcodePreset[],
): void {
  const resolvedShortcodePresets = resolveShortcodePresets(shortcodePresets);
  const unsupportedLocales = locales.filter(
    (locale) =>
      !resolvedShortcodePresets.some((shortcodePreset) =>
        hasShortcodeDataset(locale, shortcodePreset),
      ),
  );

  if (unsupportedLocales.length === 0) {
    return;
  }

  const presetSupport = shortcodePresets.map((shortcodePreset) => {
    const supportedLocales = getSupportedShortcodePresetLocales(
      resolveShortcodePreset(shortcodePreset),
    );
    const resolvedShortcodePreset = resolveShortcodePreset(shortcodePreset);

    return shortcodePreset === resolvedShortcodePreset
      ? `- "${shortcodePreset}" supports: ${supportedLocales.join(", ")}.`
      : `- "${shortcodePreset}" (alias of "${resolvedShortcodePreset}") supports: ${supportedLocales.join(", ")}.`;
  });

  throw new Error(
    `[vitemoji] None of the requested shortcode presets support locales: ${unsupportedLocales.join(", ")}.\nRequested locales: ${locales.join(", ")}\nRequested shortcodePresets: ${shortcodePresets.join(", ")}\n${presetSupport.join("\n")}`,
  );
}

export function hasShortcodeDataset(
  locale: VitemojiLocale,
  shortcodePreset: VitemojiShortcodePreset,
): boolean {
  const manifest = getGeneratedManifest();

  return (
    manifest.shortcodePresetsByLocale[locale]?.includes(
      resolveShortcodePreset(shortcodePreset),
    ) ?? false
  );
}

function getSupportedShortcodePresetLocales(
  shortcodePreset: ResolvedVitemojiShortcodePreset,
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

function getGeneratedManifest(): GeneratedManifest {
  if (generatedManifestCache) {
    return generatedManifestCache;
  }

  try {
    generatedManifestCache =
      require("../../generated/manifest.json") as GeneratedManifest;
  } catch (error) {
    throw new Error(
      "[vitemoji] Missing generated emoji manifest. Run `pnpm generate:data` or `pnpm build` from the workspace root first.",
      {
        cause: error,
      },
    );
  }

  return generatedManifestCache;
}

function resolveShortcodePreset(
  shortcodePreset: VitemojiShortcodePreset,
): ResolvedVitemojiShortcodePreset {
  switch (shortcodePreset) {
    case "discord":
      return SHORTCODE_PRESET_ALIASES.discord;
    case "slack":
      return SHORTCODE_PRESET_ALIASES.slack;
    default:
      return shortcodePreset;
  }
}
