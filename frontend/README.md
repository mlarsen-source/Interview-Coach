# Interview Coach — Frontend

Next.js frontend for the Interview Coach platform.

## Setup

```bash
pnpm install
```

This also installs the pre-push git hooks (via lefthook). Hooks run ESLint, Prettier, and TypeScript checks before any push reaches GitHub.

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Fix formatting |
| `pnpm format:check` | Check formatting |
| `pnpm typecheck` | Run TypeScript check |
