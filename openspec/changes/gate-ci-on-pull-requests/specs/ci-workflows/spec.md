## MODIFIED Requirements

### Requirement: Trigger on pull requests and release tags

The workflow SHALL run automatically on every `pull_request` event (opened, synchronized, or reopened) and on every push of a tag matching `v*.*.*`. The `publish` job within the workflow SHALL only run on tag pushes.

#### Scenario: Opening a PR triggers a run
- **WHEN** a pull request is opened against the repository
- **THEN** a new workflow run is enqueued for the pull request's head commit

#### Scenario: Updating a PR triggers a run
- **WHEN** a pull request is synchronized (new commits pushed) or reopened
- **THEN** a new workflow run is enqueued for the updated head commit

#### Scenario: Tag push triggers a run
- **WHEN** a tag matching `v*.*.*` is pushed
- **THEN** a new workflow run is enqueued

#### Scenario: A failed job stops the chain
- **WHEN** a job in the workflow fails
- **THEN** subsequent dependent jobs are not run

#### Scenario: Push to a feature branch does not trigger a run
- **WHEN** a commit is pushed to any branch and no pull request is open for it
- **THEN** no workflow run is started

#### Scenario: Push to main does not trigger a run
- **WHEN** a commit is pushed to `main` (directly or via a merged PR) and the commit carries no `v*.*.*` tag
- **THEN** no workflow run is started

#### Scenario: Release pipeline runs build, test, and publish on the tag
- **WHEN** a `v*.*.*` tag is pushed to cut a release
- **THEN** the `build`, `test`, and `publish` jobs run in sequence

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
