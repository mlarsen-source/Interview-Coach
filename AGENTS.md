<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Project-wide conventions, patterns, and agent instructions. `CLAUDE.md` points here.

For setup, running both services, and repo structure, see the [root README](README.md).
For system architecture and data flow, see [docs/architecture.md](docs/architecture.md).

---

## Repository instructions

### Project overview

**Interview Coach** is an AI-powered interview coaching platform. The user selects an interviewer persona, listens to a spoken question, records their answer, and receives structured per-segment feedback on delivery, tone, and answer quality.

End-to-end pipeline:

1. Interviewer selected → TTS introduction + question read aloud (`POST /speech/tts`)
2. User records their answer in the browser (MediaRecorder + VAD)
3. Audio → Groq Whisper → timestamped transcript segments (`POST /speech/transcribe`)
4. Each segment → local wav2vec2 emotion model → arousal / dominance / valence scores
5. *(Coming)* Transcript + scores + question → LLM → structured feedback (`POST /feedback/generate`)
6. *(Coming)* Frontend renders full scorecard

The frontend orchestrates the pipeline. The backend exposes stateless single-purpose endpoints.

### Tech stack

| Area             | Technology                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router)                                          |
| Language         | TypeScript (`strict`)                                            |
| UI               | React 19, Tailwind CSS 4                                         |
| Package manager  | pnpm                                                             |
| Lint / format    | ESLint (`eslint-config-next`), Prettier                          |
| Component docs   | Storybook (dependency present; add scripts when configured)      |
| Git hooks        | lefthook (installed via `pnpm install` prepare)                  |
| Backend          | FastAPI (Python)                                                 |
| Text-to-speech   | Groq Orpheus (`canopylabs/orpheus-v1-english`)                   |
| Speech-to-text   | Groq Whisper (`whisper-large-v3-turbo`)                          |
| Tone/delivery    | `audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim` (local)  |
| LLM feedback     | Anthropic Claude (coming)                                        |
| Deploy           | Vercel (frontend, planned) / Render or Fly.io (backend, planned) |

### Monorepo layout

```
Interview-Coach/
  README.md                   — setup, architecture, how to run everything
  AGENTS.md                   — this file; project-wide agent conventions
  CLAUDE.md                   — points to AGENTS.md
  docs/
    architecture.md           — system architecture and data flow
    agent-workflows/          — repeatable AI agent workflow guides
  backend/                    — FastAPI (Python), http://localhost:8000
    app.py
    requirements.txt
    services/
      speech_to_text/         — /speech/tts and /speech/transcribe
      tone_delivery_analyzer/ — /emotion/analyze (local wav2vec2 model)
      llm/                    — /feedback/generate (coming)
      text_analysis/          — reserved (coming)
  frontend/                   — Next.js app, http://localhost:3000
    app/
      page.tsx                — home / interview UI
      InterviewClient.tsx     — interview state machine (recording, VAD, TTS)
      scorecard/              — scorecard display components
      dev/
        flow/                 — pipeline visualization dev page
        transcribe/           — transcription debug page
    lib/
      prompts/
        questions.ts          — question bank (20 questions + intro question)
        interviewers.ts       — interviewer voice personas
      interview-coach/
        types.ts              — shared TypeScript types
        mocks.ts              — mock data for UI development
        pipelineStages.ts     — pipeline stage definitions
```

### Backend integration

- **Base URL (local):** `http://localhost:8000`
- **Interactive docs:** `http://localhost:8000/docs`

| Method | Path                  | Status  | Purpose                                              |
| ------ | --------------------- | ------- | ---------------------------------------------------- |
| GET    | `/health`             | done    | Liveness check                                       |
| GET    | `/emotion/health`     | done    | Confirms emotion model is loaded                     |
| POST   | `/speech/tts`         | done    | Text → WAV audio (Groq Orpheus TTS)                  |
| POST   | `/speech/transcribe`  | done    | Audio → per-segment transcript + emotion scores      |
| POST   | `/emotion/analyze`    | done    | Audio → single arousal / dominance / valence score   |
| POST   | `/feedback/generate`  | coming  | Transcript + scores + question → LLM feedback        |

Call these from the browser via `fetch`. Do not reimplement ML, TTS, or LLM logic in the frontend. Use env-based API base URLs for production (`NEXT_PUBLIC_API_URL`).

### Import conventions

- `@/*` maps to the **frontend project root** (see `frontend/tsconfig.json`), e.g. `@/lib/prompts/questions`.
- Prefer `@/` over deep relative paths (`../../../`).

### Hard rules (never violate)

1. Never run `git commit` or `git push` without explicit user approval.
2. Do not put backend secrets or API keys in frontend code — keys belong in `backend/.env` only.
3. Do not duplicate pipeline logic (Whisper, emotion model, TTS, LLM) in the frontend; use backend endpoints.
4. Use `next/image` for images and `next/link` for internal navigation — not raw `<img>` or `<a>` for in-app routes.
5. Prefer `@/` imports over long relative paths when the alias applies.
6. No inline `style` props in JSX (exception: `*.stories.tsx` for Storybook decorators; dev-only pages under `app/dev/**`).
7. Every new component that has any of its own styles requires `ComponentName.module.css`.
8. Every new reusable component or component with meaningful visual states requires `ComponentName.stories.tsx` with named stories and real mock data.
9. If you modify a component's structural JSX, proactively update its `.module.css` and `.stories.tsx` when those files exist.
10. Do not modify `AGENTS.md` without proposing the change first when the edit reflects new team conventions.
11. Do not modify `backend/services/tone_delivery_analyzer/emotion_model.py` — it is marked do not modify.

---

## Running the project (agent-driven)

### Groq Orpheus TTS — known setup requirement

The interviewer voice uses the Groq Orpheus TTS model (`canopylabs/orpheus-v1-english`). **Each Groq account must accept the model terms once before the endpoint works.** The backend starts without error whether or not terms are accepted — the failure only appears at request time as a 400 from Groq, which the frontend surfaces as "Could not load audio."

**When to raise this proactively:**
- When helping a new user set up the project
- When the user reports the interviewer is silent or sees "Could not load audio"
- Before starting the project (see Running the project section below)
- Any time a user adds a new `GROQ_API_KEY` to their `.env`

**Guidance to give:**
> "To enable the interviewer voice, you need to accept the Groq Orpheus terms once for your account. Go to https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english and click Accept. This is a one-time step — it won't be needed again."

**Symptom if skipped:** backend runs fine, `POST /speech/tts` returns 400, frontend shows "Could not load audio — check the backend is running." Recording and transcription still work; only the voice is affected.

---

## Running the project (agent-driven)

When the user says any of the following — **"run the project"**, **"run the interview coach"**, **"start the project"**, **"start interview coach"**, **"start the app"**, **"launch the project"**, or any close variation — the agent must first confirm with the user:

> "Ready to start Interview Coach. This will launch the backend (port 8000) and frontend (port 3000).
> Before I start — have you accepted the Groq Orpheus TTS terms for your account? This is required for the interviewer voice. Visit https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english to accept if you haven't yet.
> Confirm start?"

Only after the user confirms, follow `docs/agent-workflows/run-project.md` exactly. Do not ask the user to open a terminal or type any commands.

**Required order:**
1. Assess state (venv, deps, `.env`, node_modules, port availability) — all checks in parallel
2. Fix only what is missing
3. Start backend in background — wait for `Application startup complete`
4. Start frontend in background
5. Report both URLs to the user

**Hard stops before starting:**
- `backend/.env` missing or `GROQ_API_KEY` not set → tell the user, do not start
- A port is occupied by an unknown process → ask the user before killing it

**When the user says "stop the project" / "stop the app":** kill the processes on ports 8000 and 3000 using the method in `docs/agent-workflows/run-project.md`.

---

## Development commands

Run from `frontend/` unless noted.

| Task         | Command             |
| ------------ | ------------------- |
| Dev server   | `pnpm dev` → :3000  |
| Production   | `pnpm build`        |
| Start prod   | `pnpm start`        |
| Lint         | `pnpm lint`         |
| Type check   | `pnpm typecheck`    |
| Format       | `pnpm format`       |
| Format check | `pnpm format:check` |

Install hooks: `pnpm install` (runs `lefthook install` via `prepare`).

Git hooks (repo root `lefthook.yml`):

- **pre-commit:** Prettier and Ruff format **staged** files and re-stage fixes (`stage_fixed: true`).
- **pre-push:** ESLint, Prettier check, and TypeScript on the frontend; Ruff check/format on the backend.

Backend: `cd backend && uvicorn app:app --reload` — starts at :8000. First run downloads ~1 GB of model weights.

---

## Environment variables

All secrets live in `backend/.env` (gitignored). See [backend/.env.example](backend/.env.example).

| Variable            | Required | Purpose                                        |
| ------------------- | -------- | ---------------------------------------------- |
| `GROQ_API_KEY`      | Yes      | Groq Whisper (transcription) + Orpheus (TTS)   |
| `ANTHROPIC_API_KEY` | Coming   | Claude LLM feedback (`/feedback/generate`)     |
| `OPENAI_API_KEY`    | No       | Reserved                                       |

Frontend env vars (in `frontend/.env.local` if needed):

| Variable              | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL for production deployments  |

Defaults to `http://localhost:8000` in development when unset.

> **Groq TTS:** Orpheus requires one-time terms acceptance per account at `https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english`.

---

## Code organization

- **API calls:** All backend `fetch` calls originate in components (`InterviewClient.tsx`) using `NEXT_PUBLIC_API_URL` or the localhost default. When the API surface grows, centralize in `frontend/lib/api.ts`.
- **Types:** Shared types in `frontend/lib/interview-coach/types.ts`. Feature-specific types colocated with the feature.
- **Server vs client:** Server Components by default; add `'use client'` only for recording, media APIs, and interactive UI (`InterviewClient.tsx`).
- **State:** React `useState`/`useRef` for recording and session flow. No external state library needed yet.

---

## React and Next.js patterns

### File naming

- Routes: `page.tsx`, `layout.tsx`
- Client entry points: `*Client.tsx` with `'use client'` at the top
- API routes (if added): `route.ts`

### Components and styling

Every new UI component with its own styles uses three files:

1. **`ComponentName.tsx`** — No inline `style` props (except in stories). Tailwind for generic layout; `.module.css` for component-specific look and state variants.
2. **`ComponentName.module.css`** — Required the moment any component-specific style is added.
3. **`ComponentName.stories.tsx`** — Required for reusable UI and any component with distinct visual states. Named stories with real mock props — not empty defaults.

**Tailwind vs module CSS**

- Tailwind in JSX: layout (flex, grid, gap), spacing, display, alignment.
- `.module.css`: hover/focus/disabled/error states, animations, component identity, anything that clutters JSX.
- Do not use `@apply group-hover:*` or `@apply peer-*:*` in `.module.css`.

**Hydration**

- Do not use `suppressHydrationWarning` — fix the root cause. Defer browser-only values (like `Math.random()`) until after mount with `useEffect` + `useState(null)`.

### Storybook

Storybook is listed in `package.json`. Add `storybook` / `build-storybook` scripts when the config is initialized. Colocate `ComponentName.stories.tsx` next to the component.

---

## Agent limitations and escalation

### Do not do autonomously

- `git commit` or `git push` without explicit approval
- Deploy to Vercel or any environment unless asked
- Modify `backend/services/tone_delivery_analyzer/emotion_model.py`
- Commit `.env` files or API keys

### Stop and ask when

- Requirements for session flow, scorecard layout, or question bank content are ambiguous
- A change requires new backend contract fields not yet documented in [backend/README.md](backend/README.md)
- Implementing features that depend on `todo` endpoints before they exist

---

## Git conventions

- Ask before committing or pushing.
- Hooks: pre-commit auto-formats staged files; pre-push runs lint, format check, and typecheck.
- Keep commits focused; match existing message style on the branch.

---

## Domain context

- **Delivery scores:** Arousal, dominance, and valence from the local wav2vec2 model. Communicate as delivery/tone signals — not clinical or diagnostic labels.
- **Transcript:** Timestamped segments from Groq Whisper. Each segment is ~2–5 seconds of natural speech.
- **Feedback:** *(Coming)* Structured LLM output from Claude. Render sections clearly; do not expose raw JSON to users.
- **TTS voices:** Groq Orpheus voices — `autumn`, `diana`, `hannah`, `austin`, `daniel`, `troy`. Mapped to interviewer personas in `frontend/lib/prompts/interviewers.ts`.
- **Question bank:** 20 questions in `frontend/lib/prompts/questions.ts` — 1 intro ("tell me about yourself"), 10 technical, 10 behavioral/soft skill. Always starts with the intro question.

---

## Testing

No frontend test runner is configured yet. When tests are added, colocate with the feature (`ComponentName.test.tsx`) or mirror under `__tests__/`. Prefer behavior-focused tests for recording flow, API error handling, and scorecard rendering.

---

## Key references

| Topic                    | Location                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Full stack setup         | [README.md](README.md)                                                             |
| Architecture & data flow | [docs/architecture.md](docs/architecture.md)                                       |
| Backend endpoints        | [backend/README.md](backend/README.md)                                             |
| Emotion model            | [backend/services/tone_delivery_analyzer/README.md](backend/services/tone_delivery_analyzer/README.md) |
| Frontend scripts         | [frontend/README.md](frontend/README.md)                                           |
| Agent workflows          | [docs/agent-workflows/](docs/agent-workflows/)                                     |

---

## Maintaining AGENTS.md

After features or conventions change, update this file:

- New routes, components, or folder layout → **Monorepo layout** + **Project structure**
- New backend endpoints → **Backend integration**
- New pnpm scripts → **Development commands**
- New env vars → **Environment variables**
- New hard rules or team decisions → **Hard rules**

For task-specific reviews, use workflows in `docs/agent-workflows/`. Invoke explicitly, e.g.:

```
Use docs/agent-workflows/pull-request-description-generator.md for this branch.
```

| Workflow                                | Use when                                       |
| --------------------------------------- | ---------------------------------------------- |
| `pre-merge-full-review.md`              | Full pre-merge review with phase gates         |
| `branch-change-impact-audit.md`         | What changed and regression risks vs `main`    |
| `code-quality-review.md`               | Correctness, conventions, API integration      |
| `css-and-component-standards-review.md` | module.css, Tailwind placement, Storybook      |
| `test-suite-quality-review.md`          | Test simplicity (or Storybook if no tests yet) |
| `manual-qa-checklist-generator.md`      | Manual QA for recording/scorecard flows        |
| `pull-request-description-generator.md` | PR title and description from diff             |
| `feature-implementation-planning.md`    | Plan before non-trivial features               |
| `feature-flag-gating-review.md`         | Env/flag gating completeness                   |
| `figma-design-to-code.md`              | Implement UI from Figma                        |
| `run-project.md`                        | Start backend + frontend from scratch          |
