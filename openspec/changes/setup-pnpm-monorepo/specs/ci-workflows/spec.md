## MODIFIED Requirements

### Requirement: Run typecheck, build, and test using existing package scripts

The build workflow SHALL execute `pnpm typecheck` and `pnpm build` (in that order). The test workflow SHALL execute `pnpm test`. Each of these commands is a workspace-root pass-through that delegates to `pnpm --filter @tde.io/plexis run <script>` as defined in the root `package.json`. Neither workflow MUST define alternative CI-only typecheck, build, or test logic that could drift from local developer workflows. The test workflow MUST NOT re-run `pnpm build`; it operates on the `packages/plexis/dist/` artifact produced by the build workflow.

#### Scenario: Build workflow runs typecheck via root pass-through

- **WHEN** the build workflow executes
- **THEN** it invokes `pnpm typecheck` at the repository root
- **AND** that script resolves (via the root `package.json`) to `pnpm --filter @tde.io/plexis run typecheck`, which runs `tsc --noEmit` inside the library package

#### Scenario: Build workflow runs the build via root pass-through

- **WHEN** the build workflow executes
- **THEN** it invokes `pnpm build` at the repository root
- **AND** that script resolves (via the root `package.json`) to `pnpm --filter @tde.io/plexis run build`, which runs `rolldown -c && tsc -p tsconfig.types.json` inside the library package

#### Scenario: Build workflow uploads packages/plexis/dist as an artifact

- **WHEN** the build workflow completes the build step successfully
- **THEN** it uploads the `packages/plexis/dist/` directory as a workflow artifact named `plexis-dist`

#### Scenario: Test workflow downloads the build artifact to the package path

- **WHEN** the test workflow starts
- **THEN** it downloads the `plexis-dist` artifact produced by the triggering build run
- **AND** the artifact contents are restored to `packages/plexis/dist/` in the workspace before tests run

#### Scenario: Test workflow runs tests via root pass-through

- **WHEN** the test workflow executes
- **THEN** it invokes `pnpm test` at the repository root
- **AND** that script resolves (via the root `package.json`) to `pnpm --filter @tde.io/plexis run test`, which runs `vitest run` inside the library package

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

## ADDED Requirements

### Requirement: Workflows install dependencies for the whole workspace

The build, test, and publish workflows SHALL run `pnpm install --frozen-lockfile` from the repository root after setting up pnpm and Node. This installs all workspace dependencies (root and every project under `packages/*` and `apps/*`) in a single pass and verifies the root `pnpm-lock.yaml` against the manifests.

#### Scenario: Build workflow installs from the root

- **WHEN** the build workflow runs its install step
- **THEN** the step executes `pnpm install --frozen-lockfile` from the repository root (no `cwd:` or `working-directory:` override)

#### Scenario: Test workflow installs from the root

- **WHEN** the test workflow runs its install step
- **THEN** the step executes `pnpm install --frozen-lockfile` from the repository root

#### Scenario: Publish workflow installs from the root

- **WHEN** the publish workflow runs its install step
- **THEN** the step executes `pnpm install --frozen-lockfile` from the repository root

#### Scenario: Frozen lockfile catches lockfile drift

- **WHEN** the root `pnpm-lock.yaml` is out of sync with any workspace `package.json`
- **THEN** `pnpm install --frozen-lockfile` exits non-zero
- **AND** the workflow step fails before any subsequent step runs
