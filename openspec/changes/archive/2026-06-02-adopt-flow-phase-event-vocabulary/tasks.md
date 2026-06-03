## 1. Rename the `state` → `phase` surface in library code

- [x] 1.1 `packages/plexis/src/types.ts`: `GraphNodeKind` `'domain-state'`→`'domain-phase'`; `GraphEdgeKind` `'domain-flow'`→`'domain-event'` and `'state-entry-pipeline'`/`'state-entry-hook'`/`'state-exit-hook'`→`'phase-*'`; `GraphAttachmentKind` `'state-entry-pipeline'`→`'phase-entry-pipeline'`; `StateHookInput`→`PhaseHookInput`; `CurrentStateNode`→`CurrentPhaseNode`; error codes `STATE_MISMATCH`/`UNKNOWN_INITIAL_STATE`/`UNKNOWN_TARGET_STATE`→`PHASE_MISMATCH`/`UNKNOWN_INITIAL_PHASE`/`UNKNOWN_TARGET_PHASE`; Domain `state` member/snapshot field→`phase`; `followFrom(expectedState…)`→`(expectedPhase…)`.
- [x] 1.2 `packages/plexis/src/core/domain.ts`: `this.state`→`this.phase`; tracer `level: 'state'`→`'phase'`, `type: 'state.exit'`/`'state.enter'`→`'phase.exit'`/`'phase.enter'`, trace field `stateId`→`phaseId`; internal `fromState`→`fromPhase`; snapshot/`followFrom` updates.
- [x] 1.3 `packages/plexis/src/core/errors.ts`: error factories `stateMismatch`/`unknownTargetState`/`unknownInitialState`→phase-named; thrown codes updated.
- [x] 1.4 `packages/plexis/src/core/helpers.ts`: `StateHookInput`→`PhaseHookInput` imports/usages.
- [x] 1.5 `packages/plexis/src/graph/descriptor.ts`: emit `'domain-phase'` for `when` nodes, `'domain-event'` for `on` edges, `'phase-entry-pipeline'` attachment; rename loop var `stateId`→`phaseId`.
- [x] 1.6 `packages/plexis/src/index.ts`: update re-exports (`PhaseHookInput`, etc.).
- [x] 1.7 `pnpm --filter @tde.io/plexis typecheck` clean.

## 2. Update tests to the new surface

- [x] 2.1 `packages/plexis/tests/graph.test.ts`: assert `'domain-phase'`/`'domain-event'`/`'phase-*'`; assert old `'domain-state'`/`'domain-flow'`/`'state-*'` do not appear.
- [x] 2.2 `packages/plexis/tests/errors.test.ts`: new error codes (`PHASE_MISMATCH`, `UNKNOWN_TARGET_PHASE`, `UNKNOWN_INITIAL_PHASE`).
- [x] 2.3 Domain/tracer suites: `domain.phase`, snapshot `.phase`, `followFrom` PHASE_MISMATCH, tracer level `'phase'` + `'phase.enter'`/`'phase.exit'` + `phaseId`.
- [x] 2.4 `pnpm --filter @tde.io/plexis test` green.

## 3. Fix inaccurate authoring descriptions

- [x] 3.1 `apps/docs/.../concepts/execution-and-lifecycle.mdx`: rewrite the `follow()`-order section to the canonical 8 steps, flow/phase/event-anchored (no "state"/"transition"/"flow"-as-`when`, no `on(event, { action })` object form): (1) Guard check — the event's `on` guard; (2) `exit` hook; (3) `on` action — the ambient `action(fn)` inside the `on` setup; (4) `on` pipeline; (5) phase change; (6) `enter` hook; (7) phase entry pipeline; (8) history (the followed event) + subscribers.
- [x] 3.2 Grep docs/specs for any other `on(event, { ... })` object form or injected-argument (`({ action }) => ...`) phrasing and correct it.

## 4. Purge prose to flow / phase / event

- [x] 4.1 `README.md` and `packages/plexis/README.md`: re-describe states→phases, transitions/edges→events, the domain as a flow; update any `domain.state` usage to `domain.phase`.
- [x] 4.2 `apps/docs/.../concepts/**` and `.../patterns/**` (guards-vs-forks, type-safe-domains, custom-merge, designing-the-state-graph): replace "state"/"transition"/domain-"edge"/"flow"-as-`when` with phase/event; keep graph-theory edge references.
- [x] 4.3 `apps/docs/.../guides/**` (domain, tracer, error-handling, advanced/{saga,multi-step-form,persist-and-rehydrate,state-graph-visualizer}): phase/event vocabulary; tracer level `'phase'`; graph kinds `'domain-phase'`/`'domain-event'`; fix snippets importing removed `edge`/`state` helpers → `on`/`when`.
- [x] 4.4 `apps/docs/.../reference/**` (domain, types, errors, pipeline): `domain.phase`, new error codes, renamed kinds/levels; keep graph-theory `GraphEdge`/inbound/outbound and tracer `'edge'` level.
- [x] 4.5 `packages/plexis/examples/**`: phase/event comments; `domain.phase`; renamed codes/kinds.
- [x] 4.6 **Do not touch** graph-theory edge (`GraphEdge`, `descriptor.edges`, inbound/outbound, fork edges), `'edge-action'`/`'edge-pipeline'`/`'subpipeline'`, tracer `'edge'` level, phase *ids* on `follow().from`/`.to`/history, or "serverless/edge runtime" / "edge case".

## 5. Complete the spec deltas (`specs/**`)

- [x] 5.1 `authoring-vocabulary` (new) — flow/phase/event glossary, graph-theory edge carve-out, no-object-form/no-injected-arg rules.
- [x] 5.2 `domain` — extend the delta to sweep the remaining `state`/`transition` mentions in `openspec/specs/domain/spec.md` not yet covered (e.g. `can` introspection, lifecycle hooks, terminal phases, history, subscriptions, the `on`/`target`/`action`-scope requirements), with RENAMED entries for any further header changes.
- [x] 5.3 `graph-introspection`, `tracer`, `error-handling`, `docs-code-style`, `docs-concepts-guides` — confirm deltas match the implemented literals/codes/levels.

## 6. Release & verify

- [x] 6.1 Bump `packages/plexis/package.json` to `2.0.0`; add a migration table (`state`→`phase`, the three error codes, graph/tracer literals) to the changelog/README.
- [x] 6.2 Guard greps (exclude `node_modules`, `dist`, `openspec/changes/archive`): domain layer has no `\bstate\b`/`transition`/`domain-flow`/`domain-state`/`STATE_MISMATCH`/`UNKNOWN_*_STATE`; no `on\([^)]*\{ *(target|action|guard|pipeline)` in docs/specs.
- [x] 6.3 Carve-out greps still resolve: `GraphEdge`, `descriptor.edges`, `'edge-pipeline'`, tracer level `'edge'`, "edge runtime".
- [x] 6.4 `pnpm --filter @tde.io/plexis typecheck && pnpm --filter @tde.io/plexis test` green; `pnpm --filter docs build` if practical.
- [x] 6.5 `openspec validate adopt-flow-phase-event-vocabulary` passes.
- [x] 6.6 Update the `authoring-vocabulary-decision` memory to the final vocabulary: domain = flow, `when` = phase, `on` = event; "state"/"transition" banned; graph-theory edge + tracer `'edge'` retained.

## 7. Follow-up (separate change)

- [ ] 7.1 Reconcile the `examples`, `readme`, and `docs-site` specs with the shipped API beyond this vocabulary sweep (`StateNodeDef`, `EdgeDef`, `TransitionActionInput`, removed `state`/`edge` helper enumerations).
