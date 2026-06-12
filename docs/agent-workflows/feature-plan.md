# Feature Plan

## Purpose

Produces a **structured implementation plan before any code is written** for non-trivial features or integrations — covering scope, schema changes, a complete file manifest, implementation order, integration points, and verification steps. Ensures scope and approach are explicit and agreed before work begins.

**Does not:** write code, make implementation decisions, or review existing code. This workflow produces a plan only. Use it for planning-heavy work — do not treat it as a requirement for every small or isolated fix.

---

## Preparation

- Read `AGENTS.md` to load project architecture, backend integration contracts, and file/component conventions.
- Confirm tracking (optional): ask whether there is a GitHub issue or ticket to reference. Record it in the plan header if provided. Do not block planning if there is none.

---

## Goal

Create a clear implementation plan before code is written so the scope, file impact, and verification steps are explicit.

## Plan contents

Include:

1. Context — why the change is being made
2. Backend API changes — new or changed FastAPI routes, Pydantic request/response schemas, env vars in `backend/.env`; note which external service is called (Groq Whisper, Groq Orpheus, Groq LLM, or the local wav2vec2 model)
3. Complete file manifest — every new or changed file, grouped by category
4. Implementation order — phased sequence of work
5. Integration points — where the new code connects to existing systems (frontend fetch calls, FastAPI routers, backend services)
6. Verification — how the change will be validated end to end (manual QA with both feedback modes; confirm both /feedback/generate and /feedback/generate-session paths if feedback is involved)

## File manifest guidance

Group files by category such as:

- backend routers and Pydantic schemas (`backend/services/<service>/router.py`, `schemas.py`)
- TypeScript types (`frontend/lib/interview-coach/types.ts`)
- frontend lib helpers (`frontend/lib/interview-coach/`, `frontend/lib/speech/`)
- frontend API client module (`frontend/lib/api.ts` if centralizing fetch calls)
- presentational components + `*.module.css` + `*.stories.tsx`
- App Router pages (`frontend/app/`)
- Storybook stories (no test runner configured; stories are the coverage mechanism)
- docs (`backend/README.md`, `AGENTS.md` if conventions change)

## Output

The plan must include, in order:

1. **Header** — feature name, optional issue/ticket reference
2. **Context** — why the change is being made
3. **Backend API changes** — new or changed routes, schemas, env vars
4. **File manifest** — every new or changed file, grouped by category (see File manifest guidance above)
5. **Implementation order** — phased sequence of work
6. **Integration points** — where the new code connects to existing systems
7. **Verification** — how to validate end to end

## Constraints

- Do not write code as part of the plan output
- Do not make implementation decisions without user input on ambiguous scope
- Do not treat this workflow as required for trivial single-file edits
- Do not begin implementation before the plan is presented and confirmed
