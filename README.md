# Interview Coach

AI-powered interview coaching platform. Users select an interviewer, listen to a spoken question, record their answer, and receive structured feedback on delivery, tone, and answer quality.

## How it works

1. User selects an interviewer voice and presses **Start Interview**
2. Interviewer introduces themselves via TTS (`POST /speech/tts`)
3. Interviewer reads the question aloud; recording starts automatically
4. User answers and presses **I'm Done Answering**
5. Audio → Groq Whisper → timestamped transcript segments (`POST /speech/transcribe`)
6. Each segment → local wav2vec2 model → arousal / dominance / valence scores
7. Scores + transcript displayed per segment on the interview screen
8. *(Coming)* Transcript + scores + question → LLM → structured feedback (`POST /feedback/generate`)
9. *(Coming)* Frontend renders full scorecard

## Prerequisites

Install these once at the OS level before running setup:

- **Python 3.9+**
- **pnpm** — `npm install -g pnpm`
- **ffmpeg** — required to decode audio files:

| Platform | Command                                          |
| -------- | ------------------------------------------------ |
| Windows  | `choco install ffmpeg` (requires admin terminal) |
| macOS    | `brew install ffmpeg`                            |
| Linux    | `sudo apt install ffmpeg`                        |

Verify with `ffmpeg -version` after installing. On Windows, restart the terminal first.

## Setup

Run once from the project root after cloning.

### 1. Python environment

```bash
python -m venv venv
source venv/Scripts/activate   # Windows (Git Bash)
# source venv/bin/activate     # macOS / Linux
pip install -r backend/requirements.txt
```

`(venv)` appears in the prompt when active. Re-activate in every new terminal — packages stay installed.

### 2. Environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your keys:

```
GROQ_API_KEY=your_key_here       # https://console.groq.com  (speech-to-text + TTS)
ANTHROPIC_API_KEY=your_key_here  # https://console.anthropic.com  (LLM feedback, coming)
OPENAI_API_KEY=your_key_here     # Reserved
```

`backend/.env` is gitignored — never commit it.

### 3. Accept Groq Orpheus TTS terms ⚠️ Required

The text-to-speech feature uses Groq's Orpheus model. **Each Groq account must accept the model terms once before the TTS endpoint will work.** Without this step the backend starts fine but every call to `POST /speech/tts` returns a 400 error and the interviewer will be silent.

1. Log in to [console.groq.com](https://console.groq.com)
2. Visit this URL directly:
   ```
   https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english
   ```
3. Click **Accept** on the terms banner
4. Done — acceptance is permanent for your account, no need to repeat it

> If you skip this step and try to run the project, the interviewer will not speak and the frontend will show "Could not load audio — check the backend is running." The backend itself will still start correctly.

### 4. Install frontend dependencies

```bash
cd frontend
pnpm install
```

Installs dependencies and git hooks (lefthook). Pre-commit auto-formats staged files; pre-push runs ESLint, Prettier, and TypeScript checks.

## Running the project

Open two terminals from the project root.

**Terminal 1 — Backend:**

```bash
source venv/Scripts/activate   # Windows; venv/bin/activate on macOS/Linux
cd backend
uvicorn app:app --reload
```

Starts at **http://localhost:8000**. API docs at **http://localhost:8000/docs**.
First run downloads ~1 GB of emotion model weights — this is normal.

**Terminal 2 — Frontend:**

```bash
cd frontend
pnpm dev
```

App at **http://localhost:3000**.

## Repo structure

```
backend/
  app.py                        — FastAPI entry point; registers routers, loads emotion model
  requirements.txt              — Python dependencies
  services/
    tone_delivery_analyzer/     — local wav2vec2 emotion model (arousal/dominance/valence)
    speech_to_text/             — Groq Whisper transcription + TTS
    llm/                        — LLM feedback generation (coming)
    text_analysis/              — transcript scoring (coming)

frontend/
  app/
    page.tsx                    — interview UI (home page)
    InterviewClient.tsx         — full interview state machine
    layout.tsx / globals.css    — root layout and styles
    scorecard/                  — scorecard display components
    dev/
      flow/                     — pipeline visualization dev page
      transcribe/               — transcription dev/debug page
  lib/
    prompts/
      questions.ts              — question bank (20 questions + intro)
      interviewers.ts           — interviewer voices and personas
    interview-coach/
      types.ts                  — shared TypeScript types
      mocks.ts                  — mock data for UI development
      pipelineStages.ts         — pipeline stage definitions

docs/
  architecture.md               — system architecture and data flow
  agent-workflows/              — AI agent workflow guides
```

## Reference

- Architecture and data flow: [docs/architecture.md](docs/architecture.md)
- Backend endpoints: [backend/README.md](backend/README.md)
- Agent conventions: [AGENTS.md](AGENTS.md)
- Tone/delivery model: [backend/services/tone_delivery_analyzer/README.md](backend/services/tone_delivery_analyzer/README.md)

## Stack

| Layer            | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Frontend         | Next.js 16, React 19, TypeScript, Tailwind CSS 4               |
| Backend          | FastAPI (Python)                                               |
| Text-to-speech   | Groq Orpheus (`canopylabs/orpheus-v1-english`)                 |
| Speech-to-text   | Groq Whisper (`whisper-large-v3-turbo`)                        |
| Tone/delivery    | `audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim` (local)|
| LLM feedback     | Anthropic Claude (coming)                                      |
| Package manager  | pnpm                                                           |
| Frontend deploy  | Vercel (planned)                                               |
| Backend deploy   | Render or Fly.io (planned)                                     |
