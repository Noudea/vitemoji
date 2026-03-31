import generateModule from "@babel/generator";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

export interface TextTransformResult {
  code: string;
  changed: boolean;
}

export const DEFAULT_TEXT_MAP: Record<string, string> = {
  fire: "🔥",
  hello: "👋",
  world: "🌍",
  smile: "😀",
};

const generate = ((generateModule as { default?: typeof generateModule })
  .default ?? generateModule) as typeof import("@babel/generator").default;

const traverse = ((traverseModule as { default?: typeof traverseModule })
  .default ?? traverseModule) as typeof import("@babel/traverse").default;

const WORD_PATTERN = /[A-Za-z][A-Za-z'-]*/g;

export function transformUiText(
  code: string,
  textMap: Record<string, string>,
): TextTransformResult {
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
      const nextValue = rewriteText(path.node.value, textMap);

      if (nextValue !== path.node.value) {
        path.node.value = nextValue;
        changed = true;
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

function rewriteText(value: string, textMap: Record<string, string>): string {
  return value.replace(
    WORD_PATTERN,
    (word) => textMap[word.toLowerCase()] ?? word,
  );
}
