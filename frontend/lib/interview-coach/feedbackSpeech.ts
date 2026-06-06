import type { FullSessionFeedbackResponse, QualitativeFeedback } from "@/lib/interview-coach/types";

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(". ")}. ${items.at(-1)}`;
}

/** Turn per-question LLM feedback into a spoken script for TTS. */
export function buildQualitativeFeedbackScript(feedback: QualitativeFeedback): string {
  const parts = ["Here's my feedback on your answer.", feedback.summary];

  if (feedback.strengths.length > 0) {
    parts.push(`Your strengths: ${joinList(feedback.strengths)}.`);
  }
  if (feedback.improvements.length > 0) {
    parts.push(`Areas to improve: ${joinList(feedback.improvements)}.`);
  }
  if (feedback.deliveryNotes.trim()) {
    parts.push(`On delivery: ${feedback.deliveryNotes}`);
  }

  return parts.join(" ");
}

/** Turn end-of-interview session feedback into a spoken script for TTS. */
export function buildSessionFeedbackScript(result: FullSessionFeedbackResponse): string {
  const parts = [
    "Great work completing the interview. Here's my overall feedback.",
    result.overallSummary,
  ];

  if (result.overallStrengths.length > 0) {
    parts.push(`Overall strengths: ${joinList(result.overallStrengths)}.`);
  }
  if (result.overallImprovements.length > 0) {
    parts.push(`Overall improvements: ${joinList(result.overallImprovements)}.`);
  }
  if (result.overallDeliveryNotes.trim()) {
    parts.push(`On delivery: ${result.overallDeliveryNotes}`);
  }

  return parts.join(" ");
}
