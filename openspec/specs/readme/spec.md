## Requirements

### Requirement: README exists at repo root
A `README.md` SHALL be present at the repository root and SHALL be the primary entry point for developers discovering the project.

#### Scenario: File presence
- **WHEN** a developer clones the repository
- **THEN** a `README.md` file exists at the root of the repository

### Requirement: README communicates project identity
The README SHALL open with a one-line description that clearly states what Plexis is and its primary value proposition.

#### Scenario: Identity section renders
- **WHEN** a developer views the README on GitHub
- **THEN** the first non-badge content is a concise description of Plexis as a zero-dependency TypeScript library for modeling business state with domain state machines and finite workflow pipelines

### Requirement: README includes installation instructions
The README SHALL include an installation section with the exact `npm install` (and equivalent `pnpm`/`yarn`) command needed to add Plexis to a project.

#### Scenario: Install command present
- **WHEN** a developer reads the Installation section
- **THEN** they see a code block with `npm install plexis` and equivalent package manager commands

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

### Requirement: README links to authoritative spec
The README SHALL include a link to `.specs/plexis-composable-spec.md` for developers who want the full API reference.

#### Scenario: Spec link present
- **WHEN** a developer wants deeper documentation
- **THEN** the README contains a visible link or reference pointing to the composable spec

### Requirement: README states zero-dependency constraint
The README SHALL communicate that Plexis has zero runtime dependencies.

#### Scenario: Zero-dependency claim visible
- **WHEN** a developer reads the README
- **THEN** the text explicitly states that Plexis has no external dependencies

### Requirement: README License section links to a hosted OSI license URL
The README SHALL include a `## License` section that names the project's license and links to the canonical hosted text of that license at an OSI-recognized URL. The README MUST NOT link to a local `LICENSE` file. The license stated in the README MUST match the SPDX identifier in `package.json` (`Apache-2.0`).

#### Scenario: License section is present and linked
- **WHEN** a developer reads the README on GitHub or npmjs.com
- **THEN** the `## License` section names the license (Apache-2.0) and the link target is `https://www.apache.org/licenses/LICENSE-2.0`
- **AND** no link points at a local `LICENSE` file path

#### Scenario: License badge matches the section
- **WHEN** a developer inspects the README badge row
- **THEN** the license badge text reads `License: Apache 2.0` and its href is `https://www.apache.org/licenses/LICENSE-2.0`

#### Scenario: Package metadata agrees with the README
- **WHEN** a developer inspects `package.json`
- **THEN** the `license` field equals `Apache-2.0`

### Requirement: README release instructions describe the actual publish flow
The README SHALL include a "To release a new version" section whose steps reflect the actual workflow: step 1 SHALL describe bumping `package.json` `version` and merging to `main`, and SHALL include the concrete command(s) a maintainer runs to do so (e.g., `npm version <patch|minor|major> --no-git-tag-version` or equivalent). The section MUST NOT claim that a `NPM_TOKEN` secret is required, because authentication is performed via OIDC and npm provenance.

#### Scenario: Step 1 names the version-bump command
- **WHEN** a maintainer reads step 1 of the release section
- **THEN** the step shows a command for bumping `package.json` `version` (e.g., `npm version patch --no-git-tag-version`) alongside the existing instruction to merge to `main`

#### Scenario: No NPM_TOKEN paragraph
- **WHEN** a maintainer reads the release section
- **THEN** no text claims that `NPM_TOKEN` is a required repository secret
- **AND** no text instructs adding an npm token to Actions secrets

#### Scenario: OIDC/provenance is noted
- **WHEN** a maintainer reads the release section
- **THEN** the section states that the publish workflow authenticates via OIDC and publishes with npm provenance (no manual token required)

### Requirement: Fenced code blocks use long-form language hints
All fenced code blocks in `README.md` SHALL use the long-form Prism-supported language identifiers (e.g., `typescript`, `bash`) rather than the short aliases (`ts`, `sh`). This MUST be applied so npm's Prism-based syntax highlighter renders readable colors on `npmjs.com`.

#### Scenario: TypeScript blocks use `typescript`
- **WHEN** a developer reads `README.md`
- **THEN** every TypeScript code fence uses ` ```typescript ` (not ` ```ts `)

#### Scenario: Shell blocks use `bash`
- **WHEN** a developer reads `README.md`
- **THEN** every shell code fence uses ` ```bash ` (not ` ```sh `)
