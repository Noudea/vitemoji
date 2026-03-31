import generateModule from "@babel/generator";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

export interface TextTransformResult {
  code: string;
  changed: boolean;
}

const generate = ((generateModule as { default?: typeof generateModule })
  .default ?? generateModule) as typeof import("@babel/generator").default;

const traverse = ((traverseModule as { default?: typeof traverseModule })
  .default ?? traverseModule) as typeof import("@babel/traverse").default;

const TOKEN_CHAR_PATTERN = /[\p{L}\p{N}]/u;
const TOKEN_CHAR_CLASS = String.raw`[\p{L}\p{N}]`;

export function transformUiText(
  code: string,
  textMap: Record<string, string>,
): TextTransformResult {
  const matchPattern = createMatchPattern(textMap);

  if (matchPattern === null) {
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
      const nextValue = rewriteText(path.node.value, textMap, matchPattern);

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
        const nextValue = rewriteText(expression.value, textMap, matchPattern);

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

        const nextValue = rewriteText(cookedValue, textMap, matchPattern);

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

function createMatchPattern(textMap: Record<string, string>): RegExp | null {
  const keys = Object.keys(textMap);

  if (keys.length === 0) {
    return null;
  }

  return new RegExp(
    keys
      .sort((left, right) => right.length - left.length)
      .map((key) => toPatternSource(key))
      .join("|"),
    "giu",
  );
}

function rewriteText(
  value: string,
  textMap: Record<string, string>,
  matchPattern: RegExp,
): string {
  return value.replace(
    matchPattern,
    (word) => textMap[word.toLowerCase()] ?? word,
  );
}

function toPatternSource(value: string): string {
  const escapedValue = escapeRegExp(value);
  const startsWithToken = hasTokenChar(value.at(0));
  const endsWithToken = hasTokenChar(value.at(-1));

  return `${startsWithToken ? `(?<!${TOKEN_CHAR_CLASS})` : ""}${escapedValue}${endsWithToken ? `(?!${TOKEN_CHAR_CLASS})` : ""}`;
}

function hasTokenChar(value: string | undefined): boolean {
  return value !== undefined && TOKEN_CHAR_PATTERN.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
