## ADDED Requirements

### Requirement: All runtime source files are TypeScript

All files under `src/core/` and `src/graph/` SHALL be TypeScript (`.ts`) with explicit type annotations. Plain JavaScript source files SHALL NOT exist in `src/`. The TypeScript compiler SHALL be able to type-check the entire `src/` tree without `allowJs` or `checkJs` flags.

#### Scenario: tsc --noEmit passes on a clean TypeScript-only src/

- **WHEN** `npm run typecheck` is run after the migration
- **THEN** `tsc --noEmit` SHALL exit 0 with no errors and no `allowJs`/`checkJs` flags in `tsconfig.json`

### Requirement: Domain and Pipeline implementations satisfy their declared interfaces

The `Domain` class SHALL explicitly declare `implements Domain<TContext, TEdges>` and the `Pipeline` class SHALL explicitly declare `implements Pipeline<TContext>`, where the interface shapes come from `src/types.ts`. TypeScript SHALL enforce this conformance at compile time.

#### Scenario: Implementation drift is caught at compile time

- **WHEN** a method required by the `Domain` interface is missing or incorrectly typed in `src/core/domain.ts`
- **THEN** `npm run typecheck` SHALL fail with a TypeScript error identifying the discrepancy

### Requirement: No parallel JS/TS barrel files

`src/index.ts` SHALL be the single public barrel. `src/index.js` SHALL NOT exist. `src/types.js` SHALL NOT exist.

#### Scenario: Single entry point resolves correctly

- **WHEN** the examples and tests import from `../src/index.js` (tsx/Vite resolve `.js` to `.ts`)
- **THEN** the import SHALL resolve to `src/index.ts` and all named exports SHALL be available
