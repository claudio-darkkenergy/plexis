## MODIFIED Requirements

### Requirement: Starlight site has a complete content structure

The docs site SHALL contain MDX content files covering at minimum: a landing/quick-start page, a Concepts section, a Domain guide, a Pipeline guide, a Patterns section, an Advanced section, an Integrations section, a multi-page API reference section, and a Contributor guide. Content MUST be authored in MDX under `src/content/docs/` following Starlight's content collections convention.

#### Scenario: Landing page exists

- **WHEN** a visitor navigates to the docs site root
- **THEN** a page renders with the Plexis one-line description and a Quick Start section

#### Scenario: Concepts section exists

- **WHEN** a visitor navigates to the Concepts section
- **THEN** pages render explaining the cross-cutting mental models (two-layer model, context & patches, execution & lifecycle, definition lifecycle)

#### Scenario: Domain guide exists

- **WHEN** a visitor navigates to the Domain guide
- **THEN** a page renders explaining the Domain concept, state, edges, and lifecycle hooks with code examples

#### Scenario: Pipeline guide exists

- **WHEN** a visitor navigates to the Pipeline guide
- **THEN** a page renders explaining the Pipeline concept, nodes, forks, and terminal nodes with code examples

#### Scenario: Patterns section exists

- **WHEN** a visitor navigates to the Patterns section
- **THEN** pages render covering focused framework-agnostic techniques (e.g., custom merge, composing pipelines, forks in depth, testing)

#### Scenario: Advanced section exists

- **WHEN** a visitor navigates to the Advanced section
- **THEN** pages render presenting heavyweight, multi-primitive worked examples (e.g., multi-step form, API route, saga)

#### Scenario: Integrations section exists

- **WHEN** a visitor navigates to the Integrations section
- **THEN** pages render binding Plexis to named third-party targets (React, Vue)

#### Scenario: API reference section exists

- **WHEN** a visitor navigates to the API reference
- **THEN** a Reference overview/index page renders that links to per-section reference pages covering definition functions, registration helpers, handler input types, tracer, domain instance members, pipeline instance members, errors, and key types
- **AND** each section page documents every function and method with its parameters and return value under clearly separated sections
- **AND** parameter and field names are visually emphasized so they stand out from type and description text

#### Scenario: Contributor guide exists

- **WHEN** a visitor navigates to the Contributor guide
- **THEN** a page renders covering how to set up the monorepo locally, run tests, build the library, and update the docs

### Requirement: Starlight sidebar navigation is configured

The Starlight site SHALL declare an explicit sidebar configuration in `astro.config.mjs` that groups pages into logical sections in reading order: Concepts, Guides, Patterns, Advanced, Integrations, Reference, and Contributing. The Reference section MUST be a group enumerating each per-section reference page in an intentional (non-alphabetical) order rather than a single API link.

#### Scenario: Sidebar renders the five learning buckets in order

- **WHEN** a developer reads the `sidebar` array in `apps/docs/astro.config.mjs`
- **THEN** groups labeled `Concepts`, `Guides`, `Patterns`, `Advanced`, and `Integrations` appear in that relative order, before the `Reference` group

#### Scenario: Sidebar renders guide pages

- **WHEN** a visitor views any page on the docs site
- **THEN** the sidebar displays links to the Domain guide, Pipeline guide, and other guide-section pages

#### Scenario: Sidebar renders the multi-page reference group

- **WHEN** a visitor views any page on the docs site
- **THEN** the sidebar displays a Reference group whose items link to each per-section reference page (definition functions, registration helpers, handler input types, tracer, domain instance, pipeline instance, errors, key types) plus the Contributor guide
