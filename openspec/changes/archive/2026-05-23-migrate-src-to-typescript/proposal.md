## Why

The `src/core/` and `src/graph/` runtime files are plain JavaScript (`.js`). This was Design Decision D9 from `bootstrap-plexis-core`: "keep the toolchain minimal." That rationale no longer holds — every tool in the stack (Rolldown, Vitest, tsx, Vite) already processes TypeScript natively. The JS source files are now an anomaly, not a simplification.

The hybrid state created compounding workarounds:
- `allowJs: true` + `checkJs: false` added to `tsconfig.json` to prevent tsc from failing on untyped JS imports
- A separate `src/index.ts` added as a tsx-resolution shim alongside the existing `src/index.js`
- `src/types.js` JSDoc mirror maintained for no active consumer
- Implementation classes (`Domain`, `Pipeline`, `Tracer`) cannot use `implements` — TypeScript cannot verify they satisfy the `src/types.ts` interfaces at compile time

## What Changes

- Rename all `src/core/*.js` → `src/core/*.ts` and `src/graph/*.js` → `src/graph/*.ts`, adding full TypeScript type annotations.
- Merge `src/index.js` into `src/index.ts` (single barrel file).
- Delete `src/types.js` (JSDoc mirror no longer needed; JS consumers get types from `dist/types/`).
- Remove `allowJs` and `checkJs` from `tsconfig.json` — no more JS source to paper over.
- Make `Domain` and `Pipeline` class implementations explicitly `implements` their respective interfaces from `src/types.ts`.
- Update `rolldown.config.ts` input to reference `src/index.ts` (was `src/index.js`).
- Update `skill-config.md` to reflect the TypeScript source stack.

No runtime behavior changes. Tests, examples, and build outputs are unaffected.

## Capabilities

### New Capabilities

### Modified Capabilities

- `domain`: Implementation file migrated to TypeScript; class `implements Domain<TContext, TEdges>` interface.
- `pipeline`: Implementation file migrated to TypeScript; class `implements Pipeline<TContext>` interface.
- `context-patches`: Implementation file migrated to TypeScript.
- `tracer`: Implementation file migrated to TypeScript; class `implements Tracer` interface.
- `error-handling`: `PlexisError` implementation migrated to TypeScript.
- `graph-introspection`: Graph layer (`descriptor`, `paths`, `inspection`) migrated to TypeScript.

## Impact

- **Renamed/rewritten**: `src/core/{domain,pipeline,tracer,errors,context,helpers}.js` → `.ts`; `src/graph/{descriptor,paths,inspection}.js` → `.ts`
- **Merged**: `src/index.js` + `src/index.ts` → single `src/index.ts`
- **Deleted**: `src/index.js`, `src/types.js`
- **Updated**: `tsconfig.json` (remove `allowJs`, `checkJs`), `rolldown.config.ts` (input path), `skill-config.md`
- **No change**: `src/types.ts`, all tests, all examples, build outputs, public API surface
