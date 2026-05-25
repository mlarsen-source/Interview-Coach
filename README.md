# Interview Coach

AI-powered interview coaching platform. Users record a response to an interview question and receive structured feedback on delivery, tone, and answer quality.

## How it works

1. User records an answer in the browser
2. Audio → Whisper API → timestamped transcript
3. Audio + transcript → Audeering wav2vec2 → delivery scores (confidence, arousal, valence)
4. Transcript + scores + question → LLM → structured feedback
5. Frontend renders a scorecard

## Repo structure

```
backend/    — FastAPI backend (Python): runs the Audeering model locally, calls Whisper and LLM APIs
frontend/   — Next.js frontend (React): recording UI and scorecard display
docs/       — project proposal and reference documents
```

## Setup

- **Backend:** see [backend/README.md](backend/README.md)
- **Frontend:** see [frontend/README.md](frontend/README.md)

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React) |
| Backend | FastAPI (Python) |
| Speech-to-text | OpenAI Whisper API |
| Tone/delivery | audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim (local) |
| Feedback | Claude or GPT-4o (API) |
| Frontend deploy | Vercel |
| Backend deploy | Render or Fly.io |
