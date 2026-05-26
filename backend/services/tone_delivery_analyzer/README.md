# Speech Emotion Detection (local)

Run a wav2vec 2.0 emotion model on an audio file and get three scores: arousal, dominance, and valence. Everything runs locally — no cloud, API keys, or account required.

Model: [`audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim`](https://huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim), a wav2vec 2.0 model fine-tuned for dimensional emotion recognition.

## Output

The model returns three scores, each approximately 0 to 1:

| Score     | ~0.0                   | ~0.5    | ~1.0                |
| --------- | ---------------------- | ------- | ------------------- |
| Arousal   | calm, low-energy       | neutral | excited, agitated   |
| Dominance | submissive, controlled | neutral | assertive, forceful |
| Valence   | negative, unpleasant   | neutral | positive, pleasant  |

These are the three axes of the valence-arousal-dominance (VAD) model from affective psychology. Named emotions are regions in this space rather than discrete outputs (for example, anger is high arousal, high dominance, low valence).

## Files

- `run_emotion.py` — the script you run.
- `emotion_model.py` — model class definitions, imported by the script. The model has a custom regression head and mean-pooling rather than a standard Hugging Face architecture, so these classes are required for the weights to load. Not run directly.

## Usage

> **Complete root project setup first.** Python, ffmpeg, the venv, and pip dependencies must all be installed before using this service. See the [root README](../../../README.md).

### Activate the venv

From this folder:

| Platform / shell    | Command                                 |
| ------------------- | --------------------------------------- |
| macOS / Linux       | `source ../../../venv/bin/activate`     |
| Windows, Git Bash   | `source ../../../venv/Scripts/activate` |
| Windows, PowerShell | `..\..\..\venv\Scripts\Activate.ps1`    |

The prompt shows `(venv)` once active. Activation is per-session — packages stay installed, you just need to reactivate each time you open a new terminal.

## Run the model

With the venv active, pass the path to your audio file:

```bash
python run_emotion.py <your-audio-file>
```

Accepts `.wav`, `.mp3`, `.m4a`, and other common formats; audio is resampled to 16 kHz mono automatically. The first run downloads the model weights (~1 GB) and caches them for subsequent runs. Hardware (NVIDIA GPU, Apple Silicon, or CPU) is detected automatically; CPU is sufficient.

Use short clips. The model averages emotion across the entire file into one score, so it is designed for clips of a few seconds. Long files produce a meaningless averaged result. To make a short test clip with ffmpeg:

```bash
ffmpeg -i <your-audio-file> -t 10 -ar 16000 -ac 1 test_clip.wav
python run_emotion.py test_clip.wav
```

### Example output

```
Device: cpu
Loading model (first run downloads ~1GB)...
Loaded audio_file.m4a  (3.4s @ 16000 Hz)

=== Dimensional emotion (audEERING) ===
  Arousal   : 0.612
  Dominance : 0.548
  Valence   : 0.317
  Embedding : vector of length 1024
  Nearest emotion (heuristic): anger  (distance 0.28)
```

The embedding is a 1024-dimensional vector summarizing the clip's emotional content, useful as input to a downstream classifier. It can be ignored for basic use.

## Disk usage and cleanup

The model weights (~1 GB) are cached in your home directory (`~/.cache/huggingface`), shared across all projects, which is why they download only once.

```bash
du -sh ~/.cache/huggingface          # check total cache size
huggingface-cli scan-cache           # list cached models with sizes
huggingface-cli delete-cache         # interactively delete cached models
```

## Interpreting the scores

- The scores are most reliable as relative comparisons (one clip versus another) rather than as calibrated absolute values.
- Arousal and dominance are read more reliably from audio than valence. Distinguishing positive from negative affect is difficult from voice alone.
- The "nearest emotion" label is a heuristic based on distance to prototype points, not a model output. The three scores are the actual output.

## Troubleshooting

| Symptom                                                               | Cause and fix                                                                                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No `(venv)` in prompt                                                 | Activation did not run. Re-run the activate command. Each new terminal session must activate again.                                                          |
| `ffmpeg not found` / audio fails to load                              | ffmpeg not installed or not on PATH. See root README, restart the terminal, verify with `ffmpeg -version`.                                                   |
| First-run download slow or failing                                    | The ~1 GB model download needs internet on first run only; re-running resumes from cache.                                                                    |
| `AttributeError: 'list' object has no attribute 'keys'` on model load | A transformers version mismatch. In `emotion_model.py`, `_tied_weights_keys` and `all_tied_weights_keys` must be empty dicts (`{}`), not empty lists (`[]`). |
| `ImportError` or version errors                                       | Confirm packages were installed inside the active venv. If transformers errors on the custom model class, run `pip install -U transformers`.                 |
| GPU out of memory                                                     | Force CPU: `CUDA_VISIBLE_DEVICES="" python run_emotion.py <your-audio-file>`.                                                                                |

## Model notes

- Expects 16 kHz mono audio; the script handles conversion.
- Licensed CC-BY-NC-SA 4.0 (non-commercial use only). A commercially licensed version is available from audEERING.
- Outputs are approximately 0–1; values occasionally fall slightly outside this range and are clamped to [0, 1].
