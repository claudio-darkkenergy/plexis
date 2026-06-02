## Context

`action(fn)` is a single ambient export valid in three scopes (node setup, on setup, `terminal(fn?)`). After `on-setup-action-scoping`, its registered `input` is typed `PipelineActionInput | OnActionInput`. The runtime routes correctly by the active builder scope, but the union forces authors to narrow or cast to read scope-specific fields.

The runtime already has every value an action needs at both call sites:

- **Node/terminal action** (`pipeline.ts`): builds `{ input, nodeId, pipelineId, traceId }` and calls `nodeDef.action(ctx, …)`.
- **On action** (`domain.ts`): builds `{ event, payload, traceId }` and calls `onDef.action(ctx, …)`. The originating state id (the `whenId`) is in scope as the from-state but is not currently passed to the action.

The constraint that rules out type-level narrowing: a bare module-level `action` import has one fixed signature. TypeScript cannot resolve its parameter type differently per enclosing callback, and overloads bind an untyped `(ctx, input) => …` to the first match. Scope-narrowing therefore requires routing the scoped type through a typed builder parameter on each setup callback — a mechanism that was explicitly out of favor (it risks reintroducing the injected-argument form and `no-shadow` friction).

## Goals / Non-Goals

**Goals:**
- Remove the `PipelineActionInput | OnActionInput` union from the `action` surface so no narrowing or cast is ever needed.
- Keep `action` a single ambient export with one monomorphic signature; no call-site change; no builder parameter.
- Populate all fields in both scopes — no optionals — with field semantics documented per scope.
- Preserve execution order and all observable runtime semantics other than the action-input object shape.

**Non-Goals:**
- Changing fork-condition input (`PipelineConditionInput`), guard input (`GuardInput`), or lifecycle-hook input (`StateHookInput`). They are not action inputs and stay as-is.
- Any builder-parameter / injected-argument authoring mechanism.
- Renaming the change or altering the public helper names (`action`, `node`, `on`, `terminal`).

## Decisions

### D1 — Unify onto one abstract `ActionInput` shape instead of scope-narrowing

```ts
interface ActionInput {
  source: string;   // nodeId (node) | event name (on)
  scope: string;    // pipelineId (node) | whenId (on)
  payload: unknown; // pipeline input (node) | event payload (on)
  traceId: string;
}
```

`action` is typed `(ctx: TContext, input: ActionInput) => PatchLike<TContext>`. One shape means nothing to narrow.

**Rationale:** field names are deliberately abstract so a single shape fits both scopes without optionals. `source`/`scope` read unambiguously because the surrounding `node`/`on` setup supplies the meaning — the same contextual reasoning that lets `ctx` go unqualified. The four chosen fields are exactly the union of what both scopes already provide, modulo naming.

**Alternatives considered:**
- *Scope-narrowing via a typed builder parameter on `node`/`on` setups.* Rejected: requires the scoped type to reach the call site through a parameter (member access `b.action` or a named param), changing the call site and risking `no-shadow`/injected-argument regressions. A bare ambient `action(fn)` provably cannot narrow.
- *Keep the union, add a doc caveat.* Rejected: leaves the cast/narrow burden the change exists to remove.
- *Discriminated union with a `kind` tag.* Rejected: still a union (authors switch on `kind`); more ceremony than the abstract single shape and no real benefit here.

### D2 — Field mapping and the newly-threaded `scope` for on-actions

| `ActionInput` | Node / terminal (`pipeline.ts`) | On (`domain.ts`) |
|---|---|---|
| `source` | `nodeId` (current node) | `event` |
| `scope` | `pipelineId` (`this.id`) | `whenId` — the originating state (from-state) |
| `payload` | `input` (pipeline run input) | `payload` (event payload) |
| `traceId` | `traceId` | `traceId` |

Node/terminal is a pure key rename of an object already built. The on path gains `scope`: the originating state id is already available where the action is invoked (it is the from-state captured before transition) and is assigned into a dedicated action-input object. The guard call keeps its own `GuardInput` (`{ event, payload, traceId }`) — only the action input changes.

`payload` is non-optional in the type. At runtime the key is always present; its value may be `undefined` (e.g. a pipeline run with no input). `unknown` admits `undefined`, so "always present, sometimes undefined" satisfies "no optionals".

### D3 — Remove now-dead per-scope action input types

- `OnActionInput` becomes unreferenced → remove it.
- `PipelineActionInput` is removed **iff** it has no remaining referents after `PipelineNodeDef.action` and `terminal` move to `ActionInput`. Fork conditions use the separate `PipelineConditionInput`, so they do not keep `PipelineActionInput` alive. Verify with a repo-wide reference check before deleting; if a referent remains, leave it and note it.

**Rationale:** dead types invite drift. Removing them makes `ActionInput` the single source of truth for action inputs.

### D4 — Documentation is part of the change

`CLAUDE.md` (the `action()` scope rules section and the types table) and `.specs/plexis-composable-spec.md` currently describe `PipelineActionInput`/`OnActionInput` by name and field list. They are updated to describe `ActionInput` and its per-scope field semantics in the same task that lands the type change, so docs never describe a removed type.

## Risks / Trade-offs

- **Abstract names lose self-documentation** (`source` vs `nodeId`/`event`) → Mitigation: document the per-scope meaning in the `ActionInput` JSDoc, `CLAUDE.md`, and the spec; the mapping table above is the canonical reference.
- **On-action input shape changes (new `scope`, renamed `source`)** could surprise existing handlers that read `input.event` → Mitigation: this is the intended breaking change; it is pre-1.0 and the spec/docs are updated in lockstep. Runtime tests assert the new field values.
- **Threading `scope` (whenId) incorrectly** — passing the target state instead of the originating state → Mitigation: explicit test asserting on-action `scope` equals the state the `on` was declared in (from-state), not the transition target.
- **Deleting `PipelineActionInput` while a referent remains** → Mitigation: D3's reference check gates the deletion; a leftover referent means it stays.
