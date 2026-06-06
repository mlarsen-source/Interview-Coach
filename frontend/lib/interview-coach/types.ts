/** Arousal / dominance / valence from POST /emotion/analyze */
export type DeliveryScores = {
  arousal: number;
  dominance: number;
  valence: number;
};

/**
 * One timestamped transcript segment with its per-segment delivery (A/D/V)
 * scores, as returned by POST /speech/transcribe.
 */
export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  arousal: number;
  dominance: number;
  valence: number;
};

/** Timestamped transcript from POST /speech/transcribe. */
export type Transcript = {
  text: string;
  segments: TranscriptSegment[];
};

/**
 * Answer-quality scores produced by POST /feedback/generate (same Groq call
 * as the qualitative feedback). All values are 0..1.
 */
export type TranscriptFeedbackScores = {
  clarity: number;
  structure: number;
  relevance: number;
  conciseness: number;
};

export type InterviewQuestion = {
  id: string;
  text: string;
};

/**
 * Combined context sent to POST /feedback/generate. The per-segment delivery
 * (A/D/V) scores live on transcript.segments, giving the LLM moment-by-moment
 * context. transcriptScores are produced by the same call, not sent in.
 */
export type ReviewContextPayload = {
  question: InterviewQuestion;
  transcript: Transcript;
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
  transcriptScores: TranscriptFeedbackScores;
  feedback: QualitativeFeedback;
  modelAnswer: ModelAnswer;
};

/** Response body from POST /feedback/generate. */
export type SessionFeedbackResponse = {
  transcriptScores: TranscriptFeedbackScores;
  feedback: QualitativeFeedback;
  modelAnswer: ModelAnswer;
};

/** One answered question in a multi-question session review. */
export type QuestionReview = {
  question: InterviewQuestion;
  transcriptScores: TranscriptFeedbackScores;
  feedback: QualitativeFeedback;
  modelAnswer: ModelAnswer;
};

/** Request body for POST /feedback/generate-session. */
export type SessionReviewPayload = {
  answers: ReviewContextPayload[];
};

/** Response body from POST /feedback/generate-session. */
export type FullSessionFeedbackResponse = {
  overallSummary: string;
  overallStrengths: string[];
  overallImprovements: string[];
  overallDeliveryNotes: string;
  questionReviews: QuestionReview[];
};

export type FeedbackMode = "perQuestion" | "endOfInterview";

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
