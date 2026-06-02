## Context

`@tde.io/plexis` publishes to npm via **OIDC trusted publishing** (no stored `NPM_TOKEN`). Versions 1.0.0–1.0.4 published successfully from a dedicated `publish.yml` workflow using `pnpm publish --provenance`. A later "Simplify CI" change folded the publish step into `build.yml` as a third job (`build` → `test` → `publish`) and deleted `publish.yml`.

The `v1.1.0` tag push then failed at publish time. Verified from run `26792903795`:

- `build`: success, `test`: success, `publish`: **failure** (not skipped).
- Publish job steps 1–7 (checkout, setup, install, artifact download, version verify) all succeeded; step 8 `Publish to npm` failed.
- Step 8 log:
  - `[WARN] Skipped OIDC: ERR_PNPM_AUTH_TOKEN_EXCHANGE: Failed token exchange request with body message: Unknown error (status code 404)`
  - `[E404] 404 Not Found - PUT https://registry.npmjs.org/@tde.io%2fplexis - Not found`

Root cause: npm trusted publishing matches the OIDC token's `job_workflow_ref` (which embeds the workflow **filename**) against the trusted-publisher record on npmjs.com. That record was created for `publish.yml`; tokens minted by `build.yml` no longer match, so the exchange 404s. pnpm then downgrades the auth failure to a warning and attempts an anonymous publish, which npm rejects with a misleading `E404`.

Constraint: the `npm-publishing` spec forbids long-lived npm credentials in secrets, so re-pointing the trusted-publisher record (not adding a token) is the sanctioned fix.

## Goals / Non-Goals

**Goals:**
- Restore successful OIDC-authenticated publishing for tag pushes while keeping the condensed single-workflow design.
- Make a future OIDC/auth failure diagnosable in one glance instead of buried under `E404`.
- Encode the workflow-filename ↔ trusted-publisher coupling in the spec and docs so it is not silently re-broken.

**Non-Goals:**
- Restoring a separate `publish.yml` workflow (rejected — would revert the condensation).
- Introducing an `NPM_TOKEN`/`NODE_AUTH_TOKEN` fallback (violates the no-long-lived-credential requirement).
- Changing package contents, entrypoints, version-bump scripts, the `build`/`test` jobs, or the publish trigger/version-verify logic.

## Decisions

**Decision 1 — Re-point the npm trusted-publisher record to `build.yml`.**
The publishing workflow is now `build.yml`; the npmjs.com trusted-publisher record for `@tde.io/plexis` must name `build.yml`. This is an off-repo settings change on npmjs.com (Package → Settings → Trusted Publisher), captured as an explicit task. Alternative considered: restore `publish.yml` to match the existing record — rejected because it undoes the deliberate condensation. Alternative considered: add a stored token — rejected by the no-long-lived-credential constraint.

**Decision 2 — Confirm the npm-side config before/while changing it.**
The filename mismatch is the leading hypothesis but the npm record could also pin a GitHub **environment** or be absent entirely. The release runbook step is: open the trusted-publisher record, verify owner/repo, set workflow file to `build.yml`, and note any required `environment`. If an environment is required, add `environment: <name>` to the `publish` job (and to the trusted-publisher record) — otherwise leave the job environment-less.

**Decision 3 — Fail loudly on OIDC token-exchange failure.**
Today pnpm's `[WARN] Skipped OIDC` is non-fatal and the run only fails later with a confusing `E404`. Add a guard to the `publish` job so a skipped/failed OIDC exchange fails the step with the OIDC error as the visible cause. Approach: avoid the silent anonymous fallback. Options, in order of preference:
  1. Run a preflight that asserts an OIDC token is obtainable/exchangeable and fail with a clear message if not.
  2. Capture `pnpm publish` output and fail the step if `Skipped OIDC` / `ERR_PNPM_AUTH_TOKEN_EXCHANGE` appears, echoing a remediation hint that points at the trusted-publisher record.
The exact mechanism is an implementation detail for the tasks phase; the requirement is only that an OIDC failure surfaces as the cause and no unauthenticated publish is attempted.

**Decision 4 — Document the coupling.**
Add a short note to the release/contributing docs: the npm trusted-publisher record is bound to the publishing workflow filename; moving or renaming the publish job requires updating npmjs.com in the same change.

## Risks / Trade-offs

- **The real npm record differs from the hypothesis (e.g., requires an environment, or none exists)** → The runbook step inspects the record first and adapts (add `environment:` or create the record) rather than blindly editing a filename.
- **Off-repo change is not enforceable by CI** → Mitigated by the fail-loud guard (Decision 3): if the record is still wrong, the next tag run fails immediately with a clear OIDC message instead of a misleading `E404`.
- **Verification requires consuming a real version tag** → A failed publish is non-destructive (the version simply isn't published; tags can be deleted/re-pushed or a patch version cut). Validate on the next release tag; do not burn `1.1.0` speculatively if it complicates downstream expectations.
- **Fail-loud guard could false-positive on transient npm 5xx** → Scope the guard narrowly to OIDC-exchange / skipped-OIDC signals, not all publish errors, so genuine registry hiccups still surface as themselves.

## Migration Plan

1. Inspect the trusted-publisher record for `@tde.io/plexis` on npmjs.com; record current workflow file and any environment.
2. Set the workflow file to `build.yml` (and reconcile environment with the `publish` job if required).
3. Add the fail-loud OIDC guard to the `publish` job in `build.yml`.
4. Update the `npm-publishing` spec and release docs.
5. Validate on the next `v*.*.*` tag push: `publish` job authenticates via OIDC and the version appears on npm with a provenance statement.

Rollback: the guard and doc/spec edits are inert if reverted; the npmjs.com record can be pointed back to `publish.yml` only if `publish.yml` is also restored.
