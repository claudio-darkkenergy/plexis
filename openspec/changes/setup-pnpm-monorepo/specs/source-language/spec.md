## MODIFIED Requirements

### Requirement: All runtime source files are TypeScript

All files under `packages/plexis/src/core/` and `packages/plexis/src/graph/` SHALL be TypeScript (`.ts`) with explicit type annotations. Plain JavaScript source files SHALL NOT exist anywhere in `packages/plexis/src/`. The TypeScript compiler SHALL be able to type-check the entire `packages/plexis/src/` tree without `allowJs` or `checkJs` flags.

#### Scenario: tsc --noEmit passes on a clean TypeScript-only src/

- **WHEN** `pnpm typecheck` is run from the repository root (or `tsc --noEmit` is run inside `packages/plexis/`)
- **THEN** the command SHALL exit 0 with no errors and no `allowJs`/`checkJs` flags in `packages/plexis/tsconfig.json`

### Requirement: Domain and Pipeline implementations satisfy their declared interfaces

The `Domain` class SHALL explicitly declare `implements Domain<TContext, TEdges>` and the `Pipeline` class SHALL explicitly declare `implements Pipeline<TContext>`, where the interface shapes come from `packages/plexis/src/types.ts`. TypeScript SHALL enforce this conformance at compile time.

#### Scenario: Implementation drift is caught at compile time

- **WHEN** a method required by the `Domain` interface is missing or incorrectly typed in `packages/plexis/src/core/domain.ts`
- **THEN** `pnpm typecheck` SHALL fail with a TypeScript error identifying the discrepancy

### Requirement: No parallel JS/TS barrel files

`packages/plexis/src/index.ts` SHALL be the single public barrel for the library. `packages/plexis/src/index.js` SHALL NOT exist. `packages/plexis/src/types.js` SHALL NOT exist.

#### Scenario: Single entry point resolves correctly

- **WHEN** the examples and tests inside `packages/plexis/` import from `../src/index.js` (tsx/Vite resolve `.js` to `.ts`)
- **THEN** the import SHALL resolve to `packages/plexis/src/index.ts` and all named exports SHALL be available
