## Why

Plexis's vocabulary drifted across three eras (options API → composable redesign → today),
leaving the domain layer described inconsistently: states/transitions/edges/flows are all
used for the same two concepts, and two authoring descriptions are factually wrong (the
removed `on(event, { … })` object form; `action` shown as an injected argument when it is an
ambient import). The deeper problem is that the academic "state machine" framing fits poorly:
"state" is too generic — it collides with **context** (the data passed around) — and a domain
is better understood as a **flow** an entity travels through. This change adopts one coherent,
business-oriented vocabulary across the entire library and writes it into the specs so it
cannot drift again.

The vocabulary:

- **A domain is a flow** — the journey an entity travels over its lifetime.
- **A `when` is a phase** — a named position the domain rests in (formerly "state").
- **An `on` is an event** — what moves the domain from one phase to another (formerly
  "edge" / "transition" / "flow").

## What Changes

- **BREAKING — runtime API rename `state` → `phase`**: `domain.state` → `domain.phase`,
  `DomainSnapshot.state` → `.phase`, `followFrom(expectedState, …)` → `(expectedPhase, …)`,
  type `StateHookInput` → `PhaseHookInput`, type `CurrentStateNode` → `CurrentPhaseNode`.
- **BREAKING — error codes**: `STATE_MISMATCH` → `PHASE_MISMATCH`,
  `UNKNOWN_TARGET_STATE` → `UNKNOWN_TARGET_PHASE`, `UNKNOWN_INITIAL_STATE` →
  `UNKNOWN_INITIAL_PHASE`.
- **BREAKING — graph kind literals**: node `'domain-state'` → `'domain-phase'`; edge
  `'domain-flow'` → `'domain-event'`; `'state-entry-pipeline'` → `'phase-entry-pipeline'`,
  `'state-entry-hook'` → `'phase-entry-hook'`, `'state-exit-hook'` → `'phase-exit-hook'`.
- **BREAKING — tracer surface**: level `'state'` → `'phase'`; event types `'state.enter'` /
  `'state.exit'` → `'phase.enter'` / `'phase.exit'`; trace event field `stateId` → `phaseId`.
- **Internal consistency**: rename internal identifiers (`fromState`, loop `stateId`, error
  factories `stateMismatch` / `unknownTargetState` / `unknownInitialState`) to phase-based names.
- **Codify the vocabulary** in a new `authoring-vocabulary` spec: endorse **flow** (the domain),
  **phase** (`when`), **event** (`on`); ban **state**, **transition**, and the domain sense of
  **edge**; minimize incidental "transition" wording.
- **Fix the inaccurate authoring descriptions**: remove every `on(event, { … })` object form and
  every implication that `guard` / `action` / `pipeline` are injected; they are ambient imports
  called inside the `on` setup.
- **Purge prose**: README, docs, and example code re-described in flow/phase/event terms.
- **Version**: major bump (1.1.0 → 2.0.0) with a migration note.
- **Preserved deliberately**: graph-theory **edge** (`GraphEdge`, `edges: GraphEdge[]`,
  inbound/outbound, fork edges) and the graph-edge-kind literals `'edge-action'` /
  `'edge-pipeline'` / `'subpipeline'` — "edge" = any directed graph connection; the tracer
  **`'edge'` level** stays; phase *ids* carried by `follow().from` / `.to` and history entries
  keep their names (they hold ids, not the word "state"); unrelated senses (serverless/edge
  runtime, edge case) untouched.

## Capabilities

### New Capabilities
- `authoring-vocabulary`: The canonical glossary and naming rules — **flow** (domain), **phase**
  (`when`), **event** (`on`); the graph-theory **edge** carve-out; the bans on **state** /
  **transition** / domain-**edge**; and the no-object-form / no-injected-arg authoring rules,
  with rationale recorded so the terms cannot drift back.

### Modified Capabilities
- `domain`: `state` → `phase` across the runtime surface (`phase` property, snapshot,
  `followFrom`, hooks) and all requirement prose re-framed to flow/phase/event.
- `graph-introspection`: node/edge/hook kind literals renamed (`domain-phase`, `domain-event`,
  `phase-entry-*`); graph-theory `GraphEdge` / `edges[]` and `'edge-*'` literals unchanged.
- `tracer`: level `'state'` → `'phase'`; `'state.enter'` / `'state.exit'` event types and the
  `stateId` field renamed; the `'edge'` level retained.
- `error-handling`: `STATE_MISMATCH` → `PHASE_MISMATCH`, `UNKNOWN_TARGET_STATE` →
  `UNKNOWN_TARGET_PHASE`, `UNKNOWN_INITIAL_STATE` → `UNKNOWN_INITIAL_PHASE`.
- `docs-code-style`: casing example rewritten off the removed object form; "edge unions" →
  "event unions".
- `docs-concepts-guides`: execution-and-lifecycle ordering re-framed to phase/event and the
  object-form description removed.

> Out of scope here: the `examples`, `readme`, and `docs-site` specs additionally enumerate
> other post-redesign-stale symbols (`StateNodeDef`, `EdgeDef`, `TransitionActionInput`).
> Their `state`/`edge`-token fixes ride along in this change's doc-file sweep, but a full
> reconciliation of those specs with the shipped API is recommended as a separate follow-up.

## Impact

- **Library code**: `packages/plexis/src/types.ts`, `core/domain.ts`, `core/helpers.ts`,
  `core/errors.ts`, `graph/descriptor.ts`, `index.ts`.
- **Tests**: every suite asserting the renamed literals/codes/properties (`graph.test.ts`,
  `errors.test.ts`, domain/tracer suites).
- **Docs & examples**: `apps/docs/src/content/docs/**`, `README.md`, `packages/plexis/README.md`,
  `packages/plexis/examples/**`.
- **Specs**: new `authoring-vocabulary`; modified `domain`, `graph-introspection`, `tracer`,
  `error-handling`, `docs-code-style`, `docs-concepts-guides`.
- **Consumers**: this is a **2.0.0** breaking change — `domain.state`→`.phase`, the two error
  codes, and the graph/tracer literals all move. A migration table ships in the changelog/README.
