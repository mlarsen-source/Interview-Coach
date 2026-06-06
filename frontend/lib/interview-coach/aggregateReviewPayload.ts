import type {
  InterviewQuestion,
  ReviewContextPayload,
  Transcript,
} from "@/lib/interview-coach/types";

/**
 * Assembles the question and timestamped (A/D/V-scored) transcript into the
 * payload for POST /feedback/generate. Per-segment delivery scores live on
 * transcript.segments. Pure function — safe to call from client containers or
 * server route handlers.
 */
export function aggregateReviewPayload(input: {
  question: InterviewQuestion;
  transcript: Transcript;
}): ReviewContextPayload {
  return {
    question: input.question,
    transcript: input.transcript,
  };
}
