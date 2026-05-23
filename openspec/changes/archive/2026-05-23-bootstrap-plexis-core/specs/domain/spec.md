## ADDED Requirements

### Requirement: Composable Domain construction with class equivalence

The system SHALL expose `defineDomain(id, setup, options?)` as the primary authoring API and `new Domain(id, setup, options?)` for advanced use (subclassing, explicit instance construction). Both SHALL accept the same arguments, route through a single internal builder (`buildDomain`), and produce instances satisfying the `Domain<TContext, TEdges>` interface declared in `src/types.ts`. Both SHALL produce identical runtime behavior, identical `GraphDescriptor` output from `describe()`, and identical trace output for the same inputs.

The `setup` function SHALL be synchronous. During its execution, the registration helpers `state()`, `edge()`, `onEnter()` / `onExit()` (where applicable), and any other documented helpers SHALL be callable to register state nodes and edges into the active builder scope. After `setup` returns, the builder SHALL be sealed and SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` if any registration helper is invoked thereafter.

The `setup` return value SHALL provide the root configuration: `{ context, initial, strict?, errorPolicy? }`.

#### Scenario: defineDomain and new Domain produce identical instances

- **WHEN** a caller constructs a Domain with `defineDomain('order', setup, options)` and a second Domain with `new Domain('order', setup, options)` using the same setup function and options
- **THEN** both instances SHALL produce identical `describe()` graph descriptors and identical state/context after the same sequence of `follow()` calls

#### Scenario: Setup function registers states via helpers

- **WHEN** a `setup` function calls `state('pending', { edges: { SUBMIT: edge({ target: 'processing' }) } })` and `state('processing', { edges: {} })`, then returns `{ context: {}, initial: 'pending' }`
- **THEN** the resulting Domain SHALL have `state === 'pending'`, two registered states in `describe()`, and one declared edge from `'pending'` to `'processing'` on event `'SUBMIT'`

#### Scenario: Helpers called outside setup throw BUILDER_CLOSED

- **WHEN** a caller invokes `state('orphan', { edges: {} })` outside any active `defineDomain` or `new Domain` setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: Helpers called after setup returns throw BUILDER_CLOSED

- **WHEN** a `setup` function captures a reference and after returning calls `state('late', { edges: {} })` from an async callback
- **THEN** the deferred call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` and SHALL NOT modify the already-sealed Domain

### Requirement: State transitions via `follow`

The Domain SHALL transition between states only in response to `follow(event, payload?)`. The result SHALL be a `DomainFollowResult` with `status` of `'followed'`, `'blocked'`, `'ignored'`, or `'error'`, plus `event`, `from`, optional `to`, `context`, and `traceId`.

#### Scenario: Successful event follows the matching edge

- **WHEN** the current state has an edge declared for `event` with no guard or a passing guard
- **THEN** `follow(event, payload)` SHALL return `status: 'followed'` with `to` equal to the edge's target and the Domain's `state` SHALL be updated to that target

#### Scenario: Unknown event in non-strict mode is ignored

- **WHEN** the Domain is constructed with `strict: false` and `follow(unknownEvent)` is called
- **THEN** the result SHALL have `status: 'ignored'`, the Domain's `state` SHALL be unchanged, and no error SHALL be thrown

### Requirement: Guard evaluation blocks edge traversal

When an edge declares a `guard`, the guard SHALL be invoked with the current context and a `GuardInput`. If the guard returns or resolves to `false`, the edge SHALL NOT be followed; no `onExit`, action, edge pipeline, `onEnter`, or state pipeline SHALL run; and the state SHALL remain unchanged.

#### Scenario: Failing guard blocks the transition

- **WHEN** an edge's guard returns `false`
- **THEN** the `follow` result SHALL have `status: 'blocked'`, `to` SHALL be omitted, and no side effects from `onExit`, edge action, edge pipeline, `onEnter`, or state pipeline SHALL be observable

### Requirement: Documented execution order on edge traversal

On a successful (guard-passed) `follow`, the runtime SHALL execute the following steps in this exact order before notifying subscribers: (1) `onExit` of the current state, (2) edge action, (3) edge pipeline, (4) update of `state` to target, (5) `onEnter` of the target state, (6) state entry pipeline of the target, (7) history record, (8) subscriber notification.

#### Scenario: Patches are applied in declared order

- **WHEN** `onExit` returns `{ a: 1 }`, edge action returns `{ b: 2 }`, edge pipeline produces `{ c: 3 }`, `onEnter` returns `{ a: 9 }`, and state entry pipeline produces `{ d: 4 }`
- **THEN** the resulting context SHALL contain `{ a: 9, b: 2, c: 3, d: 4 }` reflecting the documented merge order

### Requirement: Lifecycle hooks `onEnter` and `onExit`

Each state node MAY declare `onEnter` and `onExit` handlers. They SHALL receive the current context and a `StateHookInput` with `event`, optional `payload`, and `traceId`. They SHALL return a patch (or `void`/`null`/`undefined` for no change).

#### Scenario: onEnter runs on initial state at construction

- **WHEN** a Domain is constructed with `initial: 'pending'` and `pending` declares `onEnter`
- **THEN** `onEnter` SHALL be invoked once at construction time and any returned patch SHALL be merged into the initial context

### Requirement: `can` introspection

`domain.can(event, payload?)` SHALL return `true` only if the current state declares an edge for `event` and, if a guard is present, the guard returns or resolves to `true`. It SHALL NOT cause any state transition or side effect.

#### Scenario: can returns false when no matching edge exists

- **WHEN** the current state declares no edge for `event`
- **THEN** `can(event)` SHALL return `false`

#### Scenario: can returns false when the guard rejects

- **WHEN** the current state declares an edge for `event` with a guard that returns `false`
- **THEN** `can(event)` SHALL return `false` and the Domain's state SHALL remain unchanged

### Requirement: `followFrom` asserts current state

`domain.followFrom(expectedState, event, payload?)` SHALL throw `PlexisError` with code `STATE_MISMATCH` if the Domain's current state is not equal to `expectedState`. Otherwise it SHALL behave identically to `follow(event, payload)`.

#### Scenario: State mismatch throws STATE_MISMATCH

- **WHEN** the Domain's current state is `'pending'` and `followFrom('processing', 'COMPLETE')` is called
- **THEN** the call SHALL throw `PlexisError` with `code === 'STATE_MISMATCH'`, `domainId` matching the Domain id, and the actual and expected states recorded on the error

### Requirement: Snapshot and restore

`domain.snapshot()` SHALL return `{ state, context, historyLength }`. `domain.restore(snapshot)` SHALL replace the Domain's state and context with the snapshot's values and SHALL NOT replay any history events.

#### Scenario: Restore returns the Domain to a captured state

- **WHEN** a snapshot is captured, the Domain transitions, and `restore(snapshot)` is called
- **THEN** `domain.state` and `domain.context` SHALL match the snapshot exactly

### Requirement: Subscriptions

`domain.subscribe(listener)` SHALL register a listener that is invoked with the Domain's current snapshot after each successful `follow`. It SHALL return an unsubscribe function. Listener exceptions SHALL NOT halt the Domain; they SHALL be reported via the configured error sink (if any) and other listeners SHALL still be notified.

#### Scenario: Listener receives snapshot after transition

- **WHEN** a listener is subscribed and `follow('SUBMIT')` succeeds
- **THEN** the listener SHALL be invoked exactly once with the post-transition snapshot

#### Scenario: Listener throwing does not break subsequent listeners

- **WHEN** two listeners are subscribed and the first throws
- **THEN** the second listener SHALL still be invoked and the Domain's state SHALL still be the post-transition value

### Requirement: History tracking

`domain.history()` SHALL return the chronological array of `DomainHistoryEntry` records, one per successful `follow`, each containing `from`, `to`, `event`, optional `payload`, post-transition `context`, `timestamp`, and `traceId`.

#### Scenario: History records each successful transition

- **WHEN** three successful `follow` calls have occurred
- **THEN** `domain.history()` SHALL return three entries in the order they occurred

### Requirement: Terminal states

A state declared with `terminal: true` SHALL accept no outgoing edges. `follow` against a terminal state SHALL return `status: 'ignored'` in non-strict mode or throw `UNKNOWN_EVENT` in strict mode.

#### Scenario: Terminal state ignores follow in non-strict mode

- **WHEN** the Domain is in a terminal state with `strict: false` and `follow('ANY_EVENT')` is called
- **THEN** the result SHALL be `status: 'ignored'` and the state SHALL remain terminal
