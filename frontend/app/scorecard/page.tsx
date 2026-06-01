import Link from "next/link";

import { ScorecardPanel } from "@/app/scorecard/ScorecardPanel";
import { mockSessionReview } from "@/lib/interview-coach/mocks";

export default function ScorecardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex max-w-3xl flex-col gap-2">
        <Link href="/" className="text-sm opacity-60 hover:opacity-100">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold">Scorecard shell</h1>
        <p className="text-sm opacity-70">
          Static mock data. Use{" "}
          <Link href="/dev/flow" className="underline">
            /dev/flow
          </Link>{" "}
          to step through the pipeline and watch payloads update.
        </p>
      </header>
      <ScorecardPanel result={mockSessionReview} />
    </div>
  );
}
