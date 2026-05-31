## MODIFIED Requirements

### Requirement: Run typecheck, build, and test using existing package scripts

The workflow SHALL execute `pnpm typecheck`, `pnpm build`, and `pnpm test` in dependent jobs. Each of these commands is a workspace-root pass-through that delegates to the appropriate package script. The workflow MUST NOT define alternative CI-only logic that could drift from local developer workflows.

#### Scenario: `build` job runs typecheck and build via root pass-through

- **WHEN** the `build` job executes
- **THEN** it invokes `pnpm typecheck` and `pnpm build` at the repository root

#### Scenario: `build` job uploads packages/plexis/dist as an artifact

- **WHEN** the `build` job completes successfully
- **THEN** it uploads the `packages/plexis/dist/` directory as a workflow artifact named `plexis-dist`

#### Scenario: `test` job downloads the build artifact to the package path

- **WHEN** the `test` job starts
- **THEN** it downloads the `plexis-dist` artifact produced by the `build` job
- **AND** the artifact contents are restored to `packages/plexis/dist/` in the workspace before tests run

#### Scenario: `test` job runs tests via root pass-through

- **WHEN** the `test` job executes
- **THEN** it invokes `pnpm test` at the repository root

#### Scenario: `publish` job does not rebuild

- **WHEN** the `publish` job executes
- **THEN** no step invokes `pnpm build`, `tsc`, or `rolldown`

#### Scenario: Any job failing fails the run

- **WHEN** any job in the workflow exits non-zero
- **THEN** the workflow run is marked failed
- **AND** subsequent dependent jobs do not run for that commit

## ADDED Requirements

### Requirement: Workflows install dependencies for the whole workspace

Each job in the workflow SHALL run `pnpm install --frozen-lockfile` from the repository root after setting up pnpm and Node. This installs all workspace dependencies in a single pass and verifies the root `pnpm-lock.yaml` against the manifests.

#### Scenario: Each job installs from the root

- **WHEN** any job runs its install step
- **THEN** the step executes `pnpm install --frozen-lockfile` from the repository root

#### Scenario: Frozen lockfile catches lockfile drift

- **WHEN** the root `pnpm-lock.yaml` is out of sync with any workspace `package.json`
- **THEN** `pnpm install --frozen-lockfile` exits non-zero
- **AND** the workflow step fails before any subsequent step runs
