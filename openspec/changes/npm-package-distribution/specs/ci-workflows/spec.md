## MODIFIED Requirements

### Requirement: CI workflow file location and format

The repository SHALL contain two GitHub Actions workflow files: `.github/workflows/build.yml` and `.github/workflows/test.yml`. Both files MUST be valid YAML and MUST parse as GitHub Actions workflows (i.e., each declares `name`, `on`, and `jobs` top-level keys). The previous combined workflow at `.github/workflows/ci.yml` MUST NOT exist.

#### Scenario: Build workflow file exists at the canonical path
- **WHEN** a developer inspects the repository
- **THEN** the file `.github/workflows/build.yml` exists
- **AND** the file is recognized by GitHub Actions as a workflow (visible in the Actions tab once pushed)

#### Scenario: Test workflow file exists at the canonical path
- **WHEN** a developer inspects the repository
- **THEN** the file `.github/workflows/test.yml` exists
- **AND** the file is recognized by GitHub Actions as a workflow (visible in the Actions tab once pushed)

#### Scenario: Legacy ci.yml is removed
- **WHEN** a developer inspects the repository
- **THEN** the file `.github/workflows/ci.yml` does not exist

#### Scenario: Build workflow has a stable display name
- **WHEN** the build workflow runs
- **THEN** the run is labeled `Build` in the Actions tab

#### Scenario: Test workflow has a stable display name
- **WHEN** the test workflow runs
- **THEN** the run is labeled `Test` in the Actions tab

### Requirement: Trigger on every push to `main`

The build workflow SHALL run automatically on every push to the `main` branch and on every push of a tag matching `v*.*.*`. The test workflow SHALL run automatically on completion of a build workflow run. Neither workflow MUST run on pushes to other branches and neither MUST run on `pull_request` events at this time.

#### Scenario: Push to main triggers a build run
- **WHEN** a commit is pushed to `main` (directly or via a merged PR)
- **THEN** a new build workflow run is enqueued within GitHub Actions

#### Scenario: Tag push triggers a build run
- **WHEN** a tag matching `v*.*.*` is pushed
- **THEN** a new build workflow run is enqueued

#### Scenario: A successful build triggers test
- **WHEN** a build workflow run concludes with `success`
- **THEN** a new test workflow run is enqueued for the same commit SHA

#### Scenario: A failed build does not trigger test
- **WHEN** a build workflow run concludes with `failure` or `cancelled`
- **THEN** no test workflow run is started for that commit

#### Scenario: Push to a feature branch does not trigger a run
- **WHEN** a commit is pushed to any branch other than `main`
- **THEN** no build or test workflow run is started

#### Scenario: Opening or updating a PR does not trigger a run
- **WHEN** a pull request is opened, synchronized, or reopened
- **THEN** no build or test workflow run is started

### Requirement: Run typecheck, build, and test using existing package scripts

The build workflow SHALL execute `pnpm typecheck` and `pnpm build` (in that order). The test workflow SHALL execute `pnpm test`. Neither workflow MUST define alternative CI-only typecheck, build, or test logic that could drift from local developer workflows. The test workflow MUST NOT re-run `pnpm build`; it operates on the `dist/` artifact produced by the build workflow.

#### Scenario: Build workflow runs typecheck
- **WHEN** the build workflow executes
- **THEN** it invokes `pnpm typecheck` (which runs `tsc --noEmit`)

#### Scenario: Build workflow runs the build
- **WHEN** the build workflow executes
- **THEN** it invokes `pnpm build` (which runs `rolldown -c && tsc -p tsconfig.types.json`)

#### Scenario: Build workflow uploads dist as an artifact
- **WHEN** the build workflow completes the build step successfully
- **THEN** it uploads the `dist/` directory as a workflow artifact named `plexis-dist`

#### Scenario: Test workflow downloads the build artifact
- **WHEN** the test workflow starts
- **THEN** it downloads the `plexis-dist` artifact produced by the triggering build run
- **AND** the artifact contents are restored to `dist/` in the workspace before tests run

#### Scenario: Test workflow runs tests
- **WHEN** the test workflow executes
- **THEN** it invokes `pnpm test` (which runs `vitest run`)

#### Scenario: Test workflow does not rebuild
- **WHEN** the test workflow executes
- **THEN** no step invokes `pnpm build`, `tsc`, or `rolldown`

#### Scenario: Any step failing fails the run
- **WHEN** any step in the build workflow exits non-zero
- **THEN** the build workflow run is marked failed
- **AND** the test workflow does not run for that commit

#### Scenario: Test failure does not affect build status
- **WHEN** the test workflow fails
- **THEN** the build workflow's status remains `success`
- **AND** the test workflow's status is `failure`

### Requirement: CI status badge in README

The repository's `README.md` SHALL display a GitHub Actions status badge for the build workflow. The badge MUST link to the build workflow's runs page so readers can inspect status at a glance.

#### Scenario: Badge is present in the README
- **WHEN** a reader views `README.md` on GitHub
- **THEN** a "Build" badge is rendered near the top of the file
- **AND** the badge reflects the current pass/fail status of the latest build run on `main`
- **AND** clicking the badge navigates to the build workflow's runs page
