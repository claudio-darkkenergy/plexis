## ADDED Requirements

### Requirement: `action` inside a `node` setup receives `ActionInput`

Inside a `node` setup function, `action(fn)` SHALL register the node's action handler, and the handler SHALL receive `ActionInput` (`source`, `scope`, `payload`, `traceId`) as its `input` argument. In a `node` scope, `source` SHALL be the node id, `scope` SHALL be the owning `pipelineId`, and `payload` SHALL be the pipeline run input (which MAY be `undefined`, but the field SHALL always be present). The optional final action passed to `terminal(fn)` in a node context SHALL likewise receive `ActionInput`. The `action` export is a single monomorphic registration helper whose handler receives `ActionInput` in every scope — a `node` setup registers a node action, an `on` setup registers a transition action — with no union and no narrowing required at the call site.

#### Scenario: node action receives ActionInput

- **WHEN** a `node('validate-card', () => { action((ctx, input) => ({ seen: input.source })); ... })` setup is used and the pipeline runs to that node
- **THEN** the registered action SHALL run with an `input` carrying `source === 'validate-card'`, `scope` equal to the owning pipeline id, `payload` equal to the run input, and a non-empty `traceId`

#### Scenario: terminal node final action receives ActionInput

- **WHEN** a node is declared with `node('charge', terminal((ctx, input) => ({ at: input.source })))` and the runtime reaches it
- **THEN** the final action SHALL run with an `input` carrying `source === 'charge'` and `scope` equal to the owning pipeline id, and its patch SHALL be merged before the run completes with `status: 'completed'`

### Requirement: Imperative pipeline authoring with `node`, `action`, and `fork`

Nodes SHALL be declared inside a `definePipeline` setup function using `node(id, fn | terminal(fn?))`. When the second argument is a synchronous setup function, that function MAY call the scoped helpers `action(fn)` to register the node's action handler and `fork(label, target, condition?)` to register conditional fork branches in declaration order. The `fork` helper SHALL take a required `label` string as its first argument, a `target(...)` sentinel as its second argument, and an optional `condition` callback as its last argument. The `target(...)` sentinel SHALL accept either a node-id string or a `Pipeline` instance. A bare string or bare `Pipeline` passed in the target position SHALL be rejected: it is a compile-time type error, and at runtime a non-sentinel target SHALL throw `PlexisError`. When `condition` is omitted, the fork SHALL be unconditional (catch-all). When the second argument to `node` is the value returned by `terminal(fn?)`, the node SHALL be registered as terminal, optionally carrying a final action `fn` and never declaring forks. There SHALL be no `forks: []` array key and no `action` object key.

#### Scenario: Setup function registers nodes via `node`, `action`, `fork`

- **WHEN** a `setup` function calls `node('validate-card', () => { action(async (ctx) => ({ ok: true })); fork('card-ok', target('charge'), (ctx) => ctx.ok); fork('card-invalid', target('decline'), (ctx) => !ctx.ok); })`, `node('charge', terminal())`, `node('decline', terminal())`, then returns `{ initial: 'validate-card' }`
- **THEN** the resulting Pipeline SHALL have three registered nodes in `describe()`, two forks declared on `'validate-card'` in declaration order each carrying its `label`, and `'charge'` and `'decline'` flagged as terminal

#### Scenario: Fork label is required and appears in introspection

- **WHEN** a fork is declared as `fork('card-ok', target('charge'), (ctx) => ctx.ok)`
- **THEN** the resulting `PipelineForkDef` SHALL carry `label === 'card-ok'`, and that label SHALL be the value populated on the corresponding tracer events and graph introspection output

#### Scenario: Fork with omitted condition is an unconditional catch-all

- **WHEN** a fork is declared as `fork('fallback', target('decline'))` with no `condition` argument
- **THEN** the fork SHALL be registered as unconditional and SHALL be treated as unconditionally matching during run evaluation

#### Scenario: Fork target may be a sub-pipeline via `target(...)`

- **WHEN** a fork is declared as `fork('to-review', target(reviewPipeline), (ctx) => ctx.needsReview)` where `reviewPipeline` is a `Pipeline` instance
- **THEN** the fork's internal `target` SHALL be that Pipeline instance and the runtime SHALL embed it identically to a string-targeted fork

#### Scenario: Bare string or Pipeline in the target position is rejected

- **WHEN** a fork is authored as `fork('card-ok', 'charge', (ctx) => ctx.ok)` passing a bare string instead of a `target(...)` sentinel
- **THEN** the call SHALL be a compile-time type error, and a non-sentinel target reaching `fork` at runtime SHALL throw `PlexisError`

#### Scenario: Terminal node carries an optional final action

- **WHEN** a node is declared with `node('charge', terminal(async (ctx) => ({ charged: true })))`
- **THEN** `'charge'` SHALL be terminal, its final action SHALL run when the node is reached, and the action's patch SHALL be merged into the run context

#### Scenario: `action` or `fork` called outside an active `node` throw BUILDER_CLOSED

- **WHEN** `action(fn)` or `fork('x', target('x'), cond)` is called directly in the `definePipeline` body (not inside a `node` setup) or outside any setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: `terminal()` is a scope-independent sentinel

- **WHEN** `terminal()` is invoked outside any active builder scope and its result is passed as the second argument to `node('decline', terminal())`
- **THEN** `terminal()` SHALL NOT throw `BUILDER_CLOSED`, and `'decline'` SHALL be registered as a terminal node

### Requirement: Composable Pipeline construction with class equivalence

The library SHALL expose `definePipeline(id, setup, options?)` and an equivalent `Pipeline` class constructor. The `setup` function SHALL run synchronously at definition time, registering nodes via `node` and their behavior via the scoped `action`/`fork` helpers. The `fork` helper SHALL use the `(label, target, condition?)` argument order with a required `label` and a `target(...)` sentinel target. Calling scope-sensitive helpers outside an active setup scope SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`.

#### Scenario: definePipeline and new Pipeline produce identical instances

- **WHEN** a caller constructs a Pipeline with `definePipeline('payment', setup, options)` and a second Pipeline with `new Pipeline('payment', setup, options)` using the same setup function and options
- **THEN** both instances SHALL produce identical `describe()` graph descriptors and identical `PipelineRunResult` values for the same input

#### Scenario: Setup function registers nodes via helpers

- **WHEN** a `setup` function calls `node('validate-card', () => { action(fn); fork('card-ok', target('charge'), cond); fork('fallback', target('decline')); })`, `node('charge', terminal())`, `node('decline', terminal())`, then returns `{ initial: 'validate-card' }`
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

A node declared with `terminal(fn?)` SHALL end execution when reached. Any final action carried by `terminal(fn)` SHALL run and its patch SHALL be merged before the run completes.

#### Scenario: Terminal node ends execution

- **WHEN** the runtime reaches a node declared with `terminal()`
- **THEN** the run SHALL stop with `status: 'completed'` and `finalNode` equal to that node's id

#### Scenario: Terminal node final action runs before completion

- **WHEN** the runtime reaches a node declared with `terminal(async (ctx) => ({ done: true }))`
- **THEN** the final action SHALL run, its patch SHALL be merged into the run context, and the run SHALL stop with `status: 'completed'`

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
