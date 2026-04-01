# vitemoji

`vitemoji` is a Vite plugin that rewrites JSX UI text into emoji at build time.

It is designed for React-style JSX and TSX files. The plugin parses your source,
finds text rendered in JSX, and replaces matching tokens with emoji using
`emojibase-data`.

## Install

```bash
pnpm add vitemoji
```

## Usage

Add the plugin to your Vite config:

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

With the default config, shortcode matches such as `:fire:` are rewritten in
`.jsx` and `.tsx` files.

```tsx
export function App() {
  return (
    <main>
      <p>:fire:</p>
    </main>
  );
}
```

becomes:

```tsx
export function App() {
  return (
    <main>
      <p>🔥</p>
    </main>
  );
}
```

## What It Rewrites

`vitemoji` rewrites:

- JSX text nodes like `<h1>hello world</h1>`
- string literals rendered inside JSX like `<p>{"hello world"}</p>`
- template literal text rendered inside JSX like `<p>{\`smile ${name}\`}</p>`

It does not rewrite:

- files in `node_modules`
- files outside the `include` pattern
- plain string literals outside JSX
- code that fails to parse as TypeScript/JSX

## Matching Modes

The plugin can match emoji by:

- shortcodes like `:fire:`
- names like `fire`
- keywords like `hot`
- Unicode hexcodes like `1F525`

By default, only shortcodes are enabled.

## Presets

There are two presets:

- `safe`: shortcodes only
- `chaos`: shortcodes, names, keywords, and hexcodes

Example:

```ts
vitemoji({
  preset: "chaos",
});
```

With `preset: "chaos"`, JSX like this:

```tsx
export function App() {
  return <h1>hello world fire</h1>;
}
```

can be rewritten using emoji names and keywords, depending on the selected
locale data.

## Options

```ts
type VitemojiOptions = {
  include?: RegExp;
  locales?: VitemojiLocale[];
  preset?: "safe" | "chaos";
  shortcodePresets?: (
    | "cldr"
    | "cldr-native"
    | "discord"
    | "emojibase"
    | "emojibase-native"
    | "github"
    | "iamcal"
    | "joypixels"
    | "slack"
  )[];
  matchBy?: {
    shortcodes?: boolean;
    names?: boolean;
    keywords?: boolean;
    hexcodes?: boolean;
  };
};
```

### `include`

Controls which files are transformed.

Default:

```ts
/\.[jt]sx$/
```

Example:

```ts
vitemoji({
  include: /src\/.*\.[jt]sx$/,
});
```

### `locales`

Chooses which Emojibase locale datasets are loaded.

Default:

```ts
["en"]
```

Supported locales:

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

Example:

```ts
vitemoji({
  preset: "chaos",
  locales: ["en", "fr", "ja"],
});
```

### `shortcodePresets`

Chooses which shortcode sets are loaded.

Default:

```ts
["github"]
```

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

Notes:

- `discord` is resolved to the `joypixels` shortcode dataset
- `slack` is resolved to the `iamcal` shortcode dataset
- if none of the requested shortcode presets support one of your locales, the
  plugin throws an error during setup

Example:

```ts
vitemoji({
  shortcodePresets: ["github", "cldr", "joypixels"],
});
```

### `matchBy`

Overrides the enabled match categories directly.

Example:

```ts
vitemoji({
  matchBy: {
    shortcodes: true,
    names: true,
    keywords: false,
    hexcodes: false,
  },
});
```

When `preset` and `matchBy` are both set, `matchBy` overrides the preset.

## Behavior Notes

- Matching is case-insensitive.
- Name and keyword matches respect token boundaries, so `fire` can match but
  `wildfire` will not.
- The matcher prefers the longest phrase in a category, so `heart on fire`
  wins over `fire`.
- Matching priority is: shortcodes, hexcodes, names, then keywords.

## Full Example

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
      include: /\.[jt]sx$/,
    }),
  ],
});
```

## Workspace

- `packages/vitemoji`: the plugin package
- `apps/playground`: a local React + Vite app for testing the transform

For package-specific docs, see
[`packages/vitemoji/README.md`](./packages/vitemoji/README.md).
