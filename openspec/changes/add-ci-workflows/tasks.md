## 1. Workflow file

- [x] 1.1 Create directory `.github/workflows/` at the repository root
- [x] 1.2 Create `.github/workflows/ci.yml` with workflow name `CI`
- [x] 1.3 Configure trigger: `on: push: branches: [main]` (no `pull_request` trigger yet)
- [x] 1.4 Define a single job `build-test` running on `ubuntu-latest`
- [x] 1.5 Add `actions/checkout@v4` as the first step
- [x] 1.6 Add `pnpm/action-setup@v4` to install pnpm
- [x] 1.7 Add `actions/setup-node@v4` with `node-version: 20` and `cache: 'pnpm'`
- [x] 1.8 Add install step: `pnpm install --frozen-lockfile`
- [x] 1.9 Add typecheck step: `pnpm typecheck`
- [x] 1.10 Add build step: `pnpm build`
- [x] 1.11 Add test step: `pnpm test`

## 2. README badge

- [x] 2.1 Add a GitHub Actions CI status badge near the top of `README.md`
- [x] 2.2 Verify the badge URL points to the `ci.yml` workflow runs page on the correct repository slug

## 3. Local verification

- [x] 3.1 Run `pnpm install --frozen-lockfile` locally and confirm it succeeds (lockfile is in sync)
- [x] 3.2 Run `pnpm typecheck` locally and confirm it succeeds
- [x] 3.3 Run `pnpm build` locally and confirm it produces `dist/esm/`, `dist/cjs/`, and `dist/types/`
- [x] 3.4 Run `pnpm test` locally and confirm it passes
- [x] 3.5 Validate `.github/workflows/ci.yml` is syntactically correct (e.g., paste into GitHub Actions validator or run a YAML linter)

## 4. Post-merge verification

- [ ] 4.1 After merging, confirm the workflow run appears in the GitHub Actions tab
- [ ] 4.2 Confirm the run completes with status `success`
- [ ] 4.3 Confirm the README badge renders as "passing" on the repo's main page
