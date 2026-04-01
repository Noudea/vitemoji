import { loadGeneratedEmojiMatchMaps } from "../data/generated.js";
import { createEmojiMatcher, filterEmojiMatchMaps } from "../matcher.js";
import {
  type EmojifyTextOptions,
  resolveEmojifyTextOptions,
} from "../options.js";

export function emojifyText(
  input: string,
  options: EmojifyTextOptions = {},
): string {
  const { locales, matchBy, shortcodePresets } =
    resolveEmojifyTextOptions(options);
  const emojiMatcher = createEmojiMatcher(
    filterEmojiMatchMaps(
      loadGeneratedEmojiMatchMaps(locales, shortcodePresets),
      matchBy,
    ),
  );

  return emojiMatcher.rewriteText(input);
}
