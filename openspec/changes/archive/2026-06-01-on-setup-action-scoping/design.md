## Context

The redesign-authoring-api change made `when` and `node` dual-form (a setup function or a `terminal()` sentinel) and turned `enter`/`exit`/`action`/`fork` into scoped imperative helpers operating on a nested builder-scope stack. `on` was left behind on the legacy `{ target: 'x', guard, action, pipeline }` object form, which is now the only authoring call site that does not read like the rest of the API and the only place a transition's guard/action/pipeline can be attached.

This change finishes the conversion. The builder-scope stack already exists in `core/helpers.ts`; the work is to push a new scope kind (`on`) onto it, route the shared `action` helper by the active scope, add two new scoped helpers (`guard`, `pipeline`) and a new sentinel (`target`), and enforce single-slot semantics with a new `DUPLICATE_REGISTRATION` error code. Runtime traversal in `core/domain.ts` is unchanged in behavior — it consumes the same built flow shape (target + optional guard/action/pipeline), only the authoring path that fills it changes.

Constraints: zero dependencies, synchronous setup functions, immutable context, dual ESM/CJS/types build. TDD and SOLID are enforced.

## Goals / Non-Goals

**Goals:**
- `on(event, def)` accepts a `target()` sentinel (simple form) or a setup function returning `target()` (full form).
- `target(id)` is a scope-independent sentinel; safe everywhere, never throws.
- `guard` and `pipeline` are new top-level exports, scoped to `on` setups.
- `action` is scope-routed: `node` → `PipelineActionInput`, `on` → `OnActionInput`; invalid anywhere else.
- `guard`/`action`/`pipeline` are single-slot per `on`; a second call throws `DUPLICATE_REGISTRATION`.
- `terminal(fn?)`'s node-context action behavior is confirmed and tested.
- Spec, `CLAUDE.md`, docs, and README examples updated off the `{ target }` object form.

**Non-Goals:**
- No change to runtime `follow`/guard/exit/action/pipeline/enter ordering or results.
- No change to `fork` (stays repeatable, order-sensitive) or to `when`/`node`/`enter`/`exit`.
- No change to the graph layer or `GraphEdge` types.
- Not introducing an injected-argument setup form (`({ action }) => {}`) — explicitly rejected.

## Decisions

### Decision 1: `on` setup runs as a new builder scope kind

The nested builder-scope stack gains an `on` scope. `on(event, def)` resolves `def`:
- If `def` is a `TargetDef` sentinel (`def.__type === 'TargetDef'`), build the flow directly with just `{ target: def.id }`.
- If `def` is a function, push an `on` scope, invoke `def()` synchronously, read its return value (must be a `TargetDef`, else throw `MISSING_TARGET` — see Decision 5), pop the scope in a `finally`, and assemble the flow from the scope's accumulated `guard`/`action`/`pipeline` plus the returned target.

This mirrors how `when`/`node` already open scopes, so the `finally`-based scope cleanup and `BUILDER_CLOSED` enforcement come for free.

*Alternative considered:* keep the `{ target }` object form alongside `target()`. Rejected — the proposal makes `target()` the single canonical destination form; two forms is exactly the inconsistency this change removes.

### Decision 2: `action` is scope-routed, not duplicated

`action` stays a single export. At call time it inspects the top of the builder-scope stack: a `node` scope registers a node action typed `PipelineActionInput`; an `on` scope registers a transition action typed `OnActionInput`; any other active scope (e.g. `when` directly) or no scope throws `BUILDER_CLOSED`. This keeps one import usable in both `node` and `on` setups in the same file — a key reason the injected-argument form was rejected (it would shadow the import and break `no-shadow`).

*Type inference:* the proposal allows `input` to be typed as the union `PipelineActionInput | OnActionInput` initially if scope-driven overload inference is not achievable. Decision: ship the union typing first (runtime is always correct), and leave tightening to overloads as a follow-up — do not block this change on compile-time scope inference.

### Decision 3: single-slot enforcement lives in the `on` scope state

The `on` scope object holds nullable `guard`/`action`/`pipeline` slots. Each helper checks its slot: if already set, throw `PlexisError('DUPLICATE_REGISTRATION', ...)` with a message naming the event and helper; otherwise fill it. `fork` is untouched — it appends to the `node` scope's ordered list. This localizes the rule to the scope that owns the slots and keeps `fork`'s accumulation semantics separate by construction.

### Decision 4: `target` and `terminal` are pure sentinels, outside the scope system

`target(id)` returns `{ __type: 'TargetDef', id }` and `terminal(fn?)` returns `{ __type: 'TerminalDef', action: fn }` with no reference to the builder-scope stack. Both are safe to call anywhere. This is why a missing `return target(...)` from an `on` setup is caught at assembly time (the scope got no `TargetDef` return) rather than via scope state, and why `target()` at module top level must not throw.

### Decision 5: a missing `target()` throws `MISSING_TARGET`, not `BUILDER_CLOSED`

When an `on` setup function returns a value that is not a `TargetDef`, `on` throws `PlexisError('MISSING_TARGET', ...)` rather than `BUILDER_CLOSED`. The distinction is semantic: `BUILDER_CLOSED` means a helper was called *outside a valid scope*; here the scope was valid and the setup ran — it simply failed to honor its return contract. A dedicated code yields a clearer, actionable message:

```
PlexisError [MISSING_TARGET]: on('submit') — setup function did not return a target().
Use return target('state-id') as the last statement of the on() setup function.
```

TypeScript users get this earlier still: `OnSetupFn`'s return type is `TargetDef`, so a missing `return` is a compile error. The runtime check is the backstop for plain-JS callers and type-stripped runtimes.

### Decision 6: new error codes join the error-code union

Add `DUPLICATE_REGISTRATION` and `MISSING_TARGET` to `PlexisErrorCode` in `types.ts` and to the documented-codes list in the error-handling spec. `DUPLICATE_REGISTRATION` is thrown only from the three `on`-scoped single-slot helpers; `MISSING_TARGET` only from `on`'s setup-function assembly path.

## Risks / Trade-offs

- **Union-typed `action` input weakens compile-time safety in the interim** → Runtime behavior is always correct; handlers that read scope-specific fields get a union type and may need a narrow or cast until overloads land. Tracked as an explicit follow-up, not a blocker.
- **Breaking change ripples through every `on(...)` call site in docs/tests/examples** → Mechanical find-and-replace of `on('EVENT', { target: ... })` → `on('event', target(...))`; guard/action/pipeline object keys become setup-fn calls. Covered by the tasks list and validated by `typecheck` + test suite.
- **Missing `return target(...)` in a setup fn is a runtime definition error, not (yet) always a compile error** → The `OnSetupFn` return type is `TargetDef`, so TypeScript flags a missing return at authoring time; the runtime assembly check throws the dedicated `MISSING_TARGET` code (Decision 5) for JS callers, producing a clear, actionable message rather than the misleading `BUILDER_CLOSED`.
- **Scope routing of `action` could mis-route if the scope stack is left dirty** → Existing `finally`-based scope pop already guarantees cleanup on throw; the new `on` scope follows the same pattern, and the "exception during setup leaves no dangling scope" scenario covers it.
