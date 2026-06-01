# Test Suite Quality Review

## Purpose

Reviews the **quality and simplicity of the existing test suite** — whether tests are readable, practical, and focused on behavior rather than implementation details. Flags overengineering, unnecessary abstraction, and tests that are too complex for their value.

**Does not:** check for test coverage gaps in newly written code (that is handled by `code-quality-review.md`). Does not run tests or generate new tests. Scope is existing test quality only, not coverage metrics.

**Note:** Interview Coach may not have a frontend test runner configured yet. If no tests exist, state that plainly and limit the review to Storybook story quality per `frontend/AGENTS.md` when `.stories.tsx` files are in scope.

---

## Review goal

- Review tests that already exist in the codebase
- Perform a complete analysis of the current suite regardless of the testing library, framework, or tooling in use
- Include all relevant test types that exist in the project, including unit, integration, component, UI, and end-to-end tests
- Keep simplicity as the primary priority

## Main standard

The ideal test suite is lean, readable, practical, and grounded.

The tests should:

- cover the most important behavior
- feel basic and believable
- avoid looking overbuilt, overly abstracted, or written to impress through volume or polish

The suite should feel like practical human-written work, not an artificial or excessively systematic test system.

## Core review criteria

### 1. Simplicity

Check whether:

- tests are easy to read and follow
- setup is straightforward
- patterns are simpler than necessary or more complex than necessary
- abstractions are justified by the actual needs of the project

### 2. Realism

Check whether:

- tests read like something a student or junior developer would realistically write
- naming is natural and direct
- the suite avoids sounding robotic, overly formal, unnaturally polished, or mechanically uniform

### 3. Scope and restraint

Check whether:

- tests focus on important behavior
- too many tests cover low-value details or implementation details
- repetitive tests could be combined or removed
- the suite stays lean instead of chasing coverage for its own sake

### 4. Test style and structure

Check whether:

- setup and assertions are straightforward
- assertions focus on what matters
- tests avoid too many assertions in one case
- tests verify outcomes and user-visible behavior rather than internal implementation details
- comments are necessary
- mocks, fixtures, wrappers, builders, helpers, or other abstractions are used more than necessary
- setup is more complicated than the feature under test

### 5. Compliance across test types

Apply the same standard to every test category that exists in the project:

- simple
- basic
- practical
- believable
- focused on important behavior
- not overengineered

## End-to-end test review requirements

If end-to-end tests exist, check whether they:

- focus on the most important real user flows
- avoid trying to cover every variation and edge case
- avoid becoming long, fragile, or over-scripted
- avoid excessive setup, orchestration, or custom utilities unless absolutely necessary
- feel like a practical validation of core workflows rather than a large QA automation system

## Specific things to flag

- tests that are too complex for their value
- tests that are too long or dense
- overly abstracted tests
- repetitive tests that should be simplified, combined, or removed
- tests that assert implementation details instead of behavior
- unnatural or robotic wording
- tests that look machine-generated because they are too uniform, polished, or exhaustive
- edge-case tests that add little value
- heavy mocking or setup where simpler approaches would work
- end-to-end tests that try to do too much in one file or flow
- utilities or wrappers that make the suite harder to understand than necessary

## Required output format

### 1. High-level assessment

State clearly:

- whether the suite complies with the simplicity requirement
- whether it feels like realistic student-level work or feels too advanced, overbuilt, or artificial

### 2. Breakdown by test type

Organize into sections only for the test categories that actually exist, such as:

- Unit tests
- Integration tests
- Component or UI tests
- End-to-end tests

### 3. File-by-file or area-by-area review

For each test file or logical group, explain:

- what is working well
- what is too complex
- what feels unnecessary
- what should be simplified
- whether it feels like realistic student-level work
- whether anything should be removed, combined, or rewritten more simply

### 4. Practical recommendations

- Prefer simplification over expansion
- Prefer removing, combining, or toning down tests rather than adding more
- Do not recommend advanced patterns unless absolutely necessary
- Do not recommend adding more tests unless a major critical behavior is completely untested
- If the suite is already acceptable, say so plainly

### 5. Optional rewrite examples

- Only provide a rewrite example if needed
- Keep any example basic and minimal
- Do not rewrite the whole suite unless explicitly asked

## Constraints

- Do not judge the suite based on coverage percentages alone
- Do not reward complexity just because it is thorough
- Do not suggest turning the suite into a professional enterprise-grade testing system
- The target is not perfection
- Err on the side of fewer, simpler, more basic tests even if the suite is less comprehensive than a production-grade strategy

## Final instruction

Review the entire test suite like a practical reviewer whose main goal is to keep the tests grounded, readable, simple, and believable.
