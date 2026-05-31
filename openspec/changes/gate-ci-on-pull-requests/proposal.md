## Why

The `Build` and `Docs` workflows are configured with `push: branches: ['**']`, so every push to every branch enqueues CI runs — even on work-in-progress branches with no pull request open. This wastes Actions minutes and produces noise that has no reviewer waiting on it. CI should run when a change is actually up for review (a PR) or when a release is cut (a version tag), and not otherwise.

The existing `ci-workflows` spec already states that feature-branch pushes and PR events should **not** trigger runs; the implementation drifted from that intent. This change realigns the workflows around pull-request-gated CI.

## What Changes

- **`Build` workflow** (`build.yml`): replace the `push: branches: ['**']` trigger with a `pull_request` trigger. Retain the `push: tags: ['v*.*.*']` trigger so the release pipeline (`Publish` → `Smoke Test`) still has a `Build` run and `plexis-dist` artifact on the tagged commit.
- **`Docs` workflow** (`docs.yml`): replace `push: branches: ['**']` with a `pull_request` trigger. Docs has no release role, so no tag trigger is added.
- **No change** to `Test`, `Publish`, or `Smoke Test` workflows — they are chained via `workflow_run` (Test ← Build, Smoke Test ← Publish) or the tag push (Publish), and inherit the corrected upstream triggers automatically.
- **Net effect:** arbitrary branch pushes no longer start any workflow. Build/Test/Docs run on `pull_request` (opened / synchronize / reopened); Build/Test additionally run on `v*.*.*` tags as part of releases.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `ci-workflows`: the trigger requirement changes from "run on every push to `main` and on `v*.*.*` tags; do not run on PRs" to "run on `pull_request` events and on `v*.*.*` tags; do not run on plain branch pushes (including `main`)." Adds the `Docs` workflow's trigger to the same pull-request-gated policy.

## Impact

- Affected files: `.github/workflows/build.yml`, `.github/workflows/docs.yml`.
- Affected spec: `openspec/specs/ci-workflows/spec.md` (trigger requirement + scenarios).
- Release pipeline (`publish.yml`, `smoke-test.yml`): behavior preserved — `Build` and `Test` still run on the version tag, which `Publish` waits on and pulls the `dist` artifact from. No edits required, but must be verified intact.
- README `Build` badge: continues to reflect the latest `Build` run; no longer pinned to `main` pushes since main pushes no longer build. (Cosmetic only — badge still links to the workflow runs page.)
- Out of scope: fork-PR secret/permission handling (single-maintainer repo), adding new test matrices, or changing what the workflows execute.
