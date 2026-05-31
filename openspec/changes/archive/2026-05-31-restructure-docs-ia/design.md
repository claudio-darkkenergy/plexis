## Context

The docs site (`apps/docs/`, Astro + Starlight) currently presents the entire public surface of `@tde.io/plexis` in a single reference page, `reference/api.mdx` (879 lines, eight H2 sections). The page documents signatures, parameter/return tables, and field shapes well — recent work (archived `enrich-api-reference`) made it faithful and scannable — but it carries **no usage examples**, so a reader must leave the reference to learn how a symbol is invoked. The guides, meanwhile, re-explain those same signatures inline, duplicating reference content instead of teaching use cases.

The `docs-site` capability spec already mandates: a complete content structure, an explicit sidebar, full-surface coverage, and an input/output-separation + name-emphasis convention. This change re-shapes the information architecture without altering any library code.

## Goals / Non-Goals

**Goals:**
- Make each reference entry self-sufficient by colocating a short, focused example with its signature (the MDN `WeakMap` pattern).
- Split the monolithic reference into one page per existing H2 section, navigable from a Reference sidebar group with an overview index.
- Preserve, unchanged, the existing input/output separation, optionality/defaults, and name-emphasis conventions on every new page.
- Reframe the Guides IA as use-case progressions (common → advanced → edge case) so guides stop duplicating the reference.

**Non-Goals:**
- Authoring net-new guide content (e.g. composition examples). That is a deliberate follow-up `/opsx:explore`, informed by gaps the reorganized reference exposes.
- Any change to `packages/plexis` runtime, types, or build.
- Redesigning Starlight theming, components, or deployment.

## Decisions

**Split granularity = by existing H2 section, not per symbol.** Eight pages map 1:1 to the current sections: `definition-functions`, `registration-helpers`, `handler-inputs`, `tracer`, `domain` (Domain Instance), `pipeline` (Pipeline Instance), `errors`, `types` (Key Types). Per-symbol pages (true MDN granularity) would create ~40 thin pages and a noisy sidebar; per-section keeps related symbols together while making each page short enough to read top-to-bottom. The current H2s become the page `title`; current H3s (symbols) stay as the page's H2s.

**URL scheme: `reference/<section>`, with the old `reference/api` becoming the index.** The Reference overview page lives at `reference/api` (or `reference/index`) and links each section, preserving the existing slug as the section's landing spot and avoiding a broken inbound link. Each section page gets a stable slug used by the sidebar.

**Examples are inline per symbol, short and runnable-shaped.** Each symbol's example is a single fenced `typescript` block (honoring the existing long-form-language-hint requirement) placed after the Parameters/Return tables, scoped to *that* symbol — not a full app. Where a symbol is only meaningful in context (e.g. `fork` inside a `node`), the snippet shows the minimal enclosing scope. This is additive content; it does not change the input/output-separation convention.

**Sidebar: Reference becomes a group of explicit slugs.** Replace the single `{ label: 'API', slug: 'reference/api' }` entry with an ordered `items` list mirroring the section order above, so the order is intentional rather than alphabetical.

**Guides reposition is structural, not new prose.** This change adjusts how guides are framed/ordered (and may relocate the existing four advanced guides under the use-case framing) but does not write new guide pages — content authoring is the follow-up.

## Risks / Trade-offs

- **Broken internal/external links to `reference/api` anchors** → Keep `reference/api` as the live index page and verify no remaining `reference/api#...` anchor links exist in other pages; update any that do to the new section slug.
- **Spec faithfulness regression during the split** → The full-surface coverage requirement is restated to apply across the set of pages; a scenario asserts every previously-documented symbol still appears somewhere, guarding against drop during the copy/split.
- **Example drift from real types** → Examples mirror `packages/plexis/src/types.ts`; keep them minimal so they stay correct, and lean on the existing faithfulness requirement.
- **Scope creep into guide authoring** → Explicitly fenced as a non-goal; tasks stop at IA + examples.

## Migration Plan

1. Create the per-section reference pages by lifting each H2 block out of `api.mdx` (H3→H2 demotion), adding inline examples.
2. Convert `api.mdx` into the Reference index linking the new pages.
3. Update `astro.config.mjs` sidebar Reference group.
4. Verify the build (`pnpm --filter @tde.io/docs build`) and check no dangling `reference/api#` anchors remain.
Rollback is a content revert — no data or runtime state involved.

## Open Questions

- Whether to relocate the four existing "Advanced" guides under a single use-case-framed Guides group now, or defer that to the guide-authoring follow-up. Default: defer relocation; only reframe positioning text in this change.
