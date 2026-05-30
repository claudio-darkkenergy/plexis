## Context

The repository runs five GitHub Actions workflows wired into two chains:

- **CI:** `Build` → `Test` (Test fires via `workflow_run` after Build succeeds).
- **Release:** push `v*.*.*` tag → `Build` (produces `plexis-dist` artifact) and `Publish` waits for `Build` + `Test` on the tagged commit, downloads the artifact, publishes to npm → `Smoke Test` (fires via `workflow_run` after Publish).
- **Docs:** `Docs` builds the docs site standalone.

Today `build.yml` and `docs.yml` trigger on `push: branches: ['**']`, so every push to every branch starts a run regardless of whether a PR exists. The `ci-workflows` spec already declares feature-branch and PR-less pushes should not trigger runs; the YAML drifted from that intent. This change re-gates CI on pull requests while preserving the tag-driven release chain.

## Goals / Non-Goals

**Goals:**
- Build/Test/Docs run only on `pull_request` events during normal development.
- No workflow runs on a plain branch push (including `main`) that lacks a PR or a `v*.*.*` tag.
- The release pipeline (`Publish` → `Smoke Test`) keeps working unchanged: `Build` and `Test` must still run on the version tag.

**Non-Goals:**
- Running CI on direct/merge pushes to `main` (explicitly dropped — the PR already validated the merge result).
- Distinguishing PR-merge pushes from direct pushes (a PR merge is delivered as a `push` to `main`; GitHub has no first-class filter, and we sidestep the problem by not building on `main` at all).
- Fork-PR secret/permission hardening, new test matrices, or changing what steps the workflows execute.

## Decisions

**Decision 1 — `build.yml` triggers become `pull_request` + tag push.**
```yaml
on:
  pull_request:
  push:
    tags:
      - 'v*.*.*'
```
The `pull_request` trigger (default activity types: opened, synchronize, reopened) covers "a PR is created or updated." The `push: tags` trigger is retained solely for the release chain — `Publish` polls for a successful `Build` run on the tagged commit (`publish.yml` lines 19–42) and downloads `plexis-dist` from it (lines 91–105). Dropping the tag trigger would make `Publish` hang and fail. The `branches` key is removed entirely.

*Alternative considered:* keep `push: branches: ['main']`. Rejected — the user chose to drop main CI; the merged result was already green on the PR, so a main rebuild is redundant, and excluding only PR-merge pushes is not reliably expressible in GitHub Actions (rebase merges carry no PR marker).

**Decision 2 — `docs.yml` trigger becomes `pull_request` only.**
```yaml
on:
  pull_request:
```
Docs has no release role, so no tag trigger. It only needs to validate that the docs site builds on a proposed change.

**Decision 3 — `test.yml`, `publish.yml`, `smoke-test.yml` are left untouched.**
`Test` triggers on `workflow_run: workflows: [Build]` and checks out `github.event.workflow_run.head_sha`, so it automatically follows whatever triggered `Build` — a PR head or a tag. `Publish` triggers on the tag; `Smoke Test` chains off `Publish`. None reference the removed `branches` trigger, so they need no edits. They are verified, not modified.

## Risks / Trade-offs

- **Risk: release chain breaks if the tag trigger is dropped or mistyped.** → The tag trigger is explicitly retained and covered by a spec scenario ("Release pipeline still has build and test on the tag"); verify by confirming `build.yml` still lists `push: tags: ['v*.*.*']` and that `Test` is reachable via `workflow_run` on a tag-triggered Build.
- **Risk: `workflow_run` (Test) not firing on PR-triggered builds.** → `workflow_run` fires regardless of what triggered the upstream workflow; the Test workflow definition is read from the default branch, which is unaffected. No change in behavior versus today.
- **Trade-off: no "main is green" signal.** → Accepted. Branch protection routes changes through PRs that already ran the identical CI; an independent main run adds cost without new information.
- **Risk: fork PRs run with a read-only token / no secrets.** → Out of scope; this is a single-maintainer repo and CI steps (typecheck/build/test/docs) need no secrets. The release chain (which needs `id-token`/npm) runs on tags, not PRs.
- **Cosmetic: README `Build` badge no longer reflects a `main` push** (main no longer builds); it shows the latest Build run and still links to the runs page. No action required.

## Migration Plan

1. Edit `build.yml` and `docs.yml` triggers as above on this branch.
2. Open a PR from this branch → confirm `Build`, `Test`, and `Docs` enqueue.
3. Confirm no run is enqueued for a subsequent plain branch push without a PR (observable historically: the WIP pushes that prompted this change should stop spawning runs).
4. Next release: push a `v*.*.*` tag → confirm `Build` → `Test` → `Publish` → `Smoke Test` completes end to end.
5. Rollback: revert the two-file diff to restore `push: branches: ['**']`.
