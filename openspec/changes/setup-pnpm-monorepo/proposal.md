## Why

The repository currently mixes the published library (`src/`, `tests/`, build configs, examples) with future docs-site needs at the root. A documentation site is the next deliverable, but it cannot live alongside the library without conflating two distinct build graphs, two `package.json` files, and two release cadences. Establishing a proper pnpm workspace now — before the docs app exists — moves the library into a package boundary, keeps a single lockfile and shared tooling at the root, and creates a predictable home (`apps/docs`) for the future docs site without any churn to consumers of `@tde.io/plexis`.

## What Changes

- Adopt a pnpm workspace layout with two top-level directories: `packages/` for publishable libraries and `apps/` for non-published applications.
- Relocate the current library sources and tooling from the repository root into `packages/plexis/`:
  - Move `src/`, `tests/`, `examples/`, `tsconfig.json`, `tsconfig.types.json`, `rolldown.config.ts`, `vitest.config.ts`, `vite.config.ts`, and the library `package.json` into `packages/plexis/`.
  - The library's published `name` (`@tde.io/plexis`), version, and public `exports` paths remain unchanged.
- Rewrite the root `package.json` as a private workspace root (`"private": true`) holding only workspace-wide tooling and pass-through scripts that delegate to the library via `pnpm --filter @tde.io/plexis ...`.
- Expand `pnpm-workspace.yaml` to declare `packages/*` and `apps/*` as workspace globs, while retaining the existing `allowBuilds` configuration.
- Reserve the `apps/docs/` directory for the future documentation site (no docs implementation in this change — just the workspace slot and `.gitkeep`).
- Update all three GitHub Actions workflows (`build.yml`, `test.yml`, `publish.yml`) to:
  - Run typecheck, build, and test against the library package (using `pnpm --filter @tde.io/plexis` or working-directory-scoped steps).
  - Upload and download the build artifact from `packages/plexis/dist/` rather than the root `dist/`.
  - Publish from `packages/plexis/` so `pnpm publish` resolves the package's own `package.json` and tarball.
- Update `README.md` to: (a) describe the monorepo layout briefly so contributors know where the library lives, (b) keep the same install/quick-start instructions for end users (no consumer-facing change), and (c) update the release section to reflect that the version bump happens in `packages/plexis/package.json`.
- Update `.gitignore` to ignore `node_modules` and `dist` recursively (workspace nesting) and update `CLAUDE.md`'s "Current State" and "Architecture" sections to point at the new package paths.
- Move the existing `pnpm-lock.yaml` semantics over to the new workspace (a single root lockfile is preserved; package-level lockfiles are forbidden).

**Non-goals.** This change does **not**: create the docs site, change the public library API, change the published package's `name`/`version`/`exports`, alter the release tag format (`v*.*.*`), or introduce additional packages beyond the library.

## Capabilities

### New Capabilities
- `monorepo-workspace`: Defines the repository's pnpm workspace structure — root layout, package/app conventions, root-level scripts that delegate via filters, and the rule that the workspace has a single root lockfile.

### Modified Capabilities
- `ci-workflows`: Build, test, and publish workflows must operate against the library package inside the workspace rather than the repository root. Artifact paths, working directories, and command invocations shift to use pnpm filters.
- `npm-publishing`: Publish step runs against `packages/plexis/`. The `files` allowlist, `exports`, `main`, `module`, and `types` paths in the package's `package.json` are unchanged in meaning, but live inside the package directory; the tag-version check reads `packages/plexis/package.json`.
- `readme`: README gains a short "Repository layout" note so contributors find the library at `packages/plexis/`. End-user install/quick-start sections stay equivalent. Release instructions reference the package path for the version bump.
- `source-language`: Requirements referencing `src/`, `src/core/`, `src/graph/`, and `src/index.ts` are rewritten to use the path prefix `packages/plexis/`.
- `examples`: Requirements referencing `examples/` are rewritten to use `packages/plexis/examples/`, and `npm run example:*` scripts become `pnpm --filter @tde.io/plexis run example:*` (or remain runnable directly inside the package).

## Impact

- **Affected code & files:** `package.json` (root, rewritten); new `packages/plexis/package.json` (the existing library manifest, relocated); `pnpm-workspace.yaml`; `tsconfig.json`, `tsconfig.types.json`, `rolldown.config.ts`, `vitest.config.ts`, `vite.config.ts` (relocated into the package); `src/`, `tests/`, `examples/` (relocated into the package); `.gitignore`; `.github/workflows/build.yml`, `test.yml`, `publish.yml`; `README.md`; `CLAUDE.md`; `plexis.code-workspace`.
- **Public API:** None. The published package name, entrypoints, and types remain `@tde.io/plexis` with the same `dist/` layout.
- **Dependencies:** No new runtime dependencies. Existing devDependencies stay with the library package; only meta-tooling (if any) lives at the root.
- **Tooling assumptions:** Requires `pnpm@11.3.0` (already declared in `packageManager`) and continues to require Node 24.
- **Release process:** Tag format unchanged (`v*.*.*`). Version bump now edits `packages/plexis/package.json`. The publish workflow's tag-vs-package version check reads from the package's manifest.
- **Risk areas:** Path drift in CI workflows is the highest-risk surface — wrong working directory or filter would cause `pnpm publish` to publish the wrong manifest. The tasks list mitigates this with a dry-run `pnpm pack` check inside `packages/plexis/`.
