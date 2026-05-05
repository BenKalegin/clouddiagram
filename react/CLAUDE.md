# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
npm run dev           # start Vite dev server
npm run build         # production build
npm run build:lib     # library build
npm test              # run unit tests (vitest, single pass)
npm run test:watch    # vitest in watch mode
npm run test:e2e      # Cypress e2e tests
```

Run a single unit test file:
```bash
npx vitest run src/features/export/mermaidFormat.test.ts
```

## Commit Rules

- **Never commit or push unless explicitly asked.** Wait for the user to review changes and request a commit.
- **Commit messages: one line.** Use a single concise line. Only use a second line if the change is genuinely large and one line cannot summarize it — and even then, no blank separator line and no trailers (no `Co-Authored-By`, no "Generated with..."). Keep `git log --oneline` readable.
