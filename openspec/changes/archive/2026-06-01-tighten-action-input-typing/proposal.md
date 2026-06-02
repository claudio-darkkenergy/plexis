## Why

The `on-setup-action-scoping` change shipped `action`'s registered `input` as the union `PipelineActionInput | OnActionInput`. The runtime is always correct — it routes by the active builder scope — but the compile-time type is a union, so handler authors must narrow or cast to read scope-specific fields (`nodeId`/`pipelineId` in a node, `event` in an `on`).

Rather than scope-narrow the union (which a bare ambient `action` import cannot do at the type level without a builder-parameter mechanism), this change **eliminates the union** by unifying both scopes onto a single shared input shape with abstract field names. With one shape there is nothing to narrow: `action` keeps a single monomorphic signature, the bare ambient import is unchanged, and authors read the same four fields in every scope.

## What Changes

- Introduce a single shared `ActionInput` shape:

  ```ts
  interface ActionInput {
    source: string;   // nodeId in a node scope, event name in an on scope
    scope: string;    // pipelineId in a node scope, whenId in an on scope
    payload: unknown; // pipeline input in a node scope, event payload in an on scope
    traceId: string;
  }
  ```

- `action` remains a single ambient export, typed `(ctx, input: ActionInput) => PatchLike`. No call-site change, no builder parameter, no narrowing.
- Both `node` and `on` scopes populate **all four** fields — no optionals, no union. The field names are intentionally abstract: `source` and `scope` resolve unambiguously at the call site because the surrounding `node` or `on` setup supplies the context (the same reason `ctx` needs no qualification).
- `terminal(fn?)`'s node-context action input becomes `ActionInput` as well.
- The `PipelineActionInput | OnActionInput` union is removed from the `action` surface. The now-unused `OnActionInput` is removed; `PipelineActionInput` is removed if it has no remaining referents (fork conditions keep their own `PipelineConditionInput`).

### Runtime impact (small, semantics unchanged)

This is **not** purely a type change. Execution order is untouched, but the input object constructed at two call sites changes shape:

- **Node/terminal action** (`pipeline.ts`): rename the keys it already builds — `nodeId → source`, `pipelineId → scope`, `input → payload`. `payload` is always present (may be `undefined`).
- **On action** (`domain.ts`): build a dedicated action input `{ source: event, scope: <whenId>, payload, traceId }`. The `scope` (whenId, i.e. the originating state) is **newly threaded** — it is already in scope as the from-state. The guard input keeps its existing `GuardInput` shape.

### Call-site signature: before → after

**Before** — `input` is the un-narrowed union; scope-specific fields require a cast or narrow:

```ts
node('charge', () => {
  action((ctx, input) => {
    input.nodeId;       // ❌ 'nodeId' does not exist on 'PipelineActionInput | OnActionInput'
    return { charged: true };
  });
});

on('submit', () => {
  action((ctx, input) => {
    input.event;        // ❌ 'event' does not exist on 'PipelineActionInput | OnActionInput'
    return { ok: true };
  });
  return target('processing');
});
```

**After** — one shape; the same four fields read cleanly in every scope, no narrowing:

```ts
node('charge', () => {
  action((ctx, input) => {
    input.source;       // ✅ nodeId
    input.scope;        // ✅ pipelineId
    input.payload;      // ✅ pipeline input
    input.traceId;      // ✅
    return { charged: true };
  });
});

on('submit', () => {
  action((ctx, input) => {
    input.source;       // ✅ event name
    input.scope;        // ✅ whenId
    input.payload;      // ✅ event payload
    input.traceId;      // ✅
    return { ok: true };
  });
  return target('processing');
});
```

Resolved `input` type at every `action()` call site after this change: `ActionInput`.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities

The action-input contract is restated: a single `ActionInput` shape (`source`, `scope`, `payload`, `traceId`) replaces the per-scope `PipelineActionInput`/`OnActionInput` inputs for actions, with documented field semantics per scope.

## Impact

- **Source** (`packages/plexis/src/`):
  - `types.ts` — add `ActionInput`; retype `action`, `PipelineNodeDef.action`, `OnDef.action`, and `terminal`; remove `OnActionInput` (and `PipelineActionInput` if unused).
  - `core/helpers.ts` — retype the `action` export to `ActionInput`.
  - `core/pipeline.ts` — rename keys when constructing the node/terminal action input.
  - `core/domain.ts` — construct the unified on-action input and thread `scope` (whenId).
- **Tests**: type-level assertions that `action`'s `input` is `ActionInput` in both scopes; runtime assertions that all four fields carry the correct per-scope values (especially on-action `scope` = whenId, always-present `payload`).
- **Docs**: `CLAUDE.md` action-scope-rules section and `.specs/plexis-composable-spec.md` updated to describe `ActionInput` instead of the two per-scope inputs; drop any "narrow/cast the union" caveat.
- Depends on `on-setup-action-scoping` being archived first (it is).
