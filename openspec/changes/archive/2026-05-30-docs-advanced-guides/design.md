## Context

The docs site (`apps/docs/`) is a Starlight/Astro project established by the still-open `docs-site-starlight` change. Its existing guides (`guides/domain.mdx`, `guides/pipeline.mdx`, `guides/tracer.mdx`, `guides/error-handling.mdx`) are concept introductions. The sidebar is defined explicitly in `apps/docs/astro.config.mjs` with three groups: Guides, Reference, Contributing.

This change adds an **Advanced** section of practical, runnable guides. It is documentation-only — no library code changes. The relevant public API confirmed in `packages/plexis/src/types.ts`:

- `Domain`: `state`, `context`, `current`, `follow(event, payload?)`, `followFrom(...)`, `can(...)`, `subscribe(listener: (snapshot: DomainSnapshot) => void): () => void`, `snapshot(): DomainSnapshot`, `restore(...)`, `history()`.
- `DomainSnapshot`: `{ state, context, historyLength }`.
- `Pipeline`: `run(context, input?): Promise<PipelineRunResult>`.
- `PipelineRunResult`: `{ status: 'completed' | 'stopped' | 'error', finalNode, context, ... }`.
- `EdgeDef` supports `guard`, `action`, and an attached `pipeline`.

Package import specifier used by existing guides: `@tde.io/plexis`.

## Goals / Non-Goals

**Goals:**
- Show Plexis applied to four real-world scenarios with complete, runnable code.
- Each guide is fully self-contained — no shared types or state across guides.
- Demonstrate the domain + pipeline composition pattern (multi-step form) and pipeline-as-handler-chain pattern (API route).
- Demonstrate the `subscribe`/`snapshot` reactive binding pattern for React and Vue.
- Add an **Advanced** sidebar group ordered between **Guides** and **Reference**.

**Non-Goals:**
- No changes to the Plexis library or its public API.
- No new docs-site dependencies (no Hono/React/Vue added to `apps/docs/package.json`); code samples are illustrative and authored in fenced blocks, not compiled by the docs build.
- Not teaching React/Vue/HTTP fundamentals — only the binding seam to Plexis.
- No automated rendering/type-checking of in-MDX samples in this change.

## Decisions

**Decision: New `docs-advanced-guides` capability instead of a `docs-site` delta.**
The `docs-site` spec is not yet promoted to `openspec/specs/` — it lives only inside the unarchived `docs-site-starlight` change. Writing a MODIFIED/ADDED delta against a non-promoted base would be fragile at archive time. A standalone new capability keeps this change self-contained.
_Alternative considered:_ delta against `docs-site`. Rejected until that capability is archived.

**Decision: API-route guide uses the Node.js built-in `http` module as the runtime.**
Zero extra dependencies, runs anywhere, and mirrors the library's zero-dependency ethos. The pipeline (`validate → service → persist → respond`) is the handler chain; forks route to an `error-response` node on validation/service failure. A small `request` domain tracks `pending → processing → complete | failed`.
_Alternative considered:_ Hono. Rejected as the primary to avoid implying a dependency, though the guide notes the same pipeline plugs into any framework handler.

**Decision: Multi-step form models steps as domain states; a single shared validation pipeline gates transitions.**
The domain (`shipping → payment → review → confirmed`) is the source of truth for which step is visible. Each forward edge attaches a validation `pipeline` (or guards on validated context) so an invalid step blocks the transition (`status: 'blocked'`). This shows end-to-end domain + pipeline composition.

**Decision: React binding uses `useSyncExternalStore`; Vue binding uses a `ref` + `subscribe`.**
`useSyncExternalStore(subscribe, getSnapshot)` maps exactly onto `domain.subscribe` (returns an unsubscribe fn) and `domain.snapshot()`. Vue wraps `domain.snapshot()` in a `ref` and updates it inside the `subscribe` callback, returning the unsubscribe in `onUnmounted`. Both focus on the subscribe/snapshot seam, not framework internals.
_Alternative considered (React):_ `useReducer`. Mentioned as an alternative in prose, but `useSyncExternalStore` is the correct primitive for an external mutable store and is the shown implementation.

**Decision: All code fences are `typescript` or `bash` only.**
Matches the existing site-wide convention (long-form language hints). JSX/Vue SFC samples are authored inside `typescript` fences.

**Decision: Files live under `guides/advanced/` with their own sidebar group.**
Slugs: `guides/advanced/api-route`, `guides/advanced/multi-step-form`, `guides/advanced/react`, `guides/advanced/vue`. The sidebar `Advanced` group is inserted between the `Guides` and `Reference` group objects in the `sidebar` array.

## Risks / Trade-offs

- **In-MDX samples can drift from the real API** → Author every sample against the confirmed signatures in `types.ts` (`subscribe`/`snapshot` shape, `follow` result `status` values, `PipelineRunResult.status`). Reviewer cross-checks against `types.ts`.
- **Samples are not compiled by the docs build, so type errors go uncaught** → Keep samples minimal and copy patterns from existing verified guides; out of scope to wire a type-check harness here.
- **Framework version churn (React/Vue APIs)** → Use stable, long-lived primitives (`useSyncExternalStore`, `ref`/`onMounted`/`onUnmounted`) that are unlikely to change.
- **Sidebar ordering regressions** → Spec pins the Advanced group strictly between Guides and Reference; verified by reading `astro.config.mjs`.
