# Interview Coach

AI-powered interview coaching platform. Users record a response to an interview question and receive structured feedback on delivery, tone, and answer quality.

## How it works

1. User records an answer in the browser
2. Audio → Whisper API → timestamped transcript
3. Audio + transcript → Audeering wav2vec2 → delivery scores (arousal, dominance, valence)
4. Transcript + scores + question → LLM → structured feedback
5. Frontend renders a scorecard

## Prerequisites

Install these once at the OS level before running setup:

- **Python 3.9+**
- **pnpm** — `npm install -g pnpm`
- **ffmpeg** — decodes audio files, installed via your OS package manager:

| Platform | Command                                          |
| -------- | ------------------------------------------------ |
| Windows  | `choco install ffmpeg` (requires admin terminal) |
| macOS    | `brew install ffmpeg`                            |
| Linux    | `sudo apt install ffmpeg`                        |

Verify ffmpeg with `ffmpeg -version` after installing. On Windows, restart the terminal first so the PATH updates.

## Setup

Run these once from the project root after cloning.

### 1. Python environment

```bash
python -m venv venv
source venv/Scripts/activate   # Windows (Git Bash)
# source venv/bin/activate     # macOS / Linux
pip install -r backend/requirements.txt
```

The prompt shows `(venv)` when the environment is active. You must activate it in every new terminal session — packages stay installed, only activation is per-session.

### 2. Environment variables

Create `backend/.env` and add your API keys (required once Whisper and LLM services are wired up):

```
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

This file is gitignored — never commit it.

### 3. Frontend

```bash
cd frontend
pnpm install
```

This also installs the pre-push git hooks via lefthook. Hooks run ESLint, Prettier, and TypeScript checks before any push reaches GitHub.

## Running the project

Open two terminals from the project root.

**Terminal 1 — Backend:**

```bash
source venv/Scripts/activate   # Windows; use venv/bin/activate on macOS/Linux
cd backend
uvicorn app:app --reload
```

Server starts at **http://localhost:8000**. Interactive API docs at **http://localhost:8000/docs**. The emotion model loads on startup; first run downloads ~1 GB of model weights.

**Terminal 2 — Frontend:**

```bash
cd frontend
pnpm dev
```

App opens at **http://localhost:3000**.

## Repo structure

```
backend/    — FastAPI backend (Python)
  app.py              — entry point; registers all routers
  requirements.txt    — Python dependencies
  services/
    tone_delivery_analyzer/ — Audeering wav2vec2 emotion model (local)
    speech_to_text/         — Whisper API transcription (todo)
    llm/                    — LLM feedback generation (todo)
frontend/   — Next.js frontend (React)
docs/       — project proposal and reference documents
```

**Complete the Setup section above before consulting any of the links below.**

- Backend endpoint reference: [backend/README.md](backend/README.md)
- Frontend scripts reference: [frontend/README.md](frontend/README.md)
- Tone/delivery model details: [backend/services/tone_delivery_analyzer/README.md](backend/services/tone_delivery_analyzer/README.md)

## Stack

| Layer           | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| Frontend        | Next.js (React)                                               |
| Backend         | FastAPI (Python)                                              |
| Speech-to-text  | OpenAI Whisper API                                            |
| Tone/delivery   | audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim (local) |
| Feedback        | Claude or GPT-4o (API)                                        |
| Frontend deploy | Vercel                                                        |
| Backend deploy  | Render or Fly.io                                              |
