import { useEffect, useState } from "react";

import {
  type EmojifyTextOptions,
  type ResolvedEmojifyTextOptions,
  resolveEmojifyTextOptions,
  type VitemojiLocale,
  type VitemojiMatchBy,
  type VitemojiPreset,
  type VitemojiShortcodePreset,
} from "../options.js";
import { createEmojifier, type Emojifier } from "./create-emojifier.js";

const passthroughEmojifier: Emojifier = (input) => input;

export interface UseEmojifierResult {
  ready: boolean;
  error: Error | null;
  emojifyText: Emojifier;
}

export function useEmojifier(
  options: EmojifyTextOptions = {},
): UseEmojifierResult {
  const resolvedOptionsKey = JSON.stringify(resolveEmojifyTextOptions(options));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [emojifyText, setEmojifyText] = useState<Emojifier>(
    () => passthroughEmojifier,
  );

  useEffect(() => {
    let cancelled = false;
    const resolvedOptions = JSON.parse(
      resolvedOptionsKey,
    ) as ResolvedEmojifyTextOptions;

    setReady(false);
    setError(null);
    setEmojifyText(() => passthroughEmojifier);

    createEmojifier(resolvedOptions)
      .then((nextEmojifier) => {
        if (cancelled) {
          return;
        }

        setEmojifyText(() => nextEmojifier);
        setReady(true);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error("Unknown emojifier error"),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedOptionsKey]);

  return {
    ready,
    error,
    emojifyText,
  };
}

export type {
  EmojifyTextOptions,
  VitemojiLocale,
  VitemojiMatchBy,
  VitemojiPreset,
  VitemojiShortcodePreset,
};
