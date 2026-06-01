<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

All frontend conventions, patterns, and agent instructions live here. `CLAUDE.md` is a thin pointer to this file.

For full-project setup, architecture, and running both services, see the [root README](../README.md).

## Repository instructions

### Project overview

**Interview Coach** is an AI-powered interview coaching platform. Users record a spoken answer to an interview question in the browser and receive structured feedback on delivery, tone, and answer quality.

End-to-end pipeline (owned mostly by the Python backend):

1. User records audio in the browser
2. Audio → OpenAI Whisper API → timestamped transcript
3. Audio + transcript → local Audeering wav2vec2 model → delivery scores (arousal, dominance, valence)
4. Transcript + scores + question → LLM → structured feedback
5. Frontend renders a scorecard

The frontend is responsible for capture UX, calling backend APIs, loading states, and presenting results — not for transcription, emotion modeling, or LLM calls.

### Tech stack

| Area            | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| Framework       | Next.js 16 (App Router)                                     |
| Language        | TypeScript (`strict`)                                       |
| UI              | React 19, Tailwind CSS 4                                    |
| Package manager | pnpm                                                        |
| Lint / format   | ESLint (`eslint-config-next`), Prettier                     |
| Component docs  | Storybook (dependency present; add scripts when configured) |
| Git hooks       | lefthook (installed via `pnpm install` prepare)             |
| Deploy          | Vercel (planned)                                            |

**Not in this repo (backend only):** FastAPI, Whisper, wav2vec2 emotion model, Claude/GPT feedback. See [backend/README.md](../backend/README.md).

### Monorepo layout

```
finalAI/
  README.md           — setup, architecture, how to run everything
  backend/            — FastAPI (Python), http://localhost:8000
  frontend/           — this app, http://localhost:3000
  docs/               — proposal and agent workflow docs
```

Run the backend and frontend in separate terminals. Complete root README setup (Python venv, `backend/.env`, `pnpm install`) before developing UI against live APIs.

### Project structure

Current layout (early stage; grow under `app/` as features land):

```
frontend/
  app/
    layout.tsx          — root layout, fonts, global styles
    page.tsx            — home (placeholder until coaching UI exists)
    globals.css         — Tailwind imports and CSS variables
  public/               — static assets
  package.json
  tsconfig.json         — @/* → repository root of frontend/
```

Planned UI areas (names may change; colocate by feature under `app/`):

- Question prompt and recording flow
- Upload / processing states while backend runs pipeline
- Scorecard: delivery scores, transcript highlights, LLM feedback sections

Prefer feature folders (e.g. `app/record/`, `app/scorecard/`) with colocated components over a flat dump of files.

### Backend integration

- **Base URL (local):** `http://localhost:8000`
- **Interactive docs:** `http://localhost:8000/docs`

| Method | Path                 | Status | Purpose                                   |
| ------ | -------------------- | ------ | ----------------------------------------- |
| GET    | `/health`            | done   | Liveness                                  |
| GET    | `/emotion/health`    | done   | Emotion model loaded                      |
| POST   | `/emotion/analyze`   | done   | Audio file → arousal, dominance, valence  |
| POST   | `/speech/transcribe` | todo   | Audio → transcript + word timestamps      |
| POST   | `/feedback/generate` | todo   | Transcript + scores + question → feedback |

Call these from the browser via `fetch` (or a small client module). Do not reimplement ML or LLM logic in the frontend. Use env-based API base URLs when wiring production (e.g. `NEXT_PUBLIC_API_URL`).

Audio capture must produce a format the backend accepts (follow backend service docs when implementing upload).

### Import conventions

- `@/*` maps to the **frontend project root** (see `tsconfig.json`), e.g. `@/app/components/Scorecard`.
- Prefer `@/` over deep relative paths (`../../../`).

### Hard rules (never violate)

1. Never run `git commit` or `git push` without explicit user approval.
2. Do not put backend secrets or API keys in frontend code — keys belong in `backend/.env` only.
3. Do not duplicate pipeline logic (Whisper, emotion model, LLM) in the frontend; use backend endpoints.
4. Use `next/image` for images and `next/link` for internal navigation — not raw `<img>` or `<a>` for in-app routes.
5. Prefer `@/` imports over long relative paths when the alias applies.
6. No inline `style` props in JSX (exception: `*.stories.tsx` for Storybook decorators/layout; and dev-only diagnostic pages under `app/dev/**` if added).
7. Every new component that has any of its own styles requires `ComponentName.module.css` — no exceptions for "simple" components. A component with zero styles of its own (thin wrapper composing other styled components) does not need its own `.module.css`; the moment any style is added, create the module file.
8. Every new reusable component or component with meaningful visual states requires `ComponentName.stories.tsx` with a named story per visual state and real mock data (not empty defaults that rely on failed fetches).
9. If you modify a component's structural JSX, proactively update its `.module.css` and `.stories.tsx` when those files exist — do not wait to be asked.
10. Do not modify `AGENTS.md` without proposing the change first when the edit reflects new team conventions.

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

Pre-push hooks (repo root `lefthook.yml`): ESLint, Prettier check, and TypeScript on the frontend; Ruff on the backend. Set `LEFTHOOK=0` to skip in CI if needed.

Script reference: [frontend/README.md](./README.md).

---

## Environment variables

Backend keys live in **`backend/.env`** (gitignored): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`. See root README.

When the UI calls the API across environments, add frontend vars as needed, for example:

| Variable              | Purpose                            |
| --------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL (e.g. production) |

Use a local default of `http://localhost:8000` in development when the var is unset.

---

## Code organization

- **API client:** Centralize backend `fetch` calls in a small module (e.g. `lib/api.ts` or `lib/interview-coach/`) with typed request/response shapes aligned with backend responses.
- **Types:** Colocate feature types in `types.ts` next to the feature, or next to the API client for shared DTOs.
- **Server vs client:** Use Server Components by default; add `'use client'` only for recording, media APIs, and interactive UI.
- **Errors:** Surface user-visible errors from failed API calls; log details with `console.error` in development. Do not swallow failures silently.
- **State:** Prefer React state and context for recording/session flow before adding external state libraries.

---

## React and Next.js patterns

### File naming

- Routes: `page.tsx`, `layout.tsx`
- API routes (if added): `route.ts`
- Client-only subtrees: `*Client.tsx` with `'use client'`

### Components and styling

Every new UI component uses **three files** when it has its own styles or meaningful visual states:

1. **`ComponentName.tsx`** — No inline `style` props (except in stories). Tailwind utilities in JSX for generic layout/spacing; `.module.css` for component-specific look and state variants.
2. **`ComponentName.module.css`** — Required when the component has any styles of its own (colors, borders, state variants, animations). Not required for zero-style wrappers that only compose other components.
3. **`ComponentName.stories.tsx`** — Required for reusable UI and any component with distinct visual states. Each state gets a **named story with explicit mock props** (recording, uploading, scorecard populated, API error, mic denied, etc.).

**Stories must use real mock data.** Pass props directly. Do not rely on network calls, empty states from failed fetches, or bare `Default: Story = {}` as a substitute for real coverage.

**Data-fetching components: presentational + container split**

- **Presentational** (e.g. `Scorecard`, `RecordingControls`) — pure view; takes `loading`, `scores`, `transcript`, `error`, callbacks as props; owns JSX + `.module.css`; stories cover every visual state with mocks.
- **Container** (e.g. `ScorecardPanel`, `RecordPage`) — owns `fetch`, MediaRecorder, and session state; renders the presentational component with live or fetched data. Container stories may be thin; presentational stories carry the visual contract.

**Tailwind vs module CSS**

- **Tailwind in JSX:** generic layout (flex, grid, gap), spacing, display, alignment, visibility.
- **`.module.css`:** hover/focus/disabled/error states, animations, component-specific visual identity, anything that would clutter JSX with long class strings.
- A component using only Tailwind with no `.module.css` is missing its module file if it has component-specific styles anywhere.
- Do not put `group-hover:`, `peer-hover:`, or similar parent-context variants in JSX — use `:global(.group):hover .className` in the module file. Do not use `@apply group-hover:*` or `@apply peer-*:*` in `.module.css` (CSS module scoping breaks these).

**Design tokens**

- Prefer CSS variables from `app/globals.css` over hard-coded hex, spacing, or font sizes.
- If Figma or design uses a raw value, map to the nearest existing token; flag gaps rather than silently hard-coding.

**Accessibility**

- Recording controls: visible labels, keyboard operability, clear focus styles, permission-denied and error states in stories.
- Scorecard and feedback text: semantic headings, sufficient contrast; do not rely on color alone for state.

**Hydration**

- Do not use `suppressHydrationWarning` to silence mismatches — fix the root cause (defer browser-only values until after mount when needed).

External links may use `<a>` with `target="_blank"` and `rel="noopener noreferrer"`; internal routes use `next/link`.

### Storybook

- Storybook is listed in `package.json`; add `storybook` / `build-storybook` scripts when the config is initialized.
- Colocate `ComponentName.stories.tsx` next to the component.
- Interview Coach stories to plan for as UI grows: `RecordingControls` (idle, recording, paused, permission denied), `ProcessingStatus` (transcribing, analyzing, generating feedback), `DeliveryScores` (loading, populated), `Scorecard` (empty, partial, full, error).

### Data fetching

- For backend calls from Client Components, use `fetch` to `NEXT_PUBLIC_API_URL` or localhost default.
- For secrets or server-only aggregation, use Server Components or Route Handlers — never expose backend API keys to the client.

---

## Agent limitations and escalation

### Do not do autonomously

- `git commit` or `git push` without explicit approval
- Deploy to Vercel or any environment unless asked
- Change `backend/` emotion model code (`emotion_model.py` is marked do not modify)
- Commit `.env` files or API keys

### Stop and ask when

- Requirements for recording format, session flow, or scorecard layout are ambiguous
- A change needs new backend contract fields not yet in [backend/README.md](../backend/README.md)
- Implementing features that depend on todo endpoints (`/speech/transcribe`, `/feedback/generate`) before they exist

---

## Git conventions

- Ask before committing or pushing.
- Pre-push: lefthook runs frontend lint, format check, and typecheck (see `lefthook.yml` at repo root).
- Keep commits focused; match existing message style on the branch when one exists.

---

## Domain context

- **Delivery scores:** Arousal, dominance, and valence from the local wav2vec2 model — communicate as delivery/tone signals, not as clinical or diagnostic labels unless product copy says otherwise.
- **Transcript:** Timestamped text from Whisper; UI may show highlights or pacing once word timestamps exist.
- **Feedback:** Structured LLM output (Claude or GPT-4o via backend) — render sections clearly; avoid presenting raw model JSON to users.
- **Recording UX:** Browser MediaRecorder (or equivalent); handle permission denial, unsupported browsers, and upload failures gracefully.

---

## Testing

- No frontend test runner is configured yet. When tests are added, colocate with the feature (`ComponentName.test.tsx` next to the component) or mirror paths under `__tests__/` at the frontend root.
- Prefer behavior-focused tests for recording flow, API client error handling, and scorecard rendering with mock props.
- Only add tests when they cover realistic regression risk — not trivial render-only smoke tests.

---

## Key references

| Topic                         | Location                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Full stack setup              | [../README.md](../README.md)                                                                                                   |
| Backend endpoints             | [../backend/README.md](../backend/README.md)                                                                                   |
| Emotion model                 | [../backend/services/tone_delivery_analyzer/README.md](../backend/services/tone_delivery_analyzer/README.md)                   |
| Frontend scripts              | [README.md](./README.md)                                                                                                       |
| CSS/component review workflow | [../docs/agent-workflows/css-and-component-standards-review.md](../docs/agent-workflows/css-and-component-standards-review.md) |
| Agent workflows               | [../docs/agent-workflows/](../docs/agent-workflows/)                                                                           |

---

## Maintaining AGENTS.md

After features or conventions change, update this file so new sessions stay accurate:

- New routes, components, or folder layout → **Project structure**
- New `pnpm` scripts → **Development commands**
- New frontend env vars → **Environment variables**
- New or changed backend contracts → **Backend integration**
- New hard rules or team decisions → **Hard rules** or relevant section

For task-specific reviews (PR text, branch audit, code quality), use workflows in `docs/agent-workflows/` rather than bloating this file. Invoke explicitly, e.g.:

```md
Use docs/agent-workflows/pull-request-description-generator.md for this branch.
```

See [docs/agent-workflows/README.md](../docs/agent-workflows/README.md) for the full list.

| Workflow                                | Use when                                       |
| --------------------------------------- | ---------------------------------------------- |
| `pre-merge-full-review.md`              | Full pre-merge review with phase gates         |
| `branch-change-impact-audit.md`         | What changed and regression risks vs `main`    |
| `code-quality-review.md`                | Correctness, conventions, API integration      |
| `css-and-component-standards-review.md` | module.css, Tailwind placement, Storybook      |
| `test-suite-quality-review.md`          | Test simplicity (or Storybook if no tests yet) |
| `manual-qa-checklist-generator.md`      | Manual QA for recording/scorecard flows        |
| `pull-request-description-generator.md` | PR title and description from diff             |
| `feature-implementation-planning.md`    | Plan before non-trivial features               |
| `feature-flag-gating-review.md`         | Env/flag gating completeness                   |
| `figma-design-to-code.md`               | Implement UI from Figma                        |
