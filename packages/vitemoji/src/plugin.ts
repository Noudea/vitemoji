import type { Plugin } from "vite";

import { DEFAULT_TEXT_MAP, transformUiText } from "./transforms/text.js";

export interface VitemojiOptions {
  include?: RegExp;
  textMap?: Record<string, string>;
}

const DEFAULT_INCLUDE = /\.[jt]sx$/;

export function vitemoji(options: VitemojiOptions = {}): Plugin {
  const include = options.include ?? DEFAULT_INCLUDE;
  const textMap = {
    ...DEFAULT_TEXT_MAP,
    ...options.textMap,
  };

  return {
    name: "vitemoji",
    enforce: "pre",
    transform(code: string, id: string) {
      const cleanId = id.split("?", 1)[0] ?? id;

      if (cleanId.includes("/node_modules/") || !include.test(cleanId)) {
        return null;
      }

      const result = transformUiText(code, textMap);

      if (!result.changed) {
        return null;
      }

      return {
        code: result.code,
        map: null,
      };
    },
  };
}
