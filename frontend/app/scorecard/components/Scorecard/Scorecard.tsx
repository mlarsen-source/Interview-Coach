import { ModelAnswer } from "@/app/scorecard/components/ModelAnswer/ModelAnswer";
import { QualitativeFeedback } from "@/app/scorecard/components/QualitativeFeedback/QualitativeFeedback";
import { TranscriptFeedbackScores } from "@/app/scorecard/components/TranscriptFeedbackScores/TranscriptFeedbackScores";
import type {
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
  transcriptScores?: TranscriptFeedbackScoresType | null;
  feedback?: QualitativeFeedbackType | null;
  modelAnswer?: ModelAnswerType | null;
  loadingTranscriptScores?: boolean;
  loadingFeedback?: boolean;
  showShellBadge?: boolean;
};

export function Scorecard({
  question = null,
  transcript = null,
  transcriptScores = null,
  feedback = null,
  modelAnswer = null,
  loadingTranscriptScores = false,
  loadingFeedback = false,
  showShellBadge = true,
}: ScorecardProps) {
  return (
    <article className={styles.root} aria-label="Interview coaching scorecard">
      {showShellBadge ? <span className={styles.shellBadge}>UI shell</span> : null}
      <header className={styles.header}>
        <p className={styles.eyebrow}>Question</p>
        <h1 className={styles.question}>{question?.text ?? "No question selected"}</h1>
        {transcript ? <p className={styles.transcript}>{transcript.text}</p> : null}
      </header>
      <div className={styles.scoresRow}>
        <TranscriptFeedbackScores loading={loadingTranscriptScores} scores={transcriptScores} />
      </div>
      <div className={styles.feedbackColumn}>
        <QualitativeFeedback loading={loadingFeedback} feedback={feedback} />
        <ModelAnswer loading={loadingFeedback} modelAnswer={modelAnswer} />
      </div>
    </article>
  );
}
