## ADDED Requirements

### Requirement: Default merge is shallow object spread

Unless overridden, the runtime SHALL merge a returned patch into context as `next = { ...previous, ...patch }`. The previous context SHALL NOT be mutated; a new object reference SHALL be produced for every merge.

#### Scenario: Patch overrides matching keys and preserves the rest

- **WHEN** the previous context is `{ a: 1, b: 2 }` and a handler returns `{ b: 9, c: 3 }`
- **THEN** the next context SHALL be `{ a: 1, b: 9, c: 3 }` and the previous context object reference SHALL still equal `{ a: 1, b: 2 }`

### Requirement: `void`, `null`, and `undefined` patches are no-ops

When a handler returns `void`, `null`, or `undefined`, the runtime SHALL skip the merge step entirely. The context reference SHALL be the same as before the handler ran.

#### Scenario: Handler returning undefined leaves context unchanged

- **WHEN** an action returns `undefined`
- **THEN** the context after the action SHALL be reference-equal to the context before the action

### Requirement: Custom merge function with metadata

Both `Domain` and `Pipeline` SHALL accept an optional `merge(previous, patch, metadata)` option. When provided, the runtime SHALL invoke this function in place of the default shallow spread. The `metadata` argument SHALL be a `MergeMetadata` object containing at minimum the `phase` of the merge and the relevant `domainId`, `pipelineId`, `nodeId`, `stateId`, or `event` identifiers for that phase.

#### Scenario: Custom merge receives identifying metadata

- **WHEN** a Pipeline is constructed with a `merge` option and a node action's patch is being merged
- **THEN** the custom `merge` function SHALL be invoked with `metadata.phase` identifying the merge phase, `metadata.pipelineId` equal to the pipeline id, and `metadata.nodeId` equal to the current node id

#### Scenario: Custom merge result replaces default behavior

- **WHEN** a custom `merge` returns `{ deepMerged: true }` for a given patch
- **THEN** the resulting context SHALL be exactly the value returned by the custom merge with no additional shallow-spread applied

### Requirement: Handlers never receive mutable references to library-owned context

Handlers SHALL receive a context value, but the runtime SHALL never expose its internal storage cell directly. Mutating a handler's `ctx` parameter SHALL NOT change subsequent context unless the mutation is communicated through a returned patch.

#### Scenario: Mutating the handler ctx does not leak into next context

- **WHEN** an action mutates `ctx.foo = 'mutated'` and returns no patch
- **THEN** the context after the action SHALL be reference-equal to the context before the action and SHALL NOT contain `foo: 'mutated'` unless that key was already present
