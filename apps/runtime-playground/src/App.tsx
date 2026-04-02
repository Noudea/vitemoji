import { useState } from "react";

import {
  type EmojifyTextOptions,
  useCreateEmojifier,
  useEmojifier,
  VitemojiProvider,
} from "../../../packages/vitemoji/src/runtime/react.tsx";

const runtimeOptions: EmojifyTextOptions = {
  preset: "chaos",
  locales: ["en", "fr", "zh", "ja"],
  shortcodePresets: ["cldr", "emojibase"],
};

export default function App() {
  const [input, setInput] = useState("hello world");

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

      <VitemojiProvider
        fallback={
          <section className="panel">
            <h2>useEmojifier() with provider</h2>
            <p className="meta">Loading generated chunks...</p>
            <p className="preview">{input}</p>
          </section>
        }
        options={runtimeOptions}
      >
        <RuntimePreview input={input} />
      </VitemojiProvider>

      <RuntimeCreatePreview input={input} />
    </main>
  );
}

function RuntimePreview({ input }: { input: string }) {
  const emojifyText = useEmojifier();

  return (
    <section className="panel">
      <h2>useEmojifier() with provider</h2>
      <p className="meta">Ready</p>
      <p className="preview">{emojifyText(input)}</p>
    </section>
  );
}

function RuntimeCreatePreview({ input }: { input: string }) {
  const { isReady, error, emojifyText } = useCreateEmojifier(runtimeOptions);

  return (
    <section className="panel">
      <h2>useCreateEmojifier()</h2>
      <p className="meta">
        {isReady ? "Ready" : "Loading generated chunks..."}
      </p>
      <p className="preview">{error ? error.message : emojifyText(input)}</p>
    </section>
  );
}
