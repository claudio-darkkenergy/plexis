## MODIFIED Requirements

### Requirement: Trigger on pull requests and release tags

The build workflow SHALL run automatically on every `pull_request` event (opened, synchronized, or reopened) and on every push of a tag matching `v*.*.*`. The test workflow SHALL run automatically on completion of a build workflow run. Neither workflow MUST run on plain branch pushes — including pushes to `main` — that are not associated with a pull request or a `v*.*.*` tag.

#### Scenario: Opening a PR triggers a build run
- **WHEN** a pull request is opened against the repository
- **THEN** a new build workflow run is enqueued for the pull request's head commit

#### Scenario: Updating a PR triggers a build run
- **WHEN** a pull request is synchronized (new commits pushed) or reopened
- **THEN** a new build workflow run is enqueued for the updated head commit

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
- **WHEN** a commit is pushed to any branch and no pull request is open for it
- **THEN** no build or test workflow run is started

#### Scenario: Push to main does not trigger a run
- **WHEN** a commit is pushed to `main` (directly or via a merged PR) and the commit carries no `v*.*.*` tag
- **THEN** no build or test workflow run is started

#### Scenario: Release pipeline still has build and test on the tag
- **WHEN** a `v*.*.*` tag is pushed to cut a release
- **THEN** the build workflow runs on the tagged commit and uploads the `plexis-dist` artifact
- **AND** the test workflow runs after the build succeeds
- **AND** the publish workflow's waits for `Build` and `Test` on that commit are satisfied

## ADDED Requirements

### Requirement: Docs workflow is pull-request gated

The docs workflow (`.github/workflows/docs.yml`) SHALL run automatically on every `pull_request` event (opened, synchronized, or reopened) and MUST NOT run on plain branch pushes, including pushes to `main`. The docs workflow has no release responsibility and MUST NOT be triggered by `v*.*.*` tag pushes.

#### Scenario: Opening or updating a PR triggers a docs run
- **WHEN** a pull request is opened, synchronized, or reopened
- **THEN** a new docs workflow run is enqueued for the pull request's head commit

#### Scenario: Branch push does not trigger a docs run
- **WHEN** a commit is pushed to any branch (including `main`) and no pull request is open for it
- **THEN** no docs workflow run is started

#### Scenario: Tag push does not trigger a docs run
- **WHEN** a tag matching `v*.*.*` is pushed
- **THEN** no docs workflow run is started
