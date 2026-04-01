import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const SHORTCODE_PRESET_NAMES = [
  "cldr",
  "cldr-native",
  "emojibase",
  "emojibase-native",
  "github",
  "iamcal",
  "joypixels",
];

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageDirectory = path.resolve(scriptDirectory, "..");
const generatedManifestSourcePath = path.join(
  packageDirectory,
  "src",
  "data",
  "generated-manifest.ts",
);
const generatedSourceDirectory = path.join(
  packageDirectory,
  "src",
  "generated",
);
const generatedSourceLocalesDirectory = path.join(
  generatedSourceDirectory,
  "locales",
);
const generatedSourceShortcodesDirectory = path.join(
  generatedSourceDirectory,
  "shortcodes",
);
const generatedDirectory = path.join(packageDirectory, "generated");
const generatedLocalesDirectory = path.join(generatedDirectory, "locales");
const generatedShortcodesDirectory = path.join(
  generatedDirectory,
  "shortcodes",
);
const emojibaseCompactPath = require.resolve("emojibase-data/en/compact.json");
const emojibaseDirectory = path.resolve(
  path.dirname(emojibaseCompactPath),
  "..",
);

await fs.rm(generatedDirectory, { force: true, recursive: true });
await fs.rm(generatedSourceDirectory, { force: true, recursive: true });
await fs.mkdir(generatedLocalesDirectory, { recursive: true });
await fs.mkdir(generatedShortcodesDirectory, { recursive: true });
await fs.mkdir(generatedSourceLocalesDirectory, { recursive: true });
await fs.mkdir(generatedSourceShortcodesDirectory, { recursive: true });

const locales = await getLocales();
const shortcodePresetsByLocale = {};

for (const locale of locales) {
  const compactEmojis = await readJson(
    path.join(emojibaseDirectory, locale, "compact.json"),
  );
  const localeMaps = createLocaleMatchMaps(compactEmojis);
  const localeShortcodePresets = await getShortcodePresets(locale);

  await writeJson(
    path.join(generatedLocalesDirectory, `${locale}.json`),
    localeMaps,
  );
  await writeTsModule(
    path.join(generatedSourceLocalesDirectory, `${locale}.ts`),
    localeMaps,
  );

  shortcodePresetsByLocale[locale] = localeShortcodePresets;

  if (localeShortcodePresets.length === 0) {
    continue;
  }

  const emojiByHexcode = new Map(
    compactEmojis.map((emoji) => [emoji.hexcode, emoji.unicode]),
  );
  const localeShortcodesDirectory = path.join(
    generatedShortcodesDirectory,
    locale,
  );
  const localeSourceShortcodesDirectory = path.join(
    generatedSourceShortcodesDirectory,
    locale,
  );

  await fs.mkdir(localeShortcodesDirectory, { recursive: true });
  await fs.mkdir(localeSourceShortcodesDirectory, { recursive: true });

  for (const shortcodePreset of localeShortcodePresets) {
    const presetShortcodes = await readJson(
      path.join(
        emojibaseDirectory,
        locale,
        "shortcodes",
        `${shortcodePreset}.json`,
      ),
    );

    await writeJson(
      path.join(localeShortcodesDirectory, `${shortcodePreset}.json`),
      createShortcodeMatchMap(presetShortcodes, emojiByHexcode),
    );
    await writeTsModule(
      path.join(localeSourceShortcodesDirectory, `${shortcodePreset}.ts`),
      createShortcodeMatchMap(presetShortcodes, emojiByHexcode),
    );
  }
}

await writeJson(path.join(generatedDirectory, "manifest.json"), {
  locales,
  shortcodePresetsByLocale,
});
await writeGeneratedManifestSource(locales, shortcodePresetsByLocale);

async function getLocales() {
  const entries = await fs.readdir(emojibaseDirectory, { withFileTypes: true });
  const locales = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const compactPath = path.join(
      emojibaseDirectory,
      entry.name,
      "compact.json",
    );

    if (await fileExists(compactPath)) {
      locales.push(entry.name);
    }
  }

  return locales.sort();
}

async function getShortcodePresets(locale) {
  const shortcodesDirectory = path.join(
    emojibaseDirectory,
    locale,
    "shortcodes",
  );

  if (!(await fileExists(shortcodesDirectory))) {
    return [];
  }

  const entries = await fs.readdir(shortcodesDirectory, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/u, ""))
    .filter((presetName) => SHORTCODE_PRESET_NAMES.includes(presetName))
    .sort();
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function writeTsModule(filePath, data) {
  const source = `// This file is generated by scripts/generate-emoji-data.mjs. Do not edit manually.\n\nexport default ${JSON.stringify(data, null, 2)} as const;\n`;

  await fs.writeFile(filePath, source, "utf8");
}

async function writeGeneratedManifestSource(locales, shortcodePresetsByLocale) {
  const localeLoaders = locales
    .map(
      (locale) =>
        `  ${JSON.stringify(locale)}: () => import(${JSON.stringify(`../generated/locales/${locale}.js`)}),`,
    )
    .join("\n");

  const shortcodeLoaders = locales
    .map((locale) => {
      const localePresets = shortcodePresetsByLocale[locale] ?? [];

      if (localePresets.length === 0) {
        return `  ${JSON.stringify(locale)}: {},`;
      }

      const presetLoaders = localePresets
        .map(
          (shortcodePreset) =>
            `    ${JSON.stringify(shortcodePreset)}: () => import(${JSON.stringify(`../generated/shortcodes/${locale}/${shortcodePreset}.js`)}),`,
        )
        .join("\n");

      return `  ${JSON.stringify(locale)}: {\n${presetLoaders}\n  },`;
    })
    .join("\n");

  const source = `// This file is generated by scripts/generate-emoji-data.mjs. Do not edit manually.\n\ntype JsonModuleLoader = () => Promise<{ default: unknown }>;\n\nexport const GENERATED_LOCALE_LOADERS: Record<string, JsonModuleLoader> = {\n${localeLoaders}\n};\n\nexport const GENERATED_SHORTCODE_LOADERS: Record<string, Record<string, JsonModuleLoader>> = {\n${shortcodeLoaders}\n};\n`;

  await fs.writeFile(generatedManifestSourcePath, source, "utf8");
}

function createLocaleMatchMaps(compactEmojis) {
  const localeMaps = {
    names: {},
    keywords: {},
    hexcodes: {},
  };

  for (const emoji of compactEmojis) {
    addTokens(localeMaps.names, toTokens(emoji.label), emoji.unicode);
    addTokens(localeMaps.keywords, toTokens(emoji.tags), emoji.unicode);
    addTokens(localeMaps.hexcodes, [emoji.hexcode], emoji.unicode);
  }

  return localeMaps;
}

function createShortcodeMatchMap(presetShortcodes, emojiByHexcode) {
  const shortcodeMap = {
    shortcodes: {},
  };

  for (const [hexcode, shortcodeValue] of Object.entries(presetShortcodes)) {
    const emoji = emojiByHexcode.get(hexcode);

    if (!emoji) {
      continue;
    }

    addTokens(shortcodeMap.shortcodes, toShortcodes(shortcodeValue), emoji);
  }

  return shortcodeMap;
}

function addTokens(textMap, tokens, emoji) {
  for (const token of tokens) {
    const normalizedToken = token.toLowerCase();

    if (!(normalizedToken in textMap)) {
      textMap[normalizedToken] = emoji;
    }
  }
}

function toShortcodes(value) {
  if (value === undefined) {
    return [];
  }

  return toTokens(
    Array.isArray(value) ? value.map((item) => `:${item}:`) : `:${value}:`,
  );
}

function toTokens(value) {
  if (value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return Array.from(new Set(values.filter((item) => item.length > 0)));
}
