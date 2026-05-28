# Branch Change Impact Audit

## Purpose

Surveys the current branch against `main` to answer: **what changed, which behavior is affected, and are there regression or integration risks?** Produces a factual map of the change set before any quality review begins. When feature flag changes are detected, offers to run `feature-flag-gating-review.md` before continuing.

**Does not:** assess code quality, correctness of implementation, CSS standards, or test quality. Does not propose redesigns or broad fixes — it identifies and describes, it does not prescribe. Code quality is covered by `code-quality-review.md`.

---

## Goal

Produce a factual branch audit based on the final diff and the affected code paths, without making code changes unless explicitly requested.

## Scope

- Compare the current branch against `main` (or the user-specified target branch)
- Review the changed files and any direct consumers or directly affected call sites
- Focus on confirmed behavior and code paths visible from the current branch state
- Do not include changes that were added and later removed

## Audit priorities

### 1. Behavior changes

Identify:

- what behavior changed relative to the target branch
- which paths now behave differently
- which paths remain unchanged

### 2. Regression risk

Check for:

- behavior that no longer matches the target branch where parity was expected
- mixed old/new flows that prevent a clean fallback
- changes that partially switch a feature without fully gating it

### 3. Feature-flag involvement

If the diff touches anything related to feature flags or env-gated behavior (`featureFlag`, `featureGate`, `NEXT_PUBLIC_*` toggles, `flags`, or similar):

- Note which files and call sites are involved
- Ask the user: "Feature flag changes detected. Would you like me to run the feature flag gating review before continuing the audit?"
- If the user says yes, read and run `docs/agent-workflows/feature-flag-gating-review.md` and include its output as a subsection before continuing
- If the user says no, note it and continue the audit without the flag review

If no flag involvement is detected, state that explicitly and continue.

### 4. Integration consistency

Check for:

- mismatched assumptions between components, providers, routes, and config
- changed call sites that no longer match the selected mode or expected flow
- branch changes that require additional coordination outside the touched file

## Constraints

- Do not speculate beyond what can be confirmed from the current diff and adjacent code
- Do not propose broad refactors
- Do not recommend unrelated cleanup
- Keep recommendations minimal and limited to what is necessary to restore the intended behavior

## Required output format

### Branch summary

State briefly:

- what the branch changes overall
- what the intended gated or rollback behavior appears to be from the code and user request

### Confirmed findings

For each confirmed issue, include:

- file
- affected behavior
- why it prevents parity, rollback, or clean gating
- minimal correction needed

### Non-issues

List any changed areas reviewed that do not require correction so the audit is explicit about what is already acceptable.

### Final recommendation

State one of:

- No blocking issues found
- Minor corrections needed
- Rollback or gating is incomplete
- Branch needs structural rework before merge
