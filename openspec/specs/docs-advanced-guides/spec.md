## ADDED Requirements

### Requirement: Advanced guides live under `guides/advanced/`

The docs site SHALL contain an `advanced/` subdirectory under `apps/docs/src/content/docs/guides/` holding exactly four MDX guides: `api-route.mdx`, `multi-step-form.mdx`, `react.mdx`, and `vue.mdx`. Each file MUST have Starlight frontmatter with a `title` and a `description`.

#### Scenario: All four advanced guide files exist

- **WHEN** a developer lists `apps/docs/src/content/docs/guides/advanced/`
- **THEN** the directory contains `api-route.mdx`, `multi-step-form.mdx`, `react.mdx`, and `vue.mdx`
- **AND** each file begins with frontmatter declaring a non-empty `title` and `description`

#### Scenario: Each guide is self-contained

- **WHEN** a developer reads any one advanced guide
- **THEN** that guide includes a complete runnable code example that does not depend on types, variables, or setup defined in another guide

### Requirement: Advanced sidebar section is ordered between Guides and Reference

The Starlight sidebar in `apps/docs/astro.config.mjs` SHALL include an `Advanced` group whose array position is after the `Guides` group and before the `Reference` group. The group MUST link to all four advanced guide slugs: `guides/advanced/api-route`, `guides/advanced/multi-step-form`, `guides/advanced/react`, and `guides/advanced/vue`.

#### Scenario: Advanced group is positioned between Guides and Reference

- **WHEN** a developer reads the `sidebar` array in `apps/docs/astro.config.mjs`
- **THEN** an item with `label: 'Advanced'` appears at an index greater than the `Guides` group and less than the `Reference` group

#### Scenario: Advanced group links all four guides

- **WHEN** a visitor views any docs page
- **THEN** the sidebar `Advanced` section displays links to the API Route, Multi-step Form, React, and Vue guides

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

### Requirement: React guide binds a domain via `useSyncExternalStore`

`react.mdx` SHALL show a minimal React binding that connects a Plexis domain to component state using `useSyncExternalStore`, driven by `domain.subscribe` and `domain.snapshot`. The guide SHALL focus on the subscribe/snapshot seam rather than React internals.

#### Scenario: Binding uses subscribe and snapshot

- **WHEN** a reader inspects the React hook in `react.mdx`
- **THEN** it passes `domain.subscribe` as the subscribe argument and `domain.snapshot` (or a wrapper returning the current snapshot) as the getSnapshot argument to `useSyncExternalStore`
- **AND** the component re-renders when the domain transitions

### Requirement: Vue guide binds a domain via a ref and subscribe

`vue.mdx` SHALL show a minimal Vue binding that connects a Plexis domain to a reactive `ref` updated inside a `domain.subscribe` callback, with the unsubscribe function cleaned up on unmount. The guide SHALL focus on the subscribe/snapshot seam rather than Vue internals.

#### Scenario: Binding uses a ref updated by subscribe

- **WHEN** a reader inspects the Vue composable in `vue.mdx`
- **THEN** it initializes a `ref` from `domain.snapshot()` and updates that `ref` inside the `domain.subscribe` callback
- **AND** it calls the returned unsubscribe function on component unmount

### Requirement: Advanced guides use only long-form code fence languages

Every fenced code block across the four advanced guides SHALL use a long-form language identifier — only `typescript` or `bash` — consistent with the rest of the docs site.

#### Scenario: No short-alias or other-language fences

- **WHEN** a developer reads any advanced guide MDX file
- **THEN** every opening code fence is either ` ```typescript ` or ` ```bash `
- **AND** no fence uses `ts`, `sh`, `jsx`, `tsx`, `vue`, or any other identifier
