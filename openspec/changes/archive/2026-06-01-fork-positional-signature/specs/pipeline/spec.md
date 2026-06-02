## MODIFIED Requirements

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
