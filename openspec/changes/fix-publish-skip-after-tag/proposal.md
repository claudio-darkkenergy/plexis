## Why

Publishing `@tde.io/plexis@1.1.0` failed. On the `v1.1.0` tag push the `build` and `test` jobs passed, but the `publish` job's `Publish to npm` step failed: pnpm logged `Skipped OIDC: ERR_PNPM_AUTH_TOKEN_EXCHANGE: ... (status code 404)`, fell back to an unauthenticated publish, and npm rejected it with `[E404] PUT https://registry.npmjs.org/@tde.io%2fplexis`. Versions 1.0.0–1.0.4 published successfully with the identical `pnpm publish --provenance` command, so OIDC trusted publishing was working — it broke when the publish step moved out of `publish.yml` and into `build.yml`.

npm trusted publishing binds the OIDC token exchange to a specific workflow **filename**: GitHub mints a token whose `job_workflow_ref` is `owner/repo/.github/workflows/<file>@<ref>`, and npm only completes the exchange if that filename matches the trusted-publisher record registered on npmjs.com. That record still references `publish.yml`, so tokens issued by `build.yml` no longer match. Today the mismatch is invisible: pnpm downgrades a hard auth failure to a `[WARN]`, then a confusing `E404` hides the real cause.

## What Changes

- Re-point the npm **trusted-publisher record** for `@tde.io/plexis` on npmjs.com from `publish.yml` to `build.yml` (the workflow that now performs the publish). This is an off-repo settings change captured as a task.
- Make the `publish` job **fail loudly** when OIDC token exchange is skipped, instead of silently falling back to an unauthenticated publish that surfaces a misleading `E404`. The job must surface the OIDC failure as the failure cause.
- Document that the npm trusted-publisher **workflow filename is coupled** to the workflow that runs `pnpm publish`, so any future move/rename of the publish job is accompanied by an npmjs.com config update.
- Keep the condensed single-workflow design (`build` → `test` → `publish` in `build.yml`); no revert to a separate publish workflow.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `npm-publishing`: The "Authentication uses OIDC with npm provenance" requirement is extended so the spec recognizes that OIDC trusted publishing is coupled to the publishing workflow filename, requires the npmjs.com trusted-publisher record to reference the workflow that actually runs `pnpm publish`, and requires the publish step to fail loudly (not silently fall back to an unauthenticated publish) when OIDC token exchange does not succeed.

## Impact

- **npmjs.com**: trusted-publisher record for `@tde.io/plexis` updated to `build.yml`.
- **`.github/workflows/build.yml`**: `publish` job gains an OIDC-failure guard so a skipped token exchange fails the step with a clear message.
- **Docs**: contributing / release docs note the workflow-filename ↔ npm trusted-publisher coupling.
- **Specs**: `openspec/specs/npm-publishing/spec.md` requirement on OIDC authentication amended.
- No change to package contents, entrypoints, version-bump scripts, or the build/test jobs.
