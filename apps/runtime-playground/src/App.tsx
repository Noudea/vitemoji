import { useEffect, useState } from "react";

import {
  createEmojifier,
  type EmojifyTextOptions,
} from "../../../packages/vitemoji/src/browser.ts";

const runtimeOptions: EmojifyTextOptions = {
  preset: "chaos",
  locales: ["en", "fr", "zh", "ja"],
  shortcodePresets: ["cldr", "emojibase"],
};

export default function App() {
  const [input, setInput] = useState("hello world");
  const [ready, setReady] = useState(false);
  const [output, setOutput] = useState(input);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setReady(false);
    setError(null);

    createEmojifier(runtimeOptions)
      .then((emojify) => {
        if (cancelled) {
          return;
        }

        setOutput(emojify(input));
        setReady(true);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unknown emojifier error",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [input]);

  return (
    <main className="app-shell">
      <h1>Runtime vitemoji</h1>
      <label className="field">
        <span>Try text</span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Try hello world, feu, 火焰, :fire:, 1F525"
        />
      </label>

      <section className="panel">
        <h2>createEmojifier()</h2>
        <p className="meta">
          {ready ? "Ready" : "Loading generated chunks..."}
        </p>
        <p className="preview">{error ? error : output}</p>
      </section>
    </main>
  );
}
