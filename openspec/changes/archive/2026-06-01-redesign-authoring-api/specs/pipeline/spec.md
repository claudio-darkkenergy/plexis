## ADDED Requirements

### Requirement: Imperative pipeline authoring with `node`, `action`, and `fork`

Nodes SHALL be declared inside a `definePipeline` setup function using `node(id, fn | terminal(fn?))`. When the second argument is a synchronous setup function, that function MAY call the scoped helpers `action(fn)` to register the node's action handler and `fork(condition, target, opts?)` to register conditional fork branches in declaration order. When the second argument is the value returned by `terminal(fn?)`, the node SHALL be registered as terminal, optionally carrying a final action `fn` and never declaring forks. There SHALL be no `forks: []` array key and no `action` object key.

#### Scenario: Setup function registers nodes via `node`, `action`, `fork`

- **WHEN** a `setup` function calls `node('validate-card', () => { action(async (ctx) => ({ ok: true })); fork((ctx) => ctx.ok, 'charge'); fork((ctx) => !ctx.ok, 'decline'); })`, `node('charge', terminal())`, `node('decline', terminal())`, then returns `{ initial: 'validate-card' }`
- **THEN** the resulting Pipeline SHALL have three registered nodes in `describe()`, two forks declared on `'validate-card'` in declaration order, and `'charge'` and `'decline'` flagged as terminal

#### Scenario: Terminal node carries an optional final action

- **WHEN** a node is declared with `node('charge', terminal(async (ctx) => ({ charged: true })))`
- **THEN** `'charge'` SHALL be terminal, its final action SHALL run when the node is reached, and the action's patch SHALL be merged into the run context

#### Scenario: `action` or `fork` called outside an active `node` throw BUILDER_CLOSED

- **WHEN** `action(fn)` or `fork(cond, 'x')` is called directly in the `definePipeline` body (not inside a `node` setup) or outside any setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

#### Scenario: `terminal()` is a scope-independent sentinel

- **WHEN** `terminal()` is invoked outside any active builder scope and its result is passed as the second argument to `node('decline', terminal())`
- **THEN** `terminal()` SHALL NOT throw `BUILDER_CLOSED`, and `'decline'` SHALL be registered as a terminal node

## MODIFIED Requirements

### Requirement: Composable Pipeline construction with class equivalence

The library SHALL expose `definePipeline(id, setup, options?)` and an equivalent `Pipeline` class constructor. The `setup` function SHALL run synchronously at definition time, registering nodes via `node` and their behavior via the scoped `action`/`fork` helpers. Calling scope-sensitive helpers outside an active setup scope SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`.

#### Scenario: definePipeline and new Pipeline produce identical instances

- **WHEN** a caller constructs a Pipeline with `definePipeline('payment', setup, options)` and a second Pipeline with `new Pipeline('payment', setup, options)` using the same setup function and options
- **THEN** both instances SHALL produce identical `describe()` graph descriptors and identical `PipelineRunResult` values for the same input

#### Scenario: Setup function registers nodes via helpers

- **WHEN** a `setup` function calls `node('validate-card', () => { action(fn); fork(cond, 'charge'); fork(undefined, 'decline'); })`, `node('charge', terminal())`, `node('decline', terminal())`, then returns `{ initial: 'validate-card' }`
- **THEN** the resulting Pipeline SHALL have three registered nodes in `describe()`, two forks declared on `'validate-card'`, and `'charge'` and `'decline'` flagged as terminal

#### Scenario: Pipeline helpers called outside setup throw BUILDER_CLOSED

- **WHEN** a caller invokes `node('orphan', terminal())` outside any active `definePipeline` or `new Pipeline` setup scope
- **THEN** the call SHALL throw `PlexisError` with `code === 'BUILDER_CLOSED'`

### Requirement: Terminal nodes complete the run

A node declared with `terminal(fn?)` SHALL end execution when reached. Any final action carried by `terminal(fn)` SHALL run and its patch SHALL be merged before the run completes.

#### Scenario: Terminal node ends execution

- **WHEN** the runtime reaches a node declared with `terminal()`
- **THEN** the run SHALL stop with `status: 'completed'` and `finalNode` equal to that node's id

#### Scenario: Terminal node final action runs before completion

- **WHEN** the runtime reaches a node declared with `terminal(async (ctx) => ({ done: true }))`
- **THEN** the final action SHALL run, its patch SHALL be merged into the run context, and the run SHALL stop with `status: 'completed'`
