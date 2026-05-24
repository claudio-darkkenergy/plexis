## ADDED Requirements

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
