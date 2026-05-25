# Speech Emotion Detection (local)

Run a wav2vec 2.0 emotion model on an audio file and get three scores: arousal, dominance, and valence. Everything runs locally — no cloud, API keys, or account required.

Model: [`audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim`](https://huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim), a wav2vec 2.0 model fine-tuned for dimensional emotion recognition.

## Output

The model returns three scores, each approximately 0 to 1:

| Score | ~0.0 | ~0.5 | ~1.0 |
|-------|------|------|------|
| Arousal | calm, low-energy | neutral | excited, agitated |
| Dominance | submissive, controlled | neutral | assertive, forceful |
| Valence | negative, unpleasant | neutral | positive, pleasant |

These are the three axes of the valence-arousal-dominance (VAD) model from affective psychology. Named emotions are regions in this space rather than discrete outputs (for example, anger is high arousal, high dominance, low valence).

## Files

- `run_emotion.py` — the script you run.
- `emotion_model.py` — the model definition, imported by the script. The model has a custom regression head and mean-pooling rather than a standard Hugging Face architecture, so these classes are required for the weights to load. Not run directly.

The setup steps below also generate a `venv/` folder containing the isolated Python environment. This folder is created on your machine, is large, and should not be committed to version control — anyone can recreate it from the install steps. If using git, add `venv/`, `__pycache__/`, and `*.pyc` to a `.gitignore` file.

## Requirements

- Python 3.9+
- ffmpeg (a system program, installed separately from Python)
- ~1 GB disk for the model weights (downloaded on first run)

## Setup

All commands run from a normal terminal — Git Bash on Windows, Terminal on macOS or Linux. Run everything from the project folder.

### 1. Set up the virtual environment

The venv lives at `backend/` level and is shared across all services. Follow the setup steps in [backend/README.md](../../README.md) to create it and install dependencies. Run those steps once, then come back here.

To activate it from this folder:

| Platform / shell | Command |
|------------------|---------|
| macOS / Linux | `source ../../../venv/bin/activate` |
| Windows, Git Bash | `source ../../../venv/Scripts/activate` |
| Windows, PowerShell | `..\..\..\venv\Scripts\Activate.ps1` |

The prompt shows `(venv)` once active.

### 2. Install ffmpeg

ffmpeg decodes audio files. It installs at the operating-system level, not via pip, so it uses your OS package manager rather than `pip`. Use the command for your platform:

| Platform | Command |
|----------|---------|
| macOS | `brew install ffmpeg` |
| Linux (Debian/Ubuntu) | `sudo apt install ffmpeg` |
| Windows | `choco install ffmpeg` |

Each of these runs from a normal terminal, including Git Bash on Windows.

On Windows this uses [Chocolatey](https://chocolatey.org/), a package manager that installs and updates system software from the command line — the equivalent of Homebrew on macOS or apt on Linux. It is the most portable option because `choco` runs directly inside Git Bash, so the same shell is used for every step.

> **Windows: administrator rights required.** Chocolatey installs packages system-wide, which needs elevated permissions. Before running `choco install ffmpeg`, start your terminal (or your code editor, if you are using its integrated terminal) as administrator — right-click it and choose "Run as administrator." A terminal launched without elevation will download the package but fail with an "access denied" error when writing to the system folders. The integrated terminal inherits the editor's privileges, so the editor itself must be started as administrator. (macOS and Linux do not need this; `sudo` in the command handles elevation on Linux.)

After installing, close and reopen the terminal so the PATH updates, then confirm ffmpeg is reachable:

```bash
ffmpeg -version
```

## Usage

With the virtual environment active, pass the path to your audio file. Replace `<your-audio-file>` with the actual filename (for example, `audio_file.m4a`):

```bash
python run_emotion.py <your-audio-file>
```

Accepts `.wav`, `.mp3`, `.m4a`, and other common formats; audio is resampled to 16 kHz mono automatically. The first run downloads the model weights (~1 GB) and caches them for subsequent runs. Hardware (NVIDIA GPU, Apple Silicon, or CPU) is detected automatically; CPU is sufficient.

Use short clips. The model averages emotion across the entire file into one score, so it is designed for clips of a few seconds. Long files (minutes or more) are both slow on CPU and produce a meaningless averaged result. To make a short test clip from a longer file with ffmpeg:

```bash
# Extracts the first 10 seconds as a 16 kHz mono WAV named test_clip.wav.
# -t 10 = duration, -ar 16000 = sample rate, -ac 1 = mono.
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

The embedding is a 1024-dimensional vector summarizing the clip's emotional content, useful as input to a downstream classifier or for similarity comparisons. It can be ignored for basic use.

## Returning to the project

After closing the terminal or editor, the virtual environment is no longer active — activation lasts only for the session in which it was run. Installed packages, ffmpeg, and the downloaded model all persist, so only reactivation is needed:

```bash
# From this folder. The prompt should show (venv) afterward.
source ../../../venv/Scripts/activate   # macOS/Linux: source ../../../venv/bin/activate
python run_emotion.py <your-audio-file>
```

If the script reports a missing module, the venv is almost certainly not active in this session — reactivate and try again. Packages do not need to be reinstalled on restart.

## Disk usage and cleanup

The model weights (~1 GB) are not stored in the project folder. Hugging Face caches them centrally in your home directory (`~/.cache/huggingface`), shared across all projects, which is why they download only once.

```bash
# Check total cache size.
du -sh ~/.cache/huggingface

# List cached models with sizes.
huggingface-cli scan-cache

# Interactively select and delete cached models when finished.
huggingface-cli delete-cache
```

## Interpreting the scores

- The scores are most reliable as relative comparisons (one clip versus another, or one speaker over time) rather than as calibrated absolute values.
- Arousal and dominance are read more reliably from audio than valence. Distinguishing positive from negative affect is difficult from voice alone.
- The "nearest emotion" label is a heuristic based on distance to prototype points, not a model output. The three scores are the actual output.

## Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| `command not found` on activate | Backslash path in Git Bash. Use `source venv/Scripts/activate`. |
| No `(venv)` in prompt | Activation did not run. Re-run the activate command from the project folder. Each new terminal session must activate again. |
| `ffmpeg not found` / audio fails to load | ffmpeg not installed or not on PATH. Install it for your platform (see step 3), restart the terminal, verify with `ffmpeg -version`. |
| `choco: command not found` (Windows) | Chocolatey is not installed, or this shell predates its install. Restart the terminal; if still missing, install Chocolatey from chocolatey.org. |
| Chocolatey "access denied" / admin error | `choco` needs administrator rights. Restart the terminal — or the code editor, if using its integrated terminal — with "Run as administrator," then retry. |
| First-run download slow or failing | The ~1 GB model download needs internet on first run only; re-running resumes from cache. |
| `AttributeError: 'list' object has no attribute 'keys'` on model load | A transformers version mismatch in the weight-tying shim. In `emotion_model.py`, the `_tied_weights_keys` and `all_tied_weights_keys` attributes must be empty dicts (`{}`), not empty lists (`[]`). |
| `ImportError` or version errors | Confirm packages were installed inside the active venv. If transformers errors on the custom model class, run `pip install -U transformers`. |
| GPU out of memory | Force CPU: `CUDA_VISIBLE_DEVICES="" python run_emotion.py <your-audio-file>`. |

## Model notes

- Expects 16 kHz mono audio; the script handles conversion.
- Licensed CC-BY-NC-SA 4.0 (non-commercial use only). A commercially licensed version is available from audEERING.
- Outputs are approximately 0–1; values occasionally fall slightly outside this range and are clamped to [0, 1].
