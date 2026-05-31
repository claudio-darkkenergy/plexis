## 1. Re-gate the Build workflow

- [x] 1.1 In `.github/workflows/build.yml`, replace the `push: branches: ['**']` trigger with a `pull_request:` trigger
- [x] 1.2 Retain the `push: tags: ['v*.*.*']` trigger in `build.yml` (required by the release pipeline); confirm the final `on:` block is exactly `pull_request:` plus `push: tags: ['v*.*.*']`
- [x] 1.3 Confirm `build.yml` is still valid YAML and parses as a GitHub Actions workflow (declares `name`, `on`, `jobs`)

## 2. Re-gate the Docs workflow

- [x] 2.1 In `.github/workflows/docs.yml`, replace the `push: branches: ['**']` trigger with a `pull_request:` trigger (no tag trigger)
- [x] 2.2 Confirm `docs.yml` is still valid YAML and parses as a GitHub Actions workflow

## 3. Verify the untouched chained workflows

- [x] 3.1 Confirm `test.yml` still triggers via `workflow_run: workflows: [Build]` and checks out `github.event.workflow_run.head_sha` (no edits)
- [x] 3.2 Confirm `publish.yml` (tag-triggered) and `smoke-test.yml` (`workflow_run` off Publish) are unchanged and still reference `Build`/`Test` by name
- [x] 3.3 Trace the release path on paper: `v*.*.*` tag → `Build` runs and uploads `plexis-dist` → `Test` runs on success → `Publish` waits satisfied → `Smoke Test` runs

## 4. Sync spec and validate

- [x] 4.1 Confirm the change matches `openspec/changes/gate-ci-on-pull-requests/specs/ci-workflows/spec.md` (PR + tag triggers; no branch-push runs; docs PR-gated)
- [x] 4.2 Run `openspec validate gate-ci-on-pull-requests --strict` and resolve any errors
- [x] 4.3 Review whether `.claude/skills/skill-config.md` needs an update per the CLAUDE.md Skill Config Rule (CI trigger policy change) and update it if so

## 5. Live verification (post-merge of the workflow change)

- [ ] 5.1 With the updated workflows on the PR branch, confirm `Build`, `Test`, and `Docs` enqueue for the pull request
- [x] 5.2 Confirm a plain branch push without an open PR enqueues no workflow runs
- [ ] 5.3 On the next release, confirm the `v*.*.*` tag drives `Build` → `Test` → `Publish` → `Smoke Test` end to end
<!-- NOTE: Tasks 5.1–5.3 require a live PR/tag push on GitHub to observe. Complete these after pushing the branch and opening a PR. -->
