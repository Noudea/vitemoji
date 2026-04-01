# vitemoji

`vitemoji` is a Vite plugin that rewrites JSX UI text into emoji.

It parses `.jsx` and `.tsx` modules, finds text rendered in JSX, and replaces
matching values using `emojibase-data`.

## Install

```bash
pnpm add vitemoji
```

## Vite Setup

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { vitemoji } from "vitemoji";

export default defineConfig({
  plugins: [
    react(),
    vitemoji(),
  ],
});
```

## Default Behavior

By default, `vitemoji`:

- transforms `.jsx` and `.tsx` files
- skips `node_modules`
- loads the `en` locale
- uses the `github` shortcode preset
- matches shortcodes only

That means this:

```tsx
export function App() {
  return <p>:fire:</p>;
}
```

becomes this:

```tsx
export function App() {
  return <p>🔥</p>;
}
```

## Supported Transform Targets

The plugin rewrites:

- JSX text: `<h1>hello world</h1>`
- string literals rendered in JSX: `<p>{"hello world"}</p>`
- template literal text rendered in JSX: `<p>{\`smile ${name}\`}</p>`

The plugin does not rewrite plain strings outside JSX.

## Options

```ts
import { vitemoji, type VitemojiOptions } from "vitemoji";

const options: VitemojiOptions = {
  include: /\.[jt]sx$/,
  locales: ["en"],
  preset: "safe",
  shortcodePresets: ["github"],
  matchBy: {
    shortcodes: true,
    names: false,
    keywords: false,
    hexcodes: false,
  },
};
```

### `preset`

- `safe`: shortcodes only
- `chaos`: shortcodes, names, keywords, and hexcodes

### `matchBy`

Fine-grained override for match categories:

- `shortcodes`
- `names`
- `keywords`
- `hexcodes`

If both `preset` and `matchBy` are provided, `matchBy` wins.

### `locales`

Supported locale values:

```ts
[
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
]
```

### `shortcodePresets`

Supported values:

- `cldr`
- `cldr-native`
- `discord`
- `emojibase`
- `emojibase-native`
- `github`
- `iamcal`
- `joypixels`
- `slack`

Aliases:

- `discord` uses the `joypixels` dataset
- `slack` uses the `iamcal` dataset

## Example Configuration

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { vitemoji } from "vitemoji";

export default defineConfig({
  plugins: [
    react(),
    vitemoji({
      preset: "chaos",
      locales: ["en", "fr", "ja"],
      shortcodePresets: ["github", "cldr", "joypixels"],
      matchBy: {
        shortcodes: true,
        names: true,
        keywords: true,
        hexcodes: false,
      },
    }),
  ],
});
```

## Matching Rules

- matching is case-insensitive
- boundary-aware matching prevents partial name hits like `wildfire`
- the longest phrase wins within a category
- category priority is shortcodes, hexcodes, names, then keywords
