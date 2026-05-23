## 1. Toolchain prep

- [x] 1.1 Remove `allowJs` and `checkJs` from `tsconfig.json` — these were workarounds for untyped JS imports
- [x] 1.2 Update `rolldown.config.ts` input from `'src/index.js'` to `'src/index.ts'`

## 2. Leaf modules (no internal deps)

- [x] 2.1 Rename `src/core/errors.js` → `src/core/errors.ts`; add typed constructor, typed static factory methods matching the `PlexisError` declaration in `src/types.ts`; use `private readonly` for class fields
- [x] 2.2 Rename `src/core/context.js` → `src/core/context.ts`; type `mergePatch` and `applyMerge` with `TContext extends object` generics and `MergeMetadata` from `src/types.ts`
- [x] 2.3 Rename `src/graph/descriptor.js` → `src/graph/descriptor.ts`; type `buildDomainDescriptor` and `buildPipelineDescriptor` parameters and return values using `GraphDescriptor`, `GraphNode`, `GraphEdge`, `GraphAttachment` from `src/types.ts`
- [x] 2.4 Rename `src/core/tracer.js` → `src/core/tracer.ts`; add typed constructor options (`TracerOptions`), typed `record()` accepting `Partial<TraceEvent>`, `private` fields; class `implements Tracer` interface from `src/types.ts`

## 3. Mid-level modules

- [x] 3.1 Rename `src/core/helpers.js` → `src/core/helpers.ts`; type the scope cell (`DomainScope | PipelineScope | null`), type all helper function signatures using types from `src/types.ts` (`StateNodeDef`, `EdgeDef`, `PipelineNodeDef`, `PipelineForkDef`)
- [x] 3.2 Rename `src/graph/paths.js` → `src/graph/paths.ts`; type all path query functions with `GraphDescriptor`, `GraphEdge`, `GraphNode`, `GraphPath` from `src/types.ts`
- [x] 3.3 Rename `src/graph/inspection.js` → `src/graph/inspection.ts`; type `inspectNode` parameters and return type (`NodeInspection`) from `src/types.ts`

## 4. Top-level runtime modules

- [x] 4.1 Rename `src/core/pipeline.js` → `src/core/pipeline.ts`; add `TContext extends object` generics throughout `buildPipeline` and `Pipeline` class; class `implements Pipeline<TContext>` using interface alias from `src/types.ts`
- [x] 4.2 Rename `src/core/domain.js` → `src/core/domain.ts`; add `TContext extends object, TEdges extends string` generics throughout `buildDomain` and `Domain` class; class `implements Domain<TContext, TEdges>` using interface alias from `src/types.ts`

## 5. Barrel consolidation

- [x] 5.1 Merge `src/index.js` into `src/index.ts`: the existing `src/index.ts` already exports from the core modules — update all import paths from `.js` → `.ts` extensions, verify all named exports are present; delete `src/index.js`
- [x] 5.2 Delete `src/types.js` (JSDoc mirror is no longer needed)

## 6. Config and docs cleanup

- [x] 6.1 Update `skill-config.md`: change the Stack section to reflect TypeScript source files; remove the "Language: TypeScript + JavaScript runtime" dual description; update folder conventions to show `.ts` extensions on all source files

## 7. Verification

- [x] 7.1 Run `npm run typecheck` — zero errors, no `allowJs`/`checkJs` in tsconfig
- [x] 7.2 Run `npm test` — all 115 tests pass unchanged
- [x] 7.3 Run `npm run build` — Rolldown produces `dist/esm/index.js` and `dist/cjs/index.cjs`; tsc produces `dist/types/index.d.ts`
- [x] 7.4 Run all three examples (`npm run example:payment`, `npm run example:order`, `npm run example:graph`) — each exits 0
