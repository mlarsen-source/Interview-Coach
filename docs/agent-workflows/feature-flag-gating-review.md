# Feature Flag Gating Review

## Purpose

Verifies that a feature flag **fully controls the intended behavior** and supports clean rollback — no bypassed call sites, no partial gating, no hidden dependencies that prevent the flag from acting as a true on/off switch.

**Does not:** review general code quality, correctness of implementation outside flag gating, CSS, or test quality. Only code paths and dependencies related to the flag are in scope. General code quality is covered by `code-quality-review.md`.

---

## Goal

Verify that a feature flag cleanly separates the enabled and disabled behaviors without mixed-mode execution, bypassed call sites, or hidden dependencies.

## Review scope

- Review the current branch against `main` (or the confirmed target branch)
- Inspect all changed files and directly affected call sites related to the flagged behavior
- Follow the flag through providers, routes, components, helpers, and configuration that participate in the feature

## Review priorities

### 1. Full gating

Check whether:

- all relevant code paths are actually controlled by the flag
- any direct call sites bypass the flag
- providers, routes, and consumers all follow the same mode selection

### 2. Rollback integrity

Check whether:

- turning the flag off restores the previous behavior cleanly
- turning the flag on activates only the new behavior
- the code avoids partial transitions where both flows remain active

### 3. Dependency completeness

Check whether the flagged behavior also depends on:

- env vars
- routes
- auth flows
- provider configuration
- hidden side effects or background sync

Flag any dependency that prevents the flag from being a true switch.

### 4. Mixed-mode risks

Check for:

- old and new APIs both being callable in the same mode
- stale UI messaging
- route availability that does not match runtime mode
- fallback logic that activates the wrong flow

## Constraints

- Do not speculate beyond what can be confirmed in the code
- Do not propose broad redesigns
- Keep recommendations limited to the minimal corrections needed for complete gating

## Required output format

### Flag summary

State:

- the flag under review
- what behavior should happen when it is on
- what behavior should happen when it is off

### Confirmed blockers

For each blocker, include:

- file
- code path or behavior affected
- why the flag does not fully control it
- minimal fix needed

### Confirmed non-blockers

List any reviewed areas that are correctly gated so the review is explicit about what is already safe.

### Verdict

State one of:

- Flagging is complete
- Flagging is mostly complete with minor fixes
- Flagging is incomplete and blocks clean rollback
