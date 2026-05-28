import type {
  DeliveryScores,
  InterviewQuestion,
  ModelAnswer,
  QualitativeFeedback,
  ReviewContextPayload,
  SessionReviewResult,
  Transcript,
  TranscriptFeedbackScores,
} from "@/lib/interview-coach/types";

export const mockQuestion: InterviewQuestion = {
  id: "q-behavioral-01",
  prompt: "Tell me about a time you had to influence a team without direct authority.",
};

export const mockTranscript: Transcript = {
  text: "Last year our design and engineering leads disagreed on scope for a launch. I set up a short working session, mapped tradeoffs on a whiteboard, and proposed a phased rollout. We shipped on time and both teams felt heard.",
  segments: [
    {
      start: 0,
      end: 4.2,
      text: "Last year our design and engineering leads disagreed on scope for a launch.",
    },
    {
      start: 4.2,
      end: 9.8,
      text: "I set up a short working session, mapped tradeoffs on a whiteboard,",
    },
    {
      start: 9.8,
      end: 15.1,
      text: "and proposed a phased rollout. We shipped on time and both teams felt heard.",
    },
  ],
};

export const mockDeliveryScores: DeliveryScores = {
  arousal: 0.61,
  dominance: 0.55,
  valence: 0.32,
};

export const mockTranscriptScores: TranscriptFeedbackScores = {
  clarity: 0.78,
  structure: 0.72,
  relevance: 0.85,
  conciseness: 0.68,
};

export const mockQualitativeFeedback: QualitativeFeedback = {
  summary:
    "Strong STAR-style story with a clear outcome. Delivery reads as measured but engaged; tighten the opening hook.",
  strengths: ["Concrete situation and actions", "Credible outcome with team alignment"],
  improvements: [
    "Lead with your role in one sentence",
    "Quantify impact if possible (timeline, metrics)",
  ],
  deliveryNotes:
    "Valence is slightly low — consider warmer phrasing when describing collaboration.",
};

export const mockModelAnswer: ModelAnswer = {
  text: "When two senior stakeholders disagreed on launch scope, I facilitated a 45-minute working session, documented three options with tradeoffs, and recommended a phased rollout. We hit the date with both teams aligned on phase two priorities.",
};

export const mockReviewContext: ReviewContextPayload = {
  question: mockQuestion,
  transcript: mockTranscript,
  deliveryScores: mockDeliveryScores,
  transcriptScores: mockTranscriptScores,
};

export const mockSessionReview: SessionReviewResult = {
  context: mockReviewContext,
  feedback: mockQualitativeFeedback,
  modelAnswer: mockModelAnswer,
};
