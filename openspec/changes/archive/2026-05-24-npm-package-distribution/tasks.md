## 1. Prerequisites (manual, outside the repo)

- [x] 1.1 Confirm the `@tde.io` npm scope exists; create it if necessary.
- [x] 1.2 Generate an npm automation token with publish rights on the `@tde.io` scope.
- [x] 1.3 Add the token to the repository as the `NPM_TOKEN` secret.

## 2. Update package metadata for npm publishing

- [x] 2.1 Change `name` in `package.json` from `plexis` to `@tde.io/plexis`.
- [x] 2.2 Add `publishConfig` to `package.json` with `"access": "public"`.
- [x] 2.3 Verify `files` field includes exactly `dist`, `src`, `README.md`.
- [x] 2.4 Verify `main`, `module`, `types`, and `exports` fields all resolve into `dist/`.
- [x] 2.5 Add `repository`, `bugs`, and `homepage` fields pointing at the GitHub project (so npm displays the right links).
- [x] 2.6 Run `pnpm pack --dry-run` locally and confirm the tarball listing matches expectations (dist + src + README only).

## 3. Remove the legacy CI workflow

- [x] 3.1 Delete `.github/workflows/ci.yml`.

## 4. Create the build workflow

- [x] 4.1 Create `.github/workflows/build.yml` with `name: Build`.
- [x] 4.2 Configure triggers: `push` to `main` and `push` of tags matching `v*.*.*`.
- [x] 4.3 Set up checkout, pnpm (`pnpm/action-setup@v4`), Node 24 with `cache: 'pnpm'`.
- [x] 4.4 Install with `pnpm install --frozen-lockfile`.
- [x] 4.5 Run `pnpm typecheck`.
- [x] 4.6 Run `pnpm build`.
- [x] 4.7 Upload `dist/` as artifact `plexis-dist` via `actions/upload-artifact@v4`.

## 5. Create the test workflow

- [x] 5.1 Create `.github/workflows/test.yml` with `name: Test`.
- [x] 5.2 Configure trigger: `workflow_run` with `workflows: [Build]`, `types: [completed]`.
- [x] 5.3 Add a `if: ${{ github.event.workflow_run.conclusion == 'success' }}` guard on the job so test only runs when build succeeded.
- [x] 5.4 Set up checkout (use the build run's commit SHA), pnpm, Node 24 with `cache: 'pnpm'`.
- [x] 5.5 Install with `pnpm install --frozen-lockfile`.
- [x] 5.6 Download the `plexis-dist` artifact from the triggering build run via `actions/download-artifact@v4` (using `run-id` from the workflow_run event).
- [x] 5.7 Run `pnpm test`.

## 6. Create the publish workflow

- [x] 6.1 Create `.github/workflows/publish.yml` with `name: Publish`.
- [x] 6.2 Configure trigger: `push` of tags matching `v*.*.*`.
- [x] 6.3 Add a step that waits for the Build and Test workflows to conclude with `success` for the tagged commit SHA (e.g., poll `gh run list` or use a dedicated wait action).
- [x] 6.4 Add a guard step that fails the workflow if either Build or Test did not succeed for the tagged commit.
- [x] 6.5 Add a guard step that asserts the tag name (minus leading `v`) equals `package.json` `version`; fail on mismatch.
- [x] 6.6 Set up checkout, pnpm, Node 24.
- [x] 6.7 Install with `pnpm install --frozen-lockfile` (needed so `pnpm publish` works).
- [x] 6.8 Download the `plexis-dist` artifact from the build run keyed to the tagged commit; restore to `dist/`.
- [x] 6.9 Write `~/.npmrc` with `//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}` and `always-auth=true`.
- [x] 6.10 Run `pnpm publish --access public --no-git-checks`.
- [x] 6.11 Confirm no step echoes the token (no `set -x`, no `env | grep`, no debug logging of secrets).

## 7. Update README

- [x] 7.1 Replace the existing CI badge URL with the new build workflow badge URL (`.github/workflows/build.yml/badge.svg` and the corresponding `actions/workflows/build.yml` link).
- [x] 7.2 Update any badge alt-text from `CI` to `Build`.

## 8. Local verification

- [x] 8.1 Run `pnpm install --frozen-lockfile && pnpm typecheck && pnpm build && pnpm test` locally to confirm nothing broke.
- [x] 8.2 Run `pnpm pack --dry-run` and verify the tarball excludes `openspec/`, `.github/`, `examples/`, and test files.

## 9. Publishing dry run on a feature branch (optional but recommended)

- [ ] 9.1 Push the change to a feature branch and verify neither build nor test triggers (workflows are scoped to `main` and tags).
- [ ] 9.2 Merge to `main` and verify `build.yml` and `test.yml` both run and pass.

## 10. First publish

- [ ] 10.1 Confirm `package.json` `version` is the version you intend to release (e.g., `1.0.0`).
- [ ] 10.2 Create and push tag `v<version>` on the merged `main` commit.
- [ ] 10.3 Watch the publish workflow run; confirm it downloads the artifact and runs `pnpm publish`.
- [ ] 10.4 Verify `@tde.io/plexis@<version>` is visible on npmjs.com and installable via `npm install @tde.io/plexis`.
