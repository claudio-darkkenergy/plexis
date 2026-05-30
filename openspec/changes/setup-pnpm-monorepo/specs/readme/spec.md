## MODIFIED Requirements

### Requirement: README exists at repo root

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

### Requirement: README release instructions describe the actual publish flow

The README SHALL include a "To release a new version" section whose steps reflect the actual workflow: step 1 SHALL describe bumping `packages/plexis/package.json` `version` and merging to `main`, and SHALL include the concrete command(s) a maintainer runs to do so. Because the version field lives inside the library package after the monorepo move, the command MUST be issued from inside `packages/plexis/` (e.g., `cd packages/plexis && npm version <patch|minor|major> --no-git-tag-version`) or invoked via a filter from the root (e.g., `pnpm --filter @tde.io/plexis exec npm version <patch|minor|major> --no-git-tag-version`). The section MUST NOT claim that an `NPM_TOKEN` secret is required, because authentication is performed via OIDC and npm provenance.

#### Scenario: Step 1 names a version-bump command scoped to the package

- **WHEN** a maintainer reads step 1 of the release section
- **THEN** the step shows a command for bumping the `version` field in `packages/plexis/package.json`
- **AND** the command either runs from inside `packages/plexis/` or uses `pnpm --filter @tde.io/plexis exec` from the root

#### Scenario: No NPM_TOKEN paragraph

- **WHEN** a maintainer reads the release section
- **THEN** no text claims that `NPM_TOKEN` is a required repository secret
- **AND** no text instructs adding an npm token to Actions secrets

#### Scenario: OIDC/provenance is noted

- **WHEN** a maintainer reads the release section
- **THEN** the section states that the publish workflow authenticates via OIDC and publishes with npm provenance (no manual token required)

## ADDED Requirements

### Requirement: Root README documents the repository layout

The repository-root `README.md` SHALL include a brief section that describes the monorepo layout, naming at least the library's location (`packages/plexis/`) and the reserved apps directory (`apps/`, including `apps/docs/` for the future documentation site). The section MUST clarify that the published library `@tde.io/plexis` is built from `packages/plexis/`.

#### Scenario: Layout section is present in the root README

- **WHEN** a developer reads the root `README.md`
- **THEN** there is a clearly headed section (e.g., "Repository layout" or "Monorepo structure") that lists the workspace directories

#### Scenario: Layout section names the library package path

- **WHEN** a developer reads the layout section
- **THEN** the text identifies `packages/plexis/` as the source of the published `@tde.io/plexis` package

#### Scenario: Layout section names the docs slot

- **WHEN** a developer reads the layout section
- **THEN** the text identifies `apps/docs/` as the slot reserved for the future documentation site

### Requirement: Installation, Quick Start, Concepts, and Zero-dependency sections appear in the package README

Because the package README is what npm users see, the package-level `README.md` (`packages/plexis/README.md`) SHALL contain the Installation, Quick Start, Concepts, and zero-dependency sections required by this capability. The root README MAY duplicate these sections or MAY link to the package README; the contractual requirement is that npm users find them in the published tarball's README.

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
