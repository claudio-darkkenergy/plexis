# Docs Patterns Guides Spec

## Requirements

### Requirement: Patterns guides live under `patterns/`

The docs site SHALL contain a `patterns/` directory under `apps/docs/src/content/docs/` holding exactly eleven MDX pages: `custom-merge.mdx`, `composing-pipelines.mdx`, `forks-in-depth.mdx`, `guards-vs-forks.mdx`, `designing-the-state-graph.mdx`, `snapshots-and-restore.mdx`, `type-safe-domains.mdx`, `testing.mdx`, `graph-introspection.mdx`, `reactive-subscriptions.mdx`, and `reusable-factories.mdx`. Each file MUST have Starlight frontmatter with a non-empty `title` and `description`.

#### Scenario: All eleven pattern files exist

- **WHEN** a developer lists `apps/docs/src/content/docs/patterns/`
- **THEN** the directory contains `custom-merge.mdx`, `composing-pipelines.mdx`, `forks-in-depth.mdx`, `guards-vs-forks.mdx`, `designing-the-state-graph.mdx`, `snapshots-and-restore.mdx`, `type-safe-domains.mdx`, `testing.mdx`, `graph-introspection.mdx`, `reactive-subscriptions.mdx`, and `reusable-factories.mdx`
- **AND** each file begins with frontmatter declaring a non-empty `title` and `description`

### Requirement: Each pattern page teaches a single technique with a runnable example

Each pattern page SHALL be framed around one framework-agnostic technique (a thing the reader does) and SHALL open with a complete runnable code example that does not depend on types, variables, or setup defined in another page. Pattern pages SHALL link to Reference for signature-level detail rather than restating parameter/return tables.

#### Scenario: A pattern page is self-contained and example-first

- **WHEN** a developer reads any one pattern page
- **THEN** it focuses on a single technique and includes a complete runnable example that stands alone
- **AND** it links to the relevant reference page for full signatures rather than duplicating them

### Requirement: Custom merge page shows overriding the default shallow merge

`custom-merge.mdx` SHALL show that the default merge is `{ ...prev, ...patch }` and demonstrate supplying a custom `merge` in `DefineDomainOptions`/`DefinePipelineOptions` to handle nested objects, arrays, and key removal.

#### Scenario: Page demonstrates a custom merge function

- **WHEN** a reader inspects `custom-merge.mdx`
- **THEN** it contrasts the default shallow merge with a custom `merge` passed in the definition options
- **AND** it covers at least nested-object or array merge behavior that the default shallow merge does not handle

### Requirement: Composing pipelines page shows sub-pipeline embedding and reuse

`composing-pipelines.mdx` SHALL show building a pipeline from smaller reusable pipelines via sub-pipeline embedding (a fork target that is a Pipeline) and SHALL show the same pipeline attached at more than one site.

#### Scenario: Page demonstrates sub-pipeline composition

- **WHEN** a reader inspects `composing-pipelines.mdx`
- **THEN** it defines a pipeline whose fork target is another Pipeline
- **AND** it shows a reusable pipeline used in more than one place

### Requirement: Forks in depth page documents ordering and the no-match outcome

`forks-in-depth.mdx` SHALL document that `forks` are evaluated in array order with first-match-wins, how to express a default/catch-all fork, and that when no fork matches the pipeline stops at the current node.

#### Scenario: Page covers first-match-wins and no-match

- **WHEN** a reader inspects `forks-in-depth.mdx`
- **THEN** it states forks evaluate in order with the first matching condition winning
- **AND** it shows a default/catch-all fork and explains that no matching fork stops the run at the current node

### Requirement: Guards vs forks page contrasts blocking a transition with routing flow

`guards-vs-forks.mdx` SHALL contrast a domain guard (which blocks a transition with no side effects when false) against a pipeline fork (which routes flow to a target), and SHALL give guidance on which to reach for.

#### Scenario: Page distinguishes guard from fork

- **WHEN** a reader inspects `guards-vs-forks.mdx`
- **THEN** it explains a guard blocks a transition while a fork selects a branch
- **AND** it states when to use each

### Requirement: Designing the state graph page covers initial, terminals, and unreachable states

`designing-the-state-graph.mdx` SHALL cover choosing the `initial` state, marking terminal states, and avoiding unreachable states, including what strict mode rejects.

#### Scenario: Page covers graph design mechanics

- **WHEN** a reader inspects `designing-the-state-graph.mdx`
- **THEN** it shows choosing `initial`, declaring terminal states, and identifying unreachable states
- **AND** it notes how strict mode surfaces invalid graphs

### Requirement: Snapshots and restore page documents serialization mechanics

`snapshots-and-restore.mdx` SHALL document taking a snapshot and restoring from it, what is and is not serializable (functions are not), and the version-skew concern when restoring into a changed graph. The full database round-trip SHALL be deferred to the Advanced persist-and-rehydrate page.

#### Scenario: Page covers snapshot/restore mechanics and limits

- **WHEN** a reader inspects `snapshots-and-restore.mdx`
- **THEN** it shows taking and restoring a snapshot and states that handler functions are not serialized
- **AND** it notes version-skew risk and links to the Advanced persist-and-rehydrate page for the full round-trip

### Requirement: Type-safe domains page shows `as const` and typed events

`type-safe-domains.mdx` SHALL show using `as const` on the returned config to obtain typed `follow()` and `can()`, and SHALL demonstrate that an unknown event type is a TypeScript error.

#### Scenario: Page demonstrates typed follow

- **WHEN** a reader inspects `type-safe-domains.mdx`
- **THEN** it uses `as const` and shows that a valid event type type-checks while an unknown one is rejected by TypeScript

### Requirement: Testing page shows deterministic testing of domains and pipelines

`testing.mdx` SHALL show testing techniques including `followFrom` to start from an arbitrary state, asserting on `history()`, and exercising forks in isolation.

#### Scenario: Page demonstrates testing seams

- **WHEN** a reader inspects `testing.mdx`
- **THEN** it shows `followFrom` to start from a chosen state and asserts on recorded history
- **AND** it shows verifying that a given context routes through the expected fork

### Requirement: Graph introspection page documents the graph API and path queries

`graph-introspection.mdx` SHALL document reading `domain.graph`/`pipeline.graph` (the `GraphDescriptor`) and running path queries, deferring rendering/visualization to the Advanced visualizer page.

#### Scenario: Page covers graph introspection and path queries

- **WHEN** a reader inspects `graph-introspection.mdx`
- **THEN** it reads the graph descriptor and runs a path query
- **AND** it links to the Advanced visualizer page for rendering the graph

### Requirement: Reactive subscriptions page documents the subscription model

`reactive-subscriptions.mdx` SHALL document subscribing with `domain.subscribe`, reading the current snapshot, and cleaning up via the returned unsubscribe function, framed framework-agnostically.

#### Scenario: Page demonstrates subscribe and unsubscribe

- **WHEN** a reader inspects `reactive-subscriptions.mdx`
- **THEN** it subscribes to domain changes and reads the snapshot inside the callback
- **AND** it calls the returned unsubscribe function to stop receiving updates

### Requirement: Reusable factories page shows parameterized definitions

`reusable-factories.mdx` SHALL show wrapping `defineDomain`/`definePipeline` in a function that returns a configured definition, so a definition can be parameterized and reused.

#### Scenario: Page demonstrates a definition factory

- **WHEN** a reader inspects `reusable-factories.mdx`
- **THEN** it defines a function that takes parameters and returns a domain or pipeline definition
- **AND** it shows that factory producing more than one configured instance

### Requirement: Patterns sidebar group is ordered between Guides and Advanced

The Starlight sidebar in `apps/docs/astro.config.mjs` SHALL include a `Patterns` group whose array position is after the `Guides` group and before the `Advanced` group. The group MUST link to all eleven pattern slugs under `patterns/`.

#### Scenario: Patterns group is positioned between Guides and Advanced

- **WHEN** a developer reads the `sidebar` array in `apps/docs/astro.config.mjs`
- **THEN** an item with `label: 'Patterns'` appears at an index greater than the `Guides` group and less than the `Advanced` group

#### Scenario: Patterns group links all eleven pages

- **WHEN** a visitor views any docs page
- **THEN** the sidebar `Patterns` section displays links to all eleven pattern pages

### Requirement: Patterns pages use only long-form code fence languages

Every fenced code block across the pattern pages SHALL use a long-form language identifier — only `typescript` or `bash` — consistent with the rest of the docs site.

#### Scenario: No short-alias or other-language fences

- **WHEN** a developer reads any pattern MDX file
- **THEN** every opening code fence is either ` ```typescript ` or ` ```bash `
- **AND** no fence uses `ts`, `sh`, `jsx`, `tsx`, or any other identifier
