# Interview Coach — Architecture & Data Flow

## Overview

Interview Coach is a full-stack AI application that conducts mock job interviews. It speaks questions aloud, records the candidate's answer, transcribes the audio, scores each spoken segment for emotional delivery, and (coming) generates structured feedback using an LLM.

The frontend orchestrates the pipeline. The backend exposes discrete API endpoints — each service does one job and returns structured data. The frontend holds all session state and calls services in sequence.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                    │
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │  Question    │   │  Interview   │   │  Scorecard  │  │
│  │  + Voice     │   │  Recording   │   │  Display    │  │
│  │  Selector    │   │  + VAD       │   │  (coming)   │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬──────┘  │
│         │                  │                   │         │
└─────────┼──────────────────┼───────────────────┼─────────┘
          │ POST /speech/tts  │ POST /speech/     │ POST /feedback/
          │                  │ transcribe        │ generate (coming)
          ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│                                                          │
│  ┌──────────────────┐   ┌──────────────────────────────┐ │
│  │  speech_to_text  │   │   tone_delivery_analyzer     │ │
│  │                  │   │                              │ │
│  │  /speech/tts     │   │  wav2vec2 emotion model      │ │
│  │  Groq Orpheus    │   │  (loaded at startup,         │ │
│  │  TTS → WAV       │   │   runs locally on CPU/GPU)   │ │
│  │                  │   │                              │ │
│  │  /speech/        │──▶│  per-segment scoring         │ │
│  │  transcribe      │   │  arousal/dominance/valence   │ │
│  │  Groq Whisper    │   │                              │ │
│  │  → segments[]    │   └──────────────────────────────┘ │
│  └──────────────────┘                                    │
│                                                          │
│  ┌──────────────────┐                                    │
│  │  llm (coming)    │                                    │
│  │  /feedback/      │                                    │
│  │  generate        │                                    │
│  │  Anthropic Claude│                                    │
│  └──────────────────┘                                    │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │         Groq Cloud         │
              │  whisper-large-v3-turbo    │
              │  canopylabs/orpheus-v1-    │
              │  english (TTS)             │
              └────────────────────────────┘
```

---

## Interview Pipeline — Step by Step

### Stage 1 — Question Selection

- On page load the frontend picks a random question from `lib/prompts/questions.ts`
- First question is always the intro question ("Tell me about yourself")
- Subsequent questions are drawn without repetition from a pool of 20 (10 technical, 10 behavioral)
- The selected interviewer persona maps to a Groq Orpheus voice

### Stage 2 — Text-to-Speech (Interviewer Introduction)

**Frontend → `POST /speech/tts`**

```
Request:  { "text": "Hi, I'm Hannah...", "voice": "hannah" }
Response: audio/wav binary
```

- Backend calls Groq Orpheus (`canopylabs/orpheus-v1-english`)
- Returns raw WAV bytes
- Frontend plays via `Audio` element
- When playback ends, recording starts automatically

### Stage 3 — Text-to-Speech (Question)

Same endpoint and flow as Stage 2, using the question text.
Question text is revealed on screen only after TTS finishes playing.

### Stage 4 — Audio Recording + VAD

- Frontend uses `MediaRecorder` API to capture microphone audio as WebM
- Web Audio API `AnalyserNode` monitors RMS levels continuously
- Recording never stops until the user has spoken at least once (`hasSpokeRef`)
- After 3 seconds of silence post-speech → "Are you done?" prompt appears
- User confirms with **I'm Done Answering** or dismisses with **Keep Going**
- Prompt auto-stops after 8 seconds if ignored

### Stage 5 — Transcription + Emotion Scoring

**Frontend → `POST /speech/transcribe`**

```
Request:  multipart/form-data  { file: audio.webm }

Response: [
  { "start": 0.0, "end": 2.4, "text": "...", "arousal": 0.61, "dominance": 0.55, "valence": 0.32 },
  ...
]
```

**Inside the backend:**

1. Audio file saved to temp disk
2. Sent to Groq `whisper-large-v3-turbo` with `response_format=verbose_json` and segment-level timestamps
3. Full audio loaded into memory with `librosa` (resampled to 16 kHz mono)
4. Audio sliced at each Whisper segment boundary
5. Each slice run through `audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim`
6. Scores clamped to [0, 1] and rounded
7. Segments shorter than 0.1s are skipped (insufficient audio for the model)

### Stage 6 — Results Display

- Segments rendered in the interview card, each showing timestamp, text, and A/D/V scores
- User can move to the next question or (coming) request LLM feedback

### Stage 7 — LLM Feedback *(coming)*

**Frontend → `POST /feedback/generate`**

```
Request: {
  "question": { ... },
  "segments": [ { "text": "...", "arousal": ..., ... }, ... ]
}

Response: {
  "summary": "...",
  "strengths": [...],
  "improvements": [...],
  "deliveryNotes": "..."
}
```

- Backend sends assembled context to Anthropic Claude
- Structured feedback returned and rendered on the scorecard

---

## Data Schemas

### Segment (output of `/speech/transcribe`)

```typescript
interface Segment {
  start: number;      // seconds from recording start
  end: number;        // seconds from recording start
  text: string;       // transcribed spoken text
  arousal: number;    // 0–1  (calm → excited/agitated)
  dominance: number;  // 0–1  (hesitant → assertive/confident)
  valence: number;    // 0–1  (negative/stressed → positive/enthusiastic)
}
```

### Interviewer

```typescript
interface Interviewer {
  voice: string;   // Groq Orpheus voice name
  name: string;    // display name
  title: string;   // job title shown in dropdown
}
```

Available voices: `autumn`, `diana`, `hannah`, `austin`, `daniel`, `troy`

### InterviewQuestion

```typescript
interface InterviewQuestion {
  id: number;
  text: string;
}
```

---

## Key Design Decisions

**Frontend as orchestrator** — The frontend calls each backend service in sequence and holds all session state. Backend services are stateless and single-purpose. This makes each service independently testable and lets different team members own different endpoints.

**Segment-level scoring** — Rather than scoring the entire recording as one block, Whisper's natural sentence segments (~2–5 seconds each) are each scored independently. This lets the feedback layer pinpoint specific moments ("your confidence dropped when you discussed X") rather than giving a single overall score.

**No chunked streaming** — The full recording is sent in one request after the user finishes speaking. Chunked-while-recording was evaluated but discarded because WebM chunk boundaries make each chunk an invalid audio file without the container headers. The current approach is simpler and more reliable.

**Emotion model loaded at startup** — The wav2vec2 model (~1 GB) is loaded once when the backend starts and kept in memory for the lifetime of the process. This avoids a 10–30 second cold-start penalty on every request.

**VAD without a library** — Voice activity detection uses the Web Audio API `AnalyserNode` to compute RMS levels, with a prompt-before-stop UX rather than hard auto-stop. No VAD library dependency needed; the user retains control.

---

## Environment Variables

All secrets live in `backend/.env` (gitignored). See [backend/.env.example](../backend/.env.example).

| Variable           | Required | Used by                        |
|--------------------|----------|--------------------------------|
| `GROQ_API_KEY`     | Yes      | `/speech/tts`, `/speech/transcribe` |
| `ANTHROPIC_API_KEY`| Coming   | `/feedback/generate`           |
| `OPENAI_API_KEY`   | No       | Reserved                       |

---

## Local Development URLs

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:8000         |
| API docs | http://localhost:8000/docs    |
| Dev — transcribe debug | http://localhost:3000/dev/transcribe |
| Dev — pipeline flow    | http://localhost:3000/dev/flow       |
