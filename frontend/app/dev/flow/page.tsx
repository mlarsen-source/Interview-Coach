import Link from "next/link";

import { FlowDevClient } from "@/app/dev/flow/FlowDevClient";

export default function FlowDevPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex max-w-3xl flex-col gap-2">
        <Link href="/" className="text-sm opacity-60 hover:opacity-100">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold">Pipeline flow (dev)</h1>
        <p className="text-sm leading-relaxed opacity-70">
          Step through mocked pipeline stages. Each card shows input/output JSON as
          data would move between browser, Whisper, emotion model, transcript
          classifier, aggregator, LLM, and scorecard UI.
        </p>
      </header>
      <FlowDevClient />
    </div>
  );
}
