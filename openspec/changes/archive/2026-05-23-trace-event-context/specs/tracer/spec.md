## MODIFIED Requirements

### Requirement: Export formats

The Tracer SHALL support `export('json')`, `export('text')`, and `export('tree')`. `'json'` SHALL return the raw event array. `'text'` SHALL return a flat human-readable timeline where each line has the format `[timestamp] [scope] type [event]` — `scope` being the `domainId` or `pipelineId` optionally followed by `/nodeId` or `/stateId`; `type` being the event type string; and `event` being the triggering edge/event name appended as a trailing token when the event object carries an `event` field. `'tree'` SHALL return a hierarchical view derived from `parentId`.

#### Scenario: text export uses the concise scope+type format

- **WHEN** a Tracer records events from a pipeline with id `'payment'`
- **THEN** `export('text')` SHALL return a string where each line matches the pattern `[<timestamp>] [payment] <type>` (or `[payment/<nodeId>]` when a node id is present) and SHALL NOT include a `level/` prefix or a trailing status word

#### Scenario: text export appends event name for domain events

- **WHEN** a Tracer records `guard.started` with `domainId: 'order'`, `stateId: 'pending'`, and `event: 'SUBMIT'`
- **THEN** the corresponding line in `export('text')` SHALL be `[<timestamp>] [order/pending] guard.started SUBMIT`

#### Scenario: text export omits event token for pipeline events

- **WHEN** a Tracer records `pipeline-node.started` with `pipelineId: 'payment'` and `nodeId: 'charge'` and no `event` field
- **THEN** the corresponding line in `export('text')` SHALL be `[<timestamp>] [payment/charge] pipeline-node.started` with no trailing event token

#### Scenario: text export includes node id in scope for pipeline-node events

- **WHEN** a Tracer records `pipeline-node.started` with `pipelineId: 'payment'` and `nodeId: 'validate-card'`
- **THEN** the corresponding line in `export('text')` SHALL be `[<timestamp>] [payment/validate-card] pipeline-node.started`

#### Scenario: text export includes state id in scope for guard events

- **WHEN** a Tracer records `guard.passed` with `domainId: 'order'` and `stateId: 'pending'`
- **THEN** the corresponding line in `export('text')` SHALL be `[<timestamp>] [order/pending] guard.passed`

#### Scenario: text export omits sub-scope for events without nodeId or stateId

- **WHEN** a Tracer records `pipeline.started` with `pipelineId: 'payment'` and no `nodeId`
- **THEN** the corresponding line in `export('text')` SHALL be `[<timestamp>] [payment] pipeline.started` with no `/` separator

#### Scenario: text export identifies the emitting scope

- **WHEN** a shared Tracer records events from a domain `'order'` and a pipeline `'payment'`
- **THEN** each line in `export('text')` SHALL carry either `[order]` or `[payment]` (with optional sub-scope) so the emitting primitive is unambiguous

#### Scenario: tree export reflects parentId hierarchy

- **WHEN** events with linked `parentId` chains exist (e.g., a sub-pipeline nested inside a fork nested inside an edge)
- **THEN** `export('tree')` SHALL produce a structure in which child events are nested under their parent rather than appearing as siblings
