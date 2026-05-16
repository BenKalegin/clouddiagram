# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
pnpm dev              # start Vite dev server
pnpm build            # production build
pnpm build:lib        # library build
pnpm test             # run unit tests (vitest, single pass)
pnpm test:watch       # vitest in watch mode
pnpm test:e2e         # Cypress e2e tests
```

Run a single unit test file:
```bash
pnpm exec vitest run src/features/export/mermaidFormat.test.ts
```

## Code Style & Architecture

- **No long methods.** Break functions longer than ~30 lines into smaller, well-named private helpers.
- **DRY.** Extract repeated logic into shared helpers immediately — never duplicate more than two lines.
- **SOLID principles.** SRP (one responsibility per file/class/function), OCP (data-driven dispatch over if/else chains), LSP, ISP (small focused interfaces), DIP (depend on abstractions, inject dependencies).
- **Typecheck must pass.** Run `pnpm typecheck` after every change.
- **No magic numbers.** Every numeric literal must be a named constant. Exceptions: `0`, `1`, `-1`, and simple arithmetic identities.
- **No magic strings.** Same rule for string literals that represent enum-like values. Use the paired const + type pattern below.
- **No fallbacks.** No backward-compatibility shims, no degraded-mode code paths. If a feature requires a capability, fail loudly rather than silently falling back.

## Constants & Enums — Domain Co-location

- **No catch-all files.** Never create `constants.ts` or `enums.ts` barrel files. Each constant and enum lives in the module that owns its domain concept.
- **Co-locate with the owner.** A constant used by one file belongs in that file (unexported). A constant shared within one domain belongs in the module defining the concept.
- **Enum const objects over raw strings.** Always use the `const` object member — never the raw string literal. This enables rename-safe refactors and compile-time exhaustiveness checks.
- **Paired const + type pattern.** Every enum-like value uses:
  ```ts
  export const Foo = { Bar: "bar", Baz: "baz" } as const;
  export type Foo = (typeof Foo)[keyof typeof Foo];
  ```
  Compare with `value === Foo.Bar`, not `value === "bar"`.

## Commit Rules

- **Never commit or push unless explicitly asked.** Wait for the user to review changes and request a commit.
- **Commit messages: one line.** Use a single concise line. Only use a second line if the change is genuinely large and one line cannot summarize it — and even then, no blank separator line and no trailers (no `Co-Authored-By`, no "Generated with..."). Keep `git log --oneline` readable.
