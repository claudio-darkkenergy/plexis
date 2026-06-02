# npm Publishing Spec

## Requirements

### Requirement: Scoped npm package name

The package SHALL be published to npm under the scoped name `@tde.io/plexis`. The `name` field in `packages/plexis/package.json` MUST equal `@tde.io/plexis` exactly.

#### Scenario: Package name is the scoped form
- **WHEN** a developer inspects `packages/plexis/package.json`
- **THEN** the `name` field equals `@tde.io/plexis`

#### Scenario: Unscoped name is not published
- **WHEN** anyone searches npm for the unscoped name `plexis`
- **THEN** no package owned by this project is returned under that name

### Requirement: Public access for scoped package

The package SHALL be configured to publish with public access so that the scoped name is installable without authentication. The `publishConfig.access` field in `packages/plexis/package.json` MUST equal `"public"`.

#### Scenario: publishConfig is set
- **WHEN** a developer inspects `packages/plexis/package.json`
- **THEN** `publishConfig.access` equals `"public"`

#### Scenario: A bare publish defaults to public
- **WHEN** the publish workflow runs `pnpm publish` without an explicit `--access` flag
- **THEN** the resulting npm package is publicly installable (`npm install @tde.io/plexis` succeeds for anonymous users)

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

The `publish` job SHALL download the `plexis-dist` artifact produced by the `build` job in the same workflow run, restore it to `packages/plexis/dist/`, and publish that exact directory. The `publish` job MUST NOT run `pnpm build` itself.

#### Scenario: Publish downloads the build artifact to the package path

- **WHEN** the `publish` job runs
- **THEN** it downloads the artifact named `plexis-dist` produced by the `build` job
- **AND** the artifact contents are restored to `packages/plexis/dist/`

#### Scenario: Publish does not rebuild

- **WHEN** the `publish` job runs
- **THEN** no step invokes `pnpm build`, `tsc`, or `rolldown`

### Requirement: Publish is gated on build and test success

The `publish` job SHALL only run after the `build` and `test` jobs have both succeeded in the same workflow run. A failed `build` or `test` job MUST prevent the `publish` job from running.

#### Scenario: Both jobs pass

- **WHEN** the `build` and `test` jobs both conclude with `success`
- **THEN** the `publish` job starts and proceeds to `pnpm publish`

#### Scenario: Build job failed

- **WHEN** the `build` job fails
- **THEN** the `publish` job does not run

#### Scenario: Test job failed

- **WHEN** the `test` job fails
- **THEN** the `publish` job does not run

### Requirement: Publish runs from the library package directory

The `publish` job's `pnpm publish` invocation SHALL execute with the working directory set to `packages/plexis/` so that pnpm resolves the package's own `package.json` and its `files` allowlist. Running `pnpm publish` from the repository root MUST NOT be used as the publish step.

#### Scenario: Publish step uses working-directory

- **WHEN** a maintainer inspects the workflow YAML
- **THEN** the step that runs `pnpm publish` declares `working-directory: packages/plexis` (or runs `cd packages/plexis &&` before `pnpm publish`)

#### Scenario: pnpm publish resolves the library manifest

- **WHEN** the `publish` job runs the publish step
- **THEN** the resolved manifest is `packages/plexis/package.json` (name `@tde.io/plexis`)
- **AND** the resulting tarball is the one defined by that manifest's `files` allowlist

### Requirement: Authentication uses OIDC with npm provenance

The publish workflow SHALL authenticate to npm using GitHub-issued OIDC tokens and SHALL publish with npm provenance enabled. The workflow MUST grant `id-token: write` permission and MUST invoke publish with the `--provenance` flag (e.g., `pnpm publish --provenance`). The workflow MUST NOT depend on a long-lived npm credential stored in repository secrets.

OIDC trusted publishing is coupled to the publishing workflow's **filename**: GitHub issues an OIDC token whose `job_workflow_ref` is `<owner>/<repo>/.github/workflows/<file>@<ref>`, and npm completes the token exchange only when `<file>` matches the trusted-publisher record configured for the package on npmjs.com. The npmjs.com trusted-publisher record for `@tde.io/plexis` MUST reference the workflow file that actually runs `pnpm publish` (currently `build.yml`). If the publish step is ever moved or its workflow file renamed, the trusted-publisher record MUST be updated in the same change.

The publish step MUST fail loudly when OIDC token exchange does not succeed. It MUST NOT silently fall back to an unauthenticated publish (which npm rejects with a misleading `E404`). A skipped or failed OIDC token exchange MUST cause the `publish` job to fail with the OIDC failure surfaced as the cause.

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

#### Scenario: Trusted-publisher record matches the publishing workflow file
- **WHEN** the `publish` job runs `pnpm publish --provenance` from `.github/workflows/build.yml` on a `v*.*.*` tag push
- **THEN** the npmjs.com trusted-publisher record for `@tde.io/plexis` names `build.yml` as the workflow file
- **AND** the OIDC token exchange succeeds and the publish is authenticated

#### Scenario: OIDC token exchange failure fails the job
- **WHEN** the OIDC token exchange is skipped or fails (e.g., the trusted-publisher record does not match the workflow file)
- **THEN** the `publish` job fails with the OIDC failure reported as the cause
- **AND** the job does NOT proceed to an unauthenticated publish attempt
