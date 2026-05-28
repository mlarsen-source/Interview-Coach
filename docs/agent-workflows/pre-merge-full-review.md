# Pre-Merge Full Review

## Purpose

Orchestrates **all review phases in sequence**, pausing after each for explicit user approval before proceeding. Covers branch change impact, code quality, CSS/component standards, test suite quality, and feature flag gating. Always concludes with a mandatory PR-description decision — generation can be declined, but the decision is never skipped.

**Does not:** perform any review logic itself — it reads and delegates to the individual workflow files. Each sub-workflow can still be invoked independently for targeted reviews. This workflow is the right entry point when a developer wants a complete pre-merge review without manually coordinating the individual workflows.

---

## Output formatting rule (applies to every response in this workflow)

All structured blocks — Session State, Gate Blocks, Coverage Reports, Phase prompts, and the Start Prompt — must be rendered as **formatted markdown** (headers, bold labels, bullet lists). Never wrap these blocks in triple-backtick code fences. Code fences make them harder to read in chat and defeat the purpose of structured output.

---

## Rules of engagement (read every time, re-read at every gate)

These rules govern the entire workflow. They are not suggestions. Re-read them at the start of every phase.

### Rule 1: One phase per response. No exceptions.

A single response covers exactly one phase. After presenting that phase's findings, the response ends with the Gate Block (see below) and stops. The next phase does not begin until the user replies with an explicit go-ahead.

Violations include: running two phases back-to-back, "previewing" the next phase, summarizing findings across phases before the user has gated each one, or generating the PR description before Phase 6 has been gated.

### Rule 2: You are the safety net, not the permission slip.

When the workflow identifies a real issue, the default is **fix it before merge**. You do not:

- Suggest fixing it "in a follow-up PR"
- Suggest "shipping as-is and addressing later"
- Label issues as "optional," "nice-to-have," or "minor enough to defer"
- Frame the gate question as "do you want to address any of these?" — that wording invites skipping

The correct framing at every gate is: **"Here are the issues. I'll fix all of them unless you explicitly waive specific ones. Which, if any, are you waiving and why?"**

The dismissal standard (below) is the only basis for waiving an issue. Developer convenience, merge timing, and companion PRs are not bases for waiving.

**Forbidden phrases.** Do not use any of these or their paraphrases when presenting findings or proposing actions:

- "we can address this in a follow-up"
- "this can be deferred"
- "ship as-is"
- "fix later"
- "non-blocking" (unless the developer has explicitly classified it that way for this specific finding)
- "optional fix"
- "nice to have"
- "low priority enough to skip"

### Rule 3: Approved-change ledger. You may not edit anything not on it.

The moment any edit is proposed and approved, it is added to the **Approved Changes Ledger** (maintained in your responses — see the Session State Block below). Before making any file edit during this workflow, you must:

1. Confirm the edit is on the ledger, or
2. Stop, surface the proposed edit to the user, and wait for explicit approval to add it

Scope creep — fixing "while I'm in there," refactoring adjacent code, renaming for consistency, removing unused imports not flagged in a finding — is forbidden. If you notice something not in scope, add it as a **new finding for user decision**, not as a silent edit.

### Rule 4: Respect intentional-behavior comments.

Before editing any code, scan the surrounding context (at minimum: the function, class, or block containing the target, plus 10 lines above and below the edit site) for comments that explain or warn about behavior. Examples:

- `// DO NOT REMOVE`, `// intentional`, `// keep this`, `// load-bearing`
- `// This is here because <reason>`
- `// Workaround for <issue>`
- JSDoc/TSDoc explaining why something is structured a particular way
- `// TODO` or `// FIXME` that explains current behavior is deliberate

If any such comment is present near the edit site, you must:

1. Stop before editing
2. Quote the comment to the user
3. Explain how your proposed edit interacts with what the comment describes
4. Ask explicitly: "This comment indicates the current behavior is intentional. Should I still proceed with the edit?"
5. Wait for explicit confirmation

Ignoring or "interpreting around" such comments is a Rule 4 violation. When in doubt, surface and ask.

### Rule 5: Re-read before re-editing.

After any edit to a file, your prior view of that file is stale. Before making another edit to the same file, re-read it. Before continuing to the next phase after any edits were made, re-read every file that was edited.

### Rule 6: Maintain and print the Session State Block at every gate.

At every gate (end of each phase), print the Session State Block (template below). This is how scope is tracked and how drift is prevented.

---

## Session State Block (print at every gate)

---

**Session State**

**Current phase:** \<phase number and name\>  
**Phases remaining:** \<list\>

**Changed files in scope:** \<count\> committed · \<count\> staged · \<count\> unstaged · \<count\> untracked  
**Scope exclusions:** \<list, or "none"\>

**Approved Changes Ledger:**

- \<file path\>: \<what change, when approved\>
- _(none yet)_

**Deferred items:**

- \<finding\>: \<reason for waiver\>
- _(none)_

**Open findings awaiting decision:**

- \<finding 1\>
- \<finding 2\>

---

---

## Gate Block (use at the end of every phase)

Every phase ends with a Gate Block. **Before writing anything, decide which shape applies:**

> **Shape selection rule.** Look at the Open findings list in the Session State Block you just printed. If that list has one or more entries awaiting a decision, use Shape A. If that list is empty for any reason — no issues were found, all findings were fixed inline, all findings were waived, or any combination — use Shape B.
>
> "Open findings" means findings still awaiting a user decision _right now_. Findings that were fixed earlier in this phase are not open — they live in the Approved Changes Ledger, not in the Gate Block. A phase that started with findings and resolved all of them inline is a Shape B phase at the gate, not a Shape A phase with parenthetical filler.

### Forbidden hybrid output

Do not produce a Gate Block that mixes the two shapes. The following patterns are all wrong and will confuse the developer:

- Shape A header ("Findings (must be resolved...)") with a parenthetical "(No open findings)" or "(all fixed)" placeholder where findings would go
- Shape A's "I will fix all findings above unless you waive specific ones" line when there are no findings above
- Shape A's "Tell me how you'd like to proceed" / per-finding action block when there is no finding to act on
- The "Once every finding is resolved..." line from Shape A as the only forward path when there are no findings — Shape A's resolution line presupposes there are findings to resolve; if there are none, use Shape B's natural-language confirmation instead

If you find yourself writing any of those, stop and switch to Shape B before finishing the response.

### Shape A — Findings present

Use when the Open findings list in the Session State Block has one or more entries awaiting a decision.

The Gate Block always includes (in order): the Coverage report from the deterministic floor, deterministic findings, subjective observations, then the reply prompt. Each finding (deterministic or subjective) must be presented with:

- A clear title and description of the issue
- The exact location (file path and line range, or function/component name)
- The **recommended fix**, spelled out concretely enough that the developer can read it and know exactly what would be changed if they approve it as-is
- The **impact if not fixed** — what breaks, what regresses, or what risk remains
- For deterministic findings: the **source** (which command or pattern check produced it). For subjective observations: the label `Subjective`.
- **Behavioral dependencies** (required for any finding whose fix changes I/O, network, auth, security, or error-handling behavior): list what user-facing features currently route through the affected code path, and what external services (CDNs, APIs, third-party hosts) send requests through it. For each, state whether the recommended fix preserves their existing behavior. If any behavior would change, say so explicitly. If none identified, write "None." A fix that satisfies a security requirement but breaks a legitimate use case is not a valid fix — either rework it until both are satisfied, or surface the tradeoff as explicit options for the developer.

---

**Phase \<N\> Gate**

**Coverage Report — Phase \<N\>**

Deterministic checks run:

- `<command>`: exit \<code\> — \<one-line result\>
- Pattern check `<pattern>`: \<N\> matches in changed lines — pass/fail

Files checked: \<N\>

- \<list of files, abbreviated if long\>

Deterministic findings: \<N\> · Subjective observations: \<N\>

---

**Deterministic findings** _(reproducible — same code produces same finding every run)_

**1. \<Short title\>**  
Source: \<command name or pattern\>  
Location: `<file path : line range>`  
Issue: \<what's wrong, in plain language\>  
Recommended fix: \<concrete description of the change\>  
Impact if not fixed: \<what breaks or regresses\>  
Behavioral dependencies: \<for findings that change I/O, network, auth, security, or error-handling behavior: list what user-facing features currently route through this code path, and what external services (CDNs, APIs, third-party hosts) send requests through it. For each, state whether the recommended fix preserves their existing behavior. If any behavior would change, say so explicitly. If none identified, write "None."\>

**2. ...**

**Subjective observations** _(variable across runs — agent judgment, not deterministic)_

**3. \<Short title\>**  
Label: Subjective  
Location: `<file path : line range or function/component>`  
Observation: \<what was noticed, in plain language\>  
Suggested change: \<concrete description, if applicable\>  
Why it's subjective: \<one line\>

_(If there are no deterministic findings, omit that section and say "No deterministic findings." If there are no subjective observations, omit that section. At least one must be present or Shape B applies.)_

I will fix every finding above unless you waive specific ones. Tell me how you'd like to proceed — in whatever wording is natural for you. Common patterns:

- "Apply all recommended fixes" — I'll implement every recommended fix exactly as written above.
- "Apply all deterministic, ignore subjective" — fix the reproducible ones, skip the judgment-based ones.
- "Apply the recommended fix for #1 and #3; waive #2 because \<reason\>; for #4 do \<your variant\> instead"
- "Apply the recommended fix for #2 but \<specific modification\>"
- "Hold on #3, let's discuss it"
- "Waive #1 because \<reason\>"

Just be specific about which finding number you mean and what action you want. If anything is ambiguous I'll ask before doing anything.

Once every finding has a decision I'll confirm the resolved state and ask if there's anything else before moving on to Phase \<N+1\>. Any plain affirmative advances; if you raise a new concern we handle that first.

I will not proceed to the next phase until every finding has a decision and you signal you're ready.

---

### Reply interpretation rules for Shape A

When the developer replies, parse intent flexibly:

- **Numbers refer to findings.** "#2", "2", "second one", "the auth one" all refer to the same finding when context is clear.
- **"Apply the recommended fix"** (or "as recommended", "as written", "as suggested", "yes do it") means implement the Recommended fix verbatim as presented in the gate.
- **"Apply with <modification>"** (or "but <change>", "except <change>") means implement the Recommended fix as the base, with the developer's modification layered on. If the modification conflicts with or replaces the recommendation, surface the conflict and confirm before editing.
- **"Waive" / "skip" / "leave it"** with a stated reason means add to the Deferred items list. If no reason was given for a deterministic finding, ask for one before deferring — the dismissal standard requires it. Subjective observations may be waived without a reason.
- **"Discuss" / "talk about" / "let's look at"** means pause on that finding; do not edit it, and do not advance the gate until it's resolved.
- **"Fix all" / "do them all" / "apply everything"** means apply every Recommended fix verbatim (deterministic and subjective). Before editing, list back what you're about to do so the developer has a chance to catch a misinterpretation.
- **"Apply all deterministic, ignore subjective"** (or similar) means fix all deterministic findings as written, and treat all subjective observations as waived (no reason required).
- **Ambiguous replies** ("fix it", "yeah do that", "ok") when multiple findings are open: ask which finding(s) and which action. Do not guess.

When you're about to edit, briefly state what you'll do per finding before doing it — one sentence each is enough. This catches misunderstandings before code changes hands.

### Shape B — No open findings

Use when the Open findings list in the Session State Block is empty. This includes: clean passes with no findings discovered, phases where all findings were fixed inline, phases where all findings were waived, or any mixture. The Approved Changes Ledger and Deferred items list above the gate already record what happened — the gate itself does not re-litigate it.

The Coverage report still appears even in Shape B — reproducibility doesn't depend on whether findings exist.

---

**Phase \<N\> Gate**

**Coverage Report — Phase \<N\>**

Deterministic checks run:

- `<command>`: exit \<code\> — \<one-line result\>

Files checked: \<N\>

- \<list of files, abbreviated if long\>

Deterministic findings: 0 · Subjective observations: 0  
_(or: Deterministic findings: 0 (3 fixed inline) · Subjective observations: 2 (all waived))_

---

Phase \<N\> is complete. \<one line summarizing outcome — e.g. "All 3 findings were fixed inline and added to the Approved Changes Ledger." or "No issues found in this phase." or "1 finding fixed, 1 finding waived — see Session State above."\>

Is there anything else you'd like to address in this phase before I move on to Phase \<N+1\>? If not, just say so (or "go", "next", "looks good", or anything similar) and I'll proceed.

---

**How to interpret the reply.** Any plain affirmative or move-along reply ("no", "nope", "go", "next", "proceed", "looks good", "all good", "ok", "yes move on", a thumbs-up, etc.) advances to Phase N+1. If the developer raises something — a question, a concern, a new issue, a request to revisit a resolved item — handle that first; do not advance until the developer signals they are done with this phase. If the reply is ambiguous, ask a clarifying question; do not assume advance.

After printing the Gate Block, the response ends. Do not add anything after it.

---

## Dismissal standard

Before any finding across any phase is waived as "intentional," "by design," or "addressed by a companion PR," apply this test:

> **If this branch merged to production right now, unaccompanied by any other PR, would this finding cause a crash, data loss, or incorrect behavior for a real request?**

If yes, the finding cannot be waived — it must be fixed on this branch. Merge order and companion PRs are not a valid basis for shipping a crash. This applies even when the user and reviewer agree the finding is "expected" or "temporary."

If the user attempts to waive a finding that fails this test, push back once with the test result, then defer to the user's final call but record the override in the Deferred items list with the verbatim reason given.

---

## Deterministic floor (applies to every phase)

Variance between runs is the enemy. Two runs of this workflow against the same code must produce the same deterministic findings, even if their subjective observations differ. The way we achieve this: every phase has a **deterministic floor** that is executed mechanically, and a **subjective layer** that is clearly labeled as variable.

### What "deterministic" means here

A deterministic check is one where the same code in produces the same finding out, run after run. Concretely:

- **Command output checks.** Run a tool (compiler, linter, test runner, formatter, type checker), capture exit code and output. Non-zero exit → automatic finding. Specific output patterns → automatic finding.
- **Grep-style pattern checks.** Search the diff for specific tokens or patterns (e.g., `console.log`, `TODO`, `// @ts-ignore`, `any` types in changed lines). Match → automatic finding.
- **Structural checks.** File X exists / does not exist, file matches schema, import graph satisfies a rule. Pass/fail is mechanical.

A subjective observation is anything else: "this could be cleaner," "consider extracting this," "the naming is unclear," "this pattern feels fragile." These are valuable but not reproducible across runs.

### Required floor for every phase

At the start of every phase, before any subjective review begins, the agent must:

1. **Execute the phase's deterministic checks** (the sub-workflow doc for that phase defines its specific commands and patterns — see "Phase deterministic check list" below for the minimum each phase must include).
2. **Capture results verbatim.** Exit codes, command output, pattern match locations. No paraphrasing.
3. **Convert results to findings using the conversion rules** in this section. Don't editorialize about whether a deterministic finding is "really" important — if the rule says it's a finding, it's a finding.

Only after the deterministic floor is complete may the agent add subjective observations.

### Conversion rules: command output → finding

- **Exit code non-zero** for a required command → finding. Title: "<command> failed". Recommended fix: address the specific errors in the output, listed verbatim.
- **Test failure** → one finding per failing test. Title: test name. Recommended fix: the assertion that failed and what would make it pass.
- **Lint error** (not warning) → finding. Title: rule name + count. Recommended fix: per the rule's standard remediation.
- **Type error** → finding. Title: file + line + error code. Recommended fix: as the compiler suggests, or if no suggestion, the specific type mismatch to resolve.
- **Lint warning** → subjective observation, not finding (unless the project's lint config treats warnings as errors — check `.eslintrc` / equivalent).
- **Pattern match** (e.g., new `console.log` in diff, new `any` type, new `// @ts-ignore`) → finding. Title: pattern + count + locations.

### Phase deterministic check list (minimum required)

Each phase's sub-workflow doc may add more, but at minimum every phase runs these:

**Phase 1 — Branch change impact audit:**

- `git diff --stat origin/main...HEAD` plus the three uncommitted-state commands from "Before starting" (already enumerated; this is just a re-check that scope hasn't drifted).
- No subjective layer in Phase 1 unless the sub-workflow doc specifies one.

**Phase 2 — Code quality review:**

- `tsc --noEmit` (or project's type-check command — read from `package.json` scripts).
- `eslint <changed files>` (or project's lint command, scoped to changed files only).
- `prettier --check <changed files>` if the project uses prettier.
- Pattern check on changed lines only:
  - New `console.log`, `console.error`, `console.warn` not gated by debug flag → finding.
  - New `// @ts-ignore`, `// @ts-expect-error`, `// eslint-disable-*` without a comment explaining why → finding.
  - New `any` types in TypeScript files → finding (unless project conventions in `frontend/AGENTS.md` say otherwise).
  - New `TODO`, `FIXME`, `XXX` comments → subjective observation (variable severity).
  - New `fetch(` calls in non-test source files: grep the surrounding call site (within ~5 lines) for `signal:`. If absent → finding. Title: "fetch without abort signal". Recommended fix: add an `AbortController` with an appropriate timeout and pass `signal: controller.signal`. Impact if not fixed: a slow or hung upstream can hold the server request open until the platform timeout. Exception: calls inside test files, or calls where the surrounding function signature already accepts and threads a signal from the caller.
- Build the project if a build command exists (`pnpm build` or equivalent). Build failure → finding.

**Phase 3 — CSS and component standards:**

- The project's CSS lint (`stylelint` or equivalent) if configured → findings on error.
- Pattern check: new inline styles in JSX/TSX where the project uses CSS modules → finding.
- Pattern check: hardcoded colors, hardcoded spacing values where the project has tokens → finding.
- Pattern check: any `@apply` line in changed `.module.css` files containing `group-hover:`, `group-focus:`, or `peer-` anywhere in its token list → **critical finding (broken visual output)**. `@apply` with parent-context Tailwind variants does not produce correct cross-element selectors in CSS modules. Replace with `:global(.group):hover .className { ... }`.
- Pattern check `group-hover:` / `peer-hover:` / other parent-context variants in JSX `className` values in changed `.tsx`/`.jsx` files → finding (convention violation — use `:global(.group):hover` in the CSS module instead).
- Specific patterns the sub-workflow doc lists.

**Phase 4 — Test suite quality:**

- Run tests when configured: `pnpm test -- <changed test files>` from `frontend/` if `package.json` defines a `test` script; otherwise record "tests not configured — skipped". Failure → finding per failing test.
- Run the full test suite if any source file (not test file) changed in a way that could affect untouched tests. Failure → finding.
- Coverage check on new components/services if the project has a coverage threshold: report new code with no test → finding.
- Pattern check: new `.skip`, `.only`, `xit`, `xdescribe` in changed test files → finding.

**Phase 5 — Feature flag gating:**

- Pattern check: every new code path gated by a flag must have the flag-off behavior verifiable in code (grep for the flag identifier, confirm an else branch or early return exists) → finding if not.
- Pattern check: new flag identifiers must appear in the flag registry/config → finding if missing.
- Specific patterns the sub-workflow doc lists.

**Phase 6 — PR description:**

- No deterministic checks; this phase produces a document. Skip the floor.

### Required output: Coverage report (in every phase's Gate Block)

Every phase that has a deterministic floor must include a **Coverage report** block immediately before the Gate Block. The Coverage report is the reproducibility proof. Same code in, same coverage report out.

---

**Coverage Report — Phase \<N\>**

Deterministic checks run:

- `<command>`: exit \<code\> — \<one-line result, e.g. "0 errors, 0 warnings" or "3 errors"\>
- Pattern check `<pattern>`: \<N\> matches in changed lines — pass/fail

Files checked: \<N\>

- \<list of files, abbreviated if long\>

Deterministic findings: \<N\> · Subjective observations: \<N\>

---

If two runs of the same phase against the same code produce different Coverage reports, that is a workflow bug to report — not normal variance.

### Subjective observations: how to present them

Subjective observations go in their own section after the deterministic findings in the Gate Block, using the **Subjective observations** bold header shown in the Shape A template above.

Subjective observations follow the same fix/waive/discuss reply pattern as deterministic findings, but the developer should treat them as "things this run noticed" rather than "things every run will catch." The label is the honest acknowledgment that another run might surface different ones.

If a subjective observation is something the developer wants to harden into a deterministic check for future runs, note that — it can become a new pattern check or lint rule. That's how the floor grows over time.

### What to do when a command isn't available

If a required deterministic command isn't configured in the project (e.g., no `prettier`, no test script), the agent must:

1. Note in the Coverage report: `<command>: not configured — skipped`.
2. Surface this in Phase 1's audit as a workflow gap, not as a phase finding.
3. Continue with the remaining floor.

Skipping a command silently is forbidden. Every required check must appear in the Coverage report with either a result or an explicit "not configured" notation.

---

## Edit protocol (applies any time you modify a file during this workflow)

Whenever the user has approved a fix and you are about to edit a file:

1. Confirm the edit is on the Approved Changes Ledger. If not, stop and get approval first.
2. Re-read the target file (or relevant section) if you have not done so since the last edit to it.
3. **For any finding whose fix changes I/O, network, security, auth, or error-handling behavior:** Before touching the file, answer in writing: (a) What user-facing features currently flow through this code path? (b) What external services (CDNs, APIs, third-party hosts) send requests through it, and what behavior do they rely on (redirect following, specific headers, error codes, etc.)? (c) Does the approved fix preserve that behavior? If the answer to (c) is "no" or "unsure," stop — surface the conflict to the developer with explicit options before editing. Do not proceed on the assumption that the security fix takes precedence; that is a tradeoff for the developer to make.
4. Scan for intentional-behavior comments per Rule 4. Surface any you find and wait for confirmation.
5. Make only the approved edit. Do not bundle in adjacent improvements.
6. **Review the new code before reporting it done.** After making the edit, re-read every line you just wrote as if you were reviewing a colleague's code — not code you wrote:
   - Would you flag any of these lines in a Phase 2 review? If yes, surface it as a new finding.
   - Does the fix enforce its intended invariant at every layer the call path touches — not just the layer you edited? (If you changed a DB query, do all callers handle the new return value correctly? If you added a guard, do all branches after the guard also behave correctly?)
   - If `pnpm test` exists, run `pnpm test -- --findRelatedTests <edited file path>` for frontend edits. If any test fails, treat it as a new finding and fix it now. If no test script exists, run `pnpm typecheck` and `pnpm lint` on touched frontend files instead.
   - If you discover a problem while reviewing your own fix, add it to the Open findings list. Do not silently edit it under the existing approval.
7. After the edit, report what you changed using the post-edit report shape below.
8. Re-read the file before any further edit to it.

### Post-edit report shape

After making an edit, your report has exactly these elements and nothing else:

- **Changed:** one or two sentences naming the file and what was changed. Concrete, not abstract ("Added `openGraph` and `twitter` stubs to the leaderboard and pokedex cases in `app/share/lib.tsx`") — not vague ("Fixed Finding 3").
- **New findings noticed while editing (if any):** numbered list of specific adjacent issues, each as a real finding with a recommended fix. These are added to the Open findings list for the current phase and will appear in the next Gate Block.
- Nothing else. In particular, do not include vague closing notes about what you did _not_ change. The Approved Changes Ledger already records what was edited; readers can infer what wasn't.

#### Forbidden post-edit notes

Do not produce a report that ends with vague unscoped statements about untouched code, such as:

- "What was not changed: adjacent code in all three files."
- "I left the rest of the file alone."
- "Adjacent code was not modified."
- "Other code in these files remains untouched."

These read as incomplete thoughts and invite the developer to wonder what you saw but didn't say. If you saw something adjacent worth mentioning, name it as a new finding with a specific location and recommended fix. If you didn't see anything adjacent worth mentioning, say nothing about adjacent code at all.

The principle: silence is the default for unchanged code. Speak about adjacent code only when you have a specific, actionable finding to surface.

---

## Before starting

1. Read `frontend/AGENTS.md` and the root [README.md](../../README.md) to load conventions, hard rules, and architecture.

2. **Optional issue reference.** If the branch or commits reference a GitHub issue (e.g. `#12` in the branch name), record it for Phase 6 (PR description). No fixed Jira prefix is required for this project.

3. **Enumerate all changed files in the worktree — committed and uncommitted.** A pre-merge review must cover everything that would land on `main` if this branch were merged right now, including work the developer has not yet committed. Run all four of the following and union the results:

   ```
   # Committed on this branch but not on main
   git diff --name-only origin/main...HEAD

   # Staged for commit but not yet committed
   git diff --name-only --cached

   # Modified in the working tree but not staged
   git diff --name-only

   # New files not yet tracked by git
   git ls-files --others --exclude-standard
   ```

   Build a single deduplicated list of file paths from the union of these four. For each file, also record its state(s) — a file may appear in more than one (e.g., committed earlier on the branch _and_ further modified uncommitted). State labels to use:
   - `committed` — present in the three-dot diff against `origin/main`
   - `staged` — present in `--cached`
   - `unstaged` — present in the plain `git diff`
   - `untracked` — present in `ls-files --others`

4. **Surface the worktree state to the developer before starting.** Present the file list grouped by state, for example:

   ```
   Changed files on this branch (committed + uncommitted):

   Committed (12):
     - path/to/file-a.ts
     - ...

   Staged, not committed (2):
     - path/to/file-b.tsx
     - ...

   Unstaged changes (3):
     - path/to/file-c.module.css (also: committed)
     - ...

   Untracked (1):
     - path/to/new-file.ts
   ```

   This list drives scope for every phase below — all four categories are in scope, not just committed work. Annotate files that appear in multiple states so the developer can see them at a glance.

5. **Print the start prompt — one question, clear default.** After the file list, end your response with the start prompt in exactly this shape (formatted markdown, not a code block):

   ***

   **Default plan:**
   - Scope: all \<N\> files above (committed + staged + unstaged + untracked) — this is what would land on `main` if you committed and merged right now.
   - Phases that will run: \<list, e.g. "1, 2, 3, 4, 6 — Phase 5 skipped, no feature flag changes detected"\>
   - Phase 6 (PR description decision) is mandatory; generation can be declined.

   To start with the default plan, just say **"go"** (or "yes", "start", "proceed", or anything similar).

   To adjust before starting, tell me what to change. Examples:
   - "Exclude these files: \<paths\>" — limit scope
   - "Committed only" — review only the committed files
   - "Skip Phase 4" — don't run a specific phase

   ***

   After printing this, the response ends. Do not add additional questions, side-notes, or commentary after the end of the start prompt.

6. **Once the developer replies:** print the initial Session State Block reflecting the agreed scope and phase plan (Approved Changes Ledger and Deferred items will be empty; Scope exclusions reflect whatever the developer specified, or "none"). Then begin Phase 1 in the same response. Do not ask another "Ready to begin?" question — the start prompt already covered that.

### No stacked questions

Whenever you print a structured prompt (start prompt, Gate Block, Phase 6 prompt), it is the only question in that response. Do not append additional questions, observations that imply a decision, or "by the way" notes that invite a separate reply.

Specifically forbidden:

- "Note: the changes include <X> — let me know if you want to handle that differently." (Stacks a second decision on top of the structured prompt.)
- "Also, should I <Y>?" (Adds a second question.)
- "One thing to flag: <Z>." with no clear action — leaves the developer wondering whether to respond to it.

If you notice something that genuinely warrants attention, either fold it into the structured prompt as a specific option, or hold it and surface it as a finding inside the relevant phase. Do not let it dangle alongside a gate question.

### Mid-review worktree changes

The worktree is a moving target. If at any point during the review the developer indicates they have made additional changes (commits, edits, new files), or if significant time has passed since enumeration, re-run the four enumeration commands and surface any new files or new states. Newly discovered changes are added to scope and reviewed in whichever phase they belong to — they are not skipped because enumeration "already happened."

If a file in the Approved Changes Ledger is found to have additional uncommitted modifications you did not make, stop and ask the developer about them before continuing — those changes are not approved and may conflict with the approved fix.

---

## Phase execution order (applies to Phases 1–5)

Every phase that has a deterministic floor executes in this order, every run, no exceptions:

1. **Run the deterministic floor for this phase.** Execute every command and pattern check from the "Phase deterministic check list" section above. Capture results verbatim.
2. **Read the sub-workflow doc** and run any additional checks it specifies. Treat any commands or pattern checks it adds as additional deterministic items in the Coverage report.
3. **Subjective layer.** After deterministic checks are complete, the agent may add subjective observations. Each must be labeled `Subjective` with a "Why it's subjective" line per the Shape A template.
4. **Build the Coverage report** from the captured results.
5. **Build the Gate Block** (Shape A if any findings or observations remain awaiting decision, Shape B if none — see Gate Block section for the selection rule).
6. **Print:** the phase narrative (brief — what the agent did, not editorialized), the Session State Block, then the Gate Block (which includes the Coverage report). Stop.

If any of steps 1–4 are skipped, the phase output is invalid and must be redone before the gate is presented.

---

## Phase 1 — Branch change impact audit (`branch-change-impact-audit.md`)

Always run. Establishes the scope and intent of the branch before any other review begins.

1. Run the Phase 1 deterministic floor (see Phase deterministic check list above).
2. Read `docs/agent-workflows/branch-change-impact-audit.md` in full and run the branch audit it defines.
3. Add subjective observations only if the sub-workflow doc calls for them.
4. Print phase narrative + Session State Block + Gate Block (with Coverage report). Stop.

Note: if feature flag changes are detected during Phase 1, the branch audit workflow will ask the user whether to run the feature flag gating review inline. If the user accepts, that review runs as part of Phase 1 and Phase 5 will be skipped (record this in the Session State Block).

## Phase 2 — Code quality review (`code-quality-review.md`)

Always run. Apply to all changed `.ts`, `.tsx`, `.js`, and `.jsx` files.

1. Run the Phase 2 deterministic floor: type-check, lint, prettier (if configured), build (if configured), and the pattern checks listed in the Phase deterministic check list section. Capture every command's exit code and relevant output.
2. Read `docs/agent-workflows/code-quality-review.md` in full and run any additional checks it defines, treating them as additional deterministic items.
3. Only after the deterministic floor is complete, add subjective observations (naming, structure, suggested refactors, etc.) — each labeled `Subjective`.
4. Print phase narrative + Session State Block + Gate Block (with Coverage report). Stop.

Note: at the end of Phase 2, the code quality review may ask whether to run the CSS and component standards review. If the user accepts, that review runs as part of Phase 2 and Phase 3 will be skipped (record this in the Session State Block).

## Phase 3 — CSS and component standards review (`css-and-component-standards-review.md`)

If the CSS review was already completed during Phase 2, print the Session State Block, tell the user "Phase 3 already completed during Phase 2 — see CSS review output above," and ask if they are ready to move to Phase 4. Stop.

Otherwise, run if any of the following are in the changed file list:

- `.module.css` files
- `.tsx` or `.jsx` component files
- `.stories.tsx` files

If not applicable, print the Session State Block, tell the user "Phase 3 skipped — no component or styling changes," and ask if they are ready to move to Phase 4. Stop.

Otherwise:

1. Run the Phase 3 deterministic floor (stylelint if configured, inline-style pattern check, hardcoded-color/spacing pattern check).
2. Read `docs/agent-workflows/css-and-component-standards-review.md` in full and run additional checks it defines.
3. Add subjective observations after deterministic checks, each labeled `Subjective`.
4. Print phase narrative + Session State Block + Gate Block (with Coverage report). Stop.

## Phase 4 — Test suite quality review (`test-suite-quality-review.md`)

Run if any of the following are true:

- Any `.test.ts` or `.test.tsx` files are in the changed file list
- New components or services were introduced (check whether tests were added or are missing)

If not applicable, print the Session State Block, tell the user "Phase 4 skipped — no test changes and no new components or services detected," and ask if they are ready to move to Phase 5. Stop.

Otherwise:

1. Run the Phase 4 deterministic floor: test suite scoped to changed test files, full suite if source files changed, coverage check on new components/services, pattern check for `.skip` / `.only` / `xit` / `xdescribe`.
2. Read `docs/agent-workflows/test-suite-quality-review.md` in full and run any additional checks it defines.
3. Add subjective observations after deterministic checks (test naming, assertion quality, missing edge cases), each labeled `Subjective`.
4. Print phase narrative + Session State Block + Gate Block (with Coverage report). Stop.

## Phase 5 — Feature flag gating review (`feature-flag-gating-review.md`)

If the feature flag review was already completed during Phase 1, print the Session State Block, tell the user "Phase 5 already completed during Phase 1 — see flag review output above," and ask if they are ready to move to Phase 6. Stop.

Otherwise, run if any file references feature flags or env-gated behavior (`featureFlag`, `featureGate`, `NEXT_PUBLIC_*` toggles, or similar).

If not applicable, print the Session State Block, tell the user "Phase 5 skipped — no feature flag changes detected," and ask if they are ready to move to Phase 6. Stop.

Otherwise:

1. Run the Phase 5 deterministic floor: flag-off-path verifiability check (grep for flag identifier, confirm else branch exists), new-flag-in-registry check.
2. Read `docs/agent-workflows/feature-flag-gating-review.md` in full and run any additional checks it defines.
3. Add subjective observations after deterministic checks, each labeled `Subjective`.
4. Print phase narrative + Session State Block + Gate Block (with Coverage report). Stop.

---

## Documentation accuracy phase (when included)

When a docs review phase is added (e.g. reviewing an integration doc, architecture doc, or status doc), perform two distinct checks:

1. **Factual accuracy** — function names, file paths, table entries, and behavioral claims match the actual code in the diff and on `main`.
2. **PR-scoping accuracy** — for every file or feature marked ✅ FUNCTIONAL (or equivalent "works post-merge" claim), verify it either (a) appears in this PR's diff, or (b) is explicitly attributed to a named companion PR within the document itself. Any ✅ FUNCTIONAL claim that fails both tests is an inaccuracy and must be corrected or annotated.

Treat documentation inaccuracies as Phase findings under the rules above — fix by default, waiver requires explicit reason.

---

## Phase 6 — PR description (`pull-request-description-generator.md`)

**Mandatory step. Always ask. Never skip the decision.** This is a pre-merge workflow; the PR-description decision is part of the required flow. The developer may decline generation, but you may not assume they don't want it and you may not end the workflow without an explicit generate-or-skip reply.

After Phase 5 has been gated (or skipped), your response is the Phase 6 prompt in exactly this shape (formatted markdown, not a code block):

---

**Phase 6 — PR Description**

All review phases are complete. The PR-description decision is mandatory. By default, I will generate it now unless you choose to skip it.

**Open findings status:**

- Fixed (on Approved Changes Ledger): \<count\>
- Waived (on Deferred items list with reason): \<count\>
- Unresolved: \<count — must be zero before generating\>

Reply with one of:

- **"generate"** (or "yes", "go ahead", "proceed") — I'll run the PR description workflow now
- **"skip"** (or "no", "don't generate") — I'll end the workflow here without generating a PR description

I will not generate the PR description and I will not end the workflow until you reply.

---

After printing this prompt, the response ends. Stop.

**If the user says generate:** Confirm the Unresolved count is zero. If it is not, return to the relevant phase gate and resolve those findings first — do not generate a PR description with unresolved findings. Once clear, read `docs/agent-workflows/pull-request-description-generator.md` in full and generate the PR description following that workflow exactly.

**If the user says skip:** Acknowledge briefly, print a final Session State Block summarizing what was done, and end the workflow. Do not lobby to generate it anyway.

**If the user does not address the Phase 6 prompt in their next message** (e.g., they reply with an unrelated question or a follow-up about an earlier finding): answer their message, then re-print the Phase 6 prompt at the end. Do not let the workflow trail off without a Phase 6 decision.

---

## Failure mode self-check (run silently before sending any response)

Before sending any response in this workflow, verify:

- [ ] Am I covering exactly one phase in this response? (Or one gate transition / one skip notice / one edit cycle)
- [ ] Did I print the Session State Block if this response ends a phase or a gate transition?
- [ ] Did I print the Gate Block in the correct shape if this is a phase-ending response? (Shape A only when the Open findings list has entries awaiting decision; Shape B when that list is empty for _any_ reason — including "all fixed inline". Never Shape A with parenthetical "(none)" or "(all fixed)" filler where findings would go.)
- [ ] If this response contains a structured prompt (start prompt, Gate Block, Phase 6 prompt), is it the _only_ question in the response? No stacked side-questions, dangling "let me know if..." notes, or "by the way" asks that compete with the structured prompt for the developer's reply.
- [ ] If this response includes the end of Phase 5 (or a Phase 5 skip notice), did I also print the Phase 6 prompt? (Phase 6 is never skipped without an explicit user decline — it must be offered.)
- [ ] If the user has not yet given a Phase 6 decision and the workflow is otherwise complete, did I re-print the Phase 6 prompt at the end of this response?
- [ ] Did I enumerate committed _and_ uncommitted changes (all four sources) at the start, and have I re-enumerated if the developer mentioned mid-review changes?
- [ ] Am I about to make any edit not on the Approved Changes Ledger? If so, stop and ask.
- [ ] Did I check for intentional-behavior comments before any edit I'm about to make?
- [ ] If the finding I'm about to fix changes I/O, network, security, auth, or error-handling behavior: did I enumerate what user-facing features and external services currently route through this code path, and confirm the fix preserves their existing behavior? If not, do that before editing.
- [ ] After each edit: did I re-read the lines I just wrote as if reviewing a colleague's code (not my own), check that the fix enforces its invariant at every layer the call path touches, and run `pnpm test -- --findRelatedTests <path>` when a test script exists (otherwise typecheck/lint)? Test failures are findings — not items to defer.
- [ ] Am I using any forbidden phrases ("follow-up PR," "ship as-is," "defer," "optional fix," etc.)?
- [ ] Am I framing findings as "would you like to fix" instead of "I will fix unless you waive"?
- [ ] If this is a phase with a deterministic floor (Phases 1–5), did I actually execute every required command from the Phase deterministic check list, and did I include the Coverage report in the Gate Block with verbatim command results?
- [ ] Did I distinguish deterministic findings (with Source attribution) from subjective observations (with `Subjective` label) in the Gate Block? Subjective items must never be presented as if they were reproducible deterministic findings.
- [ ] If any required deterministic command was unavailable, did I list it in the Coverage report as "not configured — skipped" rather than silently omitting it?
- [ ] If this response presents findings in Shape A, does each finding include all four required elements (short title, location, issue description, recommended fix, impact if not fixed)? Terse one-line findings ("Missing null check — add one") are not acceptable.
- [ ] If the developer's reply was ambiguous about which finding or which action, did I ask a clarifying question instead of guessing?
- [ ] If I'm about to apply multiple fixes from a single reply, did I list back what I'll do per finding before editing?
- [ ] If this response includes a post-edit report, does it follow the required shape (concrete "Changed:" line, optional numbered new findings, nothing else) — and does it avoid vague dangling notes about untouched code ("What was not changed: adjacent code", "I left the rest alone", etc.)?

If any check fails, fix the response before sending.
