"""
run_emotion.py  —  PART A: emotion model only, on one audio file.

Usage:
    python run_emotion.py path/to/audio.wav

Outputs arousal / dominance / valence and a rough nearest-emotion guess.
Handles resampling to 16 kHz mono automatically.
"""

import sys
import numpy as np
import torch
import librosa

from emotion_model import load_emotion_model

TARGET_SR = 16000


def load_audio(path, target_sr=TARGET_SR):
    # librosa loads, resamples, and downmixes to mono in one call
    signal, _ = librosa.load(path, sr=target_sr, mono=True)
    return signal.astype(np.float32)


def predict_adv(signal, processor, model, device):
    inputs = processor(signal, sampling_rate=TARGET_SR, return_tensors="pt")
    input_values = inputs.input_values.to(device)
    with torch.no_grad():
        embedding, logits = model(input_values)
    adv = logits.squeeze().cpu().numpy()  # shape (3,)
    emb = embedding.squeeze().cpu().numpy()  # shape (1024,)
    # clamp the "approximately 0..1" outputs into a clean range
    adv = np.clip(adv, 0.0, 1.0)
    return adv, emb


def nearest_emotion(arousal, dominance, valence):
    """Rough VAD-region heuristic. Coordinates are illustrative, not official."""
    prototypes = {
        "anger": (0.85, 0.80, 0.15),
        "fear": (0.80, 0.25, 0.20),
        "joy": (0.80, 0.65, 0.85),
        "sadness": (0.25, 0.30, 0.20),
        "calm": (0.25, 0.50, 0.75),
        "neutral": (0.50, 0.50, 0.50),
    }
    point = np.array([arousal, dominance, valence])
    best, best_d = None, 1e9
    for name, proto in prototypes.items():
        d = np.linalg.norm(point - np.array(proto))
        if d < best_d:
            best, best_d = name, d
    return best, best_d


def main():
    if len(sys.argv) < 2:
        print("Usage: python run_emotion.py <audio_file>")
        sys.exit(1)
    path = sys.argv[1]

    device = (
        "cuda"
        if torch.cuda.is_available()
        else ("mps" if torch.backends.mps.is_available() else "cpu")
    )
    print(f"Device: {device}")
    print("Loading model (first run downloads ~1GB)...")
    processor, model, device = load_emotion_model(device=device)

    signal = load_audio(path)
    dur = len(signal) / TARGET_SR
    print(f"Loaded {path}  ({dur:.1f}s @ {TARGET_SR} Hz)")

    adv, emb = predict_adv(signal, processor, model, device)
    a, d, v = adv
    emo, dist = nearest_emotion(a, d, v)

    print("\n=== Dimensional emotion (audEERING) ===")
    print(f"  Arousal   : {a:.3f}")
    print(f"  Dominance : {d:.3f}")
    print(f"  Valence   : {v:.3f}")
    print(f"  Embedding : vector of length {emb.shape[0]}")
    print(f"  Nearest emotion (heuristic): {emo}  (distance {dist:.2f})")


if __name__ == "__main__":
    main()
