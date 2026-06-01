/** Arousal / dominance / valence from POST /emotion/analyze */
export type DeliveryScores = {
  arousal: number;
  dominance: number;
  valence: number;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

/** Timestamped transcript from POST /speech/transcribe (contract TBD) */
export type Transcript = {
  text: string;
  segments: TranscriptSegment[];
};

/**
 * Delivery / content signals from transcript classifier (contract TBD).
 * Shell dimensions until backend defines the schema.
 */
export type TranscriptFeedbackScores = {
  clarity: number;
  structure: number;
  relevance: number;
  conciseness: number;
};

export type InterviewQuestion = {
  id: string;
  prompt: string;
};

/** Combined context sent to POST /feedback/generate */
export type ReviewContextPayload = {
  question: InterviewQuestion;
  transcript: Transcript;
  deliveryScores: DeliveryScores;
  transcriptScores: TranscriptFeedbackScores;
};

/** Structured LLM feedback (contract TBD) */
export type QualitativeFeedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
  deliveryNotes: string;
};

export type ModelAnswer = {
  text: string;
};

/** Full result rendered on the scorecard */
export type SessionReviewResult = {
  context: ReviewContextPayload;
  feedback: QualitativeFeedback;
  modelAnswer: ModelAnswer;
};

export type PipelineStageStatus = "idle" | "pending" | "done" | "error";

export type PipelineStageId =
  | "record"
  | "transcribe"
  | "audioScores"
  | "transcriptScores"
  | "aggregate"
  | "llmFeedback"
  | "scorecard";

export type PipelineStage<TInput = unknown, TOutput = unknown> = {
  id: PipelineStageId;
  label: string;
  description: string;
  status: PipelineStageStatus;
  input?: TInput;
  output?: TOutput;
  error?: string;
};
