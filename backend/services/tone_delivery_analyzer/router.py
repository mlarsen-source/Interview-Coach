import os
import sys
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

# emotion_model.py and run_emotion.py use flat imports designed to run from
# this directory — insert it into sys.path so they resolve correctly.
_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
if _SERVICE_DIR not in sys.path:
    sys.path.insert(0, _SERVICE_DIR)

from emotion_model import load_emotion_model  # noqa: E402
from run_emotion import load_audio, predict_adv  # noqa: E402

_state: dict = {"processor": None, "model": None, "device": None}


def startup() -> None:
    """Load the emotion model once at process start. Called from app.py lifespan."""
    processor, model, device = load_emotion_model()
    _state["processor"] = processor
    _state["model"] = model
    _state["device"] = device


router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "model_loaded": _state["model"] is not None}


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if _state["model"] is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    suffix = os.path.splitext(file.filename or "upload")[1] or ".wav"
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not write upload: {exc}")

    try:
        signal = load_audio(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not decode audio: {exc}")
    finally:
        os.unlink(tmp_path)

    adv, _embedding = predict_adv(
        signal, _state["processor"], _state["model"], _state["device"]
    )
    arousal, dominance, valence = adv.tolist()

    return {"arousal": arousal, "dominance": dominance, "valence": valence}
