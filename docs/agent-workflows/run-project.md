# Run Project

## Purpose

Starts the Interview Coach backend (port 8000) and frontend (port 3000) from a clean state — detecting OS, verifying prerequisites, fixing what is missing, and reporting both URLs once both services are running.

**Does not:** modify application code, manage deployments, or run tests. Scope is exclusively starting the local development stack.

---

## Preparation

Before running anything, the agent must confirm with the user:

> "Ready to start Interview Coach. This will launch the backend (port 8000) and frontend (port 3000).
> Before I start — have you accepted the Groq Orpheus TTS terms for your account? This is required for the interviewer voice. Visit https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english to accept if you haven't yet.
> Confirm start?"

Only after the user confirms does the agent proceed. The agent starts both services without any terminal input from the user.

**Required order:** detect OS → check OS prerequisites → fix OS prerequisites → assess project state → fix project prerequisites → start backend → start frontend → report.

---

## Constraints

- **Hard stop — missing env:** If `backend/.env` is missing or `GROQ_API_KEY` is not set, tell the user and do not start.
- **Hard stop — unknown port occupant:** If port 8000 or 3000 is occupied by an unrecognized process, identify the process and ask the user before killing it.
- **Hard stop — missing OS prerequisites:** Python, Node.js, pnpm, and ffmpeg must all pass before touching project setup. Tell the user and stop if any are missing.
- Do not start the frontend before `Application startup complete` is confirmed from the backend.
- Do not run `git commit` or `git push` as part of this workflow.
- Do not modify `backend/services/tone_delivery_analyzer/emotion_model.py`.

---

## Step 1 — Detect OS and terminal

Run this first. Every subsequent step uses platform-specific commands — do not skip this.

```bash
uname -s
```

| Result                        | Platform                   | Use commands labeled…        |
| ----------------------------- | -------------------------- | -----------------------------|
| `Darwin`                      | macOS                      | **macOS**                    |
| `Linux`                       | Linux                      | **Linux**                    |
| `MINGW64_NT-*` / `MSYS_NT-*`  | Windows — Git Bash / WSL   | **Windows (Git Bash)**       |
| command not found / error     | Unknown — ask the user     | —                            |

If `uname` is not found or returns an unrecognized value, ask the user:

> "What terminal and OS are you using? For example: Windows PowerShell, Windows Git Bash, macOS Terminal, or Linux."

Use their answer to select the correct platform label for all remaining steps.

Carry the detected platform label through all remaining steps.

---

## Step 2 — Check OS prerequisites

Run all checks in parallel using the commands for the detected platform. All four must pass before touching the venv or any project-level setup.

### Windows (PowerShell)

```powershell
python --version
node --version
pnpm --version
ffmpeg -version
```

### macOS

```bash
brew --version      # Homebrew — required for macOS installs
python3 --version
node --version
pnpm --version
ffmpeg -version
```

### Linux

```bash
python3 --version
node --version
pnpm --version
ffmpeg -version
```

### Windows (Git Bash)

```bash
python --version    # Windows Git Bash — use python, not python3
node --version
pnpm --version
ffmpeg -version
```

If any check fails, go to Step 3. Do not proceed to Step 4 until all pass.

---

## Step 3 — Fix missing OS prerequisites

Address only what failed in Step 2. Hard stops require the user to act — do not proceed past them.

### Homebrew missing (macOS only)

Homebrew is required on macOS to install Python, ffmpeg, and other tools. **Hard stop** — tell the user and do not install programmatically.

> "Homebrew is required on macOS. Install it by running this in Terminal:
> `/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"`
> After it finishes, follow any instructions it prints about adding brew to your PATH (this is required on Apple Silicon Macs). Then open a new terminal and try again."

> **Apple Silicon (M1/M2/M3):** Homebrew installs to `/opt/homebrew` instead of `/usr/local`. The installer prints the exact PATH commands to run — do not skip that step or `brew` will not be found in new terminals.

After Homebrew is installed, re-run `brew --version` to confirm, then continue with the checks below.

### Python missing or wrong version

Minimum: Python 3.9. **Hard stop** — tell the user and do not install programmatically.

| Platform          | Instruction                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| Windows           | Download from https://python.org/downloads — check "Add Python to PATH" during install, then restart terminal |
| macOS             | `brew install python3` (requires Homebrew — see above) or download from https://python.org/downloads     |
| Linux             | `sudo apt install python3 python3-venv` (or distro equivalent)                                          |

After installing, open a new terminal and re-run `python3 --version` (or `python --version` on Windows) before continuing.

### Node.js missing or wrong version

Minimum: Node.js 18 (LTS). **Hard stop** — tell the user and do not install programmatically.

All platforms: download from https://nodejs.org and choose the LTS release. After installing, open a new terminal and re-run `node --version`.

### pnpm missing

Requires Node.js to be installed first.

```bash
npm install -g pnpm
```

Same command on all platforms. Verify with `pnpm --version`.

### ffmpeg missing

ffmpeg must be installed at the OS level and on the system PATH. Without it the backend cannot decode audio — transcription and emotion analysis fail silently at request time even though the backend starts fine.

| Platform          | Install command                                            | Notes                                          |
| ----------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| Windows           | `choco install ffmpeg` (requires an admin terminal)        | Restart the terminal after installing           |
| macOS             | `brew install ffmpeg`                                      |                                                |
| Ubuntu / Debian   | `sudo apt install ffmpeg`                                  |                                                |
| Fedora / RHEL     | `sudo dnf install ffmpeg`                                  |                                                |
| Arch              | `sudo pacman -S ffmpeg`                                    |                                                |

After installing, verify with `ffmpeg -version`. On Windows you must open a new terminal before ffmpeg is on the PATH.

**Hard stop:** provide the platform-specific install command, then wait for the user to confirm it is installed and `ffmpeg -version` passes before continuing.

---

## Step 4 — Assess project state

Once all OS prerequisites pass, run these checks in parallel.

### Windows (PowerShell)

```powershell
# venv exists?
Test-Path venv

# Backend deps installed?
venv\Scripts\python -c "import fastapi, groq, uvicorn"

# backend/.env present and GROQ_API_KEY set?
Test-Path backend\.env
(Get-Content backend\.env) -match "GROQ_API_KEY=."

# Frontend node_modules installed?
Test-Path frontend\node_modules

# Ports free?
netstat -an | Select-String ":8000.*LISTENING"
netstat -an | Select-String ":3000.*LISTENING"
```

### Windows (Git Bash)

```bash
test -d venv && echo "venv:ok" || echo "venv:missing"
venv/Scripts/python -c "import fastapi, groq, uvicorn" 2>/dev/null && echo "deps:ok" || echo "deps:missing"
test -f backend/.env && grep -q "GROQ_API_KEY=." backend/.env && echo "env:ok" || echo "env:missing"
test -d frontend/node_modules && echo "node_modules:ok" || echo "node_modules:missing"
netstat -an | grep ":8000" | grep -q LISTEN && echo "port8000:busy" || echo "port8000:free"
netstat -an | grep ":3000" | grep -q LISTEN && echo "port3000:busy" || echo "port3000:free"
```

### macOS / Linux

```bash
test -d venv && echo "venv:ok" || echo "venv:missing"
venv/bin/python -c "import fastapi, groq, uvicorn" 2>/dev/null && echo "deps:ok" || echo "deps:missing"
test -f backend/.env && grep -q "GROQ_API_KEY=." backend/.env && echo "env:ok" || echo "env:missing"
test -d frontend/node_modules && echo "node_modules:ok" || echo "node_modules:missing"
lsof -i :8000 > /dev/null 2>&1 && echo "port8000:busy" || echo "port8000:free"
lsof -i :3000 > /dev/null 2>&1 && echo "port3000:busy" || echo "port3000:free"
```

---

## Step 5 — Fix missing project prerequisites

Run only what is needed based on Step 4. Do not re-run steps that already passed.

### venv missing

**Windows (PowerShell / Git Bash):**
```bash
python -m venv venv
```

**macOS / Linux:**
```bash
python3 -m venv venv
```

### Python dependencies missing

Activate the venv first, then install.

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

**Windows (Git Bash):**
```bash
source venv/Scripts/activate
pip install -r backend/requirements.txt
```

**macOS / Linux:**
```bash
source venv/bin/activate
pip install -r backend/requirements.txt
```

This may take several minutes on first run — torch and transformers are large. Inform the user.

### backend/.env missing or GROQ_API_KEY not set

**Hard stop.** Tell the user:
> "backend/.env is missing or GROQ_API_KEY is not set. Please add your key to backend/.env before running. See backend/.env.example for the format."

Do not start the backend.

### frontend/node_modules missing

Same on all platforms:
```bash
cd frontend && pnpm install
```

### Port already in use

Identify which port is occupied and, if determinable, which process holds it. Ask the user whether to proceed — the existing process may already be the running app. Do not kill an unknown process without asking.

**Windows (PowerShell):**
```powershell
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
Get-Process -Id <OwningProcess>
```

**macOS / Linux / Git Bash:**
```bash
lsof -i :8000
lsof -i :3000
```

---

## Step 6 — Start the backend

Run in background. The emotion model loads at startup — first run downloads ~1 GB and takes longer.

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
cd backend
uvicorn app:app --reload
```

**Windows (Git Bash):**
```bash
source venv/Scripts/activate && cd backend && uvicorn app:app --reload
```

**macOS / Linux:**
```bash
source venv/bin/activate && cd backend && uvicorn app:app --reload
```

Use `run_in_background: true`. Wait for `Application startup complete` in the output before starting the frontend. If startup fails (missing env var, model load error, port conflict), report the error and stop.

---

## Step 7 — Start the frontend

Same command on all platforms. Run in background after backend startup is confirmed.

```bash
cd frontend && pnpm dev
```

Use `run_in_background: true`.

---

## Step 8 — Report to the user

Once both are running, report:

```
Backend:   http://localhost:8000  (API docs: http://localhost:8000/docs)
Frontend:  http://localhost:3000
```

If the emotion model is downloading for the first time, note that the backend will be slow to respond until the download completes (~1 GB).

---

## Output

Once both services are confirmed running, report exactly:

```
Backend:   http://localhost:8000  (API docs: http://localhost:8000/docs)
Frontend:  http://localhost:3000
```

Include a note if the emotion model is still downloading on first run. No other output is required unless an error or hard stop was encountered.

---

## Stopping the project

If the user says "stop the project", "stop the app", or "kill the servers":

**Windows (PowerShell):**
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

**macOS / Linux / Git Bash:**
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

## Error reference

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `python: command not found` | Python not installed or not on PATH | Install Python 3.9+ (Step 3); use `python3` on macOS/Linux |
| `node: command not found` | Node.js not installed or not on PATH | Install Node.js 18+ from nodejs.org (Step 3) |
| `pnpm: command not found` | pnpm not installed | `npm install -g pnpm` (Step 3) |
| `ffmpeg: command not found` / audio fails at runtime | ffmpeg not on PATH | Install ffmpeg (Step 3), restart terminal, verify with `ffmpeg -version` |
| `ModuleNotFoundError: No module named 'fastapi'` | venv not activated or deps not installed | Run Step 5 with platform-correct activate path |
| `OSError: [Errno 98] Address already in use` | Port occupied | Check existing process (Step 5); ask user before killing |
| `groq.AuthenticationError` | GROQ_API_KEY missing or wrong | Check `backend/.env` |
| `ERR_PNPM_OUTDATED_LOCKFILE` | lockfile out of sync | `cd frontend && pnpm install` |
| Backend starts but emotion model never loads | First run downloading weights | Wait — normal on first run, ~1 GB |
| TTS returns 400 or 502 | Orpheus terms not accepted for this Groq account | Visit `https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english` and click Accept |
| Frontend shows "Could not load audio" | Orpheus terms not accepted, or `GROQ_API_KEY` wrong | Check terms first, then verify key in `backend/.env` |
| `venv\Scripts\Activate.ps1 cannot be loaded` | PowerShell execution policy blocks scripts | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` then retry |
