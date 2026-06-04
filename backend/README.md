# Backend Reference

For setup and running instructions see the [root README](../README.md).

## Endpoints

| Method | Path                 | Status | Description                                              |
|--------|----------------------|--------|----------------------------------------------------------|
| GET    | `/health`            | done   | Liveness check                                           |
| GET    | `/emotion/health`    | done   | Confirms emotion model is loaded                         |
| POST   | `/speech/tts`        | done   | Text → WAV audio via Groq Orpheus TTS                    |
| POST   | `/speech/transcribe` | done   | Audio file → per-segment transcript + emotion scores     |
| POST   | `/emotion/analyze`   | done   | Audio file → single arousal / dominance / valence score  |
| POST   | `/feedback/generate` | todo   | Transcript + scores + question → structured LLM feedback |

## Structure

```
app.py                          — entry point; registers all routers, loads emotion model at startup
requirements.txt                — Python dependencies
services/
  speech_to_text/
    router.py                   — POST /speech/tts and POST /speech/transcribe
  tone_delivery_analyzer/
    router.py                   — POST /emotion/analyze and GET /emotion/health
    emotion_model.py            — model class definitions (do not modify)
    run_emotion.py              — standalone CLI for testing the model directly
  llm/
    router.py                   — POST /feedback/generate (not yet implemented)
  text_analysis/
    router.py                   — reserved for transcript scoring (not yet implemented)
```

## POST /speech/tts

Converts text to speech using Groq Orpheus and returns WAV audio.

**Request body (JSON):**
```json
{ "text": "Hello, welcome to your interview.", "voice": "hannah" }
```

Available voices: `autumn`, `diana`, `hannah`, `austin`, `daniel`, `troy`

`voice` defaults to `hannah` if omitted or invalid.

**Response:** `audio/wav` binary

```bash
curl -X POST http://localhost:8000/speech/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Tell me about yourself.", "voice": "hannah"}' \
  --output question.wav
```

Requires `GROQ_API_KEY` in `backend/.env` and Orpheus terms accepted at `https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english`.

## POST /speech/transcribe

Accepts an audio file. Transcribes via Groq Whisper, slices audio at segment boundaries, and scores each slice with the local emotion model.

**Request:** `multipart/form-data`, field name `file`

**Response:** array of segments

```json
[
  { "start": 0.0,  "end": 2.4, "text": "I think the best approach...", "arousal": 0.61, "dominance": 0.55, "valence": 0.32 },
  { "start": 2.4, "end": 5.1, "text": "would be to first consider...", "arousal": 0.48, "dominance": 0.52, "valence": 0.41 }
]
```

```bash
curl -X POST http://localhost:8000/speech/transcribe \
  -F "file=@path/to/audio.webm"
```

Requires `GROQ_API_KEY` and the emotion model loaded (backend running).

## POST /emotion/analyze

Scores a full audio file as a single arousal / dominance / valence reading. Used for whole-recording analysis; `/speech/transcribe` is preferred for per-segment scores.

**Request:** `multipart/form-data`, field name `file`

**Response:**
```json
{ "arousal": 0.61, "dominance": 0.55, "valence": 0.32 }
```

```bash
curl -X POST http://localhost:8000/emotion/analyze \
  -F "file=@path/to/audio.mp3"
```

## Score interpretation

| Dimension  | Low (→ 0)          | High (→ 1)              |
|------------|--------------------|-------------------------|
| Arousal    | Calm, flat         | Excited, energetic      |
| Dominance  | Hesitant, passive  | Assertive, confident    |
| Valence    | Negative, stressed | Positive, enthusiastic  |
