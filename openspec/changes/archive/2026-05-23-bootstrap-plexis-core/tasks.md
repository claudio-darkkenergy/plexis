## 1. Project Setup

- [x] 1.1 `devDependencies` confirmed in root `package.json`: `typescript`, `vitest`, `@vitest/coverage-v8`, `rolldown`, `@types/node`
- [x] 1.2 `"type": "module"` set in `package.json`; `tsconfig.esm.json` and `tsconfig.cjs.json` removed (Rolldown owns those outputs)
- [x] 1.3 Added npm scripts to root `package.json`: `build` (rolldown + tsc types), `build:esm`, `build:cjs` (FORMAT env var), `build:types` (tsc), `test` (vitest run), `test:watch` (vitest), `typecheck` (tsc --noEmit). `rolldown.config.ts` created.
- [x] 1.4 Added `"exports"` map (import/require/types), `"main"` → `dist/cjs/index.cjs`, `"module"` → `dist/esm/index.js`, `"types"` → `dist/types/index.d.ts`
- [x] 1.5 Added `"files": ["dist", "src", "README.md"]` to `package.json`
- [x] 1.6 Created `vitest.config.ts` targeting `tests/**/*.test.ts`, `environment: 'node'`, `restoreMocks: true`, coverage via `@vitest/coverage-v8`
- [x] 1.7 Create `tests/` directory and a smoke test that imports from `src/index.js` and asserts the named exports exist

## 2. Errors Module (`src/core/errors.js`)

- [x] 2.1 Implement `PlexisError extends Error` with required `code` and optional `domainId`, `pipelineId`, `nodeId`, `context` fields
- [x] 2.2 Add static factory helpers: `PlexisError.unknownEvent(domainId, state, event)`, `PlexisError.stateMismatch(domainId, expected, actual)`, `PlexisError.unknownInitialState(domainId, state)`, `PlexisError.unknownInitialNode(pipelineId, node)`, `PlexisError.unknownTargetState(domainId, fromState, event, target)`, `PlexisError.unknownTargetNode(pipelineId, fromNode, target)`, `PlexisError.unknownNode(pipelineOrDomainId, node)`, `PlexisError.builderClosed(helperName)`
- [x] 2.3 Write tests for every documented error code including `BUILDER_CLOSED` (covers `error-handling` spec — Documented error codes, PlexisError typed subclass, BUILDER_CLOSED requirement)

## 3. Context Patch Merge (`src/core/context.js`)

- [x] 3.1 Implement default `mergePatch(previous, patch)` returning a new object via shallow spread; SHALL return reference-equal previous when patch is `void`, `null`, or `undefined`
- [x] 3.2 Implement `applyMerge(previous, patch, customMerge?, metadata)` that dispatches to `customMerge` when provided, otherwise to `mergePatch`
- [x] 3.3 Define and document the `MergeMetadata` shape (phase + relevant ids) emitted at each call site
- [x] 3.4 Write tests for: shallow merge overrides matching keys; `undefined`/`null`/`void` returns reference-equal previous; custom merge receives metadata; mutating handler `ctx` does not leak (covers `context-patches` spec)

## 4. Tracer (`src/core/tracer.js`)

- [x] 4.1 Implement `Tracer` class with constructor accepting `enabled`, `captureContext`, `maxEvents`, `clock`, `idFactory`, `onSubscriberError`
- [x] 4.2 Implement `record(partial)` building a full `TraceEvent` (id, traceId, parentId, timestamp, level, type, status, ids, label, from, to, input, outputPatch, contextSnapshot, error, metadata)
- [x] 4.3 Implement `subscribe(listener)` returning unsubscribe; isolate subscriber exceptions and route to `onSubscriberError`
- [x] 4.4 Implement `history()`, `traces()`, `byTraceId(id)`, `clear()`
- [x] 4.5 Implement `export('json' | 'text' | 'tree')`; `'tree'` walks `parentId` chains to produce hierarchy
- [x] 4.6 Enforce `maxEvents` cap with boundary record when events are dropped
- [x] 4.7 Implement `createTracer(options?)` factory returning a `Tracer` instance via the same path
- [x] 4.8 Write tests covering every scenario in `tracer` spec: `createTracer`/`new Tracer` equivalence, taxonomy emission (`domain`, `edge`, `action`, `guard` blocked), `parentId` linking for sub-pipelines, single traceId per follow, `captureContext='after'`, `maxEvents` cap, three export formats, subscriber error isolation, `byTraceId` lookup, shared tracer across primitives

## 5. Registration Helpers and Builder Scope (`src/core/helpers.js`)

- [x] 5.1 Implement a module-level `currentScope` cell with `pushScope(scope)` / `popScope()` operations; expose `withScope(scope, fn)` that wraps `try { push; return fn(); } finally { pop; }` so exceptions during setup never leak the scope
- [x] 5.2 Implement `state(id, def)` — when called inside an active Domain scope, append the state definition to the builder; when no Domain scope is active, throw `PlexisError.builderClosed('state')`
- [x] 5.3 Implement `edge(def)` — return a normalized `EdgeDef` (target, guard, action, pipeline, metadata) for use inside `state(...)` edges; SHALL be callable inside any active scope (domain or pipeline) for symmetry
- [x] 5.4 Implement `node(id, def)` — when called inside an active Pipeline scope, append the node definition to the builder; when no Pipeline scope is active, throw `PlexisError.builderClosed('node')`
- [x] 5.5 Implement `fork(condition, target, options?)` — return a normalized `PipelineForkDef` (condition, target, label, metadata); SHALL be safe to call inside any active scope
- [x] 5.6 Implement `terminal(def?)` — return a `PipelineNodeDef` with `terminal: true` (passing through any action/forks/metadata supplied)
- [x] 5.7 Document that calls to `state` / `node` from async callbacks scheduled inside setup SHALL fail with `BUILDER_CLOSED` because the scope is popped synchronously
- [x] 5.8 Write tests for: helper-outside-scope throws `BUILDER_CLOSED`; helper from deferred async callback throws `BUILDER_CLOSED`; exception during setup leaves no dangling scope; `edge` / `fork` / `terminal` are pure helper builders with no scope dependency (per spec scenarios)

## 6. Graph Layer (`src/graph/`)

- [x] 6.1 `src/graph/descriptor.js`: build a `GraphDescriptor` from a sealed Domain or Pipeline builder — nodes, edges, entryNodes, terminalNodes, attachments
- [x] 6.2 `src/graph/paths.js`: implement `inbound(id)`, `outbound(id)`, `pathsTo(id, options?)`, `pathsFrom(id, options?)`, `reachableFrom(id, options?)`; support `maxDepth`, `includeCycles`, and `direction` options
- [x] 6.3 `src/graph/inspection.js`: implement `inspectNode(descriptor, idOrRef, options?)` returning `NodeInspection`; resolve cross-boundary refs (`{ kind: 'pipeline-node', pipelineId, nodeId }` from a Domain) by looking up the attached pipeline's graph
- [x] 6.4 Wire `GraphAttachment` records into `GraphDescriptor.attachments` for state-entry pipelines and edge pipelines (and onExit hooks if implemented as pipelines)
- [x] 6.5 Expose `DomainGraph` and `PipelineGraph` factory functions returning the per-instance query API (`node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`)
- [x] 6.6 Write tests for: descriptor materialization at construction, `node` lookup (present + undefined), inbound/outbound in declaration order, `pathsTo` enumeration of multiple chains, `reachableFrom` exclusion of unreachable nodes, cross-boundary `inspectNode` from Domain into a pipeline node, `inspectNode` bundling all queries, edge-pipeline attachments appearing in `attachments`

## 7. Pipeline (`src/core/pipeline.js`)

- [x] 7.1 Implement an internal `buildPipeline(id, setup, options)` that pushes a Pipeline builder scope, invokes `setup` synchronously (allowing `node` / `fork` / `terminal` registrations), reads the setup return value `{ initial }`, seals the builder, validates `initial` references an existing node and every string fork `target` references an existing node; throw `UNKNOWN_INITIAL_NODE` / `UNKNOWN_TARGET_NODE` on failure
- [x] 7.2 Build the Pipeline's `GraphDescriptor` at construction time using `src/graph/descriptor.js`
- [x] 7.3 Implement `Pipeline.run(context, input?)`: start at `initial`, execute node action (await async results), merge patch via `applyMerge`, evaluate `forks` in order (first-match-wins, await async conditions), follow string targets to next node OR invoke sub-pipeline targets and merge their returned context, stop at terminal or unmatched fork
- [x] 7.4 Emit trace events at every meaningful step (`pipeline` start/complete, `pipeline-node` start/complete, `action`, `fork` selected/skipped, `condition`); link sub-pipeline events via `parentId` to the parent fork event
- [x] 7.5 Implement `errorPolicy` handling: default `'throw'`, `'return'` populates `result.error` with `status: 'error'`, `'trace-and-return'` also records a `status: 'failed'` trace event
- [x] 7.6 Implement `pipeline.describe()`, `pipeline.trace(format?)`, `pipeline.inspectNode(id|ref, options?)`, `pipeline.graph`
- [x] 7.7 Implement `definePipeline(id, setup, options?)` factory routing through `buildPipeline`
- [x] 7.8 Add `class Pipeline` whose constructor calls the same `buildPipeline` with `(id, setup, options)` to guarantee identical behavior to the factory; instances SHALL satisfy the `Pipeline<TContext>` interface declared in `src/types.ts`
- [x] 7.9 Write tests covering every scenario in `pipeline` spec: `definePipeline`/`new Pipeline` parity, setup function registers nodes via helpers, helpers called outside setup throw `BUILDER_CLOSED`, initial node executes first, first-match-wins fork order, unconditional catch-all, no matching fork → `'stopped'`, terminal → `'completed'`, sub-pipeline merge, run result shape, UNKNOWN_INITIAL_NODE + UNKNOWN_TARGET_NODE thrown at construction

## 8. Domain (`src/core/domain.js`)

- [x] 8.1 Implement an internal `buildDomain(id, setup, options)` that pushes a Domain builder scope, invokes `setup` synchronously (allowing `state` / `edge` registrations), reads the setup return value `{ context, initial, strict?, errorPolicy? }`, seals the builder, validates `initial` references an existing state and every edge `target` references an existing state; throw `UNKNOWN_INITIAL_STATE` / `UNKNOWN_TARGET_STATE` on failure regardless of `strict`
- [x] 8.2 Build the Domain's `GraphDescriptor` at construction time, including edge-pipeline and state-entry-pipeline attachments
- [x] 8.3 Run `onEnter` for the initial state once at construction time and merge its patch into the initial context
- [x] 8.4 Implement `Domain.follow(event, payload?)` executing the documented order: guard → onExit → edge action → edge pipeline → state update → onEnter → state entry pipeline → history record → notify subscribers
- [x] 8.5 Implement `strict` mode: throw `UNKNOWN_EVENT` when the current state declares no edge for `event`; in non-strict mode return `status: 'ignored'`
- [x] 8.6 Implement guard handling: block transition (`status: 'blocked'`) when guard returns/resolves to `false`, with no side effects from later steps
- [x] 8.7 Implement `Domain.can(event, payload?)`: return `true` only when an edge exists and any guard resolves truthy; SHALL have no side effects
- [x] 8.8 Implement `Domain.followFrom(expectedState, event, payload?)`: throw `STATE_MISMATCH` when current state differs from `expectedState`, otherwise delegate to `follow`
- [x] 8.9 Implement `Domain.snapshot()` / `Domain.restore(snapshot)`: state, context, historyLength
- [x] 8.10 Implement `Domain.subscribe(listener)` returning unsubscribe; isolate listener exceptions so one throwing subscriber does not break others
- [x] 8.11 Implement `Domain.history()` returning the chronological array of `DomainHistoryEntry` records
- [x] 8.12 Implement `Domain.describe()`, `Domain.trace(format?)`, `Domain.inspectNode(id|ref, options?)`, `Domain.graph`, `Domain.current`
- [x] 8.13 Implement `defineDomain(id, setup, options?)` factory routing through `buildDomain`
- [x] 8.14 Add `class Domain` whose constructor calls the same `buildDomain` with `(id, setup, options)` to guarantee identical behavior to the factory; instances SHALL satisfy the `Domain<TContext, TEdges>` interface declared in `src/types.ts`
- [x] 8.15 Write tests covering every scenario in `domain` spec: `defineDomain`/`new Domain` parity, setup function registers states via helpers, helpers called outside/after setup throw `BUILDER_CLOSED`, successful follow, ignored unknown event in non-strict, blocked guard, documented execution order, lifecycle hooks (onEnter at construction), `can` true/false, `followFrom` STATE_MISMATCH, snapshot/restore, subscribe (notification + error isolation), history, terminal ignores

## 9. Public Surface

- [x] 9.1 `src/index.js`: re-export `defineDomain`, `definePipeline`, `createTracer`, `state`, `edge`, `node`, `fork`, `terminal`, `Domain`, `Pipeline`, `Tracer`, `PlexisError`
- [x] 9.2 `src/types.js`: JSDoc mirror of `src/types.ts` so JS consumers receive IntelliSense; reference the canonical type names from the source
- [x] 9.3 Confirm `src/types.ts` matches the final implementation shape — update any types whose runtime signature drifted during implementation (e.g. `merge` metadata fields, helper signatures)

## 10. Build & Package

- [x] 10.1 Verify `npm run build:esm` produces `dist/esm/` with module imports resolving correctly
- [x] 10.2 Verify `npm run build:cjs` produces `dist/cjs/` with `require`-compatible output
- [x] 10.3 Verify `npm run build:types` emits `dist/types/index.d.ts` covering all public exports
- [x] 10.4 Confirm zero runtime dependencies: `npm install --production` followed by a require/import smoke test SHALL succeed without any transitive dependencies installed
- [x] 10.5 Add a `package.json` `"engines"` field reflecting the minimum Node version required by built-ins used (e.g. `crypto.randomUUID()`)

## 11. Verification

- [x] 11.1 Run the full test suite and confirm every scenario in `specs/domain/spec.md`, `specs/pipeline/spec.md`, `specs/context-patches/spec.md`, `specs/tracer/spec.md`, `specs/graph-introspection/spec.md`, and `specs/error-handling/spec.md` maps to at least one passing test
- [x] 11.2 Run `npm run typecheck` and resolve any drift between `src/types.ts` and the implementation
- [x] 11.3 Manually exercise the README quick-start examples (Domain + Pipeline) against the built artifacts in `dist/`
- [x] 11.4 Verify factory and class surfaces produce identical `describe()` and runtime behavior via a dedicated parity test for each of `defineDomain`/`new Domain`, `definePipeline`/`new Pipeline`, `createTracer`/`new Tracer`
