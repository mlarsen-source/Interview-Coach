"use client";

import { useCallback, useMemo, useState } from "react";

import { ScorecardPanel } from "@/app/scorecard/ScorecardPanel";
import { FlowStageCard } from "@/app/dev/flow/components/FlowStageCard/FlowStageCard";
import { aggregateReviewPayload } from "@/lib/interview-coach/aggregateReviewPayload";
import {
  mockDeliveryScores,
  mockModelAnswer,
  mockQualitativeFeedback,
  mockQuestion,
  mockTranscript,
  mockTranscriptScores,
} from "@/lib/interview-coach/mocks";
import { INITIAL_PIPELINE_STAGES } from "@/lib/interview-coach/pipelineStages";
import type { PipelineStage, SessionReviewResult } from "@/lib/interview-coach/types";

import styles from "./FlowDevClient.module.css";

const MOCK_RECORDING = {
  questionId: mockQuestion.id,
  audioMimeType: "audio/webm",
  durationSeconds: 15.1,
  blobRef: "mock-audio-blob",
};

function cloneStages(): PipelineStage[] {
  return INITIAL_PIPELINE_STAGES.map((s) => ({ ...s }));
}

export function FlowDevClient() {
  const [stages, setStages] = useState<PipelineStage[]>(cloneStages);
  const [stepIndex, setStepIndex] = useState(-1);
  const [sessionResult, setSessionResult] = useState<SessionReviewResult | null>(null);

  const canAdvance = stepIndex < stages.length - 1;
  const isComplete = stepIndex >= stages.length - 1;

  const advance = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= stages.length) return;

    setStages((prev) => {
      const next = prev.map((s) => ({ ...s }));
      const stage = next[nextIndex];
      if (!stage) return prev;

      stage.status = "done";

      switch (stage.id) {
        case "record":
          stage.input = { note: "User action in browser" };
          stage.output = MOCK_RECORDING;
          break;
        case "transcribe":
          stage.input = { audio: MOCK_RECORDING };
          stage.output = mockTranscript;
          break;
        case "audioScores":
          stage.input = { audio: MOCK_RECORDING };
          stage.output = mockDeliveryScores;
          break;
        case "transcriptScores":
          stage.input = { transcript: mockTranscript };
          stage.output = mockTranscriptScores;
          break;
        case "aggregate": {
          const payload = aggregateReviewPayload({
            question: mockQuestion,
            transcript: mockTranscript,
            deliveryScores: mockDeliveryScores,
            transcriptScores: mockTranscriptScores,
          });
          stage.input = {
            question: mockQuestion,
            transcript: mockTranscript,
            deliveryScores: mockDeliveryScores,
            transcriptScores: mockTranscriptScores,
          };
          stage.output = payload;
          break;
        }
        case "llmFeedback": {
          const payload = aggregateReviewPayload({
            question: mockQuestion,
            transcript: mockTranscript,
            deliveryScores: mockDeliveryScores,
            transcriptScores: mockTranscriptScores,
          });
          stage.input = payload;
          stage.output = {
            feedback: mockQualitativeFeedback,
            modelAnswer: mockModelAnswer,
          };
          break;
        }
        case "scorecard": {
          const context = aggregateReviewPayload({
            question: mockQuestion,
            transcript: mockTranscript,
            deliveryScores: mockDeliveryScores,
            transcriptScores: mockTranscriptScores,
          });
          const result: SessionReviewResult = {
            context,
            feedback: mockQualitativeFeedback,
            modelAnswer: mockModelAnswer,
          };
          stage.input = result;
          stage.output = { rendered: "ScorecardPanel" };
          setSessionResult(result);
          break;
        }
        default:
          break;
      }

      if (nextIndex + 1 < next.length) {
        const upcoming = next[nextIndex + 1];
        if (upcoming && upcoming.status === "idle") {
          upcoming.status = "pending";
        }
      }

      return next;
    });

    setStepIndex(nextIndex);
  }, [stepIndex, stages.length]);

  const reset = useCallback(() => {
    setStages(cloneStages());
    setStepIndex(-1);
    setSessionResult(null);
  }, []);

  const loadingFlags = useMemo(() => {
    const done = (id: PipelineStage["id"]) => stages.find((s) => s.id === id)?.status === "done";
    return {
      loadingDelivery: !done("audioScores"),
      loadingTranscriptScores: !done("transcriptScores"),
      loadingFeedback: !done("llmFeedback"),
    };
  }, [stages]);

  return (
    <div className={styles.layout}>
      <div className={styles.controls}>
        <button type="button" className={styles.button} onClick={advance} disabled={!canAdvance}>
          Advance one stage
        </button>
        <button type="button" className={styles.buttonSecondary} onClick={reset}>
          Reset
        </button>
        <p className={styles.stepHint}>
          Step {Math.max(0, stepIndex + 1)} / {stages.length}
          {isComplete ? " — pipeline complete" : ""}
        </p>
      </div>

      <div className={styles.stages}>
        {stages.map((stage) => (
          <FlowStageCard key={stage.id} stage={stage} />
        ))}
      </div>

      <section className={styles.scorecardSection} aria-labelledby="live-scorecard">
        <h2 id="live-scorecard" className={styles.scorecardTitle}>
          Live scorecard preview
        </h2>
        <ScorecardPanel
          result={sessionResult}
          loadingDelivery={loadingFlags.loadingDelivery && stepIndex >= 0}
          loadingTranscriptScores={loadingFlags.loadingTranscriptScores && stepIndex >= 0}
          loadingFeedback={loadingFlags.loadingFeedback && stepIndex >= 0}
        />
      </section>
    </div>
  );
}
