# Workflow Authoring

This file defines the standards and conventions for writing agent workflow documents in `docs/agent-workflows/`. Consult it when creating a new workflow or significantly restructuring an existing one.

---

## Standards

Workflow documents in this project conform to three interlocking standards:

| Standard | Scope | Key requirement |
| -------- | ----- | --------------- |
| [AGENTS.md community spec](https://agents.md/) | File naming, placement, precedence | Flexible Markdown; no mandatory sections; agent-neutral syntax |
| [MCP specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25) | Document structure | Purpose, inputs, outputs, and constraints sections; RFC 2119 language for requirements |
| [Claude Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) | Discoverability model | Skills use YAML frontmatter (`name`, `description`) and are auto-loaded; workflows here are explicit on-demand only — no YAML frontmatter |

**AAIF governance:** AGENTS.md and MCP are both governed by the [Agentic AI Foundation (AAIF)](https://lfaidata.foundation/projects/aaif/), a directed fund of the Linux Foundation co-founded by Anthropic, OpenAI, and Block. Both specifications were donated to AAIF in December 2025. Workflows must remain compatible with the AAIF-governed versions of these specs as they evolve.

---

## Authoritative references

### AGENTS.md community specification

**URL:** https://agents.md/

Defines the `AGENTS.md` file format — a flexible Markdown file placed at the repo root (or any directory) to provide agent instructions. No mandatory sections. The closest file in the directory tree takes precedence. Used by 60,000+ open-source projects and supported by Claude Code, Codex, Copilot, Cursor, Windsurf, and others. This project's `AGENTS.md` is the authoritative source of project conventions.

### MCP specification (2025-11-25)

**URL:** https://modelcontextprotocol.io/specification/2025-11-25

Defines the Model Context Protocol — the JSON-RPC 2.0-based protocol that underlies tool calls, resource access, and prompt handling. The spec's document structure conventions (purpose, inputs, outputs, constraints) informed the required section layout for workflow documents in this project. Use RFC 2119 language (`MUST`, `SHOULD`, `MAY`) for hard requirements within workflow docs.

### Claude Agent Skills — Overview

**URL:** https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

Defines the SKILL.md format: YAML frontmatter (`name`, `description`), progressive disclosure (metadata always loaded; SKILL.md on trigger; resources as needed), and auto-discoverability. **This project does not use SKILL.md** — workflows here are explicit on-demand invocations, not auto-discoverable skills. Reference this spec when evaluating whether a workflow should be promoted to a skill.

### Claude Agent Skills — Best practices

**URL:** https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

Guidance on progressive disclosure, keeping metadata concise, writing clear purpose statements, and scoping outputs. Apply these principles to workflow `## Purpose` and `## Output` sections even though the SKILL.md frontmatter format is not used here.

---

## Conventions template

Use this structure for every new workflow document:

```markdown
# [Short imperative title — 1–3 words, Title Case]

## Purpose

[One sentence describing what the workflow produces or accomplishes.]

**Does not:** [one line on what is explicitly out of scope — prevents scope creep]

---

## Preparation

- Read `AGENTS.md` to load project conventions.
- [Any additional setup steps — git commands to run, files to enumerate, tokens to verify]

---

## Scope  ← include only when scope is non-obvious or configurable

- [What is in scope]
- [What is explicitly excluded]

---

## [Workflow content sections]

[The substantive how-to content — steps, checks, priorities, formats, etc.]

---

## Output

[Describe exactly what the agent produces: format, required sections, mandatory vs optional elements.]

---

## Constraints  ← include when there are hard rules beyond the purpose/does-not line

- [Hard rule 1 — phrased as a prohibition or hard stop]
- [Hard rule 2]
```

**Key rules:**

- **Title:** short noun phrase or imperative verb phrase, 1–3 words. Match the filename (e.g., `merge-review.md` → `# Merge Review`).
- **Purpose:** state the output or action, then a `**Does not:**` line. One sentence each.
- **Preparation:** always starts with "Read `AGENTS.md`". Add only what is actually needed before the workflow begins.
- **Section order:** Purpose → Preparation → Scope (if needed) → workflow content → Output → Constraints (if needed).
- **Agent-neutral:** no vendor-specific syntax, no YAML frontmatter, no Claude-only directives. Works identically with any coding agent.
- **Cross-references:** always reference other workflow files by their current filename (e.g., `css-review.md`, not `css-and-component-standards-review.md`). Always reference `AGENTS.md` in uppercase.
- **RFC 2119 language:** use `MUST`, `MUST NOT`, `SHOULD`, `MAY` for hard requirements in Constraints sections.
