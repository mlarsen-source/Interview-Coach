import type { TranscriptFeedbackScores as TranscriptFeedbackScoresType } from "@/lib/interview-coach/types";

import styles from "./TranscriptFeedbackScores.module.css";

export type TranscriptFeedbackScoresProps = {
  loading?: boolean;
  scores?: TranscriptFeedbackScoresType | null;
};

const METRICS: { key: keyof TranscriptFeedbackScoresType; label: string }[] = [
  { key: "clarity", label: "Clarity" },
  { key: "structure", label: "Structure" },
  { key: "relevance", label: "Relevance" },
  { key: "conciseness", label: "Conciseness" },
];

function formatScore(value: number): string {
  return value.toFixed(2);
}

export function TranscriptFeedbackScores({
  loading = false,
  scores = null,
}: TranscriptFeedbackScoresProps) {
  return (
    <section className={styles.root} aria-labelledby="transcript-scores-heading">
      <h2 id="transcript-scores-heading" className={styles.title}>
        Transcript classifier (shell)
      </h2>
      {loading ? (
        <div className={styles.grid} aria-busy="true">
          {METRICS.map(({ key }) => (
            <div key={key} className={styles.metric}>
              <span className={styles.label}>{key}</span>
              <div className={styles.skeletonBar} />
            </div>
          ))}
        </div>
      ) : scores ? (
        <dl className={styles.grid}>
          {METRICS.map(({ key, label }) => (
            <div key={key} className={styles.metric}>
              <dt className={styles.label}>{label}</dt>
              <dd className={styles.value}>{formatScore(scores[key])}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.placeholder}>Awaiting transcript classifier</p>
      )}
    </section>
  );
}
