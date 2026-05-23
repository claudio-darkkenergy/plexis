## ADDED Requirements

### Requirement: Composable Pipeline construction with class equivalence

The system SHALL expose `definePipeline(id, setup, options?)` as the primary authoring API and `new Pipeline(id, setup, options?)` for advanced use (subclassing, explicit instance construction). Both SHALL accept the same arguments, route through a single internal builder (`buildPipeline`), and produce instances satisfying the `Pipeline<TContext>` interface declared in `src/types.ts`. Both SHALL produce identical runtime behavior, identical `GraphDescriptor` output from `describe()`, and identical `PipelineRunResult` values for the same input.

The `setup` function SHALL be synchronous. During its execution, the registration helpers `node()`, `fork()`, and `terminal()` SHALL be callable to register pipeline nodes and forks into the active builder scope. After `setup` returns, the builder SHALL be sealed and SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'` if any registration helper is invoked thereafter.

The `setup` return value SHALL provide the root configuration: `{ initial }`.

#### Scenario: definePipeline and new Pipeline produce identical instances

- **WHEN** a caller constructs a Pipeline with `definePipeline('payment', setup, options)` and a second Pipeline with `new Pipeline('payment', setup, options)` using the same setup function and options
- **THEN** both instances SHALL produce identical `describe()` graph descriptors and identical `PipelineRunResult` values for the same input

#### Scenario: Setup function registers nodes via helpers

- **WHEN** a `setup` function calls `node('validate-card', { action, forks: [fork(cond, 'charge'), fork(undefined, 'decline')] })`, `node('charge', terminal())`, `node('decline', terminal())`, then returns `{ initial: 'validate-card' }`
- **THEN** the resulting Pipeline SHALL have three registered nodes in `describe()`, two forks declared on `'validate-card'`, and `'charge'` and `'decline'` flagged as terminal

#### Scenario: Pipeline helpers called outside setup throw BUILDER_CLOSED

- **WHEN** a caller invokes `node('orphan', terminal())` outside any active `definePipeline` or `new Pipeline` setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

### Requirement: Run starts at `initial` and walks fork targets

`pipeline.run(context, input?)` SHALL begin execution at the node identified by `config.initial`. It SHALL execute the node's action (if any), merge the returned patch into the context, then evaluate the node's `forks` array.

#### Scenario: Initial node executes first

- **WHEN** `pipeline.run({})` is called and `initial` is `'validate-card'` with an action returning `{ valid: true }`
- **THEN** the returned `context` SHALL include `{ valid: true }` and the next evaluated node SHALL be the target of the first matching fork

### Requirement: Forks are evaluated in array order with first-match-wins semantics

For each node, the runtime SHALL evaluate `forks` in the order declared. Each fork's `condition` (if present) SHALL be invoked with the current context and a `PipelineConditionInput`. The first fork whose condition returns or resolves to a truthy value SHALL be selected. A fork without a `condition` SHALL be treated as unconditionally matching.

#### Scenario: First matching condition wins

- **WHEN** a node declares forks `[A?, B?, C]` where A's condition resolves to `false`, B's condition resolves to `true`, and C has no condition
- **THEN** the runtime SHALL follow fork B and SHALL NOT evaluate fork C

#### Scenario: Unconditional fork acts as catch-all

- **WHEN** a node declares forks `[A?, B]` where A's condition resolves to `false` and B has no condition
- **THEN** the runtime SHALL follow fork B

### Requirement: No matching fork ends execution at the current node

If no fork matches at a non-terminal node, execution SHALL stop at the current node. The returned `PipelineRunResult.status` SHALL be `'stopped'` and `finalNode` SHALL be the current node id. No error SHALL be thrown.

#### Scenario: Unmatched conditions produce a stopped result

- **WHEN** a node declares only conditional forks and none of the conditions match
- **THEN** the result SHALL have `status: 'stopped'` and `finalNode` equal to the unmatched node's id

### Requirement: Terminal nodes complete the run

A node declared with `terminal: true` SHALL stop execution after its action runs. The returned `PipelineRunResult.status` SHALL be `'completed'` and `finalNode` SHALL be the terminal node id.

#### Scenario: Terminal node ends execution

- **WHEN** the runtime reaches a node declared with `terminal: true`
- **THEN** the run SHALL stop with `status: 'completed'` and `finalNode` equal to that node's id

### Requirement: Sub-pipeline embedding

A fork's `target` MAY be either a node id (string) or a Pipeline instance. When the target is a Pipeline, the runtime SHALL invoke `target.run(currentContext, input)`, merge the sub-pipeline's returned context into the parent context, and continue from the parent flow.

#### Scenario: Sub-pipeline result merges into parent context

- **WHEN** a fork targets a Pipeline whose run returns `{ context: { charged: true } }`
- **THEN** the parent context SHALL contain `charged: true` after the sub-pipeline completes

### Requirement: Pipeline run result shape

`pipeline.run` SHALL return a `PipelineRunResult` containing `status` (`'completed' | 'stopped' | 'error'`), `pipelineId`, `finalNode`, `context`, `traceId`, `localTrace` (events emitted during this run), and optional `error`.

#### Scenario: Completed run populates all required fields

- **WHEN** a pipeline reaches a terminal node
- **THEN** the result SHALL have `status: 'completed'`, a non-empty `pipelineId`, the terminal node's id as `finalNode`, the final merged `context`, a non-empty `traceId`, and a non-empty `localTrace`

### Requirement: Definition-time validation of node references

At construction, the Pipeline SHALL validate that `config.initial` references an existing node and that every fork's string `target` references an existing node. Failures SHALL throw `PlexisError` with `code` equal to `UNKNOWN_INITIAL_NODE` or `UNKNOWN_TARGET_NODE`.

#### Scenario: Unknown initial node throws at construction

- **WHEN** a Pipeline is constructed with `initial: 'missing'` and no node named `'missing'` is registered
- **THEN** construction SHALL throw `PlexisError` with `code === 'UNKNOWN_INITIAL_NODE'` and `pipelineId` set to the pipeline id

#### Scenario: Unknown fork target throws at construction

- **WHEN** a Pipeline is constructed with a fork whose `target: 'gone'` references no existing node
- **THEN** construction SHALL throw `PlexisError` with `code === 'UNKNOWN_TARGET_NODE'`, `pipelineId` set, and `nodeId` set to the owning node's id
