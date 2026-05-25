# Interview Coach — Backend

FastAPI backend that orchestrates the three services: speech-to-text (Whisper), tone/delivery analysis (Audeering wav2vec2), and LLM feedback (Claude/GPT-4o).

## Setup

From the `backend/` folder:

```bash
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
```

**ffmpeg is also required** — it decodes audio files and is installed at the OS level, not via pip:

| Platform | Command |
|----------|---------|
| Windows | `choco install ffmpeg` (requires admin terminal) |
| macOS | `brew install ffmpeg` |
| Linux | `sudo apt install ffmpeg` |

Verify with `ffmpeg -version` after installing.

## Environment variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

The `.env` file is gitignored — never commit it.

## Run

```bash
uvicorn app:app --reload
```

Server starts at **http://localhost:8000**. The Audeering emotion model loads on startup (~1–2 seconds; first run downloads ~1 GB).

Interactive API docs are at **http://localhost:8000/docs** — FastAPI generates this automatically. You can see all endpoints, send test requests, and view responses directly in the browser without curl or Postman.

## Structure

```
backend/
  app.py              — entry point; registers all routers, loads the emotion model at startup
  requirements.txt    — all Python dependencies
  services/
    tone_delivery_analyzer/
      router.py       — POST /emotion/analyze — accepts audio, returns arousal/dominance/valence
      emotion_model.py — model class definitions (do not modify)
      run_emotion.py  — standalone CLI for testing the model directly
    speech_to_text/
      router.py       — POST /speech/transcribe — Whisper integration (not yet implemented)
    llm/
      router.py       — POST /feedback/generate — LLM feedback (not yet implemented)
    text_analysis/
      router.py       — placeholder
```

Each service is a FastAPI **router** — a self-contained set of endpoints that `app.py` mounts under a URL prefix. Adding a new endpoint means editing the relevant `router.py`; the main `app.py` does not need to change.

## Endpoints

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/health` | done | top-level liveness check |
| GET | `/emotion/health` | done | confirms emotion model is loaded |
| POST | `/emotion/analyze` | done | upload audio → arousal / dominance / valence |
| POST | `/speech/transcribe` | todo | upload audio → transcript + word timestamps |
| POST | `/feedback/generate` | todo | transcript + scores → structured feedback |

## Test /emotion/analyze

```bash
curl -X POST http://localhost:8000/emotion/analyze \
  -F "file=@path/to/audio.mp3"
```

Expected response:
```json
{"arousal": 0.61, "dominance": 0.55, "valence": 0.32}
```
