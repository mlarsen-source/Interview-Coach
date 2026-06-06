"use client";

import { useEffect, useState } from "react";

import { Scorecard } from "@/app/scorecard/components/Scorecard/Scorecard";
import type {
  ReviewContextPayload,
  SessionFeedbackResponse,
  SessionReviewResult,
} from "@/lib/interview-coach/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ScorecardPanelProps = {
  /**
   * Pre-resolved result (e.g. static mock or the /dev/flow simulator).
   * When provided, the panel renders it directly and does not fetch.
   */
  result?: SessionReviewResult | null;
  /**
   * Recorded session context. When provided (and `result` is not), the panel
   * fetches POST /feedback/generate itself and owns the resulting state.
   */
  sessionInput?: ReviewContextPayload | null;
  loadingTranscriptScores?: boolean;
  loadingFeedback?: boolean;
  showShellBadge?: boolean;
};

async function fetchFeedback(
  context: ReviewContextPayload,
  signal: AbortSignal
): Promise<SessionFeedbackResponse> {
  const res = await fetch(`${API_BASE}/feedback/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
    signal,
  });
  if (!res.ok) throw new Error(`Feedback request failed (${res.status})`);
  return (await res.json()) as SessionFeedbackResponse;
}

/**
 * Scorecard container. Two modes:
 *  - `result`: render a pre-resolved SessionReviewResult (mocks, dev flow).
 *  - `sessionInput`: fetch POST /feedback/generate and own loading/error state.
 */
export function ScorecardPanel({
  result = null,
  sessionInput = null,
  loadingTranscriptScores = false,
  loadingFeedback = false,
  showShellBadge = false,
}: ScorecardPanelProps) {
  const [fetched, setFetched] = useState<SessionFeedbackResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldFetch = !result && !!sessionInput;

  useEffect(() => {
    if (!shouldFetch || !sessionInput) return;
    const controller = new AbortController();

    const run = async () => {
      setFetching(true);
      setError(null);
      setFetched(null);
      try {
        const data = await fetchFeedback(sessionInput, controller.signal);
        if (!controller.signal.aborted) setFetched(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not generate feedback.");
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [shouldFetch, sessionInput]);

  // Resolve what to render: explicit result, or the fetched session.
  const context = result?.context ?? sessionInput ?? null;
  const transcriptScores = result?.transcriptScores ?? fetched?.transcriptScores ?? null;
  const feedback = result?.feedback ?? fetched?.feedback ?? null;
  const modelAnswer = result?.modelAnswer ?? fetched?.modelAnswer ?? null;

  const isLoadingFeedback = loadingFeedback || (shouldFetch && fetching);

  return (
    <>
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      <Scorecard
        question={context?.question ?? null}
        transcript={context?.transcript ?? null}
        transcriptScores={transcriptScores}
        feedback={feedback}
        modelAnswer={modelAnswer}
        loadingTranscriptScores={loadingTranscriptScores || (shouldFetch && fetching)}
        loadingFeedback={isLoadingFeedback}
        showShellBadge={showShellBadge}
      />
    </>
  );
}
