import os
import sys
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from groq import Groq
from pydantic import BaseModel

# tone_delivery_analyzer uses flat imports — insert its directory so they resolve.
_EMOTION_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "tone_delivery_analyzer",
)
if _EMOTION_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(_EMOTION_DIR))

from run_emotion import load_audio, predict_adv  # noqa: E402
from services.tone_delivery_analyzer.router import _state as _emotion_state  # noqa: E402

TARGET_SR = 16000
_groq = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

TTS_MODEL = "canopylabs/orpheus-v1-english"
TTS_VOICES = {"autumn", "diana", "hannah", "austin", "daniel", "troy"}
TTS_DEFAULT_VOICE = "hannah"


def _require_groq() -> None:
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured.")


router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice: str = TTS_DEFAULT_VOICE


@router.post("/tts")
async def tts(body: TTSRequest):
    """Converts text to speech using Groq Orpheus and returns WAV audio bytes."""
    _require_groq()
    voice = body.voice if body.voice in TTS_VOICES else TTS_DEFAULT_VOICE
    try:
        response = _groq.audio.speech.create(
            model=TTS_MODEL,
            voice=voice,
            input=body.text,
            response_format="wav",
        )
        audio_bytes = response.read()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"TTS failed: {exc}")

    return Response(content=audio_bytes, media_type="audio/wav")


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    Accepts an audio file. Returns a list of timestamped segments, each with
    the spoken text and per-segment arousal/dominance/valence scores.

    Requires GROQ_API_KEY in the environment and the emotion model loaded.

    Response shape:
        [
          {
            "start": 0.0,
            "end": 2.4,
            "text": "I think the best approach...",
            "arousal": 0.61,
            "dominance": 0.55,
            "valence": 0.32
          },
          ...
        ]
    """
    _require_groq()
    if _emotion_state["model"] is None:
        raise HTTPException(status_code=503, detail="Emotion model not loaded yet.")

    suffix = os.path.splitext(file.filename or "upload")[1] or ".wav"
    audio_bytes = await file.read()

    # Write to temp file — needed for both Groq upload and librosa decode.
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not write upload: {exc}")

    try:
        # --- Step 1: Transcribe with Groq Whisper, get segment timestamps ---
        try:
            with open(tmp_path, "rb") as f:
                transcription = _groq.audio.transcriptions.create(
                    file=(file.filename or "audio" + suffix, f),
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],
                )
        except Exception as exc:
            raise HTTPException(
                status_code=502, detail=f"Groq transcription failed: {exc}"
            )

        segments = transcription.segments or []
        if not segments:
            return []

        # --- Step 2: Load full audio for slicing ---
        try:
            full_signal = load_audio(tmp_path)  # float32 array at 16 kHz mono
        except Exception as exc:
            raise HTTPException(
                status_code=422, detail=f"Could not decode audio: {exc}"
            )

    finally:
        os.unlink(tmp_path)

    # --- Step 3: Score each segment with the emotion model ---
    results = []
    for seg in segments:
        start_s: float = seg["start"]
        end_s: float = seg["end"]
        text: str = seg["text"].strip()

        start_i = int(start_s * TARGET_SR)
        end_i = int(end_s * TARGET_SR)
        slice_signal = full_signal[start_i:end_i]

        # Skip segments too short for the model (< 0.1 s → < 1600 samples)
        if len(slice_signal) < 1600:
            continue

        adv, _ = predict_adv(
            slice_signal,
            _emotion_state["processor"],
            _emotion_state["model"],
            _emotion_state["device"],
        )
        arousal, dominance, valence = [round(float(x), 4) for x in adv.tolist()]

        results.append(
            {
                "start": round(start_s, 3),
                "end": round(end_s, 3),
                "text": text,
                "arousal": arousal,
                "dominance": dominance,
                "valence": valence,
            }
        )

    return results
