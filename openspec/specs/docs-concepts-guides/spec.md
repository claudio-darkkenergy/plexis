# Docs Concepts Guides Spec

## Requirements

### Requirement: Concepts guides live under `concepts/`

The docs site SHALL contain a `concepts/` directory under `apps/docs/src/content/docs/` holding exactly four MDX pages: `two-layer-model.mdx`, `context-and-patches.mdx`, `execution-and-lifecycle.mdx`, and `definition-lifecycle.mdx`. Each file MUST have Starlight frontmatter with a non-empty `title` and `description`.

#### Scenario: All four concept files exist

- **WHEN** a developer lists `apps/docs/src/content/docs/concepts/`
- **THEN** the directory contains `two-layer-model.mdx`, `context-and-patches.mdx`, `execution-and-lifecycle.mdx`, and `definition-lifecycle.mdx`
- **AND** each file begins with frontmatter declaring a non-empty `title` and `description`

### Requirement: Concepts pages explain mental models without restating how-to or signatures

Concepts pages SHALL be framed as cross-cutting mental models — the "why" behind the design — and MUST NOT serve as step-by-step how-to recipes or as API reference. Where a page names a function, method, or type, it SHALL link to the corresponding reference or pattern page rather than duplicating signature-level detail.

#### Scenario: A concept page defers mechanics to other buckets

- **WHEN** a visitor reads any concept page
- **THEN** the page explains the model and its rationale
- **AND** it links to a Patterns or Reference page for the mechanical how-to rather than restating parameter/return tables

### Requirement: Two-layer model page contrasts Domain and Pipeline

`two-layer-model.mdx` SHALL explain Domain as a durable flow that persists across time and Pipeline as a finite workflow that runs once per invocation, and SHALL give the reader a rule for choosing which layer to reach for.

#### Scenario: Page frames the choice between layers

- **WHEN** a reader inspects `two-layer-model.mdx`
- **THEN** it describes Domain as a durable flow across time (with phases and events) and Pipeline as a run-once finite workflow
- **AND** it states when to use a Domain versus a Pipeline

### Requirement: Context and patches page explains immutability and the patch model

`context-and-patches.mdx` SHALL explain that context is immutable, that handlers return patches merged as `nextContext = { ...prev, ...patch }`, and that returning nothing means no change. It SHALL point to the Patterns custom-merge page for overriding the default merge rather than documenting merge configuration itself.

#### Scenario: Page explains the patch-and-merge model

- **WHEN** a reader inspects `context-and-patches.mdx`
- **THEN** it states that context is immutable and handlers return patches that shallow-merge over previous context
- **AND** it links to the Patterns custom-merge page for non-default merge behavior

### Requirement: Execution and lifecycle page documents the runtime order

`execution-and-lifecycle.mdx` SHALL describe the ordered steps the runtime takes on `domain.follow()` (guard → `exit` → `on` action → `on` pipeline → phase change → `enter` → phase entry pipeline → history/subscribers) and the pipeline run loop (start at initial → action → evaluate forks first-match-wins → follow target → repeat until terminal), and SHALL indicate where side effects safely belong. The page SHALL describe the `on` action as registered by the ambient `action(fn)` helper called inside the `on` setup function, and SHALL NOT show any `on(event, { ... })` object form or imply that `action`/`guard`/`pipeline` are injected arguments. The page SHALL use the flow/phase/event vocabulary and SHALL NOT use "state" or "transition" for a domain position or move.

#### Scenario: Page presents the follow and run order

- **WHEN** a reader inspects `execution-and-lifecycle.mdx`
- **THEN** it lists the ordered domain `follow()` steps (guard, `exit`, `on` action, `on` pipeline, phase change, `enter`, phase entry pipeline, history/subscribers) and the pipeline run loop
- **AND** it indicates where side effects should be placed in that order

#### Scenario: Page describes the `on` action accurately and in phase/event terms

- **WHEN** a reader inspects how the `on` action is registered on `execution-and-lifecycle.mdx`
- **THEN** the page shows the ambient `action(fn)` helper called inside the `on` setup function
- **AND** it contains no `on(event, { action })` object form, no injected-argument (`({ action }) => ...`) form, and no use of "state" or "transition" for a domain position or move

### Requirement: Definition lifecycle page explains synchronous setup and builder scope

`definition-lifecycle.mdx` SHALL explain that `defineDomain`/`definePipeline` setup functions run synchronously at definition time, that registration helpers operate on an active builder scope, and that calling a helper outside an active scope throws `PlexisError` with code `BUILDER_CLOSED`.

#### Scenario: Page explains builder scope and the BUILDER_CLOSED error

- **WHEN** a reader inspects `definition-lifecycle.mdx`
- **THEN** it states that setup runs synchronously and helpers require an active builder scope
- **AND** it shows that calling a helper outside a scope throws `PlexisError` with code `BUILDER_CLOSED`

### Requirement: Concepts sidebar group is ordered first, above Guides

The Starlight sidebar in `apps/docs/astro.config.mjs` SHALL include a `Concepts` group whose array position is before the `Guides` group. The group MUST link to all four concept slugs: `concepts/two-layer-model`, `concepts/context-and-patches`, `concepts/execution-and-lifecycle`, and `concepts/definition-lifecycle`.

#### Scenario: Concepts group is positioned before Guides

- **WHEN** a developer reads the `sidebar` array in `apps/docs/astro.config.mjs`
- **THEN** an item with `label: 'Concepts'` appears at an index less than the `Guides` group

#### Scenario: Concepts group links all four pages

- **WHEN** a visitor views any docs page
- **THEN** the sidebar `Concepts` section displays links to the Two-layer model, Context & patches, Execution & lifecycle, and Definition lifecycle pages

### Requirement: Concepts pages use only long-form code fence languages

Every fenced code block across the concept pages SHALL use a long-form language identifier — only `typescript` or `bash` — consistent with the rest of the docs site.

#### Scenario: No short-alias or other-language fences

- **WHEN** a developer reads any concept MDX file
- **THEN** every opening code fence is either ` ```typescript ` or ` ```bash `
- **AND** no fence uses `ts`, `sh`, `jsx`, `tsx`, or any other identifier
