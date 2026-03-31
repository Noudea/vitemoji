import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { vitemoji } from "../packages/vitemoji/src/index.ts";

export default defineConfig({
  plugins: [
    react(),
    vitemoji({
      preset: "chaos",
      locales: [
        "en",
        "fr",
        "zh",
        "ja",
        "ru",
        "sv",
        "zh",
        "bn",
        "da",
        "es",
        "hi",
      ],
      shortcodePresets: ["emojibase", "github", "cldr"],
    }),
  ],
});
