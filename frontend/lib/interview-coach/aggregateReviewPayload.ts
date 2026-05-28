import type {
  DeliveryScores,
  InterviewQuestion,
  ReviewContextPayload,
  Transcript,
  TranscriptFeedbackScores,
} from "@/lib/interview-coach/types";

/**
 * Merges audio delivery scores and transcript classifier scores into one
 * payload for POST /feedback/generate. Pure function — safe to call from
 * client containers or server route handlers.
 */
export function aggregateReviewPayload(input: {
  question: InterviewQuestion;
  transcript: Transcript;
  deliveryScores: DeliveryScores;
  transcriptScores: TranscriptFeedbackScores;
}): ReviewContextPayload {
  return {
    question: input.question,
    transcript: input.transcript,
    deliveryScores: input.deliveryScores,
    transcriptScores: input.transcriptScores,
  };
}
