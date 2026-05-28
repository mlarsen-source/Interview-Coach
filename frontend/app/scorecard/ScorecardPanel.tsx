"use client";

import { Scorecard } from "@/app/scorecard/components/Scorecard/Scorecard";
import type { SessionReviewResult } from "@/lib/interview-coach/types";

export type ScorecardPanelProps = {
  result?: SessionReviewResult | null;
  loadingDelivery?: boolean;
  loadingTranscriptScores?: boolean;
  loadingFeedback?: boolean;
};

/**
 * Container shell: will own fetch + session state later.
 * For now passes through partial or full SessionReviewResult.
 */
export function ScorecardPanel({
  result = null,
  loadingDelivery = false,
  loadingTranscriptScores = false,
  loadingFeedback = false,
}: ScorecardPanelProps) {
  const context = result?.context;

  return (
    <Scorecard
      question={context?.question ?? null}
      transcript={context?.transcript ?? null}
      deliveryScores={context?.deliveryScores ?? null}
      transcriptScores={context?.transcriptScores ?? null}
      feedback={result?.feedback ?? null}
      modelAnswer={result?.modelAnswer ?? null}
      loadingDelivery={loadingDelivery}
      loadingTranscriptScores={loadingTranscriptScores}
      loadingFeedback={loadingFeedback}
    />
  );
}
