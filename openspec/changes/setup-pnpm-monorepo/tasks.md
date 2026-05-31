## 1. Prepare the workspace skeleton

- [x] 1.1 Create `packages/` and `apps/` directories at the repository root.
- [x] 1.2 Create `apps/docs/` and add an empty `.gitkeep` file so Git tracks the slot.
- [x] 1.3 Update `pnpm-workspace.yaml` to declare both `packages/*` and `apps/*` globs while retaining the existing `allowBuilds.esbuild: false` configuration.
- [x] 1.4 Update `.gitignore` to ignore `node_modules` and `dist` at any depth (e.g., add `**/node_modules` and `**/dist` rules, or confirm the existing `/node_modules` and `/dist` patterns are replaced with depth-agnostic ones).

## 2. Relocate the library into `packages/plexis/`

- [x] 2.1 Create `packages/plexis/`.
- [x] 2.2 Move `src/` to `packages/plexis/src/` (use `git mv` to preserve history).
- [x] 2.3 Move `tests/` to `packages/plexis/tests/` (use `git mv`).
- [x] 2.4 Move `examples/` to `packages/plexis/examples/` (use `git mv`).
- [x] 2.5 Move `tsconfig.json`, `tsconfig.types.json`, `rolldown.config.ts`, `vitest.config.ts`, and `vite.config.ts` into `packages/plexis/` (use `git mv`).
- [x] 2.6 Move the existing `package.json` to `packages/plexis/package.json` (use `git mv`). The library manifest's content (`name`, `version`, `exports`, `main`, `module`, `types`, `files`, `scripts`, `devDependencies`, `engines`, `packageManager`) is unchanged.
- [x] 2.7 Inspect `packages/plexis/tsconfig.json`, `packages/plexis/rolldown.config.ts`, `packages/plexis/vitest.config.ts`, and `packages/plexis/vite.config.ts` to confirm that all relative paths (`src/**/*`, `tests/**/*.test.ts`, `examples`, `path.resolve(root, 'src')`) still resolve correctly after the move; no edits should be required, but verify.

## 3. Write the new root `package.json`

- [x] 3.1 Create a fresh root `package.json` at the repository root containing only workspace-root concerns: `name` (e.g., `plexis-workspace`), `"private": true`, `packageManager: "pnpm@11.3.0"`, `engines: { "node": "24" }`, and a `scripts` block.
- [x] 3.2 In the root `scripts` block, define pass-through scripts: `build`, `test`, `typecheck` — each running `pnpm --filter @tde.io/plexis run <name>`.
- [x] 3.3 Confirm the root `package.json` declares no `main`, `module`, `types`, `exports`, or `files` field.
- [x] 3.4 Confirm the root `package.json` is `"private": true`.

## 4. Reconcile the lockfile and node_modules

- [x] 4.1 Delete the existing root `node_modules/` directory.
- [x] 4.2 Run `pnpm install` from the repository root. This rewrites `pnpm-lock.yaml` to use the new workspace project paths (`packages/plexis`) and produces a fresh `node_modules/` at the root and inside `packages/plexis/`.
- [x] 4.3 Inspect the resulting `pnpm-lock.yaml` diff and confirm that only `importers` paths have changed — no dependency versions, no new packages, no removals.
- [x] 4.4 Verify that no `pnpm-lock.yaml` files exist inside `packages/plexis/` or `apps/`.

## 5. Create the package-level README

- [x] 5.1 Create `packages/plexis/README.md`. Choose ONE of: (a) copy the current root `README.md` verbatim, or (b) write a focused library-only README that contains the Installation, Quick Start, Concepts, Zero-dependency, and License sections required by the `readme` capability (no monorepo layout section).
- [x] 5.2 Verify that `packages/plexis/README.md` opens with the one-line Plexis description and includes Installation, Quick Start (with the composable API and `await domain.follow(...)`), Concepts (Domain vs Pipeline), Zero-dependency claim, License section linking to `https://www.apache.org/licenses/LICENSE-2.0`, and the Release section reflecting OIDC + provenance with the version-bump command scoped to `packages/plexis/package.json`.
- [x] 5.3 Confirm all fenced code blocks in `packages/plexis/README.md` use long-form language hints (`typescript`, `bash`) — not short aliases (`ts`, `sh`).

## 6. Update the root README

- [x] 6.1 Add a "Repository layout" (or equivalent) section to the root `README.md` that names `packages/plexis/` as the source of the published `@tde.io/plexis` package and `apps/docs/` as the reserved slot for the future documentation site.
- [x] 6.2 Update the Release section in the root README to point at `packages/plexis/package.json` for the version bump. Show either `cd packages/plexis && npm version <patch|minor|major> --no-git-tag-version` or `pnpm --filter @tde.io/plexis exec npm version <patch|minor|major> --no-git-tag-version` as the canonical command.
- [x] 6.3 Confirm the root README still contains the Build/Test/Publish CI table, the OIDC + provenance note, and the Apache-2.0 license link to `https://www.apache.org/licenses/LICENSE-2.0`.
- [x] 6.4 Confirm fenced code blocks in the root README use long-form language hints (`typescript`, `bash`).

## 7. Update CI workflow: `build.yml`

- [x] 7.1 In `.github/workflows/build.yml`, keep the existing `pnpm/action-setup@v4` and `actions/setup-node@v4` steps unchanged (they install pnpm globally and rely on the root `pnpm-lock.yaml` for the `cache: 'pnpm'` key).
- [x] 7.2 Keep `pnpm install --frozen-lockfile` as the install step running at the repository root (no `working-directory:` override).
- [x] 7.3 Keep `pnpm typecheck` and `pnpm build` as the typecheck and build steps — these now resolve to the root pass-throughs that filter into `@tde.io/plexis`.
- [x] 7.4 Update the `actions/upload-artifact@v4` step's `path:` from `dist/` to `packages/plexis/dist/`.

## 8. Update CI workflow: `test.yml`

- [x] 8.1 In `.github/workflows/test.yml`, keep the install step (`pnpm install --frozen-lockfile`) running at the repository root.
- [x] 8.2 Update the `actions/download-artifact@v4` step's `path:` from `dist/` to `packages/plexis/dist/`.
- [x] 8.3 Keep `pnpm test` as the test command — it resolves to the root pass-through that filters into `@tde.io/plexis`.

## 9. Update CI workflow: `publish.yml`

- [x] 9.1 In `.github/workflows/publish.yml`, keep the "Wait for Build to succeed" and "Wait for Test to succeed" steps unchanged (they poll workflow run status, not file paths).
- [x] 9.2 Update the "Verify tag version matches package.json" step to read from `packages/plexis/package.json` — change `require('./package.json').version` to `require('./packages/plexis/package.json').version`.
- [x] 9.3 Keep the install step (`pnpm install --frozen-lockfile`) running at the repository root.
- [x] 9.4 Keep the `gh run list` build-run lookup unchanged.
- [x] 9.5 Update the `actions/download-artifact@v4` step's `path:` from `dist/` to `packages/plexis/dist/`.
- [x] 9.6 Update the "Publish to npm" step to set `working-directory: packages/plexis` so that `pnpm publish --access public --no-git-checks --provenance` runs inside the library package directory.
- [x] 9.7 Confirm the workflow still declares `permissions: { id-token: write, actions: read, contents: read }` and does not reference any `NPM_TOKEN` secret.

## 10. Update auxiliary configuration files

- [x] 10.1 Update `CLAUDE.md`'s "Current State" section so the path references (`src/types.ts`, `src/tsconfig*.json`, root `package.json`) point at `packages/plexis/src/types.ts`, `packages/plexis/tsconfig*.json`, and `packages/plexis/package.json`. Replace the "Root `package.json` — Minimal" bullet with a "Root `package.json` is a private workspace root with pass-through scripts" bullet.
- [x] 10.2 Inspect `plexis.code-workspace`. If it lists folders, update the entries to reflect the new layout (root + `packages/plexis` + `apps/docs`). Leave untouched if it only references the root.

## 11. Verify the build end to end

- [x] 11.1 From the repository root, run `pnpm install` and confirm it completes without errors and without modifying the lockfile after the rewrite (`git diff pnpm-lock.yaml` should be clean on the second install).
- [x] 11.2 From the repository root, run `pnpm typecheck` and confirm it exits 0.
- [x] 11.3 From the repository root, run `pnpm build` and confirm it produces `packages/plexis/dist/esm/`, `packages/plexis/dist/cjs/`, and `packages/plexis/dist/types/` (each containing an `index.*` file).
- [x] 11.4 From the repository root, run `pnpm test` and confirm all tests pass.
- [x] 11.5 From `packages/plexis/`, run `pnpm run example:order`, `pnpm run example:payment`, and `pnpm run example:graph` and confirm each exits 0 with readable output.
- [x] 11.6 From `packages/plexis/`, run `pnpm pack --dry-run` and inspect the file listing. Confirm: the tarball includes `package.json`, `README.md`, and the `dist/` and `src/` trees; it excludes `tests/`, `examples/`, `openspec/`, `.github/`, and any `*.test.ts` files.

## 12. Verify CI configuration locally before pushing

- [x] 12.1 Lint each updated workflow YAML by parsing it (e.g., `yq eval '.' .github/workflows/build.yml`) to catch syntax errors before pushing.
- [x] 12.2 Trace each workflow step and confirm: (a) every `pnpm install --frozen-lockfile` runs without a `working-directory:` override, (b) every artifact `path:` is `packages/plexis/dist/`, (c) the publish step has `working-directory: packages/plexis`, (d) the version-check step reads `packages/plexis/package.json`.
- [x] 12.3 Updated Build trigger to `branches: ['**']` so it fires on push to any branch (intentional change from main-only).

## 13. Smoke-test the publish path (without actually publishing)

- [x] 13.1 Merge the change to `main` and confirm a Build run starts and uploads `plexis-dist` containing the contents of `packages/plexis/dist/`.
- [x] 13.2 Confirm the Test workflow downloads the artifact into `packages/plexis/dist/` and `pnpm test` passes.
- [x] 13.3 DO NOT push a release tag until task 13.4 passes.
- [x] 13.4 On a maintainer machine, run `cd packages/plexis && pnpm pack` and compare the resulting tarball's file listing against the most recent published version (`npm view @tde.io/plexis@1.0.2 dist.tarball` and inspect contents). They MUST match in structure; the only acceptable diff is content that legitimately changed in `src/` or `dist/`.
- [x] 13.5 Once 13.4 passes, bump `packages/plexis/package.json` to a patch version (e.g., `1.0.3`), merge, and push tag `v1.0.3` to trigger Publish.
- [x] 13.6 After publish, run `npm install @tde.io/plexis@<new-version>` in a clean directory and confirm both `import('@tde.io/plexis')` (ESM) and `require('@tde.io/plexis')` (CJS) resolve and expose the expected named exports.

## 14. Clean up

- [x] 14.1 Remove any leftover empty directories at the repository root (`src/`, `tests/`, `examples/` should no longer exist).
- [x] 14.2 Remove `/src`, `/dist`, `/tests`, `/examples` lines from `.gitignore` if they were left behind from the old layout (the depth-agnostic `**/node_modules` and `**/dist` rules from task 1.4 supersede them).
- [x] 14.3 Commit with a clear message such as `refactor: adopt pnpm monorepo with packages/plexis and apps/docs slot` and ensure the diff shows file moves (renames) rather than deletes+adds where possible.
