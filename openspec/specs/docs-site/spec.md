# Docs Site Spec

## Requirements

### Requirement: Docs site package exists at apps/docs/

The repository SHALL contain a documentation site package at `apps/docs/`. This directory MUST contain a `package.json` with `"name": "@tde.io/docs"`, `"private": true`, and scripts for `dev` (local development) and `build` (static output). The package MUST use Astro with the Starlight integration as its framework.

#### Scenario: apps/docs package.json exists and is private

- **WHEN** a developer inspects `apps/docs/`
- **THEN** a `package.json` exists with `"name": "@tde.io/docs"` and `"private": true`

#### Scenario: Starlight is declared as a dependency

- **WHEN** a developer reads `apps/docs/package.json`
- **THEN** `@astrojs/starlight` appears in `dependencies` or `devDependencies`

#### Scenario: Dev script starts the Astro dev server

- **WHEN** a developer runs `pnpm dev` inside `apps/docs/`
- **THEN** the Astro development server starts and serves the docs site locally

#### Scenario: Build script produces static output

- **WHEN** a developer runs `pnpm build` inside `apps/docs/`
- **THEN** the command exits 0 and a `dist/` directory is produced containing static HTML, CSS, and JS files

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

### Requirement: Site metadata and branding are configured

The Starlight site SHALL declare a `title` of `"Plexis"` and a `description` matching the library's one-line description. The site SHALL apply the Gruvbox color theme via the `starlight-theme-gruvbox` plugin and SHALL retain Starlight's built-in light/dark color scheme toggle.

#### Scenario: Site title appears in browser tab

- **WHEN** a visitor opens any docs page
- **THEN** the browser tab title includes `"Plexis"`

#### Scenario: Gruvbox theme is applied

- **WHEN** a developer reads `astro.config.mjs`
- **THEN** `starlight-theme-gruvbox` is registered in the Starlight `plugins` array (`gruvbox()`)
- **AND** `starlight-theme-gruvbox` appears in `apps/docs/package.json` dependencies

#### Scenario: Dark mode is available

- **WHEN** a visitor's OS is set to dark mode or they toggle the theme
- **THEN** the site renders in the Gruvbox dark color scheme

### Requirement: Site documents the in-development version and declares the workspace dependency

The docs site SHALL document the in-development ("next") version of the library. `apps/docs/package.json` MUST declare `@tde.io/plexis` as a `workspace:*` dependency, NOT a pinned npm version. The site SHALL display a persistent banner indicating it documents the development version, with a link to the latest stable release on npm.

#### Scenario: @tde.io/plexis is a workspace dependency

- **WHEN** a developer reads `apps/docs/package.json`
- **THEN** `@tde.io/plexis` appears in `devDependencies` with the value `"workspace:*"`
- **AND** it is NOT pinned to a published npm version range

#### Scenario: Version banner is visible

- **WHEN** a visitor opens any docs page
- **THEN** a banner indicates the site documents the in-development ("next") version
- **AND** the banner links to the latest stable release on npm

#### Scenario: Docs build does not require the library to be built

- **WHEN** a developer runs `pnpm docs:build` from the repository root without having run `pnpm build` first
- **THEN** the docs build exits 0
- **AND** does not fail on a missing `@tde.io/plexis` build artifact (no docs module imports the library in this change)

### Requirement: All code examples use long-form language hints

All fenced code blocks in MDX content files SHALL use long-form language identifiers (`typescript`, `bash`) rather than short aliases (`ts`, `sh`).

#### Scenario: TypeScript code blocks use full identifier

- **WHEN** a developer reads any MDX file in `src/content/docs/`
- **THEN** all TypeScript fenced code blocks open with ` ```typescript `

#### Scenario: Shell code blocks use full identifier

- **WHEN** a developer reads any MDX file in `src/content/docs/`
- **THEN** all shell/bash fenced code blocks open with ` ```bash `

### Requirement: Vercel deploys the docs site automatically

The docs site SHALL be deployed to Vercel via the Vercel GitHub integration. Vercel MUST be configured with **Root Directory: `apps/docs`** so it resolves the Astro project correctly. Every push to `main` MUST trigger a production deployment. Every push to any other branch or PR MUST trigger a preview deployment with a unique preview URL.

#### Scenario: Push to main triggers production deployment

- **WHEN** a commit is merged to `main`
- **THEN** Vercel automatically builds and deploys the docs site to the production URL

#### Scenario: Push to a feature branch or PR triggers a preview deployment

- **WHEN** a commit is pushed to any branch other than `main` or a pull request is opened/updated
- **THEN** Vercel builds a preview deployment and posts a unique preview URL to the GitHub commit status or PR check

#### Scenario: Vercel root directory is set to apps/docs

- **WHEN** a maintainer inspects the Vercel project settings
- **THEN** the "Root Directory" setting is `apps/docs`
- **AND** Vercel resolves `package.json` and `astro.config.mjs` relative to that directory

#### Scenario: Vercel installs from the workspace root so workspace:* resolves

- **WHEN** Vercel builds the docs project with Root Directory `apps/docs`
- **THEN** it installs dependencies using the repo-root pnpm workspace (pnpm-workspace detection enabled)
- **AND** the `workspace:*` dependency on `@tde.io/plexis` resolves to the in-repo package without error

### Requirement: API reference documents the complete public surface

The API reference SHALL be organized as a set of per-section pages under `apps/docs/src/content/docs/reference/`, linked from a Reference overview/index page. Collectively the pages SHALL document the complete public surface of `@tde.io/plexis` as declared by `packages/plexis/src/index.ts`, not merely the top-level named exports. The documentation MUST stay faithful to the signatures and field shapes declared in `packages/plexis/src/types.ts`. No symbol previously documented on the single `reference/api.mdx` page may be dropped during the split.

At minimum, the pages MUST document each of the following, including every field with its type:

- **Definition functions**: `defineDomain`, `definePipeline` — with their `DomainSetupResult` / `PipelineSetupResult` return shapes and `DefineDomainOptions` / `DefinePipelineOptions`.
- **Registration helpers**: `state`, `edge`, `node`, `fork`, `terminal` — with `StateNodeDef`, `EdgeDef`, `PipelineNodeDef`, and `PipelineForkDef`, including the `metadata` field present on each.
- **Handler input types**: `GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, and `PipelineConditionInput`.
- **Tracer**: `createTracer` with the full `TracerOptions` shape (`enabled`, `captureContext`, `maxEvents`, `clock`, `idFactory`, `onSubscriberError`) and the `Tracer` methods.
- **Domain instance** members, including the `DomainGraph` query API (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`, `observedPathsTo`, `observedPathsFrom`).
- **Pipeline instance** members, including the `PipelineGraph` query API (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`).
- **Result and supporting types**: `DomainFollowResult`, `PipelineRunResult`, `DomainSnapshot`, `DomainHistoryEntry`, `NodeInspection`, `GraphDescriptor`, `PathQueryOptions`, `MergeMetadata`, `PatchLike`, `ErrorPolicy`, and `PlexisError` with its error codes.

#### Scenario: Complete surface is preserved across the split

- **WHEN** the set of reference pages is compared against the pre-split `reference/api.mdx`
- **THEN** every function, method, helper, and type documented before the split is documented on exactly one of the new section pages

#### Scenario: TracerOptions is documented

- **WHEN** a visitor reads the Tracer section of the API reference
- **THEN** every `TracerOptions` field (`enabled`, `captureContext`, `maxEvents`, `clock`, `idFactory`, `onSubscriberError`) is listed with its type

#### Scenario: Graph query API is documented

- **WHEN** a visitor reads the Domain instance and Pipeline instance pages
- **THEN** the `graph` member's query methods (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`, and the domain-only `observedPathsTo` / `observedPathsFrom`) are each documented with their parameters and return types

#### Scenario: Handler input types are documented

- **WHEN** a visitor reads the documentation for a guard, action, hook, or fork condition
- **THEN** the corresponding input type (`GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, or `PipelineConditionInput`) is documented with its fields

#### Scenario: metadata fields are documented

- **WHEN** a visitor reads the `StateNodeDef`, `EdgeDef`, `PipelineNodeDef`, or `PipelineForkDef` tables
- **THEN** the optional `metadata` field appears in each

#### Scenario: Result type fields are documented

- **WHEN** a visitor reads the documentation for `DomainFollowResult` or `PipelineRunResult`
- **THEN** every field is listed (including `status` enum values, `traceId`, and `error`), rather than a single inline summary line

### Requirement: API reference distinguishes inputs from outputs and marks optionality

The API reference pages SHALL present a consistent, scannable convention that lets a reader tell at a glance what is an input parameter versus a return value, and whether each field is required or optional. The convention MUST be uniform across every section page.

For every documented function, method, or helper, the pages MUST:

- Separate input documentation (parameters / argument-object fields) from return-value documentation under clearly distinct sub-sections or labeled headings (e.g. **Parameters** and **Return value** as section headings).
- Indicate whether each field is required or optional, and show a default value where one applies (for example, via a dedicated **Required** and/or **Default** column, or an explicit `optional` marker).
- Make the parameter or field name the visually dominant element — code-formatted and visually emphasized so it stands out from surrounding type and description text.
- Apply a consistent structure across all documented symbols of the same kind.

This convention MUST be applied to every function, method, and field table across all reference pages, including content that already existed before this change.

#### Scenario: Parameters are visually separated from return values

- **WHEN** a visitor reads the documentation for any function or method that has both inputs and a structured return value
- **THEN** the input parameters and the return value appear under distinct, clearly labeled sections

#### Scenario: Optionality and defaults are explicit

- **WHEN** a visitor reads any field table on any reference page
- **THEN** each field indicates whether it is required or optional
- **AND** any field with a default value shows that default

#### Scenario: Parameter name stands out

- **WHEN** a visitor scans the documentation for any function or method parameter
- **THEN** the parameter name is code-formatted and visually emphasized (e.g. larger or bolder than surrounding body text) so it is immediately distinguishable from its type and description

#### Scenario: Convention applies to pre-existing content

- **WHEN** a visitor reads a section that existed before this change (for example, the Domain instance member table)
- **THEN** it follows the same input/output separation, optionality, and name-emphasis convention as the rest of the reference

### Requirement: API reference colocates a usage example with every documented symbol

Each documented function, method, and registration helper on the API reference pages SHALL include a short, focused inline usage example placed alongside its signature and parameter/return documentation (the MDN reference pattern). The example MUST be authored as a fenced code block using a long-form language hint (`typescript`) and MUST be scoped to the symbol it documents, showing the minimal enclosing scope when the symbol is only meaningful in context (for example, `fork` shown inside a `node`).

#### Scenario: Functions and helpers carry an inline example

- **WHEN** a visitor reads the documentation for any definition function, registration helper, or instance method
- **THEN** a fenced `typescript` example demonstrating that symbol's usage appears within the same entry, after its parameter and return documentation

#### Scenario: Examples use long-form language hints

- **WHEN** a visitor or tool inspects the fenced code blocks of an inline example
- **THEN** the block uses a long-form language hint (`typescript`), never a short alias such as `ts`

#### Scenario: Examples are symbol-scoped

- **WHEN** a visitor reads an inline example for a symbol that is only valid inside an enclosing construct
- **THEN** the example shows the minimal enclosing scope needed to make the usage valid, rather than an unrelated full application

### Requirement: Guides are organized around use cases rather than API surface

The Guides information architecture SHALL be framed as a progression of use cases — common use cases first, then advanced scenarios, then edge cases — rather than re-documenting the API surface. Guide pages SHOULD link into the relevant reference pages for signature-level detail instead of restating it.

#### Scenario: Guides present a use-case progression

- **WHEN** a visitor browses the Guides section
- **THEN** the guides are positioned as use-case-oriented material (common → advanced → edge case) rather than per-symbol API explainers

#### Scenario: Guides defer signature detail to the reference

- **WHEN** a guide references a function, method, or type
- **THEN** it links to the corresponding reference page for full signature and field detail rather than duplicating the parameter/return tables
