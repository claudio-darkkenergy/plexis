## RENAMED Requirements

- FROM: `### Requirement: State transitions via \`follow\``
- TO: `### Requirement: Phase transitions via \`follow\``

- FROM: `### Requirement: Guard evaluation blocks flow traversal`
- TO: `### Requirement: Guard evaluation blocks event traversal`

- FROM: `### Requirement: Documented execution order on flow traversal`
- TO: `### Requirement: Documented execution order on event traversal`

- FROM: `### Requirement: \`followFrom\` asserts current state`
- TO: `### Requirement: \`followFrom\` guards the expected phase`

## MODIFIED Requirements

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

### Requirement: Snapshot and restore

`domain.snapshot()` SHALL return `{ phase, context, historyLength }`. `domain.restore(snapshot)` SHALL replace the Domain's phase and context with the snapshot's values and SHALL NOT replay any history events.

#### Scenario: snapshot captures the current phase and context

- **WHEN** `domain.snapshot()` is called
- **THEN** it SHALL return an object whose `phase` equals `domain.phase` and whose `context` equals the current context, plus a numeric `historyLength`

#### Scenario: restore sets phase and context without replaying history

- **WHEN** `domain.restore({ phase, context, historyLength })` is called
- **THEN** `domain.phase` and the context SHALL equal the snapshot's values and no history events SHALL be replayed

### Requirement: `followFrom` guards the expected phase

`domain.followFrom(expectedPhase, event, payload?)` SHALL throw `PlexisError` with code `PHASE_MISMATCH` if the Domain's current phase is not equal to `expectedPhase`. Otherwise it SHALL behave identically to `follow(event, payload)`.

#### Scenario: followFrom on the wrong phase throws PHASE_MISMATCH

- **WHEN** `domain.phase` is `'pending'` and `followFrom('processing', 'complete')` is called
- **THEN** the call SHALL throw `PlexisError` with `code === 'PHASE_MISMATCH'`

#### Scenario: followFrom on the matching phase behaves like follow

- **WHEN** `domain.phase` equals `expectedPhase`
- **THEN** `followFrom(expectedPhase, event, payload)` SHALL behave identically to `follow(event, payload)`
