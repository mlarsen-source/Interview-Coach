# Backend Reference

For setup and running instructions see the [root README](../README.md).

## Endpoints

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/health` | done | liveness check |
| GET | `/emotion/health` | done | confirms emotion model is loaded |
| POST | `/emotion/analyze` | done | upload audio → arousal / dominance / valence |
| POST | `/speech/transcribe` | todo | upload audio → transcript + word timestamps |
| POST | `/feedback/generate` | todo | transcript + scores → structured feedback |

## Structure

```
app.py              — entry point; registers all routers, loads emotion model at startup
requirements.txt    — Python dependencies
services/
  tone_delivery_analyzer/
    router.py       — POST /emotion/analyze
    emotion_model.py — model class definitions (do not modify)
    run_emotion.py  — standalone CLI for testing the model directly
  speech_to_text/
    router.py       — POST /speech/transcribe (not yet implemented)
  llm/
    router.py       — POST /feedback/generate (not yet implemented)
```

## Test /emotion/analyze

```bash
curl -X POST http://localhost:8000/emotion/analyze \
  -F "file=@path/to/audio.mp3"
```

Expected response:

```json
{"arousal": 0.61, "dominance": 0.55, "valence": 0.32}
```
