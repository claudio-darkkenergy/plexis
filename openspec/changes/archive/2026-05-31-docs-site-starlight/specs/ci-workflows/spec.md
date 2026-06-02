## ADDED Requirements

### Requirement: docs.yml is part of the CI workflow suite

The repository's CI workflow suite SHALL include `.github/workflows/docs.yml` alongside `build.yml`, `test.yml`, `publish.yml`, and `smoke-test.yml`. The docs workflow is independent — it does not trigger from or block any other workflow.

#### Scenario: docs.yml exists alongside other workflows

- **WHEN** a developer inspects `.github/workflows/`
- **THEN** the files `build.yml`, `test.yml`, `publish.yml`, `smoke-test.yml`, and `docs.yml` all exist

#### Scenario: docs.yml does not gate library CI

- **WHEN** the docs workflow fails
- **THEN** the build, test, publish, and smoke-test workflows are unaffected and continue normally
