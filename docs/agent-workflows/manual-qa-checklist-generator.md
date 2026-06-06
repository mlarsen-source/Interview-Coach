# Manual QA Checklist Generator

## Purpose

Generates a **practical, scoped manual testing checklist** based on the current branch diff — preconditions, primary success-path scenarios, edge cases, and mode-dependent checks. Produces a guide a developer or reviewer can run by hand.

**Does not:** automate testing, run test commands, review code quality, or produce a comprehensive test plan. Scope is strictly manual verification of the changed behavior — automated test quality is covered by `test-suite-quality-review.md`.

---

## Goal

Produce a practical QA checklist that a developer, reviewer, or tester can run manually after a change.

## Scope

- Base the checklist on the current branch diff and the affected behavior
- Cover only meaningful user-visible, route-level, or integration-level scenarios
- Prefer a short list of high-value checks over exhaustive coverage

## What to include

### 1. Preconditions

State any setup needed before testing, such as:

- required environment variables (`backend/.env` keys, `NEXT_PUBLIC_API_URL`)
- feature flags or env toggles
- backend running at `http://localhost:8000` with emotion model loaded (first run downloads weights)
- frontend at `http://localhost:3000`
- sample audio file or browser mic permission for recording flows

### 2. Primary scenarios

Include the core success-path checks that confirm the change works as intended.

### 3. Failure or edge scenarios

Include only the failure or edge cases that are realistic and relevant to the changed behavior.

### 4. Mode-dependent checks

If the change depends on behavioral modes or environments, include separate checks for each meaningful mode.

For Interview Coach, always include separate checks for both feedback modes when the recording or feedback pipeline is affected:

- **perQuestion mode** — scorecard appears after each answer via `POST /feedback/generate`; interviewer reads feedback aloud via TTS; user can advance to next question
- **endOfInterview mode** — answers are collected silently across all questions; session scorecard appears after "End Interview" via `POST /feedback/generate-session`; interviewer reads session summary aloud

Also include checks for the full scorecard rendering path: DeliveryScores (arousal/dominance/valence), TranscriptFeedbackScores (clarity/structure/relevance/conciseness), QualitativeFeedback (summary/strengths/improvements/deliveryNotes), and ModelAnswer.

## Constraints

- Do not generate generic QA steps unrelated to the diff
- Do not include low-value or purely theoretical checks
- Do not expand into a full test plan unless explicitly requested

## Required output format

### Setup

- short list of required preconditions

### Verification checklist

Use numbered steps.

Each step should include:

- the action
- the expected result

### Optional follow-up checks

Include only if there are a few additional useful sanity checks that are clearly lower priority than the main checklist.
