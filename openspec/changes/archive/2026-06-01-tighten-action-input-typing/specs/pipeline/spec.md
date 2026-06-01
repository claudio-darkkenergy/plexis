## RENAMED Requirements

- FROM: `### Requirement: \`action\` inside a \`node\` setup receives \`PipelineActionInput\``
- TO: `### Requirement: \`action\` inside a \`node\` setup receives \`ActionInput\``

## MODIFIED Requirements

### Requirement: `action` inside a `node` setup receives `ActionInput`

Inside a `node` setup function, `action(fn)` SHALL register the node's action handler, and the handler SHALL receive `ActionInput` (`source`, `scope`, `payload`, `traceId`) as its `input` argument. In a `node` scope, `source` SHALL be the node id, `scope` SHALL be the owning `pipelineId`, and `payload` SHALL be the pipeline run input (which MAY be `undefined`, but the field SHALL always be present). The optional final action passed to `terminal(fn)` in a node context SHALL likewise receive `ActionInput`. The `action` export is a single monomorphic registration helper whose handler receives `ActionInput` in every scope — a `node` setup registers a node action, an `on` setup registers a transition action — with no union and no narrowing required at the call site.

#### Scenario: node action receives ActionInput

- **WHEN** a `node('validate-card', () => { action((ctx, input) => ({ seen: input.source })); ... })` setup is used and the pipeline runs to that node
- **THEN** the registered action SHALL run with an `input` carrying `source === 'validate-card'`, `scope` equal to the owning pipeline id, `payload` equal to the run input, and a non-empty `traceId`

#### Scenario: terminal node final action receives ActionInput

- **WHEN** a node is declared with `node('charge', terminal((ctx, input) => ({ at: input.source })))` and the runtime reaches it
- **THEN** the final action SHALL run with an `input` carrying `source === 'charge'` and `scope` equal to the owning pipeline id, and its patch SHALL be merged before the run completes with `status: 'completed'`
