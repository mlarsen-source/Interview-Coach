# Feature Implementation Planning

## Purpose

Produces a **structured implementation plan before any code is written** for non-trivial features or integrations — covering scope, schema changes, a complete file manifest, implementation order, integration points, and verification steps. Ensures scope and approach are explicit and agreed before work begins.

**Does not:** write code, make implementation decisions, or review existing code. This workflow produces a plan only. Use it for planning-heavy work — do not treat it as a requirement for every small or isolated fix.

---

## Before planning

**Confirm tracking (optional).** Before producing the plan, ask whether there is a GitHub issue or ticket to reference. Record it in the plan header if provided. Do not block planning if there is none.

---

## Goal

Create a clear implementation plan before code is written so the scope, file impact, and verification steps are explicit.

## Plan contents

Include:

1. Context — why the change is being made
2. Backend API changes — new or changed FastAPI routes, request/response shapes, env vars in `backend/.env`
3. Complete file manifest — every new or changed file, grouped by category
4. Implementation order — phased sequence of work
5. Integration points — where the new code connects to existing systems
6. Verification — how the change will be validated end to end

## File manifest guidance

Group files by category such as:

- backend routers and services (`backend/services/`)
- types files (frontend `types.ts`, backend Pydantic models if used)
- frontend API client modules (`lib/api.ts` or feature `lib/`)
- presentational components + containers + `*.module.css` + `*.stories.tsx`
- App Router pages (`app/`)
- tests (when test runner exists)
- docs (`backend/README.md`, `frontend/AGENTS.md` if conventions change)

## Usage

Use this workflow for planning-heavy work. Do not treat it as a requirement for every trivial edit or small isolated fix.
