# Figma Design to Code

## Purpose

Guides **implementation of UI from a Figma design** — extracting designs via MCP tools, adapting reference code to the Interview Coach frontend stack, mapping design tokens to `app/globals.css`, and verifying component compliance before marking work complete.

**Does not:** review existing code, perform standalone CSS review, or assess code quality independently of a design task. Styling and component standards are defined in `frontend/AGENTS.md` and `css-and-component-standards-review.md` — this workflow references those standards rather than restating them.

---

Use this workflow when implementing UI from a Figma design, extracting design tokens, or auditing a component against its Figma spec.

## Access

- **Token:** `FIGMA_PERSONAL_ACCESS_TOKEN` (or the env var your Figma MCP server expects) — set locally or via your agent secrets; never commit tokens.
- **Design file:** Use the file key and node id from the Figma URL the user provides. This project does not ship a canonical design-system file key in-repo.
- **MCP server:** Prefer Figma MCP tools over direct REST when both can accomplish the task.
- **Token verification:** Before starting, confirm the token works (`GET https://api.figma.com/v1/me` with `X-Figma-Token`, or the MCP equivalent). If access fails, stop and ask the user to confirm project access.

## Getting a node ID from a Figma URL

```
figma.com/design/:fileKey/:fileName?node-id=:nodeId
```

Convert `-` to `:` in the node ID (e.g. `123-456` → `123:456`).

FigJam: `figma.com/board/:fileKey/...` — use `get_figjam`.

## Preferred tools

| Tool                   | When to use                                              |
| ---------------------- | -------------------------------------------------------- |
| `get_design_context`   | Primary — code, screenshot, hints for a node           |
| `get_screenshot`       | Visual reference only                                    |
| `get_metadata`         | Hierarchy and component names                            |
| `get_variable_defs`    | Design tokens and variables                              |
| `search_design_system` | Reusable components in connected libraries (if any)      |
| `get_code_connect_map` | Existing Figma → codebase mappings                       |

REST fallback: `https://api.figma.com/v1/` with `X-Figma-Token` when MCP cannot complete the task.

## Design-to-code workflow

### Before you start — Code Connect

If the user’s file has Code Connect mappings, use `get_code_connect_map` and prefer mapped codebase components over generated markup.

### Step 1 — Get the design

Start with a specific component or section node, not an entire page when possible.

For large frames: `get_metadata` first, then targeted `get_design_context` per child.

### Step 2 — Adapt reference code to Interview Coach

The MCP reference output is generic React + Tailwind. Before implementing:

- [ ] Tailwind v4 class names match patterns in existing `app/` components
- [ ] Replace inline styles with Tailwind utilities or `ComponentName.module.css`
- [ ] Imports use `@/` mapped to the frontend root (e.g. `@/app/components/...`)
- [ ] Recording/scorecard UI uses presentational components with mock-friendly props for Storybook
- [ ] No backend secrets in client code; API calls go through the FastAPI client module

There is no shared `app/components/ui/` library yet — reuse existing components in the branch or create new ones with `.module.css` + `.stories.tsx` per `frontend/AGENTS.md`.

### Step 3 — Map design tokens

Map Figma variables to CSS variables in `app/globals.css`. Do not hard-code raw hex/spacing when a token exists. Flag gaps to the user.

### Step 4 — Component inventory

Present before coding:

- **Reuse:** existing components in the branch
- **Create:** new files (tsx, module.css, stories)
- **Tokens:** Figma variable → project CSS variable
- **Assets:** icons/images for `public/`

Wait for user confirmation when reuse vs new component is ambiguous.

### Step 5 — Implement

Follow `frontend/AGENTS.md` and `css-and-component-standards-review.md` for file layout, Storybook states (recording, processing, scorecard, errors), and presentational/container split.

**Responsive:** Ask how breakpoints should behave; do not infer from fixed-width Figma frames.

**Assets:** Export via Figma image API or MCP; save under `public/`; use `next/image` for raster assets.

### Step 6 — Visual verification

Compare rendered UI to `get_screenshot` output; note spacing, type, and color drift.

### Step 7 — Compliance check

Confirm each new component has `module.css` (when styled) and `stories.tsx` with named states and mock data.

## Design audit workflow

1. `get_screenshot` for the Figma node
2. Screenshot of the live component
3. List discrepancies (node id, expected vs actual)
4. Minimal fix in module CSS or Tailwind — no unrelated redesign

## Output format

- Figma file key and node id
- Tools used and Code Connect hits/misses
- Component inventory
- Adapted code (not raw MCP dump)
- Story list for new UI
- Token mapping table

## Completion checklist

- [ ] Tokens mapped to `globals.css` variables — no stray magic numbers in JSX/module CSS
- [ ] All meaningful visual states have Storybook stories with mock data
- [ ] No inline `style` in product JSX
- [ ] New components have `.module.css` when they own styles and `.stories.tsx` when they have visual states
