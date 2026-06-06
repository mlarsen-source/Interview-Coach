import type { InterviewQuestion as ScorecardQuestion } from "@/lib/prompts/questions";
import type { ReviewContextPayload, TranscriptSegment } from "@/lib/interview-coach/types";

/**
 * One transcribed+scored segment as returned by POST /speech/transcribe.
 * Mirrors the raw shape the interview client receives.
 */
export type ScoredSegment = {
  start: number;
  end: number;
  text: string;
  arousal: number;
  dominance: number;
  valence: number;
};

/**
 * Converts a live interview session (question + the raw scored segments from
 * /speech/transcribe) into the ReviewContextPayload expected by
 * /feedback/generate and the scorecard.
 *
 * Isolates the shape mismatch between the question bank
 * ({ id: number, text }) and the scorecard contract ({ id: string, text }),
 * and assembles the full transcript text from the segments.
 */
export function buildReviewContext(
  question: ScorecardQuestion,
  segments: ScoredSegment[]
): ReviewContextPayload {
  const transcriptSegments: TranscriptSegment[] = segments.map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text,
    arousal: seg.arousal,
    dominance: seg.dominance,
    valence: seg.valence,
  }));

  const fullText = segments
    .map((seg) => seg.text.trim())
    .filter(Boolean)
    .join(" ");

  return {
    question: {
      id: String(question.id),
      text: question.text,
    },
    transcript: {
      text: fullText,
      segments: transcriptSegments,
    },
  };
}
