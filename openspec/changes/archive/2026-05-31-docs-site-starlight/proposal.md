## Why

Plexis has no documentation site — consumers must read source code, types, and the README to understand the library. A dedicated site with conceptual guides and a hand-authored API reference significantly lowers the barrier to adoption and makes the state machine / pipeline model tangible to first-time users.

The site tracks the **in-development ("next") version** of the library from the workspace, keeping documentation and code in lockstep within the monorepo: an API change and its docs land in the same PR.

## What Changes

- Scaffold `apps/docs/` as a new Astro Starlight site with its own `package.json` (`@tde.io/docs`, `"private": true`).
- Add `docs` and `docs:build` pass-through scripts to the root `package.json` that delegate to `@tde.io/docs`.
- Author initial documentation content in MDX covering: Quick Start, Domain concept, Pipeline concept, Tracer, Error handling, API reference, and Contributor guide.
- Declare `@tde.io/plexis` as a `workspace:*` devDependency so the site documents the in-repo development version — **not** a pinned npm release. (No module imports it yet; see "Deferred" below.)
- Brand the site as documenting the development ("next") version via a persistent Starlight banner that links to the latest stable release on npm.
- Apply the Gruvbox color theme via the `starlight-theme-gruvbox` Starlight plugin (light + dark variants).
- Add a GitHub Actions workflow (`docs.yml`) that builds the Starlight site on every push.
- Configure Vercel for automatic preview deployments per branch and production deployment on `main`.

### Deferred to follow-up proposals (explicitly out of scope here)

- **Interactive graph visualizer / playground** — a React island (`@astrojs/react` + React Flow) that loads Plexis in the browser, runs preset examples against `domain.graph` / `pipeline.graph`, and renders the `GraphDescriptor`. This is the eventual consumer of the `@tde.io/plexis` workspace dependency.
- **Dual-version docs** — a "current" (stable, npm) home alongside the "next" (workspace) home with a version switcher. Deferred until the API actually diverges from the latest npm release; today the two would be byte-identical.

## Capabilities

### New Capabilities

- `docs-site`: The Astro Starlight documentation site — package setup, content structure, sidebar navigation, MDX pages, version banner, dark mode, and built-in search.
- `docs-ci`: GitHub Actions workflow and Vercel integration for building and deploying the docs site.

### Modified Capabilities

- `monorepo-workspace`: Root `package.json` gains `docs` and `docs:build` pass-through scripts for `@tde.io/docs`.
- `ci-workflows`: A new `docs.yml` workflow joins the existing build/test/publish/smoke-test suite.

## Impact

- **New files:** `apps/docs/` (Astro Starlight project), `.github/workflows/docs.yml`, `vercel.json` (only if monorepo root config proves necessary).
- **Modified files:** Root `package.json` (`scripts.docs`, `scripts.docs:build`), `pnpm-lock.yaml`.
- **Dependencies (scoped to `apps/docs/`):** `astro` (`^6.0.0`), `@astrojs/starlight` (`^0.38.0`), `starlight-theme-gruvbox` (`^2.0.0`), `typescript` (for the package's build/typecheck), and `@tde.io/plexis` (`workspace:*`). The Starlight/Astro lower bounds are dictated by `starlight-theme-gruvbox`'s peer dependencies. No React or React Flow in this proposal — those arrive with the deferred playground.
- **Public API:** None. The library is unchanged.
- **Build coupling:** None introduced. Because no docs module imports `@tde.io/plexis`, the docs build does not require the library to be built first; `pnpm docs:build` and `pnpm build` remain orthogonal.
- **Hosting:** Vercel project linked to the GitHub repository; `apps/docs/` set as the Root Directory in Vercel project settings (Vercel's pnpm-workspace detection installs from the repo root so `workspace:*` resolves).
- **Build output:** Fully static (`output: 'static'` in Astro config); no SSR.
