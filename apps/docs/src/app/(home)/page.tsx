import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-1 flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
        Vite plugin
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-fd-foreground sm:text-6xl">
        Rewrite JSX UI text into emoji.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">
        vitemoji is a Vite plugin for JSX and TSX apps. Install it from npm, add
        it to your Vite config, and turn matching UI text like{" "}
        <code>:fire:</code> or <code>hello world</code> into emoji at build
        time.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/docs"
          className="rounded-full bg-fd-foreground px-5 py-3 text-sm font-medium text-fd-background"
        >
          Read the docs
        </Link>
        <Link
          href="https://www.npmjs.com/package/vitemoji"
          className="rounded-full border border-fd-border px-5 py-3 text-sm font-medium text-fd-foreground"
        >
          View on npm
        </Link>
      </div>
    </main>
  );
}
