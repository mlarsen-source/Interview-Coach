# Run Project Workflow

**Trigger phrases:** "run the project", "run the interview coach", "run the interview project", "start the project", "start interview coach", "start the app", "launch the project", or any close variation.

**Before running anything**, the agent must confirm with the user:

> "Ready to start Interview Coach. This will launch the backend (port 8000) and frontend (port 3000). Confirm?"

Only after the user confirms does the agent proceed. The agent starts both services without any terminal input from the user. It must assess current project state first and run only what is necessary.

---

## Step 1 — Assess project state

Run all checks in parallel before doing anything:

```bash
# 1. Does the Python venv exist?
test -d venv && echo "venv:ok" || echo "venv:missing"

# 2. Are backend dependencies installed? (spot-check key packages)
venv/Scripts/python -c "import fastapi, groq, uvicorn" 2>/dev/null && echo "deps:ok" || echo "deps:missing"

# 3. Does backend/.env exist and have GROQ_API_KEY set?
test -f backend/.env && grep -q "GROQ_API_KEY=." backend/.env && echo "env:ok" || echo "env:missing"

# 4. Are frontend node_modules installed?
test -d frontend/node_modules && echo "node:ok" || echo "node:missing"

# 7. Has the user confirmed Groq Orpheus terms? (cannot check programmatically — ask explicitly)
# See Step 2 below for how to handle this.

# 5. Is port 8000 already in use?
netstat -an 2>/dev/null | grep ":8000" | grep LISTEN && echo "port8000:busy" || echo "port8000:free"

# 6. Is port 3000 already in use?
netstat -an 2>/dev/null | grep ":3000" | grep LISTEN && echo "port3000:busy" || echo "port3000:free"
```

On Windows use PowerShell equivalents:
```powershell
Test-Path venv
venv\Scripts\python -c "import fastapi, groq, uvicorn"
Test-Path backend\.env
(Get-Content backend\.env) -match "GROQ_API_KEY=."
Test-Path frontend\node_modules
netstat -an | Select-String ":8000.*LISTENING"
netstat -an | Select-String ":3000.*LISTENING"
```

---

## Step 2 — Fix missing prerequisites

Run only what is needed based on Step 1 results. Do not re-run steps that already passed.

### venv missing
```bash
python -m venv venv
```

### Python dependencies missing
```bash
source venv/Scripts/activate   # Windows Git Bash
# venv/bin/activate             # macOS / Linux
pip install -r backend/requirements.txt
```
This may take several minutes on first run (torch, transformers are large). Inform the user.

### backend/.env missing or GROQ_API_KEY not set
**Stop and tell the user.** Do not attempt to start the backend.
Message: "backend/.env is missing or GROQ_API_KEY is not set. Please add your key to backend/.env before running. See backend/.env.example for the format."

### Groq Orpheus TTS terms not accepted
This cannot be checked programmatically. **Always ask during the confirmation step** (before Step 1 checks run):

> "Before I start — have you accepted the Groq Orpheus TTS terms for your account? This is a one-time step required for the interviewer voice to work. Visit https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english and click Accept if you haven't yet."

- If the user says **yes / already done**: proceed normally.
- If the user says **no / not yet**: direct them to accept first, then re-confirm before starting.
- If the user is **unsure**: tell them to visit the URL and check — it's safe to visit even if terms are already accepted (the banner simply won't appear).

**Symptom if skipped:** the backend starts without error, but every call to `POST /speech/tts` returns a 400 and the frontend shows "Could not load audio — check the backend is running." The recording flow still works; only the interviewer voice is silent.

### frontend/node_modules missing
```bash
cd frontend && pnpm install
```

### Port already in use
Inform the user which port is occupied and by what process if determinable. Ask whether to proceed (the existing process may already be the running app).

---

## Step 3 — Start the backend

Run in background. The emotion model loads at startup — first run downloads ~1 GB and takes longer.

```bash
# Bash
source venv/Scripts/activate && cd backend && uvicorn app:app --reload
```

```powershell
# PowerShell
venv\Scripts\activate; cd backend; uvicorn app:app --reload
```

Use `run_in_background: true`. Wait for the `Application startup complete` message before starting the frontend. Monitor the output — if startup fails (missing env var, model load error, port conflict), report the error and stop.

---

## Step 4 — Start the frontend

Run in background after backend startup is confirmed.

```bash
cd frontend && pnpm dev
```

Use `run_in_background: true`.

---

## Step 5 — Report to the user

Once both are running, report:

```
Backend:   http://localhost:8000  (API docs: http://localhost:8000/docs)
Frontend:  http://localhost:3000
```

If the emotion model is downloading for the first time, note that the backend will be slow to respond until the download completes (~1 GB).

---

## Stopping the project

If the user says "stop the project", "stop the app", or "kill the servers":

1. Find uvicorn and the Next.js dev server processes
2. Terminate them

```bash
# Bash — find and kill by port
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

```powershell
# PowerShell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

---

## Error reference

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | venv not activated or deps not installed | Run Step 2 |
| `OSError: [Errno 98] Address already in use` | Port occupied | Check existing process; kill or use different port |
| `groq.AuthenticationError` | GROQ_API_KEY missing or wrong | Check `backend/.env` |
| `ERR_PNPM_OUTDATED_LOCKFILE` | lockfile out of sync | Run `cd frontend && pnpm install` |
| Backend starts but emotion model never loads | First run downloading weights | Wait — normal on first run, ~1 GB |
| TTS returns 400 or 502 | Orpheus terms not accepted for this Groq account | Visit `https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english` and click Accept |
| Frontend shows "Could not load audio" | Orpheus terms not accepted, or `GROQ_API_KEY` wrong | Check terms first (see above), then verify key in `backend/.env` |
