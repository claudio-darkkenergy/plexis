## Context

Plexis today is a flat repository: the library sources live in `src/`, tests in `tests/`, examples in `examples/`, and all build tooling (`rolldown.config.ts`, `tsconfig*.json`, `vitest.config.ts`, `vite.config.ts`) sits at the root next to a single `package.json` that doubles as both the workspace manifest and the published manifest. Pnpm is already the package manager (`packageManager: pnpm@11.3.0`), and a `pnpm-workspace.yaml` file exists but only declares `allowBuilds` — no `packages:` glob, so today the repo is effectively a single-package workspace.

The next deliverable is a documentation site. Two motivations drive a true monorepo *before* adding docs:

1. The docs app will have its own dependency graph (likely a framework like Astro/Next), its own build, and a non-publishable nature — keeping it at the root would require fighting the library's `package.json`, build, and CI conventions.
2. The library is already shipping (`@tde.io/plexis` 1.0.2 on npm). Restructuring its location *after* the docs site is added would force two simultaneous reorgs. Doing the move first means the docs site can be dropped in cleanly with no library-side churn.

Constraints we must honor:
- The published package (`@tde.io/plexis`) must be byte-for-byte equivalent post-move — same `name`, `version`, `exports`, `main`, `module`, `types`, `files` allowlist, and tarball contents.
- The release pipeline must remain tag-driven (`v*.*.*`) with OIDC + provenance.
- Zero dependencies in the library remains inviolate.
- A single root `pnpm-lock.yaml` is the only lockfile (workspace contract).
- The existing `allowBuilds: { esbuild: false }` in `pnpm-workspace.yaml` must be preserved.

Stakeholders: library consumers (must see no change), maintainers (release flow shifts by one path), future docs author (needs a place to drop an app), and CI (workflows need new paths/filters).

## Goals / Non-Goals

**Goals:**
- Establish a pnpm workspace with explicit `packages/*` and `apps/*` globs.
- Relocate the library into `packages/plexis/` with all of its tooling co-located (so the package is self-contained and could in principle be extracted).
- Keep the public npm package identity stable: same name, same entrypoints, same tarball shape.
- Update the three GitHub Actions workflows (`build.yml`, `test.yml`, `publish.yml`) to operate on the workspace correctly — using `pnpm --filter` and the new `packages/plexis/dist/` artifact path.
- Update `README.md` and `CLAUDE.md` so contributors find the library at its new path.
- Reserve `apps/docs/` as a workspace slot for the future docs site without scaffolding it.

**Non-Goals:**
- Building or scaffolding the docs site (any framework choice, content, routing, deploy target).
- Changing the library's public API, version, or runtime behavior.
- Splitting the library into sub-packages (e.g., `@tde.io/plexis-core` + `@tde.io/plexis-graph`). The library stays one package.
- Introducing Turborepo, Nx, Changesets, or any workspace orchestration tool beyond pnpm itself.
- Adding pull-request CI triggers (the existing push-only model is preserved as-is).
- Migrating to ESM-only `package.json` semantics in the root (the root is private and irrelevant to publishing).
- Modifying the OpenSpec change/spec workflow tooling.

## Decisions

### Decision 1: Workspace layout uses `packages/` and `apps/`

The root will declare two globs in `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - apps/*
allowBuilds:
  esbuild: false
```

`packages/*` holds publishable libraries (today: just `plexis`). `apps/*` holds end-user applications and sites (today: empty, but reserved for `apps/docs`).

**Why two directories instead of one (`packages/*` only)?** A flat namespace conflates publishable libraries with non-publishable apps. Tooling, CI conventions, and human navigation are all easier when the distinction is encoded in the path: anything under `apps/` is private (`"private": true`) and never published; anything under `packages/` is a candidate for npm. This convention is widely understood (Turborepo, Nx, Rush, and pnpm itself document it).

**Alternative considered: a single `packages/*` glob.** Rejected because it requires per-package `"private": true` discipline to avoid accidentally publishing the docs app, and makes it harder for contributors to scan the tree.

**Alternative considered: separate `libs/` and `sites/`.** Rejected because `packages/` and `apps/` are the dominant pnpm convention; using non-standard names creates friction for tools and contributors.

### Decision 2: The library package directory is `packages/plexis/`

The directory name (`plexis`) is the unscoped portion of the published name (`@tde.io/plexis`). This is the standard pnpm convention. Inside that directory live `src/`, `tests/`, `examples/`, the four config files (`tsconfig.json`, `tsconfig.types.json`, `rolldown.config.ts`, `vitest.config.ts`, `vite.config.ts`), and the library's `package.json`.

**Why co-locate the build/test configs with the package?** Because each package owns its own build graph in a monorepo. If a second package is ever added, it would have its own configs; sharing them at the root makes it harder to evolve the library's tooling without affecting hypothetical siblings. Co-location also means `cd packages/plexis && pnpm build` works without any filter magic — a useful escape hatch during development.

**Alternative considered: keep configs at the root, only move `src/` and `tests/`.** Rejected because it spreads the library's surface across two locations, complicates path resolution in `tsconfig.json` and `rolldown.config.ts`, and makes the publish step harder (the publish workflow needs to find the package, not the root).

### Decision 3: Root `package.json` is a private workspace root with pass-through scripts

The new root `package.json` will be private (`"private": true`), have no `main`/`module`/`types`/`exports`/`files` fields, and contain pass-through scripts that delegate to the library via `pnpm --filter`:

```json
{
  "name": "plexis-workspace",
  "private": true,
  "scripts": {
    "build": "pnpm --filter @tde.io/plexis run build",
    "test": "pnpm --filter @tde.io/plexis run test",
    "typecheck": "pnpm --filter @tde.io/plexis run typecheck"
  },
  "packageManager": "pnpm@11.3.0",
  "engines": { "node": "24" }
}
```

This means existing CI commands (`pnpm typecheck`, `pnpm build`, `pnpm test`) continue to work verbatim from the repo root, which minimizes workflow diff and preserves muscle memory.

**Why pass-throughs instead of running filters directly in CI?** Pass-throughs decouple CI from the workspace's internal filter syntax. If the package were ever renamed or moved, only the root `package.json` needs editing — CI stays identical. They also make local development match CI exactly.

**Alternative considered: a bare root with no scripts.** Rejected because every CI step and every contributor would need to know and type the `--filter @tde.io/plexis` form. Pass-throughs are a small file and a large convenience.

### Decision 4: Each workflow uses pass-through root scripts where possible; publish uses a `working-directory`

The CI workflows have three operations to update:

- `build.yml`: install at root, then run `pnpm typecheck` and `pnpm build` (root pass-throughs). The `upload-artifact` step must point at `packages/plexis/dist/`.
- `test.yml`: install at root, then `pnpm test` (root pass-through). The `download-artifact` `path:` must be `packages/plexis/dist/`.
- `publish.yml`: install at root, download artifact into `packages/plexis/dist/`, verify version against `packages/plexis/package.json` (path-prefixed), and `cd packages/plexis && pnpm publish ...` (or use `pnpm publish --filter @tde.io/plexis` — see sub-decision below).

**Sub-decision: `pnpm publish` is invoked via `working-directory: packages/plexis` rather than `--filter`.** `pnpm publish --filter` exists but its semantics around scoped access, provenance, and `--no-git-checks` have been less stable across pnpm versions than running `pnpm publish` directly inside the package. Using `working-directory` is the most boring choice and matches what a maintainer would do manually.

**Why not also run typecheck/build via `working-directory`?** Because the root pass-throughs already encapsulate the filter. Using `working-directory` for publish is a single, deliberate exception driven by `pnpm publish` semantics.

### Decision 5: Reserve `apps/docs/` with a `.gitkeep`, no scaffolding

The directory `apps/docs/` will be created with only a `.gitkeep` file so it shows up in the repo tree. No `package.json`, no framework choice, no placeholder index.

**Why a `.gitkeep` and not nothing?** Without it, `apps/` would be empty and Git wouldn't track it; future contributors wouldn't see the slot. A `.gitkeep` is the standard inert sentinel.

**Alternative considered: scaffold a minimal `package.json` under `apps/docs/`.** Rejected because that requires a framework decision (Astro? Next? VitePress?) and pulls in dependencies, both out of scope for this change. Better to land an empty slot and pick a framework when the docs work actually begins.

### Decision 6: The published package name (`@tde.io/plexis`) does not change

The `packages/plexis/package.json` retains:

```json
{
  "name": "@tde.io/plexis",
  "version": "1.0.2",
  "exports": { ... unchanged ... },
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "files": ["dist", "src", "README.md"]
}
```

The `files` allowlist lists `README.md` — under the new layout, the package's `README.md` must live at `packages/plexis/README.md` (relative to its own `package.json`) for `pnpm publish` to include it in the tarball. We will create a package-level `README.md` that is either a copy of the root `README.md` or a focused library-only README. (The exact content is a tasks.md detail; the requirement is "a `README.md` exists at `packages/plexis/README.md` and is included in the tarball.")

**Alternative considered: change `files` to reference `../README.md`.** Rejected — `pnpm publish` resolves `files` relative to the package directory and the npm tarball spec does not permit parent-directory paths. The only correct fix is a package-level README.

### Decision 7: Vitest's existing config and `vite.config.ts` move into the package unchanged

`vitest.config.ts` and `vite.config.ts` reference paths like `'tests/**/*.test.ts'` and `path.resolve(root, 'src')`. Once relocated into `packages/plexis/`, those relative paths resolve correctly because they're relative to the config's own directory. No content change is needed beyond the file move.

**Risk:** `vite.config.ts` references `root: 'examples'` and an alias for `../src`. Both still resolve correctly after the move because `examples/` and `src/` are siblings of the config inside `packages/plexis/`.

### Decision 8: The OpenSpec directory stays at the repository root

`openspec/` is not a package; it is workspace-wide planning state. It remains at the repo root and is not declared in `pnpm-workspace.yaml`.

**Why?** Because spec-driven changes can span multiple packages (today: library; tomorrow: docs). Putting `openspec/` inside `packages/plexis/` would force docs-affecting changes to live in the wrong directory.

## Risks / Trade-offs

- **[Risk] Publish workflow publishes from the wrong directory and ships an empty or wrong tarball** → **Mitigation:** Two-step verification in tasks.md: (1) the version-check step `cat packages/plexis/package.json | node -p ...` must read from the new path, and (2) the tasks list mandates a local `cd packages/plexis && pnpm pack --dry-run` check before the first tagged release on the new layout. The first tagged release after this change should be a patch bump that produces an identical-shape tarball, validated against the previous release's file listing.
- **[Risk] `README.md` drift between root and `packages/plexis/`** → **Mitigation:** The package-level README either (a) is the same content as the root README, or (b) is a focused library README and the root README links to it. Either is acceptable; the tasks list will pick one and the README spec delta records the choice.
- **[Risk] Examples and tests reference `../src/index.js` (tsx/Vite resolve `.js` → `.ts`) and could break with new relative paths** → **Mitigation:** After the move, all of `src/`, `tests/`, `examples/` live as siblings inside `packages/plexis/`, so existing relative imports continue to resolve identically. The test suite is the verification.
- **[Risk] Workflow `cache: 'pnpm'` resolution changes** → **Mitigation:** `cache: 'pnpm'` keys off `pnpm-lock.yaml` at the workflow's working directory. The lockfile remains at the repository root and `actions/setup-node@v4` finds it there, unchanged. No action needed.
- **[Risk] Coverage `include` glob in `vitest.config.ts` (`src/core/**/*.ts`) becomes ambiguous** → **Mitigation:** The path is relative to the config file's directory. Once the config sits in `packages/plexis/`, the glob resolves to `packages/plexis/src/core/**/*.ts`, which is correct. No change to the glob is needed.
- **[Risk] The root `pnpm-lock.yaml` regenerates and produces unexpected diffs** → **Mitigation:** The library's dependencies are unchanged. A `pnpm install --frozen-lockfile` in CI catches drift; locally, the maintainer runs `pnpm install` once to rewrite paths in the lockfile (workspace projects are tracked by path in pnpm lockfiles).
- **[Trade-off] Two `README.md` files (root + package) instead of one** → Accepted because `pnpm publish` requires the README to be inside the package, and the root README still serves first-time GitHub visitors. The duplication is small and well-bounded; if it becomes painful, a CI check or a release-time copy script can keep them in sync.
- **[Trade-off] Slightly slower local commands** because root scripts now spawn `pnpm --filter` → Negligible (one extra process per invocation). Direct development inside `packages/plexis/` bypasses this entirely.
