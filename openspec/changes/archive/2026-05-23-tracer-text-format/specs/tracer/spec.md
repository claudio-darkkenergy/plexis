## MODIFIED Requirements

### Requirement: Export formats

The Tracer SHALL support `export('json')`, `export('text')`, and `export('tree')`. `'json'` SHALL return the raw event array. `'text'` SHALL return a flat human-readable timeline where each line has the format `[timestamp] [scope] type` — `scope` being the `domainId` or `pipelineId` of the event, and `type` being the event type string (e.g. `pipeline.started`, `guard.passed`). `'tree'` SHALL return a hierarchical view derived from `parentId`.

#### Scenario: text export uses the concise scope+type format

- **WHEN** a Tracer records events from a pipeline with id `'payment'`
- **THEN** `export('text')` SHALL return a string where each line matches the pattern `[<timestamp>] [payment] <type>` and SHALL NOT include a `level/` prefix or a trailing status word

#### Scenario: text export identifies the emitting scope

- **WHEN** a shared Tracer records events from a domain `'order'` and a pipeline `'payment'`
- **THEN** each line in `export('text')` SHALL carry either `[order]` or `[payment]` so the emitting primitive is unambiguous

#### Scenario: tree export reflects parentId hierarchy

- **WHEN** events with linked `parentId` chains exist (e.g., a sub-pipeline nested inside a fork nested inside an edge)
- **THEN** `export('tree')` SHALL produce a structure in which child events are nested under their parent rather than appearing as siblings
