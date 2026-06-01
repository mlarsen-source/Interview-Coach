import type { QualitativeFeedback as QualitativeFeedbackType } from "@/lib/interview-coach/types";

import styles from "./QualitativeFeedback.module.css";

export type QualitativeFeedbackProps = {
  loading?: boolean;
  feedback?: QualitativeFeedbackType | null;
};

export function QualitativeFeedback({
  loading = false,
  feedback = null,
}: QualitativeFeedbackProps) {
  return (
    <section className={styles.root} aria-labelledby="qualitative-feedback-heading">
      <h2 id="qualitative-feedback-heading" className={styles.title}>
        LLM feedback (shell)
      </h2>
      {loading ? (
        <div aria-busy="true">
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLineShort} />
        </div>
      ) : feedback ? (
        <>
          <p className={styles.summary}>{feedback.summary}</p>
          <h3 className={styles.sectionTitle}>Strengths</h3>
          <ul className={styles.list}>
            {feedback.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className={styles.sectionTitle}>Improvements</h3>
          <ul className={styles.list}>
            {feedback.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className={styles.sectionTitle}>Delivery notes</h3>
          <p className={styles.summary}>{feedback.deliveryNotes}</p>
        </>
      ) : (
        <p className={styles.placeholder}>Awaiting POST /feedback/generate</p>
      )}
    </section>
  );
}
