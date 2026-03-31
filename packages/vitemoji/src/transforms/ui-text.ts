import generateModule from "@babel/generator";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

import type { EmojiMatcher } from "../matcher.js";

export interface UiTextTransformResult {
  code: string;
  changed: boolean;
}

const generate = ((generateModule as { default?: typeof generateModule })
  .default ?? generateModule) as typeof import("@babel/generator").default;

const traverse = ((traverseModule as { default?: typeof traverseModule })
  .default ?? traverseModule) as typeof import("@babel/traverse").default;

export function transformUiText(
  code: string,
  emojiMatcher: EmojiMatcher,
): UiTextTransformResult {
  if (emojiMatcher.isEmpty) {
    return {
      code,
      changed: false,
    };
  }

  let changed = false;
  let ast: ReturnType<typeof parse>;

  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return {
      code,
      changed: false,
    };
  }

  traverse(ast, {
    JSXText(path) {
      const nextValue = emojiMatcher.rewriteText(path.node.value);

      if (nextValue !== path.node.value) {
        path.node.value = nextValue;
        changed = true;
      }
    },

    JSXExpressionContainer(path) {
      if (path.parent.type !== "JSXElement" && path.parent.type !== "JSXFragment") {
        return;
      }

      const { expression } = path.node;

      if (expression.type === "StringLiteral") {
        const nextValue = emojiMatcher.rewriteText(expression.value);

        if (nextValue !== expression.value) {
          expression.value = nextValue;
          changed = true;
        }

        return;
      }

      if (expression.type !== "TemplateLiteral") {
        return;
      }

      for (const quasi of expression.quasis) {
        const cookedValue = quasi.value.cooked;

        if (cookedValue == null) {
          continue;
        }

        const nextValue = emojiMatcher.rewriteText(cookedValue);

        if (nextValue !== cookedValue) {
          quasi.value.cooked = nextValue;
          quasi.value.raw = escapeTemplateRaw(nextValue);
          changed = true;
        }
      }
    },
  });

  if (!changed) {
    return {
      code,
      changed: false,
    };
  }

  return {
    code: generate(ast, { jsescOption: { minimal: true } }, code).code,
    changed: true,
  };
}

function escapeTemplateRaw(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
