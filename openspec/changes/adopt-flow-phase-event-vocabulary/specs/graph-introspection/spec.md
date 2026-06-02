## MODIFIED Requirements

### Requirement: GraphDescriptor materialized at construction

`describe()` SHALL return a fully materialized `GraphDescriptor` at construction time. Graph nodes that represent a domain phase (a `when`) SHALL use the kind literal `'domain-phase'` (renamed from `'domain-state'`). Graph nodes and graph edges that represent a domain event (an `on`) SHALL use the kind literal `'domain-event'` (renamed from `'domain-flow'`). Phase-scoped attachment and hook kinds SHALL be `'phase-entry-pipeline'`, `'phase-entry-hook'`, and `'phase-exit-hook'` (renamed from the `'state-*'` equivalents). The graph-theory `GraphEdge` type, the `edges: GraphEdge[]` array, and the `'edge-action'` / `'edge-pipeline'` / `'subpipeline'` kind literals are unchanged.

#### Scenario: describe returns a populated descriptor

- **WHEN** a Domain with three phases and four `on` handlers is constructed
- **THEN** `domain.describe()` SHALL return a descriptor with three `nodes` of kind `'domain-phase'`, four `edges` of kind `'domain-event'`, and at least one element in `entryNodes`

#### Scenario: phase/event kinds replace state/flow in graph kinds

- **WHEN** any graph node or graph edge represents a domain phase or a domain event
- **THEN** a phase node's `kind` SHALL be `'domain-phase'` (never `'domain-state'`), an event's `kind` SHALL be `'domain-event'` (never `'domain-flow'` or `'domain-edge'`), and phase pipelines/hooks SHALL use `'phase-entry-pipeline'` / `'phase-entry-hook'` / `'phase-exit-hook'`, while `'edge-action'`, `'edge-pipeline'`, and `'subpipeline'` kind literals SHALL remain unchanged
