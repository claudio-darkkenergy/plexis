## ADDED Requirements

### Requirement: `PlexisError` is a typed subclass of `Error`

The library SHALL export `PlexisError`, a subclass of `Error` with a required `code` field and optional `domainId`, `pipelineId`, `nodeId`, and `context` fields. `instanceof PlexisError` SHALL be `true` for every error thrown by the library to signal a Plexis-defined failure mode.

#### Scenario: Library failures throw PlexisError instances

- **WHEN** the library throws due to a Plexis-defined failure mode (e.g., unknown event in strict mode)
- **THEN** the thrown value SHALL satisfy `err instanceof PlexisError` and `err instanceof Error`, and SHALL carry a non-empty `code` string

### Requirement: `DUPLICATE_REGISTRATION` for single-slot `on` registrations

`guard`, `action`, and `pipeline` are single-slot registrations within one `on` setup function. The second call to any of them during the same `on` setup SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`. The error message SHALL name the event and the offending helper (e.g. `on('submit') — guard() was already registered for this handler. Each on() accepts a single guard.`). This rule SHALL NOT apply to `fork` inside a `node` setup, which is repeatable and order-sensitive.

#### Scenario: Second guard call throws DUPLICATE_REGISTRATION

- **WHEN** an `on('submit', () => { guard(g1); guard(g2); return target('processing'); })` setup is evaluated
- **THEN** the second `guard` call SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`, naming `guard` and event `'submit'`

#### Scenario: Second action call throws DUPLICATE_REGISTRATION

- **WHEN** an `on('submit', () => { action(a1); action(a2); return target('processing'); })` setup is evaluated
- **THEN** the second `action` call SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`, naming `action` and event `'submit'`

#### Scenario: Second pipeline call throws DUPLICATE_REGISTRATION

- **WHEN** an `on('submit', () => { pipeline(p1); pipeline(p2); return target('processing'); })` setup is evaluated
- **THEN** the second `pipeline` call SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`, naming `pipeline` and event `'submit'`

#### Scenario: Repeated `fork` in a node does not throw DUPLICATE_REGISTRATION

- **WHEN** a `node('validate-card', () => { fork('to-a', target('a'), c1); fork('to-b', target('b'), c2); })` setup declares two forks
- **THEN** neither `fork` call SHALL throw, and both branches SHALL be registered in declaration order

### Requirement: `MISSING_TARGET` when an `on` setup function returns no `target()`

When an `on(event, setupFn)` setup function runs to completion without returning a `target()` value, the library SHALL throw `PlexisError` with `code === 'MISSING_TARGET'`. This is distinct from `BUILDER_CLOSED`: the builder scope was valid and the setup ran, but its required contract — returning a phase destination — was not honored. The error message SHALL name the event and direct the author to `return target('phase-id')` as the last statement of the setup function.

#### Scenario: `on` setup function with no returned target throws MISSING_TARGET

- **WHEN** an `on('submit', () => { action(a1); })` setup runs and returns `undefined` instead of a `target()` value
- **THEN** the call SHALL throw `PlexisError` with `code === 'MISSING_TARGET'`, naming event `'submit'`, and SHALL NOT throw `BUILDER_CLOSED`

#### Scenario: `on` setup function returning a non-`TargetDef` value throws MISSING_TARGET

- **WHEN** an `on('submit', () => { return { target: 'processing' }; })` setup returns a plain object rather than a `target()` sentinel
- **THEN** the call SHALL throw `PlexisError` with `code === 'MISSING_TARGET'`

### Requirement: Documented error codes

`PlexisError.code` SHALL be one of the documented codes: `UNKNOWN_EVENT`, `PHASE_MISMATCH`, `UNKNOWN_INITIAL_PHASE`, `UNKNOWN_INITIAL_NODE`, `UNKNOWN_TARGET_PHASE`, `UNKNOWN_TARGET_NODE`, `UNKNOWN_NODE`, `BUILDER_CLOSED`, `DUPLICATE_REGISTRATION`, `MISSING_TARGET`, `INVALID_TARGET`. The library SHALL NOT throw `PlexisError` with an undocumented `code`. The phase-related codes are renamed from `STATE_MISMATCH`, `UNKNOWN_INITIAL_STATE`, and `UNKNOWN_TARGET_STATE`.

#### Scenario: Only documented codes are thrown

- **WHEN** any `PlexisError` is thrown by the library
- **THEN** its `code` SHALL be one of the documented codes and SHALL NOT be `STATE_MISMATCH`, `UNKNOWN_INITIAL_STATE`, or `UNKNOWN_TARGET_STATE`

#### Scenario: Unknown initial phase maps to UNKNOWN_INITIAL_PHASE

- **WHEN** the library encounters an unknown initial phase at Domain construction
- **THEN** the thrown error SHALL have `code === 'UNKNOWN_INITIAL_PHASE'`

#### Scenario: Duplicate single-slot registration maps to DUPLICATE_REGISTRATION

- **WHEN** `guard`, `action`, or `pipeline` is called twice within the same `on` setup function
- **THEN** the thrown error SHALL have `code === 'DUPLICATE_REGISTRATION'`

#### Scenario: `on` setup returning no target maps to MISSING_TARGET

- **WHEN** an `on` setup function completes without returning a `target()` value
- **THEN** the thrown error SHALL have `code === 'MISSING_TARGET'`

### Requirement: `BUILDER_CLOSED` when registration helpers are misused

When a scope-sensitive registration helper (`when`, `enter`, `exit`, `on`, `node`, `action`, `fork`, `guard`, `pipeline`) is called outside its valid active `defineDomain` / `definePipeline` (or class equivalent) setup scope, or after the setup function has returned and the builder has been sealed, the helper SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`. This includes `guard`, `pipeline`, and `action` called outside an active `on` setup, and `action` called inside a `when` setup but outside any `on` setup. The sentinels `target` and `terminal` are scope-independent and SHALL NOT throw `BUILDER_CLOSED`. The error message SHALL name the offending helper to aid debugging. The builder scope SHALL be cleared in a `finally` block so a setup function that throws mid-execution does not leave a dangling scope.

#### Scenario: Helper called at module top level throws BUILDER_CLOSED

- **WHEN** `on('orphan', target('x'))` is invoked at module top level (no active setup scope)
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: `guard` or `pipeline` outside an `on` setup throws BUILDER_CLOSED

- **WHEN** `guard(fn)` or `pipeline(p)` is called inside a `when` setup but outside any `on` setup, or at module top level
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` naming the offending helper

#### Scenario: `action` inside a `when` setup throws BUILDER_CLOSED

- **WHEN** `action(fn)` is called directly inside a `when` setup but outside any `on` setup
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: Helper called from a deferred async callback throws BUILDER_CLOSED

- **WHEN** a `setup` function schedules `setTimeout(() => on('late', target('x')), 0)` and returns
- **THEN** the deferred `on()` call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` and SHALL NOT modify the already-sealed Domain

#### Scenario: Exception during setup leaves no dangling scope

- **WHEN** a `setup` function calls `when('a', () => {})` and then throws an exception before returning
- **THEN** the next call to `defineDomain` from outside that scope SHALL operate on a fresh builder, and helpers called between the two `defineDomain` invocations SHALL throw `BUILDER_CLOSED`

### Requirement: Strict mode controls `UNKNOWN_EVENT` behavior

When a Domain is constructed with `strict: true`, calling `follow(unknownEvent)` SHALL throw `PlexisError` with `code === 'UNKNOWN_EVENT'`. When `strict: false`, the same call SHALL return a result with `status: 'ignored'` and SHALL NOT throw.

#### Scenario: Strict mode throws on unknown event

- **WHEN** `domain.follow('unknown')` is called on a Domain with `strict: true` whose current phase declares no `on` handler for `'unknown'`
- **THEN** the call SHALL throw `PlexisError` with `code === 'UNKNOWN_EVENT'`, `domainId` matching the Domain id, and the offending phase recorded

#### Scenario: Non-strict mode ignores unknown event

- **WHEN** the same call is made on an otherwise identical Domain with `strict: false`
- **THEN** the call SHALL return `status: 'ignored'` and the Domain SHALL NOT throw

### Requirement: Construction-time validation always throws

Structural errors detected at construction (`UNKNOWN_INITIAL_PHASE`, `UNKNOWN_INITIAL_NODE`, `UNKNOWN_TARGET_PHASE`, `UNKNOWN_TARGET_NODE`, `UNKNOWN_NODE`) SHALL throw `PlexisError` regardless of `strict` mode. These are not runtime decisions and cannot be silently ignored.

#### Scenario: Unknown target phase throws at construction even in non-strict mode

- **WHEN** a Domain is constructed with `strict: false` and an `on` handler whose `target: 'missing'` does not reference an existing phase
- **THEN** construction SHALL throw `PlexisError` with `code === 'UNKNOWN_TARGET_PHASE'`

### Requirement: `followFrom` throws `PHASE_MISMATCH`

`domain.followFrom(expectedPhase, event, payload?)` SHALL throw `PlexisError` with `code === 'PHASE_MISMATCH'` when the Domain's current phase does not equal `expectedPhase`. The error SHALL carry `domainId`, the expected phase, and the actual phase.

#### Scenario: followFrom on the wrong phase throws PHASE_MISMATCH

- **WHEN** the Domain's current phase is `'pending'` and `followFrom('processing', 'complete')` is called
- **THEN** the call SHALL throw `PlexisError` with `code === 'PHASE_MISMATCH'`, the `domainId` set, and both the expected and actual phase values recoverable from the error

### Requirement: Pipeline error policies

`definePipeline` and `new Pipeline` SHALL accept an `errorPolicy` option of `'throw' | 'return' | 'trace-and-return'`. Under `'throw'` (default), an action exception SHALL propagate out of `pipeline.run`. Under `'return'`, the exception SHALL be caught and surfaced in the `PipelineRunResult` as `status: 'error'` with the `error` field populated. Under `'trace-and-return'`, the exception SHALL additionally be recorded as a trace event with `status: 'failed'` before being returned in the result.

#### Scenario: Default policy propagates errors

- **WHEN** a Pipeline with default `errorPolicy` runs and a node action throws
- **THEN** `pipeline.run(...)` SHALL reject with the original error

#### Scenario: Return policy captures errors in the result

- **WHEN** a Pipeline with `errorPolicy: 'return'` runs and a node action throws an `Error('boom')`
- **THEN** the returned `PipelineRunResult` SHALL have `status: 'error'` and `error` referencing the thrown `Error('boom')`

#### Scenario: trace-and-return records a failed trace event

- **WHEN** a Pipeline with `errorPolicy: 'trace-and-return'` is attached to a Tracer and a node action throws
- **THEN** the Tracer SHALL record an event with `status: 'failed'` carrying the error before the run returns
