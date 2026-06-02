## Why

The composable authoring API still leaks the word `transition` (`TransitionActionInput`) as a stray synonym for the type-level concept `edge`, and the domain authoring vocabulary (`state`, `edge`, `onEnter`, `onExit`, `edges: {}`) reads like graph plumbing rather than business-domain language. This change cleans up the terminology and replaces the object-config authoring style for states/nodes with a consistent imperative, scoped-helper style (`when` / `on` / `enter` / `exit` and `node` / `action` / `fork`) that mirrors how `definePipeline` already reads, while leaving every runtime instance method and the graph-theory `GraphEdge` types untouched.

> This supersedes the abandoned "rename edge → flow everywhere" idea. `flow` collides with the existing pipeline/workflow mental model, and renaming `GraphEdge` → `GraphFlow` would wrongly imply every graph connection (hooks, fork branches, sub-pipeline attachments) is a domain flow. The `transition → edge` cleanup was the right instinct; the new vocabulary and scope are narrower and correct.

## What Changes

- **BREAKING** `TransitionActionInput` type renamed to `OnActionInput`. The input passed to an `on(...)` action handler belongs to the authoring layer (helper `on`, def type `OnDef`), so its name follows that vocabulary rather than re-importing the graph-layer word `edge`. (`GuardInput` stays as-is — short, self-explanatory, and a lower-priority call; renaming to `OnGuardInput` is deferred.)
- **BREAKING** Domain authoring becomes imperative and scoped:
  - `state(id, def)` → `when(id, fn | terminal())` — second arg is a synchronous setup function **or** the `terminal()` sentinel; there is no `{ terminal: true }` object form.
  - `edge(def)` standalone helper **removed**. Event handlers are registered with `on(event, def)` calls inside the `when` setup; the `edges: {}` / `on: {}` object key is gone.
  - `onEnter(fn)` → `enter(fn)`, `onExit(fn)` → `exit(fn)`, both scoped inside `when`.
- **BREAKING** Pipeline authoring gets the same upgrade:
  - `node(id, def)` → `node(id, fn | terminal(fn?))` — second arg is a setup function **or** `terminal()`.
  - `action(fn)` and `fork(condition, target, opts?)` become imperative registration calls scoped inside the `node` setup (today `fork` is a pure builder and `action` is an object key).
- **BREAKING** `terminal()` becomes a recognized static **sentinel** (not a builder registration). `terminal(fn?)` optionally carries a final action. It never depends on an active scope and never throws `BUILDER_CLOSED`; it is the single canonical way to declare a terminal state or node.
- **BREAKING** Type renames: `StateNodeDef` → `WhenDef`, `EdgeDef` → `OnDef`. The internal built representation renames its fields to match (`onEnter`→`enter`, `onExit`→`exit`, `edges`→`on`).
- Graph layer terminology: the `'domain-edge'` kind literal becomes `'domain-flow'` (it now denotes a domain flow). `GraphEdge`, `GraphEdgeKind`, `GraphNode`, `edges: GraphEdge[]` arrays, and `'edge-action'` / `'edge-pipeline'` kind literals are **unchanged** — "edge" remains the graph-theory term for any directed connection.
- All `Domain` / `Pipeline` runtime instance methods, `DomainFollowResult` / `PipelineRunResult` shapes, `TraceEvent` shape and trace type strings, the immutable patch model, first-match-wins fork order, `initial`-in-setup-return, and `BUILDER_CLOSED` enforcement for scope-sensitive helpers are **unchanged**.
- Documentation, the reference spec (`.specs/plexis-composable-spec.md`), `CLAUDE.md`, and all tests are updated to the new vocabulary; obsolete `state`/`edge`/`onEnter`/`onExit`/`TransitionActionInput` references are removed.

## Capabilities

### New Capabilities
<!-- None — this reshapes existing capabilities rather than introducing new behavior. -->

### Modified Capabilities
- `domain`: domain authoring vocabulary changes — states are declared with `when(id, fn | terminal())`, lifecycle hooks with `enter`/`exit`, and event handlers with `on(event, def)` scoped inside `when`; `state`/`edge`/`onEnter`/`onExit`/`edges` are removed. Runtime semantics (`follow`, guard/exit/action/pipeline/enter order, `can`, strict mode, history, subscriptions) are unchanged.
- `pipeline`: node authoring vocabulary changes — nodes are declared with `node(id, fn | terminal(fn?))`, with `action(fn)` and `fork(...)` as scoped imperative helpers; the object-config `{ action, forks }` form is removed. Run/fork/terminal/sub-pipeline semantics are unchanged.
- `graph-introspection`: the domain-flow graph kind literal changes from `'domain-edge'` to `'domain-flow'` in both `GraphNodeKind` and `GraphEdgeKind`. All other graph types and kind literals are unchanged.

## Impact

- **Source** (`packages/plexis/src/`): `types.ts` (type renames, helper signatures), `core/helpers.ts` (nested scope stack; new `when`/`enter`/`exit`/`on` and `node`/`action`/`fork` helpers; `terminal()` sentinel; remove `state`/`edge`), `core/domain.ts` + `core/pipeline.ts` (consume renamed built-def fields), `graph/descriptor.ts` (read `on` instead of `edges`, emit `'domain-flow'`), `index.ts` (export surface).
- **Tests** (`packages/plexis/tests/`): all 8 suites rewritten to the new authoring API (TDD: tests updated first to fail, then implementation made to pass).
- **Reference spec**: `.specs/plexis-composable-spec.md` updated throughout.
- **Docs** (`apps/docs/src/content/docs/`): all 37 pages — every `state`/`edge`/`onEnter`/`onExit`/`TransitionActionInput` code sample and prose reference updated.
- **Project guidance**: `CLAUDE.md` authoring examples and execution-order wording; `.claude/skills/skill-config.md` per the Skill Config Rule (authoring conventions change).
- **No external dependencies** added; zero-dependency and dual-build (ESM/CJS/types) constraints preserved.
