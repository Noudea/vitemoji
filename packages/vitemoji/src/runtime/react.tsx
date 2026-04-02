import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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
const VitemojiContext = createContext<Emojifier | null>(null);

export interface UseCreateEmojifierResult {
  isReady: boolean;
  error: Error | null;
  emojifyText: Emojifier;
}

export interface VitemojiProviderProps extends PropsWithChildren {
  fallback?: ReactNode;
  options?: EmojifyTextOptions;
}

export function useCreateEmojifier(
  options: EmojifyTextOptions = {},
): UseCreateEmojifierResult {
  const resolvedOptionsKey = JSON.stringify(resolveEmojifyTextOptions(options));
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [emojifyText, setEmojifyText] = useState<Emojifier>(
    () => passthroughEmojifier,
  );

  useEffect(() => {
    let cancelled = false;
    const resolvedOptions = JSON.parse(
      resolvedOptionsKey,
    ) as ResolvedEmojifyTextOptions;

    setIsReady(false);
    setError(null);
    setEmojifyText(() => passthroughEmojifier);

    createEmojifier(resolvedOptions)
      .then((nextEmojifier) => {
        if (cancelled) {
          return;
        }

        setEmojifyText(() => nextEmojifier);
        setIsReady(true);
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
    isReady,
    error,
    emojifyText,
  };
}

export function VitemojiProvider({
  children,
  fallback = null,
  options = {},
}: VitemojiProviderProps) {
  const { isReady, error, emojifyText } = useCreateEmojifier(options);

  if (error) {
    throw error;
  }

  if (!isReady) {
    return <>{fallback}</>;
  }

  return (
    <VitemojiContext.Provider value={emojifyText}>
      {children}
    </VitemojiContext.Provider>
  );
}

export function useEmojifier(): Emojifier {
  const emojifyText = useContext(VitemojiContext);

  if (!emojifyText) {
    throw new Error("useEmojifier must be used within a VitemojiProvider.");
  }

  return emojifyText;
}

export type {
  EmojifyTextOptions,
  VitemojiLocale,
  VitemojiMatchBy,
  VitemojiPreset,
  VitemojiShortcodePreset,
};
