## Context

The docs site (`apps/docs/`, Astro + Starlight) currently has three navigable buckets — `Guides/`, `Advanced/`, `Reference/` — plus Contributing. The reference is exhaustive (9 pages); the learning layer is thin. The implicit IA rule has been "Guides = a primitive, Advanced = a recipe," which has two problems: there is no home for framework-agnostic *techniques* (composition, custom merge, fork ordering, testing), and the Advanced bucket mixes framework-neutral worked examples (Multi-step Form, API Route) with framework-specific ones (React, Vue).

This change was scoped in an explore session. The IA and the full 18-page catalog are settled; this design records the boundary rules that decide which bucket a page lands in, so authoring stays consistent.

## Goals / Non-Goals

**Goals:**
- Establish a five-bucket IA (Concepts, Guides, Patterns, Advanced, Integrations) with crisp, testable membership rules.
- Add 18 example-first pages covering the gaps the reference cannot carry.
- Relocate React/Vue into Integrations without breaking the two framework-neutral Advanced examples.
- Keep every example accurate to the composable API and consistent with existing docs conventions (long-form code fences, use-case framing, defer signatures to Reference).

**Non-Goals:**
- No changes to the library, runtime, or `packages/plexis/src/`.
- No homepage/`index.mdx` rewrite (acknowledged as weak, deferred to a later change).
- No new framework/provider Integrations beyond regrouping the existing React and Vue pages.
- No Reference restructuring.

## Decisions

### Decision 1: Five buckets, split by the *shape* of the page, not its topic

The buckets are distinguished by what a page's "hero" is, which makes membership a decision rather than a judgment call:

| Bucket | Hero | Test | Length |
|---|---|---|---|
| Concepts | a mental model | "explains *why*, no how-to" | short |
| Guides | a primitive | "one core type/function" | medium |
| Patterns | a technique | named after a *thing you do* (merging, forking, testing) | short, one move |
| Advanced | a scenario | named after a *thing you build* (a wizard, a saga, a visualizer) | heavyweight, multi-primitive |
| Integrations | a named target | "Plexis on `<thing with a logo>`" — framework or provider | medium |

**Why over alternatives:** A two-bucket scheme (keep "Advanced" broad) was rejected because it forces unlike pages together and gives techniques no home. Splitting by topic (e.g., "all pipeline stuff here") was rejected because pages are inherently multi-primitive. Splitting by *shape* is the only rule that classifies every candidate unambiguously — verified by running all 18 pages plus the 4 existing Advanced pages through it.

### Decision 2: The "named target" rule keeps Integrations honest

Integrations requires a *named* third-party target (React, Vue, Cloudflare Workers). A runtime *property* — e.g., statelessness/"serverless" — is not a target; it is a consequence of the environment and belongs to whichever Pattern/Advanced page teaches the technique. Consequence: generic "Serverless" does **not** get a page; the statelessness story becomes the motivating frame of the Advanced "Persist & rehydrate a domain" page. The API Route page stays in Advanced because it deliberately uses bare `node:http` and is framework-neutral.

### Decision 3: Split conceptual halves up, how-to halves down

Three topics have both a conceptual and a mechanical half. They are split across buckets so no two pages overlap:
- **Merge** → the immutability/patch *model* lives in Concepts ("Context, immutability & patches"); the custom-merge *how-to* lives in Patterns ("Custom merge").
- **Snapshots** → mechanics (what serializes, version skew) in Patterns; the full DB round-trip in Advanced ("Persist & rehydrate").
- **Graph** → the introspection API + path queries in Patterns; the GraphDescriptor → Mermaid visualizer demo in Advanced.

"Designing the state graph" (#6) lands in **Patterns**, not Concepts: its center of gravity is hands-on mechanics (`initial`, terminals, unreachable states, what strict mode rejects), and the conceptual half is already carried by the Concepts two-layer page and the Domain guide.

### Decision 4: Sidebar order encodes a learning path

`astro.config.mjs` renders groups in reading order: **Concepts → Guides → Patterns → Advanced → Integrations → Reference → Contributing**. This is "understand → learn the primitives → combine them → see them built → wire them up → look up signatures." Each spec asserts its group's *relative* position rather than a hard index, so reordering neighbors does not cascade failures.

### Decision 5: Spec decomposition by bucket

Each new bucket is its own capability (`docs-concepts-guides`, `docs-patterns-guides`, `docs-integrations-guides`) so its page set and sidebar group are specified together. The two existing specs are amended: `docs-site` (sidebar + content-structure requirements widen to five buckets) and `docs-advanced-guides` (React/Vue requirements removed, three new Advanced pages added, sidebar-ordering requirement updated for new neighbors).

## Risks / Trade-offs

- **18 pages is a large content surface; quality could drift.** → Implement scaffolding first (buckets, sidebar, frontmatter stubs), then author content batched by bucket so each batch stays reviewable. Tasks are ordered this way.
- **Examples drift from the real API** (no runtime exists to compile them against the published types yet). → Every example must be written against `packages/plexis/src/types.ts` and `.specs/plexis-composable-spec.md`; reuse the patterns already proven in the existing four guides.
- **Moving React/Vue breaks inbound links** to `guides/advanced/react` and `guides/advanced/vue`. → Acceptable now (site is pre-release, no external deep links to honor); if needed later, add Starlight redirects. Noted, not mitigated in this change.
- **Patterns risks becoming a dumping ground** (11 pages). → The "one move, named after a verb" test gates new additions; pages that grow into scenarios graduate to Advanced.
- **Bucket boundary disputes during authoring.** → The Decision 1 table is the tie-breaker; record any reclassification in the relevant spec rather than ad hoc.

## Migration Plan

1. Scaffold: create `concepts/` and `patterns/` content dirs and `guides/integrations/`; move `react.mdx` and `vue.mdx` from `guides/advanced/` to `guides/integrations/`; reorganize the `astro.config.mjs` sidebar into the five groups with stub pages.
2. Author Concepts (4) → Patterns (11) → Advanced additions (3), each batch verified to build.
3. Update `.claude/skills/skill-config.md` for the new folder structure (Skill Config Rule).
4. Rollback is trivial: revert the branch; no data, runtime, or published-package surface is touched.

## Open Questions

- None blocking. Homepage rework and any provider-specific Integration (e.g., Cloudflare Workers) are explicitly deferred to future changes.
