# vitemoji

`vitemoji` is a Vite plugin plus runtime helpers for turning UI text into emoji.

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
- uses the `cldr` shortcode preset
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

## `emojifyText()`

`vitemoji` also exports a synchronous text utility:

```ts
import { emojifyText } from "vitemoji";

const output = emojifyText(":fire:");
// "🔥"
```

Default `emojifyText()` behavior:

- `locales: ["en"]`
- `shortcodePresets: ["cldr"]`
- shortcode-only matching

Use `emojifyText()` for:

- Node or server-side usage
- simple synchronous string conversion
- tests, scripts, and tooling

If you are in a React app and want runtime locale or shortcode preset loading,
prefer `useEmojifier()` from `vitemoji/react` instead.

Example with broader matching:

```ts
import { emojifyText } from "vitemoji";

const output = emojifyText("hello world", {
  preset: "chaos",
  locales: ["en"],
  shortcodePresets: ["cldr"],
});

// "👋 🌍️"
```

Text utility options:

```ts
import { type EmojifyTextOptions } from "vitemoji";

const options: EmojifyTextOptions = {
  locales: ["en"],
  preset: "safe",
  shortcodePresets: ["cldr"],
  matchBy: {
    shortcodes: true,
    names: false,
    keywords: false,
    hexcodes: false,
  },
};
```

If none of the requested shortcode presets support the requested locales,
`emojifyText()` throws a descriptive error.

## React runtime

For React runtime usage, `vitemoji` exposes:

```ts
import { useEmojifier } from "vitemoji/react";
```

Example:

```tsx
import { useState } from "react";
import { useEmojifier } from "vitemoji/react";

export function EmojiPreview() {
  const [value, setValue] = useState("hello world");
  const { isReady, error, emojifyText } = useEmojifier({
    preset: "chaos",
    locales: ["en", "fr"],
    shortcodePresets: ["cldr", "emojibase"],
  });

  return (
    <>
      <input value={value} onChange={(event) => setValue(event.target.value)} />
      <p>{error ? error.message : emojifyText(value)}</p>
      <small>{isReady ? "Ready" : "Loading emoji data..."}</small>
    </>
  );
}
```

`useEmojifier()` is the recommended browser/runtime API when you want full locale
and shortcode preset control in React.

## Options

```ts
import { vitemoji, type VitemojiOptions } from "vitemoji";

const options: VitemojiOptions = {
  include: /\.[jt]sx$/,
  locales: ["en"],
  preset: "safe",
  shortcodePresets: ["cldr"],
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
