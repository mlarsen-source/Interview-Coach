import { DeliveryScores } from "@/app/scorecard/components/DeliveryScores/DeliveryScores";
import { ModelAnswer } from "@/app/scorecard/components/ModelAnswer/ModelAnswer";
import { QualitativeFeedback } from "@/app/scorecard/components/QualitativeFeedback/QualitativeFeedback";
import { TranscriptFeedbackScores } from "@/app/scorecard/components/TranscriptFeedbackScores/TranscriptFeedbackScores";
import type {
  DeliveryScores as DeliveryScoresType,
  InterviewQuestion,
  ModelAnswer as ModelAnswerType,
  QualitativeFeedback as QualitativeFeedbackType,
  Transcript,
  TranscriptFeedbackScores as TranscriptFeedbackScoresType,
} from "@/lib/interview-coach/types";

import styles from "./Scorecard.module.css";

export type ScorecardProps = {
  question?: InterviewQuestion | null;
  transcript?: Transcript | null;
  deliveryScores?: DeliveryScoresType | null;
  transcriptScores?: TranscriptFeedbackScoresType | null;
  feedback?: QualitativeFeedbackType | null;
  modelAnswer?: ModelAnswerType | null;
  loadingDelivery?: boolean;
  loadingTranscriptScores?: boolean;
  loadingFeedback?: boolean;
  showShellBadge?: boolean;
};

export function Scorecard({
  question = null,
  transcript = null,
  deliveryScores = null,
  transcriptScores = null,
  feedback = null,
  modelAnswer = null,
  loadingDelivery = false,
  loadingTranscriptScores = false,
  loadingFeedback = false,
  showShellBadge = true,
}: ScorecardProps) {
  return (
    <article className={styles.root} aria-label="Interview coaching scorecard">
      {showShellBadge ? <span className={styles.shellBadge}>UI shell</span> : null}
      <header className={styles.header}>
        <p className={styles.eyebrow}>Question</p>
        <h1 className={styles.question}>
          {question?.prompt ?? "No question selected"}
        </h1>
        {transcript ? (
          <p className={styles.transcript}>{transcript.text}</p>
        ) : null}
      </header>
      <div className={styles.scoresRow}>
        <DeliveryScores loading={loadingDelivery} scores={deliveryScores} />
        <TranscriptFeedbackScores
          loading={loadingTranscriptScores}
          scores={transcriptScores}
        />
      </div>
      <div className={styles.feedbackColumn}>
        <QualitativeFeedback loading={loadingFeedback} feedback={feedback} />
        <ModelAnswer loading={loadingFeedback} modelAnswer={modelAnswer} />
      </div>
    </article>
  );
}
