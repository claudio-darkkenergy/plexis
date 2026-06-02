# CI Workflows Spec

## Requirements

### Requirement: CI workflow file location and format

The repository SHALL contain a single GitHub Actions workflow file at `.github/workflows/build.yml`. This file MUST be a valid YAML and MUST parse as a GitHub Actions workflow (i.e., it declares `name`, `on`, and `jobs` top-level keys). The previous workflow files `.github/workflows/ci.yml`, and `.github/workflows/publish.yml` MUST NOT exist.

#### Scenario: Build workflow file exists at the canonical path
- **WHEN** a developer inspects the repository
- **THEN** the file `.github/workflows/build.yml` exists
- **AND** the file is recognized by GitHub Actions as a workflow (visible in the Actions tab once pushed)

#### Scenario: Legacy `ci.yml` and `publish.yml` are removed
- **WHEN** a developer inspects the repository
- **THEN** the files `.github/workflows/ci.yml` and `.github/workflows/publish.yml` do not exist

#### Scenario: Build workflow has a stable display name
- **WHEN** the workflow runs
- **THEN** the run is labeled `Build, Test, and Publish` in the Actions tab

### Requirement: Trigger on pull requests and version tags only

The workflow SHALL run automatically on every `pull_request` event (opened, synchronized, or reopened) and on every push of a tag matching `v*.*.*`. The workflow MUST NOT run on plain branch pushes, including pushes to `main`. The `publish` job within the workflow SHALL only run on tag pushes.

#### Scenario: Tag push triggers a run
- **WHEN** a tag matching `v*.*.*` is pushed
- **THEN** a new workflow run is enqueued

#### Scenario: Opening or updating a PR triggers a run
- **WHEN** a pull request is opened, synchronized, or reopened
- **THEN** a new workflow run is started

#### Scenario: Push to main does not trigger a run
- **WHEN** a commit is pushed to `main` (directly or via a merged PR) and carries no `v*.*.*` tag
- **THEN** no workflow run is started

### Requirement: Run typecheck, build, test, and publish using existing package scripts

The workflow SHALL execute `pnpm typecheck`, `pnpm build`, `pnpm test`, and `pnpm publish` in a sequence of dependent jobs (`build` -> `test` -> `publish`). The workflow MUST NOT define alternative CI-only logic that could drift from local developer workflows.

#### Scenario: `build` job runs typecheck and build
- **WHEN** the `build` job executes
- **THEN** it invokes `pnpm typecheck` and `pnpm build`
- **AND** it uploads the `dist/` directory as a workflow artifact named `plexis-dist`

#### Scenario: `test` job runs tests
- **WHEN** the `test` job executes
- **THEN** it downloads the `plexis-dist` artifact
- **AND** it invokes `pnpm test` (which runs `vitest run`)

#### Scenario: `publish` job publishes the package
- **WHEN** the `publish` job executes (on a tag push)
- **THEN** it downloads the `plexis-dist` artifact
- **AND** it verifies the package version against the tag
- **AND** it invokes `pnpm publish`

#### Scenario: Any step failing fails the run
- **WHEN** any job in the workflow fails
- **THEN** the workflow run is marked as failed
- **AND** subsequent dependent jobs are skipped

### Requirement: CI status badge in README

The repository's `README.md` SHALL display a GitHub Actions status badge for the build workflow. The badge MUST link to the workflow's runs page so readers can inspect status at a glance.

#### Scenario: Badge is present in the README
- **WHEN** a reader views `README.md` on GitHub
- **THEN** a "Build, Test, and Publish" badge is rendered near the top of the file
- **AND** the badge reflects the current pass/fail status of the latest workflow run
- **AND** clicking the badge navigates to the workflow's runs page
