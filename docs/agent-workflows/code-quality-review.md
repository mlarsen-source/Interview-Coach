# Code Quality Review

## Purpose

Reviews the **quality of the implementation** — correctness, performance, architectural conventions, React patterns, and test coverage gaps. When component or styling files are detected, offers to run the CSS and component standards review.

**Does not:** summarize what changed on the branch (that is `branch-change-impact-audit.md`). Does not audit feature flag gating, generate QA checklists, or perform deep CSS/styling review independently. Those are separate workflows.

---

Perform a strict, scoped code quality review of a feature branch.

## Review intent

- Focus on real issues that affect correctness, production reliability, and maintainability
- Do not comment on style preferences unless they create a concrete maintenance or correctness problem
- Do not invent issues
- State issues plainly and specifically — do not soften findings with hedging language or qualify every point with "consider" or "you might want to"

## Before review

- Read `frontend/AGENTS.md` (and [README.md](../../README.md) for full-stack context) to load project conventions, hard rules, and architecture patterns
- Read commit messages or the PR description to understand the intent of the changes
- Run `git diff --name-only origin/main...HEAD` to enumerate changed files (substitute the confirmed target branch if not `main`)
- Read all changed files
- Identify what each changed file exports and what consumes it
- Read adjacent files to understand existing patterns, conventions, and shared utilities
- **List the 2–3 most relevant adjacent patterns or conventions you found** (e.g. how other tables in the same schema file declare extra config, how other query helpers in the same directory shape their inputs, how other components in the same folder split server/client). These become the comparison baseline for Priority 5 (Convention compliance) and Priority 9 (Database & query-helper checks).
- Briefly state what changed, what depends on it, and what patterns exist in nearby code before listing findings

Do not begin findings until this context step is complete.

## Scope

- Review files changed in the branch (`git diff --name-only origin/main...HEAD`, or the confirmed target)
- Check direct importers of changed exports (one level deep) for broken contracts
- Do not review unrelated legacy code or transitive consumers

## Review priorities

If only a small number of issues can be flagged, prioritize in this order.

### 1. Correctness

Check for:

- logic errors
- broken conditions
- missing edge cases
- invalid assumptions
- incorrect prop or state flow
- race conditions
- unhandled promise rejections
- missing error paths
- `process.env.*` values referenced inside a type-guarded branch without first being extracted to a const — TypeScript does not narrow `process.env` re-reads reliably; the guard may pass but the spread or argument receives `undefined`
- stub or placeholder methods whose parameter types are inconsistent with the method's documented purpose — a method with no callers yet can still have a wrong signature; verify parameters match what the implementation will actually need
- `await` expressions in API route handlers that sit outside any try/catch block — if the awaited call throws, the route bypasses the standard `{ success: false }` JSON error shape and returns a raw Next.js 500; every async operation after the auth check must be covered by a catch block
- stub or placeholder implementations in production code paths that throw unconditionally — a stub reachable by live production requests must return a safe fallback (e.g. 403, 501, or null) rather than throw; throwing is only acceptable in dead code or methods with no real callers on any active request path
- resource allocations that require explicit cleanup — for any resource allocated with an explicit close, cancel, release, or destroy method (e.g. `ImageBitmap.close()`, `ReadableStreamDefaultReader.cancel()`, `AbortController` timers, canvas contexts, sockets, file handles), enumerate every exit path from the enclosing block (success return, throw, early return, implicit fall-through) and verify cleanup fires on each; a cleanup call that exists on the happy path only is a resource leak

Decision rule:

- Flag it if it can cause wrong behavior, data loss, or a crash under a realistic input or state

### 2. Runtime cost and production behavior

For each changed function, identify whether it runs once, per render, per interaction, or per item in a list.

Check for:

- expensive work running more frequently than necessary
- missing memoization where stable inputs cause repeated computation
- missing caching for read-only or slow-changing API responses
- unnecessary recomputation in render bodies
- unnecessary re-renders caused by unstable references
- UI flicker or input instability caused by state management patterns

Decision rule:

- Flag it only if it creates measurable waste at realistic scale

### 3. Deployment and environment safety

Check for:

- environment-dependent code without fallbacks or validation
- environment variables used for a purpose that does not match their semantic role (e.g. a backend-only API key referenced in client code, or `NEXT_PUBLIC_*` used for secrets) — cross-reference against `frontend/AGENTS.md` and the root README; backend keys belong in `backend/.env` only
- build-time versus runtime mismatches
- hardcoded values that should come from configuration
- unnecessary large imports for small utilities
- dead code paths that ship to production
- feature flags or conditional logic without a clear cleanup path

Decision rule:

- Flag it if it could behave differently across environments or fail silently under missing configuration

### 4. Implementation quality

Check for:

- unnecessary complexity
- duplication that creates real maintenance risk
- parallel literal lists in the same module (for example a string-union type maintained alongside a discriminated union with the same variants, or two arrays of the same enum values that must stay in sync)
- duplicate TypeScript types that mirror Zod schemas (or API DTOs) in separate files without `z.infer` or a single source of truth — when both exist, derived types should come from the schema so drift is impossible at compile time
- inconsistent approaches to the same pattern
- JS-managed UI state that native HTML or CSS already handles cleanly

Decision rule:

- Flag it if a future maintainer is likely to misunderstand it or introduce a regression

### 5. Convention compliance

Check changed code against project conventions in `frontend/AGENTS.md`, specifically:

- Duplicating backend pipeline logic (Whisper, emotion model, LLM) in the frontend instead of calling FastAPI endpoints
- API keys or secrets in client bundles (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY` belong in `backend/.env` only)
- Use of `suppressHydrationWarning`
- Inline `style` props in JSX (except `*.stories.tsx` and `app/dev/**` per AGENTS.md)
- Missing `ComponentName.module.css` or `ComponentName.stories.tsx` for new styled or stateful components
- Deep relative imports where the `@/` alias works
- Missing `'use client'` on components that use MediaRecorder, browser APIs, or client-side `fetch` to the backend
- Raw `<img>` or `<a>` for internal navigation instead of `next/image` / `next/link`
- Zod (or equivalent) validation missing from new Next.js Route Handlers that accept body/query input
- Exported async functions missing an explicit return type on public API/client surfaces

Decision rule:

- Flag it if the code violates a documented convention, even if it works correctly

### 6. React structure and rendering

Check for:

- inline functions returning JSX that behave like components but are not structured as components
- components recreated every render without need
- patterns that defeat memoization or block future optimization

Decision rule:

- Flag it when it causes a real rendering problem now or creates a realistic optimization trap

### 7. Test and Storybook coverage gaps

Check for missing coverage only when it affects confidence in behavior changed by the branch.

Examples:

- disabled state changed but not exercised
- controlled or pre-filled input behavior changed but not covered
- edge states relevant to changed logic not covered

For Interview Coach UI changes, flag missing Storybook stories when a presentational component gained new visual states (recording, processing, scorecard error, etc.) without story updates.

For new `fetch` wrappers or API client modules, flag missing tests only when a test runner exists and the failure mode is non-obvious (wrong base URL, unhandled 4xx/5xx, malformed score payload).

Decision rule:

- Only flag missing coverage if it would realistically catch a regression in the changed code. This project may not have a frontend test script yet — if `pnpm test` is not configured, note that and limit findings to Storybook/state coverage per `frontend/AGENTS.md`.

### 8. Comments

- Remove comments that only restate the code
- Flag missing comments only when behavior is non-obvious, intentionally inconsistent, or likely to surprise a future reader — this explicitly includes intentional divergence from a similar pattern elsewhere in the codebase, not just the same directory; if changed code handles a concern differently from how a comparable file handles the same concern, the reason must be documented in a comment; verify this by comparing changed code against the nearest semantically similar file (e.g. another API route that sets cache headers, another utility that builds URLs), not just files in the same folder

### 9. Backend API and frontend integration checks

Run this section when the diff touches `backend/` Python services/routers **or** frontend code that calls the FastAPI backend.

**Backend (`backend/`):**

1. **Router contracts.** New or changed endpoints document method, path, request shape (e.g. multipart audio upload), and response JSON in [backend/README.md](../../backend/README.md) when behavior is user-facing.
2. **Secrets.** No API keys in code — use `backend/.env` and `os.environ` / settings patterns consistent with existing services.
3. **Heavy model code.** Do not modify `emotion_model.py` unless explicitly requested; route changes go through existing analyzer modules.
4. **Error responses.** Failed analysis/transcription/feedback returns a consistent HTTP status and JSON error body; no silent failures or uncaught exceptions leaking stack traces to clients.
5. **File upload safety.** Audio upload endpoints validate content type/size where practical; temp files are cleaned up.

**Frontend (`frontend/`):**

1. **API base URL.** Client calls use `NEXT_PUBLIC_API_URL` with a localhost default — no hard-coded production URLs in source.
2. **No duplicated ML.** Frontend does not call OpenAI/Anthropic directly for pipeline steps owned by the backend.
3. **Upload flow.** Recording/upload uses `FormData` (or equivalent) matching backend expectations; loading and error states are handled in UI.
4. **Typed responses.** Scorecard and pipeline types align with backend response shapes (arousal/dominance/valence, transcript fields, feedback sections).
5. **Presentational/container split.** Data-fetching pages do not embed large presentational JSX without a story-friendly presentational child.

Decision rule:

- Flag failures that would break the record → analyze → scorecard flow or leak secrets.

### 10. New API route security

Run this section whenever the diff contains a new file under `app/api/` or `pages/api/`.

For each new API route file, perform these checks:

1. **Authentication gate (if applicable).** Interview Coach may not have auth yet. If the route is documented or intended to be public (health proxies, dev-only), say so. If the route should be protected, confirm an auth check is the first async operation before data access or side effects.

2. **SSRF prevention (outbound routes only).** If the route makes any outbound HTTP request (via `fetch`, `http.request`, `https.request`, or any HTTP client), confirm:
   - A blocklist or allowlist is applied before the request is made and after any DNS resolution
   - For IP blocklists: cross-reference against the complete IANA IPv4 Special-Purpose Address Registry. The minimum complete set is: `0.0.0.0/8` ("this" network), `10.0.0.0/8` (RFC1918), `100.64.0.0/10` (CGNAT), `127.0.0.0/8` (loopback), `169.254.0.0/16` (link-local), `172.16.0.0/12` (RFC1918), `192.0.0.0/24` (IANA special), `192.0.2.0/24` (TEST-NET-1), `192.88.99.0/24` (6to4 relay), `192.168.0.0/16` (RFC1918), `198.18.0.0/15` (benchmarking), `198.51.100.0/24` (TEST-NET-2), `203.0.113.0/24` (TEST-NET-3), `224.0.0.0/4` (multicast), `240.0.0.0/4` (reserved). A blocklist covering only RFC1918 + loopback is incomplete.
   - DNS resolution happens before the request is made so attacker-controlled DNS cannot redirect to a private address after the blocklist check passes

3. **Cache-Control semantics.** If the route sets a `Cache-Control` response header, verify the directive matches the route's sensitivity (user-specific coaching data must use `private` or `no-store`, not `public`).

4. **Input validation.** Confirm all query params, path params, and request body fields are validated (Zod or equivalent) before use. Unvalidated string params passed to database queries, file paths, or outbound URLs are injection vectors.

5. **Response size and content-type limits.** If the route proxies or streams external content:
   - A maximum byte limit must be enforced during streaming (not just on `Content-Length`, which can be omitted or spoofed)
   - The upstream `Content-Type` must be validated against an allowlist before being forwarded to the client

6. **Error shape consistency.** Confirm all error paths return the project-standard `{ success: false, error: "..." }` JSON shape. Any `await` outside a try/catch bypasses this shape and returns a raw Next.js 500 — covered by Priority 1, but re-verify here for new routes since the full surface is being established for the first time.

Decision rule:

- Each check above is a security or correctness requirement. Flag every failure.

## Constraints

- Flag the structural concern and its impact, but do not propose redesigns
- Do not rewrite code or provide full patches
- Do not suggest replacing one dependency with another for stylistic reasons. Do flag any newly introduced dependency that is deprecated (marked deprecated by its maintainer), unmaintained (no releases or meaningful activity in over 2 years), or archived — these are correctness and security risks, not preferences
- Do not comment on personal preferences

## Validation

Changed files are those returned by `git diff --name-only origin/main...HEAD` (or the confirmed target). Run from `frontend/` when the diff includes frontend files; from `backend/` for Python-only changes. Report results for each command that exists:

- `pnpm test` / `pnpm test -- --findRelatedTests <files>` — only if a `test` script exists in `frontend/package.json`; otherwise state "not configured"
- `pnpm typecheck` (frontend)
- `pnpm lint` (frontend)
- `pnpm build` (frontend)
- `ruff check .` and `ruff format --check .` (backend, when backend files changed)

If a command is unavailable or fails to execute, state which one and why.

## Required output format

### Context

State briefly:

- what changed
- what consumes it
- what patterns exist in adjacent code

### Validation Results

- tests — pass / fail / not run (reason)
- lint — pass / fail / not run (reason)
- types — pass / fail / not run (reason)
- build — pass / fail / not run (reason)

### Findings

#### Critical / High severity

For each issue, include:

- severity
- file and location
- issue
- why it matters
- recommendation in one directional sentence, not a patch

#### Medium / Low severity

Use compact entries:

- `file:location` — issue description (`severity`)

### What could not be verified

This section must not be empty. Include at minimum:

- Whether recording/upload behaves correctly with slow networks or concurrent tab usage (if applicable)
- Whether `backend/.env` and `NEXT_PUBLIC_API_URL` (or equivalent) are configured for the environments under test
- Any consumer files that import changed exports but were not reviewed
- Visual or UI behavior that cannot be verified without running the app

### Verdict

Use one of:

- **Ship** — No issues, or only nitpicks with no correctness or reliability impact
- **Ship with follow-ups** — Issues found that should be tracked but do not block merge
- **Fix before merge** — Issues that affect correctness, reliability, or convention compliance
- **Requires rework** — Fundamental approach problems that cannot be resolved with targeted fixes

## After the verdict — CSS and component review

Check the changed file list for any `.tsx`, `.jsx`, `.module.css`, or `.stories.tsx` files.

If any are present, ask the user: "Component or styling files were changed. Would you like me to run the CSS and component standards review now?"

- If yes, read and run `docs/agent-workflows/css-and-component-standards-review.md` and present its output as a separate section.
- If no, note that the CSS review was declined and conclude.

If no component or styling files are present, state "No component or styling files changed — CSS review not applicable" and conclude.
