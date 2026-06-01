import { JsonPayloadBlock } from "@/app/dev/flow/components/JsonPayloadBlock/JsonPayloadBlock";
import type { PipelineStage } from "@/lib/interview-coach/types";

import styles from "./FlowStageCard.module.css";

export type FlowStageCardProps = {
  stage: PipelineStage;
};

const STATUS_CLASS: Record<PipelineStage["status"], string> = {
  idle: styles.statusIdle,
  pending: styles.statusPending,
  done: styles.statusDone,
  error: styles.statusError,
};

const ROOT_STATUS_CLASS: Record<PipelineStage["status"], string> = {
  idle: styles.rootIdle,
  pending: styles.rootPending,
  done: styles.rootDone,
  error: styles.rootError,
};

export function FlowStageCard({ stage }: FlowStageCardProps) {
  return (
    <article
      className={`${styles.root} ${ROOT_STATUS_CLASS[stage.status]}`}
      aria-labelledby={`stage-${stage.id}-title`}
    >
      <header className={styles.header}>
        <div>
          <h2 id={`stage-${stage.id}-title`} className={styles.title}>
            {stage.label}
          </h2>
          <p className={styles.description}>{stage.description}</p>
        </div>
        <span className={`${styles.status} ${STATUS_CLASS[stage.status]}`}>{stage.status}</span>
      </header>
      <div className={styles.payloads}>
        <JsonPayloadBlock label="Input" data={stage.input} />
        <JsonPayloadBlock label="Output" data={stage.output} />
      </div>
      {stage.error ? <p className={styles.error}>{stage.error}</p> : null}
    </article>
  );
}
