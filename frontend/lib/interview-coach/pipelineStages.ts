import type { PipelineStage } from "@/lib/interview-coach/types";

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "record",
    label: "1. Record",
    description: "User selects a question and records answer in the browser.",
    status: "idle",
  },
  {
    id: "transcribe",
    label: "2. Transcribe + delivery",
    description:
      "Audio blob → POST /speech/transcribe → timestamped segments with per-segment arousal/dominance/valence.",
    status: "idle",
  },
  {
    id: "audioScores",
    label: "3. Per-segment delivery",
    description: "Each segment carries its own arousal/dominance/valence from the emotion model.",
    status: "idle",
  },
  {
    id: "aggregate",
    label: "4. Aggregate for LLM",
    description: "Merge question + scored transcript → ReviewContextPayload.",
    status: "idle",
  },
  {
    id: "transcriptScores",
    label: "5. Answer-quality scores",
    description:
      "Produced by the combined feedback call (clarity/structure/relevance/conciseness).",
    status: "idle",
  },
  {
    id: "llmFeedback",
    label: "6. LLM feedback",
    description:
      "ReviewContextPayload → POST /feedback/generate → scores + feedback + model answer.",
    status: "idle",
  },
  {
    id: "scorecard",
    label: "7. Scorecard UI",
    description: "Frontend renders answer-quality scores, qualitative feedback, model answer.",
    status: "idle",
  },
];
