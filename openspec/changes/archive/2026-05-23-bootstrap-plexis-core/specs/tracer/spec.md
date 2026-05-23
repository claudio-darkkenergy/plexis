## ADDED Requirements

### Requirement: Tracer construction via factory and class

The system SHALL expose both `createTracer(options?)` and `new Tracer(options?)` as construction surfaces. Both SHALL produce instances with identical behavior. Tracer options SHALL include `enabled`, `captureContext` (`false | 'before' | 'after' | 'both'`), `maxEvents`, `clock`, `idFactory`, and `onSubscriberError`.

#### Scenario: Factory and class produce equivalent Tracers

- **WHEN** a Tracer is constructed via `createTracer(opts)` and another via `new Tracer(opts)` with the same options
- **THEN** both SHALL record the same number of events and produce identical `export('json')` output for the same input sequence

### Requirement: Trace event taxonomy

The Tracer SHALL emit events covering at least nine levels — `domain`, `state`, `edge`, `pipeline`, `pipeline-node`, `fork`, `action`, `guard`, `condition` — and six statuses — `started`, `completed`, `blocked`, `selected`, `skipped`, `failed`. Each event SHALL include `id`, `traceId`, `timestamp`, `level`, and `type`. Domain-related events SHALL carry `domainId`; pipeline-related events SHALL carry `pipelineId`.

#### Scenario: A successful follow emits domain, state, edge, and action events

- **WHEN** a Domain with an edge action successfully follows an event
- **THEN** the recorded events SHALL include at least one event at each of the `domain`, `edge`, and `action` levels, all sharing the same `traceId`

#### Scenario: A blocked guard emits a guard event with status 'blocked'

- **WHEN** an edge's guard returns `false`
- **THEN** the Tracer SHALL record a `guard`-level event with `status: 'blocked'` and SHALL NOT record any `action`-level event for that edge

### Requirement: `parentId` linking across nested operations

When a pipeline is invoked from inside a Domain edge or from inside another pipeline (sub-pipeline), the nested operation's events SHALL share the parent's `traceId` and SHALL carry a `parentId` referencing the parent operation's event id, so that the `tree` export can be reconstructed by walking `parentId`.

#### Scenario: Sub-pipeline events link to parent via parentId

- **WHEN** a pipeline node's fork targets a sub-pipeline and the sub-pipeline runs
- **THEN** at least one event from the sub-pipeline SHALL have a `parentId` equal to the id of the parent fork or pipeline-node event, and the `traceId` SHALL match the parent's `traceId`

### Requirement: One traceId per top-level invocation

A single `domain.follow(...)` or top-level `pipeline.run(...)` call SHALL share one `traceId` across all events it produces, including any nested pipeline runs triggered by edges, state pipelines, or sub-pipeline forks.

#### Scenario: Single follow produces single traceId

- **WHEN** a single `follow('SUBMIT')` triggers an edge action, an edge pipeline, and a state entry pipeline
- **THEN** every event recorded during that follow SHALL share the same `traceId`

### Requirement: `captureContext` controls context snapshotting

When `captureContext` is `'before'`, action/guard/condition events SHALL include the pre-handler context. When `'after'`, they SHALL include the post-handler context. When `'both'`, they SHALL include both. When `false` (default), neither SHALL be included.

#### Scenario: captureContext='after' records the post-handler context

- **WHEN** a Tracer is created with `captureContext: 'after'` and an action returns `{ x: 1 }` from initial context `{}`
- **THEN** the recorded `action` event SHALL contain `contextSnapshot` equal to `{ x: 1 }`

### Requirement: `maxEvents` bounds memory usage

When `maxEvents` is set, the Tracer SHALL retain at most that many events. After the limit is reached, subsequent events SHALL be dropped from the retained history; a single boundary record SHALL indicate that events were dropped.

#### Scenario: Exceeding maxEvents drops further events

- **WHEN** a Tracer is created with `maxEvents: 10` and 12 events are recorded
- **THEN** `tracer.history().length` SHALL be at most 10 and the boundary indication SHALL be observable

### Requirement: Export formats

The Tracer SHALL support `export('json')`, `export('text')`, and `export('tree')`. `'json'` SHALL return the raw event array. `'text'` SHALL return a flat human-readable timeline. `'tree'` SHALL return a hierarchical view derived from `parentId`.

#### Scenario: tree export reflects parentId hierarchy

- **WHEN** events with linked `parentId` chains exist (e.g., a sub-pipeline nested inside a fork nested inside an edge)
- **THEN** `export('tree')` SHALL produce a structure in which child events are nested under their parent rather than appearing as siblings

### Requirement: Subscriptions and error handling

`tracer.subscribe(listener)` SHALL register a listener invoked synchronously for every recorded event and SHALL return an unsubscribe function. If a listener throws, the Tracer SHALL invoke `onSubscriberError` (if configured) and SHALL continue recording without halting further subscribers.

#### Scenario: Subscriber error does not halt other subscribers

- **WHEN** two subscribers are registered and the first throws
- **THEN** the second subscriber SHALL still receive the event and the Tracer SHALL still record the event in its history

### Requirement: Lookup by traceId

`tracer.byTraceId(traceId)` SHALL return the array of events sharing that `traceId`, in insertion order. `tracer.traces()` SHALL return the unique set of `traceId` values seen.

#### Scenario: byTraceId returns events for a specific trace

- **WHEN** two distinct `follow()` calls have produced events with traceIds `T1` and `T2`
- **THEN** `tracer.byTraceId('T1')` SHALL return only the events from the first call

### Requirement: Tracer is attachable to Domain and Pipeline

A Tracer instance MAY be passed to `defineDomain`/`new Domain` and `definePipeline`/`new Pipeline` via the `options.tracer` field. Attached primitives SHALL record their events into the provided Tracer. The same Tracer instance MAY be shared across multiple Domains and Pipelines.

#### Scenario: Shared Tracer captures events from multiple primitives

- **WHEN** a single Tracer is attached to two Pipelines and both run
- **THEN** `tracer.history()` SHALL contain events from both pipelines, each carrying its own `pipelineId`
