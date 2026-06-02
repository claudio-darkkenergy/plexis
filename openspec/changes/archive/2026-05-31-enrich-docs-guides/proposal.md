## Why

The docs have exhaustive reference pages but a thin learning layer: four primitive guides (Domain, Pipeline, Tracer, Error Handling) and four "Advanced" recipes. The high-value material developers actually search for — how to compose pipelines, how custom merge behaves, fork ordering edge cases, type-safe domains, testing, persistence — has no home. Today's two-bucket split ("Guides" = a primitive, "Advanced" = a recipe) leaves a gap in the middle for framework-agnostic, multi-primitive techniques, and conflates framework-specific recipes (React, Vue) with framework-neutral worked examples (the form, the API route).

## What Changes

- Introduce a **five-bucket information architecture** (plus the existing Reference): `Concepts/`, `Guides/`, `Patterns/`, `Advanced/`, `Integrations/`.
  - **Concepts** (new): cross-cutting mental models — the "why," no how-to.
  - **Guides** (unchanged): the per-primitive walkthroughs.
  - **Patterns** (new): focused, framework-agnostic single-technique pages.
  - **Advanced** (reframed): heavyweight, multi-primitive worked examples whose hero is a *scenario*.
  - **Integrations** (new): recipes bound to a *named* third-party target (framework or provider).
- Reorganize the Starlight sidebar to render the five buckets in order: Concepts → Guides → Patterns → Advanced → Integrations → Reference.
- **Move** the React and Vue guides out of `guides/advanced/` into a new `guides/integrations/` group. The Multi-step Form and API Route guides **stay** in Advanced (they are framework-neutral scenarios).
- Add **18 new example-driven pages**:
  - **Concepts (4):** the two-layer model (Domain vs Pipeline); context, immutability & patches; execution & lifecycle order; definition lifecycle & builder scope.
  - **Patterns (11):** custom merge; composing pipelines; forks in depth; guards vs forks; designing the state graph; snapshots & restore (mechanics); type-safe domains; testing domains & pipelines; graph introspection & path queries; reactive subscriptions; reusable definition factories.
  - **Advanced (3):** saga / compensation & retry; persist & rehydrate a domain (statelessness/serverless is its motivating frame); build a state-graph visualizer.
- Every new page leads with a runnable example using long-form code-fence languages (`typescript`, `bash`), consistent with the existing docs convention.

## Capabilities

### New Capabilities
- `docs-concepts-guides`: The Concepts bucket — four mental-model pages and a sidebar group positioned first, above Guides.
- `docs-patterns-guides`: The Patterns bucket — eleven focused single-technique pages and a sidebar group positioned between Guides and Advanced.
- `docs-integrations-guides`: The Integrations bucket — the React and Vue guides regrouped under a new sidebar group positioned after Advanced, scoped to named-target recipes.

### Modified Capabilities
- `docs-site`: The sidebar-navigation and content-structure requirements change to reflect the five-bucket IA (Concepts, Guides, Patterns, Advanced, Integrations, Reference) and their ordering.
- `docs-advanced-guides`: The React and Vue requirements are removed (those guides move to Integrations); the Advanced bucket gains three new worked-example pages; the sidebar-ordering requirement updates to reflect Advanced's new neighbors (Patterns before, Integrations after).

## Impact

- **Content:** 18 new `.mdx` pages under `apps/docs/src/content/docs/` across `concepts/`, `patterns/`, and `guides/advanced/`; React/Vue files relocated from `guides/advanced/` to `guides/integrations/`.
- **Navigation:** `apps/docs/astro.config.mjs` sidebar reorganized into five groups.
- **Specs:** new `docs-concepts-guides`, `docs-patterns-guides`, `docs-integrations-guides`; modified `docs-site`, `docs-advanced-guides`.
- **No library/runtime code changes.** Examples must stay accurate to the composable API in `packages/plexis/src/types.ts` and `.specs/plexis-composable-spec.md`.
- **Skill config:** folder-structure change under `apps/docs/` — `.claude/skills/skill-config.md` updated per the project's Skill Config Rule.
