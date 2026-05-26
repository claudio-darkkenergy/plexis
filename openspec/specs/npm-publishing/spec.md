# npm Publishing Spec

## Requirements

### Requirement: Scoped npm package name

The package SHALL be published to npm under the scoped name `@tde.io/plexis`. The `name` field in `package.json` MUST equal `@tde.io/plexis` exactly.

#### Scenario: Package name is the scoped form
- **WHEN** a developer inspects `package.json`
- **THEN** the `name` field equals `@tde.io/plexis`

#### Scenario: Unscoped name is not published
- **WHEN** anyone searches npm for the unscoped name `plexis`
- **THEN** no package owned by this project is returned under that name

### Requirement: Public access for scoped package

The package SHALL be configured to publish with public access so that the scoped name is installable without authentication. The `publishConfig.access` field in `package.json` MUST equal `"public"`.

#### Scenario: publishConfig is set
- **WHEN** a developer inspects `package.json`
- **THEN** `publishConfig.access` equals `"public"`

#### Scenario: A bare publish defaults to public
- **WHEN** the publish workflow runs `pnpm publish` without an explicit `--access` flag
- **THEN** the resulting npm package is publicly installable (`npm install @tde.io/plexis` succeeds for anonymous users)

### Requirement: Files allowlist restricts the published tarball

The published npm tarball SHALL include only the build outputs, source, and README. The `files` field in `package.json` MUST list exactly: `dist`, `src`, and `README.md`. The tarball MUST NOT contain test files, internal docs, example apps, OpenSpec changes, or workflow configuration.

#### Scenario: Tarball contains dist, src, and README
- **WHEN** `pnpm pack --dry-run` is executed
- **THEN** the listed files include the `dist/` tree, the `src/` tree, and `README.md`

#### Scenario: Tarball excludes test and tooling files
- **WHEN** `pnpm pack --dry-run` is executed
- **THEN** no files under `openspec/`, `.github/`, `examples/`, or `**/*.test.ts` appear in the listing

### Requirement: Package entrypoints reference built artifacts

The package SHALL expose ESM, CJS, and TypeScript types via `exports`, `main`, `module`, and `types` fields that resolve to files inside `dist/`. Consumers MUST be able to import `@tde.io/plexis` in both ESM and CJS environments and receive correct type definitions.

#### Scenario: ESM consumers resolve the ESM build
- **WHEN** a consumer with `"type": "module"` imports `@tde.io/plexis`
- **THEN** the resolved file is `dist/esm/index.js`

#### Scenario: CJS consumers resolve the CJS build
- **WHEN** a consumer uses `require('@tde.io/plexis')`
- **THEN** the resolved file is `dist/cjs/index.cjs`

#### Scenario: TypeScript consumers resolve the type declarations
- **WHEN** a TypeScript consumer imports `@tde.io/plexis`
- **THEN** the resolved type declaration is `dist/types/index.d.ts`

### Requirement: Publish trigger is a version tag push

Publication SHALL be triggered exclusively by pushing a git tag matching the pattern `v*.*.*` (semver with a leading `v`) to the repository. The workflow MUST NOT publish on any other event (push to a branch, manual dispatch, schedule, or PR).

#### Scenario: Tagging a release triggers publish
- **WHEN** a tag matching `v*.*.*` (e.g., `v1.2.3`) is pushed to the repository
- **THEN** the publish workflow is enqueued

#### Scenario: A non-version tag does not trigger publish
- **WHEN** a tag not matching `v*.*.*` (e.g., `nightly`, `rc-2026-05-24`) is pushed
- **THEN** the publish workflow is not enqueued

#### Scenario: Pushing to main does not publish
- **WHEN** a commit is pushed to `main` without a tag
- **THEN** the publish workflow does not run

### Requirement: Tag version must match package.json version

The publish workflow SHALL verify that the git tag name (minus the leading `v`) equals the `version` field in `package.json` before invoking `npm publish`. A mismatch MUST fail the workflow before any publish step runs.

#### Scenario: Tag and version agree
- **WHEN** the workflow runs for tag `v1.2.3`
- **AND** `package.json` has `"version": "1.2.3"`
- **THEN** the verification step passes and publish proceeds

#### Scenario: Tag and version disagree
- **WHEN** the workflow runs for tag `v1.2.3`
- **AND** `package.json` has `"version": "1.2.2"`
- **THEN** the verification step fails with a non-zero exit code
- **AND** `pnpm publish` is not invoked

### Requirement: Publish uses the build artifact, not a fresh local build

The publish workflow SHALL download the `dist/` artifact produced by the build workflow for the same commit SHA and publish that exact directory. The publish workflow MUST NOT run `pnpm build` itself.

#### Scenario: Publish downloads the build artifact
- **WHEN** the publish workflow runs
- **THEN** it downloads the artifact named `plexis-dist` produced by the build workflow run keyed to the tagged commit

#### Scenario: Publish does not rebuild
- **WHEN** the publish workflow runs
- **THEN** no step invokes `pnpm build`, `tsc`, or `rolldown`

### Requirement: Publish is gated on build and test success

The publish workflow SHALL refuse to publish unless both the build workflow and the test workflow have completed successfully for the tagged commit SHA. A failed or in-progress build or test MUST prevent the publish step from running.

#### Scenario: Both gates pass
- **WHEN** build and test have both concluded with `success` for the tagged commit SHA
- **THEN** the publish workflow proceeds to `pnpm publish`

#### Scenario: Build failed
- **WHEN** the build workflow for the tagged commit concluded with `failure`
- **THEN** the publish workflow does not run `pnpm publish`
- **AND** the publish workflow is marked failed

#### Scenario: Test failed
- **WHEN** the test workflow for the tagged commit concluded with `failure`
- **THEN** the publish workflow does not run `pnpm publish`
- **AND** the publish workflow is marked failed

### Requirement: Authentication uses OIDC with npm provenance

The publish workflow SHALL authenticate to npm using GitHub-issued OIDC tokens and SHALL publish with npm provenance enabled. The workflow MUST grant `id-token: write` permission and MUST invoke publish with the `--provenance` flag (e.g., `pnpm publish --provenance`). The workflow MUST NOT depend on a long-lived npm credential stored in repository secrets.

#### Scenario: Workflow grants id-token write permission
- **WHEN** a maintainer inspects the publish workflow
- **THEN** the workflow declares `permissions: { id-token: write }` at the workflow or job scope

#### Scenario: Publish runs with provenance
- **WHEN** the publish workflow runs `pnpm publish`
- **THEN** the command includes the `--provenance` flag
- **AND** the published package on npm shows a provenance statement linked to the GitHub Actions run

#### Scenario: No long-lived npm token in secrets
- **WHEN** a maintainer audits the publish workflow and repository secrets
- **THEN** the workflow does not read any `NPM_TOKEN`, `NPM_AUTH_TOKEN`, or equivalent long-lived npm credential
- **AND** no such secret is required to exist for a publish to succeed
