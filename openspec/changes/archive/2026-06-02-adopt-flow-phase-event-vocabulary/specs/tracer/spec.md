## MODIFIED Requirements

### Requirement: Trace event taxonomy

The Tracer SHALL emit events covering at least nine levels — `domain`, `phase`, `edge`, `pipeline`, `pipeline-node`, `fork`, `action`, `guard`, `condition` — and six statuses — `started`, `completed`, `blocked`, `selected`, `skipped`, `failed`. The `phase` level (renamed from `state`) carries domain phase lifecycle events whose `type` SHALL be `'phase.enter'` / `'phase.exit'` (renamed from `'state.enter'` / `'state.exit'`) and which SHALL identify the phase via a `phaseId` field (renamed from `stateId`). The `edge` level is retained for domain event traversal. Each event SHALL include `id`, `traceId`, `timestamp`, `level`, and `type`. Domain-related events SHALL carry `domainId`; pipeline-related events SHALL carry `pipelineId`.

#### Scenario: A successful follow emits domain, phase, edge, and action events

- **WHEN** a Domain with an event action successfully follows an event
- **THEN** the recorded events SHALL include at least one event at each of the `domain`, `edge`, and `action` levels, all sharing the same `traceId`

#### Scenario: Phase lifecycle events use phase.enter / phase.exit and phaseId

- **WHEN** a successful follow enters and exits domain phases
- **THEN** the recorded `phase`-level events SHALL have `type` `'phase.enter'` or `'phase.exit'` and SHALL carry a `phaseId` field, and SHALL NOT use `'state.enter'`, `'state.exit'`, or `stateId`

#### Scenario: A blocked guard emits a guard event with status 'blocked'

- **WHEN** an event's guard returns `false`
- **THEN** the Tracer SHALL record a `guard`-level event with `status: 'blocked'` and SHALL NOT record any `action`-level event for that event

### Requirement: `parentId` linking across nested operations

When a pipeline is invoked from inside a Domain event or from inside another pipeline (sub-pipeline), the nested operation's events SHALL share the parent's `traceId` and SHALL carry a `parentId` referencing the parent operation's event id, so that the `tree` export can be reconstructed by walking `parentId`.

#### Scenario: Sub-pipeline events link to parent via parentId

- **WHEN** a pipeline node's fork targets a sub-pipeline and the sub-pipeline runs
- **THEN** at least one event from the sub-pipeline SHALL have a `parentId` equal to the id of the parent fork or pipeline-node event, and the `traceId` SHALL match the parent's `traceId`

### Requirement: One traceId per top-level invocation

A single `domain.follow(...)` or top-level `pipeline.run(...)` call SHALL share one `traceId` across all events it produces, including any nested pipeline runs triggered by events, phase pipelines, or sub-pipeline forks.

#### Scenario: Single follow produces single traceId

- **WHEN** a single `follow('submit')` triggers an event action, an event pipeline, and a phase entry pipeline
- **THEN** every event recorded during that follow SHALL share the same `traceId`
