## Why

The `fork` helper is the only authoring helper in the composable API whose callback is not last and whose identity argument is buried. Its current shape `fork(condition, target, { label })` places the most variable argument (the condition) first and demotes the `label` — which annotates trace events and graph introspection — into an optional trailing options object that is easy to omit. Every other helper (`node`, `when`, `on`) leads with an identity string and ends with the callback. Aligning `fork` to that grammar makes pipelines read consistently and makes labels first-class.

## What Changes

- **BREAKING** Revise the `fork` authoring signature from `fork(condition, target, opts?)` to `fork(label, target, condition)`.
  - `label: string` becomes the **required** first positional argument (was `opts.label`, optional).
  - `target` becomes the **second** argument and SHALL be a `target(...)` sentinel only — bare string / `Pipeline` arguments are **no longer accepted**.
  - `condition` becomes the **last** argument (was first).
- Extend the `target(...)` helper to accept a `Pipeline` instance in addition to a node-id string, so sub-pipeline fork targets are expressed as `target(myPipeline)`. The returned `TargetDef` sentinel carries either a node id or a Pipeline.
- Update the `fork` and `target` type declarations in `packages/plexis/src/types.ts` to reflect the new positional order and the `TargetDef`-only target.
- Update all authoring examples, scenarios, and documentation that call `fork(...)` to the new order.

No runtime semantics change: fork evaluation remains first-match-wins by declaration order, sub-pipeline targets run identically, and all trace/graph fields are populated from the same internal `PipelineForkDef` shape (now `label` is always present).

## Capabilities

### New Capabilities
<!-- None — this revises an existing helper. -->

### Modified Capabilities
- `pipeline`: The "Imperative pipeline authoring with `node`, `action`, and `fork`" requirement changes — `fork`'s argument order becomes `(label, target, condition)`, `label` becomes required, and the `target` argument SHALL be a `target(...)` sentinel (extended to accept a Pipeline). Affected scenarios that author forks are updated.

## Impact

- **API (breaking):** every `fork(...)` call site must migrate to `fork(label, target(...), condition)`. The `{ label }` options object and bare-string / bare-`Pipeline` targets are removed.
- **Types:** `fork` and `target` declarations in `packages/plexis/src/types.ts`; `TargetDef` gains a Pipeline-carrying variant.
- **Docs & examples:** the composable example in `CLAUDE.md`, the `pipeline` spec scenarios, and any guide that shows `fork(...)`.
- **No change:** runtime execution order, tracer event taxonomy, graph introspection output shape.
