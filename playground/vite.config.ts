import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { vitemoji } from "../packages/vitemoji/src/index.ts";

export default defineConfig({
  plugins: [react(), vitemoji()],
});
