## ADDED Requirements

### Requirement: `PlexisError` is a typed subclass of `Error`

The library SHALL export `PlexisError`, a subclass of `Error` with a required `code` field and optional `domainId`, `pipelineId`, `nodeId`, and `context` fields. `instanceof PlexisError` SHALL be `true` for every error thrown by the library to signal a Plexis-defined failure mode.

#### Scenario: Library failures throw PlexisError instances

- **WHEN** the library throws due to a Plexis-defined failure mode (e.g., unknown event in strict mode)
- **THEN** the thrown value SHALL satisfy `err instanceof PlexisError` and `err instanceof Error`, and SHALL carry a non-empty `code` string

### Requirement: Documented error codes

`PlexisError.code` SHALL be one of the documented codes: `UNKNOWN_EVENT`, `STATE_MISMATCH`, `UNKNOWN_INITIAL_STATE`, `UNKNOWN_INITIAL_NODE`, `UNKNOWN_TARGET_STATE`, `UNKNOWN_TARGET_NODE`, `UNKNOWN_NODE`, `BUILDER_CLOSED`. The library SHALL NOT throw `PlexisError` with an undocumented `code`.

#### Scenario: Each documented failure maps to its declared code

- **WHEN** the library encounters an unknown initial state at Domain construction
- **THEN** the thrown error SHALL have `code === 'UNKNOWN_INITIAL_STATE'`

### Requirement: `BUILDER_CLOSED` when registration helpers are misused

When a registration helper (`state`, `edge`, `node`, `fork`, `terminal`) is called outside an active `defineDomain` / `definePipeline` (or class equivalent) setup scope, or after the setup function has returned and the builder has been sealed, the helper SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`. The error message SHALL name the offending helper to aid debugging. The builder scope SHALL be cleared in a `finally` block so a setup function that throws mid-execution does not leave a dangling scope.

#### Scenario: Helper called at module top level throws BUILDER_CLOSED

- **WHEN** `state('orphan', { edges: {} })` is invoked at module top level (no active setup scope)
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: Helper called from a deferred async callback throws BUILDER_CLOSED

- **WHEN** a `setup` function schedules `setTimeout(() => state('late', { edges: {} }), 0)` and returns
- **THEN** the deferred `state()` call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` and SHALL NOT modify the already-sealed Domain

#### Scenario: Exception during setup leaves no dangling scope

- **WHEN** a `setup` function calls `state('a', { edges: {} })` and then throws an exception before returning
- **THEN** the next call to `defineDomain` from outside that scope SHALL operate on a fresh builder, and helpers called between the two `defineDomain` invocations SHALL throw `BUILDER_CLOSED`

### Requirement: Strict mode controls `UNKNOWN_EVENT` behavior

When a Domain is constructed with `strict: true`, calling `follow(unknownEvent)` SHALL throw `PlexisError` with `code === 'UNKNOWN_EVENT'`. When `strict: false`, the same call SHALL return a result with `status: 'ignored'` and SHALL NOT throw.

#### Scenario: Strict mode throws on unknown event

- **WHEN** `domain.follow('UNKNOWN')` is called on a Domain with `strict: true` whose current state declares no edge for `'UNKNOWN'`
- **THEN** the call SHALL throw `PlexisError` with `code === 'UNKNOWN_EVENT'`, `domainId` matching the Domain id, and the offending state recorded

#### Scenario: Non-strict mode ignores unknown event

- **WHEN** the same call is made on an otherwise identical Domain with `strict: false`
- **THEN** the call SHALL return `status: 'ignored'` and the Domain SHALL NOT throw

### Requirement: Construction-time validation always throws

Structural errors detected at construction (`UNKNOWN_INITIAL_STATE`, `UNKNOWN_INITIAL_NODE`, `UNKNOWN_TARGET_STATE`, `UNKNOWN_TARGET_NODE`, `UNKNOWN_NODE`) SHALL throw `PlexisError` regardless of `strict` mode. These are not runtime decisions and cannot be silently ignored.

#### Scenario: Unknown target state throws at construction even in non-strict mode

- **WHEN** a Domain is constructed with `strict: false` and an edge whose `target: 'missing'` does not reference an existing state
- **THEN** construction SHALL throw `PlexisError` with `code === 'UNKNOWN_TARGET_STATE'`

### Requirement: `followFrom` throws `STATE_MISMATCH`

`domain.followFrom(expectedState, event, payload?)` SHALL throw `PlexisError` with `code === 'STATE_MISMATCH'` when the Domain's current state does not equal `expectedState`. The error SHALL carry `domainId`, the expected state, and the actual state.

#### Scenario: followFrom on the wrong state throws STATE_MISMATCH

- **WHEN** the Domain's current state is `'pending'` and `followFrom('processing', 'COMPLETE')` is called
- **THEN** the call SHALL throw `PlexisError` with `code === 'STATE_MISMATCH'`, the `domainId` set, and both the expected and actual state values recoverable from the error

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
