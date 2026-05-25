## Why

Plexis is feature-complete enough to share publicly, but the repository is not yet wired for npm distribution: the package name is unscoped (`plexis`), and the single `ci.yml` workflow couples build, typecheck, and test into one job that cannot be reused as a gate for publishing. Splitting CI into composable workflows and adding a publish workflow lets us ship `@tde.io/plexis` to npm with confidence that every published tarball passed the same build+test that ran on `main`.

## What Changes

- **BREAKING** Rename the package from `plexis` to `@tde.io/plexis` in `package.json` (scoped package under the `@tde.io` organization).
- Configure `package.json` `publishConfig` so the scoped package publishes as public on the npm registry.
- Remove `.github/workflows/ci.yml` and replace it with three separate workflows:
  - `.github/workflows/build.yml` — installs deps, typechecks, builds, and uploads the `dist/` directory as a workflow artifact.
  - `.github/workflows/test.yml` — depends on `build.yml` (via `workflow_run` or reusable workflow), downloads the `dist/` artifact, and runs `pnpm test` against it.
  - `.github/workflows/publish.yml` — depends on both `build.yml` and `test.yml` succeeding, downloads the `dist/` artifact built by `build.yml`, and runs `pnpm publish` to push the package to npm.
- Document the publish trigger (git tag matching `v*.*.*` on `main`) and the required `NPM_TOKEN` repository secret.
- Update the README CI badge to point at the new build workflow (the canonical "is it green" signal).

## Capabilities

### New Capabilities

- `npm-publishing`: Defines how `@tde.io/plexis` is published to npm — package metadata requirements (scoped name, `publishConfig.access`, `files` allowlist, entrypoints), the publish trigger (tag push), token/secret requirements, and the contract that only the `dist/` artifact produced by `build.yml` is what ships.

### Modified Capabilities

- `ci-workflows`: The single `ci.yml` workflow is replaced by two separate workflows (`build.yml` and `test.yml`) with a dependency relationship. Build uploads `dist/` as an artifact; test consumes that artifact rather than rebuilding. The README badge requirement shifts from `ci.yml` to `build.yml`.

## Impact

- **Affected files**:
  - `package.json` — `name`, `publishConfig`, possibly `repository`/`bugs`/`homepage` fields.
  - `.github/workflows/ci.yml` — deleted.
  - `.github/workflows/build.yml`, `.github/workflows/test.yml`, `.github/workflows/publish.yml` — new.
  - `README.md` — badge URL update.
  - `openspec/specs/ci-workflows/spec.md` — modified via delta in this change.
- **Affected systems**:
  - GitHub Actions — three workflows instead of one; artifact storage used to pass `dist/` between jobs/workflows.
  - npm registry — new published package at `@tde.io/plexis`.
- **Required secrets**:
  - `NPM_TOKEN` — npm automation token with publish rights on the `@tde.io` scope. Must be added to repository secrets before the first publish run.
- **Dependencies**: No new runtime or build-time dependencies. CI uses `actions/upload-artifact@v4` and `actions/download-artifact@v4`, which are already standard GitHub-provided actions.
- **Downstream consumers**: Anyone currently installing `plexis` (none — unpublished) is unaffected. Future installs will use `pnpm add @tde.io/plexis` / `npm install @tde.io/plexis`.
