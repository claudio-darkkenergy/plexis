## ADDED Requirements

### Requirement: docs.yml workflow exists and validates the docs build

The repository SHALL contain a GitHub Actions workflow at `.github/workflows/docs.yml`. This workflow SHALL trigger on every push to any branch (same trigger breadth as `build.yml`) and SHALL run `pnpm build` inside `apps/docs/` to confirm the Astro site builds without errors. The workflow SHALL NOT deploy to Vercel — deployment is handled by the Vercel GitHub integration.

#### Scenario: docs.yml exists at the canonical path

- **WHEN** a developer inspects the repository
- **THEN** the file `.github/workflows/docs.yml` exists and is valid YAML

#### Scenario: Workflow triggers on push to any branch

- **WHEN** a commit is pushed to any branch
- **THEN** a docs workflow run is enqueued

#### Scenario: Workflow builds the docs site

- **WHEN** the docs workflow runs
- **THEN** it executes `pnpm build` scoped to `@tde.io/docs` (via `pnpm --filter @tde.io/docs run build` or `working-directory: apps/docs`)
- **AND** exits 0 if the build succeeds

#### Scenario: Build failure fails the workflow

- **WHEN** the Astro build exits non-zero (e.g., broken MDX import, config error)
- **THEN** the docs workflow run is marked failed

### Requirement: Vercel deploys the docs site automatically

The docs site SHALL be deployed to Vercel via the Vercel GitHub integration. Vercel MUST be configured with **Root Directory: `apps/docs`** so it resolves the Astro project correctly. Every push to `main` MUST trigger a production deployment. Every push to any other branch MUST trigger a preview deployment with a unique preview URL.

#### Scenario: Push to main triggers production deployment

- **WHEN** a commit is merged to `main`
- **THEN** Vercel automatically builds and deploys the docs site to the production URL

#### Scenario: Push to a feature branch triggers a preview deployment

- **WHEN** a commit is pushed to any branch other than `main`
- **THEN** Vercel builds a preview deployment and posts a unique preview URL to the GitHub commit status or PR check

#### Scenario: Vercel root directory is set to apps/docs

- **WHEN** a maintainer inspects the Vercel project settings
- **THEN** the "Root Directory" setting is `apps/docs`
- **AND** Vercel resolves `package.json` and `astro.config.mjs` relative to that directory

#### Scenario: Vercel installs from the workspace root so workspace:* resolves

- **WHEN** Vercel builds the docs project with Root Directory `apps/docs`
- **THEN** it installs dependencies using the repo-root pnpm workspace (pnpm-workspace detection enabled)
- **AND** the `workspace:*` dependency on `@tde.io/plexis` resolves to the in-repo package without error

### Requirement: docs.yml installs workspace dependencies from the root

The docs workflow SHALL run `pnpm install --frozen-lockfile` from the repository root before building, consistent with all other CI workflows. It MUST NOT run `pnpm install` from within `apps/docs/`.

#### Scenario: Install runs at the repository root

- **WHEN** the docs workflow runs its install step
- **THEN** the step executes `pnpm install --frozen-lockfile` from the repository root (no `working-directory:` override)

#### Scenario: Frozen lockfile catches drift

- **WHEN** `apps/docs/package.json` has been modified without updating `pnpm-lock.yaml`
- **THEN** `pnpm install --frozen-lockfile` exits non-zero and the workflow fails before the build step
