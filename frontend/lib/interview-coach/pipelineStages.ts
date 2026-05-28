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
    label: "2. Transcribe",
    description: "Audio blob → Whisper API → timestamped transcript.",
    status: "idle",
  },
  {
    id: "audioScores",
    label: "3. Audio delivery scores",
    description: "Audio → POST /emotion/analyze → arousal, dominance, valence.",
    status: "idle",
  },
  {
    id: "transcriptScores",
    label: "4. Transcript classifier",
    description: "Transcript → classifier → content/delivery scores (shell schema).",
    status: "idle",
  },
  {
    id: "aggregate",
    label: "5. Aggregate for LLM",
    description: "Merge question, transcript, and both score sets → ReviewContextPayload.",
    status: "idle",
  },
  {
    id: "llmFeedback",
    label: "6. LLM feedback",
    description: "ReviewContextPayload → POST /feedback/generate → feedback + model answer.",
    status: "idle",
  },
  {
    id: "scorecard",
    label: "7. Scorecard UI",
    description: "Frontend renders delivery metrics, qualitative feedback, model answer.",
    status: "idle",
  },
];
