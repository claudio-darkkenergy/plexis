## 1. Define the unified `ActionInput` type

- [x] 1.1 Add `ActionInput` to `packages/plexis/src/types.ts`: `{ source: string; scope: string; payload: unknown; traceId: string }`, with JSDoc documenting the per-scope meaning of `source` (nodeId | event) and `scope` (pipelineId | whenId).
- [x] 1.2 Retype `action`'s declared signature in `types.ts` to `(ctx: TContext, input: ActionInput) => PatchLike<TContext> | Promise<...>` (remove the `PipelineActionInput | OnActionInput` union).
- [x] 1.3 Retype `PipelineNodeDef.action`, `OnDef.action`, and `terminal(fn?)`'s parameter to use `ActionInput`.
- [x] 1.4 Run a repo-wide reference check; remove `OnActionInput`, and remove `PipelineActionInput` iff it has no remaining referents (fork conditions keep `PipelineConditionInput`). Leave and note any type that still has a referent.

## 2. Type-level tests (Red → Green)

- [x] 2.1 Add type-level assertions (tsd / `expectTypeOf`-style) that `action`'s `input` resolves to `ActionInput` inside a `node` setup, inside an `on` setup, and as the `terminal(fn)` argument — and that reading `input.source`, `input.scope`, `input.payload`, `input.traceId` compiles without narrowing or cast.
- [x] 2.2 Add a negative assertion that the removed names (`OnActionInput`, and `PipelineActionInput` if deleted) are no longer exported.
- [x] 2.3 Confirm these fail before the runtime/type changes are complete, then pass after (`pnpm typecheck`).

## 3. Runtime: construct the unified input

- [x] 3.1 In `core/helpers.ts`, retype the `action` export parameter to `ActionInput` (no behavior change; scope routing stays).
- [x] 3.2 In `core/pipeline.ts`, rename the keys of the object passed to node/terminal `action`: `nodeId → source`, `pipelineId → scope`, `input → payload` (ensure `payload` is always present, value may be `undefined`). Leave fork-condition input (`PipelineConditionInput`) untouched.
- [x] 3.3 In `core/domain.ts`, build a dedicated on-action input `{ source: event, scope: <originating whenId / from-state>, payload, traceId }` and pass it to `onDef.action`. Keep the guard call on its existing `GuardInput` object.

## 4. Runtime tests (Red → Green)

- [x] 4.1 Pipeline test: a node action receives `source === <nodeId>`, `scope === <pipelineId>`, `payload === <run input>`, and a `traceId`; a `terminal(fn)` action receives the same shape.
- [x] 4.2 Pipeline test: `payload` is present (and `undefined`) when the pipeline is run with no input.
- [x] 4.3 Domain test: an on action receives `source === <event>`, `scope === <originating state id>` (assert it is the from-state, not the transition target), `payload === <event payload>`, and a `traceId`.
- [x] 4.4 Confirm the existing `BUILDER_CLOSED` / `DUPLICATE_REGISTRATION` and execution-order tests still pass unchanged.

## 5. Docs and spec sync

- [x] 5.1 Update `CLAUDE.md` `action()` scope-rules section and the `src/types.ts` types table to describe `ActionInput` (and its per-scope fields) instead of `PipelineActionInput`/`OnActionInput`; drop any "narrow/cast the union" wording.
- [x] 5.2 Update `.specs/plexis-composable-spec.md` action-input references to `ActionInput`.
- [x] 5.3 Update any code snippets in docs/examples that read `input.nodeId` / `input.event` to `input.source` (and `input.pipelineId` → `input.scope`).

## 6. Verify

- [x] 6.1 Run `pnpm typecheck`, `pnpm test`, and `pnpm build` — all green.
- [x] 6.2 Run `openspec validate "tighten-action-input-typing"` and confirm the change is valid.
