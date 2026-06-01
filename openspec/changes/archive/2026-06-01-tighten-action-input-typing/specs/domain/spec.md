## MODIFIED Requirements

### Requirement: `action` scope rules in domain authoring

Inside an `on` setup function, `action(fn)` SHALL register the transition's action handler, and the handler SHALL receive `ActionInput` (`source`, `scope`, `payload`, `traceId`) as its `input` argument. In an `on` scope, `source` SHALL be the event name, `scope` SHALL be the originating state id (the `whenId` in which the `on` was declared), and `payload` SHALL be the event payload (which MAY be `undefined`, but the field SHALL always be present). `action(fn)` called inside a `when` setup but outside any `on` setup SHALL have no valid registration target and SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`.

#### Scenario: action inside `on` registers the transition action with ActionInput

- **WHEN** an `on('submit', () => { action((ctx, input) => ({ via: input.source })); return target('processing'); })` setup is declared in state `'pending'` and the `'submit'` flow is later followed with a payload
- **THEN** the registered action SHALL run as the flow action and its `input` SHALL carry `source === 'submit'`, `scope === 'pending'`, the `payload`, and a non-empty `traceId`

#### Scenario: action directly inside `when` throws BUILDER_CLOSED

- **WHEN** `action((ctx) => ({}))` is called inside a `when` setup but outside any `on` setup
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`
