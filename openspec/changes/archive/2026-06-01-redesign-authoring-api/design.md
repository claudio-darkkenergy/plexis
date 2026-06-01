## Context

Plexis exposes a composable authoring API built on synchronous setup functions and module-scoped registration helpers. Today's helpers are a mix of styles:

- **Domain**: `state(id, def)` where `def` is an object carrying `onEnter`, `onExit`, `edges: { EVENT: edge({ target }) }`, `pipeline`, `terminal`.
- **Pipeline**: `node(id, def)` where `def` is an object carrying `action`, `forks: [fork(cond, target)]`, `terminal`; `fork()` and `terminal()` are pure builders that return plain def objects.

Registration is mediated by a single module-level scope cell in `core/helpers.ts` (`_currentScope`, set by `withScope`). `state`/`node` write into `scope.states` / `scope.nodes`; calling them with no active scope throws `PlexisError` with code `BUILDER_CLOSED`. The runtime (`core/domain.ts`, `core/pipeline.ts`) reads the collected def objects; `graph/descriptor.ts` walks them to build the static `GraphDescriptor`.

This change keeps that architecture but (a) removes the stray `transition` synonym, (b) converts the object-config authoring style to a fully imperative, nested-scope style, and (c) renames the domain authoring vocabulary to business-domain language. The graph-theory `GraphEdge` surface and every runtime instance method stay byte-for-byte compatible.

## Goals / Non-Goals

**Goals:**
- Eliminate `TransitionActionInput`; the `on(...)` action handler input follows the authoring vocabulary → `OnActionInput`.
- Replace `state`/`edge`/`onEnter`/`onExit`/`edges` with imperative `when` / `enter` / `exit` / `on`.
- Replace `node` object-config with imperative `node` / `action` / `fork`.
- Make `terminal()` a scope-independent sentinel accepted by both `when` and `node`, optionally carrying a final action.
- Keep `Domain` and `Pipeline` runtime instance APIs, result shapes, trace events, and `GraphEdge`/graph-theory types unchanged.
- Update the reference spec, all docs, `CLAUDE.md`, and tests so no obsolete vocabulary remains.

**Non-Goals:**
- No rename of `GraphEdge`, `GraphEdgeKind`, `edges: GraphEdge[]`, `'edge-action'`, `'edge-pipeline'`, or `inbound/outbound` graph-theory surfaces.
- No change to `follow`, `followFrom`, `can`, `subscribe`, `snapshot`, `restore`, `history`, `describe`, `trace`, `inspectNode`, `graph`, `run`.
- No change to fork evaluation semantics, the immutable patch/merge model, or error codes.
- No new runtime behavior or capabilities; this is a vocabulary + authoring-ergonomics reshape.
- No new public `graph` factory export (see Open Questions) — graph access stays on the instances.

## Decisions

### Decision 1: Nested builder scopes via a scope stack

`when(id, fn)` and `node(id, fn)` must open a *child* scope that `enter`/`exit`/`on` (resp. `action`/`fork`) write into, nested inside the parent domain/pipeline scope. The current single `_currentScope` cell cannot represent two live levels, so `core/helpers.ts` becomes a small **scope stack** (`_scopeStack: BuilderScope[]`, with `getCurrentScope()` returning the top).

Scope kinds:
- `domain` — collects `whens: Record<string, WhenDef>` (top-level inside `defineDomain`).
- `when` — a single `WhenDef` under construction (`enter`/`exit`/`on` target it).
- `pipeline` — collects `nodes: Record<string, NodeDef>`.
- `node` — a single `NodeDef` under construction (`action`/`fork` target it).

`when(id, fn)` pushes a `when` scope, runs `fn()` synchronously, pops, and registers the finished `WhenDef` into the enclosing `domain` scope. `node(id, fn)` does the same for `node`/`pipeline`. Each scope-sensitive helper validates the **top** of the stack is the kind it expects; otherwise it throws `BUILDER_CLOSED` (preserving today's guarantee that helpers called outside/after setup throw). Setup remains synchronous, so the stack is never concurrently mutated.

*Alternative considered:* keep object-config `def` and only rename keys. Rejected — the proposal explicitly wants the imperative `enter`/`exit`/`on`/`action`/`fork` ergonomics that match `definePipeline`'s feel and read as domain language.

### Decision 2: `terminal()` is a branded sentinel, scope-independent

`terminal(fn?)` returns a static branded object, e.g. `{ [TERMINAL]: true, action?: fn }` (using a non-enumerable module-private symbol as the brand). It performs **no** scope lookup and never throws `BUILDER_CLOSED`, so it is safe to call anywhere (including at module top level). `when(id, x)` and `node(id, x)` detect the brand on their second argument:
- brand present → register a terminal `WhenDef`/`NodeDef` (carrying the optional `action` for nodes).
- function → treat as a setup function and open a child scope.

`when` ignores any `action` carried by `terminal(fn)` (a terminal *state* has no final action in the domain model); `node` honors it (a terminal *node* may run a final action but has no forks). This matches Decisions 4 and 6 in the proposal.

*Alternative considered:* a `{ terminal: true }` plain object. Rejected by the proposal — the sentinel is the single canonical form and removes an ambiguous object shape from the surface.

### Decision 3: Public type renames + internal field renames

Public: `TransitionActionInput` → `OnActionInput`; `StateNodeDef` → `WhenDef`; `EdgeDef` → `OnDef`. The action-input type belongs to the authoring layer — it is what an `on(...)` action handler receives — so it follows the `on`/`OnDef` vocabulary rather than re-importing the graph-layer word `edge`. `OnDef` keeps `target`, `guard`, `action`, `pipeline`, `metadata` (the `action` handler receives `OnActionInput`). `WhenDef` describes a built state with fields renamed for consistency with the helpers: `enter?`, `exit?`, `on?: Record<string, OnDef>`, `pipeline?`, `terminal?`, `metadata?`.

`GuardInput` is **kept** as-is. A guard lives on an `on(...)` definition, so `OnGuardInput` would be the consistent name, but `GuardInput` is short, self-explanatory at the call site, and a lower-priority rename; it is deferred to avoid extra churn.

The runtime's internal built-def reads change accordingly (`stateDef.onEnter`→`enter`, `stateDef.onExit`→`exit`, `stateDef.edges`→`on`) in `core/domain.ts` and `graph/descriptor.ts`. These are internal field names, but renaming them keeps the codebase coherent with the public vocabulary and avoids a confusing translation layer.

`TEdges`, `InferEdges`, `ExtractEdges`, and `edgeId` remain — they are type-level inference utilities operating on the (unchanged) graph structure internally, not authoring vocabulary a user touches directly. Renaming `TEdges`→`TOn` or `InferEdges`→`InferOn` is cosmetic churn with real risk of breaking inference chains and no legibility gain at the call site.

### Decision 4: Graph kind literal `'domain-edge'` → `'domain-flow'`

Per proposal Decision 2, the literal that denotes a domain flow node/connection becomes `'domain-flow'`. This appears in **both** `GraphNodeKind` and `GraphEdgeKind` — both are graph-layer types describing the same domain-flow concept, so they move together for consistency (the proposal text named only `GraphEdgeKind`; this was a miss, confirmed). `'edge-action'`, `'edge-pipeline'`, `'subpipeline'`, `GraphEdge`, and `edges: GraphEdge[]` are untouched: "edge" stays the graph-theory term for any directed connection — these name connection subtypes in the introspection layer, not authoring concepts, and Decision 2 was explicit the graph layer does not follow the domain rename. `graph/descriptor.ts` is the only emitter to update.

### Decision 5: Module layout — keep `core/helpers.ts`, update the barrel names only

The proposal's export list groups helpers under `definition/domain`, `definition/pipeline`, `definition/shared`. A physical folder split is cosmetic and orthogonal to the vocabulary change; to keep this (already large) change focused and reviewable, the new helpers stay in `core/helpers.ts` and `index.ts` simply exports the new names (`when, enter, exit, on, node, action, fork, terminal`) instead of `state, edge, node, fork, terminal`. A later change can split the module if desired. (Flagged in Open Questions.)

## Risks / Trade-offs

- **[Large breaking surface — every example, test, and doc references the old helpers]** → Sequence the work TDD-first: rewrite the 8 test suites to the new API (red), implement helpers/types/runtime to green, then sweep docs/spec/CLAUDE.md last. A repo-wide grep for `\b(state|edge|onEnter|onExit|TransitionActionInput)\b` gates completion.
- **[Nested scope stack regressions in `BUILDER_CLOSED` behavior]** → Add scenarios for each helper called (a) outside any scope, (b) at the wrong nesting level (e.g. `on` called directly in `defineDomain` body, `action` called in `definePipeline` body), and (c) deferred from an async callback after setup returns.
- **[`terminal()` brand collision or accidental detection]** → Use a module-private `Symbol`, not a string key, as the brand; only `when`/`node` import it. A user object can't accidentally carry it.
- **[Internal field rename touches the runtime hot path]** → Covered by the unchanged `domain`/`pipeline` execution-order and result-shape scenarios; the equivalence scenarios (`defineX` vs `new X`) act as regression anchors.
- **[Inconsistency: `'edge-action'`/`'edge-pipeline'` kept while concept is "flow"]** → Accepted per proposal Decision 2; documented as deliberate (these name graph-theory connection subtypes, not the authoring concept).

## Migration Plan

This is a pre-1.0 library with no external consumers, so a hard breaking swap is acceptable.

1. Update `types.ts`: rename types, define `WhenDef`/`OnDef`/`OnActionInput`, update helper declarations, change `'domain-edge'`→`'domain-flow'` in graph kind unions.
2. Rewrite `core/helpers.ts`: scope stack; `when`/`enter`/`exit`/`on`; `node`/`action`/`fork`; `terminal()` sentinel; remove `state`/`edge`.
3. Update `core/domain.ts`, `core/pipeline.ts`, `graph/descriptor.ts` to read renamed fields and emit `'domain-flow'`.
4. Update `index.ts` export list.
5. Rewrite tests to the new API (done before/with 1–4 under TDD).
6. Sweep `.specs/plexis-composable-spec.md`, all `apps/docs/**`, `CLAUDE.md`, `.claude/skills/skill-config.md`.
7. Run `pnpm typecheck`, `pnpm test`, `pnpm build`; grep for residual obsolete tokens.

**Rollback:** single squashed change on a feature branch; revert the commit. No data/state migration involved.

## Resolved Decisions (confirmed)

1. **`GraphNodeKind` `'domain-edge'` → `'domain-flow'`**: confirmed — both `GraphNodeKind` and `GraphEdgeKind` move together (same domain-flow concept).
2. **`TEdges` / `InferEdges` kept**: confirmed — internal TS inference utilities over the graph structure, not authoring vocabulary; renaming is cosmetic churn that risks breaking inference.
3. **Module layout — no split**: confirmed — the proposal's `definition/`-style paths were illustrative of separation of concerns, not a filesystem prescription. Helpers stay in `core/helpers.ts` and re-export from the existing barrel; the public export *names* are the contract. No new `graph` factory export (graph access stays on instances).
4. **`OnActionInput` (not `EdgeActionInput`)**: confirmed — the action input is an authoring-layer type and follows the `on`/`OnDef` vocabulary.
5. **`GuardInput` kept**: confirmed — `OnGuardInput` would be consistent but is a deferred, lower-priority rename.

## Open Questions

None outstanding.
