# Docs Advanced Guides Spec

## Requirements

### Requirement: Advanced guides live under `guides/advanced/`

The docs site SHALL contain an `advanced/` subdirectory under `apps/docs/src/content/docs/guides/` holding exactly five MDX guides: `api-route.mdx`, `multi-step-form.mdx`, `saga.mdx`, `persist-and-rehydrate.mdx`, and `state-graph-visualizer.mdx`. The Advanced bucket SHALL hold only framework-neutral, multi-primitive worked examples whose subject is a scenario to build; framework-specific guides (React, Vue) live under `guides/integrations/`. Each file MUST have Starlight frontmatter with a `title` and a `description`.

#### Scenario: All five advanced guide files exist

- **WHEN** a developer lists `apps/docs/src/content/docs/guides/advanced/`
- **THEN** the directory contains `api-route.mdx`, `multi-step-form.mdx`, `saga.mdx`, `persist-and-rehydrate.mdx`, and `state-graph-visualizer.mdx`
- **AND** the directory does not contain `react.mdx` or `vue.mdx`
- **AND** each file begins with frontmatter declaring a non-empty `title` and `description`

#### Scenario: Each guide is self-contained

- **WHEN** a developer reads any one advanced guide
- **THEN** that guide includes a complete runnable code example that does not depend on types, variables, or setup defined in another guide

### Requirement: Advanced sidebar section is ordered between Patterns and Integrations

The Starlight sidebar in `apps/docs/astro.config.mjs` SHALL include an `Advanced` group whose array position is after the `Patterns` group and before the `Integrations` group. The group MUST link to all five advanced guide slugs: `guides/advanced/api-route`, `guides/advanced/multi-step-form`, `guides/advanced/saga`, `guides/advanced/persist-and-rehydrate`, and `guides/advanced/state-graph-visualizer`.

#### Scenario: Advanced group is positioned between Patterns and Integrations

- **WHEN** a developer reads the `sidebar` array in `apps/docs/astro.config.mjs`
- **THEN** an item with `label: 'Advanced'` appears at an index greater than the `Patterns` group and less than the `Integrations` group

#### Scenario: Advanced group links all five guides

- **WHEN** a visitor views any docs page
- **THEN** the sidebar `Advanced` section displays links to the API Route, Multi-step Form, Saga, Persist & Rehydrate, and State-graph Visualizer guides

### Requirement: API Route guide demonstrates a pipeline as an HTTP handler chain

`api-route.mdx` SHALL present a single HTTP endpoint whose handler is a Plexis pipeline with a node chain of request validation → service/business logic → database write → response. The guide SHALL use forks to model success and error paths, and SHALL include a domain that tracks request state through `pending → processing` and on to `complete` or `failed`. The runtime SHALL be framework-agnostic, demonstrated with the Node.js `http` module (with a note that the same pipeline plugs into any framework handler).

#### Scenario: Handler pipeline has the four-node chain

- **WHEN** a reader inspects the pipeline definition in `api-route.mdx`
- **THEN** it defines nodes for request validation, service/business logic, database write, and response
- **AND** forks route a failed validation or service step to an error-response path

#### Scenario: Request domain tracks lifecycle states

- **WHEN** a reader inspects the domain definition in `api-route.mdx`
- **THEN** the domain models a `pending` initial state, a `processing` state, and terminal `complete` and `failed` states

#### Scenario: Example is runnable on the Node.js http module

- **WHEN** a reader copies the code example
- **THEN** it starts an HTTP server using Node's built-in `http` module and routes a request through the pipeline without requiring an external web framework

### Requirement: Multi-step Form guide demonstrates domain-driven steps gated by a validation pipeline

`multi-step-form.mdx` SHALL present a checkout-style form where a domain drives which step is visible across `shipping → payment → review → confirmed`, and a pipeline validates each step's data before the transition is allowed. The guide SHALL show that invalid step data prevents the transition (the domain stays on the current step).

#### Scenario: Domain models the four checkout steps

- **WHEN** a reader inspects the domain in `multi-step-form.mdx`
- **THEN** it defines states `shipping`, `payment`, `review`, and `confirmed` with forward transitions in that order

#### Scenario: Validation pipeline gates a forward transition

- **WHEN** a reader inspects how a step advances
- **THEN** a pipeline (or guard backed by pipeline-validated context) determines whether the transition proceeds
- **AND** invalid step data results in the transition being blocked and the domain remaining on the current step

### Requirement: Saga guide demonstrates compensation and retry across a pipeline

`saga.mdx` SHALL present a multi-step workflow where a later step's failure triggers compensating actions for already-completed steps, and SHALL show retrying a transient failure. The guide SHALL model the compensation and retry routing with forks and terminal nodes.

#### Scenario: Failure routes to compensating steps

- **WHEN** a reader inspects the pipeline in `saga.mdx`
- **THEN** a step failure forks to compensating actions that undo prior completed steps
- **AND** the workflow ends at a terminal node representing the compensated/aborted outcome

#### Scenario: Transient failure is retried

- **WHEN** a reader inspects the retry handling in `saga.mdx`
- **THEN** a transient failure routes back to re-attempt the step before giving up

### Requirement: Persist and rehydrate guide demonstrates the snapshot round-trip across invocations

`persist-and-rehydrate.mdx` SHALL present saving a domain snapshot to an external store and restoring it on a later invocation, framed by the statelessness of serverless/edge runtimes (the domain does not survive in memory between requests). The guide SHALL build on the Patterns snapshots-and-restore mechanics rather than re-teaching them.

#### Scenario: Domain is snapshotted to a store and rehydrated

- **WHEN** a reader inspects `persist-and-rehydrate.mdx`
- **THEN** it serializes a domain snapshot to an external store and reconstructs the domain from that snapshot on a subsequent request
- **AND** it frames the motivation as stateless serverless/edge execution

### Requirement: State-graph visualizer guide renders a GraphDescriptor to a diagram

`state-graph-visualizer.mdx` SHALL present reading `domain.graph`/`pipeline.graph` and transforming the `GraphDescriptor` into a rendered diagram format (such as Mermaid or DOT). The guide SHALL build on the Patterns graph-introspection page rather than re-teaching the graph API.

#### Scenario: GraphDescriptor is transformed into a diagram

- **WHEN** a reader inspects `state-graph-visualizer.mdx`
- **THEN** it reads the graph descriptor and emits a diagram representation (e.g., Mermaid or DOT) of the states/nodes and transitions

### Requirement: Advanced guides use only long-form code fence languages

Every fenced code block across the advanced guides SHALL use a long-form language identifier — only `typescript` or `bash` — consistent with the rest of the docs site.

#### Scenario: No short-alias or other-language fences

- **WHEN** a developer reads any advanced guide MDX file
- **THEN** every opening code fence is either ` ```typescript ` or ` ```bash `
- **AND** no fence uses `ts`, `sh`, `jsx`, `tsx`, `vue`, or any other identifier
