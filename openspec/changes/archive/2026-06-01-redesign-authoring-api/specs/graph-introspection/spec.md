## MODIFIED Requirements

### Requirement: GraphDescriptor materialized at construction

`describe()` SHALL return a fully materialized `GraphDescriptor` at construction time. Domain flow nodes SHALL use the kind literal `'domain-flow'` (renamed from `'domain-edge'`) in both `GraphNodeKind` and `GraphEdgeKind`. The graph-theory `GraphEdge` type and the `edges: GraphEdge[]` array on the descriptor are unchanged.

#### Scenario: describe returns a populated descriptor

- **WHEN** a Domain with three states and four flows is constructed
- **THEN** `domain.describe()` SHALL return a descriptor with three `nodes` of kind `'domain-state'`, four `edges` of kind `'domain-flow'`, and at least one element in `entryNodes`

#### Scenario: domain-flow replaces domain-edge in graph kinds

- **WHEN** any graph node or graph edge represents a domain-level flow declared via `on(...)`
- **THEN** its `kind` SHALL be `'domain-flow'` and SHALL NOT be `'domain-edge'`, while `'edge-action'`, `'edge-pipeline'`, and `'subpipeline'` kind literals SHALL remain unchanged
