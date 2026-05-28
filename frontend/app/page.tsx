import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <header className="flex max-w-lg flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-50">
          Interview Coach
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Practice answers. Get structured feedback.
        </h1>
        <p className="text-sm leading-relaxed opacity-70">
          Frontend shells for the scorecard and pipeline are ready for integration. Use the dev flow
          page to watch mock data move through each stage.
        </p>
      </header>
      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dev/flow"
          className="rounded-lg bg-foreground px-5 py-2.5 text-center text-sm font-semibold text-background"
        >
          Pipeline dev diagram
        </Link>
        <Link
          href="/scorecard"
          className="rounded-lg border border-foreground/20 px-5 py-2.5 text-center text-sm font-semibold"
        >
          Scorecard preview
        </Link>
      </nav>
    </div>
  );
}
