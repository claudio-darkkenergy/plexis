## ADDED Requirements

### Requirement: Three runnable example files exist in `examples/`

The repository SHALL contain an `examples/` directory with three self-contained TypeScript demo files that run against the source barrel (`src/index.js`) without a prior build step. Each SHALL be executable via an `npm run example:*` script. All three SHALL type-check with `tsc --noEmit` using `examples/tsconfig.json`.

#### Scenario: Each example script exits successfully

- **WHEN** a developer runs `npm run example:order`, `npm run example:payment`, or `npm run example:graph`
- **THEN** each script SHALL complete with exit code 0 and produce readable console output

### Requirement: `order-domain.ts` demonstrates the full domain lifecycle

`examples/order-domain.ts` SHALL showcase `defineDomain`, `definePipeline`, `state`, `edge`, `node`, `fork`, `terminal`, `createTracer`, guard evaluation, edge action, an attached edge pipeline, `onEnter` lifecycle hook, `follow`, `can`, `followFrom`, `snapshot`/`restore`, `history`, and tracer output in `tree` format.

#### Scenario: Order follows SUBMIT and transitions to processing

- **WHEN** the example calls `domain.follow('SUBMIT', { userId: 'u_1' })`
- **THEN** the logged result status SHALL be `'followed'`, the logged state SHALL be `'processing'`, and the context SHALL include `submittedBy` and pipeline-produced fields

#### Scenario: followFrom throws STATE_MISMATCH on wrong state

- **WHEN** the example calls `domain.followFrom('pending', 'SUBMIT')` after already transitioning to `'processing'`
- **THEN** the example SHALL catch a `PlexisError` with `code === 'STATE_MISMATCH'` and log it

#### Scenario: history records each transition

- **WHEN** the order has followed SUBMIT and COMPLETE
- **THEN** `domain.history()` SHALL return two entries and the example SHALL log them

### Requirement: `payment-pipeline.ts` demonstrates pipeline branching and trace export

`examples/payment-pipeline.ts` SHALL showcase `definePipeline`, `node`, `fork`, `terminal`, branching via first-match-wins conditions, `pipeline.run()`, and `pipeline.trace('text')`.

#### Scenario: Valid card follows the charge path

- **WHEN** the example runs the pipeline with a Visa-format card number (starts with `'4'`)
- **THEN** the logged `finalNode` SHALL be `'charge'` and `context.charged` SHALL be `true`

#### Scenario: Invalid card follows the decline path

- **WHEN** the example runs the pipeline with an invalid card number (not starting with `'4'`)
- **THEN** the logged `finalNode` SHALL be `'decline'` and `context.charged` SHALL be `false`

#### Scenario: Trace text output is printed

- **WHEN** the example calls `pipeline.trace('text')`
- **THEN** a non-empty string SHALL be logged to the console

### Requirement: `graph-inspection.ts` demonstrates static introspection APIs

`examples/graph-inspection.ts` SHALL showcase `pipeline.inspectNode()`, `domain.inspectNode()`, `domain.graph.reachableFrom()`, `domain.describe()`, `inbound`/`outbound` edges, `pathsTo`/`pathsFrom`, and cross-boundary ref inspection via a `GraphNodeRef`.

#### Scenario: inspectNode returns inbound and outbound edges

- **WHEN** the example calls `pipeline.inspectNode('fraud-check')`
- **THEN** the logged `inbound` and `outbound` arrays SHALL each contain at least one edge

#### Scenario: reachableFrom excludes the start node

- **WHEN** the example calls `domain.graph.reachableFrom('pending')`
- **THEN** the returned array SHALL NOT include a node with id `'pending'`

#### Scenario: describe() lists attachments for edge pipelines

- **WHEN** the example calls `domain.describe()`
- **THEN** `descriptor.attachments` SHALL contain at least one entry with `kind: 'edge-pipeline'`
