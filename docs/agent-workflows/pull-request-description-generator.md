# Pull Request Description Generator

## Purpose

Generates **PR-ready text** — a dependency declaration, a one-paragraph summary, a grouped file-by-file change list, environment variable callouts, migration notes, a change-overview table, and linked tickets — based strictly on the final diff between the current branch and its target branch (default: `main`). Output is formatted for direct paste into a GitHub PR description.

**Does not:** review code quality, flag issues, make recommendations, or describe anything not visible in the final diff. This workflow produces output text only — it never reviews.

---

## Context isolation (must happen first)

This workflow must operate on the final diff in a clean context. Prior conversation, earlier commits, scratch work, or discussion of approaches that were tried and abandoned must not influence the output. PR reviewers see only the final diff and have no knowledge of what came before — describing anything they cannot see in the diff creates confusion.

Before doing anything else:

1. **Discard prior context.** Do not reference, recall, or carry forward any information from previous turns in the conversation, including code that was discussed, written, or revised earlier. Treat the final diff as the only source of truth.
2. **Re-fetch the diff fresh** between the current branch and the confirmed target branch. Do not rely on a diff that was viewed earlier in the conversation — pull it again now.
3. **If you find yourself about to mention something** (a file, function, variable, behavior, design choice) verify it is present in the freshly fetched final diff. If it is not in the diff, it does not exist for the purposes of this output.

If this workflow is being run inside a longer conversation, start by explicitly acknowledging the context reset before proceeding: "Re-fetching the final diff against the confirmed target branch and ignoring prior conversation context."

---

## Inputs required before generating output

Before producing the PR text, the workflow must complete a pre-generation phase. Begin this phase by telling the developer what you are about to check and why, before running any commands. Then run the checks, report findings, and ask a single confirmation question. The structure is always: **explain → run → report → confirm**.

### Pre-generation phase

**Announce the checks upfront.** Before running anything, tell the developer in plain language:

- You are diffing against `main` (or the specified target) and will verify that is correct by checking the branch base
- You are checking what branch this branch was created from, to determine whether the PR depends on another branch merging first — this affects what reviewers will see in the diff
- You are extracting the ticket ID from the branch name for the PR title and linked tickets
- You are checking commit messages for any additional ticket references

Example opening:

> _"Before generating, I'll run a few git checks to determine the diff target, whether this branch depends on any other branch, and what ticket to link. Running now..."_

**Then run the following commands and interpret the results:**

```
git branch --show-current
git rev-parse origin/main
git merge-base origin/main HEAD
git log --oneline origin/main..HEAD
git log --oneline --merges origin/main..HEAD
```

If the target branch is not `main`, substitute `origin/<target>` for `origin/main` in all commands above.

From the output, determine as facts — do not ask the developer to confirm these:

- **Target branch:** `main` unless specified otherwise
- **Branch base:** Compare the SHA from `git merge-base` to the SHA from `git rev-parse origin/main`. If equal, the branch is based directly on `main` — no PR dependency. If not equal, run `git branch -r --points-at <merge-base-sha>` to identify which remote branch the merge-base corresponds to, and record that as a dependency. If no remote branch matches, note the dependency is unresolvable from git alone.
- **Issue/ticket status:** If the branch name or commits include an issue id (e.g. GitHub `#12`, `GH-12`, or a team prefix), record it. If none is found, ask once whether to link an issue; if the developer confirms there is none, record ticket status as `none` and continue.
- **Additional issue references:** Scan commit messages for other issue patterns.

**Report all findings in a single message.** State each as a fact. Example:

> _"Findings: target branch is `main` · branch was created from `main` directly (no PR dependencies) · issue detected: #42 · no additional issue references in commit messages."_

**Then ask one question** — the only thing git cannot tell you: _"Are there any additional issues to link beyond #42, or is that complete?"_ If ticket status is `none`, ask: _"Are there any issues to link, or should this PR have no linked issues?"_

Do not ask separate questions for target branch, branch base, or detected ticket ID — those are determined from git. Only ask about information that git cannot provide.

---

## Strict rules

- Use only the actual final diff between the current branch and the confirmed target branch
- Do not mention anything that may have been added and later removed during development — reviewers only see the final diff and cannot follow references to code that no longer exists
- Do not speculate, infer intent, or describe possible behavior
- Do not mention files, functions, components, variables, or implementation details unless they are directly part of the final PR diff
- Do not include filler language, praise, or commentary
- Environment variable callouts must surface only the variable name and the action required (add, remove, or rename) — never the value, default, example, or any usage details
- Migrations must be derived from the diff only — never invented
- If an issue id is confirmed, the PR title may start with it (e.g. `#42 feat: Add recording UI` or `GH-42 feat: ...`) per team preference. If the developer confirms there is no issue, use `type: Short descriptive title` only.
- **The file-by-file changes section is mandatory.** It must appear in every output regardless of the number of changed files. It may never be omitted, collapsed into a summary sentence, reduced to a file count, or replaced by anything else. Every file in the diff must have its own bullet. Every bullet must state both what changed in that file and why it was necessary. Every entry must be grouped under a named subcategory subheading. If you find yourself about to omit this section or any file within it for any reason, stop and include it.
- **The change-overview table is mandatory.** It must appear in every output. Its columns and heading are chosen per-PR to fit the actual work in the diff (see that section for how to derive them), but the section itself is never omitted, never collapsed, and never replaced by prose.
- **No test plan section.** This workflow produces PR description text only. Testing is the developer's responsibility before submitting the PR. Do not add a test plan, testing steps, QA checklist, or any other testing-related section to the output under any circumstances.
- When generating the PR description (after the pre-generation phase is complete and confirmed), return that output as exactly one markdown code block and nothing else — this rule does not apply to the pre-generation findings report or the confirmation question

---

## Required output format

Inside the single markdown code block, format the response exactly like this:

```md
## PR title

#42 type: Short descriptive title

<!-- If ticket status is `none`, use: type: Short descriptive title -->

<!-- Omit "Target branch" entirely if target is `main`. Only include when targeting a non-main branch. -->
<!-- Omit "Depends on" entirely if there are no dependencies. -->
<!-- Omit "Linked tickets" entirely if there are no linked tickets. -->
<!-- Omit "Environment variables" entirely if no env vars changed. -->
<!-- Omit "Database / schema migrations" entirely if no migrations are present. -->

## Target branch

> This PR targets `<branch-name>`, not `main`. The diff includes all commits on `<branch-name>` that are not yet in `main` — files changed on that branch but not in this PR may appear in the diff. Please review only the changes introduced by this branch. Once `<branch-name>` merges to `main`, this PR should be rebased onto `main` before final merge.

## Depends on

- #<PR number or branch name> — <one sentence on why this PR depends on it>

## Linked tickets

- <TICKET-ID> — <optional short description or URL if provided by the developer>

## Summary

<one paragraph only, maximum 4 sentences>

## <Change-overview heading chosen to fit this PR>

<intro line if useful>

| <Column A> | <Column B> | <Column C if needed> |
| ---------- | ---------- | -------------------- |
| <cell>     | <cell>     | <cell>               |
| <cell>     | <cell>     | <cell>               |

<optional one-line note tying the rows together, only if grounded in the diff>

## File-by-file changes

### <Group name>

- `path/to/file.ext`: <one sentence explaining what changed and why it was necessary>
- `old/path.ext` → `new/path.ext`: <one sentence explaining the move and any changes to contents>
- `path/to/another-file.ext`: <one sentence explaining what changed and why it was necessary>

### <Next group name>

- `path/to/file.ext`: <one sentence explaining what changed and why it was necessary>

## Environment variables

- `VAR_NAME` — add
- `VAR_NAME` — remove
- `OLD_VAR_NAME` → `NEW_VAR_NAME` — rename

## Database / schema migrations

- <Migration filename or identifier>: <one sentence on what the migration does, based only on diff contents>
```

---

## Formatting requirements

### PR title

- The PR title is a plain unformatted text line (no inline backtick wrapping). With a confirmed issue id, prefix the title (e.g. `#42 feat: Add scorecard UI`). With ticket status `none`, use `type: Short descriptive title` only.
- Do not invent issue numbers. If the developer confirms no issue, omit the prefix.
- `type` follows conventional commits: `feat`, `fix`, `chore`, `refactor`, `docs`, etc.
- The short title describes the primary change in plain language — max ~70 characters total for the full title
- Example with issue: `#12 feat: Add browser audio recording flow`
- Example with no issue: `docs: Update agent workflow docs`
- This line is what the developer pastes directly as the GitHub PR title

### Target branch

- **Omit this section entirely when the target branch is `main`.** It adds no information reviewers need.
- **Include this section only when targeting a non-`main` branch** (e.g. a feature branch, a release branch, or another PR's branch). In that case the section must:
  - Name the target branch
  - Explain to reviewers that the diff will include commits from the target branch that are not yet in `main`, and that files modified on the target branch but not in this PR may appear in the diff
  - Instruct reviewers to focus only on changes introduced by this branch
  - Note that once the target branch merges to `main`, this PR should be rebased before final merge
- Do not just list the branch name — the purpose of this section is reviewer context, not a label

### Depends on

- **Omit this section entirely if there are no dependencies.** Do not write "None."
- When present: listed in merge order (the PR that must merge first appears first)
- One bullet per dependency; each bullet includes the PR number or branch name and a one-sentence reason

### Linked tickets

- **Omit this section entirely if there are no linked tickets.** Do not write "None."
- When present: one bullet per ticket; ticket ID required, short description or URL optional and only included if the developer supplied it

### Summary

- One paragraph only, maximum 4 sentences
- Must be substantive — name the specific systems, components, or behaviors that changed. Generic sentences like "Various improvements were made" or "Several files were updated" are not acceptable.
- Only include meaningful additions, removals, or modifications directly present in the PR compared to the target branch
- Do not mention implementation history, review process, or anything not visible in the final diff

### Change-overview table

This section gives reviewers an at-a-glance chart of what the PR adds, removes, and changes — the high-level shape of the work before they read it file by file. It is **always required**, but unlike every other section its **columns and heading are not fixed**: they are chosen per-PR to fit the actual work in the diff. A PR that wires up API endpoints, a PR that refactors a styling system, a PR that bumps dependencies, and a PR that migrates a data model each want a different table. Picking the right columns is the agent's job.

**Deriving the table for this PR:**

1. **Identify the dominant unit of change in the diff.** Ask: what is the most natural "thing" each row of this PR represents? Endpoints/surfaces? UI components? Config keys? Renamed entities? Removed features? Packages? Data-model fields? That unit becomes the first column.
2. **Choose 2–4 columns total.** The first column names the unit; the remaining columns capture the dimensions that actually matter for _this kind of change_ and that a reviewer would want at a glance. Only include a column if most rows have a meaningful, diff-grounded value for it — do not pad to a fixed width.
3. **Mark add / remove / change.** The table must make it easy to see what is new, what is gone, and what is modified. Do this whichever way reads most cleanly for the chosen unit: an explicit status column, or an inline `(new)` / `(modified)` / `(removed)` tag on the first-column value (as in the illustrative example below). Pick one approach and use it consistently within the table.
4. **Name the heading to match the unit.** The `##` heading is chosen to describe what the table shows, not the literal words "Change overview." Examples: `## What's wired up` for endpoints, `## Components touched` for UI work, `## Config changes` for configuration, `## Packages` for dependency work, `## Schema changes` for data-model work. Keep it short and accurate.

**Illustrative example** — this is one shape for one kind of PR (API surface work), not a template to force onto every PR:

> ## What's wired up
>
> | Surface                                            | What it does                                                                                                                            | Auth                |
> | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
> | `POST /api/user/wallets` (modified)                | Fire-and-forget sync kicked off after the primary-wallet sync succeeds; response time unchanged, inventory populates in the background. | Session             |
> | `POST /api/admin/sync-wallet-inventory` (new)      | Manual reseed by wallet address and user id; mirrors the existing admin reseed endpoint in shape and auth.                              | Bearer secret       |
> | `POST /api/user/wallets/[id]/sync-inventory` (new) | Per-wallet manual reseed powering the upcoming Sync button; ownership is pinned so a session can only reseed wallets it owns.           | Session + ownership |
>
> All three call into a shared inventory-sync service that pages the chain provider, filters to the target collection, and delegates each match to a new mapper.

**Rules for the table:**

- The table is **supporting, higher-altitude detail** — it complements the file-by-file section, it does not duplicate it. Rows are units of behavior/change (an endpoint, a component, a config key), not a restatement of the file list. Do not produce one row per file just to mirror file-by-file.
- Every cell must be grounded in the final diff. Do not invent rows, columns, statuses, or relationships to fill the table out. If a dimension isn't determinable from the diff, drop that column rather than guessing.
- If the diff is small enough that a meaningful multi-row table cannot be honestly constructed (e.g. a single-file one-line change), still include the section with a minimal table of the change(s) present — one row is acceptable. Do not fabricate additional rows to make it look fuller.
- Keep cell text concise — a short phrase or one sentence per cell, same factual register as the rest of the output. No filler, no praise, no speculation about intent.
- The table must never contain environment variable values, sample values, defaults, or secret contents. Where a row references auth or config, name it generically (e.g. "Bearer secret", "session") — never reproduce the value.
- Choose the table that genuinely helps a reviewer see the shape of the PR. If you find yourself forcing the API-style `Surface / What it does / Auth` columns onto a PR that isn't about API surfaces, stop and pick columns that fit the actual change.

### File-by-file changes

- Every changed file must appear exactly once
- Files must be grouped under subheadings inferred from file paths and types
- Subheading names must be chosen to accurately describe the files within them (examples below are illustrative, not a fixed list)
- Common groupings to infer when applicable:
  - **Frontend components** — `.tsx`, `.jsx`, `.vue`, `.svelte` files in component directories
  - **Frontend styles** — `.css`, `.scss`, `.module.css`, style-related files
  - **Backend / API** — server routes, controllers, handlers
  - **Business logic / services** — service layers, domain logic, utilities used by backend
  - **Database / migrations** — migration files, schema definitions, ORM models
  - **Shared / utilities** — code shared across frontend and backend
  - **Types / interfaces** — `.d.ts`, type-only files, shared schemas
  - **Configuration** — config files, `.env.example`, build configs, CI workflows
  - **Tests** — test files, fixtures, mocks
  - **Documentation** — `.md` files, inline docs
  - **Dependencies** — `package.json`, lockfiles, `requirements.txt`, etc.
- Do not invent a group for a single unrelated file — place it under the most accurate available group, or use a clearly named one-off group
- Within each group, sort files alphabetically by path (for renamed/moved files, sort by the new path)
- **One bullet per file — no exceptions.** Every file in the diff gets its own bullet. Files may never be batched together, omitted because they seem minor, or summarized as a group (e.g. "3 files updated for consistency" is not acceptable).
- Each bullet must state **both** what changed in that file **and** why it was necessary. A sentence that only states what changed ("Added border style") without the reason is incomplete. A sentence that only gives a vague reason without the change is also incomplete.
- One sentence per bullet — concise and specific. Do not exceed one sentence.

#### Renamed and moved files

- When git detects a file as a rename or move (rather than a delete + add), represent it on a single bullet using the form `` `old/path.ext` → `new/path.ext`: <one sentence> ``
- The sentence must state both that the file was moved/renamed and what (if anything) changed about its contents
- If the file was only moved with no content changes, the sentence should say so explicitly (e.g. "Moved without content changes to align with the new module layout")
- Place the bullet in the group that best matches the new location, not the old one
- A pure delete + new file (not detected as a rename) is two separate bullets, listed in the appropriate groups for each
- Do not list the same file under both its old and new paths as separate bullets

### Environment variables

This section identifies **only the variables that need to be added, removed, or renamed**. It does not include the variables' values, contents, or any details about how they are used.

- Detect variables by looking for changes to `.env.example`, `.env.template`, config files, deployment manifests, or new/removed references to `process.env.X`, `os.environ["X"]`, `import.meta.env.X`, etc.
- Each bullet must contain only:
  - The variable name (in backticks)
  - An em dash
  - The action: `add`, `remove`, or `rename`
- For renames, use the form `` `OLD_NAME` → `NEW_NAME` — rename `` and nothing more
- Do **not** include any of the following, under any circumstances:
  - The actual value, sample value, placeholder, or default
  - A description of what the variable does or controls
  - Where the variable is consumed in the codebase
  - Whether the variable is required vs optional
  - Any commentary, justification, or context
- The goal is a clean checklist a developer can act on: which env vars to add, which to remove, which to rename. Reviewers and developers can look up purpose and values in the diff itself or in internal secret stores.
- **Omit this section entirely if no environment variables changed.** Do not write "None."

### Database / schema migrations

- **Omit this section entirely if no migrations are present.** Do not write "None."
- When present: only include migrations present as new files in the diff; describe what the migration does based on its actual contents

### Tables

- Beyond the required change-overview table, additional tables are permitted only when they materially aid understanding of something the required format does not already cover — for example, showing a before/after relationship between renamed entities, or clarifying how a set of related migrations connects to specific endpoints.
- Tables must not be used to expand the Environment variables section. That section is strictly a name + action checklist and must remain so.
- Tables must not replace any required section — every required section above must still appear in its specified format.
- An additional table must be placed under an existing section (typically as supporting detail) or under a clearly named additional subheading immediately after the section it supports.
- Do not use an additional table when a bullet list would communicate the same information just as clearly.
- Every cell in any table must be grounded in the final diff. Do not invent rows, relationships, or columns to fill space.
- Tables must never contain env var values, sample values, defaults, or usage details.

---

## Do not

- Do not include any text before the code block
- Do not include any text after the code block
- Do not generate the output before completing the pre-generation phase and receiving the developer's confirmation on linked tickets
- Do not reference any code, files, or behavior from earlier in the conversation that is not present in the freshly fetched final diff
- Do not include environment variable values, defaults, sample values, descriptions of purpose, or usage locations — only names and required actions
- Do not write "None" in any section — omit the entire section instead when it has no content
- Do not list a renamed/moved file under both its old and new paths as separate bullets when git detects it as a rename
- Do not omit the file-by-file changes section for any reason — not for large diffs, not for "simplicity," not for brevity. It is always required.
- Do not batch, group, or omit individual files within the file-by-file section — every file in the diff must have its own bullet with both what changed and why.
- Do not omit the change-overview table, and do not force the API-style `Surface / What it does / Auth` columns onto a PR whose work is not about API surfaces — derive columns that fit the actual diff.
- Do not produce a change-overview table that is just a one-row-per-file restatement of the file-by-file section — its rows are higher-altitude units of change.
- Do not write a summary that is generic or non-specific — it must name the actual systems and behaviors changed.
- Do not include a test plan, testing steps, QA checklist, or any testing-related section — testing is the developer's responsibility before PR submission.
- Do not add any sections beyond those in the required output format — no rollback notes, no test plans, no appendices, no extra notes.
- Do not invent an issue prefix; use a confirmed issue id or `type: title` when the developer confirmed no issue
- Do not omit the PR title section from the output
