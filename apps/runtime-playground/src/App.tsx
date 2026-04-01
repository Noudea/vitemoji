import { useState } from "react";

import {
  type EmojifyTextOptions,
  useEmojifier,
} from "../../../packages/vitemoji/src/runtime/react.ts";

const runtimeOptions: EmojifyTextOptions = {
  preset: "chaos",
  locales: ["en", "fr", "zh", "ja"],
  shortcodePresets: ["cldr", "emojibase"],
};

export default function App() {
  const [input, setInput] = useState("hello world");
  const { isReady, error, emojifyText } = useEmojifier(runtimeOptions);

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
        <h2>useEmojifier()</h2>
        <p className="meta">
          {isReady ? "Ready" : "Loading generated chunks..."}
        </p>
        <p className="preview">{error ? error.message : emojifyText(input)}</p>
      </section>
    </main>
  );
}
