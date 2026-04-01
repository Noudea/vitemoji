# docs

This app hosts the Fumadocs site for `vitemoji`.

Run it locally with:

```bash
pnpm --filter docs dev
```

Then open `http://localhost:3000/docs`.

## Content

Documentation pages live in `content/docs`.

Current pages cover:

- installing `vitemoji` from npm
- adding the plugin to Vite
- configuring presets, locales, shortcode datasets, and `matchBy`
- examples of shortcode, name, and hexcode rewriting

## App structure

- `src/app/(home)`: landing page
- `src/app/docs`: docs layout and page renderer
- `src/app/api/search/route.ts`: search index API
- `src/lib/source.ts`: Fumadocs source loader
- `src/lib/layout.shared.tsx`: shared nav and repository links
