## ADDED Requirements

### Requirement: Authentication uses OIDC with npm provenance
The publish workflow SHALL authenticate to npm using GitHub-issued OIDC tokens and SHALL publish with npm provenance enabled. The workflow MUST grant `id-token: write` permission and MUST invoke publish with the `--provenance` flag (e.g., `pnpm publish --provenance`). The workflow MUST NOT depend on a long-lived npm credential stored in repository secrets.

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

## REMOVED Requirements

### Requirement: Authentication uses NPM_TOKEN repository secret
**Reason**: The publish workflow authenticates via GitHub OIDC and publishes with npm provenance (`pnpm publish --provenance`); a long-lived `NPM_TOKEN` is neither used nor required. Documenting it as required misleads maintainers and adds a credential-management burden that the workflow does not actually impose.
**Migration**: No action is required by maintainers. If an `NPM_TOKEN` secret was previously added to the repository, it may be removed. Going forward, ensure the npm package is configured on npmjs.com to trust the GitHub repository for OIDC-based publishing, and that the publish workflow grants `id-token: write` and passes `--provenance` to `pnpm publish` (see the new "Authentication uses OIDC with npm provenance" requirement).
