import type { DeliveryScores as DeliveryScoresType } from "@/lib/interview-coach/types";

import styles from "./DeliveryScores.module.css";

export type DeliveryScoresProps = {
  loading?: boolean;
  scores?: DeliveryScoresType | null;
};

const METRICS: { key: keyof DeliveryScoresType; label: string }[] = [
  { key: "arousal", label: "Arousal" },
  { key: "dominance", label: "Dominance" },
  { key: "valence", label: "Valence" },
];

function formatScore(value: number): string {
  return value.toFixed(2);
}

export function DeliveryScores({ loading = false, scores = null }: DeliveryScoresProps) {
  return (
    <section className={styles.root} aria-labelledby="delivery-scores-heading">
      <h2 id="delivery-scores-heading" className={styles.title}>
        Audio delivery (wav2vec2)
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
        <p className={styles.placeholder}>Awaiting POST /emotion/analyze</p>
      )}
    </section>
  );
}
