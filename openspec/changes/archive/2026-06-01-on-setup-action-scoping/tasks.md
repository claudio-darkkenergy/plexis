## 1. Types (`src/types.ts`)

- [x] 1.1 Add `TargetDef` type (`{ __type: 'TargetDef'; id: string }`)
- [x] 1.2 Add `OnSetupFn` type (`() => TargetDef`)
- [x] 1.3 Add `OnGuardInput` type (same shape as `OnActionInput`: `event`, `payload`, `traceId`)
- [x] 1.4 Update `OnDef` so its second arg type is `TargetDef | OnSetupFn` (replace the object form)
- [x] 1.5 Extend `TerminalDef` with the optional `action?` field (confirm node-context action typing as `PipelineActionInput`)
- [x] 1.6 Add `DUPLICATE_REGISTRATION` and `MISSING_TARGET` to the `PlexisErrorCode` union; type `action`'s registered `input` as `PipelineActionInput | OnActionInput` for now

## 2. Tests first — TDD red (`src/../tests/`)

- [x] 2.1 `helpers.test.ts`: `on` setup-function form registers guard, action, pipeline and returns `target()`
- [x] 2.2 `helpers.test.ts`: `on` simple form `on('cancel', target('cancelled'))` builds a flow with target only
- [x] 2.3 `helpers.test.ts`: `target()` called outside any setup does NOT throw and returns the sentinel
- [x] 2.4 `errors.test.ts`: `DUPLICATE_REGISTRATION` thrown on second `guard`, second `action`, second `pipeline` in one `on`
- [x] 2.4a `errors.test.ts`: `MISSING_TARGET` thrown when an `on` setup fn returns no `target()` (and a non-`TargetDef`); assert it is NOT `BUILDER_CLOSED`
- [x] 2.5 `errors.test.ts`: `BUILDER_CLOSED` for `guard`/`pipeline` outside an `on`, and `action` inside a `when` but outside any `on`
- [x] 2.6 `errors.test.ts`: `on` called outside a `when` and from a deferred async callback throws `BUILDER_CLOSED`
- [x] 2.7 `pipeline.test.ts`: node `action` receives `PipelineActionInput` (`nodeId`, `pipelineId`, `input`, `traceId`)
- [x] 2.8 `pipeline.test.ts`: `terminal(fn)` final action runs with `PipelineActionInput` and merges its patch before `completed`
- [x] 2.9 `domain.test.ts`: `on` action receives `OnActionInput` (`event`, `payload`, `traceId`); guard + pipeline still drive `follow` correctly

## 3. Helpers (`src/core/helpers.ts`)

- [x] 3.1 Implement `target(id)` sentinel — pure, scope-independent, never throws
- [x] 3.2 Implement `guard(fn)` — `on`-scoped; single-slot; throws `BUILDER_CLOSED` outside an `on` scope
- [x] 3.3 Implement `pipeline(p)` — `on`-scoped; single-slot; throws `BUILDER_CLOSED` outside an `on` scope
- [x] 3.4 Push a new `on` builder-scope kind; rewrite `on(event, def)` to resolve `TargetDef` (simple) vs setup fn (push/run/pop in `finally`); throw `MISSING_TARGET` when the setup fn returns a non-`TargetDef`
- [x] 3.5 Scope-route `action(fn)`: `node` scope → node action (`PipelineActionInput`); `on` scope → transition action (`OnActionInput`); else throw `BUILDER_CLOSED`
- [x] 3.6 Enforce single-slot for `guard`/`action`/`pipeline` in the `on` scope; throw `DUPLICATE_REGISTRATION` with event+helper named
- [x] 3.7 Confirm `terminal(fn?)` carries the optional action into the built node def (node context)

## 4. Runtime wiring & exports

- [x] 4.1 `src/core/domain.ts`: consume the new `OnDef` assembly output (target + optional guard/action/pipeline); confirm `follow` ordering unchanged
- [x] 4.2 `src/core/errors.ts`: add `DUPLICATE_REGISTRATION` and `MISSING_TARGET` and their message helpers if errors are centralized there
- [x] 4.3 `src/index.ts`: export `target`, `guard`, `pipeline` (and confirm full export surface matches the proposal list)
- [x] 4.4 Run `pnpm typecheck` and the full test suite — green

## 5. Documentation & spec

- [x] 5.1 `.specs/plexis-composable-spec.md`: update the `on` section; add `target`, `guard`, `pipeline`; document `DUPLICATE_REGISTRATION` and `MISSING_TARGET`; update the complete example and export list
- [x] 5.2 `CLAUDE.md`: update authoring vocabulary table; note `on` dual-form; note `action` scope rules; note `no-shadow` rationale for ambient imports
- [x] 5.3 Docs site (`apps/docs/src/content/docs/`) and README: replace every `on('EVENT', { target: ... })` with `on('event', target(...))` or the setup-fn form
- [x] 5.4 Update `.claude/skills/skill-config.md` if authoring conventions changed (per the Skill Config Rule)

## 6. Verify

- [x] 6.1 `openspec validate on-setup-action-scoping --strict` passes
- [x] 6.2 Build all outputs (ESM/CJS/types) succeed; grep confirms no remaining `{ target:` object-form `on(...)` examples in docs/tests
