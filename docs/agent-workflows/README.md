# Agent Workflows

This directory contains canonical, agent-neutral workflow instructions for repetitive review and output tasks used in this repository.

## How instruction files are used

This repository uses multiple layers of agent-facing documentation.

- `frontend/AGENTS.md` is the always-on instruction file for frontend conventions, component/CSS standards, and agent expectations. The root [README.md](../../README.md) covers full-stack setup and architecture.
- Agent-specific markdown files such as `CLAUDE.md` are adapters for tools that support their own project instruction file. These should contain only the guidance that is specific to that agent or needed by that agent's workflow.
- `docs/agent-workflows/` is the shared library of reusable, task-specific workflows. These documents are for on-demand tasks such as branch reviews, CSS reviews, test-suite reviews, PR text generation, and implementation planning.

Use `frontend/AGENTS.md` for durable frontend standards, use agent-specific files only when a specific tool requires them, and use the workflow docs in this directory for repeatable task instructions that should not run automatically on every request.

Do not create agent-specific markdown files unless there is a real agent integration that reads them. This repo uses `frontend/AGENTS.md` and `frontend/CLAUDE.md`; additional files such as `gemini.md` or `codex.md` are not needed unless a specific tool requires them.

## Purpose

- Keep task-specific prompts out of `frontend/AGENTS.md`, `CLAUDE.md`, and other always-on agent files
- Maintain one reviewed source of truth for recurring workflows
- Allow different agent systems to reference the same workflow docs without duplicating prompt content

## Usage

- Use these documents for task-specific workflows that should run on command, not automatically on every task
- Keep frontend standing rules in `frontend/AGENTS.md`
- Keep agent-specific adapter files (`CLAUDE.md`, Cursor rules, Codex skills, etc.) lightweight and point them to these workflow docs when appropriate

## How to invoke these workflows

These workflow docs are agent-neutral. Most AI tools will not run them automatically just because the files exist, so you should invoke them explicitly in your prompt.

### General pattern

Tell the agent which workflow file to use and what task to perform.

Example:

```md
Use `docs/agent-workflows/pull-request-description-generator.md` and generate PR-ready text for this branch against `main`.
```

### Copy/paste prompt examples

```
Use docs/agent-workflows/pre-merge-full-review.md and run a complete pre-merge review of this branch.

Use docs/agent-workflows/branch-change-impact-audit.md and audit what changed on this branch against main.

Use docs/agent-workflows/code-quality-review.md and perform a strict code quality review of this branch against main.

Use docs/agent-workflows/css-and-component-standards-review.md and review all styling and component changes in this branch.

Use docs/agent-workflows/test-suite-quality-review.md and review the existing test suite for simplicity and overengineering.

Use docs/agent-workflows/feature-flag-gating-review.md and verify that this feature flag fully controls the new behavior and supports rollback.

Use docs/agent-workflows/manual-qa-checklist-generator.md and generate a concise manual QA checklist for the current diff.

Use docs/agent-workflows/pull-request-description-generator.md and generate PR-ready text for the current branch against main.

Use docs/agent-workflows/feature-implementation-planning.md and create an implementation plan for this feature before writing code.

Use docs/agent-workflows/figma-design-to-code.md and implement this Figma design.
```

## Workflows

| File                                    | What it does                                                                                                                                                      | What it does NOT do                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `pre-merge-full-review.md`              | Orchestrates review phases with user checkpoints and a mandatory PR-description decision                                                                          | Performs review logic itself — delegates to sub-workflows |
| `branch-change-impact-audit.md`         | Surveys what changed, behavior impact, regression risks, integration consistency                                                                                  | Assesses code quality, CSS, or test quality               |
| `code-quality-review.md`                | Reviews implementation correctness, performance, backend API usage, new route security, conventions, architecture, and React patterns                             | Summarizes what changed; deep CSS review                  |
| `css-and-component-standards-review.md` | CSS quality, module.css compliance, Tailwind-vs-module.css placement, design token usage, Storybook story coverage                                                | Business logic, JS correctness                            |
| `test-suite-quality-review.md`          | Reviews test simplicity, readability, and appropriate scope                                                                                                       | Checks coverage gaps in new code; runs tests              |
| `feature-flag-gating-review.md`         | Verifies flag fully controls behavior and supports clean rollback                                                                                                 | General code quality outside flag gating                  |
| `manual-qa-checklist-generator.md`      | Generates a manual QA checklist scoped to the branch diff                                                                                                         | Automates testing; reviews code                           |
| `pull-request-description-generator.md` | Generates PR-ready text — summary, change-overview table, grouped file-by-file changes, dependency declaration, env var callouts, migration notes, linked tickets | Reviews or recommends anything                            |
| `feature-implementation-planning.md`    | Creates an implementation plan covering scope, schema changes, complete file manifest, implementation order, integration points, and verification steps           | Writes code; reviews existing code                        |
| `figma-design-to-code.md`               | Guides Figma design extraction, token mapping, and component implementation                                                                                       | Reviews existing code independently                       |

## Maintenance

- Update these files when the team changes the workflow requirements or output formats
- Treat these files as the canonical version rather than maintaining separate copies in multiple agent-specific files
- When adding a new workflow, add it to this README and the workflow section in `frontend/AGENTS.md`
