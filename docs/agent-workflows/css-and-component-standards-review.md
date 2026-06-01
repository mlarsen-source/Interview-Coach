# CSS and Component Standards Review

## Purpose

Reviews **CSS quality, module.css compliance, Tailwind-vs-module.css placement, design token usage, and Storybook story coverage** for new or modified components. Flags missing `module.css` files, missing stories, inline styles, and hard-coded values as critical issues.

**Does not:** review business logic, JS correctness, or anything outside styling and component file compliance. Code correctness is covered by `code-quality-review.md`.

---

Review all styling related to a branch with a strict focus on CSS quality, maintainability, consistency, and correctness.

## Before review

- Read `frontend/AGENTS.md` to load project styling conventions and hard rules
- Run `git diff --name-only origin/main...HEAD` to enumerate changed files (substitute the confirmed target branch if not `main`)
- Read adjacent component styles to understand existing patterns before flagging inconsistencies

## Review scope

From the changed files, review:

- All changed `.module.css` files
- All changed `.tsx` / `.jsx` files that apply or compose styles
- Story files for any component introduced or modified in the branch
- Adjacent `.module.css` files for sibling components (to check consistency, not to review in full)

## New component requirements

When a new component is introduced, flag as a critical issue if any of the following are missing:

- **`ComponentName.module.css`** — required for all component-specific styles; no exceptions for "simple" components
- **`ComponentName.stories.tsx`** — required for any component on the reusable UI surface or with meaningful visual states. Must include a named story for every visual state (loading, empty, populated, error, disabled, etc.) with explicit mock data. A bare `Default: Story = {}` relying on a fetch is not acceptable.
- **Interview Coach states to cover when applicable:** recording idle / recording / paused / mic denied; upload or pipeline processing (transcribing, analyzing tone, generating feedback); scorecard empty / partial / complete / API error; delivery score meters with sample arousal/dominance/valence values.
- **All visual state variants covered** — every interactive or conditional state must have a corresponding named story with mock data showing that state

## Review priorities

If only a small number of issues can be flagged, prioritize in this order:

1. **Broken or conflicting styles** — declarations that produce wrong visual output
2. **Accessibility failures** — missing focus states, unreadable contrast, tiny tap targets
3. **Convention violations** — inline styles, hard-coded values where tokens exist, wrong layer (Tailwind vs module CSS), missing `.module.css` or story files for new components
4. **Maintainability risks** — brittle selectors, significant duplication, dead styles
5. **Polish** — naming, minor inconsistencies, optional cleanup

## Review standards

### CSS module quality

Check whether:

- class names are descriptive and consistent
- names clearly match the role of the styled element
- naming is not vague, misleading, or overly generic

### Styling architecture

Check whether:

- styles intended to be local are properly scoped
- shared patterns are handled through the right layer
- project styling conventions are used consistently

Do not recommend moving component-specific styles into global CSS without a strong architectural reason.

### TSX / JSX usage

Check whether:

- styling is applied clearly and intentionally
- class composition is readable
- there are malformed interpolations, missing spaces, duplicated classes, conflicting classes, or unnecessary complexity
- inline styles are used (flag as a hard rule violation)

### Tailwind and module CSS

These are not mutually exclusive. Every component uses both:

- **Tailwind** is used directly in JSX for generic utilities: layout (flex, grid, gap), spacing (p-_, m-_), sizing (w-_, h-_), display, alignment, and visibility.
- **`.module.css`** is always required for component-specific styles: state variants (hover, focus, disabled, error), animations, complex selectors, and any visual identity that spans multiple properties or would produce unreadable Tailwind strings.

The question is never "module.css or Tailwind" — it is "which styling goes in which place." A component that uses only Tailwind utilities and has no module.css file is missing the module.css, not exempt from it.

Flag when:

- A component has no `.module.css` file (hard rule violation — see New component requirements)
- A `.module.css` class contains only `display: flex; gap: 8px` — those properties belong as Tailwind utilities in JSX, not in the module
- A JSX element has 8+ Tailwind classes mixing layout with visual identity — the component-specific portion belongs in module.css
- **`@apply` is used with a parent-context variant** (`@apply group-hover:*`, `@apply group-focus:*`, `@apply peer-*:*`, etc.) in a `.module.css` file → **critical finding (broken visual output)**. These variants expand into cross-element selectors (`.group:hover .child`) that CSS module scoping breaks. Replace with `:global(.group):hover .className { ... }`. This is a deterministic check: grep changed `.module.css` files for any `@apply` line containing `group-hover:`, `group-focus:`, or `peer-` (the variant may appear anywhere in the token list, not only as the first utility after `@apply`).
- **A `group-hover:`, `peer-hover:`, or similar parent-context variant appears as a Tailwind utility in JSX** → finding (convention violation — belongs in CSS module). Grep changed `.tsx`/`.jsx` files for `group-hover:` or `peer-` in `className` values. State-driven visibility or interaction tied to an ancestor's class creates an implicit structural dependency that must be explicit in the CSS module using `:global(.group):hover`.

### Design tokens

Check whether:

- colors, spacing, radius, font sizes, shadows, transitions, z-index values, and similar values are hard-coded
- matching global variables or tokens already exist and should be used

If a hard-coded value appears justified, explain why.

### Selector, specificity, and conflicts

Check for:

- conflicting or redundant declarations
- unnecessary specificity or `!important`
- selectors that are too broad or too narrow
- fragile dependence on DOM structure or nesting
- overly nested selectors tightly coupled to tag structure

Prefer selectors that are simple, intentional, low-specificity, and resilient to small markup changes.

Decision rule: flag it if a future markup change would silently break the style, or if two declarations produce a specificity conflict with a non-obvious winner.

### Duplication and dead code

Check for:

- repeated declarations or values that should share a variable or class
- repeated layout patterns across sibling components
- repeated state styles that should be consolidated
- unused classes, unreachable conditional styles, or legacy styles adding noise

Decision rule: flag duplication only when consolidation would prevent a realistic maintenance error. Flag dead code when it is clearly unreachable or was left over from a previous implementation.

### Layout, spacing, and responsiveness

Check for:

- spacing values that do not align with tokens or conventions
- fixed dimensions that harm responsiveness
- layout hacks or unnecessary absolute positioning
- arbitrary or inconsistent breakpoints
- overflow, clipping, wrapping, or alignment issues on smaller screens

### Typography

Check whether:

- font sizes, weights, line heights, alignment, and wrapping are consistent with the design system
- typography is defined in the right place
- text styling is unnecessarily duplicated

### State styling

Check hover, focus, active, selected, disabled, expanded, collapsed, error, and loading states.

Flag:

- missing focus states
- inconsistent state treatment between sibling components
- inaccessible interactions (states that rely only on color)
- unclear or inconsistent state class names

### Accessibility-related styling

Check for:

- poor contrast
- hidden or suppressed focus indicators
- click targets that may be too small
- overflow that hides important content
- interactions that rely only on hover with no keyboard equivalent

### Animation and transitions

Check whether:

- transitions are targeted (`transition: opacity 150ms`) rather than broad (`transition: all`)
- animations or transitions are likely to cause jank or flicker

## Constraints

- Do not recommend dependency, framework, or library changes
- Evaluate only whether the current styling patterns are appropriate for the technologies already in use
- Do not propose redesigns — flag the concern and the impact
- Do not give generic praise
- Be direct and specific
- Do not accept "it's a simple component" as justification for skipping `.module.css` or stories
- When the same issue appears in multiple places, flag it once and note how many occurrences exist — do not list every instance individually

## Required output format

### Findings

Group by severity:

- **Critical** — broken visual output, accessibility failures, hard rule violations (missing module.css, missing stories, inline styles)
- **High** — convention violations, maintainability risks
- **Low** — cleanup, polish, optional improvements

For each finding: file, selector or usage, what is wrong, why it matters, recommended approach (`.module.css` / Tailwind / global token).

### Summary

One paragraph: is the styling approach solid, or does it need rework? Note any systemic patterns (e.g., "consistent hard-coding of spacing values throughout" rather than repeating the same finding for each instance).
