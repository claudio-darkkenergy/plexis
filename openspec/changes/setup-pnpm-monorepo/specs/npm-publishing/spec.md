## MODIFIED Requirements

### Requirement: Files allowlist restricts the published tarball

The published npm tarball SHALL include only the build outputs, source, and README. The `files` field in `packages/plexis/package.json` MUST list exactly: `dist`, `src`, and `README.md`. The tarball MUST NOT contain test files, internal docs, example apps, OpenSpec changes, or workflow configuration. Paths in the `files` field are resolved relative to the package directory (`packages/plexis/`), so the included `README.md` is `packages/plexis/README.md`.

#### Scenario: Tarball contains dist, src, and README

- **WHEN** `pnpm pack --dry-run` is executed inside `packages/plexis/`
- **THEN** the listed files include the `dist/` tree, the `src/` tree, and `README.md` (resolved from `packages/plexis/README.md`)

#### Scenario: Tarball excludes test and tooling files

- **WHEN** `pnpm pack --dry-run` is executed inside `packages/plexis/`
- **THEN** no files under `openspec/`, `.github/`, `examples/`, `tests/`, or `**/*.test.ts` appear in the listing
- **AND** no files outside `packages/plexis/` appear in the listing

### Requirement: Package entrypoints reference built artifacts

The package SHALL expose ESM, CJS, and TypeScript types via `exports`, `main`, `module`, and `types` fields in `packages/plexis/package.json` that resolve to files inside the package's `dist/` directory. Consumers MUST be able to import `@tde.io/plexis` in both ESM and CJS environments and receive correct type definitions.

#### Scenario: ESM consumers resolve the ESM build

- **WHEN** a consumer with `"type": "module"` imports `@tde.io/plexis`
- **THEN** the resolved file is `dist/esm/index.js` (relative to the package root, i.e. `packages/plexis/dist/esm/index.js` in this repository)

#### Scenario: CJS consumers resolve the CJS build

- **WHEN** a consumer uses `require('@tde.io/plexis')`
- **THEN** the resolved file is `dist/cjs/index.cjs` (relative to the package root, i.e. `packages/plexis/dist/cjs/index.cjs` in this repository)

#### Scenario: TypeScript consumers resolve the type declarations

- **WHEN** a TypeScript consumer imports `@tde.io/plexis`
- **THEN** the resolved type declaration is `dist/types/index.d.ts` (relative to the package root, i.e. `packages/plexis/dist/types/index.d.ts` in this repository)

### Requirement: Tag version must match package.json version

The publish workflow SHALL verify that the git tag name (minus the leading `v`) equals the `version` field in `packages/plexis/package.json` before invoking `pnpm publish`. A mismatch MUST fail the workflow before any publish step runs.

#### Scenario: Tag and version agree

- **WHEN** the workflow runs for tag `v1.2.3`
- **AND** `packages/plexis/package.json` has `"version": "1.2.3"`
- **THEN** the verification step passes and publish proceeds

#### Scenario: Tag and version disagree

- **WHEN** the workflow runs for tag `v1.2.3`
- **AND** `packages/plexis/package.json` has `"version": "1.2.2"`
- **THEN** the verification step fails with a non-zero exit code
- **AND** `pnpm publish` is not invoked

#### Scenario: Verification reads the package manifest, not the root manifest

- **WHEN** the publish workflow's version-check step runs
- **THEN** it reads the `version` field from `packages/plexis/package.json` (e.g., `node -p "require('./packages/plexis/package.json').version"`)
- **AND** it does NOT read the root `package.json` for the version

### Requirement: Publish uses the build artifact, not a fresh local build

The publish workflow SHALL download the `dist/` artifact produced by the build workflow for the same commit SHA, restore it to `packages/plexis/dist/`, and publish that exact directory. The publish workflow MUST NOT run `pnpm build` itself.

#### Scenario: Publish downloads the build artifact to the package path

- **WHEN** the publish workflow runs
- **THEN** it downloads the artifact named `plexis-dist` produced by the build workflow run keyed to the tagged commit
- **AND** the artifact contents are restored to `packages/plexis/dist/`

#### Scenario: Publish does not rebuild

- **WHEN** the publish workflow runs
- **THEN** no step invokes `pnpm build`, `tsc`, or `rolldown`

### Requirement: Authentication uses OIDC with npm provenance

The publish workflow SHALL authenticate to npm using GitHub-issued OIDC tokens and SHALL publish with npm provenance enabled. The workflow MUST grant `id-token: write` permission and MUST invoke publish with the `--provenance` flag (e.g., `pnpm publish --provenance`) from the library package directory. The workflow MUST NOT depend on a long-lived npm credential stored in repository secrets.

#### Scenario: Workflow grants id-token write permission

- **WHEN** a maintainer inspects the publish workflow
- **THEN** the workflow declares `permissions: { id-token: write }` at the workflow or job scope

#### Scenario: Publish runs with provenance from the package directory

- **WHEN** the publish workflow runs `pnpm publish`
- **THEN** the command is executed with `working-directory: packages/plexis` (or an equivalent `cd packages/plexis &&` form)
- **AND** the command includes the `--provenance` flag
- **AND** the published package on npm shows a provenance statement linked to the GitHub Actions run

#### Scenario: No long-lived npm token in secrets

- **WHEN** a maintainer audits the publish workflow and repository secrets
- **THEN** the workflow does not read any `NPM_TOKEN`, `NPM_AUTH_TOKEN`, or equivalent long-lived npm credential
- **AND** no such secret is required to exist for a publish to succeed

## ADDED Requirements

### Requirement: Publish runs from the library package directory

The publish workflow's `pnpm publish` invocation SHALL execute with the working directory set to `packages/plexis/` so that pnpm resolves the package's own `package.json` and its `files` allowlist. Running `pnpm publish` from the repository root MUST NOT be used as the publish step.

#### Scenario: Publish step uses working-directory

- **WHEN** a maintainer inspects the publish workflow YAML
- **THEN** the step that runs `pnpm publish` declares `working-directory: packages/plexis` (or runs `cd packages/plexis &&` before `pnpm publish`)

#### Scenario: pnpm publish resolves the library manifest

- **WHEN** the publish workflow runs the publish step
- **THEN** the resolved manifest is `packages/plexis/package.json` (name `@tde.io/plexis`)
- **AND** the resulting tarball is the one defined by that manifest's `files` allowlist
