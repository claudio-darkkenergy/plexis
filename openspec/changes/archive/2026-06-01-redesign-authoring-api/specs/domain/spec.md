## ADDED Requirements

### Requirement: Imperative domain authoring with `when`, `enter`, `exit`, and `on`

States SHALL be declared inside a `defineDomain` setup function using `when(id, fn | terminal())`. When the second argument is a synchronous setup function, that function MAY call the scoped helpers `enter(fn)`, `exit(fn)`, and `on(event, def)` to register the state's entry hook, exit hook, and event handlers respectively. When the second argument is the value returned by `terminal()`, the state SHALL be registered as terminal with no further behavior. There SHALL be no `state` helper, no standalone `edge` helper, no `edges: {}` object key, and no `onEnter`/`onExit` keys.

#### Scenario: Setup function registers states via `when`, `on`, `enter`, `exit`

- **WHEN** a `setup` function calls `when('pending', () => { on('SUBMIT', { target: 'processing' }); })` and `when('processing', terminal())`, then returns `{ context: {}, initial: 'pending' }`
- **THEN** the resulting Domain SHALL have `state === 'pending'`, two registered states in `describe()`, one declared flow from `'pending'` to `'processing'` on event `'SUBMIT'`, and `'processing'` flagged terminal

#### Scenario: `enter` and `exit` register lifecycle hooks scoped to the state

- **WHEN** a `when('active', () => { enter((ctx) => ({ entered: true })); exit((ctx) => ({ left: true })); on('STOP', { target: 'active' }); })` setup is used
- **THEN** the built state SHALL carry the entry hook, the exit hook, and the `STOP` handler

#### Scenario: Scoped helpers called outside an active `when` throw BUILDER_CLOSED

- **WHEN** `on('SUBMIT', { target: 'x' })`, `enter(fn)`, or `exit(fn)` is called directly in the `defineDomain` body (not inside a `when` setup) or outside any setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: `terminal()` is a scope-independent sentinel

- **WHEN** `terminal()` is invoked outside any active builder scope and its result is later passed as the second argument to `when('done', terminal())`
- **THEN** `terminal()` SHALL NOT throw `BUILDER_CLOSED`, and `'done'` SHALL be registered as a terminal state

### Requirement: Guard evaluation blocks flow traversal

A guard declared on a flow via `on(event, { target, guard })` SHALL be evaluated before any side effects. A guard that returns a falsy value SHALL block traversal with no observable side effects.

#### Scenario: Failing guard blocks the transition

- **WHEN** a flow's guard returns `false`
- **THEN** the `follow` result SHALL have `status: 'blocked'`, `to` SHALL be omitted, and no side effects from `exit`, the flow action, the flow pipeline, `enter`, or the state entry pipeline SHALL be observable

### Requirement: Documented execution order on flow traversal

On a successful `follow`, patches SHALL be merged in the documented order: `exit` (current state), flow action, flow pipeline, `enter` (target state), state entry pipeline.

#### Scenario: Patches are applied in declared order

- **WHEN** `exit` returns `{ a: 1 }`, the flow action returns `{ b: 2 }`, the flow pipeline produces `{ c: 3 }`, `enter` returns `{ a: 9 }`, and the state entry pipeline produces `{ d: 4 }`
- **THEN** the resulting context SHALL contain `{ a: 9, b: 2, c: 3, d: 4 }` reflecting the documented merge order

### Requirement: Lifecycle hooks `enter` and `exit`

States MAY declare entry and exit hooks via `enter(fn)` and `exit(fn)` inside their `when` setup. The `enter` hook of the initial state SHALL run once at construction.

#### Scenario: enter runs on initial state at construction

- **WHEN** a Domain is constructed with `initial: 'pending'` and `'pending'` declares an `enter` hook
- **THEN** the `enter` hook SHALL be invoked once at construction time and any returned patch SHALL be merged into the initial context

## MODIFIED Requirements

### Requirement: Composable Domain construction with class equivalence

The library SHALL expose `defineDomain(id, setup, options?)` and an equivalent `Domain` class constructor. The `setup` function SHALL run synchronously at definition time, registering states via `when` and event handlers via `on`. Calling scope-sensitive helpers outside an active setup scope SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`.

#### Scenario: defineDomain and new Domain produce identical instances

- **WHEN** a caller constructs a Domain with `defineDomain('order', setup, options)` and a second Domain with `new Domain('order', setup, options)` using the same setup function and options
- **THEN** both instances SHALL produce identical `describe()` graph descriptors and identical state/context after the same sequence of `follow()` calls

#### Scenario: Setup function registers states via helpers

- **WHEN** a `setup` function calls `when('pending', () => { on('SUBMIT', { target: 'processing' }); })` and `when('processing', terminal())`, then returns `{ context: {}, initial: 'pending' }`
- **THEN** the resulting Domain SHALL have `state === 'pending'`, two registered states in `describe()`, and one declared flow from `'pending'` to `'processing'` on event `'SUBMIT'`

#### Scenario: Helpers called outside setup throw BUILDER_CLOSED

- **WHEN** a caller invokes `when('orphan', () => {})` outside any active `defineDomain` or `new Domain` setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: Helpers called after setup returns throw BUILDER_CLOSED

- **WHEN** a `setup` function captures a reference and after returning calls `when('late', () => {})` from an async callback
- **THEN** the deferred call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` and SHALL NOT modify the already-sealed Domain

### Requirement: State transitions via `follow`

The current state SHALL declare an outgoing flow for an event via `on(event, { target, ... })`. `follow(event, payload)` SHALL traverse the matching flow when no guard is present or the guard passes.

#### Scenario: Successful event follows the matching flow

- **WHEN** the current state has a flow declared for `event` with no guard or a passing guard
- **THEN** `follow(event, payload)` SHALL return `status: 'followed'` with `to` equal to the flow's target and the Domain's `state` SHALL be updated to that target

#### Scenario: Unknown event in non-strict mode is ignored

- **WHEN** the Domain is constructed with `strict: false` and `follow(unknownEvent)` is called
- **THEN** the result SHALL have `status: 'ignored'`, the Domain's `state` SHALL be unchanged, and no error SHALL be thrown

### Requirement: `can` introspection

`can(event)` SHALL report whether the current state can follow `event`, evaluating any guard declared on the matching flow.

#### Scenario: can returns false when no matching flow exists

- **WHEN** the current state declares no flow for `event`
- **THEN** `can(event)` SHALL return `false`

#### Scenario: can returns false when the guard rejects

- **WHEN** the current state declares a flow for `event` with a guard that returns `false`
- **THEN** `can(event)` SHALL return `false` and the Domain's state SHALL remain unchanged

## REMOVED Requirements

### Requirement: Guard evaluation blocks edge traversal

**Reason**: Renamed to "Guard evaluation blocks flow traversal" — the domain-transition concept is now authored with `on(...)` and referred to as a flow; the guard semantics are unchanged.
**Migration**: Declare guards via `on(event, { target, guard })` inside a `when` setup; behavior is identical.

### Requirement: Documented execution order on edge traversal

**Reason**: Renamed to "Documented execution order on flow traversal" and re-worded for the new vocabulary (`exit`/flow action/flow pipeline/`enter`); the merge order is unchanged.
**Migration**: No behavioral change — `onExit`→`exit`, edge action→flow action, edge pipeline→flow pipeline, `onEnter`→`enter`.

### Requirement: Lifecycle hooks `onEnter` and `onExit`

**Reason**: Renamed to "Lifecycle hooks `enter` and `exit`" — hooks are now registered with the scoped `enter(fn)`/`exit(fn)` helpers instead of `onEnter`/`onExit` object keys.
**Migration**: Replace `onEnter: fn` with `enter(fn)` and `onExit: fn` with `exit(fn)` inside the `when` setup.
