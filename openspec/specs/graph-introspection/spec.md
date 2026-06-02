## ADDED Requirements

### Requirement: GraphDescriptor materialized at construction

`describe()` SHALL return a fully materialized `GraphDescriptor` at construction time. Domain flow nodes SHALL use the kind literal `'domain-flow'` (renamed from `'domain-edge'`) in both `GraphNodeKind` and `GraphEdgeKind`. The graph-theory `GraphEdge` type and the `edges: GraphEdge[]` array on the descriptor are unchanged.

#### Scenario: describe returns a populated descriptor

- **WHEN** a Domain with three states and four flows is constructed
- **THEN** `domain.describe()` SHALL return a descriptor with three `nodes` of kind `'domain-state'`, four `edges` of kind `'domain-flow'`, and at least one element in `entryNodes`

#### Scenario: domain-flow replaces domain-edge in graph kinds

- **WHEN** any graph node or graph edge represents a domain-level flow declared via `on(...)`
- **THEN** its `kind` SHALL be `'domain-flow'` and SHALL NOT be `'domain-edge'`, while `'edge-action'`, `'edge-pipeline'`, and `'subpipeline'` kind literals SHALL remain unchanged

### Requirement: Node lookup by id

Both `domain.graph.node(id)` and `pipeline.graph.node(id)` SHALL return the `GraphNode` matching the given id if present, or `undefined` otherwise. The returned node SHALL include a `ref` carrying its `GraphNodeKind` and the owning `domainId` or `pipelineId`.

#### Scenario: node returns the matching GraphNode

- **WHEN** `pipeline.graph.node('charge')` is called and `'charge'` is a registered pipeline node
- **THEN** the result SHALL be a `GraphNode` with `id: 'charge'` and `ref.kind === 'pipeline-node'`

#### Scenario: node returns undefined for unknown ids

- **WHEN** `pipeline.graph.node('does-not-exist')` is called
- **THEN** the result SHALL be `undefined`

### Requirement: Inbound and outbound edge queries

`graph.inbound(id)` SHALL return the array of `GraphEdge` records whose `to.nodeId` (or equivalent ref) equals `id`. `graph.outbound(id)` SHALL return the array of `GraphEdge` records whose `from.nodeId` equals `id`. The order SHALL match declaration order.

#### Scenario: outbound returns all edges leaving a node

- **WHEN** a Pipeline node has three forks declared
- **THEN** `pipeline.graph.outbound(nodeId)` SHALL return three edges in the order the forks were declared

### Requirement: Path queries

`graph.pathsTo(id, options?)` SHALL return all simple paths from any entry node to the given id. `graph.pathsFrom(id, options?)` SHALL return all simple paths from the given id to any terminal node. `graph.reachableFrom(id, options?)` SHALL return the set of `GraphNode` values transitively reachable from `id`. Options MAY include `maxDepth`, `includeCycles`, and `direction`.

#### Scenario: pathsTo enumerates ways to reach a node

- **WHEN** a Pipeline has two distinct fork chains both leading to `'charge'`
- **THEN** `pipeline.graph.pathsTo('charge')` SHALL return two `GraphPath` records, each starting at an entry node

#### Scenario: reachableFrom excludes unreachable nodes

- **WHEN** a Pipeline contains a node that no other node forks to
- **THEN** that node SHALL NOT appear in `pipeline.graph.reachableFrom(initial)`

### Requirement: Cross-boundary inspection via GraphNodeRef

`domain.inspectNode(ref)` SHALL accept either a string id (resolved within the Domain) or a full `GraphNodeRef`. When the ref points to a pipeline node attached to the Domain (e.g., `{ kind: 'pipeline-node', pipelineId, nodeId }`), the returned `NodeInspection` SHALL reflect the pipeline node — including its inbound/outbound edges and reachable nodes — even though the call originates from the Domain.

#### Scenario: Domain inspects an attached pipeline node

- **WHEN** a Domain attaches Pipeline `'payment'` to an edge and `domain.inspectNode({ kind: 'pipeline-node', pipelineId: 'payment', nodeId: 'fraud-check' })` is called
- **THEN** the returned `NodeInspection` SHALL include `inbound` and `outbound` edges for `'fraud-check'` from the `'payment'` pipeline's graph

### Requirement: `inspectNode` composes node, paths, and attachments

`inspectNode(id|ref, options?)` SHALL return a `NodeInspection` containing the `node`, its `inbound` and `outbound` edges, `pathsTo` and `pathsFrom`, `reachableNodes`, and `attachedPipelines`. When runtime traces are present, it MAY also include `runtimeStats` (visit count, last-visited timestamp, observed labels, recent trace ids).

#### Scenario: inspectNode bundles graph queries into a single result

- **WHEN** `pipeline.inspectNode('fraud-check')` is called on a node with two inbound and two outbound edges
- **THEN** the result SHALL have `inbound.length === 2`, `outbound.length === 2`, and arrays for `pathsTo` and `pathsFrom` derived from those edges

### Requirement: Attachments declared by composition

`GraphDescriptor.attachments` SHALL list every place where a pipeline is attached to a Domain — including state entry pipelines, state exit hooks (when implemented as pipelines), and edge pipelines — using `GraphAttachment { kind, owner, pipeline }`.

#### Scenario: Edge-attached pipeline appears in attachments

- **WHEN** a Domain edge declares a `pipeline: payment`
- **THEN** `domain.describe().attachments` SHALL contain an entry with `kind: 'edge-pipeline'`, `owner` referencing the edge, and `pipeline` referencing the `'payment'` pipeline
