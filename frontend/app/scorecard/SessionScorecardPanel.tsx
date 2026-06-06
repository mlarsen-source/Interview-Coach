"use client";

import { useEffect, useState } from "react";

import { Scorecard } from "@/app/scorecard/components/Scorecard/Scorecard";
import type {
  FullSessionFeedbackResponse,
  SessionReviewPayload,
} from "@/lib/interview-coach/types";

import styles from "./SessionScorecardPanel.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type SessionScorecardPanelProps = {
  sessionInput: SessionReviewPayload;
  /** Called once when session feedback has been fetched. */
  onFeedbackReady?: (response: FullSessionFeedbackResponse) => void;
};

async function fetchSessionFeedback(
  payload: SessionReviewPayload,
  signal: AbortSignal
): Promise<FullSessionFeedbackResponse> {
  const res = await fetch(`${API_BASE}/feedback/generate-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error(`Session feedback request failed (${res.status})`);
  return (await res.json()) as FullSessionFeedbackResponse;
}

export function SessionScorecardPanel({
  sessionInput,
  onFeedbackReady,
}: SessionScorecardPanelProps) {
  const [result, setResult] = useState<FullSessionFeedbackResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setFetching(true);
      setError(null);
      setResult(null);
      try {
        const data = await fetchSessionFeedback(sessionInput, controller.signal);
        if (!controller.signal.aborted) setResult(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not generate session feedback.");
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [sessionInput]);

  useEffect(() => {
    if (result && onFeedbackReady) onFeedbackReady(result);
  }, [onFeedbackReady, result]);

  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }

  if (fetching || !result) {
    return <p className={styles.loading}>Generating interview feedback…</p>;
  }

  const answerByQuestionId = new Map(
    sessionInput.answers.map((answer) => [answer.question.id, answer.transcript])
  );

  return (
    <div className={styles.root}>
      <section className={styles.overall}>
        <h2 className={styles.overallTitle}>Overall session feedback</h2>
        <p className={styles.summary}>{result.overallSummary}</p>
        <div className={styles.listBlock}>
          <h3 className={styles.listHeading}>Strengths</h3>
          <ul className={styles.list}>
            {result.overallStrengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.listBlock}>
          <h3 className={styles.listHeading}>Improvements</h3>
          <ul className={styles.list}>
            {result.overallImprovements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className={styles.deliveryNotes}>{result.overallDeliveryNotes}</p>
      </section>

      <div className={styles.divider} />

      {result.questionReviews.map((review, index) => (
        <div key={review.question.id} className={styles.questionReview}>
          <Scorecard
            question={review.question}
            transcript={answerByQuestionId.get(review.question.id) ?? null}
            transcriptScores={review.transcriptScores}
            feedback={review.feedback}
            modelAnswer={review.modelAnswer}
            showShellBadge={false}
          />
          {index < result.questionReviews.length - 1 ? <div className={styles.divider} /> : null}
        </div>
      ))}
    </div>
  );
}
