## ADDED Requirements

### Requirement: CI workflow file location and format

The repository SHALL contain a GitHub Actions workflow file at `.github/workflows/ci.yml`. The file MUST be valid YAML and MUST parse as a GitHub Actions workflow (i.e., declare `name`, `on`, and `jobs` top-level keys).

#### Scenario: Workflow file exists at the canonical path
- **WHEN** a developer inspects the repository
- **THEN** the file `.github/workflows/ci.yml` exists
- **AND** the file is recognized by GitHub Actions as a workflow (visible in the Actions tab once pushed)

#### Scenario: Workflow has a stable display name
- **WHEN** the workflow runs
- **THEN** the run is labeled `CI` in the Actions tab

### Requirement: Trigger on every push to `main`

The CI workflow SHALL run automatically on every push to the `main` branch. It MUST NOT run on pushes to other branches and MUST NOT run on `pull_request` events at this time.

#### Scenario: Push to main triggers a run
- **WHEN** a commit is pushed to `main` (directly or via a merged PR)
- **THEN** a new workflow run is enqueued within GitHub Actions

#### Scenario: Push to a feature branch does not trigger a run
- **WHEN** a commit is pushed to any branch other than `main`
- **THEN** no CI workflow run is started

#### Scenario: Opening or updating a PR does not trigger a run
- **WHEN** a pull request is opened, synchronized, or reopened
- **THEN** no CI workflow run is started

### Requirement: Run typecheck, build, and test using existing package scripts

The CI workflow SHALL execute the project's existing typecheck, build, and test commands by invoking the package scripts defined in `package.json`: `pnpm typecheck`, `pnpm build`, and `pnpm test`. It MUST NOT define alternative CI-only build or test logic that could drift from local developer workflows.

#### Scenario: Workflow runs typecheck
- **WHEN** the workflow executes
- **THEN** it invokes `pnpm typecheck` (which runs `tsc --noEmit`)

#### Scenario: Workflow runs the build
- **WHEN** the workflow executes
- **THEN** it invokes `pnpm build` (which runs `rolldown -c && tsc -p tsconfig.types.json`)

#### Scenario: Workflow runs tests
- **WHEN** the workflow executes
- **THEN** it invokes `pnpm test` (which runs `vitest run`)

#### Scenario: Any step failing fails the run
- **WHEN** any of typecheck, build, or test exits non-zero
- **THEN** the workflow run is marked failed
- **AND** subsequent steps do not run unless explicitly marked `if: always()`

### Requirement: Use pnpm with a locked install

The CI workflow SHALL install dependencies using pnpm with `--frozen-lockfile` so that a stale or mismatched `pnpm-lock.yaml` fails the run.

#### Scenario: Lockfile is up-to-date
- **WHEN** `pnpm-lock.yaml` matches `package.json`
- **AND** the workflow runs `pnpm install --frozen-lockfile`
- **THEN** installation succeeds

#### Scenario: Lockfile is out of date
- **WHEN** `pnpm-lock.yaml` does not match `package.json`
- **AND** the workflow runs `pnpm install --frozen-lockfile`
- **THEN** installation fails with a non-zero exit code
- **AND** the workflow run is marked failed

### Requirement: Pin Node.js version and cache the pnpm store

The CI workflow SHALL set up a specific Node.js version (Node 20, the active LTS that satisfies `engines.node >=19`) and SHALL cache the pnpm content-addressable store between runs to keep installs fast.

#### Scenario: Node version is pinned
- **WHEN** the workflow sets up Node
- **THEN** it uses Node.js 20.x via `actions/setup-node@v4`

#### Scenario: pnpm store is cached
- **WHEN** the workflow sets up Node
- **THEN** it enables pnpm caching (e.g., `cache: 'pnpm'` in `actions/setup-node`)
- **AND** subsequent runs with an unchanged `pnpm-lock.yaml` reuse the cached store

### Requirement: CI status badge in README

The repository's `README.md` SHALL display a GitHub Actions status badge for the CI workflow. The badge MUST link to the workflow's runs page so readers can inspect status at a glance.

#### Scenario: Badge is present in the README
- **WHEN** a reader views `README.md` on GitHub
- **THEN** a "CI" badge is rendered near the top of the file
- **AND** the badge reflects the current pass/fail status of the latest run on `main`
- **AND** clicking the badge navigates to the workflow's runs page
