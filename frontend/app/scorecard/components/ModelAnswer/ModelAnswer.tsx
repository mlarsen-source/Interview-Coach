import type { ModelAnswer as ModelAnswerType } from "@/lib/interview-coach/types";

import styles from "./ModelAnswer.module.css";

export type ModelAnswerProps = {
  loading?: boolean;
  modelAnswer?: ModelAnswerType | null;
};

export function ModelAnswer({ loading = false, modelAnswer = null }: ModelAnswerProps) {
  return (
    <section className={styles.root} aria-labelledby="model-answer-heading">
      <h2 id="model-answer-heading" className={styles.title}>
        Model answer (shell)
      </h2>
      {loading ? (
        <div className={styles.skeletonBlock} aria-busy="true" />
      ) : modelAnswer ? (
        <p className={styles.text}>{modelAnswer.text}</p>
      ) : (
        <p className={styles.placeholder}>Included in LLM feedback response</p>
      )}
    </section>
  );
}
