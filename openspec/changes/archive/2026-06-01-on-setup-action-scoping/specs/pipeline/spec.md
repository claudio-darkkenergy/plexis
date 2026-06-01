## ADDED Requirements

### Requirement: `action` inside a `node` setup receives `PipelineActionInput`

Inside a `node` setup function, `action(fn)` SHALL register the node's action handler, and the handler SHALL receive `PipelineActionInput` (`nodeId`, `pipelineId`, `input`, `traceId`) as its `input` argument. The optional final action passed to `terminal(fn)` in a node context SHALL likewise receive `PipelineActionInput`. The same `action` export is scope-routed: in a `node` setup it registers a node action with `PipelineActionInput`; in an `on` setup it registers a transition action with `OnActionInput`.

#### Scenario: node action receives PipelineActionInput

- **WHEN** a `node('validate-card', () => { action((ctx, input) => ({ seen: input.nodeId })); ... })` setup is used and the pipeline runs to that node
- **THEN** the registered action SHALL run with an `input` carrying `nodeId === 'validate-card'`, the owning `pipelineId`, the run `input`, and a `traceId`

#### Scenario: terminal node final action receives PipelineActionInput

- **WHEN** a node is declared with `node('charge', terminal((ctx, input) => ({ at: input.nodeId })))` and the runtime reaches it
- **THEN** the final action SHALL run with an `input` carrying `nodeId === 'charge'` and its patch SHALL be merged before the run completes with `status: 'completed'`
