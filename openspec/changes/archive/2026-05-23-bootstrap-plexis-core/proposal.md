## Why

Plexis needs an initial implementation. Today the repository contains a finalized specification (`.specs/plexis-composable-spec.md`) and TypeScript type definitions (`src/types.ts`), but no runtime code. Teams modeling business state across backend and frontend codebases need a zero-dependency primitive that combines durable domain state machines with finite workflow pipelines, plus tracing and graph introspection — and no existing library covers both layers without pulling in actor runtimes or framework dependencies.

## What Changes

- Introduce a zero-dependency JavaScript implementation of Plexis in `src/` with `src/core/`, `src/graph/`, `src/index.js`, and `src/types.js`.
- Provide the **composable authoring API** as the primary surface: `defineDomain(id, setup, options?)` and `definePipeline(id, setup, options?)` plus registration helpers `state()`, `edge()`, `node()`, `fork()`, and `terminal()`. Setup functions execute synchronously inside a builder scope; the builder is sealed and validated on return.
- Also expose **`Domain` and `Pipeline` class constructors** for advanced use (subclassing, explicit instance construction). The class constructor accepts the same `(id, setup, options?)` arguments as the corresponding `define*` factory and routes through the same internal builder, so the runtime model is single.
- Expose `Tracer` via `createTracer(options?)` and `new Tracer(options?)`. The verb differs from `define*` because the Tracer has no builder scope and no setup phase; the `create*` naming is intentional and signals that distinction.
- Implement two composable runtime primitives:
  - **Domain** — durable state machine with StateNodes, Events, Edges, Guards, Actions, lifecycle hooks (`onEnter`/`onExit`), and edge/state pipelines.
  - **Pipeline** — finite workflow graph with PipelineNodes, ordered first-match-wins Forks, Conditions, terminal nodes, and sub-pipeline embedding.
- Implement immutable context propagation via patch merges — handlers return patches, never mutate context.
- Implement a full Tracer with the complete event taxonomy (≥30 trace event types across domain/pipeline/guard/condition/action levels), `parentId` linking, and `json`/`text`/`tree` export formats.
- Implement graph introspection (`graph.inbound`, `graph.outbound`, `graph.reachableFrom`, cross-boundary path queries) for both Domain and Pipeline.
- Implement `PlexisError` with `code`, `domainId`, `pipelineId`, and `nodeId` fields plus the documented error codes (`UNKNOWN_EVENT`, `STATE_MISMATCH`, `UNKNOWN_INITIAL_STATE`, `UNKNOWN_INITIAL_NODE`, `UNKNOWN_TARGET_STATE`, `UNKNOWN_TARGET_NODE`, `UNKNOWN_NODE`, `BUILDER_CLOSED`).
- **BREAKING (vs. earlier prototype):** rename `Machine` → `Domain`; the authoring style is composable (`defineDomain` with registration helpers), not options-based (`createMachine(id, config)`).

**Non-goals for this change:** no actor runtime, no persistence adapter, no React-specific dependency, no visual editor, no hidden mutation model.

## Capabilities

### New Capabilities

- `domain`: Domain state machine primitive — states, edges, guards, actions, lifecycle hooks, `follow`/`can`/`subscribe`/`snapshot`/`restore`/`history`, attached pipelines. Authored via `defineDomain(id, setup, options?)` or `new Domain(id, setup, options?)`.
- `pipeline`: Pipeline workflow primitive — nodes, ordered forks with conditions, terminal nodes, sub-pipeline embedding, `run` returning `PipelineRunResult`. Authored via `definePipeline(id, setup, options?)` or `new Pipeline(id, setup, options?)`.
- `context-patches`: Immutable context propagation — patches returned by handlers are merged through configurable `merge(prev, patch, metadata)` strategy; default is shallow object merge.
- `tracer`: Observability layer — `Tracer` class via `createTracer(options?)` or `new Tracer(options?)`, full event taxonomy with `parentId` linking, configurable context capture, `json`/`text`/`tree` exports, subscriptions.
- `graph-introspection`: Static graph descriptors and path queries for Domain and Pipeline, including cross-boundary inspection (domain ↔ attached pipeline nodes).
- `error-handling`: `PlexisError` class with structured fields (`code`, `domainId`, `pipelineId`, `nodeId`), all documented error codes including `BUILDER_CLOSED` for misuse of registration helpers outside an active builder scope, and pipeline error policies (`throw` | `return` | `trace-and-return`).

### Modified Capabilities

None — this change bootstraps the library; no prior capability specs exist in `openspec/specs/`.

## Impact

- **New code**: `src/core/` (domain, pipeline, tracer, errors, registration helpers `state`/`edge`/`node`/`fork`/`terminal`), `src/graph/` (graph descriptors, path queries, inspection), `src/index.js` (public exports), `src/types.js` (JSDoc type definitions mirroring `src/types.ts`).
- **Existing code**: `src/types.ts` remains as the authoritative type contract; `src/types.js` will mirror it via JSDoc. The `Domain`, `Pipeline`, and `Tracer` interfaces declared in `src/types.ts` define the shape that class instances must satisfy.
- **Build / packaging**: ESM + CJS + types build pipeline must be wired (no dependencies allowed in the published package).
- **Public API**: First stable export of `defineDomain`, `definePipeline`, `createTracer`, `state`, `edge`, `node`, `fork`, `terminal`, `Domain`, `Pipeline`, `Tracer`, `PlexisError`.
- **Reference**: Source of truth for behavior and authoring style is `.specs/plexis-composable-spec.md`; the reference implementation in `.specs/plexis/` uses the older options-based `Machine`/`createMachine` style and is **not** the target.
- **No external dependencies**: zero-dependency guarantee must hold across the published library.
