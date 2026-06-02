## 1. Confirm npm-side configuration

- [x] 1.1 Open the trusted-publisher record for `@tde.io/plexis` on npmjs.com (Package → Settings → Trusted Publisher / `https://www.npmjs.com/package/@tde.io/plexis/access`) and record the current workflow filename and any configured GitHub environment.
- [x] 1.2 Confirm the diagnosis: the record references `publish.yml` (or otherwise does not match `build.yml`), explaining the `ERR_PNPM_AUTH_TOKEN_EXCHANGE (404)` on the `v1.1.0` run.

## 2. Re-point the trusted-publisher record

- [x] 2.1 Set the trusted-publisher workflow file to `build.yml`, keeping owner/repo correct.
- [x] 2.2 If the record requires a GitHub environment, reconcile it: add the matching `environment:` to the `publish` job in `build.yml`; if none is required, leave the job environment-less. (No environment required — `publish` job left environment-less.)

## 3. Fail loudly on OIDC failure in the publish job

- [x] 3.1 Update the `publish` job in `.github/workflows/build.yml` so a skipped/failed OIDC token exchange fails the step with the OIDC error surfaced as the cause, instead of silently attempting an unauthenticated publish.
- [x] 3.2 Scope the guard narrowly to OIDC-exchange / `Skipped OIDC` signals so transient registry 5xx errors still surface as themselves; include a remediation hint pointing at the trusted-publisher record.
- [x] 3.3 Lint/validate the workflow YAML still parses and the `build` → `test` → `publish` job graph and `if: startsWith(github.ref, 'refs/tags/')` gate are unchanged.

## 4. Documentation

- [x] 4.1 Add a note to the release/contributing docs that the npm trusted-publisher record is coupled to the publishing workflow filename, and that moving/renaming the publish job requires updating npmjs.com in the same change.

## 5. Validation

- [x] 5.1 On the next `v*.*.*` tag push, confirm the `publish` job authenticates via OIDC (no `Skipped OIDC` warning) and publishes successfully.
- [x] 5.2 Verify the published version appears on npm with a provenance statement linked to the GitHub Actions run, and that the smoke-test workflow passes.
