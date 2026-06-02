## MODIFIED Requirements

### Requirement: Authentication uses OIDC with npm provenance

The publish workflow SHALL authenticate to npm using GitHub-issued OIDC tokens and SHALL publish with npm provenance enabled. The workflow MUST grant `id-token: write` permission and MUST invoke publish with the `--provenance` flag (e.g., `pnpm publish --provenance`). The workflow MUST NOT depend on a long-lived npm credential stored in repository secrets.

OIDC trusted publishing is coupled to the publishing workflow's **filename**: GitHub issues an OIDC token whose `job_workflow_ref` is `<owner>/<repo>/.github/workflows/<file>@<ref>`, and npm completes the token exchange only when `<file>` matches the trusted-publisher record configured for the package on npmjs.com. The npmjs.com trusted-publisher record for `@tde.io/plexis` MUST reference the workflow file that actually runs `pnpm publish` (currently `build.yml`). If the publish step is ever moved or its workflow file renamed, the trusted-publisher record MUST be updated in the same change.

The publish step MUST fail loudly when OIDC token exchange does not succeed. It MUST NOT silently fall back to an unauthenticated publish (which npm rejects with a misleading `E404`). A skipped or failed OIDC token exchange MUST cause the `publish` job to fail with the OIDC failure surfaced as the cause.

#### Scenario: Workflow grants id-token write permission
- **WHEN** a maintainer inspects the publish workflow
- **THEN** the workflow declares `permissions: { id-token: write }` at the workflow or job scope

#### Scenario: Publish runs with provenance
- **WHEN** the publish workflow runs `pnpm publish`
- **THEN** the command includes the `--provenance` flag
- **AND** the published package on npm shows a provenance statement linked to the GitHub Actions run

#### Scenario: No long-lived npm token in secrets
- **WHEN** a maintainer audits the publish workflow and repository secrets
- **THEN** the workflow does not read any `NPM_TOKEN`, `NPM_AUTH_TOKEN`, or equivalent long-lived npm credential
- **AND** no such secret is required to exist for a publish to succeed

#### Scenario: Trusted-publisher record matches the publishing workflow file
- **WHEN** the `publish` job runs `pnpm publish --provenance` from `.github/workflows/build.yml` on a `v*.*.*` tag push
- **THEN** the npmjs.com trusted-publisher record for `@tde.io/plexis` names `build.yml` as the workflow file
- **AND** the OIDC token exchange succeeds and the publish is authenticated

#### Scenario: OIDC token exchange failure fails the job
- **WHEN** the OIDC token exchange is skipped or fails (e.g., the trusted-publisher record does not match the workflow file)
- **THEN** the `publish` job fails with the OIDC failure reported as the cause
- **AND** the job does NOT proceed to an unauthenticated publish attempt
