## Context

Nine JS source files (~982 lines) implement the Plexis runtime. `src/types.ts` declares the authoritative interfaces (`Domain<TContext, TEdges>`, `Pipeline<TContext>`, `Tracer`, etc.) that these classes are supposed to satisfy — but since the source is `.js`, TypeScript cannot verify the conformance at compile time. The `allowJs: true` / `checkJs: false` workaround in `tsconfig.json` was added specifically to allow tsc to follow imports into the untyped JS files without erroring.

The toolchain (Rolldown via esbuild, Vitest, tsx, Vite) all handle `.ts` natively without a separate compile step. Converting the source to TypeScript is purely additive — same runtime behavior, stronger compile-time guarantees.

## Goals / Non-Goals

**Goals:**
- All `src/` runtime files are `.ts` with full type annotations.
- `Domain` and `Pipeline` class bodies explicitly `implements` their respective interfaces from `src/types.ts` — TypeScript enforces the contract.
- `tsconfig.json` reverts to clean TypeScript-only config (no `allowJs`/`checkJs`).
- Single `src/index.ts` barrel (no parallel `.js`).
- `src/types.js` removed.
- All 115 existing tests continue to pass unchanged.

**Non-Goals:**
- No runtime behavior changes of any kind.
- No changes to `src/types.ts` (the authoritative interface definitions stay as-is).
- No changes to test files, example files, or published build outputs.
- No API surface changes for consumers.

## Decisions

### D1 — Migrate file by file in dependency order

Convert bottom-up: leaf modules with no internal imports first, then consumers. Order:
1. `errors.ts` (no internal deps)
2. `context.ts` (no internal deps)
3. `helpers.ts` (imports errors)
4. `descriptor.ts` (no internal deps)
5. `paths.ts` (imports descriptor)
6. `inspection.ts` (imports paths, errors)
7. `tracer.ts` (no internal deps)
8. `pipeline.ts` (imports errors, context, helpers, descriptor, paths, inspection)
9. `domain.ts` (imports errors, context, helpers, descriptor, paths, inspection)
10. `index.ts` (merge of index.js + index.ts; imports all)

This order means each file type-checks cleanly as soon as it's converted.

### D2 — Class implementations use `implements`

`class Domain<TContext extends object, TEdges extends string> implements DomainInterface<TContext, TEdges>` — using an import alias `DomainInterface` to avoid the name collision with the class itself. Same for `Pipeline` and `Tracer`.

**Alternative considered:** Keep class names matching interface names without alias. TypeScript allows `class Foo implements Foo` but it's confusing. Alias (`DomainInterface`) is clearer.

### D3 — Type parameters thread through the implementation

`buildDomain` and `buildPipeline` internal functions are typed with `TContext extends object` generics matching the public constructors. The internal builder scope objects are typed with `Record<string, StateNodeDef<TContext>>` etc. so registration helpers (`state`, `node`) see typed state/node definitions.

### D4 — `PlexisError` typed constructor with optional fields

```ts
constructor(message: string, options: {
  code: string;
  domainId?: string;
  pipelineId?: string;
  nodeId?: string;
  context?: unknown;
} = { code: '' }) { ... }
```

The static factory helpers are already declared in `src/types.ts` — the implementation just needs to match those signatures.

### D5 — Remove `allowJs`/`checkJs` from `tsconfig.json`

Once all source files are `.ts`, these flags serve no purpose. The `rootDir: "src"` constraint stays. The `tsconfig.types.json` for declaration emit is unchanged.

### D6 — `src/index.ts` consolidation

The current `src/index.ts` exports runtime values from `./core/domain.js` etc. Once those are `.ts`, the imports just change extension. The `src/index.js` file (the original JS barrel) is deleted — there's no longer any reason for both to exist.

## Risks / Trade-offs

- **[Risk]** Generic type parameters in the implementation may require casts in a few places where the JS was loose (e.g., `applyMerge` with `unknown` patch types) → **Mitigation**: use bounded generics and `as` casts sparingly only where the JS runtime contract is clear but TypeScript can't infer it.
- **[Risk]** `PlexisError`'s dynamic property assignment (`if (domainId !== undefined) this.domainId = domainId`) needs to become typed class fields → straightforward to address with definite assignment or optional fields.
- **[Trade-off]** Type annotations add some verbosity to the implementation files. Acceptable — the files are small enough that this doesn't meaningfully change readability.
- **[Trade-off]** The `_` prefix private fields (e.g., `this._events`, `this._enabled`) are informal privacy in JS. In TypeScript they become either `private` fields or `#` true private. We'll use `private readonly` declarations for clarity without `#` (simpler TS, same ergonomics).
