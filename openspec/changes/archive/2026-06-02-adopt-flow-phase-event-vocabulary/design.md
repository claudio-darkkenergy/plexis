## Context

Plexis has two layers: a **Domain** (a durable entity that occupies one named position at a
time and moves between positions over its lifetime) and a **Pipeline** (a finite workflow that
runs once per invocation). The domain layer accreted three overlapping vocabularies —
"state"/"transition" (state-machine), "edge" (graph), "flow" (interim) — for the same two
concepts. "state" is especially poor: it is generic enough to be confused with **context** (the
data threaded through handlers), and it frames a domain as an academic state machine rather than
what it models — an entity travelling a **flow**. This change picks one vocabulary and applies it
everywhere, including the runtime API.

## Goals / Non-Goals

**Goals:**
- One vocabulary, library-wide: **domain = flow**, **`when` = phase**, **`on` = event**.
- Eliminate "state" and "transition" from the domain layer (prose *and* shipped surface).
- Codify the vocabulary as an enforceable spec so it cannot drift again.
- Correct the inaccurate `on(event, { … })` object-form / injected-argument descriptions.

**Non-Goals:**
- Renaming graph-theory **edge** terms (`GraphEdge`, `edges[]`, inbound/outbound, fork edges) or
  the `'edge-action'` / `'edge-pipeline'` / `'subpipeline'` literals, or the tracer **`'edge'`**
  level — "edge" = any directed graph connection, retained by design.
- Renaming phase *ids* carried by `follow().from` / `.to` and history entries (ids, not the word).
- A full reconciliation of the `examples` / `readme` / `docs-site` specs with every other
  post-redesign-stale symbol (`StateNodeDef`, `EdgeDef`, `TransitionActionInput`) — separate change.

## Decisions

### D1 — domain = flow, `when` = phase, `on` = event
A `when` is a *position* the domain rests in, so it is a **phase**, not a "flow" (flow implies
movement) and not a "state" (too generic; collides with context). The directional move between
phases is the **event** (`on`). The domain *as a whole* — the journey across phases — is the
**flow**. *Alternatives considered:* "state/transition" (rejected: academic, generic, context
clash); `when`="flow" (rejected: a position doesn't flow, and "flow/workflow" already names
**Pipeline** — double-booking); `when`="status" (rejected: clashes with `follow().status`).

### D2 — The rename reaches the runtime API, not just prose
Because "state" must actually disappear, `domain.state` → `domain.phase` and the rest of the
`state`-named surface moves with it. A half-rename (`domain.phase` but `StateHookInput`) is the
exact inconsistency that motivated the change. This makes the release **breaking → 2.0.0**.

### D3 — Complete `state` → `phase` mapping (the contract)

| Surface | From | To |
|---|---|---|
| Runtime property | `domain.state` | `domain.phase` |
| Snapshot field | `DomainSnapshot.state` | `DomainSnapshot.phase` |
| Guard helper | `followFrom(expectedState, …)` | `followFrom(expectedPhase, …)` |
| Hook input type | `StateHookInput` | `PhaseHookInput` |
| Node type | `CurrentStateNode` | `CurrentPhaseNode` |
| Error code | `STATE_MISMATCH` | `PHASE_MISMATCH` |
| Error code | `UNKNOWN_TARGET_STATE` | `UNKNOWN_TARGET_PHASE` |
| Error code | `UNKNOWN_INITIAL_STATE` | `UNKNOWN_INITIAL_PHASE` |
| Graph node kind | `'domain-state'` | `'domain-phase'` |
| Graph edge kind | `'domain-flow'` | `'domain-event'` |
| Graph kinds | `'state-entry-pipeline'` / `'state-entry-hook'` / `'state-exit-hook'` | `'phase-entry-pipeline'` / `'phase-entry-hook'` / `'phase-exit-hook'` |
| Tracer level | `'state'` | `'phase'` |
| Tracer event type | `'state.enter'` / `'state.exit'` | `'phase.enter'` / `'phase.exit'` |
| Tracer field | `stateId` | `phaseId` |
| Internal | `fromState`, loop `stateId`, `stateMismatch`, `unknownTargetState`, `unknownInitialState` | phase-based equivalents |

### D4 — The graph kind literal maps to the right concept (evidence)
From `src/graph/descriptor.ts`: domain *phases* (`when`) are graph **nodes** (kind
`'domain-state'` → `'domain-phase'`); domain *events* (`on`) are graph **edges** (kind
`'domain-flow'` → `'domain-event'`), each with `from`=source phase, `to`=`onDef.target`,
`event`=the event name. So `'domain-flow'` was the `on` edge (not the `when`), and `'domain-state'`
was the `when` node — confirming the swap above rather than a single rename.

### D5 — "edge" stays only as graph theory
`'state-entry-pipeline'` is renamed (it carries the banned word "state") but `'edge-pipeline'`
is **not** (it carries the retained graph-theory word "edge" — a pipeline attached to a graph
edge). This is consistent with the rule: ban state/transition/domain-edge; keep graph-theory edge.

### D6 — Codify in a new `authoring-vocabulary` spec
Encode the glossary and bans as scenarios that read as lint expectations (no "state"/"transition"
in the domain layer; "flow"/"phase"/"event" used correctly; no `on(event, { … })` object form;
helpers shown as ambient imports). This satisfies "it should be in the specs."

### D7 — Internal `OnDef`/`DomainConfig` shape is not the banned authoring object form
`{ on: { SUBMIT: { target: 'x' } } }` in tests is the internal config the descriptor consumes,
not the removed authoring `on('x', { target })` form. Left untouched; only authoring-surface
object forms are purged.

## Risks / Trade-offs

- **Breaking the most-used API (`domain.state`)** → Mitigation: ship a migration table in the
  changelog/README; 2.0.0 signals it; codemods are trivial (pure renames).
- **Trace wire-format change** breaks existing trace consumers → Mitigation: documented in
  migration; confirmed in scope to avoid a half-renamed tracer.
- **Over-reach onto legitimate "edge"/"state-of-the-art" prose** → Mitigation: guard greps assert
  carve-outs (`GraphEdge`, `'edge-pipeline'`, tracer `'edge'`, "edge runtime") still resolve.
- **Missed occurrences** across a large surface → Mitigation: per-group greps in the verification
  tasks; `state`/`'domain-flow'`/object-form greps must return zero in the domain layer.
- **"flow" re-colliding with Pipeline** → Mitigation: "flow" names only the domain-as-a-whole;
  it never becomes a node/edge kind or a Pipeline synonym; the spec records this boundary.

## Migration Plan

1. Rename code by group (D3): types → core (domain/helpers/errors) → graph/descriptor → index.
2. Update all tests to the new literals/codes/properties; `typecheck` + `test` green.
3. Sweep docs/README/examples to flow/phase/event; fix the inaccurate authoring lines.
4. Apply spec deltas (new `authoring-vocabulary` + modified specs).
5. Bump to 2.0.0; add the migration table; run guard greps; `openspec validate`.
6. Update the `authoring-vocabulary-decision` memory to the final flow/phase/event vocabulary.

Rollback: revert the change branch; the rename is mechanical and self-contained.
