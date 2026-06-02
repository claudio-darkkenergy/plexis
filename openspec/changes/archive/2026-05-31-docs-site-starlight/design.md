## Context

Plexis has no documentation site. The library is published at `@tde.io/plexis` (latest: `1.0.3`, which already ships the composable `defineDomain`/`definePipeline` API), and the monorepo already reserves `apps/docs/` as a workspace slot for exactly this purpose. The pnpm workspace declares `apps/*` as a glob, so `apps/docs/package.json` will be automatically recognized as a workspace project once added.

This proposal ships a **hand-authored, static** documentation site. The guides and API reference are MDX prose — no module imports the library at build or runtime. The interactive graph visualizer that would consume the library's introspection API (`domain.graph` / `pipeline.graph`) is **deferred to a follow-up proposal**.

The site tracks the **in-development ("next") version** of the library by declaring `@tde.io/plexis` as a `workspace:*` dependency, keeping docs and code in lockstep within the monorepo.

Constraints:
- Fully static output — no SSR, no backend, no edge functions.
- `@tde.io/plexis` declared as `workspace:*` (the in-repo development version), not pinned to a published npm release.
- Co-located: docs CI runs alongside library CI; both live in the same repo and share one pnpm lockfile.

## Goals / Non-Goals

**Goals:**
- Ship a Starlight documentation site at `apps/docs/` covering Quick Start, Domain concept, Pipeline concept, Tracer, Error handling, API reference, and Contributor guide.
- Document the in-development version, branded clearly as "next" with a banner linking to the latest stable npm release.
- Deploy automatically to Vercel on every push; preview URLs per branch.
- Integrate into CI with a `docs.yml` workflow that builds the site and confirms no build errors on every push.

**Non-Goals (this proposal):**
- Interactive graph visualizer / playground — deferred to a follow-up proposal (see Decision 2).
- Dual-version documentation (stable "current" + "next" homes with a version switcher) — deferred until the API diverges from the latest npm release (see Decision 3).
- Any server-side rendering, API routes, or edge functions.
- Internationalisation.
- Docs-driven type generation (TypeDoc) — the API reference is hand-authored for now.
- Type-checking embedded code samples against the library — noted as a future enhancement (see Risks), not built here.

## Decisions

### Decision 1: Astro Starlight as the framework

Starlight (built on Astro) is chosen over Next.js and a custom Vite/React SPA.

Starlight provides out-of-the-box: sidebar navigation, pagefind full-text search, syntax highlighting (Shiki), dark mode, previous/next page navigation, mobile layout, and anchor link generation. These would all need to be built from scratch with a custom SPA. Next.js provides none of these for documentation either, while adding React Server Components complexity that brings no benefit for a static docs site.

Astro's islands architecture means every page in this proposal — all of which are static text — ships **zero JavaScript**. (When the deferred playground lands, React will be loaded only on that one page via an island, leaving every other page JS-free.)

**Alternatives considered:**
- *Next.js static export*: Full React everywhere, but requires building sidebar/MDX routing/search from scratch. No meaningful advantage over Starlight for this use case.
- *VitePress*: Vue-based. Would create a framework mismatch with the React-based graph visualizer planned as a follow-up.
- *Custom Vite + React SPA*: Maximum control, maximum build-from-scratch surface. Not justified when Starlight covers 95% of the docs needs.

### Decision 2: Graph visualizer / playground deferred to a follow-up

The interactive playground — a React island (`@astrojs/react`) that imports `@tde.io/plexis` in the browser, runs curated presets through `domain.graph` / `pipeline.graph`, and renders the `GraphDescriptor` with React Flow — is **not part of this proposal**. It will be proposed separately.

Rationale: it carries the only non-trivial complexity in the original scope (a React runtime, React Flow bundle, preset authoring, browser-side library execution) and is cleanly separable from the static docs. Shipping the guides and API reference first delivers adoption value immediately; the visualizer can follow without blocking it.

Consequence: this proposal adds **no** React-family dependencies (`@astrojs/react`, `react`, `react-dom`, `@xyflow/react`). They arrive with the follow-up.

### Decision 3: Track the workspace ("next") version; defer dual-version docs

The docs package declares `@tde.io/plexis` as `workspace:*`, so the site documents the in-repo development version rather than a pinned npm release.

Rationale:
- **Docs and code move together.** An API change and its documentation land in the same PR, validated against the same source. This eliminates the "docs lag the published version, requires a manual bump" maintenance risk.
- **No build coupling today.** Because no docs module actually imports the library in this proposal, `workspace:*` is zero-cost: the docs build does not depend on the library build. The dependency anchors *which version the docs describe* and stands ready for the deferred playground (its first real consumer).
- **Dual-version is premature.** A second "current" (stable npm) home alongside "next" would today contain byte-identical content (1.0.3 already ships the composable API), and Starlight has no first-class versioning — it would require the third-party `starlight-versions` plugin or two parallel content roots. The cost is real; the payoff is zero until the API diverges.

The follow-up trigger for dual-version is explicit: **when the workspace API diverges from the latest published npm release** such that documenting only "next" would mislead consumers of the stable package. Until then, a version banner (Decision 4) makes the "next" framing unambiguous.

**Alternatives considered:**
- *Pin to a published npm version*: Keeps the docs build fully independent, but freezes the docs against a release and reintroduces the manual-bump maintenance burden. Rejected in favor of workspace tracking.
- *Dual-version now*: Rejected as premature per the above.

### Decision 4: Version branding via a Starlight banner

The site declares a persistent Starlight `banner` indicating it documents the in-development ("next") version, with a link to the latest stable release on npm. This makes the workspace-tracking decision visible to every visitor and sets expectations without the machinery of full version switching.

### Decision 4a: Gruvbox color theme via `starlight-theme-gruvbox`

The site applies the Gruvbox palette using the community plugin `starlight-theme-gruvbox` (added to the Starlight `plugins` array as `gruvbox()`), rather than hand-rolling CSS custom-property overrides.

Rationale: the plugin ships both light and dark Gruvbox variants and wires them into Starlight's existing theme-toggle and CSS-variable system, so the built-in dark-mode toggle keeps working unchanged. It is a thin, theme-only dependency — no runtime JS shipped to pages beyond what Starlight already emits.

Constraint introduced: `starlight-theme-gruvbox@^2.0.0` declares peer dependencies `@astrojs/starlight ^0.38.0` and `astro ^6.0.0`, which set the minimum versions for the scaffold (task 1.x). If a future Starlight/Astro major outpaces the plugin's peer range, the theme is the gating dependency for upgrades — an accepted trade-off for a cosmetic concern.

**Alternatives considered:**
- *Custom CSS variable overrides*: full control, but re-implements what the plugin already provides and must be maintained against Starlight theme-token changes. Not justified for a standard palette.
- *Default Starlight theme*: zero dependencies, but the user explicitly wants Gruvbox.

### Decision 5: Vercel for hosting, `docs.yml` for CI

Vercel is chosen for hosting because it has zero-config Astro support, automatic HTTPS, preview deployments per branch (essential for reviewing docs PRs), and a generous free tier.

The Vercel project is configured with **Root Directory: `apps/docs`** in project settings. Vercel detects the pnpm workspace and runs `pnpm install` from the repo root (so the `workspace:*` dependency resolves), then builds within `apps/docs/`. No `vercel.json` is needed at the repo root unless this detection proves insufficient.

A separate `docs.yml` GitHub Actions workflow builds the site on every push to validate there are no broken MDX imports or build errors. Actual deployment is handled by the Vercel GitHub integration (not by GitHub Actions), so `docs.yml` is a build-validation workflow only, not a deploy workflow.

**Alternative considered:** GitHub Pages — no preview deployments per branch, no automatic HTTPS for custom domains without extra config. Ruled out.

### Decision 6: Root `package.json` gains `docs` and `docs:build` pass-through scripts

The root `package.json` adds `"docs": "pnpm --filter @tde.io/docs run dev"` and `"docs:build": "pnpm --filter @tde.io/docs run build"` to the `scripts` block. A contributor can run `pnpm docs` from the repo root to start the local dev server without knowing the workspace filter syntax.

### Decision 7: Content structure

```
apps/docs/src/content/docs/
  index.mdx                    ← landing / quick start
  guides/
    domain.mdx                 ← Domain concept + API
    pipeline.mdx               ← Pipeline concept + API
    tracer.mdx                 ← Tracer API
    error-handling.mdx         ← PlexisError + codes
  reference/
    api.mdx                    ← Full API reference
  contributing/
    index.mdx                  ← Contributor guide
```

There is no `playground/` directory in this proposal — it arrives with the deferred graph visualizer.

## Risks / Trade-offs

- **[Trade-off] `@tde.io/plexis` is declared but not yet imported** → The `workspace:*` dependency has no consumer until the playground follow-up lands. Accepted intentionally: it anchors the documented version and is harmless under pnpm. Documented as such so it doesn't read as an oversight.
- **[Risk] Docs describe an unreleased API surface** → Mitigated by the "next" version banner (Decision 4) linking to the stable npm release. The follow-up trigger for dual-version (Decision 3) is defined for the day this becomes a genuine divergence.
- **[Risk] Vercel root-directory + workspace resolution** → Vercel must install from the monorepo root for `workspace:*` to resolve; its pnpm-workspace detection handles this when Root Directory is `apps/docs`. If detection fails, a root `vercel.json` or the "Include files outside root directory" setting is the fallback. Documented in the contributor guide.
- **[Risk] `docs.yml` CI passes but Vercel deploy fails** → CI only validates the build; Vercel deploy is a separate signal. Both must be green for a docs PR to be considered merged-safe. Document this in CONTRIBUTING.
- **[Trade-off] Hand-authored API reference instead of TypeDoc** → TypeDoc integration adds complexity and tight coupling between the library's TSDoc comments and the docs build. Deferred until the API surface stabilises. Accepted.
- **[Future] Type-checked code samples** → Once a consumer for the workspace dependency exists, documentation code samples could be single-sourced from real `.ts` files (imported via `?raw`) and type-checked against the workspace types in CI, preventing silent doc rot. Out of scope here; would introduce a library→docs build ordering dependency.
