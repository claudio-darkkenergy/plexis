## Context

This change bootstraps the Plexis library from a finalized spec (`.specs/plexis-composable-spec.md`) and existing TypeScript type definitions (`src/types.ts`). There is no prior runtime code in this repository; `.specs/plexis/` contains an older reference implementation that uses an options-based `Machine`/`createMachine` API and is not the target.

The library must run in Node.js, browsers, and serverless environments with zero runtime dependencies. The published artifact must ship in ESM, CJS, and TypeScript declaration formats.

The public API has two construction paths over a single runtime model:

- **Composable authoring API** (primary): `defineDomain(id, setup, options?)` and `definePipeline(id, setup, options?)` plus registration helpers `state()`, `edge()`, `node()`, `fork()`, `terminal()`. The setup function executes synchronously inside a builder scope.
- **Class constructors** (advanced): `new Domain(id, setup, options?)`, `new Pipeline(id, setup, options?)`, `new Tracer(options?)` for subclassing and explicit instance construction. Class instances satisfy the `Domain<TContext, TEdges>`, `Pipeline<TContext>`, and `Tracer` interfaces declared in `src/types.ts`.
- **Tracer**: `createTracer(options?)` / `new Tracer(options?)`. The verb differs from `define*` because Tracer has no builder scope and no setup phase.

The runtime semantics — execution order, fork evaluation, context merge, trace event taxonomy, graph descriptors — are fixed by the composable spec and are not up for redesign in this change.

## Goals / Non-Goals

**Goals:**
- Stand up `src/core/`, `src/graph/`, `src/index.js`, `src/types.js` as the implementation layout.
- Deliver the composable authoring API (`defineDomain`, `definePipeline`, `state`, `edge`, `node`, `fork`, `terminal`) as the primary surface, plus class constructors that route through the same builder.
- Enforce immutable context flow: every mutation goes through a merge of a returned patch.
- Emit the full trace event taxonomy with `parentId` linking so the `tree` export produces a hierarchical timeline.
- Provide graph descriptors and path queries that work uniformly across Domain, Pipeline, and cross-boundary (Domain state → attached pipeline node).
- Use `PlexisError` with structured fields (`code`, `domainId`, `pipelineId`, `nodeId`) for every documented failure mode, including `BUILDER_CLOSED` for registration-helper misuse.
- Keep the runtime free of external dependencies and free of framework couplings.

**Non-Goals:**
- No actor runtime, event queue, interpreter loop, or scheduled-transition machinery.
- No persistence adapter beyond plain serializable snapshots.
- No React, Vue, or framework-specific integration in the published package.
- No visual graph editor — only structured `GraphDescriptor` output suitable for downstream UIs.
- No options-based authoring API (e.g., `createDomain(id, configObject)`); the composable spec explicitly rejects this as the primary authoring style.
- No backwards-compatibility shim for the older `Machine` / `createMachine` naming.

## Decisions

### D1 — File layout: `src/core/`, `src/graph/`, `src/index.js`, `src/types.js`

`src/core/` will hold runtime primitives (`domain.js`, `pipeline.js`, `tracer.js`, `errors.js`, `context.js`). `src/graph/` will hold static graph descriptors and path queries (`descriptor.js`, `paths.js`, `inspection.js`). `src/index.js` is the public barrel. `src/types.js` mirrors `src/types.ts` via JSDoc so JS consumers get IntelliSense without a TS toolchain.

**Alternative considered**: a single flat `src/` directory. Rejected because the graph layer is large enough to deserve isolation and because `src/core/` makes the boundary between runtime semantics and static introspection visible.

### D2 — One runtime model, two construction paths via shared internal builder

`defineDomain(id, setup, options)` and `new Domain(id, setup, options)` both route through a single internal `buildDomain(id, setup, options)` function. `buildDomain` opens a builder scope, runs `setup` synchronously (during which registration helpers `state()`, `edge()`, etc. populate the builder), reads the setup's return value (`{ context, initial, strict?, errorPolicy? }`), validates the resulting graph, and instantiates a `Domain` whose public methods/properties satisfy the `Domain<TContext, TEdges>` interface declared in `src/types.ts`. The same pattern applies to `definePipeline` / `new Pipeline` via `buildPipeline`.

The Tracer is constructed differently — it has no builder scope — so `createTracer(options)` and `new Tracer(options)` simply share one constructor implementation.

**Alternatives considered**:
- A class constructor that accepts a pre-sealed config object (bypassing the setup function) — rejected because it introduces a second construction path through the internals and nothing in `src/types.ts` or the composable spec calls for it.
- Two separate implementations for factory and class — rejected because the surfaces would drift and double the test matrix.

### D3 — Immutable context via shallow-merge by default, custom merger optional

Default merge is `nextContext = { ...prev, ...patch }`. Handlers returning `void`, `null`, or `undefined` produce no change. Both `Domain` and `Pipeline` accept a `merge(prev, patch, metadata)` option to override (e.g., for deep merges or Immer). `metadata` carries `phase`, `domainId`, `pipelineId`, `nodeId`, `stateId`, `event` so the merger can specialize.

**Alternative considered**: structuredClone-then-mutate. Rejected because it's slower, hides intent, and breaks the explicit-patches contract.

### D4 — Tracer event taxonomy and `parentId` linking

The Tracer emits events at nine levels (`domain`, `state`, `edge`, `pipeline`, `pipeline-node`, `fork`, `action`, `guard`, `condition`) with statuses (`started`, `completed`, `blocked`, `selected`, `skipped`, `failed`). Each event carries `id`, `traceId`, optional `parentId`. A single `follow()` call shares one `traceId`; nested pipelines share the parent's `traceId` and link via `parentId`. The `tree` export walks `parentId` to build a hierarchical view.

**Alternative considered**: flat trace with timestamps only. Rejected because hierarchical pipelines are the whole point of `tree` export.

### D5 — Graph descriptors built at definition time, path queries computed lazily

The `GraphDescriptor` (nodes, edges, attachments) is materialized once when the Domain/Pipeline is constructed and is immutable. Path queries (`pathsTo`, `pathsFrom`, `reachableFrom`) are computed on demand using BFS over the descriptor and are not cached in v1. `inspectNode` composes a single descriptor lookup with two path queries.

**Alternative considered**: lazy descriptor + cached paths. Rejected because definition-time validation depends on a complete descriptor and path queries are not hot paths.

### D6 — Cross-boundary references via `GraphNodeRef`

A node is always identified by `{ kind, domainId?, pipelineId?, nodeId?, edgeId?, forkId? }`. This makes cross-boundary inspection (Domain state → attached pipeline node) a uniform query rather than a special case. `inspectNode` accepts either a string id (resolved within the current owner) or a full `GraphNodeRef`.

**Alternative considered**: string ids only with prefix conventions. Rejected because ambiguity is real (state and node ids can collide) and a structured ref is self-documenting.

### D7 — Error model: one `PlexisError` class with `code` field

A single `PlexisError extends Error` class with `code`, optional `domainId`, optional `pipelineId`, optional `nodeId`, and optional `context`. Static factories (`PlexisError.unknownEvent(...)`, `PlexisError.stateMismatch(...)`) construct typed instances. Pipeline error policies (`throw` | `return` | `trace-and-return`) decide whether action exceptions propagate or are captured in the `PipelineRunResult.error`.

**Alternative considered**: one subclass per code. Rejected because consumers usually branch on `code`, not `instanceof`, and subclasses balloon the surface.

### D8 — Strict mode controls only unknown events, not other validation

`Domain.strict: true` causes `follow(unknownEvent)` to throw `UNKNOWN_EVENT`; `strict: false` returns a `status: 'ignored'` result with no state change. Other errors (`UNKNOWN_TARGET_STATE`, `UNKNOWN_INITIAL_STATE`, `STATE_MISMATCH`) always throw regardless of strict mode — they are structural failures, not runtime decisions.

### D9 — JavaScript implementation, TypeScript types via `src/types.ts` + JSDoc mirror

Runtime code is plain JavaScript (`.js`) to keep the toolchain minimal. Type definitions live in `src/types.ts` (authoritative) and are mirrored as JSDoc in `src/types.js` for JS consumers. The published `.d.ts` is generated from `src/types.ts` via `tsc --emitDeclarationOnly`.

The registration helpers (`state`, `edge`, `node`, `fork`, `terminal`) live in `src/core/helpers.js` and are imported from `src/core/domain.js` and `src/core/pipeline.js` so they share a single builder-scope module-level cell. This keeps the helpers thin and the scoping mechanism centralized.

**Alternative considered**: full TypeScript implementation. Rejected for this change scope — it adds toolchain weight without affecting runtime behavior. The decision can be revisited if implementation complexity demands it.

### D10 — Builder scope is module-level, single-threaded, and synchronous

The builder scope is held in a module-level cell inside `src/core/helpers.js`. `buildDomain` / `buildPipeline` push a scope onto that cell before invoking the user's `setup` function and pop it on return (success or throw). Registration helpers (`state`, `edge`, `node`, `fork`, `terminal`) read the current scope; if none is active, they throw `PlexisError` with `code === 'BUILDER_CLOSED'`. Because JavaScript is single-threaded and the setup function must be synchronous (no `await` allowed inside setup — the spec mandates this), nested or concurrent builder scopes cannot collide.

If a user calls a helper from inside an async callback or after the setup function has returned, the scope cell is empty and `BUILDER_CLOSED` is thrown. This catches the common mistake of registering states from an asynchronous handler instead of from definition time.

**Alternatives considered**:
- Passing a `builder` argument into the setup function (e.g., `defineDomain(id, (b) => { b.state(...); })`) — rejected because the composable spec shows free `state()` / `edge()` calls without a builder argument, and threading a builder param adds boilerplate.
- A stack of scopes to allow nested `defineDomain` inside `defineDomain` — rejected because the spec does not allow nesting at definition time (sub-pipelines reference already-built `Pipeline` instances, not nested setups).

## Risks / Trade-offs

- **[Risk]** Factory and class construction paths drift over time → **Mitigation**: route both through one internal `buildDomain` / `buildPipeline`; the spec's "factory and class produce identical instances" scenarios cover this in tests.
- **[Risk]** Module-level builder scope cell could leak between unrelated `defineDomain` calls if exceptions corrupt the stack → **Mitigation**: `buildDomain` / `buildPipeline` wrap the setup invocation in `try { ... } finally { popScope() }` so the scope is always cleared, even on thrown errors during setup.
- **[Risk]** Tracer event explosion under deeply nested pipelines → **Mitigation**: `Tracer` accepts `maxEvents` (default 1000); events past the cap are dropped with a single boundary record. Document the cap.
- **[Risk]** Path queries are O(V+E) per call and could be slow on large graphs → **Mitigation**: ship without caching in v1; revisit if a real graph exceeds ~1000 nodes. Document the v1 behavior.
- **[Risk]** Shallow-merge default surprises users who expect deep merge → **Mitigation**: documented prominently; `merge` option is first-class on both `Domain` and `Pipeline`.
- **[Risk]** `Machine` → `Domain` rename plus authoring-style change (options → composable) will confuse anyone porting from the `.specs/plexis/` reference → **Mitigation**: changelog entry plus a doc section calling out the renames (`Machine` → `Domain`, `machineId` → `domainId`) and showing the composable migration (`createMachine(id, configObject)` → `defineDomain(id, () => { state(...); ...; return { context, initial } })`).
- **[Risk]** Users may attempt to call registration helpers from async callbacks (e.g., inside a `Promise.then`) and be surprised by `BUILDER_CLOSED` → **Mitigation**: error message names the helper and reminds the user that setup must be synchronous; documented in the README and JSDoc.
- **[Trade-off]** Zero-dependency means re-implementing UUID generation, deep equality (if needed), and merge utilities → accept the cost; keep them tiny and internal to `src/core/`.
- **[Trade-off]** Asymmetric naming (`createTracer` vs. `defineDomain` / `definePipeline`) requires explanation, but matches semantics — Tracer has no builder scope, so `define*` would mislead.

## Migration Plan

This change introduces the library; there is no prior production code to migrate. Rollout:

1. Land `src/core/`, `src/graph/`, `src/index.js`, `src/types.js` behind the existing `src/types.ts` contract.
2. Stand up build pipeline producing `dist/esm/`, `dist/cjs/`, `dist/types/`.
3. Wire test infrastructure (Vitest + `@vitest/coverage-v8`) and require coverage for every spec scenario in this change.
4. Publish `0.1.0` once all `tasks.md` items are green.

**Rollback**: any pre-release version can be unpublished from npm within 72 hours of publish. The repository state itself is reversible via git.

## Open Questions

- ~~Test runner: Jest (as used in `.specs/plexis/`), Vitest, or Node's built-in `node:test`?~~ **Resolved: Vitest** (`vitest.config.ts` created; `@vitest/coverage-v8` for coverage).
- Trace `id` factory: built-in `crypto.randomUUID()` (Node 19+ / modern browsers) vs. a 16-byte hex generator? Default to `crypto.randomUUID()` with `idFactory` override allowed via `TracerOptions`.
- `subscribe` error policy: if a subscriber throws, should the Domain swallow the error and continue? Default: swallow and report via `onSubscriberError` (`TracerOptions.onSubscriberError`).
