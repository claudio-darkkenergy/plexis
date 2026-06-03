## ADDED Requirements

### Requirement: `on` is dual-form — `target()` sentinel or setup function

Inside a `when` setup, an event handler SHALL be declared with `on(event, def)` where `def` is either the value returned by `target(id)` (simple form) or a synchronous setup function that returns `target(id)` (setup function form). There SHALL be no `{ target: 'x' }` object form. In the setup function form, the function MAY call the scoped helpers `guard(fn)`, `action(fn)`, and `pipeline(p)` and SHALL return `target(id)` to declare the event's destination phase. A setup function that runs to completion without returning a `target()` value SHALL throw `PlexisError` with `code === 'MISSING_TARGET'`.

#### Scenario: Simple form declares an event with `target()`

- **WHEN** a `when('pending', () => { on('cancel', target('cancelled')); })` setup is used
- **THEN** the built `'pending'` phase SHALL declare an event handler on `'cancel'` whose target is `'cancelled'`, with no guard, action, or pipeline attached

#### Scenario: Setup function form registers guard, action, and pipeline and returns target

- **WHEN** a setup uses `on('submit', () => { guard((ctx, input) => !!input.payload.orderId); action((ctx, input) => ({ orderId: input.payload.orderId })); pipeline(paymentPipeline); return target('processing'); })`
- **THEN** the built event handler on `'submit'` SHALL carry the registered guard, action, and attached `paymentPipeline`, and SHALL target `'processing'`

#### Scenario: `on` called outside an active `when` throws BUILDER_CLOSED

- **WHEN** `on('submit', target('processing'))` is called directly in the `defineDomain` body (not inside a `when` setup) or outside any setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: Setup function that returns no `target()` throws MISSING_TARGET

- **WHEN** a setup uses `on('submit', () => { action(a); /* no return */ })` so the setup function returns `undefined`
- **THEN** the call SHALL throw `PlexisError` with `code === 'MISSING_TARGET'` naming event `'submit'`, and SHALL NOT throw `BUILDER_CLOSED`

### Requirement: `target()` is a scope-independent sentinel

`target(id)` SHALL return a static sentinel value of the shape `{ __type: 'TargetDef', id }`. It SHALL NOT register into any builder scope and SHALL NOT throw `BUILDER_CLOSED` regardless of where it is called.

#### Scenario: `target()` called outside any setup does not throw

- **WHEN** `target('cancelled')` is invoked at module top level with no active builder scope
- **THEN** the call SHALL NOT throw and SHALL return `{ __type: 'TargetDef', id: 'cancelled' }`

#### Scenario: `target()` result is reusable as an `on` argument

- **WHEN** a `target('done')` value is captured and later passed as the second argument to `on('finish', target('done'))` inside a `when` setup
- **THEN** the built event handler SHALL target `'done'`

### Requirement: `guard` and `pipeline` are `on`-scoped helpers

The library SHALL export `guard(fn)` and `pipeline(p)` as top-level helpers active only inside an `on` setup function. `guard(fn)` SHALL register the event's guard predicate; `pipeline(p)` SHALL attach a pipeline to run on the event. Called outside an active `on` setup scope, either helper SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`.

#### Scenario: guard and pipeline register onto the enclosing event

- **WHEN** an `on('submit', () => { guard(g); pipeline(p); return target('processing'); })` setup is used
- **THEN** the built `'submit'` event handler SHALL carry guard `g` and attached pipeline `p`

#### Scenario: guard called outside an `on` setup throws BUILDER_CLOSED

- **WHEN** `guard((ctx) => true)` is called inside a `when` setup but outside any `on` setup, or at module top level
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: pipeline called outside an `on` setup throws BUILDER_CLOSED

- **WHEN** `pipeline(somePipeline)` is called inside a `when` setup but outside any `on` setup, or at module top level
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

### Requirement: `action` scope rules in domain authoring

Inside an `on` setup function, `action(fn)` SHALL register the event's action handler, and the handler SHALL receive `ActionInput` (`source`, `scope`, `payload`, `traceId`) as its `input` argument. In an `on` scope, `source` SHALL be the event name, `scope` SHALL be the originating phase id (the `whenId` in which the `on` was declared), and `payload` SHALL be the event payload (which MAY be `undefined`, but the field SHALL always be present). `action(fn)` called inside a `when` setup but outside any `on` setup SHALL have no valid registration target and SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`.

#### Scenario: action inside `on` registers the event action with ActionInput

- **WHEN** an `on('submit', () => { action((ctx, input) => ({ via: input.source })); return target('processing'); })` setup is declared in phase `'pending'` and the `'submit'` event is later followed with a payload
- **THEN** the registered action SHALL run as the event action and its `input` SHALL carry `source === 'submit'`, `scope === 'pending'`, the `payload`, and a non-empty `traceId`

#### Scenario: action directly inside `when` throws BUILDER_CLOSED

- **WHEN** `action((ctx) => ({}))` is called inside a `when` setup but outside any `on` setup
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

### Requirement: `guard`, `action`, and `pipeline` are single-slot per `on`

Within a single `on` setup function, `guard`, `action`, and `pipeline` SHALL each be callable at most once. A second call to any of them during the same `on` setup SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`, naming the event and the offending helper. This single-slot rule SHALL NOT apply to `fork` inside a `node` setup, which remains repeatable and order-sensitive.

#### Scenario: Duplicate guard in one `on` throws DUPLICATE_REGISTRATION

- **WHEN** an `on('submit', () => { guard(g1); guard(g2); return target('processing'); })` setup is evaluated
- **THEN** the second `guard` call SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`

#### Scenario: Duplicate action in one `on` throws DUPLICATE_REGISTRATION

- **WHEN** an `on('submit', () => { action(a1); action(a2); return target('processing'); })` setup is evaluated
- **THEN** the second `action` call SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`

#### Scenario: Duplicate pipeline in one `on` throws DUPLICATE_REGISTRATION

- **WHEN** an `on('submit', () => { pipeline(p1); pipeline(p2); return target('processing'); })` setup is evaluated
- **THEN** the second `pipeline` call SHALL throw `PlexisError` with `code === 'DUPLICATE_REGISTRATION'`

### Requirement: Imperative domain authoring with `when`, `enter`, `exit`, and `on`

Phases SHALL be declared inside a `defineDomain` setup function using `when(id, fn | terminal())`. When the second argument is a synchronous setup function, that function MAY call the scoped helpers `enter(fn)`, `exit(fn)`, and `on(event, def)` to register the phase's entry hook, exit hook, and event handlers respectively. The `on` handler's `def` SHALL be either a `target(id)` sentinel or a synchronous setup function that returns `target(id)`; there SHALL be no `{ target: 'x' }` object form. When the second argument to `when` is the value returned by `terminal()`, the phase SHALL be registered as terminal with no further behavior. There SHALL be no `state` helper, no standalone `edge` helper, no `edges: {}` object key, and no `onEnter`/`onExit` keys.

#### Scenario: Setup function registers phases via `when`, `on`, `enter`, `exit`

- **WHEN** a `setup` function calls `when('pending', () => { on('submit', target('processing')); })` and `when('processing', terminal())`, then returns `{ context: {}, initial: 'pending' }`
- **THEN** the resulting Domain SHALL have `phase === 'pending'`, two registered phases in `describe()`, one declared event handler from `'pending'` to `'processing'` on event `'submit'`, and `'processing'` flagged terminal

#### Scenario: `enter` and `exit` register lifecycle hooks scoped to the phase

- **WHEN** a `when('active', () => { enter((ctx) => ({ entered: true })); exit((ctx) => ({ left: true })); on('stop', target('active')); })` setup is used
- **THEN** the built phase SHALL carry the entry hook, the exit hook, and the `'stop'` event handler

#### Scenario: Scoped helpers called outside an active `when` throw BUILDER_CLOSED

- **WHEN** `on('submit', target('x'))`, `enter(fn)`, or `exit(fn)` is called directly in the `defineDomain` body (not inside a `when` setup) or outside any setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: `terminal()` is a scope-independent sentinel

- **WHEN** `terminal()` is invoked outside any active builder scope and its result is later passed as the second argument to `when('done', terminal())`
- **THEN** `terminal()` SHALL NOT throw `BUILDER_CLOSED`, and `'done'` SHALL be registered as a terminal phase

### Requirement: Composable Domain construction with class equivalence

The library SHALL expose `defineDomain(id, setup, options?)` and an equivalent `Domain` class constructor. The `setup` function SHALL run synchronously at definition time, registering phases via `when` and event handlers via `on`. Calling scope-sensitive helpers outside an active setup scope SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`.

#### Scenario: defineDomain and new Domain produce identical instances

- **WHEN** a caller constructs a Domain with `defineDomain('order', setup, options)` and a second Domain with `new Domain('order', setup, options)` using the same setup function and options
- **THEN** both instances SHALL produce identical `describe()` graph descriptors and identical phase/context after the same sequence of `follow()` calls

#### Scenario: Setup function registers phases via helpers

- **WHEN** a `setup` function calls `when('pending', () => { on('submit', target('processing')); })` and `when('processing', terminal())`, then returns `{ context: {}, initial: 'pending' }`
- **THEN** the resulting Domain SHALL have `phase === 'pending'`, two registered phases in `describe()`, and one declared event handler from `'pending'` to `'processing'` on event `'submit'`

#### Scenario: Helpers called outside setup throw BUILDER_CLOSED

- **WHEN** a caller invokes `when('orphan', () => {})` outside any active `defineDomain` or `new Domain` setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: Helpers called after setup returns throw BUILDER_CLOSED

- **WHEN** a `setup` function captures a reference and after returning calls `when('late', () => {})` from an async callback
- **THEN** the deferred call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` and SHALL NOT modify the already-sealed Domain

### Requirement: Phase transitions via `follow`

The current phase SHALL declare an outgoing `on` handler for an event via `on(event, target(id))` or `on(event, () => { ...; return target(id); })`. `follow(event, payload)` SHALL traverse the matching `on` handler when no guard is present or the guard passes, moving the domain to the target phase. The Domain's current phase SHALL be exposed as `domain.phase`.

#### Scenario: Successful event follows the matching `on` handler

- **WHEN** the current phase has an `on` handler declared for `event` with no guard or a passing guard
- **THEN** `follow(event, payload)` SHALL return `status: 'followed'` with `to` equal to the handler's target and `domain.phase` SHALL be updated to that target

#### Scenario: Unknown event in non-strict mode is ignored

- **WHEN** the Domain is constructed with `strict: false` and `follow(unknownEvent)` is called
- **THEN** the result SHALL have `status: 'ignored'`, `domain.phase` SHALL be unchanged, and no error SHALL be thrown

### Requirement: Guard evaluation blocks event traversal

A guard declared on an `on` handler via `on(event, () => { guard(fn); return target(id); })` SHALL be evaluated before any side effects. A guard that returns a falsy value SHALL block traversal of the event with no observable side effects.

#### Scenario: Failing guard blocks the event

- **WHEN** an `on` handler's guard returns `false`
- **THEN** the `follow` result SHALL have `status: 'blocked'`, `to` SHALL be omitted, and no side effects from `exit`, the `on` action, the `on` pipeline, `enter`, or the phase entry pipeline SHALL be observable

### Requirement: Documented execution order on event traversal

On a successful `follow`, patches SHALL be merged in the documented order: `exit` (current phase), `on` action, `on` pipeline, `enter` (target phase), phase entry pipeline.

#### Scenario: Patches are applied in declared order

- **WHEN** `exit` returns `{ a: 1 }`, the `on` action returns `{ b: 2 }`, the `on` pipeline produces `{ c: 3 }`, `enter` returns `{ a: 9 }`, and the phase entry pipeline produces `{ d: 4 }`
- **THEN** the resulting context SHALL contain `{ a: 9, b: 2, c: 3, d: 4 }` reflecting the documented merge order

### Requirement: Lifecycle hooks `enter` and `exit`

Phases MAY declare entry and exit hooks via `enter(fn)` and `exit(fn)` inside their `when` setup. The `enter` hook of the initial phase SHALL run once at construction.

#### Scenario: enter runs on initial phase at construction

- **WHEN** a Domain is constructed with `initial: 'pending'` and `'pending'` declares an `enter` hook
- **THEN** the `enter` hook SHALL be invoked once at construction time and any returned patch SHALL be merged into the initial context

### Requirement: `can` introspection

`can(event)` SHALL report whether the current phase can follow `event`, evaluating any guard declared on the matching `on` handler.

#### Scenario: can returns false when no matching event handler exists

- **WHEN** the current phase declares no `on` handler for `event`
- **THEN** `can(event)` SHALL return `false`

#### Scenario: can returns false when the guard rejects

- **WHEN** the current phase declares an `on` handler for `event` with a guard that returns `false`
- **THEN** `can(event)` SHALL return `false` and `domain.phase` SHALL remain unchanged

### Requirement: `followFrom` guards the expected phase

`domain.followFrom(expectedPhase, event, payload?)` SHALL throw `PlexisError` with code `PHASE_MISMATCH` if the Domain's current phase is not equal to `expectedPhase`. Otherwise it SHALL behave identically to `follow(event, payload)`.

#### Scenario: followFrom on the wrong phase throws PHASE_MISMATCH

- **WHEN** the Domain's current phase is `'pending'` and `followFrom('processing', 'complete')` is called
- **THEN** the call SHALL throw `PlexisError` with `code === 'PHASE_MISMATCH'`, `domainId` matching the Domain id, and both the expected and actual phase values recoverable from the error

#### Scenario: followFrom on the matching phase behaves like follow

- **WHEN** `domain.phase` equals `expectedPhase`
- **THEN** `followFrom(expectedPhase, event, payload)` SHALL behave identically to `follow(event, payload)`

### Requirement: Snapshot and restore

`domain.snapshot()` SHALL return `{ phase, context, historyLength }`. `domain.restore(snapshot)` SHALL replace the Domain's phase and context with the snapshot's values and SHALL NOT replay any history events.

#### Scenario: snapshot captures the current phase and context

- **WHEN** `domain.snapshot()` is called
- **THEN** it SHALL return an object whose `phase` equals `domain.phase` and whose `context` equals the current context, plus a numeric `historyLength`

#### Scenario: restore sets phase and context without replaying history

- **WHEN** `domain.restore({ phase, context, historyLength })` is called
- **THEN** `domain.phase` and the context SHALL equal the snapshot's values and no history events SHALL be replayed

### Requirement: Subscriptions

`domain.subscribe(listener)` SHALL register a listener that is invoked with the Domain's current snapshot after each successful `follow`. It SHALL return an unsubscribe function. Listener exceptions SHALL NOT halt the Domain; they SHALL be reported via the configured error sink (if any) and other listeners SHALL still be notified.

#### Scenario: Listener receives snapshot after event

- **WHEN** a listener is subscribed and `follow('submit')` succeeds
- **THEN** the listener SHALL be invoked exactly once with the post-event snapshot

#### Scenario: Listener throwing does not break subsequent listeners

- **WHEN** two listeners are subscribed and the first throws
- **THEN** the second listener SHALL still be invoked and `domain.phase` SHALL still be the post-event value

### Requirement: History tracking

`domain.history()` SHALL return the chronological array of `DomainHistoryEntry` records, one per successful `follow`, each containing `from`, `to`, `event`, optional `payload`, post-event `context`, `timestamp`, and `traceId`.

#### Scenario: History records each successful event

- **WHEN** three successful `follow` calls have occurred
- **THEN** `domain.history()` SHALL return three entries in the order they occurred

### Requirement: Terminal phases

A phase declared with `terminal: true` SHALL accept no outgoing event handlers. `follow` against a terminal phase SHALL return `status: 'ignored'` in non-strict mode or throw `UNKNOWN_EVENT` in strict mode.

#### Scenario: Terminal phase ignores follow in non-strict mode

- **WHEN** the Domain is in a terminal phase with `strict: false` and `follow('anyEvent')` is called
- **THEN** the result SHALL be `status: 'ignored'` and the phase SHALL remain terminal
