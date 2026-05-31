# README Spec

## Requirements

### Requirement: README exists at repo root and package level

A `README.md` SHALL be present at the repository root and SHALL be the primary entry point for developers discovering the project on GitHub. Additionally, a `README.md` SHALL exist at `packages/plexis/README.md` to serve as the README included in the published npm tarball. The two READMEs MAY share content or MAY diverge in scope (root README focuses on contributor/orientation; package README focuses on the published library). Both MUST exist.

#### Scenario: Root README file presence

- **WHEN** a developer clones the repository
- **THEN** a `README.md` file exists at the root of the repository

#### Scenario: Package README file presence

- **WHEN** a developer clones the repository
- **THEN** a `README.md` file exists at `packages/plexis/README.md`

#### Scenario: Package README ships with the npm package

- **WHEN** a consumer installs `@tde.io/plexis` from npm and inspects the package
- **THEN** a `README.md` file is present in the package contents
- **AND** that README opens with a one-line description of Plexis as a zero-dependency TypeScript library for modeling business state with domain state machines and finite workflow pipelines

### Requirement: Root README documents the repository layout

The repository-root `README.md` SHALL include a brief section that describes the monorepo layout, naming at least the library's location (`packages/plexis/`) and the docs site (`apps/docs/`). The section MUST clarify that the published library `@tde.io/plexis` is built from `packages/plexis/`.

#### Scenario: Layout section is present in the root README

- **WHEN** a developer reads the root `README.md`
- **THEN** there is a clearly headed section (e.g., "Repository layout" or "Monorepo structure") that lists the workspace directories

#### Scenario: Layout section names the library package path

- **WHEN** a developer reads the layout section
- **THEN** the text identifies `packages/plexis/` as the source of the published `@tde.io/plexis` package

#### Scenario: Layout section names the docs slot

- **WHEN** a developer reads the layout section
- **THEN** the text identifies `apps/docs/` as the documentation site

### Requirement: README communicates project identity

The README SHALL open with a one-line description that clearly states what Plexis is and its primary value proposition.

#### Scenario: Identity section renders

- **WHEN** a developer views the README on GitHub
- **THEN** the first non-badge content is a concise description of Plexis as a zero-dependency TypeScript library for modeling business state with domain state machines and finite workflow pipelines

### Requirement: README includes installation instructions

The README SHALL include an installation section with the exact `npm install` (and equivalent `pnpm`/`yarn`) command needed to add Plexis to a project.

#### Scenario: Install command present

- **WHEN** a developer reads the Installation section
- **THEN** they see a code block with `npm install @tde.io/plexis` and equivalent package manager commands

### Requirement: README includes a quick-start example

The README SHALL include a self-contained code example using the composable API (`defineDomain`, `definePipeline`, `state`, `edge`, `node`, `fork`, `terminal`) that demonstrates a realistic use case end to end.

#### Scenario: Example uses composable API

- **WHEN** a developer reads the Quick Start section
- **THEN** the example uses `definePipeline` and `defineDomain` (not `createMachine`/`createPipeline`)

#### Scenario: Example is syntactically valid TypeScript

- **WHEN** the example is copied into a TypeScript project with Plexis installed
- **THEN** it compiles without type errors

#### Scenario: Example shows domain following an event

- **WHEN** a developer reads the Quick Start section
- **THEN** the example includes `await domain.follow(...)` to demonstrate runtime usage

### Requirement: README explains core concepts

The README SHALL include a brief concepts section that distinguishes Domain (durable business state) from Pipeline (finite workflow) and explains the two-layer model at a conceptual level.

#### Scenario: Domain and Pipeline concepts described

- **WHEN** a developer reads the Concepts section
- **THEN** the section explains what a Domain is and what a Pipeline is in plain language, without requiring the reader to read the full spec first

### Requirement: README states zero-dependency constraint

The README SHALL communicate that Plexis has zero runtime dependencies.

#### Scenario: Zero-dependency claim visible

- **WHEN** a developer reads the README
- **THEN** the text explicitly states that Plexis has no external dependencies

### Requirement: Installation, Quick Start, Concepts, and Zero-dependency sections appear in the package README

Because the package README is what npm users see, the package-level `README.md` (`packages/plexis/README.md`) SHALL contain the Installation, Quick Start, Concepts, and zero-dependency sections. The root README MAY duplicate these sections or MAY link to the package README; the contractual requirement is that npm users find them in the published tarball's README.

#### Scenario: Installation section present in the package README

- **WHEN** a developer reads `packages/plexis/README.md`
- **THEN** an Installation section with the `npm install @tde.io/plexis` command (and equivalent `pnpm`/`yarn` commands) is present

#### Scenario: Quick Start section present in the package README

- **WHEN** a developer reads `packages/plexis/README.md`
- **THEN** a Quick Start section is present containing a self-contained TypeScript example that uses `defineDomain`, `definePipeline`, `state`, `edge`, `node`, `fork`, `terminal`, and demonstrates `await domain.follow(...)`

#### Scenario: Concepts section present in the package README

- **WHEN** a developer reads `packages/plexis/README.md`
- **THEN** a Concepts section is present that explains Domain (durable business state) and Pipeline (finite workflow) at a conceptual level

#### Scenario: Zero-dependency claim present in the package README

- **WHEN** a developer reads `packages/plexis/README.md`
- **THEN** the text explicitly states that Plexis has no external dependencies

### Requirement: README License section links to a hosted OSI license URL

The README SHALL include a `## License` section that names the project's license and links to the canonical hosted text of that license at an OSI-recognized URL. The license stated in the README MUST match the SPDX identifier in `package.json` (`Apache-2.0`).

#### Scenario: License section is present and linked

- **WHEN** a developer reads the README on GitHub or npmjs.com
- **THEN** the `## License` section names the license (Apache-2.0) and the link target is `https://www.apache.org/licenses/LICENSE-2.0`

#### Scenario: Package metadata agrees with the README

- **WHEN** a developer inspects `packages/plexis/package.json`
- **THEN** the `license` field equals `Apache-2.0`

### Requirement: README release instructions describe the actual publish flow

The README SHALL include a "To release a new version" section whose steps reflect the actual workflow: step 1 SHALL describe bumping `packages/plexis/package.json` `version` and merging to `main`, and SHALL include the concrete command(s) a maintainer runs (e.g., `cd packages/plexis && npm version patch --no-git-tag-version` or `pnpm --filter @tde.io/plexis exec npm version patch --no-git-tag-version`). The section MUST NOT claim that an `NPM_TOKEN` secret is required.

#### Scenario: Step 1 names a version-bump command scoped to the package

- **WHEN** a maintainer reads step 1 of the release section
- **THEN** the step shows a command for bumping the `version` field in `packages/plexis/package.json`
- **AND** the command either runs from inside `packages/plexis/` or uses `pnpm --filter @tde.io/plexis exec` from the root

#### Scenario: No NPM_TOKEN paragraph

- **WHEN** a maintainer reads the release section
- **THEN** no text claims that `NPM_TOKEN` is a required repository secret

#### Scenario: OIDC/provenance is noted

- **WHEN** a maintainer reads the release section
- **THEN** the section states that the publish workflow authenticates via OIDC and publishes with npm provenance (no manual token required)

### Requirement: Fenced code blocks use long-form language hints

All fenced code blocks in `README.md` SHALL use the long-form Prism-supported language identifiers (`typescript`, `bash`) rather than the short aliases (`ts`, `sh`).

#### Scenario: TypeScript blocks use `typescript`

- **WHEN** a developer reads `README.md`
- **THEN** every TypeScript code fence uses ` ```typescript ` (not ` ```ts `)

#### Scenario: Shell blocks use `bash`

- **WHEN** a developer reads `README.md`
- **THEN** every shell code fence uses ` ```bash ` (not ` ```sh `)
