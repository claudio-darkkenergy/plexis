## Why

The current docs guides (Domain, Pipeline, Tracer, Error Handling) are beginner-level concept introductions. They explain the API surface but never show Plexis solving a real problem end-to-end. Developers evaluating the library have no runnable, real-world examples that demonstrate how domains and pipelines compose in an actual application.

## What Changes

- Add a new **Advanced** sidebar section to the docs site, positioned between **Guides** and **Reference**.
- Add four self-contained advanced guides under `apps/docs/src/content/docs/guides/advanced/`:
  - `api-route.mdx` — a pipeline as the handler chain for one HTTP endpoint (validate → business logic → DB write → response), with forks modeling success/error paths and a domain tracking request state (`pending → processing → complete/failed`). Framework-agnostic, using Node.js `http` or Hono as the runtime.
  - `multi-step-form.mdx` — a checkout-style form where a domain drives which step is visible (`shipping → payment → review → confirmed`) and a pipeline validates each step's data before allowing the transition. Demonstrates the core domain + pipeline composition pattern end-to-end.
  - `react.mdx` — a minimal React binding using `useSyncExternalStore` over a Plexis domain's `subscribe`/`snapshot`.
  - `vue.mdx` — a minimal Vue binding using a `ref` plus `subscribe`.
- Register the four pages in the Starlight sidebar in `astro.config.mjs`.
- Each guide is fully self-contained (no shared state between guides), includes one complete runnable code example, and uses only `typescript` and `bash` code fences (long-form language hints).

## Capabilities

### New Capabilities
- `docs-advanced-guides`: Practical, runnable advanced documentation guides that show Plexis applied to real-world scenarios (HTTP routing, multi-step forms, and React/Vue framework bindings) and the sidebar wiring that exposes them.

### Modified Capabilities
<!-- The base docs-site capability is not yet a promoted spec (it lives in the still-open docs-site-starlight change), so this change introduces a separate new capability rather than a delta. -->

## Impact

- **Content**: New files under `apps/docs/src/content/docs/guides/advanced/` (`api-route.mdx`, `multi-step-form.mdx`, `react.mdx`, `vue.mdx`).
- **Config**: `apps/docs/astro.config.mjs` sidebar gains an **Advanced** group between **Guides** and **Reference**.
- **No library changes**: documentation only; no changes to `packages/plexis/`. Guides reference the public API surface (`defineDomain`, `definePipeline`, `state`, `edge`, `node`, `fork`, `terminal`, `subscribe`, `snapshot`) but the docs build does not import the library.
