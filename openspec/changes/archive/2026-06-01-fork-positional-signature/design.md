## Context

`fork` is the pipeline-authoring helper that declares a conditional branch out of a `node`. Its current declaration is:

```ts
fork(condition: ((ctx, input) => boolean) | undefined, target: string | Pipeline, options?: { label?; metadata? }): void
```

This is the only helper in the composable API that leads with the callback and hides its identity (`label`) in a trailing options object. Every sibling helper — `node(id, fn)`, `when(id, fn)`, `on(event, def)` — leads with an identifying string and ends with the callback.

The proposal revises the order to `fork(label, target, condition)` and requires the `target` argument to be a `target(...)` sentinel rather than a bare string or `Pipeline`. Two questions were resolved with the user before this design: **`label` is required**, and **only the `target(...)` sentinel is accepted** (no bare-string shorthand).

The internal `PipelineForkDef` shape (`{ target, condition?, label?, metadata? }`) and all runtime semantics — first-match-wins evaluation, sub-pipeline embedding, tracer events, graph introspection — are unaffected. This is purely an authoring-surface (front-door) change.

## Goals / Non-Goals

**Goals:**
- Reorder `fork` to `(label, target, condition)` so it matches the identity-first / callback-last grammar of `node`, `when`, and `on`.
- Make `label` a required first positional argument.
- Accept the `target(...)` sentinel as the only target form, and extend `target(...)` to wrap a `Pipeline` (for sub-pipeline forks) in addition to a node-id string.
- Migrate every `fork(...)` call site, scenario, and doc example to the new order.

**Non-Goals:**
- No change to runtime execution order, fork evaluation, or sub-pipeline run semantics.
- No change to tracer event taxonomy or graph introspection output shapes.
- No new helpers — `condition` is not extracted into a standalone helper.
- No change to the `on(event, target(...))` domain-side use of `target`, beyond the type widening described below.

## Decisions

### Decision 1: `condition` is the optional last argument, not required

Although the proposal's headline signature shows `condition` as required, the runtime supports **unconditional catch-all forks** (the existing "Unconditional fork acts as catch-all" requirement). A catch-all is authored today as `fork(undefined, 'decline')`. To preserve that, `condition` becomes the optional last positional argument:

```ts
fork(label: string, target: TargetDef, condition?: (ctx, input) => boolean | Promise<boolean>): void
```

Omitting `condition` declares an unconditional fork. This keeps callback-last grammar intact (an omitted trailing callback is idiomatic) while preserving catch-all support. **Alternative considered:** require `condition` and force catch-alls to pass `() => true`. Rejected — it is noisier than the current `undefined` form and changes runtime-equivalent behavior into boilerplate.

### Decision 2: `target(...)` is widened to accept a `Pipeline`

Today `target(id: string): TargetDef` and `TargetDef = { __type: 'TargetDef'; id: string }`. Sub-pipeline forks need `target(myPipeline)`. The sentinel is widened to carry either a node id or a Pipeline:

```ts
export type TargetDef =
  | { __type: 'TargetDef'; id: string }
  | { __type: 'TargetDef'; pipeline: Pipeline };

export declare function target(idOrPipeline: string | Pipeline): TargetDef;
```

The `fork` implementation unwraps the sentinel back into the existing `PipelineForkDef.target: string | Pipeline` internal field, so nothing downstream changes. **Alternative considered:** a separate `targetPipeline(...)` helper. Rejected — one sentinel keeps the call site uniform and matches the proposal's "`target()` is not new" rationale.

### Decision 3: `label` required, `target(...)` only — no shorthand

Per the resolved open questions, `label` is required and bare strings are rejected as targets. Passing a bare string or `Pipeline` where a `TargetDef` is expected is a **compile-time** type error; the runtime additionally guards by checking the sentinel `__type` and throws a clear authoring error if a non-sentinel reaches `fork` at runtime (e.g. from untyped JS callers). This removes the string-is-it-a-label-or-a-target ambiguity entirely.

### Decision 4: Scope of spec changes — `pipeline` capability only

The fork-authoring requirements live in the `pipeline` capability spec. Two requirements reference the old `fork` shape and are modified: "Imperative pipeline authoring with `node`, `action`, and `fork`" and "Composable Pipeline construction with class equivalence". The runtime requirements ("Forks are evaluated in array order...", "Sub-pipeline target", etc.) are unchanged because they describe the internal `PipelineForkDef`, not the authoring call.

## Risks / Trade-offs

- **[Breaking change to every `fork` call site]** → This is an early-stage library with no released runtime; call sites are limited to spec scenarios, the `CLAUDE.md` example, and docs. The migration is mechanical (argument reorder + wrap target in `target(...)` + lift `label` out of options). Each is updated in `tasks.md`.
- **[Reordered positional args fail silently if a caller swaps by hand in untyped JS]** → Mitigated by the required `TargetDef` sentinel: a string in the target slot is a type error in TS and a runtime guard error in JS, so a half-migrated call fails loudly rather than silently mis-binding.
- **[`TargetDef` union touches the shared `target()` helper used by `on`]** → The widening is additive (adds a `pipeline` variant); the existing `{ id }` variant used by `on('submit', target('processing'))` is untouched, so domain-side usage continues to compile and behave identically.

## Migration Plan

1. Update `fork` and `target` declarations and `TargetDef` in `packages/plexis/src/types.ts`.
2. Update the `pipeline` capability spec scenarios (delta) to the new authoring form.
3. Update the composable example in `CLAUDE.md` and any guide/example that calls `fork(...)`.
4. Mechanical migration per call site: `fork(cond, 'x', { label: 'L' })` → `fork('L', target('x'), cond)`; `fork(undefined, 'x')` → `fork('L', target('x'))`; `fork(cond, subPipeline)` → `fork('L', target(subPipeline), cond)`.

No runtime rollback concern — the change is confined to the authoring surface and type declarations.

## Open Questions

None — the two proposal open questions (required `label`, `target()`-only) were resolved with the user before this design.
